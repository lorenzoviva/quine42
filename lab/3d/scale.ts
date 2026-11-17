// The voxels a tile of the sandbox (T403, D60): any model loaded may be shown at another density than its entry's, the wanderer
// stays at the game's scale. Pure functions, no three.js: what a value is, where it is kept, what a model measures at it.

/** The densities offered as buttons; any other whole value from MIN_VPT to MAX_VPT is typed. */
export const SCALE_CHOICES = [5, 10, 20] as const;
export const MIN_VPT = 2;
export const MAX_VPT = 40;
/** The wanderer's height in tiles: 30 voxels at 20 a tile (lab/mjx/models/viandante.xml), PARTS' person. */
export const WANDERER_TILES = 1.5;

/** A density as typed or read: a whole number in range, else undefined (the model's own). */
export function readVpt(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isInteger(n) && n >= MIN_VPT && n <= MAX_VPT ? n : undefined;
}

/** The density asked for by the address (`?vpt=`), as the lab keeps its other choices (`?classica`); none or invalid: the model's own. */
export const scaleFrom = (search: string): number | undefined => readVpt(new URLSearchParams(search).get('vpt'));

/** The address with the density in it (none: the model's own). */
export function withScale(href: string, vpt: number | undefined): string {
  const url = new URL(href);
  if (vpt === undefined) url.searchParams.delete('vpt');
  else url.searchParams.set('vpt', String(vpt));
  return url.toString();
}

/** The density a model is shown at: the one chosen, or its entry's. */
export const shownVpt = (entryVpt: number, chosen: number | undefined): number => chosen ?? entryVpt;

const n = (v: number) => v.toLocaleString('it', { maximumFractionDigits: 2 });

/** What a grid of voxels measures at a density: its box in tiles and its height in wanderers. */
export function measureAt(box: readonly [number, number, number], vpt: number): { tiles: [number, number, number]; wanderers: number; text: string } {
  const tiles = box.map((v) => v / vpt) as [number, number, number];
  const wanderers = tiles[2] / WANDERER_TILES;
  return { tiles, wanderers, text: `${vpt} voxel per casella: ${n(tiles[0])} × ${n(tiles[1])} caselle, alto ${n(tiles[2])} (${n(wanderers)} viandanti)` };
}

/** How far from the wanderer a model is put, centre to centre: half its diagonal in tiles and a tile and a half of room. */
export const showcaseDistance = (box: readonly [number, number, number], vpt: number): number => Math.hypot(box[0], box[1]) / 2 / vpt + 1.5;
