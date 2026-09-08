import { BinaryWriter } from '@bufbuild/protobuf/wire';

export const varint = (value: number) => new BinaryWriter().uint32(value).finish();
export const bytesField = (field: number, bytes: Uint8Array) =>
	new BinaryWriter()
		.uint32((field << 3) | 2)
		.bytes(bytes)
		.finish();

export const demoFrame = (type: number, body: Uint8Array = new Uint8Array(0), tick = 124341): Buffer =>
	Buffer.concat([varint(type), varint(tick), varint(body.length), body]);

export const demoFile = (...frames: Uint8Array[]): Buffer => {
	const magic = Buffer.alloc(16);
	magic.write('PBDEMS2');
	return Buffer.concat([magic, ...frames]);
};

/** Packet message headers use LSB-first ubitvars and need not be byte aligned. */
export const networkPacket = (messages: { id: number; body: Uint8Array }[]): Uint8Array => {
	const bits: number[] = [];
	const write = (value: number, count: number) => {
		for (let i = 0; i < count; i++) bits.push((value >>> i) & 1);
	};
	for (const { id, body } of messages) {
		if (id < 16) write(id, 6);
		else {
			const extra = id < 256 ? 4 : id < 4096 ? 8 : 28;
			write((id & 15) | (extra === 4 ? 16 : extra === 8 ? 32 : 48), 6);
			write(id >>> 4, extra);
		}
		for (const byte of varint(body.length)) write(byte, 8);
		for (const byte of body) write(byte, 8);
	}
	const result = new Uint8Array(Math.ceil(bits.length / 8));
	for (let i = 0; i < bits.length; i++) result[i >>> 3]! |= bits[i]! << (i & 7);
	return result;
};
