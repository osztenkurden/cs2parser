import { expect, test } from 'bun:test';
import { EntityWasm } from '../../src/parser/entities/entityWasm.js';
import { EntityParser, type FieldPlan } from '../../src/parser/entities/entityParser.js';
import {
	constructorFieldHelper,
	Decoders,
	Field,
	FieldTypeEnum,
	type Decoder,
	type PropInfo
} from '../../src/parser/entities/constructorFields.js';
import type { ClassInfo } from '../../src/parser/entities/classInfo.js';
import type { CSVCMsg_PacketEntities } from '../../src/ts-proto/netmessages.js';
import { BitBuffer } from '../../src/parser/ubitreader.js';
import { entityWasmBase64 } from '../../src/parser/entities/entityWasmBytes.js';

const bits = (...parts: [number, number][]): Uint8Array => {
	const out = new Uint8Array(Math.ceil(parts.reduce((sum, [, n]) => sum + n, 0) / 8));
	let pos = 0;
	for (const [value, n] of parts)
		for (let i = 0; i < n; i++, pos++) out[pos >>> 3]! |= ((value >>> i) & 1) << (pos & 7);
	return out;
};
const packet = (data: Uint8Array, entries = 1) =>
	({ entity_data: data, updated_entries: entries }) as CSVCMsg_PacketEntities;
const leaf = (decoder: Decoder): FieldPlan => ({
	lifecycle: false,
	meta: { name: 'value' },
	decoder,
	propId: 0,
	isResize: false,
	indexDepth: -1,
	children: null,
	element: null,
	pathError: 'path'
});

test('entity WASM has no host imports', () => {
	const module = new WebAssembly.Module(Uint8Array.from(atob(entityWasmBase64), c => c.charCodeAt(0)));
	expect(WebAssembly.Module.imports(module)).toEqual([]);
});

test('lifecycle, unsupported decoders, truncation and capacity limits request JS fallback', () => {
	for (const decoder of [Decoders.CTransformDecoder, 999, 0]) {
		const wasm = new EntityWasm(() => [leaf(decoder)]);
		wasm.setEntity(0, 0);
		expect(wasm.decode(packet(bits([0, 8], [2, 3], [1, 32])))).toBeLessThan(0);
	}
	const wasm = new EntityWasm(() => [leaf(Decoders.NoscaleDecoder)]);
	wasm.setEntity(0, 0);
	const valid = bits([0, 8], [2, 3], [0x3f800000, 32]);
	expect(wasm.decode(packet(valid))).toBe(1);
	expect(wasm.value(0)).toBe(1);
	for (const count of [-1, 1.5, 2 ** 32, NaN, Infinity]) expect(wasm.decode(packet(valid, count))).toBeLessThan(0);
	expect(wasm.decode({ ...packet(valid), has_pvs_vis_bits_deprecated: -1 })).toBe(1);
	expect(wasm.decode({ ...packet(bits([0, 8], [1, 2])), has_pvs_vis_bits_deprecated: 1 })).toBe(0);
	for (const control of [1, 2, 3]) expect(wasm.decode(packet(bits([0, 6], [control, 2])))).toBeLessThan(0);
	expect(wasm.decode(packet(valid.subarray(0, -1)))).toBeLessThan(0);
	expect(wasm.decode(packet(new Uint8Array(1048577)))).toBeLessThan(0);
	wasm.setEntity(0, 1024);
	expect(wasm.enabled).toBe(false);
	expect(wasm.decode(packet(valid))).toBeLessThan(0);
});

test('returned binary values own their storage across packet reuse and source mutation', () => {
	const wasm = new EntityWasm(() => [leaf(Decoders.BinaryBlockDecoder)]);
	wasm.setEntity(0, 0);
	const input = bits([0, 8], [2, 3], [3, 8], [1, 8], [2, 8], [3, 8]);
	expect(wasm.decode(packet(input))).toBe(1);
	const retained = wasm.value(0);
	input.fill(0);
	expect(wasm.decode(packet(bits([0, 8], [2, 3], [3, 8], [9, 8], [8, 8], [7, 8])))).toBe(1);
	expect(retained).toEqual(Uint8Array.of(1, 2, 3));
});

test('container indices retain more than 32 bits', () => {
	const element = { ...leaf(Decoders.UnsignedDecoder), indexDepth: 1 };
	const root = { ...leaf(Decoders.UnsignedDecoder), meta: undefined, element };
	const wasm = new EntityWasm(() => [root]);
	wasm.setEntity(0, 0);
	const data = bits(
		[0, 8],
		[0, 1],
		[21275, 15],
		[0, 4],
		[0x7fffffff, 31],
		[11, 5],
		[0, 4],
		[0x7fffffff, 31],
		[1, 2],
		[0, 8],
		[7, 8],
		[9, 8]
	);
	expect(wasm.decode(packet(data))).toBe(2);
	expect(wasm.values[1]).toBe(0x7fffffff);
	expect(wasm.values[8]).toBe(0x100000003);
	expect(wasm.value(0)).toBe(7);
	expect(wasm.value(1)).toBe(9);
});

const parser = (decoder: Decoder) => {
	const fields = [new Field(FieldTypeEnum.Value, { name: 'value', decoder, prop_id: 0 })];
	const names: Record<number, string> = {},
		decoders: Record<number, Decoder> = {},
		info: Record<number, PropInfo> = {};
	constructorFieldHelper.traverseFields(fields, 'Test', names, { id: 0 }, decoders, info);
	const schema: ClassInfo = {
		classes: [{ class_id: 0, name: 'Test', serializer: { name: 'Test', fields } }],
		classIdBits: 1,
		propIdToName: names,
		propIdToDecoder: decoders,
		propIdToInfo: info,
		propNameById: Object.values(names),
		propInfoById: Object.values(info)
	};
	const result = new EntityParser(schema, () => {});
	result.directEntities = [];
	result.directPropInfoById = schema.propInfoById;
	result.createEntity(new BitBuffer(bits([0, 1], [0, 17], [0, 8])), 0, []);
	return result;
};

test('fallback preserves partial JS effects on malformed packets and mirrors lifecycle changes', () => {
	const reader = parser(Decoders.NoscaleDecoder);
	reader.createEntity(new BitBuffer(bits([0, 1], [0, 17], [0, 8])), 1, []);
	const malformed = bits([0, 8], [2, 3], [0x3f800000, 32], [0, 8], [2, 3], [1, 1]);
	expect(() => reader.parseEntityPacket(packet(malformed, 2), [])).toThrow('BitBuffer exhausted');
	expect(reader.directEntities![0]!.properties['Test.value']).toBe(1);
	expect(reader.directEntities![1]!.properties['Test.value']).toBeUndefined();
	reader.parseEntityPacket(packet(bits([1, 6], [3, 2])), []);
	expect(reader.directEntities![1]).toBeUndefined();
	expect(() => reader.parseEntityPacket(packet(bits([1, 6], [0, 2], [2, 3], [0, 32])), [])).toThrow('No entiy');
	reader.parseEntityPacket(packet(bits([1, 6], [2, 2], [0, 1], [0, 17], [0, 8], [2, 3], [0x40000000, 32])), []);
	expect(reader.directEntities![1]!.properties['Test.value']).toBe(2);
	reader.parseEntityPacket(packet(bits([1, 6], [0, 2], [2, 3], [0x40400000, 32])), []);
	expect(reader.directEntities![1]!.properties['Test.value']).toBe(3);
});

test('an unavailable WASM instance leaves ordinary JS entity decoding usable', () => {
	const Instance = WebAssembly.Instance;
	WebAssembly.Instance = new Proxy(Instance, {
		construct() {
			throw new Error('WASM unavailable');
		}
	});
	try {
		const reader = parser(Decoders.NoscaleDecoder);
		reader.parseEntityPacket(packet(bits([0, 8], [2, 3], [0x3f800000, 32])), []);
		expect(reader.directEntities![0]!.properties['Test.value']).toBe(1);
	} finally {
		WebAssembly.Instance = Instance;
	}
});
