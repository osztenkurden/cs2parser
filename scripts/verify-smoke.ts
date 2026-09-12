/** Local smoke comparison: bun scripts/verify-smoke.ts DEMO.dem /tmp/cs2-smoke-check [radar.png overview.txt] */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import {
	DemoReader,
	EntityMode,
	decodeSmokeVoxelJournal,
	decodeSmokeVoxelFrame,
	voxelToWorld,
	mortonDecode3,
	mortonEncode3,
	SmokeDensitySimulation
} from '../src/index.js';

type Capture = {
	id: number;
	tick: number;
	effectTick: number;
	origin: [number, number, number];
	data: Uint8Array;
	snapshots: [number, number][];
};
const [demoArg, outputArg, radarPath, overviewPath] = process.argv.slice(2);
if (!demoArg || !outputArg || Boolean(radarPath) !== Boolean(overviewPath)) {
	throw new Error('Usage: bun scripts/verify-smoke.ts DEMO.dem OUTPUT_DIRECTORY [radar.png overview.txt]');
}
const demo = resolve(demoArg),
	output = resolve(outputArg);
const reader = new DemoReader();
const captures = new Map<object, Capture>();
reader.on('tickend', () => {
	for (let id = 0; id < reader.entities.length; id++) {
		const entity = reader.entities[id];
		if (entity?.className !== 'CSmokeGrenadeProjectile') continue;
		const properties = entity.properties as Record<string, unknown>;
		const data = properties['CSmokeGrenadeProjectile.m_VoxelFrameData'];
		const size = properties['CSmokeGrenadeProjectile.m_nVoxelFrameDataSize'];
		const origin = properties['CSmokeGrenadeProjectile.m_vSmokeDetonationPos'];
		const effectTick = properties['CSmokeGrenadeProjectile.m_nSmokeEffectTickBegin'];
		if (
			!(data instanceof Uint8Array) ||
			typeof size !== 'number' ||
			size <= 0 ||
			!Array.isArray(origin) ||
			typeof effectTick !== 'number'
		)
			continue;
		let capture = captures.get(entity);
		if (!capture) {
			capture = {
				id,
				tick: reader.currentTick,
				effectTick,
				origin: origin.slice() as Capture['origin'],
				data: new Uint8Array(),
				snapshots: []
			};
			captures.set(entity, capture);
		}
		if (size > capture.data.length) {
			capture.data = data.slice(0, size);
			capture.snapshots.push([reader.currentTick, size]);
		}
	}
});
const outcome = await reader.parseDemo(demo, { entities: EntityMode.ALL, stream: false });
if (outcome.status !== 'complete') throw new Error(`Demo parse ${outcome.status}`);
if ((reader.header?.patch_version ?? Infinity) <= 13963)
	throw new Error('This comparison supports the modern smoke payload only (patch > 13963).');
const unique = new Map<string, Capture>();
for (const capture of captures.values()) {
	const key = JSON.stringify([capture.effectTick, capture.origin]);
	const existing = unique.get(key);
	if (!existing) unique.set(key, { ...capture, snapshots: [...capture.snapshots] });
	else {
		if (capture.data.length > existing.data.length) existing.data = capture.data;
		existing.snapshots.push(...capture.snapshots);
		existing.snapshots.sort((a, b) => a[0] - b[0]);
		existing.tick = Math.min(existing.tick, capture.tick);
	}
}
const list = [...unique.values()].filter(c => c.snapshots.length >= 20).sort((a, b) => a.tick - b.tick);
if (!list.length) throw new Error('No sufficiently long smoke journals found');
// Include different locations and the largest vertical seed spread, rather than many repeats of one smoke.
const selected: Capture[] = [list[0]!];
for (const candidate of list) {
	if (selected.length >= 3) break;
	if (selected.every(c => Math.hypot(...candidate.origin.map((v, i) => v - c.origin[i]!)) > 500))
		selected.push(candidate);
}
const verticalRange = (c: Capture) => {
	const seeds = decodeSmokeVoxelFrame(decodeSmokeVoxelJournal(c.data)[0]!.payload).seeds ?? [];
	const z = seeds.map(v => v.z);
	return Math.max(...z) - Math.min(...z);
};
const vertical = [...list].sort((a, b) => verticalRange(b) - verticalRange(a))[0]!;
if (!selected.includes(vertical)) selected.push(vertical);
let radar: { data: string; x: number; y: number; scale: number } | null = null;
if (radarPath && overviewPath) {
	const overview = await readFile(overviewPath, 'utf8');
	const value = (key: string) => {
		const match = overview.match(new RegExp(`"${key}"\\s+"([^"\\r\\n]+)"`));
		const result = Number(match?.[1]);
		if (!Number.isFinite(result)) throw new Error(`Missing overview ${key}`);
		return result;
	};
	radar = {
		data: `data:image/png;base64,${(await readFile(radarPath)).toString('base64')}`,
		x: value('pos_x'),
		y: value('pos_y'),
		scale: value('scale')
	};
	if (radar.scale <= 0) throw new Error('Invalid overview scale');
}
await mkdir(output, { recursive: true });
const cases = [];
for (const [index, capture] of selected.entries()) {
	const frames = decodeSmokeVoxelJournal(capture.data);
	const simulation = new SmokeDensitySimulation(capture.origin);
	let offset = 0,
		seeds: ReturnType<typeof decodeSmokeVoxelFrame>['seeds'] = null;
	const steps = frames.map(frame => {
		offset += 4 + frame.payload.length;
		const inputs = decodeSmokeVoxelFrame(frame.payload);
		if (inputs.seeds !== null) seeds = inputs.seeds;
		simulation.step(frame);
		const density = simulation.snapshot().density;
		const volume = Array.from(density.keys()).filter(i => density[i]! > 5);
		const tick = capture.snapshots.find(([, size]) => size >= offset)![0];
		return {
			seq: frame.seq,
			volume,
			tick,
			stopSeeding: inputs.stopSeeding,
			seeds: seeds!.map(v => [v.x, v.y, v.z]),
			updates: inputs.blockedUpdates.map(v => [v.index, v.mask.toString()] as const)
		};
	});
	const target = steps.find(s => s.tick >= capture.tick + 128) ?? steps.at(-1)!;
	const fmt = (v: number) => v.toFixed(3);
	const camera = [...capture.origin.map((v, i) => v + [0, -420, 260][i]!), 25, 90].map(fmt).join(' ');
	const cfg = [
		'// Run after seeking has completed. Cyan: simulated density > 5, boundary cells only. Raw density is not opacity.',
		'sv_cheats 1',
		'spec_mode 6',
		`spec_goto ${camera}`,
		`cl_axis ${capture.origin.map(fmt).join(' ')} 0 0 0 120 255 220 0 255`
	];
	const occupied = new Set(target.volume);
	const surface = target.volume.filter(i => {
		const xyz = mortonDecode3(i);
		return [
			[-1, 0, 0],
			[1, 0, 0],
			[0, -1, 0],
			[0, 1, 0],
			[0, 0, -1],
			[0, 0, 1]
		].some(delta => {
			const [x, y, z] = xyz.map((v, a) => v + delta[a]!);
			return (
				x! < 0 || x! > 31 || y! < 0 || y! > 31 || z! < 0 || z! > 31 || !occupied.has(mortonEncode3(x!, y!, z!))
			);
		});
	});
	for (const i of surface) {
		const [x, y, z] = mortonDecode3(i);
		const world = voxelToWorld(x!, y!, z!, capture.origin);
		cfg.push(
			`cl_box ${[...world.map(v => v - 10), ...world.map(v => v + 10)].map(fmt).join(' ')} 120 0 220 255 80`
		);
	}
	const file = `smoke-density-${index + 1}.cfg`;
	await writeFile(join(output, file), cfg.join('\n') + '\n');
	cases.push({
		name: `Case ${index + 1} · entity ${capture.id}`,
		origin: capture.origin,
		effectTick: capture.effectTick,
		firstTick: capture.tick,
		targetSeq: target.seq,
		targetTick: target.tick,
		camera,
		surfaceCells: surface.length,
		cfg: file,
		steps
	});
}
const data = {
	demo,
	map: reader.header?.map_name,
	patchVersion: reader.header?.patch_version,
	serverStartTick: reader.header?.server_start_tick,
	radar,
	cases,
	// A tiny lookup avoids bundling the parser into the local browser comparison.
	coordinates: Array.from({ length: 32768 }, (_, i) => mortonDecode3(i))
};
const viewer3d = await readFile(new URL('./smoke-viewer-3d.js', import.meta.url), 'utf8');
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Smoke density check</title>
<style>body{font:16px system-ui;background:#111923;color:#e3edf5;margin:24px}h1{font-size:24px}button,select,input{font:inherit;margin:6px}canvas{background:#192632;width:32%;max-width:600px;border:1px solid #465766}pre{white-space:pre-wrap;background:#202d39;padding:12px}.hint{color:#b1c1cf}label{display:inline-block}#readout{min-height:3em}#view3d{display:block;width:100%;max-width:none;height:600px;touch-action:none;cursor:grab}#view3d:active{cursor:grabbing}</style>
<h1>Smoke density check</h1><p id="map"></p>
<p>Blue: simulated cells with raw density > 5. Cyan: transmitted seeds. Yellow: detonation point. The threshold is a comparison aid, not a verified visible-cloud boundary; shaders add noise and fading.</p>
<select id="case"></select><button id="previous">Previous frame</button><button id="next">Next frame</button>
<input id="frame" type="range" min="0" value="0"><label><input id="old" type="checkbox">Show previous, incorrect mapping in red</label>
<label><input id="volume" type="checkbox" checked>Show density > 5</label><label><input id="seeds" type="checkbox">Show seeds</label>
<label><input id="mask" type="checkbox">Rejection mask at selected Z slice</label><label>Z slice <input id="slice" type="range" min="0" max="31" value="16"></label>
<p id="readout"></p>
<p><strong>3D view</strong> · Drag to orbit · Wheel to zoom · Shift-drag or right-drag to pan</p>
<button id="view3d-reset">Reset camera</button><button id="view3d-top">Top view</button>
<label><input id="radar-show" type="checkbox" checked>Radar plane</label>
<label>Height <input id="radar-height" type="range" min="-1000" max="1000" step="1" value="0"><output id="radar-height-value"></output></label>
<button id="radar-at-origin">At detonation height</button>
<label>Opacity <input id="radar-opacity" type="range" min="0" max="1" step="0.05" value="0.4"><output id="radar-opacity-value"></output></label>
<p id="view3d-status" class="hint">Radar is a flat reference image, not map geometry. Axes: X red, Y green, Z blue. Plane height resets to detonation height when changing smoke.</p>
<canvas id="view3d" aria-label="Interactive 3D smoke volume"></canvas>
<p><strong>Axis projections</strong></p><canvas id="xy" width="600" height="600"></canvas> <canvas id="xz" width="600" height="600"></canvas> <canvas id="yz" width="600" height="600"></canvas>
<p class="hint">XY and 3D use the supplied radar image; it may differ from the demo's map revision. Side views have no map mesh. Frame tick is the first parser tick carrying those bytes, not a measured client render time.</p>
<pre id="commands"></pre><p class="hint">Load the demo, seek and wait for playback to settle, then execute the overlay cfg from your game's cfg folder. If boxes do not appear, retain a screenshot and the console response. The cfg draws boundary cells with raw density > 5. Compare where the volume grows and meets walls; a screenshot alone cannot establish numerical density or shader equivalence.</p>
<script id="data" type="application/json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
<script>
${viewer3d}
const data=JSON.parse(document.getElementById('data').textContent),byId=id=>document.getElementById(id);
const choice=byId('case'),slider=byId('frame'),img=new Image();let current;
const view3d=createSmoke3D(byId('view3d'),data,img,byId);
byId('map').textContent=data.map+' · patch '+data.patchVersion;
data.cases.forEach((c,i)=>{const o=document.createElement('option');o.value=i;o.textContent=c.name;choice.append(o)});
for(const id of ['volume','seeds'])byId(id).onchange=()=>render();
function render(){
 const c=data.cases[Number(choice.value)],step=c.steps[Number(slider.value)],words=Array(512).fill(0n);current=c;
 for(let i=0;i<=Number(slider.value);i++)for(const [j,w] of c.steps[i].updates)words[j]=BigInt(w);
 const blocked=[];if(byId('mask').checked)for(let i=0;i<32768;i++)if(data.coordinates[i][2]===Number(byId('slice').value)&&(words[i>>6]&(1n<<BigInt(i&63))))blocked.push(data.coordinates[i]);
 view3d.update(c,step,blocked);
 byId('readout').textContent='Frame '+step.seq+' · first observed demo tick '+step.tick+' · '+step.seeds.length+' transmitted seeds · '+step.volume.length+' cells above density 5 · stop seeding: '+step.stopSeeding+' · Z slice '+byId('slice').value;
 const target=step.tick;
 byId('commands').textContent='playdemo "'+data.demo+'"\\n\\n// Seek first; wait for the seek to finish.\\ndemo_goto '+target+' 0 1\\n\\n// The saved cfg targets demo tick '+c.targetTick+' (frame '+c.targetSeq+').\\nexec '+c.cfg+'\\n\\n// For this selected frame, use the same camera:\\nspec_mode 6\\nspec_goto '+c.camera;
 for(const [name,a,b] of [['xy',0,1],['xz',0,2],['yz',1,2]]){
  const canvas=byId(name),ctx=canvas.getContext('2d'),scale=600/640;
  ctx.clearRect(0,0,600,600);
  const point=w=>[300+(w[a]-c.origin[a])*scale,300-(w[b]-c.origin[b])*scale];
  if(name==='xy'&&data.radar&&img.complete&&img.naturalWidth){
   const r=data.radar,pixelScale=img.naturalWidth/1024;
   ctx.globalAlpha=.65;ctx.drawImage(img,(c.origin[0]-320-r.x)/r.scale*pixelScale,(r.y-c.origin[1]-320)/r.scale*pixelScale,640/r.scale*pixelScale,640/r.scale*pixelScale,0,0,600,600);ctx.globalAlpha=1;
  }
  ctx.strokeStyle='#536372';ctx.lineWidth=.5;
  for(let n=0;n<=32;n++){const p=n*600/32;ctx.beginPath();ctx.moveTo(p,0);ctx.lineTo(p,600);ctx.moveTo(0,p);ctx.lineTo(600,p);ctx.stroke();}
  const draw=(grid,color,old=false)=>{
   const relative=old?[-(grid[2]-16)*20,(grid[1]-16)*20,(grid[0]-16)*20]:grid.map(v=>(v-16)*20+10);
   const p=point(relative.map((v,i)=>v+c.origin[i]));ctx.fillStyle=color;ctx.fillRect(p[0]-10*scale,p[1]-10*scale,20*scale,20*scale);
  };
  blocked.forEach(p=>draw(p,'#aaaaaa88'));
  if(byId('volume').checked)step.volume.forEach(i=>draw(data.coordinates[i],'#398ef044'));
  if(byId('seeds').checked)step.seeds.forEach(p=>draw(p,'#00ddffaa'));
  if(byId('old').checked)step.seeds.forEach(p=>draw(p,'#ff596c77',true));
  ctx.fillStyle='#ffe16d';ctx.beginPath();ctx.arc(300,300,5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='white';ctx.font='16px system-ui';ctx.fillText(name.toUpperCase()+' · +'+['X','Y','Z'][a]+' right / +'+['X','Y','Z'][b]+' up',12,24);
 }
}
function select(){const c=data.cases[Number(choice.value)];slider.max=c.steps.length-1;slider.value=c.targetSeq;render()}
choice.onchange=select;slider.oninput=render;byId('old').onchange=render;byId('mask').onchange=render;byId('slice').oninput=render;
byId('previous').onclick=()=>{slider.value=Math.max(0,Number(slider.value)-1);render()};byId('next').onclick=()=>{slider.value=Math.min(Number(slider.max),Number(slider.value)+1);render()};
if(data.radar){img.onload=render;img.src=data.radar.data}select();
</script></html>`;
await writeFile(join(output, 'comparison.html'), html);
console.log(`Open ${join(output, 'comparison.html')}`);
for (const c of cases) console.log(`${c.name}: demo_goto ${c.targetTick} 0 1; after seeking: exec ${c.cfg}`);
