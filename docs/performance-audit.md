# Performance audit: September 2026

[Benchmark usage](performance.md)

## Method

Baseline: master `819608921c021117540e119842506f4406cf32dd` (2.3.0).
Both revisions were bundled with the same `bun build --target=node` command.
Measurements used Bun 1.3.14 and Node 24.20.0 on Linux ARM64, with a three-CPU
container quota and a 4 GiB memory limit. The CPU model was unavailable.

Input: `003842189672549712349_0179118028.dem`, decompressed from the supplied
bzip2 archive, 321,837,400 bytes, SHA-256
`8c79250cc0e4d90ae076a022c0802f312a6058f05beddcff65de883d16214f02`.
Final tick: 183978; ALL-mode final entities: 225.

Path benchmarks include file I/O and first-use decoder initialization, but not
module imports. Runs used fresh sequential processes and deterministic shuffled
ordering; the OS file cache was not reset. These are single-demo measurements,
not guarantees for other recordings or machines.

## End-to-end results

Five runs per case without optional subscriptions. Rates and durations are
medians; MB/s uses decimal megabytes. Speedup is baseline time / updated time.

| Runtime | Entities | Before MB/s | After MB/s | Before ms | After ms | Speedup |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Bun | NONE | 184.9 | 545.6 | 1740.2 | 589.9 | 2.95x |
| Bun | ONLY_GAME_RULES | 114.4 | 126.0 | 2813.8 | 2554.3 | 1.10x |
| Bun | ALL | 84.2 | 91.6 | 3820.2 | 3513.8 | 1.09x |
| Node | NONE | 184.1 | 549.0 | 1747.9 | 586.2 | 2.98x |
| Node | ONLY_GAME_RULES | 78.7 | 111.3 | 4089.6 | 2891.8 | 1.41x |
| Node | ALL | 50.0 | 63.4 | 6435.0 | 5079.9 | 1.27x |

Three runs per case with ALL entities plus raw messages, reconstructed user
commands, and game-event subscriptions:

| Runtime | Before MB/s | After MB/s | Before ms | After ms | Speedup |
| --- | ---: | ---: | ---: | ---: | ---: |
| Bun | 19.3 | 32.5 | 16644.2 | 9909.7 | 1.68x |
| Node | 15.6 | 24.6 | 20578.3 | 13099.8 | 1.57x |

Faster processing does not uniformly lower process RSS. Median peak RSS for
unsubscribed ALL parsing increased from 184.1 to 195.5 MiB on Bun and from 219.4
to 236.1 MiB on Node. NONE changed from 133.8 to 157.8 MiB on Bun and from 115.7
to 106.6 MiB on Node. Subscribed Node parsing decreased from 273.9 to 253.7 MiB.
These include runtime heap/GC behavior, not just live parser storage.

## Kept changes

- Parser-owned positional file reads replace Blob slicing for path input. The
  handle remains open during pause/seek and closes on every terminal path,
  including after pending reads. The public `fileDemoSource()` contract is unchanged.
- Sequential seekable reads use 256 KiB windows and one speculative read.
  Reusable carry storage removes repeated split-frame allocations. Seek discovery
  retains its smaller 16 KiB reads and existing metadata/frame limits.
- Cached seek operations no longer create/await promises for synchronous work.
  The 16 ms cooperation and cancellation checks remain. Terminal cleanup detaches
  the internal cancel listener and releases input/decoder references while retaining
  final public entities, FullPacket locations, and diagnostic counters.
- User-command deltas validate every field but rewrite only spans changed by
  resets or replacement lists. Per-depth writers and reset paths are reused.
  Retained byte fields are copied; generated protobuf decoding remains authoritative.
- Snappy short literals and backrefs use bounded, unrolled word copies. Speculative
  stores never cross the output allocation, and overlapping backrefs retain forward
  copy semantics. Frame-buffer ownership and malformed-input handling are unchanged.
- Message subscription caching uses bounded numeric registry IDs rather than
  string Map lookups. Listener epochs and explicit enable/disable precedence remain.
- The default benchmark matrix now tests genuinely different transports. The old
  `path-sync` spelling remains accepted but is documented as a legacy alias, not
  a separate large-read strategy; `stream-large` explicitly uses a 4 MiB Node stream.

The isolated Snappy frame benchmark checked all 160,246 compressed blocks against
native Snappy. Median decode time fell from approximately 155 to 93 ms on Bun and
161 to 100 ms on Node, about 1.6-1.7x throughput. Isolated mixed user-command
decoding improved 1.90x on Bun and 1.62x on Node 22, with about 36% less sampled
JS heap allocation; the end-to-end subscription results above use Node 24.

## Worker experiment

`scripts/benchmark-workers.mjs` uses the **Web Workers API on Bun**, not
`node:worker_threads`. It is an aggregate-analysis benchmark, not a new public
parser transport. Normal parser callbacks still run synchronously in order and
see the live state for their tick.

There are 48 FullPacket boundaries in this recording. The experiment assigns
whole-tick ranges around those boundaries, restores each range through the
existing seek machinery (including schemas, serializers, string tables, and
event descriptors), then verifies tick/death counts, ordered game-event hashes,
and final entity-state hashes against a sequential parse.

| Scheduling | Storage | Workers | Observed speedup |
| --- | --- | ---: | ---: |
| Coarse, byte-balanced ranges | SharedArrayBuffer | 2 | 1.36-1.44x |
| Coarse, byte-balanced ranges | SharedArrayBuffer | 3 | 1.24x |
| Eight-interval batches | SharedArrayBuffer | 2 | 1.27x |
| One interval per queued job | SharedArrayBuffer | 3 | 1.26x |

The same aggregate/hash work runs in the reference. These timings exclude file
loading and header indexing, but include shared-buffer staging, worker startup,
reconstruction, messages, and result hashing. They are **not directly comparable**
to the no-subscription path table above. The two-worker shared case used roughly
1.04 GiB process peak RSS, including the reference run and retained demo input.

Fine-grained work stealing lost time rebuilding state; a three-worker interval
queue spent approximately 2.2 seconds of summed worker time reconstructing
boundaries. Coarse scheduling reduced this to roughly 0.2 seconds. Sending a
separate full-demo transferable to each worker was killed under the memory limit.
The harness also supports clone/transfer experiments, with an explicit memory
warning; shared storage is the default and recommended option.

```sh
npm run build
bun scripts/benchmark-workers.mjs /path/to/demo.dem 2 static shared
bun scripts/benchmark-workers.mjs /path/to/demo.dem 2 batched shared
bun scripts/benchmark-workers.mjs /path/to/demo.dem 3 dynamic shared
```

Workers are intentionally not enabled inside `parseDemo()`: returning small
aggregates is profitable, but transporting every mutable entity update and
replaying existing synchronous listener behavior is a different workload.

## Rejected experiments

- A per-class cache for short/single field paths and a scalar-update fast path
  produced only marginal gains, insufficient to justify more entity-path state.
- Special-casing the shortest Huffman operations did not beat the existing LUT.
- Direct bit cursors, overlapping cached word loads, lazy refill, and specialized
  DataView/string lookahead were measured on ALL and ONLY_GAME_RULES. Direct
  cursors helped Node by about 3% but regressed Bun selective parsing; no redesign
  was retained. Additional cursor/ownership regression tests were kept.
- Borrowing Snappy frame output directly from a separate WASM arena saved only
  about 2% in the small parser case and complicated scratch-input/error ownership.
  The existing owned frame buffer remains.
- Sparse numeric subscription arrays lost on Node; a bounded Uint8Array avoided
  that regression without adding another lookup layer.
- One MiB read-ahead helped Node slightly but regressed Bun and increased storage;
  256 KiB was the better cross-runtime compromise.
- Opening/closing a file for every range was slower than Blob reads. A single
  parser-owned handle supplied the I/O improvement without a new disposal API.
- A fully direct user-command protobuf decoder was rejected because it would
  duplicate field-name/scalar-type metadata absent from the generated delta schema.

## Correctness

- Full suite: 922 passed, 5 skipped (optional bot recording absent), zero failures
  with the independently hashed release fixture. The original golden was unchanged.
- The supplied recording matched untouched `8196089` at nine entity/player
  checkpoints and completion, including ordered raw and synthetic game events.
- All 1,836,020 reconstructed user commands matched an ordered deep hash of the
  baseline, with zero rejected commands. Additional delta fuzzing covered 57,270
  accepted/rejected inputs and retained-output ownership.
- Snappy verification includes all real-demo blocks, deterministic mutations,
  short-copy/overlap combinations, and input/output boundaries at WASM memory's end.
- Node package smoke tests and 15 Node file-handle/lifecycle tests passed.
- All 27 Chromium, Firefox, and WebKit checks passed, including real-demo deep
  parity, workers, broadcasts, cancellation, and replay. This container required
  local library/font/EGL configuration; the repository browser configuration was
  not weakened or changed.
- Server/browser typechecks, generated-source checks, package build, formatting,
  and whitespace checks passed.
