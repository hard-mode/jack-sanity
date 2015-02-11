var fs = require('fs'),
	path = require('path'),
	vm = require('vm'),
	_ = require('underscore'),
	Module = require('module').Module;

var Sandbox = function(sandbox) {
	var self = this;

	var requireModule = function(request) {
		var filename = Module._resolveFilename(request, this),
			cachedModule = Module._cache[filename],
			hadException = true,
			module;

		// Check the cache first:
		if (cachedModule) {
			return cachedModule.exports;
		}

		// Looks like a native module:
		if (request === filename && -1 === filename.indexOf('/')) {
			return require(filename);
		}

		// Create the module:
		module = new Module(filename, this);
		Module._cache[filename] = module;

		try {
			loadModule.call(module, filename);
			hadException = false
		}

		finally {
			if (hadException) {
				delete Module._cache[filename];
			}
		}

		return module.exports
	};

	var loadModule = function(filename) {
		this.filename = filename;
		this.paths = Module._nodeModulePaths(path.dirname(filename));

		var content = fs.readFileSync(filename, 'utf8'),
			extension = path.extname(filename) || '.js';

		// We take over handling of JavaScript:
		if (extension === '.js' || !Module._extensions[extension]) {
			// Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
			// because the buffer-to-string conversion in `fs.readFileSync()`
			// translates it to FEFF, the UTF-16 BOM.
			if (content.charCodeAt(0) === 0xFEFF) {
				content = content.slice(1);
			}

			compileModule.call(this, content, filename);
		}

		// Allow default handling of other file types:
		else {
			Module._extensions[extension](this, filename);
		}

		this.loaded = true;
	};

	var compileModule = function(content, filename) {
		var self = this,
			dirname = path.dirname(filename),
			context = {};

		// remove shebang
		content = content.replace(/^\#\!.*/, '');

		function require(path) {
			return requireModule.call(self, path);
		}

		require.resolve = function(request) {
			return Module._resolveFilename(request, self);
		};

		Object.defineProperty(require, 'paths', {
			get: function() {
				throw new Error(
					'require.paths is removed. Use ' +
					'node_modules folders, or the NODE_PATH ' +
					'environment variable instead.'
				);
			}
		});

		require.main = process.mainModule;

		// Enable support to add extra extension types
		require.extensions = Module._extensions;
		require.registerExtension = function() {
			throw new Error(
				'require.registerExtension() removed. Use ' +
				'require.extensions instead.'
			);
		};

		require.cache = Module._cache;

		// Prepare new context:
		for (var key in global) {
			context[key] = global[key];
		}

		for (var key in sandbox) {
			context[key] = sandbox[key];
		}

		context.require = require;
		context.exports = self.exports;
		context.__filename = filename;
		context.__dirname = dirname;
		context.module = self;
		context.global = context;
		context.root = root;

		return vm.runInNewContext(content, context, filename);
	};

	self.require = function(filename) {
		var cwd = process.cwd(),
			dirname = path.dirname(filename);

		process.chdir(dirname);
		requireModule.call(module, filename);
		process.chdir(cwd);
	};
};

module.exports.Sandbox = Sandbox;
module.exports.createSandbox = function() {
	var sandbox = Object.create(Sandbox);

	return (Sandbox.apply(sandbox, arguments) || sandbox);
};