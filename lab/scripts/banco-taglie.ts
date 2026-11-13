// The bench of the structures that fit their size (T338, T346, T354, lab/banco/taglie/README.md): what the parts one lives in measure
// (doors, storeys, rooms: `habitableParts`), what a structure contains (`compositionOf`), the areas its ground marks (`areasOf`) at three
// sizes, with the checks of the kernel (`partErrors`, `varietyError`, `checkProgram` with the seed's parts included), the regularity
// of the battlements, that no animal is drawn, the time and the photos from four sides; the seed's parts alone (`--parti`); and the
// programs written by hand as the Sculptor writes them from the prompt without a skeleton (T354: the country house the local models answer
// with, `MOCK_STRUCTURE_PROGRAM`, and the fort `scultore-rocca.xml`), with the views in text the Sculptor gets back (`--viste`).
//
//   npx vite-node lab/scripts/banco-taglie.ts -- --misura [--semi 2]                 # the seed's structures and the offline answer, at their boxes
//   npx vite-node lab/scripts/banco-taglie.ts -- --parti [--foto]                     # part-stair, part-door, part-battlements, part-slits alone
//   npx vite-node lab/scripts/banco-taglie.ts -- [--semi 2] [--solo fattoria,forte,scultore-villetta,scultore-rocca] [--foto] [--viste] [--json lab/banco/taglie/misure.json]
//   npx vite-node lab/scripts/banco-taglie.ts -- --venti [--solo fattoria] [--foto]   # the same programs at 20 × 20 tiles (400 × 400 × 160), past the Gargantuan box of today (T356)

import fs from 'node:fs';
import path from 'node:path';
import { classOf, SIZE_TIERS, tilesOf, voxelsOf, type SizeTier } from '../../src/mj/classes';
import { analyse, varietyError, type Composition } from '../../src/mj/check';
import { animalLetters, giro, merlonRuns, riga, type Giro } from '../banco/taglie/misure';
import { compileMjx, mjxIncludes, type MjxFiles, type MjxModel } from '../../src/mj/model';
import { cartoonRender, render, sheet } from '../../src/mj/photo';
import { runMjx } from '../../src/mj/run';
import { areasOf } from '../../src/mj/areas';
import { vptOf, entryBox, habitableParts, type ModelInfo } from '../../src/kernel/forms';
import { checkProgram, planBlock, textViews } from '../../src/kernel/agents/sculptor';
import { MOCK_STRUCTURE_PROGRAM } from '../../src/kernel/ai/mockStructure';
import { modelErrors } from '../../src/kernel/validator';
import { png } from './png';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const SEMI = Number(opt('semi') ?? 2);
const DIR = path.resolve('lab/banco/taglie');
const STRUCTURE = classOf('structure')!;

/** The files of the seed's models/ a program reads (the parts, T346), as the game gives them to the compiler. */
const seedFiles = (xml: string): MjxFiles => mjxIncludes(xml, (f) => (fs.existsSync(`universe/models/${f}`) ? fs.readFileSync(`universe/models/${f}`, 'utf8') : undefined));

function misura(): void {
  const index = JSON.parse(fs.readFileSync('universe/models/index.json', 'utf8')) as Record<string, ModelInfo>;
  const ids = Object.keys(index).filter((id) => index[id].class === 'structure');
  const prog: Array<[string, string, ModelInfo]> = ids.map((id) => [id, fs.readFileSync(`universe/models/${id}.xml`, 'utf8'), index[id]]);
  // The offline answer of the Sculptor (T354): the country house written as the prompt without a skeleton asks.
  prog.push(['offline', MOCK_STRUCTURE_PROGRAM, { class: 'structure' } as ModelInfo]);
  for (const [id, xml, info] of prog) {
    const vpt = vptOf(info);
    const box = entryBox(STRUCTURE, info);
    let model: MjxModel;
    try {
      model = compileMjx(xml, { ...(/\ssize="/.test(xml.replace(/<!--[\s\S]*?-->/g, '').slice(0, 400)) ? {} : { size: box }), files: seedFiles(xml) });
    } catch (e) {
      console.log(`${id}: ${(e as Error).message}`);
      continue;
    }
    console.log(`${id} (vpt ${vpt})`);
    for (let s = 1; s <= SEMI; s++) console.log(`   ${riga(giro(model, vpt, s), vpt)}`);
  }
}

/** The seed's parts alone (T346): each in its own box, validated as the library does, measured where it can be, photographed. */
const PARTI: Array<{ id: string; box: [number, number, number] }> = [
  { id: 'part-stair', box: [60, 40, 72] },
  { id: 'part-door', box: [45, 8, 44] },
  { id: 'part-battlements', box: [33, 33, 40] },
  { id: 'part-slits', box: [33, 33, 40] },
];

function parti(): void {
  const lati = [];
  for (const p of PARTI) {
    const xml = fs.readFileSync(`universe/models/${p.id}.xml`, 'utf8');
    const m = compileMjx(xml, { files: seedFiles(xml) });
    const t0 = performance.now();
    const r = runMjx(m, 1, { deadline: 20_000 });
    const a = analyse(r, m.program.palette, { grounded: true });
    const note: string[] = [];
    if (p.id === 'part-stair') {
      const h = habitableParts(r.grid, m.program.palette, 20, 30, 0, m.actions, 1);
      note.push(`piani ${h.storeys.join(',')}, porte ${h.doors.map((d) => `${d.width}×${d.height}`).join(' ')}`);
    }
    if (p.id === 'part-battlements' || p.id === 'part-slits') note.push(`merli per lunghezza ${JSON.stringify(merlonRuns(r.grid, 'M'))}`);
    if (p.id === 'part-slits') note.push(`feritoie ${a.colors.U ?? 0} voxel`);
    console.log(`${p.id}: ${Math.round(performance.now() - t0)} ms, ${a.voxels} voxel, validatore: ${modelErrors(`models/${p.id}.xml`, xml).join('; ') || 'passa'}${m.warnings.length ? `, avvisi: ${m.warnings.join('; ')}` : ''}${note.length ? ` · ${note.join(' · ')}` : ''}`);
    if (args.includes('--foto')) for (const v of [0, 1, 2, 3]) lati.push(render(r.grid, m.program.palette, v, cartoonRender(4)));
  }
  if (args.includes('--foto')) {
    fs.writeFileSync(path.join(DIR, 'parti.png'), png(sheet(lati, 1, 8, [112, 150, 84])));
    console.log('foto: parti.png');
  }
}

/** The programs of the bench, at the three sizes a structure that grows by rules has (Large, Huge, Gargantuan): a file, or the text itself. */
const BANCHI: Array<{ id: string; file?: string; xml?: string; merli?: string }> = [
  { id: 'fattoria', file: 'lab/banco/taglie/fattoria.xml' },
  { id: 'forte', file: 'lab/banco/taglie/forte.xml', merli: 'M' },
  // As the Sculptor writes them from the prompt without a skeleton (T354): the plan at a fifth, the parts included.
  { id: 'scultore-villetta', xml: MOCK_STRUCTURE_PROGRAM },
  { id: 'scultore-rocca', file: 'lab/banco/taglie/scultore-rocca.xml', merli: 'M' },
];
const TAGLIE: SizeTier[] = ['large', 'huge', 'gargantuan'];

function banco(): void {
  const solo = opt('solo')?.split(',');
  const out: Record<string, unknown> = {};
  fs.mkdirSync(DIR, { recursive: true });
  for (const b of BANCHI.filter((x) => !solo || solo.includes(x.id))) {
    const xml = b.xml ?? fs.readFileSync(b.file!, 'utf8');
    const files = seedFiles(xml);
    const righe: Record<string, unknown> = {};
    const prima: Record<string, Composition> = {};
    const foto = [];
    for (const t of TAGLIE) {
      const box = voxelsOf(tilesOf(STRUCTURE, t), 20);
      const model = compileMjx(xml, { size: box, files });
      if (model.warnings.length) console.log(`   avvisi: ${model.warnings.join('; ')}`);
      const giri = Array.from({ length: SEMI }, (_, i) => giro(model, 20, i + 1));
      console.log(`${b.id} · ${t} (${tilesOf(STRUCTURE, t).slice(0, 2).join(' × ')} caselle, ${box.join('×')}; include ${Object.keys(files).join(', ') || 'niente'})`);
      for (const g of giri) console.log(`   ${riga(g, 20)}`);
      const animali = animalLetters(model.program.palette);
      console.log(`   animali: ${animali.length ? `✗ ${animali.join(' ')}` : 'nessuno'}`);
      if (b.merli) console.log(`   merli per lunghezza: ${JSON.stringify(merlonRuns(giri[0].grid, b.merli))}`);
      prima[t] = giri[0].composizione;
      righe[t] = giri.map(({ grid: _g, ...g }) => g);
      if (args.includes('--foto')) {
        const g = giri[0].grid;
        const scala = Math.max(1, Math.round(240 / box[0]));
        const lati = [0, 1, 2, 3].map((v) => render(g, model.program.palette, v, cartoonRender(scala)));
        fs.writeFileSync(path.join(DIR, `${b.id}-${t}.png`), png(sheet(lati, 1, 8, [112, 150, 84])));
        foto.push(`${b.id}-${t}.png`);
        // The areas of the first seed, as a map of tiles (a letter an area).
        const aree = areasOf(g, model.program.palette, 20);
        const names = Object.keys(aree);
        const tx = Math.ceil(g.X / 20), ty = Math.ceil(g.Y / 20);
        const mappa = Array.from({ length: ty }, () => Array(tx).fill('.'));
        for (const [i, name] of names.entries()) for (const [x, y] of aree[name]) mappa[y][x] = name[0].toUpperCase() === name[0] ? name[0] : String.fromCharCode(97 + i);
        console.log(`   aree (${names.map((n, i) => `${String.fromCharCode(97 + i)} ${n}`).join(', ')}):\n      ${mappa.map((r) => r.join('')).join('\n      ')}`);
      }
    }
    // Past today's Gargantuan box (T356): the same program at 20 × 20 tiles, what a lot of several places would hold; seed 1, photo and areas.
    if (args.includes('--venti')) {
      const box: [number, number, number] = [400, 400, 160];
      const model = compileMjx(xml, { size: box, files });
      const g = giro(model, 20, 1);
      console.log(`${b.id} · 20 × 20 caselle (${box.join('×')})`);
      console.log(`   ${riga(g, 20)}`);
      righe['gargantuan-20'] = [(({ grid: _g, ...rest }) => rest)(g)];
      if (args.includes('--foto')) {
        const lati = [0, 1, 2, 3].map((v) => render(g.grid, model.program.palette, v, cartoonRender(1)));
        fs.writeFileSync(path.join(DIR, `${b.id}-gargantuan-20.png`), png(sheet(lati, 1, 8, [112, 150, 84])));
        foto.push(`${b.id}-gargantuan-20.png`);
      }
    }
    for (let i = 1; i < TAGLIE.length; i++) {
      const e = varietyError(prima[TAGLIE[i - 1]], prima[TAGLIE[i]], SIZE_TIERS.find((s) => s.id === TAGLIE[i - 1])!.name, SIZE_TIERS.find((s) => s.id === TAGLIE[i])!.name);
      console.log(`   varietà ${TAGLIE[i - 1]} → ${TAGLIE[i]}: ${e ?? 'cresce'}`);
    }
    // The kernel's own check, as the Sculptor's program would have it at its size (Large: 4 seeds, and Huge), with the seed's parts.
    const t0 = performance.now();
    const c = checkProgram(xml.replace(/\ssize="[^"]*"/, ''), STRUCTURE, 'large', files);
    console.log(`   checkProgram (grande, ${Math.round(performance.now() - t0)} ms): ${c.error ?? 'passa'}`);
    // What the Sculptor gets back (T354): the plans of the first block (the program without its second map) and the views of the whole.
    if (args.includes('--viste')) {
      const at = xml.search(/<map scale="\d+ \d+ \d+"/);
      const end = xml.lastIndexOf('</map>');
      const plan = at >= 0 && end > at ? xml.slice(0, at) + xml.slice(end) : undefined;
      if (plan) {
        const made = planBlock(plan, STRUCTURE, 'large', files);
        console.log(`   il ritorno del primo blocco (${Math.round(made.text.length / 3.5)} token stimati)${made.error ? `: ${made.error}` : ''}:\n${made.text.split('\n').map((l) => `      ${l}`).join('\n')}`);
      }
      const v = textViews(c);
      console.log(`   le viste del programma intero (${Math.round(v.length / 3.5)} token stimati):\n${v.split('\n').map((l) => `      ${l}`).join('\n')}`);
    }
    out[b.id] = { taglie: righe, controllo: c.error ?? 'passa', foto, aree: Object.fromEntries(TAGLIE.map((t) => [t, (righe[t] as Giro[])[0].aree])) };
  }
  const json = opt('json');
  if (json) fs.writeFileSync(json, JSON.stringify(out, null, 1));
}

if (args.includes('--misura')) misura();
else if (args.includes('--parti')) parti();
else banco();
