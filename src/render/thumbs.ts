// Icons are photographs of the models: a small renderer of its own takes each item's model in 3/4, on a
// transparent background, once (in cache). Nothing is painted. In the cartoon (ADR-0093) they have its bands and its ink,
// always in daylight: an icon taken at night would stay dark in the cache.

import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import type { Kernel } from '../kernel/kernel';
import { CARTOON, Ink, PHASES, SHADE, SUN_FROM } from './cartoon';
import { glowing, idsOf, lit, U } from './materials';
import { geoWhenReady } from './models';

const PX = 96;

/**
 * To the canvas: the colours of one drawing, the alpha of another (see `inked`), in the canvas' colour space. The ink around the
 * silhouette falls where the model has no alpha: the empty is black there, so whatever is not black is that line.
 */
const FINAL = {
  uniforms: { tDiffuse: { value: null }, tAlpha: { value: null } },
  vertexShader: 'varying vec2 vUv;\nvoid main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse;
uniform sampler2D tAlpha;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tDiffuse, vUv).rgb;
  gl_FragColor = vec4(c, max(texture2D(tAlpha, vUv).a, step(0.01, max(c.r, max(c.g, c.b)))));
  #include <colorspace_fragment>
}`,
};

export class Thumbs {
  private gl?: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.01, 50);
  private cache = new Map<string, Promise<string | undefined>>();
  private material = glowing(lit({ vertexColors: true }), 'thumb');
  private glass = glowing(lit({ vertexColors: true, transparent: true, depthWrite: false }), 'thumb-glass');
  /** The ink's chain, once the first icon asks for it. */
  private chain?: { ink: Ink; final: ShaderPass; masked: THREE.WebGLRenderTarget; plain: THREE.WebGLRenderTarget; lined: THREE.WebGLRenderTarget };

  constructor(private k: Kernel) {
    if (CARTOON) {
      const day = PHASES.day;
      this.scene.add(new THREE.HemisphereLight(day.sky, day.ground, day.hemiIntensity));
      const sun = new THREE.DirectionalLight(day.sun, day.sunIntensity);
      sun.position.set(...SUN_FROM);
      this.scene.add(sun);
      return;
    }
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
      p = this.k.forms.wait(look.model, look.seed, look.tint).then(async (f) => {
        const geo = f?.status === 'ready' ? await geoWhenReady(f) : undefined;
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
    const mesh = new THREE.Mesh(geo, geo.groups.length > 0 ? [this.material, this.glass] : this.material);
    this.scene.add(mesh);
    geo.computeBoundingSphere();
    const s = geo.boundingSphere!;
    // Three quarters from the front-right, from above, framed on the model.
    const d = s.radius * 3.6;
    this.camera.position.set(s.center.x + d * 0.45, s.center.y + d * 0.6, s.center.z + d * 0.75);
    this.camera.lookAt(s.center);
    const gl = this.renderer();
    if (CARTOON) this.inked(gl, d, s.radius);
    else gl.render(this.scene, this.camera);
    this.scene.remove(mesh);
    return gl.domElement.toDataURL('image/png');
  }

  /**
   * The picture with its ink. The ink knows what gives light from the alpha of the frame, as in the world, and leaves alone what has
   * none. Here the alpha also ends up in the picture, where a glowing voxel must not be a hole and the empty must be: so the scene is drawn
   * twice, once for the ink (the empty opaque, or the silhouette would have no line) and once for the alpha. An icon is taken once: the second drawing costs nothing that shows.
   */
  private inked(gl: THREE.WebGLRenderer, distance: number, radius: number): void {
    const c = (this.chain ??= this.newChain());
    // The depth buffer's precision on what is framed, from a pebble to a palace: the ink reads its jumps.
    this.camera.near = Math.max(0.01, (distance - radius) * 0.8);
    this.camera.far = (distance + radius) * 1.2;
    this.camera.updateProjectionMatrix();
    // Whatever time it is in the world: the renderer sets the tint back at its next frame anyway, this keeps it within the shot.
    const shade = SHADE.value.clone();
    SHADE.value.set(...PHASES.day.shade);
    c.ink.prepare(gl);
    const draw = (target: THREE.WebGLRenderTarget, mask: number) => {
      U.glowMask.value = mask;
      gl.setClearColor(0x000000, mask);
      gl.setRenderTarget(target);
      gl.render(this.scene, this.camera);
    };
    draw(c.masked, 1);
    draw(c.plain, 0);
    c.ink.pass.render(gl, c.lined, c.masked, 0, false);
    c.final.uniforms.tAlpha.value = c.plain.texture;
    c.final.render(gl, c.masked, c.lined, 0, false);
    gl.setRenderTarget(null);
    SHADE.value.copy(shade);
  }

  private newChain(): NonNullable<Thumbs['chain']> {
    const target = (samples: number) => new THREE.WebGLRenderTarget(PX, PX, { type: THREE.HalfFloatType, samples });
    const ink = new Ink(this.scene, this.camera, idsOf);
    ink.setSize(PX, PX, 1);
    const final = new ShaderPass(FINAL);
    final.renderToScreen = true;
    return { ink, final, masked: target(4), plain: target(4), lined: target(0) };
  }
}
