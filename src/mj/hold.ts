// How a body holds a thing (T288, ADR-0167). What a figure wields is drawn with the mesh the thing has on the ground, hung on an
// arm of the figure's rig. Every number comes from voxels, so a model written tomorrow is held by the same rules, and no table
// says how to hold this or that thing:
//
// - the hand (`handsOf`): the free end of every arm the rig finds. An arm along the side holds with its lowest voxels; an arm
//   that does not come down to the middle of the body is raised, and holds with its highest. The figure looks toward large y
//   (three's +z), so its right is small x;
// - the grip (`gripOf`): the thing's own axes, from the covariance of its voxels. A long thing is held by one end: the one that
//   does not glow, then the wooden one (warm, muted colours: wood, leather, cord), then the lighter one, then the one beside its
//   widest slice (a guard), else the lower one; with its widest slice in the middle (a bow) it is held there. A flat thing is
//   long along the axis whose ends differ most. A compact thing hangs from its top;
// - the mount (`MOUNTS`, `mountOf`): where on the body a thing goes by its place (`ItemDef.slot`), written once per mount;
// - the pose (`holdPose`): where the thing goes in the frame of the arm's pivot, turned and scaled, so that it follows the arm.
//
// Frames are three.js's, in tiles: a model's has its origin at the centre of its floor, y up, and the figure looks toward +z; an
// arm's pivot is at its joint, with the same axes when the arm hangs still; a thing's mesh has its origin at the centre of its floor.

import type { PaletteEntry, Vec3 } from './engine';
import { colorTable, type VoxelGrid } from './mesh';
import { rig } from './rig';

export type Side = 'right' | 'left';

/** An arm's hand: where the figure holds what it wields. */
export interface Hand {
  /** The arm's joint in the model's frame, as the worker puts the arm's pivot there. */
  joint: Vec3;
  /** The hand in the frame of the arm's pivot. */
  at: Vec3;
  /** Which side of the body the arm is on. */
  side: Side;
  /** Raised over the middle of the body: it holds with its top. */
  raised: boolean;
  /** Half the arm's thickness (tiles): a strapped thing stands this far out of its middle. */
  girth: number;
  /** The figure's height (tiles): nothing it holds is longer than `MAX_SHARE` of it. */
  height: number;
}

/** How a thing is held, from its voxels. */
export interface Grip {
  /** By one end (a sword, an axe, a torch), by the middle (a bow), or hanging from its top (a lantern, a sack). */
  by: 'end' | 'middle' | 'top';
  /** Where the hand takes it, in the frame of its mesh. */
  at: Vec3;
  /** From the hand toward the far end (`end`), along the thing (`middle`), up (`top`): a unit vector of the mesh frame. */
  axis: Vec3;
  /** Across it, toward its bulkier side: unit, perpendicular to `axis`. */
  width: Vec3;
  /** `axis` × `width`: the three make a right-handed frame. */
  thickness: Vec3;
  /** Its principal axes, the longest first, and how far its voxels spread along each (standard deviations, tiles). */
  axes: [Vec3, Vec3, Vec3];
  spread: [number, number, number];
  /** Its length along `axis`, and its height (tiles). */
  length: number;
  height: number;
  /** The middle of its voxels (mesh frame). */
  centre: Vec3;
}

/** Where on the body: which arm, and how the thing sits on it. */
export interface Mount {
  side: Side;
  /** `grip`: in the hand, held as its grip says; `strap`: on the forearm, its flat face outward (a shield). */
  pose: 'grip' | 'strap';
}

export type MountId = 'hand' | 'forearm';

/** The mounts, each written once. What is wielded goes in the right hand; a shield on the other forearm. */
export const MOUNTS: Readonly<Record<MountId, Mount>> = {
  hand: { side: 'right', pose: 'grip' },
  forearm: { side: 'left', pose: 'strap' },
};

/**
 * The places (`ItemDef.slot`) whose things go somewhere else than the hand when wielded: as the packs write them today (Italian, until
 * T310b moves the places with a contract) and as they will (English). Any other place, or none, is the hand.
 */
export const SLOT_MOUNTS: Readonly<Record<string, MountId>> = { scudo: 'forearm', shield: 'forearm' };

/** The mount of a thing by its place. */
export function mountOf(slot: unknown): MountId {
  const s = typeof slot === 'string' ? slot.trim().toLowerCase() : '';
  return Object.hasOwn(SLOT_MOUNTS, s) ? SLOT_MOUNTS[s] : 'hand';
}

/** The limb a mount takes: an arm with a hand on its side, else any arm with a hand; none without arms. */
export function chooseHand<T extends { hand?: Hand }>(limbs: readonly T[], side: Side): T | undefined {
  return limbs.find((l) => l.hand?.side === side) ?? limbs.find((l) => l.hand);
}

/**
 * Where a thing held by one end points, in the frame of the figure: forward, out from its side, a little down from a hand along the
 * side and a little up from a raised one. Away from the body, and long on the screen from every quarter of the camera's turn: the
 * camera looks down from 54°, and a thing pointing forward and up points at it when the figure walks toward it.
 */
export const HOLD_AIM = { forward: 0.8, outward: 0.5, rise: 0.3 } as const;
/** Nothing held is longer than this share of the body holding it: a giant model is held smaller. */
export const MAX_SHARE = 0.8;
/** What hangs from a hand keeps this far over the ground (tiles). */
const GROUND_GAP = 0.04;

// --- The hand ------------------------------------------------------------------------------------------------------------------

/** The hands of a figure: one per arm of its rig, in the order of the rig's limbs (the worker's). None for a body without arms. */
export function handsOf(g: VoxelGrid, palette: Record<string, PaletteEntry>, vpt: number): Hand[] {
  const s = 1 / vpt;
  const arms = rig({ ...g, log: [], epoch: 0 }, palette).limbs.filter((l) => l.part === 'arm');
  if (!arms.length) return [];
  const XY = g.X * g.Y;
  const colors = colorTable(g.alphabet, palette);
  let top = 0;
  let sx = 0;
  let n = 0;
  for (let i = 0; i < g.cells.length; i++) {
    if (!colors[g.cells[i]]) continue;
    top = Math.max(top, Math.floor(i / XY) + 1);
    sx += i % g.X;
    n++;
  }
  const middle = n ? sx / n : g.X / 2;
  return arms.map((l) => {
    const pts = l.cells.map((c) => [c % g.X, Math.floor(c / g.X) % g.Y, Math.floor(c / XY)] as Vec3);
    const [lo, hi] = range(pts.map((p) => p[2]));
    const raised = lo >= top / 2;
    const end = pts.filter((p) => (raised ? p[2] >= hi - 1 : p[2] <= lo + 1));
    const [hx, hy, hz] = mean(end);
    const [jx, jy, jz] = l.joint;
    const xs = pts.map((p) => p[0]);
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const [x0, x1] = range(xs);
    return {
      joint: [(jx + 0.5 - g.X / 2) * s, (jz + 0.5) * s, (jy + 0.5 - g.Y / 2) * s],
      at: [(hx - jx) * s, (hz - jz) * s, (hy - jy) * s],
      side: mx < middle ? 'right' : 'left',
      raised,
      girth: ((x1 - x0 + 1) / 2) * s,
      height: top * s,
    };
  });
}

// --- The grip ------------------------------------------------------------------------------------------------------------------

/** A colour of what hands hold: wood, leather, cord, bone darkened by use. Warm and muted, never light: not gold, skin or bread. */
export function woody(color: string | undefined): boolean {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color ?? '');
  if (!m) return false;
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d < 1e-6) return false;
  const sat = d / (1 - Math.abs(2 * l - 1));
  const hue = (((max === r ? (g - b) / d : max === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60) % 360 + 360) % 360;
  return hue >= 10 && hue <= 50 && sat >= 0.15 && sat <= 0.8 && l >= 0.08 && l <= 0.5;
}

/** A thing is long when it spreads this many times more along its first axis than along its second. */
export const LONG = 1.6;
/** What tells one end from the other: glow, wood (differences of the share of their voxels), weight (the lighter over the heavier). */
const GLOW_GAP = 0.2;
const WOOD_GAP = 0.3;
const LIGHTER = 0.85;
/** A slice is a guard (or a bow's grip) when it holds this many times the voxels of the median slice. */
const GUARD = 1.5;

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return l > 1e-12 ? scale(a, 1 / l) : [0, 1, 0];
};
/** The least and the most of a list, without spreading it into a call (a model of tomorrow may have many voxels). */
function range(list: readonly number[]): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of list) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  return [lo, hi];
}
function mean(pts: readonly Vec3[]): Vec3 {
  const m: Vec3 = [0, 0, 0];
  for (const p of pts) for (let a = 0; a < 3; a++) m[a] += p[a];
  return scale(m, 1 / Math.max(1, pts.length));
}

/**
 * The eigenvalues and unit eigenvectors of a symmetric 3 × 3 matrix (cyclic Jacobi), the largest first. Each vector has its
 * largest component positive, so the same voxels always give the same axes.
 */
export function principalAxes(m: readonly number[][]): { values: [number, number, number]; vectors: [Vec3, Vec3, Vec3] } {
  const a = m.map((r) => [...r]);
  const v = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  const size = Math.abs(a[0][0]) + Math.abs(a[1][1]) + Math.abs(a[2][2]) || 1;
  for (let sweep = 0; sweep < 50; sweep++) {
    if (a[0][1] ** 2 + a[0][2] ** 2 + a[1][2] ** 2 <= (1e-14 * size) ** 2) break;
    for (const [p, q] of [
      [0, 1],
      [0, 2],
      [1, 2],
    ]) {
      if (Math.abs(a[p][q]) <= 1e-18 * size) continue;
      const tau = (a[q][q] - a[p][p]) / (2 * a[p][q]);
      const t = (tau >= 0 ? 1 : -1) / (Math.abs(tau) + Math.sqrt(tau * tau + 1));
      const c = 1 / Math.sqrt(t * t + 1);
      const s = t * c;
      for (let k = 0; k < 3; k++) {
        const [kp, kq] = [a[k][p], a[k][q]];
        a[k][p] = c * kp - s * kq;
        a[k][q] = s * kp + c * kq;
      }
      for (let k = 0; k < 3; k++) {
        const [pk, qk] = [a[p][k], a[q][k]];
        a[p][k] = c * pk - s * qk;
        a[q][k] = s * pk + c * qk;
      }
      for (let k = 0; k < 3; k++) {
        const [kp, kq] = [v[k][p], v[k][q]];
        v[k][p] = c * kp - s * kq;
        v[k][q] = s * kp + c * kq;
      }
    }
  }
  const pairs = [0, 1, 2].map((i) => {
    let e: Vec3 = [v[0][i], v[1][i], v[2][i]];
    const big = [0, 1, 2].reduce((b, j) => (Math.abs(e[j]) > Math.abs(e[b]) + 1e-9 ? j : b), 0);
    if (e[big] < 0) e = scale(e, -1);
    return { value: a[i][i], e };
  });
  pairs.sort((x, y) => y.value - x.value);
  return { values: [pairs[0].value, pairs[1].value, pairs[2].value], vectors: [pairs[0].e, pairs[1].e, pairs[2].e] };
}

interface Voxel {
  p: Vec3;
  glow: boolean;
  wood: boolean;
}

/** How each end of a thing along an axis is: the share of its voxels that glow or are wooden, near the end; how many are near it. */
function ends(voxels: readonly Voxel[], c: Vec3, axis: Vec3, s: number) {
  const t = voxels.map((v) => dot(sub(v.p, c), axis));
  const [lo, hi] = range(t);
  const span = hi - lo;
  const near = Math.max(2 * s, 0.3 * span) - s / 2;
  const heavy = Math.max(1.5 * s, 0.2 * span) - s / 2;
  const side = (at: number, dir: number) => {
    let n = 0;
    let glow = 0;
    let wood = 0;
    let mass = 0;
    voxels.forEach((v, i) => {
      const d = (t[i] - at) * dir;
      if (d <= heavy + 1e-9) mass++;
      if (d > near + 1e-9) return;
      n++;
      if (v.glow) glow++;
      if (v.wood) wood++;
    });
    return { glow: glow / Math.max(1, n), wood: wood / Math.max(1, n), mass };
  };
  return { t, lo, hi, span, low: side(lo, 1), high: side(hi, -1) };
}

/** The grip of a thing from its voxels, or undefined if its model holds nothing visible. */
export function gripOf(g: VoxelGrid, palette: Record<string, PaletteEntry>, vpt: number): Grip | undefined {
  const s = 1 / vpt;
  const colors = colorTable(g.alphabet, palette);
  const XY = g.X * g.Y;
  const voxels: Voxel[] = [];
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < g.cells.length; i++) {
    const cell = g.cells[i];
    if (!colors[cell]) continue;
    const [x, y, z] = [i % g.X, Math.floor(i / g.X) % g.Y, Math.floor(i / XY)];
    const p: Vec3 = [(x + 0.5 - g.X / 2) * s, (z + 0.5) * s, (y + 0.5 - g.Y / 2) * s];
    for (let a = 0; a < 3; a++) {
      min[a] = Math.min(min[a], p[a] - s / 2);
      max[a] = Math.max(max[a], p[a] + s / 2);
    }
    const e = palette[g.alphabet[cell]];
    voxels.push({ p, glow: !!e?.glow, wood: woody(e?.color) });
  }
  if (!voxels.length) return undefined;
  const c = mean(voxels.map((v) => v.p));
  const cov = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (const v of voxels) {
    const d = sub(v.p, c);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cov[i][j] += (d[i] * d[j]) / voxels.length;
  }
  const { values, vectors } = principalAxes(cov);
  // A voxel spreads too, over its own side: a line of voxels is not infinitely thin.
  const spread = values.map((l) => Math.sqrt(Math.max(0, l) + (s * s) / 12)) as [number, number, number];
  const height = max[1] - min[1];
  const compact = (): Grip => ({
    by: 'top',
    at: [(min[0] + max[0]) / 2, max[1], (min[2] + max[2]) / 2],
    axis: [0, 1, 0],
    width: [0, 0, 1],
    thickness: [1, 0, 0],
    axes: vectors,
    spread,
    length: height,
    height,
    centre: c,
  });
  // Which axis is its length: the first, if it is long; for a flat thing (shears, a key) the one of the two whose ends differ most.
  let along = -1;
  if (spread[0] >= LONG * spread[1]) along = 0;
  else if (spread[2] < 0.5 * spread[1]) {
    const contrast = (i: number) => {
      const e = ends(voxels, c, vectors[i], s);
      return Math.abs(e.low.glow - e.high.glow) + Math.abs(e.low.wood - e.high.wood);
    };
    const [c0, c1] = [contrast(0), contrast(1)];
    if (Math.max(c0, c1) >= WOOD_GAP) along = c1 > c0 ? 1 : 0;
  }
  if (along < 0) return compact();
  const e = vectors[along];
  const end = ends(voxels, c, e, s);
  const { low, high } = end;
  // Which end the hand takes: +1 the low one (then the thing points toward +e), -1 the high one, 0 its middle.
  let hold = 0;
  if (Math.abs(low.glow - high.glow) >= GLOW_GAP) hold = low.glow < high.glow ? 1 : -1;
  else if (Math.abs(low.wood - high.wood) >= WOOD_GAP) hold = low.wood > high.wood ? 1 : -1;
  else if (Math.min(low.mass, high.mass) <= LIGHTER * Math.max(low.mass, high.mass)) hold = low.mass < high.mass ? 1 : -1;
  else {
    // The widest slice across the length: a guard says the hilt, a bow's grip its middle.
    const slices = new Map<number, number>();
    for (const t of end.t) {
      const k = Math.round((t - end.lo) / s);
      slices.set(k, (slices.get(k) ?? 0) + 1);
    }
    const counts = [...slices.values()].sort((a, b) => a - b);
    const median = counts[Math.floor(counts.length / 2)];
    const most = counts[counts.length - 1];
    // Where the widest slices are (a bow is thick for several of them): their middle.
    const wide = [...slices].filter(([, n]) => n >= 0.9 * most).map(([k]) => k);
    const widest = wide.reduce((a, b) => a + b, 0) / wide.length;
    const u = end.span > 0 ? (widest * s) / end.span : 0.5;
    if (most >= GUARD * median && u < 0.4) hold = 1;
    else if (most >= GUARD * median && u > 0.6) hold = -1;
    else if (most >= GUARD * median) hold = 0;
    // Nothing tells the ends apart: from below (a thing standing up), or from its low end.
    else hold = Math.abs(e[1]) >= 0.3 ? (e[1] > 0 ? 1 : -1) : 1;
  }
  let axis: Vec3 = hold === -1 ? scale(e, -1) : e;
  // Held by one end, the thing points along what the hand holds, when that is a rod: the axis of its handle (an axe's), not of its
  // whole with the head. It only straightens a lean: a near half with a guard, or with two handles side by side (shears), keeps the
  // axis of the whole.
  let base = c;
  if (hold !== 0) {
    const near = voxels.filter((v) => dot(sub(v.p, c), axis) <= 0);
    if (near.length >= 3) {
      const nc = mean(near.map((v) => v.p));
      const m = [0, 1, 2].map((i) => [0, 1, 2].map((j) => near.reduce((acc, v) => acc + (v.p[i] - nc[i]) * (v.p[j] - nc[j]), 0) / near.length));
      const own = principalAxes(m);
      const rod = own.values[0] >= 9 * Math.max(own.values[1], 1e-12) && Math.sqrt(Math.max(0, own.values[1])) <= 1.5 * s;
      if (rod && Math.abs(dot(own.vectors[0], axis)) >= Math.cos(Math.PI / 6)) {
        axis = dot(own.vectors[0], axis) < 0 ? scale(own.vectors[0], -1) : own.vectors[0];
        base = nc;
      }
    }
  }
  const [from, to] = range(voxels.map((v) => dot(sub(v.p, base), axis)));
  const length = to - from + s;
  const inset = Math.min(0.12 * length, 0.1);
  const at = hold === 0 ? add(c, scale(axis, (end.lo + end.hi) / 2)) : add(base, scale(axis, from + inset));
  // Across: the other principal axis, square to the axis, toward the bulkier side of the far half (an axe's blade).
  let width = norm(sub(vectors[along === 0 ? 1 : 0], scale(axis, dot(vectors[along === 0 ? 1 : 0], axis))));
  let lean = 0;
  for (const v of voxels) {
    const d = sub(v.p, c);
    if (hold === 0 || dot(d, axis) > 0) lean += dot(d, width);
  }
  if (lean < -1e-9) width = scale(width, -1);
  width = norm(sub(width, scale(axis, dot(width, axis))));
  return { by: hold === 0 ? 'middle' : 'end', at, axis, width, thickness: cross(axis, width), axes: vectors, spread, length, height, centre: c };
}

// --- The pose ------------------------------------------------------------------------------------------------------------------

/** Where a held thing goes, in the frame of the arm's pivot: the holder there, turned, scaled; the mesh inside it at `offset`. */
export interface Pose {
  position: Vec3;
  /** A quaternion (x, y, z, w), as three.js takes it. */
  quaternion: [number, number, number, number];
  scale: number;
  offset: Vec3;
}

/** The rotation that takes a right-handed frame (`from`) onto another (`to`), as a quaternion. */
export function turnBetween(from: readonly [Vec3, Vec3, Vec3], to: readonly [Vec3, Vec3, Vec3]): [number, number, number, number] {
  const r = [0, 1, 2].map((i) => [0, 1, 2].map((j) => to[0][i] * from[0][j] + to[1][i] * from[1][j] + to[2][i] * from[2][j]));
  const tr = r[0][0] + r[1][1] + r[2][2];
  let q: [number, number, number, number];
  if (tr > 0) {
    const k = Math.sqrt(tr + 1) * 2;
    q = [(r[2][1] - r[1][2]) / k, (r[0][2] - r[2][0]) / k, (r[1][0] - r[0][1]) / k, k / 4];
  } else if (r[0][0] > r[1][1] && r[0][0] > r[2][2]) {
    const k = Math.sqrt(1 + r[0][0] - r[1][1] - r[2][2]) * 2;
    q = [k / 4, (r[0][1] + r[1][0]) / k, (r[0][2] + r[2][0]) / k, (r[2][1] - r[1][2]) / k];
  } else if (r[1][1] > r[2][2]) {
    const k = Math.sqrt(1 + r[1][1] - r[0][0] - r[2][2]) * 2;
    q = [(r[0][1] + r[1][0]) / k, k / 4, (r[1][2] + r[2][1]) / k, (r[0][2] - r[2][0]) / k];
  } else {
    const k = Math.sqrt(1 + r[2][2] - r[0][0] - r[1][1]) * 2;
    q = [(r[0][2] + r[2][0]) / k, (r[1][2] + r[2][1]) / k, k / 4, (r[1][0] - r[0][1]) / k];
  }
  const l = Math.hypot(...q);
  return q.map((v) => v / l) as [number, number, number, number];
}

/** A vector turned by a quaternion (x, y, z, w). */
export function turn(q: readonly [number, number, number, number], v: Vec3): Vec3 {
  const [x, y, z, w] = q;
  const u: Vec3 = [x, y, z];
  const t = scale(cross(u, v), 2);
  return add(add(v, scale(t, w)), cross(u, t));
}

/** Where a thing held by one end points from `hand` (`HOLD_AIM`), a unit vector of the arm's frame. */
export function aimOf(hand: Hand): Vec3 {
  return norm([(hand.side === 'right' ? -1 : 1) * HOLD_AIM.outward, (hand.raised ? 1 : -1) * HOLD_AIM.rise, HOLD_AIM.forward]);
}

/**
 * Where a thing held with `grip` goes on `hand` by `mount`. In the hand, by one end it points as `aimOf` says, its width level and
 * its bulk forward (an axe's blade, a sword's guard: seen from above, as the camera sees); by the middle it stands up, its bulk
 * forward; from its top it hangs as it stands on the ground, small enough to stay over it. Strapped, its thinnest axis looks
 * outward, its longest up, on the forearm. Nothing is longer than `MAX_SHARE` of the body.
 */
export function holdPose(grip: Grip, mount: Mount, hand: Hand): Pose {
  const longest = Math.max(grip.length, grip.height, 2 * Math.sqrt(3) * grip.spread[0]);
  let k = Math.min(1, (MAX_SHARE * hand.height) / Math.max(longest, 1e-6));
  if (mount.pose === 'strap') {
    const out: Vec3 = [hand.side === 'right' ? -1 : 1, 0, 0];
    const [e1, , e3] = grip.axes;
    const facing: Vec3 = dot(e3, out) < 0 ? scale(e3, -1) : e3;
    const up = norm(sub(e1, scale(facing, dot(e1, facing))));
    const q = turnBetween([up, cross(facing, up), facing], [[0, 1, 0], cross(out, [0, 1, 0]), out]);
    const half = Math.sqrt(3) * grip.spread[2];
    return { position: add(scale(hand.at, 0.75), scale(out, hand.girth + k * half)), quaternion: q, scale: k, offset: scale(grip.centre, -1) };
  }
  if (grip.by === 'top') {
    // From the hand to the ground, over its height: what hangs does not go into it.
    const over = hand.joint[1] + hand.at[1] - GROUND_GAP;
    k = Math.max(0.2, Math.min(k, over / Math.max(grip.height, 1e-6)));
    return { position: [...hand.at], quaternion: [0, 0, 0, 1], scale: k, offset: scale(grip.at, -1) };
  }
  let to: [Vec3, Vec3, Vec3] = [
    [0, 1, 0],
    [0, 0, 1],
    [1, 0, 0],
  ];
  if (grip.by === 'end') {
    const aim = aimOf(hand);
    let level = norm(cross([0, 1, 0], aim));
    if (level[2] < 0) level = scale(level, -1);
    to = [aim, level, cross(aim, level)];
  }
  return { position: [...hand.at], quaternion: turnBetween([grip.axis, grip.width, grip.thickness], to), scale: k, offset: scale(grip.at, -1) };
}

/** Where a point of a held thing's mesh is, in the frame of the arm's pivot. */
export function heldPoint(pose: Pose, p: Vec3): Vec3 {
  return add(pose.position, scale(turn(pose.quaternion, add(p, pose.offset)), pose.scale));
}
