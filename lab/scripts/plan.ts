// Prints the layout program's result, level by level (one character per tile), and what the collapse
// placed: to read a layout without rendering it.
// npx vite-node lab/scripts/plan.ts -- <rocca|cripta|castello|sotterraneo> [seed] [size]
import { buildBlocks, runLayout, type Blockset, type Layout } from '../mj3d/structure';
import { CASTELLO, CASTELLO_PIANTA } from '../programs/castello';
import { SOTTERRANEO, SOTTERRANEO_PIANTA } from '../programs/sotterraneo';
import { ROCCA, rocca } from '../programs/rocca';
import { CRIPTA, cripta } from '../programs/cripta';

const [name = 'rocca', seed = '1', size = '0'] = process.argv.slice(2).filter((a) => a !== '--');
const n = Number(size);
const all: Record<string, () => [Blockset, Layout]> = {
  castello: () => [CASTELLO, CASTELLO_PIANTA],
  sotterraneo: () => [SOTTERRANEO, SOTTERRANEO_PIANTA],
  rocca: () => [ROCCA, rocca(n ? [n, n, 3] : undefined)],
  cripta: () => [CRIPTA, cripta(n ? [n, n, 2] : undefined)],
};
const [set, layout] = all[name]();
const r = runLayout(layout, set, Number(seed), buildBlocks(set, 1).built);
const [X, Y, Z] = layout.size;
const at = new Map(r.placements.map((p) => [p.x + p.y * X + p.z * X * Y, p]));
for (let z = 0; z < Z; z++) {
  console.log(`livello ${z}: programma | blocchi posati`);
  for (let y = 0; y < Y; y++) {
    const row = (f: (i: number) => string) => Array.from({ length: X }, (_, x) => f(x + y * X + z * X * Y)).join('');
    console.log(`  ${row((i) => r.cells[i] || ' ')}   ${row((i) => at.get(i)?.code ?? '·')}`);
  }
}
console.log(r.mismatches.slice(0, 8).join('\n') || 'nessun problema');
