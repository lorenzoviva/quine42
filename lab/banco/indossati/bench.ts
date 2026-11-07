// What the bench of worn things measures (T289, lab/banco/indossati.md), without files: the things from their programs, the
// meshes of a dressed body as the game's worker would make them, the bytes they take, how close a thing sits to the body. The
// script (lab/scripts/indossati.ts) writes the photographs and the tables; the lab page (lab/indossati/) shows the same in 3D.

import { colorTable, meshVoxels, type MeshData } from '../../../src/mj/mesh';
import { formMeshes } from '../../../src/render/formmeshes';
import type { Body } from './body';
import { dress, ITEMS, PAD, padded, splitWorn, type Change, type Dressed, type Item, type ItemId, type Prepared, type WayId } from './ways';

/** The things as the world names them. */
export const ITEM_NAMES: Record<ItemId, string> = { helmet: 'Elmo', cuirass: 'Corazza', cloak: 'Mantello' };

/** The things of the bench from their files: `<id>.xml` (on the ground, with `<worn>`) and `<id>-worn.xml` (way A). */
export function itemsFrom(files: Record<string, string>): Item[] {
  return ITEMS.flatMap((id) => {
    const xml = files[`${id}.xml`];
    if (!xml) return [];
    const s = splitWorn(xml);
    const wornProgram = files[`${id}-worn.xml`];
    return [{ id, name: ITEM_NAMES[id], zone: s.zone ?? (id === 'helmet' ? 'head' : id === 'cuirass' ? 'torso' : 'back'), ground: s.ground, ...(s.worn ? { worn: s.worn } : {}), ...(wornProgram ? { wornProgram } : {}) }];
  });
}

/** Bytes of the arrays of a mesh: what the GPU and the worker's cache hold for it. */
export function meshBytes(m: MeshData): number {
  return [m.positions, m.normals, m.colors, m.indices, m.part, m.glow, m.alpha, m.sway].reduce((n, a) => n + (a?.byteLength ?? 0), 0);
}

export interface FigureMeshes {
  body: MeshData;
  limbs: Array<{ part: string; joint: [number, number, number]; phase: number; mesh: MeshData }>;
  bytes: number;
  ms: number;
}

/**
 * The meshes of a figure as the worker makes them (`formMeshes`, src/render/formmeshes.ts): the rig on the grid, the body without
 * its limbs, each limb round its joint. A dressed body (B, C) is a new figure: its rig, its meshes.
 */
export function figureMeshes(d: Dressed, vpt: number): FigureMeshes {
  const t0 = performance.now();
  // The worker's own function; a dressed body has no animation of its own.
  const run = { grid: d.grid, palette: d.palette, model: { animations: [] } } as unknown as Parameters<typeof formMeshes>[0];
  const m = formMeshes(run, { xml: '', seed: 1, vpt, rig: true });
  const bytes = meshBytes(m.body) + m.limbs.reduce((n, l) => n + meshBytes(l.mesh), 0);
  return { body: m.body, limbs: m.limbs, bytes, ms: performance.now() - t0 };
}

/** The mesh of a thing alone (way A: the worn program's, shared by every wearer). */
export function thingMesh(d: Dressed, vpt: number): { mesh: MeshData; bytes: number; ms: number } {
  const t0 = performance.now();
  const mesh = meshVoxels(d.grid, d.palette, { vpt });
  return { mesh, bytes: meshBytes(mesh), ms: performance.now() - t0 };
}

/**
 * How close the thing sits: for every voxel of a thing (a letter added by a way), its distance in voxels (6-steps) from the body
 * as it was. 0 is a recoloured voxel of the body, 1 a voxel lying on it; more is a thing that stands off the body (a rigid mesh on
 * a body it was not written for).
 */
export function gapOf(d: Dressed, bare: Dressed): { mean: number; max: number; far: number } {
  const g = d.grid;
  const colors = colorTable(g.alphabet, d.palette);
  const was = colorTable(bare.grid.alphabet, bare.palette);
  const bodyCodes = bare.grid.alphabet.length;
  const n = g.cells.length;
  const dist = new Int16Array(n).fill(-1);
  const queue: number[] = [];
  for (let i = 0; i < n; i++)
    if (was[bare.grid.cells[i]]) {
      dist[i] = 0;
      queue.push(i);
    }
  const XY = g.X * g.Y;
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q];
    const x = i % g.X, y = Math.floor(i / g.X) % g.Y, z = Math.floor(i / XY);
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      const nx = x + dx, ny = y + dy, nz = z + dz;
      if (nx < 0 || ny < 0 || nz < 0 || nx >= g.X || ny >= g.Y || nz >= g.Z) continue;
      const j = nx + ny * g.X + nz * XY;
      if (dist[j] >= 0) continue;
      dist[j] = dist[i] + 1;
      queue.push(j);
    }
  }
  let sum = 0, count = 0, max = 0, far = 0;
  for (let i = 0; i < n; i++) {
    if (!colors[g.cells[i]] || g.cells[i] < bodyCodes) continue;
    const v = Math.max(0, dist[i]);
    sum += v;
    count++;
    max = Math.max(max, v);
    if (v >= 3) far++;
  }
  return { mean: count ? sum / count : 0, max, far: count ? far / count : 0 };
}

export interface Measure {
  body: string;
  seed: number;
  way: WayId;
  outfit: ItemId[];
  /** Zones of the body (once per body). */
  bodyMs: number;
  /** The change itself, every thing (A: placing the worn meshes; B: the rules; C: the recolouring). */
  wearMs: number;
  /** The meshes that change (B, C: the dressed figure's; A: none, the worn meshes are made once per thing). */
  meshMs: number;
  /** Bytes of the meshes this wearer adds (B, C: the dressed figure; A: none per wearer). */
  meshBytes: number;
  /** Bytes of the meshes of the bare figure, to compare. */
  bareBytes: number;
  /** Meshes drawn for the figure (body, limbs, and the worn meshes of A). */
  meshes: number;
  added: number;
  recoloured: number;
  overlapped: number;
  gap: { mean: number; max: number; far: number };
  /** B: rules that did not finish in time. */
  unfinished: number;
  changes: Change[];
}

/** One body dressed by one way, measured; `repeat` runs for the times (the median). */
export function measure(name: string, seed: number, base: Dressed, vpt: number, outfit: ItemId[], way: WayId, p: Prepared, repeat = 3): { measure: Measure; dressed: Dressed; body: Body } {
  const runs: Array<ReturnType<typeof dress>> = [];
  for (let k = 0; k < repeat; k++) runs.push(dress(base, vpt, outfit, way, p));
  const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  const last = runs[runs.length - 1];
  const bare = figureMeshes(base, vpt);
  // The worn meshes of A are made once per thing, not per wearer: here only the figures of B and C.
  const meshRuns = way === 'A' ? [] : [0, 1, 2].slice(0, repeat).map(() => figureMeshes(last.dressed, vpt));
  const figure = meshRuns[meshRuns.length - 1];
  return {
    dressed: last.dressed,
    body: last.body,
    measure: {
      body: name,
      seed,
      way,
      outfit,
      bodyMs: median(runs.map((r) => r.bodyMs)),
      wearMs: median(runs.map((r) => r.changes.reduce((s, c) => s + c.ms, 0))),
      meshMs: figure ? median(meshRuns.map((m) => m.ms)) : 0,
      meshBytes: figure ? figure.bytes : 0,
      bareBytes: bare.bytes,
      meshes: way === 'A' ? 1 + bare.limbs.length + last.changes.filter((c) => c.added + c.overlapped > 0).length : 1 + (figure?.limbs.length ?? 0),
      added: last.changes.reduce((s, c) => s + c.added, 0),
      recoloured: last.changes.reduce((s, c) => s + c.recoloured, 0),
      overlapped: last.changes.reduce((s, c) => s + c.overlapped, 0),
      gap: gapOf(last.dressed, padded(base, PAD)),
      unfinished: last.changes.filter((c) => 'finished' in c && !(c as { finished: boolean }).finished).length,
      changes: last.changes,
    },
  };
}
