// The bench of what is worn, in 3D (T289, lab/banco/indossati.md): the same body dressed by the three ways side by side, in the
// game's cartoon light, still or walking, from the four sides. Way A as the game would draw it: the bare figure and the worn mesh of
// each thing apart, stretched onto its zone (its voxels are no longer cubes where the zone is not the wanderer's); B and C as the new
// figure they make, with its own rig, so the limbs that move are those of the dressed body.
//
// URL: ?corpo=viandante|lupo|gerboa|golem|cervo &seme=2 &vista=0..3 (the figures turned by quarters, as the photographs: front, right,
// back, left) &passo (walking) &oggetti=helmet,cuirass,cloak
// Console: window.indossati.

import * as THREE from 'three';
import { boxOf, classOf } from '../../src/mj/classes';
import type { MeshData } from '../../src/mj/mesh';
import { meshVoxels } from '../../src/mj/mesh';
import { compileMjx } from '../../src/mj/model';
import { FORM_LIMITS, runMjx } from '../../src/mj/run';
import { rootTag } from '../../src/kernel/forms';
import { Bloom } from '../../src/render/bloom';
import { aerial, CARTOON } from '../../src/render/cartoon';
import { makeRenderer } from '../../src/render/gpu';
import { glowing } from '../../src/render/materials';
import { bodyOf, coordsOf, turned, turnIndex } from '../banco/indossati/body';
import { figureMeshes, itemsFrom } from '../banco/indossati/bench';
import { dress, fitBox, ITEMS, prepare, WAYS, type Dressed, type ItemId, type WayId } from '../banco/indossati/ways';
import { bindLookButton, LabLook } from '../look';

const VPT = 20;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

// --- What is on the bench ---------------------------------------------------------------------------------------------------------

const itemFiles = import.meta.glob('../banco/indossati/items/*.xml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const items = itemsFrom(Object.fromEntries(Object.entries(itemFiles).map(([k, v]) => [k.split('/').pop()!, v])));
const prepared = prepare(items);
const sources = import.meta.glob(
  ['../../universe/models/viandante.xml', '../../universe/models/beast.xml', '../../universe/models/corona-gerboa.xml', '../banco/fauna-biomi-cloud/creature-veicoli/fantasy/golem-runico.xml', '../banco/fauna-biomi-cloud/creature-veicoli/fantasy/cervo-reale.xml'],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>;
const source = (end: string) => Object.entries(sources).find(([k]) => k.endsWith(end))![1];
const BODIES: Record<string, { xml: string; cls: string; seeds: number }> = {
  viandante: { xml: source('viandante.xml'), cls: 'person', seeds: 8 },
  lupo: { xml: source('beast.xml'), cls: 'beast', seeds: 4 },
  gerboa: { xml: source('corona-gerboa.xml'), cls: 'person', seeds: 1 },
  golem: { xml: source('golem-runico.xml'), cls: 'person', seeds: 5 },
  cervo: { xml: source('cervo-reale.xml'), cls: 'beast', seeds: 5 },
};

function bodyGrid(name: string, seed: number): Dressed {
  const b = BODIES[name];
  const own = /\ssize="/.test(rootTag(b.xml));
  const m = compileMjx(b.xml, own ? {} : { size: boxOf(classOf(b.cls)!) });
  const r = runMjx(m, seed, { limits: FORM_LIMITS, deadline: 8_000 });
  return { grid: r.grid, palette: m.program.palette };
}

// --- The scene ------------------------------------------------------------------------------------------------------------------------

const canvas = $<HTMLCanvasElement>('view');
const renderer = makeRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
// Every pass of the frame counted (the bloom draws the scene more than once).
renderer.info.autoReset = false;
const scene = new THREE.Scene();
// A narrow field, almost parallel: the three figures side by side are seen from the same side.
const camera = new THREE.PerspectiveCamera(12, 1, 0.1, 400);
const hemi = new THREE.HemisphereLight(0xdcecff, 0x5a4a3a, 1.1);
const sun = new THREE.DirectionalLight(0xfff0d8, 2.2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 80 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
scene.add(hemi, sun, sun.target);
const bloom = new Bloom(renderer, scene, camera);
const look = new LabLook({ scene, bloom, sun, hemi, classic: { bloomStrength: 0.9, bloomRadius: 0.45 } });
const material = look.twin({ vertexColors: true }, (m) => glowing(m, 'indossati'));
const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshLambertMaterial({ color: 0x8fb070 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

function geometry(m: MeshData): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(m.positions, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(m.normals, 3));
  g.setAttribute('color', new THREE.BufferAttribute(m.colors, 3));
  if (m.glow) g.setAttribute('glow', new THREE.BufferAttribute(m.glow, 1));
  if (m.part) g.setAttribute('part', new THREE.BufferAttribute(m.part, 1));
  g.setIndex(new THREE.BufferAttribute(m.indices, 1));
  return g;
}
const meshOf = (m: MeshData) => {
  const mesh = new THREE.Mesh(geometry(m), look.of(material));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

interface Figure {
  root: THREE.Group;
  limbs: Array<{ pivot: THREE.Group; part: string; phase: number }>;
}

/** A figure from its meshes: the body, each limb on a pivot at its joint. */
function figure(d: Dressed): Figure {
  const f = figureMeshes(d, VPT);
  const root = new THREE.Group();
  root.add(meshOf(f.body));
  const limbs = f.limbs.map((l) => {
    const pivot = new THREE.Group();
    pivot.position.set(...l.joint);
    pivot.add(meshOf(l.mesh));
    root.add(pivot);
    return { pivot, part: l.part, phase: l.phase };
  });
  return { root, limbs };
}

/**
 * Way A as the game would draw it: where the worn mesh of a thing goes on a bare figure. The worn program's box is stretched onto
 * the box `fitBox` gives in the zone's frame, then the frame is turned back (a torso on all fours); the matrix takes a vertex of the
 * worn mesh (three.js, tiles, origin at the centre of its floor) to the figure's frame.
 */
function wornMatrix(base: Dressed, item: ItemId, worn: Dressed): THREE.Matrix4 | undefined {
  const g = base.grid;
  const body = bodyOf(g, base.palette, VPT);
  const it = items.find((i) => i.id === item)!;
  const zone = body.zones[it.zone];
  if (!zone) return undefined;
  const turn = turned(body, it.zone);
  // The zone's bounds in its frame (the turned grid is X × Z × Y).
  const frame = { X: g.X, Y: turn ? g.Z : g.Y, Z: turn ? g.Y : g.Z, cells: new Uint8Array(0), alphabet: [] };
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const c of zone.cells) {
    const p = coordsOf(frame, turn ? turnIndex(g, c) : c);
    for (let a = 0; a < 3; a++) {
      min[a] = Math.min(min[a], p[a]);
      max[a] = Math.max(max[a], p[a]);
    }
  }
  const box = fitBox(it.zone, { min: min as [number, number, number], max: max as [number, number, number] }, body.upright);
  const W = worn.grid;
  const size = [0, 1, 2].map((a) => box.max[a] - box.min[a] + 1);
  const map = (a3: number, b3: number, c3: number): THREE.Vector3 => {
    // The worn mesh's vertex → the worn program's voxel corner → the zone's frame → the body's grid → the figure's three.js frame.
    const u = a3 * VPT + W.X / 2, v = c3 * VPT + W.Y / 2, w = b3 * VPT;
    const c = [box.min[0] + (u * size[0]) / W.X, box.min[1] + (v * size[1]) / W.Y, box.min[2] + (w * size[2]) / W.Z];
    const [x, y, z] = turn ? [c[0], c[2], g.Z - c[1]] : c;
    return new THREE.Vector3((x - g.X / 2) / VPT, z / VPT, (y - g.Y / 2) / VPT);
  };
  const o = map(0, 0, 0);
  const ex = map(1, 0, 0).sub(o), ey = map(0, 1, 0).sub(o), ez = map(0, 0, 1).sub(o);
  return new THREE.Matrix4().set(ex.x, ey.x, ez.x, o.x, ex.y, ey.y, ez.y, o.y, ex.z, ey.z, ez.z, o.z, 0, 0, 0, 1);
}

// --- The state --------------------------------------------------------------------------------------------------------------------

const params = new URLSearchParams(location.search);
const state = {
  body: params.get('corpo') ?? 'viandante',
  seed: Number(params.get('seme') ?? 2),
  outfit: (params.get('oggetti')?.split(',').filter((s) => (ITEMS as readonly string[]).includes(s)) ?? ['helmet', 'cuirass', 'cloak']) as ItemId[],
  walking: params.has('passo'),
  view: Number(params.get('vista') ?? 0) % 4,
};
const figures: Figure[] = [];
let ready = false;

function build(): void {
  ready = false;
  for (const f of figures) scene.remove(f.root);
  figures.length = 0;
  const base = bodyGrid(state.body, Math.max(1, Math.min(BODIES[state.body].seeds, state.seed)));
  const spacing = (Math.max(base.grid.X, base.grid.Y) / VPT) * 1.5 + 0.6;
  WAYS.forEach((way: WayId, k) => {
    let f: Figure;
    if (way === 'A') {
      f = figure(base);
      for (const id of ITEMS) {
        const worn = prepared.mesh[id];
        if (!state.outfit.includes(id) || !worn) continue;
        const m = wornMatrix(base, id, worn);
        if (!m) continue;
        const mesh = meshOf(meshVoxels(worn.grid, worn.palette, { vpt: VPT }));
        mesh.matrixAutoUpdate = false;
        mesh.matrix.copy(m);
        f.root.add(mesh);
      }
    } else f = figure(dress(base, VPT, state.outfit, way, prepared).dressed);
    f.root.position.x = (k - 1) * spacing;
    scene.add(f.root);
    figures.push(f);
  });
  camDist = spacing * 8.6;
  ready = true;
}

// --- Controls ---------------------------------------------------------------------------------------------------------------------

const select = $<HTMLSelectElement>('body');
for (const name of Object.keys(BODIES)) select.add(new Option(name, name, name === state.body, name === state.body));
select.addEventListener('change', () => {
  state.body = select.value;
  build();
});
const seedInput = $<HTMLInputElement>('seed');
seedInput.value = String(state.seed);
seedInput.addEventListener('change', () => {
  state.seed = Number(seedInput.value) || 1;
  build();
});
for (const id of ITEMS) {
  const box = $<HTMLInputElement>(id);
  box.checked = state.outfit.includes(id);
  box.addEventListener('change', () => {
    state.outfit = ITEMS.filter((i) => $<HTMLInputElement>(i).checked);
    build();
  });
}
const walkButton = $('walk');
const showWalk = () => walkButton.classList.toggle('active', state.walking);
walkButton.addEventListener('click', () => {
  state.walking = !state.walking;
  showWalk();
});
showWalk();
$('turn').addEventListener('click', () => (state.view = (state.view + 1) % 4));
addEventListener('keydown', (e) => {
  if (e.key === '.') state.view = (state.view + 1) % 4;
  if (e.key === ',') state.view = (state.view + 3) % 4;
});
look.set(CARTOON);
bindLookButton(look, $('look'));

// --- The loop ---------------------------------------------------------------------------------------------------------------------

let camDist = 8;
/** How far the figures are turned now (toward `state.view` quarters, each on its place; the camera stays as the game's). */
let turn = state.view * (Math.PI / 2);
const target = new THREE.Vector3(0, 0.75, 0);
/** As the game's camera: from the south, 54° from above. */
const PITCH = (54 * Math.PI) / 180;
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  bloom.setSize(innerWidth, innerHeight, renderer.getPixelRatio());
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

let last = performance.now();
let t = 0;
function frame(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  t += dt;
  const goal = state.view * (Math.PI / 2);
  turn += Math.atan2(Math.sin(goal - turn), Math.cos(goal - turn)) * Math.min(1, dt * 8);
  camera.position.set(target.x, target.y + Math.sin(PITCH) * camDist, target.z + Math.cos(PITCH) * camDist);
  camera.lookAt(target);
  renderer.info.reset();
  for (const f of figures) f.root.rotation.y = turn;
  for (const f of figures)
    for (const l of f.limbs) {
      const swing = state.walking ? Math.sin(t * 7) * 0.55 * l.phase : 0;
      if (l.part === 'leg' || l.part === 'arm') l.pivot.rotation.x = swing;
      else if (l.part === 'tail') l.pivot.rotation.y = state.walking ? Math.sin(t * 5) * 0.4 : 0;
    }
  look.sunOver(target);
  scene.background = new THREE.Color(0x9cc8e8);
  const air = aerial(camDist, 1);
  scene.fog = new THREE.Fog(0x9cc8e8, air.near * 8, air.far * 8);
  bloom.render(dt);
  $('stats').textContent = `${renderer.info.render.calls} chiamate · ${renderer.info.render.triangles.toLocaleString('it')} triangoli`;
  requestAnimationFrame(frame);
}

build();
requestAnimationFrame(frame);

declare global {
  interface Window {
    indossati: unknown;
  }
}
window.indossati = {
  state,
  build,
  get ready() {
    return ready;
  },
  view(v: number) {
    state.view = ((v % 4) + 4) % 4;
    turn = state.view * (Math.PI / 2);
  },
  set(next: Partial<typeof state>) {
    Object.assign(state, next);
    build();
  },
};
