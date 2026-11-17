// The photos of the scale (T403, D60): the author's fort and some structures of the bench shown in the lab 3D at 20, 10 and 5 voxels a
// tile beside the wanderer, at the game's scale. A headless Chrome of its own on the real GPU (tools/vesti/cdp.mjs), only on a page of
// this machine; the lab is driven from its console (`window.sandbox`: showModel, toWorld, putPlayer, frame, cut). The places to look at
// in the fort come from its program (lab/scripts/forte-scala.ts --json). The lab must be a build with the developers' catalogue:
//
//   npx vite build --mode development --outDir .tmp/dist-dev
//   npx vite preview --outDir .tmp/dist-dev --port <n> --strictPort
//   node lab/scripts/foto-scala.mjs --url http://127.0.0.1:<n>/lab/3d/ [--solo forte|strutture] [--out docs/img]
//
// Writes docs/img/forte-scala-<vpt>.png (the fort from 3/4 and four close-ups: the keep's door, the throne hall, the walls, a tower) and
// docs/img/strutture-scala-<id>-<vpt>.png (a structure from 3/4 with the wanderer at its door).

import fs from 'node:fs';
import path from 'node:path';
import { checkLocal, launch, sleep } from '../../tools/vesti/cdp.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : fallback;
};
const URL_LAB = opt('url', 'http://127.0.0.1:4173/lab/3d/');
const OUT = opt('out', 'docs/img');
const ONLY = opt('solo', '');
const MEASURES = JSON.parse(fs.readFileSync(opt('misure', 'lab/banco/riferimento/forte-scala.json'), 'utf8'));
const DENSITIES = [20, 10, 5];
const W = 1000, H = 625;
checkLocal(URL_LAB);
fs.mkdirSync(OUT, { recursive: true });

const FORT = 'forte-handmade';
const STRUCTURES = [
  ['villetta', 'taglie:scultore-villetta-large'],
  ['rocca', 'taglie:scultore-rocca-large'],
  ['forte-banco', 'taglie:forte-gargantuan'],
  ['fattoria-opus', 'scultori:openrouter/claude-opus-5-5/giro1/fattoria-huge'],
];

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
  await run(`(async () => { for (let i = 0; i < 240 && !window.sandbox?.player(); i++) await new Promise((r) => setTimeout(r, 250)); if (!window.sandbox?.player()) throw new Error('il viandante non arriva'); })()`);
  // The panel would cover the scene: the photos are of the scene.
  await run(`document.getElementById('panel').style.display = 'none'; document.getElementById('hud').style.display = 'none'; document.getElementById('panel-toggle').style.display = 'none'`);
  const gpu = await run(`(() => { const c = document.createElement('canvas').getContext('webgl2'); const e = c?.getExtension('WEBGL_debug_renderer_info'); return e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?'; })()`);
  console.log(`# ${gpu}`);
  // On the plain north of the land (T403): nothing of the village in the way, room for a fort of a hundred tiles.
  const start = [22, -200];

  /** Shows a model at a density in front of the wanderer (back at the start), waits for it, says where it is and its size in tiles. */
  const show = async (id, vpt) => {
    await run(`window.sandbox.follow(); window.sandbox.cut(null); window.sandbox.putPlayer(${start[0]}, ${start[1]}, 0, 0)`);
    const t0 = Date.now();
    const ok = await run(`window.sandbox.showModel(${JSON.stringify(id)}, ${vpt})`);
    if (!ok) throw new Error(`${id} non si mostra`);
    console.log(`${id} a ${vpt}: ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    return run(`(() => { const s = window.sandbox.showcase(); const g = s.asset.built.grid; return { x: s.x, z: s.z, yaw: s.yaw, X: g.X, Y: g.Y, Z: g.Z, vpt: s.entry.vpt }; })()`);
  };
  const toWorld = (v) => run(`window.sandbox.toWorld(${v.join(',')})`);
  const settle = (ms = 900) => sleep(ms);

  /** Puts several shots together in a canvas of the page (its CSP allows data: images): a large one on top, the others in a grid under it, labelled. */
  async function compose(file, title, top, rest) {
    const imgs = [top, ...rest].map((s) => ({ src: `data:image/png;base64,${s.png.toString('base64')}`, label: s.label }));
    const expr = `(async () => {
      const imgs = ${JSON.stringify(imgs)};
      const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
      const all = await Promise.all(imgs.map((i) => load(i.src)));
      const w = ${W}, small = 2, sw = w / small, sh = ${H} / small, rows = Math.ceil((all.length - 1) / small);
      const c = document.createElement('canvas'); c.width = w; c.height = 36 + ${H} + rows * sh;
      const g = c.getContext('2d'); g.fillStyle = '#111'; g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = '#fff'; g.font = 'bold 20px sans-serif'; g.fillText(${JSON.stringify(title)}, 12, 25);
      const label = (t, x, y) => { g.font = '15px sans-serif'; const m = g.measureText(t).width; g.fillStyle = 'rgba(0,0,0,0.65)'; g.fillRect(x + 6, y + 6, m + 12, 24); g.fillStyle = '#fff'; g.fillText(t, x + 12, y + 23); };
      g.drawImage(all[0], 0, 36, w, ${H}); label(imgs[0].label, 0, 36);
      all.slice(1).forEach((im, k) => { const x = (k % small) * sw, y = 36 + ${H} + Math.floor(k / small) * sh; g.drawImage(im, x, y, sw, sh); label(imgs[k + 1].label, x, y); });
      return c.toDataURL('image/png').split(',')[1];
    })()`;
    const data = await run(expr);
    fs.writeFileSync(path.join(OUT, file), Buffer.from(data, 'base64'));
    console.log(`scritto ${path.join(OUT, file)}`);
  }

  if (ONLY !== 'strutture') {
    const m = MEASURES.seeds[0];
    for (const vpt of DENSITIES) {
      const s = await show(FORT, vpt);
      const side = Math.max(s.X, s.Y) / vpt;
      const ground = m.ground;
      // The wanderer in the gate of the fort, the fort from 3/4.
      const gate = await toWorld(m.spots.gate);
      const centre = await toWorld([s.X / 2, s.Y / 2, 0]);
      await run(`window.sandbox.putPlayer(${gate[0]}, ${gate[2]}, ${gate[1]}, 0)`);
      await run(`window.sandbox.frame(${centre[0]}, 0, ${centre[2]}, ${side * 1.35}, 0.7, 0.72)`);
      await settle(1500);
      const overview = { png: await shot(), label: `il forte da 3/4, il viandante nella porta (${side} × ${side} caselle)` };
      const shots = [];
      // The keep's door: which way is out (lab/scripts/forte-scala.ts, keepDoorOut).
      const door = await toWorld(m.spots.keepDoor);
      const hall = await toWorld(m.spots.hall);
      const [ox, oy] = m.keepDoorOut;
      const before = await toWorld([m.spots.keepDoor[0] + ox * 3 * vpt, m.spots.keepDoor[1] + oy * 3 * vpt, ground]);
      const out = Math.atan2(before[0] - door[0], before[2] - door[2]);

      // Seen from inside the hall, its ceiling cut away (outside, the curtain wall may stand a few tiles off and hide it): the wanderer
      // in the doorway, the lintel over the head.
      const ceiling = await toWorld([m.spots.hall[0], m.spots.hall[1], ground + m.hall.clear]);
      await run(`window.sandbox.putPlayer(${door[0]}, ${door[2]}, ${door[1]}, ${out})`);
      await run(`window.sandbox.cut(${ceiling[1] - 0.02}); window.sandbox.frame(${door[0]}, ${door[1] + m.keepDoor.height / vpt / 2}, ${door[2]}, ${70 / vpt}, ${out + Math.PI + 0.55}, 0.45)`);
      await settle();
      shots.push({ png: await shot(), label: `porta del mastio, da dentro: ${m.keepDoor.width} × ${m.keepDoor.height} voxel` });
      // The throne hall: the wanderer in the middle, its ceiling cut away, from above.
      await run(`window.sandbox.putPlayer(${hall[0]}, ${hall[2]}, ${hall[1]}, ${out})`);
      await run(`window.sandbox.cut(${ceiling[1] - 0.02}); window.sandbox.frame(${hall[0]}, ${hall[1] + 0.8}, ${hall[2]}, ${Math.max(6, 160 / vpt)}, ${out + 0.6}, 0.62)`);
      await settle();
      shots.push({ png: await shot(), label: `sala del trono, senza soffitto: luce ${m.hall.clear} voxel` });
      await run(`window.sandbox.cut(null)`);
      // The walls: the wanderer on the walk, seen from the courtyard.
      const wall = await toWorld(m.spots.wall);
      await run(`window.sandbox.putPlayer(${wall[0]}, ${wall[2]}, ${wall[1]}, 0)`);
      await run(`window.sandbox.frame(${wall[0]}, ${wall[1] * 0.6}, ${wall[2]}, ${Math.max(6, 130 / vpt)}, ${0.9}, 0.38)`);
      await settle();
      shots.push({ png: await shot(), label: `mura: camminatoio a ${m.walls.walk} voxel dal selciato` });
      // A tower: the wanderer on its top, between the merlons.
      const tower = await toWorld(m.spots.tower);
      await run(`window.sandbox.putPlayer(${tower[0]}, ${tower[2]}, ${tower[1]}, 0)`);
      await run(`window.sandbox.frame(${tower[0]}, ${tower[1] * 0.6}, ${tower[2]}, ${Math.max(6, 160 / vpt)}, 2.3, 0.42)`);
      await settle();
      shots.push({ png: await shot(), label: `torre: terrazza a ${m.towerTop} voxel, piani di ${m.towerStoreys[0]?.clear ?? '?'} di luce` });
      await compose(`forte-scala-${vpt}.png`, `Il forte dell'autore a ${vpt} voxel per casella (seme ${m.seed}): ${side} × ${side} caselle, il viandante alla scala del gioco`, overview, shots);
    }
  }

  if (ONLY !== 'forte') {
    for (const [name, id] of STRUCTURES)
      for (const vpt of DENSITIES) {
        const s = await show(id, vpt);
        const side = Math.max(s.X, s.Y) / vpt;
        // The wanderer just before the front the model turns to it, the camera from 3/4 on the side: the wanderer in front, the structure behind.
        const front = await toWorld([s.X / 2, s.Y, 0]);
        const centre = await toWorld([s.X / 2, s.Y / 2, 0]);
        const dx = front[0] - centre[0], dz = front[2] - centre[2], d = Math.hypot(dx, dz) || 1;
        const px = front[0] + (dx / d) * 0.9, pz = front[2] + (dz / d) * 0.9;
        await run(`window.sandbox.putPlayer(${px}, ${pz}, 0, ${Math.atan2(-dx, -dz)})`);
        const face = Math.atan2(dx, dz);
        await run(`window.sandbox.frame(${(px + centre[0]) / 2}, 0.5, ${(pz + centre[2]) / 2}, ${Math.max(6, side * 1.6)}, ${face + 0.75}, 0.62)`);
        await settle(1200);
        const label = `${name} a ${vpt} voxel per casella: ${side} × ${side} caselle, il viandante davanti`;
        await compose(`strutture-scala-${name}-${vpt}.png`, label, { png: await shot(), label: id }, []);
      }
  }
} finally {
  await browser.close();
}
