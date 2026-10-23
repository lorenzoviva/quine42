// A 2D layer over the 3D world, for what is text or interface rather than world: speech bubbles, the
// E over what you can use, signs, names of the Council's people, the outline of the tile under the
// mouse, the walkability map (V), and the glitch when the universe breaks.

import * as THREE from 'three';
import type { Kernel } from '../kernel/kernel';
import { ACTIVITY_ICON, type Activity } from '../kernel/society';
import { applyGlitch, randomGlyph } from './glitch';

const FONT = '"Cascadia Mono", "JetBrains Mono", Consolas, "DejaVu Sans Mono", monospace';

export class Overlay {
  readonly ctx: CanvasRenderingContext2D;
  w = 0;
  h = 0;
  dpr = 1;
  private v = new THREE.Vector3();

  constructor(
    readonly canvas: HTMLCanvasElement,
    private camera: THREE.Camera,
  ) {
    this.ctx = canvas.getContext('2d')!;
  }

  resize(w: number, h: number, dpr: number): void {
    [this.w, this.h, this.dpr] = [w, h, dpr];
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
  }

  begin(): void {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
  }

  /** Screen position of a point of the scene (real space x, height, z), or null behind the camera. */
  project(x: number, y: number, z: number): { x: number; y: number } | null {
    this.v.set(x, y, z).project(this.camera);
    if (this.v.z > 1) return null;
    return { x: (this.v.x * 0.5 + 0.5) * this.w, y: (-this.v.y * 0.5 + 0.5) * this.h };
  }

  /** The outline of a ground cell (real space). */
  cell(x: number, z: number, stroke: string, fill?: string, y = 0.02): void {
    const pts = [this.project(x, y, z), this.project(x + 1, y, z), this.project(x + 1, y, z + 1), this.project(x, y, z + 1)];
    if (pts.some((p) => !p)) return;
    const ctx = this.ctx;
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p!.x, p!.y) : ctx.moveTo(p!.x, p!.y)));
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /** A speech bubble over a point; `dark` for the Council's people. */
  bubble(x: number, y: number, z: number, text: string, dark = false): void {
    const p = this.project(x, y, z);
    if (!p) return;
    const ctx = this.ctx;
    ctx.font = `${dark ? 12 : 13}px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const lines: string[] = [];
    let cur = '';
    for (const w of text.split(/\s+/)) {
      if ((cur + ' ' + w).trim().length > 34) {
        lines.push(cur.trim());
        cur = w;
      } else cur += ' ' + w;
    }
    if (cur.trim()) lines.push(cur.trim());
    const shown = lines.slice(0, 4);
    const lh = dark ? 15 : 16;
    const bw = Math.max(...shown.map((l) => ctx.measureText(l).width)) + 16;
    const bh = shown.length * lh + 10;
    const bx = Math.min(Math.max(8, p.x - bw / 2), this.w - bw - 8);
    const by = p.y - bh - 6;
    ctx.fillStyle = dark ? 'rgba(16, 20, 18, 0.92)' : 'rgba(250, 244, 228, 0.95)';
    ctx.strokeStyle = dark ? 'rgba(160, 255, 200, 0.5)' : 'rgba(40, 30, 10, 0.9)';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 6);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x - 5, by + bh);
    ctx.lineTo(p.x, by + bh + 7);
    ctx.lineTo(p.x + 5, by + bh);
    ctx.fill();
    ctx.fillStyle = dark ? '#d6ffe6' : '#2a2010';
    shown.forEach((l, i) => ctx.fillText(l, bx + 8, by + 5 + i * lh));
  }

  /** A label in a colour (signs, names), centred over a point. */
  label(x: number, y: number, z: number, text: string, color: string, size = 12, glow = false): void {
    const p = this.project(x, y, z);
    if (!p || p.x < -200 || p.x > this.w + 200 || p.y < -50 || p.y > this.h + 50) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.font = `bold ${size}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(5, 6, 10, 0.75)';
    ctx.fillRect(p.x - tw / 2 - 5, p.y - size * 0.7, tw + 10, size * 1.4);
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
    }
    ctx.fillStyle = color;
    ctx.fillText(text, p.x, p.y + 1);
    ctx.restore();
  }

  /** The E over what is in front of the wanderer. */
  hint(x: number, y: number, z: number, key = 'E'): void {
    const p = this.project(x, y, z);
    if (!p) return;
    const ctx = this.ctx;
    ctx.font = `bold 14px ${FONT}`;
    ctx.fillStyle = 'rgba(3,6,5,0.85)';
    ctx.fillRect(p.x - 10, p.y - 10, 20, 20);
    ctx.strokeStyle = '#ffcf5c';
    ctx.strokeRect(p.x - 10, p.y - 10, 20, 20);
    ctx.fillStyle = '#ffcf5c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(key, p.x, p.y + 1);
  }

  /** What a person is doing, as a sign over the head. */
  activity(x: number, y: number, z: number, tipo: Activity, t: number): void {
    const icon = ACTIVITY_ICON[tipo];
    if (!icon) return;
    const p = this.project(x, y, z);
    if (!p) return;
    const ctx = this.ctx;
    ctx.font = `bold 13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 3);
    ctx.fillStyle = tipo === 'dorme' ? '#b8d0ff' : '#ffe7a3';
    ctx.fillText(icon, p.x + 10, p.y - 4 - (tipo === 'dorme' ? (t * 6) % 8 : 0));
    ctx.globalAlpha = 1;
  }

  /** Bottom-centre line of text (what E does here, in the studio). */
  caption(text: string): void {
    const ctx = this.ctx;
    ctx.font = `12px ${FONT}`;
    ctx.fillStyle = '#d6ffe6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, this.w / 2, this.h - 70);
  }

  title(text: string, color: string): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = `bold 15px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = color;
    ctx.fillText(text, this.w / 2, 14);
    ctx.restore();
  }

  /** When the universe breaks: torn, shifted, flickering, with stray glyphs. */
  glitch(source: HTMLCanvasElement, g: number): void {
    if (g <= 0.01) return;
    const ctx = this.ctx;
    if (g > 0.05) {
      const n = Math.floor(g * 40);
      ctx.font = `24px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < n; i++) {
        const x = Math.random() * this.w, y = Math.random() * this.h;
        ctx.fillStyle = '#000';
        ctx.fillRect(x - 14, y - 14, 28, 28);
        ctx.fillStyle = Math.random() < 0.5 ? '#ff2a6d' : '#05d9e8';
        ctx.fillText(randomGlyph(), x, y + 1);
      }
    }
    applyGlitch(ctx, source, g, this.dpr);
  }

  /** The wanderer's own sign of the broken world: a stray glyph instead of a label, sometimes. */
  static noisy(text: string, g: number): string {
    return g > 0.4 && Math.random() < 0.1 ? randomGlyph() : text;
  }

  /** For the walkability map: which cells near the wanderer block. */
  walkability(k: Kernel, r = 12): void {
    const pc = k.playerCarpet();
    const { ox, oy } = k.offset();
    for (let row = Math.floor(pc.y) - r; row <= pc.y + r; row++)
      for (let col = Math.floor(pc.x) - r; col <= pc.x + r; col++) {
        const t = k.palette[k.tileAt(col, row) ?? ''];
        if (t) this.cell(col - ox, row - oy, t.solid ? 'rgba(255,40,60,0.5)' : 'rgba(80,255,160,0.15)', t.solid ? 'rgba(255,40,60,0.3)' : undefined, k.groundAt(col, row) + 0.02);
      }
  }
}
