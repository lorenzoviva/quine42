// Runs the kernel's checks on the blocks of a saved run, without any model: which blocks can never be
// part of a closed structure, and which zones of the layout can never touch.
// npx vite-node lab/scripts/check-catalogue.ts -- <run> <nome-struttura>

import fs from 'node:fs';
import path from 'node:path';
import { buildBlocks, runLayout, unclosable } from '../mj3d/structure';
import { CASTELLO } from '../programs/castello';
import { SOTTERRANEO } from '../programs/sotterraneo';

const [run, base] = process.argv.slice(2).filter((a) => a !== '--');
for (const [name, set] of [['castello (a mano)', CASTELLO], ['sotterraneo (a mano)', SOTTERRANEO]] as const) console.log(`${name}: non chiudibili ${JSON.stringify(unclosable(set))}`);
if (run && base) {
  const dir = path.resolve('lab/out', run);
  const b = JSON.parse(fs.readFileSync(path.join(dir, `${base}.blocchi.json`), 'utf8'));
  console.log(`${base}, solo le prese: non chiudibili ${unclosable(b.set).map((x) => `${x.code} ${x.name}`).join(', ') || 'nessuno'}`);
  const built = buildBlocks(b.set, 1).built;
  console.log(`${base}, con i voxel: non chiudibili ${unclosable(b.set, built).map((x) => `${x.code} ${x.name}`).join(', ') || 'nessuno'}`);
  const p = JSON.parse(fs.readFileSync(path.join(dir, `${base}.pianta.json`), 'utf8'));
  const r = runLayout(p.layout, b.set, 1, built, 5000);
  console.log(`pianta: ${r.mismatches.filter((m) => m.includes('non può avere')).slice(0, 8).join('\n  ')}`);
}
