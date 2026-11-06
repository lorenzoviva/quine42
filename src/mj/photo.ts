// Photographs a voxel model the way the game looks at the world: 3/4 top-down, camera to the south,
// sun to the north-west (shadows fall south-east, as the style guide asks). Pure RGBA buffers, so the
// same code runs in the browser and in Node.
//
// A voxel shows its top face (`top` pixels deep) and its front face (`front` pixels tall); the object is
// turned around z for the four views. Views: 0 front (facing the camera), 1 right (facing right, its
// right flank towards us), 2 back, 3 left.

import { AIR, type Grid3, type PaletteEntry } from './engine';
import { partTable } from './mesh';
import { SUN_FROM, toLinear, toonTones, toSrgb } from './toonlight';

export interface RenderOptions {
  /** Pixels per voxel along x. */
  px: number;
  /** Pixels per voxel of depth (top faces). */
  top: number;
  /** Pixels per voxel of height (front faces). */
  front: number;
  outline: boolean;
  shadow: boolean;
  /** Self-shadowing and ambient occlusion. */
  light: boolean;
  /** Crop to what is drawn (plus one pixel). */
  crop: boolean;
  /** Where the shadow falls, per voxel of height: [east, south]. The style guide wants it short, to the south-east. */
  sun?: [number, number];
  /** As the world looks (ADR-0093): flat tones in the bands, tinted shadows, ink where a part changes, in place of the classic light and contours. */
  cartoon?: boolean;
}

export const DEFAULT_SUN: [number, number] = [0.18, 0.22];
export const DEFAULT_RENDER: RenderOptions = { px: 1, top: 1, front: 1, outline: true, shadow: true, light: true, crop: true, sun: DEFAULT_SUN };

/** The world's sun as a shadow per voxel of height: to the east and, the sun being south-west, towards the back. */
const WORLD_SUN: [number, number] = [-SUN_FROM[0] / SUN_FROM[1], -SUN_FROM[2] / SUN_FROM[1]];

/** The photographs of the models as the world draws them; `px` pixels per voxel, enough for the ink to be a line and not whole voxels. */
export const cartoonRender = (px = 4): RenderOptions => ({ ...DEFAULT_RENDER, px, top: px, front: px, sun: WORLD_SUN, cartoon: true });

/** The sun over a day, for shadows that move: morning to the west, noon short, evening long to the east. */
export const DAY: Array<{ name: string; sun: [number, number] }> = [
  { name: 'mattina', sun: [-0.7, 0.3] },
  { name: 'mezzogiorno', sun: [0.1, 0.2] },
  { name: 'pomeriggio', sun: [0.45, 0.35] },
  { name: 'sera', sun: [1.1, 0.4] },
];

export interface Picture {
  w: number;
  h: number;
  data: Uint8ClampedArray;
}

export const VIEWS = ['front', 'right', 'back', 'left'] as const;

type Rgb = [number, number, number];

export function parseColor(c: string | undefined): Rgb | null {
  if (typeof c !== 'string') return null;
  let m = /^#?([0-9a-f]{6})$/i.exec(c.trim());
  if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
  m = /^#?([0-9a-f]{3})$/i.exec(c.trim());
  if (m) return [...m[1]].map((h) => parseInt(h + h, 16)) as Rgb;
  return null;
}

/** The model turned so that its front faces `view` (see VIEWS); returns codes per cell and new sizes. */
export function turn(g: Grid3, view: number): { X: number; Y: number; Z: number; cells: Uint8Array } {
  const v = ((view % 4) + 4) % 4;
  const X = v % 2 ? g.Y : g.X;
  const Y = v % 2 ? g.X : g.Y;
  const cells = new Uint8Array(g.cells.length);
  for (let z = 0; z < g.Z; z++)
    for (let y = 0; y < g.Y; y++)
      for (let x = 0; x < g.X; x++) {
        // Front (+y) goes to: 0 +y, 1 +x, 2 -y, 3 -x; always a rotation, never a mirror.
        const [nx, ny] = v === 0 ? [x, y] : v === 1 ? [y, g.X - 1 - x] : v === 2 ? [g.X - 1 - x, g.Y - 1 - y] : [g.Y - 1 - y, x];
        cells[nx + ny * X + z * X * Y] = g.cells[x + y * g.X + z * g.X * g.Y];
      }
  return { X, Y, Z: g.Z, cells };
}

/** A painted picture before contours and cropping, with what each pixel is and how near it is. */
export interface Raster extends Picture {
  /** 0 empty, 1 ground shadow, 2 model, 3 contour. */
  kind: Uint8Array;
  /** y + z of the voxel each model pixel belongs to: larger is nearer the camera. */
  near: Int16Array;
  /** Where voxel (0, 0, 0)'s top face starts: x, and y of the ground row. */
  ox: number;
  oy: number;
  /** The part of the model each pixel belongs to (`partTable`), what the ink follows. */
  part: Uint8Array;
  /** 1 where a pixel gives light: it takes no ink. */
  glow: Uint8Array;
}

/** The tint and the opacity of a cast shadow on the ground, in the cartoon: cold, not black. */
const TOON_GROUND_SHADOW = { rgb: [34, 44, 92], alpha: 96 } as const;

/** Depth (y + z, in voxels) where the ink draws inside one part: a real step, not the voxels of a crown. About what the world's `uDepthEdge` starts from. */
const INK_JUMP = 12;

/** The ink's colour, in linear RGB, over the pixel's colour: the same as the shader of `Ink`. */
const INK_KEEP = 0.18;
const INK_FLOOR = [0.03, 0.03, 0.05] as const;
const INK_MIX = 0.9;

export function render(g: Grid3, palette: Record<string, PaletteEntry>, view: number, o: RenderOptions = DEFAULT_RENDER): Picture {
  const r = paint(g, palette, view, o);
  if (o.outline) {
    if (o.cartoon) inkRaster(r);
    else outline(r);
  }
  const pic = { w: r.w, h: r.h, data: r.data };
  return o.crop ? crop(pic) : pic;
}

/** The faces of the model, lit and shaded, with its shadow; no contours, not cropped. */
export function paint(g: Grid3, palette: Record<string, PaletteEntry>, view: number, o: RenderOptions = DEFAULT_RENDER): Raster {
  const t = turn(g, view);
  const [sx, sy] = o.sun ?? DEFAULT_SUN;
  const colors = g.alphabet.map((c) => (c === AIR || palette[c]?.hidden ? null : parseColor(palette[c]?.color)));
  const XY = t.X * t.Y;
  const solid = (x: number, y: number, z: number) => x >= 0 && y >= 0 && z >= 0 && x < t.X && y < t.Y && z < t.Z && colors[t.cells[x + y * t.X + z * XY]] !== null;
  const lit = (x: number, y: number, z: number) => {
    for (let s = 1; s < 3 * t.Z; s++) {
      const px = Math.round(x - sx * s * 0.5), py = Math.round(y - sy * s * 0.5), pz = Math.round(z + s * 0.5);
      if (pz >= t.Z || px < 0 || py < 0 || px >= t.X || py >= t.Y) return true;
      if (pz >= 0 && solid(px, py, pz)) return false;
    }
    return true;
  };

  // Room around the model for the shadow it casts.
  const mx = o.shadow ? Math.ceil(Math.abs(sx) * t.Z) + 1 : 0;
  const my = o.shadow ? Math.ceil(Math.abs(sy) * t.Z) + 1 : 0;
  const ox = 1 + mx * o.px;
  const W = (t.X + 2 * mx) * o.px + 2;
  const H = (t.Y + 2 * my) * o.top + t.Z * o.front + 2;
  const data = new Uint8ClampedArray(W * H * 4);
  /** 0 empty, 1 ground shadow, 2 model. */
  const kind = new Uint8Array(W * H);
  const near = new Int16Array(W * H);
  const part = new Uint8Array(W * H);
  const glowing = new Uint8Array(W * H);
  const parts = partTable(g.alphabet, palette);
  const oy = 1 + t.Z * o.front + my * o.top;
  const rect = (x0: number, y0: number, w: number, h: number, c: Rgb, n: number, letter: number, glows: boolean) => {
    for (let y = Math.max(0, y0); y < Math.min(H, y0 + h); y++)
      for (let x = Math.max(0, x0); x < Math.min(W, x0 + w); x++) {
        const i = y * W + x;
        data[i * 4] = c[0];
        data[i * 4 + 1] = c[1];
        data[i * 4 + 2] = c[2];
        data[i * 4 + 3] = 255;
        kind[i] = 2;
        near[i] = n;
        part[i] = parts[letter];
        glowing[i] = glows ? 1 : 0;
      }
  };

  if (o.shadow) {
    // Every voxel projected on the ground along the sun.
    const GW = t.X + 2 * mx, GH = t.Y + 2 * my;
    const ground = new Uint8Array(GW * GH);
    for (let i = 0; i < t.cells.length; i++) {
      if (!colors[t.cells[i]]) continue;
      const x = i % t.X, y = Math.floor(i / t.X) % t.Y, z = Math.floor(i / XY);
      const gx = Math.round(x + sx * (z + 0.5)) + mx, gy = Math.round(y + sy * (z + 0.5)) + my;
      if (gx >= 0 && gy >= 0 && gx < GW && gy < GH) ground[gx + gy * GW] = 1;
    }
    for (let gy = 0; gy < GH; gy++)
      for (let gx = 0; gx < GW; gx++) {
        if (!ground[gx + gy * GW] || solid(gx - mx, gy - my, 0)) continue;
        for (let py = 0; py < o.top; py++)
          for (let px = 0; px < o.px; px++) {
            const i = (oy + (gy - my) * o.top + py) * W + ox - mx * o.px + gx * o.px + px;
            if (i < 0 || i >= W * H) continue;
            if (o.cartoon) data.set([...TOON_GROUND_SHADOW.rgb, TOON_GROUND_SHADOW.alpha], i * 4);
            else data[i * 4 + 3] = 70;
            kind[i] = 1;
          }
      }
  }

  const shade = (c: Rgb, k: number): Rgb => [c[0] * k, c[1] * k, c[2] * k];
  const tones = o.cartoon ? toonTones() : undefined;
  const toned = (c: Rgb, tone: readonly [number, number, number]): Rgb => [0, 1, 2].map((ch) => toSrgb(toLinear(c[ch] / 255) * tone[ch]) * 255) as Rgb;
  for (let y = 0; y < t.Y; y++)
    for (let z = 0; z < t.Z; z++)
      for (let x = 0; x < t.X; x++) {
        const c = colors[t.cells[x + y * t.X + z * XY]];
        if (!c) continue;
        const topOpen = !solid(x, y, z + 1);
        const frontOpen = !solid(x, y + 1, z);
        if (!topOpen && !frontOpen) continue;
        const left = ox + x * o.px;
        const n = y + z;
        const letter = t.cells[x + y * t.X + z * XY];
        if (tones) {
          // Flat tones, as the bands: what gives light keeps its own colour on every face.
          const gives = !!palette[g.alphabet[letter]]?.glow;
          // From the air in front of each face: a wall is not in the shade of the voxels above it.
          const topDark = !gives && o.light && !lit(x, y, z + 1);
          const frontDark = !gives && o.light && !lit(x, y + 1, z);
          if (topOpen) rect(left, oy + y * o.top - (z + 1) * o.front, o.px, o.top, gives ? c : toned(c, topDark ? tones.topInShadow : tones.top), n, letter, gives);
          if (frontOpen) rect(left, oy + (y + 1) * o.top - (z + 1) * o.front, o.px, o.front, gives ? c : toned(c, frontDark ? tones.frontInShadow : tones.front), n, letter, gives);
          continue;
        }
        let k = 1;
        let shadeFront = 0.8;
        // What glows is not shaded: it is its own light.
        const glow = !!palette[g.alphabet[t.cells[x + y * t.X + z * XY]]]?.glow;
        if (glow) shadeFront = 1;
        else if (o.light) {
          // In the shade of something else: tops darken a lot, fronts (always half in shade) a little.
          if (!lit(x, y, z)) {
            k *= 0.72;
            shadeFront = 0.8 / 0.72 * 0.88;
          }
          let occ = 0;
          for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) if (solid(x + dx, y + dy, z + 1)) occ++;
          k *= 1 - occ * 0.035;
        }
        if (topOpen) {
          const sy = oy + y * o.top - (z + 1) * o.front;
          rect(left, sy, o.px, o.top, shade(c, k * (o.light && !glow && !solid(x, y - 1, z) && !solid(x, y - 1, z + 1) ? 1.06 : 1)), n, letter, glow);
        }
        if (frontOpen) {
          const sy = oy + (y + 1) * o.top - (z + 1) * o.front;
          rect(left, sy, o.px, o.front, shade(c, k * shadeFront), n, letter, glow);
        }
      }

  return { w: W, h: H, data, kind, near, ox, oy, part, glow: glowing };
}

/**
 * The ink of the cartoon on a painted picture, by the same rule as the world's (`Ink`, ADR-0093): one pixel on each side of where
 * the part changes, of the silhouette, or of a real step in depth; never over what gives light; the colour is the pixel's own, much darker.
 */
export function inkRaster(r: Raster): void {
  const { w: W, h: H, data, kind, near, part, glow } = r;
  /** Whose colour the ink over each pixel takes, plus one; 0 where there is no ink. */
  const from = new Int32Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (kind[i] === 2 && glow[i]) continue;
      const around = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1];
      for (const j of around) {
        if (j < 0) continue;
        if (kind[i] === 2) {
          if (kind[j] !== 2 || part[j] !== part[i] || Math.abs(near[j] - near[i]) >= INK_JUMP) from[i] = i + 1;
        } else if (kind[j] === 2 && !glow[j]) from[i] = j + 1;
      }
    }
  const source = data.slice();
  for (let i = 0; i < W * H; i++) {
    if (!from[i]) continue;
    const s = (from[i] - 1) * 4;
    for (let ch = 0; ch < 3; ch++) {
      const c = toLinear(source[s + ch] / 255);
      data[i * 4 + ch] = toSrgb(c + (c * INK_KEEP + INK_FLOOR[ch] - c) * INK_MIX) * 255;
    }
    data[i * 4 + 3] = 255;
    if (kind[i] !== 2) kind[i] = 3;
  }
}

/** Contours where a nearer surface covers a farther one, then around the whole silhouette. */
export function outline(r: Raster): void {
  const { w: W, h: H, data, kind, near } = r;
  {
    const dark = new Uint8Array(W * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (kind[i] !== 2) continue;
        for (const j of [i - 1, i + 1, i - W, i + W]) if (j >= 0 && j < W * H && kind[j] === 2 && near[j] >= near[i] + 3) dark[i] = 1;
      }
    for (let i = 0; i < W * H; i++) if (dark[i]) for (let ch = 0; ch < 3; ch++) data[i * 4 + ch] *= 0.62;
    const edge: number[] = [];
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (kind[i] === 2) continue;
        if ((x > 0 && kind[i - 1] === 2) || (x < W - 1 && kind[i + 1] === 2) || (y > 0 && kind[i - W] === 2) || (y < H - 1 && kind[i + W] === 2)) edge.push(i);
      }
    for (const i of edge) {
      data.set([28, 20, 30, 255], i * 4);
      kind[i] = 3;
    }
  }
}

export function crop(p: Picture, pad = 1): Picture {
  let x0 = p.w, y0 = p.h, x1 = -1, y1 = -1;
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++)
      if (p.data[(y * p.w + x) * 4 + 3]) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
  if (x1 < 0) return { w: 1, h: 1, data: new Uint8ClampedArray(4) };
  x0 = Math.max(0, x0 - pad);
  y0 = Math.max(0, y0 - pad);
  x1 = Math.min(p.w - 1, x1 + pad);
  y1 = Math.min(p.h - 1, y1 + pad);
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) data.set(p.data.subarray(((y0 + y) * p.w + x0) * 4, ((y0 + y) * p.w + x0 + w) * 4), y * w * 4);
  return { w, h, data };
}

/** Several pictures side by side on one sheet (bottoms aligned), scaled by an integer factor. */
export function sheet(pics: Picture[], scale = 1, gap = 4, background: Rgb | null = null): Picture {
  const h = Math.max(...pics.map((p) => p.h));
  const w = pics.reduce((s, p) => s + p.w, 0) + gap * (pics.length + 1);
  const W = w * scale, H = (h + 2 * gap) * scale;
  const data = new Uint8ClampedArray(W * H * 4);
  if (background) for (let i = 0; i < W * H; i++) data.set([...background, 255], i * 4);
  let ox = gap;
  for (const p of pics) {
    const oy = gap + h - p.h;
    for (let y = 0; y < p.h; y++)
      for (let x = 0; x < p.w; x++) {
        const s = (y * p.w + x) * 4;
        const a = p.data[s + 3] / 255;
        if (!a) continue;
        for (let sy = 0; sy < scale; sy++)
          for (let sx = 0; sx < scale; sx++) {
            const d = (((oy + y) * scale + sy) * W + (ox + x) * scale + sx) * 4;
            for (let c = 0; c < 3; c++) data[d + c] = data[d + c] * (1 - a) + p.data[s + c] * a;
            data[d + 3] = Math.max(data[d + 3], p.data[s + 3]);
          }
      }
    ox += p.w + gap;
  }
  return { w: W, h: H, data };
}

/** Nearest-neighbour resize to a width (no larger than the picture). */
export function shrink(p: Picture, w: number): Picture {
  if (p.w <= w) return p;
  const k = w / p.w;
  const h = Math.max(1, Math.round(p.h * k));
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const s = (Math.floor(y / k) * p.w + Math.floor(x / k)) * 4;
      data.set(p.data.subarray(s, s + 4), (y * w + x) * 4);
    }
  return { w, h, data };
}

/** A rectangle of a picture (moved inside it if it sticks out). */
export function region(p: Picture, x0: number, y0: number, w: number, h: number): Picture {
  w = Math.min(w, p.w);
  h = Math.min(h, p.h);
  x0 = Math.max(0, Math.min(p.w - w, Math.round(x0)));
  y0 = Math.max(0, Math.min(p.h - h, Math.round(y0)));
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) data.set(p.data.subarray(((y0 + y) * p.w + x0) * 4, ((y0 + y) * p.w + x0 + w) * 4), y * w * 4);
  return { w, h, data };
}
