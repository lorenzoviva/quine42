// The cellular automata primitive of the kernel (T482, row 9 of T459, D67 D3): parametric physical and discrete fields on the
// loaded window (`flow`, `wind`, `diffuse`, `table`) plus a programmatic escape hatch in MarkovJunior (`rules` on a `Stepper`).
//
// Everything is data within fixed kernel limits (`MAX_AUTOMATA`, `MAX_CELLS_PER_AUTOMATON`, `LOAD_BUDGET_MS`), deterministic from
// the world's seed and the steps taken (Float32 / Uint8 storage, IEEE arithmetic, `hash32`, no `Math.random`, no wall-clock cap).
// Under D3 (author decision 21/11), physical `flow` fields run at 2 cells per tile side (`cell: 0.5`) by default; cell caps and
// the fixed load budget are calibrated on this resolution.
//
// Lua never steps a field (34-155x slower and non-deterministic if cut by instruction budget): Lua reads samples (`world.field`,
// fresh copies) and places bounded sources or sinks (`world.field_add`, per-call and per-tick caps, NaN ignored, V-048).
// The world pace (`pace: hold`, ADR-0196) stops all automata cleanly.

import { hash32 } from './rng';
import { compileMjx, type MjxModel } from '../mj/model';
import { Stepper, type Grid3, type Node3, type Sym } from '../mj/engine';
import { parseXml, XmlError } from '../mj/xml';
import type { TerrainDef } from './types';

// --- Families, resolutions, limits and load budget (D3) ------------------------------------------------------------------------------

export const AUTOMATON_FAMILIES = ['flow', 'wind', 'diffuse', 'table', 'rules'] as const;
export type AutomatonFamily = (typeof AUTOMATON_FAMILIES)[number];

/** Tile width of one automaton cell: 0.5 = 2 cells per tile side (D3), 1 = 1 cell per tile, 2 or 3 = coarse grid. */
export type CellSize = 0.5 | 1 | 2 | 3;

/** Simple identifier of an automaton field (`water`, `wind`, `smoke`, `fire`…). */
export const AUTOMATON_ID_RE = /^[a-z][a-z0-9_-]{0,31}$/;

/** Maximum automata declared in one world (T459 § 5.5). */
export const MAX_AUTOMATA = 6;
/** Nominal kernel tick frequency (Hz): stepping uses an exact integer accumulator against this rate. */
export const TICK_HZ = 60;

/** Reference loaded window of T459 (6 × 5 places of 18 tiles = 108 × 90 = 9,720 tiles), used for the deterministic load calculation. */
export const REF_WINDOW = { w: 108, h: 90, tiles: 9_720 } as const;

/**
 * Maximum cells per automaton window (D3): fits up to 37 loaded places (7 × 5 = 35 places = 45,360 cells) at 2 cells per tile side
 * (`cell: 0.5`), preventing memory or CPU blow-up if chunks are wide.
 */
export const MAX_CELLS_PER_AUTOMATON = 48_000;
/** Maximum disconnected chunk-cluster windows per automaton (multiplayer wanderers far apart, T459 § 5.6). */
export const MAX_WINDOWS_PER_AUTOMATON = 4;

/** Allowed cell sizes (tiles per cell side) per family. Under D3 `flow` supports `0.5` (2 cells/tile side) and `1`. */
export const CELL_SIZES: Readonly<Record<AutomatonFamily, readonly CellSize[]>> = {
  flow: [0.5, 1],
  wind: [1, 2, 3],
  diffuse: [0.5, 1, 2, 3],
  table: [0.5, 1, 2],
  rules: [0.5, 1, 2],
};

/**
 * Default cell size per family: `flow` defaults to 0.5 (2 cells/tile side, D3); `wind` to 1 (one cell per tile, T484: the finest the fixed
 * load holds beside the water at two cells per tile side, measured in `lab/scripts/misura-vento.ts`); others to 1.
 */
export const DEFAULT_CELL: Readonly<Record<AutomatonFamily, CellSize>> = {
  flow: 0.5,
  wind: 1,
  diffuse: 1,
  table: 1,
  rules: 1,
};

/** Allowed step frequencies (steps per second) per family (T459 § 5.5). */
export const HZ_LIMITS: Readonly<Record<AutomatonFamily, { min: number; max: number; def: number }>> = {
  flow: { min: 1, max: 60, def: 60 },
  wind: { min: 1, max: 10, def: 10 },
  diffuse: { min: 1, max: 10, def: 10 },
  table: { min: 1, max: 10, def: 10 },
  rules: { min: 1, max: 10, def: 10 },
};

/**
 * Measured cost per cell and step (nanoseconds), used for the deterministic static load check (`automatonLoadMs`).
 * Calibrated on `automata.ts` over the 108 × 90 reference window (D3: `flow` at `cell: 0.5` = 38,880 cells); `wind` measured again by T484
 * (`lab/scripts/misura-vento.ts`: 112-115 ns a cell at every cell size, the step cut in rows as a whole one).
 */
export const NS_PER_CELL: Readonly<Record<AutomatonFamily, number>> = {
  flow: 35,
  wind: 115,
  diffuse: 10,
  table: 42,
  rules: 65,
};

/**
 * Fixed load budget across all automata in a world (ms per 60 Hz tick, i.e. 120 ms/s, 12% of the 16.7 ms frame budget).
 * Raised from T459's D1 proposal (1.5 ms) to accommodate D3's `flow` at 2 cells/tile side (~1.21 ms/tick) together with
 * `wind`, `diffuse`, `table`, `rules` (or a second 1-cell/tile `flow`), while rejecting two full-resolution D3 `flow` fields.
 */
export const LOAD_BUDGET_MS = 2.0;

/** Family-specific parameter limits: validated without clamping by `validateAutomaton`, safely repaired by `repairAutomata`. */
export const FLOW_LIMITS = { gravity: [0.5, 20] as const, damp: [0.5, 0.999] as const, level: [-32, 64] as const, maxDepth: 32, maxSources: 8, maxWalls: 16 };
export const WIND_LIMITS = { tau: [0.52, 2] as const, inflow: 0.08, maxSpeed: 0.12, layerHeight: [0, 32] as const, maxObstacles: 16 };
/**
 * How the prevailing wind turns with the world's time (T484, T459 § 5.3): a slow function of the day and the seed, as the light is, never of
 * a clock. `perDay` keyframes to a day, each veering the mean direction by at most `veer` radians and taking up to `calm` of its strength;
 * between two the wind eases from one to the other. Without `prevailing` the mean is `strength` toward one of 16 points of the compass, from
 * the seed.
 */
export const PREVAILING = { perDay: 4, veer: 0.6, calm: 0.5, strength: 0.06 } as const;

export const DIFFUSE_LIMITS = { rate: [0, 0.24] as const, decay: [0, 0.5] as const, sourceValue: [0, 100] as const, maxValue: 100, advectScale: [0, 2] as const, maxSources: 8, maxWalls: 16 };
export const TABLE_LIMITS = { states: [2, 16] as const, maxRules: 64, maxInitial: 16, maxWalls: 16 };
export const RULES_LIMITS = { chars: 8000, states: [2, 16] as const, steps: [1, 4] as const, maxInitial: 16 };

/**
 * Security caps on `world.field_add` (V-048, T459 § 5.5-5.6): a Lua module places sources or sinks on events, never floods the
 * world or breaks numerical stability. Per-call magnitude cap + per-tick call count cap + per-tick total magnitude cap.
 */
export const FIELD_ADD_LIMITS = {
  maxCallsPerTick: 64,
  flow: { perCall: 2, perTick: 8, maxDepth: FLOW_LIMITS.maxDepth },
  wind: { perCall: 0.04, perTick: 0.4, maxSpeed: WIND_LIMITS.maxSpeed },
  diffuse: { perCall: 10, perTick: 50, maxValue: DIFFUSE_LIMITS.maxValue },
  discrete: { perTick: 64 },
} as const;

// --- Spec types (stored in `universe.json → nature.automata`) ------------------------------------------------------------------------

export interface AutomatonBase {
  id: string;
  family: AutomatonFamily;
  cell?: CellSize;
  hz?: number;
}

export interface FlowSpec extends AutomatonBase {
  family: 'flow';
  gravity?: number;
  damp?: number;
  /** Tile codes that hold a constant surface level (`level` or world sea level). */
  sources?: string[];
  /** Tile codes that block flow completely. */
  walls?: string[];
  /** Constant surface level of source tiles (tiles); defaults to the world's sea level when omitted. */
  level?: number;
}

export interface WindSpec extends AutomatonBase {
  family: 'wind';
  /** BGK relaxation time (> 0.5): controls air viscosity. */
  tau?: number;
  /** Prevailing inflow velocity `[ux, uy]` in lattice units (|u| ≤ 0.08). */
  prevailing?: [number, number];
  /** Ground elevation above sea level (tiles) that blocks the wind layer. */
  layerHeight?: number;
  /** Tile codes that always block the wind. */
  obstacles?: string[];
}

export interface DiffuseSpec extends AutomatonBase {
  family: 'diffuse';
  /** Diffusion rate per step (0..0.24, stable for 4-neighbour explicit Euler). */
  rate?: number;
  /** Decay fraction per step (0..0.5). */
  decay?: number;
  /** Tile codes holding a constant scalar value. */
  sources?: Array<{ tile: string; value: number }>;
  /** Tile codes that block diffusion. */
  walls?: string[];
  /** Optional id of a `wind` or `flow` automaton that advects this scalar. */
  advect?: string;
  /** Advection strength multiplier (0..2). */
  advectScale?: number;
}

export interface TableRule {
  from: number;
  min: number;
  max: number;
  to: number;
  /** Transition probability in [0, 1], drawn from `hash32(seed, wx, wy, step)`. */
  p: number;
}

export interface TableSpec extends AutomatonBase {
  family: 'table';
  /** Number of discrete states (2..16). */
  states: number;
  /** Neighbour state counted in the 8-cell Moore neighbourhood (0..states-1). */
  counted: number;
  /** Transition rules compiled into a flat `states × 9` lookup table. */
  rules: TableRule[];
  /** Optional tile-code → initial state mapping for newly entering cells. */
  initial?: Array<{ tile: string; state: number }>;
  /** Tile codes frozen at state 0 (never transition). */
  walls?: string[];
}

export interface RulesSpec extends AutomatonBase {
  family: 'rules';
  /** MarkovJunior XML program (`symmetry="(xy)"`, `convolution|prl|all|one`, `WORLD_NODE_LIMITS`, no imports). */
  program: string;
  /** Max Stepper steps executed per automaton step (1..4, default 1). */
  steps?: number;
  /** Optional tile-code → initial symbol index mapping for newly entering cells. */
  initial?: Array<{ tile: string; state: number }>;
}

export type AutomatonSpec = FlowSpec | WindSpec | DiffuseSpec | TableSpec | RulesSpec;

/** What `world.field(id, x, y)` returns: a fresh copy of a vector for `flow`/`wind`, or a number for scalar/discrete fields. */
export interface FlowSample {
  depth: number;
  surface: number;
  vx: number;
  vy: number;
}
export interface WindSample {
  vx: number;
  vy: number;
}
export type FieldSample = number | FlowSample | WindSample;

/** What the automata engine reads of the world (pure boundary, as `WaterWorld` in `water.ts`). */
export interface AutomataWorld {
  seed: number;
  chunkSize: number;
  loadedChunks(): Array<[number, number]>;
  tileAt(col: number, row: number): string;
  groundAt(col: number, row: number): number;
  seaLevel(): number;
  /** The world's time in days (its time over the seconds of its day, T484): what turns the prevailing wind. 0 when absent. */
  days?(): number;
}

/** Active rectangular window of one automaton in cell coordinates. */
export interface AutomatonWindow {
  /** Origin in world cell coordinates (`cellX = Math.floor(worldX / cell)`). */
  ox: number;
  oy: number;
  /** Width and height in cells. */
  W: number;
  H: number;
  cell: CellSize;
}

// --- Load calculation & helpers ------------------------------------------------------------------------------------------------------

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isFamily = (v: unknown): v is AutomatonFamily => typeof v === 'string' && (AUTOMATON_FAMILIES as readonly string[]).includes(v);
const isTileCode = (v: unknown): v is string => typeof v === 'string' && v.length === 1 && !'?*/[]~'.includes(v);
const round4 = (v: number) => Math.round(v * 10_000) / 10_000;
const UNIT = 1 / 4294967296;

/** The 16 points of the compass as unit vectors (cos, sin of k × 22.5°), literal: the same in every engine. */
const COMPASS: ReadonlyArray<readonly [number, number]> = [
  [1, 0], [0.9238795325112867, 0.3826834323650898], [0.7071067811865476, 0.7071067811865476], [0.3826834323650898, 0.9238795325112867],
  [0, 1], [-0.3826834323650898, 0.9238795325112867], [-0.7071067811865476, 0.7071067811865476], [-0.9238795325112867, 0.3826834323650898],
  [-1, 0], [-0.9238795325112867, -0.3826834323650898], [-0.7071067811865476, -0.7071067811865476], [-0.3826834323650898, -0.9238795325112867],
  [0, -1], [0.3826834323650898, -0.9238795325112867], [0.7071067811865476, -0.7071067811865476], [0.9238795325112867, -0.3826834323650898],
];

/** The keyframe `k` of the prevailing wind of a seed: how far it veers (radians) and how much of its strength it keeps. */
function prevailingKey(seed: number, k: number): [number, number] {
  const a = hash32(seed, k, 48411) * UNIT;
  const b = hash32(seed, k, 48412) * UNIT;
  return [(a * 2 - 1) * PREVAILING.veer, 1 - PREVAILING.calm * b];
}

/**
 * The prevailing wind of a `wind` automaton at a time of the world (`days`: its time over the seconds of its day), in lattice units (T484):
 * the mean (`prevailing`, or `PREVAILING.strength` toward a point of the compass from the seed) turned and eased by the keyframes of
 * `PREVAILING`. Only arithmetic: the turn is a polynomial (|θ| ≤ 0.6: within 1e-4 of the sine), the length a square root, both the same in
 * every engine. A mean of nothing stays still.
 */
export function prevailingAt(seed: number, days: number, spec: Pick<WindSpec, 'prevailing'> = {}): [number, number] {
  const base = spec.prevailing ?? ((c) => [c[0] * PREVAILING.strength, c[1] * PREVAILING.strength] as [number, number])(COMPASS[hash32(seed, 48410) % 16]!);
  const m = Math.sqrt(base[0] * base[0] + base[1] * base[1]);
  if (!(m > 1e-6)) return [0, 0];
  const t = (finite(days) && days > 0 ? days : 0) * PREVAILING.perDay;
  const k = Math.floor(t);
  const u = t - k;
  const e = u * u * (3 - 2 * u);
  const [a0, s0] = prevailingKey(seed, k);
  const [a1, s1] = prevailingKey(seed, k + 1);
  const th = a0 + (a1 - a0) * e;
  const strength = s0 + (s1 - s0) * e;
  const t2 = th * th;
  const cos = 1 - (t2 / 2) * (1 - (t2 / 12) * (1 - t2 / 30));
  const sin = th * (1 - (t2 / 6) * (1 - (t2 / 20) * (1 - t2 / 42)));
  const dx = base[0] / m, dy = base[1] / m;
  let rx = dx * cos - dy * sin, ry = dx * sin + dy * cos;
  const r = Math.sqrt(rx * rx + ry * ry);
  rx /= r;
  ry /= r;
  const len = Math.min(WIND_LIMITS.inflow, m) * strength;
  return [rx * len, ry * len];
}

export const cellOf = (spec: Pick<AutomatonSpec, 'family' | 'cell'>): CellSize => spec.cell ?? DEFAULT_CELL[spec.family];
export const hzOf = (spec: Pick<AutomatonSpec, 'family' | 'hz'>): number => spec.hz ?? HZ_LIMITS[spec.family].def;

/** Cells of one automaton over the reference 108 × 90 loaded window at its cell size. */
export function refCellsOf(spec: Pick<AutomatonSpec, 'family' | 'cell'>): number {
  const c = cellOf(spec);
  return Math.round(REF_WINDOW.tiles / (c * c));
}

/** Deterministic static load of one automaton in ms per 60 Hz tick (never wall-clock measured at runtime). */
export function automatonLoadMs(spec: AutomatonSpec): number {
  const stepsMult = spec.family === 'rules' ? (spec.steps ?? 1) : 1;
  return (refCellsOf(spec) * hzOf(spec) * stepsMult * NS_PER_CELL[spec.family]) / (1_000_000 * TICK_HZ);
}

/** Total static load of a world's automata in ms per 60 Hz tick. */
export function totalLoadMs(specs: readonly AutomatonSpec[]): number {
  let sum = 0;
  for (const s of specs) sum += automatonLoadMs(s);
  return sum;
}

/** Deep copy of one automaton spec (for `world.nature()`, commits, etc.). */
export function cloneAutomaton(s: AutomatonSpec): AutomatonSpec {
  switch (s.family) {
    case 'flow':
      return { ...s, ...(s.sources ? { sources: [...s.sources] } : {}), ...(s.walls ? { walls: [...s.walls] } : {}) };
    case 'wind':
      return { ...s, ...(s.prevailing ? { prevailing: [s.prevailing[0], s.prevailing[1]] } : {}), ...(s.obstacles ? { obstacles: [...s.obstacles] } : {}) };
    case 'diffuse':
      return { ...s, ...(s.sources ? { sources: s.sources.map((x) => ({ ...x })) } : {}), ...(s.walls ? { walls: [...s.walls] } : {}) };
    case 'table':
      return { ...s, rules: s.rules.map((r) => ({ ...r })), ...(s.initial ? { initial: s.initial.map((x) => ({ ...x })) } : {}), ...(s.walls ? { walls: [...s.walls] } : {}) };
    case 'rules':
      return { ...s, ...(s.initial ? { initial: s.initial.map((x) => ({ ...x })) } : {}) };
  }
}

export const cloneAutomata = (specs: readonly AutomatonSpec[]): AutomatonSpec[] => specs.map(cloneAutomaton);

/** Human-readable Italian summary of an automaton for feed and commit messages. */
export function automatonWords(spec: AutomatonSpec): string {
  const c = cellOf(spec);
  const res = c === 0.5 ? '2 celle/casella' : c === 1 ? '1 cella/casella' : `1 cella ogni ${c} caselle`;
  return `${spec.id} (${spec.family}, ${res}, ${hzOf(spec)} Hz)`;
}

// --- Validation of `rules` MarkovJunior programs -------------------------------------------------------------------------------------

/** Planar symmetries allowed in 2D `rules` automata: keeps the plane without 3D rotations (T459 § 5.5). */
const PLANAR_SYMS: ReadonlySet<Sym> = new Set<Sym>(['xy', 'x', 'y', 'none']);
const PLANAR_ATTRS: ReadonlySet<string> = new Set(['(xy)', '(x)', '(y)', '()']);
const RULES_NODES: ReadonlySet<string> = new Set(['sequence', 'markov', 'conv', 'prl', 'all', 'one']);

/** Fallback colours for all ASCII symbols so discrete `rules` programs compile without needing `<color>` tags. */
const AUTO_COLOURS: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries([...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'].map((ch) => [ch, '#808080'])),
);

interface CompiledRules {
  model: MjxModel;
  states: number;
}

const compiledRulesCache = new Map<string, CompiledRules | { errors: string[] }>();

function checkRulesTree(node: Node3, errors: Set<string>): void {
  if (!RULES_NODES.has(node.type)) {
    errors.add(`<${node.type === 'conv' ? 'convolution' : node.type === 'shape' ? node.shape : node.type}> non è ammesso negli automi: solo sequence, markov, convolution, prl, all, one`);
    return;
  }
  if (node.type === 'sequence' || node.type === 'markov') {
    for (const c of node.children) checkRulesTree(c, errors);
    return;
  }
  if (node.type === 'conv') {
    if (node.steps !== undefined && (!Number.isInteger(node.steps) || node.steps < 1 || node.steps > 4)) {
      errors.add('convolution in un automa vuole steps da 1 a 4');
    }
    return;
  }
  if (node.type !== 'all' && node.type !== 'one' && node.type !== 'prl') return;
  if (!PLANAR_SYMS.has(node.symmetry ?? 'all') || node.rules.some((r) => r.symmetry !== undefined && !PLANAR_SYMS.has(r.symmetry))) {
    errors.add('la simmetria di un automa rules deve restare nel piano: symmetry="(xy)" sulla radice');
  }
  if (node.fields?.length || node.observe?.length || node.search) {
    errors.add('niente field, observe né search negli automi rules');
  }
  if (node.rules.some((r) => /\s/.test(r.in.trim()) || /\s/.test(r.out.trim()))) {
    errors.add('un automa rules è in 2D: nessun pattern su più strati');
  }
}

/** Compiles and validates a MarkovJunior XML program for the `rules` family, cached by text. */
function compileRulesProgram(xml: string, W = 4, H = 4): CompiledRules | { errors: string[] } {
  const key = `${W}x${H}|${xml}`;
  const hit = compiledRulesCache.get(key);
  if (hit) return hit;
  const result = compileRulesFresh(xml, W, H);
  if (compiledRulesCache.size >= 64) compiledRulesCache.clear();
  compiledRulesCache.set(key, result);
  return result;
}

function compileRulesFresh(xml: string, W: number, H: number): CompiledRules | { errors: string[] } {
  if (typeof xml !== 'string' || !xml.trim()) return { errors: ['program è il testo XML di un programma MarkovJunior'] };
  if (xml.length > RULES_LIMITS.chars) return { errors: [`program: al più ${RULES_LIMITS.chars} caratteri`] };
  if (/<import\b/i.test(xml)) return { errors: ['un automa rules non può usare <import>'] };
  let rootSymAttr: string | undefined;
  try {
    const roots = parseXml(xml);
    const main = roots.find((r) => !['color', 'union', 'animation', 'action', 'worn', 'sound'].includes(r.name));
    rootSymAttr = main?.attrs.symmetry?.replace(/\s+/g, '');
  } catch (e) {
    return { errors: [`XML: ${e instanceof XmlError ? e.message : (e as Error).message}`] };
  }
  const errors = new Set<string>();
  if (!rootSymAttr || !PLANAR_ATTRS.has(rootSymAttr)) {
    errors.add('la radice di un automa rules vuole symmetry="(xy)" (o un’altra simmetria piana)');
  }
  let model: MjxModel;
  try {
    model = compileMjx(xml, { size: [W, H, 1], files: {}, colors: AUTO_COLOURS });
  } catch (e) {
    errors.add((e as Error).message);
    return { errors: [...errors] };
  }
  checkRulesTree(model.program.program, errors);
  const unions = model.program.unions ?? {};
  const concrete = Object.keys(model.program.palette).filter((k) => k !== '.' && !Object.hasOwn(unions, k));
  const states = 1 + concrete.length;
  if (states < RULES_LIMITS.states[0] || states > RULES_LIMITS.states[1]) {
    errors.add(`un automa rules ha da ${RULES_LIMITS.states[0]} a ${RULES_LIMITS.states[1]} stati (trovati ${states})`);
  }
  if (errors.size) return { errors: [...errors] };
  // Dry-run one step on a tiny grid so any runtime compile error is caught up front.
  try {
    const g: Grid3 = { X: W, Y: H, Z: 1, cells: new Uint8Array(W * H), alphabet: ['.'], log: [], epoch: 0 };
    const st = new Stepper(g, model.program, 1, { side: Math.max(W, H, 64), cells: Math.max(W * H, MAX_CELLS_PER_AUTOMATON) });
    st.tick(1);
  } catch (e) {
    return { errors: [`esecuzione di prova: ${(e as Error).message}`] };
  }
  return { model, states };
}

/** Why a MarkovJunior program is invalid for a `rules` automaton, or empty if valid. */
export function rulesProgramErrors(xml: unknown): string[] {
  if (typeof xml !== 'string') return ['program deve essere una stringa XML'];
  const r = compileRulesProgram(xml);
  return 'errors' in r ? r.errors : [];
}

// --- Validation and repair of specs --------------------------------------------------------------------------------------------------

function checkTileList(raw: unknown, max: number, label: string, palette: Record<string, TerrainDef> | undefined, reasons: string[]): string[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) {
    reasons.push(`${label} deve essere una lista di codici terreno`);
    return undefined;
  }
  if (raw.length > max) reasons.push(`${label}: al più ${max} terreni`);
  const out: string[] = [];
  for (const code of raw.slice(0, max)) {
    if (!isTileCode(code)) reasons.push(`${label}: codice terreno non valido «${String(code)}»`);
    else if (palette && !Object.hasOwn(palette, code)) reasons.push(`${label}: terreno «${code}» inesistente nella tavolozza`);
    else if (!out.includes(code)) out.push(code);
  }
  return out.length ? out : undefined;
}

function checkInitialList(
  raw: unknown,
  states: number,
  max: number,
  palette: Record<string, TerrainDef> | undefined,
  reasons: string[],
): Array<{ tile: string; state: number }> | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) {
    reasons.push('initial deve essere una lista di { tile, state }');
    return undefined;
  }
  if (raw.length > max) reasons.push(`initial: al più ${max} voci`);
  const seen = new Set<string>();
  const out: Array<{ tile: string; state: number }> = [];
  for (const item of raw.slice(0, max)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      reasons.push('initial: ogni voce è { tile, state }');
      continue;
    }
    const r = item as Record<string, unknown>;
    if (!isTileCode(r.tile)) reasons.push(`initial: codice terreno non valido «${String(r.tile)}»`);
    else if (palette && !Object.hasOwn(palette, r.tile)) reasons.push(`initial: terreno «${r.tile}» inesistente`);
    else if (!Number.isInteger(r.state) || (r.state as number) < 0 || (r.state as number) >= states) {
      reasons.push(`initial (${r.tile}): stato deve essere un intero tra 0 e ${states - 1}`);
    } else if (!seen.has(r.tile)) {
      seen.add(r.tile);
      out.push({ tile: r.tile, state: r.state as number });
    }
  }
  return out.length ? out : undefined;
}

export interface ValidateOptions {
  /** Existing world automata (when validating one spec to add/replace, checks count, advect target and load budget). */
  existing?: readonly AutomatonSpec[];
  /** World palette (when provided, checks referenced tile codes exist). */
  palette?: Record<string, TerrainDef>;
}

/**
 * Validates one automaton specification without clamping: every out-of-range parameter, bad family, disallowed node,
 * or load-budget overflow is refused with clear Italian reasons (for the Physicist and tests).
 */
export function validateAutomaton(raw: unknown, opts: ValidateOptions = {}): { ok: true; spec: AutomatonSpec } | { ok: false; reasons: string[] } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, reasons: ['l’automa deve essere un oggetto'] };
  const r = raw as Record<string, unknown>;
  const reasons: string[] = [];
  const id = typeof r.id === 'string' ? r.id.trim() : '';
  if (!AUTOMATON_ID_RE.test(id)) reasons.push('id deve essere una parola minuscola di lettere, cifre, _ o - (al più 32 caratteri)');
  if (!isFamily(r.family)) {
    reasons.push(`family deve essere una tra ${AUTOMATON_FAMILIES.join(', ')}`);
    return { ok: false, reasons };
  }
  const family = r.family;
  const allowedCells = CELL_SIZES[family];
  let cell: CellSize | undefined;
  if (r.cell !== undefined) {
    if (!finite(r.cell) || !(allowedCells as readonly number[]).includes(r.cell)) {
      reasons.push(`per ${family} cell deve essere uno tra ${allowedCells.join(', ')}`);
    } else cell = r.cell as CellSize;
  }
  const hzLim = HZ_LIMITS[family];
  let hz: number | undefined;
  if (r.hz !== undefined) {
    if (!Number.isInteger(r.hz) || (r.hz as number) < hzLim.min || (r.hz as number) > hzLim.max) {
      reasons.push(`per ${family} hz deve essere un intero tra ${hzLim.min} e ${hzLim.max}`);
    } else hz = r.hz as number;
  }

  let spec: AutomatonSpec;
  const base: AutomatonBase = { id, family, ...(cell !== undefined ? { cell } : {}), ...(hz !== undefined ? { hz } : {}) };

  if (family === 'flow') {
    const out: FlowSpec = { ...base, family: 'flow' };
    if (r.gravity !== undefined) {
      if (!finite(r.gravity) || r.gravity < FLOW_LIMITS.gravity[0] || r.gravity > FLOW_LIMITS.gravity[1]) {
        reasons.push(`flow.gravity deve stare tra ${FLOW_LIMITS.gravity[0]} e ${FLOW_LIMITS.gravity[1]}`);
      } else out.gravity = round4(r.gravity);
    }
    if (r.damp !== undefined) {
      if (!finite(r.damp) || r.damp < FLOW_LIMITS.damp[0] || r.damp > FLOW_LIMITS.damp[1]) {
        reasons.push(`flow.damp deve stare tra ${FLOW_LIMITS.damp[0]} e ${FLOW_LIMITS.damp[1]}`);
      } else out.damp = round4(r.damp);
    }
    if (r.level !== undefined) {
      if (!finite(r.level) || r.level < FLOW_LIMITS.level[0] || r.level > FLOW_LIMITS.level[1]) {
        reasons.push(`flow.level deve stare tra ${FLOW_LIMITS.level[0]} e ${FLOW_LIMITS.level[1]}`);
      } else out.level = round4(r.level);
    }
    const sources = checkTileList(r.sources, FLOW_LIMITS.maxSources, 'flow.sources', opts.palette, reasons);
    if (sources) out.sources = sources;
    const walls = checkTileList(r.walls, FLOW_LIMITS.maxWalls, 'flow.walls', opts.palette, reasons);
    if (walls) out.walls = walls;
    spec = out;
  } else if (family === 'wind') {
    const out: WindSpec = { ...base, family: 'wind' };
    if (r.tau !== undefined) {
      if (!finite(r.tau) || r.tau < WIND_LIMITS.tau[0] || r.tau > WIND_LIMITS.tau[1]) {
        reasons.push(`wind.tau deve stare tra ${WIND_LIMITS.tau[0]} e ${WIND_LIMITS.tau[1]}`);
      } else out.tau = round4(r.tau);
    }
    if (r.prevailing !== undefined) {
      if (!Array.isArray(r.prevailing) || r.prevailing.length !== 2 || !finite(r.prevailing[0]) || !finite(r.prevailing[1])) {
        reasons.push('wind.prevailing deve essere [ux, uy]');
      } else {
        const [ux, uy] = r.prevailing as [number, number];
        if (Math.hypot(ux, uy) > WIND_LIMITS.inflow + 1e-9) {
          reasons.push(`wind.prevailing ha modulo al più ${WIND_LIMITS.inflow}`);
        } else out.prevailing = [round4(ux), round4(uy)];
      }
    }
    if (r.layerHeight !== undefined) {
      if (!finite(r.layerHeight) || r.layerHeight < WIND_LIMITS.layerHeight[0] || r.layerHeight > WIND_LIMITS.layerHeight[1]) {
        reasons.push(`wind.layerHeight deve stare tra ${WIND_LIMITS.layerHeight[0]} e ${WIND_LIMITS.layerHeight[1]}`);
      } else out.layerHeight = round4(r.layerHeight);
    }
    const obstacles = checkTileList(r.obstacles, WIND_LIMITS.maxObstacles, 'wind.obstacles', opts.palette, reasons);
    if (obstacles) out.obstacles = obstacles;
    spec = out;
  } else if (family === 'diffuse') {
    const out: DiffuseSpec = { ...base, family: 'diffuse' };
    if (r.rate !== undefined) {
      if (!finite(r.rate) || r.rate < DIFFUSE_LIMITS.rate[0] || r.rate > DIFFUSE_LIMITS.rate[1]) {
        reasons.push(`diffuse.rate deve stare tra ${DIFFUSE_LIMITS.rate[0]} e ${DIFFUSE_LIMITS.rate[1]}`);
      } else out.rate = round4(r.rate);
    }
    if (r.decay !== undefined) {
      if (!finite(r.decay) || r.decay < DIFFUSE_LIMITS.decay[0] || r.decay > DIFFUSE_LIMITS.decay[1]) {
        reasons.push(`diffuse.decay deve stare tra ${DIFFUSE_LIMITS.decay[0]} e ${DIFFUSE_LIMITS.decay[1]}`);
      } else out.decay = round4(r.decay);
    }
    if (r.sources !== undefined) {
      if (!Array.isArray(r.sources)) reasons.push('diffuse.sources deve essere una lista di { tile, value }');
      else {
        if (r.sources.length > DIFFUSE_LIMITS.maxSources) reasons.push(`diffuse.sources: al più ${DIFFUSE_LIMITS.maxSources} sorgenti`);
        const seen = new Set<string>();
        const list: Array<{ tile: string; value: number }> = [];
        for (const s of r.sources.slice(0, DIFFUSE_LIMITS.maxSources)) {
          if (!s || typeof s !== 'object' || Array.isArray(s)) {
            reasons.push('diffuse.sources: ogni voce è { tile, value }');
            continue;
          }
          const e = s as Record<string, unknown>;
          if (!isTileCode(e.tile)) reasons.push(`diffuse.sources: codice terreno non valido «${String(e.tile)}»`);
          else if (opts.palette && !Object.hasOwn(opts.palette, e.tile)) reasons.push(`diffuse.sources: terreno «${e.tile}» inesistente`);
          else if (!finite(e.value) || e.value < DIFFUSE_LIMITS.sourceValue[0] || e.value > DIFFUSE_LIMITS.sourceValue[1]) {
            reasons.push(`diffuse.sources (${e.tile}): value deve stare tra ${DIFFUSE_LIMITS.sourceValue[0]} e ${DIFFUSE_LIMITS.sourceValue[1]}`);
          } else if (!seen.has(e.tile)) {
            seen.add(e.tile);
            list.push({ tile: e.tile, value: round4(e.value) });
          }
        }
        if (list.length) out.sources = list;
      }
    }
    const walls = checkTileList(r.walls, DIFFUSE_LIMITS.maxWalls, 'diffuse.walls', opts.palette, reasons);
    if (walls) out.walls = walls;
    if (r.advect !== undefined) {
      if (typeof r.advect !== 'string' || !AUTOMATON_ID_RE.test(r.advect)) {
        reasons.push('diffuse.advect deve nominare l’id di un automa wind o flow');
      } else if (r.advect === id) {
        reasons.push('diffuse.advect non può nominare sé stesso');
      } else out.advect = r.advect;
    }
    if (r.advectScale !== undefined) {
      if (!finite(r.advectScale) || r.advectScale < DIFFUSE_LIMITS.advectScale[0] || r.advectScale > DIFFUSE_LIMITS.advectScale[1]) {
        reasons.push(`diffuse.advectScale deve stare tra ${DIFFUSE_LIMITS.advectScale[0]} e ${DIFFUSE_LIMITS.advectScale[1]}`);
      } else out.advectScale = round4(r.advectScale);
    }
    spec = out;
  } else if (family === 'table') {
    const states = Number.isInteger(r.states) ? (r.states as number) : -1;
    if (states < TABLE_LIMITS.states[0] || states > TABLE_LIMITS.states[1]) {
      reasons.push(`table.states deve essere un intero tra ${TABLE_LIMITS.states[0]} e ${TABLE_LIMITS.states[1]}`);
    }
    const counted = Number.isInteger(r.counted) ? (r.counted as number) : -1;
    if (states >= TABLE_LIMITS.states[0] && (counted < 0 || counted >= states)) {
      reasons.push(`table.counted deve essere un intero tra 0 e ${states - 1}`);
    }
    const rules: TableRule[] = [];
    if (!Array.isArray(r.rules) || !r.rules.length) {
      reasons.push('table.rules deve avere almeno una regola');
    } else {
      if (r.rules.length > TABLE_LIMITS.maxRules) reasons.push(`table.rules: al più ${TABLE_LIMITS.maxRules} regole`);
      for (const item of r.rules.slice(0, TABLE_LIMITS.maxRules)) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          reasons.push('table.rules: ogni regola è { from, min, max, to, p }');
          continue;
        }
        const rr = item as Record<string, unknown>;
        const from = rr.from, min = rr.min, max = rr.max, to = rr.to, p = rr.p ?? 1;
        if (!Number.isInteger(from) || (from as number) < 0 || (states > 0 && (from as number) >= states)) {
          reasons.push(`table.rules: from (${String(from)}) fuori dagli stati`);
        } else if (!Number.isInteger(to) || (to as number) < 0 || (states > 0 && (to as number) >= states)) {
          reasons.push(`table.rules: to (${String(to)}) fuori dagli stati`);
        } else if (!Number.isInteger(min) || !Number.isInteger(max) || (min as number) < 0 || (max as number) > 8 || (min as number) > (max as number)) {
          reasons.push(`table.rules: min..max (${String(min)}..${String(max)}) deve stare in 0..8`);
        } else if (!finite(p) || p < 0 || p > 1) {
          reasons.push(`table.rules: p (${String(p)}) deve stare tra 0 e 1`);
        } else {
          rules.push({ from: from as number, min: min as number, max: max as number, to: to as number, p: round4(p) });
        }
      }
    }
    const initial = states >= TABLE_LIMITS.states[0] ? checkInitialList(r.initial, states, TABLE_LIMITS.maxInitial, opts.palette, reasons) : undefined;
    const walls = checkTileList(r.walls, TABLE_LIMITS.maxWalls, 'table.walls', opts.palette, reasons);
    spec = { ...base, family: 'table', states, counted, rules, ...(initial ? { initial } : {}), ...(walls ? { walls } : {}) };
  } else {
    const program = typeof r.program === 'string' ? r.program.trim() : '';
    const compiled = compileRulesProgram(program);
    let states = 0;
    if ('errors' in compiled) reasons.push(...compiled.errors);
    else states = compiled.states;
    let steps: number | undefined;
    if (r.steps !== undefined) {
      if (!Number.isInteger(r.steps) || (r.steps as number) < RULES_LIMITS.steps[0] || (r.steps as number) > RULES_LIMITS.steps[1]) {
        reasons.push(`rules.steps deve essere un intero tra ${RULES_LIMITS.steps[0]} e ${RULES_LIMITS.steps[1]}`);
      } else steps = r.steps as number;
    }
    const initial = states >= RULES_LIMITS.states[0] ? checkInitialList(r.initial, states, RULES_LIMITS.maxInitial, opts.palette, reasons) : undefined;
    spec = { ...base, family: 'rules', program, ...(steps !== undefined ? { steps } : {}), ...(initial ? { initial } : {}) };
  }

  if (reasons.length) return { ok: false, reasons };

  if (opts.existing) {
    const next = [...opts.existing.filter((x) => x.id !== spec.id), spec];
    if (next.length > MAX_AUTOMATA) reasons.push(`al più ${MAX_AUTOMATA} automi in un mondo`);
    if (spec.family === 'diffuse' && spec.advect) {
      const target = next.find((x) => x.id === spec.advect);
      if (!target || (target.family !== 'wind' && target.family !== 'flow')) {
        reasons.push(`diffuse.advect «${spec.advect}» non è un automa wind o flow del mondo`);
      }
    }
    const load = totalLoadMs(next);
    if (load > LOAD_BUDGET_MS + 1e-9) {
      reasons.push(`carico totale ${load.toFixed(2)} ms/tick supera il bilancio di ${LOAD_BUDGET_MS.toFixed(2)} ms/tick (abbassa hz, usa una cella più larga o togli un automa)`);
    }
    if (reasons.length) return { ok: false, reasons };
  }
  return { ok: true, spec };
}

/** Validates a full list of automata for a world (count, unique ids, advect targets, fixed load budget). */
export function validateAutomata(raw: unknown, opts: { palette?: Record<string, TerrainDef> } = {}): { ok: true; specs: AutomatonSpec[]; loadMs: number } | { ok: false; reasons: string[] } {
  if (!Array.isArray(raw)) return { ok: false, reasons: ['automata deve essere una lista'] };
  const reasons: string[] = [];
  if (raw.length > MAX_AUTOMATA) reasons.push(`al più ${MAX_AUTOMATA} automi in un mondo (dati ${raw.length})`);
  const specs: AutomatonSpec[] = [];
  const seen = new Set<string>();
  for (const item of raw.slice(0, MAX_AUTOMATA)) {
    const r = validateAutomaton(item, { palette: opts.palette });
    if (!r.ok) {
      reasons.push(...r.reasons);
      continue;
    }
    if (seen.has(r.spec.id)) {
      reasons.push(`automa «${r.spec.id}» dichiarato due volte`);
      continue;
    }
    seen.add(r.spec.id);
    specs.push(r.spec);
  }
  for (const s of specs) {
    if (s.family === 'diffuse' && s.advect) {
      const target = specs.find((x) => x.id === s.advect);
      if (!target || (target.family !== 'wind' && target.family !== 'flow')) {
        reasons.push(`«${s.id}»: diffuse.advect «${s.advect}» non è un automa wind o flow del mondo`);
      }
    }
  }
  const loadMs = totalLoadMs(specs);
  if (loadMs > LOAD_BUDGET_MS + 1e-9) {
    reasons.push(`carico totale ${loadMs.toFixed(2)} ms/tick supera il bilancio di ${LOAD_BUDGET_MS.toFixed(2)} ms/tick`);
  }
  return reasons.length ? { ok: false, reasons } : { ok: true, specs, loadMs };
}

/**
 * Repairs `universe.json → nature.automata` safely on load (rule 7: floor never crashes on bad JSON).
 * Keeps valid specs in order up to `MAX_AUTOMATA` and within `LOAD_BUDGET_MS`; drops invalid, duplicate, or excess entries,
 * and drops broken `advect` references.
 */
export function repairAutomata(raw: unknown): AutomatonSpec[] {
  if (!Array.isArray(raw)) return [];
  const kept: AutomatonSpec[] = [];
  const seen = new Set<string>();
  let load = 0;
  for (const item of raw) {
    if (kept.length >= MAX_AUTOMATA) break;
    const r = validateAutomaton(item);
    if (!r.ok || seen.has(r.spec.id)) continue;
    const cost = automatonLoadMs(r.spec);
    if (load + cost > LOAD_BUDGET_MS + 1e-9) continue;
    seen.add(r.spec.id);
    kept.push(r.spec);
    load += cost;
  }
  // Drop any `advect` reference that does not resolve to a kept `wind` or `flow` automaton.
  const vecIds = new Set(kept.filter((s) => s.family === 'wind' || s.family === 'flow').map((s) => s.id));
  for (const s of kept) {
    if (s.family === 'diffuse' && s.advect && !vecIds.has(s.advect)) delete s.advect;
  }
  return kept;
}

// --- Family 1: Virtual pipes (`flow`) ------------------------------------------------------------------------------------------------

/**
 * Virtual-pipe shallow-water automaton (O'Brien & Hodgins 1995; Mei, Decaudin & Hu 2007).
 * Float32 storage, IEEE arithmetic only, no Math.sin, no clock: deterministic across JS engines.
 */
export class FlowField {
  readonly n: number;
  readonly bed: Float32Array;
  readonly depth: Float32Array;
  readonly fx0: Float32Array;
  readonly fx1: Float32Array;
  readonly fy0: Float32Array;
  readonly fy1: Float32Array;
  readonly source: Uint8Array;
  readonly wall: Uint8Array;
  /** True when at least one cell in `wall` is 1; avoids per-neighbour wall loads in the common wall-less case. */
  hasWalls = false;
  level: number;
  readonly gravity: number;
  readonly damp: number;

  constructor(
    readonly ox: number,
    readonly oy: number,
    readonly W: number,
    readonly H: number,
    readonly cell: CellSize,
    opts: { gravity?: number; damp?: number; level?: number } = {},
  ) {
    this.n = W * H;
    this.bed = new Float32Array(this.n);
    this.depth = new Float32Array(this.n);
    this.fx0 = new Float32Array(this.n);
    this.fx1 = new Float32Array(this.n);
    this.fy0 = new Float32Array(this.n);
    this.fy1 = new Float32Array(this.n);
    this.source = new Uint8Array(this.n);
    this.wall = new Uint8Array(this.n);
    this.gravity = opts.gravity ?? 9.8;
    this.damp = opts.damp ?? 0.995;
    this.level = opts.level ?? 0;
  }

  /** Largest stable time step for a wave over `maxDepth` tiles: crosses at most half a cell. */
  stableDt(maxDepth: number): number {
    return (0.5 * this.cell) / Math.sqrt(this.gravity * Math.max(0.01, maxDepth));
  }

  step(dt: number): void {
    const { W, H, bed, depth, fx0, fx1, fy0, fy1, source, wall, damp } = this;
    const k = dt * this.gravity * this.cell;
    const area = this.cell * this.cell;
    const invArea = 1 / area;
    const maxD = FLOW_LIMITS.maxDepth;
    if (!this.hasWalls) {
      for (let y = 0; y < H; y++) {
        const row = y * W;
        for (let x = 0; x < W; x++) {
          const i = row + x;
          const h = bed[i]! + depth[i]!;
          let a = x + 1 < W ? fx0[i]! * damp + k * (h - bed[i + 1]! - depth[i + 1]!) : 0;
          let b = x > 0 ? fx1[i]! * damp + k * (h - bed[i - 1]! - depth[i - 1]!) : 0;
          let c = y + 1 < H ? fy0[i]! * damp + k * (h - bed[i + W]! - depth[i + W]!) : 0;
          let d = y > 0 ? fy1[i]! * damp + k * (h - bed[i - W]! - depth[i - W]!) : 0;
          if (a < 0) a = 0;
          if (b < 0) b = 0;
          if (c < 0) c = 0;
          if (d < 0) d = 0;
          const out = (a + b + c + d) * dt;
          const have = depth[i]! * area;
          if (out > have && out > 0) {
            const s = have / out;
            a *= s;
            b *= s;
            c *= s;
            d *= s;
          }
          fx0[i] = a;
          fx1[i] = b;
          fy0[i] = c;
          fy1[i] = d;
        }
      }
      for (let y = 0; y < H; y++) {
        const row = y * W;
        for (let x = 0; x < W; x++) {
          const i = row + x;
          if (source[i]) {
            const d = this.level - bed[i]!;
            depth[i] = d > 0 ? (d < maxD ? d : maxD) : 0;
            continue;
          }
          const inflow = (x > 0 ? fx0[i - 1]! : 0) + (x + 1 < W ? fx1[i + 1]! : 0) + (y > 0 ? fy0[i - W]! : 0) + (y + 1 < H ? fy1[i + W]! : 0);
          const outflow = fx0[i]! + fx1[i]! + fy0[i]! + fy1[i]!;
          const next = depth[i]! + dt * (inflow - outflow) * invArea;
          depth[i] = next > 0 ? (next < maxD ? next : maxD) : 0;
        }
      }
      return;
    }
    for (let y = 0; y < H; y++) {
      const row = y * W;
      for (let x = 0; x < W; x++) {
        const i = row + x;
        if (wall[i]) {
          fx0[i] = 0;
          fx1[i] = 0;
          fy0[i] = 0;
          fy1[i] = 0;
          continue;
        }
        const h = bed[i]! + depth[i]!;
        let a = x + 1 < W && !wall[i + 1] ? fx0[i]! * damp + k * (h - bed[i + 1]! - depth[i + 1]!) : 0;
        let b = x > 0 && !wall[i - 1] ? fx1[i]! * damp + k * (h - bed[i - 1]! - depth[i - 1]!) : 0;
        let c = y + 1 < H && !wall[i + W] ? fy0[i]! * damp + k * (h - bed[i + W]! - depth[i + W]!) : 0;
        let d = y > 0 && !wall[i - W] ? fy1[i]! * damp + k * (h - bed[i - W]! - depth[i - W]!) : 0;
        if (a < 0) a = 0;
        if (b < 0) b = 0;
        if (c < 0) c = 0;
        if (d < 0) d = 0;
        const out = (a + b + c + d) * dt;
        const have = depth[i]! * area;
        if (out > have && out > 0) {
          const s = have / out;
          a *= s;
          b *= s;
          c *= s;
          d *= s;
        }
        fx0[i] = a;
        fx1[i] = b;
        fy0[i] = c;
        fy1[i] = d;
      }
    }
    for (let y = 0; y < H; y++) {
      const row = y * W;
      for (let x = 0; x < W; x++) {
        const i = row + x;
        if (wall[i]) {
          depth[i] = 0;
          continue;
        }
        if (source[i]) {
          const d = this.level - bed[i]!;
          depth[i] = d > 0 ? (d < maxD ? d : maxD) : 0;
          continue;
        }
        const inflow = (x > 0 ? fx0[i - 1]! : 0) + (x + 1 < W ? fx1[i + 1]! : 0) + (y > 0 ? fy0[i - W]! : 0) + (y + 1 < H ? fy1[i + W]! : 0);
        const outflow = fx0[i]! + fx1[i]! + fy0[i]! + fy1[i]!;
        const next = depth[i]! + dt * (inflow - outflow) * invArea;
        depth[i] = next > 0 ? (next < maxD ? next : maxD) : 0;
      }
    }
  }

  velocity(x: number, y: number): [number, number] {
    const { W, H, fx0, fx1, fy0, fy1, depth, wall } = this;
    const i = y * W + x;
    if (wall[i]) return [0, 0];
    const d = Math.max(1e-3, depth[i]) * this.cell;
    const u = ((x > 0 ? fx0[i - 1] - fx1[i] : 0) + (x + 1 < W ? fx0[i] - fx1[i + 1] : 0)) * 0.5;
    const v = ((y > 0 ? fy0[i - W] - fy1[i] : 0) + (y + 1 < H ? fy0[i] - fy1[i + W] : 0)) * 0.5;
    return [u / d, v / d];
  }

  sample(x: number, y: number): FlowSample {
    const i = y * this.W + x;
    const [vx, vy] = this.velocity(x, y);
    const depth = this.depth[i]!;
    return { depth, surface: this.bed[i]! + depth, vx, vy };
  }

  add(x: number, y: number, delta: number): boolean {
    const i = y * this.W + x;
    if (this.wall[i] || this.source[i] || delta === 0) return false;
    const next = Math.min(FLOW_LIMITS.maxDepth, Math.max(0, this.depth[i]! + delta));
    if (next === this.depth[i]) return false;
    this.depth[i] = next;
    return true;
  }

  /** Total fluid volume (tiles³), excluding constant-level sources. */
  volume(): number {
    let v = 0;
    for (let i = 0; i < this.n; i++) if (!this.source[i] && !this.wall[i]) v += this.depth[i]!;
    return v * this.cell * this.cell;
  }

  /** Copies overlapping cells from a previous window when the loaded area shifts. */
  copyFrom(prev: FlowField): void {
    const x0 = Math.max(this.ox, prev.ox), x1 = Math.min(this.ox + this.W, prev.ox + prev.W);
    const y0 = Math.max(this.oy, prev.oy), y1 = Math.min(this.oy + this.H, prev.oy + prev.H);
    for (let wy = y0; wy < y1; wy++) {
      const dstRow = (wy - this.oy) * this.W;
      const srcRow = (wy - prev.oy) * prev.W;
      for (let wx = x0; wx < x1; wx++) {
        const di = dstRow + (wx - this.ox);
        const si = srcRow + (wx - prev.ox);
        if (this.wall[di] || prev.wall[si]) continue;
        this.depth[di] = prev.depth[si]!;
        this.fx0[di] = prev.fx0[si]!;
        this.fx1[di] = prev.fx1[si]!;
        this.fy0[di] = prev.fy0[si]!;
        this.fy1[di] = prev.fy1[si]!;
      }
    }
  }
}

// --- Family 2: Lattice Boltzmann D2Q9 (`wind`) ---------------------------------------------------------------------------------------

const EX = [0, 1, 0, -1, 0, 1, -1, -1, 1];
const EY = [0, 0, 1, 0, -1, 1, 1, -1, -1];
const WT = [4 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 36, 1 / 36, 1 / 36, 1 / 36];
const OPP = [0, 3, 4, 1, 2, 7, 8, 5, 6];

/**
 * Lattice Boltzmann D2Q9 BGK wind automaton: 9 populations per cell stream and relax toward equilibrium, bouncing off
 * solid obstacles (massifs, buildings). Float32 storage, IEEE arithmetic only.
 *
 * A step is `2 × H` units of work (T484): first every row collides in place, then every row streams into the other buffer, and the
 * buffers swap. `work(units)` does some of them, `step()` all that are left: the same step, byte for byte, however it is cut, so the
 * engine spreads a step over the ticks between two (`AutomataEngine`), and what reads the field always reads a whole one (the moments
 * a collision keeps are the ones `velocity` reads).
 */
export class WindField {
  readonly n: number;
  f: Float32Array;
  private g: Float32Array;
  readonly solid: Uint8Array;
  readonly tau: number;
  inflow: [number, number];
  /** Units of the step under way already done (0: none under way), out of `2 × H`. */
  done = 0;
  private readonly edgeEq = new Float32Array(9);

  constructor(
    readonly ox: number,
    readonly oy: number,
    readonly W: number,
    readonly H: number,
    readonly cell: CellSize,
    opts: { tau?: number; prevailing?: [number, number] } = {},
  ) {
    this.n = W * H;
    this.f = new Float32Array(9 * this.n);
    this.g = new Float32Array(9 * this.n);
    this.solid = new Uint8Array(this.n);
    this.tau = opts.tau ?? 0.58;
    const p = opts.prevailing ?? [0.06, 0.02];
    this.inflow = [p[0], p[1]];
    for (let i = 0; i < this.n; i++) this.setEquilibrium(this.f, i, 1, this.inflow[0], this.inflow[1]);
  }

  private setEquilibrium(arr: Float32Array, i: number, rho: number, ux: number, uy: number): void {
    const uu = ux * ux + uy * uy;
    const n = this.n;
    for (let q = 0; q < 9; q++) {
      const eu = EX[q]! * ux + EY[q]! * uy;
      arr[q * n + i] = WT[q]! * rho * (1 + 3 * eu + 4.5 * eu * eu - 1.5 * uu);
    }
  }

  /** The units of work of a whole step. */
  get units(): number {
    return 2 * this.H;
  }

  /** One whole step: what is left of the one under way, or a new one. */
  step(): void {
    this.work(this.units - this.done);
  }

  /** Does up to `units` units of the step under way (beginning one if none is); true when the step is whole and the buffers swapped. */
  work(units: number): boolean {
    const { H } = this;
    let left = Math.min(Math.max(0, Math.floor(units)), 2 * H - this.done);
    if (left <= 0) return false;
    if (this.done === 0) {
      // The edge's equilibrium for this step, from the inflow it began with.
      const [ix, iy] = this.inflow;
      const iuu = ix * ix + iy * iy;
      for (let q = 0; q < 9; q++) {
        const eu = EX[q]! * ix + EY[q]! * iy;
        this.edgeEq[q] = WT[q]! * (1 + 3 * eu + 4.5 * eu * eu - 1.5 * iuu);
      }
    }
    while (left-- > 0) {
      const u = this.done++;
      if (u < H) this.collideRow(u);
      else this.streamRow(u - H);
    }
    if (this.done < 2 * H) return false;
    this.done = 0;
    const f = this.f;
    this.f = this.g;
    this.g = f;
    return true;
  }

  private collideRow(y: number): void {
    const { W, n, f, solid } = this;
    const omega = 1 / this.tau;
    const maxV = WIND_LIMITS.maxSpeed;
    const [ix, iy] = this.inflow;
    const end = (y + 1) * W;
    for (let i = y * W; i < end; i++) {
      if (solid[i]) continue;
      let rho = 0, ux = 0, uy = 0;
      for (let q = 0; q < 9; q++) {
        const v = f[q * n + i]!;
        rho += v;
        ux += v * EX[q]!;
        uy += v * EY[q]!;
      }
      if (rho <= 1e-4 || !Number.isFinite(rho)) {
        this.setEquilibrium(f, i, 1, ix, iy);
        continue;
      }
      ux /= rho;
      uy /= rho;
      if (ux > maxV) ux = maxV;
      else if (ux < -maxV) ux = -maxV;
      if (uy > maxV) uy = maxV;
      else if (uy < -maxV) uy = -maxV;
      const uu = ux * ux + uy * uy;
      for (let q = 0; q < 9; q++) {
        const eu = EX[q]! * ux + EY[q]! * uy;
        const eq = WT[q]! * rho * (1 + 3 * eu + 4.5 * eu * eu - 1.5 * uu);
        const k = q * n + i;
        f[k] = f[k]! + omega * (eq - f[k]!);
      }
    }
  }

  /** Streams one row with bounce-back on obstacles; what comes from beyond the window is the edge's equilibrium. */
  private streamRow(y: number): void {
    const { W, H, n, f, g, solid, edgeEq } = this;
    const row = y * W;
    for (let x = 0; x < W; x++) {
      const i = row + x;
      for (let q = 0; q < 9; q++) {
        const sx = x - EX[q]!, sy = y - EY[q]!;
        let v: number;
        if (sx < 0 || sy < 0 || sx >= W || sy >= H) {
          v = edgeEq[q]!;
        } else {
          const s = sy * W + sx;
          v = solid[s] ? f[OPP[q]! * n + i]! : f[q * n + s]!;
        }
        g[q * n + i] = v;
      }
    }
  }

  velocity(x: number, y: number): [number, number] {
    const i = y * this.W + x;
    if (this.solid[i]) return [0, 0];
    const { n, f } = this;
    let rho = 0, ux = 0, uy = 0;
    for (let q = 0; q < 9; q++) {
      const v = f[q * n + i]!;
      rho += v;
      ux += v * EX[q]!;
      uy += v * EY[q]!;
    }
    if (rho <= 1e-6) return [0, 0];
    return [ux / rho, uy / rho];
  }

  sample(x: number, y: number): WindSample {
    const [vx, vy] = this.velocity(x, y);
    return { vx, vy };
  }

  /** Adds a bounded velocity impulse `(ax, ay)` at cell `(x, y)` while keeping lattice density and low Mach number. */
  add(x: number, y: number, ax: number, ay: number): boolean {
    const i = y * this.W + x;
    if (this.solid[i] || (ax === 0 && ay === 0)) return false;
    const { n, f } = this;
    let rho = 0, ux = 0, uy = 0;
    for (let q = 0; q < 9; q++) {
      const v = f[q * n + i]!;
      rho += v;
      ux += v * EX[q]!;
      uy += v * EY[q]!;
    }
    if (rho <= 1e-4) rho = 1;
    else {
      ux /= rho;
      uy /= rho;
    }
    const maxV = WIND_LIMITS.maxSpeed;
    const nx = Math.max(-maxV, Math.min(maxV, ux + ax));
    const ny = Math.max(-maxV, Math.min(maxV, uy + ay));
    this.setEquilibrium(f, i, rho, nx, ny);
    return true;
  }

  copyFrom(prev: WindField): void {
    // A step under way in the field that goes is finished first: what is copied is a whole one.
    if (prev.done) prev.step();
    const x0 = Math.max(this.ox, prev.ox), x1 = Math.min(this.ox + this.W, prev.ox + prev.W);
    const y0 = Math.max(this.oy, prev.oy), y1 = Math.min(this.oy + this.H, prev.oy + prev.H);
    for (let wy = y0; wy < y1; wy++) {
      const dstRow = (wy - this.oy) * this.W;
      const srcRow = (wy - prev.oy) * prev.W;
      for (let wx = x0; wx < x1; wx++) {
        const di = dstRow + (wx - this.ox);
        const si = srcRow + (wx - prev.ox);
        if (this.solid[di] || prev.solid[si]) continue;
        for (let q = 0; q < 9; q++) this.f[q * this.n + di] = prev.f[q * prev.n + si]!;
      }
    }
  }
}

// --- Family 3: Scalar diffusion & advection (`diffuse`) ------------------------------------------------------------------------------

/**
 * Scalar field that diffuses, decays and optionally advects with a `wind` or `flow` field (heat, smoke, scent, damp).
 * Float32 storage, IEEE arithmetic only.
 */
export class DiffuseField {
  readonly n: number;
  value: Float32Array;
  private next: Float32Array;
  readonly wall: Uint8Array;
  readonly source: Float32Array;
  readonly rate: number;
  readonly decay: number;
  readonly advectScale: number;

  constructor(
    readonly ox: number,
    readonly oy: number,
    readonly W: number,
    readonly H: number,
    readonly cell: CellSize,
    opts: { rate?: number; decay?: number; advectScale?: number } = {},
  ) {
    this.n = W * H;
    this.value = new Float32Array(this.n);
    this.next = new Float32Array(this.n);
    this.wall = new Uint8Array(this.n);
    this.source = new Float32Array(this.n).fill(NaN);
    this.rate = opts.rate ?? 0.2;
    this.decay = opts.decay ?? 0.002;
    this.advectScale = opts.advectScale ?? 1;
  }

  step(vel?: (wx: number, wy: number) => [number, number]): void {
    const { W, H, value: v, next, wall, source, rate, decay } = this;
    const maxV = DIFFUSE_LIMITS.maxValue;
    for (let y = 0; y < H; y++) {
      const row = y * W;
      for (let x = 0; x < W; x++) {
        const i = row + x;
        if (wall[i]) {
          next[i] = 0;
          continue;
        }
        const s = source[i]!;
        if (s === s) {
          next[i] = s;
          continue;
        }
        const c = v[i]!;
        let sum = 0;
        if (x > 0 && !wall[i - 1]) sum += v[i - 1]! - c;
        if (x + 1 < W && !wall[i + 1]) sum += v[i + 1]! - c;
        if (y > 0 && !wall[i - W]) sum += v[i - W]! - c;
        if (y + 1 < H && !wall[i + W]) sum += v[i + W]! - c;
        const nv = c + rate * sum - decay * c;
        next[i] = nv > 0 ? (nv < maxV ? nv : maxV) : 0;
      }
    }
    this.value = next;
    this.next = v;
    // Optional stable first-order upwind advection (separate split pass: unconditionally non-negative for |ux| + |uy| ≤ 0.45).
    if (!vel || this.advectScale <= 0) return;
    const src = this.value;
    const dst = this.next;
    const cell = this.cell;
    const scale = this.advectScale;
    for (let y = 0; y < H; y++) {
      const row = y * W;
      const wy = (this.oy + y + 0.5) * cell;
      for (let x = 0; x < W; x++) {
        const i = row + x;
        if (wall[i]) {
          dst[i] = 0;
          continue;
        }
        const s = source[i]!;
        if (s === s) {
          dst[i] = s;
          continue;
        }
        const [rawX, rawY] = vel((this.ox + x + 0.5) * cell, wy);
        let ux = rawX * scale;
        let uy = rawY * scale;
        const mag = Math.abs(ux) + Math.abs(uy);
        if (mag > 0.45) {
          const k = 0.45 / mag;
          ux *= k;
          uy *= k;
        }
        const c = src[i]!;
        let adv = 0;
        if (ux > 0 && x > 0 && !wall[i - 1]) adv += ux * (src[i - 1]! - c);
        else if (ux < 0 && x + 1 < W && !wall[i + 1]) adv += -ux * (src[i + 1]! - c);
        if (uy > 0 && y > 0 && !wall[i - W]) adv += uy * (src[i - W]! - c);
        else if (uy < 0 && y + 1 < H && !wall[i + W]) adv += -uy * (src[i + W]! - c);
        const nv = c + adv;
        dst[i] = nv > 0 ? (nv < maxV ? nv : maxV) : 0;
      }
    }
    this.value = dst;
    this.next = src;
  }

  sample(x: number, y: number): number {
    return this.value[y * this.W + x]!;
  }

  add(x: number, y: number, delta: number): boolean {
    const i = y * this.W + x;
    if (this.wall[i] || this.source[i] === this.source[i] || delta === 0) return false;
    const next = Math.min(DIFFUSE_LIMITS.maxValue, Math.max(0, this.value[i]! + delta));
    if (next === this.value[i]) return false;
    this.value[i] = next;
    return true;
  }

  copyFrom(prev: DiffuseField): void {
    const x0 = Math.max(this.ox, prev.ox), x1 = Math.min(this.ox + this.W, prev.ox + prev.W);
    const y0 = Math.max(this.oy, prev.oy), y1 = Math.min(this.oy + this.H, prev.oy + prev.H);
    for (let wy = y0; wy < y1; wy++) {
      const dstRow = (wy - this.oy) * this.W;
      const srcRow = (wy - prev.oy) * prev.W;
      for (let wx = x0; wx < x1; wx++) {
        const di = dstRow + (wx - this.ox);
        const si = srcRow + (wx - prev.ox);
        if (this.wall[di] || prev.wall[si]) continue;
        this.value[di] = prev.value[si]!;
      }
    }
  }
}

// --- Family 4: Discrete transition table (`table`) -----------------------------------------------------------------------------------

/**
 * Discrete automaton driven by a flat `states × 9` transition table (Moore neighbourhood count of `counted`).
 * Randomness comes purely from `hash32(seed, worldCellX, worldCellY, step)`: deterministic across machines and window shifts.
 */
export class TableField {
  readonly n: number;
  cells: Uint8Array;
  private next: Uint8Array;
  readonly wall: Uint8Array;
  readonly nextState: Uint8Array;
  readonly chance: Float32Array;
  steps = 0;

  constructor(
    readonly ox: number,
    readonly oy: number,
    readonly W: number,
    readonly H: number,
    readonly cell: CellSize,
    readonly states: number,
    readonly counted: number,
    rules: readonly TableRule[],
    readonly seed: number,
  ) {
    this.n = W * H;
    this.cells = new Uint8Array(this.n);
    this.next = new Uint8Array(this.n);
    this.wall = new Uint8Array(this.n);
    this.nextState = new Uint8Array(states * 9);
    this.chance = new Float32Array(states * 9);
    // Default: stay in the same state (p = 0).
    for (let s = 0; s < states; s++) for (let c = 0; c < 9; c++) this.nextState[s * 9 + c] = s;
    for (const r of rules) {
      if (r.from < 0 || r.from >= states || r.to < 0 || r.to >= states) continue;
      for (let c = Math.max(0, r.min); c <= Math.min(8, r.max); c++) {
        this.nextState[r.from * 9 + c] = r.to;
        this.chance[r.from * 9 + c] = r.p;
      }
    }
  }

  step(): void {
    const { W, H, ox, oy, cells, next, wall, nextState, chance, counted, seed } = this;
    const stepNo = this.steps++;
    for (let y = 0; y < H; y++) {
      const row = y * W;
      const wy = oy + y;
      const y0 = y > 0 ? y - 1 : 0;
      const y1 = y + 1 < H ? y + 1 : H - 1;
      for (let x = 0; x < W; x++) {
        const i = row + x;
        if (wall[i]) {
          next[i] = 0;
          continue;
        }
        const st = cells[i]!;
        let count = 0;
        const x0 = x > 0 ? x - 1 : 0;
        const x1 = x + 1 < W ? x + 1 : W - 1;
        for (let ny = y0; ny <= y1; ny++) {
          const nrow = ny * W;
          for (let nx = x0; nx <= x1; nx++) {
            if ((nx !== x || ny !== y) && cells[nrow + nx] === counted) count++;
          }
        }
        const slot = st * 9 + count;
        const p = chance[slot]!;
        if (p <= 0) next[i] = st;
        else if (p >= 1) next[i] = nextState[slot]!;
        else next[i] = hash32(seed, ox + x, wy, stepNo) * UNIT < p ? nextState[slot]! : st;
      }
    }
    this.cells = next;
    this.next = cells;
  }

  sample(x: number, y: number): number {
    return this.cells[y * this.W + x]!;
  }

  add(x: number, y: number, state: number): boolean {
    const i = y * this.W + x;
    if (this.wall[i] || !Number.isInteger(state) || state < 0 || state >= this.states) return false;
    if (this.cells[i] === state) return false;
    this.cells[i] = state;
    return true;
  }

  copyFrom(prev: TableField): void {
    this.steps = prev.steps;
    const x0 = Math.max(this.ox, prev.ox), x1 = Math.min(this.ox + this.W, prev.ox + prev.W);
    const y0 = Math.max(this.oy, prev.oy), y1 = Math.min(this.oy + this.H, prev.oy + prev.H);
    for (let wy = y0; wy < y1; wy++) {
      const dstRow = (wy - this.oy) * this.W;
      const srcRow = (wy - prev.oy) * prev.W;
      for (let wx = x0; wx < x1; wx++) {
        const di = dstRow + (wx - this.ox);
        const si = srcRow + (wx - prev.ox);
        if (this.wall[di] || prev.wall[si]) continue;
        this.cells[di] = prev.cells[si]!;
      }
    }
  }
}

// --- Family 5: MarkovJunior discrete rules (`rules`) ---------------------------------------------------------------------------------

/**
 * Discrete automaton written as a MarkovJunior program (`convolution`, `prl`, `all`, `one`, `symmetry="(xy)"`) running on a
 * persistent `Stepper` (ADR-0164). Deterministic from its seed and step count; no wall-clock deadline.
 */
export class RulesField {
  readonly n: number;
  readonly grid: Grid3;
  readonly states: number;
  private stepper: Stepper;
  steps = 0;

  constructor(
    readonly ox: number,
    readonly oy: number,
    readonly W: number,
    readonly H: number,
    readonly cell: CellSize,
    readonly xml: string,
    readonly stepsPerTick: number,
    readonly seed: number,
  ) {
    this.n = W * H;
    const compiled = compileRulesProgram(xml, W, H);
    if ('errors' in compiled) throw new Error(compiled.errors.join('; '));
    this.states = compiled.states;
    this.grid = { X: W, Y: H, Z: 1, cells: new Uint8Array(this.n), alphabet: ['.'], log: [], epoch: 0 };
    this.stepper = new Stepper(this.grid, compiled.model.program, seed, { side: Math.max(W, H, 64), cells: Math.max(this.n, MAX_CELLS_PER_AUTOMATON) });
  }

  get cells(): Uint8Array {
    return this.grid.cells;
  }

  step(): void {
    this.stepper.tick(this.stepsPerTick);
    this.steps++;
  }

  sample(x: number, y: number): number {
    return this.grid.cells[y * this.W + x]!;
  }

  add(x: number, y: number, state: number): boolean {
    if (!Number.isInteger(state) || state < 0 || state >= this.states) return false;
    return this.stepper.setCell(y * this.W + x, state);
  }

  copyFrom(prev: RulesField): void {
    this.steps = prev.steps;
    const x0 = Math.max(this.ox, prev.ox), x1 = Math.min(this.ox + this.W, prev.ox + prev.W);
    const y0 = Math.max(this.oy, prev.oy), y1 = Math.min(this.oy + this.H, prev.oy + prev.H);
    for (let wy = y0; wy < y1; wy++) {
      const dstRow = (wy - this.oy) * this.W;
      const srcRow = (wy - prev.oy) * prev.W;
      for (let wx = x0; wx < x1; wx++) {
        const di = dstRow + (wx - this.ox);
        const si = srcRow + (wx - prev.ox);
        this.stepper.setCell(di, prev.grid.cells[si]!);
      }
    }
  }
}

// --- Window clustering (T459 § 5.6: separate windows for distant wanderers) ----------------------------------------------------------

export interface ChunkBox {
  minCx: number;
  minCy: number;
  maxCx: number;
  maxCy: number;
}

/**
 * Groups loaded chunks into deterministic connected clusters (Chebyshev gap ≤ `maxGap`, default 2 chunks) so two distant
 * wanderers in multiplayer get separate windows instead of allocating the sea between them. Sorted by `(minCy, minCx)`.
 */
export function clusterChunks(chunks: ReadonlyArray<readonly [number, number]>, maxGap = 2): ChunkBox[] {
  if (!chunks.length) return [];
  const sorted = [...chunks].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const visited = new Uint8Array(sorted.length);
  const boxes: ChunkBox[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (visited[i]) continue;
    visited[i] = 1;
    const queue = [i];
    let minCx = sorted[i]![0], maxCx = minCx, minCy = sorted[i]![1], maxCy = minCy;
    while (queue.length) {
      const [cx, cy] = sorted[queue.pop()!]!;
      if (cx < minCx) minCx = cx;
      if (cx > maxCx) maxCx = cx;
      if (cy < minCy) minCy = cy;
      if (cy > maxCy) maxCy = cy;
      for (let j = 0; j < sorted.length; j++) {
        if (visited[j]) continue;
        const [ox, oy] = sorted[j]!;
        if (Math.abs(ox - cx) <= maxGap && Math.abs(oy - cy) <= maxGap) {
          visited[j] = 1;
          queue.push(j);
        }
      }
    }
    boxes.push({ minCx, minCy, maxCx, maxCy });
  }
  boxes.sort((a, b) => a.minCy - b.minCy || a.minCx - b.minCx);
  return boxes.slice(0, MAX_WINDOWS_PER_AUTOMATON);
}

/** Converts a chunk box to an automaton window in cell coordinates, clamped to `MAX_CELLS_PER_AUTOMATON` around its center. */
function windowForBox(box: ChunkBox, S: number, cell: CellSize): AutomatonWindow {
  const tx0 = box.minCx * S;
  const ty0 = box.minCy * S;
  const tx1 = (box.maxCx + 1) * S;
  const ty1 = (box.maxCy + 1) * S;
  let ox = Math.floor(tx0 / cell);
  let oy = Math.floor(ty0 / cell);
  let W = Math.max(1, Math.ceil(tx1 / cell) - ox);
  let H = Math.max(1, Math.ceil(ty1 / cell) - oy);
  if (W * H > MAX_CELLS_PER_AUTOMATON) {
    const scale = Math.sqrt(MAX_CELLS_PER_AUTOMATON / (W * H));
    const nW = Math.max(1, Math.floor(W * scale));
    const nH = Math.max(1, Math.floor(H * scale));
    ox += Math.floor((W - nW) / 2);
    oy += Math.floor((H - nH) / 2);
    W = nW;
    H = nH;
  }
  return { ox, oy, W, H, cell };
}

// --- The AutomataEngine --------------------------------------------------------------------------------------------------------------

type AnyField = FlowField | WindField | DiffuseField | TableField | RulesField;

interface AutomatonRuntime {
  spec: AutomatonSpec;
  sig: string;
  index: number;
  cell: CellSize;
  hz: number;
  /** Exact integer Bresenham accumulator against `TICK_HZ`. */
  accum: number;
  /** Total steps executed by this automaton. */
  steps: number;
  windows: AnyField[];
  /** Per-tick `world.field_add` write tracking (V-048). */
  tickCalls: number;
  tickTotal: number;
}

/**
 * Manages the world's cellular automata across the loaded window(s).
 * Inert when the world declares no automata (`specs.length === 0`): zero allocations, zero tick cost.
 */
export class AutomataEngine {
  private list: AutomatonRuntime[] = [];
  private byId = new Map<string, AutomatonRuntime>();
  private lastChunkSig = '';

  constructor(private world: AutomataWorld, specs: readonly AutomatonSpec[] = []) {
    if (specs.length) this.configure(specs);
  }

  /** Active automaton specs (in declaration order). */
  specs(): readonly AutomatonSpec[] {
    return this.list.map((r) => r.spec);
  }

  /** Whether any automaton is active in this world. */
  get active(): boolean {
    return this.list.length > 0;
  }

  /** Reconciles the active automata against a new repaired list from `universe.json → nature.automata`. */
  configure(specs: readonly AutomatonSpec[]): void {
    const prev = this.byId;
    const nextList: AutomatonRuntime[] = [];
    const nextMap = new Map<string, AutomatonRuntime>();
    for (let i = 0; i < specs.length; i++) {
      const spec = cloneAutomaton(specs[i]!);
      const sig = JSON.stringify(spec);
      const old = prev.get(spec.id);
      if (old && old.sig === sig && old.index === i) {
        nextList.push(old);
        nextMap.set(spec.id, old);
      } else {
        const rt: AutomatonRuntime = {
          spec,
          sig,
          index: i,
          cell: cellOf(spec),
          hz: hzOf(spec),
          accum: 0,
          steps: 0,
          windows: [],
          tickCalls: 0,
          tickTotal: 0,
        };
        nextList.push(rt);
        nextMap.set(spec.id, rt);
      }
    }
    this.list = nextList;
    this.byId = nextMap;
    this.lastChunkSig = '';
  }

  /** Drops all live window grids and resets accumulators (e.g. on universe reset / rollback). */
  reset(): void {
    for (const rt of this.list) {
      rt.windows = [];
      rt.accum = 0;
      rt.steps = 0;
      rt.tickCalls = 0;
      rt.tickTotal = 0;
    }
    this.lastChunkSig = '';
  }

  /** Resets per-tick `world.field_add` budgets (called at the start of every kernel tick before Lua runs). */
  beginTick(): void {
    for (const rt of this.list) {
      rt.tickCalls = 0;
      rt.tickTotal = 0;
    }
  }

  /** Synchronizes automaton windows with the currently loaded chunks, preserving state across overlaps. */
  syncWindow(): void {
    if (!this.list.length) return;
    const chunks = this.world.loadedChunks();
    if (!chunks.length) {
      if (this.lastChunkSig !== '') {
        for (const rt of this.list) rt.windows = [];
        this.lastChunkSig = '';
      }
      return;
    }
    const sorted = [...chunks].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    const sig = `${this.world.seed}|${this.world.chunkSize}|${sorted.map(([cx, cy]) => `${cx},${cy}`).join(';')}`;
    if (sig === this.lastChunkSig) return;
    this.lastChunkSig = sig;
    const boxes = clusterChunks(sorted);
    const S = this.world.chunkSize;
    for (const rt of this.list) {
      const nextWindows: AnyField[] = [];
      for (let wi = 0; wi < boxes.length; wi++) {
        const win = windowForBox(boxes[wi]!, S, rt.cell);
        const existing = rt.windows.find((w) => w.ox === win.ox && w.oy === win.oy && w.W === win.W && w.H === win.H);
        if (existing) {
          nextWindows.push(existing);
          continue;
        }
        const field = this.createField(rt, win, wi);
        this.bindTerrain(rt, field);
        for (const old of rt.windows) (field as FlowField).copyFrom(old as never);
        nextWindows.push(field);
      }
      rt.windows = nextWindows;
    }
  }

  /** Updates static terrain bindings (bed, walls, sources, obstacles) for the cells covering tile `(col, row)`. */
  refreshTile(col: number, row: number): void {
    if (!this.list.length) return;
    for (const rt of this.list) {
      const c = rt.cell;
      const cx0 = Math.floor(col / c), cx1 = Math.ceil((col + 1) / c) - 1;
      const cy0 = Math.floor(row / c), cy1 = Math.ceil((row + 1) / c) - 1;
      for (const f of rt.windows) {
        const x0 = Math.max(0, cx0 - f.ox), x1 = Math.min(f.W - 1, cx1 - f.ox);
        const y0 = Math.max(0, cy0 - f.oy), y1 = Math.min(f.H - 1, cy1 - f.oy);
        for (let y = y0; y <= y1; y++) {
          for (let x = x0; x <= x1; x++) this.bindCell(rt, f, x, y, false);
        }
      }
    }
  }

  /**
   * Advances all automata for one kernel tick (at `TICK_HZ` = 60 Hz).
   * When `held` is true (`pace: hold`, ADR-0196), no automaton advances.
   */
  tick(held = false): void {
    if (held || !this.list.length) return;
    this.syncWindow();
    for (const rt of this.list) {
      if (!rt.windows.length) continue;
      if (rt.spec.family === 'wind') {
        this.windTick(rt);
        continue;
      }
      rt.accum += rt.hz;
      while (rt.accum >= TICK_HZ) {
        rt.accum -= TICK_HZ;
        this.stepRuntime(rt);
        rt.steps++;
      }
    }
  }

  /**
   * One tick of a `wind` automaton (T484): its step is cut in the ticks from one to the next (`WindField.work`), the same share of what is
   * left in each, and whole in the tick the accumulator says, as the other families' are. A new step begins with the prevailing wind of the
   * world's time (`prevailingAt`). The same field as one step a time, byte for byte (`tests/vento.test.ts`): only the cost is spread.
   */
  private windTick(rt: AutomatonRuntime): void {
    rt.accum += rt.hz;
    const whole = rt.accum >= TICK_HZ;
    // The ticks this step still has, this one too.
    const ticks = whole ? 1 : 1 + Math.ceil((TICK_HZ - rt.accum) / rt.hz);
    const spec = rt.spec as WindSpec;
    for (const f of rt.windows as WindField[]) {
      if (f.done === 0) f.inflow = prevailingAt(this.world.seed, this.world.days?.() ?? 0, spec);
      if (whole) f.step();
      else f.work(Math.ceil((f.units - f.done) / ticks));
    }
    if (whole) {
      rt.accum -= TICK_HZ;
      rt.steps++;
    }
  }

  /** The prevailing wind of a `wind` automaton now (T484), in lattice units; undefined for any other id. */
  prevailing(id: string): [number, number] | undefined {
    const rt = this.byId.get(id);
    if (!rt || rt.spec.family !== 'wind') return undefined;
    return prevailingAt(this.world.seed, this.world.days?.() ?? 0, rt.spec);
  }

  /** Reads a sample at world coordinates `(x, y)` for `world.field(id, x, y)`: a fresh copy, or undefined. */
  sample(id: string, x: number, y: number): FieldSample | undefined {
    if (typeof id !== 'string' || !finite(x) || !finite(y)) return undefined;
    const rt = this.byId.get(id);
    if (!rt) return undefined;
    const cx = Math.floor(x / rt.cell);
    const cy = Math.floor(y / rt.cell);
    for (const f of rt.windows) {
      const lx = cx - f.ox, ly = cy - f.oy;
      if (lx >= 0 && ly >= 0 && lx < f.W && ly < f.H) return f.sample(lx, ly);
    }
    return undefined;
  }

  /**
   * Adds a bounded source or sink at world coordinates `(x, y)` for `world.field_add(id, x, y, amount, amountY?)` (V-048).
   * Enforces per-call and per-tick caps; ignores NaN/Infinity/invalid types and out-of-window points.
   */
  add(id: string, x: number, y: number, amount: number, amountY?: number | null): boolean {
    const ayOpt = amountY == null ? undefined : amountY;
    if (typeof id !== 'string' || !finite(x) || !finite(y) || !finite(amount)) return false;
    if (ayOpt !== undefined && !finite(ayOpt)) return false;
    const rt = this.byId.get(id);
    if (!rt || rt.tickCalls >= FIELD_ADD_LIMITS.maxCallsPerTick) return false;
    const cx = Math.floor(x / rt.cell);
    const cy = Math.floor(y / rt.cell);
    let field: AnyField | undefined;
    let lx = 0, ly = 0;
    for (const f of rt.windows) {
      const rx = cx - f.ox, ry = cy - f.oy;
      if (rx >= 0 && ry >= 0 && rx < f.W && ry < f.H) {
        field = f;
        lx = rx;
        ly = ry;
        break;
      }
    }
    if (!field) return false;

    const fam = rt.spec.family;
    if (fam === 'flow') {
      const rem = FIELD_ADD_LIMITS.flow.perTick - rt.tickTotal;
      if (rem <= 1e-9) return false;
      const clamped = Math.max(-FIELD_ADD_LIMITS.flow.perCall, Math.min(FIELD_ADD_LIMITS.flow.perCall, amount));
      const applied = Math.sign(clamped) * Math.min(Math.abs(clamped), rem);
      if (applied === 0) return false;
      if (!(field as FlowField).add(lx, ly, applied)) return false;
      rt.tickCalls++;
      rt.tickTotal += Math.abs(applied);
      return true;
    }
    if (fam === 'wind') {
      const rem = FIELD_ADD_LIMITS.wind.perTick - rt.tickTotal;
      if (rem <= 1e-9) return false;
      const wf = field as WindField;
      let ax: number, ay: number;
      if (ayOpt !== undefined) {
        ax = amount;
        ay = ayOpt;
      } else {
        // Scalar gust pushed along the prevailing wind direction (or east when still).
        const [px, py] = wf.inflow;
        const pm = Math.hypot(px, py);
        const dx = pm > 1e-6 ? px / pm : 1;
        const dy = pm > 1e-6 ? py / pm : 0;
        ax = amount * dx;
        ay = amount * dy;
      }
      const mag = Math.hypot(ax, ay);
      if (mag <= 0) return false;
      const cap = Math.min(FIELD_ADD_LIMITS.wind.perCall, rem);
      if (mag > cap) {
        const s = cap / mag;
        ax *= s;
        ay *= s;
      }
      if (!wf.add(lx, ly, ax, ay)) return false;
      rt.tickCalls++;
      rt.tickTotal += Math.hypot(ax, ay);
      return true;
    }
    if (fam === 'diffuse') {
      const rem = FIELD_ADD_LIMITS.diffuse.perTick - rt.tickTotal;
      if (rem <= 1e-9) return false;
      const clamped = Math.max(-FIELD_ADD_LIMITS.diffuse.perCall, Math.min(FIELD_ADD_LIMITS.diffuse.perCall, amount));
      const applied = Math.sign(clamped) * Math.min(Math.abs(clamped), rem);
      if (applied === 0) return false;
      if (!(field as DiffuseField).add(lx, ly, applied)) return false;
      rt.tickCalls++;
      rt.tickTotal += Math.abs(applied);
      return true;
    }
    // Discrete families (`table`, `rules`): sets cell to integer state index, capped per tick.
    if (rt.tickTotal >= FIELD_ADD_LIMITS.discrete.perTick) return false;
    if (!Number.isInteger(amount)) return false;
    const ok = fam === 'table' ? (field as TableField).add(lx, ly, amount) : (field as RulesField).add(lx, ly, amount);
    if (!ok) return false;
    rt.tickCalls++;
    rt.tickTotal += 1;
    return true;
  }

  /** Total automaton steps executed by `id` (0 if absent). */
  stepCount(id: string): number {
    return this.byId.get(id)?.steps ?? 0;
  }

  /** Active windows of automaton `id` (copy, for tests and diagnostics). */
  windowsOf(id: string): AutomatonWindow[] {
    const rt = this.byId.get(id);
    return rt ? rt.windows.map((f) => ({ ox: f.ox, oy: f.oy, W: f.W, H: f.H, cell: f.cell })) : [];
  }

  /** Direct read-only access to the underlying window grids of `id` (for determinism checks and A1/A2). */
  gridsOf(id: string): readonly AnyField[] {
    return this.byId.get(id)?.windows ?? [];
  }

  private createField(rt: AutomatonRuntime, win: AutomatonWindow, wi: number): AnyField {
    const s = rt.spec;
    const seed = hash32(this.world.seed, rt.index + 1, wi + 1, 48201);
    switch (s.family) {
      case 'flow':
        return new FlowField(win.ox, win.oy, win.W, win.H, win.cell, { gravity: s.gravity, damp: s.damp, level: s.level ?? this.world.seaLevel() });
      case 'wind':
        return new WindField(win.ox, win.oy, win.W, win.H, win.cell, { tau: s.tau, prevailing: prevailingAt(this.world.seed, this.world.days?.() ?? 0, s) });
      case 'diffuse':
        return new DiffuseField(win.ox, win.oy, win.W, win.H, win.cell, { rate: s.rate, decay: s.decay, advectScale: s.advectScale });
      case 'table':
        return new TableField(win.ox, win.oy, win.W, win.H, win.cell, s.states, s.counted, s.rules, seed);
      case 'rules':
        return new RulesField(win.ox, win.oy, win.W, win.H, win.cell, s.program, s.steps ?? 1, seed);
    }
  }

  private bindTerrain(rt: AutomatonRuntime, field: AnyField): void {
    for (let y = 0; y < field.H; y++) {
      for (let x = 0; x < field.W; x++) this.bindCell(rt, field, x, y, true);
    }
  }

  private bindCell(rt: AutomatonRuntime, field: AnyField, lx: number, ly: number, init: boolean): void {
    const s = rt.spec;
    const col = Math.floor((field.ox + lx + 0.5) * field.cell);
    const row = Math.floor((field.oy + ly + 0.5) * field.cell);
    const code = this.world.tileAt(col, row);
    const i = ly * field.W + lx;
    if (s.family === 'flow') {
      const f = field as FlowField;
      f.bed[i] = this.world.groundAt(col, row);
      const isWall = s.walls?.includes(code) ? 1 : 0;
      f.wall[i] = isWall;
      if (isWall) f.hasWalls = true;
      f.source[i] = !isWall && s.sources?.includes(code) ? 1 : 0;
      if (isWall) f.depth[i] = 0;
      else if (f.source[i]) f.depth[i] = Math.min(FLOW_LIMITS.maxDepth, Math.max(0, f.level - f.bed[i]!));
    } else if (s.family === 'wind') {
      const f = field as WindField;
      const limit = this.world.seaLevel() + (s.layerHeight ?? 3);
      f.solid[i] = this.world.groundAt(col, row) > limit || s.obstacles?.includes(code) ? 1 : 0;
    } else if (s.family === 'diffuse') {
      const f = field as DiffuseField;
      f.wall[i] = s.walls?.includes(code) ? 1 : 0;
      const src = s.sources?.find((x) => x.tile === code);
      f.source[i] = !f.wall[i] && src ? src.value : NaN;
      if (f.wall[i]) f.value[i] = 0;
      else if (src && init) f.value[i] = src.value;
    } else if (s.family === 'table') {
      const f = field as TableField;
      f.wall[i] = s.walls?.includes(code) ? 1 : 0;
      if (f.wall[i]) f.cells[i] = 0;
      else if (init && s.initial) {
        const hit = s.initial.find((x) => x.tile === code);
        if (hit) f.cells[i] = hit.state;
      }
    } else if (s.family === 'rules' && init && s.initial) {
      const hit = s.initial.find((x) => x.tile === code);
      if (hit) (field as RulesField).add(lx, ly, hit.state);
    }
  }

  private stepRuntime(rt: AutomatonRuntime): void {
    const s = rt.spec;
    if (s.family === 'flow') {
      const dt = 1 / rt.hz;
      for (const f of rt.windows) (f as FlowField).step(dt);
    } else if (s.family === 'diffuse') {
      const advId = s.advect;
      const advRt = advId ? this.byId.get(advId) : undefined;
      const vel =
        advRt && (advRt.spec.family === 'wind' || advRt.spec.family === 'flow')
          ? (wx: number, wy: number): [number, number] => {
              const sample = this.sample(advRt.spec.id, wx, wy);
              if (!sample || typeof sample === 'number') return [0, 0];
              if (advRt.spec.family === 'flow') {
                const k = 1 / (rt.hz * rt.cell);
                return [sample.vx * k, sample.vy * k];
              }
              return [sample.vx, sample.vy];
            }
          : undefined;
      for (const f of rt.windows) (f as DiffuseField).step(vel);
    } else if (s.family === 'table') {
      for (const f of rt.windows) (f as TableField).step();
    } else {
      for (const f of rt.windows) (f as RulesField).step();
    }
  }
}
