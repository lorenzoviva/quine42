// Renders a structure: its blocks (each from the front), the whole thing from four sides, a cut through
// each level, and the same after doing every action once (gate opened, bridge raised…). Structures with
// a detail program are shown after it ran (finish), and once more without it, to compare.
// Writes lab/out/strutture/<name>-*.png. With no argument, every hand-written structure.
// npx vite-node lab/scripts/structure.ts -- [castello|sotterraneo|rocca|cripta] [--seeds 3] [--size 24]

import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_RENDER, region, render, sheet } from '../mj3d/render';
import { act, buildBlocks, expand, finish, runLayout, type Blockset, type Layout } from '../mj3d/structure';
import { CASTELLO, CASTELLO_PIANTA } from '../programs/castello';
import { SOTTERRANEO, SOTTERRANEO_PIANTA } from '../programs/sotterraneo';
import { ROCCA, rocca } from '../programs/rocca';
import { CRIPTA, cripta } from '../programs/cripta';
import { png } from './png';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string, d: number) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? Number(args.splice(i, 2)[1]) : d;
};
const seeds = opt('seeds', 2);
const size = opt('size', 0);
const all: Record<string, () => [Blockset, Layout]> = {
  castello: () => [CASTELLO, CASTELLO_PIANTA],
  sotterraneo: () => [SOTTERRANEO, SOTTERRANEO_PIANTA],
  rocca: () => [ROCCA, rocca(size ? [size, size, 3] : undefined)],
  cripta: () => [CRIPTA, cripta(size ? [size, size, 2] : undefined)],
};
const names = args.filter((a) => !a.startsWith('--'));
const dir = path.resolve('lab/out/strutture');
fs.mkdirSync(dir, { recursive: true });
const GRASS: [number, number, number] = [112, 150, 84];

for (const name of names.length ? names : Object.keys(all)) {
  const [set, layout] = all[name]();
  const t0 = Date.now();
  const blocks = buildBlocks(set, 1);
  console.log(`${name}: ${set.blocks.length} blocchi`, blocks.errors.length ? `ERRORI ${blocks.errors.join(' | ')}` : 'ok', blocks.warnings.length ? `avvisi: ${blocks.warnings.join(' | ')}` : '');
  fs.writeFileSync(path.join(dir, `${name}-blocchi.png`), png(sheet([...blocks.built.values()].map((b) => render(b.grid, b.block.program.palette, 0, DEFAULT_RENDER)), 3, 4, GRASS)));
  for (let seed = 1; seed <= seeds; seed++) {
    const t1 = Date.now();
    const r = runLayout(layout, set, seed, blocks.built);
    console.log(`  seme ${seed}: ${r.placements.length} blocchi posati, ${r.steps} passi, wfc ${r.wfc?.ok ? 'ok' : 'NO'} (${r.wfc?.ms} ms), prese che non combaciano ${r.mismatches.length}${r.mismatches.length ? ` (${r.mismatches.slice(0, 3).join(' | ')})` : ''}, lati aperti ${r.open}, giunture storte ${r.seams.length}${r.seams.length ? ` (${r.seams.slice(0, 3).join(' | ')})` : ''}`);
    const e = finish(r, { seed });
    if (e.detail) console.log(`  dettaglio: ${'error' in e.detail && e.detail.error ? e.detail.error : `${(e.detail as { steps: number }).steps} passi, ${(e.detail as { ms: number }).ms} ms`}`);
    fs.writeFileSync(path.join(dir, `${name}-${seed}.png`), png(sheet([0, 1, 2, 3].map((v) => render(e.grid, e.palette, v, DEFAULT_RENDER)), 1, 6, GRASS)));
    if (seed === 1) {
      const front = render(e.grid, e.palette, 0, DEFAULT_RENDER);
      fs.writeFileSync(path.join(dir, `${name}-fronte.png`), png(sheet([front], 2, 6, GRASS)));
      // The middle of the front view, enlarged: the details.
      fs.writeFileSync(path.join(dir, `${name}-zoom.png`), png(sheet([region(front, front.w / 2 - 130, front.h / 2 - 90, 260, 180)], 4, 0, GRASS)));
      if (layout.detail) {
        const bare = expand(r.placements, layout.size, { seed, cells: r.cells, paint: layout.paint });
        fs.writeFileSync(path.join(dir, `${name}-senza-dettaglio.png`), png(sheet([render(bare.grid, bare.palette, 0, DEFAULT_RENDER)], 2, 6, GRASS)));
      }
      // A cut through each level, from the front.
      const cuts = Array.from({ length: layout.size[2] }, (_, k) => {
        const c = finish(r, { seed, cut: k + 1 });
        return render(c.grid, c.palette, 0, DEFAULT_RENDER);
      });
      fs.writeFileSync(path.join(dir, `${name}-livelli.png`), png(sheet(cuts, 1, 6, GRASS)));
      // Every action done once.
      let placed = r.placements;
      for (const p of r.placements) for (const a of p.block.actions ?? []) placed = act(set, placed, p, a);
      const done = finish({ ...r, placements: placed }, { seed });
      fs.writeFileSync(path.join(dir, `${name}-azioni.png`), png(sheet([render(e.grid, e.palette, 0, DEFAULT_RENDER), render(done.grid, done.palette, 0, DEFAULT_RENDER)], 1, 6, GRASS)));
    }
    console.log(`  ${e.grid.X}×${e.grid.Y}×${e.grid.Z} voxel, ${Date.now() - t1} ms`);
  }
  console.log(`  totale ${Date.now() - t0} ms`);
}
console.log('scritto in', dir);
