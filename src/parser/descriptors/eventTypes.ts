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
	player?: Player | null;
}

export interface IEventPlayerConnectFull {
	userid: number;
	player?: Player | null;
}

export interface IEventPlayerFullUpdate {
	userid: number;
	player?: Player | null;
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
	player?: Player | null;
	reason: number;
	name: string;
	networkid: string;
	xuid: number;
	PlayerID: number;
	ever_fully_connected: boolean;
}

export interface IEventPlayerInfo {
	name: string;
	userid: number;
	player?: Player | null;
	steamid: number;
	bot: boolean;
}

export interface IEventPlayerSpawn {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
}

export interface IEventPlayerTeam {
	userid: number;
	player?: Player | null;
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
	player?: Player | null;
	oldname: string;
	newname: string;
}

export interface IEventPlayerHurt {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
	attacker: number;
	attackerPlayer?: Player | null;
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
	player?: Player | null;
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
	player?: Player | null;
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
	player?: Player | null;
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
	player?: Player | null;
	userid_pawn: number;
	attacker: number;
	attackerPlayer?: Player | null;
	attacker_pawn: number;
	assister: number;
	assisterPlayer?: Player | null;
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
	player?: Player | null;
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
	player?: Player | null;
	userid_pawn: number;
	target: number;
}

export interface IEventSpecModeUpdated {
	userid: number;
	player?: Player | null;
}

export interface IEventEntityVisible {
	userid: number;
	player?: Player | null;
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
	player?: Player | null;
	hint_name: string;
	hint_target: number;
	vr_movement_type: number;
	vr_single_controller: boolean;
	vr_controller_type: number;
}

export interface IEventInstructorCloseLesson {
	userid: number;
	player?: Player | null;
	hint_name: string;
}

export interface IEventInstructorServerHintCreate {
	userid: number;
	player?: Player | null;
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
	player?: Player | null;
	userid_pawn: number;
	botid: number;
	p: number;
	y: number;
	r: number;
}

export interface IEventGameuiHidden {}

export interface IEventPlayerScore {
	userid: number;
	player?: Player | null;
	kills: number;
	deaths: number;
	score: number;
}

export interface IEventPlayerShoot {
	userid: number;
	player?: Player | null;
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
	player?: Player | null;
	userid_pawn: number;
	mode: number;
	entindex: number;
}

export interface IEventVoteEnded {}

export interface IEventVoteCast {
	vote_option: number;
	team: number;
	userid: number;
	player?: Player | null;
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
	player?: Player | null;
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
	player?: Player | null;
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
	attackerPlayer?: Player | null;
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
	attackerPlayer?: Player | null;
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
	player?: Player | null;
	team: number;
	loadout: number;
	weapon: string;
}

export interface IEventBombBeginplant {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
	site: number;
}

export interface IEventBombAbortplant {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
	site: number;
}

export interface IEventBombPlanted {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
	site: number;
}

export interface IEventBombDefused {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
	site: number;
}

export interface IEventBombExploded {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
	site: number;
}

export interface IEventBombDropped {
	userid: number;
	player?: Player | null;
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
	player?: Player | null;
	userid_pawn: number;
}

export interface IEventAnnouncePhaseEnd {}

export interface IEventCsIntermission {}

export interface IEventBombBegindefuse {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
	haskit: boolean;
}

export interface IEventBombAbortdefuse {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
}

export interface IEventHostageFollows {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
	hostage: number;
}

export interface IEventHostageHurt {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
	hostage: number;
}

export interface IEventHostageKilled {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
	hostage: number;
}

export interface IEventHostageRescued {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
	hostage: number;
	site: number;
}

export interface IEventHostageStopsFollowing {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
	hostage: number;
}

export interface IEventHostageRescuedAll {}

export interface IEventHostageCallForHelp {
	hostage: number;
}

export interface IEventVipEscaped {
	userid: number;
	player?: Player | null;
}

export interface IEventVipKilled {
	userid: number;
	player?: Player | null;
	attacker: number;
	attackerPlayer?: Player | null;
}

export interface IEventPlayerRadio {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
	slot: number;
}

export interface IEventBombBeep {
	entindex: number;
}

export interface IEventWeaponFire {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
	weapon: string;
	silenced: boolean;
}

export interface IEventWeaponFireOnEmpty {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
	weapon: string;
}

export interface IEventGrenadeThrown {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
	weapon: string;
}

export interface IEventWeaponReload {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
}

export interface IEventWeaponZoom {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
}

export interface IEventSilencerDetach {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
}

export interface IEventInspectWeapon {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
}

export interface IEventWeaponZoomRifle {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
}

export interface IEventPlayerSpawned {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
	inrestart: boolean;
}

export interface IEventItemPickup {
	userid: number;
	player?: Player | null;
	item: string;
	silent: boolean;
	defindex: number;
}

export interface IEventItemPickupSlerp {
	userid: number;
	player?: Player | null;
	index: number;
	behavior: number;
}

export interface IEventItemPickupFailed {
	userid: number;
	player?: Player | null;
	item: string;
	reason: number;
	limit: number;
}

export interface IEventItemRemove {
	userid: number;
	player?: Player | null;
	item: string;
	defindex: number;
}

export interface IEventAmmoPickup {
	userid: number;
	player?: Player | null;
	item: string;
	index: number;
}

export interface IEventItemEquip {
	userid: number;
	player?: Player | null;
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
	player?: Player | null;
	canbuy: boolean;
}

export interface IEventExitBuyzone {
	userid: number;
	player?: Player | null;
	canbuy: boolean;
}

export interface IEventBuytimeEnded {}

export interface IEventEnterBombzone {
	userid: number;
	player?: Player | null;
	hasbomb: boolean;
	isplanted: boolean;
}

export interface IEventExitBombzone {
	userid: number;
	player?: Player | null;
	hasbomb: boolean;
	isplanted: boolean;
}

export interface IEventEnterRescueZone {
	userid: number;
	player?: Player | null;
}

export interface IEventExitRescueZone {
	userid: number;
	player?: Player | null;
}

export interface IEventSilencerOff {
	userid: number;
	player?: Player | null;
}

export interface IEventSilencerOn {
	userid: number;
	player?: Player | null;
}

export interface IEventBuymenuOpen {}

export interface IEventBuymenuClose {
	userid: number;
	player?: Player | null;
}

export interface IEventRoundPrestart {}

export interface IEventRoundPoststart {}

export interface IEventGrenadeBounce {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
}

export interface IEventHegrenadeDetonate {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
	entityid: number;
	x: number;
	y: number;
	z: number;
}

export interface IEventFlashbangDetonate {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
	entityid: number;
	x: number;
	y: number;
	z: number;
}

export interface IEventSmokegrenadeDetonate {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
	entityid: number;
	x: number;
	y: number;
	z: number;
}

export interface IEventSmokegrenadeExpired {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
	entityid: number;
	x: number;
	y: number;
	z: number;
}

export interface IEventMolotovDetonate {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
	x: number;
	y: number;
	z: number;
}

export interface IEventDecoyDetonate {
	userid: number;
	player?: Player | null;
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
	player?: Player | null;
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
	player?: Player | null;
	userid_pawn: number;
	entityid: number;
	x: number;
	y: number;
	z: number;
}

export interface IEventBulletImpact {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
	x: number;
	y: number;
	z: number;
}

export interface IEventPlayerJump {
	userid: number;
	player?: Player | null;
}

export interface IEventPlayerBlind {
	userid: number;
	player?: Player | null;
	attacker: number;
	attackerPlayer?: Player | null;
	entityid: number;
	blind_duration: number;
}

export interface IEventPlayerFalldamage {
	userid: number;
	player?: Player | null;
	userid_pawn: number;
	damage: number;
}

export interface IEventDoorMoving {
	userid: number;
	player?: Player | null;
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
	player?: Player | null;
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
	player?: Player | null;
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
	player?: Player | null;
}

export interface IEventUpdateMatchmakingStats {}

export interface IEventPlayerResetVote {
	userid: number;
	player?: Player | null;
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
	player?: Player | null;
	type: number;
	vote_parameter: number;
}

export interface IEventPlayerGivenC4 {
	userid: number;
	player?: Player | null;
}

export interface IEventJointeamFailed {
	userid: number;
	player?: Player | null;
	reason: number;
}

export interface IEventTeamchangePending {
	userid: number;
	player?: Player | null;
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
	player?: Player | null;
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
	player?: Player | null;
	success: boolean;
}

export interface IEventParachutePickup {
	userid: number;
	player?: Player | null;
}

export interface IEventParachuteDeploy {
	userid: number;
	player?: Player | null;
}

export interface IEventDronegunAttack {
	userid: number;
	player?: Player | null;
}

export interface IEventDroneDispatched {
	userid: number;
	player?: Player | null;
	priority: number;
	drone_dispatched: number;
}

export interface IEventLootCrateVisible {
	userid: number;
	player?: Player | null;
	subject: number;
	type: string;
}

export interface IEventLootCrateOpened {
	userid: number;
	player?: Player | null;
	type: string;
}

export interface IEventOpenCrateInstr {
	userid: number;
	player?: Player | null;
	subject: number;
	type: string;
}

export interface IEventSmokeBeaconParadrop {
	userid: number;
	player?: Player | null;
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
	player?: Player | null;
	cargo: number;
	delivered: boolean;
}

export interface IEventDroneAboveRoof {
	userid: number;
	player?: Player | null;
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
	player?: Player | null;
	subject: number;
	type: string;
}

export interface IEventSurvivalTeammateRespawn {
	userid: number;
	player?: Player | null;
}

export interface IEventSurvivalNoRespawnsWarning {
	userid: number;
	player?: Player | null;
}

export interface IEventSurvivalNoRespawnsFinal {
	userid: number;
	player?: Player | null;
}

export interface IEventPlayerPing {
	userid: number;
	player?: Player | null;
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
	player?: Player | null;
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

export interface _GameEventsArguments {
	server_pre_shutdown: [IEventServerPreShutdown];
	server_shutdown: [IEventServerShutdown];
	server_message: [IEventServerMessage];
	server_cvar: [IEventServerCvar];
	player_activate: [IEventPlayerActivate];
	player_connect_full: [IEventPlayerConnectFull];
	player_full_update: [IEventPlayerFullUpdate];
	player_connect: [IEventPlayerConnect];
	player_disconnect: [IEventPlayerDisconnect];
	player_info: [IEventPlayerInfo];
	player_spawn: [IEventPlayerSpawn];
	player_team: [IEventPlayerTeam];
	local_player_team: [IEventLocalPlayerTeam];
	local_player_controller_team: [IEventLocalPlayerControllerTeam];
	player_changename: [IEventPlayerChangename];
	player_hurt: [IEventPlayerHurt];
	player_chat: [IEventPlayerChat];
	local_player_pawn_changed: [IEventLocalPlayerPawnChanged];
	teamplay_broadcast_audio: [IEventTeamplayBroadcastAudio];
	finale_start: [IEventFinaleStart];
	player_stats_updated: [IEventPlayerStatsUpdated];
	user_data_downloaded: [IEventUserDataDownloaded];
	ragdoll_dissolved: [IEventRagdollDissolved];
	team_info: [IEventTeamInfo];
	team_score: [IEventTeamScore];
	hltv_cameraman: [IEventHltvCameraman];
	hltv_chase: [IEventHltvChase];
	hltv_rank_camera: [IEventHltvRankCamera];
	hltv_rank_entity: [IEventHltvRankEntity];
	hltv_fixed: [IEventHltvFixed];
	hltv_message: [IEventHltvMessage];
	hltv_status: [IEventHltvStatus];
	hltv_title: [IEventHltvTitle];
	hltv_chat: [IEventHltvChat];
	hltv_versioninfo: [IEventHltvVersioninfo];
	hltv_replay: [IEventHltvReplay];
	hltv_replay_status: [IEventHltvReplayStatus];
	demo_stop: [IEventDemoStop];
	map_shutdown: [IEventMapShutdown];
	map_transition: [IEventMapTransition];
	hostname_changed: [IEventHostnameChanged];
	difficulty_changed: [IEventDifficultyChanged];
	game_message: [IEventGameMessage];
	game_newmap: [IEventGameNewmap];
	round_start: [IEventRoundStart];
	round_end: [IEventRoundEnd];
	round_start_pre_entity: [IEventRoundStartPreEntity];
	round_start_post_nav: [IEventRoundStartPostNav];
	round_freeze_end: [IEventRoundFreezeEnd];
	teamplay_round_start: [IEventTeamplayRoundStart];
	player_death: [IEventPlayerDeath];
	player_footstep: [IEventPlayerFootstep];
	player_hintmessage: [IEventPlayerHintmessage];
	break_breakable: [IEventBreakBreakable];
	broken_breakable: [IEventBrokenBreakable];
	break_prop: [IEventBreakProp];
	entity_killed: [IEventEntityKilled];
	door_close: [IEventDoorClose];
	vote_started: [IEventVoteStarted];
	vote_failed: [IEventVoteFailed];
	vote_passed: [IEventVotePassed];
	vote_changed: [IEventVoteChanged];
	vote_cast_yes: [IEventVoteCastYes];
	vote_cast_no: [IEventVoteCastNo];
	achievement_event: [IEventAchievementEvent];
	achievement_earned: [IEventAchievementEarned];
	achievement_write_failed: [IEventAchievementWriteFailed];
	bonus_updated: [IEventBonusUpdated];
	spec_target_updated: [IEventSpecTargetUpdated];
	spec_mode_updated: [IEventSpecModeUpdated];
	entity_visible: [IEventEntityVisible];
	gameinstructor_draw: [IEventGameinstructorDraw];
	gameinstructor_nodraw: [IEventGameinstructorNodraw];
	flare_ignite_npc: [IEventFlareIgniteNpc];
	helicopter_grenade_punt_miss: [IEventHelicopterGrenadePuntMiss];
	physgun_pickup: [IEventPhysgunPickup];
	inventory_updated: [IEventInventoryUpdated];
	cart_updated: [IEventCartUpdated];
	store_pricesheet_updated: [IEventStorePricesheetUpdated];
	item_schema_initialized: [IEventItemSchemaInitialized];
	drop_rate_modified: [IEventDropRateModified];
	event_ticket_modified: [IEventEventTicketModified];
	gc_connected: [IEventGcConnected];
	instructor_start_lesson: [IEventInstructorStartLesson];
	instructor_close_lesson: [IEventInstructorCloseLesson];
	instructor_server_hint_create: [IEventInstructorServerHintCreate];
	instructor_server_hint_stop: [IEventInstructorServerHintStop];
	set_instructor_group_enabled: [IEventSetInstructorGroupEnabled];
	clientside_lesson_closed: [IEventClientsideLessonClosed];
	dynamic_shadow_light_changed: [IEventDynamicShadowLightChanged];
	bot_takeover: [IEventBotTakeover];
	gameui_hidden: [IEventGameuiHidden];
	player_score: [IEventPlayerScore];
	player_shoot: [IEventPlayerShoot];
	game_init: [IEventGameInit];
	game_start: [IEventGameStart];
	game_end: [IEventGameEnd];
	round_announce_match_point: [IEventRoundAnnounceMatchPoint];
	round_announce_final: [IEventRoundAnnounceFinal];
	round_announce_last_round_half: [IEventRoundAnnounceLastRoundHalf];
	round_announce_match_start: [IEventRoundAnnounceMatchStart];
	round_announce_warmup: [IEventRoundAnnounceWarmup];
	warmup_end: [IEventWarmupEnd];
	round_end_upload_stats: [IEventRoundEndUploadStats];
	round_officially_ended: [IEventRoundOfficiallyEnded];
	round_time_warning: [IEventRoundTimeWarning];
	ugc_map_info_received: [IEventUgcMapInfoReceived];
	ugc_map_unsubscribed: [IEventUgcMapUnsubscribed];
	ugc_map_download_error: [IEventUgcMapDownloadError];
	ugc_file_download_finished: [IEventUgcFileDownloadFinished];
	ugc_file_download_start: [IEventUgcFileDownloadStart];
	begin_new_match: [IEventBeginNewMatch];
	dm_bonus_weapon_start: [IEventDmBonusWeaponStart];
	survival_announce_phase: [IEventSurvivalAnnouncePhase];
	player_decal: [IEventPlayerDecal];
	read_game_titledata: [IEventReadGameTitledata];
	write_game_titledata: [IEventWriteGameTitledata];
	reset_game_titledata: [IEventResetGameTitledata];
	weaponhud_selection: [IEventWeaponhudSelection];
	vote_ended: [IEventVoteEnded];
	vote_cast: [IEventVoteCast];
	vote_options: [IEventVoteOptions];
	endmatch_mapvote_selecting_map: [IEventEndmatchMapvoteSelectingMap];
	endmatch_cmm_start_reveal_items: [IEventEndmatchCmmStartRevealItems];
	client_loadout_changed: [IEventClientLoadoutChanged];
	add_player_sonar_icon: [IEventAddPlayerSonarIcon];
	door_open: [IEventDoorOpen];
	door_closed: [IEventDoorClosed];
	door_break: [IEventDoorBreak];
	add_bullet_hit_marker: [IEventAddBulletHitMarker];
	other_death: [IEventOtherDeath];
	bullet_damage: [IEventBulletDamage];
	item_purchase: [IEventItemPurchase];
	bomb_beginplant: [IEventBombBeginplant];
	bomb_abortplant: [IEventBombAbortplant];
	bomb_planted: [IEventBombPlanted];
	bomb_defused: [IEventBombDefused];
	bomb_exploded: [IEventBombExploded];
	bomb_dropped: [IEventBombDropped];
	bomb_pickup: [IEventBombPickup];
	defuser_dropped: [IEventDefuserDropped];
	defuser_pickup: [IEventDefuserPickup];
	announce_phase_end: [IEventAnnouncePhaseEnd];
	cs_intermission: [IEventCsIntermission];
	bomb_begindefuse: [IEventBombBegindefuse];
	bomb_abortdefuse: [IEventBombAbortdefuse];
	hostage_follows: [IEventHostageFollows];
	hostage_hurt: [IEventHostageHurt];
	hostage_killed: [IEventHostageKilled];
	hostage_rescued: [IEventHostageRescued];
	hostage_stops_following: [IEventHostageStopsFollowing];
	hostage_rescued_all: [IEventHostageRescuedAll];
	hostage_call_for_help: [IEventHostageCallForHelp];
	vip_escaped: [IEventVipEscaped];
	vip_killed: [IEventVipKilled];
	player_radio: [IEventPlayerRadio];
	bomb_beep: [IEventBombBeep];
	weapon_fire: [IEventWeaponFire];
	weapon_fire_on_empty: [IEventWeaponFireOnEmpty];
	grenade_thrown: [IEventGrenadeThrown];
	weapon_reload: [IEventWeaponReload];
	weapon_zoom: [IEventWeaponZoom];
	silencer_detach: [IEventSilencerDetach];
	inspect_weapon: [IEventInspectWeapon];
	weapon_zoom_rifle: [IEventWeaponZoomRifle];
	player_spawned: [IEventPlayerSpawned];
	item_pickup: [IEventItemPickup];
	item_pickup_slerp: [IEventItemPickupSlerp];
	item_pickup_failed: [IEventItemPickupFailed];
	item_remove: [IEventItemRemove];
	ammo_pickup: [IEventAmmoPickup];
	item_equip: [IEventItemEquip];
	enter_buyzone: [IEventEnterBuyzone];
	exit_buyzone: [IEventExitBuyzone];
	buytime_ended: [IEventBuytimeEnded];
	enter_bombzone: [IEventEnterBombzone];
	exit_bombzone: [IEventExitBombzone];
	enter_rescue_zone: [IEventEnterRescueZone];
	exit_rescue_zone: [IEventExitRescueZone];
	silencer_off: [IEventSilencerOff];
	silencer_on: [IEventSilencerOn];
	buymenu_open: [IEventBuymenuOpen];
	buymenu_close: [IEventBuymenuClose];
	round_prestart: [IEventRoundPrestart];
	round_poststart: [IEventRoundPoststart];
	grenade_bounce: [IEventGrenadeBounce];
	hegrenade_detonate: [IEventHegrenadeDetonate];
	flashbang_detonate: [IEventFlashbangDetonate];
	smokegrenade_detonate: [IEventSmokegrenadeDetonate];
	smokegrenade_expired: [IEventSmokegrenadeExpired];
	molotov_detonate: [IEventMolotovDetonate];
	decoy_detonate: [IEventDecoyDetonate];
	decoy_started: [IEventDecoyStarted];
	tagrenade_detonate: [IEventTagrenadeDetonate];
	inferno_startburn: [IEventInfernoStartburn];
	inferno_expire: [IEventInfernoExpire];
	inferno_extinguish: [IEventInfernoExtinguish];
	decoy_firing: [IEventDecoyFiring];
	bullet_impact: [IEventBulletImpact];
	player_jump: [IEventPlayerJump];
	player_blind: [IEventPlayerBlind];
	player_falldamage: [IEventPlayerFalldamage];
	door_moving: [IEventDoorMoving];
	mb_input_lock_success: [IEventMbInputLockSuccess];
	mb_input_lock_cancel: [IEventMbInputLockCancel];
	nav_blocked: [IEventNavBlocked];
	nav_generate: [IEventNavGenerate];
	achievement_info_loaded: [IEventAchievementInfoLoaded];
	hltv_changed_mode: [IEventHltvChangedMode];
	cs_game_disconnected: [IEventCsGameDisconnected];
	cs_round_final_beep: [IEventCsRoundFinalBeep];
	cs_round_start_beep: [IEventCsRoundStartBeep];
	cs_win_panel_round: [IEventCsWinPanelRound];
	cs_win_panel_match: [IEventCsWinPanelMatch];
	cs_match_end_restart: [IEventCsMatchEndRestart];
	cs_pre_restart: [IEventCsPreRestart];
	show_deathpanel: [IEventShowDeathpanel];
	hide_deathpanel: [IEventHideDeathpanel];
	player_avenged_teammate: [IEventPlayerAvengedTeammate];
	achievement_earned_local: [IEventAchievementEarnedLocal];
	repost_xbox_achievements: [IEventRepostXboxAchievements];
	match_end_conditions: [IEventMatchEndConditions];
	round_mvp: [IEventRoundMvp];
	show_survival_respawn_status: [IEventShowSurvivalRespawnStatus];
	client_disconnect: [IEventClientDisconnect];
	gg_killed_enemy: [IEventGgKilledEnemy];
	switch_team: [IEventSwitchTeam];
	write_profile_data: [IEventWriteProfileData];
	trial_time_expired: [IEventTrialTimeExpired];
	update_matchmaking_stats: [IEventUpdateMatchmakingStats];
	player_reset_vote: [IEventPlayerResetVote];
	enable_restart_voting: [IEventEnableRestartVoting];
	sfuievent: [IEventSfuievent];
	start_vote: [IEventStartVote];
	player_given_c4: [IEventPlayerGivenC4];
	jointeam_failed: [IEventJointeamFailed];
	teamchange_pending: [IEventTeamchangePending];
	material_default_complete: [IEventMaterialDefaultComplete];
	cs_prev_next_spectator: [IEventCsPrevNextSpectator];
	nextlevel_changed: [IEventNextlevelChanged];
	seasoncoin_levelup: [IEventSeasoncoinLevelup];
	tournament_reward: [IEventTournamentReward];
	start_halftime: [IEventStartHalftime];
	ammo_refill: [IEventAmmoRefill];
	parachute_pickup: [IEventParachutePickup];
	parachute_deploy: [IEventParachuteDeploy];
	dronegun_attack: [IEventDronegunAttack];
	drone_dispatched: [IEventDroneDispatched];
	loot_crate_visible: [IEventLootCrateVisible];
	loot_crate_opened: [IEventLootCrateOpened];
	open_crate_instr: [IEventOpenCrateInstr];
	smoke_beacon_paradrop: [IEventSmokeBeaconParadrop];
	survival_paradrop_spawn: [IEventSurvivalParadropSpawn];
	survival_paradrop_break: [IEventSurvivalParadropBreak];
	drone_cargo_detached: [IEventDroneCargoDetached];
	drone_above_roof: [IEventDroneAboveRoof];
	choppers_incoming_warning: [IEventChoppersIncomingWarning];
	firstbombs_incoming_warning: [IEventFirstbombsIncomingWarning];
	dz_item_interaction: [IEventDzItemInteraction];
	survival_teammate_respawn: [IEventSurvivalTeammateRespawn];
	survival_no_respawns_warning: [IEventSurvivalNoRespawnsWarning];
	survival_no_respawns_final: [IEventSurvivalNoRespawnsFinal];
	player_ping: [IEventPlayerPing];
	player_ping_stop: [IEventPlayerPingStop];
	player_sound: [IEventPlayerSound];
	guardian_wave_restart: [IEventGuardianWaveRestart];
	team_intro_start: [IEventTeamIntroStart];
	team_intro_end: [IEventTeamIntroEnd];
	game_phase_changed: [IEventGamePhaseChanged];
	clientside_reload_custom_econ: [IEventClientsideReloadCustomEcon];
}

export type EventWithName = {
	[K in keyof _GameEventsArguments]: _GameEventsArguments[K][0] & { event_name: K };
};

export interface GameEventsArguments extends _GameEventsArguments {
	gameEvent: [keyof _GameEventsArguments, EventWithName[keyof _GameEventsArguments]];
}
