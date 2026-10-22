// Renders the hand-written examples (four views, three seeds each) to lab/out/examples/*.png.
// npx vite-node lab/scripts/examples.ts

import fs from 'node:fs';
import path from 'node:path';
import { analyse } from '../mj3d/check';
import { run } from '../mj3d/engine';
import { EXAMPLES } from '../mj3d/examples';
import { DEFAULT_RENDER, render, sheet } from '../mj3d/render';
import { png } from './png';

const dir = path.resolve('lab/out/examples');
fs.mkdirSync(dir, { recursive: true });
for (const e of EXAMPLES) {
  const pics = [];
  for (const seed of [1, 2, 3]) {
    const r = run(e.program, seed);
    const a = analyse(r, e.program.palette);
    console.log(e.id, seed, `${a.voxels} voxel, ${a.steps} passi, ${a.ms} ms`, a.errors.join('; '), a.warnings.join('; '));
    pics.push(...[0, 1, 2, 3].map((v) => render(r.grid, e.program.palette, v, DEFAULT_RENDER)));
  }
  fs.writeFileSync(path.join(dir, `${e.id}.png`), png(sheet(pics, 3, 4, [120, 150, 90])));
}
console.log('scritto in', dir);
