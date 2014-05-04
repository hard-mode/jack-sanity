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

	public.connectOutput = function(input) {
		var output = this;

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
	};

	public.disconnectOutput = function(input) {
		var output = this;

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
						Patchbay.disconnect(
							outPort.client.id,	outPort.id,
							inPort.client.id,	inPort.id
						);
					}
				}
			}
		}
	};

	public.connectInput = function(output) {
		var input = this;

		if (output instanceof Client) {
			output.outputTo(input);
		}
	};
};

function Port(data) {
	var private = {},
		public = this;

	public.id = data[1];
	public.name = normalizePortName(public.id);
	public.canMonitor = (data[2] & 0x8);
	public.isInput = (data[2] & 0x1);
	public.isOutput = (data[2] & 0x2);
	public.isPhysical = (data[2] & 0x4);
	public.isTerminal = (data[2] & 0x10);
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
		clients = {};

	// Enable event API:
	events.EventEmitter.call(this);
	this.__proto__ = events.EventEmitter.prototype;

	public.openSession = function(filename) {
		service.getInterface(CONTROLLER, PATCHBAY, function(error, iface) {
			private.dbus = iface;

			var sandbox = {
				console:	console,
				log:		console.log,
				Control:	Control,
				Patchbay:	Patchbay
			};

			console.log('Starting %s', filename);

			vm.runInNewContext(fs.readFileSync(filename), sandbox, filename);

			private.buildClientData(function() {
				private.bindToSession();
			});
		});
	};

	private.buildClientData = function(callback) {
		private.dbus.GetGraph('0', function(error, graph, data, connections) {
			clients = {};

			for (var clientIndex in data) {
				var client = new Client(data[clientIndex]);

				clients[client.name] = client;
			}

			if (typeof callback === 'function') {
				callback.apply();
			}
		});
	};

	private.bindToSession = function() {
		private.dbus.on('ClientAppeared', function() {
			var id = arguments['2'],
				event = 'client-appeared';

			private.buildClientData(function() {
				var client = public.findClient(id);

				if (client instanceof Client) {
					public.emit(event, client);
					public.emit(id + '.' + event, client);
				}
			});
		});

		private.dbus.on('ClientDisappeared', function() {
			var id = arguments['2'],
				client = public.findClient(id),
				event = 'client-dissapeared';

			if (client instanceof Client) {
				public.emit(event, client);
				public.emit(id + '.' + event, event, client);
			}

			private.buildClientData();
		});

		private.dbus.on('PortAppeared', function() {
			var id = arguments['2'],
				event = 'port-appeared';

			private.buildClientData(function() {
				var client = public.findClient(id);

				if (client instanceof Client) {
					public.emit(event, client);
					public.emit(id + '.' + event, client);
				}
			});
		});

		private.dbus.on('PortDisappeared', function() {
			var id = arguments['2'],
				client = public.findClient(id),
				event = 'port-dissapeared';

			if (client instanceof Client) {
				public.emit(event, client);
				public.emit(id + '.' + event, event, client);
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

	public.findClient = function(clientName, callback) {
		for (var id in clients) {
			var current = clients[id],
				client = false;

			if (clientName instanceof RegExp && clientName.test(current.name)) {
				client = current;
			}

			else if (clientName === current.name) {
				client = current;
			}

			if (client === false) continue;

			if (typeof callback === 'function') {
				callback.apply(null, [client]);
			}

			return client;
		}

		return false;
	};

	public.findPort = function(clientName, portName, callback) {
		var result = false;

		public.findClient(clientName, function(client) {
			for (var index in client.ports) {
				var current = client.ports[index],
					port = false;

				if (portName instanceof RegExp && portName.test(current.name)) {
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
});

Control.openSession(fs.realpathSync(__dirname + '/../config/config.js'));