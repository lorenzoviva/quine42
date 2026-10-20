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

/** The key colour family: magenta-ish pixels (models never paint the exact #FF00FF). */
const magentaish = (r: number, g: number, b: number) => r > 140 && b > 120 && g < 120 && r - g > 70 && b - g > 50 && Math.abs(r - b) < 110;

/**
 * Keys out the flat background, trims and fits into px×px. The background is the dominant colour along
 * all four borders (a corner can fall on a grid line or a neighbouring frame); it is removed by flood
 * fill from the borders, plus any magenta-ish pixel left anywhere. Returns '' if the result is still
 * dirty (mostly opaque, or with visible key colour): callers discard it rather than show a square.
 */
function keyAndFit(src: CanvasImageSource, sw: number, sh: number, px: number): string {
  const W = 256;
  const [c, ctx] = canvas(W);
  ctx.drawImage(src, 0, 0, sw, sh, 0, 0, W, W);
  const data = ctx.getImageData(0, 0, W, W);
  const d = data.data;
  const border: number[] = [];
  for (let i = 0; i < W; i++) border.push(i, (W - 1) * W + i, i * W, i * W + W - 1);
  const buckets = new Map<number, number[]>();
  for (const i of border) {
    const key = ((d[i * 4] >> 5) << 6) | ((d[i * 4 + 1] >> 5) << 3) | (d[i * 4 + 2] >> 5);
    let b = buckets.get(key);
    if (!b) buckets.set(key, (b = []));
    b.push(i);
  }
  const dominant = [...buckets.values()].sort((a, b) => b.length - a.length)[0];
  const bg = [0, 1, 2].map((ch) => dominant.reduce((s, i) => s + d[i * 4 + ch], 0) / dominant.length);
  const dist = (i: number) => Math.hypot(d[i * 4] - bg[0], d[i * 4 + 1] - bg[1], d[i * 4 + 2] - bg[2]);
  const isBg = (i: number) => dist(i) < 80 || magentaish(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
  // Flood fill the background from the borders.
  const seen = new Uint8Array(W * W);
  const stack = border.filter(isBg);
  for (const i of stack) seen[i] = 1;
  while (stack.length) {
    const i = stack.pop()!;
    d[i * 4 + 3] = 0;
    const x = i % W;
    const y = (i - x) / W;
    for (const n of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < W - 1 ? i + W : -1]) {
      if (n < 0 || seen[n] || !isBg(n)) continue;
      seen[n] = 1;
      stack.push(n);
    }
  }
  let minX = W, minY = W, maxX = -1, maxY = -1;
  let opaque = 0;
  let band = 0;
  let bandOpaque = 0;
  const B = Math.round(W * 0.03);
  for (let i = 0; i < W * W; i++) {
    const px = i % W;
    const py = (i - px) / W;
    const inBand = px < B || py < B || px >= W - B || py >= W - B;
    if (inBand) band++;
    if (d[i * 4 + 3] === 0) continue;
    // Holes of key colour inside the figure (between arms and legs) — only the key itself, not pink or
    // purple clothes — and soft edges.
    const dd = dist(i);
    if (dd < 60 && magentaish(d[i * 4], d[i * 4 + 1], d[i * 4 + 2])) {
      d[i * 4 + 3] = 0;
      continue;
    }
    if (dd < 110) d[i * 4 + 3] = Math.round(Math.max(0, (dd - 70) / 40) * 255);
    if (d[i * 4 + 3] > 40) {
      opaque++;
      if (inBand) bandOpaque++;
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
  // Dirty means the background did not go: the frame of the image is still mostly opaque.
  if (maxX < 0 || opaque > W * W * 0.9 || bandOpaque > band * 0.5) return '';
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

  async measure(dataUrl: string): Promise<{ ink: number; h: number }> {
    return inkOf(await loadImage(dataUrl));
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

/** An image (stored before the robust key) that still shows a block of key colour: better not drawn. */
function stained(img: HTMLImageElement): boolean {
  const N = 32;
  const [, ctx] = canvas(N);
  ctx.drawImage(img, 0, 0, N, N);
  const d = ctx.getImageData(0, 0, N, N).data;
  // Only the frame counts: a figure may well wear pink or purple.
  let bad = 0;
  let band = 0;
  for (let i = 0; i < N * N; i++) {
    const x = i % N;
    const y = (i - x) / N;
    if (x > 1 && y > 1 && x < N - 2 && y < N - 2) continue;
    band++;
    if (d[i * 4 + 3] > 200 && magentaish(d[i * 4], d[i * 4 + 1], d[i * 4 + 2])) bad++;
  }
  return bad > band * 0.5;
}

/** How much of an image is drawn: opaque fraction and height of the figure (0..1), on a 32×32 sample. */
export function inkOf(img: CanvasImageSource): { ink: number; h: number } {
  const N = 32;
  const [, ctx] = canvas(N);
  ctx.drawImage(img, 0, 0, N, N);
  const d = ctx.getImageData(0, 0, N, N).data;
  let ink = 0;
  let top = N;
  let bottom = -1;
  for (let i = 0; i < N * N; i++) {
    if (d[i * 4 + 3] < 80) continue;
    ink++;
    const y = Math.floor(i / N);
    if (y < top) top = y;
    if (y > bottom) bottom = y;
  }
  return { ink: ink / (N * N), h: bottom < 0 ? 0 : (bottom - top + 1) / N };
}

/** Decoded images by asset id, for the renderer and the UI. */
export class ImageCache {
  private images = new Map<string, HTMLImageElement | null>();
  private inks = new Map<string, { ink: number; h: number }>();

  /** How much of a loaded image is drawn (to tell a whole walking frame from a cut or empty one). */
  inkOf(id: string | undefined): { ink: number; h: number } | undefined {
    if (!id) return undefined;
    let v = this.inks.get(id);
    if (!v) {
      const img = this.images.get(id);
      if (!img) return undefined;
      this.inks.set(id, (v = inkOf(img)));
    }
    return v;
  }
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
          if (im && !stained(im)) this.images.set(id, im);
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
