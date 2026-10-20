// Canvas renderer. The carpet is drawn from tiles: every terrain has a seamless texture (painted by
// the Artist, or procedural until then), aligned to world coordinates, so chunks join with no seams.
// What blocks is visible: obstacles are sprites standing on their cell, walls have a face, water a
// shore. Buildings have roofs that disappear when you walk in. Runes stay glowing code. The corona is
// drawn only once the carpet stops holding you.

import type { Chunk, Kernel } from '../kernel/kernel';
import { runeGlyph, type RuneComp } from '../kernel/runes';
import { ACTIVITY_ICON, type Activity } from '../kernel/society';
import type { TileDef } from '../kernel/types';
import { hash32 } from '../kernel/rng';
import { applyGlitch, randomGlyph } from './glitch';
import type { ImageCache } from './imagetools';

const FONT = '"Cascadia Mono", "JetBrains Mono", Consolas, "DejaVu Sans Mono", monospace';
/** Native resolution of chunk canvases, per tile. */
const T = 32;
/** A texture covers this many tiles before repeating. */
const TEX_TILES = 2;

const RUNE_STYLE = {
  gen: { bg: 'rgba(46, 35, 6, 0.88)', edge: '#ffcf5c', fg: '#ffe7a3' },
  player: { bg: 'rgba(6, 42, 51, 0.88)', edge: '#3fd6f0', fg: '#b8f6ff' },
  broken: { bg: 'rgba(61, 7, 13, 0.9)', edge: '#ff4d5e', fg: '#ff9aa4' },
};

const BLENDS = new Set(['ground', 'liquid', 'vegetation', 'rock', undefined]);

function rgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  const n = m ? parseInt(m[1], 16) : 0x808080;
  return [n >> 16, (n >> 8) & 255, n & 255];
}

function shade(hex: string, k: number): string {
  const [r, g, b] = rgb(hex);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}

type Sprite = HTMLImageElement | HTMLCanvasElement;

export class Renderer {
  cell = 40;
  showWalk = false;
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private chunkCache = new Map<string, { sig: string; canvas: HTMLCanvasElement }>();
  private procTex = new Map<string, HTMLCanvasElement>();
  private procObstacles = new Map<string, HTMLCanvasElement[]>();
  private motion = new Map<number, { x: number; y: number; dir: string; moving: number; phase: number }>();
  private cam = { x: 0, y: 0 };
  private glitch = 0;
  private crack = 0;
  private t = 0;
  /** Darkness layer (night) and the bursts of light of spells. */
  private dark?: HTMLCanvasElement;
  private flashes: Array<{ x: number; y: number; until: number }> = [];
  mouse: { x: number; y: number } | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private kernel: Kernel,
    private images: ImageCache,
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    kernel.bus.on('universe:reloaded', () => {
      this.chunkCache.clear();
      this.procTex.clear();
      this.procObstacles.clear();
    });
    // A new neighbour changes the transitions along the shared edge.
    kernel.bus.on('chunk:planned', ({ key }: { key: string }) => {
      const [cx, cy] = key.split(',').map(Number);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) this.chunkCache.delete(`${cx + dx},${cy + dy}`);
    });
    kernel.bus.on('spell:cast', ({ at }: { at: { x: number; y: number } }) => this.flashes.push({ x: at.x, y: at.y, until: this.t + 0.6 }));
    canvas.addEventListener('mousemove', (e) => (this.mouse = { x: e.offsetX, y: e.offsetY }));
    canvas.addEventListener('mouseleave', () => (this.mouse = null));
  }

  resize(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = this.canvas.clientWidth;
    this.h = this.canvas.clientHeight;
    this.canvas.width = Math.floor(this.w * this.dpr);
    this.canvas.height = Math.floor(this.h * this.dpr);
    this.cell = this.w < 700 ? 30 : 42;
    this.kernel.view = { w: Math.ceil(this.w / this.cell) + 2, h: Math.ceil(this.h / this.cell) + 2 };
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

    const target = k.brokenness();
    this.glitch += (target - this.glitch) * Math.min(1, dt * 4);
    // A faint crack only right at the edge of the world, as a hint (never in the middle of play).
    const edge = k.config.circleRadius - Math.hypot(k.playerPos().x, k.playerPos().y);
    if (target === 0 && edge < 3 && edge > 0 && Math.random() < dt / 8) this.crack = 0.08;
    this.crack = Math.max(0, this.crack - dt);
    const g = Math.max(this.glitch, this.crack > 0 ? 0.22 : 0);

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#030406';
    ctx.fillRect(0, 0, this.w, this.h);
    if (g > 0.2) ctx.translate((Math.random() - 0.5) * 4 * g, (Math.random() - 0.5) * 3 * g);

    // Inside a building of the studio: only the room (bigger inside than outside).
    if (k.zone === 'studio') {
      this.drawStudio(p, g);
      this.drawHover();
      applyGlitch(ctx, this.canvas, g, this.dpr);
      return;
    }

    const revealed = k.coronaRevealed();
    if (revealed) this.drawCorona();

    const R = k.config.circleRadius;
    const { ox, oy } = k.offset();
    ctx.save();
    if (revealed) {
      ctx.beginPath();
      ctx.arc(this.sx(0), this.sy(0), R * C, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = '#07090a';
      ctx.fillRect(0, 0, this.w, this.h);
    }

    const S = k.config.chunkSize;
    ctx.imageSmoothingEnabled = true;
    for (const ch of k.chunks.values()) {
      const x = Math.floor(this.sx(ch.cx * S - ox));
      const y = Math.floor(this.sy(ch.cy * S - oy));
      if (x > this.w || y > this.h || x + S * C < 0 || y + S * C < 0) continue;
      ctx.drawImage(this.chunkCanvas(ch), x, y, Math.ceil(S * C) + 1, Math.ceil(S * C) + 1);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    this.drawRunes(ox, oy, g);
    this.drawStanding(ox, oy, g);
    this.drawRoofs(ox, oy);
    if (this.showWalk) this.drawWalkability(ox, oy);
    if (k.zone === 'sim') this.drawLighting(ox, oy);
    ctx.restore();

    if (revealed) {
      const d = Math.hypot(p.x, p.y);
      const near = Math.max(0, 1 - (R - d) / 10);
      if (near > 0) {
        ctx.strokeStyle = `rgba(120, 255, 180, ${0.15 + 0.5 * near})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.arc(this.sx(0), this.sy(0), R * C, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    if (k.zone === 'corona') this.drawPlayer(k.ecs.get(k.playerId, 'glyph') ?? { ch: '@', color: '#fff', scale: 1.3 }, p, g);
    this.drawBubbles(ox, oy);
    this.drawHover();
    if (g > 0.05) this.drawCorruption(g);
    applyGlitch(ctx, this.canvas, g, this.dpr);
  }

  // --- Tiles -------------------------------------------------------------------------------------

  /** A small seamless texture from a colour, until (or unless) the Artist paints one. */
  private proceduralTexture(code: string, t: TileDef): HTMLCanvasElement {
    const cached = this.procTex.get(code);
    if (cached) return cached;
    const N = 64;
    const c = document.createElement('canvas');
    c.width = c.height = N;
    const ctx = c.getContext('2d')!;
    const [r, gg, b] = rgb(t.color);
    const img = ctx.createImageData(N, N);
    const seed = code.charCodeAt(0);
    // Value noise on a wrapping lattice: tileable by construction.
    const L = 8;
    const lat = (x: number, y: number) => (hash32(seed, ((x % L) + L) % L, ((y % L) + L) % L) % 1000) / 1000;
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const fx = (x / N) * L;
        const fy = (y / N) * L;
        const ix = Math.floor(fx);
        const iy = Math.floor(fy);
        const sx = fx - ix;
        const sy = fy - iy;
        const v = (lat(ix, iy) * (1 - sx) + lat(ix + 1, iy) * sx) * (1 - sy) + (lat(ix, iy + 1) * (1 - sx) + lat(ix + 1, iy + 1) * sx) * sy;
        const grain = (hash32(seed, x, y) % 100) / 100;
        const k = 0.82 + v * 0.28 + (grain - 0.5) * 0.1;
        const o = (y * N + x) * 4;
        img.data[o] = Math.min(255, r * k);
        img.data[o + 1] = Math.min(255, gg * k);
        img.data[o + 2] = Math.min(255, b * k);
        img.data[o + 3] = 255;
      }
    ctx.putImageData(img, 0, 0);
    if (t.layer === 'floor') {
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      for (let i = 0; i <= N; i += N / 4) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(N, i);
        ctx.stroke();
      }
    }
    this.procTex.set(code, c);
    return c;
  }

  private texture(code: string): { src: Sprite; size: number } {
    const t = this.kernel.palette[code] ?? this.kernel.palette['?'];
    const img = this.images.peek(t.texture);
    return img ? { src: img, size: img.width } : { src: this.proceduralTexture(code, t), size: 64 };
  }

  private pattern(ctx: CanvasRenderingContext2D, code: string, ox: number, oy: number): CanvasPattern | null {
    const tex = this.texture(code);
    const pat = ctx.createPattern(tex.src, 'repeat');
    if (!pat) return null;
    const scale = (TEX_TILES * T) / tex.size;
    pat.setTransform(new DOMMatrix().translate(-ox, -oy).scale(scale));
    return pat;
  }

  /** Signature of what a chunk canvas depends on: its tiles, its neighbours' edges, the textures. */
  private chunkSig(ch: Chunk): string {
    const k = this.kernel;
    const S = k.config.chunkSize;
    const edge = (dx: number, dy: number) => k.chunks.get(`${ch.cx + dx},${ch.cy + dy}`)?.version ?? -1;
    const tex = Object.values(k.palette).map((t) => (this.images.peek(t.texture) ? 1 : 0)).join('');
    return `${ch.version}|${edge(1, 0)}|${edge(-1, 0)}|${edge(0, 1)}|${edge(0, -1)}|${tex}|${S}`;
  }

  private chunkCanvas(ch: Chunk): HTMLCanvasElement {
    const sig = this.chunkSig(ch);
    const cached = this.chunkCache.get(ch.key);
    if (cached && cached.sig === sig) return cached.canvas;
    const k = this.kernel;
    const S = k.config.chunkSize;
    const canvas = cached?.canvas ?? document.createElement('canvas');
    canvas.width = canvas.height = S * T;
    const c = canvas.getContext('2d')!;
    const wx = ch.cx * S * T;
    const wy = ch.cy * S * T;
    const code = (col: number, row: number): string => {
      if (col >= 0 && row >= 0 && col < S && row < S) return ch.tiles[row * S + col];
      return k.tileAt(ch.cx * S + col, ch.cy * S + row) ?? ch.tiles[Math.min(S - 1, Math.max(0, row)) * S + Math.min(S - 1, Math.max(0, col))];
    };
    const tile = (cd: string) => k.palette[cd] ?? k.palette['?'];
    const order = Object.keys(k.palette);
    const prio = (cd: string) => {
      const t = tile(cd);
      return t.layer === 'liquid' ? -1 : order.indexOf(cd);
    };
    const pats = new Map<string, CanvasPattern | null>();
    const pat = (cd: string) => {
      if (!pats.has(cd)) pats.set(cd, this.pattern(c, cd, wx, wy));
      return pats.get(cd)!;
    };

    // Base layer.
    for (let row = 0; row < S; row++)
      for (let col = 0; col < S; col++) {
        const cd = code(col, row);
        const t = tile(cd);
        const base = t.layer === 'door' ? (Object.keys(k.palette).find((x) => k.palette[x].indoor) ?? cd) : cd;
        c.fillStyle = pat(base) ?? t.color;
        c.fillRect(col * T, row * T, T, T);
      }

    // Soft transitions between natural terrains: the higher one spills over a noisy edge.
    for (let row = 0; row < S; row++)
      for (let col = 0; col < S; col++) {
        const cd = code(col, row);
        if (!BLENDS.has(tile(cd).layer)) continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nd = code(col + dx, row + dy);
          if (nd === cd || !BLENDS.has(tile(nd).layer) || prio(nd) <= prio(cd)) continue;
          c.save();
          c.beginPath();
          const x0 = col * T;
          const y0 = row * T;
          const steps = 6;
          const depth = (i: number) => T * (0.18 + ((hash32(ch.cx * S + col, ch.cy * S + row, dx * 3 + dy, i) % 100) / 100) * 0.22);
          if (dx !== 0) {
            const ex = dx > 0 ? x0 + T : x0;
            c.moveTo(ex, y0);
            for (let i = 0; i <= steps; i++) c.lineTo(ex - dx * depth(i), y0 + (T * i) / steps);
            c.lineTo(ex, y0 + T);
          } else {
            const ey = dy > 0 ? y0 + T : y0;
            c.moveTo(x0, ey);
            for (let i = 0; i <= steps; i++) c.lineTo(x0 + (T * i) / steps, ey - dy * depth(i));
            c.lineTo(x0 + T, ey);
          }
          c.closePath();
          c.clip();
          c.fillStyle = pat(nd) ?? tile(nd).color;
          c.fillRect(x0, y0, T, T);
          c.restore();
        }
      }

    // Built things and water edges: crisp, readable.
    for (let row = 0; row < S; row++)
      for (let col = 0; col < S; col++) {
        const cd = code(col, row);
        const t = tile(cd);
        const x = col * T;
        const y = row * T;
        if (t.layer === 'wall') {
          // Three-quarter view: the top of the wall above, its front face below where nothing hides it.
          const below = tile(code(col, row + 1)).layer === 'wall';
          if (!below) {
            const top = y + T * 0.35;
            c.fillStyle = shade(t.color, 0.72);
            c.fillRect(x, top, T, T - (top - y));
            // Courses of stone or brick on the face.
            c.strokeStyle = 'rgba(0,0,0,0.28)';
            c.lineWidth = 1;
            for (let k = 0; k < 3; k++) {
              const yy = top + ((T - (top - y)) / 3) * k;
              c.beginPath();
              c.moveTo(x, yy);
              c.lineTo(x + T, yy);
              c.stroke();
              const off = k % 2 ? T / 2 : T / 4;
              c.beginPath();
              c.moveTo(x + off, yy);
              c.lineTo(x + off, yy + (T - (top - y)) / 3);
              c.stroke();
            }
            c.fillStyle = 'rgba(255,255,255,0.18)';
            c.fillRect(x, top, T, 2);
          } else {
            c.fillStyle = 'rgba(255,255,255,0.06)';
            c.fillRect(x, y, T, T);
          }
          c.strokeStyle = 'rgba(0,0,0,0.35)';
          c.lineWidth = 1;
          c.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1);
        } else if (t.layer === 'door') {
          c.fillStyle = shade(t.color, 0.7);
          c.fillRect(x + T * 0.15, y + T * 0.1, T * 0.7, T * 0.8);
          c.fillStyle = shade(t.color, 1.1);
          c.fillRect(x + T * 0.2, y + T * 0.15, T * 0.6, T * 0.7);
          c.fillStyle = '#2a1a08';
          c.fillRect(x + T * 0.62, y + T * 0.5, 3, 3);
        } else if (t.layer === 'liquid') {
          c.strokeStyle = 'rgba(230,245,255,0.22)';
          c.lineWidth = 1.5;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            if (tile(code(col + dx, row + dy)).layer === 'liquid') continue;
            c.beginPath();
            if (dx === 1) c.moveTo(x + T - 1, y), c.lineTo(x + T - 1, y + T);
            if (dx === -1) c.moveTo(x + 1, y), c.lineTo(x + 1, y + T);
            if (dy === 1) c.moveTo(x, y + T - 1), c.lineTo(x + T, y + T - 1);
            if (dy === -1) c.moveTo(x, y + 1), c.lineTo(x + T, y + 1);
            c.stroke();
          }
        }
        // Walls cast a short shadow on what lies below them.
        if (t.layer !== 'wall' && tile(code(col, row - 1)).layer === 'wall') {
          const grd = c.createLinearGradient(0, y, 0, y + T * 0.35);
          grd.addColorStop(0, 'rgba(0,0,0,0.35)');
          grd.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = grd;
          c.fillRect(x, y, T, T * 0.35);
        }
      }
    this.chunkCache.set(ch.key, { sig, canvas });
    return canvas;
  }

  /** Procedural obstacle sprites (offline, or until the Artist paints them). */
  private proceduralObstacles(code: string, t: TileDef): HTMLCanvasElement[] {
    const cached = this.procObstacles.get(code);
    if (cached) return cached;
    const out: HTMLCanvasElement[] = [];
    for (let v = 0; v < 2; v++) {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const x = c.getContext('2d')!;
      if (t.layer === 'vegetation') {
        x.fillStyle = 'rgba(0,0,0,0.25)';
        x.beginPath();
        x.ellipse(32, 54, 20, 7, 0, 0, Math.PI * 2);
        x.fill();
        x.fillStyle = '#5a3a1e';
        x.fillRect(28, 38, 8, 16);
        const blobs = v ? [[32, 26, 22], [20, 32, 13], [44, 32, 13]] : [[32, 24, 20], [24, 34, 14], [40, 34, 14], [32, 14, 12]];
        for (const [bx, by, br] of blobs) {
          x.fillStyle = shade(t.color, 0.85);
          x.beginPath();
          x.arc(bx, by, br, 0, Math.PI * 2);
          x.fill();
        }
        for (const [bx, by, br] of blobs) {
          x.fillStyle = shade(t.color, 1.25);
          x.beginPath();
          x.arc(bx - br * 0.3, by - br * 0.35, br * 0.45, 0, Math.PI * 2);
          x.fill();
        }
      } else {
        x.fillStyle = 'rgba(0,0,0,0.25)';
        x.beginPath();
        x.ellipse(32, 52, 22, 7, 0, 0, Math.PI * 2);
        x.fill();
        x.fillStyle = shade(t.color, 0.9);
        x.beginPath();
        const pts = v ? [[10, 50], [16, 26], [34, 16], [52, 24], [56, 50]] : [[12, 50], [20, 30], [40, 22], [54, 36], [50, 52]];
        x.moveTo(pts[0][0], pts[0][1]);
        for (const [px, py] of pts.slice(1)) x.lineTo(px, py);
        x.closePath();
        x.fill();
        x.fillStyle = shade(t.color, 1.25);
        x.beginPath();
        x.moveTo(pts[1][0] + 4, pts[1][1] + 4);
        x.lineTo(pts[2][0], pts[2][1] + 4);
        x.lineTo(pts[3][0] - 6, pts[3][1] + 4);
        x.closePath();
        x.fill();
      }
      out.push(c);
    }
    this.procObstacles.set(code, out);
    return out;
  }

  private obstacleSprite(code: string, wx: number, wy: number): Sprite | null {
    const t = this.kernel.palette[code];
    if (!t || (t.layer !== 'vegetation' && t.layer !== 'rock')) return null;
    const h = hash32(wx, wy, 31);
    const painted = (t.sprites ?? []).map((id) => this.images.peek(id)).filter((x): x is HTMLImageElement => !!x);
    if (painted.length) return painted[h % painted.length];
    const proc = this.proceduralObstacles(code, t);
    return proc[h % proc.length];
  }

  private drawWalkability(ox: number, oy: number): void {
    const k = this.kernel;
    const ctx = this.ctx;
    const C = this.cell;
    const x0 = Math.floor(this.cam.x + ox - this.w / 2 / C) - 1;
    const y0 = Math.floor(this.cam.y + oy - this.h / 2 / C) - 1;
    for (let y = y0; y < y0 + this.h / C + 3; y++)
      for (let x = x0; x < x0 + this.w / C + 3; x++) {
        const t = k.palette[k.tileAt(x, y) ?? ''];
        if (!t) continue;
        ctx.fillStyle = t.solid ? 'rgba(255,40,60,0.38)' : 'rgba(80,255,160,0.08)';
        ctx.fillRect(this.sx(x - ox), this.sy(y - oy), C, C);
      }
  }

  // --- Things standing on the map (y-sorted): obstacles, entities, the player ---------------------

  private drawStanding(ox: number, oy: number, g: number): void {
    const k = this.kernel;
    const ctx = this.ctx;
    const C = this.cell;
    type Item = { y: number; draw: () => void };
    const list: Item[] = [];
    // Obstacles of the visible cells.
    const x0 = Math.floor(this.cam.x + ox - this.w / 2 / C) - 1;
    const y0 = Math.floor(this.cam.y + oy - this.h / 2 / C) - 1;
    for (let y = y0; y < y0 + this.h / C + 4; y++)
      for (let x = x0; x < x0 + this.w / C + 3; x++) {
        const code = k.tileAt(x, y);
        if (!code) continue;
        const spr = this.obstacleSprite(code, x, y);
        if (!spr) continue;
        const big = k.palette[code].layer === 'vegetation' ? 1.35 : 1.05;
        const sx = this.sx(x - ox + 0.5);
        const sy = this.sy(y - oy + 1);
        list.push({ y: y + 1, draw: () => ctx.drawImage(spr, sx - (C * big) / 2, sy - C * big, C * big, C * big) });
      }

    // Entities.
    const pc = k.playerCarpet();
    let hint: { x: number; y: number; d: number } | null = null;
    const target = k.targetInFront();
    for (const id of k.ecs.query('glyph', 'pos')) {
      if (id === k.playerId) continue;
      const p = k.ecs.get(id, 'pos');
      const x = this.sx(p.x - ox);
      const y = this.sy(p.y - oy);
      if (x < -C * 2 || y < -C * 2 || x > this.w + C * 2 || y > this.h + C * 2) continue;
      const gl = k.ecs.get(id, 'glyph');
      const pickup = k.ecs.has(id, 'pickup');
      if (id === target) {
        const d = Math.hypot(p.x - pc.x, p.y - pc.y);
        hint = { x, y: y - C * (gl.scale ?? 1.1) * 0.9, d };
      }
      list.push({ y: p.y + (pickup ? -0.3 : 0), draw: () => this.drawSprite(id, gl, x, y, p, pickup, g) });
    }

    // The player.
    const pp = k.playerPos();
    const pgl = k.ecs.get(k.playerId, 'glyph') ?? { ch: '@', color: '#fff', scale: 1.3 };
    // Beyond the circle the world is clipped away: there the player is drawn on top, after the corona.
    if (k.zone === 'sim') list.push({ y: pc.y, draw: () => this.drawPlayer(pgl, pp, g) });

    list.sort((a, b) => a.y - b.y);
    for (const it of list) it.draw();

    if (hint) {
      ctx.font = `bold ${Math.round(C * 0.38)}px ${FONT}`;
      ctx.fillStyle = 'rgba(3,6,5,0.85)';
      ctx.fillRect(hint.x - C * 0.24, hint.y - C * 0.24, C * 0.48, C * 0.48);
      ctx.strokeStyle = '#ffcf5c';
      ctx.lineWidth = 1;
      ctx.strokeRect(hint.x - C * 0.24, hint.y - C * 0.24, C * 0.48, C * 0.48);
      ctx.fillStyle = '#ffcf5c';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('E', hint.x, hint.y + 1);
    }
  }

  /** Frame of an animated sprite: direction from the movement, frame from the walking phase. */
  private frameOf(id: number, gl: { sprite?: string; frames?: Record<string, string[]> }, p: { x: number; y: number }, dt = 1 / 60): Sprite | undefined {
    let m = this.motion.get(id);
    if (!m) this.motion.set(id, (m = { x: p.x, y: p.y, dir: 'down', moving: 0, phase: 0 }));
    const dx = p.x - m.x;
    const dy = p.y - m.y;
    const speed = Math.hypot(dx, dy);
    if (speed > 0.002) {
      m.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      m.moving = 0.15;
      m.phase += speed * 2.2;
    } else m.moving = Math.max(0, m.moving - dt);
    m.x = p.x;
    m.y = p.y;
    const base = this.images.peek(gl.sprite);
    // A frame much emptier or shorter than the standing sprite was cut badly: the standing one is better.
    const whole = (fid: string | undefined) => {
      const f = this.images.inkOf(fid);
      const b = this.images.inkOf(gl.sprite);
      return !!f && (!b || (f.ink >= b.ink * 0.5 && f.h >= b.h * 0.7));
    };
    const frames = gl.frames?.[m.dir];
    if (frames?.length && m.moving > 0) {
      const fid = frames[Math.floor(m.phase) % frames.length];
      const img = this.images.peek(fid);
      if (img && whole(fid)) return img;
    }
    if (frames?.length && m.dir !== 'down') {
      const fid = frames[1 % frames.length];
      const img = this.images.peek(fid);
      if (img && whole(fid)) return img;
    }
    return base;
  }


  /**
   * Every individual looks a little different from the others of their kind (same sprite): clothes
   * recoloured, a slightly different height. Stable per individual, cached per sprite and variant.
   */
  private variantOf(id: number): { tint: number; scale: number } | undefined {
    const k = this.kernel;
    if (!k.ecs.has(id, 'mind') && !k.ecs.has(id, 'identity')) return undefined;
    const who: string = k.ecs.get(id, 'identity')?.name ?? k.ecs.get(id, 'origin')?.key ?? String(id);
    let h = 2166136261;
    for (const ch of who) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
    return { tint: h % 7, scale: 0.93 + ((h >>> 8) % 13) / 100 };
  }

  private tinted = new WeakMap<CanvasImageSource, Map<number, HTMLCanvasElement>>();

  /** Variant 0 is the original; the others rotate the hue of saturated pixels that are not skin. */
  private tintedSprite(img: HTMLImageElement | HTMLCanvasElement, variant: number): CanvasImageSource {
    if (!variant) return img;
    let byVariant = this.tinted.get(img);
    if (!byVariant) this.tinted.set(img, (byVariant = new Map()));
    const hit = byVariant.get(variant);
    if (hit) return hit;
    const c = document.createElement('canvas');
    c.width = img instanceof HTMLImageElement ? img.naturalWidth : img.width;
    c.height = img instanceof HTMLImageElement ? img.naturalHeight : img.height;
    const x = c.getContext('2d', { willReadFrequently: true })!;
    x.drawImage(img, 0, 0);
    try {
      const data = x.getImageData(0, 0, c.width, c.height);
      const d = data.data;
      const shift = (variant * 51) % 360;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 30) continue;
        const [hh, ss, ll] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
        const skin = hh >= 8 && hh <= 48 && ss < 0.75 && ll > 0.3;
        if (ss < 0.25 || skin) continue;
        const [r, g, b] = hslToRgb((hh + shift) % 360, ss, ll);
        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
      }
      x.putImageData(data, 0, 0);
    } catch {
      return img;
    }
    byVariant.set(variant, c);
    return c;
  }

  /** A person doing their routine: a pose and a sign, cheap (no new images). */
  private drawActivity(img: CanvasImageSource, tipo: Activity, x: number, y: number, size: number, id: number): void {
    const ctx = this.ctx;
    const t = this.t + id * 0.37;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.36, size * 0.34, size * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    if (tipo === 'dorme') {
      // Lying down, breathing.
      ctx.translate(x, y + size * 0.1);
      ctx.rotate(-Math.PI / 2);
      ctx.scale(1, 1 + Math.sin(t * 1.5) * 0.02);
      ctx.drawImage(img, -size / 2, -size * 0.5, size, size);
    } else if (tipo === 'zappa' || tipo === 'taglia_legna' || tipo === 'lavora') {
      // Bending over the work, rhythmically.
      const bend = Math.max(0, Math.sin(t * 5)) * 0.12;
      ctx.translate(x, y + size * 0.38);
      ctx.rotate(bend);
      ctx.drawImage(img, -size / 2, -size, size, size);
    } else if (tipo === 'pesca' || tipo === 'legge' || tipo === 'mangia') {
      // Sitting: a little lower and still.
      ctx.drawImage(img, x - size / 2, y - size * 0.5, size, size * 0.9);
    } else {
      const bob = Math.sin(t * 2) * size * 0.02;
      ctx.drawImage(img, x - size / 2, y - size * 0.62 + bob, size, size);
    }
    ctx.restore();
    const icon = ACTIVITY_ICON[tipo];
    if (icon) {
      const C = this.cell;
      const rise = tipo === 'dorme' ? ((t * 0.6) % 1) : 0;
      ctx.globalAlpha = tipo === 'dorme' ? 1 - rise : 0.9;
      ctx.font = `bold ${Math.round(C * 0.32)}px ${FONT}`;
      ctx.fillStyle = tipo === 'dorme' ? '#cfe3ff' : '#ffe7a3';
      ctx.textAlign = 'center';
      ctx.fillText(icon, x + size * 0.32, y - size * 0.55 - rise * C * 0.6);
      if (tipo === 'zappa' || tipo === 'taglia_legna') {
        // Earth or chips flying at each stroke.
        const s = Math.sin(t * 5);
        if (s > 0.85) {
          ctx.fillStyle = tipo === 'zappa' ? '#6e5434' : '#c8a060';
          for (let k = 0; k < 3; k++) ctx.fillRect(x + (k - 1) * 4 + s * 3, y + size * 0.3 - k * 3, 2, 2);
        }
      }
      if (tipo === 'pesca') {
        ctx.strokeStyle = 'rgba(230,230,230,0.7)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.2, y - size * 0.3);
        ctx.quadraticCurveTo(x + size * 0.8, y - size * 0.6, x + size * 0.9, y + size * 0.2 + Math.sin(t * 3) * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  private drawSprite(id: number, gl: any, x: number, y: number, p: { x: number; y: number }, pickup: boolean, g: number): void {
    const ctx = this.ctx;
    const C = this.cell;
    const v = pickup ? undefined : this.variantOf(id);
    const size = C * (gl.scale ?? 1.1) * (v?.scale ?? 1);
    const raw = pickup ? this.images.peek(gl.sprite) : this.frameOf(id, gl, p);
    const img = raw && v ? this.tintedSprite(raw, v.tint) : raw;
    // What they are doing, seen: lying in bed, bending over the hoe, sitting on the bank.
    const att: { tipo?: Activity; ferma?: boolean } | undefined = pickup ? undefined : this.kernel.ecs.get(id, 'attivita');
    if (img && att?.ferma && att.tipo && !(g > 0.4 && Math.random() < 0.08)) return this.drawActivity(img, att.tipo, x, y, size, id);
    const bob = pickup ? Math.sin(this.t * 3 + id) * C * 0.04 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.36, size * 0.3, size * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();
    if (img && !(g > 0.4 && Math.random() < 0.08)) ctx.drawImage(img, x - size / 2, y - size * 0.62 + bob, size, size);
    else {
      ctx.fillStyle = pickup ? 'rgba(20,20,20,0.6)' : 'rgba(0,0,0,0.55)';
      ctx.beginPath();
      ctx.arc(x, y + bob, size * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = gl.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = `${Math.round(size * 0.55)}px ${FONT}`;
      ctx.fillStyle = gl.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(g > 0.4 && Math.random() < 0.1 ? randomGlyph() : String(gl.ch), x, y + 1 + bob);
    }
  }

  private drawPlayer(gl: any, p: { x: number; y: number }, g: number): void {
    const k = this.kernel;
    const ctx = this.ctx;
    const C = this.cell;
    const x = this.sx(p.x);
    const y = this.sy(p.y);
    const size = C * (gl.scale ?? 1.3);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.34, size * 0.28, size * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    const img = this.frameOf(k.playerId, gl, k.playerCarpet());
    if (img && !(g > 0.5 && Math.random() < 0.15)) ctx.drawImage(img, x - size / 2, y - size * 0.62, size, size);
    else {
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.beginPath();
      ctx.arc(x, y, size * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `bold ${Math.round(size * 0.68)}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = gl.color;
      ctx.fillText(g > 0.5 && Math.random() < 0.15 ? randomGlyph() : gl.ch, x, y + 1);
    }
    const f = k.playerComp()?.facing;
    const [dx, dy] = f === 'left' ? [-1, 0] : f === 'right' ? [1, 0] : f === 'up' ? [0, -1] : [0, 1];
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(x + dx * size * 0.5, y + dy * size * 0.5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    const inv = k.inventory();
    const held = inv.equipped !== null ? inv.slots[inv.equipped]?.item : undefined;
    if (held) {
      const info = k.itemInfo(held);
      const himg = this.images.peek(info.sprite);
      const hs = C * 0.5;
      const hx = x + size * 0.36;
      const hy = y + size * 0.02;
      if (himg) ctx.drawImage(himg, hx - hs / 2, hy - hs / 2, hs, hs);
      else {
        ctx.font = `${Math.round(hs * 0.8)}px ${FONT}`;
        ctx.fillStyle = info.color;
        ctx.fillText(info.glyph, hx, hy);
      }
    }
  }

  /** Roofs cover buildings, except the one you are in. */
  /**
   * Roofs in three-quarter view: the roof rises above the building (shifted up), its front slope (the
   * one facing the camera) larger and lit, the back slope narrow and darker, eaves along the front;
   * under the eaves the front wall of the building stays visible (doors included). Hidden when you
   * are inside.
   */
  private drawRoofs(ox: number, oy: number): void {
    const k = this.kernel;
    const ctx = this.ctx;
    const C = this.cell;
    const S = k.config.chunkSize;
    const pc = k.playerCarpet();
    const inside = k.buildingAt(pc.x, pc.y)?.building;
    const roof = k.terrain?.manifest.roof ?? { color: '#9a4632' };
    const roofImg = this.images.peek(roof.texture);
    const pat = roofImg ? ctx.createPattern(roofImg, 'repeat') : null;
    const lift = C * 0.7;
    for (const ch of k.chunks.values()) {
      for (const b of ch.buildings) {
        if (b === inside) continue;
        const x = this.sx(ch.cx * S + b.x0 - ox);
        const y = this.sy(ch.cy * S + b.y0 - oy);
        const w = (b.x1 - b.x0 + 1) * C;
        // The front row of the building (its facade, with the doors) stays visible under the eaves.
        const h = (b.y1 - b.y0) * C + C * 0.35;
        if (x > this.w || y > this.h || x + w < 0 || y + h < -lift) continue;
        const top = y - lift;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(x + C * 0.12, top + C * 0.25, w, h + lift * 0.6);
        if (pat) {
          pat.setTransform(new DOMMatrix().translate(x, top).scale(C / (roofImg!.width / 2)));
          ctx.fillStyle = pat;
        } else ctx.fillStyle = roof.color;
        ctx.fillRect(x, top, w, h);
        // Back slope (narrow, darker) and front slope (wide, lit), split by the ridge.
        const ridge = top + h * 0.33;
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(x, top, w, ridge - top);
        const grd = ctx.createLinearGradient(0, ridge, 0, top + h);
        grd.addColorStop(0, 'rgba(255,255,255,0.16)');
        grd.addColorStop(1, 'rgba(0,0,0,0.12)');
        ctx.fillStyle = grd;
        ctx.fillRect(x, ridge, w, top + h - ridge);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(x, ridge - 1, w, 2);
        // Eaves: a dark band along the front edge of the roof.
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(x - 2, top + h - C * 0.14, w + 4, C * 0.14);
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, top + 1, w - 2, h - 2);
      }
    }
  }

  // --- Runes, bubbles, corona, hover, glitch -------------------------------------------------------

  private drawRunes(ox: number, oy: number, g: number): void {
    const k = this.kernel;
    const ctx = this.ctx;
    const C = this.cell;
    const pulse = 0.7 + 0.3 * Math.sin(this.t * 3);
    for (const id of k.ecs.query('rune')) {
      const r: RuneComp = k.ecs.get(id, 'rune');
      const x0 = this.sx(r.col - ox);
      const y0 = this.sy(r.row - oy);
      if (x0 > this.w || y0 > this.h || x0 + C < 0 || y0 + C < 0) continue;
      const line = k.lineOfRune(id);
      const magic = k.content.runes[r.token];
      const look = runeGlyph(r.token, magic);
      const style = line?.error ? RUNE_STYLE.broken : RUNE_STYLE[r.source];
      const edge = !line?.error && look.color ? look.color : style.edge;
      const jitter = line?.error ? (Math.random() - 0.5) * 2 : 0;
      const pad = C * 0.1;
      const cx = x0 + C / 2 + jitter;
      // A carved stone: rounded, glowing in the rune's colour.
      ctx.fillStyle = style.bg;
      ctx.beginPath();
      ctx.roundRect(x0 + pad, y0 + pad, C - pad * 2, C - pad * 2, C * 0.18);
      ctx.fill();
      ctx.globalAlpha = pulse;
      ctx.shadowColor = edge;
      ctx.shadowBlur = magic ? 14 : 8;
      ctx.strokeStyle = edge;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.fillStyle = look.color && !line?.error ? look.color : style.fg;
      const glyph = g > 0.3 && Math.random() < g * 0.05 ? randomGlyph() : look.glyph;
      const big = look.glyph.length > 1 ? 0.42 : 0.56;
      ctx.font = `bold ${Math.round(C * big)}px ${FONT}`;
      ctx.fillText(glyph, cx, y0 + C * (look.label ? 0.42 : 0.52));
      if (look.label) {
        const size = Math.max(7, Math.min(C * 0.24, (C * 1.5) / look.label.length));
        ctx.font = `${Math.round(size)}px ${FONT}`;
        ctx.fillStyle = style.fg;
        ctx.globalAlpha = 0.85;
        ctx.fillText(look.label, cx, y0 + C * 0.78);
        ctx.globalAlpha = 1;
      }
    }
  }

  /**
   * Night: the world darkens with the hour; lights (lanterns, fires, spells, a lamp you carry) open
   * holes in the dark. Drawn on its own canvas, then over the world.
   */
  private drawLighting(ox: number, oy: number): void {
    const k = this.kernel;
    const dark = (1 - k.daylight()) * 0.82;
    this.flashes = this.flashes.filter((f) => f.until > this.t);
    if (dark < 0.02 && !this.flashes.length) return;
    const C = this.cell;
    if (!this.dark) this.dark = document.createElement('canvas');
    const c = this.dark;
    if (c.width !== this.canvas.width || c.height !== this.canvas.height) [c.width, c.height] = [this.canvas.width, this.canvas.height];
    const d = c.getContext('2d')!;
    d.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    d.globalCompositeOperation = 'source-over';
    d.clearRect(0, 0, this.w, this.h);
    d.fillStyle = `rgba(6, 10, 32, ${dark})`;
    d.fillRect(0, 0, this.w, this.h);
    d.globalCompositeOperation = 'destination-out';
    const hole = (x: number, y: number, r: number, strength = 1) => {
      const gr = d.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(0,0,0,${strength})`);
      gr.addColorStop(0.55, `rgba(0,0,0,${strength * 0.75})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      d.fillStyle = gr;
      d.fillRect(x - r, y - r, r * 2, r * 2);
    };
    const pp = k.playerPos();
    const px = this.sx(pp.x);
    const py = this.sy(pp.y);
    // You always see a little around yourself.
    hole(px, py, C * 2.2, 0.55);
    const glow: Array<[number, number, number, string]> = [];
    for (const id of k.ecs.query('luce')) {
      const l = k.ecs.get(id, 'luce');
      if (!l?.accesa) continue;
      const r = (Number(l.raggio) || 4) * C;
      if (id === k.playerId) {
        hole(px, py, r);
        continue;
      }
      const p = k.ecs.get(id, 'pos');
      if (!p) continue;
      const x = this.sx(p.x - ox);
      const y = this.sy(p.y - oy);
      if (x < -r || y < -r || x > this.w + r || y > this.h + r) continue;
      hole(x, y, r * (0.94 + 0.06 * Math.sin(this.t * 9 + id)));
      if (l.colore) glow.push([x, y, r, l.colore]);
    }
    for (const f of this.flashes) hole(this.sx(f.x - ox), this.sy(f.y - oy), C * 3 * ((f.until - this.t) / 0.6), 1);
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(c, 0, 0);
    ctx.restore();
    // Warm light where fires and spells shine.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const [x, y, r, col] of glow) {
      const gr = ctx.createRadialGradient(x, y, 0, x, y, r * 0.6);
      gr.addColorStop(0, `${col}33`);
      gr.addColorStop(1, `${col}00`);
      ctx.fillStyle = gr;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.restore();
  }

  private drawBubbles(ox: number, oy: number): void {
    const k = this.kernel;
    const ctx = this.ctx;
    const C = this.cell;
    ctx.font = `13px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    for (const [id, b] of k.bubbles) {
      const p = k.ecs.get(id, 'pos');
      if (!p) continue;
      const x = this.sx(p.x - ox);
      const y = this.sy(p.y - oy) - C * 1.1;
      const words = b.text.split(/\s+/);
      const lines: string[] = [];
      let cur = '';
      for (const w of words) {
        if ((cur + ' ' + w).trim().length > 34) {
          lines.push(cur.trim());
          cur = w;
        } else cur += ' ' + w;
      }
      if (cur.trim()) lines.push(cur.trim());
      const shown = lines.slice(0, 4);
      const bw = Math.max(...shown.map((l) => ctx.measureText(l).width)) + 16;
      const bh = shown.length * 16 + 10;
      const bx = Math.min(Math.max(8, x - bw / 2), this.w - bw - 8);
      const by = y - bh;
      ctx.fillStyle = 'rgba(250, 244, 228, 0.95)';
      ctx.strokeStyle = 'rgba(40, 30, 10, 0.9)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 6);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 5, by + bh);
      ctx.lineTo(x, by + bh + 7);
      ctx.lineTo(x + 5, by + bh);
      ctx.fill();
      ctx.fillStyle = '#2a2010';
      shown.forEach((l, i) => ctx.fillText(l, bx + 8, by + 5 + i * 16));
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
  }

  /**
   * The corona as an archive: each folder a room of the ring with its own floor and a sign; each file
   * an object (book, crystal, scroll, tablet); the Council walking among them.
   */
  /**
   * The corona seen from outside: the campus of the studio on the ring — lawns and a walkway, one
   * building per folder with its roof in the folder's colour, a sign and a door; the Referente.
   */
  private drawCorona(): void {
    const k = this.kernel;
    const corona = k.corona;
    const C = this.cell;
    const halfW = this.w / 2 / C + 1;
    const halfH = this.h / 2 / C + 1;
    const camD = Math.hypot(this.cam.x, this.cam.y);
    if (camD + Math.hypot(halfW, halfH) < corona.radius) return;
    const ctx = this.ctx;
    const x0 = Math.floor(this.cam.x - halfW);
    const y0 = Math.floor(this.cam.y - halfH);
    const R = corona.radius;
    const p = k.playerPos();
    const near = corona.doorNear(p.x, p.y);
    for (let y = y0; y < this.cam.y + halfH; y++) {
      for (let x = x0; x < this.cam.x + halfW; x++) {
        const cell = corona.at(x, y);
        if (!cell) continue;
        const b = corona.building(cell.building);
        const sx = this.sx(x);
        const sy = this.sy(y);
        const d = Math.hypot(x + 0.5, y + 0.5);
        if (cell.kind === 'floor') {
          // Neon-punk campus: a dark walkway with a glowing line along the circle, dark ground beyond.
          const walk = d < R + 2.6;
          ctx.fillStyle = walk ? ((x + y) & 1 ? '#11121b' : '#0e0f17') : (x * 7 + y * 3) % 5 ? '#0a0d12' : '#0c1016';
          ctx.fillRect(sx, sy, C + 0.5, C + 0.5);
          if (walk && Math.abs(d - (R + 1.3)) < 0.5) {
            ctx.fillStyle = `rgba(5, 217, 232, ${0.25 + 0.15 * Math.sin(this.t * 2 + x * 0.3 + y * 0.3)})`;
            ctx.fillRect(sx, sy + C * 0.45, C + 0.5, 2);
          }
        } else if (cell.kind === 'building' && b) {
          // Dark towers with neon edges in the building's colour.
          ctx.fillStyle = (x + y) & 1 ? '#15151f' : '#121219';
          ctx.fillRect(sx, sy, C + 0.5, C + 0.5);
          const edge = (dx: number, dy: number) => corona.at(x + dx, y + dy)?.kind !== 'building';
          ctx.save();
          ctx.shadowColor = b.color;
          ctx.shadowBlur = 10;
          ctx.strokeStyle = b.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          if (edge(0, -1)) (ctx.moveTo(sx, sy), ctx.lineTo(sx + C, sy));
          if (edge(0, 1)) (ctx.moveTo(sx, sy + C), ctx.lineTo(sx + C, sy + C));
          if (edge(-1, 0)) (ctx.moveTo(sx, sy), ctx.lineTo(sx, sy + C));
          if (edge(1, 0)) (ctx.moveTo(sx + C, sy), ctx.lineTo(sx + C, sy + C));
          ctx.stroke();
          ctx.restore();
          if ((x * 13 + y * 7) % 9 === 0) {
            ctx.fillStyle = `${b.color}${Math.sin(this.t * 3 + x) > 0 ? '88' : '33'}`;
            ctx.fillRect(sx + C * 0.35, sy + C * 0.35, C * 0.3, C * 0.3);
          }
        } else if (cell.kind === 'door' && b) {
          ctx.fillStyle = '#0e0f17';
          ctx.fillRect(sx, sy, C + 0.5, C + 0.5);
          ctx.save();
          ctx.shadowColor = '#ff2a6d';
          ctx.shadowBlur = 14;
          ctx.fillStyle = '#1a0a14';
          ctx.fillRect(sx + C * 0.15, sy, C * 0.7, C * 0.8);
          ctx.strokeStyle = '#ff2a6d';
          ctx.strokeRect(sx + C * 0.15, sy, C * 0.7, C * 0.8);
          ctx.restore();
          if (near === b) {
            ctx.strokeStyle = '#ffcf5c';
            ctx.lineWidth = 2;
            ctx.strokeRect(sx + 1, sy + 1, C - 2, C - 2);
          }
        }
      }
    }
    // Signs over the doors.
    for (const b of corona.buildings) {
      const sx = this.sx(b.door.x);
      const sy = this.sy(b.door.y);
      if (sx < -C * 6 || sy < -C * 3 || sx > this.w + C * 6 || sy > this.h + C * 3) continue;
      this.drawSign(b.floors.length > 1 ? `${b.name} (${b.floors.length} piani)` : b.name, sx, sy - C * 0.6, b.color);
    }
    this.drawAvatars();
  }

  /**
   * Inside a building of the studio, neon-punk: a dark floor with a glowing grid, neon strips on the
   * walls in the room's colour, holographic racks of files, frames and swatches, a wall of screens
   * with the room's history, teleport pads; in the Council's hall the round table with the universe
   * turning on its circular screen. Each room has its own motif. What changed lately glows.
   */
  private drawStudio(p: { x: number; y: number }, g: number): void {
    const k = this.kernel;
    const ctx = this.ctx;
    const C = this.cell;
    const room = k.corona.roomAt(p.x, p.y);
    if (!room) return;
    const { floor, building } = room;
    const col = building.color;
    const recent = k.recentChanges();
    const near = k.corona.itemNear(p.x, p.y);
    const X = (x: number) => this.sx(floor.ox + x);
    const Y = (y: number) => this.sy(floor.oy + y);
    // Floor: near-black, a neon grid, a slow light sweeping across.
    ctx.fillStyle = '#07070f';
    ctx.fillRect(X(0), Y(0), C * 24, C * 15);
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;
    for (let x = 1; x < 24; x++) {
      ctx.beginPath();
      ctx.moveTo(X(x), Y(1));
      ctx.lineTo(X(x), Y(14));
      ctx.stroke();
    }
    for (let y = 1; y < 15; y++) {
      ctx.beginPath();
      ctx.moveTo(X(1), Y(y));
      ctx.lineTo(X(23), Y(y));
      ctx.stroke();
    }
    const sweep = ((this.t * 0.15) % 1) * 24;
    const gr = ctx.createLinearGradient(X(sweep - 3), 0, X(sweep + 3), 0);
    gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(0.5, `${col}33`);
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = gr;
    ctx.fillRect(X(1), Y(1), C * 22, C * 13);
    ctx.restore();
    this.drawMotif(building.id, X(0), Y(0), C, col);
    // Walls: dark metal with a neon strip.
    ctx.fillStyle = '#12121c';
    ctx.fillRect(X(0), Y(0), C * 24, C);
    ctx.fillRect(X(0), Y(14), C * 24, C);
    ctx.fillRect(X(0), Y(0), C, C * 15);
    ctx.fillRect(X(23), Y(0), C, C * 15);
    ctx.save();
    ctx.shadowColor = col;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.strokeRect(X(1) - 1, Y(1) - 1, C * 22 + 2, C * 13 + 2);
    ctx.strokeStyle = '#ff2a6d';
    ctx.globalAlpha = 0.5;
    ctx.strokeRect(X(0) + 3, Y(0) + 3, C * 24 - 6, C * 15 - 6);
    ctx.restore();
    // Holographic racks under the rows of files, frames and swatches.
    const shelfItems = floor.items.filter((i) => i.kind === 'file' || i.kind === 'sprite' || i.kind === 'tile');
    for (const y of new Set(shelfItems.map((i) => i.y))) {
      const xs = shelfItems.filter((i) => i.y === y).map((i) => i.x);
      const a0 = Math.min(...xs);
      const a1 = Math.max(...xs);
      ctx.save();
      ctx.fillStyle = 'rgba(20, 24, 40, 0.9)';
      ctx.fillRect(this.sx(a0) - 3, this.sy(y) + C * 0.68, (a1 - a0 + 1) * C + 6, C * 0.18);
      ctx.shadowColor = col;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(this.sx(a0) - 3, this.sy(y) + C * 0.68, (a1 - a0 + 1) * C + 6, C * 0.18);
      ctx.restore();
    }
    for (const it of floor.items) {
      const sx = this.sx(it.x);
      const sy = this.sy(it.y);
      const isNear = it === near;
      const changed = it.path ? recent.get(it.path) : undefined;
      if (changed && (it.kind === 'file' || it.kind === 'sprite' || it.kind === 'tile')) {
        const pulse = 0.5 + 0.5 * Math.sin(this.t * 4);
        ctx.fillStyle = `rgba(255, 220, 120, ${0.2 + 0.25 * pulse})`;
        ctx.fillRect(sx - 3, sy - 3, C + 6, C + 6);
      }
      switch (it.kind) {
        case 'file':
          this.drawFile(it.look ?? 'tavoletta', sx, sy, col, isNear);
          break;
        case 'sprite':
        case 'tile': {
          const img = this.images.peek(it.asset);
          ctx.save();
          ctx.shadowColor = col;
          ctx.shadowBlur = isNear ? 16 : 6;
          ctx.strokeStyle = col;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(sx + 2, sy + 2, C - 4, C - 4);
          ctx.restore();
          ctx.fillStyle = it.kind === 'tile' ? (it.color ?? '#888') : '#0c0c16';
          ctx.fillRect(sx + 4, sy + 4, C - 8, C - 8);
          if (img) ctx.drawImage(img, sx + 4, sy + 4, C - 8, C - 8);
          else if (it.kind === 'sprite') {
            ctx.fillStyle = col;
            ctx.font = `${Math.round(C * 0.4)}px ${FONT}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', sx + C / 2, sy + C / 2);
          }
          break;
        }
        case 'screen':
          this.drawHistoryScreen(sx, sy, (it.w ?? 1) * C, C, col, building.id);
          break;
        case 'atlas':
          this.drawAtlasTable(sx, sy, (it.w ?? 1) * C, C, col);
          break;
        case 'portal':
          this.drawPortal(sx, sy, it.target ? (k.corona.building(it.target)?.color ?? col) : '#ffffff', isNear);
          break;
        case 'table':
          this.drawCouncilTable(X(12), Y(8.5), C);
          break;
        case 'desk':
          // A glowing pad on the floor where someone of the team works.
          ctx.save();
          ctx.globalAlpha = 0.6;
          ctx.strokeStyle = col;
          ctx.beginPath();
          ctx.ellipse(sx + C / 2, sy + C * 0.75, C * 0.4, C * 0.14, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          break;
        case 'up':
        case 'down':
          ctx.save();
          ctx.shadowColor = '#05d9e8';
          ctx.shadowBlur = 10;
          ctx.strokeStyle = '#05d9e8';
          for (let i = 0; i < 4; i++) ctx.strokeRect(sx + 2 + i * 2, sy + 2 + i * (C / 4.5), C - 4 - i * 4, C / 5);
          ctx.restore();
          ctx.fillStyle = '#05d9e8';
          ctx.font = `bold ${Math.round(C * 0.4)}px ${FONT}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(it.kind === 'up' ? '↑' : '↓', sx + C / 2, sy + C / 2);
          break;
        case 'exit':
          ctx.save();
          ctx.shadowColor = '#ff2a6d';
          ctx.shadowBlur = 12;
          ctx.fillStyle = '#1a0a14';
          ctx.fillRect(sx + C * 0.1, sy, C * 0.8, C);
          ctx.strokeStyle = '#ff2a6d';
          ctx.strokeRect(sx + C * 0.1, sy, C * 0.8, C);
          ctx.restore();
          break;
      }
      if (isNear && !['file', 'sprite', 'tile', 'table'].includes(it.kind)) {
        ctx.strokeStyle = '#ffcf5c';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx + 1, sy + 1, (it.w ?? 1) * C - 2, C - 2);
      }
    }
    ctx.save();
    ctx.font = `bold 15px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = col;
    ctx.shadowBlur = 12;
    ctx.fillStyle = col;
    ctx.fillText(`${building.name.toUpperCase()}${building.floors.length > 1 ? `  ·  PIANO ${floor.index + 1}/${building.floors.length}` : ''}`, X(12), Y(0) - 24);
    ctx.restore();
    if (near && near.kind !== 'desk') {
      ctx.font = `12px ${FONT}`;
      ctx.fillStyle = '#d6ffe6';
      ctx.textAlign = 'center';
      ctx.fillText(`E: ${near.kind === 'file' ? `apri ${near.label}` : near.kind === 'sprite' || near.kind === 'tile' ? `guarda «${near.label}»` : near.label}`, this.w / 2, this.h - 70);
    }
    this.drawAvatars();
    this.drawPlayer(k.ecs.get(k.playerId, 'glyph') ?? { ch: '@', color: '#fff', scale: 1.3 }, p, g);
  }

  /** Each room's personality, faint on the floor: code rain, a compass grid, splashes, orbits… */
  private drawMotif(id: string, x0: number, y0: number, C: number, col: string): void {
    const ctx = this.ctx;
    const t = this.t;
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = col;
    ctx.strokeStyle = col;
    ctx.font = `${Math.round(C * 0.35)}px monospace`;
    const W = C * 24;
    const H = C * 15;
    if (id === 'sistemi' || id === 'nucleo' || id === 'altro') {
      for (let i = 0; i < 18; i++) {
        const x = x0 + ((i * 97) % 22 + 1) * C;
        const y = y0 + C + (((t * 40 + i * 53) % (H - 2 * C)) as number);
        ctx.fillText(String.fromCharCode(0x30a0 + ((i * 7 + Math.floor(t * 6)) % 90)), x, y);
      }
    } else if (id === 'cartografia' || id === 'luoghi') {
      for (let r = 1; r < 6; r++) {
        ctx.beginPath();
        ctx.arc(x0 + W / 2, y0 + H / 2, r * C * 1.4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(x0 + W / 2, y0 + C);
      ctx.lineTo(x0 + W / 2, y0 + H - C);
      ctx.moveTo(x0 + C, y0 + H / 2);
      ctx.lineTo(x0 + W - C, y0 + H / 2);
      ctx.stroke();
    } else if (id === 'galleria') {
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = ['#ff2a6d', '#05d9e8', '#f5d300', '#b026ff'][i % 4];
        ctx.beginPath();
        ctx.arc(x0 + ((i * 131) % 20 + 2) * C, y0 + ((i * 71) % 11 + 2) * C, C * (0.8 + (i % 3) * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (id === 'oggetti' || id === 'cose') {
      for (let i = 0; i < 6; i++) {
        const a = t * 0.6 + i;
        ctx.beginPath();
        ctx.ellipse(x0 + W / 2, y0 + H / 2, C * (3 + i), C * (1.5 + i * 0.5), a * 0.2, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (id === 'persone' || id === 'mondo' || id === 'magia') {
      for (let y = y0 + C; y < y0 + H - C; y += 4) {
        ctx.globalAlpha = 0.05 + 0.04 * Math.sin(y * 0.1 + t * 3);
        ctx.fillRect(x0 + C, y, W - 2 * C, 1);
      }
    } else if (id === 'universo') {
      ctx.globalAlpha = 0.1;
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.moveTo(x0 + W / 2, y0 + H / 2);
        const a = (i / 12) * Math.PI * 2 + t * 0.1;
        ctx.lineTo(x0 + W / 2 + Math.cos(a) * W, y0 + H / 2 + Math.sin(a) * W);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /** The wall of screens: the latest changes of this room, scrolling. */
  private drawHistoryScreen(x: number, y: number, w: number, h: number, col: string, buildingId: string): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#05060c';
    ctx.fillRect(x, y - h * 0.3, w, h * 1.2);
    ctx.shadowColor = col;
    ctx.shadowBlur = 16;
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y - h * 0.3, w, h * 1.2);
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.rect(x + 3, y - h * 0.3 + 3, w - 6, h * 1.2 - 6);
    ctx.clip();
    const lines = this.kernel.boardOf(buildingId).map((l) => `${l.author}: ${l.message}`);
    const all = lines.length ? lines : this.kernel.repo.log().slice(0, 8).map((c) => `${c.id} ${c.message}`);
    ctx.font = `10px monospace`;
    ctx.fillStyle = col;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const scroll = (this.t * 10) % (all.length * 12 + 20);
    all.forEach((l, i) => ctx.fillText(l.slice(0, Math.floor(w / 6)), x + 6, y - h * 0.3 + 6 + i * 12 - scroll + h));
    ctx.restore();
  }

  /** A holographic table with the atlas. */
  private drawAtlasTable(x: number, y: number, w: number, h: number, col: string): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#081210';
    ctx.fillRect(x, y, w, h);
    ctx.shadowColor = col;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = col;
    ctx.strokeRect(x, y, w, h);
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = i % 3 ? col : '#f5d300';
      ctx.fillRect(x + 4 + ((i * 37) % (w - 10)), y + 4 + ((i * 17) % (h - 10)), 3, 3);
    }
    ctx.restore();
  }

  /** A teleport pad: rings of light turning. */
  private drawPortal(x: number, y: number, col: string, near: boolean): void {
    const ctx = this.ctx;
    const C = this.cell;
    ctx.save();
    ctx.shadowColor = col;
    ctx.shadowBlur = near ? 22 : 12;
    ctx.strokeStyle = col;
    for (let i = 0; i < 3; i++) {
      const r = C * (0.18 + 0.12 * i) * (1 + 0.08 * Math.sin(this.t * 4 + i));
      ctx.globalAlpha = 0.9 - i * 0.25;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x + C / 2, y + C / 2, r * 1.3, r * 0.7, this.t * (i % 2 ? 1 : -1), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * The Council's round table: glossy black with a neon rim; in the middle a circular screen with a
   * universe turning (a galaxy of light, drawn — not the real one).
   */
  private drawCouncilTable(cx: number, cy: number, C: number): void {
    const ctx = this.ctx;
    const t = this.t;
    ctx.save();
    ctx.fillStyle = '#0b0b12';
    ctx.beginPath();
    ctx.ellipse(cx, cy, C * 3.4, C * 2.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#b026ff';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#b026ff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.shadowColor = '#05d9e8';
    ctx.strokeStyle = '#05d9e8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, C * 3.1, C * 2.05, 0, 0, Math.PI * 2);
    ctx.stroke();
    // The circular screen.
    const R = C * 1.5;
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#020208';
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.clip();
    for (let i = 0; i < 260; i++) {
      const arm = i % 3;
      const d = (i / 260) * R * 0.95;
      const a = d * 0.09 + (arm * Math.PI * 2) / 3 + t * 0.5 + ((i * 7919) % 100) / 400;
      const px = cx + Math.cos(a) * d;
      const py = cy + Math.sin(a) * d * 0.9;
      const tw = 0.5 + 0.5 * Math.sin(t * 3 + i);
      ctx.fillStyle = i % 5 === 0 ? `rgba(255, 80, 180, ${0.5 + 0.5 * tw})` : i % 2 ? `rgba(120, 220, 255, ${0.4 + 0.5 * tw})` : `rgba(255, 245, 210, ${0.5 + 0.4 * tw})`;
      ctx.fillRect(px, py, 1.6, 1.6);
    }
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.35);
    core.addColorStop(0, 'rgba(255, 240, 220, 0.9)');
    core.addColorStop(1, 'rgba(255, 120, 200, 0)');
    ctx.fillStyle = core;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.restore();
  }

  private drawFile(look: string, sx: number, sy: number, color: string, near: boolean): void {
    const ctx = this.ctx;
    const C = this.cell;
    const cx = sx + C / 2;
    const cy = sy + C / 2;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = near ? 16 : 6;
    switch (look) {
      case 'libro': {
        ctx.fillStyle = '#3a2412';
        ctx.fillRect(cx - C * 0.28, cy - C * 0.32, C * 0.56, C * 0.62);
        ctx.fillStyle = color;
        ctx.fillRect(cx - C * 0.28, cy - C * 0.32, C * 0.1, C * 0.62);
        ctx.fillStyle = '#e9dcc0';
        ctx.fillRect(cx - C * 0.14, cy - C * 0.24, C * 0.36, C * 0.46);
        ctx.fillStyle = '#7a6a50';
        for (let i = 0; i < 4; i++) ctx.fillRect(cx - C * 0.1, cy - C * 0.16 + i * C * 0.1, C * 0.26, 1.2);
        break;
      }
      case 'cristallo': {
        ctx.fillStyle = '#7dffd8';
        ctx.beginPath();
        ctx.moveTo(cx, cy - C * 0.38);
        ctx.lineTo(cx + C * 0.22, cy - C * 0.05);
        ctx.lineTo(cx, cy + C * 0.34);
        ctx.lineTo(cx - C * 0.22, cy - C * 0.05);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.moveTo(cx, cy - C * 0.38);
        ctx.lineTo(cx + C * 0.08, cy - C * 0.05);
        ctx.lineTo(cx, cy + C * 0.34);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'pergamena': {
        ctx.fillStyle = '#e8d8a8';
        ctx.fillRect(cx - C * 0.22, cy - C * 0.26, C * 0.44, C * 0.52);
        ctx.fillStyle = '#b89a5a';
        ctx.beginPath();
        ctx.ellipse(cx, cy - C * 0.27, C * 0.27, C * 0.07, 0, 0, Math.PI * 2);
        ctx.ellipse(cx, cy + C * 0.27, C * 0.27, C * 0.07, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6a5a3a';
        for (let i = 0; i < 3; i++) ctx.fillRect(cx - C * 0.14, cy - C * 0.12 + i * C * 0.11, C * 0.28, 1.2);
        break;
      }
      default: {
        ctx.fillStyle = '#6b7470';
        ctx.beginPath();
        ctx.roundRect(cx - C * 0.25, cy - C * 0.3, C * 0.5, C * 0.6, C * 0.12);
        ctx.fill();
        ctx.fillStyle = color;
        for (let i = 0; i < 3; i++) ctx.fillRect(cx - C * 0.14, cy - C * 0.15 + i * C * 0.12, C * 0.28, 1.5);
      }
    }
    ctx.restore();
    if (near) {
      ctx.strokeStyle = '#ffcf5c';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx + 2, sy + 2, C - 4, C - 4);
    }
  }

  private drawSign(name: string, sx: number, sy: number, color: string): void {
    const ctx = this.ctx;
    const C = this.cell;
    const cx = sx + C / 2;
    ctx.fillStyle = '#4a3420';
    ctx.fillRect(cx - 1.5, sy + C * 0.1, 3, C * 0.8);
    ctx.font = `bold ${Math.round(C * 0.32)}px ${FONT}`;
    const w = ctx.measureText(name).width + 14;
    ctx.fillStyle = 'rgba(10, 8, 4, 0.9)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, sy - C * 0.15, w, C * 0.45, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, cx, sy + C * 0.08);
  }

  /** The Council: robed figures with their sigil, and what they are saying. */
  private drawAvatars(): void {
    const ctx = this.ctx;
    const C = this.cell;
    for (const a of this.kernel.archive.avatars.values()) {
      const x = this.sx(a.x);
      const y = this.sy(a.y);
      if (x < -C * 4 || y < -C * 4 || x > this.w + C * 4 || y > this.h + C * 4) continue;
      const bob = Math.sin(this.t * 4 + a.x) * C * 0.03;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(x, y + C * 0.38, C * 0.28, C * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      // Robe and hood.
      ctx.fillStyle = a.color;
      ctx.beginPath();
      ctx.moveTo(x, y - C * 0.45 + bob);
      ctx.lineTo(x + C * 0.3, y + C * 0.38);
      ctx.lineTo(x - C * 0.3, y + C * 0.38);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#14100c';
      ctx.beginPath();
      ctx.arc(x, y - C * 0.28 + bob, C * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(C * 0.3)}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(a.sigil, x, y + C * 0.12 + bob);
      ctx.font = `${Math.round(C * 0.26)}px ${FONT}`;
      ctx.fillStyle = a.color;
      ctx.fillText(a.name, x, y + C * 0.62);
      if (a.say) this.bubble(x, y - C * 0.55, a.say);
    }
  }

  /** A speech bubble anchored at (x, y). */
  private bubble(x: number, y: number, text: string): void {
    const ctx = this.ctx;
    ctx.font = `12px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > 32) {
        lines.push(cur.trim());
        cur = w;
      } else cur += ' ' + w;
    }
    if (cur.trim()) lines.push(cur.trim());
    const shown = lines.slice(0, 3);
    const bw = Math.max(...shown.map((l) => ctx.measureText(l).width)) + 14;
    const bh = shown.length * 15 + 8;
    const bx = Math.min(Math.max(8, x - bw / 2), this.w - bw - 8);
    const by = y - bh;
    ctx.fillStyle = 'rgba(16, 20, 18, 0.92)';
    ctx.strokeStyle = 'rgba(160, 255, 200, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#d6ffe6';
    shown.forEach((l, i) => ctx.fillText(l, bx + 7, by + 4 + i * 15));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
  }

  private drawHover(): void {
    if (!this.mouse) return;
    const r = this.toReal(this.mouse.x, this.mouse.y);
    const C = this.cell;
    const k = this.kernel;
    const { ox, oy } = k.offset();
    const inCorona = k.coronaRevealed() && Math.hypot(r.x, r.y) >= k.config.circleRadius;
    const x = inCorona ? Math.floor(r.x) : Math.floor(r.x + ox) - ox;
    const y = inCorona ? Math.floor(r.y) : Math.floor(r.y + oy) - oy;
    this.ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(this.sx(x) + 0.5, this.sy(y) + 0.5, C - 1, C - 1);
  }

  private drawCorruption(g: number): void {
    const ctx = this.ctx;
    const C = this.cell;
    ctx.font = `${Math.round(C * 0.6)}px ${FONT}`;
    const n = Math.floor(g * 40);
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

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
