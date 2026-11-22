// The 3D sandbox (step 8.2A): a small world where everything — land, trees, people, the house and its
// door — is a MarkovJunior program run whole, in 3D. The game stays 2D; this is the experiment that asks
// whether it should not. Nothing here touches the game or the universe.

import * as THREE from 'three';
import { makeRenderer } from '../../src/render/gpu';
import type { Grid3 } from '../../src/mj/engine';
import { compileMjx, type MjxModel } from '../../src/mj/model';
import { act, clipFrames } from '../../src/mj/run';
import { byId, CATALOG, GROUPS, withIncludes, type Entry } from './catalog';
import { floors, footprint, meshVoxels, type MeshData } from '../../src/mj/mesh';
import type { BuildRequest, BuildResponse, Built } from './worker';
import { makeLand, plan, type Land } from './world';
import { Bloom } from '../../src/render/bloom';
import { aerial, CARTOON } from '../../src/render/cartoon';
import { glowing, U, windy } from '../../src/render/materials';
import { bindLookButton, LabLook } from '../look';
import { startCardsList } from './cards';
import { attachPreviewTouch, COMPACT_QUERY, mountStick } from '../touch';
import { measureAt, readVpt, scaleFrom, showcaseDistance, shownVpt, withScale } from './scale';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

// ------------------------------------------------------------------ workers

class Pool {
  private workers: Worker[] = [];
  private idle: Worker[] = [];
  private queue: Array<{ req: BuildRequest; done: (r: BuildResponse) => void }> = [];
  private waiting = new Map<number, (r: BuildResponse) => void>();
  private next = 1;
  constructor(n: number) {
    for (let i = 0; i < n; i++) {
      const w = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
      w.onmessage = (ev: MessageEvent<BuildResponse>) => {
        this.waiting.get(ev.data.id)?.(ev.data);
        this.waiting.delete(ev.data.id);
        this.idle.push(w);
        this.pump();
      };
      this.workers.push(w);
      this.idle.push(w);
    }
  }
  build(req: Omit<BuildRequest, 'id'>): Promise<BuildResponse> {
    return new Promise((done) => {
      this.queue.push({ req: { ...req, id: this.next++ }, done });
      this.pump();
    });
  }
  get busy() {
    return this.queue.length + this.waiting.size;
  }
  private pump() {
    while (this.idle.length && this.queue.length) {
      const w = this.idle.pop()!;
      const { req, done } = this.queue.shift()!;
      this.waiting.set(req.id, done);
      w.postMessage(req);
    }
  }
}
const pool = new Pool(Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 4) - 1)));

// ------------------------------------------------------------------ renderer and materials

const canvas = $<HTMLCanvasElement>('view');
const renderer = makeRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.localClippingEnabled = true;
const scene = new THREE.Scene();
// Far enough for a model of a hundred tiles shown at 5 voxels a tile (T403).
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 3000);
const hemi = new THREE.HemisphereLight(0xdcecff, 0x5a4a3a, 1.1);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d8, 2.2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 80 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target);

const uTime = U.time;
const uWind = U.wind;
/** Glowing voxels (`<color glow="True">`) bloom as in the game. */
const bloom = new Bloom(renderer, scene, camera);
const look = new LabLook({ scene, bloom, sun, hemi, classic: { bloomStrength: 0.9, bloomRadius: 0.45 } });
const matStatic = look.twin({ vertexColors: true }, (m) => glowing(m, 'lab'));
/** Vegetation: the vertices move with the wind, more at the top (the `sway` attribute), and glow voxels bloom. */
const matSway = look.twin({ vertexColors: true }, (m) => windy(m, 'lab-sway'));
/** Structures: cut away above the head when the wanderer is inside. */
const cut = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1000);
const matCut = look.twin({ vertexColors: true, clippingPlanes: [cut] }, (m) => glowing(m, 'lab-cut'));
const matGlass = look.twin({ vertexColors: true, transparent: true, depthWrite: false }, (m) => glowing(m, 'lab-glass'));
const matCutGlass = look.twin({ vertexColors: true, clippingPlanes: [cut], transparent: true, depthWrite: false }, (m) => glowing(m, 'lab-cut-glass'));
look.set(CARTOON);
bindLookButton(look, $('look'));

function geometry(m: MeshData): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(m.positions, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(m.normals, 3));
  g.setAttribute('color', new THREE.BufferAttribute(m.colors, 3));
  if (m.sway) g.setAttribute('sway', new THREE.BufferAttribute(m.sway, 1));
  if (m.glow) g.setAttribute('glow', new THREE.BufferAttribute(m.glow, 1));
  if (m.alpha) g.setAttribute('alpha', new THREE.BufferAttribute(m.alpha, 1));
  if (m.part) g.setAttribute('part', new THREE.BufferAttribute(m.part, 1));
  g.setIndex(new THREE.BufferAttribute(m.indices, 1));
  if (m.opaqueCount !== undefined) {
    if (m.opaqueCount > 0) g.addGroup(0, m.opaqueCount, 0);
    const transCount = m.indices.length - m.opaqueCount;
    if (transCount > 0) g.addGroup(m.opaqueCount, transCount, 1);
  }
  g.computeBoundingSphere();
  return g;
}

// ------------------------------------------------------------------ assets: a model run once, as geometry

interface Asset {
  entry: Entry;
  seed: number;
  built: Built;
  body: THREE.BufferGeometry;
  limbs: Array<{ part: string; joint: [number, number, number]; phase: number; geo: THREE.BufferGeometry }>;
  clips: Array<{ name: string; frames: THREE.BufferGeometry[] }>;
  growth: THREE.BufferGeometry[];
}

const assets = new Map<string, Promise<Asset | string>>();
const models = new Map<string, MjxModel>();
let triangles = 0;

const isFigure = (e: Entry) => e.role === 'player' || e.role === 'npc' || e.role === 'animal';
const sways = (e: Entry) => e.role === 'tree' || e.role === 'plant';

function asset(e: Entry, seed: number, xml = e.xml): Promise<Asset | string> {
  const key = `${e.id}#${seed}#${xml === e.xml ? '' : xml.length + ':' + hashText(xml)}`;
  let p = assets.get(key);
  if (!p) {
    p = pool
      .build({ xml, seed, vpt: e.vpt, size: e.size, steps: e.steps, sway: sways(e), rig: isFigure(e), growth: e.grows ? 48 : 0, ...withIncludes(xml) })
      .then((r) => {
        if (!r.ok) return r.error;
        const a: Asset = {
          entry: e,
          seed,
          built: r,
          body: geometry(r.body),
          limbs: r.limbs.map((l) => ({ part: l.part, joint: l.joint, phase: l.phase, geo: geometry(l.mesh) })),
          clips: r.clips.map((c) => ({ name: c.name, frames: c.frames.map(geometry) })),
          growth: r.growth.map(geometry),
        };
        triangles += r.body.indices.length / 3;
        return a;
      });
    assets.set(key, p);
  }
  return p;
}
const hashText = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

// ------------------------------------------------------------------ entities in the world

interface Mover {
  speed: number;
  tx: number;
  tz: number;
  wait: number;
  phase: number;
  moving: boolean;
  home: [number, number];
  /** Where it looks (radians, model front is +z). */
  face: number;
}

interface Entity {
  entry: Entry;
  asset: Asset;
  root: THREE.Group;
  body: THREE.Mesh;
  frames: THREE.Mesh[];
  limbs: Array<{ pivot: THREE.Group; part: string; phase: number }>;
  x: number;
  z: number;
  yaw: number;
  /** For structures and solid entities: the voxel grid (actions change it) and where it blocks. */
  grid?: Grid3;
  foot?: Uint8Array;
  /** Per voxel column, the height of what one stands on (floors, steps). */
  floor?: Uint8Array;
  mover?: Mover;
  light?: THREE.PointLight;
  growing?: { t: number; meshes: THREE.Mesh[] };
  /** The action that would change it now (null: none), worked out when needed. */
  action?: { name: string; label: string } | null;
  /** Grew once already (MarkovJunior's models grow when the wanderer walks by). */
  grown?: boolean;
  label?: string;
}

const world = new THREE.Group();
scene.add(world);
let things: Entity[] = [];
let player: Entity | undefined;
let showcase: Entity | undefined;
let land: Land;
const buckets = new Map<number, Entity[]>();

/**
 * An asset in the world at (x, z). At another density than the one it was built at (T403) the same meshes are scaled, not built
 * again: the entity's entry says the density it stands at, which the footprint, the floors and the collisions read.
 */
function place(a: Asset, x: number, z: number, yaw: number, vpt = a.entry.vpt): Entity {
  const e = vpt === a.entry.vpt ? a.entry : { ...a.entry, vpt };
  const root = new THREE.Group();
  // A program with a cellar (T494, ADR-0245: `under` on its root) goes that much under the meadow: its soil on the ground, as in the world.
  root.position.set(x, -a.built.base / vpt, z);
  root.rotation.y = yaw;
  root.scale.setScalar(a.entry.vpt / vpt);
  // What is not a figure nor a plant is cut over the wanderer's head when inside (T403: also the editor's and the bench's structures).
  const cuts = !isFigure(e) && !sways(e);
  const mat = look.of(cuts ? matCut : sways(e) ? matSway : matStatic);
  const glass = look.of(cuts ? matCutGlass : matGlass);
  const mesh = (g: THREE.BufferGeometry) => {
    const m = new THREE.Mesh(g, g.groups.length > 0 ? [mat, glass] : mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };
  const body = mesh(a.body);
  root.add(body);
  const limbs = a.limbs.map((l) => {
    const pivot = new THREE.Group();
    pivot.position.set(...l.joint);
    pivot.add(mesh(l.geo));
    root.add(pivot);
    return { pivot, part: l.part, phase: l.phase };
  });
  const frames = (a.clips[0]?.frames ?? []).map((g) => {
    const m = mesh(g);
    m.visible = false;
    root.add(m);
    return m;
  });
  if (frames.length) body.visible = false;
  const t: Entity = { entry: e, asset: a, root, body, frames, limbs, x, z, yaw };
  if (!isFigure(e)) {
    const g = a.built.grid;
    t.grid = { X: g.X, Y: g.Y, Z: g.Z, cells: new Uint8Array(g.cells), alphabet: [...g.alphabet], log: [], epoch: 0 };
    // Body height: from just above the floor to about knee-to-shoulder of a person.
    const base = a.built.base;
    t.foot = e.id === 'fiore' ? undefined : footprint(t.grid, a.built.palette, base + stepOf(e) + 1, base + Math.ceil(0.7 * e.vpt));
    t.floor = floors(t.grid, a.built.palette, stepOf(e));
  }
  if (e.id === 'falo') {
    t.light = new THREE.PointLight(0xff9a40, 0, 7, 1.6);
    t.light.position.set(0, 0.5, 0);
    root.add(t.light);
  } else if (e.id === 'corona-albero-luce') {
    t.light = new THREE.PointLight(0x00ffff, 0, 5, 0.8);
    t.light.position.set(0, 1.2, 0);
    root.add(t.light);
  }
  root.traverse((o) => (o.userData.thing = t));
  world.add(root);
  return t;
}

function bucketRemove(t: Entity) {
  for (const [k, list] of buckets) {
    const at = list.indexOf(t);
    if (at < 0) continue;
    list.splice(at, 1);
    if (!list.length) buckets.delete(k);
  }
}

function bucketAdd(t: Entity) {
  if (!t.foot || !t.grid) return;
  const r = (Math.hypot(t.grid.X, t.grid.Y) / 2) / t.entry.vpt;
  for (let z = Math.floor(t.z - r); z <= Math.floor(t.z + r); z++)
    for (let x = Math.floor(t.x - r); x <= Math.floor(t.x + r); x++) {
      const k = x + z * 4096;
      (buckets.get(k) ?? buckets.set(k, []).get(k)!).push(t);
    }
}

/** A point in an entity's voxel columns (or undefined if outside its box). */
function local(t: Entity, wx: number, wz: number): [number, number] | undefined {
  const g = t.grid!;
  const dx = wx - t.x, dz = wz - t.z;
  const c = Math.cos(t.yaw), s = Math.sin(t.yaw);
  const lx = dx * c - dz * s, lz = dx * s + dz * c;
  const vx = Math.floor(lx * t.entry.vpt + g.X / 2), vy = Math.floor(lz * t.entry.vpt + g.Y / 2);
  return vx >= 0 && vy >= 0 && vx < g.X && vy < g.Y ? [vx, vy] : undefined;
}

function blocked(wx: number, wz: number): boolean {
  const tx = Math.floor(wx), tz = Math.floor(wz);
  // Past the land the meadow goes on (T403: a model of a hundred tiles stands beside the wanderer), as far as the plain is drawn.
  if (Math.abs(wx - land.W / 2) > PLAIN || Math.abs(wz - land.H / 2) > PLAIN) return true;
  const inLand = tx >= 0 && tz >= 0 && tx < land.W && tz < land.H;
  if (inLand && land.tiles[tx + tz * land.W] === 'water') return true;
  for (const t of buckets.get(tx + tz * 4096) ?? []) {
    const p = local(t, wx, wz);
    if (p && t.foot![p[0] + p[1] * t.grid!.X]) return true;
  }
  return false;
}

/** How high a figure steps up without noticing (a doorstep, a floor): 0.2 tiles. */
const stepOf = (e: Entry) => Math.max(1, Math.round(0.2 * e.vpt));

/** The height of the floor under a point (0 on the ground). */
function floorAt(wx: number, wz: number): number {
  let h = 0;
  for (const t of buckets.get(Math.floor(wx) + Math.floor(wz) * 4096) ?? []) {
    const p = t.floor && local(t, wx, wz);
    if (p) h = Math.max(h, (t.floor![p[0] + p[1] * t.grid!.X] - t.asset.built.base) / t.entry.vpt);
  }
  return h;
}

const R = 0.2;
const free = (x: number, z: number) => !blocked(x, z) && !blocked(x + R, z) && !blocked(x - R, z) && !blocked(x, z + R) && !blocked(x, z - R);

/** Moves a figure towards (dx, dz) per second; slides along walls. Returns how far it went. */
function step(t: Entity, dx: number, dz: number, dt: number): number {
  const nx = t.x + dx * dt, nz = t.z + dz * dt;
  let x = t.x, z = t.z;
  if (free(nx, nz)) [x, z] = [nx, nz];
  else if (free(nx, t.z)) x = nx;
  else if (free(t.x, nz)) z = nz;
  const d = Math.hypot(x - t.x, z - t.z);
  t.x = x;
  t.z = z;
  t.root.position.set(x, t.root.position.y + (floorAt(x, z) - t.root.position.y) * Math.min(1, dt * 14), z);
  return d;
}

function animateFigure(t: Entity, moved: number, dt: number) {
  const m = t.mover!;
  m.moving = moved > 0.0005;
  if (m.moving) m.phase += moved * 7;
  const k = m.moving ? 1 : 0;
  for (const l of t.limbs) {
    const swing = Math.sin(m.phase) * l.phase;
    if (l.part === 'gamba') l.pivot.rotation.x = THREE.MathUtils.lerp(l.pivot.rotation.x, swing * 0.6 * k, Math.min(1, dt * 12));
    else if (l.part === 'braccio') l.pivot.rotation.x = THREE.MathUtils.lerp(l.pivot.rotation.x, swing * 0.45 * k, Math.min(1, dt * 12));
    else if (l.part === 'coda') l.pivot.rotation.y = Math.sin(uTime.value * 5 + t.x) * 0.35;
    else if (l.part === 'testa') l.pivot.rotation.x = Math.sin(uTime.value * 1.3 + t.z) * 0.05;
  }
  t.body.position.y = m.moving ? Math.abs(Math.sin(m.phase)) * 0.02 : 0;
  // Turn towards where it goes.
  let d = m.face - t.yaw;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  t.yaw += d * Math.min(1, dt * 10);
  t.root.rotation.y = t.yaw;
}

function wander(t: Entity, dt: number) {
  const m = t.mover!;
  if (m.wait > 0) {
    m.wait -= dt;
    animateFigure(t, 0, dt);
    return;
  }
  const dx = m.tx - t.x, dz = m.tz - t.z;
  const d = Math.hypot(dx, dz);
  if (d < 0.15) {
    m.wait = 1 + Math.random() * 4;
    const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * 4;
    m.tx = m.home[0] + Math.cos(a) * r;
    m.tz = m.home[1] + Math.sin(a) * r;
    return;
  }
  m.face = Math.atan2(dx, dz);
  const moved = step(t, (dx / d) * m.speed, (dz / d) * m.speed, dt);
  if (moved < m.speed * dt * 0.3) {
    // Stuck: somewhere else.
    m.tx = t.x + (Math.random() - 0.5) * 4;
    m.tz = t.z + (Math.random() - 0.5) * 4;
  }
  animateFigure(t, moved, dt);
}

// ------------------------------------------------------------------ the land

/** How far the plain goes from the land's centre, in tiles: room for a model of a hundred tiles and more (T403). */
const PLAIN = 320;
let ground: THREE.Mesh | undefined;
function buildGround(l: Land, seed: number) {
  if (ground) {
    world.remove(ground);
    ground.geometry.dispose();
  }
  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  const lin = (c: number) => Math.pow(c, 2.2);
  const quad = (a: number[], b: number[], c: number[], d: number[], n: number[], rgb: number[]) => {
    for (const v of [a, b, c, a, c, d]) {
      pos.push(...v);
      nor.push(...n);
      col.push(...rgb.map(lin));
    }
  };
  let h = seed * 7919;
  const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822519) + 0x9e3779b9) >>> 0) / 4294967296;
  const COL = { meadow: [0.47, 0.64, 0.31], wood: [0.33, 0.47, 0.24], water: [0.24, 0.47, 0.66] };
  const height = (t: string) => (t === 'water' ? -0.16 : 0);
  const N = 4;
  for (let z = 0; z < l.H; z++)
    for (let x = 0; x < l.W; x++) {
      const t = l.tiles[x + z * l.W];
      const y = height(t);
      for (let j = 0; j < N; j++)
        for (let i = 0; i < N; i++) {
          const k = 0.9 + rnd() * 0.16;
          const c = COL[t].map((v) => v * k);
          const x0 = x + i / N, z0 = z + j / N, s = 1 / N;
          quad([x0, y, z0], [x0, y, z0 + s], [x0 + s, y, z0 + s], [x0 + s, y, z0], [0, 1, 0], c);
        }
      // Banks: earth where land meets water.
      if (t !== 'water')
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, nz = z + dz;
          if (nx < 0 || nz < 0 || nx >= l.W || nz >= l.H || l.tiles[nx + nz * l.W] !== 'water') continue;
          const ex = dx > 0 ? x + 1 : dx < 0 ? x : null;
          const ez = dz > 0 ? z + 1 : dz < 0 ? z : null;
          const earth = [0.45, 0.34, 0.22];
          if (ex !== null) {
            const a = [ex, 0, z], b = [ex, -0.16, z], c = [ex, -0.16, z + 1], d = [ex, 0, z + 1];
            dx > 0 ? quad(a, b, c, d, [1, 0, 0], earth) : quad(d, c, b, a, [-1, 0, 0], earth);
          } else if (ez !== null) {
            const a = [x, 0, ez], b = [x + 1, 0, ez], c = [x + 1, -0.16, ez], d = [x, -0.16, ez];
            dz > 0 ? quad(a, b, c, d, [0, 0, 1], earth) : quad(d, c, b, a, [0, 0, -1], earth);
          }
        }
    }
  // The plain around the land (T403): meadow as far as PLAIN from its centre, where a large model shown beside the wanderer stands.
  const cx = l.W / 2, cz = l.H / 2;
  const meadow = COL.meadow.map((v) => v * 0.97);
  const flat = (x0: number, z0: number, x1: number, z1: number) => quad([x0, 0, z0], [x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [0, 1, 0], meadow);
  flat(cx - PLAIN, cz - PLAIN, 0, cz + PLAIN);
  flat(l.W, cz - PLAIN, cx + PLAIN, cz + PLAIN);
  flat(0, cz - PLAIN, l.W, 0);
  flat(0, l.H, l.W, cz + PLAIN);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  ground = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  ground.receiveShadow = true;
  world.add(ground);
}

function plinth(x: number, z: number) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 2.1), new THREE.MeshLambertMaterial({ color: 0x8a8478 }));
  m.position.set(x, 0.06, z);
  m.receiveShadow = true;
  world.add(m);
}

// ------------------------------------------------------------------ building the world

const status = $('status');
let building = 0;

async function buildWorld(seed: number) {
  building++;
  const mine = building;
  for (const t of things) world.remove(t.root);
  world.clear();
  things = [];
  buckets.clear();
  player = showcase = undefined;
  status.textContent = 'il fiume (models/River.xml di MarkovJunior)…';
  land = makeLand(44, 44, seed);
  const ids = (role: string) => CATALOG.filter((e) => e.role === role && !e.trial && !e.id.startsWith('sandbox:')).map((e) => e.id);
  const p = plan(land, seed, {
    trees: ids('tree'),
    plants: ids('plant'),
    rocks: ids('rock'),
    npcs: ids('npc'),
    animals: ids('animal'),
  });
  buildGround(land, seed);
  const official = CATALOG.filter((e) => e.role === 'official');
  let gallery = 0;
  // Several entities share a model run with the same seed: trees, plants and stones have three each.
  const jobs = p.things.map((pl) => {
    const e = pl.role === 'official' ? official[gallery++ % official.length] : byId(pl.id)!;
    if (pl.role === 'official') plinth(pl.x, pl.z);
    const seedOf = ['tree', 'plant', 'rock'].includes(e.role) ? 1 + (pl.seed % 3) : pl.seed;
    return { e, pl, seedOf };
  });
  jobs.unshift({ e: byId('viandante')!, pl: { id: 'viandante', role: 'player', x: p.start[0], z: p.start[1], yaw: 0, seed: 1 }, seedOf: 1 });
  let done = 0;
  await Promise.all(
    jobs.map(async ({ e, pl, seedOf }) => {
      const a = await asset(e, seedOf);
      if (mine !== building) return;
      done++;
      status.textContent = `modelli: ${done}/${jobs.length}`;
      if (typeof a === 'string') return console.warn(e.id, a);
      const t = place(a, pl.x, pl.z, pl.yaw);
      if (pl.role === 'official') t.root.position.y = 0.12;
      if (isFigure(e)) t.mover = { speed: e.role === 'animal' ? 1.4 : 1.1, tx: pl.x, tz: pl.z, wait: Math.random() * 3, phase: 0, moving: false, home: [pl.x, pl.z], face: pl.yaw };
      if (pl.role === 'player') player = t;
      else bucketAdd(t);
      t.label = e.name;
      things.push(t);
    }),
  );
  if (mine !== building) return;
  status.textContent = `${things.length} modelli, ${Math.round(triangles / 1000)}k triangoli — cammina verso la casa`;
}

// ------------------------------------------------------------------ actions (MarkovJunior rules on a model)

function modelOf(e: Entry): MjxModel {
  let m = models.get(e.id);
  if (!m) models.set(e.id, (m = compileMjx(e.xml, { ...(e.size ? { size: e.size } : {}), ...withIncludes(e.xml) })));
  return m;
}

/** The first action of an entity that would change it (open when closed, close when open). */
function actionFor(t: Entity): { name: string; label: string } | undefined {
  if (!t.grid || !t.asset.built.actions.length) return undefined;
  const m = modelOf(t.entry);
  for (const a of m.actions) {
    const g = { ...t.grid, cells: new Uint8Array(t.grid.cells), alphabet: [...t.grid.alphabet], log: [], epoch: 0 };
    act(g, a, 1);
    if (g.cells.some((c, i) => c !== t.grid!.cells[i])) return { name: a.name, label: a.label ?? a.name };
  }
  return undefined;
}

function doAction(t: Entity, name: string) {
  const m = modelOf(t.entry);
  const clip = m.actions.find((a) => a.name === name)!;
  act(t.grid!, clip, 1);
  const pal = m.program.palette;
  // The meshes at the density the asset was built at: the root scales them to the entity's (T403).
  const built = t.asset.entry.vpt;
  t.body.geometry = geometry(meshVoxels(t.grid!, pal, { vpt: built }));
  // The animation frames start again from the changed model.
  const anim = m.animations[0];
  if (anim) {
    const fr = clipFrames(t.grid!, anim, 1);
    t.frames.forEach((f, i) => (f.geometry = geometry(meshVoxels(fr[i], pal, { vpt: built }))));
  }
  t.foot = footprint(t.grid!, pal, t.asset.built.base + stepOf(t.entry) + 1, t.asset.built.base + Math.ceil(0.7 * t.entry.vpt));
  t.floor = floors(t.grid!, pal, stepOf(t.entry));
  t.action = undefined;
}

// ------------------------------------------------------------------ input and camera

const keys = new Set<string>();
const cam = { yaw: 0, yawGoal: 0, pitch: 0.92, dist: 9, target: new THREE.Vector3() };
addEventListener('keydown', (e) => {
  if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT') return;
  keys.add(e.code);
  if (e.code === 'KeyQ') cam.yawGoal += Math.PI / 4;
  if (e.code === 'KeyR') cam.yawGoal -= Math.PI / 4;
  if (e.code === 'KeyE' && near) doAction(near.t, near.a.name);
});
addEventListener('keyup', (e) => keys.delete(e.code));
let drag: { x: number; y: number } | null = null;
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('pointerdown', (e) => {
  // The fingers have their own gestures (T389, below)
  if (e.pointerType === 'touch') return;
  if (e.button === 2 || e.button === 1) drag = { x: e.clientX, y: e.clientY };
  else pick(e);
});
addEventListener('pointerup', () => (drag = null));
addEventListener('pointermove', (e) => {
  if (!drag) return;
  cam.yawGoal -= (e.clientX - drag.x) * 0.006;
  cam.yaw = cam.yawGoal;
  cam.pitch = THREE.MathUtils.clamp(cam.pitch + (e.clientY - drag.y) * 0.004, 0.2, 1.45);
  drag = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('wheel', (e) => (cam.dist = THREE.MathUtils.clamp(cam.dist * (e.deltaY > 0 ? 1.12 : 0.89), 2.5, MAX_DIST)), { passive: true });

/** The farthest the camera goes: a model of a hundred tiles whole in view (T403). */
const MAX_DIST = 400;
const ray = new THREE.Raycaster();
function pick(e: { clientX: number; clientY: number }) {
  const r = canvas.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
  const hit = ray.intersectObjects(world.children, true).find((h) => h.object.userData.thing);
  // The entry as built: the density it is shown at is the lab's choice (T403).
  if (hit) inspect(hit.object.userData.thing.asset.entry, hit.object.userData.thing.asset.seed);
  return !!hit;
}

// ------------------------------------------------------------------ by touch, and on a small screen (T389)
// The fingers on the scene: one orbits as the right button dragged, two pinch as the wheel, a tap inspects what it touches.
// The stick holds WASD; the prompt of an action is a button. Under COMPACT_QUERY the panel is closed until asked for.

const compact = matchMedia(COMPACT_QUERY);
const panelToggle = $('panel-toggle');
function openPanel(open: boolean): void {
  document.body.classList.toggle('panel-open', open);
  panelToggle.setAttribute('aria-expanded', String(open));
  panelToggle.textContent = open ? '✕ Chiudi' : '☰ Pannello';
}
panelToggle.addEventListener('click', () => openPanel(!document.body.classList.contains('panel-open')));
attachPreviewTouch(canvas, {
  orbit: (dx, dy) => {
    cam.yawGoal -= dx * 0.006;
    cam.yaw = cam.yawGoal;
    cam.pitch = THREE.MathUtils.clamp(cam.pitch + dy * 0.004, 0.2, 1.45);
  },
  zoom: (factor) => (cam.dist = THREE.MathUtils.clamp(cam.dist * factor, 2.5, MAX_DIST)),
  tap: (x, y) => {
    if (pick({ clientX: x, clientY: y }) && compact.matches) openPanel(true);
  },
});
mountStick($('stick-host'), keys);

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  bloom.setSize(w, h, renderer.getPixelRatio());
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

// ------------------------------------------------------------------ day and night

let hour = 10;
let shadowScale = 1;
const sky = { day: new THREE.Color(0x9cc8e8), dusk: new THREE.Color(0xe8a070), night: new THREE.Color(0x0e1424) };
function light() {
  const a = ((hour - 6) / 12) * Math.PI;
  const elev = Math.sin(a);
  const day = Math.max(0, elev);
  const dir = new THREE.Vector3(-Math.cos(a) * 0.8, Math.max(0.08, elev), -0.45).normalize();
  if (look.cartoon) {
    look.sunOver(cam.target);
    look.daylight(day);
  } else {
    sun.position.copy(cam.target).addScaledVector(dir, 30);
    sun.target.position.copy(cam.target);
    sun.intensity = 2.4 * Math.min(1, day * 2.5);
    sun.color.setHSL(0.09, 0.6, 0.6 + 0.3 * day);
    hemi.intensity = 0.18 + 0.95 * Math.min(1, day * 2);
  }
  const bg = day > 0.25 ? sky.day.clone() : day > 0 ? sky.dusk.clone().lerp(sky.day, day * 4) : sky.night.clone().lerp(sky.dusk, Math.max(0, 1 + elev * 4));
  scene.background = bg;
  // A large model far away (T403): the sun stands back and its shadows cover what the camera sees; the classic fog recedes.
  const far = Math.max(1, cam.dist / 12);
  if (far !== shadowScale) {
    shadowScale = far;
    Object.assign(sun.shadow.camera, { left: -16 * far, right: 16 * far, top: 16 * far, bottom: -16 * far, far: 80 * far });
    sun.shadow.camera.updateProjectionMatrix();
  }
  sun.position.sub(cam.target).multiplyScalar(far).add(cam.target);
  const air = look.cartoon ? aerial(cam.dist, day) : { near: 30 * far, far: 70 * far };
  scene.fog = new THREE.Fog(bg, air.near, air.far);
  for (const t of [...things, ...(showcase ? [showcase] : [])]) if (t.light) t.light.intensity = (day > 0.3 ? 0.8 : 3.5) * (0.85 + 0.15 * Math.sin(uTime.value * 13 + Math.sin(uTime.value * 7)));
}

// ------------------------------------------------------------------ the loop

let near: { t: Entity; a: { name: string; label: string } } | undefined;
const prompt = $('prompt');
// The prompt of an action is a button too: the E of a finger
prompt.addEventListener('click', () => {
  if (near) doAction(near.t, near.a.name);
});
let last = performance.now();
let frameClock = 0;
let fps = 0;

function tick(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  fps = fps * 0.95 + (1 / Math.max(dt, 1e-3)) * 0.05;
  uTime.value += dt;
  frameClock += dt;

  if (player?.mover) {
    let ix = 0, iz = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) iz -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) iz += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
    const len = Math.hypot(ix, iz);
    let moved = 0;
    if (len) {
      const sp = (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 4.2 : 2.4) / len;
      const c = Math.cos(cam.yaw), s = Math.sin(cam.yaw);
      // Screen right is (cos, -sin); screen down (towards the camera) is (sin, cos).
      const dx = (ix * c + iz * s) * sp, dz = (-ix * s + iz * c) * sp;
      player.mover.face = Math.atan2(dx, dz);
      moved = step(player, dx, dz, dt);
    }
    animateFigure(player, moved, dt);
    if (!hold) cam.target.lerp(new THREE.Vector3(player.x, player.root.position.y + 0.6, player.z), Math.min(1, dt * 6));
  }
  for (const t of things) if (t.mover && t !== player) wander(t, dt);

  // MarkovJunior animations: one frame every 0.15 s.
  const k = Math.floor(frameClock / 0.15);
  for (const t of [...things, ...(showcase ? [showcase] : [])]) if (t.frames.length && !t.growing) t.frames.forEach((f, i) => (f.visible = i === k % t.frames.length));
  // Growth: the run of the program, replayed when the wanderer walks by (or on request).
  for (const t of [...things, ...(showcase ? [showcase] : [])]) {
    if (player && t.entry.grows && !t.grown && !t.growing && Math.hypot(t.x - player.x, t.z - player.z) < 3.2) startGrowth(t);
    if (!t.growing) continue;
    t.growing.t += dt;
    const n = t.growing.meshes.length;
    const i = Math.min(n - 1, Math.floor((t.growing.t / 3) * n));
    t.growing.meshes.forEach((m, j) => (m.visible = j === i));
    if (t.growing.t > 3.4) {
      for (const m of t.growing.meshes) t.root.remove(m);
      t.growing = undefined;
      (t.frames.length ? t.frames[0] : t.body).visible = true;
    }
  }

  // What the wanderer can act on, and whether it is inside a structure (then the roof is cut away).
  let inside = false;
  let found: typeof near;
  if (player)
    for (const t of [...things, ...(showcase ? [showcase] : [])]) {
      if (!t.grid || Math.hypot(t.x - player.x, t.z - player.z) > Math.hypot(t.grid.X, t.grid.Y) / 2 / t.entry.vpt + 4) continue;
      const p = local(t, player.x, player.z);
      // Inside: something of the structure over the wanderer's head (T403: a courtyard is not inside, a hall is).
      if (p && (t.entry.role === 'structure' || t === showcase) && roofOver(t, p, player.root.position.y)) inside = true;
      if (!found && t.asset.built.actions.length) {
        // Near enough: within a tile of any of its blocking columns.
        let close = false;
        for (let r = 0.3; r <= 0.91 && !close; r += 0.3)
          for (let a = 0; a < 16 && !close; a++) {
            const q = local(t, player.x + Math.cos((a * Math.PI) / 8) * r, player.z + Math.sin((a * Math.PI) / 8) * r);
            close = !!q && !!t.foot?.[q[0] + q[1] * t.grid.X];
          }
        if (close) {
          // Which action would change it: worked out once, again after each action.
          if (t.action === undefined) t.action = actionFor(t) ?? null;
          if (t.action) found = { t, a: t.action };
        }
      }
    }
  near = found;
  prompt.hidden = !near;
  if (near) prompt.textContent = `E — ${near.a.label}`;
  cut.constant = cutAt ?? (inside ? (player?.root.position.y ?? 0) + 1.05 : 1000);
  // Cut under the ground (T494), the meadow goes too: a cellar is seen from above, as the world opens the terrain over it.
  if (ground) ground.visible = cut.constant > 0;

  cam.yaw += (cam.yawGoal - cam.yaw) * Math.min(1, dt * 8);
  const off = new THREE.Vector3(Math.sin(cam.yaw) * Math.cos(cam.pitch), Math.sin(cam.pitch), Math.cos(cam.yaw) * Math.cos(cam.pitch)).multiplyScalar(cam.dist);
  camera.position.copy(cam.target).add(off);
  camera.lookAt(cam.target);
  light();
  bloom.render(dt);
  $('stats').textContent = `${Math.round(fps)} fps · ${renderer.info.render.triangles.toLocaleString('it')} triangoli disegnati · ${renderer.info.render.calls} chiamate · lavori in coda ${pool.busy}`;
  requestAnimationFrame(tick);
}

/** Whether a column of a structure has a coloured voxel over a wanderer standing at `y` (tiles). */
function roofOver(t: Entity, p: [number, number], y: number): boolean {
  const g = t.grid!;
  const XY = g.X * g.Y;
  const pal = t.asset.built.palette;
  for (let z = Math.ceil((y + 1.5) * t.entry.vpt); z < g.Z; z++) {
    const c = g.cells[p[0] + p[1] * g.X + z * XY];
    if (c && pal[g.alphabet[c]]?.color) return true;
  }
  return false;
}

/** The height the structures are cut at, from the console (T403: a hall seen whole from above); null: the wanderer decides. */
let cutAt: number | null = null;
/** The camera held where the console put it (T403), not on the wanderer. */
let hold = false;

function startGrowth(t: Entity) {
  t.grown = true;
  if (!t.asset.growth.length) return;
  const mat = t.body.material as THREE.Material;
  const meshes = t.asset.growth.map((g) => {
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    m.visible = false;
    t.root.add(m);
    return m;
  });
  t.body.visible = false;
  t.frames.forEach((f) => (f.visible = false));
  t.growing = { t: 0, meshes };
}

// ------------------------------------------------------------------ panel

let current: { e: Entry; seed: number; xml: string } | undefined;
/** The voxels a tile the inspected model is shown at (T403): undefined, its entry's own. The address keeps it (`?vpt=`). */
let chosenVpt = scaleFrom(location.search);

function setScale(v: number | undefined, reshow = true) {
  chosenVpt = v;
  history.replaceState(null, '', withScale(location.href, v));
  showScale();
  void info();
  if (reshow && current && showcase) void show(false);
}

/** The buttons and the field say the density now. */
function showScale() {
  const on = chosenVpt === undefined ? '' : String(chosenVpt);
  document.querySelectorAll<HTMLButtonElement>('#ins-scale button').forEach((b) => b.classList.toggle('on', b.dataset.vpt === on));
  $<HTMLInputElement>('ins-vpt').value = String(current ? shownVpt(current.e.vpt, chosenVpt) : (chosenVpt ?? ''));
}
document.querySelectorAll<HTMLButtonElement>('#ins-scale button').forEach((b) => (b.onclick = () => setScale(readVpt(b.dataset.vpt))));
$<HTMLInputElement>('ins-vpt').onchange = (ev) => {
  const v = readVpt((ev.target as HTMLInputElement).value);
  if (v !== undefined) setScale(v);
  else showScale();
};

function listModels() {
  const box = $('models');
  box.innerHTML = '';
  for (const [title, keep] of GROUPS) {
    const h = document.createElement('h3');
    h.textContent = title;
    box.append(h);
    for (const e of CATALOG.filter(keep)) {
      const b = document.createElement('button');
      b.textContent = e.name;
      b.title = e.source;
      b.onclick = () => inspect(e, 1);
      b.dataset.id = e.id;
      box.append(b);
    }
  }
}

function inspect(e: Entry, seed: number) {
  current = { e, seed, xml: e.xml };
  $('inspector').hidden = false;
  $('ins-name').textContent = e.name;
  $('ins-source').textContent = `${e.source} · ${e.vpt} voxel per casella`;
  $<HTMLTextAreaElement>('ins-xml').value = e.xml.trim();
  $('ins-err').textContent = '';
  $('ins-info').textContent = '';
  document.querySelectorAll('#models button').forEach((b) => b.classList.toggle('on', (b as HTMLElement).dataset.id === e.id));
  showScale();
  void info();
}

async function info() {
  if (!current) return;
  const a = await asset(current.e, current.seed, current.xml);
  if (typeof a === 'string') {
    $('ins-err').textContent = a;
    return;
  }
  const i = a.built.info;
  const g = a.built.grid;
  const vpt = shownVpt(current.e.vpt, chosenVpt);
  $('ins-measure').textContent = measureAt([g.X, g.Y, g.Z], vpt).text + (vpt === current.e.vpt ? ' (quella del modello)' : ` (il modello: ${current.e.vpt})`);
  $('ins-info').textContent = [
    `seme ${current.seed} · griglia ${g.X}×${g.Y}×${g.Z} · ${i.steps} passi in ${i.ms} ms${i.finished ? '' : ' (interrotto)'}`,
    a.built.clips.length ? `animazioni: ${a.built.clips.map((c) => c.name).join(', ')}` : '',
    a.built.actions.length ? `azioni: ${a.built.actions.map((x) => x.label ?? x.name).join(', ')}` : '',
    a.limbs.length ? `arti: ${a.limbs.map((l) => l.part).join(', ')}` : '',
    i.unused.length ? `nodi mai usati: ${i.unused.join(' | ')}` : '',
    i.warnings.join(' · '),
  ]
    .filter(Boolean)
    .join('\n');
}

/** Puts the inspected model in front of the wanderer (replacing the one there). */
async function show(grow: boolean) {
  // On a small screen the panel would cover what is put in front of the wanderer
  if (compact.matches) openPanel(false);
  if (!current || !player) return;
  const a = await asset(current.e, current.seed, current.xml);
  if (typeof a === 'string') {
    $('ins-err').textContent = a;
    return;
  }
  if (showcase) {
    world.remove(showcase.root);
    bucketRemove(showcase);
  }
  // At the density chosen (T403), as far as its size asks: a fort of a hundred tiles is not put on the wanderer's toes.
  const vpt = shownVpt(current.e.vpt, chosenVpt);
  const g = a.built.grid;
  const d = Math.max(2.4, showcaseDistance([g.X, g.Y, g.Z], vpt));
  const fx = player.x + Math.sin(player.yaw) * d, fz = player.z + Math.cos(player.yaw) * d;
  showcase = place(a, fx, fz, player.yaw + Math.PI, vpt);
  // A structure is walked: it blocks and has floors, as the village's (a figure walks its own way).
  if (!isFigure(a.entry)) bucketAdd(showcase);
  // Large: the camera stands back to see it whole, once.
  cam.dist = Math.min(MAX_DIST, Math.max(cam.dist, (Math.max(g.X, g.Y) / vpt) * 1.6));
  if (isFigure(a.entry)) showcase.mover = { speed: 0, tx: fx, tz: fz, wait: 1e9, phase: 0, moving: false, home: [fx, fz], face: player.yaw + Math.PI };
  showcase.grown = !grow;
  if (grow) startGrowth(showcase);
  void info();
}

$('ins-show').onclick = () => void show(!!current?.e.grows);
$('ins-seed').onclick = () => {
  if (!current) return;
  current.seed++;
  void show(false);
};
$('ins-grow').onclick = async () => {
  if (!current) return;
  // Growth needs the run's states: build with them.
  current.e = { ...current.e, grows: true };
  await show(true);
};
$('ins-run').onclick = async () => {
  if (!current) return;
  current.xml = $<HTMLTextAreaElement>('ins-xml').value;
  $('ins-err').textContent = '';
  await show(!!current.e.grows);
};
$('world-new').onclick = () => void buildWorld(Number($<HTMLInputElement>('world-seed').value) || 1);
$<HTMLInputElement>('hour').oninput = (e) => {
  hour = Number((e.target as HTMLInputElement).value);
  $('hour-v').textContent = `${Math.floor(hour)}:${String(Math.round((hour % 1) * 60)).padStart(2, '0')}`;
};
$<HTMLInputElement>('wind').oninput = (e) => (uWind.value = Number((e.target as HTMLInputElement).value));

// ------------------------------------------------------------------ the sculptor, live: only for the developers (T294)

// In the build the players get, the sculptor and Gemini are not there at all: the labs never call the models (ADR-0169).
if (import.meta.env.MODE !== 'production') {
  void import('./sculpt').then(({ wireSculptor }) =>
    wireSculptor(async (e) => {
      CATALOG.push(e);
      listModels();
      inspect(e, 1);
      await show(false);
    }),
  );
} else $('g-go').closest('section')?.remove();

// ------------------------------------------------------------------ the handmade cards (T294, ADR-0169)

void startCardsList({
  mount: $('cards'),
  open: (e) => {
    inspect(e, 1);
    // A card of the address arrives before the world: in front of the wanderer as soon as there is one.
    const put = (tries: number) => (player ? void show(!!e.grows) : tries > 0 && setTimeout(() => put(tries - 1), 500));
    put(40);
  },
});

listModels();
// A model of the address (`?modello=<id>`, T403) is put in front of the wanderer as soon as there is one, at the density of `?vpt=`.
const askedModel = new URLSearchParams(location.search).get('modello');
void buildWorld(7).then(() => {
  const e = askedModel ? byId(askedModel) : undefined;
  if (!e) return;
  inspect(e, 1);
  void show(!!e.grows);
});
requestAnimationFrame(tick);

/**
 * For the console and the photos of the scale (T403, lab/scripts/foto-scala.mjs): a model shown at a density, where a voxel of it is
 * in the world, the wanderer and the camera put somewhere, the cut over the head.
 */
const sandboxTools = {
  /** Inspects a model of the catalogue and puts it in front of the wanderer at `vpt` (undefined: its own); resolves when it is there. */
  async showModel(id: string, vpt?: number, seed = 1): Promise<boolean> {
    const e = byId(id);
    if (!e || !player) return false;
    setScale(readVpt(vpt), false);
    inspect(e, seed);
    await show(false);
    return !!showcase && showcase.asset.entry.id === e.id;
  },
  /** A voxel of the shown model (grid coordinates, z up) in the world's tiles. */
  toWorld(vx: number, vy: number, vz: number): [number, number, number] | undefined {
    if (!showcase) return undefined;
    const g = showcase.asset.built.grid;
    const s = 1 / showcase.asset.entry.vpt;
    const p = showcase.root.localToWorld(new THREE.Vector3((vx + 0.5 - g.X / 2) * s, vz * s, (vy + 0.5 - g.Y / 2) * s));
    return [p.x, p.y, p.z];
  },
  /** The wanderer at (x, z), standing at height y, looking towards `face` (radians). */
  putPlayer(x: number, z: number, y = 0, face = 0): void {
    if (!player?.mover) return;
    player.x = x;
    player.z = z;
    player.root.position.set(x, y, z);
    player.yaw = player.mover.face = face;
    player.root.rotation.y = face;
  },
  /** The camera on (x, y, z) at a distance, a yaw and a pitch (radians), at once. */
  frame(x: number, y: number, z: number, dist: number, yaw = cam.yaw, pitch = cam.pitch): void {
    cam.target.set(x, y, z);
    cam.dist = dist;
    cam.yaw = cam.yawGoal = yaw;
    cam.pitch = pitch;
    hold = true;
  },
  /** The camera follows the wanderer again. */
  follow(): void {
    hold = false;
  },
  /** The structures cut at a height (tiles), or as the wanderer decides (null). */
  cut(y: number | null): void {
    cutAt = y;
  },
  showcase: () => showcase,
};
(window as unknown as { sandbox: unknown }).sandbox = { things: () => things, player: () => player, cam, camera, scene, CATALOG, asset, blocked, floorAt, local, step, doAction, actionFor, ...sandboxTools };
