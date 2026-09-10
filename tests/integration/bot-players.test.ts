import { beforeAll, describe, expect, test } from 'bun:test';
import { existsSync } from 'fs';
import { DemoReader, EntityMode, type Player } from '../../src/index.js';

const demoPath = process.env.CS2_BOT_DEMO_PATH ?? 'tests/fixtures/bot_gameplay.dem';

describe.skipIf(!existsSync(demoPath))('bot gameplay fixture', () => {
	const reader = new DemoReader();
	const scores = new Map<number, { kills: number; deaths: number; assists: number }>();
	let botRoles = 0;
	let unresolvedRoles = 0;
	let pawnMismatches = 0;
	let botShotMessages = 0;

	function score(player: Player) {
		const userId = player.userInfo?.userid;
		if (userId === undefined) throw new Error(`Missing userinfo for controller ${player.entityId}`);
		let result = scores.get(userId);
		if (!result) {
			result = { kills: 0, deaths: 0, assists: 0 };
			scores.set(userId, result);
		}
		return result;
	}

	beforeAll(async () => {
		for (const name of ['weapon_fire', 'player_hurt', 'player_death'] as const) {
			reader.gameEvents.on(name, (data: unknown) => {
				const event = data as Record<string, any>;
				for (const [role, annotation] of [
					['userid', 'player'],
					['attacker', 'attackerPlayer'],
					['assister', 'assisterPlayer']
				] as const) {
					const userId = event[role];
					if (typeof userId !== 'number' || (userId & 255) === 255) continue;
					const player = event[annotation] as Player | null;
					if (!player) {
						unresolvedRoles++;
						continue;
					}
					if (player.isBot) botRoles++;
					const pawnHandle = event[`${role}_pawn`];
					if (
						typeof pawnHandle === 'number' &&
						pawnHandle !== -1 &&
						reader.getPawn(pawnHandle & 0x7ff)?.controller?.entityId !== player.entityId
					)
						pawnMismatches++;
				}
				if (name !== 'player_death') return;
				if (event.player) score(event.player).deaths++;
				if (event.attackerPlayer && event.attackerPlayer !== event.player) score(event.attackerPlayer).kills++;
				if (event.assisterPlayer) score(event.assisterPlayer).assists++;
			});
		}
		reader.on('GE_FireBulletsId', shot => {
			if (shot.player === undefined) return;
			const player = reader.getPawn(shot.player & 0x7ff)?.controller;
			if (player?.isBot) botShotMessages++;
		});
		const end = await reader.parseDemo(demoPath, { entities: EntityMode.ALL });
		expect(end).toEqual({ status: 'complete' });
	}, 300000);

	test('bot and TV roster entries round-trip without matching Steam IDs', () => {
		const bots = reader.playerControllers.filter(player => player.isBot);
		const observers = reader.playerControllers.filter(player => player.isHLTV);
		expect(bots.length).toBeGreaterThan(0);
		expect(observers.length).toBeGreaterThan(0);
		for (const player of [...bots, ...observers]) {
			expect(reader.getPlayerByInfo(player.userInfo)).toBe(player);
			expect(player.userInfo!.steamid).not.toBe(player.steamId);
		}
	});

	test('all combat roles resolve, agree with the pawn, and include bots', () => {
		expect(botRoles).toBeGreaterThan(0);
		expect(unresolvedRoles).toBe(0);
		expect(pawnMismatches).toBe(0);
	});

	test('event kills, deaths and assists agree with final controller scores', () => {
		const players = reader.playerControllers.filter(player => !player.isHLTV && player.userInfo);
		expect(players.length).toBeGreaterThan(0);
		for (const player of players) {
			expect(scores.get(player.userInfo!.userid!)).toEqual({
				kills: player.kills,
				deaths: player.deaths,
				assists: player.assists
			});
		}
	});

	test('shot messages provide bot shooting data through the pawn-controller link', () => {
		expect(botShotMessages).toBeGreaterThan(0);
	});
});
