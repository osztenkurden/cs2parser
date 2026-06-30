import { describe, test, expect, beforeAll } from 'bun:test';
import { DemoReader, EntityMode } from '../../src/index.js';
import fs from 'fs';

const demoPath = process.env.CS2_DEMO_PATH ?? 'tests/fixtures/demo.dem';
const demoAvailable = fs.existsSync(demoPath);

// Parse far enough in that several rounds are complete but the match is nowhere near over, so
// `m_perRoundStats` (pre-sized to the match's max round count and zero-filled) still has blank
// trailing slots — the exact condition the last-round fix has to cope with.
const CANCEL_TICK = 50000;

type RoundSlot = Record<string, number>;

// Mirrors Player._lastRoundStats's "is this slot populated?" predicate. A slot counts as played if
// any of these carry a value; this is what lets us skip the blank pre-allocated tail.
const POPULATED_FIELDS = [
	'm_iKills',
	'm_iDeaths',
	'm_iAssists',
	'm_iDamage',
	'm_iEquipmentValue',
	'm_iCashEarned',
	'm_iLiveTime',
	'm_iMoneySaved'
] as const;
const isPopulated = (s: RoundSlot | undefined): boolean => !!s && POPULATED_FIELDS.some(f => s[f]);
const isBlank = (s: RoundSlot | undefined): boolean => !isPopulated(s);
function lastPopulated(arr: ReadonlyArray<RoundSlot>): { idx: number; slot: RoundSlot } | undefined {
	for (let i = arr.length - 1; i >= 0; i--) {
		if (isPopulated(arr[i])) return { idx: i, slot: arr[i]! };
	}
	return undefined;
}

describe.skipIf(!demoAvailable)('last round stats', () => {
	let reader: DemoReader;

	beforeAll(async () => {
		reader = new DemoReader();
		reader.on('tickend', () => {
			if (reader.currentTick >= CANCEL_TICK) reader.cancel();
		});
		await reader.parseDemo(demoPath, { entities: EntityMode.ALL });
	});

	const playersWithStats = () =>
		reader.playerControllers.filter(p => p.name && (p.perRoundStats as ReadonlyArray<RoundSlot>).length > 0);

	test('several players have per-round stats by mid-game', () => {
		expect(playersWithStats().length).toBeGreaterThan(0);
	});

	// The core regression: before the fix `_lastRoundStats` returned arr[arr.length - 1], which at
	// this point in the match is a blank pre-allocated slot, so EVERY round_* getter read 0. If even
	// one player reports a non-zero round stat, the getter is reaching a real played round.
	test('at least one player reports a non-zero round stat (pre-fix the blank tail forced every round_* to 0)', () => {
		const anyReal = playersWithStats().some(p => p.round_kills > 0 || p.round_damage > 0 || p.round_liveTime > 0);
		expect(anyReal).toBe(true);
	});

	// Pin the fix down precisely: a player whose live round has real activity but whose array tail is
	// a blank slot. The getters must return the live round's real numbers, never the blank tail's 0s.
	test('round_* reflect the real last *played* round, not the blank trailing slot', () => {
		const candidate = playersWithStats().find(p => {
			const arr = p.perRoundStats as ReadonlyArray<RoundSlot>;
			const live = lastPopulated(arr);
			return (
				!!live &&
				live.idx < arr.length - 1 && // there ARE trailing slots after the live round…
				isBlank(arr[arr.length - 1]) && // …and the very last one is blank (the old return value)
				((live.slot.m_iKills ?? 0) > 0 || (live.slot.m_iDamage ?? 0) > 0)
			);
		});
		expect(candidate).toBeDefined();

		const arr = candidate!.perRoundStats as ReadonlyArray<RoundSlot>;
		const live = lastPopulated(arr)!;

		// New behaviour: the live round's real numbers.
		expect(candidate!.round_kills).toBe(live.slot.m_iKills ?? 0);
		expect(candidate!.round_damage).toBe(live.slot.m_iDamage ?? 0);
		expect(candidate!.round_kills > 0 || candidate!.round_damage > 0).toBe(true);

		// What the old arr[length - 1] code would have returned: an all-zero blank slot.
		const tail = arr[arr.length - 1]!;
		expect(isBlank(tail)).toBe(true);
		expect(tail.m_iKills ?? 0).toBe(0);
		expect(tail.m_iDamage ?? 0).toBe(0);
	});

	// Every round_* getter wires to the same slot _lastRoundStats picks — the last populated round,
	// or, for a player who has not played a round yet (all-blank array), 0 across the board.
	test('all round_* getters agree with the selected live round slot (or 0 when no round played)', () => {
		for (const p of playersWithStats()) {
			const arr = p.perRoundStats as ReadonlyArray<RoundSlot>;
			const s = lastPopulated(arr)?.slot;
			expect(p.round_kills).toBe(s?.m_iKills ?? 0);
			expect(p.round_deaths).toBe(s?.m_iDeaths ?? 0);
			expect(p.round_assists).toBe(s?.m_iAssists ?? 0);
			expect(p.round_damage).toBe(s?.m_iDamage ?? 0);
			expect(p.round_headshotKills).toBe(s?.m_iHeadShotKills ?? 0);
			expect(p.round_equipmentValue).toBe(s?.m_iEquipmentValue ?? 0);
			expect(p.round_cashEarned).toBe(s?.m_iCashEarned ?? 0);
			expect(p.round_utilityDamage).toBe(s?.m_iUtilityDamage ?? 0);
			expect(p.round_enemiesFlashed).toBe(s?.m_iEnemiesFlashed ?? 0);
			expect(p.round_liveTime).toBe(s?.m_iLiveTime ?? 0);
		}
	});
});
