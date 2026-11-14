// The game's Sculptor on Gemini with the prompt without a skeleton (T355, passo 3 di D48, ADR-0183): the fort and the farm asked as the
// ModelDirector asks a structure, through `sculpt` itself (the two blocks with the text views, the fixes, the Artist's vote and the revision),
// once at Large (3.8 Flash) and once at Huge (Argon, the important structures). Each program then runs at the three sizes and two seeds with
// the bench's measures (`lab/banco/taglie/misure.ts`), the kernel's check and photos. Every call is kept, with its cost.
//
//   npx vite-node lab/scripts/scultore-gemini.ts -- [--root ../../..] [--giro giro1] [--pensiero low|medium|high] [--scultore <modello>] [--solo forte,fattoria] [--taglie large,huge] [--tetto 8] [--out lab/banco/taglie/gemini]
//   npx vite-node lab/scripts/scultore-gemini.ts -- --misura [--out lab/banco/taglie/gemini]     # no call: measures and photographs the programs kept
//   npx vite-node lab/scripts/scultore-gemini.ts -- --concetti                                   # no call: concepts against seeds (T337), Gemini's and the hand-written
//
// → <out>/<giro>/<concetto>-<taglia>/{chiamate/<n>-<compito>.md, programma.xml, esito.json, <taglia del giro>.png}, <out>/<giro>/misure.json.
// The key is read from <root>/.env and sent only to Google; it is never printed nor written.

import fs from 'node:fs';
import path from 'node:path';
import { Kernel } from '../../src/kernel/kernel';
import { bundledFiles } from '../../src/kernel/bundle';
import { memoryStore } from '../../src/kernel/repo';
import { UsageLog, tallyLine, usd } from '../../src/kernel/ai/usage';
import type { AiModels, TextCall, Thinking } from '../../src/kernel/ai/models';
import { checkProgram, DEFAULT_SCULPTORS, sculpt, STRUCTURE_SEEDS, type SculptRequest } from '../../src/kernel/agents/sculptor';
import { structureModel } from '../../src/kernel/modeldirector';
import { classOf, SIZE_TIERS, tilesOf, voxelsOf, type SizeTier } from '../../src/mj/classes';
import { varietyError, type Composition } from '../../src/mj/check';
import { compileMjx, mjxIncludes, type MjxFiles } from '../../src/mj/model';
import { cartoonRender, render, sheet, type Picture } from '../../src/mj/photo';
import { animalLetters, giro, merlonRuns, riga } from '../banco/taglie/misure';
import { confronta, formaDi, type Gruppo } from '../banco/concetti';
import { MOCK_STRUCTURE_PROGRAM } from '../../src/kernel/ai/mockStructure';
import { runMjx } from '../../src/mj/run';
import { direct, readKey } from './gemini';
import { png } from './png';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const BASE = path.resolve(opt('out') ?? 'lab/banco/taglie/gemini');
/** A round is a folder: the same requests again, or with another thinking, side by side. */
const OUT = path.join(BASE, opt('giro') ?? 'giro1');
/** The thinking of the calls: the game's is `low` (`universe.json → ai`). */
const PENSIERO = (opt('pensiero') ?? 'low') as Thinking;
/** The model of the structures at every size, in place of the game's (3.8 Flash at Large, Argon from Huge): `--scultore gemini-4-argon`. */
const SCULTORE = opt('scultore');
const SCULTORI = SCULTORE ? { ...DEFAULT_SCULPTORS, structure: SCULTORE, important: SCULTORE } : DEFAULT_SCULPTORS;
const STRUCTURE = classOf('structure')!;
const TAGLIE: SizeTier[] = ['large', 'huge', 'gargantuan'];
const SEMI = Number(opt('semi') ?? 2);
/** Dollars at list price for the whole round: past it every call throws, and the Sculptor gives up as in the game. */
const TETTO = Number(opt('tetto') ?? 8);

/** As the ModelDirector words a structure (`modeldirector.ts`, the Cartographer's concept without a place). */
const CONCETTI = ['forte', 'fattoria'];
const request = (concept: string, taglia: SizeTier): SculptRequest => ({
  id: structureModel(concept, taglia),
  nome: concept,
  aspetto: `${concept}: a building one enters, with the door at the front`,
  classe: 'structure',
  taglia,
});

const seedFiles = (xml: string): MjxFiles => mjxIncludes(xml, (f) => (fs.existsSync(`universe/models/${f}`) ? fs.readFileSync(`universe/models/${f}`, 'utf8') : undefined));

/** Every call written down as it went: the task, the model, the prompt and the answer (the system once, it is the same). */
function logged(inner: AiModels, dir: string, ledger: UsageLog): AiModels {
  let n = 0;
  const calls = path.join(dir, 'chiamate');
  fs.mkdirSync(calls, { recursive: true });
  return {
    name: inner.name,
    get usage() { return inner.usage; },
    limits: inner.limits,
    textModel: inner.textModel,
    async text(call: TextCall) {
      const spent = ledger.total().usd;
      if (spent > TETTO) throw new Error(`tetto del giro: ${usd(spent)} oltre ${usd(TETTO)}`);
      const i = ++n;
      const file = path.join(calls, `${String(i).padStart(2, '0')}-${call.task}.md`);
      const sys = path.join(calls, `sistema-${call.agent}.md`);
      if (!fs.existsSync(sys)) fs.writeFileSync(sys, call.system);
      const t0 = Date.now();
      try {
        const out = await inner.text(call);
        fs.writeFileSync(file, `# ${call.task} · ${call.model ?? inner.textModel} · ${((Date.now() - t0) / 1000).toFixed(0)} s${call.images?.length ? ` · ${call.images.length} immagini` : ''}\n\n## Richiesta\n\n${call.prompt}\n\n## Risposta\n\n${out}\n`);
        return out;
      } catch (e) {
        fs.writeFileSync(file, `# ${call.task} · ${call.model ?? inner.textModel} · errore dopo ${((Date.now() - t0) / 1000).toFixed(0)} s\n\n## Richiesta\n\n${call.prompt}\n\n## Errore\n\n${(e as Error).message}\n`);
        throw e;
      }
    },
  };
}

interface Esito {
  concetto: string;
  taglia: SizeTier;
  modello?: string;
  voto?: number;
  chiamate: number;
  secondi: number;
  usd: number;
  token: { prompt: number; output: number; thoughts: number };
  perCompito: Array<{ model: string; task: string; calls: number; usd: number }>;
  errore?: string;
}

async function scolpisci(key: string, concept: string, taglia: SizeTier): Promise<Esito> {
  const dir = path.join(OUT, `${concept}-${taglia}`);
  fs.mkdirSync(dir, { recursive: true });
  const ledger = new UsageLog();
  // The game's models: the Sculptor's per call (`model` of the call), the thinking of `universe.json → ai`.
  const gemini = direct(DEFAULT_SCULPTORS.structure, key, ledger, { thinking: PENSIERO, timeout: 600_000, max: 40 });
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: logged(gemini, dir, ledger) });
  // The kernel gives every call of the Council its `ai.thinking` (T247): the round's goes there, not to the models.
  k.council.thinking = () => PENSIERO;
  const feed: string[] = [];
  k.council.onFeed = (e) => {
    const line = `[${e.from}${e.to ? ` → ${e.to}` : ''}] ${e.kind}: ${e.text}`;
    feed.push(line);
    console.log(`  ${concept}-${taglia} ${line.slice(0, 200)}`);
  };
  const t0 = Date.now();
  let r: Awaited<ReturnType<typeof sculpt>>;
  let errore: string | undefined;
  try {
    r = await sculpt(k.council, request(concept, taglia), SCULTORI);
  } catch (e) {
    errore = (e as Error).message;
  }
  const secondi = Math.round((Date.now() - t0) / 1000);
  if (r!) fs.writeFileSync(path.join(dir, 'programma.xml'), r.xml);
  fs.writeFileSync(path.join(dir, 'registro.txt'), feed.join('\n') + '\n');
  const tot = ledger.total();
  const esito: Esito = {
    concetto: concept,
    taglia,
    ...(r! ? { modello: r.model, ...(r.score !== undefined ? { voto: r.score } : {}) } : {}),
    chiamate: tot.calls,
    secondi,
    usd: Number(tot.usd.toFixed(4)),
    token: { prompt: tot.prompt, output: tot.output, thoughts: tot.thoughts },
    perCompito: ledger.tasks().map((t) => ({ model: t.model, task: t.task, calls: t.tally.calls, usd: Number(t.tally.usd.toFixed(4)) })),
    ...(errore ? { errore } : !r! ? { errore: 'nessun programma valido' } : {}),
  };
  fs.writeFileSync(path.join(dir, 'esito.json'), JSON.stringify(esito, null, 1));
  console.log(`${concept}-${taglia}: ${r! ? `fatto (${r.model}, voto ${r.score ?? '—'})` : `NON riuscito (${esito.errore})`} in ${secondi} s · ${tallyLine(tot)}`);
  return esito;
}

/** Pictures one under the other. */
function stack(rows: Picture[]): Picture {
  const w = Math.max(...rows.map((p) => p.w));
  const h = rows.reduce((s, p) => s + p.h, 0);
  const data = new Uint8ClampedArray(w * h * 4);
  let oy = 0;
  for (const p of rows) {
    for (let y = 0; y < p.h; y++) data.set(p.data.subarray(y * p.w * 4, (y + 1) * p.w * 4), ((oy + y) * w) * 4);
    oy += p.h;
  }
  return { w, h, data };
}

/** A program kept: the three sizes, the seeds, the kernel's check at its own size, the photos (a row per seed, four sides). */
function misura(dir: string, taglia: SizeTier): Record<string, unknown> | undefined {
  const file = path.join(dir, 'programma.xml');
  if (!fs.existsSync(file)) return undefined;
  const xml = fs.readFileSync(file, 'utf8');
  const files = seedFiles(xml);
  const righe: Record<string, unknown> = {};
  const prima: Record<string, Composition> = {};
  console.log(`\n${path.basename(dir)} (include ${Object.keys(files).join(', ') || 'niente'})`);
  for (const t of TAGLIE) {
    const box = voxelsOf(tilesOf(STRUCTURE, t), 20);
    let model;
    try {
      model = compileMjx(xml, { size: box, files });
    } catch (e) {
      console.log(`   ${t}: non compila: ${(e as Error).message}`);
      righe[t] = { errore: (e as Error).message };
      continue;
    }
    const giri = Array.from({ length: SEMI }, (_, i) => giro(model, 20, i + 1));
    console.log(` ${t} (${box.join('×')})`);
    for (const g of giri) console.log(`   ${riga(g, 20)}`);
    const animali = animalLetters(model.program.palette);
    if (animali.length) console.log(`   animali: ✗ ${animali.join(' ')}`);
    const merli = Object.entries(model.program.palette).find(([, v]) => /merl|battlement|crenel/i.test(v.name ?? ''))?.[0];
    if (merli) console.log(`   merli (${merli}) per lunghezza: ${JSON.stringify(merlonRuns(giri[0].grid, merli))}`);
    prima[t] = giri[0].composizione;
    righe[t] = giri.map(({ grid: _g, ...g }) => g);
    const scala = Math.max(1, Math.round(240 / box[0]));
    const rows = giri.map((g) => sheet([0, 1, 2, 3].map((v) => render(g.grid, model.program.palette, v, cartoonRender(scala))), 1, 8, [112, 150, 84]));
    fs.writeFileSync(path.join(dir, `${t}.png`), png(stack(rows)));
  }
  const varieta: string[] = [];
  for (let i = 1; i < TAGLIE.length; i++) {
    const a = prima[TAGLIE[i - 1]], b = prima[TAGLIE[i]];
    if (!a || !b) continue;
    const e = varietyError(a, b, SIZE_TIERS.find((s) => s.id === TAGLIE[i - 1])!.name, SIZE_TIERS.find((s) => s.id === TAGLIE[i])!.name);
    varieta.push(`${TAGLIE[i - 1]} → ${TAGLIE[i]}: ${e ?? 'cresce'}`);
  }
  console.log(`   varietà: ${varieta.join(' · ')}`);
  const controllo: Record<string, string> = {};
  for (const t of ['large', 'huge'] as SizeTier[]) {
    const c = checkProgram(xml.replace(/^\s*<!--[\s\S]*?-->\s*/, ''), STRUCTURE, t, files);
    controllo[t] = c.error ?? 'passa';
    console.log(`   checkProgram ${t}: ${controllo[t]}`);
  }
  return { taglia, righe, varieta, controllo };
}

/**
 * How much the concepts differ and how much the seeds of one program differ (T337, `lab/banco/concetti.ts`), at Large with the seeds of the
 * world (4): the programs of Gemini kept here, then the ones written by hand (T346 fort and farm, T354 rocca and villetta), each set alone.
 * The feet are the layer above the soil. → <out>/concetti.json, <out>/concetti.png (a row per program, seed by seed, from the front).
 */
function concetti(): void {
  const box = voxelsOf(tilesOf(STRUCTURE, 'large'), 20);
  const insiemi: Record<string, Array<{ nome: string; concetto: string; xml: string }>> = {
    // Every round kept (`<out>/<giro>/<concetto>-<taglia>/programma.xml`): the programs that passed.
    gemini: fs.readdirSync(BASE).filter((g) => fs.statSync(path.join(BASE, g)).isDirectory()).sort().flatMap((g) =>
      giri.flatMap(([c, t]) => {
        const f = path.join(BASE, g, `${c}-${t}`, 'programma.xml');
        return fs.existsSync(f) ? [{ nome: `${g}/${c}-${t}`, concetto: c, xml: fs.readFileSync(f, 'utf8') }] : [];
      }),
    ),
    'a mano': [
      { nome: 'forte (T346)', concetto: 'forte', xml: fs.readFileSync('lab/banco/taglie/forte.xml', 'utf8') },
      { nome: 'fattoria (T346)', concetto: 'fattoria', xml: fs.readFileSync('lab/banco/taglie/fattoria.xml', 'utf8') },
      { nome: 'rocca (T354)', concetto: 'rocca', xml: fs.readFileSync('lab/banco/taglie/scultore-rocca.xml', 'utf8') },
      { nome: 'villetta (T354)', concetto: 'villetta', xml: MOCK_STRUCTURE_PROGRAM },
    ],
  };
  const out: Record<string, unknown> = {};
  const righe: Picture[] = [];
  for (const [nome, voci] of Object.entries(insiemi)) {
    const gruppi: Gruppo[] = [];
    for (const v of voci) {
      const model = compileMjx(v.xml.replace(/^s*<!--[sS]*?-->s*/, ''), { size: box, files: seedFiles(v.xml) });
      const forme = [];
      const foto: Picture[] = [];
      for (let s = 1; s <= STRUCTURE_SEEDS; s++) {
        const r = runMjx(model, s, { deadline: 30_000 });
        forme.push(formaDi(v.nome, s, r.grid, model.program.palette, 1));
        foto.push(render(r.grid, model.program.palette, 0, cartoonRender(2)));
      }
      gruppi.push({ nome: v.nome, concetto: v.concetto, forme });
      righe.push(sheet(foto, 1, 8, [112, 150, 84]));
    }
    const c = confronta(gruppi);
    const f2 = (x: number) => x.toFixed(2);
    console.log(`\n${nome}: tra i semi ${f2(c.dentro.distanza)}, tra concetti ${f2(c.fra.distanza)}, separazione ${f2(c.separazione.distanza)}, vicini ${Math.round(c.vicini * 100)} %`);
    for (const t of c.traSemi) console.log(`   ${t.nome}: tra i semi ${f2(t.quote.distanza)} (impronta ${f2(t.quote.impronta)}, profilo ${f2(t.quote.profilo)}, pieni ${f2(t.quote.pieni)})`);
    console.log(c.matrice.d.map((r, i) => `   ${c.matrice.concetti[i]}: ${r.map(f2).join(' ')}`).join('\n'));
    out[nome] = c;
  }
  fs.writeFileSync(path.join(BASE, 'concetti.json'), JSON.stringify(out, null, 1));
  fs.writeFileSync(path.join(BASE, 'concetti.png'), png(stack(righe)));
}

const solo = opt('solo')?.split(',') ?? CONCETTI;
const taglie = (opt('taglie')?.split(',') ?? ['large', 'huge']) as SizeTier[];
const giri = solo.flatMap((c) => taglie.map((t) => [c, t] as const));

if (args.includes('--concetti')) {
  concetti();
  process.exit(0);
}

if (!args.includes('--misura')) {
  const root = path.resolve(opt('root') ?? (fs.existsSync('.env') ? '.' : '../../..'));
  const key = readKey(root);
  const esiti = await Promise.all(giri.map(([c, t]) => scolpisci(key, c, t)));
  const somma = esiti.reduce((s, e) => s + e.usd, 0);
  console.log(`\nIl giro: ${usd(somma)} a listino, ${esiti.reduce((s, e) => s + e.chiamate, 0)} chiamate`);
}

const misure: Record<string, unknown> = {};
for (const [c, t] of giri) misure[`${c}-${t}`] = misura(path.join(OUT, `${c}-${t}`), t);
const json = path.join(OUT, 'misure.json');
const old = fs.existsSync(json) ? JSON.parse(fs.readFileSync(json, 'utf8')) : {};
fs.writeFileSync(json, JSON.stringify({ ...old, ...misure }, null, 1));
