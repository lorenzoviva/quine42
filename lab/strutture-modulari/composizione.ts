// The composition of a module set over the places of the world (T522): seamless across the places and the same whatever order they are
// loaded in. The cells of a place (18 tiles, 9 cells of 2 tiles) are solved in three kinds of regions, each a pure function of the world's
// seed, its position and the regions it leans on:
//   1. the corners: the 2 × 2 cells around the point where four places meet;
//   2. the edges: the two rows of cells along the side two places share, between two corners (fixed at their ends);
//   3. the inside of a place: 7 × 7 cells with its ring of edges and corners fixed.
// A region is a wave of MarkovJunior's solver (src/mj/wfc.ts, `WfcSolver`) with the cells of its ring and the rules of the ground banned
// beforehand, tried from a seed of its own: the order in which places are asked never changes a cell (the lazy, deterministic scheme of
// Boris the Brave's «modifying in blocks», laid on the grid of places as the gates already are, ADR-0206 and layout.ts).

import { hash32, Rng } from '../../src/kernel/rng';
import { DX, DY, DZ, WfcSolver } from '../../src/mj/wfc';
import type { Grid3 } from '../../src/mj/engine';
import { STEP, type ModuleSet, type Pattern } from './facce';
import { ALPHABET, C, H } from './moduli';

/** Cells of a place along a side: 18 tiles at 2 tiles a cell. */
export const PLACE = 9;

export interface Options {
  seed: number;
  /** Storeys of the composition (the top one only roofs and sky). */
  storeys: number;
  /** Houses that stand already (overlay): the cell → the pattern, fixed before the waves. */
  standing?: (gx: number, gy: number) => number | undefined;
  /**
   * The massing, decided before the waves (the circulation's skeleton, T522 § 5): how many storeys of rooms a column has, and the core
   * that climbs it (a module `nucleo-<h>`), or none. Without it every column is free.
   */
  massing?: (gx: number, gy: number) => { h: number; core?: string };
  /** Corners and edges look one cell into the places around them (the default); `false` to measure without. */
  margin?: boolean;
  tries?: number;
  /** Seeds tried after the first, when a region has no solution. */
  retries?: number;
}

const mod = (a: number, n: number) => ((a % n) + n) % n;
const key = (x: number, y: number, z: number) => `${x},${y},${z}`;

/** The streets of the prototype: the middle row and column of every place, through the gates (tiles 8-9 of every side). */
export const isStreet = (gx: number, gy: number) => mod(gx, PLACE) === 4 || mod(gy, PLACE) === 4;

export interface RegionLog {
  kind: string;
  at: string;
  cells: number;
  ms: number;
  tries: number;
  attempts: number;
  failed: boolean;
  why?: string;
}

export class Composer {
  readonly cells = new Map<string, number>();
  readonly log: RegionLog[] = [];
  private done = new Set<string>();
  private allowedCache = new Map<string, boolean[]>();

  constructor(readonly set: ModuleSet, readonly o: Options) {}

  /** What a cell may hold: the rules of the ground and of the top, the streets, the massing and its cores. */
  private allowed(gx: number, gy: number, z: number): boolean[] {
    const Z = this.o.storeys;
    const street = z === 0 && isStreet(gx, gy);
    const m = this.o.massing?.(gx, gy);
    const k = `${z}|${street}|${m ? `${m.h}|${m.core ?? ''}` : '-'}`;
    const hit = this.allowedCache.get(k);
    if (hit) return hit;
    const isCore = (name: string) => name.startsWith('nucleo-');
    const out = this.set.patterns.map((p) => {
      if (z === 0 && (p.module.where === 'above' || p.faces[5].k === 'L')) return false;
      if (z > 0 && p.module.where === 'ground') return false;
      if (z === Z - 1 && (p.faces[4].k === 'needs' || p.faces[4].k === 'L')) return false;
      if (street && !['strada', 'portico'].includes(p.module.name)) return false;
      const covered = p.faces[4].k === 'needs' || (p.faces[4].k === 'L' && p.module.covered);
      if (!m) return !isCore(p.module.name);
      if (m.core && z < m.h) return p.module.name === m.core && p.cell[2] === z;
      if (isCore(p.module.name)) return false;
      return z < m.h ? covered : !covered;
    });
    this.allowedCache.set(k, out);
    return out;
  }

  /**
   * One region: `todo` are its cells, `ring` cells solved before it (fixed), `margin` cells it looks at without keeping them (free, only
   * the rules of the ground and the massing: what will stand there must have a way to meet it). The margin never depends on what was
   * solved: so the region is the same whatever was solved first.
   */
  private solve(kind: string, at: string, todo: Array<[number, number]>, ring: Array<[number, number]>, seedParts: number[], margin: Array<[number, number]> = []): void {
    const t0 = performance.now();
    const all = [...todo, ...ring, ...margin];
    const x0 = Math.min(...all.map((c) => c[0])), x1 = Math.max(...all.map((c) => c[0]));
    const y0 = Math.min(...all.map((c) => c[1])), y1 = Math.max(...all.map((c) => c[1]));
    const MX = x1 - x0 + 1, MY = y1 - y0 + 1, MZ = this.o.storeys;
    const P = this.set.patterns.length;
    const fixed = new Map<string, number>();
    for (const [gx, gy] of ring) for (let z = 0; z < MZ; z++) fixed.set(key(gx, gy, z), this.cells.get(key(gx, gy, z))!);
    if (this.o.standing)
      for (const [gx, gy] of todo) {
        const p = this.o.standing(gx, gy);
        if (p !== undefined) fixed.set(key(gx, gy, 0), p);
      }
    const inRegion = new Set(all.map(([x, y]) => `${x},${y}`));
    let attempts = 0, tries = 0, why = '';
    for (let attempt = 0; attempt <= (this.o.retries ?? 8); attempt++) {
      attempts++;
      const solver = new WfcSolver({ MX, MY, MZ, weights: this.set.weights, propagator: this.set.propagator, periodic: false, shannon: false });
      for (let y = 0; y < MY; y++)
        for (let x = 0; x < MX; x++) {
          const gx = x0 + x, gy = y0 + y;
          if (!inRegion.has(`${gx},${gy}`)) throw new Error(`la regione ${kind} ${at} non è un rettangolo`);
          for (let z = 0; z < MZ; z++) {
            const i = x + y * MX + z * MX * MY;
            const f = fixed.get(key(gx, gy, z));
            const ok = this.allowed(gx, gy, z);
            for (let t = 0; t < P; t++) if (f !== undefined ? t !== f : !ok[t]) solver.ban(i, t);
          }
        }
      const out = solver.solve(new Rng(hash32(this.o.seed, ...seedParts, attempt)), this.o.tries ?? 50, performance.now() + 10_000, () => performance.now());
      tries += out.tries;
      if (!out.observed) {
        why = out.why ?? (out.late ? 'tempo' : '');
        continue;
      }
      for (const [gx, gy] of todo)
        for (let z = 0; z < MZ; z++) this.cells.set(key(gx, gy, z), out.observed[gx - x0 + (gy - y0) * MX + z * MX * MY]);
      this.log.push({ kind, at, cells: todo.length * MZ, ms: performance.now() - t0, tries, attempts, failed: false });
      return;
    }
    // No solution: the region keeps what the ground allows, the first pattern of each cell, and says it (the report counts these).
    for (const [gx, gy] of todo)
      for (let z = 0; z < MZ; z++) {
        const ok = this.allowed(gx, gy, z);
        this.cells.set(key(gx, gy, z), fixed.get(key(gx, gy, z)) ?? ok.indexOf(true));
      }
    this.log.push({ kind, at, cells: todo.length * MZ, ms: performance.now() - t0, tries, attempts, failed: true, why });
  }

  /** The corner where the places (i-1, j-1), (i, j-1), (i-1, j), (i, j) meet. */
  corner(i: number, j: number): void {
    const k = `c${i},${j}`;
    if (this.done.has(k)) return;
    this.done.add(k);
    const cells: Array<[number, number]> = [];
    const margin: Array<[number, number]> = [];
    for (let gx = PLACE * i - 2; gx <= PLACE * i + 1; gx++)
      for (let gy = PLACE * j - 2; gy <= PLACE * j + 1; gy++) (Math.abs(2 * gx - (2 * PLACE * i - 1)) === 1 && Math.abs(2 * gy - (2 * PLACE * j - 1)) === 1 ? cells : margin).push([gx, gy]);
    this.solve('angolo', `${i},${j}`, cells, [], [1, i, j], this.o.margin === false ? [] : margin);
  }

  /** The edge between the places (i-1, j) and (i, j) (`vertical`), or between (i, j-1) and (i, j). */
  edge(i: number, j: number, vertical: boolean): void {
    const k = `${vertical ? 'v' : 'h'}${i},${j}`;
    if (this.done.has(k)) return;
    this.done.add(k);
    const todo: Array<[number, number]> = [];
    const ring: Array<[number, number]> = [];
    const margin: Array<[number, number]> = [];
    if (vertical) {
      this.corner(i, j);
      this.corner(i, j + 1);
      for (const gx of [PLACE * i - 1, PLACE * i]) {
        for (let gy = PLACE * j + 1; gy <= PLACE * j + PLACE - 2; gy++) todo.push([gx, gy]);
        ring.push([gx, PLACE * j], [gx, PLACE * j + PLACE - 1]);
      }
      for (const gx of [PLACE * i - 2, PLACE * i + 1]) for (let gy = PLACE * j; gy <= PLACE * j + PLACE - 1; gy++) margin.push([gx, gy]);
    } else {
      this.corner(i, j);
      this.corner(i + 1, j);
      for (const gy of [PLACE * j - 1, PLACE * j]) {
        for (let gx = PLACE * i + 1; gx <= PLACE * i + PLACE - 2; gx++) todo.push([gx, gy]);
        ring.push([PLACE * i, gy], [PLACE * i + PLACE - 1, gy]);
      }
      for (const gy of [PLACE * j - 2, PLACE * j + 1]) for (let gx = PLACE * i; gx <= PLACE * i + PLACE - 1; gx++) margin.push([gx, gy]);
    }
    this.solve(vertical ? 'bordo-v' : 'bordo-o', `${i},${j}`, todo, ring, [vertical ? 2 : 3, i, j], this.o.margin === false ? [] : margin);
  }

  /** A place: its edges and corners first (each once, from its own seed), then its inside. */
  place(i: number, j: number): void {
    const k = `p${i},${j}`;
    if (this.done.has(k)) return;
    this.edge(i, j, true);
    this.edge(i + 1, j, true);
    this.edge(i, j, false);
    this.edge(i, j + 1, false);
    this.done.add(k);
    const todo: Array<[number, number]> = [];
    const ring: Array<[number, number]> = [];
    for (let ly = 0; ly < PLACE; ly++)
      for (let lx = 0; lx < PLACE; lx++) {
        const c: [number, number] = [PLACE * i + lx, PLACE * j + ly];
        (lx === 0 || ly === 0 || lx === PLACE - 1 || ly === PLACE - 1 ? ring : todo).push(c);
      }
    this.solve('luogo', `${i},${j}`, todo, ring, [4, i, j]);
  }

  pattern(gx: number, gy: number, gz: number): Pattern | undefined {
    const t = this.cells.get(key(gx, gy, gz));
    return t === undefined ? undefined : this.set.patterns[t];
  }
}

// ---------------------------------------------------------------- rule 10 on the graph of the modules

const walkable = (p: Pattern) => p.module.name !== 'aria' && !(p.module.name === 'scala' && p.cell[1] === 0 && p.cell[2] === 1);
/** The inner seams one walks through: the stair's ramp (a → b) and its top (b → the cell above it), a core from storey to storey. */
const walkSeam = (p: Pattern, q: Pattern) =>
  (p.module.name === 'scala' && q.module.name === 'scala' && ((p.cell[2] === 0 && q.cell[2] === 0) || (p.cell[1] === 1 && q.cell[1] === 1))) ||
  (p.module.name.startsWith('nucleo-') && p.module === q.module);

/**
 * The cells a body reaches from the streets, moving between cells whose touching faces are both passages within a step, or along the inner
 * seams of the stair. What a walkable cell (a room, a roof, a stair) that is not reached says is what rule 10 would refuse.
 */
export function reached(comp: Composer, x0: number, y0: number, x1: number, y1: number): Set<string> {
  const Z = comp.o.storeys;
  const seen = new Set<string>();
  const queue: Array<[number, number, number]> = [];
  for (let gy = y0; gy <= y1; gy++)
    for (let gx = x0; gx <= x1; gx++) {
      const p = comp.pattern(gx, gy, 0);
      if (p && isStreet(gx, gy) && ['strada', 'portico'].includes(p.module.name)) {
        seen.add(key(gx, gy, 0));
        queue.push([gx, gy, 0]);
      }
    }
  while (queue.length) {
    const [x, y, z] = queue.pop()!;
    const p = comp.pattern(x, y, z)!;
    for (let d = 0; d < 6; d++) {
      const nx = x + DX[d], ny = y + DY[d], nz = z + DZ[d];
      if (nx < x0 || ny < y0 || nx > x1 || ny > y1 || nz < 0 || nz >= Z || seen.has(key(nx, ny, nz))) continue;
      const q = comp.pattern(nx, ny, nz);
      if (!q || !walkable(q)) continue;
      let ok = false;
      if (d < 4) {
        const a = p.faces[d], b = q.faces[(d + 2) % 4];
        if ((a.k === 'P' || a.k === 'D') && (b.k === 'P' || b.k === 'D')) ok = Math.abs(a.h - b.h) <= STEP;
        else if (a.k === 'L' && b.k === 'L' && a.label === b.label) ok = walkSeam(p, q);
      } else {
        const a = p.faces[d === 4 ? 4 : 5], b = q.faces[d === 4 ? 5 : 4];
        ok = a.k === 'L' && b.k === 'L' && a.label === b.label && walkSeam(p, q);
      }
      if (!ok) continue;
      seen.add(key(nx, ny, nz));
      queue.push([nx, ny, nz]);
    }
  }
  return seen;
}

export interface Reach {
  rooms0: [number, number];
  roomsUp: [number, number];
  roofs: [number, number];
  stairs: [number, number];
}

/** Walkable cells of a rectangle of cells, reached and in all, by kind. */
export function reachOf(comp: Composer, seen: Set<string>, x0: number, y0: number, x1: number, y1: number): Reach {
  const out: Reach = { rooms0: [0, 0], roomsUp: [0, 0], roofs: [0, 0], stairs: [0, 0] };
  for (let z = 0; z < comp.o.storeys; z++)
    for (let gy = y0; gy <= y1; gy++)
      for (let gx = x0; gx <= x1; gx++) {
        const p = comp.pattern(gx, gy, z)!;
        if (!walkable(p) || ['strada', 'portico'].includes(p.module.name)) continue;
        const bin = p.module.name === 'scala' || p.module.name.startsWith('nucleo-') ? out.stairs : p.faces[4].k === 'needs' ? (z === 0 ? out.rooms0 : out.roomsUp) : out.roofs;
        bin[1]++;
        if (seen.has(key(gx, gy, z))) bin[0]++;
      }
  return out;
}

// ---------------------------------------------------------------- the voxels

/** The voxels of a rectangle of cells, every `step`-th voxel (1 the whole, 2 half on every axis: what a cell of 2³ holds, its first solid). */
export function voxels(comp: Composer, x0: number, y0: number, x1: number, y1: number, step = 1): Grid3 {
  const cw = C / step, ch = H / step;
  const X = (x1 - x0 + 1) * cw, Y = (y1 - y0 + 1) * cw, Z = comp.o.storeys * ch;
  const cells = new Uint8Array(X * Y * Z);
  for (let gz = 0; gz < comp.o.storeys; gz++)
    for (let gy = y0; gy <= y1; gy++)
      for (let gx = x0; gx <= x1; gx++) {
        const p = comp.pattern(gx, gy, gz);
        if (!p) continue;
        const b = p.voxels;
        for (let z = 0; z < ch; z++)
          for (let y = 0; y < cw; y++)
            for (let x = 0; x < cw; x++) {
              let v = 0;
              for (let k = 0; k < step * step * step && !v; k++) v = b.get(x * step + (k % step), y * step + (Math.floor(k / step) % step), z * step + Math.floor(k / (step * step)));
              if (v) cells[(gx - x0) * cw + x + ((gy - y0) * cw + y) * X + (gz * ch + z) * X * Y] = v;
            }
      }
  return { X, Y, Z, cells, alphabet: [...ALPHABET], log: [], epoch: 0 };
}
