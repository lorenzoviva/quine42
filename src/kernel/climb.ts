// The climb (T477, ADR-0252: the row 4 of T459, R3, `docs/design/terreno-3d.md` § 3.5; D67 C1). A movement of the kernel as the jump is
// (ADR-0080): from a tile to one beside it across a cliff (more than a step, `STEP`, and at most three tiles, `CLIMB`), within the reach
// of the means the wanderer has, the largest of the `climb` of what they wear or hold (`bonus.climb`: a rope, a climbing pick) and of their
// states (`climb` of a state, which an effect gives for some seconds: «Altro…: mi arrampico»). The body goes to the foot of the face,
// up it (or down it) in a time that grows with the rise, and onto the top; meanwhile it does nothing else and the energy goes (the fatigue
// of the swim, ADR-0225); a blow or the energy at zero and it falls back to the foot. The people do not climb (ADR-0250: they go on the
// network). Pure: the kernel calls these with what it reads of the wanderer and the ground, and carries the body along the line they draw.

import { CLIMB, STEP } from './network';

/** The levels a means may give, at most: three tiles (`CLIMB`); a level is a quarter of a tile. */
export const CLIMB_LIMITS = [0, CLIMB] as const;

/** Seconds a level of the face takes, going up and coming down, under the earth's gravity: twelve levels up are about five seconds. */
export const CLIMB_UP_PACE = 0.42;
export const CLIMB_DOWN_PACE = 0.25;
/** Seconds to step to the foot of the face and from its top onto the ground beyond. */
export const CLIMB_STEP_OFF = 0.3;
/** The energy a level of the face costs, up and down (of 100): twelve levels up are twelve, a long swim's worth. */
export const CLIMB_UP_ENERGY = 1;
export const CLIMB_DOWN_ENERGY = 0.4;
/** Below this energy nobody starts a climb (`tired`). */
export const CLIMB_MIN_ENERGY = 1;
/** More than this share of what one carries without slowing down, and nobody climbs (`load`): the hands are needed. */
export const CLIMB_LOAD = 1;
/** How far from the face the body stands at its foot and on its top (tiles, beyond its own half-size). */
export const FACE_GAP = 0.02;
export const TOP_IN = 0.2;
/** The id of the climb in the menu of a tile (`t:_climb`), as `PUT_DOWN` is of putting down. */
export const CLIMB_ACTION = '_climb';

/** Why a climb is not made: no means within the rise, beyond any climb, busy (in the air, at a helm, on a deck), too loaded, too tired, no room. */
export type ClimbRefusal = 'means' | 'high' | 'busy' | 'load' | 'tired' | 'room';

/** What the world says of a climb: the menu's words, the refusals, the fall. */
export const CLIMB_WORDS = {
  up: 'Arrampicati',
  down: 'Calati giù',
  refusal: {
    means: 'Ti serve una corda o una piccozza per una parete così.',
    high: 'Troppo alto per arrampicarsi: servono dei gradini, una scala o un ponte.',
    busy: 'Non ora.',
    load: 'Hai le mani impegnate: posa qualcosa prima di arrampicarti.',
    tired: 'Sei troppo stanco per arrampicarti.',
    room: 'Lassù non c’è posto per te.',
  } satisfies Record<ClimbRefusal, string>,
  fell: 'Perdi la presa e scivoli giù.',
} as const;

/** A point of the carpet. */
export interface Point {
  x: number;
  y: number;
}

/** A climb under way, on the wanderer (the component `climb`): the foot, the face and the top in carpet space, the feet's heights, its clock. */
export interface ClimbComp {
  from: Point;
  /** At the face, on its low side: where the body goes up or down. */
  face: Point;
  to: Point;
  /** The feet at `from` and at `to` (tiles). */
  h0: number;
  h1: number;
  /** The levels of the face, up (> 0) or down (< 0). */
  rise: number;
  t: number;
  /** Seconds to the face, on it, and from it. */
  approach: number;
  climb: number;
  leave: number;
  /** The energy a second on the face costs. */
  cost: number;
  /** The health last seen: less is a blow, and the body falls. */
  health?: number;
}

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** A means's climb read without trusting it: whole levels within `CLIMB_LIMITS` (anything else, 0). */
export function climbLevels(v: unknown): number {
  return finite(v) && v > 0 ? Math.min(CLIMB_LIMITS[1], Math.floor(v)) : 0;
}

/**
 * How high a body climbs (levels): the largest `climb` of the bonuses of what it wears or holds and of its states (a state that has run
 * out is not passed), within `CLIMB`; 0 without a means.
 */
export function climbOf(bonuses: ReadonlyArray<Record<string, unknown> | undefined>, states: ReadonlyArray<Record<string, unknown> | undefined | null | false> = []): number {
  let best = 0;
  for (const b of bonuses) best = Math.max(best, climbLevels(b?.climb));
  for (const s of states) if (s && typeof s === 'object') best = Math.max(best, climbLevels(s.climb));
  return best;
}

/** Whether a rise between two tiles beside each other is one a body climbs (more than a step, at most `CLIMB`). */
export const climbable = (rise: number): boolean => finite(rise) && Math.abs(rise) > STEP && Math.abs(rise) <= CLIMB;

/** The seconds on the face of a rise (levels) under a gravity: slower where the body is heavier, never below half or above twice the earth's. */
export function faceSeconds(rise: number, gravity = 1): number {
  const g = finite(gravity) && gravity > 0 ? Math.max(0.5, Math.min(2, gravity)) : 1;
  return Math.abs(rise) * (rise > 0 ? CLIMB_UP_PACE : CLIMB_DOWN_PACE) * g;
}

/** The energy a whole face costs (levels, gravity), as the seconds do. */
export function faceEnergy(rise: number, gravity = 1): number {
  const g = finite(gravity) && gravity > 0 ? Math.max(0.5, Math.min(2, gravity)) : 1;
  return Math.abs(rise) * (rise > 0 ? CLIMB_UP_ENERGY : CLIMB_DOWN_ENERGY) * g;
}

/**
 * The line of a climb from the tile (col, row) the body stands on to the tile beside it (toCol, toRow), the body at `at` with half-size
 * `r`: the face is the edge between the two, `face` the point at its foot on the low side, `to` a point of the far tile `TOP_IN` beyond
 * the body's half-size from the edge, the other coordinate kept within the tile. Undefined if the two tiles are not beside each other.
 */
export function climbLine(at: Point, r: number, col: number, row: number, toCol: number, toRow: number, up: boolean): { face: Point; to: Point } | undefined {
  const ex = toCol - col, ey = toRow - row;
  if (Math.abs(ex) + Math.abs(ey) !== 1 || ![at.x, at.y, r].every(finite)) return undefined;
  const half = Math.max(0.05, Math.min(0.45, r));
  const inTile = (v: number, lo: number) => Math.max(lo + half + FACE_GAP, Math.min(lo + 1 - half - FACE_GAP, v));
  // The edge between the two tiles, on the axis of the climb.
  const edge = ex > 0 ? toCol : ex < 0 ? col : ey > 0 ? toRow : row;
  const dir = ex || ey;
  // The low side is the near tile going up, the far one coming down; the top of the climb is always on the far tile.
  const low = up ? -dir : dir;
  const faceAt = edge + low * (half + FACE_GAP);
  const topAt = edge + dir * (half + TOP_IN);
  if (ex) {
    const y = inTile(at.y, toRow);
    return { face: { x: faceAt, y }, to: { x: topAt, y } };
  }
  const x = inTile(at.x, toCol);
  return { face: { x, y: faceAt }, to: { x, y: topAt } };
}

/** A climb as the kernel starts it: the line, the heights, the seconds of each part and the energy a second on the face. */
export function startClimb(from: Point, line: { face: Point; to: Point }, h0: number, h1: number, rise: number, gravity = 1, health?: number): ClimbComp {
  const climb = Math.max(0.2, faceSeconds(rise, gravity));
  return {
    from: { ...from },
    face: { ...line.face },
    to: { ...line.to },
    h0,
    h1,
    rise,
    t: 0,
    approach: CLIMB_STEP_OFF,
    climb,
    leave: CLIMB_STEP_OFF,
    cost: faceEnergy(rise, gravity) / climb,
    ...(finite(health) ? { health } : {}),
  };
}

/** A climb read without trusting it (a component Lua or the wire may have broken): every number finite, every time positive. */
export function saneClimb(v: unknown): ClimbComp | undefined {
  const c = v as ClimbComp | undefined;
  if (!c || typeof c !== 'object') return undefined;
  const pts = [c.from, c.face, c.to];
  if (!pts.every((p) => p && finite(p.x) && finite(p.y))) return undefined;
  if (![c.h0, c.h1, c.rise, c.t, c.approach, c.climb, c.leave, c.cost].every(finite)) return undefined;
  if (c.approach < 0 || c.climb <= 0 || c.leave < 0 || c.t < 0 || c.cost < 0) return undefined;
  return c;
}

/** The seconds a climb takes in all. */
export const climbDuration = (c: ClimbComp): number => c.approach + c.climb + c.leave;

/** Whether the body is on the face now (not stepping to it nor off it): there the energy goes, there a fall begins. */
export const onFace = (c: ClimbComp): boolean => c.t >= c.approach && c.t < c.approach + c.climb;

/**
 * Where the body is at the climb's clock: to the foot of the face at the height it starts from, up or down the face, then onto the ground
 * beyond. `s` how far along (0-1), `z` the height of the feet (tiles), `x`, `y` in carpet space.
 */
export function climbPoint(c: ClimbComp): { x: number; y: number; z: number; s: number } {
  const lerp = (a: number, b: number, u: number) => a + (b - a) * Math.max(0, Math.min(1, u));
  const all = climbDuration(c);
  const s = all > 0 ? Math.max(0, Math.min(1, c.t / all)) : 1;
  if (c.t < c.approach) {
    const u = c.approach > 0 ? c.t / c.approach : 1;
    return { x: lerp(c.from.x, c.face.x, u), y: lerp(c.from.y, c.face.y, u), z: c.h0, s };
  }
  if (c.t < c.approach + c.climb) {
    const u = (c.t - c.approach) / c.climb;
    return { x: c.face.x, y: c.face.y, z: lerp(c.h0, c.h1, u), s };
  }
  const u = c.leave > 0 ? (c.t - c.approach - c.climb) / c.leave : 1;
  return { x: lerp(c.face.x, c.to.x, u), y: lerp(c.face.y, c.to.y, u), z: c.h1, s };
}

/** Where a body that falls off a climb ends: the foot of the face, on the low side (where it started going up, where it was going down). */
export const fallPoint = (c: ClimbComp): { x: number; y: number; z: number } => (c.rise > 0 ? { ...c.from, z: c.h0 } : { ...c.to, z: c.h1 });
