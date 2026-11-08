// What the nodes of T333-T335 cost in the original's models, against the world's ceilings (T336, ADR-0176): for every model of
// lab/mjx/official/ that infers, collapses a wave or reads files, the static numbers (tries, search limit, files, depth of imports),
// the wave each wfc observes (cells and bytes) and the time of three seeds; then what the validator would say (`worldNodeErrors`).
//   npx vite-node lab/scripts/nodi-mondo.ts [-- --semi 3] [--json lab/banco/nodi/misure.json]

import fs from 'node:fs';
import path from 'node:path';
import { run, type NodeStep, type Node3 } from '../../src/mj/engine';
import { compileMjx, newNodesIn } from '../../src/mj/model';
import { waveBytes } from '../../src/mj/wfc';
import { WORLD_NODE_LIMITS, worldNodeErrors } from '../../src/kernel/validator';
import { OFFICIAL } from '../mjx/official/index';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (name: string, d: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : d;
};
const seeds = Number(opt('semi', '3'));
const out = opt('json', '');

interface Row {
  name: string;
  nodes: string[];
  files: number;
  chars: number;
  waveCells: number;
  waveMB: number;
  ms: number[];
  finished: boolean;
  world: string[];
}

const rows: Row[] = [];
for (const o of OFFICIAL) {
  const m = compileMjx(o.xml, { size: o.size, ...(o.files ? { files: o.files } : {}) });
  const nodes = newNodesIn(m);
  if (!nodes.length && !o.files) continue;
  let waveCells = 0, waveMB = 0, finished = true;
  const ms: number[] = [];
  for (let s = 1; s <= seeds; s++) {
    const t0 = Date.now();
    const r = run(m.program, s, o.steps ?? 5_000_000, { side: 512, cells: 24_000_000 }, {
      deadline: 30_000,
      watch: {
        start() {},
        step(st: NodeStep) {
          const n = st.node as Node3;
          if (n.type !== 'wfc') return;
          // The grid after a tile wfc is (S - overlap)·M + overlap per axis: the wave was on M.
          const [S, SY, SZ] = n.dims;
          const [ox, oy, oz] = n.overlap ?? [0, 0, 0];
          const cells = n.model === 'tile' ? ((st.grid.X - ox) / (S - ox)) * ((st.grid.Y - oy) / (SY - oy)) * ((st.grid.Z - oz) / (SZ - oz)) : st.grid.X * st.grid.Y * st.grid.Z;
          waveCells = Math.max(waveCells, cells);
          waveMB = Math.max(waveMB, waveBytes(cells, n.patterns.length, n.propagator.length, n.shannon === true) / 2 ** 20);
        },
      },
    });
    ms.push(Date.now() - t0);
    finished &&= r.finished;
  }
  const files = Object.values(o.files ?? {});
  rows.push({ name: o.name, nodes, files: files.length, chars: files.reduce((a, t) => a + t.length, 0), waveCells, waveMB: Math.round(waveMB * 10) / 10, ms, finished, world: worldNodeErrors(m, o.xml, o.files ?? {}) });
}

const line = (r: Row) =>
  `| ${r.name} | ${r.nodes.join(', ') || '—'} | ${r.files} (${r.chars}) | ${r.waveCells || '—'} | ${r.waveMB || '—'} | ${r.ms.join(' / ')}${r.finished ? '' : ' (non finisce)'} | ${r.world.length ? r.world.join('; ') : 'ammesso'} |`;
console.log(`Tetti del mondo: ${JSON.stringify(WORLD_NODE_LIMITS)}\n`);
console.log('| modello | nodi | file (caratteri) | celle dell\'onda | MB dell\'onda | ms per seme | nel mondo |\n|---|---|---|---|---|---|---|');
for (const r of rows) console.log(line(r));
if (out) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ limits: WORLD_NODE_LIMITS, rows }, null, 2) + '\n');
}
