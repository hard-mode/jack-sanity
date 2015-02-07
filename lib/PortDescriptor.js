var path = require('path'),
	events = require('events');

var sanity = require(__dirname);

var PortDescriptor = function(clientName, portName, data) {
	var private = {},
		public = this;

	public.clientName = clientName;
	public.portName = portName;
	private.name = (function(id) {
		var expression = /[_-]?([0-9]+|[lr]|left|right)$/;

		if (expression.test(id)) {
			var bits = expression.exec(id),
				name = id.replace(expression, ''),
				suffix = '';

			switch (bits[1]) {
				case 'l':
				case 'left':
					suffix = 1;
					break;
				case 'r':
				case 'right':
					suffix = 2;
					break;
				default:
					suffix = bits[1];
					break;
			}

			return name + '_' + suffix;
		}

		return id;
	})(public.portName);
	public.canMonitor = (data[2] & 0x8) === 0x8;
	public.isInput = (data[2] & 0x1) === 0x1;
	public.isOutput = (data[2] & 0x2) === 0x2;
	public.isPhysical = (data[2] & 0x4) === 0x4;
	public.isTerminal = (data[2] & 0x10) === 0x10;
	public.channel = (
		/([0-9]+)$/.test(private.name)
			? (/([0-9]+)$/.exec(private.name)[1])
			: false
	);
	public.signal = (
		data[3] === 0
			? 'audio'
			: 'event'
	);
	public.type = (function() {
		var types = [];

		if (public.isInput) {
			types.push('input');
		}

		if (public.isOutput) {
			types.push('output');
		}

		if (public.canMonitor) {
			types.push('monitor');
		}

		if (public.isPhysical) {
			types.push('physical');
		}

		if (public.isTerminal) {
			types.push('terminal');
		}

		return types.join('.');
	})();
	public.key = (
		public.channel
			? public.signal + '.' + public.type + '.' + public.channel
			: public.signal + '.' + public.type
	);
};

module.exports.createPortDescriptor = function(clientName, portName, data) {
	return new PortDescriptor(clientName, portName, data);
};;