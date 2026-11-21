// A light bloom around glowing voxels (ADR-0046). The scene is drawn into a target with alpha; the
// materials that know the `glow` attribute write alpha = 1 - glow there (U.glowMask), so the bloom takes
// only what glows — not a white wall in the sun — and blurs it over the frame. The canvas has no alpha,
// so the mask never shows.

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { CARTOON, Ink } from './cartoon';
import { idsOf, U } from './materials';

/** In place of the bloom's luminosity threshold: the glow marked in alpha. */
const GLOW_PASS = `uniform sampler2D tDiffuse;
varying vec2 vUv;
void main() {
  vec4 t = texture2D(tDiffuse, vUv);
  gl_FragColor = vec4(t.rgb * clamp(1.0 - t.a, 0.0, 1.0), 1.0);
}`;

export class Bloom {
  private composer: EffectComposer;
  private pass: UnrealBloomPass;
  /** The world's pass, and the one before it (T449: a planet's globe and its stars, `background`). */
  private main: RenderPass;
  private behind?: RenderPass;
  /** The ink outlines of the cartoon (ADR-0093). */
  private ink: Ink | null = null;

  constructor(
    private gl: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    strength = 0.9,
    radius = 0.45,
  ) {
    // The canvas' antialias is lost in a target: the target has its own samples.
    this.composer = new EffectComposer(gl, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
    this.main = new RenderPass(scene, camera);
    this.composer.addPass(this.main);
    if (camera instanceof THREE.PerspectiveCamera) {
      this.ink = new Ink(scene, camera, idsOf);
      this.ink.pass.enabled = CARTOON;
      this.composer.addPass(this.ink.pass);
    }
    this.pass = new UnrealBloomPass(new THREE.Vector2(1, 1), strength, radius, 0);
    this.pass.materialHighPassFilter.fragmentShader = GLOW_PASS;
    this.pass.materialHighPassFilter.needsUpdate = true;
    this.composer.addPass(this.pass);
    this.composer.addPass(new OutputPass());
  }

  setSize(w: number, h: number, dpr: number): void {
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
    this.ink?.setSize(w, h, dpr);
  }

  /** Whether the ink is drawn: the look's, unless a page changes it (the lab's switch); the classic look does not pay for it. */
  get inked(): boolean {
    return !!this.ink?.pass.enabled;
  }
  set inked(on: boolean) {
    if (this.ink) this.ink.pass.enabled = on;
  }

  /** How strong the halo is (0 turns it off; the voxels still glow). */
  set strength(v: number) {
    this.pass.strength = v;
  }

  /** How far the halo spreads. */
  set radius(v: number) {
    this.pass.radius = v;
  }

  /**
   * A pass before the world's (T449): a scene of its own drawn first, then the world over it with its depth cleared and no background (the
   * caller takes the scene's off). Null: the world's pass alone, as always.
   */
  background(scene: THREE.Scene | null, camera?: THREE.Camera): void {
    if (scene && camera) {
      if (!this.behind) {
        this.behind = new RenderPass(scene, camera);
        this.composer.insertPass(this.behind, 0);
      }
      this.behind.scene = scene;
      this.behind.camera = camera;
      this.behind.enabled = true;
      this.main.clear = false;
      this.main.clearDepth = true;
    } else if (this.behind?.enabled) {
      this.behind.enabled = false;
      this.main.clear = true;
      this.main.clearDepth = false;
    }
  }

  render(dt: number): void {
    if (this.inked) this.ink?.prepare(this.gl);
    U.glowMask.value = 1;
    this.composer.render(dt);
    U.glowMask.value = 0;
  }
}
