# Test Fixtures

## Demo Files

Integration tests use the Git-ignored `tests/fixtures/demo.dem`, downloaded by CI from the GitHub release `test-fixtures/v2`. Locally, run:

```sh
./scripts/download-test-fixtures.sh
bun test --timeout 300000
# Or use another recording:
CS2_DEMO_PATH=/path/to/demo.dem bun test --timeout 300000
```

Without a recording, fixture-dependent tests skip; unit tests still run. Bot tests use a separate `tests/fixtures/bot_gameplay.dem` or `CS2_BOT_DEMO_PATH`. Keep `CS2_DEMO_PATH` pointing at the human match when running both.

## Parity Golden

`demo.golden.json` is an independent correctness oracle, not benchmark output:

- Fixture: `test-fixtures/v2/demo.dem`, 329,136,562 bytes, `de_ancient`, final tick 185922.
- SHA-256: `143eb78444727c7a8afa29d807272076d14044fc9d7c233035d0b9a176e70f60`.
- Source: untouched master `57d79fc358203ef384fe61ed3b7f478bd91f8357`, using its native server parser.
- Cross-check: untouched browser branch `01ea98b63792ba88ad2f819a3653d3fa00224bf1` matched all original hashes.
- Expected counts: 202 final ALL-mode entities, 11 userinfo players, 19,836 raw events, and 30 synthetic round starts/ends in entity-enabled modes.

The test hashes the input before selecting the golden. Other recordings receive runtime parity checks, never the wrong release oracle. Both current exports use WASM; comparison against a native-master golden prevents a shared implementation bug from self-validating. Snappy unit tests also retain the native codec as an independent oracle.

`tests/helpers/parity.ts` captures full entity, game-rule, and userinfo state at nine checkpoints and completion, plus the header, tick count, ordered raw events, and synthetic round payloads. Capture is synchronous before mutable state can change; SHA-256 hashing runs afterward. Tagged canonicalization preserves key/array order rules, sparse holes, undefined, BigInts, negative zero, nonfinite floats, and typed-array identity; Buffer normalizes to Uint8Array. Cyclic helpers and unsupported objects are rejected rather than silently omitted.

Integration parity uses nine full parses: all three entity modes through the server
path, one browser input per mode (bytes, small chunks, large chunks), and the
remaining server input forms. One-chunk yielding/cancellation is checked separately.
Playwright keeps the small browser API checks and one ALL-mode fetch-stream deep
comparison in each of Chromium, Firefox and WebKit. To run one engine:
`--project=firefox`.

```sh
CS2_DEMO_PATH=/path/to/demo.dem bun test tests/integration/parser-parity.test.ts --timeout 300000
CS2_DEMO_PATH=/path/to/demo.dem npm run test:browser
```

## Audited Master Differences

Do not replace the original golden with current output to make tests pass. The signed-int32 fix changes exactly three checkpoint leaves, all `CPlantedC4.m_nSourceSoundscapeHash` in ALL mode:

| Tick   | Entity Slot | Master Value | Correct Value | Wire Varint      |
| ------ | ----------- | ------------ | ------------- | ---------------- |
| 98304  | 218         | 393233553    | -1754250095   | `dd ed fd 88 0d` |
| 131072 | 471         | -392516401   | 1754967247    | `9e b3 d5 89 0d` |
| 180000 | 375         | 393233553    | -1754250095   | `dd ed fd 88 0d` |

Master used signed `>> 1` where ZigZag requires unsigned `>>> 1`. The bytes were observed in the untouched master parse; `@bufbuild/protobuf/wire`'s `BinaryReader.sint32()` independently verifies the correct values.

`reviewedCorrections` stores that evidence and three replacement whole-snapshot hashes, computed by cloning master's checkpoint entities, verifying the old class/property/value, and changing only the proven leaf. Tests overlay only those hashes; final state and all other entity, player, and event hashes remain master's originals.

To reproduce the oracle, use the exact fixture and a clean checkout of the recorded master commit with `captureParity()` from the helper above, then compare against `golden.modes`. Derive correction hashes only from the corresponding master snapshots and independently decoded wire values. Additional differences require investigation, not a broader exclusion or blind golden refresh.
