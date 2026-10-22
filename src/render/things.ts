// What moves and lies on the ground: people, animals, things, items to pick up, the wanderer, and the
// runes carved in the ground. Each entity has a view (an Object3D) kept in step with the ECS. Until a
// thing's model is ready (src/render/models.ts) its view is a stand-in by kind: a figure with legs and
// arms that swing, a block, a floating gem.

import * as THREE from 'three';
import type { Id } from '../kernel/ecs';
import type { Kernel } from '../kernel/kernel';
import { runeGlyph, type RuneComp } from '../kernel/runes';
import { hash32, hashStr } from '../kernel/rng';
import { Builder } from './terrain';
import { clipped, MAT, rgbOf, solid } from './materials';
import { modelObject, showFrame } from './models';
import type { FormComp } from '../kernel/forms';

export interface Limb {
  pivot: THREE.Object3D;
  part: 'gamba' | 'braccio' | 'testa' | 'coda';
  phase: number;
}

export interface ThingView {
  root: THREE.Group;
  body: THREE.Object3D;
  limbs: Limb[];
  /** Frames of its animation (fire, smoke), shown in turn. */
  frames: THREE.Mesh[];
  kind: 'figure' | 'item' | 'thing';
  /** A stand-in owns its geometry; a model shares it with the other instances. */
  owned: boolean;
  /** Where it was last frame (carpet space), to know where it goes and how fast. */
  last: { x: number; y: number };
  yaw: number;
  phase: number;
  /** What the view was built from: rebuilt when it changes. */
  sig: string;
}

const box = (w: number, h: number, d: number, color: number[], y0 = 0): THREE.BufferGeometry => {
  const b = new Builder();
  b.box(-w / 2, y0, -d / 2, w / 2, y0 + h, d / 2, color);
  return b.geometry();
};

/** A figure: legs and arms on pivots at the hips and shoulders, a body, a head. Front is +z. */
export function figureStandIn(color: string, scale = 1, skin = '#e8b88a', material: THREE.Material = MAT.world): { root: THREE.Group; body: THREE.Object3D; limbs: Limb[] } {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const c = rgbOf(color);
  const dark = c.map((v) => v * 0.6);
  const s = scale;
  const mesh = (g: THREE.BufferGeometry) => {
    const m = new THREE.Mesh(g, material);
    m.castShadow = true;
    return m;
  };
  body.add(mesh(box(0.42 * s, 0.5 * s, 0.26 * s, c, 0.48 * s)));
  const head = new THREE.Group();
  head.position.set(0, 0.98 * s, 0);
  head.add(mesh(box(0.34 * s, 0.32 * s, 0.32 * s, rgbOf(skin))));
  head.add(mesh(box(0.36 * s, 0.1 * s, 0.34 * s, dark, 0.28 * s)));
  body.add(head);
  const limbs: Limb[] = [{ pivot: head, part: 'testa', phase: 1 }];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.11 * s, 0.48 * s, 0);
    leg.add(mesh(box(0.14 * s, 0.48 * s, 0.16 * s, dark, -0.48 * s)));
    root.add(leg);
    limbs.push({ pivot: leg, part: 'gamba', phase: side });
    const arm = new THREE.Group();
    arm.position.set(side * 0.28 * s, 0.94 * s, 0);
    arm.add(mesh(box(0.12 * s, 0.42 * s, 0.12 * s, c.map((v) => v * 0.85), -0.42 * s)));
    root.add(arm);
    limbs.push({ pivot: arm, part: 'braccio', phase: -side });
  }
  return { root, body, limbs };
}

function thingStandIn(color: string, r: number): THREE.Mesh {
  const m = new THREE.Mesh(box(r * 1.8, Math.max(0.3, r * 2), r * 1.8, rgbOf(color)), MAT.world);
  m.castShadow = m.receiveShadow = true;
  return m;
}

function itemStandIn(color: string): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), solid(color, { emissive: 0.35 }));
  m.castShadow = true;
  return m;
}

/** Legs swing while it walks, arms against them, the head nods a little. */
export function animateLimbs(v: { limbs: Limb[]; body: THREE.Object3D; phase: number }, moving: boolean, dt: number, t: number): void {
  const k = moving ? 1 : 0;
  for (const l of v.limbs) {
    const swing = Math.sin(v.phase) * l.phase;
    if (l.part === 'gamba') l.pivot.rotation.x = THREE.MathUtils.lerp(l.pivot.rotation.x, swing * 0.6 * k, Math.min(1, dt * 12));
    else if (l.part === 'braccio') l.pivot.rotation.x = THREE.MathUtils.lerp(l.pivot.rotation.x, swing * 0.45 * k, Math.min(1, dt * 12));
    else if (l.part === 'coda') l.pivot.rotation.y = Math.sin(t * 5 + v.phase) * 0.35;
    else if (l.part === 'testa') l.pivot.rotation.x = Math.sin(t * 1.3 + l.pivot.id) * 0.05;
  }
  v.body.position.y = moving ? Math.abs(Math.sin(v.phase)) * 0.03 : 0;
}

/** Turns a view towards its heading, smoothly. */
export function turnTowards(v: { yaw: number; root: THREE.Object3D }, goal: number, dt: number): void {
  let d = goal - v.yaw;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  v.yaw += d * Math.min(1, dt * 10);
  v.root.rotation.y = v.yaw;
}

export class Things {
  readonly views = new Map<Id, ThingView>();
  constructor(
    private k: Kernel,
    private world: THREE.Group,
  ) {}

  /** Individuals differ a little: size, and (while they have no model) the colour of what they wear. */
  private variant(id: Id): { scale: number; color?: string } {
    const k = this.k;
    if (!k.ecs.has(id, 'mind') && !k.ecs.has(id, 'identity')) return { scale: 1 };
    const who: string = k.ecs.get(id, 'identity')?.name ?? k.ecs.get(id, 'origin')?.key ?? String(id);
    const h = hashStr(who);
    return { scale: 0.94 + (h % 11) / 100, color: `hsl(${h % 360}, 45%, 52%)` };
  }

  /** What a view is made of now: rebuilt when it changes (its model got ready, an action changed it). */
  private sigOf(id: Id): string {
    const k = this.k;
    const fc: FormComp | undefined = k.ecs.get(id, 'form');
    const f = fc && k.forms.ready(fc.model, fc.seed, fc.tint);
    return `${k.ecs.get(id, 'glyph')?.color}|${f?.result?.meshes ? f.key : 'stand-in'}|${fc?.done?.join(',') ?? ''}`;
  }

  private build(id: Id, sig: string): ThingView {
    const k = this.k;
    const gl = k.ecs.get(id, 'glyph') ?? { color: '#aaa' };
    const p = k.ecs.get(id, 'pos');
    const figure = k.ecs.has(id, 'mind') || k.ecs.has(id, 'wander') || k.ecs.has(id, 'identity');
    const item = k.ecs.has(id, 'pickup');
    const fc: FormComp | undefined = k.ecs.get(id, 'form');
    const f = fc && k.forms.ready(fc.model, fc.seed, fc.tint);
    const v = this.variant(id);
    const model = f && modelObject(k, f, fc);
    let root: THREE.Group, body: THREE.Object3D, limbs: Limb[] = [], frames: THREE.Mesh[] = [];
    if (model) {
      ({ root, body, limbs, frames } = model);
      if (figure) root.scale.setScalar(v.scale);
    } else if (figure) {
      const persona = k.ecs.has(id, 'mind') || k.ecs.has(id, 'identity');
      ({ root, body, limbs } = figureStandIn(v.color ?? gl.color, (persona ? 1.1 : 0.55) * v.scale));
    } else {
      root = new THREE.Group();
      body = item ? itemStandIn(gl.color) : thingStandIn(gl.color, k.ecs.get(id, 'body')?.r ?? 0.35);
      root.add(body);
    }
    root.traverse((o) => (o.userData.entity = id));
    this.world.add(root);
    const yaw = figure ? hash32(id) % 6 : (fc?.yaw ?? 0);
    root.rotation.y = yaw;
    return { root, body, limbs, frames, kind: figure ? 'figure' : item ? 'item' : 'thing', last: { x: p.x, y: p.y }, yaw, phase: 0, sig, owned: !model };
  }

  update(dt: number, t: number): void {
    const k = this.k;
    const seen = new Set<Id>();
    for (const id of k.ecs.query('glyph', 'pos')) {
      if (id === k.playerId) continue;
      seen.add(id);
      let v = this.views.get(id);
      const sig = this.sigOf(id);
      if (v && v.sig !== sig) {
        this.remove(id);
        v = undefined;
      }
      if (!v) this.views.set(id, (v = this.build(id, sig)));
      const p = k.ecs.get(id, 'pos');
      const dx = p.x - v.last.x, dy = p.y - v.last.y;
      const moved = Math.hypot(dx, dy);
      v.last = { x: p.x, y: p.y };
      showFrame(v.frames, t, id * 0.37);
      if (v.kind === 'item') {
        // Things to pick up hover a little and turn, so they are seen among the grass.
        v.root.position.set(p.x, v.owned ? 0.25 + Math.sin(t * 2.5 + id) * 0.05 : 0.04 + Math.abs(Math.sin(t * 2 + id)) * 0.04, p.y);
        v.root.rotation.y = t * 0.8 + id;
        continue;
      }
      v.root.position.set(p.x, 0, p.y);
      if (v.kind !== 'figure') continue;
      // What they are doing, seen: lying down to sleep.
      const att = k.ecs.get(id, 'attivita');
      v.root.rotation.z = att?.tipo === 'dorme' && att.ferma ? Math.PI / 2.2 : 0;
      if (moved > 0.0005 && moved < 2) {
        turnTowards(v, Math.atan2(dx, dy), dt);
        v.phase += moved * 7;
      }
      animateLimbs(v, moved > 0.0005 && moved < 2, dt, t);
    }
    for (const id of [...this.views.keys()]) if (!seen.has(id)) this.remove(id);
  }

  private remove(id: Id): void {
    const v = this.views.get(id);
    if (!v) return;
    this.world.remove(v.root);
    // Models share their geometry among instances (models.ts keeps it); stand-ins own theirs.
    if (v.owned)
      v.root.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
    this.views.delete(id);
  }

  clear(): void {
    for (const id of [...this.views.keys()]) this.remove(id);
  }
}

/** The wanderer, in real space, facing where it walks: its model, or a stand-in until the model is ready. */
export class Wanderer {
  view: { root: THREE.Group; body: THREE.Object3D; limbs: Limb[]; yaw: number; phase: number };
  private last = { x: 0, y: 0 };
  private sig = '';
  constructor(private scene: THREE.Object3D) {
    this.view = this.make();
  }

  private make(k?: Kernel): Wanderer['view'] {
    const fc: FormComp | undefined = k?.ecs.get(k.playerId, 'form');
    const f = k && fc && k.forms.ready(fc.model, fc.seed, fc.tint);
    // The wanderer is never clipped: beyond the circle is where it goes when it leaves the simulation.
    const m = (f && modelObject(k, f, fc, MAT.corona)) ?? figureStandIn('#4a6680', 1.15, '#e8c39a', MAT.corona);
    m.root.traverse((o) => (o.userData.player = true));
    this.scene.add(m.root);
    return { root: m.root, body: m.body, limbs: m.limbs, yaw: this.view?.yaw ?? 0, phase: 0 };
  }

  update(k: Kernel, dt: number, t: number): void {
    const fc: FormComp | undefined = k.ecs.get(k.playerId, 'form');
    const f = fc && k.forms.ready(fc.model, fc.seed, fc.tint);
    const sig = f?.result?.meshes ? f.key : 'stand-in';
    if (sig !== this.sig) {
      this.sig = sig;
      this.scene.remove(this.view.root);
      this.view = this.make(k);
    }
    const p = k.playerPos();
    const dx = p.x - this.last.x, dy = p.y - this.last.y;
    const moved = Math.hypot(dx, dy);
    this.last = { x: p.x, y: p.y };
    this.view.root.position.set(p.x, 0, p.y);
    const facing = k.playerComp()?.facing;
    const goal = facing === 'left' ? -Math.PI / 2 : facing === 'right' ? Math.PI / 2 : facing === 'up' ? Math.PI : 0;
    // The carpet pulls the wanderer back: what counts for the legs is the walking, not the real motion.
    const pc = k.playerCarpet();
    const walking = moved > 0.0005 || Math.hypot(pc.x - (this.view.root.userData.cx ?? pc.x), pc.y - (this.view.root.userData.cy ?? pc.y)) > 0.0005;
    this.view.root.userData.cx = pc.x;
    this.view.root.userData.cy = pc.y;
    turnTowards(this.view, goal, dt);
    if (walking) this.view.phase += Math.max(moved, 0.05) * 7;
    animateLimbs(this.view, walking, dt, t);
  }
}

// ------------------------------------------------------------------------------------- runes

const RUNE_STYLE = {
  gen: { bg: 'rgba(46, 35, 6, 0.92)', edge: '#ffcf5c', fg: '#ffe7a3' },
  player: { bg: 'rgba(6, 42, 51, 0.92)', edge: '#3fd6f0', fg: '#b8f6ff' },
  broken: { bg: 'rgba(61, 7, 13, 0.92)', edge: '#ff4d5e', fg: '#ff9aa4' },
};
const FONT = '"Cascadia Mono", "JetBrains Mono", Consolas, "DejaVu Sans Mono", monospace';

/** A carved stone slab, glowing, with the rune's glyph and (for words) its token: a texture per look. */
function runeTexture(glyph: string, label: string | undefined, style: { bg: string; edge: string; fg: string }, color?: string): THREE.CanvasTexture {
  const N = 128;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = style.bg;
  ctx.beginPath();
  ctx.roundRect(6, 6, N - 12, N - 12, 22);
  ctx.fill();
  ctx.shadowColor = color ?? style.edge;
  ctx.shadowBlur = 12;
  ctx.strokeStyle = color ?? style.edge;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = color ?? style.fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${glyph.length > 1 ? 52 : 70}px ${FONT}`;
  ctx.fillText(glyph, N / 2, label ? N * 0.43 : N * 0.53);
  if (label) {
    ctx.font = `${Math.max(14, Math.min(28, 200 / label.length))}px ${FONT}`;
    ctx.fillStyle = style.fg;
    ctx.fillText(label, N / 2, N * 0.8);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export class Runes {
  private textures = new Map<string, THREE.Material>();
  private slabs = new Map<Id, { mesh: THREE.Mesh; key: string }>();
  private geo = new THREE.PlaneGeometry(0.86, 0.86).rotateX(-Math.PI / 2);
  constructor(
    private k: Kernel,
    private world: THREE.Group,
  ) {}

  private material(key: string, make: () => THREE.CanvasTexture): THREE.Material {
    let m = this.textures.get(key);
    if (!m) this.textures.set(key, (m = clipped(new THREE.MeshBasicMaterial({ map: make(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), 'rune')));
    return m;
  }

  update(t: number): void {
    const k = this.k;
    const seen = new Set<Id>();
    const pulse = 0.78 + 0.22 * Math.sin(t * 3);
    for (const id of k.ecs.query('rune')) {
      seen.add(id);
      const r: RuneComp = k.ecs.get(id, 'rune');
      const line = k.lineOfRune(id);
      const magic = k.content.runes[r.token];
      const look = runeGlyph(r.token, magic);
      const styleKey = line?.error ? 'broken' : r.source;
      const key = `${r.token}|${styleKey}|${look.color ?? ''}`;
      let s = this.slabs.get(id);
      if (!s || s.key !== key) {
        if (s) this.world.remove(s.mesh);
        const mat = this.material(key, () => runeTexture(look.glyph, look.label, RUNE_STYLE[styleKey as 'gen'], line?.error ? undefined : look.color));
        const mesh = new THREE.Mesh(this.geo, mat);
        mesh.renderOrder = 2;
        mesh.userData.rune = id;
        this.world.add(mesh);
        this.slabs.set(id, (s = { mesh, key }));
      }
      const jitter = line?.error ? (Math.random() - 0.5) * 0.06 : 0;
      s.mesh.position.set(r.col + 0.5 + jitter, 0.03, r.row + 0.5);
      (s.mesh.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
    for (const [id, s] of [...this.slabs]) if (!seen.has(id)) {
      this.world.remove(s.mesh);
      this.slabs.delete(id);
    }
  }
}

/** Lamps, fires and spells light the night: the nearest few `luce` become point lights. */
export class Lights {
  private pool: THREE.PointLight[] = [];
  constructor(scene: THREE.Object3D, n = 8) {
    for (let i = 0; i < n; i++) {
      const l = new THREE.PointLight(0xffb060, 0, 6, 1.6);
      scene.add(l);
      this.pool.push(l);
    }
  }

  update(k: Kernel, night: number, offset: { ox: number; oy: number }, t: number): void {
    const p = k.playerPos();
    const found: Array<{ x: number; z: number; r: number; color: string; d: number; id: number }> = [];
    for (const id of k.ecs.query('luce')) {
      const l = k.ecs.get(id, 'luce');
      if (!l?.accesa) continue;
      const pos = id === k.playerId ? { x: p.x + offset.ox, y: p.y + offset.oy } : k.ecs.get(id, 'pos');
      if (!pos) continue;
      const x = pos.x - offset.ox, z = pos.y - offset.oy;
      found.push({ x, z, r: Number(l.raggio) || 4, color: l.colore ?? '#ffb060', d: Math.hypot(x - p.x, z - p.y), id });
    }
    found.sort((a, b) => a.d - b.d);
    this.pool.forEach((light, i) => {
      const f = found[i];
      if (!f) return void (light.intensity = 0);
      light.position.set(f.x, 0.9, f.z);
      light.distance = f.r * 1.6;
      light.color.set(f.color.startsWith('#') ? f.color : '#ffb060');
      light.intensity = (0.6 + 3 * night) * (0.92 + 0.08 * Math.sin(t * 9 + f.id));
    });
  }
}
