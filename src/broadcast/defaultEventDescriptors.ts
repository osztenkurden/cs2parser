import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CMsgSource1LegacyGameEventList } from '../ts-proto/gameevents.js';

/**
 * Path to the bundled descriptor file. Resolves relative to this module so it
 * works both when running source (`src/broadcast/default-event-descriptors.bin`)
 * and when running the published bundle (`dist/default-event-descriptors.bin`,
 * placed there by the build's copy step).
 */
const DEFAULT_PATH = fileURLToPath(new URL('./default-event-descriptors.bin', import.meta.url));

let cached: CMsgSource1LegacyGameEventList | null = null;

/**
 * Lazily load and decode the descriptor list bundled with the package. Used by
 * `HttpBroadcastReader` when the caller doesn't pass `gameEventDescriptors`.
 * Returns `null` if the file is missing (e.g. someone trimmed the package),
 * so the reader can fall through to "no preloaded descriptors" rather than
 * crashing.
 */
export const loadBundledEventDescriptors = (): CMsgSource1LegacyGameEventList | null => {
	if (cached) return cached;
	if (!fs.existsSync(DEFAULT_PATH)) return null;
	const bytes = fs.readFileSync(DEFAULT_PATH);
	cached = CMsgSource1LegacyGameEventList.decode(bytes);
	return cached;
};
