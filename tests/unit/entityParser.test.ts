import { describe, expect, test } from 'bun:test';
import { EntityParser } from '../../src/parser/entities/entityParser.js';
import {
	constructorFieldHelper,
	Decoders,
	Field,
	FieldTypeEnum,
	type Decoder,
	type PropInfo
} from '../../src/parser/entities/constructorFields.js';
import type { ClassInfo } from '../../src/parser/entities/classInfo.js';
import type { FieldPath } from '../../src/parser/entities/fieldPathOps.js';
import { BitBuffer } from '../../src/parser/ubitreader.js';

const bits = (...parts: [number, number][]): Uint8Array => {
	const length = parts.reduce((n, [, width]) => n + width, 0);
	const out = new Uint8Array(Math.ceil(length / 8));
	let offset = 0;
	for (const [value, width] of parts) {
		for (let i = 0; i < width; i++, offset++) out[offset >>> 3]! |= ((value >>> i) & 1) << (offset & 7);
	}
	return out;
};

const path = (...slots: number[]): FieldPath => ({
	path: [...slots, ...new Array(7 - slots.length).fill(0)] as FieldPath['path'],
	last: slots.length - 1
});

const valueField = (name: string, decoder: Decoder) => new Field(FieldTypeEnum.Value, { name, decoder, prop_id: 0 });

const setup = (fields: Field[], direct: boolean, className = 'CWeaponTest') => {
	const propIdToName: Record<number, string> = {};
	const propIdToDecoder: Record<number, Decoder> = {};
	const propIdToInfo: Record<number, PropInfo> = {};
	constructorFieldHelper.traverseFields(fields, className, propIdToName, { id: 0 }, propIdToDecoder, propIdToInfo);
	const classInfo: ClassInfo = {
		classes: [{ class_id: 0, name: className, serializer: { name: className, fields } }],
		classIdBits: 1,
		propIdToName,
		propIdToDecoder,
		propIdToInfo,
		propNameById: Object.values(propIdToName),
		propInfoById: Object.values(propIdToInfo)
	};
	const events: [string, unknown][] = [];
	const parser = new EntityParser(classInfo, (name, ...data) => {
		events.push([name, data[0]]);
	});
	if (direct) {
		parser.directEntities = [];
		parser.directPropInfoById = classInfo.propInfoById;
	}
	const create = (baselines: Uint8Array[] = []) => {
		parser.createEntity(new BitBuffer(bits([0, 1], [0, 17], [0, 8])), 7, baselines);
	};
	const write = (fp: FieldPath, index: number) => parser.writeFp(fp, index, classInfo.classes[0]!.serializer);
	return { parser, classInfo, events, create, write };
};

describe('EntityParser value consumers', () => {
	test.each([false, true])('preserves scalar values and ignores pointer values (direct=%s)', direct => {
		const { parser, create, events, write } = setup(
			[
				valueField('name', Decoders.StringDecoder),
				new Field(FieldTypeEnum.Pointer, {
					decoder: Decoders.StringDecoder,
					serializer: { name: 'Child', fields: [] }
				})
			],
			direct
		);
		create();
		write(path(0), 0);
		write(path(1), 1);
		const reader = new BitBuffer(Uint8Array.of(0x61, 0, 0x62, 0, 0xac));
		const readString = reader.readString.bind(reader);
		let calls = 0;
		reader.readString = () => {
			calls++;
			return readString();
		};
		expect(parser.decodeEntityUpdate(reader, 7, 2)).toBe(2);
		expect(calls).toBe(1);
		expect(reader.ReadByte()).toBe(0xac);
		if (direct) {
			expect(parser.directEntities![7]!.properties).toEqual({ 'CWeaponTest.name': 'a' });
			expect(events.map(([name]) => name)).toEqual(['entitycreated']);
		} else {
			expect(events[1]).toEqual([
				'entityupdated',
				{ entityId: 7, propId: 0, value: 'a', arrayIndex: undefined, isResize: undefined }
			]);
			expect(events).toHaveLength(2);
		}
	});

	test.each(['missing metadata', 'missing entity', 'unnamed event property'])('skips a string with %s', mode => {
		const { parser, classInfo, create, events, write } = setup(
			[valueField('name', Decoders.StringDecoder)],
			mode !== 'unnamed event property'
		);
		if (mode === 'missing metadata') classInfo.propInfoById[0] = undefined;
		if (mode === 'missing entity') parser.onlyGameRules = true;
		if (mode === 'unnamed event property') classInfo.propNameById[0] = undefined;
		create();
		write(path(0), 0);
		const reader = new BitBuffer(Uint8Array.of(0x61, 0, 0xac));
		reader.readString = () => {
			throw new Error('Unused value was materialized');
		};
		parser.decodeEntityUpdate(reader, 7, 1);
		expect(reader.ReadByte()).toBe(0xac);
		expect(events.map(([name]) => name)).toEqual(['entitycreated']);
		if (mode === 'missing metadata') expect(parser.directEntities![7]!.properties).toEqual({});
		if (mode === 'missing entity') expect(parser.directEntities![7]).toBeUndefined();
	});

	test('ONLY_GAME_RULES still decodes the game-rules entity', () => {
		const { parser, create, write } = setup(
			[valueField('name', Decoders.StringDecoder)],
			true,
			'CCSGameRulesProxy'
		);
		parser.onlyGameRules = true;
		create();
		write(path(0), 0);
		parser.decodeEntityUpdate(new BitBuffer(Uint8Array.of(0x61, 0)), 7, 1);
		expect(parser.directEntities![7]!.properties).toEqual({ 'CCSGameRulesProxy.name': 'a' });
	});

	test.each([false, true])('preserves resizes and nested container values (direct=%s)', direct => {
		const fields = [
			new Field(FieldTypeEnum.Vector, {
				field_enum: valueField('name', Decoders.StringDecoder),
				decoder: Decoders.UnsignedDecoder,
				varName: 'names'
			}),
			new Field(FieldTypeEnum.Array, {
				field_enum: valueField('id', Decoders.Fixed64Decoder),
				length: 2,
				varName: 'ids',
				elementBaseType: 'ResourceId_t'
			}),
			new Field(FieldTypeEnum.Vector, {
				field_enum: new Field(FieldTypeEnum.Serializer, {
					serializer: { name: 'Child', fields: [valueField('label', Decoders.StringDecoder)] }
				}),
				decoder: Decoders.UnsignedDecoder,
				varName: 'objects'
			})
		];
		const { parser, create, events, write } = setup(fields, direct);
		create();
		for (const [i, fp] of [path(0), path(0, 1), path(1, 0), path(2, 0, 0)].entries()) write(fp, i);
		const reader = new BitBuffer(Uint8Array.of(3, 0x61, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0x62, 0, 0xac));
		parser.decodeEntityUpdate(reader, 7, 4);
		expect(reader.ReadByte()).toBe(0xac);
		if (direct) {
			const props = parser.directEntities![7]!.properties;
			expect(props['CWeaponTest.names']).toEqual([, 'a', ,]);
			expect(props['CWeaponTest.ids']).toEqual(BigUint64Array.of(5n, 0n));
			expect(props['CWeaponTest.objects']).toEqual([{ label: 'b' }]);
			expect(events).toHaveLength(1);
		} else {
			expect(events.slice(1)).toEqual([
				['entityupdated', { entityId: 7, propId: 0, value: 3, arrayIndex: undefined, isResize: true }],
				['entityupdated', { entityId: 7, propId: 0, value: 'a', arrayIndex: 1, isResize: undefined }],
				['entityupdated', { entityId: 7, propId: 1, value: 5n, arrayIndex: 0, isResize: undefined }],
				['entityupdated', { entityId: 7, propId: 2, value: 'b', arrayIndex: 0, isResize: undefined }]
			]);
		}
	});
});

describe('EntityParser baselines', () => {
	// Huffman PlusOne (0), then Finish (1, 0): one update to the first field.
	const firstFieldPath: [number, number] = [2, 3];

	test('applies a baseline to a retained entity', () => {
		const { parser, create } = setup([valueField('name', Decoders.StringDecoder)], true);
		create([bits(firstFieldPath, [0x61, 8], [0, 8])]);
		expect(parser.directEntities![7]!.properties).toEqual({ 'CWeaponTest.name': 'a' });
	});

	test('still validates unsupported values in an ignored entity baseline', () => {
		const { parser, create } = setup([valueField('transform', Decoders.CTransformDecoder)], true);
		parser.onlyGameRules = true;
		expect(() => create([bits(firstFieldPath)])).toThrow('CTransform decoding is not implemented');
	});

	test('still validates field paths in an ignored entity baseline', () => {
		const { parser, create } = setup([], true);
		parser.onlyGameRules = true;
		expect(() => create([bits(firstFieldPath)])).toThrow('Noo field');
	});

	test.each([false, true])('rejects truncated baseline values (ignored=%s)', ignored => {
		const { parser, create } = setup([valueField('name', Decoders.StringDecoder)], true);
		parser.onlyGameRules = ignored;
		expect(() => create([bits(firstFieldPath, [0x61, 8])])).toThrow('BitBuffer exhausted');
	});
});

describe('EntityParser update-local container cache', () => {
	const vector = () =>
		new Field(FieldTypeEnum.Vector, {
			field_enum: valueField('element', Decoders.UnsignedDecoder),
			decoder: Decoders.UnsignedDecoder,
			varName: 'values',
			elementBaseType: 'uint32'
		});

	test('looks up consecutive elements once, but observes user replacements on the next update', () => {
		const { parser, write, create } = setup([vector()], true);
		create();
		let stored: unknown;
		let reads = 0;
		const props = parser.directEntities![7]!.properties;
		Object.defineProperty(props, 'CWeaponTest.values', {
			get() {
				reads++;
				return stored;
			},
			set(value: unknown) {
				stored = value;
			},
			configurable: true,
			enumerable: true
		});
		for (let i = 0; i < 3; i++) write(path(0, i), i);
		parser.decodeEntityUpdate(new BitBuffer(Uint8Array.of(1, 2, 3)), 7, 3);
		expect(reads).toBe(1);
		expect((stored as Uint32Array).subarray(0, 3)).toEqual(Uint32Array.of(1, 2, 3));
		stored = Uint32Array.of(9, 8, 7);
		write(path(0, 2), 0);
		parser.decodeEntityUpdate(new BitBuffer(Uint8Array.of(4)), 7, 1);
		expect(reads).toBe(2);
		expect(stored).toEqual(Uint32Array.of(9, 8, 4));
		parser.directEntities![7]!.properties = { 'CWeaponTest.values': Uint32Array.of(5, 6, 7) };
		parser.decodeEntityUpdate(new BitBuffer(Uint8Array.of(8)), 7, 1);
		expect(parser.directEntities![7]!.properties['CWeaponTest.values']).toEqual(Uint32Array.of(5, 6, 8));
	});

	test('refreshes the cached typed array after growth, preserving earlier elements', () => {
		const { parser, write, create } = setup([vector()], true);
		create();
		for (const [i, index] of [0, 1, 40, 41].entries()) write(path(0, index), i);
		parser.decodeEntityUpdate(new BitBuffer(Uint8Array.of(11, 12, 13, 14)), 7, 4);
		const values = parser.directEntities![7]!.properties['CWeaponTest.values'] as Uint32Array;
		expect(values.length).toBe(64);
		expect([values[0], values[1], values[40], values[41]]).toEqual([11, 12, 13, 14]);
	});

	test('invalidates the cached array for ordered resizes in the same update', () => {
		const { parser, write, create } = setup([vector()], true);
		create();
		const paths = [path(0), path(0, 0), path(0, 1), path(0), path(0, 0), path(0), path(0, 2)];
		paths.forEach((fp, i) => write(fp, i));
		parser.decodeEntityUpdate(new BitBuffer(Uint8Array.of(4, 11, 12, 1, 18, 3, 19)), 7, paths.length);
		expect(parser.directEntities![7]!.properties['CWeaponTest.values']).toEqual(Uint32Array.of(18, 0, 19));
	});

	test('shares a container across different serializer leaves without sharing element objects', () => {
		const { parser, write, create } = setup(
			[
				new Field(FieldTypeEnum.Vector, {
					field_enum: new Field(FieldTypeEnum.Serializer, {
						serializer: {
							name: 'Child',
							fields: [valueField('x', Decoders.UnsignedDecoder), valueField('y', Decoders.StringDecoder)]
						}
					}),
					decoder: Decoders.UnsignedDecoder,
					varName: 'objects'
				})
			],
			true
		);
		create();
		[path(0, 1, 0), path(0, 1, 1), path(0, 2, 1)].forEach((fp, i) => write(fp, i));
		parser.decodeEntityUpdate(new BitBuffer(Uint8Array.of(7, 0x61, 0, 0x62, 0)), 7, 3);
		const objects = parser.directEntities![7]!.properties['CWeaponTest.objects'] as unknown[];
		expect(objects).toEqual([, { x: 7, y: 'a' }, { y: 'b' }]);
		expect(objects[1]).not.toBe(objects[2]);
	});

	test('invalidates on a scalar replacement of the same property key', () => {
		const { parser, write, create } = setup([vector(), valueField('values', Decoders.BinaryBlockDecoder)], true);
		create();
		[path(0, 0), path(1), path(0, 1)].forEach((fp, i) => write(fp, i));
		parser.decodeEntityUpdate(new BitBuffer(Uint8Array.of(11, 2, 20, 21, 23)), 7, 3);
		expect(parser.directEntities![7]!.properties['CWeaponTest.values']).toEqual(Uint8Array.of(20, 23));
	});
});

describe('EntityParser compact updates', () => {
	test('owns reusable records rather than copying or retaining paths, preserving full element indices', () => {
		const { parser, write, create } = setup(
			[
				valueField('scalar', Decoders.UnsignedDecoder),
				new Field(FieldTypeEnum.Vector, {
					field_enum: valueField('element', Decoders.UnsignedDecoder),
					decoder: Decoders.UnsignedDecoder,
					varName: 'values'
				})
			],
			true
		);
		const { updates, arrayIndices } = parser as unknown as {
			updates: { isResize: boolean }[];
			arrayIndices: number[];
		};
		expect(updates).toHaveLength(0);
		const scratch = path(1, 65537);
		write(scratch, 0);
		const first = updates[0]!;
		expect(arrayIndices[0]).toBe(65537);
		expect(first).not.toHaveProperty('path');
		scratch.path[1] = 2;
		expect(arrayIndices[0]).toBe(65537);
		write(path(1), 0);
		expect(updates[0]!.isResize).toBe(true);
		expect(arrayIndices[0]).toBe(-1);
		write(path(0), 0);
		expect(updates[0]!.isResize).toBe(false);
		write(path(1, 65537), 1);
		expect(updates).toHaveLength(2);
		expect(updates[1]).toBe(first);
		create();
		parser.decodeEntityUpdate(new BitBuffer(Uint8Array.of(3, 4)), 7, 2);
		const props = parser.directEntities![7]!.properties;
		expect(props['CWeaponTest.scalar']).toBe(3);
		expect((props['CWeaponTest.values'] as number[])[65537]).toBe(4);
		expect((props['CWeaponTest.values'] as number[])[1]).toBeUndefined();
	});

	test('retains the 8192-path limit', () => {
		const { parser, write } = setup([valueField('value', Decoders.UnsignedDecoder)], false);
		const fp = path(0);
		for (let i = 0; i < 8192; i++) write(fp, i);
		expect(() => write(fp, 8192)).toThrow('Too many entity field paths');
		expect((parser as unknown as { updates: unknown[] }).updates).toHaveLength(8192);
	});

	test('does not truncate indices to 16 or 32 bits', () => {
		const { parser, write, create } = setup(
			[
				new Field(FieldTypeEnum.Array, {
					field_enum: valueField('value', Decoders.UnsignedDecoder),
					length: 1,
					varName: 'values'
				})
			],
			true
		);
		create();
		write(path(0, 0x100000001), 0);
		parser.decodeEntityUpdate(new BitBuffer(Uint8Array.of(42)), 7, 1);
		const values = parser.directEntities![7]!.properties['CWeaponTest.values'] as number[];
		expect(values[0x100000001]).toBe(42);
		expect(values[1]).toBeUndefined();
	});

	test('plans use class-local metadata when cloned container fields share a leaf name', () => {
		const source = new Field(FieldTypeEnum.Array, {
			field_enum: valueField('reserve', Decoders.UnsignedDecoder),
			length: 2,
			varName: 'ammo',
			elementBaseType: 'int32'
		});
		const a = setup([source.clone()], true, 'CWeaponA');
		const fieldsB = [source.clone()];
		const info = a.classInfo;
		constructorFieldHelper.traverseFields(
			fieldsB,
			'CWeaponB',
			info.propIdToName,
			{ id: 1 },
			info.propIdToDecoder,
			info.propIdToInfo
		);
		info.classes.push({ class_id: 1, name: 'CWeaponB', serializer: { name: 'CWeaponB', fields: fieldsB } });
		info.classIdBits = 2;
		info.propInfoById[1] = info.propIdToInfo[1];
		info.propNameById[1] = info.propIdToName[1];
		const parser = new EntityParser(info, () => {});
		parser.directEntities = [];
		parser.directPropInfoById = info.propInfoById;
		for (const classId of [0, 1, 0, 1]) {
			parser.createEntity(new BitBuffer(bits([classId, 2], [0, 17], [0, 8])), classId + 7, []);
			parser.writeFp(path(0, 1), 0, info.classes[classId]!.serializer);
			parser.decodeEntityUpdate(new BitBuffer(Uint8Array.of(10 + classId)), classId + 7, 1);
		}
		expect(parser.directEntities[7]!.properties).toEqual({ 'CWeaponA.ammo': Int32Array.of(0, 10) });
		expect(parser.directEntities[8]!.properties).toEqual({ 'CWeaponB.ammo': Int32Array.of(0, 11) });
	});

	test('separate parser instances own their paths and pending updates', () => {
		const a = setup([valueField('a', Decoders.UnsignedDecoder)], true);
		const b = setup([valueField('b', Decoders.StringDecoder)], true);
		a.create();
		b.create();
		a.write(path(0), 0);
		b.write(path(0), 0);
		b.parser.fieldPath.path[0] = 500;
		expect(a.parser.fieldPath.path[0]).toBe(-1);
		a.parser.decodeEntityUpdate(new BitBuffer(Uint8Array.of(42)), 7, 1);
		b.parser.decodeEntityUpdate(new BitBuffer(Uint8Array.of(0x61, 0)), 7, 1);
		expect(a.parser.directEntities![7]!.properties).toEqual({ 'CWeaponTest.a': 42 });
		expect(b.parser.directEntities![7]!.properties).toEqual({ 'CWeaponTest.b': 'a' });
	});

	test('validates all field paths before consuming values', () => {
		const { parser, create } = setup([valueField('a', Decoders.UnsignedDecoder)], true);
		create();
		// Two PlusOne paths followed by Finish, then a value. The second field does not exist.
		const reader = new BitBuffer(bits([0, 1], [0, 1], [1, 2], [42, 8]));
		expect(() => parser.updateEntity(reader, 7)).toThrow('Noo field');
		expect(parser.directEntities![7]!.properties).toEqual({});
	});

	test.each([FieldTypeEnum.Value, FieldTypeEnum.Serializer, FieldTypeEnum.Pointer])(
		'rejects invalid children of field type %s',
		type => {
			const field =
				type === FieldTypeEnum.Value
					? valueField('value', Decoders.UnsignedDecoder)
					: type === FieldTypeEnum.Serializer
						? new Field(type, { serializer: { name: 'Child', fields: [null] } })
						: new Field(type, {
								serializer: { name: 'Child', fields: [null] },
								decoder: Decoders.BooleanDecoder
							});
			const { write } = setup([field], false);
			expect(() => write(path(0, 0), 0)).toThrow('ILLEGAL PATH');
		}
	);
});
