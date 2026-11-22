// The sea on screen (T451, P8 of docs/design/acqua-spazio.md § 1.7): waves, foam on the shores, the wake and the roll. Rendering only:
// nothing here is data, nothing goes on the wire, the kernel never reads it. The swell is a sum of three sines of where a vertex is (in
// carpet coordinates, so the waves stay on the sea as the carpet scrolls) and of the time; the same sum runs in the water's vertex shader
// (`SEA_GLSL`, made from the same numbers) and here (`swellAt`), so what floats on it (a swimmer, a wake) rides the waves it sees.
// The water is still where it meets anything that is not water of its own level (`seaWeight`): the banks reach the water's rest level
// there, so a wave never opens a slit under a bank; the open sea moves fully.

import * as THREE from 'three';
import type { Kernel } from '../kernel/kernel';
import { clipped, lit } from './materials';
import { FOAM_LIFT, FoamStrips, seaLift, seaWeight, SWELL, SWELL_MAX, type FoamArrays } from './seawave';

// The numbers of the swell and the foam's strips live apart from three.js (seawave.ts, T486); here as they were.
export { cornerWeight, FOAM_LIFT, FOAM_WIDTH, foamPhase, FoamStrips, phaseAttribute, seaLift, seaWeight, SWELL, SWELL_MAX, swellAt, swellPhases, waveAttribute, type FoamArrays } from './seawave';

const f = (v: number) => v.toFixed(4);

/** The same swell for the shaders, and its slope (for the normal): `seaSwell(ph, t)`, `seaSlope(ph, t)`, from the phases of the vertex. */
export const SEA_GLSL = `float seaSwell(vec3 ph, float t) {
  return ${SWELL.map(({ w, a }, i) => `${f(a)} * sin(ph[${i}] + t * ${f(w)})`).join('\n    + ')};
}
vec2 seaSlope(vec3 ph, float t) {
  return ${SWELL.map(({ dir, k, w, a }, i) => `${f(a)} * ${f(k)} * vec2(${f(dir[0])}, ${f(dir[1])}) * cos(ph[${i}] + t * ${f(w)})`).join('\n    + ')};
}`;

/** The top of a water tile as the chunks draw it (the relief plus the water's level, `waterY`), undefined for anything else. */
export function waterTopOf(k: Kernel, waterY: number): (x: number, z: number) => number | undefined {
  const pal = k.palette;
  return (x, z) => (pal[k.tileAt(x, z) ?? '']?.layer === 'liquid' ? k.groundAt(x, z) + waterY : undefined);
}

// --- The materials -------------------------------------------------------------------------------------------------------------------

/** What the water's vertices add, before three's: the swell's height and its slope as the normal, weighted by `wave`. */
const WAVE_PARS = `attribute float wave;\nattribute vec3 seaPhase;\n${SEA_GLSL}\n`;
const WAVE_NORMAL = `#include <beginnormal_vertex>
  vec2 seaS = wave * seaSlope(seaPhase, uTime);
  objectNormal = normalize(vec3(-seaS.x, 1.0, -seaS.y));`;
const WAVE_BEGIN = `#include <begin_vertex>
  transformed.y += wave * seaSwell(seaPhase, uTime);`;

/** Adds to a clipped material (materials.ts) what moves its vertices with the swell; the ink's ids move the same (`userData.pars`, `userData.begin`). */
function waving<M extends THREE.Material>(m: M, extra?: (sh: THREE.WebGLProgramParametersWithUniforms) => void): M {
  const base = m.onBeforeCompile.bind(m);
  m.onBeforeCompile = (sh, r) => {
    base(sh, r);
    sh.vertexShader = `${WAVE_PARS}${sh.vertexShader}`.replace('#include <beginnormal_vertex>', WAVE_NORMAL).replace('#include <begin_vertex>', WAVE_BEGIN);
    extra?.(sh);
  };
  m.userData.pars = WAVE_PARS;
  m.userData.begin = WAVE_BEGIN;
  return m;
}

/** What the ink leaves alone (foam and wake: soft, they are not edges). */
const noInk = <M extends THREE.Material>(m: M): M => ((m.userData.noInk = true), m);

/** The foam's colour. */
export const FOAM = '#eef7fa';

/**
 * The foam on the shore: a strip along the edge (`foam` 0 at the shore, 1 where the strip ends) that breathes, coming in and out with a
 * phase along the shore, and a thin line at its front.
 */
const FOAM_FRAGMENT = `#include <dithering_fragment>
  float foamReach = 0.62 + 0.28 * sin(uTime * 1.1 + vFoamPhase);
  float foamBody = 1.0 - smoothstep(foamReach - 0.4, foamReach, vFoam);
  float foamLine = (1.0 - smoothstep(0.0, 0.07, abs(vFoam - foamReach - 0.1))) * 0.55;
  gl_FragColor.a *= max(foamBody * 0.8, foamLine);`;

/** The crests of the swell lighter, the troughs a little darker: the cartoon's bands would not show a slope this gentle. */
const CREST_FRAGMENT = `#include <color_fragment>
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.45 + 0.035, smoothstep(0.3, 0.85, vSeaH));
  diffuseColor.rgb *= 1.0 - 0.14 * smoothstep(0.3, 0.85, -vSeaH);`;

export const SEA_MAT = {
  /** The water: the swell moves it and bends its light, its crests lighter (`vSeaH`, the swell over its highest). */
  water: waving(clipped(lit({ vertexColors: true }), 'water'), (sh) => {
    sh.vertexShader = `varying float vSeaH;\n${sh.vertexShader}`.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>\n  vSeaH = wave * seaSwell(seaPhase, uTime) / ${SWELL_MAX.toFixed(4)};`,
    );
    sh.fragmentShader = `varying float vSeaH;\n${sh.fragmentShader}`.replace('#include <color_fragment>', CREST_FRAGMENT);
  }),
  /** The foam on the shores, riding the swell as the water does. */
  foam: noInk(
    waving(clipped(lit({ color: FOAM, transparent: true, depthWrite: false }), 'foam'), (sh) => {
      sh.vertexShader = `attribute float foam;\nattribute float foamPhase;\nvarying float vFoam;\nvarying float vFoamPhase;\n${sh.vertexShader}`.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n  vFoam = foam;\n  vFoamPhase = foamPhase;',
      );
      sh.fragmentShader = `uniform float uTime;\nvarying float vFoam;\nvarying float vFoamPhase;\n${sh.fragmentShader}`.replace('#include <dithering_fragment>', FOAM_FRAGMENT);
    }),
  ),
  /** The wake: puffs of foam fading by their `alpha`. */
  wake: noInk(clipped(lit({ color: FOAM, transparent: true, depthWrite: false }), 'wake')),
};
SEA_MAT.foam.userData.foam = true;

// --- The foam on the shores ---------------------------------------------------------------------------------------------------------

/** The strips of foam along the shores of the water tiles, in carpet coordinates, with their `foam` and `wave`, and their mesh. */
export class FoamBuilder extends FoamStrips {
  /** The strips' mesh, its vertices relative to `origin` (carpet x and z: the place's, T449), its phases from where they really are. */
  geometry(origin: readonly [number, number] = [0, 0]): THREE.BufferGeometry {
    return foamGeometry(this.arrays(origin));
  }
}

/** The mesh of the foam's strips from their arrays (made here or in a worker, T486): the arrays are its own. */
export function foamGeometry(a: FoamArrays): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(a.position, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(a.normal, 3));
  g.setAttribute('seaPhase', new THREE.BufferAttribute(a.seaPhase, 3));
  g.setAttribute('foamPhase', new THREE.BufferAttribute(a.foamPhase, 1));
  g.setAttribute('foam', new THREE.BufferAttribute(a.foam, 1));
  g.setAttribute('wave', new THREE.BufferAttribute(a.wave, 1));
  g.setAttribute('glow', new THREE.BufferAttribute(a.glow, 1));
  g.setAttribute('alpha', new THREE.BufferAttribute(a.alpha, 1));
  g.computeBoundingSphere();
  return g;
}

// --- The roll -----------------------------------------------------------------------------------------------------------------------

/** How far a hull rolls and pitches on the open sea at rest (radians), and how far it heels into a turn at most. */
export const ROLL = { roll: 0.04, pitch: 0.018, heel: 0.1 };

/**
 * The roll and the pitch of a hull at time t (radians, about its own forward and side axes): the swell rocks it as much as the sea moves
 * where it floats (`sea` 0…1), and a turn at way heels it outward (`speed` tiles a second, `turn` radians a second).
 */
export function rollOf(t: number, phase: number, sea: number, speed: number, turn: number): { roll: number; pitch: number } {
  const rock = 0.35 + 0.65 * Math.max(0, Math.min(1, sea));
  const heel = Math.max(-ROLL.heel, Math.min(ROLL.heel, turn * speed * 0.03));
  return {
    roll: rock * ROLL.roll * (Math.sin(t * 1.25 + phase) + 0.3 * Math.sin(t * 2.9 + phase * 1.9)) + heel,
    pitch: rock * ROLL.pitch * Math.sin(t * 0.95 + phase * 1.7),
  };
}

// --- The wake -----------------------------------------------------------------------------------------------------------------------

/** How long a puff of the wake lives (seconds), how far apart they are dropped (tiles), the way under which a hull leaves none. */
export const WAKE = { life: 2.6, every: 0.32, slow: 0.45, max: 480 };

/** A point of a wake: where (carpet), the heading of the hull, when it was dropped, how strong (the way then), how wide the stern. */
export interface WakePoint {
  x: number;
  z: number;
  heading: number;
  born: number;
  strength: number;
  half: number;
}

/** A puff of the wake at its age: where its middle is, how big, how opaque. Two arms spreading behind the stern, and the churn behind it. */
export function wakePuffs(p: WakePoint, t: number): Array<{ x: number; z: number; r: number; alpha: number }> {
  const age = t - p.born;
  if (age < 0 || age >= WAKE.life) return [];
  const fade = Math.pow(1 - age / WAKE.life, 1.5) * p.strength;
  // Across the hull: forward is (sin, cos), its right (cos, −sin).
  const lx = Math.cos(p.heading), lz = -Math.sin(p.heading);
  const out: Array<{ x: number; z: number; r: number; alpha: number }> = [];
  const spread = p.half * 0.7 + age * 0.55;
  for (const s of [-1, 1]) out.push({ x: p.x + lx * s * spread, z: p.z + lz * s * spread, r: 0.12 + age * 0.16, alpha: 0.7 * fade });
  if (age < WAKE.life * 0.5) out.push({ x: p.x, z: p.z, r: 0.16 + age * 0.12, alpha: 0.55 * fade * (1 - age / (WAKE.life * 0.5)) });
  return out;
}

/** Whether a hull at this way drops a puff: it has gone `every` tiles since the last, at more than `slow`. */
export function dropsWake(travelled: number, speed: number): boolean {
  return Math.abs(speed) > WAKE.slow && travelled >= WAKE.every;
}

const SIDES = 8;
const PUFF_VERTS = SIDES * 3;

/** What the sea knows of a hull between two frames. */
interface Hull {
  x: number;
  z: number;
  yaw: number;
  speed: number;
  turn: number;
  travelled: number;
  phase: number;
  /** Its stern behind its middle and its half width (tiles), from its view. */
  stern?: number;
  half?: number;
}

/**
 * The wakes and the roll of the vehicles that float (T451): one mesh of puffs for every wake, in carpet coordinates in the world's group,
 * its buffers made once; the roll set on the body of each hull's view.
 */
export class Sea {
  private hulls = new Map<number, Hull>();
  private points: WakePoint[] = [];
  private mesh: THREE.Mesh;
  private pos: Float32Array;
  private alpha: Float32Array;

  constructor(world: THREE.Object3D) {
    const n = WAKE.max * 3 * PUFF_VERTS;
    this.pos = new Float32Array(n * 3);
    this.alpha = new Float32Array(n);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
    g.setAttribute('glow', new THREE.BufferAttribute(new Float32Array(n), 1));
    g.setDrawRange(0, 0);
    this.mesh = new THREE.Mesh(g, SEA_MAT.wake);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1;
    world.add(this.mesh);
  }

  /**
   * A hull this frame: where it is (carpet), where its bow points, its body (rolled here) and the root it stands on. Only what floats on
   * water is rocked and leaves a wake; a hull on land is set straight.
   */
  hull(id: number, x: number, z: number, yaw: number, root: THREE.Object3D, body: THREE.Object3D, dt: number, t: number, waterTop: (x: number, z: number) => number | undefined): void {
    let h = this.hulls.get(id);
    if (!h) this.hulls.set(id, (h = { x, z, yaw, speed: 0, turn: 0, travelled: 0, phase: (id * 0.917) % (2 * Math.PI) }));
    const moved = Math.hypot(x - h.x, z - h.z);
    const fwd = (x - h.x) * Math.sin(yaw) + (z - h.z) * Math.cos(yaw);
    const dyaw = Math.atan2(Math.sin(yaw - h.yaw), Math.cos(yaw - h.yaw));
    const ease = Math.min(1, dt * 4);
    // A jump (a load, the carpet) is not way.
    if (dt > 0 && moved < 2) {
      h.speed += ((Math.sign(fwd) * moved) / dt - h.speed) * ease;
      h.turn += (dyaw / dt - h.turn) * ease;
      h.travelled += moved;
    }
    h.x = x;
    h.z = z;
    h.yaw = yaw;
    const afloat = waterTop(Math.floor(x), Math.floor(z)) !== undefined;
    if (!afloat) {
      body.rotation.x = 0;
      body.rotation.z = 0;
      h.travelled = 0;
      return;
    }
    const r = rollOf(t, h.phase, seaWeight(waterTop, x, z), h.speed, h.turn);
    body.rotation.z = r.roll;
    body.rotation.x = r.pitch;
    if (h.stern === undefined) Object.assign(h, sternOf(root, body));
    if (dropsWake(h.travelled, h.speed)) {
      h.travelled = 0;
      // The stern: behind the middle along the heading (ahead when going astern).
      const back = (h.speed >= 0 ? -1 : 1) * (h.stern ?? 0.5);
      if (this.points.length >= WAKE.max) this.points.shift();
      this.points.push({ x: x + Math.sin(yaw) * back, z: z + Math.cos(yaw) * back, heading: yaw, born: t, strength: Math.min(1, Math.abs(h.speed) / 3), half: h.half ?? 0.4 });
    }
  }

  /** The puffs of every wake now, riding the swell; the hulls not seen this frame forgotten. */
  update(t: number, seen: Set<number>, waterTop: (x: number, z: number) => number | undefined): void {
    for (const id of [...this.hulls.keys()]) if (!seen.has(id)) this.hulls.delete(id);
    this.points = this.points.filter((p) => t - p.born < WAKE.life);
    let v = 0;
    const cap = this.alpha.length;
    // The puffs relative to the first one's tile (T449): a wake a million tiles from the origin is as still as one at it.
    const ax = this.points.length ? Math.floor(this.points[0]!.x) : 0, az = this.points.length ? Math.floor(this.points[0]!.z) : 0;
    this.mesh.position.set(ax, 0, az);
    for (const p of this.points)
      for (const puff of wakePuffs(p, t)) {
        const top = waterTop(Math.floor(puff.x), Math.floor(puff.z));
        if (top === undefined || v + PUFF_VERTS > cap) continue;
        const y = top + seaLift(waterTop, puff.x, puff.z, t) + FOAM_LIFT * 1.4;
        for (let i = 0; i < SIDES; i++) {
          const a0 = (i * 2 * Math.PI) / SIDES, a1 = ((i + 1) * 2 * Math.PI) / SIDES;
          // Wound to face up: the middle, then the rim clockwise seen from above (x right, z down).
          for (const [px, pz] of [[puff.x, puff.z], [puff.x + Math.cos(a1) * puff.r, puff.z + Math.sin(a1) * puff.r], [puff.x + Math.cos(a0) * puff.r, puff.z + Math.sin(a0) * puff.r]]) {
            this.pos[v * 3] = px! - ax;
            this.pos[v * 3 + 1] = y;
            this.pos[v * 3 + 2] = pz! - az;
            this.alpha[v] = puff.alpha;
            v++;
          }
        }
      }
    const g = this.mesh.geometry;
    g.setDrawRange(0, v);
    (g.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (g.getAttribute('alpha') as THREE.BufferAttribute).needsUpdate = true;
    this.mesh.visible = v > 0;
  }

  /** How many puffs the wakes have now (for the tests and the console). */
  get puffs(): number {
    return this.mesh.geometry.drawRange.count / PUFF_VERTS;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
  }
}

/** The stern of a hull (how far behind its middle) and its half width, from the bounds of its body unturned. */
function sternOf(root: THREE.Object3D, body: THREE.Object3D): { stern: number; half: number } {
  const keep = { rx: body.rotation.x, rz: body.rotation.z };
  body.rotation.x = 0;
  body.rotation.z = 0;
  body.updateMatrix();
  const box = new THREE.Box3();
  body.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    const b = o.geometry.boundingBox!.clone();
    // In the root's frame: the body's and its children's own matrices, not the world's.
    const m = new THREE.Matrix4();
    for (let p: THREE.Object3D | null = o; p && p !== root; p = p.parent) {
      p.updateMatrix();
      m.premultiply(p.matrix);
    }
    box.union(b.applyMatrix4(m));
  });
  body.rotation.x = keep.rx;
  body.rotation.z = keep.rz;
  if (box.isEmpty()) return { stern: 0.5, half: 0.4 };
  return { stern: Math.max(0.3, -box.min.z), half: Math.max(0.2, (box.max.x - box.min.x) / 2) };
}

