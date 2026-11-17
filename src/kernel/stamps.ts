// Structure stamps: castles with moats and drawbridges, fortresses, wizard towers, temples, pyramids,
// hut villages, stables, barracks, dungeons, dragon lairs. Models cannot draw a castle cell by cell
// (they cannot count); the Cartographer only says "a castle here" in its layout program
// ({type: "stamp", shape: "castle"}) and the kernel draws it with the world's own tile codes.

import { STRUCTURE_VPT, TILE, type SizeTier } from '../mj/classes';
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

/**
 * How the stamps of a place cut their lots (T407, ADR-0211): for the structures at `vpt` voxels a tile. At `STRUCTURE_VPT` (16, the
 * structures that grow by rules since T405, ADR-0209) every building a stamp draws holds the structure of the size `STAMP_SIZES` says, and a
 * stamp never covers what another stamp of the place took (`claimed`, its whole box) nor a building of the program (`built`: the codes of
 * walls, doors and inner floors): one lot, one structure, inside it. At TILE (20) the stamps of before, for the plans of before
 * (`ChunkPlan.vpt` absent): their places keep their tiles, their edits are per tile.
 */
export interface StampCut {
  vpt: number;
  /** Codes a stamp never covers: the buildings the program drew before it. */
  built?: string;
  /** Cells the stamps of this place took, their whole box: written by each stamp, read by the next. */
  claimed?: Set<number>;
}

/**
 * The size of the structure the lot of each shape holds at `STRUCTURE_VPT` (T407): the tiles of that size (`tilesOf`) fit in the lot,
 * walls included, both ways; a structure the Cartographer asks larger goes down to it (`claimSizes`). `building`: lots under 5 tiles, the
 * class `building` of a small house (2.5 tiles). The shapes without a lot have none.
 */
export const STAMP_SIZES: Readonly<Record<StampShape, SizeTier | 'building' | undefined>> = {
  house: 'large',
  castle: 'large',
  fortress: 'large',
  tower: 'large',
  temple: 'huge',
  pyramid: 'large',
  huts: 'building',
  pen: 'building',
  barracks: 'large',
  dungeon: 'large',
  lair: undefined,
  well: undefined,
};

/**
 * The pattern of a shape (role per cell; null = leave the ground as it is): at `STRUCTURE_VPT` the buildings hold the structure of
 * `STAMP_SIZES` (T407), at TILE the patterns of before (`patternAt20`).
 */
export function shapePattern(shape: StampShape, rng: Rng, vpt: number = STRUCTURE_VPT): Pat {
  if (vpt === TILE) return patternAt20(shape, rng);
  switch (shape) {
    case 'house': {
      // A Large structure is 6.25 tiles at 16: a building of 7 or 8 a side, walls included.
      const p = grid(7 + rng.int(2), 7 + rng.int(2));
      house(p, 0, 0, p[0].length, p.length);
      return p;
    }
    case 'castle': {
      // Moat, curtain wall with corner towers, a drawbridge at the gate, a keep of 7 × 7 in the courtyard.
      const p = grid(15, 15, 'ground');
      rect(p, 0, 0, 14, 14, 'water');
      rect(p, 1, 1, 13, 13, 'wall', 'ground');
      for (const [x, y] of [[1, 1], [12, 1], [1, 12], [12, 12]]) rect(p, x, y, x + 1, y + 1, 'wall', 'wall');
      house(p, 4, 3, 7, 7);
      p[13][7] = 'door';
      p[14][7] = 'bridge';
      for (let y = 10; y <= 12; y++) p[y][7] = 'road';
      return p;
    }
    case 'fortress': {
      // Two rings of walls, a courtyard of 8 × 8 with a barracks of 7 × 7 in its corner, a gate in each ring. 14 a side: its walls keep
      // off the border of the place (`stamp`), so the gates of the place are reached around it.
      const p = grid(14, 14, 'ground');
      rect(p, 0, 0, 13, 13, 'wall', 'wall');
      rect(p, 2, 2, 11, 11, 'wall', 'ground');
      p[13][6] = 'door';
      p[12][6] = 'road';
      p[11][6] = 'door';
      house(p, 3, 3, 7, 7);
      return p;
    }
    case 'temple': {
      // A hall of 10 × 10 with two rows of columns: a Huge structure is 9.375 tiles at 16.
      const p = grid(10, 10);
      rect(p, 0, 0, 9, 9, 'wall', 'floor');
      for (const y of [3, 6]) for (const x of [3, 6]) p[y][x] = 'wall';
      p[9][4] = 'door';
      p[9][5] = 'door';
      return p;
    }
    case 'pyramid': {
      // The chamber of 5 × 5 and its corridor: a building of 7 × 9 inside the stone.
      const p = grid(11, 11, 'wall');
      for (let y = 3; y <= 7; y++) for (let x = 3; x <= 7; x++) p[y][x] = 'floor';
      for (let y = 8; y <= 9; y++) p[y][5] = 'floor';
      p[10][5] = 'door';
      return p;
    }
    case 'barracks': {
      // Two halls of 7 × 7 wall to wall, a door each on the yard: two lots, one structure each.
      const p = grid(14, 7);
      house(p, 0, 0, 7, 7);
      house(p, 7, 0, 7, 7);
      return p;
    }
    case 'dungeon': {
      // Rock with four rooms dug out, one towards each corner, and corridors between them; one way in from the south. Rooms towards the
      // corners keep the dug floor 7 tiles or more each way, what a Large structure needs.
      const p = grid(14, 14, 'rock');
      const rooms: Array<[number, number, number, number]> = [];
      for (let k = 0; k < 4; k++) {
        const w = 3 + rng.int(2);
        const h = 3 + rng.int(2);
        const x = k % 2 === 0 ? 1 + rng.int(3) : 13 - w - rng.int(3);
        const y = k < 2 ? 1 + rng.int(3) : 12 - h - rng.int(3);
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
    default:
      return patternAt20(shape, rng);
  }
}

/** The patterns of before T407, for the plans of before (`ChunkPlan.vpt` absent): their buildings were cut for structures at 20. */
function patternAt20(shape: StampShape, rng: Rng): Pat {
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
 * At `STRUCTURE_VPT` (T407) its whole box stays off what the stamps before it took and off the buildings of the program (`StampCut`), its
 * walls and fences off the border and the fixed cells (the gates are reached around it), and every way in on its edge opens onto a tile
 * one can reach.
 */
export function stamp(cells: string[], w: number, h: number, fixed: Set<number> | undefined, shape: StampShape, codes: StampCodes, rng: Rng, on?: string, cut?: StampCut): boolean {
  const vpt = cut?.vpt ?? STRUCTURE_VPT;
  const pat = shapePattern(shape, rng, vpt);
  const apart = vpt !== TILE;
  const ph = pat.length;
  const pw = pat[0].length;
  if (pw > w - 2 || ph > h - 2) return false;
  for (let tries = 0; tries < 60; tries++) {
    const x0 = 1 + rng.int(w - pw - 1);
    const y0 = 1 + rng.int(h - ph - 1);
    let ok = true;
    for (let y = 0; y < ph && ok; y++)
      for (let x = 0; x < pw && ok; x++) {
        const i = (y0 + y) * w + x0 + x;
        const role = pat[y][x];
        if (apart && cut?.claimed?.has(i)) ok = false;
        else if (role && (fixed?.has(i) || (on && !on.includes(cells[i])) || (apart && cut?.built?.includes(cells[i])))) ok = false;
        // A wall or a fence of a stamp at 16 never touches the border (T407): a gate there would be shut in, walls are never dug.
        else if (apart && (role === 'wall' || role === 'fence') && [i - 1, i + 1, i - w, i + w].some((n) => fixed?.has(n))) ok = false;
        // Nor beside a building of the program: the tile around it, where its door opens, stays as it is.
        else if (apart && role && [i - 1, i + 1, i - w, i + w].some((n) => cut?.built?.includes(cells[n]))) ok = false;
      }
    if (!ok) continue;
    // At 16 (T407) every way in on the edge of the stamp (a door, a bridge, a road) opens onto a tile one can reach: not the border of the
    // place nor a cell of the lot of a block (fixed), not another building nor what another stamp took; it is taken, so the next keeps off.
    const fronts: number[] = [];
    if (apart) {
      for (let y = 0; y < ph && ok; y++)
        for (let x = 0; x < pw && ok; x++) {
          const role = pat[y][x];
          if (role !== 'door' && role !== 'bridge' && role !== 'road') continue;
          for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
            const px = x + dx, py = y + dy;
            if (px >= 0 && py >= 0 && px < pw && py < ph) continue;
            const nx = x0 + px, ny = y0 + py, n = ny * w + nx;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h || fixed?.has(n) || cut?.claimed?.has(n) || cut?.built?.includes(cells[n])) ok = false;
            else fronts.push(n);
          }
        }
      if (!ok) continue;
    }
    for (const n of fronts) cut?.claimed?.add(n);
    for (let y = 0; y < ph; y++)
      for (let x = 0; x < pw; x++) {
        const role = pat[y][x];
        const i = (y0 + y) * w + x0 + x;
        if (role) cells[i] = codes[role];
        if (apart) cut?.claimed?.add(i);
      }
    return true;
  }
  return false;
}
