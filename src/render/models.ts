// From forms to three.js: the geometries of a model (made once per form and shared by its instances),
// and an object for an instance — the body, the limbs on pivots at their joints, the frames of its
// animation. Vegetation bends in the wind (the `sway` weights of its vertices).

import * as THREE from 'three';
import type { Kernel } from '../kernel/kernel';
import { instanceGrid, type Form, type FormComp } from '../kernel/forms';
import { handsOf, type Hand } from '../mj/hold';
import { meshVoxels, stageGrid, type MeshData } from '../mj/mesh';
import { casts, MAT } from './materials';
import type { Limb } from './entities';
import type { FormMeshes } from './worker';

export function geometry(m: MeshData): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(m.positions, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(m.normals, 3));
  g.setAttribute('color', new THREE.BufferAttribute(m.colors, 3));
  if (m.sway) g.setAttribute('sway', new THREE.BufferAttribute(m.sway, 1));
  if (m.glow) g.setAttribute('glow', new THREE.BufferAttribute(m.glow, 1));
  if (m.alpha) g.setAttribute('alpha', new THREE.BufferAttribute(m.alpha, 1));
  if (m.part) g.setAttribute('part', new THREE.BufferAttribute(m.part, 1));
  g.setIndex(new THREE.BufferAttribute(m.indices, 1));
  if (m.opaqueCount !== undefined) {
    if (m.opaqueCount > 0) g.addGroup(0, m.opaqueCount, 0);
    const transCount = m.indices.length - m.opaqueCount;
    if (transCount > 0) g.addGroup(m.opaqueCount, transCount, 1);
  }
  // Not here: three does it for what it is about to draw, and of the frames of an animated building one shows at a time (T215).
  return g;
}

export interface ModelGeo {
  body: THREE.BufferGeometry;
  limbs: Array<{ part: Limb['part']; joint: [number, number, number]; phase: number; geo: THREE.BufferGeometry }>;
  frames: THREE.BufferGeometry[];
  sway: boolean;
}

/**
 * The most the geometries that nothing draws may take, in bytes of arrays, and how long one must have gone unasked before it may go (ADR-0108). Whoever
 * looks at a model at every frame (the terrains' models, the campus) keeps it: taking it away would only have it asked for again.
 */
export const GEOMETRY_BYTES = 128 * 1024 * 1024;
const GEOMETRY_IDLE_MS = 30_000;

const cache = new Map<string, { geo: ModelGeo; bytes: number; used: number }>();
/** Every geometry made here: shared by instances, and only `trimGeometries` frees it. */
const shared = new WeakSet<THREE.BufferGeometry>();
export const isSharedGeometry = (g: THREE.BufferGeometry): boolean => shared.has(g);
const clock = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

const geometries = (g: ModelGeo) => [g.body, ...g.limbs.map((l) => l.geo), ...g.frames];
const geometryBytes = (g: THREE.BufferGeometry) => Object.values(g.attributes).reduce((n, a) => n + ((a as THREE.BufferAttribute).array?.byteLength ?? 0), g.index?.array.byteLength ?? 0);

/**
 * The shared geometries of a ready form (undefined if the runner made no meshes, as in tests, or if it let go of them: then they are
 * asked for again and the model arrives like one that was not ready, ADR-0108).
 */
export function geoOf(f: Form): ModelGeo | undefined {
  const hit = cache.get(f.key);
  if (hit) {
    hit.used = clock();
    return hit.geo;
  }
  const m = f.result?.meshes as FormMeshes | undefined;
  if (!m) {
    // The geometry at once, on arrival: it has its own hold on the arrays, and the next form to arrive may push these out of the runner before anyone looks.
    if (f.result?.meshesGone) f.remake?.(() => void geoOf(f));
    return undefined;
  }
  const g: ModelGeo = { body: geometry(m.body), limbs: m.limbs.map((l) => ({ part: l.part, joint: l.joint, phase: l.phase, geo: geometry(l.mesh) })), frames: m.frames.map(geometry), sway: !!m.body.sway };
  for (const b of geometries(g)) shared.add(b);
  cache.set(f.key, { geo: g, bytes: geometries(g).reduce((n, b) => n + geometryBytes(b), 0), used: clock() });
  return g;
}

/** For who asks once and does not come back at the next frame (an icon): waits while the meshes are on their way. */
export async function geoWhenReady(f: Form): Promise<ModelGeo | undefined> {
  for (let i = 0; i < 400; i++) {
    const g = geoOf(f);
    if (g || !f.result?.meshesGone || f.status !== 'ready') return g;
    await new Promise((r) => setTimeout(r, 25));
  }
  return undefined;
}

/**
 * Lets go of the geometries that nothing has drawn or asked for lately, the oldest first, down to the limit. What hangs from `scene` stays: a world on
 * screen cannot weigh less than it weighs, so the limit is on what is left over. Freeing a geometry someone still holds does no harm: three uploads it again.
 */
export function trimGeometries(scene: THREE.Object3D, now = clock(), limit = GEOMETRY_BYTES): void {
  const drawn = new Set<unknown>();
  scene.traverse((o) => drawn.add((o as THREE.Mesh).geometry));
  const spare = [...cache].filter(([, e]) => !geometries(e.geo).some((g) => drawn.has(g)));
  let bytes = spare.reduce((n, [, e]) => n + e.bytes, 0);
  for (const [key, e] of spare.sort((a, b) => a[1].used - b[1].used)) {
    if (bytes <= limit) break;
    if (now - e.used < GEOMETRY_IDLE_MS) continue;
    cache.delete(key);
    for (const g of geometries(e.geo)) g.dispose();
    bytes -= e.bytes;
  }
}

/** Geometries kept, and what they take. */
export function geometryCount(): { count: number; bytes: number } {
  let bytes = 0;
  for (const e of cache.values()) bytes += e.bytes;
  return { count: cache.size, bytes };
}

/** Instances whose model was changed by an action (an open door) have a body of their own. */
const changed = new Map<string, THREE.BufferGeometry>();
export function changedBody(k: Kernel, f: Form, done: string[]): THREE.BufferGeometry {
  const key = `${f.key}|${done.join(',')}`;
  let g = changed.get(key);
  if (!g) {
    const grid = instanceGrid(k.forms, f, done);
    changed.set(key, (g = geometry(meshVoxels(grid, f.result!.palette, { vpt: f.vpt }))));
    shared.add(g);
  }
  return g;
}

/**
 * What a mesh of `geo` draws with. A geometry with translucent voxels has one group for the opaque and one for the glass
 * (`opaqueCount` of mesh.ts): given one material alone, three draws both with it, and the glass comes out solid (T217).
 * Every mesh of a model's geometry goes through here.
 */
export function modelMaterials(geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Material | THREE.Material[] {
  if (geo.groups.length === 0) return mat;
  return [mat, mat === MAT.cut ? MAT.cutGlass : mat === MAT.corona || mat === MAT.coronaSway ? MAT.coronaGlass : MAT.glass];
}

/** The hands of a figure's form (T288): read once from its grid, as many as the arms of its rig. */
const hands = new Map<string, Hand[]>();
function handsFor(f: Form): Hand[] {
  let h = hands.get(f.key);
  if (!h) hands.set(f.key, (h = f.result ? handsOf(f.result.grid, f.result.palette, f.vpt) : []));
  return h;
}

/** The hand of a limb of the worker's (an arm), found by its joint: the same rig on the same grid puts it in the same place. */
const handAt = (list: Hand[], joint: [number, number, number]) => list.find((h) => Math.abs(h.joint[0] - joint[0]) + Math.abs(h.joint[1] - joint[1]) + Math.abs(h.joint[2] - joint[2]) < 1e-6);

export interface ModelObject {
  root: THREE.Group;
  body: THREE.Object3D;
  limbs: Limb[];
  frames: THREE.Mesh[];
}

/** A building under way (T245e, ADR-0148): the finished grid as its stage shows it, with the site of the kernel around it. */
const staged = new Map<string, THREE.BufferGeometry>();
export function stagedBody(k: Kernel, f: Form, done: string[], stadio: number): THREE.BufferGeometry {
  const key = `${f.key}|${done.join(',')}|${stadio}`;
  let g = staged.get(key);
  if (!g) {
    const grid = done.length ? instanceGrid(k.forms, f, done) : f.result!.grid;
    const s = stageGrid(grid, f.result!.palette, stadio, { base: f.base, vpt: f.vpt, site: true });
    staged.set(key, (g = geometry(meshVoxels(s.grid, s.palette, { vpt: f.vpt }))));
    shared.add(g);
  }
  return g;
}

/** An object for one instance of a form. `material` overrides the world's (the wanderer is never clipped). `stadio` < 1: a building under way. */
export function modelObject(k: Kernel, f: Form, fc: FormComp | undefined, material?: THREE.Material, stadio?: number): ModelObject | undefined {
  const g = geoOf(f);
  if (!g) return undefined;
  const mat = material ?? (g.sway ? MAT.sway : MAT.world);
  const mesh = (geo: THREE.BufferGeometry) => casts(new THREE.Mesh(geo, modelMaterials(geo, mat)), true);
  const root = new THREE.Group();
  const rising = typeof stadio === 'number' && Number.isFinite(stadio) && stadio < 1;
  const bodyMesh = mesh(rising ? stagedBody(k, f, fc?.done ?? [], stadio) : fc?.done?.length ? changedBody(k, f, fc.done) : g.body);
  const body = new THREE.Group();
  body.add(bodyMesh);
  root.add(body);
  const limbs: Limb[] = rising ? [] : g.limbs.map((l) => {
    const pivot = new THREE.Group();
    pivot.position.set(...l.joint);
    pivot.add(mesh(l.geo));
    body.add(pivot);
    const hand = l.part === 'arm' ? handAt(handsFor(f), l.joint) : undefined;
    return { pivot, part: l.part, phase: l.phase, ...(hand ? { hand } : {}) };
  });
  // An animated model shows one frame at a time instead of its body (the action's body has none).
  const frames = fc?.done?.length || rising ? [] : g.frames.map((geo) => {
    const m = mesh(geo);
    m.visible = false;
    root.add(m);
    return m;
  });
  if (frames.length) bodyMesh.visible = false;
  return { root, body, limbs, frames };
}

/** The frame of an animation to show now (one every 0.15 s). */
export function showFrame(frames: THREE.Mesh[], t: number, offset = 0): void {
  if (!frames.length) return;
  const i = Math.floor(t / 0.15 + offset) % frames.length;
  frames.forEach((f, j) => (f.visible = j === i));
}
