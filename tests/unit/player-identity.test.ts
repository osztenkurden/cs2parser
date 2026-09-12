import { describe, expect, test } from 'bun:test';
import { DemoReader } from '../../src/index.js';
import { annotateGameEvent } from '../../src/helpers/eventAnnotation.js';
import { parseStringTable } from '../../src/parser/stringtables.js';
import type { CMsgPlayerInfo } from '../../src/ts-proto/networkbasetypes.js';

function controller(reader: DemoReader, slot: number, steamId = 0n) {
	reader.entities[slot + 1] = {
		className: 'CCSPlayerController',
		classId: 1,
		entityType: 0,
		properties: {
			'CCSPlayerController.m_iszPlayerName': 'Same name',
			'CCSPlayerController.m_steamID': steamId,
			'CCSPlayerController.m_hPlayerPawn': 100 + slot
		}
	};
	return reader.getPlayer(slot + 1)!;
}

function userinfo(reader: DemoReader, event: 'createstringtable' | 'updatestringtable', players: CMsgPlayerInfo[]) {
	const table = parseStringTable(Buffer.alloc(0), 'userinfo', 0, false, 0, 0, false, [], reader._snappy);
	reader.emit(event, { ...table, players });
}

describe('player identity', () => {
	test('getPlayerByInfo returns null for missing info or identifiers', () => {
		const reader = new DemoReader();
		controller(reader, 0);
		for (const info of [null, undefined, {}]) expect(reader.getPlayerByInfo(info)).toBeNull();
	});

	test.each(['0', '90071996842377308'])('bots resolve with userinfo steamid %s and duplicate names', steamid => {
		const reader = new DemoReader();
		const first = controller(reader, 2);
		const second = controller(reader, 3);
		userinfo(reader, 'createstringtable', [
			{ userid: 1026, steamid, name: 'Same name', fakeplayer: true },
			{ userid: 771, steamid, name: 'Same name', fakeplayer: true }
		]);
		for (const player of [first, second]) {
			expect(player.userInfo).toBe(reader.players[player.userSlot]!);
			expect(reader.getPlayerByInfo({ ...player.userInfo })).toBe(player);
			expect(player.isBot).toBe(true);
			expect(player.isHLTV).toBe(false);
		}
		const event = annotateGameEvent(reader, 'player_death', { userid: 2, attacker: 3, assister: -1 });
		expect(event.player).toBe(first);
		expect(event.attackerPlayer).toBe(second);
		expect(event.assisterPlayer).toBeNull();
	});

	test('slot zero is a player, and TV is distinct from gameplay bots', () => {
		const reader = new DemoReader();
		const human = controller(reader, 0, 76561198277347755n);
		const tv = controller(reader, 1);
		userinfo(reader, 'createstringtable', [
			{ userid: 0, steamid: human.steamId },
			{ userid: 1, steamid: '90071996842377278', fakeplayer: true, ishltv: true }
		]);
		expect(reader.getPlayerBySlot(0)).toBe(human);
		expect(reader.getPlayerByInfo(human.userInfo)).toBe(human);
		expect(human.isBot).toBe(false);
		expect(human.isHLTV).toBe(false);
		expect(reader.getPlayerByInfo(tv.userInfo)).toBe(tv);
		expect(tv.isBot).toBe(false);
		expect(tv.isHLTV).toBe(true);
		expect(annotateGameEvent(reader, 'weapon_fire', { userid: 0 }).player).toBe(human);
	});

	test('account zero never resolves to a bot or TV controller', () => {
		const reader = new DemoReader();
		controller(reader, 0);
		controller(reader, 1);
		const human = controller(reader, 2, 76561198277347755n);
		expect(reader.getByAccountId(0)).toBeNull();
		expect(reader.getByAccountId(Number(76561198277347755n & 0xffffffffn))).toBe(human);
		expect(reader.getByAccountId(0)).toBeNull();
		expect(reader.getPlayerByInfo({ steamid: human.steamId })).toBe(human);
		expect(reader.getPlayerByInfo({ steamid: '0' })).toBeNull();
	});

	test('slot reuse rejects old full userIDs even when names and SteamIDs are identical', () => {
		const reader = new DemoReader();
		const player = controller(reader, 2);
		const oldInfo = { userid: 258, steamid: '0', name: 'Same name', fakeplayer: true };
		userinfo(reader, 'createstringtable', [oldInfo]);
		expect(reader.getPlayerByInfo(oldInfo)).toBe(player);
		const newInfo = { ...oldInfo, userid: 514 };
		userinfo(reader, 'updatestringtable', [newInfo]);
		expect(reader.getPlayerByInfo(oldInfo)).toBeNull();
		expect(reader.getPlayerByInfo(newInfo)).toBe(player);
		expect(player.userInfo).toBe(newInfo);
		expect(annotateGameEvent(reader, 'player_disconnect', { userid: 258 }).player).toBeNull();
		expect(annotateGameEvent(reader, 'weapon_fire', { userid: 514 }).player).toBe(player);
		reader.emit('entitydeleted', player.entityId);
		expect(reader.getPlayerBySlot(2)).toBeNull();
		expect(reader.getPlayerByInfo(newInfo)).toBeNull();
	});

	test('clearing string tables invalidates roster lookups until userinfo arrives again', () => {
		const reader = new DemoReader();
		const player = controller(reader, 2);
		const info = { userid: 258, fakeplayer: true };
		userinfo(reader, 'createstringtable', [info]);
		expect(reader.getPlayerByInfo(info)).toBe(player);
		reader.emit('clearallstringtables');
		expect(reader.players).toHaveLength(0);
		expect(player.userInfo).toBeNull();
		expect(player.isBot).toBe(false);
		expect(reader.getPlayerByInfo(info)).toBeNull();
		userinfo(reader, 'createstringtable', [info]);
		expect(reader.getPlayerByInfo(info)).toBe(player);
	});

	test.each(['createstringtable', 'updatestringtable'] as const)(
		'%s does not put invalid userinfo in slot zero',
		event => {
			const reader = new DemoReader();
			const info = { userid: 0, name: 'Human' };
			userinfo(reader, 'createstringtable', [info]);
			userinfo(reader, event, [{ name: 'Missing userid' }, { userid: -1 }, { userid: 255 }]);
			expect(reader.players).toEqual([info]);
		}
	);

	test.each([-1, -256, 255, 65535, NaN, 0.5, undefined])(
		'invalid event userid %s never aliases slot zero',
		userid => {
			const reader = new DemoReader();
			controller(reader, 0);
			expect(annotateGameEvent(reader, 'weapon_fire', { userid }).player).toBeNull();
		}
	);

	test('slot lookup rejects invalid slots and non-controller entities', () => {
		const reader = new DemoReader();
		controller(reader, 0);
		for (const slot of [-1, 255, 256, NaN, 0.5]) expect(reader.getPlayerBySlot(slot)).toBeNull();
		reader.entities[2] = { className: 'CCSPlayerPawn', classId: 2, entityType: 0, properties: {} };
		expect(reader.getPlayerBySlot(1)).toBeNull();
		expect(reader.getPlayerBySlot(3)).toBeNull();
	});

	test('annotations work before userinfo arrives', () => {
		const reader = new DemoReader();
		const player = controller(reader, 2);
		expect(player.userInfo).toBeNull();
		expect(annotateGameEvent(reader, 'weapon_fire', { userid: 2, userid_pawn: (8 << 11) | 102 }).player).toBe(
			player
		);
		expect(annotateGameEvent(reader, 'weapon_fire', { userid: 2, userid_pawn: -1 }).player).toBe(player);
	});

	test('delayed damage still resolves its attacker after the player changes pawn', () => {
		const reader = new DemoReader();
		const attacker = controller(reader, 2);
		const victim = controller(reader, 3);
		const event = annotateGameEvent(reader, 'player_hurt', {
			userid: 3,
			userid_pawn: 103,
			attacker: 2,
			attacker_pawn: (8 << 11) | 99
		});
		expect(attacker.pawnEntityId).toBe(102);
		expect(event.attackerPlayer).toBe(attacker);
		expect(event.player).toBe(victim);
	});
});

test('Steam ID conversion follows value changes, property replacement, and entity deletion', () => {
	const reader = new DemoReader();
	const player = controller(reader, 0, 9007199254740993n);
	expect(player.steamId).toBe('9007199254740993');
	expect(player.steamId).toBe('9007199254740993');
	const entity = player.entity!;
	Object.assign(entity.properties, { 'CCSPlayerController.m_steamID': 76561198277347755n });
	expect(player.steamId).toBe('76561198277347755');
	entity.properties = { 'CCSPlayerController.m_steamID': 0n };
	expect(player.steamId).toBe('0');
	entity.properties = {};
	expect(player.steamId).toBe('');
	entity.properties = { 'CCSPlayerController.m_steamID': 9007199254740993n };
	expect(player.steamId).toBe('9007199254740993');
	delete reader.entities[player.entityId];
	expect(player.steamId).toBe('');
});
