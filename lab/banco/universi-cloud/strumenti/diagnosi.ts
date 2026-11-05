// What a model draws, seed by seed: voxels per letter, and where the detached pieces are (their box), to mend a program by hand.
//   npx vite-node lab/banco/universi-cloud/strumenti/diagnosi.ts -- <id> [semi]
import { readFileSync } from 'node:fs';
import { compileMjx } from '../../../../src/mj/model';
import { FORM_LIMITS, runMjx } from '../../../../src/mj/run';
import { AIR } from '../../../../src/mj/engine';
import { RADICE } from './carica';

const [id, n = '3'] = process.argv.slice(2).filter((a) => a !== '--');
const xml = readFileSync(`${RADICE}orichalcum/models/${id}.xml`, 'utf8');
for (let seed = 1; seed <= Number(n); seed++) {
  const m = compileMjx(xml);
  const r = runMjx(m, seed, { limits: FORM_LIMITS, deadline: 8000 });
  const g = r.grid, pal = m.program.palette;
  const vis = g.alphabet.map((c) => c !== AIR && !!pal[c]?.color && !pal[c]?.hidden);
  const count: Record<string, number> = {};
  g.cells.forEach((v) => v && (count[g.alphabet[v]] = (count[g.alphabet[v]] ?? 0) + 1));
  // pieces (26-neighbourhood) of the visible voxels
  const XY = g.X * g.Y, seen = new Uint8Array(g.cells.length), pieces: string[] = [];
  for (let i = 0; i < g.cells.length; i++) {
    if (!vis[g.cells[i]] || seen[i]) continue;
    const st = [i]; seen[i] = 1; let size = 0; const lo = [1e9, 1e9, 1e9], hi = [-1, -1, -1]; const letters = new Set<string>();
    while (st.length) {
      const c = st.pop()!; size++; const p = [c % g.X, Math.floor(c / g.X) % g.Y, Math.floor(c / XY)]; letters.add(g.alphabet[g.cells[c]]);
      for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], p[a]); hi[a] = Math.max(hi[a], p[a]); }
      for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const x = p[0] + dx, y = p[1] + dy, z = p[2] + dz;
        if (x < 0 || y < 0 || z < 0 || x >= g.X || y >= g.Y || z >= g.Z) continue;
        const q = x + y * g.X + z * XY; if (vis[g.cells[q]] && !seen[q]) { seen[q] = 1; st.push(q); }
      }
    }
    pieces.push(`${size} [${lo.join(',')}..${hi.join(',')}] ${[...letters].join('')}`);
  }
  console.log(`seme ${seed}: ${r.finished ? 'finito' : 'NON finito'} ${r.steps} passi`, JSON.stringify(count), '\n  pezzi:', pieces.join(' | '));
}
