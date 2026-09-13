import { expect, test } from 'bun:test';
import { BinaryReader } from '@bufbuild/protobuf/wire';
import { DemoReader } from '../../src/index.js';
import { prepareWorkerCheckpoints, type MetadataFrame } from '../../scripts/worker-checkpoints.js';
import { checkpointDemo } from '../helpers/checkpointDemo.js';
import { pausedParser } from '../helpers/pausedParser.js';

function indexFrames(bytes: Uint8Array) {
	const wire = new BinaryReader(bytes);
	wire.pos = 16;
	const frames: MetadataFrame[] = [];
	const index: Record<number, number> = {};
	while (wire.pos < bytes.length) {
		const offset = wire.pos;
		const commandBase = wire.uint32();
		const tick = wire.uint32();
		const length = wire.uint32();
		frames.push({ offset, end: wire.pos + length, commandBase, headerSize: wire.pos - offset });
		if ((commandBase & ~64) === 13) index[tick] = offset;
		wire.pos += length;
	}
	return { frames, index };
}

test('prepared worker metadata matches indexed seek hydration at every FullPacket', async () => {
	const bytes = checkpointDemo({ paddingBytes: 256 * 1024 });
	const { frames, index } = indexFrames(bytes);
	const prepared = prepareWorkerCheckpoints(DemoReader, bytes, frames, new Set(Object.values(index)));
	expect(prepared.schema).toBeDefined();
	expect(structuredClone(prepared)).toEqual(prepared);
	for (const [tick, offset] of Object.entries(index)) {
		const { reader, parsing } = await pausedParser(bytes);
		reader.setSeekIndex(index);
		try {
			const checkpoint = await (reader as any)._seekSession.metadataAt({ tick: Number(tick), offset });
			const { classInfo: _, ...state } = checkpoint;
			expect(prepared.checkpoints[offset]!.state).toEqual(state);
			expect(prepared.checkpoints[offset]!.memoryBytes).toBeGreaterThan(0);
		} finally {
			reader.cancel();
			await parsing;
		}
	}
});

test('worker preparation retains only requested boundaries and owns their byte data', () => {
	const bytes = checkpointDemo();
	const { frames, index } = indexFrames(bytes);
	const offset = Object.values(index).at(-1)!;
	const prepared = prepareWorkerCheckpoints(DemoReader, bytes, frames, new Set([offset]));
	const retained = structuredClone(prepared);
	bytes.fill(0);
	expect(prepared).toEqual(retained);
	expect(Object.keys(prepared.checkpoints)).toEqual([String(offset)]);
});
