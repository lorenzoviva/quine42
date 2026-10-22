// Wave function collapse over a catalogue of block variants (structure.ts): every cell holds the set of
// variants still possible as a bitset, the compatibilities in the six directions are precomputed bitsets,
// so propagating is a few OR and AND of machine words. The cell with fewest options is taken from a heap;
// a contradiction resets only the neighbourhood where it happened (growing if it comes back), never the
// whole grid.

import { Rng } from '../../src/kernel/rng';

/** Directions: 0 north (-y), 1 east (+x), 2 south (+y), 3 west (-x), 4 up (+z), 5 down (-z). */
export const DIR6: ReadonlyArray<readonly [number, number, number]> = [[0, -1, 0], [1, 0, 0], [0, 1, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
export const OPPOSITE6 = [2, 3, 0, 1, 5, 4];

export interface WfcProblem {
  X: number;
  Y: number;
  Z: number;
  /** Number of variants; variant 0 is the empty cell. */
  K: number;
  /** compat[d][a * W + w]: word w of the variants allowed next to `a` in direction d. */
  compat: Uint32Array[];
  /** Initial options per cell (N × W words); a single bit is a fixed cell. */
  domain: Uint32Array;
  /** Weight of each variant, per cell's zone: weights[zone[c]][v]. */
  zone: Uint16Array;
  weights: Float64Array[];
  seed: number;
  /** Milliseconds before giving up. */
  budget?: number;
}

export interface WfcResult {
  /** Variant per cell, or -1 where nothing could be chosen. */
  assign: Int32Array;
  ok: boolean;
  /** Neighbourhoods reset after a contradiction. */
  repairs: number;
  /** Cells whose options were empty from the start (fixed cells that cannot stand together). */
  impossible: number[];
  ms: number;
}

export const words = (K: number) => (K + 31) >>> 5;

const popcount = (x: number) => {
  x -= (x >>> 1) & 0x55555555;
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
};

/** A min-heap of cells keyed by (options + a little noise); stale entries are skipped on pop. */
class Heap {
  keys: number[] = [];
  cells: number[] = [];
  push(key: number, cell: number) {
    let i = this.keys.push(key) - 1;
    this.cells.push(cell);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.keys[p] <= this.keys[i]) break;
      [this.keys[p], this.keys[i]] = [this.keys[i], this.keys[p]];
      [this.cells[p], this.cells[i]] = [this.cells[i], this.cells[p]];
      i = p;
    }
  }
  pop(): [number, number] | undefined {
    if (!this.keys.length) return undefined;
    const top: [number, number] = [this.keys[0], this.cells[0]];
    const k = this.keys.pop()!, c = this.cells.pop()!;
    if (this.keys.length) {
      this.keys[0] = k;
      this.cells[0] = c;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < this.keys.length && this.keys[l] < this.keys[m]) m = l;
        if (r < this.keys.length && this.keys[r] < this.keys[m]) m = r;
        if (m === i) break;
        [this.keys[m], this.keys[i]] = [this.keys[i], this.keys[m]];
        [this.cells[m], this.cells[i]] = [this.cells[i], this.cells[m]];
        i = m;
      }
    }
    return top;
  }
}

export function solve(p: WfcProblem): WfcResult {
  const t0 = Date.now();
  const deadline = t0 + (p.budget ?? 20000);
  const { X, Y, Z, K, compat } = p;
  const W = words(K);
  const N = X * Y * Z;
  const rng = new Rng(p.seed);
  const init = new Uint32Array(p.domain);
  const dom = new Uint32Array(p.domain);
  const count = new Int32Array(N);
  const countOf = (c: number) => {
    let n = 0;
    for (let w = 0; w < W; w++) n += popcount(dom[c * W + w]);
    return n;
  };
  const neighbour = (c: number, d: number) => {
    const x = (c % X) + DIR6[d][0], y = (Math.floor(c / X) % Y) + DIR6[d][1], z = Math.floor(c / (X * Y)) + DIR6[d][2];
    return x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z ? -1 : x + y * X + z * X * Y;
  };
  // Outside the grid is empty (variant 0): a variant may sit on the border only if empty may face it.
  const border = Array.from({ length: 6 }, (_, d) => {
    const ok = new Uint32Array(W);
    for (let a = 0; a < K; a++) if (compat[d][a * W] & 1) ok[a >>> 5] |= 1 << (a & 31);
    return ok;
  });
  for (let c = 0; c < N; c++)
    for (let d = 0; d < 6; d++) if (neighbour(c, d) < 0) for (let w = 0; w < W; w++) init[c * W + w] &= border[d][w];
  dom.set(init);
  const impossible: number[] = [];
  for (let c = 0; c < N; c++) {
    count[c] = countOf(c);
    if (!count[c]) impossible.push(c);
  }
  const heap = new Heap();
  const queued = new Uint8Array(N);
  const queue: number[] = [];
  const enqueue = (c: number) => {
    if (!queued[c]) {
      queued[c] = 1;
      queue.push(c);
    }
  };
  const support = new Uint32Array(W);
  /** Returns the cell that ran out of options, or -1. */
  const propagate = (): number => {
    while (queue.length) {
      const c = queue.pop()!;
      queued[c] = 0;
      if (count[c] === K) continue;
      for (let d = 0; d < 6; d++) {
        const n = neighbour(c, d);
        if (n < 0 || count[n] <= 0) continue;
        support.fill(0);
        for (let w = 0; w < W; w++) {
          let bits = dom[c * W + w];
          while (bits) {
            const b = bits & -bits;
            const a = (w << 5) + 31 - Math.clz32(b);
            const row = a * W;
            for (let v = 0; v < W; v++) support[v] |= compat[d][row + v];
            bits ^= b;
          }
        }
        let changed = false;
        for (let w = 0; w < W; w++) {
          const before = dom[n * W + w];
          // ">>> 0": & gives a signed number, which would never equal the unsigned word with bit 31 set.
          const after = (before & support[w]) >>> 0;
          if (after !== before) {
            dom[n * W + w] = after;
            changed = true;
          }
        }
        if (!changed) continue;
        count[n] = countOf(n);
        if (!count[n]) return n;
        if (count[n] > 1) heap.push(count[n] + rng.next() * 0.5, n);
        enqueue(n);
      }
    }
    return -1;
  };
  // Resets the cells round a contradiction to their first options, then lets the rest constrain them.
  let repairs = 0;
  const radius = new Map<number, number>();
  const repair = (at: number): boolean => {
    repairs++;
    if (repairs > 200 + N / 50) return false;
    const key = Math.floor((at % X) / 4) + Math.floor(Math.floor(at / X) % Y / 4) * 1000;
    const r = Math.min(12, (radius.get(key) ?? 1) + 1);
    radius.set(key, r);
    queue.length = 0;
    queued.fill(0);
    const ax = at % X, ay = Math.floor(at / X) % Y;
    for (let z = 0; z < Z; z++)
      for (let y = Math.max(0, ay - r); y <= Math.min(Y - 1, ay + r); y++)
        for (let x = Math.max(0, ax - r); x <= Math.min(X - 1, ax + r); x++) {
          const c = x + y * X + z * X * Y;
          for (let w = 0; w < W; w++) dom[c * W + w] = init[c * W + w];
          count[c] = countOf(c);
          if (count[c] > 1) heap.push(count[c] + rng.next() * 0.5, c);
        }
    // Everything round the reset square constrains it again (and it constrains itself).
    for (let z = 0; z < Z; z++)
      for (let y = Math.max(0, ay - r - 1); y <= Math.min(Y - 1, ay + r + 1); y++)
        for (let x = Math.max(0, ax - r - 1); x <= Math.min(X - 1, ax + r + 1); x++) enqueue(x + y * X + z * X * Y);
    return true;
  };

  for (let c = 0; c < N; c++) {
    if (count[c] > 0 && count[c] < K) enqueue(c);
    if (count[c] > 1) heap.push(count[c] + rng.next() * 0.5, c);
  }
  let ok = !impossible.length;
  let bad = ok ? propagate() : -1;
  while (ok) {
    if (Date.now() > deadline) {
      ok = false;
      break;
    }
    if (bad >= 0) {
      if (!repair(bad)) {
        ok = false;
        break;
      }
      bad = propagate();
      continue;
    }
    // The undecided cell with fewest options.
    let next: [number, number] | undefined;
    while ((next = heap.pop()) && (count[next[1]] <= 1 || Math.floor(next[0]) !== count[next[1]]));
    if (!next) break;
    const c = next[1];
    const ws = p.weights[p.zone[c]];
    let total = 0;
    for (let w = 0; w < W; w++) {
      let bits = dom[c * W + w];
      while (bits) {
        const b = bits & -bits;
        total += ws[(w << 5) + 31 - Math.clz32(b)] || 1e-6;
        bits ^= b;
      }
    }
    let r = rng.next() * total;
    let pick = -1;
    for (let w = 0; w < W && pick < 0; w++) {
      let bits = dom[c * W + w];
      while (bits) {
        const b = bits & -bits;
        const v = (w << 5) + 31 - Math.clz32(b);
        if ((r -= ws[v] || 1e-6) < 0) {
          pick = v;
          break;
        }
        bits ^= b;
      }
    }
    if (pick < 0) for (let v = K - 1; v >= 0 && pick < 0; v--) if (dom[c * W + (v >>> 5)] & (1 << (v & 31))) pick = v;
    for (let w = 0; w < W; w++) dom[c * W + w] = 0;
    dom[c * W + (pick >>> 5)] = 1 << (pick & 31);
    count[c] = 1;
    enqueue(c);
    bad = propagate();
  }
  const assign = new Int32Array(N).fill(-1);
  for (let c = 0; c < N; c++)
    if (count[c] === 1) for (let v = 0; v < K; v++) if (dom[c * W + (v >>> 5)] & (1 << (v & 31))) assign[c] = v;
  ok = ok && assign.every((v) => v >= 0);
  return { assign, ok, repairs, impossible, ms: Date.now() - t0 };
}
