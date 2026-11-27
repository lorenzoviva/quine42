// The Sculptor writes the programs of the models (ADR-0042); the Artist looks at them and judges.
//
// Per class, as the costs report of step 8.2B proposed: simple things (vegetation, rocks, objects,
// furniture) by the cheap model, two independent programs and the Artist keeps the better one (with that
// model, rounds of improvement make things worse); figures and structures by the better model, with one
// round of revision guided by the Artist; the structures that matter by the best model, while its price
// lasts. Every program goes through the kernel's checks (it compiles, finishes, stands, is whole, is high
// enough, does not fill its box) and goes back with the reason while it does not pass.

import type { Schema } from '../ai/models';
import { MOCK_STRUCTURE_PROGRAM } from '../ai/mockStructure';
import { analyse, closedRoomErrors, compositionOf, dwellingErrors, partErrors, varietyError, type Composition } from '../../mj/check';
import { boxOf, classOf, CLASSES, densityFor, DWELLING, groundJoined, growsByRules, isDwelling, isFortified, isVessel, partVoxels, PARTS, RARE_SIZES, sizeOf, sizeRank, SIZE_TIERS, TILE, tilesOf, type AssetClass, type SizeTier } from '../../mj/classes';
import { Mj3Error, type PaletteEntry, type RunResult, type Vec3 } from '../../mj/engine';
import { compileMjx, hasMapIn, mapsBackToBox, mjxIncludes, type MjxFiles, type MjxModel } from '../../mj/model';
import { MJ_PALETTE } from '../../mj/palette';
import { cartoonRender, render, sheet, type RenderOptions } from '../../mj/photo';
import { pngDataUrl } from '../../mj/png';
import { act, runMjx } from '../../mj/run';
import { isNoteLine, symbolName } from '../../mj/symbols';
import { traceText } from '../../mj/trace';
import { planDistance, planView, sectionHeights, sideBySide, viewsText } from '../../mj/views';
import { cellarVoxels, groundOfForm, habitablePartsOf, holesOf, vptOf, walkIn, waterlineOf, type ModelInfo } from '../forms';
import { measureVessel, vesselErrors, VESSEL_LEAST } from '../../mj/vessel';
import { roomsReached, storeyFloors } from '../interior';
import type { FileMap } from '../types';
import { internalFields } from '../internalNames';
import { isTileset, WORLD_NODE_LIMITS, worldNodeErrors } from '../validator';
import { wornErrors, wornSections, type WornZone } from '../../mj/worn';
import { isWorldPart, partContract, WORLD_PARTS, worldPartsIn } from '../worldparts';
import type { LotStratum } from '../strata';
import type { Council } from './council';

export type ModelCategory = 'simple' | 'figure' | 'structure';

export const categoryOf = (cls: AssetClass): ModelCategory =>
  ['person', 'animal', 'beast'].includes(cls.id) ? 'figure' : ['building', 'monument', 'structure', 'vessel'].includes(cls.id) ? 'structure' : 'simple';

export interface SculptorAiModels {
  simple: string;
  figure: string;
  structure: string;
  /** For the structures of the rare sizes (ADR-0092: Huge, Gargantuan), until `importanteFino` (ISO date: then its price doubles). */
  important: string;
  importanteFino?: string;
  artist: string;
  /** Not a sculptor, as the Artist is not: the Musician's model (T225). */
  musician: string;
  /**
   * The structures and the important ones when the world goes through OpenRouter, from `openRouterFrom` (ISO date; T397, D57): Opus 5.5,
   * which passed 11 times out of 12 where Argon passed 6 out of 8, at Argon's cost per success once Argon's price doubles. On Google's route
   * the structures stay `structure` and `important`. Only where the master left those as they are (`sculptorsOn`).
   */
  openRouterStructure?: string;
  openRouterFrom?: string;
}

/** The route the world's models go along (T397): Google's key, or OpenRouter (`OpenRouterAiModels`, ADR-0193). */
export type AiRoute = 'google' | 'openrouter';

export const DEFAULT_SCULPTORS: SculptorAiModels = {
  simple: 'gemini-3.1-flash-lite',
  figure: 'gemini-3.8-flash',
  // The structures of every size on the model of the important ones (T395, D58): at Large 3.8 Flash passed 0 times out of 6 (T355),
  // Argon 6 out of 8 (T391). After the round on Claude (T392, D57) Argon stays on Google's route; on OpenRouter see `openRouterStructure`.
  structure: 'gemini-4-argon',
  important: 'gemini-4-argon',
  importanteFino: '2026-12-01',
  artist: 'gemini-3.5-flash',
  musician: 'gemini-3.8-flash',
  // From the day Argon's price doubles (T397, D57, T392's round): on OpenRouter the structures go to Opus 5.5; on Google's route Argon stays.
  openRouterStructure: 'claude-opus-5-5',
  openRouterFrom: '2026-12-01',
};

/**
 * How far the master goes for the structures' Sculptor (T398, D57), chosen at the Genesis and in the lobby, fixed while a match is under way
 * (`ai.sculptorTier`, absent `standard`): `standard` is T397's (Argon, Opus 5.5 on OpenRouter from `openRouterFrom`); `strong` Opus 5.5 on
 * OpenRouter from today; `max` Fable 5.1 on OpenRouter. On Google's route only Gemini: every tier is Argon there. Whoever pays the match pays it.
 */
export type SculptorTier = 'standard' | 'strong' | 'max';
export const SCULPTOR_TIERS: readonly SculptorTier[] = ['standard', 'strong', 'max'];
/** The structures' Sculptor of a tier above `standard` on OpenRouter: ids of the adapter's list (`OPENROUTER_MODELS`), never another. */
export const TIER_MODELS: Readonly<Record<Exclude<SculptorTier, 'standard'>, string>> = { strong: 'claude-opus-5-5', max: 'claude-fable-5-1' };
/** A tier as it came (universe.json, the wire): one of the three, else `standard`. */
export const repairSculptorTier = (v: unknown): SculptorTier => (typeof v === 'string' && (SCULPTOR_TIERS as readonly string[]).includes(v) ? (v as SculptorTier) : 'standard');

/** Whether a model is called through Google's key: the others only through OpenRouter. */
const onGoogle = (model: string): boolean => /^(models\/)?gemini-/.test(model);

/**
 * The Sculptor's models of a world (T397): the defaults under what the universe says (`ai.sculptors`), then, on OpenRouter from
 * `openRouterFrom`, `openRouterStructure` for the structures and the important ones the master left as the defaults (Low Detail, a model
 * chosen in the lobby stay); on Google's route a model Google does not have goes back to the default (a universe.json written by hand).
 * A tier above `standard` (T398) puts its model on the structures and the important ones on OpenRouter, whatever the classes say: it is the
 * master's latest word on them; on Google's route it changes nothing.
 */
export function sculptorsOn(configured: Partial<SculptorAiModels>, route: AiRoute, today = new Date().toISOString().slice(0, 10), tier: SculptorTier = 'standard'): SculptorAiModels {
  const m: SculptorAiModels = { ...DEFAULT_SCULPTORS, ...configured };
  const chosen = tier === 'standard' ? undefined : TIER_MODELS[tier];
  for (const k of ['structure', 'important'] as const) {
    if (route === 'google' && !onGoogle(m[k])) m[k] = DEFAULT_SCULPTORS[k];
    else if (route === 'openrouter' && chosen) m[k] = chosen;
    else if (route === 'openrouter' && m.openRouterStructure && m.openRouterFrom && today >= m.openRouterFrom && m[k] === DEFAULT_SCULPTORS[k]) m[k] = m.openRouterStructure;
  }
  return m;
}

export interface SculptRequest {
  /** Id in the library (`models/<id>.xml`). */
  id: string;
  nome: string;
  aspetto: string;
  classe: string;
  contesto?: string;
  /** One program for many entities: the letter C takes each entity's colour. */
  tinta?: boolean;
  /** Its size (ADR-0092), if not the class's own: the box scales with it; the rare structures get the best model. */
  taglia?: SizeTier;
  /** The program it had (a request to sculpt it again) and what is wished. */
  previous?: string;
  desiderio?: string;
  /** A structure's entries of the same concept at the other sizes (ADR-0160): a program that scales is shared, not sculpted again. */
  shareWith?: string[];
  /** It is worn there (T290, ADR-0180): the program has its `<worn>` section for that zone of the body. */
  worn?: WornZone;
  /** A dwelling (T413, ADR-0213), if who asks knows it (a world's common houses); else the words of its concept say it (`dwellingOf`). */
  dwelling?: boolean;
  /**
   * Tiles of cellar under it (T417, ADR-0091 point 4): a structure that grows by rules, its box that many tiles of 20 voxels deeper under the
   * soil (`cellarVoxels`), where `part-cellar` digs it. The checks want it to hold and to be reached from the door; one that does not comes in
   * without (`SculptResult.cellar` absent).
   */
  cellar?: number;
  /** A military fortification (T434), if who asks knows it; else the words of its concept say it (`fortifiedOf`). */
  fortified?: boolean;
  /** The strata under the structure's lot, from row 0 (0–1 tiles below the soil) down (T479, ADR-0253). */
  strata?: LotStratum[];
}

/** Whether a structure asked for is a dwelling (T413, ADR-0213): the request says it, or its concept (`isDwelling`). */
export const dwellingOf = (req: Pick<SculptRequest, 'nome' | 'dwelling'>): boolean => req.dwelling ?? isDwelling(req.nome);

/**
 * Whether a structure asked for is a military fortification (T434): the request says it, or its concept (`isFortified`). Only a fortification
 * is offered the parts of a fort (`FORT_PARTS`) and may wear merlons and arrow slits; any other is told it does not.
 */
export const fortifiedOf = (req: Pick<SculptRequest, 'nome' | 'fortified'>): boolean => req.fortified ?? isFortified(req.nome);

/** The parts of the seed that only a fortification includes (T434): the merlons and the arrow slits under them. */
export const FORT_PARTS = ['part-battlements', 'part-slits'] as const;

/** Where a thing is worn, as the request says it. */
const WORN_ON: Record<WornZone, string> = { head: 'on the head', torso: 'on the torso', back: 'on the back' };

/** The Artist's critique of a model (English fields since T310b, the same as `models/index.json` keeps: `score`, `problems`, `advice`). */
export interface Critique {
  score: number;
  recognizable: boolean;
  problems: string[];
  advice: string[];
}

export interface SculptResult {
  xml: string;
  model: string;
  score?: number;
  calls: number;
  /** The cellar it has (T417): the request's, if the program holds it; absent if none was asked or it came in without. */
  cellar?: number;
}

const CRITIQUE_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    score: { type: 'INTEGER', description: '0-10' },
    recognizable: { type: 'BOOLEAN' },
    problems: { type: 'ARRAY', items: { type: 'STRING' } },
    advice: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['score', 'recognizable', 'problems', 'advice'],
};

const classLine = (c: AssetClass) => {
  const b = boxOf(c);
  return `  - ${c.id}: ${b.join('×')} voxels = ${c.tiles.join('×')} tiles, size ${c.taglia}${c.minHeight ? `, at least ${Math.round(c.minHeight * b[2])} tall` : ''}; ${c.hint}`;
};

/** The sizes of D&D (ADR-0092): how a class's box scales when an entity is of another size than its class's. */
const sizesLine = () => `  Sizes (D&D): ${SIZE_TIERS.map((t) => `${t.id} ×${t.scala}`).join(' · ')} — the side against medium; a thing of another size has the box of its class scaled (the request says it)`;

/**
 * The structures that grow by rules (T156, ADR-0160): the class `structure` from Large up, a box of 100 voxels a side or more.
 * Their prompt is the procedural one (the skeleton of the bench, T182), the program has no box of its own (`size`), so one
 * program serves every size (`shareableProgram`), and it is tried at more seeds and at the next size.
 */
export const procedural = (cls: AssetClass, taglia?: string): boolean => growsByRules(cls, taglia);

/** The sizes a procedural program is tried at: its own and the next (the last one, Gargantuan, with the one before). */
export function triedSizes(cls: AssetClass, taglia?: string): SizeTier[] {
  const own = sizeOf(taglia)?.id ?? cls.taglia;
  const r = sizeRank(own);
  return [own, (SIZE_TIERS[r + 1] ?? SIZE_TIERS[r - 1]).id];
}

/** Seeds a procedural structure has in the world (`ModelInfo.seeds`): each is another building of the same kind. */
export const STRUCTURE_SEEDS = 4;

/**
 * The Sculptor's specialties (T468, ADR-0239, S2 of T458): one agent (`sculptor`, `model.sculpt`, the knob `models`) with eight roles, which
 * the kernel decides from the class, the size and the request (`specialtyOf`). Each reads the core of the prompt and its own section; the
 * architect (the structures that grow by rules) its whole prompt; `actions` writes the `<action>`s of «Altro…», for a model of any trade.
 */
export type SculptorSpecialty = 'landscaper' | 'joiner' | 'tailor' | 'figurist' | 'mason' | 'architect' | 'coachbuilder' | 'actions';
export const SPECIALTIES: readonly SculptorSpecialty[] = ['landscaper', 'joiner', 'tailor', 'figurist', 'mason', 'architect', 'coachbuilder', 'actions'];

/** The names of the specialties, as the studio and the Council's feed say them (the author's words of 21/11). */
export const SPECIALTY_NAMES: Readonly<Record<SculptorSpecialty, string>> = {
  landscaper: 'Paesaggista',
  joiner: 'Mobiliere',
  tailor: 'Sarto',
  figurist: 'Figurinista',
  mason: 'Capomastro',
  architect: 'Architetto',
  coachbuilder: 'Carrozziere',
  actions: 'le azioni',
};

/** The classes each trade sculpts, whose lines its section shows (`@@CLASSES@@`): what is worn is an object; actions show none of their own. */
export const SPECIALTY_CLASSES: Readonly<Record<SculptorSpecialty, readonly string[]>> = {
  landscaper: ['tree', 'bush', 'rock', 'pebble', 'cover'],
  joiner: ['furniture', 'object'],
  tailor: ['object'],
  figurist: ['person', 'animal', 'beast'],
  mason: ['building', 'monument', 'structure'],
  architect: ['structure'],
  coachbuilder: ['vessel'],
  actions: [],
};

/** The trade of each class, for what is sculpted in one box (the worn things and the structures that grow by rules are decided apart). */
const CLASS_SPECIALTY: Readonly<Record<string, SculptorSpecialty>> = {
  tree: 'landscaper',
  bush: 'landscaper',
  rock: 'landscaper',
  pebble: 'landscaper',
  cover: 'landscaper',
  furniture: 'joiner',
  object: 'joiner',
  person: 'figurist',
  animal: 'figurist',
  beast: 'figurist',
  building: 'mason',
  monument: 'mason',
  structure: 'mason',
  vessel: 'coachbuilder',
};

/**
 * The specialty that sculpts a request (T468): the architect for a structure that grows by rules (from Large up, `procedural`), the tailor for
 * a thing that is worn, else the trade of its class (a class the kernel does not know is an object's, as `sculpt` takes it).
 */
export function specialtyOf(cls: AssetClass, req: Partial<Pick<SculptRequest, 'taglia' | 'worn'>> = {}): SculptorSpecialty {
  if (procedural(cls, req.taglia)) return 'architect';
  if (req.worn) return 'tailor';
  return CLASS_SPECIALTY[cls.id] ?? 'joiner';
}

/** The specialty of a request as `sculpt` reads it: its class, or the object's if the kernel does not know it. */
export const requestSpecialty = (req: Pick<SculptRequest, 'classe'> & Partial<Pick<SculptRequest, 'taglia' | 'worn'>>): SculptorSpecialty => specialtyOf(classOf(req.classe) ?? classOf('object')!, req);

/**
 * Where the structures' prompt begins in a `prompts/agents/sculptor.md` of before T468: what comes before is for every other class. Since
 * T468 the structures' prompt is the architect's section (`prompts/agents/sculptor/architect.md`), the same text; a universe whose prompt is
 * the one of before (without `CORE_MARK`) keeps it, the whole of it. The part after it has no skeleton (T354, ADR-0183: a program in the
 * prompt is copied, and every concept came out the same building, T337): the method of the composition on a coarse plan, the parts of the
 * seed, the blocks. Offline the Sculptor answers with `MOCK_STRUCTURE_PROGRAM`.
 */
export const STRUCTURES_MARK = '<!-- strutture -->';

/** The file of the Sculptor's prompt: since T468 its core, what every specialty reads. */
export const SCULPTOR_PROMPT = 'prompts/agents/sculptor.md';
/** The section of a specialty, beside the core (T468): `prompts/agents/sculptor/<specialty>.md`. */
export const sectionPath = (s: SculptorSpecialty): string => `prompts/agents/sculptor/${s}.md`;

/**
 * The mark of the core (T468), a note at the top of `SCULPTOR_PROMPT`: a prompt with it is the core of the specialties, each with its section;
 * a prompt without it is the one of before (a universe that rewrote it, or one the seed has not reached), and goes whole, as before.
 */
export const CORE_MARK = '<!-- core';
/** A note under a title of the core (T468): that section is for sculpting, not sent with an action (the palette, `field`, how to sculpt well). */
export const SCULPTING_MARK = '<!-- sculpting';
/** A note under a title of the core (T468): that section is sent only where models/ has files to read (`libraryResources`: tilesets, samples, rules). */
export const FILES_MARK = '<!-- files';

/** A line that is only an HTML comment: a note for whoever edits a prompt, outside a code fence. */
const isNote = (line: string): boolean => /^\s*<!--.*-->\s*$/.test(line);
const isFence = (line: string): boolean => /^\s*```/.test(line);

/**
 * A prompt cut at its titles of the second level (`## `), outside the code fences: the first piece is what comes before the first title. Each
 * piece with its notes, the lines that are only an HTML comment outside a fence (the marks among them).
 */
export function promptSections(text: string): Array<{ text: string; notes: string[] }> {
  const out: Array<{ lines: string[]; notes: string[] }> = [{ lines: [], notes: [] }];
  let fenced = false;
  for (const line of text.split('\n')) {
    if (!fenced && line.startsWith('## ')) out.push({ lines: [], notes: [] });
    const here = out[out.length - 1];
    if (isFence(line)) fenced = !fenced;
    else if (!fenced && isNote(line)) here.notes.push(line.trim());
    here.lines.push(line);
  }
  return out.filter((s, i) => i > 0 || s.lines.some((l) => l.trim())).map((s) => ({ text: s.lines.join('\n'), notes: s.notes }));
}

/**
 * What of a prompt reaches the model (T468): without the notes for whoever edits it, a line that is only an HTML comment outside a code fence
 * (the marks are notes too). A comment inside a fence is part of a piece of program, and stays.
 */
export function withoutNotes(text: string): string {
  let fenced = false;
  const out: string[] = [];
  for (const line of text.split('\n')) {
    if (isFence(line)) fenced = !fenced;
    else if (!fenced && isNote(line)) continue;
    out.push(line);
  }
  return out.join('\n');
}

/** The palette of MarkovJunior, as the prompt lists it (`@@PALETTE@@`). */
const paletteLine = () => Object.entries(MJ_PALETTE).map(([k, v]) => `${k} ${v.color.slice(1)}`).join(' · ');

/** The placeholders of the core and of a section (T468): the tile, the palette, a section's classes (`@@CLASSES@@`), the sizes of D&D (`@@SIZES@@`). */
const filled = (text: string, classes: readonly string[] = []) =>
  text
    .replaceAll('@@TILE@@', String(TILE))
    .replace('@@CLASSES@@', CLASSES.filter((c) => classes.includes(c.id)).map(classLine).join('\n'))
    .replace('@@SIZES@@', sizesLine())
    .replace('@@PALETTE@@', paletteLine());

/** Whether a universe's prompt is the core of the specialties (T468), or the one of before: its notes say so (`CORE_MARK`). */
export const hasCore = (files: FileMap): boolean => promptSections(files[SCULPTOR_PROMPT] ?? '').some((s) => s.notes.some((n) => n.startsWith(CORE_MARK)));

/**
 * What a specialty reads first in its system (T468, ADR-0239), the stable part that the cache serves: the core (`prompts/agents/sculptor.md`,
 * the same for every trade, so that the calls of one model share its prefix); for `actions` the core without its sections for sculpting; for the
 * architect its whole prompt, the structures' of before (`prompts/agents/sculptor/architect.md`; without that file, the core). A section of the
 * core marked for the files goes only where the universe has files of models/ to read. A universe whose prompt is the one of before (no
 * `CORE_MARK`) gets it as before, the same text: the part after `STRUCTURES_MARK` for the architect, the rest, whole, with every class, for
 * every other. `true` is the architect, as the callers of before said it; without a specialty, the core (or the whole prompt of before).
 */
export function sculptorRole(files: FileMap, specialty?: SculptorSpecialty | boolean): string {
  const spec = specialty === true ? 'architect' : specialty === false ? undefined : specialty;
  const text = files[SCULPTOR_PROMPT] ?? 'You are the Sculptor: you write MarkovJunior programs in XML.';
  if (!hasCore(files)) {
    const at = text.indexOf(STRUCTURES_MARK);
    if (spec === 'architect' && at >= 0) return text.slice(at + STRUCTURES_MARK.length).trim();
    return (at >= 0 ? text.slice(0, at).trimEnd() : text)
      .replaceAll('@@TILE@@', String(TILE))
      .replace('@@CLASSES@@', [...CLASSES.map(classLine), sizesLine()].join('\n'))
      .replace('@@PALETTE@@', paletteLine());
  }
  const own = files[sectionPath('architect')];
  if (spec === 'architect' && own?.trim()) return withoutNotes(own).trim();
  const withFiles = libraryResources(files).length > 0;
  const kept = promptSections(text).filter((s) => {
    if (spec === 'actions' && s.notes.some((n) => n.startsWith(SCULPTING_MARK))) return false;
    return withFiles || !s.notes.some((n) => n.startsWith(FILES_MARK));
  });
  return filled(withoutNotes(kept.map((s) => s.text).join('\n'))).trim();
}

/**
 * The section of a specialty (T468, ADR-0239): what is its own (its classes and their boxes, the sizes for the mason, the worn things, the
 * vessels…), after the core, the principles, the «Lingua» and the style guide, before the examples. For an action, `of` is the specialty of
 * the model the action is for: its section, the mason's for a structure that grows by rules (the architect's is the method of a whole
 * composition). Empty for the architect (its prompt is its role), for a section the universe does not have, and where the prompt is the one of
 * before (it already says everything).
 */
export function sculptorSection(files: FileMap, specialty: SculptorSpecialty, of?: SculptorSpecialty): string {
  const spec = specialty === 'actions' ? (of === 'architect' ? 'mason' : of) : specialty;
  if (!spec || spec === 'architect' || spec === 'actions' || !hasCore(files)) return '';
  const text = files[sectionPath(spec)];
  return text ? filled(withoutNotes(text), SPECIALTY_CLASSES[spec]).trim() : '';
}

/**
 * The Artist's vote from which a model of the universe is an example for the Sculptor (T467, S1 of T458 § 3.2): 6, the author's word of
 * 21/11. The Artist is severe and today's generative models limit the quality, so low votes are normal now: of the 211 models with a vote
 * in the real universes of that day the mean was 5.1, and only 12 had 7 or more.
 */
export const EXAMPLE_SCORE = 6;

/**
 * The longest program that is an example, in characters (T467): an example goes into every request of its class until a better one comes,
 * and past this it would cost more than it teaches (some 5 000 tokens). The longest of the seed that teaches is 6 778, the best of the real
 * universes stay under 10 000.
 */
export const EXAMPLE_CHARS = 12_000;

/**
 * What is never an example (T467, as `reuseOptions` of the `ModelDirector`): the studio's models (of the corona, not of the world, at 8 voxels
 * a tile), the showcase of the editor (`schermo-`, `circuito-`) and the parts of the seed, which a structure includes and are no thing.
 */
const NOT_EXAMPLES = /^(corona-|schermo-|circuito-|part-)/;

/**
 * The classes a class learns from when none of its own models written by hand teaches: a medium structure, whose class grows by rules from
 * Large up, from the buildings.
 */
const EXAMPLE_FAMILY: Readonly<Record<string, readonly string[]>> = { person: ['person', 'animal'], animal: ['animal', 'person'], beast: ['beast', 'animal'], tree: ['tree', 'bush'], bush: ['bush', 'tree'], rock: ['rock', 'pebble'], pebble: ['pebble', 'rock'], object: ['object', 'furniture'], furniture: ['furniture', 'object'], building: ['building', 'structure'], structure: ['structure', 'building'], monument: ['monument', 'building'], vessel: ['vessel'] };

/** What of a request chooses its examples (T467): its id (it is never its own example), its class, its size, whether it is worn. */
export type ExampleRequest = Pick<SculptRequest, 'classe'> & Partial<Pick<SculptRequest, 'id' | 'taglia' | 'worn'>>;

/** Ids in a fixed order, the same on every machine (not the locale's). */
const byId = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/**
 * The library's programs the Sculptor learns from, in its system (T467, S1 of T458 § 3.2): at most two, chosen without calls and always the
 * same for the same library, so that the cache keeps them until a better model comes.
 * 1. A model written by hand (its author says so, and it was not brought: the seed's, or one written by hand for the universe) of the
 *    request's class, or of the class beside it if none of its own teaches (`EXAMPLE_FAMILY`): worn first if the request is worn, then one
 *    in the request's box (its size and density: the star of the objects, at 32 voxels a tile, is not), then the generic of the class, then
 *    by id.
 * 2. If there is one, the best of the universe of the request's class, size and density, worn if and only if the request is, with a vote of
 *    the Artist of at least `EXAMPLE_SCORE`: the higher vote, then by id; never the same program as the first. A model brought with the
 *    cards (ADR-0170) is one of these by the vote it brought from where it was born, no longer second by being brought.
 * A program teaches if it is of the world (`NOT_EXAMPLES`), of an asset class (not a sound), not the request itself, does not grow by rules
 * (a box alone would learn the opposite, T156), floats if it is a vessel (the Sculptor's vessels are on water, the request asks for the
 * waterline: the capsule of the void is not theirs), is worn only if the request is (a thing of its own would learn a `<worn>` section) and
 * is not longer than `EXAMPLE_CHARS`. The structures that grow by rules get none (`write`): their prompt composes from the concept.
 */
export function examplesFor(files: FileMap, request: ExampleRequest | string): string[] {
  const req: ExampleRequest = typeof request === 'string' ? { classe: request } : request;
  // The fields of 0.3 (`classe`, `autore`, `voto`) read internal (T308a).
  const index = libraryIndex(files);
  const worn = !!req.worn;
  const own = classOf(req.classe);
  const size = (t: unknown) => (own ? (sizeOf(typeof t === 'string' ? t : undefined)?.id ?? own.taglia) : undefined);
  interface Example {
    id: string;
    info: Partial<ModelInfo>;
    xml: string;
    worn: boolean;
    /** In the request's box: its class, its size, its density. */
    boxed: boolean;
  }
  const all: Example[] = [];
  for (const [id, info] of Object.entries(index)) {
    const xml = files[`models/${id}.xml`]?.trim();
    const cls = info && typeof info === 'object' ? classOf(info.class) : undefined;
    if (!cls || !xml || id === req.id || NOT_EXAMPLES.test(id) || growsByRules(cls, info!.size) || xml.length > EXAMPLE_CHARS) continue;
    if (isVessel(cls) && !waterlineOf(xml)) continue;
    const isWorn = wornSections(xml).length > 0;
    if (isWorn && !worn) continue;
    const boxed = !!own && cls.id === own.id && size(info!.size) === size(req.taglia) && vptOf({ class: cls.id, size: info!.size, vpt: info!.vpt }) === densityFor(own, req.taglia);
    all.push({ id, info: info!, xml, worn: isWorn, boxed });
  }
  // 1. Written by hand: of the request's class, or of the first class of its family that has one.
  const byHand = (e: Example) => /mano/.test(typeof e.info.author === 'string' ? e.info.author : '') && typeof e.info.brought !== 'string';
  let first: Example | undefined;
  for (const cls of EXAMPLE_FAMILY[req.classe] ?? [req.classe]) {
    const rank = (e: Example) => [Number(e.worn === worn), Number(e.boxed), Number(e.id === cls)];
    const of = all.filter((e) => e.info.class === cls && byHand(e)).sort((a, b) => {
      const [x, y] = [rank(a), rank(b)];
      return y[0] - x[0] || y[1] - x[1] || y[2] - x[2] || byId(a.id, b.id);
    });
    if ((first = of[0])) break;
  }
  // 2. The best of the universe by the Artist's vote, of the same class, box and kind.
  const vote = (e: Example) => (typeof e.info.score === 'number' && Number.isFinite(e.info.score) ? e.info.score : -1);
  const best = all.filter((e) => e.boxed && e.worn === worn && vote(e) >= EXAMPLE_SCORE && e.xml !== first?.xml).sort((a, b) => vote(b) - vote(a) || byId(a.id, b.id))[0];
  return [first, best].filter((e): e is Example => !!e).map((e) => e.xml);
}

/** The XML in an answer: inside a code fence if there is one, from the first "<" to the last ">". */
export function extractXml(raw: string): string {
  const fence = /```(?:xml)?\s*([\s\S]*?)```/.exec(raw);
  const s = fence ? fence[1] : raw;
  const a = s.indexOf('<'), b = s.lastIndexOf('>');
  return a >= 0 && b > a ? s.slice(a, b + 1).trim() : s.trim();
}

/**
 * Programs that `map` to another scale and stay there (the box is the root's own); one whose maps come back to the box (a plan at
 * 1/10, then ×10: T346, ADR-0182) takes the box it is given, like a program without `map`.
 */
const scales = (xml: string) => hasMapIn(xml) && !mapsBackToBox(xml);

/** Writes the class's box into the program's root, so that the library runs it as it was judged. */
export function withSize(xml: string, box: Vec3): string {
  if (scales(xml)) return xml;
  const m = /<(?!!)([a-z]+)\b([^>]*)>/i.exec(xml);
  if (!m) return xml;
  const attrs = /\ssize="[^"]*"/.test(m[2]) ? m[2].replace(/\ssize="[^"]*"/, ` size="${box.join(' ')}"`) : `${m[2]} size="${box.join(' ')}"`;
  return xml.slice(0, m.index) + `<${m[1]}${attrs}>` + xml.slice(m.index + m[0].length);
}

/** A program without a box of its own, and without a `map` that leaves the box's scale: the library runs it in the box of each entry's size (ADR-0160, ADR-0182). */
export const shareableProgram = (xml: string): boolean => !scales(xml) && !/\ssize="/.test(/<(?!!)[a-z]+\b[^>]*>/i.exec(xml.replace(/<!--[\s\S]*?-->/g, ''))?.[0] ?? '');

/**
 * The root without `vpt` and `under` (T494, ADR-0246): the defaults of a hand drawn program, never the Sculptor's. Its density is
 * `densityFor` or its entry's, its cellar the one the request asks (the entry's `cellar`): written there, they would change the box, the
 * lot and the soil the kernel gives it.
 */
export function withoutRootDensity(xml: string): string {
  const m = /<(?!!)([a-z]+)\b([^>]*)>/i.exec(xml);
  return m && /\s(?:vpt|under)="/.test(m[2]) ? xml.slice(0, m.index) + `<${m[1]}${m[2].replace(/\s(?:vpt|under)="[^"]*"/g, '')}>` + xml.slice(m.index + m[0].length) : xml;
}

/** The root without its `size`: a procedural program takes the box it is given. */
export function withoutSize(xml: string): string {
  const m = /<(?!!)([a-z]+)\b([^>]*)>/i.exec(xml);
  return m && /\ssize="/.test(m[2]) ? xml.slice(0, m.index) + `<${m[1]}${m[2].replace(/\ssize="[^"]*"/, '')}>` + xml.slice(m.index + m[0].length) : xml;
}

export interface Checked {
  xml: string;
  /** Where a procedural program fell (the size and the seed): the trace looks there. */
  failedAt?: { taglia: SizeTier; seed: number };
  model?: MjxModel;
  result?: RunResult;
  /** Other seeds of a procedural structure at its own size (T354): the views show their plans beside the one shown. */
  others?: Array<{ seed: number; result: RunResult }>;
  /** What a procedural structure contains at this size (T338): a larger size must contain more. */
  composition?: Composition;
  error?: string;
  /** The voxels of its cellar under the ground it was checked with (T417): 0 or absent, none. */
  base?: number;
  /** The only reason it does not pass is its cellar (T417): without the cellar it may still come in. */
  cellarOnly?: boolean;
  /** It came in without the cellar the request asked for (T417, ADR-0091 point 3). */
  cellarless?: boolean;
}

/** The files of models/ a program reads (T333-T335), from the universe's: tilesets, tiles, samples, rule files, programs it imports. */
export const filesOf = (xml: string, files: FileMap): MjxFiles => mjxIncludes(xml, (f) => files[`models/${f}`]);

/**
 * What of models/ a program may read besides the programs of the library (T336): the tilesets with their tiles, the samples and the rule
 * files, one line each, for the request. Empty if the universe has none.
 */
export function libraryResources(files: FileMap): string[] {
  const out: string[] = [];
  for (const [path, text] of Object.entries(files)) {
    const name = /^models\/([^/]+)\.(xml|txt)$/.exec(path);
    if (!name || typeof text !== 'string') continue;
    if (name[2] === 'xml' && isTileset(text)) {
      const tiles = [...text.matchAll(/<tile\b[^>]*\sname="([^"]+)"/g)].map((m) => m[1]);
      const values = /<tileset\b[^>]*\svalues="([^"]*)"/.exec(text)?.[1];
      out.push(`- tileset="${name[1]}"${values ? ` (its values "${values}")` : ''}: tiles ${tiles.join(', ')}`);
    } else if (name[2] === 'txt') {
      const rows = text.split(/\r?\n/).filter((l) => l.trim() && !isNoteLine(l));
      out.push(`- ${name[1]}.txt: ${/^[ \t]*->[ \t]*$/m.test(text) ? 'a rule (file="…")' : `a pattern or a sample, ${rows.length} line${rows.length === 1 ? '' : 's'}`}`);
    }
  }
  return out.sort().slice(0, 40);
}

/** The most parts one request lists (T471, S5 of T458 § 4.2): each is a line of its contract, 100-400 tokens. */
export const MAX_PARTS = 8;

/**
 * The specialties a part serves (T471, ADR-0241), from its entry in `models/index.json`: `specialty`, one specialty or a list of them, never
 * `actions` (an action rewrites a model that is made); what is not one is dropped. Without any, the architect's: every part of the seed was
 * the structures' before T471, and a universe keeps the entries its index has (only the seed's new ones arrive, `mergeEntries`).
 */
export function partSpecialties(info: Partial<ModelInfo> | undefined): SculptorSpecialty[] {
  const raw = info && typeof info === 'object' ? info.specialty : undefined;
  const said = (Array.isArray(raw) ? raw : [raw]).filter((s): s is SculptorSpecialty => typeof s === 'string' && s !== 'actions' && (SPECIALTIES as readonly string[]).includes(s));
  return said.length ? [...new Set(said)] : ['architect'];
}

/** The library's index as the Sculptor reads it: the fields of 0.3 internal (T308a); what does not read is an empty library. */
function libraryIndex(files: FileMap): Record<string, Partial<ModelInfo> | undefined> {
  let index: Record<string, Partial<ModelInfo> | undefined> = {};
  try {
    index = internalFields('modelIndex', JSON.parse(files['models/index.json'] ?? '{}'));
  } catch {
    index = {};
  }
  return index && typeof index === 'object' && !Array.isArray(index) ? index : {};
}

/**
 * The parts of the seed a request may include (T354, ADR-0183; by specialty since T471, ADR-0241): the programs `models/part-*.xml` of the
 * universe that are not parts of the world (those are `worldPartResources`'s) whose entry serves the request's specialty (`partSpecialties`),
 * each with its contract for the program that includes it, the first paragraph of the comment at its top. One line per part, in the order
 * of their names, at most `MAX_PARTS`; empty if the universe has none for that trade. Without `fortified` (T434), not the parts of a fort
 * (`FORT_PARTS`). The architect gets the parts one lives in and the windows; the mason the windows and the leaves; the joiner the leaves and
 * the wheel; the coachbuilder the wheel.
 */
export function partResources(files: FileMap, specialty: SculptorSpecialty = 'architect', fortified = true): string[] {
  const index = libraryIndex(files);
  const out: string[] = [];
  for (const [path, text] of Object.entries(files)) {
    const name = /^models\/(part-[a-z0-9-]+)\.xml$/.exec(path);
    if (!name || typeof text !== 'string') continue;
    const entry = Object.prototype.hasOwnProperty.call(index, name[1]) ? index[name[1]] : undefined;
    if (isWorldPart(name[1], entry) || !partSpecialties(entry).includes(specialty)) continue;
    // The parts of a fort only to a fortification (T434): offered to a cathedral or a station, the Sculptor crowned them with merlons (T153).
    if (!fortified && (FORT_PARTS as readonly string[]).includes(name[1])) continue;
    out.push(`- <import file="${name[1]}"/>: ${partContract(text) || 'a part of the seed (no contract written at its top)'}`);
  }
  return out.sort().slice(0, MAX_PARTS);
}

/**
 * The parts of the world of a trade (T472, ADR-0243): those the Sculptor took from the good models of this universe, or that came with the
 * cards that include them, whose entry serves the specialty; the best voted first, at most `WORLD_PARTS` and `room` (what `MAX_PARTS` leaves
 * to them after the parts of the seed). One line each, with the model it was taken from and its contract.
 */
export function worldPartResources(files: FileMap, specialty: SculptorSpecialty, room = WORLD_PARTS): string[] {
  const index = libraryIndex(files);
  return worldPartsIn(files, index as Record<string, unknown>)
    .filter((p) => partSpecialties(p.entry as Partial<ModelInfo>).includes(specialty))
    .slice(0, Math.max(0, Math.min(WORLD_PARTS, room)))
    .map((p) => {
      const from = typeof p.entry.from === 'string' ? index[p.entry.from]?.name : undefined;
      return `- <import file="${p.id}"/>${from ? ` (from «${from}»)` : ''}: ${partContract(p.xml) || 'a part of this world'}`;
    });
}

/** The parts of the world of a trade with their programs, the best first (T472): what the director counts and the request of a new one lists. */
export function worldPartsOf(files: FileMap, specialty: SculptorSpecialty): Array<{ id: string; xml: string }> {
  return worldPartsIn(files, libraryIndex(files) as Record<string, unknown>)
    .filter((p) => partSpecialties(p.entry as Partial<ModelInfo>).includes(specialty))
    .map(({ id, xml }) => ({ id, xml }));
}

/** What the request says before the parts of the world (T472): they are included as the parts of the seed are. */
export const WORLD_PARTS_LINE = 'Parts of this world, taken from its own good models, that the program may include in the same way where the thing has one (each says what it reads and writes; never use S nor #90-#97):';

/**
 * What the request of a thing in one box says before its parts (T471): the architect's prompt teaches the parts one lives in, the sections of
 * the other trades do not, so the request says how a part is used. The architect's request keeps its line of before.
 */
export const TRADE_PARTS = 'Parts of the seed the program may include with <import file="…"/> where the thing has one, instead of writing it: build what the part reads, mark what it asks, include it, give its letters your colours and use them for nothing else (each says what it reads and writes; never use S nor #90-#97):';

/** The voxels of cellar a request asks for (T417): only a structure that grows by rules has one, `cellar` tiles of 20 voxels (`cellarVoxels`). */
export const cellarOfRequest = (cls: AssetClass, taglia: string | undefined, cellar: number | undefined): number =>
  cellar && procedural(cls, taglia) ? cellarVoxels({ class: cls.id, ...(taglia ? { size: taglia } : {}), cellar }) : 0;

/**
 * The kernel's checks on a program: what makes it unusable goes back to the Sculptor with the reason. `files` are the universe's (`filesOf`).
 * `opts.cellar` (T417): the tiles of cellar the request asks for; the box is that much deeper and the cellar must hold and be reached from the door.
 */
export function checkProgram(xml: string, cls: AssetClass, taglia?: string, files: MjxFiles = {}, opts: CheckOptions = {}): Checked {
  // The density and the cellar are the entry's (T494, ADR-0246): a Sculptor's root never says them.
  xml = withoutRootDensity(xml);
  const base = cellarOfRequest(cls, taglia, opts.cellar);
  if (!procedural(cls, taglia)) return checkOnce(xml, cls, taglia, 1, files);
  // A procedural structure (ADR-0160): every seed the world shows at its size, and the first at the next size, which shares it.
  xml = withoutSize(xml);
  const [own, next] = triedSizes(cls, taglia);
  const tries: Array<[SizeTier, number]> = [...Array.from({ length: STRUCTURE_SEEDS }, (_, i): [SizeTier, number] => [own, i + 1]), [next, 1]];
  let first: Checked | undefined;
  let other: Checked | undefined;
  // The seeds that ran at the own size (T354): two others go back beside the one shown, so that the Sculptor sees whether the seeds vary;
  // after a fall the seeds up to 3 still run for the views (not checked).
  const ran = new Map<number, RunResult>();
  const besides = (shown: number): Checked['others'] => {
    for (let seed = 1; seed <= 3 && ran.size < 3; seed++) {
      if (ran.has(seed)) continue;
      const r = checkOnce(xml, cls, own, seed, files, opts, base).result;
      if (r) ran.set(seed, r);
    }
    return [...ran.entries()].filter(([seed]) => seed !== shown).slice(0, 2).map(([seed, result]) => ({ seed, result }));
  };
  for (const [t, seed] of tries) {
    const c = checkOnce(xml, cls, t, seed, files, opts, base);
    first ??= c;
    if (t === next) other = c;
    else if (c.result) ran.set(seed, c.result);
    if (c.error) return { ...c, xml, failedAt: { taglia: t, seed }, error: `taglia ${sizeOf(t)!.name}, seme ${seed}: ${c.error}`, others: t === own ? besides(seed) : besides(0) };
  }
  // A larger size contains more, not the same drawn bigger (T338, ADR-0179): the first seed at the two sizes.
  const [small, large] = sizeRank(own) < sizeRank(next) ? [first!, other!] : [other!, first!];
  const [smallT, largeT] = sizeRank(own) < sizeRank(next) ? [own, next] : [next, own];
  const v = small.composition && large.composition && varietyError(small.composition, large.composition, sizeOf(smallT)!.name, sizeOf(largeT)!.name);
  if (v) return { ...first!, xml, failedAt: { taglia: largeT, seed: 1 }, error: v, others: besides(1) };
  return { ...first!, others: besides(1) };
}

/**
 * The Sculptor's checks of a program at one seed of its size (T495): what `checkProgram` does at each of its seeds, for a seed the world gives
 * a structure it wears again (`lab/scripts/semi-strutture.ts` measures how the seeds past `STRUCTURE_SEEDS` hold). The error, or undefined.
 */
export function checkSeed(xml: string, cls: AssetClass, taglia: string | undefined, seed: number, files: MjxFiles = {}, opts: CheckOptions = {}): string | undefined {
  xml = withoutRootDensity(xml);
  const base = cellarOfRequest(cls, taglia, opts.cellar);
  return checkOnce(procedural(cls, taglia) ? withoutSize(xml) : xml, cls, taglia, seed, files, opts, base).error;
}

/**
 * How tall a model of a class must be at a size: a share of its box; a structure that grows by rules a share of its class's own box,
 * at every size (T338): a larger area adds what fits, and need not be taller.
 */
export const leastHeight = (cls: AssetClass, taglia?: string): number => Math.round((cls.minHeight ?? 0) * boxOf(cls, procedural(cls, taglia) ? undefined : taglia)[2]);

/** What the checks of a structure know of what was asked: a dwelling has the floor of a house to give (T413), a cellar its tiles (T417). */
export interface CheckOptions {
  dwelling?: boolean;
  cellar?: number;
}

/** The box a program is checked in: its class's at its size, `base` voxels deeper for a cellar (T417), as the library runs it (`sizeFor`). */
const checkBox = (cls: AssetClass, taglia: string | undefined, base = 0): Vec3 => {
  const [X, Y, Z] = boxOf(cls, taglia);
  return [X, Y, Z + base];
};

/** Why a structure's cellar does not hold (T417), or undefined if it does: something under the ground, every floor there reached, by the door. */
function cellarError(result: RunResult, palette: Record<string, PaletteEntry>, vpt: number, base: number, reached: number[]): string | undefined {
  if (!holesOf(result.grid, palette, base)) return 'cantina: niente sotto il suolo (D sotto il pavimento e <import file="part-cellar"/>)';
  if (!groundOfForm(result.grid, palette, vpt, base).hole) return 'cantina: un pavimento sotto il suolo non si raggiunge dal piano terra';
  if (!reached.length) return 'cantina: dalla porta non si scende in cantina';
  return undefined;
}

function checkOnce(xml: string, cls: AssetClass, taglia: string | undefined, seed: number, files: MjxFiles = {}, opts: CheckOptions = {}, base = 0): Checked {
  const box = checkBox(cls, taglia, base);
  try {
    // A program that decides on a coarse grid and maps up keeps its own size; the others get the class's box.
    const model = compileMjx(xml, { ...(scales(xml) ? {} : { size: box }), ...(base ? { base } : {}), ...(Object.keys(files).length ? { files } : {}) });
    // The nodes of T333-T335 within the world's ceilings (T336, ADR-0176), as the validator will want them.
    const nodes = worldNodeErrors(model, xml, files);
    if (nodes.length) return { xml, model, error: nodes.join('; ') };
    const result = runMjx(model, seed, { deadline: 8_000, ceilings: WORLD_NODE_LIMITS });
    if (!result.finished) return { xml, model, error: 'il programma non finisce in 8 secondi: ogni crescita deve avere steps' };
    // A structure that grows by rules is a whole of parts on the ground (T370, ADR-0206): what rests on the bottom is one body.
    const a = analyse(result, model.program.palette, { grounded: true, minHeight: leastHeight(cls, taglia), groundJoins: groundJoined(cls, taglia), base });
    const notes = [...a.errors];
    // What is worn (T290): its sections tried on the kernel's two bodies, as the validator and the world will.
    if (wornSections(xml).length) notes.push(...wornErrors(xml, { background: symbolName(model.background), palette: model.program.palette }));
    const cells = result.grid.X * result.grid.Y * result.grid.Z;
    if (a.voxels > cells * 0.85) notes.push(`riempie il ${Math.round((a.voxels / cells) * 100)}% della scatola: qualcosa cresce senza limite (manca steps?) o la prima lettera di values non è la cella vuota`);
    // A vessel (T440): the hull at its waterline, long and with the bow toward large y; from Medium up a deck reached from where one boards, the helm on it.
    if (isVessel(cls) && !notes.length) notes.push(...vesselNotes(xml, result, model.program.palette, cls, taglia));
    let composition: Composition | undefined;
    let cellarOnly = false;
    if (procedural(cls, taglia) && !notes.length) {
      // The storeys reached (ADR-0162) and the parts one lives in at their least measures, the same at every size (T338, ADR-0179).
      // A cellar is not a storey (T417): what is under the ground is counted apart, and it must hold and be reached from the door.
      const vpt = densityFor(cls, taglia);
      const walk = walkIn(result.grid, model.program.palette, vpt, base, model.actions, seed);
      const parts = habitablePartsOf(walk, vpt, partVoxels(vpt).storey.clear, base);
      if (parts.storeys.length < 2) notes.push(`piani: ${parts.storeys.length} (serve ≥ 2)`);
      notes.push(...partErrors(parts, vpt));
      // Every room of the ground floor is reached from the door (T513): a room behind a wall with no door, with the stair in it, is not.
      notes.push(...closedRoomErrors(roomsReached(walk, vpt, base).rooms));
      // A dwelling gives the house the floor of its size (T413, ADR-0213): measured as the Scenografo's bench does; a cellar is not a storey (T417).
      if (opts.dwelling && parts.storeys.length >= 2) notes.push(...dwellingErrors(storeyFloors(walk, vpt, base)));
      const down = base ? cellarError(result, model.program.palette, vpt, base, parts.cellar) : undefined;
      if (down) {
        cellarOnly = !notes.length;
        notes.push(down);
      }
      if (seed === 1) composition = compositionOf(result.grid, model.program.palette);
    }
    return { xml, model, result, ...(base ? { base } : {}), ...(composition ? { composition } : {}), ...(notes.length ? { error: notes.join('; ') } : {}), ...(cellarOnly ? { cellarOnly } : {}) };
  } catch (e) {
    return { xml, ...(base ? { base } : {}), error: e instanceof Mj3Error ? e.message : `errore: ${(e as Error).message}` };
  }
}

/** The four photographs the Artist looks at (front, right, back, left), as one image, as the world draws them (ADR-0093). */
export function views(c: Checked): string {
  const shoot = (o: RenderOptions) => [0, 1, 2, 3].map((v) => render(c.result!.grid, c.model!.program.palette, v, o));
  // Drawn at the size they are looked at, not enlarged after: the ink stays a thin line on every voxel.
  const w = shoot({ ...cartoonRender(1), outline: false }).reduce((s, v) => s + v.w + 4, 4);
  const px = Math.max(2, Math.min(6, Math.floor(1024 / w)));
  return pngDataUrl(sheet(shoot(cartoonRender(px)), 1, 4 * px, [112, 150, 84]));
}

export function describe(req: SculptRequest, cls: AssetClass): string {
  const box = boxOf(cls, req.taglia);
  const size = sizeOf(req.taglia);
  const tiles = tilesOf(cls, req.taglia);
  return [
    `Sculpt: ${req.nome}`,
    `What it looks like: ${req.aspetto}`,
    req.contesto && `Where it is: ${req.contesto}`,
    `Class: ${cls.id}${size && size.id !== cls.taglia ? ` · size ${size.id} (${tiles.join(' × ')} tiles, ${densityFor(cls, req.taglia)} voxels per tile)` : ''} · box ${box.join(' × ')} voxels${cls.minHeight ? ` · at least ${leastHeight(cls, req.taglia)} tall` : ''}`,
    req.tinta && 'It serves many things of this kind: the main colour is the letter C (the game recolours it for each one).',
    req.worn && `It is worn ${WORN_ON[req.worn]}: after the program write its <worn zone="${req.worn}"> section (see «Worn things»).`,
    procedural(cls, req.taglia) && bodyLine(cls, req.taglia),
    procedural(cls, req.taglia) && dwellingOf(req) && DWELLING_LINE,
    procedural(cls, req.taglia) && (fortifiedOf(req) ? FORTIFIED_LINE : UNFORTIFIED_LINE),
    cellarLine(req, cls),
    strataLine(req, cls),
    isVessel(cls) && vesselLine(cls, req.taglia),
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * What the request says of a cellar (T417, ADR-0091 point 4): how deep it goes, where the soil is, the part that digs it and what is checked.
 * Only in the request that asks for one: the prompt of the structures does not grow.
 */
function cellarLine(req: SculptRequest, cls: AssetClass): string | undefined {
  const base = cellarOfRequest(cls, req.taglia, req.cellar);
  if (!base) return undefined;
  const vpt = densityFor(cls, req.taglia);
  return `It has a cellar under it: the box goes ${base} voxels (${(base / vpt).toFixed(2)} tiles) under the soil, which the kernel writes at z=${base}; z=0 to ${base - 1} are under the ground. Dig it with part-cellar: mark D under the floor of a room on the soil, away from the door and from the foot of the stair, then include part-cellar after the floors rise and before part-stair, and give D, V and k your colours. The cellar must hold: a body goes down to it on foot from the door, and every floor down there is reached; if it does not, the building comes in without it.`;
}

/**
 * What the request says of the strata under the structure's lot (T479, ADR-0253): the layers from the soil down, with their colours and
 * notable features (aquifers, veins, roots), so the Architect matches cellar walls/floor (V, D in part-cellar) and foundations to the real
 * ground underneath. Only in requests that carry lot strata: the Architect's system prompt does not grow.
 */
function strataLine(req: SculptRequest, cls: AssetClass): string | undefined {
  if (!req.strata?.length || !['structure', 'building', 'monument'].includes(cls.id)) return undefined;
  const rows = [...req.strata].sort((a, b) => a.depth - b.depth);
  const runs: Array<{ from: number; to: number; row: LotStratum }> = [];
  const sameRow = (a: LotStratum, b: LotStratum) =>
    a.key === b.key && a.name === b.name && a.color === b.color && JSON.stringify(a.also ?? []) === JSON.stringify(b.also ?? []);
  for (const r of rows) {
    const prev = runs.at(-1);
    if (prev && prev.to === r.depth && sameRow(prev.row, r)) prev.to = r.depth + 1;
    else runs.push({ from: r.depth, to: r.depth + 1, row: r });
  }
  const fmt = (g: { from: number; to: number; row: LotStratum }) => {
    const r = g.row;
    const desc = r.description ? `, ${r.description}` : '';
    const also = r.also?.length ? ` + ${r.also.map((a) => `${a.name} (${a.color})`).join(', ')}` : '';
    return `${g.from}–${g.to} tiles ${r.name} (${r.color}${desc})${also}`;
  };
  const base = cellarOfRequest(cls, req.taglia, req.cellar);
  const guidance = base
    ? 'The cellar descends through these strata: match the colours and materials of its walls (V) and floor (D) in part-cellar to the stratum it is dug into (e.g. clay brick or packed earth in clay, hewn stone in bedrock, damp masonry near an aquifer), and rest its foundations on the bedrock layer.'
    : 'Rest the plinth and foundations naturally on this ground and its strata.';
  return `Strata under the lot (below the soil): ${runs.map(fmt).join('; ')}. ${guidance}`;
}

/** Whether a vessel at a size carries people (T440): from Medium up it has a deck reached from where one boards, and the helm on it. */
export const carriesPeople = (cls: AssetClass, taglia?: string): boolean => sizeRank(sizeOf(taglia)?.id ?? cls.taglia) >= sizeRank('medium');

/**
 * What a vessel's request says (T440): the body at its density, the waterline, what the kernel reads of the form (the areas) and what it
 * checks, with the numbers of its box. The prompt's «Vessels» says how; this says how much.
 */
function vesselLine(cls: AssetClass, taglia?: string): string {
  const vpt = densityFor(cls, taglia);
  const [, , Z] = boxOf(cls, taglia);
  const step = Math.round(0.2 * vpt);
  const head = Math.ceil(0.7 * vpt);
  const lines = [
    `A vessel: a tile is ${vpt} voxels, a person ${Math.ceil(1.5 * vpt)} tall, a step ${step}. The bow toward large y, the stern toward small y.`,
    `Write waterline="N" on the root: the N lowest layers (z=0 to N-1) are under the water, the kernel lays the hull that deep (1 to 40, less than ${Z}). The hull at z=N-1 must be closed (the sea does not get in) and at least ${VESSEL_LEAST.ratio} times as long (along y) as wide, its foremost eighth at most ${Math.round(VESSEL_LEAST.bow * 100)}% of its width (the bow narrows).`,
  ];
  if (carriesPeople(cls, taglia))
    lines.push(
      `Mark with area="boarding" the letter where one comes aboard (a gangway, a ladder, a step in the gap of the rail) and with area="helm" the helm (a wheel, a tiller), aft on the deck; area="hold" the floor of the hold, if it has one. The deck is dry (its floor at z=N or above), a step up or down at a time from the boarding (at most ${step} voxels), with ${head} voxels free over it; at least ${Math.round(VESSEL_LEAST.deckOverHull * 100)}% of it over the hull at the waterline; the helm within ${VESSEL_LEAST.helmReach} tiles of it. Sails and rigging above the head of whoever walks the deck.`,
    );
  return lines.join('\n');
}

/** Why a vessel's run is not one (T440): its waterline against the box, then the measures of `src/mj/vessel.ts`. */
function vesselNotes(xml: string, result: RunResult, palette: Record<string, PaletteEntry>, cls: AssetClass, taglia?: string): string[] {
  const waterline = waterlineOf(xml);
  if (waterline >= result.grid.Z) return [`nave: waterline="${waterline}" non lascia niente sopra l'acqua (la scatola è alta ${result.grid.Z})`];
  const vpt = densityFor(cls, taglia);
  return vesselErrors(measureVessel(result.grid, palette, vpt, waterline), vpt, carriesPeople(cls, taglia));
}

/**
 * What a procedural structure's message says of the body at its size, and of the size that shares the program (as the bench says it, T154);
 * the parts that do not shrink and what a larger size must add (T338, ADR-0179).
 */
function bodyLine(cls: AssetClass, taglia?: string): string {
  const [own, next] = triedSizes(cls, taglia);
  const body = (t: SizeTier) => {
    const vpt = densityFor(cls, t);
    return `a tile is ${vpt} voxels, a step ${Math.round(0.2 * vpt)}, a person ${Math.ceil(1.5 * vpt)} tall`;
  };
  const area = (t: SizeTier) => tilesOf(cls, t).slice(0, 2).join(' × ');
  const p = partVoxels(densityFor(cls, own));
  const larger = sizeRank(next) > sizeRank(own);
  return [
    `Body: ${body(own)}; the area is ${area(own)} tiles.`,
    `Parts that never shrink, at every size: a door at least ${p.door.width} × ${p.door.height}, a room at least ${p.room.side} a side under a ceiling at least ${p.storey.clear} up, a lean-to at least ${p.shelter.clear} clear and ${p.shelter.depth} deep (${PARTS.room.side} tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).`,
    `The same program also serves the size ${next} (box ${boxOf(cls, next).join(' × ')}, ${area(next)} tiles, ${body(next)}): ${larger ? 'there it must contain more' : 'here it must contain more than there'}, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with ${STRUCTURE_SEEDS} seeds: each one is another building of the same kind.`,
  ].join('\n');
}

/** What a procedural program did, node by node (T179), where it fell or at its first seed: the second request carries it. `files` are those it includes. */
export function traceOf(c: Pick<Checked, 'xml' | 'failedAt' | 'base'>, cls: AssetClass, taglia?: string, files: MjxFiles = {}): string | undefined {
  try {
    return traceText(compileMjx(c.xml, { size: checkBox(cls, c.failedAt?.taglia ?? taglia, c.base), ...(c.base ? { base: c.base } : {}), ...(Object.keys(files).length ? { files } : {}) }), c.failedAt?.seed ?? 1, { deadline: 8_000, tetto: 2500, forma: 'nodes' });
  } catch {
    return undefined;
  }
}

/** How wide a view in text is, in characters: at 100 voxels a character is 2 × 2 cells, at 200 it is 4 × 4. */
const VIEW_WIDTH = 50;

/**
 * What the Sculptor «sees» of a checked procedural program (T354, ADR-0183): the views of the seed shown (the one that fell, or the first)
 * with the cuts at every storey, the plans and heights of two other seeds beside it, and how much the seeds differ. Empty if nothing ran.
 */
export function textViews(c: Pick<Checked, 'model' | 'result' | 'others' | 'failedAt'>): string {
  if (!c.result || !c.model) return '';
  const pal = c.model.program.palette;
  const title = c.failedAt ? `Seed ${c.failedAt.seed} at ${c.failedAt.taglia}` : 'Seed 1';
  const parts = [viewsText(c.result.grid, pal, title, { width: VIEW_WIDTH, sections: sectionHeights(c.result.grid) })];
  for (const o of c.others ?? []) {
    const p = planView(o.result.grid, pal, { width: VIEW_WIDTH });
    parts.push(`### Seed ${o.seed}: plan and heights side by side\n\`\`\`\n${sideBySide(p.plan, p.heights)}\n\`\`\``);
  }
  const seeds = [c.result, ...(c.others ?? []).map((o) => o.result)];
  if (seeds.length > 1) {
    const d: number[] = [];
    seeds.forEach((a, i) => seeds.slice(i + 1).forEach((b) => d.push(planDistance(a.grid, b.grid, pal))));
    parts.push(`How much the plans of the seeds differ: ${(d.reduce((s, x) => s + x, 0) / d.length).toFixed(2)} (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).`);
  }
  return parts.join('\n');
}

/** What a dwelling's request says of its floor (T413, ADR-0213): the same at every size, measured as the check does. */
const DWELLING_LINE = `It is a dwelling (see «What fits»): the house takes most of the area, not a cottage in a garden. At least ${DWELLING.floor} tiles² of covered floor where a body stands (its centre, half a body off every wall) on the ground floor and on another storey, the ground floor in ${DWELLING.groundRooms} rooms or more of at least ${String(DWELLING.room)} tiles² each (the hall and a room) divided by an inner wall with a door: about 75 × 65 voxels inside the outer walls at every size, two storeys.`;

/**
 * What the request of a structure says of merlons and arrow slits (T434): a fortification may wear them (its parts are listed), any other
 * does not, and is told what crowns its flat tops instead. The fort of the prompt measures richness, never form (ADR-0210).
 */
const FORTIFIED_LINE = 'It is a fortification: merlons (part-battlements) and arrow slits (part-slits) belong to it.';
const UNFORTIFIED_LINE = 'It is not a fortification: no merlons, no arrow slits, nothing of a fort; its flat tops end in a cornice, a solid parapet, a railing, a skylight or a dome, as its world builds them.';

/** What each measure of the checks means, for who reads only the reason (T354): the key is how the reason begins. */
const MEANINGS: Array<[RegExp, string]> = [
  [/^piani:/, 'the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line'],
  [/^stanza:/, 'the largest square of covered floor where a body stands (the body counted), under a ceiling at least a storey up'],
  [/^piano:/, 'the clear height from a floor to its ceiling where a body stands'],
  [/^porta:/, 'the leaf the action open takes away: its width and its height'],
  [/^varietà:/, 'what the larger size contains against the smaller: the kinds of parts (letters with a piece of 8 voxels or more) and the pieces'],
  [/^riempie/, 'the share of the box that is full'],
  [/^il programma non finisce/, 'the time at the largest size: every growth needs steps'],
  [/^(non tocca terra|il corpo principale galleggia|pezzi staccati)/, 'everything must rest on the bottom and be attached to the main body'],
  [/^troppo basso/, 'the height of the top against the box of the class'],
  [/^casa:/, 'a dwelling: the covered floor of each storey where the centre of a body stands (half a body off every wall), cut into rooms where a passage is narrower than 0.4 tiles (a door in a wall cuts), in tiles² (a tile is 16 × 16 voxels)'],
  [/^cantina:/, 'the cellar under the ground: something there, every floor down there reached from the ground floor, a body going down to it on foot from the door'],
];

/** A reason of the checks with what it measures, where the measure is not plain. */
export function withMeaning(error: string): string {
  const bare = error.replace(/^taglia [^,]+, seme \d+: /, '');
  const m = MEANINGS.find(([re]) => re.test(bare));
  return m ? `${error} — ${m[1]}` : error;
}

/** The two requests of a procedural structure (T354, ADR-0183): the composition first, then the whole program. */
export const BLOCKS = {
  plan: 'Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.',
  whole: 'Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.',
};

/** A program that is only a plan (T354): a `map` to a coarser grid without the one that comes back to the box. The answer to the first block. */
export const isPlanOnly = (xml: string): boolean => hasMapIn(xml) && !mapsBackToBox(xml);

/**
 * What the game makes of a plan (the first block, T354): the plan runs with three seeds at the structure's size and with the first seed at
 * the next, and the plans come back in text (the coarse grid as it is, every letter shown). The soil of the plan is its ground: a plan on a
 * coarser grid has no voxels of the finished model to count the soil in. `error` says what did not run.
 */
export function planBlock(xml: string, cls: AssetClass, taglia?: string, files: MjxFiles = {}): { text: string; error?: string } {
  const [own, next] = triedSizes(cls, taglia);
  const src = withoutSize(xml).replace(/\ssoil="/, ' ground="');
  const parts: string[] = [];
  const errors: string[] = [];
  const grids: Array<{ grid: RunResult['grid']; pal: Record<string, PaletteEntry> }> = [];
  for (const [t, seed] of [[own, 1], [own, 2], [own, 3], [next, 1]] as Array<[SizeTier, number]>) {
    try {
      const model = compileMjx(src, { size: boxOf(cls, t), ...(Object.keys(files).length ? { files } : {}) });
      const r = runMjx(model, seed, { deadline: 8_000, ceilings: WORLD_NODE_LIMITS });
      if (!r.finished) errors.push(`${t}, seed ${seed}: the plan does not finish in 8 seconds: every growth needs steps`);
      const pal = model.program.palette;
      if (t === own) grids.push({ grid: r.grid, pal });
      parts.push(viewsText(r.grid, pal, `${t}, seed ${seed}`, { width: VIEW_WIDTH, hidden: true }));
    } catch (e) {
      errors.push(`${t}, seed ${seed}: ${e instanceof Mj3Error ? e.message : (e as Error).message}`);
      break;
    }
  }
  if (grids.length > 1) {
    const d: number[] = [];
    grids.forEach((a, i) => grids.slice(i + 1).forEach((b) => d.push(planDistance(a.grid, b.grid, a.pal))));
    parts.push(`How much the plans of the seeds differ: ${(d.reduce((s, x) => s + x, 0) / d.length).toFixed(2)} (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).`);
  }
  const error = errors.length ? errors.join('; ') : undefined;
  return { text: [...(error ? [`It does not run: ${error}`] : []), ...parts].join('\n'), ...(error ? { error } : {}) };
}

export function modelFor(req: SculptRequest, cls: AssetClass, m: SculptorAiModels, today = new Date().toISOString().slice(0, 10)): string {
  const cat = categoryOf(cls);
  if (cat === 'structure' && req.taglia && RARE_SIZES.includes(req.taglia) && (!m.importanteFino || today < m.importanteFino)) return m.important;
  return m[cat];
}

export async function judge(c: Council, req: SculptRequest, cls: AssetClass, checked: Checked, artist: string): Promise<Critique | undefined> {
  try {
    const raw = await c.ask<Partial<Critique>>('artist', 'model.judge', `${describe(req, cls)}\nThe image shows the model from four sides (front, right, back, left), as it looks in the world: flat bands of light and a dark outline where the part changes. Judge it, also by how its parts read as outlines.`, CRITIQUE_SCHEMA, {
      images: [views(checked)],
      model: artist,
      temperature: 0.3,
      data: { request: req },
    });
    return {
      score: Math.max(0, Math.min(10, Math.round(Number(raw.score) || 0))),
      recognizable: raw.recognizable === true,
      problems: Array.isArray(raw.problems) ? raw.problems.map(String) : [],
      advice: Array.isArray(raw.advice) ? raw.advice.map(String) : [],
    };
  } catch (e) {
    c.say('artist', 'errore', `non riesce a guardare «${req.nome}»: ${(e as Error).message}`, undefined, 'model.judge');
    return undefined;
  }
}

/**
 * One program that passes the kernel's checks, or the last error. `previous` turns the request into a
 * revision (the program, the photographs, the Artist's words).
 */
async function write(c: Council, req: SculptRequest, cls: AssetClass, model: string, previous?: { checked: Checked; critique: Critique }, retries = 2): Promise<{ checked?: Checked; calls: number; error?: string }> {
  const proc = procedural(cls, req.taglia);
  // The trade's prompt (T468, ADR-0239): the core first (the architect its own), then, after the principles, the «Lingua» and the style guide,
  // its section and the examples, each a stable part of its own that the cache serves.
  const specialty = specialtyOf(cls, req);
  const role = sculptorRole(c.files, specialty);
  const section = sculptorSection(c.files, specialty);
  // The procedural prompt composes from the concept: the library's programs of sole boxes would teach the opposite (T156).
  const examples = proc ? [] : examplesFor(c.files, { ...req, classe: cls.id });
  // What a procedural program did (the trace), and what the Sculptor «sees» of it (the views in text, T354): in every request that sends one back.
  const seen = (k: Checked) => {
    if (!proc) return '';
    const v = textViews(k);
    const t = traceOf(k, cls, req.taglia, filesOf(k.xml, c.files));
    return `${v ? `\nWhat the game made of it, in text:\n${v}` : ''}${t ? `\nHere is what the program did when the game ran it, node by node:\n${t}` : ''}`;
  };
  const system = [section, examples.length ? `## Examples (programs of the library)\n${examples.join('\n\n')}` : ''];
  let prompt = describe(req, cls);
  const resources = libraryResources(c.files);
  if (resources.length) prompt += `\n\nFiles of models/ the program may read (wfc tileset or sample, convchain sample, rules with file/fin/fout):\n${resources.join('\n')}`;
  // The parts of the trade (ADR-0182, ADR-0241), with their contracts: a structure includes the parts one lives in instead of writing them
  // (T354); every other trade the parts of its own, where the thing has one (T471: the windows, the leaves and lids, the wheel).
  const parts = partResources(c.files, specialty, fortifiedOf(req));
  if (parts.length)
    prompt += proc
      ? `\n\nParts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):\n${parts.join('\n')}`
      : `\n\n${TRADE_PARTS}\n${parts.join('\n')}`;
  // The parts of the world of the trade (T472, ADR-0243), in what MAX_PARTS leaves: a world without them asks as before.
  const own = worldPartResources(c.files, specialty, MAX_PARTS - parts.length);
  if (own.length) prompt += `\n\n${WORLD_PARTS_LINE}\n${own.join('\n')}`;
  const images: string[] = [];
  if (req.previous) prompt += `\n\nIts current program:\n${req.previous}\n${req.desiderio ? `What is wished: ${req.desiderio}\n` : ''}Redo it: answer with the whole program.`;
  if (previous) {
    prompt += `\n\nYour program:\n${previous.checked.xml}\nThe attached image shows it from four sides. The Artist gave it ${previous.critique.score}/10.\nProblems: ${previous.critique.problems.join('; ') || '—'}\nAdvice: ${previous.critique.advice.join('; ') || '—'}${seen(previous.checked)}\nImprove it: answer with the whole program.`;
    images.push(views(previous.checked));
  }
  const call = async (p: string) => {
    const raw = await c.write('sculptor', 'model.sculpt', p, { role, system, images, model, temperature: 0.7, specialty, data: { request: req, classe: cls.id, example: proc ? MOCK_STRUCTURE_PROGRAM : examples[0], ...(req.worn ? { worn: req.worn } : {}) } });
    return extractXml(raw);
  };
  let calls = 0;
  let first: string | undefined;
  // A structure written in blocks (T354, ADR-0183): the composition on the coarse plan first, shown back as the plans of three seeds and
  // of the next size; then the whole program. An answer that already maps back to the box is the whole program: it is checked as such.
  if (proc && !previous && !req.previous) {
    calls++;
    const plan = await call(`${prompt}\n\n## ${BLOCKS.plan}`);
    if (isPlanOnly(plan)) {
      const made = planBlock(plan, cls, req.taglia, filesOf(plan, c.files));
      calls++;
      first = await call(`${prompt}\n\n## Your program so far\n${plan}\n\n## What the game made of it\n${made.text}\n\n## ${BLOCKS.whole}`);
    } else first = plan;
  }
  let last: Checked | undefined;
  for (let i = 0; i <= retries; i++) {
    let xml: string;
    if (i === 0 && first !== undefined) xml = first;
    else {
      calls++;
      xml = await call(i === 0 ? prompt : `${prompt}\n\nThe program you wrote:\n${last!.xml.slice(0, proc ? 24_000 : 6000)}\nIt does not pass: ${proc ? withMeaning(last!.error!) : last!.error}${seen(last!)}\nFix it and answer with the whole program.`);
    }
    last = checkProgram(xml, cls, req.taglia, filesOf(xml, c.files), { dwelling: dwellingOf(req), ...(req.cellar ? { cellar: req.cellar } : {}) });
    if (!last.error) return { checked: last, calls };
    c.say('kernel', 'scarta', `«${req.nome}»: ${last.error.slice(0, 160)}`, 'sculptor', 'model.sculpt');
  }
  // A structure whose cellar does not hold comes in without it (ADR-0091 point 3): the same program, nothing under the ground, if it passes so.
  if (last?.cellarOnly) {
    const without = checkProgram(last.xml, cls, req.taglia, filesOf(last.xml, c.files), { dwelling: dwellingOf(req) });
    if (!without.error) {
      c.say('kernel', 'scarta', `«${req.nome}»: la cantina non regge, entra senza`, 'sculptor', 'model.sculpt');
      return { checked: { ...without, cellarless: true }, calls };
    }
  }
  return { calls, error: last?.error };
}

/**
 * Sculpts a model: the program (with its box written in), who wrote it, the Artist's vote. Undefined
 * if no program passed the checks (the entity keeps the generic model of its class).
 */
/**
 * `plan` (T45b, `sculptPlan` of the coefficient of revisions): how many programs for the simple things, whether a
 * figure is revised, whether the Artist judges at all (without, the first program that passes is the model).
 */
export async function sculpt(c: Council, req: SculptRequest, m: SculptorAiModels = DEFAULT_SCULPTORS, plan = { semplici: 2, revisione: true, giudizio: true }): Promise<SculptResult | undefined> {
  const cls = classOf(req.classe) ?? classOf('object')!;
  const model = modelFor(req, cls, m);
  const cat = categoryOf(cls);
  c.say('sculptor', 'propone', `«${req.nome}» (${cls.name}, ${SPECIALTY_NAMES[specialtyOf(cls, req)]}, ${model})`, undefined, 'model.sculpt');
  let calls = 0;
  const candidates: Array<{ checked: Checked; critique?: Critique }> = [];
  // Simple things: two independent programs. Figures and structures: one, and a revision if needed.
  for (let n = 0; n < (cat === 'simple' && !req.previous ? plan.semplici : 1); n++) {
    const w = await write(c, req, cls, model);
    calls += w.calls;
    if (w.checked) candidates.push({ checked: w.checked, critique: plan.giudizio ? await judge(c, req, cls, w.checked, m.artist) : undefined });
  }
  if (plan.revisione && cat !== 'simple' && candidates[0]?.critique && candidates[0].critique.score < 7) {
    const w = await write(c, req, cls, model, { checked: candidates[0].checked, critique: candidates[0].critique }, 1);
    calls += w.calls;
    if (w.checked) candidates.push({ checked: w.checked, critique: await judge(c, req, cls, w.checked, m.artist) });
  }
  if (!candidates.length) {
    c.say('sculptor', 'errore', `«${req.nome}»: nessun programma valido`, undefined, 'model.sculpt');
    return undefined;
  }
  const best = candidates.reduce((a, b) => ((b.critique?.score ?? -1) > (a.critique?.score ?? -1) ? b : a));
  const score = best.critique?.score;
  // A procedural structure keeps no box of its own: every size that shares it runs it in its own (ADR-0160).
  const place = (x: string) => (procedural(cls, req.taglia) ? withoutSize(x) : withSize(x, boxOf(cls, req.taglia)));
  if (best.critique) c.say('artist', score !== undefined && score >= 7 ? 'approva' : 'obietta', `«${req.nome}»: ${score}/10${best.critique.problems.length ? ` — ${best.critique.problems[0]}` : ''}`, 'sculptor', 'model.judge');
  const xml = `<!-- ${req.nome}: sculpted by ${model} (step 9)${score !== undefined ? `, the Artist's vote ${score}/10` : ''} -->\n${place(best.checked.xml.replace(/^\s*<!--[\s\S]*?-->\s*/, ''))}\n`;
  // Its cellar (T417): the request's, unless the program came in without it.
  const cellar = cellarOfRequest(cls, req.taglia, req.cellar) && !best.checked.cellarless ? req.cellar : undefined;
  return { xml, model, score, calls, ...(cellar ? { cellar } : {}) };
}

// Actions as rules (ADR-0044): what the wanderer does to an entity that changes its shape (it opens, cracks,
// lights up) becomes an `<action>` of the entity's program, written by the Sculptor and tried by the kernel
// on the finished model; the whole kind learns it.

export interface ActionRequest {
  /** The entity and its program (`models/<id>.xml`). */
  nome: string;
  xml: string;
  classe: string;
  /** Name of the action in the program, and its menu label. */
  azione: string;
  etichetta: string;
  /** What the wanderer wrote, and how the Narrator says the look changes. */
  testo: string;
  cambia: string;
  /** The size of the model, if not its class's own (its entry in the library): with the class it says whose trade the model is (T468). */
  taglia?: SizeTier;
}

export interface ActionLetter {
  lettera: string;
  nome?: string;
  colore?: string;
  /** The letter gives light (`glow`): an action that lights or puts out swaps it with another. */
  luce?: boolean;
  voxel: number;
}

/** The program's own box, or its class's (as the library runs it). */
const boxFor = (xml: string, cls: AssetClass): { size?: Vec3 } => (/<(?!!)[a-z]+\b[^>]*\ssize="/i.test(xml) ? {} : { size: boxOf(cls) });

/** What a program compiles with: its box, and the files it reads (`filesOf`: a part it includes, T472), if any. */
const compileOptions = (xml: string, cls: AssetClass, files: MjxFiles) => ({ ...boxFor(xml, cls), ...(Object.keys(files).length ? { files } : {}) });

/** The letters of the finished model, the drawn ones with how many voxels they colour: what an action rewrites. `files` are those it reads. */
export function actionLetters(xml: string, cls: AssetClass, files: MjxFiles = {}): { background: string; letters: ActionLetter[] } {
  const model = compileMjx(xml, compileOptions(xml, cls, files));
  const g = runMjx(model, 1, { deadline: 8_000 }).grid;
  const counts = new Map<number, number>();
  for (const c of g.cells) counts.set(c, (counts.get(c) ?? 0) + 1);
  const pal = model.program.palette;
  const letters = g.alphabet
    // As the program writes them (`#12`, T342): the Sculptor writes the action with these.
    .map((ch, code) => ({ air: ch === '.', lettera: symbolName(ch), nome: pal[ch]?.name, colore: pal[ch]?.color, hidden: pal[ch]?.hidden, ...(pal[ch]?.glow ? { luce: true } : {}), voxel: counts.get(code) ?? 0 }))
    .filter((l) => !l.air && l.colore && !l.hidden && l.voxel > 0)
    .sort((a, b) => b.voxel - a.voxel)
    .map(({ hidden: _, air: __, ...l }) => l);
  return { background: symbolName(model.background), letters };
}

/** The `<action>` in an answer, named as the kernel wants it. */
export function extractAction(raw: string, name: string, label: string): string | undefined {
  const m = /<action\b[^>]*>[\s\S]*?<\/action>/.exec(extractXml(raw));
  if (!m) return undefined;
  const attr = (v: string) => v.replace(/[<>&"]/g, '');
  return m[0].replace(/^<action\b[^>]*>/, `<action name="${attr(name)}" label="${attr(label)}">`);
}

/**
 * The kernel's checks on a new action: the program with it compiles; on the finished model the action
 * finishes, changes something, and does not empty it (at least half of what is drawn stays drawn).
 * Returns the program with the action beside the root, or the reason. `files` are those the program reads (a part it includes, T472).
 */
export function checkAction(xml: string, clip: string, name: string, cls: AssetClass, files: MjxFiles = {}): { xml?: string; error?: string } {
  if ([...xml.matchAll(/<action\s[^>]*name="([^"]*)"/g)].some((m) => m[1] === name)) return { error: `il modello ha già un'azione "${name}"` };
  const full = `${xml.trimEnd()}\n${clip.trim()}\n`;
  try {
    const model = compileMjx(full, compileOptions(full, cls, files));
    const a = model.actions.find((x) => x.name === name);
    if (!a) return { error: `manca <action name="${name}">` };
    const r = runMjx(model, 1, { deadline: 8_000 });
    if (!r.finished) return { error: 'il modello non finisce più in 8 secondi' };
    const g = r.grid;
    const pal = model.program.palette;
    const drawn = (cells: Uint8Array, alphabet: string[]) => cells.reduce((n, c) => n + (alphabet[c] !== '.' && pal[alphabet[c]]?.color && !pal[alphabet[c]]?.hidden ? 1 : 0), 0);
    const before = new Uint8Array(g.cells);
    const beforeDrawn = drawn(before, g.alphabet);
    const res = act(g, a, 1);
    if (!res.finished) return { error: "l'azione non finisce: ogni regola che si ripete deve avere steps, o cambiare lettere che poi non trova più" };
    let changed = 0;
    for (let i = 0; i < before.length; i++) if (before[i] !== g.cells[i]) changed++;
    if (!changed) return { error: "l'azione non cambia niente: le lettere in \"in\" devono esserci nel modello finito (sono quelle dell'elenco)" };
    const afterDrawn = drawn(g.cells, g.alphabet);
    if (afterDrawn < beforeDrawn * 0.5) return { error: `l'azione svuota il modello (restano ${afterDrawn} voxel su ${beforeDrawn}): deve cambiarne una parte, non cancellarlo` };
    return { xml: full };
  } catch (e) {
    return { error: e instanceof Mj3Error ? e.message : `errore: ${(e as Error).message}` };
  }
}

/** The Sculptor writes an action for a model; undefined if none passes the kernel's checks. */
export async function sculptAction(c: Council, req: ActionRequest, model: string, retries = 2): Promise<{ xml: string; calls: number } | undefined> {
  const cls = classOf(req.classe) ?? classOf('object')!;
  // A model that includes a part reads it (T472): of the seed or of the world, from the universe's models/.
  const files = filesOf(req.xml, c.files);
  let info: ReturnType<typeof actionLetters>;
  try {
    info = actionLetters(req.xml, cls, files);
  } catch {
    return undefined;
  }
  const letters = info.letters.map((l) => `${l.lettera} (${l.nome ?? 'no name'}, #${l.colore?.replace('#', '')}, ${l.voxel} voxels${l.luce ? ', glowing' : ''})`).join(', ');
  const prompt = [
    `The wanderer, in front of «${req.nome}», does: «${req.testo}». The Council decided that its look changes like this: ${req.cambia}.`,
    `Write ONE rule <action name="${req.azione}" label="${req.etichetta}">nodes</action> for the program below: the nodes run once on the finished model and change it (like the door that opens: <action name="open" label="Apri la porta"><all><rule in="O" out="h"/></all></action>).`,
    `Use ONLY the letters of the finished model (the empty cell is ${info.background}): ${letters}. Change a part of the model, do not empty it; put steps on the rules that could repeat forever. It will hold for all the things of this kind.`,
    `The program:\n${req.xml.slice(0, 8000)}`,
    'Answer with the <action> only.',
  ].join('\n\n');
  let last: { clip?: string; error?: string } = {};
  let calls = 0;
  // The core of the actions and the section of the model's trade (T468): its letters and its conventions, not its whole craft.
  const role = sculptorRole(c.files, 'actions');
  const section = sculptorSection(c.files, 'actions', specialtyOf(cls, { ...(req.taglia ? { taglia: req.taglia } : {}) }));
  for (let i = 0; i <= retries; i++) {
    const p = i === 0 ? prompt : `${prompt}\n\nYou wrote:\n${last.clip ?? '(nothing)'}\nIt does not pass: ${last.error}\nFix it and answer with the <action> only.`;
    calls++;
    const raw = await c.write('sculptor', 'model.action', p, { role, system: [section], model, temperature: 0.4, specialty: 'actions', data: { request: req, background: info.background, letters: info.letters } });
    const clip = extractAction(raw, req.azione, req.etichetta);
    const checked = clip ? checkAction(req.xml, clip, req.azione, cls, files) : { error: 'manca <action>…</action>' };
    if (checked.xml) return { xml: checked.xml, calls };
    last = { clip: clip ?? raw.slice(0, 400), error: checked.error };
    c.say('kernel', 'scarta', `azione «${req.etichetta}» di «${req.nome}»: ${checked.error?.slice(0, 160)}`, 'sculptor', 'model.action');
  }
  return undefined;
}
