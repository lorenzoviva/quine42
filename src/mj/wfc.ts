// MarkovJunior's wave function collapse and ConvChain (T335, ADR-0174), as the original does them (github.com/mxgmn/MarkovJunior, MIT:
// WaveFunctionCollapse.cs, TileModel.cs, OverlapModel.cs, ConvChain.cs, SymmetryHelper.cs), on arrays: what a tileset or a sample
// becomes (patterns, weights, the propagator) and the solver that observes the wave until every cell holds one pattern. Pure functions
// and one class; the engine (engine.ts) runs them as nodes and writes the grid.
//
// Only text (rule 11): tiles and samples are letters, never images or .vox files. The compiler (model.ts) reads them from models/ and
// gives them here as ordinals of the node's `values` (0 is the empty letter).

import { Rng } from '../kernel/rng';

/**
 * The ceilings of a node (ADR-0174). They count units, not time: the same seed gives the same grid on every machine. Time is a ceiling
 * of its own, as for the search (ADR-0173): past it the run stops and is not finished.
 */
export const WFC_LIMITS = {
  /** Patterns of a node: tiles with their turns, or the windows of a sample. */
  patterns: 2048,
  /** Tries to find a seed without contradictions (MarkovJunior's default, here also the most). */
  tries: 1000,
  /** Entries of the propagator (for every direction and pattern, the patterns that may stand beside it). */
  propagator: 4_000_000,
  /** Bytes of the two waves of a node (the wave and the one it starts again from at every try). */
  waveBytes: 128 * 2 ** 20,
  /** Milliseconds of a node, within the run's deadline. */
  ms: 10_000,
  /** ConvChain's N: its weights are 2^(N·N). */
  convchainN: 4,
  /** A sample (overlap model, ConvChain): cells. */
  sampleCells: 128 * 128,
};

export class WfcError extends Error {}

// ---------------------------------------------------------------- symmetries (SymmetryHelper.cs)

/**
 * The eight symmetries of a square, in MarkovJunior's order: e, b, a, ba, a², ba², a³, ba³ (a the turn, b the mirror). `subgroup` keeps
 * some of them; `same` drops the ones already there.
 */
export function squareSymmetries<T>(thing: T, rotation: (t: T) => T, reflection: (t: T) => T, same: (a: T, b: T) => boolean, subgroup?: readonly boolean[]): T[] {
  const things: T[] = new Array(8);
  things[0] = thing;
  things[1] = reflection(things[0]);
  things[2] = rotation(things[0]);
  things[3] = reflection(things[2]);
  things[4] = rotation(things[2]);
  things[5] = reflection(things[4]);
  things[6] = rotation(things[4]);
  things[7] = reflection(things[6]);
  const out: T[] = [];
  for (let i = 0; i < 8; i++) if ((!subgroup || subgroup[i]) && !out.some((s) => same(s, things[i]))) out.push(things[i]);
  return out;
}

/** The 48 symmetries of a cube, in MarkovJunior's order (a and b two turns, r a mirror). */
export function cubeSymmetries<T>(thing: T, a: (t: T) => T, b: (t: T) => T, r: (t: T) => T, same: (x: T, y: T) => boolean, subgroup?: readonly boolean[]): T[] {
  const s: T[] = new Array(48);
  s[0] = thing;
  s[1] = r(s[0]);
  s[2] = a(s[0]);
  s[3] = r(s[2]);
  s[4] = a(s[2]);
  s[5] = r(s[4]);
  s[6] = a(s[4]);
  s[7] = r(s[6]);
  s[8] = b(s[0]);
  s[9] = r(s[8]);
  s[10] = b(s[2]);
  s[11] = r(s[10]);
  s[12] = b(s[4]);
  s[13] = r(s[12]);
  s[14] = b(s[6]);
  s[15] = r(s[14]);
  s[16] = b(s[8]);
  s[17] = r(s[16]);
  s[18] = b(s[10]);
  s[19] = r(s[18]);
  s[20] = b(s[12]);
  s[21] = r(s[20]);
  s[22] = b(s[14]);
  s[23] = r(s[22]);
  s[24] = b(s[16]);
  s[25] = r(s[24]);
  s[26] = b(s[18]);
  s[27] = r(s[26]);
  s[28] = b(s[20]);
  s[29] = r(s[28]);
  s[30] = b(s[22]);
  s[31] = r(s[30]);
  s[32] = a(s[8]);
  s[33] = r(s[32]);
  s[34] = a(s[10]);
  s[35] = r(s[34]);
  s[36] = a(s[12]);
  s[37] = r(s[36]);
  s[38] = a(s[14]);
  s[39] = r(s[38]);
  s[40] = a(s[24]);
  s[41] = r(s[40]);
  s[42] = a(s[26]);
  s[43] = r(s[42]);
  s[44] = a(s[28]);
  s[45] = r(s[44]);
  s[46] = a(s[30]);
  s[47] = r(s[46]);
  const out: T[] = [];
  for (let i = 0; i < 48; i++) if ((!subgroup || subgroup[i]) && !out.some((t) => same(t, s[i]))) out.push(s[i]);
  return out;
}

/** The square subgroup of a symmetry as the engine names it (engine.ts `Sym`), for what is flat: a sample's windows. */
export function squareSubgroup(sym: string): boolean[] {
  const only = (...k: number[]) => Array.from({ length: 8 }, (_, i) => k.includes(i));
  switch (sym) {
    case 'none':
    case 'z':
      return only(0);
    case 'x':
      return only(0, 1);
    case 'y':
      return only(0, 5);
    case 'rot':
      return only(0, 2, 4, 6);
    default:
      return only(0, 1, 2, 3, 4, 5, 6, 7);
  }
}

const sameCells = (a: Uint8Array, b: Uint8Array) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};
const never = () => false;

// ---------------------------------------------------------------- the tile model (TileModel.cs)

export interface TileSource {
  name: string;
  weight: number;
  /** Ordinals of the node's values, x fastest, then y, then z from the bottom; S·S·SZ of them. */
  cells: Uint8Array;
}

/** A `<neighbor>`: `left`/`right` (the right one is +x of the left one), or `top`/`bottom`; a name may begin with turns ("z Line"). */
export interface NeighborSource {
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
}

export interface WfcModel {
  /** Each pattern's cells as ordinals, all of the same size. */
  patterns: Uint8Array[];
  weights: number[];
  /** Per direction (+x, +y, -x, -y, +z, -z; four for a flat sample), per pattern, the patterns that may stand there. */
  propagator: number[][][];
}

export interface TileModel extends WfcModel {
  /** The patterns of each tile (its turns), by name. */
  positions: Map<string, number[]>;
}

/**
 * The tiles of a tileset with their turns (all eight of a square around z, or the 48 of a cube with `fullSymmetry`) and the propagator
 * its neighbours give, as TileModel.cs builds them. Throws WfcError with the reason.
 */
export function tileModel(tiles: readonly TileSource[], S: number, SZ: number, fullSymmetry: boolean, neighbors: readonly NeighborSource[]): TileModel {
  if (!tiles.length) throw new WfcError('nessuna tessera');
  if (fullSymmetry && S !== SZ) throw new WfcError(`con fullSymmetry le tessere sono cubi: ${S}×${S}×${SZ}`);
  const N = S * S * SZ;
  const make = (f: (x: number, y: number, z: number) => number) => {
    const out = new Uint8Array(N);
    for (let z = 0, i = 0; z < SZ; z++) for (let y = 0; y < S; y++) for (let x = 0; x < S; x++, i++) out[i] = f(x, y, z);
    return out;
  };
  const cube = (what: string) => {
    if (S !== SZ) throw new WfcError(`${what}: la tessera non è un cubo (${S}×${S}×${SZ})`);
  };
  const zRotate = (p: Uint8Array) => make((x, y, z) => p[y + (S - 1 - x) * S + z * S * S]);
  const yRotate = (p: Uint8Array) => (cube('una rotazione attorno a y'), make((x, y, z) => p[z + y * S + (S - 1 - x) * S * S]));
  const xRotate = (p: Uint8Array) => (cube('una rotazione attorno a x'), make((x, y, z) => p[x + z * S + (S - 1 - y) * S * S]));
  const xReflect = (p: Uint8Array) => make((x, y, z) => p[S - 1 - x + y * S + z * S * S]);
  const yReflect = (p: Uint8Array) => make((x, y, z) => p[x + (S - 1 - y) * S + z * S * S]);
  const zReflect = (p: Uint8Array) => make((x, y, z) => p[x + y * S + (S - 1 - z) * S * S]);

  const patterns: Uint8Array[] = [];
  const weights: number[] = [];
  const positions = new Map<string, number[]>();
  const first = new Map<string, Uint8Array>();
  for (const t of tiles) {
    if (t.cells.length !== N) throw new WfcError(`la tessera ${t.name} non è grande ${S}×${S}×${SZ}`);
    if (positions.has(t.name)) throw new WfcError(`la tessera ${t.name} è ripetuta`);
    const turns = fullSymmetry ? cubeSymmetries(t.cells, zRotate, yRotate, xReflect, sameCells) : squareSymmetries(t.cells, zRotate, xReflect, sameCells);
    const at: number[] = [];
    for (const p of turns) {
      at.push(patterns.length);
      patterns.push(p);
      weights.push(t.weight);
    }
    if (patterns.length > WFC_LIMITS.patterns) throw new WfcError(`troppe tessere con le loro rotazioni (al più ${WFC_LIMITS.patterns})`);
    positions.set(t.name, at);
    first.set(t.name, t.cells);
  }
  const P = patterns.length;
  const W = Math.ceil(P / 32);
  // A bit per pair, per direction: the original's bool[6][P][P], without its memory.
  const allowed = Array.from({ length: 6 }, () => new Uint32Array(P * W));
  const index = (p: Uint8Array): number => {
    for (let i = 0; i < P; i++) if (sameCells(p, patterns[i])) return i;
    throw new WfcError('una rotazione di una tessera non è tra le tessere');
  };
  const set = (d: number, a: Uint8Array, b: Uint8Array) => {
    const i = index(a), j = index(b);
    allowed[d][i * W + (j >>> 5)] |= 1 << (j & 31);
  };
  const last = (s: string) => s.trim().split(/\s+/).pop()!;
  const tile = (attribute: string): Uint8Array => {
    const code = attribute.trim().split(/\s+/);
    if (code.length > 2) throw new WfcError(`"${attribute}": prima le rotazioni (x, y, z), poi il nome`);
    const action = code.length === 2 ? code[0] : '';
    let t = first.get(last(attribute));
    if (!t) throw new WfcError(`tessera sconosciuta "${last(attribute)}"`);
    for (let i = action.length - 1; i >= 0; i--) {
      const sym = action[i];
      if (sym === 'x') t = xRotate(t);
      else if (sym === 'y') t = yRotate(t);
      else if (sym === 'z') t = zRotate(t);
      else throw new WfcError(`rotazione sconosciuta "${sym}" in "${attribute}" (x, y o z)`);
    }
    return t;
  };
  for (const n of neighbors) {
    if (fullSymmetry) {
      if (n.left === undefined || n.right === undefined) throw new WfcError('con fullSymmetry un vicino è left e right');
      const l = tile(n.left), r = tile(n.right);
      const ls = squareSymmetries(l, xRotate, yReflect, never), rs = squareSymmetries(r, xRotate, yReflect, never);
      for (let i = 0; i < ls.length; i++) {
        set(0, ls[i], rs[i]);
        set(0, xReflect(rs[i]), xReflect(ls[i]));
      }
      const dt = zRotate(l), ut = zRotate(r);
      const ds = squareSymmetries(dt, yRotate, zReflect, never), us = squareSymmetries(ut, yRotate, zReflect, never);
      for (let i = 0; i < ds.length; i++) {
        set(1, ds[i], us[i]);
        set(1, yReflect(us[i]), yReflect(ds[i]));
      }
      const bt = yRotate(l), tt = yRotate(r);
      const bs = squareSymmetries(bt, zRotate, xReflect, never), ts = squareSymmetries(tt, zRotate, xReflect, never);
      for (let i = 0; i < bs.length; i++) {
        set(4, bs[i], ts[i]);
        set(4, zReflect(ts[i]), zReflect(bs[i]));
      }
    } else if (n.left !== undefined) {
      if (n.right === undefined) throw new WfcError('un vicino left vuole right');
      const l = tile(n.left), r = tile(n.right);
      set(0, l, r);
      set(0, yReflect(l), yReflect(r));
      set(0, xReflect(r), xReflect(l));
      set(0, yReflect(xReflect(r)), yReflect(xReflect(l)));
      const dt = zRotate(l), ut = zRotate(r);
      set(1, dt, ut);
      set(1, xReflect(dt), xReflect(ut));
      set(1, yReflect(ut), yReflect(dt));
      set(1, xReflect(yReflect(ut)), xReflect(yReflect(dt)));
    } else {
      if (n.top === undefined || n.bottom === undefined) throw new WfcError('un vicino è left e right, o top e bottom');
      const t = tile(n.top), b = tile(n.bottom);
      const ts = squareSymmetries(t, zRotate, xReflect, never), bs = squareSymmetries(b, zRotate, xReflect, never);
      for (let i = 0; i < ts.length; i++) set(4, bs[i], ts[i]);
    }
  }
  const has = (d: number, i: number, j: number) => (allowed[d][i * W + (j >>> 5)] >>> (j & 31)) & 1;
  let entries = 0;
  const propagator = [0, 1, 2, 3, 4, 5].map((d) =>
    patterns.map((_, p1) => {
      const list: number[] = [];
      // -x, -y and -z are +x, +y and +z read the other way.
      for (let p2 = 0; p2 < P; p2++) if (d < 2 || d === 4 ? has(d, p1, p2) : has(d === 5 ? 4 : d - 2, p2, p1)) list.push(p2);
      entries += list.length;
      if (entries > WFC_LIMITS.propagator) throw new WfcError(`troppi vicini possibili (al più ${WFC_LIMITS.propagator})`);
      return list;
    }),
  );
  return { patterns, weights, positions, propagator };
}

// ---------------------------------------------------------------- the overlap model (OverlapModel.cs)

/**
 * The N×N windows of a flat sample (SX×SY ordinals) with their symmetries, counted, in the order they first appear, and the propagator:
 * two windows may stand side by side where they agree on the cells they share.
 */
export function overlapModel(sample: Uint8Array, SX: number, SY: number, N: number, periodicInput: boolean, subgroup: readonly boolean[]): WfcModel {
  if (!Number.isInteger(N) || N < 1 || N > Math.min(SX, SY) && !periodicInput) throw new WfcError(`N=${N} non entra nel campione ${SX}×${SY}`);
  if (N > 8) throw new WfcError('N è al più 8');
  const pattern = (f: (x: number, y: number) => number) => {
    const out = new Uint8Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) out[x + y * N] = f(x, y);
    return out;
  };
  const rotated = (p: Uint8Array) => pattern((x, y) => p[N - 1 - y + x * N]);
  const reflected = (p: Uint8Array) => pattern((x, y) => p[N - 1 - x + y * N]);
  const counts = new Map<string, number>();
  const patterns: Uint8Array[] = [];
  const ymax = periodicInput ? SY : SY - N + 1;
  const xmax = periodicInput ? SX : SX - N + 1;
  for (let y = 0; y < ymax; y++)
    for (let x = 0; x < xmax; x++) {
      const p = pattern((dx, dy) => sample[((x + dx) % SX) + ((y + dy) % SY) * SX]);
      for (const q of squareSymmetries(p, rotated, reflected, never, subgroup)) {
        const key = q.join(',');
        const n = counts.get(key);
        if (n === undefined) {
          counts.set(key, 1);
          patterns.push(q);
          if (patterns.length > WFC_LIMITS.patterns) throw new WfcError(`il campione ha troppe finestre diverse (al più ${WFC_LIMITS.patterns})`);
        } else counts.set(key, n + 1);
      }
    }
  const weights = patterns.map((p) => counts.get(p.join(','))!);
  const agrees = (p1: Uint8Array, p2: Uint8Array, dx: number, dy: number) => {
    const xmin = dx < 0 ? 0 : dx, xmax2 = dx < 0 ? dx + N : N, ymin = dy < 0 ? 0 : dy, ymax2 = dy < 0 ? dy + N : N;
    for (let y = ymin; y < ymax2; y++) for (let x = xmin; x < xmax2; x++) if (p1[x + N * y] !== p2[x - dx + N * (y - dy)]) return false;
    return true;
  };
  let entries = 0;
  const propagator = [0, 1, 2, 3].map((d) =>
    patterns.map((p1) => {
      const list: number[] = [];
      for (let t2 = 0; t2 < patterns.length; t2++) if (agrees(p1, patterns[t2], DX[d], DY[d])) list.push(t2);
      entries += list.length;
      if (entries > WFC_LIMITS.propagator) throw new WfcError(`troppi vicini possibili (al più ${WFC_LIMITS.propagator})`);
      return list;
    }),
  );
  return { patterns, weights, propagator };
}

// ---------------------------------------------------------------- the solver (WaveFunctionCollapse.cs)

export const DX = [1, 0, -1, 0, 0, 0];
export const DY = [0, 1, 0, -1, 0, 0];
export const DZ = [0, 0, 0, 0, 1, -1];
const OPPOSITE = [2, 3, 0, 1, 5, 4];

export interface WfcProblem {
  /** The cells of the wave: one pattern each in the end. */
  MX: number;
  MY: number;
  MZ: number;
  weights: readonly number[];
  propagator: readonly (readonly (readonly number[])[])[];
  periodic: boolean;
  shannon: boolean;
}

export interface WfcOutcome {
  /** The pattern of every cell, if a try ended without a contradiction. */
  observed?: Int32Array;
  /** The try that found it (0 the first), or how many were made. */
  tries: number;
  /** Observations of the try that found it. */
  observations: number;
  /** Out of time: the run stops, not finished. */
  late?: boolean;
  /** Why there is none. */
  why?: string;
}

/** Bytes a problem's waves take: the engine refuses a node past `WFC_LIMITS.waveBytes`. */
export function waveBytes(cells: number, P: number, D: number, shannon: boolean): number {
  return 2 * cells * (P * (1 + 2 * D) + 4 + (shannon ? 24 : 0)) + cells * P * 8;
}

class Wave {
  data: Uint8Array;
  compatible: Int16Array;
  ones: Int32Array;
  sw?: Float64Array;
  swlw?: Float64Array;
  entropy?: Float64Array;
  constructor(cells: number, P: number, D: number, shannon: boolean) {
    this.data = new Uint8Array(cells * P);
    this.compatible = new Int16Array(cells * P * D);
    this.ones = new Int32Array(cells);
    if (shannon) {
      this.sw = new Float64Array(cells);
      this.swlw = new Float64Array(cells);
      this.entropy = new Float64Array(cells);
    }
  }
  copyFrom(w: Wave): void {
    this.data.set(w.data);
    this.compatible.set(w.compatible);
    this.ones.set(w.ones);
    if (this.sw) {
      this.sw.set(w.sw!);
      this.swlw!.set(w.swlw!);
      this.entropy!.set(w.entropy!);
    }
  }
}

/**
 * The wave of a node: every cell starts with every pattern, the node's rules ban some (`ban`), then tries observe it. MarkovJunior's
 * algorithm: the cell of least entropy (or fewest patterns) first, a pattern drawn by weight, the bans propagated to the neighbours.
 * One difference: a cell left without patterns is always a contradiction (the original looks only at the first cell).
 */
export class WfcSolver {
  readonly P: number;
  readonly D: number;
  readonly cells: number;
  private wave: Wave;
  private start: Wave;
  private prop: Int32Array[][];
  private weights: Float64Array;
  private wlw: Float64Array;
  private sumW = 0;
  private sumWLW = 0;
  private startEntropy = 0;
  private stack: Int32Array;
  private top = 0;
  /** A cell has no pattern left. */
  private dead = false;
  private distribution: Float64Array;

  constructor(private readonly q: WfcProblem) {
    this.P = q.weights.length;
    this.D = q.propagator.length;
    this.cells = q.MX * q.MY * q.MZ;
    this.prop = q.propagator.map((d) => d.map((l) => Int32Array.from(l)));
    this.weights = Float64Array.from(q.weights);
    this.wlw = new Float64Array(this.P);
    for (let t = 0; t < this.P; t++) {
      this.sumW += this.weights[t];
      if (q.shannon) {
        this.wlw[t] = this.weights[t] * Math.log(this.weights[t]);
        this.sumWLW += this.wlw[t];
      }
    }
    if (q.shannon) this.startEntropy = Math.log(this.sumW) - this.sumWLW / this.sumW;
    this.wave = new Wave(this.cells, this.P, this.D, q.shannon);
    this.start = new Wave(this.cells, this.P, this.D, q.shannon);
    this.stack = new Int32Array(this.cells * this.P * 2);
    this.distribution = new Float64Array(this.P);
    this.init();
  }

  private init(): void {
    const { P, D, wave } = this;
    for (let i = 0; i < this.cells; i++) {
      for (let p = 0; p < P; p++) {
        wave.data[i * P + p] = 1;
        for (let d = 0; d < D; d++) wave.compatible[(i * P + p) * D + d] = this.prop[OPPOSITE[d]][p].length;
      }
      wave.ones[i] = P;
      if (wave.sw) {
        wave.sw[i] = this.sumW;
        wave.swlw![i] = this.sumWLW;
        wave.entropy![i] = this.startEntropy;
      }
    }
  }

  /** Whether cell i may still hold pattern t. */
  allows(i: number, t: number): boolean {
    return this.wave.data[i * this.P + t] === 1;
  }

  ban(i: number, t: number): void {
    const { P, D, wave } = this;
    const k = i * P + t;
    wave.data[k] = 0;
    for (let d = 0; d < D; d++) wave.compatible[k * D + d] = 0;
    this.stack[this.top++] = i;
    this.stack[this.top++] = t;
    if (--wave.ones[i] <= 0) this.dead = true;
    if (wave.sw) {
      let sum = wave.sw[i];
      wave.entropy![i] += wave.swlw![i] / sum - Math.log(sum);
      wave.sw[i] -= this.weights[t];
      wave.swlw![i] -= this.wlw[t];
      sum = wave.sw[i];
      wave.entropy![i] -= wave.swlw![i] / sum - Math.log(sum);
    }
  }

  /** Propagates the bans: false on a contradiction, 'late' past `until`. */
  propagate(until: number, now: () => number): boolean | 'late' {
    const { MX, MY, MZ, periodic } = this.q;
    const { P, D, wave } = this;
    const layer = MX * MY;
    let pops = 0;
    while (this.top > 0) {
      const t1 = this.stack[--this.top];
      const i1 = this.stack[--this.top];
      if ((++pops & 4095) === 0 && now() > until) return 'late';
      const x1 = i1 % MX, y1 = Math.floor(i1 / MX) % MY, z1 = Math.floor(i1 / layer);
      for (let d = 0; d < D; d++) {
        let x2 = x1 + DX[d], y2 = y1 + DY[d], z2 = z1 + DZ[d];
        if (!periodic && (x2 < 0 || y2 < 0 || z2 < 0 || x2 >= MX || y2 >= MY || z2 >= MZ)) continue;
        if (x2 < 0) x2 += MX;
        else if (x2 >= MX) x2 -= MX;
        if (y2 < 0) y2 += MY;
        else if (y2 >= MY) y2 -= MY;
        if (z2 < 0) z2 += MZ;
        else if (z2 >= MZ) z2 -= MZ;
        const i2 = x2 + y2 * MX + z2 * layer;
        const p = this.prop[d][t1];
        const base = i2 * P;
        for (let l = 0; l < p.length; l++) {
          const t2 = p[l];
          const c = (base + t2) * D + d;
          if (--wave.compatible[c] === 0) this.ban(i2, t2);
        }
      }
    }
    return !this.dead;
  }

  private nextUnobserved(rng: Rng): number {
    const { wave } = this;
    let min = 1e4;
    let argmin = -1;
    for (let i = 0; i < this.cells; i++) {
      const remaining = wave.ones[i];
      const entropy = wave.entropy ? wave.entropy[i] : remaining;
      if (remaining > 1 && entropy <= min) {
        const noise = 1e-6 * rng.next();
        if (entropy + noise < min) {
          min = entropy + noise;
          argmin = i;
        }
      }
    }
    return argmin;
  }

  private observe(i: number, rng: Rng): void {
    const { P, wave, distribution } = this;
    let sum = 0;
    for (let t = 0; t < P; t++) sum += distribution[t] = wave.data[i * P + t] ? this.weights[t] : 0;
    const threshold = rng.next() * sum;
    let r = 0;
    let partial = 0;
    for (let t = 0; t < P; t++) {
      partial += distribution[t];
      if (partial >= threshold) {
        r = t;
        break;
      }
    }
    for (let t = 0; t < P; t++) if ((wave.data[i * P + t] === 1) !== (t === r)) this.ban(i, t);
  }

  /**
   * The bans so far propagated, then up to `tries` tries, each from a seed drawn from `rng` (MarkovJunior's GoodSeed): the first that
   * observes every cell without a contradiction is the outcome. The same `rng` gives the same outcome; past `until` it is late.
   */
  solve(rng: Rng, tries: number, until: number, now: () => number = Date.now): WfcOutcome {
    const first = this.propagate(until, now);
    if (first === 'late') return { tries: 0, observations: 0, late: true };
    if (!first) return { tries: 0, observations: 0, why: 'le condizioni iniziali sono contraddittorie' };
    this.start.copyFrom(this.wave);
    const deadAtStart = this.dead;
    for (let k = 0; k < tries; k++) {
      const r = new Rng(rng.int(0x7fffffff));
      this.top = 0;
      this.dead = deadAtStart;
      if (k) this.wave.copyFrom(this.start);
      let observations = 0;
      for (;;) {
        const node = this.nextUnobserved(r);
        if (node < 0) return { observed: this.result(), tries: k, observations };
        this.observe(node, r);
        observations++;
        const ok = this.propagate(until, now);
        if (ok === 'late' || now() > until) return { tries: k + 1, observations, late: true };
        if (!ok) break;
      }
    }
    return { tries, observations: 0, why: `nessun tentativo senza contraddizioni su ${tries}` };
  }

  private result(): Int32Array {
    const { P, wave } = this;
    const out = new Int32Array(this.cells);
    for (let i = 0; i < this.cells; i++) {
      let t = 0;
      while (t < P - 1 && !wave.data[i * P + t]) t++;
      out[i] = t;
    }
    return out;
  }
}

// ---------------------------------------------------------------- ConvChain (ConvChain.cs)

/**
 * The weights of ConvChain: how often each N×N window of a flat black and white sample appears, with its symmetries (each counted, as
 * the original does); a window that never appears weighs 0.1.
 */
export function convchainWeights(sample: Uint8Array, SX: number, SY: number, N: number, subgroup: readonly boolean[]): Float64Array {
  if (!Number.isInteger(N) || N < 1 || N > WFC_LIMITS.convchainN) throw new WfcError(`convchain: n va da 1 a ${WFC_LIMITS.convchainN}`);
  const weights = new Float64Array(1 << (N * N));
  const pattern = (f: (x: number, y: number) => number) => {
    const out = new Uint8Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) out[x + y * N] = f(x, y);
    return out;
  };
  const rotated = (p: Uint8Array) => pattern((x, y) => p[N - 1 - y + x * N]);
  const reflected = (p: Uint8Array) => pattern((x, y) => p[N - 1 - x + y * N]);
  for (let y = 0; y < SY; y++)
    for (let x = 0; x < SX; x++) {
      const p = pattern((dx, dy) => sample[((x + dx) % SX) + ((y + dy) % SY) * SX]);
      for (const q of squareSymmetries(p, rotated, reflected, never, subgroup)) {
        let index = 0;
        for (let i = 0; i < q.length; i++) if (q[i]) index += 1 << i;
        weights[index] += 1;
      }
    }
  for (let k = 0; k < weights.length; k++) if (weights[k] <= 0) weights[k] = 0.1;
  return weights;
}
