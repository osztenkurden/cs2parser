import { existsSync } from 'node:fs';
import snappy from 'snappy';
import { DemoReader, EntityMode } from '../src/index.js';
import { demoFile, demoFrame, bytesField, networkPacket } from '../tests/helpers/demo.js';
import { buildFragment } from '../tests/unit/broadcast/helpers.js';
import { EDemoCommands } from '../src/ts-proto/demo.js';
import { EBaseGameEvents } from '../src/ts-proto/gameevents.js';
import { loadBundledEventDescriptors } from '../src/broadcast/defaultEventDescriptors.js';

const built = await Bun.build({ entrypoints: ['tests/browser/entry.ts'], target: 'browser' });
if (!built.success) throw new AggregateError(built.logs, 'Browser package bundle failed');
const bundle = await built.outputs[0]!.text();
const header = demoFrame(
	EDemoCommands.DEM_FileHeader | EDemoCommands.DEM_IsCompressed,
	snappy.compressSync(bytesField(5, new TextEncoder().encode('de_dust2')))
);
const demo = demoFile(header, demoFrame(EDemoCommands.DEM_Stop));
const fixturePath = process.env.CS2_DEMO_PATH ?? 'tests/fixtures/demo.dem';

const death = loadBundledEventDescriptors().descriptors.find(d => d.name === 'player_death')!;
const packet = networkPacket([
	{ id: EBaseGameEvents.GE_Source1LegacyGameEvent, body: Uint8Array.from([16, ...encodeVarint(death.eventid!)]) }
]);
const start = buildFragment([{ cmd: EDemoCommands.DEM_SyncTick, tick: 0, payload: new Uint8Array(0) }]);
const full = buildFragment([
	{ cmd: EDemoCommands.DEM_Packet, tick: 100, payload: snappy.compressSync(packet), isCompressed: true }
]);
const end = buildFragment([], true);

function encodeVarint(value: number): number[] {
	const bytes: number[] = [];
	do {
		const byte = value & 127;
		value >>>= 7;
		bytes.push(byte | (value ? 128 : 0));
	} while (value);
	return bytes;
}

let expected: Promise<unknown> | undefined;
async function nativeResult() {
	const reader = new DemoReader();
	let deaths = 0;
	reader.gameEvents.on('player_death', () => deaths++);
	const result = await reader.parseDemo(fixturePath, { entities: EntityMode.ALL });
	if (result.incomplete || result.error) throw new Error('Native fixture parse failed');
	return {
		tick: reader.currentTick,
		entities: reader.entities.filter(Boolean).length,
		deaths,
		map: reader.header?.map_name
	};
}

Bun.serve({
	hostname: '127.0.0.1',
	port: 4178,
	async fetch(request) {
		const path = new URL(request.url).pathname;
		// Deliberately omit COOP/COEP. The decoder must work on ordinary pages.
		if (path === '/')
			return new Response('<!doctype html><title>cs2parser browser tests</title>', {
				headers: { 'Content-Type': 'text/html' }
			});
		if (path === '/bundle.mjs') return new Response(bundle, { headers: { 'Content-Type': 'text/javascript' } });
		if (path === '/fixture.dem') return new Response(Uint8Array.from(demo));
		if (path === '/real.dem' && existsSync(fixturePath)) return new Response(Bun.file(fixturePath));
		if (path === '/expected' && existsSync(fixturePath)) return Response.json(await (expected ??= nativeResult()));
		if (path === '/broadcast/sync')
			return Response.json({
				tick: 100,
				rtdelay: 0,
				rcvage: 0,
				fragment: 5,
				signup_fragment: 0,
				tps: 64,
				protocol: 5
			});
		if (path === '/broadcast/0/start') return new Response(Uint8Array.from(start));
		if (path === '/broadcast/5/full') return new Response(Uint8Array.from(full));
		if (path === '/broadcast/5/delta' || path === '/broadcast/6/delta') return new Response(Uint8Array.from(end));
		if (path === '/worker.mjs')
			return new Response(
				`
			import { DemoReader } from '/bundle.mjs';
			onmessage = async ({ data }) => {
				try {
					const reader = new DemoReader();
					const result = await reader.parseDemo(new Blob([data]).stream());
					postMessage({ result, map: reader.header?.map_name });
				} catch (error) { postMessage({ error: String(error) }); }
			};`,
				{ headers: { 'Content-Type': 'text/javascript' } }
			);
		return new Response('Not found', { status: 404 });
	}
});
