// The cover of the terrains on screen (T545, C1 of docs/design/terreno-ricco.md, ADR-0268): the instances every loaded place scattered in
// its worker (`ChunkArrays.cover`) gathered in one InstancedMesh a form for the whole window, not one a place (the draw calls would double,
// § 2.4 of the study), without shadows (a tuft does not cast one that reads from above, and the shadows' pass would draw every instance
// again), with the trees' swaying material (the wind bends it) and their ink. At most `COVER_CAP` instances: the places nearest the
// wanderer whole, the one that passes the cap thinned, the farther ones bare. Made again only when the places' cover changes (a place made
// again, one loaded or gone) or, when the cap thins, when the wanderer is in another place: never at every frame.

import * as THREE from 'three';
import type { Kernel } from '../kernel/kernel';
import { COVER_CAP, coverBudget, keptOf } from '../kernel/cover';
import { MAT } from './materials';
import { geoOf, modelMaterials } from './models';
import { COVER_STRIDE, type CoverArrays } from './terrainmesh';

/** What the layer reads of a place: where it is and its cover (`TerrainView`). */
export interface CoverPlace {
  key: string;
  cover?: CoverArrays;
}

export class CoverLayer {
  /** In the world's group (carpet coordinates), at the corner of the place it was made from (the origin that moves, T449). */
  readonly group = new THREE.Group();
  private meshes: THREE.InstancedMesh[] = [];
  /** What it was made of: the places' cover arrays, and the wanderer's place when the cap thinned. */
  private made: CoverArrays[] = [];
  private madeAt = '';
  private missing = -1;
  /** Instances drawn, those the cap left out, the forms (one InstancedMesh each), how long it took to make (ms). */
  drawn = 0;
  dropped = 0;
  forms = 0;
  ms = 0;
  /** The cap on the window; the measuring tools may move it. */
  cap = COVER_CAP;

  constructor() {
    this.group.name = 'copertura';
  }

  /** The layer as the places are now: made again only if their cover changed, or the cap thins and the wanderer moved to another place. */
  sync(k: Kernel, places: Iterable<CoverPlace>, here: { x: number; y: number }): void {
    const S = k.config.chunkSize;
    const list: Array<{ cx: number; cy: number; cover: CoverArrays; d: number }> = [];
    for (const p of places) {
      if (!p.cover) continue;
      const [cx, cy] = p.key.split(',').map(Number) as [number, number];
      if (!Number.isFinite(cx) || !Number.isFinite(cy)) continue;
      list.push({ cx, cy, cover: p.cover, d: Math.hypot((cx + 0.5) * S - here.x, (cy + 0.5) * S - here.y) });
    }
    const count = list.reduce((n, p) => n + p.cover.form.length, 0);
    const at = count > this.cap ? `${Math.floor(here.x / S)},${Math.floor(here.y / S)}` : '';
    // A form not ready when it was made (its geometry gone meanwhile): made again when the forms change.
    const missing = this.missing >= 0 ? k.forms.version : -1;
    if (at === this.madeAt && missing === this.missing && list.length === this.made.length && list.every((p, i) => p.cover === this.made[i])) return;
    this.build(k, list, at);
  }

  private build(k: Kernel, list: Array<{ cx: number; cy: number; cover: CoverArrays; d: number }>, at: string): void {
    const t0 = performance.now();
    this.clear();
    const S = k.config.chunkSize;
    this.made = list.map((p) => p.cover);
    this.madeAt = at;
    // The nearest first, whole; what is left of the cap to the next; the farther ones none.
    const order = [...list].sort((a, b) => a.d - b.d);
    const keep = coverBudget(order.map((p) => p.cover.form.length), this.cap);
    const anchor = order[0];
    const ax = anchor ? anchor.cx * S : 0, az = anchor ? anchor.cy * S : 0;
    // The instances by form: their matrices, written straight into the arrays.
    const byForm = new Map<string, { geo: THREE.BufferGeometry; sway: boolean; data: number[] }>();
    let missing = 0, drawn = 0;
    order.forEach((p, n) => {
      const { forms, form, data } = p.cover;
      const count = form.length;
      const dx = p.cx * S - ax, dz = p.cy * S - az;
      const geos = forms.map((key) => {
        const hit = byForm.get(key);
        if (hit) return hit;
        const [model, seed] = key.split('#') as [string, string];
        const f = k.forms.ready(model, Number(seed));
        const g = f && geoOf(f);
        if (!g) return undefined;
        const slot = { geo: g.body, sway: g.sway, data: [] as number[] };
        byForm.set(key, slot);
        return slot;
      });
      for (let i = 0; i < count; i++) {
        if (!keptOf(i, count, keep[n]!)) continue;
        const slot = geos[form[i]!];
        if (!slot) {
          missing++;
          continue;
        }
        const o = i * COVER_STRIDE;
        const x = data[o]! + dx, y = data[o + 1]!, z = data[o + 2]! + dz, yaw = data[o + 3]!, s = data[o + 4]!;
        const c = Math.cos(yaw) * s, sn = Math.sin(yaw) * s;
        // A turn about the vertical and a scale, column by column as three.js keeps a matrix.
        slot.data.push(c, 0, -sn, 0, 0, s, 0, 0, sn, 0, c, 0, x, y, z, 1);
        drawn++;
      }
    });
    for (const { geo, sway, data } of byForm.values()) {
      if (!data.length) continue;
      const im = new THREE.InstancedMesh(geo, modelMaterials(geo, sway ? MAT.sway : MAT.world), data.length / 16);
      (im.instanceMatrix.array as Float32Array).set(data);
      im.instanceMatrix.needsUpdate = true;
      im.castShadow = false;
      im.receiveShadow = true;
      // The geometry is the form's, shared with whoever wears it (models.ts keeps it).
      im.userData.shared = true;
      im.computeBoundingSphere();
      this.group.add(im);
      this.meshes.push(im);
    }
    this.group.position.set(ax, 0, az);
    this.drawn = drawn;
    this.dropped = list.reduce((n, p) => n + p.cover.form.length, 0) - drawn - missing;
    this.forms = this.meshes.length;
    this.missing = missing > 0 ? k.forms.version : -1;
    this.ms = performance.now() - t0;
  }

  /** Takes every mesh away (the files changed, the world closed): the forms' geometries stay theirs. */
  clear(): void {
    for (const m of this.meshes) {
      this.group.remove(m);
      m.dispose();
    }
    this.meshes = [];
    this.made = [];
    this.madeAt = '';
    this.drawn = this.dropped = this.forms = 0;
  }
}
