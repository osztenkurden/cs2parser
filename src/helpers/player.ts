import type { DemoReader } from '../parser/index.js';
import type { CMsgPlayerInfo } from '../ts-proto/networkbasetypes.js';
import type { PlayerPawn, Vector } from './playerPawn.js';
import type { Team } from './team.js';
import { EntityHelper } from './entityHelper.js';

const PLAYER_ENTITY_HANDLE_MISSING = 2047;

export class Player extends EntityHelper<'CCSPlayerController'> {
	constructor(parser: DemoReader, entityId: number) {
		super(parser, entityId);
	}

	// --- Identity ---

	get name(): string {
		return this.prop('CCSPlayerController.m_iszPlayerName') ?? '';
	}

	get steamId(): string {
		const raw = this.prop('CCSPlayerController.m_steamID');
		return raw !== undefined ? String(raw) : '';
	}

	get isConnected(): boolean {
		const connected = this.prop('CCSPlayerController.m_iConnected');
		return connected !== undefined && connected === 0;
	}

	get userInfo(): CMsgPlayerInfo | null {
		for (const info of this._parser.players) {
			if (info && String(info.steamid) === this.steamId) return info;
		}
		return null;
	}

	// --- Team ---

	get teamNumber(): number {
		return this.prop('CCSPlayerController.m_iTeamNum') ?? 0;
	}

	get team(): Team | null {
		const num = this.teamNumber;
		return this._parser.teams.find(t => t.teamNumber === num) ?? null;
	}

	// --- Pawn Link ---

	get pawnEntityId(): number | null {
		const handle = this.prop('CCSPlayerController.m_hPlayerPawn');
		if (handle === undefined || (handle & 0x7ff) === PLAYER_ENTITY_HANDLE_MISSING) return null;
		return handle & 0x7ff;
	}

	get pawn(): PlayerPawn | null {
		const id = this.pawnEntityId;
		if (id === null) return null;
		return this._parser.getPawn(id);
	}

	// --- Alive State ---

	get isAlive(): boolean {
		return this.prop('CCSPlayerController.m_bPawnIsAlive') ?? false;
	}

	// --- Shortcuts delegating to pawn ---

	get health(): number {
		return this.pawn?.health ?? 0;
	}

	get position(): Vector | null {
		return this.pawn?.position ?? null;
	}

	get armor(): number {
		return this.pawn?.armor ?? 0;
	}

	get hasDefuser(): boolean {
		return this.pawn?.hasDefuser ?? false;
	}

	get hasHelmet(): boolean {
		return this.pawn?.hasHelmet ?? false;
	}

	get isScoped(): boolean {
		return this.pawn?.isScoped ?? false;
	}

	get isDefusing(): boolean {
		return this.pawn?.isDefusing ?? false;
	}

	get eyeAngles(): { pitch: number; yaw: number } {
		return this.pawn?.eyeAngles ?? { pitch: 0, yaw: 0 };
	}

	// --- Economy ---

	get money(): number {
		return this.prop('CCSPlayerController.CCSPlayerController_InGameMoneyServices.m_iAccount') ?? 0;
	}

	get totalCashSpent(): number {
		return this.prop('CCSPlayerController.CCSPlayerController_InGameMoneyServices.m_iTotalCashSpent') ?? 0;
	}

	get cashSpentThisRound(): number {
		return this.prop('CCSPlayerController.CCSPlayerController_InGameMoneyServices.m_iCashSpentThisRound') ?? 0;
	}

	// --- Match Totals ---

	get kills(): number {
		return this.prop('CCSPlayerController.CCSPlayerController_ActionTrackingServices.m_matchStats.m_iKills') ?? 0;
	}

	get deaths(): number {
		return this.prop('CCSPlayerController.CCSPlayerController_ActionTrackingServices.m_matchStats.m_iDeaths') ?? 0;
	}

	get assists(): number {
		return this.prop('CCSPlayerController.CCSPlayerController_ActionTrackingServices.m_matchStats.m_iAssists') ?? 0;
	}

	get damage(): number {
		return this.prop('CCSPlayerController.CCSPlayerController_ActionTrackingServices.m_matchStats.m_iDamage') ?? 0;
	}

	get headshotKills(): number {
		return (
			this.prop('CCSPlayerController.CCSPlayerController_ActionTrackingServices.m_matchStats.m_iHeadShotKills') ??
			0
		);
	}

	get utilityDamage(): number {
		return (
			this.prop('CCSPlayerController.CCSPlayerController_ActionTrackingServices.m_matchStats.m_iUtilityDamage') ??
			0
		);
	}

	get enemiesFlashed(): number {
		return (
			this.prop(
				'CCSPlayerController.CCSPlayerController_ActionTrackingServices.m_matchStats.m_iEnemiesFlashed'
			) ?? 0
		);
	}

	get enemy3Ks(): number {
		return (
			this.prop('CCSPlayerController.CCSPlayerController_ActionTrackingServices.m_matchStats.m_iEnemy3Ks') ?? 0
		);
	}

	get enemy4Ks(): number {
		return (
			this.prop('CCSPlayerController.CCSPlayerController_ActionTrackingServices.m_matchStats.m_iEnemy4Ks') ?? 0
		);
	}

	get enemy5Ks(): number {
		return (
			this.prop('CCSPlayerController.CCSPlayerController_ActionTrackingServices.m_matchStats.m_iEnemy5Ks') ?? 0
		);
	}

	get objective(): number {
		return (
			this.prop('CCSPlayerController.CCSPlayerController_ActionTrackingServices.m_matchStats.m_iObjective') ?? 0
		);
	}

	// --- Per-Round Stats ---

	/**
	 * Server-sent per-round stats array, indexed by round number. Element shape
	 * mirrors `CSPerRoundStats_t`. Returns an empty array when the field hasn't
	 * been populated yet.
	 */
	get perRoundStats() {
		return this.prop('CCSPlayerController.CCSPlayerController_ActionTrackingServices.m_perRoundStats') ?? [];
	}

	/**
	 * The in-progress (or most recently played) round's stat slot.
	 *
	 * `m_perRoundStats` is a network vector pre-sized to the match's maximum round count and
	 * zero-filled, so `arr[arr.length - 1]` is almost always a blank trailing slot (which is why
	 * the round_* getters used to read `0`). The live round is the highest *populated* index, so
	 * scan from the end for the first non-empty entry.
	 */
	private _lastRoundStats() {
		const arr = this.perRoundStats;
		for (let i = arr.length - 1; i >= 0; i--) {
			const s = arr[i];
			if (
				s &&
				(s.m_iKills ||
					s.m_iDeaths ||
					s.m_iAssists ||
					s.m_iDamage ||
					s.m_iEquipmentValue ||
					s.m_iCashEarned ||
					s.m_iLiveTime ||
					s.m_iMoneySaved)
			) {
				return s;
			}
		}
		return undefined;
	}

	get round_kills(): number {
		return this._lastRoundStats()?.m_iKills ?? 0;
	}

	get round_deaths(): number {
		return this._lastRoundStats()?.m_iDeaths ?? 0;
	}

	get round_assists(): number {
		return this._lastRoundStats()?.m_iAssists ?? 0;
	}

	get round_damage(): number {
		return this._lastRoundStats()?.m_iDamage ?? 0;
	}

	get round_headshotKills(): number {
		return this._lastRoundStats()?.m_iHeadShotKills ?? 0;
	}

	get round_equipmentValue(): number {
		return this._lastRoundStats()?.m_iEquipmentValue ?? 0;
	}

	get round_cashEarned(): number {
		return this._lastRoundStats()?.m_iCashEarned ?? 0;
	}

	get round_utilityDamage(): number {
		return this._lastRoundStats()?.m_iUtilityDamage ?? 0;
	}

	get round_enemiesFlashed(): number {
		return this._lastRoundStats()?.m_iEnemiesFlashed ?? 0;
	}

	get round_liveTime(): number {
		return this._lastRoundStats()?.m_iLiveTime ?? 0;
	}

	// --- General ---

	get mvps(): number {
		return this.prop('CCSPlayerController.m_iMVPs') ?? 0;
	}

	get score(): number {
		return this.prop('CCSPlayerController.m_iScore') ?? 0;
	}

	get ping(): number {
		return this.prop('CCSPlayerController.m_iPing') ?? 0;
	}

	get color(): number {
		return this.prop('CCSPlayerController.m_iCompTeammateColor') ?? -1;
	}

	get clanTag(): string {
		return this.prop('CCSPlayerController.m_szClan') ?? '';
	}
}
