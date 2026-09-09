import { CDemoFileHeader, CDemoFileInfo, CDemoPacket, EDemoCommands } from '../ts-proto/demo.js';
import { CSVCMsg_ServerInfo, SVC_Messages } from '../ts-proto/netmessages.js';
import type { SnappyDecoder } from '../compression/types.js';
import { BitBuffer } from './ubitreader.js';

export type MetadataInput = Uint8Array | Blob;

/** Shared framing for asynchronous Blob reads and synchronous server range reads. */
export function parseMetadataFrameHeader(header: Uint8Array, offset: number, limit: number) {
	let pos = 0;
	const varint = (): number | null => {
		let value = 0;
		for (let shift = 0; shift < 35; shift += 7) {
			const byte = header[pos++];
			if (byte === undefined) return null;
			if (shift === 28 && byte > 15) throw new Error('Invalid demo frame varint');
			value |= (byte & 127) << shift;
			if (!(byte & 128)) return value >>> 0;
		}
		throw new Error('Invalid demo frame varint');
	};
	const command = varint(),
		tick = varint(),
		size = varint();
	if (command === null || tick === null || size === null || offset + pos + size > limit) return null;
	return {
		type: command & ~EDemoCommands.DEM_IsCompressed,
		tick,
		size,
		bodyOffset: offset + pos,
		next: offset + pos + size,
		compressed: (command & EDemoCommands.DEM_IsCompressed) !== 0
	};
}

/** Undefined means keep searching; null means a truncated message ended the search. */
export function parseServerInfoPacket(bytes: Uint8Array): CSVCMsg_ServerInfo | null | undefined {
	const data = CDemoPacket.decode(bytes).data;
	if (!data) return undefined;
	const bits = new BitBuffer(data);
	while (bits.RemainingBits > 8) {
		const command = bits.readUbitVar();
		const size = bits.ReadUVarInt32();
		if (size > Math.floor(bits.RemainingBits / 8)) return null;
		if (command === SVC_Messages.svc_ServerInfo) {
			const bytes = new Uint8Array(size);
			bits.readBytes(bytes);
			return CSVCMsg_ServerInfo.decode(bytes);
		}
		bits.skipBytesBetter(size);
	}
	return undefined;
}

/** Range reads keep metadata access cheap even for multi-gigabyte Files. */
class MetadataReader {
	readonly size: number;
	constructor(
		private readonly source: MetadataInput,
		private readonly snappy: SnappyDecoder
	) {
		this.size = source instanceof Uint8Array ? source.length : source.size;
	}

	async read(offset: number, size: number): Promise<Uint8Array> {
		if (this.source instanceof Uint8Array) return this.source.subarray(offset, offset + size);
		return new Uint8Array(await this.source.slice(offset, offset + size).arrayBuffer());
	}

	async frame(offset: number) {
		const frame = parseMetadataFrameHeader(await this.read(offset, 15), offset, this.size);
		if (!frame) return null;
		return {
			...frame,
			bytes: async () => {
				const bytes = await this.read(frame.bodyOffset, frame.size);
				return frame.compressed ? this.snappy.uncompress(bytes) : bytes;
			}
		};
	}
}

export async function parseHeader(source: MetadataInput, snappy: SnappyDecoder): Promise<CDemoFileHeader | null> {
	const frame = await new MetadataReader(source, snappy).frame(16);
	return frame?.type === EDemoCommands.DEM_FileHeader ? CDemoFileHeader.decode(await frame.bytes()) : null;
}

export async function parseFileInfo(source: MetadataInput, snappy: SnappyDecoder): Promise<CDemoFileInfo | null> {
	const reader = new MetadataReader(source, snappy);
	const prefix = await reader.read(0, 16);
	if (prefix.length < 16) return null;
	const offset = new DataView(prefix.buffer, prefix.byteOffset, prefix.byteLength).getUint32(8, true);
	if (offset < 16 || offset >= reader.size) return null;
	const frame = await reader.frame(offset);
	return frame?.type === EDemoCommands.DEM_FileInfo ? CDemoFileInfo.decode(await frame.bytes()) : null;
}

export async function parseServerInfo(
	source: MetadataInput,
	snappy: SnappyDecoder
): Promise<CSVCMsg_ServerInfo | null> {
	const reader = new MetadataReader(source, snappy);
	let offset = 16;
	while (offset < reader.size) {
		const frame = await reader.frame(offset);
		if (!frame) return null;
		if (frame.type === EDemoCommands.DEM_Packet || frame.type === EDemoCommands.DEM_SignonPacket) {
			const info = parseServerInfoPacket(await frame.bytes());
			if (info !== undefined) return info;
		}
		if (frame.tick !== 0xffffffff) break;
		offset = frame.next;
	}
	return null;
}
