import { DemoReader, EntityMode, type DemoInput, type ParseOptions } from '../../src/index.js';

/** Test helper: start a continuous parse and pause before its first tick. */
export async function pausedParser(source: string | DemoInput, options: ParseOptions = {}) {
	const reader = new DemoReader();
	const parsing = reader.parseDemo(source, { entities: EntityMode.ALL, ...options });
	// Tests sometimes deliberately reject parsing; attach immediately, assert via parsing later.
	void parsing.catch(() => {});
	await reader.pause();
	return { reader, parsing };
}

/** Tests can delimit one tick using only the public pause/resume events. */
export async function oneTick(reader: DemoReader) {
	const paused = new Promise<void>(resolve => reader.once('paused', resolve));
	reader.once('tickend', () => {
		void reader.pause();
	});
	reader.resume();
	await paused;
	return reader.currentTick;
}
