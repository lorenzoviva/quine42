// The network of a place and its enclaves (T474, ADR-0250: the rule 10 of the steps, the row 1 of T459, docs/design/terreno-3d.md § 2).
//
// Two tiles beside each other are joined when a body walks from one to the other: both open (walked or swum) and their levels within a
// step (`STEP`, half a tile), or both swum (the water joins the water, whatever lies under it). From the levels of a place, after its
// lots, the kernel keeps joined to its first gate what the world gives as reachable (the other gates, the doors of its lots, the edge of
// a block's lot and of a landing, the start, its paths and piers): where a rise beyond a step parts one of them from the network, it
// evens a **ramp**, the shortest way through the tiles it may move along which every step is within `STEP` (a path of a mountain, with no
// earth moved where it is not needed). What is walked by four tiles or more and only a cliff parts from the network is an **enclave**:
// kept where the place's roughness concedes it (a share of the place, its pass within a means of the world), joined with a ramp otherwise.
// The ramps are the earth they move, tile by tile, as the digs are (`Network.moved`): the kernel adds it to the levels of the place.
//
// Pure and deterministic: the kernel, the model of places and the thin clients (which receive the earth moved) have the same numbers. With
// the relief of today no two tiles beside each other are more than a step apart (ADR-0048: measured on 328 places, none in 165 395
// pairs), so the network is the flood of before and nothing moves: the rule is inert until a relief keeps its cliffs (T459, R1).

/** Levels a body walks up or down between two tiles beside each other (a level is a quarter of a tile: half a tile). */
export const STEP = 2;
/** Levels the earth's jump clears (`JUMP_UP`, 1.05 tiles): an enclave whose pass is within it is reached by jumping. */
export const JUMP = 4;
/** Levels a body climbs with a means (three tiles, D67 C1): the climb of R3; until then no world has it. */
export const CLIMB = 12;
/** What is walked by fewer tiles than this and parted from the network is scenery, as the layout's tiny pockets. */
export const ENCLAVE_TILES = 4;
/** The ramps a place may have, at most: a place of today has none. */
export const MAX_RAMPS = 64;
/** The tiles of a part a ramp is tried from, at most, when the network joins it (its rim first). */
export const RAMP_SOURCES = 16;
/** The levels a ramp moves a tile, at most either way (and a thin client reads). */
export const MAX_MOVED = 64;

/** How rough a place is (T474): measured from its relief, or said by a region of the master. */
export type Roughness = 'flat' | 'hilly' | 'mountainous' | 'rugged';
export const ROUGHNESS: readonly Roughness[] = ['flat', 'hilly', 'mountainous', 'rugged'];
/** The roughness in the words of the master's tools and of the documents. */
export const ROUGHNESS_NAME: Record<Roughness, string> = { flat: 'piana', hilly: 'collinare', mountainous: 'montuosa', rugged: 'impervia' };
/** The share of a place's walked tiles its enclaves may keep (a proposal of T459 § 2.2, to be measured in the game). */
export const ROUGHNESS_QUOTA: Record<Roughness, number> = { flat: 0, hilly: 0, mountainous: 0.15, rugged: 0.35 };
/**
 * From which share of the edges between open tiles beyond a step a place is mountainous, and rugged (an edge beyond `CLIMB` makes it rugged
 * too): calibrated on the true relief of the prototype of T459 (324 places: 56 % without a cliff, 13 % from 2 to 10 %, 14 % beyond).
 */
export const ROUGH_EDGES = { mountainous: 0.02, rugged: 0.1 } as const;
/** The levels a place's land may span and still be flat. */
export const FLAT_SPAN = 2 * STEP;

/** What a pass asks of a body: a jump, a climb (with a means, R3), or building (steps dug, a ladder, a bridge). */
export type Means = 'jump' | 'climb' | 'build';
export const meansOf = (pass: number): Means => (pass <= JUMP ? 'jump' : pass <= CLIMB ? 'climb' : 'build');

/** The highest pass an enclave of a place so rough keeps (none: -1); `climb` when the world has the climb (R3). */
export function keptPass(r: Roughness, climb = false): number {
  return r === 'rugged' ? Infinity : r === 'mountainous' ? (climb ? CLIMB : JUMP) : -1;
}

/** A roughness read without trusting it (a plan, a region, the wire): one of the four, else none. */
export const readRoughness = (v: unknown): Roughness | undefined => (ROUGHNESS.includes(v as Roughness) ? (v as Roughness) : undefined);

/** The ground of a place as the network reads it: its levels (after its lots) and what a body does on each of its tiles. */
export interface PlaceGround {
  size: number;
  levels: ArrayLike<number>;
  /** Walked: a body stands and walks on it. */
  walked(i: number): boolean;
  /** Swum: the water one swims (only where the plan swims, T438). */
  swum(i: number): boolean;
  /** Its level is not the network's to move: the border (the next place meets it), the lots (flat for their structure), the water. */
  fixed(i: number): boolean;
}

/** What the network keeps apart (T474): the roughness of the place and the means the world has. */
export interface NetworkRules {
  roughness: Roughness;
  climb?: boolean;
}

/** A part of a place that only a cliff parts from its network. */
export interface Enclave {
  /** Its tiles, walked and swum, by index. */
  cells: number[];
  walked: number;
  /** The least difference of levels between it and the network (Infinity: it touches the network only through what blocks). */
  pass: number;
  means: Means;
  /** Kept because the roughness concedes it; false: the network wanted it and no ramp reaches it (stranded). */
  kept: boolean;
}

export interface Network {
  /** The levels with the ramps evened. */
  levels: Int16Array;
  /** 1 on the open tiles joined to the start. */
  reach: Uint8Array;
  /**
   * 1 on the open tiles a flood of the tiles alone (whatever their levels) joins to the start and the steps do not: what only a rise parts
   * from the network (the enclaves, the scenery behind a cliff). None with the relief of today: what stands on the place stands where it stood.
   */
  apart: Uint8Array;
  /** Each ramp as found: from the tile it joins (a target, a tile of an enclave) to the tile of the network it reached. */
  ramps: number[][];
  /** The earth the ramps moved (T474): tile → levels (up or down), what the kernel adds to the place's levels; empty with no ramp. */
  moved: Record<string, number>;
  enclaves: Enclave[];
  /** What must be reached and no ramp reaches (a rule 10 the kernel could not keep: the kernel says it). */
  stranded: number[];
  /** The place's roughness, measured from its levels before the ramps. */
  roughness: Roughness;
}

const DIRS: ReadonlyArray<readonly [number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/**
 * How rough a place is (T474), from its levels and what is open on it: the share of the edges between two open tiles beside each other
 * (not both swum) beyond a step, an edge beyond a climb, the span of its walked land.
 */
export function roughnessOf(g: Pick<PlaceGround, 'size' | 'levels' | 'walked' | 'swum'>): Roughness {
  const S = g.size, lv = g.levels;
  const open = (i: number) => g.walked(i) || g.swum(i);
  let edges = 0, cliffs = 0, wall = false, lo = Infinity, hi = -Infinity;
  for (let i = 0; i < S * S; i++) {
    if (!open(i)) continue;
    if (g.walked(i)) (lo = Math.min(lo, lv[i])), (hi = Math.max(hi, lv[i]));
    const c = i % S;
    for (const n of [c + 1 < S ? i + 1 : -1, i + S < S * S ? i + S : -1]) {
      if (n < 0 || !open(n) || (g.swum(i) && g.swum(n))) continue;
      edges++;
      const d = Math.abs(lv[i] - lv[n]);
      if (d > STEP) cliffs++;
      if (d > CLIMB) wall = true;
    }
  }
  const share = edges ? cliffs / edges : 0;
  if (wall || share >= ROUGH_EDGES.rugged) return 'rugged';
  if (share >= ROUGH_EDGES.mountainous) return 'mountainous';
  return share > 0 || hi - lo > FLAT_SPAN ? 'hilly' : 'flat';
}

/**
 * Evens a ramp's levels in place (T474): from its first tile to its last, both kept, every tile between as near as it was to its level
 * with every step within `STEP` and the last still reachable (the greedy that never needs to look back); where the two ends are farther
 * apart than the ramp is long, as near as a step allows from the first. With `free`, the first tile is not kept: from the last back to
 * it, every tile within a step of the one after it, as near as it was. Tiles out of the place are left alone. The earth moved.
 */
export function evenRamp(levels: Int16Array, path: readonly number[], free = false): number {
  const n = path.length - 1;
  if (n < 1 || path.some((c) => !(c >= 0 && c < levels.length))) return 0;
  let moved = 0;
  const put = (i: number, lo: number, hi: number) => {
    const was = levels[path[i]];
    const v = Math.min(hi, Math.max(lo, was));
    moved += Math.abs(v - was);
    levels[path[i]] = v;
    return v;
  };
  if (free) {
    let next = levels[path[n]];
    for (let i = n - 1; i >= 0; i--) next = put(i, next - STEP, next + STEP);
    return moved;
  }
  const a = levels[path[n]];
  let prev = levels[path[0]];
  for (let i = 1; i < n; i++) {
    let lo = Math.max(prev - STEP, a - STEP * (n - i)), hi = Math.min(prev + STEP, a + STEP * (n - i));
    if (lo > hi) (lo = prev - STEP), (hi = prev + STEP);
    prev = put(i, lo, hi);
  }
  return moved;
}

/**
 * The earth the ramps of a place moved, as the wire says it (T474, `ChunkView.ramps`): tiles of the place (their index as a key) and whole
 * levels within `MAX_MOVED` either way, none zero; anything else is left out, nothing is none. Never throws.
 */
export function readMoved(v: unknown, size: number): Record<string, number> | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const out: Record<string, number> = {};
  let n = 0;
  for (const [k, d] of Object.entries(v as Record<string, unknown>)) {
    const i = Number(k);
    if (!Number.isInteger(i) || i < 0 || i >= size * size || String(i) !== k) continue;
    if (!Number.isInteger(d) || d === 0 || Math.abs(d as number) > MAX_MOVED) continue;
    out[k] = d as number;
    if (++n >= size * size) break;
  }
  return n ? out : undefined;
}

/** Adds the earth the ramps moved to a place's levels (the kernel's, a thin client's, the model of places'); none, nothing changes. */
export function addMoved(levels: Int16Array, moved: Readonly<Record<string, number>> | undefined): void {
  if (!moved) return;
  for (const [k, d] of Object.entries(moved)) {
    const i = Number(k);
    if (i >= 0 && i < levels.length && Number.isFinite(d)) levels[i] += d;
  }
}

/**
 * The network of a place (T474): from `start` (the layout's first gate), what is joined on the steps; a ramp for each of `targets` it
 * does not reach; the enclaves, kept as the rules concede and joined with a ramp otherwise. Only what the tiles alone join to the start is
 * the network's to join: a target or a part the tiles part from it (scenery the layout leaves, a pocket an edit closed) is the layout's, and
 * is neither ramped, nor stranded, nor an enclave. A target or a start that is not open is passed over (a gate on the void). The levels
 * given are not changed: the network's are a copy.
 */
export function placeNetwork(g: PlaceGround, start: number, targets: readonly number[], rules: NetworkRules): Network {
  const S = g.size, N = S * S;
  const base = Int16Array.from({ length: N }, (_, i) => Math.round(Number(g.levels[i]) || 0));
  const lv = Int16Array.from(base);
  const roughness = roughnessOf({ ...g, levels: lv });
  const open = (i: number) => g.walked(i) || g.swum(i);
  const joined = (a: number, b: number) => (g.swum(a) && g.swum(b)) || Math.abs(lv[a] - lv[b]) <= STEP;
  const wanted = [...new Set(targets)].filter((t) => t >= 0 && t < N && open(t));
  const first = start >= 0 && start < N && open(start) ? start : wanted[0];
  const none: Network = { levels: lv, reach: new Uint8Array(N), apart: new Uint8Array(N), ramps: [], moved: {}, enclaves: [], stranded: [], roughness };
  if (first === undefined) return none;
  const near = (i: number, out: number[]) => {
    const c = i % S, r = (i - c) / S;
    let m = 0;
    for (const [dc, dr] of DIRS) {
      const nc = c + dc, nr = r + dr;
      if (nc >= 0 && nr >= 0 && nc < S && nr < S) out[m++] = nr * S + nc;
    }
    return m;
  };
  const nb = [0, 0, 0, 0];
  /** The open tiles joined to `from` on the steps (or, `flat`, whatever their levels), through tiles `allowed` says (all: the network). */
  const flood = (from: readonly number[], allowed?: (i: number) => boolean, flat = false): Uint8Array => {
    const seen = new Uint8Array(N);
    const q: number[] = [];
    for (const f of from) if (open(f) && !seen[f]) (seen[f] = 1), q.push(f);
    while (q.length) {
      const i = q.pop()!;
      for (let m = near(i, nb), k = 0; k < m; k++) {
        const n = nb[k];
        if (seen[n] || !open(n) || (allowed && !allowed(n)) || (!flat && !joined(i, n))) continue;
        seen[n] = 1;
        q.push(n);
      }
    }
    return seen;
  };
  // What the tiles alone join to the start, whatever the levels: what the steps part of it is the network's to join, or an enclave.
  const tiles = flood([first], undefined, true);
  let reach = flood([first]);
  const ramps: number[][] = [];
  const blocked = new Uint8Array(N);
  /**
   * A ramp from `source` to the network: the shortest way through the open tiles not reached nor kept apart (the source's own part too,
   * whose rim it may cut). The tiles it may move are evened; a fixed tile on the way (the water, a lot, the border) is passed as it is, an
   * anchor, as the end on the network is, and so is the source if it is fixed (a gate, a door): every stretch between two anchors must be
   * long enough for the difference of their levels (a step a tile, or both swum). A source the network may move and need not keep (`free`: a
   * tile of a path, alone) is no anchor: the first stretch is evened from its far end back to it, as near as each tile was; a tile of a part
   * is kept, so that the part comes with it. The network is flooded again.
   */
  const findRamp = (source: number, loose: boolean, avoidDryFixed: boolean, allowRegrade = false): boolean => {
    const seen = new Uint8Array(N);
    const prev = new Int32Array(N).fill(-1);
    // The level of the last anchor on the way to each tile (none yet: free), and the steps since it.
    const anchor = new Int16Array(N);
    const free = new Uint8Array(N);
    const since = new Int32Array(N);
    const q = [source];
    seen[source] = 1;
    anchor[source] = lv[source];
    free[source] = loose && !g.fixed(source) ? 1 : 0;
    // Near enough to the last anchor for the steps since it: a step a step, or swum from swum (the water joins the water).
    const within = (x: number, n: number) => free[x] === 1 || (since[x] === 0 && g.swum(x) && g.swum(n)) || Math.abs(lv[n] - anchor[x]) <= STEP * (since[x] + 1);
    for (let h = 0; h < q.length; h++) {
      const x = q[h];
      for (let m = near(x, nb), k = 0; k < m; k++) {
        const n = nb[k];
        if (!open(n) || seen[n] || blocked[n]) continue;
        if (reach[n]) {
          if (within(x, n)) {
            const path = [n];
            for (let c = x; c >= 0; c = prev[c]) path.push(c);
            path.reverse();
            const snap = allowRegrade ? Int16Array.from(lv) : undefined;
            // Its stretches between anchors: the end, every fixed tile on the way, the source if it is fixed.
            let from = 0;
            for (let i = 1; i < path.length; i++) {
              if (i < path.length - 1 && !g.fixed(path[i])) continue;
              evenRamp(lv, path.slice(from, i + 1), from === 0 && free[source] === 1);
              from = i;
            }
            const nextReach = flood([first]);
            if (snap && (!nextReach[source] || wanted.some((w) => reach[w] && !nextReach[w]))) {
              lv.set(snap);
              continue;
            }
            ramps.push(path);
            reach = nextReach;
            return true;
          }
          // Last-resort regrade (T475): when an aligned border gate sits directly against already-reached interior land beyond a step,
          // keep walking through unfixed reached tiles so the ramp can grade them smoothly down to the network.
          if (!allowRegrade || g.fixed(n)) continue;
        }
        if (g.fixed(n)) {
          // Pass 1 avoids stepping across dry fixed tiles (borders, lots) so a ramp accumulates length inside the place instead of resetting `since`.
          if (avoidDryFixed && !g.swum(n)) continue;
          // A fixed tile is passed as it is: only near enough to the last anchor, and it is the next.
          if (!within(x, n)) continue;
          anchor[n] = lv[n];
          free[n] = 0;
          since[n] = 0;
        } else {
          anchor[n] = anchor[x];
          free[n] = free[x];
          since[n] = since[x] + 1;
        }
        seen[n] = 1;
        prev[n] = x;
        q.push(n);
      }
    }
    return false;
  };
  const ramp = (source: number, loose = false): boolean =>
    findRamp(source, loose, true, false) || findRamp(source, loose, false, false) || findRamp(source, loose, true, true);
  /**
   * A part joined to the network (T474): a ramp from one of its tiles, those on its rim first (the nearest to the network inside it), at most
   * `RAMP_SOURCES` tried.
   */
  const join = (part: Uint8Array, cells: readonly number[]): boolean => {
    const dist = new Int32Array(N).fill(-1);
    const q: number[] = [];
    for (const c of cells) {
      for (let m = near(c, nb), k = 0; k < m; k++)
        if (reach[nb[k]] && open(nb[k])) {
          dist[c] = 0;
          q.push(c);
          break;
        }
    }
    for (let h = 0; h < q.length; h++)
      for (let m = near(q[h], nb), k = 0; k < m; k++) {
        const n = nb[k];
        if (part[n] && dist[n] < 0) (dist[n] = dist[q[h]] + 1), q.push(n);
      }
    const order = [...cells].sort((a, b) => (dist[a] < 0 ? N : dist[a]) - (dist[b] < 0 ? N : dist[b]) || a - b);
    for (const s of order.slice(0, RAMP_SOURCES)) if (ramp(s)) return true;
    return false;
  };
  const stranded: number[] = [];
  for (const t of wanted) {
    if (reach[t] || !tiles[t]) continue;
    if (ramps.length >= MAX_RAMPS || !ramp(t, true)) stranded.push(t);
  }
  // The parts still apart, by their first tile: kept as the rules concede (and the quota), joined otherwise.
  const most = keptPass(rules.roughness, rules.climb);
  let walkedAll = 0;
  for (let i = 0; i < N; i++) if (g.walked(i)) walkedAll++;
  let room = Math.floor(ROUGHNESS_QUOTA[rules.roughness] * walkedAll);
  const kept = new Uint8Array(N);
  const partOf = (i: number) => flood([i], (n) => !reach[n] && !kept[n]);
  const passOf = (part: Uint8Array) => {
    let pass = Infinity;
    for (let i = 0; i < N; i++) {
      if (!part[i]) continue;
      for (let m = near(i, nb), k = 0; k < m; k++) {
        const n = nb[k];
        if (reach[n] && open(n) && !(g.swum(i) && g.swum(n))) pass = Math.min(pass, Math.abs(lv[i] - lv[n]));
      }
    }
    return pass;
  };
  const seen = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (seen[i] || reach[i] || kept[i] || !tiles[i] || !g.walked(i)) continue;
    const part = partOf(i);
    const cells: number[] = [];
    let walked = 0;
    for (let j = 0; j < N; j++) if (part[j]) (seen[j] = 1), cells.push(j), (walked += g.walked(j) ? 1 : 0);
    if (walked < ENCLAVE_TILES) continue;
    const pass = passOf(part);
    if (pass <= most && walked <= room) {
      room -= walked;
      for (const c of cells) (kept[c] = 1), (blocked[c] = 1);
      continue;
    }
    if (ramps.length < MAX_RAMPS) join(part, cells);
  }
  // What is left apart and walked by four tiles or more: the enclaves, as the levels now are.
  const enclaves: Enclave[] = [];
  const done = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (done[i] || reach[i] || !tiles[i] || !g.walked(i)) continue;
    const part = flood([i], (n) => !reach[n]);
    const cells: number[] = [];
    let walked = 0;
    for (let j = 0; j < N; j++) if (part[j]) (done[j] = 1), cells.push(j), (walked += g.walked(j) ? 1 : 0);
    if (walked < ENCLAVE_TILES) continue;
    const pass = passOf(part);
    enclaves.push({ cells, walked, pass, means: meansOf(pass), kept: cells.some((c) => kept[c]) });
  }
  const moved: Record<string, number> = {};
  for (let i = 0; i < N; i++) if (lv[i] !== base[i]) moved[i] = Math.max(-MAX_MOVED, Math.min(MAX_MOVED, lv[i] - base[i]));
  const apart = tiles.map((v, i) => (v && !reach[i] ? 1 : 0));
  return { levels: lv, reach, apart, ramps, moved, enclaves, stranded: stranded.filter((t) => !reach[t]), roughness };
}

/**
 * Whether two tiles beside each other of a place are more than a step apart, not both `wet` (T474): where not, no body of the place meets a
 * rise it does not walk, and the collision asks no more (every place of the relief of today).
 */
export function steepOf(levels: ArrayLike<number>, size: number, wet: (i: number) => boolean): boolean {
  const S = size;
  for (let i = 0; i < S * S; i++) {
    const c = i % S;
    if (c + 1 < S && Math.abs(levels[i] - levels[i + 1]) > STEP && !(wet(i) && wet(i + 1))) return true;
    if (i + S < S * S && Math.abs(levels[i] - levels[i + S]) > STEP && !(wet(i) && wet(i + S))) return true;
  }
  return false;
}
