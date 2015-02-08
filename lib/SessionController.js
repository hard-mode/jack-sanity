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

				portDescriptors = ports;
				// connections = connections;

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
		}

		// Start jack when we start:
		service.getInterface(sanity.JackObjectPath, sanity.JackControlInterface, function(error, iface) {
			iface.StartServer(function() {
				connect(function() {
					var messages = {
						error: function() {
							process.send({ error: Array.prototype.slice.call(arguments) });
						},
						warn: function() {
							process.send({ warn: Array.prototype.slice.call(arguments) });
						},
						log: function() {
							process.send({ log: Array.prototype.slice.call(arguments) });
						},
						info: function() {
							process.send({ info: Array.prototype.slice.call(arguments) });
						}
					};

					var sandbox = {
						console:		messages,
						error:			messages.error,
						warn:			messages.warn,
						log:			messages.log,
						info:			messages.info,
						session:		session,
						setTimeout:		setTimeout,
						clearTimeout:	clearTimeout,
						setInterval:	setInterval,
						clearInterval:	clearInterval,
						setImmediate:	setImmediate,
						clearImmediate:	clearImmediate
					};

					vm.runInNewContext(fs.readFileSync(filename), sandbox, filename);

					update(function() {
						bind();
						self.emit('open');
					});
				});
			});
		});
	};

	self.close = function() {
		self.emit('close');

		for (var index in processes) {
			var child = processes[index];

			child.close();
		}
	};

	self.createClient = function(clientName) {
		var client = sanity.createClientController(self, clientName);

		return client.getInstance();
	};

	self.createProcess = function(command, args) {
		var process = sanity.createProcessController(self, command, args);

		processes.push(process);

		return process.getInstance();
	};

	self.createPort = function(clientName, portName) {
		var port = sanity.createPortController(self, clientName, portName);

		return port.getInstance();
	};

	self.combine = function(children) {
		var parent = {};

		EventEmitter.call(parent);
		parent.__proto__ = EventEmitter.prototype;

		for (var index in children) {
			var child = children[index];

			// Copy events:
			child.onAny(function() {
				var args = Array.prototype.slice.call(arguments);

				args.unshift(this.event);

				parent.emit.apply(parent, args);
			});

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

		for (var inKey in inPorts) {
			var inPort = inPorts[inKey];

			for (var outKey in outPorts) {
				var outPort = outPorts[outKey];

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