var EventEmitter = require('eventemitter2').EventEmitter2,
	path = require('path'),
	events = require('events');

var sanity = require(path.resolve(__dirname, '..', 'sanity'))

var Process = function(controller) {
	var private = {},
		public = this;

	// Enable event API:
	EventEmitter.call(this);
	this.__proto__ = EventEmitter.prototype;

	private.controller = controller;

	public.isOpen = function() {
		return private.controller.isOpen;
	};

	public.open = function() {
		return private.controller.open();
	};

	public.close = function() {
		return private.controller.close();
	};

	public.getController = function() {
		return controller;
	};
};

module.exports.Process = Process;
module.exports.createProcess = function(controller) {
	return new Process(controller);
};