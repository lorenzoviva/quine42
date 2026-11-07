// The landing's 3D stage (T101, T315): the hero's real MarkovJunior programs (hero-programs.ts) grow step by step as voxels in three.js.
// The page loads this module only when the stage is about to be seen (landing.ts), so three.js is not downloaded before; it draws only
// while the stage is on screen and the tab is visible, and stops in between; the programs run in a worker (hero-worker.ts), so that a
// large one never stops the page. With `prefers-reduced-motion` the model stands finished and still, and turns only when dragged.

import * as THREE from 'three';
import type { HeroShow } from './hero-programs';
import { SKIN_EVENT, skinColor } from './skin-core';

/** Seconds of growth, then of the finished model, before the next program. */
const GROW_S = 4.5;
const HOLD_S = 3.5;
/** One instanced mesh for every program: as many voxels as the largest grid could show. */
const CAPACITY = 40_000;

/** Runs the programs in a worker; if a worker cannot start, here, a little later (the page then pays for them, as before T315). */
class Programs {
  private worker?: Worker;
  private asked = 0;
  private waiting = new Map<number, { program: number; seed: number; done: (show: HeroShow | undefined) => void }>();

  constructor() {
    try {
      const w = new Worker(new URL('./hero-worker.ts', import.meta.url), { type: 'module' });
      w.onmessage = (ev: MessageEvent<{ id: number; show?: HeroShow }>) => {
        const job = this.waiting.get(ev.data.id);
        this.waiting.delete(ev.data.id);
        job?.done(ev.data.show);
      };
      w.onerror = () => {
        w.terminate();
        this.worker = undefined;
        for (const [id, job] of this.waiting) {
          this.waiting.delete(id);
          this.here(job.program, job.seed, job.done);
        }
      };
      this.worker = w;
    } catch {
      this.worker = undefined;
    }
  }

  run(program: number, seed: number): Promise<HeroShow | undefined> {
    return new Promise((done) => {
      if (!this.worker) return this.here(program, seed, done);
      const id = ++this.asked;
      this.waiting.set(id, { program, seed, done });
      this.worker.postMessage({ id, program, seed });
    });
  }

  /** The engine and the programs come only if the worker could not: the page downloads them once more otherwise. */
  private here(program: number, seed: number, done: (show: HeroShow | undefined) => void): void {
    import('./hero-programs')
      .then(({ HERO_PROGRAMS, runHero, showOf }) => done(showOf(runHero(HERO_PROGRAMS[program % HERO_PROGRAMS.length], seed))))
      .catch(() => done(undefined));
  }

  stop(): void {
    this.worker?.terminate();
  }
}

/** Only the voxels drawn go to the graphics card, not the whole buffer of 40 000. */
function upload(a: THREE.BufferAttribute, count: number): void {
  if (!count) return;
  a.clearUpdateRanges();
  a.addUpdateRange(0, count);
  a.needsUpdate = true;
}

export function startStage(stage: HTMLElement, canvas: HTMLCanvasElement): () => void {
  const label = document.getElementById('hero-program');
  const steps = document.getElementById('hero-steps');

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch {
    stage.classList.add('no-webgl');
    return () => {};
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const fog = new THREE.Fog(0x090514, 30, 60);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  camera.position.set(0, 9, 34);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0x6a4a9a, 1.6));
  const key = new THREE.DirectionalLight(0xfff5ea, 2.2);
  key.position.set(8, 16, 10);
  scene.add(key);
  const cyan = new THREE.PointLight(0xffffff, 60, 50);
  cyan.position.set(-12, 6, 10);
  scene.add(cyan);
  const pink = new THREE.PointLight(0xffffff, 60, 50);
  pink.position.set(12, -4, 10);
  scene.add(pink);

  const pivot = new THREE.Group();
  scene.add(pivot);

  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.92, 0.92, 0.92), new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.1 }), CAPACITY);
  // Glowing letters: an unlit copy drawn on top, slightly larger, so they read as neon without a bloom pass.
  const glowMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending });
  const halo = new THREE.InstancedMesh(new THREE.BoxGeometry(1.15, 1.15, 1.15), glowMat, CAPACITY);
  for (const m of [mesh, halo]) {
    // The matrices start as the identity: a voxel only moves, so only its translation is written.
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CAPACITY * 3), 3).setUsage(THREE.DynamicDrawUsage);
    m.count = 0;
    // The model stays at the centre of the stage: nothing to cull, and its bounds change at every frame.
    m.frustumCulled = false;
    pivot.add(m);
  }

  // The floor under the model, and all that here is of the skin: it follows the picker.
  let grid: THREE.GridHelper | undefined;
  const paintStage = () => {
    fog.color.set(skinColor('--skin-bg', '#090514'));
    key.color.set(skinColor('--skin-text', '#fff5ea'));
    const accent = skinColor('--skin-accent', '#00f0ff');
    const accent2 = skinColor('--skin-accent-2', '#ff2a85');
    cyan.color.set(accent);
    pink.color.set(accent2);
    if (grid) {
      scene.remove(grid);
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
    }
    grid = new THREE.GridHelper(60, 30, accent2, accent);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.35;
    grid.position.y = -10.5;
    scene.add(grid);
    still();
  };

  const programs = new Programs();
  let show: HeroShow | undefined;
  /** The colour of every code of the program shown, as three.js keeps it (linear), three numbers a code. */
  let rgb = new Float32Array(0);
  let shown = -1;
  let cycle = 0;
  /** Seconds of the program shown: they pass only while the stage draws, so a stage off screen picks up where it was. */
  let clock = 0;
  let coming: HeroShow | undefined;
  let skip = false;

  const ask = () => {
    const c = cycle++;
    // The programs in turn (the worker counts them round), a new seed every time round: the same program grows differently.
    void programs.run(c, 4242 + c * 7919).then((s) => {
      if (stopped || !s) return;
      if (!show || skip) put(s);
      else coming = s;
    });
  };

  const put = (s: HeroShow) => {
    show = s;
    coming = undefined;
    skip = false;
    shown = -1;
    clock = 0;
    const [X, Y, Z] = s.size;
    pivot.scale.setScalar(18 / Math.max(X, Y, Z));
    rgb = new Float32Array(s.colors.length * 3);
    const c = new THREE.Color();
    s.colors.forEach((hex, code) => c.setHex(hex).toArray(rgb, code * 3));
    if (label) label.textContent = `// PROGRAMMA: ${s.name} //`;
    // The next one is asked now, and is ready when this one has been shown.
    ask();
    still();
  };

  const showFrame = (k: number) => {
    if (!show || k === shown) return;
    shown = k;
    const cells = show.cells[k];
    const codes = show.codes[k];
    const [X, Y, Z] = show.size;
    const cx = (X - 1) / 2;
    const cy = (Y - 1) / 2;
    const cz = (Z - 1) / 2;
    const mm = mesh.instanceMatrix.array as Float32Array;
    const mc = mesh.instanceColor!.array as Float32Array;
    const hm = halo.instanceMatrix.array as Float32Array;
    const hc = halo.instanceColor!.array as Float32Array;
    const glow = show.glow;
    let n = 0;
    let g = 0;
    for (let t = 0; t < cells.length && n < CAPACITY; t++) {
      const i = cells[t];
      // MarkovJunior's z is up; three.js has y up.
      const px = (i % X) - cx;
      const pz = (((i / X) | 0) % Y) - cy;
      const py = ((i / (X * Y)) | 0) - cz;
      const code = codes[t];
      mm[n * 16 + 12] = px;
      mm[n * 16 + 13] = py;
      mm[n * 16 + 14] = pz;
      mc[n * 3] = rgb[code * 3];
      mc[n * 3 + 1] = rgb[code * 3 + 1];
      mc[n * 3 + 2] = rgb[code * 3 + 2];
      n++;
      if (glow[code]) {
        hm[g * 16 + 12] = px;
        hm[g * 16 + 13] = py;
        hm[g * 16 + 14] = pz;
        hc[g * 3] = rgb[code * 3];
        hc[g * 3 + 1] = rgb[code * 3 + 1];
        hc[g * 3 + 2] = rgb[code * 3 + 2];
        g++;
      }
    }
    mesh.count = n;
    halo.count = g;
    upload(mesh.instanceMatrix, n * 16);
    upload(mesh.instanceColor!, n * 3);
    upload(halo.instanceMatrix, g * 16);
    upload(halo.instanceColor!, g * 3);
    if (steps) steps.textContent = `PASSI ${show.steps[k]}\nVOXEL ${n}`;
  };

  // Dragging turns the model; the pointer elsewhere on the stage tilts it a little.
  let yaw = 0;
  let tilt = 0.25;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let idleSince = 0;
  const onDown = (e: PointerEvent) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    yaw += (e.clientX - lastX) * 0.01;
    tilt = Math.max(-0.6, Math.min(0.9, tilt + (e.clientY - lastY) * 0.006));
    lastX = e.clientX;
    lastY = e.clientY;
    still();
  };
  const release = () => {
    dragging = false;
    idleSince = performance.now();
  };
  // A double click starts the next program at once (as soon as it is ready).
  const onDouble = () => {
    if (coming) put(coming);
    else skip = true;
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('dblclick', onDouble);

  const resize = () => {
    const w = stage.clientWidth || 480;
    const h = stage.clientHeight || 480;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // A stage narrower than this (the column over φ, a phone) opens the lens, so that the model is not cut at the sides.
    const FIT_ASPECT = 1.3;
    const halfFov = THREE.MathUtils.degToRad(20);
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan((Math.tan(halfFov) * FIT_ASPECT) / Math.min(FIT_ASPECT, camera.aspect)));
    camera.updateProjectionMatrix();
    still();
  };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let stopped = false;
  let raf = 0;
  let last = 0;
  const moving = () => visible && !document.hidden && !reduced.matches && !stopped;

  /** A frame of the stage: time passes, the model grows and turns. */
  const frame = (now: number) => {
    raf = 0;
    if (!moving()) return still();
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    clock += dt;
    if (show) {
      if (clock > GROW_S + HOLD_S && coming) put(coming);
      showFrame(Math.max(0, Math.min(show.cells.length - 1, Math.floor((clock / GROW_S) * show.cells.length))));
    }
    if (!dragging && now - idleSince > 1200) yaw += dt * 0.35;
    pivot.rotation.set(tilt, yaw, 0);
    pivot.position.y = Math.sin(now / 900) * 0.4;
    if (grid) grid.position.z = ((now / 80) % 2) - 1;
    renderer.render(scene, camera);
  };

  /** Standing still (reduced motion), one picture when something changes: the finished model, as it is turned. */
  let pending = false;
  function still(): void {
    if (moving() || stopped || !visible || pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      if (moving() || stopped) return;
      if (show) showFrame(show.cells.length - 1);
      pivot.rotation.set(tilt, yaw, 0);
      pivot.position.y = 0;
      renderer.render(scene, camera);
    });
  }

  const wake = () => {
    if (moving()) {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    } else {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      still();
    }
  };

  // Not on screen, not drawn: the page stays light while one reads further down.
  const seen = new IntersectionObserver((es) => {
    visible = es.some((e) => e.isIntersecting);
    wake();
  });
  seen.observe(stage);
  const sized = new ResizeObserver(resize);
  sized.observe(stage);
  document.addEventListener('visibilitychange', wake);
  reduced.addEventListener('change', wake);
  document.addEventListener(SKIN_EVENT, paintStage);
  paintStage();
  resize();
  ask();

  return () => {
    stopped = true;
    if (raf) cancelAnimationFrame(raf);
    seen.disconnect();
    sized.disconnect();
    document.removeEventListener('visibilitychange', wake);
    reduced.removeEventListener('change', wake);
    document.removeEventListener(SKIN_EVENT, paintStage);
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', release);
    canvas.removeEventListener('pointercancel', release);
    canvas.removeEventListener('dblclick', onDouble);
    programs.stop();
    renderer.dispose();
  };
}
