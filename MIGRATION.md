# Migration Guide

## Breaking Async Parsing Contract (Unreleased)

All async parsing APIs now reject on failure, including I/O, corrupt data,
decompression, synchronous application callbacks, and invalid usage. There is
no required `error` listener and no fulfilled error result.

- `parseDemo()` returns exported `ParseOutcome`: `{ status: 'complete' } | { status: 'incomplete' } | { status: 'cancelled' }`.
- `parseHttpBroadcast()` and `HttpBroadcastReader.run()` return exported `BroadcastOutcome`: `{ status: 'complete' } | { status: 'cancelled' } | { status: 'timeout' }`, not `void` or an error terminus.
- `HttpBroadcastReader.start()` returns exported `BroadcastStartOutcome`: `{ status: 'ready' } | BroadcastOutcome`. Fatal signup/full/initial-delta failures now reject immediately. Completion or cancellation during startup needs no `run()` call.
- `end` carries exported `ParseEnd`: nonfailure outcomes plus `{ status: 'error', error: unknown }`. Replace `incomplete`, `reason`, and optional `error` checks with a `status` switch. `EndReason` and `BroadcastTerminus` are removed, without aliases.
- The promise is authoritative. If a completion listener throws, it rejects even though a nonfailure end notification was already emitted. Reporting listeners cannot replace an existing failure: first failure wins. Async listener promises remain ignored.
- Async metadata reads already reject and retain that behavior. Synchronous metadata reads and `cancel()` still throw synchronously.

```ts
try {
	const outcome = await parser.parseDemo('demo.dem');
	if (outcome.status !== 'complete') console.warn(outcome.status);
} catch (error) {
	console.error('Parsing failed:', error);
}

const started = await broadcast.start();
const outcome = started.status === 'ready' ? await broadcast.run() : started;
```

See [parsing](docs/parsing.md) and [broadcast lifecycle](docs/http-broadcast.md)
for cancellation, timeout, cleanup, and callback details.

## Migrating From 1.x

## Metadata

**Before:** synchronous server metadata calls. **After:** the same names remain synchronous; use the matching `Async` methods only when you want promises.

```ts
import { DemoReader } from 'cs2parser';

const path = 'demo.dem';
// Before and after: no change needed for synchronous callers.
const header = DemoReader.parseHeader(path);
const serverInfo = DemoReader.parseServerInfo(path);
const fileInfo = DemoReader.parseFileInfo(path);

// After: optional async reads; likewise parseServerInfoAsync / parseFileInfoAsync.
const asyncHeader = await DemoReader.parseHeaderAsync(path);
```

Unsuffixed methods accept paths, `Buffer`, or `Uint8Array`, return metadata or `null`, and throw synchronously. They block the calling thread; use them in batch jobs/workers. Blob/File inputs require `*Async`, which rejects on errors. Browser metadata exposes only `*Async`. `parseDemo()` stays async; `stream: false` selects larger chunks, not synchronous parsing.

## Other Changes

- **Progress:** before `reader.on('progress', fraction => show(fraction))`; after `reader.on('progress', bytes => show(bytes / totalBytes))`. Unread trailers can leave the fraction below 1.
- **Bytes:** before `bytes.toString('utf8')` on a Buffer; after `new TextDecoder().decode(bytes)` on a `Uint8Array`.
- **Messages:** before `reader.parseDemo(path, { svc_VoiceData: true })` enabled decoding; after `reader.on('svc_VoiceData', onVoice)` before parsing enables it automatically. Flags remain available for explicit overrides.
- **Emitter:** before Node's `EventEmitter.defaultMaxListeners = 20`; after `reader.setMaxListeners(20)`. Portable `events` does not support Node's native `instanceof` assumptions, `errorMonitor`, or `captureRejections`; catch async-listener failures explicitly, e.g. `task().catch(onError)`.
- **Browser:** before the Node-only `import { DemoReader } from 'cs2parser'`; after browser code uses `import { DemoReader } from 'cs2parser/browser'` and `await DemoReader.parseHeaderAsync(file)`. Server imports stay unchanged; both exports use embedded WASM instead of native addons. See [browser/CSP requirements](README.md#browser).

## Server Metadata Timings

**Median milliseconds per 5,000 calls; `*Async` / unsuffixed (sync).** Five fresh processes per case, 1,000 warmup calls, sequential shuffled runs. Same 329 MB `test-fixtures/v2/demo.dem`, warm filesystem cache, Linux ARM64; measured 2026-09-09 using the built **server** export before this naming change. Imports, byte-buffer loading, and warmup are excluded; path timings include I/O. Decoding and I/O implementations are unchanged.

| Runtime      | Helper            |       File Path | In-Memory Bytes |
| ------------ | ----------------- | --------------: | --------------: |
| Node 22.23.2 | `parseHeader`     |   1027.5 / 44.8 |     17.4 / 12.0 |
| Node 22.23.2 | `parseServerInfo` |  3692.2 / 339.9 |   259.9 / 236.1 |
| Node 22.23.2 | `parseFileInfo`   |   1336.1 / 39.6 |      14.4 / 8.8 |
| Bun 1.3.14   | `parseHeader`     |    953.1 / 25.7 |      11.2 / 6.3 |
| Bun 1.3.14   | `parseServerInfo` | 4863.6 / 2627.3 | 1862.7 / 2488.4 |
| Bun 1.3.14   | `parseFileInfo`   |   1224.1 / 22.6 |       7.6 / 2.6 |

Path gains include bypassing Blob/async I/O overhead, not just promises. **Sync is not universally faster:** buffered server-info decoding was slower on Bun here. These are repeated metadata queries, not full-demo or cold-disk speedups; measure your workload.
