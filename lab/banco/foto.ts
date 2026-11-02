// What the bench shows of a model: four sides and another seed, a cut at each storey, a plan of where a body gets.

import { colorTable } from '../../src/mj/mesh';
import { DEFAULT_RENDER, parseColor, render, sheet, type Picture } from '../../src/mj/photo';
import { runMjx } from '../../src/mj/run';
import type { Grid3 } from '../../src/mj/engine';
import type { Eseguito, Misure } from './misure';

const SFONDO: [number, number, number] = [112, 150, 84];

/** The four sides of the model as it stands (door closed, if it has one), and the front of another seed. */
export function fotoLati(e: Eseguito, semeAltro = 2): Picture {
  const p = e.model.program.palette;
  const views = [0, 1, 2, 3].map((v) => render(e.result.grid, p, v, DEFAULT_RENDER));
  views.push(render(runMjx(e.model, semeAltro, { deadline: 8_000 }).grid, p, 0, DEFAULT_RENDER));
  return sheet(views, 2, 4, SFONDO);
}

/** The model with everything from a height up taken away: the renderer does the same when one is inside. */
function tagliata(g: Grid3, z: number, aria: number): Grid3 {
  const XY = g.X * g.Y;
  const cells = new Uint8Array(g.cells);
  cells.fill(aria, Math.min(cells.length, z * XY));
  return { ...g, cells };
}

/** One photo per storey, cut a bit over the feet: from the front and from the back. */
export function fotoSezioni(e: Eseguito, m: Misure): Picture | undefined {
  if (!m.piani.length) return undefined;
  const g = e.grid;
  const aria = g.alphabet.indexOf(e.model.background);
  const p = e.model.program.palette;
  const cut = Math.round(1.1 * e.scatola.vpt);
  const views = m.piani.flatMap((pi) => [0, 2].map((v) => render(tagliata(g, pi.z + cut, aria), p, v, DEFAULT_RENDER)));
  return sheet(views, 2, 4, SFONDO);
}

const VERDE: [number, number, number] = [90, 200, 110];
const AZZURRO: [number, number, number] = [70, 140, 230];
const ROSSO: [number, number, number] = [230, 50, 50];
const GIALLO: [number, number, number] = [250, 220, 40];

/**
 * A plan per storey, seen from above with the front at the bottom: the walls at chest height in their colour, in green where a body's centre stands,
 * in blue where it stands higher or lower (the stairs), the door in red, the landings of the jumps in yellow.
 */
export function fotoPianta(e: Eseguito, m: Misure, scala = 3): Picture | undefined {
  const g = e.grid;
  const piani = m.piani.length ? m.piani.map((p) => p.z) : [e.scatola.base];
  const colors = colorTable(g.alphabet, e.model.program.palette);
  const XY = g.X * g.Y;
  const piante: Picture[] = piani.map((z0, n) => {
    const data = new Uint8ClampedArray(g.X * g.Y * 4);
    const set = (x: number, y: number, c: readonly number[]) => {
      if (x < 0 || y < 0 || x >= g.X || y >= g.Y) return;
      const i = (x + y * g.X) * 4;
      data[i] = c[0];
      data[i + 1] = c[1];
      data[i + 2] = c[2];
      data[i + 3] = 255;
    };
    const chest = z0 + Math.round(0.5 * e.scatola.vpt);
    const next = piani[n + 1] ?? g.Z;
    for (let y = 0; y < g.Y; y++)
      for (let x = 0; x < g.X; x++) {
        const cell = chest < g.Z ? g.cells[x + y * g.X + chest * XY] : 0;
        const col = chest < g.Z ? colors[cell] : null;
        const rgb = col && parseColor(e.model.program.palette[g.alphabet[cell]]?.color);
        set(x, y, rgb ?? [30, 30, 34]);
      }
    for (const c of m.celle) {
      if (Math.abs(c.z - z0) <= 1) set(c.x, c.y, VERDE);
      else if (c.z > z0 && c.z < next) set(c.x, c.y, AZZURRO);
    }
    if (m.porta && n === 0) for (let k = -2; k <= 2; k++) for (let j = -2; j <= 2; j++) set(m.porta.x + k, m.porta.y + j, ROSSO);
    for (const s of m.salti) if (s.z > z0 - 2 && s.z < next) for (let k = -2; k <= 2; k++) for (let j = -2; j <= 2; j++) set(s.x + k, s.y + j, GIALLO);
    return { w: g.X, h: g.Y, data };
  });
  return sheet(piante, scala, 4, [240, 240, 240]);
}
