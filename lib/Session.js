var sanity = require(__dirname),
	EventEmitter = require('eventemitter2').EventEmitter2;

var Session = function(controller) {
	var private = {},
		public = this;

	// Enable event API:
	EventEmitter.call(this);
	this.__proto__ = EventEmitter.prototype;

	private.controller = controller;

	public.createClient = function(clientName) {
		return private.controller.createClient(clientName);
	};

	public.createProcess = function(command, args) {
		return private.controller.createProcess(command, args);
	};

	public.createPort = function(clientName, portName) {
		return private.controller.createPort(clientName, portName);
	};

	public.combine = function() {
		return private.controller.combine(arguments);
	};
};

module.exports.Session = Session;
module.exports.createSession = function(controller) {
	return new Session(controller);
};