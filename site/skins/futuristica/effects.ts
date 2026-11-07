// What moves in the futuristic skin (T284, T315, ADR-0151, ADR-0164): the lettering of the proposal, big, at the top of the landing's
// hero; stripes of the same small text along every page, fainter; and on the landing, in a section of its own under the hero, a maze of
// the same letters (program.ts). The small letters slide along their rows like a carpet, lights run over them like a program being
// compiled (heads along the rows, waves through a big letter), the maze grows and lights its longest path. Only what is on screen moves,
// a tick at a time, in one frame or, on a slow machine, a few; nothing moves with the tab hidden or with `prefers-reduced-motion`, where
// the lettering stands as the proposal drew it and the maze stands finished.
//
// The lights are a MarkovJunior program run by the game's engine and kept on its grid between ticks (lights-mj.ts): the author asked
// for MarkovJunior along the page, and kept on its grid it costs about what plain loops cost (docs/architettura-dettagli.md#sito).
// `?fx=semplice` puts in its place the same lights written as plain loops (lights-simple.ts), to measure one against the other; whatever
// else is asked is the default.

import { LETTERING } from './scritta';
import { mazeInk, programLights, type MazeLights } from './program';
import { GLYPH_H, GLYPH_W, glyphOffsets, inkOf, letteringSurface, paint, pictureSize, restingStates, stripeSurface, type Ink, type Lights, type LightsMaker, type Surface } from './surface';

/** A tick of the lights. */
const TICK_MS = 90;
/** The carpet moves one small letter every so many ticks. */
const CARPET_EVERY = 3;
const MODES: Record<string, () => Promise<LightsMaker>> = {
  mj: async () => (await import('./lights-mj')).mjLights,
  semplice: async () => (await import('./lights-simple')).simpleLights,
};
const DEFAULT_MODE = 'mj';
/** Each row of the maze starts this many letters after the one above, so that its small Qs do not stand in columns. */
const MAZE_SHIFT = 3;
/**
 * Milliseconds a frame may give the effects: past them, what is left of the tick goes to the next frame. A fast machine paints a tick
 * in one frame (one picture for the compositor, not one per piece); a slow one spreads it, and no frame carries all the pieces.
 * (Guessing each piece's cost to give the maze a frame of its own was tried: more frames, more work, the same longest one.)
 */
const FRAME_BUDGET_MS = 4;

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
  /** Its own lights (the maze's program), instead of the page's engine. */
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
  /** What it painted last: a tick that changes nothing paints nothing. */
  painted?: Uint8Array;
  paintedCarpet?: number;
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
    surface = p.surface && p.surface.X === across && p.surface.Y === down ? p.surface : stripeSurface(across, down, MAZE_SHIFT);
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
    p.painted = undefined;
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
  if (p.painted?.length !== states.length) p.painted = new Uint8Array(states.length);
  p.painted.set(states);
  p.paintedCarpet = still ? -1 : carpet;
}

/** Whether a piece shows now what it painted last. */
function unchanged(p: Piece, carpet: number): boolean {
  const states = p.lights!.states;
  const painted = p.painted;
  if (!painted || p.paintedCarpet !== carpet || painted.length !== states.length) return false;
  for (let i = 0; i < states.length; i++) if (painted[i] !== states[i]) return false;
  return true;
}

/**
 * The maze, in a section of its own under the landing's hero: the band of the stage's frame, with the program's name and steps written
 * over it on their own dark ground, so they stay readable over the lit paths.
 */
function mazeSection(hero: HTMLElement): { piece: Piece; section: HTMLElement } {
  const section = document.createElement('section');
  section.className = 'section-wrap fx-labirinto';
  const p = piece('fx-programma', 'grid', mazeInk(LETTERING.colors), 1, 2);
  p.host.removeAttribute('aria-hidden');
  p.host.setAttribute('role', 'img');
  p.host.setAttribute('aria-label', 'Un labirinto che si scrive: un programma MarkovJunior in due dimensioni, fatto con le lettere della scritta. Cresce dal centro, poi accende la via più lunga.');
  p.maker = programLights;
  const badge = document.createElement('span');
  badge.className = 'hero-3d-badge comic-badge green';
  badge.textContent = 'MARKOVJUNIOR 2D';
  p.meter = document.createElement('div');
  p.meter.className = 'hero-3d-meter';
  const caption = document.createElement('div');
  caption.className = 'hero-3d-caption arcade-text text-cyan';
  caption.textContent = '// PROGRAMMA: LABIRINTO //';
  p.host.append(badge, p.meter, caption);
  section.append(p.host);
  hero.after(section);
  return { piece: p, section };
}

/** The pieces of this page: the lettering and the maze on the landing, a stripe under the bar, at the top of every section and of the footer. */
function piecesOf(ink: Ink, added: HTMLElement[]): Piece[] {
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
  if (hero) {
    const maze = mazeSection(hero);
    added.push(maze.section);
    out.push(maze.piece);
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
  const engine = MODES[asked] ?? MODES[DEFAULT_MODE];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const added: HTMLElement[] = [];
  const pieces = piecesOf(inkOf(LETTERING.colors), added);
  let make: LightsMaker | undefined;
  let stopped = false;
  let raf = 0;
  let timer = 0;
  let tick = 0;
  /** The pieces still to step in this tick: as many a frame as its budget allows. */
  let queue: Piece[] = [];

  const still = () => reduced.matches;
  const carpet = () => Math.floor(tick / CARPET_EVERY);
  const refit = (p: Piece) => {
    if (!make) return;
    fit(p, make, 42 + pieces.indexOf(p) * 97);
    if (still()) (p.lights as Partial<MazeLights>).settle?.();
    draw(p, still() ? 0 : carpet(), still());
  };
  const moving = () => !!make && !stopped && !document.hidden && !still() && pieces.some((p) => p.visible);
  const frame = () => {
    raf = 0;
    if (!moving()) return;
    const t0 = performance.now();
    while (queue.length) {
      const p = queue.shift()!;
      if (p.visible && p.lights) {
        p.lights.step();
        if (!unchanged(p, carpet())) draw(p, carpet(), false);
      }
      if (performance.now() - t0 >= FRAME_BUDGET_MS) break;
    }
    if (queue.length) raf = requestAnimationFrame(frame);
  };
  // A timer marks the ticks; in between the page is idle, and a tick's pieces take one frame, or more when a frame's budget runs out.
  const run = () => {
    if (timer || !moving()) return;
    timer = window.setTimeout(() => {
      timer = 0;
      if (!moving()) return;
      tick++;
      queue = pieces.filter((p) => p.visible && p.lights);
      if (!raf && queue.length) raf = requestAnimationFrame(frame);
      run();
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

  void engine()
    .then((m) => {
      if (stopped) return;
      make = m;
      for (const p of pieces) {
        refit(p);
        seen.observe(p.host);
        resized.observe(p.host);
      }
      run();
    })
    .catch(() => {
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
    for (const el of added) el.remove();
  };
}
