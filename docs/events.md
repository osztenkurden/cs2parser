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
parser.on('entitycreated', ([entityId, classId, entityType, className]) => {});
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
