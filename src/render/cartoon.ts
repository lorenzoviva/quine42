// The cartoon look (ADR-0093): banded (toon) shading in place of Lambert for every lit material (T89a), saturated on the
// side away from the sun, with sharper cast shadows; ink outlines in post-processing, still the trial of T89 from the
// depth and the normals of the frame (T89b draws them from ids).

import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

/** Whether the game draws as a cartoon unless the URL says otherwise: `true` once T89b and T89c are done. */
export const CARTOON_BY_DEFAULT = false;

/** The switch: `?classica` is always the old look, `?cartone` the cartoon, otherwise the default. */
export function cartoonOn(search: string, byDefault = CARTOON_BY_DEFAULT): boolean {
  const url = new URLSearchParams(search);
  return !url.has('classica') && (byDefault || url.has('cartone'));
}

/** Whether the world draws as a cartoon (never in Node). */
export const CARTOON = typeof location !== 'undefined' && cartoonOn(location.search);

/** Where the sun stands, from what the camera looks at. */
export const SUN_FROM: readonly [number, number, number] = [-14, 24, 10];

/** How much of the sun each band lets through: away from it, half-light, full light. */
export const BAND_LEVELS: readonly [number, number, number] = [0.35, 0.6, 0.85];

/**
 * Where the bands change, in the cosine between a face and the sun. Not three equal thirds: voxels only have six
 * normals, and with `SUN_FROM` thirds would put them all in the first or the last band, the middle one never seen. These
 * give the top the full light, the faces towards south and west the half-light, the other two the low band.
 */
export const BAND_EDGES: readonly [number, number] = [0, 0.6];

/** The band (0, 1, 2) of a face at this cosine with the sun. */
export const bandOf = (cosine: number): 0 | 1 | 2 => (cosine < BAND_EDGES[0] ? 0 : cosine < BAND_EDGES[1] ? 1 : 2);

/** Texels of the ramp: enough for the edges to fall where they should (three reads it at `cosine * 0.5 + 0.5`). */
const RAMP_TEXELS = 40;

/** The ramp as a one-row RGBA image, read as a step function. */
export function bandRamp(): Uint8Array {
  const data = new Uint8Array(RAMP_TEXELS * 4);
  for (let i = 0; i < RAMP_TEXELS; i++) {
    const level = Math.round(BAND_LEVELS[bandOf(((i + 0.5) / RAMP_TEXELS) * 2 - 1)] * 255);
    data.set([level, level, level, 255], i * 4);
  }
  return data;
}

/**
 * How much the sun still reaches inside a cast shadow, as the low band: the shadow's intensity is the rest. Faces
 * away from the sun are in shadow too, so at full intensity the low band would never be seen.
 */
export const SHADOW_INTENSITY = 1 - BAND_LEVELS[0];

/** The radius of the shadows' filter, in texels of the shadow map: sharp edges, without the filter's grain. */
export const SHADOW_RADIUS = 0;

/** The hemisphere: faces standing upright get the middle of the two, so that middle has to be cold, not grey. */
export const CARTOON_HEMI = { sky: 0xc4dcff, ground: 0x5f5cb4 } as const;

/** The light in the studio: without any sun no face would ever change band there. */
export const CARTOON_STUDIO = { sun: 1.1, hemi: 0.7 } as const;

function bands(): THREE.DataTexture {
  const t = new THREE.DataTexture(bandRamp(), RAMP_TEXELS, 1, THREE.RGBAFormat);
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
 * the pass darkens where depth or normal jump (silhouettes and the voxels' creases). Each mesh draws with the normal
 * material of its own (`normalsOf`), never one override for all: the circle clip and the cut above the head stay, or
 * the simulation hidden beyond the circle would show its outlines around the corona (T98).
 */
export class Ink {
  readonly pass: ShaderPass;
  private target = new THREE.WebGLRenderTarget(1, 1, { depthTexture: new THREE.DepthTexture(1, 1) });
  /** The materials swapped for their normals while `prepare` draws, to put back after. */
  private swapped: [THREE.Mesh, THREE.Material | THREE.Material[]][] = [];

  constructor(
    private scene: THREE.Scene,
    private camera: THREE.PerspectiveCamera,
    /** The normal material that stands in for each one (`normalsOf` of materials.ts, passed in: materials imports this file). */
    private normalsOf: (m: THREE.Material) => THREE.Material | undefined,
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
    this.swap();
    gl.setRenderTarget(this.target);
    gl.setClearColor(0x8080ff, 1);
    gl.clear();
    gl.render(this.scene, this.camera);
    gl.setRenderTarget(null);
    this.restore();
    this.scene.background = bg;
    this.scene.fog = fog;
  }

  private swap(): void {
    this.scene.traverseVisible((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.material) return;
      const was = mesh.material;
      // Lines, points and sprites have no normals to outline: they stay out of the target.
      const of = (m: THREE.Material) => (mesh.isMesh ? this.normalsOf(m) : undefined) ?? HIDDEN;
      const now = Array.isArray(was) ? was.map(of) : of(was);
      this.swapped.push([mesh, was]);
      mesh.material = now;
    });
  }

  private restore(): void {
    for (const [mesh, was] of this.swapped) mesh.material = was;
    this.swapped.length = 0;
  }
}

/** What draws nothing in the normals (a material that is not drawn). */
const HIDDEN = new THREE.MeshBasicMaterial({ visible: false });
