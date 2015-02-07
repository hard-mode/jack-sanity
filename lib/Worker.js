var sanity = require(__dirname),
	dbus = require('dbus-native'),
	fs = require('fs'),
	path = require('path'),
	stdio = require('stdio');

var service = dbus.sessionBus().getService(sanity.JackBusName),
	session, opts, config;

// Add a command to receive the process title:
sanity.opts.title = {
	description:	'Title of the running process.',
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
