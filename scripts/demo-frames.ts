import fs from 'fs';
import snappy from 'snappy';
import { BinaryReader } from '@bufbuild/protobuf/wire';
import { EDemoCommands } from '../src/ts-proto/demo.js';

/** Read raw demo frames for offline diagnostics, decompressing only on demand. */
export function* demoFrames(filePath: string) {
	const file = fs.readFileSync(filePath);
	if (file.length < 16 || file.toString('ascii', 0, 7) !== 'PBDEMS2') {
		throw new Error('Expected a PBDEMS2 demo');
	}
	const input = file.subarray(16);
	const reader = new BinaryReader(input);
	while (reader.pos < reader.len) {
		const command = reader.uint32();
		reader.uint32(); // tick
		const size = reader.uint32();
		if (size > reader.len - reader.pos) throw new RangeError('Truncated demo frame');
		const raw = input.subarray(reader.pos, reader.pos + size);
		reader.pos += size;
		const type = command & ~EDemoCommands.DEM_IsCompressed;
		yield {
			type,
			bytes: (): Uint8Array =>
				command & EDemoCommands.DEM_IsCompressed ? (snappy.uncompressSync(raw) as Buffer) : raw
		};
		if (type === EDemoCommands.DEM_Stop) return;
	}
}
