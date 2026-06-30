import { describe, test, expect, beforeAll } from 'bun:test';
import fs from 'fs';
import { DemoReader, EntityMode, decodeSmokeVoxelJournal } from '../../src/index.js';

const demoPath = process.env.CS2_DEMO_PATH ?? 'tests/fixtures/demo.dem';
const demoAvailable = fs.existsSync(demoPath);

const KEY = 'CSmokeGrenadeProjectile.m_VoxelFrameData';
const SIZE_KEY = 'CSmokeGrenadeProjectile.m_nVoxelFrameDataSize';

describe.skipIf(!demoAvailable)('smoke voxel journal (integration)', () => {
	// Largest journal captured per smoke entity.
	const best = new Map<number, { data: Uint8Array; size: number }>();

	beforeAll(async () => {
		const reader = new DemoReader();
		// Entity state lives in the Rust decoder — read m_VoxelFrameData as a blob via the
		// getter API (there is no `reader.entities[]` / `.properties` on this branch).
		reader.on('tickend', () => {
			for (const id of reader.findEntityIdsByClass('CSmokeGrenadeProjectile')) {
				// m_VoxelFrameData is a uint8 container (Uint8Array), read via the array getter.
				const data = reader.getArrayProp(id, KEY);
				const size = reader.getNumberProp(id, SIZE_KEY);
				if (!(data instanceof Uint8Array) || data.length === 0 || !size) continue;
				const cur = best.get(id);
				if (!cur || size > cur.size) best.set(id, { data: Uint8Array.from(data), size });
			}
		});
		await reader.parseDemo(demoPath, { entities: EntityMode.ALL, stream: false });
	});

	test('demo contains populated smoke voxel data', () => {
		expect(best.size).toBeGreaterThan(0);
	});

	test('every journal tiles exactly with monotonic frame sequence', () => {
		for (const [, { data, size }] of best) {
			const frames = decodeSmokeVoxelJournal(data, size);
			expect(frames.length).toBeGreaterThan(0);

			// Records tile the buffer up to `size` with no gap/overrun.
			let consumed = 0;
			for (const f of frames) consumed += 4 + f.payload.length;
			expect(consumed).toBe(size);

			// Frame sequence numbers are strictly increasing.
			for (let i = 1; i < frames.length; i++) {
				expect(frames[i]!.seq).toBeGreaterThan(frames[i - 1]!.seq);
			}
		}
	});

	test('journals start with a large initial frame then mostly heartbeats', () => {
		// Pick the richest journal.
		const [, richest] = [...best.entries()].sort((a, b) => b[1].size - a[1].size)[0]!;
		const frames = decodeSmokeVoxelJournal(richest.data, richest.size);
		// First frame carries the initial volume — far bigger than a heartbeat.
		expect(frames[0]!.payload.length).toBeGreaterThan(50);
		// Heartbeats dominate a settled smoke.
		const heartbeats = frames.filter(f => f.isHeartbeat).length;
		expect(heartbeats).toBeGreaterThan(0);
	});
});

describe.skipIf(!demoAvailable)('SmokeHelper (integration)', () => {
	// Capture the live SmokeHelper voxel readouts during parse (smokes are deleted
	// when they dissipate, so snapshot the first populated state per entity).
	const snaps: {
		count: number;
		firstWorld: { x: number; y: number; z: number };
		det: { x: number; y: number; z: number };
	}[] = [];
	const seen = new Set<number>();

	beforeAll(async () => {
		const reader = new DemoReader();
		reader.on('tickend', () => {
			for (const smoke of reader.smokes) {
				if (seen.has(smoke.entityId) || !smoke.hasVoxelData) continue;
				const voxels = smoke.voxels;
				const det = smoke.detonationPos;
				if (voxels.length === 0 || !det) continue;
				seen.add(smoke.entityId);
				snaps.push({ count: voxels.length, firstWorld: voxels[0]!, det });
			}
		});
		await reader.parseDemo(demoPath, { entities: EntityMode.ALL, stream: false });
	});

	test('parser.smokes yields helpers with decodable voxels', () => {
		expect(snaps.length).toBeGreaterThan(0);
		for (const s of snaps) expect(s.count).toBeGreaterThan(0);
	});

	test('world voxels sit within ~one grid extent of the detonation', () => {
		// Grid is 32 voxels × 20 units, centred on detonation → max ~320u per axis.
		for (const s of snaps) {
			expect(Math.abs(s.firstWorld.x - s.det.x)).toBeLessThan(330);
			expect(Math.abs(s.firstWorld.y - s.det.y)).toBeLessThan(330);
			expect(Math.abs(s.firstWorld.z - s.det.z)).toBeLessThan(330);
		}
	});
});
