var sanity = require(__dirname),
	EventEmitter = require('eventemitter2').EventEmitter2,
	path = require('path'),
	fs = require('fs'),
	vm = require('vm');

var SessionController = function(service, logger) {
	var self = this,
		session = sanity.createSession(self),
		processes = [],
		portDescriptors = [];

	// Enable event API:
	EventEmitter.call(this);
	this.__proto__ = EventEmitter.prototype;

	self.open = function(filename) {
		var connect = function(callback) {
			service.getInterface(sanity.JackObjectPath, sanity.JackPatchbayInterface, function(error, iface) {
				self.dbus = iface;

				if (typeof callback === 'function') {
					callback();
				}
			});
		};

		var update = function(callback) {
			self.dbus.GetGraph('0', function(error, graph, data, connections) {
				var ports = {};

				for (var clientIndex in data) {
					var clientData = data[clientIndex],
						clientName = clientData[1];

					ports[clientName] = {};

					for (var portIndex in clientData[2]) {
						var portData = clientData[2][portIndex],
							portName = portData[1],
							portDescriptor = sanity.createPortDescriptor(clientName, portName, portData);

						ports[clientName][portName] = portDescriptor;
					}
				}

				for (var connectionIndex in connections) {
					var connection = connections[connectionIndex],
						from = ports[connection[1]][connection[3]],
						to = ports[connection[1]][connection[3]];

					if (
						!!ports[connection[1]]
						&& !!ports[connection[1]][connection[3]]
						&& !!ports[connection[5]]
						&& !!ports[connection[5]][connection[7]]
					) {
						var from = ports[connection[1]][connection[3]],
							to = ports[connection[5]][connection[7]];

						from.addConnection(to);
						to.addConnection(from);
					}
				}

				portDescriptors = ports;

				if (typeof callback === 'function') {
					callback()
				}
			});
		};

		var bind = function() {
			// Forward messages to the session instance:
			self.on('open', function() {
				session.emit('open');
			});

			self.on('close', function() {
				session.emit('close');
			});

			// Listen to dbus and capture events:
			self.dbus.on('ClientAppeared', function() {
				var clientName = arguments['2'];

				process.send({ info: ['Client `' + clientName + '` came online'] });

				update(function() {
					self.emit('clientOnline', clientName);
				});
			});

			self.dbus.on('ClientDisappeared', function() {
				var clientName = arguments['2'];

				process.send({ info: ['Client `' + clientName + '` went offline'] });

				update(function() {
					self.emit('clientOffline', clientName);
				});
			});

			self.dbus.on('PortAppeared', function() {
				var clientName = arguments['2'],
					portName = arguments['4'];

				process.send({ info: ['Port `' + clientName + ':' + portName + '` came online'] });

				update(function() {
					self.emit('portOnline', clientName, portName);
				});
			});

			self.dbus.on('PortDisappeared', function() {
				var clientName = arguments['2'],
					portName = arguments['4'];

				process.send({ info: ['Port `' + clientName + ':' + portName + '` went offline'] });

				update(function() {
					self.emit('portOffline', clientName, portName);
				});
			});

			self.dbus.on('PortsConnected', function() {
				var fromClientName = arguments['2'],
					fromPortName = arguments['4'],
					toClientName = arguments['6'],
					toPortName = arguments['8'];

				process.send({ info: ['Port `' + fromClientName + ':' + fromPortName + '` connected to `' + toClientName + ':' + toPortName + '`'] });

				update(function() {
					self.emit('portConnected', fromClientName, fromPortName, toClientName, toPortName);
				});
			});

			self.dbus.on('PortsDisconnected', function() {
				var fromClientName = arguments['2'],
					fromPortName = arguments['4'],
					toClientName = arguments['6'],
					toPortName = arguments['8'];

				process.send({ info: ['Port `' + fromClientName + ':' + fromPortName + '` disconnected from `' + toClientName + ':' + toPortName + '`'] });

				update(function() {
					self.emit('portDisconnected', fromClientName, fromPortName, toClientName, toPortName);
				});
			});

			self.dbus.on('GraphChanged', function() {
				self.emit('cacheInvalid');
			});
		}

		// Start jack when we start:
		service.getInterface(sanity.JackObjectPath, sanity.JackControlInterface, function(error, iface) {
			iface.StartServer(function() {
				connect(function() {
					var sandbox = sanity.createSandbox({
						error:		function() {
							process.send({ error: Array.prototype.slice.call(arguments) });
						},
						warn:		function() {
							process.send({ warn: Array.prototype.slice.call(arguments) });
						},
						log:		function() {
							process.send({ log: Array.prototype.slice.call(arguments) });
						},
						info:		function() {
							process.send({ info: Array.prototype.slice.call(arguments) });
						},
						session:	session
					});

					sandbox.require(filename);

					update(function() {
						bind();
						self.emit('open');
					});
				});
			});
		});
	};

	self.close = function() {
		self.once('close', function() {
		});

		self.emit('close');

		for (var index in processes) {
			var child = processes[index];

			child.close();
		}
	};

	self.createClient = function(clientName, portName) {
		var client = sanity.createClientController(self, clientName, portName);

		return client.getInstance();
	};

	self.createContainer = function(definition) {
		var container = sanity.createContainerController(self, definition);

		return container.getInstance();
	};

	self.createProcess = function(command, args) {
		var process = sanity.createProcessController(self, command, args);

		processes.push(process);

		return process.getInstance();
	};

	self.combine = function(children) {
		var parent = {};

		EventEmitter.call(parent);
		parent.__proto__ = EventEmitter.prototype;

		for (var index in children) {
			var child = children[index];

			// Copy events:
			if (!!child.onAny) {
				child.onAny(function() {
					var args = Array.prototype.slice.call(arguments);

					args.unshift(this.event);

					parent.emit.apply(parent, args);
				});
			}

			// Copy methods:
			for (var methodIndex in child) {
				var method = child[methodIndex];

				if (typeof method !== 'function') continue;
				if (typeof parent[methodIndex] !== 'undefined') continue;

				parent[methodIndex] = method;
			}
		}

		return parent;
	};

	self.getInstance = function() {
		return session;
	};

	self.connect = function(output, input) {
		return self.matchPortDescriptors(output, input, function(output, input) {
			self.dbus.ConnectPortsByName(
				output.clientName, output.portName,
				input.clientName, input.portName
			);
		});
	};

	self.disconnect = function(output, input) {
		return self.matchPortDescriptors(output, input, function(output, input) {
			self.dbus.DisconnectPortsByName(
				output.clientName, output.portName,
				input.clientName, input.portName
			);
		});
	};

	self.canConnect = function(output, input) {
		var result = false;

		self.matchPortDescriptors(output, input, function() {
			result = true;

			return false;
		});

		return result;
	};

	self.isConnected = function(output, input) {
		var outPorts = output.findPortDescriptors(),
			inPorts;

		// Just checking that it has connections:
		if (!input) {
			return outPorts.length > 0;
		}

		inPorts = input.findPortDescriptors();

		// Checking that it has a specific connection:
		for (var inIndex in inPorts) {
			var inPort = inPorts[inIndex];

			for (var outIndex in outPorts) {
				var outPort = outPorts[outIndex];

				if (outPort.hasConnection(inPort)) {
					return true;
				}
			}
		}

		return false;
	};

	self.findPortDescriptors = function(clientName, portName) {
		var ports = [];

		for (var clientIndex in portDescriptors) {
			var clientData = portDescriptors[clientIndex];

			if (
				(
					Object.prototype.toString.call(clientName) === '[object RegExp]'
					&& clientName.test(clientIndex)
				)
				|| (
					clientName === clientIndex
				)
			) {
				for (var portIndex in clientData) {
					var portData = clientData[portIndex];

					if (
						(
							(typeof portName) === 'undefined'
						)
						|| (
							Object.prototype.toString.call(portName) === '[object RegExp]'
							&& portName.test(portIndex)
						)
						|| (
							portName === portIndex
						)
					) {
						ports.push(portData);
					}
				}
			}
		}

		return ports;
	};

	self.matchPortDescriptors = function(output, input, callback) {
		var outPorts = output.findPortDescriptors(),
			inPorts = input.findPortDescriptors(),
			result = false,
			loop = null;

		for (var inIndex in inPorts) {
			var inPort = inPorts[inIndex];

			for (var outIndex in outPorts) {
				var outPort = outPorts[outIndex];

				if (
					inPort.isInput
					&& outPort.isOutput
					&& inPort.channel === outPort.channel
					&& inPort.signal === outPort.signal
				) {
					loop = callback(outPort, inPort);
					result = true;
				}

				if (false === loop) break;
			}

			if (false === loop) break;
		}

		return result;
	};
};

module.exports.SessionController = SessionController;
module.exports.createSessionController = function(service) {
	return new SessionController(service);
};