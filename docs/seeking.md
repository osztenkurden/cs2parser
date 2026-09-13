# Seeking

Use `parseDemo()`, `pause()`, `seekTo(tick)` and `resume()` on the same `DemoReader`.

```ts
import { DemoReader, EntityMode } from 'cs2parser/browser';

const parser = new DemoReader();
const controller = new AbortController();
parser.on('tickend', tick => console.log(tick, parser.playerControllers));

// file is a File from an <input type="file">.
const parsing = parser.parseDemo(file, { entities: EntityMode.ALL });
await parser.pause();
const result = await parser.seekTo(10000, { signal: controller.signal });
if (result.status === 'complete') parser.resume();
else parser.cancel();
await parsing;
```

Set `entities: EntityMode.ALL` for gameplay state. The default is `EntityMode.NONE`.

## Supported inputs

Seeking requires a raw `.dem` file and one of these inputs:

| Input | Seekable | Runtime |
| --- | --- | --- |
| File path passed to `parseDemo(path)` | Yes | Node, Bun |
| `File` or `Blob` | Yes | Browser, Node, Bun |
| `Uint8Array` | Yes | Browser, Node, Bun |
| `Buffer` | Yes | Node, Bun |
| `DemoByteSource`, including `httpDemoSource()` | Yes | Browser, Node, Bun |
| `fileDemoSource()` | Yes | Node, Bun |
| Node `Readable`, including `createReadStream()` | No | Node, Bun |
| Web `ReadableStream`, including `file.stream()` and `response.body` | No | Browser, Node, Bun |
| Live broadcasts via `parseHttpBroadcast()` | No | Browser, Node, Bun |

Pass a browser File directly to `parseDemo(file)`. For HTTP random access, use
`await httpDemoSource(url, signal)` from `cs2parser` or `cs2parser/browser` and pass
the returned source to `parseDemo()`. The server must provide Content-Length and
valid 206/Content-Range responses, with the required headers exposed through CORS.

Keep the source unchanged throughout parsing and seeking. A custom
`DemoByteSource` provides a stable `size` and `read(offset, length, signal)` method.
Each read must return exactly the requested bytes in storage it will not mutate.
A new read can begin after an earlier read's signal is aborted.

On a nonseekable input:

- `pause()` returns a rejected promise: `Pause requires an active seekable demo parse`.
- `seekTo()` returns a rejected promise: `Await pause() before seeking`.
- `resume()` throws: `Parser is not paused`.

These calls do not move the parser or emit `paused`. The sequential parse continues
if the application handles the rejection or exception.

## Playback controls

`await parser.pause()` stops after all effects and `tickend` listeners for the
active tick. It sets `isPaused`, emits `paused`, then resolves. Calling it
immediately after `parseDemo()` pauses before the first tick. Repeated pending
requests share a promise; calling it when already paused resolves immediately.

`await parser.seekTo(tick, { signal })` requires a paused parser. It reconstructs
state silently and stays paused before the first recorded tick at or after the
target. That tick's packets and `tickstart` event are delivered after `resume()`.
Gameplay, entity, tick and on-demand message events are suppressed during
reconstruction; application `once` listeners remain registered.

`parser.resume()` continues the original `parseDemo()` operation. Its promise
stays pending across pauses and seeks. `parser.cancel()` terminates that operation,
including while paused. `controller.abort()` cancels only the seek using its signal.
Completion and cancellation are terminal; use a new reader afterwards.

You can call `seekTo()` from a `paused` listener. Async event listeners are not
awaited and must handle their own errors. Seeking while running, overlapping seeks,
and resuming during a seek are rejected. A synchronous `paused` listener error
rejects both the pause and parsing promises.

Subscriptions survive seeks. Discard old entity references, cached helpers and
application replay buffers after seeking. Use `tickend` to read completed tick
state; `tickstart` observes state before that tick's packets.

## Seek results

| Result | Meaning |
| --- | --- |
| `{ status: 'complete', tick }` | Ready to resume at the returned tick. |
| `{ status: 'incomplete' }` | The target could not be reached, including end-of-demo or truncated input. |
| `{ status: 'cancelled' }` | The operation was cancelled. |

Negative, fractional or unsafe ticks, malformed decoder data and exceeded limits
reject the promise. A cancelled or failed reconstruction requires a successful
seek before resuming. An already-aborted signal leaves the current position intact.

## Progress and memory

- `isSeeking`: whether reconstruction is active.
- `fullPackets`: readonly copy of discovered `{ tick, offset }` locations.
- `seekBytesRead`: cumulative bytes fetched; subtract readings to measure an operation.
- `seekMemoryBytes`: estimated retained checkpoint metadata and location bytes.
- `currentTick`: the tick of the reconstructed state. The seek result's `tick` is
  the upcoming replay tick.

The `progress` event reports consumed file offsets during normal parsing and
cumulative fetched bytes during seeking.

The parser retains one live entity world, checkpoint metadata, FullPacket locations
and decoding buffers. It does not retain per-tick snapshots.

Set these limits in the `parseDemo()` options:

| Option | Default | Limit |
| --- | --- | --- |
| `maxFullPackets` | 4096 | Retained FullPacket locations |
| `maxSeekBytes` | 32 MiB | Estimated retained checkpoint metadata and locations |
| `maxFrameBytes` | 64 MiB | Encoded command size |

`seekMemoryBytes` and `maxSeekBytes` exclude live entities, transient copies,
source-owned data, decompression buffers and engine object overhead.

## Limitations

Without a usable FullPacket, seeking reconstructs from the beginning. Fast seeking
does not support later serializer changes, new table layouts or event-descriptor
updates present only in skipped ordinary packets. Parse those demos sequentially.
Usercommand delta history outside checkpoints is not restored; notifications may
require a later full command baseline. Historical empty entity-array slots are not
preserved. Seeking accepts ticks, not round numbers.

## Browser example

Run `bun build src/browser.ts --target browser --outfile dist/replay-browser.js`,
serve the repository over HTTP, and open
[examples/replay.html](../examples/replay.html).
