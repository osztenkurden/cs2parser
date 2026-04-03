import type { Player } from '../../helpers/player.js';
import type { WinRoundReason } from '../../helpers/gameRules.js';

export interface IEventServerPreShutdown {
	reason: string;
}

export interface IEventServerShutdown {
	reason: string;
}

export interface IEventServerMessage {
	text: string;
}

export interface IEventServerCvar {
	cvarname: string;
	cvarvalue: string;
}

export interface IEventPlayerActivate {
	userid: number;
	player: Player;
}

export interface IEventPlayerConnectFull {
	userid: number;
	player: Player;
}

export interface IEventPlayerFullUpdate {
	userid: number;
	player: Player;
	count: number;
}

export interface IEventPlayerConnect {
	name: string;
	userid: number;
	networkid: string;
	xuid: number;
	bot: boolean;
}

export interface IEventPlayerDisconnect {
	userid: number;
	player: Player;
	reason: number;
	name: string;
	networkid: string;
	xuid: number;
	PlayerID: number;
}

export interface IEventPlayerInfo {
	name: string;
	userid: number;
	player: Player;
	steamid: number;
	bot: boolean;
}

export interface IEventPlayerSpawn {
	userid: number;
	player: Player;
	userid_pawn: number;
}

export interface IEventPlayerTeam {
	userid: number;
	player: Player;
	userid_pawn: number;
	team: number;
	oldteam: number;
	disconnect: boolean;
	silent: boolean;
	isbot: boolean;
}

export interface IEventLocalPlayerTeam {}

export interface IEventLocalPlayerControllerTeam {}

export interface IEventPlayerChangename {
	userid: number;
	player: Player;
	oldname: string;
	newname: string;
}

export interface IEventPlayerHurt {
	userid: number;
	player: Player;
	userid_pawn: number;
	attacker: number;
	attackerPlayer: Player;
	attacker_pawn: number;
	health: number;
	armor: number;
	weapon: string;
	dmg_health: number;
	dmg_armor: number;
	hitgroup: number;
}

export interface IEventPlayerChat {
	teamonly: boolean;
	userid: number;
	player: Player;
	text: string;
}

export interface IEventLocalPlayerPawnChanged {}

export interface IEventTeamplayBroadcastAudio {
	team: number;
	sound: string;
}

export interface IEventFinaleStart {
	rushes: number;
}

export interface IEventPlayerStatsUpdated {
	forceupload: boolean;
}

export interface IEventUserDataDownloaded {}

export interface IEventRagdollDissolved {
	entindex: number;
}

export interface IEventTeamInfo {
	teamid: number;
	teamname: string;
}

export interface IEventTeamScore {
	teamid: number;
	score: number;
}

export interface IEventHltvCameraman {
	userid: number;
	player: Player;
}

export interface IEventHltvChase {
	target1: number;
	target2: number;
	distance: number;
	theta: number;
	phi: number;
	inertia: number;
	ineye: number;
}

export interface IEventHltvRankCamera {
	index: number;
	rank: number;
	target: number;
}

export interface IEventHltvRankEntity {
	userid: number;
	player: Player;
	rank: number;
	target: number;
}

export interface IEventHltvFixed {
	posx: number;
	posy: number;
	posz: number;
	theta: number;
	phi: number;
	offset: number;
	fov: number;
	target: number;
}

export interface IEventHltvMessage {
	text: string;
}

export interface IEventHltvStatus {
	clients: number;
	slots: number;
	proxies: number;
	master: string;
}

export interface IEventHltvTitle {
	text: string;
}

export interface IEventHltvChat {
	text: string;
	steamID: number;
}

export interface IEventHltvVersioninfo {
	version: number;
}

export interface IEventHltvReplay {
	delay: number;
	reason: number;
}

export interface IEventHltvReplayStatus {
	reason: number;
}

export interface IEventDemoStop {}

export interface IEventMapShutdown {}

export interface IEventMapTransition {}

export interface IEventHostnameChanged {
	hostname: string;
}

export interface IEventDifficultyChanged {
	newDifficulty: number;
	oldDifficulty: number;
	strDifficulty: string;
}

export interface IEventGameMessage {
	target: number;
	text: string;
}

export interface IEventGameNewmap {
	mapname: string;
}

export interface IEventRoundStart {
	timelimit: number;
	fraglimit: number;
	objective: string;
}

export interface IEventRoundEnd {
	winner: number;
	reason: WinRoundReason;
	message: string;
	legacy: number;
	player_count: number;
	nomusic: number;
}

export interface IEventRoundStartPreEntity {}

export interface IEventRoundStartPostNav {}

export interface IEventRoundFreezeEnd {}

export interface IEventTeamplayRoundStart {
	full_reset: boolean;
}

export interface IEventPlayerDeath {
	userid: number;
	player: Player;
	userid_pawn: number;
	attacker: number;
	attackerPlayer: Player;
	attacker_pawn: number;
	assister: number;
	assisterPlayer: Player;
	assister_pawn: number;
	assistedflash: boolean;
	weapon: string;
	weapon_itemid: string;
	weapon_fauxitemid: string;
	weapon_originalowner_xuid: string;
	headshot: boolean;
	dominated: number;
	revenge: number;
	wipe: number;
	penetrated: number;
	noreplay: boolean;
	noscope: boolean;
	thrusmoke: boolean;
	attackerblind: boolean;
	distance: number;
	dmg_health: number;
	dmg_armor: number;
	hitgroup: number;
	attackerinair: boolean;
}

export interface IEventPlayerFootstep {
	userid: number;
	player: Player;
	userid_pawn: number;
}

export interface IEventPlayerHintmessage {
	hintmessage: string;
}

export interface IEventBreakBreakable {
	entindex: number;
	userid_pawn: number;
	material: number;
}

export interface IEventBrokenBreakable {
	entindex: number;
	userid_pawn: number;
	material: number;
}

export interface IEventBreakProp {
	entindex: number;
	userid_pawn: number;
}

export interface IEventEntityKilled {
	entindex_killed: number;
	entindex_attacker: number;
	entindex_inflictor: number;
	damagebits: number;
}

export interface IEventDoorClose {
	userid_pawn: number;
	checkpoint: boolean;
}

export interface IEventVoteStarted {
	issue: string;
	param1: string;
	team: number;
	initiator: number;
}

export interface IEventVoteFailed {
	team: number;
}

export interface IEventVotePassed {
	details: string;
	param1: string;
	team: number;
}

export interface IEventVoteChanged {
	vote_option1: number;
	vote_option2: number;
	vote_option3: number;
	vote_option4: number;
	vote_option5: number;
	potentialVotes: number;
}

export interface IEventVoteCastYes {
	team: number;
	entityid: number;
}

export interface IEventVoteCastNo {
	team: number;
	entityid: number;
}

export interface IEventAchievementEvent {
	achievement_name: string;
	cur_val: number;
	max_val: number;
}

export interface IEventAchievementEarned {
	player: number;
	achievement: number;
}

export interface IEventAchievementWriteFailed {}

export interface IEventBonusUpdated {
	numadvanced: number;
	numbronze: number;
	numsilver: number;
	numgold: number;
}

export interface IEventSpecTargetUpdated {
	userid: number;
	player: Player;
	userid_pawn: number;
	target: number;
}

export interface IEventSpecModeUpdated {
	userid: number;
	player: Player;
}

export interface IEventEntityVisible {
	userid: number;
	player: Player;
	subject: number;
	classname: string;
	entityname: string;
}

export interface IEventGameinstructorDraw {}

export interface IEventGameinstructorNodraw {}

export interface IEventFlareIgniteNpc {
	entindex: number;
}

export interface IEventHelicopterGrenadePuntMiss {}

export interface IEventPhysgunPickup {
	target: number;
}

export interface IEventInventoryUpdated {}

export interface IEventCartUpdated {}

export interface IEventStorePricesheetUpdated {}

export interface IEventItemSchemaInitialized {}

export interface IEventDropRateModified {}

export interface IEventEventTicketModified {}

export interface IEventGcConnected {}

export interface IEventInstructorStartLesson {
	userid: number;
	player: Player;
	hint_name: string;
	hint_target: number;
	vr_movement_type: number;
	vr_single_controller: boolean;
	vr_controller_type: number;
}

export interface IEventInstructorCloseLesson {
	userid: number;
	player: Player;
	hint_name: string;
}

export interface IEventInstructorServerHintCreate {
	userid: number;
	player: Player;
	hint_name: string;
	hint_replace_key: string;
	hint_target: number;
	hint_activator_userid: number;
	hint_timeout: number;
	hint_icon_onscreen: string;
	hint_icon_offscreen: string;
	hint_caption: string;
	hint_activator_caption: string;
	hint_color: string;
	hint_icon_offset: number;
	hint_range: number;
	hint_flags: number;
	hint_binding: string;
	hint_gamepad_binding: string;
	hint_allow_nodraw_target: boolean;
	hint_nooffscreen: boolean;
	hint_forcecaption: boolean;
	hint_local_player_only: boolean;
}

export interface IEventInstructorServerHintStop {
	hint_name: string;
}

export interface IEventSetInstructorGroupEnabled {
	group: string;
	enabled: number;
}

export interface IEventClientsideLessonClosed {
	lesson_name: string;
}

export interface IEventDynamicShadowLightChanged {}

export interface IEventBotTakeover {
	userid: number;
	player: Player;
	userid_pawn: number;
	botid: number;
	p: number;
	y: number;
	r: number;
}

export interface IEventGameuiHidden {}

export interface IEventPlayerScore {
	userid: number;
	player: Player;
	kills: number;
	deaths: number;
	score: number;
}

export interface IEventPlayerShoot {
	userid: number;
	player: Player;
	userid_pawn: number;
	weapon: number;
	mode: number;
}

export interface IEventGameInit {}

export interface IEventGameStart {
	roundslimit: number;
	timelimit: number;
	fraglimit: number;
	objective: string;
}

export interface IEventGameEnd {
	winner: number;
}

export interface IEventRoundAnnounceMatchPoint {}

export interface IEventRoundAnnounceFinal {}

export interface IEventRoundAnnounceLastRoundHalf {}

export interface IEventRoundAnnounceMatchStart {}

export interface IEventRoundAnnounceWarmup {}

export interface IEventWarmupEnd {}

export interface IEventRoundEndUploadStats {}

export interface IEventRoundOfficiallyEnded {}

export interface IEventRoundTimeWarning {}

export interface IEventUgcMapInfoReceived {
	published_file_id: number;
}

export interface IEventUgcMapUnsubscribed {
	published_file_id: number;
}

export interface IEventUgcMapDownloadError {
	published_file_id: number;
	error_code: number;
}

export interface IEventUgcFileDownloadFinished {
	hcontent: number;
}

export interface IEventUgcFileDownloadStart {
	hcontent: number;
	published_file_id: number;
}

export interface IEventBeginNewMatch {}

export interface IEventDmBonusWeaponStart {
	time: number;
	Pos: number;
}

export interface IEventSurvivalAnnouncePhase {
	phase: number;
}

export interface IEventPlayerDecal {
	userid_pawn: number;
}

export interface IEventReadGameTitledata {
	controllerId: number;
}

export interface IEventWriteGameTitledata {
	controllerId: number;
}

export interface IEventResetGameTitledata {
	controllerId: number;
}

export interface IEventWeaponhudSelection {
	userid: number;
	player: Player;
	userid_pawn: number;
	mode: number;
	entindex: number;
}

export interface IEventVoteEnded {}

export interface IEventVoteCast {
	vote_option: number;
	team: number;
	userid: number;
	player: Player;
}

export interface IEventVoteOptions {
	count: number;
	option1: string;
	option2: string;
	option3: string;
	option4: string;
	option5: string;
}

export interface IEventEndmatchMapvoteSelectingMap {
	count: number;
	slot1: number;
	slot2: number;
	slot3: number;
	slot4: number;
	slot5: number;
	slot6: number;
	slot7: number;
	slot8: number;
	slot9: number;
	slot10: number;
}

export interface IEventEndmatchCmmStartRevealItems {}

export interface IEventClientLoadoutChanged {}

export interface IEventAddPlayerSonarIcon {
	userid: number;
	player: Player;
	pos_x: number;
	pos_y: number;
	pos_z: number;
}

export interface IEventDoorOpen {
	userid_pawn: number;
	entindex: number;
}

export interface IEventDoorClosed {
	userid_pawn: number;
	entindex: number;
}

export interface IEventDoorBreak {
	entindex: number;
	dmgstate: number;
}

export interface IEventAddBulletHitMarker {
	userid: number;
	player: Player;
	bone: number;
	pos_x: number;
	pos_y: number;
	pos_z: number;
	ang_x: number;
	ang_y: number;
	ang_z: number;
	start_x: number;
	start_y: number;
	start_z: number;
	hit: boolean;
}

export interface IEventOtherDeath {
	otherid: number;
	othertype: string;
	attacker: number;
	attackerPlayer: Player;
	weapon: string;
	weapon_itemid: string;
	weapon_fauxitemid: string;
	weapon_originalowner_xuid: string;
	headshot: boolean;
	penetrated: number;
	noscope: boolean;
	thrusmoke: boolean;
	attackerblind: boolean;
}

export interface IEventBulletDamage {
	victim: number;
	victim_pawn: number;
	attacker: number;
	attackerPlayer: Player;
	attacker_pawn: number;
	distance: number;
	damage_dir_x: number;
	damage_dir_y: number;
	damage_dir_z: number;
	num_penetrations: number;
	no_scope: boolean;
	in_air: boolean;
	shoot_ang_x: number;
	shoot_ang_y: number;
	shoot_ang_z: number;
	aim_punch_x: number;
	aim_punch_y: number;
	aim_punch_z: number;
	attack_tick_count: number;
	attack_tick_frac: number;
	render_tick_count: number;
	render_tick_frac: number;
	inaccuracy_total: number;
	inaccuracy_move: number;
	inaccuracy_air: number;
	recoil_index: number;
	type: number;
}

export interface IEventItemPurchase {
	userid: number;
	player: Player;
	team: number;
	loadout: number;
	weapon: string;
}

export interface IEventBombBeginplant {
	userid: number;
	player: Player;
	userid_pawn: number;
	site: number;
}

export interface IEventBombAbortplant {
	userid: number;
	player: Player;
	userid_pawn: number;
	site: number;
}

export interface IEventBombPlanted {
	userid: number;
	player: Player;
	userid_pawn: number;
	site: number;
}

export interface IEventBombDefused {
	userid: number;
	player: Player;
	userid_pawn: number;
	site: number;
}

export interface IEventBombExploded {
	userid: number;
	player: Player;
	userid_pawn: number;
	site: number;
}

export interface IEventBombDropped {
	userid: number;
	player: Player;
	userid_pawn: number;
	entindex: number;
}

export interface IEventBombPickup {
	userid_pawn: number;
}

export interface IEventDefuserDropped {
	entityid: number;
}

export interface IEventDefuserPickup {
	entityid: number;
	userid: number;
	player: Player;
	userid_pawn: number;
}

export interface IEventAnnouncePhaseEnd {}

export interface IEventCsIntermission {}

export interface IEventBombBegindefuse {
	userid: number;
	player: Player;
	userid_pawn: number;
	haskit: boolean;
}

export interface IEventBombAbortdefuse {
	userid: number;
	player: Player;
	userid_pawn: number;
}

export interface IEventHostageFollows {
	userid: number;
	player: Player;
	userid_pawn: number;
	hostage: number;
}

export interface IEventHostageHurt {
	userid: number;
	player: Player;
	userid_pawn: number;
	hostage: number;
}

export interface IEventHostageKilled {
	userid: number;
	player: Player;
	userid_pawn: number;
	hostage: number;
}

export interface IEventHostageRescued {
	userid: number;
	player: Player;
	userid_pawn: number;
	hostage: number;
	site: number;
}

export interface IEventHostageStopsFollowing {
	userid: number;
	player: Player;
	userid_pawn: number;
	hostage: number;
}

export interface IEventHostageRescuedAll {}

export interface IEventHostageCallForHelp {
	hostage: number;
}

export interface IEventVipEscaped {
	userid: number;
	player: Player;
}

export interface IEventVipKilled {
	userid: number;
	player: Player;
	attacker: number;
	attackerPlayer: Player;
}

export interface IEventPlayerRadio {
	userid: number;
	player: Player;
	userid_pawn: number;
	slot: number;
}

export interface IEventBombBeep {
	entindex: number;
}

export interface IEventWeaponFire {
	userid: number;
	player: Player;
	userid_pawn: number;
	weapon: string;
	silenced: boolean;
}

export interface IEventWeaponFireOnEmpty {
	userid: number;
	player: Player;
	userid_pawn: number;
	weapon: string;
}

export interface IEventGrenadeThrown {
	userid: number;
	player: Player;
	userid_pawn: number;
	weapon: string;
}

export interface IEventWeaponReload {
	userid: number;
	player: Player;
	userid_pawn: number;
}

export interface IEventWeaponZoom {
	userid: number;
	player: Player;
	userid_pawn: number;
}

export interface IEventSilencerDetach {
	userid: number;
	player: Player;
	userid_pawn: number;
}

export interface IEventInspectWeapon {
	userid: number;
	player: Player;
	userid_pawn: number;
}

export interface IEventWeaponZoomRifle {
	userid: number;
	player: Player;
	userid_pawn: number;
}

export interface IEventPlayerSpawned {
	userid: number;
	player: Player;
	userid_pawn: number;
	inrestart: boolean;
}

export interface IEventItemPickup {
	userid: number;
	player: Player;
	item: string;
	silent: boolean;
	defindex: number;
}

export interface IEventItemPickupSlerp {
	userid: number;
	player: Player;
	index: number;
	behavior: number;
}

export interface IEventItemPickupFailed {
	userid: number;
	player: Player;
	item: string;
	reason: number;
	limit: number;
}

export interface IEventItemRemove {
	userid: number;
	player: Player;
	item: string;
	defindex: number;
}

export interface IEventAmmoPickup {
	userid: number;
	player: Player;
	item: string;
	index: number;
}

export interface IEventItemEquip {
	userid: number;
	player: Player;
	item: string;
	defindex: number;
	canzoom: boolean;
	hassilencer: boolean;
	issilenced: boolean;
	hastracers: boolean;
	weptype: number;
	ispainted: boolean;
}

export interface IEventEnterBuyzone {
	userid: number;
	player: Player;
	canbuy: boolean;
}

export interface IEventExitBuyzone {
	userid: number;
	player: Player;
	canbuy: boolean;
}

export interface IEventBuytimeEnded {}

export interface IEventEnterBombzone {
	userid: number;
	player: Player;
	hasbomb: boolean;
	isplanted: boolean;
}

export interface IEventExitBombzone {
	userid: number;
	player: Player;
	hasbomb: boolean;
	isplanted: boolean;
}

export interface IEventEnterRescueZone {
	userid: number;
	player: Player;
}

export interface IEventExitRescueZone {
	userid: number;
	player: Player;
}

export interface IEventSilencerOff {
	userid: number;
	player: Player;
}

export interface IEventSilencerOn {
	userid: number;
	player: Player;
}

export interface IEventBuymenuOpen {}

export interface IEventBuymenuClose {
	userid: number;
	player: Player;
}

export interface IEventRoundPrestart {}

export interface IEventRoundPoststart {}

export interface IEventGrenadeBounce {
	userid: number;
	player: Player;
	userid_pawn: number;
}

export interface IEventHegrenadeDetonate {
	userid: number;
	player: Player;
	userid_pawn: number;
	entityid: number;
	x: number;
	y: number;
	z: number;
}

export interface IEventFlashbangDetonate {
	userid: number;
	player: Player;
	userid_pawn: number;
	entityid: number;
	x: number;
	y: number;
	z: number;
}

export interface IEventSmokegrenadeDetonate {
	userid: number;
	player: Player;
	userid_pawn: number;
	entityid: number;
	x: number;
	y: number;
	z: number;
}

export interface IEventSmokegrenadeExpired {
	userid: number;
	player: Player;
	userid_pawn: number;
	entityid: number;
	x: number;
	y: number;
	z: number;
}

export interface IEventMolotovDetonate {
	userid: number;
	player: Player;
	userid_pawn: number;
	x: number;
	y: number;
	z: number;
}

export interface IEventDecoyDetonate {
	userid: number;
	player: Player;
	userid_pawn: number;
	entityid: number;
	x: number;
	y: number;
	z: number;
}

export interface IEventDecoyStarted {
	userid_pawn: number;
	entityid: number;
	x: number;
	y: number;
	z: number;
}

export interface IEventTagrenadeDetonate {
	userid: number;
	player: Player;
	entityid: number;
	x: number;
	y: number;
	z: number;
}

export interface IEventInfernoStartburn {
	entityid: number;
	x: number;
	y: number;
	z: number;
}

export interface IEventInfernoExpire {
	entityid: number;
	x: number;
	y: number;
	z: number;
}

export interface IEventInfernoExtinguish {
	entityid: number;
	x: number;
	y: number;
	z: number;
}

export interface IEventDecoyFiring {
	userid: number;
	player: Player;
	userid_pawn: number;
	entityid: number;
	x: number;
	y: number;
	z: number;
}

export interface IEventBulletImpact {
	userid: number;
	player: Player;
	userid_pawn: number;
	x: number;
	y: number;
	z: number;
}

export interface IEventPlayerJump {
	userid: number;
	player: Player;
}

export interface IEventPlayerBlind {
	userid: number;
	player: Player;
	attacker: number;
	attackerPlayer: Player;
	entityid: number;
	blind_duration: number;
}

export interface IEventPlayerFalldamage {
	userid: number;
	player: Player;
	userid_pawn: number;
	damage: number;
}

export interface IEventDoorMoving {
	userid: number;
	player: Player;
	userid_pawn: number;
	entindex: number;
}

export interface IEventMbInputLockSuccess {}

export interface IEventMbInputLockCancel {}

export interface IEventNavBlocked {
	area: number;
	blocked: boolean;
}

export interface IEventNavGenerate {}

export interface IEventAchievementInfoLoaded {}

export interface IEventHltvChangedMode {
	oldmode: number;
	newmode: number;
	obs_target: number;
}

export interface IEventCsGameDisconnected {}

export interface IEventCsRoundFinalBeep {}

export interface IEventCsRoundStartBeep {}

export interface IEventCsWinPanelRound {
	show_timer_defend: boolean;
	show_timer_attack: boolean;
	timer_time: number;
	final_event: number;
	funfact_token: string;
	funfact_player: number;
	funfact_data1: number;
	funfact_data2: number;
	funfact_data3: number;
}

export interface IEventCsWinPanelMatch {}

export interface IEventCsMatchEndRestart {}

export interface IEventCsPreRestart {}

export interface IEventShowDeathpanel {
	victim: number;
	victim_pawn: number;
	killer: number;
	killer_controller: number;
	hits_taken: number;
	damage_taken: number;
	hits_given: number;
	damage_given: number;
}

export interface IEventHideDeathpanel {}

export interface IEventPlayerAvengedTeammate {
	avenger_id: number;
	avenged_player_id: number;
}

export interface IEventAchievementEarnedLocal {
	achievement: number;
	splitscreenplayer: number;
}

export interface IEventRepostXboxAchievements {
	splitscreenplayer: number;
}

export interface IEventMatchEndConditions {
	frags: number;
	max_rounds: number;
	win_rounds: number;
	time: number;
}

export interface IEventRoundMvp {
	userid: number;
	player: Player;
	reason: number;
	value: number;
	musickitmvps: number;
	nomusic: number;
	musickitid: number;
}

export interface IEventShowSurvivalRespawnStatus {
	loc_token: string;
	duration: number;
	userid: number;
	player: Player;
	userid_pawn: number;
}

export interface IEventClientDisconnect {}

export interface IEventGgKilledEnemy {
	victimid: number;
	attackerid: number;
	dominated: number;
	revenge: number;
	bonus: boolean;
}

export interface IEventSwitchTeam {
	numPlayers: number;
	numSpectators: number;
	avg_rank: number;
	numTSlotsFree: number;
	numCTSlotsFree: number;
}

export interface IEventWriteProfileData {}

export interface IEventTrialTimeExpired {
	userid: number;
	player: Player;
}

export interface IEventUpdateMatchmakingStats {}

export interface IEventPlayerResetVote {
	userid: number;
	player: Player;
	vote: boolean;
}

export interface IEventEnableRestartVoting {
	enable: boolean;
}

export interface IEventSfuievent {
	action: string;
	data: string;
	slot: number;
}

export interface IEventStartVote {
	userid: number;
	player: Player;
	type: number;
	vote_parameter: number;
}

export interface IEventPlayerGivenC4 {
	userid: number;
	player: Player;
}

export interface IEventJointeamFailed {
	userid: number;
	player: Player;
	reason: number;
}

export interface IEventTeamchangePending {
	userid: number;
	player: Player;
	toteam: number;
}

export interface IEventMaterialDefaultComplete {}

export interface IEventCsPrevNextSpectator {
	next: boolean;
}

export interface IEventNextlevelChanged {
	nextlevel: string;
	mapgroup: string;
	skirmishmode: string;
}

export interface IEventSeasoncoinLevelup {
	userid: number;
	player: Player;
	category: number;
	rank: number;
}

export interface IEventTournamentReward {
	defindex: number;
	totalrewards: number;
	accountid: number;
}

export interface IEventStartHalftime {}

export interface IEventAmmoRefill {
	userid: number;
	player: Player;
	success: boolean;
}

export interface IEventParachutePickup {
	userid: number;
	player: Player;
}

export interface IEventParachuteDeploy {
	userid: number;
	player: Player;
}

export interface IEventDronegunAttack {
	userid: number;
	player: Player;
}

export interface IEventDroneDispatched {
	userid: number;
	player: Player;
	priority: number;
	drone_dispatched: number;
}

export interface IEventLootCrateVisible {
	userid: number;
	player: Player;
	subject: number;
	type: string;
}

export interface IEventLootCrateOpened {
	userid: number;
	player: Player;
	type: string;
}

export interface IEventOpenCrateInstr {
	userid: number;
	player: Player;
	subject: number;
	type: string;
}

export interface IEventSmokeBeaconParadrop {
	userid: number;
	player: Player;
	paradrop: number;
}

export interface IEventSurvivalParadropSpawn {
	entityid: number;
}

export interface IEventSurvivalParadropBreak {
	entityid: number;
}

export interface IEventDroneCargoDetached {
	userid: number;
	player: Player;
	cargo: number;
	delivered: boolean;
}

export interface IEventDroneAboveRoof {
	userid: number;
	player: Player;
	cargo: number;
}

export interface IEventChoppersIncomingWarning {
	global: boolean;
}

export interface IEventFirstbombsIncomingWarning {
	global: boolean;
}

export interface IEventDzItemInteraction {
	userid: number;
	player: Player;
	subject: number;
	type: string;
}

export interface IEventSurvivalTeammateRespawn {
	userid: number;
	player: Player;
}

export interface IEventSurvivalNoRespawnsWarning {
	userid: number;
	player: Player;
}

export interface IEventSurvivalNoRespawnsFinal {
	userid: number;
	player: Player;
}

export interface IEventPlayerPing {
	userid: number;
	player: Player;
	userid_pawn: number;
	entityid: number;
	x: number;
	y: number;
	z: number;
	urgent: boolean;
}

export interface IEventPlayerPingStop {
	entityid: number;
}

export interface IEventPlayerSound {
	userid: number;
	player: Player;
	userid_pawn: number;
	radius: number;
	duration: number;
	step: boolean;
}

export interface IEventGuardianWaveRestart {}

export interface IEventTeamIntroStart {}

export interface IEventTeamIntroEnd {}

export interface IEventGamePhaseChanged {
	new_phase: number;
}

export interface IEventClientsideReloadCustomEcon {
	steamid: string;
}

export interface GameEventsArguments {}
