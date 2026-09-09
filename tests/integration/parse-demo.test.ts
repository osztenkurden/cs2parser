import { describe, test, expect, beforeAll } from 'bun:test';
import { DemoReader, EntityMode, TeamNumber } from '../../src/index.js';
import fs from 'fs';

const demoPath = process.env.CS2_DEMO_PATH ?? 'tests/fixtures/demo.dem';
const demoAvailable = fs.existsSync(demoPath);

describe.skipIf(!demoAvailable)('parse demo (full integration)', () => {
	let reader: DemoReader;
	let endCount = 0;
	let tickStarts = 0;
	const gameEventNames: string[] = [];

	beforeAll(async () => {
		reader = new DemoReader();
		reader.on('tickstart', () => tickStarts++);
		reader.on('end', () => endCount++);
		for (const name of ['round_end', 'player_death', 'round_start'] as const) {
			reader.gameEvents.once(name, () => gameEventNames.push(name));
		}
		expect(await reader.parseDemo(demoPath, { entities: EntityMode.ALL })).toEqual({ incomplete: false });
		expect(reader.header).not.toBeNull();
	});

	test('player controllers are available', () => {
		expect(reader.playerControllers.length).toBeGreaterThan(0);
	});

	test('teams are indexed by teamNumber', () => {
		const ts = reader.teams[TeamNumber.Terrorists];
		const ct = reader.teams[TeamNumber.CounterTerrorists];
		expect(ts).toBeDefined();
		expect(ct).toBeDefined();
		expect(ts!.teamNumber).toBe(TeamNumber.Terrorists);
		expect(ct!.teamNumber).toBe(TeamNumber.CounterTerrorists);
		reader.teams.forEach((team, index) => {
			if (team) expect(team.teamNumber).toBe(index as TeamNumber);
		});
	});

	test('game rules are available', () => {
		expect(reader.gameRules).not.toBeNull();
	});

	test('tickstart events and exactly one end event are emitted', () => {
		expect(tickStarts).toBeGreaterThan(0);
		expect(endCount).toBe(1);
	});

	test.each(['player_death', 'round_start', 'round_end'])('named %s subscription fires exactly once', name => {
		expect(gameEventNames.filter(event => event === name)).toHaveLength(1);
	});
});
