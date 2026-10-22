// Voxels → triangles for the 3D sandbox, without three.js (it runs in the worker too): one quad per
// voxel face that touches the empty, coloured from the palette, darkened at the vertices by ambient
// occlusion, with a faint per-voxel grain so large surfaces are not flat.
//
// Axes: the engine's x (left → right), y (back → front) and z (up) become three.js x, z and y. One tile
// is one unit, so a voxel is 1 / voxels-per-tile. The mesh's origin is the centre of the model's floor.

import type { PaletteEntry } from './engine';

export interface MeshData {
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
  /** Per vertex, how much the wind moves it (0 at the foot, 1 at the top): vegetation only. */
  sway?: Float32Array;
}

export interface VoxelGrid {
  X: number;
  Y: number;
  Z: number;
  cells: Uint8Array;
  alphabet: string[];
}

export interface MeshOptions {
  /** Voxels per tile (20 at the lab's scale; 8 for the models of step 8A). */
  vpt: number;
  /** Only these cells (the rest counts as empty): a body without its limbs, a single limb. */
  only?: (idx: number) => boolean;
  /** Voxel coordinates that become the mesh's origin (default: the centre of the floor). */
  pivot?: [number, number, number];
  sway?: boolean;
}

const lin = (c: number) => Math.pow(c / 255, 2.2);

/** Per alphabet index: linear RGB, or null for the empty, hidden and colourless. */
export function colorTable(alphabet: string[], palette: Record<string, PaletteEntry>): Array<[number, number, number] | null> {
  return alphabet.map((ch, i) => {
    const e = palette[ch];
    if (i === 0 || !e?.color || e.hidden) return null;
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(e.color);
    return m ? [lin(parseInt(m[1], 16)), lin(parseInt(m[2], 16)), lin(parseInt(m[3], 16))] : null;
  });
}

// Faces: normal (engine axes), the four corners (as offsets 0/1), and the two tangent axes for AO.
const FACES: Array<{ n: [number, number, number]; corners: Array<[number, number, number]> }> = [
  { n: [1, 0, 0], corners: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
  { n: [-1, 0, 0], corners: [[0, 1, 0], [0, 0, 0], [0, 0, 1], [0, 1, 1]] },
  { n: [0, 1, 0], corners: [[1, 1, 0], [0, 1, 0], [0, 1, 1], [1, 1, 1]] },
  { n: [0, -1, 0], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { n: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
  { n: [0, 0, -1], corners: [[0, 1, 0], [1, 1, 0], [1, 0, 0], [0, 0, 0]] },
];

const hash = (x: number, y: number, z: number) => {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

export function meshVoxels(g: VoxelGrid, palette: Record<string, PaletteEntry>, o: MeshOptions): MeshData {
  const { X, Y, Z, cells } = g;
  const XY = X * Y;
  const colors = colorTable(g.alphabet, palette);
  const solid = (x: number, y: number, z: number) => {
    if (x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z) return false;
    const i = x + y * X + z * XY;
    return colors[cells[i]] !== null && (!o.only || o.only(i));
  };
  const s = 1 / o.vpt;
  const [px, py, pz] = o.pivot ?? [X / 2, Y / 2, 0];
  // Top of the model, for the sway weight.
  let top = 1;
  if (o.sway) for (let i = cells.length - 1; i >= 0; i--) if (colors[cells[i]]) {
    top = Math.floor(i / XY) + 1;
    break;
  }
  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  const sw: number[] = [];
  const idx: number[] = [];
  for (let z = 0; z < Z; z++)
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++) {
        const i = x + y * X + z * XY;
        const c = colors[cells[i]];
        if (!c || (o.only && !o.only(i))) continue;
        const grain = 0.93 + 0.1 * hash(x, y, z);
        for (const f of FACES) {
          const [nx, ny, nz] = f.n;
          if (solid(x + nx, y + ny, z + nz)) continue;
          const base = pos.length / 3;
          for (const [cx, cy, cz] of f.corners) {
            // Ambient occlusion: the two side neighbours and the corner, in front of the face.
            const ox = x + nx, oy = y + ny, oz = z + nz;
            const d = [cx * 2 - 1, cy * 2 - 1, cz * 2 - 1];
            const t = [0, 1, 2].filter((a) => f.n[a] === 0);
            const a1 = [0, 0, 0], a2 = [0, 0, 0];
            a1[t[0]] = d[t[0]];
            a2[t[1]] = d[t[1]];
            const s1 = solid(ox + a1[0], oy + a1[1], oz + a1[2]);
            const s2 = solid(ox + a2[0], oy + a2[1], oz + a2[2]);
            const sc = solid(ox + a1[0] + a2[0], oy + a1[1] + a2[1], oz + a1[2] + a2[2]);
            const occ = s1 && s2 ? 3 : (s1 ? 1 : 0) + (s2 ? 1 : 0) + (sc ? 1 : 0);
            const light = (1 - occ * 0.17) * grain;
            const vx = x + cx, vy = y + cy, vz = z + cz;
            pos.push((vx - px) * s, (vz - pz) * s, (vy - py) * s);
            nor.push(nx, nz, ny);
            col.push(c[0] * light, c[1] * light, c[2] * light);
            if (o.sway) {
              const h = Math.max(0, vz / top - 0.25) / 0.75;
              sw.push(h * h);
            }
          }
          // The diagonal that keeps the occlusion smooth. Swapping y and z mirrors the corners, so the
          // triangles go round the other way to face out in three.js.
          const l0 = col[(base) * 3] + col[(base) * 3 + 1];
          const l2 = col[(base + 2) * 3] + col[(base + 2) * 3 + 1];
          const l1 = col[(base + 1) * 3] + col[(base + 1) * 3 + 1];
          const l3 = col[(base + 3) * 3] + col[(base + 3) * 3 + 1];
          if (l0 + l2 >= l1 + l3) idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
          else idx.push(base + 1, base + 3, base + 2, base + 1, base, base + 3);
        }
      }
  return {
    positions: new Float32Array(pos),
    normals: new Float32Array(nor),
    colors: new Float32Array(col),
    indices: new Uint32Array(idx),
    ...(o.sway ? { sway: new Float32Array(sw) } : {}),
  };
}

/**
 * What one can stand on: per voxel column, how many voxels of solid start at the floor and go up without
 * a gap, if no more than `step` (a floor, a doorstep), else 0.
 */
export function floors(g: VoxelGrid, palette: Record<string, PaletteEntry>, step: number): Uint8Array {
  const colors = colorTable(g.alphabet, palette);
  const out = new Uint8Array(g.X * g.Y);
  const XY = g.X * g.Y;
  for (let i = 0; i < XY; i++) {
    let h = 0;
    while (h < g.Z && colors[g.cells[i + h * XY]]) h++;
    out[i] = h <= step ? h : 0;
  }
  return out;
}

/** Where a person or an animal can stand: per voxel column, whether something solid is at body height. */
export function footprint(g: VoxelGrid, palette: Record<string, PaletteEntry>, from: number, to: number): Uint8Array {
  const colors = colorTable(g.alphabet, palette);
  const out = new Uint8Array(g.X * g.Y);
  const XY = g.X * g.Y;
  for (let z = Math.max(0, from); z < Math.min(g.Z, to); z++)
    for (let i = 0; i < XY; i++) if (colors[g.cells[i + z * XY]]) out[i] = 1;
  return out;
}
