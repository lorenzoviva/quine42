// The cards (T36, ADR-0056; P#2 of the multiplayer plan): every generated piece of content — a module, an
// item, an environment, a model, a place, an individual, a plot, a rule, a spell, a recipe — carries who wrote it
// and who paid for it (`carta`), and is a card of one wanderer. What every wanderer pays for is theirs; what
// the world pays for (the Genesis, the sessions of the Council, the horizontal plots, the reviews) is common,
// and goes to one wanderer drawn with the seed of the universe. `world/cards.json` keeps how often each card is
// used (in a place, in a plot, in a prompt) and the cards of the places, whose plans live outside the text of
// the universe (maps/). Pure functions and a small ledger: the kernel stamps and counts.

import { slug } from './graph';
import { hash32, hashStr } from './rng';
import { MODELS_INDEX } from './forms';
import { contentText, fingerprint, HANDMADE_ID_RE, readOrigins, repairHeritage, sharesOf, type CardOrigin } from './heritage';
import { readPeople, readPlots } from './npc/model';
import type { FileMap, Manifest } from './types';
import { internalCardId, internalCardsIn, internalFields, internalSoloIn } from './internalNames';

/** The payer of what the whole world asks for. */
export const COMUNE = 'comune';
export const CARDS_FILE = 'world/cards.json';

/** Who wrote a piece of content (an agent, or a wanderer's id) and who paid for it (a wanderer's id or `comune`). */
export interface CardStamp {
  author: string;
  payer: string;
  /** Whose card it is: the payer, or for common content the wanderer drawn with the seed. */
  holder: string;
  /** Who held it before, in the universes it was cloned from, the first one first (T45c, ADR-0084). */
  origins?: CardOrigin[];
}

/**
 * The tasks the whole world pays for (decision 4): the Genesis, the Council's sessions, plots and what the
 * people do among themselves, the reviews and repairs, the models the library lacks. Every other call is paid
 * by the wanderer it is made for (the place they explore, their chats, their «Altro…», their requests).
 */
const COMMON_TASK = /^(genesis\.|council\.|plot\.|review\.|npc\.dialogue$|forge\.fix$|model\.(sculpt|judge|resculpt|reuse)$|sound\.compose$|content\.)/;

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
export function cardHolderOf(cardId: string, pagante: string, wanderers: string[], seed: number): string {
  if (pagante !== COMUNE) return pagante;
  const all = [...new Set(wanderers)].sort();
  return all.length ? all[hash32(seed, hashStr(cardId)) % all.length] : COMUNE;
}

export type CardKind = 'module' | 'item' | 'environment' | 'spell' | 'rune' | 'recipe' | 'model' | 'chunk' | 'individual' | 'plot' | 'rule';

export interface Uses {
  /** Places it entered (an entity, an environment, a structure). */
  chunks: number;
  /** Plots it is part of. */
  plots: number;
  /** Prompts it went into, as context of a task (the focus of the graph). */
  prompt: number;
}

export const emptyUses = (): Uses => ({ chunks: 0, plots: 0, prompt: 0 });

/** A card in a collection: an id like the graph's (`kind:`, `item:`, `chunk:cx_cy`…, `model:<id>`). */
export interface Card extends CardStamp {
  id: string;
  tipo: CardKind;
  nome: string;
  /** The file it lives in (`maps/` for places). */
  file: string;
  uses: Uses;
  /** With `shares`, for a card that came with a clone: who gets what of each of its uses (T45c). */
  quote?: Record<string, number>;
  /** With `shares`: the fingerprint of the content as it is now (the site's cards show it, T104). */
  fingerprint?: number[];
}

/** world/cards.json */
export interface CardsFile {
  uses: Record<string, Uses>;
  /** The places' cards (their plans are in maps/, outside the text of the universe). */
  chunks: Record<string, CardStamp & { name: string }>;
  /** The uses every card had when this universe was cloned (T45c): what the clone owes is counted from there. */
  atBirth?: Record<string, Uses>;
}

const parse = (src: string | undefined): any => {
  try {
    return JSON.parse(src ?? 'null');
  } catch {
    return null;
  }
};

const isCardStamp = (c: any): c is CardStamp => !!c && typeof c === 'object' && typeof c.author === 'string' && typeof c.payer === 'string' && typeof c.holder === 'string';

/** A JSON file of the universe with its stamps of the contract 0.4 (`carta` → `card`, T308a), whatever contract it was written in. */
const stamped = (text: string | undefined): any => internalCardsIn(parse(text));

/** The card id of a module: an item module is an `oggetto`, any other one a `tipo` (as in the graph). */
export function moduleCardId(m: Pick<Manifest, 'id' | 'kind'>): string {
  return `${m.kind === 'item' ? 'item' : 'kind'}:${slug(m.id)}`;
}

export const chunkCardId = (cx: number, cy: number) => `chunk:${cx}_${cy}`;

/**
 * Every card the universe has: the stamped content of its files and the places of world/cards.json. With `shares`,
 * the cards that came with a clone say who gets what of their uses (T45c): the content measured is what holds the
 * card, as the clone measured it (`inheritCards` in clone.ts: a module with its code, a place by its name).
 */
export function allCards(files: FileMap, shares = false): Card[] {
  const ledger = readCards(files);
  const cfg = shares ? repairHeritage(internalFields('config', parse(files['universe.json']) ?? {})?.heritage) : undefined;
  const out: Card[] = [];
  // What a data module holds is often measured as the whole module: one fingerprint per text.
  const prints = new Map<string, number[]>();
  const printOf = (text: string) => {
    let p = prints.get(text);
    if (!p) prints.set(text, (p = fingerprint(text)));
    return p;
  };
  // `holder` carries the card (`holder.card`); a place's card is the ledger's entry itself.
  const push = (id: string, tipo: CardKind, nome: string, file: string, holder: any, content: () => string = () => contentText(holder)) => {
    const c = tipo === 'chunk' ? holder : holder?.card;
    if (!isCardStamp(c)) return;
    const card: Card = { id, tipo, nome, file, author: c.author, payer: c.payer, holder: c.holder, uses: { ...emptyUses(), ...ledger.uses[id] } };
    const origini = readOrigins(c.origins);
    if (origini.length) card.origins = origini;
    if (cfg) {
      card.fingerprint = printOf(content());
      if (origini.length) card.quote = sharesOf(c.holder, origini, card.fingerprint, cfg);
    }
    out.push(card);
  };
  const raw = (path: string, key: string, shape: 'people' | 'plots' | 'rules'): any[] => {
    const v = internalFields(shape, stamped(files[path]) ?? {})?.[key];
    return Array.isArray(v) ? v : [];
  };
  for (const file of Object.keys(files).sort()) {
    if (!/^modules\/[^/]+\/manifest\.json$/.test(file)) continue;
    const m = stamped(files[file]) as Manifest & { card?: CardStamp } | null;
    if (!m?.id) continue;
    let text: string | undefined;
    const whole = () => (text ??= contentText(m) + (typeof m.logic === 'string' ? files[file.replace(/manifest\.json$/, m.logic)] ?? '' : ''));
    if (m.kind !== 'data') push(moduleCardId(m), m.kind === 'item' ? 'item' : 'module', m.name ?? m.id, file, m, whole);
    // What a data module holds is a card each, of whoever made the module unless it says otherwise.
    const part = (id: string, tipo: CardKind, nome: string, o: unknown) =>
      isCardStamp((o as { card?: unknown })?.card) ? push(id, tipo, nome, file, o) : push(id, tipo, nome, file, m, whole);
    for (const it of m.items ?? []) part(`item:${slug(it.id)}`, 'item', it.name ?? it.id, it);
    for (const [lid, l] of Object.entries(m.layouts ?? {})) part(`environment:${slug(lid)}`, 'environment', l.name ?? lid, l);
    for (const [seq, s] of Object.entries(m.spells ?? {})) part(`spell:${slug(s.name ?? seq)}`, 'spell', s.name ?? seq, s);
    for (const [token, r] of Object.entries(m.runes ?? {})) part(`rune:${slug(token)}`, 'rune', r.name ?? token, r);
    for (const r of m.recipes ?? []) part(`recipe:${slug(r.id)}`, 'recipe', r.name ?? r.id, r);
  }
  // A handmade card that entered the universe (T295) is measured by its program, as it was in the archive (ADR-0161); any other model by its entry (ADR-0084).
  for (const [id, info] of Object.entries(internalFields('modelIndex', stamped(files[MODELS_INDEX]) ?? {}) as Record<string, { name?: string; card?: CardStamp }>))
    push(`model:${slug(id)}`, 'model', info?.name ?? id, MODELS_INDEX, info, HANDMADE_ID_RE.test(id) ? () => files[`models/${id}.xml`] ?? '' : undefined);
  for (const [key, c] of Object.entries(ledger.chunks)) push(`chunk:${key}`, 'chunk', c.name || key, 'maps/', c, () => String(c.name ?? ''));
  // People and plots measured as the file has them, as the clone did (the repaired ones give the names).
  const people = raw('world/people.json', 'people', 'people');
  for (const p of readPeople(files).people) push(`individual:${slug(p.name)}`, 'individual', p.name, 'world/people.json', people.find((q) => q?.name === p.name) ?? p);
  const plots = raw('world/plots.json', 'plots', 'plots');
  for (const t of readPlots(files)) push(`plot:${slug(t.id)}`, 'plot', t.title, 'world/plots.json', plots.find((q) => q?.id === t.id) ?? t);
  for (const r of raw('world/rules.json', 'rules', 'rules') as Array<{ key?: string; text?: string; card?: CardStamp }>)
    if (r?.key) push(`rule:${slug(r.key)}`, 'rule', r.text ?? r.key, 'world/rules.json', r);
  return out;
}

/** What a wanderer gets from a card of a clone that someone else holds now (T45c). */
export interface Received {
  card: Card;
  /** Their share of every use. */
  share: number;
  /** The universe where they held it (their first link in the chain). */
  universe: string;
  /** Uses since this universe was cloned. */
  uses: number;
  /** share × uses */
  received: number;
}

const totalUses = (u: Partial<Uses> | undefined) => (u?.chunks ?? 0) + (u?.plots ?? 0) + (u?.prompt ?? 0);

/** What a wanderer receives from this universe as an earlier holder of its cards, the most received first. */
export function receivedBy(files: FileMap, wanderer: string, cards: Card[] = allCards(files, true)): Received[] {
  const born = readCards(files).atBirth ?? {};
  const out: Received[] = [];
  for (const card of cards) {
    const quota = card.quote?.[wanderer] ?? 0;
    if (!quota || card.holder === wanderer) continue;
    const utilizzi = Math.max(0, totalUses(card.uses) - totalUses(born[card.id]));
    out.push({ card, share: quota, universe: card.origins!.find((o) => o.holder === wanderer)?.universe ?? '', uses: utilizzi, received: quota * utilizzi });
  }
  return out.sort((a, b) => b.received - a.received || b.share - a.share || a.card.id.localeCompare(b.card.id));
}

/** A wanderer's collection: the cards that are theirs, the most used first. */
export function collectionOf(files: FileMap, wanderer: string): Card[] {
  const used = (c: Card) => c.uses.chunks + c.uses.plots + c.uses.prompt;
  return allCards(files)
    .filter((c) => c.holder === wanderer)
    .sort((a, b) => used(b) - used(a) || a.id.localeCompare(b.id));
}

export function readCards(files: FileMap): CardsFile {
  // The fields of the contract 0.3 (`utilizzi`, `luoghi`, `autore`) read internal (T308a).
  const f = internalSoloIn(internalFields('cards', parse(files[CARDS_FILE]) ?? {})) as Record<string, any>;
  const uses = (raw: unknown) => {
    const out: Record<string, Uses> = {};
    // A card id of the contract 0.2 (`modello:albero`) reads internal (T307b): the migration ports the file, this a stray key.
    for (const [rawId, u] of Object.entries((raw && typeof raw === 'object' ? raw : {}) as Record<string, Partial<Uses>>)) {
      const id = internalCardId(rawId);
      const n = (v: unknown) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.floor(Number(v)) : 0);
      out[id] = { chunks: n(u?.chunks), plots: n(u?.plots), prompt: n(u?.prompt) };
    }
    return out;
  };
  const luoghi: CardsFile['chunks'] = {};
  for (const [key, c] of Object.entries((f?.chunks ?? {}) as Record<string, any>)) {
    if (!isCardStamp(c)) continue;
    const origini = readOrigins(c.origins);
    luoghi[key] = { author: c.author, payer: c.payer, holder: c.holder, ...(origini.length ? { origins: origini } : {}), name: String((c as { name?: unknown }).name ?? '') };
  }
  const allaNascita = uses(f?.atBirth);
  return { uses: uses(f?.uses), chunks: luoghi, ...(Object.keys(allaNascita).length ? { atBirth: allaNascita } : {}) };
}

/** The kernel's ledger of the cards' uses: counted as the world is played, written before every commit. */
export class CardUses {
  private file: CardsFile = { uses: {}, chunks: {} };
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
      (this.file.uses[id] ??= emptyUses())[kind]++;
      changed = true;
    }
    if (changed) this.version++;
  }

  /** A place planned for the first time becomes a card. */
  addChunk(key: string, nome: string, carta: CardStamp): void {
    if (this.file.chunks[key]) return;
    this.file.chunks[key] = { ...carta, name: nome };
    this.version++;
  }

  hasChunk(key: string): boolean {
    return !!this.file.chunks[key];
  }

  uses(id: string): Uses {
    return { ...emptyUses(), ...this.file.uses[id] };
  }

  toJson(): string {
    const sorted = <T>(o: Record<string, T>) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
    const born = this.file.atBirth;
    return JSON.stringify({ uses: sorted(this.file.uses), chunks: sorted(this.file.chunks), ...(born ? { atBirth: sorted(born) } : {}) } satisfies CardsFile, null, 1) + '\n';
  }
}

type Stampable = { card?: CardStamp };

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
    for (const it of m.items ?? []) if (it?.id) add(`item:${slug(it.id)}`, it);
    for (const [lid, l] of Object.entries(m.layouts ?? {})) add(`environment:${slug(lid)}`, l);
    for (const [seq, s] of Object.entries(m.spells ?? {})) add(`spell:${slug(s?.name ?? seq)}`, s);
    for (const [token, r] of Object.entries(m.runes ?? {})) add(`rune:${slug(token)}`, r);
    for (const r of m.recipes ?? []) if (r?.id) add(`recipe:${slug(r.id)}`, r);
  } else if (path === MODELS_INDEX) {
    for (const [id, info] of Object.entries(data)) add(`model:${slug(id)}`, info);
  } else if (path === 'world/people.json') {
    for (const p of Array.isArray(data.people) ? data.people : []) if (p?.name) add(`individual:${slug(p.name)}`, p);
  } else if (path === 'world/plots.json') {
    for (const t of Array.isArray(data.plots) ? data.plots : []) if (t?.id) add(`plot:${slug(t.id)}`, t);
  }
  return out;
}

const indentOf = (src: string) => /\n( +)"/.exec(src)?.[1].length ?? 2;

/**
 * Stamps the content a change brings (T36): every entry of the working files that the last commit did not have
 * gets a card from `sign`; an entry that had one and lost it when rewritten (a model sculpted again, an individual
 * repaired) gets it back. What was there before without a card (the seed, universes older than T36) stays so.
 * Returns the files it rewrote.
 */
export function stampFiles(working: FileMap, head: FileMap, sign: (cardId: string) => CardStamp): FileMap {
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
      if (isCardStamp(o.card)) continue;
      const old = before.get(id);
      if (old && !isCardStamp(old.card)) continue;
      o.card = old ? { ...old.card! } : sign(id);
      changed = true;
    }
    if (changed) out[path] = JSON.stringify(now, null, indentOf(src)) + '\n';
  }
  return out;
}
