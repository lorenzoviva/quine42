// The meshes of a form, from the result of its program: the body (for a figure, without its limbs), each limb around its joint,
// the frames of its first animation. The worker makes them off the page's thread; the tests make the same in Node (T288), so
// what the renderer hangs and shares is what the game has. A dressed figure (T290, ADR-0180) is the bare one's rig on the grid of
// what it wears (`dressMeshes`): the same limbs round the same joints, so its hands hold as before.

import type { PaletteEntry } from '../mj/engine';
import { rig, type Limb } from '../mj/rig';
import { meshVoxels, type MeshData, type VoxelGrid } from '../mj/mesh';
import { clipFrames } from '../mj/run';
import { coordsOf, dressBody, type Change, type WornPiece } from '../mj/worn';
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

/**
 * The body without its limbs and each limb round its joint, for a grid and the limbs of its rig (`limbs` undefined: one mesh, no rig).
 * A body stands on the ground: the faces that look down from the floor of its grid are never seen and are left out (T356); a limb keeps
 * them, a foot swings up.
 */
function figureMeshes(g: VoxelGrid, pal: Record<string, PaletteEntry>, vpt: number, sway: boolean | undefined, limbs?: readonly Limb[]): Pick<FormMeshes, 'body' | 'limbs'> {
  const mesh = (only?: (i: number) => boolean, pivot?: [number, number, number]) => meshVoxels(g, pal, { vpt, sway, ...(only ? { only } : { underside: false }), ...(pivot ? { pivot } : {}) });
  if (!limbs) return { body: mesh(), limbs: [] };
  const moving = new Set<number>();
  for (const l of limbs) for (const c of l.cells) moving.add(c);
  const body = mesh((i) => !moving.has(i));
  const s = 1 / vpt;
  const out: LimbMesh[] = limbs.map((l) => {
    const set = new Set(l.cells);
    const [jx, jy, jz] = l.joint;
    return { part: l.part, phase: l.phase, joint: [(jx + 0.5 - g.X / 2) * s, (jz + 0.5) * s, (jy + 0.5 - g.Y / 2) * s], mesh: mesh((i) => set.has(i), [jx + 0.5, jy + 0.5, jz + 0.5]) };
  });
  return { body, limbs: out };
}

export function formMeshes(r: ReturnType<typeof runForm>, req: FormRequest): FormMeshes {
  const g = r.grid;
  const pal = r.palette;
  const grid3 = { ...g, log: [] as number[], epoch: 0 };
  const figure = figureMeshes(g, pal, req.vpt, req.sway, req.rig ? rig(grid3, pal).limbs : undefined);
  const clip = r.model.animations[0];
  const frames = clip ? clipFrames(grid3, clip, req.seed).map((f) => meshVoxels(f, pal, { vpt: req.vpt, sway: req.sway, underside: false })) : [];
  return { ...figure, frames };
}

/**
 * What the worker is asked to dress (T290): the bare figure's grid as the instance has it (its actions done), its palette and density,
 * the things it wears (`WornPiece`: zone, colours, worn program) and the seed of its look (the rules of B draw from it).
 */
export interface DressRequest {
  grid: VoxelGrid;
  palette: Record<string, PaletteEntry>;
  vpt: number;
  pieces: WornPiece[];
  seed: number;
}

/** A dressed figure's meshes (no frames: an animated figure shows its body while it wears something), and how each thing went on. */
export interface DressedMeshes extends FormMeshes {
  changes: Change[];
}

/**
 * The meshes of a figure wearing `pieces`: the bare body's rig, moved into the larger grid of the dressed body, so the limbs are the
 * same voxels round the same joints (what was recoloured on a limb moves with it, what was added stays with the body).
 */
export function dressMeshes(req: DressRequest): DressedMeshes {
  const base = req.grid;
  const limbs = rig({ ...base, log: [], epoch: 0 }, req.palette).limbs;
  const dressed = dressBody({ grid: base, palette: req.palette }, req.pieces, req.seed);
  const p = dressed.pad;
  const X2 = base.X + 2 * p;
  const Y2 = base.Y + 2 * p;
  const shift = (c: number) => {
    const [x, y, z] = coordsOf(base, c);
    return x + p + (y + p) * X2 + z * X2 * Y2;
  };
  const moved: Limb[] = limbs.map((l) => ({ ...l, cells: l.cells.map(shift), joint: [l.joint[0] + p, l.joint[1] + p, l.joint[2]] }));
  return { ...figureMeshes(dressed.grid, dressed.palette, req.vpt, false, moved), frames: [], changes: dressed.changes };
}
