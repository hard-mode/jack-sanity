var sanity = require(__dirname),
	dbus = require('dbus-native'),
	fs = require('fs'),
	path = require('path'),
	stdio = require('stdio');

var service = dbus.sessionBus().getService(sanity.JackBusName),
	logger = sanity.createLogger(),
	session, flags;

// Add a flag to receive the process title:
sanity.flags.title = {
	args:			1,
	mandatory:		true
};

// Add a flag to receive the process start time:
sanity.flags.time = {
	args:			2,
	mandatory:		true
};

// Parse command line arguments:
flags = stdio.getopt(sanity.flags);

// Get the full path of the config file:
flags.config = fs.realpathSync(flags.config);

// Set the process title:
process.title = flags.title;

// Quieten the logger:
if (!!flags.quiet) {
	logger.verbose = false;
}

// Set the logger start time:
logger.startTime = flags.time;

// Create a new session:
session = new sanity.createSessionController(service, logger);

// Cleanly exit any child prcesses:
process.on('SIGTERM', function() {
	session.close();
	process.exit(0);
});

// Start the session:
session.open(flags.config);
