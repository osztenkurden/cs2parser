import { EntityHelper } from './entityHelper.js';
import type { Player } from './player.js';

const CELL_BITS = 9;
const MAX_COORD = 1 << 14;

export interface Vector {
	readonly x: number;
	readonly y: number;
	readonly z: number;
}

/**
 * Pawn helper. Reads via the Rust-resident decoder's getter API. Position is
 * computed from six separate cell/vec props — six FFI calls per position read.
 * For tight loops, callers should cache the result.
 */
export class PlayerPawn extends EntityHelper<'CCSPlayerPawn'> {
	get position(): Vector {
		const cellX = this._num('CCSPlayerPawn.CBodyComponentBaseAnimGraph.m_cellX') ?? 0;
		const cellY = this._num('CCSPlayerPawn.CBodyComponentBaseAnimGraph.m_cellY') ?? 0;
		const cellZ = this._num('CCSPlayerPawn.CBodyComponentBaseAnimGraph.m_cellZ') ?? 0;
		const vecX = this._num('CCSPlayerPawn.CBodyComponentBaseAnimGraph.m_vecX') ?? 0;
		const vecY = this._num('CCSPlayerPawn.CBodyComponentBaseAnimGraph.m_vecY') ?? 0;
		const vecZ = this._num('CCSPlayerPawn.CBodyComponentBaseAnimGraph.m_vecZ') ?? 0;
		return {
			x: cellX * (1 << CELL_BITS) - MAX_COORD + vecX,
			y: cellY * (1 << CELL_BITS) - MAX_COORD + vecY,
			z: cellZ * (1 << CELL_BITS) - MAX_COORD + vecZ
		};
	}

	get health(): number {
		return this._num('CCSPlayerPawn.m_iHealth') ?? 0;
	}

	get maxHealth(): number {
		return this._num('CCSPlayerPawn.m_iMaxHealth') ?? 100;
	}

	get armor(): number {
		return this._num('CCSPlayerPawn.m_ArmorValue') ?? 0;
	}

	get lifeState(): number {
		return this._num('CCSPlayerPawn.m_lifeState') ?? 0;
	}

	get isAlive(): boolean {
		return this.lifeState === 0;
	}

	get hasDefuser(): boolean {
		return this._bool('CCSPlayerPawn.CCSPlayer_ItemServices.m_bHasDefuser') ?? false;
	}

	get hasHelmet(): boolean {
		return this._bool('CCSPlayerPawn.CCSPlayer_ItemServices.m_bHasHelmet') ?? false;
	}

	get isScoped(): boolean {
		return this._bool('CCSPlayerPawn.m_bIsScoped') ?? false;
	}

	get isWalking(): boolean {
		return this._bool('CCSPlayerPawn.m_bIsWalking') ?? false;
	}

	get isDefusing(): boolean {
		return this._bool('CCSPlayerPawn.m_bIsDefusing') ?? false;
	}

	get eyeAngles(): { pitch: number; yaw: number } {
		const raw = this._vec3('CCSPlayerPawn.m_angEyeAngles');
		if (raw && raw.length >= 2) return { pitch: raw[0]!, yaw: raw[1]! };
		return { pitch: 0, yaw: 0 };
	}

	get flags(): number {
		return this._num('CCSPlayerPawn.m_fFlags') ?? 0;
	}

	get controller(): Player | undefined {
		return this._parser.playerControllers.find(player => player.pawnEntityId === this.entityId);
	}

	get ownerEntityHandle(): number {
		return this._num('CCSPlayerPawn.m_hOwnerEntity') ?? 0;
	}
}
