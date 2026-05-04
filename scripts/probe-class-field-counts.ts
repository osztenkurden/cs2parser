// Probe: how many fields does each class have? V8 may switch into dictionary
// mode for objects with too many properties (~32+), so pre-populating could
// hurt if classes are large.
import fs from 'fs';
import { DemoReader, EntityMode } from '../src/index.js';

const demoPath = process.argv[2] ?? 'C:/repos/demofile-net/demos/14140.dem';
const p = new DemoReader();
let printed = false;
const dump = () => {
	if (printed) return;
	const propIdToName = (p as any).propIdToName as Record<number, string>;
	if (!propIdToName || Object.keys(propIdToName).length === 0) return;

	const byPrefix: Record<string, number> = {};
	for (const id of Object.keys(propIdToName)) {
		const name = propIdToName[id as any]!;
		const prefix = name.split('.')[0]!;
		byPrefix[prefix] = (byPrefix[prefix] ?? 0) + 1;
	}

	const sorted = Object.entries(byPrefix).sort((a, b) => b[1] - a[1]);
	console.log('Total classes (verified):', sorted.length);
	console.log('Total propIds:', Object.keys(propIdToName).length);
	console.log('\nField counts per class (top 30):');
	for (const [name, count] of sorted.slice(0, 30)) {
		console.log(`  ${count.toString().padStart(4)}  ${name}`);
	}
	const histogram = { '<10': 0, '10-31': 0, '32-99': 0, '100+': 0 };
	for (const [, count] of sorted) {
		if (count < 10) histogram['<10']++;
		else if (count < 32) histogram['10-31']++;
		else if (count < 100) histogram['32-99']++;
		else histogram['100+']++;
	}
	console.log('\nHistogram:', histogram);
	printed = true;
};
p.on('tickstart', dump);
p.on('end', dump);

await p.parseDemo(demoPath, { entities: EntityMode.ALL });
