import { describe, expect, test } from 'bun:test';
import { constructorFieldHelper, Decoders, type Decoder } from '../../src/parser/entities/constructorFields.js';
import { getQuantalizedFloat } from '../../src/parser/entities/quantizedFloat.js';
import { BitBuffer } from '../../src/parser/ubitreader.js';

class BitWriter {
	private bits: number[] = [];

	get length() {
		return this.bits.length;
	}

	write(value: number, count: number): this {
		for (let i = 0; i < count; i++) this.bits.push((value >>> i) & 1);
		return this;
	}

	bytes(values: Iterable<number>): this {
		for (const value of values) this.write(value, 8);
		return this;
	}

	varint(value: number): this {
		do {
			const byte = value & 0x7f;
			value >>>= 7;
			this.write(byte | (value ? 0x80 : 0), 8);
		} while (value);
		return this;
	}

	buffer(): Uint8Array {
		// A nonzero byteOffset and poisoned surrounding bytes exercise reader view boundaries.
		const backing = new Uint8Array(Math.ceil(this.length / 8) + 13).fill(0xff);
		const out = backing.subarray(5, 5 + Math.ceil(this.length / 8));
		out.fill(0);
		for (let i = 0; i < this.length; i++) out[i >>> 3]! |= this.bits[i]! << (i & 7);
		return out;
	}
}

const coord = (writer: BitWriter, flags: number, sign: number) => {
	writer.write(flags, 2);
	if (flags === 0) return;
	writer.write(sign, 1);
	if (flags & 1) writer.write(0x2345, 14);
	if (flags & 2) writer.write(0x1d, 5);
};

type Case = [name: string, decoder: Decoder, encode: (writer: BitWriter) => void];
const cases: Case[] = [];

for (const name of [
	'UnsignedDecoder',
	'SignedDecoder',
	'BaseDecoder',
	'CentityHandleDecoder',
	'AmmoDecoder',
	'FloatSimulationTimeDecoder'
] as const) {
	for (const value of [0, 127, 128, 300, 0xffffffff]) {
		cases.push([`${name} ${value}`, Decoders[name], w => w.varint(value)]);
	}
}
for (const name of ['BooleanDecoder', 'ComponentDecoder'] as const) {
	for (const value of [0, 1]) cases.push([`${name} ${value}`, Decoders[name], w => w.write(value, 1)]);
}
cases.push(['NoscaleDecoder', Decoders.NoscaleDecoder, w => w.write(0xc1234567, 32)]);
cases.push(['GameModeRulesDecoder', Decoders.GameModeRulesDecoder, w => w.write(0x65, 7)]);
cases.push(['Fixed64Decoder', Decoders.Fixed64Decoder, w => w.write(0xfedcba98, 32).write(0x76543210, 32)]);

for (const name of ['VectorNoscaleDecoder', 'Qangle3Decoder', 'QanglePitchYawDecoder'] as const) {
	cases.push([name, Decoders[name], w => w.write(0x7fc00000, 32).write(0x80000000, 32).write(0x3f800000, 32)]);
}
for (let length = 1; length <= 10; length++) {
	cases.push([
		`Unsigned64Decoder ${length} bytes`,
		Decoders.Unsigned64Decoder,
		w => w.bytes(new Array(length - 1).fill(0xff)).write(length === 10 ? 1 : 0x7f, 8)
	]);
}
cases.push(['Unsigned64Decoder zero', Decoders.Unsigned64Decoder, w => w.write(0, 8)]);
cases.push(['Unsigned64Decoder noncanonical zero', Decoders.Unsigned64Decoder, w => w.bytes([0x80, 0])]);

for (const bytes of [[], [0x61, 0xc3, 0xa9, 0xf0, 0x9f, 0x98, 0x80], [0xc3, 0x28], new Array(8193).fill(0x78)]) {
	cases.push([`StringDecoder ${bytes.length} bytes`, Decoders.StringDecoder, w => w.bytes(bytes).write(0, 8)]);
}
for (const length of [0, 3, 130, 4097]) {
	cases.push([
		`BinaryBlockDecoder ${length} bytes`,
		Decoders.BinaryBlockDecoder,
		w => w.varint(length).bytes(Array.from({ length }, (_, i) => i & 0xff))
	]);
}

for (let flags = 0; flags < 4; flags++) {
	for (let sign = 0; sign < 2; sign++) {
		cases.push([`FloatCoordDecoder ${flags}/${sign}`, Decoders.FloatCoordDecoder, w => coord(w, flags, sign)]);
		cases.push([
			`VectorNormalDecoder ${flags}/${sign}`,
			Decoders.VectorNormalDecoder,
			w => {
				w.write(flags, 2);
				if (flags & 1) w.write(0x357, 12);
				if (flags & 2) w.write(0xabc, 12);
				w.write(sign, 1);
			}
		]);
	}
}
for (let shapes = 0; shapes < 64; shapes++) {
	cases.push([
		`VectorFloatCoordDecoder ${shapes}`,
		Decoders.VectorFloatCoordDecoder,
		w => {
			for (let axis = 0; axis < 3; axis++) coord(w, (shapes >>> (axis * 2)) & 3, axis & 1);
		}
	]);
}
for (let flags = 0; flags < 8; flags++) {
	cases.push([
		`QangleVarDecoder ${flags}`,
		Decoders.QangleVarDecoder,
		w => {
			w.write(flags, 3);
			for (let axis = 0; axis < 3; axis++) {
				if (flags & (1 << axis)) coord(w, (flags + axis) & 3, axis & 1);
			}
		}
	]);
	cases.push([
		`QanglePresDecoder ${flags}`,
		Decoders.QanglePresDecoder,
		w => {
			w.write(flags, 3);
			for (let axis = 0; axis < 3; axis++) {
				if (flags & (1 << axis)) w.write(0x54321 + axis, 20);
			}
		}
	]);
}

for (let flags = 0; flags < 16; flags++) {
	// Explicit parameters exercise all sentinel combinations, including flags normally
	// removed by schema normalization (particularly ROUNDDOWN).
	for (const sentinel of [0, 1, 2, 4]) {
		if (sentinel && !(flags & sentinel)) continue;
		const qf = { ...getQuantalizedFloat(9, 0, -10, 10), flags };
		cases.push([
			`QuantalizedFloat flags=${flags} sentinel=${sentinel}`,
			{ type: 0, decoder: qf },
			w => {
				for (const flag of [1, 2, 4]) {
					if (!(flags & flag)) continue;
					w.write(flag === sentinel ? 1 : 0, 1);
					if (flag === sentinel) return;
				}
				w.write(0x155, qf.bit_count);
			}
		]);
	}
	const qf = getQuantalizedFloat(4, flags, -100.1, 201.2);
	cases.push([
		`QuantalizedFloat normalized flags=${flags}`,
		{ type: 0, decoder: qf },
		w => {
			for (const flag of [1, 2, 4]) if (qf.flags & flag) w.write(0, 1);
			w.write(7, qf.bit_count);
		}
	]);
}
for (const bitcount of [1, 8, 16, 31, 32]) {
	cases.push([
		`QuantalizedFloat ${bitcount} bits`,
		{ type: 0, decoder: getQuantalizedFloat(bitcount, 0, -1, 1) },
		w => w.write(0x87654321, bitcount)
	]);
}

describe('constructorFieldHelper.skip', () => {
	test('covers every numeric decoder (CTransform is tested as unsupported)', () => {
		const covered = new Set(cases.map(([, decoder]) => decoder).filter(d => typeof d === 'number'));
		covered.add(Decoders.CTransformDecoder);
		expect(covered).toEqual(new Set(Object.values(Decoders)));
	});

	test.each(cases)('%s matches decode at every bit offset', (_name, decoder, encode) => {
		for (let offset = 0; offset < 32; offset++) {
			const writer = new BitWriter().write(0x9e3779b9, offset);
			encode(writer);
			const valueEnd = writer.length;
			writer.write(0xa1b2c3d4, 32).write(0x5b, 7);
			const bytes = writer.buffer();
			const decoded = new BitBuffer(bytes);
			const skipped = new BitBuffer(new Uint8Array(0)).setTo(bytes);
			if (offset) {
				decoded.ReadUBits(offset);
				skipped.ReadUBits(offset);
			}

			constructorFieldHelper.decode(decoded, decoder);
			// Skips must not delegate to any allocating decoder or copy binary output.
			for (const method of [
				'decodeVectorNoScale',
				'decodeQangleAll3',
				'decodeQanglePitchYaw',
				'decodeNormalVec',
				'decodeVectorFloatCoord',
				'decodeQangleVariant',
				'decodeQangleVariantPres',
				'readUVarInt64',
				'decudeUint64',
				'readString',
				'readBytes'
			] as const) {
				skipped[method] = () => {
					throw new Error(`Skip materialized output through ${method}`);
				};
			}
			expect(constructorFieldHelper.skip(skipped, decoder)).toBeUndefined();
			expect(decoded.RemainingBits).toBe(bytes.length * 8 - valueEnd);
			expect(skipped.RemainingBits).toBe(decoded.RemainingBits);
			for (const reader of [decoded, skipped]) {
				expect(reader.ReadUBits(32)).toBe(0xa1b2c3d4);
				expect(reader.ReadUBits(7)).toBe(0x5b);
			}
			expect(skipped.RemainingBits).toBe(decoded.RemainingBits);
		}
	});

	test.each([
		['CTransform', Decoders.CTransformDecoder, 'CTransform decoding is not implemented'],
		['unknown', 999, 'unknown decoder'],
		['bare quantized-float id', 0, 'unknown decoder']
	] as const)('%s fails without consuming data', (_name, decoder, message) => {
		for (const consume of [constructorFieldHelper.decode, constructorFieldHelper.skip]) {
			const reader = new BitBuffer(new Uint8Array([0xab]));
			expect(() => consume(reader, decoder)).toThrow(message);
			expect(reader.ReadByte()).toBe(0xab);
		}
	});

	test('malformed U64 retains decode validation and consumption', () => {
		for (const invalid of [new Array(9).fill(0xff).concat(2), new Array(10).fill(0x80).concat(0)]) {
			for (let offset = 0; offset < 32; offset++) {
				const bytes = new BitWriter().write(0, offset).bytes(invalid).write(0xab, 8).buffer();
				const decoded = new BitBuffer(bytes);
				const skipped = new BitBuffer(bytes);
				if (offset) {
					decoded.ReadUBits(offset);
					skipped.ReadUBits(offset);
				}
				expect(() => constructorFieldHelper.decode(decoded, Decoders.Unsigned64Decoder)).toThrow(
					'MALFORMED U64'
				);
				expect(() => constructorFieldHelper.skip(skipped, Decoders.Unsigned64Decoder)).toThrow('MALFORMED U64');
				expect(skipped.RemainingBits).toBe(decoded.RemainingBits);
				expect(skipped.ReadByte()).toBe(decoded.ReadByte());
			}
		}
	});

	test.each([
		...Object.entries(Decoders),
		['QuantalizedFloat', { type: 0, decoder: getQuantalizedFloat(8, 4, -1, 1) }]
	] as [string, Decoder][])('%s rejects an empty input in both paths', (_name, decoder) => {
		for (const consume of [constructorFieldHelper.decode, constructorFieldHelper.skip]) {
			expect(() => consume(new BitBuffer(new Uint8Array(0)), decoder)).toThrow();
		}
	});

	test.each([
		['unterminated string', Decoders.StringDecoder, [0x61, 0x62]],
		['short binary block', Decoders.BinaryBlockDecoder, [3, 1, 2]],
		['unterminated U64', Decoders.Unsigned64Decoder, [0x80]],
		['short fixed64', Decoders.Fixed64Decoder, [1, 2, 3, 4, 5, 6, 7]],
		['short noscale vector', Decoders.VectorNoscaleDecoder, new Array(11).fill(0xff)],
		['short three-axis angle', Decoders.Qangle3Decoder, new Array(11).fill(0xff)],
		['short pitch/yaw angle', Decoders.QanglePitchYawDecoder, new Array(11).fill(0xff)],
		['short normal', Decoders.VectorNormalDecoder, [3]],
		['short vector coord', Decoders.VectorFloatCoordDecoder, [3]],
		['short angle coord', Decoders.QangleVarDecoder, [0x1f]],
		['short precise angle', Decoders.QanglePresDecoder, [7]],
		['short quantized float', { type: 0, decoder: { ...getQuantalizedFloat(8, 0, -1, 1), flags: 7 } }, [0]]
	] as [string, Decoder, number[]][])('%s rejects truncated input in both paths', (_name, decoder, bytes) => {
		const backing = new Uint8Array(bytes.length + 16).fill(0xff);
		backing.set(bytes, 5);
		const decoded = new BitBuffer(backing.subarray(5, 5 + bytes.length));
		const skipped = new BitBuffer(backing.subarray(5, 5 + bytes.length));
		expect(() => constructorFieldHelper.decode(decoded, decoder)).toThrow();
		expect(() => constructorFieldHelper.skip(skipped, decoder)).toThrow();
		expect(skipped.RemainingBits).toBe(decoded.RemainingBits);
	});
});
