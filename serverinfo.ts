import { DemoReader } from './src/index.js';
const demoPath = process.argv[2];

if (!demoPath) {
	console.error(`Usage: bun header.ts <path-to-demo>`);
	process.exit(1);
}

const start = process.hrtime.bigint();
const data = DemoReader.parseServerInfo(demoPath);
const end = process.hrtime.bigint();
console.log(data);
const time = Number((end-start))
console.log(`Parsed header in ${(time/1000000)}ms`)
				