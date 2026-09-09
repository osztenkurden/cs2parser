# Browser compatibility: approved design and implementation

Branch: `feat/browser-support`, based on `57d79fc`.

The original implementation and measurements below are preserved as historical context.
The follow-up optimization audit, current implementation differences, final comparison
against both baselines, and verification limits are in [PERFORMANCE.md](PERFORMANCE.md).

## Approved decisions

| Area | Decision |
| --- | --- |
| Exports | Keep `cs2parser` for Node/Bun; add a dedicated `cs2parser/browser` with browser-supported arguments. |
| Reuse | Both `DemoReader` classes inherit a shared base. Retain the entity decoder, message subscriptions, helpers, and HTTP transport. |
| Inputs | Shared `Uint8Array` and Web Streams. The server additionally adapts file paths and Node `Readable` streams. |
| Broadcasts | Support HTTP GOTV broadcasts in both exports, including default event descriptors. |
| Snappy | Implement our own standalone WASM decoder for browsers. Keep native Snappy on the server. Support reusable caller-owned output. |
| Metadata | Make all three helpers asynchronous. Accept bytes and Blob/File in both exports, plus paths on the server. |
| Progress | Report cumulative bytes parsed. Applications calculate a fraction when they know the input size. |
| Events | Use the browser-compatible `events` package to preserve ordering, duplicate-listener removal, meta-events, prepend methods, and listener limits. |

## Project findings

The original parser already had a suitable incremental frame decoder and reusable carry buffer. Its browser blockers were concentrated in the public parser, native Snappy imports, Buffer allocations, Node emitters, a separate filesystem parsing loop, and the filesystem-loaded event descriptor binary. Generated protobuf and entity decoding code required no rewrite.

Inspection of the published `snappy` 7.3.3 and 7.4.2 browser packages found a WASI/NAPI loader, worker assets, and shared WebAssembly memory with 4,000 initial pages (250 MiB). Neither API exposed caller-owned decompression output. The user selected the standalone implementation after this investigation. The upstream source and loader are maintained in [Brooooooklyn/snappy](https://github.com/Brooooooklyn/snappy).

## Implementation

- `src/parser/base.ts` owns demo parsing, events, entities, helpers, cancellation, and broadcast setup. Input handling uses `getReader()` and the existing asynchronous frame loop. Early completion, errors, and cancellation cancel unread input and release the stream lock. A reader handles one parse.
- `src/parser/index.ts` provides native Snappy, path/Node-stream adapters, and file-backed metadata. `stream: false` retains larger chunk reads through the same asynchronous loop; the old file-descriptor parser was removed.
- `src/browser.ts` provides a browser-only `DemoReader`, standard input types, and the standalone `SnappyDecoder`. Shared exports live in `src/shared.ts`.
- `wasm/snappy.c` implements the [raw Snappy format](https://github.com/google/snappy/blob/main/format_description.txt) with no imports, allocator, libc, WASI, or threads. The compiled module is 1,437 bytes, embedded in TypeScript. It validates lengths, literal tags, all three copy tags, offsets, and exact completion.
- `src/compression/wasm.ts` caches the compiled module and reuses per-decoder WASM memory and frame storage. `uncompress(input, output?)` copies into caller-owned storage when supplied. JavaScript buffers cannot become arbitrary WASM linear memory: input/output copies remain, while repeated allocations of the large output storage are avoided. Nested string-table decompression gets owned output; retained event bytes and snapshot baselines are copied before frame storage is reused.
- `src/parser/metadata.ts` reads frame headers and relevant bodies with typed-array slices or `Blob.slice()`. It skips unrelated signon frame bodies and seeks directly to the trailer offset. Missing/truncated metadata resolves to `null`; malformed data and I/O failures reject.
- Broadcast event descriptors are generated from the existing binary into a byte-array module, decoded lazily, and checked during builds. No runtime descriptor asset is needed.
- The `events/events.js` import selects the portable emitter explicitly. A type-only interface keeps declarations free of Node types; subscription invalidation continues through meta-events. The implementation comes from [browserify/events](https://github.com/browserify/events).
- Both entry points build to ESM with separate public declarations. Browser source and a package consumer are typechecked with `types: []` and `skipLibCheck: false`.

## Compatibility notes

Server metadata calls need `await`. Progress is a byte count, including the 16-byte prefix and completed frames. It measures consumption, not download progress; ordinary parsing can stop before unread trailer bytes, so dividing by file size need not reach 1. Trailer subscriptions continue to EOF.

The browser export cannot open filesystem paths or accept Node-only options. Use `file.stream()`, `response.body`, or bytes. HTTP access requires the relay's CORS permission. Ordinary pages and module workers work without cross-origin isolation. Pages using CSP must permit WASM compilation, for example with `'wasm-unsafe-eval'` in `script-src`; see [CSP's WebAssembly integration](https://www.w3.org/TR/CSP3/#can-compile-wasm-bytes).

## Validation

The original branch passed 313 tests with 5 skipped using the available real demo. The skipped tests require a separate bot fixture.

Final results after the stream-adapter fix: 335 unit/integration tests passed, 5 bot-fixture tests skipped, and all 15 Playwright tests passed across Chromium, Firefox, and WebKit. Formatting, generated-data checks, both source typechecks, the emitted browser declaration consumer, the package build, and Node 22/26 package smoke checks passed. The frozen Bun lockfile installs without changes. The package dry run includes both exports and their shared runtime/type files.

The new checks cover native/WASM decompression parity, malformed blocks, caller-owned slices, overlapping copy tags, nested compressed tables/entries, retained frame bytes and snapshot baselines, split stream input, progress, cancellation during a pending read, source failures, large metadata headers, bounded Blob reads, missing files, emitter semantics, and concurrent-reader rejection.

The Playwright suite consumes a browser bundle built from the package output and exercises File streams, fetch streams, compressed HTTP broadcasts with embedded descriptors, pending-read cancellation, a module worker, and a real demo comparison in Chromium, Firefox, and WebKit. Tests run without Node globals or cross-origin isolation. CI installs all three browsers and runs the suite.

Reproduce the checks with:

```sh
npm run format:check
npm run build
npm run test:node
CS2_DEMO_PATH=tests/fixtures/003838660961779056911_2094919404.dem npm test
npx playwright install --with-deps chromium firefox webkit
CS2_DEMO_PATH=tests/fixtures/003838660961779056911_2094919404.dem npm run test:browser
```

Only changes to `wasm/snappy.c` require Clang plus `wasm-ld` and `npm run build:snappy`. Normal builds check the recorded source hash and use the embedded module. Descriptor changes require `npm run generate:broadcast-descriptors`.

## Scope limits

No worker pool, worker messaging API, codec plugin system, legacy-browser polyfills, HTTP range client, proxy server, compression encoder, or framed-Snappy API. Applications can supply their own workers and fetch logic. Existing entity modes, event payloads, helpers, and parse results remain shared.

## Performance comparison

The first measurements below preceded the stream-adapter fix. Updated comparisons follow them.

Measured on 2026-09-08 with Bun 1.4.2, Linux x86_64, and an AMD Ryzen 7 5800X. The demo is 170,219,877 bytes (162.3 MiB). Each cell is the median of three fresh, sequential processes with a `player_death` listener. Original and new server inputs were file paths; the browser export used a Web Stream adapted from 64 KiB file chunks. Imports were excluded from timing; the WASM decoder initialized during parsing. RSS was sampled after parsing, not at peak.

| Entity mode | Original server ms / RSS MiB | Shared server ms / RSS MiB | Browser WASM in Bun ms / RSS MiB |
| --- | ---: | ---: | ---: |
| NONE | 331 / 111 | 423 / 115 | 369 / 111 |
| ONLY_GAME_RULES | 1710 / 112 | 1802 / 121 | 1778 / 110 |
| ALL | 2275 / 122 | 2581 / 135 | 2253 / 128 |

Final entity-state SHA-256 hashes, tick 98,691, and 109 player-death events matched across all implementations and repeats. Entity counts were 0, 1, and 185 for NONE, ONLY_GAME_RULES, and ALL respectively. The shared server path measured about 28%, 5%, and 13% slower than the original in these samples; the browser WASM path measured about 11%, 4%, and -1%. These are whole-parser measurements in Bun on one fixture, not isolated codec or browser throughput benchmarks. The new Web Stream input adapter has measurable overhead; these initial measurements prompted the stream-adapter investigation below.

The existing README benchmark tables predate this change and use a different machine/demo; they should not be interpreted as measurements of this branch.

### Stream-adapter investigation and fix

The standard `Readable.toWeb()` implementation copies every Node Buffer into a new Uint8Array before enqueueing it. This adds roughly another 170 MB of input allocation/copying on this demo, along with an extra queue and pause/resume handoff. The copy is explicit in both the [Bun 1.4.2 adapter](https://github.com/oven-sh/bun/blob/bun-v1.4.2/src/js/internal/webstreams_adapters.ts#L536-L540) and the [Node 26.7 adapter](https://github.com/nodejs/node/blob/v26.7.0/lib/internal/webstreams/adapters.js#L543-L548).

Isolation tests held the parsing core and native decoder fixed. Bypassing this adapter recovered most of the time; changing only the emitter back to the native emitter did not consistently recover the stream-path slowdown. Input copies and the stream handoff are the main demonstrated cause. The measurements do not isolate how much of the gain comes from each.

`src/parser/index.ts` now wraps the Node async iterator in a small pull-based Web Stream that forwards the existing chunks. Browser inputs and the shared parser remain unchanged. Cancellation destroys the Node source before returning the iterator, so a pending read cannot leave cleanup waiting forever. Backpressure remains bounded to the Node buffer plus one Web Stream chunk.

Bun 1.4.2 comparison after the fix: five fresh processes per case, randomized sequential order, the same machine/demo/listener as above, with no other benchmark or test runs in parallel. Values are median milliseconds.

| Mode | Original server | Before fix | After fix | Remaining difference from original |
| --- | ---: | ---: | ---: | ---: |
| NONE | 324 | 434 | 352 | +8.8% |
| ONLY_GAME_RULES | 1725 | 1878 | 1744 | +1.1% |
| ALL | 2240 | 2349 | 2286 | +2.1% |

Ticks, event counts, and full final entity-state hashes match in every run. Some ALL-mode samples varied from about 2.27 to 2.51 seconds after the fix, so the remaining small differences should not be treated as a precise constant. The residual cost is not fully isolated; eliminating every last percent would require further profiling, rather than assuming browser compatibility itself must cost this much.

Node 26.7.0 was checked separately using equivalent bundles of all three versions (three fresh, randomized sequential processes per case):

| Mode | Original server ms | Before fix ms | After fix ms |
| --- | ---: | ---: | ---: |
| NONE | 388 | 402 | 397 |
| ALL | 2928 | 2922 | 2868 |

Node did not reproduce the large Bun regression: after the fix it was about 2% slower for NONE and 2% faster for ALL than the original, with matching final state. The earlier 5–28% figures therefore describe the initial Bun measurements, not a general Node/browser penalty.

After the adapter change, the full Bun suite passed 335 tests with the same 5 bot-fixture skips. Build, browser declaration checks, formatting, and Node 22/26 package smoke checks passed. New regression checks exercise cancellation during a stalled Node read and successful completion before a Node source sends EOF.
