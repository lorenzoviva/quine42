import { readFileSync } from 'node:fs';
import { withSize } from '../../../src/kernel/agents/sculptor';
import { boxOf, classOf } from '../../../src/mj/classes';
import { compileMjx } from '../../../src/mj/model';
import { runMjx } from '../../../src/mj/run';
const [file, cls, seed] = process.argv.slice(2).filter((a) => a !== '--');
const box = boxOf(classOf(cls)!);
const m = compileMjx(withSize(readFileSync(file, 'utf8'), box), { size: box });
const g = runMjx(m, +seed).grid;
const pal = m.program.palette;
const vis = g.alphabet.map((c) => c !== 'B' && !!pal[c]?.color && !pal[c]?.hidden);
const XY = g.X * g.Y, seen = new Int32Array(g.cells.length);
let id = 0; const parts: any[] = [];
for (let i = 0; i < g.cells.length; i++) {
  if (!vis[g.cells[i]] || seen[i]) continue;
  id++; const st = [i]; seen[i] = id; const cells: number[] = [];
  while (st.length) { const c = st.pop()!; cells.push(c); const x = c % g.X, y = Math.floor(c / g.X) % g.Y, z = Math.floor(c / XY);
    for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy, nz = z + dz; if (nx < 0 || ny < 0 || nz < 0 || nx >= g.X || ny >= g.Y || nz >= g.Z) continue; const n = nx + ny * g.X + nz * XY; if (vis[g.cells[n]] && !seen[n]) { seen[n] = id; st.push(n); } } }
  parts.push({ n: cells.length, at: cells.slice(0, 4).map((c) => [c % g.X, Math.floor(c / g.X) % g.Y, Math.floor(c / XY), g.alphabet[g.cells[c]]].join(',')) });
}
console.log(parts.sort((a, b) => b.n - a.n).slice(0, 8));
if (process.argv.includes('--strati')) for (let z = 0; z < g.Z; z++) { const rows: string[] = []; for (let y = 0; y < g.Y; y++) { let r = ''; for (let x = 0; x < g.X; x++) r += g.alphabet[g.cells[x + y * g.X + z * XY]].replace('B', '.'); rows.push(r); } if (rows.some((r) => /[^.]/.test(r))) console.log(`z=${z}\n${rows.join('\n')}`); }
