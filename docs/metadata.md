# Reading metadata

[Back to README](../README.md#documentation)

## parseHeader

Server-only synchronous method that reads the demo file header without parsing the full file. Fast and low-memory.

```ts
const header = DemoReader.parseHeader('path/to/demo.dem');
if (header) {
	console.log(header.map_name); // e.g. "de_dust2"
	console.log(header.server_name); // server name
	console.log(header.build_num); // CS2 build number
	console.log(header.patch_version); // patch version
	console.log(header.game); // undefined on premier
}
```

Returns `null` if the header is absent or truncated, and throws on I/O or malformed-data errors. Accepts file paths, `Buffer`, and `Uint8Array`; reads the header's declared size, including headers larger than 4 KB. Use `parseHeaderAsync` for promise-based reads or Blob/File inputs.

## parseServerInfo

Server-only synchronous method that reads server info from the first few packets without parsing the full demo. Fast and low-memory.

```ts
const info = DemoReader.parseServerInfo('path/to/demo.dem');
if (info) {
	console.log(info.map_name); // e.g. "de_dust2"
	console.log(info.server_name); // server name
	console.log(info.max_clients); // max player slots
	console.log(info.game_dir); // e.g. "csgo"
}
```

Returns `null` if server info cannot be found. Reads only the demo's signon section (the setup frames at the start, before gameplay begins) instead of the whole file, so it stays fast and low-memory on demos of any size.

## Asynchronous Metadata

Use the `Async` suffix for promise-based metadata reads:

```ts
import { DemoReader } from 'cs2parser';

const header = await DemoReader.parseHeaderAsync('demo.dem');
const serverInfo = await DemoReader.parseServerInfoAsync('demo.dem');
const fileInfo = await DemoReader.parseFileInfoAsync('demo.dem');
```

These methods resolve to metadata or `null` for absent/truncated metadata, and reject on I/O or malformed-data errors. The server accepts paths, `Buffer`, `Uint8Array`, and Blob/File inputs. The browser exposes only the `Async` methods, accepting bytes or Blob/File. Both paths read only relevant frame headers/bodies and seek directly to file-info trailers.

The server's unsuffixed `parseHeader`, `parseServerInfo`, and `parseFileInfo` methods accept paths, `Buffer`, or `Uint8Array` and block the calling thread. Use them in batch processes/workers; each call closes its file and releases decoder storage before returning. `parseDemo()` remains asynchronous.
