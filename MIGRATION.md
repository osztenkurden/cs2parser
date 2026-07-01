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
| `getArrayProp(id, name)` | `unknown` | container fields — typed arrays / arrays of structs (see §10) |
| `getEntityClassName(id)` | `string \| undefined` | class-name probe (cheapest way to test type) |
| `getEntityClassId(id)` | `number \| undefined` | numeric class id |
| `getEntityType(id)` | `number \| undefined` | entity-type discriminator (0=controller, 1=rules, 2=projectile, 3=team, 4=normal, 5=c4) |
| `getEntityIds()` | `number[]` | every live entity id |
| `findEntityIdsByClass(name)` | `number[]` | filter by class name |

All scalar getters return `undefined` for missing entities or unset properties. Each is a single
FFI hop and allocates nothing — see [Performance](#performance-properties-vs-direct-getters).

#### Type-safe field names (optional class type argument)

Every value getter is generic over an **optional** entity-class name. With no type argument, `name`
is a plain `string` — existing calls are unchanged. Pass a class name and `name` is constrained (and
autocompleted) to that class's fully-qualified property keys, **filtered by the value type the getter
returns**:

```ts
reader.getNumberProp(id, 'anything');                          // no type arg → plain string
reader.getNumberProp<'CAK47'>(id, 'CAK47.m_iMostRecentTeamNumber'); // ✅ number field of CAK47
reader.getStringProp<'CAK47'>(id, 'CAK47.…m_szCustomName');     // ✅ only string fields offered
reader.getArrayProp<'CAK47'>(id, 'CAK47.…m_AttributeList.m_Attributes'); // ✅ container field

reader.getNumberProp<'CAK47'>(id, 'CAK47.…m_szCustomName');     // ❌ compile error — that's a string
reader.getArrayProp<'CAK47'>(id, 'CAK47.m_iMostRecentTeamNumber');  // ❌ compile error — that's a number
```

Which keys each getter offers, by the field's value type:

| Getter | Offers keys whose value is |
|---|---|
| `getNumberProp<C>` | `number` |
| `getStringProp<C>` | `string` |
| `getBoolProp<C>` | `boolean` |
| `getBigIntProp<C>` | `bigint` |
| `getVec3Prop<C>` | `[number, number, number]` (vectors / qangles) |
| `getBlobProp<C>` | `Uint8Array` |
| `getArrayProp<C>` | containers only — typed arrays / arrays / arrays-of-structs (never a scalar) |

Exported helper types back this: `EntityPropKey<C>` (all of a class's keys), `KeysOfValue<C, V>`
(keys whose value is assignable to `V`), `ContainerPropKey<C>` (a class's container keys), and the
argument aliases `ValuePropName<C, V>` / `ArrayPropName<C>`.

Two caveats:

- **Booleans:** `getNumberProp<C>` no longer lists `boolean` fields — they route to `getBoolProp`.
  At runtime `getNumberProp` still reads a bool as `0`/`1`, so the untyped call
  `getNumberProp(id, name)` is the escape hatch if you want the numeric form.
- **`Uint8Array` fields:** binary-blob and byte-vector-container fields share the `Uint8Array` type,
  so such a field is offered by *both* `getBlobProp<C>` and `getArrayProp<C>` — the type can't encode
  which storage backs it. (Return types are unchanged; `getArrayProp` still returns `unknown`.)

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
per call by walking **every** set prop of the entity (one FFI hop per prop, plus
the object allocation). `getEntity` returns the property bag directly
(`Partial<EntityTypeMap[T]>`); a pawn carries ~340 props, a controller ~100.
Fine for one-off introspection; **prefer the typed getters above for hot loops** —
see [Performance](#performance-properties-vs-direct-getters) for the numbers.

```ts
// Both still work, but in 2.0 this is allocating a ~340-key object:
const props = parser.getEntity(88, 'CCSPlayerPawn');
const hp = props?.['CCSPlayerPawn.m_iHealth'];

// Better in a hot loop — one FFI hop, zero allocation:
const hp = parser.getNumberProp(88, 'CCSPlayerPawn.m_iHealth');
```

### 5. `isEntityClass` — still exported, but there's no `parser.entities` to feed it

`isEntityClass` is still exported and its signature is unchanged
(`isEntityClass(entity, className): entity is TypedEntity<className>`). It narrows an
entity **object** — but the `parser.entities` array you used to index is gone, so feed it
an object from `getEntity(...)` (wrap it) or, more directly, a helper's `.entity`. For a
plain "is this entity a pawn?" check, the cheapest path (no object built) is
`getEntityClassName(id)`.

```ts
// 1.x
import { isEntityClass } from 'cs2parser';
if (isEntityClass(parser.entities[id], 'CCSPlayerPawn')) { /* ... */ }

// 2.0 — cheap class probe, allocates nothing
if (parser.getEntityClassName(id) === 'CCSPlayerPawn') { /* ... */ }

// 2.0 — isEntityClass still narrows a TypedEntity you already hold (e.g. from a helper)
import { isEntityClass } from 'cs2parser';
if (isEntityClass(pawn.entity, 'CCSPlayerPawn')) {
  pawn.entity.properties['CCSPlayerPawn.m_iHealth']; // typed as a pawn here
}
```

### 6. Helpers (`Player`, `PlayerPawn`, `Team`, `GameRules`, `SmokeHelper`) — *unchanged, plus extras*

All public properties still work the same: `player.name`, `player.position`,
`player.health`, `player.kills`, `team.score`, `gameRules.phase`, etc. They
internally read via the new getters (one FFI hop each, no allocation).

New in 2.0:

- **`EntityHelper<C>` base class is exported** — the shared base of every helper. Extend it to
  write your own typed helpers; it gives you `className`, the typed `prop()` accessor, the
  `_num`/`_str`/`_bool`/`_bigint`/`_vec3`/`_blob`/`_array` protected readers, and `.entity`.
- **`SmokeHelper`** (`reader.smokes`, `reader.getSmoke(id)`) for `CSmokeGrenadeProjectile` voxel data.

**The `.entity` accessor is available** on every helper. `helper.entity` returns a
`TypedEntity<C>` — `{ className, classId, entityType, properties }` — where `properties` is the same
snapshot `getEntity` builds. Because it materialises the full property bag on every access, treat it
like `getEntity`: fine for introspection, **not** for hot loops (see
[Performance](#performance-properties-vs-direct-getters)).

```ts
// 2.0 — works; builds a fresh snapshot each access
const raw = player.entity?.properties;
const hp = player.entity?.properties['CCSPlayerPawn.m_iHealth'];

// Prefer the typed helper property (no allocation) for a single value:
const hp2 = player.health;
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

Opt-in messages are unchanged in mechanism — enable them per-parse and listen on the event name:

```ts
reader.on('net_SetConVar', m => { /* replicated convars: game_type, game_mode, mp_* … */ });
await reader.parseDemo(path, { entities: EntityMode.ALL, net_SetConVar: true });
```

**New in 2.0:** `net_SetConVar` (the server's replicated convars) is now available as an opt-in
message, alongside the existing `svc_VoiceData` / `UM_SayText2` / `svc_UserMessage` / etc.

`parser.players` (the `CMsgPlayerInfo[]` from the userinfo string table) is
populated the same way in both versions — string-table parsing still happens,
just internally to Rust on the .dem path. The "look up a kill's attacker by
`userid`" pattern works unchanged.

### 9. `CS2P_RUST_DECODER` environment variable

Removed. The Rust decoder is the only decoder.

### 10. Container (vector / array) fields decode into real collections

In 1.x a networked vector/array collapsed to a last-write-wins scalar. In 2.0 they decode into
proper collections, read via `getArrayProp(id, name)` (or found under their key in a `getEntity`
snapshot):

- **Primitive element types** → the matching typed array (`Uint8Array`, `Int32Array`,
  `Float32Array`, `BigUint64Array`, …). E.g. `CInferno.m_firePositions`, `m_VoxelFrameData`.
- **Struct element types** → `Array<{ subField: value, … }>`. E.g.
  `CCSPlayerController.CCSPlayerController_ActionTrackingServices.m_perRoundStats` is an array of
  per-round stat objects (this is what powers `player.round_*`).

```ts
const rounds = reader.getArrayProp(id,
  'CCSPlayerController.CCSPlayerController_ActionTrackingServices.m_perRoundStats');
// -> [{ m_iKills, m_iDamage, ... }, ...]
```

### 11. Some raw property paths are now `send_node`-qualified

CS2 inlines by-value embedded structs into their parent serializer. 1.x ignored the `send_node`
that disambiguates them, so several of these fields **collided** (last-write-wins, often wrong).
2.0 qualifies them, matching the reference `demofile-net` naming. If you read these **raw paths**,
they changed (helpers already use the new names, so `player.kills`, `player.position`, etc. are
unaffected — and now correct):

| Field group | 1.x path (collided) | 2.0 path |
|---|---|---|
| Match totals | `…m_ActionTrackingServices.m_iKills` | `…m_ActionTrackingServices.m_matchStats.m_iKills` |
| Pawn position | `…CBodyComponentBaseAnimGraph.m_cellX` | `…CBodyComponentBaseAnimGraph.m_skeletonInstance.m_vecOrigin.m_cellX` |
| Inlined econ items | `…m_iItemDefinitionIndex` (one, others lost) | `…m_agentItem.m_iItemDefinitionIndex`, `…m_glovesItem.…`, `…m_weaponItem.…` |

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

### Performance: `.properties` vs direct getters

The single most important perf decision in 2.0 is **how you read entity state**. There are two
shapes, and the gap between them is large:

- **Snapshot** — `parser.getEntity(id, cls)`, `parser.findEntities(cls)`, or a helper's
  `.entity.properties`. Builds a **fresh object of every prop the entity holds** on each call:
  one native read per prop, plus allocating and populating the object.
- **Direct** — `getNumberProp(id, name)` / `getStringProp` / … or a typed helper accessor
  (`player.health`, `player.kills`). **One native read per field, zero allocation.**

Measured on the fixture (one live pawn, Bun/JSC):

| Operation | Cost | Notes |
|---|---|---|
| A pawn's prop count | **339** | a controller carries ~98 |
| `getEntity()` — build the snapshot | **~128 ns** | + one ~340-key object allocated (GC pressure) |
| Read **all 339** fields via direct getters | **~32 ns** | ~4× faster than one snapshot build |
| Read **one** field via a direct getter | effectively free | native read inlines to ~sub-ns |
| Read one field from a **cached** snapshot | effectively free | plain object lookup |

The counterintuitive part: because a direct read is so cheap, fetching **every** field individually
still beats building the snapshot once — the snapshot's cost is dominated by allocating and
populating the object, not the reads. So there is essentially **no read pattern where rebuilding a
snapshot per access is faster** than direct getters. `.properties`/`getEntity` earns its keep on
*ergonomics* (destructure, log, JSON-serialize, iterate unknown keys), not speed.

Rules of thumb:

- **Hot path / per-tick / a handful of fields** → direct getters or helper properties. Never call
  `getEntity` (or touch `helper.entity.properties`) inside a per-tick loop just to read a value —
  `helper.entity` rebuilds the whole bag on **every** access.
- **One-off introspection, debugging, dumping, serialization** → `getEntity` / `.entity.properties`.
- **Need several fields from the same entity at the same tick, in object form** → build the snapshot
  **once** and reuse it; cached lookups are free. Don't rebuild it to read one key.

```ts
// ❌ rebuilds a 339-key object every tick, per player, to read 3 numbers
for (const p of reader.playerControllers) {
  const props = p.entity!.properties;
  use(props['CCSPlayerController.…m_matchStats.m_iKills'], props['…m_iDeaths'], props['…m_iAssists']);
}

// ✅ direct reads — no allocation
for (const p of reader.playerControllers) {
  use(p.kills, p.deaths, p.assists);
}
```

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
