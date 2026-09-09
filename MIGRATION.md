# Migrating From 1.x

## Metadata

`parseHeader`, `parseServerInfo`, and `parseFileInfo` remain synchronous on the server. Opt into promises with the matching `Async` methods:

```ts
import { DemoReader } from 'cs2parser';

const path = 'demo.dem';
const header = DemoReader.parseHeader(path);
const serverInfo = DemoReader.parseServerInfo(path);
const fileInfo = DemoReader.parseFileInfo(path);
const asyncHeader = await DemoReader.parseHeaderAsync(path);
```

Unsuffixed methods accept paths, `Buffer`, or `Uint8Array`, return metadata or `null`, and throw synchronously. They block the calling thread; use them in batch jobs/workers. Blob/File inputs require `*Async`, which rejects on errors. Browser metadata exposes only `*Async`. `parseDemo()` stays async; `stream: false` selects larger chunks, not synchronous parsing.

## Other Changes

- **Progress:** values are parsed bytes, not fractions. Divide by total input size; unread trailers can leave the fraction below 1.
- **Bytes:** treat payloads as `Uint8Array`; replace Buffer-specific text conversion with `new TextDecoder().decode(bytes)`.
- **Messages:** subscribe to the network messages you need rather than relying on eager decoding.
- **Emitter:** portable `events` replaces Node's emitter. Native `instanceof` checks, Node-global defaults, `errorMonitor`, and `captureRejections` do not apply. Handle async-listener rejections yourself.
- **Browser:** import `cs2parser/browser`; server imports stay unchanged. Both use embedded WASM, without native addons. See [browser/CSP requirements](README.md#browser).

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
