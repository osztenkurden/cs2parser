# Seeking with DemoReader

`parseDemo()` owns the continuous parsing loop. Use `pause()`, `seekTo(tick)`,
and `resume()` on the same reader, with its existing events.

```ts
import { DemoReader, EntityMode } from 'cs2parser/browser';

const parser = new DemoReader();
parser.on('tickstart', tick => beginFrame(tick));
parser.on('tickend', tick => draw(tick, parser.playerControllers));
parser.gameEvents.on('player_death', event => showDeath(event));

const parsing = parser.parseDemo(file, { entities: EntityMode.ALL });
await parser.pause();
const seek = await parser.seekTo(10000, { signal });
if (seek.status === 'complete') parser.resume();
else parser.cancel();
await parsing;
```

## Pause, seek, resume

`pause()` requests a stop after the active tick finishes, including all packet
effects, game events and every `tickend` listener. The parser sets `isPaused` before
emitting `paused`, and resolves the pause promise after that synchronous event
notification. Calling it immediately after `parseDemo()` pauses before the first
tick. Repeated requests share the pending promise; pausing an already paused
parser resolves immediately.

Seeking is allowed from a `paused` listener:

```ts
parser.on('paused', async () => {
  try {
    const result = await parser.seekTo(targetTick);
    if (result.status === 'complete') parser.resume();
    else parser.cancel();
  } catch (error) {
    parser.cancel();
    reportError(error);
  }
});
```

Async event listeners are not awaited. The parser stays paused until `resume()`
is explicitly called. For UI actions, prefer `await parser.pause(); await
parser.seekTo(tick); parser.resume()`, checking the seek outcome before resuming.
The original `parseDemo()` promise remains pending across pauses and seeks, and
settles only on completion, cancellation or failure. Calling `cancel()` while
paused releases the wait and settles that same parsing promise.

`seekTo()` reconstructs silently and leaves the parser paused immediately before
the first recorded tick at or after the requested tick. It neither emits that
tick's `tickstart` nor applies its packets. `resume()` continues ordinary parsing
from there automatically. Seeking while running,
overlapping seeks, and resuming during a seek reject or throw explicitly.

A seek resolves with `{ status: 'complete', tick }`, `{ status: 'incomplete' }`
when the target cannot be reached, or `{ status: 'cancelled' }`. Negative,
fractional or unsafe ticks, malformed decoder data and exceeded
budgets reject. An interrupted reconstruction stays paused and requires another
successful seek before resuming. An already-aborted seek preserves the current
position. `parseDemo()` keeps its existing completion outcomes and listener-error
behavior. A synchronous `paused` listener exception rejects both the pause and
parsing promises; async listeners must handle their own failures.

Completion and cancellation are terminal. If more seeking is needed, pause before
finishing the demo; after terminal completion, use a new reader. Application round
markers can supply target ticks, but the parser has no round-seeking API.

During reconstruction, gameplay events, entity events, tick events and on-demand
message notifications are suppressed. Internal state effects still run. External
`once` listeners are not consumed. `currentTick` describes reconstructed state;
use the seek result's `tick` for the upcoming tick. `isSeeking` is true during
reconstruction. The existing `progress` event remains observable: during a seek it
reports cumulative bytes fetched, also available as `seekBytesRead`; ordinary
parsing progress reports consumed file offsets. Subtract `seekBytesRead` readings
to measure an operation's I/O.

Subscriptions survive backward and repeated seeks. Drop old entity references,
cached helpers and your own replay buffers when switching: the parser survives,
but its entity world and helper caches are rebuilt.

## How seeking works, compared with demofile-net

The design follows [demofile-net's FullPacket seeking implementation](https://github.com/saul/demofile-net/blob/fd59701a998cf30a46adc4942e063d90de73c07a/src/DemoFile/DemoFileReader.FullPacket.cs):

- Discover FullPacket locations by reading command headers and jumping over
  ordinary command bodies. There is no entity decoding during this scan.
- Hydrate serializers, class info, initial string-table decoding metadata, player
  mappings, tick timing and event descriptors once, up to the first FullPacket.
- Apply the preceding FullPackets' table data. **A FullPacket can contain only
  tables changed since the previous FullPacket**, so an offset/tick pair alone
  cannot restore every decoder dependency.
- Load the chosen FullPacket's entity snapshot, then decode ordinary commands
  silently until the target boundary. Normal events resume with the next read.

Unlike demofile-net's per-FullPacket accumulated table records, this implementation
retains one initial hydration state and only `{ tick, offset }` locations. It
revisits preceding FullPacket bodies to accumulate table changes for a seek;
ordinary packet bodies between them are skipped. This trades a small amount of
FullPacket I/O for simpler, bounded retained state. `fullPackets` exposes a readonly
copy of the locations discovered so far; it is not an independently serializable
restoration index. Location discovery proceeds only as far as needed and is reused.

Selection uses the latest FullPacket **strictly before** the target. Ordinary
commands can precede a FullPacket at the same tick, and choosing that snapshot
could omit target-tick effects. There is no assumed fixed FullPacket interval.
Unusable snapshots are rejected before emitting gameplay, then an earlier one is
tried. Without a usable checkpoint, reconstruction starts at the origin. That
fallback is sequential decoding; it is not presented as a random-access jump.

Like demofile-net, seek operations must happen outside command processing. The
pause boundary is a whole tick rather than a single command, so callers
cannot accidentally seek between effects belonging to one tick.

## Sources and memory

```ts
// Node/Bun: file paths are read on demand.
import { DemoReader, EntityMode, httpDemoSource } from 'cs2parser';
await new DemoReader().parseDemo('/path/match.dem', { entities: EntityMode.ALL });

// Browser, Node or Bun, with strict HTTP Range support:
const source = await httpDemoSource(url, signal);
await new DemoReader().parseDemo(source, { entities: EntityMode.ALL });
```

Both exports also accept `DemoByteSource`, a stable `size` and
`read(offset, length, signal)` contract, and `Uint8Array` for already-owned bytes.
Browser File/Blob reads use slices. Nonseekable streams and live broadcasts retain
their existing sequential parsing path. Pause/seek/resume controls require a file path, File/Blob, Uint8Array or
DemoByteSource; pass the browser File directly rather than `file.stream()`.
Callers must keep the source unchanged throughout parsing and seeking, including
files, remote resources and caller-owned Uint8Array input. The parser does not
monitor source changes. HTTP requires Content-Length and valid 206/Content-Range
responses, exposed through CORS when needed. A server returning the whole file to
a Range request is rejected. Custom sources must return exactly the requested
length in storage they will not mutate.

The reader retains one live entity world, the initial hydration metadata, compact
FullPacket locations, and decoding scratch space. It retains no per-tick snapshots,
round frames, or whole decoded match. A 16 KiB read window amortizes command-header
reads; some bytes of skipped bodies can be fetched as read-ahead. Selected commands
larger than that window are read in full. `seekMemoryBytes` estimates retained
hydration metadata and locations, excluding the live world, transient restoration
copies, source-owned data, decompression scratch, and engine object overhead. It is
a deterministic data estimate, not a heap profiler measurement.

`parseDemo()` accepts `maxFullPackets` (default 4096), `maxSeekBytes` (default 32 MiB for
the retained metadata estimate), and `maxFrameBytes` (default 64 MiB per encoded
command). Exceeded limits reject explicitly. One encoded/decompressed command,
current baselines, and one live world must still fit in memory; compressed output
and the live world are not capped by `maxSeekBytes`. Release the parser and your
own old display buffers when switching demos. The example retains only current
player text, not a history of snapshots.

## Limitations and validation

FullPacket seeking assumes the demo's snapshot describes its complete live world
and that post-hydration metadata needed at a checkpoint is represented by accumulated
FullPacket tables. Nonstandard demos with later serializer changes, new table
layouts, or event descriptor updates only in skipped ordinary packets are not
supported by this fast path. Use sequential `parseDemo()` for those files. User
command delta history outside a snapshot is not independently restored; usercommand
notifications may require a later full command baseline. Live entity IDs and state
are restored, but historical sparse-array holes from previously deleted slots are
not reproduced.

Tests compare live entity properties (including available smoke journals), player
identities, positions, health, teams, scores, timing, and annotated/synthetic game
events against full sequential parsing. They exercise forward, backward and repeated
seeks, round boundaries, exact FullPacket ticks, deletion/recreation, missing or
unusable checkpoints, cancellation and operation overlap.

`tickstart` sees state before that tick's packets; `tickend` sees state after them.
Use `tickend` when displaying completed tick state.

Build the browser example with
`bun build src/browser.ts --target browser --outfile dist/replay-browser.js`,
serve the repository over HTTP, and open [examples/replay.html](../examples/replay.html).
