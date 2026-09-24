import { describe, test, expect, beforeAll } from 'bun:test';
import { DemoReader, EntityMode } from '../../src/index.js';
import fs from 'fs';

const demoPath = process.env.CS2_DEMO_PATH ?? 'tests/fixtures/demo.dem';
const demoAvailable = fs.existsSync(demoPath);
const ACTIVE = 'CCSPlayerPawn.CCSPlayer_WeaponServices.m_hActiveWeapon';

// Regression: the WASM entity fast path skipped lifecycle notifications, so the equipment
// tracker never saw weapon switches or ownership changes and Player.inventory went stale.
describe.skipIf(!demoAvailable)('Player.inventory.activeItem', () => {
	let checked = 0;
	const mismatches: string[] = [];

	beforeAll(async () => {
		const reader = new DemoReader();
		reader.on('tickend', tick => {
			for (const player of reader.playerControllers) {
				const inventory = player.inventory;
				const handle = (player.pawn?.entity?.properties as Record<string, unknown> | undefined)?.[ACTIVE];
				if (!inventory || typeof handle !== 'number') continue;
				// Only compare when the active handle is one of the owned items the tracker resolved.
				if (!inventory.items.some(item => item.handle === handle >>> 0)) continue;
				checked++;
				if (inventory.activeItem?.handle !== handle >>> 0 && mismatches.length < 5)
					mismatches.push(`${tick} ${player.name}: ${inventory.activeItem?.className} vs ${handle & 0x3fff}`);
			}
		});
		await reader.parseDemo(demoPath, { entities: EntityMode.ALL });
	});

	test('follows m_hActiveWeapon on every tick', () => {
		expect(checked).toBeGreaterThan(0);
		expect(mismatches).toEqual([]);
	});
});
