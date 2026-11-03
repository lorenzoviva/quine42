// Materials of the 3D world. Everything is vertex-coloured, Lambert or banded (`lit`, the cartoon of ADR-0093), and the
// simulation's materials share a clip: once the corona is revealed, nothing of the simulation is drawn
// beyond the circle (the corona is the world beyond it). Glowing voxels (`<color glow="True">`, ADR-0046) emit
// their colour; while the renderer blooms they also mark themselves in the frame's alpha, which the bloom reads.

import * as THREE from 'three';
import { addShade, CARTOON, toon } from './cartoon';

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

/** In the cartoon a glowing voxel is this much of its colour, plus `U.glow`: about what it is in the classic look by day. */
const GLOW_BASE = 0.6;

/**
 * Glowing voxels in a shader: the `glow` attribute (0 where a geometry has none) adds the vertex colour to
 * the emitted light and marks the pixel for the bloom. `always`: the whole material glows (neon edges).
 */
export function addGlow(sh: THREE.WebGLProgramParametersWithUniforms, always = false): void {
  // The toon shader alone reads a gradient: there a glowing voxel leaves the bands, its colour the same on every face.
  const banded = sh.fragmentShader.includes('#include <gradientmap_pars_fragment>');
  if (banded) addShade(sh);
  const unbanded = banded
    ? `#ifdef USE_COLOR
  outgoingLight = mix(outgoingLight, vColor.rgb * (GLOW_BASE + uGlow), ${always ? '1.0' : 'vGlow'});
  #endif
  `
    : '';
  sh.uniforms.uGlow = U.glow;
  sh.uniforms.uGlowMask = U.glowMask;
  const g = always ? '1.0' : 'vGlow';
  if (!always) {
    sh.vertexShader = `attribute float glow;\nvarying float vGlow;\nattribute float alpha;\nvarying float vAlpha;\n${sh.vertexShader}`.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vGlow = glow;\n  vAlpha = alpha;');
    sh.fragmentShader = `varying float vGlow;\nvarying float vAlpha;\n${sh.fragmentShader}`;
  }
  sh.fragmentShader = `#define GLOW_BASE ${GLOW_BASE.toFixed(2)}\nuniform float uGlow;\nuniform float uGlowMask;\n${sh.fragmentShader}`
    .replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
  #ifdef USE_COLOR
  totalEmissiveRadiance += vColor.rgb * ${g} * uGlow;
  #endif`,
    )
    .replace(
      '#include <opaque_fragment>',
      `${unbanded}#include <opaque_fragment>
#ifdef OPAQUE
  gl_FragColor.a = 1.0 - uGlowMask * ${g};
#else
  gl_FragColor.a *= ${always ? '1.0' : 'vAlpha'};
#endif`,
    );
}

/** The attributes `noGlow` added, which follow their geometry's vertex count. */
const fillers = new WeakSet<THREE.BufferAttribute>();

/**
 * Geometries without the attributes get them before they are drawn: glow 0, alpha 1. Not WebGL's constant attribute
 * values (`defaultAttributeValues`): those are global per location and three sets them only when it rebuilds a
 * geometry's bindings, so a geometry without `glow` read whatever another program had left at that location, often
 * the alpha 1 of a translucent model (things glowing at random, the frame turning white in the bloom).
 *
 * After the frame, not during the draw (T143): three uploads a geometry's attributes before it draws anything, so an
 * attribute added from here has no buffer yet. three would skip binding it and still remember it as bound, and that
 * geometry with that program read the constant value for good: alpha 0, a rune's slab invisible, as long as the first
 * program the slab was drawn with lived (the one with the fog: inside the circle). Added after the frame, the next
 * frame uploads it and sees a new attribute; the one frame in between reads the constant, like a geometry never drawn.
 */
function noGlow(m: THREE.Material): void {
  m.onBeforeRender = (_r, _s, _c, geometry) => {
    if (!lacksFillers(geometry) || filling.has(geometry)) return;
    filling.add(geometry);
    queueMicrotask(() => {
      filling.delete(geometry);
      addFillers(geometry);
    });
  };
}

/** The geometries waiting for their attributes, until the frame that found them lacking ends. */
const filling = new WeakSet<THREE.BufferGeometry>();

const FILLERS = [['glow', 0], ['alpha', 1]] as const;

function staleFiller(geometry: THREE.BufferGeometry, name: string): boolean {
  const a = geometry.getAttribute(name) as THREE.BufferAttribute | undefined;
  return !a || (fillers.has(a) && a.count !== (geometry.attributes.position?.count ?? 0));
}

function lacksFillers(geometry: THREE.BufferGeometry): boolean {
  return FILLERS.some(([name]) => staleFiller(geometry, name));
}

function addFillers(geometry: THREE.BufferGeometry): void {
  const n = geometry.attributes.position?.count ?? 0;
  for (const [name, value] of FILLERS) {
    if (!staleFiller(geometry, name)) continue;
    const filler = new THREE.BufferAttribute(new Float32Array(n).fill(value), 1);
    fillers.add(filler);
    geometry.setAttribute(name, filler);
  }
}

/** A material that shows glowing voxels without the clip (the corona, the icons). `always`: all of it glows. */
export function glowing<M extends THREE.Material>(m: M, key: string, always = false): M {
  m.onBeforeCompile = (sh) => addGlow(sh, always);
  m.customProgramCacheKey = () => `glow-${key}`;
  if (!always) noGlow(m);
  return m;
}

/** The vertex shader's wind: the `sway` weight of a vertex bends it. */
const WIND_VERTEX = `#include <begin_vertex>
    vec3 swp = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    #ifdef USE_INSTANCING
    swp += (modelMatrix * vec4(instanceMatrix[3].xyz, 0.0)).xyz;
    #endif
    float ph = uTime * 1.7 + swp.x * 0.37 + swp.z * 0.61;
    transformed.x += sway * uWind * (sin(ph) + 0.35 * sin(ph * 2.3 + 1.0));
    transformed.z += sway * uWind * 0.45 * cos(ph * 0.8);`;

/** The wind without the circle clip, for what stands beyond the circle (T218): the corona's trees. */
export function windy<M extends THREE.Material>(m: M, key: string): M {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.time;
    sh.uniforms.uWind = U.wind;
    sh.vertexShader = `attribute float sway;\nuniform float uTime;\nuniform float uWind;\n${sh.vertexShader}`.replace('#include <begin_vertex>', WIND_VERTEX);
    addGlow(sh);
  };
  m.customProgramCacheKey = () => key;
  noGlow(m);
  m.userData.sway = true;
  return m;
}

/** Adds the circle clip (in world xz) to a material. */
export function clipped<M extends THREE.Material>(m: M, key: string, sway = false): M {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.time;
    sh.uniforms.uWind = U.wind;
    sh.uniforms.uClipR = U.clipR;
    sh.vertexShader = `${sway ? 'attribute float sway;\n' : ''}uniform float uTime;\nuniform float uWind;\nvarying vec2 vClipXZ;\n${sh.vertexShader}`
      .replace('#include <begin_vertex>', sway ? WIND_VERTEX : '#include <begin_vertex>')
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
  m.userData.clipKey = key;
  m.userData.sway = sway;
  return m;
}

/** The normals of the cartoon's ink (ADR-0093), one per material drawn: clipped like it, cut like it. */
const normalsCache = new WeakMap<THREE.Material, THREE.Material>();
const PLAIN_NORMALS = new THREE.MeshNormalMaterial();

/**
 * The normal material that stands in for `m` when the ink draws the frame's normals and depth (T98): with the circle
 * clip if `m` has it (the simulation beyond the circle stays hidden once the corona shows), the same clipping planes
 * (the cut above the head), sway and faces. Undefined for what writes neither colour nor depth (nothing to outline).
 */
export function normalsOf(m: THREE.Material): THREE.Material | undefined {
  if (!m.visible || (!m.colorWrite && !m.depthWrite)) return undefined;
  if (!m.userData?.clipped && !m.userData?.sway && !m.clippingPlanes?.length && m.side === THREE.FrontSide) return PLAIN_NORMALS;
  let n = normalsCache.get(m);
  if (!n) {
    n = new THREE.MeshNormalMaterial({ side: m.side, clippingPlanes: m.clippingPlanes ?? null });
    if (m.userData?.clipped) clipped(n, `normal-${m.userData.clipKey}`, !!m.userData.sway);
    else if (m.userData?.sway) windy(n, `normal-${m.customProgramCacheKey()}`);
    normalsCache.set(m, n);
  }
  return n;
}

/** The shadow pass draws with its own depth material: clipped too, or what is cut still casts its shadow. */
const CLIPPED_DEPTH = clipped(new THREE.MeshDepthMaterial(), 'depth');

/** A mesh that casts shadows: if its material is clipped, so is its shadow. */
export function casts<T extends THREE.Mesh>(m: T, receive = false): T {
  m.castShadow = true;
  if (receive) m.receiveShadow = true;
  // A model with glass has two materials, both of the same kind: the first says for the mesh.
  const first = Array.isArray(m.material) ? m.material[0] : m.material;
  if (first?.userData?.clipped) m.customDepthMaterial = CLIPPED_DEPTH;
  return m;
}

/** Inside a structure everything above the head is cut away (the renderer sets where). */
export const CUT = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e9);

/** A lit material: Lambert, or banded in the cartoon (ADR-0093). */
export function lit(opts: THREE.MeshLambertMaterialParameters): THREE.Material {
  return CARTOON ? toon(opts as THREE.MeshToonMaterialParameters) : new THREE.MeshLambertMaterial(opts);
}

export const MAT = {
  /** The structure the wanderer is in: cut above the head. */
  cut: clipped(lit({ vertexColors: true, clippingPlanes: [CUT] }), 'cut'),
  /** The simulation: ground, things, people. */
  world: clipped(lit({ vertexColors: true }), 'world'),
  /** Vegetation: the wind moves the top (the `sway` attribute). */
  sway: clipped(lit({ vertexColors: true }), 'sway', true),
  /** The corona and the studio: never clipped. */
  corona: glowing(lit({ vertexColors: true }), 'corona'),
  /** The corona's vegetation: the wind of `sway`, never clipped (`MAT.sway` beyond the circle draws only its shadow, T218). */
  coronaSway: windy(lit({ vertexColors: true }), 'corona-sway'),
  /** Translucent voxels (glass screens, translucent panels) in the simulation. */
  glass: clipped(lit({ vertexColors: true, transparent: true, depthWrite: false }), 'glass'),
  /** Translucent voxels inside a cut structure. */
  cutGlass: clipped(lit({ vertexColors: true, clippingPlanes: [CUT], transparent: true, depthWrite: false }), 'cut-glass'),
  /** Translucent voxels in the corona. */
  coronaGlass: glowing(lit({ vertexColors: true, transparent: true, depthWrite: false }), 'corona-glass'),
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
    const mat = lit({ color: c, emissive: c.clone().multiplyScalar(opts.emissive ?? 0), transparent: (opts.transparent ?? 1) < 1, opacity: opts.transparent ?? 1 });
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
