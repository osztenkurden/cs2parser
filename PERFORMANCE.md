# Browser-Support Performance Audit

Measured September 8-9, 2026 against the uncommitted `feat/browser-support` worktree.
The repository's primary branch is `master`; no `main` exists.

## Server WASM Follow-Up

`feat/server-wasm-snappy` switches the server to the same embedded decoder as the
browser, including metadata and broadcasts. Native Snappy is now development-only.
The original audit and native-baseline tables below remain historical measurements
of `289240f`, not a description of the current server backend.

A subsequent controlled comparison changed only the codec in the server parser,
keeping the 64 KiB file-input path, fixture, and subscriptions identical. Five fresh
processes per case, randomized sequential order on the same Linux arm64 host:

| Runtime | NONE Time Reduction | ONLY_GAME_RULES Time Reduction | ALL Time Reduction |
| --- | ---: | ---: | ---: |
| Bun 1.3.14 | 14.7% | 3.2% | 2.8% |
| Node 22.23.2 | 13.6% | 5.9% | 4.5% |
| Node 24.20.0 | 17.8% | 7.4% | 5.1% |

These gains are relative to the already-optimized native server, not master.
Both codecs matched the complete corrected golden in all three runtimes. This
remains a single-fixture ARM64 result, not a universal native-versus-WASM claim.

## Baselines And Method

- Primary baseline: `master`, `57d79fc358203ef384fe61ed3b7f478bd91f8357`.
- Original browser branch: `01ea98b63792ba88ad2f819a3653d3fa00224bf1`.
- Fixture: release `test-fixtures/v2/demo.dem`, 329,136,562 bytes, `de_ancient`, final tick 185922.
- Fixture SHA-256: `143eb78444727c7a8afa29d807272076d14044fc9d7c233035d0b9a176e70f60`.
- Environment: Linux arm64 container, four Apple CPU cores exposed by the host; the exact CPU model is not exposed. Memory limit: 4 GiB.
- Runtimes: Bun 1.3.14 and Node 22.23.2. System Node 20 is below the package's supported minimum and was not used for the final parser comparison.
- Equivalent bundles built with Bun's `--target=node --packages=external`. Native cases use default 64 KiB file streams; WASM cases use identical 64 KiB Web Stream adapters.
- Final matrix: five fresh processes per case, deterministic randomized sequential order, 30 cases / 150 parses. No other tests or benchmarks ran concurrently with these timings.
- Timing includes warm-cache input I/O and parsing, excludes imports, and includes first-use WASM initialization. Each case subscribes to `player_death`; every run completed with 224 deaths and 0, 1, or 202 final entities according to mode.
- Correctness hashing runs separately. It is not included in throughput timings. RSS is reported both after parsing and as process high-water RSS, not as a heap allocation count.

Exact samples, execution order, input methods, paths, ranges, and memory measurements
are in [benchmarks/browser-support/results.json](benchmarks/browser-support/results.json).
These are single-fixture results, not universal throughput guarantees. Existing
README and `benchmark.md` tables retain their original machine/runtime measurements.

## Final Results

Median milliseconds; lower is better. Percentage columns compare final against the
original browser branch, not an intermediate optimization candidate.

### Native Server

| Runtime | Mode | master | Original Branch | Final | Time Change |
| --- | --- | ---: | ---: | ---: | ---: |
| Bun | NONE | 665.3 | 689.9 | 704.5 | +2.1% |
| Bun | ONLY_GAME_RULES | 3233.5 | 3219.5 | 2609.1 | -19.0% |
| Bun | ALL | 4389.6 | 4346.7 | 3611.9 | -16.9% |
| Node 22 | NONE | 878.6 | 888.1 | 882.9 | -0.6% |
| Node 22 | ONLY_GAME_RULES | 4217.4 | 4195.0 | 3222.3 | -23.2% |
| Node 22 | ALL | 6542.6 | 6529.0 | 5365.6 | -17.8% |

Against **master**, entity-enabled native parsing is approximately 18-24% faster.
Native NONE is essentially unchanged on Node but remains 5.9% slower than master
on Bun. The small Bun NONE regression was not hidden by averaging entity modes.
Stronger bounds/error handling remains; disabling validation or worsening default
responsiveness was not accepted merely to improve this number.

### Browser Export / WASM

These are the browser export running under Bun/Node, **not Chrome, Firefox, or
Safari throughput measurements**. Real-engine correctness is checked separately.

| Runtime | Mode | Original Branch | Final | Time Change |
| --- | --- | ---: | ---: | ---: |
| Bun | NONE | 637.4 | 598.0 | -6.2% |
| Bun | ONLY_GAME_RULES | 3067.5 | 2479.8 | -19.2% |
| Bun | ALL | 4015.9 | 3428.8 | -14.6% |
| Node 22 | NONE | 850.5 | 779.4 | -8.4% |
| Node 22 | ONLY_GAME_RULES | 4063.2 | 3082.6 | -24.1% |
| Node 22 | ALL | 6314.8 | 5177.4 | -18.0% |

Bun's original WASM ALL samples ranged from 3941 to 4376 ms; final samples ranged
from 3421 to 3513 ms. The direction is clear, but a single precise percentage
should not be assumed on other hardware or demos.

### Memory And Size

| ALL Mode | Original Peak RSS MiB | Final Peak RSS MiB |
| --- | ---: | ---: |
| Bun native | 183.7 | 182.3 |
| Node native | 166.3 | 154.1 |
| Bun WASM | 163.6 | 181.9 |
| Node WASM | 158.0 | 145.2 |

Memory is not uniformly lower. Schema-local field plans trade bounded retained
schema storage for less repeated resolution; Bun WASM ALL's sampled peak increased
by about 18 MiB. Removing the append-only global quantized-float registry and
releasing completed readers' WASM storage address lifetime leaks independently of
these fresh-process peak measurements. Actual reclamation remains GC-controlled.

The sum of emitted runtime ESM files for both exports fell from 683,275 to 623,681
bytes, about **8.7% smaller**. Sum of individually gzipped files was effectively
unchanged: 93,974 versus 93,921 bytes. There is no substantial compressed-network-size
claim. Lazy base64 descriptors reduced their generated source from 52,086 to
20,747 bytes and avoid eager byte-array construction for ordinary demo parsing.

The standalone WASM binary grew from 1,437 to 2,050 bytes. The extra 613 bytes enable
bounded wide copies and bulk-memory operations. Modern WASM bulk-memory support is
required; there are still no WASI imports, workers, threads, or runtime WASM assets.

## Retained Changes

- **Shared architecture preserved.** Both exports still share one parsing implementation. Native Snappy remains the server default; browser code still needs no Node globals.
- **Field plans instead of copied paths.** Lazily built, class-local serializer plans resolve decoder metadata during the path phase. Updates save plan references and full-width indices, not 8192 eagerly allocated path objects. All paths still precede all values on the wire.
- **Local container caching.** Consecutive writes in one entity update reuse the current container. Growth refreshes the cache; resizes and scalar replacements invalidate it. Nothing caches user-mutable entity storage across updates.
- **Small Huffman primary table.** A 512-byte, 8-bit lookup handles common codes; long codes use the remaining tree. Common Plus operations bypass generic dispatch. Truncated long-code consumption remains atomic.
- **Discard-only decoding.** Unstored values do not allocate vectors, strings, BigInts, or binary blocks. Baselines and unsupported encodings are still validated. Quantized parameters are owned by the schema rather than a global append-only registry.
- **Bit-reader hot paths.** Uint64 varints accumulate low/high words before one final BigInt conversion. Larger unaligned copies use word loads with byte stores. Redundant per-reader scratch arrays and mask tables were removed.
- **Packet lifetime allocation.** A session-owned bump arena replaces first-fit splitting, zero-fill, individual frees, and coalescing. Queued entity messages survive arena growth and still execute after string-table updates. Packet queues are reused and cleared on exceptions; core-message scratch grows beyond the old 256 KiB limit. The unused allocator and its obsolete tests were removed.
- **Direct Node input adapter.** Node iterators feed the shared reader contract without a second Web Stream queue. No duplicate parsing loop or public source-plugin framework was introduced.
- **Ownership-aware decompression.** Subscribed compressed frame events use owned decompression directly instead of copying reusable output a second time. WASM caches its memory view and does not parse the length twice in JavaScript.
- **WASM copy optimization.** Literals and suitable backreferences use bounded wide/bulk copies; overlapping backreferences retain forward-expansion semantics. All 176,626 real compressed frames were differentially checked against native Snappy.
- **Smaller incidental work.** Game-event subscription checks use listener counts instead of allocating `eventNames()` arrays. Event queues are cleared rather than replaced. Broadcast descriptors materialize only when needed.

## Correctness And Compatibility

- Signed ZigZag decoding now handles the full int32 range. The release fixture exposes three intermediate soundscape-hash corrections; final state was unchanged. MASTER's original golden is preserved, with only independently verified corrections overlaid. See [fixture documentation](tests/fixtures/README.md#audited-master-differences).
- Strings beyond 4096 bytes no longer silently truncate. Incomplete byte copies/skips and exhausted bit reads now reject rather than returning stale/partial data. Packet, binary-block, and string-table lengths are checked before allocating their bodies. Unsupported non-byte-aligned table values fail explicitly instead of silently discarding their bits.
- A dedicated outer-frame refill signal replaces catching every `RangeError` as incomplete input. Corrupt complete protobuf frames now terminate promptly, even when their source never sends EOF. Overflowing frame-header varints are rejected in both lookahead paths.
- Truncated trailers report consistent completed-byte progress across buffers and streams.
- Standalone Snappy rejects mathematically impossible expansion lengths before allocation or memory growth. This is a conservative format-derived bound, not an arbitrary cap or complete pre-validation scan.
- Decoder `release()` drops per-reader storage while preserving the reusable compiled module. Completed, failed, and cancelled readers release it. Metadata calls no longer retain a global decoder's high-water allocation.
- Cancellation settles Node streams with `emitClose: false`; cancelling a broadcast stops later commands from recreating already-released decoder memory. Pending event queues are cleared on cancellation.
- README migration notes now explicitly describe the portable emitter's limitations and the `Uint8Array` byte contract. The branch's asynchronous metadata/progress changes remain. Property-decoder introspection now exposes schema-owned quantized parameters, not a global numeric registry index.
- CI no longer treats a failed fixture download as permission to silently skip every real-demo regression test. Local runs still skip unavailable fixtures normally.

## Rejected Experiments

| Approach | Evidence / Decision |
| --- | --- |
| All-bulk-copy Snappy | Regressed Bun frame decoding about 17%; retained a hybrid with bounded short-copy paths. |
| Per-output DataView for unaligned copies | Helped large Node copies but hurt short Bun copies and allocated another object; retained byte stores. |
| Per-update decoder records | Modest gains; superseded by schema-local plans. |
| 10-bit Huffman primary table | Effectively tied on Bun, about 2.2% slower on Node than the 8-bit variant. |
| Opcode-guided prefix stack | Added bookkeeping; Bun regressed about 2.7%, no useful Node gain. |
| Inline scalar/container-resize writes | No useful gain; kept the shared update helper. |
| Projected PacketEntities protobuf decoder | Node ALL regressed about 4.6%; a second skip variant still regressed. It also weakened validation of unused nested metadata. Public generated decoders remain unchanged. |
| Exact-boundary protobuf DataView cache | No consistent throughput gain; not retained. Boundary regression tests were kept. |
| Relocated/bit-count packet bounds checks | Mixed or worse results, especially the targeted Node NONE case; retained the common pre-allocation guard. |
| Larger default file chunks | Improved Node NONE, but 5 ms timer p99 gaps in ALL rose from about 9.8 ms at 64 KiB to 18.1 ms at 256 KiB and over 21 ms at 1-4 MiB. Default remains 64 KiB; explicit `stream: false` retains 4 MiB. |
| Clock batching / weaker responsiveness | Not retained. Per-frame cancellation and elapsed-time checks remain. |
| Cosmetic hot-loop cleanup | Measured no win or small regressions; avoided unrelated rewriting. |
| Separate discarded-entity loop | Hoisting alone did not fix the Node regression and added duplicate looping. The scalar dispatch fix below worked without it. |

One important failed intermediate result: the initial discard decoder made Node
ONLY_GAME_RULES **about 32% slower than the original branch**, despite improvements
against an already-regressed intermediate candidate. A complete original-baseline
matrix caught this. Keeping quantized decoder objects out of the numeric switch
and handling the common scalar types directly reduced the candidate from about
5.5 seconds to 3.2 seconds. The final matrix above was rerun after that correction.
This is why isolated microbenchmarks and comparisons only to the previous candidate
were not sufficient acceptance criteria.

Codec-only screening on the same corpus improved WASM frame decoding by about
18% on Bun and 34% on the installed Node 20. Those are supporting codec experiments,
not supported-Node end-to-end results; the final parser table uses Node 22 instead.
Exploration reports and fixed experiment bundles remain under `/tmp/opencode/`
and `node_modules/.cache/cs2parser-entity-perf/`, outside the tracked source tree.

## Verification

- Untouched browser branch baseline: 335 tests passed, five bot-fixture tests skipped.
- Final unit/integration run: **753 passed, five skipped, zero failed**, 414,667 assertions across 41 files. The complete suite took about 326 seconds; an earlier 300-second tool timeout was rerun with a sufficient overall timeout.
- Deep parity covers all entity modes, both exports, path/Buffer/typed-array inputs, multiple stream chunk sizes, nine intermediate checkpoints, final entities, userinfo, ordered raw events, and synthetic round payloads.
- Package build, generated-data/source-hash checks, both source typechecks, DOM-only emitted declaration consumer, formatting, and the package dry run passed. Package smoke checks passed on Node 22.23.2 and Node 24.20.0, including native cancellation with and without close events.
- **All 30 Playwright cases were verified** across Chromium, Firefox, and WebKit, including File/fetch streams, a module worker, compressed broadcasts, cancellation, and deep real-demo state hashes. Chromium and WebKit each passed their entire ten-case group. A combined run passed 28/30; the two Firefox ALL cases hit the 4 GiB container's memory limit and both passed in separate fresh processes. This is not reported as an all-green combined run.
- The stripped local image needed rootless browser libraries and executable overrides; the stock launch failed before executing browser code. The final browser checks used those libraries, not application polyfills. CI installs normal Playwright system dependencies.

Remaining limits: one human-match fixture, no separate bot recording, no exhaustive
fuzzing, and no multi-hardware performance guarantee. The general bit-reader's
pre-existing tolerance for some overlong uint32 varints is not a strict-validation
guarantee. Retained entity/property objects remain application-owned; releasing
decoder storage does not erase them or force garbage collection.

## Reproduce

Use Node 22+ on PATH and install dependencies with the frozen lockfile. For the
normal correctness/package workflow:

```sh
bun install --frozen-lockfile
npm run build
npm run test:node
CS2_DEMO_PATH=/tmp/opencode/demo.dem bun test --timeout 300000
npx playwright install --with-deps chromium firefox webkit
CS2_DEMO_PATH=/tmp/opencode/demo.dem npm run test:browser
```

The timing record doubles as a case configuration. Its paths identify the exact
local checkouts and runtime used; adjust them on another machine. Build equivalent
timing artifacts in each checkout (master has only `src/index.ts`):

```sh
bun build src/index.ts src/browser.ts --target=node --packages=external --outdir=dist
node scripts/benchmark-compare.mjs /tmp/opencode/demo.dem benchmarks/browser-support/results.json /tmp/opencode/recheck.json 5
```

Normal `npm run build` cleans these experimental `.js` bundles and emits the
published `.mjs` package, so rebuild timing artifacts after a package build.
`scripts/benchmark-run.ts` also supports `CS2_PARSER_ENTRY` for a specific built
entry and `CS2_BENCH_SUBSCRIPTIONS=none|death|all` for focused workloads.
The legacy benchmark-document generator was deliberately not used or overwritten.

For codec-only comparisons:

```sh
bun scripts/benchmark-snappy.mjs /tmp/opencode/demo.dem /tmp/opencode/cs2parser-browser-baseline/src/compression/wasm.ts src/compression/wasm.ts 7 3
```

For constrained Firefox runners, run individual real-demo cases with
`--project=firefox --grep 'real demo deep parity: ALL / fetch$'` or the corresponding
`ALL / 4093$` filter. Keep the full hash assertions; do not interpret an OOM-killed
browser as a correctness pass.
