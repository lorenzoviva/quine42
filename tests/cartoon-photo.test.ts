// The photographs of the models as the world draws them (ADR-0093, T89d): bands, tinted shadows, ink. What they look like beside the world is checked in the browser.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { checkProgram, views } from '../src/kernel/agents/sculptor';
import { classOf } from '../src/mj/classes';
import type { Grid3, PaletteEntry } from '../src/mj/engine';
import { cartoonRender, DEFAULT_RENDER, inkRaster, paint, render, type Raster } from '../src/mj/photo';
import { BAND_LEVELS, bandOf, CARTOON_HEMI, cartoonLight, SHADOW_INTENSITY, SUN_FROM } from '../src/render/cartoon';
import { BAND_LEVELS as LIGHT_BANDS, DAY_LIGHT, toonTones } from '../src/mj/toonlight';

const grid = (X: number, Y: number, Z: number, alphabet: string[], fill: (x: number, y: number, z: number) => number): Grid3 => {
  const cells = new Uint8Array(X * Y * Z);
  for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) cells[x + y * X + z * X * Y] = fill(x, y, z);
  return { X, Y, Z, cells, alphabet, log: [], epoch: 0 } as unknown as Grid3;
};

const at = (r: { w: number; data: Uint8ClampedArray }, x: number, y: number) => [...r.data.subarray((y * r.w + x) * 4, (y * r.w + x) * 4 + 4)];
const luma = (c: number[]) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];

/** Tones, counted among what the model paints. */
const colours = (r: Raster) => {
  const out = new Set<string>();
  for (let i = 0; i < r.w * r.h; i++) if (r.kind[i] === 2) out.add(String([...r.data.subarray(i * 4, i * 4 + 3)]));
  return out;
};

const px = 4;
const noShadow = { ...cartoonRender(px), shadow: false };

describe('the tones of the photographs', () => {
  it('come from the same daylight the world has', () => {
    expect(LIGHT_BANDS).toBe(BAND_LEVELS);
    expect(DAY_LIGHT.sky).toBe(CARTOON_HEMI.sky);
    expect(cartoonLight(1).shade).toEqual([...DAY_LIGHT.shade]);
  });

  it('a top has the full light and a front the half-light, the bands the world gives them', () => {
    const cos = (n: readonly number[]) => (n[0] * SUN_FROM[0] + n[1] * SUN_FROM[1] + n[2] * SUN_FROM[2]) / Math.hypot(...SUN_FROM);
    expect(bandOf(cos([0, 1, 0]))).toBe(2);
    expect(bandOf(cos([0, 0, 1]))).toBe(1);
    const t = toonTones();
    expect(t.top[1]).toBeGreaterThan(t.front[1]);
  });

  it('what lies in shadow is darker and colder, not grey', () => {
    const t = toonTones();
    expect(t.topInShadow[1]).toBeLessThan(t.top[1]);
    expect(t.topInShadow[2] / t.topInShadow[0]).toBeGreaterThan(t.top[2] / t.top[0]);
    expect(SHADOW_INTENSITY).toBeCloseTo(1 - BAND_LEVELS[0]);
  });
});

describe('a photograph as the world draws it', () => {
  const block = grid(4, 4, 4, ['.', 'W'], () => 1);
  const palette: Record<string, PaletteEntry> = { W: { color: '#c0a080' } };

  it('a plain block has flat tones: one for the top, one for the front, and its wall is not in its own shade', () => {
    const r = paint(block, palette, 0, noShadow);
    expect(colours(r).size).toBe(2);
  });

  it('a block of one colour has ink only along its silhouette, in its own colour darkened and not in black', () => {
    const r = paint(block, palette, 0, noShadow);
    const before = colours(r).size;
    inkRaster(r);
    let line = 0;
    for (let i = 0; i < r.w * r.h; i++) if (r.kind[i] === 3) line++;
    expect(line).toBeGreaterThan(0);
    const mid = at(r, r.ox + 2 * px, r.oy + 2 * px);
    expect(new Set(colours(r)).size).toBeGreaterThan(before);
    const edge = at(r, r.ox - 1, r.oy);
    expect(edge[3]).toBe(255);
    expect(luma(edge)).toBeLessThan(luma(mid) * 0.75);
    expect(edge[0]).toBeGreaterThan(edge[2]);
  });

  it('the ink follows parts: a line between two colours, none between two shades of one', () => {
    const lineBetween = (a: string, b: string) => {
      const g = grid(4, 1, 1, ['.', 'A', 'B'], (x) => (x < 2 ? 1 : 2));
      const r = paint(g, { A: { color: a }, B: { color: b } }, 0, noShadow);
      const y = r.oy + Math.floor(px / 2) - px;
      const plain = at(r, r.ox + 1 * px - 1, y);
      inkRaster(r);
      const left = at(r, r.ox + 2 * px - 1, y);
      return luma(left) < luma(plain) * 0.75;
    };
    expect(lineBetween('#c0a080', '#3050c0')).toBe(true);
    expect(lineBetween('#508040', '#5a8a48')).toBe(false);
  });

  it('never over what gives light', () => {
    const g = grid(4, 1, 1, ['.', 'W', 'F'], (x) => (x < 2 ? 1 : 2));
    const r = paint(g, { W: { color: '#404040' }, F: { color: '#ffcc66', glow: true } }, 0, noShadow);
    const y = r.oy + Math.floor(px / 2) - px;
    const flame = at(r, r.ox + 2 * px, y);
    inkRaster(r);
    expect(at(r, r.ox + 2 * px, y)).toEqual(flame);
    expect(flame.slice(0, 3)).toEqual([255, 204, 102]);
    expect(luma(at(r, r.ox + 2 * px - 1, y))).toBeLessThan(luma(flame));
  });

  it('a voxel in the shade of another takes the shadow tone, and the shadow on the ground is cold', () => {
    const tower = grid(3, 3, 6, ['.', 'W'], (x, y, z) => (z === 0 || (x === 0 && y === 0) ? 1 : 0));
    const lit = paint(tower, palette, 0, { ...noShadow, shadow: true, light: false });
    const shaded = paint(tower, palette, 0, { ...noShadow, shadow: true, light: true });
    expect(colours(shaded).size).toBeGreaterThan(colours(lit).size);
    const ground = Array.from({ length: shaded.w * shaded.h }, (_, i) => i).find((i) => shaded.kind[i] === 1)!;
    const [r, , b, a] = shaded.data.subarray(ground * 4, ground * 4 + 4);
    expect(b).toBeGreaterThan(r);
    expect(a).toBeGreaterThan(0);
  });

  it('the classic photographs stay as they were', () => {
    const r = paint(block, palette, 0, DEFAULT_RENDER);
    const shadow = Array.from({ length: r.w * r.h }, (_, i) => i).find((i) => r.kind[i] === 1)!;
    expect([...r.data.subarray(shadow * 4, shadow * 4 + 4)]).toEqual([0, 0, 0, 70]);
    const pic = render(block, palette, 0, { ...DEFAULT_RENDER, crop: false });
    expect(at(pic, r.ox - 1, r.oy)).toEqual([28, 20, 30, 255]);
  });
});

describe('who looks at the photographs', () => {
  it('the Artist gets a sheet of the four sides, no larger than the classic one', () => {
    const cls = classOf('tree')!;
    const checked = checkProgram(bundledFiles['models/tree.xml'], cls);
    expect(checked.error).toBeUndefined();
    const url = views(checked);
    expect(url.startsWith('data:image/png;base64,')).toBe(true);
    const png = Buffer.from(url.split(',')[1], 'base64');
    expect(png.readUInt32BE(16)).toBeLessThanOrEqual(1024 + 64);
  });
});

describe('the prompts', () => {
  it('ask for what the contours can draw', () => {
    expect(bundledFiles['world/style.md']).toMatch(/un colore pieno per parte/);
    expect(bundledFiles['prompts/agents/sculptor.md']).toMatch(/lettera scura dedicata/);
    expect(bundledFiles['prompts/agents/sculptor.md']).not.toMatch(/uno scuro \(crepe, ombre\)/);
    expect(bundledFiles['prompts/agents/artist.md']).toMatch(/si leggono a contorni/);
  });
});
