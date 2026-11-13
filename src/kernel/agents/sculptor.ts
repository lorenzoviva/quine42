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
import { analyse, compositionOf, partErrors, varietyError, type Composition } from '../../mj/check';
import { boxOf, classOf, CLASSES, densityFor, growsByRules, partVoxels, PARTS, RARE_SIZES, sizeOf, sizeRank, SIZE_TIERS, TILE, tilesOf, type AssetClass, type SizeTier } from '../../mj/classes';
import { Mj3Error, type PaletteEntry, type RunResult, type Vec3 } from '../../mj/engine';
import { compileMjx, hasMapIn, mapsBackToBox, mjxIncludes, type MjxFiles, type MjxModel } from '../../mj/model';
import { MJ_PALETTE } from '../../mj/palette';
import { cartoonRender, render, sheet, type RenderOptions } from '../../mj/photo';
import { pngDataUrl } from '../../mj/png';
import { act, runMjx } from '../../mj/run';
import { isNoteLine, symbolName } from '../../mj/symbols';
import { traceText } from '../../mj/trace';
import { planDistance, planView, sectionHeights, sideBySide, viewsText } from '../../mj/views';
import { habitableParts } from '../forms';
import type { FileMap } from '../types';
import { internalFields } from '../internalNames';
import { isTileset, WORLD_NODE_LIMITS, worldNodeErrors } from '../validator';
import { wornErrors, wornSections, type WornZone } from '../../mj/worn';
import type { Council } from './council';

export type ModelCategory = 'simple' | 'figure' | 'structure';

export const categoryOf = (cls: AssetClass): ModelCategory =>
  ['person', 'animal', 'beast'].includes(cls.id) ? 'figure' : ['building', 'monument', 'structure'].includes(cls.id) ? 'structure' : 'simple';

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
}

export const DEFAULT_SCULPTORS: SculptorAiModels = {
  simple: 'gemini-3.1-flash-lite',
  figure: 'gemini-3.8-flash',
  structure: 'gemini-3.8-flash',
  important: 'gemini-4-argon',
  importanteFino: '2026-12-01',
  artist: 'gemini-3.5-flash',
  musician: 'gemini-3.8-flash',
};

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
}

/** Where a thing is worn, as the request says it. */
const WORN_ON: Record<WornZone, string> = { head: 'on the head', torso: 'on the torso', back: 'on the back' };

export interface Critique {
  voto: number;
  riconoscibile: boolean;
  problemi: string[];
  consigli: string[];
}

export interface SculptResult {
  xml: string;
  model: string;
  voto?: number;
  calls: number;
}

const CRITIQUE_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    voto: { type: 'INTEGER', description: '0-10' },
    riconoscibile: { type: 'BOOLEAN' },
    problemi: { type: 'ARRAY', items: { type: 'STRING' } },
    consigli: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['voto', 'riconoscibile', 'problemi', 'consigli'],
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
 * Where the structures' prompt begins in `prompts/agents/sculptor.md`: what comes before is for every other class. The part after it has
 * no skeleton (T354, ADR-0183: a program in the prompt is copied, and every concept came out the same building, T337): the method of the
 * composition on a coarse plan, the parts of the seed, the blocks. Offline the Sculptor answers with `MOCK_STRUCTURE_PROGRAM`.
 */
export const STRUCTURES_MARK = '<!-- strutture -->';

/**
 * The Sculptor's instructions (prompts/agents/sculptor.md) with the scale, the classes, the sizes and the palette; for the
 * procedural structures the part after `STRUCTURES_MARK`, which says its own numbers.
 */
export function sculptorRole(files: FileMap, structures = false): string {
  const palette = Object.entries(MJ_PALETTE).map(([k, v]) => `${k} ${v.color.slice(1)}`).join(' · ');
  const text = files['prompts/agents/sculptor.md'] ?? 'You are the Sculptor: you write MarkovJunior programs in XML.';
  const at = text.indexOf(STRUCTURES_MARK);
  if (structures && at >= 0) return text.slice(at + STRUCTURES_MARK.length).trim();
  return (at >= 0 ? text.slice(0, at).trimEnd() : text)
    .replaceAll('@@TILE@@', String(TILE))
    .replace('@@CLASSES@@', [...CLASSES.map(classLine), sizesLine()].join('\n'))
    .replace('@@PALETTE@@', palette);
}

/** Up to two programs of the library of the same class (or family) to learn from: the hand-written first, then those that came with the cards (T295). */
export function examplesFor(files: FileMap, classe: string): string[] {
  let index: Record<string, { class?: string; author?: string; brought?: string }> = {};
  try {
    // The fields of 0.3 (`classe`, `autore`) read internal (T308a).
    index = internalFields('modelIndex', JSON.parse(files['models/index.json'] ?? '{}'));
  } catch {
    index = {};
  }
  const family: Record<string, string[]> = { person: ['person', 'animal'], animal: ['animal', 'person'], beast: ['beast', 'animal'], tree: ['tree', 'bush'], bush: ['bush', 'tree'], rock: ['rock', 'pebble'], pebble: ['pebble', 'rock'], object: ['object', 'furniture'], furniture: ['furniture', 'object'], building: ['building', 'structure'], structure: ['structure', 'building'], monument: ['monument', 'building'] };
  const ids = Object.keys(index).filter((id) => files[`models/${id}.xml`]);
  const picked: string[] = [];
  for (const cls of family[classe] ?? [classe, 'furniture']) {
    // The hand-written first, then what the master brought from other worlds (the world's look grows from them), then the rest.
    const rank = (id: string) => (/mano/.test(index[id].author ?? '') ? 2 : typeof index[id].brought === 'string' ? 1 : 0);
    const of = ids.filter((id) => index[id].class === cls).sort((a, b) => rank(b) - rank(a));
    for (const id of of) if (picked.length < 2 && !picked.includes(id)) picked.push(id);
  }
  return picked.map((id) => files[`models/${id}.xml`].trim());
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

/**
 * The parts one lives in that a structure may include (T354, ADR-0183): the programs `models/part-*.xml` of the universe (the sub-blocks
 * of the seed, ADR-0182), each with its contract for the program that includes it, the first paragraph of the comment at its top. One
 * entry per part, for the request; empty if the universe has none.
 */
export function partResources(files: FileMap): string[] {
  const out: string[] = [];
  for (const [path, text] of Object.entries(files)) {
    const name = /^models\/(part-[a-z0-9-]+)\.xml$/.exec(path);
    if (!name || typeof text !== 'string') continue;
    const comment = /^\s*<!--([\s\S]*?)-->/.exec(text)?.[1]?.trim();
    const contract = comment?.split(/\n\s*\n/)[0]?.replace(/\s*\n\s*/g, ' ').trim();
    out.push(`- <import file="${name[1]}"/>: ${contract || 'a part of the seed (no contract written at its top)'}`);
  }
  return out.sort();
}

/** The kernel's checks on a program: what makes it unusable goes back to the Sculptor with the reason. `files` are the universe's (`filesOf`). */
export function checkProgram(xml: string, cls: AssetClass, taglia?: string, files: MjxFiles = {}): Checked {
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
      const r = checkOnce(xml, cls, own, seed, files).result;
      if (r) ran.set(seed, r);
    }
    return [...ran.entries()].filter(([seed]) => seed !== shown).slice(0, 2).map(([seed, result]) => ({ seed, result }));
  };
  for (const [t, seed] of tries) {
    const c = checkOnce(xml, cls, t, seed, files);
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
 * How tall a model of a class must be at a size: a share of its box; a structure that grows by rules a share of its class's own box,
 * at every size (T338): a larger area adds what fits, and need not be taller.
 */
export const leastHeight = (cls: AssetClass, taglia?: string): number => Math.round((cls.minHeight ?? 0) * boxOf(cls, procedural(cls, taglia) ? undefined : taglia)[2]);

function checkOnce(xml: string, cls: AssetClass, taglia: string | undefined, seed: number, files: MjxFiles = {}): Checked {
  const box = boxOf(cls, taglia);
  try {
    // A program that decides on a coarse grid and maps up keeps its own size; the others get the class's box.
    const model = compileMjx(xml, { ...(scales(xml) ? {} : { size: box }), ...(Object.keys(files).length ? { files } : {}) });
    // The nodes of T333-T335 within the world's ceilings (T336, ADR-0176), as the validator will want them.
    const nodes = worldNodeErrors(model, xml, files);
    if (nodes.length) return { xml, model, error: nodes.join('; ') };
    const result = runMjx(model, seed, { deadline: 8_000, ceilings: WORLD_NODE_LIMITS });
    if (!result.finished) return { xml, model, error: 'il programma non finisce in 8 secondi: ogni crescita deve avere steps' };
    const a = analyse(result, model.program.palette, { grounded: true, minHeight: leastHeight(cls, taglia) });
    const notes = [...a.errors];
    // What is worn (T290): its sections tried on the kernel's two bodies, as the validator and the world will.
    if (wornSections(xml).length) notes.push(...wornErrors(xml, { background: symbolName(model.background), palette: model.program.palette }));
    const cells = result.grid.X * result.grid.Y * result.grid.Z;
    if (a.voxels > cells * 0.85) notes.push(`riempie il ${Math.round((a.voxels / cells) * 100)}% della scatola: qualcosa cresce senza limite (manca steps?) o la prima lettera di values non è la cella vuota`);
    let composition: Composition | undefined;
    if (procedural(cls, taglia) && !notes.length) {
      // The storeys reached (ADR-0162) and the parts one lives in at their least measures, the same at every size (T338, ADR-0179).
      const vpt = densityFor(cls, taglia);
      const parts = habitableParts(result.grid, model.program.palette, vpt, partVoxels(vpt).storey.clear, 0, model.actions, seed);
      if (parts.storeys.length < 2) notes.push(`piani: ${parts.storeys.length} (serve ≥ 2)`);
      notes.push(...partErrors(parts, vpt));
      if (seed === 1) composition = compositionOf(result.grid, model.program.palette);
    }
    return { xml, model, result, ...(composition ? { composition } : {}), ...(notes.length ? { error: notes.join('; ') } : {}) };
  } catch (e) {
    return { xml, error: e instanceof Mj3Error ? e.message : `errore: ${(e as Error).message}` };
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
  ]
    .filter(Boolean)
    .join('\n');
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
export function traceOf(c: Pick<Checked, 'xml' | 'failedAt'>, cls: AssetClass, taglia?: string, files: MjxFiles = {}): string | undefined {
  try {
    return traceText(compileMjx(c.xml, { size: boxOf(cls, c.failedAt?.taglia ?? taglia), ...(Object.keys(files).length ? { files } : {}) }), c.failedAt?.seed ?? 1, { deadline: 8_000, tetto: 2500, forma: 'nodes' });
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
      voto: Math.max(0, Math.min(10, Math.round(Number(raw.voto) || 0))),
      riconoscibile: raw.riconoscibile === true,
      problemi: Array.isArray(raw.problemi) ? raw.problemi.map(String) : [],
      consigli: Array.isArray(raw.consigli) ? raw.consigli.map(String) : [],
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
  const role = sculptorRole(c.files, proc);
  // The procedural prompt composes from the concept: the library's programs of sole boxes would teach the opposite (T156).
  const examples = proc ? [] : examplesFor(c.files, cls.id);
  // What a procedural program did (the trace), and what the Sculptor «sees» of it (the views in text, T354): in every request that sends one back.
  const seen = (k: Checked) => {
    if (!proc) return '';
    const v = textViews(k);
    const t = traceOf(k, cls, req.taglia, filesOf(k.xml, c.files));
    return `${v ? `\nWhat the game made of it, in text:\n${v}` : ''}${t ? `\nHere is what the program did when the game ran it, node by node:\n${t}` : ''}`;
  };
  const system = examples.length ? `## Examples (programs of the library)\n${examples.join('\n\n')}` : undefined;
  let prompt = describe(req, cls);
  const resources = libraryResources(c.files);
  if (resources.length) prompt += `\n\nFiles of models/ the program may read (wfc tileset or sample, convchain sample, rules with file/fin/fout):\n${resources.join('\n')}`;
  // The parts one lives in (ADR-0182), with their contracts: a structure includes them instead of writing them (T354).
  const parts = proc ? partResources(c.files) : [];
  if (parts.length) prompt += `\n\nParts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):\n${parts.join('\n')}`;
  const images: string[] = [];
  if (req.previous) prompt += `\n\nIts current program:\n${req.previous}\n${req.desiderio ? `What is wished: ${req.desiderio}\n` : ''}Redo it: answer with the whole program.`;
  if (previous) {
    prompt += `\n\nYour program:\n${previous.checked.xml}\nThe attached image shows it from four sides. The Artist gave it ${previous.critique.voto}/10.\nProblems: ${previous.critique.problemi.join('; ') || '—'}\nAdvice: ${previous.critique.consigli.join('; ') || '—'}${seen(previous.checked)}\nImprove it: answer with the whole program.`;
    images.push(views(previous.checked));
  }
  const call = async (p: string) => {
    const raw = await c.write('sculptor', 'model.sculpt', p, { role, system, images, model, temperature: 0.7, data: { request: req, classe: cls.id, example: proc ? MOCK_STRUCTURE_PROGRAM : examples[0], ...(req.worn ? { worn: req.worn } : {}) } });
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
    last = checkProgram(xml, cls, req.taglia, filesOf(xml, c.files));
    if (!last.error) return { checked: last, calls };
    c.say('kernel', 'scarta', `«${req.nome}»: ${last.error.slice(0, 160)}`, 'sculptor', 'model.sculpt');
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
  c.say('sculptor', 'propone', `«${req.nome}» (${cls.name}, ${model})`, undefined, 'model.sculpt');
  let calls = 0;
  const candidates: Array<{ checked: Checked; critique?: Critique }> = [];
  // Simple things: two independent programs. Figures and structures: one, and a revision if needed.
  for (let n = 0; n < (cat === 'simple' && !req.previous ? plan.semplici : 1); n++) {
    const w = await write(c, req, cls, model);
    calls += w.calls;
    if (w.checked) candidates.push({ checked: w.checked, critique: plan.giudizio ? await judge(c, req, cls, w.checked, m.artist) : undefined });
  }
  if (plan.revisione && cat !== 'simple' && candidates[0]?.critique && candidates[0].critique.voto < 7) {
    const w = await write(c, req, cls, model, { checked: candidates[0].checked, critique: candidates[0].critique }, 1);
    calls += w.calls;
    if (w.checked) candidates.push({ checked: w.checked, critique: await judge(c, req, cls, w.checked, m.artist) });
  }
  if (!candidates.length) {
    c.say('sculptor', 'errore', `«${req.nome}»: nessun programma valido`, undefined, 'model.sculpt');
    return undefined;
  }
  const best = candidates.reduce((a, b) => ((b.critique?.voto ?? -1) > (a.critique?.voto ?? -1) ? b : a));
  const voto = best.critique?.voto;
  // A procedural structure keeps no box of its own: every size that shares it runs it in its own (ADR-0160).
  const place = (x: string) => (procedural(cls, req.taglia) ? withoutSize(x) : withSize(x, boxOf(cls, req.taglia)));
  if (best.critique) c.say('artist', voto !== undefined && voto >= 7 ? 'approva' : 'obietta', `«${req.nome}»: ${voto}/10${best.critique.problemi.length ? ` — ${best.critique.problemi[0]}` : ''}`, 'sculptor', 'model.judge');
  const xml = `<!-- ${req.nome}: sculpted by ${model} (step 9)${voto !== undefined ? `, the Artist's vote ${voto}/10` : ''} -->\n${place(best.checked.xml.replace(/^\s*<!--[\s\S]*?-->\s*/, ''))}\n`;
  return { xml, model, voto, calls };
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

/** The letters of the finished model, the drawn ones with how many voxels they colour: what an action rewrites. */
export function actionLetters(xml: string, cls: AssetClass): { background: string; letters: ActionLetter[] } {
  const model = compileMjx(xml, boxFor(xml, cls));
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
 * Returns the program with the action beside the root, or the reason.
 */
export function checkAction(xml: string, clip: string, name: string, cls: AssetClass): { xml?: string; error?: string } {
  if ([...xml.matchAll(/<action\s[^>]*name="([^"]*)"/g)].some((m) => m[1] === name)) return { error: `il modello ha già un'azione "${name}"` };
  const full = `${xml.trimEnd()}\n${clip.trim()}\n`;
  try {
    const model = compileMjx(full, boxFor(full, cls));
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
  let info: ReturnType<typeof actionLetters>;
  try {
    info = actionLetters(req.xml, cls);
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
  for (let i = 0; i <= retries; i++) {
    const p = i === 0 ? prompt : `${prompt}\n\nYou wrote:\n${last.clip ?? '(nothing)'}\nIt does not pass: ${last.error}\nFix it and answer with the <action> only.`;
    calls++;
    const raw = await c.write('sculptor', 'model.action', p, { role: sculptorRole(c.files), model, temperature: 0.4, data: { request: req, background: info.background, letters: info.letters } });
    const clip = extractAction(raw, req.azione, req.etichetta);
    const checked = clip ? checkAction(req.xml, clip, req.azione, cls) : { error: 'manca <action>…</action>' };
    if (checked.xml) return { xml: checked.xml, calls };
    last = { clip: clip ?? raw.slice(0, 400), error: checked.error };
    c.say('kernel', 'scarta', `azione «${req.etichetta}» di «${req.nome}»: ${checked.error?.slice(0, 160)}`, 'sculptor', 'model.action');
  }
  return undefined;
}
