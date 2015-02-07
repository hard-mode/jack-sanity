var EventEmitter = require('eventemitter2').EventEmitter2,
	path = require('path'),
	spawn = require('child_process').spawn,
	events = require('events');

var sanity = require(__dirname);

var ProcessController = function(session, command, args) {
	var private = {},
		public = this;

	// Enable event API:
	EventEmitter.call(this);
	this.__proto__ = EventEmitter.prototype;

	public.command = command;
	public.args = args;
	public.isOpen = false;
	private.process = sanity.createProcess(public);
	private.instance = false;

	private.init = function() {
		// Forward messages to the process instance:
		public.on('open', function() {
			private.process.emit('open');
		});

		public.on('close', function() {
			private.process.emit('close');
		});
	};

	public.open = function() {
		if (false !== public.command && false !== public.args) {
			private.instance = spawn(public.command, public.args);

			private.instance.on('exit', function() {
				private.instance = false;
				public.isOpen = false;
				public.emit('close');
			});

			public.isOpen = true;
			public.emit('open');
		}

		return true;
	};

	public.close = function() {
		if (private.instance) {
			return private.instance.kill()
		}

		return false;
	};

	public.kill = function() {
		if (private.instance) {
			private.instance.offAny();
			private.instance = false;
			public.isOpen = false;

			return private.instance.kill()
		}

		return false;
	};

	public.getInstance = function() {
		return private.process;
	};

	private.init();
};

module.exports.ProcessController = ProcessController;
module.exports.createProcessController = function(session, command, args) {
	return new ProcessController(session, command, args);
};