// The cards (T36, ADR-0056; P#2 of the multiplayer plan): every generated piece of content — a module, an
// item, an environment, a model, a place, a person, a plot, a rule, a spell, a recipe — carries who wrote it
// and who paid for it (`carta`), and is a card of one wanderer. What every wanderer pays for is theirs; what
// the world pays for (the Genesis, the sessions of the Council, the horizontal plots, the reviews) is common,
// and goes to one wanderer drawn with the seed of the universe. `world/carte.json` keeps how often each card is
// used (in a place, in a plot, in a prompt) and the cards of the places, whose plans live outside the text of
// the universe (maps/). Pure functions and a small ledger: the kernel stamps and counts.

import { slug } from './graph';
import { hash32, hashStr } from './rng';
import { MODELS_INDEX } from './forms';
import { readPlots } from './plots';
import { readPeople } from './society';
import type { FileMap, Manifest } from './types';

/** The payer of what the whole world asks for. */
export const COMUNE = 'comune';
export const CARDS_FILE = 'world/carte.json';

/** Who wrote a piece of content (an agent, or a wanderer's id) and who paid for it (a wanderer's id or `comune`). */
export interface Carta {
  autore: string;
  pagante: string;
  /** Whose card it is: the payer, or for common content the wanderer drawn with the seed. */
  titolare: string;
}

/**
 * The tasks the whole world pays for (decision 4): the Genesis, the Council's sessions, plots and what the
 * people do among themselves, the reviews and repairs, the models the library lacks. Every other call is paid
 * by the wanderer it is made for (the place they explore, their chats, their «Altro…», their requests).
 */
const COMMON_TASK = /^(genesis\.|council\.|plot\.|review\.|npc\.dialogue$|forge\.fix$|model\.(sculpt|judge|resculpt)$|content\.)/;

export function isCommonTask(task: string): boolean {
  return COMMON_TASK.test(task);
}

/** Who pays for a call or a piece of content: `comune`, or the wanderer acting when it was asked. */
export function payerOf(task: string, wanderer: string): string {
  return isCommonTask(task) ? COMUNE : wanderer;
}

/**
 * Whose card a piece of content is. Common content goes to one of the wanderers, drawn from the seed of the
 * universe and the card's id (not the tick: the same card goes to the same wanderer in every kernel).
 */
export function titolareOf(cardId: string, pagante: string, wanderers: string[], seed: number): string {
  if (pagante !== COMUNE) return pagante;
  const all = [...new Set(wanderers)].sort();
  return all.length ? all[hash32(seed, hashStr(cardId)) % all.length] : COMUNE;
}

export type CardKind = 'modulo' | 'oggetto' | 'ambiente' | 'incantesimo' | 'ricetta' | 'modello' | 'luogo' | 'persona' | 'trama' | 'regola';

export interface Uses {
  /** Places it entered (a thing, an environment, a structure). */
  luoghi: number;
  /** Plots it is part of. */
  trame: number;
  /** Prompts it went into, as context of a task (the focus of the graph). */
  prompt: number;
}

export const emptyUses = (): Uses => ({ luoghi: 0, trame: 0, prompt: 0 });

/** A card in a collection: an id like the graph's (`tipo:`, `oggetto:`, `luogo:cx_cy`…, `modello:<id>`). */
export interface Card extends Carta {
  id: string;
  tipo: CardKind;
  nome: string;
  /** The file it lives in (`maps/` for places). */
  file: string;
  utilizzi: Uses;
}

/** world/carte.json */
export interface CardsFile {
  utilizzi: Record<string, Uses>;
  /** The places' cards (their plans are in maps/, outside the text of the universe). */
  luoghi: Record<string, Carta & { nome: string }>;
}

const parse = (src: string | undefined): any => {
  try {
    return JSON.parse(src ?? 'null');
  } catch {
    return null;
  }
};

const isCarta = (c: any): c is Carta => !!c && typeof c === 'object' && typeof c.autore === 'string' && typeof c.pagante === 'string' && typeof c.titolare === 'string';

/** The card id of a module: an item module is an `oggetto`, any other one a `tipo` (as in the graph). */
export function moduleCardId(m: Pick<Manifest, 'id' | 'kind'>): string {
  return `${m.kind === 'item' ? 'oggetto' : 'tipo'}:${slug(m.id)}`;
}

export const placeCardId = (cx: number, cy: number) => `luogo:${cx}_${cy}`;

/** Every card the universe has: the stamped content of its files and the places of world/carte.json. */
export function allCards(files: FileMap): Card[] {
  const ledger = readCards(files);
  const out: Card[] = [];
  const push = (id: string, tipo: CardKind, nome: string, file: string, c: unknown) => {
    if (isCarta(c)) out.push({ id, tipo, nome, file, autore: c.autore, pagante: c.pagante, titolare: c.titolare, utilizzi: { ...emptyUses(), ...ledger.utilizzi[id] } });
  };
  for (const file of Object.keys(files).sort()) {
    if (!/^modules\/[^/]+\/manifest\.json$/.test(file)) continue;
    const m = parse(files[file]) as Manifest & { carta?: Carta } | null;
    if (!m?.id) continue;
    if (m.kind !== 'data') push(moduleCardId(m), m.kind === 'item' ? 'oggetto' : 'modulo', m.name ?? m.id, file, m.carta);
    // What a data module holds is a card each, of whoever made the module unless it says otherwise.
    for (const it of m.items ?? []) push(`oggetto:${slug(it.id)}`, 'oggetto', it.name ?? it.id, file, (it as { carta?: Carta }).carta ?? m.carta);
    for (const [lid, l] of Object.entries(m.layouts ?? {})) push(`ambiente:${slug(lid)}`, 'ambiente', l.name ?? lid, file, (l as { carta?: Carta }).carta ?? m.carta);
    for (const [seq, s] of Object.entries(m.spells ?? {})) push(`incantesimo:${slug(s.name ?? seq)}`, 'incantesimo', s.name ?? seq, file, (s as { carta?: Carta }).carta ?? m.carta);
    for (const r of m.recipes ?? []) push(`ricetta:${slug(r.id)}`, 'ricetta', r.name ?? r.id, file, (r as { carta?: Carta }).carta ?? m.carta);
  }
  for (const [id, info] of Object.entries((parse(files[MODELS_INDEX]) ?? {}) as Record<string, { nome?: string; carta?: Carta }>)) push(`modello:${slug(id)}`, 'modello', info?.nome ?? id, MODELS_INDEX, info?.carta);
  for (const [key, c] of Object.entries(ledger.luoghi)) push(`luogo:${key}`, 'luogo', c.nome || key, 'maps/', c);
  for (const p of readPeople(files).persone) push(`persona:${slug(p.nome)}`, 'persona', p.nome, 'world/people.json', (p as { carta?: Carta }).carta);
  for (const t of readPlots(files)) push(`trama:${slug(t.id)}`, 'trama', t.titolo, 'world/plots.json', (t as { carta?: Carta }).carta);
  for (const r of (parse(files['world/rules.json'])?.regole ?? []) as Array<{ chiave?: string; testo?: string; carta?: Carta }>)
    if (r?.chiave) push(`regola:${slug(r.chiave)}`, 'regola', r.testo ?? r.chiave, 'world/rules.json', r.carta);
  return out;
}

/** A wanderer's collection: the cards that are theirs, the most used first. */
export function collectionOf(files: FileMap, wanderer: string): Card[] {
  const used = (c: Card) => c.utilizzi.luoghi + c.utilizzi.trame + c.utilizzi.prompt;
  return allCards(files)
    .filter((c) => c.titolare === wanderer)
    .sort((a, b) => used(b) - used(a) || a.id.localeCompare(b.id));
}

export function readCards(files: FileMap): CardsFile {
  const f = parse(files[CARDS_FILE]);
  const utilizzi: Record<string, Uses> = {};
  for (const [id, u] of Object.entries((f?.utilizzi ?? {}) as Record<string, Partial<Uses>>)) {
    const n = (v: unknown) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.floor(Number(v)) : 0);
    utilizzi[id] = { luoghi: n(u?.luoghi), trame: n(u?.trame), prompt: n(u?.prompt) };
  }
  const luoghi: CardsFile['luoghi'] = {};
  for (const [key, c] of Object.entries((f?.luoghi ?? {}) as Record<string, any>)) if (isCarta(c)) luoghi[key] = { autore: c.autore, pagante: c.pagante, titolare: c.titolare, nome: String((c as { nome?: unknown }).nome ?? '') };
  return { utilizzi, luoghi };
}

/** The kernel's ledger of the cards' uses: counted as the world is played, written before every commit. */
export class CardLedger {
  private file: CardsFile = { utilizzi: {}, luoghi: {} };
  /** Bumped at every change: the kernel writes the file when it changed. */
  version = 0;

  load(files: FileMap): void {
    this.file = readCards(files);
  }

  /** Counts one use of each card (an id that is not a card is not counted). */
  use(ids: Iterable<string>, kind: keyof Uses, isCard: (id: string) => boolean): void {
    let changed = false;
    for (const id of new Set(ids)) {
      if (!isCard(id)) continue;
      (this.file.utilizzi[id] ??= emptyUses())[kind]++;
      changed = true;
    }
    if (changed) this.version++;
  }

  /** A place planned for the first time becomes a card. */
  addPlace(key: string, nome: string, carta: Carta): void {
    if (this.file.luoghi[key]) return;
    this.file.luoghi[key] = { ...carta, nome };
    this.version++;
  }

  hasPlace(key: string): boolean {
    return !!this.file.luoghi[key];
  }

  uses(id: string): Uses {
    return { ...emptyUses(), ...this.file.utilizzi[id] };
  }

  toJson(): string {
    const sorted = <T>(o: Record<string, T>) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
    return JSON.stringify({ utilizzi: sorted(this.file.utilizzi), luoghi: sorted(this.file.luoghi) } satisfies CardsFile, null, 1) + '\n';
  }
}

type Stampable = { carta?: Carta };

/**
 * The entries of a file that can be cards, by card id (the module itself, what a data module holds, people…).
 * Rules are not here: the kernel writes facts there too, and stamps the judgements itself (recordRule).
 */
function entriesOf(path: string, data: any): Map<string, Stampable> {
  const out = new Map<string, Stampable>();
  if (!data || typeof data !== 'object') return out;
  const add = (id: string, o: unknown) => {
    if (o && typeof o === 'object' && !out.has(id)) out.set(id, o as Stampable);
  };
  if (/^modules\/[^/]+\/manifest\.json$/.test(path)) {
    const m = data as Manifest;
    if (!m.id) return out;
    if (m.kind !== 'data') add(moduleCardId(m), m);
    for (const it of m.items ?? []) if (it?.id) add(`oggetto:${slug(it.id)}`, it);
    for (const [lid, l] of Object.entries(m.layouts ?? {})) add(`ambiente:${slug(lid)}`, l);
    for (const [seq, s] of Object.entries(m.spells ?? {})) add(`incantesimo:${slug(s?.name ?? seq)}`, s);
    for (const r of m.recipes ?? []) if (r?.id) add(`ricetta:${slug(r.id)}`, r);
  } else if (path === MODELS_INDEX) {
    for (const [id, info] of Object.entries(data)) add(`modello:${slug(id)}`, info);
  } else if (path === 'world/people.json') {
    for (const p of Array.isArray(data.persone) ? data.persone : []) if (p?.nome) add(`persona:${slug(p.nome)}`, p);
  } else if (path === 'world/plots.json') {
    for (const t of Array.isArray(data.trame) ? data.trame : []) if (t?.id) add(`trama:${slug(t.id)}`, t);
  }
  return out;
}

const indentOf = (src: string) => /\n( +)"/.exec(src)?.[1].length ?? 2;

/**
 * Stamps the content a change brings (T36): every entry of the working files that the last commit did not have
 * gets a card from `sign`; an entry that had one and lost it when rewritten (a model sculpted again, a person
 * repaired) gets it back. What was there before without a card (the seed, universes older than T36) stays so.
 * Returns the files it rewrote.
 */
export function stampFiles(working: FileMap, head: FileMap, sign: (cardId: string) => Carta): FileMap {
  const out: FileMap = {};
  for (const path of Object.keys(working)) {
    const src = working[path];
    if (src === undefined || src === head[path]) continue;
    const now = parse(src);
    const entries = entriesOf(path, now);
    if (!entries.size) continue;
    const before = entriesOf(path, parse(head[path]));
    let changed = false;
    for (const [id, o] of entries) {
      if (isCarta(o.carta)) continue;
      const old = before.get(id);
      if (old && !isCarta(old.carta)) continue;
      o.carta = old ? { ...old.carta! } : sign(id);
      changed = true;
    }
    if (changed) out[path] = JSON.stringify(now, null, indentOf(src)) + '\n';
  }
  return out;
}
