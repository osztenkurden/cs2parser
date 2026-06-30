import { EntityHelper } from './entityHelper.js';
import type { Player } from './player.js';

export const TeamNumber = {
	Unassigned: 0,
	Spectators: 1,
	Terrorists: 2,
	CounterTerrorists: 3
} as const;

export type TeamNumber = (typeof TeamNumber)[keyof typeof TeamNumber];

export class Team extends EntityHelper<'CCSTeam'> {
	get teamNumber(): TeamNumber {
		return (this._num('CCSTeam.m_iTeamNum') ?? TeamNumber.Unassigned) as TeamNumber;
	}

	get teamName(): string {
		return this._str('CCSTeam.m_szTeamname') ?? '';
	}

	get clanName(): string {
		return this._str('CCSTeam.m_szClanTeamname') ?? '';
	}

	get score(): number {
		return this._num('CCSTeam.m_iScore') ?? 0;
	}

	get scoreFirstHalf(): number {
		return this._num('CCSTeam.m_scoreFirstHalf') ?? 0;
	}

	get scoreSecondHalf(): number {
		return this._num('CCSTeam.m_scoreSecondHalf') ?? 0;
	}

	get members(): Player[] {
		const num = this.teamNumber;
		return this._parser.playerControllers.filter(p => p.teamNumber === num);
	}
}
