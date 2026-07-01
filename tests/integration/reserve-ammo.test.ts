import { describe, test, expect, beforeAll } from 'bun:test';
import { DemoReader, EntityMode } from '../../src/index.js';
import fs from 'fs';

const demoPath = process.env.CS2_DEMO_PATH ?? 'tests/fixtures/demo.dem';
const demoAvailable = fs.existsSync(demoPath);

// Mid-round is enough: players have bought, so weapon entities exist with a spare-ammo reserve.
const CANCEL_TICK = 30000;

describe.skipIf(!demoAvailable)('reserve ammo (m_pReserveAmmo field-naming collision)', () => {
	let reader: DemoReader;

	beforeAll(async () => {
		reader = new DemoReader();
		reader.on('tickend', () => {
			if (reader.currentTick >= CANCEL_TICK) reader.cancel();
		});
		await reader.parseDemo(demoPath, { entities: EntityMode.ALL });
	});

	// Every live entity carrying a reserve-ammo field, with its class + the reserve keys present.
	const weaponsWithReserve = () => {
		const out: { className: string; props: Record<string, unknown>; reserveKeys: string[] }[] = [];
		for (const e of reader.entities) {
			if (!e) continue;
			const props = e.properties as Record<string, unknown>;
			const reserveKeys = Object.keys(props).filter(k => k.endsWith('.m_pReserveAmmo'));
			if (reserveKeys.length) out.push({ className: e.className, props, reserveKeys });
		}
		return out;
	};

	test('weapon entities expose a reserve field', () => {
		expect(weaponsWithReserve().length).toBeGreaterThan(0);
	});

	// Core regression: m_pReserveAmmo (a Vector container field, shared across every weapon class)
	// must key under the entity's OWN class. Pre-fix, Field.clone() shared the inner element Field,
	// so the last weapon class traversed won the prop_id and a CAK47 entity carried
	// `CWeaponXM1014.m_pReserveAmmo` — a cross-class collision.
	test('m_pReserveAmmo is keyed under the entity own class, with no foreign-class key', () => {
		for (const { className, reserveKeys } of weaponsWithReserve()) {
			expect(reserveKeys).toEqual([`${className}.m_pReserveAmmo`]);
		}
	});

	// Population: with the correct key, a typed `${className}.m_pReserveAmmo` read is non-empty.
	// Pre-fix this was always empty (the value lived under the colliding foreign key), so no weapon
	// reported its own reserve — the "unverified reserve" symptom.
	test('own-class reserve is populated (at least one weapon has spare rounds)', () => {
		const anyPopulated = weaponsWithReserve().some(({ className, props }) => {
			const arr = props[`${className}.m_pReserveAmmo`];
			return arr instanceof Int32Array && Array.from(arr).some(n => n > 0);
		});
		expect(anyPopulated).toBe(true);
	});

	// Sanity: reserve stays within the weapon's spare-magazine capacity (e.g. AK-47 max spare = 90).
	test('reserve values are sane for known weapons', () => {
		const MAX_RESERVE: Record<string, number> = { CAK47: 90, CWeaponM4A1Silencer: 80, CDEagle: 35, CWeaponAWP: 30 };
		for (const { className, props } of weaponsWithReserve()) {
			const cap = MAX_RESERVE[className];
			if (cap === undefined) continue;
			const arr = props[`${className}.m_pReserveAmmo`];
			if (!(arr instanceof Int32Array)) continue;
			const max = Math.max(0, ...Array.from(arr));
			expect(max).toBeGreaterThanOrEqual(0);
			expect(max).toBeLessThanOrEqual(cap);
		}
	});
});
