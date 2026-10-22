// Runs a hand-written layout with many seeds and counts what goes wrong (no rendering): the collapse
// that fails, sockets, seams, and how many of each block were placed.
// npx vite-node lab/scripts/seeds.ts -- <rocca|cripta> [seeds] [size]
import { buildBlocks, runLayout, type Blockset, type Layout } from '../mj3d/structure';
import { ROCCA, rocca } from '../programs/rocca';
import { CRIPTA, cripta } from '../programs/cripta';

const [name = 'rocca', count = '20', size = '0'] = process.argv.slice(2).filter((a) => a !== '--');
const n = Number(size);
const all: Record<string, () => [Blockset, Layout]> = { rocca: () => [ROCCA, rocca(n ? [n, n, 3] : undefined)], cripta: () => [CRIPTA, cripta(n ? [n, n, 2] : undefined)] };
const [set, layout] = all[name]();
const built = buildBlocks(set, 1).built;
const totals: Record<string, number> = {};
let bad = 0;
const t0 = Date.now();
for (let seed = 1; seed <= Number(count); seed++) {
  const r = runLayout(layout, set, seed, built, 2000);
  for (const p of r.placements) totals[p.block.code] = (totals[p.block.code] ?? 0) + 1;
  if (!r.wfc?.ok || r.mismatches.length || r.seams.length) {
    bad++;
    console.log(`seme ${seed}: wfc ${r.wfc?.ok ? 'ok' : 'NO'}, ${r.mismatches.slice(0, 3).join(' | ')} ${r.seams.slice(0, 2).join(' | ')}`);
  }
}
console.log(`${name} ${layout.size.join('×')}: ${Number(count) - bad}/${count} senza problemi, ${Date.now() - t0} ms; blocchi per seme: ${Object.entries(totals).map(([k, v]) => `${k} ${(v / Number(count)).toFixed(1)}`).join(', ')}`);
