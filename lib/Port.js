var sanity = require(__dirname),
	EventEmitter = require('eventemitter2').EventEmitter2;

var Port = function(controller) {
	var self = {},
		self = this;

	// Enable event API:
	EventEmitter.call(this);
	this.__proto__ = EventEmitter.prototype;

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

module.exports.Port = Port;
module.exports.createPort = function(controller) {
	return new Port(controller);
};;