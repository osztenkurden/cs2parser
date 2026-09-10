# Runnable examples

[Back to README](../README.md#documentation)

## Examples

The [`examples/`](../examples/) directory contains runnable scripts:

| File            | Description                                                      |
| --------------- | ---------------------------------------------------------------- |
| `header.ts`     | `DemoReader.parseHeader` — fast metadata read                    |
| `serverinfo.ts` | `DemoReader.parseServerInfo` — tick interval / map / max clients |
| `stream.ts`     | Four input modes, game events, and player/team summaries         |
| `chat.ts`       | Chat messages from a demo                                        |
| `encrypted-chat.ts` | Public chat decrypted using a matching `.dem.info` file     |
| `voicedata.ts`  | Opt-in `svc_VoiceData` parsing                                   |
| `broadcast.ts`  | Live HTTP broadcast, optional descriptors, and signal cancellation |

```sh
bun examples/header.ts path/to/demo.dem
bun examples/serverinfo.ts path/to/demo.dem
bun examples/stream.ts path-stream path/to/demo.dem
bun examples/chat.ts path/to/demo.dem
bun examples/encrypted-chat.ts path/to/demo.dem path/to/matching.dem.info
bun examples/voicedata.ts path/to/demo.dem
bun examples/broadcast.ts https://relay.example.com/match/ [event-descriptors.bin]
```

The stream example accepts `path-stream`, `path-chunked` (`stream: false`), `buffer`, or `stream` as its first argument. Named message listeners enable their own decoding; no separate parse option is required.
