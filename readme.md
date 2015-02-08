# Jack Sanity

A scriptable environment for controlling jackdbus clients.


## Install

You'll need to clone this repository and then run `npm install`, then you can symlink `bin/jack-sanity` to somewhere in your path.


## Usage

To start a Jack Sanity session simply run:

```bash
jack-sanity --config your-session.js
```

When you make changes to the configuration file, jack-sanity will close the running session and start a new one with your configuration changes.


## Configuration

Create a new JavaScript file and save it somewhere handy, this will be your session configuration file. You can use it to watch JACK clients and ports:

```js
var hardware = session.createClient('system'),
	effects = session.createClient('my-effects');

effects.on('online', function() {
	// Auto-connect a client to the hardware output:
	effects.connect(hardware);
});
```

You can also start and stop processes:

```js
var effectsHost = session.createProcess('calfjackhost', [
	'--client', 'my-effects'
]);

session.on('open', function() {
	// Start the effects host when the session opens:
	effectsHost.open();
});

session.on('close', function() {
	// Stop the effects host when the session closes:
	effectsHost.close();
});

effectsHost.on('close', function() {
	// Restart the effects host when it closes (or crashes):
	effectsHost.open();
});
```

To make life easier, you can combine the client and the process under one name:

```js
var effects = session.combine(
	session.createClient('my-effects'),
	session.createProcess('calfjackhost', [
		'--client', 'my-effects'
	])
);

session.on('open', function() {
	// Start the effects host when the session opens:
	effects.open();

	// Connect the effects:
	if (effects.canConnect(hardware)) {
		effects.connect(hardware);
	}
});
```

You can also log events to the terminal:

```js
session.on('open', function() {
	log('Session is ready...');
});

session.on('close', function() {
	log('Session closed.');
});
```


## Documentation

Full API documentation is available [on the website](http://rowan-lewis.github.io/jack-sanity/).