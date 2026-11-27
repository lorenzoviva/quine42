// Where a frame's time goes (T331, docs/design/gpu.md): the kernel's tick divided into its parts (Lua systems, society, water, places,
// solids…), the drawing divided into its parts (places built, entities, corona, lights, the bloom pass that submits the draw calls),
// the GPU's time (EXT_disjoint_timer_query_webgl2, when the browser gives it), draw calls and triangles, and the workers: how many
// programs they ran, how long each took, how much of the window they were busy. In headless Chrome on the real GPU (a tab of Claude in
// Chrome runs at about 1 Hz: `docs/architettura-dettagli.md#convalida-browser`). With a preview already serving the build:
//
//   node lab/scripts/misura-frame.mjs <port> [--secondi 8] [--chrome <chrome.exe>] [--json out.json] [--modello <file.xml> --scatola 400,400,160]
//   node lab/scripts/misura-frame.mjs <port> --blocco <file.xml> [--vpt 10] [--luogo 20,24] [--json out.json]
//
// `--modello` (T356): after the cold load, the program of that file is put in the library at that box (as a structure at 20 voxels a tile,
// straight into the repository: the validator's quality checks are not the question here) and worn by an entity beside the wanderer; the
// frame is measured while the worker makes it and once it is drawn, from inside it.
//
// `--blocco` (T404, ADR-0208): after the cold load, the program of that file enters the library as a Gargantuan structure at its own box
// and at `--vpt` voxels a tile (the author's fort: 10, a block of 3 × 3 places; 20, the block of 2 × 2 of T370), the Cartographer of the
// offline models asks for it at `--luogo`, the block is taken, the wanderer goes three tiles south of its lot: how long until every place
// of the block is planned and the form is ready, the JS heap and the buffers (the meshes) before and after a garbage collection, the places
// loaded, the frames there.
// Only that: the other phases are not run.
//
// `--viaggio <universo>` (T449, ADR-0236): a universe of the void with planets (`nature.planets`); after the cold load the levels of detail
// of the planet 1 are precomputed with no cache (how long, how many cells), the wanderer takes the controls of the capsule at the start's
// landing and travels to the planet: the frames of the whole voyage, the JS heap and the buffers, what the levels hold on the GPU, then the
// frames on the planet's ground. Only that, as `--blocco`.
//
// `--terreno` (T459, docs/design/terreno-3d.md): the ways of the ground of lab/terreno-3d/ (bundled from `pagina.ts` with esbuild and
// evaluated in the page). After the cold load the wanderer goes to the place with the most relief near the start; the frames there with
// the ground of today, then with the loaded places in each way (columns with the true relief and the strata, voxels at 2 and at 4 a tile:
// how long each place took to make, the triangles, the buffers, the JS heap before and after), then today's ground with the automata
// on (the water as virtual pipes every tick, the wind at 10 Hz, the water's surface following them). Only that, as `--blocco`.
//
// `--sottobosco [--foto <cartella>]` (T509, docs/design/terreno-ricco.md): the undergrowth of lab/terreno-ricco/ (`pagina.ts`, its cover
// programs as text) as instances on the loaded places at the start: the frames with the ground of today, then one InstancedMesh per form
// and place, one per form for the window, one mesh baked per place, at 1, 2 and 4 instances a tile, with and without shadows, the ink of
// a thing or of the ground; with `--foto` the screenshots (far and near). Only that, as `--blocco`.
//
// `--strade <universo> [--foto <cartella>]` (T509): roads, sidewalks and rails of a universe of `universes/` near its start, as drawn
// today and with the curb and the aligned rails of lab/terreno-ricco/strade.ts (photos only).
//
// The meshes of the places (T486): their worker's jobs are counted apart ('terreno', from a copy sent to the arrays back), and each part of
// the drawing says its worst frames too (p99, the worst, how many over 4 ms), where a place's mesh made on the page's thread shows.
//
// Nothing of the game changes: the probe wraps requestAnimationFrame, WebGL and Worker before the page, and the kernel's and the
// renderer's methods from the console (`window.quine`, `window.view`), as an instance property over the prototype's. The wanderer's
// saved position is removed from `universes/` before the load (T214): run it against a preview of a throwaway checkout.
// Phases: the cold load (no form cache: a profile of its own), a full place, the corona, an arrival three places away.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocket } from 'ws';

const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : d);
const port = argv[0] && !argv[0].startsWith('--') ? argv[0] : '4173';
const seconds = Number(opt('secondi', 8));
const chrome = opt('chrome', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe');
const out = opt('json');
const debugPort = 9300 + Math.floor(Math.random() * 500);
const profile = path.resolve('.pipeline/misura/chrome-frame');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Before the page: frames, GPU time per frame, draw calls and triangles, workers and long tasks. */
const PROBE = `(() => {
  const m = (window.__misura = { frames: [], gl: null, timer: null, pending: [], gpu: [], calls: 0, tris: 0, jobs: [], long: [], open: new Map(), on: true });
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
    const ctx = getContext.call(this, kind, ...rest);
    if (kind === 'webgl2' && ctx && (!m.gl || this.width >= m.gl.canvas.width)) {
      m.gl = ctx;
      m.timer = ctx.getExtension('EXT_disjoint_timer_query_webgl2');
    }
    return ctx;
  };
  const P = WebGL2RenderingContext.prototype;
  const tri = (mode, n, inst = 1) => { m.calls++; if (mode === 4) m.tris += (n / 3) * inst; };
  for (const [name, count, inst] of [['drawElements', 1, -1], ['drawArrays', 2, -1], ['drawElementsInstanced', 1, 4], ['drawArraysInstanced', 2, 3]]) {
    const f = P[name];
    P[name] = function (...a) { if (this === m.gl) tri(a[0], a[count], inst < 0 ? 1 : a[inst]); return f.apply(this, a); };
  }
  // The GPU's time of a frame: a query around it, read when it is ready (a few frames later).
  const readGpu = () => {
    const g = m.gl, t = m.timer;
    if (!g || !t) return;
    const disjoint = g.getParameter(t.GPU_DISJOINT_EXT);
    while (m.pending.length) {
      const q = m.pending[0];
      if (!g.getQueryParameter(q.query, g.QUERY_RESULT_AVAILABLE)) break;
      m.pending.shift();
      const ns = g.getQueryParameter(q.query, g.QUERY_RESULT);
      if (!disjoint && m.on) m.gpu.push({ frame: q.frame, ms: ns / 1e6 });
      g.deleteQuery(q.query);
    }
  };
  const raf = window.requestAnimationFrame.bind(window);
  let frame = 0;
  window.requestAnimationFrame = (cb) => raf((now) => {
    const g = m.gl, t = m.timer;
    readGpu();
    let query = null;
    if (g && t && m.pending.length < 8) { query = g.createQuery(); g.beginQuery(t.TIME_ELAPSED_EXT, query); }
    const t0 = performance.now();
    m.calls = 0; m.tris = 0;
    m.cur = { tick: 0, ticks: 0, render: 0, parts: {} };
    cb(now);
    const js = performance.now() - t0;
    if (query) { g.endQuery(t.TIME_ELAPSED_EXT); m.pending.push({ query, frame }); }
    if (m.on) m.frames.push({ frame, at: t0, js, calls: m.calls, tris: m.tris, ...m.cur });
    frame++;
  });
  // The workers: when each message went and when its answer came.
  const W = window.Worker;
  let wid = 0;
  window.Worker = class extends W {
    constructor(url, opts) {
      super(url, opts);
      const me = ++wid;
      const src = String(url);
      this.addEventListener('message', (e) => {
        const id = e.data?.id;
        const key = me + ':' + (id ?? '?');
        const sent = m.open.get(key);
        m.open.delete(key);
        if (sent && m.on) m.jobs.push({ worker: me, src, kind: sent.kind, model: sent.model, sent: sent.at, back: performance.now(), ok: e.data?.ok !== false });
      });
      const post = this.postMessage.bind(this);
      this.postMessage = (msg, ...rest) => {
        const kind = msg?.req ? 'forma' : msg?.read ? 'lettura' : msg?.chunk ? 'terreno' : 'suono';
        m.open.set(me + ':' + (msg?.id ?? '?'), { at: performance.now(), kind, model: msg?.req?.model });
        return post(msg, ...rest);
      };
    }
  };
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (m.on) m.long.push({ at: e.startTime, ms: e.duration }); }).observe({ type: 'longtask', buffered: true });
  } catch {}
})();`;

/** After the kernel: its methods and the renderer's, timed with self time (what a part calls is counted in that part, not twice). */
const WRAP = `(() => {
  const m = window.__misura;
  const k = window.quine, v = window.view;
  const stack = [];
  const wrap = (obj, name, bucket, side) => {
    const f = obj && obj[name];
    if (typeof f !== 'function') return false;
    obj[name] = function (...a) {
      const top = { child: 0 };
      stack.push(top);
      const t0 = performance.now();
      try { return f.apply(this, a); } finally {
        const el = performance.now() - t0;
        stack.pop();
        if (stack.length) stack[stack.length - 1].child += el;
        const cur = m.cur;
        if (cur) {
          cur.parts[bucket] = (cur.parts[bucket] ?? 0) + el - top.child;
          if (side === 'tick') { cur.tick += el; cur.ticks++; }
          if (side === 'render') cur.render += el;
        }
      }
    };
    return true;
  };
  const got = {};
  got.tick = wrap(k, 'tick', 'kernel: resto del tick', 'tick');
  // A Lua system is a module's update run in the tick; the hooks and runes are other calls of the same function.
  got.lua = wrap(k, 'runModule', 'kernel: Lua (sistemi, hook)');
  got.npc = wrap(k.npc, 'tick', 'kernel: società (npc.tick)');
  got.water = wrap(k, 'waterTick', 'kernel: acqua');
  got.chunks = wrap(k, 'updateChunks', 'kernel: luoghi (updateChunks)');
  got.dev = wrap(k, 'pumpDevelopment', 'kernel: sviluppo dei luoghi');
  got.solids = wrap(k, 'rebuildSolids', 'kernel: solidi');
  got.runes = wrap(k, 'runRunes', 'kernel: rune');
  got.sync = wrap(k, 'syncRunes', 'kernel: syncRunes');
  got.heights = wrap(k, 'settleHeights', 'kernel: altezze');
  got.archive = wrap(k.archive, 'tick', 'kernel: studio (archive)');
  got.render = wrap(v, 'render', 'disegno: resto di render', 'render');
  got.syncChunks = wrap(v, 'syncChunks', 'disegno: luoghi (mesh del terreno)');
  got.entities = wrap(v.entities, 'update', 'disegno: entità');
  got.runesView = wrap(v.runes, 'update', 'disegno: rune');
  got.wanderer = wrap(v.wanderer, 'update', 'disegno: viandante');
  got.corona = wrap(v.corona, 'update', 'disegno: corona');
  got.lights = wrap(v.lights, 'update', 'disegno: luci');
  got.bloom = wrap(v.bloom, 'render', 'disegno: passate three.js (bloom.render)');
  got.ring = wrap(v, 'loadRing', 'disegno: carico dell anello');
  got.overlay = wrap(v, 'drawOverlay', 'disegno: testi 2D');
  return got;
})()`;

class Cdp {
  id = 0;
  waiting = new Map();
  constructor(ws) {
    this.ws = ws;
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw);
      const done = this.waiting.get(msg.id);
      if (!done) return;
      this.waiting.delete(msg.id);
      if (msg.error) done.reject(new Error(msg.error.message));
      else done.resolve(msg.result);
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.waiting.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  }
}

async function json(url, method = 'GET') {
  for (let i = 0; ; i++) {
    try {
      return await (await fetch(url, { method })).json();
    } catch (e) {
      if (i > 60) throw e;
      await sleep(500);
    }
  }
}

const sorted = (xs) => [...xs].sort((a, b) => a - b);
const median = (xs) => sorted(xs)[Math.floor(xs.length / 2)] ?? 0;
const p95 = (xs) => sorted(xs)[Math.floor(xs.length * 0.95)] ?? 0;
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const f1 = (n) => n.toFixed(2).padStart(7);

/** Starts collecting from now: what was gathered before goes. */
const RESET = `(() => { const m = window.__misura; m.frames.length = 0; m.gpu.length = 0; m.jobs.length = 0; m.long.length = 0; m.from = performance.now(); m.on = true; })()`;
const TAKE = `(() => { const m = window.__misura; return { frames: m.frames.slice(), gpu: m.gpu.slice(), jobs: m.jobs.slice(), long: m.long.slice(), from: m.from, to: performance.now(), open: m.open.size }; })()`;

/** The numbers of a window of time. */
function summary(label, d) {
  const span = d.to - d.from;
  const frames = d.frames;
  const tickFrames = frames.filter((f) => f.ticks > 0);
  const ticks = frames.reduce((a, f) => a + f.ticks, 0);
  const tickMs = frames.reduce((a, f) => a + f.tick, 0);
  const parts = {};
  for (const f of frames) for (const [k, v] of Object.entries(f.parts)) parts[k] = (parts[k] ?? 0) + v;
  const gpu = d.gpu.map((g) => g.ms);
  const forms = d.jobs.filter((j) => j.kind === 'forma');
  const busy = d.jobs.reduce((a, j) => a + (j.back - Math.max(j.sent, d.from)), 0);
  const workers = new Set(d.jobs.map((j) => j.worker)).size;
  const row = {
    label,
    seconds: span / 1000,
    fps: frames.length / (span / 1000),
    frameJs: { median: median(frames.map((f) => f.js)), p95: p95(frames.map((f) => f.js)), mean: mean(frames.map((f) => f.js)) },
    tickMs: ticks ? tickMs / ticks : 0,
    tickP95: p95(tickFrames.map((f) => f.tick / f.ticks)),
    ticksPerSecond: ticks / (span / 1000),
    renderMs: { median: median(frames.map((f) => f.render)), mean: mean(frames.map((f) => f.render)), p95: p95(frames.map((f) => f.render)) },
    otherMs: mean(frames.map((f) => f.js - f.tick - f.render)),
    gpuMs: gpu.length ? { median: median(gpu), mean: mean(gpu), p95: p95(gpu), n: gpu.length } : undefined,
    calls: median(frames.map((f) => f.calls)),
    triangles: median(frames.map((f) => f.tris)),
    // Per part: milliseconds per second of game (a 60 Hz kernel and the frames drawn in that second).
    parts: Object.fromEntries(Object.entries(parts).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, (v / span) * 1000])),
    perTick: Object.fromEntries(Object.entries(parts).filter(([k]) => k.startsWith('kernel')).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, ticks ? v / ticks : 0])),
    perFrame: Object.fromEntries(Object.entries(parts).filter(([k]) => k.startsWith('disegno')).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, frames.length ? v / frames.length : 0])),
    // The worst frames of each part of the drawing (T486): a place's mesh made on the page's thread is a frame of its own, the mean hides it.
    perFrameWorst: Object.fromEntries(Object.keys(parts).filter((k) => k.startsWith('disegno')).map((k) => {
      const xs = frames.map((f) => f.parts[k] ?? 0);
      return [k, { p99: sorted(xs)[Math.floor(xs.length * 0.99)] ?? 0, max: Math.max(0, ...xs), over4: xs.filter((x) => x > 4).length }];
    })),
    terrain: (() => { const t = d.jobs.filter((j) => j.kind === 'terreno').map((j) => j.back - j.sent); return { jobs: t.length, median: median(t), p95: p95(t), max: Math.max(0, ...t) }; })(),
    workers: { workers, jobs: d.jobs.length, forms: forms.length, formMs: { median: median(forms.map((j) => j.back - j.sent)), p95: p95(forms.map((j) => j.back - j.sent)), max: Math.max(0, ...forms.map((j) => j.back - j.sent)) }, busyShare: workers ? busy / (span * workers) : 0, stillOpen: d.open },
    long: { n: d.long.length, ms: d.long.reduce((a, l) => a + l.ms, 0), max: Math.max(0, ...d.long.map((l) => l.ms)) },
  };
  console.log(`\n## ${label} — ${row.seconds.toFixed(1)} s, ${row.fps.toFixed(0)} fps (senza vsync), ${row.ticksPerSecond.toFixed(0)} tick/s`);
  console.log(`frame JS   mediana ${f1(row.frameJs.median)} ms · media ${f1(row.frameJs.mean)} · p95 ${f1(row.frameJs.p95)}`);
  console.log(`  tick     ${f1(row.tickMs)} ms per tick (p95 ${row.tickP95.toFixed(2)})`);
  console.log(`  disegno  ${f1(row.renderMs.mean)} ms per frame (mediana ${row.renderMs.median.toFixed(2)}, p95 ${row.renderMs.p95.toFixed(2)})`);
  console.log(`  resto    ${f1(row.otherMs)} ms per frame (HUD, suono, input)`);
  console.log(`GPU        ${row.gpuMs ? `mediana ${f1(row.gpuMs.median)} ms · media ${f1(row.gpuMs.mean)} · p95 ${f1(row.gpuMs.p95)} (${row.gpuMs.n} frame)` : 'EXT_disjoint_timer_query_webgl2 non disponibile'}`);
  console.log(`draw call  ${row.calls} · triangoli ${Math.round(row.triangles / 1000)}k`);
  console.log(`per tick:`);
  for (const [k, v] of Object.entries(row.perTick)) console.log(`  ${f1(v)} ms  ${k}`);
  console.log(`per frame:`);
  for (const [k, v] of Object.entries(row.perFrame)) console.log(`  ${f1(v)} ms  ${k}${row.perFrameWorst[k]?.max > 1 ? ` (p99 ${row.perFrameWorst[k].p99.toFixed(2)}, il frame peggiore ${row.perFrameWorst[k].max.toFixed(2)}, ${row.perFrameWorst[k].over4} frame oltre 4 ms)` : ''}`);
  if (row.terrain.jobs) console.log(`terreno    ${row.terrain.jobs} mesh di luoghi nel worker del terreno · mediana ${row.terrain.median.toFixed(1)} ms, p95 ${row.terrain.p95.toFixed(1)}, max ${row.terrain.max.toFixed(1)} (dall'invio alla risposta)`);
  console.log(`worker     ${row.workers.workers} attivi · ${row.workers.jobs} lavori (${row.workers.forms} programmi) · un programma mediana ${row.workers.formMs.median.toFixed(0)} ms, p95 ${row.workers.formMs.p95.toFixed(0)}, max ${row.workers.formMs.max.toFixed(0)} · occupati ${(100 * row.workers.busyShare).toFixed(0)} % · in corso alla fine ${row.workers.stillOpen}`);
  const slow = forms.sort((a, b) => b.back - b.sent - (a.back - a.sent)).slice(0, 8);
  if (slow.length) console.log(`i più lenti: ${slow.map((j) => `${j.model ?? '?'} ${(j.back - j.sent).toFixed(0)} ms`).join(' · ')}`);
  row.slowest = slow.map((j) => ({ model: j.model, ms: j.back - j.sent }));
  console.log(`long task  ${row.long.n} · ${row.long.ms.toFixed(0)} ms in tutto · il più lungo ${row.long.max.toFixed(0)} ms`);
  return row;
}

const SCENES = {
  'luogo pieno, tappeto fermo': `(() => { const k = window.quine; k.carpet().active = false; })()`,
  corona: `(() => { const k = window.quine; k.carpet().active = false; const d = k.corona.building('persone').door; Object.assign(k.wandererPos(), { x: d.x, y: d.y }); })()`,
};
/**
 * Water that flows: in a planned place, the bed of a body of water dug deeper where it meets the land (`kernel.dig`, as a spade or a spell),
 * and the land beside it dug too: the water around runs into the hollow. Land is never dug below the sea, so the bed is what moves it.
 */
const WATER = `(() => {
  const k = window.quine; const S = k.config.chunkSize; const wet = (c) => k.palette[c]?.layer === 'liquid';
  for (const ch of k.chunks.values()) {
    if (ch.stage !== 'planned' || !ch.plan) continue;
    for (let t = 0; t < ch.tiles.length; t++) {
      if (!wet(ch.tiles[t])) continue;
      const x = t % S, y = Math.floor(t / S);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 1 || ny < 1 || nx >= S - 1 || ny >= S - 1 || wet(ch.tiles[ny * S + nx])) continue;
        let dug = 0;
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (k.dig(ch.cx * S + x + a, ch.cy * S + y + b, -8)) dug++;
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (k.dig(ch.cx * S + nx + a, ch.cy * S + ny + b, -8)) dug++;
        if (dug && k.water?.moving) return { place: ch.key, dug, moving: true };
      }
    }
  }
  return { dug: 0, moving: !!k.water?.moving };
})()`;
const ARRIVAL = `(() => { const k = window.quine; const c = k.carpet(); c.active = false; Object.assign(k.wandererPos(), { x: 0, y: 0 }); c.ox += 3 * k.config.chunkSize; c.oy += 1 * k.config.chunkSize; return [c.ox, c.oy]; })()`;

/** Until what is on screen stops growing and the workers are idle: the models arrive from them. */
async function settle(page, most = 120) {
  let last = -1;
  let still = 0;
  for (let i = 0; i < most; i++) {
    await sleep(1000);
    const [now, open] = await page.eval('[Math.max(0, ...window.__misura.frames.slice(-10).map((f) => f.tris)), window.__misura.open.size]');
    still = Math.abs(now - last) <= now * 0.01 && open === 0 ? still + 1 : 0;
    last = now;
    if (i >= 10 && still >= 5) return i + 1;
  }
  return most;
}

fs.rmSync(profile, { recursive: true, force: true });
const universes = path.resolve('universes');
if (fs.existsSync(universes)) for (const name of fs.readdirSync(universes)) fs.rmSync(path.join(universes, name, 'world/players/me.json'), { force: true });
const browser = spawn(chrome, ['--headless=new', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu', '--disable-gpu-vsync', '--disable-frame-rate-limit', '--enable-webgl-draft-extensions', '--force-device-scale-factor=1', '--window-size=1920,1080', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
const rows = [];
try {
  await json(`http://127.0.0.1:${debugPort}/json/version`);
  const target = await json(`http://127.0.0.1:${debugPort}/json/new?about:blank`, 'PUT');
  const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false });
  await new Promise((r, x) => (ws.once('open', r), ws.once('error', x)));
  const page = new Cdp(ws);
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  await page.send('Page.addScriptToEvaluateOnNewDocument', { source: PROBE });
  const t0 = Date.now();
  await page.send('Page.navigate', { url: `http://localhost:${port}/?skip&offline${opt('viaggio') ? `&universo=${opt('viaggio')}` : opt('strade') ? `&universo=${opt('strade')}` : ''}` });
  await page.eval(`(async () => { for (let i = 0; i < 240 && !(window.quine?.corona && window.view); i++) await new Promise((r) => setTimeout(r, 250)); if (!window.quine?.corona) throw new Error('niente kernel'); })()`);
  const kernelAt = (Date.now() - t0) / 1000;
  const env = await page.eval(`(() => { const m = window.__misura, g = m.gl; const e = g.getExtension('WEBGL_debug_renderer_info'); return { gpu: e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?', size: [g.drawingBufferWidth, g.drawingBufferHeight], timer: !!m.timer, cores: navigator.hardwareConcurrency, ua: navigator.userAgent, webgpu: !!navigator.gpu }; })()`);
  const wrapped = await page.eval(WRAP);
  console.log(`# ${env.gpu} — ${env.size.join('×')} — ${env.cores} core logici — timer query ${env.timer ? 'sì' : 'no'} — navigator.gpu ${env.webgpu ? 'sì' : 'no'}`);
  console.log(`kernel pronto dopo ${kernelAt.toFixed(1)} s; metodi avvolti: ${Object.entries(wrapped).filter(([, v]) => !v).map(([k]) => k).join(', ') || 'tutti'} ${Object.values(wrapped).every(Boolean) ? '' : 'mancano'}`);
  // Before the kernel: what the workers did while the page loaded (frames are few, the loading screen).
  await page.eval('window.__misura.from = 0');
  rows.push({ ...summary(`avvio, fino al kernel pronto (${kernelAt.toFixed(1)} s)`, await page.eval(TAKE)), kernelAt });
  // The cold load: from the kernel ready until the workers are idle and the scene stops growing.
  await page.eval(RESET);
  const settled = await settle(page);
  rows.push({ ...summary(`caricamento a freddo (fino a ${settled} s dopo il kernel)`, await page.eval(TAKE)), settled, kernelAt });
  for (const [scene, go] of Object.entries(opt('blocco') || opt('viaggio') || opt('strade') || argv.includes('--terreno') || argv.includes('--sottobosco') ? {} : SCENES)) {
    await page.eval(go);
    await settle(page, 60);
    await page.eval(RESET);
    await sleep(seconds * 1000);
    rows.push(summary(scene, await page.eval(TAKE)));
  }
  // A model of a given box beside the wanderer (T356): the frames while the worker makes it, then from inside it once drawn.
  const modelFile = opt('modello');
  if (modelFile) {
    const box = (opt('scatola') ?? '400,400,160').split(',').map(Number);
    // The box asked for, over the program's own if it says one (the author's fort, T370).
    const xml = fs.readFileSync(modelFile, 'utf8').replace(/(<sequence\b[^>]*?)\ssize="[^"]*"/, '$1').replace(/<sequence /, `<sequence size="${box.join(' ')}" `);
    await page.eval(RESET);
    const made = await page.eval(`(async () => {
      const k = window.quine; const xml = ${JSON.stringify(xml)};
      const index = JSON.parse(k.repo.working['models/index.json']);
      index['misura-modello'] = { class: 'structure', size: 'gargantuan', name: 'misura' };
      k.repo.write('models/misura-modello.xml', xml);
      k.repo.write('models/index.json', JSON.stringify(index, null, 1) + '\\n');
      k.applyFiles({ ...k.repo.working });
      const p = k.wandererPos(); const S = k.config.chunkSize; const x = p.x + ${box[0] / 40} + 2, y = p.y;
      const t0 = performance.now();
      k.ecs.spawn({ pos: { x, y }, glyph: { ch: '⌂', color: '#9a4632' }, body: { r: 0.5, solid: true }, form: { model: 'misura-modello', seed: 1, yaw: 0 }, structure: { concept: 'misura', class: 'structure', size: 'gargantuan' }, chunk: { key: Math.floor(x / S) + ',' + Math.floor(y / S) }, origin: { key: 'misura#s0' } });
      let f; for (let i = 0; i < 240; i++) { f = k.forms.get('misura-modello', 1); if (f && f.status !== 'pending') break; await new Promise((r) => setTimeout(r, 250)); }
      return { status: f && f.status, error: f && f.error, ms: Math.round(performance.now() - t0), x, y };
    })()`);
    console.log(`\nmodello ${modelFile} a ${box.join('×')}: ${made.status} in ${made.ms} ms${made.error ? ` (${made.error})` : ''}`);
    rows.push({ ...summary(`il modello di ${box.join('×')} che arriva dal worker (${(made.ms / 1000).toFixed(1)} s)`, await page.eval(TAKE)), made });
    // From inside it: the wanderer at its centre, the carpet still.
    await page.eval(`(() => { const k = window.quine; k.carpet().active = false; Object.assign(k.wandererPos(), { x: ${made.x} - 3, y: ${made.y} + 6 }); })()`);
    await settle(page, 60);
    await page.eval(RESET);
    await sleep(seconds * 1000);
    rows.push(summary(`dentro il modello di ${box.join('×')}, disegnato`, await page.eval(TAKE)));
  }
  // A block of places (T404): the program at a density, the block it asks for, its places loaded together.
  const heapNow = async () => {
    await page.send('HeapProfiler.collectGarbage').catch(() => {});
    const m = await page.send('Performance.getMetrics');
    const get = (n) => m.metrics.find((x) => x.name === n)?.value ?? 0;
    const u = await page.send('Runtime.getHeapUsage').catch(() => ({}));
    return { heapMB: get('JSHeapUsedSize') / 2 ** 20, buffersMB: (u.backingStorageSize ?? NaN) / 2 ** 20 };
  };
  // A voyage to a planet (T449).
  if (opt('viaggio')) {
    await page.send('Performance.enable');
    const before = await heapNow();
    // The levels of the planet 1, with no cache (a profile of its own): in the pauses between frames, as in the game.
    const t1 = Date.now();
    const lod = await page.eval(`(async () => { for (let i = 0; i < 600; i++) { const s = window.view.planetStats(); if (s?.ready?.[1] === 16) return s; await new Promise((r) => setTimeout(r, 250)); } return window.view.planetStats(); })()`);
    console.log(`\nlivelli del pianeta 1: ${lod?.ready?.[1]} su 16 in ${((Date.now() - t1) / 1000).toFixed(1)} s (${lod?.sampled} celle campionate, ${lod?.ms} ms di lavoro nelle pause)`);
    const aboard = await page.eval(`(async () => {
      const k = window.quine; k.carpet().active = false;
      const d = k.landingOf(0); const cp = k.carpet(); Object.assign(cp, { ox: Math.round(d.x), oy: Math.round(d.y) });
      let c; for (let i = 0; i < 120 && c === undefined; i++) { await new Promise((r) => setTimeout(r, 250)); c = k.ecs.query('vehicle').find((e) => { const p = k.ecs.get(e, 'pos'); return Math.hypot(p.x - d.x, p.y - d.y) < 1; }); }
      const p = k.wandererPos(); delete p.z; Object.assign(p, { x: d.x + Math.sin(d.heading) * 0.8 - cp.ox, y: d.y + Math.cos(d.heading) * 0.8 - cp.oy });
      await new Promise((r) => setTimeout(r, 1000));
      await k.perform(c, 'board'); await k.perform(c, 'helm');
      window.__c = c; return { c, aboard: k.aboard(), courses: k.actionsFor(c).filter((o) => o.id.startsWith('travel:')).length };
    })()`);
    if (aboard.aboard !== aboard.c || !aboard.courses) throw new Error(`niente capsula ai comandi: ${JSON.stringify(aboard)}`);
    await settle(page, 30);
    await page.eval(RESET);
    const went = await page.eval(`(async () => { const k = window.quine, c = window.__c; const t0 = performance.now(); await k.perform(c, 'travel:1'); let most = 0;
      for (let i = 0; i < 600 && k.transitOf(c); i++) { most = Math.max(most, window.view.planetStats()?.bytes ?? 0); await new Promise((r) => setTimeout(r, 100)); }
      return { ms: Math.round(performance.now() - t0), band: k.bandAt(k.wandererCarpet().x), levelsMB: most / 2 ** 20 }; })()`);
    rows.push({ ...summary(`il viaggio verso il pianeta 1 (${(went.ms / 1000).toFixed(1)} s, i livelli fino a ${went.levelsMB.toFixed(1)} MB)`, await page.eval(TAKE)), went, lod });
    const after = { ...(await heapNow()), levels: await page.eval('window.view.planetStats()') };
    console.log(`memoria JS: prima ${before.heapMB.toFixed(0)} MB, buffer ${before.buffersMB.toFixed(0)} MB; dopo l'atterraggio ${after.heapMB.toFixed(0)} MB, buffer ${after.buffersMB.toFixed(0)} MB; livelli sulla GPU: ${after.levels?.meshes} mesh, ${Math.round((after.levels?.triangles ?? 0) / 1000)}k triangoli, ${((after.levels?.bytes ?? 0) / 2 ** 20).toFixed(1)} MB`);
    await settle(page, 60);
    await page.eval(RESET);
    await sleep(seconds * 1000);
    rows.push({ ...summary(`sul pianeta, atterrati`, await page.eval(TAKE)), before, after });
    await json(`http://127.0.0.1:${debugPort}/json/close/${target.id}`).catch(() => {});
    ws.close();
    if (out) fs.writeFileSync(out, JSON.stringify({ env, rows }, null, 2));
    process.exitCode = went.band === 1 ? 0 : 1;
  }
  const blockFile = opt('blocco');
  if (opt('viaggio')) {
    // Done above.
  } else if (argv.includes('--terreno')) {
    // The ways of the ground (T459): the prototype of lab/terreno-3d/ bundled for the page.
    const { build } = await import('esbuild');
    const bundle = await build({ entryPoints: ['lab/terreno-3d/pagina.ts'], bundle: true, format: 'iife', platform: 'browser', target: 'es2022', write: false, logLevel: 'error' });
    await page.eval(bundle.outputFiles[0].text + ';true');
    await page.send('Performance.enable');
    const heap = async () => {
      await page.send('HeapProfiler.collectGarbage').catch(() => {});
      const m = await page.send('Performance.getMetrics');
      const get = (n) => m.metrics.find((x) => x.name === n)?.value ?? 0;
      const u = await page.send('Runtime.getHeapUsage').catch(() => ({}));
      return { heapMB: get('JSHeapUsedSize') / 2 ** 20, buffersMB: (u.backingStorageSize ?? NaN) / 2 ** 20 };
    };
    // Where the relief is: the place with the most of it near the start; the wanderer there, the carpet still.
    const place = await page.eval('window.__t459.where(12)');
    await page.eval(`(() => { const k = window.quine, S = k.config.chunkSize, c = k.carpet(); c.active = false; Object.assign(k.wandererPos(), { x: 0, y: 0 }); c.ox = ${place.cx} * S + S / 2; c.oy = ${place.cy} * S + S / 2; })()`);
    const settled = await settle(page, 90);
    console.log(`
il luogo con più rilievo vicino alla partenza: (${place.cx}, ${place.cy}), ${place.span} livelli di dislivello; assestato in ${settled} s`);
    const before = await heap();
    await page.eval(RESET);
    await sleep(seconds * 1000);
    rows.push({ ...summary(`oggi, dove c'è più rilievo (${place.cx}, ${place.cy})`, await page.eval(TAKE)), place, heap: before });
    for (const mode of ['columns', 'voxels2', 'voxels4']) {
      const h0 = await heap();
      const t0 = Date.now();
      const made = await page.eval(`window.__t459.ground('${mode}')`);
      const ms = Date.now() - t0;
      await sleep(2000);
      const h1 = await heap();
      console.log(`
${mode}: ${made.places} luoghi in ${ms} ms (a luogo: fare ${made.makeMs.median.toFixed(1)} ms, max ${made.makeMs.max.toFixed(1)}; la mesh ${made.meshMs.median.toFixed(1)} ms, max ${made.meshMs.max.toFixed(1)}); ${Math.round(made.triangles / 1000)}k triangoli, ${(made.bytes / 2 ** 20).toFixed(1)} MB di buffer; heap JS ${h0.heapMB.toFixed(0)} → ${h1.heapMB.toFixed(0)} MB, buffer ${h0.buffersMB.toFixed(0)} → ${h1.buffersMB.toFixed(0)} MB`);
      await page.eval(RESET);
      await sleep(seconds * 1000);
      rows.push({ ...summary(`${mode} (${made.places} luoghi, ${Math.round(made.triangles / 1000)}k triangoli del terreno)`, await page.eval(TAKE)), made, installMs: ms, heap: { before: h0, after: h1 } });
    }
    await page.eval('window.__t459.restore()');
    await sleep(1000);
    const auto = await page.eval('window.__t459.automata(true)');
    console.log(`
automi: ${JSON.stringify(auto)}`);
    await page.eval(RESET);
    await sleep(seconds * 1000);
    rows.push({ ...summary(`oggi con gli automi (acqua a tubi ${auto.cells} celle ogni tick, vento ${auto.windCells} celle a 10 Hz, la superficie)`, await page.eval(TAKE)), auto });
    await page.eval('window.__t459.restore()');
    await json(`http://127.0.0.1:${debugPort}/json/close/${target.id}`).catch(() => {});
    ws.close();
    if (out) fs.writeFileSync(out, JSON.stringify({ env, rows }, null, 2));
  } else if (argv.includes('--sottobosco')) {
    // The undergrowth (T509): the cover programs of lab/terreno-ricco/ as instances on the loaded places, in three ways and at densities.
    const { build } = await import('esbuild');
    const raw = { name: 'raw', setup(b) {
      b.onResolve({ filter: /\?raw$/ }, (a) => ({ path: path.resolve(a.resolveDir, a.path.replace(/\?raw$/, '')), namespace: 'raw' }));
      b.onLoad({ filter: /.*/, namespace: 'raw' }, (a) => ({ contents: fs.readFileSync(a.path, 'utf8'), loader: 'text' }));
    } };
    const bundle = await build({ entryPoints: ['lab/terreno-ricco/pagina.ts'], bundle: true, format: 'iife', platform: 'browser', target: 'es2022', write: false, logLevel: 'error', plugins: [raw] });
    await page.eval(bundle.outputFiles[0].text + ';true');
    await page.send('Performance.enable');
    const heap = async () => {
      await page.send('HeapProfiler.collectGarbage').catch(() => {});
      const m = await page.send('Performance.getMetrics');
      const get = (n) => m.metrics.find((x) => x.name === n)?.value ?? 0;
      const u = await page.send('Runtime.getHeapUsage').catch(() => ({}));
      return { heapMB: get('JSHeapUsedSize') / 2 ** 20, buffersMB: (u.backingStorageSize ?? NaN) / 2 ** 20 };
    };
    const photos = opt('foto');
    if (photos) fs.mkdirSync(photos, { recursive: true });
    const shot = async (name, zoom) => {
      if (!photos) return;
      if (zoom) await page.eval(`window.view.zoomTo(${zoom})`);
      await sleep(1500);
      const { data } = await page.send('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
      fs.writeFileSync(path.join(photos, `${name}.jpg`), Buffer.from(data, 'base64'));
      if (zoom) await page.eval('window.view.zoomTo(15)');
      if (zoom) await settle(page, 10);
      await sleep(800);
    };
    await page.eval(`(() => { const k = window.quine; k.carpet().active = false; })()`);
    await settle(page, 60);
    await shot('00-oggi', 0);
    await shot('00-oggi-vicino', 5);
    // The farthest the simulation's camera goes (ZOOM.max): the most places on screen, the worst case.
    await page.eval('window.view.zoomTo(15)');
    await settle(page, 30);
    const prep = await page.eval('window.__t509.prepare()');
    console.log(`
sottobosco: ${prep.forms} forme fatte nella pagina in ${prep.ms} ms, ${prep.meanTris} triangoli in media`);
    // `--solo-foto`: the two inks side by side at the same hour of the world (the day turns in ten minutes), no measures.
    if (argv.includes('--solo-foto')) await page.eval('window.quine.daylight = () => 1');
    const configsOnly = argv.includes('--solo-foto') ? [
      ['10-inchiostro-degli-alberi', { way: 'window', perTile: 2 }],
      ['11-inchiostro-del-suolo', { way: 'window', perTile: 2, ink: 'ground' }],
    ] : [];
    for (const [name, c] of configsOnly) {
      await page.eval(`window.__t509.cover(${JSON.stringify(c)})`);
      await shot(`${name}-vicino`, 5);
    }
    if (configsOnly.length) await page.eval('window.__t509.restore()');
    const h0 = await heap();
    await page.eval(RESET);
    await sleep(seconds * 1000);
    rows.push({ ...summary('oggi, il luogo della partenza, la camera più lontana', await page.eval(TAKE)), heap: h0 });
    await shot('00-oggi-lontano', 0);
    const configs = argv.includes('--solo-foto') ? [] : [
      ['01-luogo-1-ombre', { way: 'chunk', perTile: 1, shadow: true }],
      ['02-finestra-1-ombre', { way: 'window', perTile: 1, shadow: true }],
      ['03-finestra-1', { way: 'window', perTile: 1 }],
      ['04-finestra-2', { way: 'window', perTile: 2 }],
      ['05-finestra-4', { way: 'window', perTile: 4 }],
      ['06-fusa-1', { way: 'merged', perTile: 1 }],
      ['07-finestra-2-inchiostro-del-suolo', { way: 'window', perTile: 2, ink: 'ground' }],
      ['08-luogo-2', { way: 'chunk', perTile: 2 }],
      ['09-finestra-8', { way: 'window', perTile: 8 }],
    ];
    for (const [name, c] of configs) {
      const made = await page.eval(`window.__t509.cover(${JSON.stringify(c)})`);
      await sleep(2000);
      const h1 = await heap();
      console.log(`
${name}: ${made.instances} istanze, ${Math.round(made.tris / 1000)}k triangoli, ${made.objects} oggetti, ${(made.bytes / 2 ** 20).toFixed(2)} MB, ${made.ms} ms; heap ${h1.heapMB.toFixed(0)} MB, buffer ${h1.buffersMB.toFixed(0)} MB`);
      await page.eval(RESET);
      await sleep(seconds * 1000);
      rows.push({ ...summary(`${name} (${made.instances} istanze, ${Math.round(made.tris / 1000)}k triangoli, ${made.objects} oggetti)`, await page.eval(TAKE)), made, heap: h1 });
      if (name.startsWith('05') || name.startsWith('07') || name.startsWith('04')) await shot(`${name}-vicino`, 5);
      if (name.startsWith('04')) await shot(`${name}-lontano`, 0);
      if (name.startsWith('04')) await shot(name, 10);
    }
    await page.eval('window.__t509.restore()');
    await json(`http://127.0.0.1:${debugPort}/json/close/${target.id}`).catch(() => {});
    ws.close();
    if (out) fs.writeFileSync(out, JSON.stringify({ env, rows }, null, 2));
  } else if (opt('strade')) {
    // Roads, sidewalks and rails (T509, docs/design/terreno-ricco.md § 3): the place of the universe with the most of them near the start,
    // a photo as the game draws it, then with the curb and the rails of lab/terreno-ricco/strade.ts.
    const { build } = await import('esbuild');
    const bundle = await build({ entryPoints: ['lab/terreno-ricco/strade.ts'], bundle: true, format: 'iife', platform: 'browser', target: 'es2022', write: false, logLevel: 'error' });
    await page.eval(bundle.outputFiles[0].text + ';true');
    const photos = opt('foto') ?? 'lab/terreno-ricco/foto';
    fs.mkdirSync(photos, { recursive: true });
    const name = opt('strade');
    const snap = async (file) => {
      await sleep(1500);
      const { data } = await page.send('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
      fs.writeFileSync(path.join(photos, `${file}.jpg`), Buffer.from(data, 'base64'));
    };
    const start = await page.eval(`(() => { const k = window.quine; const S = k.config.chunkSize; const c = k.carpet(); c.active = false; const p = k.wandererCarpet(); return [Math.floor(p.x / S), Math.floor(p.y / S)]; })()`);
    let best;
    for (const [dx, dy] of [[0, 0], [3, 0], [0, 3], [-3, -3], [3, 3], [-3, 0]]) {
      await page.eval(`(() => { const k = window.quine, S = k.config.chunkSize, c = k.carpet(); Object.assign(k.wandererPos(), { x: 0, y: 0 }); c.ox = ${start[0] + dx} * S + S / 2; c.oy = ${start[1] + dy} * S + S / 2; })()`);
      await settle(page, 30);
      const top = (await page.eval('window.__t509s.score()'))[0];
      if (top && (!best || top.rails * 4 + top.edges > best.rails * 4 + best.edges)) best = top;
    }
    console.log(`
${name}: il luogo con più strade e binari ${JSON.stringify(best)}`);
    const [bx, by] = best.key.split(',').map(Number);
    // The middle of its rails (or of its curbs); the light of noon for the photos (the day turns in ten minutes).
    await page.eval(`(() => { const k = window.quine, S = k.config.chunkSize, c = k.carpet(); const f = window.__t509s.focus('${best.key}') ?? { x: ${bx} * S + S / 2, y: ${by} * S + S / 2 }; Object.assign(k.wandererPos(), { x: 0, y: 0 }); c.ox = Math.round(f.x) + 1.5; c.oy = Math.round(f.y) + 1.5; k.daylight = () => 1; window.view.zoomTo(9); })()`);
    await settle(page, 60);
    await snap(`strade-${name}-oggi`);
    const made = await page.eval('window.__t509s.street({ curb: 0.12 })');
    console.log(`${name}: ${made.slabs} caselle di marciapiede rialzate, ${made.rails} di binari, ${made.tris} triangoli`);
    await snap(`strade-${name}-proposta`);
    await page.eval('window.view.zoomTo(5)');
    await snap(`strade-${name}-proposta-vicino`);
    await page.eval('window.__t509s.restore()');
    await json(`http://127.0.0.1:${debugPort}/json/close/${target.id}`).catch(() => {});
    ws.close();
    if (out) fs.writeFileSync(out, JSON.stringify({ env, best, made }, null, 2));
  } else if (blockFile) {
    const vpt = Number(opt('vpt', '10'));
    const [bx, by] = (opt('luogo') ?? '20,24').split(',').map(Number);
    const xml = fs.readFileSync(blockFile, 'utf8');
    const heap = async () => {
      await page.send('HeapProfiler.collectGarbage').catch(() => {});
      const m = await page.send('Performance.getMetrics');
      const get = (n) => m.metrics.find((x) => x.name === n)?.value ?? 0;
      // The ArrayBuffers (the meshes the workers send) are outside the JS heap: `backingStorageSize` where the browser says it.
      const u = await page.send('Runtime.getHeapUsage').catch(() => ({}));
      return { heapMB: get('JSHeapUsedSize') / 2 ** 20, totalMB: get('JSHeapTotalSize') / 2 ** 20, buffersMB: (u.backingStorageSize ?? NaN) / 2 ** 20 };
    };
    await page.send('Performance.enable');
    const before = { ...(await heap()), ...(await page.eval('(() => { const k = window.quine; return { loaded: k.chunks.size, planned: [...k.chunks.values()].filter((c) => c.stage === "planned").length }; })()')) };
    await page.eval(RESET);
    const made = await page.eval(`(async () => {
      const k = window.quine; const xml = ${JSON.stringify(xml)};
      const id = 'struttura-il-forte-gargantuan';
      const index = JSON.parse(k.repo.working['models/index.json']);
      index[id] = { class: 'structure', size: 'gargantuan', vpt: ${vpt}, time: 30000, name: 'il forte' };
      k.repo.write('models/' + id + '.xml', xml);
      k.repo.write('models/index.json', JSON.stringify(index, null, 1) + '\\n');
      k.applyFiles({ ...k.repo.working });
      const text = k.ai.text.bind(k.ai);
      k.ai.text = async (call) => {
        const out = await text(call);
        const d = call.data;
        if (call.task !== 'chunk.plan' || !d || d.cx !== ${bx} || d.cy !== ${by}) return out;
        const a = JSON.parse(out);
        a.structures = [{ concept: 'il forte', size: 'gargantuan' }];
        return JSON.stringify(a);
      };
      const t0 = performance.now();
      const answer = await k.planAhead(${bx}, ${by});
      const block = k.blockOfPlace(${bx}, ${by});
      if (!block) return { answer, block: null, tiles: k.forms.entryTiles(id) };
      const n = block.side ?? 2, lot = block.lot ?? 25, S = k.config.chunkSize;
      const x0 = block.x * S + Math.floor((n * S - Math.min(lot, n * S - 4)) / 2), mid = x0 + Math.min(lot, n * S - 4) / 2;
      const y0 = block.y * S + Math.floor((n * S - Math.min(lot, n * S - 4)) / 2), midY = y0 + Math.min(lot, n * S - 4) / 2;
      const c = k.carpet(); c.active = false;
      c.ox = mid; c.oy = midY + Math.min(lot, n * S - 4) / 2 + 3; Object.assign(k.wandererPos(), { x: 0, y: 0 });
      const keys = []; for (let dy = 0; dy < n; dy++) for (let dx = 0; dx < n; dx++) keys.push((block.x + dx) + ',' + (block.y + dy));
      let planned = 0, f, plannedAt = 0;
      for (let i = 0; i < 480; i++) {
        planned = keys.filter((key) => k.chunks.get(key)?.stage === 'planned').length;
        if (planned === keys.length && !plannedAt) plannedAt = performance.now() - t0;
        const sid = k.ecs.query('structure', 'form').find((e) => k.ecs.get(e, 'structure').size === 'gargantuan');
        if (sid !== undefined) f = k.forms.get(k.ecs.get(sid, 'form').model, k.ecs.get(sid, 'form').seed);
        if (planned === keys.length && f && f.status !== 'pending') break;
        await new Promise((r) => setTimeout(r, 250));
      }
      return { answer, block, places: keys.length, planned, plannedMs: Math.round(plannedAt), formMs: Math.round(performance.now() - t0), status: f && f.status, error: f && f.error, tiles: k.forms.entryTiles(id), loaded: k.chunks.size };
    })()`);
    console.log(`\nblocco: ${JSON.stringify(made)}`);
    rows.push({ ...summary(`il blocco di ${made.block ? (made.block.side ?? 2) + ' × ' + (made.block.side ?? 2) : '—'} luoghi e il forte a ${vpt} voxel per casella che arrivano (${((made.formMs ?? 0) / 1000).toFixed(1)} s)`, await page.eval(TAKE)), made });
    await settle(page, 60);
    const after = { ...(await heap()), ...(await page.eval('(() => { const k = window.quine; return { loaded: k.chunks.size, planned: [...k.chunks.values()].filter((c) => c.stage === "planned").length }; })()')) };
    console.log(`memoria JS: prima ${before.heapMB.toFixed(0)} MB, buffer ${before.buffersMB.toFixed(0)} MB (${before.loaded} luoghi caricati, ${before.planned} pianificati), dopo ${after.heapMB.toFixed(0)} MB, buffer ${after.buffersMB.toFixed(0)} MB (${after.loaded} caricati, ${after.planned} pianificati)`);
    await page.eval(RESET);
    await sleep(seconds * 1000);
    rows.push({ ...summary(`accanto al forte, il blocco caricato e disegnato`, await page.eval(TAKE)), before, after });
    await json(`http://127.0.0.1:${debugPort}/json/close/${target.id}`).catch(() => {});
    ws.close();
    if (out) fs.writeFileSync(out, JSON.stringify({ env, rows }, null, 2));
    process.exitCode = made.block ? 0 : 1;
  } else {
  // Water: a hollow dug beside it, the flow measured while it moves.
  await page.eval(RESET);
  const dug = await page.eval(WATER);
  // How long it moves: sampled ten times a second.
  dug.movingMs = await page.eval(`(async () => { let n = 0; for (let i = 0; i < ${seconds * 10}; i++) { if (window.quine.water.moving) n++; await new Promise((r) => setTimeout(r, 100)); } return n * 100; })()`);
  rows.push({ ...summary(`acqua che scorre (scavo di ${dug.dug} caselle${dug.place ? ' in ' + dug.place : ', niente acqua che si muove'}, in moto per ${dug.movingMs} ms)`, await page.eval(TAKE)), dug });
  // An arrival: three places away, the places and their models made while one looks.
  await page.eval(ARRIVAL);
  await page.eval(RESET);
  await sleep(seconds * 2000);
  rows.push(summary(`arrivo tre luoghi più in là (${seconds * 2} s)`, await page.eval(TAKE)));
  const after = await settle(page, 60);
  console.log(`\n(l'arrivo si è assestato ${after} s dopo la finestra)`);
  await json(`http://127.0.0.1:${debugPort}/json/close/${target.id}`).catch(() => {});
  ws.close();
  if (out) fs.writeFileSync(out, JSON.stringify({ env, rows }, null, 2));
  }
} finally {
  browser.kill();
  await sleep(1000);
  fs.rmSync(profile, { recursive: true, force: true });
}
