var dbus = require('dbus-native'),
	fs = require('fs'),
	stdio = require('stdio');

var sanity = require('../lib/sanity');

// Running as a script:
if (!module.parent) {
	var service = dbus.sessionBus().getService('org.jackaudio.service'),
		session, opts, config;

	// Add a command to receive the process title:
	sanity.opts.title = {
		description:	'Process title file.',
		args:			1,
		mandatory:		true
	};

	// Parse command line arguments:
	opts = stdio.getopt(sanity.opts);
	config = fs.realpathSync(opts.config);

	// Set the process title:
	process.title = opts.title;

	// Create a new session:
	session = new sanity.createSessionController(service, config);

	// Cleanly exit any child prcesses:
	process.on('SIGTERM', function() {
		session.close();
		process.exit(0);
	});

	// Start the session:
	session.open();
}

// Running as a module:
else {
	exports.opts = sanity.opts;
}