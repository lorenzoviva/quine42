// Photographs MarkovJunior XML models (lab/mjx/models/<id>.xml or a path) from four sides, a few seeds.
// npx vite-node lab/scripts/mjx-render.ts -- casa falo [--seeds 3] [--frames] [--act apri]
//   → lab/out/mjx/<id>.png (and <id>.anim.png with the animation frames, <id>.<azione>.png)

import fs from 'node:fs';
import path from 'node:path';
import { analyse } from '../mj3d/check';
import { DEFAULT_RENDER, render, sheet, type Picture } from '../mj3d/render';
import { compileMjx } from '../mjx/model';
import { act, clipFrames, runMjx } from '../mjx/run';
import { png } from './png';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => {
  const i = args.indexOf(k);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
};
const seeds = Number(opt('--seeds') ?? 2);
const action = opt('--act');
const frames = args.includes('--frames');
const ids = args.filter((a) => !a.startsWith('--'));
const dir = path.resolve('lab/out/mjx');
fs.mkdirSync(dir, { recursive: true });

for (const id of ids) {
  const file = fs.existsSync(id) ? id : path.resolve('lab/mjx/models', `${id}.xml`);
  const name = path.basename(file, '.xml');
  const m = compileMjx(fs.readFileSync(file, 'utf8'));
  for (const w of m.warnings) console.log('  avviso:', w);
  const pics: Picture[] = [];
  for (let seed = 1; seed <= seeds; seed++) {
    const r = runMjx(m, seed);
    const a = analyse(r, m.program.palette);
    console.log(name, seed, `${a.voxels} voxel, ${r.steps} passi, ${r.ms} ms`, r.finished ? '' : '(non finisce!)', a.errors.join('; '), a.warnings.join('; '), r.unused?.length ? `mai usati: ${r.unused.join(' | ')}` : '');
    pics.push(...[0, 1, 2, 3].map((v) => render(r.grid, m.program.palette, v, DEFAULT_RENDER)));
    if (seed === 1 && frames)
      for (const clip of m.animations) {
        const fr = clipFrames(r.grid, clip, seed);
        fs.writeFileSync(path.join(dir, `${name}.${clip.name}.png`), png(sheet(fr.map((g) => render(g, m.program.palette, 0, DEFAULT_RENDER)), 3, 4, [120, 150, 90])));
      }
    if (seed === 1 && action) {
      const clip = m.actions.find((c) => c.name === action);
      if (!clip) console.log('  azione sconosciuta', action);
      else {
        act(r.grid, clip, seed);
        fs.writeFileSync(path.join(dir, `${name}.${action}.png`), png(sheet([render(r.grid, m.program.palette, 0, DEFAULT_RENDER)], 3, 4, [120, 150, 90])));
      }
    }
  }
  const w = pics.reduce((s, p) => Math.max(s, p.w), 0) * 4;
  fs.writeFileSync(path.join(dir, `${name}.png`), png(sheet(pics, Math.max(1, Math.min(4, Math.floor(1600 / w))), 4, [120, 150, 90])));
}
