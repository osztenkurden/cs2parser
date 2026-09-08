import type { DemoReader } from '../parser/index.js';
import type { Player } from './player.js';

/**
 * Annotates a game event with resolved Player helper references.
 * The userid/attacker/assister fields are userinfo slot indices (NOT entity IDs).
 * We look up the CMsgPlayerInfo by slot, then match to a controller entity.
 */
export function annotateGameEvent(
	parser: DemoReader,
	eventName: string,
	event: Record<string, any>
): Record<string, any> {
	if ('userid' in event && eventName !== 'player_connect') {
		event.player = resolvePlayerByUserSlot(parser, event.userid) ?? null;
	}

	if ('attacker' in event) {
		event.attackerPlayer = resolvePlayerByUserSlot(parser, event.attacker) ?? null;
	}

	if ('assister' in event) {
		event.assisterPlayer = resolvePlayerByUserSlot(parser, event.assister) ?? null;
	}

	return event;
}

/** Lower 32 bits of a SteamID64 — the trailing number in SteamID3 form. */
const accountIdOf = (steamId: string | number | bigint): number => {
	try {
		return Number(BigInt(steamId) & 0xffffffffn);
	} catch {
		return 0;
	}
};

function resolvePlayerByUserSlot(parser: DemoReader, userSlot: number): Player | null {
	if (userSlot === undefined) return null;

	const slot = userSlot & 0xff;
	if (slot === 0xff) return null; // 0xFF = no player
	const info = parser.players[slot];
	if (!info || info.steamid === undefined) return null;

	// Humans: resolve through the account-id index. That's O(1) on the cached
	// path, versus the full entity scan a `playerControllers` walk costs — and
	// this runs up to three times for every game event.
	const accountId = accountIdOf(info.steamid);
	if (accountId !== 0) return parser.getByAccountId(accountId);

	// Bots all report steamid '0', so the account id can't tell them apart —
	// matching on it would hand back whichever bot controller came first. Names
	// are unique per match, so use those instead.
	const name = info.name;
	if (!name) return null;
	for (const pc of parser.playerControllers) {
		if (pc.name === name) return pc;
	}

	return null;
}
