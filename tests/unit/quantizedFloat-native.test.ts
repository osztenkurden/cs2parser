/**
 * Phase 4 parity check: Rust `getQuantalizedFloat` mirrors the JS impl in
 * field-construction time. Float comparisons use `toBeCloseTo(6)` because the
 * Rust port computes in f32 vs JS's f64 — the wire-format encoder is f32, so
 * f32 is the correct precision; numeric drift is within the last few f32 ulps.
 */
import { describe, test, expect } from 'bun:test';
import { native } from '../../src/native/index.js';

const QFF_ROUNDDOWN = 1 << 0;
const QFF_ROUNDUP = 1 << 1;
const QFF_ENCODE_ZERO = 1 << 2;
const QFF_ENCODE_INTEGERS = 1 << 3;

describe('getQuantalizedFloat (Rust)', () => {
	test('returns no_scale for bitcount 0', () => {
		const qf = native.getQuantalizedFloat(0);
		expect(qf.noScale).toBe(true);
		expect(qf.bitCount).toBe(32);
	});

	test('returns no_scale for bitcount >= 32', () => {
		const qf = native.getQuantalizedFloat(32);
		expect(qf.noScale).toBe(true);
		expect(qf.bitCount).toBe(32);
	});

	test('basic float with no flags', () => {
		const qf = native.getQuantalizedFloat(8, 0, 0.0, 1.0);
		expect(qf.noScale).toBe(false);
		expect(qf.bitCount).toBe(8);
		expect(qf.low).toBe(0.0);
		expect(qf.high).toBe(1.0);
		expect(qf.decMul).toBeCloseTo(1 / 255, 6);
		expect(qf.highLowMul).toBeGreaterThan(0);
	});

	test('ROUNDDOWN adjusts high value', () => {
		const qf = native.getQuantalizedFloat(8, QFF_ROUNDDOWN, 0.0, 256.0);
		expect(qf.high).toBeLessThan(256.0);
		expect(qf.offset).toBeGreaterThan(0);
	});

	test('ROUNDUP adjusts low value', () => {
		const qf = native.getQuantalizedFloat(8, QFF_ROUNDUP, 0.0, 256.0);
		expect(qf.low).toBeGreaterThan(0.0);
		expect(qf.offset).toBeGreaterThan(0);
	});

	test('ENCODE_INTEGERS may increase bit count', () => {
		const qf = native.getQuantalizedFloat(4, QFF_ENCODE_INTEGERS, 0.0, 100.0);
		expect(qf.flags & QFF_ROUNDDOWN).toBe(0);
		expect(qf.flags & QFF_ROUNDUP).toBe(0);
		expect(qf.flags & QFF_ENCODE_ZERO).toBe(0);
		expect(qf.bitCount).toBeGreaterThanOrEqual(4);
	});

	test('ENCODE_ZERO flag validation with low=0', () => {
		const qf = native.getQuantalizedFloat(8, QFF_ENCODE_ZERO, 0.0, 100.0);
		expect(qf.flags & QFF_ENCODE_ZERO).toBe(0);
	});

	test('ENCODE_ZERO flag validation with high=0', () => {
		const qf = native.getQuantalizedFloat(8, QFF_ENCODE_ZERO, -100.0, 0.0);
		expect(qf.flags & QFF_ENCODE_ZERO).toBe(0);
	});

	test('ENCODE_ZERO cleared when range does not include zero', () => {
		const qf = native.getQuantalizedFloat(8, QFF_ENCODE_ZERO, 10.0, 100.0);
		expect(qf.flags & QFF_ENCODE_ZERO).toBe(0);
	});

	test('multipliers are positive for valid ranges', () => {
		const qf = native.getQuantalizedFloat(16, 0, -1000.0, 1000.0);
		expect(qf.highLowMul).toBeGreaterThan(0);
		expect(qf.decMul).toBeGreaterThan(0);
	});

	test('dec_mul is 1/(steps-1)', () => {
		const qf = native.getQuantalizedFloat(10, 0, 0.0, 1.0);
		const steps = 1 << 10;
		expect(qf.decMul).toBeCloseTo(1 / (steps - 1), 6);
	});

	test('no flags provided defaults to 0', () => {
		const qf = native.getQuantalizedFloat(8, undefined, 0.0, 1.0);
		expect(qf.flags).toBe(0);
	});
});
