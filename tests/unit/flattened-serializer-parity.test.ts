/**
 * Phase 1 parity check: both ts-proto and prost (via napi) decode the same
 * `CSVCMsg_FlattenedSerializer` blob to identical structural counts. Floor
 * for the deeper decoder ports in later phases.
 */
import { describe, test, expect } from 'bun:test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CSVCMsg_FlattenedSerializer } from '../../src/ts-proto/netmessages.js';
import { native } from '../../src/native/index.js';
import { captureFlattenedSerializerBytes } from '../fixtures/capture-flattened-serializer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.resolve(__dirname, '../fixtures/flattened-serializer.bin');
const DEMO_PATH = process.env.CS2_DEMO_PATH ?? path.resolve(__dirname, '../fixtures/demo.dem');

function loadOrCaptureFixture(): Buffer | null {
	if (fs.existsSync(FIXTURE_PATH)) {
		return fs.readFileSync(FIXTURE_PATH);
	}
	if (!fs.existsSync(DEMO_PATH)) {
		return null;
	}
	const bytes = captureFlattenedSerializerBytes(DEMO_PATH);
	fs.writeFileSync(FIXTURE_PATH, bytes);
	return bytes;
}

const fixture = loadOrCaptureFixture();

describe.skipIf(!fixture)('CSVCMsg_FlattenedSerializer prost ↔ ts-proto parity', () => {
	test('symbol / field / serializer counts match', () => {
		const tsMsg = CSVCMsg_FlattenedSerializer.decode(fixture!);
		const rust = native.decodeFlattenedSerializerSummary(fixture!);

		expect(rust.symbols).toBe(tsMsg.symbols.length);
		expect(rust.fields).toBe(tsMsg.fields.length);
		expect(rust.serializers).toBe(tsMsg.serializers.length);
	});
});
