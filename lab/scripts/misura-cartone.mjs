// How much the cartoon costs (ADR-0093, T89e): frames per second and milliseconds per frame, with and without, in a full place,
// in the studio and in the corona, in headless Chrome on the real GPU (a tab of Claude in Chrome runs at about 1 Hz:
// `docs/architettura-dettagli.md#convalida-browser`). With a preview already serving the build:
//   node lab/scripts/misura-cartone.mjs <port> [dpr] [giri] [chrome.exe]
// The wanderer's saved position is removed from `universes/` before each load: it would add up and each load would see other land (T214).
// So run it against a preview in a throwaway checkout, not against a universe you care about.
// Uncapped fps come from the frame intervals with vsync off; the milliseconds of a frame come from a second phase that waits for the GPU
// at the end of each frame (readPixels on the frame). The look "senza inchiostro" needs `globalThis.__bloom = this.bloom` in the Renderer
// for one build, not committed: without it that row is skipped.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocket } from 'ws';

const [port = '4173', dpr = '1', rounds = '2', chrome = 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'] = process.argv.slice(2);
const debugPort = 9300 + Math.floor(Math.random() * 500);
const profile = path.resolve('.pipeline/misura/chrome');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Before the page: frame timing around requestAnimationFrame, draw calls and triangles counted on the context. */
const PROBE = `(() => {
  const m = (window.__misura = { frames: [], gl: null, wait: false, calls: 0, tris: 0, draws: [], triangles: [] });
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
    const ctx = getContext.call(this, kind, ...rest);
    if (kind === 'webgl2' && ctx && this.isConnected && (!m.gl || this.width >= m.gl.canvas.width)) m.gl = ctx;
    return ctx;
  };
  const P = WebGL2RenderingContext.prototype;
  const tri = (mode, n, inst = 1) => { m.calls++; if (mode === 4) m.tris += (n / 3) * inst; };
  for (const [name, count, inst] of [['drawElements', 1, -1], ['drawArrays', 2, -1], ['drawElementsInstanced', 1, 4], ['drawArraysInstanced', 2, 3]]) {
    const f = P[name];
    P[name] = function (...a) { tri(a[0], a[count], inst < 0 ? 1 : a[inst]); return f.apply(this, a); };
  }
  const raf = window.requestAnimationFrame.bind(window);
  const pixel = new Uint8Array(4);
  window.requestAnimationFrame = (cb) => raf((now) => {
    const t0 = performance.now();
    m.calls = 0; m.tris = 0;
    cb(now);
    const js = performance.now() - t0;
    if (m.wait && m.gl) m.gl.readPixels(0, 0, 1, 1, m.gl.RGBA, m.gl.UNSIGNED_BYTE, pixel);
    m.frames.push({ at: t0, js, total: performance.now() - t0 });
    m.draws.push(m.calls); m.triangles.push(m.tris);
  });
})();`;

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

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;
const p95 = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length * 0.95)] ?? 0;

/** The numbers of what is on screen now: first uncapped, then waiting for the GPU. */
async function measure(page, label) {
  const take = (wait, ms) =>
    page.eval(`(async () => { const m = window.__misura; m.wait = ${wait}; await new Promise((r) => setTimeout(r, 1500)); m.frames.length = 0; m.draws.length = 0; m.triangles.length = 0; await new Promise((r) => setTimeout(r, ${ms})); m.wait = false; return { frames: m.frames.slice(), draws: m.draws.slice(), triangles: m.triangles.slice() }; })()`);
  const free = await take(false, 8000);
  const gaps = free.frames.slice(1).map((f, i) => f.at - free.frames[i].at);
  const sync = await take(true, 8000);
  const row = {
    label,
    fps: gaps.length ? 1000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length) : 0,
    gap95: p95(gaps),
    frameMs: median(sync.frames.map((f) => f.total)),
    frameMs95: p95(sync.frames.map((f) => f.total)),
    jsMs: median(sync.frames.map((f) => f.js)),
    draws: median(free.draws),
    triangles: median(free.triangles),
  };
  console.log(`${label.padEnd(36)} ${row.fps.toFixed(0).padStart(5)} fps  ${row.frameMs.toFixed(1).padStart(6)} ms (p95 ${row.frameMs95.toFixed(1)})  js ${row.jsMs.toFixed(1).padStart(5)} ms  ${String(row.draws).padStart(5)} chiamate  ${Math.round(row.triangles / 1000)}k triangoli`);
  return row;
}

/** Until what is on screen stops growing: the models arrive from the workers. */
async function settle(page, most = 90) {
  let last = -1;
  let still = 0;
  for (let i = 0; i < most; i++) {
    await sleep(1000);
    const now = await page.eval('Math.max(0, ...window.__misura.triangles.slice(-10))');
    still = Math.abs(now - last) <= now * 0.01 ? still + 1 : 0;
    last = now;
    if (i >= 20 && still >= 6) return;
  }
}

const SCENES = {
  'luogo pieno': `0`,
  studio: `(() => { const k = window.quine; k.carpet().active = false; const f = k.corona.building('persone').storeys[0]; Object.assign(k.wandererPos(), { x: f.ox + 12.5, y: f.oy + 10.5 }); })()`,
  corona: `(() => { const k = window.quine; k.carpet().active = false; const d = k.corona.building('persone').door; Object.assign(k.wandererPos(), { x: d.x, y: d.y }); })()`,
};

async function run(query, look) {
  const universes = path.resolve('universes');
  for (const name of fs.readdirSync(universes)) fs.rmSync(path.join(universes, name, 'world/players/me.json'), { force: true });
  const target = await json(`http://127.0.0.1:${debugPort}/json/new?about:blank`, 'PUT');
  const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false });
  await new Promise((r, x) => (ws.once('open', r), ws.once('error', x)));
  const page = new Cdp(ws);
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  await page.send('Page.addScriptToEvaluateOnNewDocument', { source: PROBE });
  await page.send('Page.navigate', { url: `http://localhost:${port}/?skip&offline${query}` });
  await page.eval(`(async () => { for (let i = 0; i < 240 && !window.quine?.corona; i++) await new Promise((r) => setTimeout(r, 500)); if (!window.quine?.corona) throw new Error('niente kernel'); })()`);
  const gpu = await page.eval(`(() => { const g = window.__misura.gl; const e = g.getExtension('WEBGL_debug_renderer_info'); return { gpu: e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?', size: [g.drawingBufferWidth, g.drawingBufferHeight] }; })()`);
  const carpet = await page.eval('(() => { const c = window.quine.carpet(); return [c.ox, c.oy]; })()');
  console.log(`\n# ${look} — ${gpu.gpu} — ${gpu.size.join('×')} — scostamento ${carpet.join(', ')}`);
  const rows = [];
  for (const [scene, go] of Object.entries(SCENES)) {
    await page.eval(go);
    await settle(page);
    rows.push({ look, scene, ...(await measure(page, `${look} · ${scene}`)) });
    if (look === 'cartone' && (await page.eval('!!globalThis.__bloom'))) {
      await page.eval('globalThis.__bloom.inked = false');
      rows.push({ look: 'senza inchiostro', scene, ...(await measure(page, `senza inchiostro · ${scene}`)) });
      await page.eval('globalThis.__bloom.inked = true');
    }
  }
  await json(`http://127.0.0.1:${debugPort}/json/close/${target.id}`).catch(() => {});
  ws.close();
  return { gpu, rows };
}

fs.rmSync(profile, { recursive: true, force: true });
const browser = spawn(chrome, ['--headless=new', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu', '--disable-gpu-vsync', '--disable-frame-rate-limit', `--force-device-scale-factor=${dpr}`, '--window-size=1920,1080', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
try {
  await json(`http://127.0.0.1:${debugPort}/json/version`);
  // Twice each, in turn: the second round shows how far the first can be trusted.
  for (let round = 1; round <= Number(rounds); round++) {
    console.log(`\n== giro ${round}, dpr ${dpr}`);
    await run('&classica', 'classica');
    await run('', 'cartone');
  }
} finally {
  browser.kill();
  await sleep(1000);
  fs.rmSync(profile, { recursive: true, force: true });
}
