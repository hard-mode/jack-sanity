# Jack Sanity

Easy to use scripting for jackdbus.


## Install

You'll need to clone this repository and then run `npm install`, then you can symlink `bin/jack-sanity` to somewhere in your path.


## Usage

Create a new `config.js' file and save it into the `config` directory, next you'll want to listen to some of the events (see documentation below for details):


```js
// Wait for a client to start:
Patchbay.on('your-client.appeared', function(client) {
	// And connect its output to the system playback:
	client.connectOutput('system');
});
```
In some situations it is important to trigger these events when Sanity starts, thankfully there's a utility function to let you do so:

```js
// The session has begun:
Patchbay.on('ready', function() {
	// Trigger the 'appeared' event for 'your-client' if it is running:
	Patchbay.simulateClient('your-client');
});
```


## Documentation

Full API documentation is available [on the website](http://rowan-lewis.github.io/jack-sanity/).