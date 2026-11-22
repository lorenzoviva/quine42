// Where the wanderers will be soon (T488, ADR-0244): what the Council makes for a place it makes only when someone can reach it soon. A place
// is in reach of a wanderer if its square is within `near` tiles of them, or within `side` tiles of the way they are going for the next `ahead`
// seconds (at most `aheadMax` tiles: a fast vehicle). Before, the kernel planned every place the camera saw and one more around (the first run
// of the beta: 232 places planned in 16 minutes, 16 % of them reached). Pure: the kernel gives the wanderers, their pace measured by the kernel.

/** A wanderer as the reach sees them: where they are in the world, in tiles, and how fast they go, in tiles a second. */
export interface Walker {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** The measures of the reach: tiles, seconds. */
export interface Reach {
  /** Tiles around a wanderer whose places are in reach whatever the way: a few steps aside. */
  near: number;
  /** Seconds of the way ahead whose places are in reach now: about the time a plan takes, and some. */
  ahead: number;
  /** The most tiles of the way ahead (a vehicle that goes fast); the way is the wanderer's pace times `ahead`. */
  aheadMax: number;
  /** Tiles beside the way ahead. */
  side: number;
  /** The least pace, in tiles a second, that is going somewhere (below, only `near`). */
  moving: number;
}

/**
 * The reach of the game. At 6 tiles a second on foot the way ahead is 48 tiles, between two and three places: a plan of Flash-Lite takes a few
 * seconds, three at a time, and one in seven is written again. `near` is a little under half a place: from the middle of a place only it, from
 * near its edge the one beside.
 */
export const REACH: Reach = { near: 8, ahead: 8, aheadMax: 54, side: 4, moving: 0.5 };

/**
 * The reach the kernel uses (`Kernel.REACH` reads and writes it): the game's. The tests of something else widen `near` to every loaded place
 * (tests/setup/reach-wide.ts), as the kernel planned before T488; tests/raggio.test.ts puts the game's back.
 */
export const KERNEL_REACH: { current: Reach } = { current: REACH };

/** Tiles from a point to the square of the place (cx, cy) of side S: 0 inside. */
export function squareDistance(x: number, y: number, cx: number, cy: number, S: number): number {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return Infinity;
  const dx = Math.max(cx * S - x, 0, x - (cx + 1) * S);
  const dy = Math.max(cy * S - y, 0, y - (cy + 1) * S);
  return Math.hypot(dx, dy);
}

/** Tiles from the centre of the place (cx, cy) to a point: the order in which the places in reach are made (the kernel's of before). */
export function centreDistance(x: number, y: number, cx: number, cy: number, S: number): number {
  return Math.hypot((cx + 0.5) * S - x, (cy + 0.5) * S - y);
}

/** The pace of a walker, in tiles a second (0 for what is not a number). */
export function paceOf(w: Walker): number {
  const v = Math.hypot(w.vx, w.vy);
  return Number.isFinite(v) ? v : 0;
}

/** Whether the place (cx, cy) is in reach of a walker: near them, or beside their way ahead. */
export function inReachOf(w: Walker, cx: number, cy: number, S: number, r: Reach = REACH): boolean {
  if (squareDistance(w.x, w.y, cx, cy, S) <= r.near) return true;
  const v = paceOf(w);
  if (v < r.moving) return false;
  const length = Math.min(v * r.ahead, r.aheadMax);
  // The way ahead, a step at a time: a point of it within `side` tiles of the square.
  const ux = w.vx / v, uy = w.vy / v;
  const step = Math.max(1, r.side);
  for (let t = step; t <= length + 1e-9; t += step) if (squareDistance(w.x + ux * t, w.y + uy * t, cx, cy, S) <= r.side) return true;
  return squareDistance(w.x + ux * length, w.y + uy * length, cx, cy, S) <= r.side;
}

/** Whether the place (cx, cy) is in reach of any of the walkers. */
export function inReach(walkers: readonly Walker[], cx: number, cy: number, S: number, r: Reach = REACH): boolean {
  return walkers.some((w) => inReachOf(w, cx, cy, S, r));
}

/** How near the place (cx, cy) is to the nearest walker, by its centre: what is in reach is made in this order. */
export function nearestCentre(walkers: readonly Walker[], cx: number, cy: number, S: number): number {
  let best = Infinity;
  for (const w of walkers) best = Math.min(best, centreDistance(w.x, w.y, cx, cy, S));
  return best;
}

/**
 * The pace of a wanderer from where they were a moment ago (`was`, `dt` seconds of the world before) to where they are: an average over about
 * `smooth` seconds, so a stop or a turn counts after a step; a jump (a teleport, a respawn, a body carried) is no pace.
 */
export function nextPace(prev: { vx: number; vy: number }, was: { x: number; y: number }, now: { x: number; y: number }, dt: number, smooth = 0.5): { vx: number; vy: number } {
  if (!(dt > 0) || !Number.isFinite(now.x) || !Number.isFinite(now.y) || !Number.isFinite(was.x) || !Number.isFinite(was.y)) return { vx: prev.vx || 0, vy: prev.vy || 0 };
  const ix = (now.x - was.x) / dt, iy = (now.y - was.y) / dt;
  if (Math.hypot(ix, iy) > JUMP_PACE) return { vx: 0, vy: 0 };
  const k = Math.min(1, dt / smooth);
  return { vx: (prev.vx || 0) + (ix - (prev.vx || 0)) * k, vy: (prev.vy || 0) + (iy - (prev.vy || 0)) * k };
}

/** Tiles a second beyond which a move is a jump, not a pace: three times the fastest step of a body on foot. */
export const JUMP_PACE = 30;
