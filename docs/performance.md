# Performance and benchmarking

[Back to README](../README.md#documentation)

## Performance

Benchmark your own demo and hardware after building:

```sh
npm run build
bun run benchmark path/to/demo.dem --runs 5
# Optional machine-readable samples and a Markdown report:
bun run benchmark path/to/demo.dem --runs 5 --json benchmark.json --markdown benchmark.md
```

The default matrix uses Bun and the built server export: all three entity modes with the seekable file driver, then `ALL` with a Buffer, a default Node stream, a 4 MiB Node stream, and a Web stream. No optional event subscriptions are enabled. Each case runs in a fresh process, in deterministic shuffled order without overlapping runs. The report leads with mean/median throughput in MB/s (1 MB = 1,000,000 bytes), followed by median time and memory. JSON output retains all samples and mean, median, min/max statistics. Throughput is calculated per run from demo size and elapsed time, including input I/O but excluding imports/setup; the OS cache is not reset. No files are written unless requested.

For cross-runtime/build comparisons, pass `--cases path/to/cases.json`. The file is an array of cases (or a prior JSON report's `.cases`), each with `name`, `runtime` (executable), `entry` (module specifier), `method`, `mode`, and optional `subscriptions`. Methods are `path-stream`, `buffer`, `stream`, `stream-large` (4 MiB Node stream chunks), and `web-stream`; modes are `NONE`, `ONLY_GAME_RULES`, and `ALL`. The legacy `path-sync` spelling remains accepted, but its `stream: false` option is ignored by current parsers and is no longer a distinct strategy. Custom cases default to `subscriptions: "death"`; use `"none"` or `"all"` explicitly for other workloads. `"all"` enables raw messages, user-command reconstruction, and game events, not every named protobuf decoder. For example:

```json
[{ "name": "Bun ALL", "runtime": "bun", "entry": "cs2parser", "method": "path-stream", "mode": "ALL", "subscriptions": "death" }]
```

Node cases require a version capable of running the TypeScript benchmark worker. Use equivalent builds when comparing revisions. Historical optimization measurements and tradeoffs are retained in [PR #43](https://github.com/osztenkurden/cs2parser/pull/43), rather than duplicated benchmark snapshots in the current tree.

`scripts/benchmark-snappy.mjs` remains available for isolated codec comparisons; it verifies decompressed output against native Snappy before timing.

## Worker benchmarks

An experimental Bun-only Web Workers benchmark compares verified aggregate
analysis across FullPacket-aligned ranges. It does not change `parseDemo()` or
its synchronous callbacks:

```sh
bun scripts/benchmark-workers.mjs path/to/demo.dem 2 static shared
```

Scheduling can be `static` (byte-balanced coarse ranges), `batched` (eight
intervals per job), or `dynamic` (one interval per job). Storage defaults to
`shared`; `clone` and `transfer` duplicate the full recording per worker and can
exhaust memory. `CS2_PARSER_ENTRY` selects a different built parser for either
benchmark. Worker timings include startup/staging/reconstruction but exclude
file loading and header indexing; they are not the same workload as the normal
path benchmarks.
