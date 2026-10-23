// Runs a model's MarkovJunior program off the page's thread and turns it into meshes: the body (for a
// figure without its limbs), each limb around its joint, the frames of its first animation.

import { rig } from '../mj/rig';
import { Mj3Error } from '../mj/engine';
import { meshVoxels, type MeshData } from '../mj/mesh';
import { clipFrames } from '../mj/run';
import { runForm, type FormRequest, type FormResult } from '../kernel/forms';

export interface LimbMesh {
  part: 'gamba' | 'braccio' | 'testa' | 'coda';
  /** The joint, in the model's three.js frame (tiles, origin at the centre of the floor). */
  joint: [number, number, number];
  phase: number;
  mesh: MeshData;
}

export interface FormMeshes {
  body: MeshData;
  limbs: LimbMesh[];
  /** Frames of the first animation (fire, smoke), each a whole mesh. */
  frames: MeshData[];
}

export type WorkerAnswer = { id: number; ok: true; result: FormResult } | { id: number; ok: false; error: string };

const buffers = (m: MeshData) => [m.positions.buffer, m.normals.buffer, m.colors.buffer, m.indices.buffer, ...(m.sway ? [m.sway.buffer] : []), ...(m.glow ? [m.glow.buffer] : [])];

self.onmessage = (ev: MessageEvent<{ id: number; req: FormRequest }>) => {
  const { id, req } = ev.data;
  try {
    const r = runForm(req);
    const g = r.grid;
    const pal = r.palette;
    const mesh = (grid: typeof g, only?: (i: number) => boolean, pivot?: [number, number, number]) => meshVoxels(grid, pal, { vpt: req.vpt, sway: req.sway, ...(only ? { only } : {}), ...(pivot ? { pivot } : {}) });
    const limbs: LimbMesh[] = [];
    let body: MeshData;
    const grid3 = { ...g, log: [] as number[], epoch: 0 };
    if (req.rig) {
      const rg = rig(grid3, pal);
      const moving = new Set<number>();
      for (const l of rg.limbs) for (const c of l.cells) moving.add(c);
      body = mesh(g, (i) => !moving.has(i));
      const s = 1 / req.vpt;
      for (const l of rg.limbs) {
        const set = new Set(l.cells);
        const [jx, jy, jz] = l.joint;
        limbs.push({ part: l.part, phase: l.phase, joint: [(jx + 0.5 - g.X / 2) * s, (jz + 0.5) * s, (jy + 0.5 - g.Y / 2) * s], mesh: mesh(g, (i) => set.has(i), [jx + 0.5, jy + 0.5, jz + 0.5]) });
      }
    } else body = mesh(g);
    const clip = r.model.animations[0];
    const frames = clip ? clipFrames(grid3, clip, req.seed).map((f) => mesh(f)) : [];
    const meshes: FormMeshes = { body, limbs, frames };
    const result: FormResult = { grid: { X: g.X, Y: g.Y, Z: g.Z, cells: g.cells, alphabet: g.alphabet }, palette: pal, actions: r.actions, animations: r.animations, meshes };
    const transfer = [...buffers(body), ...limbs.flatMap((l) => buffers(l.mesh)), ...frames.flatMap(buffers)];
    (self as unknown as Worker).postMessage({ id, ok: true, result } satisfies WorkerAnswer, transfer);
  } catch (e) {
    const msg = e instanceof Mj3Error ? e.message : `errore: ${(e as Error).message}`;
    (self as unknown as Worker).postMessage({ id, ok: false, error: msg } satisfies WorkerAnswer);
  }
};
