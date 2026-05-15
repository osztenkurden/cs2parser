/**
 * Phase 3 parity check: the Rust port of fieldPathOps.ts produces the same
 * FieldPath mutations as the JS version for every opcode the test suite
 * exercises. The JS suite (`fieldPathOps.test.ts`) continues to test the
 * TypeScript implementation; this file mirrors it against Rust.
 */
import { describe, test, expect } from 'bun:test';
import { native } from '../../src/native/index.js';

function makeBuf(...bytes: number[]) {
	while (bytes.length < 4) bytes.push(0); // BitBufferNative ctor needs at least 4 bytes
	return new native.BitBufferNative(new Uint8Array(bytes));
}

function makeFp(path: number[] = [0, 0, 0, 0, 0, 0, 0], last = 0) {
	return new native.FieldPathNative(path, last);
}

describe('popSpecial (Rust)', () => {
	test('pops n levels', () => {
		const fp = makeFp([1, 2, 3, 4, 0, 0, 0], 3);
		native.popSpecial(fp, 2);
		expect(fp.last).toBe(1);
		expect(fp.path[2]).toBe(0);
		expect(fp.path[3]).toBe(0);
	});

	test('pops to root', () => {
		const fp = makeFp([5, 10, 15, 0, 0, 0, 0], 2);
		native.popSpecial(fp, 2);
		expect(fp.last).toBe(0);
		expect(fp.path[1]).toBe(0);
		expect(fp.path[2]).toBe(0);
	});
});

describe('doOp - Plus operations (Rust)', () => {
	test('opcode 0: plusOne', () => {
		const fp = makeFp([5, 0, 0, 0, 0, 0, 0], 0);
		native.doOp(0, makeBuf(), fp);
		expect(fp.path[0]).toBe(6);
	});

	test('opcode 1: plusTwo', () => {
		const fp = makeFp([5, 0, 0, 0, 0, 0, 0], 0);
		native.doOp(1, makeBuf(), fp);
		expect(fp.path[0]).toBe(7);
	});

	test('opcode 2: plusThree', () => {
		const fp = makeFp([5, 0, 0, 0, 0, 0, 0], 0);
		native.doOp(2, makeBuf(), fp);
		expect(fp.path[0]).toBe(8);
	});

	test('opcode 3: plusFour', () => {
		const fp = makeFp([5, 0, 0, 0, 0, 0, 0], 0);
		native.doOp(3, makeBuf(), fp);
		expect(fp.path[0]).toBe(9);
	});
});

describe('doOp - Push operations (Rust)', () => {
	test('opcode 5: pushOneLeftDeltaZeroRightZero', () => {
		const fp = makeFp([3, 0, 0, 0, 0, 0, 0], 0);
		native.doOp(5, makeBuf(), fp);
		expect(fp.last).toBe(1);
		expect(fp.path[0]).toBe(3);
		expect(fp.path[1]).toBe(0);
	});

	test('opcode 7: pushOneLeftDeltaOneRightZero', () => {
		const fp = makeFp([3, 0, 0, 0, 0, 0, 0], 0);
		native.doOp(7, makeBuf(), fp);
		expect(fp.path[0]).toBe(4);
		expect(fp.last).toBe(1);
		expect(fp.path[1]).toBe(0);
	});
});

describe('doOp - Pop operations (Rust)', () => {
	test('opcode 27: popOnePlusOne', () => {
		const fp = makeFp([5, 10, 0, 0, 0, 0, 0], 1);
		native.doOp(27, makeBuf(), fp);
		expect(fp.last).toBe(0);
		expect(fp.path[0]).toBe(6);
	});

	test('opcode 29: popAllButOnePlusOne', () => {
		const fp = makeFp([5, 10, 15, 0, 0, 0, 0], 2);
		native.doOp(29, makeBuf(), fp);
		expect(fp.last).toBe(0);
		expect(fp.path[0]).toBe(6);
	});
});

describe('doOp - NonTopological operations (Rust)', () => {
	test('opcode 37: nonTopoPenultimatePlusOne', () => {
		const fp = makeFp([5, 10, 15, 0, 0, 0, 0], 2);
		native.doOp(37, makeBuf(), fp);
		expect(fp.path[1]).toBe(11);
		expect(fp.path[2]).toBe(15);
	});
});

describe('doOp - End marker (Rust)', () => {
	test('opcode 39: no mutation, no error', () => {
		const fp = makeFp();
		native.doOp(39, makeBuf(), fp);
		expect(fp.path).toEqual([0, 0, 0, 0, 0, 0, 0]);
		expect(fp.last).toBe(0);
	});
});

describe('doOp - Invalid opcode (Rust)', () => {
	test('throws on unknown opcode', () => {
		const fp = makeFp();
		expect(() => native.doOp(40, makeBuf(), fp)).toThrow();
	});
});
