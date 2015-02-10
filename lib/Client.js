var sanity = require(__dirname),
	EventEmitter = require('eventemitter2').EventEmitter2;

var Client = function(controller) {
	var self = this;

	// Enable event API:
	EventEmitter.call(this);
	this.__proto__ = EventEmitter.prototype;

	self.canConnect = function(input) {
		return controller.canConnect(input);
	};

	self.connect = function(input) {
		return controller.connect(input);
	};

	self.createClient = function(portName) {
		return controller.createClient(portName);
	};

	self.disconnect = function(input) {
		return controller.disconnect(input);
	};

	self.getController = function() {
		return controller;
	};

	self.isConnected = function(client) {
		return controller.isConnected(client);
	};

	self.isDisconnected = function(client) {
		return !controller.isConnected(client);
	};

	self.isClient = function(clientName) {
		return controller.isClient(clientName);
	};

	self.isPort = function(portName) {
		return controller.isPort(portName);
	};

	self.isOffline = function() {
		return !controller.isOnline();
	};

	self.isOnline = function() {
		return controller.isOnline();
	};
};

module.exports.Client = Client;
module.exports.createClient = function(controller) {
	return new Client(controller);
};