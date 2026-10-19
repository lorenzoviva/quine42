// Browser implementation of the kernel's ImageTools: canvases in, data URLs out.

import type { ImageTools, Neighbours } from '../kernel/imaging';
import type { TileDef } from '../kernel/types';

const CANVAS = 1024;

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('immagine non decodificabile'));
    img.src = src;
  });
}

function canvas(w: number, h = w): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d', { willReadFrequently: true })!];
}

const OFFSETS: Record<keyof Neighbours, [number, number]> = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0], ne: [1, -1], nw: [-1, -1], se: [1, 1], sw: [-1, 1] };

export class BrowserImageTools implements ImageTools {
  async composeLayout(grid: string[], palette: Record<string, TileDef>, neighbours: Neighbours, margin: number): Promise<string> {
    const size = grid.length;
    const n = size + 2 * margin;
    const t = CANVAS / n;
    const [c, ctx] = canvas(CANVAS);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS, CANVAS);
    // Painted neighbours: only the strips that fall inside the margin are visible.
    for (const [dir, src] of Object.entries(neighbours)) {
      if (!src) continue;
      const [dx, dy] = OFFSETS[dir as keyof Neighbours];
      const img = await loadImage(src);
      ctx.drawImage(img, (margin + dx * size) * t, (margin + dy * size) * t, size * t, size * t);
    }
    for (let r = 0; r < size; r++)
      for (let col = 0; col < size; col++) {
        ctx.fillStyle = palette[grid[r][col]]?.color ?? '#ff00ff';
        ctx.fillRect(Math.floor((margin + col) * t), Math.floor((margin + r) * t), Math.ceil(t), Math.ceil(t));
      }
    return c.toDataURL('image/png');
  }

  async cropInner(dataUrl: string, size: number, margin: number, px: number): Promise<string> {
    const img = await loadImage(dataUrl);
    const n = size + 2 * margin;
    const tw = img.width / n;
    const th = img.height / n;
    const [c, ctx] = canvas(px);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, margin * tw, margin * th, size * tw, size * th, 0, 0, px, px);
    return c.toDataURL('image/webp', 0.9);
  }

  async cutSprite(dataUrl: string, px: number): Promise<string> {
    const img = await loadImage(dataUrl);
    const W = 256;
    const [c, ctx] = canvas(W);
    ctx.drawImage(img, 0, 0, W, W);
    const data = ctx.getImageData(0, 0, W, W);
    const d = data.data;
    // Background colour: average of the four corners (models rarely hit the exact key colour).
    const corners = [0, W - 1, (W - 1) * W, W * W - 1];
    const bg = [0, 1, 2].map((ch) => corners.reduce((s, i) => s + d[i * 4 + ch], 0) / 4);
    let minX = W, minY = W, maxX = -1, maxY = -1;
    for (let i = 0; i < W * W; i++) {
      const dist = Math.hypot(d[i * 4] - bg[0], d[i * 4 + 1] - bg[1], d[i * 4 + 2] - bg[2]);
      const a = dist < 70 ? 0 : dist < 120 ? Math.round(((dist - 70) / 50) * 255) : 255;
      d[i * 4 + 3] = a;
      if (a > 40) {
        const x = i % W;
        const y = Math.floor(i / W);
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
    ctx.putImageData(data, 0, 0);
    if (maxX < 0) return c.toDataURL('image/png');
    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    const scale = (px * 0.92) / Math.max(bw, bh);
    const [out, octx] = canvas(px);
    octx.imageSmoothingQuality = 'high';
    octx.drawImage(c, minX, minY, bw, bh, (px - bw * scale) / 2, (px - bh * scale) / 2, bw * scale, bh * scale);
    return out.toDataURL('image/png');
  }

  async downscale(dataUrl: string, px: number): Promise<string> {
    const img = await loadImage(dataUrl);
    const [c, ctx] = canvas(px);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, px, px);
    return c.toDataURL('image/jpeg', 0.85);
  }
}

/** Decoded images by asset id, for the renderer and the UI. */
export class ImageCache {
  private images = new Map<string, HTMLImageElement | null>();
  constructor(private get: (id: string) => Promise<string | undefined>) {}

  /** The image if ready; starts loading it otherwise. */
  peek(id: string | undefined): HTMLImageElement | undefined {
    if (!id) return undefined;
    const img = this.images.get(id);
    if (img) return img;
    if (img === undefined) {
      this.images.set(id, null);
      void this.get(id)
        .then((src) => (src ? loadImage(src) : null))
        .then((im) => {
          if (im) this.images.set(id, im);
        })
        .catch(() => undefined);
    }
    return undefined;
  }

  /** Data URL for <img> elements in the DOM UI. */
  async url(id: string): Promise<string | undefined> {
    return this.get(id);
  }
}
