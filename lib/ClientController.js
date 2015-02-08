var sanity = require(__dirname),
	EventEmitter = require('eventemitter2').EventEmitter2;

var ClientController = function(session, clientName) {
	var self = this,
		client = sanity.createClient(self);

	// Enable event API:
	EventEmitter.call(this);
	this.__proto__ = EventEmitter.prototype;

	self.clientName = clientName;
	self.isOnline = false;

	self.init = function() {
		// Forward messages to the client instance:
		self.on('online', function() {
			client.emit('online');
		});

		self.on('offline', function() {
			client.emit('offline');
		});

		self.on('open', function() {
			client.emit('open');
		});

		self.on('close', function() {
			client.emit('close');
		});

		// Listen for session changes:
		session.on('clientOnline', function(clientName) {
			if (self.testName(clientName)) {
				self.isOnline = true;
				self.emit('online');
			}
		});

		session.on('clientOffline', function(clientName) {
			if (self.testName(clientName)) {
				self.isOnline = false;
				self.emit('offline');
			}
		});

		session.on('portOnline', function(clientName, portName) {
			if (self.testName(clientName)) {
				self.emit('online');
			}
		});

		session.on('portOffline', function(clientName, portName) {
			if (self.testName(clientName)) {
				self.emit('offline');
			}
		});
	};

	self.findPortDescriptors = function() {
		return session.findPortDescriptors(self.clientName);
	};

	self.matchPortDescriptors = function(input, callback) {
		return session.matchPortDescriptors(self, input, callback);
	};

	self.createPort = function(portName) {
		return session.createPort(self.clientName, portName);
	};

	self.connect = function(input) {
		return session.connect(self, input.getController());
	};

	self.disconnect = function(input) {
		return session.disconnect(self, input.getController());
	};

	self.canConnect = function(input) {
		return session.canConnect(self, input.getController());
	};

	self.testName = function(clientName) {
		return (
			Object.prototype.toString.call(self.clientName) === '[object RegExp]'
			&& self.clientName.test(clientName)
		)
		|| (
			self.clientName === clientName
		);
	};

	self.getInstance = function() {
		return client;
	};

	self.init();
};

module.exports.ClientController = ClientController;
module.exports.createClientController = function(session, clientName) {
	return new ClientController(session, clientName);
};