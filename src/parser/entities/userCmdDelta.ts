import type { CSGOUserCmdPB } from '../../ts-proto/cs_usercmd.js';
import {
	decodeCSGOUserCmdPB,
	decodeCSGOInputHistoryEntryPB,
	decodeCSubtickMoveStep
} from '../descriptors/generated/userCmdDeltaDecoders.js';
import { DeltaReader, DeltaFormatError, decodeReplacementList, type ListUpdates } from './userCmdDeltaReader.js';

/**
 * Apply Valve's wire-7 resets and replacement lists without normalizing to a
 * second protobuf message. Generated readers copy only changed message branches.
 * Singular message occurrences replace earlier delta occurrences, whereas list
 * operations accumulate independently. The caller's baseline is never mutated.
 */
export const applyUserCmdDelta = (baseline: CSGOUserCmdPB, deltaData: Uint8Array): CSGOUserCmdPB | null => {
	try {
		const lists: ListUpdates = {};
		const result = decodeCSGOUserCmdPB(
			new DeltaReader(deltaData),
			deltaData.length,
			baseline,
			lists
		) as unknown as CSGOUserCmdPB;
		if (lists['2'])
			result.input_history = decodeReplacementList(
				lists['2'],
				decodeCSGOInputHistoryEntryPB,
				baseline.input_history ?? []
			);
		if (lists['1.18']) {
			result.base!.subtick_moves = decodeReplacementList(
				lists['1.18'],
				decodeCSubtickMoveStep,
				baseline.base?.subtick_moves ?? []
			);
		}
		return result;
	} catch (error) {
		if (error instanceof DeltaFormatError || error instanceof RangeError) return null;
		throw error;
	}
};
