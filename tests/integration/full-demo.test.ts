import { describe, test, expect, beforeAll } from 'bun:test';
import fs from 'fs';
import {
	DemoReader,
	EntityMode,
	TeamNumber,
	decodeSmokeVoxelJournal,
	decodeSmokeVoxelFrame,
	getSmokeVoxelStateAt
} from '../../src/index.js';
import type { UserCommand } from '../../src/parser/entities/types.js';

const demoPath = process.env.CS2_DEMO_PATH ?? 'tests/fixtures/demo.dem';
const demoAvailable = fs.existsSync(demoPath);

// Every check that needs a complete ALL-mode parse shares this one pass; a full parse of the
// fixture dominates suite time. Listeners only observe, so they cannot affect each other.
const ACTIVE = 'CCSPlayerPawn.CCSPlayer_WeaponServices.m_hActiveWeapon';
const VOXELS = 'CSmokeGrenadeProjectile.m_VoxelFrameData';
const VOXEL_SIZE = 'CSmokeGrenadeProjectile.m_nVoxelFrameDataSize';

const angDiff = (a: number, b: number) => {
	const d = Math.abs(a - b) % 360;
	return d > 180 ? 360 - d : d;
};

let reader: DemoReader;
let endCount = 0;
let tickStarts = 0;
const gameEventNames: string[] = [];

const inventory = { checked: 0, mismatches: [] as string[] };

const usercommands = {
	total: 0,
	full: 0,
	delta: 0,
	resolved: 0,
	diagnostics: [] as string[],
	sample: null as UserCommand | null,
	still: { n: 0, exact: 0, sum: 0 },
	control: { n: 0, far: 0 }
};

// Entity slots are reused; key by entity object to retain each lifetime.
const journals = new Map<object, { data: Uint8Array; size: number }>();
// Smokes disappear, so capture the first populated live helper state per entity.
const smokes: {
	count: number;
	firstWorld: { x: number; y: number; z: number };
	det: { x: number; y: number; z: number };
}[] = [];

function observeLifecycle(reader: DemoReader) {
	reader.on('tickstart', () => tickStarts++);
	reader.on('end', () => endCount++);
	for (const name of ['round_end', 'player_death', 'round_start'] as const) {
		reader.gameEvents.once(name, () => gameEventNames.push(name));
	}
}

// Regression: the WASM entity fast path skipped lifecycle notifications, so the equipment
// tracker never saw weapon switches or ownership changes and Player.inventory went stale.
// Comparing on every switch catches a missed one; the periodic sample catches drift in between.
function observeInventory(reader: DemoReader) {
	const lastHandle = new Map<number, number>();
	reader.on('tickend', tick => {
		const periodic = tick % 64 === 0;
		for (const player of reader.playerControllers) {
			const handle = (player.pawn?.entity?.properties as Record<string, unknown> | undefined)?.[ACTIVE];
			if (typeof handle !== 'number') continue;
			const switched = lastHandle.get(player.entityId) !== handle;
			lastHandle.set(player.entityId, handle);
			if (!switched && !periodic) continue;
			const items = player.inventory;
			// Only compare when the active handle is one of the owned items the tracker resolved.
			if (!items || !items.items.some(item => item.handle === handle >>> 0)) continue;
			inventory.checked++;
			if (items.activeItem?.handle !== handle >>> 0 && inventory.mismatches.length < 5)
				inventory.mismatches.push(
					`${tick} ${player.name}: ${items.activeItem?.className} vs ${handle & 0x3fff}`
				);
		}
	});
}

function observeUserCommands(reader: DemoReader) {
	const u = usercommands;
	reader.on('debug', message => {
		if (message.startsWith('usercommand:')) u.diagnostics.push(message);
	});
	const WINDOW = 4;
	const recent = new Map<number, { x: number; y: number }[]>();
	const prevEye = new Map<number, { pitch: number; yaw: number }>();
	reader.on('usercommand', command => {
		u.total++;
		if (command.isDelta) u.delta++;
		else u.full++;
		if (command.cmd) {
			u.resolved++;
			if (!u.sample && command.isDelta && command.cmd.base?.viewangles) u.sample = command;
		}
		const base = command.cmd?.base;
		const handle = base?.pawn_entity_handle;
		if (!base?.viewangles || handle === undefined || handle === 0x00ffffff) return;
		const entityId = handle & 0x7ff;
		let list = recent.get(entityId);
		if (!list) recent.set(entityId, (list = []));
		list.push({ x: base.viewangles.x ?? 0, y: base.viewangles.y ?? 0 });
		if (list.length > WINDOW) list.shift();
	});
	reader.on('tickend', () => {
		const rules = reader.gameRules;
		if (!rules || rules.isWarmup || rules.isFreezePeriod) return;
		const ids = [...recent.keys()].filter(id => (recent.get(id)?.length ?? 0) >= WINDOW);
		for (let i = 0; i < ids.length; i++) {
			const entityId = ids[i]!;
			const pawn = reader.getPawn(entityId);
			if (!pawn?.isAlive) continue;
			const eye = pawn.eyeAngles;
			const previous = prevEye.get(entityId);
			prevEye.set(entityId, { ...eye });
			if (!previous) continue;
			const nearest = (list: { x: number; y: number }[]) => {
				let min = Infinity;
				for (const a of list) min = Math.min(min, Math.max(angDiff(a.x, eye.pitch), angDiff(a.y, eye.yaw)));
				return min;
			};
			// Only score ticks where the pawn did not turn: otherwise the command
			// and the entity snapshot legitimately describe different instants.
			const turned = Math.max(angDiff(previous.pitch, eye.pitch), angDiff(previous.yaw, eye.yaw));
			if (turned !== 0) continue;
			const distance = nearest(recent.get(entityId)!);
			u.still.n++;
			u.still.sum += distance;
			if (distance < 0.001) u.still.exact++;
			// Control: the same eye angle against a different pawn's commands.
			if (ids.length > 1) {
				const other = ids[(i + 1) % ids.length]!;
				u.control.n++;
				if (nearest(recent.get(other)!) >= 1) u.control.far++;
			}
		}
	});
}

function observeSmokes(reader: DemoReader) {
	const seen = new Set<number>();
	reader.on('tickend', () => {
		for (let i = 0; i < reader.entities.length; i++) {
			const e = reader.entities[i];
			if (!e || e.className !== 'CSmokeGrenadeProjectile') continue;
			const p = e.properties as Record<string, unknown>;
			const data = p[VOXELS];
			const size = p[VOXEL_SIZE] as number | undefined;
			if (!(data instanceof Uint8Array) || data.length === 0 || !size) continue;
			const cur = journals.get(e);
			if (!cur || size > cur.size) journals.set(e, { data: data.slice(), size });
		}
		for (const smoke of reader.smokes) {
			if (seen.has(smoke.entityId) || !smoke.hasVoxelData) continue;
			const voxels = smoke.seeds;
			const det = smoke.detonationPos;
			if (voxels.length === 0 || !det) continue;
			seen.add(smoke.entityId);
			smokes.push({ count: voxels.length, firstWorld: voxels[0]!, det });
		}
	});
}

describe.skipIf(!demoAvailable)('full ALL-mode demo parse', () => {
	beforeAll(async () => {
		reader = new DemoReader();
		observeLifecycle(reader);
		observeInventory(reader);
		observeUserCommands(reader);
		observeSmokes(reader);
		expect(await reader.parseDemo(demoPath, { entities: EntityMode.ALL })).toEqual({ status: 'complete' });
		expect(reader.header).not.toBeNull();
	});

	describe('lifecycle and helpers', () => {
		test('player controllers and game rules are available', () => {
			expect(reader.playerControllers.length).toBeGreaterThan(0);
			expect(reader.gameRules).not.toBeNull();
		});

		test('teams are indexed by teamNumber', () => {
			const ts = reader.teams[TeamNumber.Terrorists];
			const ct = reader.teams[TeamNumber.CounterTerrorists];
			expect(ts!.teamNumber).toBe(TeamNumber.Terrorists);
			expect(ct!.teamNumber).toBe(TeamNumber.CounterTerrorists);
			reader.teams.forEach((team, index) => {
				if (team) expect(team.teamNumber).toBe(index as TeamNumber);
			});
		});

		test('tickstart events and exactly one end event are emitted', () => {
			expect(tickStarts).toBeGreaterThan(0);
			expect(endCount).toBe(1);
		});

		test.each(['player_death', 'round_start', 'round_end'])(
			'named %s once subscription fires exactly once',
			name => {
				expect(gameEventNames.filter(event => event === name)).toHaveLength(1);
			}
		);
	});

	describe('Player.inventory.activeItem', () => {
		test('follows m_hActiveWeapon across switches', () => {
			expect(inventory.checked).toBeGreaterThan(1000);
			expect(inventory.mismatches).toEqual([]);
		});
	});

	describe('usercommand reconstruction', () => {
		const u = usercommands;

		test('every command resolves to a decoded payload', () => {
			expect(u.total).toBeGreaterThan(0);
			expect(u.resolved).toBe(u.total);
			// The health report only fires when something failed.
			expect(u.diagnostics).toEqual([]);
		});

		test('full and delta commands are both accounted for', () => {
			expect(u.full + u.delta).toBe(u.total);
			expect(u.full).toBeGreaterThan(0);
		});

		test('a resolved delta carries real payload fields', () => {
			if (u.delta === 0) return; // demo predates delta-encoded user commands
			const base = u.sample!.cmd!.base!;
			expect(Math.abs(base.viewangles!.x ?? 0)).toBeLessThanOrEqual(90.5);
			expect(Math.abs(base.viewangles!.y ?? 0)).toBeLessThanOrEqual(180.5);
			expect(u.sample!.deltaData).toBeInstanceOf(Uint8Array);
		});

		test('a stationary aim matches the reconstructed command exactly', () => {
			expect(u.still.n).toBeGreaterThan(1000);
			expect(u.still.exact / u.still.n).toBeGreaterThan(0.99);
			expect(u.still.sum / u.still.n).toBeLessThan(0.001);
		});

		test('the same comparison against the wrong pawn does not match', () => {
			expect(u.control.n).toBeGreaterThan(1000);
			// Near-total separation from the real pairing is what makes the match above
			// evidence rather than coincidence.
			expect(u.control.far / u.control.n).toBeGreaterThan(0.9);
		});
	});

	describe('smoke voxel journal and SmokeHelper', () => {
		test('demo contains populated smoke voxel data', () => {
			expect(journals.size).toBeGreaterThan(0);
		});

		test('every journal tiles exactly with monotonic frame sequence', () => {
			for (const { data, size } of journals.values()) {
				const frames = decodeSmokeVoxelJournal(data, size);
				expect(frames.length).toBeGreaterThan(0);
				// Records tile the buffer up to `size` with no gap/overrun.
				let consumed = 0;
				for (const f of frames) consumed += 4 + f.payload.length;
				expect(consumed).toBe(size);
				for (let i = 1; i < frames.length; i++) expect(frames[i]!.seq).toBeGreaterThan(frames[i - 1]!.seq);
			}
		});

		test('journals start with a large initial frame then mostly heartbeats', () => {
			const richest = [...journals.values()].sort((a, b) => b.size - a.size)[0]!;
			const frames = decodeSmokeVoxelJournal(richest.data, richest.size);
			// First frame carries the initial volume — far bigger than a heartbeat.
			expect(frames[0]!.payload.length).toBeGreaterThan(50);
			expect(frames.filter(f => f.isHeartbeat).length).toBeGreaterThan(0);
		});

		test('all real frames decode fully and rejection updates accumulate', () => {
			let updates = 0;
			for (const { data, size } of journals.values()) {
				const frames = decodeSmokeVoxelJournal(data, size);
				const expected = new BigUint64Array(512);
				for (const frame of frames) {
					for (const { index, mask } of decodeSmokeVoxelFrame(frame.payload).blockedUpdates) {
						expected[index] = mask;
						updates++;
					}
				}
				expect(getSmokeVoxelStateAt(frames)!.blockedMask).toEqual(expected);
			}
			expect(updates).toBeGreaterThan(0);
		});

		test('world voxels from parser.smokes sit within ~one grid extent of the detonation', () => {
			expect(smokes.length).toBeGreaterThan(0);
			// Grid is 32 voxels × 20 units, centred on detonation → max ~320u per axis.
			for (const s of smokes) {
				expect(s.count).toBeGreaterThan(0);
				expect(Math.abs(s.firstWorld.x - s.det.x)).toBeLessThan(330);
				expect(Math.abs(s.firstWorld.y - s.det.y)).toBeLessThan(330);
				expect(Math.abs(s.firstWorld.z - s.det.z)).toBeLessThan(330);
			}
		});
	});
});
