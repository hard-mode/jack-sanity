var sanity = require(__dirname),
	EventEmitter = require('eventemitter2').EventEmitter2;

var PortController = function(session, clientName, portName) {
	var private = {},
		public = this;

	// Enable event API:
	EventEmitter.call(this);
	this.__proto__ = EventEmitter.prototype;

	public.clientName = clientName;
	public.portName = portName;
	private.port = sanity.createPort(public);
	private.session = session;

	private.init = function() {
		// Forward messages to the client instance:
		public.on('online', function() {
			private.port.emit('online');
		});

		public.on('offline', function() {
			private.port.emit('offline');
		});

		// Listen for session changes:
		private.session.on('portOnline', function(clientName, portName) {
			if (public.testName(clientName)) {
				console.log('Port ' + portName + ' on client ' + clientName + ' came online');
				public.isConnected = true;
				public.emit('online');
			}
		});

		private.session.on('portOffline', function(clientName, portName) {
			if (public.testName(clientName)) {
				console.log('Port ' + portName + ' on client ' + clientName + ' went offline');
				public.isConnected = false;
				public.emit('offline');
			}
		});
	};

	public.findPortDescriptors = function() {
		return private.session.findPortDescriptors(public.clientName, public.portName);
	};

	public.matchPortDescriptors = function(input, callback) {
		return private.session.matchPortDescriptors(public, input, callback);
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
			(
				(
					Object.prototype.toString.call(public.clientName) === '[object RegExp]'
					&& public.clientName.test(clientName)
				)
				|| (
					public.clientName === clientName
				)
			)
			&& (
				(
					Object.prototype.toString.call(public.portName) === '[object RegExp]'
					&& public.portName.test(portName)
				)
				|| (
					public.portName === portName
				)
			)
		);
	};

	public.getInstance = function() {
		return private.port;
	};

	private.init();
};

module.exports.PortController = PortController;
module.exports.createPortController = function(session, clientName, portName) {
	return new PortController(session, clientName, portName);
};