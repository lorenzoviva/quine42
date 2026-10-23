// The corona in 3D: the studio's campus on the ring beyond the circle (a dark avenue with a glowing
// line, alleys between the sectors, lawns, one block per folder with neon edges in its colour, a door
// under a neon sign with the building's name, a glowing edge), and inside each tower its rooms
// (24 × 15 cells, several floors): neon grid on the floor, walls with a strip of light, racks of files,
// the gallery's models on show, screens, teleports, stairs, the Council's round table with the universe
// turning above it. Built from the kernel's cells (src/kernel/corona.ts): logic stays in the kernel.

import * as THREE from 'three';
import type { Kernel } from '../kernel/kernel';
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
      if (cell.kind === 'floor') {
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
  for (const b of c.buildings) g.add(neonSign(b, R));
  return g;
}

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
    case 'table': {
      // The round table: an ellipse of boxes.
      const cx = x, cz = z + 0.5;
      for (let a = 0; a < 24; a++) {
        const t = (a / 24) * Math.PI * 2;
        const px = cx + Math.cos(t) * 3.1, pz = cz + Math.sin(t) * 2.1;
        lit.box(px - 0.3, 0, pz - 0.3, px + 0.3, 0.6, pz + 0.3, rgbOf('#1c1c2a'));
        glow.box(px - 0.3, 0.6, pz - 0.3, px + 0.3, 0.62, pz + 0.3, rgbOf(col, 0.6));
      }
      break;
    }
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
