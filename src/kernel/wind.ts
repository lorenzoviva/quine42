// The wind of the world (T484, A2 of T459, ADR-0255): the first `wind` automaton a world declares (`nature.automata`, ADR-0254) is its
// wind. The kernel reads it where something feels the wind (a sail, the fire of `sys.fire` through `world.wind`), and what a client draws
// of it (the grass and the trees that bend) is its coarse view: one cell every three tiles around a wanderer, two signed bytes a cell, twice
// a second, the only thing of the automaton that leaves the server (rule 8f, V-049). Pure functions here: which automaton, the units, the
// sail, the view and how it is read without trusting it.

import { WIND_LIMITS, type AutomatonSpec, type WindSpec } from './automata';

// --- Which wind, in which units --------------------------------------------------------------------------------------------------

/** The world's wind: the first `wind` automaton it declares (in their order), or none. */
export function windSpecOf(specs: readonly AutomatonSpec[] | undefined): WindSpec | undefined {
  return specs?.find((s): s is WindSpec => s.family === 'wind');
}

/**
 * The wind as the world reads it: a velocity over the strongest prevailing wind (`WIND_LIMITS.inflow` lattice units = 1), so that a full
 * prevailing wind is 1, a gust at most `WIND_MAX` and a calm 0, whatever the automaton's cell and pace.
 */
export const WIND_MAX = WIND_LIMITS.maxSpeed / WIND_LIMITS.inflow;

/** A velocity of the lattice in the world's units of wind. */
export function relativeWind(vx: number, vy: number): [number, number] {
  const k = 1 / WIND_LIMITS.inflow;
  return [vx * k, vy * k];
}

/** The wind somewhere: where it blows toward (x and y of the world) in the world's units, and how strong (their length). */
export interface WindHere {
  vx: number;
  vy: number;
  speed: number;
}

/** A wind in the world's units with its length (for `world.wind` and the sail), within `WIND_MAX`. */
export function windHere(vx: number, vy: number): WindHere {
  const x = Number.isFinite(vx) ? vx : 0, y = Number.isFinite(vy) ? vy : 0;
  const len = Math.sqrt(x * x + y * y);
  const k = len > WIND_MAX ? WIND_MAX / len : 1;
  return { vx: x * k, vy: y * k, speed: Math.min(WIND_MAX, len) };
}

// --- The sail ----------------------------------------------------------------------------------------------------------------------

/**
 * How much a sail draws with the wind at an angle (T484, T459 § 5.3): `along` is the cosine between where the bow points and where the wind
 * blows (1: the wind astern, 0: abeam, −1: head to wind). Abeam it draws all, running before it a little less, close-hauled less and less,
 * head to wind nothing (in irons). A polynomial: the same in every engine.
 */
export function sailPolar(along: number): number {
  const c = Math.max(-1, Math.min(1, Number.isFinite(along) ? along : 0));
  return c >= 0 ? 1 - 0.3 * c * c : 1 - c * c;
}

/**
 * The share of a vehicle's way the wind gives (T484): a vehicle without a sail (`sail` 0), or in a world without wind, keeps all of it (1);
 * one with a sail has its `1 − sail` from what else moves it (oars, a paddle) and the rest from the wind, as its polar and its strength say
 * (a full prevailing wind abeam: all of it; a gust up to `WIND_MAX`, never more than that).
 */
export function sailPush(sail: number, heading: number, wind: WindHere | undefined): number {
  const s = Number.isFinite(sail) ? Math.max(0, Math.min(1, sail)) : 0;
  if (!s || !wind) return 1;
  if (!(wind.speed > 1e-6)) return 1 - s;
  const along = (Math.sin(heading) * wind.vx + Math.cos(heading) * wind.vy) / wind.speed;
  return 1 - s + s * sailPolar(along) * Math.min(WIND_MAX, wind.speed);
}

// --- The coarse view: what a client gets ---------------------------------------------------------------------------------------------

/**
 * The coarse wind a client gets (T459 § 5.4, D67 D1/D3): one cell every `cell` tiles over `tiles` around the wanderer (36 × 30 cells, the
 * places around them), two signed bytes a cell, at most `hz` times a second of the world and only when it changed: about 2.9 KB a message,
 * 6 KB a second. `cap` is the most cells a view read from the wire may have.
 */
export const WIND_VIEW = { cell: 3, tiles: [108, 90] as const, hz: 2, cap: 4096 } as const;

/**
 * The coarse wind around a wanderer (`update.wind`): the corner of its window in tiles of the world (a multiple of `cell`), its cells
 * across and down, the tiles a cell, the prevailing wind in the world's units (what blows beyond the window), and the cells: for each, row by
 * row, two signed bytes (east, south) over `WIND_MAX`, in base64. Nothing else of the automaton leaves the server.
 */
export interface WindView {
  x: number;
  y: number;
  w: number;
  h: number;
  cell: number;
  p: [number, number];
  data: string;
}

/** The corner of the view around a point of the world (tiles): the same for every wanderer of the same cell of three tiles. */
export function viewCorner(cx: number, cy: number): [number, number] {
  const c = WIND_VIEW.cell;
  const [tw, th] = WIND_VIEW.tiles;
  return [Math.floor((cx - tw / 2) / c) * c, Math.floor((cy - th / 2) / c) * c];
}

const quant = (v: number) => {
  const q = Math.round((Number.isFinite(v) ? Math.max(-1, Math.min(1, v / WIND_MAX)) : 0) * 127);
  return q & 255;
};
const unquant = (b: number) => ((b << 24) >> 24) / 127 * WIND_MAX;

/**
 * The coarse view of a wind around a point (tiles): every cell the mean of its `cell × cell` tiles, each read at its middle by `at` (the
 * world's units; undefined where the automaton has no window: the prevailing wind blows there).
 */
export function windViewOf(cx: number, cy: number, prevailing: [number, number], at: (x: number, y: number) => [number, number] | undefined): WindView {
  const c = WIND_VIEW.cell;
  const [x0, y0] = viewCorner(cx, cy);
  const w = WIND_VIEW.tiles[0] / c, h = WIND_VIEW.tiles[1] / c;
  const bytes = new Uint8Array(w * h * 2);
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      let sx = 0, sy = 0;
      for (let b = 0; b < c; b++)
        for (let a = 0; a < c; a++) {
          const v = at(x0 + i * c + a + 0.5, y0 + j * c + b + 0.5) ?? prevailing;
          sx += v[0];
          sy += v[1];
        }
      const k = (j * w + i) * 2;
      bytes[k] = quant(sx / (c * c));
      bytes[k + 1] = quant(sy / (c * c));
    }
  return { x: x0, y: y0, w, h, cell: c, p: [round3(prevailing[0]), round3(prevailing[1])], data: toBase64(bytes) };
}

const round3 = (v: number) => (Number.isFinite(v) ? Math.round(v * 1000) / 1000 : 0);

/** The cells of a view as bytes (two a cell), or undefined if they are not what its size says. */
export function viewBytes(view: Pick<WindView, 'w' | 'h' | 'data'>): Uint8Array | undefined {
  const bytes = fromBase64(view.data);
  return bytes && bytes.length === view.w * view.h * 2 ? bytes : undefined;
}

/**
 * A view read from the wire without trusting it (rule 7): a corner and a size that are whole numbers within the cap, a cell the kernel
 * knows, a prevailing wind within `WIND_MAX`, and cells that are as many as it says; anything else is no view.
 */
export function readWindView(raw: unknown): WindView | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as Record<string, unknown>;
  const int = (v: unknown, lo: number, hi: number): v is number => Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi;
  if (!int(r.x, -1e7, 1e7) || !int(r.y, -1e7, 1e7) || !int(r.w, 1, 512) || !int(r.h, 1, 512) || !int(r.cell, 1, 3)) return undefined;
  if (r.w * r.h > WIND_VIEW.cap || typeof r.data !== 'string' || r.data.length > Math.ceil((WIND_VIEW.cap * 2) / 3) * 4) return undefined;
  if (!Array.isArray(r.p) || r.p.length !== 2 || !r.p.every((v) => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= WIND_MAX)) return undefined;
  const view: WindView = { x: r.x, y: r.y, w: r.w, h: r.h, cell: r.cell, p: [r.p[0] as number, r.p[1] as number], data: r.data };
  return viewBytes(view) ? view : undefined;
}

/**
 * The wind of a view at a point of the world (tiles), in the world's units: between the middles of its cells, as a texture reads it; beyond
 * its window the prevailing wind.
 */
export function windInView(view: WindView, bytes: Uint8Array, x: number, y: number): [number, number] {
  const fx = (x - view.x) / view.cell - 0.5, fy = (y - view.y) / view.cell - 0.5;
  if (!(fx >= -0.5 && fy >= -0.5 && fx <= view.w - 0.5 && fy <= view.h - 0.5)) return [view.p[0], view.p[1]];
  const i0 = Math.max(0, Math.min(view.w - 1, Math.floor(fx))), j0 = Math.max(0, Math.min(view.h - 1, Math.floor(fy)));
  const i1 = Math.min(view.w - 1, i0 + 1), j1 = Math.min(view.h - 1, j0 + 1);
  const u = Math.max(0, Math.min(1, fx - i0)), v = Math.max(0, Math.min(1, fy - j0));
  const at = (i: number, j: number, k: number) => unquant(bytes[(j * view.w + i) * 2 + k]!);
  const lerp = (k: number) => {
    const top = at(i0, j0, k) * (1 - u) + at(i1, j0, k) * u;
    const bottom = at(i0, j1, k) * (1 - u) + at(i1, j1, k) * u;
    return top * (1 - v) + bottom * v;
  };
  return [lerp(0), lerp(1)];
}

// --- Base64, without the browser's nor Node's ----------------------------------------------------------------------------------------

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_INDEX = (() => {
  const t = new Int16Array(128).fill(-1);
  for (let i = 0; i < B64.length; i++) t[B64.charCodeAt(i)] = i;
  return t;
})();

/** Bytes in base64 (with the padding). */
export function toBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]!, b = bytes[i + 1], c = bytes[i + 2];
    const n = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);
    out += B64[(n >> 18) & 63]! + B64[(n >> 12) & 63]! + (b === undefined ? '=' : B64[(n >> 6) & 63]!) + (c === undefined ? '=' : B64[n & 63]!);
  }
  return out;
}

/** Base64 back to bytes, or undefined if it is not base64 (rule 7: what comes from the wire is read, not trusted). */
export function fromBase64(text: string): Uint8Array | undefined {
  if (typeof text !== 'string' || text.length % 4) return undefined;
  const pad = text.endsWith('==') ? 2 : text.endsWith('=') ? 1 : 0;
  const out = new Uint8Array((text.length / 4) * 3 - pad);
  let o = 0;
  for (let i = 0; i < text.length; i += 4) {
    let n = 0;
    for (let k = 0; k < 4; k++) {
      const ch = text.charCodeAt(i + k);
      const last = i + 4 === text.length;
      if (ch === 61 && last && k >= 4 - pad) {
        n <<= 6;
        continue;
      }
      const d = ch < 128 ? B64_INDEX[ch]! : -1;
      if (d < 0) return undefined;
      n = (n << 6) | d;
    }
    if (o < out.length) out[o++] = (n >> 16) & 255;
    if (o < out.length) out[o++] = (n >> 8) & 255;
    if (o < out.length) out[o++] = n & 255;
  }
  return out;
}
