var sanity = require(__dirname),
	EventEmitter = require('eventemitter2').EventEmitter2;

var Client = function(controller) {
	var self = this;

	// Enable event API:
	EventEmitter.call(this);
	this.__proto__ = EventEmitter.prototype;

	self.createPort = function(portName) {
		return controller.createPort(portName);
	};

	self.connect = function(input) {
		return controller.connect(input);
	};

	self.disconnect = function(input) {
		return controller.disconnect(input);
	};

	self.canConnect = function(input) {
		return controller.canConnect(input);
	};

	self.isOnline = function() {
		return controller.isOnline;
	}

	self.getController = function() {
		return controller;
	};
};

module.exports.Client = Client;
module.exports.createClient = function(controller) {
	return new Client(controller);
};