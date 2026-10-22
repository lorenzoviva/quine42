// Materials of the 3D world. Everything is vertex-coloured Lambert (like the voxel models), and the
// simulation's materials share a clip: once the corona is revealed, nothing of the simulation is drawn
// beyond the circle (the corona is the world beyond it).

import * as THREE from 'three';

/** Shared uniforms: time (wind, flicker), wind strength, the radius beyond which the simulation is cut. */
export const U = {
  time: { value: 0 },
  wind: { value: 0.05 },
  clipR: { value: 1e9 },
};

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
    float ph = uTime * 1.7 + swp.x * 0.37 + swp.z * 0.61;
    transformed.x += sway * uWind * (sin(ph) + 0.35 * sin(ph * 2.3 + 1.0));
    transformed.z += sway * uWind * 0.45 * cos(ph * 0.8);`
          : '#include <begin_vertex>',
      )
      .replace('#include <project_vertex>', '#include <project_vertex>\n  vClipXZ = (modelMatrix * vec4(transformed, 1.0)).xz;');
    sh.fragmentShader = `uniform float uClipR;\nvarying vec2 vClipXZ;\n${sh.fragmentShader}`.replace('void main() {', 'void main() {\n  if (length(vClipXZ) > uClipR) discard;');
  };
  m.customProgramCacheKey = () => key;
  return m;
}

export const MAT = {
  /** The simulation: ground, things, people. */
  world: clipped(new THREE.MeshLambertMaterial({ vertexColors: true }), 'world'),
  /** Vegetation: the wind moves the top (the `sway` attribute). */
  sway: clipped(new THREE.MeshLambertMaterial({ vertexColors: true }), 'sway', true),
  /** The corona and the studio: never clipped. */
  corona: new THREE.MeshLambertMaterial({ vertexColors: true }),
  /** Neon edges and glowing things (unlit). */
  glow: new THREE.MeshBasicMaterial({ vertexColors: true }),
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
