// Materials of the 3D world. Everything is vertex-coloured Lambert (like the voxel models), and the
// simulation's materials share a clip: once the corona is revealed, nothing of the simulation is drawn
// beyond the circle (the corona is the world beyond it). Glowing voxels (`<color glow="True">`, ADR-0046) emit
// their colour; while the renderer blooms they also mark themselves in the frame's alpha, which the bloom reads.

import * as THREE from 'three';

/** Shared uniforms: time (wind, flicker), wind strength, the radius beyond which the simulation is cut. */
export const U = {
  time: { value: 0 },
  wind: { value: 0.05 },
  clipR: { value: 1e9 },
  /** How much a glowing voxel emits, over its lit colour. */
  glow: { value: 1.4 },
  /** 1 while the renderer draws into its bloom target (alpha = 1 - glow there); 0 for icons and the lab. */
  glowMask: { value: 0 },
};

/**
 * Glowing voxels in a shader: the `glow` attribute (0 where a geometry has none) adds the vertex colour to
 * the emitted light and marks the pixel for the bloom. `always`: the whole material glows (neon edges).
 */
export function addGlow(sh: THREE.WebGLProgramParametersWithUniforms, always = false): void {
  sh.uniforms.uGlow = U.glow;
  sh.uniforms.uGlowMask = U.glowMask;
  const g = always ? '1.0' : 'vGlow';
  if (!always) {
    sh.vertexShader = `attribute float glow;\nvarying float vGlow;\n${sh.vertexShader}`.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vGlow = glow;');
    sh.fragmentShader = `varying float vGlow;\n${sh.fragmentShader}`;
  }
  sh.fragmentShader = `uniform float uGlow;\nuniform float uGlowMask;\n${sh.fragmentShader}`
    .replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
  #ifdef USE_COLOR
  totalEmissiveRadiance += vColor.rgb * ${g} * uGlow;
  #endif`,
    )
    .replace('#include <opaque_fragment>', `#include <opaque_fragment>\n  gl_FragColor.a *= 1.0 - uGlowMask * ${g};`);
}

/** Geometries without the attribute read 0 (otherwise WebGL keeps whatever value it was given last). */
function noGlow(m: THREE.Material): void {
  (m as unknown as { defaultAttributeValues: Record<string, number[]> }).defaultAttributeValues = { glow: [0] };
}

/** A material that shows glowing voxels without the clip (the corona, the icons). `always`: all of it glows. */
export function glowing<M extends THREE.Material>(m: M, key: string, always = false): M {
  m.onBeforeCompile = (sh) => addGlow(sh, always);
  m.customProgramCacheKey = () => `glow-${key}`;
  noGlow(m);
  return m;
}

/** Adds the circle clip (in world xz) to a material. */
export function clipped<M extends THREE.Material>(m: M, key: string, sway = false): M {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.time;
    sh.uniforms.uWind = U.wind;
    sh.uniforms.uClipR = U.clipR;
    sh.vertexShader = `${sway ? 'attribute float sway;\n' : ''}uniform float uTime;\nuniform float uWind;\nvarying vec2 vClipXZ;\n${sh.vertexShader}`
      .replace(
        '#include <begin_vertex>',
        sway
          ? `#include <begin_vertex>
    vec3 swp = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    #ifdef USE_INSTANCING
    swp += (modelMatrix * vec4(instanceMatrix[3].xyz, 0.0)).xyz;
    #endif
    float ph = uTime * 1.7 + swp.x * 0.37 + swp.z * 0.61;
    transformed.x += sway * uWind * (sin(ph) + 0.35 * sin(ph * 2.3 + 1.0));
    transformed.z += sway * uWind * 0.45 * cos(ph * 0.8);`
          : '#include <begin_vertex>',
      )
      // The clip follows project_vertex: instances (terrain models) are cut where they stand, not at the mesh origin.
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
  vec4 clipP = vec4(transformed, 1.0);
  #ifdef USE_BATCHING
  clipP = batchingMatrix * clipP;
  #endif
  #ifdef USE_INSTANCING
  clipP = instanceMatrix * clipP;
  #endif
  vClipXZ = (modelMatrix * clipP).xz;`,
      );
    sh.fragmentShader = `uniform float uClipR;\nvarying vec2 vClipXZ;\n${sh.fragmentShader}`.replace('void main() {', 'void main() {\n  if (length(vClipXZ) > uClipR) discard;');
    addGlow(sh);
  };
  m.customProgramCacheKey = () => key;
  noGlow(m);
  m.userData.clipped = true;
  return m;
}

/** The shadow pass draws with its own depth material: clipped too, or what is cut still casts its shadow. */
const CLIPPED_DEPTH = clipped(new THREE.MeshDepthMaterial(), 'depth');

/** A mesh that casts shadows: if its material is clipped, so is its shadow. */
export function casts<T extends THREE.Mesh>(m: T, receive = false): T {
  m.castShadow = true;
  if (receive) m.receiveShadow = true;
  if ((m.material as THREE.Material).userData?.clipped) m.customDepthMaterial = CLIPPED_DEPTH;
  return m;
}

/** Inside a structure everything above the head is cut away (the renderer sets where). */
export const CUT = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e9);

export const MAT = {
  /** The structure the wanderer is in: cut above the head. */
  cut: clipped(new THREE.MeshLambertMaterial({ vertexColors: true, clippingPlanes: [CUT] }), 'cut'),
  /** The simulation: ground, things, people. */
  world: clipped(new THREE.MeshLambertMaterial({ vertexColors: true }), 'world'),
  /** Vegetation: the wind moves the top (the `sway` attribute). */
  sway: clipped(new THREE.MeshLambertMaterial({ vertexColors: true }), 'sway', true),
  /** The corona and the studio: never clipped. */
  corona: glowing(new THREE.MeshLambertMaterial({ vertexColors: true }), 'corona'),
  /** Neon edges and glowing things (unlit, they bloom). */
  glow: glowing(new THREE.MeshBasicMaterial({ vertexColors: true }), 'neon', true),
  /** Faint lines (the studio's floor grid): unlit, but outside the bloom, so they cast no halo (T49a). */
  line: new THREE.MeshBasicMaterial({ vertexColors: true }),
};

/** Solid-coloured clipped material (stand-ins). Cached by colour. */
const solids = new Map<string, THREE.Material>();
export function solid(color: string, opts: { emissive?: number; transparent?: number } = {}): THREE.Material {
  const key = `${color}|${opts.emissive ?? 0}|${opts.transparent ?? 1}`;
  let m = solids.get(key);
  if (!m) {
    const c = new THREE.Color(safeColor(color));
    const mat = new THREE.MeshLambertMaterial({ color: c, emissive: c.clone().multiplyScalar(opts.emissive ?? 0), transparent: (opts.transparent ?? 1) < 1, opacity: opts.transparent ?? 1 });
    solids.set(key, (m = clipped(mat, 'solid')));
  }
  return m;
}

/** Any CSS colour three.js understands, or grey. */
export function safeColor(c: string | undefined): string {
  if (!c) return '#888888';
  const s = c.trim();
  if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(s)) return s;
  // CSS 4 "hsl(120 65% 68%)" (what the Forge writes) → "hsl(120, 65%, 68%)" (what three.js reads).
  const hsl = /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/i.exec(s);
  if (hsl) return `hsl(${hsl[1]}, ${hsl[2]}%, ${hsl[3]}%)`;
  if (/^rgba?\(/i.test(s) || /^[a-z]+$/i.test(s)) return s;
  return '#888888';
}

/** Linear RGB of a CSS colour, multiplied (vertex colours are linear). */
export function rgbOf(c: string | undefined, k = 1): [number, number, number] {
  const col = new THREE.Color(safeColor(c));
  return [col.r * k, col.g * k, col.b * k];
}
