// When the main EQ starts...
Patchbay.on('main-eq.appeared', function(mainEq) {
	var input = Patchbay.findClient(/JACK Sink/),
		output = Patchbay.findClient('system');

	// Make sure the EQ client has ports to connect to:
	if (input && output && input.canConnectOutput(mainEq)) {
		input.connectOutput(mainEq);
		mainEq.connectOutput(output);
		input.disconnectOutput(output);
	}
});

// When the main EQ stops...
Patchbay.on('main-eq.disappeared', function(mainEq) {
	var input = Patchbay.findClient(/JACK Sink/),
		output = Patchbay.findClient('system');

	if (input && output) {
		input.connectOutput(output);
	}
});

// Simulate Quod Libet starting:
Patchbay.on('ready', function() {
	// Start the main EQ:
	if (false === Patchbay.findClient('main-eq')) {
		Patchbay.spawnProcess('calfjackhost', [
			'--client', 'main-eq',
			'--load',   '/home/rowan/Documents/Studio/main-eq.calf'
		]);
	}
});