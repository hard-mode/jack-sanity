var sanity = require(__dirname),
	EventEmitter = require('eventemitter2').EventEmitter2;

var Session = function(controller) {
	var self = this;

	// Enable event API:
	EventEmitter.call(this);
	this.__proto__ = EventEmitter.prototype;

	self.combine = function() {
		return controller.combine(arguments);
	};

	self.createClient = function(clientName, portName) {
		return controller.createClient(clientName, portName);
	};

	self.createProcess = function(command, args) {
		return controller.createProcess(command, args);
	};
};

module.exports.Session = Session;
module.exports.createSession = function(controller) {
	return new Session(controller);
};