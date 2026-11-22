// The ground of the simulation, chunk by chunk, in carpet coordinates (x → three x, y → three z, one
// tile = one unit). The plan's tiles are still the ground: colour per terrain, each tile a column as high
// as the relief (ADR-0048) with its sides where a neighbour is lower, water lower than the land with
// earthen banks, walls extruded, doors as an opening under a lintel. What stands on a tile
// (trees on woods, boulders on rock) is the terrain's model (`TerrainDef.model`), a few seeds of it as
// instances, turned and shifted; a stand-in until the model is ready. Buildings are no longer tiles: each
// is a structure, a model on its lot (ADR-0043), drawn with the entities.
// A place's mesh is made as arrays (terrainmesh.ts) from what it reads: of the kernel here (`buildChunk`), of a
// copy of those reads (`chunkInput`) in the worker of the ground (T486, ADR-0242); here the meshes of the arrays.

import * as THREE from 'three';
import type { Chunk, Kernel } from '../kernel/kernel';
import type { TerrainDef } from '../kernel/types';
import { TERRAIN_THING } from './cartoon';
import { casts, MAT, rgbOf } from './materials';
import { geoOf, modelMaterials, type ModelGeo } from './models';
import { HOLE_CELLS, type Form, type TileHole } from '../kernel/forms';
import { CUT_REACH, cutDisc, inCutDisc, type Towards, type Underground } from '../kernel/underground';
import { stratumRow } from '../kernel/strata';
import { foamGeometry, SEA_MAT } from './sea';
import {
  BANK,
  CHUNK_MARGIN,
  chunkArrays,
  MeshBuilder,
  sideQuad,
  terrainTops,
  TILE_SEEDS,
  TRUNK,
  type ChunkArrays,
  type ChunkInput,
  type ChunkSource,
  type GroundReads,
  type MeshArrays,
} from './terrainmesh';

// The numbers of the ground's mesh live with its arrays (terrainmesh.ts, T486); here as they were.
export { VOID_SLAB, WALL_H, WATER_Y } from './terrainmesh';

/** Accumulates coloured boxes and quads into one geometry (the arrays: `MeshBuilder`). */
export class Builder extends MeshBuilder {
  /**
   * The mesh, its vertices relative to `origin` (carpet x and z): a place's own corner (T449, the origin that moves), so that a place a million
   * tiles from the origin keeps its sixty-fourths of a tile in a float; the mesh is put there in double precision.
   */
  geometry(origin: readonly [number, number] = [0, 0]): THREE.BufferGeometry {
    return meshGeometry(this.arrays(origin));
  }
}

/** The geometry of a mesh's arrays (made here or in a worker, T486): the arrays become its own. */
export function meshGeometry(a: MeshArrays): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(a.position, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(a.normal, 3));
  g.setAttribute('color', new THREE.BufferAttribute(a.color, 3));
  g.setAttribute('part', new THREE.BufferAttribute(a.part, 1));
  g.computeBoundingSphere();
  return g;
}

/** What the tops of the terrain read of the kernel: a tile's terrain and its ground. */
function kernelReads(k: Kernel): GroundReads {
  const pal = k.palette;
  return { terrain: (code) => pal[code], tileAt: (x, z) => k.tileAt(x, z), groundAt: (x, z) => k.groundAt(x, z) };
}

export interface TerrainView {
  key: string;
  sig: string;
  group: THREE.Group;
}

/** The signature of a place's mesh made of files that are no more (T492): no place has it, so the place is made again. */
export const STALE_SIG = '';

/**
 * The places' meshes made of the files before a reload (T492): they stay on screen, each until its new one replaces it in the same frame,
 * and are made again (their signature matches no place's).
 */
export function staleChunks(views: Map<string, TerrainView>): void {
  for (const v of views.values()) v.sig = STALE_SIG;
}

/** The forms of what stands on a terrain, with their geometries (`tileForms`). */
type TileForms = Array<{ form: Form; geo: ModelGeo }>;

/**
 * The ready forms (with meshes) of what stands on a terrain, or undefined while they are not all ready. A card isolated here (T296) is not
 * drawn: the terrain keeps its own look, as without a model.
 */
export function tileForms(k: Kernel, code: string): TileForms | undefined {
  const t = k.palette[code];
  if (!t?.model || !k.forms.usable(t.model)) return undefined;
  const out: TileForms = [];
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

/** The holes over cellars of a place and of the four beside it, by tile of the carpet: what its mesh lowers (T52b, T415). */
function holesAround(k: Kernel, ch: Chunk): Map<string, TileHole> {
  const S = k.config.chunkSize;
  const holes = new Map<string, TileHole>();
  for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const o = k.chunks.get(`${ch.cx + dx},${ch.cy + dy}`);
    if (o) for (const [i, h] of k.holesIn(o)) holes.set(`${o.cx * S + (i % S)},${o.cy * S + Math.floor(i / S)}`, h);
  }
  return holes;
}

/** The reads of a place's mesh from the kernel, on the page; and the forms of the terrains it found ready, for its instances. */
function kernelSource(k: Kernel, ch: Chunk): ChunkSource & { forms: Map<string, TileForms | undefined> } {
  const holes = holesAround(k, ch);
  const forms = new Map<string, TileForms | undefined>();
  return {
    ...kernelReads(k),
    S: k.config.chunkSize,
    cx: ch.cx,
    cy: ch.cy,
    tiles: ch.tiles,
    cells: HOLE_CELLS,
    codes: Object.keys(k.palette),
    holeAt: (x, z) => holes.get(`${x},${z}`),
    ready: (code) => {
      if (!forms.has(code)) forms.set(code, tileForms(k, code));
      return !!forms.get(code);
    },
    rgb: (color) => rgbOf(color),
    forms,
  };
}

/**
 * What a place's mesh reads of the kernel, copied for a worker (T486): its tiles, the tiles and the ground `CHUNK_MARGIN` beyond its edges,
 * the holes there, the palette and its colours lit, which terrains' models are ready. Nothing of it is the kernel's: the covers are copies.
 */
export function chunkInput(k: Kernel, ch: Chunk): ChunkInput {
  const S = k.config.chunkSize;
  const M = CHUNK_MARGIN, w = S + 2 * M;
  const x0 = ch.cx * S - M, z0 = ch.cy * S - M;
  const codes: string[] = new Array(w * w);
  const ground = new Float64Array(w * w);
  for (let r = 0; r < w; r++)
    for (let c = 0; c < w; c++) {
      codes[r * w + c] = k.tileAt(x0 + c, z0 + r) ?? '';
      ground[r * w + c] = k.groundAt(x0 + c, z0 + r);
    }
  const holes: ChunkInput['holes'] = [];
  for (const [at, h] of holesAround(k, ch)) {
    const [x, z] = at.split(',').map(Number) as [number, number];
    if (x >= x0 && z >= z0 && x < x0 + w && z < z0 + w) holes.push([(z - z0) * w + (x - x0), h.depth, h.cover ? new Uint8Array(h.cover) : undefined]);
  }
  const palette: ChunkInput['palette'] = [];
  const rgb: ChunkInput['rgb'] = { '': rgbOf(undefined), [BANK]: rgbOf(BANK), [TRUNK]: rgbOf(TRUNK) };
  const ready: string[] = [];
  for (const [code, t] of Object.entries(k.palette) as Array<[string, TerrainDef]>) {
    palette.push([code, t.layer, t.color]);
    rgb[t.color || ''] ??= rgbOf(t.color);
    if (t.model && tileForms(k, code)) ready.push(code);
  }
  return { S, cx: ch.cx, cy: ch.cy, tiles: ch.tiles, cells: HOLE_CELLS, palette, rgb, x0, z0, w, codes, ground, holes, ready };
}

/**
 * The meshes of a place's arrays (made here or in a worker): the ground, the solid things, the water and its foam, the models on its tiles
 * as instances by form, in the order they were placed. Undefined if a terrain whose models the arrays placed has none ready any more (the
 * arrays are of a moment before): the place is made again. `known`: the forms found ready when the arrays were made, here.
 */
export function chunkView(k: Kernel, ch: Chunk, a: ChunkArrays, sig: string, known?: Map<string, TileForms | undefined>): TerrainView | undefined {
  const S = k.config.chunkSize;
  const X0 = ch.cx * S, Z0 = ch.cy * S;
  // Instances of the terrains' models, by form: where, how turned, how big.
  const instances = new Map<string, { geo: ModelGeo; mats: THREE.Matrix4[] }>();
  const forms = known ?? new Map<string, TileForms | undefined>();
  for (const i of a.instances) {
    if (!forms.has(i.code)) forms.set(i.code, tileForms(k, i.code));
    const fs = forms.get(i.code);
    if (!fs) return undefined;
    const { form, geo } = fs[i.seed]!;
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(i.x, i.y, i.z),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), i.yaw),
      new THREE.Vector3().setScalar(i.scale),
    );
    const slot = instances.get(form.key) ?? instances.set(form.key, { geo, mats: [] }).get(form.key)!;
    slot.mats.push(m);
  }
  const group = new THREE.Group();
  const g = new THREE.Mesh(meshGeometry(a.ground), MAT.world);
  g.receiveShadow = true;
  // One thing across the chunks, or the ink would draw their edges.
  g.userData.inkThing = TERRAIN_THING;
  group.add(g);
  if (a.solid) {
    const s = casts(new THREE.Mesh(meshGeometry(a.solid), MAT.world), true);
    s.userData.inkThing = TERRAIN_THING;
    group.add(s);
  }
  if (a.water) {
    const geo = meshGeometry(a.water);
    geo.setAttribute('wave', new THREE.BufferAttribute(a.water.wave, 1));
    geo.setAttribute('seaPhase', new THREE.BufferAttribute(a.water.seaPhase, 3));
    const w = new THREE.Mesh(geo, SEA_MAT.water);
    w.receiveShadow = true;
    w.userData.inkThing = TERRAIN_THING;
    group.add(w);
  }
  if (a.foam) {
    const fm = new THREE.Mesh(foamGeometry(a.foam), SEA_MAT.foam);
    fm.renderOrder = 1;
    group.add(fm);
  }
  for (const { geo, mats } of instances.values()) {
    const im = new THREE.InstancedMesh(geo.body, modelMaterials(geo.body, geo.sway ? MAT.sway : MAT.world), mats.length);
    mats.forEach((m, i) => im.setMatrixAt(i, m.setPosition(m.elements[12]! - X0, m.elements[13]!, m.elements[14]! - Z0)));
    casts(im, true);
    im.computeBoundingSphere();
    im.userData.shared = true;
    group.add(im);
  }
  // Everything of the place relative to its corner (T449): the group stands there, in double precision.
  group.position.set(X0, 0, Z0);
  return { key: ch.key, sig, group };
}

/** The meshes of a place's ground made here, on the page's thread (`chunkArrays` from the kernel); the renderer has them made in a worker (T486). */
export function buildChunk(k: Kernel, ch: Chunk, models = ''): TerrainView {
  const src = kernelSource(k, ch);
  return chunkView(k, ch, chunkArrays(src), chunkSig(k, ch, models), src.forms)!;
}

/** The colour of the earth where the terrain is cut under the ground (T416), where a column has no strata (off the places). */
export const CUT_EARTH = '#5f4632';

/** The colour of a column's stratum at a depth under its ground (T418), times `shade`: its terrain's, or the earth's. */
export function stratumColour(k: Kernel, x: number, z: number, depth: number, shade = 1): number[] {
  return rgbOf(k.stratumAt(x, z, depth)?.color ?? CUT_EARTH, shade);
}

/**
 * A side of the column at (x, z) from `y` down to `ny` in the bands of its strata (T418, ADR-0091 point 6): a band a tile deep from its ground
 * down (`stratumRow`), the last one of its place (6 rows in a new plan, 4 in one of before: T478) deeper down, the first one above the ground.
 * Facing (dx, dz) on the plane `p`, from `a` to `e` along it.
 */
export function strataSide(k: Kernel, b: Builder, x: number, z: number, dx: number, dz: number, p: number, a: number, e: number, y: number, ny: number, shade: number): void {
  const g = k.groundAt(x, z);
  const rows = k.strataRowsAt(x, z);
  for (let top = y; top > ny; ) {
    const row = stratumRow(g - top + 1e-6, rows);
    const bottom = row >= rows - 1 ? ny : Math.max(ny, g - row - 1);
    sideQuad(b, dx, dz, p, a, e, top, bottom, stratumColour(k, x, z, g - top + 1e-6, shade));
    top = bottom;
  }
}

/** What the cut's caps depend on: where and how high, towards where, and the chunks under the disc (their tiles, levels and holes). */
export function cutSig(k: Kernel, u: Underground, towards: Towards): string {
  const S = k.config.chunkSize;
  const R = CUT_REACH + 1;
  const parts = [`${u.tile.x},${u.tile.y},${u.cut.toFixed(3)},${towards.x},${towards.y}`];
  for (let cy = Math.floor((u.tile.y - R) / S); cy <= Math.floor((u.tile.y + R) / S); cy++)
    for (let cx = Math.floor((u.tile.x - R) / S); cx <= Math.floor((u.tile.x + R) / S); cx++) {
      const ch = k.chunks.get(`${cx},${cy}`);
      parts.push(ch ? `${ch.version}.${ch.levels ?? 0}.${k.holesIn(ch).size}` : '-');
    }
  return parts.join('|');
}

/**
 * The cut under the ground (T416, ADR-0091 point 6): the caps of what the shaders do not draw in the disc (`U.cutY`, materials.ts). Every
 * tile of the disc whose top is over the cut has a cap at the cut (on its sub-cells over it, where a cellar opens part of the tile) in the
 * colour of the stratum it reaches there, and every tile around the disc that stands over the cut has its side towards the disc down to the
 * cut in the bands of its strata (T418): the columns cut, never their empty inside. Undefined if nothing is over the cut. In carpet coordinates, with the chunks.
 */
export function buildCut(k: Kernel, u: Underground, towards: Towards): THREE.Mesh | undefined {
  const S = k.config.chunkSize;
  const N = HOLE_CELLS;
  const byChunk = new Map<string, Map<number, TileHole>>();
  const holeAt = (x: number, z: number) => {
    const cx = Math.floor(x / S), cy = Math.floor(z / S), key = `${cx},${cy}`;
    let m = byChunk.get(key);
    if (!m) {
      const ch = k.chunks.get(key);
      byChunk.set(key, (m = ch ? k.holesIn(ch) : new Map<number, TileHole>()));
    }
    return m.get((z - cy * S) * S + (x - cx * S));
  };
  const { subTop } = terrainTops(kernelReads(k), holeAt, N);
  const loaded = (x: number, z: number) => k.tileAt(x, z) !== undefined;
  const inDisc = (x: number, z: number) => inCutDisc(x - u.tile.x, z - u.tile.y, towards);
  // Over the cut by more than the shaders' nudge (`CUT_VERTEX`): what they do not draw.
  const over = (y: number) => y > u.cut + 0.01;
  const b = new Builder();
  for (const { x, y: z } of cutDisc(u.tile, towards)) {
    if (!loaded(x, z)) continue;
    // The stratum the column reaches at the cut (T418).
    const cap = stratumColour(k, x, z, k.groundAt(x, z) - u.cut);
    const parted = !!holeAt(x, z)?.cover;
    const n = parted ? N : 1;
    // The cap: a run of sub-cells over the cut along a row is one quad (a whole tile, one).
    for (let t = 0; t < n; t++)
      for (let s = 0; s < n; ) {
        if (!over(subTop(x, z, s, t))) {
          s++;
          continue;
        }
        let e = s + 1;
        while (e < n && over(subTop(x, z, e, t))) e++;
        const x0 = x + s / n, x1 = x + e / n, z0 = z + t / n, z1 = z + (t + 1) / n;
        b.quad([x0, u.cut, z0], [x0, u.cut, z1], [x1, u.cut, z1], [x1, u.cut, z0], [0, 1, 0], cap);
        s = e;
      }
    // The sides of the tiles around the disc, towards it: from as high as both stood (higher, the chunk draws it) down to the cut.
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx, nz = z + dz;
      if (inDisc(nx, nz) || !loaded(nx, nz)) continue;
      const fine = parted || !!holeAt(nx, nz)?.cover;
      const m = fine ? N : 1;
      // Sub-cell j along the edge: this tile's (`mine`) and the neighbour's next to it (`theirs`).
      const mine = (j: number) => (dx === 1 ? subTop(x, z, N - 1, j) : dx === -1 ? subTop(x, z, 0, j) : dz === 1 ? subTop(x, z, j, N - 1) : subTop(x, z, j, 0));
      const theirs = (j: number) => (dx === 1 ? subTop(nx, nz, 0, j) : dx === -1 ? subTop(nx, nz, N - 1, j) : dz === 1 ? subTop(nx, nz, j, 0) : subTop(nx, nz, j, N - 1));
      const high = (j: number) => {
        const at = fine ? j : 0;
        const y = mine(at);
        return over(y) ? Math.min(y, theirs(at)) : -Infinity;
      };
      const p = dx === 1 ? x + 1 : dx === -1 ? x : dz === 1 ? z + 1 : z;
      const o = dx ? z : x;
      for (let j = 0; j < m; ) {
        const y = high(j);
        let e = j + 1;
        while (e < m && high(e) === y) e++;
        // The neighbour's side, in the bands of its strata.
        if (over(y)) strataSide(k, b, nx, nz, -dx, -dz, p, o + j / m, o + e / m, y, u.cut, 0.78);
        j = e;
      }
    }
  }
  if (b.empty) return undefined;
  // Relative to the tile it is cut around (T449), put there in double precision.
  const mesh = new THREE.Mesh(b.geometry([u.tile.x, u.tile.y]), MAT.world);
  mesh.position.set(u.tile.x, 0, u.tile.y);
  mesh.receiveShadow = true;
  mesh.userData.inkThing = TERRAIN_THING;
  return mesh;
}

export function disposeChunk(v: TerrainView): void {
  v.group.traverse((o) => {
    // Instanced models share their geometry with every chunk (models.ts keeps it).
    if (o instanceof THREE.Mesh && !o.userData.shared) o.geometry.dispose();
  });
}
