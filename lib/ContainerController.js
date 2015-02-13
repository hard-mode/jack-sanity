var sanity = require(__dirname),
	_ = require('underscore');

var ContainerController = function(session, definition) {
	var self = this,
		container = sanity.createContainer(self);

	// Add custom definition:
	_.extend(container, definition);

	self.isOpen = false;
	self.doInit = true;

	self.open = function() {
		if (self.doInit) {
			self.doInit = false;
			container.emit('init');
		}

		self.isOpen = true;
		container.emit('open');

		return true;
	};

	self.close = function() {
		if (self.isOpen) {
			self.isOpen = false;
			container.emit('close');

			return true;
		}

		return false;
	};

	self.getInstance = function() {
		return container;
	};
};

module.exports.ContainerController = ContainerController;
module.exports.createContainerController = function(session, definition) {
	return new ContainerController(session, definition);
};