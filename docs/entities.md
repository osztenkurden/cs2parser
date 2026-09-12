# Entities and match state

[Back to README](../README.md#documentation)

## Teams

```ts
import { TeamNumber } from 'cs2parser';

for (const team of parser.teams) {
	if (team.teamNumber < TeamNumber.Terrorist) continue; // skip Unassigned/Spectator
	console.log(team.teamName, team.clanName, team.score);
	console.log(
		'  members:',
		team.members.map(p => p.name)
	);
}
```

`TeamNumber` is a const object you can import from the package root:

```ts
TeamNumber.Unassigned; // 0
TeamNumber.Spectators; // 1
TeamNumber.Terrorists; // 2
TeamNumber.CounterTerrorists; // 3
```

| Property                                       | Type                                  |
| ---------------------------------------------- | ------------------------------------- |
| `entityId`                                     | `number`                              |
| `entity`                                       | `TypedEntity<'CCSTeam'> \| undefined` |
| `teamNumber`                                   | `TeamNumber`                          |
| `teamName`                                     | `string`                              |
| `clanName`                                     | `string`                              |
| `score` / `scoreFirstHalf` / `scoreSecondHalf` | `number`                              |
| `members`                                      | `Player[]`                            |

## Game Rules

```ts
const rules = parser.gameRules;
if (rules) {
	console.log(rules.roundsPlayed, rules.phase, rules.isWarmup);
}
```

`parser.gameRules` is `null` until the first `CCSGameRulesProxy` entity appears. Available with `EntityMode.ALL` or `EntityMode.ONLY_GAME_RULES`.

| Property                    | Type                                                           | Description                                    |
| --------------------------- | -------------------------------------------------------------- | ---------------------------------------------- |
| `entityId`                  | `number`                                                       | Proxy entity index                             |
| `entity`                    | `TypedEntity<'CCSGameRulesProxy'> \| undefined`                | Raw proxy entity                               |
| `isWarmup`                  | `boolean`                                                      |                                                |
| `isFreezePeriod`            | `boolean`                                                      |                                                |
| `isGamePaused`              | `boolean`                                                      |                                                |
| `isTerroristTimeOutActive`  | `boolean`                                                      |                                                |
| `isCTTimeOutActive`         | `boolean`                                                      |                                                |
| `roundsPlayed`              | `number`                                                       |                                                |
| `gamePhase`                 | `number`                                                       | Raw phase number from the game rules proxy     |
| `phase`                     | `"first" \| "second" \| "halftime" \| "postgame" \| "unknown"` | Human-readable mapping of `gamePhase`          |
| `roundTime`                 | `number`                                                       | Current round length in seconds                |
| `roundStartTime`            | `number`                                                       | Server time at which the current round started |
| `terroristTimeOutRemaining` | `number`                                                       | Seconds remaining in the T timeout             |
| `ctTimeOutRemaining`        | `number`                                                       | Seconds remaining in the CT timeout            |

### WinRoundReason

`WinRoundReason` is a const object with the round-end reason codes emitted on synthetic `round_end` events. Import from the package root:

```ts
import { WinRoundReason } from 'cs2parser';

parser.gameEvents.on('round_end', event => {
	if (event.reason === WinRoundReason.BOMB_DEFUSED) console.log('CTs defused the bomb');
});
```

| Name                     | Value |
| ------------------------ | ----- |
| `INVALID`                | `-1`  |
| `STILL_IN_PROGRESS`      | `0`   |
| `TARGET_BOMBED`          | `1`   |
| `VIP_ESCAPED`            | `2`   |
| `VIP_ASSASSINATED`       | `3`   |
| `T_ESCAPED`              | `4`   |
| `CT_PREVENT_ESCAPE`      | `5`   |
| `ESCAPING_T_NEUTRALIZED` | `6`   |
| `BOMB_DEFUSED`           | `7`   |
| `T_ELIMINATED`           | `8`   |
| `CT_ELIMINATED`          | `9`   |
| `ROUND_DRAW`             | `10`  |
| `ALL_HOSTAGES_RESCUED`   | `11`  |
| `TARGET_SAVED`           | `12`  |
| `HOSTAGES_NOT_SAVED`     | `13`  |
| `T_NOT_ESCAPED`          | `14`  |
| `VIP_NOT_ESCAPED`        | `15`  |
| `GAME_COMMENCING`        | `16`  |
| `T_SURRENDER`            | `17`  |
| `CT_SURRENDER`           | `18`  |
| `T_PLANTED`              | `19`  |
| `CT_REACHED_HOSTAGE`     | `20`  |

## Typed Entity Access

All entity classes have generated TypeScript interfaces. Use `getEntity` or `findEntities` for type-safe property access:

```ts
import { isEntityClass } from 'cs2parser';
import type { TypedEntity, AnyEntity, EntityProperties } from 'cs2parser';

// Get typed properties for a specific entity
const props = parser.getEntity(88, 'CCSPlayerPawn');
props?.['CCSPlayerPawn.m_iHealth']; // number | undefined
props?.['CCSPlayerPawn.m_ArmorValue']; // number | undefined

// Find all entities of a class
const weapons = parser.findEntities('CAK47');
for (const { entityId, properties } of weapons) {
	console.log(entityId, properties['CAK47.m_iClip1']);
}

// Type guard for narrowing
const entity = parser.entities[306];
if (isEntityClass(entity, 'CCSGameRulesProxy')) {
	entity.properties['CCSGameRulesProxy.CCSGameRules.m_bWarmupPeriod']; // typed
}

// Parametric `TypedEntity<K>` — useful for function signatures and helpers
function controllerName(e: TypedEntity<'CCSPlayerController'>): string {
	return e.properties['CCSPlayerController.m_iszPlayerName'] ?? '';
}

// `EntityProperties<K>` — just the property map (Partial)
function pawnHp(props: EntityProperties<'CCSPlayerPawn'>) {
	return props['CCSPlayerPawn.m_iHealth'] ?? 0;
}

// `AnyEntity` is the slot type in `parser.entities[]` — known typed entities plus
// `BaseEntity` for any class outside `EntityTypeMap`.
const slot: AnyEntity | undefined = parser.entities[0];
```

### Custom helper classes

If you need a helper for an entity class that isn't already wrapped (e.g. a weapon
or grenade), extend the `EntityHelper<C>` base — you get a typed `entity` getter
and a `prop` accessor for free:

```ts
import { DemoReader, EntityHelper } from 'cs2parser';

class C4 extends EntityHelper<'CC4'> {
	get clipAmmo(): number {
		return this.prop('CC4.m_iClip1') ?? 0;
	}
}

const parser = new DemoReader();
// ... after parsing
const c4Entities = parser.findEntities('CC4');
for (const { entityId } of c4Entities) {
	const c4 = new C4(parser, entityId);
	console.log(c4.clipAmmo);
}
```
