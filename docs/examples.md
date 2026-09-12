# Runnable examples

[Back to README](../README.md#documentation)

## Examples

The [`examples/`](../examples/) directory contains runnable scripts:

| File            | Description                                                      |
| --------------- | ---------------------------------------------------------------- |
| [`smokes.html`](../examples/smokes.html) | Standalone demo picker, smoke histories, and 3D voxel/radar viewer |
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

## Smoke viewer

Open [`examples/smokes.html`](../examples/smokes.html) directly in a modern browser
and choose an uncompressed `.dem`. The file is passed to cs2parser as
`file.stream()` in a worker; nothing is uploaded. After parsing, select a smoke
and scrub its frames. Adjust density, seed display, radar height and opacity;
drag to orbit, scroll to zoom, or Shift-drag to pan.

The single HTML embeds the parser and radars for Ancient, Anubis, Cache, Dust II,
Inferno, Mirage, Nuke, Overpass, Train, Vertigo, Italy and Office. Nuke, Train and
Vertigo include lower-floor images. WebGL is required for the 3D view.
