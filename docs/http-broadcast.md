# Live HTTP broadcasts

[Back to README](../README.md#documentation)

## HTTP Broadcast (live GOTV)

`DemoReader` can parse a live CS2 GOTV broadcast over HTTP using the same event surface as `.dem` parsing. The broadcast feed is the protocol Valve's relays speak (`/sync` + `/{N}/start` + `/{N}/full` + `/{N}/delta`); see [Valve's reference relay](https://github.com/SteamDatabase/SteamTracking/blob/master/CSGO/csgo/scripts/relay.js).

### Quick start

```ts
import { DemoReader, EntityMode } from 'cs2parser';

const parser = new DemoReader();

parser.gameEvents.on('player_death', e => {
	console.log(`${e.attackerPlayer?.name} killed ${e.player?.name} with ${e.weapon}`);
});

await parser.parseHttpBroadcast('http://relay.example.com/match-id/', {
	entities: EntityMode.ALL
});
```

`parseHttpBroadcast` resolves when the broadcast ends (`{ reason: 'stop' }`), the relay stops returning new fragments (`'timeout'`), or the parser is cancelled. It throws if the relay returns a fatal error.

### `HttpBroadcastReader` (finer control)

Use `HttpBroadcastReader` directly when you want to inspect sync metadata, separate the start/run phases, or stop mid-stream.

```ts
import { DemoReader, HttpBroadcastReader } from 'cs2parser';

const parser = new DemoReader();
parser.on('broadcastsync', sync => console.log('connected', sync.map, 'tick', sync.tick));

const reader = new HttpBroadcastReader(parser, 'http://relay.example.com/match-id/');
await reader.start(); // /sync + /start + first /full
console.log('tail tick:', reader.tailTick);
const terminus = await reader.run(); // /N/delta loop
console.log(terminus.reason); // 'stop' | 'timeout' | 'cancelled' | 'error'
```

| Option                 | Type                                                    | Default            | Description                                                                                                                                |
| ---------------------- | ------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `entities`             | `EntityMode`                                            | `NONE`             | Same modes as `parseDemo`                                                                                                                  |
| `fetcher`              | `BroadcastFetcher`                                      | `globalThis.fetch` | Inject your own HTTP layer for tests, auth, or proxies                                                                                     |
| `deltaThrottle`        | `number` (ms)                                           | `1000`             | Minimum gap between successful `/delta` requests                                                                                           |
| `deltaRetryInterval`   | `number` (ms)                                           | `1000`             | Backoff on 404/405 (fragment not yet ready)                                                                                                |
| `maxDeltaRetries`      | `number`                                                | `10`               | Consecutive 404/405s on `/delta` before terminating with `'timeout'`                                                                       |
| `maxFullRetries`       | `number`                                                | `5`                | Consecutive 404/405s on `/full` before terminating with `'error'`                                                                          |
| `signal`               | `AbortSignal`                                           | —                  | External cancellation                                                                                                                      |
| `onFragmentError`      | `(err, ctx) => 'abort' \| 'continue'`                   | `'abort'`          | Skip a malformed fragment instead of aborting                                                                                              |
| `gameEventDescriptors` | `CMsgSource1LegacyGameEventList \| Uint8Array \| false` | bundled            | Preload the game-event descriptor list (see below). Defaults to the descriptor file shipped with the package; pass `false` to skip preload |

`reader.stop()` aborts the loop and pending fetches; `reader.sync`, `reader.fragment`, `reader.tailTick` expose live state.

### Mid-stream joins and `gameEventDescriptors`

Broadcasts deliver `CSVCMsg_GameEventList` once at game start. A client connecting at fragment 700 has already missed it, so `gameevent` payloads would arrive without resolvable names.

**The package embeds a default descriptor list** and the reader decodes it lazily when no `gameEventDescriptors` option is passed. Names like `player_death`, `weapon_fire`, `bomb_planted` resolve out of the box without fetching an extra asset. When updating the source binary, regenerate the embedded data with `npm run generate:broadcast-descriptors`.

```ts
const reader = new HttpBroadcastReader(parser, url, { entities: EntityMode.ALL });
// gameEventDescriptors omitted → bundled descriptors used automatically
```

To override with a fresher list (e.g. after a CS2 patch changed event IDs), generate one from any `.dem` of the same build:

```bash
# ~15 KB output, one-time per game build
bun scripts/dump-event-descriptors.ts path/to/demo.dem event-descriptors.bin
```

```ts
import fs from 'fs';
const reader = new HttpBroadcastReader(parser, url, {
	entities: EntityMode.ALL,
	gameEventDescriptors: fs.readFileSync('event-descriptors.bin')
});
```

Pass `gameEventDescriptors: false` to disable preload entirely — useful if the broadcast you're connecting to actually delivers its own descriptor list and you'd rather trust that one. You can also pass an in-memory `CMsgSource1LegacyGameEventList` instead of bytes.

The reader emits a synthetic `gameeventlist` event before processing the first fragment so the descriptor map is populated immediately.

### Wire format notes

Broadcasts deliver bytes in a slightly different framing from `.dem` files; this is handled internally but worth knowing if you're debugging at the protocol layer:

- **Frame header** is `[uvarint cmd][LE u32 tick][1 reserved byte][LE u32 size][payload]`, with `cmd === 0` as the end-of-stream marker. (`.dem` files use varints for tick and size and have no reserved byte.)
- **`DEM_Packet` / `DEM_SignonPacket` payloads** are the raw SVC bit-stream — they are _not_ wrapped in a `CDemoPacket` proto envelope as they are in `.dem` files.
- **`DEM_FullPacket.string_table`** carries the tables that have changed since the last full packet. The reader applies these on every full fragment so `instancebaseline` reflects the current tick — required for entity parsing on mid-stream joins.
- **Compression** is per-command via the `DEM_IsCompressed` bit (`cmd | 0x40`) and uses Snappy.

### Events

All `DemoReader` events fire as usual. One additional event:

```ts
parser.on('broadcastsync', sync => {
	// BroadcastSyncDto from /sync — fragment, signup_fragment, tick, tps, map, ...
});
```

Terminus reasons returned by `run()`:

| Reason        | Meaning                                                                              |
| ------------- | ------------------------------------------------------------------------------------ |
| `'stop'`      | Broadcast ended cleanly (`cmd === 0` end-of-stream marker received)                  |
| `'timeout'`   | `maxDeltaRetries` consecutive 404/405s on `/delta` (relay stopped advancing)         |
| `'cancelled'` | `reader.stop()`, `parser.cancel()`, or external `signal` aborted                     |
| `'error'`     | Fatal error (HTTP failure, malformed fragment without `onFragmentError: 'continue'`) |

### Diagnostic scripts

| Script                                                   | Purpose                                                                            |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `examples/broadcast.ts <url> [descriptors.bin]`          | Log sync/server info, sample the first 10 raw events, and parse until completion or cancellation |
| `scripts/dump-event-descriptors.ts <demo.dem> [out.bin]` | Extract `CMsgSource1LegacyGameEventList` for `gameEventDescriptors`                |
