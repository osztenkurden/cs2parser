import { describe, test, expect } from 'bun:test';
import { Field, FieldTypeEnum, Decoders, constructorFieldHelper, type PropInfo } from '../../src/parser/entities/constructorFields.js';

// Minimal structural views of the (unexported) internal field-value shapes, enough to reach the
// element ValueField that carries prop_id/name.
type InnerValue = { decoder: unknown; name: string; prop_id: number };
type Container = { field_enum: Field };
const innerOf = (f: Field): InnerValue => (f.value as Container).field_enum.value as InnerValue;

/** A Vector<int32> field named like a weapon's `m_pReserveAmmo` (the field that regressed). */
const makeReserveVector = (): Field =>
	new Field(FieldTypeEnum.Vector, {
		field_enum: new Field(FieldTypeEnum.Value, { decoder: Decoders.UnsignedDecoder, name: 'm_pReserveAmmo', prop_id: 0 }),
		decoder: Decoders.UnsignedDecoder,
		varName: 'm_pReserveAmmo',
		elementBaseType: 'int32'
	});

/** A fixed int32[2] array field (same container class of bug as Vector). */
const makeReserveArray = (): Field =>
	new Field(FieldTypeEnum.Array, {
		field_enum: new Field(FieldTypeEnum.Value, { decoder: Decoders.UnsignedDecoder, name: 'm_someArray', prop_id: 0 }),
		length: 2,
		varName: 'm_someArray',
		elementBaseType: 'int32'
	});

describe('Field.clone()', () => {
	// The bug: clone() shallow-spread `{ ...this.value }` for Array/Vector, copying the inner
	// `field_enum` BY REFERENCE — so two clones shared one element Field (and one prop_id).
	test('Vector clone gets its own inner field_enum (not shared by reference)', () => {
		const orig = makeReserveVector();
		const clone = orig.clone();
		expect((clone.value as Container).field_enum).not.toBe((orig.value as Container).field_enum);
		expect(innerOf(clone)).not.toBe(innerOf(orig));
	});

	test('Array clone gets its own inner field_enum', () => {
		const orig = makeReserveArray();
		const clone = orig.clone();
		expect((clone.value as Container).field_enum).not.toBe((orig.value as Container).field_enum);
	});

	test('mutating a clone element prop_id does not leak into the original', () => {
		const orig = makeReserveVector();
		const clone = orig.clone();
		innerOf(clone).prop_id = 4242;
		expect(innerOf(orig).prop_id).toBe(0); // pre-fix: this was 4242 (shared object)
	});

	test('two clones of the same source are independent', () => {
		const source = makeReserveVector();
		const a = source.clone();
		const b = source.clone();
		innerOf(a).prop_id = 1;
		innerOf(b).prop_id = 2;
		expect(innerOf(a).prop_id).toBe(1);
		expect(innerOf(b).prop_id).toBe(2);
	});
});

describe('traverseFields — per-class naming of shared container fields', () => {
	// Reproduces the exact production scenario: many weapon classes (CAK47, CWeaponXM1014, …) share
	// ONE source `m_pReserveAmmo` field; classInfo hands each class a `.clone()`. traverseFields must
	// give each class its own prop_id + "Class.m_pReserveAmmo" key. Pre-fix, the shared inner Field
	// meant the last class traversed overwrote the prop_id, so every weapon resolved to
	// "CWeaponXM1014.m_pReserveAmmo" and a typed read of "CAK47.m_pReserveAmmo" was empty.
	test('each class gets a distinct prop_id and its own-class key', () => {
		const source = makeReserveVector(); // one shared source field (as classInfo builds once)
		const ak = source.clone();
		const xm = source.clone();

		const map: Record<number, string> = {};
		const propInfo: Record<number, PropInfo> = {};
		const counter = { id: 1000 };
		constructorFieldHelper.traverseFields([ak], 'CAK47', map, counter, undefined, propInfo);
		constructorFieldHelper.traverseFields([xm], 'CWeaponXM1014', map, counter, undefined, propInfo);

		const akId = innerOf(ak).prop_id;
		const xmId = innerOf(xm).prop_id;

		expect(akId).not.toBe(xmId); // distinct ids (pre-fix: identical — shared inner Field)
		expect(map[akId]).toBe('CAK47.m_pReserveAmmo'); // pre-fix: 'CWeaponXM1014.m_pReserveAmmo'
		expect(map[xmId]).toBe('CWeaponXM1014.m_pReserveAmmo');

		// The stored container key follows the same rule — this is what decode-time writes land under.
		expect(propInfo[akId]?.containerKey).toBe('CAK47.m_pReserveAmmo');
		expect(propInfo[xmId]?.containerKey).toBe('CWeaponXM1014.m_pReserveAmmo');
		// int32 element type resolves to an Int32Array backing store.
		expect(propInfo[akId]?.elementCtor).toBe(Int32Array);
	});

	// Control: plain top-level Value fields were always cloned by value, so they never collided —
	// which is why m_iClip1 worked while m_pReserveAmmo didn't. Guards against a regression there.
	test('plain Value fields also stay per-class (control)', () => {
		const source = new Field(FieldTypeEnum.Value, { decoder: Decoders.UnsignedDecoder, name: 'm_iClip1', prop_id: 0 });
		const ak = source.clone();
		const xm = source.clone();
		const map: Record<number, string> = {};
		const counter = { id: 1000 };
		constructorFieldHelper.traverseFields([ak], 'CAK47', map, counter);
		constructorFieldHelper.traverseFields([xm], 'CWeaponXM1014', map, counter);
		expect((ak.value as InnerValue).prop_id).not.toBe((xm.value as InnerValue).prop_id);
		expect(map[(ak.value as InnerValue).prop_id]).toBe('CAK47.m_iClip1');
		expect(map[(xm.value as InnerValue).prop_id]).toBe('CWeaponXM1014.m_iClip1');
	});
});
