import { describe, test, expect, beforeAll } from 'bun:test';
import { DemoReader, EntityMode } from '../../src/index.js';
import fs from 'fs';

const demoPath = process.env.CS2_DEMO_PATH ?? 'tests/fixtures/demo.dem';
const demoAvailable = fs.existsSync(demoPath);

describe.skipIf(!demoAvailable)('helper caching (reference equality)', () => {
	let reader: DemoReader;

	beforeAll(async () => {
		reader = new DemoReader();
		reader.on('tickend', () => {
			if (reader.currentTick >= 1000) {
				reader.cancel();
			}
		});
		await reader.parseDemo(demoPath, { entities: EntityMode.ALL });
	});

	test('parser.teams returns identical instances across calls', () => {
		const a = reader.teams;
		const b = reader.teams;
		expect(a.length).toBeGreaterThan(0);
		expect(a.length).toBe(b.length);
		for (let i = 0; i < a.length; i++) {
			expect(a[i]).toBe(b[i]!);
		}
	});

	test('parser.playerControllers returns identical instances across calls', () => {
		const a = reader.playerControllers;
		const b = reader.playerControllers;
		expect(a.length).toBeGreaterThan(0);
		expect(a.length).toBe(b.length);
		for (let i = 0; i < a.length; i++) {
			expect(a[i]).toBe(b[i]!);
		}
	});

	test('parser.getPlayer returns the same instance for the same entityId', () => {
		const first = reader.playerControllers[0];
		expect(first).toBeDefined();
		const a = reader.getPlayer(first!.entityId);
		const b = reader.getPlayer(first!.entityId);
		expect(a).not.toBeNull();
		expect(a).toBe(b);
		expect(a).toBe(first!);
	});

	test('parser.getPawn returns the same instance for the same entityId', () => {
		const playerWithPawn = reader.playerControllers.find(p => p.pawnEntityId !== null && p.pawn !== null);
		if (!playerWithPawn) return;
		const id = playerWithPawn.pawnEntityId!;
		const a = reader.getPawn(id);
		const b = reader.getPawn(id);
		expect(a).not.toBeNull();
		expect(a).toBe(b);
	});

	test('player.team is identical to the matching entry in parser.teams', () => {
		const player = reader.playerControllers.find(p => p.team !== null);
		expect(player).toBeDefined();
		const teamFromPlayer = player!.team;
		const teamFromList = reader.teams.find(t => t.teamNumber === player!.teamNumber);
		expect(teamFromPlayer).not.toBeNull();
		expect(teamFromList).toBeDefined();
		expect(teamFromPlayer).toBe(teamFromList!);
	});

	test('player.pawn is identical to parser.getPawn(player.pawnEntityId)', () => {
		const player = reader.playerControllers.find(p => p.pawn !== null);
		if (!player) return;
		const pawnFromPlayer = player.pawn;
		const pawnFromGetter = reader.getPawn(player.pawnEntityId!);
		expect(pawnFromPlayer).not.toBeNull();
		expect(pawnFromPlayer).toBe(pawnFromGetter);
	});

	test('pawn.controller round-trips back to the originating player', () => {
		const player = reader.playerControllers.find(p => p.pawn !== null);
		if (!player) return;
		const pawn = player.pawn!;
		expect(pawn.controller).toBe(player);
	});

	test('parser.gameRules returns a stable singleton', () => {
		const a = reader.gameRules;
		const b = reader.gameRules;
		expect(a).not.toBeNull();
		expect(a).toBe(b);
	});

	test('cached helpers are usable as Map keys', () => {
		const player = reader.playerControllers[0]!;
		const map = new Map<typeof player, number>();
		map.set(player, 42);
		const lookedUp = reader.getPlayer(player.entityId);
		expect(lookedUp).not.toBeNull();
		expect(map.get(lookedUp!)).toBe(42);
	});

	test('teams returned via player.team are usable as Set members', () => {
		const teams = new Set(reader.teams);
		for (const player of reader.playerControllers) {
			if (player.team) {
				expect(teams.has(player.team)).toBe(true);
			}
		}
	});
});
