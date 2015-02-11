var fs = require('fs'),
	path = require('path'),
	vm = require('vm'),
	_ = require('underscore');

var Sandbox = function(sandbox) {
	var self = this,
		objects = Array.prototype.slice.call(arguments);

	var createContext = function(sandbox) {
		var context;

		objects.push(sandbox);
		context = vm.createContext(_.extend.apply(_, objects));
		objects.pop();

		return context;
	};

	var createInstance = function() {
		var filename = require.resolve(arguments[0]),
			exports = {},
			context,
			script;

		// Attempt to read the file:
		try {
			script = fs.readFileSync(filename);
			context = createContext({
				__filename:	filename,
				__dirname:	path.dirname(filename),
				exports:	exports,
				module: {
					exports:	exports
				}
			});
		}

		// A built in module cannot be run in our sandbox:
		catch (error) {
			return require(filename);
		}

		// All good, run the code in the sandbox:
		vm.runInContext(script, context, filename);

		return exports;
	};

	// Add an empty object to build:
	objects.unshift({});

	// Add ourselves to the context:
	objects.push(self);

	self.require = createInstance;
};

module.exports.Sandbox = Sandbox;
module.exports.createSandbox = function() {
	var sandbox = Object.create(Sandbox);

	return (Sandbox.apply(sandbox, arguments) || sandbox);
};