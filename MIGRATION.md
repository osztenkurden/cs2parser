# Migrating from cs2parser 1.x to 2.0

cs2parser 2.0 moves the demo-parse hot path from TypeScript to a Rust crate
distributed as a native Node addon. Public API surface shrank
(`parser.entities` is gone — reads go through explicit typed getters) and
the package now ships a per-platform binary picked at install time via
`optionalDependencies`. Throughput on `EntityMode.ALL` is roughly **2×
faster** than 1.x on the same hardware.

> 2.0 is currently published under the `alpha` npm dist-tag.
> `npm install cs2parser` still resolves to the latest 1.x.
> `npm install cs2parser@alpha` installs the 2.0 alpha.

---

## Install

```bash
npm install cs2parser@alpha
```

Supported triples:

| OS | Arch | libc |
|---|---|---|
| Windows | x64 | — |
| Linux | x64 | glibc, musl |
| Linux | arm64 | glibc |
| macOS | x64, arm64 | — |

npm picks the right per-triple binary from `optionalDependencies`. If your
platform isn't covered, see *Build from source* below.

**Node:** unchanged, `>= 22.0.0`. Bun 1.3+ also works.

---

## Breaking changes

### 1. `parser.entities` removed

The `TypedEntity[]` array is gone. Entity state lives inside the Rust addon
and is read through new getter methods on `DemoReader`. The cost: one FFI
call per property read (sub-microsecond — fine for typical helper usage).

```ts
// 1.x
const ent = parser.entities[88];
if (ent?.className === 'CCSPlayerPawn') {
  const hp = ent.properties['CCSPlayerPawn.m_iHealth'];
}

// 2.0
if (parser.getEntityClassName(88) === 'CCSPlayerPawn') {
  const hp = parser.getNumberProp(88, 'CCSPlayerPawn.m_iHealth');
}
```

### 2. New typed-getter API on `DemoReader`

| Method | Returns | Use for |
|---|---|---|
| `getNumberProp(id, name)` | `number \| undefined` | bool / i32 / u32 / f32 (widened) |
| `getStringProp(id, name)` | `string \| undefined` | `m_iszPlayerName`, weapon class names, etc. |
| `getVec3Prop(id, name)` | `Float64Array \| undefined` | 3-element vectors (eye angles, qangles) |
| `getBigIntProp(id, name)` | `bigint \| undefined` | u64 / fixed64 (`m_steamID`, handles) |
| `getBoolProp(id, name)` | `boolean \| undefined` | explicit booleans like `m_bPawnIsAlive` |
| `getBlobProp(id, name)` | `Uint8Array \| undefined` | binary-block fields |
| `getEntityClassName(id)` | `string \| undefined` | class probe |
| `getEntityIds()` | `number[]` | every live entity id |
| `findEntityIdsByClass(name)` | `number[]` | filter by class name |

All getters return `undefined` for missing entities or unset properties.

### 3. Entity enumeration

```ts
// 1.x — iterate a sparse array
for (let i = 0; i < parser.entities.length; i++) {
  const e = parser.entities[i];
  if (!e || e.className !== 'CCSPlayerController') continue;
  // ...
}

// 2.0 — direct id lookup
for (const id of parser.findEntityIdsByClass('CCSPlayerController')) {
  // ...
}
```

### 4. `parser.getEntity` and `parser.findEntities` build snapshots

In 1.x these returned a live reference to `entity.properties` — subsequent
reads were free. In 2.0 they build a fresh `Record<string, value>` snapshot
per call by walking every set prop of the entity (one FFI hop per prop).
Fine for one-off introspection; **prefer the typed getters above for hot loops**.

```ts
// Both still work, but in 2.0 this is allocating:
const props = parser.getEntity(88, 'CCSPlayerPawn');
const hp = props?.['CCSPlayerPawn.m_iHealth'];

// Better in a hot loop:
const hp = parser.getNumberProp(88, 'CCSPlayerPawn.m_iHealth');
```

### 5. `isEntityClass` removed

```ts
// 1.x
import { isEntityClass } from 'cs2parser';
if (isEntityClass(parser.entities[id], 'CCSPlayerPawn')) { /* ... */ }

// 2.0
if (parser.getEntityClassName(id) === 'CCSPlayerPawn') { /* ... */ }
```

### 6. Helpers (`Player`, `PlayerPawn`, `Team`, `GameRules`) — *mostly unchanged*

All public properties still work the same: `player.name`, `player.position`,
`player.health`, `player.kills`, `team.score`, `gameRules.phase`, etc. They
internally read via the new getters.

**Removed:** the `.entity` accessor on every helper that returned the raw
`TypedEntity`. There is no JS-side entity object to return anymore.

```ts
// 1.x — works
const raw = player.entity?.properties;
// 2.0 — removed; use the typed helpers or the new getter API directly
```

### 7. `propIdToDecoder` shape changed

Was `Record<number, Decoder>` where `Decoder` could be either a number or
`{ type: 0, decoder: idx }` (the quantized-float carrier object). Now
`Record<number, number>` — quantized-float fields use the constant `0`. The
integer constants match the old `Decoders.*` enum.

### 8. Events

| Event | 1.x | 2.0 |
|---|---|---|
| `entitycreated` | emitted | **unchanged** |
| `entitydeleted` | emitted | **unchanged** |
| `entityupdated` | per-property | **removed** — read state on demand via getters |
| `tickstart` / `tickend` | emitted | **unchanged** |
| `header` / `serverinfo` | emitted | **unchanged** |
| `gameevent` / `gameeventlist` | emitted | **unchanged** |
| `progress` / `debug` / `end` / `cancel` / `error` | emitted | **unchanged** |
| `createstringtable` / `updatestringtable` | emitted | **removed for .dem parses** — still fires on HTTP broadcast |
| `clearallstringtables` | emitted | **removed** |

`parser.players` (the `CMsgPlayerInfo[]` from the userinfo string table) is
populated the same way in both versions — string-table parsing still happens,
just internally to Rust on the .dem path. The "look up a kill's attacker by
`userid`" pattern works unchanged.

### 9. `CS2P_RUST_DECODER` environment variable

Removed. The Rust decoder is the only decoder.

---

## Things that haven't changed

- `parser.parseDemo(source, opts)` — same overloads for `string` path,
  `Buffer`, and `Readable` stream. Same `{ entities, stream, messages,
  commands }` options.
- `parser.parseHttpBroadcast` / `HttpBroadcastReader` — same surface.
- `parser.cancel()` — same.
- `parser.parseHeader(path)` / `parser.parseServerInfo(path)` static
  methods — same.
- `parser.gameEvents.on('player_death', e => ...)` — same. `event.player`,
  `event.attackerPlayer`, etc. resolve the same way.
- `parser.players` (CMsgPlayerInfo array from userinfo) — same.
- `parser.playerControllers`, `parser.teams`, `parser.gameRules`,
  `parser.getPlayer(id)`, `parser.getPawn(id)`, `parser.getPlayerByInfo()`,
  `parser.getByAccountId()` — same return shapes.
- `EntityMode.NONE` / `EntityMode.ONLY_GAME_RULES` / `EntityMode.ALL` —
  same semantics. `NONE` skips entity decoding entirely; `ONLY_GAME_RULES`
  stores only `CCSGameRulesProxy` entities.
- `TeamNumber`, `WinRoundReason` exports — same.

---

## Performance and memory

Approximate numbers from the same hardware (583 MB demo, `EntityMode.ALL`,
streaming parse):

| Version | Time | Throughput | RSS | Heap |
|---|---|---|---|---|
| 1.8.0 | ~10.5 s | ~56 MB/s | ~280 MB | ~35 MB |
| 2.0.0-alpha | ~5.5 s | ~106 MB/s | ~250 MB | ~16 MB |

Heap drop is the most visible win: entity properties no longer materialise
as JS objects. RSS is lower despite the native addon because the
property-allocation overhead in 1.x outweighed the Rust state's memory cost
for typical demos.

---

## Build from source

If your platform isn't covered by the prebuilt binaries (or you're hacking
on the parser), `npm run build:native` builds the addon locally. Requires:

- **Rust ≥ 1.85** (the `prost-build` chain pulls a dep that needs
  `edition2024`).
- **Node ≥ 22**.

```bash
git clone https://github.com/osztenkurden/cs2parser
cd cs2parser
git checkout v2.0.0-alpha.0   # or whichever tag
bun install                   # or npm install
bun run build:native          # produces crates/native/cs2parser-native.<triple>.node
bun run build                 # bundles the JS into dist/
```

---

## Reporting issues

Stage-by-stage parity oracle is `examples/stream.ts path-stream <demo>
--compare examples/stream_output.txt`. If 2.0 produces different output for
the same demo as 1.x, that's a bug — paste the diff lines into a GitHub
issue and ideally attach the demo (or a smaller repro) so the parity oracle
can rerun in CI.
