var sanity = require(__dirname),
	colors = require('cli-color');

var Logger = function() {
	var self = this;

	var send = function(messageFormat, args) {
		var timestampFormat = colors.xterm(240),
			lines = Array.prototype.join.apply(args, [' ']).split("\n");

		var timestamp = function() {
			var time = process.hrtime(self.startTime),
				seconds = '    ' + time[0],
				nanoseconds = '00' + time[1];

			return '[' + seconds.slice(-5) + '.' + nanoseconds.slice(0, 4).slice(-2) + ']';
		};

		for (var index in lines) {
			console.log(timestampFormat(timestamp()) + ' ' + messageFormat(lines[index]));
		}
	};

	self.startTime = process.hrtime();
	self.verbose = true;

	self.error = function() {
		send(colors.xterm(204), arguments);
	};

	self.warn = function() {
		send(colors.xterm(227), arguments);
	};

	self.log = function() {
		send(colors.xterm(255), arguments);
	};

	self.info = function() {
		if (!self.verbose) return;

		send(colors.xterm(245), arguments);
	};
}

module.exports.Logger = Logger;
module.exports.createLogger = function() {
	return new Logger();
};