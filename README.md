<div align="center">

# cs2parser

**Turn Counter-Strike 2 demos and live broadcasts into typed match data.**

[![npm version](https://img.shields.io/npm/v/cs2parser?color=cb6b26)](https://www.npmjs.com/package/cs2parser)
[![CI](https://github.com/osztenkurden/cs2parser/actions/workflows/ci.yml/badge.svg)](https://github.com/osztenkurden/cs2parser/actions/workflows/ci.yml)
[![Downloads](https://img.shields.io/npm/dm/cs2parser)](https://www.npmjs.com/package/cs2parser)
[![License: MPL-2.0](https://img.shields.io/badge/license-MPL--2.0-blue)](LICENSE)

[Quick start](#quick-start) · [Browser](#browser) · [Documentation](#documentation) · [Changelog](CHANGELOG.md)

</div>

`cs2parser` parses CS2 `.dem` files and live HTTP GOTV broadcasts for match analysis, replay viewers, and broadcast tooling. Read typed game events, inspect players and entities, or subscribe to low-level network messages in Node.js, Bun, and modern browsers.

| Match data                        | Playback and inputs                        | Integration                                |
| :-------------------------------- | :----------------------------------------- | :----------------------------------------- |
| Players, teams, and game rules    | Demo files, byte buffers, and streams      | Typed game and parser events               |
| Kills, rounds, and bomb events    | Pause, seek, and resume on seekable inputs | Node.js, Bun, and browser exports          |
| Entity state and smoke simulation | Live HTTP GOTV broadcasts                  | Embedded WASM; no production native addons |

```text
CS2 demo or GOTV relay ──► DemoReader ──► typed events + match state
```

> **Before you start:** choose `EntityMode.ALL` for player helpers and full entity state. The default, `EntityMode.NONE`, skips entities. Use a new `DemoReader` for each demo or broadcast.

## Quick start

### 1. Install

Requires **Node.js 22 or newer**, Bun, or a modern browser with WebAssembly support. The package uses **ES modules** and includes TypeScript declarations. Both exports embed the WASM Snappy decoder, so there are no separate WASM assets to serve.

```sh
npm install cs2parser
```

### 2. Parse a demo

Save as `parse-demo.mjs`:

```js
import { DemoReader, EntityMode } from 'cs2parser';

const parser = new DemoReader();

parser.gameEvents.on('player_death', event => {
	const attacker = event.attackerPlayer;
	const victim = event.player;
	if (attacker && victim) {
		console.log(`${attacker.name} killed ${victim.name} with ${event.weapon}`);
	}
});

try {
	const outcome = await parser.parseDemo(process.argv[2] ?? 'demo.dem', {
		entities: EntityMode.ALL
	});

	console.log('Parsing finished:', outcome.status);
	for (const player of parser.playerControllers) {
		console.log(player.name, player.kills, player.deaths, player.position);
	}
} catch (error) {
	console.error('Parsing failed:', error);
	process.exitCode = 1;
}
```

### 3. Run it

Pass the path to a CS2 demo:

```sh
node parse-demo.mjs path/to/demo.dem
```

File paths are read on demand. You can also pass a Node stream, `File` / `Blob`, `Uint8Array` / `Buffer`, or web stream. The returned status is `complete`, `incomplete`, or `cancelled`; parsing failures reject the promise.

Listeners run synchronously; promises returned by async listeners are not awaited. Player helpers expose live state, so copy the values you need when recording history. See [Parsing demos](docs/parsing.md) for input types, completion handling, and cancellation.

## Choose how much to parse

| Mode                         | Available data                                            | Use it for                                         |
| :--------------------------- | :-------------------------------------------------------- | :------------------------------------------------- |
| `EntityMode.NONE` (default)  | Messages, game events, and basic player info; no entities | Event logs and rosters without full entity parsing |
| `EntityMode.ONLY_GAME_RULES` | Game rules and derived round events                       | Round tracking without player entity state         |
| `EntityMode.ALL`             | Full entity state, player helpers, teams, and smokes      | Player statistics, positions, and replay analysis  |

`event.player` and `event.attackerPlayer` require `EntityMode.ALL`. With `NONE`, use `parser.players` for basic names and Steam IDs. See [Players and pawns](docs/players.md) for lookups and [Game and parser events](docs/events.md) for round-event behavior.

## Browser

Import from `cs2parser/browser` in your browser application:

```ts
import { DemoReader, EntityMode } from 'cs2parser/browser';

// file is a File from an <input type="file"> or drag-and-drop.
const parser = new DemoReader();
parser.gameEvents.on('player_death', event => console.log(event.weapon));
parser.on('progress', bytesParsed => console.log(bytesParsed / file.size));

const outcome = await parser.parseDemo(file, { entities: EntityMode.ALL });
console.log(outcome.status);
```

Pass a `File` directly to enable [pause, seek, and resume](docs/seeking.md), or a web stream for sequential parsing. See [Browser usage](docs/browser.md) for fetch examples, runtime requirements, and WASM details.

## Live HTTP broadcasts

Connect to a CS2 GOTV HTTP relay and use the same events as demo parsing:

```ts
import { DemoReader, EntityMode } from 'cs2parser';

const parser = new DemoReader();
parser.gameEvents.on('round_end', event => {
	console.log('Round winner:', event.winner);
});

const outcome = await parser.parseHttpBroadcast('https://relay.example.com/match-id/', {
	entities: EntityMode.ALL
});
console.log(outcome.status); // 'complete', 'timeout', or 'cancelled'
```

Replace the example URL with your relay address. See [Live HTTP broadcasts](docs/http-broadcast.md) for relay options, mid-stream joins, and cancellation.

## Read metadata without a full parse

```ts
import { DemoReader } from 'cs2parser';

const header = await DemoReader.parseHeaderAsync('demo.dem');
console.log(header?.map_name, header?.server_name);
```

Metadata helpers read only the relevant parts of the demo. The browser export accepts bytes or a `File` / `Blob` instead of a filesystem path. See [Reading metadata](docs/metadata.md) for server info, file info, and synchronous alternatives.

## Documentation

| Read                                           | What you will find                                                 |
| :--------------------------------------------- | :----------------------------------------------------------------- |
| [Parsing demos](docs/parsing.md)               | Inputs, entity modes, settings, reader state, and cancellation     |
| [Pausing and seeking](docs/seeking.md)         | Tick-boundary playback controls, FullPackets, and seekable sources |
| [Reading metadata](docs/metadata.md)           | Header, server info, and file info without a full parse            |
| [Browser usage](docs/browser.md)               | Files, web streams, metadata, and WASM Snappy                      |
| [Live HTTP broadcasts](docs/http-broadcast.md) | GOTV relays, options, descriptors, and wire format                 |
| [Players and pawns](docs/players.md)           | Rosters, lookups, bot analysis, and helper properties              |
| [Entities and match state](docs/entities.md)   | Teams, game rules, and typed entity access                         |
| [Smokes](docs/smokes.md)                       | Seed voxels, density simulation, and visual comparison             |
| [Game and parser events](docs/events.md)       | Typed game events and parser lifecycle events                      |
| [Network messages](docs/network-messages.md)   | Subscriptions, user commands, and message discovery                |
| [Encrypted demo chat](docs/encrypted-chat.md)  | Match keys, public chat decryption, and browser support            |
| [Development](docs/development.md)             | Entity types, protobuf bindings, and generated registries          |
| [Performance](docs/performance.md)             | Benchmark commands, methodology, and custom cases                  |
| [Examples](docs/examples.md)                   | Runnable scripts and command-line usage                            |
| [Changelog](CHANGELOG.md)                      | Released changes                                                   |

Upgrading from 1.x? See the [migration guide](MIGRATION.md).

## Used by

- [liga.dust2.dk](https://liga.dust2.dk/)
- [radar.dust2.org](https://radar.dust2.org/)

## Development

With Node.js and Bun installed:

```sh
npm ci
npm run typecheck
npm test
npm run build
```

See [Development](docs/development.md) for code generation and [Performance](docs/performance.md) for benchmarks.

## Acknowledgements

This library builds on the work of:

- [LaihoE](https://github.com/LaihoE), creator of [demoparser](https://github.com/LaihoE/demoparser)
- [Saul](https://github.com/saul), creator of [demofile-net](https://github.com/saul/demofile-net)
- [markus-wa](https://github.com/markus-wa), creator of [demoinfocs-golang](https://github.com/markus-wa/demoinfocs-golang)

Huge thanks to all of them for their help over the years.

## License

[GPL-3.0](LICENSE)
