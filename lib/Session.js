var sanity = require(__dirname),
	EventEmitter = require('eventemitter2').EventEmitter2;

var Session = function(controller) {
	var self = this;

	// Enable event API:
	EventEmitter.call(this);
	this.__proto__ = EventEmitter.prototype;

	self.createClient = function(clientName) {
		return controller.createClient(clientName);
	};

	self.createProcess = function(command, args) {
		return controller.createProcess(command, args);
	};

	self.createPort = function(clientName, portName) {
		return controller.createPort(clientName, portName);
	};

	self.combine = function() {
		return controller.combine(arguments);
	};
};

module.exports.Session = Session;
module.exports.createSession = function(controller) {
	return new Session(controller);
};