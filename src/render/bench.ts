// The bench of the Systems Room in 3D (T27b): in the glass case on its plinth (itemMesh) the scene of a case, 5 × 5 tiles
// in the colours of the palette, with the wanderer and the things where the kernel in miniature put them; above it a
// screen with the case, the lines of the code that make it and the values it watches. It plays in a loop: before (the
// first frame, still), the rule (the frames as they ran, the lines lit), after (the last frame, what changed lit).

import * as THREE from 'three';
import type { StudioItem } from '../kernel/corona';
import { BENCH, fieldLabel, valueText, type BenchFrame, type BenchShown } from '../kernel/bench';
import { arrowSign, BENCH_GLASS, BENCH_TOP } from './corona3d';
import { BEZEL, DARK, DIM, fit, PX, TILT } from './screens';
import { Builder } from './terrain';
import { MAT, rgbOf } from './materials';

/** Seconds of the three moments: before and after are held still, the rule lasts as long as the case ran. */
const BEFORE = 1.8;
const AFTER = 2.6;
export type BenchMoment = 'prima' | 'regola' | 'dopo';
const MOMENT_NAME: Record<BenchMoment, string> = { prima: 'PRIMA', regola: 'LA REGOLA', dopo: 'DOPO' };
const MOMENT_COLOR: Record<BenchMoment, string> = { prima: '#9fb4ff', regola: '#ffcf5c', dopo: '#7dff9a' };
const WANDERER = '#7fe0ff';
/** Low and wide, resting on the lid of the case: the chain’s screens behind it stay in sight. */
const SCREEN = { w: 3.4, h: 1.15, y: BENCH_TOP + BENCH_GLASS + 0.02 };
/** Lines of code on the screen at most. */
const LINES = 5;
/** Watched values on the screen at most (the panel has them all). */
const VALUES = 4;

/** Where the loop is at time t: the moment and the time of the case (from 0 to the last frame). */
export function benchMoment(frames: BenchFrame[], t: number): { moment: BenchMoment; at: number } {
  const end = frames.at(-1)?.t ?? 0;
  const loop = BEFORE + end + AFTER;
  const u = ((t % loop) + loop) % loop;
  if (u < BEFORE) return { moment: 'prima', at: 0 };
  if (u < BEFORE + end) return { moment: 'regola', at: u - BEFORE };
  return { moment: 'dopo', at: end };
}

/** The frame at or before a time of the case, and the one after (to move between them). */
function framesAt(frames: BenchFrame[], at: number): { a: number; b: number; f: number } {
  let a = 0;
  while (a + 1 < frames.length && frames[a + 1].t <= at) a++;
  const b = Math.min(frames.length - 1, a + 1);
  const span = frames[b].t - frames[a].t;
  return { a, b, f: span > 0 ? Math.min(1, Math.max(0, (at - frames[a].t) / span)) : 0 };
}

export class BenchView {
  readonly group = new THREE.Group();
  /** The wanderer and the things, in the order of the frames' positions. */
  private actors: THREE.Object3D[] = [];
  private cv = document.createElement('canvas');
  private tex: THREE.CanvasTexture;
  private drawn = '';
  /** Side of a tile of the scene, and where the scene's (0, 0) tile has its corner. */
  private s: number;
  private ox: number;
  private oz: number;

  constructor(
    it: StudioItem,
    readonly shown: BenchShown,
    private color: string,
    prev?: StudioItem,
    next?: StudioItem,
  ) {
    const w = it.w ?? 3, d = it.h ?? 3;
    const inner = Math.min(w, d) - 0.3;
    this.s = inner / BENCH;
    const half = Math.floor(BENCH / 2);
    this.ox = it.x + w / 2 - inner / 2 + half * this.s;
    this.oz = it.y + d / 2 - inner / 2 + half * this.s;
    // The tiles: solid ones raised (rock, walls, woods), water a little lower.
    const lit = new Builder();
    shown.scene.tiles.forEach((t, i) => {
      const x = this.ox + ((i % BENCH) - half) * this.s, z = this.oz + (Math.floor(i / BENCH) - half) * this.s;
      const top = t.layer === 'liquid' ? 0.01 : t.solid ? this.s * 0.55 : 0.03;
      lit.box(x + 0.01, BENCH_TOP, z + 0.01, x + this.s - 0.01, BENCH_TOP + top, z + this.s - 0.01, rgbOf(t.color));
    });
    this.group.add(new THREE.Mesh(lit.geometry(), MAT.corona));
    // The glass: four walls and a lid, faint.
    const glass = new THREE.MeshBasicMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
    const box = new THREE.Mesh(new THREE.BoxGeometry(w - 0.14, BENCH_GLASS, d - 0.14), glass);
    box.position.set(it.x + w / 2, BENCH_TOP + BENCH_GLASS / 2, it.y + d / 2);
    this.group.add(box);
    // The wanderer, then the things of the case.
    this.actors.push(this.figure(WANDERER, 0.3, true, false));
    for (const t of shown.scene.things) this.actors.push(this.figure(t.color, t.radius, t.person, t.fire));
    for (const a of this.actors) this.group.add(a);
    // The screen above the back of the case, leaning towards the camera.
    this.cv.width = Math.round(SCREEN.w * PX * 1.5);
    this.cv.height = Math.round(SCREEN.h * PX * 1.5);
    this.tex = new THREE.CanvasTexture(this.cv);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 4;
    const panel = new THREE.Group();
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(SCREEN.w + 0.08, SCREEN.h + 0.08, 0.06), BEZEL);
    bezel.position.set(0, SCREEN.h / 2, -0.035);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN.w, SCREEN.h), new THREE.MeshBasicMaterial({ map: this.tex, toneMapped: false }));
    face.position.set(0, SCREEN.h / 2, 0.001);
    panel.add(bezel, face);
    panel.position.set(it.x + w / 2, SCREEN.y, it.y + 0.15);
    panel.rotation.x = -TILT;
    this.group.add(panel);
    // Two thin posts hold it.
    const posts = new Builder();
    for (const px of [it.x + w / 2 - SCREEN.w / 2 + 0.1, it.x + w / 2 + SCREEN.w / 2 - 0.16]) posts.box(px, BENCH_TOP + BENCH_GLASS, it.y + 0.1, px + 0.06, SCREEN.y + 0.1, it.y + 0.16, rgbOf('#0c0c16'));
    this.group.add(new THREE.Mesh(posts.geometry(), MAT.corona));
    if (prev) this.group.add(arrowSign(prev.x, prev.y, '<', color));
    if (next) this.group.add(arrowSign(next.x, next.y, '>', color));
  }

  /** A person (a body and a head), a flame (glowing, two tongues) or a thing (a block as wide as its body). */
  private figure(color: string, radius: number, person: boolean, fire: boolean): THREE.Object3D {
    const s = this.s;
    const b = new Builder();
    const c = rgbOf(color);
    let mesh: THREE.Mesh;
    if (fire) {
      b.box(-0.18 * s, 0, -0.18 * s, 0.18 * s, 0.45 * s, 0.18 * s, c);
      b.box(-0.1 * s, 0.45 * s, -0.1 * s, 0.1 * s, 0.75 * s, 0.1 * s, rgbOf('#ffe08a'));
      mesh = new THREE.Mesh(b.geometry(), MAT.glow);
    } else if (person) {
      b.box(-0.18 * s, 0, -0.14 * s, 0.18 * s, 0.6 * s, 0.14 * s, c);
      b.box(-0.13 * s, 0.6 * s, -0.13 * s, 0.13 * s, 0.86 * s, 0.13 * s, rgbOf('#f2d2b0'));
      mesh = new THREE.Mesh(b.geometry(), MAT.corona);
    } else {
      const r = Math.min(0.45, Math.max(0.2, radius)) * s;
      b.box(-r, 0, -r, r, r * 1.5, r, c);
      mesh = new THREE.Mesh(b.geometry(), MAT.corona);
    }
    return mesh;
  }

  /** Moves the actors to time t of the loop and draws the screen when what it says changes. */
  update(t: number): void {
    const run = this.shown.run;
    const frames = run?.frames ?? [];
    if (!run || !frames.length) {
      // Not run yet (or it could not run): everyone where the case puts them, the screen says why.
      this.place(undefined);
      this.draw(undefined, 'prima', 0);
      return;
    }
    const { moment, at } = benchMoment(frames, t);
    const { a, b, f } = framesAt(frames, at);
    this.place((i) => {
      const p = frames[a].pos[i], q = frames[b].pos[i];
      if (!p) return null;
      return q ? [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f] : p;
    });
    this.draw(frames[f < 0.5 ? a : b], moment, a);
  }

  /** Where each actor is (scene coordinates, the wanderer's tile is (0, 0)); outside the case or gone, hidden. */
  private place(at?: (i: number) => [number, number] | null): void {
    const half = Math.floor(BENCH / 2);
    this.actors.forEach((m, i) => {
      const c = this.shown.entry.case;
      const start: [number, number] | null = i === 0 ? [0.5, 0.5] : c.cose?.[i - 1] ? [c.cose[i - 1].x + 0.5, c.cose[i - 1].y + 0.5] : null;
      const p = at ? at(i) : start;
      const inside = !!p && p[0] >= -half && p[0] <= half + 1 && p[1] >= -half && p[1] <= half + 1;
      m.visible = inside;
      if (p && inside) m.position.set(this.ox + p[0] * this.s, BENCH_TOP + 0.03, this.oz + p[1] * this.s);
    });
  }

  private draw(frame: BenchFrame | undefined, moment: BenchMoment, n: number): void {
    const run = this.shown.run;
    const key = `${moment}|${n}|${!!run}`;
    if (key === this.drawn) return;
    this.drawn = key;
    const g = this.cv.getContext('2d')!;
    const W = this.cv.width, H = this.cv.height;
    const { entry } = this.shown;
    const c = entry.case;
    g.fillStyle = DARK;
    g.fillRect(0, 0, W, H);
    g.strokeStyle = this.color;
    g.lineWidth = 3;
    g.strokeRect(3, 3, W - 6, H - 6);
    g.textBaseline = 'top';
    g.textAlign = 'left';
    // The moment, in a pill; the case and its system.
    const mc = MOMENT_COLOR[moment];
    g.font = 'bold 22px system-ui, sans-serif';
    const label = run ? MOMENT_NAME[moment] : 'IN PROVA…';
    const lw = g.measureText(label).width + 22;
    g.fillStyle = mc;
    g.shadowColor = mc;
    g.shadowBlur = 10;
    g.fillRect(14, 12, lw, 32);
    g.shadowBlur = 0;
    g.fillStyle = '#05050a';
    g.fillText(label, 25, 17);
    g.fillStyle = '#ffffff';
    g.font = 'bold 26px system-ui, sans-serif';
    g.fillText(fit(g, c.titolo, W - lw - 46), lw + 28, 14);
    g.font = '17px system-ui, sans-serif';
    g.fillStyle = DIM;
    g.fillText(fit(g, `${entry.name} · caso ${entry.of + 1} di ${entry.cases} · ${this.shown.index + 1}/${this.shown.count} sul banco`, W - 36), 16, 52);
    const errors = run?.errori ?? [];
    // The lines that make the case: lit while the rule runs.
    const lines = (c.righe?.length ? c.righe : []).slice(0, LINES);
    const lit = moment === 'regola';
    g.font = '19px monospace';
    lines.forEach((ln, i) => {
      const y = 84 + i * 26;
      if (lit) {
        g.fillStyle = 'rgba(255,207,92,0.14)';
        g.fillRect(12, y - 3, W * 0.6 - 10, 24);
      }
      g.fillStyle = lit ? '#ffcf5c' : 'rgba(255,255,255,0.4)';
      g.fillText(String(ln).padStart(3, ' '), 16, y);
      g.fillStyle = lit ? '#ffffff' : 'rgba(255,255,255,0.7)';
      g.fillText(fit(g, (this.shown.code[ln - 1] ?? '').trim(), W * 0.6 - 76), 66, y);
    });
    if (!lines.length) {
      g.fillStyle = DIM;
      g.fillText('(nessuna riga indicata)', 16, 84);
    }
    // What it watches: the value now, lit when it changed from before.
    const x0 = W * 0.62;
    g.font = '19px system-ui, sans-serif';
    c.guarda.slice(0, VALUES).forEach((path, i) => {
      const y = 82 + i * 40;
      const v = frame?.valori[path];
      const changed = run && frame && JSON.stringify(v) !== JSON.stringify(run.prima[path]);
      g.fillStyle = DIM;
      g.font = '15px system-ui, sans-serif';
      g.fillText(fit(g, fieldLabel(path, this.shown.scene), W - x0 - 20), x0, y);
      g.font = 'bold 20px system-ui, sans-serif';
      g.fillStyle = changed ? MOMENT_COLOR.dopo : '#ffffff';
      g.fillText(fit(g, run ? `${valueText(run.prima[path])}${changed ? ` → ${valueText(v)}` : ''}` : '…', W - x0 - 20), x0, y + 17);
    });
    if (errors.length) {
      // Why it does not show the system working, over the subtitle.
      g.fillStyle = DARK;
      g.fillRect(10, 48, W - 20, 26);
      g.font = 'bold 17px system-ui, sans-serif';
      g.fillStyle = '#ff3b3b';
      g.fillText(fit(g, `NON VA: ${errors[0]}`, W - 36), 16, 52);
    }
    this.tex.needsUpdate = true;
  }

  dispose(): void {
    this.tex.dispose();
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
  }
}
