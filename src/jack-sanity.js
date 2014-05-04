#!/usr/bin/env node
const SERVICE = 'org.jackaudio.service';
const CONTROLLER = '/org/jackaudio/Controller';
const CONTROL = 'org.jackaudio.JackControl';
const PATCHBAY = 'org.jackaudio.JackPatchbay';

var spawn = require('child_process').spawn;
var fs = require('fs');
var vm = require('vm');
var events = require('events');
var dbus = require('dbus-native');
var sessionBus = dbus.sessionBus();
var service = sessionBus.getService(SERVICE);

function Client(data) {
	var private = {},
		public = this;

	public.id = data[1];
	public.name = data[1];
	public.ports = {};

	for (var index in data[2]) {
		var port = new Port(data[2][index]);

		port.client = this;
		public.ports[port.key] = port;
	}

	public.chainOutput = function() {
		var output = this;

		for (var index in arguments) {
			var input = arguments[index];

			if (output.connectOutput(input) === false) {
				return this;
			}

			output = input;
		}

		return this;
	};

	public.connectInput = function() {
		var input = this;

		for (var index in arguments) {
			var output = arguments[index];

			// String or regular expression:
			if (
				typeof output === 'string'
				|| Object.prototype.toString.call(output) === '[object RegExp]'
			) {
				output = Patchbay.findClient(output);
			}

			// We have a client!
			if (output instanceof Client) {
				output.connectOutput(input);
			}
		}

		return this;
	};

	public.connectOutput = function() {
		var output = this;

		for (var index in arguments) {
			var input = arguments[index];

			// String or regular expression:
			if (
				typeof input === 'string'
				|| Object.prototype.toString.call(input) === '[object RegExp]'
			) {
				input = Patchbay.findClient(input);
			}

			// We have a client!
			if (input instanceof Client) {
				for (var inKey in input.ports) {
					var inPort = input.ports[inKey];

					for (var outKey in output.ports) {
						var outPort = output.ports[outKey];

						if (
							inPort.isInput
							&& outPort.isOutput
							&& inPort.channel === outPort.channel
							&& inPort.signal === outPort.signal
						) {
							Patchbay.connect(
								outPort.client.id,	outPort.id,
								inPort.client.id,	inPort.id
							);
						}
					}
				}
			}
		}

		return this;
	};

	public.disconnectAll = function() {
		var connections = public.getConnections();

		if (connections.length) {
			public.disconnectOutput.apply(public, connections);
			public.disconnectInput.apply(public, connections);
		}

		return this;
	};

	public.disconnectAllOutputs = function() {
		var connections = public.getConnections();

		if (connections.length) {
			public.disconnectOutput.apply(public, connections);
		}

		return this;
	};

	public.disconnectAllInputs = function() {
		var connections = public.getConnections();

		if (connections.length) {
			public.disconnectInput.apply(public, connections);
		}

		return this;
	};

	public.disconnectOutput = function() {
		var output = this;

		// Disconnect from specified clients:
		for (var index in arguments) {
			var input = arguments[index];

			// String or regular expression:
			if (
				typeof input === 'string'
				|| Object.prototype.toString.call(input) === '[object RegExp]'
			) {
				input = Patchbay.findClient(input);
			}

			// We have a client!
			if (input instanceof Client) {
				for (var inKey in input.ports) {
					var inPort = input.ports[inKey];

					for (var outKey in output.ports) {
						var outPort = output.ports[outKey];

						if (
							inPort.isInput
							&& outPort.isOutput
							&& inPort.signal === outPort.signal
						) {
							Patchbay.disconnect(
								outPort.client.id,	outPort.id,
								inPort.client.id,	inPort.id
							);
						}
					}
				}
			}
		}

		return this;
	};

	public.disconnectInput = function() {
		var input = this;

		// Disconnect from specified clients:
		for (var index in arguments) {
			var output = arguments[index];

			// String or regular expression:
			if (
				typeof output === 'string'
				|| Object.prototype.toString.call(output) === '[object RegExp]'
			) {
				output = Patchbay.findClient(output);
			}

			// We have a client!
			if (output instanceof Client) {
				output.disconnectOutput(input);
			}
		}

		return this;
	};

	public.getConnections = function() {
		var connections = Patchbay.getConnections(),
			discovered = [],
			clients = [];

		for (var index in connections) {
			var connection = connections[index];

			if (connection[1] !== public.id) continue;
			if (discovered.indexOf(connection[5]) !== -1) continue;

			var found = Patchbay.findClient(connection[5]);

			if (found instanceof Client) {
				discovered.push(found.id);
				clients.push(found);
			}
		}

		return clients;
	}
};

function Port(data) {
	var private = {},
		public = this;

	public.id = data[1];
	public.name = (function(id) {
		var expression = /[_-]?([0-9]+|[lr]|left|right)$/;

		if (expression.test(id)) {
			var bits = expression.exec(id),
				name = id.replace(expression, ''),
				suffix = '';

			switch (bits[1]) {
				case 'l':
				case 'left':
					suffix = 1;
					break;
				case 'r':
				case 'right':
					suffix = 2;
					break;
				default:
					suffix = bits[1];
					break;
			}

			return name + '_' + suffix;
		}

		return id;
	})(this.id);
	public.canMonitor = (data[2] & 0x8) === 0x8;
	public.isInput = (data[2] & 0x1) === 0x1;
	public.isOutput = (data[2] & 0x2) === 0x2;
	public.isPhysical = (data[2] & 0x4) === 0x4;
	public.isTerminal = (data[2] & 0x10) === 0x10;
	public.channel = (
		/([0-9]+)$/.test(public.name)
			? (/([0-9]+)$/.exec(public.name)[1])
			: false
	);
	public.signal = (
		data[3] === 0
			? 'audio'
			: 'event'
	);
	public.type = (function() {
		var types = [];

		if (public.isInput) {
			types.push('input');
		}

		if (public.isOutput) {
			types.push('output');
		}

		if (public.canMonitor) {
			types.push('monitor');
		}

		if (public.isPhysical) {
			types.push('physical');
		}

		if (public.isTerminal) {
			types.push('terminal');
		}

		return types.join('.');
	})();
	public.key = (
		public.channel
			? public.signal + '.' + public.type + '.' + public.channel
			: public.signal + '.' + public.type
	);
};

const Control = new (function() {
	var private = {},
		public = this;

	// Enable event API:
	events.EventEmitter.call(this);
	this.__proto__ = events.EventEmitter.prototype;

	public.openSession = function(filename) {
		// Start jack when we start:
		service.getInterface(CONTROLLER, CONTROL, function(error, iface) {
			private.dbus = iface;

			iface.StartServer(function() {
				Patchbay.openSession(filename);
			});
		});
	}
});

const Patchbay = new (function() {
	var private = {},
		public = this,
		clients = {},
		clientsCache = {};

	// Enable event API:
	events.EventEmitter.call(this);
	this.__proto__ = events.EventEmitter.prototype;

	public.openSession = function(filename) {
		service.getInterface(CONTROLLER, PATCHBAY, function(error, iface) {
			private.dbus = iface;

			var sandbox = {
				console:	console,
				log:		console.log,
				Client:		Client,
				Port:		Port,
				Control:	Control,
				Patchbay:	Patchbay
			};

			console.log('Starting %s', filename);

			vm.runInNewContext(fs.readFileSync(filename), sandbox, filename);

			private.buildClientData(function() {
				private.bindToSession();
				public.emit('ready');
			});
		});
	};

	private.buildClientData = function(callback) {
		private.dbus.GetGraph('0', function(error, graph, data, connections) {
			clients = {};
			clientsCache = {};

			for (var clientIndex in data) {
				var client = new Client(data[clientIndex]);

				clients[client.name] = client;
			}

			private.data = {
				clients:		data,
				connections:	connections
			};

			if (typeof callback === 'function') {
				callback.apply(null, [error, graph, data, connections]);
			}
		});
	};

	private.bindToSession = function() {
		private.dbus.on('ClientAppeared', function() {
			var id = arguments['2'];

			private.buildClientData(function() {
				var client = public.findClient(id);

				if (client instanceof Client) {
					public.emit('client-appeared', client);
					public.emit(id + '.client-appeared', client);
					public.emit(id + '.appeared', client);
				}
			});
		});

		private.dbus.on('ClientDisappeared', function() {
			var id = arguments['2'],
				client = public.findClient(id);

			if (client instanceof Client) {
				public.emit('client-disappeared', client);
				public.emit(id + '.client-disappeared', client);
				public.emit(id + '.disappeared', client);
			}

			private.buildClientData();
		});

		private.dbus.on('PortAppeared', function() {
			var id = arguments['2'];

			private.buildClientData(function() {
				var client = public.findClient(id);

				if (client instanceof Client) {
					public.emit('port-appeared', client);
					public.emit(id + '.port-appeared', client);
					public.emit(id + '.appeared', client);
				}
			});
		});

		private.dbus.on('PortDisappeared', function() {
			var id = arguments['2'],
				client = public.findClient(id);

			if (client instanceof Client) {
				public.emit('port-disappeared', client);
				public.emit(id + '.port-disappeared', client);
				public.emit(id + '.disappeared', client);
			}

			private.buildClientData();
		});
	};

	public.connect = function(clientA, portA, clientB, portB) {
		private.dbus.ConnectPortsByName(clientA, portA, clientB, portB);
	};

	public.disconnect = function(clientA, portA, clientB, portB) {
		private.dbus.DisconnectPortsByName(clientA, portA, clientB, portB);
	};

	public.getConnections = function() {
		return private.data.connections;
	}

	public.findClient = function(clientName, callback) {
		if (typeof clientsCache[clientName] !== 'undefined') {
			return clientsCache[clientName];
		}

		if (clientName instanceof Client) {
			clientName = clientName.id;
		}

		for (var id in clients) {
			var current = clients[id],
				client = false;

			if (
				Object.prototype.toString.call(clientName) === '[object RegExp]'
				&& clientName.test(current.name)
			) {
				client = current;
			}

			else if (clientName === current.name) {
				client = current;
			}

			if (client === false) continue;

			if (typeof callback === 'function') {
				callback.apply(null, [client]);
			}

			clientsCache[clientName] = client;

			return client;
		}

		return false;
	};

	public.findPort = function(clientName, portName, callback) {
		var result = false;

		public.findClient(clientName, function(client) {
			if (portName instanceof Port) {
				portName = portName.id;
			}

			for (var index in client.ports) {
				var current = client.ports[index],
					port = false;

				if (
					Object.prototype.toString.call(portName) === '[object RegExp]'
					&& portName.test(current.name)
				) {
					port = current;
				}

				else if (portName === current.name) {
					port = current;
				}

				if (port === false) continue;

				if (typeof callback === 'function') {
					callback.apply(null, [port]);
				}

				result = new Descriptor(client, port);
				break;
			}
		});

		return result;
	};

	public.simulateClient = function(clientName) {
		return public.findClient(clientName, function(client) {
			if (client instanceof Client) {
				public.emit('client-appeared', client);
				public.emit(client.id + '.client-appeared', client);
				public.emit(client.id + '.appeared', client);
			}
		});
	}
});

Control.openSession(fs.realpathSync(__dirname + '/../config/config.js'));