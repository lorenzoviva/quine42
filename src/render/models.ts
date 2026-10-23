// From forms to three.js: the geometries of a model (made once per form and shared by its instances),
// and an object for an instance — the body, the limbs on pivots at their joints, the frames of its
// animation. Vegetation bends in the wind (the `sway` weights of its vertices).

import * as THREE from 'three';
import type { Kernel } from '../kernel/kernel';
import { instanceGrid, type Form, type FormComp } from '../kernel/forms';
import { meshVoxels, type MeshData } from '../mj/mesh';
import { casts, MAT } from './materials';
import type { Limb } from './things';
import type { FormMeshes } from './worker';

export function geometry(m: MeshData): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(m.positions, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(m.normals, 3));
  g.setAttribute('color', new THREE.BufferAttribute(m.colors, 3));
  if (m.sway) g.setAttribute('sway', new THREE.BufferAttribute(m.sway, 1));
  if (m.glow) g.setAttribute('glow', new THREE.BufferAttribute(m.glow, 1));
  g.setIndex(new THREE.BufferAttribute(m.indices, 1));
  g.computeBoundingSphere();
  return g;
}

export interface ModelGeo {
  body: THREE.BufferGeometry;
  limbs: Array<{ part: Limb['part']; joint: [number, number, number]; phase: number; geo: THREE.BufferGeometry }>;
  frames: THREE.BufferGeometry[];
  sway: boolean;
}

const cache = new Map<string, ModelGeo>();

/** The shared geometries of a ready form (undefined if the runner made no meshes, as in tests). */
export function geoOf(f: Form): ModelGeo | undefined {
  let g = cache.get(f.key);
  if (g) return g;
  const m = f.result?.meshes as FormMeshes | undefined;
  if (!m) return undefined;
  g = { body: geometry(m.body), limbs: m.limbs.map((l) => ({ part: l.part, joint: l.joint, phase: l.phase, geo: geometry(l.mesh) })), frames: m.frames.map(geometry), sway: !!m.body.sway };
  cache.set(f.key, g);
  return g;
}

/** Instances whose model was changed by an action (an open door) have a body of their own. */
const changed = new Map<string, THREE.BufferGeometry>();
export function changedBody(k: Kernel, f: Form, done: string[]): THREE.BufferGeometry {
  const key = `${f.key}|${done.join(',')}`;
  let g = changed.get(key);
  if (!g) {
    const grid = instanceGrid(k.forms, f, done);
    changed.set(key, (g = geometry(meshVoxels(grid, f.result!.palette, { vpt: f.vpt }))));
  }
  return g;
}

export interface ModelObject {
  root: THREE.Group;
  body: THREE.Object3D;
  limbs: Limb[];
  frames: THREE.Mesh[];
}

/** An object for one instance of a form. `material` overrides the world's (the wanderer is never clipped). */
export function modelObject(k: Kernel, f: Form, fc: FormComp | undefined, material?: THREE.Material): ModelObject | undefined {
  const g = geoOf(f);
  if (!g) return undefined;
  const mat = material ?? (g.sway ? MAT.sway : MAT.world);
  const mesh = (geo: THREE.BufferGeometry) => {
    return casts(new THREE.Mesh(geo, mat), true);
  };
  const root = new THREE.Group();
  const bodyMesh = mesh(fc?.done?.length ? changedBody(k, f, fc.done) : g.body);
  const body = new THREE.Group();
  body.add(bodyMesh);
  root.add(body);
  const limbs: Limb[] = g.limbs.map((l) => {
    const pivot = new THREE.Group();
    pivot.position.set(...l.joint);
    pivot.add(mesh(l.geo));
    body.add(pivot);
    return { pivot, part: l.part, phase: l.phase };
  });
  // An animated model shows one frame at a time instead of its body (the action's body has none).
  const frames = fc?.done?.length ? [] : g.frames.map((geo) => {
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
