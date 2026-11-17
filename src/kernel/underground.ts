// Seeing under the ground (T416, ADR-0091 point 6, T52e without strata). Whoever stands more than a step under the ground (in a
// cellar, `Kernel.underground`) has what stands above their head cut away in a disc of tiles around them, stretched towards the
// camera: terrain, structures and things over `CUT_ABOVE` + their floor. The disc is whole tiles, decided here with integers alone,
// so the kernel, the terrain's caps and the shaders that cut say the same tiles. Pure functions: no three.js, no kernel.

/** How high over the floor one stands on the cut is (tiles): as in a structure one is in (T53b). */
export const CUT_ABOVE = 1.15;
/** The disc's radius (tiles), from the tile one stands on. */
export const CUT_RADIUS = 6;
/** How far the disc stretches towards the camera (tiles): what stands between the camera and the wanderer hides it. */
export const CUT_STRETCH = 3;
/** How far from the tile one stands on the disc can reach (tiles). */
export const CUT_REACH = CUT_RADIUS + CUT_STRETCH;
/** How far under the ground (tiles) the floor must be to be under it: more than a step (`stepOf`, a fifth of a tile). */
export const UNDER_STEP = 0.2;
/** How far under the ground (tiles) the sun and the sky are dimmest. */
export const DIM_DEPTH = 2;
/** The dimmest the sun and the sky get under the ground: a third (ADR-0091). */
export const DIM_FLOOR = 1 / 3;

/** Where one stands under the ground: the cut's height, how deep the floor is under the ground, the tile one stands on. */
export interface Underground {
  /** The height (tiles, as the kernel's heights) over which what stands in the disc is cut. */
  cut: number;
  /** How far the floor is under the ground there (tiles, > `UNDER_STEP`). */
  depth: number;
  /** The tile one stands on. */
  tile: { x: number; y: number };
}

/** A direction on the tiles, one of the four: towards the camera. */
export type Towards = { x: -1 | 0 | 1; y: -1 | 0 | 1 };

/**
 * The quarter towards the camera from its angle around the wanderer (the renderer's `yaw`: 0 from the south, +y in the kernel):
 * the nearest of the four, so the disc changes only when the camera turns by a quarter.
 */
export function towardsCamera(yaw: number): Towards {
  const q = ((Math.round(yaw / (Math.PI / 2)) % 4) + 4) % 4;
  return ([{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }] as const)[q]!;
}

/**
 * Whether a tile, `(dx, dy)` from the one standing on, is in the disc: within `CUT_RADIUS` of the segment from there `CUT_STRETCH`
 * tiles towards the camera (a capsule). Integers alone: the shaders do the same sums on whole numbers.
 */
export function inCutDisc(dx: number, dy: number, towards: Towards): boolean {
  const along = Math.min(CUT_STRETCH, Math.max(0, dx * towards.x + dy * towards.y));
  const px = dx - towards.x * along, py = dy - towards.y * along;
  return px * px + py * py <= CUT_RADIUS * CUT_RADIUS;
}

/** The tiles of the disc around a tile, row by row. */
export function cutDisc(tile: { x: number; y: number }, towards: Towards): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = [];
  const R = CUT_REACH;
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) if (inCutDisc(dx, dy, towards)) out.push({ x: tile.x + dx, y: tile.y + dy });
  return out;
}

/** How much of the sun and the sky is left at a depth under the ground (tiles): all of it on the ground, down to `DIM_FLOOR`. */
export function dimAt(depth: number): number {
  if (!Number.isFinite(depth) || depth <= 0) return 1;
  return 1 - (1 - DIM_FLOOR) * Math.min(1, depth / DIM_DEPTH);
}

/**
 * Whether one stands under the ground, from the floor and the ground at a point (tiles): the floor more than a step (`UNDER_STEP`)
 * under it. Undefined on the ground, on a floor of a house, on anything that is not a number.
 */
export function undergroundAt(x: number, y: number, floor: number, ground: number): Underground | undefined {
  if (![x, y, floor, ground].every(Number.isFinite)) return undefined;
  const depth = ground - floor;
  if (depth <= UNDER_STEP) return undefined;
  return { cut: floor + CUT_ABOVE, depth, tile: { x: Math.floor(x), y: Math.floor(y) } };
}
