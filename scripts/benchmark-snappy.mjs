// Codec only: extract raw compressed demo frames once, verify against native, then
// time warm decoders in alternating order. No parser, file I/O, or validation is timed.
// Bun accepts source .ts modules; Node accepts modules built with `bun build --target=node`.
// Usage: bun scripts/benchmark-snappy.mjs demo.dem baseline-codec.ts candidate-codec.ts [rounds=7] [passes=3]
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { cpus } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [demoPath, baselinePath, candidatePath, roundsArg = '7', passesArg = '3'] = process.argv.slice(2);
if (!demoPath || !baselinePath || !candidatePath) throw new Error('Expected demo, baseline, candidate paths');
const rounds = Number(roundsArg);
const passes = Number(passesArg);
assert(Number.isInteger(rounds) && rounds > 0 && Number.isInteger(passes) && passes > 0);
const snappy = createRequire(import.meta.url)('snappy');
const { SnappyDecoder: Baseline } = await import(pathToFileURL(resolve(baselinePath)).href);
const { SnappyDecoder: Candidate } = await import(pathToFileURL(resolve(candidatePath)).href);
const demo = readFileSync(demoPath);
assert.equal(demo.toString('ascii', 0, 8), 'PBDEMS2\0');
let pos = 16;
const varint = () => {
	let value = 0;
	for (let shift = 0; shift < 35; shift += 7) {
		const byte = demo[pos++];
		if (byte === undefined || (shift === 28 && byte > 15)) throw new Error('Invalid demo varint');
		value |= (byte & 127) << shift;
		if (!(byte & 128)) return value >>> 0;
	}
	throw new Error('Invalid demo varint');
};
const blocks = [];
while (pos < demo.length) {
	const command = varint();
	varint(); // tick
	const size = varint();
	assert(pos + size <= demo.length, 'Truncated demo frame');
	if (command & 64) blocks.push(demo.subarray(pos, pos + size));
	pos += size;
}
assert(blocks.length > 0, 'No compressed frames');

const baseline = new Baseline();
const candidate = new Candidate();
let outputBytes = 0;
let maxOutput = 0;
const hash = createHash('sha256');
for (const block of blocks) {
	const expected = snappy.uncompressSync(block);
	assert(Buffer.from(baseline.uncompressFrame(block)).equals(expected), 'Baseline differs from native');
	assert(Buffer.from(candidate.uncompressFrame(block)).equals(expected), 'Candidate differs from native');
	hash.update(expected);
	outputBytes += expected.length;
	maxOutput = Math.max(maxOutput, expected.length);
}
console.log(
	JSON.stringify({
		runtime: process.versions.bun ? `Bun ${process.versions.bun}` : `Node ${process.versions.node}`,
		arch: process.arch,
		cpu: cpus()[0]?.model,
		demoBytes: demo.length,
		demoSha256: createHash('sha256').update(demo).digest('hex'),
		blocks: blocks.length,
		compressedBytes: blocks.reduce((sum, block) => sum + block.length, 0),
		outputBytes,
		maxOutput,
		outputSha256: hash.digest('hex'),
		rounds,
		passes
	})
);

let checksum = 0;
for (const mode of ['frame', 'destination', 'owned']) {
	const destination = new Uint8Array(maxOutput);
	const decode = (decoder, block) =>
		mode === 'frame'
			? decoder.uncompressFrame(block)
			: decoder.uncompress(block, mode === 'destination' ? destination : undefined);
	const run = decoder => {
		const start = performance.now();
		for (let pass = 0; pass < passes; pass++) {
			for (const block of blocks) {
				const bytes = decode(decoder, block);
				checksum = (checksum + bytes.length + (bytes[0] ?? 0) + (bytes[bytes.length - 1] ?? 0)) >>> 0;
			}
		}
		return (performance.now() - start) / passes;
	};
	for (let warmup = 0; warmup < 3; warmup++) {
		run(baseline);
		run(candidate);
	}
	const before = [];
	const after = [];
	for (let round = 0; round < rounds; round++) {
		for (const name of round % 2 ? ['candidate', 'baseline'] : ['baseline', 'candidate']) {
			globalThis.gc?.();
			if (name === 'baseline') before.push(run(baseline));
			else after.push(run(candidate));
		}
	}
	const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
	console.log(
		JSON.stringify({
			mode,
			baselineMs: before,
			candidateMs: after,
			baselineMedianMs: median(before),
			candidateMedianMs: median(after),
			speedup: median(before) / median(after),
			candidateMiBPerSecond: outputBytes / 1048576 / (median(after) / 1000)
		})
	);
}
baseline.release?.();
candidate.release?.();
console.log(JSON.stringify({ checksum }));
