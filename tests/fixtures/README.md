# Test Fixtures

## Demo files

Integration tests require a CS2 demo file (`.dem`). These are too large to store in the repository.

### For CI

Demo files are stored as GitHub Release Assets on the `test-fixtures/v2` tag. The CI workflow downloads them automatically.

### For local development

**Option A**: Set the `CS2_DEMO_PATH` environment variable:

```bash
CS2_DEMO_PATH=/path/to/your/demo.dem bun test
```

**Option B**: Place a demo file at `tests/fixtures/demo.dem` (this path is gitignored):

```bash
cp /path/to/your/demo.dem tests/fixtures/demo.dem
bun test
```

**Option C**: Download from GitHub Release Assets:

```bash
./scripts/download-test-fixtures.sh
bun test
```

### What happens without a demo file?

Integration tests are skipped gracefully. Unit tests always run without any demo file.

### Deep parser parity golden

`demo.golden.json` pins the `test-fixtures/v2` release asset `demo.dem`:

- Size: **329,136,562 bytes**.
- SHA-256: `143eb78444727c7a8afa29d807272076d14044fc9d7c233035d0b9a176e70f60`.
- Source: untouched MASTER commit `57d79fc358203ef384fe61ed3b7f478bd91f8357`, `src/index.ts`, default native path-stream input.
- Independently checked against the untouched browser-branch baseline `01ea98b63792ba88ad2f819a3653d3fa00224bf1`, `src/index.ts`. All original hashes match MASTER.
- Fixture summary: `de_ancient`, final tick 185922, 11 userinfo players, 19,836 raw game events, 202 final entities in `ALL`, and 30 synthetic round starts plus 30 ends in each entity-enabled mode.

The integration suite hashes the **actual input bytes** before choosing an oracle. Only the exact SHA-256 above uses the release golden. `CS2_DEMO_PATH` may point at another valid demo: it still gets server/browser and cross-mode runtime parity, without incorrectly applying release-specific snapshots. Missing demos skip only the real-demo cases; canonicalization, mutation/order, wire-correction and chunk-boundary checks still run.

Run just this coverage, not the benchmark matrix:

```bash
CS2_DEMO_PATH=/path/to/demo.dem bun test tests/integration/parser-parity.test.ts --timeout 300000
npm run build
npx tsc -p tests/browser/tsconfig.json
CS2_DEMO_PATH=/path/to/demo.dem npx playwright test tests/browser/parser.pw.ts
```

`tests/helpers/parity.ts` is test-only and has no Node imports. Its version-1 format records:

- Complete entity metadata and properties, ordered by entity slot and including the slot ID, at ticks 1, 1024, 16384, 32768, 65536, 98304, 131072, 163840 and 180000, plus the final state. Missing ticks in arbitrary demos are not invented.
- A separate game-rules projection at every snapshot, so `ONLY_GAME_RULES` must equal the corresponding subset of `ALL` even when other entities are skipped.
- Full userinfo player payloads, preserving sparse slots, at every checkpoint and at completion, plus the complete header and total `tickend` count.
- Every raw `reader.on('gameevent')` protobuf payload, including keys and uint64 values, in emission order with its tick. Duplicates are retained. This is deliberately not the annotated `gameEvents` catch-all, whose Player helpers reference the reader.
- Synthetic `round_start`/`round_end` payloads in emission order with tick and event name. All synthetic scalar fields are selected explicitly; helper annotations are excluded. `NONE` has no synthetic events (its raw round events are already in the raw-event digest).

Canonicalization encodes every value with a type tag, sorts object keys lexicographically, and preserves array order, holes versus explicit `undefined`, BigInts, negative zero, NaN and both infinities. Typed arrays retain their intrinsic type and numeric elements (not platform-endian backing bytes); a Node Buffer becomes Uint8Array, respecting its view boundaries. DataView and ArrayBuffer are distinct. Unsupported objects/functions/symbols and cycles fail loudly rather than silently hashing as empty objects. No numeric rounding or `toJSON()` is used. Ordered event records are framed as the same canonical array representation used for other values. All digests are SHA-256 over UTF-8 canonical text using `crypto.subtle`.

Snapshots and event payloads are serialized **synchronously in their listeners**. `finish()` captures final state synchronously, then hashes the immutable strings after parsing. There are no async event handlers, deferred reads of mutable entities, or hash work included in a reported parser timing; these tests do not report performance measurements.

The real-demo integration matrix covers all three modes, server path and Buffer input, server/browser Uint8Array input, and both exports' Web Streams with 4093, 65536 and 1048576-byte chunks. Explicit chunking first supplies 32 single-byte chunks to split the magic/header, then uses the chosen size, including nonzero-offset views. Playwright bundles the **published** `cs2parser/browser` export with this same helper and compares all deep hashes against the server export for every mode with real fetch streams, plus `ALL` with owned bytes and 4093-byte chunks, without Node globals or cross-origin isolation. Both current exports use WASM Snappy; the separate native-MASTER golden prevents a shared regression from self-validating, and the codec unit tests still compare against native Snappy.

The browser matrix intentionally includes whole-file input, so allow memory for the 329 MB input plus browser/network copies and snapshots. The redundant full mode/chunk cross-product stays in the integration suite to limit browser-process memory pressure. On constrained runners, individual cases can still run in separate Playwright processes, for example `--project=firefox --grep 'real demo deep parity: ALL / 4093$'`. Do not drop hash assertions or treat a browser crash as parity success.

#### Audited MASTER differences

Do not replace the MASTER `modes` section with current parser output to make a test pass. The existing signed-int32 fix changes exactly three checkpoint leaves in this fixture, all `CPlantedC4.m_nSourceSoundscapeHash` in `ALL`:

| Tick   | Entity Slot | MASTER Value | Correct Value | Observed Varint Bytes |
| ------ | ----------- | ------------ | ------------- | --------------------- |
| 98304  | 218         | 393233553    | -1754250095   | `dd ed fd 88 0d`      |
| 131072 | 471         | -392516401   | 1754967247    | `9e b3 d5 89 0d`      |
| 180000 | 375         | 393233553    | -1754250095   | `dd ed fd 88 0d`      |

The wire uint32 values are 3508500189 and 3509934494. MASTER used arithmetic `>> 1` after coercing to signed int32; ZigZag requires an unsigned shift before applying the low-bit sign. These wire values were observed while parsing the untouched MASTER fixture. `@bufbuild/protobuf/wire`'s independent `BinaryReader.sint32()` confirms the corrected values.

`reviewedCorrections` preserves this evidence and three corrected **whole-entity-snapshot** hashes. They were computed by synchronously cloning MASTER entities at the listed ticks, asserting the original class/property/value, replacing only that one leaf with the independent wire decoder's result, and hashing the snapshot. They were **not** generated by accepting all current production output. The integration oracle overlays only those three entity hashes on a clone of MASTER's golden. Every other checkpoint, final entity snapshot, player snapshot, raw event and round payload remains exactly MASTER's. The fixture-free test independently verifies the old and new wire interpretations. Additional differences require investigation, not a broader exclusion or a golden refresh.

#### Reproduce The Baseline

Use an untouched checkout of the recorded commit with dependencies available. In this workspace the original baseline was `/tmp/opencode/cs2parser-master-baseline/src/index.ts`, and the demo was `/tmp/opencode/demo.dem`. Check `git status --short` is empty and `git rev-parse HEAD` equals the recorded commit in that checkout before running. This prints freshly generated MASTER results and asserts the committed original golden, without writing or updating it:

```bash
MASTER_ENTRY=/tmp/opencode/cs2parser-master-baseline/src/index.ts CS2_DEMO_PATH=/tmp/opencode/demo.dem bun -e '
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import golden from "./tests/fixtures/demo.golden.json";
import { captureParity, PARITY_MODES, PARITY_TICKS } from "./tests/helpers/parity.ts";
const { DemoReader, EntityMode } = await import(process.env.MASTER_ENTRY);
const path = process.env.CS2_DEMO_PATH;
const bytes = readFileSync(path);
assert.equal(bytes.length, golden.fixture.bytes);
assert.equal(createHash("sha256").update(bytes).digest("hex"), golden.fixture.sha256);
const modes = {};
for (const mode of PARITY_MODES) {
  const reader = new DemoReader();
  const capture = captureParity(reader, mode);
  assert.deepEqual(await reader.parseDemo(path, { entities: EntityMode[mode] }), { incomplete: false });
  modes[mode] = await capture.finish();
  assert.deepEqual(modes[mode], golden.modes[mode]);
}
console.log(JSON.stringify({ source: golden.source, fixture: golden.fixture, checkpointTicks: PARITY_TICKS, modes }, null, 2));
'
```

For the independent pre-optimization branch check, run the same assertions with `MASTER_ENTRY=/tmp/opencode/cs2parser-browser-baseline/src/index.ts`. This is a comparison, not a new golden source. For the three corrections, clone MASTER entities in `tickend`, apply only the corresponding `reviewedCorrections` leaf after verifying its old value, then call `sha256(canonicalize(entities.flatMap((entity, id) => entity ? [{ id, ...entity }] : [])))` after parsing. Never modify the baseline parser to derive the oracle.

### Bot gameplay fixture

Bot identity has synthetic unit coverage that always runs in CI. The additional bot integration tests use `tests/fixtures/bot_gameplay.dem`, or a separate path:

```powershell
$env:CS2_BOT_DEMO_PATH = 'C:\steamcmd\bot_gameplay.dem'
bun test tests/integration/bot-players.test.ts --timeout 300000
```

This suite checks the complete bot recording, including TV identity, combat annotations, event K/D/A against final scores, and bot shot messages. Keep `CS2_DEMO_PATH` pointing at the human match fixture used by the other integration tests. The bot suite skips when its fixture is absent.
