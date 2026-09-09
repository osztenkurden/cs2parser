![CI](https://img.shields.io/github/actions/workflow/status/osztenkurden/cs2parser/.github/workflows/ci.yml?branch=master)
![Dependencies](https://img.shields.io/librariesio/github/osztenkurden/cs2parser)
![Downloads](https://img.shields.io/npm/dm/cs2parser)
![Version](https://img.shields.io/npm/v/cs2parser)

# cs2parser

A fast, typed CS2 demo parser for Node.js, Bun, and modern browsers. Both exports use an embedded WASM Snappy decoder; production installs require no native addons.

Parses `.dem` files and live HTTP GOTV broadcasts from Counter-Strike 2, providing typed access to entities, players, game events, and more.

## Install

```bash
npm install cs2parser
```

## Quick Start

```ts
import { createReadStream } from 'fs';
import { DemoReader, EntityMode } from 'cs2parser';

const parser = new DemoReader();

parser.gameEvents.on('player_death', event => {
	const attacker = event.attackerPlayer;
	const victim = event.player;
	if (attacker && victim) {
		console.log(`${attacker.name} killed ${victim.name} with ${event.weapon}`);
	}
});

parser.on('end', () => {
	for (const player of parser.playerControllers) {
		console.log(player.name, player.kills, player.deaths, player.position);
	}
});

await parser.parseDemo(createReadStream('path/to/demo.dem'), { entities: EntityMode.ALL });
```

## Browser

Use the dedicated `cs2parser/browser` export. It shares the parser, entity helpers, and events with the server export and uses an embedded WASM Snappy decoder. No Node globals, separate WASM assets, workers, or cross-origin isolation are required. Applications can also use this export inside their own module worker.

```ts
import { DemoReader, EntityMode } from 'cs2parser/browser';

// file is a File from an <input type="file"> or drag-and-drop.
const parser = new DemoReader();
parser.gameEvents.on('player_death', event => console.log(event.weapon));
parser.on('progress', bytesParsed => console.log(bytesParsed / file.size));
const result = await parser.parseDemo(file.stream(), { entities: EntityMode.ALL });

// Fetch a demo without buffering the whole response.
const response = await fetch('/match.dem');
if (!response.ok || !response.body) throw new Error('Unable to fetch demo');
await new DemoReader().parseDemo(response.body);

// Metadata reads use only the relevant File/Blob slices.
const header = await DemoReader.parseHeaderAsync(file);
const serverInfo = await DemoReader.parseServerInfoAsync(file);
const fileInfo = await DemoReader.parseFileInfoAsync(file);
```

Browser `parseDemo` accepts `Uint8Array` and `ReadableStream<Uint8Array>`. Browser metadata helpers use the `Async` suffix and accept `Uint8Array` and `Blob` (including `File`). Filesystem paths, synchronous metadata, Node streams, and the `stream` option are available only from the server export.

HTTP broadcasts use the same API: `await new DemoReader().parseHttpBroadcast(relayUrl)`. The relay must allow your page's origin through CORS, and HTTPS pages need an HTTPS relay.

### WASM Snappy

The browser parser reuses its decompression storage. Event byte payloads have their own storage and remain safe to retain. The decoder also supports caller-owned output for standalone raw Snappy blocks:

```ts
import { SnappyDecoder, snappyUncompressedLength } from 'cs2parser/browser';

const decoder = new SnappyDecoder();
const output = new Uint8Array(snappyUncompressedLength(compressed));
const decoded = decoder.uncompress(compressed, output);
// Reuse output on later calls when it is large enough. decoded is a view into output.
decoder.release(); // Drop internal WASM/scratch storage; decoded remains valid.
```

Omitting `output` allocates an owned result. Supplying an undersized buffer throws `RangeError`; malformed blocks throw an error. Impossible expansion lengths are rejected before allocating output or growing WASM memory. `snappyUncompressedLength()` reads only the prefix, not block validity; do not use it to allocate unbounded output from untrusted input. WASM memory grows as needed and is reused, with copies into WASM memory and into the destination. `DemoReader` releases decoder storage on completion, failure, and cancellation; standalone decoders can call `release()` and be reused afterward. A restrictive Content Security Policy must [allow WebAssembly compilation](https://www.w3.org/TR/CSP3/#can-compile-wasm-bytes) (for example, `script-src 'self' 'wasm-unsafe-eval'`). Modern WebAssembly bulk-memory support is required. The server uses the same decoder for demos, broadcasts, and metadata, while retaining filesystem and Node stream inputs. Native Snappy is a development-only dependency for fixture generation and differential tests.

The original decoder source is `wasm/snappy.c`. After changing it, run `npm run build:snappy` with Clang and `wasm-ld` installed. Normal package builds use the checked-in embedded bytes and need no C compiler.

### Migration

Upgrading from 1.x? See the [migration guide](MIGRATION.md) for API changes and server-only sync/async metadata timings.

## parseHeader

Server-only synchronous method that reads the demo file header without parsing the full file. Fast and low-memory.

```ts
const header = DemoReader.parseHeader('path/to/demo.dem');
if (header) {
	console.log(header.map_name); // e.g. "de_dust2"
	console.log(header.server_name); // server name
	console.log(header.build_num); // CS2 build number
	console.log(header.patch_version); // patch version
	console.log(header.game); // undefined on premier
}
```

Returns `null` if the header is absent or truncated, and throws on I/O or malformed-data errors. Accepts file paths, `Buffer`, and `Uint8Array`; reads the header's declared size, including headers larger than 4 KB. Use `parseHeaderAsync` for promise-based reads or Blob/File inputs.

## parseServerInfo

Server-only synchronous method that reads server info from the first few packets without parsing the full demo. Fast and low-memory.

```ts
const info = DemoReader.parseServerInfo('path/to/demo.dem');
if (info) {
	console.log(info.map_name); // e.g. "de_dust2"
	console.log(info.server_name); // server name
	console.log(info.max_clients); // max player slots
	console.log(info.game_dir); // e.g. "csgo"
}
```

Returns `null` if server info cannot be found. Reads only the demo's signon section (the setup frames at the start, before gameplay begins) instead of the whole file, so it stays fast and low-memory on demos of any size.

## Asynchronous Metadata

Use the `Async` suffix for promise-based metadata reads:

```ts
import { DemoReader } from 'cs2parser';

const header = await DemoReader.parseHeaderAsync('demo.dem');
const serverInfo = await DemoReader.parseServerInfoAsync('demo.dem');
const fileInfo = await DemoReader.parseFileInfoAsync('demo.dem');
```

These methods resolve to metadata or `null` for absent/truncated metadata, and reject on I/O or malformed-data errors. The server accepts paths, `Buffer`, `Uint8Array`, and Blob/File inputs. The browser exposes only the `Async` methods, accepting bytes or Blob/File. Both paths read only relevant frame headers/bodies and seek directly to file-info trailers.

The server's unsuffixed `parseHeader`, `parseServerInfo`, and `parseFileInfo` methods accept paths, `Buffer`, or `Uint8Array` and block the calling thread. Use them in batch processes/workers; each call closes its file and releases decoder storage before returning. `parseDemo()` remains asynchronous.

## parseDemo

A single method accepts the inputs below. File paths stream by default on the server.

```ts
// File path (streams by default )
await parser.parseDemo('demo.dem', { entities: EntityMode.ALL });

// File path with larger chunks (4 MiB, through the shared async stream loop)
await parser.parseDemo('demo.dem', { entities: EntityMode.ALL, stream: false });

// Node Readable stream (server export)
await parser.parseDemo(createReadStream('demo.dem'), { entities: EntityMode.ALL });

// Pre-loaded Uint8Array or Node Buffer (holds the whole file in memory)
await parser.parseDemo(buffer, { entities: EntityMode.ALL });

// Web Stream (both exports)
await parser.parseDemo(file.stream(), { entities: EntityMode.ALL });
```

Parsing takes ownership of a supplied stream. Early completion, failure, and `cancel()` cancel unread input; cleanup releases the reader lock. Each `DemoReader` handles one demo or broadcast.

All input types resolve with the same object passed to the `end` event: `{ incomplete: boolean, error?: any, reason?: EndReason }`. Check the result without adding an `end` or `error` listener:

```ts
const { incomplete, error, reason } = await parser.parseDemo('demo.dem', { entities: EntityMode.ALL });
if (error) {
	console.error('Parsing failed:', error);
} else if (incomplete) {
	console.warn('Parsing did not finish:', reason ?? 'incomplete demo');
}
```

### Entity Modes

| Mode                         | Entities        | Round events | Speed                |
| ---------------------------- | --------------- | ------------ | -------------------- |
| `EntityMode.NONE`            | none            | no           | fastest              |
| `EntityMode.ONLY_GAME_RULES` | game rules only | yes          | skips unused values |
| `EntityMode.ALL`             | all             | yes          | full parsing         |

`ONLY_GAME_RULES` parses the entity bitstream but only stores `CCSGameRulesProxy` properties. This enables synthetic `round_start`/`round_end` events without populating the full entities array.

| Input                          | Returns                    | Memory |
| ------------------------------ | -------------------------- | ------ |
| `string` path                  | Promise of the end payload | low    |
| `string` path + `stream: false` | Promise of the end payload | low    |
| `Readable` stream              | Promise of the end payload | low    |
| `Uint8Array` / `Buffer`        | Promise of the end payload | high   |
| `ReadableStream<Uint8Array>`   | Promise of the end payload | low    |

### Parse Settings

Network messages are decoded when something is listening for them, so most of the
time there is nothing to configure — see [Network Messages](#network-messages).

`parseDemo` also accepts one optional boolean per message name, for the two cases
subscription can't express:

| Option             | Effect                                            |
| ------------------ | ------------------------------------------------- |
| `<message>: true`  | Decode the message even with no listener attached |
| `<message>: false` | Skip the message even if a listener is attached   |

```ts
// Usually all you need:
parser.on('svc_VoiceData', data => {});
await parser.parseDemo('demo.dem', { entities: EntityMode.ALL });

// Force a message off for one parse, even though something is listening:
await parser.parseDemo('demo.dem', { entities: EntityMode.ALL, svc_UserCmds: false });
```

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

## Reader State

`DemoReader` exposes a handful of live properties that update during parsing. They're useful inside game-event handlers or low-level listeners.

| Member              | Type                      | Description                                                                                                                                                                 |
| ------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `header`            | `CDemoFileHeader \| null` | Populated after the first `'header'` event                                                                                                                                  |
| `entities`          | `AnyEntity[]`             | Sparse array indexed by entity ID. Each slot is a `TypedEntity` for known classes or `BaseEntity` otherwise; `undefined` slots mean the entity was deleted or never existed |
| `currentTick`       | `number`                  | Tick currently being processed (`-1` before the first frame)                                                                                                                |
| `currentTime`       | `number`                  | `currentTick * tickInterval` — requires `'serverinfo'` to have arrived                                                                                                      |
| `gameEvents`        | `GameEvents`              | Typed emitter for in-game events (see [Game Events](#game-events))                                                                                                          |
| `players`           | `CMsgPlayerInfo[]`        | Userinfo rows from the string table, sparse-indexed by `userid & 0xff`                                                                                                      |
| `playerControllers` | `Player[]`                | All live `CCSPlayerController` entities wrapped as `Player` (requires `EntityMode.ALL`)                                                                                     |
| `teams`             | `Team[]`                  | All live `CCSTeam` entities (requires `EntityMode.ALL`)                                                                                                                     |
| `smokes`            | `SmokeHelper[]`           | All live `CSmokeGrenadeProjectile` smoke clouds (requires `EntityMode.ALL`)                                                                                                 |
| `gameRules`         | `GameRules \| null`       | Wrapper around the current `CCSGameRulesProxy` entity                                                                                                                       |

### Cancelling a parse

```ts
const parser = new DemoReader();

parser.on('tickend', () => {
	if (parser.currentTick >= 1000) parser.cancel();
});

await parser.parseDemo('demo.dem', { entities: EntityMode.ALL });
```

`cancel()` aborts an in-flight parse. It destroys the underlying stream (if any), emits a `'cancel'` event, and then an `'end'` event with `{ incomplete: true }`. Calling `cancel()` or `parseDemo()` on a reader that has already ended throws.

## Players

### Basic player info — `parser.players`

`parser.players` returns `CMsgPlayerInfo[]` from the userinfo string table. This is the fastest way to get the roster of a demo: names and Steam IDs are available without parsing entities, so it works even with the default `EntityMode.NONE`.

The array is **sparse** — each entry lives at index `player.userid & 0xff`, so empty slots read as `undefined`. That's the same slot index used by game events, which makes it the natural way to look up the attacker or victim of a kill by raw userid.

```ts
await parser.parseDemo('demo.dem'); // EntityMode.NONE — no entity parsing

// Iterate — guard against sparse holes, or call .filter(Boolean) first.
for (const player of parser.players) {
	if (!player) continue;
	console.log(player.name, player.steamid);
}
```

Each `CMsgPlayerInfo` is a plain object decoded from the demo's `userinfo` string table:

| Field        | Type                   | Description                                         |
| ------------ | ---------------------- | --------------------------------------------------- |
| `name`       | `string \| undefined`  | Display name                                        |
| `steamid`    | `string \| undefined`  | Decimal ID; bots/TV may have server-generated IDs that differ from their controller's `"0"` |
| `xuid`       | `string \| undefined`  | Account identifier; may be `"0"` for bots           |
| `userid`     | `number \| undefined`  | In-game user id (the slot index is `userid & 0xff`) |
| `fakeplayer` | `boolean \| undefined` | `true` for fake clients, including bots and TV       |
| `ishltv`     | `boolean \| undefined` | `true` for the HLTV/GOTV observer slot              |

`parser.players` is populated from `createstringtable` / `updatestringtable` events as soon as the userinfo table arrives, and cleared by `clearallstringtables`. It is usable inside `'end'` and during parsing (e.g. once the first `round_start` fires).

For per-recording statistics, track the full `userid`, not just the slot: a new connection can reuse a slot. Do not use bot names or Steam IDs as unique keys. Helpers expose live state and can be recreated by full snapshots, so copy values when recording history instead of using `Player` object identity as a persistent key.

#### Looking up players during a game event

Game events like `player_death` expose `userid` / `attacker` / `assister` fields whose low byte identifies a slot in `parser.players`; `0xff` means no player. You can use these to look up `CMsgPlayerInfo` without entity parsing.

```ts
const parser = new DemoReader();

parser.gameEvents.on('player_death', event => {
	const attacker = parser.players[event.attacker & 0xff];
	const victim = parser.players[event.userid & 0xff];
	const assister = parser.players[event.assister & 0xff];

	if (!attacker || !victim) return;

	console.log(
		`${attacker.name} (${attacker.steamid}) killed ${victim.name} with ${event.weapon}` +
			(event.headshot ? ' (HS)' : '') +
			(assister ? `, assisted by ${assister.name}` : '')
	);
});

// Runs with EntityMode.NONE — no entity parsing needed for names + steamids.
await parser.parseDemo('demo.dem');
```

This pattern is the fast path when you only need to log kills, build a scoreboard, or group events by player identity — anything that doesn't require live entity state like position, health, or money. For those, use `event.attackerPlayer` / `event.player` (the auto-resolved `Player` helpers), which require `EntityMode.ALL`.

### Entity-backed helpers — `parser.playerControllers`

`parser.playerControllers` returns `Player[]` helper objects backed by live entity data. This requires `EntityMode.ALL` because it reads `CCSPlayerController` and `CCSPlayerPawn` properties.

```ts
await parser.parseDemo(createReadStream('demo.dem'), { entities: EntityMode.ALL });

for (const player of parser.playerControllers) {
	console.log(player.name, player.steamId, player.teamNumber);
	console.log('  k/d/a:', player.kills, player.deaths, player.assists);
	console.log('  money:', player.money, 'mvps:', player.mvps);
	console.log('  alive:', player.isAlive, 'health:', player.health, 'armor:', player.armor);
	console.log('  position:', player.position);
}
```

### Player lookups

Several `DemoReader` methods resolve a `Player` helper from different identifiers. All require `EntityMode.ALL`.

```ts
// By controller entity ID (pawn handles identify a different entity)
const p1 = parser.getPlayer(1);

// By zero-based player slot, including humans, bots, and TV
const samePlayer = parser.getPlayerBySlot(0);

// From a CMsgPlayerInfo (e.g. an element of parser.players)
const p2 = parser.getPlayerByInfo(parser.players[0]);

// By Steam account ID — the lower 32 bits of SteamID64,
// i.e. the trailing number in SteamID3 form: [U:1:918429678] -> 918429678
const p3 = parser.getByAccountId(918429678);
```

`getPlayerBySlot` and `getPlayerByInfo` use direct slot lookups for humans, bots, and TV. `getPlayerByInfo` checks the full `userid` against the current roster and returns `null` for stale entries or missing controllers. Inputs containing only a Steam ID retain the Steam ID scan. `getByAccountId` returns `null` for zero, which cannot distinguish bots or TV; other IDs use a cache with a linear-scan fallback.

Game-event annotations (`player`, `attackerPlayer`, `assisterPlayer`) use the same slot mapping. A pawn reference can point at a previous pawn, for example when grenade damage continues after a respawn; it does not override the player identity.

### Bot analysis

```powershell
bun scripts/analyze-players.ts "C:\steamcmd\bot_gameplay.dem"
```

The script reports human and bot scores, event K/D/A, damage, shots, headshots, position, aim angles, command counts, and annotation coverage. It enables `EntityMode.ALL`; optional messages still require a listener.

Bot input commands may not be present in a recording. In this fixture, all `usercommand` messages belong to the human player. Bot movement and aim remain available through pawn properties, while `GE_FireBulletsId` messages provide shot origin, angles, recoil, spread, and inaccuracy. Subscribe to that message and resolve `message.player` through `parser.getPawn(message.player & 0x7ff)?.controller` when the field is defined. These are shot observations, not a reconstruction of missing bot inputs.

Helper defaults such as `0` or `false` can also mean a property has not arrived. Inspect raw `player.entity?.properties` or `player.pawn?.entity?.properties` when distinguishing missing data from a measured zero matters.

### Player Helper

The `Player` class wraps a `CCSPlayerController` entity. It links to the player's pawn entity for position, health, and combat state. Pawn-backed getters return `0`/`false`/`null` defaults while the player has no pawn (e.g. dead, spectating, or disconnected).

**Identity**

| Property      | Type                                              | Source                               |
| ------------- | ------------------------------------------------- | ------------------------------------ |
| `entityId`    | `number` (readonly)                               | Controller entity index              |
| `userSlot`    | `number`                                          | Zero-based player slot               |
| `entity`      | `TypedEntity<'CCSPlayerController'> \| undefined` | Raw controller entity                |
| `name`        | `string`                                          | Controller                           |
| `steamId`     | `string`                                          | Controller (empty if not yet set)    |
| `isConnected` | `boolean`                                         | Controller (`m_iConnected === 0`)    |
| `isBot`       | `boolean`                                         | Userinfo `fakeplayer`, excluding TV; false if unknown |
| `isHLTV`      | `boolean`                                         | Userinfo `ishltv`; false if unknown   |
| `clanTag`     | `string`                                          | Controller                           |
| `color`       | `number`                                          | Comp teammate color (`-1` if unset)  |
| `userInfo`    | `CMsgPlayerInfo \| null`                          | Matching entry from `parser.players` |

**Team**

| Property     | Type           | Source             |
| ------------ | -------------- | ------------------ |
| `teamNumber` | `number`       | Controller         |
| `team`       | `Team \| null` | Linked team entity |

**Pawn link**

| Property       | Type                 | Source                              |
| -------------- | -------------------- | ----------------------------------- |
| `pawnEntityId` | `number \| null`     | Decoded from `m_hPlayerPawn` handle |
| `pawn`         | `PlayerPawn \| null` | Linked pawn entity                  |
| `isAlive`      | `boolean`            | Controller (`m_bPawnIsAlive`)       |

**Pawn shortcuts** (delegate to `pawn`, return a safe default if there's no pawn)

| Property                   | Type                             |
| -------------------------- | -------------------------------- |
| `health` / `armor`         | `number`                         |
| `position`                 | `Vector \| null`                 |
| `eyeAngles`                | `{ pitch: number; yaw: number }` |
| `hasDefuser` / `hasHelmet` | `boolean`                        |
| `isScoped` / `isDefusing`  | `boolean`                        |

**Economy**

| Property             | Type     |
| -------------------- | -------- |
| `money`              | `number` |
| `totalCashSpent`     | `number` |
| `cashSpentThisRound` | `number` |

**Match totals** (from `CCSPlayerController_ActionTrackingServices`)

| Property                             | Type     |
| ------------------------------------ | -------- |
| `kills` / `deaths` / `assists`       | `number` |
| `damage`                             | `number` |
| `headshotKills`                      | `number` |
| `utilityDamage`                      | `number` |
| `enemiesFlashed`                     | `number` |
| `enemy3Ks` / `enemy4Ks` / `enemy5Ks` | `number` |
| `objective`                          | `number` |

**Per-round stats** (from `CSPerRoundStats_t`, reset between rounds)

| Property                                         | Type     |
| ------------------------------------------------ | -------- |
| `round_kills` / `round_deaths` / `round_assists` | `number` |
| `round_damage`                                   | `number` |
| `round_headshotKills`                            | `number` |
| `round_equipmentValue`                           | `number` |
| `round_cashEarned`                               | `number` |
| `round_utilityDamage`                            | `number` |
| `round_enemiesFlashed`                           | `number` |
| `round_liveTime`                                 | `number` |

**General**

| Property                  | Type     |
| ------------------------- | -------- |
| `mvps` / `score` / `ping` | `number` |

### PlayerPawn Helper

`parser.getPawn(entityId)` returns a `PlayerPawn` helper for a `CCSPlayerPawn` entity. The `controller` property navigates back to the owning `Player`.

| Property                                | Type                                        | Description                                 |
| --------------------------------------- | ------------------------------------------- | ------------------------------------------- |
| `entityId`                              | `number`                                    | Pawn entity index                           |
| `entity`                                | `TypedEntity<'CCSPlayerPawn'> \| undefined` | Raw pawn entity                             |
| `health` / `maxHealth`                  | `number`                                    | `maxHealth` defaults to `100`               |
| `armor`                                 | `number`                                    |                                             |
| `lifeState`                             | `number`                                    | Raw life state flags                        |
| `isAlive`                               | `boolean`                                   | `lifeState === 0`                           |
| `position`                              | `Vector`                                    | Computed from cell + vec coords             |
| `eyeAngles`                             | `{ pitch: number; yaw: number }`            |                                             |
| `hasDefuser` / `hasHelmet`              | `boolean`                                   | From `CCSPlayer_ItemServices`               |
| `isScoped` / `isWalking` / `isDefusing` | `boolean`                                   |                                             |
| `flags`                                 | `number`                                    | Raw `m_fFlags` bitmask                      |
| `ownerEntityHandle`                     | `number`                                    | Raw `m_hOwnerEntity` handle                 |
| `controller`                            | `Player \| undefined`                       | Owning controller, linked by `pawnEntityId` |

`Vector` is re-exported from the package root: `import type { Vector } from 'cs2parser'`.

## Teams

```ts
import { TeamNumber } from 'cs2parser';

for (const team of parser.teams) {
	if (team.teamNumber < TeamNumber.Terrorist) continue; // skip Unassigned/Spectator
	console.log(team.teamName, team.clanName, team.score);
	console.log(
		'  members:',
		team.members.map(p => p.name)
	);
}
```

`TeamNumber` is a const object you can import from the package root:

```ts
TeamNumber.Unassigned; // 0
TeamNumber.Spectators; // 1
TeamNumber.Terrorists; // 2
TeamNumber.CounterTerrorists; // 3
```

| Property                                       | Type                                  |
| ---------------------------------------------- | ------------------------------------- |
| `entityId`                                     | `number`                              |
| `entity`                                       | `TypedEntity<'CCSTeam'> \| undefined` |
| `teamNumber`                                   | `TeamNumber`                          |
| `teamName`                                     | `string`                              |
| `clanName`                                     | `string`                              |
| `score` / `scoreFirstHalf` / `scoreSecondHalf` | `number`                              |
| `members`                                      | `Player[]`                            |

## Game Rules

```ts
const rules = parser.gameRules;
if (rules) {
	console.log(rules.roundsPlayed, rules.phase, rules.isWarmup);
}
```

`parser.gameRules` is `null` until the first `CCSGameRulesProxy` entity appears. Available with `EntityMode.ALL` or `EntityMode.ONLY_GAME_RULES`.

| Property                    | Type                                                           | Description                                    |
| --------------------------- | -------------------------------------------------------------- | ---------------------------------------------- |
| `entityId`                  | `number`                                                       | Proxy entity index                             |
| `entity`                    | `TypedEntity<'CCSGameRulesProxy'> \| undefined`                | Raw proxy entity                               |
| `isWarmup`                  | `boolean`                                                      |                                                |
| `isFreezePeriod`            | `boolean`                                                      |                                                |
| `isGamePaused`              | `boolean`                                                      |                                                |
| `isTerroristTimeOutActive`  | `boolean`                                                      |                                                |
| `isCTTimeOutActive`         | `boolean`                                                      |                                                |
| `roundsPlayed`              | `number`                                                       |                                                |
| `gamePhase`                 | `number`                                                       | Raw phase number from the game rules proxy     |
| `phase`                     | `"first" \| "second" \| "halftime" \| "postgame" \| "unknown"` | Human-readable mapping of `gamePhase`          |
| `roundTime`                 | `number`                                                       | Current round length in seconds                |
| `roundStartTime`            | `number`                                                       | Server time at which the current round started |
| `terroristTimeOutRemaining` | `number`                                                       | Seconds remaining in the T timeout             |
| `ctTimeOutRemaining`        | `number`                                                       | Seconds remaining in the CT timeout            |

### WinRoundReason

`WinRoundReason` is a const object with the round-end reason codes emitted on synthetic `round_end` events. Import from the package root:

```ts
import { WinRoundReason } from 'cs2parser';

parser.gameEvents.on('round_end', event => {
	if (event.reason === WinRoundReason.BOMB_DEFUSED) console.log('CTs defused the bomb');
});
```

| Name                     | Value |
| ------------------------ | ----- |
| `INVALID`                | `-1`  |
| `STILL_IN_PROGRESS`      | `0`   |
| `TARGET_BOMBED`          | `1`   |
| `VIP_ESCAPED`            | `2`   |
| `VIP_ASSASSINATED`       | `3`   |
| `T_ESCAPED`              | `4`   |
| `CT_PREVENT_ESCAPE`      | `5`   |
| `ESCAPING_T_NEUTRALIZED` | `6`   |
| `BOMB_DEFUSED`           | `7`   |
| `T_ELIMINATED`           | `8`   |
| `CT_ELIMINATED`          | `9`   |
| `ROUND_DRAW`             | `10`  |
| `ALL_HOSTAGES_RESCUED`   | `11`  |
| `TARGET_SAVED`           | `12`  |
| `HOSTAGES_NOT_SAVED`     | `13`  |
| `T_NOT_ESCAPED`          | `14`  |
| `VIP_NOT_ESCAPED`        | `15`  |
| `GAME_COMMENCING`        | `16`  |
| `T_SURRENDER`            | `17`  |
| `CT_SURRENDER`           | `18`  |
| `T_PLANTED`              | `19`  |
| `CT_REACHED_HOSTAGE`     | `20`  |

## Smokes

`parser.smokes` returns `SmokeHelper[]` for live `CSmokeGrenadeProjectile` clouds (requires `EntityMode.ALL`); `parser.getSmoke(entityId)` resolves one by entity ID. Each smoke networks a voxel **seed** — the occupancy the game client grows the visible cloud from — which the helper decodes on demand.

```ts
for (const smoke of parser.smokes) {
	console.log(smoke.detonationPos); // Vector | null — cloud centre
	console.log(smoke.voxels); // Vector[] — seed voxel world positions
}
```

| Property        | Type             | Description                                        |
| --------------- | ---------------- | -------------------------------------------------- |
| `entityId`      | `number`         | Projectile entity index                            |
| `detonationPos` | `Vector \| null` | World-space cloud centre                           |
| `hasVoxelData`  | `boolean`        | True once the voxel seed has arrived               |
| `voxels`        | `Vector[]`       | Seed voxels as world positions, computed on demand |
| `gridVoxels`    | `SmokeVoxel[]`   | Raw `[0, 32)` grid coords + per-voxel state bytes  |
| `voxelCount`    | `number`         | Number of seed voxels                              |

The voxel stream was reverse-engineered from the game client: positions use the verified transform `world = (grid − 16) · 20 + detonationPos` with per-axis signs `[−1, +1, +1]`. Low-level decoders (`decodeSmokeVoxelJournal`, `voxelToWorld`, `mortonEncode3`, …) are also exported for advanced use.

## Game Events

Events are emitted at the end of each tick. Player references are auto-resolved — any `userid` / `attacker` / `assister` field is matched to a `Player` helper and exposed as `player`, `attackerPlayer`, `assisterPlayer`.

```ts
parser.gameEvents.on('player_death', event => {
  event.player;          // Player | null (victim)
  event.attackerPlayer;  // Player | null
  event.assisterPlayer;  // Player | null
  event.weapon;          // string
  event.headshot;        // boolean
});

parser.gameEvents.on('round_end', event => {
  event.winner; // team number
  event.reason; // WinRoundReason
});

parser.gameEvents.on('bomb_planted', event => { ... });
parser.gameEvents.on('bomb_defused', event => { ... });

// Catch-all listener — fires once per emitted event with the event name
parser.gameEvents.on('gameEvent', (name, event) => {
  console.log(name, event);
});
```

`round_start` and `round_end` are emitted as **synthetic** events derived from `CCSGameRules.m_nRoundStartCount` / `m_nRoundEndCount` whenever `EntityMode.ALL` or `EntityMode.ONLY_GAME_RULES` is active — the raw network versions are suppressed in those modes to avoid duplicates. With `EntityMode.NONE`, only the raw events fire.

## Typed Entity Access

All entity classes have generated TypeScript interfaces. Use `getEntity` or `findEntities` for type-safe property access:

```ts
import { isEntityClass } from 'cs2parser';
import type { TypedEntity, AnyEntity, EntityProperties } from 'cs2parser';

// Get typed properties for a specific entity
const props = parser.getEntity(88, 'CCSPlayerPawn');
props?.['CCSPlayerPawn.m_iHealth']; // number | undefined
props?.['CCSPlayerPawn.m_ArmorValue']; // number | undefined

// Find all entities of a class
const weapons = parser.findEntities('CAK47');
for (const { entityId, properties } of weapons) {
	console.log(entityId, properties['CAK47.m_iClip1']);
}

// Type guard for narrowing
const entity = parser.entities[306];
if (isEntityClass(entity, 'CCSGameRulesProxy')) {
	entity.properties['CCSGameRulesProxy.CCSGameRules.m_bWarmupPeriod']; // typed
}

// Parametric `TypedEntity<K>` — useful for function signatures and helpers
function controllerName(e: TypedEntity<'CCSPlayerController'>): string {
	return e.properties['CCSPlayerController.m_iszPlayerName'] ?? '';
}

// `EntityProperties<K>` — just the property map (Partial)
function pawnHp(props: EntityProperties<'CCSPlayerPawn'>) {
	return props['CCSPlayerPawn.m_iHealth'] ?? 0;
}

// `AnyEntity` is the slot type in `parser.entities[]` — known typed entities plus
// `BaseEntity` for any class outside `EntityTypeMap`.
const slot: AnyEntity | undefined = parser.entities[0];
```

### Custom helper classes

If you need a helper for an entity class that isn't already wrapped (e.g. a weapon
or grenade), extend the `EntityHelper<C>` base — you get a typed `entity` getter
and a `prop` accessor for free:

```ts
import { DemoReader, EntityHelper } from 'cs2parser';

class C4 extends EntityHelper<'CC4'> {
	get clipAmmo(): number {
		return this.prop('CC4.m_iClip1') ?? 0;
	}
}

const parser = new DemoReader();
// ... after parsing
const c4Entities = parser.findEntities('CC4');
for (const { entityId } of c4Entities) {
	const c4 = new C4(parser, entityId);
	console.log(c4.clipAmmo);
}
```

## Low-level Events

`DemoReader` is an `EventEmitter`. These events let you hook into the parse pipeline itself — tick boundaries, header/server info, entity lifecycle, and raw network messages.

```ts
// Parse lifecycle
parser.on('header', header => {}); // CDemoFileHeader — fires once
parser.on('serverinfo', info => {}); // CSVCMsg_ServerInfo — fires once
parser.on('tickstart', tick => {}); // number
parser.on('tickend', tick => {}); // number
parser.on('progress', bytesParsed => {}); // cumulative bytes, periodically and at completion
parser.on('end', ({ incomplete, error }) => {});
parser.on('cancel', () => {}); // fires on parser.cancel()
parser.on('error', ({ error }) => {}); // fatal parse error
parser.on('debug', msg => {}); // diagnostic strings

// String tables — populate parser.players
parser.on('createstringtable', table => {});
parser.on('updatestringtable', update => {});
parser.on('clearallstringtables', () => {});

// Entity lifecycle (requires EntityMode.ALL / ONLY_GAME_RULES)
parser.on('entitycreated', ([entityId, classId, entityType, className]) => {});
parser.on('entityupdated', ({ entityId, propId, value }) => {});
parser.on('entitydeleted', entityId => {});

// Raw game events (prefer parser.gameEvents for typed access)
parser.on('gameeventlist', list => {});
parser.on('gameevent', event => {});

// Network messages — see below
parser.on('svc_UserCmds', cmd => {});
parser.on('anymessage', ({ name, id, bytes }) => {});
```

## Network Messages

Every message that can appear in a `DEM_Packet` is listenable by its protobuf enum
name. The table is [generated](#proto-generation) from the message enums, so it
covers all of `NET_Messages`, `SVC_Messages`, `EBaseUserMessages`,
`EBaseEntityMessages`, `EBaseGameEvents`, `ECstrike15UserMessages`,
`ETEProtobufIds` and `ECsgoGameEvents` — 213 messages.

Attaching a listener is all it takes. The message is decoded only while something
is listening, so subscribing to a rare message costs nothing on demos that don't
contain it, and a listener attached mid-parse takes effect from the next packet.

```ts
// Per-shot ground truth — origin, angles, weapon, seed, recoil index
parser.on('GE_FireBulletsId', shot => {
	console.log(shot.origin, shot.angles, shot.recoil_index);
});

// Chat. CS2 uses both, depending on the server.
parser.on('UM_SayText', e => console.log(e.text));
parser.on('UM_SayText2', e => console.log(e.param2));

// Server tick and frame timing, once per packet
parser.on('net_Tick', t => {});

// End-of-match scoreboard, straight from the server
parser.on('CS_UM_EndOfMatchAllPlayersData', data => {});
```

Payload types come from the generated protobuf definitions, so `shot.recoil_index`
autocompletes and `parser.on('not_a_message', …)` is a compile error.

### Messages with a dedicated event

Seven messages are decoded by the parser itself and surfaced through a
purpose-built event instead of by name:

| Message                         | Event                                               |
| ------------------------------- | --------------------------------------------------- |
| `svc_ServerInfo`                | `serverinfo`                                        |
| `svc_CreateStringTable`         | `createstringtable`                                 |
| `svc_UpdateStringTable`         | `updatestringtable`                                 |
| `svc_ClearAllStringTables`      | `clearallstringtables`                              |
| `svc_PacketEntities`            | `entitycreated` / `entityupdated` / `entitydeleted` |
| `GE_Source1LegacyGameEventList` | `gameeventlist`                                     |
| `GE_Source1LegacyGameEvent`     | `gameevent` (prefer `parser.gameEvents`)            |

### User commands

`usercommand` fires once per player command in `svc_UserCmds`, with the payload
fully reconstructed:

```ts
parser.on('usercommand', ({ playerSlot, cmd, isDelta }) => {
	const base = cmd?.base;
	if (!base) return;
	console.log(playerSlot, base.viewangles, base.buttons_pb, base.subtick_moves);
});
```

| Field                | Meaning                                                       |
| -------------------- | ------------------------------------------------------------- |
| `cmd`                | The resolved `CSGOUserCmdPB`; null if it could not be rebuilt |
| `isDelta`            | Whether it arrived as a delta rather than a full payload      |
| `deltaData`          | The raw delta bytes, for callers who want them                |
| `playerSlot`         | Userinfo slot                                                 |
| `cmdNumber`          | Client-side sequence number                                   |
| `clientTick`         | Tick the client produced the command on                       |
| `serverTickExecuted` | Tick the server executed it on                                |

Buttons, view angles, movement and subtick moves live under `cmd.base`; per-frame
aim history is in `cmd.input_history`.

This is the largest payload in a demo — 127 MB and 1.24 M commands in a 20-round
match — and it is decoded only while something is listening.

#### Delta encoding

CS2 sends almost every advancing command as a delta against the player's previous
one: in that same match, 1,234,273 of 1,235,910 commands, carrying 104 MB of the
127 MB total. The parser tracks each player's running command and applies deltas
automatically, so `cmd` is the complete command either way.

The encoding is not protobuf, despite looking like it. Fields can arrive with wire
type 7 meaning "reset to the declared default", and repeated fields use list
opcodes that resize and patch the previous command's list in place. Handing these
bytes to a stock protobuf decoder throws on about half of them and quietly
produces wrong buttons and view angles on the rest.

A command that cannot be resolved yields `cmd: null` and invalidates that player's
delta chain. Subsequent deltas remain null until a full command supplies a new
baseline. Removing the `usercommand` listener while parsing also invalidates the
baseline, so reattaching it may require waiting for the next full command. The
parser reports reconstruction failures on `debug` when the demo completes.

### Discovering messages

`anymessage` fires for every non-core message with its undecoded body, including
ids the registry doesn't know — useful after a game update introduces a message
the bundled protos predate.

```ts
const seen = new Map<number, string>();
parser.on('anymessage', ({ id, name, bytes }) => {
	seen.set(id, name ?? `unknown(${id}) ${bytes.length}B`);
});
```

`DemoReader.messageNames` lists every subscribable name, `DemoReader.messageId(name)`
gives its wire id, and `DemoReader.isMessageName(name)` narrows a string to a
subscribable name. Core messages still have wire IDs but return false from
`isMessageName`, because they use the dedicated events listed above.

Run `bun scripts/probe-message-histogram.ts <demo.dem>` to see which messages a
given demo actually contains, with counts and byte totals.

### Demo frame commands

Other demo frames can be subscribed to by name, such as `DEM_CustomData`,
`DEM_StringTables`, and `DEM_FileInfo`. Their byte payloads are safe to retain.

```ts
parser.on('DEM_FileInfo', info => console.log(info.playback_time, info.playback_ticks));
// Or read the file-info trailer without parsing the demo:
const info = DemoReader.parseFileInfo('demo.dem');
```

Listening for `DEM_FileInfo` or `DEM_SpawnGroups` reads past `DEM_Stop` through
the trailer; streams wait for EOF. An absent or truncated trailer does not make
the gameplay portion of the demo incomplete.

## Type Generation

Generate entity type interfaces from a demo file:

```bash
bun scripts/generate-entity-types.ts --demo path/to/demo.dem
bun scripts/generate-entity-types.ts --snapshot  # reuse saved snapshot
```

## Proto Generation

Fetch proto definitions from [SteamTracking/GameTracking-CS2](https://github.com/SteamTracking/GameTracking-CS2) and generate TypeScript bindings:

```bash
bun scripts/generate-protos.ts
```

Then rebuild the network-message registry from the regenerated enums. It reports
any enum member it can't resolve to a protobuf class, so new messages surface
instead of being silently skipped:

```bash
bun run generate:messages         # writes src/parser/descriptors/generated/
bun run generate:messages:check   # CI: fail if the committed file is stale
```

The user-command delta decoder has its own generated table, derived from the
messages Valve marks with `option (codegen_delta_encoder)`:

```bash
bun run generate:delta-schema
bun run generate:delta-schema:check
```

`npm run build` runs both `:check` variants, so a stale generated file cannot be
published. `bun run generate` regenerates everything in order.

## Performance

Benchmark your own demo and hardware after building:

```sh
npm run build
bun run benchmark path/to/demo.dem --runs 5
# Optional machine-readable samples and a Markdown report:
bun run benchmark path/to/demo.dem --runs 5 --json benchmark.json --markdown benchmark.md
```

The default matrix uses Bun and the built server export: all three entity modes with file streaming, then `ALL` with 4 MiB file chunks, a Buffer, and a Node stream. No optional event subscriptions are enabled. Each case runs in a fresh process, in deterministic shuffled order without overlapping runs. The report leads with mean/median throughput in MB/s (1 MB = 1,000,000 bytes), followed by median time and memory. JSON output retains all samples and mean, median, min/max statistics. Throughput is calculated per run from demo size and elapsed time, including input I/O but excluding imports/setup; the OS cache is not reset. No files are written unless requested.

For cross-runtime/build comparisons, pass `--cases path/to/cases.json`. The file is an array of cases (or a prior JSON report's `.cases`), each with `name`, `runtime` (executable), `entry` (module specifier), `method`, `mode`, and optional `subscriptions`. Methods are `path-stream`, `path-sync` (4 MiB chunks, not synchronous parsing), `buffer`, `stream`, and `web-stream`; modes are `NONE`, `ONLY_GAME_RULES`, and `ALL`. Custom cases default to `subscriptions: "death"`; use `"none"` or `"all"` explicitly for other workloads. For example:

```json
[{ "name": "Bun ALL", "runtime": "bun", "entry": "cs2parser", "method": "path-stream", "mode": "ALL", "subscriptions": "death" }]
```

Node cases require a version capable of running the TypeScript benchmark worker. Use equivalent builds when comparing revisions. Historical optimization measurements and tradeoffs are retained in [PR #43](https://github.com/osztenkurden/cs2parser/pull/43) and [its recorded audit](https://github.com/osztenkurden/cs2parser/blob/289240f/PERFORMANCE.md), rather than duplicated benchmark snapshots in the current tree.

`scripts/benchmark-snappy.mjs` remains available for isolated codec comparisons; it verifies decompressed output against native Snappy before timing.

## Examples

The [`examples/`](examples/) directory contains runnable scripts:

| File            | Description                                                      |
| --------------- | ---------------------------------------------------------------- |
| `header.ts`     | `DemoReader.parseHeader` — fast metadata read                    |
| `serverinfo.ts` | `DemoReader.parseServerInfo` — tick interval / map / max clients |
| `stream.ts`     | Four input modes, game events, and player/team summaries         |
| `chat.ts`       | Chat messages from a demo                                        |
| `voicedata.ts`  | Opt-in `svc_VoiceData` parsing                                   |
| `broadcast.ts`  | Live HTTP broadcast, optional descriptors, and signal cancellation |

```sh
bun examples/header.ts path/to/demo.dem
bun examples/serverinfo.ts path/to/demo.dem
bun examples/stream.ts path-stream path/to/demo.dem
bun examples/chat.ts path/to/demo.dem
bun examples/voicedata.ts path/to/demo.dem
bun examples/broadcast.ts https://relay.example.com/match/ [event-descriptors.bin]
```

The stream example accepts `path-stream`, `path-chunked` (`stream: false`), `buffer`, or `stream` as its first argument. Named message listeners enable their own decoding; no separate parse option is required.

## Acknowledgements

Creating this library wouldn't be possible without awesome work of:

- [LaihoE](https://github.com/LaihoE), creator of [demoparser](https://github.com/LaihoE/demoparser)
- [Saul](https://github.com/saul), creator of [demofile-net](https://github.com/saul/demofile-net)
- [markus-wa](https://github.com/markus-wa), creator of [demoinfocs-golang](https://github.com/markus-wa/demoinfocs-golang)

Huge thanks to all of them, as they all have helped me in some way or the other during the past few years.
