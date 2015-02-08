var sanity = require(__dirname),
	fs = require('fs'),
	path = require('path'),
	stdio = require('stdio'),
	fork = require('child_process').fork;

var Application = function(logger) {
	var self = this;

	self.worker = null;
	self.watchOpts = {
		persistent:	false,
		recursive:	true
	};
	self.watches = {};

	self.open = function() {
		// Restart worker when watched files change:
		for (var filename in self.watches) {
			var createWatch = function(filename) {
				var watch = fs.watch(filename, function() {
					// Stop watching this filename:
					watch.close();

					logger.info('Restarting due to changes in `' + filename + '`');

					if (self.worker) {
						self.closeWorker();
					}

					else {
						self.openWorker();
					}

					// Start watching this filename again:
					createWatch(filename);
				});

				self.watches[filename] = watch;
			};

			createWatch(filename);
		}

		self.openWorker();
	};

	self.close = function() {
		// Close the worker first:
		if (self.worker) {
			// Remove the autostart listener:
			self.worker.removeAllListeners('close');

			// Wait for the worker to close:
			self.worker.on('close', function() {
				self.worker = null;
				self.close();
			});

			self.closeWorker();
		}

		// Once the worker is closed:
		else {
			process.exit();
		}
	};

	self.watch = function(filename) {
		if (typeof self.watches[filename] !== 'undefined') {
			return false;
		}

		self.watches[filename] = null;

		return true;
	};

	self.openWorker = function() {
		var worker = path.resolve(__dirname, 'Worker.js'),
			flags = [
				'--title',	process.title
			],
			opts = {
				silent:		true
			};

		flags = flags.concat(process.argv.slice(2));

		self.worker = fork(worker, flags, opts);
		self.rebind();
	};

	self.closeWorker = function() {
		self.worker.kill();
	};

	self.rebind = function() {
		var waitForRestart = false;

		// Listen for messages:
		self.worker.on('message', function(message) {
			if (!!message.error) {
				logger.error.apply(logger, message.error);
			}

			if (!!message.warn) {
				logger.warn.apply(logger, message.warn);
			}

			if (!!message.log) {
				logger.log.apply(logger, message.log);
			}

			if (!!message.info) {
				logger.info.apply(logger, message.info);
			}
		});

		// Restart when the app closes:
		self.worker.on('close', function() {
			if (self.worker) {
				self.worker = null;

				if (!waitForRestart) {
					self.openWorker();
				}
			}
		});

		// Output messages from app:
		self.worker.stdout.on('data', function (data) {
			logger.error(data);
		});
		self.worker.stderr.on('data', function (data) {
			logger.error(data);
			self.worker.kill();
			waitForRestart = true;
		});
	};
}

module.exports.Application = Application;
module.exports.createApplication = function(logger) {
	return new Application(logger);
};