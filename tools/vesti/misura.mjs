// Measures what a skin's effects cost (T284): a headless Chrome of its own (never the author's), the page at 1920 px, a modest machine
// simulated with the processor slowed down (`Emulation.setCPUThrottlingRate`), the bytes of a cold load, the main thread's busy time and
// the time of every animation frame. Nothing leaves this machine: the page is a preview on loopback.
//
//   node tools/vesti/misura.mjs --url http://127.0.0.1:4185/site/index.html [--veste futuristica] [--rallenta 1,4] [--secondi 10] [--larghezza 1920] [--webgl]
//
// The configurations: the sober skin (no effects), the futuristic one standing still (prefers-reduced-motion), the futuristic one with
// each engine of its lights (`?fx=semplice`, `?fx=mj`), and the variant proposed without the 3D stage (`?fx=mj-pagina`). Without --webgl the 3D stage of the landing does not start (`--disable-3d-apis`), so
// what is measured is the effects alone; with it the stage runs too. --profilo adds the CPU profile, --solo <parola> keeps some
// configurations. The result is a Markdown table on stdout, with the GPU Chrome had.

import { checkLocal, launch, sleep, wearSkin, connect } from './cdp.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : fallback;
};
const URL_PAGE = opt('url', 'http://127.0.0.1:4185/site/index.html');
const RATES = opt('rallenta', '1,4').split(',').map(Number);
const SECONDS = Number(opt('secondi', '10'));
const WIDTH = Number(opt('larghezza', '1920'));
const HEIGHT = Number(opt('altezza', '1080'));
const WEBGL = args.includes('--webgl');
/** With --profilo, the CPU profile of each measurement: the functions that take the most time, by file. */
const PROFILE = args.includes('--profilo');
/** With --solo <parola>, only the configurations whose name has it. */
const ONLY = opt('solo', '');
const CHROME = opt('chrome', undefined);
checkLocal(URL_PAGE);

/** The skin to measure against the sober one: its engines of the lights and its variant only for the futuristic one (`?fx=`). */
const SKIN = opt('veste', 'futuristica');
const CONFIGS =
  SKIN === 'futuristica'
    ? [
        { name: 'sobria (nessun effetto)', skin: 'sobria', fx: '', reduced: false },
        { name: 'futuristica ferma (riduci movimento)', skin: 'futuristica', fx: '', reduced: true },
        { name: 'futuristica, luci semplici', skin: 'futuristica', fx: 'semplice', reduced: false },
        { name: 'futuristica, luci MarkovJunior', skin: 'futuristica', fx: 'mj', reduced: false },
        { name: 'variante senza 3D, MarkovJunior ovunque', skin: 'futuristica', fx: 'mj-pagina', reduced: false },
      ]
    : [
        { name: 'sobria (nessun effetto)', skin: 'sobria', fx: '', reduced: false },
        { name: `${SKIN} ferma (riduci movimento)`, skin: SKIN, fx: '', reduced: true },
        { name: `${SKIN} in movimento`, skin: SKIN, fx: '', reduced: false },
      ];

/**
 * Times every animation frame's callback, before the page's own scripts run, and tells the frames that painted a canvas (a tick of the
 * effects: `putImageData`) from the ones that did not.
 */
const PROBE = `(() => {
  const raf = window.requestAnimationFrame.bind(window);
  const put = CanvasRenderingContext2D.prototype.putImageData;
  const fx = (window.__fx = { frames: 0, times: [], idle: [], drew: false });
  CanvasRenderingContext2D.prototype.putImageData = function (...a) { fx.drew = true; return put.apply(this, a); };
  window.requestAnimationFrame = (cb) => raf((t) => {
    fx.drew = false;
    const t0 = performance.now();
    try { cb(t); } finally {
      const d = performance.now() - t0;
      fx.frames++;
      const list = fx.drew ? fx.times : fx.idle;
      if (list.length < 20000) list.push(d);
    }
  });
})();`;

const metric = (m, name) => m.metrics.find((x) => x.name === name)?.value ?? 0;
const pct = (v) => `${(v * 100).toFixed(1)} %`;
const ms = (v) => `${v.toFixed(2)} ms`;
const kb = (v) => `${(v / 1024).toFixed(1)} KB`;
const quantile = (xs, q) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
};

async function measure(cdp, config, rate) {
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
  await sleep(4000 * Math.max(1, rate / 2));
  cdp.off('Network.responseReceived');
  cdp.off('Network.loadingFinished');
  await cdp.send('Runtime.evaluate', { expression: 'window.__fx.times.length = 0; window.__fx.idle.length = 0; window.__fx.frames = 0' });
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
  const { times: work, frames } = JSON.parse(fx);
  const d = (name) => metric(m1, name) - metric(m0, name);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  return {
    config: config.name,
    rate,
    cpu: d('TaskDuration') / wall,
    script: d('ScriptDuration') / wall,
    style: (d('RecalcStyleDuration') + d('LayoutDuration')) / wall,
    frames: frames / wall,
    ticks: work.length / wall,
    tickMean: work.length ? work.reduce((a, b) => a + b, 0) / work.length : 0,
    tickP95: quantile(work, 0.95),
    tickMax: work.length ? Math.max(...work) : 0,
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
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
  const rows = [];
  for (const rate of RATES) for (const config of CONFIGS.filter((c) => c.name.includes(ONLY))) rows.push(await measure(cdp, config, rate));
  const status = gpu.featureStatus ?? {};
  console.log(
    `Pagina ${URL_PAGE}, ${WIDTH}×${HEIGHT}, DPR 1, ${SECONDS} s per misura, ${WEBGL ? 'palco 3D acceso' : 'palco 3D spento (--disable-3d-apis)'}; ${product} headless; ` +
      `canvas 2D ${status['2d_canvas'] ?? '?'}, composizione ${status.gpu_compositing ?? '?'}, rasterizzazione ${status.rasterization ?? '?'}; GPU ${gpu.devices?.[0]?.deviceString ?? '?'}.\n`,
  );
  console.log('| Configurazione | CPU rallentata | Thread principale | di cui script | stile e layout | Tick al secondo | ms per tick (media / p95 / max) | Heap JS | Scaricati (JS / totale) |');
  console.log('|---|---|---|---|---|---|---|---|---|');
  for (const r of rows) {
    console.log(`| ${r.config} | ${r.rate}× | ${pct(r.cpu)} | ${pct(r.script)} | ${pct(r.style)} | ${r.ticks.toFixed(1)} su ${r.frames.toFixed(1)} fotogrammi | ${ms(r.tickMean)} / ${ms(r.tickP95)} / ${ms(r.tickMax)} | ${kb(r.heap)} | ${kb(r.bytes.js)} / ${kb(r.bytes.total)} |`);
  }
  if (PROFILE) {
    for (const r of rows) {
      if (!r.top.length) continue;
      console.log(`\nProfilo di «${r.config}» a ${r.rate}×, tempo proprio in ${SECONDS} s:`);
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
