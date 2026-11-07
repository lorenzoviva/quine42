// The photographs of the Jev bench with images (T324): what the Artist looks at (`views()` in src/kernel/agents/sculptor.ts, the
// four sides in 3/4 as the world draws them, ADR-0093), and the same views cut in other ways: the front alone, the four sides as a
// 2×2 grid, the sides as four pictures. Pure RGBA buffers written as PNG; TypeSafe takes 280 to 1568 pixels a side, so a picture
// smaller than that is padded with the sheet's own background, never scaled (the ink stays a line one voxel thin).

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { cartoonRender, render, sheet, type Picture, type RenderOptions } from '../../../src/mj/photo';
import { png } from '../../scripts/png';
import { compileMjx, type MjxModel } from '../../../src/mj/model';
import { FORM_LIMITS, runMjx } from '../../../src/mj/run';
import { FormCache, Forms, InlineRunner, MODEL_TIME } from '../../../src/kernel/forms';
import type { Grid3 } from '../../../src/mj/engine';
import { ROOT } from './domande';

/** The background of the Artist's sheet (sculptor.ts → views). */
export const BACKGROUND: [number, number, number] = [112, 150, 84];
/** TypeSafe's limits (docs.typesafe.ai/images.md, read on 2026-11-07): each side 280 to 1568 pixels. */
export const MIN_SIDE = 280;
export const MAX_SIDE = 1568;

export const FORMS = ['lati4', 'lato1', 'griglia', 'separate'] as const;
export type PhotoForm = (typeof FORMS)[number];

/** Where the photographs go: generated, not committed (lab/out is ignored by git), the same at every `--prepara immagini`. */
export const PHOTO_DIR = path.join(ROOT, 'lab/out/jev/foto');

/** The pixels per voxel the Artist's sheet uses: as large as fits 1024 pixels for the four sides, between 2 and 6. */
export function artistPx(grid: Grid3, palette: MjxModel['program']['palette']): number {
  const w = [0, 1, 2, 3].map((v) => render(grid, palette, v, { ...cartoonRender(1), outline: false })).reduce((s, v) => s + v.w + 4, 4);
  return Math.max(2, Math.min(6, Math.floor(1024 / w)));
}

/** A picture padded (centred, the background around) so that each side is at least `MIN_SIDE` pixels. */
export function padded(p: Picture, min = MIN_SIDE, background = BACKGROUND): Picture {
  if (p.w >= min && p.h >= min) return p;
  const W = Math.max(min, p.w);
  const H = Math.max(min, p.h);
  const data = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) data.set([...background, 255], i * 4);
  const ox = Math.floor((W - p.w) / 2);
  const oy = Math.floor((H - p.h) / 2);
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      const s = (y * p.w + x) * 4;
      const a = p.data[s + 3] / 255;
      const d = ((oy + y) * W + ox + x) * 4;
      for (let c = 0; c < 3; c++) data[d + c] = data[d + c] * (1 - a) + p.data[s + c] * a;
      data[d + 3] = 255;
    }
  return { w: W, h: H, data };
}

/** Two sheets one above the other (the 2×2 grid: front and right above, back and left below). */
function stack(top: Picture, bottom: Picture, background = BACKGROUND): Picture {
  const W = Math.max(top.w, bottom.w);
  const H = top.h + bottom.h;
  const data = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) data.set([...background, 255], i * 4);
  const put = (p: Picture, oy: number) => {
    const ox = Math.floor((W - p.w) / 2);
    for (let y = 0; y < p.h; y++) data.set(p.data.subarray(y * p.w * 4, (y + 1) * p.w * 4), ((oy + y) * W + ox) * 4);
  };
  put(top, 0);
  put(bottom, top.h);
  return { w: W, h: H, data };
}

/** Opaque everywhere: what the sheet leaves transparent becomes the background (a PNG without alpha surprises). */
function opaque(p: Picture, background = BACKGROUND): Picture {
  const data = new Uint8ClampedArray(p.data);
  for (let i = 0; i < p.w * p.h; i++) {
    const a = data[i * 4 + 3] / 255;
    for (let c = 0; c < 3; c++) data[i * 4 + c] = data[i * 4 + c] * a + background[c] * (1 - a);
    data[i * 4 + 3] = 255;
  }
  return { ...p, data };
}

export interface Shot {
  /** The pictures of a form: one, or four for `separate` (front, right, back, left). */
  pictures: Picture[];
  px: number;
}

/** The photographs of a grid in one form, at the Artist's pixels per voxel. */
export function shoot(grid: Grid3, palette: MjxModel['program']['palette'], form: PhotoForm, px = artistPx(grid, palette)): Shot {
  const o: RenderOptions = cartoonRender(px);
  const sides = [0, 1, 2, 3].map((v) => render(grid, palette, v, o));
  const gap = 4 * px;
  const one = (pics: Picture[]) => opaque(sheet(pics, 1, gap, BACKGROUND));
  let pictures: Picture[];
  if (form === 'lati4') pictures = [one(sides)];
  else if (form === 'lato1') pictures = [one([sides[0]])];
  else if (form === 'griglia') pictures = [stack(one([sides[0], sides[1]]), one([sides[2], sides[3]]))];
  else pictures = sides.map((s) => one([s]));
  return { pictures: pictures.map((p) => padded(p)), px };
}

/** The PNG of a picture, compressed (the game's own encoder stores it raw: the pixels are the same, the bytes four times fewer). */
export const pngBytes = (p: Picture): Buffer => png(p);
export const hashOf = (b: Buffer): string => createHash('sha256').update(b).digest('hex').slice(0, 12);

/** Writes a picture under PHOTO_DIR; the path relative to the root of the repository, and the hash of its bytes. */
export function save(p: Picture, name: string): { file: string; hash: string; w: number; h: number } {
  const bytes = pngBytes(p);
  const file = path.join(PHOTO_DIR, `${name}.png`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, bytes);
  return { file: path.relative(ROOT, file).replace(/\\/g, '/'), hash: hashOf(bytes), w: p.w, h: p.h };
}

// ------------------------------------------------------------------------------------------------ the library's models

/** The seed's library as the game runs it: every program with its class's box, its cellar, its time. */
export function seedForms(): Forms {
  const dir = path.join(ROOT, 'universe/models');
  const files: Record<string, string> = {};
  for (const f of fs.readdirSync(dir)) if (f.endsWith('.xml') || f === 'index.json') files[`models/${f}`] = fs.readFileSync(path.join(dir, f), 'utf8');
  const forms = new Forms(new InlineRunner(new FormCache()));
  forms.load(files);
  return forms;
}

/** A model of the library run with a seed, as the world would show it. */
export function runLibraryModel(forms: Forms, id: string, seed = 1): { model: MjxModel; grid: Grid3 } | undefined {
  const q = forms.request(id, seed);
  if (!q) return undefined;
  const model = compileMjx(q.xml, { ...(q.size ? { size: q.size } : {}), ...(q.base ? { base: q.base } : {}) });
  const result = runMjx(model, seed, { deadline: q.tempo ?? MODEL_TIME, limits: FORM_LIMITS });
  return { model, grid: result.grid };
}
