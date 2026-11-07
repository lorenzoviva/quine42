// The three ways of wearing a thing (T289), on the bench. All three start from the zones of body.ts and work in the frame of the
// zone (a torso on all fours is turned up first, and back after):
//
// - A, two programs per thing: the second one, written for the box of a zone of the wanderer, is run once and its mesh is fitted
//   to the zone of whoever wears it (stretched axis by axis onto the zone's box with a margin, as a held thing is posed on a hand).
//   In the game it would be a mesh of its own, shared by every wearer; here its voxels are written into the body's grid, so that
//   the photographs show what the separate mesh would cover (where the two overlap the thing is drawn, as its mesh would hide
//   the body; what the body has outside it shows through, as it would).
// - B, one program per thing, with a `<worn>` section: rules that run on the body of the wearer. Before them the kernel writes
//   four letters on a copy of the body: z (the voxels of the zone), o (the rest of the body), r (the air where the thing may be)
//   and m (that air on the middle line of the zone); the body's own letters are out of reach of the rules. Afterwards z and o go
//   back to what they were, r and m to air: what the rules wrote in the thing's letters stays, a new body.
// - C, no program: the kernel recolours the outer voxels of the zone in the colours of the thing (the two most used letters of
//   its program on the ground) and adds a few cells where a slot asks for them (the fall of a cloak standing).
//
// Several things are worn in order, the outer first (cloak, cuirass, helmet): a later one never writes over an earlier one.

import { runOn, type PaletteEntry, type Vec3 } from '../../../src/mj/engine';
import { colorTable, partTable, type VoxelGrid } from '../../../src/mj/mesh';
import { compileMjx } from '../../../src/mj/model';
import { FORM_LIMITS, runMjx } from '../../../src/mj/run';
import { bodyOf, coordsOf, turnBack, turnIndex, turnUp, turned, type Body, type ZoneId } from './body';

export type WayId = 'A' | 'B' | 'C';
export const WAYS: readonly WayId[] = ['A', 'B', 'C'];

export type ItemId = 'cloak' | 'cuirass' | 'helmet';
/** The order things are put on: the outer first, so that a later one fills only what is left. */
export const ITEMS: readonly ItemId[] = ['cloak', 'cuirass', 'helmet'];

/** A grid and the palette of its letters. */
export interface Dressed {
  grid: VoxelGrid;
  palette: Record<string, PaletteEntry>;
}

/** A thing of the bench: its program on the ground, its `<worn>` section (B), its second program (A). */
export interface Item {
  id: ItemId;
  name: string;
  zone: ZoneId;
  /** The program on the ground, as the Sculptor writes it, without its `<worn>` section. */
  ground: string;
  /** The `<worn>` section, whole (way B). */
  worn?: string;
  /** The second program, the worn mesh (way A). */
  wornProgram?: string;
}

/** What wearing one thing did to a body. */
export interface Change {
  item: ItemId;
  way: WayId;
  /** Voxels where there was air. */
  added: number;
  /** Body voxels that took a colour of the thing. */
  recoloured: number;
  /** Body voxels the thing went through (A: its mesh would hide them; they are drawn as the thing). */
  overlapped: number;
  /** Milliseconds of the change itself (not the programs of the thing, run once for every body). */
  ms: number;
}

// --- Things ----------------------------------------------------------------------------------------------------------------------

const WORN_RE = /<worn\b([^>]*)>([\s\S]*?)<\/worn>/;

/**
 * A thing's program split into the program on the ground and its `<worn>` section (the element outside comments, with the comment
 * just before it, which is part of what the Sculptor writes for it).
 */
export function splitWorn(xml: string): { ground: string; worn?: string; zone?: ZoneId } {
  const comments = [...xml.matchAll(/<!--[\s\S]*?-->/g)].map((m) => [m.index!, m.index! + m[0].length] as const);
  // The comments blanked, at their places: a comment may name the element.
  const bare = xml.replace(/<!--[\s\S]*?-->/g, (c) => ' '.repeat(c.length));
  const m = WORN_RE.exec(bare);
  if (!m) return { ground: xml };
  let start = m.index!;
  const before = comments.find(([, b]) => /^\s*$/.test(xml.slice(b, start)));
  if (before) start = before[0];
  const zone = /\bzone="([a-z]+)"/.exec(m[1])?.[1] as ZoneId | undefined;
  return { ground: (xml.slice(0, start) + xml.slice(m.index! + m[0].length)).trimEnd() + '\n', worn: xml.slice(start, m.index! + m[0].length), ...(zone ? { zone } : {}) };
}

/** A program run as the game runs it (its own box, seed 1). */
export function runProgram(xml: string, seed = 1): Dressed & { ms: number } {
  const m = compileMjx(xml);
  const t0 = performance.now();
  const r = runMjx(m, seed, { limits: FORM_LIMITS, deadline: 8_000 });
  return { grid: r.grid, palette: m.program.palette, ms: performance.now() - t0 };
}

/**
 * The colours of a thing for way C: the letter with the most visible voxels, then the most used one that is not a shade of it
 * (`partTable`: the iron in the shade is the iron, the brass is another colour).
 */
export function mainColors(d: Dressed): PaletteEntry[] {
  const colors = colorTable(d.grid.alphabet, d.palette);
  const parts = partTable(d.grid.alphabet, d.palette);
  const count = new Map<number, number>();
  for (const c of d.grid.cells) if (colors[c]) count.set(c, (count.get(c) ?? 0) + 1);
  const order = [...count].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  if (!order.length) return [];
  const other = order.find((c) => parts[c] !== parts[order[0]]);
  return [order[0], ...(other !== undefined ? [other] : [])].map((c) => d.palette[d.grid.alphabet[c]]);
}

// --- The grid of a dressed body ----------------------------------------------------------------------------------------------------

/** The body in a box with room around it for what it will wear: `p` voxels on every side, above, not under the feet. */
export function padded(d: Dressed, p: number): Dressed {
  const { X, Y, Z } = d.grid;
  const [X2, Y2, Z2] = [X + 2 * p, Y + 2 * p, Z + p];
  const cells = new Uint8Array(X2 * Y2 * Z2);
  for (let z = 0; z < Z; z++)
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++) cells[x + p + (y + p) * X2 + z * X2 * Y2] = d.grid.cells[x + y * X + z * X * Y];
  return { grid: { X: X2, Y: Y2, Z: Z2, cells, alphabet: [...d.grid.alphabet] }, palette: { ...d.palette } };
}

/** A new letter of the dressed body, with its colour: never one of the body's or of a thing's own (the rules cannot name it). */
function letter(d: Dressed, entry: PaletteEntry): number {
  let n = 0;
  let ch: string;
  do ch = String.fromCharCode(0xe100 + n++);
  while (d.grid.alphabet.includes(ch));
  d.grid.alphabet.push(ch);
  d.palette[ch] = { ...entry };
  return d.grid.alphabet.length - 1;
}

/** Codes of the letters of things already worn: a later thing does not write over them. */
const thingCodes = new WeakMap<VoxelGrid, Set<number>>();
const wornCodes = (g: VoxelGrid) => thingCodes.get(g) ?? thingCodes.set(g, new Set()).get(g)!;

/** The grid of the zone's frame: turned up for a torso or a back on all fours, else a copy. */
function frameOf(d: Dressed, body: Body, zone: ZoneId): { grid: VoxelGrid; cells: number[]; turn: boolean } {
  const turn = turned(body, zone);
  const g = d.grid;
  const grid = turn ? turnUp(g) : { ...g, cells: new Uint8Array(g.cells) };
  const cells = (body.zones[zone]?.cells ?? []).map((c) => (turn ? turnIndex(g, c) : c));
  return { grid, cells, turn };
}

/** Writes the zone's frame back into the dressed body. */
function settle(d: Dressed, frame: { grid: VoxelGrid; turn: boolean }): void {
  const back = frame.turn ? turnBack(frame.grid) : frame.grid;
  d.grid.cells.set(back.cells);
}

function boundsOf(g: VoxelGrid, cells: readonly number[]): { min: Vec3; max: Vec3; mean: Vec3 } {
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  const mean: Vec3 = [0, 0, 0];
  for (const c of cells) {
    const p = coordsOf(g, c);
    for (let a = 0; a < 3; a++) {
      min[a] = Math.min(min[a], p[a]);
      max[a] = Math.max(max[a], p[a]);
      mean[a] += p[a] / cells.length;
    }
  }
  return { min, max, mean };
}

// --- A: a second program, fitted to the zone ---------------------------------------------------------------------------------------

/**
 * The box a worn program is stretched onto, in the zone's frame: a head with a voxel round it and one above; a torso with a voxel
 * round it; behind a back, from its rear to the middle of the torso, from the ground (standing) or the end of the back (on all
 * fours) to over the shoulders. The worn programs of the bench are written for these boxes on the wanderer.
 */
export function fitBox(zone: ZoneId, b: { min: Vec3; max: Vec3 }, upright: boolean): { min: Vec3; max: Vec3 } {
  const { min, max } = b;
  if (zone === 'head') return { min: [min[0] - 1, min[1] - 1, min[2]], max: [max[0] + 1, max[1] + 1, max[2] + 1] };
  if (zone === 'torso') return { min: [min[0] - 1, min[1] - 1, min[2]], max: [max[0] + 1, max[1] + 1, max[2]] };
  return { min: [min[0] - 1, min[1] - 1, upright ? 1 : min[2] - 1], max: [max[0] + 1, max[1], max[2] + 1] };
}

/** Way A: the worn program's voxels (`mesh`, run once) stretched onto the box of the zone. */
export function wearA(d: Dressed, body: Body, item: Item, mesh: Dressed): Change {
  const t0 = performance.now();
  const frame = frameOf(d, body, item.zone);
  const g = frame.grid;
  const out: Change = { item: item.id, way: 'A', added: 0, recoloured: 0, overlapped: 0, ms: 0 };
  if (!frame.cells.length) return { ...out, ms: performance.now() - t0 };
  const box = fitBox(item.zone, boundsOf(g, frame.cells), body.upright);
  const W = mesh.grid;
  const colors = colorTable(W.alphabet, mesh.palette);
  const solid = colorTable(g.alphabet, d.palette);
  const codes = new Map<number, number>();
  const taken = wornCodes(d.grid);
  const size = [0, 1, 2].map((a) => box.max[a] - box.min[a] + 1);
  for (let z = Math.max(0, box.min[2]); z <= Math.min(g.Z - 1, box.max[2]); z++)
    for (let y = Math.max(0, box.min[1]); y <= Math.min(g.Y - 1, box.max[1]); y++)
      for (let x = Math.max(0, box.min[0]); x <= Math.min(g.X - 1, box.max[0]); x++) {
        const s = [x, y, z].map((v, a) => Math.min([W.X, W.Y, W.Z][a] - 1, Math.floor(((v - box.min[a]) * [W.X, W.Y, W.Z][a]) / size[a])));
        const wc = W.cells[s[0] + s[1] * W.X + s[2] * W.X * W.Y];
        if (!colors[wc]) continue;
        const i = x + y * g.X + z * g.X * g.Y;
        if (taken.has(g.cells[i])) continue;
        let code = codes.get(wc);
        if (code === undefined) codes.set(wc, (code = letter(d, mesh.palette[W.alphabet[wc]])));
        if (solid[g.cells[i]]) out.overlapped++;
        else out.added++;
        g.cells[i] = code;
      }
  for (const c of codes.values()) taken.add(c);
  settle(d, frame);
  return { ...out, ms: performance.now() - t0 };
}

// --- B: the thing's rules on the body -----------------------------------------------------------------------------------------------

/** How far the air of a zone reaches (Chebyshev, voxels): over and round a head, round a torso. */
export const REACH = { head: 3, torso: 2 } as const;
const MARKERS = 'zorm';

/** A `<worn>` section compiled with the thing's palette: its rules, the thing's letters and the four of the kernel. */
export function compileWorn(item: Item): ReturnType<typeof compileMjx> {
  const ground = /<([a-z]+)\b[^>]*\svalues="([^"]+)"/i.exec(item.ground.replace(/<!--[\s\S]*?-->/g, ''));
  const values = ground?.[2] ?? 'B';
  const colors = [...item.ground.matchAll(/<color\b[^>]*\/>/g)].map((m) => m[0]).join('\n');
  const m = WORN_RE.exec(item.worn ?? '');
  if (!m) throw new Error(`${item.id}: nessuna sezione <worn>`);
  const symmetry = /\bsymmetry="([^"]*)"/.exec(m[1])?.[1] ?? '()';
  const xml = `<sequence values="${values}${MARKERS}" symmetry="${symmetry}" size="1 1 1">\n${colors}\n${[...MARKERS].map((ch) => `<color symbol="${ch}" hidden="True"/>`).join('')}\n${m[2]}\n</sequence>`;
  return compileMjx(xml);
}

/** Every cell within `r` voxels (Chebyshev) of a marked one. */
function dilate(g: VoxelGrid, mark: Uint8Array, r: number): Uint8Array {
  let cur = mark;
  const { X, Y, Z } = g;
  const step = [1, X, X * Y];
  const dims = [X, Y, Z];
  for (let a = 0; a < 3; a++) {
    const next = new Uint8Array(cur.length);
    for (let i = 0; i < cur.length; i++) {
      if (!cur[i]) continue;
      const p = [i % X, Math.floor(i / X) % Y, Math.floor(i / (X * Y))][a];
      for (let d = -r; d <= r; d++) if (p + d >= 0 && p + d < dims[a]) next[i + d * step[a]] = 1;
    }
    cur = next;
  }
  return cur;
}

/** Where the rules of a thing may write in a zone's frame: the air round the zone (r), the middle line of it (m). */
export function reachOf(g: VoxelGrid, cells: readonly number[], zone: ZoneId, upright: boolean, solid: (code: number) => boolean): { reach: Uint8Array; middle: number } {
  const b = boundsOf(g, cells);
  const reach = new Uint8Array(g.cells.length);
  const middle = Math.round(b.mean[0]);
  if (zone === 'back') {
    const bottom = upright ? 1 : b.min[2] - 2;
    for (let z = Math.max(0, bottom); z <= Math.min(g.Z - 1, b.max[2] + 2); z++)
      for (let y = Math.max(0, b.min[1] - 3); y <= Math.min(g.Y - 1, b.max[1]); y++)
        for (let x = Math.max(0, b.min[0] - 2); x <= Math.min(g.X - 1, b.max[0] + 2); x++) {
          const i = x + y * g.X + z * g.X * g.Y;
          if (!solid(g.cells[i])) reach[i] = 1;
        }
    return { reach, middle };
  }
  const mark = new Uint8Array(g.cells.length);
  for (const c of cells) mark[c] = 1;
  const near = dilate(g, mark, REACH[zone]);
  for (let i = 0; i < near.length; i++) {
    if (!near[i] || solid(g.cells[i])) continue;
    const z = Math.floor(i / (g.X * g.Y));
    if (z < b.min[2] || (zone === 'torso' && z > b.max[2])) continue;
    reach[i] = 1;
  }
  return { reach, middle };
}

/** Way B: the `<worn>` rules of the thing run on a copy of the body, in the zone's frame. */
export function wearB(d: Dressed, body: Body, item: Item, clip: ReturnType<typeof compileMjx>, seed = 1): Change & { steps: number; finished: boolean } {
  const t0 = performance.now();
  const frame = frameOf(d, body, item.zone);
  const g = frame.grid;
  const out = { item: item.id, way: 'B' as const, added: 0, recoloured: 0, overlapped: 0, ms: 0, steps: 0, finished: true };
  if (!frame.cells.length) return { ...out, ms: performance.now() - t0 };
  const colors = colorTable(g.alphabet, d.palette);
  const solid = (code: number) => !!colors[code];
  const taken = wornCodes(d.grid);
  // The body's letters out of the rules' reach: private characters, which no rule can name.
  const alphabet = g.alphabet.map((ch, i) => (i === 0 ? ch : String.fromCharCode(0xe000 + i)));
  const [Z, O, R, M] = [...MARKERS].map((ch) => alphabet.push(ch) - 1);
  const cells = new Uint8Array(g.cells);
  const zoneSet = new Uint8Array(cells.length);
  for (const c of frame.cells) zoneSet[c] = 1;
  const { reach, middle } = reachOf(g, frame.cells, item.zone, body.upright, solid);
  for (let i = 0; i < cells.length; i++) {
    const c = g.cells[i];
    // What another thing put on is the body now, for this one: other (o), never its zone.
    if (zoneSet[i] && solid(c) && !taken.has(c)) cells[i] = Z;
    else if (solid(c)) cells[i] = O;
    else if (reach[i]) cells[i] = i % g.X === middle ? M : R;
  }
  const work = { X: g.X, Y: g.Y, Z: g.Z, cells, alphabet, log: [] as number[], epoch: 0 };
  const run = runOn(work, clip.program, seed, 200_000, { side: 4096, cells: 64_000_000 }, { deadline: 4_000 });
  out.steps = run.steps;
  out.finished = run.finished;
  const codes = new Map<number, number>();
  for (let i = 0; i < cells.length; i++) {
    const ch = work.alphabet[work.cells[i]];
    const was = g.cells[i];
    if (ch === 'z' || ch === 'o' || ch.charCodeAt(0) >= 0xe000) continue;
    if (ch === 'r' || ch === 'm' || ch === '.') {
      if (solid(was)) g.cells[i] = 0;
      continue;
    }
    let code = codes.get(work.cells[i]);
    if (code === undefined) codes.set(work.cells[i], (code = letter(d, clip.program.palette[ch])));
    if (solid(was)) out.recoloured++;
    else out.added++;
    g.cells[i] = code;
  }
  for (const c of codes.values()) taken.add(c);
  settle(d, frame);
  return { ...out, ms: performance.now() - t0 };
}

// --- C: the kernel recolours the zone ------------------------------------------------------------------------------------------------

const SIDES: Vec3[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

/** Way C: the outer voxels of the zone in the thing's two colours, and the fall of a cloak standing. */
export function wearC(d: Dressed, body: Body, item: Item, palette: PaletteEntry[]): Change {
  const t0 = performance.now();
  const frame = frameOf(d, body, item.zone);
  const g = frame.grid;
  const out: Change = { item: item.id, way: 'C', added: 0, recoloured: 0, overlapped: 0, ms: 0 };
  if (!frame.cells.length || !palette.length) return { ...out, ms: performance.now() - t0 };
  const taken = wornCodes(d.grid);
  const [first, second] = [letter(d, palette[0]), letter(d, palette[1] ?? palette[0])];
  taken.add(first);
  taken.add(second);
  const colors = colorTable(g.alphabet, d.palette);
  const XY = g.X * g.Y;
  const air = (x: number, y: number, z: number) => x < 0 || y < 0 || z < 0 || x >= g.X || y >= g.Y || z >= g.Z || !colors[g.cells[x + y * g.X + z * XY]];
  const b = boundsOf(g, frame.cells);
  const paint: Array<[number, number]> = [];
  for (const c of frame.cells) {
    if (taken.has(g.cells[c])) continue;
    const [x, y, z] = coordsOf(g, c);
    const open = SIDES.filter(([dx, dy, dz]) => air(x + dx, y + dy, z + dz));
    if (!open.length) continue;
    if (item.zone === 'head') {
      // A cap over the upper part of the head (the eyes and the face stay), its lowest ring in the second colour.
      const cut = b.min[2] + Math.round(0.4 * (b.max[2] - b.min[2] + 1));
      if (z >= cut) paint.push([c, z === cut ? second : first]);
    } else if (item.zone === 'torso') {
      // The sides of the torso, its top and bottom rows in the second colour.
      if (open.some(([, , dz]) => dz === 0)) paint.push([c, z === b.min[2] || z === b.max[2] ? second : first]);
    } else if (open.some(([, dy]) => dy === -1) || (open.some(([, , dz]) => dz === 1) && z === b.max[2])) paint.push([c, first]);
  }
  for (const [c, code] of paint) {
    g.cells[c] = code;
    out.recoloured++;
  }
  // The fall of a cloak standing: a voxel behind the lowest row of the back, down to the ground, where there is air.
  if (item.zone === 'back' && body.upright) {
    for (let x = b.min[0]; x <= b.max[0]; x++) {
      let rear = Infinity;
      for (const c of frame.cells) {
        const [cx, cy, cz] = coordsOf(g, c);
        if (cx === x && cz === b.min[2]) rear = Math.min(rear, cy);
      }
      if (!Number.isFinite(rear)) continue;
      for (let z = b.min[2] - 1; z >= 1; z--) {
        const y = rear - 1;
        if (y < 0 || !air(x, y, z)) break;
        g.cells[x + y * g.X + z * XY] = z === 1 ? second : first;
        out.added++;
      }
    }
  }
  settle(d, frame);
  return { ...out, ms: performance.now() - t0 };
}

// --- A whole outfit ---------------------------------------------------------------------------------------------------------------

/** What every way needs of the things, made once for every body: the worn meshes (A), the rules (B), the colours (C). */
export interface Prepared {
  items: Item[];
  mesh: Partial<Record<ItemId, Dressed & { ms: number }>>;
  clip: Partial<Record<ItemId, ReturnType<typeof compileMjx>>>;
  colors: Partial<Record<ItemId, PaletteEntry[]>>;
  groundMs: Partial<Record<ItemId, number>>;
}

export function prepare(items: Item[]): Prepared {
  const p: Prepared = { items, mesh: {}, clip: {}, colors: {}, groundMs: {} };
  for (const it of items) {
    const ground = runProgram(it.ground);
    p.groundMs[it.id] = ground.ms;
    p.colors[it.id] = mainColors(ground);
    if (it.wornProgram) p.mesh[it.id] = runProgram(it.wornProgram);
    if (it.worn) p.clip[it.id] = compileWorn(it);
  }
  return p;
}

/** Room round a body for what it wears (voxels). */
export const PAD = 4;

/** A body wearing `outfit` by `way`: the body in a padded box, its zones, then each thing, the outer first. */
export function dress(base: Dressed, vpt: number, outfit: readonly ItemId[], way: WayId, p: Prepared): { dressed: Dressed; body: Body; changes: Change[]; bodyMs: number } {
  const dressed = padded(base, PAD);
  const t0 = performance.now();
  const body = bodyOf(dressed.grid, dressed.palette, vpt);
  const bodyMs = performance.now() - t0;
  const changes: Change[] = [];
  for (const id of ITEMS) {
    if (!outfit.includes(id)) continue;
    const item = p.items.find((i) => i.id === id);
    if (!item) continue;
    if (way === 'A' && p.mesh[id]) changes.push(wearA(dressed, body, item, p.mesh[id]!));
    else if (way === 'B' && p.clip[id]) changes.push(wearB(dressed, body, item, p.clip[id]!));
    else if (way === 'C') changes.push(wearC(dressed, body, item, p.colors[id] ?? []));
  }
  return { dressed, body, changes, bodyMs };
}
