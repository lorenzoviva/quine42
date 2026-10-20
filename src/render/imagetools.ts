// Browser implementation of the kernel's ImageTools: canvases in, data URLs out.

import type { ImageTools } from '../kernel/imaging';

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

/** Keys out the flat background (sampled at the corners), trims and fits into px×px. */
function keyAndFit(src: CanvasImageSource, sw: number, sh: number, px: number): string {
  const W = 256;
  const [c, ctx] = canvas(W);
  ctx.drawImage(src, 0, 0, sw, sh, 0, 0, W, W);
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
  const [out, octx] = canvas(px);
  if (maxX < 0) return out.toDataURL('image/png');
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const scale = (px * 0.92) / Math.max(bw, bh);
  octx.imageSmoothingQuality = 'high';
  // Anchored to the bottom: sprites stand on their cell.
  octx.drawImage(c, minX, minY, bw, bh, (px - bw * scale) / 2, px - bh * scale - px * 0.04, bw * scale, bh * scale);
  return out.toDataURL('image/png');
}

export class BrowserImageTools implements ImageTools {
  async cutGrid(dataUrl: string, cols: number, rows: number, px: number, opts: { key?: boolean } = {}): Promise<string[]> {
    const img = await loadImage(dataUrl);
    const cw = img.width / cols;
    const ch = img.height / rows;
    const out: string[] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        // A small inset hides the seams models paint between grid cells.
        const inset = opts.key ? 0 : 0.04;
        const [cell, ctx] = canvas(Math.round(cw * (1 - 2 * inset)), Math.round(ch * (1 - 2 * inset)));
        ctx.drawImage(img, c * cw + cw * inset, r * ch + ch * inset, cw * (1 - 2 * inset), ch * (1 - 2 * inset), 0, 0, cell.width, cell.height);
        if (opts.key) out.push(keyAndFit(cell, cell.width, cell.height, px));
        else {
          const [o, octx] = canvas(px);
          octx.imageSmoothingQuality = 'high';
          octx.drawImage(cell, 0, 0, px, px);
          out.push(o.toDataURL('image/png'));
        }
      }
    return out;
  }

  /**
   * Seamless texture: the image shifted by half a tile has edges that match by construction (they come
   * from the original's centre); the original, faded radially, covers the cross of seams in the middle.
   */
  async makeSeamless(dataUrl: string, px: number): Promise<string> {
    const img = await loadImage(dataUrl);
    const [base, b] = canvas(px);
    const h = px / 2;
    b.imageSmoothingQuality = 'high';
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) b.drawImage(img, dx * img.width / 2, dy * img.height / 2, img.width / 2, img.height / 2, (1 - dx) * h, (1 - dy) * h, h, h);
    const [over, o] = canvas(px);
    o.drawImage(img, 0, 0, px, px);
    const g = o.createRadialGradient(h, h, px * 0.18, h, h, px * 0.5);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    o.globalCompositeOperation = 'destination-in';
    o.fillStyle = g;
    o.fillRect(0, 0, px, px);
    b.drawImage(over, 0, 0);
    return base.toDataURL('image/png');
  }

  async cutSprite(dataUrl: string, px: number): Promise<string> {
    const img = await loadImage(dataUrl);
    return keyAndFit(img, img.width, img.height, px);
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
