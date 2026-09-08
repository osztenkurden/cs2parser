import { describe, test, expect } from 'bun:test';
import { classIdBitWidth } from '../../src/parser/entities/classInfo.js';
import { EntityParser } from '../../src/parser/entities/entityParser.js';
import type { ClassInfo } from '../../src/parser/entities/classInfo.js';
import type { Class } from '../../src/parser/entities/constructorFields.js';
import { BitBuffer } from '../../src/parser/ubitreader.js';

/** LSB-first bit writer, matching BitBuffer's read order. */
class BitWriter {
	private bits: number[] = [];

	writeBits(value: number, count: number): this {
		for (let i = 0; i < count; i++) this.bits.push((value >>> i) & 1);
		return this;
	}

	/** Protobuf-style unsigned varint, byte-aligned within the bit stream. */
	writeUVarInt32(value: number): this {
		let v = value >>> 0;
		do {
			let byte = v & 0x7f;
			v >>>= 7;
			if (v !== 0) byte |= 0x80;
			this.writeBits(byte, 8);
			// eslint-disable-next-line no-constant-condition
		} while (v !== 0);
		return this;
	}

	toBuffer(): Uint8Array {
		const out = new Uint8Array(Math.ceil((this.bits.length + 32) / 8));
		for (let i = 0; i < this.bits.length; i++) {
			if (this.bits[i]) out[i >>> 3]! |= 1 << (i & 7);
		}
		return out;
	}
}

const makeClassInfo = (numClasses: number, classIdBits: number): ClassInfo => {
	const classes: Class[] = [];
	for (let i = 0; i < numClasses; i++) {
		classes[i] = {
			class_id: i,
			name: `CTestClass${i}`,
			serializer: { name: `CTestClass${i}`, fields: [] }
		};
	}
	return {
		classes,
		classIdBits,
		propIdToName: {},
		propIdToDecoder: {},
		propIdToInfo: {},
		propInfoById: [],
		propNameById: []
	};
};

/** Encode one entity-creation record: class id, 17-bit serial, then a varint. */
const encodeCreate = (classId: number, classIdBits: number) =>
	new BitBuffer(new BitWriter().writeBits(classId, classIdBits).writeBits(0x1f2, 17).writeUVarInt32(0).toBuffer());

describe('classIdBitWidth', () => {
	// Source 2 sizes the field as floor(log2(numClasses)) + 1.
	test.each([
		[1, 1],
		[2, 2],
		[3, 2],
		[4, 3],
		[127, 7],
		[128, 8],
		[209, 8],
		[211, 8], // every retail CS2 demo observed to date
		[255, 8],
		[256, 9], // the boundary that used to desync the bitstream
		[257, 9],
		[300, 9],
		[511, 9],
		[512, 10]
	])('%i classes -> %i bits', (numClasses, expected) => {
		expect(classIdBitWidth(numClasses)).toBe(expected);
	});

	test('never returns zero for a degenerate class table', () => {
		expect(classIdBitWidth(0)).toBe(1);
		expect(classIdBitWidth(-1)).toBe(1);
	});
});

describe('EntityParser class-id decoding', () => {
	test('reads an 8-bit class id when the table fits in 255 classes', () => {
		const parser = new EntityParser(makeClassInfo(211, 8), () => {});
		const events: any[] = [];
		(parser as any).enqueueEvent = (name: string, data: unknown) => events.push([name, data]);

		parser.createEntity(encodeCreate(203, 8), 42, []);

		expect(events).toHaveLength(1);
		expect(events[0][0]).toBe('entitycreated');
		expect(events[0][1][0]).toBe(42); // entityId
		expect(events[0][1][1]).toBe(203); // classId
	});

	test('reads a 9-bit class id on demos with 256+ classes', () => {
		const parser = new EntityParser(makeClassInfo(300, 9), () => {});
		const events: any[] = [];
		(parser as any).enqueueEvent = (name: string, data: unknown) => events.push([name, data]);

		parser.createEntity(encodeCreate(299, 9), 7, []);

		expect(events[0][1][1]).toBe(299);
	});

	test('a hardcoded 8-bit read would desync on a 9-bit stream', () => {
		// Regression guard: this is exactly what the parser used to do. The class id
		// comes back truncated and the following serial/varint reads are misaligned.
		const reader = encodeCreate(299, 9);
		expect(reader.ReadUBits(8)).toBe(299 & 0xff); // truncated class id
		// The dropped high bit is still in the stream, so the serial read that
		// follows is shifted by one and comes back wrong too.
		expect(reader.ReadUBits(17)).not.toBe(0x1f2);
	});

	test('the widths derived from a class table round-trip through createEntity', () => {
		for (const numClasses of [128, 255, 256, 400]) {
			const bits = classIdBitWidth(numClasses);
			const parser = new EntityParser(makeClassInfo(numClasses, bits), () => {});
			const events: any[] = [];
			(parser as any).enqueueEvent = (name: string, data: unknown) => events.push([name, data]);

			const classId = numClasses - 1;
			parser.createEntity(encodeCreate(classId, bits), 1, []);
			expect(events[0][1][1]).toBe(classId);
		}
	});
});
