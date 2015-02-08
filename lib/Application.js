var sanity = require(__dirname),
	fs = require('fs'),
	path = require('path'),
	stdio = require('stdio'),
	spawn = require('child_process').spawn;

var Application = function(logger) {
	var self = this;

	self.fork = null;
	self.watchOpts = {
		persistent:	false,
		recursive:	true
	};
	self.watches = {};

	self.execute = function() {
		self.open();
	};

	self.watch = function(filename) {
		if (typeof self.watches[filename] !== 'undefined') {
			return false;
		}

		self.watches[filename] = null;

		return true;
	};

	self.open = function() {
		var flags = [
			path.resolve(__dirname, 'Worker.js'),
			'--title',	process.title,
			'--time',	logger.startTime[0], logger.startTime[1]
		];

		flags = flags.concat(process.argv.slice(2));

		self.fork = spawn(process.argv[0], flags);
		self.rebind();
	};

	self.close = function() {
		for (var filename in self.watches) {
			self.watches[filename].close();
		}

		self.fork.kill();
	};

	self.rebind = function() {
		var error = false;

		// Restart when watch files change:
		for (var filename in self.watches) {
			var watch = fs.watch(filename, function() {
				watch.close();
				self.close();

				if (error) self.open();
			});

			self.watches[filename] = watch;
		}

		// Restart when the app closes:
		self.fork.on('close', function() {
			if (!error) self.open();
		});

		// Output messages from app:
		self.fork.stdout.on('data', function (data) {
			process.stdout.write(data);
		});

		self.fork.stderr.on('data', function (data) {
			logger.error(data);
			error = true;
		});
	};
}

module.exports.Application = Application;
module.exports.createApplication = function(logger) {
	return new Application(logger);
};