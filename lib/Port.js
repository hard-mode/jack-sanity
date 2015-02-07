var EventEmitter = require('eventemitter2').EventEmitter2,
	path = require('path'),
	events = require('events');

var sanity = require(__dirname);

var Port = function(controller) {
	var private = {},
		public = this;

	// Enable event API:
	EventEmitter.call(this);
	this.__proto__ = EventEmitter.prototype;

	private.controller = controller;

	public.connect = function(input) {
		return private.controller.connect(input);
	};

	public.disconnect = function(input) {
		return private.controller.disconnect(input);
	};

	public.canConnect = function(input) {
		return private.controller.canConnect(input);
	};

	public.isConnected = function() {
		return private.controller.isConnected;
	}

	public.getController = function() {
		return private.controller;
	};
};

module.exports.Port = Port;
module.exports.createPort = function(controller) {
	return new Port(controller);
};;