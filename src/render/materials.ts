// Materials of the 3D world. Everything is vertex-coloured, Lambert or banded (`lit`, the cartoon of ADR-0093), and the
// simulation's materials share a clip: once the corona is revealed, nothing of the simulation is drawn
// beyond the circle (the corona is the world beyond it). Glowing voxels (`<color glow="True">`, ADR-0046) emit
// their colour; while the renderer blooms they also mark themselves in the frame's alpha, which the bloom reads.

import * as THREE from 'three';
import { addShade, CARTOON, thingOf, toon } from './cartoon';
import { CUT_RADIUS, CUT_STRETCH } from '../kernel/underground';
import { WIND_MAX } from '../kernel/wind';

/**
 * The world's wind as the vertex shaders read it (T484, ADR-0255): the coarse view (`Kernel.windView`) in a small texture, east in red
 * and south in green over `WIND_MAX`, 128 still; filtered between the middles of its cells, as `windInView` reads it.
 */
function windTexture(w = 1, h = 1, data = new Uint8Array(w * h * 4).fill(128)): THREE.DataTexture {
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearFilter;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.needsUpdate = true;
  return t;
}

/** Shared uniforms: time (wind, flicker), wind strength, the radius beyond which the simulation is cut. */
export const U = {
  time: { value: 0 },
  wind: { value: 0.05 },
  clipR: { value: 1e9 },
  /** How much a glowing voxel emits, over its lit colour. */
  glow: { value: 1.4 },
  /** 1 while the renderer draws into its bloom target (alpha = 1 - glow there); 0 for icons and the lab. */
  glowMask: { value: 0 },
  /**
   * Under the ground (T416, ADR-0091 point 6): over this height (world y) what stands in the disc around `cutTile` (the tile one
   * stands on, in carpet coordinates) stretched towards `cutDir` is not drawn; 1e9 on the ground. `cutOff`: world → carpet.
   */
  cutY: { value: 1e9 },
  cutTile: { value: new THREE.Vector2() },
  cutDir: { value: new THREE.Vector2(0, 1) },
  cutOff: { value: new THREE.Vector2() },
  /**
   * The world's wind (T484): its coarse view as a texture, where it lies (its corner from the whole part of the scroll, as `cutTile`, and
   * one over its width and height in tiles), and 1 when the world has a wind; at 0 the vegetation sways as before, the same everywhere.
   */
  windTex: { value: windTexture() },
  windBox: { value: new THREE.Vector4(0, 0, 1, 1) },
  windOn: { value: 0 },
};

/** How far a full wind leans the top of what sways (tiles). */
const WIND_LEAN = 0.25;

/** The world's wind in the shaders: off for what stands beyond the circle (the corona), which is not the world. */
const WIND_OFF = { value: 0 };
const windUniforms = (on: { value: number } = U.windOn) => ({ uWindTex: U.windTex, uWindBox: U.windBox, uWindOn: on, uWindOff: U.cutOff });
const WIND_PARS = `uniform sampler2D uWindTex;
uniform vec4 uWindBox;
uniform float uWindOn;
uniform vec2 uWindOff;`;

/** The texture of a coarse view of the wind (T484): reused while its size stays; `bytes` two signed bytes a cell, as the view has them. */
export function windToTexture(w: number, h: number, bytes: Uint8Array): void {
  let t = U.windTex.value;
  if (t.image.width !== w || t.image.height !== h) {
    t.dispose();
    t = U.windTex.value = windTexture(w, h);
  }
  const data = t.image.data as Uint8Array;
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = (((bytes[i * 2]! << 24) >> 24) + 128) & 255;
    data[i * 4 + 1] = (((bytes[i * 2 + 1]! << 24) >> 24) + 128) & 255;
    data[i * 4 + 2] = 128;
    data[i * 4 + 3] = 255;
  }
  t.needsUpdate = true;
}

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
  m.onBeforeRender = (_r, _s, _c, geometry) => fillLater(geometry, FILLERS, filling);
}

function fillLater(geometry: THREE.BufferGeometry, list: Fillers, waiting: WeakSet<THREE.BufferGeometry>): void {
  if (!list.some(([name]) => staleFiller(geometry, name)) || waiting.has(geometry)) return;
  waiting.add(geometry);
  queueMicrotask(() => {
    waiting.delete(geometry);
    addFillers(geometry, list);
  });
}

type Fillers = ReadonlyArray<readonly [string, number]>;

/** The geometries waiting for their attributes, until the frame that found them lacking ends. */
const filling = new WeakSet<THREE.BufferGeometry>();
const fillingPart = new WeakSet<THREE.BufferGeometry>();

const FILLERS: Fillers = [['glow', 0], ['alpha', 1]];
/** Only the ink reads it: the classic look does not pay for it. */
const PART_FILLER: Fillers = [['part', 0]];

function staleFiller(geometry: THREE.BufferGeometry, name: string): boolean {
  const a = geometry.getAttribute(name) as THREE.BufferAttribute | undefined;
  return !a || (fillers.has(a) && a.count !== (geometry.attributes.position?.count ?? 0));
}

function addFillers(geometry: THREE.BufferGeometry, list: Fillers): void {
  const n = geometry.attributes.position?.count ?? 0;
  for (const [name, value] of list) {
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

/**
 * The vertex shader's wind: the `sway` weight of a vertex bends it. Where the world has a wind (T484) the top leans the way it blows, as far
 * as it is strong, breathing with it and fluttering across it, in the frame of the model (its yaw); else the sway of before, the same
 * everywhere.
 */
const WIND_VERTEX = `#include <begin_vertex>
    vec3 swp = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    #ifdef USE_INSTANCING
    swp += (modelMatrix * vec4(instanceMatrix[3].xyz, 0.0)).xyz;
    #endif
    float ph = uTime * 1.7 + swp.x * 0.37 + swp.z * 0.61;
    if (uWindOn > 0.5) {
      vec2 wq = (swp.xz + uWindOff - uWindBox.xy) * uWindBox.zw;
      vec2 wv = (textureLod(uWindTex, wq, 0.0).rg * 255.0 - 128.0) / 127.0 * ${WIND_MAX.toFixed(3)};
      float ws = length(wv);
      vec2 wd = ws > 1e-3 ? wv / ws : vec2(0.0);
      vec3 lean = vec3(wd.x, 0.0, wd.y) * (${WIND_LEAN.toFixed(3)} * ws * (1.0 + 0.35 * sin(ph)))
        + vec3(-wd.y, 0.0, wd.x) * (uWind * (0.3 + ws) * 0.6 * cos(ph * 1.3));
      mat3 wm = mat3(modelMatrix);
      #ifdef USE_INSTANCING
      wm = wm * mat3(instanceMatrix);
      #endif
      transformed += sway * (transpose(wm) * lean) / max(dot(wm[0], wm[0]), 1e-6);
    } else {
      transformed.x += sway * uWind * (sin(ph) + 0.35 * sin(ph * 2.3 + 1.0));
      transformed.z += sway * uWind * 0.45 * cos(ph * 0.8);
    }`;

/** Where a vertex really stands, for the circle clip: instances (terrain models) are cut where they stand, not at the mesh origin. */
const CLIP_VERTEX = `vec4 clipP = vec4(transformed, 1.0);
  #ifdef USE_BATCHING
  clipP = batchingMatrix * clipP;
  #endif
  #ifdef USE_INSTANCING
  clipP = instanceMatrix * clipP;
  #endif
  vClipXZ = (modelMatrix * clipP).xz;`;

/**
 * Where a vertex stands for the cut under the ground (T416), after `CLIP_VERTEX`: a little inside what its face belongs to (against
 * its normal), so a side on the edge between two tiles is cut with its own tile, not with the neighbour it faces.
 */
const CUT_VERTEX = `vCut = (modelMatrix * clipP).xyz - normalize((modelMatrix * vec4(normal, 0.0)).xyz + vec3(0.0, 1e-6, 0.0)) * 0.01;`;

/** The varying of the cut under the ground in the vertex shader, and its uniforms in the fragment shader. */
const CUT_PARS_VERTEX = `varying vec3 vCut;`;
const CUT_PARS_FRAGMENT = `uniform float uCutY;
uniform vec2 uCutTile;
uniform vec2 uCutDir;
uniform vec2 uCutOff;
varying vec3 vCut;`;

/** The disc of `inCutDisc` (src/kernel/underground.ts), on whole tiles: what stands over `uCutY` in it is not drawn. */
const CUT_FRAGMENT = `if (vCut.y > uCutY) {
    vec2 cutQ = floor(vCut.xz + uCutOff) - uCutTile;
    vec2 cutR = cutQ - uCutDir * clamp(dot(cutQ, uCutDir), 0.0, ${CUT_STRETCH.toFixed(1)});
    if (dot(cutR, cutR) <= ${(CUT_RADIUS * CUT_RADIUS + 0.5).toFixed(1)}) discard;
  }`;

const cutUniforms = () => ({ uCutY: U.cutY, uCutTile: U.cutTile, uCutDir: U.cutDir, uCutOff: U.cutOff });

/** The wind without the circle clip, for what stands beyond the circle (T218): the corona's trees. */
export function windy<M extends THREE.Material>(m: M, key: string): M {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.time;
    sh.uniforms.uWind = U.wind;
    Object.assign(sh.uniforms, windUniforms(WIND_OFF));
    sh.vertexShader = `attribute float sway;\nuniform float uTime;\nuniform float uWind;\n${WIND_PARS}\n${sh.vertexShader}`.replace('#include <begin_vertex>', WIND_VERTEX);
    addGlow(sh);
  };
  m.customProgramCacheKey = () => key;
  noGlow(m);
  m.userData.sway = true;
  return m;
}

/**
 * Adds the circle clip (in world xz) to a material, and the cut under the ground (T416) unless `cut` is false: the shadows' depth
 * keeps what is cut, so a house over a cellar still shades it.
 */
export function clipped<M extends THREE.Material>(m: M, key: string, sway = false, cut = true): M {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.time;
    sh.uniforms.uWind = U.wind;
    sh.uniforms.uClipR = U.clipR;
    if (cut) Object.assign(sh.uniforms, cutUniforms());
    if (sway) Object.assign(sh.uniforms, windUniforms());
    sh.vertexShader = `${sway ? `attribute float sway;\n${WIND_PARS}\n` : ''}uniform float uTime;\nuniform float uWind;\nvarying vec2 vClipXZ;\n${cut ? CUT_PARS_VERTEX : ''}\n${sh.vertexShader}`
      .replace('#include <begin_vertex>', sway ? WIND_VERTEX : '#include <begin_vertex>')
      .replace('#include <project_vertex>', `#include <project_vertex>\n  ${CLIP_VERTEX}\n  ${cut ? CUT_VERTEX : ''}`);
    sh.fragmentShader = `uniform float uClipR;\nvarying vec2 vClipXZ;\n${cut ? CUT_PARS_FRAGMENT : ''}\n${sh.fragmentShader}`.replace(
      'void main() {',
      `void main() {\n  if (length(vClipXZ) > uClipR) discard;\n  ${cut ? CUT_FRAGMENT : ''}`,
    );
    addGlow(sh);
  };
  m.customProgramCacheKey = () => key;
  noGlow(m);
  m.userData.clipped = true;
  m.userData.cut = cut;
  m.userData.clipKey = key;
  m.userData.sway = sway;
  return m;
}

/** What stands in for each material when the cartoon's ink draws its ids (ADR-0093). */
const idsCache = new WeakMap<THREE.Material, THREE.Material>();

/**
 * The material that writes the ids of what `m` draws: red the thing, green the instance, blue the part (the frame's ink reads them
 * without filtering), clipped as `m` is (the simulation beyond the circle stays hidden once the corona shows, the cut above the head stays) and moved by
 * the same wind. Undefined for what gets no ink and hides nothing: what does not draw, the halo-like (`noInk`: neon, the floor's faint lines), and
 * whatever is seen through and is not voxels (a label on its quad, a soft shadow on its disc: the quad's edge is not an edge).
 */
export function idsOf(m: THREE.Material): THREE.Material | undefined {
  if (!m.visible || !m.colorWrite || !m.depthTest || m.userData?.noInk) return undefined;
  if (m.transparent && !m.vertexColors) return undefined;
  let ids = idsCache.get(m);
  if (!ids) {
    const clip = !!m.userData?.clipped;
    const cut = clip && !!m.userData?.cut;
    const sway = !!m.userData?.sway;
    // What a material adds to its vertices before three's (the swell of the sea, T451): the ids move the same, or the ink would not follow.
    const pars: string = m.userData?.pars ?? '';
    const begin: string = m.userData?.begin ?? (sway ? WIND_VERTEX : '#include <begin_vertex>');
    const material = new THREE.ShaderMaterial({
      uniforms: { uThing: { value: 0 }, uTime: U.time, uWind: U.wind, uClipR: U.clipR, ...(cut ? cutUniforms() : {}), ...(sway ? windUniforms(clip ? U.windOn : WIND_OFF) : {}) },
      side: m.side,
      clipping: true,
      clippingPlanes: m.clippingPlanes ?? null,
      vertexShader: `attribute float part;
${pars}
${sway ? `attribute float sway;\n${WIND_PARS}` : ''}
uniform float uTime;
uniform float uWind;
${clip ? 'varying vec2 vClipXZ;' : ''}
${cut ? CUT_PARS_VERTEX : ''}
varying vec2 vIds;
#include <clipping_planes_pars_vertex>
void main() {
  #ifdef USE_INSTANCING
  vIds = vec2(mod(float(gl_InstanceID), 256.0) / 255.0, part / 255.0);
  #else
  vIds = vec2(0.0, part / 255.0);
  #endif
  ${begin}
  #include <project_vertex>
  ${clip ? CLIP_VERTEX : ''}
  ${cut ? CUT_VERTEX : ''}
  #include <clipping_planes_vertex>
}`,
      fragmentShader: `uniform float uThing;
uniform float uClipR;
${clip ? 'varying vec2 vClipXZ;' : ''}
${cut ? CUT_PARS_FRAGMENT : ''}
varying vec2 vIds;
#include <clipping_planes_pars_fragment>
void main() {
  ${clip ? 'if (length(vClipXZ) > uClipR) discard;' : ''}
  ${cut ? CUT_FRAGMENT : ''}
  #include <clipping_planes_fragment>
  gl_FragColor = vec4(uThing / 255.0, vIds, 1.0);
}`,
    });
    // One material for many meshes: the thing goes up at each draw.
    material.onBeforeRender = (_r, _s, _c, geometry, object) => {
      material.uniforms.uThing.value = thingOf(object);
      material.uniformsNeedUpdate = true;
      fillLater(geometry, PART_FILLER, fillingPart);
    };
    idsCache.set(m, (ids = material));
  }
  return ids;
}

/** The shadow pass draws with its own depth material: clipped too, or what is cut still casts its shadow; not under the ground (T416), where what is cut still shades. */
const CLIPPED_DEPTH = clipped(new THREE.MeshDepthMaterial(), 'depth', false, false);

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

/** What the ink leaves alone, as if it were not there. */
function noInk<M extends THREE.Material>(m: M): M {
  m.userData.noInk = true;
  return m;
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
  glow: noInk(glowing(new THREE.MeshBasicMaterial({ vertexColors: true }), 'neon', true)),
  /** Faint lines (the studio's floor grid): unlit, but outside the bloom, so they cast no halo (T49a). */
  line: noInk(new THREE.MeshBasicMaterial({ vertexColors: true })),
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
