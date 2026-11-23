// Seeing under the ground (T416, ADR-0091 point 6, T52e without strata). Whoever stands more than a step under the ground (in a
// cellar, `Kernel.underground`) has what stands above their head cut away in a disc of tiles around them, stretched towards the
// camera: terrain, structures and things over `CUT_ABOVE` + their floor. The disc is whole tiles, decided here with integers alone,
// so the kernel, the terrain's caps and the shaders that cut say the same tiles. Pure functions: no three.js, no kernel.
// The cut towards the camera (T476, ADR-0257, row 3 of T459): whoever the ground in front hides from the 3/4 camera (`hiddenFromCamera`,
// the true relief of ADR-0256) has the same disc cut at the height of their head, only on the camera's side (`Cut.around` false).

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

/** A cut of what stands over a height in the disc of tiles around one: under the ground (T416) or towards the camera (T476). */
export interface Cut {
  /** The height (tiles, as the kernel's heights) over which what stands in the disc is cut. */
  cut: number;
  /** The tile one stands on. */
  tile: { x: number; y: number };
  /**
   * Whether the disc reaches behind the tile, away from the camera: under the ground all around (what is over the head is cut); towards
   * the camera only the tiles not behind the row one stands on (`inCutDisc`): what is behind does not hide, and stays whole.
   */
  around: boolean;
}

/** Where one stands under the ground: the cut's height, how deep the floor is under the ground, the tile one stands on. */
export interface Underground extends Cut {
  /** How far the floor is under the ground there (tiles, > `UNDER_STEP`). */
  depth: number;
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
 * tiles towards the camera (a capsule); not `around` (the cut towards the camera, T476), only the tiles not behind the row one stands on.
 * Integers alone: the shaders do the same sums on whole numbers.
 */
export function inCutDisc(dx: number, dy: number, towards: Towards, around = true): boolean {
  const toward = dx * towards.x + dy * towards.y;
  if (!around && toward < 0) return false;
  const along = Math.min(CUT_STRETCH, Math.max(0, toward));
  const px = dx - towards.x * along, py = dy - towards.y * along;
  return px * px + py * py <= CUT_RADIUS * CUT_RADIUS;
}

/** The tiles of the disc around a tile, row by row (not `around`, only those on the camera's side). */
export function cutDisc(tile: { x: number; y: number }, towards: Towards, around = true): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = [];
  const R = CUT_REACH;
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) if (inCutDisc(dx, dy, towards, around)) out.push({ x: tile.x + dx, y: tile.y + dy });
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
  return { cut: floor + CUT_ABOVE, depth, tile: { x: Math.floor(x), y: Math.floor(y) }, around: true };
}

// ------------------------------------------------------------------------------------------------- the cut towards the camera (T476)

/** Where the camera aims, over the feet (tiles): the wanderer's middle (renderer.ts), what the cut towards the camera wants seen. */
export const CAMERA_AIM = 0.6;

/**
 * The camera as the cut towards it reads it: the quarter it looks from (`towardsCamera`), how much its line rises a tile on the flat
 * (the tangent of its pitch: 1.40 for the 3/4 of 0.95 radians) and how far it stands on the flat (tiles: the cosine of its pitch times its
 * distance, 8.7 at the simulation's view). Past the camera nothing hides it; past `CUT_REACH` the disc cuts nothing, and is not asked.
 */
export interface CameraLine {
  towards: Towards;
  rise: number;
  reach: number;
}

/**
 * Whether the ground hides one standing on `tile` from the camera (the prototype's `hiddenFromCamera`, T459 § 3.2, along the camera's
 * quarter): the line from their middle (`mid`, tiles) up to the camera, rising `line.rise` a tile, passes under the top of a column
 * between them at its near edge (`s - 0.5` tiles from the middle of the tile), `line.reach` tiles at most and never past `CUT_REACH`.
 * `top(x, y)` is the height of the column of a tile (tiles, the kernel's `groundAt`); what is not a number hides nothing.
 */
export function hiddenFromCamera(top: (x: number, y: number) => number, tile: { x: number; y: number }, mid: number, line: CameraLine): boolean {
  if (!Number.isFinite(mid) || !Number.isFinite(line.rise) || !Number.isFinite(line.reach)) return false;
  const reach = Math.min(CUT_REACH, Math.round(line.reach));
  const { x: tx, y: ty } = line.towards;
  for (let s = 1; s <= reach; s++) {
    const h = top(tile.x + tx * s, tile.y + ty * s);
    if (Number.isFinite(h) && h > mid + line.rise * (s - 0.5)) return true;
  }
  return false;
}

/**
 * The cut towards the camera (T476): where the ground in front hides one standing at `(x, y)` on `floor` from the camera, the disc at the
 * height of the head (`floor + CUT_ABOVE`, as under the ground), only on the camera's side; undefined where one is seen, and for anything
 * that is not a number.
 */
export function cameraCutAt(x: number, y: number, floor: number, top: (x: number, y: number) => number, line: CameraLine): Cut | undefined {
  if (![x, y, floor].every(Number.isFinite)) return undefined;
  const tile = { x: Math.floor(x), y: Math.floor(y) };
  return hiddenFromCamera(top, tile, floor + CAMERA_AIM, line) ? { cut: floor + CUT_ABOVE, tile, around: false } : undefined;
}
