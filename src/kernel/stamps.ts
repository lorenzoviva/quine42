// Structure stamps: castles with moats and drawbridges, fortresses, wizard towers, temples, pyramids,
// hut villages, stables, barracks, dungeons, dragon lairs. Models cannot draw a castle cell by cell
// (they cannot count); the Cartographer only says "a castle here" in its layout program
// ({type: "stamp", shape: "castle"}) and the kernel draws it with the world's own tile codes.

import type { Rng } from './rng';
import type { TerrainDef } from './types';

export const STAMP_SHAPES = ['house', 'castle', 'fortress', 'tower', 'temple', 'pyramid', 'huts', 'pen', 'barracks', 'dungeon', 'lair', 'well'] as const;
export type StampShape = (typeof STAMP_SHAPES)[number];

/** Roles a stamp draws with (ids since T310b, `ruoli-timbri`); resolved from the palette when the program does not say. */
export interface StampCodes {
  wall: string;
  floor: string;
  door: string;
  water: string;
  bridge: string;
  ground: string;
  road: string;
  rock: string;
  fence: string;
}

export const STAMP_ROLES: Array<keyof StampCodes> = ['wall', 'floor', 'door', 'water', 'bridge', 'ground', 'road', 'rock', 'fence'];

/**
 * The codes of this world that play each role: by layer, by the terrain's id (the seed's, English since the contract 0.2) and by its
 * name, in the Italian of today and in English (the Cartographer names the terrains of a Genesis in the language of the world; the
 * other languages are T239's).
 */
export function defaultCodes(palette: Record<string, TerrainDef>, pathCode = 'p'): StampCodes {
  const codes = Object.entries(palette).filter(([c]) => c !== '?');
  const by = (pred: (t: TerrainDef) => boolean, fallback: string) => codes.find(([, t]) => pred(t))?.[0] ?? fallback;
  const named = (ids: string[], re: RegExp, fallback: string) => codes.find(([, t]) => (t.id !== undefined && ids.includes(t.id)) || re.test(t.name))?.[0] ?? fallback;
  const wall = by((t) => t.layer === 'wall', 'h');
  return {
    wall,
    floor: by((t) => t.layer === 'floor' && !!t.indoor, 'f'),
    door: by((t) => t.layer === 'door', 'd'),
    water: named(['moat'], /fossat|acqua(?! profonda)|moat|water(?! deep)/i, by((t) => t.layer === 'liquid', 'w')),
    bridge: named(['drawbridge', 'bridge'], /ponte|levatoi|bridge/i, pathCode),
    ground: by((t) => t.layer === 'ground' && !t.solid && !/sentier|strada|campo|path|road|field/i.test(t.name), 'g'),
    road: pathCode,
    rock: by((t) => t.layer === 'rock', wall),
    fence: named(['fence', 'palisade'], /recint|staccionat|palizzat|steccat|fence|palisade|paddock/i, wall),
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
  rect(p, x0, y0, x0 + w - 1, y0 + h - 1, 'wall', 'floor');
  p[y0 + h - 1][doorX ?? x0 + Math.floor(w / 2)] = 'door';
}

/** The pattern of a shape (role per cell; null = leave the ground as it is). */
export function shapePattern(shape: StampShape, rng: Rng): Pat {
  switch (shape) {
    case 'house': {
      const p = grid(5 + rng.int(2), 4 + rng.int(2));
      house(p, 0, 0, p[0].length, p.length);
      return p;
    }
    case 'castle': {
      // Moat, curtain wall with corner towers, a drawbridge at the gate, a keep in the courtyard.
      const p = grid(15, 15, 'ground');
      rect(p, 0, 0, 14, 14, 'water');
      rect(p, 1, 1, 13, 13, 'wall', 'ground');
      for (const [x, y] of [[1, 1], [12, 1], [1, 12], [12, 12]]) rect(p, x, y, x + 1, y + 1, 'wall', 'wall');
      house(p, 5, 4, 5, 5);
      p[13][7] = 'door';
      p[14][7] = 'bridge';
      for (let y = 9; y <= 12; y++) p[y][7] = 'road';
      return p;
    }
    case 'fortress': {
      const p = grid(13, 13, 'ground');
      rect(p, 0, 0, 12, 12, 'wall', 'wall');
      rect(p, 2, 2, 10, 10, 'wall', 'ground');
      for (let y = 3; y <= 9; y++) for (let x = 3; x <= 9; x++) p[y][x] = 'ground';
      p[12][6] = 'door';
      p[11][6] = 'road';
      p[10][6] = 'door';
      house(p, 4, 3, 5, 4);
      return p;
    }
    case 'tower': {
      const p = grid(7, 7);
      for (let y = 0; y < 7; y++)
        for (let x = 0; x < 7; x++) {
          const d = Math.hypot(x - 3, y - 3);
          if (d <= 3.2) p[y][x] = d > 2.2 ? 'wall' : 'floor';
        }
      p[6][3] = 'door';
      return p;
    }
    case 'temple': {
      const p = grid(9, 8);
      rect(p, 0, 0, 8, 7, 'wall', 'floor');
      for (const y of [2, 5]) for (const x of [2, 4, 6]) p[y][x] = 'wall';
      p[7][4] = 'door';
      p[7][3] = 'door';
      return p;
    }
    case 'pyramid': {
      const p = grid(11, 11, 'wall');
      for (let y = 4; y <= 6; y++) for (let x = 4; x <= 6; x++) p[y][x] = 'floor';
      for (let y = 7; y <= 9; y++) p[y][5] = 'floor';
      p[10][5] = 'door';
      return p;
    }
    case 'huts': {
      const p = grid(3, 3);
      rect(p, 0, 0, 2, 2, 'wall', 'floor');
      p[2][1] = 'door';
      return p;
    }
    case 'pen': {
      // A paddock fenced in, with a small stable in a corner.
      const p = grid(10, 8, 'ground');
      rect(p, 0, 0, 9, 7, 'fence', 'ground');
      p[7][4] = 'road';
      p[7][5] = 'road';
      house(p, 1, 1, 4, 3);
      return p;
    }
    case 'barracks': {
      const p = grid(11, 5);
      rect(p, 0, 0, 10, 4, 'wall', 'floor');
      for (let y = 1; y < 4; y++) p[y][5] = 'wall';
      p[2][5] = 'door';
      p[4][2] = 'door';
      p[4][8] = 'door';
      return p;
    }
    case 'dungeon': {
      // Rock with rooms dug out and corridors between them; one way in from the south.
      const p = grid(14, 14, 'rock');
      const rooms: Array<[number, number, number, number]> = [];
      for (let k = 0; k < 4; k++) {
        const w = 3 + rng.int(2);
        const h = 3 + rng.int(2);
        const x = 1 + rng.int(14 - w - 2);
        const y = 1 + rng.int(14 - h - 3);
        rooms.push([x, y, w, h]);
        for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) p[yy][xx] = 'floor';
      }
      const centre = (r: [number, number, number, number]) => [r[0] + (r[2] >> 1), r[1] + (r[3] >> 1)];
      const dig = (a: number[], b: number[]) => {
        for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x++) p[a[1]][x] = 'floor';
        for (let y = Math.min(a[1], b[1]); y <= Math.max(a[1], b[1]); y++) p[y][b[0]] = 'floor';
      };
      for (let k = 1; k < rooms.length; k++) dig(centre(rooms[k - 1]), centre(rooms[k]));
      const last = centre(rooms[rooms.length - 1]);
      dig(last, [last[0], 12]);
      p[13][last[0]] = 'door';
      return p;
    }
    case 'lair': {
      // A cave in the rock: an irregular hollow and a mouth.
      const p = grid(12, 10, 'rock');
      for (let y = 1; y < 9; y++)
        for (let x = 1; x < 11; x++) {
          const d = Math.hypot((x - 5.5) / 4.5, (y - 4.5) / 3.6);
          if (d < 0.75 + rng.next() * 0.25) p[y][x] = 'ground';
        }
      for (let y = 5; y < 10; y++) p[y][5] = 'ground';
      p[9][6] = 'ground';
      return p;
    }
    case 'well': {
      const p = grid(3, 3, 'road');
      p[1][1] = 'water';
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
