// The ground of the simulation, chunk by chunk, in carpet coordinates (x → three x, y → three z, one
// tile = one unit). The plan's tiles are still the ground: colour per terrain, each tile a column as high
// as the relief (ADR-0048) with its sides where a neighbour is lower, water lower than the land with
// earthen banks, walls extruded, doors as an opening under a lintel. What stands on a tile
// (trees on woods, boulders on rock) is the terrain's model (`TerrainDef.model`), a few seeds of it as
// instances, turned and shifted; a stand-in until the model is ready. Buildings are no longer tiles: each
// is a structure, a model on its lot (ADR-0043), drawn with the entities.

import * as THREE from 'three';
import type { Chunk, Kernel } from '../kernel/kernel';
import { hash32 } from '../kernel/rng';
import type { TerrainDef } from '../kernel/types';
import { TERRAIN_THING } from './cartoon';
import { casts, MAT, rgbOf } from './materials';
import { geoOf, modelMaterials, type ModelGeo } from './models';
import { HOLE_CELLS, type Form, type TileHole } from '../kernel/forms';

export const WALL_H = 1.6;
const WATER_Y = -0.18;

/** What the sides of a part add to it: a step of the relief has its line at the top and at the foot, though the depth does not jump seen from the front. */
const SIDE_PART = 128;

/** Accumulates coloured boxes and quads into one geometry. */
export class Builder {
  pos: number[] = [];
  nor: number[] = [];
  col: number[] = [];
  /** The part of each vertex, what the cartoon's ink follows (ADR-0093). */
  prt: number[] = [];
  /** The part of what comes next (at most 127; the sides of a box are this + 128). Unsaid, a colour is a part: every change of colour gets its line. */
  fixedPart?: number;

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
      }
      if (bottom) {
        for (const v of [[cx, y0, cz], [x1, y0, z1], [x0, y0, z0]]) {
          this.pos.push(v[0], v[1], v[2]);
          this.nor.push(0, -1, 0);
          this.col.push(sideCol[0], sideCol[1], sideCol[2]);
          this.prt.push(this.partOf(sideCol, true));
        }
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
    for (let i = 1; i < corners.length - 1; i++)
      for (const [x, z] of [corners[0], corners[i], corners[i + 1]]) {
        this.pos.push(x, y, z);
        this.nor.push(0, 1, 0);
        this.col.push(rgb[0], rgb[1], rgb[2]);
        this.prt.push(this.partOf(rgb));
      }
  }

  geometry(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('part', new THREE.Uint8BufferAttribute(this.prt, 1));
    g.computeBoundingSphere();
    return g;
  }

  get empty(): boolean {
    return this.pos.length === 0;
  }
}

const groundY = (t: TerrainDef | undefined) => (t?.layer === 'liquid' ? WATER_Y : t?.layer === 'floor' ? 0.02 : 0);

/** A tree in voxel style on ground at height y: trunk and three shrinking layers of foliage, size and colour varied per tile. */
function standInTree(b: Builder, x: number, y: number, z: number, h: number, rgb: number[]): void {
  const s = 0.75 + (h % 7) / 20;
  const cx = x + 0.5 + ((h >> 3) % 5) / 25 - 0.08, cz = z + 0.5 + ((h >> 6) % 5) / 25 - 0.08;
  b.box(cx - 0.08, y, cz - 0.08, cx + 0.08, y + 0.6 * s, cz + 0.08, rgbOf('#6b4a2e'));
  const leaf = rgb.map((v, i) => v * (0.9 + ((h >> (9 + i)) % 3) * 0.08));
  [[0.45, 0.4, 0.75], [0.35, 0.95, 0.6], [0.22, 1.4, 0.5]].forEach(([r, y0, hh]) => b.box(cx - r * s, y + y0 * s, cz - r * s, cx + r * s, y + (y0 + hh) * s, cz + r * s, leaf));
}

function standInRock(b: Builder, x: number, y: number, z: number, h: number, rgb: number[]): void {
  const hh = 0.35 + (h % 5) / 10;
  const w = 0.36 + ((h >> 4) % 3) / 20;
  b.box(x + 0.5 - w, y, z + 0.5 - w, x + 0.5 + w, y + hh, z + 0.5 + w * 0.9, rgb);
  b.box(x + 0.5 - w * 0.6, y + hh, z + 0.5 - w * 0.5, x + 0.5 + w * 0.5, y + hh + 0.15, z + 0.5 + w * 0.4, rgb.map((v) => v * 1.06));
}

export interface TerrainView {
  key: string;
  sig: string;
  group: THREE.Group;
}

/** How many seeds of a terrain's model stand on its tiles. */
const TILE_SEEDS = 3;

/**
 * The ready forms (with meshes) of what stands on a terrain, or undefined while they are not all ready. A card isolated here (T296) is not
 * drawn: the terrain keeps its own look, as without a model.
 */
export function tileForms(k: Kernel, code: string): Array<{ form: Form; geo: ModelGeo }> | undefined {
  const t = k.palette[code];
  if (!t?.model || !k.forms.usable(t.model)) return undefined;
  const out: Array<{ form: Form; geo: ModelGeo }> = [];
  for (let s = 1; s <= TILE_SEEDS; s++) {
    const f = k.forms.ready(t.model, s);
    const geo = f && geoOf(f);
    if (!f || !geo) return undefined;
    out.push({ form: f, geo });
  }
  return out;
}

/** A hole's sub-cells (T415) as a short string, for the key. */
const coverHash = (c: Uint8Array) => {
  let h = 2166136261;
  for (let i = 0; i < c.length; i++) h = Math.imul(h ^ c[i]!, 16777619);
  return (h >>> 0).toString(36);
};

/** The cellars' holes in a chunk (T52b), as a key: tile, depth and where in the tile (T415). */
const holesKey = (k: Kernel, ch: Chunk) =>
  [...k.holesIn(ch)].map(([i, h]) => `${i}:${h.depth.toFixed(2)}${h.cover ? `:${coverHash(h.cover)}` : ''}`).join(',');

/** What a chunk's meshes depend on: its tiles and levels, its neighbours' (banks and walls look across the edge), the terrains' models, the cellars' holes. */
export function chunkSig(k: Kernel, ch: Chunk, models = ''): string {
  const v = (dx: number, dy: number) => {
    const n = k.chunks.get(`${ch.cx + dx},${ch.cy + dy}`);
    return n ? `${n.version}.${n.levels ?? 0}` : -1;
  };
  const n = (dx: number, dy: number) => {
    const o = k.chunks.get(`${ch.cx + dx},${ch.cy + dy}`);
    return o ? holesKey(k, o) : '';
  };
  return `${ch.version}.${ch.levels ?? 0}|${v(1, 0)}|${v(-1, 0)}|${v(0, 1)}|${v(0, -1)}|${models}|${holesKey(k, ch)}|${n(1, 0)}|${n(-1, 0)}|${n(0, 1)}|${n(0, -1)}`;
}

export function buildChunk(k: Kernel, ch: Chunk, models = ''): TerrainView {
  const S = k.config.chunkSize;
  const pal = k.palette;
  const ground = new Builder();
  const solid = new Builder();
  const X0 = ch.cx * S, Z0 = ch.cy * S;
  const tile = (col: number, row: number) => pal[k.tileAt(col, row) ?? ''];
  // Instances of the terrains' models, by form: where, how turned, how big.
  const instances = new Map<string, { geo: ModelGeo; mats: THREE.Matrix4[] }>();
  const formsOf = new Map<string, ReturnType<typeof tileForms>>();
  // Where a model has its cellar the terrain goes down to the cellar's bottom (T52b, the hole): its banks are the hole's sides.
  // A tile only partly over the cellar (T415) goes down only on its sub-cells over the hole, with sides where they meet the rest.
  const holes = new Map<string, TileHole>();
  for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const o = k.chunks.get(`${ch.cx + dx},${ch.cy + dy}`);
    if (o) for (const [i, h] of k.holesIn(o)) holes.set(`${o.cx * S + (i % S)},${o.cy * S + Math.floor(i / S)}`, h);
  }
  const holeAt = (x: number, z: number) => holes.get(`${x},${z}`);
  const ground0 = (x: number, z: number) => {
    const h = holeAt(x, z);
    return k.groundAt(x, z) - (h && !h.cover ? h.depth : 0);
  };
  const top = (x: number, z: number) => ground0(x, z) + groundY(tile(x, z));
  const N = HOLE_CELLS;
  /** The top of a tile at one of its sub-cells (s along x, t along z). */
  const subTop = (x: number, z: number, s: number, t: number) => {
    const h = holeAt(x, z);
    return h?.cover?.[t * N + s] ? k.groundAt(x, z) - h.depth + groundY(tile(x, z)) : top(x, z);
  };
  /** A side facing (dx, dz) on the plane `p`, from `a` to `b` along it, from `y` down to `ny`; wound counter-clockwise seen from outside, like the boxes. */
  const side = (dx: number, dz: number, p: number, a: number, b: number, y: number, ny: number, rgb: number[]) => {
    if (dx === 1) ground.quad([p, y, b], [p, ny, b], [p, ny, a], [p, y, a], [1, 0, 0], rgb, true);
    if (dx === -1) ground.quad([p, y, a], [p, ny, a], [p, ny, b], [p, y, b], [-1, 0, 0], rgb, true);
    if (dz === 1) ground.quad([a, y, p], [a, ny, p], [b, ny, p], [b, y, p], [0, 0, 1], rgb, true);
    if (dz === -1) ground.quad([b, y, p], [b, ny, p], [a, ny, p], [a, y, p], [0, 0, -1], rgb, true);
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
    // Between two sub-cells of different heights the higher one has the side.
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
  };
  // A terrain is a part (its code), so the ink follows where one meets another and never the tiles of one.
  const terrainPart = new Map(Object.keys(pal).map((code, i) => [code, 1 + (i % (SIDE_PART - 1))]));
  const place = (code: string, x: number, y: number, z: number, h: number, every: number): boolean => {
    if (!formsOf.has(code)) formsOf.set(code, tileForms(k, code));
    const fs = formsOf.get(code);
    if (!fs) return false;
    // Trees are two tiles wide: one every other tile is a wood; rocks one a tile.
    if (every > 1 && (x + z) % every !== 0) return true;
    const { form, geo } = fs[h % fs.length];
    const jitter = every > 1 ? 0.35 : 0.12;
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(x + 0.5 + (((h >> 4) % 100) / 100 - 0.5) * jitter, y, z + 0.5 + (((h >> 11) % 100) / 100 - 0.5) * jitter),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ((h >> 7) % 628) / 100),
      new THREE.Vector3().setScalar(0.85 + ((h >> 13) % 25) / 100),
    );
    const slot = instances.get(form.key) ?? instances.set(form.key, { geo, mats: [] }).get(form.key)!;
    slot.mats.push(m);
    return true;
  };
  for (let r = 0; r < S; r++)
    for (let c = 0; c < S; c++) {
      const code = ch.tiles[r * S + c];
      const t = pal[code] ?? pal['?'];
      const x = X0 + c, z = Z0 + r;
      const h = hash32(x, z, 77);
      const g0 = ground0(x, z);
      const y = g0 + groundY(t);
      const k0 = 0.92 + (h % 13) / 100;
      const base = rgbOf(t?.color, k0);
      ground.fixedPart = terrainPart.get(code) ?? 0;
      solid.fixedPart = undefined;
      const holed = holeAt(x, z);
      if (holed?.cover) partTile(x, z, base);
      else ground.quad([x, y, z], [x, y, z + 1], [x + 1, y, z + 1], [x + 1, y, z], [0, 1, 0], base);
      // Sides where this tile is higher than its neighbour: the slope of a hill in its own colour, darker,
      // banks of earth down to the water.
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = tile(x + dx, z + dz);
        const earth = n?.layer === 'liquid' && t?.layer !== 'liquid' ? rgbOf('#735638') : base.map((v) => v * 0.72);
        if (holed?.cover || holeAt(x + dx, z + dz)?.cover) {
          subSides(x, z, dx, dz, earth);
          continue;
        }
        const ny = top(x + dx, z + dz);
        if (ny >= y) continue;
        side(dx, dz, dx === 1 ? x + 1 : dx === -1 ? x : dz === 1 ? z + 1 : z, dx ? z : x, dx ? z + 1 : x + 1, y, ny, earth);
      }
      switch (t?.layer) {
        case 'wall':
          solid.fixedPart = ground.fixedPart;
          solid.box(x, g0, z, x + 1, g0 + WALL_H, z + 1, rgbOf(t.color, 0.95 + (h % 7) / 100));
          break;
        case 'door':
          // An opening: posts at the sides where walls continue, a lintel above.
          solid.fixedPart = ground.fixedPart;
          solid.box(x, g0 + WALL_H - 0.35, z, x + 1, g0 + WALL_H, z + 1, rgbOf(t.color, 0.8));
          break;
        case 'vegetation':
          // Nothing grows over a cellar (T415): the hole is the cellar's.
          if (!holed && !place(code, x, y, z, h, 2)) standInTree(solid, x, y, z, h, rgbOf(t.color));
          break;
        case 'rock':
          if (!holed && !place(code, x, y, z, h, 1)) standInRock(solid, x, y, z, h, rgbOf(t.color));
          break;
      }
    }
  const group = new THREE.Group();
  const g = new THREE.Mesh(ground.geometry(), MAT.world);
  g.receiveShadow = true;
  // One thing across the chunks, or the ink would draw their edges.
  g.userData.inkThing = TERRAIN_THING;
  group.add(g);
  if (!solid.empty) {
    const s = casts(new THREE.Mesh(solid.geometry(), MAT.world), true);
    s.userData.inkThing = TERRAIN_THING;
    group.add(s);
  }
  for (const { geo, mats } of instances.values()) {
    const im = new THREE.InstancedMesh(geo.body, modelMaterials(geo.body, geo.sway ? MAT.sway : MAT.world), mats.length);
    mats.forEach((m, i) => im.setMatrixAt(i, m));
    casts(im, true);
    im.computeBoundingSphere();
    im.userData.shared = true;
    group.add(im);
  }
  return { key: ch.key, sig: chunkSig(k, ch, models), group };
}

export function disposeChunk(v: TerrainView): void {
  v.group.traverse((o) => {
    // Instanced models share their geometry with every chunk (models.ts keeps it).
    if (o instanceof THREE.Mesh && !o.userData.shared) o.geometry.dispose();
  });
}
