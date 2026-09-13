import { BinaryWriter } from '@bufbuild/protobuf/wire';
import { bytesField, demoFile, demoFrame, networkPacket, varint } from './demo.js';

/** Tiny complete schema plus independent and dependent FullPackets, with a reused pawn slot. */
export function checkpointDemo(
	options: {
		brokenDelta?: boolean;
		dependentFullSnapshot?: boolean;
		firstFullPacketDelta?: boolean;
		paddingBytes?: number;
	} = {}
) {
	const serializer = new BinaryWriter().uint32(8).uint32(0).finish();
	const schema = new BinaryWriter().uint32(10).bytes(serializer).uint32(18).string('CCSPlayerPawn').finish();
	const cls = new BinaryWriter().uint32(8).uint32(0).uint32(18).string('CCSPlayerPawn').finish();
	const entity = (kind: 'create' | 'update' | 'delete', delta = kind !== 'create') => {
		const parts: [number, number][] = [
			[1, 6],
			[kind === 'create' ? 2 : kind === 'delete' ? 3 : 0, 2]
		];
		if (kind === 'create') parts.push([0, 1], [0, 17], [0, 8]);
		if (kind !== 'delete') parts.push([1, 2]); // field-path stop: no properties
		const out = new Uint8Array(Math.ceil(parts.reduce((sum, [, bits]) => sum + bits, 0) / 8));
		let offset = 0;
		for (const [value, bits] of parts)
			for (let i = 0; i < bits; i++, offset++) out[offset >>> 3]! |= ((value >>> i) & 1) << (offset & 7);
		const message = new BinaryWriter().uint32(16).uint32(1).uint32(24).bool(delta).uint32(58).bytes(out).finish();
		return bytesField(3, networkPacket([{ id: 55, body: message }]));
	};
	const full = (kind: 'create' | 'update', name?: string, delta?: boolean) => {
		const packet = bytesField(2, entity(kind, delta));
		if (!name) return packet;
		const user = new BinaryWriter().uint32(10).string(name).uint32(24).uint32(1).finish();
		const item = new BinaryWriter().uint32(10).string('1').uint32(18).bytes(user).finish();
		const table = new BinaryWriter().uint32(10).string('userinfo').uint32(18).bytes(item).finish();
		return Buffer.concat([bytesField(1, bytesField(1, table)), packet]);
	};
	return demoFile(
		demoFrame(1, new Uint8Array(), 0xffffffff),
		demoFrame(4, bytesField(1, Buffer.concat([varint(schema.length), schema])), 0xffffffff),
		demoFrame(5, bytesField(1, cls), 0xffffffff),
		demoFrame(7, entity('create'), 0),
		demoFrame(10, new Uint8Array(options.paddingBytes ?? 1024), 1),
		demoFrame(13, full(options.firstFullPacketDelta ? 'update' : 'create', 'Alpha'), 10),
		demoFrame(
			7,
			options.brokenDelta
				? bytesField(3, networkPacket([{ id: 55, body: Uint8Array.of(16, 1, 24, 1, 58, 0) }]))
				: entity('update'),
			11
		),
		demoFrame(13, full('update', 'Beta', options.dependentFullSnapshot ? false : undefined), 15), // cannot restore without prior entity
		demoFrame(7, entity('delete'), 20),
		demoFrame(13, bytesField(2, entity('create')), 40),
		demoFrame(7, entity('update'), 41),
		demoFrame(0, undefined, 42)
	);
}
