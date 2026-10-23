// The 3D renderer (step 9, ADR-0040): three.js, a camera in 3/4 from the south that turns by quarter turns
// (ADR-0047: the input turns the keys with it), HUD and panels above it in the DOM, text on a 2D overlay.
//
// Spaces (ADR-0004): the simulation — chunks, things, runes — lives in carpet coordinates and is drawn
// shifted by the carpet's offset; the wanderer, the corona and the studio are in real space. Kernel
// (x, y) is three.js (x, z), one tile is one unit, y is up. Once the corona shows, nothing of the
// simulation is drawn beyond the circle.

import * as THREE from 'three';
import type { Kernel } from '../kernel/kernel';
import { Bloom } from './bloom';
import { cellNear } from '../kernel/corona';
import { animateRing, Avatars, buildCoronaRing, buildRoom, buildShowcase, campusKey } from './corona3d';
import { CUT, U } from './materials';
import { Overlay } from './overlay';
import { buildChunk, chunkSig, disposeChunk, tileForms, type ChunkView } from './terrain';
import { Lights, Runes, Things, Wanderer } from './things';

const SKY = { day: new THREE.Color('#9cc8e8'), dusk: new THREE.Color('#e8a070'), night: new THREE.Color('#0e1424'), studio: new THREE.Color('#07070f'), corona: new THREE.Color('#05060a') };
const PITCH = 0.95;

export class Renderer {
  showWalk = false;
  mouse: { x: number; y: number } | null = null;
  /** Distance of the camera from the wanderer, in tiles. */
  distance = 15;
  /** The camera's angle around the wanderer (0 = from the south; it follows `input.turn`). */
  yaw = 0;
  /** While the middle button drags: the angle under the mouse. */
  private drag?: { x: number; yaw: number };

  private gl: THREE.WebGLRenderer;
  private bloom: Bloom;
  private scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
  private hemi = new THREE.HemisphereLight(0xdcecff, 0x5a4a3a, 1.1);
  private sun = new THREE.DirectionalLight(0xfff0d8, 2.2);
  /** The simulation, in carpet coordinates. */
  private world = new THREE.Group();
  private chunks = new Map<string, ChunkView>();
  private things: Things;
  private runes: Runes;
  private wanderer: Wanderer;
  private lights: Lights;
  private avatars: Avatars;
  private ring?: THREE.Group;
  /** What the campus wore when the ring was built (its buildings' models). */
  private ringKey = '';
  private rooms = new Map<string, { group: THREE.Group; globe?: THREE.Object3D; version: number }>();
  /** What the showcases of the studio show (T21), by building: rebuilt when the choice or the models change. */
  private shows = new Map<string, { key: string; group: THREE.Group; spin?: THREE.Object3D; bubbles?: THREE.Object3D[]; silo: boolean }>();
  private overlay: Overlay;
  private flash = new THREE.PointLight(0xfff2c0, 0, 8, 1.4);
  private flashUntil = 0;
  private target = new THREE.Vector3();
  private ray = new THREE.Raycaster();
  private ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private t = 0;
  private glitchLevel = 0;
  private crack = 0;
  private w = 0;
  private h = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    overlay: HTMLCanvasElement,
    private kernel: Kernel,
  ) {
    this.gl = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.gl.shadowMap.enabled = true;
    this.gl.localClippingEnabled = true;
    this.gl.shadowMap.type = THREE.PCFSoftShadowMap;
    this.bloom = new Bloom(this.gl, this.scene, this.camera);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 90 });
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.02;
    this.scene.add(this.hemi, this.sun, this.sun.target, this.world, this.flash);
    this.things = new Things(kernel, this.world);
    this.runes = new Runes(kernel, this.world);
    this.wanderer = new Wanderer(this.scene);
    this.lights = new Lights(this.scene);
    this.avatars = new Avatars(this.scene);
    this.overlay = new Overlay(overlay, this.camera);
    this.resize();
    window.addEventListener('resize', () => this.resize());
    kernel.bus.on('universe:reloaded', () => this.reset());
    kernel.bus.on('spell:cast', ({ at }: { at: { x: number; y: number } }) => {
      const { ox, oy } = kernel.offset();
      this.flash.position.set(at.x - ox, kernel.groundAt(at.x, at.y) + 1, at.y - oy);
      this.flashUntil = this.t + 0.6;
    });
    canvas.addEventListener('mousemove', (e) => (this.mouse = { x: e.offsetX, y: e.offsetY }));
    canvas.addEventListener('mouseleave', () => (this.mouse = null));
  }

  /** Everything built from the universe's files is built again (terrain colours, the corona's rooms). */
  private reset(): void {
    for (const v of this.chunks.values()) {
      this.world.remove(v.group);
      disposeChunk(v);
    }
    this.chunks.clear();
    if (this.ring) this.scene.remove(this.ring);
    this.ring = undefined;
    for (const r of this.rooms.values()) this.scene.remove(r.group);
    this.rooms.clear();
    for (const v of this.shows.values()) this.scene.remove(v.group);
    this.shows.clear();
    this.things.clear();
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = this.canvas.clientWidth || window.innerWidth;
    this.h = this.canvas.clientHeight || window.innerHeight;
    this.gl.setPixelRatio(dpr);
    this.gl.setSize(this.w, this.h, false);
    this.bloom.setSize(this.w, this.h, dpr);
    this.camera.aspect = this.w / this.h;
    this.camera.updateProjectionMatrix();
    this.overlay.resize(this.w, this.h, dpr);
    this.fitView();
  }

  /** What the kernel loads around the wanderer: what the camera sees, with the far side of the 3/4 view; turned with the camera. */
  fitView(): void {
    const across = Math.ceil(this.distance * 2.4 * Math.max(1, this.camera.aspect));
    const deep = Math.ceil(this.distance * 2.2);
    const side = this.kernel.input.turn % 2 === 1;
    this.kernel.view = { w: side ? deep : across, h: side ? across : deep };
  }

  /** Middle-button drag: the camera follows the mouse, the keys follow the nearest quarter turn, and on release it settles there. */
  dragStart(x: number): void {
    this.drag = { x, yaw: this.yaw };
  }

  dragMove(x: number): void {
    if (!this.drag) return;
    this.yaw = this.drag.yaw - ((x - this.drag.x) / Math.max(1, this.w)) * Math.PI * 1.5;
    this.kernel.input.setTurn(Math.round(this.yaw / (Math.PI / 2)));
  }

  dragEnd(): void {
    this.drag = undefined;
  }

  /** The height of the ground at a real-space point: the relief in the simulation, flat in the corona. */
  groundReal(x: number, y: number): number {
    const k = this.kernel;
    if (k.corona.isInterior(x) || (k.coronaRevealed() && Math.hypot(x, y) >= k.config.circleRadius)) return 0;
    const { ox, oy } = k.offset();
    return k.groundAt(x + ox, y + oy);
  }

  /** Screen → real-space point on the ground: the ray meets the plane of the ground where it lands, a few times over (the relief). */
  toReal(sx: number, sy: number): { x: number; y: number } {
    this.ray.setFromCamera(new THREE.Vector2((sx / this.w) * 2 - 1, -(sy / this.h) * 2 + 1), this.camera);
    const hit = new THREE.Vector3();
    const p = this.kernel.playerPos();
    this.ground.constant = -this.groundReal(p.x, p.y);
    for (let i = 0; i < 4; i++) {
      if (!this.ray.ray.intersectPlane(this.ground, hit)) return { ...p };
      const h = this.groundReal(hit.x, hit.z);
      if (Math.abs(h + this.ground.constant) < 1e-6) break;
      this.ground.constant = -h;
    }
    return { x: hit.x, y: hit.z };
  }

  render(dt: number): void {
    const k = this.kernel;
    this.t += dt;
    U.time.value = this.t;
    const p = k.playerPos();
    const studio = k.zone === 'studio' ? k.corona.roomAt(p.x, p.y) : undefined;
    const interior = k.corona.isInterior(p.x);
    const revealed = k.coronaRevealed();
    const { ox, oy } = k.offset();

    // The broken universe trembles; a faint crack right at the edge of the world, sometimes.
    const broken = k.brokenness();
    this.glitchLevel += (broken - this.glitchLevel) * Math.min(1, dt * 4);
    const edge = k.config.circleRadius - Math.hypot(p.x, p.y);
    if (broken === 0 && edge < 3 && edge > 0 && Math.random() < dt / 8) this.crack = 0.08;
    this.crack = Math.max(0, this.crack - dt);
    const g = Math.max(this.glitchLevel, this.crack > 0 ? 0.22 : 0);

    // The simulation.
    this.world.visible = !interior;
    this.world.position.set(-ox, 0, -oy);
    U.clipR.value = revealed ? k.config.circleRadius : 1e9;
    if (!interior) {
      this.syncChunks();
      // Inside a structure its upper part is cut away, so the wanderer is seen.
      const pc = k.playerCarpet();
      const inside = k.structureAt(pc.x, pc.y);
      CUT.constant = inside !== undefined ? 1.15 + k.floorAt(pc.x, pc.y) : 1e9;
      this.things.update(dt, this.t, inside);
      this.runes.update(this.t);
    }
    this.wanderer.update(k, dt, this.t);

    // The corona and the studio.
    const campus = revealed ? campusKey(k) : this.ringKey;
    if (this.ring && campus !== this.ringKey) {
      this.scene.remove(this.ring);
      this.ring = undefined;
    }
    if (revealed && !this.ring) {
      this.scene.add((this.ring = buildCoronaRing(k)));
      this.ringKey = campus;
    }
    if (this.ring) {
      this.ring.visible = revealed && !interior;
      if (this.ring.visible) animateRing(this.ring, this.t);
    }
    for (const [key, r] of this.rooms) r.group.visible = !!studio && key === `${studio.building.id}#${studio.floor.index}`;
    if (studio) {
      const key = `${studio.building.id}#${studio.floor.index}`;
      let r = this.rooms.get(key);
      // A room with things on show is built again when their models are ready.
      if (r && r.version !== k.forms.version && studio.floor.items.some((i) => i.kind === 'sprite')) {
        this.scene.remove(r.group);
        r = undefined;
      }
      if (!r) {
        this.rooms.set(key, (r = { ...buildRoom(k, studio.building, studio.floor), version: k.forms.version }));
        this.scene.add(r.group);
      }
      r.group.visible = true;
      if (r.globe) r.globe.rotation.y = this.t * 0.4;
    }
    for (const [id, v] of this.shows) v.group.visible = studio?.building.id === id && studio.floor.index === 0;
    const show = studio?.floor.items.find((i) => i.kind === 'showcase');
    if (studio && show) {
      const now = k.showcaseOf(studio.building.id);
      // A place in miniature (T26) read from its saved plan arrives later.
      const key = now ? `${now.entry.id}|${k.forms.version}|${now.entry.place ? k.miniatureVersion : 0}` : '';
      let v = this.shows.get(studio.building.id);
      if (v?.key !== key) {
        if (v) this.scene.remove(v.group);
        v = undefined;
        if (now) {
          v = { key, ...buildShowcase(k, show, now.entry, studio.building.color), silo: show.device === 'silos' };
          this.shows.set(studio.building.id, v);
          this.scene.add(v.group);
        } else this.shows.delete(studio.building.id);
      }
      if (v?.spin) {
        // In the silo's thick liquid (T23) it turns and floats slowly, swaying a little.
        v.spin.rotation.y = this.t * (v.silo ? 0.25 : 0.6);
        if (v.silo) {
          v.spin.position.y = 0.55 + Math.sin(this.t * 0.7) * 0.12;
          v.spin.rotation.z = Math.sin(this.t * 0.45) * 0.05;
        }
      }
      for (const b of v?.bubbles ?? []) {
        const { x, z, speed, phase } = b.userData as { x: number; z: number; speed: number; phase: number };
        b.position.set(x + Math.sin(this.t * 0.8 + phase * 9) * 0.05, 0.35 + ((phase + this.t * speed * 0.5) % 1) * 1.9, z);
      }
    }
    this.avatars.update(k, this.t);

    // Light: the day outside, a dim neon light in the studio.
    const day = k.daylight();
    const night = 1 - day;
    if (studio || k.zone === 'corona') {
      // The studio and its campus have their own light, day and night: neon and screens.
      this.sun.intensity = studio ? 0 : 0.8;
      this.hemi.intensity = studio ? 0.9 : 1.0;
      this.scene.background = studio ? SKY.studio : SKY.corona;
      this.scene.fog = null;
    } else {
      this.sun.intensity = 2.3 * Math.min(1, day * 1.4);
      this.sun.color.setHSL(0.09, 0.6, 0.6 + 0.3 * day);
      this.hemi.intensity = 0.22 + 0.9 * Math.min(1, day * 1.3);
      const bg = revealed && edge < 6 ? SKY.corona.clone() : day > 0.6 ? SKY.day.clone() : day > 0.3 ? SKY.dusk.clone().lerp(SKY.day, (day - 0.3) / 0.3) : SKY.night.clone().lerp(SKY.dusk, day / 0.3);
      this.scene.background = bg;
      this.scene.fog = new THREE.Fog(bg, this.distance * 2.2, this.distance * 4.5);
    }
    this.lights.update(k, studio ? 0 : night, { ox, oy }, this.t);
    this.flash.intensity = this.flashUntil > this.t ? 6 * ((this.flashUntil - this.t) / 0.6) : 0;

    // The camera follows the wanderer, from above, turned by the quarter turns of the input (the shortest way round).
    // It looks at the wanderer's middle, up and down the hills with it.
    const aim = new THREE.Vector3(p.x, this.wanderer.view.root.position.y + 0.6, p.y);
    this.target.lerp(aim, Math.min(1, dt * 8));
    if (this.target.distanceTo(aim) > 30) this.target.copy(aim);
    if (!this.drag) {
      const goal = (k.input.turn * Math.PI) / 2;
      const off = Math.atan2(Math.sin(goal - this.yaw), Math.cos(goal - this.yaw));
      this.yaw = Math.abs(off) < 0.001 ? goal : this.yaw + off * Math.min(1, dt * 9);
    }
    const flat = Math.cos(PITCH) * this.distance;
    this.camera.position.set(this.target.x + Math.sin(this.yaw) * flat, this.target.y + Math.sin(PITCH) * this.distance, this.target.z + Math.cos(this.yaw) * flat);
    if (g > 0.2) this.camera.position.x += (Math.random() - 0.5) * 0.15 * g;
    this.camera.lookAt(this.target);
    this.sun.position.copy(this.target).add(new THREE.Vector3(-14, 24, 10));
    this.sun.target.position.copy(this.target);
    this.bloom.render(dt);
    this.drawOverlay(studio, revealed, interior, g);
  }

  /** Builds the chunks that are new or changed (a few per frame), drops the unloaded ones. */
  private syncChunks(): void {
    const k = this.kernel;
    let budget = 3;
    // Which terrains' models are ready: chunks are built again when theirs arrive.
    const models = Object.entries(k.palette).filter(([, t]) => t.model).map(([code]) => `${code}${tileForms(k, code) ? 1 : 0}`).join('');
    for (const ch of k.chunks.values()) {
      const v = this.chunks.get(ch.key);
      if (v && v.sig === chunkSig(k, ch, models)) continue;
      if (budget-- <= 0) continue;
      if (v) {
        this.world.remove(v.group);
        disposeChunk(v);
      }
      const nv = buildChunk(k, ch, models);
      this.world.add(nv.group);
      this.chunks.set(ch.key, nv);
    }
    for (const [key, v] of [...this.chunks]) if (!k.chunks.has(key)) {
      this.world.remove(v.group);
      disposeChunk(v);
      this.chunks.delete(key);
    }
  }

  private drawOverlay(studio: ReturnType<Kernel['corona']['roomAt']>, revealed: boolean, interior: boolean, g: number): void {
    const k = this.kernel;
    const o = this.overlay;
    const { ox, oy } = k.offset();
    o.begin();
    if (!interior) {
      if (this.showWalk) o.walkability(k);
      for (const [id, b] of k.bubbles) {
        const p = k.ecs.get(id, 'pos');
        if (p) o.bubble(p.x - ox, k.floorAt(p.x, p.y) + 1.9, p.y - oy, b.text);
      }
      for (const id of k.ecs.query('attivita', 'pos')) {
        const a = k.ecs.get(id, 'attivita');
        const p = k.ecs.get(id, 'pos');
        if (a?.tipo && a.ferma) o.activity(p.x - ox, k.floorAt(p.x, p.y) + 1.6, p.y - oy, a.tipo, this.t);
      }
      const target = k.targetInFront();
      if (target !== undefined) {
        const p = k.ecs.get(target, 'pos');
        if (p) o.hint(p.x - ox, k.floorAt(p.x, p.y) + 1.5, p.y - oy);
      }
    }
    if (revealed && !interior) for (const b of k.corona.buildings) o.label(b.door.x + 0.5, 2.1, b.door.y + 0.5, b.floors.length > 1 ? `${b.name} (${b.floors.length} piani)` : b.name, b.color, 12, true);
    for (const a of k.archive.avatars.values()) {
      if (Math.hypot(a.x - k.playerPos().x, a.y - k.playerPos().y) > this.distance * 2) continue;
      o.label(a.x, 1.45, a.y, `${a.sigil} ${a.name}`, a.color, 11);
      if (a.say) o.bubble(a.x, 1.75, a.y, a.say, true);
    }
    if (studio) {
      const near = k.corona.itemNear(k.playerPos().x, k.playerPos().y);
      const recent = k.recentChanges();
      const pulse = 0.5 + 0.5 * Math.sin(this.t * 4);
      for (const it of studio.floor.items) if (it.path && recent.has(it.path)) o.cell(it.x, it.y, `rgba(255, 220, 120, ${0.4 + 0.4 * pulse})`, `rgba(255, 220, 120, ${0.1 + 0.15 * pulse})`, 0.4);
      if (near) {
        const c = cellNear(near, k.playerPos().x, k.playerPos().y);
        o.cell(c.x, c.y, '#ffcf5c', undefined, 0.42);
      }
      const fl = studio.floor;
      o.title(`${studio.building.name.toUpperCase()}${studio.building.floors.length > 1 ? `  ·  PIANO ${fl.index + 1}/${studio.building.floors.length}` : ''}`, studio.building.color);
      const shown = near?.kind === 'showcase' ? k.showcaseOf(near.target!) : undefined;
      if (shown) o.caption(`E: guarda «${shown.entry.label}» (${shown.index + 1}/${shown.count})`);
      else if (near && near.kind !== 'desk') o.caption(`E: ${near.kind === 'file' ? `apri ${near.label}` : near.kind === 'sprite' || near.kind === 'tile' ? `guarda «${near.label}»` : near.label}`);
    }
    if (this.mouse) {
      const r = this.toReal(this.mouse.x, this.mouse.y);
      const inCorona = interior || (revealed && Math.hypot(r.x, r.y) >= k.config.circleRadius);
      const x = inCorona ? Math.floor(r.x) : Math.floor(r.x + ox) - ox;
      const y = inCorona ? Math.floor(r.y) : Math.floor(r.y + oy) - oy;
      o.cell(x, y, 'rgba(255,255,255,0.45)', undefined, this.groundReal(x + 0.5, y + 0.5) + 0.02);
    }
    o.glitch(this.canvas, g);
  }
}
