module.exports.JackBusName = 'org.jackaudio.service';
module.exports.JackObjectPath = '/org/jackaudio/Controller';
module.exports.JackControlInterface = 'org.jackaudio.JackControl';
module.exports.JackPatchbayInterface = 'org.jackaudio.JackPatchbay';

module.exports.flags = {
	'config': {
		description:	'Configuration file) to use in the session.',
		args:			1,
		key:			'c',
		mandatory:		true
	},
	'watch': {
		description:	'Watch files or directories for changes. If nothing is specified the configuration file will be watched.',
		args:			'*',
		key:			'w'
	},
	'quiet': {
		description:	'Suppress output of client and port status changes.',
		key:			'q'
	}
};

module.exports.Application = require('./Application').Application;
module.exports.createApplication = require('./Application').createApplication;

module.exports.Client = require('./Client').Client;
module.exports.createClient = require('./Client').createClient;

module.exports.ClientController = require('./ClientController').ClientController;
module.exports.createClientController = require('./ClientController').createClientController;

module.exports.Logger = require('./Logger').Logger;
module.exports.createLogger = require('./Logger').createLogger;

module.exports.Process = require('./Process').Process;
module.exports.createProcess = require('./Process').createProcess;

module.exports.ProcessController = require('./ProcessController').ProcessController;
module.exports.createProcessController = require('./ProcessController').createProcessController;

module.exports.PortDescriptor = require('./PortDescriptor').PortDescriptor;
module.exports.createPortDescriptor = require('./PortDescriptor').createPortDescriptor;

module.exports.Session = require('./Session').Session;
module.exports.createSession = require('./Session').createSession;

module.exports.SessionController = require('./SessionController').SessionController;
module.exports.createSessionController = require('./SessionController').createSessionController;