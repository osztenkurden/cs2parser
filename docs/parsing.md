# Parsing demos

[Back to README](../README.md#documentation)

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

All input types return `Promise<ParseOutcome>`. Failures reject; fulfilled outcomes have no error field:

```ts
type ParseOutcome = { status: 'complete' } | { status: 'incomplete' } | { status: 'cancelled' };
```

`complete` means the demo ended normally; `incomplete` means input ended before a complete demo was available (including an empty input or a truncated frame); `cancelled` means parsing was explicitly stopped. Corruption inside a fully available frame is a failure, not incomplete input. No event listener is required to handle failures:

```ts
try {
	const outcome = await parser.parseDemo('demo.dem', { entities: EntityMode.ALL });
	if (outcome.status !== 'complete') console.warn('Parsing did not finish:', outcome.status);
} catch (error) {
	console.error('Parsing failed:', error);
}
```

### Errors and callbacks

I/O, corrupt data, and decompression failures reject with the original `Error`; non-Error operational failures are normalized to `Error`. Async APIs also reject invalid arguments and reuse/concurrent-parse attempts rather than throwing before returning a promise. Synchronous metadata APIs and `cancel()` remain synchronous.

The `end` event carries the exported `ParseEnd` union: a nonfailure outcome (including broadcast `timeout`), or `{ status: 'error', error: unknown }`. The optional diagnostic `error` event carries `{ error: unknown }`. Events are observational; the returned promise is authoritative. On normal completion the fulfilled outcome is the same object as the end notification.

Synchronous application listener exceptions (including game-event, `debug`, `cancel`, and `end` listeners) reject the active operation with the original thrown value, even `undefined`. First failure wins: when reporting an existing failure, exceptions from diagnostic `error` or terminal `end` listeners cannot replace it. An `end` or final `debug` listener can throw after a nonfailure end notification has been committed; the promise then rejects without a second end event.

Terminal state and decoder release do not depend on public `end` listeners. Removing those listeners or prepending one that throws cannot bypass cleanup. Queued notifications are not replayed after a listener throws; undelivered notifications are discarded, except that terminal notification is attempted. Normal EventEmitter behavior still applies: a throwing listener prevents later listeners for that same emission from running. Cleanup does not roll back entity changes or application side effects.

Listeners are synchronous notifications. Returned promises from `async` listeners are **not awaited** or included in the parse promise. Handle their rejections yourself and separately await any application work that must finish after parsing.

### Entity Modes

| Mode                         | Entities        | Round events | Speed                |
| ---------------------------- | --------------- | ------------ | -------------------- |
| `EntityMode.NONE`            | none            | no           | fastest              |
| `EntityMode.ONLY_GAME_RULES` | game rules only | yes          | skips unused values |
| `EntityMode.ALL`             | all             | yes          | full parsing         |

`ONLY_GAME_RULES` parses the entity bitstream but only stores `CCSGameRulesProxy` properties. This enables synthetic `round_start`/`round_end` events without populating the full entities array.

| Input                          | Returns                    | Memory |
| ------------------------------ | -------------------------- | ------ |
| `string` path                  | `Promise<ParseOutcome>` | low    |
| `string` path + `stream: false` | `Promise<ParseOutcome>` | low    |
| `Readable` stream              | `Promise<ParseOutcome>` | low    |
| `Uint8Array` / `Buffer`        | `Promise<ParseOutcome>` | high   |
| `ReadableStream<Uint8Array>`   | `Promise<ParseOutcome>` | low    |

### Parse Settings

Network messages are decoded when something is listening for them, so most of the
time there is nothing to configure — see [Network Messages](network-messages.md#network-messages).

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

## Reader State

`DemoReader` exposes a handful of live properties that update during parsing. They're useful inside game-event handlers or low-level listeners.

| Member              | Type                      | Description                                                                                                                                                                 |
| ------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `header`            | `CDemoFileHeader \| null` | Populated after the first `'header'` event                                                                                                                                  |
| `entities`          | `AnyEntity[]`             | Sparse array indexed by entity ID. Each slot is a `TypedEntity` for known classes or `BaseEntity` otherwise; `undefined` slots mean the entity was deleted or never existed |
| `currentTick`       | `number`                  | Tick currently being processed (`-1` before the first frame)                                                                                                                |
| `currentTime`       | `number`                  | `currentTick * tickInterval` — requires `'serverinfo'` to have arrived                                                                                                      |
| `gameEvents`        | `GameEvents`              | Typed emitter for in-game events (see [Game Events](events.md#game-events))                                                                                                          |
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

`cancel()` aborts an in-flight parse. It destroys the underlying stream (if any), emits a `'cancel'` event, and then an `'end'` event with `{ status: 'cancelled' }`. Calling `cancel()` on a reader that has already ended throws; calling `parseDemo()` again returns a rejected promise. A synchronous cancellation listener exception is rethrown to the `cancel()` caller after terminal cleanup is attempted, and also rejects an active parse promise. When calling `cancel()` outside a parsing listener, handle both the synchronous call and the parse promise.
