// Runs a model's MarkovJunior program off the page's thread and turns it into meshes: the body (for a
// figure without its limbs), each limb around its joint, the frames of its first animation.

import { rig } from '../mj/rig';
import { Mj3Error } from '../mj/engine';
import { meshVoxels, type MeshData } from '../mj/mesh';
import { clipFrames } from '../mj/run';
import { runForm, type FormRequest, type FormResult } from '../kernel/forms';

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

/** `finished`: the program ended by itself; out of time or of steps it is half a model, not to be kept (ADR-0108). */
export type WorkerAnswer = { id: number; ok: true; result: FormResult; finished: boolean } | { id: number; ok: false; error: string };

/** Where the meshes of a form are in the persistent cache (ADR-0108, T215). */
export interface MeshRead {
  db: string;
  version: number;
  store: string;
  key: string;
}
/** No `meshes`: not there, or the database would not open. Whoever asked reads them itself, and that says which. */
export interface MeshAnswer {
  id: number;
  read: true;
  meshes?: FormMeshes;
}

const buffers = (m: MeshData) => [m.positions.buffer, m.normals.buffer, m.colors.buffer, m.indices.buffer, ...(m.sway ? [m.sway.buffer] : []), ...(m.glow ? [m.glow.buffer] : []), ...(m.alpha ? [m.alpha.buffer] : []), ...(m.part ? [m.part.buffer] : [])];

const meshBuffers = (m: FormMeshes) => [...buffers(m.body), ...m.limbs.flatMap((l) => buffers(l.mesh)), ...m.frames.flatMap(buffers)];

/** One connection for each database; when a page wants a later version it closes, and the next read here opens again or finds nothing. */
const connections = new Map<string, Promise<IDBDatabase | undefined>>();
function connection(read: MeshRead): Promise<IDBDatabase | undefined> {
  const name = `${read.db}#${read.version}`;
  let open = connections.get(name);
  if (!open) {
    open = new Promise((resolve) => {
      const req = indexedDB.open(read.db, read.version);
      // The page has opened it before asking: a version still to make is not this worker's to make.
      req.onupgradeneeded = () => req.transaction?.abort();
      req.onblocked = req.onerror = () => resolve(undefined);
      req.onsuccess = () => {
        req.result.onversionchange = () => {
          req.result.close();
          connections.delete(name);
        };
        resolve(req.result);
      };
    });
    connections.set(name, open);
    void open.then((db) => {
      if (!db) connections.delete(name);
    });
  }
  return open;
}

/** Reading the meshes is most of what arriving at the corona costs, and a value is decoded where it is read: here, not on the page's thread (T215). */
async function readMeshes(read: MeshRead): Promise<FormMeshes | undefined> {
  try {
    const db = await connection(read);
    if (!db) return undefined;
    return await new Promise((resolve) => {
      const tx = db.transaction(read.store, 'readonly');
      tx.onabort = () => resolve(undefined);
      const got = tx.objectStore(read.store).get(read.key);
      got.onsuccess = () => resolve(got.result as FormMeshes | undefined);
      got.onerror = () => resolve(undefined);
    });
  } catch {
    return undefined;
  }
}

self.onmessage = (ev: MessageEvent<{ id: number; req: FormRequest } | { id: number; read: MeshRead }>) => {
  if ('read' in ev.data) {
    const { id, read } = ev.data;
    void readMeshes(read).then((meshes) => (self as unknown as Worker).postMessage({ id, read: true, meshes } satisfies MeshAnswer, meshes ? meshBuffers(meshes) : []));
    return;
  }
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
    (self as unknown as Worker).postMessage({ id, ok: true, result, finished: r.finished } satisfies WorkerAnswer, meshBuffers(meshes));
  } catch (e) {
    const msg = e instanceof Mj3Error ? e.message : `errore: ${(e as Error).message}`;
    (self as unknown as Worker).postMessage({ id, ok: false, error: msg } satisfies WorkerAnswer);
  }
};
