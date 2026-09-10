/**
 * bun scripts/analyze-players.ts "C:\steamcmd\bot_gameplay.dem"
 *
 * Scores come from controller properties; event counters cover only this recording.
 * Uses event annotations and reports references to previous pawns separately.
 * Tracks full userIDs across helper rebuilds, keeping reused user slots separate.
 */
import { DemoReader, EntityMode, type Player } from '../src/index.js';

const demoPath = process.argv[2];
if (!demoPath) throw new Error('Usage: bun scripts/analyze-players.ts <demo.dem>');

const reader = new DemoReader();
type Row = ReturnType<typeof playerSnapshot> & {
	shots: number;
	eventKills: number;
	eventDeaths: number;
	eventAssists: number;
	headshots: number;
	commands: number;
};
const rows: Row[] = [];
const active = new Map<number, Row>();
const coverage = {
	roles: 0,
	annotated: 0,
	botRoles: 0,
	botAnnotated: 0,
	unresolved: 0,
	changedPawnReferences: 0
};
const events = { weapon_fire: 0, player_hurt: 0, player_death: 0 };
let commands = 0;
let unresolvedCommands = 0;
let unmappedCommands = 0;
let rounds = 0;
let nextSample = 0;
const diagnostics = new Set<string>();

function playerSnapshot(player: Player) {
	const info = player.userInfo;
	return {
		userId: info?.userid,
		name: player.name,
		kind: player.isHLTV ? 'TV' : player.isBot ? 'bot' : info ? 'human' : 'unknown',
		team: player.teamNumber,
		kills: player.kills,
		deaths: player.deaths,
		assists: player.assists,
		damage: player.damage,
		position: player.position,
		eyeAngles: player.eyeAngles
	};
}

function rowFor(player: Player): Row {
	const slot = player.userSlot;
	const userId = player.userInfo?.userid;
	let row = active.get(slot);
	if (!row || (row.userId !== undefined && userId !== undefined && row.userId !== userId)) {
		row = {
			...playerSnapshot(player),
			shots: 0,
			eventKills: 0,
			eventDeaths: 0,
			eventAssists: 0,
			headshots: 0,
			commands: 0
		};
		active.set(slot, row);
		rows.push(row);
	}
	if (userId !== undefined) row.userId = userId;
	return row;
}

function snapshot() {
	for (const player of reader.playerControllers) {
		Object.assign(rowFor(player), playerSnapshot(player));
	}
}

type CombatEvent = Record<string, unknown>;
function actor(event: CombatEvent, role: 'userid' | 'attacker' | 'assister', annotation: string): Row | null {
	const userId = event[role];
	if (typeof userId !== 'number' || !Number.isInteger(userId) || userId < 0 || (userId & 255) === 255) return null;
	coverage.roles++;
	if (event[annotation]) coverage.annotated++;
	const info = reader.players[userId & 255];
	if (info?.fakeplayer && !info.ishltv) {
		coverage.botRoles++;
		if (event[annotation]) coverage.botAnnotated++;
	}
	const player = event[annotation] as Player | null | undefined;
	const pawnHandle = event[`${role}_pawn`];
	if (!player) {
		coverage.unresolved++;
		return null;
	}
	if (typeof pawnHandle === 'number' && pawnHandle !== -1 && player.pawnEntityId !== (pawnHandle & 0x7ff)) {
		coverage.changedPawnReferences++;
	}
	return rowFor(player);
}

for (const name of ['weapon_fire', 'player_hurt', 'player_death'] as const)
	reader.gameEvents.on(name, (data: unknown) => {
		events[name]++;
		const event = data as CombatEvent;
		const victim = actor(event, 'userid', 'player');
		if (name === 'weapon_fire') {
			if (victim) victim.shots++;
			return;
		}
		const attacker = actor(event, 'attacker', 'attackerPlayer');
		if (name === 'player_death') {
			if (victim) victim.eventDeaths++;
			if (attacker && attacker !== victim) {
				attacker.eventKills++;
				if (event.headshot) attacker.headshots++;
			}
			const assister = actor(event, 'assister', 'assisterPlayer');
			if (assister) assister.eventAssists++;
		}
	});
reader.gameEvents.on('round_end', () => rounds++);
reader.on('usercommand', command => {
	commands++;
	if (!command.cmd) unresolvedCommands++;
	const player = reader.getPlayerBySlot(command.playerSlot);
	if (player) rowFor(player).commands++;
	else unmappedCommands++;
});
reader.on('tickend', tick => {
	if (tick < nextSample) return;
	snapshot();
	nextSample = tick + 64;
});
reader.on('debug', message => {
	if (!message.includes('Parsed demo in')) diagnostics.add(message);
});

const end = await reader.parseDemo(demoPath, { entities: EntityMode.ALL });
snapshot();
console.log(`${reader.header?.map_name ?? 'unknown map'} | tick ${reader.currentTick} | ${rounds} round ends`);
console.log('Controller scores; shots, event K/D/A, headshots and commands observed in this recording:');
console.table(
	rows
		.filter(row => row.kind !== 'TV')
		.map(row => ({
			userId: row.userId,
			name: row.name,
			kind: row.kind,
			team: row.team,
			K: row.kills,
			D: row.deaths,
			A: row.assists,
			damage: row.damage,
			shots: row.shots,
			eventKDA: `${row.eventKills}/${row.eventDeaths}/${row.eventAssists}`,
			HS: row.headshots,
			commands: row.commands,
			position: row.position
				? Object.values(row.position)
						.map(n => n.toFixed(0))
						.join(', ')
				: 'missing',
			aim: `${row.eyeAngles.pitch.toFixed(1)}, ${row.eyeAngles.yaw.toFixed(1)}`
		}))
);
console.log(
	JSON.stringify(
		{ end, events, coverage, commands, unresolvedCommands, unmappedCommands, diagnostics: [...diagnostics] },
		null,
		2
	)
);
if (end.status !== 'complete' || coverage.unresolved > 0) process.exitCode = 1;
