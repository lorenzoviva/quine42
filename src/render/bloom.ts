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
    this.composer.addPass(new RenderPass(scene, camera));
    if (CARTOON && camera instanceof THREE.PerspectiveCamera) {
      this.ink = new Ink(scene, camera, idsOf);
      this.composer.addPass(this.ink.pass);
      // The thresholds, to try from the console (`window.cartone.uDepthEdge.value.set(…)`).
      (globalThis as { cartone?: unknown }).cartone = this.ink.pass.uniforms;
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

  /** How strong the halo is (0 turns it off; the voxels still glow). */
  set strength(v: number) {
    this.pass.strength = v;
  }

  /** How far the halo spreads. */
  set radius(v: number) {
    this.pass.radius = v;
  }

  render(dt: number): void {
    this.ink?.prepare(this.gl);
    U.glowMask.value = 1;
    this.composer.render(dt);
    U.glowMask.value = 0;
  }
}
