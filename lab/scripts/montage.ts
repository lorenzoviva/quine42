// One picture per run: the last version of every target, front and right views, in rows.
// npx vite-node lab/scripts/montage.ts -- <run> [<run>…]

import fs from 'node:fs';
import path from 'node:path';
import { run } from '../mj3d/engine';
import { DEFAULT_RENDER, render, sheet, type Picture } from '../mj3d/render';
import { png } from './png';

for (const name of process.argv.slice(2).filter((a) => a !== '--')) {
  const dir = path.resolve('lab/out', name);
  const last = new Map<string, string>();
  for (const f of fs.readdirSync(dir).filter((f) => /^[^.]+(\.v\d+)?\.json$/.test(f) && f !== 'summary.json').sort()) last.set(f.split('.')[0], f);
  const tiles: Picture[] = [];
  const names: string[] = [];
  for (const [base, f] of last) {
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (!j.program) continue;
    const r = run(j.program, 1);
    tiles.push(sheet([0, 1].map((v) => render(r.grid, j.program.palette, v, DEFAULT_RENDER)), 1, 2));
    names.push(base);
  }
  const rows: Picture[] = [];
  for (let i = 0; i < tiles.length; i += 6) rows.push(sheet(tiles.slice(i, i + 6), 1, 2));
  // Stack rows vertically.
  const w = Math.max(...rows.map((r) => r.w));
  const h = rows.reduce((s, r) => s + r.h, 0);
  const data = new Uint8ClampedArray(w * h * 4);
  let oy = 0;
  for (const r of rows) {
    for (let y = 0; y < r.h; y++) data.set(r.data.subarray(y * r.w * 4, (y + 1) * r.w * 4), ((oy + y) * w) * 4);
    oy += r.h;
  }
  fs.writeFileSync(path.join(dir, 'montage.png'), png(sheet([{ w, h, data }], 2, 0, [112, 150, 84])));
  console.log(name, names.join(', '));
}
