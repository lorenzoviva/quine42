// Where a frame's time goes (T331, docs/design/gpu.md): the kernel's tick divided into its parts (Lua systems, society, water, places,
// solids…), the drawing divided into its parts (places built, entities, corona, lights, the bloom pass that submits the draw calls),
// the GPU's time (EXT_disjoint_timer_query_webgl2, when the browser gives it), draw calls and triangles, and the workers: how many
// programs they ran, how long each took, how much of the window they were busy. In headless Chrome on the real GPU (a tab of Claude in
// Chrome runs at about 1 Hz: `docs/architettura-dettagli.md#convalida-browser`). With a preview already serving the build:
//
//   node lab/scripts/misura-frame.mjs <port> [--secondi 8] [--chrome <chrome.exe>] [--json out.json]
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
        const kind = msg?.req ? 'forma' : msg?.read ? 'lettura' : 'suono';
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
  for (const [k, v] of Object.entries(row.perFrame)) console.log(`  ${f1(v)} ms  ${k}`);
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
  await page.send('Page.navigate', { url: `http://localhost:${port}/?skip&offline` });
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
  for (const [scene, go] of Object.entries(SCENES)) {
    await page.eval(go);
    await settle(page, 60);
    await page.eval(RESET);
    await sleep(seconds * 1000);
    rows.push(summary(scene, await page.eval(TAKE)));
  }
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
} finally {
  browser.kill();
  await sleep(1000);
  fs.rmSync(profile, { recursive: true, force: true });
}
