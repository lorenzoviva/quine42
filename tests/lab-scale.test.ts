// The voxels a tile of the 3D sandbox (T403): what a typed value is, the address that keeps it, what a model measures at it.

import { describe, expect, it } from 'vitest';
import { measureAt, readVpt, scaleFrom, showcaseDistance, shownVpt, withScale } from '../lab/3d/scale';

describe('the voxels a tile of the sandbox (T403)', () => {
  it('takes a whole number from 2 to 40, else the model keeps its own', () => {
    expect(readVpt('5')).toBe(5);
    expect(readVpt(20)).toBe(20);
    for (const bad of ['', ' ', '0', '1', '41', '7.5', 'abc', null, undefined, NaN, Infinity]) expect(readVpt(bad)).toBeUndefined();
    expect(shownVpt(20, undefined)).toBe(20);
    expect(shownVpt(20, 5)).toBe(5);
  });

  it('is kept in the address, as the look is', () => {
    expect(scaleFrom('?vpt=10&classica')).toBe(10);
    expect(scaleFrom('?vpt=')).toBeUndefined();
    expect(scaleFrom('')).toBeUndefined();
    const url = withScale('http://127.0.0.1:4173/lab/3d/?modello=casa', 5);
    expect(new URL(url).searchParams.get('vpt')).toBe('5');
    expect(new URL(url).searchParams.get('modello')).toBe('casa');
    expect(new URL(withScale(url, undefined)).searchParams.has('vpt')).toBe(false);
  });

  it('measures the fort of 500 voxels in tiles and wanderers at 20, 10 and 5', () => {
    const box: [number, number, number] = [500, 500, 148];
    expect(measureAt(box, 20).tiles).toEqual([25, 25, 7.4]);
    expect(measureAt(box, 5).tiles).toEqual([100, 100, 29.6]);
    // The wanderer is 1.5 tiles: 30 voxels at 20.
    expect(measureAt([20, 15, 30], 20).wanderers).toBe(1);
    expect(measureAt(box, 10).text).toMatch(/^10 voxel per casella: 50 × 50 caselle/);
  });

  it('puts a model as far as half its diagonal and a tile and a half', () => {
    expect(showcaseDistance([500, 500, 148], 5)).toBeCloseTo(Math.hypot(100, 100) / 2 + 1.5);
    expect(showcaseDistance([20, 15, 30], 20)).toBeCloseTo(0.625 + 1.5);
  });
});
