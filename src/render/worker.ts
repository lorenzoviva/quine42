// Runs a model's MarkovJunior program off the page's thread and turns it into meshes (formmeshes.ts): the body (for a
// figure without its limbs), each limb around its joint, the frames of its first animation. It also dresses a figure (T290,
// ADR-0180): what it wears on its body, by the things' worn rules or the kernel's colours, and the meshes of the dressed body.

import { Mj3Error } from '../mj/engine';
import type { MeshData } from '../mj/mesh';
import { runForm, type FormRequest, type FormResult } from '../kernel/forms';
import { dressMeshes, formMeshes, type DressedMeshes, type DressRequest, type FormMeshes } from './formmeshes';

export type { DressedMeshes, DressRequest, FormMeshes, LimbMesh } from './formmeshes';

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
/** A figure dressed (T290): its meshes, or why not. */
export type DressAnswer = { id: number; dressed: true; ok: true; meshes: DressedMeshes } | { id: number; dressed: true; ok: false; error: string };

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

self.onmessage = (ev: MessageEvent<{ id: number; req: FormRequest } | { id: number; read: MeshRead } | { id: number; dress: DressRequest }>) => {
  if ('dress' in ev.data) {
    const { id, dress } = ev.data;
    try {
      const meshes = dressMeshes(dress);
      (self as unknown as Worker).postMessage({ id, dressed: true, ok: true, meshes } satisfies DressAnswer, meshBuffers(meshes));
    } catch (e) {
      (self as unknown as Worker).postMessage({ id, dressed: true, ok: false, error: e instanceof Error ? e.message : String(e) } satisfies DressAnswer);
    }
    return;
  }
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
    const meshes: FormMeshes = formMeshes(r, req);
    const result: FormResult = { grid: { X: g.X, Y: g.Y, Z: g.Z, cells: g.cells, alphabet: g.alphabet }, palette: pal, actions: r.actions, animations: r.animations, meshes };
    (self as unknown as Worker).postMessage({ id, ok: true, result, finished: r.finished } satisfies WorkerAnswer, meshBuffers(meshes));
  } catch (e) {
    const msg = e instanceof Mj3Error ? e.message : `errore: ${(e as Error).message}`;
    (self as unknown as Worker).postMessage({ id, ok: false, error: msg } satisfies WorkerAnswer);
  }
};
