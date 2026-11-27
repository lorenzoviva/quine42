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
//                      Metropolis steps make every N×N window as likely as in the sample; on a grid of more layers
//                      every layer that holds `on` cells is a flat grid of its own (T469, ADR-0240, not in MarkovJunior)
//   shape            — box, ellipsoid, cylinder, cone resting on `at` (centre of the base), or a line
//                      from `at` to `to` with radius `r`; `on` limits which codes it may overwrite
//   pieces           — the nodes inside run on one piece of the grid at a time, each on a window with a margin around it
//                      (T339, not in MarkovJunior): see `PiecesNode` and `PiecesRunner`
// A rule node may also infer (infer.ts, T334): `fields` (potentials that rank its matches, softly with `temperature`), `observe`
// (a future the node walks towards) and `search` (a whole trajectory found first, within ceilings); then a match is wherever the
// input fits, as in MarkovJunior, and the node is a `GuidedRunner`. Every other node runs as it always did (ADR-0142).
//
// Programs written in MarkovJunior's own XML (lab/mjx) compile to these nodes with MarkovJunior's
// semantics: map with `clear` (a new empty grid, rules wrapping round), conv with `sums`, unlimited steps.

import { hash32 } from '../kernel/rng';
import { randomFor, semanticsOf, type RunRandom, type Semantics } from './random';
export type { Semantics } from './random';
import { backwardPotentials, fieldPotential, goalReached, INFERENCE_LIMITS, makeWork, MAX_OBSERVED_CODES, prepare, search, type InferRule, type Prepared, type Work } from './infer';
import { MAX_SYMBOLS, showSymbols, symbolName } from './symbols';
import { convchainWeights, squareSubgroup, waveBytes, WFC_LIMITS, WfcError, WfcSolver } from './wfc';

export type Vec3 = [number, number, number];
/**
 * Symmetry groups, as MarkovJunior names them in 3D: xy = "(xy)" (turns and mirrors in the horizontal
 * plane: gravity stays), none = "()", x = "(x)", y = "(y)", z = "(z)" (upside down), rot = "(xyz+)" (the 24
 * turns of the cube, no mirror), all = "(xyz)" (the whole cube group, 48).
 */
/**
 * The symmetries a rule is also tried in: `none`, a mirror (`x`, `y`, `z`), the square of the floor (`xy`), the turns of the cube (`rot`),
 * the cube (`all`); and MarkovJunior's two of the square (T531): `mirrors`, its `(x)(y)` (the two mirrors of the floor and the half turn),
 * and `turns`, its `(xy+)` (the four turns about z).
 */
export type Sym = 'xy' | 'none' | 'x' | 'y' | 'z' | 'rot' | 'all' | 'mirrors' | 'turns';

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

/**
 * MarkovJunior's <convchain> (T335): `on` cells become `black` or `white` like the sample, `1` white and `0` black, rows of `sampleSize[0]`.
 * On a grid of more layers (T469, ADR-0240) every layer that holds `on` cells is a flat grid of its own, swept in turn from the bottom.
 */
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

/**
 * The grid in pieces (T339, ADR-0178; MarkovJunior has no such node): its nodes run on one piece of the grid at a time, full height, with
 * the cells around it it may read (`margin`), each piece in its own time. What is decided once for the whole model goes before (a plan
 * mapped up): of what a piece writes only its own cells reach the grid, so a piece of a large grid costs what a small grid costs.
 */
export interface PiecesNode {
  type: 'pieces';
  /** Cells of a piece along x and y (the last ones may be smaller). */
  size: [number, number];
  /** Cells around a piece its rules read, on each side (8 if not said). */
  margin?: number;
  /** Milliseconds a piece may run (`PieceLimits.pieceMs` at most): past them the run stops, not finished. */
  time?: number;
  /**
   * What a piece reads around itself: `before` (the default), the grid as it was when the node started, so the pieces do not depend on
   * each other; `written`, what the pieces before it (in rows, from the back) have written.
   */
  halo?: 'before' | 'written';
  /** Whether the margin grows with the piece's own rules (`grow`, the default, thrown away afterwards) or stays as it was read (`frozen`). */
  edge?: 'frozen' | 'grow';
  children: Node3[];
}

export type Node3 =
  | ({ type: 'one' | 'all' | 'prl'; rules: Rule3[]; steps?: number; symmetry?: Sym; optional?: boolean } & Inference)
  /**
   * `gated` (a sequence the compiler makes of a wfc and its nodes, T335): the rest runs only if the first child did something. `grid` (a
   * sequence the compiler makes of a map and its nodes, T528): MarkovJunior's MapNode. Under the original's semantics both are a branch
   * without a parent (MapNode, WFCNode): when their nodes are done, the run is.
   */
  | { type: 'sequence' | 'markov'; children: Node3[]; gated?: boolean; grid?: boolean }
  | { type: 'conv'; rules: ConvRule[]; neighborhood?: 'moore' | 'vonneumann' | 'nocorners'; steps?: number; periodic?: boolean }
  /**
   * `edges`, `vertices`: MarkovJunior's path also by the edges (and, in 3D, the corners) of a cell, read only under the original's
   * semantics (T529); ours goes by faces.
   */
  | { type: 'path'; from: string; to: string; on: string; color: string; steps?: number; inertia?: boolean; longest?: boolean; edges?: boolean; vertices?: boolean }
  /** Each factor is `scale / divide` (T335: 1/3, 5/3), fractions only with `clear`. */
  | { type: 'map'; scale: Vec3; divide?: Vec3; rules?: Rule3[]; symmetry?: Sym; clear?: boolean }
  | WfcNode
  | ConvChainNode
  | PiecesNode
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
  /**
   * The area of a structure this letter marks on its ground layer (T346, ADR-0182): `pasture`, `yard`, `barn`… for whoever places
   * people and animals; a plain lowercase name (`AREA_RE` in areas.ts). Hidden letters may carry it: they stay in the grid unseen.
   */
  area?: string;
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
  /** The semantics it was compiled for (T526, ADR-0263): `mj` only when the compiler was told so; absent, ours. */
  semantics?: Semantics;
}

export const AIR = '.';
export const MAX_SIDE = 64;
export const MAX_CELLS = 64 * 64 * 64;
/** Codes a program may use, air included (cells are bytes): the symbols of a program are at most `MAX_SYMBOLS` (T342, ADR-0175). */
export const MAX_CODES = MAX_SYMBOLS + 1;

/** How large a grid may be: voxel models (the default) or layouts of blocks (structure.ts). */
export interface GridLimits {
  side: number;
  cells: number;
  /**
   * What a program with `<pieces>` may do (T339, ADR-0178), if who runs it allows it: a larger grid, and the pieces' time apart from the
   * run's. Without it a program with pieces runs within `side` and `cells`, and its pieces count in the run's time like any other node.
   */
  pieces?: PieceLimits;
}
export const MODEL_LIMITS: GridLimits = { side: MAX_SIDE, cells: MAX_CELLS };

/** The ceilings of a program that runs its detail in pieces (T339, ADR-0178): its grids, each piece's time, all of them, how many. */
export interface PieceLimits {
  /** The largest grid of a program with pieces: its box, a map's or a wfc's grid. */
  side: number;
  cells: number;
  /** Milliseconds a piece may take at most (a node's `time` up to this). */
  pieceMs: number;
  /** Milliseconds all the pieces of a run may take together: past them the run stops, not finished. */
  totalMs: number;
  /** Pieces of one node. */
  count: number;
  /** Steps of one piece: past them the run is not finished. */
  steps: number;
}

/** What a pieces node is held to when who runs it says nothing (T339): its time counts in the run's, its grid is the run's. */
export const PIECE_DEFAULTS = { margin: 8, pieceMs: 4_000, maxMargin: 64, count: 4096, steps: 5_000_000 } as const;

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
  /**
   * Under the original's semantics (T529): the stretches of `log` the original's rule nodes do not look at, `[from, to)` in pairs, for the
   * log of `epoch`: what a convolution and a convchain write, which MarkovJunior does not put in the list of changes (`ip.changes`).
   * The log holds them all the same (the trace reads it).
   */
  unseen?: { epoch: number; ranges: number[] };
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

/**
 * The grid of the run in progress and its census (built when a scan first needs it), and when the run must end: runs do not nest. `turn`:
 * where the grid's log was when the turn in progress began (whoever runs the turns says it), MarkovJunior's `ip.first[ip.counter]`.
 * `branch`: under the original's semantics, the branch that has the turn (`ip.current`, T528): null when none has it, and the run is over.
 */
let current: { g: Grid3; census?: Census; deadline?: number; ceilings?: NodeCeilings; semantics?: Semantics; turn?: number; branch?: OriginalBranch | null } | undefined;

/** The semantics of the run in progress (T526, ADR-0263): ours unless the run was told `mj`. */
export const runSemantics = (): Semantics => current?.semantics ?? 'ours';

/**
 * Where the turn in progress began in the log of `g` (T527): what the loop that runs the turns said, or, for a node run some other way,
 * where the log is now (the same, since a node that does nothing writes nothing: the turn's first writes are the node's that acts).
 */
const turnStart = (g: Grid3): number => (current !== undefined && current.g === g && current.turn !== undefined && current.turn <= g.log.length ? current.turn : g.log.length);

/**
 * Ceilings a run may ask for besides the engine's own (the world's, T336, ADR-0176): past one the node is an error that says so, below
 * them nothing changes, so a program the validator took with them runs the same without them.
 */
export interface NodeCeilings {
  /** Cells of the grid a wave is observed on (a `wfc`'s grid before its tiles, or the sample's). */
  waveCells: number;
  /** Bytes of the waves of a node (`WFC_LIMITS.waveBytes` the engine's). */
  waveBytes: number;
  /** Bytes of the potentials and of the propagation of a node that infers (`INFERENCE_LIMITS.potentialBytes` the engine's). */
  potentialBytes: number;
  /**
   * Cells a sweep of a `convchain` visits, those of the layers that hold its `on` cells (T469, ADR-0240): the engine's own,
   * `WFC_LIMITS.convchainCells`, holds only on a grid of more layers.
   */
  convchainCells: number;
}

/** The bytes of potentials a node may take in this run: the engine's, or the run's ceiling if lower. */
const potentialCeiling = (): number => Math.min(INFERENCE_LIMITS.potentialBytes, current?.ceilings?.potentialBytes ?? Infinity);

function censusOf(g: Grid3): Census {
  if (current?.g !== g) current = { g, ...(current?.semantics ? { semantics: current.semantics } : {}) };
  if (!current.census?.fits(g)) current.census = new Census(g);
  return current.census;
}

/** A cell of a piece's window (T339): the piece's own, the margin it only reads, the margin its rules grow and the piece throws away. */
const OWN = 0;
const FROZEN = 1;
const LOOSE = 2;

/**
 * While a piece runs (T339): its grid and, per cell of it, `OWN`, `FROZEN` or `LOOSE`. `write` never changes a frozen cell, and a rule
 * never matches where it would change one; `one` picks only where it changes the piece. Undefined otherwise:
 * every other run is the run it always was.
 */
let pieceGuard: { g: Grid3; mask: Uint8Array } | undefined;

/** Milliseconds the pieces of the run in progress have taken, which its deadline does not count when its limits have `pieces` (T339). */
let piecesTime = 0;

function write(g: Grid3, idx: number, v: number): boolean {
  const was = g.cells[idx];
  if (was === v) return false;
  if (pieceGuard !== undefined && pieceGuard.mask[idx] === FROZEN && pieceGuard.g === g) return false;
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
 * MarkovJunior's `AllNode.Fit` (T527): every cell a match writes goes into the list of changes, also one that already holds the value, so
 * that the nodes looking at the changes look around it again. Only under the original's semantics; a frozen cell of a piece stays as it is.
 */
function writeLogged(g: Grid3, idx: number, v: number): void {
  if (g.cells[idx] !== v) {
    write(g, idx, v);
    return;
  }
  g.log.push(idx);
  if (g.log.length > 2_000_000) {
    g.log.length = 0;
    g.epoch++;
  }
}

/**
 * What was written into `g`'s log from `from` (when the log was at `epoch`) is out of the list of changes of the original's rule nodes
 * (T529): MarkovJunior's ConvolutionNode and ConvChainNode write the grid without `ip.AddChange`, so a rule node that has already looked
 * does not see it, until something else changes there or it scans the grid again.
 */
function unseenFrom(g: Grid3, from: number, epoch: number): void {
  const start = g.epoch === epoch ? from : 0;
  if (g.log.length <= start) return;
  if (g.unseen?.epoch !== g.epoch) g.unseen = { epoch: g.epoch, ranges: [] };
  const r = g.unseen.ranges;
  if (r.length && r[r.length - 1] === start) r[r.length - 1] = g.log.length;
  else r.push(start, g.log.length);
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
    if (this.unions.has(ch)) throw new Mj3Error(`"${symbolName(ch)}" è un'unione: vale solo negli ingressi delle regole`);
    let i = this.codes.indexOf(ch);
    if (i < 0) {
      if (this.codes.length >= MAX_CODES) throw new Mj3Error(`troppi simboli (al più ${MAX_CODES - 1} oltre la cella vuota)`);
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
  /**
   * Under the original's semantics (T527, ADR-0268): the chance of a `prl` as written, 0 too (never), 1 if not said; `p` (ours) makes 0 a 1.
   * A `one` and an `all` do not read it, as there.
   */
  chance?: number;
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
  if (!same(li) || !same(lo)) throw new Mj3Error(`in e out devono avere la stessa forma: "${showSymbols(rule.in)}" → "${showSymbols(rule.out)}"`);
  if (dx * dy * dz > 1728) throw new Mj3Error(`regola troppo grande (max 1728 celle): ${showSymbols(rule.in)}`);
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
    case 'mirrors':
      return flips([0, 1], [0, 1], [0]).map((flip) => ({ perm: [0, 1, 2], flip }));
    case 'turns':
      // The four turns about z: the identity, the half turn, and the quarter turns (x and y swapped, one of them mirrored).
      return [
        { perm: [0, 1, 2], flip: [0, 0, 0] },
        { perm: [1, 0, 2], flip: [1, 0, 0] },
        { perm: [0, 1, 2], flip: [1, 1, 0] },
        { perm: [1, 0, 2], flip: [0, 1, 0] },
      ];
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

// ---------------------------------------------------------------- the symmetries of the original (T527, A1-2, ADR-0268)

/** A rule as MarkovJunior turns it: what it reads in its box, what it writes in its own (the same box, but in a map's rules). */
interface Turned {
  input: Int32Array;
  output: Int16Array;
  d: Vec3;
  D: Vec3;
}

/** Rule.ZRotated of MarkovJunior on a box of cells: a quarter turn about z (x and y swap). */
function zRotatedCells<T extends Int32Array | Int16Array>(src: T, [X, Y, Z]: Vec3): [T, Vec3] {
  const out = new (src.constructor as new (n: number) => T)(src.length);
  for (let z = 0; z < Z; z++) for (let y = 0; y < X; y++) for (let x = 0; x < Y; x++) out[x + y * Y + z * X * Y] = src[X - 1 - y + x * X + z * X * Y];
  return [out, [Y, X, Z]];
}
/** Rule.YRotated: a quarter turn about y (x and z swap). */
function yRotatedCells<T extends Int32Array | Int16Array>(src: T, [X, Y, Z]: Vec3): [T, Vec3] {
  const out = new (src.constructor as new (n: number) => T)(src.length);
  for (let z = 0; z < X; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < Z; x++) out[x + y * Z + z * Z * Y] = src[X - 1 - z + y * X + x * X * Y];
  return [out, [Z, Y, X]];
}
/** Rule.Reflected: the mirror of x. */
function reflectedCells<T extends Int32Array | Int16Array>(src: T, [X, Y, Z]: Vec3): [T, Vec3] {
  const out = new (src.constructor as new (n: number) => T)(src.length);
  for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) out[x + y * X + z * X * Y] = src[X - 1 - x + y * X + z * X * Y];
  return [out, [X, Y, Z]];
}
const turnA = (t: Turned): Turned => {
  const [input, d] = zRotatedCells(t.input, t.d);
  const [output, D] = zRotatedCells(t.output, t.D);
  return { input, output, d, D };
};
const turnB = (t: Turned): Turned => {
  const [input, d] = yRotatedCells(t.input, t.d);
  const [output, D] = yRotatedCells(t.output, t.D);
  return { input, output, d, D };
};
const turnR = (t: Turned): Turned => {
  const [input, d] = reflectedCells(t.input, t.d);
  const [output, D] = reflectedCells(t.output, t.D);
  return { input, output, d, D };
};
/** Rule.Same: the same boxes, the same cells read, the same cells written. */
function sameTurn(a: Turned, b: Turned): boolean {
  for (let k = 0; k < 3; k++) if (a.d[k] !== b.d[k] || a.D[k] !== b.D[k]) return false;
  for (let i = 0; i < a.input.length; i++) if (a.input[i] !== b.input[i]) return false;
  for (let i = 0; i < a.output.length; i++) if (a.output[i] !== b.output[i]) return false;
  return true;
}

const EVERY = (n: number) => Array.from({ length: n }, () => true);
const ONLY = (n: number, keep: readonly number[]) => Array.from({ length: n }, (_, l) => keep.includes(l));
/**
 * The subgroups of SymmetryHelper by our names, as the indices of its list of transforms: of the square (8) on a flat grid, of the cube (48)
 * on one of more layers. The original's names on a flat grid are `() (x) (y) (x)(y) (xy+) (xy)` and on the others `() (x) (z) (xy) (xyz+)
 * (xyz)`; the rest is ours, read as what it does there: on a flat grid the mirror of z is nothing and the turns of the cube are the square,
 * on a grid of layers the mirror of y and the two of the square are the same transforms of the floor (the first 8 of the cube are the square).
 */
const SQUARE_SUBGROUPS: Record<Sym, readonly boolean[]> = {
  none: ONLY(8, [0]),
  x: ONLY(8, [0, 1]),
  y: ONLY(8, [0, 5]),
  mirrors: ONLY(8, [0, 1, 4, 5]),
  turns: ONLY(8, [0, 2, 4, 6]),
  xy: EVERY(8),
  z: ONLY(8, [0]),
  rot: EVERY(8),
  all: EVERY(8),
};
const CUBE_SUBGROUPS: Record<Sym, readonly boolean[]> = {
  none: ONLY(48, [0]),
  x: ONLY(48, [0, 1]),
  y: ONLY(48, [0, 5]),
  z: ONLY(48, [0, 17]),
  mirrors: ONLY(48, [0, 1, 4, 5]),
  turns: ONLY(48, [0, 2, 4, 6]),
  xy: Array.from({ length: 48 }, (_, l) => l < 8),
  rot: Array.from({ length: 48 }, (_, l) => l % 2 === 0),
  all: EVERY(48),
};

/**
 * SymmetryHelper.SquareSymmetries (a flat grid) or CubeSymmetries: the transforms of a rule in the original's order (`e, r, a, ra, a², …`,
 * a the quarter turn about z, b about y, r the mirror of x), those of the subgroup, without the doubles. The order is part of the run: the
 * list of matches is made rule by rule in it.
 */
function originalTurns(t: Turned, sym: Sym, flat: boolean): Turned[] {
  const keep = (flat ? SQUARE_SUBGROUPS : CUBE_SUBGROUPS)[sym] ?? (flat ? SQUARE_SUBGROUPS : CUBE_SUBGROUPS).xy;
  const s: Turned[] = new Array(flat ? 8 : 48);
  s[0] = t;
  s[1] = turnR(s[0]);
  s[2] = turnA(s[0]);
  s[3] = turnR(s[2]);
  s[4] = turnA(s[2]);
  s[5] = turnR(s[4]);
  s[6] = turnA(s[4]);
  s[7] = turnR(s[6]);
  if (!flat) {
    // s[8..31]: b of the one eight before (s[8] = b(s[0]) … s[30] = b(s[22])); s[32..39]: a of s[8..15]; s[40..47]: a of s[24..31]; each
    // followed by its mirror.
    for (let i = 8; i < 32; i += 2) {
      s[i] = turnB(s[i - 8]);
      s[i + 1] = turnR(s[i]);
    }
    for (let i = 32; i < 40; i += 2) {
      s[i] = turnA(s[i - 24]);
      s[i + 1] = turnR(s[i]);
    }
    for (let i = 40; i < 48; i += 2) {
      s[i] = turnA(s[i - 16]);
      s[i + 1] = turnR(s[i]);
    }
  }
  const out: Turned[] = [];
  for (let i = 0; i < s.length; i++) if (keep[i] && !out.some((u) => sameTurn(u, s[i]))) out.push(s[i]);
  return out;
}

/** The variants of a rule node's pattern under the original's semantics: SymmetryHelper's order, its subgroups (`originalTurns`). */
function originalVariants(p: Pattern, sym: Sym, flat: boolean): Pattern[] {
  const d: Vec3 = [p.dx, p.dy, p.dz];
  return originalTurns({ input: p.input, output: p.output, d, D: d }, sym, flat).map((t) => ({ ...p, dx: t.d[0], dy: t.d[1], dz: t.d[2], input: t.input, output: t.output }));
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
  abstract go(g: Grid3, rng: RunRandom): boolean;
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
/** One buffer for a `prl` under the original's semantics (T527): the new grid of its step, read only where it changes. */
let prlBuf = new Uint8Array(0);

/** A cell in the log without writing it (T527): MarkovJunior's change that is a change only for whoever looks at the list. */
function logOnly(g: Grid3, idx: number): void {
  g.log.push(idx);
  if (g.log.length > 2_000_000) {
    g.log.length = 0;
    g.epoch++;
  }
}

/**
 * A rule node's list of matches under the original's semantics (T527, A1-2, ADR-0268): RuleNode's `matches` and `matchMask`. Lazy as
 * there: the first step scans the grid; from then on what the cells written since the turn the node last matched in make new goes at the
 * end; a match is checked again only when it is drawn (`one`), and an `all` empties it at every step.
 */
interface OriginalList {
  /** The grid's layers its variants were made for: one (the square's symmetries) or more (the cube's). */
  flat: boolean;
  /** The matches, `pattern · N + origin` each; a drawn one leaves its place to the last. */
  keys: number[];
  /** Per pattern, per origin: 1 if its match is in the list (`matchMask`). A full scan keeps them as they are, as there. */
  masks: Array<Uint8Array | undefined>;
  /** The cells of the grid the masks are for. */
  N: number;
  /** Where the log was when the turn the node last matched in began (`ip.first[lastMatchedTurn]`); -1 before it has matched. */
  since: number;
  /** The grid's epoch then: another one, and the log no longer holds the changes since (the list is found again, ADR-0268). */
  epoch: number;
  /** Per pattern, per code: the cells of its input that accept the code, (i, j, k) in a row, in the pattern's order (`Rule.ishifts`). */
  shifts: Array<Array<Int32Array | undefined>>;
  /** Per pattern: the codes some cell of its input accepts, null if one takes any (`*`); undefined until asked. */
  accepted: Array<Int32Array | null | undefined>;
}

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
  /** The rules and the symmetry the node was given: under the original's semantics its variants are made again from them (T527). */
  private given: Rule3[];
  private givenSym: Sym;
  /** Under the original's semantics (T527, ADR-0268): its list of matches, made at its first step; undefined in a run of ours. */
  protected orig?: OriginalList;

  /**
   * `inputOnly`: a match is wherever the input fits, as in MarkovJunior, even if it would change nothing (the guided nodes, where a
   * rule that keeps a cell competes with the others); otherwise only where it would change something, as the lab has always done.
   * Under the original's semantics (T527) every match is where the input fits.
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
    this.given = rules;
    this.givenSym = sym;
  }

  reset(): void {
    super.reset();
    this.epoch = -1;
    const o = this.orig;
    if (o) {
      // RuleNode.Reset: the next step scans the grid again. OneNode.Reset empties its list and the masks with it; an all and a prl keep
      // theirs, and the scan starts the list again (the masks of an all as they are, as there).
      o.since = -1;
      if (this.kind === 'one' && o.keys.length) this.unlist(o);
    }
  }

  // ------------------------------------------------ the original's semantics (T527, A1-2, ADR-0268)

  /**
   * The node's list under the original's semantics, for a grid of these layers: the first time (or if the grid's layers change) its
   * variants are made again in SymmetryHelper's order, with the square's subgroups on a flat grid and the cube's on the others.
   */
  protected originalFor(g: Grid3): OriginalList {
    const flat = g.Z === 1;
    if (this.orig?.flat === flat) return this.orig;
    this.patterns = this.given.flatMap((r, i) =>
      originalVariants({ ...parsePattern(r, this.alpha), rule: i, chance: typeof r.p === 'number' && Number.isFinite(r.p) ? r.p : 1 }, r.symmetry ?? this.givenSym, flat),
    );
    this.probes = [];
    this.patternsChanged();
    return (this.orig = { flat, keys: [], masks: [], N: 0, since: -1, epoch: -1, shifts: [], accepted: [] });
  }

  /** What a node keeps of its patterns besides the probes (GuidedRunner), thrown away when they are made again. */
  protected patternsChanged(): void { }

  /** The cells of pattern `pi`'s input that accept code `c`, (i, j, k) in a row, in the pattern's order (`Rule.ishifts`). */
  private shiftsOf(o: OriginalList, pi: number, c: number): Int32Array {
    const per = (o.shifts[pi] ??= []);
    let s = per[c];
    if (s === undefined) {
      const p = this.patterns[pi];
      const out: number[] = [];
      for (let k = 0, n = 0; k < p.dz; k++)
        for (let j = 0; j < p.dy; j++)
          for (let i = 0; i < p.dx; i++, n++) {
            const set = p.input[n];
            if (set === -1 || this.sets[set][c]) out.push(i, j, k);
          }
      s = per[c] = Int32Array.from(out);
    }
    return s;
  }

  /** The codes some cell of pattern `pi`'s input accepts, or null if one takes any (`*`): a row of the grid without any finds nothing. */
  private acceptedOf(o: OriginalList, pi: number): Int32Array | null {
    let a = o.accepted[pi];
    if (a === undefined) {
      const p = this.patterns[pi];
      if (p.input.some((s) => s === -1)) a = null;
      else {
        const flags = new Uint8Array(MAX_CODES);
        for (const s of p.input) {
          const set = this.sets[s];
          for (let c = 0; c < MAX_CODES; c++) if (set[c]) flags[c] = 1;
        }
        const codes: number[] = [];
        for (let c = 0; c < MAX_CODES; c++) if (flags[c]) codes.push(c);
        a = Int32Array.from(codes);
      }
      o.accepted[pi] = a;
    }
    return a;
  }

  /** Whether the match of pattern `pi` at `at` holds now (`Grid.Matches`), in a piece also leaving its frozen cells alone (T339). */
  protected holds(pi: number, g: Grid3, at: number): boolean {
    const pr = this.probe(pi, g);
    if (!RuleRunner.fitsAt(pr, g.cells, at)) return false;
    const mask = RuleRunner.guardOf(g);
    return mask === undefined || RuleRunner.freeAt(pr, g.cells, at, mask, this.kind === 'one');
  }

  /** Whether any of these codes is in row `r` of the census. */
  private static anyIn(rows: Array<Int32Array | undefined>, codes: Int32Array, r: number): boolean {
    for (let t = 0; t < codes.length; t++) {
      const rc = rows[codes[t]];
      if (rc !== undefined && rc[r] > 0) return true;
    }
    return false;
  }

  /**
   * RuleNode.Go's scan of the whole grid, pattern by pattern (rule by rule, each variant in its order): the cells at the pattern's own
   * stride from its far corner, and at each the origins whose pattern takes the cell's code there, in the pattern's order. Every match
   * found, in the original's order, goes into `out`. What finds nothing is skipped, so the order stays: a pattern a cell of which takes no
   * code on the grid; a row of the stride without any code the pattern takes; a row of the stride whose matches would all have their
   * rarest cell (the anchor) in rows of the grid where no code of the anchor is (as the census does for ours, ADR-0142).
   */
  private scanOriginal(g: Grid3, o: OriginalList, out: number[]): void {
    const { X, Y, Z, cells } = g;
    const N = cells.length;
    const XY = X * Y;
    const census = censusOf(g);
    const rows = census.rows;
    const guard = RuleRunner.guardOf(g);
    const one = this.kind === 'one';
    const C = this.alpha.codes.length;
    for (let pi = 0; pi < this.patterns.length; pi++) {
      const p = this.patterns[pi];
      if (p.dx > X || p.dy > Y || p.dz > Z) continue;
      const pr = this.probe(pi, g);
      // The cell of the input with the fewest cells on the grid: none, and the pattern matches nowhere.
      let anchor = -1;
      let fewest = Infinity;
      for (let t = 0; t < pr.inSets.length; t++) {
        let s = 0;
        for (const c of codesOf(pr.inSets[t])) s += census.total[c];
        if (s < fewest) {
          fewest = s;
          anchor = t;
        }
      }
      if (fewest === 0) continue;
      const anchorCodes = anchor >= 0 && fewest < N ? codesOf(pr.inSets[anchor]) : undefined;
      const aj = anchor >= 0 ? pr.inJ[anchor] : 0;
      const ak = anchor >= 0 ? pr.inK[anchor] : 0;
      const accepted = this.acceptedOf(o, pi);
      // The shifts of every code, at hand: the node's own table, filled once.
      for (let c = 0; c < C; c++) this.shiftsOf(o, pi, c);
      const table = o.shifts[pi] as Int32Array[];
      const base = pi * N;
      const { dx, dy, dz } = p;
      for (let z = dz - 1; z < Z; z += dz)
        rows: for (let y = dy - 1; y < Y; y += dy) {
          if (accepted !== null && !RuleRunner.anyIn(rows, accepted, z * Y + y)) continue rows;
          if (anchorCodes !== undefined) {
            let any = false;
            for (let k = 0; k < dz && !any; k++) {
              const sz = z - k;
              if (sz < 0 || sz + dz > Z) continue;
              for (let j = 0; j < dy && !any; j++) {
                const sy = y - j;
                if (sy < 0 || sy + dy > Y) continue;
                any = RuleRunner.anyIn(rows, anchorCodes, (sz + ak) * Y + sy + aj);
              }
            }
            if (!any) continue rows;
          }
          const row = y * X + z * XY;
          for (let x = dx - 1; x < X; x += dx) {
            const sh = table[cells[row + x]];
            for (let l = 0; l < sh.length; l += 3) {
              const sx = x - sh[l], sy = y - sh[l + 1], sz = z - sh[l + 2];
              if (sx < 0 || sy < 0 || sz < 0 || sx + dx > X || sy + dy > Y || sz + dz > Z) continue;
              const at = sx + sy * X + sz * XY;
              if (RuleRunner.fitsAt(pr, cells, at) && (guard === undefined || RuleRunner.freeAt(pr, cells, at, guard, one))) out.push(base + at);
            }
          }
        }
    }
  }

  /**
   * RuleNode.Go after the node's first match: around every cell written since `from` (each once: a cell met again finds what it found),
   * the matches its code makes there, at the end of the list unless they are in it.
   */
  private catchUp(g: Grid3, o: OriginalList, from: number): void {
    const { X, Y, Z, cells, log } = g;
    if (from >= log.length) return;
    const N = cells.length;
    const XY = X * Y;
    if (stamps.length !== N) {
      stamps = new Uint32Array(N);
      stampN = 0;
    }
    const mark = ++stampN;
    const guard = RuleRunner.guardOf(g);
    const one = this.kind === 'one';
    const P = this.patterns.length;
    const probes = this.patterns.map((_, pi) => this.probe(pi, g));
    // What a convolution or a convchain wrote is not in the original's list of changes (T529): those stretches of the log are skipped.
    const unseen = g.unseen !== undefined && g.unseen.epoch === g.epoch ? g.unseen.ranges : undefined;
    let u = 0;
    if (unseen !== undefined) while (u < unseen.length && unseen[u + 1] <= from) u += 2;
    for (let l = from; l < log.length; l++) {
      if (unseen !== undefined && u < unseen.length && l >= unseen[u]) {
        l = unseen[u + 1] - 1;
        u += 2;
        continue;
      }
      const c = log[l];
      if (stamps[c] === mark) continue;
      stamps[c] = mark;
      const v = cells[c];
      const cx = c % X;
      const cy = ((c / X) | 0) % Y;
      const cz = (c / XY) | 0;
      for (let pi = 0; pi < P; pi++) {
        const sh = this.shiftsOf(o, pi, v);
        if (!sh.length) continue;
        const p = this.patterns[pi];
        const pr = probes[pi];
        const mask = (o.masks[pi] ??= new Uint8Array(N));
        const base = pi * N;
        for (let s = 0; s < sh.length; s += 3) {
          const sx = cx - sh[s], sy = cy - sh[s + 1], sz = cz - sh[s + 2];
          if (sx < 0 || sy < 0 || sz < 0 || sx + p.dx > X || sy + p.dy > Y || sz + p.dz > Z) continue;
          const at = sx + sy * X + sz * XY;
          if (mask[at] || !RuleRunner.fitsAt(pr, cells, at) || (guard !== undefined && !RuleRunner.freeAt(pr, cells, at, guard, one))) continue;
          mask[at] = 1;
          o.keys.push(base + at);
        }
      }
    }
  }

  /** The list emptied with its masks. */
  private unlist(o: OriginalList): void {
    const N = o.N;
    for (const key of o.keys) {
      const pi = Math.floor(key / N);
      const m = o.masks[pi];
      if (m) m[key - pi * N] = 0;
    }
    o.keys = [];
  }

  /**
   * RuleNode.Go's list: the first time (or after a reset) a full scan, the list started again and the masks kept; then what the changes since
   * the turn the node last matched in make new. A grid of another size starts everything again; a log that no longer holds those changes
   * (the grid made anew, or the log past its length, ADR-0268) finds the list again from the grid.
   */
  protected update(g: Grid3, o: OriginalList): void {
    const N = g.cells.length;
    if (o.N !== N) {
      o.masks = [];
      o.keys = [];
      o.N = N;
      o.since = -1;
    }
    if (o.since >= 0 && (o.epoch !== g.epoch || o.since > g.log.length)) {
      this.unlist(o);
      o.since = -1;
    }
    if (o.since >= 0) {
      this.catchUp(g, o, o.since);
      return;
    }
    o.keys = [];
    this.scanOriginal(g, o, o.keys);
    for (const key of o.keys) {
      const pi = Math.floor(key / N);
      (o.masks[pi] ??= new Uint8Array(N))[key - pi * N] = 1;
    }
  }

  /** The node has matched in this turn (`lastMatchedTurn = ip.counter`): the next update starts from where the turn began. */
  protected matched(g: Grid3, o: OriginalList): void {
    o.since = turnStart(g);
    o.epoch = g.epoch;
  }

  /** A step of the node under the original's semantics: RuleNode.Go, then OneNode.Go, AllNode.Go or ParallelNode.Go. */
  private goOriginal(g: Grid3, rng: RunRandom): boolean {
    if (this.limit !== undefined && this.count >= this.limit) return false;
    const o = this.originalFor(g);
    if (this.kind === 'prl') return this.prlPut(g, this.prlScan(g, o, rng));
    this.update(g, o);
    this.matched(g, o);
    return this.kind === 'one' ? this.oneOriginal(g, rng, o) : this.allOriginal(g, rng, o);
  }

  /**
   * OneNode.RandomMatch without potentials, and OneNode.Apply: a match drawn uniformly from the list (`p` is not read), out of the list,
   * put if it still holds; one that no longer holds is dropped and another drawn. A match that changes nothing is a step.
   */
  protected oneOriginal(g: Grid3, rng: RunRandom, o: OriginalList): boolean {
    const N = g.cells.length;
    const keys = o.keys;
    while (keys.length > 0) {
      const i = rng.int(keys.length);
      const key = keys[i];
      const pi = Math.floor(key / N);
      const at = key - pi * N;
      o.masks[pi]![at] = 0;
      keys[i] = keys[keys.length - 1];
      keys.pop();
      if (this.holds(pi, g, at)) {
        this.apply(g, key);
        this.count++;
        this.total++;
        return true;
      }
    }
    this.explain(g);
    return false;
  }

  /**
   * AllNode.Go without potentials: the list in the original's shuffle («inside-out», `Next(i + 1)` for i from 0), each match put unless a
   * cell it writes was written in this step (its input is not checked again), every cell it writes in the log; then the list is empty.
   */
  protected allOriginal(g: Grid3, rng: RunRandom, o: OriginalList): boolean {
    const keys = o.keys;
    const n = keys.length;
    if (!n) {
      this.explain(g);
      return false;
    }
    const N = g.cells.length;
    const order = new Int32Array(n);
    for (let i = 0; i < n; i++) {
      const j = rng.int(i + 1);
      order[i] = order[j];
      order[j] = i;
    }
    if (writtenBuf.length !== N) writtenBuf = new Uint8Array(N);
    const touched: number[] = [];
    for (let k = 0; k < n; k++) {
      const key = keys[order[k]];
      const pi = Math.floor(key / N);
      o.masks[pi]![key - pi * N] = 0;
      this.fitOriginal(g, key, writtenBuf, touched);
    }
    for (const idx of touched) writtenBuf[idx] = 0;
    o.keys = [];
    this.count++;
    this.total++;
    return true;
  }

  /** AllNode.Fit: nothing if a cell it writes was written in this step; else every cell it writes, written and in the log. */
  protected fitOriginal(g: Grid3, key: number, written: Uint8Array, touched: number[]): boolean {
    const N = g.cells.length;
    const pi = Math.floor(key / N);
    const at = key - pi * N;
    const { outOff, outVal } = this.probe(pi, g);
    for (let t = 0; t < outOff.length; t++) if (written[at + outOff[t]]) return false;
    for (let t = 0; t < outOff.length; t++) {
      const idx = at + outOff[t];
      written[idx] = 1;
      touched.push(idx);
      writeLogged(g, idx, outVal[t]);
    }
    this.fired[this.patterns[pi].rule]++;
    return true;
  }

  /**
   * ParallelNode.Add over RuleNode.Go's scan: a draw for every match found, in the scan's order (`NextDouble() > p` leaves it out, so
   * `p="0"` never puts it), what it writes judged on the grid as it was and kept only where the cell changes (a rule that would write the
   * value already there does not cover one that changes it), into the step's new grid.
   */
  protected prlScan(g: Grid3, o: OriginalList, rng: RunRandom): { changes: number[]; applied: number } {
    const N = g.cells.length;
    if (prlBuf.length !== N) prlBuf = new Uint8Array(N);
    const found: number[] = [];
    this.scanOriginal(g, o, found);
    if (!found.length) this.explain(g);
    const cells = g.cells;
    const changes: number[] = [];
    let applied = 0;
    for (const key of found) {
      const pi = Math.floor(key / N);
      const p = this.patterns[pi];
      if (rng.next() > (p.chance ?? 1)) continue;
      applied++;
      this.fired[p.rule]++;
      const { outOff, outVal } = this.probe(pi, g);
      const at = key - pi * N;
      for (let t = 0; t < outOff.length; t++) {
        const idx = at + outOff[t];
        if (outVal[t] !== cells[idx]) {
          prlBuf[idx] = outVal[t];
          changes.push(idx);
        }
      }
    }
    return { changes, applied };
  }

  /** ParallelNode.Go: the step's new grid where it changes; a step that puts nothing is a step too, and the node goes on while it puts. */
  protected prlPut(g: Grid3, step: { changes: number[]; applied: number }): boolean {
    for (const idx of step.changes) write(g, idx, prlBuf[idx]);
    this.count++;
    if (step.applied) this.total++;
    return step.applied > 0;
  }

  /** Why the node found nothing the first time it was asked (for a node that never does anything). */
  protected explain(g: Grid3): void {
    if (this.total || this.why) return;
    const total = censusOf(g).total;
    const absent = this.wanted.filter((w) => w !== '.' && !codesOf(this.sets[this.alpha.mask(w)]).some((c) => total[c] > 0));
    this.why = absent.length ? `in quel momento nella griglia non c'erano celle ${absent.map((w) => `"${w}"`).join(', ')}` : 'le celle cercate c\'erano, ma mai disposte come nel pattern';
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

  /**
   * In a piece (T339): whether a match at `o` changes no frozen cell (what it would write where the cell already is does not count).
   * Across the edge of the piece a match is a match: a stair that climbs out of it grows in the margin as it would in the whole grid, and
   * the next piece, which grows it too, keeps the rest. `one` (`needOwn`) picks only where it changes the piece (a match that changes
   * nothing, where it starts), so its steps are the piece's; `all` and `prl` grow in the margin too.
   */
  private static freeAt(pr: Probe, cells: Uint8Array, o: number, mask: Uint8Array, needOwn: boolean): boolean {
    const { outOff, outVal } = pr;
    let own = false, changes = false;
    for (let t = 0; t < outOff.length; t++) {
      const idx = o + outOff[t];
      if (cells[idx] === outVal[t]) continue;
      const m = mask[idx];
      if (m === FROZEN) return false;
      changes = true;
      if (m === OWN) own = true;
    }
    return !needOwn || own || (!changes && mask[o] === OWN);
  }

  /** The guard of the piece running on this grid, if any (T339). */
  private static guardOf(g: Grid3): Uint8Array | undefined {
    return pieceGuard !== undefined && pieceGuard.g === g ? pieceGuard.mask : undefined;
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
    // In a piece (T339) a match must also leave alone the cells the piece may not change: the same scan, one more test per match.
    const mask = RuleRunner.guardOf(g);
    if (nIn === 0) {
      for (let z = 0; z + p.dz <= Z; z++)
        for (let y = 0; y + p.dy <= Y; y++)
          for (let x = 0; x + p.dx <= X; x++) {
            const o = x + y * X + z * XY;
            if ((only || RuleRunner.checkAt(pr, cells, o)) && (mask === undefined || RuleRunner.freeAt(pr, cells, o, mask, this.kind === 'one'))) this.matches.push(base + o);
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
        if (mask !== undefined) {
          const one = this.kind === 'one';
          for (let ox = 0; ox + p.dx <= X; ox++)
            if (aSet[cells[a0 + ox]] && (only ? RuleRunner.fitsAt(pr, cells, o0 + ox) : RuleRunner.checkAt(pr, cells, o0 + ox)) && RuleRunner.freeAt(pr, cells, o0 + ox, mask, one)) this.matches.push(base + o0 + ox);
        } else if (only) {
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
      const mask = RuleRunner.guardOf(g);
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
                if ((only ? RuleRunner.fitsAt(pr, cells, o) : RuleRunner.checkAt(pr, cells, o)) && (mask === undefined || RuleRunner.freeAt(pr, cells, o, mask, this.kind === 'one'))) this.matches.add(base + o);
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

  go(g: Grid3, rng: RunRandom): boolean {
    if (runSemantics() === 'mj') return this.goOriginal(g, rng);
    if (this.limit !== undefined && this.count >= this.limit) return false;
    this.sync(g);
    const keys = this.matches.keys;
    if (!keys.length) {
      this.explain(g);
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
    const cap = potentialCeiling();
    if (want * N * 4 > cap) throw new Mj3Error(`i potenziali di ${want} valori su ${N} celle superano ${Math.round(cap / 2 ** 20)} MB`);
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
      const cap = potentialCeiling();
      if (bytes > cap) throw new Mj3Error(`observe: ${C} valori su ${N} celle con ${rules.length} varianti di regole superano ${Math.round(cap / 2 ** 20)} MB`);
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
  private searchFrom(g: Grid3, rng: RunRandom): Uint8Array[] | null {
    const C = this.alpha.codes.length;
    const { X, Y, Z } = g;
    const { rules } = this.rulesFor(g, true);
    const until = Math.min(Date.now() + INFERENCE_LIMITS.searchMs, current?.deadline ?? Infinity);
    const tries = this.searchLimit < 0 ? 1 : 20;
    let boards = 0;
    let why = '';
    for (let k = 0; k < tries; k++) {
      const seed = rng.seed();
      const out = search(new Uint8Array(g.cells), this.future, rules, X, Y, Z, C, this.kind === 'all', {
        boards: Math.min(this.searchLimit < 0 ? Infinity : this.searchLimit, INFERENCE_LIMITS.boards),
        bytes: INFERENCE_LIMITS.boardBytes,
        children: INFERENCE_LIMITS.children,
        until,
      }, this.depthCoefficient, rng.spawn(seed));
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
  private scored(g: Grid3, rng: RunRandom): Array<[number, number]> {
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

  protected patternsChanged(): void {
    this.deltas = [];
    this.prepared = undefined;
  }

  /** The observations, the first time (or on another grid): the present and the future, then the trajectory or the potentials. False if the node stops. */
  private observeFirst(g: Grid3, rng: RunRandom, N: number): boolean {
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
    return true;
  }

  /** The fields' potentials, at the node's first step and where they are computed again: false if the node stops (RuleNode.Go). */
  private fieldsReady(g: Grid3, N: number): boolean {
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
    return true;
  }

  /**
   * Under the original's semantics (T527, A1-2, ADR-0268): RuleNode.Go on the original's list (for a `prl` its scan, with the draws, comes
   * before the fields, and if they stop the node its changes are in the log and the grid stays), then OneNode.RandomMatch and AllNode.Go
   * with the potentials: every match in the list's order, a `one` dropping those that no longer hold, a draw for each with a heuristic;
   * a `one` takes the largest key above -1000, an `all` puts them largest first and counts its step even if nothing fits. What the
   * observations write and the search are as in ours: A1-5 (T530) aligns them.
   */
  private goGuidedOriginal(g: Grid3, rng: RunRandom): boolean {
    if (this.limit !== undefined && this.count >= this.limit) return false;
    const N = g.cells.length;
    const o = this.originalFor(g);
    if (!this.observeFirst(g, rng, N)) return false;
    const prl = this.kind === 'prl' ? this.prlScan(g, o, rng) : undefined;
    if (!prl) this.update(g, o);
    if (!this.fieldsReady(g, N)) {
      if (prl) for (const idx of prl.changes) logOnly(g, idx);
      return false;
    }
    if (prl) return this.prlPut(g, prl);
    this.matched(g, o);
    if (this.trajectory) {
      if (this.count >= this.trajectory.length) return false;
      const next = this.trajectory[this.count];
      for (let i = 0; i < N; i++) if (g.cells[i] !== next[i]) write(g, i, next[i]);
      this.count++;
      this.total++;
      return true;
    }
    const guided = this.fields.length > 0 || (this.observations !== undefined && !this.searching);
    const T = this.temperature;
    const keys = o.keys;
    if (this.kind === 'one') {
      if (!guided) return this.oneOriginal(g, rng, o);
      if (this.observations && goalReached(g.cells, this.future)) {
        this.futureComputed = false;
        return false;
      }
      let max = -1000;
      let argmax = -1;
      let first = 0;
      let have = false;
      for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        const pi = Math.floor(key / N);
        const at = key - pi * N;
        if (!this.holds(pi, g, at)) {
          o.masks[pi]![at] = 0;
          keys[k] = keys[keys.length - 1];
          keys.pop();
          k--;
          continue;
        }
        const h = this.heuristic(g, key);
        if (h === null) continue;
        if (!have) {
          first = h;
          have = true;
        }
        const u = rng.next();
        const score = T > 0 ? Math.pow(u, Math.exp((h - first) / T)) : -h + 0.001 * u;
        if (score > max) {
          max = score;
          argmax = k;
        }
      }
      if (argmax < 0) {
        if (!this.total) this.why ??= keys.length ? 'le regole combaciavano, ma ogni applicazione portava dove un potenziale è -1' : 'le celle cercate non c\'erano mai disposte come nel pattern';
        return false;
      }
      // The match stays in the list, as there: it is checked again when it is met.
      this.apply(g, keys[argmax]);
      this.count++;
      this.total++;
      return true;
    }
    if (!guided) return this.allOriginal(g, rng, o);
    if (!keys.length) {
      if (!this.total) this.why ??= 'le celle cercate non c\'erano mai disposte come nel pattern';
      return false;
    }
    const list: Array<[number, number]> = [];
    let first = 0;
    let have = false;
    for (let m = 0; m < keys.length; m++) {
      const h = this.heuristic(g, keys[m]);
      if (h === null) continue;
      if (!have) {
        first = h;
        have = true;
      }
      const u = rng.next();
      list.push([m, T > 0 ? Math.pow(u, Math.exp((h - first) / T)) : -h + 0.001 * u]);
    }
    // LINQ's OrderBy(-key), stable: equal keys keep the list's order. The masks of the matches without a heuristic stay (as there).
    const ordered = list.map((e, i) => [e[0], -e[1], i] as const).sort((a, b) => (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : a[2] - b[2]));
    if (writtenBuf.length !== N) writtenBuf = new Uint8Array(N);
    const touched: number[] = [];
    let any = false;
    for (const [m] of ordered) {
      const key = keys[m];
      const pi = Math.floor(key / N);
      o.masks[pi]![key - pi * N] = 0;
      any = this.fitOriginal(g, key, writtenBuf, touched) || any;
    }
    for (const idx of touched) writtenBuf[idx] = 0;
    o.keys = [];
    this.count++;
    if (any) this.total++;
    else if (!this.total) this.why ??= 'le regole combaciavano, ma ogni applicazione portava dove un potenziale è -1';
    return true;
  }

  go(g: Grid3, rng: RunRandom): boolean {
    if (runSemantics() === 'mj') return this.goGuidedOriginal(g, rng);
    if (this.limit !== undefined && this.count >= this.limit) return false;
    const N = g.cells.length;
    if (!this.observeFirst(g, rng, N)) return false;
    this.sync(g);
    if (!this.fieldsReady(g, N)) return false;
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

/** The neighbours of a cell on a flat grid: those of the same layer (MarkovJunior's 2D kernels, T529). */
const inPlane = (offsets: Vec3[]): Vec3[] => offsets.filter((o) => o[2] === 0);

class ConvRunner extends Runner {
  private rules: Array<{ i: number; input: number; output: number; neighbors: number; sums: Uint8Array; p: number; weights: Int32Array | null }>;
  private offsets: Vec3[];
  private sets: Uint8Array[];
  private periodic: boolean;
  /**
   * Under the original's semantics (T529): the steps it says (MarkovJunior's `steps`, none unlimited: until nothing changes) and its
   * neighbours on a flat grid, those of the layer.
   */
  private originalSteps?: number;
  private flatOffsets: Vec3[];
  constructor(node: { rules: ConvRule[]; neighborhood?: string; steps?: number; periodic?: boolean }, alpha: Alphabet) {
    super(node.steps === Infinity ? CONV_UNLIMITED : Math.max(1, Math.min(30, node.steps ?? 1)));
    if (!Array.isArray(node.rules) || !node.rules.length) throw new Mj3Error('nodo conv senza regole');
    this.offsets = node.neighborhood === 'vonneumann' ? VON_NEUMANN : node.neighborhood === 'nocorners' ? NO_CORNERS : MOORE;
    this.flatOffsets = inPlane(this.offsets);
    this.originalSteps = typeof node.steps === 'number' && Number.isInteger(node.steps) && node.steps > 0 ? node.steps : undefined;
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
      const input = alpha.mask(r.in);
      const output = alpha.index(r.out);
      const neighbors = alpha.mask(r.neighbors);
      // Under the original's semantics (T529) the sum counts each value as many times as it is listed (a union: each of its values); a rule
      // every count of which fires (one without `values` and `sum`) sums nothing. Read once the codes are made, in the order ours makes them.
      let weights: Int32Array | null = new Int32Array(MAX_CODES);
      for (const ch of r.neighbors) for (const v of alpha.unions.get(ch) ?? ch) if (v !== '[' && v !== ']') weights[alpha.index(v)]++;
      if (weights.every((w) => w <= 1) && sums.every((on) => on === 1)) weights = null;
      return { i, input, output, neighbors, sums, p: typeof r.p === 'number' ? r.p : 1, weights };
    });
  }
  go(g: Grid3, rng: RunRandom): boolean {
    if (runSemantics() === 'mj') return this.goOriginal(g, rng);
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

  /**
   * MarkovJunior's ConvolutionNode.Go (T529, A1-4): the steps it says, or until nothing changes; every step counted, also one that changes
   * nothing (which is false); the neighbours of the layer on a flat grid (its 2D kernels: VonNeumann 4, Moore 8), of the cube on the others
   * (VonNeumann 6, NoCorners 18; Moore 26 and NoCorners on a flat grid, which the original does not load, are ours), wrapping round each
   * axis once if `periodic`; for each cell in order, the first rule whose input is the cell, whose output is not, whose chance
   * (`Next() < p·(2³¹ − 1)`, drawn only if `p` is not 1) and whose sum of the listed values agree. What it writes is not in the list of
   * changes (`unseenFrom`).
   */
  private goOriginal(g: Grid3, rng: RunRandom): boolean {
    if (this.originalSteps !== undefined && this.count >= this.originalSteps) return false;
    this.count++;
    const changes: number[] = [];
    const { X, Y, Z, cells } = g;
    const XY = X * Y;
    const wrap = (v: number, n: number) => (v < 0 ? v + n : v >= n ? v - n : v);
    const census = censusOf(g);
    const inputs = [...new Set(this.rules.flatMap((r) => [...codesOf(this.sets[r.input])]))].filter((c) => census.rows[c] !== undefined && census.total[c] > 0);
    const rowsOf = inputs.map((c) => census.rows[c]!);
    const offs = Z === 1 ? this.flatOffsets : this.offsets;
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
          for (const rule of this.rules) {
            if (!this.sets[rule.input][c] || rule.output === c) continue;
            if (rule.p !== 1 && !(rng.seed() < rule.p * 2147483647)) continue;
            const w = rule.weights;
            if (w !== null) {
              let n = 0;
              for (let t = 0; t < nOff; t++) {
                let nx = x + ox[t], ny = y + oy[t], nz = z + oz[t];
                if (this.periodic) {
                  nx = wrap(nx, X);
                  ny = wrap(ny, Y);
                  nz = wrap(nz, Z);
                } else if (nx < 0 || ny < 0 || nz < 0 || nx >= X || ny >= Y || nz >= Z) continue;
                n += w[cells[nx + ny * X + nz * XY]];
              }
              if (!(n < rule.sums.length && rule.sums[n])) continue;
            }
            changes.push(idx, rule.output);
            this.fired[rule.i]++;
            break;
          }
        }
      }
    if (!changes.length) return false;
    const from = g.log.length, epoch = g.epoch;
    for (let i = 0; i < changes.length; i += 2) write(g, changes[i], changes[i + 1]);
    unseenFrom(g, from, epoch);
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
  /** MarkovJunior's `edges` and `vertices` (T529): read only under the original's semantics. */
  private edges: boolean;
  private vertices: boolean;
  /** Under the original's semantics, the distances of the last step (MarkovJunior's `generations`) and the frontier, kept for the next. */
  private generations = new Int32Array(0);
  private frontier = new Int32Array(0);
  constructor(node: { from: string; to: string; on: string; color: string; steps?: number; inertia?: boolean; longest?: boolean; edges?: boolean; vertices?: boolean }, alpha: Alphabet) {
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
    this.edges = node.edges === true;
    this.vertices = node.vertices === true;
  }
  /**
   * Without an array per cell (T315): the same walk as before, the neighbours in the order of VON_NEUMANN and the same draws, so the
   * same grid voxel for voxel (tests/mj-path.test.ts); a maze of the site's page solved in a fraction of the time, even before the JIT.
   */
  go(g: Grid3, rng: RunRandom): boolean {
    if (this.limit !== undefined && this.count >= this.limit) return false;
    if (runSemantics() === 'mj') return this.goOriginal(g, rng);
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

  /**
   * MarkovJunior's PathNode.Go (T529, A1-4): the distances grow from every `to` cell over `on` cells, reaching `from` cells too without
   * going on from them, by faces, and with `edges` and `vertices` by edges and (in 3D) corners; with a `from` cell reached, a generator
   * of its own (`new Random(ip.random.Next())`) draws a noise of 0.1 for every reached start, in the grid's order, and the pen starts from
   * the nearest (`longest`: the farthest), then walks down one distance at a time to a `to` cell, every cell on its way written `color`
   * and put in the list of changes, also one that already was. It succeeds whenever a start is reached, even if it draws nothing.
   */
  private goOriginal(g: Grid3, rng: RunRandom): boolean {
    const { X, Y, Z, cells } = g;
    const N = cells.length;
    const XY = X * Y;
    const start = this.sets[this.from];
    const finish = this.sets[this.to];
    const on = this.sets[this.on];
    if (this.generations.length !== N) {
      this.generations = new Int32Array(N);
      this.frontier = new Int32Array(N);
    }
    const gen = this.generations;
    gen.fill(-1);
    const frontier = this.frontier;
    let tail = 0;
    const starts: number[] = [];
    for (let i = 0; i < N; i++) {
      const c = cells[i];
      if (start[c] === 1) starts.push(i);
      if (finish[c] === 1) {
        gen[i] = 0;
        frontier[tail++] = i;
      }
    }
    if (!starts.length || !tail) {
      if (!this.total) this.why ??= !tail ? 'in quel momento non c\'era nessuna cella di arrivo ("to")' : 'in quel momento non c\'era nessuna cella di partenza ("from")';
      return false;
    }
    const dirs = new Int32Array(78);
    for (let head = 0; head < tail; head++) {
      const c = frontier[head];
      const t = gen[c] + 1;
      const k = this.directions(c, X, Y, Z, dirs);
      for (let d = 0; d < k; d += 3) {
        const n = c + dirs[d] + dirs[d + 1] * X + dirs[d + 2] * XY;
        if (gen[n] !== -1) continue;
        const v = cells[n];
        if (on[v] === 1) {
          gen[n] = t;
          frontier[tail++] = n;
        } else if (start[v] === 1) gen[n] = t;
      }
    }
    let reached = false;
    for (const i of starts) if (gen[i] > 0) reached = true;
    if (!reached) {
      if (!this.total) this.why ??= 'le celle di partenza ("from") c\'erano, ma nessuna era collegata all\'arrivo da celle "on"';
      return false;
    }
    const local = rng.spawn(rng.seed());
    let min = N, max = -2, argmin = -1, argmax = -1;
    for (const i of starts) {
      const d = gen[i];
      if (d === -1) continue;
      const noise = 0.1 * local.next();
      if (d + noise < min) {
        min = d + noise;
        argmin = i;
      }
      if (d + noise > max) {
        max = d + noise;
        argmax = i;
      }
    }
    let pen = this.longest ? argmax : argmin;
    let dir = this.step(pen, 0, 0, 0, g, local, dirs);
    pen += dir[0] + dir[1] * X + dir[2] * XY;
    while (gen[pen] !== 0) {
      writeLogged(g, pen, this.color);
      dir = this.step(pen, dir[0], dir[1], dir[2], g, local, dirs);
      pen += dir[0] + dir[1] * X + dir[2] * XY;
    }
    this.count++;
    this.total++;
    return true;
  }

  /**
   * PathNode.Directions: the neighbours of cell `c` inside the grid, (dx, dy, dz) in a row into `out`, in the original's order: the faces
   * (−x, +x, −y, +y, then −z, +z in 3D), with `edges` the edges, with `vertices` the corners (in 3D only); how many numbers.
   */
  private directions(c: number, X: number, Y: number, Z: number, out: Int32Array): number {
    const x = c % X;
    const y = ((c / X) | 0) % Y;
    const z = (c / (X * Y)) | 0;
    let k = 0;
    const put = (dx: number, dy: number, dz: number) => {
      out[k++] = dx;
      out[k++] = dy;
      out[k++] = dz;
    };
    const xl = x > 0, xh = x < X - 1, yl = y > 0, yh = y < Y - 1, zl = z > 0, zh = z < Z - 1;
    if (xl) put(-1, 0, 0);
    if (xh) put(1, 0, 0);
    if (yl) put(0, -1, 0);
    if (yh) put(0, 1, 0);
    if (Z === 1) {
      if (this.edges) {
        if (xl && yl) put(-1, -1, 0);
        if (xl && yh) put(-1, 1, 0);
        if (xh && yl) put(1, -1, 0);
        if (xh && yh) put(1, 1, 0);
      }
      return k;
    }
    if (zl) put(0, 0, -1);
    if (zh) put(0, 0, 1);
    if (this.edges) {
      if (xl && yl) put(-1, -1, 0);
      if (xl && yh) put(-1, 1, 0);
      if (xh && yl) put(1, -1, 0);
      if (xh && yh) put(1, 1, 0);
      if (xl && zl) put(-1, 0, -1);
      if (xl && zh) put(-1, 0, 1);
      if (xh && zl) put(1, 0, -1);
      if (xh && zh) put(1, 0, 1);
      if (yl && zl) put(0, -1, -1);
      if (yl && zh) put(0, -1, 1);
      if (yh && zl) put(0, 1, -1);
      if (yh && zh) put(0, 1, 1);
    }
    if (this.vertices) {
      if (xl && yl && zl) put(-1, -1, -1);
      if (xl && yl && zh) put(-1, -1, 1);
      if (xl && yh && zl) put(-1, 1, -1);
      if (xl && yh && zh) put(-1, 1, 1);
      if (xh && yl && zl) put(1, -1, -1);
      if (xh && yl && zh) put(1, -1, 1);
      if (xh && yh && zl) put(1, 1, -1);
      if (xh && yh && zh) put(1, 1, 1);
    }
    return k;
  }

  /**
   * PathNode.Direction: where the pen goes from cell `c`, having come by (dx, dy, dz): to a neighbour one distance nearer. By faces, with
   * `inertia` straight on if it can, else one of them drawn (`Next(n)`); by edges or corners, with `inertia` the one most in line with
   * where it came from, a noise of 0.1 drawn for each, else one drawn. With none (a start that is also an arrival), the original stops with
   * an error.
   */
  private step(c: number, dx: number, dy: number, dz: number, g: Grid3, random: RunRandom, dirs: Int32Array): [number, number, number] {
    const { X, Y, Z } = g;
    const XY = X * Y;
    const gen = this.generations;
    const want = gen[c] - 1;
    const x = c % X;
    const y = ((c / X) | 0) % Y;
    const z = (c / XY) | 0;
    const moving = dx !== 0 || dy !== 0 || dz !== 0;
    const candidates: number[] = [];
    if (!this.edges && !this.vertices) {
      if (moving && this.inertia) {
        const cx = x + dx, cy = y + dy, cz = z + dz;
        if (cx >= 0 && cy >= 0 && cz >= 0 && cx < X && cy < Y && cz < Z && gen[cx + cy * X + cz * XY] === want) return [dx, dy, dz];
      }
      const add = (ex: number, ey: number, ez: number) => {
        if (gen[c + ex + ey * X + ez * XY] === want) candidates.push(ex, ey, ez);
      };
      if (x > 0) add(-1, 0, 0);
      if (x < X - 1) add(1, 0, 0);
      if (y > 0) add(0, -1, 0);
      if (y < Y - 1) add(0, 1, 0);
      if (z > 0) add(0, 0, -1);
      if (z < Z - 1) add(0, 0, 1);
    } else {
      const k = this.directions(c, X, Y, Z, dirs);
      for (let d = 0; d < k; d += 3) if (gen[c + dirs[d] + dirs[d + 1] * X + dirs[d + 2] * XY] === want) candidates.push(dirs[d], dirs[d + 1], dirs[d + 2]);
      if (this.inertia && moving) {
        let best = -4;
        let pick = -1;
        for (let t = 0; t < candidates.length; t += 3) {
          const noise = 0.1 * random.next();
          const ex = candidates[t], ey = candidates[t + 1], ez = candidates[t + 2];
          const cos = (ex * dx + ey * dy + ez * dz) / Math.sqrt((ex * ex + ey * ey + ez * ez) * (dx * dx + dy * dy + dz * dz));
          if (cos + noise > best) {
            best = cos + noise;
            pick = t;
          }
        }
        if (pick < 0) throw new Mj3Error("path: la penna non trova una cella più vicina all'arrivo (una partenza che è anche un arrivo?): l'originale si ferma con un errore");
        return [candidates[pick], candidates[pick + 1], candidates[pick + 2]];
      }
    }
    const n = candidates.length / 3;
    const pick = random.int(n);
    if (!n) throw new Mj3Error("path: la penna non trova una cella più vicina all'arrivo (una partenza che è anche un arrivo?): l'originale si ferma con un errore");
    return [candidates[3 * pick], candidates[3 * pick + 1], candidates[3 * pick + 2]];
  }
}

/** Scales the grid (see the header): the program goes on at the new resolution. */
class MapRunner extends Runner {
  private scale: Vec3;
  /** The denominators of the factors (T335): 1 unless the scale is a fraction. */
  private divide: Vec3;
  private rules: Array<{ d: Vec3; D: Vec3; input: Int32Array; output: Int16Array }>;
  /** The rules as written, and the symmetry: under the original's semantics their turns are SymmetryHelper's, for the old grid's layers (T527). */
  private base: Array<{ d: Vec3; D: Vec3; input: Int32Array; output: Int16Array }>;
  private sym: Sym;
  private original?: { flat: boolean; rules: Array<{ d: Vec3; D: Vec3; input: Int32Array; output: Int16Array }> };
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
    this.base = (node.rules ?? []).map((r) => {
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
      return { d, D, input, output };
    });
    this.sym = node.symmetry ?? 'xy';
    // Every turn of the rule (in and out turned alike), without duplicates.
    this.rules = this.base.flatMap(({ d, D, input, output }) => {
      const seen = new Set<string>();
      return symmetries(this.sym).flatMap(({ perm, flip }) => {
        const [ti, nd] = turnCells(input, d, perm, flip);
        const [to, nD] = turnCells(output, D, perm, flip);
        const key = `${nd.join(',')}|${nD.join(',')}|${ti.join(',')}|${to.join(',')}`;
        if (seen.has(key)) return [];
        seen.add(key);
        return [{ d: nd, D: nD, input: ti, output: to }];
      });
    });
  }
  /** MapNode.Load under the original's semantics: every rule's turns in SymmetryHelper's order, the square's on a flat old grid (T527). */
  private originalRules(flat: boolean): Array<{ d: Vec3; D: Vec3; input: Int32Array; output: Int16Array }> {
    if (this.original?.flat !== flat)
      this.original = { flat, rules: this.base.flatMap((r) => originalTurns({ input: r.input, output: r.output, d: r.d, D: r.D }, this.sym, flat).map((t) => ({ d: t.d, D: t.D, input: t.input, output: t.output }))) };
    return this.original.rules;
  }
  go(g: Grid3): boolean {
    if (this.count >= 1) return false;
    this.count++;
    this.total++;
    const rules = runSemantics() === 'mj' ? this.originalRules(g.Z === 1) : this.rules;
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
    for (const r of rules) {
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

  go(g: Grid3, rng: RunRandom): boolean {
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
    const cap = current?.ceilings;
    if (cap && (g.cells.length > cap.waveCells || bytes > cap.waveBytes))
      throw new Mj3Error(`wfc: nel mondo l'onda sta su al più ${cap.waveCells} celle e ${Math.round(cap.waveBytes / 2 ** 20)} MB (qui ${g.cells.length} celle, ${Math.ceil(bytes / 2 ** 20)} MB): una griglia più piccola prima della wfc, o meno tessere`);
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

/**
 * MarkovJunior's <convchain> (T335): see `ConvChainNode`. On a flat grid as the original (ConvChain.cs); on a grid of more layers (T469,
 * ADR-0240) every layer that holds `on` cells is a flat grid of its own: the same windows, wrapping round its edges, swept in turn from the
 * bottom. A flat grid draws and writes what it always did: one layer, its cells.
 */
class ConvChainRunner extends Runner {
  private weights: Float64Array;
  private N: number;
  private temperature: number;
  private c0: number;
  private c1: number;
  private on: number;
  private substrate?: Uint8Array;
  /** The layers that hold `on` cells, from the bottom: a flat grid has its one. */
  private layers: number[] = [];
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
    this.layers = [];
  }
  rewind(): void {
    this.reset();
  }
  go(g: Grid3, rng: RunRandom): boolean {
    if (this.limit !== undefined && this.counter >= this.limit) return false;
    const total = g.X * g.Y;
    const mj = runSemantics() === 'mj';
    // Under the original's semantics (T529) what it writes is not in the list of changes (ConvChainNode writes `state` directly).
    const from = g.log.length, epoch = g.epoch;
    if (this.counter === 0) {
      // The cells a sweep visits are those of the layers that hold `on` cells: counted before anything is drawn.
      const layers: number[] = [];
      for (let z = 0; z < g.Z; z++) if (g.cells.subarray(z * total, (z + 1) * total).includes(this.on)) layers.push(z);
      // Without `on` cells it does nothing, now or later. The original's first step without them is counted all the same, and the next
      // ones sweep a grid without cells to change, drawing and succeeding (T529): so it does, on a flat grid, under its semantics.
      if (!layers.length) {
        if (!mj) return false;
        this.counter++;
        this.count++;
        this.substrate = new Uint8Array(g.cells.length);
        this.layers = g.Z === 1 ? [0] : [];
        return false;
      }
      const visits = layers.length * total;
      if (g.Z > 1 && visits > WFC_LIMITS.convchainCells)
        throw new Mj3Error(`convchain: su una griglia di più strati lavora su al più ${WFC_LIMITS.convchainCells} celle, quelle degli strati che hanno le sue celle "on" (qui ${visits})`);
      const cap = current?.ceilings?.convchainCells;
      if (cap !== undefined && visits > cap)
        throw new Mj3Error(`convchain: nel mondo lavora su al più ${cap} celle, quelle degli strati che hanno le sue celle "on" (qui ${visits}: ${layers.length} strat${layers.length === 1 ? 'o' : 'i'} di ${g.X}×${g.Y}): meno strati o una griglia più piccola, il piano prima della map`);
      const substrate = new Uint8Array(g.cells.length);
      for (let i = 0; i < g.cells.length; i++)
        if (g.cells[i] === this.on) {
          write(g, i, rng.int(2) === 0 ? this.c0 : this.c1);
          substrate[i] = 1;
        }
      this.substrate = substrate;
      this.layers = layers;
      this.counter++;
      this.count++;
      this.total++;
      if (mj) unseenFrom(g, from, epoch);
      return true;
    }
    for (const z of this.layers) this.sweep(g, rng, this.substrate!, z * total);
    this.counter++;
    this.count++;
    this.total++;
    if (mj) unseenFrom(g, from, epoch);
    return true;
  }
  /** A sweep of the layer that starts at cell `off` (ConvChain.cs): as many draws as its cells, each change kept as the sample's windows say. */
  private sweep(g: Grid3, rng: RunRandom, substrate: Uint8Array, off: number): void {
    const MX = g.X, MY = g.Y, N = this.N;
    const total = MX * MY;
    const cells = g.cells.subarray(off, off + total);
    for (let k = 0; k < total; k++) {
      const r = rng.int(total);
      if (!substrate[off + r]) continue;
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
      write(g, off + r, cells[r] === this.c0 ? this.c1 : this.c0);
    }
  }
}

/** What a piece did (T339): where it is in the grid (its own cells, full height), how long it ran, how many steps, whether it finished. */
export interface PieceReport {
  x: number;
  y: number;
  w: number;
  h: number;
  ms: number;
  steps: number;
  finished: boolean;
}

/** The reports of the pieces of the run in progress (T339), for its result; and their steps, which the run's count includes. */
let pieceReports: PieceReport[] = [];
let piecesSteps = 0;

/**
 * `<pieces>` (T339, ADR-0178): the grid cut into pieces of `size` cells, full height, in rows from the back. Each piece runs the node's
 * children alone, from the start, on a window of its own cells and `margin` more on every side: its own random generator (from one draw
 * of the run's), its own time, its own census and matches, so a piece of a large grid costs what a small grid costs. Of the window only
 * the piece's own cells go back to the grid. A rule never matches where it would change a frozen cell, and `write` never changes one;
 * `one` picks only where it changes the piece. With `halo="before"` a piece reads the grid as it was when the node started (the pieces do
 * not depend on each other); with `written`, what the pieces before it wrote. With `edge="frozen"` the margin is read and never changes;
 * with `grow` the rules may change it too (cells of earlier pieces with `written` excepted), and those changes are thrown away: a rule
 * that is the same wherever it runs and looks no farther than the margin gives in a piece what it gives in the whole grid.
 */
class PiecesRunner extends Runner {
  private root: Runner;
  private size: [number, number];
  private margin: number;
  private time: number;
  private halo: 'before' | 'written';
  private edge: 'frozen' | 'grow';
  /** Under the original's semantics (T528): a piece runs its nodes as the original's interpreter, a turn at a time to the branch that has it. */
  private mj: boolean;
  constructor(node: PiecesNode, alpha: Alphabet, private limits: GridLimits, depth: number, trace?: Trace, mj = false) {
    super(1);
    const [px, py] = Array.isArray(node.size) ? node.size : [];
    if (!isInt(px, 1, 4096) || !isInt(py, 1, 4096)) throw new Mj3Error('pieces: il lato di un pezzo ("piece") vuole due interi (x e y) da 1 a 4096');
    const margin = node.margin ?? PIECE_DEFAULTS.margin;
    if (!isInt(margin, 0, PIECE_DEFAULTS.maxMargin)) throw new Mj3Error(`pieces: "margin" va da 0 a ${PIECE_DEFAULTS.maxMargin}`);
    const most = limits.pieces?.pieceMs ?? PIECE_DEFAULTS.pieceMs;
    if (node.time !== undefined && !isInt(node.time, 1, Number.MAX_SAFE_INTEGER)) throw new Mj3Error('pieces: "time" è un numero di millisecondi');
    if (node.halo !== undefined && node.halo !== 'before' && node.halo !== 'written') throw new Mj3Error('pieces: "halo" è before o written');
    if (node.edge !== undefined && node.edge !== 'frozen' && node.edge !== 'grow') throw new Mj3Error('pieces: "edge" è frozen o grow');
    if (!Array.isArray(node.children) || !node.children.length) throw new Mj3Error('pieces senza nodi dentro');
    this.size = [px, py];
    this.margin = margin;
    this.time = Math.min(node.time ?? most, most);
    this.halo = node.halo ?? 'before';
    this.edge = node.edge ?? 'grow';
    // The trace sees the node as one step; its nodes are not watched one by one (another grid, a piece at a time).
    const kids = node.children.map((c) => compile(c, alpha, limits, depth + 1, trace, undefined, true, mj));
    this.mj = mj;
    this.root = mj ? new OriginalBranch(kids, false, false, false) : kids.length === 1 ? kids[0] : new SequenceRunner(kids);
  }
  reset(): void {
    super.reset();
    this.root.reset();
  }
  rewind(): void {
    this.reset();
  }
  go(g: Grid3, rng: RunRandom): boolean {
    if (this.count >= 1) return false;
    this.count++;
    this.total++;
    const { X, Y, Z } = g;
    const [PX, PY] = this.size;
    const cols = Math.ceil(X / PX), rows = Math.ceil(Y / PY);
    const most = this.limits.pieces?.count ?? PIECE_DEFAULTS.count;
    if (cols * rows > most) throw new Mj3Error(`pieces: ${cols * rows} pezzi di ${PX}×${PY} su ${X}×${Y}, al più ${most}`);
    const own = this.limits.pieces;
    const outer = current;
    const outerGuard = pieceGuard;
    const started = Date.now();
    const base = rng.seed();
    // `before`: every piece reads the grid as it was; the pieces write back into the grid itself, which only `written` reads.
    const source = this.halo === 'before' ? new Uint8Array(g.cells) : g.cells;
    const m = this.margin;
    const XY = X * Y;
    let late = false;
    let slowest = 0;
    let index = 0;
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < cols; col++, index++) {
        const x0 = col * PX, x1 = Math.min(X, x0 + PX), y0 = row * PY, y1 = Math.min(Y, y0 + PY);
        const wx0 = Math.max(0, x0 - m), wx1 = Math.min(X, x1 + m), wy0 = Math.max(0, y0 - m), wy1 = Math.min(Y, y1 + m);
        const W = wx1 - wx0, H = wy1 - wy0;
        const cells = new Uint8Array(W * H * Z);
        const mask = new Uint8Array(W * H * Z);
        for (let z = 0; z < Z; z++)
          for (let y = wy0; y < wy1; y++) {
            const at = (y - wy0) * W + z * W * H;
            cells.set(source.subarray(wx0 + y * X + z * XY, wx1 + y * X + z * XY), at);
            if (z > 0) continue;
            for (let x = wx0; x < wx1; x++) {
              const inside = x >= x0 && x < x1 && y >= y0 && y < y1;
              // With `written`, a cell of a piece before this one is what that piece wrote: it stays as it is.
              const earlier = this.halo === 'written' && Math.floor(y / PY) * cols + Math.floor(x / PX) < index;
              mask[at + x - wx0] = inside ? OWN : this.edge === 'frozen' || earlier ? FROZEN : LOOSE;
            }
          }
        // The mask is the same at every height: full columns.
        for (let z = 1; z < Z; z++) mask.copyWithin(z * W * H, 0, W * H);
        const pg: Grid3 = { X: W, Y: H, Z, cells, alphabet: g.alphabet, log: [], epoch: 0 };
        const t0 = Date.now();
        // Its own time, within what is left of the pieces' total (or of the run, when the limits do not give pieces their own).
        const left = own ? own.totalMs - piecesTime - (t0 - started) : (outer?.deadline ?? Infinity) - t0;
        const deadline = t0 + Math.max(0, Math.min(this.time, left));
        const cap = own?.steps ?? PIECE_DEFAULTS.steps;
        let steps = 0;
        let done = true;
        const ctx: NonNullable<typeof current> = { ...(outer ?? {}), g: pg, census: undefined, deadline, turn: 0 };
        current = ctx;
        pieceGuard = { g: pg, mask };
        this.root.reset();
        // Under the original's semantics the piece's root has the turn first (T528).
        if (this.mj) ctx.branch = this.root as OriginalBranch;
        const prng = rng.spawn(hash32(base, index));
        try {
          for (;;) {
            if (steps >= cap || Date.now() > deadline) {
              done = false;
              break;
            }
            if (this.mj) {
              // Every turn is a step of the piece, the last one too, in which its nodes are done (Interpreter.Run).
              if (!originalTurn(ctx, pg, prng)) break;
              steps++;
              if (!ctx.branch) break;
              continue;
            }
            // Where the piece's turn begins in its own log (T527).
            ctx.turn = pg.log.length;
            if (!this.root.go(pg, prng)) break;
            steps++;
          }
        } catch (e) {
          if (!(e instanceof Mj3Late)) throw e;
          done = false;
        } finally {
          current = outer;
          pieceGuard = outerGuard;
        }
        // Its own cells, row by row, back to the grid.
        for (let z = 0; z < Z; z++)
          for (let y = y0; y < y1; y++) {
            const at = x0 - wx0 + (y - wy0) * W + z * W * H;
            g.cells.set(cells.subarray(at, at + x1 - x0), x0 + y * X + z * XY);
          }
        const ms = Date.now() - t0;
        slowest = Math.max(slowest, ms);
        piecesSteps += steps;
        pieceReports.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0, ms, steps, finished: done });
        if (!done) late = true;
      }
    // The grid changed under the census and the nodes' matches: whoever comes next looks at it again.
    if (current?.g === g) current.census = undefined;
    g.log.length = 0;
    g.epoch++;
    const spent = Date.now() - started;
    if (own) {
      piecesTime += spent;
      if (current?.deadline !== undefined) current.deadline += spent;
    }
    this.note = `${cols * rows} pezzi di ${PX}×${PY} (margine ${m}) in ${(spent / 1000).toFixed(1)} s, il più lento ${(slowest / 1000).toFixed(1)} s${late ? ', non tutti finiti' : ''}`;
    if (late) throw new Mj3Late();
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
  go(g: Grid3, rng: RunRandom): boolean {
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
  go(g: Grid3, rng: RunRandom): boolean {
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

/**
 * MarkovJunior's Branch under the original's semantics (T528, A1-3; Node.cs, Interpreter.cs), for a sequence, a markov and the branch
 * of a map or a wfc. The branch at work has the turn (`current.branch`, `ip.current`): the run asks it, not the root, so a branch that has
 * begun keeps the turn until it is done. A branch goes on from the child it was at (a markov from its first, MarkovNode.Go) and gives the
 * turn to a child branch before asking it; one that finds nothing to do gives the turn back to its parent and starts anew, its children
 * with it (Branch.Reset): that turn is a step in which nothing was done, and the parent, asked again, asks it again from its beginning. Its
 * children start anew only then: a child's `steps` count for as long as the branch lasts. A map's or a wfc's branch has no parent: when
 * its nodes are done, the run is. A wave without a solution gives the turn back without being done (WFCNode.Go: the turn stays where it
 * was), and, asked again, tries again.
 */
class OriginalBranch extends Runner {
  /** The child it is at (`Branch.n`). */
  private n = 0;
  /** The first child of a gated branch did something since the branch started (the wave has a solution). */
  private opened = false;
  /** Who gets the turn back when this branch is done: null for the root and for a branch that `closes`. */
  parent: OriginalBranch | null = null;
  /** `markov`: from its first child at every step. `closes`: a map's or a wfc's branch (no parent). `gated`: a wfc's (its first child the wave). */
  constructor(private nodes: Runner[], private markov: boolean, readonly closes: boolean, private gated: boolean) {
    super();
    for (const c of nodes) if (c instanceof OriginalBranch) c.parent = c.closes ? null : this;
  }
  reset(): void {
    super.reset();
    this.n = 0;
    this.opened = false;
    for (const c of this.nodes) c.reset();
  }
  rewind(): void {
    super.rewind();
    this.n = 0;
    this.opened = false;
    for (const c of this.nodes) c.rewind();
  }
  go(g: Grid3, rng: RunRandom): boolean {
    const ctx = current!;
    if (this.markov) this.n = 0;
    for (; this.n < this.nodes.length; this.n++) {
      const node = this.nodes[this.n];
      if (node instanceof OriginalBranch) ctx.branch = node;
      if (node.go(g, rng)) {
        if (this.n === 0) this.opened = true;
        return true;
      }
      // A wave without a solution: the branch is not done, and the turn stays where it is.
      if (this.gated && this.n === 0 && !this.opened) return false;
    }
    // `ip.current = ip.current.parent`: the turn's branch is this one, but for a wave without a solution that kept it.
    ctx.branch = ctx.branch ? ctx.branch.parent : null;
    if (keeping) this.rewind();
    else this.reset();
    return false;
  }
}

/** What the original's interpreter runs (Interpreter.Load): a branch, or the node inside a markov; a lone map or wfc is a branch of its own. */
function originalRoot(r: Runner, node: Node3): OriginalBranch {
  if (r instanceof OriginalBranch) return r;
  if (node.type === 'map' || node.type === 'wfc') return new OriginalBranch([r], false, true, node.type === 'wfc');
  return new OriginalBranch([r], true, false, false);
}

/**
 * One turn of the original's interpreter (Interpreter.Run, T528): the branch that has the turn goes, from where the turn begins in the log.
 * False if no branch has it any more: the run was over before this turn.
 */
function originalTurn(ctx: NonNullable<typeof current>, g: Grid3, rng: RunRandom): boolean {
  const at = ctx.branch;
  if (!at) return false;
  ctx.turn = g.log.length;
  at.go(g, rng);
  return true;
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
  go(g: Grid3, rng: RunRandom): boolean {
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
  if (node.type === 'pieces') return `pieces ${node.size?.join('×')}`;
  return undefined;
}

type Trace = Array<{ runner: Runner; what: string }>;

/** `mj`: the runners of the original's semantics where they are another kind (its branches, T528): what a run with the switch on compiles. */
function compile(node: Node3, alpha: Alphabet, limits: GridLimits, depth = 0, trace?: Trace, watch?: RunWatch, inPieces = false, mj = false): Runner {
  const r = compileNode(node, alpha, limits, depth, trace, watch, inPieces, mj);
  const what = trace && node && typeof node === 'object' ? describe(node) : undefined;
  if (what) trace!.push({ runner: r, what });
  return watch && node.type !== 'sequence' && node.type !== 'markov' ? new WatchedRunner(r, node, watch) : r;
}

/** What does not go inside `<pieces>` (T339): what makes another grid, what is written in the coordinates of the whole grid, what looks at all of it. */
const NOT_IN_PIECES: Partial<Record<Node3['type'], string>> = {
  map: "una map fa un'altra griglia: va prima di pieces",
  wfc: "una wfc fa un'altra griglia: va prima di pieces",
  shape: 'una forma ha le coordinate della griglia intera: va prima di pieces',
  pieces: 'pieces non va dentro un altro pieces',
};

function compileNode(node: Node3, alpha: Alphabet, limits: GridLimits, depth: number, trace?: Trace, watch?: RunWatch, inPieces = false, mj = false): Runner {
  if (depth > 16) throw new Mj3Error('programma troppo annidato');
  if (!node || typeof node !== 'object') throw new Mj3Error('nodo non valido');
  if (inPieces && NOT_IN_PIECES[node.type]) throw new Mj3Error(`dentro pieces: ${NOT_IN_PIECES[node.type]}`);
  switch (node.type) {
    case 'one':
    case 'all':
    case 'prl': {
      // An observation, and a search, look at the future of the whole grid: a piece cannot reach it (T339).
      if (inPieces && (node.observe?.length || node.search)) throw new Mj3Error('dentro pieces: observe e search guardano tutta la griglia, vanno prima di pieces (field sì)');
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
    case 'pieces':
      return new PiecesRunner(node, alpha, limits, depth, trace, mj);
    case 'sequence':
    case 'markov': {
      if (!Array.isArray(node.children) || !node.children.length) throw new Mj3Error(`nodo ${node.type} senza figli`);
      const children = node.children.map((c) => compile(c, alpha, limits, depth + 1, trace, watch, inPieces, mj));
      if (mj) {
        // MarkovJunior's branches (T528): a map's or a wfc's sequence is their branch, its first child their step; a lone map or wfc is a
        // branch of its own, without nodes; neither has a parent.
        const own = node.type === 'sequence' && (node.gated === true || node.grid === true);
        const nodes = children.map((r, i) => {
          const c = node.children[i];
          return (c.type === 'map' || c.type === 'wfc') && !(own && i === 0) ? new OriginalBranch([r], false, true, c.type === 'wfc') : r;
        });
        return new OriginalBranch(nodes, node.type === 'markov', own, node.gated === true);
      }
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
  /** What each piece of a `<pieces>` did, in the order they ran (T339): only for a program that has some. */
  pieces?: PieceReport[];
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
  /** Ceilings besides the engine's (the world's, T336): past one the run throws, below them it does not change. */
  ceilings?: NodeCeilings;
  /** The semantics of the run (T526, ADR-0263), over the program's: absent, the program's, and absent that too, ours. */
  semantics?: Semantics;
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
  current = { g, ...(opts.deadline ? { deadline: t0 + opts.deadline } : {}), ...(opts.ceilings ? { ceilings: opts.ceilings } : {}), ...(opts.semantics === 'mj' ? { semantics: 'mj' as const } : {}) };
  try {
    return execIn(root, g, seed, maxSteps, t0, trace, opts);
  } finally {
    current = outer;
  }
}

function execIn(root: Runner, g: Grid3, seed: number, maxSteps: number, t0: number, trace: Trace, opts: RunOptions): RunResult & { snapshots?: Snapshot[] } {
  // The pieces of this run (T339): their time, their steps, their reports; a run inside another keeps its own.
  const outerPieces = [piecesTime, piecesSteps, pieceReports] as const;
  piecesTime = 0;
  piecesSteps = 0;
  pieceReports = [];
  try {
    return execSteps(root, g, seed, maxSteps, t0, trace, opts);
  } finally {
    [piecesTime, piecesSteps, pieceReports] = outerPieces;
  }
}

function execSteps(root: Runner, g: Grid3, seed: number, maxSteps: number, t0: number, trace: Trace, opts: RunOptions): RunResult & { snapshots?: Snapshot[] } {
  root.reset();
  const rng = randomFor(opts.semantics, seed);
  // Under the original's semantics every turn is a step (Interpreter.Run), the last one too, in which the root finds nothing and the run
  // ends (T527, ADR-0268); in ours a step is a turn in which something was done. The turn goes to the branch that has it, the root first
  // (T528): the run ends when none has it.
  const everyTurn = opts.semantics === 'mj';
  if (everyTurn && current) current.branch = root as OriginalBranch;
  let steps = 0;
  let late = false;
  let ended = false;
  const keep = opts.snapshots ?? 0;
  const shots: Snapshot[] = [];
  let every = 1;
  const shoot = () => shots.push({ X: g.X, Y: g.Y, Z: g.Z, cells: new Uint8Array(g.cells), step: steps });
  if (keep) shoot();
  opts.watch?.start(g);
  const ctx = current;
  while (steps < maxSteps) {
    let went: boolean;
    try {
      if (everyTurn) {
        // A turn of the original's interpreter: whatever it did, the run goes on while a branch has the turn.
        originalTurn(ctx!, g, rng);
        went = ctx!.branch !== null;
      } else {
        // Where the turn begins in the log: the nodes that match in it look at the changes from here at their next step (T527).
        if (ctx !== undefined) ctx.turn = g.log.length;
        went = root.go(g, rng);
      }
    } catch (e) {
      // A search out of time: the run ends here, not finished (T334).
      if (!(e instanceof Mj3Late)) throw e;
      late = true;
      break;
    }
    if (everyTurn) steps++;
    if (!went) {
      ended = true;
      break;
    }
    if (!everyTurn) steps++;
    if (keep && steps % every === 0) {
      shoot();
      // Too many: keep one in two and take them half as often.
      if (shots.length > 2 * keep) {
        for (let i = 0; i < shots.length / 2; i++) shots[i] = shots[i * 2];
        shots.length = Math.ceil(shots.length / 2);
        every *= 2;
      }
    }
    // At every step: on a large grid one step can take long, and 256 of them were seconds past the deadline. The time of pieces that
    // have their own (T339) is not the run's.
    if (opts.deadline && Date.now() - t0 - piecesTime > opts.deadline) {
      late = true;
      break;
    }
  }
  // The original's last turn changes nothing: the grid of the step before is already the last shot, if it was taken.
  if (keep && shots[shots.length - 1]?.step !== (everyTurn && ended ? steps - 1 : steps)) shoot();
  return {
    grid: g,
    steps: steps + piecesSteps,
    // Ours: the run stopped before its budget ran out; the original's: the root found nothing (the run's `current` is null).
    finished: everyTurn ? ended : steps < maxSteps && !late,
    ms: Date.now() - t0,
    unused: trace.filter((t) => t.runner.total === 0).map((t) => (t.runner.why ? `${t.what} — ${t.runner.why}` : t.what)),
    ...(keep ? { snapshots: shots } : {}),
    ...(pieceReports.length ? { pieces: pieceReports } : {}),
  };
}

/** Whether a program has `<pieces>` (T339), anywhere in its nodes. */
export function hasPieces(node: Node3 | undefined): boolean {
  if (!node || typeof node !== 'object') return false;
  if (node.type === 'pieces') return true;
  return (node.type === 'sequence' || node.type === 'markov') && Array.isArray(node.children) && node.children.some(hasPieces);
}

/** The runner of a program's root: under the original's semantics the branch the interpreter runs (T528), else the root's own. */
function rootFor(program: Node3, alpha: Alphabet, limits: GridLimits, trace?: Trace, watch?: RunWatch, semantics?: Semantics): Runner {
  const mj = semantics === 'mj';
  const root = compile(program, alpha, limits, 0, trace, watch, false, mj);
  return mj ? originalRoot(root, program) : root;
}

/** Runs a program from an empty box. Throws Mj3Error if the program does not compile. */
export function run(p: Program3, seed: number, maxSteps = 20000, limits: GridLimits = MODEL_LIMITS, opts: RunOptions = {}): RunResult & { snapshots?: Snapshot[] } {
  const t0 = Date.now();
  // A program that runs its detail in pieces may have the larger grids its runner allows (T339): its box, its maps, its waves.
  if (limits.pieces && hasPieces(p?.program)) limits = { ...limits, side: Math.max(limits.side, limits.pieces.side), cells: Math.max(limits.cells, limits.pieces.cells) };
  const [X, Y, Z] = checkSize(p?.size, limits);
  const alpha = alphabetOf(p);
  const trace: Trace = [];
  const semantics = semanticsOf(p, opts);
  const root = rootFor(p.program, alpha, limits, trace, opts.watch, semantics);
  const g: Grid3 = { X, Y, Z, cells: new Uint8Array(X * Y * Z), alphabet: alpha.codes, log: [], epoch: 0 };
  if (typeof p.ground === 'string' && p.ground.length === 1) {
    const v = alpha.index(p.ground);
    for (let i = 0; i < X * Y; i++) g.cells[i] = v;
  }
  // As `Forms.get` lays the model: a box with no room for what is under the ground has its ground at the bottom.
  const soilAt = typeof p.soil === 'string' && p.soil.length === 1 ? (p.soilAt && p.soilAt > 0 && p.soilAt < Z ? p.soilAt : 0) : -1;
  if (soilAt >= 0) g.cells.fill(alpha.index(p.soil!), soilAt * X * Y, (soilAt + 1) * X * Y);
  if (typeof p.origin === 'string' && p.origin.length === 1) g.cells[(X >> 1) + (Y >> 1) * X + (p.originAt === 'centre' ? (Z >> 1) * X * Y : Math.max(0, soilAt) * X * Y)] = alpha.index(p.origin);
  return exec(root, g, seed, maxSteps, t0, trace, { ...opts, semantics });
}

/**
 * Runs more rules on a grid that already exists (a composed structure, say): its codes keep their
 * meaning, the palette may add new ones. The grid is changed in place and returned.
 */
export function runOn(grid: Grid3, p: Pick<Program3, 'palette' | 'unions' | 'program' | 'semantics'>, seed: number, maxSteps = 20000, limits: GridLimits = { side: 4096, cells: 64_000_000 }, opts: RunOptions = {}): RunResult {
  const t0 = Date.now();
  const alpha = alphabetOf(p, grid.alphabet);
  const trace: Trace = [];
  const semantics = semanticsOf(p, opts);
  const root = rootFor(p.program, alpha, limits, trace, opts.watch, semantics);
  grid.alphabet = alpha.codes;
  grid.log = [];
  grid.epoch++;
  return exec(root, grid, seed, maxSteps, t0, trace, { ...opts, semantics });
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
  private rng: RunRandom;
  private context: NonNullable<typeof current>;
  /** Past this many writes in the log, between two ticks the log starts again and the nodes scan the grid once: memory stays bounded. */
  private logCap: number;
  constructor(readonly grid: Grid3, p: Pick<Program3, 'palette' | 'unions' | 'program' | 'semantics'>, seed: number, limits: GridLimits = { side: 4096, cells: 64_000_000 }) {
    const alpha = alphabetOf(p, grid.alphabet);
    const semantics = semanticsOf(p);
    this.root = rootFor(p.program, alpha, limits, undefined, undefined, semantics);
    grid.alphabet = alpha.codes;
    grid.log = [];
    grid.epoch++;
    this.rng = randomFor(semantics, seed);
    this.context = { g: grid, ...(semantics === 'mj' ? { semantics } : {}) };
    this.logCap = Math.max(4096, grid.cells.length * 4);
    this.root.reset();
    // Under the original's semantics the root has the turn first (T528).
    if (semantics === 'mj') this.context.branch = this.root as OriginalBranch;
  }
  /** Goes on with the run for at most `maxSteps` steps: how many it made (fewer when the program has finished). */
  advance(maxSteps: number): number {
    return this.go(maxSteps, false);
  }
  /** Runs the program again from its first node, for at most `maxSteps` steps: how many it made. */
  tick(maxSteps: number): number {
    return this.go(maxSteps, true);
  }
  /** Writes one cell from outside the program, keeping the census and the log in sync (T482). */
  setCell(idx: number, v: number): boolean {
    const g = this.grid;
    if (idx < 0 || idx >= g.cells.length) return false;
    const was = g.cells[idx]!;
    if (was === v) return false;
    g.cells[idx] = v;
    if (this.context.census && this.context.census.cells === g.cells) this.context.census.moved(idx, was, v);
    g.log.push(idx);
    if (g.log.length > this.logCap) {
      g.log.length = 0;
      g.epoch++;
    }
    return true;
  }
  private go(maxSteps: number, again: boolean): number {
    const outer = current;
    const was = keeping;
    current = this.context;
    keeping = again;
    let made = 0;
    try {
      const mj = this.context.semantics === 'mj';
      if (again) {
        this.root.rewind();
        if (mj) this.context.branch = this.root as OriginalBranch;
      }
      while (made < maxSteps) {
        if (mj) {
          // A turn of the original's interpreter (T528): a step, but for the last one, in which the run ends (as a step of ours, in which
          // something was done: the root's last turn changes nothing).
          if (!originalTurn(this.context, this.grid, this.rng) || !this.context.branch) break;
          made++;
          continue;
        }
        // Where the turn begins in the log (T527): a step of the Stepper is a turn of the run.
        this.context.turn = this.grid.log.length;
        if (!this.root.go(this.grid, this.rng)) break;
        made++;
      }
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
