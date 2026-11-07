// The meshes of a form, from the result of its program: the body (for a figure, without its limbs), each limb around its joint,
// the frames of its first animation. The worker makes them off the page's thread; the tests make the same in Node (T288), so
// what the renderer hangs and shares is what the game has.

import { rig } from '../mj/rig';
import { meshVoxels, type MeshData } from '../mj/mesh';
import { clipFrames } from '../mj/run';
import type { FormRequest, runForm } from '../kernel/forms';

export interface LimbMesh {
  part: 'leg' | 'arm' | 'head' | 'tail';
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

export function formMeshes(r: ReturnType<typeof runForm>, req: FormRequest): FormMeshes {
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
  return { body, limbs, frames };
}
