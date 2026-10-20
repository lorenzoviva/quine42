// Canvas renderer. The carpet is drawn from tiles: every terrain has a seamless texture (painted by
// the Artist, or procedural until then), aligned to world coordinates, so chunks join with no seams.
// What blocks is visible: obstacles are sprites standing on their cell, walls have a face, water a
// shore. Buildings have roofs that disappear when you walk in. Runes stay glowing code. The corona is
// drawn only once the carpet stops holding you.

import type { Chunk, Kernel } from '../kernel/kernel';
import { runeGlyph, type RuneComp } from '../kernel/runes';
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
          const below = tile(code(col, row + 1)).layer === 'wall';
          if (!below) {
            c.fillStyle = 'rgba(0,0,0,0.38)';
            c.fillRect(x, y + T * 0.55, T, T * 0.45);
            c.fillStyle = 'rgba(255,255,255,0.12)';
            c.fillRect(x, y + T * 0.55, T, 2);
          }
          c.strokeStyle = 'rgba(0,0,0,0.35)';
          c.lineWidth = 1;
          c.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1);
          if (tile(code(col, row + 1)).layer !== 'wall') {
            // Cast shadow on the cell below is drawn by the cell below (next pass).
          }
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
    const frames = gl.frames?.[m.dir];
    if (frames?.length && m.moving > 0) {
      const img = this.images.peek(frames[Math.floor(m.phase) % frames.length]);
      if (img) return img;
    }
    if (frames?.length && m.dir !== 'down') {
      const img = this.images.peek(frames[1 % frames.length]);
      if (img) return img;
    }
    return this.images.peek(gl.sprite);
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

  private drawSprite(id: number, gl: any, x: number, y: number, p: { x: number; y: number }, pickup: boolean, g: number): void {
    const ctx = this.ctx;
    const C = this.cell;
    const v = pickup ? undefined : this.variantOf(id);
    const size = C * (gl.scale ?? 1.1) * (v?.scale ?? 1);
    const raw = pickup ? this.images.peek(gl.sprite) : this.frameOf(id, gl, p);
    const img = raw && v ? this.tintedSprite(raw, v.tint) : raw;
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
    for (const ch of k.chunks.values()) {
      for (const b of ch.buildings) {
        if (b === inside) continue;
        const x = this.sx(ch.cx * S + b.x0 - ox);
        const y = this.sy(ch.cy * S + b.y0 - oy);
        const w = (b.x1 - b.x0 + 1) * C;
        const h = (b.y1 - b.y0 + 1) * C;
        if (x > this.w || y > this.h || x + w < 0 || y + h < 0) continue;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(x + C * 0.15, y + C * 0.2, w, h);
        if (pat) {
          pat.setTransform(new DOMMatrix().translate(x, y).scale(C / (roofImg!.width / 2)));
          ctx.fillStyle = pat;
        } else ctx.fillStyle = roof.color;
        ctx.fillRect(x, y - C * 0.25, w, h);
        // Ridge and eaves: a top-down pitched roof.
        const horizontal = w >= h;
        const grd = horizontal ? ctx.createLinearGradient(0, y - C * 0.25, 0, y - C * 0.25 + h) : ctx.createLinearGradient(x, 0, x + w, 0);
        grd.addColorStop(0, 'rgba(255,255,255,0.12)');
        grd.addColorStop(0.49, 'rgba(255,255,255,0.02)');
        grd.addColorStop(0.51, 'rgba(0,0,0,0.18)');
        grd.addColorStop(1, 'rgba(0,0,0,0.32)');
        ctx.fillStyle = grd;
        ctx.fillRect(x, y - C * 0.25, w, h);
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y - C * 0.25 + 1, w - 2, h - 2);
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
  private drawCorona(): void {
    const k = this.kernel;
    const corona = k.corona;
    const C = this.cell;
    const halfW = this.w / 2 / C + 1;
    const halfH = this.h / 2 / C + 1;
    const camD = Math.hypot(this.cam.x, this.cam.y);
    if (camD + Math.hypot(halfW, halfH) < corona.radius) return;
    const ctx = this.ctx;
    const p = k.playerPos();
    const near = k.zone === 'corona' ? corona.nearestFile(p.x, p.y) : undefined;
    const x0 = Math.floor(this.cam.x - halfW);
    const y0 = Math.floor(this.cam.y - halfH);
    const signs: Array<() => void> = [];
    for (let y = y0; y < this.cam.y + halfH; y++) {
      for (let x = x0; x < this.cam.x + halfW; x++) {
        const cell = corona.at(x, y);
        if (!cell) continue;
        const folder = corona.folder(cell.folder);
        const col = folder?.color ?? '#9fb2a8';
        const sx = this.sx(x);
        const sy = this.sy(y);
        // Floor: dark stone tinted with the room's colour, a faint grid of flagstones.
        ctx.fillStyle = '#0a0d0c';
        ctx.fillRect(sx, sy, C + 0.5, C + 0.5);
        ctx.fillStyle = `${col}${(x + y) & 1 ? '14' : '0c'}`;
        ctx.fillRect(sx, sy, C + 0.5, C + 0.5);
        if (cell.kind === 'file') this.drawFile(cell.look ?? 'tavoletta', sx, sy, col, cell.path === near);
        else if (cell.kind === 'folder' && folder) signs.push(() => this.drawSign(folder.name, sx, sy, col));
      }
    }
    // Where one room ends and the next begins: a line along the radius.
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    for (const f of corona.folders) {
      const a = f.from;
      ctx.beginPath();
      ctx.moveTo(this.sx(Math.sin(a) * corona.radius), this.sy(-Math.cos(a) * corona.radius));
      ctx.lineTo(this.sx(Math.sin(a) * corona.outer), this.sy(-Math.cos(a) * corona.outer));
      ctx.stroke();
    }
    for (const s of signs) s();
    this.drawAvatars();
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
