import { describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { SmokeDensitySimulation } from '../../src/helpers/smokeDensity.js';
import { decodeSmokeVoxelJournal } from '../../src/helpers/smokeVoxel.js';
import voxelFixtures from '../fixtures/smoke-voxels.json';
import densityFixtures from '../fixtures/smoke-density.json';

const hash = (values: Float32Array) =>
	createHash('sha256')
		.update(new Uint8Array(values.buffer, values.byteOffset, values.byteLength))
		.digest('hex');
const initial = decodeSmokeVoxelJournal(Buffer.from(voxelFixtures.cases[0]!.journalBase64, 'base64'))[0]!;

describe('experimental smoke density simulation', () => {
	for (const fixture of densityFixtures.cases) {
		test(`every cell and frame matches native: ${fixture.name}`, () => {
			const source = fixture.voxelFixture === undefined ? fixture : voxelFixtures.cases[fixture.voxelFixture]!;
			const simulation = new SmokeDensitySimulation(source.origin as [number, number, number]);
			const frames = decodeSmokeVoxelJournal(Buffer.from(source.journalBase64!, 'base64'));
			expect(frames.length).toBe(fixture.frames.length);
			for (const frame of frames) {
				simulation.step(frame);
				const snapshot = simulation.snapshot();
				expect(snapshot.seq).toBe(frame.seq);
				expect(hash(snapshot.density)).toBe(fixture.frames[frame.seq]!.densitySha256);
				// Internal float4 parity also guards direction changes that affect later steps.
				const cells = (simulation as unknown as { current: Float32Array }).current;
				expect(hash(cells)).toBe(fixture.frames[frame.seq]!.cellsSha256);
			}
		});
	}
	test('snapshots own their storage and simulations are independent', () => {
		const a = new SmokeDensitySimulation([0, 0, 0]),
			b = new SmokeDensitySimulation([0, 0, 0]);
		expect(a.snapshot().seq).toBe(-1);
		expect(a.snapshot().density.every(v => v === 0)).toBe(true);
		a.step(initial);
		b.step(initial);
		const snapshot = a.snapshot(),
			expected = hash(snapshot.density);
		a.step({ seq: 1, isHeartbeat: false, payload: new Uint8Array([0, 0, 0]) });
		expect(hash(snapshot.density)).toBe(expected);
		snapshot.density.fill(999);
		expect(hash(b.snapshot().density)).toBe(expected);
		expect(hash(a.snapshot().density)).not.toBe(hash(snapshot.density));
	});
	test('invalid or unsupported input fails before changing state', () => {
		const simulation = new SmokeDensitySimulation([0, 0, 0]);
		simulation.step(initial);
		const before = hash(simulation.snapshot().density);
		const nonfiniteSeed = new Uint8Array([0, 1, 1, 16, 16, 16, 5, 0, 0, 128, 127, 0]);
		for (const frame of [
			initial,
			{ seq: 2, isHeartbeat: false, payload: new Uint8Array([0, 0, 0]) },
			{ seq: 1, isHeartbeat: false, payload: new Uint8Array([0, 0]) },
			{ seq: 1, isHeartbeat: false, payload: nonfiniteSeed },
			{ seq: 1, isHeartbeat: false, payload: new Uint8Array([0, 0, 1, ...Array(20).fill(0)]) }
		]) {
			expect(() => simulation.step(frame)).toThrow(RangeError);
			expect(simulation.seq).toBe(0);
			expect(hash(simulation.snapshot().density)).toBe(before);
		}
		simulation.step({ seq: 1, isHeartbeat: false, payload: new Uint8Array([0, 0, 0]) });
		expect(simulation.seq).toBe(1);
	});
	test('rejects unusable origins', () => {
		for (const x of [Infinity, NaN, Number.MAX_VALUE])
			expect(() => new SmokeDensitySimulation([x, 0, 0])).toThrow(RangeError);
	});
});
