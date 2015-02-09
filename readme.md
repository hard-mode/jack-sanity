# Jack Sanity

A scriptable environment for controlling jackdbus clients.


## Install
### Arch Linux

Arch Linux users can install Jack Sanity [from the Arch User Repository](https://aur.archlinux.org/packages/jack-sanity-git/). For more information about using the AUR see the [Arch Linux Wiki](https://wiki.archlinux.org/index.php/Arch_User_Repository).


### From source

1. Clone the repository using git, or [download the latest archive](https://github.com/psychoticmeow/jack-sanity/archive/master.zip) and extract it somewhere convenient.
2. Inside the created folder run `npm install` to install all of the required libraries.
3. Then can symlink `bin/jack-sanity` to somewhere in your path.


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