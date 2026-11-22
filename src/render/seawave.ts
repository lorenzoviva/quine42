// The sea's numbers (T451), apart from three.js and the materials (T486): the swell, where the sea moves and how much, the foam's strips as
// arrays. What a worker may run: the places' meshes are made off the page's thread (terrainmesh.ts) with these same functions, and sea.ts
// makes the materials and the meshes from them on the page.

/** The swell's waves: direction (unit, carpet x and y), wave number (radians a tile), angular speed (radians a second), height (tiles). */
export const SWELL: ReadonlyArray<{ dir: readonly [number, number]; k: number; w: number; a: number }> = [
  { dir: [0.8, 0.6], k: 0.9, w: 1.1, a: 0.026 },
  { dir: [-0.5, 0.866], k: 1.45, w: 1.7, a: 0.014 },
  { dir: [0.196, -0.981], k: 0.55, w: 0.75, a: 0.02 },
];

/** The highest the swell goes over the water's rest level (and the lowest under it). */
export const SWELL_MAX = SWELL.reduce((s, v) => s + v.a, 0);

/** The swell at a point of the carpet at time t (tiles over or under the rest level), where the sea moves fully. */
export function swellAt(x: number, z: number, t: number): number {
  let h = 0;
  for (const { dir, k, w, a } of SWELL) h += a * Math.sin((x * dir[0] + z * dir[1]) * k + t * w);
  return h;
}

/**
 * Where a point of the carpet is in each wave of the swell (radians, within a turn): computed here in double precision, so that a vertex
 * a million tiles from the origin (a planet, T449) is as still as one at it; the shaders only add the time.
 */
export function swellPhases(x: number, z: number): [number, number, number] {
  const out = SWELL.map(({ dir, k }) => {
    const p = (x * dir[0] + z * dir[1]) * k;
    return p - 2 * Math.PI * Math.floor(p / (2 * Math.PI));
  });
  return [out[0]!, out[1]!, out[2]!];
}

/** The phase of the foam's breath along a shore (radians, within a turn), in double precision as the swell's. */
export function foamPhase(x: number, z: number): number {
  const p = x * 0.71 + z * 1.37;
  return p - 2 * Math.PI * Math.floor(p / (2 * Math.PI));
}

/** The swell's phases of every vertex of a geometry (local to `origin`, carpet x and z): the `seaPhase` attribute. */
export function phaseAttribute(positions: ArrayLike<number>, origin: readonly [number, number] = [0, 0]): Float32Array {
  const n = Math.floor(positions.length / 3);
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) out.set(swellPhases(positions[i * 3]! + origin[0], positions[i * 3 + 2]! + origin[1]), i * 3);
  return out;
}

/**
 * How much the sea moves at a corner of the tiles (cx, cz), 0 or 1: 1 where the four tiles around it are water at the same level
 * (`waterTop` says the top of a water tile, undefined for anything else or what is not loaded), 0 where anything else touches it.
 */
export function cornerWeight(waterTop: (x: number, z: number) => number | undefined, cx: number, cz: number): number {
  const a = waterTop(cx - 1, cz - 1);
  if (a === undefined) return 0;
  for (const [x, z] of [[cx, cz - 1], [cx - 1, cz], [cx, cz]] as const) {
    const b = waterTop(x, z);
    if (b === undefined || Math.abs(b - a) > 1e-6) return 0;
  }
  return 1;
}

/** How much the sea moves at a point (x, z) of the carpet: its tile's corners, bilinear. */
export function seaWeight(waterTop: (x: number, z: number) => number | undefined, x: number, z: number): number {
  const x0 = Math.floor(x), z0 = Math.floor(z);
  if (waterTop(x0, z0) === undefined) return 0;
  const u = x - x0, v = z - z0;
  const w00 = cornerWeight(waterTop, x0, z0), w10 = cornerWeight(waterTop, x0 + 1, z0);
  const w01 = cornerWeight(waterTop, x0, z0 + 1), w11 = cornerWeight(waterTop, x0 + 1, z0 + 1);
  return (w00 * (1 - u) + w10 * u) * (1 - v) + (w01 * (1 - u) + w11 * u) * v;
}

/** How far the swell lifts what floats at (x, z) now: the swell where the sea moves, nothing at its still edges. */
export function seaLift(waterTop: (x: number, z: number) => number | undefined, x: number, z: number, t: number): number {
  const w = seaWeight(waterTop, x, z);
  return w > 0 ? w * swellAt(x, z, t) : 0;
}

/** The weight of every vertex of a geometry made of the water's tops (corners on whole tiles; local to `origin`), as its `wave` attribute. */
export function waveAttribute(positions: ArrayLike<number>, waterTop: (x: number, z: number) => number | undefined, origin: readonly [number, number] = [0, 0]): Float32Array {
  const n = Math.floor(positions.length / 3);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = seaWeight(waterTop, positions[i * 3]! + origin[0], positions[i * 3 + 2]! + origin[1]);
  // A vertex on the far edge of its tile reads the next tile there (u or v 0): the same corner, so the same weight.
  return out;
}

// --- The foam on the shores ---------------------------------------------------------------------------------------------------------

/** How far into the water the shore's foam reaches (tiles), and how high over the water it lies. */
export const FOAM_WIDTH = 0.38;
export const FOAM_LIFT = 0.018;

/** The foam's strips as arrays (`FoamStrips.arrays`), in the order of the attributes of its mesh. */
export interface FoamArrays {
  position: Float32Array;
  normal: Float32Array;
  seaPhase: Float32Array;
  foamPhase: Float32Array;
  foam: Float32Array;
  wave: Float32Array;
  glow: Float32Array;
  alpha: Float32Array;
}

/** The strips of foam along the shores of the water tiles, in carpet coordinates, with their `foam` and `wave` (sea.ts: `FoamBuilder`, its mesh). */
export class FoamStrips {
  pos: number[] = [];
  foam: number[] = [];
  wave: number[] = [];
  phase: number[] = [];
  breath: number[] = [];

  constructor(protected waterTop: (x: number, z: number) => number | undefined) {}

  /** The strip of the water tile (x, z) along its edge towards (dx, dz), at height y. */
  edge(x: number, z: number, dx: number, dz: number, y: number): void {
    const W = FOAM_WIDTH;
    // Two corners on the shore (foam 0), two inside (foam 1), wound to face up.
    let quad: number[][];
    if (dx === 1) quad = [[x + 1, z + 1, 0], [x + 1, z, 0], [x + 1 - W, z, 1], [x + 1 - W, z + 1, 1]];
    else if (dx === -1) quad = [[x, z, 0], [x, z + 1, 0], [x + W, z + 1, 1], [x + W, z, 1]];
    else if (dz === 1) quad = [[x, z + 1, 0], [x + 1, z + 1, 0], [x + 1, z + 1 - W, 1], [x, z + 1 - W, 1]];
    else quad = [[x + 1, z, 0], [x, z, 0], [x, z + W, 1], [x + 1, z + W, 1]];
    for (const i of [0, 1, 2, 0, 2, 3]) {
      const [px, pz, fo] = quad[i]!;
      this.pos.push(px!, y + FOAM_LIFT, pz!);
      this.phase.push(...swellPhases(px!, pz!));
      this.breath.push(foamPhase(px!, pz!));
      this.foam.push(fo!);
      this.wave.push(seaWeight(this.waterTop, Math.min(px!, x + 1 - 1e-6), Math.min(pz!, z + 1 - 1e-6)));
    }
  }

  get empty(): boolean {
    return this.pos.length === 0;
  }

  /** The strips' arrays, the vertices relative to `origin` (carpet x and z: the place's, T449), the phases from where they really are. */
  arrays(origin: readonly [number, number] = [0, 0]): FoamArrays {
    const n = this.pos.length / 3;
    return {
      position: new Float32Array(this.pos.map((v, i) => (i % 3 === 0 ? v - origin[0] : i % 3 === 2 ? v - origin[1] : v))),
      normal: new Float32Array(n * 3).map((_, i) => (i % 3 === 1 ? 1 : 0)),
      seaPhase: new Float32Array(this.phase),
      foamPhase: new Float32Array(this.breath),
      foam: new Float32Array(this.foam),
      wave: new Float32Array(this.wave),
      // Its own glow and alpha (materials.ts would add them after the first frame).
      glow: new Float32Array(n),
      alpha: new Float32Array(n).fill(1),
    };
  }
}
