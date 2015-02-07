var sanity = require(__dirname),
	EventEmitter = require('eventemitter2').EventEmitter2;

var Client = function(controller) {
	var private = {},
		public = this;

	// Enable event API:
	EventEmitter.call(this);
	this.__proto__ = EventEmitter.prototype;

	private.controller = controller;

	public.createPort = function(portName) {
		return private.controller.createPort(portName);
	};

	public.connect = function(input) {
		return private.controller.connect(input);
	};

	public.disconnect = function(input) {
		return private.controller.disconnect(input);
	};

	public.canConnect = function(input) {
		return private.controller.canConnect(input);
	};

	public.isOnline = function() {
		return private.controller.isOnline;
	}

	public.getController = function() {
		return private.controller;
	};
};

module.exports.Client = Client;
module.exports.createClient = function(controller) {
	return new Client(controller);
};