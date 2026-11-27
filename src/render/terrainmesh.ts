// The mesh of a place's ground as arrays (T486, the point 3 of T331, row 13 of docs/design/terreno-3d.md § 7): what `buildChunk` made on
// the page's thread, made from what a place's mesh reads of the kernel (`ChunkSource`: its tiles, the tiles and the ground around it, the
// holes over the cellars, the palette, the colours, which terrains' models are ready) and from nothing else. So a worker makes it from a
// copy of those reads (`ChunkInput`, `chunkInput` in terrain.ts) byte for byte as the page makes it from the kernel; terrain.ts turns the
// arrays into meshes. No three.js here, nor anything that makes a material: a worker imports this.

import type { TileHole } from '../kernel/forms';
import { hash32 } from '../kernel/rng';
import { grainByte, grainOf } from '../kernel/grain';
import { coverOnTile, uncoveredKey, type CoverInstance, type CoverKind } from '../kernel/cover';
import { insetOf } from '../kernel/inset';
import { FoamStrips, phaseAttribute, waveAttribute, type FoamArrays } from './seawave';

export const WALL_H = 1.6;
/** The water drawn under the level of its tiles (the swimmer sinks under it, T438). */
export const WATER_Y = -0.18;
/** One relief level in tiles (mirrors `LEVEL` in relief.ts, kept here so the terrain worker stays lean). */
const BED_STEP = 0.25;
/** How thick the edge of a land over the void is drawn (tiles, T445): a slab, not a cliff down to nothing. */
export const VOID_SLAB = 0.9;
/** How many seeds of a terrain's model stand on its tiles. */
export const TILE_SEEDS = 3;

/**
 * Opacity of translucent swimmable water over a visible seabed as a function of depth in tiles (T480, ADR-0259):
 * reefs and coastal shallows stay clear so the bed and sunken objects read cleanly; deep sea stays richly tinted.
 */
export function waterAlpha(depth: number): number {
  if (!Number.isFinite(depth) || depth <= 0) return 0.34;
  return Math.min(0.88, 0.34 + 0.54 * (1 - Math.exp(-depth * 0.55)));
}

/** What the sides of a part add to it: a step of the relief has its line at the top and at the foot, though the depth does not jump seen from the front. */
const SIDE_PART = 128;

/** A mesh as the arrays of its attributes, in their order: what `meshGeometry` (terrain.ts) makes a geometry of, and what a worker sends. */
export interface MeshArrays {
  position: Float32Array;
  normal: Float32Array;
  color: Float32Array;
  part: Uint8Array;
  /**
   * The grain of the tops (T547, ADR-0267), four bytes a vertex: the specks' colour lit (0-255 of linear) and `grainByte` (the density and
   * the tile's salt; 0 no grain). Only where a top has one: a mesh without grain has none, as before.
   */
  grain?: Uint8Array;
}

/** Accumulates coloured boxes and quads into the arrays of one mesh (terrain.ts: `Builder`, the same with its geometry). */
export class MeshBuilder {
  pos: number[] = [];
  nor: number[] = [];
  col: number[] = [];
  /** The part of each vertex, what the cartoon's ink follows (ADR-0093). */
  prt: number[] = [];
  /** The part of what comes next (at most 127; the sides of a box are this + 128). Unsaid, a colour is a part: every change of colour gets its line. */
  fixedPart?: number;
  /** The grain of each vertex (T547), four bytes, from the first grained one on (the ones before get zeros then). */
  grn?: number[];
  /** The grain of what comes next (`MeshArrays.grain`), or none. */
  fixedGrain?: readonly number[];

  /** The grain of the vertices just pushed (`n` of them): only once something has one. */
  private grained(n: number): void {
    const g = this.fixedGrain;
    if (!g && !this.grn) return;
    this.grn ??= new Array<number>(((this.pos.length / 3) - n) * 4).fill(0);
    for (let i = 0; i < n; i++) this.grn.push(g?.[0] ?? 0, g?.[1] ?? 0, g?.[2] ?? 0, g?.[3] ?? 0);
  }

  private partOf(rgb: number[], side = false): number {
    if (this.fixedPart !== undefined) return this.fixedPart + (side ? SIDE_PART : 0);
    const [r, g, b] = rgb.map((v) => Math.round(v * 64));
    return 1 + ((r * 961 + g * 31 + b) % 255);
  }

  quad(a: number[], b: number[], c: number[], d: number[], n: number[], rgb: number[], side = false): void {
    const part = this.partOf(rgb, side);
    for (const v of [a, b, c, a, c, d]) {
      this.pos.push(v[0], v[1], v[2]);
      this.nor.push(n[0], n[1], n[2]);
      this.col.push(rgb[0], rgb[1], rgb[2]);
      this.prt.push(part);
    }
    this.grained(6);
  }

  /** An axis-aligned box from (x0, y0, z0) to (x1, y1, z1), the top lit a little more, the bottom omitted. */
  box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, rgb: number[], bottom = false): void {
    const top = rgb.map((v) => v * 1.08);
    const side = rgb.map((v) => v * 0.9);
    this.quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [0, 1, 0], top);
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], rgb, true);
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], side, true);
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], side, true);
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], side, true);
    if (bottom) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], side, true);
  }

  /** An n-sided vertical cylinder from y0 to y1 with radius r, centered at (cx, cz). */
  cylinder(cx: number, y0: number, cz: number, r: number, y1: number, rgb: number[], n = 28, top = true, bottom = false): void {
    const topCol = rgb.map((v) => v * 1.08);
    const sideCol = rgb.map((v) => v * 0.9);
    for (let i = 0; i < n; i++) {
      const a0 = (i * Math.PI * 2) / n;
      const a1 = ((i + 1) * Math.PI * 2) / n;
      const c0 = Math.cos(a0), s0 = Math.sin(a0);
      const c1 = Math.cos(a1), s1 = Math.sin(a1);
      const x0 = cx + c0 * r, z0 = cz + s0 * r;
      const x1 = cx + c1 * r, z1 = cz + s1 * r;
      const nx = (c0 + c1) / 2, nz = (s0 + s1) / 2;
      this.quad([x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0], [nx, 0, nz], sideCol, true);
      if (top) {
        for (const v of [[cx, y1, cz], [x0, y1, z0], [x1, y1, z1]]) {
          this.pos.push(v[0], v[1], v[2]);
          this.nor.push(0, 1, 0);
          this.col.push(topCol[0], topCol[1], topCol[2]);
          this.prt.push(this.partOf(topCol));
        }
        this.grained(3);
      }
      if (bottom) {
        for (const v of [[cx, y0, cz], [x1, y0, z1], [x0, y0, z0]]) {
          this.pos.push(v[0], v[1], v[2]);
          this.nor.push(0, -1, 0);
          this.col.push(sideCol[0], sideCol[1], sideCol[2]);
          this.prt.push(this.partOf(sideCol, true));
        }
        this.grained(3);
      }
    }
  }

  /** A horizontal ring at height y from r0 to r1, centered at (cx, cz). */
  ring(cx: number, y: number, cz: number, r0: number, r1: number, rgb: number[], n = 28): void {
    for (let i = 0; i < n; i++) {
      const a0 = (i * Math.PI * 2) / n;
      const a1 = ((i + 1) * Math.PI * 2) / n;
      const c0 = Math.cos(a0), s0 = Math.sin(a0);
      const c1 = Math.cos(a1), s1 = Math.sin(a1);
      const x0 = cx + c0 * r0, z0 = cz + s0 * r0;
      const x1 = cx + c1 * r0, z1 = cz + s1 * r0;
      const x2 = cx + c1 * r1, z2 = cz + s1 * r1;
      const x3 = cx + c0 * r1, z3 = cz + s0 * r1;
      this.quad([x0, y, z0], [x1, y, z1], [x2, y, z2], [x3, y, z3], [0, 1, 0], rgb);
    }
  }

  /** A flat convex polygon facing up at height y, its corners [x, z] in the order of `quad`. */
  flat(corners: number[][], y: number, rgb: number[]): void {
    for (let i = 1; i < corners.length - 1; i++) {
      for (const [x, z] of [corners[0], corners[i], corners[i + 1]]) {
        this.pos.push(x, y, z);
        this.nor.push(0, 1, 0);
        this.col.push(rgb[0], rgb[1], rgb[2]);
        this.prt.push(this.partOf(rgb));
      }
      this.grained(3);
    }
  }

  /**
   * The arrays, the vertices relative to `origin` (carpet x and z): a place's own corner (T449, the origin that moves), so that a place a million
   * tiles from the origin keeps its sixty-fourths of a tile in a float; the mesh is put there in double precision.
   */
  arrays(origin: readonly [number, number] = [0, 0]): MeshArrays {
    const [ox, oz] = origin;
    return {
      position: new Float32Array(ox || oz ? this.pos.map((v, i) => (i % 3 === 0 ? v - ox : i % 3 === 2 ? v - oz : v)) : this.pos),
      normal: new Float32Array(this.nor),
      color: new Float32Array(this.col),
      part: new Uint8Array(this.prt),
      ...(this.grn ? { grain: new Uint8Array(this.grn) } : {}),
    };
  }

  get empty(): boolean {
    return this.pos.length === 0;
  }
}

/** What a palette's terrain says to the mesh of the ground. */
export interface TerrainLook {
  layer?: string;
  color?: string;
  /** How much lower or higher its top is drawn (T548, ADR-0271): `insetOf`, read once (`terrainLook`); only of the ground one walks. */
  inset?: number;
}

/** What a palette's terrain (with its code) says to the mesh: where it is drawn, its colour, its inset as `insetOf` reads it (T548). */
export function terrainLook(t: { layer?: string; color?: string; name?: unknown; id?: unknown; solid?: unknown; inset?: unknown }, code: string): TerrainLook {
  const inset = insetOf(t, code);
  return { layer: t.layer, color: t.color, ...(inset ? { inset } : {}) };
}

/** A terrain's grain as the tops carry it (T547): the specks' colour lit, 0-255 of linear, and the density in steps (1-15). */
export type GrainLook = readonly [r: number, g: number, b: number, level: number];

/** The grain of a terrain for its tops: its colour lit by `rgb` (`rgbOf`), or none. */
export function grainLook(t: Parameters<typeof grainOf>[0], rgb: (color: string) => readonly number[]): GrainLook | undefined {
  const g = grainOf(t);
  if (!g) return undefined;
  const [r, gr, b] = rgb(g.color).map((v) => Math.min(255, Math.max(0, Math.round(v * 255))));
  return [r!, gr!, b!, grainByte(g, 0) >> 4];
}

/** What the tops of the terrain read: a tile's terrain (`palette[tileAt]`) and its ground (`groundAt`). */
export interface GroundReads {
  terrain(code: string): TerrainLook | undefined;
  /** The code of the tile at a cell of the carpet, undefined where no place is loaded (`Kernel.tileAt`). */
  tileAt(x: number, z: number): string | undefined;
  /** The height (tiles) of the ground there (`Kernel.groundAt`). */
  groundAt(x: number, z: number): number;
}

/** Everything a place's mesh reads: of the kernel on the page (`kernelSource`), of a copy of those reads in a worker (`inputSource`). */
export interface ChunkSource extends GroundReads {
  /** The side of a place (tiles), which place, its tiles row by row, the sub-cells of a hole a side (`HOLE_CELLS`). */
  S: number;
  cx: number;
  cy: number;
  tiles: string;
  cells: number;
  /** The palette's codes in its order: a terrain is a part of the ink by where it is there. */
  codes: readonly string[];
  /** The hole over a cellar at a tile of the place or of the four beside it (T52b, T415). */
  holeAt(x: number, z: number): TileHole | undefined;
  /** Whether the models of what stands on a terrain are ready (`tileForms`): asked once a code. */
  ready(code: string): boolean;
  /** A colour lit as the renderer lights it (`rgbOf`, at full). */
  rgb(color: string | undefined): readonly number[];
  /** Whether swimmable water renders translucent over a visible seabed column (T480, ADR-0259: true-relief worlds). */
  hasBed?: boolean;
  /** Height (tiles) of the solid bed at (x, z) (`Kernel.bedAt`). Required when `hasBed` is true. */
  bedAt?(x: number, z: number): number;
  /** Whether a terrain code is swimmable clear water (translucent over the seabed; lava stays opaque). */
  isClear?(code: string): boolean;
  /** Lit RGB of the top stratum of the seabed at (x, z) (`Kernel.bedStratumAt`). */
  bedTopRgb?(x: number, z: number): readonly number[];
  /** The grain of a terrain's tops (T547, ADR-0267), if it has one. */
  grain?(code: string): GrainLook | undefined;
  /** The cover of a terrain (T545, ADR-0269): its kinds as it says them (`coverOf`); none where it has none. */
  cover?(code: string): readonly CoverKind[] | undefined;
  /** How many seeds of a cover's program there are once all of them are ready (`Forms.seedsOf`); 0 while they are not. */
  coverSeeds?(model: string): number;
  /** Whether no cover grows on a tile of the place, by its index there (a lot, a path, a solid thing on it: `Kernel.coverMask`). */
  bare?(i: number): boolean;
  /** The instances of the place that became things of the world (`ChunkPlan.uncovered`), by `uncoveredKey`: not drawn as cover. */
  uncovered?: ReadonlySet<string>;
  /** Number of strata rows at (x, z) (`Kernel.strataRowsAt`). */
  strataRowsAt?(x: number, z: number): number;
  /** Lit RGB of stratum row `row` (0-based from ground down) at (x, z). */
  stratumRgbAt?(x: number, z: number, row: number): readonly number[];
}

/** How far over the relief a tile's top is drawn: the water lower, a floor a little higher, the ground by its inset (T548, only how it looks). */
export const groundY = (t: TerrainLook | undefined) => (t?.layer === 'liquid' ? WATER_Y : t?.layer === 'floor' ? 0.02 : t?.layer === 'ground' ? (t.inset ?? 0) : 0);

/**
 * The tops of the terrain as the chunks draw them (T52b, T415): the relief, the water a little lower, a floor a little higher, and over a
 * cellar the hole, on the whole tile or on its sub-cells (`N` a side). `holeAt`: the hole of a tile, if any.
 */
export function terrainTops(src: GroundReads, holeAt: (x: number, z: number) => TileHole | undefined, N: number) {
  const tile = (col: number, row: number) => src.terrain(src.tileAt(col, row) ?? '');
  const ground0 = (x: number, z: number) => {
    const h = holeAt(x, z);
    return src.groundAt(x, z) - (h && !h.cover ? h.depth : 0);
  };
  const top = (x: number, z: number) => ground0(x, z) + groundY(tile(x, z));
  /** The top of a tile at one of its sub-cells (s along x, t along z). */
  const subTop = (x: number, z: number, s: number, t: number) => {
    const h = holeAt(x, z);
    return h?.cover?.[t * N + s] ? src.groundAt(x, z) - h.depth + groundY(tile(x, z)) : top(x, z);
  };
  return { tile, ground0, top, subTop };
}

/** A side facing (dx, dz) on the plane `p`, from `a` to `e` along it, from `y` down to `ny`; wound counter-clockwise seen from outside, like the boxes. */
export function sideQuad(b: MeshBuilder, dx: number, dz: number, p: number, a: number, e: number, y: number, ny: number, rgb: number[]): void {
  if (dx === 1) b.quad([p, y, e], [p, ny, e], [p, ny, a], [p, y, a], [1, 0, 0], rgb, true);
  if (dx === -1) b.quad([p, y, a], [p, ny, a], [p, ny, e], [p, y, e], [-1, 0, 0], rgb, true);
  if (dz === 1) b.quad([a, y, p], [a, ny, p], [e, ny, p], [e, y, p], [0, 0, 1], rgb, true);
  if (dz === -1) b.quad([e, y, p], [e, ny, p], [a, ny, p], [a, y, p], [0, 0, -1], rgb, true);
}

/** The colours the mesh of a place uses besides its terrains': the earth of the banks down to the water, the trunks of the stand-in trees. */
export const BANK = '#735638';
export const TRUNK = '#6b4a2e';

/** A tree in voxel style on ground at height y: trunk and three shrinking layers of foliage, size and colour varied per tile. */
function standInTree(b: MeshBuilder, x: number, y: number, z: number, h: number, rgb: number[], trunk: number[]): void {
  const s = 0.75 + (h % 7) / 20;
  const cx = x + 0.5 + ((h >> 3) % 5) / 25 - 0.08, cz = z + 0.5 + ((h >> 6) % 5) / 25 - 0.08;
  b.box(cx - 0.08, y, cz - 0.08, cx + 0.08, y + 0.6 * s, cz + 0.08, trunk);
  const leaf = rgb.map((v, i) => v * (0.9 + ((h >> (9 + i)) % 3) * 0.08));
  [[0.45, 0.4, 0.75], [0.35, 0.95, 0.6], [0.22, 1.4, 0.5]].forEach(([r, y0, hh]) => b.box(cx - r * s, y + y0 * s, cz - r * s, cx + r * s, y + (y0 + hh) * s, cz + r * s, leaf));
}

function standInRock(b: MeshBuilder, x: number, y: number, z: number, h: number, rgb: number[]): void {
  const hh = 0.35 + (h % 5) / 10;
  const w = 0.36 + ((h >> 4) % 3) / 20;
  b.box(x + 0.5 - w, y, z + 0.5 - w, x + 0.5 + w, y + hh, z + 0.5 + w * 0.9, rgb);
  b.box(x + 0.5 - w * 0.6, y + hh, z + 0.5 - w * 0.5, x + 0.5 + w * 0.5, y + hh + 0.15, z + 0.5 + w * 0.4, rgb.map((v) => v * 1.06));
}

/** A model standing on a tile (a tree on a wood, a boulder on rock): which terrain's, which of its seeds, where, how turned and how big. */
export interface TileInstance {
  code: string;
  seed: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  scale: number;
}

/**
 * The cover of a place as arrays (T545, ADR-0269): its forms (`model#seed`), which one each instance is, and five numbers an instance: x, the
 * height, z (relative to the place's corner, as its mesh), the turn and the scale. Not drawn by the place: the renderer gathers the cover of
 * every place loaded in one InstancedMesh a form (`src/render/cover.ts`).
 */
export interface CoverArrays {
  forms: string[];
  form: Uint16Array;
  data: Float32Array;
}

/** The numbers of an instance in `CoverArrays.data`. */
export const COVER_STRIDE = 5;

/** A place's ground as arrays: the terrain, the solid things (walls, stand-ins), the water with its swell, the foam, the models on its tiles. */
export interface ChunkArrays {
  ground: MeshArrays;
  solid?: MeshArrays;
  water?: MeshArrays & { wave: Float32Array; seaPhase: Float32Array };
  /** Translucent waving surface of swimmable water over a visible seabed in true-relief worlds (T480, ADR-0259). */
  clearWater?: MeshArrays & { wave: Float32Array; seaPhase: Float32Array; alpha: Float32Array };
  foam?: FoamArrays;
  /** In the order they were placed (terrain.ts groups them by form in that order). */
  instances: TileInstance[];
  /** Its cover (T545), if any of its tiles has one. */
  cover?: CoverArrays;
}

/**
 * The ground of a place, chunk by chunk, in carpet coordinates (x → three x, y → three z, one tile = one unit), relative to its corner.
 * The plan's tiles are still the ground: colour per terrain, each tile a column as high as the relief (ADR-0048) with its sides where a
 * neighbour is lower, water lower than the land with earthen banks, walls extruded, doors as an opening under a lintel. What stands on a
 * tile (trees on woods, boulders on rock) is the terrain's model (`TerrainDef.model`), a few seeds of it as instances, turned and shifted; a
 * stand-in until the model is ready.
 */
export function chunkArrays(src: ChunkSource): ChunkArrays {
  const S = src.S;
  const ground = new MeshBuilder();
  const solid = new MeshBuilder();
  // The water's tops in a mesh of their own, which the swell moves (T451), and the foam along its shores.
  const water = new MeshBuilder();
  // In true-relief worlds (T480, ADR-0259), swimmable water is drawn translucent in `clearWater` over the opaque seabed column in `ground`.
  const hasBed = !!src.hasBed;
  const clearWater = new MeshBuilder();
  const clearAlpha: number[] = [];
  const waterTop = (x: number, z: number) => (src.terrain(src.tileAt(x, z) ?? '')?.layer === 'liquid' ? src.groundAt(x, z) + WATER_Y : undefined);
  const foam = new FoamStrips(waterTop);
  const X0 = src.cx * S, Z0 = src.cy * S;
  const lit = (c: string | undefined, k = 1) => src.rgb(c).map((v) => v * k);
  // Instances of the terrains' models: where, how turned, how big.
  const instances: TileInstance[] = [];
  const ready = new Map<string, boolean>();
  // The cover (T545, ADR-0269): each terrain's kinds whose programs are ready, asked once a code; the instances by form, as they come.
  const coverKinds = new Map<string, readonly CoverKind[] | undefined>();
  const coverSeeds = new Map<string, number>();
  const seedsOf = (model: string) => {
    let n = coverSeeds.get(model);
    if (n === undefined) coverSeeds.set(model, (n = Math.max(0, Math.floor(src.coverSeeds?.(model) ?? 0))));
    return n;
  };
  const kindsOf = (code: string) => {
    if (!coverKinds.has(code)) {
      const said = src.cover?.(code)?.filter((k) => seedsOf(k.model) > 0);
      coverKinds.set(code, said?.length ? said : undefined);
    }
    return coverKinds.get(code);
  };
  const coverForms: string[] = [];
  const coverIndex = new Map<string, number>();
  const coverForm: number[] = [];
  const coverData: number[] = [];
  const onTile: CoverInstance[] = [];
  // The grain of each terrain's tops (T547), asked once a code.
  const grains = new Map<string, GrainLook | undefined>();
  const grainAt = (code: string, h: number): readonly number[] | undefined => {
    if (!src.grain) return undefined;
    if (!grains.has(code)) grains.set(code, src.grain(code));
    const g = grains.get(code);
    return g && [g[0], g[1], g[2], (g[3] << 4) | ((h >>> 20) & 15)];
  };
  // Where a model has its cellar the terrain goes down to the cellar's bottom (T52b, the hole): its banks are the hole's sides.
  // A tile only partly over the cellar (T415) goes down only on its sub-cells over the hole, with sides where they meet the rest.
  const holeAt = (x: number, z: number) => src.holeAt(x, z);
  const N = src.cells;
  const { tile, ground0, top, subTop } = terrainTops(src, holeAt, N);
  const isClear = (code: string | undefined) => hasBed && !!code && src.terrain(code)?.layer === 'liquid' && !!src.isClear?.(code);
  /** Top of the solid column at (x, z): seabed height (at least one level below surface) under clear water, else `top`. */
  const colTop = (x: number, z: number) => {
    const c = src.tileAt(x, z);
    if (isClear(c) && src.bedAt) return Math.min(src.bedAt(x, z), ground0(x, z) - BED_STEP);
    return top(x, z);
  };
  /** Smooth per-corner water opacity averaged across adjacent clear-water tiles so depth transitions have no tile seams. */
  const cornerAlpha = (vx: number, vz: number, fallback: number): number => {
    let sum = 0, cnt = 0;
    for (const [ox, oz] of [[0, 0], [-1, 0], [0, -1], [-1, -1]] as const) {
      const tx = vx + ox, tz = vz + oz;
      if (isClear(src.tileAt(tx, tz))) {
        sum += waterAlpha(Math.max(0, ground0(tx, tz) + WATER_Y - colTop(tx, tz)));
        cnt++;
      }
    }
    return cnt ? sum / cnt : fallback;
  };
  const side = (dx: number, dz: number, p: number, a: number, b: number, y: number, ny: number, rgb: number[]) => sideQuad(ground, dx, dz, p, a, b, y, ny, rgb);
  /** Vertical underwater bank or seabed drop drawn in bands of the column's strata (T480). */
  const strataSideIn = (x: number, z: number, dx: number, dz: number, p: number, a: number, b: number, yTop: number, yBot: number, g: number, shade: number) => {
    const rows = src.strataRowsAt?.(x, z) ?? 0;
    if (rows <= 0 || !src.stratumRgbAt) {
      side(dx, dz, p, a, b, yTop, yBot, lit(BANK, shade));
      return;
    }
    for (let cur = yTop; cur > yBot; ) {
      const row = Math.min(rows - 1, Math.max(0, Math.floor(g - cur + 1e-6)));
      const bottom = row >= rows - 1 ? yBot : Math.max(yBot, g - row - 1);
      side(dx, dz, p, a, b, cur, bottom, src.stratumRgbAt(x, z, row).map((v) => v * shade));
      cur = bottom;
    }
  };
  /**
   * The sides of a tile towards a neighbour when one of the two is only partly over a cellar (T415): sub-cell by sub-cell
   * along the edge, where this tile's is higher than the neighbour's next to it; a run of the same heights is one quad.
   */
  const subSides = (x: number, z: number, dx: number, dz: number, earth: number[]) => {
    const mine = (j: number) => (dx === 1 ? subTop(x, z, N - 1, j) : dx === -1 ? subTop(x, z, 0, j) : dz === 1 ? subTop(x, z, j, N - 1) : subTop(x, z, j, 0));
    const theirs = (j: number) =>
      dx === 1 ? subTop(x + 1, z, 0, j) : dx === -1 ? subTop(x - 1, z, N - 1, j) : dz === 1 ? subTop(x, z + 1, j, 0) : subTop(x, z - 1, j, N - 1);
    const p = dx === 1 ? x + 1 : dx === -1 ? x : dz === 1 ? z + 1 : z;
    const o = dx ? z : x;
    for (let j = 0; j < N; ) {
      const y = mine(j), ny = theirs(j);
      let e = j + 1;
      while (e < N && mine(e) === y && theirs(e) === ny) e++;
      if (ny < y) side(dx, dz, p, o + j / N, o + e / N, y, ny, earth);
      j = e;
    }
  };
  /** A tile partly over a cellar (T415): its top sub-cell by sub-cell (a run of a row is one quad), and the sides inside it. */
  const partTile = (x: number, z: number, base: number[]) => {
    const H = (s: number, t: number) => subTop(x, z, s, t);
    const earth = base.map((v) => v * 0.72);
    for (let t = 0; t < N; t++)
      for (let s = 0; s < N; ) {
        const y = H(s, t);
        let e = s + 1;
        while (e < N && H(e, t) === y) e++;
        const x0 = x + s / N, x1 = x + e / N, z0 = z + t / N, z1 = z + (t + 1) / N;
        ground.quad([x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0], [0, 1, 0], base);
        s = e;
      }
    // Between two sub-cells of different heights the higher one has the side: no grain on a side.
    const grain = ground.fixedGrain;
    ground.fixedGrain = undefined;
    for (let t = 0; t < N; t++)
      for (let s = 0; s + 1 < N; s++) {
        const a = H(s, t), b = H(s + 1, t), p = x + (s + 1) / N, z0 = z + t / N, z1 = z + (t + 1) / N;
        if (b < a) side(1, 0, p, z0, z1, a, b, earth);
        else if (a < b) side(-1, 0, p, z0, z1, b, a, earth);
      }
    for (let s = 0; s < N; s++)
      for (let t = 0; t + 1 < N; t++) {
        const a = H(s, t), b = H(s, t + 1), p = z + (t + 1) / N, x0 = x + s / N, x1 = x + (s + 1) / N;
        if (b < a) side(0, 1, p, x0, x1, a, b, earth);
        else if (a < b) side(0, -1, p, x0, x1, b, a, earth);
      }
    ground.fixedGrain = grain;
  };
  // A terrain is a part (its code), so the ink follows where one meets another and never the tiles of one.
  const terrainPart = new Map(src.codes.map((code, i) => [code, 1 + (i % (SIDE_PART - 1))]));
  const place = (code: string, x: number, y: number, z: number, h: number, every: number): boolean => {
    let ok = ready.get(code);
    if (ok === undefined) ready.set(code, (ok = src.ready(code)));
    if (!ok) return false;
    // Trees are two tiles wide: one every other tile is a wood; rocks one a tile.
    if (every > 1 && (x + z) % every !== 0) return true;
    const jitter = every > 1 ? 0.35 : 0.12;
    instances.push({
      code,
      seed: h % TILE_SEEDS,
      x: x + 0.5 + (((h >> 4) % 100) / 100 - 0.5) * jitter,
      y,
      z: z + 0.5 + (((h >> 11) % 100) / 100 - 0.5) * jitter,
      yaw: ((h >> 7) % 628) / 100,
      scale: 0.85 + ((h >> 13) % 25) / 100,
    });
    return true;
  };
  for (let r = 0; r < S; r++)
    for (let c = 0; c < S; c++) {
      const code = src.tiles[r * S + c];
      const t = src.terrain(code) ?? src.terrain('?');
      // The void (T445): no ground at all; the stars show through, and the land beside it has its edge.
      if (t?.layer === 'void') continue;
      const x = X0 + c, z = Z0 + r;
      const h = hash32(x, z, 77);
      const g0 = ground0(x, z);
      const y = g0 + groundY(t);
      const k0 = 0.92 + (h % 13) / 100;
      const base = lit(t?.color, k0);
      ground.fixedPart = terrainPart.get(code) ?? 0;
      solid.fixedPart = undefined;
      const holed = holeAt(x, z);
      const selfClear = isClear(code);
      // The tops of a grained terrain carry its specks (T547): the sides, the water, the walls none.
      ground.fixedGrain = t?.layer === 'ground' ? grainAt(code, h) : undefined;
      if (holed?.cover) partTile(x, z, base);
      else if (selfClear) {
        const by = colTop(x, z);
        const bedRgb = (src.bedTopRgb?.(x, z) ?? src.rgb(BANK)).map((v) => v * k0);
        ground.quad([x, by, z], [x, by, z + 1], [x + 1, by, z + 1], [x + 1, by, z], [0, 1, 0], bedRgb);
        clearWater.fixedPart = ground.fixedPart;
        clearWater.quad([x, y, z], [x, y, z + 1], [x + 1, y, z + 1], [x + 1, y, z], [0, 1, 0], base);
        const fb = waterAlpha(Math.max(0, y - by));
        const aa = cornerAlpha(x, z, fb), ab = cornerAlpha(x, z + 1, fb), ac = cornerAlpha(x + 1, z + 1, fb), ad = cornerAlpha(x + 1, z, fb);
        clearAlpha.push(aa, ab, ac, aa, ac, ad);
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const n = tile(x + dx, z + dz);
          if (n && n.layer !== 'liquid' && top(x + dx, z + dz) >= y - 1e-6) foam.edge(x, z, dx, dz, y);
        }
      } else if (t?.layer === 'liquid') {
        water.fixedPart = ground.fixedPart;
        water.quad([x, y, z], [x, y, z + 1], [x + 1, y, z + 1], [x + 1, y, z], [0, 1, 0], base);
        // Foam where the water meets what stands at its level or higher and is not water: a shore, a quay, a rock.
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const n = tile(x + dx, z + dz);
          if (n && n.layer !== 'liquid' && top(x + dx, z + dz) >= y - 1e-6) foam.edge(x, z, dx, dz, y);
        }
      } else ground.quad([x, y, z], [x, y, z + 1], [x + 1, y, z + 1], [x + 1, y, z], [0, 1, 0], base);
      ground.fixedGrain = undefined;
      // Sides where this tile is higher than its neighbour: the slope of a hill in its own colour, darker,
      // banks of earth down to the water, and in true-relief worlds strata bands under the water surface (T480).
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, nz = z + dz;
        const n = tile(nx, nz);
        // Over the void the edge of the land is a slab with its thickness (T445), darker underneath than a bank.
        const edge = n?.layer === 'void';
        if (!hasBed) {
          const earth = edge ? base.map((v) => v * 0.5) : n?.layer === 'liquid' && t?.layer !== 'liquid' ? lit(BANK) : base.map((v) => v * 0.72);
          if (!edge && (holed?.cover || holeAt(nx, nz)?.cover)) {
            subSides(x, z, dx, dz, earth);
            continue;
          }
          const ny = edge ? y - VOID_SLAB : top(nx, nz);
          if (ny >= y) continue;
          side(dx, dz, dx === 1 ? x + 1 : dx === -1 ? x : dz === 1 ? z + 1 : z, dx ? z : x, dx ? z + 1 : x + 1, y, ny, earth);
          continue;
        }
        const nClear = isClear(src.tileAt(nx, nz));
        const myTop = selfClear ? colTop(x, z) : y;
        const p = dx === 1 ? x + 1 : dx === -1 ? x : dz === 1 ? z + 1 : z;
        const a = dx ? z : x, b = dx ? z + 1 : x + 1;
        if (selfClear && !edge) {
          const nSurf = top(nx, nz);
          if (nSurf < y - 1e-6) {
            const bot = Math.max(nSurf, myTop);
            if (bot < y) {
              clearWater.fixedPart = ground.fixedPart;
              sideQuad(clearWater, dx, dz, p, a, b, y, bot, base);
              const fa = waterAlpha(Math.max(0, y - myTop));
              for (let k = 0; k < 6; k++) clearAlpha.push(fa);
            }
          }
        }
        const ny = edge ? myTop - VOID_SLAB : colTop(nx, nz);
        if (ny >= myTop) continue;
        if (selfClear) {
          strataSideIn(x, z, dx, dz, p, a, b, myTop, ny, g0, 0.78);
        } else if (nClear) {
          const wy = ground0(nx, nz) + WATER_Y;
          if (holed?.cover) subSides(x, z, dx, dz, lit(BANK));
          else if (myTop > wy) side(dx, dz, p, a, b, myTop, Math.max(ny, wy), lit(BANK));
          const subTopY = Math.min(myTop, wy);
          if (subTopY > ny) strataSideIn(x, z, dx, dz, p, a, b, subTopY, ny, g0, 0.78);
        } else {
          const earth = edge ? base.map((v) => v * 0.5) : n?.layer === 'liquid' && t?.layer !== 'liquid' ? lit(BANK) : base.map((v) => v * 0.72);
          if (!edge && (holed?.cover || holeAt(nx, nz)?.cover)) subSides(x, z, dx, dz, earth);
          else side(dx, dz, p, a, b, myTop, ny, earth);
        }
      }
      // What grows on it (T545): never over a cellar, on a lot, a path or under a solid thing (`bare`), nor what became a thing of the world.
      const kinds = !holed ? kindsOf(code) : undefined;
      if (kinds && !src.bare?.(r * S + c)) {
        onTile.length = 0;
        for (const i of coverOnTile(kinds, x, z, seedsOf, onTile)) {
          if (src.uncovered?.has(uncoveredKey(r * S + c, i.model, i.n))) continue;
          const key = `${i.model}#${i.seed}`;
          let f = coverIndex.get(key);
          if (f === undefined) {
            coverIndex.set(key, (f = coverForms.length));
            coverForms.push(key);
          }
          coverForm.push(f);
          coverData.push(i.x - X0, y, i.y - Z0, i.yaw, i.scale);
        }
      }
      switch (t?.layer) {
        case 'wall':
          solid.fixedPart = ground.fixedPart;
          solid.box(x, g0, z, x + 1, g0 + WALL_H, z + 1, lit(t.color, 0.95 + (h % 7) / 100));
          break;
        case 'door':
          // An opening: posts at the sides where walls continue, a lintel above.
          solid.fixedPart = ground.fixedPart;
          solid.box(x, g0 + WALL_H - 0.35, z, x + 1, g0 + WALL_H, z + 1, lit(t.color, 0.8));
          break;
        case 'vegetation':
          // Nothing grows over a cellar (T415): the hole is the cellar's.
          if (!holed && !place(code, x, y, z, h, 2)) standInTree(solid, x, y, z, h, lit(t.color), lit(TRUNK));
          break;
        case 'rock':
          if (!holed && !place(code, x, y, z, h, 1)) standInRock(solid, x, y, z, h, lit(t.color));
          break;
      }
    }
  // Everything of the place relative to its corner (T449): the group stands there, in double precision.
  const origin = [X0, Z0] as const;
  const out: ChunkArrays = { ground: ground.arrays(origin), instances };
  if (coverForm.length) out.cover = { forms: coverForms, form: new Uint16Array(coverForm), data: new Float32Array(coverData) };
  if (!solid.empty) out.solid = solid.arrays(origin);
  if (!water.empty) {
    const w = water.arrays(origin);
    out.water = { ...w, wave: waveAttribute(w.position, waterTop, origin), seaPhase: phaseAttribute(w.position, origin) };
  }
  if (!clearWater.empty) {
    const cw = clearWater.arrays(origin);
    out.clearWater = { ...cw, wave: waveAttribute(cw.position, waterTop, origin), seaPhase: phaseAttribute(cw.position, origin), alpha: new Float32Array(clearAlpha) };
  }
  if (!foam.empty) out.foam = foam.arrays(origin);
  return out;
}

// --- In a worker ------------------------------------------------------------------------------------------------------------------------

/**
 * How far beyond a place's edges its mesh reads the tiles and the ground: its banks and walls the tile beside, its foam the corners of the
 * tiles around, its waves (`seaWeight`) the corners of the tiles of its far edge, two tiles out (weighed by nothing at a vertex on the edge,
 * but read: in the window every read is the kernel's, `tests/terreno-worker.test.ts`).
 */
export const CHUNK_MARGIN = 2;

/** What a place's mesh reads, as plain data: the copy a worker makes it from (`chunkInput` in terrain.ts makes it of the kernel). */
export interface ChunkInput {
  S: number;
  cx: number;
  cy: number;
  tiles: string;
  cells: number;
  /** The palette in its order: each code with what the mesh reads of its terrain (its grain, T547; its cover, T545; its inset, T548). */
  palette: Array<[code: string, layer: string | undefined, color: string | undefined, grain?: GrainLook, cover?: CoverKind[], inset?: number]>;
  /** The colours lit (`rgbOf`), by colour; '' for a terrain without one. */
  rgb: Record<string, number[]>;
  /** The window of tiles around the place (`CHUNK_MARGIN` beyond its edges): its corner, its side, the codes ('' where nothing is loaded) and the ground. */
  x0: number;
  z0: number;
  w: number;
  codes: string[];
  ground: Float64Array;
  /** The holes over cellars in the window, of the place and of the four beside it: the tile of the window, how deep, the sub-cells. */
  holes: Array<[at: number, depth: number, cover: Uint8Array | undefined]>;
  /** The terrains whose models are ready (`tileForms`). */
  ready: string[];
  /** The programs of the covers whose seeds are all ready, with how many (T545). */
  coverSeeds?: Array<[model: string, seeds: number]>;
  /** The tiles of the place where no cover grows (`Kernel.coverMask`), 1 a tile; and the instances that became things (`uncoveredKey`). */
  bare?: Uint8Array;
  uncovered?: string[];
  /** Seabed data for true-relief worlds (T480, ADR-0259); omitted when `!hasBed`. */
  hasBed?: boolean;
  clear?: string[];
  bed?: Float64Array;
  bedTop?: string[];
  strataRows?: Uint8Array;
  strataHex?: string[][];
}

/**
 * The reads of a place's mesh from its copy. Off the window it says nothing it was not given: no tile and a ground of NaN, which a test
 * (`tests/terreno-worker.test.ts`) would see as a mesh that is not the page's.
 */
export function inputSource(input: ChunkInput): ChunkSource {
  const { x0, z0, w } = input;
  const at = (x: number, z: number) => (x >= x0 && z >= z0 && x < x0 + w && z < z0 + w ? (z - z0) * w + (x - x0) : -1);
  const terrains = new Map<string, TerrainLook>(input.palette.map(([code, layer, color, , , inset]) => [code, inset ? { layer, color, inset } : { layer, color }]));
  const grains = new Map(input.palette.flatMap(([code, , , grain]) => (grain ? [[code, grain] as const] : [])));
  const covers = new Map(input.palette.flatMap(([code, , , , cover]) => (cover?.length ? [[code, cover] as const] : [])));
  const coverSeeds = new Map(input.coverSeeds ?? []);
  const bare = input.bare;
  const holes = new Map<number, TileHole>(input.holes.map(([i, depth, cover]) => [i, cover ? { depth, cover } : { depth }]));
  const ready = new Set(input.ready);
  const clearSet = input.clear ? new Set(input.clear) : undefined;
  const none = [NaN, NaN, NaN];
  return {
    S: input.S,
    cx: input.cx,
    cy: input.cy,
    tiles: input.tiles,
    cells: input.cells,
    codes: input.palette.map(([code]) => code),
    terrain: (code) => terrains.get(code),
    tileAt: (x, z) => {
      const i = at(x, z);
      return i < 0 ? undefined : input.codes[i] || undefined;
    },
    groundAt: (x, z) => {
      const i = at(x, z);
      return i < 0 ? NaN : input.ground[i]!;
    },
    holeAt: (x, z) => {
      const i = at(x, z);
      return i < 0 ? undefined : holes.get(i);
    },
    ready: (code) => ready.has(code),
    rgb: (color) => input.rgb[color || ''] ?? none,
    ...(grains.size ? { grain: (code: string) => grains.get(code) } : {}),
    ...(covers.size
      ? {
          cover: (code: string) => covers.get(code),
          coverSeeds: (model: string) => coverSeeds.get(model) ?? 0,
          ...(bare ? { bare: (i: number) => bare[i] === 1 } : {}),
          ...(input.uncovered?.length ? { uncovered: new Set(input.uncovered) } : {}),
        }
      : {}),
    ...(input.hasBed
      ? {
          hasBed: true,
          bedAt: (x: number, z: number) => {
            const i = at(x, z);
            return i < 0 || !input.bed ? NaN : input.bed[i]!;
          },
          isClear: (code: string) => !!clearSet?.has(code),
          bedTopRgb: (x: number, z: number) => {
            const i = at(x, z);
            return i < 0 || !input.bedTop ? none : (input.rgb[input.bedTop[i]!] ?? none);
          },
          strataRowsAt: (x: number, z: number) => {
            const i = at(x, z);
            return i < 0 || !input.strataRows ? 0 : input.strataRows[i]!;
          },
          stratumRgbAt: (x: number, z: number, row: number) => {
            const i = at(x, z);
            const hex = i >= 0 ? input.strataHex?.[i]?.[row] : undefined;
            return hex !== undefined ? (input.rgb[hex] ?? none) : none;
          },
        }
      : {}),
  };
}

/** A worker's answer: the arrays of a place's mesh, or why not. */
export type ChunkAnswer = { id: number; ok: true; arrays: ChunkArrays } | { id: number; ok: false; error: string };

/** The buffers of a place's arrays, to give them to the page without copying them. */
export function chunkBuffers(a: ChunkArrays): ArrayBuffer[] {
  const out: ArrayBuffer[] = [];
  const add = (...xs: Array<Float32Array | Uint8Array | Uint16Array>) => {
    for (const x of xs) out.push(x.buffer as ArrayBuffer);
  };
  for (const m of [a.ground, a.solid, a.water, a.clearWater]) if (m) add(m.position, m.normal, m.color, m.part, ...(m.grain ? [m.grain] : []));
  if (a.water) add(a.water.wave, a.water.seaPhase);
  if (a.clearWater) add(a.clearWater.wave, a.clearWater.seaPhase, a.clearWater.alpha);
  if (a.cover) add(a.cover.form, a.cover.data);
  if (a.foam) add(a.foam.position, a.foam.normal, a.foam.seaPhase, a.foam.foamPhase, a.foam.foam, a.foam.wave, a.foam.glow, a.foam.alpha);
  return out;
}

/** What the worker does with a place (terrainworker.ts): its arrays from its copy, and their buffers to give back. */
export function answerChunk(id: number, input: ChunkInput): { answer: ChunkAnswer; transfer: ArrayBuffer[] } {
  try {
    const arrays = chunkArrays(inputSource(input));
    return { answer: { id, ok: true, arrays }, transfer: chunkBuffers(arrays) };
  } catch (e) {
    return { answer: { id, ok: false, error: e instanceof Error ? e.message : String(e) }, transfer: [] };
  }
}
