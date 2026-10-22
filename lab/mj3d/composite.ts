// Photographs a structure block by block, without building its voxels: each block (in each turn and
// each of its seed variants) is painted once, then the paintings are laid where the blocks are with a
// depth test, the shadow is cast from a height map, and the contours are drawn once on the whole, so
// that no seam shows. A castle of 100 × 100 tiles is two million voxels a side… and still a few seconds.

import { hash32 } from '../../src/kernel/rng';
import { run, type Grid3 } from './engine';
import { crop, DEFAULT_RENDER, DEFAULT_SUN, outline, paint, type Picture, type Raster, type RenderOptions } from './render';
import { LEVEL, rotateGrid, type Placement } from './structure';
import { TILE } from './scale';
import type { Vec3 } from './engine';

/** The quarter turn of the whole structure for each view (render.ts turns models the other way round). */
const VIEW_TURN = [0, 3, 2, 1];

interface Painted {
  raster: Raster;
  /** Height of the highest visible voxel of each column (T × T), 0 where empty. */
  heights: Uint8Array;
}

export interface CompositeOptions {
  seed?: number;
  /** Seed variants per block, so that walls are not all alike. */
  variants?: number;
  /** Levels shown (to look inside); all by default. */
  cut?: number;
  view?: number;
  render?: RenderOptions;
}

export function renderStructure(placements: Placement[], size: Vec3, opts: CompositeOptions = {}): Picture {
  const o = { ...DEFAULT_RENDER, ...(opts.render ?? {}) };
  const view = ((opts.view ?? 0) % 4 + 4) % 4;
  const turn = VIEW_TURN[view];
  const [BX, BY, BZ] = size;
  const levels = Math.min(BZ, opts.cut || BZ);
  const variants = Math.max(1, opts.variants ?? 3);
  const seed = opts.seed ?? 1;
  const TX = view % 2 ? BY : BX, TY = view % 2 ? BX : BY;
  // Positions as seen from this view (the same turn render.ts gives a model).
  const place = (x: number, y: number): [number, number] => (view === 0 ? [x, y] : view === 1 ? [y, BX - 1 - x] : view === 2 ? [BX - 1 - x, BY - 1 - y] : [BY - 1 - y, x]);

  const runs = new Map<string, Grid3 | null>();
  const painted = new Map<string, Painted | null>();
  const paintedOf = (p: Placement, v: number, rot: number): Painted | null => {
    const key = `${p.block.code}#${v}#${rot}`;
    let out = painted.get(key);
    if (out !== undefined) return out;
    const rk = `${p.block.code}#${v}`;
    let g = runs.get(rk);
    if (g === undefined) {
      try {
        g = run(p.block.program, seed + v * 101).grid;
      } catch {
        g = null;
      }
      runs.set(rk, g);
    }
    if (!g) {
      painted.set(key, null);
      return null;
    }
    const t = rotateGrid(g, rot);
    const raster = paint(t, p.block.program.palette, 0, { ...o, shadow: false, outline: false, crop: false });
    const vis = t.alphabet.map((c) => !!p.block.program.palette[c]?.color && !p.block.program.palette[c]?.hidden);
    const heights = new Uint8Array(TILE * TILE);
    for (let z = 0; z < t.Z; z++)
      for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) if (vis[t.cells[x + y * TILE + z * TILE * TILE]]) heights[x + y * TILE] = z + 1;
    out = { raster, heights };
    painted.set(key, out);
    return out;
  };

  const [sx, sy] = o.sun ?? DEFAULT_SUN;
  const Ztot = levels * LEVEL;
  const mx = o.shadow ? Math.ceil(Math.abs(sx) * Ztot) + 1 : 0;
  const my = o.shadow ? Math.ceil(Math.abs(sy) * Ztot) + 1 : 0;
  const GXv = TX * TILE, GYv = TY * TILE;
  const W = (GXv + 2 * mx) * o.px + 2;
  const H = (GYv + 2 * my) * o.top + Ztot * o.front + 2;
  const GX = 1 + mx * o.px;
  const GY = 1 + Ztot * o.front + my * o.top;
  const data = new Uint8ClampedArray(W * H * 4);
  const kind = new Uint8Array(W * H);
  const near = new Int16Array(W * H);

  const items = placements
    .filter((p) => p.z < levels)
    .map((p) => {
      const [x, y] = place(p.x, p.y);
      return { p, x, y, z: p.z, rot: (p.rot + turn) % 4, v: hash32(p.x, p.y, p.z, seed) % variants };
    })
    .sort((a, b) => a.y - b.y || a.z - b.z || a.x - b.x);

  if (o.shadow) {
    // Height map of the whole structure, then each column casts its shadow on the open ground.
    const HMW = GXv, HMH = GYv;
    const hm = new Uint16Array(HMW * HMH);
    for (const it of items) {
      const pt = paintedOf(it.p, it.v, it.rot);
      if (!pt) continue;
      for (let y = 0; y < TILE; y++)
        for (let x = 0; x < TILE; x++) {
          const h = pt.heights[x + y * TILE];
          if (!h) continue;
          const i = it.x * TILE + x + (it.y * TILE + y) * HMW;
          hm[i] = Math.max(hm[i], it.z * LEVEL + h);
        }
    }
    const SW = GXv + 2 * mx, SH = GYv + 2 * my;
    const shade = new Uint8Array(SW * SH);
    for (let y = 0; y < HMH; y++)
      for (let x = 0; x < HMW; x++) {
        const h = hm[x + y * HMW];
        for (let k = 1; k <= h; k++) {
          const gx = Math.round(x + sx * k), gy = Math.round(y + sy * k);
          if (gx >= 0 && gy >= 0 && gx < HMW && gy < HMH && hm[gx + gy * HMW]) continue;
          const si = gx + mx + (gy + my) * SW;
          if (gx + mx >= 0 && gy + my >= 0 && gx + mx < SW && gy + my < SH) shade[si] = 1;
        }
      }
    for (let gy = 0; gy < SH; gy++)
      for (let gx = 0; gx < SW; gx++) {
        if (!shade[gx + gy * SW]) continue;
        for (let py = 0; py < o.top; py++)
          for (let px = 0; px < o.px; px++) {
            const i = (GY + (gy - my) * o.top + py) * W + GX + (gx - mx) * o.px + px;
            if (i < 0 || i >= W * H) continue;
            data[i * 4 + 3] = 70;
            kind[i] = 1;
          }
      }
  }

  // Each block's painting where the block is; a pixel is kept by whatever is nearest the camera.
  for (const it of items) {
    const pt = paintedOf(it.p, it.v, it.rot);
    if (!pt) continue;
    const r = pt.raster;
    const dx = GX - r.ox + it.x * TILE * o.px;
    const dy = GY - r.oy + it.y * TILE * o.top - it.z * LEVEL * o.front;
    const dn = it.y * TILE + it.z * LEVEL;
    for (let y = 0; y < r.h; y++) {
      const gy = dy + y;
      if (gy < 0 || gy >= H) continue;
      for (let x = 0; x < r.w; x++) {
        const li = y * r.w + x;
        if (r.kind[li] !== 2) continue;
        const gx = dx + x;
        if (gx < 0 || gx >= W) continue;
        const gi = gy * W + gx;
        const n = r.near[li] + dn;
        if (kind[gi] === 2 && n < near[gi]) continue;
        data[gi * 4] = r.data[li * 4];
        data[gi * 4 + 1] = r.data[li * 4 + 1];
        data[gi * 4 + 2] = r.data[li * 4 + 2];
        data[gi * 4 + 3] = 255;
        kind[gi] = 2;
        near[gi] = n;
      }
    }
  }
  const whole: Raster = { w: W, h: H, data, kind, near, ox: GX, oy: GY };
  if (o.outline) outline(whole);
  const pic = { w: W, h: H, data };
  return o.crop ? crop(pic) : pic;
}
