# Network messages

[Back to README](../README.md#documentation)

## Network Messages

Every message that can appear in a `DEM_Packet` is listenable by its protobuf enum
name. The table is [generated](development.md#proto-generation) from the message enums, so it
covers all of `NET_Messages`, `SVC_Messages`, `EBaseUserMessages`,
`EBaseEntityMessages`, `EBaseGameEvents`, `ECstrike15UserMessages`,
`ETEProtobufIds` and `ECsgoGameEvents` — 213 messages.

Attaching a listener is all it takes. The message is decoded only while something
is listening, so subscribing to a rare message costs nothing on demos that don't
contain it, and a listener attached mid-parse takes effect from the next packet.

```ts
// Per-shot ground truth — origin, angles, weapon, seed, recoil index
parser.on('GE_FireBulletsId', shot => {
	console.log(shot.origin, shot.angles, shot.recoil_index);
});

// Chat. CS2 uses both, depending on the server.
parser.on('UM_SayText', e => console.log(e.text));
parser.on('UM_SayText2', e => console.log(e.param2));

// Server tick and frame timing, once per packet
parser.on('net_Tick', t => {});

// End-of-match scoreboard, straight from the server
parser.on('CS_UM_EndOfMatchAllPlayersData', data => {});
```

Payload types come from the generated protobuf definitions, so `shot.recoil_index`
autocompletes and `parser.on('not_a_message', …)` is a compile error.


For public chat carried in `svc_EncryptedData`, see [Encrypted demo chat](encrypted-chat.md).

### Messages with a dedicated event

Seven messages are decoded by the parser itself and surfaced through a
purpose-built event instead of by name:

| Message                         | Event                                               |
| ------------------------------- | --------------------------------------------------- |
| `svc_ServerInfo`                | `serverinfo`                                        |
| `svc_CreateStringTable`         | `createstringtable`                                 |
| `svc_UpdateStringTable`         | `updatestringtable`                                 |
| `svc_ClearAllStringTables`      | `clearallstringtables`                              |
| `svc_PacketEntities`            | `entitycreated` / `entityupdated` / `entitydeleted` |
| `GE_Source1LegacyGameEventList` | `gameeventlist`                                     |
| `GE_Source1LegacyGameEvent`     | `gameevent` (prefer `parser.gameEvents`)            |

### User commands

`usercommand` fires once per player command in `svc_UserCmds`, with the payload
fully reconstructed:

```ts
parser.on('usercommand', ({ playerSlot, cmd, isDelta }) => {
	const base = cmd?.base;
	if (!base) return;
	console.log(playerSlot, base.viewangles, base.buttons_pb, base.subtick_moves);
});
```

| Field                | Meaning                                                       |
| -------------------- | ------------------------------------------------------------- |
| `cmd`                | The resolved `CSGOUserCmdPB`; null if it could not be rebuilt |
| `isDelta`            | Whether it arrived as a delta rather than a full payload      |
| `deltaData`          | The raw delta bytes, for callers who want them                |
| `playerSlot`         | Userinfo slot                                                 |
| `cmdNumber`          | Client-side sequence number                                   |
| `clientTick`         | Tick the client produced the command on                       |
| `serverTickExecuted` | Tick the server executed it on                                |

Buttons, view angles, movement and subtick moves live under `cmd.base`; per-frame
aim history is in `cmd.input_history`.

This is the largest payload in a demo — 127 MB and 1.24 M commands in a 20-round
match — and it is decoded only while something is listening.

#### Delta encoding

CS2 sends almost every advancing command as a delta against the player's previous
one: in that same match, 1,234,273 of 1,235,910 commands, carrying 104 MB of the
127 MB total. The parser tracks each player's running command and applies deltas
automatically, so `cmd` is the complete command either way.

The encoding is not protobuf, despite looking like it. Fields can arrive with wire
type 7 meaning "reset to the declared default", and repeated fields use list
opcodes that resize and patch the previous command's list in place. Handing these
bytes to a stock protobuf decoder throws on about half of them and quietly
produces wrong buttons and view angles on the rest.

A command that cannot be resolved yields `cmd: null` and invalidates that player's
delta chain. Subsequent deltas remain null until a full command supplies a new
baseline. Removing the `usercommand` listener while parsing also invalidates the
baseline, so reattaching it may require waiting for the next full command. The
parser reports reconstruction failures on `debug` when the demo completes.

### Discovering messages

`anymessage` fires for every non-core message with its undecoded body, including
ids the registry doesn't know — useful after a game update introduces a message
the bundled protos predate.

```ts
const seen = new Map<number, string>();
parser.on('anymessage', ({ id, name, bytes }) => {
	seen.set(id, name ?? `unknown(${id}) ${bytes.length}B`);
});
```

`DemoReader.messageNames` lists every subscribable name, `DemoReader.messageId(name)`
gives its wire id, and `DemoReader.isMessageName(name)` narrows a string to a
subscribable name. Core messages still have wire IDs but return false from
`isMessageName`, because they use the dedicated events listed above.

Run `bun scripts/probe-message-histogram.ts <demo.dem>` to see which messages a
given demo actually contains, with counts and byte totals.

### Demo frame commands

Other demo frames can be subscribed to by name, such as `DEM_CustomData`,
`DEM_StringTables`, and `DEM_FileInfo`. Their byte payloads are safe to retain.

```ts
parser.on('DEM_FileInfo', info => console.log(info.playback_time, info.playback_ticks));
// Or read the file-info trailer without parsing the demo:
const info = DemoReader.parseFileInfo('demo.dem');
```

Listening for `DEM_FileInfo` or `DEM_SpawnGroups` reads past `DEM_Stop` through
the trailer; streams wait for EOF. An absent or truncated trailer does not make
the gameplay portion of the demo incomplete.
