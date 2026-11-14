// The atlas: the geography of a universe (world/atlas.json). Regions — a desert, a castle, the elves'
// wood — have a centre (in chunks, carpet space), a radius and an environment; the places inside a
// region use its environment and carry its name. The Cartographer draws it at genesis and places new
// environments on it when asked; everyone can say in which direction and how far things are.

import type { FileMap } from './types';
import { Rng } from './rng';
import { internalFields, internalName, internalValues, italianName } from './internalNames';

export interface Region {
  id: string;
  name: string;
  description: string;
  /** Layout (environment) id. */
  environment: string;
  center: [number, number];
  /** In chunks (Chebyshev distance). */
  radius: number;
}

export interface Atlas {
  regions: Region[];
}

export const ATLAS_FILE = 'world/atlas.json';

export function readAtlas(files: FileMap): Atlas {
  try {
    // An atlas of the contract 0.3 (`regioni`, `centro`) reads internal (T308a): the migration ports the file, this a stray one.
    const a = internalFields('atlas', JSON.parse(files[ATLAS_FILE] ?? '{}'));
    return { regions: Array.isArray(a.regions) ? a.regions : [] };
  } catch {
    return { regions: [] };
  }
}

export function writeAtlas(a: Atlas): string {
  return JSON.stringify(a, null, 2) + '\n';
}

/** The region a chunk belongs to (the nearest centre among those whose radius covers it). */
export function regionAt(atlas: Atlas, cx: number, cy: number): Region | undefined {
  let best: Region | undefined;
  let bd = Infinity;
  for (const r of atlas.regions) {
    const d = Math.max(Math.abs(cx - r.center[0]), Math.abs(cy - r.center[1]));
    if (d <= r.radius && d < bd) [best, bd] = [r, d];
  }
  return best;
}

// The directions as ids (T310b, `direzioni`): the Cartographer writes them, the world says them in its language (`directionWord`).
export const COMPASS = internalValues('direzioni').filter((d) => d !== 'here');
const DIRS = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];

/** Compass direction from a to b (north is up: smaller y), as an id; `here` when they coincide. */
export function direction(dx: number, dy: number): string {
  if (!dx && !dy) return 'here';
  const a = Math.atan2(dy, dx);
  return DIRS[(Math.round(a / (Math.PI / 4)) + 8) % 8];
}

/** A direction in the words of the world (today Italian: «nord-est»); the dictionaries of the other languages are T239's. */
export const directionWord = (id: string): string => italianName('direzioni', id);

/** The vector of a direction said as an id, or in the Italian of before T310b (`nord-est`); east when it is none. */
export function directionVector(dir: string): [number, number] {
  const i = COMPASS.indexOf(internalName('direzioni', dir.toLowerCase().replace(/\s+/g, '-')));
  if (i < 0) return [1, 0];
  const a = -Math.PI / 2 + (i * Math.PI) / 4;
  return [Math.round(Math.cos(a)), Math.round(Math.sin(a))];
}

/**
 * Where a new region goes: in that direction, at that distance from `from`, not overlapping places
 * already explored nor other regions (it slides further out until it fits).
 */
export function placeRegion(atlas: Atlas, from: [number, number], dir: string, dist: number, radius: number, explored: Set<string>): [number, number] {
  const [vx, vy] = directionVector(dir);
  for (let d = Math.max(2, dist); d < dist + 30; d++) {
    const c: [number, number] = [from[0] + vx * d, from[1] + vy * d];
    let free = true;
    for (let y = c[1] - radius; y <= c[1] + radius && free; y++) for (let x = c[0] - radius; x <= c[0] + radius && free; x++) if (explored.has(`${x},${y}`)) free = false;
    for (const r of atlas.regions) if (Math.max(Math.abs(r.center[0] - c[0]), Math.abs(r.center[1] - c[1])) <= r.radius + radius) free = false;
    if (Math.max(Math.abs(c[0]), Math.abs(c[1])) <= radius + 1) free = false;
    if (free) return c;
  }
  return [from[0] + vx * (dist + 30), from[1] + vy * (dist + 30)];
}

/**
 * A first geography when the Cartographer has not drawn one (offline, or a universe from before the
 * atlas): every environment that is not ordinary countryside gets a region somewhere around.
 */
export function defaultAtlas(layouts: Record<string, { name: string; description: string }>, explored: Set<string>, seed: number): Atlas {
  // The seed's environments by their ids (English since the contract 0.2; the Italian of a Council's environment of before stays).
  const ordinary = /^(village|woods|fields|ruins|inn|borgo|bosco|campi|rovine|locanda)$/;
  const ids = Object.keys(layouts).filter((id) => !ordinary.test(id));
  const rng = new Rng(seed ^ 0x51a7);
  const atlas: Atlas = { regions: [] };
  ids.forEach((id, i) => {
    const dir = COMPASS[(i * 3 + rng.int(8)) % 8];
    const dist = 3 + (i % 4) * 2 + rng.int(3);
    const radius = /desert|jungle|mountain|lake|sea|ocean|deserto|giungla|montagne|lago|mare|oceano/.test(id) ? 2 : 1;
    const centro = placeRegion(atlas, [0, 0], dir, dist, radius, explored);
    atlas.regions.push({ id, name: layouts[id].name, description: layouts[id].description, environment: id, center: centro, radius: radius });
  });
  return atlas;
}

/** What someone standing in chunk (cx, cy) knows about where things are. */
export function directionsFrom(atlas: Atlas, chunks: Array<{ name: string; cx: number; cy: number }>, cx: number, cy: number, max = 16): string[] {
  const out: Array<{ d: number; text: string }> = [];
  const seen = new Set<string>();
  for (const p of chunks) {
    const d = Math.max(Math.abs(p.cx - cx), Math.abs(p.cy - cy));
    if (!d || d > 6 || seen.has(p.name)) continue;
    seen.add(p.name);
    out.push({ d, text: `«${p.name}»: ${directionWord(direction(p.cx - cx, p.cy - cy))}, ${d === 1 ? 'appena oltre' : `a ${d} luoghi da qui`}` });
  }
  for (const r of atlas.regions) {
    const d = Math.max(Math.abs(r.center[0] - cx), Math.abs(r.center[1] - cy));
    if (seen.has(r.name)) continue;
    seen.add(r.name);
    out.push({ d: d + 0.5, text: d <= r.radius ? `qui siamo nella regione «${r.name}»` : `regione «${r.name}» (${r.description}): ${directionWord(direction(r.center[0] - cx, r.center[1] - cy))}, a circa ${d} luoghi` });
  }
  return out.sort((a, b) => a.d - b.d).slice(0, max).map((o) => o.text);
}
