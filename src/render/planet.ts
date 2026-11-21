// The planets seen from space (T449, ADR-0236, `docs/design/acqua-spazio.md` § 2.7): a planet's globe at a definition that grows with the
// nearness. Its levels of detail (`PlanetLod`, src/kernel/planets.ts) are precomputed from its generator a few cells at a time, in the pauses
// between frames, and kept in the browser (`localStorage`, a few kilobytes a planet): from the whole planet in cells of 32 768 tiles to the
// tile. Each level is a mesh of voxels on the globe, around the planet's centre: as one comes near, a finer level fades in over the coarser
// one with a complementary dither (every pixel is one level's or the other's: never both, never a jump), and at the landing the true places
// take the place of the last one. Rendering only: nothing here is data, nothing goes on the wire, the kernel never reads it.
//
// The globe is drawn in a pass of its own before the world (`Bloom.background`), with a camera that is the world's but for its near and far
// planes, which follow the altitude: at a million tiles and at ten the depth has the same precision. Its geometry is relative to the planet's
// centre, put in real space in double precision (the origin that moves).

import * as THREE from 'three';
import type { Kernel } from '../kernel/kernel';
import { cellHeight, globePoint, GLOBE_RADIUS, LOD_CELLS, LOD_VERSION, lodCell, lodPoint, lodWanted, onGlobe, PlanetLod, planetPlace } from '../kernel/planets';
import { LEVEL } from '../kernel/relief';
import { SUN_FROM } from './cartoon';
import { Stars } from './stars';

/** Interleaved gradient noise: a dither of the screen that every level reads the same, so two levels complement each other pixel by pixel. */
const DITHER = 'float ditherAt(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }';

/** Below this altitude (tiles) the true places of the landing are drawn and the levels leave them a hole; above, the levels alone. */
export const PLACES_BELOW = 160;
/** How many levels coarser than the wanted one are still drawn: the ground seen in 3/4 reaches about four times as far as the finest square. */
const BELOW = 5;
/** At most this many levels' meshes are kept on the GPU; the rest are made again when they are wanted. */
const KEPT = 10;
/** The pauses between frames given to the levels (ms of work, every `PUMP_EVERY` ms): more during a voyage. */
const PUMP_IDLE = 5;
const PUMP_VOYAGE = 14;
const PUMP_EVERY = 40;

type LevelUniforms = { uShow: { value: number }; uInner: { value: number }; uInnerShow: { value: number }; uHole: { value: THREE.Vector4 }; uHoleOn: { value: number } };

/** The material of a level: lit, its colours per voxel, dithered in and out, a square left to the finer level, a hole left to the places. */
function levelMaterial(): THREE.MeshLambertMaterial & { userData: { u: LevelUniforms } } {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide }) as THREE.MeshLambertMaterial & { userData: { u: LevelUniforms } };
  const u: LevelUniforms = { uShow: { value: 1 }, uInner: { value: 0 }, uInnerShow: { value: 0 }, uHole: { value: new THREE.Vector4() }, uHoleOn: { value: 0 } };
  m.userData.u = u;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = `attribute vec2 cell;\nvarying vec2 vCell;\n${sh.vertexShader}`.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vCell = cell;');
    sh.fragmentShader = `uniform float uShow;\nuniform float uInner;\nuniform float uInnerShow;\nuniform vec4 uHole;\nuniform float uHoleOn;\nvarying vec2 vCell;\n${DITHER}\n${sh.fragmentShader}`.replace(
      'void main() {',
      `void main() {
  float dth = ditherAt(gl_FragCoord.xy);
  if (dth >= uShow) discard;
  if (max(abs(vCell.x), abs(vCell.y)) < uInner && dth < uInnerShow) discard;
  if (uHoleOn > 0.5 && vCell.x > uHole.x && vCell.x < uHole.z && vCell.y > uHole.y && vCell.y < uHole.w) discard;`,
    );
  };
  m.customProgramCacheKey = () => 'planet-lod';
  return m;
}

/** 0 below, 1 above, smooth between. */
const smooth = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

const rgbOf = (hex: string | undefined, k = 1): [number, number, number] => {
  const c = new THREE.Color(hex ?? '#3a5f8a');
  return [c.r * k, c.g * k, c.b * k];
};

/**
 * The mesh of a level of a planet: a voxel for every cell on the globe, its top at its height and its sides down to the lower neighbours (to
 * under the surface at the edge of the level, so that no gap shows under a finer one). Relative to the planet's centre at the sea's level.
 */
export function levelGeometry(k: Kernel, band: number, L: number, codes: string): THREE.BufferGeometry {
  const N = LOD_CELLS;
  const c = lodCell(L);
  const S = k.config.chunkSize;
  const x0 = planetPlace(band, S) * S;
  const sea = k.seaLevel;
  const pal = k.palette;
  const cells = [...codes];
  const heights = new Float64Array(N * N).fill(NaN);
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const code = cells[j * N + i];
      if (!code || code === '?' || !onGlobe(L, i, j)) continue;
      const def = pal[code];
      const [px, py] = lodPoint(L, i, j);
      const relief = c <= 256 ? (Math.max(sea, k.relief.level(x0 + Math.floor(px), Math.floor(py))) - sea) * LEVEL : 0;
      heights[j * N + i] = def?.layer === 'liquid' ? 0 : cellHeight(def, c, relief);
    }
  const pos: number[] = [], nor: number[] = [], col: number[] = [], cell: number[] = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3(), n = new THREE.Vector3();
  const quad = (p: Array<[number, number, number]>, rgb: [number, number, number], cu: number, cv: number) => {
    a.set(...p[1]).sub(b.set(...p[0]));
    d.set(...p[2]).sub(b);
    n.crossVectors(a, d).normalize();
    for (const i of [0, 1, 2, 0, 2, 3]) {
      pos.push(...p[i]!);
      nor.push(n.x, n.y, n.z);
      col.push(...rgb);
      cell.push(cu, cv);
    }
  };
  const skirt = -Math.max(0.5, c * 0.4);
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const h = heights[j * N + i]!;
      if (Number.isNaN(h)) continue;
      const def = pal[cells[j * N + i]!];
      const u0 = (i - N / 2) * c, v0 = (j - N / 2) * c, u1 = u0 + c, v1 = v0 + c;
      const cu = u0 + c / 2, cv = v0 + c / 2;
      const shade = 0.94 + ((i * 7 + j * 13) % 9) / 100;
      quad([globePoint(u0, v0, h), globePoint(u0, v1, h), globePoint(u1, v1, h), globePoint(u1, v0, h)], rgbOf(def?.color, shade), cu, cv);
      const side = rgbOf(def?.color, 0.7 * shade);
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const ni = i + di, nj = j + dj;
        const inside = ni >= 0 && nj >= 0 && ni < N && nj < N;
        const nh = inside && !Number.isNaN(heights[nj * N + ni]!) ? heights[nj * N + ni]! : skirt;
        if (nh >= h) continue;
        const [ea, eb]: Array<[number, number]> = di === 1 ? [[u1, v0], [u1, v1]] : di === -1 ? [[u0, v1], [u0, v0]] : dj === 1 ? [[u1, v1], [u0, v1]] : [[u0, v0], [u1, v0]];
        quad([globePoint(ea[0], ea[1], h), globePoint(eb[0], eb[1], h), globePoint(eb[0], eb[1], nh), globePoint(ea[0], ea[1], nh)], side, cu, cv);
      }
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('cell', new THREE.Float32BufferAttribute(cell, 2));
  g.computeBoundingSphere();
  return g;
}

/** What the renderer asks of the planets this frame: the planet seen, how high over its landing, the sky's colour near its ground. */
export interface PlanetSight {
  band: number;
  altitude: number;
  sky?: THREE.Color;
}

/** Where the cache keeps a planet's levels. */
const cacheKey = (k: Kernel, band: number) => `quine:pianeta:v${LOD_VERSION}:${k.planetSignature(band)}`;

export class Planets {
  /** The scene and the camera of the pass before the world's (`Bloom.background`). */
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(38, 1, 1, 1e7);
  private globe = new THREE.Group();
  private stars = new Stars(4243);
  private lods = new Map<number, PlanetLod>();
  private meshes = new Map<string, { mesh: THREE.Mesh; used: number }>();
  private timer?: ReturnType<typeof setTimeout>;
  private frame = 0;
  /** The planet a voyage is going to or leaving: its levels come first. */
  private wanted?: number;
  private voyage = false;
  /** Whether the levels' program and the stars' are on the GPU (`warm`). */
  private compiled = false;
  /** The planets whose relief is made. */
  private warmed = new Set<number>();
  /** Cells sampled so far and the milliseconds it took (for `stats`). */
  private sampled = 0;
  private spent = 0;

  constructor(private k: Kernel) {
    this.scene.add(new THREE.HemisphereLight(0xdcecff, 0x30281e, 0.9));
    const sun = new THREE.DirectionalLight(0xfff0d8, 2);
    sun.position.set(...SUN_FROM);
    this.scene.add(sun, this.globe, this.stars.root);
    // The stars behind everything of the pass: drawn first, writing no depth (the globe covers them).
    this.stars.root.traverse((o) => {
      if (!(o instanceof THREE.Points)) return;
      const m = o.material as THREE.PointsMaterial;
      m.transparent = false;
      m.opacity = 1;
      m.depthWrite = false;
      o.renderOrder = -1;
    });
    this.scene.background = new THREE.Color('#05060c');
    this.pump();
  }

  /** A planet's levels: those kept in the browser, or none yet. */
  lod(band: number): PlanetLod {
    let lod = this.lods.get(band);
    if (!lod) {
      let saved: unknown;
      try {
        saved = JSON.parse(globalThis.localStorage?.getItem(cacheKey(this.k, band)) ?? 'null');
      } catch {
        saved = null;
      }
      lod = new PlanetLod(Array.isArray(saved) ? saved : undefined);
      this.lods.set(band, lod);
    }
    return lod;
  }

  /** The levels are filled in the pauses between frames: the planet a voyage wants first, then the others, from the coarsest. */
  private pump(): void {
    if (typeof setTimeout !== 'function') return;
    this.timer = setTimeout(() => {
      const n = this.k.planets().length;
      if (n) {
        const order = [...(this.wanted ? [this.wanted] : []), ...Array.from({ length: n }, (_, i) => i + 1)];
        const band = order.find((b) => !this.lod(b).done);
        // Every level made: each planet's relief once (a few hundred milliseconds of MarkovJunior the first time a tile of its band is
        // asked for), here in a pause rather than at the jump of a voyage or at the first level that reads it.
        const cold = band === undefined ? order.find((b) => !this.warmed.has(b)) : undefined;
        if (cold !== undefined) {
          this.warmed.add(cold);
          const S = this.k.config.chunkSize;
          this.k.relief.level(planetPlace(cold, S) * S, 0);
        }
        if (band !== undefined) {
          const lod = this.lod(band);
          const before = lod.ready;
          const start = performance.now();
          const stop = start + (this.voyage ? PUMP_VOYAGE : PUMP_IDLE);
          this.sampled += lod.fill((x, y) => this.k.planetTile(band, x, y), () => performance.now() < stop);
          this.spent += performance.now() - start;
          if (lod.ready > before)
            try {
              globalThis.localStorage?.setItem(cacheKey(this.k, band), JSON.stringify(lod.codes.slice(0, lod.ready)));
            } catch {
              // A full storage: the levels are made again next time.
            }
        }
      }
      this.pump();
    }, PUMP_EVERY);
  }

  private meshOf(band: number, L: number, codes: string): THREE.Mesh {
    const key = `${band}:${L}`;
    let got = this.meshes.get(key);
    if (!got) {
      const mesh = new THREE.Mesh(levelGeometry(this.k, band, L, codes), levelMaterial());
      mesh.frustumCulled = false;
      this.globe.add(mesh);
      this.meshes.set(key, (got = { mesh, used: this.frame }));
      // The least used beyond the kept ones go.
      if (this.meshes.size > KEPT) {
        const [old] = [...this.meshes.entries()].filter(([k2]) => k2 !== key).sort((x, y) => x[1].used - y[1].used);
        if (old) this.drop(old[0]);
      }
    }
    got.used = this.frame;
    return got.mesh;
  }

  private drop(key: string): void {
    const got = this.meshes.get(key);
    if (!got) return;
    this.globe.remove(got.mesh);
    got.mesh.geometry.dispose();
    (got.mesh.material as THREE.Material).dispose();
    this.meshes.delete(key);
  }

  /**
   * The planet this frame, if one is seen (a voyage leaving or reaching it): its globe at the levels the altitude wants, the world's camera
   * with its own planes, the sky. False if there is nothing to draw (no planet, or none of its levels yet): the world's pass is the only one.
   * `main` the world's camera, `height` the screen's in pixels, (ox, oy) the scroll of the carpet, `hole` the places drawn (carpet tiles).
   */
  show(sight: PlanetSight | undefined, main: THREE.PerspectiveCamera, height: number, ox: number, oy: number, hole?: { x0: number; y0: number; x1: number; y1: number }, vehicle?: THREE.Vector3): boolean {
    this.frame++;
    this.voyage = !!sight;
    this.wanted = sight && sight.band > 0 ? sight.band : undefined;
    if (!sight || sight.band < 1 || sight.band > this.k.planets().length) return (this.globe.visible = false);
    const lod = this.lod(sight.band);
    if (!lod.ready) return (this.globe.visible = false);
    this.globe.visible = true;
    const S = this.k.config.chunkSize;
    const cx = planetPlace(sight.band, S) * S;
    const seaY = this.k.seaLevel * LEVEL;
    // The planet's centre in real space, in double precision: the geometry is relative to it. Far away the globe is turned about the vehicle
    // toward where the camera looks (in 3/4 what is straight under the vehicle is out of the frame): coming near, it goes back under it, and
    // from a few thousand tiles it is where the kernel has it, its landing under the vehicle.
    const R = GLOBE_RADIUS;
    const P = new THREE.Vector3(cx - ox, seaY, -oy);
    const V = vehicle ?? P;
    const w = smooth((Math.log(Math.max(1, sight.altitude)) - Math.log(R / 30)) / (Math.log(2 * R) - Math.log(R / 30)));
    const look = main.getWorldDirection(new THREE.Vector3());
    const turn = new THREE.Quaternion().slerp(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), look), w);
    this.globe.quaternion.copy(turn);
    this.globe.position.copy(P).sub(V).applyQuaternion(turn).add(V);
    // The world's camera, its planes from the altitude: the nearest ground to the horizon.
    this.camera.position.copy(main.position);
    this.camera.quaternion.copy(main.quaternion);
    this.camera.fov = main.fov;
    this.camera.aspect = main.aspect;
    const centre = new THREE.Vector3(0, -R, 0).applyQuaternion(turn).add(this.globe.position);
    const h = Math.max(1, this.camera.position.distanceTo(centre) - R);
    this.camera.near = Math.max(0.3, h * 0.3);
    this.camera.far = 1.25 * Math.sqrt(h * (2 * R + h)) + h + 2000;
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
    this.stars.around(this.camera, this.camera.near * 2);
    // The sky near an earth's ground: blue under the air, black above it; the stars only where it is dark.
    const air = sight.sky ? Math.min(1, Math.max(0, (Math.log(4000) - Math.log(Math.max(1, sight.altitude))) / Math.log(4000 / 120))) : 0;
    (this.scene.background as THREE.Color).set('#05060c').lerp(sight.sky ?? new THREE.Color('#05060c'), air);
    this.stars.root.visible = air < 0.65;
    // The levels: the one wanted fading in over the coarser, which leave it its square.
    const want = lodWanted(h, (main.fov * Math.PI) / 180 / Math.max(1, height));
    const full = Math.min(Math.floor(want), lod.ready - 1);
    const last = Math.min(lod.ready - 1, Math.floor(want) + 1);
    const showOf = (L: number) => (L <= full ? 1 : L === last ? want - Math.floor(want) : 0);
    const first = Math.max(0, full - BELOW);
    const holeOn = !!hole && sight.altitude < PLACES_BELOW;
    for (const [key, got] of this.meshes) {
      const [b, L] = key.split(':').map(Number);
      got.mesh.visible = b === sight.band && L! >= first && L! <= last;
    }
    for (let L = first; L <= last; L++) {
      const mesh = this.meshOf(sight.band, L, lod.codes[L]!);
      mesh.visible = true;
      const u = (mesh.material as ReturnType<typeof levelMaterial>).userData.u;
      u.uShow.value = showOf(L);
      u.uInner.value = L < last ? (lodCell(L + 1) * LOD_CELLS) / 2 : 0;
      u.uInnerShow.value = L < last ? showOf(L + 1) : 0;
      u.uHoleOn.value = holeOn ? 1 : 0;
      if (holeOn && hole) u.uHole.value.set(hole.x0 - cx, hole.y0, hole.x1 - cx, hole.y1);
    }
    return true;
  }

  /**
   * The programs of the pass made before they are seen (as the corona's ring, T226): once a planet has its coarsest level, it is drawn once into
   * `target` (a pixel, the bloom's type), so that the first frame of a voyage does not wait for them.
   */
  warm(gl: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget): void {
    if (this.compiled) return;
    const band = Array.from({ length: this.k.planets().length }, (_, i) => i + 1).find((b) => this.lod(b).ready > 0);
    if (band === undefined) return;
    this.compiled = true;
    const mesh = this.meshOf(band, 0, this.lod(band).codes[0]!);
    const shown = this.globe.visible;
    this.globe.visible = mesh.visible = true;
    this.stars.root.visible = true;
    const was = gl.getRenderTarget();
    gl.setRenderTarget(target);
    gl.render(this.scene, this.camera);
    gl.setRenderTarget(was);
    this.globe.visible = shown;
  }

  /** What the levels cost (for `misura-frame` and the console): levels ready per planet, meshes, triangles and bytes on the GPU, the sampling. */
  stats(): { ready: Record<number, number>; meshes: number; triangles: number; bytes: number; sampled: number; ms: number } {
    let triangles = 0, bytes = 0;
    for (const { mesh } of this.meshes.values()) {
      const g = mesh.geometry;
      triangles += g.getAttribute('position').count / 3;
      for (const a of Object.values(g.attributes)) bytes += (a as THREE.BufferAttribute).array.byteLength;
    }
    const ready: Record<number, number> = {};
    for (const [b, lod] of this.lods) ready[b] = lod.ready;
    return { ready, meshes: this.meshes.size, triangles, bytes, sampled: this.sampled, ms: Math.round(this.spent) };
  }

  dispose(): void {
    if (this.timer) clearTimeout(this.timer);
    for (const key of [...this.meshes.keys()]) this.drop(key);
  }
}

/** All the levels at once, for a page that has no pauses to wait for (the lab, a test): sampled now. */
export function fillNow(k: Kernel, band: number, lod = new PlanetLod()): PlanetLod {
  lod.fill((x, y) => k.planetTile(band, x, y), () => true);
  return lod;
}

