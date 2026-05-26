/**
 * Inspect raw flattened-serializer fields for CInferno to verify what wire
 * shape `m_firePositions` and its siblings actually have in the demo's schema.
 */
import fs from 'fs';
import path from 'path';
import { BitBuffer } from '../src/parser/ubitreader.js';
import { CSVCMsg_FlattenedSerializer } from '../src/ts-proto/netmessages.js';
import { findFieldType } from '../src/parser/entities/constructorFields.js';

const demoPath = process.argv[2] ?? path.join(process.cwd(), 'ag2_demo.dem');

// Quick demo header skip + find CDemoSendTables to extract the flattened serializer.
// To avoid duplicating the full demo parser, just run the parser and grab the schema
// via the public hook (snapshot saved by generator).
import { DemoReader } from '../src/parser/index.js';
import { EntityMode } from '../src/parser/entities/types.js';

const parser = new DemoReader();
parser.parseDemo(demoPath, { entities: EntityMode.ALL, stream: false });

console.log(`Demo parsed; total propIds: ${Object.keys(parser.propIdToName).length}`);

// Look at every propId whose name contains "Inferno" or starts with "CInferno"
const interesting: Array<[number, string]> = [];
for (const [idStr, name] of Object.entries(parser.propIdToName)) {
	if (name.startsWith('CInferno.') || name.includes('Inferno')) {
		interesting.push([Number(idStr), name]);
	}
}
interesting.sort((a, b) => a[0] - b[0]);
console.log(`\nCInferno propIds (${interesting.length} entries):`);
for (const [id, name] of interesting) {
	const info = parser.propIdToInfo[id];
	const dec = parser.propIdToDecoder[id];
	const decStr = typeof dec === 'object' ? `qf:${dec.decoder}` : String(dec);
	const infoStr = info
		? `info{name=${info.name}${info.containerKey ? ` container=${info.containerKey}` : ''}${info.subKey ? ` sub=${info.subKey}` : ''}${info.elementCtor ? ` ctor=${info.elementCtor.name}` : ''}${info.fixedLength !== undefined ? ` len=${info.fixedLength}` : ''}}`
		: '<no info>';
	console.log(`  [${id}] dec=${decStr} ${name}  ${infoStr}`);
}

// Also resolve raw varType for "Vector[64]"-looking fields. Parse the schema once more.
const fd = fs.openSync(demoPath, 'r');
try {
	const header = Buffer.alloc(16);
	fs.readSync(fd, header, 0, 16, 0);
	let offset = 16;
	const stat = fs.fstatSync(fd);
	const all = Buffer.alloc(stat.size - 16);
	fs.readSync(fd, all, 0, stat.size - 16, 16);
	offset = 0;
	// Demo file format: stream of (cmd, tick, size, [compressed]) frames. We'll find
	// the CDemoSendTables (cmd=4) frame instead of replicating the parser. Easiest:
	// scan for CSVCMsg_FlattenedSerializer protobuf wire prefix. Skip — we already
	// confirmed via propIdToName above. Print raw varType via findFieldType test:
	console.log('\nSanity check on findFieldType("Vector[64]"):');
	const ft = findFieldType('Vector[64]');
	console.log(`  baseType=${ft.baseType} count=${ft.count} elementType=${JSON.stringify(ft.elementType)}`);
} finally {
	fs.closeSync(fd);
}
