import { CMsgSource1LegacyGameEventList } from '../ts-proto/gameevents.js';
import { defaultEventDescriptorBase64 } from './defaultEventDescriptorBytes.js';

let cached: CMsgSource1LegacyGameEventList | null = null;

/** Embedded bytes need no filesystem, asset URL, or extra request in either runtime. */
export const loadBundledEventDescriptors = (): CMsgSource1LegacyGameEventList =>
	(cached ??= CMsgSource1LegacyGameEventList.decode(
		Uint8Array.from(atob(defaultEventDescriptorBase64), c => c.charCodeAt(0))
	));
