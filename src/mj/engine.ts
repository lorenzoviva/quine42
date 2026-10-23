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
//                      after works at the new resolution (MarkovJunior "map": coarse plan → fine detail)
//   shape            — box, ellipsoid, cylinder, cone resting on `at` (centre of the base), or a line
//                      from `at` to `to` with radius `r`; `on` limits which codes it may overwrite
//
// Programs written in MarkovJunior's own XML (lab/mjx) compile to these nodes with MarkovJunior's
// semantics: map with `clear` (a new empty grid, rules wrapping round), conv with `sums`, unlimited steps.

import { Rng } from '../kernel/rng';

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

export type Node3 =
  | { type: 'one' | 'all' | 'prl'; rules: Rule3[]; steps?: number; symmetry?: Sym; optional?: boolean }
  | { type: 'sequence' | 'markov'; children: Node3[] }
  | { type: 'conv'; rules: ConvRule[]; neighborhood?: 'moore' | 'vonneumann' | 'nocorners'; steps?: number; periodic?: boolean }
  | { type: 'path'; from: string; to: string; on: string; color: string; steps?: number; inertia?: boolean; longest?: boolean }
  | { type: 'map'; scale: Vec3; rules?: Rule3[]; symmetry?: Sym; clear?: boolean }
  | { type: 'shape'; shape: ShapeKind; at: Vec3; size?: Vec3; to?: Vec3; r?: number; color: string; on?: string };

/** Body parts the kernel can move to animate a figure (legs and arms swing, the head nods, tails wag). */
export const PARTS = ['gamba', 'braccio', 'testa', 'coda'] as const;
export type Part = (typeof PARTS)[number];

export interface PaletteEntry {
  name?: string;
  color?: string;
  hidden?: boolean;
  part?: Part;
  /** The letter gives light: drawn unshaded and bright, it blooms (flames, windows, neon). */
  glow?: boolean;
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

export class Mj3Error extends Error {}

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

function write(g: Grid3, idx: number, v: number): boolean {
  if (g.cells[idx] === v) return false;
  g.cells[idx] = v;
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
  if (dx * dy * dz > 216) throw new Mj3Error(`regola troppo grande (max 216 celle): ${rule.in}`);
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
  return { dx, dy, dz, input, output, p: typeof rule.p === 'number' && rule.p > 0 ? rule.p : 1 };
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
  return { dx: nd[0], dy: nd[1], dz: nd[2], input, output, p: p.p };
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
  constructor(protected limit?: number) {}
  reset(): void {
    this.count = 0;
  }
  /** One step: true if the node changed the grid. */
  abstract go(g: Grid3, rng: Rng): boolean;
}

/** Matches kept as a set with O(1) random pick and removal. */
class MatchSet {
  keys: number[] = [];
  private where = new Map<number, number>();
  add(k: number): void {
    if (this.where.has(k)) return;
    this.where.set(k, this.keys.length);
    this.keys.push(k);
  }
  remove(k: number): void {
    const i = this.where.get(k);
    if (i === undefined) return;
    const last = this.keys.pop()!;
    if (i < this.keys.length) {
      this.keys[i] = last;
      this.where.set(last, i);
    }
    this.where.delete(k);
  }
  clear(): void {
    this.keys = [];
    this.where.clear();
  }
}

class RuleRunner extends Runner {
  private patterns: Pattern[];
  private matches = new MatchSet();
  private seen = 0;
  private epoch = -1;
  private stamp?: Uint32Array;
  private stampN = 0;
  private uniform: boolean;
  private sets: Uint8Array[];
  /** The cells the rules look for (a code, or a set of codes), to explain a node that never matches. */
  private wanted: string[];
  private alpha: Alphabet;

  constructor(
    private kind: 'one' | 'all' | 'prl',
    rules: Rule3[],
    limit: number | undefined,
    sym: Sym,
    alpha: Alphabet,
  ) {
    super(limit);
    if (!Array.isArray(rules) || !rules.length) throw new Mj3Error(`nodo ${kind} senza regole`);
    this.patterns = rules.flatMap((r) => variants(parsePattern(r, alpha), r.symmetry ?? sym));
    this.wanted = [...new Set(rules.flatMap((r) => (r.in.match(/\[[^\]]*\]|[^*/ ]/g) ?? []).map((c) => (c.startsWith('[') ? c.slice(1, -1) : c))))];
    this.alpha = alpha;
    this.sets = alpha.sets;
    this.uniform = this.patterns.every((p) => p.p === this.patterns[0].p);
  }

  reset(): void {
    super.reset();
    this.epoch = -1;
  }

  private check(g: Grid3, p: Pattern, ox: number, oy: number, oz: number): boolean {
    let changes = false;
    const XY = g.X * g.Y;
    for (let k = 0, n = 0; k < p.dz; k++)
      for (let j = 0; j < p.dy; j++) {
        let idx = ox + (oy + j) * g.X + (oz + k) * XY;
        for (let i = 0; i < p.dx; i++, n++, idx++) {
          const c = g.cells[idx];
          const want = p.input[n];
          if (want !== -1 && !this.sets[want][c]) return false;
          const put = p.output[n];
          if (put !== -1 && put !== c) changes = true;
        }
      }
    return changes;
  }

  private scan(g: Grid3): void {
    const N = g.cells.length;
    this.matches.clear();
    this.patterns.forEach((p, pi) => {
      for (let z = 0; z + p.dz <= g.Z; z++)
        for (let y = 0; y + p.dy <= g.Y; y++)
          for (let x = 0; x + p.dx <= g.X; x++) if (this.check(g, p, x, y, z)) this.matches.add(pi * N + x + y * g.X + z * g.X * g.Y);
    });
  }

  /** Brings the match set up to date with every cell written since the last look. */
  private sync(g: Grid3): void {
    const fresh = g.log.length - this.seen;
    if (this.epoch !== g.epoch || fresh > g.cells.length / 4) {
      this.scan(g);
    } else if (fresh > 0) {
      const N = g.cells.length;
      const XY = g.X * g.Y;
      if (this.stamp?.length !== N) this.stamp = new Uint32Array(N);
      const mark = ++this.stampN;
      for (let l = this.seen; l < g.log.length; l++) {
        const c = g.log[l];
        if (this.stamp[c] === mark) continue;
        this.stamp[c] = mark;
        const cx = c % g.X;
        const cy = Math.floor(c / g.X) % g.Y;
        const cz = Math.floor(c / XY);
        this.patterns.forEach((p, pi) => {
          for (let k = 0; k < p.dz; k++) {
            const oz = cz - k;
            if (oz < 0 || oz + p.dz > g.Z) continue;
            for (let j = 0; j < p.dy; j++) {
              const oy = cy - j;
              if (oy < 0 || oy + p.dy > g.Y) continue;
              for (let i = 0; i < p.dx; i++) {
                const ox = cx - i;
                if (ox < 0 || ox + p.dx > g.X) continue;
                const key = pi * N + ox + oy * g.X + oz * XY;
                if (this.check(g, p, ox, oy, oz)) this.matches.add(key);
                else this.matches.remove(key);
              }
            }
          }
        });
      }
    }
    this.epoch = g.epoch;
    this.seen = g.log.length;
  }

  private apply(g: Grid3, key: number, written?: Uint8Array): boolean {
    const N = g.cells.length;
    const p = this.patterns[Math.floor(key / N)];
    const o = key % N;
    const XY = g.X * g.Y;
    // As MarkovJunior's all: a match is skipped only if a cell it writes was already written in this
    // step; the cells it merely reads ('*' in the output) may be shared.
    if (written) {
      for (let k = 0, n = 0; k < p.dz; k++)
        for (let j = 0; j < p.dy; j++)
          for (let i = 0; i < p.dx; i++, n++) if (p.output[n] !== -1 && written[o + i + j * g.X + k * XY]) return false;
    }
    for (let k = 0, n = 0; k < p.dz; k++)
      for (let j = 0; j < p.dy; j++)
        for (let i = 0; i < p.dx; i++, n++) {
          if (p.output[n] === -1) continue;
          const idx = o + i + j * g.X + k * XY;
          if (written) written[idx] = 1;
          write(g, idx, p.output[n]);
        }
    return true;
  }

  go(g: Grid3, rng: Rng): boolean {
    if (this.limit !== undefined && this.count >= this.limit) return false;
    this.sync(g);
    const keys = this.matches.keys;
    if (!keys.length) {
      if (!this.total && !this.why) {
        const present = new Set(g.cells);
        const absent = this.wanted.filter((w) => w !== '.' && ![...present].some((c) => this.sets[this.alpha.mask(w)][c]));
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
      const written = new Uint8Array(N);
      for (const k of order) this.apply(g, k, written);
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

const MOORE: Vec3[] = [];
for (let z = -1; z <= 1; z++) for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) if (x || y || z) MOORE.push([x, y, z]);
const VON_NEUMANN: Vec3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
/** MarkovJunior's 3D "NoCorners": the 18 neighbours that share a face or an edge. */
const NO_CORNERS: Vec3[] = MOORE.filter(([x, y, z]) => Math.abs(x) + Math.abs(y) + Math.abs(z) < 3);
/** Unlimited steps (MarkovJunior: until nothing changes) still stop here, so a flickering automaton ends. */
const CONV_UNLIMITED = 200;

class ConvRunner extends Runner {
  private rules: Array<{ input: number; output: number; neighbors: number; sums: Uint8Array; p: number }>;
  private offsets: Vec3[];
  private sets: Uint8Array[];
  private periodic: boolean;
  constructor(node: { rules: ConvRule[]; neighborhood?: string; steps?: number; periodic?: boolean }, alpha: Alphabet) {
    super(node.steps === Infinity ? CONV_UNLIMITED : Math.max(1, Math.min(30, node.steps ?? 1)));
    if (!Array.isArray(node.rules) || !node.rules.length) throw new Mj3Error('nodo conv senza regole');
    this.offsets = node.neighborhood === 'vonneumann' ? VON_NEUMANN : node.neighborhood === 'nocorners' ? NO_CORNERS : MOORE;
    this.periodic = node.periodic === true;
    this.sets = alpha.sets;
    this.rules = node.rules.map((r) => {
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
      return { input: alpha.mask(r.in), output: alpha.index(r.out), neighbors: alpha.mask(r.neighbors), sums, p: typeof r.p === 'number' ? r.p : 1 };
    });
  }
  go(g: Grid3, rng: Rng): boolean {
    if (this.count >= this.limit!) return false;
    const changes: number[] = [];
    const wrap = (v: number, n: number) => (v < 0 ? v + n : v >= n ? v - n : v);
    for (let z = 0; z < g.Z; z++)
      for (let y = 0; y < g.Y; y++)
        for (let x = 0; x < g.X; x++) {
          const idx = x + y * g.X + z * g.X * g.Y;
          const c = g.cells[idx];
          // As in MarkovJunior: the first rule whose input, chance and neighbour count all agree.
          for (const rule of this.rules) {
            if (!this.sets[rule.input][c] || rule.output === c || (rule.p < 1 && rng.next() >= rule.p)) continue;
            let n = 0;
            for (const [ox, oy, oz] of this.offsets) {
              let nx = x + ox, ny = y + oy, nz = z + oz;
              if (this.periodic) {
                nx = wrap(nx, g.X);
                ny = wrap(ny, g.Y);
                nz = wrap(nz, g.Z);
              } else if (nx < 0 || ny < 0 || nz < 0 || nx >= g.X || ny >= g.Y || nz >= g.Z) continue;
              if (this.sets[rule.neighbors][g.cells[nx + ny * g.X + nz * g.X * g.Y]]) n++;
            }
            if (!rule.sums[n]) continue;
            changes.push(idx, rule.output);
            break;
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
  go(g: Grid3, rng: Rng): boolean {
    if (this.limit !== undefined && this.count >= this.limit) return false;
    const N = g.cells.length;
    const XY = g.X * g.Y;
    const has = (set: number, idx: number) => this.sets[set][g.cells[idx]] === 1;
    const dist = new Int32Array(N).fill(-1);
    const queue: number[] = [];
    for (let i = 0; i < N; i++)
      if (has(this.to, i)) {
        dist[i] = 0;
        queue.push(i);
      }
    if (!queue.length) {
      if (!this.total) this.why ??= 'in quel momento non c\'era nessuna cella di arrivo ("to")';
      return false;
    }
    const near = (c: number): number[] => {
      const x = c % g.X, y = Math.floor(c / g.X) % g.Y, z = Math.floor(c / XY);
      const out: number[] = [];
      for (const [dx, dy, dz] of VON_NEUMANN) {
        const nx = x + dx, ny = y + dy, nz = z + dz;
        if (nx >= 0 && ny >= 0 && nz >= 0 && nx < g.X && ny < g.Y && nz < g.Z) out.push(nx + ny * g.X + nz * XY);
      }
      return out;
    };
    for (let q = 0; q < queue.length; q++) {
      const c = queue[q];
      for (const n of near(c))
        if (dist[n] < 0 && has(this.on, n)) {
          dist[n] = dist[c] + 1;
          queue.push(n);
        }
    }
    // Starts: `from` cells next to the field (a start is not walked over, so it needs no "on").
    let best = -1;
    const starts: Array<[number, number]> = [];
    for (let i = 0; i < N; i++) {
      if (!has(this.from, i) || dist[i] === 0) continue;
      let d = -1;
      for (const n of near(i)) if (dist[n] >= 0 && (d < 0 || dist[n] < d)) d = dist[n];
      if (d < 0) continue;
      starts.push([i, d]);
      best = Math.max(best, d);
    }
    if (!starts.length) {
      if (!this.total) this.why ??= [...g.cells].some((c) => this.sets[this.from][c]) ? 'le celle di partenza ("from") c\'erano, ma nessuna toccava una cella "on" collegata all\'arrivo' : 'in quel momento non c\'era nessuna cella di partenza ("from")';
      return false;
    }
    const pool = this.longest ? starts.filter(([, d]) => d === best) : starts;
    const [start] = pool[rng.int(pool.length)];
    let cur = start;
    let dir = 0;
    let changed = false;
    for (let guard = 0; guard < N; guard++) {
      const steps = near(cur).filter((n) => dist[n] >= 0);
      if (!steps.length) break;
      const low = Math.min(...steps.map((n) => dist[n]));
      if (cur !== start && low >= dist[cur]) break;
      const ok = steps.filter((n) => dist[n] === low);
      const straight = this.inertia ? ok.find((n) => n - cur === dir) : undefined;
      const next = straight ?? ok[rng.int(ok.length)];
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
  private rules: Array<{ d: Vec3; D: Vec3; input: Int32Array; output: Int16Array }>;
  private sets: Uint8Array[];
  /** MarkovJunior's map: the new grid starts empty and only the rules write it (wrapping round the edges). */
  private clear: boolean;
  constructor(node: { scale: Vec3; rules?: Rule3[]; symmetry?: Sym; clear?: boolean }, alpha: Alphabet, private limits: GridLimits) {
    super(1);
    if (!isVec(node.scale) || node.scale.some((v) => !Number.isInteger(v) || v < 1 || v > 32)) throw new Mj3Error('map: "scale" vuole tre interi tra 1 e 32');
    this.scale = node.scale;
    this.sets = alpha.sets;
    this.clear = node.clear === true;
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
    const X = g.X * sx, Y = g.Y * sy, Z = g.Z * sz;
    if (Math.max(X, Y, Z) > this.limits.side || X * Y * Z > this.limits.cells) throw new Mj3Error(`map: la griglia scalata (${X}×${Y}×${Z}) supera i limiti`);
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
              const x = ox * sx + i, y = oy * sy + j, z = oz * sz + k;
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

/** A box of cells turned the way transform() turns patterns. */
function turnCells<T extends Int32Array | Int16Array>(src: T, d: Vec3, perm: Vec3, flip: Vec3): [T, Vec3] {
  const nd: Vec3 = [d[perm[0]], d[perm[1]], d[perm[2]]];
  const out = new (src.constructor as { new (n: number): T })(src.length);
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
  constructor(private children: Runner[]) {
    super();
  }
  reset(): void {
    super.reset();
    this.index = 0;
    for (const c of this.children) c.reset();
  }
  go(g: Grid3, rng: Rng): boolean {
    while (this.index < this.children.length) {
      if (this.children[this.index].go(g, rng)) return true;
      this.index++;
      if (this.index < this.children.length) this.children[this.index].reset();
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
  go(g: Grid3, rng: Rng): boolean {
    for (const c of this.children) if (c.go(g, rng)) return true;
    return false;
  }
}

const isVec = (v: unknown): v is Vec3 => Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === 'number' && Number.isFinite(n));

/** What a node is, in a few words, for the list of nodes that never did anything. */
function describe(node: Node3): string | undefined {
  // A node meant for rare cases says so: it is not reported when it does nothing.
  if ((node as { optional?: boolean }).optional) return undefined;
  if (node.type === 'one' || node.type === 'all' || node.type === 'prl') return `${node.type} "${node.rules[0]?.in}" → "${node.rules[0]?.out}"${node.rules.length > 1 ? ` (e altre ${node.rules.length - 1} regole)` : ''}`;
  if (node.type === 'path') return `path da "${node.from}" a "${node.to}" su "${node.on}"`;
  if (node.type === 'conv') return `conv "${node.rules[0]?.in}" → "${node.rules[0]?.out}"`;
  return undefined;
}

type Trace = Array<{ runner: Runner; what: string }>;

function compile(node: Node3, alpha: Alphabet, limits: GridLimits, depth = 0, trace?: Trace): Runner {
  const r = compileNode(node, alpha, limits, depth, trace);
  const what = trace && node && typeof node === 'object' ? describe(node) : undefined;
  if (what) trace!.push({ runner: r, what });
  return r;
}

function compileNode(node: Node3, alpha: Alphabet, limits: GridLimits, depth: number, trace?: Trace): Runner {
  if (depth > 16) throw new Mj3Error('programma troppo annidato');
  if (!node || typeof node !== 'object') throw new Mj3Error('nodo non valido');
  switch (node.type) {
    case 'one':
    case 'all':
    case 'prl':
      return new RuleRunner(node.type, node.rules, node.steps ?? (node.type === 'prl' ? 1 : undefined), node.symmetry ?? 'xy', alpha);
    case 'conv':
      return new ConvRunner(node, alpha);
    case 'path':
      return new PathRunner(node, alpha);
    case 'shape':
      return new ShapeRunner(node, alpha);
    case 'map':
      return new MapRunner(node, alpha, limits);
    case 'sequence':
    case 'markov': {
      if (!Array.isArray(node.children) || !node.children.length) throw new Mj3Error(`nodo ${node.type} senza figli`);
      const children = node.children.map((c) => compile(c, alpha, limits, depth + 1, trace));
      return node.type === 'sequence' ? new SequenceRunner(children) : new MarkovRunner(children);
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
}

export interface Snapshot {
  X: number;
  Y: number;
  Z: number;
  cells: Uint8Array;
  step: number;
}

function exec(root: Runner, g: Grid3, seed: number, maxSteps: number, t0: number, trace: Trace = [], opts: RunOptions = {}): RunResult & { snapshots?: Snapshot[] } {
  root.reset();
  const rng = new Rng(seed);
  let steps = 0;
  let late = false;
  const keep = opts.snapshots ?? 0;
  const shots: Snapshot[] = [];
  let every = 1;
  const shoot = () => shots.push({ X: g.X, Y: g.Y, Z: g.Z, cells: new Uint8Array(g.cells), step: steps });
  if (keep) shoot();
  while (steps < maxSteps && root.go(g, rng)) {
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
    if (opts.deadline && (steps & 255) === 0 && Date.now() - t0 > opts.deadline) {
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
  const root = compile(p.program, alpha, limits, 0, trace);
  const g: Grid3 = { X, Y, Z, cells: new Uint8Array(X * Y * Z), alphabet: alpha.codes, log: [], epoch: 0 };
  if (typeof p.ground === 'string' && p.ground.length === 1) {
    const v = alpha.index(p.ground);
    for (let i = 0; i < X * Y; i++) g.cells[i] = v;
  }
  if (typeof p.origin === 'string' && p.origin.length === 1) g.cells[(X >> 1) + (Y >> 1) * X + (p.originAt === 'centre' ? (Z >> 1) * X * Y : 0)] = alpha.index(p.origin);
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
  const root = compile(p.program, alpha, limits, 0, trace);
  grid.alphabet = alpha.codes;
  grid.log = [];
  grid.epoch++;
  return exec(root, grid, seed, maxSteps, t0, trace, opts);
}

export const at = (g: Grid3, x: number, y: number, z: number) => g.alphabet[g.cells[x + y * g.X + z * g.X * g.Y]];
