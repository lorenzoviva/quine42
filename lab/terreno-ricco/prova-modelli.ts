// T509: the cover models of lab/terreno-ricco/modelli/ on the real engine, a few seeds each: voxels, triangles, time, the plan in text.
//   npx vite-node lab/terreno-ricco/prova-modelli.ts -- [--viste] [--semi 4]
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { runForm } from '../../src/kernel/forms';
import { formMeshes } from '../../src/render/formmeshes';
import { planView, elevationView } from '../../src/mj/views';

const argv = process.argv.slice(2);
const views = argv.includes('--viste');
const seeds = Number(argv.includes('--semi') ? argv[argv.indexOf('--semi') + 1] : 4);
const dir = path.resolve('lab/terreno-ricco/modelli');
for (const f of readdirSync(dir).filter((x) => x.endsWith('.xml')).sort()) {
  const xml = readFileSync(path.join(dir, f), 'utf8');
  const rows: string[] = [];
  for (let s = 1; s <= seeds; s++) {
    const t0 = performance.now();
    const req = { xml, seed: s, vpt: 20, sway: true, model: f };
    let r;
    try {
      r = runForm(req);
    } catch (e) {
      rows.push(`seme ${s}: ERRORE ${(e as Error).message}`);
      continue;
    }
    const ms = performance.now() - t0;
    const m = formMeshes(r, req);
    let vox = 0;
    for (const c of r.grid.cells) if (c && r.palette[r.grid.alphabet[c]!] && !r.palette[r.grid.alphabet[c]!]!.hidden) vox++;
    rows.push(`seme ${s}: ${vox} voxel, ${m.body.indices.length / 3} triangoli, ${ms.toFixed(1)} ms${r.finished ? '' : ' (non finito)'}`);
    if (views && s <= 2) {
      const g = { ...r.grid, log: [] as number[], epoch: 0 } as any;
      rows.push(planView(g, r.palette).plan, elevationView(g, r.palette, 'front').text);
    }
  }
  console.log(`== ${f}\n${rows.join('\n')}`);
}
