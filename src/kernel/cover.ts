// The cover of the terrains (T545, C1 of docs/design/terreno-ricco.md, ADR-0269): what grows or lies on the ground of a terrain, tufts of
// grass on the meadow, wheat on the ripe field, small stones on the sand, a low shrub here and there. Small models of the class `cover`, one
// program a kind and many seeds, scattered by a hash on the tiles of every terrain that says them (`coverOnTile`): every client sees the
// same, nothing goes on the wire, nothing is in the state or in the plans. Only how a terrain looks.
//
// `TerrainDef.cover` says it (at most `COVER_LIMITS.kinds` kinds, each `density` instances a tile, 0-4), read without trusting (`readCover`).
// The world stays open to more (D1 of T509): the Council changes a terrain's cover with the world on (`Kernel.setCover`, one commit, within
// these limits), and a single instance becomes a thing of the world where one is needed (`Kernel.uncover`: the stone the key lies under),
// written in its place's plan (`ChunkPlan.uncovered`, `readUncovered`) and never drawn as cover again.
// Pure and lean: the worker of the ground imports it.

import { hash32, hashStr } from './rng';

/** A kind of cover of a terrain: a program of `models/` (class `cover`) and how many of it stand on a tile, on average. */
export interface CoverKind {
  model: string;
  density: number;
}

/** At most three kinds a terrain, 0-4 instances a tile each (D2 of T509), in steps of 0.05. */
export const COVER_LIMITS = { kinds: 3, density: [0, 4] as const, step: 0.05 } as const;

/** The instances of cover drawn on the loaded window at most (D2 of T509): two a tile on average over the covered ground of 35 places. */
export const COVER_CAP = 20_000;

/** The instances of a place that may be things of the world (`ChunkPlan.uncovered`) at most: a few hiding places, not a second cover. */
export const MAX_UNCOVERED = 24;

/** The instances a tile has at most: three kinds at four, and the one a fraction adds to each. */
export const MAX_ON_TILE = COVER_LIMITS.kinds * (COVER_LIMITS.density[1] + 1);

/** How far from a tile's edges an instance stands (tiles): its middle never on the edge, where the next tile's are. */
const MARGIN = 0.12;

/** A program of `models/` as a cover names it. */
const MODEL_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;

/** A module as an uncovered instance names the thing it became. */
const MODULE_ID = /^[a-z0-9][a-z0-9_.:-]{0,79}$/i;

const round = (d: number) => Number((Math.round(d / COVER_LIMITS.step) * COVER_LIMITS.step).toFixed(2));

/**
 * A cover as it is said, without trusting it: a list of `{ model, density }` with a program's id and a finite density, clamped to the range
 * and to its step; the first of a model kept, the kinds past the third and those at 0 dropped. `null` where it says none (an empty list, or
 * every kind at 0), undefined where what is there is not a cover (the terrain then has none either).
 */
export function readCover(raw: unknown): CoverKind[] | null | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: CoverKind[] = [];
  for (const k of raw) {
    if (out.length >= COVER_LIMITS.kinds) break;
    if (!k || typeof k !== 'object' || Array.isArray(k)) continue;
    const { model, density } = k as { model?: unknown; density?: unknown };
    if (typeof model !== 'string' || !MODEL_ID.test(model) || typeof density !== 'number' || !Number.isFinite(density)) continue;
    if (out.some((o) => o.model === model)) continue;
    const d = Math.min(COVER_LIMITS.density[1], Math.max(0, round(density)));
    if (d > 0) out.push({ model, density: d });
  }
  return out.length ? out : null;
}

/** What is wrong with a cover a manifest says (the validator): nothing if it is one (or says none). */
export function coverErrors(code: string, raw: unknown): string[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) return [`tile "${code}": cover è un elenco di {model, density}`];
  const errors: string[] = [];
  const [lo, hi] = COVER_LIMITS.density;
  if (raw.length > COVER_LIMITS.kinds) errors.push(`tile "${code}": cover al più ${COVER_LIMITS.kinds} tipi`);
  const seen = new Set<string>();
  for (const k of raw) {
    if (!k || typeof k !== 'object' || Array.isArray(k)) {
      errors.push(`tile "${code}": ogni tipo di cover è {model, density}`);
      continue;
    }
    const { model, density } = k as { model?: unknown; density?: unknown };
    if (typeof model !== 'string' || !MODEL_ID.test(model)) errors.push(`tile "${code}": cover.model è l'id di un programma di models/`);
    else if (seen.has(model)) errors.push(`tile "${code}": cover nomina «${model}» due volte`);
    else seen.add(model);
    if (typeof density !== 'number' || !Number.isFinite(density) || density < lo || density > hi) errors.push(`tile "${code}": cover.density fra ${lo} e ${hi}`);
  }
  return errors;
}

/** What a terrain says to its cover: where it is drawn, whether it blocks, the cover itself. */
export interface CoveredTerrain {
  layer?: unknown;
  solid?: unknown;
  cover?: unknown;
}

/** Whether a terrain is ground one walks, the only one a cover grows on (not a wall, a floor, the water, a wood, the rock, the void). */
export function coversGround(t: CoveredTerrain | undefined): boolean {
  if (!t || t.solid === true) return false;
  return t.layer === 'ground' || (t.layer === undefined && t.solid === false);
}

/** A terrain's cover: what it says, only on the ground one walks; undefined where there is none. */
export function coverOf(t: CoveredTerrain | undefined): CoverKind[] | undefined {
  if (!coversGround(t)) return undefined;
  return readCover(t!.cover) ?? undefined;
}

/** An instance of cover: which kind and which of its tile (`n`, from 0), which seed of its program (from 1), where, how turned and how big. */
export interface CoverInstance {
  model: string;
  n: number;
  seed: number;
  /** Carpet coordinates of its middle (x along the columns, y along the rows), inside its tile. */
  x: number;
  y: number;
  yaw: number;
  scale: number;
}

/**
 * The `n`-th instance of a kind on a tile: from the tile, the program's name and `n` only, so a kind added or another made denser moves no
 * other; its seed among the `seeds` of its program. The same on every client, at every load.
 */
export function coverInstance(model: string, col: number, row: number, n: number, seeds: number): CoverInstance {
  const q = hash32(col, row, hashStr(model), n + 1);
  const r = hash32(q, 0x5eed, n);
  const s = Math.max(1, Math.floor(seeds) || 1);
  return {
    model,
    n,
    seed: 1 + (r % s),
    x: col + MARGIN + ((q & 1023) / 1023) * (1 - 2 * MARGIN),
    y: row + MARGIN + (((q >>> 10) & 1023) / 1023) * (1 - 2 * MARGIN),
    yaw: ((r >>> 8) % 628) / 100,
    scale: 0.8 + ((r >>> 18) % 41) / 100,
  };
}

/** How many instances of a kind stand on a tile: the whole of its density, and one more where the tile's hash falls under the fraction. */
export function coverCount(model: string, density: number, col: number, row: number): number {
  const whole = Math.floor(density);
  const part = density - whole;
  return whole + (part > 0 && (hash32(col, row, hashStr(model), 0xc0e) & 1023) / 1024 < part ? 1 : 0);
}

/** The instances of cover on a tile, kind by kind in the order the terrain says them; `seeds`: how many seeds a program has. */
export function coverOnTile(kinds: readonly CoverKind[], col: number, row: number, seeds: (model: string) => number, out: CoverInstance[] = []): CoverInstance[] {
  for (const k of kinds) {
    const count = coverCount(k.model, k.density, col, row);
    if (!count) continue;
    const s = seeds(k.model);
    for (let n = 0; n < count; n++) out.push(coverInstance(k.model, col, row, n, s));
  }
  return out;
}

/** An instance of cover that became a thing of the world (`Kernel.uncover`): its tile in its place, which one, the module it became, its seed. */
export interface Uncovered {
  tile: number;
  model: string;
  n: number;
  module: string;
  seed: number;
}

/** The key of an instance in its place: its tile, its program, which one. */
export const uncoveredKey = (tile: number, model: string, n: number) => `${tile}|${model}|${n}`;

/** The keys of a place's uncovered instances as a server sends them (`ChunkView.uncovered`), without trusting: well formed, in the place, at most `MAX_UNCOVERED`. */
export function readUncoveredKeys(raw: unknown, S: number): string[] {
  if (!Array.isArray(raw)) return [];
  const out = new Set<string>();
  for (const k of raw) {
    if (out.size >= MAX_UNCOVERED) break;
    if (typeof k !== 'string' || k.length > 100) continue;
    const m = /^(\d+)\|([a-z0-9][a-z0-9-]{0,63})\|(\d+)$/.exec(k);
    if (!m || Number(m[1]) >= S * S || Number(m[3]) >= MAX_ON_TILE) continue;
    out.add(uncoveredKey(Number(m[1]), m[2]!, Number(m[3])));
  }
  return [...out];
}

/**
 * The uncovered instances of a place as its plan says them, without trusting: a list of `{ tile, model, n, module, seed }` with a tile of the
 * place, a program's and a module's id, the instance and the seed in their ranges; the first of an instance kept, at most `MAX_UNCOVERED`.
 */
export function readUncovered(raw: unknown, S: number): Uncovered[] {
  if (!Array.isArray(raw)) return [];
  const out: Uncovered[] = [];
  const seen = new Set<string>();
  for (const u of raw) {
    if (out.length >= MAX_UNCOVERED) break;
    if (!u || typeof u !== 'object' || Array.isArray(u)) continue;
    const { tile, model, n, module, seed } = u as Record<string, unknown>;
    if (!Number.isInteger(tile) || (tile as number) < 0 || (tile as number) >= S * S) continue;
    if (typeof model !== 'string' || !MODEL_ID.test(model) || typeof module !== 'string' || !MODULE_ID.test(module)) continue;
    if (!Number.isInteger(n) || (n as number) < 0 || (n as number) >= MAX_ON_TILE) continue;
    if (!Number.isInteger(seed) || (seed as number) < 1 || (seed as number) > 64) continue;
    const key = uncoveredKey(tile as number, model, n as number);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ tile: tile as number, model, n: n as number, module, seed: seed as number });
  }
  return out;
}

/**
 * How many instances of each place are drawn under the cap (D2 of T509): the places nearest the wanderer whole, the one that would pass the
 * cap with what is left of it, the farther ones none. `counts` in the order of distance, nearest first.
 */
export function coverBudget(counts: readonly number[], cap = COVER_CAP): number[] {
  let left = Math.max(0, Math.floor(cap));
  return counts.map((c) => {
    const keep = Math.min(Math.max(0, c), left);
    left -= keep;
    return keep;
  });
}

/** Whether the `i`-th of `count` instances is among the `keep` drawn: spread over the place, not its first rows. */
export const keptOf = (i: number, count: number, keep: number): boolean => keep >= count || Math.floor(((i + 1) * keep) / count) > Math.floor((i * keep) / count);
