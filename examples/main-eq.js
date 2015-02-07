var pulseAudio = session.createClient(/JACK Sink/),
	hardware = session.createClient('system');

var mainEq = session.combine(
		session.createClient('main-eq'),
		session.createProcess('calfjackhost', [
			'--client', 'main-eq',
			'--load',   '/home/.../main-eq.calf'
		])
	)

	.on('close', function() {
		// Restart the EQ when it closes:
		mainEq.open();
	})

	.on('online', function() {
		// Insert the EQ into the chain:
		if (pulseAudio.canConnect(mainEq)) {
			pulseAudio.connect(mainEq);
			mainEq.connect(hardware);
			pulseAudio.disconnect(hardware);
		}
	})

	.on('offline', function() {
		// Reconnect PulseAudio directly to the hardware:
		pulseAudio.connect(hardware);
	});

session
	.on('open', function() {
		log('Studio session ready...');

		// Disconnect PulseAudio form the hardware:
		pulseAudio.disconnect(hardware);

		// Start the main EQ:
		mainEq.open();
	})

	.on('close', function() {
		// Reconnect PulseAudio directly to the hardware:
		pulseAudio.connect(hardware);

		log('Studio session closed...');
	});