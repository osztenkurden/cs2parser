import type { DemoReader } from '../parser/index.js';
import type { Player } from './player.js';

export const TeamNumber = {
	Unassigned: 0,
	Spectators: 1,
	Terrorists: 2,
	CounterTerrorists: 3
} as const;

export type TeamNumber = (typeof TeamNumber)[keyof typeof TeamNumber];

export class Team {
	constructor(
		private _parser: DemoReader,
		public readonly entityId: number
	) {}

	private _num(name: string): number | undefined {
		return this._parser.getNumberProp(this.entityId, name);
	}
	private _str(name: string): string | undefined {
		return this._parser.getStringProp(this.entityId, name);
	}

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
