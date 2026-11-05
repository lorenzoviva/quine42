// The fingerprint of every program the engine runs (T258, D33): models of the seed in their game box, the reference programs of the
// bench at Grande and Enorme, and their actions and animations. Two versions of `src/mj/engine.ts` must give the same hashes, voxel by
// voxel: the test `tests/mj-engine-determinism.test.ts` compares them with `tests/fixtures/mj-engine-hashes.json`.
//
//   npx vite-node lab/scripts/mj-hashes.ts -- --scrivi    # rewrites the fixture (only with the engine one trusts)

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { withSize } from '../../src/kernel/agents/sculptor';
import { FormCache, Forms, InlineRunner } from '../../src/kernel/forms';
import { modelSize } from '../../src/kernel/modeldirector';
import { Mj3Error, type Grid3 } from '../../src/mj/engine';
import { compileMjx } from '../../src/mj/model';
import { act, clipFrames, FORM_LIMITS, runMjx } from '../../src/mj/run';
import { bersaglio } from '../banco/bersagli';
import { scatolaDi, type Bersaglio } from '../banco/misure';

export const FIXTURE = 'tests/fixtures/mj-engine-hashes.json';

const ROOT = path.resolve(__dirname, '../..');
const hashGrid = (g: Grid3) => createHash('sha1').update(`${g.X}x${g.Y}x${g.Z}|${g.alphabet.join('')}|`).update(g.cells).digest('hex').slice(0, 16);
const copy = (g: Grid3): Grid3 => ({ ...g, cells: new Uint8Array(g.cells), alphabet: [...g.alphabet], log: [], epoch: 0 });

/** One program, compiled as the library asks for it, run to the end (no deadline: the step budget only), with its clips. */
function entry(xml: string, size: [number, number, number] | undefined, base: number | undefined, seed: number): string {
  let model;
  try {
    model = compileMjx(xml, { ...(size ? { size } : {}), ...(base ? { base } : {}) });
  } catch (e) {
    if (e instanceof Mj3Error) return `errore: ${e.message}`;
    throw e;
  }
  let r;
  try {
    r = runMjx(model, seed, { deadline: 600_000, limits: FORM_LIMITS, maxSteps: 2_000_000 });
  } catch (e) {
    if (e instanceof Mj3Error) return `errore: ${e.message}`;
    throw e;
  }
  const parts = [`${hashGrid(r.grid)} ${r.steps}${r.finished ? '' : ' troncato'}`, ...(r.unused?.length ? [`inutili ${createHash('sha1').update(r.unused.join('\n')).digest('hex').slice(0, 8)}`] : [])];
  for (const clip of model.actions) {
    const g = copy(r.grid);
    const a = act(g, clip, seed);
    parts.push(`${clip.name} ${hashGrid(g)} ${a.steps}`);
  }
  for (const clip of model.animations) parts.push(`${clip.name} ${clipFrames(r.grid, clip, seed).map(hashGrid).join(',')}`);
  return parts.join(' · ');
}

export interface Voce {
  nome: string;
  run: () => string;
}

/** Every program of the seed and of the bench's references, with the seeds tried. */
export function voci(semi = [1, 2]): Voce[] {
  const out: Voce[] = [];
  const dir = path.join(ROOT, 'universe/models');
  const index = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'));
  const files: Record<string, string> = { 'models/index.json': JSON.stringify(index) };
  const ids = fs.readdirSync(dir).filter((f) => f.endsWith('.xml')).map((f) => f.slice(0, -4)).sort();
  for (const id of ids) files[`models/${id}.xml`] = fs.readFileSync(path.join(dir, `${id}.xml`), 'utf8');
  const forms = new Forms(new InlineRunner(new FormCache()));
  forms.load(files);
  for (const id of ids)
    for (const seme of semi)
      out.push({
        nome: `universe/${id}#${seme}`,
        run: () => {
          const q = forms.request(id, seme)!;
          return entry(q.xml, q.size, q.base, seme);
        },
      });
  const refs: Array<[string, string]> = [
    ['riferimento/cantiere', 'moderna'], ['riferimento/cantina', 'locanda'], ['riferimento/forte', 'rocca'], ['riferimento/palazzina', 'moderna'], ['riferimento/tempio', 'tempio'],
    ['suolo/locanda/1/seconda/modello', 'locanda'], ['suolo/locanda/2/seconda/modello', 'locanda'],
  ];
  for (const [file, id] of refs)
    for (const taglia of ['grande', 'enorme'] as const)
      for (const seme of semi.slice(0, 1))
        out.push({
          nome: `${file}@${taglia}#${seme}`,
          run: () => {
            const b: Bersaglio = { ...bersaglio(id)!, taglia };
            const s = scatolaDi(b);
            const scritto = withSize(fs.readFileSync(path.join(ROOT, `lab/banco/${file}.xml`), 'utf8'), s.box);
            const info = { classe: b.classe, ...modelSize(b), ...(b.sotto ? { sotto: b.sotto } : {}) };
            const f = new Forms(new InlineRunner(new FormCache()));
            f.load({ 'models/prova.xml': scritto, 'models/index.json': JSON.stringify({ prova: info }) });
            const q = f.request('prova', seme)!;
            return entry(q.xml, q.size, q.base, seme);
          },
        });
  return out;
}

if (process.argv.includes('--scrivi')) {
  const t0 = Date.now();
  const res: Record<string, string> = {};
  for (const v of voci()) {
    const t = Date.now();
    res[v.nome] = v.run();
    console.log(`${v.nome} ${Date.now() - t} ms ${res[v.nome]}`);
  }
  fs.writeFileSync(path.join(ROOT, FIXTURE), JSON.stringify(res, null, 1) + '\n');
  console.log(`${Object.keys(res).length} voci in ${Date.now() - t0} ms`);
}
