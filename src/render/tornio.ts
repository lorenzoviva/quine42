// The Sculptor's lathe in 3D (T48a):
// In the Artist's gallery, a pedestal turntable on the ground floor rotating with the selected model.
// Its MarkovJunior program executes step-by-step (intermediate snapshots from src/mj/run.ts rendered
// as voxel meshes). «<» and «>» arrows step through the universe models library.

import * as THREE from 'three';
import { vptOf } from '../kernel/forms';
import type { VoxelGrid } from '../mj/mesh';
import type { StudioItem } from '../kernel/corona';
import type { TornioShown } from '../kernel/tornio';
import { arrowSign, textPlane } from './corona3d';
import { geometry } from './models';
import { meshVoxels } from '../mj/mesh';
import { MAT } from './materials';

/** Total duration of one building animation cycle in seconds. */
const CYCLE_DURATION = 5.0;
/** Portion of the cycle spent building up through snapshots before holding the final model. */
const BUILD_DURATION = 3.6;

export class TornioView {
  readonly group = new THREE.Group();
  private turntable: THREE.Group;
  private meshes: THREE.Mesh[] = [];
  private discMesh?: THREE.Mesh;
  private rimMesh?: THREE.Mesh;
  private labelMesh?: THREE.Mesh;

  constructor(
    it: StudioItem,
    readonly shown: TornioShown,
    private color: string,
    prev?: StudioItem,
    next?: StudioItem,
  ) {
    const w = it.w ?? 3, d = it.h ?? 3;
    const cx = it.x + w / 2;
    const cz = it.y + d / 2;
    const topY = 0.46;

    // Turntable rotating group placed on top of the plinth
    this.turntable = new THREE.Group();
    this.turntable.position.set(cx, topY, cz);
    this.group.add(this.turntable);

    // Dark metallic turntable disc with glowing neon rim in Artist's magenta/pink
    const discGeo = new THREE.CylinderGeometry(0.9, 0.95, 0.04, 32);
    const discMat = new THREE.MeshStandardMaterial({
      color: '#151722',
      roughness: 0.35,
      metalness: 0.65,
    });
    this.discMesh = new THREE.Mesh(discGeo, discMat);
    this.discMesh.position.set(0, 0.02, 0);

    const rimGeo = new THREE.TorusGeometry(0.88, 0.015, 8, 32);
    const rimMat = new THREE.MeshBasicMaterial({ color: this.color });
    this.rimMesh = new THREE.Mesh(rimGeo, rimMat);
    this.rimMesh.rotation.x = Math.PI / 2;
    this.rimMesh.position.set(0, 0.04, 0);

    this.turntable.add(this.discMesh, this.rimMesh);

    // Voxels per tile for this model
    const vpt = vptOf(shown.entry.info);

    // Build intermediate snapshot meshes
    for (const snap of shown.snapshots) {
      const voxelGrid: VoxelGrid = {
        X: snap.X,
        Y: snap.Y,
        Z: snap.Z,
        cells: snap.cells,
        alphabet: shown.grid.alphabet,
      };
      const meshData = meshVoxels(voxelGrid, shown.palette, { vpt });
      const geo = geometry(meshData);
      const mesh = new THREE.Mesh(geo, MAT.corona);

      // The mesh is already centered at floor level (X/2, Y/2, 0)
      mesh.position.set(0, 0.04, 0);
      mesh.visible = false;
      this.turntable.add(mesh);
      this.meshes.push(mesh);
    }

    if (this.meshes.length > 0) {
      this.meshes[0].visible = true;
    }

    // Name and index banner in front of the lathe
    this.labelMesh = textPlane(
      [shown.entry.name, `${shown.index + 1}/${shown.count}`],
      color,
      w - 0.4,
      0.32,
    );
    this.labelMesh.position.set(cx, 0.22, it.y + d - 0.05);
    this.group.add(this.labelMesh);

    // Navigation arrows
    if (prev) this.group.add(arrowSign(prev.x, prev.y, '<', color));
    if (next) this.group.add(arrowSign(next.x, next.y, '>', color));
  }

  /** Rotates the turntable and advances through snapshots of the model's MarkovJunior generation. */
  update(t: number): void {
    // Continuous smooth turntable rotation
    this.turntable.rotation.y = t * 0.75;

    if (!this.meshes.length) return;

    // Snapshot animation loop: step through intermediate states, then hold final model
    const u = ((t % CYCLE_DURATION) + CYCLE_DURATION) % CYCLE_DURATION;
    let targetIdx = this.meshes.length - 1;
    if (u < BUILD_DURATION) {
      targetIdx = Math.min(
        this.meshes.length - 1,
        Math.floor((u / BUILD_DURATION) * this.meshes.length),
      );
    }

    for (let i = 0; i < this.meshes.length; i++) {
      this.meshes[i].visible = i === targetIdx;
    }
  }

  dispose(): void {
    for (const m of this.meshes) {
      m.geometry.dispose();
    }
    this.meshes.length = 0;
    this.discMesh?.geometry.dispose();
    this.rimMesh?.geometry.dispose();
    if (this.labelMesh) {
      this.labelMesh.geometry.dispose();
      (this.labelMesh.material as THREE.Material).dispose();
    }
    this.group.clear();
  }
}
