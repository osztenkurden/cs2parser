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

For normal completion, input/decode failure, or cancellation, all input types resolve with the same object passed to the `end` event: `{ incomplete: boolean, error?: any, reason?: EndReason }`. Check the result without adding an `end` or `error` listener:

```ts
const { incomplete, error, reason } = await parser.parseDemo('demo.dem', { entities: EntityMode.ALL });
if (error) {
	console.error('Parsing failed:', error);
} else if (incomplete) {
	console.warn('Parsing did not finish:', reason ?? 'incomplete demo');
}
```

### Errors and callbacks

The 2.0 result shape is unchanged. `incomplete` is not a success flag: a corrupt complete frame can produce `{ incomplete: false, error }`. Inspect `error` as well. File parsing normally omits `reason`; cancellation sets it to `'cancelled'`. Input/read errors and truncated input have `incomplete: true`. The optional `error` event carries `{ error }`, not a bare error, and is not required to handle decode failures.

Invalid input arguments and reuse/concurrent-parse attempts can throw synchronously. Put both the call and `await` inside `try` if you need to catch these as well as promise rejections.

Synchronous application listener exceptions (including game-event, `error`, `debug`, `cancel`, and `end` listeners) are not decode failures. They reject the active parse promise with the original thrown value after cleanup. A later terminal-listener exception does not replace an earlier callback exception. If a decode result was already queued, its original error remains in the `end` payload; the promise rejection reports the callback exception separately.

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
| `string` path                  | Promise of the end payload | low    |
| `string` path + `stream: false` | Promise of the end payload | low    |
| `Readable` stream              | Promise of the end payload | low    |
| `Uint8Array` / `Buffer`        | Promise of the end payload | high   |
| `ReadableStream<Uint8Array>`   | Promise of the end payload | low    |

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

`cancel()` aborts an in-flight parse. It destroys the underlying stream (if any), emits a `'cancel'` event, and then an `'end'` event with `{ incomplete: true, reason: 'cancelled' }`. Calling `cancel()` or `parseDemo()` on a reader that has already ended throws. A synchronous cancellation listener exception is rethrown to the `cancel()` caller after terminal cleanup is attempted, and also rejects an active parse promise. When calling `cancel()` outside a parsing listener, handle both the synchronous call and the parse promise.
