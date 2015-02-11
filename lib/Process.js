var sanity = require(__dirname),
	EventEmitter = require('eventemitter2').EventEmitter2;

var Process = function(controller) {
	var self = this;

	// Enable event API:
	EventEmitter.call(this);
	this.__proto__ = EventEmitter.prototype;

	self.close = function() {
		return controller.close();
	};

	self.isOpen = function() {
		return controller.isOpen;
	};

	self.open = function() {
		return controller.open();
	};

	self.getController = function() {
		return controller;
	};
};

module.exports.Process = Process;
module.exports.createProcess = function(controller) {
	return new Process(controller);
};