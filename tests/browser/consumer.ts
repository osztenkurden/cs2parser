import { DemoReader, EntityMode, SnappyDecoder, type ParseOptions } from 'cs2parser/browser';
import { captureParity, chunkedDemo, type ParityResult } from '../helpers/parity.js';

async function checkBrowserAPI(file: File, bytes: Uint8Array, stream: ReadableStream<Uint8Array>) {
	const reader = new DemoReader();
	const opts: ParseOptions = { entities: EntityMode.ALL };
	const parity = captureParity(reader, 'ALL');
	reader.gameEvents.on('player_death', event => {
		event.player?.name;
	});
	reader.on('svc_VoiceData', message => {
		message.audio?.voice_data;
	});
	await reader.parseDemo(stream, opts);
	const snapshot: ParityResult = await parity.finish();
	snapshot.final.entities.sha256;
	await new DemoReader().parseDemo(chunkedDemo(bytes, 4093), opts);
	await new DemoReader().parseDemo(bytes);
	await new DemoReader().parseDemo(file.stream());
	(await DemoReader.parseHeaderAsync(file))?.map_name;
	(await DemoReader.parseServerInfoAsync(bytes))?.max_clients;
	(await DemoReader.parseFileInfoAsync(file))?.playback_ticks;
	new SnappyDecoder().uncompress(bytes, new Uint8Array(1024));
	// @ts-expect-error Browser parsing cannot open server filesystem paths.
	await new DemoReader().parseDemo('demo.dem');
	// @ts-expect-error The Node-specific chunked-file option is not a browser option.
	await new DemoReader().parseDemo(bytes, { stream: false });
	// @ts-expect-error Metadata accepts bytes and Blob/File, not filesystem paths.
	await DemoReader.parseHeaderAsync('demo.dem');
	// @ts-expect-error Synchronous metadata is available only from the server export.
	DemoReader.parseHeader(bytes);
	// @ts-expect-error Synchronous metadata is available only from the server export.
	DemoReader.parseServerInfo(bytes);
	// @ts-expect-error Synchronous metadata is available only from the server export.
	DemoReader.parseFileInfo(bytes);
}

void checkBrowserAPI;
