# pulsemon

A lightweight network connection monitor for vanilla JavaScript. Polls a URL at a set interval to reliably detect online/offline status, going beyond the unreliable `navigator.onLine`.

Built on top of [emttr](https://www.npmjs.com/package/emttr).

---

## Installation

```bash
npm install pulsemon
```

---

## Setup

Create a `ping.json` file in your public/assets folder. The contents don't matter, pulsemon only checks if the request resolves:

```json
{}
```

---

## Usage

```javascript
import Pulsemon, { NETWORK_STATUS, EVENTS } from 'pulsemon';

const pulsemon = new Pulsemon({
  url: '/ping.json',   // path to any static file on your server
  interval: 5000       // polling interval in ms (default: 5000)
});

const network$ = pulsemon.init();

network$.subscribe(EVENTS.NETWORK, ({ isOnline }) => {
  console.log(isOnline ? 'Back online' : 'Gone offline');
});

// Get current status at any time
console.log(pulsemon.networkStatus()); // 'ONLINE' | 'OFFLINE' | 'CHECKING'

// Stop polling when done
pulsemon.stop();
```

---

## API

### `new Pulsemon(options?)`

| Option | Type | Default | Description |
|---|---|---|---|
| `url` | `string` | `'/pulsemon/ping.json'` | URL to poll against |
| `interval` | `number` | `5000` | Polling interval in milliseconds |

### `pulsemon.init()`

Starts polling and returns an `Emttr` event bus instance. Subscribe to network events on the returned instance.

### `pulsemon.stop()`

Stops polling and clears all subscribers.

### `pulsemon.networkStatus()`

Returns the current network status as a string: `'ONLINE'`, `'OFFLINE'`, or `'CHECKING'`.

---

## Constants

### `NETWORK_STATUS`

```javascript
import { NETWORK_STATUS } from 'pulsemon';

NETWORK_STATUS.ONLINE    // 'ONLINE'
NETWORK_STATUS.OFFLINE   // 'OFFLINE'
NETWORK_STATUS.CHECKING  // 'CHECKING'
```

### `EVENTS`

```javascript
import { EVENTS } from 'pulsemon';

EVENTS.NETWORK  // 'network'
```

---

## Using with emttr

`pulsemon` pairs naturally with [emttr](https://www.npmjs.com/package/emttr) for app-wide network event broadcasting:

```javascript
import Emttr from 'emttr';
import Pulsemon, { EVENTS, NETWORK_STATUS } from 'pulsemon';

const bus = new Emttr();
const pulsemon = new Pulsemon({ url: '/ping.json' });

const network$ = pulsemon.init();

network$.subscribe(EVENTS.NETWORK, ({ isOnline }) => {
  bus.publish('networkChanged', { isOnline });
});

// Anywhere in your app
bus.subscribe('networkChanged', ({ isOnline }) => {
  console.log('Network status:', isOnline);
});
```

---

## How it works

Instead of relying on `navigator.onLine` (which returns `true` even without real internet access), pulsemon makes real HTTP requests to a URL you control. If the request resolves, the network is online. If it throws, the network is offline.

Concurrent requests are automatically deduplicated. If a poll is still in progress when the next interval fires, the pending poll is skipped and the last known status is preserved.

---

## License

MIT