// Canvas renderer. Everything is a glyph on a grid: terrain, beings, runes, the corona's code.
// Real space: the circle is centred at (0,0) and never moves. The carpet scrolls under it.

import type { Kernel, Chunk } from '../kernel/kernel';
import type { RuneComp } from '../kernel/runes';
import { applyGlitch, randomGlyph } from './glitch';

const FONT = '"Cascadia Mono", "JetBrains Mono", Consolas, "DejaVu Sans Mono", monospace';

const RUNE_STYLE = {
  gen: { bg: '#2e2306', edge: '#d8a83a', fg: '#ffe7a3' },
  player: { bg: '#062a33', edge: '#3fd6f0', fg: '#b8f6ff' },
  broken: { bg: '#3d070d', edge: '#ff4d5e', fg: '#ff9aa4' },
};

export class Renderer {
  cell = 18;
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private cache = new Map<string, { version: number; canvas: HTMLCanvasElement }>();
  private cam = { x: 0, y: 0 };
  private glitch = 0;
  private crack = 0;
  private t = 0;
  mouse: { x: number; y: number } | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private kernel: Kernel,
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    kernel.bus.on('universe:reloaded', () => this.cache.clear());
    canvas.addEventListener('mousemove', (e) => (this.mouse = { x: e.offsetX, y: e.offsetY }));
    canvas.addEventListener('mouseleave', () => (this.mouse = null));
  }

  resize(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = this.canvas.clientWidth;
    this.h = this.canvas.clientHeight;
    this.canvas.width = Math.floor(this.w * this.dpr);
    this.canvas.height = Math.floor(this.h * this.dpr);
    this.cell = this.w < 700 ? 14 : 18;
    this.kernel.view = { w: Math.ceil(this.w / this.cell) + 2, h: Math.ceil(this.h / this.cell) + 2 };
    this.cache.clear();
  }

  /** Screen → real-space coordinates. */
  toReal(sx: number, sy: number): { x: number; y: number } {
    return { x: (sx - this.w / 2) / this.cell + this.cam.x, y: (sy - this.h / 2) / this.cell + this.cam.y };
  }

  private sx(rx: number): number {
    return (rx - this.cam.x) * this.cell + this.w / 2;
  }

  private sy(ry: number): number {
    return (ry - this.cam.y) * this.cell + this.h / 2;
  }

  render(dt: number): void {
    const k = this.kernel;
    const ctx = this.ctx;
    const C = this.cell;
    this.t += dt;
    const p = k.playerPos();
    const follow = Math.min(1, dt * 10);
    this.cam.x += (p.x - this.cam.x) * follow;
    this.cam.y += (p.y - this.cam.y) * follow;

    // Glitch: driven by faults; a healthy world still cracks, rarely.
    const target = k.brokenness();
    this.glitch += (target - this.glitch) * Math.min(1, dt * 4);
    if (target === 0 && Math.random() < dt / 25) this.crack = 0.12;
    this.crack = Math.max(0, this.crack - dt);
    const g = Math.max(this.glitch, this.crack > 0 ? 0.25 : 0);

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#030406';
    ctx.fillRect(0, 0, this.w, this.h);
    if (g > 0.2) ctx.translate((Math.random() - 0.5) * 4 * g, (Math.random() - 0.5) * 3 * g);

    this.drawCorona();

    const R = k.config.circleRadius;
    const { ox, oy } = k.offset();
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.sx(0), this.sy(0), R * C, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#07090a';
    ctx.fillRect(0, 0, this.w, this.h);

    const S = k.config.chunkSize;
    for (const ch of k.chunks.values()) {
      const x = Math.round(this.sx(ch.cx * S - ox));
      const y = Math.round(this.sy(ch.cy * S - oy));
      if (x > this.w || y > this.h || x + S * C < 0 || y + S * C < 0) continue;
      ctx.drawImage(this.chunkCanvas(ch), x, y, S * C, S * C);
    }

    ctx.font = `${Math.round(C * 0.82)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    this.drawRunes(ox, oy, g);
    this.drawEntities(ox, oy, g);
    ctx.restore();

    // The rim of the world: invisible from the centre, it shows only when you get close.
    const d = Math.hypot(p.x, p.y);
    const near = Math.max(0, 1 - (R - d) / 14);
    if (near > 0) {
      ctx.strokeStyle = `rgba(120, 255, 180, ${0.15 + 0.5 * near})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(this.sx(0), this.sy(0), R * C, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    this.drawPlayer(g);
    this.drawHover();
    if (g > 0.05) this.drawCorruption(g);
    applyGlitch(ctx, this.canvas, g, this.dpr);
  }

  private chunkCanvas(ch: Chunk): HTMLCanvasElement {
    const cached = this.cache.get(ch.key);
    if (cached && cached.version === ch.version) return cached.canvas;
    const k = this.kernel;
    const S = k.config.chunkSize;
    const C = this.cell;
    const canvas = cached?.canvas ?? document.createElement('canvas');
    canvas.width = S * C * this.dpr;
    canvas.height = S * C * this.dpr;
    const c = canvas.getContext('2d')!;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.font = `${Math.round(C * 0.8)}px ${FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (let row = 0; row < S; row++) {
      for (let col = 0; col < S; col++) {
        const t = k.palette[ch.tiles[row * S + col]] ?? k.palette['?'];
        c.fillStyle = t.bg;
        c.fillRect(col * C, row * C, C, C);
        c.fillStyle = t.color;
        c.fillText(t.glyph, col * C + C / 2, row * C + C / 2 + 1);
      }
    }
    this.cache.set(ch.key, { version: ch.version, canvas });
    return canvas;
  }

  private drawRunes(ox: number, oy: number, g: number): void {
    const k = this.kernel;
    const ctx = this.ctx;
    const C = this.cell;
    const pulse = 0.75 + 0.25 * Math.sin(this.t * 3);
    for (const id of k.ecs.query('rune')) {
      const r: RuneComp = k.ecs.get(id, 'rune');
      const x0 = this.sx(r.col - ox);
      const y0 = this.sy(r.row - oy);
      if (x0 > this.w || y0 > this.h || x0 + r.token.length * C < 0 || y0 + C < 0) continue;
      const line = k.lineOfRune(id);
      const style = line?.error ? RUNE_STYLE.broken : RUNE_STYLE[r.source];
      const jitter = line?.error ? (Math.random() - 0.5) * 2 : 0;
      ctx.fillStyle = style.bg;
      ctx.fillRect(x0 + 1, y0 + 1, r.token.length * C - 2, C - 2);
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = style.edge;
      ctx.lineWidth = 1;
      ctx.strokeRect(x0 + 1.5, y0 + 1.5, r.token.length * C - 3, C - 3);
      ctx.globalAlpha = 1;
      ctx.fillStyle = style.fg;
      for (let i = 0; i < r.token.length; i++) {
        const ch = g > 0.3 && Math.random() < g * 0.05 ? randomGlyph() : r.token[i];
        ctx.fillText(ch, x0 + i * C + C / 2 + jitter, y0 + C / 2 + 1);
      }
    }
  }

  private drawEntities(ox: number, oy: number, g: number): void {
    const k = this.kernel;
    const ctx = this.ctx;
    const C = this.cell;
    for (const id of k.ecs.query('glyph', 'pos')) {
      if (id === k.playerId) continue;
      const p = k.ecs.get(id, 'pos');
      const gl = k.ecs.get(id, 'glyph');
      const x = this.sx(p.x - ox);
      const y = this.sy(p.y - oy);
      if (x < -C || y < -C || x > this.w + C || y > this.h + C) continue;
      ctx.fillStyle = '#000a';
      ctx.fillRect(x - C / 2 + 2, y - C / 2 + 2, C - 4, C - 4);
      ctx.fillStyle = gl.color;
      ctx.fillText(g > 0.4 && Math.random() < 0.1 ? randomGlyph() : String(gl.ch), x, y + 1);
    }
  }

  private drawPlayer(g: number): void {
    const k = this.kernel;
    const ctx = this.ctx;
    const C = this.cell;
    const p = k.playerPos();
    const gl = k.ecs.get(k.playerId, 'glyph') ?? { ch: '@', color: '#fff' };
    const x = this.sx(p.x);
    const y = this.sy(p.y);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.arc(x, y, C * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `bold ${Math.round(C * 0.95)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = gl.color;
    ctx.fillText(g > 0.5 && Math.random() < 0.15 ? randomGlyph() : gl.ch, x, y + 1);
    const f = k.playerComp()?.facing;
    const [dx, dy] = f === 'left' ? [-1, 0] : f === 'right' ? [1, 0] : f === 'up' ? [0, -1] : [0, 1];
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(x + dx * C * 0.62 - 1.5, y + dy * C * 0.62 - 1.5, 3, 3);
  }

  private drawCorona(): void {
    const k = this.kernel;
    const corona = k.corona;
    const C = this.cell;
    const halfW = this.w / 2 / C + 1;
    const halfH = this.h / 2 / C + 1;
    const camD = Math.hypot(this.cam.x, this.cam.y);
    if (camD + Math.hypot(halfW, halfH) < corona.radius) return;
    const ctx = this.ctx;
    ctx.font = `${Math.round(C * 0.72)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const p = k.playerPos();
    const here = corona.at(Math.floor(p.x), Math.floor(p.y));
    const x0 = Math.floor(this.cam.x - halfW);
    const y0 = Math.floor(this.cam.y - halfH);
    for (let y = y0; y < this.cam.y + halfH; y++) {
      for (let x = x0; x < this.cam.x + halfW; x++) {
        const cell = corona.at(x, y);
        if (!cell || cell.kind === 'empty') continue;
        const sameFile = here?.path && cell.path === here.path;
        let color: string;
        let ch = cell.ch;
        if (cell.kind === 'header') color = '#ffcf5c';
        else if (cell.kind === 'eof') color = '#ff4d5e';
        else if (ch === '\n') {
          ch = '↵';
          color = '#1c3a2a';
        } else color = sameFile ? '#7dffb0' : '#2f7a52';
        if (ch === ' ') continue;
        if (sameFile && here?.line === cell.line && cell.kind === 'code') {
          ctx.fillStyle = '#0f2e1f';
          ctx.fillRect(this.sx(x), this.sy(y), C, C);
          color = '#d6ffe6';
        }
        ctx.fillStyle = color;
        ctx.fillText(ch, this.sx(x) + C / 2, this.sy(y) + C / 2 + 1);
      }
    }
  }

  private drawHover(): void {
    if (!this.mouse) return;
    const r = this.toReal(this.mouse.x, this.mouse.y);
    const C = this.cell;
    const k = this.kernel;
    const { ox, oy } = k.offset();
    const inside = Math.hypot(r.x, r.y) < k.config.circleRadius;
    // Cells are aligned to the carpet inside the circle, to real space in the corona.
    const x = inside ? Math.floor(r.x + ox) - ox : Math.floor(r.x);
    const y = inside ? Math.floor(r.y + oy) - oy : Math.floor(r.y);
    this.ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(this.sx(x) + 0.5, this.sy(y) + 0.5, C - 1, C - 1);
  }

  private drawCorruption(g: number): void {
    const ctx = this.ctx;
    const C = this.cell;
    ctx.font = `${Math.round(C * 0.82)}px ${FONT}`;
    const n = Math.floor(g * 50);
    for (let i = 0; i < n; i++) {
      const x = Math.floor(Math.random() * (this.w / C)) * C;
      const y = Math.floor(Math.random() * (this.h / C)) * C;
      ctx.fillStyle = '#000';
      ctx.fillRect(x, y, C, C);
      ctx.fillStyle = Math.random() < 0.5 ? '#ff2a6d' : '#05d9e8';
      ctx.fillText(randomGlyph(), x + C / 2, y + C / 2 + 1);
    }
  }
}
