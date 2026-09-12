/** Embedded by verify-smoke.ts; no imports or network assets in the generated page. */
function createSmoke3D(canvas, data, image, byId) {
	const gl = canvas.getContext('webgl', { alpha: false, antialias: true });
	if (!gl) {
		byId('view3d-status').textContent = 'WebGL unavailable; the 2D views still work.';
		return { update() {} };
	}
	const program = gl.createProgram();
	for (const [type, source] of [
		[
			gl.VERTEX_SHADER,
			`
 attribute vec3 position; attribute vec4 color; attribute vec2 uv;
 uniform vec3 right, up, eye, target; uniform vec2 extent;
 varying vec4 tint; varying vec2 texcoord;
 void main(){vec3 p=position-target;gl_Position=vec4(dot(p,right)/extent.x,dot(p,up)/extent.y,-dot(p,eye)/20000.0,1.0);tint=color;texcoord=uv;}`
		],
		[
			gl.FRAGMENT_SHADER,
			`
 precision mediump float; varying vec4 tint; varying vec2 texcoord;
 uniform sampler2D radar; uniform bool textured;
 void main(){gl_FragColor=tint*(textured?texture2D(radar,texcoord):vec4(1.0));}`
		]
	]) {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader));
		gl.attachShader(program, shader);
		gl.deleteShader(shader);
	}
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
	gl.useProgram(program);
	const uniforms = Object.fromEntries(
		['right', 'up', 'eye', 'target', 'extent', 'textured', 'radar'].map(k => [k, gl.getUniformLocation(program, k)])
	);
	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	for (const [name, size, offset] of [
		['position', 3, 0],
		['color', 4, 12],
		['uv', 2, 28]
	]) {
		const a = gl.getAttribLocation(program, name);
		gl.enableVertexAttribArray(a);
		gl.vertexAttribPointer(a, size, gl.FLOAT, false, 36, offset);
	}
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	let uploaded = false,
		state,
		mesh = new Float32Array(),
		yaw = -Math.PI / 2 + 0.65,
		pitch = 0.65,
		span = 1000,
		target = [0, 0, 0];
	let right, up, eye;
	const height = byId('radar-height'),
		opacity = byId('radar-opacity');
	function basis() {
		right = [-Math.sin(yaw), Math.cos(yaw), 0];
		up = [-Math.cos(yaw) * Math.sin(pitch), -Math.sin(yaw) * Math.sin(pitch), Math.cos(pitch)];
		eye = [Math.cos(yaw) * Math.cos(pitch), Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch)];
	}
	function submit(vertices, mode, textured = false) {
		gl.uniform1i(uniforms.textured, Number(textured));
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
		gl.drawArrays(mode, 0, vertices.length / 9);
	}
	function draw() {
		if (!state) return;
		const ratio = Math.min(devicePixelRatio || 1, 2),
			w = Math.round(canvas.clientWidth * ratio),
			h = Math.round(canvas.clientHeight * ratio);
		if (canvas.width !== w || canvas.height !== h) {
			canvas.width = w;
			canvas.height = h;
		}
		gl.viewport(0, 0, w, h);
		gl.clearColor(0.075, 0.11, 0.15, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		basis();
		for (const [name, v] of Object.entries({ right, up, eye, target })) gl.uniform3fv(uniforms[name], v);
		gl.uniform2f(uniforms.extent, (span * w) / h / 2, span / 2);
		gl.enable(gl.DEPTH_TEST);
		gl.depthMask(true);
		gl.disable(gl.BLEND);
		submit(mesh, gl.TRIANGLES);
		const axes = [];
		for (let a = 0; a < 3; a++) {
			const color = [a === 0 ? 1 : 0.2, a === 1 ? 1 : 0.2, a === 2 ? 1 : 0.2, 1],
				end = [0, 0, 0];
			end[a] = 180;
			axes.push(0, 0, 0, ...color, 0, 0, ...end, ...color, 0, 0);
		}
		submit(new Float32Array(axes), gl.LINES);
		if (data.radar && image.complete && image.naturalWidth && byId('radar-show').checked) {
			if (!uploaded) {
				gl.bindTexture(gl.TEXTURE_2D, texture);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
				uploaded = true;
			}
			const r = data.radar,
				c = state.c,
				x = r.x - c.origin[0],
				y = r.y - c.origin[1],
				size = 1024 * r.scale,
				z = Number(height.value) - c.origin[2];
			const corners = [
					[x, y, z, 0, 0],
					[x + size, y, z, 1, 0],
					[x + size, y - size, z, 1, 1],
					[x, y - size, z, 0, 1]
				],
				plane = [];
			for (const i of [0, 1, 2, 0, 2, 3]) {
				const p = corners[i];
				plane.push(...p.slice(0, 3), 1, 1, 1, Number(opacity.value), ...p.slice(3));
			}
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
			gl.depthMask(false);
			submit(new Float32Array(plane), gl.TRIANGLES, true);
			gl.depthMask(true);
		}
		byId('radar-height-value').textContent = Number(height.value).toFixed(0) + ' world Z';
		byId('radar-opacity-value').textContent = Math.round(Number(opacity.value) * 100) + '%';
	}
	function rebuild() {
		const vertices = [],
			faces = [
				[
					[1, 0, 0],
					[
						[1, -1, -1],
						[1, 1, -1],
						[1, 1, 1],
						[1, -1, 1]
					]
				],
				[
					[-1, 0, 0],
					[
						[-1, 1, -1],
						[-1, -1, -1],
						[-1, -1, 1],
						[-1, 1, 1]
					]
				],
				[
					[0, 1, 0],
					[
						[1, 1, -1],
						[-1, 1, -1],
						[-1, 1, 1],
						[1, 1, 1]
					]
				],
				[
					[0, -1, 0],
					[
						[-1, -1, -1],
						[1, -1, -1],
						[1, -1, 1],
						[-1, -1, 1]
					]
				],
				[
					[0, 0, 1],
					[
						[-1, -1, 1],
						[1, -1, 1],
						[1, 1, 1],
						[-1, 1, 1]
					]
				],
				[
					[0, 0, -1],
					[
						[-1, 1, -1],
						[1, 1, -1],
						[1, -1, -1],
						[-1, -1, -1]
					]
				]
			];
		function cubes(cells, color, old = false) {
			const occupied = new Set(cells.map(p => p.join(',')));
			for (const p of cells)
				for (let side = 0; side < 6; side++) {
					const [normal, corners] = faces[side];
					if (occupied.has(p.map((v, a) => v + normal[a]).join(','))) continue;
					const center = old
						? [-(p[2] - 16) * 20, (p[1] - 16) * 20, (p[0] - 16) * 20]
						: p.map(v => (v - 16) * 20 + 10);
					const shade = [0.8, 0.65, 0.9, 0.7, 1, 0.55][side];
					for (const i of [0, 1, 2, 0, 2, 3])
						vertices.push(
							...center.map((v, a) => v + corners[i][a] * 10),
							...color.map(v => v * shade),
							1,
							0,
							0
						);
				}
		}
		if (byId('volume').checked)
			cubes(
				state.step.volume.map(i => data.coordinates[i]),
				[0.18, 0.53, 0.95]
			);
		if (byId('seeds').checked) cubes(state.step.seeds, [0, 0.95, 1]);
		if (byId('old').checked) cubes(state.step.seeds, [1, 0.25, 0.35], true);
		if (byId('mask').checked) cubes(state.blocked, [0.65, 0.65, 0.65]);
		// Small yellow detonation marker, independent of voxel coordinates.
		for (const [, corners] of faces)
			for (const i of [0, 1, 2, 0, 2, 3]) vertices.push(...corners[i].map(v => v * 4), 1, 0.85, 0.2, 1, 0, 0);
		mesh = new Float32Array(vertices);
		draw();
	}
	let drag;
	canvas.oncontextmenu = e => e.preventDefault();
	canvas.onpointerdown = e => {
		canvas.setPointerCapture(e.pointerId);
		drag = { x: e.clientX, y: e.clientY, pan: e.button === 2 || e.shiftKey };
	};
	canvas.onpointermove = e => {
		if (!drag) return;
		const dx = e.clientX - drag.x,
			dy = e.clientY - drag.y;
		drag.x = e.clientX;
		drag.y = e.clientY;
		if (drag.pan) {
			basis();
			target = target.map((v, a) => v + ((-dx * right[a] + dy * up[a]) * span) / canvas.clientHeight);
		} else {
			yaw -= dx * 0.008;
			pitch = Math.max(-1.55, Math.min(1.55, pitch + dy * 0.008));
		}
		draw();
	};
	canvas.onpointerup =
		canvas.onpointercancel =
		canvas.onlostpointercapture =
			() => {
				drag = null;
			};
	canvas.addEventListener(
		'wheel',
		e => {
			e.preventDefault();
			span = Math.max(160, Math.min(14000, span * Math.exp(e.deltaY * 0.001)));
			draw();
		},
		{ passive: false }
	);
	byId('view3d-reset').onclick = () => {
		yaw = -Math.PI / 2 + 0.65;
		pitch = 0.65;
		span = 1000;
		target = [0, 0, 0];
		draw();
	};
	byId('view3d-top').onclick = () => {
		yaw = -Math.PI / 2;
		pitch = Math.PI / 2;
		draw();
	};
	height.oninput = opacity.oninput = draw;
	byId('radar-show').onchange = draw;
	byId('radar-at-origin').onclick = () => {
		height.value = Math.round(state.c.origin[2]);
		draw();
	};
	if (!data.radar) {
		byId('view3d-status').textContent =
			'No radar supplied. Regenerate with radar PNG and overview arguments to enable the plane.';
		for (const id of ['radar-height', 'radar-opacity', 'radar-show', 'radar-at-origin']) byId(id).disabled = true;
	}
	new ResizeObserver(draw).observe(canvas);
	return {
		update(c, step, blocked) {
			if (state?.c !== c) {
				height.min = Math.floor(c.origin[2] - 1000);
				height.max = Math.ceil(c.origin[2] + 1000);
				height.value = Math.round(c.origin[2]);
				target = [0, 0, 0];
			}
			state = { c, step, blocked };
			rebuild();
		}
	};
}
