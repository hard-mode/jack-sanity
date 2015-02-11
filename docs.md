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


## Public API

The API available within configuration scripts.

### session global object
#### Methods
##### createClient(clientName, [portName])
Create an interface to a matching set of jack clients, even if they do not currently exist in the session. See `Client.isOnline`.

* `clientName` a `String` or `RegExp` to search with.
* Optionally `portName` a `String` or `RegExp` to search with.
* Returns an instance of `Client`.

```js
// Specify an exact client name:
session.createClient('my-client');

// Specify an exact port name:
session.createPort('my-client', 'event-out');

// Use regular expressions to match a client name:
session.createClient(/my-client/i);

// Use regular expressions to match a port name:
session.createPort('my-client', /left|right/i);
```


##### createProcess(command, args)
Create a process definition that can be started and stopped as needed.

* `command` a `String` of the name of the command to execute.
* `args` an array of arguments to be passed to the function.
* Returns an instance of `Process`.

```js
session.createProcess('calfjackhost', [
	'--client', 'my-client'
]);
```


##### combine(...)
Combine the functions and events of two or more `Client` and `Process` instances into one object.

* One or more `Client` or `Process` to combine to.
* Returns a new object.

```js
session.combine(
	session.createClient('my-client'),
	session.createProcess('calfjackhost', [
		'--client', 'my-client'
	])
);
```


#### Events
For complete documentation of event functions see the [EventEmitter2](https://github.com/asyncly/EventEmitter2) documentation.

##### open
Triggered when the session opens for the first time, or after a configuration change.

```js
session.on('open', function() {
	log('Studio session ready...');
})
```

##### close
Triggered when the session is about to close.

```js
session.on('close', function() {
	log('Studio session closed.');
})
```


### Client class
#### Methods
#### canConnect(client)
Check to see if a client can successfully connect its outputs to the inputs of another client.

* `client` a `Client` or to connect to.
* Returns either `true` or `false` depending on success.

```js
session.createClient('client-1')
	.canConnect(session.createClient('client-2'));
```


#### connect(client)
Connect the outputs of a client to the inputs of another client.

* `client` a `Client` or to connect to.
* Returns either `true` or `false` depending on success.

```js
session.createClient('client-1')
	.connect(session.createClient('client-2'));
```


##### createClient(portName)
Create an interface to a set of matching jack ports, even if they do not currently exist in the session. See `Client.isOnline`.

* `portName` a `String` or `RegExp` to search with.
* Returns an instance of `Client`.

```js
session.createClient('my-client')
	.createClient('event-out');
```


#### disconnect(client)
Disconnect the outputs of a client from the inputs of another port.

* `client` a `Client` or to connect to.
* Returns either `true` or `false` depending on success.

```js
session.createClient('client-1')
	.disconnect(session.createClient('client-2'));
```


#### isConnected([client])
Check to see if a client is connected to any client or connected to a specific client.

* Optionally `client` a `Client` to check for connections to.
* Returns `true` when connected and `false` when disconnected.

```js
// Is the client connected to anything?
session.createClient('client-1')
	.isConnected();

// Are these clients connected?
session.createClient('client-1')
	.isConnected(session.createClient('client-2'));
```


#### isDisonnected([client])
Check to see if a client is not connected to any client or not connected to a specific client.

* Optionally `client` a `Client` to check for connections to.
* Returns `true` when disconnected and `false` when connected.

```js
// Is the client connected to anything?
session.createClient('client-1')
	.isDisonnected();

// Are these clients connected?
session.createClient('client-1')
	.isDisonnected(session.createClient('client-2'));
```


#### isClient(clientName)
Check to see if this `Client` handles clients of the specified name.

* `clientName` a `String` compare with.
* Returns `true` when the name matches and `false` when it does not.

##### NOTE: When the `Client` has no associated client name, it will match _any_ Jack client.

```js
// Returns true:
session.createClient(/jack/i)
	.isClient('PulseAudio JACK Sink');

// Returns false:
session.createClient(/jack/i)
	.isClient('system');
```


#### isPort(portName)
Check to see if this `Client` handles ports of the specified name.

* `portName` a `String` compare with.
* Returns `true` when the name matches and `false` when it does not.

##### NOTE: When the `Client` has no associated port name, it will match _any_ Jack port.

```js
// Returns true:
session.createClient('client-1', /left|right/i)
	.isPort('left');

// Returns false:
session.createClient('client-1', /left|right/i)
	.isPort('center');
```


#### isOffline()
Check to see if a client is currently offline.

* Returns `true` when offline and `false` when online.

```js
session.createClient('client-1')
	.isOffline();
```


#### isOnline()
Check to see if a client is currently online and available.

* Returns `true` when online and `false` when offline.

```js
session.createClient('client-1')
	.isOnline();
```


### Events
For complete documentation of event functions see the [EventEmitter2](https://github.com/asyncly/EventEmitter2) documentation.

#### online
Triggered when the client or a port belonging to the client comes online.

#### offline
Triggered when the client or a port belonging to the client goes offline.

#### connect
Triggered when a port belonging to the client is connected to another port.

#### disconnect
Triggered when a port belonging to the client is disconnected from another port.


### Process class
#### Methods
##### close()
Close the currently running process.

* Returns either `true` or `false` depending on success.

```js
var myProc = session.createProcess('calfjackhost', [
	'--client', 'my-client'
]);

// Turn off my process at the end of the session:
session.on('close', function() {
	myProc.close();
});
```


##### isOpen()
Check to see if the process is running.

* Returns `true` when the process is running and `false` when it is not.

```js
var myProc = session.createProcess('calfjackhost', [
	'--client', 'my-client'
]);

// Turn off my process at the end of the session:
session.on('close', function() {
	if (myProc.isOpen()) {
		myProc.close();
	}
});
```


##### open()
Open an instance of the process.

* Returns either `true` or `false` depending on success.

```js
var myProc = session.createProcess('calfjackhost', [
	'--client', 'my-client'
]);

// Start my process at the beginning of the session:
session.on('open', function() {
	myProc.open();
});
```


#### Events
For complete documentation of event functions see the [EventEmitter2](https://github.com/asyncly/EventEmitter2) documentation.

##### open
Triggered when the process opens.

```js
myProc.on('open', function() {
	log('My process is ready...');
})
```

##### close
Triggered when the process has closed.

```js
myProc.on('close', function() {
	log('My process has closed.');
})
```