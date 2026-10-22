// Re-mends the catalogues saved by a run (no calls): npx vite-node lab/scripts/recheck.ts -- lab/out/<run>/<x>.blocchi.json
import fs from 'node:fs';
import { mendBlockset, unclosable } from '../mj3d/structure';

const file = process.argv.slice(2).find((a) => a.endsWith('.json'))!;
const b = JSON.parse(fs.readFileSync(file, 'utf8'));
for (const a of b.attempts.filter((x: any) => x.phase === 'catalogo')) {
  const notes: string[] = [];
  const j = JSON.parse(a.raw.replace(/^\s*```json|```\s*$/g, ''));
  // As in the catalogue phase: no programs yet.
  for (const x of j.blocks ?? []) x.program = { palette: {}, program: { type: 'sequence', children: [{ type: 'shape', shape: 'box', at: [9.5, 9.5, 0], size: [1, 1, 1], color: '.' }] } };
  const set = mendBlockset(j, notes);
  const dead = set ? unclosable(set) : [];
  console.log(`${set?.blocks.length ?? 0} blocchi; senza chiusura: ${dead.map((d) => `${d.code}(${set!.blocks.find((x) => x.code === d.code)?.alias ?? d.code}) ${d.name}`).join(', ') || 'nessuno'}`);
  console.log('  ' + notes.filter((n) => !n.includes('diventa')).slice(0, 6).join(' | '));
}
