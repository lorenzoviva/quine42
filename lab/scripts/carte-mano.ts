// What the seed's programs cost on the real engine, against the caps of a handmade card (T293, ADR-0161, src/kernel/handmade.ts): the
// measure the caps come from, again. No browser, no model is called.
//
//   npx vite-node lab/scripts/carte-mano.ts [-- --tutti]
//
// For every program of universe/models (with --tutti also lab/mjx/models/handmade, as `object`): the largest grid, steps and time of a run
// over the seeds of its class, of a clip, of a sound's analysis, and whether `handmadeProgramErrors` lets it be a card. Exit code 1 if a
// program of the seed that the Musician's validator would take does not fit the caps: they must hold what the game already makes.

import fs from 'node:fs';
import path from 'node:path';
import { boxOf, classOf } from '../../src/mj/classes';
import { runOn, type Grid3 } from '../../src/mj/engine';
import { compileMjx } from '../../src/mj/model';
import { runMjx, FORM_LIMITS } from '../../src/mj/run';
import { classSeeds, rootTag } from '../../src/kernel/forms';
import { handmadeProgramErrors, HANDMADE_LIMITS } from '../../src/kernel/handmade';
import { modelErrors } from '../../src/kernel/validator';
import { SOUND_CLASS } from '../../src/mj/sound';

interface Row {
  id: string;
  kind: 'model' | 'sound';
  chars: number;
  cells?: number;
  side?: number;
  steps?: number;
  runMs?: number;
  clipMs?: number;
  checkMs: number;
  card: string;
}

const copy = (g: Grid3): Grid3 => ({ ...g, cells: new Uint8Array(g.cells), alphabet: [...g.alphabet], log: [], epoch: 0 });

function measure(id: string, xml: string, cls: string, size?: string): Row {
  const t = Date.now();
  if (cls === SOUND_CLASS) {
    const errors = handmadeProgramErrors({ kind: 'sound', xml });
    return { id, kind: 'sound', chars: xml.length, checkMs: Date.now() - t, card: errors[0] ?? 'sì' };
  }
  const errors = handmadeProgramErrors({ kind: 'model', xml, class: cls, ...(size ? { size } : {}) });
  const checkMs = Date.now() - t;
  const row: Row = { id, kind: 'model', chars: xml.length, checkMs, card: errors[0] ?? 'sì' };
  try {
    const box = /\ssize="/.test(rootTag(xml)) ? undefined : boxOf(classOf(cls)!, size);
    const m = compileMjx(xml, box ? { size: box } : {});
    let first: Grid3 | undefined;
    for (let seed = 1; seed <= classSeeds(cls); seed++) {
      const r = runMjx(m, seed, { deadline: 30_000, limits: FORM_LIMITS });
      row.cells = Math.max(row.cells ?? 0, r.grid.X * r.grid.Y * r.grid.Z);
      row.side = Math.max(row.side ?? 0, r.grid.X, r.grid.Y, r.grid.Z);
      row.steps = Math.max(row.steps ?? 0, r.steps);
      row.runMs = Math.max(row.runMs ?? 0, r.ms);
      first ??= r.grid;
    }
    let clip = 0;
    for (const a of m.actions) {
      const s = Date.now();
      runOn(copy(first!), a.program, 1, 200_000, FORM_LIMITS, { deadline: 2_000 });
      clip = Math.max(clip, Date.now() - s);
    }
    for (const a of m.animations) {
      let g = first!;
      for (let k = 1; k < a.frames; k++) {
        const next = copy(g);
        const s = Date.now();
        runOn(next, a.program, 31 + k, 200_000, FORM_LIMITS, { deadline: 2_000 });
        clip = Math.max(clip, Date.now() - s);
        g = next;
      }
    }
    row.clipMs = clip;
  } catch {
    /* what does not compile says it in `card` */
  }
  return row;
}

const all = process.argv.includes('--tutti');
const index = JSON.parse(fs.readFileSync('universe/models/index.json', 'utf8')) as Record<string, { class: string; size?: string }>;
const rows: Row[] = Object.entries(index).map(([id, info]) => measure(id, fs.readFileSync(`universe/models/${id}.xml`, 'utf8'), info.class, info.size));
const lab = 'lab/mjx/models/handmade';
if (all && fs.existsSync(lab)) for (const f of fs.readdirSync(lab).filter((f) => f.endsWith('.xml'))) rows.push(measure(`${lab}/${f}`, fs.readFileSync(path.join(lab, f), 'utf8'), 'object'));

const max = (k: keyof Row, kind?: Row['kind']) => Math.max(0, ...rows.filter((r) => !kind || r.kind === kind).map((r) => Number(r[k] ?? 0)));
const L = HANDMADE_LIMITS;
console.log('| misura | il più grande del seme | tetto di una carta |');
console.log('|---|---:|---:|');
console.log(`| caratteri del programma | ${max('chars')} | ${L.xmlChars} |`);
console.log(`| celle della griglia (map compresi) | ${max('cells', 'model')} | ${L.grid.cells} |`);
console.log(`| lato della griglia | ${max('side', 'model')} | ${L.grid.side} |`);
console.log(`| passi di un seme | ${max('steps', 'model')} | ${L.steps} |`);
console.log(`| ms di un seme | ${max('runMs', 'model')} | ${L.runMs} |`);
console.log(`| ms di un'azione o di un fotogramma | ${max('clipMs', 'model')} | ${L.clipMs} |`);
console.log(`| ms del controllo di un suono (tre semi) | ${max('checkMs', 'sound')} | ${L.soundMs} |`);
console.log(`| ms del controllo intero | ${max('checkMs')} | ${L.totalMs} |`);
const refused = rows.filter((r) => r.card !== 'sì');
console.log(`\n${rows.length - refused.length} programmi su ${rows.length} possono essere carte.`);
for (const r of refused) console.log(`- ${r.id}: ${r.card}`);
// A program of the seed the validator takes must fit: the caps hold what the game makes.
const wrong = refused.filter((r) => !r.id.includes('/') && modelErrors(`models/${r.id}.xml`, fs.readFileSync(`universe/models/${r.id}.xml`, 'utf8')).length === 0);
if (wrong.length) {
  console.log(`\nfuori dai tetti, e il validatore li prende: ${wrong.map((r) => r.id).join(', ')}`);
  process.exitCode = 1;
}
