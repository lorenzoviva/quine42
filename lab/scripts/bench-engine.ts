// How long the MarkovJunior engine takes on the bench's large buildings (D33, T258): a few programs, five seeds, Grande and Enorme.
// The time of the program alone (no measures), with a long deadline, and a hash of the grid so that two versions of the engine
// can be compared voxel by voxel. With `--giudica` also the threshold of the bench (`giudica`) with the game's own time.
//
//   npx vite-node lab/scripts/bench-engine.ts -- [--semi 5] [--taglie grande,enorme] [--solo cantina,locanda-1] [--giudica] [--json out.json] [--profilo]
//
// `--profilo` adds, per program, the leaf nodes that took longest (milliseconds per node, from a watched run).

import fs from 'node:fs';
import { createHash } from 'node:crypto';
import type { SizeTier } from '../../src/mj/classes';
import { bersaglio } from '../banco/bersagli';
import { esegui, giudica, misura, type Bersaglio } from '../banco/misure';
import { withSize } from '../../src/kernel/agents/sculptor';
import { compileMjx } from '../../src/mj/model';
import { run, type Node3, type RunWatch } from '../../src/mj/engine';
import { FORM_LIMITS } from '../../src/mj/run';
import { scatolaDi } from '../banco/misure';
import { Forms, FormCache, InlineRunner } from '../../src/kernel/forms';
import { modelSize } from '../../src/kernel/modeldirector';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);

export const PROGRAMMI: Array<{ nome: string; file: string; bersaglio: string }> = [
  { nome: 'cantina', file: 'lab/banco/riferimento/cantina.xml', bersaglio: 'locanda' },
  { nome: 'locanda-1', file: 'lab/banco/suolo/locanda/1/seconda/modello.xml', bersaglio: 'locanda' },
  { nome: 'locanda-2', file: 'lab/banco/suolo/locanda/2/seconda/modello.xml', bersaglio: 'locanda' },
  { nome: 'palazzina', file: 'lab/banco/riferimento/palazzina.xml', bersaglio: 'moderna' },
  { nome: 'forte', file: 'lab/banco/riferimento/forte.xml', bersaglio: 'rocca' },
  { nome: 'tempio', file: 'lab/banco/riferimento/tempio.xml', bersaglio: 'tempio' },
];

const semi = Number(opt('semi') ?? 5);
const taglie = (opt('taglie') ?? 'grande,enorme').split(',') as SizeTier[];
const solo = opt('solo')?.split(',');
const conGiudizio = args.includes('--giudica');
const profilo = args.includes('--profilo');

const hashOf = (cells: Uint8Array, alphabet: string[], dims: number[]) => createHash('sha1').update(dims.join('x')).update(alphabet.join('')).update(cells).digest('hex').slice(0, 12);

/** The program as the bench runs it at this size: the class's box, its cellar. */
function compiled(xml: string, b: Bersaglio, seme: number) {
  const scatola = scatolaDi(b);
  const scritto = withSize(xml, scatola.box);
  const info = { classe: b.classe, ...modelSize(b), ...(b.sotto ? { sotto: b.sotto } : {}) };
  const forms = new Forms(new InlineRunner(new FormCache()));
  forms.load({ 'models/prova.xml': scritto, 'models/index.json': JSON.stringify({ prova: info }) });
  const q = forms.request('prova', seme)!;
  return compileMjx(q.xml, { ...(q.size ? { size: q.size } : {}), ...(q.base ? { base: q.base } : {}) });
}

interface Riga {
  nome: string;
  taglia: SizeTier;
  box: string;
  ms: number[];
  finiti: number;
  hash: string[];
  passano?: number;
  cadute?: string[];
  nodi?: Array<{ nodo: string; ms: number; passi: number }>;
}

const righe: Riga[] = [];
for (const p of PROGRAMMI) {
  if (solo && !solo.includes(p.nome)) continue;
  const xml = fs.readFileSync(p.file, 'utf8');
  for (const taglia of taglie) {
    const b: Bersaglio = { ...bersaglio(p.bersaglio)!, taglia };
    const riga: Riga = { nome: p.nome, taglia, box: '', ms: [], finiti: 0, hash: [] };
    let cadute = new Set<string>();
    let passano = 0;
    for (let seme = 1; seme <= semi; seme++) {
      const model = compiled(xml, b, seme);
      const t0 = performance.now();
      const r = run(model.program, seme, 5_000_000, FORM_LIMITS, { deadline: 60_000 });
      const ms = performance.now() - t0;
      riga.box = `${r.grid.X}×${r.grid.Y}×${r.grid.Z}`;
      riga.ms.push(Math.round(ms));
      if (r.finished) riga.finiti++;
      riga.hash.push(hashOf(r.grid.cells, r.grid.alphabet, [r.grid.X, r.grid.Y, r.grid.Z]));
      if (conGiudizio) {
        const e = esegui(xml, b, seme);
        const d = giudica(misura(e, b), e.scatola).difetti;
        if (!d.length) passano++;
        for (const x of d) cadute.add(x.split(':')[0]);
      }
      if (profilo && seme === 1) {
        const tempi = new Map<Node3, { ms: number; passi: number }>();
        let last = performance.now();
        const watch: RunWatch = {
          start() { last = performance.now(); },
          step(s) {
            const now = performance.now();
            const t = tempi.get(s.node) ?? { ms: 0, passi: 0 };
            t.ms += now - last;
            t.passi++;
            tempi.set(s.node, t);
            last = now;
          },
        };
        run(model.program, seme, 5_000_000, FORM_LIMITS, { deadline: 60_000, watch });
        riga.nodi = [...tempi.entries()]
          .sort((a, b) => b[1].ms - a[1].ms)
          .slice(0, 8)
          .map(([n, t]) => ({ nodo: `${n.type} ${'rules' in n && n.rules?.[0] ? `${(n.rules[0] as { in: string }).in.slice(0, 40)} → ${(n.rules[0] as { out: string }).out.slice(0, 40)}` : ''}`, ms: Math.round(t.ms), passi: t.passi }));
      }
    }
    if (conGiudizio) {
      riga.passano = passano;
      riga.cadute = [...cadute];
    }
    righe.push(riga);
    const media = riga.ms.reduce((s, v) => s + v, 0) / riga.ms.length;
    console.log(`${p.nome.padEnd(10)} ${taglia.padEnd(7)} ${riga.box.padEnd(12)} media ${(media / 1000).toFixed(2)} s · max ${(Math.max(...riga.ms) / 1000).toFixed(2)} s · [${riga.ms.join(', ')}] · finiti ${riga.finiti}/${semi}${conGiudizio ? ` · giudica ${passano}/${semi}${cadute.size ? ` (${[...cadute].join(', ')})` : ''}` : ''}`);
    if (riga.nodi) for (const n of riga.nodi) console.log(`    ${String(n.ms).padStart(6)} ms ${String(n.passi).padStart(6)} passi  ${n.nodo}`);
  }
}

const out = opt('json');
if (out) fs.writeFileSync(out, JSON.stringify(righe, null, 2));
