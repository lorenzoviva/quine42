// The sandbox's land: MarkovJunior's River model (unchanged, models/River.xml) run at tile scale makes a
// river, its meadows and the woods; then a plan says where things go. Pure functions, no three.js.

import { Rng } from '../../src/kernel/rng';
import { compileMjx } from '../mjx/model';
import { OFFICIAL } from '../mjx/official';
import { runMjx } from '../mjx/run';
import type { Role } from './catalog';

export type Ground = 'water' | 'meadow' | 'wood';

export interface Land {
  W: number;
  H: number;
  tiles: Ground[];
}

export function makeLand(W: number, H: number, seed: number): Land {
  const river = OFFICIAL.find((o) => o.name === 'River')!;
  const g = runMjx(compileMjx(river.xml, { size: [W, H, 1] }), seed).grid;
  // River.xml: U the river, G the meadows along it, E the woods (B and the rest are gone by the end).
  const tiles = Array.from(g.cells, (c): Ground => {
    const ch = g.alphabet[c];
    return ch === 'U' ? 'water' : ch === 'E' ? 'wood' : 'meadow';
  });
  return { W, H, tiles };
}

export interface Placement {
  id: string;
  role: Role;
  /** Centre, in tiles. */
  x: number;
  z: number;
  yaw: number;
  seed: number;
}

const free = (land: Land, x: number, z: number, w: number, h: number, taken: Set<number>, want: Ground[] = ['meadow']) => {
  for (let j = z; j < z + h; j++)
    for (let i = x; i < x + w; i++) {
      if (i < 1 || j < 1 || i >= land.W - 1 || j >= land.H - 1) return false;
      const k = i + j * land.W;
      if (!want.includes(land.tiles[k]) || taken.has(k)) return false;
    }
  return true;
};
const take = (land: Land, x: number, z: number, w: number, h: number, taken: Set<number>) => {
  for (let j = z; j < z + h; j++) for (let i = x; i < x + w; i++) taken.add(i + j * land.W);
};

/** The nearest free rectangle to (cx, cz), searching outwards; it may turn woods into meadow. */
function spot(land: Land, cx: number, cz: number, w: number, h: number, taken: Set<number>, clear: boolean): [number, number] | null {
  for (let r = 0; r < Math.max(land.W, land.H); r++)
    for (let dz = -r; dz <= r; dz++)
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const x = Math.round(cx + dx - w / 2), z = Math.round(cz + dz - h / 2);
        if (free(land, x, z, w, h, taken, clear ? ['meadow', 'wood'] : ['meadow'])) {
          if (clear) for (let j = z; j < z + h; j++) for (let i = x; i < x + w; i++) land.tiles[i + j * land.W] = 'meadow';
          take(land, x, z, w, h, taken);
          return [x + w / 2, z + h / 2];
        }
      }
  return null;
}

export interface Plan {
  things: Placement[];
  start: [number, number];
}

/** Ids by role from the catalogue, so the plan does not depend on it. */
export function plan(land: Land, seed: number, kinds: Record<'trees' | 'plants' | 'rocks' | 'npcs' | 'animals', string[]>): Plan {
  const rng = new Rng(seed);
  const taken = new Set<number>();
  const things: Placement[] = [];
  const put = (id: string, role: Role, x: number, z: number, yaw = 0) => things.push({ id, role, x, z, yaw, seed: 1 + rng.int(1000) });
  const cx = land.W / 2, cz = land.H / 2;

  // The village: the house (its door faces south, towards the camera), the campfire in front of it.
  const house = spot(land, cx, cz - 3, 5, 5, taken, true)!;
  put('casa', 'structure', house[0], house[1]);
  const fire = spot(land, house[0] + 3, house[1] + 4.5, 1, 1, taken, true)!;
  put('falo', 'prop', fire[0], fire[1]);
  const barrel = spot(land, house[0] - 3.2, house[1] + 2, 1, 1, taken, true);
  if (barrel) put('barile', 'prop', barrel[0], barrel[1], rng.next() * 6.28);
  for (const [id, dx, dz] of [['pozzo', -6, 4], ['casetta', 7, -2], ['fontana', -2, 8], ['torre-di-guardia', 10, 6]] as const) {
    const w = id === 'casetta' ? 4 : 3;
    const s = spot(land, house[0] + dx, house[1] + dz, w, w, taken, true);
    if (s) put(id, 'structure', s[0], s[1], id === 'casetta' ? 0 : Math.floor(rng.next() * 4) * (Math.PI / 2));
  }
  // A row of slots for MarkovJunior's own models, south of the village (the page fills in the ids).
  const gallery = spot(land, house[0] - 1, house[1] + 13, 18, 3, taken, true);
  const start: [number, number] = [fire[0] - 1.5, fire[1] + 1.5];
  for (let k = 0; gallery && k < 8; k++) things.push({ id: '', role: 'official', x: gallery[0] - 8 + k * 2.3, z: gallery[1], yaw: 0, seed: 1 });

  // Woods: trees on wood tiles, two tiles apart; plants, flowers and stones in the meadows.
  for (let z = 1; z < land.H - 1; z++)
    for (let x = 1; x < land.W - 1; x++) {
      const k = x + z * land.W;
      if (taken.has(k)) continue;
      const t = land.tiles[k];
      if (t === 'wood' && rng.next() < 0.26 && free(land, x - 1, z - 1, 3, 3, taken, ['wood', 'meadow'])) {
        put(kinds.trees[rng.int(kinds.trees.length)], 'tree', x + 0.5 + (rng.next() - 0.5) * 0.4, z + 0.5 + (rng.next() - 0.5) * 0.4, rng.next() * 6.28);
        take(land, x, z, 1, 1, taken);
        taken.add(k + 1);
        taken.add(k + land.W);
      } else if (t !== 'water' && rng.next() < (t === 'meadow' ? 0.07 : 0.05)) {
        const r = rng.next();
        const [id, role] = r < 0.5 ? [kinds.plants[rng.int(kinds.plants.length)], 'plant' as const] : [kinds.rocks[rng.int(kinds.rocks.length)], 'rock' as const];
        put(id, role, x + 0.5, z + 0.5, rng.next() * 6.28);
        take(land, x, z, 1, 1, taken);
      }
    }

  // People near the village, animals around.
  for (const id of kinds.npcs) {
    const s = spot(land, house[0] + (rng.next() - 0.5) * 10, house[1] + 4 + rng.next() * 4, 1, 1, taken, false);
    if (s) put(id, 'npc', s[0], s[1], rng.next() * 6.28);
  }
  for (const id of kinds.animals) {
    const s = spot(land, rng.int(land.W), rng.int(land.H), 1, 1, taken, false);
    if (s) put(id, 'animal', s[0], s[1], rng.next() * 6.28);
  }
  return { things, start };
}
