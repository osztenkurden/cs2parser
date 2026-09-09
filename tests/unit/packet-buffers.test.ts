import { expect, test } from 'bun:test';
import { BinaryWriter } from '@bufbuild/protobuf/wire';
import { DemoReader, EntityMode } from '../../src/index.js';
import { ParseSession } from '../../src/parser/entities/parseSession.js';
import { EDemoCommands } from '../../src/ts-proto/demo.js';
import { EBaseGameEvents } from '../../src/ts-proto/gameevents.js';
import { SVC_Messages, CSVCMsg_PacketEntities } from '../../src/ts-proto/netmessages.js';
import { bytesField, networkPacket, varint } from '../helpers/demo.js';
import { buildFragment } from './broadcast/helpers.js';

const setup = (onEntity: (message: CSVCMsg_PacketEntities, baselines: Uint8Array[]) => void = () => {}) => {
	const reader = new DemoReader();
	const session = ParseSession.forBroadcast(
		EntityMode.ALL,
		queue => {
			for (const [name, data] of queue) reader.emit(name, data as never);
			queue.length = 0;
		},
		reader
	);
	// Isolate packet storage/order from the already separately tested field decoder.
	Object.assign(session, { entityParser: { parseEntityPacket: onEntity }, baselines: [Uint8Array.of(42)] });
	const send = (messages: { id: number; body: Uint8Array }[]) =>
		session.pushBroadcastFragment(
			buildFragment([{ cmd: EDemoCommands.DEM_Packet, tick: 1, payload: networkPacket(messages) }]),
			0
		);
	return { reader, session, send };
};

test('queued entity payloads survive arena segments and later table changes', () => {
	const values = [
		new Uint8Array(40 * 1024).fill(1),
		new Uint8Array(96 * 1024).fill(2),
		new Uint8Array(300 * 1024).fill(3)
	];
	const seen: Uint8Array[] = [];
	const { send } = setup((message, baselines) => {
		expect(baselines).toEqual([]);
		seen.push(Uint8Array.from(message.entity_data!));
	});
	for (let repeat = 0; repeat < 2; repeat++) {
		send([
			...values.map(value => ({ id: SVC_Messages.svc_PacketEntities, body: bytesField(7, value) })),
			{ id: SVC_Messages.svc_ClearAllStringTables, body: new Uint8Array(0) }
		]);
	}
	expect(seen).toEqual([...values, ...values]);
});

test('core message scratch grows beyond 256 KiB without truncating retained decoded strings', () => {
	const { reader, send } = setup();
	const names: string[] = [];
	reader.on('gameeventlist', message => names.push(message.descriptors[0]!.name!));
	const large = 'x'.repeat(300 * 1024);
	for (const name of [large, 'small']) {
		const descriptor = new BinaryWriter().uint32(8).int32(1).uint32(18).string(name).finish();
		send([{ id: EBaseGameEvents.GE_Source1LegacyGameEventList, body: bytesField(1, descriptor) }]);
	}
	expect(names).toEqual([large, 'small']);
});

test('queued payloads are cleared when packet protobuf or entity decoding throws', () => {
	for (const failure of ['protobuf', 'entity']) {
		let fail = failure === 'entity';
		let entities = 0;
		const { reader, send } = setup(() => {
			if (fail) throw new Error('Entity failure');
			entities++;
		});
		const events: number[] = [];
		reader.on('gameevent', message => events.push(message.eventid!));
		const event = (id: number) => ({ id: EBaseGameEvents.GE_Source1LegacyGameEvent, body: Uint8Array.of(16, id) });
		const entity = { id: SVC_Messages.svc_PacketEntities, body: bytesField(7, Uint8Array.of(1)) };
		expect(() =>
			send([
				event(1),
				entity,
				...(failure === 'protobuf' ? [{ id: SVC_Messages.svc_ServerInfo, body: Uint8Array.of(10, 255) }] : [])
			])
		).toThrow();
		fail = false;
		send([event(2), entity]);
		expect(events).toEqual([2]);
		expect(entities).toBe(1);
	}
});

test('tiny packets advertising huge messages reject before any body allocation or scratch growth', () => {
	for (const mode of [EntityMode.ALL, EntityMode.NONE]) {
		for (const raw of [false, true]) {
			for (const id of [
				0,
				SVC_Messages.svc_PacketEntities,
				SVC_Messages.svc_ServerInfo,
				SVC_Messages.svc_CreateStringTable,
				SVC_Messages.svc_UpdateStringTable,
				SVC_Messages.svc_ClearAllStringTables,
				EBaseGameEvents.GE_Source1LegacyGameEvent,
				EBaseGameEvents.GE_Source1LegacyGameEventList
			]) {
				const { reader, session } = setup();
				Object.assign(session, { entityMode: mode });
				if (raw) reader.on('anymessage', () => {});
				const bits: number[] = [];
				const write = (value: number, count: number) => {
					for (let i = 0; i < count; i++) bits.push((value >>> i) & 1);
				};
				if (id < 16) write(id, 6);
				else {
					const extra = id < 256 ? 4 : 8;
					write((id & 15) | (extra === 4 ? 16 : 32), 6);
					write(id >>> 4, extra);
				}
				for (const byte of varint(0x7fffffff)) write(byte, 8);
				const packet = new Uint8Array(Math.ceil(bits.length / 8));
				for (let i = 0; i < bits.length; i++) packet[i >>> 3]! |= bits[i]! << (i & 7);
				expect(() =>
					session.pushBroadcastFragment(
						buildFragment([{ cmd: EDemoCommands.DEM_Packet, tick: 1, payload: packet }]),
						0
					)
				).toThrow('Truncated packet message');
				expect(Reflect.get(session, 'packetBuffer').length).toBe(0);
				expect(Reflect.get(session, 'entityBuffer').length).toBe(0);
			}
		}
	}
});

const project = (message: CSVCMsg_PacketEntities) => ({
	updated_entries: message.updated_entries,
	entity_data: message.entity_data,
	has_pvs_vis_bits_deprecated: message.has_pvs_vis_bits_deprecated
});

test('queued entities match generated decode for reordered, repeated and absent fields', () => {
	const fields = [
		new BinaryWriter().uint32(16).int32(-1).finish(),
		bytesField(7, Uint8Array.of(1, 2, 3)),
		new BinaryWriter().uint32(128).uint32(0xffffffff).finish()
	];
	const bodies = [new Uint8Array(0)];
	for (const order of [
		[0, 1, 2],
		[0, 2, 1],
		[1, 0, 2],
		[1, 2, 0],
		[2, 0, 1],
		[2, 1, 0]
	]) {
		bodies.push(Buffer.concat(order.map(index => fields[index]!)));
	}
	bodies.push(...fields);
	bodies.push(
		Buffer.concat([
			...fields,
			new BinaryWriter().uint32(128).uint32(0).uint32(16).int32(2147483647).finish(),
			bytesField(7, new Uint8Array(0))
		])
	);
	let actual: ReturnType<typeof project> | undefined;
	const { send } = setup(message => {
		actual = project(message);
	});
	for (const body of bodies) {
		send([{ id: SVC_Messages.svc_PacketEntities, body }]);
		expect(actual).toEqual(project(CSVCMsg_PacketEntities.decode(body)));
	}
});

test('queued entities match generated wrong-wire, unknown and terminal-tag handling', () => {
	const fields = new BinaryWriter().uint32(16).int32(12).uint32(128).uint32(1).finish();
	const body = new BinaryWriter()
		.raw(fields)
		.uint32(18)
		.bytes(Uint8Array.of(9)) // updated_entries with the wrong wire type
		.uint32(56)
		.uint32(100) // entity_data with the wrong wire type
		.uint32(133)
		.fixed32(42) // has_pvs_vis_bits_deprecated with the wrong wire type
		.uint32(800)
		.uint64(0xffffffffffffffffn)
		.uint32(809)
		.fixed64(123n)
		.uint32(818)
		.bytes(Uint8Array.of(255))
		.uint32(827)
		.uint32(8)
		.uint32(1)
		.uint32(828) // unknown group
		.uint32(837)
		.fixed32(456)
		.raw(bytesField(7, Uint8Array.of(7)))
		.finish();
	const bodies = [body, ...[0, 4, 132].map(tag => Buffer.concat([body, varint(tag), fields]))];
	let actual: ReturnType<typeof project> | undefined;
	const { send } = setup(message => {
		actual = project(message);
	});
	for (const body of bodies) {
		send([{ id: SVC_Messages.svc_PacketEntities, body }]);
		expect(actual).toEqual(project(CSVCMsg_PacketEntities.decode(body)));
	}
});

test('queued entities reject malformed consumed data and wire boundaries like generated decode', () => {
	const malformed = [
		Uint8Array.of(128), // truncated tag
		Uint8Array.of(16),
		Uint8Array.of(16, 128),
		Buffer.concat([varint(16), new Uint8Array(10).fill(128)]),
		varint(128),
		Buffer.concat([varint(128), new Uint8Array(10).fill(128)]),
		Uint8Array.of(58),
		Uint8Array.of(58, 128),
		Uint8Array.of(58, 2, 1),
		Buffer.concat([varint(58), varint(0xffffffff)]),
		Uint8Array.of(17, 1), // wrong-wire consumed field, truncated fixed64
		Buffer.concat([varint(800), Uint8Array.of(128)]),
		Buffer.concat([varint(818), varint(2), Uint8Array.of(1)]),
		varint(827), // unterminated unknown group
		varint(806), // invalid wire type
		Uint8Array.of(122, 2, 8) // truncated skipped metadata envelope
	];
	const { send } = setup();
	for (const body of malformed) {
		expect(() => CSVCMsg_PacketEntities.decode(body)).toThrow();
		expect(() => send([{ id: SVC_Messages.svc_PacketEntities, body }])).toThrow();
	}
});

test('queued entities retain generated validation of unused metadata contents', () => {
	const metadata = [
		...[15, 19, 23].map(field => bytesField(field, Uint8Array.of(8, 128))),
		bytesField(22, Uint8Array.of(128)), // unterminated packed sint32
		Buffer.concat([varint(8), new Uint8Array(10).fill(128), Uint8Array.of(0)])
	];
	const { send } = setup();
	for (const unused of metadata) {
		const body = Buffer.concat([unused, Uint8Array.of(16, 3), bytesField(7, Uint8Array.of(7))]);
		expect(() => CSVCMsg_PacketEntities.decode(body)).toThrow();
		expect(() => send([{ id: SVC_Messages.svc_PacketEntities, body }])).toThrow();
	}
});
