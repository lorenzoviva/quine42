// The cartoon look (ADR-0093, T89): a trial behind `?cartone`. Banded (toon) shading in place of Lambert for the
// simulation's materials, and ink outlines drawn in post-processing from the depth and the normals of the frame.
// Only a trial: the real work is in the T89 tasks of the backlog (T89a-e).

import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

/** Whether the trial is on (`?cartone` in the URL; never in Node). */
export const CARTOON = typeof location !== 'undefined' && new URLSearchParams(location.search).has('cartone');

/** Three bands of light: shadow, half-light, full light (the toon material reads it as a step function). */
function bands(): THREE.DataTexture {
  const t = new THREE.DataTexture(new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}
const BANDS = bands();

/** A toon material in place of a Lambert one, with the same options. */
export function toon(opts: THREE.MeshToonMaterialParameters): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({ ...opts, gradientMap: BANDS });
}

const INK = `uniform sampler2D tDiffuse;
uniform sampler2D tNormal;
uniform sampler2D tDepth;
uniform vec2 uTexel;
uniform float uNear;
uniform float uFar;
uniform vec2 uDepthEdge;
uniform vec2 uNormalEdge;
varying vec2 vUv;
float lin(vec2 uv) {
  float z = texture2D(tDepth, uv).x * 2.0 - 1.0;
  return 2.0 * uNear * uFar / (uFar + uNear - z * (uFar - uNear));
}
void main() {
  vec4 c = texture2D(tDiffuse, vUv);
  float d = lin(vUv);
  vec3 n = texture2D(tNormal, vUv).xyz * 2.0 - 1.0;
  float de = 0.0;
  float ne = 0.0;
  for (int i = 0; i < 4; i++) {
    vec2 o = i == 0 ? vec2(1.0, 0.0) : i == 1 ? vec2(-1.0, 0.0) : i == 2 ? vec2(0.0, 1.0) : vec2(0.0, -1.0);
    vec2 uv = vUv + o * uTexel;
    de = max(de, abs(lin(uv) - d) / d);
    ne = max(ne, 1.0 - dot(n, texture2D(tNormal, uv).xyz * 2.0 - 1.0));
  }
  float edge = max(smoothstep(uDepthEdge.x, uDepthEdge.y, de), smoothstep(uNormalEdge.x, uNormalEdge.y, ne));
  // Ink: the colour itself, much darker (dark blue-brown, not black), as in hand-inked cartoons.
  vec3 ink = c.rgb * 0.18 + vec3(0.03, 0.03, 0.05);
  gl_FragColor = vec4(mix(c.rgb, ink, edge * 0.9), c.a);
}`;

/**
 * Ink outlines: before the frame, the scene is drawn once more with its normals into a target with a depth texture;
 * the pass darkens where depth or normal jump (silhouettes and the voxels' creases).
 */
export class Ink {
  readonly pass: ShaderPass;
  private target = new THREE.WebGLRenderTarget(1, 1, { depthTexture: new THREE.DepthTexture(1, 1) });
  private normals = new THREE.MeshNormalMaterial();

  constructor(
    private scene: THREE.Scene,
    private camera: THREE.PerspectiveCamera,
  ) {
    this.pass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        tNormal: { value: null },
        tDepth: { value: null },
        uTexel: { value: new THREE.Vector2(1, 1) },
        uNear: { value: 0.1 },
        uFar: { value: 1000 },
        uDepthEdge: { value: new THREE.Vector2(0.03, 0.08) },
        uNormalEdge: { value: new THREE.Vector2(0.25, 0.6) },
      },
      vertexShader: 'varying vec2 vUv;\nvoid main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: INK,
    });
    // ShaderPass clones its uniforms (textures too): the targets go in after.
    this.pass.uniforms.tNormal.value = this.target.texture;
    this.pass.uniforms.tDepth.value = this.target.depthTexture;
    // The trial's thresholds, to try from the console (`window.cartone.uDepthEdge.value.set(…)`).
    (globalThis as { cartone?: unknown }).cartone = this.pass.uniforms;
  }

  setSize(w: number, h: number, dpr: number): void {
    this.target.setSize(Math.floor(w * dpr), Math.floor(h * dpr));
    (this.pass.uniforms.uTexel.value as THREE.Vector2).set(1 / (w * dpr), 1 / (h * dpr));
  }

  /** Draws the normals and the depth of the frame (before the composer). */
  prepare(gl: THREE.WebGLRenderer): void {
    this.pass.uniforms.uNear.value = this.camera.near;
    this.pass.uniforms.uFar.value = this.camera.far;
    const bg = this.scene.background;
    const fog = this.scene.fog;
    this.scene.background = null;
    this.scene.fog = null;
    this.scene.overrideMaterial = this.normals;
    gl.setRenderTarget(this.target);
    gl.setClearColor(0x8080ff, 1);
    gl.clear();
    gl.render(this.scene, this.camera);
    gl.setRenderTarget(null);
    this.scene.overrideMaterial = null;
    this.scene.background = bg;
    this.scene.fog = fog;
  }
}
