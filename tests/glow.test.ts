// Glowing voxels (ADR-0046): `<color glow="True">` in the program, a `glow` weight per vertex in the
// mesh, no occlusion on what glows, no shade in the Artist's photos, the letters an action may light.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { actionLetters } from '../src/kernel/agents/sculptor';
import { classOf } from '../src/mj/classes';
import { meshVoxels, type VoxelGrid } from '../src/mj/mesh';
import { compileMjx } from '../src/mj/model';
import { paint } from '../src/mj/photo';

const LAMP = `<sequence values="BAF" size="4 4 4" origin="True">
  <color symbol="A" value="404040"/>
  <color symbol="F" value="ffcc66" glow="True"/>
  <one in="A B" out="A F" steps="1"/>
</sequence>`;

const grid = (X: number, Y: number, Z: number, fill: (x: number, y: number, z: number) => number): VoxelGrid => {
  const cells = new Uint8Array(X * Y * Z);
  for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) cells[x + y * X + z * X * Y] = fill(x, y, z);
  return { X, Y, Z, cells, alphabet: ['.', 'A', 'F'] };
};
const palette = { A: { color: '#808080' }, F: { color: '#808080', glow: true } };

describe('glowing voxels', () => {
  it('reads glow="True" on a colour, and only there', () => {
    const m = compileMjx(LAMP);
    expect(m.program.palette.F.glow).toBe(true);
    expect(m.program.palette.A.glow).toBeUndefined();
  });

  it('gives the mesh a glow weight only when something glows, 1 on the glowing voxels', () => {
    expect(meshVoxels(grid(2, 1, 1, () => 1), palette, { vpt: 1 }).glow).toBeUndefined();
    const m = meshVoxels(grid(2, 1, 1, (x) => (x ? 2 : 1)), palette, { vpt: 1 });
    expect(m.glow).toBeDefined();
    expect(m.glow!.length).toBe(m.positions.length / 3);
    // The glowing voxel is the one on the right (x from 1 to 2, centred: 0 to 1).
    for (let v = 0; v < m.glow!.length; v++) {
      const x = m.positions[v * 3];
      if (m.glow![v]) expect(x).toBeGreaterThanOrEqual(0);
      else expect(x).toBeLessThanOrEqual(0);
    }
    expect([...m.glow!].filter((g) => g).length).toBe(5 * 4);
  });

  it('does not darken what glows in the corners (ambient occlusion)', () => {
    // A floor with a column in a corner: the floor's top darkens where the column meets it, unless it
    // glows (then only the grain, 0.93-1.03).
    const sides = (letter: number) => {
      const m = meshVoxels(grid(2, 2, 2, (x, y, z) => (z === 0 ? letter : x === 0 && y === 0 ? 1 : 0)), palette, { vpt: 1 });
      let min = Infinity;
      for (let v = 0; v < m.colors.length / 3; v++) if (m.normals[v * 3 + 1] === 1) min = Math.min(min, m.colors[v * 3]);
      return min;
    };
    const grey = Math.pow(0x80 / 255, 2.2);
    expect(sides(1)).toBeLessThan(grey * 0.9);
    expect(sides(2)).toBeGreaterThan(grey * 0.92);
  });

  it('is not shaded in the photos (its front is as bright as its top)', () => {
    const g = { X: 1, Y: 1, Z: 1, cells: new Uint8Array([1]), alphabet: ['.', 'A'], log: [] as number[], epoch: 0 };
    const fronts = (glow: boolean) => {
      const r = paint(g, { A: { color: '#808080', ...(glow ? { glow: true } : {}) } }, 0);
      const px: number[] = [];
      for (let i = 0; i < r.kind.length; i++) if (r.kind[i] === 2) px.push(r.data[i * 4]);
      return [Math.min(...px), Math.max(...px)];
    };
    const [lo, hi] = fronts(false);
    expect(lo).toBeLessThan(hi);
    const [glo, ghi] = fronts(true);
    expect(glo).toBe(ghi);
  });

  it('tells the Sculptor which letters of a model give light (to light or put out)', () => {
    const { letters } = actionLetters(LAMP, classOf('oggetto')!);
    expect(letters.find((l) => l.lettera === 'F')?.luce).toBe(true);
    expect(letters.find((l) => l.lettera === 'A')?.luce).toBeUndefined();
  });

  it('lights the flames of the seed bonfire', () => {
    const m = compileMjx(readFileSync('universe/models/falo.xml', 'utf8'));
    const glowing = Object.entries(m.program.palette).filter(([, e]) => e.glow).map(([k]) => k).sort();
    expect(glowing).toEqual(['O', 'R', 'Y', 'e'].sort());
  });
});
