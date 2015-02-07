var sanity = require(__dirname),
	EventEmitter = require('eventemitter2').EventEmitter2,
	spawn = require('child_process').spawn;

var ProcessController = function(session, command, args) {
	var self = this,
		process = sanity.createProcess(self),
		instance = false;

	// Enable event API:
	EventEmitter.call(this);
	this.__proto__ = EventEmitter.prototype;

	self.command = command;
	self.args = args;
	self.isOpen = false;

	self.init = function() {
		// Forward messages to the process instance:
		self.on('open', function() {
			process.emit('open');
		});

		self.on('close', function() {
			process.emit('close');
		});
	};

	self.open = function() {
		if (false !== self.command && false !== self.args) {
			instance = spawn(self.command, self.args);

			instance.on('exit', function() {
				instance = false;
				self.isOpen = false;
				self.emit('close');
			});

			self.isOpen = true;
			self.emit('open');
		}

		return true;
	};

	self.close = function() {
		if (instance) {
			return instance.kill()
		}

		return false;
	};

	self.kill = function() {
		if (instance) {
			instance.offAny();
			instance = false;
			self.isOpen = false;

			return instance.kill()
		}

		return false;
	};

	self.getInstance = function() {
		return process;
	};

	self.init();
};

module.exports.ProcessController = ProcessController;
module.exports.createProcessController = function(session, command, args) {
	return new ProcessController(session, command, args);
};