// The landing page of the site (T101, ADR-0095): the hero runs real MarkovJunior programs (the game's engine, src/mj/)
// and shows them growing step by step as voxels in three.js; the navigation has status lights and follows the scroll;
// the showcase of the features is a set of tabs; the demo card flips.

import * as THREE from 'three';
import { compileMjx, type MjxModel } from '../src/mj/model';
import { runMjx } from '../src/mj/run';
import type { Snapshot } from '../src/mj/engine';
import { MJ_PALETTE } from '../src/mj/palette';
import pino from '../universe/models/albero.xml?raw';

/** A program of the hero: its MarkovJunior source and the line under the stage. */
interface HeroProgram {
  name: string;
  src: string;
}

// A labyrinth that grows from the centre of the box (MarkovJunior's MazeGrowth, in 3D), then lights its ends.
const LABIRINTO = `<sequence values="BWAY" origin="True" size="17 17 17">
  <color symbol="W" value="ff2a85" glow="True"/>
  <color symbol="A" value="00f0ff" glow="True"/>
  <color symbol="Y" value="ffe600" glow="True"/>
  <one in="WBB" out="WAW"/>
  <all in="W" out="Y"/>
</sequence>`;

// A coral that grows from the middle of the floor, one cell at a time, then speckles its skin with light.
const CORALLO = `<sequence values="BRUP" origin="bottom" size="21 21 21">
  <color symbol="R" value="9d00ff"/>
  <color symbol="U" value="00f0ff" glow="True"/>
  <color symbol="P" value="ff2a85" glow="True"/>
  <one in="RB" out="RR" steps="1400"/>
  <prl steps="1">
    <rule in="RB" out="UB" p="0.18"/>
    <rule in="RB" out="PB" p="0.12"/>
  </prl>
</sequence>`;

export const HERO_PROGRAMS: HeroProgram[] = [
  { name: 'LABIRINTO', src: LABIRINTO },
  { name: 'CORALLO', src: CORALLO },
  { name: 'PINO', src: pino },
];

/** How many states of a run the hero shows while it grows. */
const FRAMES = 90;
/** Seconds of growth, then of the finished model, before the next program. */
const GROW_S = 4.5;
const HOLD_S = 3.5;

export interface HeroRun {
  name: string;
  size: [number, number, number];
  frames: Snapshot[];
  /** Colour and glow of every code of the grid (index 0 is air). */
  colors: THREE.Color[];
  glow: boolean[];
}

/** Runs a program of the hero with a seed and keeps the states of its growth. */
export function runHero(prog: HeroProgram, seed: number): HeroRun {
  const model: MjxModel = compileMjx(prog.src);
  const res = runMjx(model, seed, { snapshots: FRAMES, deadline: 1500, maxSteps: 200_000 });
  const pal = model.program.palette;
  const colors: THREE.Color[] = [];
  const glow: boolean[] = [];
  for (const code of res.grid.alphabet) {
    const own = pal[code];
    const hex = own?.color ?? MJ_PALETTE[code]?.color ?? '#ffffff';
    colors.push(new THREE.Color(hex.startsWith('#') ? hex : `#${hex}`));
    glow.push(!!own?.glow);
  }
  const hidden = new Set(res.grid.alphabet.filter((c) => pal[c]?.hidden));
  const frames = (res.snapshots ?? [res.grid]).map((s) => ({ X: s.X, Y: s.Y, Z: s.Z, cells: hideCodes(s.cells, res.grid.alphabet, hidden), step: 'step' in s ? s.step : res.steps }));
  return { name: prog.name, size: [res.grid.X, res.grid.Y, res.grid.Z], frames, colors, glow };
}

function hideCodes(cells: Uint8Array, alphabet: string[], hidden: Set<string>): Uint8Array {
  if (!hidden.size) return cells;
  const out = new Uint8Array(cells);
  for (let i = 0; i < out.length; i++) if (hidden.has(alphabet[out[i]])) out[i] = 0;
  return out;
}

/** The cells of a frame that touch air (the inside of a solid model is never seen). */
export function visibleCells(f: Snapshot): number[] {
  const { X, Y, Z, cells } = f;
  const out: number[] = [];
  const air = (x: number, y: number, z: number) => x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z || cells[x + y * X + z * X * Y] === 0;
  for (let z = 0; z < Z; z++)
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++) {
        if (!cells[x + y * X + z * X * Y]) continue;
        if (air(x - 1, y, z) || air(x + 1, y, z) || air(x, y - 1, z) || air(x, y + 1, z) || air(x, y, z - 1) || air(x, y, z + 1)) out.push(x + y * X + z * X * Y);
      }
  return out;
}

function initHero(): void {
  const stage = document.getElementById('hero-3d');
  const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement | null;
  if (!stage || !canvas) return;
  const label = document.getElementById('hero-program');
  const steps = document.getElementById('hero-steps');

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch {
    stage.classList.add('no-webgl');
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x090514, 30, 60);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  camera.position.set(0, 9, 34);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0x6a4a9a, 1.6));
  const key = new THREE.DirectionalLight(0xfff5ea, 2.2);
  key.position.set(8, 16, 10);
  scene.add(key);
  const cyan = new THREE.PointLight(0x00f0ff, 60, 50);
  cyan.position.set(-12, 6, 10);
  scene.add(cyan);
  const pink = new THREE.PointLight(0xff2a85, 60, 50);
  pink.position.set(12, -4, 10);
  scene.add(pink);

  // The synthwave floor under the model.
  const grid = new THREE.GridHelper(60, 30, 0xff2a85, 0x00f0ff);
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.35;
  grid.position.y = -10.5;
  scene.add(grid);

  const pivot = new THREE.Group();
  scene.add(pivot);

  // One instanced mesh for every program: as many voxels as the largest grid could show.
  const capacity = 40_000;
  const geo = new THREE.BoxGeometry(0.92, 0.92, 0.92);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.1 });
  const mesh = new THREE.InstancedMesh(geo, mat, capacity);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.count = 0;
  pivot.add(mesh);
  // Glowing letters: an unlit copy drawn on top, slightly larger, so they read as neon without a bloom pass.
  const glowMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending });
  const halo = new THREE.InstancedMesh(new THREE.BoxGeometry(1.15, 1.15, 1.15), glowMat, capacity);
  halo.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  halo.count = 0;
  pivot.add(halo);

  const m4 = new THREE.Matrix4();
  let run: HeroRun | undefined;
  let shown = -1;
  let scale = 1;
  let started = 0;
  let cycle = 0;

  const next = (now: number) => {
    const prog = HERO_PROGRAMS[cycle % HERO_PROGRAMS.length];
    // A new seed every time round: the same program grows differently.
    run = runHero(prog, 4242 + cycle * 7919);
    cycle++;
    shown = -1;
    started = now;
    const [X, Y, Z] = run.size;
    scale = 18 / Math.max(X, Y, Z);
    pivot.scale.setScalar(scale);
    if (label) label.textContent = `// PROGRAMMA: ${run.name} //`;
  };

  const showFrame = (k: number) => {
    if (!run || k === shown) return;
    shown = k;
    const f = run.frames[k];
    const [X, Y, Z] = run.size;
    const cells = visibleCells(f);
    let n = 0;
    let g = 0;
    for (const i of cells) {
      if (n >= capacity) break;
      const x = i % X;
      const y = Math.floor(i / X) % Y;
      const z = Math.floor(i / (X * Y));
      // MarkovJunior's z is up; three.js has y up.
      m4.makeTranslation(x - (X - 1) / 2, z - (Z - 1) / 2, y - (Y - 1) / 2);
      const code = f.cells[i];
      mesh.setMatrixAt(n, m4);
      mesh.setColorAt(n, run.colors[code]);
      n++;
      if (run.glow[code] && g < capacity) {
        halo.setMatrixAt(g, m4);
        halo.setColorAt(g, run.colors[code]);
        g++;
      }
    }
    mesh.count = n;
    halo.count = g;
    mesh.instanceMatrix.needsUpdate = true;
    halo.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (halo.instanceColor) halo.instanceColor.needsUpdate = true;
    if (steps) steps.textContent = `PASSI ${f.step}\nVOXEL ${n}`;
  };

  // Dragging turns the model; the pointer elsewhere on the stage tilts it a little.
  let yaw = 0;
  let tilt = 0.25;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let idleSince = 0;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    yaw += (e.clientX - lastX) * 0.01;
    tilt = Math.max(-0.6, Math.min(0.9, tilt + (e.clientY - lastY) * 0.006));
    lastX = e.clientX;
    lastY = e.clientY;
  });
  const release = () => {
    dragging = false;
    idleSince = performance.now();
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  // A double click starts the next program at once.
  canvas.addEventListener('dblclick', () => next(performance.now()));

  const resize = () => {
    const w = stage.clientWidth || 480;
    const h = stage.clientHeight || 480;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(stage);
  resize();

  // Not on screen, not drawn: the page stays light while one reads further down.
  let visible = true;
  new IntersectionObserver((es) => (visible = es.some((e) => e.isIntersecting))).observe(stage);

  let last = performance.now();
  next(last);
  const frame = (now: number) => {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!visible || !run) return;
    const t = (now - started) / 1000;
    if (t > GROW_S + HOLD_S) next(now);
    else showFrame(Math.max(0, Math.min(run.frames.length - 1, Math.floor((t / GROW_S) * run.frames.length))));
    if (!dragging && now - idleSince > 1200) yaw += dt * 0.35;
    pivot.rotation.set(tilt, yaw, 0);
    pivot.position.y = Math.sin(now / 900) * 0.4;
    grid.position.z = ((now / 80) % 2) - 1;
    renderer.render(scene, camera);
  };
  requestAnimationFrame(frame);
}

/** The navigation: the link of the section on screen lights up, the menu opens on small screens, and two status lights. */
function initNav(): void {
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  const actions = document.querySelector('.nav-actions');
  toggle?.addEventListener('click', () => {
    const open = !links?.classList.contains('is-open');
    links?.classList.toggle('is-open', open);
    actions?.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });
  links?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) {
      links.classList.remove('is-open');
      actions?.classList.remove('is-open');
    }
  });

  const anchors = [...document.querySelectorAll<HTMLAnchorElement>('.nav-link[href^="#"]')];
  const sections = anchors.map((a) => document.querySelector<HTMLElement>(a.getAttribute('href')!)).filter((s): s is HTMLElement => !!s);
  const light = () => {
    const y = window.scrollY + window.innerHeight * 0.35;
    let current = sections[0];
    for (const s of sections) if (s.offsetTop <= y) current = s;
    for (const a of anchors) a.classList.toggle('active', a.getAttribute('href') === `#${current?.id}`);
  };
  window.addEventListener('scroll', light, { passive: true });
  light();

  void checkStatus();
}

function setStatus(id: string, state: 'on' | 'off' | 'wait', text: string): void {
  const pill = document.getElementById(id);
  if (!pill) return;
  pill.dataset.state = state;
  const t = pill.querySelector('.status-text');
  if (t) t.textContent = text;
}

/** Whether the world's server answers, and how many worlds it keeps. */
async function checkStatus(): Promise<void> {
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 4000);
    const res = await fetch('/api/universe', { signal: ctl.signal });
    clearTimeout(timer);
    const body = res.ok ? ((await res.json()) as { available?: boolean; universes?: string[] }) : undefined;
    if (!body?.available) throw new Error('no store');
    setStatus('status-server', 'on', 'MONDO ONLINE');
    const n = body.universes?.length ?? 0;
    setStatus('status-realms', n ? 'on' : 'wait', `${n} ${n === 1 ? 'REAME' : 'REAMI'}`);
  } catch {
    setStatus('status-server', 'off', 'MONDO NON RAGGIUNGIBILE');
    setStatus('status-realms', 'off', 'REAMI —');
  }
}

/** The showcase of the features: tabs that show one panel at a time (arrows move between them). */
function initShowcase(): void {
  const tabs = [...document.querySelectorAll<HTMLButtonElement>('.showcase-tab')];
  const pick = (tab: HTMLButtonElement) => {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls')!);
      if (panel) panel.hidden = !on;
    }
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => pick(tab));
    tab.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const to = tabs[(i + d + tabs.length) % tabs.length];
      pick(to);
      to.focus();
    });
  });
}

function initCard(): void {
  const card = document.getElementById('demo-card');
  const flip = () => card?.classList.toggle('is-flipped');
  card?.addEventListener('click', flip);
  card?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      flip();
    }
  });
}

if (typeof document !== 'undefined') {
  const start = () => {
    initNav();
    initShowcase();
    initCard();
    initHero();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}
