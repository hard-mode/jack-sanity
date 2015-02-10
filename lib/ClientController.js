var sanity = require(__dirname),
	EventEmitter = require('eventemitter2').EventEmitter2;

var ClientController = function(session, clientName, portName) {
	var self = this,
		client = sanity.createClient(self);

	// Enable event API:
	EventEmitter.call(this);
	this.__proto__ = EventEmitter.prototype;

	self.clientName = clientName;
	self.portName = portName;

	self.init = function() {
		self.invalidateCaches();

		// Forward messages to the client instance:
		self.on('online', function() {
			client.emit('online');
		});

		self.on('offline', function() {
			client.emit('offline');
		});

		self.on('connect', function() {
			client.emit('connect');
		});

		self.on('disconnect', function() {
			client.emit('disconnect');
		});

		// Listen for session changes:
		session.on('clientOnline', function(clientName) {
			if (
				self.isClient(clientName)
				&& self.isPort(portName)
			) {
				self.emit('online');
			}
		});

		session.on('clientOffline', function(clientName) {
			if (
				self.isClient(clientName)
				&& self.isPort(portName)
			) {
				self.emit('offline');
			}
		});

		session.on('portOnline', function(clientName, portName) {
			if (
				self.isClient(clientName)
				&& self.isPort(portName)
			) {
				self.emit('online');
			}
		});

		session.on('portOffline', function(clientName, portName) {
			if (
				self.isClient(clientName)
				&& self.isPort(portName)
			) {
				self.emit('offline');
			}
		});

		session.on('portConnected', function(fromClientName, fromPortName, toClientName, toPortName) {
			if (
				self.isClient(fromClientName)
				&& self.isPort(fromPortName)
			) {
				self.emit('connect');
			}
		});

		session.on('portDisconnected', function(fromClientName, fromPortName, toClientName, toPortName) {
			if (
				self.isClient(fromClientName)
				&& self.isPort(fromPortName)
			) {
				self.emit('disconnect');
			}
		});

		session.on('cacheInvalid', self.invalidateCaches);
	};

	self.invalidateCaches = function() {
		self.ports = [];
	};

	self.findPortDescriptors = function() {
		if (!self.ports.length) {
			self.ports = session.findPortDescriptors(self.clientName)
		}

		return self.ports;
	};

	self.matchPortDescriptors = function(input, callback) {
		return session.matchPortDescriptors(self, input, callback);
	};

	self.createClient = function(portName) {
		return session.createClient(self.clientName, portName);
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

	self.isConnected = function(input) {
		if (!!input) {
			return session.isConnected(self, input.getController());
		}

		else {
			return session.isConnected(self);
		}
	};

	self.isClient = function(clientName) {
		return (
			// We have no client name, therefore we are all ports:
			(
				!self.clientName
			)

			// The client name is a regular expression that matches:
			|| (
				Object.prototype.toString.call(self.clientName) === '[object RegExp]'
				&& self.clientName.test(clientName)
			)

			// The exact client name matches:
			|| (
				self.clientName === clientName
			)
		);
	};

	self.isOnline = function() {
		var ports = self.findPortDescriptors();

		return ports.length > 0;
	};

	self.isPort = function(portName) {
		return (
			// We have no port name, therefore we are all ports:
			(
				!self.portName
			)

			// The port name is a regular expression that matches:
			|| (
				Object.prototype.toString.call(self.portName) === '[object RegExp]'
				&& self.portName.test(portName)
			)

			// The exact port name matches:
			|| (
				self.portName === portName
			)
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