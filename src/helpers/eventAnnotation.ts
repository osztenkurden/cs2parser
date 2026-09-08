import type { DemoReader } from '../parser/index.js';
import type { Player } from './player.js';

/**
 * Annotates a game event with resolved Player helper references.
 * The low byte of userid/attacker/assister identifies the player slot.
 * Slot lookups work for humans and bots without SteamID or name matching.
 */
export function annotateGameEvent(
	parser: DemoReader,
	eventName: string,
	event: Record<string, any>
): Record<string, any> {
	if ('userid' in event && eventName !== 'player_connect') {
		event.player = resolvePlayer(parser, event.userid);
	}

	if ('attacker' in event) {
		event.attackerPlayer = resolvePlayer(parser, event.attacker);
	}

	if ('assister' in event) {
		event.assisterPlayer = resolvePlayer(parser, event.assister);
	}

	return event;
}

function resolvePlayer(parser: DemoReader, userId: number): Player | null {
	if (!Number.isInteger(userId) || userId < 0) return null;
	const slot = userId & 0xff;
	// Some events carry the full connection ID instead of just its slot.
	if (userId > 0xff && parser.players[slot]?.userid !== userId) return null;
	// Delayed damage can reference a previous pawn after respawning. The slot
	// identifies the player independently of their current pawn.
	return parser.getPlayerBySlot(slot);
}
