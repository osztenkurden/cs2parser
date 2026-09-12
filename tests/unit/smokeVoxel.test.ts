import { describe, test, expect } from 'bun:test';
import {
	decodeSmokeVoxelJournal,
	decodeSmokeVoxelFrame,
	getSmokeVoxelStateAt,
	countSmokeDisturbanceFrames,
	decodeVoxelFrameOccupancy,
	getSmokeOccupancyAt,
	voxelToWorld,
	mortonEncode3,
	mortonDecode3,
	VOXEL_GRID_DIM
} from '../../src/helpers/smokeVoxel.js';

/** Build a journal blob from [seq, payload] records. */
function makeJournal(records: Array<[number, number[]]>): Uint8Array {
	const out: number[] = [];
	for (const [seq, payload] of records) {
		out.push(seq & 0xff, (seq >> 8) & 0xff);
		out.push(payload.length & 0xff, (payload.length >> 8) & 0xff);
		out.push(...payload);
	}
	return new Uint8Array(out);
}

describe('decodeSmokeVoxelJournal', () => {
	test('splits records and reads little-endian seq/len', () => {
		const data = makeJournal([
			[0, [1, 2, 3, 4, 5]],
			[1, [0, 0, 0]],
			[2, [9]]
		]);
		const frames = decodeSmokeVoxelJournal(data);
		expect(frames.map(f => f.seq)).toEqual([0, 1, 2]);
		expect([...frames[0]!.payload]).toEqual([1, 2, 3, 4, 5]);
		expect([...frames[2]!.payload]).toEqual([9]);
	});

	test('flags the 3-byte all-zero heartbeat', () => {
		const data = makeJournal([
			[0, [7, 7, 7, 7]],
			[1, [0, 0, 0]],
			[2, [0, 0, 0, 0]] // 4 bytes → not a heartbeat
		]);
		const frames = decodeSmokeVoxelJournal(data);
		expect(frames.map(f => f.isHeartbeat)).toEqual([false, true, false]);
		expect(countSmokeDisturbanceFrames(data)).toBe(2);
	});

	test('honours m_nVoxelFrameDataSize (ignores trailing capacity)', () => {
		const real = makeJournal([
			[0, [1, 2, 3]],
			[1, [0, 0, 0]]
		]);
		const padded = new Uint8Array(64);
		padded.set(real);
		const frames = decodeSmokeVoxelJournal(padded, real.length);
		expect(frames).toHaveLength(2);
	});

	test('throws on a payload length that overruns the valid size', () => {
		// seq=0, len=100, but only a couple payload bytes present
		const data = new Uint8Array([0, 0, 100, 0, 1, 2]);
		expect(() => decodeSmokeVoxelJournal(data)).toThrow(RangeError);
	});

	test('empty buffer yields no frames; incomplete headers throw', () => {
		expect(decodeSmokeVoxelJournal(new Uint8Array(0))).toEqual([]);
		expect(() => decodeSmokeVoxelJournal(new Uint8Array([1, 0]))).toThrow(RangeError);
	});
});

describe('decodeVoxelFrameOccupancy', () => {
	// payload = [activeFlag, sectionFlags, count, count×(x,y,z,s0..s4)]
	const occPayload = (entries: Array<[number, number, number]>, flags = 0x01) => {
		const out = [0x00, flags, entries.length];
		for (const [x, y, z] of entries) out.push(x, y, z, 5, 0, 0, 0, 0);
		out.push(0);
		return new Uint8Array(out);
	};

	test('decodes x,y,z entries in order', () => {
		const v = decodeVoxelFrameOccupancy(
			occPayload([
				[14, 18, 16],
				[16, 18, 16]
			])
		);
		expect(v).not.toBeNull();
		expect(v!).toHaveLength(2);
		expect(v![0]).toMatchObject({ x: 14, y: 18, z: 16 });
		expect([...v![0]!.state]).toEqual([5, 0, 0, 0, 0]);
	});

	test('returns null when occupancy bit not set (heartbeat / ext-only)', () => {
		expect(decodeVoxelFrameOccupancy(new Uint8Array([0, 0, 0]))).toBeNull();
		expect(decodeVoxelFrameOccupancy(occPayload([[1, 2, 3]], 0x02))).toBeNull();
	});

	test('getSmokeOccupancyAt picks the latest occupancy frame ≤ target', () => {
		const frames = [
			{ seq: 0, payload: occPayload([[1, 1, 1]]), isHeartbeat: false },
			{ seq: 1, payload: new Uint8Array([0, 0, 0]), isHeartbeat: true },
			{
				seq: 2,
				payload: occPayload([
					[9, 9, 9],
					[8, 8, 8]
				]),
				isHeartbeat: false
			}
		];
		expect(getSmokeOccupancyAt(frames, 1)!.seq).toBe(0);
		expect(getSmokeOccupancyAt(frames)!.voxels).toHaveLength(2);
	});

	test('voxelToWorld returns cell centres with positive world axes', () => {
		expect(voxelToWorld(16, 16, 16, [100, 200, 50])).toEqual([110, 210, 60]);
		// Native grid-to-world adds half a cell (10 units) on every axis.
		expect(voxelToWorld(17, 16, 16, [100, 200, 50])).toEqual([130, 210, 60]);
		expect(voxelToWorld(16, 17, 16, [100, 200, 50])).toEqual([110, 230, 60]);
		expect(voxelToWorld(16, 16, 17, [100, 200, 50])).toEqual([110, 210, 80]);
	});
});

describe('morton 3D grid mapping', () => {
	test('round-trips every coordinate in the 32³ grid', () => {
		for (let x = 0; x < VOXEL_GRID_DIM; x++) {
			for (let y = 0; y < VOXEL_GRID_DIM; y++) {
				for (let z = 0; z < VOXEL_GRID_DIM; z++) {
					const idx = mortonEncode3(x, y, z);
					expect(mortonDecode3(idx)).toEqual([x, y, z]);
				}
			}
		}
	});

	test('matches the client interleave (x = least-significant axis)', () => {
		// x occupies bits 0,3,6…; y bits 1,4,7…; z bits 2,5,8…
		expect(mortonEncode3(0, 0, 1)).toBe(0b100);
		expect(mortonEncode3(0, 1, 0)).toBe(0b010);
		expect(mortonEncode3(1, 0, 0)).toBe(0b001);
		expect(mortonEncode3(1, 1, 1)).toBe(0b111);
	});

	test('indices stay within the 32³ range', () => {
		expect(mortonEncode3(31, 31, 31)).toBe(32 * 32 * 32 - 1);
	});
});

import { createHash } from 'node:crypto';
import nativeFixture from '../fixtures/smoke-voxels.json';

describe('native smoke decoder reference', () => {
	test('all 32³ Morton indices match executed native lookup instructions', () => {
		const bytes = Buffer.alloc(32768 * 4);
		let offset = 0;
		for (let x = 0; x < 32; x++)
			for (let y = 0; y < 32; y++)
				for (let z = 0; z < 32; z++) {
					bytes.writeUInt32LE(mortonEncode3(x, y, z), offset);
					offset += 4;
				}
		expect(createHash('sha256').update(bytes).digest('hex')).toBe(nativeFixture.mortonGridSha256);
	});
	for (const fixture of nativeFixture.cases) {
		test(`${fixture.map}: real journal matches native seed positions and accumulated rejection mask`, () => {
			const frames = decodeSmokeVoxelJournal(Buffer.from(fixture.journalBase64, 'base64'));
			for (const reference of fixture.expected) {
				const state = getSmokeVoxelStateAt(frames, reference.seq)!;
				const rawSeeds = Buffer.from(reference.seedsHex, 'hex');
				expect(state.seq).toBe(reference.seq);
				expect(state.seeds).toHaveLength(rawSeeds.length / 8);
				expect(state.stopSeeding).toBe(reference.stopSeeding);
				expect(Buffer.concat(state.extraRecords).toString('hex')).toBe(reference.extraHex);
				// Serialize words explicitly as little-endian, independent of host endianness.
				const mask = Buffer.alloc(4096);
				state.blockedMask.forEach((word, i) => mask.writeBigUInt64LE(word, i * 8));
				expect(createHash('sha256').update(mask).digest('hex')).toBe(reference.blockedSha256);
				state.seeds.forEach((seed, i) => {
					expect([seed.x, seed.y, seed.z, ...seed.state]).toEqual([...rawSeeds.subarray(i * 8, i * 8 + 8)]);
					const world = voxelToWorld(seed.x, seed.y, seed.z, fixture.origin as [number, number, number]);
					world.forEach((coordinate, axis) =>
						expect(coordinate).toBeCloseTo(reference.worldCentres[i]![axis]!, 3)
					);
				});
			}
		});
	}

	test('rejects invalid valid sizes and every truncated prefix of a real frame', () => {
		const bytes = Buffer.from(nativeFixture.cases[0]!.journalBase64, 'base64');
		for (const size of [-1, 0.5, NaN, Infinity, bytes.length + 1]) {
			expect(() => decodeSmokeVoxelJournal(bytes, size)).toThrow(RangeError);
		}
		const payload = decodeSmokeVoxelJournal(bytes)[0]!.payload;
		for (let size = 0; size < payload.length; size++) {
			expect(() => decodeSmokeVoxelFrame(payload.subarray(0, size))).toThrow(RangeError);
		}
		expect(() => decodeVoxelFrameOccupancy(new Uint8Array([0, 1, 1, 16, 16, 16]))).toThrow(RangeError);
		expect(() => decodeVoxelFrameOccupancy(new Uint8Array([0, 1, 1, 32, 16, 16, 5, 0, 0, 0, 0]))).toThrow(
			RangeError
		);
	});

	test('replaces mask words, including zero, preserves untouched words and unsigned bit 63', () => {
		const payload = (updates: [number, bigint][]) => {
			const bytes = Buffer.alloc(5 + updates.length * 10);
			bytes[1] = 2;
			bytes.writeUInt16LE(updates.length, 2);
			updates.forEach(([index, word], i) => {
				bytes.writeUInt16LE(index, 4 + i * 10);
				bytes.writeBigUInt64LE(word, 6 + i * 10);
			});
			return bytes;
		};
		const frames = decodeSmokeVoxelJournal(
			makeJournal([
				[
					0,
					[
						...payload([
							[0, 1n],
							[511, 1n << 63n]
						])
					]
				],
				[1, [...payload([[0, 0n]])]],
				[2, [1, 1, 0, 0]]
			])
		);
		expect(getSmokeVoxelStateAt(frames, 0)!.blockedMask[0]).toBe(1n);
		const state = getSmokeVoxelStateAt(frames)!;
		expect(state.blockedMask[0]).toBe(0n);
		expect(state.blockedMask[511]).toBe(1n << 63n);
		expect(state.seeds).toEqual([]);
		expect(state.stopSeeding).toBe(true);
		expect(() => decodeSmokeVoxelFrame(payload([[512, 0n]]))).toThrow(RangeError);
		expect(() => getSmokeVoxelStateAt(frames.slice(1))).toThrow(RangeError);
		expect(getSmokeVoxelStateAt([])).toBeNull();
	});

	test('preserves extra records and rejects unknown sections or trailing bytes', () => {
		const extra = Uint8Array.from({ length: 20 }, (_, i) => i);
		const frame = decodeSmokeVoxelFrame(new Uint8Array([0, 0, 1, ...extra]));
		expect(frame.extraRecords).toEqual([extra]);
		expect(() => decodeSmokeVoxelFrame(new Uint8Array([0, 4, 0]))).toThrow(RangeError);
		expect(() => decodeSmokeVoxelFrame(new Uint8Array([0, 0, 0, 0]))).toThrow(RangeError);
	});
});
