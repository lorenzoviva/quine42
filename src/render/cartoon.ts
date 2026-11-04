// The cartoon look (ADR-0093): banded (toon) shading in place of Lambert for every lit material (T89a), saturated on the
// side away from the sun, with sharper cast shadows; a warm key light, a cold fill, tinted shadows and the fog as aerial
// perspective (T89c); ink outlines in post-processing, where the thing or the part changes or the depth jumps (T89b).

import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { BAND_LEVELS, CARTOON_HEMI, DAY_LIGHT, SHADOW_INTENSITY, SUN_FROM, type Tint } from '../mj/toonlight';

export { BAND_LEVELS, CARTOON_HEMI, SHADOW_INTENSITY, SUN_FROM };

/** Whether the game draws as a cartoon unless the URL says otherwise: `true` once T89b and T89c are done. */
export const CARTOON_BY_DEFAULT = false;

/** The switch: `?classica` is always the old look, `?cartone` the cartoon, otherwise the default. */
export function cartoonOn(search: string, byDefault = CARTOON_BY_DEFAULT): boolean {
  const url = new URLSearchParams(search);
  return !url.has('classica') && (byDefault || url.has('cartone'));
}

/** Whether the world draws as a cartoon (never in Node). */
export const CARTOON = typeof location !== 'undefined' && cartoonOn(location.search);

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

/** The radius of the shadows' filter, in texels of the shadow map: sharp edges, without the filter's grain. */
export const SHADOW_RADIUS = 0;

/** The light in the studio: without any sun no face would ever change band there. */
export const CARTOON_STUDIO = { sun: 1.1, hemi: 0.7 } as const;

/** The light of a moment of the day, what `cartoonLight` blends. */
interface Phase {
  sun: number;
  sunIntensity: number;
  sky: number;
  ground: number;
  hemiIntensity: number;
  shade: Tint;
  bloom: number;
}

/**
 * The three moments of the day. The night keeps a moon where the sun was: with no direct light every face would have the
 * same band. The bloom is lower than the classic look's by day (a halo over flat colours reads as a smear) and comes
 * back up in the dark, where the glowing voxels are what one sees.
 */
export const PHASES: Readonly<Record<'day' | 'dusk' | 'night', Phase>> = {
  day: { ...DAY_LIGHT, bloom: 0.5 },
  dusk: { sun: 0xff9458, sunIntensity: 2.0, sky: 0xc0a8e0, ground: 0x5c4490, hemiIntensity: 0.8, shade: [0.72, 0.72, 1.2], bloom: 0.65 },
  night: { sun: 0x9db4f0, sunIntensity: 0.9, sky: 0x5070c0, ground: 0x28306c, hemiIntensity: 0.55, shade: [0.68, 0.78, 1.22], bloom: 0.85 },
};

/** The light in the corona and the studio, neither of which has a time of day: a white-warm lamp, the same cold fill. */
export const CARTOON_INDOORS = { ...PHASES.day, sun: 0xffeeda, bloom: 0.7 } as const;

/** How the light of the moment `day` (0 deep night, 1 full day) mixes: the same steps as the sky behind it. */
function phasesAt(day: number): { from: Phase; to: Phase; t: number } {
  if (day > 0.6) return { from: PHASES.day, to: PHASES.day, t: 0 };
  if (day > 0.3) return { from: PHASES.dusk, to: PHASES.day, t: (day - 0.3) / 0.3 };
  return { from: PHASES.night, to: PHASES.dusk, t: Math.max(0, day) / 0.3 };
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** The light at the moment `day` as it goes to the scene. */
export function cartoonLight(day: number): { sun: THREE.Color; sunIntensity: number; sky: THREE.Color; ground: THREE.Color; hemiIntensity: number; shade: Tint; bloom: number } {
  const { from, to, t } = phasesAt(day);
  return {
    sun: new THREE.Color(from.sun).lerp(new THREE.Color(to.sun), t),
    sunIntensity: mix(from.sunIntensity, to.sunIntensity, t),
    sky: new THREE.Color(from.sky).lerp(new THREE.Color(to.sky), t),
    ground: new THREE.Color(from.ground).lerp(new THREE.Color(to.ground), t),
    hemiIntensity: mix(from.hemiIntensity, to.hemiIntensity, t),
    shade: [mix(from.shade[0], to.shade[0], t), mix(from.shade[1], to.shade[1], t), mix(from.shade[2], to.shade[2], t)],
    bloom: mix(from.bloom, to.bloom, t),
  };
}

/**
 * The fog as aerial perspective, in view depth (what the fog and the ink measure). Seen in 3/4 the ground goes from 0.8
 * to 1.33 camera distances: the classic fog began beyond that and never showed, this one has the top of the screen
 * already fading. It is all sky within 2.2 distances, before the end of what is loaded even with the free camera low on
 * the horizon (the kernel loads 1.1 distances past the wanderer, plus one chunk). Closing in, it stays near where it is at
 * the default distance, as far as that one chunk allows: a close-up has no air in between. At night one sees less far.
 */
export function aerial(distance: number, day: number): { near: number; far: number } {
  const span = Math.max(distance, Math.min(15, distance + 7)) * (0.85 + 0.15 * Math.max(0, Math.min(1, day)));
  return { near: span * 0.85, far: span * 2.2 };
}

/** How much the bloom spreads over the cartoon: tighter than the classic look's, the bands stay clean around a lamp. */
export const CARTOON_BLOOM_RADIUS = 0.3;

/** What the shadows' tint is now (the renderer sets it). */
export const SHADE = { value: new THREE.Vector3(1, 1, 1) };

/**
 * Tints what lies in shadow, in the toon shader, without reading the shadow map a second time. The directional lights are
 * the last ones lights_fragment_begin goes through, so `directLight` is still the sun there, its colour multiplied by the
 * shadow: against the sun's own colour, that says how much shadow fell here. A face turned away from the sun counts as in
 * shadow in any case, also where the shadow map does not reach.
 */
export function addShade(sh: THREE.WebGLProgramParametersWithUniforms): void {
  sh.uniforms.uShade = SHADE;
  sh.fragmentShader = `uniform vec3 uShade;\n${sh.fragmentShader}`.replace(
    '#include <lights_fragment_end>',
    `#include <lights_fragment_end>
  #if NUM_DIR_LIGHTS > 0
  float sunFull = dot(directionalLights[0].color, vec3(1.0));
  float shaded = sunFull > 0.0 ? (1.0 - dot(directLight.color, vec3(1.0)) / sunFull) / ${SHADOW_INTENSITY.toFixed(3)} : 0.0;
  if (dot(geometryNormal, directLight.direction) < 0.0) shaded = 1.0;
  vec3 shade = mix(vec3(1.0), uShade, clamp(shaded, 0.0, 1.0));
  reflectedLight.directDiffuse *= shade;
  reflectedLight.indirectDiffuse *= shade;
  #endif`,
  );
}

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
  const m = new THREE.MeshToonMaterial({ ...opts, gradientMap: BANDS });
  // The wrappers of materials.ts put their own in place of this one, and that calls addShade from addGlow.
  m.onBeforeCompile = addShade;
  return m;
}

/** The thing the ground and the walls are, across all chunks: otherwise the ink would draw the edge of every chunk. */
export const TERRAIN_THING = 255;

/** The id of a mesh in the ink's red channel: 0 is the empty, 255 the terrain. Two things that meet with the same id only lose the line between them. */
export function thingOf(o: { id: number; userData: { inkThing?: number } }): number {
  return o.userData.inkThing ?? 1 + (o.id % 254);
}

const INK = `uniform sampler2D tDiffuse;
uniform sampler2D tIds;
uniform sampler2D tDepth;
uniform vec2 uTexel;
uniform float uNear;
uniform float uFar;
uniform vec2 uDepthEdge;
uniform vec2 uFog;
varying vec2 vUv;
vec3 ids;
// One over the view depth: on a plane it changes evenly across the screen, so a slope seen at a low angle does not look like a jump.
float inverseDepth(vec2 uv) {
  float z = texture2D(tDepth, uv).x * 2.0 - 1.0;
  return (uFar + uNear - z * (uFar - uNear)) / (2.0 * uNear * uFar);
}
float differs(vec2 o) {
  vec3 d = abs(texture2D(tIds, vUv + o * uTexel).rgb - ids);
  return max(d.r, max(d.g, d.b)) > 0.002 ? 1.0 : 0.0;
}
void main() {
  vec4 c = texture2D(tDiffuse, vUv);
  ids = texture2D(tIds, vUv).rgb;
  // Where the thing or the part changes. The corners count less: without samples of its own this is what keeps a diagonal from being a staircase.
  float sides = max(max(differs(vec2(1.0, 0.0)), differs(vec2(-1.0, 0.0))), max(differs(vec2(0.0, 1.0)), differs(vec2(0.0, -1.0))));
  float corners = max(max(differs(vec2(1.0, 1.0)), differs(vec2(-1.0, 1.0))), max(differs(vec2(1.0, -1.0)), differs(vec2(-1.0, -1.0))));
  float edge = max(sides, corners * 0.5);
  // Where the depth jumps, in tiles: within one part too (the tiers of a pine), not between its voxels.
  float i0 = inverseDepth(vUv);
  vec2 dx = vec2(uTexel.x, 0.0);
  vec2 dy = vec2(0.0, uTexel.y);
  float ix0 = inverseDepth(vUv - dx), ix1 = inverseDepth(vUv + dx), iy0 = inverseDepth(vUv - dy), iy1 = inverseDepth(vUv + dy);
  float jump = max(abs(ix0 + ix1 - 2.0 * i0), abs(iy0 + iy1 - 2.0 * i0)) / (i0 * i0);
  edge = max(edge, smoothstep(uDepthEdge.x, uDepthEdge.y, jump));
  // What the air has taken has no ink either: a dark line over a shape that fades would stand out of the distance.
  // By the nearest of the pixels around: on the sky's side of a shape the line belongs to the shape.
  float nearest = 1.0 / max(i0, max(max(ix0, ix1), max(iy0, iy1)));
  edge *= 1.0 - smoothstep(uFog.x, uFog.y, nearest);
  // Nothing over what gives light: its alpha in this frame says so (U.glowMask).
  edge *= clamp(c.a, 0.0, 1.0);
  // Ink: the colour itself, much darker (dark blue-brown, not black), as in hand-inked cartoons.
  vec3 ink = c.rgb * 0.18 + vec3(0.03, 0.03, 0.05);
  gl_FragColor = vec4(mix(c.rgb, ink, edge * 0.9), c.a);
}`;

/**
 * Ink outlines from ids, never from the voxels' faces: before the frame, the scene is drawn once more into a target with a depth
 * texture, each mesh with the ids of its own material (`idsOf`, never one override for all: the circle clip and the cut above the
 * head stay, or the simulation hidden beyond the circle would show its outlines around the corona, T98). The pass darkens where the
 * thing or the part changes or the depth jumps. The width is in CSS pixels, so the line looks the same at any `devicePixelRatio`.
 */
export class Ink {
  readonly pass: ShaderPass;
  private target = new THREE.WebGLRenderTarget(1, 1, { depthTexture: new THREE.DepthTexture(1, 1), minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false });
  /** The materials swapped for their ids while `prepare` draws, to put back after. */
  private swapped: [THREE.Mesh, THREE.Material | THREE.Material[]][] = [];
  private clearColor = new THREE.Color();

  constructor(
    private scene: THREE.Scene,
    private camera: THREE.PerspectiveCamera,
    /** The material that stands in for each one (`idsOf` of materials.ts, passed in: materials imports this file). */
    private idsOf: (m: THREE.Material) => THREE.Material | undefined,
  ) {
    this.pass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        tIds: { value: null },
        tDepth: { value: null },
        uTexel: { value: new THREE.Vector2(1, 1) },
        uNear: { value: 0.1 },
        uFar: { value: 1000 },
        uDepthEdge: { value: new THREE.Vector2(0.6, 1.1) },
        uFog: { value: new THREE.Vector2(1e6, 1e6 + 1) },
      },
      vertexShader: 'varying vec2 vUv;\nvoid main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: INK,
    });
    // ShaderPass clones its uniforms (textures too): the targets go in after.
    this.pass.uniforms.tIds.value = this.target.texture;
    this.pass.uniforms.tDepth.value = this.target.depthTexture;
  }

  setSize(w: number, h: number, dpr: number): void {
    this.target.setSize(Math.floor(w * dpr), Math.floor(h * dpr));
    // One CSS pixel, not one of the target: the line stays as wide on any screen.
    (this.pass.uniforms.uTexel.value as THREE.Vector2).set(1 / w, 1 / h);
  }

  /** Draws the ids and the depth of the frame (before the composer). */
  prepare(gl: THREE.WebGLRenderer): void {
    this.pass.uniforms.uNear.value = this.camera.near;
    this.pass.uniforms.uFar.value = this.camera.far;
    const bg = this.scene.background;
    const fog = this.scene.fog;
    if (fog instanceof THREE.Fog) (this.pass.uniforms.uFog.value as THREE.Vector2).set(fog.near, Math.max(fog.far, fog.near + 1));
    const updateShadows = gl.shadowMap.autoUpdate;
    const clearAlpha = gl.getClearAlpha();
    gl.getClearColor(this.clearColor);
    this.scene.background = null;
    // Ids need no shadows, and the frame right after draws them anyway.
    gl.shadowMap.autoUpdate = false;
    this.swap();
    gl.setRenderTarget(this.target);
    gl.setClearColor(0x000000, 1);
    gl.render(this.scene, this.camera);
    gl.setRenderTarget(null);
    this.restore();
    gl.setClearColor(this.clearColor, clearAlpha);
    gl.shadowMap.autoUpdate = updateShadows;
    this.scene.background = bg;
  }

  private swap(): void {
    this.scene.traverseVisible((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.material) return;
      const was = mesh.material;
      // Lines, points and sprites have no surface to outline: they stay out of the target.
      const of = (m: THREE.Material) => (mesh.isMesh ? this.idsOf(m) : undefined) ?? HIDDEN;
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

/** What draws nothing in the ids (a material that is not drawn). */
const HIDDEN = new THREE.MeshBasicMaterial({ visible: false });
