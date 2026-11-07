// MarkovJunior in three dimensions, for the voxel lab (experimental, outside the kernel).
// A program rewrites a box of voxels with local rules, like src/kernel/mj.ts does with tiles; the lab
// then photographs the result in 3/4 from four sides (render.ts).
//
// Coordinates: x left → right, y back (north) → front (south, towards the camera), z bottom → top.
// Patterns: z-layers separated by spaces (bottom first), rows by '/' (back first), one char per cell.
// In an input '*' matches anything and "[AB]" any listed code; in an output '*' keeps the cell.
// A program may name sets of codes once ("unions": {"?": "BR"}): in inputs the symbol means any of them.
// '.' is air. Codes without a colour in the palette (or with "hidden") are invisible markers.
// Nodes:
//   one | all | prl  — rewrite rules (one random match per step / every non-overlapping match / each
//                      match with probability p), `symmetry` xy (default), none, x, all
//   sequence | markov — children in order until each is done / the first that can still do something
//   conv             — cellular automaton: a cell becomes `out` if it is `in` and between `min` and `max`
//                      of its neighbours (moore: 26, vonneumann: 6) are in `neighbors`
//   path             — shortest path of `color` from a `from` cell to the nearest `to` cell over `on` cells;
//                      `inertia` keeps going straight while it can, `longest` starts from the farthest `from`
//   map              — scales the grid by integer factors: every cell becomes a block of itself, then rules
//                      whose input is on the old grid write their (scaled) output on the new one; what comes
//                      after works at the new resolution (MarkovJunior "map": coarse plan → fine detail); with
//                      `clear` the factors may be fractions (`divide`, T335): 1/3 shrinks, 5/3 grows
//   wfc              — wave function collapse (wfc.ts, T335): one tile per cell of the grid (`tile`), or the grid's
//                      own cells from the windows of a flat sample (`overlap`); the new grid is what the tiles or
//                      windows write, and what comes after works on it
//   convchain        — MarkovJunior's ConvChain on a flat grid: `on` cells become black or white, then sweeps of
//                      Metropolis steps make every N×N window as likely as in the sample
//   shape            — box, ellipsoid, cylinder, cone resting on `at` (centre of the base), or a line
//                      from `at` to `to` with radius `r`; `on` limits which codes it may overwrite
// A rule node may also infer (infer.ts, T334): `fields` (potentials that rank its matches, softly with `temperature`), `observe`
// (a future the node walks towards) and `search` (a whole trajectory found first, within ceilings); then a match is wherever the
// input fits, as in MarkovJunior, and the node is a `GuidedRunner`. Every other node runs as it always did (ADR-0142).
//
// Programs written in MarkovJunior's own XML (lab/mjx) compile to these nodes with MarkovJunior's
// semantics: map with `clear` (a new empty grid, rules wrapping round), conv with `sums`, unlimited steps.

import { Rng } from '../kernel/rng';
import { backwardPotentials, fieldPotential, goalReached, INFERENCE_LIMITS, makeWork, MAX_OBSERVED_CODES, prepare, search, type InferRule, type Prepared, type Work } from './infer';
import { convchainWeights, squareSubgroup, waveBytes, WFC_LIMITS, WfcError, WfcSolver } from './wfc';

export type Vec3 = [number, number, number];
/**
 * Symmetry groups, as MarkovJunior names them in 3D: xy = "(xy)" (turns and mirrors in the horizontal
 * plane: gravity stays), none = "()", x = "(x)", y = "(y)", z = "(z)" (upside down), rot = "(xyz+)" (the 24
 * turns of the cube, no mirror), all = "(xyz)" (the whole cube group, 48).
 */
export type Sym = 'xy' | 'none' | 'x' | 'y' | 'z' | 'rot' | 'all';

export interface Rule3 {
  in: string;
  out: string;
  /** Weight (one) or probability (prl). */
  p?: number;
  /** Its own symmetry (MarkovJunior lets a rule narrow its node's). */
  symmetry?: Sym;
}

export interface ConvRule {
  in: string;
  out: string;
  neighbors: string;
  min?: number;
  max?: number;
  /** The neighbour counts that fire the rule (MarkovJunior "sum"); when given, min and max are ignored. */
  sums?: number[];
  p?: number;
}

export type ShapeKind = 'box' | 'ellipsoid' | 'cylinder' | 'cone' | 'line';
export const SHAPES: readonly ShapeKind[] = ['box', 'ellipsoid', 'cylinder', 'cone', 'line'];

/**
 * MarkovJunior's <field>: the potential of the code `for` is the distance, over `on` cells, from the nearest `to` cell; with `from`
 * instead of `to` it is inversed (the node moves away). `recompute` computes it again at every step (else once, at the node's first
 * step); a field `essential` that finds no `to` (or `from`) cell stops the node.
 */
export interface FieldSpec {
  for: string;
  from?: string;
  to?: string;
  on: string;
  recompute?: boolean;
  essential?: boolean;
}

/** MarkovJunior's <observe>: cells of `value` become `from` (the same code if not said) and must end as one of `to`. */
export interface ObserveSpec {
  value: string;
  from?: string;
  to: string;
}

/** What a rule node infers (T334): with none of it, it is the node it always was. */
export interface Inference {
  fields?: FieldSpec[];
  /** How softly the potentials choose: 0 (MarkovJunior's default) always the best, larger more at random. */
  temperature?: number;
  observe?: ObserveSpec[];
  /** Search a whole trajectory before the first step, instead of walking down the potentials. */
  search?: boolean;
  /** States the search may keep (MarkovJunior: unlimited, 20 tries); never more than `INFERENCE_LIMITS.boards`. */
  limit?: number;
  /** Weight of the depth in the search's ranking (0.5); below 0, deepest first. */
  depthCoefficient?: number;
}

/**
 * MarkovJunior's <wfc> (T335, ADR-0174), its tileset or sample already turned into patterns (model.ts, wfc.ts): the wave holds one
 * pattern per cell of the grid, and the grid that follows is what the patterns write.
 */
export interface WfcNode {
  type: 'wfc';
  /** `tile`: a tile per cell, the tiles side by side; `overlap`: the windows of a flat sample, the grid as large as before. */
  model: 'tile' | 'overlap';
  /** Each pattern's letters ('.' the empty one), x fastest, then y, then z from the bottom: `dims` cells each. */
  patterns: string[];
  dims: Vec3;
  weights: number[];
  /** Per direction (+x, +y, -x, -y, +z, -z; four for `overlap`), per pattern, the patterns that may stand there. */
  propagator: number[][][];
  /** A cell of the grid with this letter may hold only these patterns; any other, every pattern. */
  map: Record<string, number[]>;
  /** `tile`: how many cells two neighbouring tiles share (x, y, z; negative leaves a gap between them). */
  overlap?: Vec3;
  /** `tile`: the wave wraps round the edges (`overlap` always does, as in MarkovJunior). */
  periodic?: boolean;
  /** The cell of least Shannon entropy is observed first, not the one with fewest patterns. */
  shannon?: boolean;
  /** Tries to find a seed without contradictions (1000, never more than `WFC_LIMITS.tries`). */
  tries?: number;
}

/** MarkovJunior's <convchain> (T335): `on` cells become `black` or `white` like the sample, `1` white and `0` black, rows of `sampleSize[0]`. */
export interface ConvChainNode {
  type: 'convchain';
  sample: string;
  sampleSize: [number, number];
  n: number;
  temperature?: number;
  on: string;
  black: string;
  white: string;
  /** Steps, the first one included (it paints the `on` cells); unlimited if not said. */
  steps?: number;
  symmetry?: Sym;
}

export type Node3 =
  | ({ type: 'one' | 'all' | 'prl'; rules: Rule3[]; steps?: number; symmetry?: Sym; optional?: boolean } & Inference)
  /** `gated` (a sequence the compiler makes of a wfc and its nodes, T335): the rest runs only if the first child did something. */
  | { type: 'sequence' | 'markov'; children: Node3[]; gated?: boolean }
  | { type: 'conv'; rules: ConvRule[]; neighborhood?: 'moore' | 'vonneumann' | 'nocorners'; steps?: number; periodic?: boolean }
  | { type: 'path'; from: string; to: string; on: string; color: string; steps?: number; inertia?: boolean; longest?: boolean }
  /** Each factor is `scale / divide` (T335: 1/3, 5/3), fractions only with `clear`. */
  | { type: 'map'; scale: Vec3; divide?: Vec3; rules?: Rule3[]; symmetry?: Sym; clear?: boolean }
  | WfcNode
  | ConvChainNode
  | { type: 'shape'; shape: ShapeKind; at: Vec3; size?: Vec3; to?: Vec3; r?: number; color: string; on?: string };

/** Body parts the kernel can move to animate a figure (legs and arms swing, the head nods, tails wag). */
export const PARTS = ['leg', 'arm', 'head', 'tail'] as const;
export type Part = (typeof PARTS)[number];

export interface PaletteEntry {
  name?: string;
  color?: string;
  hidden?: boolean;
  part?: Part;
  /** The letter gives light: drawn unshaded and bright, it blooms (flames, windows, neon). */
  glow?: boolean;
  /** Translucent voxel (e.g. glass, water): alpha value between 0 and 1. */
  alpha?: number;
}

export interface Program3 {
  name?: string;
  size: Vec3;
  palette: Record<string, PaletteEntry>;
  /** A cell of this code before the program starts (MarkovJunior "origin"), where `originAt` says. */
  origin?: string;
  /** The bottom centre (default) or the centre of the box, as MarkovJunior does. */
  originAt?: 'bottom' | 'centre';
  /** Fills the layer z = 0 with this code (a floor to grow on; hide it if it should not show). */
  ground?: string;
  /** Fills the layer `soilAt` with this code, over `ground` if it is the same layer: where the ground of the world is (ADR-0135). `originAt: 'bottom'` is on it. */
  soil?: string;
  /** Voxels under the ground; 0 if not said. */
  soilAt?: number;
  /** Symbol → codes it stands for in rule inputs (MarkovJunior "union"). */
  unions?: Record<string, string>;
  program: Node3;
}

export const AIR = '.';
export const MAX_SIDE = 64;
export const MAX_CELLS = 64 * 64 * 64;
/** Codes a program may use, air included (cells are bytes). */
export const MAX_CODES = 256;

/** How large a grid may be: voxel models (the default) or layouts of blocks (structure.ts). */
export interface GridLimits {
  side: number;
  cells: number;
}
export const MODEL_LIMITS: GridLimits = { side: MAX_SIDE, cells: MAX_CELLS };

export class Mj3Error extends Error { }

/** A search that ran out of time (`INFERENCE_LIMITS.searchMs` or the run's deadline): the run stops, not finished. */
class Mj3Late extends Error { }

export interface Grid3 {
  X: number;
  Y: number;
  Z: number;
  /** Index into `alphabet` per cell; 0 is air. Cell (x, y, z) is x + y·X + z·X·Y. */
  cells: Uint8Array;
  alphabet: string[];
  /** Every cell written, in order (runners read it to update their matches). */
  log: number[];
  /** Bumped when the log is cleared: runners must rescan. */
  epoch: number;
}

// ---------------------------------------------------------------- where the codes are (D33, T258)

/**
 * How many cells of each code every row (z, y) of the grid holds, kept up to date by `write`. A full scan of a pattern then visits
 * only the rows where its rarest cell can be, in the same order as a scan of the whole grid: the matches, and so the run, are the
 * same voxel for voxel; a program on a large grid stops paying the whole grid for every node it starts.
 */
class Census {
  readonly cells: Uint8Array;
  readonly X: number;
  readonly Y: number;
  readonly Z: number;
  /** Per code, cells of that code in each row `z·Y + y` (allocated for the codes that appear). */
  rows: Array<Int32Array | undefined> = [];
  /** Per code, cells of that code in the grid. */
  total = new Float64Array(MAX_CODES);
  constructor(g: Grid3) {
    this.cells = g.cells;
    this.X = g.X;
    this.Y = g.Y;
    this.Z = g.Z;
    const R = g.Y * g.Z;
    const X = g.X;
    const cells = g.cells;
    for (let r = 0, i = 0; r < R; r++)
      for (let x = 0; x < X; x++, i++) {
        const c = cells[i];
        (this.rows[c] ??= new Int32Array(R))[r]++;
        this.total[c]++;
      }
  }
  fits(g: Grid3): boolean {
    return this.cells === g.cells && this.X === g.X && this.Y === g.Y && this.Z === g.Z;
  }
  moved(idx: number, from: number, to: number): void {
    const r = (idx / this.X) | 0;
    this.rows[from]![r]--;
    (this.rows[to] ??= new Int32Array(this.Y * this.Z))[r]++;
    this.total[from]--;
    this.total[to]++;
  }
}

/** The grid of the run in progress and its census (built when a scan first needs it), and when the run must end: runs do not nest. */
let current: { g: Grid3; census?: Census; deadline?: number } | undefined;

function censusOf(g: Grid3): Census {
  if (current?.g !== g) current = { g };
  if (!current.census?.fits(g)) current.census = new Census(g);
  return current.census;
}

function write(g: Grid3, idx: number, v: number): boolean {
  const was = g.cells[idx];
  if (was === v) return false;
  g.cells[idx] = v;
  const c = current;
  if (c !== undefined && c.g === g && c.census !== undefined && c.census.cells === g.cells) c.census.moved(idx, was, v);
  g.log.push(idx);
  if (g.log.length > 2_000_000) {
    g.log.length = 0;
    g.epoch++;
  }
  return true;
}

/**
 * The codes of a program, and the sets of codes its rules accept. A set is a table of MAX_CODES flags,
 * referred to by its number: membership is one array read, for any number of codes (a 32-bit mask
 * would stop at 31).
 */
class Alphabet {
  codes: string[] = [AIR];
  sets: Uint8Array[] = [];
  unions = new Map<string, string>();
  private setIds = new Map<string, number>();
  index(ch: string): number {
    if (this.unions.has(ch)) throw new Mj3Error(`"${ch}" è un'unione: vale solo negli ingressi delle regole`);
    let i = this.codes.indexOf(ch);
    if (i < 0) {
      if (this.codes.length >= MAX_CODES) throw new Mj3Error(`troppi codici (max ${MAX_CODES - 1})`);
      i = this.codes.push(ch) - 1;
    }
    return i;
  }
  /** The number of the set of the given codes. */
  mask(set: string): number {
    const key = [...new Set([...set].flatMap((ch) => [...(this.unions.get(ch) ?? ch)]))].sort().join('');
    let id = this.setIds.get(key);
    if (id === undefined) {
      const flags = new Uint8Array(MAX_CODES);
      for (const ch of key) flags[this.index(ch)] = 1;
      id = this.sets.push(flags) - 1;
      this.setIds.set(key, id);
    }
    return id;
  }
}

// ---------------------------------------------------------------- patterns

interface Pattern {
  dx: number;
  dy: number;
  dz: number;
  /** Per cell: set of accepted codes (Alphabet.sets), -1 = anything. */
  input: Int32Array;
  /** Per cell: code to write, -1 = keep. */
  output: Int16Array;
  p: number;
  /** Which rule of its node it comes from: symmetry variants share the number. */
  rule: number;
}

const cellsOf = (row: string) => row.match(/\[[^\]]*\]|./g) ?? [];
const layersOf = (src: string) => src.trim().split(/\s+/).map((layer) => layer.split('/').map(cellsOf));

function parsePattern(rule: Rule3, alpha: Alphabet): Pattern {
  if (typeof rule?.in !== 'string' || typeof rule?.out !== 'string') throw new Mj3Error('regola senza in/out');
  const li = layersOf(rule.in);
  const lo = layersOf(rule.out);
  const dz = li.length;
  const dy = li[0].length;
  const dx = li[0][0].length;
  const same = (ls: string[][][]) => ls.length === dz && ls.every((l) => l.length === dy && l.every((r) => r.length === dx));
  if (!same(li) || !same(lo)) throw new Mj3Error(`in e out devono avere la stessa forma: "${rule.in}" → "${rule.out}"`);
  if (dx * dy * dz > 1728) throw new Mj3Error(`regola troppo grande (max 1728 celle): ${rule.in}`);
  const input = new Int32Array(dx * dy * dz);
  const output = new Int16Array(dx * dy * dz);
  for (let k = 0; k < dz; k++)
    for (let j = 0; j < dy; j++)
      for (let i = 0; i < dx; i++) {
        const n = i + j * dx + k * dx * dy;
        const a = li[k][j][i];
        input[n] = a === '*' ? -1 : alpha.mask(a.startsWith('[') ? a.slice(1, -1) : a);
        const b = lo[k][j][i];
        if (b.startsWith('[')) throw new Mj3Error(`"[..]" non è ammesso in un'uscita: ${rule.out}`);
        output[n] = b === '*' ? -1 : alpha.index(b);
      }
  return { dx, dy, dz, input, output, p: typeof rule.p === 'number' && rule.p > 0 ? rule.p : 1, rule: 0 };
}

const PERMS: Vec3[] = [[0, 1, 2], [1, 0, 2], [0, 2, 1], [2, 1, 0], [1, 2, 0], [2, 0, 1]];
const PERM_ODD = [0, 1, 1, 1, 0, 0];

/** The symmetries a rule is also tried in: xy keeps z (gravity), all is the whole cube group. */
function symmetries(sym: Sym): Array<{ perm: Vec3; flip: Vec3 }> {
  const flips = (fx: number[], fy: number[], fz: number[]) => fx.flatMap((a) => fy.flatMap((b) => fz.map((c) => [a, b, c] as Vec3)));
  const cube = () => PERMS.flatMap((perm) => flips([0, 1], [0, 1], [0, 1]).map((flip) => ({ perm, flip })));
  switch (sym) {
    case 'none':
      return [{ perm: [0, 1, 2], flip: [0, 0, 0] }];
    case 'x':
      return flips([0, 1], [0], [0]).map((flip) => ({ perm: [0, 1, 2], flip }));
    case 'y':
      return flips([0], [0, 1], [0]).map((flip) => ({ perm: [0, 1, 2], flip }));
    case 'z':
      return flips([0], [0], [0, 1]).map((flip) => ({ perm: [0, 1, 2], flip }));
    case 'all':
      return cube();
    case 'rot':
      // Proper turns only: an odd permutation needs an odd number of mirrors to stay a turn.
      return cube().filter(({ perm, flip }) => (PERM_ODD[PERMS.findIndex((p) => p.join() === perm.join())] + flip[0] + flip[1] + flip[2]) % 2 === 0);
    default:
      return PERMS.slice(0, 2).flatMap((perm) => flips([0, 1], [0, 1], [0]).map((flip) => ({ perm, flip })));
  }
}

function transform(p: Pattern, perm: Vec3, flip: Vec3): Pattern {
  const d: Vec3 = [p.dx, p.dy, p.dz];
  const nd: Vec3 = [d[perm[0]], d[perm[1]], d[perm[2]]];
  const input = new Int32Array(p.input.length);
  const output = new Int16Array(p.output.length);
  for (let k = 0; k < p.dz; k++)
    for (let j = 0; j < p.dy; j++)
      for (let i = 0; i < p.dx; i++) {
        const c: Vec3 = [i, j, k];
        const n = [0, 1, 2].map((a) => (flip[a] ? nd[a] - 1 - c[perm[a]] : c[perm[a]]));
        const to = n[0] + n[1] * nd[0] + n[2] * nd[0] * nd[1];
        const from = i + j * p.dx + k * p.dx * p.dy;
        input[to] = p.input[from];
        output[to] = p.output[from];
      }
  return { dx: nd[0], dy: nd[1], dz: nd[2], input, output, p: p.p, rule: p.rule };
}

function variants(p: Pattern, sym: Sym): Pattern[] {
  const seen = new Set<string>();
  const out: Pattern[] = [];
  for (const { perm, flip } of symmetries(sym)) {
    const v = transform(p, perm, flip);
    const key = `${v.dx},${v.dy},${v.dz}|${v.input.join(',')}|${v.output.join(',')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

// ---------------------------------------------------------------- runners

abstract class Runner {
  count = 0;
  /** Times the node did something over the whole run (never reset): a node at 0 never matched. */
  total = 0;
  /** Why it did nothing the first time it was asked (for a node that never did anything). */
  why?: string;
  /** Times each rule of the node was applied over the whole run (never reset). */
  fired: number[] = [];
  /** What the node found out on its own (a search's trajectory), for the trace. */
  note?: string;
  constructor(protected limit?: number) { }
  reset(): void {
    this.count = 0;
  }
  /** As `reset`, for a program kept between calls (`Stepper.tick`): what the node knows of the grid stays, its count starts again. */
  rewind(): void {
    this.count = 0;
  }
  /** One step: true if the node changed the grid. */
  abstract go(g: Grid3, rng: Rng): boolean;
}

/**
 * True while a `Stepper` runs its program again (`tick`): a node that starts again keeps its matches and brings them up to date from
 * the grid's log, instead of scanning the grid. False for every other run, which therefore does not change (ADR-0142).
 */
let keeping = false;
const restart = (r: Runner) => (keeping ? r.rewind() : r.reset());

/**
 * Matches kept as a set with O(1) random pick and removal. The order of `keys` is part of the run (a pick is an index into it), so
 * every version of this class must keep it: appended when added, the last one moved into the hole when one is removed.
 */
const NO_BUCKETS = new Int32Array(0);

class MatchSet {
  keys: number[] = [];
  /** Where each key is in `keys`; built when first needed after a scan, which only appends keys it has not seen. */
  private where: Map<number, number> | undefined = new Map();
  /** How many keys fall in each bucket of a hash: an empty bucket says a key is absent without asking the map (most removes). */
  private buckets = NO_BUCKETS;
  private static readonly BUCKETS = 1 << 16;
  private static bucket(k: number): number {
    return Math.imul(k, 0x9e3779b1) >>> 16;
  }
  private index(): Map<number, number> {
    if (this.where === undefined) {
      const w = new Map<number, number>();
      const keys = this.keys;
      if (this.buckets.length !== MatchSet.BUCKETS) this.buckets = new Int32Array(MatchSet.BUCKETS);
      const b = this.buckets;
      b.fill(0);
      for (let i = 0; i < keys.length; i++) {
        w.set(keys[i], i);
        b[MatchSet.bucket(keys[i])]++;
      }
      this.where = w;
    }
    return this.where;
  }
  /** A key that is surely not in the set (a scan visits each key once). */
  push(k: number): void {
    this.keys.push(k);
  }
  add(k: number): void {
    const where = this.index();
    const h = MatchSet.bucket(k);
    if (this.buckets[h] !== 0 && where.has(k)) return;
    where.set(k, this.keys.length);
    this.buckets[h]++;
    this.keys.push(k);
  }
  remove(k: number): void {
    const where = this.index();
    const h = MatchSet.bucket(k);
    if (this.buckets[h] === 0) return;
    const i = where.get(k);
    if (i === undefined) return;
    this.buckets[h]--;
    const last = this.keys.pop()!;
    if (i < this.keys.length) {
      this.keys[i] = last;
      where.set(last, i);
    }
    where.delete(k);
  }
  clear(): void {
    this.keys = [];
    this.where = undefined;
  }
}

/**
 * A pattern as offsets into the grid: the cells it reads (with their sets) and the cells it writes, for a grid of one width and
 * depth. The cells read go rarest set first: the answer of `check` does not depend on the order, only how soon it is known.
 */
interface Probe {
  X: number;
  XY: number;
  inOff: Int32Array;
  inSets: Uint8Array[];
  inI: Int32Array;
  inJ: Int32Array;
  inK: Int32Array;
  /** The number of each set read (`Alphabet.sets`). */
  inSet: Int32Array;
  outOff: Int32Array;
  outVal: Int16Array;
}

/** The codes of a set of flags. */
const codesCache = new WeakMap<Uint8Array, Int32Array>();
function codesOf(set: Uint8Array): Int32Array {
  let c = codesCache.get(set);
  if (!c) {
    const out: number[] = [];
    for (let i = 0; i < set.length; i++) if (set[i]) out.push(i);
    codesCache.set(set, (c = Int32Array.from(out)));
  }
  return c;
}

/** One buffer of stamps for all the runners (a sync does not nest): a cell written twice since the last look is looked at once. */
let stamps = new Uint32Array(0);
let stampN = 0;
/** One buffer for `all`: the cells written in this step. Cleared after each step. */
let writtenBuf = new Uint8Array(0);

class RuleRunner extends Runner {
  protected patterns: Pattern[];
  private probes: Array<Probe | undefined> = [];
  protected matches = new MatchSet();
  private seen = 0;
  private epoch = -1;
  private uniform: boolean;
  protected sets: Uint8Array[];
  /** The cells the rules look for (a code, or a set of codes), to explain a node that never matches. */
  private wanted: string[];
  protected alpha: Alphabet;

  /**
   * `inputOnly`: a match is wherever the input fits, as in MarkovJunior, even if it would change nothing (the guided nodes, where a
   * rule that keeps a cell competes with the others); otherwise only where it would change something, as the lab has always done.
   */
  constructor(
    protected kind: 'one' | 'all' | 'prl',
    rules: Rule3[],
    limit: number | undefined,
    sym: Sym,
    alpha: Alphabet,
    private inputOnly = false,
  ) {
    super(limit);
    if (!Array.isArray(rules) || !rules.length) throw new Mj3Error(`nodo ${kind} senza regole`);
    this.patterns = rules.flatMap((r, i) => variants({ ...parsePattern(r, alpha), rule: i }, r.symmetry ?? sym));
    this.fired = rules.map(() => 0);
    this.wanted = [...new Set(rules.flatMap((r) => (r.in.match(/\[[^\]]*\]|[^*/ ]/g) ?? []).map((c) => (c.startsWith('[') ? c.slice(1, -1) : c))))];
    this.alpha = alpha;
    this.sets = alpha.sets;
    this.uniform = this.patterns.every((p) => p.p === this.patterns[0].p);
  }

  reset(): void {
    super.reset();
    this.epoch = -1;
  }

  protected probe(pi: number, g: Grid3): Probe {
    const XY = g.X * g.Y;
    const old = this.probes[pi];
    if (old && old.X === g.X && old.XY === XY) return old;
    const p = this.patterns[pi];
    const ins: Array<{ n: number; i: number; j: number; k: number; set: number; size: number }> = [];
    const outs: Array<{ off: number; v: number }> = [];
    for (let k = 0, n = 0; k < p.dz; k++)
      for (let j = 0; j < p.dy; j++)
        for (let i = 0; i < p.dx; i++, n++) {
          const off = i + j * g.X + k * XY;
          if (p.input[n] !== -1) ins.push({ n, i, j, k, set: p.input[n], size: codesOf(this.sets[p.input[n]]).length });
          if (p.output[n] !== -1) outs.push({ off, v: p.output[n] });
        }
    ins.sort((a, b) => a.size - b.size || a.n - b.n);
    const pr: Probe = {
      X: g.X,
      XY,
      inOff: Int32Array.from(ins, (c) => c.i + c.j * g.X + c.k * XY),
      inSets: ins.map((c) => this.sets[c.set]),
      inI: Int32Array.from(ins, (c) => c.i),
      inJ: Int32Array.from(ins, (c) => c.j),
      inK: Int32Array.from(ins, (c) => c.k),
      inSet: Int32Array.from(ins, (c) => c.set),
      outOff: Int32Array.from(outs, (c) => c.off),
      outVal: Int16Array.from(outs, (c) => c.v),
    };
    this.probes[pi] = pr;
    return pr;
  }

  /** Whether the pattern matches with its first cell at `o` and would change something. */
  private static checkAt(pr: Probe, cells: Uint8Array, o: number): boolean {
    const { inOff, inSets, outOff, outVal } = pr;
    for (let t = 0; t < inOff.length; t++) if (!inSets[t][cells[o + inOff[t]]]) return false;
    for (let t = 0; t < outOff.length; t++) if (cells[o + outOff[t]] !== outVal[t]) return true;
    return false;
  }

  /** Whether the pattern matches with its first cell at `o`, whatever it writes. */
  private static fitsAt(pr: Probe, cells: Uint8Array, o: number): boolean {
    const { inOff, inSets } = pr;
    for (let t = 0; t < inOff.length; t++) if (!inSets[t][cells[o + inOff[t]]]) return false;
    return true;
  }

  private scan(g: Grid3): void {
    const N = g.cells.length;
    this.matches.clear();
    const census = censusOf(g);
    for (let pi = 0; pi < this.patterns.length; pi++) this.scanPattern(g, census, pi, N);
  }

  /**
   * Every match of one pattern, in the order of a scan of the whole grid (z, then y, then x): only the rows where its rarest cells
   * can be are looked at, and in them only where the rarest one is.
   */
  private scanPattern(g: Grid3, census: Census, pi: number, N: number): void {
    const p = this.patterns[pi];
    const pr = this.probe(pi, g);
    const { X, Y, Z, cells } = g;
    const XY = pr.XY;
    const base = pi * N;
    const nIn = pr.inOff.length;
    const only = this.inputOnly;
    if (nIn === 0) {
      for (let z = 0; z + p.dz <= Z; z++)
        for (let y = 0; y + p.dy <= Y; y++)
          for (let x = 0; x + p.dx <= X; x++) {
            const o = x + y * X + z * XY;
            if (only || RuleRunner.checkAt(pr, cells, o)) this.matches.push(base + o);
          }
      return;
    }
    // How many cells of the grid each read cell could be: none, and the pattern matches nowhere.
    const counts: number[] = [];
    for (let t = 0; t < nIn; t++) {
      let s = 0;
      for (const c of codesOf(pr.inSets[t])) s += census.total[c];
      if (s === 0) return;
      counts.push(s);
    }
    const order = counts.map((_, t) => t).sort((a, b) => counts[a] - counts[b] || a - b);
    const filters = order.slice(0, Math.min(3, nIn)).filter((t, n) => n === 0 || counts[t] < N);
    const fJ = filters.map((t) => pr.inJ[t]);
    const fK = filters.map((t) => pr.inK[t]);
    const fCodes = filters.map((t) => codesOf(pr.inSets[t]));
    const anchor = order[0];
    const aSet = pr.inSets[anchor];
    const aI = pr.inI[anchor], aJ = pr.inJ[anchor], aK = pr.inK[anchor];
    const rows = census.rows;
    for (let oz = 0; oz + p.dz <= Z; oz++)
      rows: for (let oy = 0; oy + p.dy <= Y; oy++) {
        for (let f = 0; f < filters.length; f++) {
          const r = (oz + fK[f]) * Y + oy + fJ[f];
          let s = 0;
          for (const c of fCodes[f]) {
            const rc = rows[c];
            if (rc !== undefined && rc[r] > 0) {
              s = 1;
              break;
            }
          }
          if (s === 0) continue rows;
        }
        const o0 = oy * X + oz * XY;
        const a0 = (oz + aK) * XY + (oy + aJ) * X + aI;
        if (only) {
          for (let ox = 0; ox + p.dx <= X; ox++) if (aSet[cells[a0 + ox]] && RuleRunner.fitsAt(pr, cells, o0 + ox)) this.matches.push(base + o0 + ox);
        } else for (let ox = 0; ox + p.dx <= X; ox++) if (aSet[cells[a0 + ox]] && RuleRunner.checkAt(pr, cells, o0 + ox)) this.matches.push(base + o0 + ox);
      }
  }

  /** Brings the match set up to date with every cell written since the last look. */
  protected sync(g: Grid3): void {
    const fresh = g.log.length - this.seen;
    if (this.epoch !== g.epoch || fresh > g.cells.length / 4) {
      this.scan(g);
    } else if (fresh > 0) {
      const N = g.cells.length;
      const { X, Y, Z, cells, log } = g;
      const XY = X * Y;
      if (stamps.length !== N) {
        stamps = new Uint32Array(N);
        stampN = 0;
      }
      const mark = ++stampN;
      const probes = this.patterns.map((_, pi) => this.probe(pi, g));
      const only = this.inputOnly;
      for (let l = this.seen; l < log.length; l++) {
        const c = log[l];
        if (stamps[c] === mark) continue;
        stamps[c] = mark;
        const cx = c % X;
        const cy = ((c / X) | 0) % Y;
        const cz = (c / XY) | 0;
        for (let pi = 0; pi < this.patterns.length; pi++) {
          const p = this.patterns[pi];
          const pr = probes[pi];
          const base = pi * N;
          for (let k = 0; k < p.dz; k++) {
            const oz = cz - k;
            if (oz < 0 || oz + p.dz > Z) continue;
            for (let j = 0; j < p.dy; j++) {
              const oy = cy - j;
              if (oy < 0 || oy + p.dy > Y) continue;
              for (let i = 0; i < p.dx; i++) {
                const ox = cx - i;
                if (ox < 0 || ox + p.dx > X) continue;
                const o = ox + oy * X + oz * XY;
                if (only ? RuleRunner.fitsAt(pr, cells, o) : RuleRunner.checkAt(pr, cells, o)) this.matches.add(base + o);
                else this.matches.remove(base + o);
              }
            }
          }
        }
      }
    }
    this.epoch = g.epoch;
    this.seen = g.log.length;
  }

  protected apply(g: Grid3, key: number, written?: Uint8Array, touched?: number[]): boolean {
    const N = g.cells.length;
    const pi = Math.floor(key / N);
    const p = this.patterns[pi];
    const pr = this.probe(pi, g);
    const o = key - pi * N;
    const { outOff, outVal } = pr;
    // As MarkovJunior's all: a match is skipped only if a cell it writes was already written in this
    // step; the cells it merely reads ('*' in the output) may be shared.
    if (written) {
      for (let t = 0; t < outOff.length; t++) if (written[o + outOff[t]]) return false;
      for (let t = 0; t < outOff.length; t++) {
        const idx = o + outOff[t];
        written[idx] = 1;
        touched!.push(idx);
      }
    }
    for (let t = 0; t < outOff.length; t++) write(g, o + outOff[t], outVal[t]);
    this.fired[p.rule]++;
    return true;
  }

  go(g: Grid3, rng: Rng): boolean {
    if (this.limit !== undefined && this.count >= this.limit) return false;
    this.sync(g);
    const keys = this.matches.keys;
    if (!keys.length) {
      if (!this.total && !this.why) {
        const total = censusOf(g).total;
        const absent = this.wanted.filter((w) => w !== '.' && !codesOf(this.sets[this.alpha.mask(w)]).some((c) => total[c] > 0));
        this.why = absent.length ? `in quel momento nella griglia non c'erano celle ${absent.map((w) => `"${w}"`).join(', ')}` : 'le celle cercate c\'erano, ma mai disposte come nel pattern';
      }
      return false;
    }
    const N = g.cells.length;
    if (this.kind === 'one') {
      let pick = keys[rng.int(keys.length)];
      if (!this.uniform) {
        const total = keys.reduce((s, k) => s + this.patterns[Math.floor(k / N)].p, 0);
        let r = rng.next() * total;
        pick = keys.find((k) => (r -= this.patterns[Math.floor(k / N)].p) < 0) ?? keys[keys.length - 1];
      }
      this.apply(g, pick);
    } else if (this.kind === 'all') {
      const order = [...keys];
      for (let i = order.length - 1; i > 0; i--) {
        const j = rng.int(i + 1);
        [order[i], order[j]] = [order[j], order[i]];
      }
      if (writtenBuf.length !== N) writtenBuf = new Uint8Array(N);
      const written = writtenBuf;
      const touched: number[] = [];
      for (const k of order) this.apply(g, k, written, touched);
      for (const idx of touched) written[idx] = 0;
    } else {
      // Every match is judged on the grid as it was: decide first, then write.
      const chosen = keys.filter((k) => rng.next() < this.patterns[Math.floor(k / N)].p);
      if (!chosen.length) return false;
      for (const k of chosen) this.apply(g, k);
    }
    this.count++;
    this.total++;
    return true;
  }
}

type RuleNode3 = Extract<Node3, { type: 'one' | 'all' | 'prl' }>;
interface FieldRun {
  code: number;
  zero: Uint8Array;
  on: Uint8Array;
  recompute: boolean;
  essential: boolean;
  /** The field as the program writes it, for who reads why the node stopped. */
  name: string;
}
interface ObserveRun {
  value: number;
  from: number;
  to: Uint8Array;
  name: string;
}

/**
 * A rule node that infers (T334, ADR-0173): MarkovJunior's RuleNode with fields, observations and search (RuleNode.cs, OneNode.cs,
 * AllNode.cs, ParallelNode.cs). A match is wherever the input fits. `one` takes the match with the best heuristic (with `temperature`,
 * a draw weighted by exp(-h/T)); `all` applies its matches best first where they do not overlap; `prl` only waits for its fields.
 * With observations the node stops when the grid reaches the future; with a trajectory from the search it replays it, a state a step.
 */
class GuidedRunner extends RuleRunner {
  private fields: FieldRun[] = [];
  /** Per code, 1 if its field grows from `from` (MarkovJunior's `inversed`). */
  private inversed?: Uint8Array;
  private observations?: ObserveRun[];
  /** Per code, its observation. */
  private observed: Array<ObserveRun | undefined> = [];
  private temperature: number;
  private searching: boolean;
  private searchLimit: number;
  private depthCoefficient: number;
  /** Per code its potential; undefined is 0 everywhere (a code without a field, as MarkovJunior allocates them). */
  private potentials?: Array<Int32Array | undefined>;
  /** The cells the potentials were computed for: another grid (a map in between) computes them again. */
  private potentialCells = 0;
  private future = new Uint32Array(0);
  private futureComputed = false;
  private trajectory: Uint8Array[] | null = null;
  /** Per pattern, the cells it writes with a code its own input does not accept: MarkovJunior's DeltaPointwise reads only those. */
  private deltas: Array<{ X: number; XY: number; off: Int32Array; val: Int16Array } | undefined> = [];
  private queue = new Int32Array(0);
  private prepared?: { X: number; Y: number; Z: number; C: number; rules: Prepared[]; work?: Work };

  constructor(node: RuleNode3, limit: number | undefined, sym: Sym, alpha: Alphabet) {
    super(node.type, node.rules, limit, sym, alpha, node.type !== 'prl');
    const set = (s: unknown, what: string): Uint8Array => {
      if (typeof s !== 'string' || !s) throw new Mj3Error(`${what}: vuole delle lettere`);
      return alpha.sets[alpha.mask(s)];
    };
    const code = (s: unknown, what: string): number => {
      if (typeof s !== 'string' || s.length !== 1) throw new Mj3Error(`${what}: è una sola lettera`);
      return alpha.index(s);
    };
    const byCode = new Map<number, FieldRun & { inversed: boolean }>();
    for (const f of node.fields ?? []) {
      const c = code(f?.for, 'field "for"');
      const inversed = typeof f.from === 'string' && f.from !== '';
      if (!inversed && (typeof f.to !== 'string' || !f.to)) throw new Mj3Error(`field per "${f.for}": manca "to" (o "from")`);
      byCode.set(c, {
        code: c,
        zero: set(inversed ? f.from : f.to, `field per "${f.for}"`),
        on: set(f.on, `field per "${f.for}", "on"`),
        recompute: f.recompute === true,
        essential: f.essential === true,
        inversed,
        name: `${f.for} ${inversed ? 'da' : 'verso'} ${inversed ? f.from : f.to} su ${f.on}`,
      });
    }
    this.fields = [...byCode.values()];
    if (this.fields.length) {
      this.inversed = new Uint8Array(MAX_CODES);
      for (const f of byCode.values()) if (f.inversed) this.inversed[f.code] = 1;
    }
    if (node.observe?.length) {
      for (const o of node.observe) {
        const value = code(o?.value, 'observe "value"');
        this.observed[value] = { value, from: o.from === undefined ? value : code(o.from, 'observe "from"'), to: set(o.to, `observe "${o.value}", "to"`), name: o.value };
      }
      this.observations = this.observed.filter((o): o is ObserveRun => o !== undefined);
    }
    const t = node.temperature ?? 0;
    if (typeof t !== 'number' || !Number.isFinite(t) || t < 0) throw new Mj3Error('temperature vuole un numero da 0 in su');
    this.temperature = t;
    this.searching = node.search === true && this.observations !== undefined;
    this.searchLimit = Number.isInteger(node.limit) && node.limit! > 0 ? node.limit! : -1;
    const dc = node.depthCoefficient ?? 0.5;
    if (typeof dc !== 'number' || !Number.isFinite(dc)) throw new Mj3Error('depthCoefficient vuole un numero');
    this.depthCoefficient = dc;
  }

  reset(): void {
    super.reset();
    this.futureComputed = false;
    this.trajectory = null;
  }

  rewind(): void {
    super.rewind();
    this.futureComputed = false;
    this.trajectory = null;
  }

  /** Potentials for the codes with a field, or for every code (`all`); within the ceiling of bytes. */
  private potentialsFor(N: number, all: boolean): Array<Int32Array | undefined> {
    const C = this.alpha.codes.length;
    if (!this.potentials || this.potentials.length !== C) this.potentials = new Array<Int32Array | undefined>(C);
    const pot = this.potentials;
    const want = all ? C : this.fields.length;
    if (want * N * 4 > INFERENCE_LIMITS.potentialBytes) throw new Mj3Error(`i potenziali di ${want} valori su ${N} celle superano ${INFERENCE_LIMITS.potentialBytes >> 20} MB`);
    for (let c = 0; c < C; c++) {
      if ((all || this.fields.some((f) => f.code === c)) && pot[c]?.length !== N) pot[c] = new Int32Array(N);
      else if (pot[c] && pot[c]!.length !== N) pot[c] = undefined;
    }
    this.potentialCells = N;
    return pot;
  }

  /**
   * The rules ready for propagation on this grid, within the ceiling of bytes: the potentials of every code, the queue of the propagation
   * and a bit per rule and cell, once more for a search (its potentials forwards and backwards). The buffers of the node's own propagation
   * only if it propagates (`work`): a search has its own.
   */
  private rulesFor(g: Grid3, searching: boolean): { rules: Prepared[]; work?: Work } {
    const C = this.alpha.codes.length;
    const { X, Y, Z } = g;
    const N = X * Y * Z;
    let p = this.prepared;
    if (!p || p.X !== X || p.Y !== Y || p.Z !== Z || p.C !== C) {
      const rules = prepare(this.patterns.map((pt): InferRule => ({ dx: pt.dx, dy: pt.dy, dz: pt.dz, input: Array.from(pt.input, (id) => (id === -1 ? undefined : this.sets[id])), output: pt.output })), C, X, Y, Z);
      const bytes = C * N * 4 * (searching ? 3 : 2) + (rules.length * N) / 8;
      if (bytes > INFERENCE_LIMITS.potentialBytes) throw new Mj3Error(`observe: ${C} valori su ${N} celle con ${rules.length} varianti di regole superano ${INFERENCE_LIMITS.potentialBytes >> 20} MB`);
      p = this.prepared = { X, Y, Z, C, rules };
    }
    if (!searching) p.work ??= makeWork(C, N, p.rules.length);
    return p;
  }

  /**
   * MarkovJunior's ComputeFutureSetPresent: every observed cell becomes its `from` and its future is `to`, every other cell's future is
   * itself. False if an observed code is not on the grid (the cells are changed anyway, as there).
   */
  private observe(g: Grid3): boolean {
    const C = this.alpha.codes.length;
    if (C > MAX_OBSERVED_CODES) throw new Mj3Error(`observe: la griglia ha ${C} valori, al più ${MAX_OBSERVED_CODES}`);
    const N = g.cells.length;
    if (this.future.length !== N) this.future = new Uint32Array(N);
    const future = this.future;
    const toMask = new Uint32Array(C);
    for (let c = 0; c < C; c++) {
      const o = this.observed[c];
      if (!o) continue;
      let m = 0;
      for (let k = 0; k < C; k++) if (o.to[k]) m |= 1 << k;
      toMask[c] = m >>> 0;
    }
    const present = new Uint8Array(C);
    const cells = g.cells;
    for (let i = 0; i < N; i++) {
      const v = cells[i];
      present[v] = 1;
      const o = this.observed[v];
      if (o) {
        future[i] = toMask[v];
        if (o.from !== v) write(g, i, o.from);
      } else future[i] = (1 << v) >>> 0;
    }
    const missing = this.observations!.filter((o) => !present[o.value]);
    if (missing.length) {
      if (!this.total) this.why ??= `i valori osservati ${missing.map((o) => `"${o.name}"`).join(', ')} non erano nella griglia`;
      return false;
    }
    return true;
  }

  /** The trajectory of the search (MarkovJunior: one try without `limit`, twenty with it), or null. Out of time, the run stops. */
  private searchFrom(g: Grid3, rng: Rng): Uint8Array[] | null {
    const C = this.alpha.codes.length;
    const { X, Y, Z } = g;
    const { rules } = this.rulesFor(g, true);
    const until = Math.min(Date.now() + INFERENCE_LIMITS.searchMs, current?.deadline ?? Infinity);
    const tries = this.searchLimit < 0 ? 1 : 20;
    let boards = 0;
    let why = '';
    for (let k = 0; k < tries; k++) {
      const seed = rng.int(0x7fffffff);
      const out = search(new Uint8Array(g.cells), this.future, rules, X, Y, Z, C, this.kind === 'all', {
        boards: Math.min(this.searchLimit < 0 ? Infinity : this.searchLimit, INFERENCE_LIMITS.boards),
        bytes: INFERENCE_LIMITS.boardBytes,
        children: INFERENCE_LIMITS.children,
        until,
      }, this.depthCoefficient, seed);
      boards += out.boards;
      if (out.late) {
        this.note = `ricerca interrotta dal tempo dopo ${boards} stati`;
        throw new Mj3Late();
      }
      if (out.trajectory) {
        this.note = `ricerca: traiettoria di ${out.trajectory.length} passi, ${boards} stati`;
        return out.trajectory;
      }
      why = out.why ?? '';
    }
    this.note = `ricerca senza traiettoria: ${why}${tries > 1 ? ` (${tries} tentativi, ${boards} stati)` : ''}`;
    if (!this.total) this.why ??= this.note;
    return null;
  }

  /** MarkovJunior's DeltaPointwise: how much the match lowers (negative) or raises the potentials of what it writes; null where one is -1. */
  private heuristic(g: Grid3, key: number): number | null {
    const N = g.cells.length;
    const pi = Math.floor(key / N);
    const o = key - pi * N;
    const XY = g.X * g.Y;
    let d = this.deltas[pi];
    if (!d || d.X !== g.X || d.XY !== XY) {
      const p = this.patterns[pi];
      const off: number[] = [];
      const val: number[] = [];
      for (let k = 0, n = 0; k < p.dz; k++)
        for (let j = 0; j < p.dy; j++)
          for (let i = 0; i < p.dx; i++, n++) {
            const v = p.output[n];
            if (v === -1 || p.input[n] === -1 || this.sets[p.input[n]][v]) continue;
            off.push(i + j * g.X + k * XY);
            val.push(v);
          }
      d = this.deltas[pi] = { X: g.X, XY, off: Int32Array.from(off), val: Int16Array.from(val) };
    }
    const pot = this.potentials!;
    const inv = this.inversed;
    const cells = g.cells;
    let sum = 0;
    for (let t = 0; t < d.off.length; t++) {
      const i = o + d.off[t];
      const v = d.val[t];
      const pv = pot[v];
      const now = pv ? pv[i] : 0;
      if (now === -1) return null;
      const old = cells[i];
      const po = pot[old];
      const was = po ? po[i] : 0;
      sum += now - was;
      if (inv) {
        if (inv[old]) sum += 2 * was;
        if (inv[v]) sum -= 2 * now;
      }
    }
    return sum;
  }

  /**
   * Every match with a heuristic, and its key: at temperature 0 the lowest heuristic wins (a thousandth of a draw breaks ties); above,
   * u^exp((h - h₀)/T), whose largest falls on a match with probability ∝ exp(-h/T) (OneNode.RandomMatch, AllNode.Go).
   */
  private scored(g: Grid3, rng: Rng): Array<[number, number]> {
    const out: Array<[number, number]> = [];
    const T = this.temperature;
    let first = 0;
    let have = false;
    for (const k of this.matches.keys) {
      const h = this.heuristic(g, k);
      if (h === null) continue;
      if (!have) {
        first = h;
        have = true;
      }
      const u = rng.next();
      out.push([k, T > 0 ? Math.pow(u, Math.exp((h - first) / T)) : -h + 0.001 * u]);
    }
    return out;
  }

  go(g: Grid3, rng: Rng): boolean {
    if (this.limit !== undefined && this.count >= this.limit) return false;
    const N = g.cells.length;
    if (this.observations && this.futureComputed && this.future.length !== N) this.futureComputed = false;
    if (this.observations && !this.futureComputed) {
      if (!this.observe(g)) return false;
      this.futureComputed = true;
      // A prl replays no trajectory and reads no potential (ParallelNode): only the cells the observations changed count.
      if (this.kind !== 'prl') {
        if (this.searching) this.trajectory = this.searchFrom(g, rng);
        else {
          const { rules, work } = this.rulesFor(g, false);
          backwardPotentials(this.potentialsFor(N, true) as Int32Array[], this.future, g.X, g.Y, g.Z, rules, work!);
        }
      }
    }
    this.sync(g);
    if (this.fields.length) {
      const fresh = this.count === 0 || this.potentialCells !== N;
      const pot = this.potentialsFor(N, this.observations !== undefined && !this.searching && this.kind !== 'prl');
      if (this.queue.length < N) this.queue = new Int32Array(N);
      let computed = false;
      let any = false;
      for (const f of this.fields) {
        if (!fresh && !f.recompute) continue;
        const ok = fieldPotential(pot[f.code]!, g.cells, g.X, g.Y, g.Z, f.zero, f.on, this.queue);
        if (!ok && f.essential) {
          if (!this.total) this.why ??= `il campo essenziale ${f.name} non aveva da dove partire`;
          return false;
        }
        any ||= ok;
        computed = true;
      }
      if (computed && !any) {
        if (!this.total) this.why ??= `nessun campo aveva da dove partire (${this.fields.map((f) => f.name).join('; ')})`;
        return false;
      }
    }
    if (this.kind === 'prl') return super.go(g, rng);
    if (this.trajectory) {
      if (this.count >= this.trajectory.length) return false;
      const next = this.trajectory[this.count];
      for (let i = 0; i < N; i++) if (g.cells[i] !== next[i]) write(g, i, next[i]);
      this.count++;
      this.total++;
      return true;
    }
    const keys = this.matches.keys;
    const guided = this.fields.length > 0 || (this.observations !== undefined && !this.searching);
    const astray = 'le regole combaciavano, ma ogni applicazione portava dove un potenziale è -1';
    const absent = 'le celle cercate non c\'erano mai disposte come nel pattern';
    if (this.kind === 'one') {
      let pick = -1;
      if (guided) {
        if (this.observations && goalReached(g.cells, this.future)) {
          this.futureComputed = false;
          return false;
        }
        let best = -Infinity;
        for (const [k, key] of this.scored(g, rng))
          if (key > best) {
            best = key;
            pick = k;
          }
      } else if (keys.length) pick = keys[rng.int(keys.length)];
      if (pick < 0) {
        if (!this.total) this.why ??= keys.length ? astray : absent;
        return false;
      }
      this.apply(g, pick);
    } else {
      if (!keys.length) {
        if (!this.total) this.why ??= absent;
        return false;
      }
      let order: number[];
      if (guided) {
        const list = this.scored(g, rng);
        // Stable, as LINQ's OrderBy: equal keys keep the order of the matches.
        list.sort((a, b) => b[1] - a[1]);
        order = list.map((e) => e[0]);
      } else {
        order = [...keys];
        for (let i = order.length - 1; i > 0; i--) {
          const j = rng.int(i + 1);
          [order[i], order[j]] = [order[j], order[i]];
        }
      }
      if (writtenBuf.length !== N) writtenBuf = new Uint8Array(N);
      const touched: number[] = [];
      let any = false;
      for (const k of order) any = this.apply(g, k, writtenBuf, touched) || any;
      for (const idx of touched) writtenBuf[idx] = 0;
      // MarkovJunior counts a step that applied nothing and stops at the next; here the matches would be the same: it stops now.
      if (!any) {
        if (!this.total) this.why ??= astray;
        return false;
      }
    }
    this.count++;
    this.total++;
    return true;
  }
}

const MOORE: Vec3[] = [];
for (let z = -1; z <= 1; z++) for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) if (x || y || z) MOORE.push([x, y, z]);
const VON_NEUMANN: Vec3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
/** MarkovJunior's 3D "NoCorners": the 18 neighbours that share a face or an edge. */
const NO_CORNERS: Vec3[] = MOORE.filter(([x, y, z]) => Math.abs(x) + Math.abs(y) + Math.abs(z) < 3);
/** Unlimited steps (MarkovJunior: until nothing changes) still stop here, so a flickering automaton ends. */
const CONV_UNLIMITED = 200;

class ConvRunner extends Runner {
  private rules: Array<{ i: number; input: number; output: number; neighbors: number; sums: Uint8Array; p: number }>;
  private offsets: Vec3[];
  private sets: Uint8Array[];
  private periodic: boolean;
  constructor(node: { rules: ConvRule[]; neighborhood?: string; steps?: number; periodic?: boolean }, alpha: Alphabet) {
    super(node.steps === Infinity ? CONV_UNLIMITED : Math.max(1, Math.min(30, node.steps ?? 1)));
    if (!Array.isArray(node.rules) || !node.rules.length) throw new Mj3Error('nodo conv senza regole');
    this.offsets = node.neighborhood === 'vonneumann' ? VON_NEUMANN : node.neighborhood === 'nocorners' ? NO_CORNERS : MOORE;
    this.periodic = node.periodic === true;
    this.sets = alpha.sets;
    this.fired = node.rules.map(() => 0);
    this.rules = node.rules.map((r, i) => {
      if (typeof r?.in !== 'string' || typeof r?.out !== 'string' || typeof r?.neighbors !== 'string') throw new Mj3Error('conv: ogni regola vuole in, out e neighbors');
      if (r.out.length !== 1) throw new Mj3Error(`conv: "out" è un solo codice (${r.out})`);
      const sums = new Uint8Array(27);
      if (Array.isArray(r.sums)) {
        for (const n of r.sums) if (Number.isInteger(n) && n >= 0 && n <= 26) sums[n] = 1;
      } else {
        const min = Number.isFinite(r.min) ? r.min! : 1;
        const max = Number.isFinite(r.max) ? r.max! : 26;
        for (let n = Math.max(0, min); n <= Math.min(26, max); n++) sums[n] = 1;
      }
      return { i, input: alpha.mask(r.in), output: alpha.index(r.out), neighbors: alpha.mask(r.neighbors), sums, p: typeof r.p === 'number' ? r.p : 1 };
    });
  }
  go(g: Grid3, rng: Rng): boolean {
    if (this.count >= this.limit!) return false;
    const changes: number[] = [];
    const { X, Y, Z, cells } = g;
    const XY = X * Y;
    const wrap = (v: number, n: number) => (v < 0 ? v + n : v >= n ? v - n : v);
    // A cell no rule takes as input draws no random number and changes nothing: rows without one are skipped (the same run).
    const census = censusOf(g);
    const inputs = [...new Set(this.rules.flatMap((r) => [...codesOf(this.sets[r.input])]))].filter((c) => census.rows[c] !== undefined && census.total[c] > 0);
    const rowsOf = inputs.map((c) => census.rows[c]!);
    const offs = this.offsets;
    const ox = Int32Array.from(offs, (o) => o[0]), oy = Int32Array.from(offs, (o) => o[1]), oz = Int32Array.from(offs, (o) => o[2]);
    const nOff = offs.length;
    for (let z = 0; z < Z; z++)
      rows: for (let y = 0; y < Y; y++) {
        const r = z * Y + y;
        let any = false;
        for (let t = 0; t < rowsOf.length; t++)
          if (rowsOf[t][r] > 0) {
            any = true;
            break;
          }
        if (!any) continue rows;
        for (let x = 0; x < X; x++) {
          const idx = x + y * X + z * XY;
          const c = cells[idx];
          // As in MarkovJunior: the first rule whose input, chance and neighbour count all agree.
          for (const rule of this.rules) {
            if (!this.sets[rule.input][c] || rule.output === c || (rule.p < 1 && rng.next() >= rule.p)) continue;
            const nb = this.sets[rule.neighbors];
            let n = 0;
            for (let t = 0; t < nOff; t++) {
              let nx = x + ox[t], ny = y + oy[t], nz = z + oz[t];
              if (this.periodic) {
                nx = wrap(nx, X);
                ny = wrap(ny, Y);
                nz = wrap(nz, Z);
              } else if (nx < 0 || ny < 0 || nz < 0 || nx >= X || ny >= Y || nz >= Z) continue;
              if (nb[cells[nx + ny * X + nz * XY]]) n++;
            }
            if (!rule.sums[n]) continue;
            changes.push(idx, rule.output);
            this.fired[rule.i]++;
            break;
          }
        }
      }
    if (!changes.length) return false;
    for (let i = 0; i < changes.length; i += 2) write(g, changes[i], changes[i + 1]);
    this.count++;
    this.total++;
    return true;
  }
}

/**
 * Like MarkovJunior's path: a distance field grows from every `to` cell over `on` cells, then the path
 * walks down it from a `from` cell (a random one, or the farthest with `longest`), choosing at random
 * between equally good steps, or the one that keeps its direction with `inertia`.
 */
class PathRunner extends Runner {
  private from: number;
  private to: number;
  private on: number;
  private color: number;
  private sets: Uint8Array[];
  private inertia: boolean;
  private longest: boolean;
  constructor(node: { from: string; to: string; on: string; color: string; steps?: number; inertia?: boolean; longest?: boolean }, alpha: Alphabet) {
    super(node.steps ?? 1);
    for (const k of ['from', 'to', 'on', 'color'] as const) if (typeof node[k] !== 'string' || !node[k]) throw new Mj3Error(`path: manca "${k}"`);
    if (node.color.length !== 1) throw new Mj3Error('path: "color" è un solo codice');
    this.from = alpha.mask(node.from);
    this.to = alpha.mask(node.to);
    this.on = alpha.mask(node.on);
    this.color = alpha.index(node.color);
    this.sets = alpha.sets;
    this.inertia = node.inertia === true;
    this.longest = node.longest === true;
  }
  /**
   * Without an array per cell (T315): the same walk as before, the neighbours in the order of VON_NEUMANN and the same draws, so the
   * same grid voxel for voxel (tests/mj-path.test.ts); a maze of the site's page solved in a fraction of the time, even before the JIT.
   */
  go(g: Grid3, rng: Rng): boolean {
    if (this.limit !== undefined && this.count >= this.limit) return false;
    const { X, Y, Z, cells } = g;
    const N = cells.length;
    const XY = X * Y;
    const to = this.sets[this.to];
    const on = this.sets[this.on];
    const from = this.sets[this.from];
    const dist = new Int32Array(N).fill(-1);
    const queue = new Int32Array(N);
    let tail = 0;
    for (let i = 0; i < N; i++)
      if (to[cells[i]] === 1) {
        dist[i] = 0;
        queue[tail++] = i;
      }
    if (!tail) {
      if (!this.total) this.why ??= 'in quel momento non c\'era nessuna cella di arrivo ("to")';
      return false;
    }
    // The neighbours of a cell inside the grid, in the order of VON_NEUMANN: written into `around`, how many.
    const around = new Int32Array(6);
    const near = (c: number): number => {
      const x = c % X;
      const y = ((c / X) | 0) % Y;
      const z = (c / XY) | 0;
      let k = 0;
      if (x + 1 < X) around[k++] = c + 1;
      if (x > 0) around[k++] = c - 1;
      if (y + 1 < Y) around[k++] = c + X;
      if (y > 0) around[k++] = c - X;
      if (z + 1 < Z) around[k++] = c + XY;
      if (z > 0) around[k++] = c - XY;
      return k;
    };
    for (let q = 0; q < tail; q++) {
      const c = queue[q];
      const k = near(c);
      for (let t = 0; t < k; t++) {
        const n = around[t];
        if (dist[n] < 0 && on[cells[n]] === 1) {
          dist[n] = dist[c] + 1;
          queue[tail++] = n;
        }
      }
    }
    // Starts: `from` cells next to the field (a start is not walked over, so it needs no "on"); a cell and its distance, in pairs.
    let best = -1;
    const starts: number[] = [];
    for (let i = 0; i < N; i++) {
      if (from[cells[i]] !== 1 || dist[i] === 0) continue;
      let d = -1;
      const k = near(i);
      for (let t = 0; t < k; t++) {
        const n = dist[around[t]];
        if (n >= 0 && (d < 0 || n < d)) d = n;
      }
      if (d < 0) continue;
      starts.push(i, d);
      if (d > best) best = d;
    }
    if (!starts.length) {
      if (!this.total) this.why ??= codesOf(this.sets[this.from]).some((c) => censusOf(g).total[c] > 0) ? 'le celle di partenza ("from") c\'erano, ma nessuna toccava una cella "on" collegata all\'arrivo' : 'in quel momento non c\'era nessuna cella di partenza ("from")';
      return false;
    }
    let start = -1;
    if (this.longest) {
      let pool = 0;
      for (let s = 1; s < starts.length; s += 2) if (starts[s] === best) pool++;
      let pick = rng.int(pool);
      for (let s = 1; s < starts.length; s += 2)
        if (starts[s] === best && pick-- === 0) {
          start = starts[s - 1];
          break;
        }
    } else start = starts[2 * rng.int(starts.length / 2)];
    let cur = start;
    let dir = 0;
    let changed = false;
    for (let guard = 0; guard < N; guard++) {
      const k = near(cur);
      let low = -1;
      for (let t = 0; t < k; t++) {
        const d = dist[around[t]];
        if (d >= 0 && (low < 0 || d < low)) low = d;
      }
      if (low < 0) break;
      if (cur !== start && low >= dist[cur]) break;
      // The neighbours at the lowest distance, in order: the one straight ahead if it is one of them, else one drawn among them.
      let ok = 0;
      let next = -1;
      for (let t = 0; t < k; t++) {
        const n = around[t];
        if (dist[n] !== low) continue;
        ok++;
        if (this.inertia && next < 0 && n - cur === dir) next = n;
      }
      if (next < 0) {
        let pick = rng.int(ok);
        for (let t = 0; t < k; t++)
          if (dist[around[t]] === low && pick-- === 0) {
            next = around[t];
            break;
          }
      }
      dir = next - cur;
      if (dist[next] === 0) break;
      changed = write(g, next, this.color) || changed;
      cur = next;
    }
    if (!changed) return false;
    this.count++;
    this.total++;
    return true;
  }
}

/** Scales the grid (see the header): the program goes on at the new resolution. */
class MapRunner extends Runner {
  private scale: Vec3;
  /** The denominators of the factors (T335): 1 unless the scale is a fraction. */
  private divide: Vec3;
  private rules: Array<{ d: Vec3; D: Vec3; input: Int32Array; output: Int16Array }>;
  private sets: Uint8Array[];
  /** MarkovJunior's map: the new grid starts empty and only the rules write it (wrapping round the edges). */
  private clear: boolean;
  constructor(node: { scale: Vec3; divide?: Vec3; rules?: Rule3[]; symmetry?: Sym; clear?: boolean }, alpha: Alphabet, private limits: GridLimits) {
    super(1);
    if (!isVec(node.scale) || node.scale.some((v) => !Number.isInteger(v) || v < 1 || v > 32)) throw new Mj3Error('map: "scale" vuole tre interi tra 1 e 32');
    const divide = node.divide ?? [1, 1, 1];
    if (!isVec(divide) || divide.some((v) => !Number.isInteger(v) || v < 1 || v > 32)) throw new Mj3Error('map: i denominatori di "scale" sono interi tra 1 e 32');
    this.scale = node.scale;
    this.divide = divide;
    this.sets = alpha.sets;
    this.clear = node.clear === true;
    if (!this.clear && divide.some((v) => v !== 1)) throw new Mj3Error('map: una scala frazionaria vale solo con la griglia nuova vuota (clear)');
    this.rules = (node.rules ?? []).flatMap((r) => {
      const li = layersOf(String(r?.in ?? ''));
      const lo = layersOf(String(r?.out ?? ''));
      const d: Vec3 = [li[0]?.[0]?.length ?? 0, li[0]?.length ?? 0, li.length];
      const D: Vec3 = this.clear ? [lo[0]?.[0]?.length ?? 0, lo[0]?.length ?? 0, lo.length] : [d[0] * this.scale[0], d[1] * this.scale[1], d[2] * this.scale[2]];
      const shaped = (ls: string[][][], s: Vec3) => ls.length === s[2] && ls.every((l) => l.length === s[1] && l.every((row) => row.length === s[0]));
      if (!d[0] || !shaped(li, d)) throw new Mj3Error(`map: ingresso irregolare "${r?.in}"`);
      if (!D[0] || !shaped(lo, D)) throw new Mj3Error(this.clear ? `map: uscita irregolare "${r?.out}"` : `map: l'uscita di "${r.in}" deve essere grande ${D.join('×')} (l'ingresso per la scala)`);
      if (D[0] * D[1] * D[2] > 4096) throw new Mj3Error(`map: uscita troppo grande (max 4096 celle): ${r.in}`);
      const input = Int32Array.from(li.flat(2), (a) => (a === '*' ? -1 : alpha.mask(a.startsWith('[') ? a.slice(1, -1) : a)));
      const output = Int16Array.from(lo.flat(2), (b) => {
        if (b.startsWith('[')) throw new Mj3Error(`"[..]" non è ammesso in un'uscita: ${r.out}`);
        return b === '*' ? -1 : alpha.index(b);
      });
      // Every turn of the rule (in and out turned alike), without duplicates.
      const seen = new Set<string>();
      return symmetries(node.symmetry ?? 'xy').flatMap(({ perm, flip }) => {
        const [ti, nd] = turnCells(input, d, perm, flip);
        const [to, nD] = turnCells(output, D, perm, flip);
        const key = `${nd.join(',')}|${nD.join(',')}|${ti.join(',')}|${to.join(',')}`;
        if (seen.has(key)) return [];
        seen.add(key);
        return [{ d: nd, D: nD, input: ti, output: to }];
      });
    });
  }
  go(g: Grid3): boolean {
    if (this.count >= 1) return false;
    this.count++;
    this.total++;
    const [sx, sy, sz] = this.scale;
    const [qx, qy, qz] = this.divide;
    // MarkovJunior's integer division: M·N/D cells, a cell x of the old grid at x·N/D.
    const X = Math.floor((g.X * sx) / qx), Y = Math.floor((g.Y * sy) / qy), Z = Math.floor((g.Z * sz) / qz);
    if (Math.max(X, Y, Z) > this.limits.side || X * Y * Z > this.limits.cells) throw new Mj3Error(`map: la griglia scalata (${X}×${Y}×${Z}) supera i limiti`);
    if (Math.min(X, Y, Z) < 1) throw new Mj3Error(`map: la griglia scalata (${X}×${Y}×${Z}) è vuota`);
    const old = g.cells;
    const cells = new Uint8Array(X * Y * Z);
    if (!this.clear)
      for (let z = 0; z < Z; z++)
        for (let y = 0; y < Y; y++)
          for (let x = 0; x < X; x++) cells[x + y * X + z * X * Y] = old[Math.floor(x / sx) + Math.floor(y / sy) * g.X + Math.floor(z / sz) * g.X * g.Y];
    // Without `clear` rules stay inside the grid; with it they wrap round, as MarkovJunior's map does.
    const wrap = this.clear;
    for (const r of this.rules) {
      const [dx, dy, dz] = r.d;
      const [DX, DY] = r.D;
      for (let oz = 0; oz + (wrap ? 1 : dz) <= g.Z; oz++)
        for (let oy = 0; oy + (wrap ? 1 : dy) <= g.Y; oy++)
          for (let ox = 0; ox + (wrap ? 1 : dx) <= g.X; ox++) {
            let ok = true;
            for (let n = 0; n < r.input.length && ok; n++) {
              const want = r.input[n];
              if (want === -1) continue;
              const i = n % dx, j = Math.floor(n / dx) % dy, k = Math.floor(n / (dx * dy));
              ok = this.sets[want][old[((ox + i) % g.X) + ((oy + j) % g.Y) * g.X + ((oz + k) % g.Z) * g.X * g.Y]] === 1;
            }
            if (!ok) continue;
            for (let n = 0; n < r.output.length; n++) {
              const put = r.output[n];
              if (put === -1) continue;
              const i = n % DX, j = Math.floor(n / DX) % DY, k = Math.floor(n / (DX * DY));
              const x = Math.floor((ox * sx) / qx) + i, y = Math.floor((oy * sy) / qy) + j, z = Math.floor((oz * sz) / qz) + k;
              if (!wrap && (x >= X || y >= Y || z >= Z)) continue;
              cells[(x % X) + (y % Y) * X + (z % Z) * X * Y] = put;
            }
          }
    }
    g.X = X;
    g.Y = Y;
    g.Z = Z;
    g.cells = cells;
    g.log.length = 0;
    g.epoch++;
    return true;
  }
}

/** The grid becomes another one, as a map makes it: nodes that follow scan it again. */
function replaceGrid(g: Grid3, X: number, Y: number, Z: number, cells: Uint8Array): void {
  g.X = X;
  g.Y = Y;
  g.Z = Z;
  g.cells = cells;
  g.log.length = 0;
  g.epoch++;
}

const isInt = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

/**
 * MarkovJunior's <wfc> (T335, ADR-0174): in one step the wave of the grid is observed (wfc.ts: up to `tries` seeds, the first without a
 * contradiction) and the grid becomes what its patterns write. A wave without a solution does nothing and the grid stays; out of time
 * the run stops, not finished. Deterministic: the seeds of the tries come from the run's generator.
 */
class WfcRunner extends Runner {
  private patterns: Uint8Array[];
  private allowed = new Map<number, Uint8Array>();
  private P: number;
  constructor(private node: WfcNode, alpha: Alphabet, private limits: GridLimits) {
    super(1);
    const n = node;
    if (n.model !== 'tile' && n.model !== 'overlap') throw new Mj3Error('wfc: modello sconosciuto');
    if (!isVec(n.dims) || n.dims.some((v) => !isInt(v, 1, 64))) throw new Mj3Error('wfc: le misure di una tessera sono tre interi tra 1 e 64');
    const cells = n.dims[0] * n.dims[1] * n.dims[2];
    const P = (this.P = Array.isArray(n.patterns) ? n.patterns.length : 0);
    if (!P || P > WFC_LIMITS.patterns) throw new Mj3Error(`wfc: da 1 a ${WFC_LIMITS.patterns} motivi`);
    if (!Array.isArray(n.weights) || n.weights.length !== P || n.weights.some((w) => typeof w !== 'number' || !Number.isFinite(w) || w <= 0)) throw new Mj3Error('wfc: un peso positivo per motivo');
    const D = n.model === 'tile' ? 6 : 4;
    if (!Array.isArray(n.propagator) || n.propagator.length !== D) throw new Mj3Error(`wfc: ${D} direzioni di vicini`);
    let entries = 0;
    for (const d of n.propagator) {
      if (!Array.isArray(d) || d.length !== P) throw new Mj3Error('wfc: i vicini di ogni motivo');
      for (const list of d) {
        if (!Array.isArray(list) || list.some((t) => !isInt(t, 0, P - 1))) throw new Mj3Error('wfc: un vicino che non è un motivo');
        entries += list.length;
      }
    }
    if (entries > WFC_LIMITS.propagator) throw new Mj3Error(`wfc: troppi vicini (al più ${WFC_LIMITS.propagator})`);
    this.patterns = n.patterns.map((p) => {
      const cs = typeof p === 'string' ? [...p] : [];
      if (cs.length !== cells) throw new Mj3Error(`wfc: un motivo non è grande ${n.dims.join('×')}`);
      return Uint8Array.from(cs, (ch) => (ch === AIR ? 0 : alpha.index(ch)));
    });
    for (const [ch, list] of Object.entries(n.map ?? {})) {
      if (ch.length !== 1 || !Array.isArray(list) || list.some((t) => !isInt(t, 0, P - 1))) throw new Mj3Error('wfc: una regola vuole una lettera e dei motivi');
      const mask = new Uint8Array(P);
      for (const t of list) mask[t] = 1;
      this.allowed.set(ch === AIR ? 0 : alpha.index(ch), mask);
    }
    if (n.overlap !== undefined && (!isVec(n.overlap) || n.overlap.some((v, a) => !isInt(v, -64, n.dims[a] - 1)))) throw new Mj3Error('wfc: overlap va da -64 a una cella meno della tessera');
    if (n.tries !== undefined && !isInt(n.tries, 1, WFC_LIMITS.tries)) throw new Mj3Error(`wfc: tries va da 1 a ${WFC_LIMITS.tries}`);
  }

  go(g: Grid3, rng: Rng): boolean {
    if (this.count >= 1) return false;
    const n = this.node;
    const tile = n.model === 'tile';
    if (!tile && g.Z !== 1) throw new Mj3Error('wfc a sovrapposizione (sample): solo su una griglia piana, alta un voxel, come nell\'originale');
    const [S, SY, SZ] = n.dims;
    const [ox, oy, oz] = n.overlap ?? [0, 0, 0];
    const X = tile ? (S - ox) * g.X + ox : g.X, Y = tile ? (SY - oy) * g.Y + oy : g.Y, Z = tile ? (SZ - oz) * g.Z + oz : g.Z;
    if (Math.min(X, Y, Z) < 1 || Math.max(X, Y, Z) > this.limits.side || X * Y * Z > this.limits.cells) throw new Mj3Error(`wfc: la griglia nuova (${X}×${Y}×${Z}) supera i limiti`);
    const D = n.propagator.length;
    const bytes = waveBytes(g.cells.length, this.P, D, n.shannon === true);
    if (bytes > WFC_LIMITS.waveBytes) throw new Mj3Error(`wfc: l'onda è troppo grande (${Math.round(bytes / 2 ** 20)} MB, al più ${WFC_LIMITS.waveBytes / 2 ** 20}): meno celle o meno motivi`);
    const solver = new WfcSolver({ MX: g.X, MY: g.Y, MZ: g.Z, weights: n.weights, propagator: n.propagator, periodic: !tile || n.periodic === true, shannon: n.shannon === true });
    for (let i = 0; i < g.cells.length; i++) {
      const mask = this.allowed.get(g.cells[i]);
      if (mask) for (let t = 0; t < this.P; t++) if (!mask[t] && solver.allows(i, t)) solver.ban(i, t);
    }
    const until = Math.min(Date.now() + WFC_LIMITS.ms, current?.deadline ?? Infinity);
    const out = solver.solve(rng, n.tries ?? WFC_LIMITS.tries, until);
    if (out.late) {
      this.note = `wfc interrotta dal tempo al tentativo ${out.tries}`;
      throw new Mj3Late();
    }
    if (!out.observed) {
      this.note = `wfc senza soluzione: ${out.why}`;
      if (!this.total) this.why ??= this.note;
      return false;
    }
    this.count++;
    this.total++;
    this.note = `wfc: ${this.P} motivi, trovata al tentativo ${out.tries + 1} con ${out.observations} osservazioni`;
    const cells = new Uint8Array(X * Y * Z);
    const MX = g.X, MY = g.Y;
    if (tile) {
      // Every cell writes its tile, in order: where tiles overlap the later one stays (TileModel.UpdateState).
      for (let z = 0; z < g.Z; z++)
        for (let y = 0; y < MY; y++)
          for (let x = 0; x < MX; x++) {
            const p = this.patterns[out.observed[x + y * MX + z * MX * MY]];
            for (let dz = 0, di = 0; dz < SZ; dz++)
              for (let dy = 0; dy < SY; dy++)
                for (let dx = 0; dx < S; dx++, di++) cells[x * (S - ox) + dx + (y * (SY - oy) + dy) * X + (z * (SZ - oz) + dz) * X * Y] = p[di];
          }
    } else for (let i = 0; i < cells.length; i++) cells[i] = this.patterns[out.observed[i]][0];
    replaceGrid(g, X, Y, Z, cells);
    return true;
  }
}

/** MarkovJunior's <convchain> (T335): see `ConvChainNode`. Only on a flat grid, as the original. */
class ConvChainRunner extends Runner {
  private weights: Float64Array;
  private N: number;
  private temperature: number;
  private c0: number;
  private c1: number;
  private on: number;
  private substrate?: Uint8Array;
  private counter = 0;
  constructor(node: ConvChainNode, alpha: Alphabet) {
    super(node.steps);
    if (!Array.isArray(node.sampleSize) || node.sampleSize.length !== 2 || node.sampleSize.some((v) => !isInt(v, 1, 1024))) throw new Mj3Error('convchain: le misure del campione');
    const [SX, SY] = node.sampleSize;
    if (SX * SY > WFC_LIMITS.sampleCells) throw new Mj3Error(`convchain: il campione è troppo grande (al più ${WFC_LIMITS.sampleCells} celle)`);
    if (typeof node.sample !== 'string' || node.sample.length !== SX * SY || /[^01]/.test(node.sample)) throw new Mj3Error('convchain: il campione è fatto di 0 e 1');
    if (node.temperature !== undefined && !(typeof node.temperature === 'number' && node.temperature > 0 && Number.isFinite(node.temperature))) throw new Mj3Error('convchain: temperature è un numero positivo');
    if (node.steps !== undefined && !(node.steps === Infinity || isInt(node.steps, 1, Number.MAX_SAFE_INTEGER))) throw new Mj3Error('convchain: steps è un intero positivo');
    const one = (ch: unknown, what: string) => {
      if (typeof ch !== 'string' || ch.length !== 1) throw new Mj3Error(`convchain: ${what} è una lettera`);
      return ch === AIR ? 0 : alpha.index(ch);
    };
    this.c0 = one(node.black, 'black');
    this.c1 = one(node.white, 'white');
    this.on = one(node.on, 'on');
    this.N = node.n;
    this.temperature = node.temperature ?? 1;
    try {
      this.weights = convchainWeights(Uint8Array.from(node.sample, (c) => (c === '1' ? 1 : 0)), SX, SY, node.n, squareSubgroup(node.symmetry ?? 'xy'));
    } catch (e) {
      if (e instanceof WfcError) throw new Mj3Error(e.message);
      throw e;
    }
  }
  reset(): void {
    super.reset();
    this.counter = 0;
    this.substrate = undefined;
  }
  rewind(): void {
    this.reset();
  }
  go(g: Grid3, rng: Rng): boolean {
    if (this.limit !== undefined && this.counter >= this.limit) return false;
    if (g.Z !== 1) throw new Mj3Error('convchain: solo su una griglia piana, alta un voxel, come nell\'originale');
    const MX = g.X, MY = g.Y, N = this.N;
    const total = MX * MY;
    if (this.counter === 0) {
      const substrate = new Uint8Array(total);
      let any = false;
      for (let i = 0; i < total; i++)
        if (g.cells[i] === this.on) {
          write(g, i, rng.int(2) === 0 ? this.c0 : this.c1);
          substrate[i] = 1;
          any = true;
        }
      // Without `on` cells it does nothing, now or later (the original would count empty sweeps).
      if (!any) return false;
      this.substrate = substrate;
      this.counter++;
      this.count++;
      this.total++;
      return true;
    }
    const substrate = this.substrate!;
    const cells = g.cells;
    for (let k = 0; k < total; k++) {
      const r = rng.int(total);
      if (!substrate[r]) continue;
      const x = r % MX, y = Math.floor(r / MX);
      let q = 1;
      for (let sy = y - N + 1; sy <= y + N - 1; sy++)
        for (let sx = x - N + 1; sx <= x + N - 1; sx++) {
          let ind = 0, difference = 0;
          for (let dy = 0; dy < N; dy++)
            for (let dx = 0; dx < N; dx++) {
              let X = sx + dx;
              if (X < 0) X += MX;
              else if (X >= MX) X -= MX;
              let Y = sy + dy;
              if (Y < 0) Y += MY;
              else if (Y >= MY) Y -= MY;
              const value = cells[X + Y * MX] === this.c1;
              const power = 1 << (dy * N + dx);
              if (value) ind += power;
              if (X === x && Y === y) difference = value ? power : -power;
            }
          q *= this.weights[ind - difference] / this.weights[ind];
        }
      if (q < 1) {
        if (this.temperature !== 1) q = Math.pow(q, 1 / this.temperature);
        if (!(q > rng.next())) continue;
      }
      write(g, r, cells[r] === this.c0 ? this.c1 : this.c0);
    }
    this.counter++;
    this.count++;
    this.total++;
    return true;
  }
}

/** A box of cells turned the way transform() turns patterns. */
function turnCells<T extends Int32Array | Int16Array>(src: T, d: Vec3, perm: Vec3, flip: Vec3): [T, Vec3] {
  const nd: Vec3 = [d[perm[0]], d[perm[1]], d[perm[2]]];
  const out = new (src.constructor as { new(n: number): T })(src.length);
  for (let k = 0; k < d[2]; k++)
    for (let j = 0; j < d[1]; j++)
      for (let i = 0; i < d[0]; i++) {
        const c: Vec3 = [i, j, k];
        const n = [0, 1, 2].map((a) => (flip[a] ? nd[a] - 1 - c[perm[a]] : c[perm[a]]));
        out[n[0] + n[1] * nd[0] + n[2] * nd[0] * nd[1]] = src[i + j * d[0] + k * d[0] * d[1]];
      }
  return [out, nd];
}

class ShapeRunner extends Runner {
  private color: number;
  private on: number;
  private sets: Uint8Array[];
  constructor(private node: { shape: ShapeKind; at: Vec3; size?: Vec3; to?: Vec3; r?: number; color: string; on?: string }, alpha: Alphabet) {
    super(1);
    if (!SHAPES.includes(node.shape)) throw new Mj3Error(`shape: forma sconosciuta "${node.shape}" (note: ${SHAPES.join(', ')})`);
    if (!isVec(node.at)) throw new Mj3Error('shape: "at" vuole [x, y, z]');
    if (node.shape === 'line' ? !isVec(node.to) : !isVec(node.size)) throw new Mj3Error(node.shape === 'line' ? 'shape line: "to" vuole [x, y, z]' : `shape ${node.shape}: "size" vuole [larghezza, profondità, altezza]`);
    if (typeof node.color !== 'string' || node.color.length !== 1) throw new Mj3Error('shape: "color" è un solo codice');
    this.color = alpha.index(node.color);
    this.on = typeof node.on === 'string' && node.on ? alpha.mask(node.on) : -1;
    this.sets = alpha.sets;
  }
  go(g: Grid3): boolean {
    if (this.count >= 1) return false;
    this.count++;
    this.total++;
    let changed = false;
    const put = (x: number, y: number, z: number) => {
      if (x < 0 || y < 0 || z < 0 || x >= g.X || y >= g.Y || z >= g.Z) return;
      const idx = x + y * g.X + z * g.X * g.Y;
      if (this.on !== -1 && !this.sets[this.on][g.cells[idx]]) return;
      changed = write(g, idx, this.color) || changed;
    };
    const [cx, cy, bz] = this.node.at;
    if (this.node.shape === 'line') {
      const [tx, ty, tz] = this.node.to!;
      const r = Math.max(0, Math.min(8, this.node.r ?? 0));
      const n = Math.ceil(Math.max(Math.abs(tx - cx), Math.abs(ty - cy), Math.abs(tz - bz)) * 2) + 1;
      const ri = Math.ceil(r);
      for (let s = 0; s <= n; s++) {
        const t = s / n;
        const px = cx + (tx - cx) * t, py = cy + (ty - cy) * t, pz = bz + (tz - bz) * t;
        for (let z = Math.round(pz) - ri; z <= Math.round(pz) + ri; z++)
          for (let y = Math.round(py) - ri; y <= Math.round(py) + ri; y++)
            for (let x = Math.round(px) - ri; x <= Math.round(px) + ri; x++)
              if ((x - px) ** 2 + (y - py) ** 2 + (z - pz) ** 2 <= (r + 0.5) ** 2) put(x, y, z);
      }
      return changed;
    }
    const [w, d, h] = this.node.size!.map((v) => Math.max(1, Math.min(256, v)));
    const a = w / 2, b = d / 2;
    for (let z = Math.floor(bz); z < bz + h; z++)
      for (let y = Math.floor(cy - b); y <= cy + b; y++)
        for (let x = Math.floor(cx - a); x <= cx + a; x++) {
          const u = (x - cx) / a, v = (y - cy) / b;
          let inside: boolean;
          switch (this.node.shape) {
            case 'box':
              inside = Math.abs(x - cx) <= (w - 1) / 2 && Math.abs(y - cy) <= (d - 1) / 2;
              break;
            case 'ellipsoid': {
              const c = h / 2;
              const s = (z - (bz + (h - 1) / 2)) / c;
              inside = u * u + v * v + s * s < 1;
              break;
            }
            case 'cylinder':
              inside = u * u + v * v < 1;
              break;
            default: {
              const k = 1 - (z - bz) / h;
              inside = u * u + v * v < k * k;
            }
          }
          if (inside) put(x, y, z);
        }
    return changed;
  }
}

class SequenceRunner extends Runner {
  private index = 0;
  /** The first child did something since the sequence started (a gated sequence, T335). */
  private opened = false;
  /** `gated`: the rest runs only if the first child did something (a wfc without a solution leaves its nodes out, as MarkovJunior's branch). */
  constructor(private children: Runner[], private gated = false) {
    super();
  }
  reset(): void {
    super.reset();
    this.index = 0;
    this.opened = false;
    for (const c of this.children) c.reset();
  }
  rewind(): void {
    super.rewind();
    this.index = 0;
    this.opened = false;
    for (const c of this.children) c.rewind();
  }
  go(g: Grid3, rng: Rng): boolean {
    while (this.index < this.children.length) {
      if (this.children[this.index].go(g, rng)) {
        if (this.index === 0) this.opened = true;
        return true;
      }
      if (this.gated && this.index === 0 && !this.opened) {
        this.index = this.children.length;
        return false;
      }
      this.index++;
      if (this.index < this.children.length) restart(this.children[this.index]);
    }
    return false;
  }
}

class MarkovRunner extends Runner {
  constructor(private children: Runner[]) {
    super();
  }
  reset(): void {
    super.reset();
    for (const c of this.children) c.reset();
  }
  rewind(): void {
    super.rewind();
    for (const c of this.children) c.rewind();
  }
  go(g: Grid3, rng: Rng): boolean {
    // for (const c of this.children) if (c.go(g, rng)) { c.reset(); return true; };
    // for (const c of this.children) if (c.go(g, rng)) return true;
    for (let index: number = 0; index < this.children.length; index++) {
      const c = this.children[index];
      if (c.go(g, rng)) {
        if (index === this.children.length - 1) for (const c of this.children) restart(c);
        return true
      }
    }
    return false;
  }
}

/** A leaf node, seen from outside: it asks nothing of the run (no random numbers, no writes), so a watched run is the same run. */
class WatchedRunner extends Runner {
  constructor(private inner: Runner, private node: Node3, private watch: RunWatch) {
    super();
  }
  reset(): void {
    this.inner.reset();
  }
  rewind(): void {
    this.inner.rewind();
  }
  go(g: Grid3, rng: Rng): boolean {
    const from = g.log.length;
    const epoch = g.epoch;
    if (!this.inner.go(g, rng)) return false;
    this.watch.step({ node: this.node, grid: g, from, epoch, fired: this.inner.fired, ...(this.inner.note ? { note: this.inner.note } : {}) });
    return true;
  }
}

const isVec = (v: unknown): v is Vec3 => Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === 'number' && Number.isFinite(n));

/** What a node is, in a few words, for the list of nodes that never did anything. */
export function describe(node: Node3): string | undefined {
  // A node meant for rare cases says so: it is not reported when it does nothing.
  if ((node as { optional?: boolean }).optional) return undefined;
  if (node.type === 'one' || node.type === 'all' || node.type === 'prl') return `${node.type} "${node.rules[0]?.in}" → "${node.rules[0]?.out}"${node.rules.length > 1 ? ` (e altre ${node.rules.length - 1} regole)` : ''}`;
  if (node.type === 'path') return `path da "${node.from}" a "${node.to}" su "${node.on}"`;
  if (node.type === 'conv') return `conv "${node.rules[0]?.in}" → "${node.rules[0]?.out}"`;
  if (node.type === 'wfc') return `wfc ${node.model === 'tile' ? 'a tessere' : 'a sovrapposizione'} (${node.patterns?.length} motivi)`;
  if (node.type === 'convchain') return `convchain su "${node.on}"`;
  return undefined;
}

type Trace = Array<{ runner: Runner; what: string }>;

function compile(node: Node3, alpha: Alphabet, limits: GridLimits, depth = 0, trace?: Trace, watch?: RunWatch): Runner {
  const r = compileNode(node, alpha, limits, depth, trace, watch);
  const what = trace && node && typeof node === 'object' ? describe(node) : undefined;
  if (what) trace!.push({ runner: r, what });
  return watch && node.type !== 'sequence' && node.type !== 'markov' ? new WatchedRunner(r, node, watch) : r;
}

function compileNode(node: Node3, alpha: Alphabet, limits: GridLimits, depth: number, trace?: Trace, watch?: RunWatch): Runner {
  if (depth > 16) throw new Mj3Error('programma troppo annidato');
  if (!node || typeof node !== 'object') throw new Mj3Error('nodo non valido');
  switch (node.type) {
    case 'one':
    case 'all':
    case 'prl': {
      const limit = node.steps ?? (node.type === 'prl' ? 1 : undefined);
      // Only a node that infers runs another way (T334): every other program is the same run, voxel by voxel (ADR-0142).
      if (node.fields?.length || node.observe?.length) return new GuidedRunner(node, limit, node.symmetry ?? 'xy', alpha);
      return new RuleRunner(node.type, node.rules, limit, node.symmetry ?? 'xy', alpha);
    }
    case 'conv':
      return new ConvRunner(node, alpha);
    case 'path':
      return new PathRunner(node, alpha);
    case 'shape':
      return new ShapeRunner(node, alpha);
    case 'map':
      return new MapRunner(node, alpha, limits);
    case 'wfc':
      return new WfcRunner(node, alpha, limits);
    case 'convchain':
      return new ConvChainRunner(node, alpha);
    case 'sequence':
    case 'markov': {
      if (!Array.isArray(node.children) || !node.children.length) throw new Mj3Error(`nodo ${node.type} senza figli`);
      const children = node.children.map((c) => compile(c, alpha, limits, depth + 1, trace, watch));
      return node.type === 'sequence' ? new SequenceRunner(children, node.gated === true) : new MarkovRunner(children);
    }
    default:
      throw new Mj3Error(`tipo di nodo sconosciuto: ${(node as { type: string }).type}`);
  }
}

export interface RunResult {
  grid: Grid3;
  steps: number;
  /** False if the program was still rewriting when the step budget ran out. */
  finished: boolean;
  ms: number;
  /** Rule nodes and paths that never did anything (described by their first rule): often a mistake. */
  unused?: string[];
}

export function checkSize(size: unknown, limits: GridLimits = MODEL_LIMITS): Vec3 {
  if (!isVec(size) || size.some((v) => v < 1 || v > limits.side || !Number.isInteger(v))) throw new Mj3Error(`size vuole tre interi tra 1 e ${limits.side}: [x, y, z]`);
  if (size[0] * size[1] * size[2] > limits.cells) throw new Mj3Error(`griglia troppo grande (max ${limits.cells} celle)`);
  return size;
}

function alphabetOf(p: Pick<Program3, 'palette' | 'unions'>, codes: string[] = [AIR]): Alphabet {
  const alpha = new Alphabet();
  for (const [k, v] of Object.entries(p.unions ?? {})) if (k.length === 1 && k !== AIR && k !== '*' && typeof v === 'string' && v) alpha.unions.set(k, v);
  for (const c of codes) if (c !== AIR) alpha.codes.push(c);
  for (const k of Object.keys(p.palette ?? {})) if (k.length === 1 && k !== AIR && !alpha.unions.has(k)) alpha.index(k);
  return alpha;
}

export interface RunOptions {
  /** Milliseconds after which the run stops (it then counts as not finished). */
  deadline?: number;
  /** Keep about this many states along the run, evenly spaced: the model growing, frame by frame. */
  snapshots?: number;
  /** Who wants to see every step of the run (src/mj/trace.ts, ADR-0118): the run does not change. */
  watch?: RunWatch;
}

/** One step of a run: the leaf node that did something. */
export interface NodeStep {
  node: Node3;
  grid: Grid3;
  /** Where the writes of this step begin in `grid.log`, if `grid.epoch` is still `epoch` (else the log was emptied). */
  from: number;
  epoch: number;
  /** Times each rule of the node has been applied so far. */
  fired: readonly number[];
  /** What the node found out on its own (a search's trajectory). */
  note?: string;
}

export interface RunWatch {
  /** The grid before the first step. */
  start(g: Grid3): void;
  step(s: NodeStep): void;
}

export interface Snapshot {
  X: number;
  Y: number;
  Z: number;
  cells: Uint8Array;
  step: number;
}

function exec(root: Runner, g: Grid3, seed: number, maxSteps: number, t0: number, trace: Trace = [], opts: RunOptions = {}): RunResult & { snapshots?: Snapshot[] } {
  const outer = current;
  current = { g, ...(opts.deadline ? { deadline: t0 + opts.deadline } : {}) };
  try {
    return execIn(root, g, seed, maxSteps, t0, trace, opts);
  } finally {
    current = outer;
  }
}

function execIn(root: Runner, g: Grid3, seed: number, maxSteps: number, t0: number, trace: Trace, opts: RunOptions): RunResult & { snapshots?: Snapshot[] } {
  root.reset();
  const rng = new Rng(seed);
  let steps = 0;
  let late = false;
  const keep = opts.snapshots ?? 0;
  const shots: Snapshot[] = [];
  let every = 1;
  const shoot = () => shots.push({ X: g.X, Y: g.Y, Z: g.Z, cells: new Uint8Array(g.cells), step: steps });
  if (keep) shoot();
  opts.watch?.start(g);
  while (steps < maxSteps) {
    let went: boolean;
    try {
      went = root.go(g, rng);
    } catch (e) {
      // A search out of time: the run ends here, not finished (T334).
      if (!(e instanceof Mj3Late)) throw e;
      late = true;
      break;
    }
    if (!went) break;
    steps++;
    if (keep && steps % every === 0) {
      shoot();
      // Too many: keep one in two and take them half as often.
      if (shots.length > 2 * keep) {
        for (let i = 0; i < shots.length / 2; i++) shots[i] = shots[i * 2];
        shots.length = Math.ceil(shots.length / 2);
        every *= 2;
      }
    }
    // At every step: on a large grid one step can take long, and 256 of them were seconds past the deadline.
    if (opts.deadline && Date.now() - t0 > opts.deadline) {
      late = true;
      break;
    }
  }
  if (keep && shots[shots.length - 1]?.step !== steps) shoot();
  return {
    grid: g,
    steps,
    finished: steps < maxSteps && !late,
    ms: Date.now() - t0,
    unused: trace.filter((t) => t.runner.total === 0).map((t) => (t.runner.why ? `${t.what} — ${t.runner.why}` : t.what)),
    ...(keep ? { snapshots: shots } : {}),
  };
}

/** Runs a program from an empty box. Throws Mj3Error if the program does not compile. */
export function run(p: Program3, seed: number, maxSteps = 20000, limits: GridLimits = MODEL_LIMITS, opts: RunOptions = {}): RunResult & { snapshots?: Snapshot[] } {
  const t0 = Date.now();
  const [X, Y, Z] = checkSize(p?.size, limits);
  const alpha = alphabetOf(p);
  const trace: Trace = [];
  const root = compile(p.program, alpha, limits, 0, trace, opts.watch);
  const g: Grid3 = { X, Y, Z, cells: new Uint8Array(X * Y * Z), alphabet: alpha.codes, log: [], epoch: 0 };
  if (typeof p.ground === 'string' && p.ground.length === 1) {
    const v = alpha.index(p.ground);
    for (let i = 0; i < X * Y; i++) g.cells[i] = v;
  }
  // As `Forms.get` lays the model: a box with no room for what is under the ground has its ground at the bottom.
  const soilAt = typeof p.soil === 'string' && p.soil.length === 1 ? (p.soilAt && p.soilAt > 0 && p.soilAt < Z ? p.soilAt : 0) : -1;
  if (soilAt >= 0) g.cells.fill(alpha.index(p.soil!), soilAt * X * Y, (soilAt + 1) * X * Y);
  if (typeof p.origin === 'string' && p.origin.length === 1) g.cells[(X >> 1) + (Y >> 1) * X + (p.originAt === 'centre' ? (Z >> 1) * X * Y : Math.max(0, soilAt) * X * Y)] = alpha.index(p.origin);
  return exec(root, g, seed, maxSteps, t0, trace, opts);
}

/**
 * Runs more rules on a grid that already exists (a composed structure, say): its codes keep their
 * meaning, the palette may add new ones. The grid is changed in place and returned.
 */
export function runOn(grid: Grid3, p: Pick<Program3, 'palette' | 'unions' | 'program'>, seed: number, maxSteps = 20000, limits: GridLimits = { side: 4096, cells: 64_000_000 }, opts: RunOptions = {}): RunResult {
  const t0 = Date.now();
  const alpha = alphabetOf(p, grid.alphabet);
  const trace: Trace = [];
  const root = compile(p.program, alpha, limits, 0, trace, opts.watch);
  grid.alphabet = alpha.codes;
  grid.log = [];
  grid.epoch++;
  return exec(root, grid, seed, maxSteps, t0, trace, opts);
}

/**
 * A program kept on its grid between calls, for what moves a little at every tick of a page (the site's lights and maze, T315,
 * ADR-0164): compiled once, with one random generator and the grid's census, instead of a `runOn` at every tick that compiles the
 * program again and scans the whole grid for every node. Runs with `run` and `runOn` do not change (ADR-0142).
 * - `advance(n)` goes on with the same run for at most `n` steps: the run is the one `runOn` would make with the same seed, cut in pieces.
 * - `tick(n)` runs the program again from its first node, as a new `runOn` would, but its nodes keep their matches and bring them
 *   up to date from the grid's log (`keeping`): the same rules, the matches in another order than a scan's, so not the run of `runOn`.
 */
export class Stepper {
  /** Steps made so far. */
  steps = 0;
  private root: Runner;
  private rng: Rng;
  private context: { g: Grid3; census?: Census };
  /** Past this many writes in the log, between two ticks the log starts again and the nodes scan the grid once: memory stays bounded. */
  private logCap: number;
  constructor(readonly grid: Grid3, p: Pick<Program3, 'palette' | 'unions' | 'program'>, seed: number, limits: GridLimits = { side: 4096, cells: 64_000_000 }) {
    const alpha = alphabetOf(p, grid.alphabet);
    this.root = compile(p.program, alpha, limits);
    grid.alphabet = alpha.codes;
    grid.log = [];
    grid.epoch++;
    this.rng = new Rng(seed);
    this.context = { g: grid };
    this.logCap = Math.max(4096, grid.cells.length * 4);
    this.root.reset();
  }
  /** Goes on with the run for at most `maxSteps` steps: how many it made (fewer when the program has finished). */
  advance(maxSteps: number): number {
    return this.go(maxSteps, false);
  }
  /** Runs the program again from its first node, for at most `maxSteps` steps: how many it made. */
  tick(maxSteps: number): number {
    return this.go(maxSteps, true);
  }
  private go(maxSteps: number, again: boolean): number {
    const outer = current;
    const was = keeping;
    current = this.context;
    keeping = again;
    let made = 0;
    try {
      if (again) this.root.rewind();
      while (made < maxSteps && this.root.go(this.grid, this.rng)) made++;
    } catch (e) {
      if (!(e instanceof Mj3Late)) throw e;
    } finally {
      keeping = was;
      current = outer;
      // Only between ticks: a run that goes on keeps its log, as one `runOn` would (a new epoch makes the nodes scan again).
      const g = this.grid;
      if (again && g.log.length > this.logCap) {
        g.log.length = 0;
        g.epoch++;
      }
    }
    this.steps += made;
    return made;
  }
}

export const at = (g: Grid3, x: number, y: number, z: number) => g.alphabet[g.cells[x + y * g.X + z * g.X * g.Y]];
