// The futuristic skin (T284, T315): the lettering is the proposal's, cell by cell, and so is what the page paints; what the tool writes
// is what the skin holds; the carpet keeps the proposal's rule; the icon is the lettering's Q and its ring is closed at 16 px; the two
// engines of the lights behave the same way; the maze grows a perfect maze, lights its longest path and is painted the other way round
// from the lettering (faint walls, free paths lit); the tools open only this machine.

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DRAWING, PROPOSAL, SECTION, cellsOf, extractLettering, firstLetter, iconSvg, letteringBox, letteringCells, letteringModule, letteringSvg, sectionOf, squaresOf, svgOf, unbundle } from '../tools/vesti/scritta';
import { LETTERING } from '../site/skins/futuristica/scritta';
import { DIM, FRONT, GLYPH_H, GLYPH_W, HEAD, OUT, STATES, glyphOffsets, inkOf, letterAt, letteringSurface, paint, pictureSize, restingStates, rgba, stripeSurface, type LightsMaker, type Surface } from '../site/skins/futuristica/surface';
import { mjLights } from '../site/skins/futuristica/lights-mj';
import { simpleLights } from '../site/skins/futuristica/lights-simple';
import { END, FRESH, MAZE, PATH, UNWRITTEN, WARM, mazeInk, programLights } from '../site/skins/futuristica/program';
// @ts-expect-error: a module of the tools, in plain JavaScript
import { checkLocal } from '../tools/vesti/cdp.mjs';

const ROOT = path.resolve(__dirname, '..');
const skinFile = (name: string) => fs.readFileSync(path.join(ROOT, 'site/skins/futuristica', name), 'utf8');
const html = fs.readFileSync(path.join(ROOT, PROPOSAL), 'utf8');
const extracted = extractLettering(html);

/** The proposal's own squares, as cells of its grid. */
function proposalCells(): Map<string, string> {
  const squares = squaresOf(svgOf(sectionOf(unbundle(html), SECTION), DRAWING));
  return cellsOf(squares, extracted.cell, extracted.x0, extracted.y0);
}

describe('the lettering', () => {
  it('is the proposal\'s, cell by cell', () => {
    const cells = proposalCells();
    expect(cells.size).toBe(13057);
    const again = letteringCells(extracted);
    expect(again.size).toBe(cells.size);
    for (const [k, v] of cells) expect(again.get(k), k).toBe(v);
    expect(LETTERING).toEqual({ text: extracted.text, glyphs: extracted.glyphs, rows: extracted.rows, pitch: extracted.pitch, top: extracted.top, cell: extracted.cell, colors: extracted.colors });
    expect(LETTERING.text).toBe('QUINE42');
    expect(LETTERING.colors).toEqual({ ground: '#090514', text: '#00f0ff', q: '#ff2a85' });
  });

  it('is what the tool writes: the module, the still SVG and the icon are not edited by hand', () => {
    expect(skinFile('scritta.ts')).toBe(letteringModule(extracted));
    expect(skinFile('scritta.svg')).toBe(letteringSvg(extracted));
    expect(skinFile('icona.svg')).toBe(iconSvg(extracted));
  });

  it('as a still SVG draws the same cells, without the empty margin of the sheet', () => {
    const svg = skinFile('scritta.svg');
    const glyphs = new Map<string, Array<[number, number]>>();
    for (const [, id, d] of svg.matchAll(/<path id="([^"]+)" d="([^"]+)"/g)) {
      const cells: Array<[number, number]> = [];
      for (const [, x, y, w] of d.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) for (let i = 0; i < Number(w); i++) cells.push([Number(x) + i, Number(y)]);
      glyphs.set(id, cells);
    }
    // A group per colour, a group per row in it, a `<use>` per small letter.
    const drawn = new Map<string, string>();
    for (const [, fill, body] of svg.matchAll(/<g fill="([^"]+)">((?:<g transform="translate\(0 \d+\)">(?:<use [^>]*\/>)*<\/g>)*)<\/g>/g)) {
      for (const [, y, row] of body.matchAll(/<g transform="translate\(0 (\d+)\)">(.*?)<\/g>/g)) {
        for (const [, id, x] of row.matchAll(/<use href="#([^"]+)" x="(\d+)"\/>/g)) {
          for (const [cx, cy] of glyphs.get(id)!) drawn.set(`${Number(x) + cx},${Number(y) + cy}`, fill);
        }
      }
    }
    const [bx, by] = letteringBox(extracted);
    const cells = proposalCells();
    expect(drawn.size).toBe(cells.size);
    for (const [k, v] of cells) {
      const [c, r] = k.split(',').map(Number);
      expect(drawn.get(`${c - bx},${r - by}`), k).toBe(v);
    }
  });
});

describe('what the page paints', () => {
  const s = letteringSurface();
  const [w, h] = pictureSize(s);
  const ink = inkOf(LETTERING.colors);
  const paintAt = (step: number) => {
    const pixels = new Uint32Array(w * h);
    paint(s, restingStates(s), step, ink, glyphOffsets(w), pixels, new Uint32Array(s.X * s.Y));
    return pixels;
  };

  it('at rest is the proposal, pixel for cell', () => {
    expect([w, h]).toEqual([551, 95]);
    const pixels = paintAt(0);
    const [bx, by] = letteringBox(extracted);
    const cells = proposalCells();
    let lit = 0;
    for (let i = 0; i < pixels.length; i++) if (pixels[i]) lit++;
    expect(lit).toBe(cells.size);
    for (const [k, v] of cells) {
      const [c, r] = k.split(',').map(Number);
      expect(pixels[c - bx + (r - by) * w], k).toBe(rgba(v));
    }
  });

  it('moves the carpet along the rows, one way and the next the other, and comes back after the text', () => {
    const len = LETTERING.text.length;
    const wrong: number[] = [];
    for (const step of [1, 2, 5]) {
      for (let y = 0; y < s.Y; y++) {
        for (let x = 0; x < s.X; x++) {
          const i = x + y * s.X;
          if (!s.mask[i]) continue;
          const expected = (((s.order[i] + (y % 2 ? -step : step)) % len) + len) % len;
          if (letterAt(s, i, step) !== expected) wrong.push(i);
        }
      }
    }
    expect(wrong).toEqual([]);
    expect(paintAt(len)).toEqual(paintAt(0));
    expect(paintAt(1)).not.toEqual(paintAt(0));
  });
});

describe('the icon', () => {
  const svg = skinFile('icona.svg');

  it('at 16 px is the Q of the lettering, one pixel row per row of small text, and its ring is closed', () => {
    const small = svg.match(/<g class="s"[^>]*>(.*?)<\/g>/)![1];
    const on = new Set<string>();
    for (const [, x, y, n] of small.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) for (let i = 0; i < Number(n); i++) on.add(`${Number(x) + i},${y}`);
    const rows = new Set([...on].map((k) => k.split(',')[1]));
    expect(rows.size).toBe(LETTERING.rows.length);
    // The counter of the Q: the background inside it does not reach the edge of the icon.
    const seen = new Set<string>();
    let enclosed = 0;
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const k = `${x},${y}`;
        if (on.has(k) || seen.has(k)) continue;
        let edge = false;
        const stack = [[x, y]];
        seen.add(k);
        while (stack.length) {
          const [cx, cy] = stack.pop()!;
          if (cx === 0 || cy === 0 || cx === 15 || cy === 15) edge = true;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = cx + dx;
            const ny = cy + dy;
            const nk = `${nx},${ny}`;
            if (nx < 0 || ny < 0 || nx > 15 || ny > 15 || on.has(nk) || seen.has(nk)) continue;
            seen.add(nk);
            stack.push([nx, ny]);
          }
        }
        if (!edge) enclosed++;
      }
    expect(enclosed).toBe(1);
  });

  it('from 64 px is the lettering\'s own Q, small letters and all', () => {
    expect(svg).toContain('@media (min-width:64px)');
    const { from, to } = firstLetter(extracted);
    const letters = LETTERING.rows.reduce((n, row) => n + [...row.slice(from, to)].filter((c) => c === '#').length, 0);
    const large = svg.match(/<g class="l"[^>]*>(.*)<\/g><\/svg>/)![1];
    expect([...large.matchAll(/<use /g)].length).toBe(letters);
  });
});

describe('the lights', () => {
  const engines: Array<[string, LightsMaker]> = [
    ['MarkovJunior', mjLights],
    ['semplici', simpleLights],
  ];
  const surfaces: Array<[string, () => Surface]> = [
    ['la scritta', letteringSurface],
    ['una striscia', () => stripeSurface(120, 2)],
  ];

  it.each(engines.flatMap(([e, make]) => surfaces.map(([n, surface]) => [e, n, make, surface] as const)))('%s su %s: stay on the letters, run right, rise and die out, the same for the same seed', (_e, _n, make, surface) => {
    const s = surface();
    const a = make(s, 7);
    const b = make(s, 7);
    const wrong: string[] = [];
    let heads = 0;
    let fronts = 0;
    let quietAfterWave = false;
    let differ = 0;
    let prev = new Uint8Array(a.states);
    for (let t = 0; t < 500; t++) {
      a.step();
      b.step();
      if (a.states.some((v, i) => v !== b.states[i])) differ++;
      let front = 0;
      for (let i = 0; i < a.states.length; i++) {
        const v = a.states[i];
        if (v >= STATES.length || (v === OUT) !== !s.mask[i]) wrong.push(`stato ${v} in ${i} al tick ${t}`);
        if (v === HEAD) {
          heads++;
          const x = i % s.X;
          // A head came from the place on its left, started at the start of a run, or stood still.
          if (!(prev[i - 1] === HEAD || x === 0 || !s.mask[i - 1] || prev[i] === HEAD)) wrong.push(`testa in ${i} al tick ${t}`);
        }
        if (v === FRONT) front++;
      }
      if (fronts && !front) quietAfterWave = true;
      fronts += front;
      prev = new Uint8Array(a.states);
    }
    expect(wrong.slice(0, 5)).toEqual([]);
    expect(differ).toBe(0);
    expect(heads).toBeGreaterThan(0);
    if (s.Y > 2) {
      expect(fronts).toBeGreaterThan(0);
      expect(quietAfterWave).toBe(true);
    }
    // Most of the time most letters are at rest: the lights are lights, not a fill.
    expect(a.states.filter((v) => v === DIM).length).toBeGreaterThan(s.mask.reduce((n, m) => n + m, 0) / 2);
  });
});



describe('the maze', () => {
  const s = stripeSurface(31, 21, 3);
  const free = (v: number) => v >= MAZE;
  const count = (states: Uint8Array, v: number) => states.filter((x) => x === v).length;

  /** Whether the free places are a tree: all joined, and one join fewer than places (no loop). */
  function perfect(states: Uint8Array): boolean {
    const places = [...states.keys()].filter((i) => free(states[i]));
    let joins = 0;
    for (const i of places) {
      if (i % s.X < s.X - 1 && free(states[i + 1])) joins++;
      if (i + s.X < states.length && free(states[i + s.X])) joins++;
    }
    const seen = new Set([places[0]]);
    const todo = [places[0]];
    while (todo.length) {
      const i = todo.pop()!;
      for (const j of [i - 1, i + 1, i - s.X, i + s.X]) {
        if (j < 0 || j >= states.length || seen.has(j) || !free(states[j]) || (Math.abs(j - i) === 1 && ((j / s.X) | 0) !== ((i / s.X) | 0))) continue;
        seen.add(j);
        todo.push(j);
      }
    }
    return seen.size === places.length && joins === places.length - 1;
  }

  it('grows a perfect maze of small letters, lights its longest path, holds it, then starts again', () => {
    const lights = programLights(s, 3);
    let t = 0;
    for (; t < 80 && !count(lights.states, PATH); t++) lights.step();
    expect(lights.steps).toBeGreaterThan(100);
    expect(count(lights.states, PATH)).toBeGreaterThan(5);
    expect(count(lights.states, END)).toBe(1);
    expect(perfect(lights.states)).toBe(true);
    let held = 0;
    while (count(lights.states, UNWRITTEN) < s.X * s.Y * 0.9 && held < 80) {
      lights.step();
      held++;
    }
    expect(held).toBeGreaterThan(40);
    expect(held).toBeLessThan(80);
  });

  it('settles at once when nothing may move: finished, its path lit, nothing new in it', () => {
    const lights = programLights(s, 9);
    lights.settle();
    expect(count(lights.states, FRESH) + count(lights.states, WARM)).toBe(0);
    expect(count(lights.states, END)).toBe(1);
    expect(count(lights.states, PATH)).toBeGreaterThan(5);
    expect(perfect(lights.states)).toBe(true);
  });

  it('paints the free paths as bands of light with their letters cut in them, and the walls as faint letters', () => {
    const lights = programLights(s, 5);
    lights.settle();
    const ink = mazeInk(LETTERING.colors);
    const [w, h] = pictureSize(s);
    const offsets = glyphOffsets(w);
    const pixels = new Uint32Array(w * h);
    paint(s, lights.states, 2, ink, offsets, pixels, new Uint32Array(s.X * s.Y));
    const states = lights.states;
    const wrong: string[] = [];
    for (let y = 0; y < s.Y; y++)
      for (let x = 0; x < s.X; x++) {
        const i = x + y * s.X;
        const v = states[i];
        const k = letterAt(s, i, 2);
        const at = y * (GLYPH_H + 1) * w + x * (GLYPH_W + 1);
        const glyph = new Set(offsets[k]);
        for (let r = 0; r < GLYPH_H; r++)
          for (let d = 0; d < GLYPH_W; d++) {
            const off = d + r * w;
            const want = glyph.has(off) ? ink.letter[k === 0 ? 0 : 1][v] : free(v) ? ink.block![v] : 0;
            if (pixels[at + off] !== want) wrong.push(`${x},${y} cella ${d},${r}`);
          }
        // The gaps: lit only between two free places, so a free path is one band.
        if (x < s.X - 1) for (let r = 0; r < GLYPH_H; r++) if (pixels[at + GLYPH_W + r * w] !== (free(v) && free(states[i + 1]) ? ink.block![v] : 0)) wrong.push(`${x},${y} a destra`);
        if (y < s.Y - 1) for (let d = 0; d < GLYPH_W; d++) if (pixels[at + GLYPH_H * w + d] !== (free(v) && free(states[i + s.X]) ? ink.block![v] : 0)) wrong.push(`${x},${y} sotto`);
      }
    expect(wrong.slice(0, 5)).toEqual([]);
    // Lit and faint: a free path's light is strong, a wall's letter is faint, and a free path's letter is cut darker than its light.
    const alpha = (c: number) => (c >>> 24) / 255;
    const lum = (c: number) => (c & 0xff) + ((c >>> 8) & 0xff) + ((c >>> 16) & 0xff);
    expect(alpha(ink.block![MAZE])).toBeGreaterThan(0.5);
    expect(alpha(ink.letter[1][UNWRITTEN])).toBeLessThan(0.25);
    expect(ink.block![UNWRITTEN]).toBe(0);
    expect(lum(ink.letter[1][MAZE]) * alpha(ink.letter[1][MAZE])).toBeLessThan(lum(ink.block![MAZE]) * alpha(ink.block![MAZE]));
  });

  it('starts each row three letters after the one above, so that its small Qs are not in columns', () => {
    const t = stripeSurface(21, 5, 3);
    for (let y = 0; y < t.Y; y++) expect(letterAt(t, y * t.X, 0)).toBe((3 * y) % LETTERING.text.length);
    // The stripes stay as they were: every row from the Q.
    const stripe = stripeSurface(21, 3);
    for (let y = 0; y < stripe.Y; y++) expect(letterAt(stripe, y * stripe.X, 0)).toBe(0);
  });
});

describe('the tools of the skins', () => {
  it('open only a page of this machine', () => {
    expect(() => checkLocal('http://127.0.0.1:4185/site/index.html')).not.toThrow();
    expect(() => checkLocal('http://localhost:5173/site/')).not.toThrow();
    for (const url of ['https://example.com/', 'http://192.168.1.2:4185/', 'http://127.0.0.1.example.com/']) expect(() => checkLocal(url), url).toThrow();
  });
});
