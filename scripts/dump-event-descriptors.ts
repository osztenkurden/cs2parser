#!/usr/bin/env bun
/**
 * Extract `CMsgSource1LegacyGameEventList` from a .dem file and write its
 * protobuf-encoded bytes to disk. The output can be loaded by
 * `HttpBroadcastReader` (via `gameEventDescriptors`) so that broadcast streams
 * — which only deliver the descriptor list once at game start and may have
 * advanced past it by the time a client connects — can still resolve event
 * names.
 *
 * The bytes are copied straight off the wire rather than decoded and
 * re-encoded, so the output is exactly what the server sent.
 *
 * Usage:
 *   bun scripts/dump-event-descriptors.ts <demo.dem> [out.bin]
 *
 * Default output path is `<demo>.event-descriptors.bin` next to the input.
 */

import fs from 'fs';
import path from 'path';
import { demoFrames } from './demo-frames.js';
import { CDemoFullPacket, CDemoPacket, EDemoCommands } from '../src/ts-proto/demo.js';
import { CMsgSource1LegacyGameEventList, EBaseGameEvents } from '../src/ts-proto/gameevents.js';
import { BitBuffer } from '../src/parser/ubitreader.js';

const inputPath = process.argv[2];
const outputPath = process.argv[3] ?? `${inputPath}.event-descriptors.bin`;

if (!inputPath) {
	console.error('usage: bun scripts/dump-event-descriptors.ts <demo.dem> [out.bin]');
	process.exit(1);
}

if (!fs.existsSync(inputPath)) {
	console.error(`[dump] file not found: ${inputPath}`);
	process.exit(1);
}

/** Scan one packet's message stream for the descriptor list and return its raw body. */
const findInPacket = (data: Uint8Array): Uint8Array | null => {
	const reader = new BitBuffer(data);
	while (reader.RemainingBits > 8) {
		const cmd = reader.readUbitVar();
		const size = reader.ReadUVarInt32();
		if (cmd !== EBaseGameEvents.GE_Source1LegacyGameEventList) {
			reader.skipBytesBetter(size);
			continue;
		}
		const body = new Uint8Array(size);
		reader.readBytes(body);
		return body;
	}
	return null;
};

console.log(`[dump] scanning ${inputPath}…`);

let found: Uint8Array | null = null;
for (const frame of demoFrames(inputPath)) {
	const { type } = frame;
	if (
		type !== EDemoCommands.DEM_Packet &&
		type !== EDemoCommands.DEM_SignonPacket &&
		type !== EDemoCommands.DEM_FullPacket
	)
		continue;
	const body = frame.bytes();
	const packet =
		type === EDemoCommands.DEM_FullPacket ? CDemoFullPacket.decode(body).packet : CDemoPacket.decode(body);
	if (packet?.data) found = findInPacket(packet.data);
	if (found) break;
}

if (!found) {
	console.error('[dump] no gameeventlist found in demo');
	process.exit(1);
}

// Sanity-check that what we copied really is the descriptor list.
const decoded = CMsgSource1LegacyGameEventList.decode(found);
if (decoded.descriptors.length === 0) {
	console.error('[dump] descriptor list decoded to zero descriptors — refusing to write');
	process.exit(1);
}

fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
fs.writeFileSync(outputPath, found);

console.log(`[dump] wrote ${found.length} bytes (${decoded.descriptors.length} descriptors) to ${outputPath}`);
