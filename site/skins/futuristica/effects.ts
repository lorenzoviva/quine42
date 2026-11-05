// What moves in the futuristic skin (T284, ADR-0145): the lettering of the proposal, big, at the top of the landing's hero, and stripes of
// the same small text along every page, fainter. The small letters slide along their rows like a carpet, and lights run over them like
// a program being compiled (heads along the rows, waves through a big letter). Only what is on screen moves, a tick at a time and one
// frame per tick; nothing moves with the tab hidden or with `prefers-reduced-motion`, where the lettering stands as the proposal drew it.
//
// The lights are the same thing written twice (docs/architettura-dettagli.md#sito, the numbers): plain loops (lights-simple.ts, the
// default: the numbers chose it) or a MarkovJunior program run by the game's engine (lights-mj.ts). `?fx=` picks: `semplice`, `mj`, or
// `mj-pagina`, the variant proposed to the author: no 3D stage, MarkovJunior everywhere and, in the stage's place, a MarkovJunior program
// in two dimensions (program.ts). Whatever is asked that is not one of these is the default.

import { LETTERING } from './scritta';
import { GLYPH_H, GLYPH_W, glyphOffsets, inkOf, letteringSurface, paint, pictureSize, restingStates, stripeSurface, type Ink, type Lights, type LightsMaker, type Surface } from './surface';

/** A tick of the lights. */
const TICK_MS = 90;
/** The carpet moves one small letter every so many ticks. */
const CARPET_EVERY = 3;
const MODES: Record<string, { engine: () => Promise<LightsMaker>; variant: boolean }> = {
  semplice: { engine: async () => (await import('./lights-simple')).simpleLights, variant: false },
  mj: { engine: async () => (await import('./lights-mj')).mjLights, variant: false },
  'mj-pagina': { engine: async () => (await import('./lights-mj')).mjLights, variant: true },
};
const DEFAULT_MODE = 'semplice';

type Shape = 'lettering' | 'stripe' | 'grid';

interface Piece {
  /** What this skin adds to the page, and takes away when it goes. */
  host: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  /** How lit it is: 1 the lettering, less the stripes. */
  alpha: number;
  shape: Shape;
  /** Cells of the small letters, in CSS pixels (stripes and grid); the lettering fits its box. */
  cellPx: number;
  /** Rows of small text of a stripe. */
  rows: number;
  ink: Ink;
  /** Its own lights (the variant's program), instead of the page's engine. */
  maker?: LightsMaker;
  /** Where it says how many steps its program has made. */
  meter?: HTMLElement;
  surface?: Surface;
  lights?: Lights;
  picture?: HTMLCanvasElement;
  image?: ImageData;
  pixels?: Uint32Array;
  glow?: HTMLCanvasElement;
  glowImage?: ImageData;
  glowPixels?: Uint32Array;
  offsets?: Int32Array[];
  /** Where the picture goes on the canvas, in device pixels, and whether it is blown up soft. */
  at?: { x: number; y: number; w: number; h: number; smooth: boolean };
  visible: boolean;
}

function piece(className: string, shape: Shape, ink: Ink, alpha: number, cellPx = 1, rows = 0): Piece {
  const host = document.createElement('div');
  host.className = `fx ${className}`;
  host.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  host.append(canvas);
  return { host, canvas, ctx: canvas.getContext('2d')!, alpha, shape, cellPx, rows, ink, visible: false };
}

const odd = (n: number) => Math.max(1, n % 2 ? n : n - 1);

/** Sizes a piece's canvas to its box, and makes its surface for the places that fit. */
function fit(p: Piece, make: LightsMaker, seed: number): void {
  const box = p.host.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const W = Math.max(1, Math.round(box.width * dpr));
  const H = Math.max(1, Math.round(box.height * dpr));
  if (p.canvas.width !== W) p.canvas.width = W;
  if (p.canvas.height !== H) p.canvas.height = H;
  const placeW = (GLYPH_W + 1) * p.cellPx;
  const placeH = (GLYPH_H + 1) * p.cellPx;
  let surface: Surface;
  if (p.shape === 'stripe') {
    const across = Math.ceil(box.width / placeW) + 1;
    surface = p.surface && p.surface.X === across ? p.surface : stripeSurface(across, p.rows);
  } else if (p.shape === 'grid') {
    const across = odd(Math.floor(box.width / placeW));
    const down = odd(Math.floor(box.height / placeH));
    surface = p.surface && p.surface.X === across && p.surface.Y === down ? p.surface : stripeSurface(across, down);
  } else surface = p.surface ?? letteringSurface();
  const [pw, ph] = pictureSize(surface);
  // The scale of a cell, in device pixels: whole when it costs little, so the small letters stay sharp.
  let scale = p.shape === 'lettering' ? Math.min(W / pw, H / ph) : p.cellPx * dpr;
  if (scale >= 1 && Math.floor(scale) / scale >= 0.8) scale = Math.floor(scale);
  const w = Math.round(pw * scale);
  const h = Math.round(ph * scale);
  p.at = { x: p.shape === 'grid' ? Math.floor((W - w) / 2) : 0, y: Math.floor((H - h) / 2), w, h, smooth: scale < 1 };
  if (surface !== p.surface) {
    p.surface = surface;
    p.lights = (p.maker ?? make)(surface, seed);
    p.picture = document.createElement('canvas');
    p.picture.width = pw;
    p.picture.height = ph;
    p.image = new ImageData(pw, ph);
    p.pixels = new Uint32Array(p.image.data.buffer);
    p.glow = document.createElement('canvas');
    p.glow.width = surface.X;
    p.glow.height = surface.Y;
    p.glowImage = new ImageData(surface.X, surface.Y);
    p.glowPixels = new Uint32Array(p.glowImage.data.buffer);
    p.offsets = glyphOffsets(pw);
  }
}

function draw(p: Piece, carpet: number, still: boolean): void {
  if (!p.surface || !p.at || !p.picture || !p.glow || !p.lights) return;
  const states = still && !p.maker ? restingStates(p.surface) : p.lights.states;
  paint(p.surface, states, carpet, p.ink, p.offsets!, p.pixels!, p.glowPixels!);
  p.picture.getContext('2d')!.putImageData(p.image!, 0, 0);
  const { ctx, at } = p;
  ctx.clearRect(0, 0, p.canvas.width, p.canvas.height);
  ctx.globalAlpha = p.alpha;
  if (!still) {
    // The halo: one pixel per place, blown up soft over the place's small letter.
    p.glow.getContext('2d')!.putImageData(p.glowImage!, 0, 0);
    const [pw] = pictureSize(p.surface);
    const sx = at.w / pw;
    ctx.imageSmoothingEnabled = true;
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(p.glow, at.x - sx / 2, at.y - sx / 2, p.surface.X * (GLYPH_W + 1) * sx, p.surface.Y * (GLYPH_H + 1) * sx);
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.imageSmoothingEnabled = at.smooth;
  ctx.drawImage(p.picture, at.x, at.y, at.w, at.h);
  ctx.globalAlpha = 1;
  const steps = (p.lights as { steps?: number }).steps;
  if (p.meter && steps !== undefined) p.meter.textContent = `PASSI ${steps}`;
}

/** The variant's panel in the stage's place: a MarkovJunior program in two dimensions, as the landing says. */
async function programPiece(hero: HTMLElement): Promise<{ piece: Piece; place: () => void; remove: () => void }> {
  const { programInk, programLights } = await import('./program');
  const p = piece('fx-programma', 'grid', programInk(LETTERING.colors), 1, 2);
  p.host.removeAttribute('aria-hidden');
  p.host.setAttribute('role', 'img');
  p.host.setAttribute('aria-label', 'Un labirinto che cresce: un programma MarkovJunior in due dimensioni, scritto con le lettere della scritta');
  p.maker = (s, seed) => programLights(s, seed);
  const badge = document.createElement('span');
  badge.className = 'hero-3d-badge comic-badge green';
  badge.textContent = 'MARKOVJUNIOR 2D';
  p.meter = document.createElement('div');
  p.meter.className = 'hero-3d-meter';
  const caption = document.createElement('div');
  caption.className = 'hero-3d-caption arcade-text text-cyan';
  caption.textContent = '// PROGRAMMA: LABIRINTO //';
  p.host.append(badge, p.meter, caption);
  return {
    piece: p,
    place: () => {
      hero.classList.add('fx-senza-3d');
      (hero.querySelector('.hero-content') ?? hero).after(p.host);
    },
    remove: () => hero.classList.remove('fx-senza-3d'),
  };
}

/** The pieces of this page: the lettering in the landing's hero, a stripe under the bar, at the top of every section and of the footer. */
function piecesOf(ink: Ink): Piece[] {
  const out: Piece[] = [];
  const hero = document.querySelector<HTMLElement>('.hero');
  if (hero) {
    const p = piece('fx-scritta', 'lettering', ink, 1);
    hero.prepend(p.host);
    out.push(p);
  }
  const nav = document.querySelector<HTMLElement>('.site-nav');
  if (nav) {
    const p = piece('fx-striscia fx-barra', 'stripe', ink, 0.9, 1, 1);
    nav.append(p.host);
    out.push(p);
  }
  for (const section of document.querySelectorAll<HTMLElement>('main > section.section-wrap, main.section-wrap')) {
    const p = piece('fx-striscia fx-sezione', 'stripe', ink, 0.4, 1, 2);
    section.prepend(p.host);
    out.push(p);
  }
  const footer = document.querySelector<HTMLElement>('.site-footer');
  if (footer) {
    const p = piece('fx-striscia fx-piede', 'stripe', ink, 0.5, 1, 3);
    footer.prepend(p.host);
    out.push(p);
  }
  return out;
}

export function start(): () => void {
  const asked = new URLSearchParams(location.search).get('fx') ?? '';
  const mode = MODES[asked] ?? MODES[DEFAULT_MODE];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pieces = piecesOf(inkOf(LETTERING.colors));
  const undo: Array<() => void> = [];
  let make: LightsMaker | undefined;
  let stopped = false;
  let raf = 0;
  let timer = 0;
  let tick = 0;

  const still = () => reduced.matches;
  const carpet = () => Math.floor(tick / CARPET_EVERY);
  const refit = (p: Piece) => {
    if (!make) return;
    fit(p, make, 42 + pieces.indexOf(p) * 97);
    draw(p, still() ? 0 : carpet(), still());
  };
  const moving = () => !!make && !stopped && !document.hidden && !still() && pieces.some((p) => p.visible);
  // One frame per tick, and nothing in between: a timer waits, then the frame paints. The page is idle between two ticks.
  const frame = () => {
    raf = 0;
    if (!moving()) return;
    tick++;
    for (const p of pieces) {
      if (!p.visible || !p.lights) continue;
      p.lights.step();
      draw(p, carpet(), false);
    }
    run();
  };
  const run = () => {
    if (raf || timer || !moving()) return;
    timer = window.setTimeout(() => {
      timer = 0;
      if (moving()) raf = requestAnimationFrame(frame);
    }, TICK_MS);
  };

  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const p = pieces.find((p) => p.host === e.target);
      if (p) p.visible = e.isIntersecting;
    }
    run();
  });
  const resized = new ResizeObserver((entries) => {
    for (const e of entries) {
      const p = pieces.find((p) => p.host === e.target);
      if (p) refit(p);
    }
  });
  const onVisibility = () => run();
  const onMotion = () => {
    pieces.forEach(refit);
    run();
  };
  document.addEventListener('visibilitychange', onVisibility);
  reduced.addEventListener('change', onMotion);

  void (async () => {
    const hero = document.querySelector<HTMLElement>('.hero');
    if (mode.variant && hero) {
      const extra = await programPiece(hero);
      if (stopped) return;
      extra.place();
      pieces.push(extra.piece);
      undo.push(extra.remove);
    }
    const m = await mode.engine();
    if (stopped) return;
    make = m;
    for (const p of pieces) {
      refit(p);
      seen.observe(p.host);
      resized.observe(p.host);
    }
    run();
  })().catch(() => {
    /* an effect that does not start leaves the page as it is */
  });

  return () => {
    stopped = true;
    if (raf) cancelAnimationFrame(raf);
    if (timer) clearTimeout(timer);
    seen.disconnect();
    resized.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    reduced.removeEventListener('change', onMotion);
    for (const p of pieces) p.host.remove();
    for (const f of undo) f();
  };
}
