var EventEmitter = require('eventemitter2').EventEmitter2,
	path = require('path'),
	events = require('events');

var sanity = require(path.resolve(__dirname, '..', 'sanity'))

var ClientController = function(session, clientName) {
	var private = {},
		public = this;

	// Enable event API:
	EventEmitter.call(this);
	this.__proto__ = EventEmitter.prototype;

	public.clientName = clientName;
	public.isOnline = false;
	private.client = sanity.createClient(public);
	private.session = session;

	private.init = function() {
		// Forward messages to the client instance:
		public.on('online', function() {
			private.client.emit('online');
		});

		public.on('offline', function() {
			private.client.emit('offline');
		});

		public.on('open', function() {
			private.client.emit('open');
		});

		public.on('close', function() {
			private.client.emit('close');
		});

		// Listen for session changes:
		private.session.on('clientOnline', function(clientName) {
			if (public.testName(clientName)) {
				console.log('Client ' + clientName + ' came online');
				public.isOnline = true;
				public.emit('online');
			}
		});

		private.session.on('clientOffline', function(clientName) {
			if (public.testName(clientName)) {
				console.log('Client ' + clientName + ' went offline');
				public.isOnline = false;
				public.emit('offline');
			}
		});

		private.session.on('portOnline', function(clientName, portName) {
			if (public.testName(clientName)) {
				public.emit('online');
			}
		});

		private.session.on('portOffline', function(clientName, portName) {
			if (public.testName(clientName)) {
				public.emit('offline');
			}
		});
	};

	public.findPortDescriptors = function() {
		return private.session.findPortDescriptors(public.clientName);
	};

	public.matchPortDescriptors = function(input, callback) {
		return private.session.matchPortDescriptors(public, input, callback);
	};

	public.createPort = function(portName) {
		return private.session.createPort(public.clientName, portName);
	};

	public.connect = function(input) {
		return private.session.connect(public, input.getController());
	};

	public.disconnect = function(input) {
		return private.session.disconnect(public, input.getController());
	};

	public.canConnect = function(input) {
		return private.session.canConnect(public, input.getController());
	};

	public.testName = function(clientName) {
		return (
			Object.prototype.toString.call(public.clientName) === '[object RegExp]'
			&& public.clientName.test(clientName)
		)
		|| (
			public.clientName === clientName
		);
	};

	public.getInstance = function() {
		return private.client;
	};

	private.init();
};

module.exports.ClientController = ClientController;
module.exports.createClientController = function(session, clientName) {
	return new ClientController(session, clientName);
};