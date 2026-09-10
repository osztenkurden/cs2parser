# Encrypted demo chat

[Back to README](../README.md#documentation)

## Encrypted demo chat

CS2 demos recorded after the September 9, 2026 update can carry chat inside
`svc_EncryptedData`. Supply the matching public key to receive those messages
through the usual `chat`, `UM_SayText`, and `UM_SayText2` events:

```ts
import { readFileSync } from 'node:fs';
import { DemoReader, extractPublicEncryptionKey } from 'cs2parser';

const decryptionKey = extractPublicEncryptionKey(readFileSync('match.dem.info'));
const reader = new DemoReader();
reader.on('chat', message => console.log(message.text));
await reader.parseDemo('match.dem', { decryptionKey });
```

The `.dem.info` companion is saved alongside demos downloaded through the game's
Watch UI. It must belong to the same match; there is no universal public chat key.
If you have the Game Coordinator's `watchablematchinfo.cl_decryptdata_key_pub`
uint64 value instead, pass its decimal string or bigint to `decodeEncryptionKey`.
The cipher key is the **16 uppercase ASCII hexadecimal characters** representing
that value, not the eight binary bytes obtained by hex-decoding it.

This supports public messages (`key_type: 2`). Team/private messages (`key_type: 1`)
use a separate key and remain unreadable with the public key. Missing keys leave
encrypted messages untouched; invalid ciphertext or a wrong key skips the inner
message and reports a deduplicated `debug` diagnostic without aborting gameplay.
Decryption is enabled when a key and an inner-message listener are present;
`svc_EncryptedData: false` disables it. Inner message overrides still apply.
An `anymessage` listener receives both the original envelope and decrypted inner
messages, with independent byte storage. The named `svc_EncryptedData` event
continues to expose the original ciphertext.

The browser export and HTTP broadcasts accept the same `decryptionKey` option.
In a browser, pass the `.dem.info` file's bytes to `extractPublicEncryptionKey`.
Sender `Player` helpers require `entities: EntityMode.ALL`, as with ordinary chat.
The `chat` payload also includes `playerInfo`, the sender's userinfo entry (name,
Steam ID, and other roster fields), available without entity parsing. It is `null`
for server messages or when the sender's userinfo is missing.

The ICE envelope and key conversion follow
[demofile's CS:GO implementation](https://github.com/saul/demofile/blob/master/src/demo.ts)
and [key extraction](https://github.com/saul/demofile/blob/master/src/replaykeys.ts).
CS2's inner message header uses a bit-packed `UBitVar` ID, confirmed against
`10_09_2026.dem`; directly reusing CS:GO's varint header reader does not work.
