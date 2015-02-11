var fs = require('fs'),
	path = require('path'),
	vm = require('vm'),
	_ = require('underscore');

var Sandbox = function(sandbox) {
	var self = this,
		objects = Array.prototype.slice.call(arguments),
		share = {},
		modules = {};

	var createContext = function(sandbox) {
		var context;

		objects.push(sandbox);
		context = vm.createContext(_.extend.apply(_, objects));
		objects.pop();

		return context;
	};

	var resolveFilename = function(filename) {
		// Attempt to locate the file:
		try {
			return require.resolve(filename);
		}

		catch (error) {
			// Try looking in the current directory:
			try {
				return require.resolve(path.resolve(process.cwd(), filename));
			}

			catch (error) {
				// Try looking in the node_modules directory:
				try {
					return require.resolve(path.resolve(process.cwd(), 'node_modules', filename));
				}

				catch (error) {
					return filename;
				}
			}
		}
	}

	var createInstance = function() {
		var filename = resolveFilename(arguments[0]),
			exports = {},
			context,
			script;

		// Have we already loaded it?
		if (!!modules[filename]) {
			return modules[filename];
		}

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
			modules[filename] = exports;
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
	objects.push(share);

	// Add the require method to the context:
	share.require = createInstance;

	// Define a separate require method for the parent script:
	self.open = function(dirname, filename) {
		var cwd = process.cwd(),
			result;

		process.chdir(dirname);
		result = createInstance(filename);
		process.chdir(cwd);

		return result;
	};
};

module.exports.Sandbox = Sandbox;
module.exports.createSandbox = function() {
	var sandbox = Object.create(Sandbox);

	return (Sandbox.apply(sandbox, arguments) || sandbox);
};