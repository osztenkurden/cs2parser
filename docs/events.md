# Game and parser events

[Back to README](../README.md#documentation)

## Game Events

Events are emitted at the end of each tick. Player references are auto-resolved — any `userid` / `attacker` / `assister` field is matched to a `Player` helper and exposed as `player`, `attackerPlayer`, `assisterPlayer`.

```ts
parser.gameEvents.on('player_death', event => {
  event.player;          // Player | null (victim)
  event.attackerPlayer;  // Player | null
  event.assisterPlayer;  // Player | null
  event.weapon;          // string
  event.headshot;        // boolean
});

parser.gameEvents.on('round_end', event => {
  event.winner; // team number
  event.reason; // WinRoundReason
});

parser.gameEvents.on('bomb_planted', event => { ... });
parser.gameEvents.on('bomb_defused', event => { ... });

// Catch-all listener — fires once per emitted event with the event name
parser.gameEvents.on('gameEvent', (name, event) => {
  console.log(name, event);
});
```

`round_start` and `round_end` are emitted as **synthetic** events derived from `CCSGameRules.m_nRoundStartCount` / `m_nRoundEndCount` whenever `EntityMode.ALL` or `EntityMode.ONLY_GAME_RULES` is active — the raw network versions are suppressed in those modes to avoid duplicates. With `EntityMode.NONE`, only the raw events fire.

`bomb_pickup` uses `userid_pawn` rather than `userid`. Its `player` annotation resolves that reference through the pawn/controller helpers, including signed wire values.

## Equipment lifecycles

With `EntityMode.ALL`, equipment is reconciled after all updates for the tick and before public `tickend` listeners. Only changed weapon-service fields and their entity dependencies are processed. Native pickup/equip/remove notifications are preserved and enriched; missing net changes are reconstructed under the same event names. `source` distinguishes `'native'` from `'reconstructed'`. Raw fields, including an occasionally zero native `defindex`, are left intact.

```ts
parser.gameEvents.on('inventory_snapshot', ({ player, inventory }) => {
  // First complete inventory for a pawn; replace this player's starting state.
  // inventory.items: readonly InventoryItem[]
  // inventory.activeItem: InventoryItem | null
});

parser.gameEvents.on('item_pickup', event => {
  if (!event.weapon || !event.quantity) return;
  // Add event.quantity units, or set this stack to event.remainingQuantity.
  console.log(event.player?.name, event.itemId, event.weapon.name, event.quantity);
});

parser.gameEvents.on('item_remove', event => {
  // quantity is units removed; remainingQuantity is the stack size afterward.
  // physicalDrop === true confirms a surviving, unowned world entity.
  // false means "not confirmed", NOT "consumed" or "destroyed".
});

parser.gameEvents.on('item_equip', event => {
  if (event.itemId === undefined) return; // Native event could not be resolved.
  // itemId/weapon === null explicitly means no active inventory weapon.
  // Otherwise weapon contains the resolved item and its current stack quantity.
});

parser.gameEvents.on('round_freeze_end', () => {
  for (const player of parser.playerControllers) {
    const inventory = player.inventory;
    // Owned snapshot of the last complete tick state; null if not available yet.
  }
});
```

An `InventoryItem` contains `itemId`, the full serial-bearing `handle`, `entityId`, `className`, resolved `defindex` and `name`, and `quantity`. IDs survive ownership transfers and differ when an entity index is reused with another serial. A grenade handle identifies a **stack**, not an individual grenade within it: ammunition counts supply its quantity. Stacks can merge or split into different entities; there is no faithful per-grenade identity across those operations. Projectile IDs identify a separate entity and are not asserted to be inventory IDs.

`player.inventory` returns the complete `InventorySnapshot` (`items`, `activeItem`, and `pawnHandle`), not just an item array. It reads the reader's cached equipment state and copies that player's snapshot; it does not poll or rebuild inventories. To obtain all inventories, iterate `parser.playerControllers` and read each player's getter.

`item_remove` means removal from inventory, including ammo decrements, death cleanup, transfers, and entity destruction. It does not infer a purchase, consumption, or death reason. A physical drop is confirmed only when the handle leaves inventory and that same entity survives with an explicit invalid owner and no tracked inventory references. An ammo decrement alone is not a drop. Later evidence in a different tick does not retroactively change the event.

For pickups/removals, `quantity` is the net delta, while `weapon.quantity` describes the resolved stack (before removal or after pickup). Multiple native notifications for the same net change are retained, but only one receives a positive delta; extra resolved notifications have `quantity: 0`. Initial snapshots seed state without fabricating pickups. Missing entity/ammo data postpones reconciliation until a relevant update arrives, rather than treating unavailable state as an empty inventory.

Native events describing an intermediate weapon superseded within the tick can remain unresolved. Non-weapon pickups such as armor and defusers also keep their native payloads without invented weapon handles. Optional enrichment fields distinguish these cases. Synthetic equips use neutral defaults for legacy cosmetic/capability fields; use the resolved `weapon` data rather than interpreting those defaults as observed capabilities.

## Grenade lifecycles

| Event | Meaning |
| --- | --- |
| `grenade_thrown` | Native throw, or first observation of a newly created supported projectile entity. Includes `projectileId`, `projectileHandle`, `entityid`, resolved thrower, and weapon name when reconstructable. |
| `grenade_flight_end` | A positively observed detonation/effect signal for that projectile. `signal` names the native event or network effect field that established it. Emitted at most once per projectile. |
| `grenade_deleted` | The projectile entity was deleted/replaced. This is distinct from flight ending and does **not** assert detonation. |

Supported projectile classes cover flashbangs, HE, smoke, decoy, and Molotov/incendiary grenades (`m_bIsIncGrenade` distinguishes the last two). Inventory `CIncendiaryGrenade` entities are not projectiles. Native detonation events remain available unchanged. Repeated creation records for the same serial-bearing entity do not produce another throw.

Flight-end evidence is a native `hegrenade_detonate`, `flashbang_detonate`, `smokegrenade_detonate`, `decoy_started`, or `molotov_detonate` event with an entity ID, or a positive `m_nExplodeEffectTickBegin` / `m_nSmokeEffectTickBegin`. Some demos have no attributable flight-end evidence for Molotov/incendiary projectiles; they can produce a throw and deletion without a flight-end event. Inferno creation is not guessed to belong to a nearby projectile. Joining a broadcast mid-flight likewise establishes only the first observed creation, not the original throw time.

All lifecycle events reach `gameEvent` as well as their named listeners. Seeking reconstructs tracker state silently; `player.inventory` can seed a consumer again after seeking. No bullet impacts, bounces, purchase reasons, or extinguish causes are inferred.

## Low-level Events

`DemoReader` is an `EventEmitter`. These events let you hook into the parse pipeline itself — tick boundaries, header/server info, entity lifecycle, and raw network messages.

```ts
// Parse lifecycle
parser.on('header', header => {}); // CDemoFileHeader — fires once
parser.on('serverinfo', info => {}); // CSVCMsg_ServerInfo — fires once
parser.on('tickstart', tick => {}); // number
parser.on('tickend', tick => {}); // number
parser.on('progress', bytesParsed => {}); // cumulative bytes, periodically and at completion
parser.on('end', outcome => {
	if (outcome.status === 'error') console.error(outcome.error);
}); // observational; always handle the parsing promise's rejection
parser.on('cancel', () => {}); // fires on parser.cancel()
parser.on('error', ({ error }) => {}); // fatal parse error
parser.on('debug', msg => {}); // diagnostic strings

// String tables — populate parser.players
parser.on('createstringtable', table => {});
parser.on('updatestringtable', update => {});
parser.on('clearallstringtables', () => {});

// Entity lifecycle (requires EntityMode.ALL / ONLY_GAME_RULES)
parser.on('entitycreated', ([entityId, classId, entityType, className, serial]) => {});
parser.on('entityupdated', ({ entityId, propId, value }) => {});
parser.on('entitydeleted', entityId => {});

// Raw game events (prefer parser.gameEvents for typed access)
parser.on('gameeventlist', list => {});
parser.on('gameevent', event => {});

// Network messages — see network-messages.md
parser.on('svc_UserCmds', cmd => {});
parser.on('anymessage', ({ name, id, bytes }) => {});
```

See [Network messages](network-messages.md) for subscriptions, user commands, and raw message discovery.
