// The structures a universe has, worn again with another seed (T495, ADR-0247): the programs of the structures grow by rules and vary by seed
// (ADR-0160), so the Cartographer, planning a place, is offered the structures the world already has and asks a new concept only when none
// fits; one it wears again costs no call to the Sculptor nor to the Artist, and the kernel gives its lot a seed of its own, from the place.
// The new programs of the structures have a ceiling per hour of the world (`ai.newStructuresPerHour`): over it the Cartographer reuses.
// Pure: the kernel gives the files, what it may wear and how often it was worn.

import type { FileMap } from './types';
import { readIndex, sameName } from './bring';
import { cellarOf, MODELS_INDEX, type ModelInfo } from './forms';
import { classOf, growsByRules, SIZE_TIERS, sizeOf, type SizeTier } from '../mj/classes';
import { isWorldPart } from './worldparts';
import { seedAged } from './themes';
import { hash32, hashStr, hex } from './rng';
import { shareableProgram } from './agents/sculptor';

export const ownModelId = (id: string) => id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'cosa';

/**
 * The model of a structure the Cartographer asks for (ADR-0043): one per concept and size (ADR-0160). The class's own size has no
 * suffix, as ever; the others say theirs, so a Huge fort and a Gargantuan one are two entries, which share one program when it scales.
 */
export function structureModel(concept: string, size?: SizeTier): string {
  const suffix = size && size !== 'large' ? `-${size}` : '';
  return `struttura-${ownModelId(concept).slice(0, 30 - suffix.length)}${suffix}`;
}

/** An entry of the library a plan's structure may wear: its id, the size it is at, whether it has a cellar, whether its program serves the other sizes. */
export interface ReusableEntry {
  id: string;
  size: SizeTier;
  cellar: boolean;
  /** A program that grows by rules and has no box of its own (`shareableProgram`): the `ModelDirector` gives it to the other sizes that grow by rules, with no call. */
  scales: boolean;
  /** A card that came from another universe (T295): worn again at the seeds of its lots, never at a new one (a seed that fails would isolate the card, T296). */
  brought: boolean;
}

/** A structure of the universe as the Cartographer is offered it: its concept (the name it is asked by), the sizes it is worn at with no call, how many places wear it. */
export interface ReusableStructure {
  concept: string;
  class: 'structure' | 'building';
  entries: ReusableEntry[];
  /** The sizes it is worn at with no call: its entries', and those a program that scales serves (Large and up). */
  sizes: SizeTier[];
  /** The places that wear one of its entries, as the ledger of the cards counts them (a structure that is no card is not counted: 0). */
  uses: number;
  cellar: boolean;
}

/** At most this many structures in the Cartographer's request: the least worn first (about 15 tokens each). */
export const REUSE_OFFERED = 40;

/**
 * The new programs of the structures an hour of the world (T495, D69.3), when `ai.newStructuresPerHour` says nothing: two at full detail. The
 * master raises it in the lobby (`BUDGET_SCALE`); 0 is never a new one, only the structures the world has.
 */
export const NEW_STRUCTURES_PER_HOUR = 2;
/**
 * A new concept about one place in ten (T495, the author's aim): after this many plans with none, under the ceiling, the Cartographer is invited
 * to give the next place a building new to the world (`reuseLines`, `invite`). On real Flash-Lite, offered the structures alone, it wore one of
 * them in every place, the same one in most harbours (`lab/banco/run-1/consumi.md` § 6).
 */
export const FRESH_EVERY = 10;

/** The window of the ceiling, in seconds of the world. */
export const STRUCTURE_HOUR = 3600;

/**
 * The seeds of a structure worn again (T495): past those the Sculptor tried (`STRUCTURE_SEEDS`, which the place it was sculpted for and the
 * places of before wear), within `REUSE_SEED_SPAN` of them. `lab/scripts/semi-strutture.ts` measured how they hold: on the 67 structures of
 * four universes, 12 seeds each, 13 of 804 fail the Sculptor's checks, all but one a cellar not reached from the door, 10 of them past the
 * fourth seed; so a structure with a cellar, and a brought card, keep the seeds of their lots (`newSeedFor`).
 */
export const REUSE_SEED_FROM = 5;
export const REUSE_SEED_SPAN = 4096;

/**
 * The seed a structure worn again takes in a place (T495): from the world's seed, the place and the lot's slot (shared seeds, ADR-0055: never
 * from a clock nor from the order things happened in), so the same place has the same building on every machine and every load.
 */
export const reuseSeed = (worldSeed: number, cx: number, cy: number, slot: number): number => REUSE_SEED_FROM + (hash32(worldSeed, cx, cy, slot, 4950) % REUSE_SEED_SPAN);

/**
 * Whether an entry worn again takes a seed of its own (T495): not one with a cellar (the seeds past the Sculptor's fail its cellar more often),
 * nor a brought card; they keep the seed of their lot (`seedFor`), among the ones that were tried.
 */
export const newSeedFor = (e: Pick<ReusableEntry, 'cellar' | 'brought'>): boolean => !e.cellar && !e.brought;

/** Of the sizes a structure of the world has, the one nearest to the size asked (the smaller of two as near): the kernel fits it to the lot after. */
export function nearestSize(sizes: readonly SizeTier[], asked: SizeTier): SizeTier | undefined {
  const rank = (t: SizeTier) => SIZE_TIERS.findIndex((x) => x.id === t);
  return [...sizes].sort((a, b) => Math.abs(rank(a) - rank(asked)) - Math.abs(rank(b) - rank(asked)) || rank(a) - rank(b))[0];
}

/** The prints of the seed's files as the universe took them (`seed.json`), or none. */
const seedPrints = (files: FileMap): Record<string, unknown> => {
  try {
    const p = JSON.parse(files['seed.json'] ?? '{}');
    return p && typeof p === 'object' && !Array.isArray(p) ? p : {};
  } catch {
    return {};
  }
};

/** Whether a universe is of the seed's age (T433): its theme is the seed's, or it has none. Then the seed's structures belong to it too. */
const ofSeedAge = (files: FileMap, prints: Record<string, unknown>): boolean => {
  const theme = files['prompts/theme.md'];
  return seedAged(theme) || (theme !== undefined && prints['prompts/theme.md'] === hex(hashStr(theme)));
};

/**
 * The structures of a universe the Cartographer may ask again by their concept (T495): the entries of the library a plan's structure wears
 * (`struttura-…`, the Sculptor's, ADR-0043) and those that came with the cards (T295), of the classes of the lots (`structure`, `building`),
 * with their program; never a part, a part of the world, a common house or a building of the corona; the seed's programs only in a world of
 * the seed's age. `usable` drops what the world does not wear (an isolated card, T296); `uses` is how many places wear an entry. Grouped by
 * concept (`sameName`), in the order of their least worn, then by concept; `all` keeps the seed's programs in every world (the bench).
 */
export function reusableStructures(files: FileMap, usable: (id: string) => boolean = () => true, uses: (id: string) => number = () => 0, all = false): ReusableStructure[] {
  if (!files[MODELS_INDEX]) return [];
  const index = readIndex(files) as Record<string, ModelInfo>;
  const prints = seedPrints(files);
  const aged = all || ofSeedAge(files, prints);
  // A program the seed has as the universe took it (`seed.json`): a structure of Valmora's age, in another world none of its own.
  const seedProgram = (id: string, xml: string) => prints[`models/${id}.xml`] === hex(hashStr(xml));
  const groups: ReusableStructure[] = [];
  for (const id of Object.keys(index).sort()) {
    const info = index[id];
    const xml = files[`models/${id}.xml`];
    if (!info || typeof info !== 'object' || xml === undefined || info.sound) continue;
    if (info.class !== 'structure' && info.class !== 'building') continue;
    if (!id.startsWith('struttura-') && typeof info.brought !== 'string') continue;
    if (isWorldPart(id, info) || !usable(id) || (!aged && seedProgram(id, xml))) continue;
    const concept = String(info.name ?? '').trim();
    if (!concept) continue;
    const cls = classOf(info.class)!;
    const size = sizeOf(info.size)?.id ?? cls.taglia;
    // A concept whose id is another entry's (a name of the catalogue that is another's id, `struttura-cattedrale` named «Cattedrale degli
    // Ingranaggi» beside `struttura-cattedrale-degli-ingranaggi`): asked by it, a plan wears the other; it is not offered.
    const derived = structureModel(concept, size);
    if (derived !== id && index[derived] && typeof info.brought !== 'string') continue;
    const entry: ReusableEntry = { id, size, cellar: cellarOf(info, xml) > 0, scales: growsByRules(cls, size) && shareableProgram(xml), brought: typeof info.brought === 'string' };
    let g = groups.find((x) => x.class === info.class && sameName(x.concept, concept));
    if (!g) groups.push((g = { concept, class: info.class, entries: [], sizes: [], uses: 0, cellar: false }));
    g.entries.push(entry);
    g.uses += Math.max(0, uses(id) || 0);
    g.cellar ||= entry.cellar;
  }
  for (const g of groups) {
    const cls = classOf(g.class)!;
    const own = new Set(g.entries.map((e) => e.size));
    // The sizes a program that scales serves, unless the id of that size is another structure's.
    const ids = new Set(g.entries.map((e) => e.id));
    if (g.entries.some((e) => e.scales)) for (const t of SIZE_TIERS) if (growsByRules(cls, t.id) && (!index[structureModel(g.concept, t.id)] || ids.has(structureModel(g.concept, t.id)))) own.add(t.id);
    g.sizes = SIZE_TIERS.map((t) => t.id).filter((t) => own.has(t));
  }
  return groups.sort((a, b) => a.uses - b.uses || a.concept.localeCompare(b.concept));
}

/** A name as `sameName` compares it: without accents, case and punctuation, its words. */
const wordsOf = (s: string): string[] => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(' ').filter(Boolean);

/** At least this many words in a name that is the start of another for the two to be one structure (`reusableOf`). */
export const SHORT_NAME_WORDS = 4;

/**
 * The structure of the universe a plan's concept names, of either class, or undefined: a concept new to the world. The same name (`sameName`),
 * or one the start of the other in at least `SHORT_NAME_WORDS` words: the Sculptor's names are long («il capanno di collaudo delle chiatte a
 * vapore, su palafitte sopra l'acqua») and Flash-Lite, asked for a new one, gave it back cut after «a vapore» (`consumi.md` § 6.3).
 */
export function reusableOf(list: readonly ReusableStructure[], concept: string): ReusableStructure | undefined {
  const same = list.find((s) => sameName(s.concept, concept));
  if (same) return same;
  const w = wordsOf(concept);
  const starts = (long: string[], short: string[]) => short.length >= SHORT_NAME_WORDS && short.length < long.length && short.every((x, i) => long[i] === x);
  return list.find((s) => {
    const k = wordsOf(s.concept);
    return starts(k, w) || starts(w, k);
  });
}

/**
 * The entry a concept of the universe wears at a size, or undefined if none is at that size: its own, or a program that scales to it (which the
 * `ModelDirector` copies under the id of that size, `shared`, with no call).
 */
export function reusableEntry(s: ReusableStructure, size: SizeTier): ReusableEntry | undefined {
  return s.entries.find((e) => e.size === size) ?? (growsByRules(classOf(s.class)!, size) ? s.entries.find((e) => e.scales) : undefined);
}

/**
 * What the Cartographer is told of the structures of the world (T495): each with its sizes, its cellar and how many places have one; to write
 * exactly its concept and one of its sizes. `fresh` false: no new concept now (the ceiling of the hour, `ai.newStructuresPerHour`), and the
 * schema lets only these through; `invite`: a new concept is welcome here (`FRESH_EVERY` plans brought none).
 */
export function reuseLines(list: ReadonlyArray<Pick<ReusableStructure, 'concept' | 'sizes' | 'uses' | 'cellar'>>, fresh: boolean, invite = false): string[] {
  if (!list.length) return fresh ? [] : ['"structures": none this time (the world builds no new kind of building now): leave it empty.'];
  const shown = list.slice(0, REUSE_OFFERED).map((s) => `- «${s.concept}» (${s.sizes.join(', ')}${s.cellar ? ', with a cellar' : ''}; ${s.uses ? `in ${s.uses} place${s.uses === 1 ? '' : 's'}` : 'not used yet'})`);
  return [
    `The structures this world already has (each is built again here with another seed: another building of the same kind, at no cost):\n${shown.join('\n')}`,
    !fresh
      ? 'For "structures", only these now (write EXACTLY one of their concepts, and one of its sizes), or none: the world builds no new kind of building at the moment.'
      : invite
        ? 'For "structures": no new kind of building has come for a while, so if this place has a structure, give it a concept of its own, new to the world and of this place (not one of these with another name); one of these only if it is exactly what the place calls for.'
        : 'For "structures", choose one of these whenever one fits this place (write EXACTLY its concept, and one of its sizes); a new concept only when none of them suits the place, about one place in ten; prefer the ones used in fewer places.',
  ];
}

/** The window of the new programs of the structures (T495): when each began, in seconds of the world; how many began in the last hour. */
export class StructureHour {
  private started: number[] = [];

  /** How many new programs began in the hour before `now`. */
  count(now: number): number {
    this.started = this.started.filter((t) => t > now - STRUCTURE_HOUR && t <= now);
    return this.started.length;
  }

  /** Whether one more fits under `ceiling` at `now`. */
  allows(now: number, ceiling: number): boolean {
    return this.count(now) < ceiling;
  }

  /** One more began at `now`. */
  note(now: number): void {
    this.started.push(now);
  }
}
