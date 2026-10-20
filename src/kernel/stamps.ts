// Structure stamps: castles with moats and drawbridges, fortresses, wizard towers, temples, pyramids,
// hut villages, stables, barracks, dungeons, dragon lairs. Models cannot draw a castle cell by cell
// (they cannot count); the Cartographer only says "a castle here" in its layout program
// ({type: "stamp", shape: "castello"}) and the kernel draws it with the world's own tile codes.

import type { Rng } from './rng';
import type { TileDef } from './types';

export const STAMP_SHAPES = ['casa', 'castello', 'fortezza', 'torre', 'tempio', 'piramide', 'capanne', 'recinto', 'caserma', 'dungeon', 'tana', 'pozzo'] as const;
export type StampShape = (typeof STAMP_SHAPES)[number];

/** Roles a stamp draws with; resolved from the palette when the program does not say. */
export interface StampCodes {
  muro: string;
  pavimento: string;
  porta: string;
  acqua: string;
  ponte: string;
  terreno: string;
  strada: string;
  roccia: string;
  recinto: string;
}

export const STAMP_ROLES: Array<keyof StampCodes> = ['muro', 'pavimento', 'porta', 'acqua', 'ponte', 'terreno', 'strada', 'roccia', 'recinto'];

/** The codes of this world that play each role (by layer and by name). */
export function defaultCodes(palette: Record<string, TileDef>, pathCode = 'p'): StampCodes {
  const codes = Object.entries(palette).filter(([c]) => c !== '?');
  const by = (pred: (t: TileDef) => boolean, fallback: string) => codes.find(([, t]) => pred(t))?.[0] ?? fallback;
  const named = (re: RegExp, fallback: string) => codes.find(([, t]) => re.test(t.name))?.[0] ?? fallback;
  const muro = by((t) => t.layer === 'wall', 'h');
  return {
    muro,
    pavimento: by((t) => t.layer === 'floor' && !!t.indoor, 'f'),
    porta: by((t) => t.layer === 'door', 'd'),
    acqua: named(/fossat|acqua(?! profonda)/i, by((t) => t.layer === 'liquid', 'w')),
    ponte: named(/ponte|levatoi/i, pathCode),
    terreno: by((t) => t.layer === 'ground' && !t.solid && !/sentier|strada|campo/i.test(t.name), 'g'),
    strada: pathCode,
    roccia: by((t) => t.layer === 'rock', muro),
    recinto: named(/recint|staccionat|palizzat|steccat/i, muro),
  };
}

type Pat = Array<Array<keyof StampCodes | null>>;

const grid = (w: number, h: number, fill: keyof StampCodes | null = null): Pat => Array.from({ length: h }, () => Array<keyof StampCodes | null>(w).fill(fill));

function rect(p: Pat, x0: number, y0: number, x1: number, y1: number, edge: keyof StampCodes, inside?: keyof StampCodes): void {
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const onEdge = x === x0 || x === x1 || y === y0 || y === y1;
      if (onEdge) p[y][x] = edge;
      else if (inside) p[y][x] = inside;
    }
}

function house(p: Pat, x0: number, y0: number, w: number, h: number, doorX?: number): void {
  rect(p, x0, y0, x0 + w - 1, y0 + h - 1, 'muro', 'pavimento');
  p[y0 + h - 1][doorX ?? x0 + Math.floor(w / 2)] = 'porta';
}

/** The pattern of a shape (role per cell; null = leave the ground as it is). */
export function shapePattern(shape: StampShape, rng: Rng): Pat {
  switch (shape) {
    case 'casa': {
      const p = grid(5 + rng.int(2), 4 + rng.int(2));
      house(p, 0, 0, p[0].length, p.length);
      return p;
    }
    case 'castello': {
      // Moat, curtain wall with corner towers, a drawbridge at the gate, a keep in the courtyard.
      const p = grid(15, 15, 'terreno');
      rect(p, 0, 0, 14, 14, 'acqua');
      rect(p, 1, 1, 13, 13, 'muro', 'terreno');
      for (const [x, y] of [[1, 1], [12, 1], [1, 12], [12, 12]]) rect(p, x, y, x + 1, y + 1, 'muro', 'muro');
      house(p, 5, 4, 5, 5);
      p[13][7] = 'porta';
      p[14][7] = 'ponte';
      for (let y = 9; y <= 12; y++) p[y][7] = 'strada';
      return p;
    }
    case 'fortezza': {
      const p = grid(13, 13, 'terreno');
      rect(p, 0, 0, 12, 12, 'muro', 'muro');
      rect(p, 2, 2, 10, 10, 'muro', 'terreno');
      for (let y = 3; y <= 9; y++) for (let x = 3; x <= 9; x++) p[y][x] = 'terreno';
      p[12][6] = 'porta';
      p[11][6] = 'strada';
      p[10][6] = 'porta';
      house(p, 4, 3, 5, 4);
      return p;
    }
    case 'torre': {
      const p = grid(7, 7);
      for (let y = 0; y < 7; y++)
        for (let x = 0; x < 7; x++) {
          const d = Math.hypot(x - 3, y - 3);
          if (d <= 3.2) p[y][x] = d > 2.2 ? 'muro' : 'pavimento';
        }
      p[6][3] = 'porta';
      return p;
    }
    case 'tempio': {
      const p = grid(9, 8);
      rect(p, 0, 0, 8, 7, 'muro', 'pavimento');
      for (const y of [2, 5]) for (const x of [2, 4, 6]) p[y][x] = 'muro';
      p[7][4] = 'porta';
      p[7][3] = 'porta';
      return p;
    }
    case 'piramide': {
      const p = grid(11, 11, 'muro');
      for (let y = 4; y <= 6; y++) for (let x = 4; x <= 6; x++) p[y][x] = 'pavimento';
      for (let y = 7; y <= 9; y++) p[y][5] = 'pavimento';
      p[10][5] = 'porta';
      return p;
    }
    case 'capanne': {
      const p = grid(3, 3);
      rect(p, 0, 0, 2, 2, 'muro', 'pavimento');
      p[2][1] = 'porta';
      return p;
    }
    case 'recinto': {
      // A paddock fenced in, with a small stable in a corner.
      const p = grid(10, 8, 'terreno');
      rect(p, 0, 0, 9, 7, 'recinto', 'terreno');
      p[7][4] = 'strada';
      p[7][5] = 'strada';
      house(p, 1, 1, 4, 3);
      return p;
    }
    case 'caserma': {
      const p = grid(11, 5);
      rect(p, 0, 0, 10, 4, 'muro', 'pavimento');
      for (let y = 1; y < 4; y++) p[y][5] = 'muro';
      p[2][5] = 'porta';
      p[4][2] = 'porta';
      p[4][8] = 'porta';
      return p;
    }
    case 'dungeon': {
      // Rock with rooms dug out and corridors between them; one way in from the south.
      const p = grid(14, 14, 'roccia');
      const rooms: Array<[number, number, number, number]> = [];
      for (let k = 0; k < 4; k++) {
        const w = 3 + rng.int(2);
        const h = 3 + rng.int(2);
        const x = 1 + rng.int(14 - w - 2);
        const y = 1 + rng.int(14 - h - 3);
        rooms.push([x, y, w, h]);
        for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) p[yy][xx] = 'pavimento';
      }
      const centre = (r: [number, number, number, number]) => [r[0] + (r[2] >> 1), r[1] + (r[3] >> 1)];
      const dig = (a: number[], b: number[]) => {
        for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x++) p[a[1]][x] = 'pavimento';
        for (let y = Math.min(a[1], b[1]); y <= Math.max(a[1], b[1]); y++) p[y][b[0]] = 'pavimento';
      };
      for (let k = 1; k < rooms.length; k++) dig(centre(rooms[k - 1]), centre(rooms[k]));
      const last = centre(rooms[rooms.length - 1]);
      dig(last, [last[0], 12]);
      p[13][last[0]] = 'porta';
      return p;
    }
    case 'tana': {
      // A cave in the rock: an irregular hollow and a mouth.
      const p = grid(12, 10, 'roccia');
      for (let y = 1; y < 9; y++)
        for (let x = 1; x < 11; x++) {
          const d = Math.hypot((x - 5.5) / 4.5, (y - 4.5) / 3.6);
          if (d < 0.75 + rng.next() * 0.25) p[y][x] = 'terreno';
        }
      for (let y = 5; y < 10; y++) p[y][5] = 'terreno';
      p[9][6] = 'terreno';
      return p;
    }
    case 'pozzo': {
      const p = grid(3, 3, 'strada');
      p[1][1] = 'acqua';
      return p;
    }
  }
}

/**
 * Stamps a shape on a grid (in place): tries random spots where it fits inside, away from fixed
 * cells, over cells it may cover (`on`, default: anything not solid-liquid), and keeps the first fit.
 */
export function stamp(cells: string[], w: number, h: number, fixed: Set<number> | undefined, shape: StampShape, codes: StampCodes, rng: Rng, on?: string): boolean {
  const pat = shapePattern(shape, rng);
  const ph = pat.length;
  const pw = pat[0].length;
  if (pw > w - 2 || ph > h - 2) return false;
  for (let tries = 0; tries < 60; tries++) {
    const x0 = 1 + rng.int(w - pw - 1);
    const y0 = 1 + rng.int(h - ph - 1);
    let ok = true;
    for (let y = 0; y < ph && ok; y++)
      for (let x = 0; x < pw && ok; x++) {
        if (!pat[y][x]) continue;
        const i = (y0 + y) * w + x0 + x;
        if (fixed?.has(i) || (on && !on.includes(cells[i]))) ok = false;
      }
    if (!ok) continue;
    for (let y = 0; y < ph; y++)
      for (let x = 0; x < pw; x++) {
        const role = pat[y][x];
        if (role) cells[(y0 + y) * w + x0 + x] = codes[role];
      }
    return true;
  }
  return false;
}
