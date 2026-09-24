import { expect, test } from 'bun:test';
import { createReadStream, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { DemoReader, EntityMode, Player, fileDemoSource } from '../../src/index.js';
import { pausedParser, oneTick } from '../helpers/pausedParser.js';
import { canonicalize } from '../helpers/parity.js';
const path = process.env.CS2_DEMO_PATH ?? 'tests/fixtures/demo.dem';
const hash = (value: unknown) => createHash('sha256').update(canonicalize(value)).digest('hex');
const state = (reader: DemoReader) =>
	hash({
		entities: Object.entries(reader.entities).filter(([, entity]) => entity !== undefined),
		players: reader.players,
		time: reader.currentTime,
		controllers: reader.playerControllers.map(p => ({
			id: p.entityId,
			steam: p.steamId,
			name: p.name,
			position: p.position,
			health: p.health,
			team: p.teamNumber
		})),
		teams: reader.teams.map(t => ({ team: t.teamNumber, score: t.score }))
	});
// Both reference passes stop here: ~10 rounds give every target kind without two full parses.
const LIMIT_TICK = 60000;
const eventData = (event: object) =>
	Object.fromEntries(
		Object.entries(event).map(([key, value]) => [
			key,
			value instanceof Player
				? { id: value.entityId, steam: value.steamId, name: value.name, health: value.health }
				: value
		])
	);

test.skipIf(!existsSync(path))(
	'seek matches sequential state/events at round boundaries, FullPackets, deletion/recreation, death and smoke ticks',
	async () => {
		const source = await fileDemoSource(path);
		const probe = new DemoReader();
		const starts: number[] = [];
		const ends: number[] = [];
		let death = -1,
			smoke = -1,
			recreation = -1,
			last = -1;
		const deleted = new Set<number>();
		probe.gameEvents.on('round_start', () => starts.push(probe.currentTick));
		probe.gameEvents.on('round_end', () => ends.push(probe.currentTick));
		probe.gameEvents.on('player_death', () => {
			if (death < 0) death = probe.currentTick;
		});
		probe.on('entitydeleted', id => deleted.add(id));
		probe.on('entitycreated', ([id]) => {
			if (recreation < 0 && deleted.has(id)) recreation = probe.currentTick;
		});
		probe.on('tickend', tick => {
			last = tick;
			if (smoke < 0 && probe.smokes.some(s => s.entity)) smoke = tick;
			if (tick >= LIMIT_TICK) probe.cancel();
		});
		await probe.parseDemo(createReadStream(path), { entities: EntityMode.ALL });
		// Byte offset of the last FullPacket before the limit bounds how much a seek may read.
		const limitBytes = Math.max(...Object.values(probe.getSeekIndex()));
		const { reader, parsing } = await pausedParser(source);
		const far = Math.max(0, last - 20);
		expect((await reader.seekTo(far)).status).toBe('complete');
		expect(reader.fullPackets.length).toBeGreaterThan(0);
		expect(reader.seekMemoryBytes).toBeLessThan(32 * 1024 * 1024);
		const middle = reader.fullPackets[Math.floor(reader.fullPackets.length / 2)]!.tick;
		const targets = [
			...new Set(
				[
					0,
					...[starts, ends].flatMap(t => [t[0], t[Math.floor(t.length / 2)], t.at(-1)]),
					middle,
					far,
					death,
					smoke,
					recreation
				].filter((tick): tick is number => tick !== undefined && tick >= 0)
			)
		];
		const lastWanted = Math.max(...targets) + 2;
		const wanted = (tick: number) => targets.some(t => tick >= Math.max(0, t - 1) && tick <= t + 2);
		const expected = new Map<number, { state: string; events: string }>();
		const sequential = new DemoReader();
		let events: unknown[] = [];
		sequential.gameEvents.on('gameEvent', (name, event) => events.push([name, eventData(event)]));
		sequential.on('tickend', tick => {
			if (wanted(tick)) expected.set(tick, { state: state(sequential), events: hash(events) });
			events = [];
			if (tick >= lastWanted) sequential.cancel();
		});
		await sequential.parseDemo(path, { entities: EntityMode.ALL });
		let actualEvents: unknown[] = [];
		let observedTicks: number[] = [];
		reader.gameEvents.on('gameEvent', (name, event) => actualEvents.push([name, eventData(event)]));
		reader.on('tickend', tick => {
			observedTicks.push(tick);
			expect({ state: state(reader), events: hash(actualEvents) }).toEqual(expected.get(tick)!);
			actualEvents = [];
		});
		for (const target of [...targets].reverse().concat(targets.slice(-3))) {
			observedTicks = [];
			actualEvents = [];
			const seek = await reader.seekTo(Math.max(0, target - 1));
			expect(seek.status).toBe('complete');
			expect(observedTicks).toEqual([]);
			expect(actualEvents).toEqual([]);
			while (reader.currentTick < target + 2) {
				if ((await oneTick(reader)) >= target + 2) break;
			}
			expect(observedTicks.length).toBeGreaterThan(0);
		}
		// Already-discovered long seeks fetch FullPackets plus the local reconstruction interval.
		const before = reader.seekBytesRead;
		await reader.seekTo(far);
		expect(reader.seekBytesRead - before).toBeLessThan(limitBytes / 3);
		reader.cancel();
		await parsing;

		// Transfer the streaming pass's offsets to a fresh reader, without discovering again.
		const indexed = await pausedParser(source);
		indexed.reader.setSeekIndex(JSON.parse(JSON.stringify(probe.getSeekIndex())));
		expect(await indexed.reader.seekTo(far)).toEqual({ status: 'complete', tick: far });
		expect(indexed.reader.seekBytesRead).toBeLessThan(limitBytes / 3);
		const tick = await oneTick(indexed.reader);
		expect(state(indexed.reader)).toBe(expected.get(tick)!.state);
		indexed.reader.cancel();
		await indexed.parsing;
	},
	300000
);
