import type { DemoReader } from '../src/index.js';
import { ParseSession } from '../src/parser/entities/parseSession.js';
import { EntityMode } from '../src/parser/entities/types.js';
import { estimateCheckpointBytes } from '../src/replay/memory.js';

export interface MetadataFrame {
	offset: number;
	end: number;
	commandBase: number;
	headerSize: number;
}

/** Benchmark-only preparation: hydrate metadata once, without decoding entities. */
export function prepareWorkerCheckpoints(
	Reader: typeof DemoReader,
	bytes: Uint8Array,
	frames: readonly MetadataFrame[],
	requested: ReadonlySet<number>
) {
	const reader = new Reader();
	reader._silent = true;
	reader.gameEvents.entityMode = EntityMode.NONE;
	const session = new ParseSession(
		new Uint8Array(16),
		EntityMode.NONE,
		queue => {
			try {
				for (const [event, value] of queue) reader.emit(event, value as never);
			} finally {
				queue.length = 0;
			}
		},
		reader
	);
	const checkpoints: Record<
		number,
		{ state: Omit<NonNullable<ReturnType<ParseSession['captureCheckpoint']>>, 'classInfo'>; memoryBytes: number }
	> = {};
	let first = true;
	let schema: NonNullable<ReturnType<ParseSession['captureCheckpoint']>>['classInfo'] | undefined;
	let schemaBytes = 0;
	try {
		for (const frame of frames) {
			const command = frame.commandBase & ~64;
			if (command === 13) {
				first = false;
				if (requested.has(frame.offset)) {
					const checkpoint = session.captureCheckpoint(frame.offset);
					if (!checkpoint) throw new Error('FullPacket has no schema checkpoint');
					if (schema && schema !== checkpoint.classInfo) throw new Error('Worker checkpoint schema changed');
					if (!schema) schemaBytes = estimateCheckpointBytes(checkpoint.classInfo);
					schema = checkpoint.classInfo;
					const { classInfo: _, ...state } = checkpoint;
					checkpoints[frame.offset] = {
						state: structuredClone(state),
						memoryBytes: schemaBytes + estimateCheckpointBytes(state)
					};
				}
			}
			if ((first && [1, 4, 5, 7, 8].includes(command)) || command === 13)
				session.readCommand(
					bytes,
					frame.offset,
					frame.commandBase,
					frame.headerSize,
					frame.offset,
					frame.end - frame.offset
				);
		}
		if (!schema) return { schema: undefined, checkpoints };
		// Constructors are not structured-cloneable. Only property storage metadata
		// holds functions; serializer fields/quantized decoders are immutable data.
		const { propIdToInfo: _, propInfoById, ...rest } = schema;
		return {
			schema: {
				...rest,
				propInfoById: propInfoById.map(info => {
					if (!info) return info;
					const { elementCtor, ...fields } = info;
					return elementCtor ? { ...fields, elementCtor: elementCtor.name } : fields;
				})
			},
			checkpoints
		};
	} finally {
		reader._snappy.release?.();
	}
}
