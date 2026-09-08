import { describe, test, expect, beforeAll } from 'bun:test';
import fs from 'fs';
import { DemoReader, EntityMode } from '../../src/index.js';
import type { UserCommand } from '../../src/parser/entities/types.js';

const demoPath = process.env.CS2_DEMO_PATH ?? 'tests/fixtures/demo.dem';
const demoAvailable = fs.existsSync(demoPath);

const angDiff = (a: number, b: number) => {
	const d = Math.abs(a - b) % 360;
	return d > 180 ? 360 - d : d;
};

describe.skipIf(!demoAvailable)('usercommand reconstruction', () => {
	let total = 0;
	let full = 0;
	let delta = 0;
	let resolved = 0;
	let diagnostics: string[] = [];
	let sample: UserCommand | null = null;

	beforeAll(async () => {
		const reader = new DemoReader();
		diagnostics = [];
		reader.on('debug', message => {
			if (message.startsWith('usercommand:')) diagnostics.push(message);
		});
		reader.on('usercommand', command => {
			total++;
			if (command.isDelta) delta++;
			else full++;
			if (command.cmd) {
				resolved++;
				if (!sample && command.isDelta && command.cmd.base?.viewangles) sample = command;
			}
		});
		await reader.parseDemo(demoPath);
	});

	test('every command resolves to a decoded payload', () => {
		expect(total).toBeGreaterThan(0);
		expect(resolved).toBe(total);
		// The health report only fires when something failed.
		expect(diagnostics).toEqual([]);
	});

	test('full and delta commands are both accounted for', () => {
		expect(full + delta).toBe(total);
		expect(full).toBeGreaterThan(0);
	});

	test.skipIf(!demoAvailable)('a resolved delta carries real payload fields', () => {
		if (delta === 0) return; // demo predates delta-encoded user commands
		expect(sample).not.toBeNull();
		const base = sample!.cmd!.base!;
		expect(base.viewangles).toBeDefined();
		expect(Math.abs(base.viewangles!.x ?? 0)).toBeLessThanOrEqual(90.5);
		expect(Math.abs(base.viewangles!.y ?? 0)).toBeLessThanOrEqual(180.5);
		expect(sample!.deltaData).toBeInstanceOf(Uint8Array);
	});
});

/**
 * Cross-checks the reconstruction against a completely independent decode path:
 * the pawn's `m_angEyeAngles` from the entity bitstream.
 *
 * A command names the pawn it drives via `pawn_entity_handle`, so there is no
 * slot-mapping guesswork. When the player is not turning, the angle the server
 * publishes must be the angle the command carried — any error in the delta decode
 * shows up immediately here.
 */
describe.skipIf(!demoAvailable)('usercommand vs entity eye angles', () => {
	let still = { n: 0, exact: 0, sum: 0 };
	let control = { n: 0, far: 0 };

	beforeAll(async () => {
		const reader = new DemoReader();
		const WINDOW = 4;
		const recent = new Map<number, { x: number; y: number }[]>();
		const prevEye = new Map<number, { pitch: number; yaw: number }>();

		reader.on('usercommand', command => {
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
				still.n++;
				still.sum += distance;
				if (distance < 0.001) still.exact++;

				// Control: the same eye angle against a different pawn's commands.
				if (ids.length > 1) {
					const other = ids[(i + 1) % ids.length]!;
					control.n++;
					if (nearest(recent.get(other)!) >= 1) control.far++;
				}
			}
		});

		await reader.parseDemo(demoPath, { entities: EntityMode.ALL });
	});

	test('a stationary aim matches the reconstructed command exactly', () => {
		expect(still.n).toBeGreaterThan(1000);
		expect(still.exact / still.n).toBeGreaterThan(0.99);
		expect(still.sum / still.n).toBeLessThan(0.001);
	});

	test('the same comparison against the wrong pawn does not match', () => {
		expect(control.n).toBeGreaterThan(1000);
		// Near-total separation from the real pairing is what makes the match above
		// evidence rather than coincidence.
		expect(control.far / control.n).toBeGreaterThan(0.9);
	});
});
