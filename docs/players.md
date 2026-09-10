# Players and pawns

[Back to README](../README.md#documentation)

## Players

### Basic player info — `parser.players`

`parser.players` returns `CMsgPlayerInfo[]` from the userinfo string table. This is the fastest way to get the roster of a demo: names and Steam IDs are available without parsing entities, so it works even with the default `EntityMode.NONE`.

The array is **sparse** — each entry lives at index `player.userid & 0xff`, so empty slots read as `undefined`. That's the same slot index used by game events, which makes it the natural way to look up the attacker or victim of a kill by raw userid.

```ts
await parser.parseDemo('demo.dem'); // EntityMode.NONE — no entity parsing

// Iterate — guard against sparse holes, or call .filter(Boolean) first.
for (const player of parser.players) {
	if (!player) continue;
	console.log(player.name, player.steamid);
}
```

Each `CMsgPlayerInfo` is a plain object decoded from the demo's `userinfo` string table:

| Field        | Type                   | Description                                         |
| ------------ | ---------------------- | --------------------------------------------------- |
| `name`       | `string \| undefined`  | Display name                                        |
| `steamid`    | `string \| undefined`  | Decimal ID; bots/TV may have server-generated IDs that differ from their controller's `"0"` |
| `xuid`       | `string \| undefined`  | Account identifier; may be `"0"` for bots           |
| `userid`     | `number \| undefined`  | In-game user id (the slot index is `userid & 0xff`) |
| `fakeplayer` | `boolean \| undefined` | `true` for fake clients, including bots and TV       |
| `ishltv`     | `boolean \| undefined` | `true` for the HLTV/GOTV observer slot              |

`parser.players` is populated from `createstringtable` / `updatestringtable` events as soon as the userinfo table arrives, and cleared by `clearallstringtables`. It is usable inside `'end'` and during parsing (e.g. once the first `round_start` fires).

For per-recording statistics, track the full `userid`, not just the slot: a new connection can reuse a slot. Do not use bot names or Steam IDs as unique keys. Helpers expose live state and can be recreated by full snapshots, so copy values when recording history instead of using `Player` object identity as a persistent key.

#### Looking up players during a game event

Game events like `player_death` expose `userid` / `attacker` / `assister` fields whose low byte identifies a slot in `parser.players`; `0xff` means no player. You can use these to look up `CMsgPlayerInfo` without entity parsing.

```ts
const parser = new DemoReader();

parser.gameEvents.on('player_death', event => {
	const attacker = parser.players[event.attacker & 0xff];
	const victim = parser.players[event.userid & 0xff];
	const assister = parser.players[event.assister & 0xff];

	if (!attacker || !victim) return;

	console.log(
		`${attacker.name} (${attacker.steamid}) killed ${victim.name} with ${event.weapon}` +
			(event.headshot ? ' (HS)' : '') +
			(assister ? `, assisted by ${assister.name}` : '')
	);
});

// Runs with EntityMode.NONE — no entity parsing needed for names + steamids.
await parser.parseDemo('demo.dem');
```

This pattern is the fast path when you only need to log kills, build a scoreboard, or group events by player identity — anything that doesn't require live entity state like position, health, or money. For those, use `event.attackerPlayer` / `event.player` (the auto-resolved `Player` helpers), which require `EntityMode.ALL`.

### Entity-backed helpers — `parser.playerControllers`

`parser.playerControllers` returns `Player[]` helper objects backed by live entity data. This requires `EntityMode.ALL` because it reads `CCSPlayerController` and `CCSPlayerPawn` properties.

```ts
await parser.parseDemo(createReadStream('demo.dem'), { entities: EntityMode.ALL });

for (const player of parser.playerControllers) {
	console.log(player.name, player.steamId, player.teamNumber);
	console.log('  k/d/a:', player.kills, player.deaths, player.assists);
	console.log('  money:', player.money, 'mvps:', player.mvps);
	console.log('  alive:', player.isAlive, 'health:', player.health, 'armor:', player.armor);
	console.log('  position:', player.position);
}
```

### Player lookups

Several `DemoReader` methods resolve a `Player` helper from different identifiers. All require `EntityMode.ALL`.

```ts
// By controller entity ID (pawn handles identify a different entity)
const p1 = parser.getPlayer(1);

// By zero-based player slot, including humans, bots, and TV
const samePlayer = parser.getPlayerBySlot(0);

// From a CMsgPlayerInfo (e.g. an element of parser.players)
const p2 = parser.getPlayerByInfo(parser.players[0]);

// By Steam account ID — the lower 32 bits of SteamID64,
// i.e. the trailing number in SteamID3 form: [U:1:918429678] -> 918429678
const p3 = parser.getByAccountId(918429678);
```

`getPlayerBySlot` and `getPlayerByInfo` use direct slot lookups for humans, bots, and TV. `getPlayerByInfo` checks the full `userid` against the current roster and returns `null` for stale entries or missing controllers. Inputs containing only a Steam ID retain the Steam ID scan. `getByAccountId` returns `null` for zero, which cannot distinguish bots or TV; other IDs use a cache with a linear-scan fallback.

Game-event annotations (`player`, `attackerPlayer`, `assisterPlayer`) use the same slot mapping. A pawn reference can point at a previous pawn, for example when grenade damage continues after a respawn; it does not override the player identity.

### Bot analysis

```powershell
bun scripts/analyze-players.ts "C:\steamcmd\bot_gameplay.dem"
```

The script reports human and bot scores, event K/D/A, damage, shots, headshots, position, aim angles, command counts, and annotation coverage. It enables `EntityMode.ALL`; optional messages still require a listener.

Bot input commands may not be present in a recording. In this fixture, all `usercommand` messages belong to the human player. Bot movement and aim remain available through pawn properties, while `GE_FireBulletsId` messages provide shot origin, angles, recoil, spread, and inaccuracy. Subscribe to that message and resolve `message.player` through `parser.getPawn(message.player & 0x7ff)?.controller` when the field is defined. These are shot observations, not a reconstruction of missing bot inputs.

Helper defaults such as `0` or `false` can also mean a property has not arrived. Inspect raw `player.entity?.properties` or `player.pawn?.entity?.properties` when distinguishing missing data from a measured zero matters.

### Player Helper

The `Player` class wraps a `CCSPlayerController` entity. It links to the player's pawn entity for position, health, and combat state. Pawn-backed getters return `0`/`false`/`null` defaults while the player has no pawn (e.g. dead, spectating, or disconnected).

**Identity**

| Property      | Type                                              | Source                               |
| ------------- | ------------------------------------------------- | ------------------------------------ |
| `entityId`    | `number` (readonly)                               | Controller entity index              |
| `userSlot`    | `number`                                          | Zero-based player slot               |
| `entity`      | `TypedEntity<'CCSPlayerController'> \| undefined` | Raw controller entity                |
| `name`        | `string`                                          | Controller                           |
| `steamId`     | `string`                                          | Controller (empty if not yet set)    |
| `isConnected` | `boolean`                                         | Controller (`m_iConnected === 0`)    |
| `isBot`       | `boolean`                                         | Userinfo `fakeplayer`, excluding TV; false if unknown |
| `isHLTV`      | `boolean`                                         | Userinfo `ishltv`; false if unknown   |
| `clanTag`     | `string`                                          | Controller                           |
| `color`       | `number`                                          | Comp teammate color (`-1` if unset)  |
| `userInfo`    | `CMsgPlayerInfo \| null`                          | Matching entry from `parser.players` |

**Team**

| Property     | Type           | Source             |
| ------------ | -------------- | ------------------ |
| `teamNumber` | `number`       | Controller         |
| `team`       | `Team \| null` | Linked team entity |

**Pawn link**

| Property       | Type                 | Source                              |
| -------------- | -------------------- | ----------------------------------- |
| `pawnEntityId` | `number \| null`     | Decoded from `m_hPlayerPawn` handle |
| `pawn`         | `PlayerPawn \| null` | Linked pawn entity                  |
| `isAlive`      | `boolean`            | Controller (`m_bPawnIsAlive`)       |

**Pawn shortcuts** (delegate to `pawn`, return a safe default if there's no pawn)

| Property                   | Type                             |
| -------------------------- | -------------------------------- |
| `health` / `armor`         | `number`                         |
| `position`                 | `Vector \| null`                 |
| `eyeAngles`                | `{ pitch: number; yaw: number }` |
| `hasDefuser` / `hasHelmet` | `boolean`                        |
| `isScoped` / `isDefusing`  | `boolean`                        |

**Economy**

| Property             | Type     |
| -------------------- | -------- |
| `money`              | `number` |
| `totalCashSpent`     | `number` |
| `cashSpentThisRound` | `number` |

**Match totals** (from `CCSPlayerController_ActionTrackingServices`)

| Property                             | Type     |
| ------------------------------------ | -------- |
| `kills` / `deaths` / `assists`       | `number` |
| `damage`                             | `number` |
| `headshotKills`                      | `number` |
| `utilityDamage`                      | `number` |
| `enemiesFlashed`                     | `number` |
| `enemy3Ks` / `enemy4Ks` / `enemy5Ks` | `number` |
| `objective`                          | `number` |

**Per-round stats** (from `CSPerRoundStats_t`, reset between rounds)

| Property                                         | Type     |
| ------------------------------------------------ | -------- |
| `round_kills` / `round_deaths` / `round_assists` | `number` |
| `round_damage`                                   | `number` |
| `round_headshotKills`                            | `number` |
| `round_equipmentValue`                           | `number` |
| `round_cashEarned`                               | `number` |
| `round_utilityDamage`                            | `number` |
| `round_enemiesFlashed`                           | `number` |
| `round_liveTime`                                 | `number` |

**General**

| Property                  | Type     |
| ------------------------- | -------- |
| `mvps` / `score` / `ping` | `number` |

### PlayerPawn Helper

`parser.getPawn(entityId)` returns a `PlayerPawn` helper for a `CCSPlayerPawn` entity. The `controller` property navigates back to the owning `Player`.

| Property                                | Type                                        | Description                                 |
| --------------------------------------- | ------------------------------------------- | ------------------------------------------- |
| `entityId`                              | `number`                                    | Pawn entity index                           |
| `entity`                                | `TypedEntity<'CCSPlayerPawn'> \| undefined` | Raw pawn entity                             |
| `health` / `maxHealth`                  | `number`                                    | `maxHealth` defaults to `100`               |
| `armor`                                 | `number`                                    |                                             |
| `lifeState`                             | `number`                                    | Raw life state flags                        |
| `isAlive`                               | `boolean`                                   | `lifeState === 0`                           |
| `position`                              | `Vector`                                    | Computed from cell + vec coords             |
| `eyeAngles`                             | `{ pitch: number; yaw: number }`            |                                             |
| `hasDefuser` / `hasHelmet`              | `boolean`                                   | From `CCSPlayer_ItemServices`               |
| `isScoped` / `isWalking` / `isDefusing` | `boolean`                                   |                                             |
| `flags`                                 | `number`                                    | Raw `m_fFlags` bitmask                      |
| `ownerEntityHandle`                     | `number`                                    | Raw `m_hOwnerEntity` handle                 |
| `controller`                            | `Player \| undefined`                       | Owning controller, linked by `pawnEntityId` |

`Vector` is re-exported from the package root: `import type { Vector } from 'cs2parser'`.
