module.exports.JackBusName = 'org.jackaudio.service';
module.exports.JackObjectPath = '/org/jackaudio/Controller';
module.exports.JackControlInterface = 'org.jackaudio.JackControl';
module.exports.JackPatchbayInterface = 'org.jackaudio.JackPatchbay';

module.exports.opts = {
	config: {
		description:	'Configuration file.',
		args:			1,
		mandatory:		true
	}
};

module.exports.Application = require('./Application').Application;
module.exports.createApplication = require('./Application').createApplication;

module.exports.Client = require('./Client').Client;
module.exports.createClient = require('./Client').createClient;

module.exports.ClientController = require('./ClientController').ClientController;
module.exports.createClientController = require('./ClientController').createClientController;

module.exports.Process = require('./Process').Process;
module.exports.createProcess = require('./Process').createProcess;

module.exports.ProcessController = require('./ProcessController').ProcessController;
module.exports.createProcessController = require('./ProcessController').createProcessController;

module.exports.Port = require('./Port').Port;
module.exports.createPort = require('./Port').createPort;

module.exports.PortController = require('./PortController').PortController;
module.exports.createPortController = require('./PortController').createPortController;

module.exports.PortDescriptor = require('./PortDescriptor').PortDescriptor;
module.exports.createPortDescriptor = require('./PortDescriptor').createPortDescriptor;

module.exports.Session = require('./Session').Session;
module.exports.createSession = require('./Session').createSession;

module.exports.SessionController = require('./SessionController').SessionController;
module.exports.createSessionController = require('./SessionController').createSessionController;