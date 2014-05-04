# Jack Sanity

Easy to use scripting for jackdbus.


## Install

You'll need to clone this repository and then run `npm install`, then you can symlink `bin/jack-sanity` to somewhere in your path.


## Documentation
### Patchbay
#### `Patchbay.findPort`
Find a currently running client by its name.

```js
Patchbay.findClient('full-client-name');
Patchbay.findClient(/partial-client-name/i);
```

##### Parameters
* `clientName` a `String` or `RegExp` to search with.
* `callback` a `Function` that will be called when and if a
client is found.

##### Returns
* The `Client` that was found.
* Or `false` when no client was found.


#### `Patchbay.findPort`
Find a currently running port by its client and port names.

```js
Patchbay.findPort('client', 'event-out');
Patchbay.findPort('client', /_[lr12]/i);
```

##### Parameters
* `clientName` a `String` or `RegExp` to search with.
* `portName` a `String` or `RegExp` to search with.
* `callback` a `Function` that will be called when and if a port is found.

##### Returns
* The `Port` that was found.
* Or `false` when no port was found.


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


#### `Patchbay.on`
Add an event listener to the `Patchbay`.

#### Events
* `client-appeared`, '{client-name}.client-appeared'; Triggered when a client joins the session.
* `client-disappeared`, `{client-name}.client-disappeared`; triggered when a client leaves the session.
* `port-appeared`, `{client-name}.port-appeared`; triggered when a port or a port belonging to the client joins the session.
* `port-disappeared`, `{client-name}.port-disappeared`; triggered when a port or a port belonging to the client leaves the session.
* `{client-name}.appeared`; triggered when a client or port belonging to a client joins the session.
* `{client-name}.disappeared`; triggered when a client or port belonging to a client leaves the session.


### Client
#### `Client.chainOutput`
Connect one or more clients in a row to the current client output.

```js
Patchbay
	.findClient('example')
	.chainOutput('effects-chain', 'system');
```

This would result in client 'example' outputs being linked to the
inputs of client 'effects-chain', whos outputs would then be linked
to the inputs for 'system'.

##### Parameters
* One or more of `clientName`; a `String` or `RegExp` to search with,
or `Client` to connect to a client you have previously searched for.

##### Returns
* The `Client` that started the chain.


#### `Client.connectInput`
Connect one or more clients as inputs to the current client.

```js
Patchbay
	.findClient('example')
	.connectInput('system');
```

##### Parameters
* One or more of `clientName`; a `String` or `RegExp` to search with,
or `Client` to connect to a client you have previously searched for.

##### Returns
* The current `Client`.


#### `Client.connectOutput`
Connect one or more clients to receive outputs from the current client.

```js
Patchbay
	.findClient('example')
	.connectOutput('system');
```

##### Parameters
* One or more of `clientName`; a `String` or `RegExp` to search with,
or `Client` to connect to a client you have previously searched for.

##### Returns
* The current `Client`.


#### `Client.disconnectAll`
#### `Client.disconnectAllInputs`
#### `Client.disconnectAllOutputs`
Disconnect all inputs and outputs from the current client.

```js
Patchbay
	.findClient('example')
	.disconnectAll();
```

##### Returns
* The current `Client`.


#### `Client.disconnectInput`
Disconnect one or more client outputs from the current clients input.

```js
Patchbay
	.findClient('example')
	.disconnectInput('system');
```

##### Parameters
* One or more of `clientName`; a `String` or `RegExp` to search with,
or `Client` to disconnect to a client you have previously searched for.

##### Returns
* The current `Client`.


#### `Client.disconnectOutput`
Disconnect one or more client inputs from the current clients output.

```js
Patchbay
	.findClient('example')
	.disconnectOutput('system');
```

##### Parameters
* One or more of `clientName`; a `String` or `RegExp` to search with,
or `Client` to disconnect to a client you have previously searched for.

##### Returns
* The current `Client`.


#### `Client.getConnections`
Gets a list of clients connected to the current client.

```js
Patchbay
	.findClient('example')
	.getConnections();
```

##### Returns
* The connected `Client`s in an `Array`.