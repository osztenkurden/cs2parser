import type { DemoReader } from '../parser/index.js';
import type { Player } from './player.js';
import { EntityHelper } from './entityHelper.js';

const CELL_BITS = 9;
const MAX_COORD = 1 << 14;

export interface Vector {
	readonly x: number;
	readonly y: number;
	readonly z: number;
}

export class PlayerPawn extends EntityHelper<'CCSPlayerPawn'> {
	constructor(parser: DemoReader, entityId: number) {
		super(parser, entityId);
	}

	get position(): Vector {
		const cellX =
			this.prop('CCSPlayerPawn.CBodyComponentBaseAnimGraph.m_skeletonInstance.m_vecOrigin.m_cellX') ?? 0;
		const cellY =
			this.prop('CCSPlayerPawn.CBodyComponentBaseAnimGraph.m_skeletonInstance.m_vecOrigin.m_cellY') ?? 0;
		const cellZ =
			this.prop('CCSPlayerPawn.CBodyComponentBaseAnimGraph.m_skeletonInstance.m_vecOrigin.m_cellZ') ?? 0;
		const vecX = this.prop('CCSPlayerPawn.CBodyComponentBaseAnimGraph.m_skeletonInstance.m_vecOrigin.m_vecX') ?? 0;
		const vecY = this.prop('CCSPlayerPawn.CBodyComponentBaseAnimGraph.m_skeletonInstance.m_vecOrigin.m_vecY') ?? 0;
		const vecZ = this.prop('CCSPlayerPawn.CBodyComponentBaseAnimGraph.m_skeletonInstance.m_vecOrigin.m_vecZ') ?? 0;
		return {
			x: cellX * (1 << CELL_BITS) - MAX_COORD + vecX,
			y: cellY * (1 << CELL_BITS) - MAX_COORD + vecY,
			z: cellZ * (1 << CELL_BITS) - MAX_COORD + vecZ
		};
	}

	get health(): number {
		return this.prop('CCSPlayerPawn.m_iHealth') ?? 0;
	}

	get maxHealth(): number {
		return this.prop('CCSPlayerPawn.m_iMaxHealth') ?? 100;
	}

	get armor(): number {
		return this.prop('CCSPlayerPawn.m_ArmorValue') ?? 0;
	}

	get lifeState(): number {
		return this.prop('CCSPlayerPawn.m_lifeState') ?? 0;
	}

	get isAlive(): boolean {
		return this.lifeState === 0;
	}

	get hasDefuser(): boolean {
		return this.prop('CCSPlayerPawn.CCSPlayer_ItemServices.m_bHasDefuser') ?? false;
	}

	get hasHelmet(): boolean {
		return this.prop('CCSPlayerPawn.CCSPlayer_ItemServices.m_bHasHelmet') ?? false;
	}

	get isScoped(): boolean {
		return this.prop('CCSPlayerPawn.m_bIsScoped') ?? false;
	}

	get isWalking(): boolean {
		return this.prop('CCSPlayerPawn.m_bIsWalking') ?? false;
	}

	get isDefusing(): boolean {
		return this.prop('CCSPlayerPawn.m_bIsDefusing') ?? false;
	}

	get eyeAngles(): { pitch: number; yaw: number } {
		const raw = this.prop('CCSPlayerPawn.m_angEyeAngles');
		if (Array.isArray(raw)) return { pitch: raw[0] ?? 0, yaw: raw[1] ?? 0 };
		return { pitch: 0, yaw: 0 };
	}

	get flags(): number {
		return this.prop('CCSPlayerPawn.m_fFlags') ?? 0;
	}

	get controller(): Player | undefined {
		return this._parser.playerControllers.find(player => player.pawnEntityId === this.entityId);
	}

	get ownerEntityHandle(): number {
		return this.prop('CCSPlayerPawn.m_hOwnerEntity') ?? 0;
	}
}
