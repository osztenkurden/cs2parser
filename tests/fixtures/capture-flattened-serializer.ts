/**
 * One-off capture helpers for the prost / classInfo parity tests.
 *
 * Walks the first few frames of a .dem file and extracts (a) the inner
 * `CSVCMsg_FlattenedSerializer` blob from `CDemoSendTables.data` and
 * (b) the raw `CDemoClassInfo` bytes. Tests consume these to verify the
 * Rust port against ts-proto / the JS parseClassInfo output.
 */
import fs from 'fs';
import snappy from 'snappy';
import { EDemoCommands, CDemoSendTables } from '../../src/ts-proto/demo.js';
import { BitBuffer } from '../../src/parser/ubitreader.js';

function captureFrames(demoPath: string): { sendTablesInner: Buffer; classInfoBytes: Buffer } {
	const data = fs.readFileSync(demoPath);
	const reader = new BitBuffer(data.subarray(16));

	let sendTablesInner: Buffer | null = null;
	let classInfoBytes: Buffer | null = null;

	while (reader.RemainingBytes > 0 && (!sendTablesInner || !classInfoBytes)) {
		const cmdBase = reader.ReadUVarInt32();
		reader.ReadUVarInt32(); // tick
		const size = reader.ReadUVarInt32();
		const cmd = cmdBase & ~EDemoCommands.DEM_IsCompressed;
		const compressed = (cmdBase & EDemoCommands.DEM_IsCompressed) !== 0;

		if (cmd === EDemoCommands.DEM_SendTables && !sendTablesInner) {
			const payload = Buffer.alloc(size);
			reader.readBytes(payload);
			const decompressed = compressed ? (snappy.uncompressSync(payload) as Buffer) : payload;
			const sendTables = CDemoSendTables.decode(decompressed);
			const inner = new BitBuffer(sendTables.data!);
			const innerSize = inner.ReadUVarInt32();
			const out = Buffer.alloc(innerSize);
			inner.readBytes(out);
			sendTablesInner = out;
		} else if (cmd === EDemoCommands.DEM_ClassInfo && !classInfoBytes) {
			const payload = Buffer.alloc(size);
			reader.readBytes(payload);
			classInfoBytes = compressed ? (snappy.uncompressSync(payload) as Buffer) : payload;
		} else {
			reader.skipBytesBetter(size);
		}
	}

	if (!sendTablesInner) throw new Error('DEM_SendTables not found in demo');
	if (!classInfoBytes) throw new Error('DEM_ClassInfo not found in demo');
	return { sendTablesInner, classInfoBytes };
}

export function captureFlattenedSerializerBytes(demoPath: string): Buffer {
	return captureFrames(demoPath).sendTablesInner;
}

export function captureClassInfoBytes(demoPath: string): Buffer {
	return captureFrames(demoPath).classInfoBytes;
}
