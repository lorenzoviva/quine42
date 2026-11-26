// T510: the climates of a universe on disk and what its new places draw, without opening it in a browser and without writing anything:
//   npx vite-node lab/scripts/climi-bozze.ts -- universes/<nome> [--raggio 8]
// Its files as the browser takes them (`prepareUniverse`), a kernel on the local models: the climates its nature says or its theme gives
// (`natureOfUniverse`, ADR-0261), the codes of the climates it does not admit, the drafts of the new places of a square of places (a map:
// N many snow tiles, n some, j jungle, . none), the census of their codes, and the environments that write a climate it does not admit
// (offered to no new place). Plans in maps/ are not read: every place of the square is drafted as a new one.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { bundledFiles } from '../../src/kernel/bundle';
import { prepareUniverse } from '../../src/kernel/universes';
import { Kernel } from '../../src/kernel/kernel';
import { memoryStore } from '../../src/kernel/repo';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { climatesOf, offClimate } from '../../src/kernel/nature';

const args = process.argv.slice(2).filter((a) => a !== '--');
const dir = path.resolve(args[0] ?? '');
const at = args.indexOf('--raggio');
const R = at >= 0 ? Math.max(1, Math.min(30, Number(args[at + 1]) || 8)) : 8;
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: dir, encoding: 'utf8', maxBuffer: 1e9 }).split('\0').filter(Boolean);
const files: Record<string, string> = {};
for (const p of tracked) if (!p.startsWith('maps/') && !p.startsWith('.')) files[p] = await fs.readFile(path.join(dir, p), 'utf8');
const up = prepareUniverse(files, bundledFiles);
const k = await Kernel.boot({ files: up.files, store: memoryStore(), ai: new MockAiModels() });
const nature = k.nature();
const off = offClimate(nature);
console.log(`climi: ${climatesOf(nature).join(', ')}${nature.climates ? '' : ' (tutti)'}; codici fuori clima: ${[...off].map(([c, to]) => `${c} → ${to}`).join(', ') || 'nessuno'}`);
const total: Record<string, number> = {};
const rows: string[] = [];
for (let cy = -R; cy <= R; cy++) {
  let line = '';
  for (let cx = -R; cx <= R; cx++) {
    const d = k.placeDraft(cx, cy).join('');
    for (const c of d) total[c] = (total[c] ?? 0) + 1;
    const n = [...d].filter((c) => c === 'n').length;
    line += n > 30 ? 'N' : n ? 'n' : d.includes('j') ? 'j' : '.';
  }
  rows.push(line);
}
console.log(`bozze dei luoghi nuovi da ${-R},${-R} a ${R},${R}:\n${rows.join('\n')}`);
console.log(`codici: ${Object.entries(total).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${n}`).join(', ')}`);
const shut = Object.entries(k.content.layouts).filter(([, l]) => k.offClimateWrites(l.program).length);
console.log(`ambienti che non si offrono ai luoghi nuovi: ${shut.map(([id, l]) => `${id} («${l.name}»: ${k.offClimateWrites(l.program).join(', ')})`).join('; ') || 'nessuno'}`);
process.exit(0);
