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

### Patchbay API
#### `Patchbay.findClient`

Find a currently running client by name.

```js
Patchbay.findClient('full-client-name');
Patchbay.findClient(/partial-client-name/i);
```

##### Arguments

| Name			| Type					| Description							|
|---------------|-----------------------|---------------------------------------|
| `clientName`	| `String`, `RegExp`	| Client name to search for.			|
| `callback`	| `Function`			| Callback function fired on success.	|
|				|						| `function(client) { ... }`			|

##### Returns

| Type		| Description	|
|-----------|---------------|
| `Client`	| The client.	|
| `false`	| On failure.	|


#### `Patchbay.findPort`

Find a currently running port by client and port name.

```js
Patchbay.findPort('client', 'event-out');
Patchbay.findPort('client', /_[lr12]/i);
```

##### Arguments

| Name			| Type					| Description							|
|---------------|-----------------------|---------------------------------------|
| `clientName`	| `String`, `RegExp`	| Client name to search for.			|
| `portName`	| `String`, `RegExp`	| Port name to search for.				|
| `callback`	| `Function`			| Callback function fired on success.	|
|				|						| `function(client, port) { ... }`		|

##### Returns

| Type		| Description	|
|-----------|---------------|
| `Port`	| The port.	|
| `false`	| On failure.	|


#### `Patchbay.simulateClient`
Trigger a client-appeared event for the named client.

```js
Patchbay.simulateClient('full-client-name');
Patchbay.simulateClient(/partial-client-name/i);
```

##### Parameters
* `clientName` a `String` or `RegExp` to search with.

##### Returns
* The `Client` client the event was triggered for.
* Or `false` when no port was found.


### Client API
#### `Client.chainOutput`

Connect multiple clients in a row to the current client output.

```js
Patchbay
	.findClient('example')
	.chainOutput('effects-chain', 'system');
```

##### Arguments

| Name			| Type					| Description					|
|---------------|-----------------------|-------------------------------|
| `clientName`	| `String`, `RegExp`	| Client chain outputs with.	|
| ...			|						|								|

##### Returns

| Type		| Description	|
|-----------|---------------|
| `Client`	| The client.	|
| `false`	| On failure.	|