// How many voxels does a person need? The hand-written wanderer at several heights: four views and
// the walk (12 frames as the game uses them), at one pixel per voxel and scaled to the size a person
// has on screen in the game (~52 px). Writes lab/out/risoluzione/*.png.
// npx vite-node lab/scripts/resolution.ts -- [16 24 32 40]

import fs from 'node:fs';
import path from 'node:path';
import { analyse } from '../mj3d/check';
import { run } from '../mj3d/engine';
import { DIRECTION_VIEW, walk } from '../mj3d/animate';
import { DEFAULT_RENDER, render, sheet, type Picture } from '../mj3d/render';
import { viandante } from '../programs/viandante';
import { png } from './png';

const heights = process.argv.slice(2).filter((a) => /^\d+$/.test(a)).map(Number);
const dir = path.resolve('lab/out/risoluzione');
fs.mkdirSync(dir, { recursive: true });

/** Nearest-neighbour resize to a given height (what the game does with a sprite). */
function fit(p: Picture, h: number): Picture {
  const k = h / p.h;
  const w = Math.max(1, Math.round(p.w * k));
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const s = (Math.min(p.h - 1, Math.floor(y / k)) * p.w + Math.min(p.w - 1, Math.floor(x / k))) * 4;
      data.set(p.data.subarray(s, s + 4), (y * w + x) * 4);
    }
  return { w, h, data };
}

const onScreen: Picture[] = [];
for (const H of heights.length ? heights : [16, 24, 32, 40]) {
  const p = viandante(H);
  const r = run(p, 1);
  const a = analyse(r, p.palette);
  const { frames, rig } = walk(r.grid, p.palette);
  console.log(`${H} voxel: griglia ${p.size.join('×')}, ${a.voxels} voxel, ${a.ms} ms, arti ${rig.limbs.map((l) => l.part).join(' ')}`, a.errors.join('; '), a.warnings.join('; '));
  // 4 rows (down, left, right, up) × 3 frames, like the game's walk sheet.
  const rows = (['down', 'left', 'right', 'up'] as const).map((d) => sheet(frames.map((f) => render(f, p.palette, DIRECTION_VIEW[d], DEFAULT_RENDER)), 1, 2));
  const w = Math.max(...rows.map((x) => x.w));
  const data = new Uint8ClampedArray(w * rows.reduce((s, x) => s + x.h, 0) * 4);
  let oy = 0;
  for (const row of rows) {
    for (let y = 0; y < row.h; y++) data.set(row.data.subarray(y * row.w * 4, (y + 1) * row.w * 4), (oy + y) * w * 4);
    oy += row.h;
  }
  const walkSheet = { w, h: oy, data };
  fs.writeFileSync(path.join(dir, `camminata-${H}.png`), png(sheet([walkSheet], 4, 2, [112, 150, 84])));
  onScreen.push(fit(render(r.grid, p.palette, 0, DEFAULT_RENDER), 56));
}
fs.writeFileSync(path.join(dir, 'a-schermo.png'), png(sheet(onScreen, 3, 4, [112, 150, 84])));
console.log('scritto in', dir);
