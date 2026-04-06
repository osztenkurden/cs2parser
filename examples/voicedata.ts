import { DemoReader } from './../src/index.js';
const demoPath = process.argv[2];

if (!demoPath) {
    console.error(`Usage: bun voicedata.ts <path-to-demo>`);
    process.exit(1);
}

const start = process.hrtime.bigint();
const reader = new DemoReader();
reader.on('svc_VoiceData', console.log);
reader.on('svc_UserMessage', console.log)
reader.on('svc_UserCmds', console.log)
await reader.parseDemo(demoPath, { svc_VoiceData: true, svc_UserCmds: true, svc_UserMessage: true });
const end = process.hrtime.bigint();
const time = Number((end-start))
console.log(`Parsed voice data in ${(time/1000000)}ms`)
                