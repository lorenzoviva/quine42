// The regeneration of a universe's models (T411, ADR-0216): `npm run genera -- <universo> --rigenera modelli`. The types of models the world
// wears (its structures, its furniture, its figures) are sculpted again with today's prompt by the Sculptor, judged by the Artist, the
// structures that grow by rules at 16 voxels a tile (ADR-0209) and furnished by the Scenografo (ADR-0214); everything on the subscription's
// queue (ADR-0143), step by step, each step from the validator, as the deferred generation. The bible, the places and the people stay; what
// changes in the places is their lots, where the structures at 16 would not stand on them (`regenerationPlan`). Here what does not need Node:
// which types, what is asked of the Sculptor, the lots, the steps; the command is tools/generazione/genera.ts.

import type { Kernel } from './kernel';
import type { ModelInfo } from './forms';
import type { ChunkPlan } from './agents/cartography';
import { readStructure, recutEnvironment, RECUT_TASK, type RecutPlace } from './agents/cartography';
import { repairProgram, type MjNode, type MjRule } from './mj';
import type { DeferredStep } from './deferred';
import type { TerrainDef } from './types';
import { procedural, sculpt, STRUCTURE_SEEDS, type SculptorAiModels, type SculptRequest, type SculptResult } from './agents/sculptor';
import { cellarFor, commonHouseModel, GENERIC, hasCellar, modelSize } from './modeldirector';
import { cellarOf } from './forms';
import { sculptPlan } from './coefficients';
import { classOf, growsByRules, sizeOf, STRUCTURE_VPT, TILE, tilesOf, type SizeTier } from '../mj/classes';
import { SOUND_CLASS } from '../mj/sound';
import { anthropicCost } from './ai/prices';
import type { Usage } from './ai/models';

/** The modes of a regeneration: today only the models (`--rigenera modelli`). */
export type RegenMode = 'modelli';
export const REGEN_MODES: readonly RegenMode[] = ['modelli'];
/** The name of a mode's progress beside the universes (`universes/.generation/<nome>.rigenera-modelli.json`). */
export const regenKind = (mode: RegenMode): string => `rigenera-${mode}`;

/**
 * The classes the regeneration of the models sculpts again, in the order of its steps (T411: «strutture, mobili, figure»): the furniture first,
 * which the Scenografo then chooses from, the structures each with its interior, the small buildings, the figures. The small buildings since T428
 * (ADR-0219): the common house of the lots under 5 tiles and the buildings the modules wear (a newsstand, a well) are buildings one sees, and
 * neapolis kept its handmade ones of T273, drawn as small as a piece of furniture, after its regeneration.
 */
export const REGEN_CLASSES: readonly string[] = ['furniture', 'structure', 'building', 'person', 'animal', 'beast'];

/** The tag the state of before stays under, in the universe's history (the author, 17/11): put once, before the first regeneration. */
export const BEFORE_REGENERATION = 'prima-della-rigenerazione';

/** The model of the CLI that sculpts, judges and furnishes (the author, T411: the stable Sculptor on Opus 5.5) and its effort, the bench's (T406, T413). */
export const REGEN_MODEL = 'claude-opus-5-5';
export const REGEN_EFFORT = 'low';

/** The least side of a lot of a structure (`lotsOf`: smaller is a small building's). */
const STRUCTURE_LOT = 5;
/** The side of the least lot that holds a Large structure at 16 voxels a tile (6.25 tiles; ADR-0211: the houses of the seed of 7 × 7). */
const LEAST_LOT = 7;
/** How much a lot of before grows to hold at 16 what it held at 20 (ADR-0209: the same voxels, TILE / STRUCTURE_VPT more tiles). */
const GROW = TILE / STRUCTURE_VPT;

/** A place of the universe with its plan, as `Kernel.plannedPlaces` reads them. */
export interface PlannedPlace {
  cx: number;
  cy: number;
  plan: ChunkPlan;
}

/**
 * Whether a model of the library is the kernel's own, never regenerated: the studio's (the corona, its screens and circuits), the parts of the
 * seed (`part-…`), the generic programs of the classes (they stand in for what has no model of its own, `GENERIC`), the sounds.
 */
export function kernelModel(id: string, info: Pick<ModelInfo, 'class' | 'sound'>): boolean {
  return GENERIC.has(id) || /^(corona-|schermo-|circuito-|part-)/.test(id) || !!info.sound || info.class === SOUND_CLASS;
}

/** Who wears a model of the library: a module, an item, a structure of a plan, the world's common houses. */
export interface Wearer {
  kind: 'module' | 'item' | 'structure' | 'house';
  /** The name of who wears it (a structure: its concept; the common houses: their description). */
  name: string;
  look?: string;
  context?: string;
  size?: SizeTier;
  /** A structure of a plan asked with a cellar (T417). */
  cellar?: boolean;
  place?: { name: string; description?: string };
}

/** The models the world wears and who wears them: the modules (but the wanderers' bodies), the items, the plans' structures, the common houses. */
export function wearersOf(k: Kernel, places: readonly PlannedPlace[]): Map<string, Wearer[]> {
  const out = new Map<string, Wearer[]>();
  const add = (id: string | undefined, w: Wearer) => {
    if (!id) return;
    const list = out.get(id);
    if (list) list.push(w);
    else out.set(id, [w]);
  };
  for (const m of k.modules.values()) {
    const man = m.manifest;
    if (man.kind === 'player') continue;
    const app = man.appearance;
    add(app?.model, { kind: 'module', name: man.name, ...(app?.look ?? man.description ? { look: app?.look ?? man.description } : {}), ...(man.context ? { context: man.context } : {}), ...(sizeOf(app?.size) ? { size: sizeOf(app?.size)!.id } : {}) });
  }
  for (const d of k.content.items.values()) add(d.model, { kind: 'item', name: d.name, ...(d.look ?? d.description ? { look: d.look ?? d.description } : {}) });
  for (const p of places)
    for (const raw of p.plan.structures ?? []) {
      const s = readStructure(raw);
      add(k.structureModelOf(s.concept, s.size), { kind: 'structure', name: s.concept, ...(s.size ? { size: s.size } : {}), ...(s.cellar ? { cellar: true } : {}), place: { name: p.plan.place?.name ?? '', description: p.plan.place?.description } });
    }
  const house = k.commonHouse();
  if (house) for (const classe of ['structure', 'building']) add(commonHouseModel(house, classe), { kind: 'house', name: house });
  return out;
}

/** A type of the library to sculpt again, with what the Sculptor is asked. */
export interface RegenTarget {
  id: string;
  info: ModelInfo;
  request: SculptRequest;
  /** How many wear it (modules, items, structures of the plans, the common houses). */
  wearers: number;
}

/**
 * What the Sculptor is asked for a type of before (as the `ModelDirector` asks for the missing ones): a structure by its concept, at its size,
 * with its cellar and as a dwelling for the common houses, and so a small building that stands on a lot (the common house of the lots under 5
 * tiles, T428) at its own class; a thing or a figure by who wears it, or by its own name when many do (a model shared
 * by several kinds of people is not one of them). Never its program of before: today's prompt composes from the concept.
 */
export function requestOf(id: string, info: ModelInfo, wearers: readonly Wearer[]): SculptRequest {
  const cls = classOf(info.class);
  const size = sizeOf(info.size)?.id;
  const taglia = size && size !== cls?.taglia ? size : undefined;
  const tinta = info.tint ? { tinta: true } : {};
  const onLot = info.class === 'building' && wearers.some((w) => w.kind === 'house' || w.kind === 'structure');
  if (info.class === 'structure' || onLot) {
    const s = wearers.find((w) => w.kind === 'structure');
    const house = wearers.find((w) => w.kind === 'house');
    const concept = s?.name ?? house?.name ?? info.name ?? id;
    // Its cellar (T417): the entry's, or one a plan asks for; only a structure that grows by rules has one.
    const cellar = hasCellar(info.class, taglia) ? cellarOf(info) || (wearers.some((w) => w.cellar) ? cellarFor(taglia) : 0) : 0;
    const place = s?.place?.name ? s.place : undefined;
    return {
      id,
      nome: info.name ?? concept,
      aspetto: `${concept}: a building one enters, with the door at the front${cellar ? ', with a cellar under it' : ''}${place ? `, at «${place.name}»${place.description ? ` (${place.description})` : ''}` : ''}`,
      classe: info.class,
      ...(taglia ? { taglia } : {}),
      ...(place ? { contesto: place.name } : {}),
      ...(house ? { dwelling: true } : {}),
      ...(cellar ? { cellar } : {}),
      ...tinta,
    };
  }
  const who = wearers.filter((w) => w.kind === 'module' || w.kind === 'item');
  const name = info.name ?? who[0]?.name ?? id;
  const aspetto = who.length === 1 ? (who[0].look ?? who[0].name) : who.length > 1 ? `${name}: worn by ${who.slice(0, 8).map((w) => w.name).join(', ')}` : name;
  const context = who.length === 1 ? who[0].context : undefined;
  return { id, nome: name, aspetto, classe: info.class, ...(taglia ? { taglia } : {}), ...(context ? { contesto: context } : {}), ...tinta };
}

/**
 * The types of a universe the regeneration sculpts again, in the order of its steps: of the classes asked (`REGEN_CLASSES`), worn by the world
 * (or named with `only`), with a program in the library; never the kernel's (`kernelModel`), the wanderers' bodies nor a card brought from another
 * universe (`brought`: its program is its card's).
 */
export function regenerationTargets(k: Kernel, places: readonly PlannedPlace[], opts: { classes?: readonly string[]; only?: readonly string[] } = {}): RegenTarget[] {
  const classes = opts.classes ?? REGEN_CLASSES;
  const wearers = wearersOf(k, places);
  const bodies = new Set(k.wandererModels());
  const out: RegenTarget[] = [];
  for (const [id, info] of Object.entries(k.forms.models())) {
    if (!classes.includes(info.class) || kernelModel(id, info) || bodies.has(id) || typeof info.brought === 'string') continue;
    if (opts.only ? !opts.only.includes(id) : !wearers.has(id)) continue;
    if (k.files[`models/${id}.xml`] === undefined) continue;
    const w = wearers.get(id) ?? [];
    out.push({ id, info, request: requestOf(id, info, w), wearers: w.length });
  }
  const rank = (c: string) => classes.indexOf(c);
  return out.sort((a, b) => rank(a.info.class) - rank(b.info.class) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

// --- The lots (the author, T411: «i lotti rifatti dove la taglia cambia») ------------------------------------------------------------
// A structure at 16 is a quarter larger in tiles than at 20 (a Large 6.25 tiles, ADR-0209): on the lots of a universe of before (5 × 5, 6 × 5,
// cut for 20) it would go down a size (`claimSizes`) or stand out of its lot. So the environments of those places are cut again first: the
// seed's own of today (T407, ADR-0211) where the universe kept the seed's of before, the boxes of the Cartographer's rules grown by 20/16
// (`stretchBoxes`), the stamps cut at 16 (`ChunkPlan.vpt`); taken only if no place loses a structure it shows now. A structure whose lots
// still do not hold it at 16 keeps the density of before (`vpt: 20`): the same voxels, the size it had, the lots it stood on.

/** A token of a pattern: one code, or a set (`[gpm]`) in an input. */
function tokens(row: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < row.length; i++) {
    if (row[i] === '[') {
      const end = row.indexOf(']', i);
      if (end < 0) return [];
      out.push(row.slice(i, end + 1));
      i = end;
    } else out.push(row[i]);
  }
  return out;
}

/** The indices of a side of `n` cells grown to `m`: the inner ones that `ok` lets repeat, from the middle outward, in turn; undefined if none may. */
function grown(n: number, m: number, ok: (i: number) => boolean): number[] | undefined {
  const inner = Array.from({ length: Math.max(0, n - 2) }, (_, i) => i + 1)
    .filter(ok)
    .sort((a, b) => Math.abs(a - (n - 1) / 2) - Math.abs(b - (n - 1) / 2) || a - b);
  if (m > n && !inner.length) return undefined;
  const times = new Map<number, number>();
  for (let t = 0; t < m - n; t++) times.set(inner[t % inner.length], (times.get(inner[t % inner.length]) ?? 0) + 1);
  const out: number[] = [];
  for (let i = 0; i < n; i++) for (let t = 0; t <= (times.get(i) ?? 0); t++) out.push(i);
  return out;
}

/**
 * A rule of a program that draws a structure's building (a box: its input one code or set everywhere, its output as large, walls and doors all
 * round it, at least `STRUCTURE_LOT` on a side), grown to hold at 16 what it held at 20: each side × 20/16, at least `LEAST_LOT`; `least`, only
 * to `LEAST_LOT` (a Large at 16, where the larger would not find room). The inner rows and columns without a door are repeated, so the walls stay
 * round it and its doors stay one. Undefined if it is not such a rule.
 */
export function stretchRule(rule: MjRule, walls: ReadonlySet<string>, doors: ReadonlySet<string>, least = false): MjRule | undefined {
  if (typeof rule?.in !== 'string' || typeof rule?.out !== 'string') return undefined;
  const ins = rule.in.split('/').map(tokens);
  const outs = rule.out.split('/').map((r) => [...r]);
  const h = outs.length, w = outs[0]?.length ?? 0;
  if (ins.length !== h || ins.some((r) => r.length !== w) || outs.some((r) => r.length !== w)) return undefined;
  if (Math.max(w, h) < STRUCTURE_LOT || Math.min(w, h) < 3) return undefined;
  const token = ins[0][0];
  if (ins.some((r) => r.some((t) => t !== token))) return undefined;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      if (edge && !walls.has(outs[y][x]) && !doors.has(outs[y][x])) return undefined;
    }
  const grow = least ? 1 : GROW;
  const W = Math.max(LEAST_LOT, Math.ceil(w * grow - 1e-9)), H = Math.max(LEAST_LOT, Math.ceil(h * grow - 1e-9));
  if (W === w && H === h) return undefined;
  const plain = (c: string) => !doors.has(c) && c !== '*';
  const cols = grown(w, W, (x) => outs.every((r) => plain(r[x])));
  const rows = grown(h, H, (y) => outs[y].every(plain));
  if (!cols || !rows) return undefined;
  return { ...rule, in: Array.from({ length: H }, () => token.repeat(W)).join('/'), out: rows.map((y) => cols.map((x) => outs[y][x]).join('')).join('/') };
}

/**
 * An environment's program with the buildings of its rules grown (`stretchRule`); a node whose rules grew by 20/16 draws as many buildings as it
 * covered ground before (its `steps` over (20/16)²), one grown only to `LEAST_LOT` (`least`) tries as many as before. The stamps are the kernel's
 * and stay: `ChunkPlan.vpt` cuts them at 16. `rules`: how many grew.
 */
export function stretchBoxes(program: MjNode, palette: Record<string, TerrainDef>, least = false): { program: MjNode; rules: number } {
  const walls = new Set(Object.entries(palette).filter(([, t]) => t.layer === 'wall').map(([c]) => c));
  const doors = new Set(Object.entries(palette).filter(([, t]) => t.layer === 'door').map(([c]) => c));
  let rules = 0;
  const walk = (n: MjNode): MjNode => {
    if (!n || typeof n !== 'object') return n;
    if ('rules' in n && Array.isArray(n.rules)) {
      let grew = 0;
      const next = n.rules.map((r) => {
        const s = stretchRule(r, walls, doors, least);
        if (s) grew++;
        return s ?? r;
      });
      rules += grew;
      if (!grew) return n;
      const steps = !least && typeof n.steps === 'number' && n.steps > 1 ? { steps: Math.max(1, Math.round(n.steps / (GROW * GROW))) } : {};
      return { ...n, rules: next, ...steps };
    }
    if ('children' in n && Array.isArray(n.children)) return { ...n, children: n.children.map(walk) };
    return n;
  };
  return { program: walk(JSON.parse(JSON.stringify(program)) as MjNode), rules };
}

/** Whether a program uses the kernel's stamps (cut at 16 by `ChunkPlan.vpt`). */
export function hasStamps(n: unknown): boolean {
  if (!n || typeof n !== 'object') return false;
  const node = n as { type?: unknown; children?: unknown };
  return node.type === 'stamp' || (Array.isArray(node.children) && node.children.some(hasStamps));
}

/** What the regeneration does to an environment: its new program, or only its plans cut again at 16, or nothing (and why). */
export interface EnvironmentRedo {
  id: string;
  /**
   * `seed`: the seed's of today; `stretched`: its buildings grown by 20/16; `least`: grown to 7 only; `stamps`: its stamps cut at 16;
   * `cartographer`: none of these, the Cartographer writes it again (T422); `kept`: as it is (the Cartographer could not).
   */
  how: 'seed' | 'stretched' | 'least' | 'stamps' | 'cartographer' | 'kept';
  program?: MjNode;
  /** The places on it, whose plans get `vpt: 16` (none if it is kept; the Cartographer's, once its program holds them). */
  places: Array<{ cx: number; cy: number }>;
  /** The Cartographer's (T422): the least side, walls included, of a building that holds a structure of its places at 16. */
  need?: number;
  /** Structures of its plans on lots that hold the size they wear (after, before). */
  held: number;
  before: number;
  total: number;
  why?: string;
}

/** What the regeneration will do to the lots and the densities: the environments, and the density of each structure that grows by rules. */
export interface RegenerationPlan {
  environments: EnvironmentRedo[];
  /** A structure written at 20 (`vpt: 20`), with why: some lot that wears it would not hold it at 16. Absent: at 16. */
  at20: Map<string, string>;
}

/** The tiles a lot must reach on its two sides to hold a box (its longer side, rounded up: 6.25 → 7). */
const needOf = (tiles: readonly number[] | undefined): number => Math.ceil(Math.max(tiles?.[0] ?? 0, tiles?.[1] ?? 0) - 1e-9);
/** Whether a lot holds a structure of `need` tiles, both ways, and is a structure's lot. */
const holds = (lot: { w: number; h: number } | undefined, need: number): boolean => !!lot && Math.max(lot.w, lot.h) >= STRUCTURE_LOT && Math.min(lot.w, lot.h) >= need;

/**
 * What to do to the lots (see above): for each environment with a place where a structure the regeneration sculpts at 16 would not stand on its
 * lot, the first way that loses no structure of its places and passes the validator; then the density of each structure, 20 where a lot that wears
 * it still would not hold it. `seedLayouts` are the seed's environments of today.
 */
export function regenerationPlan(k: Kernel, places: readonly PlannedPlace[], targets: readonly RegenTarget[], seedLayouts: Record<string, { program?: MjNode }>, done: ReadonlySet<string> = new Set()): RegenerationPlan {
  const S = classOf('structure')!;
  const growing = new Map(targets.filter((t) => t.info.class === 'structure' && growsByRules(S, t.info.size)).map((t) => [t.id, t]));
  const environments: EnvironmentRedo[] = [];
  const at20 = new Map<string, string>();
  if (!growing.size) return { environments, at20 };
  const house = k.commonHouse();
  const houseModel = house ? commonHouseModel(house, 'structure') : undefined;
  /** The tiles the entry a structure wears takes: at 16 if the regeneration sculpts it, else as its entry says now. */
  const tilesNow = (id: string, size?: SizeTier) => k.forms.entryTiles(id) ?? tilesOf(S, size);
  const tilesAfter = (id: string, size?: SizeTier) => (growing.has(id) ? tilesOf(S, size) : tilesNow(id, size));
  // The lots of a plan with a program and a density of stamps, and what stands on them: the plan's structures in order (one without a lot stands
  // nowhere), then the common houses.
  const wearing = (p: PlannedPlace, lots: Array<{ w: number; h: number }>) => {
    const asked = (p.plan.structures ?? []).map(readStructure);
    const own = asked.map((s, i) => ({ id: k.structureModelOf(s.concept, s.size), size: s.size, lot: lots[i] })).filter((s) => s.lot);
    const common = houseModel ? lots.slice(asked.length).filter((l) => Math.max(l.w, l.h) >= STRUCTURE_LOT).map((lot) => ({ id: houseModel, size: undefined, lot })) : [];
    return [...own, ...common];
  };
  const byEnv = new Map<string, PlannedPlace[]>();
  for (const p of places) {
    if (!p.plan.layout || !k.content.layouts[p.plan.layout]) continue;
    const list = byEnv.get(p.plan.layout);
    if (list) list.push(p);
    else byEnv.set(p.plan.layout, [p]);
  }
  const after = new Map<string, Array<{ w: number; h: number }>>();
  for (const [id, list] of byEnv) {
    const now = list.map((p) => ({ p, lots: k.structureLotSizes(p.cx, p.cy, p.plan) }));
    // Only where a structure the regeneration sculpts (a plan's own, or a common house when they are sculpted again) would not stand on its lot
    // at 16, and never twice: an environment a run already cut again keeps what it got.
    const touched = !done.has(`ambiente:${id}`) && now.some(({ p, lots }) => wearing(p, lots).some((s) => growing.has(s.id) && !holds(s.lot, needOf(tilesOf(S, s.size)))));
    if (!touched) {
      for (const { p, lots } of now) after.set(`${p.cx},${p.cy}`, lots);
      continue;
    }
    const own = (p: PlannedPlace, lots: Array<{ w: number; h: number }>, tiles: typeof tilesNow) => (p.plan.structures ?? []).map(readStructure).filter((s, i) => holds(lots[i], needOf(tiles(k.structureModelOf(s.concept, s.size), s.size)))).length;
    const before = now.reduce((n, { p, lots }) => n + own(p, lots, tilesNow), 0);
    const total = list.reduce((n, p) => n + (p.plan.structures?.length ?? 0), 0);
    const current = k.content.layouts[id].program;
    const candidates: Array<{ how: EnvironmentRedo['how']; program?: MjNode }> = [];
    const seed = seedLayouts[id]?.program;
    if (seed && JSON.stringify(seed) !== JSON.stringify(current)) candidates.push({ how: 'seed', program: seed });
    const stretched = current ? stretchBoxes(current, k.palette) : undefined;
    if (stretched?.rules) candidates.push({ how: 'stretched', program: stretched.program });
    const least = current ? stretchBoxes(current, k.palette, true) : undefined;
    if (least?.rules && JSON.stringify(least.program) !== JSON.stringify(stretched?.program)) candidates.push({ how: 'least', program: least.program });
    if (hasStamps(current) || list.some((p) => p.plan.vpt === STRUCTURE_VPT)) candidates.push({ how: 'stamps' });
    let chosen: EnvironmentRedo | undefined;
    const why: string[] = [];
    for (const c of candidates) {
      if (c.program) {
        const errs = k.validator.validateLayout(id, { ...k.content.layouts[id], program: c.program }, k.palette, k.sampleDrafts());
        if (errs.length) {
          why.push(`${c.how}: ${errs[0]}`);
          continue;
        }
      }
      const cut = list.map((p) => ({ p, lots: k.structureLotSizes(p.cx, p.cy, { ...p.plan, vpt: STRUCTURE_VPT }, c.program) }));
      // No place loses a structure that its lots hold now.
      const lost = cut.find(({ p, lots }, i) => own(p, lots, tilesAfter) < own(p, now[i].lots, tilesNow));
      if (lost) {
        why.push(`${c.how}: «${lost.p.plan.place?.name ?? `${lost.p.cx},${lost.p.cy}`}» perderebbe una struttura`);
        continue;
      }
      chosen = { id, how: c.how, ...(c.program ? { program: c.program } : {}), places: list.map((p) => ({ cx: p.cx, cy: p.cy })), held: cut.reduce((n, { p, lots }) => n + own(p, lots, tilesAfter), 0), before, total };
      for (const { p, lots } of cut) after.set(`${p.cx},${p.cy}`, lots);
      break;
    }
    if (!chosen) {
      // None of the kernel's ways (T422): the Cartographer writes it again, its step checks the program on these places; until then, as it is.
      const need = Math.max(LEAST_LOT, ...list.flatMap((p) => (p.plan.structures ?? []).map(readStructure).filter((s) => s.size !== 'gargantuan' && growing.has(k.structureModelOf(s.concept, s.size))).map((s) => needOf(tilesOf(S, s.size)))));
      chosen = { id, how: 'cartographer', places: list.map((p) => ({ cx: p.cx, cy: p.cy })), need, held: before, before, total, why: why.join('; ') || 'nessuna regola né timbro da tagliare a 16' };
      for (const { p, lots } of now) after.set(`${p.cx},${p.cy}`, lots);
    }
    environments.push(chosen);
  }
  // The density of each structure sculpted again: 20 where a lot that wears it would not hold it at 16, so its size does not change.
  const short = new Map<string, { n: number; of: number }>();
  for (const p of places) {
    const lots = after.get(`${p.cx},${p.cy}`);
    if (!lots) continue;
    for (const s of wearing(p, lots)) {
      if (!growing.has(s.id)) continue;
      const c = short.get(s.id) ?? { n: 0, of: 0 };
      c.of++;
      if (!holds(s.lot, needOf(tilesOf(S, s.size)))) c.n++;
      short.set(s.id, c);
    }
  }
  for (const [id, c] of short) if (c.n) at20.set(id, `${c.n} lott${c.n === 1 ? 'o' : 'i'} su ${c.of} non ${c.n === 1 ? 'la tiene' : 'la tengono'} a 16`);
  return { environments, at20 };
}

/**
 * Why a program of an environment does not hold, at 16, what stands on its places (T422: the Cartographer's, before it is written): a place
 * whose structures do not all find a building that holds them (`structureLotSizes`, largest first, in the plan's order), or a building of a
 * structure's size (`STRUCTURE_LOT` or more on its longer side) that would not hold a common house sculpted again. Empty: it holds.
 */
export function recutFaults(k: Kernel, places: readonly PlannedPlace[], program: MjNode, targets: readonly RegenTarget[]): string[] {
  const S = classOf('structure')!;
  const growing = new Set(targets.filter((t) => t.info.class === 'structure' && growsByRules(S, t.info.size)).map((t) => t.id));
  const house = k.commonHouse();
  const houseGrows = !!house && growing.has(commonHouseModel(house, 'structure'));
  const houseNeed = needOf(tilesOf(S, undefined));
  const out: string[] = [];
  for (const p of places) {
    const name = placeName(p);
    const lots = k.structureLotSizes(p.cx, p.cy, { ...p.plan, vpt: STRUCTURE_VPT }, program);
    const shown = lots.map((l) => `${l.w}×${l.h}`).join(', ') || 'nessuno';
    const asked = (p.plan.structures ?? []).map(readStructure);
    const needOfIt = (s: (typeof asked)[number]) => {
      const id = k.structureModelOf(s.concept, s.size);
      return needOf(growing.has(id) ? tilesOf(S, s.size) : (k.forms.entryTiles(id) ?? tilesOf(S, s.size)));
    };
    const short = asked.filter((s, i) => !holds(lots[i], needOfIt(s)));
    if (short.length) out.push(`«${name}» ha gli edifici ${shown}: ${short.map((s) => `«${s.concept}» vuole ${needOfIt(s)} × ${needOfIt(s)}`).join(', ')} e non lo trova`);
    if (houseGrows) {
      const odd = lots.slice(asked.length).filter((l) => Math.max(l.w, l.h) >= STRUCTURE_LOT && Math.min(l.w, l.h) < houseNeed);
      if (odd.length) out.push(`«${name}» ha edifici di ${odd.map((l) => `${l.w}×${l.h}`).join(', ')}: né ${houseNeed} × ${houseNeed} né al più ${STRUCTURE_LOT - 1} × ${STRUCTURE_LOT - 1}`);
    }
  }
  return out;
}

/** A place as the Cartographer and the log say it: its name and where it is (two places may have the same name). */
const placeName = (p: PlannedPlace) => `${p.plan.place?.name || 'luogo'} (${p.cx}, ${p.cy})`;

/** The terrains of a draft, the most common first, with their share: what the Cartographer is told of a place (T422). */
export function draftShares(rows: readonly string[], palette: Record<string, TerrainDef>): string {
  const n = new Map<string, number>();
  let all = 0;
  for (const r of rows)
    for (const c of r) {
      n.set(c, (n.get(c) ?? 0) + 1);
      all++;
    }
  return [...n.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([c, m]) => `${c} ${palette[c]?.name ?? '?'} ${Math.round((100 * m) / Math.max(1, all))}%`)
    .join(', ');
}

/** How many programs the Cartographer writes for an environment in one step before it is kept as it is (T422). */
export const RECUT_TRIES = 3;

/**
 * The step of an environment the Cartographer writes again (T422): told its program, the size its buildings need and its places (their
 * structures, their buildings now, their drafts), it answers with a program that the validator tries on real drafts and the kernel on the
 * drafts of its places (`recutFaults`); what does not hold goes back to it with why, up to `RECUT_TRIES` times. Written, its places are cut
 * at 16; never written, the environment stays as it is and its structures at 20 (a shortfall, the step done all the same).
 */
async function recutStep(k: Kernel, e: EnvironmentRedo, all: readonly PlannedPlace[], targets: readonly RegenTarget[], o: RegenOptions): Promise<string | true> {
  const log = (l: string) => o.log?.(l);
  const def = k.content.layouts[e.id];
  if (!def) return `ambiente sconosciuto: ${e.id}`;
  const on = new Set(e.places.map((p) => `${p.cx},${p.cy}`));
  const places = all.filter((p) => on.has(`${p.cx},${p.cy}`));
  const S = classOf('structure')!;
  const nameOf = (p: PlannedPlace) => placeName(p);
  const told: RecutPlace[] = places.map((p) => ({
    name: nameOf(p),
    structures: (p.plan.structures ?? []).map(readStructure).map((s) => ({ concept: s.concept, ...(s.size ? { size: s.size } : {}), need: needOf(tilesOf(S, s.size)) })),
    lots: k.structureLotSizes(p.cx, p.cy, p.plan).map((l) => `${l.w}×${l.h}`),
    draft: draftShares(k.placeDraft(p.cx, p.cy), k.palette),
    ...(p.plan.structures?.length ? { rows: k.placeDraft(p.cx, p.cy) } : {}),
  }));
  const before = { ...k.ai.usage };
  let feedback = '';
  for (let attempt = 1; attempt <= RECUT_TRIES; attempt++) {
    const r = await recutEnvironment(k.council, { id: e.id, def, palette: k.palette, need: e.need ?? LEAST_LOT, small: STRUCTURE_LOT, places: told, ...(feedback ? { feedback } : {}) });
    const program = r.program ? repairProgram(r.program, []) : null;
    const errs = !program ? [r.error ?? 'programma mancante o incomprensibile'] : k.validator.validateLayout(e.id, { ...def, program }, k.palette, k.sampleDrafts());
    const faults = program && !errs.length ? recutFaults(k, places, program, targets) : [];
    if (program && !errs.length && !faults.length) {
      const why = k.setEnvironmentProgram(e.id, program, `rigenerazione: l'ambiente ${e.id} per le strutture a 16 (riscritto dal Cartografo)`);
      if (why) return `l'ambiente ${e.id} non si scrive: ${why}`;
      let cut = 0;
      for (const p of places) {
        if (p.plan.vpt === STRUCTURE_VPT) continue;
        await k.savePlan(p.cx, p.cy, { ...p.plan, vpt: STRUCTURE_VPT });
        cut++;
      }
      const lots = places.map((p) => `${nameOf(p)} ${k.structureLotSizes(p.cx, p.cy, { ...p.plan, vpt: STRUCTURE_VPT }).map((l) => `${l.w}×${l.h}`).join(' ') || '-'}`);
      log(`  ${e.id}: riscritto dal Cartografo al tentativo ${attempt}${r.note ? ` («${r.note}»)` : ''}, ${cut} luoghi tagliati a 16; edifici: ${lots.join('; ')}; ${spentLine(before, k.ai.usage, o.model)}`);
      return true;
    }
    feedback = [...errs, ...faults].join('; ').slice(0, 1500);
    k.council.say('kernel', 'scarta', `ambiente «${def.name}» riscritto: ${feedback}`, 'cartographer', RECUT_TASK);
    log(`  ${e.id}: il programma del Cartografo (tentativo ${attempt}) non va: ${feedback.slice(0, 400)}`);
  }
  k.noteShortfall({ request: `l'ambiente ${e.id} per le strutture a 16`, agent: 'cartographer', task: RECUT_TASK, outcome: 'invalid', reason: feedback });
  log(`  ${e.id}: resta come prima, le sue strutture a 20 voxel per casella; ${spentLine(before, k.ai.usage, o.model)}`);
  return true;
}

// --- The steps ---------------------------------------------------------------------------------------------------------------------

/** The Sculptor and the Artist of the regeneration: one model of the CLI for every class (T411). */
export const regenSculptors = (model: string): SculptorAiModels => ({ simple: model, figure: model, structure: model, important: model, artist: model, musician: model });

/** The entry of a type sculpted again: its name, its size and the density the lots hold, who wrote it, its seeds, its vote, its tint, its cellar. */
export function regeneratedEntry(t: RegenTarget, r: SculptResult, vpt?: number): ModelInfo {
  const cls = classOf(t.info.class);
  const req = t.request;
  const proc = !!cls && procedural(cls, req.taglia);
  return {
    class: t.info.class,
    ...modelSize(req),
    ...(vpt !== undefined ? { vpt } : {}),
    name: t.info.name ?? req.nome,
    author: r.model,
    ...(proc ? { seeds: STRUCTURE_SEEDS } : t.info.seeds !== undefined ? { seeds: t.info.seeds } : {}),
    ...(r.score !== undefined ? { score: r.score } : {}),
    ...(req.tinta ? { tint: 'C' } : {}),
    ...(r.cellar ? { cellar: r.cellar } : {}),
  };
}

/** What a regeneration of the models is told: which types, at most how many this run, the model of the CLI, where it says what it does. */
export interface RegenOptions {
  classes?: readonly string[];
  only?: readonly string[];
  /** At most this many types sculpted this run (the environments and the interiors do not count). */
  max?: number;
  /** The model of the CLI (`REGEN_MODEL`): the Sculptor, the Artist and the Scenografo. */
  model: string;
  /** The seed's environments of today (`universe/` as the kernel ships it). */
  seedLayouts: Record<string, { program?: MjNode }>;
  log?: (line: string) => void;
}

/**
 * What a step asked of the queue, from the queue's usage before and after: the calls, the tokens as the CLI says them, and what they would cost
 * at Anthropic's list for the model of the CLI (at least: the CLI says the prompt's tokens written to its cache apart, and they are not here).
 */
export function spentLine(before: Pick<Usage, 'text' | 'inputTokens' | 'cachedTokens' | 'outputTokens'>, after: Usage, model: string): string {
  const calls = after.text - before.text;
  const input = after.inputTokens - before.inputTokens, read = after.cachedTokens - before.cachedTokens, output = after.outputTokens - before.outputTokens;
  const usd = anthropicCost(model, { input, read, output });
  return `${calls} chiamat${calls === 1 ? 'a' : 'e'}, ${input} token in ingresso, ${read} dalla cache, ${output} in uscita${usd !== undefined ? `, almeno ${usd.toFixed(2)} $ al listino di ${model}` : ''}`;
}

const VIA: Record<EnvironmentRedo['how'], string> = { seed: 'dal seme di oggi', stretched: 'gli edifici allargati di 20/16', least: 'gli edifici allargati a 7 caselle', stamps: 'i timbri a 16', cartographer: 'riscritto dal Cartografo', kept: 'come prima' };

/**
 * The steps of the regeneration of the models (as `runDeferred` takes them): the environments cut again (`ambiente:<id>`), then each type sculpted
 * again (`rigenera:<id>`), a structure followed by its interior (`interno:<id>`). Read from the universe as it is now at every run: what a run
 * did is in `done` and is not done again.
 */
export async function* regenerationSteps(k: Kernel, o: RegenOptions, done: Set<string>): AsyncGenerator<DeferredStep> {
  const log = (l: string) => o.log?.(l);
  const places = await k.plannedPlaces();
  const targets = regenerationTargets(k, places, o);
  const plan = regenerationPlan(k, places, targets, o.seedLayouts, done);
  const count = (c: string) => targets.filter((t) => t.info.class === c).length;
  log(`rigenerazione dei modelli: ${targets.length} tipi (${count('furniture')} mobili, ${count('structure')} strutture, ${count('building')} edifici, ${count('person') + count('animal') + count('beast')} figure) su ${places.length} luoghi pianificati`);
  const asked = plan.environments.filter((e) => e.how === 'cartographer');
  for (const e of plan.environments) {
    const how = e.how === 'cartographer' ? `da riscrivere dal Cartografo, edifici di ${e.need} × ${e.need} (${e.why})` : `${VIA[e.how]}${e.how === 'kept' ? ` (${e.why})` : `, ${e.places.length} luoghi`}`;
    log(`  ambiente ${e.id}: ${how}; strutture sui lotti che le tengono ${e.held} di ${e.total} (prima ${e.before})`);
  }
  for (const [id, why] of plan.at20) log(`  ${id}: a 20 voxel per casella${asked.length ? ' se il Cartografo non riesce' : ''}, ${why}`);
  for (const e of plan.environments) {
    if (e.how === 'kept' || done.has(`ambiente:${e.id}`)) continue;
    if (e.how === 'cartographer') {
      yield { id: `ambiente:${e.id}`, run: () => recutStep(k, e, places, targets, o) };
      continue;
    }
    yield {
      id: `ambiente:${e.id}`,
      run: async () => {
        if (e.program) {
          const why = k.setEnvironmentProgram(e.id, e.program, `rigenerazione: l'ambiente ${e.id} per le strutture a 16 (${VIA[e.how]})`);
          if (why) return `l'ambiente ${e.id} non si scrive: ${why}`;
        }
        const plans = new Map(places.map((p) => [`${p.cx},${p.cy}`, p.plan]));
        let cut = 0;
        for (const at of e.places) {
          const p = plans.get(`${at.cx},${at.cy}`);
          if (!p || p.vpt === STRUCTURE_VPT) continue;
          await k.savePlan(at.cx, at.cy, { ...p, vpt: STRUCTURE_VPT });
          cut++;
        }
        log(`  ${e.id}: ${e.program ? 'programma nuovo, ' : ''}${cut} luoghi tagliati a 16`);
        return true;
      },
    };
  }
  // The Cartographer's environments are written now (each step ended valid before this line runs): the densities from the lots they have.
  let densities = plan.at20;
  if (asked.length) {
    const after = new Set([...done, ...plan.environments.filter((e) => e.how !== 'kept').map((e) => `ambiente:${e.id}`)]);
    densities = regenerationPlan(k, await k.plannedPlaces(), targets, o.seedLayouts, after).at20;
    log(`  dopo il Cartografo: ${densities.size ? [...densities].map(([id, why]) => `${id} a 20 (${why})`).join('; ') : 'nessuna struttura a 20'}`);
  }
  const sculptors = regenSculptors(o.model);
  let made = 0;
  for (const t of targets) {
    const id = `rigenera:${t.id}`;
    let sculpted = done.has(id);
    if (!sculpted) {
      if (o.max !== undefined && made >= o.max) break;
      made++;
      yield {
        id,
        run: async () => {
          const name = t.info.name ?? t.request.nome;
          const before = { ...k.ai.usage };
          const r = await sculpt(k.council, t.request, sculptors, sculptPlan(k.coefficients().reviews));
          const spent = spentLine(before, k.ai.usage, o.model);
          if (!r) {
            const reason = k.lastDiscard('sculptor', 'model.sculpt');
            k.noteShortfall({ request: `il modello di «${name}» rigenerato`, agent: 'sculptor', task: 'model.sculpt', outcome: 'invalid', reason });
            log(`  «${name}»: nessun programma valido, resta quello di prima${reason ? ` (${reason.slice(0, 160)})` : ''}; ${spent}`);
            return true;
          }
          const vpt = densities.has(t.id) ? TILE : undefined;
          if (!k.addModel(t.id, r.xml, regeneratedEntry(t, r, vpt), `rigenerazione: ${name}`, { task: 'model.sculpt', author: 'sculptor' })) {
            log(`  «${name}»: il validatore non l'ha preso, resta quello di prima; ${spent}`);
            return true;
          }
          log(`  «${name}»: riscolpito da ${r.model}${r.score !== undefined ? `, l'Artista ${r.score}/10` : ''}${r.cellar ? `, con la cantina` : ''}${vpt ? ', a 20 voxel per casella' : ''}; ${spent}`);
          return true;
        },
      };
      // Here only once the step ended valid: `runDeferred` asks for the next one after writing it, and stops asking at the first that does not.
      sculpted = true;
    }
    const cls = classOf(t.info.class);
    const iid = `interno:${t.id}`;
    if (t.info.class !== 'structure' || !cls || !growsByRules(cls, t.info.size) || done.has(iid) || !sculpted) continue;
    yield {
      id: iid,
      run: async () => {
        // Sculpted again, the entry has no interior; one that kept its program of before keeps its interior too.
        if (k.forms.interiorSpec(t.id)) return true;
        const before = { ...k.ai.usage };
        const r = await k.furnishing.make(t.id, undefined, o.model);
        log(`  ${r.summary} ${spentLine(before, k.ai.usage, o.model)}`);
        return r.error ?? true;
      },
    };
  }
}
