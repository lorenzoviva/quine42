// A surface of the futuristic skin (T284): small letters on a grid of places, the carpet that moves them along their rows, and the
// lights that run over them. Pure: no DOM, so the tests read it as the page does. The lettering and its rule are the proposal's
// (scritta.ts): each row is the small text from its first letter, over the places that hold one, skipping the gaps.

import { LETTERING } from './scritta';

export const GLYPH_W = 3;
export const GLYPH_H = 5;

/**
 * What a place is at a tick. The order is the alphabet of the MarkovJunior grid (lights-mj.ts), so its cells are these states:
 * outside the letters, a small letter at rest, fading, the trail of a head, a head, the front of a wave, behind the front, the next front.
 */
export const STATES = '.DFTHSWN';
export const OUT = 0;
export const DIM = 1;
export const FADE = 2;
export const TRAIL = 3;
export const HEAD = 4;
export const FRONT = 5;
export const WAKE = 6;
export const NEXT = 7;

export interface Surface {
  /** Places across and down: one small letter each. */
  X: number;
  Y: number;
  /** 1 where a small letter is. */
  mask: Uint8Array;
  /** The number of each small letter along its row, from 0; -1 where there is none. */
  order: Int32Array;
  /** Which way the carpet moves each row: 1 to the left, -1 to the right. */
  way: Int8Array;
}

/** A surface from rows of '#' and '.' (the lettering's own rows), one row of places per string. */
export function surfaceOf(rows: readonly string[], ways: (row: number) => 1 | -1 = () => 1): Surface {
  const Y = rows.length;
  const X = Math.max(...rows.map((r) => r.length));
  const mask = new Uint8Array(X * Y);
  const order = new Int32Array(X * Y).fill(-1);
  const way = new Int8Array(Y);
  for (let y = 0; y < Y; y++) {
    way[y] = ways(y);
    let n = 0;
    for (let x = 0; x < X; x++) {
      if (rows[y][x] !== '#') continue;
      mask[x + y * X] = 1;
      order[x + y * X] = n++;
    }
  }
  return { X, Y, mask, order, way };
}

/** The proposal's lettering, from its first small letter to its last, its rows moving one way and the next the other, like the threads of a carpet. */
export function letteringSurface(): Surface {
  const used = (i: number) => LETTERING.rows.some((r) => r[i] === '#');
  const width = Math.max(...LETTERING.rows.map((r) => r.length));
  let from = 0;
  while (from < width && !used(from)) from++;
  let to = width;
  while (to > from && !used(to - 1)) to--;
  return surfaceOf(
    LETTERING.rows.map((r) => r.slice(from, to).padEnd(to - from, '.')),
    (y) => (y % 2 ? -1 : 1),
  );
}

/** A stripe: `rows` full rows of small letters, `places` across. */
export function stripeSurface(places: number, rows: number): Surface {
  const line = '#'.repeat(Math.max(1, places));
  return surfaceOf(Array.from({ length: Math.max(1, rows) }, () => line), (y) => (y % 2 ? -1 : 1));
}

/** The letter of the text at a place after `step` steps of the carpet: the row's text slides along its own small letters. */
export function letterAt(s: Surface, i: number, step: number): number {
  const n = s.order[i];
  if (n < 0) return -1;
  const len = LETTERING.text.length;
  const y = (i / s.X) | 0;
  return (((n + s.way[y] * step) % len) + len) % len;
}

/** The cells of each letter of the text, as offsets into a row-major picture `width` wide. */
export function glyphOffsets(width: number): Int32Array[] {
  return [...LETTERING.text].map((c) => {
    const bits = LETTERING.glyphs[c];
    const out: number[] = [];
    for (let r = 0; r < GLYPH_H; r++) for (let d = 0; d < GLYPH_W; d++) if (bits[r * GLYPH_W + d] === '#') out.push(d + r * width);
    return Int32Array.from(out);
  });
}

/** A colour as the 32 bits of an ImageData pixel (little-endian: ABGR). */
export function rgba(hex: string, alpha = 1): number {
  const v = parseInt(hex.slice(1), 16);
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255);
  return ((a << 24) | ((v & 0xff) << 16) | (v & 0xff00) | ((v >> 16) & 0xff)) >>> 0;
}

/** A colour between two, `t` from 0 (the first) to 1. */
export function mix(a: string, b: string, t: number): string {
  const p = parseInt(a.slice(1), 16);
  const q = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((p >> s) & 0xff) * (1 - t) + ((q >> s) & 0xff) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}

/** The colours of the letters for each state: [the first letter of the text (the small Q), the others]. */
export interface Ink {
  letter: Uint32Array[];
  /** The halo of each state, one pixel per place, blown up soft under the letters; 0 for none. */
  halo: Uint32Array;
}

/** The proposal's colours at rest; lit, they go towards white, and the front of a wave is yellow. */
export function inkOf(colors: { text: string; q: string }, light = '#ffffff', wave = '#ffe600'): Ink {
  const pair = (t: number, to = light): [string, string] => [mix(colors.q, to, t), mix(colors.text, to, t)];
  const by: Array<[string, string]> = [];
  by[OUT] = ['#000000', '#000000'];
  by[DIM] = pair(0);
  by[FADE] = pair(0.35);
  by[TRAIL] = pair(0.7);
  by[HEAD] = pair(1);
  by[FRONT] = [wave, wave];
  by[WAKE] = pair(0.55, wave);
  by[NEXT] = by[FRONT];
  const letter = [Uint32Array.from(by.map(([q]) => rgba(q))), Uint32Array.from(by.map(([, t]) => rgba(t)))];
  const halo = new Uint32Array(STATES.length);
  halo[FADE] = rgba(colors.text, 0.18);
  halo[TRAIL] = rgba(colors.text, 0.45);
  halo[HEAD] = rgba(light, 0.75);
  halo[FRONT] = rgba(wave, 0.7);
  halo[WAKE] = rgba(wave, 0.3);
  halo[NEXT] = halo[FRONT];
  return { letter, halo };
}

/** Where a surface paints: one pixel per cell, the small letters `GLYPH_W + 1` apart and the rows `GLYPH_H + 1`. */
export function pictureSize(s: Surface): [number, number] {
  return [s.X * (GLYPH_W + 1) - 1, s.Y * (GLYPH_H + 1) - 1];
}

/**
 * Paints the small letters of a surface at a carpet step, each with the colour of its state, into `pixels` (cleared first), and the
 * halo of each place into `halo` (X × Y). What is outside the letters stays transparent.
 */
export function paint(s: Surface, states: Uint8Array, step: number, ink: Ink, offsets: Int32Array[], pixels: Uint32Array, halo: Uint32Array): void {
  const [w] = pictureSize(s);
  pixels.fill(0);
  halo.fill(0);
  const { X, Y, mask } = s;
  for (let y = 0; y < Y; y++) {
    const rowBase = y * (GLYPH_H + 1) * w;
    for (let x = 0; x < X; x++) {
      const i = x + y * X;
      if (!mask[i]) continue;
      const state = states[i] || DIM;
      const k = letterAt(s, i, step);
      const color = ink.letter[k === 0 ? 0 : 1][state];
      const at = rowBase + x * (GLYPH_W + 1);
      const cells = offsets[k];
      for (let c = 0; c < cells.length; c++) pixels[at + cells[c]] = color;
      halo[i] = ink.halo[state];
    }
  }
}

/** The lights of a surface: one state per place, and one tick at a time. */
export interface Lights {
  readonly states: Uint8Array;
  step(): void;
}

/** How a kind of lights is made: the same surface and seed give the same run. */
export type LightsMaker = (s: Surface, seed: number) => Lights;

/** How often heads start and waves rise, per place that can start them and per tick: the same for both engines. */
export const RATES = {
  /** A head starts at the left end of a run of small letters. */
  head: 0.007,
  /** A wave rises from any small letter at rest. */
  wave: 0.000015,
  /** Fading: the trail fades, the faded comes to rest, the wake fades. */
  trail: 0.3,
  fade: 0.14,
  wake: 0.22,
};

/** The states of a surface at rest: DIM on the letters, OUT elsewhere. */
export function restingStates(s: Surface): Uint8Array {
  return Uint8Array.from(s.mask, (m) => (m ? DIM : OUT));
}
