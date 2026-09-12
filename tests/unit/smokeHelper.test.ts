import { expect, test, spyOn } from 'bun:test';
import {
	DemoReader,
	SmokeHelper,
	SmokeDensitySimulation,
	decodeSmokeVoxelJournal,
	mortonDecode3,
	voxelToWorld
} from '../../src/index.js';
import fixtures from '../fixtures/smoke-voxels.json';
const fixture = fixtures.cases[0]!;
const bytes = Buffer.from(fixture.journalBase64, 'base64');
const frames = decodeSmokeVoxelJournal(bytes);
const end = (count: number) => frames.slice(0, count).reduce((n, f) => n + 4 + f.payload.length, 0);
function setup(count = 1) {
	const reader = new DemoReader();
	const properties = {
		'CSmokeGrenadeProjectile.m_VoxelFrameData': new Uint8Array(bytes),
		'CSmokeGrenadeProjectile.m_nVoxelFrameDataSize': end(count),
		'CSmokeGrenadeProjectile.m_vSmokeDetonationPos': [...fixture.origin],
		'CSmokeGrenadeProjectile.m_nSmokeEffectTickBegin': 123
	};
	reader.entities[1] = { className: 'CSmokeGrenadeProjectile', properties } as unknown as NonNullable<
		(typeof reader.entities)[1]
	>;
	return { reader, properties, smoke: reader.getSmoke(1)! };
}
const sizeKey = 'CSmokeGrenadeProjectile.m_nVoxelFrameDataSize';
test('seeds and listing helpers never simulate; density reads advance only appended frames', () => {
	const spy = spyOn(SmokeDensitySimulation.prototype, 'step');
	try {
		const { reader, properties, smoke } = setup();
		expect(reader.smokes[0]).toBe(smoke);
		expect(smoke.seeds.length).toBeGreaterThan(0);
		expect(smoke.gridVoxels.length).toBe(smoke.seeds.length);
		expect(spy).toHaveBeenCalledTimes(0);
		const first = smoke.voxels;
		expect(first.every(v => v.density > 5)).toBe(true);
		expect(spy).toHaveBeenCalledTimes(1);
		expect(smoke.voxelCount).toBe(first.length);
		expect(smoke.voxels).toEqual(first);
		expect(spy).toHaveBeenCalledTimes(1);
		(first[0] as { x: number }).x = Infinity;
		expect(smoke.voxels[0]!.x).not.toBe(Infinity);
		reader.smokeDensityThreshold = 30;
		expect(smoke.voxels.every(v => v.density > 30)).toBe(true);
		expect(spy).toHaveBeenCalledTimes(1);
		expect(smoke.getVoxels(0).length).toBeGreaterThanOrEqual(smoke.voxels.length);
		properties[sizeKey] = end(3);
		smoke.voxels;
		expect(spy).toHaveBeenCalledTimes(3);
	} finally {
		spy.mockRestore();
	}
});
test('helper positions and density match the independently verified simulation', () => {
	const { smoke } = setup(frames.length);
	const simulation = new SmokeDensitySimulation(fixture.origin as [number, number, number]);
	for (const frame of frames) simulation.step(frame);
	const density = simulation.snapshot().density;
	const expected = [];
	for (let i = 0; i < density.length; i++)
		if (density[i]! > 5) {
			const [x, y, z] = voxelToWorld(...mortonDecode3(i), fixture.origin as [number, number, number]);
			expected.push({ x, y, z, density: density[i]! });
		}
	expect(smoke.voxels).toEqual(expected);
});
test('rewinds, in-place replacement, and reused entity slots rebuild density', () => {
	const { reader, smoke, properties } = setup(3);
	smoke.voxels;
	properties[sizeKey] = end(1);
	expect(smoke.voxels).toEqual(setup().smoke.voxels);
	properties['CSmokeGrenadeProjectile.m_VoxelFrameData'] = Buffer.from(bytes);
	smoke.voxels;
	properties['CSmokeGrenadeProjectile.m_VoxelFrameData'][4] = 1; // Stop-seeding flag in frame zero.
	const fresh = new SmokeHelper(reader, 1);
	expect(smoke.voxels).toEqual(fresh.voxels);
	const other = setup(2);
	reader.entities[1] = other.reader.entities[1]!;
	expect(smoke.voxels).toEqual(other.smoke.voxels);
	properties[sizeKey] = 0;
	reader.entities[1] = { className: 'CSmokeGrenadeProjectile', properties } as unknown as NonNullable<
		(typeof reader.entities)[1]
	>;
	expect(smoke.voxels).toEqual([]);
});
test('failed appends cannot poison the cache; a corrected journal can be retried', () => {
	const { smoke, properties } = setup();
	const first = smoke.voxels;
	properties[sizeKey] = end(2) - 1;
	expect(() => smoke.voxels).toThrow(RangeError);
	properties[sizeKey] = end(1);
	expect(smoke.voxels).toEqual(first);
	properties[sizeKey] = end(2);
	expect(smoke.voxels).toEqual(setup(2).smoke.voxels);
});
test('threshold validation and absent data', () => {
	const { reader, smoke } = setup();
	expect(reader.smokeDensityThreshold).toBe(5);
	for (const value of [-1, NaN, Infinity]) {
		expect(() => {
			reader.smokeDensityThreshold = value;
		}).toThrow(RangeError);
		expect(() => smoke.getVoxels(value)).toThrow(RangeError);
	}
	expect(reader.smokeDensityThreshold).toBe(5);
	expect(new SmokeHelper(reader, 100).voxels).toEqual([]);
});
