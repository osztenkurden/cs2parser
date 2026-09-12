import { expect, test } from 'bun:test';
import { BinaryReader, BinaryWriter } from '@bufbuild/protobuf/wire';
import { BinaryReaderEditable } from '../../src/binary-encoding/index.js';

test('editable protobuf reader resets position and uses exactly bounded views', () => {
	const backing = Uint8Array.from({ length: 24 }, (_, i) => i);
	const initial = backing.subarray(3, 11);
	const reader = new BinaryReaderEditable(initial);
	expect(reader.fixed32()).toBe(new BinaryReader(initial).fixed32());
	reader.setTo(backing.subarray(3, 11));
	expect(reader.pos).toBe(0);
	expect(reader.fixed64()).toBe(new BinaryReader(initial).fixed64());
	for (const bytes of [backing.subarray(4, 12), backing.subarray(4, 8), Uint8Array.of(9, 8, 7, 6)]) {
		reader.setTo(bytes);
		const view = Reflect.get(reader, 'view') as DataView;
		expect(view.buffer).toBe(bytes.buffer);
		expect(view.byteOffset).toBe(bytes.byteOffset);
		expect(view.byteLength).toBe(bytes.byteLength);
		expect(Reflect.get(reader, 'buf')).toBe(bytes);
		expect(reader.len).toBe(bytes.length);
		expect(reader.pos).toBe(0);
		expect(reader.fixed32()).toBe(new BinaryReader(bytes).fixed32());
	}
});

test.each(['fixed32', 'sfixed32', 'float', 'fixed64', 'sfixed64', 'double'] as const)(
	'%s cannot read beyond a reused protobuf slice, even with adjacent backing bytes',
	method => {
		const width = method.endsWith('32') || method === 'float' ? 4 : 8;
		const backing = new Uint8Array(32).fill(255);
		const reader = new BinaryReaderEditable(backing);
		for (const offset of [0, 1, 7]) {
			for (let length = width; length >= 0; length--) {
				const bytes = backing.subarray(offset, offset + length);
				reader.setTo(bytes);
				const reference = new BinaryReader(bytes);
				if (length === width) expect(reader[method]()).toBe(reference[method]());
				else {
					expect(() => reference[method]()).toThrow(RangeError);
					expect(() => reader[method]()).toThrow(RangeError);
				}
				expect(reader.pos).toBe(reference.pos);
			}
		}
	}
);

test('editable protobuf reader bounds varints and bytes to each new slice and recovers after errors', () => {
	const reader = new BinaryReaderEditable(new Uint8Array(0));
	for (const [method, bytes] of [
		['uint32', Uint8Array.of(128)],
		['uint64', Uint8Array.of(128)],
		['bytes', Uint8Array.of(2, 42)],
		['bytes', new Uint8Array(0)]
	] as const) {
		const backing = Uint8Array.of(99, ...bytes, 0, 0, 0, 0);
		reader.setTo(backing);
		reader.setTo(backing.subarray(1, 1 + bytes.length));
		expect(() => new BinaryReader(backing.subarray(1, 1 + bytes.length))[method]()).toThrow();
		expect(() => reader[method]()).toThrow();
	}
	const encoded = new BinaryWriter().uint32(300).bytes(Uint8Array.of(1, 2)).float(1.5).double(-123.25).finish();
	const backing = Uint8Array.of(99, ...encoded, 99);
	reader.setTo(backing.subarray(1, 1 + encoded.length));
	expect(reader.uint32()).toBe(300);
	const retained = reader.bytes();
	expect(retained).toEqual(Uint8Array.of(1, 2));
	expect(reader.float()).toBe(1.5);
	expect(reader.double()).toBe(-123.25);
	expect(reader.pos).toBe(reader.len);
	reader.setTo(Uint8Array.of(0));
	expect(reader.uint32()).toBe(0);
	expect(retained).toEqual(Uint8Array.of(1, 2));
});

test('reuse remains an upstream reader and resets 64-bit varint decoding state', () => {
	const reader = new BinaryReaderEditable(new Uint8Array(0));
	expect(reader).toBeInstanceOf(BinaryReader);
	for (const value of [18446744073709551615n, 0n, 9007199254740993n, 1n]) {
		const encoded = new BinaryWriter().uint64(value).sint64(-123n).bool(true).string('世界').finish();
		const backing = Uint8Array.of(99, ...encoded, 99);
		const bytes = backing.subarray(1, 1 + encoded.length);
		reader.setTo(bytes);
		const reference = new BinaryReader(bytes);
		expect(reader.uint64()).toBe(reference.uint64());
		expect(reader.sint64()).toBe(reference.sint64());
		expect(reader.bool()).toBe(reference.bool());
		expect(reader.string()).toBe(reference.string());
		expect(reader.pos).toBe(reference.pos);
	}
});
