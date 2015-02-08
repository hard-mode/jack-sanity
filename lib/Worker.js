var sanity = require(__dirname),
	dbus = require('dbus-native'),
	fs = require('fs'),
	path = require('path'),
	stdio = require('stdio');

var service = dbus.sessionBus().getService(sanity.JackBusName),
	session, flags;

// Add a flag to receive the process title:
sanity.flags.title = {
	args:			1,
	mandatory:		true
};

// Parse command line arguments:
flags = stdio.getopt(sanity.flags);

// Get the full path of the config file:
flags.config = fs.realpathSync(flags.config);

// Set the process title:
process.title = flags.title;

// Create a new session:
session = new sanity.createSessionController(service);

// Cleanly exit any child prcesses:
process.on('SIGTERM', function() {
	session.close();
	process.exit();
});

// Ignored so that we can cleanly shut down:
process.on('SIGINT', function() {});

// Start the session:
session.open(flags.config);
