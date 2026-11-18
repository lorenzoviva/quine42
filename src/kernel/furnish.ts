// The Scenografo's way of data in the kernel (T410, ADR-0214; `docs/design/scenografo.md` § 3 and § 10.2). A building that grows by rules
// changes with every seed, so the Scenografo does not draw its interior: it chooses, once for the type, which furniture of the library goes
// in which kind of room and how many (`InteriorRule`), and the kernel places them on every seed of the building:
//
//   - the rooms (`interiorRooms`): on every storey above the ground the covered floor of the interior's plan (`interiorPlan`), cut at the
//     narrow passages (`roomsOf`): the largest of a storey is its hall, a room of `ROOM_LEAST` tiles² or more a room, the others small;
//   - the furniture (`pieceOf`): the programs of the library's furniture run with their first seed, cropped to what they draw and resampled
//     to the building's density, so a piece of one tile stays one tile in a building at 16;
//   - the placing (`furnishWithRules`): the first rule that matches a room decides; every piece tried against a wall, turned, on the free
//     floor, never on the animals' place, and kept only if the guard of T409 (`InteriorGuard`) lets it: the building is never touched, the
//     door, the stairs and every storey stay reached, the Sculptor's room stays. A piece with no place is left out.
//
// Everything is a function of (building, rules, furniture, seed): no draw from the clock, the same voxels on every machine (the server's
// physics and the client's drawing agree). A form with an interior (`FormRequest.interior`) is made here by `runForm`; its key is the
// interior's (`interiorKey`), so the bare building keeps its own.

import { areasOf, type AreaMap } from '../mj/areas';
import type { PaletteEntry } from '../mj/engine';
import type { VoxelGrid } from '../mj/mesh';
import type { MjxClip } from '../mj/model';
import { BODY_R, formKey, runForm, type FormRequest, type FormResult } from './forms';
import { InteriorGuard, interiorPlan, NARROW, roomsOf, type Furnished, type InteriorPlan, type Refusal, type StoreyPlan } from './interior';
import { hashStr, Rng } from './rng';

/** The kinds of room a rule may name (T303): the largest of its storey, another of `ROOM_LEAST` tiles² or more, the others. */
export const ROOM_KINDS = ['hall', 'room', 'small'] as const;
export type RoomKind = (typeof ROOM_KINDS)[number];
/** A room that is not its storey's largest is a `room` from this many tiles² of body centres, `small` under it (T303). */
export const ROOM_LEAST = 1.5;

/**
 * The most a choice of the Scenografo says, whatever it says (rule 7: a hand-edited index, an answer out of its schema): rules, ids in a
 * rule, pieces a room asks for, storeys, the length of an area's name; and the furniture the catalogue offers.
 */
export const INTERIOR_LIMITS = { rules: 16, furniture: 8, count: 6, storey: 8, area: 40, catalogue: 32 } as const;

/** A rule of the Scenografo (T303, `lab/banco/scenografo/prompt-dati.md`): which rooms (a field left out matches all), which pieces, how many. */
export interface InteriorRule {
  /** 0 the ground floor, 1 the one above…: the storeys above the ground. */
  storey?: number;
  /** The area of the ground under the room, as the building's program names it (`areasOf`). */
  area?: string;
  room?: RoomKind;
  /** Ids of furniture of the library; for each piece one of them at random (an id said twice is chosen twice as often). */
  furniture: string[];
  count: number;
}

/** The interior of a type of building (T410): the Scenografo's rules, kept on the building's entry of `models/index.json` (`interior`). */
export interface InteriorSpec {
  rules: InteriorRule[];
  /** Who chose them: the model of the call, `offline` the local models (online the Scenografo is asked again). */
  author?: string;
}

/** What a form of a building with an interior carries to whoever runs it (`FormRequest.interior`): the rules, the furniture they name, the seed. */
export interface InteriorData {
  rules: InteriorRule[];
  /** Each piece of furniture the rules name, as its program runs (seed 1, no tint). */
  furniture: Record<string, FormRequest>;
  /** The seed of the furnishing: the building's own, so every instance of a seed is furnished the same. */
  seed: number;
  /** Voxels of the building under the ground (`Form.base`). */
  base: number;
}

const AREA_RE = /^[\p{L}\p{N}][\p{L}\p{N} _-]{0,39}$/u;

/**
 * The rules of an answer or of an index entry, read without trusting them: a rule without a piece the catalogue has (`known`) or with no
 * count is dropped; what is out of range is brought back into it; the ids not in the catalogue are said apart, for the feedback.
 */
export function readRules(raw: unknown, known: (id: string) => boolean): { rules: InteriorRule[]; unknown: string[] } {
  const list = raw && typeof raw === 'object' ? (raw as { rules?: unknown }).rules : undefined;
  const unknown = new Set<string>();
  const rules: InteriorRule[] = [];
  if (!Array.isArray(list)) return { rules, unknown: [] };
  for (const r of list) {
    if (rules.length >= INTERIOR_LIMITS.rules) break;
    if (!r || typeof r !== 'object') continue;
    const o = r as Record<string, unknown>;
    const ids = (Array.isArray(o.furniture) ? o.furniture : []).filter((x): x is string => typeof x === 'string').slice(0, INTERIOR_LIMITS.furniture * 2);
    for (const id of ids) if (!known(id)) unknown.add(id);
    const furniture = ids.filter((id) => known(id)).slice(0, INTERIOR_LIMITS.furniture);
    const n = typeof o.count === 'number' && Number.isFinite(o.count) ? Math.round(o.count) : 0;
    const count = Math.max(0, Math.min(INTERIOR_LIMITS.count, n));
    if (!furniture.length || !count) continue;
    const storey = typeof o.storey === 'number' && Number.isInteger(o.storey) && o.storey >= 0 && o.storey <= INTERIOR_LIMITS.storey ? o.storey : undefined;
    const area = typeof o.area === 'string' && o.area.trim() !== '*' && AREA_RE.test(o.area.trim()) ? o.area.trim() : undefined;
    const room = typeof o.room === 'string' && (ROOM_KINDS as readonly string[]).includes(o.room) ? (o.room as RoomKind) : undefined;
    rules.push({ ...(storey !== undefined ? { storey } : {}), ...(area ? { area } : {}), ...(room ? { room } : {}), furniture, count });
  }
  return { rules, unknown: [...unknown] };
}

/** An interior as an index entry says it, or undefined: rules the kernel can use, the author a short line. */
export function readInterior(raw: unknown, known: (id: string) => boolean): InteriorSpec | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const { rules } = readRules(raw, known);
  if (!rules.length) return undefined;
  const author = (raw as { author?: unknown }).author;
  return { rules, ...(typeof author === 'string' && author.length <= 80 ? { author } : {}) };
}

/** The ids of furniture the rules name, once each, in the order they are named. */
export const furnitureOf = (rules: readonly InteriorRule[]): string[] => [...new Set(rules.flatMap((r) => r.furniture))];

/** What an interior is for the key of its form (`interiorKey`): the rules, the base, each piece by the key of its program. */
export function interiorText(i: InteriorData): string {
  const pieces = Object.keys(i.furniture)
    .sort()
    .map((id) => {
      const k = formKey(i.furniture[id]);
      return [id, i.furniture[id].vpt, hashStr(k), k.length];
    });
  return JSON.stringify([i.rules, i.base, pieces]);
}

// ---------------------------------------------------------------- the rooms

/** A room as the rules see it: its storey above the ground, its kind, its size, the area under it, its centres. */
export interface InteriorRoom {
  storey: number;
  kind: RoomKind;
  /** Tiles² of body centres. */
  tiles: number;
  area?: string;
  /** Its body centres, `x + y·X`, on `plan.storeys[at]`. */
  cells: number[];
  at: number;
}

/** The rooms of a building's plan, storey by storey above the ground, the largest first (the bench's `arredaDati`, T303). */
export function interiorRooms(plan: InteriorPlan, areas: AreaMap = areasOf(plan.built, plan.palette, plan.vpt, plan.base)): InteriorRoom[] {
  const { X, vpt } = plan;
  const tileArea = new Map<string, string>();
  for (const [a, ts] of Object.entries(areas)) for (const [x, y] of ts) tileArea.set(`${x},${y}`, a);
  const out: InteriorRoom[] = [];
  let storey = 0;
  plan.storeys.forEach((p, at) => {
    // A low top under the ground is a floor no body reaches (ADR-0135): the cellar keeps only what reaches its ceiling, not these pieces.
    if (p.cellar) return;
    const rooms = roomsOf(p.centres, X, plan.Y, Math.round(NARROW * vpt)).sort((a, b) => b.length - a.length);
    rooms.forEach((cells, n) => {
      const tiles = cells.length / (vpt * vpt);
      const count = new Map<string, number>();
      for (const i of cells) {
        const a = tileArea.get(`${Math.floor((i % X) / vpt)},${Math.floor(Math.floor(i / X) / vpt)}`);
        if (a) count.set(a, (count.get(a) ?? 0) + 1);
      }
      const area = [...count.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]?.[0];
      out.push({ storey, kind: n === 0 ? 'hall' : tiles >= ROOM_LEAST ? 'room' : 'small', tiles, ...(area ? { area } : {}), cells, at });
    });
    storey++;
  });
  return out;
}

/** The first rule that matches a room, or undefined (the room stays empty). */
export const ruleFor = (rules: readonly InteriorRule[], r: Pick<InteriorRoom, 'storey' | 'kind' | 'area'>): InteriorRule | undefined =>
  rules.find((x) => (x.storey === undefined || x.storey === r.storey) && (!x.area || x.area === r.area) && (!x.room || x.room === r.kind));

/** Whether a storey's free floor has room for anything: what the Scenografo would be asked for. */
export const furnishable = (plan: InteriorPlan): boolean => plan.storeys.some((p) => !p.cellar && p.free.some((v) => v === 1));

// ---------------------------------------------------------------- the furniture

/** A piece of furniture at a building's density: its voxels cropped to what is drawn, letters of `alphabet` with `palette`'s colours. */
export interface FurniturePiece {
  id: string;
  X: number;
  Y: number;
  Z: number;
  cells: Uint8Array;
  alphabet: string[];
  palette: Record<string, PaletteEntry>;
}

/**
 * A piece of furniture from its program's result (`lab/banco/scenografo/scenografo.ts → catalogo`): cropped to the voxels with a colour
 * that are not hidden, resampled from its density to `toVpt`; undefined if it draws nothing.
 */
export function pieceOf(id: string, r: Pick<FormResult, 'grid' | 'palette'>, fromVpt: number, toVpt: number): FurniturePiece | undefined {
  const g = r.grid;
  const k = toVpt / fromVpt;
  const colored = (c: number) => c !== 0 && !!r.palette[g.alphabet[c]]?.color && !r.palette[g.alphabet[c]]?.hidden;
  let x0 = g.X, y0 = g.Y, x1 = -1, y1 = -1, z1 = -1;
  const XY = g.X * g.Y;
  for (let i = 0; i < g.cells.length; i++) {
    if (!colored(g.cells[i])) continue;
    const x = i % g.X, y = Math.floor(i / g.X) % g.Y, z = Math.floor(i / XY);
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
    if (z > z1) z1 = z;
  }
  if (x1 < 0 || !(k > 0)) return undefined;
  const X = Math.max(1, Math.round((x1 - x0 + 1) * k)), Y = Math.max(1, Math.round((y1 - y0 + 1) * k)), Z = Math.max(1, Math.round((z1 + 1) * k));
  const cells = new Uint8Array(X * Y * Z);
  for (let z = 0; z < Z; z++)
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++) {
        const c = g.cells[Math.min(x1, x0 + Math.floor(x / k)) + Math.min(y1, y0 + Math.floor(y / k)) * g.X + Math.min(z1, Math.floor(z / k)) * XY];
        cells[x + y * X + z * X * Y] = colored(c) ? c : 0;
      }
  return { id, X, Y, Z, cells, alphabet: [...g.alphabet], palette: r.palette };
}

/** A piece turned a quarter `q` times around z. */
export function turned(p: FurniturePiece, q: number): FurniturePiece {
  let cur = p;
  for (let n = 0; n < q % 4; n++) {
    const { X, Y, Z } = cur;
    const cells = new Uint8Array(X * Y * Z);
    for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) cells[Y - 1 - y + x * Y + z * X * Y] = cur.cells[x + y * X + z * X * Y];
    cur = { ...cur, X: Y, Y: X, cells };
  }
  return cur;
}

/** The pieces this process has made (a worker, a server): one run per program and density, whatever building asks. */
const PIECES = new Map<string, FurniturePiece | null>();
const PIECES_KEPT = 128;

/** A piece of furniture of a request at a density: its program run once (seed 1), or undefined if it fails, does not finish or draws nothing. */
export function furniturePiece(id: string, q: FormRequest, toVpt: number): FurniturePiece | undefined {
  const key = `${toVpt}|${id}|${formKey(q)}`;
  const hit = PIECES.get(key);
  if (hit !== undefined) return hit ?? undefined;
  let piece: FurniturePiece | undefined;
  let finished = true;
  try {
    const r = runForm(q);
    finished = r.finished;
    // Half a program depends on the machine: never placed, so the server's physics and the client's drawing agree.
    piece = finished ? pieceOf(id, r, q.vpt, toVpt) : undefined;
  } catch {
    piece = undefined;
  }
  if (!finished) return undefined;
  if (PIECES.size >= PIECES_KEPT) PIECES.delete(PIECES.keys().next().value!);
  PIECES.set(key, piece ?? null);
  return piece;
}

// ---------------------------------------------------------------- the placing

/** In how many 4-connected pieces the cells of a storey are, `without` some of them. */
function piecesOf(cells: ReadonlySet<number>, X: number, without: readonly number[] = []): number {
  const out = new Set(without);
  const seen = new Set<number>();
  let n = 0;
  for (const s of cells) {
    if (seen.has(s) || out.has(s)) continue;
    n++;
    const stack = [s];
    seen.add(s);
    while (stack.length) {
      const i = stack.pop()!;
      const x = i % X;
      for (const j of [x > 0 ? i - 1 : -1, x < X - 1 ? i + 1 : -1, i - X, i + X])
        if (j >= 0 && cells.has(j) && !seen.has(j) && !out.has(j)) {
          seen.add(j);
          stack.push(j);
        }
    }
  }
  return n;
}

/**
 * How many places a piece is tried at before it is left out, how many of them the guard may refuse (each refusal is a walk of the whole
 * building: the cost stays bounded), and how far apart its places are (voxels).
 */
const TRIES = 400;
const GUARD_TRIES = 4;
const STRIDE = 2;
/**
 * The most a building's furnishing does, whatever its rules say (a hand-written index, many rooms): pieces tried and walks of the guard, in
 * all. Counted, not timed: the same furniture on every machine, and a world of many never waits more than a few seconds for one building.
 */
export const FURNISH_CAPS = { pieces: 64, guard: 96 } as const;

/**
 * The rules placed on a building (T410): room by room, the first rule that matches decides; each piece picked at random among its ids,
 * turned, tried on free floor against a wall (or another piece), never on the animals' place, never taking more than half the room's centres,
 * and kept only if the guard lets it (`InteriorGuard`, T409). The building's letters stay; the furniture's colours join its alphabet, one
 * letter per colour, never past the 255 a grid holds.
 */
export function furnishWithRules(plan: InteriorPlan, rules: readonly InteriorRule[], pieces: ReadonlyMap<string, FurniturePiece>, seed: number, guard = new InteriorGuard(plan)): Furnished {
  const built = plan.built;
  const { X, Y, Z, vpt } = plan;
  const XY = X * Y;
  const alphabet = [...built.alphabet];
  const cells = new Uint8Array(built.cells);
  const open = plan.walked.g.cells;
  const colours: Record<string, PaletteEntry> = {};
  const letterOf = new Map<string, number>();
  const taken = new Set<string>([...alphabet, ...Object.keys(plan.palette)]);
  let next = 0xe000;
  /** How a colour of the furniture looks in the building: its colour, its light, its glass; nothing of its rig nor of its areas. */
  const lookOf = (e: PaletteEntry): PaletteEntry => ({ color: e.color, ...(e.glow ? { glow: e.glow } : {}), ...(typeof e.alpha === 'number' ? { alpha: e.alpha } : {}) });
  /** The building's code of a colour of the furniture: one letter per look, from the private area. */
  const codeOf = (e: PaletteEntry): number => {
    const look = lookOf(e);
    const key = JSON.stringify(look);
    const known = letterOf.get(key);
    if (known !== undefined) return known;
    let sym = String.fromCharCode(next++);
    while (taken.has(sym)) sym = String.fromCharCode(next++);
    taken.add(sym);
    colours[sym] = look;
    const code = alphabet.push(sym) - 1;
    letterOf.set(key, code);
    return code;
  };
  const refused: Record<Refusal, number> = { wall: 0, animals: 0, cellar: 0, room: 0, cut: 0 };
  const voxels = new Set<number>();
  let placed = 0;
  const r = Math.ceil(BODY_R * vpt);
  const rng = new Rng(hashStr(`interior|${seed}`));
  const solidAt = (i: number) => cells[i] !== 0 || open[i] !== 0;
  /** Per storey, its centres no piece kept so far has taken, and in how many pieces they are. */
  const alive = new Map<StoreyPlan, Set<number>>();
  const parts = new Map<StoreyPlan, number>();
  const aliveOf = (p: StoreyPlan): Set<number> => {
    let s = alive.get(p);
    if (!s) alive.set(p, (s = new Set(p.centres)));
    return s;
  };
  let tried = 0, walks = 0;
  for (const room of interiorRooms(plan)) {
    if (tried >= FURNISH_CAPS.pieces || walks >= FURNISH_CAPS.guard) break;
    const rule = ruleFor(rules, room);
    if (!rule) continue;
    const list = rule.furniture.filter((id) => pieces.has(id));
    if (!list.length) continue;
    const p: StoreyPlan = plan.storeys[room.at];
    const animals = p === plan.ground ? plan.animals : undefined;
    const inRoom = new Set(room.cells);
    const all = room.cells.length;
    let bx0 = X, by0 = Y, bx1 = 0, by1 = 0;
    for (const i of room.cells) {
      const x = i % X, y = Math.floor(i / X);
      if (x < bx0) bx0 = x;
      if (x > bx1) bx1 = x;
      if (y < by0) by0 = y;
      if (y > by1) by1 = y;
    }
    for (let k = 0; k < rule.count && tried < FURNISH_CAPS.pieces && walks < FURNISH_CAPS.guard; k++) {
      tried++;
      const piece = turned(pieces.get(list[rng.int(list.length)])!, rng.int(4));
      if (p.z + piece.Z > Z) continue;
      // Every place two voxels apart around the room's centres: the piece goes against a wall, not on a centre.
      const cands: number[] = [];
      for (let y0 = Math.max(1, by0 - r - piece.Y); y0 <= Math.min(Y - piece.Y - 1, by1 + r); y0 += STRIDE)
        for (let x0 = Math.max(1, bx0 - r - piece.X); x0 <= Math.min(X - piece.X - 1, bx1 + r); x0 += STRIDE) cands.push(x0 + y0 * X);
      let refusals = 0;
      for (let tries = 0; tries < TRIES && cands.length && refusals < GUARD_TRIES && walks < FURNISH_CAPS.guard; tries++) {
        const o = cands.splice(rng.int(cands.length), 1)[0];
        const x0 = o % X, y0 = Math.floor(o / X);
        let ok = true, wall = false;
        for (let y = 0; y < piece.Y && ok; y++)
          for (let x = 0; x < piece.X && ok; x++) {
            const i = x0 + x + (y0 + y) * X;
            if (!p.free[i] || solidAt(i + p.z * XY) || animals?.[i]) ok = false;
            for (const j of [i - STRIDE, i + STRIDE, i - STRIDE * X, i + STRIDE * X]) if (j >= 0 && j < XY && solidAt(j + p.z * XY) && !p.free[j] && !p.kept[j]) wall = true;
          }
        if (!ok || !wall) continue;
        // The centres a body touching it would lose: at least half of the room stays where one stands.
        const lost: number[] = [];
        const live = aliveOf(p);
        const gone: number[] = [];
        for (let y = Math.max(0, y0 - r); y < Math.min(Y, y0 + piece.Y + r); y++)
          for (let x = Math.max(0, x0 - r); x < Math.min(X, x0 + piece.X + r); x++) {
            const i = x + y * X;
            if (inRoom.has(i)) lost.push(i);
            if (live.has(i)) gone.push(i);
          }
        if (inRoom.size - lost.length < 0.5 * all) continue;
        // Before the guard, which walks the whole building (T409, tens of milliseconds): the storey's centres without these must stay in as
        // many pieces as before. It only takes away what the guard would weigh; what it lets through the guard still decides.
        if (piecesOf(live, X, gone) > (parts.get(p) ?? piecesOf(live, X))) {
          refused.cut++;
          continue;
        }
        const vox: number[] = [];
        const code: number[] = [];
        const looks = new Set<string>();
        for (let z = 0; z < piece.Z; z++)
          for (let y = 0; y < piece.Y; y++)
            for (let x = 0; x < piece.X; x++) {
              const c = piece.cells[x + y * piece.X + z * piece.X * piece.Y];
              if (!c) continue;
              const at = x0 + x + (y0 + y) * X + (p.z + z) * XY;
              if (solidAt(at)) continue;
              const entry = piece.palette[piece.alphabet[c]];
              if (!entry?.color) continue;
              vox.push(at);
              code.push(c);
              looks.add(JSON.stringify(lookOf(entry)));
            }
        if (!vox.length) continue;
        // A grid holds 255 letters: a piece whose colours would not fit is left out, before the guard takes its places.
        if (alphabet.length + [...looks].filter((l) => !letterOf.has(l)).length > 255) continue;
        walks++;
        const why = guard.refusal(vox);
        if (why) {
          refused[why]++;
          refusals++;
          continue;
        }
        vox.forEach((at, n) => {
          cells[at] = codeOf(piece.palette[piece.alphabet[code[n]]]);
          voxels.add(at);
        });
        for (const i of lost) inRoom.delete(i);
        for (const i of gone) live.delete(i);
        parts.set(p, piecesOf(live, X));
        placed++;
        break;
      }
    }
  }
  const grid: VoxelGrid = { X, Y, Z, cells, alphabet };
  return { grid, palette: { ...plan.palette, ...colours }, voxels, pieces: placed, refused };
}

/**
 * A building's form furnished as its request says (`FormRequest.interior`), by `runForm`: the plan of its interior on the grid as built (the
 * door walked open, `actions`), the furniture run and resampled, the rules placed. Undefined when nothing could be placed or something
 * threw: the building stays as it was built (rule 7: an interior never breaks a building).
 */
export function furnishForm(i: InteriorData, built: Pick<FormResult, 'grid' | 'palette'>, vpt: number, actions: readonly MjxClip[]): Furnished | undefined {
  try {
    const pieces = new Map<string, FurniturePiece>();
    for (const id of furnitureOf(i.rules)) {
      const q = i.furniture[id];
      const piece = q ? furniturePiece(id, q, vpt) : undefined;
      if (piece) pieces.set(id, piece);
    }
    if (!pieces.size) return undefined;
    const base = i.base > 0 && i.base < built.grid.Z ? i.base : 0;
    const plan = interiorPlan({ grid: built.grid, palette: built.palette, vpt, base, actions, seed: i.seed });
    if (!furnishable(plan)) return undefined;
    const f = furnishWithRules(plan, i.rules, pieces, i.seed);
    return f.pieces ? f : undefined;
  } catch {
    return undefined;
  }
}
