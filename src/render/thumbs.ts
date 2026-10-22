// Icons are photographs of the models: a small renderer of its own takes each item's model in 3/4, on a
// transparent background, once (in cache). Nothing is painted.

import * as THREE from 'three';
import type { Kernel } from '../kernel/kernel';
import { geoOf } from './models';

const PX = 96;

export class Thumbs {
  private gl?: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.01, 50);
  private cache = new Map<string, Promise<string | undefined>>();
  private material = new THREE.MeshLambertMaterial({ vertexColors: true });

  constructor(private k: Kernel) {
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x6a5a4a, 1.6));
    const sun = new THREE.DirectionalLight(0xfff2e0, 1.8);
    sun.position.set(-2, 4, 3);
    this.scene.add(sun);
  }

  private renderer(): THREE.WebGLRenderer {
    if (!this.gl) {
      this.gl = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
      this.gl.setSize(PX, PX, false);
      this.gl.setClearColor(0x000000, 0);
    }
    return this.gl;
  }

  /** A data URL of the item's model, or undefined if it has none yet (the glyph stays). */
  icon(item: string): Promise<string | undefined> {
    const look = this.k.itemLook(item);
    return this.model(look.model, look.tint, look.seed);
  }

  /** A data URL of a model of the library (the gallery's frames). */
  model(model: string, tint?: string, seed = 1): Promise<string | undefined> {
    const look = { model, tint, seed };
    const key = `${look.model}#${look.seed}#${look.tint ?? ''}`;
    let p = this.cache.get(key);
    if (!p) {
      p = this.k.forms.wait(look.model, look.seed, look.tint).then((f) => {
        const geo = f?.status === 'ready' ? geoOf(f) : undefined;
        if (!geo) {
          this.cache.delete(key);
          return undefined;
        }
        return this.shoot(geo.body);
      });
      this.cache.set(key, p);
    }
    return p;
  }

  private shoot(geo: THREE.BufferGeometry): string {
    const mesh = new THREE.Mesh(geo, this.material);
    this.scene.add(mesh);
    geo.computeBoundingSphere();
    const s = geo.boundingSphere!;
    // Three quarters from the front-right, from above, framed on the model.
    const d = s.radius * 3.6;
    this.camera.position.set(s.center.x + d * 0.45, s.center.y + d * 0.6, s.center.z + d * 0.75);
    this.camera.lookAt(s.center);
    const gl = this.renderer();
    gl.render(this.scene, this.camera);
    this.scene.remove(mesh);
    return gl.domElement.toDataURL('image/png');
  }
}
