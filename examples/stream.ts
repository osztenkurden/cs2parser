import { createReadStream, readFileSync, writeFileSync } from 'fs';
import { DemoReader, EntityMode } from './../src/index.js';

const MODES = ['path-stream', 'path-chunked', 'buffer', 'stream'] as const;
type Mode = (typeof MODES)[number];

const args = process.argv.slice(2);
let compareTarget: string | null = null;

// Parse --compare <file> flag
const compareIdx = args.indexOf('--compare');
if (compareIdx !== -1) {
	compareTarget = args[compareIdx + 1] ?? null;
	args.splice(compareIdx, 2);
}

const mode = args[0] as Mode | undefined;
const demoPath = args[1];

if (!mode || !MODES.includes(mode) || !demoPath) {
	console.error(`Usage: bun stream.ts <${MODES.join('|')}> <path-to-demo> [--compare <reference-file>]`);
	process.exit(1);
}

const cancelAfter = false; //args[2] ? parseInt(args[2]) : false;

const output: string[] = [];
const log = (line: string) => {
	output.push(line);
	console.log(line);
};

const parser = new DemoReader();

// Game events are available with EntityMode.ALL or EntityMode.ONLY_GAME_RULES
parser.gameEvents.on('player_death', event => {
	// event.attackerPlayer / event.player are auto-resolved Player helpers
	const attackerInfo = parser.players[event.attacker];
	const attacker = event.attackerPlayer;
	const victim = event.player;

	if (!attacker || !victim) return;

	const pos = attacker.position;
	const victimPos = victim.position;

	log(
		`[${parser.currentTick}] ${attacker.name} (${attackerInfo?.name}) (${attacker.health}hp) killed ${victim.name} with ${event.weapon}${event.headshot ? ' (HS)' : ''}` +
			(pos ? ` from ${pos.x.toFixed(0)},${pos.y.toFixed(0)},${pos.z.toFixed(0)}` : '') +
			(victimPos ? ` at ${victimPos.x.toFixed(0)},${victimPos.y.toFixed(0)},${victimPos.z.toFixed(0)}` : '')
	);
});

// Round end shows team scores via helpers
parser.gameEvents.on('round_end', () => {
	const rules = parser.gameRules;
	let text = `[${parser.currentTick}] `;
	if (rules) {
		text += `Round ${rules.roundsPlayed} ended | phase: ${rules.phase} |`;
	}
	for (const team of parser.teams) {
		if (team.teamNumber < 2) continue;
		text += `  ${team.clanName || team.teamName}: ${team.score}`;
	}
	log(text);
});

parser.on('end', () => {
	// parser.players is always available (from string tables), even without entities
	log('\n=== Final Scoreboard ===');
	for (const pc of parser.playerControllers) {
		if (pc.teamNumber < 2) continue;
		const pos = pc.position;
		log(
			`  ${pc.name.padEnd(12)} team:${pc.teamNumber} k/d/a:${pc.kills}/${pc.deaths}/${pc.assists} money:$${pc.money}` +
				(pos ? ` pos:${pos.x.toFixed(0)},${pos.y.toFixed(0)},${pos.z.toFixed(0)}` : '')
		);
	}

	// parser.players works even with EntityMode.NONE
	log('\n=== Player Info (always available) ===');
	for (const p of parser.players) {
		if (!p) continue;
		log(`  ${p.name?.padEnd(12)} steamid:${p.steamid}`);
	}

	if (compareTarget) {
		compare(compareTarget);
	}
});
// parser.on('header', console.log);
// parser.on('svc_ServerInfo', console.log);
// parser.on('debug', console.log);

/**
 * Decode a Node Buffer as text, auto-detecting UTF-8 / UTF-16 LE / UTF-16 BE BOMs.
 * The repo's `stream_output.txt` reference is stored as UTF-16 LE, but a
 * regenerated one may be UTF-8 depending on the writer — handle both.
 */
function decodeText(buf: Buffer): string {
	if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
		return buf.toString('utf16le').slice(1); // strip BOM
	}
	if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
		// UTF-16 BE — swap bytes, then decode as LE
		const swapped = Buffer.alloc(buf.length - 2);
		for (let i = 2; i < buf.length; i += 2) {
			swapped[i - 2] = buf[i + 1]!;
			swapped[i - 1] = buf[i]!;
		}
		return swapped.toString('utf16le');
	}
	// UTF-8 (with or without BOM)
	const start = buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf ? 3 : 0;
	return buf.subarray(start).toString('utf8');
}

function compare(refPath: string) {
	// Dump actual output alongside the reference so it can be inspected /
	// promoted as the new reference if the diff is intentional.
	const actualPath = refPath.replace(/(\.[^.]+)?$/, '.actual$1');
	writeFileSync(actualPath, output.join('\n') + '\n', 'utf-8');

	const reference = decodeText(readFileSync(refPath));
	// Strip CR so CRLF references and LF actuals compare equal. Also split
	// multi-line entries (e.g. `log('\n=== Header ===')`) so the actual side
	// matches the line-per-entry shape of the reference.
	const normalize = (s: string) => s.replace(/\r$/, '');
	const splitFilter = (s: string) => s.split('\n').map(normalize).filter(l => l.length > 0);
	const refLines = splitFilter(reference);
	const outLines = output.flatMap(splitFilter);

	let mismatches = 0;
	const maxLines = Math.max(refLines.length, outLines.length);

	for (let i = 0; i < maxLines; i++) {
		const ref = refLines[i] ?? '<missing>';
		const out = outLines[i] ?? '<missing>';
		if (ref !== out) {
			if (mismatches === 0) console.log('\n=== Compare: DIFFERENCES FOUND ===');
			mismatches++;
			console.log(`  line ${i + 1}:`);
			console.log(`    expected: ${ref}`);
			console.log(`    actual:   ${out}`);
		}
	}

	console.log(`\n(actual output written to ${actualPath})`);
	if (mismatches === 0) {
		console.log('=== Compare: OK (output matches reference) ===');
	} else {
		console.log(`=== Compare: ${mismatches} difference(s) found ===`);
		process.exitCode = 1;
	}
}
if (cancelAfter !== false) {
	setTimeout(() => {
		parser.cancel();
	}, cancelAfter);
}
switch (mode) {
	case 'path-stream':
		await parser.parseDemo(demoPath, { entities: EntityMode.ALL });
		break;
	case 'path-chunked':
		await parser.parseDemo(demoPath, { entities: EntityMode.ALL, stream: false });
		break;
	case 'buffer':
		await parser.parseDemo(readFileSync(demoPath), { entities: EntityMode.ALL });
		break;
	case 'stream':
		await parser.parseDemo(createReadStream(demoPath), { entities: EntityMode.ALL });
		break;
}
