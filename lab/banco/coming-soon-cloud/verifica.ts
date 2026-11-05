// The three realms of Step 37 (spazio, pirati, cowboy) on the bench: every file a realm brings checked as the game checks what the
// Council writes, then the realm booted on a real Kernel (the seed with the realm's files over it) and run for 400 ticks.
// Nothing here calls a model: the Council is MockAiModels. Nothing here touches src/.
//
//   npx vite-node lab/banco/coming-soon-cloud/verifica.ts                 (the three realms, writes esito.md)
//   npx vite-node lab/banco/coming-soon-cloud/verifica.ts -- pirati       (one realm)
//   npx vite-node lab/banco/coming-soon-cloud/verifica.ts -- pirati --senza-suoni   (skip the slow part while writing)
//
// What must hold, for each realm: 10 magic runes that validateNewRune takes one after the other; 12 modules with Lua that
// validateForged takes; 10 models that pass the game's measures (analyse) on 5 seeds and are not static (varianza.ts); 6 sound
// programs that pass the analysis on 10 triples of seeds; people, plots, bible, atlas, rules, lexicon and canon that the kernel's
// validators take; 400 ticks with 0 faults; 0 fourth-wall breaks in anything the realm writes or the kernel says while it runs.

import fs from 'node:fs';
import path from 'node:path';
import { MockAiModels } from '../../../src/kernel/ai/mock';
import { readAtlas } from '../../../src/kernel/atlas';
import { bundledFiles } from '../../../src/kernel/bundle';
import { bibleBreaks, lexiconWords, metaBreak } from '../../../src/kernel/fourthwall';
import { Kernel } from '../../../src/kernel/kernel';
import { validateNewRune } from '../../../src/kernel/magic';
import { validateEffects } from '../../../src/kernel/validator';
import { readPlots, reviewPlot, plotText, canonBreak } from '../../../src/kernel/plots';
import { memoryStore } from '../../../src/kernel/repo';
import { checkSociety, readPeople } from '../../../src/kernel/society';
import type { FileMap, Manifest, MagicRune } from '../../../src/kernel/types';
import { analyse } from '../../../src/mj/check';
import { Mj3Error } from '../../../src/mj/engine';
import { compileMjx } from '../../../src/mj/model';
import { FORM_LIMITS, runMjx } from '../../../src/mj/run';
import { analyzeSound } from '../../../src/mj/soundanalysis';
import { SOGLIA_VARIANZA } from '../varianza';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
export const REAMI = ['spazio', 'pirati', 'cowboy'] as const;
export type Reame = (typeof REAMI)[number];

export const TICKS = 400;
export const MODEL_SEEDS = [1, 2, 3, 4, 5];
/** Ten triples of seeds: the validator measures a sound program on three (SOUND_CHECK_SEEDS), here ten times over. */
export const SOUND_TRIPLES = Array.from({ length: 10 }, (_, k) => [3 * k + 1, 3 * k + 2, 3 * k + 3]);
export const ATTESI = { rune: 10, moduli: 12, modelli: 10, musiche: 4, effetti: 2, regioni: 8, persone: 16, trame: 6 } as const;

/** The modules of a realm that carry data only (items, the runes): they do not count among the twelve with Lua. */
const DATA_MODULE = /^(items\.|magic\.runes$)/;

// --- Files ---------------------------------------------------------------------------------------------------------------

function readTree(dir: string, base = dir, out: FileMap = {}): FileMap {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) readTree(p, base, out);
    else if (!/\.(ts|md)$/.test(e.name) || p.includes(`${path.sep}world${path.sep}`) || p.includes(`${path.sep}prompts${path.sep}`))
      out[path.relative(base, p).split(path.sep).join('/')] = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
  }
  return out;
}

/** The realm's own files, as they stand in a universe. */
export function realmFiles(reame: Reame): FileMap {
  const files = readTree(path.join(HERE, reame));
  delete files['README.md'];
  return files;
}

/** The seed with the realm over it: the models' index merged, the rest replaced path by path. */
export function realmUniverse(reame: Reame): FileMap {
  const own = realmFiles(reame);
  const index = { ...JSON.parse(bundledFiles['models/index.json']), ...JSON.parse(own['models/index.json'] ?? '{}') };
  const uni = { ...JSON.parse(bundledFiles['universe.json']), ...JSON.parse(own['universe.json'] ?? '{}') };
  return { ...bundledFiles, ...own, 'models/index.json': JSON.stringify(index, null, 1), 'universe.json': JSON.stringify(uni, null, 2) };
}

const json = <T>(files: FileMap, p: string): T => JSON.parse(files[p] ?? 'null') as T;
const moduleIds = (files: FileMap) => [...new Set(Object.keys(files).flatMap((p) => /^modules\/([^/]+)\/manifest\.json$/.exec(p)?.[1] ?? []))].sort();

// --- Checks ------------------------------------------------------------------------------------------------------------------

export interface Esito {
  reame: Reame;
  conteggi: Record<string, number>;
  /** Every defect, one line each: empty when the realm holds. */
  errori: string[];
  /** What was measured, for the report. */
  note: string[];
  faults: number;
  quartaParete: number;
  tick: number;
  ms: number;
}

/** The runes, one after the other, as the Narrator's would enter: each against those before it. */
export function checkRunes(files: FileMap, words: string[]): { errori: string[]; rune: number } {
  const errori: string[] = [];
  const m = json<Manifest & { runes?: Record<string, MagicRune>; spells?: Record<string, { name: string; description: string; effects: unknown[] }> }>(files, 'modules/magic.runes/manifest.json');
  const runes = m?.runes ?? {};
  const canon = files['world/canone.md'] ?? '';
  const accepted: Record<string, MagicRune> = {};
  for (const [token, r] of Object.entries(runes)) {
    const canonLine = canon.split('\n').find((l) => l.includes(`«${token}»`));
    const v = validateNewRune({ token, nome: r.name, glifo: r.glyph, colore: r.color, elemento: r.element, descrizione: r.description, canone: canonLine?.replace(/^-\s*/, '') }, accepted, words);
    if (v.errors.length) errori.push(...v.errors.map((e) => `runa «${token}»: ${e}`));
    else {
      if (v.rune!.rune.glyph !== r.glyph) errori.push(`runa «${token}»: il segno «${r.glyph}» non è libero, il validatore darebbe «${v.rune!.rune.glyph}»`);
      accepted[token] = r;
    }
    if (!canonLine) errori.push(`runa «${token}»: manca la sua riga nel canone (world/canone.md, «${token}» tra caporali)`);
    if (!m?.spells?.[token]) errori.push(`runa «${token}»: manca il suo incantesimo (spells)`);
  }
  const palette = json<{ tiles?: Record<string, never> }>(files, 'modules/world.terrain/manifest.json')?.tiles ?? json<{ tiles?: Record<string, never> }>(bundledFiles, 'modules/world.terrain/manifest.json')?.tiles ?? {};
  for (const [formula, s] of Object.entries(m?.spells ?? {})) {
    for (const t of formula.split(' ')) if (!runes[t]) errori.push(`incantesimo «${formula}»: «${t}» non è una runa del reame`);
    const v = validateEffects(s.effects, { palette, item: () => undefined, module: () => undefined, loot: new Set() });
    if (v.dropped.length || v.effects.length !== s.effects.length) errori.push(`incantesimo «${formula}»: effetti scartati dal validatore (${v.dropped.join('; ') || 'numero diverso'})`);
    const b = metaBreak(`${s.name}. ${s.description}`, words);
    if (b) errori.push(`incantesimo «${formula}»: rompe la quarta parete («${b}»)`);
  }
  return { errori, rune: Object.keys(accepted).length };
}

/** A program of the library on five seeds: the game's measures on each, and whether the seeds give different shapes. */
export function checkModel(id: string, xml: string): { errori: string[]; voxel: number; colore: number } {
  const errori: string[] = [];
  const grids: Array<{ full: Uint8Array; letters: Uint8Array }> = [];
  for (const seed of MODEL_SEEDS) {
    try {
      const m = compileMjx(xml);
      if (m.sound) return { errori: [`${id}: è un programma sonoro`], voxel: 0, colore: 0 };
      const r = runMjx(m, seed, { deadline: 8000, limits: FORM_LIMITS });
      const a = analyse(r, m.program.palette, { grounded: true });
      errori.push(...a.errors.map((e) => `${id} (seme ${seed}): ${e}`));
      const pal = m.program.palette;
      const full = new Uint8Array(r.grid.cells.length);
      const letters = new Uint8Array(r.grid.cells.length);
      r.grid.cells.forEach((c, i) => {
        const e = pal[r.grid.alphabet[c]];
        if (c !== 0 && e?.color && !e.hidden) {
          full[i] = 1;
          letters[i] = c;
        }
      });
      grids.push({ full, letters });
    } catch (e) {
      errori.push(`${id} (seme ${seed}): ${e instanceof Mj3Error ? e.message : (e as Error).message}`);
    }
  }
  // The medians over the pairs, as varianza.ts measures them: shape (voxels full in only one) and colour (same voxel, other letter).
  const shape: number[] = [];
  const colour: number[] = [];
  for (let i = 0; i < grids.length; i++)
    for (let j = i + 1; j < grids.length; j++) {
      let either = 0, one = 0, both = 0, other = 0;
      const a = grids[i], b = grids[j];
      for (let k = 0; k < a.full.length; k++) {
        if (a.full[k] || b.full[k]) either++;
        if (a.full[k] !== b.full[k]) one++;
        if (a.full[k] && b.full[k]) {
          both++;
          if (a.letters[k] !== b.letters[k]) other++;
        }
      }
      shape.push(either ? one / either : 0);
      colour.push(both ? other / both : 0);
    }
  const med = (v: number[]) => (v.length ? [...v].sort((x, y) => x - y)[Math.floor(v.length / 2)] : 0);
  const voxel = med(shape);
  const colore = med(colour);
  if (grids.length === MODEL_SEEDS.length && voxel < SOGLIA_VARIANZA.statico) errori.push(`${id}: statico sui ${MODEL_SEEDS.length} semi (forma ${voxel.toFixed(3)}, serve ≥ ${SOGLIA_VARIANZA.statico}; colore ${colore.toFixed(3)}, che non conta)`);
  return { errori, voxel, colore };
}

/** A sound program on ten triples of seeds, each measured as the validator measures one. */
export function checkSound(id: string, xml: string): { errori: string[]; effetto: boolean } {
  const errori: string[] = [];
  let effetto = false;
  try {
    const m = compileMjx(xml);
    if (!m.sound) return { errori: [`${id}: manca <sound>`], effetto };
    SOUND_TRIPLES.forEach((seeds, k) => {
      const r = analyzeSound(m, { seeds, frugal: true });
      effetto = r.effect;
      for (const i of r.issues) errori.push(`${id} (terna ${k + 1}, semi ${seeds.join(' ')}): ${i.defect}: ${i.message}`);
    });
  } catch (e) {
    errori.push(`${id}: ${(e as Error).message}`);
  }
  return { errori, effetto };
}

/**
 * Every string a realm writes for people to read: what the fourth wall is measured on. Only the realm's own files, and of a
 * Markdown file only the lines the seed's file of the same path does not have (the canon says what is forbidden, in the kernel's words).
 */
function realmTexts(files: FileMap): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const walk = (where: string, v: unknown) => {
    if (typeof v === 'string') out.push([where, v]);
    else if (Array.isArray(v)) v.forEach((x, i) => walk(`${where}[${i}]`, x));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!['id', 'logic', 'model', 'color', 'glyph', 'requires', 'tiles', 'tags', 'tipo'].includes(k)) walk(`${where}.${k}`, x);
  };
  for (const [p, src] of Object.entries(files)) {
    if (p.endsWith('.json')) walk(p, JSON.parse(src));
    else if (p.endsWith('.lua')) for (const m of src.replace(/--[^\n]*/g, '').matchAll(/"((?:\\.|[^"\\\n])*)"/g)) out.push([p, m[1]]);
    else if (p.endsWith('.md')) {
      const seed = new Set((bundledFiles[p] ?? '').split('\n'));
      out.push([p, src.split('\n').filter((l) => !seed.has(l)).join('\n')]);
    }
  }
  return out;
}

/** The world's files as the kernel's validators read them. */
export function checkWorld(files: FileMap, own: FileMap, seedWords: string[]): { errori: string[]; conteggi: Record<string, number> } {
  const errori: string[] = [];
  const words = lexiconWords(files['world/lessico.md'] ?? '');
  // The lexicon is the common thread of every world (T65): the same words; a few customs of its own.
  for (const w of seedWords) if (!words.includes(w)) errori.push(`lessico: manca la parola comune «${w}»`);
  const people = readPeople(files);
  const fixes = checkSociety(people);
  errori.push(...fixes.map((f) => `persone: ${f}`));
  const plots = readPlots(files);
  for (const p of plots) {
    const r = reviewPlot(p, people, words);
    errori.push(...r.problems.map((x) => `trama «${p.id}»: ${x}`));
    const c = canonBreak(plotText(p));
    if (c) errori.push(`trama «${p.id}»: le rune fanno ciò che il canone non dice («${c}»)`);
  }
  const bible = json<Parameters<typeof bibleBreaks>[0]>(files, 'world/bible.json');
  errori.push(...bibleBreaks(bible, words).map((b) => `bibbia: ${b}`));
  const atlas = readAtlas(files);
  const layouts = Object.keys(json<{ layouts?: Record<string, unknown> }>(files, 'modules/world.layouts/manifest.json')?.layouts ?? {});
  for (const r of atlas.regioni) if (!layouts.includes(r.ambiente)) errori.push(`atlante: la regione «${r.id}» vuole l'ambiente «${r.ambiente}», che non c'è`);
  const rules = json<{ regole?: Array<{ chiave: string; testo: string; racconto: string }> }>(files, 'world/rules.json')?.regole ?? [];
  for (const [where, t] of realmTexts(own)) {
    const b = metaBreak(t, where.startsWith('world/lessico') ? [] : words);
    if (b) errori.push(`quarta parete in ${where}: «${b}»`);
  }
  return { errori, conteggi: { persone: people.persone.length, trame: plots.length, regioni: atlas.regioni.length, regole: rules.length } };
}

const DT = 1 / 60;
const settle = (ms = 20) => new Promise((r) => setTimeout(r, ms));

/** The realm on a real kernel: booted, its places planned, every realm module spawned and acted on, then TICKS ticks. */
export async function runRealm(files: FileMap, own: string[], log: (s: string) => void): Promise<{ errori: string[]; faults: number; quarta: number; tick: number; detti: number }> {
  const errori: string[] = [];
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
  const words = lexiconWords(files['world/lessico.md'] ?? '');
  const said: string[] = [];
  const listen = (e: unknown) => {
    const t = (e as { text?: unknown })?.text;
    if (typeof t === 'string') said.push(t);
  };
  for (const ev of ['ui:dialog', 'ui:message', 'ui:say']) (k.bus as unknown as { on: (n: string, f: (e: unknown) => void) => void }).on(ev, listen);
  for (let i = 0; i < 60; i++) {
    k.tick(DT);
    await settle();
    if ([...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
  for (const id of own) {
    if (!k.modules.has(id)) {
      errori.push(`kernel: il modulo ${id} non è stato caricato`);
      continue;
    }
  }
  // Every module of the realm: spawned in front of the wanderer, its items given, each action and its use tried.
  let tick = 0;
  for (const id of own) {
    const entry = k.modules.get(id);
    if (!entry || entry.manifest.kind !== 'entity') continue;
    for (const a of entry.manifest.actions ?? []) if (a.requires) k.give(a.requires, 2);
    const pc = k.wandererCarpet();
    const e = k.spawnModuleEntity(entry, pc.x + 1.2, pc.y);
    if (e === undefined) {
      errori.push(`kernel: ${id} non si può far nascere davanti al viandante`);
      continue;
    }
    for (const a of entry.manifest.actions ?? []) {
      await k.perform(e, `act:${a.id}`);
      k.tick(DT);
      tick++;
    }
    if (entry.manifest.interaction?.type === 'lua') {
      await k.perform(e, 'usa');
      k.tick(DT);
      tick++;
    }
  }
  for (; tick < TICKS; tick++) {
    k.tick(DT);
    if (tick % 50 === 0) await settle(5);
  }
  const faults = k.faults.list();
  for (const f of faults) errori.push(`fault: ${JSON.stringify(f).slice(0, 300)}`);
  // What the kernel said while the realm ran, and the places the Cartographer named.
  let quarta = 0;
  const places = [...k.chunks.values()].flatMap((c) => [c.place?.name ?? '', (c.place as { description?: string } | undefined)?.description ?? '']);
  for (const t of [...said, ...places]) {
    const b = metaBreak(t, words);
    if (b) {
      quarta++;
      errori.push(`quarta parete in ciò che il kernel ha detto: «${t.slice(0, 120)}» («${b}»)`);
    }
  }
  if (process.env.QUINE_DETTI) for (const t of said) log(`    · ${t.slice(0, 110)}`);
  log(`  kernel: ${k.modules.size} moduli, ${k.content.items.size} oggetti, ${Object.keys(k.content.runes).length} rune magiche, ${said.length} battute, ${tick} tick, ${faults.length} fault`);
  return { errori, faults: faults.length, quarta, tick, detti: said.length };
}

export async function verifica(reame: Reame, opts: { suoni?: boolean; log?: (s: string) => void } = {}): Promise<Esito> {
  const log = opts.log ?? ((s: string) => console.log(s));
  const t0 = Date.now();
  const own = realmFiles(reame);
  const files = realmUniverse(reame);
  const errori: string[] = [];
  const note: string[] = [];
  const seedWords = lexiconWords(bundledFiles['world/lessico.md']);
  const words = lexiconWords(files['world/lessico.md'] ?? '');

  const r = checkRunes(own, words);
  errori.push(...r.errori);
  log(`  rune: ${r.rune} accettate`);

  const ownModules = moduleIds(own).filter((id) => !DATA_MODULE.test(id));
  const bootK = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
  for (const id of ownModules) {
    const man = JSON.parse(own[`modules/${id}/manifest.json`]) as Manifest;
    const logic = own[`modules/${id}/${man.logic ?? 'logic.lua'}`];
    if (!logic) {
      errori.push(`modulo ${id}: manca il codice Lua`);
      continue;
    }
    const others = new Set([...bootK.modules.keys()].filter((x) => x !== id));
    errori.push(...bootK.validator.validateForged(man, logic, others).map((e) => `modulo ${id}: ${e}`));
    if (man.appearance?.model && !files[`models/${man.appearance.model}.xml`]) errori.push(`modulo ${id}: il modello «${man.appearance.model}» non c'è`);
  }
  for (const id of moduleIds(own).filter((x) => DATA_MODULE.test(x))) errori.push(...bootK.validator.parseManifest(`modules/${id}/manifest.json`, own[`modules/${id}/manifest.json`]).errors);
  log(`  moduli: ${ownModules.length} con Lua`);

  const index = json<Record<string, { classe?: string; suono?: { uso?: string } }>>(own, 'models/index.json') ?? {};
  const models = Object.keys(own).filter((p) => /^models\/[^/]+\.xml$/.test(p));
  let nModels = 0, nMusic = 0, nEffects = 0;
  for (const p of models) {
    const id = p.slice(7, -4);
    if (!index[id]) errori.push(`modello ${id}: manca in models/index.json`);
    if (index[id]?.classe === 'suono') {
      if (index[id].suono?.uso === 'musica') nMusic++;
      else nEffects++;
      if (opts.suoni === false) continue;
      const t = Date.now();
      const s = checkSound(id, own[p]);
      errori.push(...s.errori);
      log(`  suono ${id}: ${s.errori.length ? `${s.errori.length} difetti` : 'regge'} sulle 10 terne (${Date.now() - t} ms)`);
      if (s.effetto !== (index[id].suono?.uso === 'effetto')) errori.push(`suono ${id}: l'indice dice ${index[id].suono?.uso}, l'analisi ${s.effetto ? 'un effetto' : 'una musica'}`);
    } else {
      nModels++;
      const m = checkModel(id, own[p]);
      errori.push(...m.errori);
      note.push(`${id}: forma ${m.voxel.toFixed(2)}, colore ${m.colore.toFixed(2)}`);
    }
  }
  log(`  modelli: ${nModels}, musiche: ${nMusic}, effetti: ${nEffects}`);

  const w = checkWorld(files, own, seedWords);
  errori.push(...w.errori);
  const quartaStatica = w.errori.filter((e) => e.startsWith('quarta parete') || e.startsWith('bibbia')).length;

  const k = await runRealm(files, ownModules, log);
  errori.push(...k.errori);

  const conteggi = { rune: r.rune, moduli: ownModules.length, modelli: nModels, musiche: nMusic, effetti: nEffects, ...w.conteggi };
  for (const [key, want] of Object.entries(ATTESI)) if ((conteggi as Record<string, number>)[key] !== want) errori.push(`conteggio ${key}: ${(conteggi as Record<string, number>)[key]}, ne servono ${want}`);
  return { reame, conteggi, errori, note, faults: k.faults, quartaParete: quartaStatica + k.quarta, tick: k.tick, ms: Date.now() - t0 };
}

function report(esiti: Esito[]): string {
  const lines = [
    '# Esito della verifica dei tre reami',
    '',
    '> Generato da `npx vite-node lab/banco/coming-soon-cloud/verifica.ts`: non modificarlo a mano. Modelli offline (`MockAiModels`), nessuna chiamata a pagamento.',
    '',
    '| reame | rune | moduli | modelli | musiche | effetti | regioni | persone | trame | regole | tick | fault | quarta parete | difetti | esito |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|',
  ];
  for (const e of esiti) {
    const c = e.conteggi;
    lines.push(`| ${e.reame} | ${c.rune} | ${c.moduli} | ${c.modelli} | ${c.musiche} | ${c.effetti} | ${c.regioni} | ${c.persone} | ${c.trame} | ${c.regole} | ${e.tick} | ${e.faults} | ${e.quartaParete} | ${e.errori.length} | ${e.errori.length ? 'non regge' : 'regge'} |`);
  }
  for (const e of esiti) {
    lines.push('', `## ${e.reame}`, '', `Tempo: ${(e.ms / 1000).toFixed(1)} s.`, '');
    if (e.errori.length) lines.push('Difetti:', '', ...e.errori.map((x) => `- ${x}`), '');
    lines.push('Varianza dei modelli (mediana sulle coppie dei 5 semi: quota di voxel di forma diversa, quota di colore diverso):', '', ...e.note.map((x) => `- ${x}`));
  }
  return lines.join('\n') + '\n';
}

if (!process.env.VITEST) {
  const args = process.argv.slice(2);
  const which = REAMI.filter((r) => args.includes(r));
  const list = which.length ? which : [...REAMI];
  const esiti: Esito[] = [];
  for (const reame of list) {
    console.log(`== ${reame}`);
    const e = await verifica(reame, { suoni: !args.includes('--senza-suoni') });
    esiti.push(e);
    for (const x of e.errori) console.log(`  ✗ ${x}`);
    console.log(`  ${e.errori.length ? 'NON REGGE' : 'REGGE'}: ${JSON.stringify(e.conteggi)}, ${e.faults} fault, ${e.quartaParete} rotture della quarta parete, ${(e.ms / 1000).toFixed(1)} s`);
  }
  if (!which.length && !args.includes('--senza-suoni')) fs.writeFileSync(path.join(HERE, 'esito.md'), report(esiti));
  process.exitCode = esiti.some((e) => e.errori.length) ? 1 : 0;
}
