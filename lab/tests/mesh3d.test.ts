import { describe, expect, it } from 'vitest';
import { footprint, meshVoxels, type VoxelGrid } from '../../src/mj/mesh';

const palette = { A: { color: '#808080' }, H: { color: '#ffffff', hidden: true } };
const grid = (X: number, Y: number, Z: number, fill: (x: number, y: number, z: number) => number): VoxelGrid => {
  const cells = new Uint8Array(X * Y * Z);
  for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) cells[x + y * X + z * X * Y] = fill(x, y, z);
  return { X, Y, Z, cells, alphabet: ['.', 'A', 'H'] };
};

describe('sandbox meshes (lab/3d/mesh.ts)', () => {
  it('draws only the faces that touch the empty, never hidden letters', () => {
    const m = meshVoxels(grid(2, 1, 1, () => 1), palette, { vpt: 20 });
    expect(m.indices.length / 6).toBe(10);
    expect(meshVoxels(grid(2, 1, 1, (x) => (x ? 2 : 1)), palette, { vpt: 20 }).indices.length / 6).toBe(6);
  });

  it('winds every triangle facing out, in three.js axes', () => {
    const m = meshVoxels(grid(3, 3, 3, (x, y, z) => ((x + y + z) % 2 ? 1 : 0)), palette, { vpt: 1 });
    const p = (i: number) => [m.positions[i * 3], m.positions[i * 3 + 1], m.positions[i * 3 + 2]];
    for (let t = 0; t < m.indices.length; t += 3) {
      const [a, b, c] = [p(m.indices[t]), p(m.indices[t + 1]), p(m.indices[t + 2])];
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const k = m.indices[t] * 3;
      expect(n[0] * m.normals[k] + n[1] * m.normals[k + 1] + n[2] * m.normals[k + 2]).toBeGreaterThan(0);
    }
  });

  it('darkens corners next to other voxels', () => {
    const m = meshVoxels(grid(2, 2, 2, (x, y, z) => (z === 0 || (x === 0 && y === 0) ? 1 : 0)), palette, { vpt: 1 });
    const lights = Array.from({ length: m.colors.length / 3 }, (_, i) => m.colors[i * 3]);
    expect(Math.min(...lights)).toBeLessThan(Math.max(...lights) * 0.75);
  });

  it('marks where a figure cannot stand', () => {
    const f = footprint(grid(2, 2, 4, (x, y, z) => (x === 0 && y === 0 && z === 3 ? 1 : z === 0 ? 1 : 0)), palette, 1, 3);
    expect([...f]).toEqual([0, 0, 0, 0]);
    expect([...footprint(grid(2, 2, 4, (x, _y, z) => (x === 1 && z === 2 ? 1 : 0)), palette, 1, 3)]).toEqual([0, 1, 0, 1]);
  });
});
