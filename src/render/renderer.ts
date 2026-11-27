// The 3D renderer (step 9, ADR-0040): three.js, a camera in 3/4 from the south that turns by quarter turns
// (ADR-0047: the input turns the keys with it), HUD and panels above it in the DOM, text on a 2D overlay.
//
// Spaces (ADR-0004): the simulation — chunks, entities, runes — lives in carpet coordinates and is drawn
// shifted by the carpet's offset; the wanderer, the corona and the studio are in real space. Kernel
// (x, y) is three.js (x, z), one tile is one unit, y is up. Once the corona shows (`kernel.coronaRevealed`: only out of
// the circle or in the studio, ADR-0124), nothing of the simulation is drawn beyond the circle.

import * as THREE from 'three';
import { gpuName, makeRenderer } from './gpu';
import type { Kernel } from '../kernel/kernel';
import { Bloom } from './bloom';
import type { CoronaView, StudioRoom } from './coronaview';
import { aerial, CARTOON, CARTOON_BLOOM_RADIUS, CARTOON_HEMI, CARTOON_INDOORS, CARTOON_STUDIO, cartoonLight, SHADE, SHADOW_INTENSITY, SHADOW_RADIUS, SUN_FROM } from './cartoon';
import { CUT, cutBackOf, U, windToTexture } from './materials';
import { Smoke } from './smoke';
import { viewBytes, type WindView } from '../kernel/wind';
import { Overlay } from './overlay';
import { CRACK, GLITCH_EASE, crackLevel } from './glitch';
import { buildChunk, buildCut, chunkInput, chunkSig, chunkView, cutSig, disposeChunk, staleChunks, tileForms, type TerrainView } from './terrain';
import { ChunkMesher } from './chunkmesher';
import { CoverLayer } from './cover';
import { CAMERA_AIM, dimAt, towardsCamera, type CameraLine, type Cut, type Underground } from '../kernel/underground';
import { trimGeometries } from './models';
import { Lights, Runes, Entities, Wanderer } from './entities';
import { HELM_VIEW, wheelFactor, zoomDistance, zoomMax } from './camera';
import { Stars, STAR_SKY } from './stars';
import { Planets, PLACES_BELOW } from './planet';
import { GLOBE_RADIUS, GLOBE_TOP, natureOfBand, ORBIT_TOP, planetPlace, transitView } from '../kernel/planets';

const SKY = { day: new THREE.Color('#9cc8e8'), dusk: new THREE.Color('#e8a070'), night: new THREE.Color('#0e1424'), studio: new THREE.Color('#07070f'), corona: new THREE.Color('#05060a') };
const PITCH = 0.95;
/** How far (tiles) from the ground the feet stand when the cursor points at their floor and not at the ground (T431): a storey, a cellar. */
const FEET_OFF = 0.5;

export class Renderer {
  showWalk = false;
  mouse: { x: number; y: number } | null = null;
  /** Distance of the camera from the wanderer, in tiles. */
  distance = 15;
  /** Where the camera draws back to, the helm just taken (T439); the wheel or a pinch stops it. */
  private helmEase: number | undefined;
  private wasAtHelm = false;
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
  /** The GPU drawing the world, as the browser names it (T330); `undefined` when it does not say. */
  readonly gpu: string | undefined;
  private bloom: Bloom;
  private scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
  private hemi = CARTOON ? new THREE.HemisphereLight(CARTOON_HEMI.sky, CARTOON_HEMI.ground, 1.1) : new THREE.HemisphereLight(0xdcecff, 0x5a4a3a, 1.1);
  private sun = new THREE.DirectionalLight(0xfff0d8, 2.2);
  /** The simulation, in carpet coordinates. */
  private world = new THREE.Group();
  private chunks = new Map<string, TerrainView>();
  /** The places' meshes made off the page's thread (T486); without a worker, or once it stops, here. */
  private mesher = new ChunkMesher();
  /** The cover of the terrains on the loaded window (T545, ADR-0268): one InstancedMesh a form, without shadows, under its cap. */
  readonly cover = new CoverLayer();
  /** The caps of the cut under the ground (T416): built again when one changes tile or floor down there, or the camera turns. */
  private cut?: { sig: string; mesh?: THREE.Mesh };
  /** How much of the sun and the sky is left (T416): less the deeper one is under the ground, eased. */
  private dim = 1;
  private entities: Entities;
  private runes: Runes;
  private wanderer: Wanderer;
  private lights: Lights;
  /** The smoke of what burns, carried by the wind (T484). */
  private smoke: Smoke;
  /** The coarse wind in the texture now (T484): a new view, a new texture. */
  private windShown?: WindView;
  /**
   * The corona and the studio (T41): only the master's client has them (src/master.ts, loaded on demand); a
   * player's never leaves the simulation.
   */
  private corona?: CoronaView;
  /** When to see again whether the geometries that nothing draws are too many. */
  private trimAt = 0;
  /**
   * One fog, always on (T226): in the corona and the studio it is only so far away that it does not show. Taking it off would
   * change the program of every material, and the frame the edge is crossed would wait for them (5-7 programs, 170-290 ms).
   */
  private fog = new THREE.Fog(0, 1, 2);
  /** The sky of stars of a world whose nature says it (T445), behind and under everything; hidden otherwise. */
  private stars = new Stars();
  /** The planets of a world that has them (T449): their globes at the levels of detail a voyage wants, in a pass of their own. */
  private planets?: Planets;
  /** The voyage shown (T449): its clock, which goes on by itself between two updates, and what flies with the vehicle. */
  private voyage?: { id: number; t: number; ids: Set<number>; at: number };
  /** Where the ring's meshes are drawn once before they are seen, so that they are on the GPU when the edge is crossed (T226). */
  private loader = { target: new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }), group: new THREE.Group() };
  private overlay: Overlay;
  private flash = new THREE.PointLight(0xfff2c0, 0, 8, 1.4);
  private flashUntil = 0;
  private target = new THREE.Vector3();
  private ray = new THREE.Raycaster();
  private ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private t = 0;
  private glitchLevel = 0;
  private crack = 0;
  /** prefers-reduced-motion: the glitch stays still (T316). */
  private stillMotion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : undefined;
  private w = 0;
  private h = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    overlay: HTMLCanvasElement,
    private kernel: Kernel,
  ) {
    this.gl = makeRenderer({ canvas, antialias: true });
    this.gpu = gpuName(this.gl);
    this.gl.shadowMap.enabled = true;
    this.gl.localClippingEnabled = true;
    this.gl.shadowMap.type = THREE.PCFShadowMap;
    this.bloom = new Bloom(this.gl, this.scene, this.camera);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 90 });
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.02;
    if (CARTOON) {
      this.sun.shadow.intensity = SHADOW_INTENSITY;
      this.sun.shadow.radius = SHADOW_RADIUS;
      this.bloom.radius = CARTOON_BLOOM_RADIUS;
    }
    this.scene.fog = this.fog;
    this.scene.add(this.hemi, this.sun, this.sun.target, this.world, this.flash, this.loader.group, this.stars.root);
    this.world.add(this.cover.group);
    this.entities = new Entities(kernel, this.world);
    this.runes = new Runes(kernel, this.world);
    this.wanderer = new Wanderer(this.scene);
    this.lights = new Lights(this.scene);
    this.smoke = new Smoke(this.scene);
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
    // The places' meshes stay on screen until theirs anew take their place (T492): every commit of the Council reloads the files, and taking
    // them all away here left a frame, or a dozen while the worker made them again, with only the sky where the ground was. Stale, they are
    // made again a few a frame and each replaced in the same frame its new one comes (`showChunk`); a place no longer loaded goes as ever.
    staleChunks(this.chunks);
    // What the worker brings back now is of the files before.
    this.mesher.forget();
    this.syncCut(undefined);
    this.corona?.reset();
    this.entities.clear();
    this.planets?.dispose();
    this.planets = undefined;
  }

  /**
   * The voyage the wanderer is on (T449), as it is shown: the vehicle and what is aboard, the body under it (the one left until the kernel moves
   * the vehicle, the one reached after) and how high over its landing (`transitView`).
   */
  private voyageNow(dt: number): { id: number; band: number; altitude: number; ids: Set<number> } | undefined {
    const k = this.kernel;
    const id = k.planets().length && !k.watched() && k.zone === 'sim' ? k.aboard() : undefined;
    const tr = id !== undefined ? k.transitOf(id) : undefined;
    if (id === undefined || !tr) return (this.voyage = undefined);
    let v = this.voyage;
    if (!v || v.id !== id) v = this.voyage = { id, t: tr.t, ids: new Set([id]), at: -1 };
    v.t = Math.abs(v.t + dt - tr.t) > 0.5 ? tr.t : Math.min(tr.total, v.t + dt);
    if (this.t - v.at > 0.5) {
      v.at = this.t;
      v.ids = new Set([id, ...k.ecs.query('pos').filter((e) => e !== id && k.carriedOn(e)?.vehicle === id)]);
    }
    const top = (b: number) => (b > 0 ? GLOBE_TOP * GLOBE_RADIUS : ORBIT_TOP);
    const s = transitView({ ...tr, t: v.t }, top);
    const band = tr.jumped ? tr.to : tr.from;
    return { id, band, altitude: band === s.band ? s.altitude : top(band), ids: v.ids };
  }

  /** What the planets are asked this frame (T449): the body under the voyage, its altitude, its sky if it has air (by its own day). */
  private planetSight(v: { band: number; altitude: number }): { band: number; altitude: number; sky?: THREE.Color } {
    const k = this.kernel;
    if (v.band < 1) return v;
    const S = k.config.chunkSize;
    const n = natureOfBand(k.config.nature, v.band);
    if (n.sky !== 'earth') return v;
    const day = k.daylight(planetPlace(v.band, S) * S);
    return { ...v, sky: day > 0.6 ? SKY.day.clone() : day > 0.3 ? SKY.dusk.clone().lerp(SKY.day, (day - 0.3) / 0.3) : SKY.night.clone().lerp(SKY.dusk, day / 0.3) };
  }

  /** The tiles of the places loaded on a band (T449): the levels leave them to the true places. */
  private placesOf(band: number): { x0: number; y0: number; x1: number; y1: number } | undefined {
    const k = this.kernel;
    const S = k.config.chunkSize;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const ch of k.chunks.values()) {
      if (k.bandOf(ch.cx) !== band) continue;
      x0 = Math.min(x0, ch.cx * S);
      y0 = Math.min(y0, ch.cy * S);
      x1 = Math.max(x1, (ch.cx + 1) * S);
      y1 = Math.max(y1, (ch.cy + 1) * S);
    }
    return Number.isFinite(x0) ? { x0, y0, x1, y1 } : undefined;
  }

  /** What the planets' levels cost now (T449: `misura-frame`, the console), or nothing in a world without planets. */
  planetStats(): ReturnType<Planets['stats']> | undefined {
    return this.planets?.stats();
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

  /**
   * Whether the camera has full orbit and far zoom: god mode (the master has it), following a player, the corona, the
   * studio. Inside the circle the base is the 3/4 view. This says nothing about what is drawn (ADR-0124): the corona
   * depends on `kernel.coronaRevealed` alone, so an activity that one day asks for the orbit only needs a line here.
   */
  canFreeOrbit(): boolean {
    if (this.godMode) return true;
    const k = this.kernel;
    if (k.watching) return true;
    if (k.zone === 'corona' || k.zone === 'studio') return true;
    const p = k.wandererPos();
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

  /** Whether the wanderer holds a vehicle's helm (T439): the camera may go further, up to `ZOOM.helm`. */
  atHelm(): boolean {
    return this.kernel.zone === 'sim' && this.kernel.atHelm() !== undefined;
  }

  /** Zoom with the mouse wheel: within [2.5, 15] in simulation, 30 at a helm; up to 45 in god mode / corona (`ZOOM`, src/render/camera.ts). */
  zoom(deltaY: number): void {
    this.helmEase = undefined;
    this.distance = zoomDistance(this.distance, wheelFactor(deltaY), this.canFreeOrbit(), this.atHelm());
    this.fitView();
  }

  /** The camera at a distance, within the wheel's limits: a pinch of two fingers (T387). */
  zoomTo(distance: number): void {
    this.helmEase = undefined;
    this.distance = zoomDistance(distance, 1, this.canFreeOrbit(), this.atHelm());
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
    if (k.coronaRevealed() && (k.corona.isInterior(x) || Math.hypot(x, y) >= k.config.circleRadius)) return 0;
    const { ox, oy } = this.offset();
    return k.groundAt(x + ox, y + oy);
  }

  /**
   * Screen → real-space point on the ground: the ray meets the plane of the ground where it lands, a few times over (the relief). Who stands
   * on a storey of a building or in a cellar (feet more than `FEET_OFF` from the ground, T431) points at the floor they stand on: the ray
   * meets the plane of their feet, so the cursor upstairs is on what is upstairs, not on the ground under it.
   */
  toReal(sx: number, sy: number): { x: number; y: number } {
    this.ray.setFromCamera(new THREE.Vector2((sx / this.w) * 2 - 1, -(sy / this.h) * 2 + 1), this.camera);
    const hit = new THREE.Vector3();
    const p: { x: number; y: number; z?: number } = this.kernel.watched() ? { x: 0, y: 0 } : this.kernel.wandererPos();
    const feet = p.z;
    if (typeof feet === 'number' && Number.isFinite(feet) && Math.abs(feet - this.groundReal(p.x, p.y)) > FEET_OFF) {
      this.ground.constant = -feet;
      return this.ray.ray.intersectPlane(this.ground, hit) ? { x: hit.x, y: hit.z } : { x: p.x, y: p.y };
    }
    this.ground.constant = -this.groundReal(p.x, p.y);
    for (let i = 0; i < 4; i++) {
      if (!this.ray.ray.intersectPlane(this.ground, hit)) return { ...p };
      const h = this.groundReal(hit.x, hit.z);
      if (Math.abs(h + this.ground.constant) < 1e-6) break;
      this.ground.constant = -h;
    }
    return { x: hit.x, y: hit.z };
  }

  /** The coarse wind of the world in the shaders' texture (T484): its cells when the view is a new one, where it lies every frame. */
  private syncWind(ix: number, iy: number): void {
    const view = this.kernel.windView();
    if (!view) {
      U.windOn.value = 0;
      this.windShown = undefined;
      return;
    }
    if (view !== this.windShown) {
      const bytes = viewBytes(view);
      if (!bytes) return void (U.windOn.value = 0);
      windToTexture(view.w, view.h, bytes);
      this.windShown = view;
    }
    U.windOn.value = 1;
    U.windBox.value.set(view.x - ix, view.y - iy, 1 / (view.w * view.cell), 1 / (view.h * view.cell));
  }

  render(dt: number): void {
    const k = this.kernel;
    this.t += dt;
    U.time.value = this.t;
    const p = k.wandererPos();
    // The master following a player (T42c): the simulation around them, the corona and the master's wanderer hidden.
    const watch = k.watched();
    const studio = !watch && k.zone === 'studio' ? k.corona.roomAt(p.x, p.y) : undefined;
    const interior = !watch && k.corona.isInterior(p.x);
    const revealed = k.coronaRevealed();
    const { ox, oy } = this.offset();

    // The broken universe trembles; a faint crack right at the edge of the world, sometimes.
    const broken = k.brokenness();
    this.glitchLevel += (broken - this.glitchLevel) * Math.min(1, dt * GLITCH_EASE);
    const edge = watch ? Infinity : k.config.circleRadius - Math.hypot(p.x, p.y);
    if (broken === 0 && edge < 3 && edge > 0 && this.crack === 0 && Math.random() < dt / 8) this.crack = CRACK;
    this.crack = Math.max(0, this.crack - dt);
    const g = Math.max(this.glitchLevel, crackLevel(this.crack));

    // A voyage (T449): the vehicle and who is aboard over the ground, the rest of the world hidden over a planet's levels.
    if (k.planets().length) this.planets ??= new Planets(k);
    const voyage = this.voyageNow(dt);
    const alone = !!voyage && voyage.band > 0 && voyage.altitude > PLACES_BELOW;
    this.wanderer.aloft = voyage?.altitude ?? 0;
    this.entities.aloft = voyage ? { ids: voyage.ids, dy: voyage.altitude, alone } : undefined;
    for (const v of this.chunks.values()) v.group.visible = !alone;
    this.cover.group.visible = !alone;

    // The simulation.
    this.world.visible = !interior;
    this.world.position.set(-ox, 0, -oy);
    U.clipR.value = revealed ? k.config.circleRadius : 1e9;
    let under: Underground | undefined;
    if (!interior) {
      this.syncChunks();
      // The cover of the places (T545): made again only when theirs changed.
      this.cover.sync(k, this.chunks.values(), watch ?? k.wandererCarpet());
      // Inside a structure what is above the floor one is on is cut away, so the wanderer is seen (T53b).
      const pc = watch ?? { ...k.wandererCarpet(), z: k.wandererPos().z };
      const inside = k.structureAt(pc.x, pc.y);
      CUT.constant = inside !== undefined ? 1.15 + k.floorAt(pc.x, pc.y, pc.z) : 1e9;
      // Under the ground (T416): what stands over the head in a disc around is cut, terrain too; the corona has nothing of it.
      under = watch ? k.underground(watch) : k.underground();
      // Where the ground in front hides the wanderer from the camera (T476, the true relief): the same disc, at the head, on the camera's side.
      // Not on a voyage (T449): the camera follows the vehicle aloft.
      const cut: Cut | undefined = under ?? (voyage ? undefined : k.cameraCut(this.cameraLine(), watch));
      this.syncCut(cut);
      // The cut in whole tiles of the carpet (T449): the shader gets the scroll's fraction and the tile relative to its whole part, small numbers
      // a million tiles from the origin too.
      const ix = Math.floor(ox), iy = Math.floor(oy);
      U.cutOff.value.set(ox - ix, oy - iy);
      // The world's wind (T484): what the grass and the trees bend with, where it lies from the whole part of the scroll.
      this.syncWind(ix, iy);
      if (cut) U.cutTile.value.set(cut.tile.x - ix, cut.tile.y - iy);
      this.entities.update(dt, this.t, inside);
      this.runes.update(this.t);
    }
    if (interior) this.syncCut(undefined);
    this.wanderer.update(k, dt, this.t);
    this.wanderer.view.root.visible = !watch;
    if (watch) this.wanderer.hideShadow();

    // The corona and the studio.
    // Everything of it hangs from one group, shown by one decision: nothing of it is drawn inside the circle (ADR-0124).
    if (this.corona) this.corona.root.visible = revealed;
    if (!watch) this.corona?.update(this.t, studio, revealed, k.coronaNear(), interior);

    // Light: the day outside, a dim neon light in the studio.
    // The light and the sky of where one is (T449: a planet's own `nature.sky` and day), and the stars on a voyage.
    const here = watch ? watch.x : k.wandererCarpet().x;
    const day = k.daylight(here);
    const starry = !!voyage || k.natureAt(here).sky === 'stars';
    const night = 1 - day;
    if (revealed) {
      // The studio and its campus have their own light, day and night: neon and screens.
      this.sun.intensity = studio ? (CARTOON ? CARTOON_STUDIO.sun : 0) : 0.8;
      this.hemi.intensity = studio ? (CARTOON ? CARTOON_STUDIO.hemi : 0.9) : 1.0;
      this.scene.background = studio ? SKY.studio : SKY.corona;
      this.fog.near = this.fog.far = 1e6;
      if (CARTOON) {
        this.sun.color.set(CARTOON_INDOORS.sun);
        this.hemi.color.set(CARTOON_INDOORS.sky);
        this.hemi.groundColor.set(CARTOON_INDOORS.ground);
        SHADE.value.set(...CARTOON_INDOORS.shade);
        this.bloom.strength = CARTOON_INDOORS.bloom;
      }
    } else {
      if (CARTOON) {
        const light = cartoonLight(day);
        this.sun.intensity = light.sunIntensity;
        this.sun.color.copy(light.sun);
        this.hemi.intensity = light.hemiIntensity;
        this.hemi.color.copy(light.sky);
        this.hemi.groundColor.copy(light.ground);
        SHADE.value.set(...light.shade);
        this.bloom.strength = light.bloom;
      } else {
        this.sun.intensity = 2.3 * Math.min(1, day * 1.4);
        this.sun.color.setHSL(0.09, 0.6, 0.6 + 0.3 * day);
        this.hemi.intensity = 0.22 + 0.9 * Math.min(1, day * 1.3);
      }
      // Under the ground the sun and the sky are dimmer, the deeper the dimmer (T416); the lights of things stay.
      this.dim += (dimAt(under?.depth ?? 0) - this.dim) * Math.min(1, dt * 3);
      this.sun.intensity *= this.dim;
      this.hemi.intensity *= this.dim;
      // Under the stars (T445) the sky is black, by day too: the light is the sun's, the sky has no air to colour.
      const bg = starry ? STAR_SKY.clone() : day > 0.6 ? SKY.day.clone() : day > 0.3 ? SKY.dusk.clone().lerp(SKY.day, (day - 0.3) / 0.3) : SKY.night.clone().lerp(SKY.dusk, day / 0.3);
      this.scene.background = bg;
      this.fog.color.copy(bg);
      const air = CARTOON ? aerial(this.distance, day) : { near: this.distance * 2.2, far: this.distance * 4.5 };
      // On a voyage the ground is as far again as the altitude (T449): it goes away into the dark, and comes back from it.
      const up = voyage?.altitude ?? 0;
      this.fog.near = air.near + up;
      this.fog.far = air.far + up * 1.25;
    }
    this.lights.update(k, studio ? 0 : night, { ox, oy }, this.t, watch ? { x: 0, y: 0 } : p);
    this.smoke.update(k, dt, { ox, oy }, !interior && !revealed && k.zone === 'sim');
    this.flash.intensity = this.flashUntil > this.t ? 6 * ((this.flashUntil - this.t) / 0.6) : 0;

    // The camera follows the wanderer, from above.
    // It looks at the wanderer's middle, up and down the hills with it.
    const aim = watch ? new THREE.Vector3(0, k.floorAt(watch.x, watch.y, watch.z) + CAMERA_AIM, 0) : new THREE.Vector3(p.x, this.wanderer.view.root.position.y - this.wanderer.lift + this.wanderer.sunk + CAMERA_AIM, p.y);
    this.target.lerp(aim, Math.min(1, dt * 8));
    // On a voyage (T449) the altitude changes by a share of itself each second: the camera keeps the vehicle where it is, without easing.
    if (voyage || this.target.distanceTo(aim) > 30) this.target.copy(aim);

    // In simulation without god mode: restore pitch to 3/4 (PITCH) and clamp distance to 15
    // At the helm (T439) the camera draws back once, to see the hull and the shore; let go, it comes back within the simulation's.
    const helm = this.atHelm();
    if (helm && !this.wasAtHelm && this.distance < HELM_VIEW) this.helmEase = HELM_VIEW;
    if (!helm) this.helmEase = undefined;
    this.wasAtHelm = helm;
    if (this.helmEase !== undefined) {
      this.distance += (this.helmEase - this.distance) * Math.min(1, dt * 3);
      if (Math.abs(this.helmEase - this.distance) < 0.05) this.helmEase = undefined;
      this.fitView();
    }
    if (!this.canFreeOrbit()) {
      const max = zoomMax(false, helm);
      if (this.distance > max) {
        this.distance = Math.max(max, this.distance - dt * 20);
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
    // On a voyage the far plane follows the altitude (T449), the near one a little further from the eye: the depth keeps its precision.
    const far = voyage ? Math.min(3e4, Math.max(400, voyage.altitude * 1.5 + 400)) : 400;
    const near = voyage ? 1 : 0.1;
    if (this.camera.far !== far || this.camera.near !== near) {
      this.camera.far = far;
      this.camera.near = near;
      this.camera.updateProjectionMatrix();
    }
    // The stars only where the world shows, never with the corona (ADR-0124: it has its own dark).
    this.stars.update(starry && !revealed, this.camera, ox, oy);
    // A planet seen on a voyage (T449): its globe in the pass before the world's, the world over it without its background.
    const drawn = !revealed && !!voyage && !!this.planets?.show(this.planetSight(voyage), this.camera, this.h, ox, oy, this.placesOf(voyage.band), this.wanderer.view.root.position);
    this.bloom.background(drawn ? this.planets!.scene : null, this.planets?.camera);
    if (!drawn) this.planets?.warm(this.gl, this.loader.target);
    if (drawn) {
      this.fog.color.copy(this.planets!.scene.background as THREE.Color);
      this.scene.background = null;
      this.stars.root.visible = false;
    } else this.planets?.show(undefined, this.camera, this.h, ox, oy);
    this.sun.position.copy(this.target).add(new THREE.Vector3(...SUN_FROM));
    this.sun.target.position.copy(this.target);
    this.bloom.render(dt);
    if (!revealed) this.loadRing();
    this.drawOverlay(studio, revealed, interior, g);
    const clock = performance.now();
    if (clock >= this.trimAt) {
      this.trimAt = clock + 5_000;
      trimGeometries(this.scene, clock);
    }
  }

  /**
   * What is still to load of the ring, a little each frame (T226). three.js loads geometries, textures and programs when
   * it first draws them, and `visible = false` would leave all that to the frame the edge is crossed: so copies of its
   * meshes are drawn here into a target of one pixel, with the scene's lights and fog, so the programs are the same.
   */
  private loadRing(): void {
    const next = this.corona?.nextToLoad();
    if (!next?.meshes.length) return;
    const { target, group } = this.loader;
    const worldShown = this.world.visible;
    const updateShadows = this.gl.shadowMap.autoUpdate;
    this.world.visible = false;
    this.gl.shadowMap.autoUpdate = false;
    this.gl.setRenderTarget(target);
    const from = performance.now();
    while (next.meshes.length && performance.now() - from < next.ms) {
      const m = next.meshes.pop()!;
      const copy = new THREE.Mesh(m.geometry, m.material);
      copy.frustumCulled = false;
      group.add(copy);
      this.gl.render(this.scene, this.camera);
      group.remove(copy);
    }
    this.gl.setRenderTarget(null);
    this.gl.shadowMap.autoUpdate = updateShadows;
    this.world.visible = worldShown;
  }

  /**
   * The camera as the cut towards it reads it (T476): the quarter it looks from, the rise of its line, how far it stands on the flat.
   */
  private cameraLine(): CameraLine {
    return { towards: towardsCamera(this.yawGoal), rise: Math.tan(this.pitch), reach: Math.cos(this.pitch) * this.distance };
  }

  /**
   * The cut under the ground (T416) or towards the camera (T476): the shaders' uniforms (`U.cutY`…) and the caps of the disc, built again
   * only when what they depend on changes. Undefined: nothing is cut.
   */
  private syncCut(cut: Cut | undefined): void {
    const k = this.kernel;
    const towards = towardsCamera(this.yawGoal);
    U.cutY.value = cut ? cut.cut : 1e9;
    if (cut) {
      U.cutTile.value.set(cut.tile.x, cut.tile.y);
      U.cutDir.value.set(towards.x, towards.y);
      U.cutBack.value = cutBackOf(cut.around);
    }
    const sig = cut ? cutSig(k, cut, towards) : '';
    if (this.cut?.sig === sig) return;
    if (this.cut?.mesh) {
      this.world.remove(this.cut.mesh);
      this.cut.mesh.geometry.dispose();
    }
    const mesh = cut ? buildCut(k, cut, towards) : undefined;
    if (mesh) this.world.add(mesh);
    this.cut = { sig, mesh };
  }

  /**
   * Builds the chunks that are new or changed, drops the unloaded ones. Their meshes are made in a worker (T486): a few copies of what they read
   * sent each frame, one at a time a place, and what came back put on screen; what changed while it was out goes again. Without the worker,
   * a few made here each frame, as before.
   */
  private syncChunks(): void {
    const k = this.kernel;
    // Which terrains' models are ready: chunks are built again when theirs arrive.
    const models = Object.entries(k.palette).filter(([, t]) => t.model).map(([code]) => `${code}${tileForms(k, code) ? 1 : 0}`).join('');
    // What the worker made: on screen, unless its place has gone or what stands on it is no longer ready (then it goes again, its signature is old).
    for (const got of this.mesher.take()) {
      const ch = k.chunks.get(got.key);
      if (!ch) continue;
      // What failed there fails here too, as it did before the worker.
      const nv = got.arrays ? chunkView(k, ch, got.arrays, got.sig) : buildChunk(k, ch, models);
      if (nv) this.showChunk(nv);
    }
    let budget = 3;
    const from = performance.now();
    for (const ch of k.chunks.values()) {
      const v = this.chunks.get(ch.key);
      const sig = chunkSig(k, ch, models);
      if (v && v.sig === sig) continue;
      if (this.mesher.working) {
        // A copy costs a tenth of a mesh (most of it the ground's heights): a few each frame, and not past a millisecond and a half.
        if (this.mesher.asking(ch.key) || budget <= 0 || (budget < 3 && performance.now() - from > 1.5)) continue;
        budget--;
        this.mesher.ask(ch.key, sig, chunkInput(k, ch));
        continue;
      }
      if (budget-- <= 0) continue;
      this.showChunk(buildChunk(k, ch, models));
    }
    for (const [key, v] of [...this.chunks]) if (!k.chunks.has(key)) {
      this.world.remove(v.group);
      disposeChunk(v);
      this.chunks.delete(key);
    }
  }

  /** A place's meshes on screen, in the place of what it had. */
  private showChunk(nv: TerrainView): void {
    const v = this.chunks.get(nv.key);
    if (v) {
      this.world.remove(v.group);
      disposeChunk(v);
    }
    this.world.add(nv.group);
    this.chunks.set(nv.key, nv);
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
        const p = id === k.wandererEntity ? { ...k.wandererCarpet(), z: k.wandererPos().z } : k.ecs.get(id, 'pos');
        if (p) o.bubble(p.x - ox, k.floorAt(p.x, p.y, p.z) + 1.9, p.y - oy, b.text);
      }
      for (const id of k.ecs.query('activity', 'pos')) {
        const a = k.ecs.get(id, 'activity');
        const p = k.ecs.get(id, 'pos');
        if (a?.kind && a.still) o.activity(p.x - ox, k.floorAt(p.x, p.y, p.z) + 1.6, p.y - oy, a.kind, this.t);
      }
      const target = watch ? undefined : k.targetInFront();
      if (target !== undefined) {
        const p = k.ecs.get(target, 'pos');
        if (p) o.hint(p.x - ox, k.floorAt(p.x, p.y, p.z) + 1.5, p.y - oy);
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
    o.glitch(this.canvas, g, this.t, this.stillMotion?.matches ?? false);
  }
}
