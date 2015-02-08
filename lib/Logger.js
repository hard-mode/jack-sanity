var sanity = require(__dirname),
	colors = require('cli-color');

var Logger = function() {
	var self = this;

	var send = function(args, timestampFormat, messageFormat) {
		var lines = Array.prototype.join.apply(args, [' ']).split("\n");

		var timestamp = function() {
			var time = process.hrtime(self.startTime),
				seconds = '    ' + time[0],
				nanoseconds = '00' + time[1];

			return seconds.slice(-5) + '.' + nanoseconds.slice(0, 4).slice(-2);
		};

		for (var index in lines) {
			self.printLine(timestampFormat(timestamp()) + ' ' + messageFormat(lines[index]));
		}
	};

	self.printLine = console.log;
	self.startTime = process.hrtime();
	self.verbose = true;

	self.error = function() {
		send(arguments, colors.blackBright, colors.black.bgRedBright);
	};

	self.warn = function() {
		send(arguments, colors.blackBright, colors.black.bgYellowBright);
	};

	self.log = function() {
		send(arguments, colors.blackBright, colors.whiteBright);
	};

	self.info = function() {
		if (!self.verbose) return;

		send(arguments, colors.blackBright, colors.white);
	};
}

module.exports.Logger = Logger;
module.exports.createLogger = function() {
	return new Logger();
};