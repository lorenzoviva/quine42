// Bringing cards into a universe before it starts (T295, ADR-0170). A universe born from the seed may take, before its Genesis, models
// and sounds that are cards elsewhere: of the universes that have its root (the first commit, the same for every universe born from the
// seed of one contract, `server/git.ts`) and the handmade cards (ADR-0161); a clone may, before its first wanderer enters. Then the choice
// closes. Here what needs no disk: which entries of a universe are cards one may bring, the entry a card becomes where it enters (what the
// game reads of it, checked, with its card: one more link in the chain, the master who brings it its holder, as in a clone that passes the
// cards, ADR-0084), the doubles, the choice open or closed. Pure: the store (server/bring.ts) and the kernel read the same.

import type { CardStamp } from './cards';
import { MODELS_DIR, MODELS_INDEX, type ModelInfo } from './forms';
import { contentText, fingerprint, HANDMADE_ID_RE, HANDMADE_ORIGIN, readOrigins, type CardOrigin } from './heritage';
import { internalCardsIn, internalFields } from './internalNames';
import { UNIVERSE_NAME_RE } from './paths';
import type { CardChoice, FileMap } from './types';
import { validWandererId } from './wandererIds';
import { classOf, densityFor, densityOf, growsByRules, sizeOf, TILE, tilesOf } from '../mj/classes';
import { soundPrograms, SOUND_CLASS, type SoundPurpose } from '../mj/sound';

/** A card the master chooses: a model or a sound of a universe, or a handmade card. Only names: what it is, the store reads from the disk. */
export type BringRef = { universe: string; model: string } | { handmade: string };

/** At most this many cards in one choice: each one is checked on the engine (V-033). */
export const BRING_MAX = 24;

/** A model's id, as the library names them (validator.ts `MODEL_RE`). */
const MODEL_ID_RE = /^[a-z0-9][a-z0-9-]{0,40}$/i;

/** The model id a choice brings: the model's own, or the handmade card's (a valid model id, ADR-0161). Never another one: a card is not renamed. */
export const broughtId = (ref: BringRef): string => ('handmade' in ref ? ref.handmade : ref.model);

/** How a choice is said in a reason: «aurora/npc-mugnaio», or the handmade card's id. */
export const refText = (ref: BringRef): string => ('handmade' in ref ? ref.handmade : `${ref.universe}/${ref.model}`);

/** What a client says it chooses, read: names that are names, at most `BRING_MAX`; anything else is a reason. */
export function readBringRefs(raw: unknown): { refs: BringRef[] } | { error: string } {
  if (!Array.isArray(raw) || !raw.length) return { error: 'cards: un elenco di carte da portare' };
  if (raw.length > BRING_MAX) return { error: `al più ${BRING_MAX} carte alla volta` };
  const refs: BringRef[] = [];
  for (const r of raw) {
    const o = r && typeof r === 'object' ? (r as Record<string, unknown>) : {};
    if (typeof o.handmade === 'string' && HANDMADE_ID_RE.test(o.handmade)) refs.push({ handmade: o.handmade });
    else if (typeof o.universe === 'string' && UNIVERSE_NAME_RE.test(o.universe) && typeof o.model === 'string' && MODEL_ID_RE.test(o.model)) refs.push({ universe: o.universe, model: o.model });
    else return { error: 'ogni carta è { universe, model } oppure { handmade }' };
  }
  return { refs };
}

/** A card of a universe one may bring, as the choice shows it. */
export interface KinCard {
  id: string;
  kind: 'model' | 'sound';
  name: string;
  class?: string;
  size?: string;
  /** A piece of music: the environments it plays in. */
  environments?: string[];
  /** The Artist's vote where it was born. */
  score?: number;
}

const parse = (src: string | undefined): any => {
  try {
    return JSON.parse(src ?? 'null');
  } catch {
    return null;
  }
};

const isCardStamp = (c: any): c is CardStamp => !!c && typeof c === 'object' && typeof c.author === 'string' && typeof c.payer === 'string' && typeof c.holder === 'string';

/** A name in a stamp or a chain: an agent's (`sculptor`), a wanderer's id, or `comune`. Short and plain: another universe wrote it. */
const plainName = (s: unknown): s is string => typeof s === 'string' && (s === 'comune' || validWandererId(s) || /^[a-z][a-z-]{1,30}$/.test(s));

/** Links a chain may have: one per clone or choice it passed, far more than a card meets (V-033). */
export const MAX_LINKS = 32;

/** A universe's index as this kernel reads it: the fields and the stamps of before the contract 0.4 read internal (T308a). */
export function readIndex(files: FileMap): Record<string, Record<string, any>> {
  const raw = internalFields('modelIndex', (internalCardsIn(parse(files[MODELS_INDEX])) ?? {}) as Record<string, Record<string, any>>);
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
}

/**
 * The cards of a universe one may bring: the entries of its library that are cards (generated, with a `card`; the seed's are in every
 * universe, and nobody's), with their program, a model of a known class or a sound. In the order of their ids.
 */
export function kinCards(files: FileMap): KinCard[] {
  const index = readIndex(files);
  const sounds = new Map(soundPrograms(files).map((p) => [p.id, p.sound]));
  const out: KinCard[] = [];
  for (const id of Object.keys(index).sort()) {
    const e = index[id];
    if (!MODEL_ID_RE.test(id) || !e || typeof e !== 'object' || !isCardStamp(e.card) || files[`${MODELS_DIR}${id}.xml`] === undefined) continue;
    const name = typeof e.name === 'string' && e.name.trim() ? e.name.trim().slice(0, 120) : id;
    const score = typeof e.score === 'number' && Number.isFinite(e.score) ? Math.max(0, Math.min(10, Math.round(e.score))) : undefined;
    if (e.class === SOUND_CLASS) {
      const sound = sounds.get(id);
      out.push({ id, kind: 'sound', name, ...(sound?.environments?.length ? { environments: sound.environments.slice(0, 8) } : {}), ...(score !== undefined ? { score } : {}) });
    } else if (classOf(e.class)) {
      out.push({ id, kind: 'model', name, class: e.class, ...(sizeOf(e.size) ? { size: e.size } : {}), ...(score !== undefined ? { score } : {}) });
    }
  }
  return out;
}

/** What the store read of a card from the disk, for the entry it becomes. */
export type BringSource =
  | {
      kind: 'model' | 'sound';
      /** The universe it comes from. */
      universe: string;
      id: string;
      /** Its entry in that universe's index (read by `readIndex`), with its card. */
      entry: Record<string, any>;
      xml: string;
      /** Its name, already checked (a text of another universe: server/bring.ts). */
      name: string;
    }
  | {
      kind: 'model' | 'sound';
      handmade: true;
      id: string;
      xml: string;
      name: string;
      class?: string;
      size?: string;
      /** The author's wanderer: the card names them in its chain, as every card names its holders (ADR-0102). */
      author: string;
      origins?: CardOrigin[];
    };

/** The size of an entry and the density its box runs at (as `modelSize` writes them): only a size that is not its class's own. */
function sized(classe: string, size: unknown, own?: unknown, handmade = false): Pick<ModelInfo, 'size' | 'vpt'> {
  const cls = classOf(classe), t = sizeOf(typeof size === 'string' ? size : undefined);
  if (!cls || !t || t.id === cls.taglia) return {};
  // A structure that grows by rules keeps the density it was sculpted at (ADR-0179): 16 at Huge before, TILE at every size now.
  const kept = growsByRules(cls, t.id) && typeof own === 'number' && Number.isInteger(own) && own >= 4 && own <= TILE ? own : undefined;
  // A handmade card runs where it was tried, under MAX_SIDE (its ceilings, ADR-0161).
  const vpt = kept ?? (handmade ? densityOf(tilesOf(cls, t.id)) : densityFor(cls, t.id));
  return { size: t.id, ...(vpt !== TILE ? { vpt } : {}) };
}

/** A sound's purpose as this kernel reads it, from the entry and its program: what does not read as one is no purpose. */
function purposeOf(id: string, entry: Record<string, any>, xml: string): SoundPurpose | undefined {
  return soundPrograms({ [MODELS_INDEX]: JSON.stringify({ [id]: { class: SOUND_CLASS, sound: entry.sound } }), [`${MODELS_DIR}${id}.xml`]: xml })[0]?.sound;
}

/**
 * The entry a brought card becomes in the universe it enters (the master's, `master`): only what the game reads of a model, each field
 * checked (a size of D&D and the density it runs at, the cellar, the seeds, the vote, the tint letter, a sound's purpose; not its own time,
 * nor the Artist's notes of another world), with `brought` and its card. The card keeps who wrote it and who paid for it; its holder is the
 * master who brings it; its chain grows by one link, its holder where it was and the fingerprint of the content as it enters (the entry,
 * ADR-0084; the program for a handmade card, ADR-0161), so what a use owes along the chain is counted from here, as in a clone.
 */
export function broughtEntry(src: BringSource, master: string): { info: ModelInfo & { card: CardStamp } } | { error: string } {
  if (!validWandererId(master)) return { error: 'il master non è un viandante' };
  const classe = src.kind === 'sound' ? SOUND_CLASS : 'handmade' in src ? src.class : src.entry.class;
  if (typeof classe !== 'string' || (src.kind === 'model' && !classOf(classe))) return { error: 'un modello senza una classe che questo kernel conosce' };
  const e: Record<string, any> = 'handmade' in src ? { size: src.size } : src.entry;
  const info: ModelInfo = { class: classe, name: src.name };
  if (src.kind === 'model') Object.assign(info, sized(classe, e.size, e.vpt, 'handmade' in src));
  if (Number.isInteger(e.cellar) && e.cellar >= 1 && e.cellar <= 3) info.cellar = e.cellar;
  if (Number.isInteger(e.seeds) && e.seeds >= 1 && e.seeds <= 8) info.seeds = e.seeds;
  if (typeof e.score === 'number' && Number.isFinite(e.score)) info.score = Math.max(0, Math.min(10, Math.round(e.score)));
  if (typeof e.tint === 'string' && /^[A-Za-z]$/.test(e.tint)) info.tint = e.tint;
  if (typeof e.author === 'string' && /^[\p{L}\p{N} ._:-]{1,60}$/u.test(e.author)) info.author = e.author;
  if (src.kind === 'sound') {
    const sound = purposeOf(src.id, 'handmade' in src ? {} : e, src.xml);
    if (sound) info.sound = sound;
  }
  info.brought = 'handmade' in src ? HANDMADE_ORIGIN : src.universe;
  let stamp: { author: string; payer: string; holder: string; origins: CardOrigin[] };
  if ('handmade' in src) {
    if (!validWandererId(src.author)) return { error: 'una carta fatta a mano senza autore' };
    stamp = { author: src.author, payer: src.author, holder: src.author, origins: src.origins ?? [] };
  } else {
    const c = src.entry.card;
    if (!isCardStamp(c)) return { error: 'non è una carta (i modelli del seme non si portano: sono già in ogni universo)' };
    // Another universe wrote this stamp: its names are names, or the card does not come (V-033).
    if (![c.author, c.payer, c.holder].every(plainName)) return { error: 'il suo timbro non si legge' };
    stamp = { author: c.author, payer: c.payer, holder: c.holder, origins: readOrigins(c.origins) };
    if (stamp.origins.length !== (Array.isArray(c.origins) ? c.origins.length : 0)) return { error: 'la sua catena non si legge' };
  }
  if (stamp.origins.length > MAX_LINKS || !stamp.origins.every((o) => plainName(o.holder) && (UNIVERSE_NAME_RE.test(o.universe) || o.universe === HANDMADE_ORIGIN) && o.fingerprint.length <= 64)) return { error: 'la sua catena non si legge' };
  // What it is as it enters: a handmade card by its program, as `allCards` measures it here; any other by the entry it becomes.
  const now = HANDMADE_ID_RE.test(src.id) ? fingerprint(src.xml) : fingerprint(contentText(info));
  const origins: CardOrigin[] = [...stamp.origins, { holder: stamp.holder, universe: info.brought, fingerprint: now }];
  return { info: { ...info, card: { author: stamp.author, payer: stamp.payer, holder: master, origins } } };
}

/**
 * The doubles of a choice, id → why: two choices that bring the same id (the same model of two universes, a handmade card chosen twice),
 * and an id the universe has already (its program or its entry). Said before anything starts; nothing is renamed.
 */
export function doubles(refs: BringRef[], has: (id: string) => boolean): Map<string, string> {
  const out = new Map<string, string>();
  const by = new Map<string, BringRef[]>();
  for (const r of refs) by.set(broughtId(r), [...(by.get(broughtId(r)) ?? []), r]);
  for (const [id, rs] of by) {
    if (has(id)) out.set(id, `«${id}» c'è già in questo universo`);
    else if (rs.length > 1) out.set(id, `due carte con lo stesso id «${id}»: ${rs.map(refText).join(', ')}; scegline una`);
  }
  return out;
}

/** The library's index with the brought entries added: what was there stays as it is. */
export function withBrought(indexText: string | undefined, entries: Record<string, ModelInfo>): string {
  const index = parse(indexText);
  const base = index && typeof index === 'object' && !Array.isArray(index) ? index : {};
  return JSON.stringify({ ...base, ...entries }, null, 1) + '\n';
}

/** Whether, and how, the choice of the cards is open in a universe.json (T295): absent, or anything but `seed` and `clone`, is closed. */
export function cardChoiceIn(universeJson: string | undefined): CardChoice | undefined {
  const c = parse(universeJson)?.cardChoice;
  return c === 'seed' || c === 'clone' ? c : undefined;
}

/** universe.json with the choice opened (`seed`, `clone`) or closed (undefined); a file that does not read stays as it is. */
export function withCardChoice(universeJson: string, choice: CardChoice | undefined): string {
  const raw = parse(universeJson);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return universeJson;
  const { cardChoice: _gone, ...rest } = raw;
  return JSON.stringify(choice ? { ...rest, cardChoice: choice } : rest, null, 2) + '\n';
}

/** Two names that say the same thing: without case, accents and punctuation («Il Mugnaio» is «il mugnaio»). */
export function sameName(a: string | undefined, b: string | undefined): boolean {
  const norm = (s: string | undefined) => (s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  return !!norm(a) && norm(a) === norm(b);
}

/** The classes of what the Narrator casts (people, animals, beasts, things, furniture): a brought model of these may be worn by name. */
export const CAST_CLASSES = new Set(['person', 'animal', 'beast', 'object', 'furniture']);

/** A handmade card in the choice (rule 8f: what `handmadeSummary` says, never the author). */
export interface KinHandmade {
  id: string;
  kind: 'model' | 'sound';
  name: string;
  class?: string;
  size?: string;
  /** How the author signs. */
  signature: string;
  /** Whether it is the asker's own. */
  mine: boolean;
}

/** What the choice shows: whether it is open, the kin universes and their cards, the handmade cards. */
export interface KinView {
  open: boolean;
  reason?: string;
  choice?: CardChoice;
  contract: string;
  kin: Array<{ name: string; kernel: string; ok: boolean; reason?: string; cards: KinCard[] }>;
  handmade: KinHandmade[];
}

/** A card refused, and why. */
export interface BringRefusal {
  card: string;
  reason: string;
  errors?: string[];
}

/** What the store answers to a choice: what came and the files it wrote, or why nothing did. */
export type BringAnswer =
  | { ok: true; head: string | null; brought: Array<{ id: string; kind: 'model' | 'sound'; name: string; from: string }>; changes: Record<string, string> }
  | { ok: false; reason: string; cards?: BringRefusal[] };

/** The models of a library that came with a choice of cards: their id and entry, the structures and the music first in what reads them. */
export function broughtModels(files: FileMap): Array<{ id: string; info: ModelInfo }> {
  const index = readIndex(files);
  return Object.keys(index)
    .sort()
    .filter((id) => typeof index[id]?.brought === 'string' && files[`${MODELS_DIR}${id}.xml`] !== undefined)
    .map((id) => ({ id, info: index[id] as ModelInfo }));
}
