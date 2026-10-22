// The ground of the simulation, chunk by chunk, in carpet coordinates (x → three x, y → three z, one
// tile = one unit). The plan's tiles are still the ground: colour per terrain, water lower than the
// land with earthen banks, walls extruded, doors as an opening under a lintel. What stands on a tile
// (trees on woods, boulders on rock) is a stand-in until the tile has a model (step 9, F5). Roofs are
// separate meshes, hidden when the wanderer is inside.

import * as THREE from 'three';
import type { Chunk, Kernel } from '../kernel/kernel';
import { hash32 } from '../kernel/rng';
import type { TileDef } from '../kernel/types';
import { MAT, rgbOf } from './materials';

export const WALL_H = 1.6;
const WATER_Y = -0.18;

/** Accumulates coloured boxes and quads into one geometry. */
export class Builder {
  pos: number[] = [];
  nor: number[] = [];
  col: number[] = [];

  quad(a: number[], b: number[], c: number[], d: number[], n: number[], rgb: number[]): void {
    for (const v of [a, b, c, a, c, d]) {
      this.pos.push(v[0], v[1], v[2]);
      this.nor.push(n[0], n[1], n[2]);
      this.col.push(rgb[0], rgb[1], rgb[2]);
    }
  }

  /** An axis-aligned box from (x0, y0, z0) to (x1, y1, z1), the top lit a little more, the bottom omitted. */
  box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, rgb: number[], bottom = false): void {
    const top = rgb.map((v) => v * 1.08);
    const side = rgb.map((v) => v * 0.9);
    this.quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [0, 1, 0], top);
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], rgb);
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], side);
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], side);
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], side);
    if (bottom) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], side);
  }

  geometry(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.computeBoundingSphere();
    return g;
  }

  get empty(): boolean {
    return this.pos.length === 0;
  }
}

const groundY = (t: TileDef | undefined) => (t?.layer === 'liquid' ? WATER_Y : t?.layer === 'floor' ? 0.02 : 0);

/** A tree in voxel style: trunk and three shrinking layers of foliage, size and colour varied per tile. */
function standInTree(b: Builder, x: number, z: number, h: number, rgb: number[]): void {
  const s = 0.75 + (h % 7) / 20;
  const cx = x + 0.5 + ((h >> 3) % 5) / 25 - 0.08, cz = z + 0.5 + ((h >> 6) % 5) / 25 - 0.08;
  b.box(cx - 0.08, 0, cz - 0.08, cx + 0.08, 0.6 * s, cz + 0.08, rgbOf('#6b4a2e'));
  const leaf = rgb.map((v, i) => v * (0.9 + ((h >> (9 + i)) % 3) * 0.08));
  [[0.45, 0.4, 0.75], [0.35, 0.95, 0.6], [0.22, 1.4, 0.5]].forEach(([r, y0, hh]) => b.box(cx - r * s, y0 * s, cz - r * s, cx + r * s, (y0 + hh) * s, cz + r * s, leaf));
}

function standInRock(b: Builder, x: number, z: number, h: number, rgb: number[]): void {
  const hh = 0.35 + (h % 5) / 10;
  const w = 0.36 + ((h >> 4) % 3) / 20;
  b.box(x + 0.5 - w, 0, z + 0.5 - w, x + 0.5 + w, hh, z + 0.5 + w * 0.9, rgb);
  b.box(x + 0.5 - w * 0.6, hh, z + 0.5 - w * 0.5, x + 0.5 + w * 0.5, hh + 0.15, z + 0.5 + w * 0.4, rgb.map((v) => v * 1.06));
}

export interface ChunkView {
  key: string;
  sig: string;
  group: THREE.Group;
  roofs: Array<{ mesh: THREE.Mesh; building: Chunk['buildings'][number] }>;
}

/** What a chunk's meshes depend on: its tiles and its neighbours' (banks and walls look across the edge). */
export function chunkSig(k: Kernel, ch: Chunk): string {
  const v = (dx: number, dy: number) => k.chunks.get(`${ch.cx + dx},${ch.cy + dy}`)?.version ?? -1;
  return `${ch.version}|${v(1, 0)}|${v(-1, 0)}|${v(0, 1)}|${v(0, -1)}`;
}

export function buildChunk(k: Kernel, ch: Chunk): ChunkView {
  const S = k.config.chunkSize;
  const pal = k.palette;
  const ground = new Builder();
  const solid = new Builder();
  const X0 = ch.cx * S, Z0 = ch.cy * S;
  const tile = (col: number, row: number) => pal[k.tileAt(col, row) ?? ''];
  for (let r = 0; r < S; r++)
    for (let c = 0; c < S; c++) {
      const code = ch.tiles[r * S + c];
      const t = pal[code] ?? pal['?'];
      const x = X0 + c, z = Z0 + r;
      const h = hash32(x, z, 77);
      const y = groundY(t);
      const k0 = 0.92 + (h % 13) / 100;
      const base = rgbOf(t?.color, k0);
      ground.quad([x, y, z], [x, y, z + 1], [x + 1, y, z + 1], [x + 1, y, z], [0, 1, 0], base);
      // Banks: earth where this tile is higher than its neighbour.
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = tile(x + dx, z + dz);
        const ny = groundY(n);
        if (!n || ny >= y) continue;
        const earth = rgbOf('#735638');
        if (dx === 1) ground.quad([x + 1, y, z], [x + 1, ny, z], [x + 1, ny, z + 1], [x + 1, y, z + 1], [1, 0, 0], earth);
        if (dx === -1) ground.quad([x, y, z + 1], [x, ny, z + 1], [x, ny, z], [x, y, z], [-1, 0, 0], earth);
        if (dz === 1) ground.quad([x + 1, y, z + 1], [x + 1, ny, z + 1], [x, ny, z + 1], [x, y, z + 1], [0, 0, 1], earth);
        if (dz === -1) ground.quad([x, y, z], [x, ny, z], [x + 1, ny, z], [x + 1, y, z], [0, 0, -1], earth);
      }
      switch (t?.layer) {
        case 'wall':
          solid.box(x, 0, z, x + 1, WALL_H, z + 1, rgbOf(t.color, 0.95 + (h % 7) / 100));
          break;
        case 'door':
          // An opening: posts at the sides where walls continue, a lintel above.
          solid.box(x, WALL_H - 0.35, z, x + 1, WALL_H, z + 1, rgbOf(t.color, 0.8));
          break;
        case 'vegetation':
          standInTree(solid, x, z, h, rgbOf(t.color));
          break;
        case 'rock':
          standInRock(solid, x, z, h, rgbOf(t.color));
          break;
      }
    }
  const group = new THREE.Group();
  const g = new THREE.Mesh(ground.geometry(), MAT.world);
  g.receiveShadow = true;
  group.add(g);
  if (!solid.empty) {
    const s = new THREE.Mesh(solid.geometry(), MAT.world);
    s.castShadow = s.receiveShadow = true;
    group.add(s);
  }
  // Roofs: a hip roof of shrinking layers over each building, in the terrain's roof colour.
  const roofColor = rgbOf(k.terrain?.manifest.roof?.color ?? '#9a4632');
  const roofs = ch.buildings.map((b) => {
    const rb = new Builder();
    const x0 = X0 + b.x0 - 0.1, x1 = X0 + b.x1 + 1.1, z0 = Z0 + b.y0 - 0.1, z1 = Z0 + b.y1 + 1.1;
    const layers = Math.max(2, Math.ceil(Math.min(x1 - x0, z1 - z0) / 2 / 0.35));
    for (let i = 0; i < layers; i++) {
      const inset = i * 0.35;
      if (x1 - x0 - 2 * inset < 0.3 || z1 - z0 - 2 * inset < 0.3) break;
      rb.box(x0 + inset, WALL_H + i * 0.22, z0 + inset, x1 - inset, WALL_H + (i + 1) * 0.22, z1 - inset, roofColor.map((v) => v * (1 - i * 0.03)), i === 0);
    }
    const mesh = new THREE.Mesh(rb.geometry(), MAT.world);
    mesh.castShadow = true;
    group.add(mesh);
    return { mesh, building: b };
  });
  return { key: ch.key, sig: chunkSig(k, ch), group, roofs };
}

export function disposeChunk(v: ChunkView): void {
  v.group.traverse((o) => {
    if (o instanceof THREE.Mesh) o.geometry.dispose();
  });
}
