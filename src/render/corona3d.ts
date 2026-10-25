// The corona in 3D: the studio's campus on the ring beyond the circle (a dark avenue with a glowing
// line, alleys between the sectors, lawns, one block per folder with neon edges in its colour, a door
// under a neon sign with the building's name, a glowing edge), and inside each tower its rooms
// (24 × 15 cells, several floors): neon grid on the floor, walls with a strip of light, racks of files,
// the gallery's models on show, screens, teleports, stairs, the Council's round table with the universe
// turning above it, the showcases with their arrows (T21). Built from the kernel's cells
// (src/kernel/corona.ts): logic stays in the kernel.

import * as THREE from 'three';
import { PLACE_PHASES, type Kernel, type PlaceMiniature, type ShowcaseEntry } from '../kernel/kernel';
import { CAMPUS, ROOM_H, ROOM_W, type Building, type Floor, type StudioItem } from '../kernel/corona';
import { Builder } from './terrain';
import { MAT, rgbOf } from './materials';
import { NODE_COLOR } from '../kernel/graph';
import { geoOf, modelObject, showFrame, type ModelObject } from './models';
import { LEVEL } from '../kernel/relief';
import { OPERATION_COLOR, type Situation } from '../kernel/situation';

const TOWER_H = 4.5;
const GROUND: Record<string, [string, string]> = { viale: ['#161824', '#12131d'], vicolo: ['#14141c', '#111119'], prato: ['#0b0f15', '#0b0f15'], bordo: ['#0d0d16', '#0d0d16'] };
const LOOK_COLOR: Record<string, string> = { libro: '#a0683a', cristallo: '#5fe0ff', pergamena: '#e8dcb0', tavoletta: '#9aa3ad' };

/** How bright the studio's floor grid is, over the building's colour (T49a: faint, and it does not bloom). */
const GRID = 0.12;

/** A thin glowing frame along the top edges of a cell block where it meets the outside. */
function edgeStrip(b: Builder, x: number, z: number, y: number, open: { n: boolean; s: boolean; w: boolean; e: boolean }, rgb: number[]): void {
  const t = 0.05;
  if (open.n) b.box(x, y - t, z, x + 1, y, z + t, rgb);
  if (open.s) b.box(x, y - t, z + 1 - t, x + 1, y, z + 1, rgb);
  if (open.w) b.box(x, y - t, z, x + t, y, z + 1, rgb);
  if (open.e) b.box(x + 1 - t, y - t, z, x + 1, y, z + 1, rgb);
}

/** The ring outside: built once per corona layout. */
export function buildCoronaRing(k: Kernel): THREE.Group {
  const c = k.corona;
  const R = c.radius;
  const max = Math.ceil(c.outer) + 1;
  const lit = new Builder();
  const glow = new Builder();
  for (let y = -max; y < max; y++)
    for (let x = -max; x < max; x++) {
      const cell = c.at(x, y);
      if (!cell) continue;
      const d = Math.hypot(x + 0.5, y + 0.5);
      const b = cell.building ? c.building(cell.building) : undefined;
      // A building that is a model (T20): its cells are ground, the model stands on them.
      if (cell.kind === 'floor' || (b?.structure && cell.kind !== 'door')) {
        const [a, b2] = GROUND[cell.ground ?? 'prato'];
        lit.quad([x, 0, y], [x, 0, y + 1], [x + 1, 0, y + 1], [x + 1, 0, y], [0, 1, 0], rgbOf((x + y) & 1 ? a : b2));
        if (cell.ground === 'viale' && Math.abs(d - (R + CAMPUS.line)) < 0.5) glow.box(x, 0.005, y + 0.45, x + 1, 0.02, y + 0.55, rgbOf('#05d9e8', 0.7));
        if (cell.ground === 'vicolo' && (x * 7 + y * 3) % 5 === 0) glow.box(x + 0.45, 0.005, y + 0.45, x + 0.55, 0.02, y + 0.55, rgbOf('#ff2a6d', 0.6));
        if (cell.ground === 'bordo') glow.box(x + 0.2, 0, y + 0.2, x + 0.8, 0.5, y + 0.8, rgbOf('#05d9e8', 0.5));
      } else if (cell.kind === 'building' && b) {
        lit.box(x, 0, y, x + 1, TOWER_H, y + 1, rgbOf((x + y) & 1 ? '#1a1a26' : '#16161f'));
        const out = (dx: number, dy: number) => c.at(x + dx, y + dy)?.kind !== 'building';
        const open = { n: out(0, -1), s: out(0, 1), w: out(-1, 0), e: out(1, 0) };
        edgeStrip(glow, x, y, TOWER_H, open, rgbOf(b.color));
        edgeStrip(glow, x, y, 0.06, open, rgbOf(b.color, 0.6));
        if ((x * 13 + y * 7) % 9 === 0 && (open.s || open.n || open.w || open.e)) glow.box(x + 0.35, 1.2 + (x % 3) * 0.5, y + 0.35, x + 0.65, 1.5 + (x % 3) * 0.5, y + 0.65, rgbOf(b.color, 0.8));
      } else if (cell.kind === 'door' && b?.structure) {
        // Where one goes in: a glowing threshold in front of the model's door.
        lit.quad([x, 0, y], [x, 0, y + 1], [x + 1, 0, y + 1], [x + 1, 0, y], [0, 1, 0], rgbOf('#1a0a14'));
        glow.box(x + 0.15, 0.005, y + 0.15, x + 0.85, 0.02, y + 0.85, rgbOf(b.color, 0.5));
      } else if (cell.kind === 'door' && b) {
        lit.quad([x, 0, y], [x, 0, y + 1], [x + 1, 0, y + 1], [x + 1, 0, y], [0, 1, 0], rgbOf('#1a0a14'));
        glow.box(x + 0.1, 0, y + 0.45, x + 0.18, 1.5, y + 0.55, rgbOf('#ff2a6d'));
        glow.box(x + 0.82, 0, y + 0.45, x + 0.9, 1.5, y + 0.55, rgbOf('#ff2a6d'));
        glow.box(x + 0.1, 1.42, y + 0.45, x + 0.9, 1.5, y + 0.55, rgbOf('#ff2a6d'));
      }
    }
  const g = new THREE.Group();
  const m = new THREE.Mesh(lit.geometry(), MAT.corona);
  m.receiveShadow = m.castShadow = true;
  g.add(m, new THREE.Mesh(glow.geometry(), MAT.glow));
  const frames: THREE.Mesh[][] = [];
  for (const b of c.buildings) {
    const s = b.structure;
    // A model has its own sign (the letter named `insegna`); a plain block gets one in neon over its door.
    const geo = s && geoOf(s.form);
    if (!s || !geo) {
      g.add(neonSign(b, R));
      continue;
    }
    // An animated model shows one frame at a time instead of its body (the tower's energy pulses).
    const place = (geo: THREE.BufferGeometry) => {
      const mesh = new THREE.Mesh(geo, MAT.corona);
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.position.set(s.x, 0, s.y);
      mesh.rotation.y = s.yaw;
      g.add(mesh);
      return mesh;
    };
    if (!geo.frames.length) place(geo.body);
    else frames.push(geo.frames.map(place));
  }

  // Campus props (T50b, T50e): lampioni along the avenue, light trees on lawns, benches and totems
  for (const p of c.props) {
    const f = k.forms.ready(p.model, p.seed);
    const geo = f && geoOf(f);
    if (!geo) {
      k.forms.get(p.model, p.seed);
      continue;
    }
    const mat = p.kind === 'albero' ? MAT.sway : MAT.corona;
    const placeProp = (bg: THREE.BufferGeometry) => {
      const mesh = new THREE.Mesh(bg, mat);
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.position.set(p.x, 0, p.y);
      mesh.rotation.y = p.yaw;
      g.add(mesh);
      return mesh;
    };
    if (!geo.frames.length) placeProp(geo.body);
    else frames.push(geo.frames.map(placeProp));
  }

  // Logistics (T50c): Flying data drones and magnetic pod trains
  const droneForm = k.forms.ready('corona-drone', 1);
  const droneGeo = droneForm && geoOf(droneForm);
  if (!droneGeo) k.forms.get('corona-drone', 1);

  const trainForm = k.forms.ready('corona-treno', 1);
  const trainGeo = trainForm && geoOf(trainForm);
  if (!trainGeo) k.forms.get('corona-treno', 1);

  const drones: CampusDrone[] = [];
  if (droneGeo) {
    for (let i = 0; i < 4; i++) {
      const dg = new THREE.Group();
      const placeD = (bg: THREE.BufferGeometry) => {
        const mesh = new THREE.Mesh(bg, MAT.corona);
        mesh.castShadow = true;
        dg.add(mesh);
        return mesh;
      };
      const frms = droneGeo.frames.length ? droneGeo.frames.map(placeD) : [placeD(droneGeo.body)];
      g.add(dg);
      drones.push({
        group: dg,
        frames: frms,
        fromBuilding: (i * 3) % Math.max(1, c.buildings.length),
        toBuilding: (i * 3 + 4) % Math.max(1, c.buildings.length),
        cycleTime: 14 + i * 2,
        phase: i * 4.0,
      });
    }
  }

  const trains: CampusTrain[] = [];
  if (trainGeo) {
    for (let i = 0; i < 2; i++) {
      const tg = new THREE.Group();
      const placeT = (bg: THREE.BufferGeometry) => {
        const mesh = new THREE.Mesh(bg, MAT.corona);
        mesh.castShadow = true;
        tg.add(mesh);
        return mesh;
      };
      const frms = trainGeo.frames.length ? trainGeo.frames.map(placeT) : [placeT(trainGeo.body)];
      g.add(tg);
      trains.push({
        group: tg,
        frames: frms,
        trackRadius: R + CAMPUS.avenue - 0.7,
        speed: 0.08,
        phase: i * Math.PI,
      });
    }
  }

  g.userData.drones = drones;
  g.userData.trains = trains;
  g.userData.frames = frames;
  return g;
}

export interface CampusDrone {
  group: THREE.Group;
  frames: THREE.Mesh[];
  fromBuilding: number;
  toBuilding: number;
  cycleTime: number;
  phase: number;
}

export interface CampusTrain {
  group: THREE.Group;
  frames: THREE.Mesh[];
  trackRadius: number;
  speed: number;
  phase: number;
}

/** The frames of the campus's animated buildings, props and logistics (T50c, T50e). */
export function animateRing(ring: THREE.Group, t: number, k?: Kernel): void {
  (ring.userData.frames as THREE.Mesh[][] | undefined)?.forEach((f, i) => showFrame(f, t, i * 0.37));

  const drones = ring.userData.drones as CampusDrone[] | undefined;
  if (drones && k) {
    const c = k.corona;
    const bCount = Math.max(1, c.buildings.length);
    for (let i = 0; i < drones.length; i++) {
      const d = drones[i];
      showFrame(d.frames, t * 2, i * 0.25);
      const p = ((t + d.phase) % d.cycleTime) / d.cycleTime;
      const bA = c.buildings[d.fromBuilding % bCount];
      const bB = c.buildings[d.toBuilding % bCount];
      if (!bA || !bB) continue;
      const angleA = (bA.from + bA.to) / 2;
      let angleB = (bB.from + bB.to) / 2;
      while (angleB - angleA > Math.PI) angleB -= Math.PI * 2;
      while (angleB - angleA < -Math.PI) angleB += Math.PI * 2;

      const ease = 0.5 - 0.5 * Math.cos(p * Math.PI);
      const angle = angleA + (angleB - angleA) * ease;
      const arcRadius = c.radius + CAMPUS.avenue + 1 + Math.sin(p * Math.PI) * 5;
      const px = Math.sin(angle) * arcRadius;
      const py = -Math.cos(angle) * arcRadius;
      const alt = 2.4 + Math.sin(p * Math.PI) * 1.2 + Math.sin(t * 4 + i) * 0.12;

      const nextP = Math.min(1, p + 0.02);
      const nextEase = 0.5 - 0.5 * Math.cos(nextP * Math.PI);
      const nextAngle = angleA + (angleB - angleA) * nextEase;
      const nextRadius = c.radius + CAMPUS.avenue + 1 + Math.sin(nextP * Math.PI) * 5;
      const nx = Math.sin(nextAngle) * nextRadius;
      const ny = -Math.cos(nextAngle) * nextRadius;

      d.group.position.set(px, alt, py);
      d.group.rotation.y = Math.atan2(nx - px, ny - py);
      d.group.rotation.z = Math.sin(t * 4 + i) * 0.06;
    }
  }

  const trains = ring.userData.trains as CampusTrain[] | undefined;
  if (trains) {
    for (let i = 0; i < trains.length; i++) {
      const tr = trains[i];
      showFrame(tr.frames, t, i * 0.5);
      const angle = (t * tr.speed + tr.phase) % (Math.PI * 2);
      const px = Math.sin(angle) * tr.trackRadius;
      const py = -Math.cos(angle) * tr.trackRadius;
      tr.group.position.set(px, 0.08 + Math.sin(t * 6 + i) * 0.015, py);
      tr.group.rotation.y = -angle - Math.PI / 2;
    }
  }
}

/** What the campus wears (T20, T50e): the ring is built again when a building or prop becomes ready. */
export const campusKey = (k: Kernel) =>
  `${k.forms.version}|` + k.corona.buildings.map((b) => (b.structure && geoOf(b.structure.form) ? b.structure.form.key : '')).join('|');

/** The building's name in neon above its door, facing the avenue (and, on its back, the lawns). */
function neonSign(b: Building, R: number): THREE.Group {
  if (typeof document === 'undefined') return new THREE.Group();
  const W = 1024, H = 160;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = 'rgba(8,8,15,0.85)';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = b.color;
  ctx.shadowColor = b.color;
  ctx.shadowBlur = 18;
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, W - 20, H - 20);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.min(96, Math.floor((W - 80) / Math.max(1, b.name.length) * 1.7))}px system-ui, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(b.name, W / 2, H / 2 + 4);
  ctx.shadowBlur = 0;
  ctx.fillStyle = b.color;
  ctx.globalAlpha = 0.55;
  ctx.fillText(b.name, W / 2, H / 2 + 4);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  const geo = new THREE.PlaneGeometry(9, 9 * (H / W));
  const front = new THREE.Mesh(geo, mat);
  const back = new THREE.Mesh(geo, mat);
  back.rotation.y = Math.PI;
  back.position.z = -0.06;
  const g = new THREE.Group();
  g.add(front, back);
  // On the front of the block, over the door; the plane's +z faces the centre of the ring.
  const mid = (b.from + b.to) / 2;
  const r = R + CAMPUS.front - 0.1;
  g.position.set(Math.sin(mid) * r, TOWER_H + 0.9, -Math.cos(mid) * r);
  g.rotation.y = -mid;
  return g;
}

/** One room of the studio (a floor of a building), in real space. */
export function buildRoom(k: Kernel, building: Building, floor: Floor): { group: THREE.Group; globe?: THREE.Object3D } {
  const col = building.color;
  const lit = new Builder();
  const glow = new Builder();
  const X = floor.ox, Z = floor.oy;
  // Floor and its grid: faint lines that do not bloom (T49a: a glowing grid was a haze over the whole floor).
  lit.quad([X, 0, Z], [X, 0, Z + ROOM_H], [X + ROOM_W, 0, Z + ROOM_H], [X + ROOM_W, 0, Z], [0, 1, 0], rgbOf('#08080f'));
  const lines = new Builder();
  const grid = rgbOf(col, GRID);
  for (let x = 1; x < ROOM_W; x++) lines.box(X + x - 0.01, 0.003, Z + 1, X + x + 0.01, 0.006, Z + ROOM_H - 1, grid);
  for (let y = 1; y < ROOM_H; y++) lines.box(X + 1, 0.003, Z + y - 0.01, X + ROOM_W - 1, 0.006, Z + y + 0.01, grid);
  // Walls: dark metal with a strip of light on all four, the low front wall's at its top, open at the exit.
  const wall = rgbOf('#13131d');
  const H = 1.4, low = H * 0.35;
  lit.box(X, 0, Z, X + ROOM_W, H, Z + 1, wall);
  lit.box(X, 0, Z + ROOM_H - 1, X + ROOM_W, low, Z + ROOM_H, wall);
  lit.box(X, 0, Z, X + 1, H, Z + ROOM_H, wall);
  lit.box(X + ROOM_W - 1, 0, Z, X + ROOM_W, H, Z + ROOM_H, wall);
  glow.box(X + 1, H * 0.7, Z + 0.98, X + ROOM_W - 1, H * 0.75, Z + 1.02, rgbOf(col));
  glow.box(X + 0.98, H * 0.7, Z + 1, X + 1.02, H * 0.75, Z + ROOM_H - 1, rgbOf(col));
  glow.box(X + ROOM_W - 1.02, H * 0.7, Z + 1, X + ROOM_W - 0.98, H * 0.75, Z + ROOM_H - 1, rgbOf(col));
  const exit = floor.items.find((i) => i.kind === 'exit');
  const gaps = exit ? [[X + 1, exit.x], [exit.x + 1, X + ROOM_W - 1]] : [[X + 1, X + ROOM_W - 1]];
  for (const [a, b] of gaps) if (b > a) glow.box(a, low - 0.05, Z + ROOM_H - 1.02, b, low, Z + ROOM_H - 0.98, rgbOf(col));
  // Racks under the rows of files and exhibits, a neon rim all round their top.
  const shelf = floor.items.filter((i) => i.kind === 'file' || i.kind === 'sprite' || i.kind === 'tile' || i.kind === 'layout');
  for (const y of new Set(shelf.map((i) => i.y))) {
    const xs = shelf.filter((i) => i.y === y).map((i) => i.x).sort((a, b) => a - b);
    // One rack per run of neighbouring slots: around a room's device the shelves stop at its sides (T49b).
    for (let i = 0, j = 0; i < xs.length; i = j) {
      for (j = i + 1; j < xs.length && xs[j] - xs[j - 1] === 1; j++);
      const a0 = xs[i] - 0.05, a1 = xs[j - 1] + 1.05;
      lit.box(a0, 0, y + 0.3, a1, 0.35, y + 0.75, rgbOf('#1a1e2e'));
      rim(glow, a0, y + 0.3, a1, y + 0.75, 0.35, rgbOf(col));
    }
  }
  let globe: THREE.Object3D | undefined;
  for (const it of floor.items) itemMesh(lit, glow, it, col, k);
  const group = new THREE.Group();
  const m = new THREE.Mesh(lit.geometry(), MAT.corona);
  m.receiveShadow = m.castShadow = true;
  group.add(m, new THREE.Mesh(glow.geometry(), MAT.glow), new THREE.Mesh(lines.geometry(), MAT.line));
  // The gallery's things on their plinths: the models themselves, made to fit.
  for (const it of floor.items) {
    if (it.kind !== 'sprite' || !it.model) continue;
    const f = k.forms.ready(it.model, 1, it.tint);
    const geo = f && geoOf(f);
    if (!geo) continue;
    geo.body.computeBoundingBox();
    const size = new THREE.Vector3();
    geo.body.boundingBox!.getSize(size);
    const s = Math.min(0.7 / Math.max(size.x, size.z, 0.01), 0.9 / Math.max(size.y, 0.01), 1);
    const m = new THREE.Mesh(geo.body, MAT.corona);
    m.scale.setScalar(s);
    m.position.set(it.x + 0.5, 0.46, it.y + 0.52);
    m.castShadow = true;
    group.add(m);
  }
  // The environments of the sample room (T26d): each one's trial draft in miniature on its plinth, like a place.
  for (const it of floor.items) {
    const sample = it.kind === 'layout' && it.target ? k.layoutSample(it.target.replace(/^layout:/, '')) : undefined;
    if (!sample) continue;
    const m = buildMiniature(k, sample.mini, SAMPLE_SIDE);
    m.position.set(it.x + (1 - SAMPLE_SIDE) / 2, 0.47, it.y + 0.525 - SAMPLE_SIDE / 2);
    group.add(m);
  }
  // The Nucleus's graph of the world (T28), turning above its pedestal.
  const graph = floor.items.find((i) => i.kind === 'grafo');
  if (graph) {
    globe = graphHologram(k);
    globe.position.set(graph.x + (graph.w ?? 1) / 2, 1.9, graph.y + (graph.h ?? 1) / 2);
    group.add(globe);
  }
  // The Library's lectern: the open holographic book above the dark pool (T47a).
  const lectern = floor.items.find((i) => i.kind === 'leggio');
  if (lectern) {
    const book = bookHologram(col);
    book.position.set(lectern.x + (lectern.w ?? 3) / 2, 1.05, lectern.y + (lectern.h ?? 3) / 2);
    group.add(book);
  }
  // The universe turning above the Council's table.
  const table = floor.items.find((i) => i.kind === 'table');
  if (table) {
    globe = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 1), new THREE.MeshBasicMaterial({ color: '#05d9e8', wireframe: true }));
    globe.position.set(X + 12, 1.6, Z + 8.5);
    group.add(globe);
  }
  return { group, globe };
}

/**
 * The graph of the world as a hologram (T28): its most connected nodes on a sphere, each a glowing voxel in the colour
 * of its kind (the hubs bigger), the edges among them as faint lines.
 */
function graphHologram(k: Kernel): THREE.Group {
  const g = k.graph();
  const degree = new Map<string, number>();
  for (const l of g.links) for (const id of [l.source, l.target]) degree.set(id, (degree.get(id) ?? 0) + 1);
  const nodes = [...g.nodes.values()].sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0)).slice(0, 120);
  const at = new Map<string, number[]>();
  const golden = Math.PI * (3 - Math.sqrt(5));
  const R = 1.15;
  const glow = new Builder();
  nodes.forEach((n, i) => {
    const y = 1 - ((i + 0.5) / nodes.length) * 2, r = Math.sqrt(1 - y * y), t = i * golden;
    const p = [Math.cos(t) * r * R, y * R, Math.sin(t) * r * R];
    at.set(n.id, p);
    const h = 0.022 + Math.min(0.035, Math.sqrt(degree.get(n.id) ?? 0) * 0.007);
    glow.box(p[0] - h, p[1] - h, p[2] - h, p[0] + h, p[1] + h, p[2] + h, rgbOf(NODE_COLOR[n.tipo], 0.45));
  });
  const lines: number[] = [];
  for (const l of g.links) {
    const a = at.get(l.source), b = at.get(l.target);
    if (a && b) lines.push(...a, ...b);
  }
  const group = new THREE.Group();
  group.add(new THREE.Mesh(glow.geometry(), MAT.glow));
  if (lines.length) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
    group.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#6fc3ff', transparent: true, opacity: 0.25 })));
  }
  return group;
}

/**
 * The open holographic book of the Library's lectern (T47a):
 * an open book with glowing pages spreading out, glowing lines of text and hovering rune embers.
 */
function bookHologram(col = '#7dd87d'): THREE.Group {
  const g = new THREE.Group();
  const lit = new Builder();
  const glow = new Builder();
  const spineCol = rgbOf('#1b3d2f');
  const pageGlow = rgbOf(col, 0.65);
  const textCol = rgbOf('#c0ffd0', 0.9);

  // Book spine along Z
  lit.box(-0.04, 0, -0.3, 0.04, 0.05, 0.3, spineCol);
  glow.box(-0.02, 0.04, -0.28, 0.02, 0.06, 0.28, pageGlow);

  // Left page wing (curving/stepping up to the left)
  const steps = 6;
  const pw = 0.42 / steps;
  for (let s = 0; s < steps; s++) {
    const x0 = -0.04 - (s + 1) * pw;
    const x1 = -0.04 - s * pw;
    const y0 = 0.03 + s * 0.018;
    const y1 = y0 + 0.025;
    glow.box(x0, y0, -0.28, x1, y1, 0.28, pageGlow);
    if (s % 2 === 1) {
      glow.box(x0 + 0.01, y1, -0.22, x1 - 0.01, y1 + 0.008, 0.22, textCol);
    }
  }

  // Right page wing (curving/stepping up to the right)
  for (let s = 0; s < steps; s++) {
    const x0 = 0.04 + s * pw;
    const x1 = 0.04 + (s + 1) * pw;
    const y0 = 0.03 + s * 0.018;
    const y1 = y0 + 0.025;
    glow.box(x0, y0, -0.28, x1, y1, 0.28, pageGlow);
    if (s % 2 === 1) {
      glow.box(x0 + 0.01, y1, -0.22, x1 - 0.01, y1 + 0.008, 0.22, textCol);
    }
  }

  // Floating embers / light sparks above the open book
  const embers = [
    [-0.14, 0.22, -0.08],
    [0.12, 0.25, 0.06],
    [-0.05, 0.30, 0.12],
    [0.18, 0.20, -0.10],
  ];
  for (const [ex, ey, ez] of embers) {
    glow.box(ex - 0.015, ey - 0.015, ez - 0.015, ex + 0.015, ey + 0.015, ez + 0.015, textCol);
  }

  const litMesh = new THREE.Mesh(lit.geometry(), MAT.corona);
  const glowMesh = new THREE.Mesh(glow.geometry(), MAT.glow);
  g.add(litMesh);
  g.add(glowMesh);
  g.rotation.x = -0.22;
  return g;
}

/** A quad wound so that its front faces along n (the builders draw one side). */
function facing(b: Builder, p: number[][], n: number[], rgb: number[]): void {
  const [a, q, c, d] = p;
  const u = [q[0] - a[0], q[1] - a[1], q[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const dot = (u[1] * v[2] - u[2] * v[1]) * n[0] + (u[2] * v[0] - u[0] * v[2]) * n[1] + (u[0] * v[1] - u[1] * v[0]) * n[2];
  if (dot >= 0) b.quad(a, q, c, d, n, rgb);
  else b.quad(a, d, c, q, n, rgb);
}

/**
 * The Council's round table as one piece (T25): an elliptical top on the kernel's ellipse (radii 3.4 × 2.3,
 * src/kernel/corona.ts), its edge rounded like half an ellipsoid, a neon rim and a neon ring under the universe.
 */
function roundTable(lit: Builder, glow: Builder, cx: number, cz: number, col: string): void {
  const RX = 3.4, RZ = 2.3, TOP = 0.6, N = 64;
  // The edge, bottom to top: (scale of the ellipse, height).
  const edge: Array<[number, number]> = [[0.8, 0], [0.9, 0.12], [0.97, 0.28], [1, 0.45], [0.97, TOP]];
  const at = (s: number, y: number, t: number) => [cx + Math.cos(t) * RX * s, y, cz + Math.sin(t) * RZ * s];
  const body = rgbOf('#1c1c2a'), top = rgbOf('#22223a');
  const ring = (b: Builder, s0: number, s1: number, y: number, rgb: number[]) => {
    for (let i = 0; i < N; i++) {
      const t0 = (i / N) * Math.PI * 2, t1 = ((i + 1) / N) * Math.PI * 2;
      facing(b, [at(s0, y, t0), at(s1, y, t0), at(s1, y, t1), at(s0, y, t1)], [0, 1, 0], rgb);
    }
  };
  for (let i = 0; i < N; i++) {
    const t0 = (i / N) * Math.PI * 2, t1 = ((i + 1) / N) * Math.PI * 2, tm = (t0 + t1) / 2;
    // The outward direction of the ellipse at this slice.
    const hx = Math.cos(tm) / RX, hz = Math.sin(tm) / RZ, hl = Math.hypot(hx, hz);
    for (let j = 0; j + 1 < edge.length; j++) {
      const [s0, y0] = edge[j], [s1, y1] = edge[j + 1];
      const nr = y1 - y0, ny = -(s1 - s0) * (RX + RZ) / 2, nl = Math.hypot(nr, ny);
      const n = [(hx / hl) * (nr / nl), ny / nl, (hz / hl) * (nr / nl)];
      const shade = 0.8 + 0.25 * Math.max(0, n[1]) + 0.1 * (nr / nl);
      facing(lit, [at(s0, y0, t0), at(s1, y1, t0), at(s1, y1, t1), at(s0, y0, t1)], n, body.map((v) => v * shade));
    }
    // The top, a fan from the centre to the rim.
    facing(lit, [[cx, TOP, cz], at(0.97, TOP, t0), at(0.97, TOP, t1), [cx, TOP, cz]], [0, 1, 0], top);
  }
  ring(glow, 0.9, 0.95, TOP + 0.005, rgbOf(col, 0.6));
  ring(glow, 0.26, 0.29, TOP + 0.005, rgbOf('#05d9e8', 0.7));
}

function itemMesh(lit: Builder, glow: Builder, it: StudioItem, col: string, k: Kernel): void {
  const x = it.x, z = it.y;
  switch (it.kind) {
    case 'file': {
      const c = rgbOf(LOOK_COLOR[it.look ?? 'tavoletta']);
      const h = 0.25 + Math.min(0.35, (it.lines ?? 10) / 400);
      (it.look === 'cristallo' ? glow : lit).box(x + 0.3, 0.38, z + 0.38, x + 0.7, 0.38 + h, z + 0.62, c);
      break;
    }
    case 'sprite':
    case 'tile':
      // A plinth: the model stands on it (added in buildRoom when it is ready); a terrain is a sample slab.
      lit.box(x + 0.15, 0.38, z + 0.3, x + 0.85, 0.46, z + 0.75, rgbOf('#22263a'));
      if (it.kind === 'tile') lit.box(x + 0.25, 0.46, z + 0.38, x + 0.75, 0.52, z + 0.68, rgbOf(it.color ?? col));
      break;
    case 'layout':
      // A square plinth with a neon rim: the environment in miniature stands on it (buildRoom).
      lit.box(x + 0.12, 0.38, z + 0.15, x + 0.88, 0.46, z + 0.9, rgbOf('#22263a'));
      rim(glow, x + 0.12, z + 0.15, x + 0.88, z + 0.9, 0.46, rgbOf(col, 0.6), 0.02, 0.01);
      break;
    case 'screen': {
      const w = it.w ?? 1;
      lit.box(x, 0, z + 0.4, x + w, 1.25, z + 0.6, rgbOf('#0c0c16'));
      glow.box(x + 0.05, 0.2, z + 0.38, x + w - 0.05, 1.15, z + 0.4, rgbOf(col, 0.45));
      break;
    }
    case 'grafo': {
      // A pedestal of dark metal under the hologram, with rings of light (T58a: rim on all four faces of both steps).
      const w = it.w ?? 1, d = it.h ?? 1, cx = x + w / 2, cz = z + d / 2;
      lit.box(cx - 1.2, 0, cz - 1.2, cx + 1.2, 0.18, cz + 1.2, rgbOf('#10101a'));
      lit.box(cx - 0.8, 0.18, cz - 0.8, cx + 0.8, 0.42, cz + 0.8, rgbOf('#161a28'));
      rim(glow, cx - 1.2, cz - 1.2, cx + 1.2, cz + 1.2, 0.18, rgbOf(col, 0.5));
      rim(glow, cx - 0.8, cz - 0.8, cx + 0.8, cz + 0.8, 0.42, rgbOf(col, 0.5));
      break;
    }
    case 'situazione': {
      // The situation table (T46a): a long dark table lit from below, a glass top with a golden rim; the marks are on it (buildSituation).
      const w = it.w ?? 1, d = it.h ?? 1;
      lit.box(x + 0.1, 0, z + 0.1, x + w - 0.1, 0.12, z + d - 0.1, rgbOf('#0e0e18'));
      lit.box(x + 0.35, 0.12, z + 0.35, x + w - 0.35, 0.62, z + d - 0.35, rgbOf('#141826'));
      glow.box(x + 0.32, 0.04, z + 0.32, x + w - 0.32, 0.08, z + d - 0.32, rgbOf(col, 0.35));
      lit.box(x, 0.62, z, x + w, 0.7, z + d, rgbOf('#0a0c14'));
      glow.box(x, 0.7, z, x + w, 0.72, z + 0.05, rgbOf(col, 0.8));
      glow.box(x, 0.7, z + d - 0.05, x + w, 0.72, z + d, rgbOf(col, 0.8));
      glow.box(x, 0.7, z, x + 0.05, 0.72, z + d, rgbOf(col, 0.8));
      glow.box(x + w - 0.05, 0.7, z, x + w, 0.72, z + d, rgbOf(col, 0.8));
      break;
    }
    case 'parete': {
      // A field of the Direction's wall of screens (T46b): a dark plinth with a golden edge and a support against the
      // back wall; the screen leans on them, tilted towards the camera (src/render/screens.ts).
      const w = it.w ?? 1;
      lit.box(x + 0.02, 0, z, x + w - 0.02, 1.95, z + 0.12, rgbOf('#0c0c16'));
      lit.box(x + 0.02, 0, z + 0.12, x + w - 0.02, 0.4, z + 1.15, rgbOf('#10101a'));
      glow.box(x + 0.02, 0.4, z + 1.13, x + w - 0.02, 0.43, z + 1.17, rgbOf(col, 0.7));
      break;
    }
    case 'stazione': {
      // A station of the Systems Room's chain (T27a): a dark plinth against the back wall, its front edge a piece of the
      // belt of light; the screen leans on it (src/render/chain.ts).
      const w = it.w ?? 1;
      lit.box(x + 0.03, 0, z, x + w - 0.03, 1.7, z + 0.12, rgbOf('#0c0c16'));
      lit.box(x + 0.03, 0, z + 0.12, x + w - 0.03, 0.4, z + 1.15, rgbOf('#10101a'));
      glow.box(x, 0.4, z + 1.12, x + w, 0.43, z + 1.18, rgbOf(col, 0.75));
      break;
    }
    case 'banco': {
      // The bench of the Systems Room (T27b): a dark plinth of w × h cells, the posts and the top frame of its glass case
      // with neon edges; the glass, the scene in miniature and the screen above are src/render/bench.ts.
      const w = it.w ?? 1, d = it.h ?? 1;
      const dark = rgbOf('#10101a');
      lit.box(x + 0.05, 0, z + 0.05, x + w - 0.05, BENCH_TOP, z + d - 0.05, dark);
      for (const px of [x + 0.05, x + w - 0.13]) for (const pz of [z + 0.05, z + d - 0.13]) lit.box(px, BENCH_TOP, pz, px + 0.08, BENCH_TOP + BENCH_GLASS, pz + 0.08, dark);
      rim(glow, x + 0.05, z + 0.05, x + w - 0.05, z + d - 0.05, BENCH_TOP - 0.03, rgbOf(col, 0.8));
      rim(glow, x + 0.05, z + 0.05, x + w - 0.05, z + d - 0.05, BENCH_TOP + BENCH_GLASS, rgbOf(col, 0.8));
      break;
    }
    case 'console': {
      // A console of the Direction (T46c): a desk facing the wall of screens, its monitor lit in the colour of its agent.
      const c = it.color ?? col;
      // Low, not to hide the foot of the screens behind it.
      lit.box(x + 0.08, 0, z + 0.25, x + 0.92, 0.4, z + 0.8, rgbOf('#141826'));
      lit.box(x + 0.15, 0.4, z + 0.3, x + 0.85, 0.66, z + 0.37, rgbOf('#0c0c16'));
      glow.box(x + 0.2, 0.44, z + 0.37, x + 0.8, 0.63, z + 0.385, rgbOf(c, 0.3));
      glow.box(x + 0.08, 0.4, z + 0.78, x + 0.92, 0.42, z + 0.8, rgbOf(c, 0.5));
      break;
    }
    case 'atlas':
      lit.box(x, 0, z + 0.1, x + (it.w ?? 1), 0.7, z + 0.9, rgbOf('#1a2a33'));
      glow.box(x + 0.1, 0.7, z + 0.2, x + (it.w ?? 1) - 0.1, 0.72, z + 0.8, rgbOf('#7dd87d', 0.6));
      break;
    case 'leggio': {
      // The lectern of the Library (T47a): a basin of dark water with a green neon rim,
      // a dark stone pedestal rising from the water, and the slanted desk for the book.
      const w = it.w ?? 3, d = it.h ?? 3;
      const cx = x + w / 2, cz = z + d / 2;
      const darkBorder = rgbOf('#0d1217');
      const green = rgbOf(col, 0.85);

      // Basin outer border (3x3 outer wall, low rim)
      const rimH = 0.16;
      lit.box(x, 0, z, x + w, rimH, z + 0.15, darkBorder);
      lit.box(x, 0, z + d - 0.15, x + w, rimH, z + d, darkBorder);
      lit.box(x, 0, z, x + 0.15, rimH, z + d, darkBorder);
      lit.box(x + w - 0.15, 0, z, x + w, rimH, z + d, darkBorder);

      // Inner edge neon glow rim around the water
      rim(glow, x + 0.15, z + 0.15, x + w - 0.15, z + d - 0.15, rimH, rgbOf(col, 0.5));

      // Basin floor and dark water surface inside
      lit.box(x + 0.15, 0, z + 0.15, x + w - 0.15, 0.04, z + d - 0.15, rgbOf('#060a0e'));
      // Water layer
      glow.box(x + 0.15, 0.08, z + 0.15, x + w - 0.15, 0.11, z + d - 0.15, rgbOf('#082824', 0.65));

      // Central stone pedestal / column rising from the water
      lit.box(cx - 0.45, 0, cz - 0.45, cx + 0.45, 0.22, cz + 0.45, rgbOf('#121820'));
      lit.box(cx - 0.25, 0.22, cz - 0.25, cx + 0.25, 0.78, cz + 0.25, rgbOf('#162028'));
      // Lectern top desk (slanted towards +z, towards viewer)
      lit.box(cx - 0.5, 0.78, cz - 0.4, cx + 0.5, 0.86, cz + 0.4, rgbOf('#10161c'));
      glow.box(cx - 0.52, 0.85, cz - 0.42, cx + 0.52, 0.87, cz - 0.38, green);
      glow.box(cx - 0.52, 0.85, cz + 0.38, cx + 0.52, 0.87, cz + 0.42, green);
      break;
    }
    case 'lastra': {
      // A rule tablet on the wall of the Library of the World (T47b):
      // A dark slate tablet against the back wall, with engraved runic text;
      // the newest 12 rules shine with radiant emerald/golden light and floating embers.
      const marked = !!it.marked;
      const tabletCol = marked ? rgbOf('#ffcf5c') : rgbOf(col, 0.4);

      // Low pedestal/bracket at the wall base
      lit.box(x + 0.12, 0, z + 0.15, x + 0.88, 0.12, z + 0.48, rgbOf('#0e1218'));
      rim(glow, x + 0.12, z + 0.15, x + 0.88, z + 0.48, 0.12, marked ? rgbOf(col, 0.6) : rgbOf('#1e2a22', 0.3));

      // The vertical stone tablet
      lit.box(x + 0.16, 0.12, z + 0.18, x + 0.84, 1.35, z + 0.38, rgbOf('#111622'));

      if (marked) {
        // Glowing neon rim around the tablet
        glow.box(x + 0.14, 0.12, z + 0.17, x + 0.86, 1.37, z + 0.21, rgbOf('#7dd87d', 0.85));
        glow.box(x + 0.14, 1.33, z + 0.17, x + 0.86, 1.37, z + 0.39, tabletCol);

        // Engraved text lines glowing brightly
        glow.box(x + 0.22, 0.45, z + 0.17, x + 0.78, 0.48, z + 0.20, tabletCol);
        glow.box(x + 0.26, 0.70, z + 0.17, x + 0.72, 0.73, z + 0.20, rgbOf('#7dd87d', 0.9));
        glow.box(x + 0.22, 0.95, z + 0.17, x + 0.78, 0.98, z + 0.20, tabletCol);
        glow.box(x + 0.30, 1.15, z + 0.17, x + 0.70, 1.18, z + 0.20, rgbOf('#7dd87d', 0.9));

        // Floating embers / sparks above the shining tablet
        glow.box(x + 0.48, 1.45, z + 0.25, x + 0.52, 1.49, z + 0.29, tabletCol);
        glow.box(x + 0.35, 1.55, z + 0.28, x + 0.39, 1.59, z + 0.32, rgbOf('#7dd87d', 0.8));
      } else {
        // Unmarked older tablet: subtle quiet carving
        glow.box(x + 0.16, 0.12, z + 0.18, x + 0.84, 1.35, z + 0.20, rgbOf(col, 0.25));
        glow.box(x + 0.25, 0.55, z + 0.18, x + 0.75, 0.57, z + 0.20, rgbOf(col, 0.3));
        glow.box(x + 0.28, 0.85, z + 0.18, x + 0.72, 0.87, z + 0.20, rgbOf(col, 0.3));
      }
      break;
    }
    case 'portal': {
      const c = rgbOf(it.target ? (k.corona.building(it.target)?.color ?? col) : '#ffffff');
      glow.box(x + 0.15, 0, z + 0.15, x + 0.85, 0.05, z + 0.85, c);
      glow.box(x + 0.45, 0.05, z + 0.45, x + 0.55, 1.1, z + 0.55, c.map((v) => v * 0.5));
      break;
    }
    case 'table':
      roundTable(lit, glow, x, z + 0.5, col);
      break;
    case 'showcase':
      showcaseBody(lit, glow, it, col);
      break;
    case 'less':
    case 'more':
      // A pad on the floor (T26), walked on (its sign is drawn with what the showcase shows).
      lit.box(x + 0.12, 0, z + 0.12, x + 0.88, 0.04, z + 0.88, rgbOf('#141420'));
      glow.box(x + 0.18, 0.04, z + 0.18, x + 0.82, 0.06, z + 0.82, rgbOf(col, 0.7));
      break;
    case 'prev':
    case 'next':
      // A pillar with a glowing button on top (its arrow is drawn with what the showcase shows).
      lit.box(x + 0.25, 0, z + 0.3, x + 0.75, 0.9, z + 0.7, rgbOf('#141420'));
      glow.box(x + 0.22, 0.9, z + 0.27, x + 0.78, 0.96, z + 0.73, rgbOf(col, 0.8));
      break;
    case 'desk':
      glow.box(x + 0.1, 0.004, z + 0.45, x + 0.9, 0.012, z + 0.55, rgbOf(col, 0.6));
      break;
    case 'up':
    case 'down':
      for (let i = 0; i < 4; i++) lit.box(x + 0.05, 0, z + i * 0.25, x + 0.95, (it.kind === 'up' ? 4 - i : i + 1) * 0.15, z + (i + 1) * 0.25, rgbOf('#1c2433'));
      glow.box(x + 0.05, 0.6, z, x + 0.95, 0.63, z + 0.04, rgbOf('#05d9e8'));
      break;
    case 'exit':
      glow.box(x + 0.1, 0, z + 0.45, x + 0.18, 1.2, z + 0.55, rgbOf('#ff2a6d'));
      glow.box(x + 0.82, 0, z + 0.45, x + 0.9, 1.2, z + 0.55, rgbOf('#ff2a6d'));
      glow.box(x + 0.1, 1.12, z + 0.45, x + 0.9, 1.2, z + 0.55, rgbOf('#ff2a6d'));
      break;
  }
}

/** A neon rim all round the top (at height y) of a box from (x0, z0) to (x1, z1), e wide and t thick, inside its edge. */
function rim(glow: Builder, x0: number, z0: number, x1: number, z1: number, y: number, c: number[], e = 0.04, t = 0.03): void {
  glow.box(x0, y, z0, x1, y + t, z0 + e, c);
  glow.box(x0, y, z1 - e, x1, y + t, z1, c);
  glow.box(x0, y, z0 + e, x0 + e, y + t, z1 - e, c);
  glow.box(x1 - e, y, z0 + e, x1, y + t, z1 - e, c);
}

/** A neon ring all round a cylinder of outer radius r at height y, e wide and t thick (T58b). */
function circleRim(glow: Builder, cx: number, cz: number, r: number, y: number, c: number[], e = 0.05, t = 0.03, n = 28): void {
  glow.ring(cx, y, cz, r - e, r, c, n);
  if (t !== 0) {
    const y0 = Math.min(y, y + t), y1 = Math.max(y, y + t);
    for (let i = 0; i < n; i++) {
      const a0 = (i * Math.PI * 2) / n;
      const a1 = ((i + 1) * Math.PI * 2) / n;
      const x0 = cx + Math.cos(a0) * r, z0 = cz + Math.sin(a0) * r;
      const x1 = cx + Math.cos(a1) * r, z1 = cz + Math.sin(a1) * r;
      const nx = Math.cos((a0 + a1) / 2), nz = Math.sin((a0 + a1) / 2);
      glow.quad([x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0], [nx, 0, nz], c);
    }
  }
}

/** The device of a showcase: a screen, a silo (its glass is drawn with what it shows), a 3D printer, a holographic table. */
function showcaseBody(lit: Builder, glow: Builder, it: StudioItem, col: string): void {
  const x = it.x, z = it.y, w = it.w ?? 1;
  const dark = rgbOf('#10101a');
  const c = rgbOf(col);
  if (it.device === 'schermo') {
    lit.box(x + 0.1, 0, z + 0.35, x + w - 0.1, 2.3, z + 0.7, dark);
    glow.box(x + 0.1, 2.3, z + 0.35, x + w - 0.1, 2.36, z + 0.7, c);
    glow.box(x + 0.1, 0.2, z + 0.7, x + w - 0.1, 0.25, z + 0.72, c);
    return;
  }
  if (it.device === 'silos') {
    // T58b: cylindrical base and lid, circles of light around the glass at base and lid, no horizontal bars.
    const cx = x + w / 2, cz = z + 0.5;
    lit.cylinder(cx, 0, cz, 1.05, 0.3, dark, 28, true, false);
    lit.cylinder(cx, 2.56, cz, 1.05, 2.85, dark, 28, true, true);
    circleRim(glow, cx, cz, 0.95, 0.30, rgbOf(col, 0.8), 0.05, 0.03);
    circleRim(glow, cx, cz, 0.95, 2.56, rgbOf(col, 0.8), 0.05, -0.03);
    return;
  }
  if (it.device === 'plastico') {
    // The model of places (T26): a dark table over w × h cells, glowing edges, a projector plate under the place.
    const d = it.h ?? 1;
    lit.box(x + 0.05, 0, z + 0.05, x + w - 0.05, PLATE - 0.04, z + d - 0.05, dark);
    lit.box(x + 0.1, PLATE - 0.04, z + 0.1, x + w - 0.1, PLATE, z + d - 0.1, rgbOf('#0b1624'));
    glow.box(x + 0.05, PLATE - 0.04, z + 0.05, x + w - 0.05, PLATE - 0.01, z + 0.1, c);
    glow.box(x + 0.05, PLATE - 0.04, z + d - 0.1, x + w - 0.05, PLATE - 0.01, z + d - 0.05, c);
    glow.box(x + 0.05, PLATE - 0.04, z + 0.1, x + 0.1, PLATE - 0.01, z + d - 0.1, c);
    glow.box(x + w - 0.1, PLATE - 0.04, z + 0.1, x + w - 0.05, PLATE - 0.01, z + d - 0.1, c);
    glow.box(x + 0.3, 0.12, z + d - 0.06, x + w - 0.3, 0.16, z + d - 0.04, c);
    return;
  }
  // The printer (T24): w × h cells, four posts and a frame, a gantry with the head over the middle cell, a bed of
  // dark tiles, the middle one (where the thing is printed) outlined.
  const d = it.h ?? 1;
  const mx = x + Math.floor(w / 2), mz = z + Math.floor(d / 2);
  for (const px of [x + 0.05, x + w - 0.2]) for (const pz of [z + 0.05, z + d - 0.2]) lit.box(px, 0, pz, px + 0.15, 2.6, pz + 0.15, dark);
  lit.box(x + 0.05, 2.6, z + 0.05, x + w - 0.05, 2.72, z + 0.2, dark);
  lit.box(x + 0.05, 2.6, z + d - 0.2, x + w - 0.05, 2.72, z + d - 0.05, dark);
  lit.box(x + 0.05, 2.6, z + 0.2, x + 0.2, 2.72, z + d - 0.2, dark);
  lit.box(x + w - 0.2, 2.6, z + 0.2, x + w - 0.05, 2.72, z + d - 0.2, dark);
  lit.box(x + 0.2, 2.48, mz + 0.42, x + w - 0.2, 2.6, mz + 0.58, dark);
  glow.box(mx + 0.36, 2.2, mz + 0.36, mx + 0.64, 2.48, mz + 0.64, c);
  glow.box(mx + 0.47, 2.1, mz + 0.47, mx + 0.53, 2.2, mz + 0.53, rgbOf('#ffffff'));
  glow.box(x + 0.05, 2.72, z + d - 0.08, x + w - 0.05, 2.76, z + d - 0.05, c);
  lit.box(x + 0.1, 0, z + 0.1, x + w - 0.1, 0.28, z + d - 0.1, rgbOf('#1a1e2e'));
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) lit.box(x + i + 0.08, 0.28, z + j + 0.08, x + i + 0.92, 0.3, z + j + 0.92, rgbOf('#2a2e40'));
  // The middle cell: a glowing outline, so what stands on it is seen against the dark bed.
  glow.box(mx + 0.04, 0.3, mz + 0.04, mx + 0.96, 0.32, mz + 0.1, c);
  glow.box(mx + 0.04, 0.3, mz + 0.9, mx + 0.96, 0.32, mz + 0.96, c);
  glow.box(mx + 0.04, 0.3, mz + 0.1, mx + 0.1, 0.32, mz + 0.9, c);
  glow.box(mx + 0.9, 0.3, mz + 0.1, mx + 0.96, 0.32, mz + 0.9, c);
}

/** The bench's plinth and the height of its glass case (T27b): the scene stands on the plinth. */
export const BENCH_TOP = 0.55;
export const BENCH_GLASS = 1.0;

/** How wide an environment of the sample room is in miniature (T26d), on its plinth. */
const SAMPLE_SIDE = 0.72;

/** The height of the model of places' table, where the place in miniature stands. */
const PLATE = 0.7;

/** What a phase of the model of places adds (T26) glows in this green. */
const PHASE_LIT = '#39ff88';

/**
 * A planned place in miniature on the model of places (T26), `side` wide: each tile a column in its colour up to its
 * level (water a little lower, walls and rocks higher), the structures and things as their models made small, the runes
 * as glowing tiles. What is not ready yet (a model still running) is simply missing: the key changes when it is.
 * `phase` (of `PLACE_PHASES`): the place as it is then, what that phase adds glowing green on its columns; the
 * structures come in the fifth, things and runes in the sixth.
 */
function buildMiniature(k: Kernel, mini: PlaceMiniature, side: number, phase = PLACE_PHASES.length - 1): THREE.Group {
  const g = new THREE.Group();
  const S = mini.size, t = side / S;
  const lit = new Builder();
  const glow = new Builder();
  const now = mini.phases[phase] ?? { tiles: mini.tiles, levels: mini.levels, lit: [] };
  const top = (i: number) => (now.levels[i] ?? 0) * LEVEL * t;
  const lights = new Set(now.lit);
  for (let i = 0; i < S * S; i++) {
    const def = k.palette[now.tiles[i]];
    const c = i % S, r = (i - c) / S;
    const layer = def?.layer ?? 'ground';
    const h = Math.max(0.01, top(i) + (layer === 'liquid' ? -0.2 : layer === 'wall' || layer === 'rock' || def?.solid ? 0.8 : layer === 'vegetation' ? 0.15 : 0) * t + 0.03);
    lit.box(c * t, 0, r * t, (c + 1) * t, h, (r + 1) * t, rgbOf(def?.color ?? '#333'));
    // An outline, not a plate: under the bloom a plate would hide the tile's colour.
    if (lights.has(i)) {
      const e = 0.12 * t, x0 = c * t + e / 2, z0 = r * t + e / 2, x1 = (c + 1) * t - e / 2, z1 = (r + 1) * t - e / 2, on = rgbOf(PHASE_LIT, 0.55);
      glow.box(x0, h, z0, x1, h + 0.01, z0 + e, on);
      glow.box(x0, h, z1 - e, x1, h + 0.01, z1, on);
      glow.box(x0, h, z0 + e, x0 + e, h + 0.01, z1 - e, on);
      glow.box(x1 - e, h, z0 + e, x1, h + 0.01, z1 - e, on);
    }
  }
  // The rim of the projection.
  const rim = rgbOf('#05d9e8', 0.5);
  glow.box(-0.02, 0, -0.02, side + 0.02, 0.015, 0, rim);
  glow.box(-0.02, 0, side, side + 0.02, 0.015, side + 0.02, rim);
  glow.box(-0.02, 0, 0, 0, 0.015, side, rim);
  glow.box(side, 0, 0, side + 0.02, 0.015, side, rim);
  const finished = phase >= PLACE_PHASES.length - 1;
  for (const r of finished ? mini.runes : []) {
    const i = Math.floor(r.y) * S + Math.floor(r.x);
    glow.box((r.x - 0.4) * t, top(i) + 0.03, (r.y - 0.4) * t, (r.x + 0.4) * t, top(i) + 0.03 + 0.12 * t, (r.y + 0.4) * t, rgbOf(r.color ?? '#ffcf5c'));
  }
  g.add(new THREE.Mesh(lit.geometry(), MAT.corona), new THREE.Mesh(glow.geometry(), MAT.glow));
  const place = (o: { x: number; y: number; model: string; seed: number; yaw: number; tint?: string; done?: string[] }) => {
    const f = k.forms.ready(o.model, o.seed, o.tint);
    const m = f && modelObject(k, f, { model: o.model, seed: o.seed, yaw: o.yaw, tint: o.tint, done: o.done }, MAT.corona);
    if (!m) return;
    // Still: an animated model shows its body, not its frames (which hide it).
    for (const fr of m.frames) fr.visible = false;
    for (const c of m.body.children) c.visible = true;
    m.root.scale.setScalar(t);
    m.root.rotation.y = o.yaw;
    m.root.position.set(o.x * t, top(Math.floor(o.y) * S + Math.floor(o.x)) + 0.03, o.y * t);
    g.add(m.root);
  };
  if (phase >= 4) for (const s of mini.structures) place(s);
  if (finished) for (const th of mini.things) place(th);
  return g;
}

/** Text on a glowing plane (canvas), w wide in cells. */
function textPlane(lines: string[], color: string, w: number, h: number, big = false): THREE.Mesh {
  const W = 512, H = Math.round((512 * h) / w);
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = 'rgba(6,6,12,0.9)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#ffffff';
  lines.forEach((t, i) => {
    const size = big && i === 0 ? Math.min(H * 0.5, (W * 1.6) / Math.max(1, t.length)) : Math.min(H * (big ? 0.16 : 0.62), (W * 1.7) / Math.max(1, t.length));
    ctx.font = `bold ${Math.floor(size)}px system-ui, sans-serif`;
    ctx.fillText(t, W / 2, big && i === 0 ? H * 0.42 : H * (big ? 0.82 : 0.5) + (i - (big ? 1 : 0)) * size * 1.1);
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true }));
}

/** The screen of the Tower of Magic (T22): a rune or a combination, each rune glowing in its colour, its name under it. */
function runeScreen(runes: Array<{ glyph: string; color: string; name: string }>, w: number, h: number): THREE.Mesh {
  const W = 512, H = Math.round((512 * h) / w);
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = 'rgba(6,6,12,0.9)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cell = W / runes.length;
  const size = Math.min(H * 0.5, cell * 0.8);
  runes.forEach((r, i) => {
    const x = cell * (i + 0.5);
    ctx.shadowColor = r.color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = r.color;
    ctx.font = `bold ${Math.floor(size)}px system-ui, sans-serif`;
    ctx.fillText(r.glyph, x, H * 0.42);
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(Math.min(H * 0.12, (cell * 1.6) / Math.max(1, r.name.length)))}px system-ui, sans-serif`;
    ctx.fillText(r.name, x, H * 0.82);
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true }));
}

/** The sign of a pad on the floor («−» «+» of the model of places, T26), floating low above it. */
function padSign(x: number, z: number, text: string, color: string): THREE.Mesh {
  const m = textPlane([text], color, 0.4, 0.4, true);
  m.position.set(x + 0.5, 0.35, z + 0.5);
  return m;
}

/** The top of the situation table (T46a). */
export const SITUATION_TOP = 0.72;

/**
 * The operations on the situation table (T46a): the chunks of `s.bounds` fitted on its top, the regions as faint golden
 * plates with their outlines, a glowing mark for each operation (the wanderer a white pillar, the players connected violet ones (T42c), plots gold, quests green,
 * faults red, places cyan and flat, dim when only queued); the places being generated are in `pulse`, to pulse.
 */
export function buildSituation(it: StudioItem, s: Situation, color: string): { group: THREE.Group; pulse: THREE.Object3D[] } {
  const g = new THREE.Group();
  const w = it.w ?? 1, d = it.h ?? 1, m = 0.22;
  const { x0, y0, x1, y1 } = s.bounds;
  const cols = x1 - x0 + 1, rows = y1 - y0 + 1;
  const cell = Math.min((w - 2 * m) / cols, (d - 2 * m) / rows);
  const ox = it.x + (w - cols * cell) / 2, oz = it.y + (d - rows * cell) / 2;
  const X = (cx: number) => ox + (cx - x0) * cell, Z = (cy: number) => oz + (cy - y0) * cell;
  const top = SITUATION_TOP;
  const glow = new Builder();
  const gold = rgbOf(color, 0.18), rim = rgbOf(color, 0.6), t = Math.min(0.02, cell * 0.15);
  for (const r of s.regions) {
    const a = X(r.centro[0] - r.raggio), b = Z(r.centro[1] - r.raggio), e = X(r.centro[0] + r.raggio + 1), f = Z(r.centro[1] + r.raggio + 1);
    glow.box(a, top, b, e, top + 0.004, f, gold);
    glow.box(a, top, b, e, top + 0.012, b + t, rim);
    glow.box(a, top, f - t, e, top + 0.012, f, rim);
    glow.box(a, top, b, a + t, top + 0.012, f, rim);
    glow.box(e - t, top, b, e, top + 0.012, f, rim);
  }
  // How tall each mark is, and how much of its cell it covers.
  const look = { viandante: [0.32, 0.5], giocatore: [0.26, 0.42], trama: [0.16, 0.55], missione: [0.12, 0.55], guasto: [0.2, 0.6], luogo: [0.015, 0.9] } as const;
  const pulse: THREE.Object3D[] = [];
  // More operations on one chunk stand side by side.
  const seen = new Map<string, number>();
  for (const o of s.ops) {
    if (o.cx === undefined || o.cy === undefined) continue;
    const [h, size] = look[o.kind];
    const key = `${o.cx},${o.cy}`;
    const n = o.kind === 'luogo' ? 0 : (seen.get(key) ?? 0);
    if (o.kind !== 'luogo') seen.set(key, n + 1);
    const half = (cell * size) / 2 / (n ? 1.6 : 1);
    const cx = X(o.cx) + cell / 2 + (n ? Math.cos(n * 2.1) * cell * 0.28 : 0), cz = Z(o.cy) + cell / 2 + (n ? Math.sin(n * 2.1) * cell * 0.28 : 0);
    const rgb = rgbOf(OPERATION_COLOR[o.kind], o.kind === 'luogo' && !o.live ? 0.3 : 1);
    if (!o.live) {
      glow.box(cx - half, top, cz - half, cx + half, top + h, cz + half, rgb);
      continue;
    }
    // Pulsing: its own mesh, scaled from its base by the renderer.
    const b = new Builder();
    b.box(-half, 0, -half, half, 0.06, half, rgb);
    const mesh = new THREE.Mesh(b.geometry(), MAT.glow);
    mesh.position.set(cx, top, cz);
    pulse.push(mesh);
    g.add(mesh);
  }
  g.add(new THREE.Mesh(glow.geometry(), MAT.glow));
  const name = textPlane([it.label], color, w - 0.4, 0.22);
  // On the front of the pedestal, under the top.
  name.position.set(it.x + w / 2, 0.36, it.y + d - 0.345);
  g.add(name);
  return { group: g, pulse };
}

/** An arrow button's sign, floating above its pillar. */
export function arrowSign(x: number, z: number, text: string, color: string): THREE.Mesh {
  const m = textPlane([text], color, 0.5, 0.5, true);
  m.position.set(x + 0.5, 1.3, z + 0.72);
  return m;
}

/**
 * What a showcase shows now: the model, made to fit and turning (in the silo, floating in its liquid), or
 * the runes on the screen; its name under it and the arrows at its sides. `spin` is what turns, `bubbles`
 * rise in the silo's liquid (their place, speed and phase in `userData`). The model of places shows its place in `phase`.
 */
export function buildShowcase(k: Kernel, it: StudioItem, entry: ShowcaseEntry, color: string, phase?: number): { group: THREE.Group; spin?: THREE.Object3D; bubbles?: THREE.Object3D[] } {
  const g = new THREE.Group();
  const w = it.w ?? 1, d = it.h ?? 1;
  // The arrows are on the middle row; a deep printer shows its thing on the middle cell (T24).
  const row = it.y + Math.floor(d / 2);
  const cx = it.x + w / 2, cz = row + 0.5;
  g.add(arrowSign(it.x - 1, row, '<', color), arrowSign(it.x + w, row, '>', color));
  const printer = it.device === 'stampante';
  const table = it.device === 'plastico';
  const name = textPlane([entry.label], color, w - 0.2, printer || table ? 0.24 : 0.32);
  name.position.set(
    cx,
    it.device === 'schermo' ? 0.45 : table ? 0.38 : printer ? 0.14 : it.device === 'silos' ? 0.15 : 0.17,
    it.device === 'schermo' ? cz + 0.73 : table ? it.y + d - 0.04 : printer ? it.y + d - 0.09 : it.device === 'silos' ? cz + 1.07 : cz + 0.52,
  );
  g.add(name);
  if (entry.place) {
    // The model of places (T26): the place in miniature over the table, still; until it is read, the table is empty.
    const mini = k.miniature(entry.place.cx, entry.place.cy);
    if (mini) {
      const side = Math.min(w, d) - 0.3;
      const m = buildMiniature(k, mini, side, phase);
      m.position.set(it.x + (w - side) / 2, PLATE, it.y + (d - side) / 2);
      g.add(m);
    }
    // The phases: «−» «+» on their pads, the phase written under the name and six lamps along the front, the current one lit.
    const now = phase ?? PLACE_PHASES.length - 1;
    g.add(padSign(it.x, it.y + d, '−', color), padSign(it.x + w - 1, it.y + d, '+', color));
    const line = textPlane([`fase ${now + 1}/${PLACE_PHASES.length} · ${PLACE_PHASES[now].name}`], PHASE_LIT, w - 0.6, 0.14);
    line.position.set(cx, 0.15, it.y + d - 0.04);
    const lamps = new Builder();
    PLACE_PHASES.forEach((_, i) => {
      const lx = cx + (i - (PLACE_PHASES.length - 1) / 2) * 0.22;
      lamps.box(lx - 0.07, 0.56, it.y + d - 0.06, lx + 0.07, 0.62, it.y + d - 0.03, rgbOf(i === now ? PHASE_LIT : color, i === now ? 1 : 0.25));
    });
    g.add(line, new THREE.Mesh(lamps.geometry(), MAT.glow));
    return { group: g };
  }
  let bubbles: THREE.Object3D[] | undefined;
  if (it.device === 'silos') {
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 2.26, 28, 1, true), new THREE.MeshBasicMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    glass.position.set(cx, 0.3 + 1.13, cz);
    // T23: a viscous liquid in the building's colour fills it up to a glowing surface; slow bubbles rise in it.
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 2.0, 28), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).lerp(new THREE.Color('#04140f'), 0.7), transparent: true, opacity: 0.3, depthWrite: false, toneMapped: false }));
    liquid.position.set(cx, 0.3 + 1.0, cz);
    liquid.renderOrder = 1;
    // The surface: a glowing rim where it meets the glass, clear inside so what floats is seen from above.
    const surface = new THREE.Mesh(new THREE.RingGeometry(0.78, 0.92, 28), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false }));
    surface.rotation.x = -Math.PI / 2;
    surface.position.set(cx, 2.3, cz);
    surface.renderOrder = 2;
    const ball = new THREE.SphereGeometry(1, 8, 6);
    const foam = new THREE.MeshBasicMaterial({ color: '#e8fff8', transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false });
    bubbles = [];
    for (let i = 0; i < 16; i++) {
      const b = new THREE.Mesh(ball, foam);
      const a = (i * 2.399) % (Math.PI * 2), r = 0.25 + ((i * 0.37) % 0.6);
      b.scale.setScalar(0.025 + ((i * 7) % 5) * 0.008);
      b.renderOrder = 3;
      b.userData = { x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r, speed: 0.12 + ((i * 3) % 7) * 0.03, phase: (i * 0.61) % 1 };
      b.position.set(b.userData.x, 0.35, b.userData.z);
      bubbles.push(b);
    }
    g.add(glass, liquid, surface, ...bubbles);
  }
  if (entry.runes?.length) {
    const screen = runeScreen(entry.runes.map((t) => ({ glyph: k.content.runes[t]?.glyph ?? t, color: k.content.runes[t]?.color ?? color, name: k.content.runes[t]?.name ?? t })), w - 0.4, 1.6);
    screen.position.set(cx, 1.35, cz + 0.22);
    g.add(screen);
    return { group: g };
  }
  const f = entry.model ? k.forms.ready(entry.model, entry.seed ?? 1, entry.tint) : undefined;
  const geo = f && geoOf(f);
  if (!geo) return { group: g };
  geo.body.computeBoundingBox();
  const size = new THREE.Vector3();
  const box = geo.body.boundingBox!;
  box.getSize(size);
  // Things too big are brought down to the device: on the printer, to its middle cell (structures to one cell).
  const room = it.device === 'schermo' ? [w - 0.6, 1.6] : it.device === 'silos' ? [1.4, 1.8] : [0.9, 1.8];
  const s = Math.min(room[0] / Math.max(size.x, size.z, 0.01), room[1] / Math.max(size.y, 0.01), 1.5);
  const m = new THREE.Mesh(geo.body, MAT.corona);
  m.castShadow = true;
  m.scale.setScalar(s);
  const centre = box.getCenter(new THREE.Vector3());
  m.position.set(-centre.x * s, -box.min.y * s, -centre.z * s);
  const spin = new THREE.Group();
  spin.add(m);
  spin.position.set(cx, it.device === 'silos' ? 0.5 : printer ? 0.3 : 0.6, cz);
  g.add(spin);
  return { group: g, spin, bubbles };
}

interface AvatarEntry {
  group: THREE.Group;
  modelObj?: ModelObject;
  modelKey?: string;
  standIn?: THREE.Group;
}

/** The Council's people in the corona and in the studio: giant cuddly gerboas with distinctive hats (T50d). */
export class Avatars {
  private views = new Map<string, AvatarEntry>();
  constructor(private scene: THREE.Object3D) {}

  update(k: Kernel, t: number): void {
    const seen = new Set<string>();
    for (const [key, a] of k.archive.avatars) {
      seen.add(key);
      let v = this.views.get(key);
      if (!v) {
        const group = new THREE.Group();
        const standIn = new THREE.Group();
        const robe = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.0, 8), new THREE.MeshLambertMaterial({ color: a.color }));
        robe.position.y = 0.5;
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), new THREE.MeshLambertMaterial({ color: '#14100c' }));
        head.position.y = 1.08;
        robe.castShadow = head.castShadow = true;
        standIn.add(robe, head);
        group.add(standIn);
        this.scene.add(group);
        v = { group, standIn };
        this.views.set(key, v);
      }

      // Model for the agent: gerboa with role hat (T50d)
      const model = a.agent ? `corona-gerboa-${a.agent}` : 'corona-gerboa';
      const f = k.forms.ready(model, 1) ?? k.forms.ready('corona-gerboa', 1);
      if (!f) {
        k.forms.get(model, 1);
      } else if (v.modelKey !== f.key) {
        if (v.standIn) {
          v.group.remove(v.standIn);
          v.standIn = undefined;
        }
        if (v.modelObj) {
          v.group.remove(v.modelObj.root);
        }
        const mo = modelObject(k, f, { model: f.model, seed: 1, yaw: 0 }, MAT.corona);
        if (mo) {
          mo.root.scale.setScalar(0.65);
          v.group.add(mo.root);
          v.modelObj = mo;
          v.modelKey = f.key;
        }
      }

      const walking = Math.hypot(a.tx - a.x, a.ty - a.y) > 0.05;
      const bob = a.say
        ? Math.abs(Math.sin(t * 8)) * 0.12
        : walking
        ? Math.abs(Math.sin(t * 6 + a.x)) * 0.06
        : Math.sin(t * 2.5 + a.x * 2) * 0.02;

      v.group.position.set(a.x, bob, a.y);

      if (walking) {
        v.group.rotation.y = Math.atan2(a.tx - a.x, a.ty - a.y);
      } else if (a.building === 'concilio') {
        // Face the round table center in the Council's hall
        const room = k.corona.building('concilio')?.floors[0];
        const cx = (room?.ox ?? 0) + 12;
        const cy = (room?.oy ?? 0) + 8.5;
        v.group.rotation.y = Math.atan2(cx - a.x, cy - a.y);
      } else {
        v.group.rotation.y = 0;
      }

      if (a.say) {
        v.group.rotation.z = Math.sin(t * 10) * 0.04;
      } else {
        v.group.rotation.z = 0;
      }

      // Swing legs if walking
      if (v.modelObj) {
        const swing = walking ? Math.sin(t * 7) * 0.35 : 0;
        for (const l of v.modelObj.limbs) {
          if (l.part === 'gamba') l.pivot.rotation.x = l.phase ? swing : -swing;
        }
      }
    }
    for (const [key, v] of [...this.views]) if (!seen.has(key)) {
      this.scene.remove(v.group);
      this.views.delete(key);
    }
  }
}
