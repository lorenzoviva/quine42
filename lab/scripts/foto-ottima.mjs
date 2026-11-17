// The photo of the reference of «done well» (T371): the author's fort in the lab 3D at 10 voxels a tile (D61), from 3/4, the wanderer in
// its gate at the game's scale. A headless Chrome of its own on the real GPU (tools/vesti/cdp.mjs), only on a page of this machine, the
// lab driven from its console (`window.sandbox`, as lab/scripts/foto-scala.mjs does); where the gate is comes from the measures of
// lab/scripts/forte-scala.ts. The lab must be a build with the developers' catalogue:
//
//   npx vite build --mode development --outDir .tmp/dist-dev
//   npx vite preview --outDir .tmp/dist-dev --port <n> --strictPort
//   node lab/scripts/foto-ottima.mjs --url http://127.0.0.1:<n>/lab/3d/ [--versione v1] [--vpt 10] [--out lab/banco/riferimento/ottima]

import fs from 'node:fs';
import path from 'node:path';
import { checkLocal, launch, sleep } from '../../tools/vesti/cdp.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : fallback;
};
const URL_LAB = opt('url', 'http://127.0.0.1:4173/lab/3d/');
const OUT = opt('out', 'lab/banco/riferimento/ottima');
const VERSION = opt('versione', 'v1');
const VPT = Number(opt('vpt', '10'));
const MEASURES = JSON.parse(fs.readFileSync(opt('misure', 'lab/banco/riferimento/forte-scala.json'), 'utf8'));
const W = 1280, H = 800;
checkLocal(URL_LAB);
fs.mkdirSync(OUT, { recursive: true });

const browser = await launch({ width: W, height: H, flags: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu', '--force-device-scale-factor=1'] });
const page = browser.page;
const run = async (expression) => {
  const r = await page.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(`${r.exceptionDetails.text} ${r.exceptionDetails.exception?.description ?? ''}`);
  return r.result.value;
};
const shot = async () => Buffer.from((await page.send('Page.captureScreenshot', { format: 'png' })).data, 'base64');

try {
  await page.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await page.send('Page.navigate', { url: URL_LAB });
  await run(`(async () => { for (let i = 0; i < 960 && !window.sandbox?.player(); i++) await new Promise((r) => setTimeout(r, 250)); if (!window.sandbox?.player()) throw new Error('il viandante non arriva'); })()`);
  await run(`document.getElementById('panel').style.display = 'none'; document.getElementById('hud').style.display = 'none'; document.getElementById('panel-toggle').style.display = 'none'`);
  const gpu = await run(`(() => { const c = document.createElement('canvas').getContext('webgl2'); const e = c?.getExtension('WEBGL_debug_renderer_info'); return e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?'; })()`);
  console.log(`# ${gpu}`);
  // On the plain north of the land (T403): nothing of the village in the way.
  await run(`window.sandbox.follow(); window.sandbox.cut(null); window.sandbox.putPlayer(22, -200, 0, 0)`);
  const t0 = Date.now();
  const ok = await run(`window.sandbox.showModel('forte-handmade', ${VPT})`);
  if (!ok) throw new Error('il forte non si mostra');
  const s = await run(`(() => { const s = window.sandbox.showcase(); const g = s.asset.built.grid; return { X: g.X, Y: g.Y, Z: g.Z, vpt: s.entry.vpt }; })()`);
  const side = Math.max(s.X, s.Y) / VPT;
  console.log(`il forte a ${VPT}: ${((Date.now() - t0) / 1000).toFixed(1)} s, ${side} × ${side} caselle`);
  const m = MEASURES.seeds[0];
  const toWorld = (v) => run(`window.sandbox.toWorld(${v.join(',')})`);
  const gate = await toWorld(m.spots.gate);
  const centre = await toWorld([s.X / 2, s.Y / 2, 0]);
  await run(`window.sandbox.putPlayer(${gate[0]}, ${gate[2]}, ${gate[1]}, 0)`);
  await run(`window.sandbox.frame(${centre[0]}, 0, ${centre[2]}, ${side * 1.3}, 0.7, 0.72)`);
  await sleep(1500);
  const file = path.join(OUT, `forte-${VERSION}-lab3d.png`);
  fs.writeFileSync(file, await shot());
  console.log(`scritto ${file}`);
} finally {
  await browser.close();
}
