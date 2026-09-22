# cs2parser 3.0 plan

Status: draft, not scheduled. Nothing here is implemented yet.

Three connected changes:

1. Parse options move from `parseDemo()` / `parseHttpBroadcast()` into the `DemoReader` constructor.
2. `EntityMode` grows to cover class selection, replacing the separate v2 `entityClasses` option.
3. `DemoReader` is generic over its entity mode, so its type only exposes the entities, helpers and event fields that mode actually fills.

## Why

- **A reader already handles exactly one demo.** Options passed per call are really per reader. Seeking already rebuilds sessions from the options captured at the first call.
- **The mode decides what exists.** Today `parser.playerControllers`, `event.player` and `findEntities()` type-check in `EntityMode.NONE` and silently return empty values. The only guide is the docs.
- **Two knobs describe one thing.** In v2, `entities: EntityMode.ALL` plus `entityClasses: 'gameplay'` is how you say "gameplay entities". One value should say that.

## 1. Options in the constructor

```ts
const parser = new DemoReader({
	entities: EntityMode.GAMEPLAY,
	decryptionKey,
	svc_UserCmds: false,
	smokeDensityThreshold: 5,
	maxSeekBytes: 32 * 1024 * 1024
});

await parser.parseDemo('demo.dem');
await parser.seekTo(12_000);
```

What moves where:

| Option                                                                | v2 location                       | v3 location                          |
| --------------------------------------------------------------------- | --------------------------------- | ------------------------------------ |
| `entities`, `entityClasses`                                           | `parseDemo`, `parseHttpBroadcast` | constructor, as one `entities` value |
| Message settings such as `svc_UserCmds`                               | `parseDemo`, `parseHttpBroadcast` | constructor                          |
| `decryptionKey`                                                       | `parseDemo`, `parseHttpBroadcast` | constructor                          |
| Seek limits such as `maxFullPackets`, `maxSeekBytes`, `maxFrameBytes` | `parseDemo`                       | constructor                          |
| `smokeDensityThreshold`                                               | setter on the reader              | constructor, setter kept             |
| Broadcast transport: `fetcher`, `deltaRetryInterval`, `deltaThrottle` | `parseHttpBroadcast`              | stays per call                       |
| `stream`                                                              | `parseDemo`, already ignored      | removed                              |

Notes:

- `parseDemo(source)` takes only the input. `parseHttpBroadcast(url, transport)` takes only transport options.
- `HttpBroadcastReader` takes the same reader options in its constructor.
- Option validation moves to the constructor and throws synchronously. This changes the 2.1 contract that invalid arguments reject the parse promise, so MIGRATION.md must call it out.
- Options are frozen for the reader's lifetime. There is no setter for `entities`.

## 2. EntityMode covers class selection

`EntityMode` stops being a numeric enum and becomes a set of mode values plus a builder:

```ts
EntityMode.NONE; // no entities; game events and userinfo only
EntityMode.GAME_RULES; // game rules proxy only; synthetic round events
EntityMode.GAMEPLAY; // players, pawns, teams, rules, C4, weapons, grenades, projectiles
EntityMode.ALL; // every class, including map and world entities

// Gameplay plus extra classes, inferred through a const type parameter.
EntityMode.gameplayWith(['CPostProcessingVolume', 'CEnvSky', 'CGradientFog']);

// Gameplay plus every class a predicate accepts. A type-guard predicate narrows the types.
EntityMode.gameplayWith(name => name.startsWith('CEnv'));
```

Rules:

- **Gameplay classes are always stored** by every mode above `GAME_RULES`, so helpers and synthetic events keep working. v2 has the same guarantee.
- **The gameplay set becomes an explicit definition.** v2 keeps the old substring rule so its default does not change. v3 switches to a named list plus field detection: weapons have an item definition index, projectiles have a thrower. That drops stray matches like `CFogController`, `CVoteController` and `CPlayerVisibility`, and picks up new item classes automatically.
- **Mode values are plain frozen objects**, for example `{ kind: 'gameplay', include: [...] }`. They are cheap to compare, log and serialize. A predicate cannot be serialized, which matters for seek index transfer. Document that, and keep the predicate out of the index.
- **Open question: an exact mode without gameplay classes**, such as `EntityMode.only([...])`. It would be the cheapest way to read only map entities, but helpers would be unavailable. Section 3 makes that safe at the type level, so it is an easy addition if wanted.

v2 to v3 mapping:

| v2                                               | v3                               |
| ------------------------------------------------ | -------------------------------- |
| `entities: EntityMode.NONE` or omitted           | `EntityMode.NONE`                |
| `entities: EntityMode.ONLY_GAME_RULES`           | `EntityMode.GAME_RULES`          |
| `entities: EntityMode.ALL`                       | `EntityMode.GAMEPLAY`            |
| `entities: EntityMode.ALL, entityClasses: 'all'` | `EntityMode.ALL`                 |
| `entities: EntityMode.ALL, entityClasses: [...]` | `EntityMode.gameplayWith([...])` |
| `entities: EntityMode.ALL, entityClasses: fn`    | `EntityMode.gameplayWith(fn)`    |

The name `ALL` changes meaning. A v2 user who upgrades without reading the notes gets every class stored and parsing about 18% slower, but no missing data. The failure mode is slow, not broken, which is why this rename is acceptable in a major.

**Open question: the default mode.** v2 defaults to `NONE`. Keeping `NONE` is cheapest and least surprising for event-only users. Switching to `GAMEPLAY` fits the most common use. Recommendation: keep `NONE`, because section 3 turns a forgotten mode into a type error instead of silent empty arrays.

## 3. DemoReader types follow the mode

```ts
const events = new DemoReader(); // DemoReader<'none'>
const rules = new DemoReader({ entities: EntityMode.GAME_RULES }); // DemoReader<'game_rules'>
const game = new DemoReader({ entities: EntityMode.GAMEPLAY }); // DemoReader<'gameplay'>
const env = new DemoReader({
	entities: EntityMode.gameplayWith(['CEnvSky', 'CGradientFog'])
}); // DemoReader<'gameplay', 'CEnvSky' | 'CGradientFog'>

events.playerControllers; // type error: needs an entity mode with players
rules.gameRules; // GameRules | null
game.findEntities('CEnvSky'); // type error: CEnvSky is not stored in this mode
env.findEntities('CEnvSky'); // typed CEnvSky properties
```

Capabilities by mode:

| Member                                               | `NONE` | `GAME_RULES`     | `GAMEPLAY`       | `gameplayWith(X)` | `ALL`       |
| ---------------------------------------------------- | ------ | ---------------- | ---------------- | ----------------- | ----------- |
| `players` userinfo                                   | yes    | yes              | yes              | yes               | yes         |
| `gameRules`, synthetic round events                  | no     | yes              | yes              | yes               | yes         |
| `playerControllers`, `teams`, `smokes`, `getPlayer*` | no     | no               | yes              | yes               | yes         |
| `event.player`, `event.attackerPlayer`               | no     | no               | yes              | yes               | yes         |
| `entities`, `getEntity`, `findEntities`              | no     | rules proxy only | gameplay classes | gameplay and X    | every class |

Type design:

- **Export `DemoReader` as a constructor type, not a bare class.** A class cannot add or remove members per type parameter, so the public shape is an intersection:

    ```ts
    interface DemoReaderConstructor {
    	new <const M extends EntityModeValue = typeof EntityMode.NONE>(options?: ReaderOptions<M>): DemoReader<M>;
    }
    type DemoReader<M> = CoreReader &
    	RulesCapability<M> &
    	PlayerCapability<M> &
    	EntityCapability<StoredClass<M>>;
    ```

    `CoreReader` holds everything mode-independent: parsing, seeking, messages, header and ticks. The runtime class stays, so `instanceof DemoReader` keeps working, and only its exported type changes.

- **`StoredClass<M>` is a union of class names.** It is `never` for `NONE`, `'CCSGameRulesProxy'` for `GAME_RULES`, `GameplayClassName` for `GAMEPLAY`, `GameplayClassName | X` for `gameplayWith`, and `KnownClassName` for `ALL`. A plain predicate gives `KnownClassName`, and a type-guard predicate gives its guarded type.
- **The entity generator emits `GameplayClassName`**, from the same gameplay definition as the runtime. A unit test checks that the two agree against the serializer snapshot.
- **`parser.entities` slots split in two.** Stored classes get `TypedEntity<K>`. Every other live entity is an `UnstoredEntity` with `className`, `classId` and `properties: {}`. That keeps the guarantee that created and deleted entities are always visible.
- **Game event payloads are typed by capability.** `gameEvents` becomes generic, so `player` and `attackerPlayer` only exist in modes with players.
- **The runtime stays forgiving.** Hidden members still exist on the instance and keep returning empty values, as in v2. Plain JavaScript users are unaffected, and the types do the enforcing. Throwing at runtime was rejected because it would break JavaScript callers that feature-detect.
- **`EntityHelper<C>` requires the class to be stored.** Its constructor takes a `DemoReader<M>` where `C` is in `StoredClass<M>`.

Risks:

- **Type complexity.** Errors for a hidden member will mention the intersection type. Clear capability names such as `PlayerCapability` keep those errors readable.
- **Helper signatures.** Functions that accept any reader must take `DemoReader<any>` or `CoreReader`. The docs need an example of this.
- **Generated type size.** The gameplay union adds one generated type and no new interfaces.

## Rollout

In 2.x, all additive:

- Accept the same options in the `DemoReader` and `HttpBroadcastReader` constructors. When both are given, call options win, so existing code is unaffected.
- Add `EntityMode.GAMEPLAY` and `EntityMode.gameplayWith()` as aliases that map onto `ALL` plus `entityClasses`.
- Mark per-call parse options, `entityClasses` and `ONLY_GAME_RULES` deprecated in JSDoc, and emit one `debug` message when they are used.

In 3.0, breaking:

- Remove per-call parse options, `entityClasses`, `ONLY_GAME_RULES` and the numeric `EntityMode` values.
- Make `EntityMode.ALL` store every class.
- Switch the gameplay set to the explicit definition.
- Ship the generic `DemoReader<M>` types.
- Write MIGRATION.md with before and after snippets for each row of the two mapping tables.

## Open questions

1. Default entity mode: keep `NONE` (recommended) or switch to `GAMEPLAY`.
2. Whether to add an exact mode without gameplay classes, such as `EntityMode.only([...])`.
3. Whether constructor validation throws synchronously or waits for the first parse call, to keep the 2.1 contract.
4. Whether `smokeDensityThreshold` stays mutable after construction.
