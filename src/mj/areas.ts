// The areas of a structure (T346, ADR-0182): what a program says of its ground, tile by tile, for whoever places people and animals
// there (the Narrator, the set designer): a pasture, a yard, a barn, a house. A letter of the palette carries `area="pasture"`; the
// letters of the ground layer say the area of each tile. The program draws no animal and no person: it marks where they would be.

import type { Grid3, PaletteEntry } from './engine';

/** A name of an area: plain, lowercase, up to 24 characters (`pasture`, `yard`, `barn`, `tower-floor`). */
export const AREA_RE = /^[a-z][a-z0-9-]{0,23}$/;

/** The tiles of every area of a model, in the model's own tiles (x, y from its corner), each list in reading order. */
export type AreaMap = Record<string, Array<[number, number]>>;

/** The areas the palette declares, in alphabetical order. */
export const areaNames = (palette: Record<string, PaletteEntry>): string[] => [...new Set(Object.values(palette).flatMap((p) => (p.area ? [p.area] : [])))].sort();

/**
 * The area of every tile of a model: on the ground layer (`base`, where the soil of the world is) the letters that carry an area
 * are counted in each tile of `vpt` × `vpt` cells, and the tile is of the area with most cells (the first name in alphabetical order
 * if two tie); a tile without any is of no area. Hidden letters count like the others: a program keeps them unseen under its floors.
 */
export function areasOf(g: Pick<Grid3, 'X' | 'Y' | 'Z' | 'cells' | 'alphabet'>, palette: Record<string, PaletteEntry>, vpt: number, base = 0): AreaMap {
  const out: AreaMap = {};
  if (!(vpt >= 1) || base < 0 || base >= g.Z) return out;
  const areaOf = g.alphabet.map((ch) => palette[ch]?.area);
  if (!areaOf.some(Boolean)) return out;
  const tx = Math.ceil(g.X / vpt), ty = Math.ceil(g.Y / vpt);
  const layer = base * g.X * g.Y;
  for (let j = 0; j < ty; j++)
    for (let i = 0; i < tx; i++) {
      const counts = new Map<string, number>();
      for (let y = j * vpt; y < Math.min(g.Y, (j + 1) * vpt); y++)
        for (let x = i * vpt; x < Math.min(g.X, (i + 1) * vpt); x++) {
          const a = areaOf[g.cells[layer + x + y * g.X]];
          if (a) counts.set(a, (counts.get(a) ?? 0) + 1);
        }
      let best: string | undefined;
      for (const [a, n] of counts) if (best === undefined || n > counts.get(best)! || (n === counts.get(best) && a < best)) best = a;
      if (best) (out[best] ??= []).push([i, j]);
    }
  return Object.fromEntries(Object.keys(out).sort().map((k) => [k, out[k]]));
}

/**
 * The areas of a vessel (T440): its helm, where one boards it, its hold stand on its deck and under it, not on a ground, so every layer
 * counts, and a tile is of every area that has a cell in its column of `vpt` × `vpt` (a helm of a few voxels over a hold is both): the
 * tiles of each area in reading order, as `areasOf` gives them.
 */
export function columnAreasOf(g: Pick<Grid3, 'X' | 'Y' | 'Z' | 'cells' | 'alphabet'>, palette: Record<string, PaletteEntry>, vpt: number): AreaMap {
  const out: AreaMap = {};
  if (!(vpt >= 1)) return out;
  const areaOf = g.alphabet.map((ch) => palette[ch]?.area);
  if (!areaOf.some(Boolean)) return out;
  const tx = Math.ceil(g.X / vpt), ty = Math.ceil(g.Y / vpt), XY = g.X * g.Y;
  const seen = new Map<string, Uint8Array>();
  for (let z = 0; z < g.Z; z++)
    for (let y = 0; y < g.Y; y++)
      for (let x = 0; x < g.X; x++) {
        const a = areaOf[g.cells[z * XY + x + y * g.X]];
        if (!a) continue;
        let m = seen.get(a);
        if (!m) seen.set(a, (m = new Uint8Array(tx * ty)));
        m[Math.floor(x / vpt) + Math.floor(y / vpt) * tx] = 1;
      }
  for (const a of [...seen.keys()].sort()) {
    const m = seen.get(a)!;
    out[a] = [];
    for (let j = 0; j < ty; j++) for (let i = 0; i < tx; i++) if (m[i + j * tx]) out[a].push([i, j]);
  }
  return out;
}
