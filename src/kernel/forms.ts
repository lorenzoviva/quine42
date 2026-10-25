// Every thing's look is a MarkovJunior program (ADR-0041): the universe keeps a library of programs
// (`models/<id>.xml`, described in `models/index.json`: class, name, who wrote it), one per kind of thing;
// an instance is the same program with another seed. Running a program gives a *form*: the voxel grid,
// where it blocks a body (its footprint), what one stands on (its floors), its actions and animations.
//
// The kernel never draws: it asks a FormRunner for forms (in Node it runs them itself, in the browser a
// pool of workers runs them and also makes the meshes the renderer draws) and uses them for collision
// and for actions. A form that is not ready yet is simply not there: the thing blocks by its radius.

import { boxOf, classOf, CLASSES, type AssetClass } from '../mj/classes';
import type { PaletteEntry, Vec3 } from '../mj/engine';
import { floors, footprint, type VoxelGrid } from '../mj/mesh';
import { compileMjx } from '../mj/model';
import { act, runMjx } from '../mj/run';
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

export interface ModelInfo {
  /** Asset class (src/mj/classes.ts): its box and how it moves. */
  classe: string;
  nome?: string;
  /** Who wrote it: "a mano", "scultore", the Gemini model… */
  autore?: string;
  /** The Artist's vote (0-10), if it was judged. */
  voto?: number;
  /** A letter of the program that takes the colour of the thing (generic models: one program, many colours). */
  tinta?: string;
  /** Voxels per tile, if not the usual 20 (ADR-0049): big models are written coarser. */
  vpt?: number;
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
}

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
  /** Per voxel column: the height (voxels) of a floor or step one stands on. */
  floor?: Uint8Array;
  cls: AssetClass;
  /** Half the diagonal of the footprint, in tiles: the reach of its collision. */
  reach: number;
  /** Voxels per tile of this model (ADR-0049). */
  vpt: number;
}

/** How many different seeds a kind of thing has in the world (instances share them: fewer meshes). */
const SEEDS: Record<string, number> = { albero: 3, cespuglio: 3, roccia: 3, sasso: 3, persona: 8, animale: 4, bestia: 4, edificio: 1, grande: 1, monumento: 2 };

/** A step one walks up without noticing (a doorstep, a floor): 0.2 tiles, in voxels of a density. */
const stepOf = (vpt: number) => Math.round(0.2 * vpt);

/**
 * The box a program runs in: its own `size` if it says one (structures decide on a coarse grid and `map`
 * up), otherwise its class's box.
 */
function sizeFor(xml: string, cls: AssetClass): Vec3 | undefined {
  const root = /<(?!!)[a-z]+\b[^>]*>/i.exec(xml)?.[0] ?? '';
  return /\ssize="/.test(root) ? undefined : boxOf(cls);
}

/** Where a body cannot go: voxel columns solid between a step and a head. */
export const bodyFoot = (g: VoxelGrid, palette: Record<string, PaletteEntry>, vpt = VPT) => footprint(g, palette, stepOf(vpt) + 1, Math.ceil(0.7 * vpt));

/** Runs programs in this thread (Node, tests): no meshes. */
export class InlineRunner implements FormRunner {
  async run(q: FormRequest): Promise<FormResult> {
    return runForm(q);
  }
}

/** The pure part of running a form (the browser's worker does the same, then makes meshes). */
export function runForm(q: FormRequest): FormResult & { model: ReturnType<typeof compileMjx> } {
  const m = compileMjx(q.xml, q.size ? { size: q.size } : {});
  if (q.tint && m.program.palette[q.tint.symbol]) m.program.palette[q.tint.symbol] = { ...m.program.palette[q.tint.symbol], color: q.tint.color };
  const r = runMjx(m, q.seed, { deadline: 8_000 });
  const g = r.grid;
  return {
    model: m,
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
      const m = /^models\/([a-z0-9-]+)\.xml$/.exec(p);
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

  /** A seed for an instance: stable for who it is, among the few seeds of its kind. */
  seedFor(model: string, who: string): number {
    const n = SEEDS[this.classOf(model).id] ?? 2;
    return 1 + (hashStr(who) % n);
  }

  /** The form of a program with a seed, if ready; starts running it otherwise. */
  get(model: string, seed: number, tint?: string): Form | undefined {
    const xml = this.files[`${MODELS_DIR}${model}.xml`];
    if (!xml) return undefined;
    const info = this.library[model];
    const tinta = info?.tinta && tint ? { symbol: info.tinta, color: tint } : undefined;
    let h = this.hashes.get(model);
    if (h === undefined) this.hashes.set(model, (h = hashStr(xml)));
    const key = `${model}#${seed}#${tinta?.color ?? ''}#${h}`;
    let f = this.forms.get(key);
    if (f) return f;
    const cls = this.classOf(model);
    const size = sizeFor(xml, cls);
    const vpt = vptOf(info);
    f = { key, model, seed, status: 'pending', cls, reach: 0, vpt };
    this.forms.set(key, f);
    const form = f;
    void this.runner
      .run({ xml, seed, size, tint: tinta, rig: cls.animation === 'camminata', sway: cls.animation === 'vento', vpt })
      .then((result) => {
        form.result = result;
        form.foot = bodyFoot(result.grid, result.palette, vpt);
        form.floor = floors(result.grid, result.palette, stepOf(vpt));
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
    const size = sizeFor(xml, this.classOf(model));
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

