import { DemoReader } from './../src/index.js';
const demoPath = process.argv[2];

if (!demoPath) {
	console.error(`Usage: bun voicedata.ts <path-to-demo>`);
	process.exit(1);
}

const start = process.hrtime.bigint();
const reader = new DemoReader();

// svc_VoiceInit carries the codec and sample rate the voice payloads are encoded
// with — you need it to turn svc_VoiceData into audio.
reader.on('svc_VoiceInit', init => console.log('voice codec:', init.codec, 'quality:', init.quality));

let packets = 0;
let bytes = 0;
reader.on('svc_VoiceData', data => {
	packets++;
	bytes += data.audio?.voice_data?.length ?? 0;
});

reader.on('CS_UM_ServerRankUpdate', console.log);

// Listening is all it takes — messages are decoded when something wants them.
await reader.parseDemo(demoPath);

const ms = Number(process.hrtime.bigint() - start) / 1_000_000;
console.log(`${packets} voice packets, ${bytes} bytes of audio, parsed in ${ms.toFixed(0)}ms`);
