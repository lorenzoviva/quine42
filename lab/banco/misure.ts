// The bench of the structures' prompt (T154): what a building program gives, measured with the game's own code. A body as wide
// as the wanderer walks and jumps through the model with the kernel's rules (`rampBlocks`, `topUnder`, `groundOfForm`), not column
// by column: a stair one voxel wide is a stair for `bodyGround`, not for a body. `giudica` turns the numbers into the threshold.

import { JUMP_FAR, JUMP_UP } from '../../src/kernel/kernel';
import { withSize } from '../../src/kernel/agents/sculptor';
import { FormCache, Forms, groundOfForm, InlineRunner, levelAt, MODEL_TIME, rampBlocks, stepOf, topUnder, type Form, type Ground } from '../../src/kernel/forms';
import { modelSize } from '../../src/kernel/modeldirector';
import { boxOf, classOf, type Taglia } from '../../src/mj/classes';
import { analyse, type Analysis } from '../../src/mj/check';
import { Mj3Error, type Grid3, type PaletteEntry, type RunResult, type Vec3 } from '../../src/mj/engine';
import { colorTable, surfaces, type Levels } from '../../src/mj/mesh';
import { compileMjx, type MjxModel } from '../../src/mj/model';
import { turn } from '../../src/mj/photo';
import { act, FORM_LIMITS, MAX_FORM_TIME, MAX_FORM_XML, runMjx } from '../../src/mj/run';

/** The half-side of the wanderer's body (`core.player`, physics.radius), in tiles. */
export const BODY_R = 0.22;

export interface Bersaglio {
  id: string;
  nome: string;
  stile: string;
  descrizione: string;
  classe: 'grande' | 'edificio';
  taglia?: Taglia;
  /** Tiles under the ground (ADR-0091). */
  sotto?: number;
}

export interface Scatola {
  box: Vec3;
  vpt: number;
  /** Voxels under the ground. */
  base: number;
  /** The highest rise one walks up, in voxels. */
  gradino: number;
  /** How tall a person is, in voxels: the height a room needs. */
  persona: number;
  /** The width of a passage a body goes through, in voxels. */
  corpo: number;
}

/** The library's own idea of a model of this class, size and cellar: how it would run in the game. */
function voce(b: Bersaglio, xml = '<sequence values="B"/>'): { forms: Forms; id: string; vpt: number; size?: Vec3 } {
  const id = 'prova';
  const info = { classe: b.classe, ...modelSize(b), ...(b.sotto ? { sotto: b.sotto } : {}) };
  const forms = new Forms(new InlineRunner(new FormCache()));
  forms.load({ [`models/${id}.xml`]: xml, 'models/index.json': JSON.stringify({ [id]: info }) });
  const q = forms.request(id, 1)!;
  return { forms, id, vpt: q.vpt, size: q.size };
}

export function scatolaDi(b: Bersaglio): Scatola {
  const { vpt, size } = voce(b);
  const base = (b.sotto ?? 0) * vpt;
  return { box: size!, vpt, base, gradino: stepOf(vpt), persona: Math.ceil(1.5 * vpt), corpo: Math.ceil(2 * BODY_R * vpt) + 2 };
}

export interface Eseguito {
  model: MjxModel;
  result: RunResult;
  /** The grid as a body finds it: the door open, if the model has an action that opens it. */
  grid: Grid3;
  aperta?: string;
  scatola: Scatola;
  /** The program with the box of its class, as the library keeps it. */
  xml: string;
}

const copia = (g: Grid3): Grid3 => ({ ...g, cells: new Uint8Array(g.cells), alphabet: [...g.alphabet], log: [], epoch: 0 });

/** Runs a program as the game does: the class's box, its limits, its time. Throws `Mj3Error` if the game would not take it. */
export function esegui(xml: string, b: Bersaglio, seme = 1): Eseguito {
  if (xml.length > MAX_FORM_XML) throw new Mj3Error(`programma troppo lungo (max ${MAX_FORM_XML} caratteri)`);
  const scatola = scatolaDi(b);
  const scritto = withSize(xml, scatola.box);
  const { forms, id } = voce(b, scritto);
  const q = forms.request(id, seme)!;
  const model = compileMjx(q.xml, q.size ? { size: q.size } : {});
  const result = runMjx(model, seme, { deadline: Math.min(q.tempo ?? MODEL_TIME, MAX_FORM_TIME), limits: FORM_LIMITS });
  const g = result.grid;
  const box: Vec3 = [g.X, g.Y, g.Z];
  const clip = model.actions.find((a) => /^apr/i.test(a.name));
  const grid = clip ? copia(g) : g;
  if (clip) act(grid, clip, seme);
  return { model, result, grid, ...(clip ? { aperta: clip.name } : {}), scatola: { ...scatola, box }, xml: scritto };
}

/** A floor a body reaches. */
export interface Cella {
  x: number;
  y: number;
  z: number;
}

export interface Piano {
  /** Height of the floor, voxels from the bottom of the grid. */
  z: number;
  /** Tiles above the ground (negative under it). */
  quota: number;
  /** Tiles² a body's centre can stand on. */
  area: number;
  /** Median height to the ceiling, in tiles. */
  testa: number;
  stanze: number;
}

export interface Porta {
  x: number;
  y: number;
  /** How far from the middle of the front, in tiles. */
  scarto: number;
  /** Median height of the passage, in tiles. */
  alta: number;
  /** Nothing stands between it and the path that comes from the front. */
  libera: boolean;
}

export interface Misure {
  voxel: number;
  ms: number;
  /** Everywhere a body's centre stands. */
  celle: Cella[];
  finito: boolean;
  analisi: Analysis;
  /** Covered floors a body reaches (the ground floor, the floors above, the cellar). */
  piani: Piano[];
  /** Open floors above the ground a body reaches (terraces, a walkable roof). */
  terrazze: number;
  stanze: number;
  /** Tiles² of covered floor a body could stand on and does not reach, over those it does. */
  murato: number;
  porta?: Porta;
  /** Places one gets to only with a jump, or better with one: separate landings. */
  salti: Array<{ x: number; y: number; z: number; sale: boolean }>;
  materiali: number;
  /** Share of the voxels of the most used letter. */
  dominante: number;
  finestre: number;
  /** How many of the four sides have at least a window. */
  latiConFinestre: number;
  dettagli: number;
  /** Sides with too few details to look worked on. */
  latiVuoti: number;
  /** Of the small pieces on the sides, those of a single voxel: speckle, not detail. */
  rumore: number;
  /** How many heights the top of the model has, each on a good part of it. */
  sagoma: number;
  /** Share of the sides not on their main plane: pilasters, eaves, recesses. */
  rilievo: number;
  /** Share of the footprint of the box the model takes. */
  ingombro: number;
  luci: number;
  /** Nodes that never did anything. */
  inutili: string[];
  avvisi: string[];
}

/** Where a body's centre gets walking, from the front of the model. */
interface Cammino {
  celle: Cella[];
  /** Key of a state: which of them have been reached. */
  ha(x: number, y: number, z: number): boolean;
  /** Places just out of the grid included: at the height of the ground, reached. */
  fuori(x: number, y: number): boolean;
}

const fakeForm = (g: Grid3, vpt: number, base: number) => ({ result: { grid: g }, vpt, base }) as unknown as Form;

function cammina(g: Grid3, ground: Ground, vpt: number, base: number): Cammino {
  const f = fakeForm(g, vpt, base);
  const { levels } = ground;
  const step = stepOf(vpt);
  const m = Math.ceil(BODY_R * vpt) + 2;
  const W = g.X + 2 * m;
  const key = (x: number, y: number, at: number) => (x + m + (y + m) * W) * 4096 + at;
  const blocks = (x: number, y: number, at: number) => {
    const lx = (x + 0.5 - g.X / 2) / vpt, ly = (y + 0.5 - g.Y / 2) / vpt;
    return rampBlocks(f, ground, lx - BODY_R, ly - BODY_R, lx + BODY_R, ly + BODY_R, at);
  };
  const seen = new Set<number>();
  const celle: Cella[] = [];
  const stack: number[] = [Math.floor(g.X / 2), g.Y + m - 1, base];
  seen.add(key(stack[0], stack[1], base));
  while (stack.length) {
    const at = stack.pop()!, y = stack.pop()!, x = stack.pop()!;
    if (x >= 0 && y >= 0 && x < g.X && y < g.Y) celle.push({ x, y, z: at });
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < -m || ny < -m || nx >= g.X + m || ny >= g.Y + m) continue;
      const inside = nx >= 0 && ny >= 0 && nx < g.X && ny < g.Y;
      const to = inside ? levels.z[levelAt(levels, nx + ny * g.X, at)] : base;
      if (Math.abs(to - at) > step || seen.has(key(nx, ny, to))) continue;
      if (blocks(nx, ny, at) || (to !== at && blocks(nx, ny, to))) continue;
      seen.add(key(nx, ny, to));
      stack.push(nx, ny, to);
    }
  }
  return {
    celle,
    ha: (x, y, z) => seen.has(key(x, y, z)),
    fuori: (x, y) => {
      for (let d = -step; d <= step; d++) if (base + d >= 0 && seen.has(key(x, y, base + d))) return true;
      return false;
    },
  };
}

/** How far up the first solid above a floor starts, in voxels; undefined under the open sky. */
function testaSopra(levels: Levels, i: number, z: number): number | undefined {
  for (let l = levels.start[i]; l < levels.start[i + 1]; l++) if (levels.base[l] > z && levels.z[l] > z) return levels.base[l] - z;
  return undefined;
}

const mediana = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[xs.length >> 1] : 0);

/** The heights with a floor large enough, the largest first, never closer than a body's height. */
function picchi(perZ: Map<number, number>, minimo: number, lontano: number): number[] {
  const out: number[] = [];
  for (const [z] of [...perZ].sort((a, b) => b[1] - a[1])) {
    const area = (perZ.get(z - 1) ?? 0) + perZ.get(z)! + (perZ.get(z + 1) ?? 0);
    if (area < minimo || out.some((o) => Math.abs(o - z) < lontano)) continue;
    out.push(z);
  }
  return out.sort((a, b) => a - b);
}

/** Rooms: what is left of a floor when the passages narrower than `stretto` close, in pieces large enough. */
function contaStanze(celle: Cella[], X: number, Y: number, stretto: number, minimo: number): number {
  let mask = new Uint8Array(X * Y);
  for (const c of celle) mask[c.x + c.y * X] = 1;
  for (let k = 0; k < stretto; k++) {
    const next = new Uint8Array(X * Y);
    for (let y = 1; y < Y - 1; y++)
      for (let x = 1; x < X - 1; x++) {
        const i = x + y * X;
        next[i] = mask[i] & mask[i - 1] & mask[i + 1] & mask[i - X] & mask[i + X] & mask[i - X - 1] & mask[i - X + 1] & mask[i + X - 1] & mask[i + X + 1];
      }
    mask = next;
  }
  let n = 0;
  for (const size of pezzi(mask, X, Y)) if (size >= minimo) n++;
  return n;
}

/** The sizes of the 4-connected pieces of a mask. */
function pezzi(mask: Uint8Array, X: number, Y: number): number[] {
  const seen = new Uint8Array(X * Y);
  const out: number[] = [];
  for (let s = 0; s < X * Y; s++) {
    if (!mask[s] || seen[s]) continue;
    let size = 0;
    const stack = [s];
    seen[s] = 1;
    while (stack.length) {
      const i = stack.pop()!;
      size++;
      const x = i % X;
      for (const n of [x > 0 ? i - 1 : -1, x < X - 1 ? i + 1 : -1, i >= X ? i - X : -1, i < X * (Y - 1) ? i + X : -1])
        if (n >= 0 && mask[n] && !seen[n]) {
          seen[n] = 1;
          stack.push(n);
        }
    }
    out.push(size);
  }
  return out;
}

/** The front door: where the covered ground floor opens towards the front, on a covered piece large enough to be a room. */
function trovaPorta(g: Grid3, cammino: Cammino, levels: Levels, vpt: number, base: number, minimo: number): Porta | undefined {
  const step = stepOf(vpt);
  const coperto = new Uint8Array(g.X * g.Y);
  const testa = new Int32Array(g.X * g.Y);
  const aperto = new Uint8Array(g.X * g.Y);
  for (const c of cammino.celle) {
    if (Math.abs(c.z - base) > step) continue;
    const i = c.x + c.y * g.X;
    const h = testaSopra(levels, i, c.z);
    if (h === undefined) aperto[i] = 1;
    else {
      coperto[i] = 1;
      testa[i] = h;
    }
  }
  // Each covered piece, with its size.
  const piece = new Int32Array(g.X * g.Y).fill(-1);
  const sizes: number[] = [];
  for (let s = 0; s < coperto.length; s++) {
    if (!coperto[s] || piece[s] >= 0) continue;
    const id = sizes.length;
    let size = 0;
    const stack = [s];
    piece[s] = id;
    while (stack.length) {
      const i = stack.pop()!;
      size++;
      const x = i % g.X;
      for (const n of [x > 0 ? i - 1 : -1, x < g.X - 1 ? i + 1 : -1, i >= g.X ? i - g.X : -1, i < g.X * (g.Y - 1) ? i + g.X : -1])
        if (n >= 0 && coperto[n] && piece[n] < 0) {
          piece[n] = id;
          stack.push(n);
        }
    }
    sizes.push(size);
  }
  const freeFront = (x: number, y: number) => {
    for (let k = y + 1; k < g.Y; k++) if (!aperto[x + k * g.X]) return false;
    return cammino.fuori(x, g.Y);
  };
  let best: Porta | undefined;
  const altezze: number[] = [];
  for (let y = 0; y < g.Y; y++)
    for (let x = 0; x < g.X; x++) {
      const i = x + y * g.X;
      if (!coperto[i] || sizes[piece[i]] < minimo) continue;
      const open = y + 1 >= g.Y ? cammino.fuori(x, g.Y) : !!aperto[i + g.X];
      if (!open) continue;
      altezze.push(testa[i]);
      const p: Porta = { x, y, scarto: Math.abs(x + 0.5 - g.X / 2) / vpt, alta: 0, libera: freeFront(x, y) };
      if (!best || Number(p.libera) > Number(best.libera) || (p.libera === best.libera && p.scarto < best.scarto)) best = p;
    }
  if (best) best.alta = mediana(altezze) / vpt;
  return best;
}

/**
 * What a jump adds, by the kernel's rules (`Kernel.jump`): from a flat place a body stands on, in the four directions, the first place from
 * 1 to `JUMP_FAR` tiles away where the feet can rest, flying over nothing higher than `JUMP_UP`. It counts if it goes up by more than a
 * step or across a gap or an obstacle, and lands on something flat: a stair is walked, not jumped. As in the game it lands only on floors reached on foot
 * (`bodyGround` blocks the others): the top of a crate is flown over, never stood on.
 */
function trovaSalti(g: Grid3, ground: Ground, cammino: Cammino, vpt: number, base: number): Misure['salti'] {
  const f = fakeForm(g, vpt, base);
  const { levels } = ground;
  const step = stepOf(vpt);
  const piatto = (x: number, y: number, at: number) => {
    const r = Math.ceil(BODY_R * vpt);
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const nx = x + dx, ny = y + dy;
        const z = nx >= 0 && ny >= 0 && nx < g.X && ny < g.Y ? levels.z[levelAt(levels, nx + ny * g.X, at)] : base;
        if (Math.abs(z - at) > 1) return false;
      }
    return true;
  };
  const near = (lx: number, ly: number, at: number) => rampBlocks(f, ground, lx - BODY_R, ly - BODY_R, lx + BODY_R, ly + BODY_R, at);
  const landings = new Map<string, { x: number; y: number; z: number; sale: boolean }>();
  for (const c of cammino.celle) {
    if (c.x % 3 || c.y % 3 || !piatto(c.x, c.y, c.z)) continue;
    const lx0 = (c.x + 0.5 - g.X / 2) / vpt, ly0 = (c.y + 0.5 - g.Y / 2) / vpt;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      let over = false, gap = false;
      for (let k = 1; k * 0.1 <= JUMP_FAR + 1e-6; k++) {
        const d = k * 0.1, lx = lx0 + dx * d, ly = ly0 + dy * d;
        const t = topUnder(f, levels, lx - BODY_R, ly - BODY_R, lx + BODY_R, ly + BODY_R, c.z, JUMP_UP * vpt);
        const h0 = (c.z - base) / vpt;
        if (t !== undefined && t - h0 > JUMP_UP) break;
        if (t !== undefined && t - h0 > step / vpt) over = true;
        const vx = Math.floor(lx * vpt + g.X / 2), vy = Math.floor(ly * vpt + g.Y / 2);
        const dentro = vx >= 0 && vy >= 0 && vx < g.X && vy < g.Y;
        if (!dentro) break;
        const i = vx + vy * g.X;
        const lim = c.z + JUMP_UP * vpt;
        const low = ground.hole?.[i] ? base - step : base + 1;
        let h = base;
        for (let l = levels.start[i]; l < levels.start[i + 1]; l++) if (levels.z[l] >= low && levels.z[l] <= lim) h = Math.max(h, levels.z[l]);
        if (h < c.z - step) gap = true;
        if (k < 10) continue;
        if (near(lx, ly, h)) continue;
        const sale = h > c.z + step;
        if ((sale || (gap && h >= c.z - step) || (over && h >= c.z - step)) && piatto(vx, vy, h)) landings.set(`${vx >> 2},${vy >> 2},${h}`, { x: vx, y: vy, z: h, sale });
        break;
      }
    }
  }
  // Separate landings: pieces of neighbouring coarse cells at about the same height.
  const out: Misure['salti'] = [];
  const left = new Map(landings);
  for (const [k, v] of landings) {
    if (!left.has(k)) continue;
    left.delete(k);
    const stack = [v];
    let sale = v.sale;
    while (stack.length) {
      const a = stack.pop()!;
      for (const [k2, b] of left)
        if (Math.abs((a.x >> 2) - (b.x >> 2)) <= 1 && Math.abs((a.y >> 2) - (b.y >> 2)) <= 1 && Math.abs(a.z - b.z) <= step) {
          left.delete(k2);
          sale ||= b.sale;
          stack.push(b);
        }
    }
    out.push({ x: v.x, y: v.y, z: v.z, sale });
  }
  return out;
}

const isWindow = (p: PaletteEntry | undefined) => !!p && (p.glow === true || (p.alpha ?? 1) < 1 || /vetr|finestr|glass|window/i.test(p.name ?? ''));

/** The four sides seen from outside: windows, small pieces, how much of them is off their main plane. */
function lati(g: Grid3, palette: Record<string, PaletteEntry>, vpt: number, base: number) {
  const colors = colorTable(g.alphabet, palette);
  const area = (1.5 * vpt) ** 2;
  const piccolo = vpt * vpt;
  let finestre = 0, latiConFinestre = 0, dettagli = 0, singoli = 0, latiVuoti = 0, fuoriPiano = 0, pixel = 0;
  for (let v = 0; v < 4; v++) {
    const t = turn(g, v);
    const XY = t.X * t.Y;
    const Z = t.Z - base;
    const P = t.X * Z;
    const depth = new Int32Array(P).fill(-1);
    const letter = new Int32Array(P).fill(-1);
    for (let z = 0; z < Z; z++)
      for (let x = 0; x < t.X; x++)
        for (let y = t.Y - 1; y >= 0; y--) {
          const c = t.cells[x + y * t.X + (z + base) * XY];
          if (colors[c]) {
            depth[x + z * t.X] = t.Y - 1 - y;
            letter[x + z * t.X] = c;
            break;
          }
        }
    // The main plane: the depth most of the side is at.
    const hist = new Map<number, number>();
    let solid = 0;
    for (let i = 0; i < P; i++)
      if (depth[i] >= 0) {
        hist.set(depth[i], (hist.get(depth[i]) ?? 0) + 1);
        solid++;
      }
    if (!solid) {
      latiVuoti++;
      continue;
    }
    const plane = [...hist].sort((a, b) => b[1] - a[1])[0][0];
    pixel += solid;
    for (let i = 0; i < P; i++) if (depth[i] >= 0 && Math.abs(depth[i] - plane) > 1) fuoriPiano++;
    // The widest columns that have something: what is out of them is not a hole of the side.
    let x0 = t.X, x1 = -1, z1 = -1;
    for (let z = 0; z < Z; z++) for (let x = 0; x < t.X; x++) if (depth[x + z * t.X] >= 0) (x0 = Math.min(x0, x)), (x1 = Math.max(x1, x)), (z1 = Math.max(z1, z));
    // Windows: glass or a light on the plane, or a hole in it, of the size of a window, above the feet, with something around.
    const mask = new Uint8Array(P);
    for (let z = stepOf(vpt) + 1; z < z1; z++)
      for (let x = x0 + 1; x < x1; x++) {
        const i = x + z * t.X;
        if (letter[i] >= 0 ? isWindow(palette[g.alphabet[letter[i]]]) : false) mask[i] = 1;
        else if (depth[i] < 0 || depth[i] > plane + 2) mask[i] = 1;
      }
    let qui = 0;
    const seen = new Uint8Array(P);
    for (let s = 0; s < P; s++) {
      if (!mask[s] || seen[s]) continue;
      let size = 0, xa = t.X, xb = -1, za = Z, zb = -1;
      const stack = [s];
      seen[s] = 1;
      while (stack.length) {
        const i = stack.pop()!;
        size++;
        const x = i % t.X, z = (i - x) / t.X;
        xa = Math.min(xa, x), xb = Math.max(xb, x), za = Math.min(za, z), zb = Math.max(zb, z);
        for (const n of [x > 0 ? i - 1 : -1, x < t.X - 1 ? i + 1 : -1, i >= t.X ? i - t.X : -1, i < P - t.X ? i + t.X : -1])
          if (n >= 0 && mask[n] && !seen[n]) {
            seen[n] = 1;
            stack.push(n);
          }
      }
      if (size >= 6 && size <= area && xb - xa >= 1 && zb - za >= 1) qui++;
    }
    finestre += qui;
    if (qui) latiConFinestre++;
    // Small pieces of a letter: what makes a side look worked on.
    const visti = new Uint8Array(P);
    let quiDettagli = 0;
    for (let s = 0; s < P; s++) {
      if (letter[s] < 0 || visti[s]) continue;
      let size = 0;
      const stack = [s];
      visti[s] = 1;
      while (stack.length) {
        const i = stack.pop()!;
        size++;
        const x = i % t.X;
        for (const n of [x > 0 ? i - 1 : -1, x < t.X - 1 ? i + 1 : -1, i >= t.X ? i - t.X : -1, i < P - t.X ? i + t.X : -1])
          if (n >= 0 && letter[n] === letter[s] && !visti[n]) {
            visti[n] = 1;
            stack.push(n);
          }
      }
      if (size === 1) singoli++;
      else if (size <= piccolo) quiDettagli++;
    }
    dettagli += quiDettagli;
    if (quiDettagli < 3) latiVuoti++;
  }
  return { finestre, latiConFinestre, dettagli, latiVuoti, rumore: singoli / Math.max(1, singoli + dettagli), rilievo: fuoriPiano / Math.max(1, pixel) };
}

/** Everything the bench measures of a program that runs. */
export function misura(e: Eseguito, b: Bersaglio): Misure {
  const { grid: g, model, result, scatola } = e;
  const { vpt, base } = scatola;
  const palette = model.program.palette;
  const cls = classOf(b.classe)!;
  const classBox = boxOf(cls, b.taglia);
  const analisi = analyse(result, palette, { grounded: true, minHeight: Math.round((cls.minHeight ?? 0) * classBox[2]) + base });
  const step = stepOf(vpt);
  const ground = groundOfForm(g, palette, vpt, base);
  const { levels } = ground;
  const cammino = cammina(g, ground, vpt, base);

  // Storeys and terraces: the heights with a large floor, covered and open.
  const minArea = (1.1 * vpt) ** 2;
  const lontano = Math.ceil(0.7 * vpt);
  const coperte = new Map<number, number>();
  const aperte = new Map<number, number>();
  for (const c of cammino.celle) {
    const i = c.x + c.y * g.X;
    if (testaSopra(levels, i, c.z) !== undefined) coperte.set(c.z, (coperte.get(c.z) ?? 0) + 1);
    else if (Math.abs(c.z - base) > step) aperte.set(c.z, (aperte.get(c.z) ?? 0) + 1);
  }
  const strettoia = Math.round(0.4 * vpt);
  const piani: Piano[] = picchi(coperte, minArea, lontano).map((z) => {
    const celle = cammino.celle.filter((c) => Math.abs(c.z - z) <= 1 && testaSopra(levels, c.x + c.y * g.X, c.z) !== undefined);
    return {
      z,
      quota: (z - base) / vpt,
      area: celle.length / (vpt * vpt),
      testa: mediana(celle.map((c) => testaSopra(levels, c.x + c.y * g.X, c.z)!)) / vpt,
      stanze: contaStanze(celle, g.X, g.Y, strettoia, 16),
    };
  });
  const terrazze = picchi(aperte, minArea / 4, lontano).length;

  // What a body could stand on and does not reach, in pieces as large as a floor: rooms walled in, a storey without a stair (not the top of a crate).
  const raw = surfaces(g, palette, step + 1, Math.ceil(0.7 * vpt));
  const presi = new Set<number>();
  for (const c of cammino.celle) presi.add((c.x + c.y * g.X) * 4096 + c.z);
  const rawForm = fakeForm(g, vpt, base);
  const rawGround = { ...ground, levels: raw };
  const persi = new Map<number, Uint8Array>();
  for (let y = 0; y < g.Y; y++)
    for (let x = 0; x < g.X; x++) {
      const i = x + y * g.X;
      for (let l = raw.start[i]; l < raw.start[i + 1]; l++) {
        const z = raw.z[l];
        if (raw.block[l] || presi.has(i * 4096 + z) || testaSopra(raw, i, z) === undefined) continue;
        const lx = (x + 0.5 - g.X / 2) / vpt, ly = (y + 0.5 - g.Y / 2) / vpt;
        if (rampBlocks(rawForm, rawGround, lx - BODY_R, ly - BODY_R, lx + BODY_R, ly + BODY_R, z)) continue;
        let mask = persi.get(z);
        if (!mask) persi.set(z, (mask = new Uint8Array(g.X * g.Y)));
        mask[i] = 1;
      }
    }
  let perso = 0;
  for (const mask of persi.values()) for (const size of pezzi(mask, g.X, g.Y)) if (size >= minArea) perso += size;
  const presiCoperti = [...coperte.values()].reduce((s, n) => s + n, 0);

  // Materials, roofline, footprint.
  const total = Object.values(analisi.colors).reduce((s, n) => s + n, 0) || 1;
  const materiali = Object.values(analisi.colors).filter((n) => n / total >= 0.002).length;
  const dominante = Math.max(0, ...Object.values(analisi.colors)) / total;
  const luci = Object.entries(analisi.colors).filter(([k]) => palette[k]?.glow).reduce((s, [, n]) => s + n, 0);
  const colors = colorTable(g.alphabet, palette);
  const XY = g.X * g.Y;
  const cime = new Map<number, number>();
  let occupate = 0;
  for (let i = 0; i < XY; i++) {
    let top = -1;
    for (let z = g.Z - 1; z >= base; z--)
      if (colors[g.cells[i + z * XY]]) {
        top = z;
        break;
      }
    if (top < 0) continue;
    occupate++;
    cime.set(top, (cime.get(top) ?? 0) + 1);
  }
  const sagoma = [...cime.values()].filter((n) => n / Math.max(1, occupate) >= 0.015).length;

  return {
    voxel: analisi.voxels,
    celle: cammino.celle,
    ms: result.ms,
    finito: result.finished,
    analisi,
    piani,
    terrazze,
    stanze: piani.reduce((s, p) => s + p.stanze, 0),
    murato: perso / Math.max(1, presiCoperti),
    porta: trovaPorta(g, cammino, levels, vpt, base, minArea),
    salti: trovaSalti(g, ground, cammino, vpt, base),
    materiali,
    dominante,
    ...lati(g, palette, vpt, base),
    sagoma,
    ingombro: occupate / XY,
    luci,
    inutili: result.unused ?? [],
    avvisi: [...model.warnings, ...analisi.warnings],
  };
}

/** The threshold of quality (T154): what can be measured. What cannot is in `lab/banco/README.md`, for who looks at the photos. */
export const SOGLIA = {
  /** Covered floors a body reaches, ramps only. */
  piani: 2,
  /** On each of them a person stands: tiles to the ceiling. */
  testa: 1.5,
  /** Rooms on all of them, each a body reaches. */
  stanze: 3,
  /** Floor a body could stand on and does not reach, over the floor it reaches. */
  murato: 0.25,
  /** The door faces the front: at most this far from its middle, as a share of the width. */
  scartoPorta: 1 / 3,
  /** Places a jump gets to. */
  salti: 2,
  /** Letters with at least 0.2% of the voxels. */
  materiali: 6,
  /** The most used letter, at most. */
  dominante: 0.6,
  finestre: 6,
  latiConFinestre: 3,
  dettagli: 24,
  /** Sides that look blank: at most this many (the back may be plain). */
  latiVuoti: 1,
  /** Speckle among the small pieces, at most. */
  rumore: 0.7,
  /** Different heights of the top. */
  sagoma: 4,
  /** Share of the sides off their main plane. */
  rilievo: 0.12,
  /** Share of the footprint of the box. */
  ingombro: 0.3,
} as const;

export interface Voce {
  id: string;
  ok: boolean;
  valore: string;
  richiesto: string;
}

export interface Giudizio {
  passa: boolean;
  voci: Voce[];
  difetti: string[];
}

const n2 = (v: number) => (Math.round(v * 100) / 100).toString();

/** The numbers against the threshold, one line per criterion, what fails first in the list of defects. */
export function giudica(m: Misure, s: Scatola): Giudizio {
  const S = SOGLIA;
  const voci: Voce[] = [];
  const voce_ = (id: string, ok: boolean, valore: string | number, richiesto: string | number) => voci.push({ id, ok, valore: String(valore), richiesto: String(richiesto) });
  voce_('finisce', m.finito, m.finito ? `${m.ms} ms` : 'no', `entro ${MODEL_TIME} ms`);
  voce_('valido', !m.analisi.errors.length, m.analisi.errors.join('; ') || 'sì', 'i controlli di check.ts');
  voce_('piani', m.piani.length >= S.piani, m.piani.length, `≥ ${S.piani}`);
  const bassi = m.piani.filter((p) => p.testa < S.testa);
  voce_('testa', !bassi.length && m.piani.length > 0, m.piani.map((p) => n2(p.testa)).join(' ') || '—', `≥ ${S.testa} caselle per piano`);
  voce_('stanze', m.stanze >= S.stanze, m.stanze, `≥ ${S.stanze}`);
  voce_('murato', m.murato <= S.murato, n2(m.murato), `≤ ${n2(S.murato)}`);
  const scarto = m.porta ? m.porta.scarto / (s.box[0] / s.vpt) : undefined;
  voce_('porta', !!m.porta && m.porta.libera && scarto! <= S.scartoPorta && m.porta.alta >= S.testa, m.porta ? `x ${m.porta.x}, scarto ${n2(scarto!)}, alta ${n2(m.porta.alta)}, ${m.porta.libera ? 'libera' : 'ostruita'}` : 'nessuna sul davanti', `sul davanti, scarto ≤ ${n2(S.scartoPorta)}, alta ≥ ${S.testa}`);
  voce_('salti', m.salti.length >= S.salti, m.salti.length, `≥ ${S.salti}`);
  voce_('materiali', m.materiali >= S.materiali, m.materiali, `≥ ${S.materiali}`);
  voce_('dominante', m.dominante <= S.dominante, n2(m.dominante), `≤ ${S.dominante}`);
  voce_('finestre', m.finestre >= S.finestre && m.latiConFinestre >= S.latiConFinestre, `${m.finestre} su ${m.latiConFinestre} lati`, `≥ ${S.finestre} su ≥ ${S.latiConFinestre} lati`);
  voce_('dettagli', m.dettagli >= S.dettagli && m.latiVuoti <= S.latiVuoti, `${m.dettagli}, ${m.latiVuoti} lati vuoti`, `≥ ${S.dettagli}, ≤ ${S.latiVuoti} lati vuoti`);
  voce_('rumore', m.rumore <= S.rumore, n2(m.rumore), `≤ ${S.rumore}`);
  voce_('sagoma', m.sagoma >= S.sagoma, m.sagoma, `≥ ${S.sagoma}`);
  voce_('rilievo', m.rilievo >= S.rilievo, n2(m.rilievo), `≥ ${S.rilievo}`);
  voce_('ingombro', m.ingombro >= S.ingombro, n2(m.ingombro), `≥ ${S.ingombro}`);
  const difetti = voci.filter((v) => !v.ok).map((v) => `${v.id}: ${v.valore} (serve ${v.richiesto})`);
  return { passa: !difetti.length, voci, difetti };
}
