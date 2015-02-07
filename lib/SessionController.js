var EventEmitter = require('eventemitter2').EventEmitter2,
	path = require('path'),
	fs = require('fs'),
	vm = require('vm'),
	events = require('events');

var sanity = require(__dirname);

var SessionController = function(service, filename) {
	var private = {},
		public = this;

	// Enable event API:
	EventEmitter.call(this);
	this.__proto__ = EventEmitter.prototype;

	public.filename = filename;
	private.session = sanity.createSession(public);
	private.graph = {
		ports:	{},
		maps:	{}
	};
	private.processes = [];
	private.service = service;

	public.open = function() {
		// Start jack when we start:
		private.service.getInterface(sanity.JackObjectPath, sanity.JackControlInterface, function(error, iface) {
			iface.StartServer(function() {
				private.connect();
			});
		});
	};

	public.close = function() {
		public.emit('close');

		for (var index in private.processes) {
			var process = private.processes[index];

			process.close();
		}
	};

	public.createClient = function(clientName) {
		var client = sanity.createClientController(public, clientName);

		return client.getInstance();
	};

	public.createProcess = function(command, args) {
		var process = sanity.createProcessController(public, command, args);

		private.processes.push(process);

		return process.getInstance();
	};

	public.createPort = function(clientName, portName) {
		var port = sanity.createPortController(public, clientName, portName);

		return port.getInstance();
	};

	public.combine = function(children) {
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

	public.getInstance = function() {
		return private.session;
	};

	public.connect = function(output, input) {
		return public.matchPortDescriptors(output, input, function(output, input) {
			private.dbus.ConnectPortsByName(
				output.clientName, output.portName,
				input.clientName, input.portName
			);
		});
	};

	public.disconnect = function(output, input) {
		return public.matchPortDescriptors(output, input, function(output, input) {
			private.dbus.DisconnectPortsByName(
				output.clientName, output.portName,
				input.clientName, input.portName
			);
		});
	};

	public.canConnect = function(output, input) {
		var result = false;

		public.matchPortDescriptors(output, input, function() {
			result = true;

			return false;
		});

		return result;
	};

	public.findPortDescriptors = function(clientName, portName) {
		var ports = [];

		for (var clientIndex in private.graph.ports) {
			var clientData = private.graph.ports[clientIndex];

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

	public.matchPortDescriptors = function(output, input, callback) {
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

	private.connect = function() {
		private.service.getInterface(sanity.JackObjectPath, sanity.JackPatchbayInterface, function(error, iface) {
			private.dbus = iface;

			var sandbox = {
				console:		console,
				log:			console.log,
				session:		private.session,
				setTimeout:		setTimeout,
				clearTimeout:	clearTimeout,
				setInterval:	setInterval,
				clearInterval:	clearInterval,
				setImmediate:	setImmediate,
				clearImmediate:	clearImmediate
			};

			vm.runInNewContext(fs.readFileSync(public.filename), sandbox, public.filename);

			private.update(function() {
				private.bind();
				public.emit('open');
			});
		});
	};

	private.bind = function() {
		// Forward messages to the session instance:
		public.on('open', function() {
			private.session.emit('open');
		});

		public.on('close', function() {
			private.session.emit('close');
		});

		// Listen to dbus and capture events:
		private.dbus.on('ClientAppeared', function() {
			var clientName = arguments['2'];

			private.update(function() {
				public.emit('clientOnline', clientName);
			});
		});

		private.dbus.on('ClientDisappeared', function() {
			var clientName = arguments['2'];

			private.update(function() {
				public.emit('clientOffline', clientName);
			});
		});

		private.dbus.on('PortAppeared', function() {
			var clientName = arguments['2'],
				portName = arguments['4'];

			private.update(function() {
				public.emit('portOnline', clientName, portName);
			});
		});

		private.dbus.on('PortDisappeared', function() {
			var clientName = arguments['2'],
				portName = arguments['4'];

			private.update(function() {
				public.emit('portOffline', clientName, portName);
			});
		});
	};

	private.update = function(callback) {
		private.dbus.GetGraph('0', function(error, graph, data, connections) {
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

			private.graph = {
				ports:	ports,
				maps:	connections
			};

			if (typeof callback === 'function') {
				callback.apply(null, [error, graph, data, connections]);
			}
		});
	};
};

module.exports.SessionController = SessionController;
module.exports.createSessionController = function(service, filename) {
	return new SessionController(service, filename);
};