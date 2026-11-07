// Measures what a skin's effects cost (T284, T315): a headless Chrome of its own (never the author's), the page at 1920 px or on a phone,
// a modest machine simulated with the processor slowed down (`Emulation.setCPUThrottlingRate`), the bytes of a cold load, the main
// thread's busy time and the time of every animation frame. Nothing leaves this machine: the page is a preview on loopback.
//
//   node tools/vesti/misura.mjs --url http://127.0.0.1:4185/site/index.html [--veste futuristica] [--rallenta 1,4] [--secondi 24]
//        [--larghezza 1920] [--telefono] [--posizioni cima,insieme,sotto] [--webgl] [--profilo] [--solo <espressione>]
//
// The configurations: the sober skin, the futuristic one standing still (prefers-reduced-motion), the futuristic one as it is (its
// lights a MarkovJunior program kept on its grid, and on the landing the maze under the hero) and with the same lights in plain loops
// (`?fx=semplice`). Without --webgl the 3D stage of the landing does not start (`--disable-3d-apis`), so what is measured is the effects
// alone; with it the stage runs too. The positions: `cima` the top of the page; `insieme` the bottom of the hero at the middle of the
// screen (the stage and what follows the hero both in sight); `sotto` the bottom of the hero at the top of the screen (the stage out of
// sight, the maze in it). --telefono is 390 × 844 at DPR 2. The window is 24 s by default: the stage's three programs, the pine included.
// The result is a Markdown table on stdout, with the GPU Chrome had; --profilo adds the CPU profile, --solo keeps some configurations.

import { checkLocal, launch, sleep, wearSkin, connect } from './cdp.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : fallback;
};
const URL_PAGE = opt('url', 'http://127.0.0.1:4185/site/index.html');
const RATES = opt('rallenta', '1,4').split(',').map(Number);
const SECONDS = Number(opt('secondi', '24'));
const PHONE = args.includes('--telefono');
const WIDTH = PHONE ? 390 : Number(opt('larghezza', '1920'));
const HEIGHT = PHONE ? 844 : Number(opt('altezza', '1080'));
const DPR = PHONE ? 2 : 1;
const POSITIONS = opt('posizioni', 'cima').split(',');
const WEBGL = args.includes('--webgl');
/** With --profilo, the CPU profile of each measurement: the functions that take the most time, by file. */
const PROFILE = args.includes('--profilo');
/** With --solo <espressione>, only the configurations whose name matches it (a regular expression: `sobria|ferma`). */
const ONLY = opt('solo', '');
const CHROME = opt('chrome', undefined);
checkLocal(URL_PAGE);

/** The skin to measure against the sober one: its engines of the lights only for the futuristic one (`?fx=`). */
const SKIN = opt('veste', 'futuristica');
const CONFIGS =
  SKIN === 'futuristica'
    ? [
        { name: 'sobria (nessun effetto)', skin: 'sobria', fx: '', reduced: false },
        { name: 'futuristica ferma (riduci movimento)', skin: 'futuristica', fx: '', reduced: true },
        { name: 'futuristica', skin: 'futuristica', fx: '', reduced: false },
        { name: 'futuristica, luci semplici', skin: 'futuristica', fx: 'semplice', reduced: false },
      ]
    : [
        { name: 'sobria (nessun effetto)', skin: 'sobria', fx: '', reduced: false },
        { name: `${SKIN} ferma (riduci movimento)`, skin: SKIN, fx: '', reduced: true },
        { name: `${SKIN} in movimento`, skin: SKIN, fx: '', reduced: false },
      ];

/** Where the page is scrolled to, measured from the hero's bottom (the landing); a page without a hero stays at the top. */
const SCROLL = {
  cima: '0',
  insieme: "(() => { const h = document.querySelector('.hero'); return h ? Math.max(0, h.getBoundingClientRect().bottom + scrollY - innerHeight / 2) : 0; })()",
  sotto: "(() => { const h = document.querySelector('.hero'); return h ? h.getBoundingClientRect().bottom + scrollY : 0; })()",
};

/**
 * Times every animation frame's callback, before the page's own scripts run, and tells the frames that painted a canvas (a piece of
 * the effects: `putImageData`) from the others (the 3D stage, the pages' own); counts the long tasks of the main thread.
 */
const PROBE = `(() => {
  const raf = window.requestAnimationFrame.bind(window);
  const put = CanvasRenderingContext2D.prototype.putImageData;
  const fx = (window.__fx = { frames: 0, times: [], idle: [], drew: false, long: [] });
  CanvasRenderingContext2D.prototype.putImageData = function (...a) { fx.drew = true; return put.apply(this, a); };
  window.requestAnimationFrame = (cb) => raf((t) => {
    fx.drew = false;
    const t0 = performance.now();
    try { cb(t); } finally {
      const d = performance.now() - t0;
      fx.frames++;
      const list = fx.drew ? fx.times : fx.idle;
      if (list.length < 40000) list.push(d);
    }
  });
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) fx.long.push(e.duration); }).observe({ type: 'longtask', buffered: false }); } catch (e) {}
})();`;

const metric = (m, name) => m.metrics.find((x) => x.name === name)?.value ?? 0;
const pct = (v) => `${(v * 100).toFixed(1)} %`;
const ms = (v) => `${v.toFixed(1)}`;
const kb = (v) => `${(v / 1024).toFixed(1)} KB`;
const quantile = (xs, q) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
};

async function measure(cdp, config, rate, position) {
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: config.reduced ? 'reduce' : 'no-preference' }] });
  // The skin is remembered by the browser: say it on the site's origin, then load the page cold.
  await wearSkin(cdp, URL_PAGE, config.skin);
  await cdp.send('Network.clearBrowserCache');
  const bytes = { total: 0, js: 0, css: 0, image: 0, font: 0, other: 0, files: [] };
  const types = new Map();
  cdp.on('Network.responseReceived', (p) => types.set(p.requestId, { type: p.type, url: p.response.url }));
  cdp.on('Network.loadingFinished', (p) => {
    const t = types.get(p.requestId);
    if (!t || t.url.startsWith('data:')) return;
    bytes.total += p.encodedDataLength;
    const kind = t.type === 'Script' ? 'js' : t.type === 'Stylesheet' ? 'css' : t.type === 'Image' ? 'image' : t.type === 'Font' ? 'font' : 'other';
    bytes[kind] += p.encodedDataLength;
    bytes.files.push({ url: new URL(t.url).pathname, kind, size: p.encodedDataLength });
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  const url = new URL(URL_PAGE);
  if (config.fx) url.searchParams.set('fx', config.fx);
  await cdp.send('Page.navigate', { url: url.href });
  await sleep(3000 * Math.max(1, rate / 2));
  const y = (await cdp.send('Runtime.evaluate', { expression: SCROLL[position] ?? '0', returnByValue: true })).result.value;
  await cdp.send('Runtime.evaluate', { expression: `window.scrollTo(0, ${Number(y) || 0})` });
  // What comes into sight is loaded now (the stage's three.js, on a phone): its bytes count, its first seconds do not.
  await sleep(4000 * Math.max(1, rate / 2));
  cdp.off('Network.responseReceived');
  cdp.off('Network.loadingFinished');
  await cdp.send('Runtime.evaluate', { expression: 'window.__fx.times.length = 0; window.__fx.idle.length = 0; window.__fx.frames = 0; window.__fx.long.length = 0' });
  if (PROFILE) {
    await cdp.send('Profiler.enable');
    await cdp.send('Profiler.setSamplingInterval', { interval: 100 });
    await cdp.send('Profiler.start');
  }
  const m0 = await cdp.send('Performance.getMetrics');
  const t0 = Date.now();
  await sleep(SECONDS * 1000);
  const m1 = await cdp.send('Performance.getMetrics');
  const profile = PROFILE ? (await cdp.send('Profiler.stop')).profile : undefined;
  const wall = (Date.now() - t0) / 1000;
  const fx = (await cdp.send('Runtime.evaluate', { expression: 'JSON.stringify(window.__fx)', returnByValue: true })).result.value;
  const { times: work, idle, frames, long } = JSON.parse(fx);
  // A worker's script is fetched by the worker, out of the page's network events: the page's resource timing has it.
  const resources = (await cdp.send('Runtime.evaluate', { expression: "JSON.stringify(performance.getEntriesByType('resource').map((e) => [e.name, e.transferSize]))", returnByValue: true })).result.value;
  for (const [name, size] of JSON.parse(resources)) {
    const path = new URL(name).pathname;
    if (!path.endsWith('.js') || bytes.files.some((f) => f.url === path)) continue;
    bytes.total += size;
    bytes.js += size;
    bytes.files.push({ url: path, kind: 'js', size });
  }
  const all = [...work, ...idle];
  const d = (name) => metric(m1, name) - metric(m0, name);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  return {
    config: config.name,
    position,
    rate,
    cpu: d('TaskDuration') / wall,
    script: d('ScriptDuration') / wall,
    style: (d('RecalcStyleDuration') + d('LayoutDuration')) / wall,
    frames: frames / wall,
    painted: work.length / wall,
    paintMean: work.length ? work.reduce((a, b) => a + b, 0) / work.length : 0,
    paintP95: quantile(work, 0.95),
    paintMax: work.length ? Math.max(...work) : 0,
    frameMax: all.length ? Math.max(...all) : 0,
    over16: all.filter((v) => v > 16.7).length,
    long: long.length,
    longMax: long.length ? Math.max(...long) : 0,
    heap: metric(m1, 'JSHeapUsedSize'),
    bytes,
    top: profile ? topOf(profile) : [],
  };
}

/** The self time of each function of a CPU profile, the largest first, without the idle time. */
function topOf(profile) {
  const dt = new Map();
  const ids = profile.samples ?? [];
  const deltas = profile.timeDeltas ?? [];
  for (let i = 0; i < ids.length; i++) dt.set(ids[i], (dt.get(ids[i]) ?? 0) + (deltas[i] ?? 0));
  const total = deltas.reduce((a, b) => a + b, 0) || 1;
  const by = new Map();
  for (const node of profile.nodes) {
    const f = node.callFrame;
    if (['(idle)', '(program)', '(root)'].includes(f.functionName)) continue;
    const file = f.url ? f.url.split('/').pop() : '';
    const key = `${f.functionName || '(anonima)'} ${file}:${f.lineNumber + 1}:${f.columnNumber + 1}`;
    by.set(key, (by.get(key) ?? 0) + (dt.get(node.id) ?? 0));
  }
  return [...by].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, us]) => `${k} ${(us / 1000).toFixed(1)} ms (${((us / total) * 100).toFixed(1)} %)`);
}

const chrome = await launch({ chrome: CHROME, width: WIDTH, height: HEIGHT, flags: WEBGL ? [] : ['--disable-3d-apis'] });
const { product } = chrome;
const browser = connect(chrome.browserWs);
await browser.open;
const gpu = (await browser.send('SystemInfo.getInfo')).gpu;
browser.close();
const cdp = chrome.page;
try {
  await cdp.send('Page.enable');
  await cdp.send('Network.enable');
  await cdp.send('Performance.enable');
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: PROBE });
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: DPR, mobile: PHONE });
  if (PHONE) await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  const rows = [];
  for (const rate of RATES) for (const position of POSITIONS) for (const config of CONFIGS.filter((c) => new RegExp(ONLY).test(c.name))) rows.push(await measure(cdp, config, rate, position));
  const status = gpu.featureStatus ?? {};
  console.log(
    `Pagina ${URL_PAGE}, ${WIDTH}×${HEIGHT}, DPR ${DPR}${PHONE ? ' (telefono)' : ''}, ${SECONDS} s per misura, ${WEBGL ? 'palco 3D acceso' : 'palco 3D spento (--disable-3d-apis)'}; ${product} headless; ` +
      `canvas 2D ${status['2d_canvas'] ?? '?'}, composizione ${status.gpu_compositing ?? '?'}, rasterizzazione ${status.rasterization ?? '?'}; GPU ${gpu.devices?.[0]?.deviceString ?? '?'}.\n`,
  );
  console.log('| Configurazione | Posizione | CPU | Thread principale | di cui script | stile e layout | Fotogrammi al secondo (che dipingono gli effetti) | ms per fotogramma degli effetti (media / p95 / max) | Fotogramma più lungo, ms | Fotogrammi oltre 16,7 ms | Compiti lunghi (> 50 ms), il più lungo | Heap JS | Scaricati (JS / totale) |');
  console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const r of rows) {
    console.log(
      `| ${r.config} | ${r.position} | ${r.rate}× | ${pct(r.cpu)} | ${pct(r.script)} | ${pct(r.style)} | ${r.frames.toFixed(1)} (${r.painted.toFixed(1)}) | ${ms(r.paintMean)} / ${ms(r.paintP95)} / ${ms(r.paintMax)} | ${ms(r.frameMax)} | ${r.over16} | ${r.long}, ${ms(r.longMax)} ms | ${kb(r.heap)} | ${kb(r.bytes.js)} / ${kb(r.bytes.total)} |`,
    );
  }
  if (PROFILE) {
    for (const r of rows) {
      if (!r.top.length) continue;
      console.log(`\nProfilo di «${r.config}» (${r.position}) a ${r.rate}×, tempo proprio in ${SECONDS} s:`);
      for (const t of r.top) console.log(`- ${t}`);
    }
  }
  // What each configuration downloads that the sober one does not.
  const base = new Set(rows.filter((r) => r.config.startsWith('sobria')).flatMap((r) => r.bytes.files.map((f) => f.url)));
  const seen = new Set();
  console.log('\nFile in più rispetto alla sobria (prima misura di ogni configurazione):\n');
  for (const r of rows) {
    if (seen.has(r.config) || r.config.startsWith('sobria')) continue;
    seen.add(r.config);
    const extra = r.bytes.files.filter((f) => !base.has(f.url));
    console.log(`- ${r.config}: ${extra.map((f) => `\`${f.url}\` ${kb(f.size)}`).join(', ') || 'nessuno'} (${kb(extra.reduce((a, f) => a + f.size, 0))})`);
  }
} finally {
  await chrome.close();
}
