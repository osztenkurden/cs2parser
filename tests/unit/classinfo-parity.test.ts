/**
 * Phase 5 parity check: Rust `init_class_info` produces the same
 * `propIdToName` map as JS `parseClassInfo` on a real demo's send-tables +
 * class-info pair. This is the floor for Phase 6 entity decoding.
 */
import { describe, test, expect } from 'bun:test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CDemoClassInfo } from '../../src/ts-proto/demo.js';
import { CSVCMsg_FlattenedSerializer } from '../../src/ts-proto/netmessages.js';
import { parseClassInfo } from '../../src/parser/entities/classInfo.js';
import { CDemoSendTables } from '../../src/ts-proto/demo.js';
import { native } from '../../src/native/index.js';
import { captureFlattenedSerializerBytes, captureClassInfoBytes } from '../fixtures/capture-flattened-serializer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FS_FIXTURE = path.resolve(__dirname, '../fixtures/flattened-serializer.bin');
const CI_FIXTURE = path.resolve(__dirname, '../fixtures/class-info.bin');
const DEMO_PATH = process.env.CS2_DEMO_PATH ?? path.resolve(__dirname, '../fixtures/demo.dem');

function loadOrCapture(): { fs: Buffer; ci: Buffer } | null {
	if (fs.existsSync(FS_FIXTURE) && fs.existsSync(CI_FIXTURE)) {
		return { fs: fs.readFileSync(FS_FIXTURE), ci: fs.readFileSync(CI_FIXTURE) };
	}
	if (!fs.existsSync(DEMO_PATH)) return null;
	const fsBytes = captureFlattenedSerializerBytes(DEMO_PATH);
	const ciBytes = captureClassInfoBytes(DEMO_PATH);
	fs.writeFileSync(FS_FIXTURE, fsBytes);
	fs.writeFileSync(CI_FIXTURE, ciBytes);
	return { fs: fsBytes, ci: ciBytes };
}

const fixture = loadOrCapture();

describe.skipIf(!fixture)('classInfo Rust ↔ JS parity', () => {
	test('propIdToName matches exactly', () => {
		// Build JS side: parseClassInfo takes CDemoSendTables (with .data) +
		// CDemoClassInfo. Reconstruct CDemoSendTables from the inner blob by
		// length-prefixing it with a varint (same wire format).
		const inner = fixture!.fs;
		const buf: number[] = [];
		let v = inner.length;
		while (v > 0x7f) {
			buf.push((v & 0x7f) | 0x80);
			v >>>= 7;
		}
		buf.push(v);
		const sendTablesData = Buffer.concat([Buffer.from(buf), inner]);

		// CDemoSendTables.encode would do the same thing — we shortcut.
		const sendTables = CDemoSendTables.fromPartial({ data: sendTablesData });
		const classInfoMsg = CDemoClassInfo.decode(fixture!.ci);

		const js = parseClassInfo(sendTables, classInfoMsg);

		// Rust side.
		const decoder = new native.EntityDecoderNative();
		const rs = decoder.initClassInfo(inner, fixture!.ci, false);

		// Compare maps. JS uses Record<number,string>; Rust returns a
		// Record<string,string> (HashMap keys go through JSON.stringify).
		const jsKeys = Object.keys(js.propIdToName).sort();
		const rsKeys = Object.keys(rs.propIdToName).sort();
		expect(rsKeys).toEqual(jsKeys);
		for (const k of jsKeys) {
			expect(rs.propIdToName[k]).toBe(js.propIdToName[Number(k)]);
		}

		// Sanity: the captured FlattenedSerializer's symbol count survives.
		const tsMsg = CSVCMsg_FlattenedSerializer.decode(inner);
		expect(tsMsg.symbols.length).toBeGreaterThan(0);
	});
});
