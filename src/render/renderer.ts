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
import type { CoronaView, StudioRoom } from './coronaview';
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
  /** The camera's angle around the wanderer (0 = from the south; follows input or middle-click drag). */
  yaw = 0;
  yawGoal = 0;
  /** Camera pitch: 0.95 = 3/4 view. Clamped in simulation, free in god mode or corona. */
  pitch = PITCH;
  /** God mode: enables free orbit in all directions and far zoom out even in simulation. */
  godMode = false;
  /** While the middle button drags: the angle and pitch under the mouse. */
  private drag?: { x: number; y: number; yaw: number; pitch: number };

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
  /**
   * The corona and the studio (T41): only the master's client has them (src/master.ts, loaded on demand); a
   * player's never leaves the simulation.
   */
  private corona?: CoronaView;
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
    this.yaw = (kernel.input.turn * Math.PI) / 2;
    this.yawGoal = this.yaw;
    this.overlay = new Overlay(overlay, this.camera);
    this.resize();
    window.addEventListener('resize', () => this.resize());
    kernel.bus.on('universe:reloaded', () => this.reset());
    kernel.input.onTurn = () => {
      this.yawGoal = this.kernel.input.angle;
      this.fitView();
    };
    kernel.bus.on('spell:cast', ({ at }: { at: { x: number; y: number } }) => {
      const { ox, oy } = this.offset();
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
    this.corona?.reset();
    this.things.clear();
  }

  /** The master's client draws the corona too. */
  useCorona(view: CoronaView): void {
    this.corona = view;
    this.scene.add(view.root);
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

  /** Whether the camera has full orbit in all directions and far zoom (god mode or outside the simulation / in corona/studio). */
  canFreeOrbit(): boolean {
    if (this.godMode) return true;
    const k = this.kernel;
    if (k.watching) return true;
    if (k.zone === 'corona' || k.zone === 'studio') return true;
    if (k.coronaRevealed()) return true;
    const p = k.playerPos();
    if (p && Math.hypot(p.x, p.y) >= k.config.circleRadius) return true;
    return false;
  }

  /** What the kernel loads around the wanderer: what the camera sees, with the far side of the 3/4 view; turned with the camera. */
  fitView(): void {
    const across = Math.ceil(this.distance * 2.4 * Math.max(1, this.camera.aspect));
    const deep = Math.ceil(this.distance * 2.2);
    const cos = Math.abs(Math.cos(this.yaw));
    const sin = Math.abs(Math.sin(this.yaw));
    const w = Math.ceil(cos * across + sin * deep);
    const h = Math.ceil(sin * across + cos * deep);
    this.kernel.view = { w, h };
  }

  /** Middle-button drag: the camera rotates freely around the wanderer. */
  dragStart(x: number, y = 0): void {
    this.drag = { x, y, yaw: this.yaw, pitch: this.pitch };
  }

  dragMove(x: number, y = 0): void {
    if (!this.drag) return;
    const dx = x - this.drag.x;
    const dy = y - this.drag.y;
    this.yaw = this.drag.yaw - (dx / Math.max(1, this.w)) * Math.PI * 1.5;
    this.yawGoal = this.yaw;
    if (this.canFreeOrbit()) {
      this.pitch = THREE.MathUtils.clamp(this.drag.pitch + dy * 0.004, 0.2, 1.45);
    }
    this.kernel.input.setAngle(this.yaw);
  }

  dragEnd(): void {
    if (this.drag) {
      this.yawGoal = this.yaw;
      this.drag = undefined;
    }
  }

  /** Zoom with mouse wheel: within [2.5, 15] in simulation; up to 45 in god mode / corona. */
  zoom(deltaY: number): void {
    const factor = deltaY > 0 ? 1.12 : 0.89;
    const maxDist = this.canFreeOrbit() ? 45 : 15;
    const minDist = 2.5;
    this.distance = THREE.MathUtils.clamp(this.distance * factor, minDist, maxDist);
    this.fitView();
  }

  /**
   * How the simulation is shifted to be drawn: by the carpet's scroll, or (the master following a player, T42c) so that
   * the player is in the middle.
   */
  private offset(): { ox: number; oy: number } {
    const w = this.kernel.watched();
    return w ? { ox: w.x, oy: w.y } : this.kernel.offset();
  }

  /** The height of the ground at a real-space point: the relief in the simulation, flat in the corona. */
  groundReal(x: number, y: number): number {
    const k = this.kernel;
    if (!k.watching && (k.corona.isInterior(x) || (k.coronaRevealed() && Math.hypot(x, y) >= k.config.circleRadius))) return 0;
    const { ox, oy } = this.offset();
    return k.groundAt(x + ox, y + oy);
  }

  /** Screen → real-space point on the ground: the ray meets the plane of the ground where it lands, a few times over (the relief). */
  toReal(sx: number, sy: number): { x: number; y: number } {
    this.ray.setFromCamera(new THREE.Vector2((sx / this.w) * 2 - 1, -(sy / this.h) * 2 + 1), this.camera);
    const hit = new THREE.Vector3();
    const p = this.kernel.watched() ? { x: 0, y: 0 } : this.kernel.playerPos();
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
    // The master following a player (T42c): the simulation around them, the corona and the master's wanderer hidden.
    const watch = k.watched();
    const studio = !watch && k.zone === 'studio' ? k.corona.roomAt(p.x, p.y) : undefined;
    const interior = !watch && k.corona.isInterior(p.x);
    const revealed = !watch && k.coronaRevealed();
    const { ox, oy } = this.offset();

    // The broken universe trembles; a faint crack right at the edge of the world, sometimes.
    const broken = k.brokenness();
    this.glitchLevel += (broken - this.glitchLevel) * Math.min(1, dt * 4);
    const edge = watch ? Infinity : k.config.circleRadius - Math.hypot(p.x, p.y);
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
      const pc = watch ?? k.playerCarpet();
      const inside = k.structureAt(pc.x, pc.y);
      CUT.constant = inside !== undefined ? 1.15 + k.floorAt(pc.x, pc.y) : 1e9;
      this.things.update(dt, this.t, inside);
      this.runes.update(this.t);
    }
    this.wanderer.update(k, dt, this.t);
    this.wanderer.view.root.visible = !watch;

    // The corona and the studio.
    if (this.corona) this.corona.root.visible = !watch;
    if (!watch) this.corona?.update(this.t, studio, revealed, interior);

    // Light: the day outside, a dim neon light in the studio.
    const day = k.daylight();
    const night = 1 - day;
    if (!watch && (studio || k.zone === 'corona')) {
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
    this.lights.update(k, studio ? 0 : night, { ox, oy }, this.t, watch ? { x: 0, y: 0 } : p);
    this.flash.intensity = this.flashUntil > this.t ? 6 * ((this.flashUntil - this.t) / 0.6) : 0;

    // The camera follows the wanderer, from above.
    // It looks at the wanderer's middle, up and down the hills with it.
    const aim = watch ? new THREE.Vector3(0, k.floorAt(watch.x, watch.y) + 0.6, 0) : new THREE.Vector3(p.x, this.wanderer.view.root.position.y + 0.6, p.y);
    this.target.lerp(aim, Math.min(1, dt * 8));
    if (this.target.distanceTo(aim) > 30) this.target.copy(aim);

    // In simulation without god mode: restore pitch to 3/4 (PITCH) and clamp distance to 15
    if (!this.canFreeOrbit()) {
      if (this.distance > 15) {
        this.distance = Math.max(15, this.distance - dt * 20);
        this.fitView();
      }
      if (Math.abs(this.pitch - PITCH) > 0.001) {
        this.pitch += (PITCH - this.pitch) * Math.min(1, dt * 6);
      }
    }

    if (!this.drag) {
      const goal = this.yawGoal;
      const off = Math.atan2(Math.sin(goal - this.yaw), Math.cos(goal - this.yaw));
      if (Math.abs(off) < 0.001) {
        this.yaw = goal;
      } else {
        this.yaw += off * Math.min(1, dt * 9);
        this.kernel.input.setAngle(this.yaw);
      }
    }
    const flat = Math.cos(this.pitch) * this.distance;
    this.camera.position.set(this.target.x + Math.sin(this.yaw) * flat, this.target.y + Math.sin(this.pitch) * this.distance, this.target.z + Math.cos(this.yaw) * flat);
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

  private drawOverlay(studio: StudioRoom, revealed: boolean, interior: boolean, g: number): void {
    const k = this.kernel;
    const o = this.overlay;
    const { ox, oy } = this.offset();
    const watch = !!k.watching;
    o.begin();
    if (!interior) {
      if (this.showWalk) o.walkability(k);
      for (const [id, b] of k.bubbles) {
        // The wanderer is in real space, the rest on the carpet.
        const p = id === k.playerId ? k.playerCarpet() : k.ecs.get(id, 'pos');
        if (p) o.bubble(p.x - ox, k.floorAt(p.x, p.y) + 1.9, p.y - oy, b.text);
      }
      for (const id of k.ecs.query('attivita', 'pos')) {
        const a = k.ecs.get(id, 'attivita');
        const p = k.ecs.get(id, 'pos');
        if (a?.tipo && a.ferma) o.activity(p.x - ox, k.floorAt(p.x, p.y) + 1.6, p.y - oy, a.tipo, this.t);
      }
      const target = watch ? undefined : k.targetInFront();
      if (target !== undefined) {
        const p = k.ecs.get(target, 'pos');
        if (p) o.hint(p.x - ox, k.floorAt(p.x, p.y) + 1.5, p.y - oy);
      }
    }
    if (!watch) this.corona?.overlay(o, this.t, studio, revealed, interior, this.distance);
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
