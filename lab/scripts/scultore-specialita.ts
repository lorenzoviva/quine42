// T473 (S7 of T458, docs/design/scultori-specializzati.md § 6): the paid trial of the Sculptor's specialties. The same concepts, a thing of
// every trade (a tree, a chest, a hat that is worn, an action on a cupboard), two figures (a person, an animal), a building, a vessel and a
// structure that grows by rules, sculpted through the game's own `sculpt` (and `sculptAction`) with two prompts: `prima`, the Sculptor's
// prompt of before T468 (`lab/banco/specialita/prima/sculptor.md`, `git show 4116e7df^:universe/prompts/agents/sculptor.md`: a universe
// without the core's mark gets it whole, as before), and `dopo`, the seed's of today (the core and the sections of S2-S4: T468, T469,
// T470). Everything else is the same in the two arms: the kernel of today (the examples of S1, the checks, the order of the system), the
// seed's world and style guide, the game's models (`DEFAULT_SCULPTORS`: Flash-Lite, 3.8 Flash, Argon, the Artist on 3.5 Flash) and its
// thinking (`low`). The arms run side by side, each one concept after the other in the order of the trades, as the director sculpts them,
// so that the implicit cache of Gemini sees the sequence of a game. Every call is kept with its tokens and its cost, every program the
// kernel threw away with the reason, every vote of the Artist; then each program kept is photographed and measured (what the trade's
// instructions ask: the cycles and the textures of the architect, the limbs of a figure, the worn section on the kernel's bodies, the
// actions, the areas of a vessel, the fort against the author's).
//
//   npx vite-node lab/scripts/scultore-gemini.ts -- --specialita [--giro giro1] [--bracci prima,dopo] [--solo castagno,baule,…] [--tetto 6] [--offline] [--out lab/banco/specialita] [--root ../../..]
//   npx vite-node lab/scripts/scultore-gemini.ts -- --specialita --misura [--giro giro1]      # no call: photos and measures of the programs kept again
//   npx vite-node lab/scripts/scultore-gemini.ts -- --specialita --tabella                    # no call: the tables of every round → <out>/tabella.md
//   npx vite-node lab/scripts/scultore-gemini.ts -- --specialita --cache-opus [--tetto 6]     # three calls of Opus 5.5 through OpenRouter: the marks of the cache (T468)
//
// → <out>/<giro>/<braccio>/<concetto>/{chiamate/<n>-<compito>.md, programma.xml, esito.json, foto.png, registro.txt}, <out>/<giro>/confronto.png.
// The keys are read from <root>/.env and sent only to Google and OpenRouter; they are never printed nor written. --tetto is in dollars on the
// whole register of <out> (every esito.json in it, this run included, at list price or as OpenRouter said): past it every call throws.

import fs from 'node:fs';
import path from 'node:path';
import { Kernel } from '../../src/kernel/kernel';
import { bundledFiles } from '../../src/kernel/bundle';
import { memoryStore } from '../../src/kernel/repo';
import type { FileMap } from '../../src/kernel/types';
import type { FeedEntry } from '../../src/kernel/agents/council';
import { callCost, UsageLog, usd, type CallRecord } from '../../src/kernel/ai/usage';
import type { AiModels, TextCall, Thinking } from '../../src/kernel/ai/models';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { OPENROUTER_API, OpenRouterAiModels } from '../../src/kernel/ai/openrouter';
import {
  BLOCKS,
  cellarOfRequest,
  DEFAULT_SCULPTORS,
  examplesFor,
  extractXml,
  filesOf,
  hasCore,
  isPlanOnly,
  modelFor,
  procedural,
  requestSpecialty,
  sculpt,
  sculptAction,
  sculptorRole,
  sculptorSection,
  SPECIALTY_NAMES,
  type SculptorSpecialty,
  type SculptRequest,
} from '../../src/kernel/agents/sculptor';
import { structureModel } from '../../src/kernel/modeldirector';
import { boxOf, classOf, densityFor, type AssetClass } from '../../src/mj/classes';
import { compileMjx, type MjxModel } from '../../src/mj/model';
import { act, runMjx } from '../../src/mj/run';
import type { Grid3, PaletteEntry } from '../../src/mj/engine';
import { cartoonRender, render, sheet, type Picture } from '../../src/mj/photo';
import { planDistance } from '../../src/mj/views';
import { rig } from '../../src/mj/rig';
import { dressBody, mainColors, trialBodies, wornProgram, wornSections } from '../../src/mj/worn';
import { symbolName } from '../../src/mj/symbols';
import { fortTraits, meanTraits, referencePath, scoreOf, type Reference } from '../banco/riferimento/ottima';
import { direct, readKey } from './gemini';
import { png } from './png';

/** The two prompts of the trial. */
export type Braccio = 'prima' | 'dopo';
export const BRACCI: readonly Braccio[] = ['prima', 'dopo'];
/** The Sculptor's prompt of before T468, as the seed had it at 4116e7df^ (the whole one, with the structures' after `<!-- strutture -->`). */
export const PRIMA_PROMPT = 'lab/banco/specialita/prima/sculptor.md';
export const PRIMA_COMMIT = '4116e7df^';

/** The files of an arm: the seed's, with the prompt of before in `prima` (the sections stay, and nobody reads them: no core, `hasCore`). */
export function armFiles(b: Braccio, seed: FileMap = bundledFiles, old = fs.readFileSync(PRIMA_PROMPT, 'utf8')): FileMap {
  return b === 'dopo' ? seed : { ...seed, 'prompts/agents/sculptor.md': old.replace(/\r\n/g, '\n') };
}

/** What is asked: a model as the ModelDirector asks it, or an action on a model of the seed as the kernel asks it. */
export interface Concetto {
  key: string;
  req?: SculptRequest;
  azione?: { modello: string; nome: string; classe: string; azione: string; etichetta: string; testo: string; cambia: string };
}

/**
 * The concepts, in the order of the trades (as `ModelDirector.missing()` queues them, T468): the landscaper, the joiner and the actions on
 * Flash-Lite, the tailor on Flash-Lite, the figurist on 3.8 Flash, the mason, the coachbuilder and the architect on Argon. The words are the
 * ones of the token bench of T458 (`prompt-tokens.ts --scultore`) where it had them; the structure as the director words it, with a cellar.
 */
export const CONCETTI: Concetto[] = [
  { key: 'castagno', req: { id: 't473-castagno', classe: 'tree', nome: 'Castagno', aspetto: 'un albero dal tronco largo e la chioma tonda' } },
  { key: 'baule', req: { id: 't473-baule', classe: 'furniture', nome: 'Baule da viaggio', aspetto: 'un baule di legno coi cerchi di ferro e il coperchio bombato' } },
  { key: 'credenza', azione: { modello: 'credenza', nome: 'Credenza', classe: 'furniture', azione: 'open', etichetta: 'Apri le ante', testo: 'apro le ante della credenza', cambia: 'le due ante si aprono e si vede dentro' } },
  { key: 'cappello', req: { id: 't473-cappello', classe: 'object', nome: 'Cappello di paglia', aspetto: 'un cappello a tesa larga, intrecciato', worn: 'head' } },
  { key: 'mugnaia', req: { id: 't473-mugnaia', classe: 'person', nome: 'Mugnaia', aspetto: 'una donna robusta col grembiule infarinato e un fazzoletto in testa' } },
  { key: 'gatto', req: { id: 't473-gatto', classe: 'animal', nome: 'Gatto rosso', aspetto: 'un gatto tigrato, la coda alta' } },
  { key: 'casetta', req: { id: 't473-casetta', classe: 'building', nome: 'Casetta del pastore', aspetto: 'una casetta di pietra a un piano col tetto di paglia, la porta davanti e una finestra' } },
  { key: 'barca', req: { id: 't473-barca', classe: 'vessel', nome: 'Barca da pesca', aspetto: 'una barca a vela con lo scafo di legno', taglia: 'large' } },
  {
    key: 'rocca',
    req: { id: structureModel('rocca di confine', 'large'), classe: 'structure', nome: 'rocca di confine', aspetto: 'rocca di confine: a building one enters, with the door at the front, with a cellar under it', taglia: 'large', cellar: 1 },
  },
];

/** What a call was in the sculpting of one model, read from its prompt as `write`, `sculpt` and `sculptAction` word them. */
export type Tipo = 'primo' | 'piano' | 'intero' | 'correzione' | 'revisione' | 'giudizio' | 'azione' | 'correzione-azione' | 'altro';
export function tipoDi(call: Pick<TextCall, 'task' | 'prompt'>): Tipo {
  if (call.task === 'model.judge') return 'giudizio';
  if (call.task === 'model.action') return call.prompt.includes('\nIt does not pass: ') ? 'correzione-azione' : 'azione';
  if (call.task !== 'model.sculpt') return 'altro';
  if (call.prompt.endsWith(`## ${BLOCKS.plan}`)) return 'piano';
  if (call.prompt.endsWith(`## ${BLOCKS.whole}`)) return 'intero';
  if (call.prompt.includes('\nIt does not pass: ')) return 'correzione';
  if (call.prompt.includes('Improve it: answer with the whole program.')) return 'revisione';
  return 'primo';
}
/** The calls whose answer the kernel checks; a write begins with the first of them. */
const CHECKED: readonly Tipo[] = ['primo', 'piano', 'intero', 'correzione', 'revisione', 'azione', 'correzione-azione'];
const STARTS: readonly Tipo[] = ['primo', 'piano', 'revisione', 'azione'];

export interface Chiamata {
  n: number;
  compito: string;
  tipo: Tipo;
  modello: string;
  secondi: number;
  prompt: number;
  cached: number;
  output: number;
  thoughts: number;
  usd: number;
  /** The characters of the system the call carried. */
  sistema: number;
  /** For the Sculptor's calls: what the kernel made of the answer (a plan of the first block is not checked). */
  esito?: 'passa' | 'scartato' | 'piano';
  motivo?: string;
  /** For the Artist's: the vote. */
  voto?: number;
  errore?: string;
}

export interface Scrittura {
  /** The first program of the write passed the kernel's checks. */
  primoColpo: boolean;
  passa: boolean;
  chiamate: number;
  motivi: string[];
}

/** The writes of a model from its calls in order (`write` in sculptor.ts): each starts with a first program, a plan or a revision. */
export function scrittureDi(calls: readonly Chiamata[]): Scrittura[] {
  const ws: Chiamata[][] = [];
  for (const c of calls) {
    if (!CHECKED.includes(c.tipo)) continue;
    if (STARTS.includes(c.tipo) || !ws.length) ws.push([]);
    ws[ws.length - 1].push(c);
  }
  return ws.map((w) => {
    const checked = w.filter((c) => c.esito === 'passa' || c.esito === 'scartato');
    return { primoColpo: checked[0]?.esito === 'passa', passa: checked.some((c) => c.esito === 'passa'), chiamate: w.length, motivi: checked.filter((c) => c.esito === 'scartato').map((c) => c.motivo ?? '') };
  });
}

export interface EsitoS7 {
  giro: string;
  braccio: Braccio;
  concetto: string;
  classe: string;
  taglia?: string;
  specialita: SculptorSpecialty;
  /** The Sculptor's model (the game's for the class). */
  modello: string;
  fatto: boolean;
  voto?: number;
  /** Every vote of the Artist, in order. */
  voti: number[];
  cantina?: boolean;
  scritture: Scrittura[];
  chiamate: Chiamata[];
  token: { prompt: number; cached: number; output: number; thoughts: number };
  usd: number;
  /** Of `usd`: Gemini's (every call here), for the register (`geminiOf` in scultore-gemini.ts). */
  usdGemini: number;
  usdOpenRouter?: number;
  secondi: number;
  /** The characters of the Sculptor's system and its parts in the first call (role, section, examples: the arm's prompt). */
  sistema: { caratteri: number; ruolo: number; sezione: number; esempi: string[] };
  /** The specialties the kernel's ledger counted (T468: `world/usage.json → specialties`), calls by specialty. */
  registro: Record<string, number>;
  note: string[];
  errore?: string;
  indicatori?: Record<string, unknown>;
}

/** Every `esito.json` under a folder. */
export function esitiIn(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? esitiIn(p) : e.name === 'esito.json' ? [p] : [];
  });
}

/** What an esito cost, for the register: every call (Gemini, OpenRouter). */
const costOfEsito = (e: Partial<EsitoS7> & { usd?: number }): number => (typeof e.usd === 'number' && Number.isFinite(e.usd) ? e.usd : 0);

/** Pictures one under the other. */
function stack(rows: Picture[]): Picture {
  const w = Math.max(...rows.map((p) => p.w));
  const h = rows.reduce((s, p) => s + p.h, 0);
  const data = new Uint8ClampedArray(w * h * 4);
  let oy = 0;
  for (const p of rows) {
    for (let y = 0; y < p.h; y++) data.set(p.data.subarray(y * p.w * 4, (y + 1) * p.w * 4), (oy + y) * w * 4);
    oy += p.h;
  }
  return { w, h, data };
}

const BG: [number, number, number] = [112, 150, 84];
const toGrid3 = (g: { X: number; Y: number; Z: number; cells: Uint8Array; alphabet: string[] }): Grid3 => ({ X: g.X, Y: g.Y, Z: g.Z, cells: g.cells, alphabet: g.alphabet, log: [], epoch: 0 });
const four = (g: Grid3, palette: Record<string, PaletteEntry>, px: number) => [0, 1, 2, 3].map((v) => render(g, palette, v, cartoonRender(px)));
const pxFor = (g: Pick<Grid3, 'X' | 'Y'>) => Math.max(1, Math.min(8, Math.floor(260 / Math.max(g.X, g.Y))));

/** The program of a model kept, compiled as the library runs it: its own box, or the class's at its size (and its cellar) for a structure that grows by rules. */
function compiled(xml: string, cls: AssetClass, req: SculptRequest | undefined, files: FileMap, cellar?: number): { model: MjxModel; base: number } {
  const bare = xml.replace(/^\s*<!--[\s\S]*?-->\s*/, '');
  const inc = filesOf(bare, files);
  const withFiles = Object.keys(inc).length ? { files: inc } : {};
  if (req && procedural(cls, req.taglia)) {
    const base = cellarOfRequest(cls, req.taglia, cellar);
    const [X, Y, Z] = boxOf(cls, req.taglia);
    return { model: compileMjx(bare, { size: [X, Y, Z + base], ...(base ? { base } : {}), ...withFiles }), base };
  }
  // A program of the library without a box of its own (the seed's cupboard) runs in its class's, as the library and `sculptAction` run it.
  const sized = /<(?!!)[a-z]+\b[^>]*\ssize="/i.test(bare);
  return { model: compileMjx(bare, { ...(sized ? {} : { size: boxOf(cls, req?.taglia) }), ...withFiles }), base: 0 };
}

/** The author's fort as the bench of the reference keeps it (T371, v1): what a fort is held against. */
let reference: Reference | undefined;
const fortReference = (): Reference => (reference ??= JSON.parse(fs.readFileSync(referencePath(), 'utf8')) as Reference);

const count = (re: RegExp, s: string) => (s.match(re) ?? []).length;

/** Two runs of one program, voxel by voxel: the share of the cells drawn in either that differ (0 the same, 1 nothing in common). */
export function voxelDistance(a: Grid3, b: Grid3, pal: Record<string, PaletteEntry>): number {
  if (a.X !== b.X || a.Y !== b.Y || a.Z !== b.Z) return 1;
  const seen = (g: Grid3, i: number) => {
    const ch = g.alphabet[g.cells[i]];
    return ch !== '.' && !!pal[ch]?.color && !pal[ch]?.hidden ? ch : '';
  };
  let union = 0;
  let differ = 0;
  for (let i = 0; i < a.cells.length; i++) {
    const x = seen(a, i);
    const y = seen(b, i);
    if (!x && !y) continue;
    union++;
    if (x !== y) differ++;
  }
  return union ? differ / union : 0;
}

/**
 * What the program of a model shows of the instructions of its trade, read from its text and from its runs at two seeds, and its photos
 * (the four sides at both seeds; a hat also on the kernel's two bodies; an action before and after).
 */
export function measure(xml: string, cls: AssetClass, req: SculptRequest | undefined, files: FileMap, cellar?: number, actionName?: string): { indicatori: Record<string, unknown>; foto: Picture; fronte: Picture[] } {
  const text = xml.replace(/<!--[\s\S]*?-->/g, '');
  const { model, base } = compiled(xml, cls, req, files, cellar);
  const pal = model.program.palette;
  const runs = [1, 2].map((s) => runMjx(model, s, { deadline: 60_000 }));
  const g = runs[0].grid;
  const drawn = (grid: Grid3) => grid.cells.reduce((n, c) => n + (grid.alphabet[c] !== '.' && pal[grid.alphabet[c]]?.color && !pal[grid.alphabet[c]]?.hidden ? 1 : 0), 0);
  const entries = Object.entries(pal);
  const ind: Record<string, unknown> = {
    voxel: drawn(g),
    finisce: runs.every((r) => r.finished),
    cicli: count(/<markov\b[^>]*>\s*<sequence\b/g, text),
    markov: count(/<markov\b/g, text),
    convchain: count(/<convchain\b/g, text),
    wfc: count(/<wfc\b/g, text),
    map: count(/<map\b/g, text),
    mapFrazionaria: count(/<map\b[^>]*\bscale="[^"]*\//g, text),
    pieces: count(/<pieces\b/g, text),
    field: count(/<field\b/g, text),
    path: count(/<path\b/g, text),
    convolution: count(/<convolution\b/g, text),
    rotazioni: count(/symmetry="\(xyz\+\)"/g, text),
    animazioni: count(/<animation\b/g, text),
    azioni: [...text.matchAll(/<action\b[^>]*\bname="([^"]+)"/g)].map((m) => m[1]),
    import: [...text.matchAll(/<import\b[^>]*\bfile="([^"]+)"/g)].map((m) => m[1]),
    nascoste: entries.filter(([, e]) => e.hidden).length,
    traslucide: entries.filter(([, e]) => typeof e.alpha === 'number' && e.alpha < 1).map(([k]) => symbolName(k)),
    luci: entries.filter(([, e]) => e.glow).length,
    parti: [...new Set(entries.map(([, e]) => e.part).filter(Boolean))],
    aree: [...new Set(entries.map(([, e]) => e.area).filter(Boolean))],
    colori: entries.filter(([, e]) => e.color && !e.hidden).length,
  };
  // How much two seeds differ (0 the same, 1 nothing in common): a structure by its plan from above, as the kernel tells the Sculptor
  // (`planDistance`: 0.15-0.6 a building that varies); a thing in one box voxel by voxel, where the plan would take its top for a ground.
  if (runs[1].finished) {
    const d = req && procedural(cls, req.taglia) ? planDistance(runs[0].grid, runs[1].grid, pal) : voxelDistance(runs[0].grid, runs[1].grid, pal);
    ind.semi = Math.round(d * 1000) / 1000;
  }
  const px = pxFor(g);
  const rows: Picture[] = runs.map((r) => sheet(four(r.grid, pal, px), 1, 6, BG));
  const fronte = [render(g, pal, 0, cartoonRender(px)), render(g, pal, 1, cartoonRender(px))];
  // A figure: the limbs the kernel's rig finds (T470: each piece of a part is a limb).
  if (['person', 'animal', 'beast'].includes(cls.id)) {
    const r = rig(g, pal);
    const limbs: Record<string, number> = {};
    for (const l of r.limbs) limbs[l.part] = (limbs[l.part] ?? 0) + 1;
    ind.arti = limbs;
    ind.artiIndovinati = r.guessed;
  }
  // A thing worn: its section on the kernel's two bodies, by way B (the section's rules) or C (the two colours, where B does not run).
  if (req?.worn) {
    ind.sezioni = wornSections(xml).map((s) => s.zone);
    const thing = { background: symbolName(model.background), palette: pal };
    const colors = mainColors(g, pal);
    let program: string | undefined;
    try {
      program = wornProgram(xml, req.worn, thing);
    } catch (e) {
      ind.vestitoErrore = (e as Error).message;
    }
    const dressed = trialBodies().map((b) => ({ name: b.name, d: dressBody(b, [{ zone: req.worn!, colors, ...(program ? { program } : {}) }]) }));
    ind.vestito = Object.fromEntries(dressed.map(({ name, d }) => [name, d.changes.map((c) => (c.fault ? `C (${c.fault}${c.why ? `: ${c.why.slice(0, 80)}` : ''})` : program ? 'B' : 'C')).join(', ')]));
    const dpx = 6;
    rows.push(sheet(dressed.flatMap(({ d }) => [render(toGrid3(d.grid), d.palette, 0, cartoonRender(dpx)), render(toGrid3(d.grid), d.palette, 1, cartoonRender(dpx))]), 1, 6, BG));
  }
  // An action: the model before and after it, at the first seed.
  if (actionName) {
    const a = model.actions.find((x) => x.name === actionName);
    if (a) {
      const after = toGrid3({ ...g, cells: new Uint8Array(g.cells) });
      const res = act(after, a, 1);
      let changed = 0;
      for (let i = 0; i < g.cells.length; i++) if (g.cells[i] !== after.cells[i]) changed++;
      ind.azioneCambia = changed;
      ind.azioneFinisce = res.finished;
      rows.push(sheet(four(after, pal, px), 1, 6, BG));
      fronte.push(render(after, pal, 0, cartoonRender(px)));
    }
  }
  // A fort against the author's (T371, the scale of the reference): the traits at the two seeds, a vote out of 10.
  if (req && procedural(cls, req.taglia)) {
    const vpt = densityFor(cls, req.taglia);
    const traits = runs.map((r, i) => ({ r, seed: i + 1 })).filter(({ r }) => r.finished).map(({ r, seed }) => fortTraits(r.grid, pal, vpt, model.actions, seed));
    if (traits.length) {
      const s = scoreOf(meanTraits(traits), fortReference().traits);
      ind.ottima = s.total;
      ind.ottimaVoci = Object.fromEntries(s.items.map((i) => [i.id, Math.round(i.value * 100) / 100]));
    }
    ind.base = base;
  }
  return { indicatori: ind, foto: stack(rows), fronte };
}

// --- The run -----------------------------------------------------------------------------------------------------------------------

interface Options {
  base: string;
  giro: string;
  bracci: Braccio[];
  solo?: string[];
  tetto: number;
  offline: boolean;
  thinking: Thinking;
  root: string;
  timeout: number;
}

/** The register of the bench: the dollars already in BASE (the folders this run rewrites excluded) and the ones of this run, as they come. */
const register = {
  before: 0,
  live: new UsageLog(),
  spent() {
    return this.before + this.live.total().usd;
  },
};

/**
 * The game's models for one model sculpted (Gemini, the key straight to Google), every call written down as it went, with what it was
 * (`tipoDi`), its tokens and its cost, and the kernel's verdict on what the Sculptor answered (its `scarta`, from the feed).
 */
class Traccia implements AiModels {
  readonly name: string;
  calls: Chiamata[] = [];
  notes: string[] = [];
  onCall?: (r: CallRecord) => void;
  private pending?: Chiamata;
  private last?: CallRecord;
  private systems = new Map<string, string>();
  private dir: string;
  constructor(
    private inner: AiModels & { onCall?: (r: CallRecord) => void },
    dir: string,
    private opts: Options,
    private ledger: UsageLog,
  ) {
    this.name = inner.name;
    this.dir = path.join(dir, 'chiamate');
    fs.mkdirSync(this.dir, { recursive: true });
    const before = inner.onCall;
    inner.onCall = (r) => {
      before?.(r);
      this.last = r;
      this.ledger.record(r);
      if (!opts.offline) register.live.record(r);
      // The kernel's own ledger too: it counts the specialty of every call of the Sculptor (T468).
      this.onCall?.(r);
    };
  }
  get usage() {
    return this.inner.usage;
  }
  get limits() {
    return this.inner.limits;
  }
  set limits(l) {
    this.inner.limits = l;
  }
  get textModel() {
    return this.inner.textModel;
  }
  /** The kernel sets the universe's text model at the boot (`ai.textModel`), as on the game's models: only for the calls that do not say one. */
  set textModel(m) {
    this.inner.textModel = m;
  }
  /** The call before has its verdict now: the kernel said nothing against it, so it passed. */
  settle(): void {
    if (this.pending && !this.pending.esito) this.pending.esito = 'passa';
    this.pending = undefined;
  }
  /** The kernel's feed: a program thrown away goes to the call that wrote it. */
  feed(e: FeedEntry): void {
    if (e.from !== 'kernel' || e.kind !== 'scarta') return;
    if (/entra senza$/.test(e.text)) {
      this.notes.push(e.text);
      return;
    }
    if (this.pending && !this.pending.esito) {
      this.pending.esito = 'scartato';
      this.pending.motivo = e.text.replace(/^(azione «[^»]*» di )?«[^»]*»: /, '');
    }
  }
  async text(call: TextCall): Promise<string> {
    this.settle();
    if (!this.opts.offline && register.spent() > this.opts.tetto) throw new Error(`tetto del registro: ${usd(register.spent())} oltre ${usd(this.opts.tetto)}`);
    const n = this.calls.length + 1;
    const tipo = tipoDi(call);
    const modello = call.model ?? this.inner.textModel ?? '?';
    const file = path.join(this.dir, `${String(n).padStart(2, '0')}-${call.task}.md`);
    // The system once per agent (the same at every call of a model); another one, if it ever changes, beside it with the call's number.
    const seen = this.systems.get(call.agent);
    if (seen === undefined) {
      this.systems.set(call.agent, call.system);
      fs.writeFileSync(path.join(this.dir, `sistema-${call.agent}.md`), call.system);
    } else if (seen !== call.system) fs.writeFileSync(path.join(this.dir, `sistema-${call.agent}-${n}.md`), call.system);
    this.last = undefined;
    const t0 = Date.now();
    const record = (): Omit<Chiamata, 'n' | 'compito' | 'tipo' | 'modello' | 'secondi' | 'sistema'> => {
      const r = this.last;
      return { prompt: r?.prompt ?? 0, cached: r?.cached ?? 0, output: r?.output ?? 0, thoughts: r?.thoughts ?? 0, usd: r ? (callCost(r) ?? 0) : 0 };
    };
    try {
      const out = await this.inner.text(call);
      const secondi = Math.round((Date.now() - t0) / 1000);
      const c: Chiamata = { n, compito: call.task, tipo, modello, secondi, ...record(), sistema: call.system.length };
      if (tipo === 'giudizio') {
        try {
          const v = Number((JSON.parse(out) as { score?: unknown }).score);
          if (Number.isFinite(v)) c.voto = Math.max(0, Math.min(10, Math.round(v)));
        } catch {
          /* the Artist's answer that is not JSON: no vote */
        }
      } else if (tipo === 'piano' && isPlanOnly(extractXml(out))) c.esito = 'piano';
      else if (CHECKED.includes(tipo)) this.pending = c;
      this.calls.push(c);
      fs.writeFileSync(file, `# ${call.task} · ${tipo} · ${modello} · ${secondi} s · ${c.prompt} token d'ingresso (${c.cached} in cache), ${c.output} d'uscita, ${c.thoughts} di ragionamento · ${usd(c.usd)}${call.images?.length ? ` · ${call.images.length} immagini` : ''}\n\n## Richiesta\n\n${call.prompt}\n\n## Risposta\n\n${out}\n`);
      return out;
    } catch (e) {
      const secondi = Math.round((Date.now() - t0) / 1000);
      this.calls.push({ n, compito: call.task, tipo, modello, secondi, ...record(), sistema: call.system.length, errore: (e as Error).message.slice(0, 300) });
      fs.writeFileSync(file, `# ${call.task} · ${tipo} · ${modello} · errore dopo ${secondi} s\n\n## Richiesta\n\n${call.prompt}\n\n## Errore\n\n${(e as Error).message}\n`);
      throw e;
    }
  }
}

/** The id of a program of the library, from its text (the examples come back as programs). */
const idOf = (files: FileMap, xml: string): string => Object.keys(files).find((p) => p.startsWith('models/') && p.endsWith('.xml') && files[p]?.trim() === xml)?.slice(7, -4) ?? '?';

async function one(o: Options, braccio: Braccio, c: Concetto, key: string | undefined): Promise<EsitoS7> {
  const dir = path.join(o.base, o.giro, braccio, c.key);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const files = armFiles(braccio);
  const req = c.req;
  const cls = classOf(req?.classe ?? c.azione!.classe) ?? classOf('object')!;
  const specialita: SculptorSpecialty = req ? requestSpecialty(req) : 'actions';
  const modello = req ? modelFor(req, cls, DEFAULT_SCULPTORS) : DEFAULT_SCULPTORS.simple;
  const ledger = new UsageLog();
  const inner: AiModels & { onCall?: (r: CallRecord) => void } = o.offline || !key ? new MockAiModels() : direct(DEFAULT_SCULPTORS.structure, key, new UsageLog(), { thinking: o.thinking, timeout: o.timeout * 1000, max: 40 });
  // MockAiModels records nothing: its calls cost nothing and say no tokens.
  const ai = new Traccia(inner, dir, o, ledger);
  const k = await Kernel.boot({ files, store: memoryStore(), ai });
  k.council.thinking = () => o.thinking;
  const feed: string[] = [];
  k.council.onFeed = (e) => {
    ai.feed(e);
    const line = `[${e.from}${e.to ? ` → ${e.to}` : ''}] ${e.kind}: ${e.text}`;
    feed.push(line);
    console.log(`  ${o.giro} ${braccio} ${c.key} ${line.slice(0, 180)}`);
  };
  // The system the arm gives this request (what `write` and `sculptAction` put first): the role, the section, the examples of S1.
  const role = sculptorRole(k.council.files, specialita);
  const section = specialita === 'actions' ? sculptorSection(k.council.files, 'actions', 'joiner') : sculptorSection(k.council.files, specialita);
  const examples = req && !procedural(cls, req.taglia) ? examplesFor(k.council.files, { ...req, classe: cls.id }) : [];
  const t0 = Date.now();
  let xml: string | undefined;
  let score: number | undefined;
  let cellar: number | undefined;
  let errore: string | undefined;
  try {
    if (req) {
      const r = await sculpt(k.council, req, DEFAULT_SCULPTORS);
      if (r) ({ xml, score, cellar } = r);
    } else {
      const a = c.azione!;
      const base = k.council.files[`models/${a.modello}.xml`];
      if (!base) throw new Error(`il seme non ha models/${a.modello}.xml`);
      const r = await sculptAction(k.council, { nome: a.nome, xml: base, classe: a.classe, azione: a.azione, etichetta: a.etichetta, testo: a.testo, cambia: a.cambia }, DEFAULT_SCULPTORS.simple);
      if (r) xml = r.xml;
    }
  } catch (e) {
    errore = (e as Error).message;
  }
  ai.settle();
  const secondi = Math.round((Date.now() - t0) / 1000);
  if (xml) fs.writeFileSync(path.join(dir, 'programma.xml'), xml);
  fs.writeFileSync(path.join(dir, 'registro.txt'), feed.join('\n') + '\n');
  const tot = ledger.total();
  const firstSculpt = ai.calls.find((x) => x.compito === 'model.sculpt' || x.compito === 'model.action');
  const esito: EsitoS7 = {
    giro: o.giro,
    braccio,
    concetto: c.key,
    classe: cls.id,
    ...(req?.taglia ? { taglia: req.taglia } : {}),
    specialita,
    modello,
    fatto: !!xml,
    ...(score !== undefined ? { voto: score } : {}),
    voti: ai.calls.filter((x) => x.voto !== undefined).map((x) => x.voto!),
    ...(req?.cellar ? { cantina: cellar !== undefined } : {}),
    scritture: scrittureDi(ai.calls),
    chiamate: ai.calls,
    token: { prompt: tot.prompt, cached: tot.cached, output: tot.output, thoughts: tot.thoughts },
    usd: Number(tot.usd.toFixed(5)),
    usdGemini: Number(tot.usd.toFixed(5)),
    secondi,
    sistema: { caratteri: firstSculpt?.sistema ?? 0, ruolo: role.length, sezione: section.length, esempi: examples.map((x) => idOf(k.council.files, x.trim())) },
    registro: Object.fromEntries(Object.entries(k.usage.specialties()).map(([s, t]) => [s, t.calls])),
    note: ai.notes,
    ...(errore ? { errore } : !xml ? { errore: 'nessun programma valido' } : {}),
  };
  fs.writeFileSync(path.join(dir, 'esito.json'), JSON.stringify(esito, null, 1));
  const w = esito.scritture;
  console.log(`${o.giro} ${braccio} ${c.key} (${SPECIALTY_NAMES[specialita]}, ${modello}): ${xml ? `fatto, voto ${score ?? '—'}` : `NON riuscito (${esito.errore})`} · al primo colpo ${w.filter((x) => x.primoColpo).length} su ${w.length} · ${ai.calls.length} chiamate · ${usd(tot.usd)} · ${secondi} s · registro ${usd(register.spent())}`);
  return esito;
}

/** The photos and the measures of every program kept in a round, written into each esito; the sheet of the two arms side by side. */
function misuraGiro(o: Options): void {
  const rows: Picture[] = [];
  for (const c of CONCETTI.filter((x) => !o.solo || o.solo.includes(x.key))) {
    const fronts: Picture[][] = [];
    for (const b of o.bracci) {
      const dir = path.join(o.base, o.giro, b, c.key);
      const file = path.join(dir, 'esito.json');
      if (!fs.existsSync(file)) continue;
      const esito = JSON.parse(fs.readFileSync(file, 'utf8')) as EsitoS7;
      const prog = path.join(dir, 'programma.xml');
      if (!fs.existsSync(prog)) {
        fronts.push([]);
        continue;
      }
      const cls = classOf(esito.classe)!;
      try {
        const m = measure(fs.readFileSync(prog, 'utf8'), cls, c.req, armFiles(b), c.req?.cellar && esito.cantina ? c.req.cellar : undefined, c.azione?.azione);
        esito.indicatori = m.indicatori;
        fs.writeFileSync(path.join(dir, 'foto.png'), png(m.foto));
        fronts.push(m.fronte);
        console.log(`  ${o.giro} ${b} ${c.key}: ${JSON.stringify(m.indicatori).slice(0, 400)}`);
      } catch (e) {
        esito.indicatori = { errore: (e as Error).message };
        fronts.push([]);
      }
      fs.writeFileSync(file, JSON.stringify(esito, null, 1));
    }
    // The two arms side by side: prima on the left, dopo on the right, the front and the right side of the first seed.
    const pics = fronts.flatMap((f, i) => [...f, ...(i < fronts.length - 1 ? [{ w: 24, h: 1, data: new Uint8ClampedArray(24 * 4) }] : [])]);
    if (pics.some((p) => p.w > 24)) rows.push(sheet(pics, 1, 6, BG));
  }
  if (rows.length) fs.writeFileSync(path.join(o.base, o.giro, 'confronto.png'), png(stack(rows)));
}

// --- The table ---------------------------------------------------------------------------------------------------------------------

const n1 = (x: number) => x.toFixed(1).replace('.', ',');
const n0 = (x: number) => Math.round(x).toLocaleString('it').replace(/\./g, ' ');
const pc = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : '—');
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const mean = (xs: number[]) => (xs.length ? sum(xs) / xs.length : NaN);

/** The kinds of reason a program was thrown away, for the table (as `tabella()` of scultore-gemini.ts groups them, and those of the small things). */
const MOTIVI: Array<[string, RegExp]> = [
  ['piani', /piani: \d/],
  ['porta', /porta: \d/],
  ['stanza', /stanza: /],
  ['cantina', /cantina: /],
  ['varietà fra le taglie', /varietà: /],
  ['nave', /nave: |scafo|ponte|timone|imbarco|linea/],
  ['indossato', /<worn>|indoss/],
  ['staccati o sospesi', /staccat|galleggia|sospes|poggia/],
  ['troppo basso o pieno', /alto almeno|almeno \d+ di altezza|basso|riempie il/],
  ['non finisce', /non finisce/],
  ['azione', /l'azione|manca <action|svuota/],
  ['sintassi o nodi', /riga \d+|non è ammesso|nessun nodo|vuoto|sconosciut|attributo|simbolo|colore/],
];
const motivoDi = (m: string): string => MOTIVI.find(([, re]) => re.test(m))?.[0] ?? 'altro';

/** Every answer of the Sculptor a model got (the calls written down as they went), plans and discarded programs included. */
function answersOf(dir: string): string[] {
  const d = path.join(dir, 'chiamate');
  if (!fs.existsSync(d)) return [];
  return fs
    .readdirSync(d)
    .filter((f) => /^\d+-model\.(sculpt|action)\.md$/.test(f))
    .sort()
    .map((f) => fs.readFileSync(path.join(d, f), 'utf8').split('\n## Risposta\n')[1] ?? '')
    .filter((a) => a.trim());
}

type Seguita = [trade: string, what: string, count: (b: Braccio) => string];

/**
 * What the instructions of T469 and T470 asked of each trade, counted arm by arm over every round: on the programs kept (the indicators of
 * `measure`), on the reasons of the programs thrown away, and for the architect on every answer, the ones that did not pass too.
 */
export function seguite(base: string): Seguita[] {
  const all = esitiIn(base)
    .map((f) => ({ e: JSON.parse(fs.readFileSync(f, 'utf8')) as EsitoS7 & { cacheOpus?: boolean }, dir: path.dirname(f) }))
    .filter(({ e }) => !e.cacheOpus && e.braccio);
  const of = (b: Braccio, c: string) => all.filter(({ e }) => e.braccio === b && e.concetto === c);
  const kept = (b: Braccio, c: string) => of(b, c).filter(({ e }) => e.fatto && e.indicatori && !('errore' in e.indicatori));
  const ratio = (b: Braccio, c: string, ok: (i: Record<string, unknown>) => boolean) => {
    const k = kept(b, c);
    return `${k.filter(({ e }) => ok(e.indicatori!)).length} su ${k.length}`;
  };
  const reasons = (b: Braccio, c: string) => of(b, c).flatMap(({ e }) => e.scritture.flatMap((w) => w.motivi));
  const answers = (b: Braccio, c: string) => of(b, c).flatMap(({ dir }) => answersOf(dir));
  const inAnswers = (b: Braccio, c: string, re: RegExp) => {
    const a = answers(b, c);
    return `${a.filter((x) => re.test(x)).length} su ${a.length}`;
  };
  const has = (i: Record<string, unknown>, k: string, v: string) => Array.isArray(i[k]) && (i[k] as unknown[]).includes(v);
  const limbs = (i: Record<string, unknown>) => (i.arti && typeof i.arti === 'object' ? (i.arti as Record<string, number>) : {});
  const meanOf = (b: Braccio, c: string, k: string) => {
    const xs = kept(b, c).map(({ e }) => e.indicatori![k]).filter((x): x is number => typeof x === 'number');
    return xs.length ? (xs.reduce((a, x) => a + x, 0) / xs.length).toFixed(2).replace('.', ',') : '—';
  };
  return [
    ['Paesaggista', 'scarti perché la chioma galleggia o si stacca, su tutti gli scarti', (b) => `${reasons(b, 'castagno').filter((r) => /galleggia|staccat/.test(r)).length} su ${reasons(b, 'castagno').length}`],
    ['Paesaggista', 'castagni tenuti senza `<animation>` (il vento lo fa il kernel)', (b) => ratio(b, 'castagno', (i) => !i.animazioni)],
    ['Paesaggista', 'varietà fra i semi 1 e 2 (0 uguali, 1 niente in comune), media', (b) => meanOf(b, 'castagno', 'semi')],
    ['Mobiliere', 'bauli con `open` e il coperchio aperto in una lettera nascosta', (b) => ratio(b, 'baule', (i) => has(i, 'azioni', 'open') && Number(i.nascoste) > 0)],
    ['Mobiliere', '… e anche `close`', (b) => ratio(b, 'baule', (i) => has(i, 'azioni', 'open') && has(i, 'azioni', 'close'))],
    ['le azioni', '«Apri le ante» al primo colpo', (b) => `${of(b, 'credenza').filter(({ e }) => e.scritture[0]?.primoColpo).length} su ${of(b, 'credenza').length}`],
    ['Sarto', 'cappelli la cui sezione `<worn>` va (via B) sui due corpi del kernel', (b) => ratio(b, 'cappello', (i) => !!i.vestito && Object.values(i.vestito as Record<string, string>).every((v) => v === 'B'))],
    ['Figurinista', 'mugnaie in cui il rig trova 2 gambe, 2 braccia e la testa', (b) => ratio(b, 'mugnaia', (i) => limbs(i).leg === 2 && limbs(i).arm === 2 && limbs(i).head === 1)],
    ['Figurinista', 'gatti in cui il rig trova 4 zampe, la coda e la testa', (b) => ratio(b, 'gatto', (i) => limbs(i).leg === 4 && limbs(i).tail === 1 && limbs(i).head === 1)],
    ['Capomastro', 'casette con la porta che si apre e si chiude (`open`, `close`)', (b) => ratio(b, 'casetta', (i) => has(i, 'azioni', 'open') && has(i, 'azioni', 'close'))],
    ['Capomastro', 'casette con le finestre di vetro (una lettera traslucida)', (b) => ratio(b, 'casetta', (i) => Array.isArray(i.traslucide) && (i.traslucide as unknown[]).length > 0)],
    ['Carrozziere', 'barche con le vele che si ammainano e si issano (`furl`, `hoist`)', (b) => ratio(b, 'barca', (i) => has(i, 'azioni', 'furl') && has(i, 'azioni', 'hoist'))],
    ['Carrozziere', 'barche con le aree `boarding`, `helm` e `hold`', (b) => ratio(b, 'barca', (i) => ['boarding', 'helm', 'hold'].every((a) => has(i, 'aree', a)))],
    ['Architetto', 'risposte con una trama `<convchain>` (anche scartate)', (b) => inAnswers(b, 'rocca', /<convchain\b/)],
    ['Architetto', 'risposte con un ciclo `<markov><sequence>`', (b) => inAnswers(b, 'rocca', /<markov\b[^>]*>\s*(<!--[\s\S]*?-->\s*)*<sequence\b/)],
    ['Architetto', 'risposte che scavano la cantina con `part-cellar`', (b) => inAnswers(b, 'rocca', /<import\b[^>]*file="part-cellar"/)],
    ['Architetto', 'rocche passate (con la cantina che regge)', (b) => `${of(b, 'rocca').filter(({ e }) => e.fatto).length} su ${of(b, 'rocca').length} (${of(b, 'rocca').filter(({ e }) => e.fatto && e.cantina).length} con la cantina)`],
    ['Architetto', 'contro il forte dell’autore (la scala di T371, su 10), media', (b) => meanOf(b, 'rocca', 'ottima')],
  ];
}

/** The tables of every round under BASE: by concept and arm, by arm, by trade, the reasons, the indicators. → <base>/tabella.md */
export function tabella(base: string): string {
  const all = esitiIn(base)
    .map((f) => JSON.parse(fs.readFileSync(f, 'utf8')) as EsitoS7 & { cacheOpus?: boolean })
    .filter((e) => !e.cacheOpus && e.braccio)
    .sort((a, b) => a.giro.localeCompare(b.giro) || CONCETTI.findIndex((c) => c.key === a.concetto) - CONCETTI.findIndex((c) => c.key === b.concetto) || a.braccio.localeCompare(b.braccio) * -1);
  const giri = [...new Set(all.map((e) => e.giro))];
  const sculptorCalls = (e: EsitoS7) => e.chiamate.filter((c) => c.compito !== 'model.judge');
  const lines: string[] = [];
  lines.push(`Giri: ${giri.join(', ')} · ${all.length} modelli chiesti · kernel e modelli del gioco (Scultore ${DEFAULT_SCULPTORS.simple}, ${DEFAULT_SCULPTORS.figure}, ${DEFAULT_SCULPTORS.structure}; Artista ${DEFAULT_SCULPTORS.artist}).`, '');
  // 1. Concept by concept.
  lines.push('### Concetto per concetto', '');
  lines.push('| giro | concetto | specialità | modello | braccio | fatto | voto | voti dell’Artista | primo colpo | chiamate (Scultore + Artista) | ingresso dello Scultore (in cache) | uscita + ragionamento | $ | s |');
  lines.push('|---|---|---|---|---|---|---:|---|---|---|---:|---:|---:|---:|');
  for (const e of all) {
    const sc = sculptorCalls(e);
    const w = e.scritture;
    lines.push(`| ${e.giro} | ${e.concetto} | ${SPECIALTY_NAMES[e.specialita]} | ${e.modello} | ${e.braccio} | ${e.fatto ? 'sì' : 'no'}${e.cantina === false && e.fatto ? ' (senza cantina)' : ''} | ${e.voto ?? '—'} | ${e.voti.join(', ') || '—'} | ${w.filter((x) => x.primoColpo).length} su ${w.length} | ${sc.length} + ${e.chiamate.length - sc.length} | ${n0(sum(sc.map((c) => c.prompt)))} (${n0(sum(sc.map((c) => c.cached)))}) | ${n0(sum(sc.map((c) => c.output + c.thoughts)))} | ${e.usd.toFixed(3).replace('.', ',')} | ${e.secondi} |`);
  }
  // 2. Arm by arm (all rounds), and by trade.
  const summary = (es: EsitoS7[]) => {
    const w = es.flatMap((e) => e.scritture);
    const sc = es.flatMap(sculptorCalls);
    const first = es.flatMap((e) => sculptorCalls(e).filter((c) => c.tipo === 'primo' || c.tipo === 'piano' || c.tipo === 'azione').slice(0, 1));
    const votes = es.filter((e) => e.voto !== undefined).map((e) => e.voto!);
    const fatti = es.filter((e) => e.fatto).length;
    const cost = sum(es.map((e) => e.usd));
    return {
      fatti: `${fatti} su ${es.length}`,
      primo: `${w.filter((x) => x.primoColpo).length} su ${w.length} (${pc(w.filter((x) => x.primoColpo).length, w.length)})`,
      voto: votes.length ? `${n1(mean(votes))} (${votes.join(', ')})` : '—',
      chiamate: `${sc.length} (${n1(sc.length / Math.max(1, es.length))} a modello)`,
      ingresso: `${n0(mean(first.map((c) => c.prompt)))}`,
      cache: `${pc(sum(sc.map((c) => c.cached)), sum(sc.map((c) => c.prompt)))}`,
      uscita: `${n0(sum(sc.map((c) => c.output + c.thoughts)))}`,
      costo: `${cost.toFixed(3).replace('.', ',')} $ (${fatti ? (cost / fatti).toFixed(3).replace('.', ',') : '—'} a modello fatto)`,
      lente: `${sc.filter((c) => c.secondi > 120).length} su ${sc.length}`,
    };
  };
  const head = '| | modelli fatti | programmi al primo colpo | voto finale medio (voti) | chiamate dello Scultore | ingresso della prima chiamata (media) | ingresso in cache | uscita + ragionamento | costo | chiamate oltre 120 s |';
  const sep = '|---|---|---|---|---|---:|---:|---:|---|---|';
  const row = (label: string, s: ReturnType<typeof summary>) => `| ${label} | ${s.fatti} | ${s.primo} | ${s.voto} | ${s.chiamate} | ${s.ingresso} | ${s.cache} | ${s.uscita} | ${s.costo} | ${s.lente} |`;
  lines.push('', '### I due bracci', '', head, sep);
  for (const b of BRACCI) {
    const es = all.filter((e) => e.braccio === b);
    if (es.length) lines.push(row(`**${b}**`, summary(es)));
  }
  for (const g of giri.length > 1 ? giri : []) for (const b of BRACCI) {
    const es = all.filter((e) => e.braccio === b && e.giro === g);
    if (es.length) lines.push(row(`${g}, ${b}`, summary(es)));
  }
  lines.push('', '### Mestiere per mestiere', '', head.replace('| |', '| mestiere, braccio |'), sep);
  const trades = [...new Set(all.map((e) => e.specialita))];
  for (const s of trades) for (const b of BRACCI) {
    const es = all.filter((e) => e.braccio === b && e.specialita === s);
    if (es.length) lines.push(row(`${SPECIALTY_NAMES[s]}, ${b}`, summary(es)));
  }
  // The implicit cache of Gemini, model by model: what it served of the Sculptor's calls, and of the first call of each model (the one that
  // follows another concept, of the same trade or not: in `dopo` another trade shares only the core).
  lines.push('', '### La cache implicita di Gemini (le chiamate dello Scultore)', '');
  lines.push('| modello | braccio | chiamate | ingresso | in cache | prime chiamate di un concetto servite dalla cache |', '|---|---|---:|---:|---:|---|');
  for (const m of [...new Set(all.flatMap((e) => sculptorCalls(e).map((c) => c.modello)))].sort()) for (const b of BRACCI) {
    const es = all.filter((e) => e.braccio === b);
    const cs = es.flatMap((e) => sculptorCalls(e).filter((c) => c.modello === m));
    if (!cs.length) continue;
    const firsts = es.map((e) => sculptorCalls(e)[0]).filter((c) => c?.modello === m);
    lines.push(`| ${m} | ${b} | ${cs.length} | ${n0(sum(cs.map((c) => c.prompt)))} | ${n0(sum(cs.map((c) => c.cached)))} (${pc(sum(cs.map((c) => c.cached)), sum(cs.map((c) => c.prompt)))}) | ${firsts.filter((c) => c.cached > 0).length} su ${firsts.length} |`);
  }
  // 3. Why the kernel threw programs away.
  lines.push('', '### Perché il kernel ha scartato i programmi', '');
  const reasons = BRACCI.map((b) => {
    const m: Record<string, number> = {};
    for (const e of all.filter((x) => x.braccio === b)) for (const w of e.scritture) for (const r of w.motivi) m[motivoDi(r)] = (m[motivoDi(r)] ?? 0) + 1;
    return m;
  });
  const keys = [...new Set(reasons.flatMap((m) => Object.keys(m)))];
  if (keys.length) {
    lines.push(`| braccio | ${keys.join(' | ')} |`, `|---|${keys.map(() => '---:').join('|')}|`);
    BRACCI.forEach((b, i) => lines.push(`| ${b} | ${keys.map((k) => reasons[i][k] ?? 0).join(' | ')} |`));
  } else lines.push('Nessuno.');
  // 4. The trades' instructions, arm by arm: what T469 and T470 asked, counted on the programs kept (and, for the architect, on every answer).
  lines.push('', '### Le istruzioni dei mestieri, braccio per braccio', '');
  lines.push('| mestiere | che cosa si conta | prima | dopo |', '|---|---|---|---|');
  for (const [trade, what, count] of seguite(base)) lines.push(`| ${trade} | ${what} | ${count('prima')} | ${count('dopo')} |`);
  // 5. What the programs show of their trade's instructions.
  lines.push('', '### Che cosa mostrano i programmi delle istruzioni del loro mestiere', '');
  lines.push('| giro | concetto | braccio | indicatori |', '|---|---|---|---|');
  for (const e of all) {
    const i = e.indicatori;
    if (!i) continue;
    const show = Object.entries(i)
      .filter(([k, v]) => !['ottimaVoci'].includes(k) && v !== 0 && v !== false && !(Array.isArray(v) && !v.length) && !(v && typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length))
      .map(([k, v]) => `${k} ${Array.isArray(v) ? v.join('/') : v && typeof v === 'object' ? JSON.stringify(v).replace(/[{}"]/g, '').replace(/,/g, ', ') : v}`)
      .join(' · ');
    lines.push(`| ${e.giro} | ${e.concetto} | ${e.braccio} | ${show} |`);
  }
  const cost = sum(esitiIn(base).map((f) => costOfEsito(JSON.parse(fs.readFileSync(f, 'utf8')))));
  lines.push('', `Registro di ${path.relative(process.cwd(), base) || '.'}: ${usd(cost)} in tutto (Gemini a listino, OpenRouter come l'ha detto).`);
  const text = lines.join('\n') + '\n';
  fs.writeFileSync(path.join(base, 'tabella.md'), text);
  return text;
}

// --- The marks of the cache on OpenRouter (T468) ----------------------------------------------------------------------------------

/** OPENROUTER_API_KEY from the environment or from <root>/.env: never printed nor written. */
function openRouterKey(root: string): string | undefined {
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
  try {
    return /^OPENROUTER_API_KEY\s*=\s*"?([^"\r\n]+)"?/m.exec(fs.readFileSync(path.join(root, '.env'), 'utf8'))?.[1]?.trim() || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Whether the marks `cache_control` of T468 work on a real call (`systemParts`: a mark at the end of the common part, of the section and of
 * the examples): Opus 5.5 through OpenRouter with the game's adapter, four Sculptor's systems as `write` puts them together, each asking for
 * one word so that what is paid is the system. A the mason's (the cache written, or read if a call of the last five minutes wrote it), B the
 * same again (all of it read), C the landscaper's and D the joiner's (other trades: the common part read, their section and examples
 * written). OpenRouter says what it read and wrote (`cached_tokens`, `cache_write_tokens`) and what it cost.
 */
async function cacheOpus(o: Options): Promise<void> {
  const dir = path.join(o.base, 'cache-opus');
  const file = path.join(dir, 'esito.json');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const key = o.offline ? undefined : openRouterKey(o.root);
  if (!o.offline && !key) throw new Error(`nessuna OPENROUTER_API_KEY nell'ambiente né in ${path.join(o.root, '.env')}`);
  const raw: Array<Record<string, unknown>> = [];
  const fetchImpl: typeof fetch = o.offline
    ? ((async (_u: RequestInfo | URL, init?: RequestInit) => {
        const tokens = Math.round(String(init?.body ?? '').length / 4);
        return new Response(JSON.stringify({ choices: [{ message: { content: 'pronto' }, finish_reason: 'stop' }], usage: { prompt_tokens: tokens, completion_tokens: 2, cost: 0 } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }) as typeof fetch)
    : (async (url, init) => {
        const r = await fetch(url, { ...init, headers: { ...(init?.headers as Record<string, string>), Authorization: `Bearer ${key}`, 'X-Title': 'QUINE42 banco' } });
        try {
          const j = (await r.clone().json()) as { usage?: Record<string, unknown> };
          raw.push(j.usage ?? {});
        } catch {
          raw.push({});
        }
        return r;
      });
  const or = new OpenRouterAiModels({ endpoint: OPENROUTER_API, textModel: 'claude-opus-5-5', limits: { text: 8 }, thinking: 'low', timeout: o.timeout * 1000, fetchImpl });
  const ledger = new UsageLog();
  const records: CallRecord[] = [];
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: or });
  // After the boot: the kernel puts its own ledger on the models (`k.ai.onCall`), which the bench keeps and follows.
  const kernelCall = or.onCall;
  or.onCall = (r) => {
    kernelCall?.(r);
    records.push(r);
    ledger.record(r);
    if (!o.offline) register.live.record(r);
  };
  k.council.thinking = () => 'low';
  const files = k.council.files;
  // Two trades never asked before in the cache's five minutes: each reads the common part and writes its own (T468 § 2.3).
  const steps: Array<{ label: string; key: string }> = [
    { label: 'A, Capomastro', key: 'casetta' },
    { label: 'B, Capomastro di nuovo', key: 'casetta' },
    { label: 'C, Paesaggista', key: 'castagno' },
    { label: 'D, Mobiliere', key: 'baule' },
  ];
  const out: Array<Record<string, unknown>> = [];
  for (const s of steps) {
    if (!o.offline && register.spent() > o.tetto) throw new Error(`tetto del registro: ${usd(register.spent())} oltre ${usd(o.tetto)}`);
    const req = CONCETTI.find((c) => c.key === s.key)!.req!;
    const cls = classOf(req.classe)!;
    const spec = requestSpecialty(req);
    const role = sculptorRole(files, spec);
    const section = sculptorSection(files, spec);
    const examples = examplesFor(files, { ...req, classe: cls.id });
    const before = records.length;
    const fetched = raw.length;
    const t0 = Date.now();
    const answer = await k.council.write('sculptor', 'model.sculpt', `${req.nome}: do not write the program now. Answer with the single word «pronto».`, {
      role,
      system: [section, examples.length ? `## Examples (programs of the library)\n${examples.join('\n\n')}` : ''],
      model: 'claude-opus-5-5',
      temperature: 0.7,
      specialty: spec,
    });
    const r = records[before];
    // What OpenRouter said of this call (its own request: the adapter does not repeat one that was answered), the cache's reads and writes.
    const u = (raw[fetched] ?? {}) as { prompt_tokens?: number; cost?: number; prompt_tokens_details?: { cached_tokens?: number; cache_write_tokens?: number } };
    out.push({
      passo: s.label,
      specialita: spec,
      risposta: answer.slice(0, 40),
      secondi: Math.round((Date.now() - t0) / 1000),
      // The stable parts as `write` sends them: where each ends, in characters (`systemParts` puts a mark there).
      parti: { ruolo: role.length, sezione: section.length, esempi: examples.length },
      prompt: u.prompt_tokens ?? r?.prompt,
      letti: u.prompt_tokens_details?.cached_tokens ?? r?.cached,
      scritti: u.prompt_tokens_details?.cache_write_tokens,
      usd: u.cost ?? r?.usd,
      registrata: !!r,
      usage: u,
    });
    console.log(`${s.label}: ${JSON.stringify(out[out.length - 1])}`);
  }
  // The dollars as OpenRouter said them, call by call (what the register counts), and the ledger's beside them (the same, if every call came back).
  const said = out.reduce((sum, c) => sum + (typeof c.usd === 'number' ? c.usd : 0), 0);
  const tot = ledger.total();
  fs.writeFileSync(file, JSON.stringify({ cacheOpus: true, giro: 'cache-opus', usd: Number(Math.max(said, tot.usd).toFixed(6)), usdOpenRouter: Number(Math.max(said, tot.usd).toFixed(6)), registro: Number(tot.usd.toFixed(6)), chiamate: out }, null, 1));
  console.log(`cache-opus: ${usd(said)} detti da OpenRouter (${usd(tot.usd)} nel registro del banco) · registro ${usd(register.spent())}`);
}

// --- Entry ---------------------------------------------------------------------------------------------------------------------------

export async function specialita(argv: string[]): Promise<void> {
  const args = argv.filter((a) => a !== '--');
  const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
  const o: Options = {
    base: path.resolve(opt('out') ?? 'lab/banco/specialita'),
    giro: opt('giro') ?? 'giro1',
    bracci: (opt('bracci')?.split(',').filter((b): b is Braccio => (BRACCI as readonly string[]).includes(b)) ?? [...BRACCI]) as Braccio[],
    ...(opt('solo') ? { solo: opt('solo')!.split(',') } : {}),
    tetto: Number(opt('tetto') ?? 6),
    offline: args.includes('--offline'),
    thinking: (opt('pensiero') ?? 'low') as Thinking,
    root: path.resolve(opt('root') ?? (fs.existsSync('.env') ? '.' : '../../..')),
    timeout: Number(opt('timeout') ?? 300),
  };
  if (args.includes('--tabella')) {
    console.log(tabella(o.base));
    return;
  }
  // The register before this run: every esito of BASE but the ones it rewrites.
  const rewritten = new Set(
    args.includes('--cache-opus') ? [path.join(o.base, 'cache-opus', 'esito.json')] : o.bracci.flatMap((b) => CONCETTI.filter((c) => !o.solo || o.solo.includes(c.key)).map((c) => path.join(o.base, o.giro, b, c.key, 'esito.json'))),
  );
  register.before = esitiIn(o.base)
    .filter((f) => !rewritten.has(f))
    .reduce((s, f) => s + costOfEsito(JSON.parse(fs.readFileSync(f, 'utf8'))), 0);
  console.log(`Registro di ${o.base}: ${usd(register.before)} prima di questo giro, tetto ${usd(o.tetto)}${o.offline ? ' (offline: nessuna chiamata pagata)' : ''}`);
  if (args.includes('--cache-opus')) {
    await cacheOpus(o);
    return;
  }
  if (!args.includes('--misura')) {
    // The two prompts are what they say: the one of before has no core (whole to every trade), today's has it.
    const prima = armFiles('prima');
    if (hasCore(prima) || !hasCore(armFiles('dopo'))) throw new Error('i due prompt non sono quelli della prova: prima senza il nucleo, dopo col nucleo');
    for (const b of o.bracci) {
      const f = armFiles(b);
      console.log(`${b}: ${['landscaper', 'joiner', 'tailor', 'figurist', 'mason', 'architect', 'coachbuilder', 'actions'].map((s) => `${s} ${sculptorRole(f, s as SculptorSpecialty).length}+${sculptorSection(f, s as SculptorSpecialty, 'joiner').length}`).join(' · ')} caratteri (ruolo+sezione)`);
    }
    const key = o.offline ? undefined : readKey(o.root);
    const todo = CONCETTI.filter((c) => !o.solo || o.solo.includes(c.key));
    // The arms side by side, each concept after concept in the order of the trades.
    await Promise.all(o.bracci.map(async (b) => {
      for (const c of todo) {
        try {
          await one(o, b, c, key);
        } catch (e) {
          console.log(`${o.giro} ${b} ${c.key}: interrotto (${(e as Error).message})`);
        }
      }
    }));
  }
  misuraGiro(o);
  console.log(tabella(o.base));
}
