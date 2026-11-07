// The grid as voxels, in three.js: X the time, Z the height, Y the tracks set apart so the planes can be told. Drag to turn, wheel to zoom.

import * as THREE from 'three';
import { makeRenderer } from '../../src/render/gpu';
import type { GridData } from './logic';
import { letterAt } from './logic';

const MAX_VOXELS = 100_000;
const YAW = -0.68;
const PITCH = 0.55;

export interface VoxelStyle {
  color: string;
  hidden: boolean;
  alpha: number;
}

export class VoxelView {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.1, 2000);
  private mesh?: THREE.InstancedMesh;
  private geo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
  private mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  private voxels: Array<{ x: number; color: THREE.Color; at: THREE.Vector3 }> = [];
  private yaw = YAW;
  private pitch = PITCH;
  private dist = 40;
  private span = 40;
  private head = -1;
  private dirty = true;
  /** Voxels left out over the ceiling: the view says so. */
  cut = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = makeRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.scene.background = new THREE.Color(0x07090e);
    this.scene.add(new THREE.HemisphereLight(0xdfe9ff, 0x20242e, 1.5));
    const sun = new THREE.DirectionalLight(0xffffff, 1.8);
    sun.position.set(1, 2, 1.5);
    this.scene.add(sun);
    let last: { x: number; y: number } | undefined;
    canvas.addEventListener('pointerdown', (e) => {
      last = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!last) return;
      this.yaw -= (e.clientX - last.x) * 0.008;
      this.pitch = Math.max(-1.3, Math.min(1.3, this.pitch + (e.clientY - last.y) * 0.008));
      last = { x: e.clientX, y: e.clientY };
      this.dirty = true;
    });
    canvas.addEventListener('pointerup', () => (last = undefined));
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.dist = Math.max(this.span * 0.4, Math.min(this.span * 6, this.dist * (e.deltaY > 0 ? 1.1 : 0.9)));
      this.dirty = true;
    }, { passive: false });
  }

  resetCamera(): void {
    this.yaw = YAW;
    this.pitch = PITCH;
    this.dist = this.span * 2.2;
    this.dirty = true;
  }

  show(g: GridData, style: (letter: string, y: number) => VoxelStyle | undefined, layer: number | undefined, keepCamera: boolean): void {
    const stretch = Math.max(1.8, g.X / 5.5);
    const ox = (g.X - 1) / 2, oy = ((g.Y - 1) * stretch) / 2, oz = (g.Z - 1) / 2;
    this.voxels = [];
    this.cut = 0;
    for (let z = 0; z < g.Z; z++)
      for (let y = 0; y < g.Y; y++) {
        if (layer !== undefined && layer !== y) continue;
        for (let x = 0; x < g.X; x++) {
          const letter = letterAt(g, x, y, z);
          const s = letter === '.' ? undefined : style(letter, y);
          if (!s) continue;
          if (this.voxels.length >= MAX_VOXELS) {
            this.cut++;
            continue;
          }
          // Three's Y is up: the grid's Z. Its Y (the track) goes into the depth.
          this.voxels.push({ x, color: new THREE.Color(s.color).multiplyScalar(s.alpha), at: new THREE.Vector3(x - ox, z - oz, y * stretch - oy) });
        }
      }
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.dispose();
    }
    this.mesh = new THREE.InstancedMesh(this.geo, this.mat, Math.max(1, this.voxels.length));
    this.mesh.count = this.voxels.length;
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
    const span = Math.max(g.X, g.Y * stretch, g.Z, 4);
    if (!keepCamera || span !== this.span) {
      this.span = span;
      this.dist = span * 2.2;
    }
    this.head = -2;
    this.paint(-1);
  }

  /** The step that is sounding stands out. */
  paint(step: number): void {
    if (!this.mesh || step === this.head) return;
    this.head = step;
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    this.voxels.forEach((v, i) => {
      const on = v.x === step;
      const k = on ? 1.15 : 1;
      m.makeScale(k, k, k).setPosition(v.at);
      this.mesh!.setMatrixAt(i, m);
      this.mesh!.setColorAt(i, on ? c.copy(v.color).multiplyScalar(1.7) : v.color);
    });
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    this.dirty = true;
  }

  frame(): void {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    if (this.canvas.width !== Math.floor(w * this.renderer.getPixelRatio()) || this.canvas.height !== Math.floor(h * this.renderer.getPixelRatio())) {
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.dirty = true;
    }
    if (!this.dirty) return;
    this.dirty = false;
    const cp = Math.cos(this.pitch);
    this.camera.position.set(Math.sin(this.yaw) * cp * this.dist, Math.sin(this.pitch) * this.dist, Math.cos(this.yaw) * cp * this.dist);
    this.camera.lookAt(0, 0, 0);
    this.renderer.render(this.scene, this.camera);
  }
}
