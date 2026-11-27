// The third trial of the modular structures (T557): the source of a set is a static model the Concilio wrote at the start, MarkovJunior used
// as a CAD (docs/design/strutture-modulari.md § 12). Here it is read from a universe on the disk, run at a seed as the game runs it
// (`Forms.request`, `runForm`, bare), and made ready to be cut into bays:
//
// 1. only the building stays (walls, slabs, floors, doors, windows, stairs, roofs): what the palette names as furniture or props (antennas,
//    washing, barrels, benches, chimneys, signs, trees) and the hidden letters become air; the door leaves stay, and the walk reads them open
//    (the model's own `open` action says which letters they are);
// 2. the building is fitted to the bays of T522/T543 (2 × 2 tiles and a storey: 32 × 32 × 32 voxels at 16 a tile): its storeys start at the
//    bottom of a bay (the slab at z 0-1), its walls fall inside the bays with a strip of ground around them, the bay grid is shifted so that
//    a stair crosses as few bay sides as it can; a model at another density is scaled to 16 voxels a tile;
// 3. around it a ring of street bays (the paving the model has at its feet) and a layer of air on top: the model as it stands in a lot, so
//    that what touches a street and what touches the sky is seen.
//
// No calls: the models are on the disk, run by the game's own code.

import fs from 'node:fs';
import path from 'node:path';
import { FormCache, Forms, InlineRunner, runForm } from '../../../src/kernel/forms';
import type { FileMap } from '../../../src/kernel/types';
import type { PaletteEntry } from '../../../src/mj/engine';
import { act } from '../../../src/mj/run';

/** Voxels of a tile, of a bay side (2 tiles) and of a storey: the bay of T522 and T543. */
export const VPT = 16;
export const C = 32;
export const H = 32;

/** What a letter of a source is: kept as building, ground at the feet, or taken away. */
export type LetterKind = 'build' | 'ground' | 'prop';

/** Props and furniture by the name the palette gives them (Italian and English): what the author does not want in the bricks. */
const PROP = /antenn|panni|bucato|bott[ei]|baril|panc[ah]|tavol|sedi[ae]|letto|credenz|fuoc|fumo|insegn|alber|chiom|tronc|platan|cespugl|fior|vas[oi]\b|lampion|lantern|cass[ae]\b|sacc|comign|camin|legna|fieno|carro|carrett|pannell|parabol|stendin|tenda|ombrell|bandier|statua|fontan|pozzo|abbeverat|cartell|sign|antenna|laundry|barrel|bench|chair|table|bed\b|crate|tree|chimney|smoke|fire/i;
/** The ground at a building's feet. */
const GROUND = /terra|basolat|selciat|acciottolat|marciapied|strad|asfalt|ghiai|sabbi|prat|giardin|erba|polvere|sterrat|ground|paving|soil/i;

export function letterKind(e: PaletteEntry | undefined): LetterKind {
  const name = e?.name ?? '';
  if (PROP.test(name)) return 'prop';
  if (GROUND.test(name)) return 'ground';
  return 'build';
}

/** The files of models/ of a universe on the disk. */
export function modelsOf(dir: string): Record<string, string> {
  const files: Record<string, string> = {};
  for (const f of fs.readdirSync(path.join(dir, 'models'))) files[`models/${f}`] = fs.readFileSync(path.join(dir, 'models', f), 'utf8');
  return files;
}

export interface Fit {
  /** The building's box in the source (voxels, ends included), at its mid-ground storey. */
  bx0: number;
  bx1: number;
  by0: number;
  by1: number;
  /** Source voxels to bay voxels (1 at 16 a tile and a box that fits). */
  sx: number;
  sy: number;
  /** Where the building's box begins in the building's bays (voxels from the first bay's side). */
  ox: number;
  oy: number;
  /** The source's ground: its storey 0 begins here. */
  z0: number;
}

export interface Source {
  universe: string;
  model: string;
  name: string;
  seed: number;
  /** The fitted grid: (nx + 2) × (ny + 2) bays with the ring, nz + 1 storeys with the air on top. */
  X: number;
  Y: number;
  Z: number;
  cells: Uint8Array;
  /** Letter of every code ('.' the air). */
  alphabet: string[];
  palette: Record<string, PaletteEntry>;
  /** Bays of the building, the ring and the air layer apart. */
  nx: number;
  ny: number;
  nz: number;
  /** The letter of the paving of the ring (and of the strips at the building's feet). */
  paving: string;
  /** The door leaves (what the model's `open` action changes): read open by the walk. */
  doors: Set<number>;
  fit: Fit;
  /** What was taken away, by letter: the props. */
  removed: Record<string, number>;
  /** The source's actions, for the program that wears its bricks (the doors open and close). */
  actions: Array<{ name: string; label?: string; xml?: string }>;
  /** Milliseconds of the source's run. */
  ms: number;
}

/** A grid of codes. */
export interface Vox {
  X: number;
  Y: number;
  Z: number;
  cells: Uint8Array;
}

const idx = (g: Vox, x: number, y: number, z: number) => x + y * g.X + z * g.X * g.Y;

/** The best shift of the bays along one axis: the stair's voxels as far from a bay side as they can be. */
function bestShift(stairs: number[], room: number): number {
  if (!stairs.length || room <= 0) return Math.floor(room / 2);
  let best = Math.floor(room / 2), bestScore = Infinity;
  for (let o = 0; o <= room; o++) {
    let score = 0;
    for (const s of stairs) {
      const t = (((s + o) % C) + C) % C;
      const d = Math.min(t, C - 1 - t);
      if (d < 3) score += 3 - d;
    }
    // Ties: the middle (the strips alike on both sides).
    score += Math.abs(o - room / 2) * 1e-3;
    if (score < bestScore) (bestScore = score), (best = o);
  }
  return best;
}

/**
 * The source of a set: a model of a universe on the disk at a seed, cleaned and fitted to the bays. `inset` is the strip of ground kept
 * between a wall and its bay's side (at least; the bays are whole, so a strip may be larger on one side).
 */
export function loadSource(universeDir: string, model: string, seed: number, files = modelsOf(universeDir), o: { inset?: number; stairless?: boolean } = {}): Source {
  const forms = new Forms(new InlineRunner(new FormCache()));
  forms.load(files as FileMap);
  const q = forms.request(model, seed, undefined, { bare: true });
  if (!q) throw new Error(`${model}: nessun modello così in ${universeDir}`);
  const t0 = performance.now();
  const r = runForm({ ...q, interior: undefined });
  const ms = performance.now() - t0;
  if (!r.finished) throw new Error(`${model} seme ${seed}: il programma non finisce`);
  const g = r.grid;
  const palette = r.palette as Record<string, PaletteEntry>;
  const alphabet = [...g.alphabet];
  // The door leaves: the letters the model's `open` action changes.
  const doors = new Set<number>();
  const open = r.model.actions.find((a) => /^(open|apr)/i.test(a.name));
  if (open) {
    const copy = { X: g.X, Y: g.Y, Z: g.Z, cells: new Uint8Array(g.cells), alphabet: [...g.alphabet], log: [] as number[], epoch: 0 };
    act(copy, open, seed);
    for (let i = 0; i < g.cells.length; i++) if (g.alphabet[g.cells[i]] !== copy.alphabet[copy.cells[i]]) doors.add(g.cells[i]);
  }
  const kind = alphabet.map((ch, c) => (c === 0 ? 'prop' : palette[ch]?.hidden || !palette[ch]?.color ? 'hidden' : letterKind(palette[ch])));
  const z0 = typeof q.base === 'number' ? q.base : 0;
  const vpt = q.vpt;
  // The building's box at mid-ground storey: the largest 4-connected piece of what stands there.
  const zm = Math.min(g.Z - 1, z0 + Math.round((H / 2) * (vpt / VPT)));
  const seen = new Uint8Array(g.X * g.Y);
  let box = { x0: 0, x1: -1, y0: 0, y1: -1, n: 0 };
  for (let y = 0; y < g.Y; y++)
    for (let x = 0; x < g.X; x++) {
      const c = g.cells[x + y * g.X + zm * g.X * g.Y];
      if (seen[x + y * g.X] || kind[c] !== 'build') continue;
      const b = { x0: x, x1: x, y0: y, y1: y, n: 0 };
      const stack = [x + y * g.X];
      seen[x + y * g.X] = 1;
      while (stack.length) {
        const i = stack.pop()!;
        const cx = i % g.X, cy = Math.floor(i / g.X);
        b.n++;
        b.x0 = Math.min(b.x0, cx), b.x1 = Math.max(b.x1, cx), b.y0 = Math.min(b.y0, cy), b.y1 = Math.max(b.y1, cy);
        for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
          if (nx < 0 || ny < 0 || nx >= g.X || ny >= g.Y || seen[nx + ny * g.X]) continue;
          if (kind[g.cells[nx + ny * g.X + zm * g.X * g.Y]] !== 'build') continue;
          seen[nx + ny * g.X] = 1;
          stack.push(nx + ny * g.X);
        }
      }
      if (b.n > box.n) box = b;
    }
  if (box.n === 0) throw new Error(`${model}: niente di costruito a metà del pianterreno (z ${zm})`);
  // Source voxels to bay voxels: the density first, then a box a little too large is pressed into its bays, never more than a tenth.
  const scale = VPT / vpt;
  const inset = o.inset ?? 2;
  const fitAxis = (w: number) => {
    const ww = w * scale;
    let n = Math.max(1, Math.round((ww + 2 * inset) / C));
    if (n * C < ww + 2 * inset && (ww + 2 * inset) / (n * C) > 1.1) n++;
    const s = Math.min(scale, (n * C - 2 * inset) / w);
    return { n, s, room: Math.max(0, n * C - Math.round(w * s)) };
  };
  const fx = fitAxis(box.x1 - box.x0 + 1), fy = fitAxis(box.y1 - box.y0 + 1);
  // The stairs: their voxels, to keep them inside a bay where the strips allow.
  const stairX: number[] = [], stairY: number[] = [];
  for (let z = z0; z < g.Z; z++)
    for (let y = box.y0; y <= box.y1; y++)
      for (let x = box.x0; x <= box.x1; x++) {
        const ch = alphabet[g.cells[x + y * g.X + z * g.X * g.Y]];
        if (/scal|gradin|stair|step/i.test(palette[ch]?.name ?? '')) stairX.push(Math.round((x - box.x0) * fx.s)), stairY.push(Math.round((y - box.y0) * fy.s));
      }
  const ox = Math.max(Math.min(inset, fx.room), Math.min(fx.room - Math.min(inset, fx.room), bestShift(stairX, fx.room)));
  const oy = Math.max(Math.min(inset, fy.room), Math.min(fy.room - Math.min(inset, fy.room), bestShift(stairY, fy.room)));
  // Storeys: the building's top above the ground, in storeys of 32 (the models of the trial have 32 from slab to slab at 16 a tile).
  let top = z0;
  for (let z = g.Z - 1; z >= z0 && top === z0; z--)
    for (let y = 0; y < g.Y && top === z0; y++)
      for (let x = 0; x < g.X; x++)
        if (kind[g.cells[x + y * g.X + z * g.X * g.Y]] === 'build') {
          top = z + 1;
          break;
        }
  const sz = scale;
  const nz = Math.max(1, Math.ceil(((top - z0) * sz) / H));
  const nx = fx.n, ny = fy.n;
  const X = (nx + 2) * C, Y = (ny + 2) * C, Z = (nz + 1) * H;
  const cells = new Uint8Array(X * Y * Z);
  // The paving: the commonest visible ground letter at the source's ground, outside the building; else one of the palette's own.
  const counts = new Map<number, number>();
  for (let y = 0; y < g.Y; y++)
    for (let x = 0; x < g.X; x++) {
      if (x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1) continue;
      for (const z of [z0 - 1, z0]) {
        if (z < 0 || z >= g.Z) continue;
        const c = g.cells[x + y * g.X + z * g.X * g.Y];
        if (kind[c] === 'ground') counts.set(c, (counts.get(c) ?? 0) + 1);
      }
    }
  let pavingCode = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (pavingCode === undefined) {
    const ground = alphabet.findIndex((_ch, c) => c > 0 && kind[c] === 'ground');
    pavingCode = ground > 0 ? ground : alphabet.length;
    if (ground <= 0) {
      alphabet.push('r');
      palette.r = { name: 'selciato', color: '8e8a84' };
      kind.push('ground');
    }
  }
  const removed: Record<string, number> = {};
  const bx = C - 0, by = C;
  for (let z = 0; z < Z; z++) {
    const srcZ = z < nz * H ? z0 + Math.floor(z / sz) : -1;
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++) {
        let v = 0;
        const inBuilding = x >= bx && x < bx + nx * C && y >= by && y < by + ny * C;
        if (inBuilding && srcZ >= 0 && srcZ < g.Z) {
          const sxv = box.x0 + Math.floor((x - bx - ox) / fx.s);
          const syv = box.y0 + Math.floor((y - by - oy) / fy.s);
          if (sxv >= 0 && syv >= 0 && sxv < g.X && syv < g.Y) {
            const c = g.cells[sxv + syv * g.X + srcZ * g.X * g.Y];
            if (c && kind[c] === 'prop') removed[alphabet[c]] = (removed[alphabet[c]] ?? 0) + 1;
            if (c && (kind[c] === 'build' || kind[c] === 'ground')) v = c;
          }
        }
        // The ground at the feet: the paving where nothing else is, in the strips and in the ring.
        if (z === 0 && !v) v = pavingCode;
        cells[x + y * X + z * X * Y] = v;
      }
  }
  // Without its stairs (T557): the same building with what the palette names a stair taken away above every slab, and the slab closed over
  // it. A stair stands in a corner of a small building and makes the facade it touches the only one of its kind (the palazzina's north row
  // is stair, stair, corner): without it the facades are regular, and the stairs come from the stair brick (where it fits) or from the
  // stitching.
  if (o.stairless) {
    const stairCode = new Set(alphabet.flatMap((ch, c) => (c > 0 && /scal|gradin|stair|step/i.test(palette[ch]?.name ?? '') ? [c] : [])));
    let x0 = X, x1 = -1, y0 = Y, y1 = -1;
    for (let z = 0; z < Z; z++)
      for (let y = 0; y < Y; y++)
        for (let x = 0; x < X; x++) {
          const i = x + y * X + z * X * Y;
          if (!stairCode.has(cells[i]) || z % H < 2) continue;
          cells[i] = 0;
          x0 = Math.min(x0, x), x1 = Math.max(x1, x), y0 = Math.min(y0, y), y1 = Math.max(y1, y);
        }
    // The slabs over the stair: the letter of the slab around it, where it is air.
    for (let k = 1; k * H < Z; k++)
      for (const z of [k * H, k * H + 1]) {
        const count = new Map<number, number>();
        for (let y = Math.max(0, y0 - 4); y <= Math.min(Y - 1, y1 + 4); y++)
          for (let x = Math.max(0, x0 - 4); x <= Math.min(X - 1, x1 + 4); x++) {
            const c = cells[x + y * X + z * X * Y];
            if (c && (x < x0 || x > x1 || y < y0 || y > y1)) count.set(c, (count.get(c) ?? 0) + 1);
          }
        const slab = [...count].sort((a, b) => b[1] - a[1])[0]?.[0];
        if (!slab) continue;
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!cells[x + y * X + z * X * Y]) cells[x + y * X + z * X * Y] = slab;
      }
  }
  // The voxels under the ground (a cellar) stay in the source, not in the bays: the bricks are what stands above it.
  return {
    universe: path.basename(universeDir),
    model,
    name: (JSON.parse(files['models/index.json'] ?? '{}') as Record<string, { name?: string }>)[model]?.name ?? model,
    seed,
    X,
    Y,
    Z,
    cells,
    alphabet,
    palette,
    nx,
    ny,
    nz,
    paving: alphabet[pavingCode],
    doors,
    fit: { bx0: box.x0, bx1: box.x1, by0: box.y0, by1: box.y1, sx: fx.s, sy: fy.s, ox, oy, z0 },
    removed,
    actions: r.model.actions.map((a) => ({ name: a.name, ...(a.label ? { label: a.label } : {}) })),
    ms,
  };
}

/** The source turned a quarter counter-clockwise `t` times (x → y), as `transform` of T543 turns a block. */
export function turned(s: Source, t: number): Vox {
  let g: Vox = { X: s.X, Y: s.Y, Z: s.Z, cells: s.cells };
  for (let r = 0; r < t % 4; r++) {
    const n: Vox = { X: g.Y, Y: g.X, Z: g.Z, cells: new Uint8Array(g.cells.length) };
    for (let z = 0; z < g.Z; z++) for (let y = 0; y < g.Y; y++) for (let x = 0; x < g.X; x++) n.cells[g.Y - 1 - y + x * n.X + z * n.X * n.Y] = g.cells[idx(g, x, y, z)];
    g = n;
  }
  return g;
}
