// The wide streets (T548, C4 of docs/design/terreno-ricco.md, ADR-0269): where the code the layout digs its paths with is a road by its
// name (a «strada», an «asfalto», a «street»; not a «sentiero» nor a «pista»), the roads of a new place (the paths the layout carves, the
// gates, the stamps' `road`, what the environment's program writes) are widened to 2-4 tiles over the base ground, with the sidewalk at
// their sides where the world has one (a terrain named so, or the environment's), read without trusting. Only on the plans with the mark
// (`ChunkPlan.streets`): a plan of before keeps its narrow roads (its things, its edits are per tile).
//
// Only codes change, and only among the ground one walks (the base ground → the road or the sidewalk): what is walked stays walked and what
// is not stays not, so the network, the reach, the rule 10 of the steps are the same (`tests/rientro.test.ts`). The border ring is the
// draft's but for the gates: a gate of a road widens along its edge by the same rule on both sides (the gate's place is the same for the two
// places, `gates`), so a street goes on wide into the place beside it. Pure, deterministic.

import { insetKind } from './inset';
import { crossingOf } from './nature';
import type { TerrainDef } from './types';

/** How wide a street can be, in tiles (1: as before, a lane), and how wide it is where its environment does not say. */
export const STREET_LIMITS = { width: [1, 4] as const };
export const STREET_WIDTH = 3;

/** A street as the layout widens it: the road's code, how wide, the ground it widens over, the sidewalk at its sides (if any). */
export interface Street {
  road: string;
  width: number;
  base: string;
  sidewalk?: string;
}

/** What an environment says of its streets (`EnvironmentDef.street`), read without trusting: a width in range, a code. */
export function readStreet(raw: unknown): { width?: number; sidewalk?: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const { width, sidewalk } = raw as { width?: unknown; sidewalk?: unknown };
  const [lo, hi] = STREET_LIMITS.width;
  return {
    ...(typeof width === 'number' && Number.isFinite(width) ? { width: Math.min(hi, Math.max(lo, Math.round(width))) } : {}),
    ...(typeof sidewalk === 'string' && sidewalk.length === 1 ? { sidewalk } : {}),
  };
}

/** What is wrong with the street an environment says (the validator): nothing if it is one. */
export function streetErrors(id: string, raw: unknown): string[] {
  if (raw === undefined) return [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [`ambiente "${id}": street è {width, sidewalk}`];
  const { width, sidewalk } = raw as { width?: unknown; sidewalk?: unknown };
  const [lo, hi] = STREET_LIMITS.width;
  const errors: string[] = [];
  if (width !== undefined && (typeof width !== 'number' || !Number.isInteger(width) || width < lo || width > hi)) errors.push(`ambiente "${id}": street.width intero fra ${lo} e ${hi}`);
  if (sidewalk !== undefined && (typeof sidewalk !== 'string' || sidewalk.length !== 1)) errors.push(`ambiente "${id}": street.sidewalk è il codice di un terreno`);
  return errors;
}

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** The words of a sidewalk (it and en, accents off). */
const SIDEWALK = /marciapied|\bsidewalks?\b|\bpavements?\b|footpath|\bkerb|\bcurbs?\b/;

/** Whether a terrain is ground one walks and is outdoors: what a street and its sidewalk may be. */
const outdoorGround = (t: TerrainDef | undefined): t is TerrainDef => !!t && t.solid === false && (t.layer ?? 'ground') === 'ground' && !t.indoor && crossingOf(t) === 'walk';

/** Whether a terrain is a road by its name (or id): the street's kind of the inset (T548), never a path nor a track. */
export const isRoad = (t: TerrainDef | undefined, code: string): boolean => outdoorGround(t) && insetKind(t, code) === 'road';

/** The sidewalk of a palette: the first ground one walks whose name says it, not the road. */
export function sidewalkOf(palette: Record<string, TerrainDef>, road: string): string | undefined {
  return Object.entries(palette).find(([c, t]) => c !== road && c !== '?' && outdoorGround(t) && SIDEWALK.test(fold([t.name, t.id].filter((s): s is string => typeof s === 'string').join(' '))))?.[0];
}

/**
 * The street of a place: its road is the code the layout digs with, if its name says a road; its width the environment's (`street.width`)
 * or `STREET_WIDTH`; its sidewalk the environment's (`street.sidewalk`, if it is ground one walks outdoors) or the palette's. Undefined where
 * the road is not a road (a path of the woods) or is one tile wide.
 */
export function streetOf(palette: Record<string, TerrainDef>, road: string, base: string, environment?: { street?: unknown }): Street | undefined {
  if (!isRoad(palette[road], road) || base === road || !outdoorGround(palette[base])) return undefined;
  const said = readStreet(environment?.street);
  const width = said.width ?? STREET_WIDTH;
  if (width <= 1) return undefined;
  const own = said.sidewalk && said.sidewalk !== road && outdoorGround(palette[said.sidewalk]) ? said.sidewalk : undefined;
  const sidewalk = own ?? sidewalkOf(palette, road);
  return { road, width, base, ...(sidewalk ? { sidewalk } : {}) };
}

/** How many tiles of road, joined side by side, make a street that widens (fewer are bits a program scattered, unless they reach a gate). */
export const MIN_ROAD = 4;

const DIRS8: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

/**
 * Widens the roads of a laid-out place (`cells`, rows of codes) to the street's width, in place: every road cell spreads over the base ground
 * (and the sidewalk) around it, `floor((w-1)/2)` towards the lesser x and y and the rest towards the greater, never over what is reserved
 * (the lot of a block) nor over the border ring but along a road's gate; then the base ground beside the road becomes the sidewalk, inside
 * the ring. With `levels` (a true-relief world) only onto a tile at the level of the road it spreads from: a street does not climb a cliff.
 * Only codes of the ground one walks change. Returns the cells that changed, the road and the sidewalk: the network does not take them as
 * ways to join (`networkOf`), so it is the network of the narrow roads.
 */
export function widenStreets(cells: string[][], size: number, street: Street, gates: readonly number[], reserved: ReadonlySet<number> = new Set(), levels?: ArrayLike<number>): Set<number> {
  const { road, width, base, sidewalk } = street;
  const at = (i: number) => cells[Math.floor(i / size)]![i % size]!;
  const set = (i: number, c: string) => (cells[Math.floor(i / size)]![i % size] = c);
  const onBorder = (x: number, y: number) => x === 0 || y === 0 || x === size - 1 || y === size - 1;
  const lo = Math.floor((width - 1) / 2), hi = width - 1 - lo;
  // Along the edge of a road's gate: the same cells on both sides of the edge, never a corner.
  const along = new Set<number>();
  for (const g of gates) {
    if (!(g >= 0 && g < size * size) || at(g) !== road) continue;
    const gx = g % size, gy = Math.floor(g / size);
    const vertical = gx === 0 || gx === size - 1;
    for (let d = -lo; d <= hi; d++) {
      const x = vertical ? gx : gx + d, y = vertical ? gy + d : gy;
      const a = vertical ? y : x;
      if (a >= 1 && a <= size - 2) along.add(y * size + x);
    }
  }
  const takes = (i: number, x: number, y: number) => !reserved.has(i) && (!onBorder(x, y) || along.has(i)) && (at(i) === base || (sidewalk !== undefined && at(i) === sidewalk));
  // A road is a line, or what leads to a gate: the bits of road a program scatters (a tile, two) stay as they are.
  const gateSet = new Set(gates);
  const roads: number[] = [];
  const seen = new Uint8Array(size * size);
  for (let i = 0; i < size * size; i++) {
    if (seen[i] || at(i) !== road) continue;
    const part = [i];
    seen[i] = 1;
    for (let q = 0; q < part.length; q++) {
      const c = part[q]!, x = c % size, y = Math.floor(c / size);
      for (const [dx, dy] of DIRS8.slice(0, 4)) {
        const nx = x + dx, ny = y + dy, n = ny * size + nx;
        if (nx < 0 || ny < 0 || nx >= size || ny >= size || seen[n] || at(n) !== road) continue;
        seen[n] = 1;
        part.push(n);
      }
    }
    if (part.length >= MIN_ROAD || part.some((c) => gateSet.has(c))) roads.push(...part);
  }
  roads.sort((a, b) => a - b);
  const wide = new Set<number>();
  for (const i of roads) {
    const x0 = i % size, y0 = Math.floor(i / size);
    for (let dy = -lo; dy <= hi; dy++)
      for (let dx = -lo; dx <= hi; dx++) {
        const x = x0 + dx, y = y0 + dy;
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        const n = y * size + x;
        if (takes(n, x, y) && (!levels || levels[n] === levels[i])) wide.add(n);
      }
  }
  const changed = new Set<number>();
  for (const n of [...wide].sort((a, b) => a - b)) if (at(n) !== road) (set(n, road), changed.add(n));
  if (sidewalk && sidewalk !== base) {
    // Beside the street only, not beside the bits of road.
    const side = new Set<number>();
    for (const i of [...roads, ...wide]) {
      const x0 = i % size, y0 = Math.floor(i / size);
      for (const [dx, dy] of DIRS8) {
        const x = x0 + dx, y = y0 + dy;
        if (x < 1 || y < 1 || x > size - 2 || y > size - 2) continue;
        const n = y * size + x;
        if (!reserved.has(n) && at(n) === base) side.add(n);
      }
    }
    for (const n of [...side].sort((a, b) => a - b)) (set(n, sidewalk), changed.add(n));
  }
  return changed;
}
