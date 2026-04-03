import { execSync } from 'child_process';
import { DemoReader } from '.';
import fs from 'fs';
import path from 'path';

const demoPath = '/Users/hubert/demos/demo.dem';

const numberToType = {
	1: 'string',
	2: 'number',
	3: 'number',
	4: 'number',
	5: 'number',
	6: 'boolean',
	7: 'number',
	8: 'number',
	9: 'number'
};
if (process.argv.includes('--proto')) {
	const fileNames = fs.readdirSync(path.join(__dirname, '..', 'proto'));
	const getCommandForFile = (fileName: string) =>
		`cd ../proto && protoc --plugin=protoc-gen-ts_proto=".\\..\\..\\node_modules\\.bin\\protoc-gen-ts_proto.cmd" --ts_proto_opt=esModuleInterop=true --ts_proto_opt=importSuffix=.js --ts_proto_opt=noDefaultsForOptionals=true --ts_proto_opt=forceLong=string --ts_proto_opt=snakeToCamel=false --ts_proto_out=./../../src/ts-proto ./${fileName}`;

	fileNames.forEach(fileName => execSync(getCommandForFile(fileName)));
} else {
	const overwrites: Record<string, Record<string, string>> = {
		round_end: {
			reason: 'WinRoundReason'
		}
	};
	function eventNameToInterfaceName(name: string) {
		const camelCased = name.replace(/(^\w|_\w)/g, g => g.toUpperCase().replace('_', ''));
		return `IEvent${camelCased}`;
	}

	const reader = new DemoReader();

	let listOfEvents = '';
	let interfaceContent = '';
	reader.on('GE_Source1LegacyGameEventList', () => {
		// console.log(reader.gameEvents._eventDescriptors)

		for (const descriptor of Object.values(reader.gameEvents._eventDescriptors)) {
			if (!descriptor.name) continue;

			let content = '';
			for (let i = 0; i < descriptor.keys.length; i++) {
				const desc = descriptor.keys[i]!;

				const valueType =
					overwrites[descriptor.name]?.[desc.name!] ?? numberToType[desc.type as keyof typeof numberToType];
				content += `	${desc.name!}: ${valueType};\n`;

				if (desc.name === 'userid' && descriptor.name !== 'player_connect') {
					content += `	player?: Player | null;\n`;
				}

				if (desc.name === 'attacker') {
					content += `	attackerPlayer?: Player | null;\n`;
				}
				if (desc.name === 'assister') {
					content += `	assisterPlayer?: Player | null;\n`;
				}
			}
			interfaceContent += `\t${descriptor.name}: [${eventNameToInterfaceName(descriptor.name)}];\n`;

			listOfEvents += `export interface ${eventNameToInterfaceName(descriptor.name)} {
${content.trimEnd()}
}\n\n`;
		}
	});
	//   reader.gameEvents.on("gameEvent", (eventName: string, data) => {
	//       if(alreadyLoadedEvents.has(eventName)) return;
	//       alreadyLoadedEvents.add(eventName);
	//       listOfEvents += `export interface ${eventNameToInterfaceName(eventName)} {
	//   ${Object.entries(data).map(([key, value]) => `\t${key}: ${typeof value}`).join("\n")}
	//   }\n\n`;

	//   listOfListeners += `\t\ton(event: "${eventName}", listener: (event: ${eventNameToInterfaceName(eventName)}) => void): this;\n`
	//   listOfListeners += `\t\tonce(event: "${eventName}", listener: (event: ${eventNameToInterfaceName(eventName)}) => void): this;\n`

	//     interfaceContent += `\t${eventName}: [${eventNameToInterfaceName(eventName)}];\n`

	// })

	reader.on('end', () => {
		const tsEventFile = `import type { Player } from '../../helpers/player.js';
import type { WinRoundReason } from '../../helpers/gameRules.js';


${listOfEvents};

export interface _GameEventsArguments {
${interfaceContent}
}

export type EventWithName = {
	[K in keyof _GameEventsArguments]: _GameEventsArguments[K][0] & { event_name: K }
}

export interface GameEventsArguments extends _GameEventsArguments {
	gameEvent: [keyof _GameEventsArguments, EventWithName[keyof _GameEventsArguments]]
}


  `;
		fs.writeFileSync('./parser/descriptors/eventTypes.ts', tsEventFile);
	});

	await reader.parseDemo(demoPath);
}

/*
const demoReader = new DemoReader();

demoReader.on("gameEvent", (eventName, data) => {
	console.log(eventName, data);
})

demoReader.parseStream(fs.createReadStream(demoPath));*/
