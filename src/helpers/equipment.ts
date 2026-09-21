import type { BaseDemoReader } from '../parser/base.js';
import type { Player } from './player.js';

/** Identity belongs to a network entity (including its serial), not an individual grenade in a stack. */
export interface InventoryItem {
	readonly itemId: string;
	readonly handle: number;
	readonly entityId: number;
	readonly className: string;
	readonly defindex: number;
	readonly name: string;
	readonly quantity: number;
}

export interface InventorySnapshot {
	readonly pawnHandle: number;
	readonly items: readonly InventoryItem[];
	readonly activeItem: InventoryItem | null;
}

export interface EquipmentEventData {
	source?: 'native' | 'reconstructed';
	/** Resolved, owned weapon/stack data. Null for no active weapon; absent when unresolved. */
	weapon?: InventoryItem | null;
	itemId?: string | null;
	/** Units added/removed; zero on native notifications with no net inventory change. Equip uses stack size. */
	quantity?: number;
	previousQuantity?: number;
	remainingQuantity?: number;
	/** Positive evidence only: a surviving, unowned entity removed from all tracked inventories. */
	physicalDrop?: boolean;
}

export interface GrenadeEventData {
	source?: 'native' | 'reconstructed';
	projectileId?: string;
	entityid?: number;
	projectileHandle?: number;
}

export interface InventorySnapshotEvent {
	player: Player | null;
	inventory: InventorySnapshot;
}

export interface GrenadeLifecycleEvent extends GrenadeEventData {
	source: 'reconstructed';
	projectileId: string;
	projectileHandle: number;
	entityid: number;
	player: Player | null;
	weapon: string;
	/** Flight ends only on an observed detonation/effect signal, never merely on deletion. */
	signal?: string;
}

const ammoSlots: Record<number, number> = { 43: 14, 44: 13, 45: 15, 46: 16, 47: 17, 48: 16 };
const names: Record<number, string> = {
	1: 'deagle',
	2: 'elite',
	3: 'fiveseven',
	4: 'glock',
	7: 'ak47',
	8: 'aug',
	9: 'awp',
	10: 'famas',
	11: 'g3sg1',
	13: 'galilar',
	14: 'm249',
	16: 'm4a1',
	17: 'mac10',
	19: 'p90',
	23: 'mp5sd',
	24: 'ump45',
	25: 'xm1014',
	26: 'bizon',
	27: 'mag7',
	28: 'negev',
	29: 'sawedoff',
	30: 'tec9',
	31: 'taser',
	32: 'hkp2000',
	33: 'mp7',
	34: 'mp9',
	35: 'nova',
	36: 'p250',
	38: 'scar20',
	39: 'sg556',
	40: 'ssg08',
	42: 'knife',
	43: 'flashbang',
	44: 'hegrenade',
	45: 'smokegrenade',
	46: 'molotov',
	47: 'decoy',
	48: 'incgrenade',
	49: 'c4',
	59: 'knife',
	60: 'm4a1_silencer',
	61: 'usp_silencer',
	63: 'cz75a',
	64: 'revolver'
};
const projectiles: Record<string, string> = {
	CFlashbangProjectile: 'flashbang',
	CHEGrenadeProjectile: 'hegrenade',
	CSmokeGrenadeProjectile: 'smokegrenade',
	CMolotovProjectile: 'molotov',
	CDecoyProjectile: 'decoy'
};
const services = 'CCSPlayerPawn.CCSPlayer_WeaponServices.';
type Event = Record<string, any> & { event_name: string };
type Track = {
	handle: number;
	weapon: string;
	thrower: number;
	ended: boolean;
	announced: boolean;
	playerSlot?: number;
};
const matchesItem = (event: Event, item: InventoryItem) =>
	event.defindex === item.defindex ||
	event.item === item.name ||
	event.item === item.className.replace(/^CWeapon|^C/, '').toLowerCase() ||
	(event.item === 'knife' && item.name === 'knife');

/** @internal Tick-coalesced dependency tracking. State contains only cloneable values for seeking. */
export class EquipmentTracker {
	static emptyState = () => ({
		serials: new Map<number, number>(),
		pawns: new Set<number>(),
		dirty: new Set<number>(),
		dependencies: new Map<number, Set<number>>(),
		pawnDependencies: new Map<number, Set<number>>(),
		controllers: new Map<number, number>(),
		inventories: new Map<number, InventorySnapshot>(),
		projectiles: new Map<number, Track>(),
		retiredProjectiles: [] as Track[],
		projectileDirty: new Set<number>(),
		deleted: new Set<number>()
	});
	state = EquipmentTracker.emptyState();

	constructor(private parser: BaseDemoReader) {
		parser._onInternal('entitycreated', ([id, , , name, serial]) => {
			this.state.serials.set(id, serial ?? 0);
			this.state.deleted.delete(id);
			const previous = this.state.projectiles.get(id);
			if (previous && previous.handle !== this.handle(id)) {
				this.state.retiredProjectiles.push(previous);
				this.state.projectiles.delete(id);
			}
			if (name === 'CCSPlayerPawn') {
				this.state.pawns.add(id);
				this.state.dirty.add(id);
			}
			if (projectiles[name] && this.state.projectiles.get(id)?.handle !== this.handle(id)) {
				this.state.projectiles.set(id, {
					handle: this.handle(id),
					weapon: projectiles[name],
					thrower: -1,
					ended: false,
					announced: false
				});
				this.state.projectileDirty.add(id);
			}
			this.touchDependents(id);
		});
		parser._onInternal('entityupdated', ({ entityId: id, propId }) => {
			const name = parser.propIdToName[propId] ?? '';
			if (this.state.pawns.has(id) && name.startsWith(services)) this.state.dirty.add(id);
			if (this.state.dependencies.has(id) && /m_iItemDefinitionIndex|m_hOwnerEntity/.test(name))
				this.touchDependents(id);
			if (this.state.projectiles.has(id)) this.state.projectileDirty.add(id);
		});
		parser._onInternal('entitydeleted', id => {
			this.state.deleted.add(id);
			if (this.state.pawns.has(id)) this.state.dirty.add(id);
			this.touchDependents(id);
		});
	}

	getInventory(player: Player): InventorySnapshot | null {
		const snapshot = this.state.inventories.get(player.pawnEntityId ?? -1);
		return snapshot ? structuredClone(snapshot) : null;
	}

	changed(id: number) {
		if (this.state.pawns.has(id)) this.state.dirty.add(id);
		this.touchDependents(id);
		if (this.state.projectiles.has(id)) this.state.projectileDirty.add(id);
	}

	private handle(id: number) {
		// Source 2 entity handles reserve 14 low bits for the index, then the serial.
		return ((this.state.serials.get(id) ?? 0) * 16384 + id) >>> 0;
	}
	private touchDependents(id: number) {
		for (const pawn of this.state.dependencies.get(id) ?? []) this.state.dirty.add(pawn);
	}
	private entity(handle: number) {
		const id = handle & 0x3fff;
		return id !== 0x3fff && this.handle(id) === handle >>> 0 ? this.parser.entities[id] : undefined;
	}
	private prop(id: number, suffix: string): any {
		const entity = this.parser.entities[id];
		return entity?.properties[`${entity.className}.${suffix}` as keyof typeof entity.properties];
	}
	private player(pawn: number) {
		const player = this.parser.getPawn(pawn)?.controller;
		if (player) this.state.controllers.set(pawn, player.entityId);
		return player ?? this.parser.getPlayerBySlot((this.state.controllers.get(pawn) ?? 0) - 1);
	}

	private clearDependencies(id: number) {
		for (const dependency of this.state.pawnDependencies.get(id) ?? []) {
			const dependents = this.state.dependencies.get(dependency);
			dependents?.delete(id);
			if (!dependents?.size) this.state.dependencies.delete(dependency);
		}
		this.state.pawnDependencies.delete(id);
	}

	private snapshot(id: number): InventorySnapshot | null {
		const props = this.parser.entities[id]?.properties as Record<string, any> | undefined;
		const handles = props?.[services + 'm_hMyWeapons'] as number[] | undefined;
		if (!handles) return null;
		this.clearDependencies(id);
		const dependencies = new Set<number>();
		this.state.pawnDependencies.set(id, dependencies);
		const items: InventoryItem[] = [];
		let complete = true;
		for (const handle of new Set(handles)) {
			const entityId = handle & 0x3fff;
			if (entityId === 0x3fff) continue;
			dependencies.add(entityId);
			let dependents = this.state.dependencies.get(entityId);
			if (!dependents) this.state.dependencies.set(entityId, (dependents = new Set()));
			dependents.add(id);
			const entity = this.entity(handle);
			const defindex = this.prop(entityId, 'm_AttributeManager.m_Item.m_iItemDefinitionIndex');
			if (!entity || !defindex) {
				complete = false;
				continue;
			}
			const slot = ammoSlots[defindex];
			const quantity = slot === undefined ? 1 : props?.[services + 'm_iAmmo']?.[slot];
			if (quantity === undefined) {
				complete = false;
				continue;
			}
			if (quantity > 0)
				items.push({
					itemId: String(handle >>> 0),
					handle: handle >>> 0,
					entityId,
					className: entity.className,
					defindex,
					name: names[defindex] ?? (entity.className === 'CKnife' ? 'knife' : entity.className),
					quantity
				});
		}
		if (!complete || props?.[services + 'm_hActiveWeapon'] === undefined) return null;
		return {
			pawnHandle: this.handle(id),
			items,
			activeItem: items.find(item => item.handle === props?.[services + 'm_hActiveWeapon'] >>> 0) ?? null
		};
	}

	process(native: Event[]): Event[] {
		const emitted: Event[] = [];
		const used = new Set<Event>();
		const publish = (name: string, player: Player | null, item: InventoryItem | null, data: EquipmentEventData) => {
			const match = native.find(
				event =>
					!used.has(event) &&
					event.event_name === name &&
					event.player === player &&
					player !== null &&
					(item ? matchesItem(event, item) : !event.item)
			);
			const extra = { weapon: item ? { ...item } : null, itemId: item?.itemId ?? null, ...data };
			if (match) {
				Object.assign(match, extra);
				used.add(match);
				return;
			}
			emitted.push({
				event_name: name,
				userid: player?.userInfo?.userid ?? player?.userSlot ?? -1,
				player,
				item: item?.name ?? '',
				defindex: item?.defindex ?? 0,
				...(name === 'item_pickup' ? { silent: false } : {}),
				...(name === 'item_equip'
					? {
							canzoom: false,
							hassilencer: false,
							issilenced: false,
							hastracers: false,
							weptype: 0,
							ispainted: false
						}
					: {}),
				source: 'reconstructed',
				...extra
			});
		};
		const changes: { id: number; previous?: InventorySnapshot; next: InventorySnapshot }[] = [];
		for (const id of this.state.dirty) {
			this.state.dirty.delete(id);
			const previous = this.state.inventories.get(id);
			const deleted = this.state.deleted.has(id) && !this.parser.entities[id];
			const next = deleted
				? { pawnHandle: previous?.pawnHandle ?? this.handle(id), items: [], activeItem: null }
				: this.snapshot(id);
			if (!next) continue; // Missing network state is not an empty inventory. Dependencies retry it.
			this.state.inventories.set(id, next);
			changes.push({ id, previous, next });
			if (deleted) {
				this.clearDependencies(id);
				this.state.pawns.delete(id);
				this.state.inventories.delete(id);
			}
		}
		for (const { id, previous, next } of changes) {
			const player = this.player(id);
			if (!previous || previous.pawnHandle !== next.pawnHandle) {
				emitted.push({ event_name: 'inventory_snapshot', player, inventory: structuredClone(next) });
				continue;
			}
			for (const item of previous.items) {
				const remaining = next.items.find(other => other.itemId === item.itemId)?.quantity ?? 0;
				if (remaining >= item.quantity) continue;
				const owner = this.prop(item.entityId, 'm_hOwnerEntity');
				const physicalDrop =
					remaining === 0 &&
					!!this.entity(item.handle) &&
					typeof owner === 'number' &&
					(owner & 0x3fff) === 0x3fff &&
					!this.state.dependencies.get(item.entityId)?.size;
				publish('item_remove', player, item, {
					quantity: item.quantity - remaining,
					previousQuantity: item.quantity,
					remainingQuantity: remaining,
					physicalDrop
				});
			}
			for (const item of next.items) {
				const before = previous.items.find(other => other.itemId === item.itemId)?.quantity ?? 0;
				if (item.quantity > before)
					publish('item_pickup', player, item, {
						quantity: item.quantity - before,
						previousQuantity: before,
						remainingQuantity: item.quantity
					});
			}
			if (previous.activeItem?.itemId !== next.activeItem?.itemId)
				publish('item_equip', player, next.activeItem, { quantity: next.activeItem?.quantity ?? 0 });
		}
		for (const event of native) {
			if (['item_pickup', 'item_remove', 'item_equip', 'grenade_thrown'].includes(event.event_name))
				event.source = 'native';
			if (!['item_pickup', 'item_remove', 'item_equip'].includes(event.event_name) || used.has(event)) continue;
			const inventory = this.state.inventories.get(event.player?.pawnEntityId);
			const item =
				event.event_name === 'item_equip'
					? inventory?.activeItem
					: inventory?.items.find(item => matchesItem(event, item));
			if (item && matchesItem(event, item))
				Object.assign(event, {
					weapon: { ...item },
					itemId: item.itemId,
					quantity: event.event_name === 'item_equip' ? item.quantity : 0,
					remainingQuantity: item.quantity
				});
		}
		this.processProjectiles(native, emitted);
		for (const id of this.state.deleted) {
			if (!this.parser.entities[id]) this.state.serials.delete(id);
		}
		this.state.deleted.clear();
		return emitted;
	}

	private processProjectiles(native: Event[], emitted: Event[]) {
		const matched = new Set<Event>();
		for (const track of this.state.retiredProjectiles) {
			emitted.push({
				event_name: 'grenade_deleted',
				source: 'reconstructed',
				player: this.parser.getPlayerBySlot(track.playerSlot ?? -1),
				weapon: track.weapon,
				projectileId: String(track.handle),
				projectileHandle: track.handle,
				entityid: track.handle & 0x3fff
			});
		}
		this.state.retiredProjectiles.length = 0;
		for (const id of new Set([
			...this.state.projectileDirty,
			...this.state.deleted,
			...native.map(event => event.entityid).filter(id => typeof id === 'number')
		])) {
			const track = this.state.projectiles.get(id);
			if (!track) continue;
			track.thrower = this.prop(id, 'm_hThrower') ?? track.thrower;
			if (this.prop(id, 'm_bIsIncGrenade')) track.weapon = 'incgrenade';
			const player =
				track.playerSlot === undefined
					? this.player(track.thrower & 0x3fff)
					: this.parser.getPlayerBySlot(track.playerSlot);
			if (player) track.playerSlot = player.userSlot;
			const data = {
				player,
				weapon: track.weapon,
				projectileId: String(track.handle),
				projectileHandle: track.handle,
				entityid: id
			};
			if (!track.announced) {
				const match = native.find(
					event =>
						event.event_name === 'grenade_thrown' &&
						!matched.has(event) &&
						event.player === player &&
						player !== null &&
						event.weapon === track.weapon
				);
				if (match) {
					Object.assign(match, data);
					matched.add(match);
				} else
					emitted.push({
						event_name: 'grenade_thrown',
						source: 'reconstructed',
						userid: player?.userInfo?.userid ?? player?.userSlot ?? -1,
						userid_pawn: track.thrower,
						...data
					});
				track.announced = true;
			}
			const detonation = native.find(
				event =>
					[
						'hegrenade_detonate',
						'flashbang_detonate',
						'smokegrenade_detonate',
						'decoy_started',
						'molotov_detonate'
					].includes(event.event_name) && event.entityid === id
			);
			const effect =
				this.prop(id, 'm_nExplodeEffectTickBegin') > 0
					? 'm_nExplodeEffectTickBegin'
					: this.prop(id, 'm_nSmokeEffectTickBegin') > 0
						? 'm_nSmokeEffectTickBegin'
						: undefined;
			if (!track.ended && (detonation || effect)) {
				emitted.push({
					event_name: 'grenade_flight_end',
					source: 'reconstructed',
					signal: detonation?.event_name ?? effect,
					...data
				});
				track.ended = true;
			}
			if (this.state.deleted.has(id)) {
				emitted.push({ event_name: 'grenade_deleted', source: 'reconstructed', ...data });
				this.state.projectiles.delete(id);
			}
		}
		this.state.projectileDirty.clear();
	}
}
