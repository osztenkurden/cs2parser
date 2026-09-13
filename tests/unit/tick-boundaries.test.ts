import { expect, test } from 'bun:test';
import { Readable } from 'node:stream';
import { DemoReader, EntityMode } from '../../src/index.js';
import { checkpointDemo } from '../helpers/checkpointDemo.js';
import { chunkedDemo } from '../helpers/parity.js';

for (const input of ['bytes', 'Node stream', 'chunked Web stream'] as const) {
	test(`${input}: tick observers see creation and deletion only within their own tick`, async () => {
		const bytes = checkpointDemo();
		const reader = new DemoReader();
		const starts: [number, boolean][] = [];
		const ends: [number, boolean][] = [];
		reader.on('tickstart', tick => starts.push([tick, reader.entities[1] !== undefined]));
		reader.on('tickend', tick => ends.push([tick, reader.entities[1] !== undefined]));
		const source =
			input === 'bytes' ? bytes : input === 'Node stream' ? Readable.from([bytes]) : chunkedDemo(bytes, 7);
		expect(await reader.parseDemo(source, { entities: EntityMode.ALL })).toEqual({ status: 'complete' });
		expect(starts).toEqual([
			[0, false],
			[1, true],
			[10, true],
			[11, true],
			[15, true],
			[20, true],
			[40, false],
			[41, true],
			[42, true]
		]);
		expect(ends).toEqual([
			[0, true],
			[1, true],
			[10, true],
			[11, true],
			[15, true],
			[20, false],
			[40, true],
			[41, true],
			[42, true]
		]);
	});
}
