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

`EntityMode.ALL` enables player helpers and full entity state. Use `EntityMode.ONLY_GAME_RULES` for round events and game rules, or the default `EntityMode.NONE` when you only need messages and basic player info. Each `DemoReader` handles one demo or broadcast.

See [Parsing demos](docs/parsing.md) for supported inputs, completion results, settings, and cancellation.

## Browser

Import from `cs2parser/browser` to parse a file or web stream without Node globals or separate WASM assets:

```ts
import { DemoReader, EntityMode } from 'cs2parser/browser';

// file is a File from an <input type="file"> or drag-and-drop.
const parser = new DemoReader();
parser.gameEvents.on('player_death', event => console.log(event.weapon));
await parser.parseDemo(file.stream(), { entities: EntityMode.ALL });
```

See [Browser usage](docs/browser.md) for fetch, metadata, runtime requirements, and WASM Snappy details.

## Live HTTP broadcasts

```ts
await new DemoReader().parseHttpBroadcast('https://relay.example.com/match-id/', {
	entities: EntityMode.ALL
});
```

Uses the same events as demo parsing. See [Live HTTP broadcasts](docs/http-broadcast.md) for relay options, mid-stream joins, and cancellation.

## Documentation

| Guide | Topics |
| --- | --- |
| [Parsing demos](docs/parsing.md) | Inputs, entity modes, settings, reader state, and cancellation |
| [Reading metadata](docs/metadata.md) | Header, server info, and file info without a full parse |
| [Browser usage](docs/browser.md) | Files, web streams, metadata, and WASM Snappy |
| [Live HTTP broadcasts](docs/http-broadcast.md) | GOTV relays, options, descriptors, and wire format |
| [Players and pawns](docs/players.md) | Rosters, lookups, bot analysis, and helper properties |
| [Entities and match state](docs/entities.md) | Teams, game rules, and typed entity access |
| [Smokes](docs/smokes.md) | Seed voxels, density simulation, and visual comparison |
| [Game and parser events](docs/events.md) | Typed game events and parser lifecycle events |
| [Network messages](docs/network-messages.md) | Subscriptions, user commands, and message discovery |
| [Encrypted demo chat](docs/encrypted-chat.md) | Match keys, public chat decryption, and browser support |
| [Development](docs/development.md) | Entity types, protobuf bindings, and generated registries |
| [Performance](docs/performance.md) | Benchmark commands, methodology, and custom cases |
| [Examples](docs/examples.md) | Runnable scripts and command-line usage |

Upgrading from 1.x? See the [migration guide](MIGRATION.md).

## Acknowledgements

Creating this library wouldn't be possible without awesome work of:

- [LaihoE](https://github.com/LaihoE), creator of [demoparser](https://github.com/LaihoE/demoparser)
- [Saul](https://github.com/saul), creator of [demofile-net](https://github.com/saul/demofile-net)
- [markus-wa](https://github.com/markus-wa), creator of [demoinfocs-golang](https://github.com/markus-wa/demoinfocs-golang)

Huge thanks to all of them, as they all have helped me in some way or the other during the past few years.
