// Inference in MarkovJunior's rule nodes (T334, ADR-0173), as MarkovJunior does it (github.com/mxgmn/MarkovJunior, source/Field.cs,
// Observation.cs, Search.cs), in three dimensions:
//   field     a potential per code: the distance, over the `on` cells, from the nearest `to` cell (or `from`, inversed); the node then
//             prefers the matches that lower the potential of what they write (`temperature` makes the preference soft)
//   observe   what some codes must become: the grid is read as a present and a future, the potentials propagate the rules backwards
//             from the future, and the node prefers the matches that bring the present nearer to it
//   search    instead, a best-first search for a whole trajectory from the present to the future, within ceilings of states, bytes
//             and time
// Pure functions on arrays: the engine (`GuidedRunner` in engine.ts) keeps the grid, the matches and the random numbers.

import { Rng } from '../kernel/rng';

/** A rule (one symmetry variant) as inference reads it. */
export interface InferRule {
  dx: number;
  dy: number;
  dz: number;
  /** Per cell: the codes the input accepts (flags indexed by code), or undefined for anything ('*'). */
  input: Array<Uint8Array | undefined>;
  /** Per cell: the code written, -1 kept. */
  output: Int16Array;
}

/**
 * The ceilings of inference. MarkovJunior has none without `limit`: here a search keeps at most `boards` states and `boardBytes` bytes
 * of them (both deterministic: the same seed finds the same trajectory, or none), and past `searchMs` it stops and the run counts as
 * not finished. `potentialBytes` bounds the potentials of one node (codes × cells × 4 bytes, twice for a search).
 */
export const INFERENCE_LIMITS = {
  potentialBytes: 128 * 2 ** 20,
  boards: 100_000,
  boardBytes: 64 * 2 ** 20,
  /** Child states of one state: the enumeration of `all` grows exponentially with its matches. */
  children: 4096,
  searchMs: 10_000,
};

/** Observations hold the future of a cell as a 32-bit set of codes, as MarkovJunior does. */
export const MAX_OBSERVED_CODES = 32;

/** What propagation needs of a rule on a grid of C codes, X wide and X·Y a layer. */
export interface Prepared {
  rule: InferRule;
  /** Per cell: -1 if the input accepts every code, else the lowest code it accepts (MarkovJunior's `binput`). */
  binput: Int16Array;
  /** Per code: the cells (i, j, k in a row) of the input that accept it. */
  ishifts: Int32Array[];
  /** Per code: the cells of the output that write it or keep the cell. */
  oshifts: Int32Array[];
  /** Per cell: its offset in the grid from the rule's origin. */
  off: Int32Array;
}

/** The rules that fit in an X·Y·Z grid, ready for propagation and search. */
export function prepare(rules: InferRule[], C: number, X: number, Y: number, Z: number): Prepared[] {
  const out: Prepared[] = [];
  for (const rule of rules) {
    const { dx, dy, dz } = rule;
    if (dx > X || dy > Y || dz > Z) continue;
    const n = dx * dy * dz;
    const binput = new Int16Array(n);
    const ins: number[][] = Array.from({ length: C }, () => []);
    const outs: number[][] = Array.from({ length: C }, () => []);
    const off = new Int32Array(n);
    for (let k = 0, m = 0; k < dz; k++)
      for (let j = 0; j < dy; j++)
        for (let i = 0; i < dx; i++, m++) {
          off[m] = i + j * X + k * X * Y;
          const set = rule.input[m];
          let lowest = -1;
          let all = true;
          for (let c = 0; c < C; c++) {
            if (set === undefined || set[c]) {
              ins[c].push(i, j, k);
              if (lowest < 0) lowest = c;
            } else all = false;
          }
          binput[m] = all ? -1 : lowest;
          const o = rule.output[m];
          for (let c = 0; c < C; c++) if (o === -1 || o === c) outs[c].push(i, j, k);
        }
    out.push({ rule, binput, ishifts: ins.map((l) => Int32Array.from(l)), oshifts: outs.map((l) => Int32Array.from(l)), off });
  }
  return out;
}

/**
 * MarkovJunior's Field.Compute: in `potential`, the distance over `substrate` cells (six neighbours) from the nearest `zero` cell, -1
 * where it does not reach. False if no cell is `zero`. `queue` holds at least as many numbers as cells.
 */
export function fieldPotential(potential: Int32Array, cells: Uint8Array, X: number, Y: number, Z: number, zero: Uint8Array, substrate: Uint8Array, queue: Int32Array): boolean {
  const N = cells.length;
  const XY = X * Y;
  let tail = 0;
  for (let i = 0; i < N; i++) {
    if (zero[cells[i]]) {
      potential[i] = 0;
      queue[tail++] = i;
    } else potential[i] = -1;
  }
  if (!tail) return false;
  for (let head = 0; head < tail; head++) {
    const c = queue[head];
    const t = potential[c] + 1;
    const x = c % X;
    const y = ((c / X) | 0) % Y;
    const z = (c / XY) | 0;
    const visit = (n: number) => {
      if (potential[n] === -1 && substrate[cells[n]]) {
        potential[n] = t;
        queue[tail++] = n;
      }
    };
    if (x > 0) visit(c - 1);
    if (x < X - 1) visit(c + 1);
    if (y > 0) visit(c - X);
    if (y < Y - 1) visit(c + X);
    if (z > 0) visit(c - XY);
    if (z < Z - 1) visit(c + XY);
  }
  return true;
}

/** Buffers of the propagation, kept between calls: a queue of (code, cell) pairs and one bit per rule and cell. */
export interface Work {
  queue: Int32Array;
  mask: Uint8Array;
}

export function makeWork(C: number, N: number, R: number): Work {
  return { queue: new Int32Array(C * N), mask: new Uint8Array(Math.ceil((R * N) / 8)) };
}

/**
 * MarkovJunior's ComputePotentials: from the cells at 0, the potentials grow along the rules (forwards, how soon a code can be in a
 * cell; backwards, how far a code in a cell is from the future). The levels do not depend on the order of the queue.
 */
function propagate(pot: Int32Array[], X: number, Y: number, Z: number, rules: Prepared[], backwards: boolean, w: Work): void {
  const C = pot.length;
  const XY = X * Y;
  const N = XY * Z;
  const queue = w.queue;
  const mask = w.mask;
  mask.fill(0);
  let tail = 0;
  for (let c = 0; c < C; c++) {
    const p = pot[c];
    for (let i = 0; i < N; i++) if (p[i] === 0) queue[tail++] = c * N + i;
  }
  for (let head = 0; head < tail; head++) {
    const e = queue[head];
    const value = (e / N) | 0;
    const i = e - value * N;
    const x = i % X;
    const y = ((i / X) | 0) % Y;
    const z = (i / XY) | 0;
    const t = pot[value][i];
    for (let r = 0; r < rules.length; r++) {
      const pr = rules[r];
      const { dx, dy, dz } = pr.rule;
      const shifts = backwards ? pr.oshifts[value] : pr.ishifts[value];
      const reads = backwards ? pr.rule.output : pr.binput;
      const writes = backwards ? pr.binput : pr.rule.output;
      const off = pr.off;
      for (let l = 0; l < shifts.length; l += 3) {
        const sx = x - shifts[l], sy = y - shifts[l + 1], sz = z - shifts[l + 2];
        if (sx < 0 || sy < 0 || sz < 0 || sx + dx > X || sy + dy > Y || sz + dz > Z) continue;
        const si = sx + sy * X + sz * XY;
        const m = r * N + si;
        if (mask[m >> 3] & (1 << (m & 7))) continue;
        let ok = true;
        for (let n = 0; n < reads.length; n++) {
          const v = reads[n];
          if (v === -1) continue;
          const cur = pot[v][si + off[n]];
          if (cur > t || cur === -1) {
            ok = false;
            break;
          }
        }
        if (!ok) continue;
        mask[m >> 3] |= 1 << (m & 7);
        for (let n = 0; n < writes.length; n++) {
          const o = writes[n];
          if (o === -1) continue;
          const idx = si + off[n];
          if (pot[o][idx] === -1) {
            pot[o][idx] = t + 1;
            queue[tail++] = o * N + idx;
          }
        }
      }
    }
  }
}

/** How soon each code can be in each cell, applying the rules to `state` (MarkovJunior's ComputeForwardPotentials). */
export function forwardPotentials(pot: Int32Array[], state: Uint8Array, X: number, Y: number, Z: number, rules: Prepared[], w: Work): void {
  for (const p of pot) p.fill(-1);
  for (let i = 0; i < state.length; i++) pot[state[i]][i] = 0;
  propagate(pot, X, Y, Z, rules, false, w);
}

/** How far a code in a cell is from the future, running the rules backwards (MarkovJunior's ComputeBackwardPotentials). */
export function backwardPotentials(pot: Int32Array[], future: Uint32Array, X: number, Y: number, Z: number, rules: Prepared[], w: Work): void {
  for (let c = 0; c < pot.length; c++) {
    const p = pot[c];
    const bit = 1 << c;
    for (let i = 0; i < future.length; i++) p[i] = future[i] & bit ? 0 : -1;
  }
  propagate(pot, X, Y, Z, rules, true, w);
}

/** True when every cell holds one of the codes of its future. */
export function goalReached(present: Uint8Array, future: Uint32Array): boolean {
  for (let i = 0; i < present.length; i++) if (((1 << present[i]) & future[i]) === 0) return false;
  return true;
}

/** The sum over the cells of the soonest a code of their future can be there; -1 if one never can. */
export function forwardPointwise(pot: Int32Array[], future: Uint32Array): number {
  let sum = 0;
  for (let i = 0; i < future.length; i++) {
    let f = future[i];
    let min = -1;
    for (let c = 0; c < pot.length && f; c++, f >>>= 1) {
      if ((f & 1) === 0) continue;
      const p = pot[c][i];
      if (p >= 0 && (min < 0 || p < min)) min = p;
    }
    if (min < 0) return -1;
    sum += min;
  }
  return sum;
}

/** The sum over the cells of how far their code is from the future; -1 if one cannot get there. */
export function backwardPointwise(pot: Int32Array[], present: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < present.length; i++) {
    const p = pot[present[i]][i];
    if (p < 0) return -1;
    sum += p;
  }
  return sum;
}

// ---------------------------------------------------------------- search

function matchesAt(pr: Prepared, state: Uint8Array, o: number): boolean {
  const input = pr.rule.input;
  const off = pr.off;
  for (let n = 0; n < input.length; n++) {
    const set = input[n];
    if (set !== undefined && !set[state[o + off[n]]]) return false;
  }
  return true;
}

function applyAt(pr: Prepared, state: Uint8Array, o: number): void {
  const out = pr.rule.output;
  const off = pr.off;
  for (let n = 0; n < out.length; n++) if (out[n] !== -1) state[o + off[n]] = out[n];
}

/** Every state one match away (a `one` node), rule by rule, in the order of the cells. */
function oneChildren(state: Uint8Array, X: number, Y: number, Z: number, rules: Prepared[], cap: number): Uint8Array[] {
  const out: Uint8Array[] = [];
  const XY = X * Y;
  for (const pr of rules) {
    const { dx, dy, dz } = pr.rule;
    for (let z = 0; z + dz <= Z; z++)
      for (let y = 0; y + dy <= Y; y++)
        for (let x = 0; x + dx <= X; x++) {
          const o = x + y * X + z * XY;
          if (!matchesAt(pr, state, o)) continue;
          const child = new Uint8Array(state);
          applyAt(pr, child, o);
          out.push(child);
          if (out.length >= cap) return out;
        }
  }
  return out;
}

/**
 * Every state an `all` step can give: each set of matches that do not overlap and leave no other match free (MarkovJunior's
 * AllChildStates), found by covering first the cell most matches cover. At most `cap` of them.
 */
function allChildren(state: Uint8Array, X: number, Y: number, Z: number, rules: Prepared[], cap: number, late: () => boolean): Uint8Array[] {
  const XY = X * Y;
  const N = state.length;
  const tiles: Array<{ pr: Prepared; x: number; y: number; z: number; o: number }> = [];
  const amounts = new Int32Array(N);
  for (let o = 0; o < N; o++) {
    const x = o % X, y = ((o / X) | 0) % Y, z = (o / XY) | 0;
    for (const pr of rules) {
      const { dx, dy, dz } = pr.rule;
      if (x + dx > X || y + dy > Y || z + dz > Z || !matchesAt(pr, state, o)) continue;
      tiles.push({ pr, x, y, z, o });
      for (let k = 0; k < dz; k++) for (let j = 0; j < dy; j++) for (let i = 0; i < dx; i++) amounts[o + i + j * X + k * XY]++;
    }
  }
  const visible = new Uint8Array(tiles.length).fill(1);
  const solution: number[] = [];
  const out: Uint8Array[] = [];
  const hide = (l: number, show: boolean) => {
    visible[l] = show ? 1 : 0;
    const t = tiles[l];
    const { dx, dy, dz } = t.pr.rule;
    for (let k = 0; k < dz; k++) for (let j = 0; j < dy; j++) for (let i = 0; i < dx; i++) amounts[t.o + i + j * X + k * XY] += show ? 1 : -1;
  };
  const overlap = (a: (typeof tiles)[number], b: (typeof tiles)[number]) =>
    a.x < b.x + b.pr.rule.dx && b.x < a.x + a.pr.rule.dx && a.y < b.y + b.pr.rule.dy && b.y < a.y + a.pr.rule.dy && a.z < b.z + b.pr.rule.dz && b.z < a.z + a.pr.rule.dz;
  const inside = (t: (typeof tiles)[number], x: number, y: number, z: number) =>
    t.x <= x && x < t.x + t.pr.rule.dx && t.y <= y && y < t.y + t.pr.rule.dy && t.z <= z && z < t.z + t.pr.rule.dz;
  // The enumeration can take long by itself: it looks at the clock now and then, and stops (the search then finds it late).
  let calls = 0;
  let stopped = false;
  const enumerate = () => {
    if (stopped || out.length >= cap) return;
    if ((++calls & 255) === 0 && late()) {
      stopped = true;
      return;
    }
    let best = -1, at = -1;
    for (let i = 0; i < N; i++)
      if (amounts[i] > 0 && amounts[i] > best) {
        best = amounts[i];
        at = i;
      }
    if (at < 0) {
      const child = new Uint8Array(state);
      for (const l of solution) applyAt(tiles[l].pr, child, tiles[l].o);
      out.push(child);
      return;
    }
    const X0 = at % X, Y0 = ((at / X) | 0) % Y, Z0 = (at / XY) | 0;
    const cover: number[] = [];
    for (let l = 0; l < tiles.length; l++) if (visible[l] && inside(tiles[l], X0, Y0, Z0)) cover.push(l);
    for (const l of cover) {
      solution.push(l);
      const hit: number[] = [];
      for (let m = 0; m < tiles.length; m++) if (visible[m] && overlap(tiles[l], tiles[m])) hit.push(m);
      for (const m of hit) hide(m, false);
      enumerate();
      for (const m of hit) hide(m, true);
      solution.pop();
      if (stopped || out.length >= cap) return;
    }
  };
  enumerate();
  return out;
}

/** A 32-bit fingerprint of a state, to find it again among those seen. */
function hashState(s: Uint8Array): number {
  let h = 17;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 29) + s[i]) | 0;
  return h;
}

const same = (a: Uint8Array, b: Uint8Array) => {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

/** A min-heap of (priority, order of arrival, board): equal priorities come out in the order they went in. */
class Frontier {
  private p: number[] = [];
  private s: number[] = [];
  private v: number[] = [];
  private n = 0;
  get size(): number {
    return this.p.length;
  }
  private less(a: number, b: number): boolean {
    return this.p[a] < this.p[b] || (this.p[a] === this.p[b] && this.s[a] < this.s[b]);
  }
  private swap(a: number, b: number): void {
    [this.p[a], this.p[b]] = [this.p[b], this.p[a]];
    [this.s[a], this.s[b]] = [this.s[b], this.s[a]];
    [this.v[a], this.v[b]] = [this.v[b], this.v[a]];
  }
  push(value: number, priority: number): void {
    this.p.push(priority);
    this.s.push(this.n++);
    this.v.push(value);
    for (let i = this.p.length - 1; i > 0; ) {
      const up = (i - 1) >> 1;
      if (!this.less(i, up)) break;
      this.swap(i, up);
      i = up;
    }
  }
  pop(): number {
    const top = this.v[0];
    const last = this.p.length - 1;
    this.swap(0, last);
    this.p.pop();
    this.s.pop();
    this.v.pop();
    for (let i = 0; ; ) {
      const a = 2 * i + 1, b = a + 1;
      let m = i;
      if (a < this.p.length && this.less(a, m)) m = a;
      if (b < this.p.length && this.less(b, m)) m = b;
      if (m === i) break;
      this.swap(i, m);
      i = m;
    }
    return top;
  }
}

export interface SearchCeilings {
  /** States kept (MarkovJunior's `limit` when given, never more than `INFERENCE_LIMITS.boards`). */
  boards: number;
  /** Bytes of the states kept. */
  bytes: number;
  /** Child states of one state. */
  children: number;
  /** The clock time (`now()`) past which the search gives up: the run is then not finished. */
  until: number;
}

export interface SearchOutcome {
  /** The states from the first after the present to the future; empty if the present is already there; null if none was found. */
  trajectory: Uint8Array[] | null;
  /** States kept. */
  boards: number;
  /** True if the clock stopped it: the result does not count. */
  late: boolean;
  /** Why there is no trajectory. */
  why?: string;
}

/**
 * MarkovJunior's Search.Run in three dimensions: a best-first search over the states the rules reach from `present`, ranked by the
 * estimates of the forward and backward potentials and the depth (`depthCoefficient`: below 0, deepest first), until a state whose
 * forward estimate is 0 (every cell in its future). Deterministic from `seed` within the ceilings of states and bytes.
 */
export function search(present: Uint8Array, future: Uint32Array, rules: Prepared[], X: number, Y: number, Z: number, C: number, all: boolean, ceilings: SearchCeilings, depthCoefficient: number, seed: number, now: () => number = Date.now): SearchOutcome {
  const N = present.length;
  const bpot = Array.from({ length: C }, () => new Int32Array(N));
  const fpot = Array.from({ length: C }, () => new Int32Array(N));
  const work = makeWork(C, N, rules.length);
  backwardPotentials(bpot, future, X, Y, Z, rules, work);
  const rootBack = backwardPointwise(bpot, present);
  forwardPotentials(fpot, present, X, Y, Z, rules, work);
  const rootFwd = forwardPointwise(fpot, future);
  if (rootBack < 0 || rootFwd < 0) return { trajectory: null, boards: 0, late: false, why: 'il futuro osservato non si raggiunge con queste regole' };
  if (rootBack === 0) return { trajectory: [], boards: 1, late: false };
  const states: Uint8Array[] = [new Uint8Array(present)];
  const parent: number[] = [-1];
  const depth: number[] = [0];
  const back: number[] = [rootBack];
  const fwd: number[] = [rootFwd];
  const visited = new Map<number, number[]>([[hashState(present), [0]]]);
  const rng = new Rng(seed);
  const rank = (b: number) => (depthCoefficient < 0 ? 1000 - depth[b] : fwd[b] + back[b] + 2 * depthCoefficient * depth[b]) + 0.0001 * rng.next();
  const frontier = new Frontier();
  frontier.push(0, rank(0));
  const most = Math.max(1, Math.min(ceilings.boards, Math.floor(ceilings.bytes / Math.max(1, N))));
  // The children of one state are all in memory at once: they too stay within the bytes.
  const brood = Math.max(1, Math.min(ceilings.children, Math.floor(ceilings.bytes / Math.max(1, N))));
  const late = () => now() > ceilings.until;
  const outOfTime = (): SearchOutcome => ({ trajectory: null, boards: states.length, late: true, why: 'tempo' });
  while (frontier.size > 0 && states.length < most) {
    if (late()) return outOfTime();
    const p = frontier.pop();
    const children = all ? allChildren(states[p], X, Y, Z, rules, brood, late) : oneChildren(states[p], X, Y, Z, rules, brood);
    for (const child of children) {
      if (late()) return outOfTime();
      const h = hashState(child);
      const bucket = visited.get(h);
      const known = bucket?.find((b) => same(states[b], child));
      if (known !== undefined) {
        if (depth[p] + 1 < depth[known]) {
          depth[known] = depth[p] + 1;
          parent[known] = p;
          frontier.push(known, rank(known));
        }
        continue;
      }
      const cb = backwardPointwise(bpot, child);
      forwardPotentials(fpot, child, X, Y, Z, rules, work);
      const cf = forwardPointwise(fpot, future);
      if (cb < 0 || cf < 0) continue;
      const b = states.push(child) - 1;
      parent.push(p);
      depth.push(depth[p] + 1);
      back.push(cb);
      fwd.push(cf);
      if (bucket) bucket.push(b);
      else visited.set(h, [b]);
      if (cf === 0) {
        const path: Uint8Array[] = [];
        for (let k = b; parent[k] >= 0; k = parent[k]) path.push(states[k]);
        return { trajectory: path.reverse(), boards: states.length, late: false };
      }
      frontier.push(b, rank(b));
      // The bytes are a hard ceiling: one state's children do not go past it.
      if (states.length * N > ceilings.bytes) return { trajectory: null, boards: states.length, late: false, why: `tetto di memoria (${states.length} stati)` };
    }
  }
  return { trajectory: null, boards: states.length, late: false, why: frontier.size ? `tetto di ${most} stati` : `nessuna traiettoria fra ${states.length} stati` };
}
