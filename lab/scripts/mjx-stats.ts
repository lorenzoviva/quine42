// What each model of lab/mjx/models costs: grid, run time, voxels shown and triangles in the sandbox.
// npx vite-node lab/scripts/mjx-stats.ts

import fs from 'node:fs';
import path from 'node:path';
import { meshVoxels } from '../../src/mj/mesh';
import { compileMjx } from '../../src/mj/model';
import { runMjx } from '../../src/mj/run';

const dir = path.resolve('lab/mjx/models');
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.xml'))) {
  const m = compileMjx(fs.readFileSync(path.join(dir, f), 'utf8'));
  const t0 = Date.now();
  const r = runMjx(m, 1);
  const ms = Date.now() - t0;
  const t1 = Date.now();
  const mesh = meshVoxels(r.grid, m.program.palette, { vpt: 20 });
  const shown = r.grid.cells.filter((c) => !!m.program.palette[r.grid.alphabet[c]]?.color && !m.program.palette[r.grid.alphabet[c]]?.hidden).length;
  console.log(f.padEnd(26), `${r.grid.X}×${r.grid.Y}×${r.grid.Z}`.padEnd(10), `${ms} ms`.padStart(7), `${shown} voxel`.padStart(12), `${mesh.indices.length / 3} triangoli`.padStart(16), `mesh ${Date.now() - t1} ms`);
}
