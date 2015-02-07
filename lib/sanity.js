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

module.exports.Application = require('./sanity/Application').Application;
module.exports.createApplication = require('./sanity/Application').createApplication;

module.exports.Client = require('./sanity/Client').Client;
module.exports.createClient = require('./sanity/Client').createClient;

module.exports.ClientController = require('./sanity/ClientController').ClientController;
module.exports.createClientController = require('./sanity/ClientController').createClientController;

module.exports.Process = require('./sanity/Process').Process;
module.exports.createProcess = require('./sanity/Process').createProcess;

module.exports.ProcessController = require('./sanity/ProcessController').ProcessController;
module.exports.createProcessController = require('./sanity/ProcessController').createProcessController;

module.exports.Port = require('./sanity/Port').Port;
module.exports.createPort = require('./sanity/Port').createPort;

module.exports.PortController = require('./sanity/PortController').PortController;
module.exports.createPortController = require('./sanity/PortController').createPortController;

module.exports.PortDescriptor = require('./sanity/PortDescriptor').PortDescriptor;
module.exports.createPortDescriptor = require('./sanity/PortDescriptor').createPortDescriptor;

module.exports.Session = require('./sanity/Session').Session;
module.exports.createSession = require('./sanity/Session').createSession;

module.exports.SessionController = require('./sanity/SessionController').SessionController;
module.exports.createSessionController = require('./sanity/SessionController').createSessionController;