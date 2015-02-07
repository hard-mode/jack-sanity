var sanity = require(__dirname),
	EventEmitter = require('eventemitter2').EventEmitter2;

var PortController = function(session, clientName, portName) {
	var self = this,
		port = sanity.createPort(self);

	// Enable event API:
	EventEmitter.call(this);
	this.__proto__ = EventEmitter.prototype;

	self.clientName = clientName;
	self.portName = portName;

	self.init = function() {
		// Forward messages to the client instance:
		self.on('online', function() {
			port.emit('online');
		});

		self.on('offline', function() {
			port.emit('offline');
		});

		// Listen for session changes:
		session.on('portOnline', function(clientName, portName) {
			if (self.testName(clientName)) {
				console.log('Port ' + portName + ' on client ' + clientName + ' came online');
				self.isConnected = true;
				self.emit('online');
			}
		});

		session.on('portOffline', function(clientName, portName) {
			if (self.testName(clientName)) {
				console.log('Port ' + portName + ' on client ' + clientName + ' went offline');
				self.isConnected = false;
				self.emit('offline');
			}
		});
	};

	self.findPortDescriptors = function() {
		return session.findPortDescriptors(self.clientName, self.portName);
	};

	self.matchPortDescriptors = function(input, callback) {
		return session.matchPortDescriptors(self, input, callback);
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
			(
				(
					Object.prototype.toString.call(self.clientName) === '[object RegExp]'
					&& self.clientName.test(clientName)
				)
				|| (
					self.clientName === clientName
				)
			)
			&& (
				(
					Object.prototype.toString.call(self.portName) === '[object RegExp]'
					&& self.portName.test(portName)
				)
				|| (
					self.portName === portName
				)
			)
		);
	};

	self.getInstance = function() {
		return port;
	};

	self.init();
};

module.exports.PortController = PortController;
module.exports.createPortController = function(session, clientName, portName) {
	return new PortController(session, clientName, portName);
};