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

	// Enable event API:
	events.EventEmitter.call(this);

	// Import clients:
	iface.GetAllPorts(function(error, ports) {
		ports.forEach(function(value) {
			var bits = /^(.+?):(.+?)$/.exec(value),
				client = bits[1],
				port = bits[2];

			if (typeof clients[client] == 'undefined') {
				clients[client] = {};
			}

			clients[client][port] = {};
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

		clients[event.clientName][event.portName] = {};

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

		if (typeof clients[event.clientName] == 'undefined') {
			clients[event.clientName] = {};
		}

		clients[event.clientName][event.portNewName] = {};

		public.emit(event.eventName, event);
		public.emit(event.clientName, event);
	});

	public.connect = function(clientA, portA, clientB, portB) {
		return iface.ConnectPortsByName(clientA, portA, clientB, portB);
	};

	public.disconnect = function(clientA, portA, clientB, portB) {
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
		var channel;

		if (/_[0-9]+$/.test(args['4'])) {
			channel = (/_[0-9]+$/.exec(args['4'])[0]);
		}

		return {
			'eventName':		event,
			'newGraphVersion':	args['0'],
			'clientId':			args['1'],
			'clientName':		args['2'],
			'portId':			args['3'],
			'portName':			args['4'],
			'portChannel':		channel,
			'portFlags':		args['5'],
			'portType':			args['6']
		};
	};

	private.importPortRenameEvent = function(event, args) {
		return {
			'eventName':		event,
			'newGraphVersion':	args['0'],
			'clientId':			args['2'],
			'clientName':		args['3'],
			'portId':			args['1'],
			'portOldName':		args['4'],
			'portNewName':		args['5']
		};
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
					Jack:		objects.jack,
					Patchbay:	objects.patchbay
				};

				console.log('Including ' + filename);

				vm.runInNewContext(fs.readFileSync(filename), sandbox, filename);
			});
		});
	});
};

includeFile(fs.realpathSync(__dirname + '/../config/config.js'));