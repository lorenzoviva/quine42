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
 * Keys out the flat background, trims and fits into px×px.
 * - The background is the magenta key when the borders show it (that is what the models are asked to
 *   paint); only otherwise the dominant colour of the borders. A figure touching the borders of a tight
 *   cell must never be taken for the background.
 * - It is removed by flood fill from the borders; magenta holes inside the figure go too.
 * - Soft edges only where the figure meets the removed background, never inside the figure.
 * - Only the figure stays: pieces of neighbouring cells (a painted grid is never exact) are dropped —
 *   the largest connected shape and whatever is at least a sixth of it.
 * Returns '' if the result is still dirty (callers discard it rather than show a square).
 */
function keyAndFit(src: CanvasImageSource, sw: number, sh: number, px: number): string {
  const W = 256;
  const [c, ctx] = canvas(W);
  ctx.drawImage(src, 0, 0, sw, sh, 0, 0, W, W);
  const data = ctx.getImageData(0, 0, W, W);
  const d = data.data;
  const N = W * W;
  const border: number[] = [];
  for (let i = 0; i < W; i++) border.push(i, (W - 1) * W + i, i * W, i * W + W - 1);
  const isKey = (i: number) => magentaish(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
  const keyed = border.filter(isKey);
  let sample: number[];
  if (keyed.length >= border.length * 0.1) sample = keyed;
  else {
    const buckets = new Map<number, number[]>();
    for (const i of border) {
      const key = ((d[i * 4] >> 5) << 6) | ((d[i * 4 + 1] >> 5) << 3) | (d[i * 4 + 2] >> 5);
      let bk = buckets.get(key);
      if (!bk) buckets.set(key, (bk = []));
      bk.push(i);
    }
    sample = [...buckets.values()].sort((x, y) => y.length - x.length)[0];
  }
  const bg = [0, 1, 2].map((ch) => sample.reduce((s, i) => s + d[i * 4 + ch], 0) / sample.length);
  const dist = (i: number) => Math.hypot(d[i * 4] - bg[0], d[i * 4 + 1] - bg[1], d[i * 4 + 2] - bg[2]);
  const isBg = (i: number) => dist(i) < 80 || isKey(i);
  // Flood fill the background from the borders.
  const gone = new Uint8Array(N);
  const stack = border.filter(isBg);
  for (const i of stack) gone[i] = 1;
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % W;
    const y = (i - x) / W;
    for (const n of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < W - 1 ? i + W : -1]) {
      if (n < 0 || gone[n] || !isBg(n)) continue;
      gone[n] = 1;
      stack.push(n);
    }
  }
  // Magenta holes inside the figure (between arms and legs).
  for (let i = 0; i < N; i++) if (!gone[i] && isKey(i) && dist(i) < 90) gone[i] = 1;
  for (let i = 0; i < N; i++) if (gone[i]) d[i * 4 + 3] = 0;
  // Soft edges: only pixels touching the removed background, faded by how close they are to it.
  for (let i = 0; i < N; i++) {
    if (gone[i]) continue;
    const x = i % W;
    const y = (i - x) / W;
    const edge = (x > 0 && gone[i - 1]) || (x < W - 1 && gone[i + 1]) || (y > 0 && gone[i - W]) || (y < W - 1 && gone[i + W]);
    if (!edge) continue;
    const dd = dist(i);
    if (dd < 110) d[i * 4 + 3] = Math.round(Math.max(0.25, (dd - 60) / 50) * 255);
  }
  // Keep the figure: connected shapes of opaque pixels, the largest and those at least a sixth of it.
  const label = new Int32Array(N).fill(-1);
  const sizes: number[] = [];
  for (let i = 0; i < N; i++) {
    if (label[i] >= 0 || d[i * 4 + 3] <= 40) continue;
    const id = sizes.length;
    let size = 0;
    const st = [i];
    label[i] = id;
    while (st.length) {
      const j = st.pop()!;
      size++;
      const x = j % W;
      const y = (j - x) / W;
      for (const n of [x > 0 ? j - 1 : -1, x < W - 1 ? j + 1 : -1, y > 0 ? j - W : -1, y < W - 1 ? j + W : -1]) {
        if (n < 0 || label[n] >= 0 || d[n * 4 + 3] <= 40) continue;
        label[n] = id;
        st.push(n);
      }
    }
    sizes.push(size);
  }
  const biggest = Math.max(0, ...sizes);
  let minX = W, minY = W, maxX = -1, maxY = -1;
  let opaque = 0;
  let band = 0;
  let bandOpaque = 0;
  const B = Math.round(W * 0.03);
  for (let i = 0; i < N; i++) {
    const x = i % W;
    const y = (i - x) / W;
    const inBand = x < B || y < B || x >= W - B || y >= W - B;
    if (inBand) band++;
    if (label[i] >= 0 && sizes[label[i]] < biggest / 6) {
      d[i * 4 + 3] = 0;
      continue;
    }
    if (d[i * 4 + 3] <= 40) continue;
    opaque++;
    if (inBand) bandOpaque++;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  ctx.putImageData(data, 0, 0);
  const [out, octx] = canvas(px);
  // Dirty means the background did not go: the frame of the image is still mostly opaque.
  if (maxX < 0 || opaque > N * 0.9 || bandOpaque > band * 0.5) return '';
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
