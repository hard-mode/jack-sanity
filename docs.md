## Install
### Arch Linux

Arch Linux users can install Jack Sanity [from the Arch User Repository](https://aur.archlinux.org/packages/jack-sanity-git/). For more information about using the AUR see the [Arch Linux Wiki](https://wiki.archlinux.org/index.php/Arch_User_Repository).


### From source

1. Clone the repository using git, or [download the latest archive](https://github.com/psychoticmeow/jack-sanity/archive/master.zip) and extract it somewhere convenient.
2. Inside the created folder run `npm install` to install all of the required libraries.
3. Then symlink `bin/jack-sanity` to somewhere in your path.


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
### Session.createClient
Create an interface to a matching set of jack clients, even if they do not currently exist in the session. See `Client.isOnline`.

```js
// Specify an exact client name:
session.createClient('system');

// Use regular expressions to match a client name:
session.createClient(/calf/i);
```

#### Parameters
* `clientName` a `String` or `RegExp` to search with.

#### Returns
* An instance of `Client`.


### Session.createPort
Create an interface to a set of matching jack ports, even if they do not currently exist in the session. See `Client.isOnline` and `Port.isOnline`.

```js
// Specify an exact port name:
session.createPort('my-client', 'event-out');

// Use regular expressions to match a port name:
session.createPort('my-client', /_[lr12]/i);
```

#### Parameters
* `clientName` a `String` or `RegExp` to search with.
* `portName` a `String` or `RegExp` to search with.

#### Returns
* An instance of `Port`.


### Session.createProcess
Create a process definition that can be started and stopped as needed.

```js
// Specify an exact port name:
session.createPort('my-client', 'event-out');

// Use regular expressions to match a port name:
session.createPort('my-client', /_[lr12]/i);
```

#### Parameters
* `command` a `String` of the name of the command to execute.
* `args` an array of arguments to be passed to the function.

#### Returns
* An instance of `Process`.


### Session.combine
Combine the functions and events of two or more `Client`, `Process` or `Port` instances into one object.

```js
session.combine(
	session.createClient('my-client'),
	session.createProcess('calfjackhost', [
		'--client', 'my-client'
	])
);
```

#### Parameters
* One or more `Client` or `Port` to connect to.

#### Returns
* A new object.


### Session.on
Add an event listener to the `session`. For complete documentation of event functions see the [EventEmitter2](https://github.com/asyncly/EventEmitter2) documentation.

#### Events
##### open
Triggered when the session opens for the first time, or after a configuration change.

##### close
Triggered when the session is about to close.


### Client.createPort
Create an interface to a set of matching jack ports, even if they do not currently exist in the session. See `Port.isOnline`.

```js
session.createClient('my-client')
	.createPort('event-out');
```

#### Parameters
* `portName` a `String` or `RegExp` to search with.

#### Returns
* An instance of `Port`.


### Client.canConnect
Check to see if a client can successfully connect its outputs to the inputs of another client.

```js
session.createClient('client-1')
	.canConnect(session.createClient('client-2'));
```

#### Parameters
* `client`; a `Client` or `Port` to connect to.

#### Returns
* Either `true` or `false` depending on success.


### Client.connect
Connect the outputs of a client to the inputs of another client.

```js
session.createClient('client-1')
	.connect(session.createClient('client-2'));
```

#### Parameters
* `client`; a `Client` or `Port` to connect to.

#### Returns
* Either `true` or `false` depending on success.


### Client.disconnect
Disconnect the outputs of a client from the inputs of another port.

```js
session.createClient('client-1')
	.disconnect(session.createClient('client-2'));
```

#### Returns
* Either `true` or `false` depending on success.


### Client.isOnline
Check to see if a client is currently online and available.

```js
session.createClient('client-1')
	.isOnline();
```

#### Returns
* For online `true`.
* Or for offline `false`.


### Client.on
Add an event listener to a client. For complete documentation of event functions see the [EventEmitter2](https://github.com/asyncly/EventEmitter2) documentation.

#### Events
##### online
Triggered when the client goes online.

##### offline
Triggered when the client goes offline.


### Port.canConnect
Check to see if a port can successfully connect its outputs to the inputs of another port.

```js
session.createPort('client-1', 'out')
	.canConnect(session.createPort('client-2', 'in'));
```

#### Parameters
* `client`; a `Client` or `Port` to connect to.

#### Returns
* Either `true` or `false` depending on success.


### Port.connect
Connect the outputs of a port to the inputs of another port.

```js
session.createPort('client-1', 'out')
	.connect(session.createPort('client-2', 'in'));
```

#### Parameters
* `client`; a `Client` or `Port` to connect to.

#### Returns
* Either `true` or `false` depending on success.


### Port.disconnect
Disconnect the outputs of a port from the inputs of another port.

```js
session.createPort('client-1', 'out')
	.disconnect(session.createPort('client-2', 'in'));
```

#### Returns
* Either `true` or `false` depending on success.


### Port.isOnline
Check to see if a client is currently online and available.

```js
session.createClient('client-1')
	.isOnline();
```

#### Returns
* For online `true`.
* Or for offline `false`.


### Port.on
Add an event listener to a port. For complete documentation of event functions see the [EventEmitter2](https://github.com/asyncly/EventEmitter2) documentation.

#### Events
##### online
Triggered when the port goes online.

##### offline
Triggered when the port goes offline.