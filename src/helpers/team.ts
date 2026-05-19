import type { DemoReader } from '../parser/index.js';
import type { Player } from './player.js';
import { EntityHelper } from './entityHelper.js';

export const TeamNumber = {
	Unassigned: 0,
	Spectators: 1,
	Terrorists: 2,
	CounterTerrorists: 3
} as const;

export type TeamNumber = (typeof TeamNumber)[keyof typeof TeamNumber];

export class Team extends EntityHelper<'CCSTeam'> {
	constructor(parser: DemoReader, entityId: number) {
		super(parser, entityId);
	}

	get teamNumber(): TeamNumber {
		return (this.prop('CCSTeam.m_iTeamNum') ?? TeamNumber.Unassigned) as TeamNumber;
	}

	get teamName(): string {
		return this.prop('CCSTeam.m_szTeamname') ?? '';
	}

	get clanName(): string {
		return this.prop('CCSTeam.m_szClanTeamname') ?? '';
	}

	get score(): number {
		return this.prop('CCSTeam.m_iScore') ?? 0;
	}

	get scoreFirstHalf(): number {
		return this.prop('CCSTeam.m_scoreFirstHalf') ?? 0;
	}

	get scoreSecondHalf(): number {
		return this.prop('CCSTeam.m_scoreSecondHalf') ?? 0;
	}

	get members(): Player[] {
		const num = this.teamNumber;
		return this._parser.playerControllers.filter(p => p.teamNumber === num);
	}
}
