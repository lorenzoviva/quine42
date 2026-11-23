// The relief of the simulation (ADR-0048): how high the ground is on every tile. It comes from
// MarkovJunior's own `Hills` example (models.xml, 40×40×12), the universe's `world/rilievo.xml` if it
// has one: air grows down from the sky into the earth, a convolution smooths it, and the top of the
// earth in each column is a height.
//
// The world has no edges, a MarkovJunior grid does: two runs of the program on boxes of coprime sides
// (64 and 45) are read as tiles that repeat, their seams mended so that neighbours differ by at most one
// level, and the height of a tile is the sum of the two (it repeats only every 2880 tiles). Each run
// keeps neighbours within one level, so the sum keeps them within two: a level is a quarter of a tile,
// a step is at most half a tile and the wanderer climbs it — the relief is never an obstacle
// (AGENTS.md rule 10: what looks impassable is; a hill does not look it).
//
// Deterministic from the universe's seed and the coordinates; the same in Node and in the browser.
//
// A world of the void is flat (T448, ADR-0234: `flatRelief`): its stations are built, its asteroids lie in the void at the height of the
// stations, and a capsule docked at the edge of any land has its deck a step over it.

import { compileMjx } from '../mj/model';
import { runMjx } from '../mj/run';
import { hash32 } from './rng';

export const RELIEF_PATH = 'world/rilievo.xml';

/** MarkovJunior's `Hills` (github.com/mxgmn/MarkovJunior, MIT, © 2022 Maxim Gumin), unchanged. */
export const HILLS = `<sequence values="BA">
  <prl in="B" out="A"/>
  <prl in="A *" out="B *" symmetry="()"/>
  <one in="AB" out="AA" steps="8000"/>
  <convolution neighborhood="NoCorners" periodic="True">
    <rule in="B" out="A" sum="10..18" values="A"/>
    <rule in="A" out="B" sum="10..18" values="B"/>
  </convolution>
</sequence>`;

/** The relief of a world with none (T448): every tile at the level 0, the sea too. */
export function flatRelief(): Relief {
  return new Relief(0, null);
}

/** Height of a level, in tiles. */
export const LEVEL = 0.25;
/** Highest level above the sea the kernel reads from `generate_relief` (T475, ADR-0256: 16 tiles). */
export const RELIEF_PEAK = 64;
/** Deepest level below the sea the kernel reads from `generate_relief` (T475, ADR-0256: 8 tiles). */
export const RELIEF_DEPTH = 32;
/** Default depth of shallow inland water when a generator gives only one line of levels (levels below surface). */
export const SHALLOW_BED_DEPTH = 2;
/** Maximum cached chunks kept by a `TrueRelief` instance (evicts oldest when exceeded). */
const MAX_RELIEF_CHUNKS = 2048;
/** Levels a body walks up or down between two tiles beside each other (mirrors `STEP` in network.ts). */
const RELIEF_STEP = 2;
/** Levels the earth's jump clears (mirrors `JUMP` in network.ts). */
const RELIEF_JUMP = 4;
/** The two repeating boxes: coprime sides, `Hills`' own height. */
const SIDES = [64, 45];
const DEPTH = 12;
/** `Hills` is written for 40×40: its growth steps are scaled with the box. */
const HILLS_AREA = 40 * 40;

/** A heightmap that repeats with period `n` on both axes. */
interface Tile {
  n: number;
  h: Uint8Array;
}

/** The program's steps scaled to a box of side n, so a larger box grows as many hills per tile. */
function scaled(xml: string, n: number): string {
  return xml.replace(/steps="(\d+)"/g, (_, s) => `steps="${Math.round((Number(s) * n * n) / HILLS_AREA)}"`);
}

/** Runs the program on an n×n box and reads the top of the earth (the program's last value) per column. */
function runTile(xml: string, n: number, seed: number): Tile {
  const m = compileMjx(scaled(xml, n), { size: [n, n, DEPTH] });
  const g = runMjx(m, seed, { deadline: 4_000 }).grid;
  const h = new Uint8Array(n * n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      let top = 0;
      for (let z = 0; z < DEPTH; z++) if (g.cells[x + y * n + z * n * n] !== 0) top = z + 1;
      h[x + y * n] = top;
    }
  mend(h, n);
  return { n, h };
}

/** Lowers what stands more than one level above a neighbour (across the wrap too), until none does. */
export function mend(h: Uint8Array, n: number): void {
  for (let changed = true; changed; ) {
    changed = false;
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const i = x + y * n;
        const low = Math.min(h[((x + 1) % n) + y * n], h[((x + n - 1) % n) + y * n], h[x + ((y + 1) % n) * n], h[x + ((y + n - 1) % n) * n]);
        if (h[i] > low + 1) {
          h[i] = low + 1;
          changed = true;
        }
      }
  }
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

export class Relief {
  private tiles: Tile[] = [];
  private base = 0;
  /** Levels above the lowest point of the world (0 = the lowest). */
  readonly max: number;

  /** `xml` null: no hills, the flat relief (`flatRelief`). */
  constructor(seed: number, xml: string | null = HILLS) {
    this.tiles = xml === null ? [] : SIDES.map((n, i) => runTile(xml, n, hash32(seed, 4242, i)));
    if (!this.tiles.length) {
      this.max = 0;
      this.seaLevel = 0;
      return;
    }
    const lo = this.tiles.map((t) => Math.min(...t.h));
    const hi = this.tiles.map((t) => Math.max(...t.h));
    this.base = lo[0] + lo[1];
    this.max = hi[0] + hi[1] - this.base;
  }

  /**
   * The sea's level when the universe does not say it (T51a): the level below which (or at which) lies a
   * `SEA_SHARE` of the world's tiles. The sides are coprime, so every pair of the two boxes' tiles is a tile
   * of the world once in a period: the share is counted exactly from the two boxes alone.
   */
  get sea(): number {
    if (this.seaLevel !== undefined) return this.seaLevel;
    const [a, b] = this.tiles.map((t) => {
      const h = new Array<number>(DEPTH + 1).fill(0);
      for (const v of t.h) h[v]++;
      return h;
    });
    const total = this.tiles[0].h.length * this.tiles[1].h.length;
    const count = new Array<number>(2 * DEPTH + 1).fill(0);
    for (let i = 0; i <= DEPTH; i++) for (let j = 0; j <= DEPTH; j++) count[i + j] += a[i] * b[j];
    let seen = 0, level = 0;
    for (let s = 0; s < count.length; s++) {
      seen += count[s];
      if (count[s]) level = s;
      if (seen >= SEA_SHARE * total) break;
    }
    return (this.seaLevel = level - this.base);
  }
  private seaLevel?: number;

  /** The level of a tile (an integer, 0 the lowest). */
  level(col: number, row: number): number {
    let s = -this.base;
    for (const t of this.tiles) s += t.h[mod(col, t.n) + mod(row, t.n) * t.n];
    return s;
  }

  /** The level of the bed under water at (col, row), or the ground level on land (T475). With `Hills`, the level itself. */
  bed(col: number, row: number): number {
    return this.level(col, row);
  }

  /** Whether this relief keeps true cliffs and terraces at this world column (T475, ADR-0256). False for `Hills` and flat worlds. */
  hasCliffs(_col = 0): boolean {
    return false;
  }

  /** Base relief levels of a chunk for wire transport in a true-relief world (T475); undefined for `Hills` and flat worlds. */
  chunkLevelsAt(_cx: number, _cy: number, _size: number): Int16Array | undefined {
    return undefined;
  }

  /** The height of a tile's ground, in tiles. */
  height(col: number, row: number): number {
    return this.level(col, row) * LEVEL;
  }
}

/** A chunk's base levels (ground on land, surface or negative sea bed on water) and bed levels under water (T475). */
export interface ChunkReliefData {
  levels: Int16Array;
  bed: Int16Array;
}

/** Provides raw chunk relief data for (cx, cy) from the world's generator (or thin client's chunks); undefined triggers fallback. */
export type ChunkReliefSource = (cx: number, cy: number) => ChunkReliefData | undefined;

/** Parses one line of `n` comma/space-separated integers, clamped to [lo, hi]; returns undefined on any invalid token or wrong count. */
function parseLevelLine(line: string, n: number, lo: number, hi: number): Int16Array | undefined {
  const parts = line.trim().split(/[\s,]+/);
  if (parts.length !== n) return undefined;
  const out = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const raw = parts[i];
    if (!raw) return undefined;
    const v = Number(raw);
    if (!Number.isFinite(v)) return undefined;
    out[i] = Math.max(lo, Math.min(hi, Math.round(v)));
  }
  return out;
}

/**
 * Reads `generate_relief(cx, cy, seed, size)` without trusting Lua (T475, ADR-0256): one line of `size * size` whole levels (clamped to
 * `[-RELIEF_DEPTH, RELIEF_PEAK]`), plus an optional second line of bed levels (clamped to `[-RELIEF_DEPTH, level]`). Anything malformed
 * returns undefined so the kernel raises a fault and falls back cleanly (rule 7).
 */
export function parseRelief(raw: unknown, size: number): ChunkReliefData | undefined {
  if (typeof raw !== 'string' || !Number.isInteger(size) || size <= 0) return undefined;
  const n = size * size;
  const lines = raw
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length || lines.length > 2) return undefined;
  const levels = parseLevelLine(lines[0], n, -RELIEF_DEPTH, RELIEF_PEAK);
  if (!levels) return undefined;
  if (lines.length === 2) {
    const bed = parseLevelLine(lines[1], n, -RELIEF_DEPTH, RELIEF_PEAK);
    if (!bed) return undefined;
    for (let i = 0; i < n; i++) if (bed[i] > levels[i]) bed[i] = levels[i];
    return { levels, bed };
  }
  const bed = Int16Array.from(levels);
  return { levels, bed };
}

/**
 * Base relief levels read from the wire without trusting them (T475, `ChunkView.relief`): exact length `size * size`, whole numbers within
 * `[-RELIEF_DEPTH, RELIEF_PEAK]`. Anything else is rejected (undefined).
 */
export function readRelief(v: unknown, size: number): Int16Array | undefined {
  if (!Array.isArray(v) || v.length !== size * size) return undefined;
  const out = new Int16Array(size * size);
  for (let i = 0; i < out.length; i++) {
    const n = v[i];
    if (typeof n !== 'number' || !Number.isInteger(n) || n < -RELIEF_DEPTH || n > RELIEF_PEAK) return undefined;
    out[i] = n;
  }
  return out;
}

/**
 * The aligned level of a gate tile on a chunk border (T475, ADR-0250 § 2.4): a pure function of the two raw levels across the shared edge,
 * so both chunks agree independently and walking through a gate never meets a cliff. When the two sides are already within `STEP` they stay
 * unchanged; where sea meets a coastal cliff the land side steps down to `sea + STEP`; where two land sides differ by more than `STEP` both
 * meet at `Math.floor((a + b) / 2)`.
 */
export function gateEdgeLevel(rawHere: number, rawAcross: number, sea: number): number {
  const a = Math.max(sea, rawHere);
  const b = Math.max(sea, rawAcross);
  if (Math.abs(a - b) <= RELIEF_STEP) return rawHere;
  if (rawHere < sea) return rawHere;
  if (rawAcross < sea) return sea + RELIEF_STEP;
  return Math.floor((a + b) / 2);
}

/**
 * Eliminates tiny isolated interior pits (< 4 land tiles, not touching the chunk border) whose entire surrounding rim stands more than a jump
 * (`RELIEF_JUMP` = 4 levels) higher (ADR-0250 § Consequences): raises them to `minRim - STEP` so nobody can jump down into a trap they
 * cannot jump back out of. Never alters the border ring.
 */
export function mendPits(levels: Int16Array, size: number, sea = 0): void {
  const S = size, N = S * S;
  const dirs = [-1, 1, -S, S];
  for (let pass = 0; pass < 3; pass++) {
    let changed = false;
    const checked = new Uint8Array(N);
    for (let r = 1; r < S - 1; r++) {
      for (let c = 1; c < S - 1; c++) {
        const start = r * S + c;
        if (checked[start] || levels[start] < sea) continue;
        // Quick skip: only tiles with at least one neighbour higher than a jump can be in a deep pit.
        const lv0 = levels[start];
        if (levels[start - 1] <= lv0 + RELIEF_JUMP && levels[start + 1] <= lv0 + RELIEF_JUMP && levels[start - S] <= lv0 + RELIEF_JUMP && levels[start + S] <= lv0 + RELIEF_JUMP) continue;
        const comp: number[] = [start];
        const inComp = new Set<number>([start]);
        let escape = false;
        let maxIn = lv0;
        for (let q = 0; q < comp.length; q++) {
          const i = comp[q];
          const ic = i % S, ir = (i - ic) / S;
          if (ic === 0 || ir === 0 || ic === S - 1 || ir === S - 1) {
            escape = true;
            break;
          }
          for (const d of dirs) {
            const n = i + d;
            if (inComp.has(n)) continue;
            const nl = levels[n];
            if (nl < sea) {
              escape = true;
              break;
            }
            if (nl <= levels[i] + RELIEF_JUMP) {
              inComp.add(n);
              comp.push(n);
              if (nl > maxIn) maxIn = nl;
              if (comp.length >= 4) {
                escape = true;
                break;
              }
            }
          }
          if (escape) break;
        }
        for (const i of comp) checked[i] = 1;
        if (escape) continue;
        let minRim = Infinity;
        for (const i of comp) {
          for (const d of dirs) {
            const n = i + d;
            if (!inComp.has(n) && levels[n] < minRim) minRim = levels[n];
          }
        }
        if (minRim > maxIn + RELIEF_JUMP && Number.isFinite(minRim)) {
          const target = Math.max(sea, minRim - RELIEF_STEP);
          for (const i of comp) {
            if (levels[i] < target) {
              levels[i] = target;
              changed = true;
            }
          }
        }
      }
    }
    if (!changed) break;
  }
}

/**
 * Whether a building or stamp footprint sits cleanly on a single terrace (T475, ADR-0256): no two 4-adjacent cells inside the footprint
 * differ by more than a step (`RELIEF_STEP`), and its total elevation span stays small enough that flattening the lot to its median does
 * not carve cliffs along its walls.
 */
export function onTerrace(
  levels: ArrayLike<number>,
  w: number,
  x0: number,
  y0: number,
  pw: number,
  ph: number,
  mask?: (x: number, y: number) => boolean,
): boolean {
  let lo = Infinity, hi = -Infinity;
  for (let y = 0; y < ph; y++) {
    for (let x = 0; x < pw; x++) {
      if (mask && !mask(x, y)) continue;
      const idx = (y0 + y) * w + x0 + x;
      const lv = levels[idx];
      if (lv < lo) lo = lv;
      if (lv > hi) hi = lv;
      if (x + 1 < pw && (!mask || mask(x + 1, y)) && Math.abs(lv - levels[idx + 1]) > RELIEF_STEP) return false;
      if (y + 1 < ph && (!mask || mask(x, y + 1)) && Math.abs(lv - levels[idx + w]) > RELIEF_STEP) return false;
    }
  }
  if (lo > hi) return true;
  const maxSpan = Math.max(2 * RELIEF_STEP, Math.min(8, Math.floor(Math.max(pw, ph) / 2) + 2));
  return hi - lo <= maxSpan;
}

/**
 * True relief provided chunk by chunk by the universe's generator `generate_relief` (T475, ADR-0256), with the kernel's guarantees:
 * bounded height/depth (`RELIEF_PEAK`, `RELIEF_DEPTH`), no tiny impassable pits (`mendPits`), and gate levels aligned across chunk edges
 * (`gateEdgeLevel`). Falls back lazily to `makeFallback` (`Hills` or flat) if the generator lacks `generate_relief` or fails (rule 7).
 */
export class TrueRelief extends Relief {
  private rawCache = new Map<string, ChunkReliefData>();
  private alignedCache = new Map<string, ChunkReliefData>();
  private fallback?: Relief;

  constructor(
    private seed: number,
    private size: number,
    private source: ChunkReliefSource,
    private makeFallback: () => Relief,
    private alignGates = true,
    private cacheMissing = true,
  ) {
    super(0, null);
    (this as { max: number }).max = RELIEF_PEAK;
  }

  override get sea(): number {
    return 0;
  }

  override hasCliffs(): boolean {
    return true;
  }

  private put<V>(cache: Map<string, V>, key: string, value: V): V {
    if (cache.size >= MAX_RELIEF_CHUNKS) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    cache.set(key, value);
    return value;
  }

  private fallbackChunk(cx: number, cy: number): ChunkReliefData {
    const S = this.size;
    const fb = (this.fallback ??= this.makeFallback());
    const sea = fb.sea;
    const levels = new Int16Array(S * S);
    const bed = new Int16Array(S * S);
    for (let r = 0; r < S; r++)
      for (let c = 0; c < S; c++) {
        const v = Math.max(-RELIEF_DEPTH, Math.min(RELIEF_PEAK, fb.level(cx * S + c, cy * S + r) - sea));
        levels[r * S + c] = v;
        bed[r * S + c] = v;
      }
    return { levels, bed };
  }

  private rawChunk(cx: number, cy: number): ChunkReliefData {
    const key = `${cx},${cy}`;
    if (!this.cacheMissing) {
      return this.source(cx, cy) ?? this.fallbackChunk(cx, cy);
    }
    const cached = this.rawCache.get(key);
    if (cached) return cached;
    const data = this.source(cx, cy) ?? this.fallbackChunk(cx, cy);
    return this.put(this.rawCache, key, data);
  }

  /** Pit-mended and gate-aligned relief data for chunk (cx, cy). */
  chunkData(cx: number, cy: number): ChunkReliefData {
    if (!this.cacheMissing) {
      return this.source(cx, cy) ?? this.fallbackChunk(cx, cy);
    }
    const key = `${cx},${cy}`;
    const cached = this.alignedCache.get(key);
    if (cached) return cached;
    const raw = this.rawChunk(cx, cy);
    const levels = Int16Array.from(raw.levels);
    const bed = Int16Array.from(raw.bed);
    const S = this.size;
    mendPits(levels, S, 0);
    for (let i = 0; i < S * S; i++) if (bed[i] > levels[i]) bed[i] = levels[i];
    if (this.alignGates && S >= 5) {
      const along = (a: number, b: number, c: number) => 2 + (hash32(this.seed, a, b, c) % (S - 4));
      const west = along(cx, cy, 1);
      const east = along(cx + 1, cy, 1);
      const north = along(cx, cy, 2);
      const south = along(cx, cy + 1, 2);
      const pairs: Array<[number, number, number, number]> = [
        [west * S, cx - 1, cy, west * S + (S - 1)],
        [east * S + (S - 1), cx + 1, cy, east * S],
        [north, cx, cy - 1, (S - 1) * S + north],
        [(S - 1) * S + south, cx, cy + 1, south],
      ];
      for (const [idx, ncx, ncy, nidx] of pairs) {
        const here = raw.levels[idx];
        const across = this.rawChunk(ncx, ncy).levels[nidx];
        const aligned = gateEdgeLevel(here, across, 0);
        if (aligned !== here && here >= 0) {
          levels[idx] = aligned;
          if (bed[idx] > aligned) bed[idx] = aligned;
        }
      }
    }
    return this.put(this.alignedCache, key, { levels, bed });
  }

  override level(col: number, row: number): number {
    const S = this.size;
    const cx = Math.floor(col / S), cy = Math.floor(row / S);
    return this.chunkData(cx, cy).levels[(row - cy * S) * S + (col - cx * S)];
  }

  override bed(col: number, row: number): number {
    const S = this.size;
    const cx = Math.floor(col / S), cy = Math.floor(row / S);
    return this.chunkData(cx, cy).bed[(row - cy * S) * S + (col - cx * S)];
  }

  override chunkLevelsAt(cx: number, cy: number, size: number): Int16Array | undefined {
    return size === this.size ? this.chunkData(cx, cy).levels : undefined;
  }
}

/**
 * Water lies flat: each body of water of a chunk (its liquid tiles, joined by their sides) is as high as
 * the lowest of them; -1 for what is not water. Only the chunk's own tiles count, so it is the same
 * whatever is loaded around it; where a river crosses into the next chunk it may fall a step.
 */
export function waterLevels(tiles: string, size: number, liquid: (code: string) => boolean, level: (c: number, r: number) => number): Int16Array {
  const out = new Int16Array(size * size).fill(-1);
  const seen = new Uint8Array(size * size);
  for (let start = 0; start < size * size; start++) {
    if (seen[start] || !liquid(tiles[start])) continue;
    const body = [start];
    seen[start] = 1;
    let low = Infinity;
    for (let i = 0; i < body.length; i++) {
      const t = body[i];
      const c = t % size, r = (t - c) / size;
      low = Math.min(low, level(c, r));
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = c + dc, nr = r + dr;
        const n = nc + nr * size;
        if (nc < 0 || nr < 0 || nc >= size || nr >= size || seen[n] || !liquid(tiles[n])) continue;
        seen[n] = 1;
        body.push(n);
      }
    }
    for (const t of body) out[t] = low;
  }
  return out;
}

/** Where the sea lies by default: this share of the world's tiles is below it (or as low). */
export const SEA_SHARE = 0.1;

/** A place of the loaded world, for `worldLevels`: its tiles, and the draft that says where the sea is. */
export interface WaterChunk {
  cx: number;
  cy: number;
  tiles: string;
  draft?: string;
}

/** A draft's code for the open sea (the terrain's biomes, ADR-0023). */
export const SEA_DRAFT = 'o';

/**
 * The level of every tile of the loaded world, before its lots (ADR-0048, T51a): the relief, never below
 * the sea; the sea (water where the draft says `o`, and all the water it touches) lies at the sea's level; every
 * other body of water lies flat, as a whole across the places, at the lowest of its tiles and never above
 * the land around it; the land goes down towards the water at most two levels a tile (its banks), so it
 * is climbed as ever. With `keepCliffs` (T475, ADR-0256, true relief) the water stays flat and never above the land,
 * while land tiles are never lowered towards lower neighbours so cliffs, terraces and coastal headlands remain sharp.
 * Only the given places count: the result is the same in whatever order they come,
 * and where a body of water goes on beyond them, it is followed as far as they go.
 *
 * It is the greatest field below the relief that keeps those bounds: a tile's level is the least, over all
 * tiles, of their start plus the way between them (two levels for each tile of land entered, none for water),
 * found with a queue in buckets of levels.
 *
 * `pinned` (T51b) gives the surface of the water that has flowed (`water.ts`): those tiles of water keep it, never
 * lowered by what is around them, and the water they touch that has not flowed goes down to them as to any lower water.
 */
export function worldLevels(chunks: WaterChunk[], size: number, liquid: (code: string) => boolean, level: (col: number, row: number) => number, sea: number, pinned?: (chunk: number, cell: number) => number | undefined, keepCliffs = false): Int16Array[] {
  const S = size, A = S * S;
  const index = new Map<string, number>();
  chunks.forEach((c, i) => index.set(`${c.cx},${c.cy}`, i));
  const n = chunks.length * A;
  const out = chunks.map(() => new Int16Array(A));
  const wet = new Uint8Array(n);
  const wasWet = new Uint8Array(n);
  const val = new Int32Array(n);
  const pin = new Uint8Array(n);
  let hi = sea;
  for (let k = 0; k < chunks.length; k++) {
    const ch = chunks[k];
    for (let i = 0; i < A; i++) {
      const t = k * A + i;
      const c = i % S, r = (i - c) / S;
      wet[t] = liquid(ch.tiles[i]) ? 1 : 0;
      wasWet[t] = ch.draft ? (liquid(ch.draft[i]) ? 1 : 0) : 0;
      const p = wet[t] ? pinned?.(k, i) : undefined;
      if (p !== undefined && Number.isFinite(p)) pin[t] = 1;
      val[t] = pin[t] ? Math.max(sea, Math.round(p!)) : wet[t] && ch.draft?.[i] === SEA_DRAFT ? sea : Math.max(sea, level(ch.cx * S + c, ch.cy * S + r));
      hi = Math.max(hi, val[t]);
    }
  }
  // The neighbours of a tile across the places' borders (-1 where nothing is loaded).
  const near = (t: number, out4: number[]) => {
    const k = Math.floor(t / A), i = t - k * A;
    const c = i % S, r = (i - c) / S;
    const ch = chunks[k];
    let m = 0;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      let nc = c + dc, nr = r + dr, kk = k;
      if (nc < 0 || nr < 0 || nc >= S || nr >= S) {
        const o = index.get(`${ch.cx + Math.floor(nc / S)},${ch.cy + Math.floor(nr / S)}`);
        if (o === undefined) continue;
        kk = o;
        nc = (nc + S) % S;
        nr = (nr + S) % S;
      }
      out4[m++] = kk * A + nr * S + nc;
    }
    return m;
  };
  const buckets: number[][] = Array.from({ length: hi - sea + 1 }, () => []);
  for (let t = 0; t < n; t++) buckets[val[t] - sea].push(t);
  const done = new Uint8Array(n);
  const nb = [0, 0, 0, 0];
  for (let b = 0; b < buckets.length; b++) {
    const q = buckets[b];
    // Water entered from here joins this bucket, so it is read as it grows.
    for (let j = 0; j < q.length; j++) {
      const t = q[j];
      if (done[t] || val[t] !== b + sea) continue;
      done[t] = 1;
      for (let m = near(t, nb), x = 0; x < m; x++) {
        const u = nb[x];
        // With `keepCliffs`, natural land cliffs stay intact; tiles built over draft water (piers, stilt huts) still sit within a step of the water.
        if (keepCliffs && !wet[u] && !wasWet[u]) continue;
        const v = val[t] + (wet[u] ? 0 : 2);
        if (done[u] || pin[u] || v >= val[u]) continue;
        val[u] = v;
        buckets[v - sea].push(u);
      }
    }
  }
  for (let t = 0; t < n; t++) out[Math.floor(t / A)][t % A] = val[t];
  return out;
}

/** A lot of a chunk, in its cells (inclusive): a structure stands on it (ADR-0043). */
export interface LotBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /**
   * The level it lies flat at, when it is not this chunk's to decide (T370, ADR-0206): the lot of a block, which goes past the chunk and
   * lies at one level for all its places (`blockLevel`). It is laid first, over the chunk's border too.
   */
  level?: number;
}

/**
 * The level of every tile of a chunk (ADR-0048, flat lots): water lies flat (`waterLevels`); every lot
 * is flat at the median level of its tiles, or as near as the border and the lots already laid allow (the
 * larger lots first, a tile keeps the first lot that takes it), and so is a ring of one tile around it where the land allows; the rest of the chunk bends towards
 * them, so that neighbours on land still differ by at most two levels, while the chunk's border keeps the
 * relief and meets the next chunk as before. With `keepCliffs` (T475, ADR-0256, true relief) each lot lies flat within its own terrace
 * without bending to the border, only same-terrace ring tiles join it, and surrounding cliffs stay intact. Only the chunk's own tiles count, as for water.
 */
export function chunkLevels(tiles: string, size: number, liquid: (code: string) => boolean, level: (c: number, r: number) => number, lots: LotBox[], keepCliffs = false): Int16Array {
  const S = size;
  const out = waterLevels(tiles, S, liquid, level);
  const wet = (i: number) => liquid(tiles[i]);
  // 0 free, 1 fixed by the relief (the border), 2 fixed by a lot, 3 free but starting at a lot's level (its ring, where it cannot be flat).
  const fixed = new Uint8Array(S * S);
  for (let i = 0; i < S * S; i++) {
    if (wet(i)) continue;
    const c = i % S, r = (i - c) / S;
    out[i] = level(c, r);
    if (c === 0 || r === 0 || c === S - 1 || r === S - 1) fixed[i] = 1;
  }
  const order = lots.map((l, i) => ({ l, i, area: (l.x1 - l.x0 + 1) * (l.y1 - l.y0 + 1) })).sort((a, b) => Number(b.l.level !== undefined) - Number(a.l.level !== undefined) || b.area - a.area || a.i - b.i);
  if (keepCliffs) {
    const flats = new Map<LotBox, number>();
    const adjacentWater = (c: number, r: number): number => {
      let hiW = -Infinity;
      if (c > 0 && wet(r * S + c - 1)) hiW = Math.max(hiW, out[r * S + c - 1]);
      if (c + 1 < S && wet(r * S + c + 1)) hiW = Math.max(hiW, out[r * S + c + 1]);
      if (r > 0 && wet((r - 1) * S + c)) hiW = Math.max(hiW, out[(r - 1) * S + c]);
      if (r + 1 < S && wet((r + 1) * S + c)) hiW = Math.max(hiW, out[(r + 1) * S + c]);
      return hiW;
    };
    for (const { l } of order) {
      const own: number[] = [];
      let hiWater = -Infinity;
      for (let r = Math.max(0, l.y0); r <= Math.min(S - 1, l.y1); r++)
        for (let c = Math.max(0, l.x0); c <= Math.min(S - 1, l.x1); c++) {
          if (wet(r * S + c)) continue;
          own.push(level(c, r));
          hiWater = Math.max(hiWater, adjacentWater(c, r));
        }
      if (!own.length) continue;
      own.sort((a, b) => a - b);
      const flat = l.level !== undefined && Number.isFinite(l.level) ? l.level : Math.max(hiWater, own[own.length >> 1]);
      flats.set(l, flat);
      for (let r = Math.max(0, l.y0); r <= Math.min(S - 1, l.y1); r++)
        for (let c = Math.max(0, l.x0); c <= Math.min(S - 1, l.x1); c++) {
          const i = r * S + c;
          if (wet(i) || fixed[i] === 2) continue;
          out[i] = flat;
          fixed[i] = 2;
        }
    }
    // Flatten only ring tiles that already lie on the same terrace (within STEP of the lot) and not below adjacent water.
    for (const [l, flat] of flats)
      for (let r = Math.max(1, l.y0 - 1); r <= Math.min(S - 2, l.y1 + 1); r++)
        for (let c = Math.max(1, l.x0 - 1); c <= Math.min(S - 2, l.x1 + 1); c++) {
          const i = r * S + c;
          if (wet(i) || fixed[i] >= 2) continue;
          if (Math.abs(out[i] - flat) <= RELIEF_STEP && flat >= adjacentWater(c, r)) {
            out[i] = flat;
            fixed[i] = 2;
          }
        }
    return out;
  }
  // Within two levels a tile of what is already fixed, so that the land between can still be climbed.
  const reach = (x0: number, y0: number, x1: number, y1: number) => {
    let lo = -Infinity, hi = Infinity;
    for (let i = 0; i < S * S; i++) {
      if (fixed[i] !== 1 && fixed[i] !== 2) continue;
      const c = i % S, r = (i - c) / S;
      const d = Math.max(0, x0 - c, c - x1) + Math.max(0, y0 - r, r - y1);
      if (d === 0) continue;
      lo = Math.max(lo, out[i] - 2 * d);
      hi = Math.min(hi, out[i] + 2 * d);
    }
    return [lo, hi];
  };
  // The lots first, then their rings (inside the border, which stays the relief), which yield where they must.
  const flats = new Map<LotBox, number>();
  for (const { l } of order) {
    const own: number[] = [];
    for (let r = Math.max(0, l.y0); r <= Math.min(S - 1, l.y1); r++) for (let c = Math.max(0, l.x0); c <= Math.min(S - 1, l.x1); c++) if (!wet(r * S + c)) own.push(level(c, r));
    if (!own.length) continue;
    own.sort((a, b) => a - b);
    const [lo, hi] = reach(l.x0, l.y0, l.x1, l.y1);
    const flat = l.level !== undefined && Number.isFinite(l.level) ? l.level : Math.min(hi, Math.max(lo, own[own.length >> 1]));
    flats.set(l, flat);
    for (let r = Math.max(0, l.y0); r <= Math.min(S - 1, l.y1); r++)
      for (let c = Math.max(0, l.x0); c <= Math.min(S - 1, l.x1); c++) {
        const i = r * S + c;
        if (wet(i) || fixed[i] === 2) continue;
        out[i] = flat;
        fixed[i] = 2;
      }
  }
  for (const [l, flat] of flats)
    for (let r = Math.max(1, l.y0 - 1); r <= Math.min(S - 2, l.y1 + 1); r++)
      for (let c = Math.max(1, l.x0 - 1); c <= Math.min(S - 2, l.x1 + 1); c++) {
        const i = r * S + c;
        if (wet(i) || fixed[i] >= 2) continue;
        out[i] = flat;
        const [lo, hi] = reach(c, r, c, r);
        fixed[i] = flat >= lo && flat <= hi ? 2 : 3;
      }
  if (!order.length) return out;
  // The free land between: each tile within two levels of its neighbours on land, until it settles.
  for (let pass = 0, changed = true; changed && pass < 4 * S; pass++) {
    changed = false;
    for (let i = 0; i < S * S; i++) {
      if ((fixed[i] && fixed[i] !== 3) || wet(i)) continue;
      const c = i % S, r = (i - c) / S;
      let lo = -Infinity, hi = Infinity;
      for (const n of [c > 0 ? i - 1 : -1, c < S - 1 ? i + 1 : -1, r > 0 ? i - S : -1, r < S - 1 ? i + S : -1]) {
        if (n < 0) continue;
        // Never below the water beside it.
        if (wet(n)) {
          lo = Math.max(lo, out[n]);
          continue;
        }
        lo = Math.max(lo, out[n] - 2);
        hi = Math.min(hi, out[n] + 2);
      }
      const v = lo <= hi ? Math.min(hi, Math.max(lo, out[i])) : Math.round((lo + hi) / 2);
      if (v !== out[i]) {
        out[i] = v;
        changed = true;
      }
    }
  }
  return out;
}

/** A planet's relief in a world with planets (T449): made the first time a tile of its band is asked for. */
export interface BandRelief {
  /** The first tile of the planet's own coordinates (its centre), carpet space. */
  x0: number;
  /** Whether this planet uses true relief (T475). */
  trueRelief?: boolean;
  /** The planet's relief and how much it is lifted so that its sea lies at the world's level. */
  make: () => { relief: Relief; shift: number };
}

/**
 * The relief of a world with planets (T449, ADR-0236): the orbit's (flat: the void) and, on each planet's band, the planet's own (its seed,
 * read in its own coordinates), lifted so that its sea lies at the world's: one sea level for every band, and each planet its hills and its sea.
 */
export class BandedRelief extends Relief {
  private made: Array<{ relief: Relief; shift: number } | undefined>;

  constructor(
    private home: Relief,
    private bandOf: (col: number) => number,
    private planets: readonly BandRelief[],
  ) {
    super(0, null);
    this.made = planets.map(() => undefined);
    (this as { max: number }).max = Math.max(home.max, planets.some((p) => p.trueRelief) ? RELIEF_PEAK : home.max);
  }

  private planet(k: number): { relief: Relief; shift: number } | undefined {
    if (k < 1 || k > this.planets.length) return undefined;
    return (this.made[k - 1] ??= this.planets[k - 1].make());
  }

  override get sea(): number {
    return this.home.sea;
  }

  override hasCliffs(col = 0): boolean {
    const k = this.bandOf(col);
    if (!k) return this.home.hasCliffs(col);
    return !!this.planets[k - 1]?.trueRelief;
  }

  override level(col: number, row: number): number {
    const k = this.bandOf(col);
    const p = k ? this.planet(k) : undefined;
    return p ? p.relief.level(col - this.planets[k - 1].x0, row) + p.shift : this.home.level(col, row);
  }

  override bed(col: number, row: number): number {
    const k = this.bandOf(col);
    const p = k ? this.planet(k) : undefined;
    return p ? p.relief.bed(col - this.planets[k - 1].x0, row) + p.shift : this.home.bed(col, row);
  }

  override chunkLevelsAt(cx: number, cy: number, size: number): Int16Array | undefined {
    const k = this.bandOf(cx * size);
    if (!k) return this.home.chunkLevelsAt(cx, cy, size);
    const p = this.planet(k);
    if (!p || !this.planets[k - 1]?.trueRelief) return undefined;
    const localCx = cx - Math.round(this.planets[k - 1].x0 / size);
    const raw = p.relief.chunkLevelsAt(localCx, cy, size);
    if (!raw) return undefined;
    if (!p.shift) return raw;
    const shifted = new Int16Array(raw.length);
    for (let i = 0; i < raw.length; i++) shifted[i] = Math.max(-RELIEF_DEPTH, Math.min(RELIEF_PEAK, raw[i] + p.shift));
    return shifted;
  }
}
