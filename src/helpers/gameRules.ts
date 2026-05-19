import type { DemoReader } from '../parser/index.js';
import { EntityHelper } from './entityHelper.js';

export const WinRoundReason = {
	INVALID: -1,
	STILL_IN_PROGRESS: 0,
	TARGET_BOMBED: 1,
	VIP_ESCAPED: 2,
	VIP_ASSASSINATED: 3,
	T_ESCAPED: 4,
	CT_PREVENT_ESCAPE: 5,
	ESCAPING_T_NEUTRALIZED: 6,
	BOMB_DEFUSED: 7,
	T_ELIMINATED: 8,
	CT_ELIMINATED: 9,
	ROUND_DRAW: 10,
	ALL_HOSTAGES_RESCUED: 11,
	TARGET_SAVED: 12,
	HOSTAGES_NOT_SAVED: 13,
	T_NOT_ESCAPED: 14,
	VIP_NOT_ESCAPED: 15,
	GAME_COMMENCING: 16,
	T_SURRENDER: 17,
	CT_SURRENDER: 18,
	T_PLANTED: 19,
	CT_REACHED_HOSTAGE: 20
} as const;

export type WinRoundReason = (typeof WinRoundReason)[keyof typeof WinRoundReason];

export class GameRules extends EntityHelper<'CCSGameRulesProxy'> {
	constructor(parser: DemoReader, entityId: number) {
		super(parser, entityId);
	}

	get isWarmup(): boolean {
		return this.prop('CCSGameRulesProxy.CCSGameRules.m_bWarmupPeriod') ?? false;
	}

	get isFreezePeriod(): boolean {
		return this.prop('CCSGameRulesProxy.CCSGameRules.m_bFreezePeriod') ?? false;
	}

	get isGamePaused(): boolean {
		return this.prop('CCSGameRulesProxy.CCSGameRules.m_bGamePaused') ?? false;
	}

	get isTerroristTimeOutActive(): boolean {
		return this.prop('CCSGameRulesProxy.CCSGameRules.m_bTerroristTimeOutActive') ?? false;
	}

	get isCTTimeOutActive(): boolean {
		return this.prop('CCSGameRulesProxy.CCSGameRules.m_bCTTimeOutActive') ?? false;
	}

	get roundsPlayed(): number {
		return this.prop('CCSGameRulesProxy.CCSGameRules.m_totalRoundsPlayed') ?? 0;
	}

	get gamePhase(): number {
		return this.prop('CCSGameRulesProxy.CCSGameRules.m_gamePhase') ?? 0;
	}

	get phase(): string {
		const phases: Record<number, string> = {
			2: 'first',
			3: 'second',
			4: 'halftime',
			5: 'postgame'
		};
		return phases[this.gamePhase] ?? 'unknown';
	}

	get roundTime(): number {
		return this.prop('CCSGameRulesProxy.CCSGameRules.m_iRoundTime') ?? 0;
	}

	get roundStartTime(): number {
		return this.prop('CCSGameRulesProxy.CCSGameRules.m_fRoundStartTime') ?? 0;
	}

	get terroristTimeOutRemaining(): number {
		return this.prop('CCSGameRulesProxy.CCSGameRules.m_flTerroristTimeOutRemaining') ?? 0;
	}

	get ctTimeOutRemaining(): number {
		return this.prop('CCSGameRulesProxy.CCSGameRules.m_flCTTimeOutRemaining') ?? 0;
	}
}
