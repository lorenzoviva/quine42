// The furniture of the interiors as things of the world (T514, ADR-0272). The Scenografo's pieces are voxels of their building
// (`furnishWithRules`, ADR-0214): drawn with it, one mesh, and its walls and floors for whoever walks. So that they are used too, the
// kernel puts beside every piece placed a thing of the world that is not drawn (a «piece», component `fitted`): of the module that
// wears the piece's model (`pieceModule`: its actions, its container, `takeable`), standing where the piece stands, on its storey; a
// piece no module wears is a thing all the same, with the menu of every thing (Examine, Other…, Put down on it). Who it is, is its
// building's origin and the piece (`pieceOrigin`), the same on every load: the save keeps its container, `consumed` what was taken
// away. A piece taken away (or broken) leaves the building too: the building's instance says which (`FormComp.out`), and its grid
// is the furnished one without their voxels (`withoutPieces`), as an open door is its grid with the door's action done.
//
// Pure functions: the keys, the origin, where a piece stands in the world, the module of a model, the shelves of a piece in the
// building's floors (ADR-0150), the component read without trusting it (a mirror gets it on the wire).

import type { Levels } from '../mj/mesh';
import type { PieceBox } from './interior';
import type { Manifest } from './types';

/** The seed every piece of an interior runs with (`Forms.interiorBase`): taken away, the thing looks as it did in the building. */
export const PIECE_SEED = 1;

/** What joins a building's origin to its piece's key, in the piece's origin: no origin the kernel makes otherwise has it. */
export const PIECE_MARK = '~';

/** The longest origin a carried or moved thing keeps (`moving.ts`): a piece's is made shorter than that. */
const MAX_PIECE_ORIGIN = 150;

/** A piece of a furnished building, as its form says it (`FormResult.furniture`): the library's id, its box, its voxels. */
export interface PlacedPiece {
  id: string;
  box: PieceBox;
  /** Its voxels in the building's grid, `x + y·X + z·X·Y` (T514): what leaves the grid when it is taken away. */
  cells?: readonly number[];
}

/**
 * The key of every piece of a building's form, in its order: the furniture's id and the lowest corner of its box, which no two pieces
 * share (their voxels never touch); one that would, the same key with its number. The same form gives the same keys on every machine.
 */
export function pieceKeys(list: readonly Pick<PlacedPiece, 'id' | 'box'>[] | undefined): string[] {
  const seen = new Set<string>();
  return (list ?? []).map((p) => {
    const base = `${p.id}@${p.box[0]},${p.box[1]},${p.box[2]}`;
    let key = base;
    for (let n = 2; seen.has(key); n++) key = `${base}#${n}`;
    seen.add(key);
    return key;
  });
}

/** Who a piece is (T514): its building's origin and its key; too long for a save, the key's hash in its place. */
export function pieceOrigin(building: string, key: string): string {
  const o = `${building}${PIECE_MARK}${key}`;
  if (o.length <= MAX_PIECE_ORIGIN) return o;
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 0x01000193) >>> 0;
  return `${building.slice(0, MAX_PIECE_ORIGIN - 10)}${PIECE_MARK}${h.toString(36)}`;
}

/** The pieces taken away of a building as its instance says them (`FormComp.out`): a sorted list, each key once; at most `max`. */
export function outList(v: unknown, max = 64): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = [...new Set(v.filter((k): k is string => typeof k === 'string' && k.length > 0 && k.length <= 200))].sort().slice(0, max);
  return out.length ? out : undefined;
}

/**
 * The grid of a building without some of its pieces (T514), in place: their voxels empty again, as the building was there before the
 * Scenografo (a piece never takes a voxel of the building, ADR-0212). A piece that does not say its voxels stays (a form of before).
 */
export function withoutPieces(cells: Uint8Array, list: readonly PlacedPiece[] | undefined, out: readonly string[] | undefined): void {
  if (!list?.length || !out?.length) return;
  const gone = new Set(out);
  const keys = pieceKeys(list);
  list.forEach((p, n) => {
    if (!gone.has(keys[n]) || !p.cells) return;
    for (const i of p.cells) if (i >= 0 && i < cells.length) cells[i] = 0;
  });
}

/** Where a piece stands in the world (tiles): the middle of its box, the floor it stands on, its top, its half sides along the building's. */
export interface PieceFrame {
  x: number;
  y: number;
  z: number;
  top: number;
  hx: number;
  hy: number;
}

/**
 * A piece's box in the world (T514): the building stands at (x, y) turned by `yaw`, its ground at `stand` (tiles), its lowest `base`
 * voxels under it; a voxel column of its grid is where `builtAt` and `furnitureAt` find it (`toLocal`, the middle of the grid).
 */
export function pieceFrame(box: PieceBox, grid: { X: number; Y: number }, vpt: number, base: number, at: { x: number; y: number; yaw: number; stand: number }): PieceFrame {
  const [x0, y0, z0, x1, y1, z1] = box;
  const lx = ((x0 + x1 + 1) / 2 - grid.X / 2) / vpt, lz = ((y0 + y1 + 1) / 2 - grid.Y / 2) / vpt;
  const c = Math.cos(at.yaw), s = Math.sin(at.yaw);
  return {
    x: at.x + lx * c + lz * s,
    y: at.y - lx * s + lz * c,
    z: at.stand + (z0 - base) / vpt,
    top: at.stand + (z1 + 1 - base) / vpt,
    hx: (x1 - x0 + 1) / 2 / vpt,
    hy: (y1 - y0 + 1) / 2 / vpt,
  };
}

/**
 * The thing a piece is (T514): of the modules of the world that wear its model (`appearance.model`), a thing of the world that is not
 * someone, a vehicle nor one of a kind; the one that stays still and does something (a container, an action, words) before the others,
 * then by id. Undefined: no module wears it, the piece is a thing with the menu of every thing.
 */
export function pieceModule(manifests: Iterable<Manifest>, model: string): Manifest | undefined {
  let best: Manifest | undefined, rank = Infinity;
  for (const m of manifests) {
    if (m.kind !== 'entity' || m.persona || m.unique || m.vehicle || m.appearance?.model !== model) continue;
    const r = (m.physics?.pushable ? 2 : 0) + (m.container || m.actions?.length || m.interaction ? 0 : 1);
    if (r < rank || (r === rank && best && m.id < best.id)) [best, rank] = [m, r];
  }
  return best;
}

/** The slots of the container the kernel gives a piece no module wears whose name says it holds things (`storeNamed`). */
export const PIECE_STORE = 8;

/** The heads of an Italian name of furniture that holds things: a chest, a trunk, a cupboard, a wardrobe, a safe, a barrel, a basket. */
const IT_STORES =
  'cassa|casse|cassetta|cassette|cassapanca|cassapanche|baule|bauli|bauletto|forziere|forzieri|scrigno|scrigni|credenza|credenze|armadio|armadi|armadietto|armadietti|madia|madie|cassettiera|cassettiere|cassettone|cassettoni|comò|dispensa|dispense|cassaforte|casseforti|stipo|stipi|mobiletto|mobiletti|archivio|archivi|barile|barili|botte|botti|cesta|ceste|cesto|cesti|scatola|scatole';
/** The same in English. */
const EN_STORES = 'chests?|trunks?|coffers?|crates?|box|boxes|cupboards?|wardrobes?|cabinets?|dressers?|drawers?|sideboards?|lockers?|safes?|pantry|pantries|barrels?|casks?|baskets?|hampers?';
const STORE_RE = new RegExp(String.raw`(?:^|[^a-zà-ÿ])(?:${IT_STORES}|${EN_STORES})(?![a-zà-ÿ])`, 'i');

/**
 * Whether the name of a piece of furniture says it holds things (T514): a word of a chest, a cupboard, a barrel… in its first words, before
 * what it belongs to («Credenza», «Archivio pneumatico», «Old sea chest»; not «Scaffale della cantina», «Rastrelliera delle botti»). In a world
 * whose modules do not wear the seed's furniture (the Council's), a chest in a house still opens: the kernel gives it a container.
 */
export function storeNamed(name: string): boolean {
  const head = String(name ?? '').split(/\s+(?:of|with|for|from|on|in|at|by|del|della|dello|dei|degli|delle|di|da|con|per)\s+|[,;:(–—-]/i)[0] ?? '';
  return STORE_RE.test(head);
}

/** The component of a piece (T514): who it is in its building (only the world's), what it is, where it stands (tiles), how it is turned. */
export interface FittedComp {
  /** Its building's origin and its key: only the world has them, a client never (`readFitted`). */
  of?: string;
  key?: string;
  /** The library's furniture it is, and its name there. */
  model: string;
  name: string;
  /** The building's yaw, and the half sides of its box along the building's axes. */
  yaw: number;
  hx: number;
  hy: number;
  /** The floor it stands on and its top (tiles). */
  z: number;
  top: number;
}

const finite = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= max;
const text = (v: unknown, max: number): v is string => typeof v === 'string' && v.length > 0 && v.length <= max;

/** A piece's component as a client may read it (rule 7): numbers that are numbers, short texts; nothing else; undefined if it is not one. */
export function readFitted(v: unknown): FittedComp | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const o = v as Record<string, unknown>;
  if (!text(o.model, 120) || !finite(o.yaw, 100) || !finite(o.z, 1e5) || !finite(o.top, 1e5)) return undefined;
  if (!finite(o.hx, 64) || !finite(o.hy, 64) || !(o.hx > 0) || !(o.hy > 0)) return undefined;
  return { model: o.model, name: text(o.name, 120) ? o.name : o.model, yaw: o.yaw, hx: o.hx, hy: o.hy, z: o.z, top: Math.max(o.z, o.top) };
}

/** What a client gets of a piece's component: what it is and where, never who (its origin, ADR-0168). */
export function shownFitted(f: FittedComp): FittedComp {
  return { model: f.model, name: f.name, yaw: f.yaw, hx: f.hx, hy: f.hy, z: f.z, top: f.top };
}

/** Whether a point of the world (tiles) is over a piece standing at `at`: inside its box, turned as its building. */
export function overPiece(f: Pick<FittedComp, 'yaw' | 'hx' | 'hy'>, at: { x: number; y: number }, x: number, y: number, slack = 0): boolean {
  const c = Math.cos(f.yaw), s = Math.sin(f.yaw);
  const dx = x - at.x, dy = y - at.y;
  const lx = dx * c - dy * s, lz = dx * s + dy * c;
  return Math.abs(lx) <= f.hx + slack && Math.abs(lz) <= f.hy + slack;
}

/**
 * The floors of a building's form over a piece's box (ADR-0150, T514): its columns alone, as `placing.ts` reads a piece of furniture's
 * own form; heights stay the building's (voxels from the bottom of its grid). A shelf of the piece is a floor over its bottom and not over
 * its top (`Support.base`, `Support.top`): the floor it stands on and the storey above are not.
 */
export function pieceLevels(levels: Levels, X: number, box: PieceBox): Levels {
  const [x0, y0, , x1, y1] = box;
  const W = x1 - x0 + 1, H = y1 - y0 + 1;
  const start = new Uint32Array(W * H + 1);
  const z: number[] = [], base: number[] = [], block: number[] = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = x0 + x + (y0 + y) * X;
      start[x + y * W] = z.length;
      if (i + 1 >= levels.start.length) continue;
      for (let l = levels.start[i]; l < levels.start[i + 1]; l++) {
        z.push(levels.z[l]);
        base.push(levels.base[l]);
        block.push(levels.block[l]);
      }
    }
  start[W * H] = z.length;
  return { start, z: Uint16Array.from(z), base: Uint16Array.from(base), block: Uint8Array.from(block) };
}
