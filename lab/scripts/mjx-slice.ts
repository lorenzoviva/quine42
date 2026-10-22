// Prints horizontal slices of a MarkovJunior XML model as letters (the empty cell is '.').
// npx vite-node lab/scripts/mjx-slice.ts -- casa [seed] [z ...] [--y 30] (a vertical slice at y instead)

import fs from 'node:fs';
import path from 'node:path';
import { compileMjx } from '../mjx/model';
import { runMjx } from '../mjx/run';

const args = process.argv.slice(2).filter((a) => a !== '--');
const yi = args.indexOf('--y');
const ys = yi >= 0 ? Number(args.splice(yi, 2)[1]) : undefined;
const [id, seed = '1', ...zs] = args;
const file = fs.existsSync(id) ? id : path.resolve('lab/mjx/models', `${id}.xml`);
const g = runMjx(compileMjx(fs.readFileSync(file, 'utf8')), Number(seed)).grid;
const at = (x: number, y: number, z: number) => g.alphabet[g.cells[x + y * g.X + z * g.X * g.Y]];
// Only the part of the box that holds something.
let x0 = g.X, x1 = 0, y0 = g.Y, y1 = 0, z1 = 0;
for (let z = 0; z < g.Z; z++)
  for (let y = 0; y < g.Y; y++)
    for (let x = 0; x < g.X; x++)
      if (at(x, y, z) !== '.') [x0, x1, y0, y1, z1] = [Math.min(x0, x), Math.max(x1, x), Math.min(y0, y), Math.max(y1, y), Math.max(z1, z)];
console.log(`box ${g.X}×${g.Y}×${g.Z}; occupied x ${x0}..${x1}, y ${y0}..${y1}, z 0..${z1}`);
if (ys !== undefined) {
  for (let z = z1; z >= 0; z--) {
    let row = '';
    for (let x = x0; x <= x1; x++) row += at(x, ys, z);
    console.log(String(z).padStart(3), row);
  }
} else
  for (const zz of zs.length ? zs.map(Number) : [0]) {
    console.log(`z = ${zz}`);
    for (let y = y0; y <= y1; y++) {
      let row = '';
      for (let x = x0; x <= x1; x++) row += at(x, y, zz);
      console.log(row);
    }
  }
