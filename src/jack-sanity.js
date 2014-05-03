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

function PatchbayClass(iface) {
	var public = this;
	var private = {};
	var clients = {};
	var sanitize = /[_-]?([0-9]+|[lr]|left|right)$/;

	// Enable event API:
	events.EventEmitter.call(this);

	// Import clients:
	iface.GetAllPorts(function(error, ports) {
		ports.forEach(function(value) {
			var bits = /^(.+?):(.+?)$/.exec(value),
				alias = public.normalizePortName(bits[2]),
				client = bits[1],
				port = bits[2];

			if (typeof clients[client] == 'undefined') {
				clients[client] = {};
			}

			clients[client][port] = port;
			clients[client][alias] = port;
		});
	});

	// Listen to dbus events:
	iface.addListener('ClientAppeared', function() {
		var event = private.importClientEvent('ClientAppeared', arguments);

		clients[event.clientName] = {};

		public.emit(event.eventName, event);
		public.emit(event.clientName, event);
	});

	iface.addListener('ClientDisappeared', function() {
		var event = private.importClientEvent('ClientDisappeared', arguments);

		delete clients[event.clientName];

		public.emit(event.eventName, event);
		public.emit(event.clientName, event);
	});

	iface.addListener('PortAppeared', function() {
		var event = private.importPortEvent('PortAppeared', arguments);

		if (typeof clients[event.clientName] == 'undefined') {
			clients[event.clientName] = {};
		}

		clients[event.clientName][event.portName] = event.portName;
		clients[event.clientName][event.portAlias] = event.portName;

		public.emit(event.eventName, event);
		public.emit(event.clientName, event);
	});

	iface.addListener('PortDisappeared', function() {
		var event = private.importPortEvent('PortDisappeared', arguments);

		delete clients[event.clientName][event.portName];

		public.emit(event.eventName, event);
		public.emit(event.clientName, event);
	});

	iface.addListener('PortRenamed', function() {
		var event = private.importPortRenameEvent('PortRenamed', arguments);

		delete clients[event.clientName][event.portOldName];
		delete clients[event.clientName][event.portOldAlias];

		if (typeof clients[event.clientName] == 'undefined') {
			clients[event.clientName] = {};
		}

		clients[event.clientName][event.portNewName] = event.portNewName;
		clients[event.clientName][event.portNewAlias] = event.portNewName;

		public.emit(event.eventName, event);
		public.emit(event.clientName, event);
	});

	public.normalizePortName = function(port) {
		if (sanitize.test(port)) {
			var bits = sanitize.exec(port),
				alias = port.replace(sanitize, ''),
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

			return alias + '_' + suffix;
		}

		return port;
	};

	public.connect = function(clientA, portA, clientB, portB) {
		// Loop up the real port names:
		if (typeof clients[clientA][portA] !== 'undefined') {
			portA = clients[clientA][portA];
		}

		if (typeof clients[clientB][portB] !== 'undefined') {
			portB = clients[clientB][portB];
		}

		return iface.ConnectPortsByName(clientA, portA, clientB, portB);
	};

	public.disconnect = function(clientA, portA, clientB, portB) {
		// Loop up the real port names:
		if (typeof clients[clientA][portA] !== 'undefined') {
			portA = clients[clientA][portA];
		}

		if (typeof clients[clientB][portB] !== 'undefined') {
			portB = clients[clientB][portB];
		}

		return iface.DisconnectPortsByName(clientA, portA, clientB, portB);
	};

	public.clientExists = function(clientName) {
		if (typeof clients[clientName] === 'undefined') return false;

		return true;
	};

	public.portExists = function(clientName, portName) {
		if (typeof clients[clientName] === 'undefined') return false;
		if (typeof clients[clientName][portName] === 'undefined') return false;

		return true;
	};

	private.importClientEvent = function(event, args) {
		return {
			'eventName':		event,
			'newGraphVersion':	args['0'],
			'clientId':			args['1'],
			'clientName':		args['2']
		};
	};

	private.importPortEvent = function(event, args) {
		var alias = public.normalizePortName(args[4]),
			channel;

		if (/[0-9]+$/.test(args['4'])) {
			channel = (/([0-9]+)$/.exec(args['4'])[1]);
		}

		return {
			'eventName':		event,
			'newGraphVersion':	args['0'],
			'clientId':			args['1'],
			'clientName':		args['2'],
			'portId':			args['3'],
			'portName':			alias,
			'portAlias':		args[4],
			'portChannel':		channel,
			'portFlags':		args['5'],
			'portType':			args['6']
		};
	};

	private.importPortRenameEvent = function(event, args) {
		var oldAlias = public.normalizePortName(args[4]),
			newAlias = public.normalizePortName(args[5]);

		return {
			'eventName':		event,
			'newGraphVersion':	args['0'],
			'clientId':			args['2'],
			'clientName':		args['3'],
			'portId':			args['1'],
			'portOldName':		oldAlias,
			'portOldAlias':		args['4'],
			'portNewName':		newAlias,
			'portNewAlias':		args['5']
		};
	};

	public.simulatePortEvents = function() {
		iface.GetGraph('0', function(error, graph, clients_and_ports, connections) {
			clients_and_ports.forEach(function(client) {
				client[2].forEach(function(port) {
					var alias = public.normalizePortName(port[1]),
						channel;

					if (/[0-9]+$/.test(port[1])) {
						channel = (/([0-9]+)$/.exec(port[1])[1]);
					}

					var event = {
						'eventName':		'PortAppeared',
						'newGraphVersion':	graph,
						'clientId':			client[0],
						'clientName':		client[1],
						'portId':			port[0],
						'portName':			alias,
						'portAlias':		port[1],
						'portChannel':		channel,
						'portFlags':		port[2],
						'portType':			port[3]
					};

					public.emit(event.eventName, event);
					public.emit(event.clientName, event);
				});
			});
		});
	};
};

PatchbayClass.prototype.__proto__ = events.EventEmitter.prototype;

var includeFile = function(filename) {
	var objects = {};

	// Start jack when we start:
	service.getInterface(CONTROLLER, CONTROL, function(error, iface) {
		objects.jack = iface;

		objects.jack.StartServer(function() {
			// Listen to patch changes:
			service.getInterface(CONTROLLER, PATCHBAY, function(error, iface) {
				objects.patchbay = new PatchbayClass(iface);

				var sandbox = {
					console:	console,
					log:		console.log,
					Jack:		objects.jack,
					Patchbay:	objects.patchbay
				};

				console.log('Starting %s', filename);

				vm.runInNewContext(fs.readFileSync(filename), sandbox, filename);

				// Fake ports connecting:
				objects.patchbay.simulatePortEvents();
			});
		});
	});
};

includeFile(fs.realpathSync(__dirname + '/../config/config.js'));