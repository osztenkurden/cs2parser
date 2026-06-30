import { describe, test, expect } from 'bun:test';
import {
	decodeSmokeVoxelJournal,
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

	test('empty / sub-header buffer yields no frames', () => {
		expect(decodeSmokeVoxelJournal(new Uint8Array(0))).toEqual([]);
		expect(decodeSmokeVoxelJournal(new Uint8Array([1, 0]))).toEqual([]);
	});
});

describe('decodeVoxelFrameOccupancy', () => {
	// payload = [activeFlag, sectionFlags, count, count×(z,y,x,s0..s4)]
	const occPayload = (entries: Array<[number, number, number]>, flags = 0x01) => {
		const out = [0x00, flags, entries.length];
		for (const [z, y, x] of entries) out.push(z, y, x, 5, 0, 0, 0, 0);
		return new Uint8Array(out);
	};

	test('decodes z,y,x entries in order', () => {
		const v = decodeVoxelFrameOccupancy(occPayload([[14, 18, 16], [16, 18, 16]]));
		expect(v).not.toBeNull();
		expect(v!).toHaveLength(2);
		expect(v![0]).toMatchObject({ z: 14, y: 18, x: 16 });
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
			{ seq: 2, payload: occPayload([[9, 9, 9], [8, 8, 8]]), isHeartbeat: false }
		];
		expect(getSmokeOccupancyAt(frames, 1)!.seq).toBe(0);
		expect(getSmokeOccupancyAt(frames)!.voxels).toHaveLength(2);
	});

	test('voxelToWorld inverts the client transform (grid 16 = origin)', () => {
		expect(voxelToWorld(16, 16, 16, [100, 200, 50])).toEqual([100, 200, 50]);
		// verified axis signs: world X mirrored (−), Y/Z aligned (+); 1 voxel = 20 units
		expect(voxelToWorld(17, 16, 16, [100, 200, 50])).toEqual([80, 200, 50]);
		expect(voxelToWorld(16, 17, 16, [100, 200, 50])).toEqual([100, 220, 50]);
		expect(voxelToWorld(16, 16, 17, [100, 200, 50])).toEqual([100, 200, 70]);
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

	test('matches the client interleave (z = least-significant axis)', () => {
		// z occupies bits 0,3,6…; y bits 1,4,7…; x bits 2,5,8…
		expect(mortonEncode3(0, 0, 1)).toBe(0b001);
		expect(mortonEncode3(0, 1, 0)).toBe(0b010);
		expect(mortonEncode3(1, 0, 0)).toBe(0b100);
		expect(mortonEncode3(1, 1, 1)).toBe(0b111);
	});

	test('indices stay within the 32³ range', () => {
		expect(mortonEncode3(31, 31, 31)).toBe(32 * 32 * 32 - 1);
	});
});
