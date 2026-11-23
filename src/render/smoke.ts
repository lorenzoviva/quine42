// The smoke of what burns, carried by the wind (T484, ADR-0255). Only drawing: puffs that rise from every entity with `fire` (a flame of
// the effect `fire`, a fire the Council lights) and go the way the world's wind blows at them, as its coarse view says (`Kernel.windView`,
// the same in a mirror). Nothing of it is in the kernel nor on the wire, every client its own; in a world without wind there is none, as
// before. Voxels as the rest of the world: small grey cubes that grow and shrink.

import * as THREE from 'three';
import type { Kernel } from '../kernel/kernel';
import { viewBytes, windInView, type WindView } from '../kernel/wind';
import { clipped } from './materials';

/** How many puffs at most, how often a fire breathes one (seconds), how long one lasts, how fast it rises and how far the wind takes it. */
export const SMOKE = { max: 160, every: 0.3, life: 3.2, rise: 0.55, drift: 0.9, size: [0.12, 0.42] as const } as const;

interface Puff {
  x: number;
  y: number;
  h: number;
  age: number;
  jx: number;
  jy: number;
}

/** Where a puff is after `dt` seconds in a wind (the world's units): up, the way it blows, and a little of its own. */
export function puffStep(p: Puff, dt: number, wind: readonly [number, number]): void {
  p.age += dt;
  p.h += SMOKE.rise * dt;
  // The wind takes it more as it rises out of the lee of what burns.
  const k = SMOKE.drift * Math.min(1, 0.35 + p.age / SMOKE.life);
  p.x += (wind[0] * k + p.jx) * dt;
  p.y += (wind[1] * k + p.jy) * dt;
}

/** How big a puff is at its age: it grows, then thins away. */
export function puffSize(age: number): number {
  const u = Math.max(0, Math.min(1, age / SMOKE.life));
  const [a, b] = SMOKE.size;
  return (a + (b - a) * u) * (u > 0.75 ? (1 - u) / 0.25 : 1);
}

export class Smoke {
  readonly mesh: THREE.InstancedMesh;
  private puffs: Puff[] = [];
  private since = new Map<number, number>();
  private readonly m = new THREE.Matrix4();
  private bytes?: { view: WindView; bytes: Uint8Array };

  constructor(scene: THREE.Object3D) {
    const material = clipped(new THREE.MeshLambertMaterial({ color: 0xd8d8d8, transparent: true, opacity: 0.55, depthWrite: false }), 'smoke');
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, SMOKE.max);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 2;
    scene.add(this.mesh);
  }

  /** One frame: new puffs where something burns, every puff carried on, drawn at the scroll `ox, oy` (world → three). */
  update(k: Kernel, dt: number, offset: { ox: number; oy: number }, shown: boolean): void {
    const view = shown ? k.windView() : undefined;
    if (!view) {
      this.puffs.length = 0;
      this.since.clear();
      this.mesh.count = 0;
      return;
    }
    if (this.bytes?.view !== view) {
      const bytes = viewBytes(view);
      this.bytes = bytes ? { view, bytes } : undefined;
    }
    const step = Math.min(0.1, Math.max(0, dt));
    const seen = new Set<number>();
    for (const id of k.ecs.query('fire')) {
      const pos = k.ecs.get(id, 'pos');
      if (!Number.isFinite(pos?.x) || !Number.isFinite(pos?.y)) continue;
      seen.add(id);
      const t = (this.since.get(id) ?? Math.random() * SMOKE.every) + step;
      if (t >= SMOKE.every && this.puffs.length < SMOKE.max) {
        this.puffs.push({ x: pos.x + (Math.random() - 0.5) * 0.3, y: pos.y + (Math.random() - 0.5) * 0.3, h: k.groundAt(pos.x, pos.y) + 0.7, age: 0, jx: (Math.random() - 0.5) * 0.25, jy: (Math.random() - 0.5) * 0.25 });
        this.since.set(id, t - SMOKE.every);
      } else this.since.set(id, Math.min(t, SMOKE.every));
    }
    for (const id of this.since.keys()) if (!seen.has(id)) this.since.delete(id);
    const b = this.bytes;
    let n = 0;
    for (const p of this.puffs) {
      puffStep(p, step, b ? windInView(b.view, b.bytes, p.x, p.y) : view.p);
      if (p.age >= SMOKE.life) continue;
      this.puffs[n++] = p;
    }
    this.puffs.length = n;
    for (let i = 0; i < n; i++) {
      const p = this.puffs[i]!;
      const s = puffSize(p.age);
      this.m.makeScale(s, s, s).setPosition(p.x - offset.ox, p.h, p.y - offset.oy);
      this.mesh.setMatrixAt(i, this.m);
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
