// Every thing's look is a MarkovJunior program (ADR-0041): the universe keeps a library of programs
// (`models/<id>.xml`, described in `models/index.json`: class, name, who wrote it), one per kind of thing;
// an instance is the same program with another seed. Running a program gives a *form*: the voxel grid,
// where it blocks a body (its footprint), what one stands on (its floors), its actions and animations.
//
// The kernel never draws: it asks a FormRunner for forms (in Node it runs them itself, in the browser a
// pool of workers runs them and also makes the meshes the renderer draws) and uses them for collision
// and for actions. A form that is not ready yet is simply not there: the thing blocks by its radius.

import { boxOf, classOf, CLASSES, type AssetClass } from '../mj/classes';
import { Mj3Error, type PaletteEntry, type Vec3 } from '../mj/engine';
import { colorTable, floors, footprint, surfaces, type Levels, type VoxelGrid } from '../mj/mesh';
import { compileMjx } from '../mj/model';
import { act, FORM_LIMITS, MAX_FORM_TIME, MAX_FORM_XML, runMjx } from '../mj/run';
import { hashStr } from './rng';
import type { FileMap } from './types';

export const MODELS_DIR = 'models/';
export const MODELS_INDEX = 'models/index.json';
/** Voxels per tile (ADR-0032): a person is 30 voxels tall, a tile 20. A model may say its own (ADR-0049). */
export const VPT = 20;

/** The density a model's index entry asks for, if it is a sane one (the corona's buildings: 8). */
export function vptOf(info: ModelInfo | undefined): number {
  const v = info?.vpt;
  return typeof v === 'number' && Number.isInteger(v) && v >= 4 && v <= 40 ? v : VPT;
}

/**
 * How many tiles of a model stand under the ground (ADR-0091, T52b): its index entry's `sotto`, from 1 to 3
 * (a cellar, a crypt); 0 for anything else.
 */
export function sottoOf(info: ModelInfo | undefined): number {
  const n = info?.sotto;
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 3 ? n : 0;
}

export interface ModelInfo {
  /** Asset class (src/mj/classes.ts): its box and how it moves. */
  classe: string;
  /** Its size (ADR-0092), if not the class's own: the box grows or shrinks with it (and `vpt` with it). */
  taglia?: string;
  nome?: string;
  /** Who wrote it: "a mano", "scultore", the Gemini model… */
  autore?: string;
  /** The Artist's vote (0-10), if it was judged. */
  voto?: number;
  /** A letter of the program that takes the colour of the thing (generic models: one program, many colours). */
  tinta?: string;
  /** Voxels per tile, if not the usual 20 (ADR-0049): big models are written coarser. */
  vpt?: number;
  /** Milliseconds the program may run, if not `MODEL_TIME`: slow programs drawn by hand (circuito-3D). */
  tempo?: number;
  /** Tiles under the ground (ADR-0091): the box of the class grows down by them, the lowest voxels are the cellar. */
  sotto?: number;
  /** Artist's critique advice and problems (T48a). */
  consigli?: string[];
  problemi?: string[];
}

/** What a thing's look is: which program, which seed, which way it faces, what has been done to it. */
export interface FormComp {
  model: string;
  seed: number;
  /** Radians; the model's front (+y in MarkovJunior, towards the camera) turned by this. */
  yaw: number;
  /** Colour for the program's `tinta` letter. */
  tint?: string;
  /** Actions done on this instance, in order (the door opened, then closed): replayed on the form. */
  done?: string[];
  /**
   * The model it should wear when the library has it (its own, or a structure's), and its class: until
   * then `model` is the generic one of the class; the kernel switches when the program arrives.
   */
  wanted?: string;
  classe?: string;
}

export interface FormRequest {
  xml: string;
  seed: number;
  size?: Vec3;
  tint?: { symbol: string; color: string };
  /** Figures: the limbs as separate meshes (browser runners). */
  rig?: boolean;
  /** Vegetation: per-vertex wind weight (browser runners). */
  sway?: boolean;
  vpt: number;
  /** Milliseconds the program may run (`ModelInfo.tempo`, else `MODEL_TIME`). */
  tempo?: number;
  /** Model id for diagnostics and cache key (T64). */
  model?: string;
}

/** How long a model's program may run, unless its entry in the index says otherwise. */
export const MODEL_TIME = 8_000;

export interface FormResult {
  grid: VoxelGrid;
  palette: Record<string, PaletteEntry>;
  actions: Array<{ name: string; label?: string }>;
  animations: string[];
  /** Whatever the runner adds for the renderer (meshes): the kernel does not look at it. */
  meshes?: unknown;
}

export interface FormRunner {
  run(req: FormRequest): Promise<FormResult>;
}

export interface Form {
  key: string;
  model: string;
  seed: number;
  status: 'pending' | 'ready' | 'failed';
  error?: string;
  result?: FormResult;
  /** Per voxel column: something solid at body height (between a step and a head). */
  foot?: Uint8Array;
  /** Per voxel column: the height (voxels) of the solid that starts at the ground and goes up without a gap. */
  floor?: Uint8Array;
  /** Per voxel column: a body cannot stand on its ground floor (something at body height above it, or out of reach). */
  block?: Uint8Array;
  /** Every floor of every column (T53b). */
  levels?: Levels;
  /** Voxel columns with something under the ground (T52b): the cellar's hole, where the terrain is not. */
  hole?: Uint8Array;
  /**
   * Voxels of the model under the ground (ADR-0091, `sotto · vpt`): it is laid this much lower. Without a cellar that
   * holds (`hole` undefined) they are as if inside the earth: nothing stands there, the terrain is whole.
   */
  base: number;
  cls: AssetClass;
  /** Half the diagonal of the footprint, in tiles: the reach of its collision. */
  reach: number;
  /** Voxels per tile of this model (ADR-0049). */
  vpt: number;
}

/** How many different seeds a kind of thing has in the world (instances share them: fewer meshes). */
const SEEDS: Record<string, number> = { albero: 3, cespuglio: 3, roccia: 3, sasso: 3, persona: 8, animale: 4, bestia: 4, edificio: 1, grande: 1, monumento: 2 };

/** A step one walks up without noticing (a doorstep, a floor): 0.2 tiles, in voxels of a density. */
export const stepOf = (vpt: number) => Math.round(0.2 * vpt);

/** The first tag of a program, comments skipped (a comment may name a tag, `<markov>`, T113). */
export const rootTag = (xml: string) => /<[a-z]+\b[^>]*>/i.exec(xml.replace(/<!--[\s\S]*?-->/g, ''))?.[0] ?? '';

/**
 * The box a program runs in: its own `size` if it says one (structures decide on a coarse grid and `map`
 * up), otherwise its class's box at its size.
 */
function sizeFor(xml: string, cls: AssetClass, taglia?: string, under = 0): Vec3 | undefined {
  if (/\ssize="/.test(rootTag(xml))) return undefined;
  const [X, Y, Z] = boxOf(cls, taglia);
  // A model with a cellar (T52b): the box goes down by it, the program writes the cellar in its lowest voxels.
  return [X, Y, Z + under];
}

/** Where a body cannot go: voxel columns solid between a step and a head (above the ground, `base` voxels up the grid). */
export const bodyFoot = (g: VoxelGrid, palette: Record<string, PaletteEntry>, vpt = VPT, base = 0) => footprint(g, palette, base + stepOf(vpt) + 1, base + Math.ceil(0.7 * vpt));

/** The voxel columns of a model with something solid under the ground (its lowest `base` voxels, T52b), if any. */
export function holesOf(g: VoxelGrid, palette: Record<string, PaletteEntry>, base: number): Uint8Array | undefined {
  if (base <= 0) return undefined;
  const colors = colorTable(g.alphabet, palette);
  const XY = g.X * g.Y;
  const out = new Uint8Array(XY);
  let any = false;
  for (let i = 0; i < XY; i++)
    for (let z = 0; z < Math.min(base, g.Z); z++)
      if (colors[g.cells[i + z * XY]]) {
        out[i] = 1;
        any = true;
        break;
      }
  return any ? out : undefined;
}

/** What a body stands on in a model: the ground floor of every column (T53a) and all its floors (T53b). */
export interface Ground {
  /** Per voxel column: the height (voxels) of the solid that starts at the ground and goes up without a gap. */
  floor: Uint8Array;
  /** Per voxel column: a body cannot stand on its ground floor. */
  block: Uint8Array;
  /** Every floor of every column, each with whether a body cannot stand there. */
  levels: Levels;
  /** The columns of the cellar (T52b): there the terrain is not, the floors may be under the ground. */
  hole?: Uint8Array;
}

/**
 * What a body stands on in a model (ADR-0043, T53a, T53b): every floor of every column (the top of each run of
 * solid), and where a body cannot stand — it hits something at body height, or the floor is out of reach. A floor
 * no higher than a step is reached from the ground; a higher one only going to a floor of a neighbouring column at
 * most a step higher or lower: a stair is a ramp, a wall is not, and the stair leads to the floor above.
 */
export function bodyGround(g: VoxelGrid, palette: Record<string, PaletteEntry>, vpt = VPT, base = 0, hole?: Uint8Array): Ground & { cellar?: boolean } {
  if (base > 0) return cellarGround(g, palette, vpt, base, hole);
  const step = stepOf(vpt);
  const levels = surfaces(g, palette, step + 1, Math.ceil(0.7 * vpt));
  const { start, z, block } = levels;
  const reached = new Uint8Array(z.length);
  const queue: number[] = [];
  for (let i = 0; i < g.X * g.Y; i++) if (z[start[i]] <= step && !block[start[i]]) (reached[start[i]] = 1), queue.push(start[i], i);
  reach(g, levels, reached, queue, step);
  for (let l = 0; l < block.length; l++) if (!reached[l]) block[l] = 1;
  const floor = floors(g, palette);
  const ground = new Uint8Array(g.X * g.Y);
  for (let i = 0; i < ground.length; i++) ground[i] = block[start[i]];
  return { floor, block: ground, levels };
}

/** From the floors already reached, every floor of a neighbouring column at most a step higher or lower (a ramp). */
function reach(g: VoxelGrid, levels: Levels, reached: Uint8Array, queue: number[], step: number): void {
  const { start, z, block } = levels;
  while (queue.length) {
    const i = queue.pop()!, l = queue.pop()!;
    const x = i % g.X, y = (i - x) / g.X;
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < 0 || ny < 0 || nx >= g.X || ny >= g.Y) continue;
      const n = nx + ny * g.X;
      for (let m = start[n]; m < start[n + 1]; m++) {
        if (reached[m] || block[m] || Math.abs(z[m] - z[l]) > step) continue;
        reached[m] = 1;
        queue.push(m, n);
      }
    }
  }
}

/**
 * What a body stands on in a model that goes `base` voxels under the ground (ADR-0091, T52b). Where the model has
 * nothing under the ground the earth is solid up to it (its floor there is `base`, the ground); the columns of the
 * cellar (`hole`) have their own floors, under the ground too. Floors are reached from the ground, the floors around
 * the model; the cellar holds (`cellar`) if a body stands somewhere under the ground and every such floor is reached
 * from the ground floor: by the stair, the only way, since the earth around is more than a step above the cellar.
 * `floor` and `block` are of the ground floor (the floor nearest to the ground), `floor` measured from the ground.
 */
function cellarGround(g: VoxelGrid, palette: Record<string, PaletteEntry>, vpt: number, base: number, hole?: Uint8Array): Ground & { cellar: boolean } {
  const step = stepOf(vpt);
  const XY = g.X * g.Y;
  const fill = new Uint16Array(XY);
  for (let i = 0; i < XY; i++) fill[i] = hole?.[i] ? 0 : base;
  const levels = surfaces(g, palette, step + 1, Math.ceil(0.7 * vpt), fill);
  const { start, z, block } = levels;
  const standing = Uint8Array.from(block);
  const reached = new Uint8Array(z.length);
  const queue: number[] = [];
  for (let i = 0; i < XY; i++)
    for (let l = start[i]; l < start[i + 1]; l++) if (Math.abs(z[l] - base) <= step && !block[l]) (reached[l] = 1), queue.push(l, i);
  reach(g, levels, reached, queue, step);
  for (let l = 0; l < block.length; l++) if (!reached[l]) block[l] = 1;
  // The cellar: somewhere under the ground a body stands, and every floor there where it could stand is reached.
  let down = false, lost = false;
  if (hole)
    for (let i = 0; i < XY; i++) {
      if (!hole[i]) continue;
      for (let l = start[i]; l < start[i + 1]; l++) {
        if (z[l] >= base - step || standing[l]) continue;
        if (reached[l]) down = true;
        else lost = true;
      }
    }
  const floor = new Uint8Array(XY);
  const ground = new Uint8Array(XY);
  for (let i = 0; i < XY; i++) {
    const l = levelAt(levels, i, base);
    const v = z[l] - base;
    floor[i] = Math.min(255, Math.max(hole?.[i] ? 1 : 0, v));
    ground[i] = block[l] || Math.abs(v) > step ? 1 : 0;
  }
  return { floor, block: ground, levels, ...(hole ? { hole } : {}), cellar: down && !lost };
}

/**
 * What a body stands on in a model laid `base` voxels under the ground (T52b): with its cellar if the cellar holds
 * (every floor under the ground reached from the ground floor), else as if the earth filled what is under the ground.
 */
export function groundOfForm(g: VoxelGrid, palette: Record<string, PaletteEntry>, vpt: number, base: number): Ground {
  if (base <= 0) return bodyGround(g, palette, vpt);
  const hole = holesOf(g, palette, base);
  const withCellar = hole && bodyGround(g, palette, vpt, base, hole);
  if (withCellar?.cellar) return withCellar;
  const without = bodyGround(g, palette, vpt, base);
  return { floor: without.floor, block: without.block, levels: without.levels };
}

/** The floor of a voxel column nearest to a height (voxels): the one a body at that height stands on (T53b). */
export function levelAt(levels: Levels, i: number, at: number): number {
  const { start, z } = levels;
  let best = start[i];
  for (let l = start[i] + 1; l < start[i + 1]; l++) if (Math.abs(z[l] - at) < Math.abs(z[best] - at)) best = l;
  return best;
}

/**
 * Whether a body whose box covers a rectangle of the model's own frame (tiles from its centre) and whose feet are
 * at height `at` (voxels above the model's base) is blocked: under it, the floor of a column nearest to its feet
 * is one where it cannot stand, or two neighbouring columns have floors more than a step apart (the edge of a
 * landing, of a stairwell, of a table). Columns outside the model are its ground (floor 0).
 */
export function rampBlocks(f: Form, ground: Ground, x0: number, z0: number, x1: number, z1: number, at = 0): boolean {
  const g = f.result!.grid;
  const vx0 = Math.max(-1, Math.floor(x0 * f.vpt + g.X / 2)), vx1 = Math.min(g.X, Math.floor(x1 * f.vpt + g.X / 2));
  const vy0 = Math.max(-1, Math.floor(z0 * f.vpt + g.Y / 2)), vy1 = Math.min(g.Y, Math.floor(z1 * f.vpt + g.Y / 2));
  if (vx1 < 0 || vy1 < 0 || vx0 >= g.X || vy0 >= g.Y) return false;
  const step = stepOf(f.vpt);
  const { levels, hole } = ground;
  const w = vx1 - vx0 + 1;
  // Outside the model, its ground: `base` voxels up its grid (T52b).
  const h = new Float64Array(w * (vy1 - vy0 + 1)).fill(f.base);
  for (let y = vy0; y <= vy1; y++)
    for (let x = vx0; x <= vx1; x++) {
      if (x < 0 || y < 0 || x >= g.X || y >= g.Y) continue;
      const i = x + y * g.X;
      const l = levelAt(levels, i, at);
      if (levels.block[l]) return true;
      // Over the cellar, with no floor near the feet, is air (T52b): one does not walk or land over the stairwell.
      if (hole?.[i] && Math.abs(levels.z[l] - at) > step) return true;
      h[x - vx0 + (y - vy0) * w] = levels.z[l];
    }
  for (let y = 0; y <= vy1 - vy0; y++)
    for (let x = 0; x < w; x++) {
      const v = h[x + y * w];
      if ((x + 1 < w && Math.abs(h[x + 1 + y * w] - v) > step) || (y < vy1 - vy0 && Math.abs(h[x + (y + 1) * w] - v) > step)) return true;
    }
  return false;
}

/**
 * How high a model goes (tiles above its ground) under a rectangle of its own frame (tiles from its centre), for a
 * jump whose feet start `at` voxels above its base and clear `up` voxels: the top of every run of solid that starts
 * below `at + up` (a crate, a wall up to the roof; not the ceiling above, T70), or undefined if none is there (T56b).
 */
export function topUnder(f: Form, levels: Levels, x0: number, z0: number, x1: number, z1: number, at = 0, up = Infinity): number | undefined {
  const g = f.result!.grid;
  const vx0 = Math.max(0, Math.floor(x0 * f.vpt + g.X / 2)), vx1 = Math.min(g.X - 1, Math.floor(x1 * f.vpt + g.X / 2));
  const vy0 = Math.max(0, Math.floor(z0 * f.vpt + g.Y / 2)), vy1 = Math.min(g.Y - 1, Math.floor(z1 * f.vpt + g.Y / 2));
  const { start, z, base } = levels;
  // What is under the ground (a cellar, T52b) is not there for a jump: only what rises above the model's ground.
  let h = f.base;
  for (let y = vy0; y <= vy1; y++)
    for (let x = vx0; x <= vx1; x++) {
      const i = x + y * g.X;
      for (let l = start[i]; l < start[i + 1]; l++) if (base[l] < at + up) h = Math.max(h, z[l]);
    }
  return h > f.base ? (h - f.base) / f.vpt : undefined;
}

/** The most forms the process keeps, and the most memory they may take (ADR-0108): a server lives long, and many universes share it. */
export const FORM_CACHE_ENTRIES = 4096;
export const FORM_CACHE_BYTES = 256 * 1024 * 1024;

/**
 * Everything the result of a program depends on, and nothing else (ADR-0108): the whole text of the program, so two programs
 * are never taken for one, the seed, the box and the tint. The model's id, its density, `rig` and `sway` do not change the voxels; `tempo`
 * only says how long to wait for them, and what did not finish in time is not kept. The head is JSON, so where it ends is not in doubt.
 */
export function formKey(q: FormRequest): string {
  return JSON.stringify([String(q.seed), q.size?.map(String) ?? null, q.tint?.symbol ?? null, q.tint?.color ?? null]) + q.xml;
}

/** Results somewhere slower than memory, under a `formKey`: only the tests have one (`tests/setup/forms-disk.ts`). */
export interface FormBacking {
  read(key: string): FormResult | undefined;
  write(key: string, result: FormResult): void;
}

/** A result nobody can change: every kernel of the process gets this same object. Typed arrays cannot be frozen, their `cells` nobody writes (`instanceGrid` copies). */
function sealed(r: FormResult): FormResult {
  const palette: FormResult['palette'] = {};
  for (const [k, v] of Object.entries(r.palette)) palette[k] = Object.freeze({ ...v });
  const { X, Y, Z, cells, alphabet } = r.grid;
  return Object.freeze({
    grid: Object.freeze({ X, Y, Z, cells, alphabet: Object.freeze([...alphabet]) as string[] }),
    palette: Object.freeze(palette),
    actions: Object.freeze(r.actions.map((a) => Object.freeze({ ...a }))) as FormResult['actions'],
    animations: Object.freeze([...r.animations]) as string[],
  });
}

/**
 * The results of the programs, least recently used out first (ADR-0108). There is no way to empty it: a program written anew has
 * another key, and one kernel must not take away the forms of the others.
 */
export class FormCache {
  private entries = new Map<string, { result: FormResult; weight: number }>();
  /** About how much memory the results and their keys take. */
  bytes = 0;
  backing?: FormBacking;

  constructor(
    readonly maxEntries = FORM_CACHE_ENTRIES,
    readonly maxBytes = FORM_CACHE_BYTES,
  ) {}

  get size(): number {
    return this.entries.size;
  }

  get(key: string): FormResult | undefined {
    const e = this.entries.get(key);
    if (e) {
      this.entries.delete(key);
      this.entries.set(key, e);
      return e.result;
    }
    const stored = this.backing?.read(key);
    return stored && this.keep(key, stored);
  }

  /** Keeps a finished result and gives back the sealed one, the one to hand out. */
  set(key: string, result: FormResult): FormResult {
    const kept = this.keep(key, result);
    this.backing?.write(key, kept);
    return kept;
  }

  private keep(key: string, result: FormResult): FormResult {
    const kept = sealed(result);
    // Characters take at most two bytes; the rest of a result (palette, names) is small, a kilobyte at most for what is seen.
    const weight = kept.grid.cells.length + 2 * key.length + 1024;
    const old = this.entries.get(key);
    if (old) this.bytes -= old.weight;
    this.entries.delete(key);
    // Bigger than the whole cache: it goes to who asked, and would only push out everything else.
    if (weight > this.maxBytes) return kept;
    this.entries.set(key, { result: kept, weight });
    this.bytes += weight;
    for (const [k, e] of this.entries) {
      if (this.entries.size <= this.maxEntries && this.bytes <= this.maxBytes) break;
      this.entries.delete(k);
      this.bytes -= e.weight;
    }
    return kept;
  }
}

/** The cache of this process: every `InlineRunner` that does not say otherwise, so every kernel in Node (ADR-0108). */
export const sharedForms = new FormCache();

/** Runs programs in this thread (Node, tests): no meshes. A program with a seed runs once in a process, for all its kernels. */
export class InlineRunner implements FormRunner {
  constructor(private cache: FormCache = sharedForms) {}

  async run(q: FormRequest): Promise<FormResult> {
    const key = formKey(q);
    const hit = this.cache.get(key);
    if (hit) return hit;
    const { model: _compiled, finished, ...result } = runForm(q);
    // Out of time or of steps it is half a model, and how far it got depends on the machine: it goes to who asked and stops there.
    return finished ? this.cache.set(key, result) : result;
  }
}

/** The pure part of running a form (the browser's worker does the same, then makes meshes). */
export function runForm(q: FormRequest): FormResult & { model: ReturnType<typeof compileMjx>; finished: boolean } {
  if (q.xml.length > MAX_FORM_XML) throw new Mj3Error(`programma troppo lungo (max ${MAX_FORM_XML} caratteri)`);
  const m = compileMjx(q.xml, q.size ? { size: q.size } : {});
  if (q.tint && m.program.palette[q.tint.symbol]) m.program.palette[q.tint.symbol] = { ...m.program.palette[q.tint.symbol], color: q.tint.color };
  const r = runMjx(m, q.seed, { deadline: Math.min(q.tempo ?? MODEL_TIME, MAX_FORM_TIME), limits: FORM_LIMITS });
  const g = r.grid;
  return {
    model: m,
    finished: r.finished,
    grid: { X: g.X, Y: g.Y, Z: g.Z, cells: g.cells, alphabet: g.alphabet },
    palette: m.program.palette,
    actions: m.actions.map((a) => ({ name: a.name, label: a.label })),
    animations: m.animations.map((a) => a.name),
  };
}

export class Forms {
  private forms = new Map<string, Form>();
  private library: Record<string, ModelInfo> = {};
  private files: FileMap = {};
  /** Hash of each program's text: a form is of a program as it is written now. */
  private hashes = new Map<string, number>();
  /** Bumped whenever a form becomes ready (renderers rebuild what used stand-ins). */
  version = 0;
  onReady?: (f: Form) => void;

  constructor(public runner: FormRunner) {}

  /** The universe's files changed: the library is read again; forms of changed programs are dropped. */
  load(files: FileMap): void {
    this.files = files;
    this.hashes.clear();
    try {
      this.library = JSON.parse(files[MODELS_INDEX] ?? '{}');
    } catch {
      this.library = {};
    }
  }

  /** Every model of the library, by id. */
  models(): Record<string, ModelInfo> {
    const out: Record<string, ModelInfo> = {};
    for (const p of Object.keys(this.files)) {
      const m = /^models\/([a-z0-9-]+)\.xml$/i.exec(p);
      if (m) out[m[1]] = this.library[m[1]] ?? { classe: 'oggetto' };
    }
    return out;
  }

  info(id: string): ModelInfo | undefined {
    return this.files[`${MODELS_DIR}${id}.xml`] ? (this.library[id] ?? { classe: 'oggetto' }) : undefined;
  }

  /**
   * The program a thing uses: its own model if the library has it, otherwise the generic model of its
   * class (the seed has one per class), otherwise the generic thing.
   */
  resolve(model: string | undefined, classe?: string): string {
    if (model && this.info(model)) return model;
    const cls = classe && classOf(classe) ? classe : model && classOf(model) ? model : 'oggetto';
    return this.info(cls) ? cls : 'oggetto';
  }

  classOf(model: string): AssetClass {
    return classOf(this.info(model)?.classe) ?? classOf(model) ?? CLASSES.find((c) => c.id === 'oggetto')!;
  }

  /** How many seeds a program has in the world: the few of its class (T64: 4 for shelf file models). */
  seedsOf(model: string): number {
    if (model === 'circuito-3D' || model === 'schermo-struttura' || model === 'schermo-scritte') return 4;
    return SEEDS[this.classOf(model).id] ?? 2;
  }

  /** Preloads forms for a model for the given number of seeds (default: seedsOf(model)). */
  preload(model: string, seeds = this.seedsOf(model), tint?: string): Form[] {
    const out: Form[] = [];
    for (let s = 1; s <= seeds; s++) {
      const f = this.get(model, s, tint);
      if (f) out.push(f);
    }
    return out;
  }

  /** A seed for an instance: stable for who it is, among the few seeds of its kind. */
  seedFor(model: string, who: string): number {
    return 1 + (hashStr(who) % this.seedsOf(model));
  }

  /** What running a program with a seed takes (the site's card pictures run it in a worker of their own). */
  request(model: string, seed: number, tint?: string): FormRequest | undefined {
    const xml = this.files[`${MODELS_DIR}${model}.xml`];
    if (!xml) return undefined;
    const info = this.library[model];
    const cls = this.classOf(model);
    const vpt = vptOf(info);
    return {
      xml,
      seed,
      size: sizeFor(xml, cls, info?.taglia, sottoOf(info) * vpt),
      tint: info?.tinta && tint ? { symbol: info.tinta, color: tint } : undefined,
      rig: cls.animation === 'camminata',
      sway: cls.animation === 'vento',
      vpt,
      model,
      ...(info?.tempo ? { tempo: info.tempo } : {}),
    };
  }

  /** The form of a program with a seed, if ready; starts running it otherwise. */
  get(model: string, seed: number, tint?: string): Form | undefined {
    const xml = this.files[`${MODELS_DIR}${model}.xml`];
    if (!xml) return undefined;
    const info = this.library[model];
    let h = this.hashes.get(model);
    if (h === undefined) this.hashes.set(model, (h = hashStr(xml)));
    const key = `${model}#${seed}#${info?.tinta && tint ? tint : ''}#${h}`;
    let f = this.forms.get(key);
    if (f) return f;
    // Asked at every frame: only what is not there yet costs a request.
    const req = this.request(model, seed, tint)!;
    const cls = this.classOf(model);
    const vpt = req.vpt;
    const under = sottoOf(info) * vpt;
    f = { key, model, seed, status: 'pending', cls, reach: 0, vpt, base: 0 };
    this.forms.set(key, f);
    const form = f;
    void this.runner
      .run(req)
      .then((result) => {
        form.result = result;
        // Under the ground (T52b): its lowest voxels, if the grid has room for them and for something above.
        const base = under < result.grid.Z ? under : 0;
        form.base = base;
        form.foot = bodyFoot(result.grid, result.palette, vpt, base);
        Object.assign(form, groundOfForm(result.grid, result.palette, vpt, base));
        form.reach = Math.hypot(result.grid.X, result.grid.Y) / 2 / vpt;
        form.status = 'ready';
        this.version++;
        this.onReady?.(form);
      })
      .catch((e: Error) => {
        form.status = 'failed';
        form.error = e.message;
      });
    return f;
  }

  ready(model: string, seed: number, tint?: string): Form | undefined {
    const f = this.get(model, seed, tint);
    return f?.status === 'ready' ? f : undefined;
  }

  /** Waits for a form (tests, the Sculptor's checks). */
  async wait(model: string, seed: number, tint?: string): Promise<Form | undefined> {
    for (let i = 0; i < 400; i++) {
      const f = this.get(model, seed, tint);
      if (!f || f.status === 'failed') return f;
      if (f.status === 'ready') return f;
      await new Promise((r) => setTimeout(r, 5));
    }
    return this.get(model, seed, tint);
  }

  /** The program of a model, compiled (for actions). */
  compiled(model: string) {
    const xml = this.files[`${MODELS_DIR}${model}.xml`];
    if (!xml) return undefined;
    const info = this.library[model];
    const size = sizeFor(xml, this.classOf(model), info?.taglia, sottoOf(info) * vptOf(info));
    return compileMjx(xml, size ? { size } : {});
  }
}

/** A copy of a form's grid with the actions done on an instance replayed on it. */
export function instanceGrid(forms: Forms, f: Form, done: string[]): VoxelGrid & { log: number[]; epoch: number } {
  const g = f.result!.grid;
  const grid = { ...g, cells: new Uint8Array(g.cells), alphabet: [...g.alphabet], log: [] as number[], epoch: 0 };
  if (!done.length) return grid;
  const m = forms.compiled(f.model);
  for (const name of done) {
    const clip = m?.actions.find((a) => a.name === name);
    if (clip) act(grid, clip, f.seed);
  }
  return grid;
}

/** Whether a point (tile units, relative to the instance's centre, already turned into its frame) is blocked. */
export function footBlocks(f: Form, foot: Uint8Array, lx: number, lz: number): boolean {
  const g = f.result!.grid;
  const vx = Math.floor(lx * f.vpt + g.X / 2), vy = Math.floor(lz * f.vpt + g.Y / 2);
  return vx >= 0 && vy >= 0 && vx < g.X && vy < g.Y && !!foot[vx + vy * g.X];
}

/** World offset → the model's own frame (the inverse of turning it by yaw about the vertical). */
export function toLocal(dx: number, dz: number, yaw: number): [number, number] {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return [dx * c - dz * s, dx * s + dz * c];
}

