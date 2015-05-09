var sanity = require(__dirname);

var PortDescriptor = function(clientName, portName, data) {
	var self = {},
		self = this;

	var name = (function(id) {
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
	})(portName)

	self.clientName = clientName;
	self.portName = portName;
	self.canMonitor = (data[2] & 0x8) === 0x8;
	self.isInput = (data[2] & 0x1) === 0x1;
	self.isOutput = (data[2] & 0x2) === 0x2;
	self.isPhysical = (data[2] & 0x4) === 0x4;
	self.isTerminal = (data[2] & 0x10) === 0x10;
	self.channel = (
		/([0-9]+)$/.test(name)
			? (/([0-9]+)$/.exec(name)[1])
			: "1"
	);
	self.signal = (
		data[3] === 0
			? 'audio'
			: 'event'
	);
	self.type = (function() {
		var types = [];

		if (self.isInput) {
			types.push('input');
		}

		if (self.isOutput) {
			types.push('output');
		}

		if (self.canMonitor) {
			types.push('monitor');
		}

		if (self.isPhysical) {
			types.push('physical');
		}

		if (self.isTerminal) {
			types.push('terminal');
		}

		return types.join('.');
	})();
	self.key = (
		self.channel
			? self.signal + '.' + self.type + '.' + self.channel
			: self.signal + '.' + self.type
	);
	self.connections = {};

	self.addConnection = function(port) {
		if (!self.connections[port.clientName]) {
			self.connections[port.clientName] = {};
		}

		self.connections[port.clientName][port.portName] = true;
	};

	self.hasConnection = function(port) {
		if (!!port.clientName && !!port.portName) {
			return (
				!!self.connections[port.clientName]
				&& self.connections[port.clientName][port.portName]
			);
		}

		else if (!!port.clientName) {
			return !!self.connections[port.clientName];
		}

		return false;
	}
};

module.exports.createPortDescriptor = function(clientName, portName, data) {
	return new PortDescriptor(clientName, portName, data);
};
