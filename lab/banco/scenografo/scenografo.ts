// The Scenografo's bench (T259): the interiors of a building whose skeleton changes with every seed, written apart from the building.
// Two ways are compared on the same buildings, with the same protections and the same measures (`misure.ts`) before and after:
//
//   1. `programma`: a MarkovJunior program of a second stage, run with `runOn` on the finished grid. The kernel first writes on the feet
//      layer of every storey what a body may use (`φ` free floor, `ψ` free floor of the cellar, `π` protected: door, stairs and the
//      way around them) and names every letter of the building `#`; the program only knows those classes, so one program serves
//      every building and every seed (one program per type, the instances are seeds).
//   2. `dati`: the models of furniture that already exist (`universe/models`, class `mobile`), placed as data on the rooms the kernel
//      finds: each piece is tried against the walls of a room and kept only if no part of the storey is cut off from the rest.
//
// No model is called. `lab/scripts/banco-scenografo.ts` runs both on the buildings and writes the tables and the contact sheets.

import fs from 'node:fs';
import path from 'node:path';
import { FormCache, Forms, InlineRunner, stepOf } from '../../../src/kernel/forms';
import { Rng } from '../../../src/kernel/rng';
import { runOn, type Grid3, type Node3, type PaletteEntry } from '../../../src/mj/engine';
import { compileMjx } from '../../../src/mj/model';
import { FORM_LIMITS, runMjx } from '../../../src/mj/run';
import { BODY_R, esegui, misura, type Bersaglio, type Eseguito, type Misure } from '../misure';

export const FREE = 'φ';
export const CELLAR = 'ψ';
export const KEEP = 'π';
export const SOLID = '#';
/** Rooms whose body centres cover less than this many tiles² are not furnished. */
export const PICCOLA = 0.6;
/** A storey with less covered floor than this many tiles² (`Piano.area`) is not furnished at all: it would stop being a storey. */
export const PIANO_PICCOLO = 4;

export interface Scena {
  b: Bersaglio;
  seme: number;
  e: Eseguito;
  m: Misure;
}

export function scena(xml: string, b: Bersaglio, seme: number): Scena {
  const e = esegui(xml, b, seme);
  return { b, seme, e, m: misura(e, b) };
}

const copy = (g: Grid3): Grid3 => ({ ...g, cells: new Uint8Array(g.cells), alphabet: [...g.alphabet], log: [], epoch: 0 });

/** The storey of a body-centre cell, or -1 on a stair or a ramp (between storeys). */
function storeyOf(m: Misure, z: number): number {
  return m.piani.findIndex((p) => Math.abs(p.z - z) <= 1);
}

/** What the kernel tells the Scenografo: per storey, the feet layer, the floor a body may use and what must stay free. */
export interface Pianta {
  z: number;
  /** Covered floor of the storey, tiles² (`Piano.area`). */
  area: number;
  /** Under the ground: only furniture from floor to ceiling (a low top would be a floor no body reaches, ADR-0135). */
  cantina: boolean;
  /** Body centres of this storey, `x + y·X`. */
  centri: Set<number>;
  /** Air at the feet a body sweeps (the centres widened by the body), not protected. */
  libero: Uint8Array;
  /** Air at the feet that must stay free: the door, the stairs and a body's width around them. */
  protetto: Uint8Array;
}

export function piante(s: Scena): Pianta[] {
  const { e, m } = s;
  const g = e.grid;
  const { vpt, base } = e.scatola;
  const XY = g.X * g.Y;
  const r = Math.ceil(BODY_R * vpt);
  const keep = Math.ceil(2 * BODY_R * vpt) + 2;
  const out: Pianta[] = m.piani.map((p) => ({ z: p.z, area: p.area, cantina: p.z < base, centri: new Set<number>(), libero: new Uint8Array(XY), protetto: new Uint8Array(XY) }));
  // Stairs and ramps: centres between storeys; they protect the cells of the storeys they touch.
  const ramps: Array<{ x: number; y: number; z: number }> = [];
  for (const c of m.celle) {
    const k = storeyOf(m, c.z);
    // The ground outside is not a stair.
    if (k >= 0) out[k].centri.add(c.x + c.y * g.X);
    else if (Math.abs(c.z - base) > stepOf(vpt)) ramps.push(c);
  }
  const air = (x: number, y: number, z: number) => x >= 0 && y >= 0 && x < g.X && y < g.Y && z < g.Z && g.cells[x + y * g.X + z * XY] === 0;
  const mark = (mask: Uint8Array, x: number, y: number, z: number, d: number) => {
    for (let dy = -d; dy <= d; dy++)
      for (let dx = -d; dx <= d; dx++) if (air(x + dx, y + dy, z)) mask[x + dx + (y + dy) * g.X] = 1;
  };
  /** What a body reaches from (x, y) within `d` voxels walking through air on the feet layer: a protection does not pass walls. */
  const flood = (mask: Uint8Array, x: number, y: number, z: number, d: number) => {
    if (!air(x, y, z)) return;
    const seen = new Map<number, number>([[x + y * g.X, 0]]);
    const queue = [x + y * g.X];
    for (let q = 0; q < queue.length; q++) {
      const i = queue[q];
      mask[i] = 1;
      const dist = seen.get(i)!;
      if (dist >= d) continue;
      const cx = i % g.X, cy = Math.floor(i / g.X);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const j = cx + dx + (cy + dy) * g.X;
        if (seen.has(j) || !air(cx + dx, cy + dy, z)) continue;
        seen.set(j, dist + 1);
        queue.push(j);
      }
    }
  };
  for (const p of out) for (const i of p.centri) mark(p.libero, i % g.X, Math.floor(i / g.X), p.z, r);
  const step = stepOf(vpt);
  for (const c of ramps)
    for (const p of out) if (Math.abs(p.z - c.z) <= step * 3) flood(p.protetto, c.x, c.y, p.z, keep + r);
  // The centres of a storey next to a ramp's foot are its landing: also protected (above).
  if (m.porta && out.length) {
    const ground = out.find((p) => !p.cantina) ?? out[0];
    flood(ground.protetto, m.porta.x, Math.max(0, m.porta.y - 2), ground.z, Math.round(1.2 * vpt));
    // The straight way in from the door, a body wide.
    for (let y = m.porta.y; y >= Math.max(0, m.porta.y - Math.round(1.5 * vpt)); y--) flood(ground.protetto, m.porta.x, y, ground.z, keep);
  }
  // A small room stays empty, and so does what belongs to no room (a cell of a temple too small to have a core, the neck of a stair):
  // a storey keeps the floor that makes it a storey.
  for (const p of out) {
    if (p.area < PIANO_PICCOLO) for (const i of p.centri) mark(p.protetto, i % g.X, Math.floor(i / g.X), p.z, r + 1);
    const inRoom = new Set<number>();
    for (const room of stanze(p, g.X, g.Y, Math.round(0.4 * vpt)))
      if (room.length >= PICCOLA * vpt * vpt) for (const i of room) inRoom.add(i);
    for (const i of p.centri) if (!inRoom.has(i)) mark(p.protetto, i % g.X, Math.floor(i / g.X), p.z, r + 1);
  }
  for (const p of out) for (let i = 0; i < XY; i++) if (p.protetto[i]) p.libero[i] = 0;
  return out;
}

// ---------------------------------------------------------------- 1. a program on the finished grid

const rows = (n: number, row: string) => Array(n).fill(row).join('/');

/**
 * The furnishing program, in the engine's own form (layers bottom first). It reads only the classes the kernel writes: `#` any part of
 * the building, `φ`/`ψ` free floor, `π` protected. Sizes are in voxels of a Grande building (20 a tile); `corpo` is the passage a body
 * needs, kept free in front of every piece.
 */
export function programmaArredo(corpo: number): Node3 {
  const f = FREE;
  const grow = (marker: string, body: string, h: number | undefined): Node3[] => [
    { type: 'all', rules: [{ in: `${marker} .`, out: `${body} ${marker}` }], symmetry: 'none', ...(h ? { steps: h - 1 } : {}) },
    { type: 'prl', rules: [{ in: marker, out: body }] },
  ];
  return {
    type: 'sequence',
    children: [
      // Shelves against a wall, 3 deep and 8 long, a passage free in front; in the cellar too, up to the ceiling.
      { type: 'one', steps: 6, rules: [{ in: rows(8, `#${f.repeat(3 + corpo)}`), out: rows(8, `*ααα${'*'.repeat(corpo)}`) }, { in: rows(8, `#${CELLAR.repeat(3 + corpo)}`), out: rows(8, `*ααα${'*'.repeat(corpo)}`) }] },
      // Beds and benches against a wall: 6 deep, 10 long, low; a body's passage in front and on both sides (a door in the next wall).
      { type: 'one', steps: 3, rules: [{ in: [rows(corpo, `*${f.repeat(6 + corpo)}`), rows(10, `#${f.repeat(6 + corpo)}`), rows(corpo, `*${f.repeat(6 + corpo)}`)].join('/'), out: [rows(corpo, '*'.repeat(7 + corpo)), rows(10, `*λλλλλλ${'*'.repeat(corpo)}`), rows(corpo, '*'.repeat(7 + corpo))].join('/') }] },
      // A crate in a corner.
      { type: 'one', steps: 4, rules: [{ in: [`#${'#'.repeat(5 + corpo)}`, ...Array(5 + corpo).fill(`#${f.repeat(5 + corpo)}`)].join('/'), out: [`*${'*'.repeat(5 + corpo)}`, ...Array(5).fill(`*κκκκκ${'*'.repeat(corpo)}`), ...Array(corpo).fill('*'.repeat(6 + corpo))].join('/') }] },
      // Tables in the middle of a room: a body's passage on every side.
      { type: 'one', steps: 3, rules: [{ in: rows(4 + 2 * corpo, f.repeat(8 + 2 * corpo)), out: [...Array(corpo).fill('*'.repeat(8 + 2 * corpo)), ...Array(4).fill(`${'*'.repeat(corpo)}ττττττττ${'*'.repeat(corpo)}`), ...Array(corpo).fill('*'.repeat(8 + 2 * corpo))].join('/') }] },
      ...grow('α', 'Σ', undefined),
      ...grow('λ', 'Λ', 5),
      ...grow('κ', 'Κ', 7),
      ...grow('τ', 'Τ', 8),
      { type: 'prl', rules: [{ in: f, out: '.' }, { in: CELLAR, out: '.' }, { in: KEEP, out: '.' }] },
    ],
  };
}

export const COLORI_ARREDO: Record<string, PaletteEntry> = {
  Σ: { color: '7a5634', name: 'scaffale' },
  Λ: { color: 'a8483a', name: 'letto, panca' },
  Κ: { color: 'b08a52', name: 'cassa' },
  Τ: { color: '8b6a44', name: 'tavolo' },
};

export interface Arredato {
  e: Eseguito;
  m: Misure;
  ms: number;
  /** Cells of furniture written, `x + y·X + z·X·Y`. */
  voxel: Set<number>;
  pezzi: number;
}

function withGrid(e: Eseguito, g: Grid3, colori: Record<string, PaletteEntry>): Eseguito {
  const palette = { ...e.model.program.palette, ...colori };
  return { ...e, grid: g, result: { ...e.result, grid: g }, model: { ...e.model, program: { ...e.model.program, palette } } };
}

export function arredaProgramma(s: Scena, semeArredo: number, senza = -1): Arredato {
  const t0 = performance.now();
  const g = copy(s.e.grid);
  const XY = g.X * g.Y;
  const before = new Uint8Array(g.cells);
  const solid = g.alphabet.slice(1).join('');
  const ps = piante(s);
  const prog = programmaArredo(s.e.scatola.corpo);
  if (senza >= 0 && prog.type === 'sequence') prog.children.splice(senza, 1);
  const program = { palette: {}, unions: { [SOLID]: solid }, program: prog };
  // The stage: the classes on the feet layer.
  const alpha = [...g.alphabet];
  const code = (ch: string) => {
    let i = alpha.indexOf(ch);
    if (i < 0) i = alpha.push(ch) - 1;
    return i;
  };
  const cf = code(FREE), cc = code(CELLAR), ck = code(KEEP);
  g.alphabet = alpha;
  for (const p of ps)
    for (let i = 0; i < XY; i++) {
      const at = i + p.z * XY;
      if (p.protetto[i]) g.cells[at] = ck;
      else if (p.libero[i]) g.cells[at] = p.cantina ? cc : cf;
    }
  const r = runOn(g, program, semeArredo, 200_000, FORM_LIMITS, { deadline: 8_000 });
  const voxel = new Set<number>();
  const furniture = new Set(Object.keys(COLORI_ARREDO).map((ch) => g.alphabet.indexOf(ch)));
  for (let i = 0; i < g.cells.length; i++) if (furniture.has(g.cells[i]) && before[i] === 0) voxel.add(i);
  const e = withGrid(s.e, g, COLORI_ARREDO);
  void r;
  // The kernel's guard on what the program wrote: a piece that cuts something off is taken away again.
  const guardia = new Guardia(s);
  let pezzi = 0;
  for (const group of gruppi(voxel, g.X, XY)) {
    if (guardia.ammetti(group)) {
      pezzi++;
      continue;
    }
    for (const v of group) {
      g.cells[v] = 0;
      voxel.delete(v);
    }
  }
  const ms = performance.now() - t0;
  return { e, m: misura(e, s.b), ms, voxel, pezzi };
}

/**
 * The kernel's guard, the same for both ways: every centre a body stands on (storeys, stairs, the ground outside) as one graph, steps
 * of a voxel sideways and of a stair's rise up or down. A piece of furniture may take centres away only if what is left is in as many
 * pieces as before: no room, storey or stair cut off.
 */
export class Guardia {
  private key: Int32Array;
  private xs: Int32Array;
  private ys: Int32Array;
  private zs: Int32Array;
  private gone: Uint8Array;
  private start: number;
  readonly X: number;
  readonly XY: number;
  readonly r: number;
  readonly persona: number;
  private N = 0;
  constructor(private s: Scena) {
    const g = s.e.grid;
    this.X = g.X;
    this.XY = g.X * g.Y;
    this.r = Math.ceil(BODY_R * s.e.scatola.vpt);
    this.persona = s.e.scatola.persona;
    const cs = s.m.celle;
    this.xs = Int32Array.from(cs, (c) => c.x);
    this.ys = Int32Array.from(cs, (c) => c.y);
    this.zs = Int32Array.from(cs, (c) => c.z);
    this.key = new Int32Array(g.cells.length).fill(-1);
    cs.forEach((c, i) => (this.key[c.x + c.y * this.X + c.z * this.XY] = i));
    this.N = g.cells.length;
    this.gone = new Uint8Array(cs.length);
    this.start = this.pieces();
  }
  private pieces(extra?: Set<number>): number {
    const n = this.xs.length;
    const seen = new Uint8Array(n);
    const step = stepOf(this.s.e.scatola.vpt);
    let count = 0;
    for (let s0 = 0; s0 < n; s0++) {
      if (seen[s0] || this.gone[s0] || extra?.has(s0)) continue;
      count++;
      const stack = [s0];
      seen[s0] = 1;
      while (stack.length) {
        const i = stack.pop()!;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
          for (let dz = -step; dz <= step; dz++) {
            const at = this.xs[i] + dx + (this.ys[i] + dy) * this.X + (this.zs[i] + dz) * this.XY;
            const j = at >= 0 && at < this.N ? this.key[at] : -1;
            if (j < 0 || seen[j] || this.gone[j] || extra?.has(j)) continue;
            seen[j] = 1;
            stack.push(j);
          }
      }
    }
    return count;
  }
  /** The centres a body could no longer stand on with these voxels of furniture. */
  touched(voxels: Iterable<number>): Set<number> {
    const out = new Set<number>();
    const { X, XY, r } = this;
    for (const v of voxels) {
      const x = v % X, y = Math.floor(v / X) % (XY / X), z = Math.floor(v / XY);
      for (let dz = 0; dz < this.persona; dz++)
        for (let dy = -r; dy <= r; dy++)
          for (let dx = -r; dx <= r; dx++) {
            const at = x + dx + (y + dy) * X + (z - dz) * XY;
            const j = at >= 0 && at < this.N ? this.key[at] : -1;
            if (j >= 0 && !this.gone[j]) out.add(j);
          }
    }
    return out;
  }
  /** Keeps the piece if nothing is cut off, and takes its centres away. */
  ammetti(voxels: Iterable<number>): boolean {
    const t = this.touched(voxels);
    if (!t.size) return true;
    if (this.pieces(t) !== this.start) return false;
    for (const j of t) this.gone[j] = 1;
    return true;
  }
}

/** Pieces of furniture: the 6-connected groups of its voxels. */
function gruppi(voxel: Set<number>, X: number, XY: number): number[][] {
  const seen = new Set<number>();
  const out: number[][] = [];
  for (const s0 of voxel) {
    if (seen.has(s0)) continue;
    const group = [s0];
    seen.add(s0);
    for (let q = 0; q < group.length; q++) {
      const i = group[q];
      for (const j of [i - 1, i + 1, i - X, i + X, i - XY, i + XY]) if (voxel.has(j) && !seen.has(j)) { seen.add(j); group.push(j); }
    }
    out.push(group);
  }
  return out;
}

// ---------------------------------------------------------------- 2. models of furniture as data

export interface Mobile {
  id: string;
  /** Voxels of the model at the building's density, cropped: `X·Y·Z` cells of letters of `alphabet`. */
  X: number;
  Y: number;
  Z: number;
  cells: Uint8Array;
  alphabet: string[];
  palette: Record<string, PaletteEntry>;
}

/** The catalogue the Scenografo chooses from: what a room of each kind may hold (data, the whole of what an agent writes). */
export const CATALOGO = {
  sala: ['banco', 'credenza', 'barile', 'mobile'],
  stanza: ['letto', 'credenza', 'mobile'],
  piccola: ['barile', 'mobile'],
};

const ROOT = path.resolve(__dirname, '../../..');

/** The furniture models of the seed, run once at 20 voxels a tile and resampled to `vpt`. */
export function catalogo(vpt: number): Map<string, Mobile> {
  const dir = path.join(ROOT, 'universe/models');
  const ids = [...new Set(Object.values(CATALOGO).flat())];
  const files: Record<string, string> = { 'models/index.json': fs.readFileSync(path.join(dir, 'index.json'), 'utf8') };
  for (const id of ids) files[`models/${id}.xml`] = fs.readFileSync(path.join(dir, `${id}.xml`), 'utf8');
  const forms = new Forms(new InlineRunner(new FormCache()));
  forms.load(files);
  const out = new Map<string, Mobile>();
  for (const id of ids) {
    const q = forms.request(id, 1)!;
    const model = compileMjx(q.xml, q.size ? { size: q.size } : {});
    const g = runMjx(model, 1, { limits: FORM_LIMITS, deadline: 4_000 }).grid;
    const k = vpt / q.vpt;
    // Crop to what is drawn, then resample.
    let x0 = g.X, y0 = g.Y, x1 = -1, y1 = -1, z1 = -1;
    const colored = (c: number) => c !== 0 && !!model.program.palette[g.alphabet[c]]?.color && !model.program.palette[g.alphabet[c]]?.hidden;
    for (let z = 0; z < g.Z; z++)
      for (let y = 0; y < g.Y; y++)
        for (let x = 0; x < g.X; x++)
          if (colored(g.cells[x + y * g.X + z * g.X * g.Y])) {
            x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); z1 = Math.max(z1, z);
          }
    if (x1 < 0) continue;
    const X = Math.max(1, Math.round((x1 - x0 + 1) * k)), Y = Math.max(1, Math.round((y1 - y0 + 1) * k)), Z = Math.max(1, Math.round((z1 + 1) * k));
    const cells = new Uint8Array(X * Y * Z);
    for (let z = 0; z < Z; z++)
      for (let y = 0; y < Y; y++)
        for (let x = 0; x < X; x++) {
          const c = g.cells[Math.min(x1, x0 + Math.floor(x / k)) + Math.min(y1, y0 + Math.floor(y / k)) * g.X + Math.min(z1, Math.floor(z / k)) * g.X * g.Y];
          cells[x + y * X + z * X * Y] = colored(c) ? c : 0;
        }
    out.set(id, { id, X, Y, Z, cells, alphabet: g.alphabet, palette: model.program.palette });
  }
  return out;
}

/** A model turned a quarter `q` times around z. */
function turned(mo: Mobile, q: number): Mobile {
  let cur = mo;
  for (let n = 0; n < q; n++) {
    const { X, Y, Z } = cur;
    const cells = new Uint8Array(X * Y * Z);
    for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) cells[(Y - 1 - y) + x * Y + z * X * Y] = cur.cells[x + y * X + z * X * Y];
    cur = { ...cur, X: Y, Y: X, cells };
  }
  return cur;
}

/** The rooms of a storey: its centres, cut at the narrow passages, each passage cell given back to the nearest piece. */
function stanze(p: Pianta, X: number, Y: number, stretto: number): number[][] {
  let mask = new Uint8Array(X * Y);
  for (const i of p.centri) mask[i] = 1;
  const all = mask;
  for (let k = 0; k < stretto; k++) {
    const next = new Uint8Array(X * Y);
    for (let y = 1; y < Y - 1; y++)
      for (let x = 1; x < X - 1; x++) {
        const i = x + y * X;
        next[i] = mask[i] & mask[i - 1] & mask[i + 1] & mask[i - X] & mask[i + X];
      }
    mask = next;
  }
  const label = new Int32Array(X * Y).fill(-1);
  const queue: number[] = [];
  let n = 0;
  for (let s = 0; s < X * Y; s++) {
    if (!mask[s] || label[s] >= 0) continue;
    const stack = [s];
    label[s] = n;
    while (stack.length) {
      const i = stack.pop()!;
      queue.push(i);
      for (const j of [i - 1, i + 1, i - X, i + X]) if (j >= 0 && j < X * Y && mask[j] && label[j] < 0) { label[j] = n; stack.push(j); }
    }
    n++;
  }
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q];
    for (const j of [i - 1, i + 1, i - X, i + X]) if (j >= 0 && j < X * Y && all[j] && label[j] < 0) { label[j] = label[i]; queue.push(j); }
  }
  const out: number[][] = Array.from({ length: n }, () => []);
  for (const i of p.centri) if (label[i] >= 0) out[label[i]].push(i);
  return out.filter((r) => r.length >= 16);
}

export function arredaDati(s: Scena, semeArredo: number, mobili: Map<string, Mobile>): Arredato {
  const t0 = performance.now();
  const g = copy(s.e.grid);
  const { X, Y } = g;
  const XY = X * Y;
  const { vpt } = s.e.scatola;
  const r = Math.ceil(BODY_R * vpt);
  const rng = new Rng(semeArredo * 7919 + s.seme);
  const ps = piante(s);
  // The furniture's letters join the grid's alphabet once, with their colours.
  const colori: Record<string, PaletteEntry> = {};
  const codes = new Map<string, number[]>();
  let next = 0xe000;
  for (const mo of mobili.values())
    codes.set(mo.id, mo.alphabet.map((ch, i) => {
      if (i === 0) return 0;
      const sym = String.fromCharCode(next++);
      colori[sym] = mo.palette[ch] ?? { color: '888888' };
      return g.alphabet.push(sym) - 1;
    }));
  const voxel = new Set<number>();
  let pezzi = 0;
  const guardia = new Guardia(s);
  for (const p of ps) {
    if (p.cantina) continue; // a low top under the ground is a floor no body reaches: the cellar keeps only what reaches its ceiling
    const centri = new Set(p.centri);
    const rooms = stanze(p, X, Y, Math.round(0.4 * vpt)).sort((a, b) => b.length - a.length);
    rooms.forEach((room, n) => {
      const area = room.length / (vpt * vpt);
      const kind = n === 0 ? 'sala' : area >= 1.5 ? 'stanza' : 'piccola';
      const want = Math.min(4, Math.max(1, Math.floor(area / 1.2)));
      const list = CATALOGO[kind];
      const inRoom = new Set(room);
      for (let k = 0; k < want; k++) {
        const mo = turned(mobili.get(list[rng.int(list.length)])!, rng.int(4));
        // Candidates: every place, two voxels apart, around the room's centres (the piece goes against a wall, not on a centre).
        const cands: number[] = [];
        let bx0 = X, by0 = Y, bx1 = 0, by1 = 0;
        for (const i of room) {
          bx0 = Math.min(bx0, i % X); bx1 = Math.max(bx1, i % X); by0 = Math.min(by0, Math.floor(i / X)); by1 = Math.max(by1, Math.floor(i / X));
        }
        for (let y0 = Math.max(1, by0 - r - mo.Y); y0 <= Math.min(Y - mo.Y - 1, by1 + r); y0 += 2)
          for (let x0 = Math.max(1, bx0 - r - mo.X); x0 <= Math.min(X - mo.X - 1, bx1 + r); x0 += 2) cands.push(x0 + y0 * X);
        for (let tries = 0; tries < 400 && cands.length; tries++) {
          const o = cands.splice(rng.int(cands.length), 1)[0];
          const x0 = o % X, y0 = Math.floor(o / X);
          let ok = true, wall = false;
          for (let y = 0; y < mo.Y && ok; y++)
            for (let x = 0; x < mo.X && ok; x++) {
              const i = x0 + x + (y0 + y) * X;
              if (!p.libero[i] || g.cells[i + p.z * XY] !== 0) ok = false;
              for (const j of [i - 2, i + 2, i - 2 * X, i + 2 * X]) if (g.cells[j + p.z * XY] !== 0 && !p.libero[j] && !p.protetto[j]) wall = true;
            }
          if (!ok || !wall) continue;
          // The centres the piece takes away (a body touching it), and whether the storey stays in one piece per piece.
          const taken = new Set<number>();
          for (let y = -r; y < mo.Y + r; y++) for (let x = -r; x < mo.X + r; x++) {
            const i = x0 + x + (y0 + y) * X;
            if (centri.has(i)) taken.add(i);
          }
          const left = new Set([...centri].filter((i) => !taken.has(i)));
          if ([...inRoom].filter((i) => left.has(i)).length < 0.5 * inRoom.size) continue;
          // The voxels it would write, and the kernel's guard on them.
          const vox: number[] = [];
          for (let z = 0; z < mo.Z; z++)
            for (let y = 0; y < mo.Y; y++)
              for (let x = 0; x < mo.X; x++) if (mo.cells[x + y * mo.X + z * mo.X * mo.Y]) vox.push(x0 + x + (y0 + y) * X + (p.z + z) * XY);
          if (!guardia.ammetti(vox)) continue;
          // Placed: the voxels on the floor of the storey, the centres it covers gone.
          const map = codes.get(mo.id)!;
          for (let z = 0; z < mo.Z; z++)
            for (let y = 0; y < mo.Y; y++)
              for (let x = 0; x < mo.X; x++) {
                const c = mo.cells[x + y * mo.X + z * mo.X * mo.Y];
                const at = x0 + x + (y0 + y) * X + (p.z + z) * XY;
                if (!c || p.z + z >= g.Z || g.cells[at] !== 0) continue;
                g.cells[at] = map[c];
                voxel.add(at);
              }
          for (const i of taken) centri.delete(i);
          for (const i of taken) inRoom.delete(i);
          pezzi++;
          break;
        }
      }
    });
  }
  const ms = performance.now() - t0;
  const e = withGrid(s.e, g, colori);
  return { e, m: misura(e, s.b), ms, voxel, pezzi };
}

/**
 * The kernel's way with what an agent writes (rule 2): an interior that breaks the building is not kept. The furnishing runs again with
 * the next seed, at most `tentativi` times; the building stays empty if none holds.
 */
export function arredaValidato(s: Scena, arreda: (seme: number) => Arredato, seme: number, tentativi = 4): { a: Arredato; c: Confronto; tentativi: number; ms: number } {
  let ms = 0;
  let last: { a: Arredato; c: Confronto } | undefined;
  for (let k = 0; k < tentativi; k++) {
    const a = arreda(seme + 101 * k);
    const c = confronta(s, a);
    ms += a.ms;
    last = { a, c };
    if (regge(c)) return { a, c, tentativi: k + 1, ms };
  }
  return { ...last!, tentativi: tentativi + 1, ms };
}

// ---------------------------------------------------------------- what is compared

export interface Confronto {
  piani: [number, number];
  stanze: [number, number];
  murato: number;
  porta: boolean;
  cantina: [number, number];
  /** Body centres reached after, over those reached before that no piece of furniture touches: 1 when nothing is cut off. */
  raggiunte: number;
  /** Rooms of the storeys before (cut at the narrow passages) that keep a quarter of their floor free and reached, of all. */
  stanzePercorribili: [number, number];
  /** Pieces of furniture placed. */
  pezzi: number;
}

export function confronta(s: Scena, a: Arredato): Confronto {
  const g = s.e.grid;
  const { vpt } = s.e.scatola;
  const r = Math.ceil(BODY_R * vpt);
  const XY = g.X * g.Y;
  const near = new Set<number>();
  for (const v of a.voxel) {
    const x = v % g.X, y = Math.floor(v / g.X) % g.Y, z = Math.floor(v / XY);
    for (let dy = -r - 1; dy <= r + 1; dy++) for (let dx = -r - 1; dx <= r + 1; dx++) near.add(x + dx + (y + dy) * g.X + z * XY);
  }
  const key = (c: { x: number; y: number; z: number }) => c.x + c.y * g.X + c.z * XY;
  const after = new Set(a.m.celle.map(key));
  // A centre is touched if a furniture voxel is within the body at its feet or up to a person's height.
  const touched = (c: { x: number; y: number; z: number }) => {
    for (let dz = 0; dz < s.e.scatola.persona; dz += 2) if (near.has(c.x + c.y * g.X + (c.z + dz) * XY)) return true;
    return false;
  };
  const expected = s.m.celle.filter((c) => !touched(c));
  const reached = expected.filter((c) => after.has(key(c))).length;
  // The rooms of every storey before: each must still have a quarter of its floor free and reached.
  let rooms = 0, ok = 0;
  for (const p of piante(s)) {
    for (const room of stanze(p, g.X, g.Y, Math.round(0.4 * vpt))) {
      rooms++;
      const free = room.filter((i) => after.has(i + p.z * XY) || after.has(i + (p.z - 1) * XY) || after.has(i + (p.z + 1) * XY)).length;
      if (free >= 0.25 * room.length) ok++;
    }
  }
  return {
    piani: [s.m.piani.length, a.m.piani.length],
    stanze: [s.m.stanze, a.m.stanze],
    murato: a.m.murato,
    porta: !!a.m.porta?.libera,
    cantina: [s.m.cantina, a.m.cantina],
    raggiunte: expected.length ? reached / expected.length : 1,
    stanzePercorribili: [ok, rooms],
    pezzi: a.pezzi,
  };
}

/** Whether the interior broke nothing: the same storeys, every room still walked, the door and the cellar, nothing walled in, every free place still reached. */
export function regge(c: Confronto): boolean {
  return c.piani[1] === c.piani[0] && c.stanzePercorribili[0] === c.stanzePercorribili[1] && c.murato <= 0.25 && c.porta && (c.cantina[0] === 0 || c.cantina[1] > 0) && c.raggiunte >= 0.999;
}

/** Furniture of two furnishing seeds of the same building: voxels in one and not the other, over those in either. */
export function varianzaInterna(a: Set<number>, b: Set<number>): number {
  let both = 0;
  for (const v of a) if (b.has(v)) both++;
  const union = a.size + b.size - both;
  return union ? 1 - both / union : 0;
}
