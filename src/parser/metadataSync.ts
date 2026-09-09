import fs from 'node:fs';
import { SnappyDecoder } from '../compression/wasm.js';
import { CDemoFileHeader, CDemoFileInfo, EDemoCommands } from '../ts-proto/demo.js';
import type { CSVCMsg_ServerInfo } from '../ts-proto/netmessages.js';
import { parseMetadataFrameHeader, parseServerInfoPacket } from './metadata.js';

export function parseMetadataSync(source: string | Uint8Array, kind: 'header'): CDemoFileHeader | null;
export function parseMetadataSync(source: string | Uint8Array, kind: 'serverInfo'): CSVCMsg_ServerInfo | null;
export function parseMetadataSync(source: string | Uint8Array, kind: 'fileInfo'): CDemoFileInfo | null;
export function parseMetadataSync(
	source: string | Uint8Array,
	kind: 'header' | 'serverInfo' | 'fileInfo'
): CDemoFileHeader | CSVCMsg_ServerInfo | CDemoFileInfo | null {
	if (typeof source !== 'string' && !(source instanceof Uint8Array)) {
		throw new TypeError('Expected a file path or Uint8Array');
	}
	let fd: number | undefined;
	const snappy = new SnappyDecoder();
	try {
		let size: number;
		if (typeof source === 'string') {
			fd = fs.openSync(source, 'r');
			size = fs.fstatSync(fd).size;
		} else {
			size = source.length;
		}
		const read = (offset: number, length: number): Uint8Array => {
			if (source instanceof Uint8Array) return source.subarray(offset, offset + length);
			const bytes = new Uint8Array(Math.max(0, Math.min(length, size - offset)));
			let filled = 0;
			while (filled < bytes.length) {
				const count = fs.readSync(fd!, bytes, filled, bytes.length - filled, offset + filled);
				if (count === 0) return bytes.subarray(0, filled);
				filled += count;
			}
			return bytes;
		};

		let offset = 16;
		if (kind === 'fileInfo') {
			const prefix = read(0, 16);
			if (prefix.length < 16) return null;
			offset = new DataView(prefix.buffer, prefix.byteOffset, prefix.byteLength).getUint32(8, true);
			if (offset < 16 || offset >= size) return null;
		}
		while (offset < size) {
			const frame = parseMetadataFrameHeader(read(offset, 15), offset, size);
			if (!frame) return null;
			if (kind === 'header' && frame.type !== EDemoCommands.DEM_FileHeader) return null;
			if (kind === 'fileInfo' && frame.type !== EDemoCommands.DEM_FileInfo) return null;

			if (
				kind !== 'serverInfo' ||
				frame.type === EDemoCommands.DEM_Packet ||
				frame.type === EDemoCommands.DEM_SignonPacket
			) {
				const bytes = read(frame.bodyOffset, frame.size);
				if (bytes.length !== frame.size) return null;
				const data = frame.compressed ? snappy.uncompress(bytes) : bytes;
				if (kind === 'header') return CDemoFileHeader.decode(data);
				if (kind === 'fileInfo') return CDemoFileInfo.decode(data);
				const info = parseServerInfoPacket(data);
				if (info !== undefined) return info;
			}
			if (frame.tick !== 0xffffffff) break;
			offset = frame.next;
		}
		return null;
	} finally {
		snappy.release();
		if (fd !== undefined) fs.closeSync(fd);
	}
}
