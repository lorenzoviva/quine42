// What Claude Cloud made, and where it goes in the four universes one can explore (T273): the structures of lab/banco/catalogo-cloud/,
// the procedural seed models of lab/banco/seme-procedurale/, the props of lab/banco/props-tematici/ and the sounds of lab/banco/suoni-cloud/.
// `integra.ts` writes them into the universes, `tests/universi-cloud.test.ts` and the checks read them back from here.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ownModelId } from '../../../../src/kernel/modeldirector';
import { Kernel } from '../../../../src/kernel/kernel';
import { memoryStore } from '../../../../src/kernel/repo';
import { MockAiModels } from '../../../../src/kernel/ai/mock';
import { boxOf, classOf, RARE_SIZES } from '../../../../src/mj/classes';
import { cellarOf, rootTag, vptOf, type ModelInfo } from '../../../../src/kernel/forms';
import { modelErrors } from '../../../../src/kernel/validator';
import { withSize } from '../../../../src/kernel/agents/sculptor';
import type { ChunkPlan } from '../../../../src/kernel/agents/cartography';
import type { ChunkRecord } from '../../../../src/kernel/chunks';
import type { FileMap } from '../../../../src/kernel/types';
import { leggiUniverso, negozioMappe, prefissoMappe } from './carica';

/** The project's root, whatever the directory one runs from. */
export const PROGETTO = new URL('../../../../', import.meta.url).pathname;
const LAB = join(PROGETTO, 'lab/banco');

export type Tema = 'fantasy' | 'steampunk' | 'moderno' | 'futuristico';

export interface Universo {
  nome: string;
  tema: Tema;
  /** Where its files are, from the project's root. */
  radice: string;
  /** Where its maps are: the seed has none of its own, so aurora's live beside the others (never in `universe/`, see INTEGRAZIONE.md). */
  mappe: string;
}

export const UNIVERSI: Universo[] = [
  { nome: 'aurora', tema: 'fantasy', radice: 'universe', mappe: 'lab/banco/universi-cloud/aurora/maps' },
  { nome: 'orichalcum', tema: 'steampunk', radice: 'lab/banco/universi-cloud/orichalcum', mappe: 'lab/banco/universi-cloud/orichalcum/maps' },
  { nome: 'neapolis', tema: 'moderno', radice: 'lab/banco/universi-cloud/neapolis', mappe: 'lab/banco/universi-cloud/neapolis/maps' },
  { nome: 'sidera', tema: 'futuristico', radice: 'lab/banco/universi-cloud/sidera', mappe: 'lab/banco/universi-cloud/sidera/maps' },
];

/** A universe as the kernel reads it: its files (`allowedPath`) and its maps, aurora's from beside it. */
export function leggi(u: Universo): { files: FileMap; maps: Record<string, ChunkRecord> } {
  const { files, maps } = leggiUniverso(join(PROGETTO, u.radice) + '/');
  const dir = join(PROGETTO, u.mappe);
  if (existsSync(dir))
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) maps[f.slice(0, -5)] = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  return { files, maps };
}

/** The place of a map's name (`<prefisso>_<cx>_<cy>`). */
export function luogoDi(files: FileMap, name: string): [number, number] | undefined {
  const prefix = prefissoMappe(files) + '_';
  if (!name.startsWith(prefix)) return undefined;
  const [cx, cy] = name.slice(prefix.length).split('_').map(Number);
  return Number.isInteger(cx) && Number.isInteger(cy) ? [cx, cy] : undefined;
}

// --- The structures ----------------------------------------------------------------------------------------------------------------------

export interface Struttura {
  tema: Tema;
  /** The catalogue's file, from lab/banco/catalogo-cloud/. */
  file: string;
  /** What a plan says (`strutture[].concetto`): the file's name in words, unless that is already a model of a universe. */
  concetto: string;
  /** The model the kernel looks for (`Kernel.lotsOf`): `struttura-` and the first 30 characters of `ownModelId(concetto)`. */
  id: string;
  nome: string;
  cantina: boolean;
  /** Which of the two catalogues: the first (T269) or its twin (the generator). */
  catalogo: 'primo' | 'gemello';
}

/** The concept the kernel names a structure's model by. */
export const modelloDi = (concetto: string) => `struttura-${ownModelId(concetto).slice(0, 30)}`;

/** Names that would meet a model a universe already has: neapolis has its own «mercato coperto» (T272). */
const CONCETTI: Record<string, string> = { 'moderno/mercato-coperto': 'mercato coperto rionale' };

const TEMI: Tema[] = ['fantasy', 'steampunk', 'moderno', 'futuristico'];

function gemello(): Map<string, { titolo: string; cantina: boolean }> {
  // The twin's catalogue is TypeScript with functions in it: its names and titles are read from the text, not imported (no side effects).
  const src = readFileSync(join(LAB, 'catalogo-cloud/catalogo-generatore.ts'), 'utf8');
  const out = new Map<string, { titolo: string; cantina: boolean }>();
  for (const m of src.matchAll(/nome: '([^']+)', titolo: '([^']+)'[^\n]*?cantina: (true|false)/g)) out.set(m[1], { titolo: m[2], cantina: m[3] === 'true' });
  return out;
}

export function strutture(tema?: Tema): Struttura[] {
  const twin = gemello();
  const out: Struttura[] = [];
  for (const t of TEMI) {
    if (tema && t !== tema) continue;
    const dir = join(LAB, 'catalogo-cloud', t);
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.xml')).sort()) {
      const nome = f.slice(0, -4);
      const key = `${t}/${nome}`;
      const concetto = CONCETTI[key] ?? nome.replace(/-/g, ' ');
      const json = join(dir, `${nome}.json`);
      if (existsSync(json)) {
        const r = JSON.parse(readFileSync(json, 'utf8'));
        out.push({ tema: t, file: `${key}.xml`, concetto, id: modelloDi(concetto), nome: r.titolo, cantina: !!r.cantina, catalogo: 'primo' });
      } else {
        const g = twin.get(nome);
        const titolo = concetto[0].toUpperCase() + concetto.slice(1);
        out.push({ tema: t, file: `${key}.xml`, concetto, id: modelloDi(concetto), nome: g ? `${titolo} (${g.titolo.toLowerCase()})` : titolo, cantina: g?.cantina ?? /ground="Z"/.test(readFileSync(join(dir, f), 'utf8')), catalogo: 'gemello' });
      }
    }
  }
  return out;
}

export const xmlStruttura = (s: Struttura) => readFileSync(join(LAB, 'catalogo-cloud', s.file), 'utf8');

// --- The seed, the props, the sounds -----------------------------------------------------------------------------------------------------

export interface Modello {
  id: string;
  /** The program, from lab/banco/. */
  file: string;
  voce: Record<string, unknown>;
}

/** The 24 seed models rewritten as procedural programs (T270): the same ids, the same classes, the seed's own names. */
export function semeProcedurale(): Modello[] {
  const index = JSON.parse(readFileSync(join(LAB, 'seme-procedurale/index.json'), 'utf8')) as Record<string, { classe: string; nome: string }>;
  return Object.entries(index).map(([id, v]) => ({ id, file: `seme-procedurale/${id}.xml`, voce: { classe: v.classe, nome: v.nome } }));
}

/** The ten props of a theme (T270). */
export function props(tema: Tema): Modello[] {
  const index = JSON.parse(readFileSync(join(LAB, `props-tematici/index-${tema}.json`), 'utf8')) as Record<string, { classe: string; nome: string }>;
  return Object.entries(index).map(([id, v]) => ({ id, file: `props-tematici/${id}.xml`, voce: { classe: v.classe, nome: v.nome, autore: 'Claude Cloud, props tematici (T270)' } }));
}

const BRANI: Record<string, string> = {
  'esplorazione-giorno': 'esplorazione di giorno',
  'esplorazione-notte': 'esplorazione di notte',
  'tensione-pericolo': 'pericolo',
  'luogo-sacro': 'luogo sacro',
  'citta-locanda': 'città e locanda',
  'sotterraneo-abisso': 'sotterraneo',
};

interface Uso {
  ambienti?: string[];
  momenti?: string[];
}
const GIORNO = ['mattina', 'giorno'];
const NOTTE = ['notte'];

/**
 * Where each piece of a theme plays (`models/index.json → suono`, `chooseMusic`): who names an environment exactly plays there, the last of the
 * index first, so the Cloud's pieces take a few environments each and leave the rest to the music each universe already had.
 */
const MUSICA: Record<string, Record<string, Uso>> = {
  aurora: {
    'citta-locanda': { ambienti: ['locanda', 'borgo_mattoni'], momenti: ['mattina', 'giorno', 'sera'] },
    'luogo-sacro': { ambienti: ['tempio', 'piramide'], momenti: GIORNO },
    'sotterraneo-abisso': { ambienti: ['dungeon', 'tana_drago'] },
    'tensione-pericolo': { ambienti: ['fortezza', 'caserma'], momenti: GIORNO },
    'esplorazione-giorno': { ambienti: ['bosco', 'campi', 'montagne'], momenti: GIORNO },
    'esplorazione-notte': { momenti: NOTTE },
  },
  orichalcum: {
    'citta-locanda': { ambienti: ['quartiere_mattoni', 'baracche'], momenti: ['mattina', 'giorno', 'sera'] },
    'luogo-sacro': { ambienti: ['rovine'], momenti: GIORNO },
    'sotterraneo-abisso': { ambienti: ['dungeon'] },
    'tensione-pericolo': { ambienti: ['magazzini_ramelli'], momenti: GIORNO },
    'esplorazione-giorno': { ambienti: ['bosco', 'campi', 'montagne', 'lago'], momenti: GIORNO },
    'esplorazione-notte': { momenti: NOTTE },
  },
  neapolis: {
    'citta-locanda': { ambienti: ['rione'], momenti: GIORNO },
    'luogo-sacro': { ambienti: ['collina'], momenti: GIORNO },
    'sotterraneo-abisso': { ambienti: ['officine'], momenti: GIORNO },
    'tensione-pericolo': { ambienti: ['stazione'], momenti: GIORNO },
    'esplorazione-giorno': { ambienti: ['parco'], momenti: GIORNO },
    'esplorazione-notte': { ambienti: ['lungomare', 'porto'], momenti: NOTTE },
  },
  sidera: {
    'citta-locanda': { ambienti: ['mercato_viadotti'], momenti: ['mattina', 'giorno', 'sera'] },
    'luogo-sacro': { ambienti: ['cupola'], momenti: GIORNO },
    'sotterraneo-abisso': { ambienti: ['relitti'] },
    'tensione-pericolo': { ambienti: ['cantiere_fusione'], momenti: GIORNO },
    'esplorazione-giorno': { ambienti: ['spazioporto', 'base_ascensore'], momenti: GIORNO },
    'esplorazione-notte': { momenti: NOTTE },
  },
};

const AUTORE_SUONI = 'Claude Cloud, colonna sonora ed effetti (T271)';

/**
 * The sounds of a universe: the six pieces of its theme, the nineteen effects, and the Death made again, in the place of the seed's (whose seeds
 * gave the same score: `modelErrors` sent it back as `ripetitivo`), under the same id, so that every universe of the seed's Death gets it.
 */
export function suoni(u: Universo): Modello[] {
  const out: Modello[] = [];
  for (const [tipo, label] of Object.entries(BRANI)) {
    const id = `suono-${u.tema}-${tipo}`;
    out.push({ id, file: `suoni-cloud/${u.tema}/${id}.xml`, voce: { classe: 'suono', nome: `${u.tema[0].toUpperCase()}${u.tema.slice(1)}: ${label}`, autore: AUTORE_SUONI, suono: { uso: 'musica', ...MUSICA[u.nome][tipo] } } });
  }
  for (const f of readdirSync(join(LAB, 'suoni-cloud/effetti')).filter((f) => f.endsWith('.xml')).sort()) {
    const id = f.slice(0, -4);
    const effetto = id.replace(/^suono-effetto-/, '');
    out.push({ id, file: `suoni-cloud/effetti/${f}`, voce: { classe: 'suono', nome: effetto[0].toUpperCase() + effetto.slice(1).replace(/-/g, ' '), autore: AUTORE_SUONI, suono: { uso: 'effetto', effetti: [effetto] } } });
  }
  out.push({ id: 'suono-effetto-morte', file: 'suoni-cloud/suono-effetto-morte-v2.xml', voce: { classe: 'suono', nome: 'Morte', autore: `${AUTORE_SUONI}: la Morte rifatta`, suono: { uso: 'effetto', effetti: ['morte'] } } });
  return out;
}

export const xmlDi = (m: Modello) => readFileSync(join(LAB, m.file), 'utf8');

/**
 * `modelErrors` on a model of a universe's library, in the box the library runs it in (`sizeFor` in src/kernel/forms.ts): its class's box at its
 * size, and as much deeper as its cellar (`sotto` tiles at its density). A program that says its own `size` runs in it.
 */
export function erroriModello(files: FileMap, id: string): string[] {
  const path = `models/${id}.xml`;
  const xml = files[path];
  if (xml === undefined) return [`${path}: manca`];
  const info = (JSON.parse(files['models/index.json']) as Record<string, ModelInfo>)[id];
  if (!info) return [`${path}: manca in models/index.json`];
  if (info.classe === 'suono' || /\ssize="/.test(rootTag(xml))) return modelErrors(path, xml, info.tempo ?? 8000);
  const cls = classOf(info.classe);
  if (!cls) return [`${path}: classe sconosciuta ${info.classe}`];
  const [X, Y, Z] = boxOf(cls, info.taglia);
  return modelErrors(path, withSize(xml, [X, Y, Z + cellarOf(info) * vptOf(info)]), info.tempo ?? 8000);
}

// --- Sidera's common houses ----------------------------------------------------------------------------------------------------------------

/**
 * Sidera had no `commonHouse` (ADR-0134): its common lots were the seed's cottages and half-timbered houses. Now they are its own living module
 * (T272) for the small lots and the twin catalogue's modular residence for the large ones: two programs already validated.
 */
export const CASA_SIDERA = 'moduli abitativi di lega bianca, bassi e tondi, con gli oblò accesi e le luci di posizione sul tetto';
export const CASE_SIDERA = { edificio: 'universi-cloud/sidera/models/sidera-modulo-abitativo.xml', grande: 'catalogo-cloud/futuristico/residenza-modulare.xml' } as const;
export const xmlLab = (file: string) => readFileSync(join(LAB, file), 'utf8');

// --- The lots ------------------------------------------------------------------------------------------------------------------------------

export interface Lotto {
  index: number;
  /** Width and height in tiles. */
  w: number;
  h: number;
  lato: number;
  area: number;
  /** Where its middle is in the world (kernel x, y). */
  x: number;
  y: number;
  modello: string;
  /** The model that is not there (ModelDirector would ask the Sculptor for it). */
  wanted?: string;
  struttura: { concetto: string; classe: string; taglia?: string; model?: string };
}

/**
 * The lots of a place as the kernel builds them from a plan (the model of places: `layoutOf` + `lotsOf`, pure, nothing in the world changes),
 * the largest first: the order in which the plan's structures take them.
 */
export function lotti(k: Kernel, cx: number, cy: number, plan: ChunkPlan): Lotto[] {
  const kk = k as any;
  const pathCode = kk.pathCode();
  const ch = { cx, cy, key: `${cx},${cy}`, draft: kk.genDraft(cx, cy) };
  const { result, tiles } = kk.layoutOf(ch, plan, pathCode, true);
  const { lots } = kk.lotsOf({ ...ch, tiles, lots: result.lots }, plan, pathCode) as { lots: Array<{ index: number; x: number; y: number; form: { model: string; wanted?: string }; struttura: Lotto['struttura'] }> };
  return lots.map((l) => {
    const b = result.lots[l.index];
    const w = b.x1 - b.x0 + 1, h = b.y1 - b.y0 + 1;
    return { index: l.index, w, h, lato: Math.max(w, h), area: w * h, x: l.x, y: l.y, modello: l.form.model, ...(l.form.wanted ? { wanted: l.form.wanted } : {}), struttura: l.struttura };
  });
}

// --- 4. Check: the kernel builds every structure placed, from the library, at the size the plan says --------------------------------------

export interface Collocata {
  cx: number;
  cy: number;
  luogo: string;
  ambiente: string;
  concetto: string;
  modello: string;
  taglia?: string;
  lotto: string;
  x: number;
  y: number;
  wanted?: string;
}

export async function collocate(files: FileMap, maps: Record<string, ChunkRecord>): Promise<{ strutture: Collocata[]; problemi: string[] }> {
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels(), chunks: negozioMappe(files, maps) });
  const kk = k as any;
  const out: Collocata[] = [];
  const problemi: string[] = [];
  let rare = 0;
  for (const [name, rec] of Object.entries(maps)) {
    const at = luogoDi(files, name);
    if (!at) continue;
    const plan: ChunkPlan = JSON.parse(JSON.stringify(rec.plan));
    const before = JSON.stringify(plan.strutture ?? []);
    // claimSizes on a chunk with the lots of the plan: nothing it would change (a size that does not fit, a second Enorme).
    const ls = lotti(k, at[0], at[1], plan);
    const sizes = (plan.strutture ?? []).map((s) => s.taglia);
    kk.claimSizes({ cx: at[0], cy: at[1], key: `${at[0]},${at[1]}`, lots: ls.map((l) => ({ x0: 0, y0: 0, x1: l.w - 1, y1: l.h - 1 })) }, plan);
    if (JSON.stringify(plan.strutture ?? []) !== before) problemi.push(`${name}: claimSizes cambia le taglie (${JSON.stringify(sizes)} → ${JSON.stringify(plan.strutture?.map((s) => s.taglia))})`);
    for (const [i, s] of (plan.strutture ?? []).entries()) {
      const l = ls[i];
      if (!l) {
        problemi.push(`${name}: «${s.concetto}» non ha un lotto`);
        continue;
      }
      if (s.taglia && RARE_SIZES.includes(s.taglia)) rare++;
      if (l.wanted) problemi.push(`${name}: «${s.concetto}» manca dalla libreria (${l.wanted})`);
      if (l.modello !== l.struttura.model) problemi.push(`${name}: «${s.concetto}» diventa ${l.modello}, non ${l.struttura.model}`);
      out.push({ cx: at[0], cy: at[1], luogo: plan.place.name, ambiente: plan.layout, concetto: s.concetto, modello: l.modello, ...(s.taglia ? { taglia: s.taglia } : {}), lotto: `${l.w}×${l.h}`, x: l.x, y: l.y, ...(l.wanted ? { wanted: l.wanted } : {}) });
    }
    for (const l of ls) if (l.wanted) problemi.push(`${name}: il lotto ${l.index} (${l.struttura.concetto}) vuole ${l.wanted}`);
  }
  if (rare > 1) problemi.push(`${rare} strutture rare in una zona sola`);
  return { strutture: out, problemi };
}
