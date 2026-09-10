# Browser usage

[Back to README](../README.md#documentation)

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

