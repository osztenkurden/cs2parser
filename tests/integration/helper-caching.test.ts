import { describe, test, expect, beforeAll } from 'bun:test';
import { DemoReader, EntityMode } from '../../src/index.js';
import fs from 'fs';

const demoPath = process.env.CS2_DEMO_PATH ?? 'tests/fixtures/demo.dem';
const demoAvailable = fs.existsSync(demoPath);

describe.skipIf(!demoAvailable)('helper caching and player lookup', () => {
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

	test.each(['teams', 'playerControllers'] as const)('parser.%s returns identical instances across calls', key => {
		const a = reader[key];
		const b = reader[key];
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
		const players = reader.playerControllers.filter(p => p.team !== null);
		expect(players.length).toBeGreaterThan(0);
		for (const player of players) {
			const teamFromList = reader.teams.find(t => t.teamNumber === player.teamNumber);
			expect(teamFromList).toBeDefined();
			expect(player.team).toBe(teamFromList!);
		}
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

	test('every non-bot player resolves to a Player with matching steamId', () => {
		const nonBots = reader.players.filter(p => p?.steamid !== undefined && p?.steamid !== '0' && !p?.fakeplayer);
		expect(nonBots.length).toBeGreaterThan(0);
		for (const info of nonBots) {
			const player = reader.getPlayerByInfo(info);
			expect(player).not.toBeNull();
			expect(player!.steamId).toBe(String(info?.steamid));
		}
	});

	test('getPlayerByInfo(player.userInfo) round-trips to the cached player', () => {
		const controllers = reader.playerControllers.filter(pc => pc.userInfo);
		expect(controllers.length).toBeGreaterThan(0);
		for (const original of controllers) {
			expect(reader.getPlayerByInfo(original.userInfo)).toBe(original);
		}
	});
});
