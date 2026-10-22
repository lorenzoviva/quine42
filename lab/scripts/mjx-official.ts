// Runs the 3D models of MarkovJunior's repository (lab/mjx/official, unchanged) through the lab's
// front-end and photographs them: the proof that the lab reads MarkovJunior literally.
// npx vite-node lab/scripts/mjx-official.ts [-- Growth River]   → lab/out/mjx-official/<model>.png

import fs from 'node:fs';
import path from 'node:path';
import { compileMjx } from '../../src/mj/model';
import { runMjx } from '../../src/mj/run';
import { OFFICIAL } from '../mjx/official';
import { DEFAULT_RENDER, render, sheet } from '../../src/mj/photo';
import { png } from './png';

const only = process.argv.slice(2).filter((a) => a !== '--');
const dir = path.resolve('lab/out/mjx-official');
fs.mkdirSync(dir, { recursive: true });
for (const o of OFFICIAL) {
  if (only.length && !only.includes(o.name)) continue;
  try {
    const m = compileMjx(o.xml, { size: o.size });
    const r = runMjx(m, 1, { maxSteps: o.steps ?? 5_000_000, deadline: 60_000 });
    const counts: Record<string, number> = {};
    for (const c of r.grid.cells) counts[r.grid.alphabet[c]] = (counts[r.grid.alphabet[c]] ?? 0) + 1;
    console.log(o.name.padEnd(18), `${r.grid.X}×${r.grid.Y}×${r.grid.Z}`, `${r.steps} passi`, `${r.ms} ms`, r.finished ? '' : '(interrotto)', JSON.stringify(counts));
    const views = [0, 1].map((v) => render(r.grid, m.program.palette, v, { ...DEFAULT_RENDER, shadow: false }));
    fs.writeFileSync(path.join(dir, `${o.name}.png`), png(sheet(views, Math.max(1, Math.floor(400 / views[0].w)), 4, [40, 40, 48])));
  } catch (e) {
    console.log(o.name.padEnd(18), 'ERRORE', (e as Error).message);
  }
}
