// Runs a MarkovJunior model and turns it into meshes, off the page's thread: the finished model (for a
// figure, the body and each limb around its joint), the frames of its animations and of its growth.

import { rig } from '../mj3d/animate';
import { Mj3Error, type Grid3, type PaletteEntry, type Part, type Vec3 } from '../mj3d/engine';
import { compileMjx } from '../mjx/model';
import { clipFrames, runMjx } from '../mjx/run';
import { meshVoxels, type MeshData } from './mesh';

export interface BuildRequest {
  id: number;
  xml: string;
  seed: number;
  size?: Vec3;
  steps?: number;
  vpt: number;
  /** Vegetation: per-vertex wind weight. */
  sway?: boolean;
  /** Figures: the limbs as separate meshes. */
  rig?: boolean;
  /** Keep about this many states of the run as meshes (0: none). */
  growth?: number;
}

export interface LimbMesh {
  part: Part;
  /** The joint, in the model's three.js coordinates (tiles, origin at the centre of the floor). */
  joint: [number, number, number];
  phase: number;
  mesh: MeshData;
}

export interface Built {
  id: number;
  ok: true;
  grid: { X: number; Y: number; Z: number; cells: Uint8Array; alphabet: string[] };
  palette: Record<string, PaletteEntry>;
  body: MeshData;
  limbs: LimbMesh[];
  clips: Array<{ name: string; label?: string; frames: MeshData[] }>;
  growth: MeshData[];
  actions: Array<{ name: string; label?: string }>;
  info: { steps: number; ms: number; finished: boolean; unused: string[]; warnings: string[] };
}

export type BuildResponse = Built | { id: number; ok: false; error: string };

const buffers = (m: MeshData) => [m.positions.buffer, m.normals.buffer, m.colors.buffer, m.indices.buffer, ...(m.sway ? [m.sway.buffer] : [])];

self.onmessage = (ev: MessageEvent<BuildRequest>) => {
  const q = ev.data;
  try {
    const m = compileMjx(q.xml, q.size ? { size: q.size } : {});
    const r = runMjx(m, q.seed, { snapshots: q.growth || undefined, deadline: 20_000, ...(q.steps ? { maxSteps: q.steps } : {}) });
    const g: Grid3 = r.grid;
    const pal = m.program.palette;
    const mesh = (grid: { X: number; Y: number; Z: number; cells: Uint8Array; alphabet: string[] }, only?: (i: number) => boolean, pivot?: [number, number, number]) =>
      meshVoxels(grid, pal, { vpt: q.vpt, sway: q.sway, ...(only ? { only } : {}), ...(pivot ? { pivot } : {}) });

    const limbs: LimbMesh[] = [];
    let body: MeshData;
    if (q.rig) {
      const rg = rig(g, pal);
      const moving = new Set<number>();
      for (const l of rg.limbs) for (const c of l.cells) moving.add(c);
      body = mesh(g, (i) => !moving.has(i));
      const s = 1 / q.vpt;
      for (const l of rg.limbs) {
        const set = new Set(l.cells);
        const [jx, jy, jz] = l.joint;
        limbs.push({ part: l.part, phase: l.phase, joint: [(jx + 0.5 - g.X / 2) * s, (jz + 0.5) * s, (jy + 0.5 - g.Y / 2) * s], mesh: mesh(g, (i) => set.has(i), [jx + 0.5, jy + 0.5, jz + 0.5]) });
      }
    } else body = mesh(g);

    const clips = m.animations.map((c) => ({ name: c.name, label: c.label, frames: clipFrames(g, c, q.seed).map((f) => mesh(f)) }));
    const growth = (r.snapshots ?? []).filter((s) => s.X === g.X && s.Y === g.Y && s.Z === g.Z).map((s) => mesh({ ...s, alphabet: g.alphabet }));
    const res: Built = {
      id: q.id,
      ok: true,
      grid: { X: g.X, Y: g.Y, Z: g.Z, cells: g.cells, alphabet: g.alphabet },
      palette: pal,
      body,
      limbs,
      clips,
      growth,
      actions: m.actions.map((a) => ({ name: a.name, label: a.label })),
      info: { steps: r.steps, ms: r.ms, finished: r.finished, unused: r.unused ?? [], warnings: m.warnings },
    };
    const transfer = [g.cells.buffer, ...buffers(body), ...limbs.flatMap((l) => buffers(l.mesh)), ...clips.flatMap((c) => c.frames.flatMap(buffers)), ...growth.flatMap(buffers)];
    (self as unknown as Worker).postMessage(res, transfer);
  } catch (e) {
    const msg = e instanceof Mj3Error ? e.message : `errore: ${(e as Error).message}`;
    (self as unknown as Worker).postMessage({ id: q.id, ok: false, error: msg } satisfies BuildResponse);
  }
};
