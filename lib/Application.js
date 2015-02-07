var fs = require('fs'),
	path = require('path'),
	stdio = require('stdio'),
	spawn = require('child_process').spawn;

var sanity = require(__dirname);

var Application = function(filename) {
	var private = {},
		public = this;

	private.filename = filename;

	private.fork = null;

	private.watchOpts = {
		persistent:	false,
		recursive:	true
	};

	private.watches = {};

	public.open = function() {
		private.open();
	};

	public.watch = function(filename) {
		if (typeof private.watches[filename] !== 'undefined') {
			return false;
		}

		private.watches[filename] = null;

		return true;
	};

	private.open = function() {
		private.fork = spawn(process.argv[0], [
			path.resolve(__dirname, 'Worker.js'),
			'--config', private.filename,
			'--title',	'jack-sanity'
		]);
		private.rebind();
	};

	private.close = function() {
		for (var filename in private.watches) {
			private.watches[filename].close();
		}

		private.fork.kill();
	};

	private.rebind = function() {
		var error = false;

		// Restart when watch files change:
		for (var filename in private.watches) {
			var watch = fs.watch(filename, function() {
				watch.close();
				private.close();

				if (error) private.open();
			});

			private.watches[filename] = watch;
		}

		// Restart when the app closes:
		private.fork.on('close', function() {
			if (!error) private.open();
		});

		// Output messages from app:
		private.fork.stdout.on('data', function (data) {
			process.stdout.write(data);
		});

		private.fork.stderr.on('data', function (data) {
			process.stderr.write(data);
			error = true;
		});
	};
}

module.exports.Application = Application;
module.exports.createApplication = function(filename) {
	return new Application(filename);
};