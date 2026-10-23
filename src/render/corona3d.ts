// The corona in 3D: the studio's campus on the ring beyond the circle (a dark avenue with a glowing
// line, alleys between the sectors, lawns, one block per folder with neon edges in its colour, a door
// under a neon sign with the building's name, a glowing edge), and inside each tower its rooms
// (24 × 15 cells, several floors): neon grid on the floor, walls with a strip of light, racks of files,
// the gallery's models on show, screens, teleports, stairs, the Council's round table with the universe
// turning above it, the showcases with their arrows (T21). Built from the kernel's cells
// (src/kernel/corona.ts): logic stays in the kernel.

import * as THREE from 'three';
import type { Kernel, ShowcaseEntry } from '../kernel/kernel';
import { CAMPUS, ROOM_H, ROOM_W, type Building, type Floor, type StudioItem } from '../kernel/corona';
import { Builder } from './terrain';
import { MAT, rgbOf } from './materials';
import { geoOf } from './models';

const TOWER_H = 4.5;
const GROUND: Record<string, [string, string]> = { viale: ['#161824', '#12131d'], vicolo: ['#14141c', '#111119'], prato: ['#0b0f15', '#0b0f15'], bordo: ['#0d0d16', '#0d0d16'] };
const LOOK_COLOR: Record<string, string> = { libro: '#a0683a', cristallo: '#5fe0ff', pergamena: '#e8dcb0', tavoletta: '#9aa3ad' };

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
  for (const b of c.buildings) {
    const s = b.structure;
    // A model has its own sign (the letter named `insegna`); a plain block gets one in neon over its door.
    const geo = s && geoOf(s.form);
    if (!s || !geo) {
      g.add(neonSign(b, R));
      continue;
    }
    const mesh = new THREE.Mesh(geo.body, MAT.corona);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.position.set(s.x, 0, s.y);
    mesh.rotation.y = s.yaw;
    g.add(mesh);
  }
  return g;
}

/** What the campus wears (T20): the ring is built again when a building becomes its model. */
export const campusKey = (k: Kernel) => k.corona.buildings.map((b) => (b.structure && geoOf(b.structure.form) ? b.structure.form.key : '')).join('|');

/** The building's name in neon above its door, facing the avenue (and, on its back, the lawns). */
function neonSign(b: Building, R: number): THREE.Group {
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
  // Floor and its neon grid.
  lit.quad([X, 0, Z], [X, 0, Z + ROOM_H], [X + ROOM_W, 0, Z + ROOM_H], [X + ROOM_W, 0, Z], [0, 1, 0], rgbOf('#08080f'));
  const grid = rgbOf(col, 0.25);
  for (let x = 1; x < ROOM_W; x++) glow.box(X + x - 0.01, 0.003, Z + 1, X + x + 0.01, 0.006, Z + ROOM_H - 1, grid);
  for (let y = 1; y < ROOM_H; y++) glow.box(X + 1, 0.003, Z + y - 0.01, X + ROOM_W - 1, 0.006, Z + y + 0.01, grid);
  // Walls: dark metal with a strip of light.
  const wall = rgbOf('#13131d');
  const H = 1.4;
  lit.box(X, 0, Z, X + ROOM_W, H, Z + 1, wall);
  lit.box(X, 0, Z + ROOM_H - 1, X + ROOM_W, H * 0.35, Z + ROOM_H, wall);
  lit.box(X, 0, Z, X + 1, H, Z + ROOM_H, wall);
  lit.box(X + ROOM_W - 1, 0, Z, X + ROOM_W, H, Z + ROOM_H, wall);
  glow.box(X + 1, H * 0.7, Z + 0.98, X + ROOM_W - 1, H * 0.75, Z + 1.02, rgbOf(col));
  glow.box(X + 0.98, H * 0.7, Z + 1, X + 1.02, H * 0.75, Z + ROOM_H - 1, rgbOf(col));
  glow.box(X + ROOM_W - 1.02, H * 0.7, Z + 1, X + ROOM_W - 0.98, H * 0.75, Z + ROOM_H - 1, rgbOf(col));
  // Racks under the rows of files and exhibits.
  const shelf = floor.items.filter((i) => i.kind === 'file' || i.kind === 'sprite' || i.kind === 'tile');
  for (const y of new Set(shelf.map((i) => i.y))) {
    const xs = shelf.filter((i) => i.y === y).map((i) => i.x);
    const a0 = Math.min(...xs), a1 = Math.max(...xs) + 1;
    lit.box(a0 - 0.05, 0, y + 0.3, a1 + 0.05, 0.35, y + 0.75, rgbOf('#1a1e2e'));
    glow.box(a0 - 0.05, 0.35, y + 0.73, a1 + 0.05, 0.38, y + 0.77, rgbOf(col));
  }
  let globe: THREE.Object3D | undefined;
  for (const it of floor.items) itemMesh(lit, glow, it, col, k);
  const group = new THREE.Group();
  const m = new THREE.Mesh(lit.geometry(), MAT.corona);
  m.receiveShadow = m.castShadow = true;
  group.add(m, new THREE.Mesh(glow.geometry(), MAT.glow));
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
  // The universe turning above the Council's table.
  const table = floor.items.find((i) => i.kind === 'table');
  if (table) {
    globe = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 1), new THREE.MeshBasicMaterial({ color: '#05d9e8', wireframe: true }));
    globe.position.set(X + 12, 1.6, Z + 8.5);
    group.add(globe);
  }
  return { group, globe };
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
    case 'screen': {
      const w = it.w ?? 1;
      lit.box(x, 0, z + 0.4, x + w, 1.25, z + 0.6, rgbOf('#0c0c16'));
      glow.box(x + 0.05, 0.2, z + 0.38, x + w - 0.05, 1.15, z + 0.4, rgbOf(col, 0.45));
      break;
    }
    case 'atlas':
      lit.box(x, 0, z + 0.1, x + (it.w ?? 1), 0.7, z + 0.9, rgbOf('#1a2a33'));
      glow.box(x + 0.1, 0.7, z + 0.2, x + (it.w ?? 1) - 0.1, 0.72, z + 0.8, rgbOf('#7dd87d', 0.6));
      break;
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

/** The device of a showcase: a screen, a silo (its glass is drawn with what it shows), a 3D printer. */
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
    const cx = x + w / 2, cz = z + 0.5;
    lit.box(cx - 1.1, 0, cz - 0.5, cx + 1.1, 0.3, cz + 0.5, dark);
    lit.box(cx - 1.1, 2.6, cz - 0.5, cx + 1.1, 2.85, cz + 0.5, dark);
    glow.box(cx - 1.1, 0.3, cz + 0.45, cx + 1.1, 0.34, cz + 0.5, c);
    glow.box(cx - 1.1, 2.56, cz + 0.45, cx + 1.1, 2.6, cz + 0.5, c);
    return;
  }
  // The printer: four posts, a beam with the head, a glowing bed.
  for (const px of [x + 0.05, x + w - 0.2]) for (const pz of [z + 0.05, z + 0.8]) lit.box(px, 0, pz, px + 0.15, 2.2, pz + 0.15, dark);
  lit.box(x + 0.05, 2.2, z + 0.05, x + w - 0.05, 2.35, z + 0.95, dark);
  glow.box(x + w / 2 - 0.12, 1.95, z + 0.38, x + w / 2 + 0.12, 2.2, z + 0.62, c);
  lit.box(x + 0.2, 0, z + 0.15, x + w - 0.2, 0.2, z + 0.85, rgbOf('#1a1e2e'));
  glow.box(x + 0.25, 0.2, z + 0.2, x + w - 0.25, 0.22, z + 0.8, rgbOf(col, 0.35));
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

/** An arrow button's sign, floating above its pillar. */
function arrowSign(x: number, z: number, text: string, color: string): THREE.Mesh {
  const m = textPlane([text], color, 0.5, 0.5, true);
  m.position.set(x + 0.5, 1.3, z + 0.72);
  return m;
}

/**
 * What a showcase shows now: the model, made to fit and turning (in the silo, floating in its liquid), or
 * the runes on the screen; its name under it and the arrows at its sides. `spin` is what turns, `bubbles`
 * rise in the silo's liquid (their place, speed and phase in `userData`).
 */
export function buildShowcase(k: Kernel, it: StudioItem, entry: ShowcaseEntry, color: string): { group: THREE.Group; spin?: THREE.Object3D; bubbles?: THREE.Object3D[] } {
  const g = new THREE.Group();
  const w = it.w ?? 1;
  const cx = it.x + w / 2, cz = it.y + 0.5;
  g.add(arrowSign(it.x - 1, it.y, '<', color), arrowSign(it.x + w, it.y, '>', color));
  const name = textPlane([entry.label], color, w - 0.2, 0.32);
  name.position.set(cx, it.device === 'schermo' ? 0.45 : 0.17, cz + (it.device === 'schermo' ? 0.73 : 0.52));
  g.add(name);
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
  // Things too big (structures) are brought down to the device: at most its width and 1.8 high.
  const room = it.device === 'schermo' ? [w - 0.6, 1.6] : it.device === 'silos' ? [1.4, 1.8] : [w - 0.7, 1.6];
  const s = Math.min(room[0] / Math.max(size.x, size.z, 0.01), room[1] / Math.max(size.y, 0.01), 1.5);
  const m = new THREE.Mesh(geo.body, MAT.corona);
  m.castShadow = true;
  m.scale.setScalar(s);
  const centre = box.getCenter(new THREE.Vector3());
  m.position.set(-centre.x * s, -box.min.y * s, -centre.z * s);
  const spin = new THREE.Group();
  spin.add(m);
  spin.position.set(cx, it.device === 'silos' ? 0.5 : it.device === 'stampante' ? 0.22 : 0.6, cz);
  g.add(spin);
  return { group: g, spin, bubbles };
}

/** The Council's people in the corona and in the studio: robed figures in their colour. */
export class Avatars {
  private views = new Map<string, THREE.Group>();
  constructor(private scene: THREE.Object3D) {}

  update(k: Kernel, t: number): void {
    const seen = new Set<string>();
    for (const [key, a] of k.archive.avatars) {
      seen.add(key);
      let v = this.views.get(key);
      if (!v) {
        v = new THREE.Group();
        const robe = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.0, 8), new THREE.MeshLambertMaterial({ color: a.color }));
        robe.position.y = 0.5;
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), new THREE.MeshLambertMaterial({ color: '#14100c' }));
        head.position.y = 1.08;
        robe.castShadow = head.castShadow = true;
        v.add(robe, head);
        this.scene.add(v);
        this.views.set(key, v);
      }
      v.position.set(a.x, Math.abs(Math.sin(t * 4 + a.x)) * 0.03, a.y);
    }
    for (const [key, v] of [...this.views]) if (!seen.has(key)) {
      this.scene.remove(v);
      this.views.delete(key);
    }
  }
}
