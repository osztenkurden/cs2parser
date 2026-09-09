import { describe, test, expect } from 'bun:test';
import { BinaryWriter } from '@bufbuild/protobuf/wire';
import { decodeQfloat, getQuantalizedFloat } from '../../src/parser/entities/quantizedFloat.js';
import { parseClassInfo } from '../../src/parser/entities/classInfo.js';
import { constructorFieldHelper, Field, FieldTypeEnum } from '../../src/parser/entities/constructorFields.js';
import { BitBuffer } from '../../src/parser/ubitreader.js';

const QFF_ROUNDDOWN = 1 << 0;
const QFF_ROUNDUP = 1 << 1;
const QFF_ENCODE_ZERO = 1 << 2;
const QFF_ENCODE_INTEGERS = 1 << 3;

describe('getQuantalizedFloat', () => {
	test('returns no_scale for bitcount 0', () => {
		const qf = getQuantalizedFloat(0);
		expect(qf.no_scale).toBe(true);
		expect(qf.bit_count).toBe(32);
	});

	test('returns no_scale for bitcount >= 32', () => {
		const qf = getQuantalizedFloat(32);
		expect(qf.no_scale).toBe(true);
		expect(qf.bit_count).toBe(32);
	});

	test('basic float with no flags', () => {
		const qf = getQuantalizedFloat(8, 0, 0.0, 1.0);
		expect(qf.no_scale).toBe(false);
		expect(qf.bit_count).toBe(8);
		expect(qf.low).toBe(0.0);
		expect(qf.high).toBe(1.0);
		expect(qf.dec_mul).toBeCloseTo(1 / 255, 10);
		expect(qf.high_low_mul).toBeGreaterThan(0);
	});

	test('ROUNDDOWN adjusts high value', () => {
		const qf = getQuantalizedFloat(8, QFF_ROUNDDOWN, 0.0, 256.0);
		// With ROUNDDOWN, high should be reduced by range/steps
		expect(qf.high).toBeLessThan(256.0);
		expect(qf.offset).toBeGreaterThan(0);
	});

	test('ROUNDUP adjusts low value', () => {
		const qf = getQuantalizedFloat(8, QFF_ROUNDUP, 0.0, 256.0);
		// With ROUNDUP, low should be increased by range/steps
		expect(qf.low).toBeGreaterThan(0.0);
		expect(qf.offset).toBeGreaterThan(0);
	});

	test('ENCODE_INTEGERS may increase bit count', () => {
		const qf = getQuantalizedFloat(4, QFF_ENCODE_INTEGERS, 0.0, 100.0);
		// ENCODE_INTEGERS clears ROUNDUP, ROUNDDOWN, ENCODE_ZERO
		expect(qf.flags & QFF_ROUNDDOWN).toBe(0);
		expect(qf.flags & QFF_ROUNDUP).toBe(0);
		expect(qf.flags & QFF_ENCODE_ZERO).toBe(0);
		// bit_count should be >= original 4
		expect(qf.bit_count).toBeGreaterThanOrEqual(4);
	});

	test('ENCODE_ZERO flag validation with low=0', () => {
		// When low=0 and ENCODE_ZERO is set, it should be converted to ROUNDDOWN
		const qf = getQuantalizedFloat(8, QFF_ENCODE_ZERO, 0.0, 100.0);
		expect(qf.flags & QFF_ENCODE_ZERO).toBe(0);
	});

	test('ENCODE_ZERO flag validation with high=0', () => {
		// When high=0 and ENCODE_ZERO is set, it should be converted to ROUNDUP
		const qf = getQuantalizedFloat(8, QFF_ENCODE_ZERO, -100.0, 0.0);
		expect(qf.flags & QFF_ENCODE_ZERO).toBe(0);
	});

	test('ENCODE_ZERO cleared when range does not include zero', () => {
		const qf = getQuantalizedFloat(8, QFF_ENCODE_ZERO, 10.0, 100.0);
		expect(qf.flags & QFF_ENCODE_ZERO).toBe(0);
	});

	test('multipliers are positive for valid ranges', () => {
		const qf = getQuantalizedFloat(16, 0, -1000.0, 1000.0);
		expect(qf.high_low_mul).toBeGreaterThan(0);
		expect(qf.dec_mul).toBeGreaterThan(0);
	});

	test('dec_mul is 1/(steps-1)', () => {
		const qf = getQuantalizedFloat(10, 0, 0.0, 1.0);
		const steps = 1 << 10;
		expect(qf.dec_mul).toBeCloseTo(1 / (steps - 1), 10);
	});

	test('no flags provided defaults to 0', () => {
		const qf = getQuantalizedFloat(8, undefined, 0.0, 1.0);
		expect(qf.flags).toBe(0);
	});
});

describe('schema-owned quantized decoders', () => {
	const schema = (high: number) => {
		// One float32 field, shared by the serializer and its property-decoder map.
		const field = new BinaryWriter()
			.uint32(8)
			.int32(1)
			.uint32(16)
			.int32(2)
			.uint32(24)
			.int32(8)
			.uint32(45)
			.float(high)
			.finish();
		const data = new BinaryWriter()
			.uint32(10)
			.bytes(Uint8Array.of(8, 0, 24, 0))
			.uint32(18)
			.string('CWeaponTest')
			.uint32(18)
			.string('float32')
			.uint32(18)
			.string('m_value')
			.uint32(26)
			.bytes(field)
			.finish();
		return parseClassInfo(
			{ data: new BinaryWriter().bytes(data).finish() },
			{ classes: [{ class_id: 0, network_name: 'CWeaponTest' }] }
		);
	};

	test('schemas and retained public decoder references remain independent across repeated construction', () => {
		const first = schema(1);
		const decoder = first.propIdToDecoder[1000]!;
		if (typeof decoder !== 'object') throw new Error('Expected a quantized decoder');
		expect(decoder.type).toBe(0);
		expect(decoder.decoder).toEqual(getQuantalizedFloat(8, 0, 0, 1));
		const field = first.classes[0]!.serializer.fields[0] as Field<typeof FieldTypeEnum.Value>;
		expect(field.value.decoder).toBe(decoder);
		expect(field.clone().value.decoder).toBe(decoder);

		for (let high = 2; high <= 33; high++) {
			const next = schema(high).propIdToDecoder[1000]!;
			if (typeof next !== 'object') throw new Error('Expected a quantized decoder');
			expect(next).not.toBe(decoder);
			expect(next.decoder).not.toBe(decoder.decoder);
			expect(constructorFieldHelper.decode(new BitBuffer(Uint8Array.of(255)), next)).toBe(high);
			expect(constructorFieldHelper.decode(new BitBuffer(Uint8Array.of(255)), decoder)).toBe(1);
		}
	});
});

describe('decodeQfloat', () => {
	test('preserves the exact multiply order rather than regrouping bits * dec_mul', () => {
		const qf = getQuantalizedFloat(10, 0, -100.1, 201.2);
		const reader = new BitBuffer(Uint8Array.of(23, 0));
		expect(decodeQfloat(reader, qf)).toBe(-93.32590420332356);
		expect(qf.low + (qf.high - qf.low) * (23 * qf.dec_mul)).toBe(-93.32590420332355);
		expect(reader.RemainingBits).toBe(6);
	});

	test.each([
		[0b111, -10, 1],
		[0b110, 10, 2],
		[0b100, 0, 3]
	])('sentinel bits %i return %i after %i bits', (bits, value, consumed) => {
		const qf = { ...getQuantalizedFloat(8, 0, -10, 10), flags: 7 };
		const reader = new BitBuffer(Uint8Array.of(bits));
		expect(decodeQfloat(reader, qf)).toBe(value);
		expect(reader.RemainingBits).toBe(8 - consumed);
	});
});
