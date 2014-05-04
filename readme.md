# Jack Sanity

Easy to use scripting for jackdbus.


## Install

You'll need to clone this repository and then run `npm install`, then you can symlink `bin/jack-sanity` to somewhere in your path.


## Usage

Create a new configuration file from `config/config.js.example`, or just copy the following...

```js
// When the music EQ starts...
Patchbay.on('music-eq.appeared', function(client) {
	var quodlibet = Patchbay.findClient('quodlibet'),
		system = Patchbay.findClient('system');

	// Disconnect Quod Libet from playback:
	if (quodlibet) {
		quodlibet.connectOutput(client);
		client.connectOutput(system);
		quodlibet.disconnectOutput(system);
	}
});

// When the music EQ stops...
Patchbay.on('music-eq.disappeared', function(client) {
	var quodlibet = Patchbay.findClient('quodlibet'),
		system = Patchbay.findClient('system');

	// Connect Quod Libet to playback:
	if (quodlibet) {
		quodlibet.connectOutput(system);
	}
});

// When Quod Libet starts...
Patchbay.on('quodlibet.appeared', function(client) {
	var musicEq = Patchbay.findClient('music-eq'),
		system = Patchbay.findClient('system');

	// Connect through the EQ:
	if (musicEq) {
		client.connectOutput(musicEq);
		musicEq.connectOutput(system);
	}

	// Or directly to playback:
	else {
		client.connectOutput(system);
	}
});

// When Quod Libet stops...
Patchbay.on('quodlibet.disappeared', function(client) {
	var musicEq = Patchbay.findClient('music-eq'),
		system = Patchbay.findClient('system');

	// Disconnect from the EQ:
	if (musicEq) {
		musicEq.disconnectOutput(system);
	}
});

// Simulate Quod Libet starting:
Patchbay.on('ready', function() {
	Patchbay.simulateClient('quodlibet');
});
```