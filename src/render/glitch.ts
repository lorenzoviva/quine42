// Glitch as aesthetics: when the universe breaks, the screen tears, shifts and shows stray glyphs.
// Intensity 0..1. Also used, very faintly, for the occasional "crack" of a healthy world.
//
// Safe for photosensitive viewers (T316, WCAG 2.3.1): nothing fills the screen with light, nothing large
// changes brightness more than 3 times a second. What moves is a plan of the clock, not of the frame:
// tears and noise blocks hold for HOLD seconds, each glyph lives for seconds and fades in and out.
// With `still` (prefers-reduced-motion) only what does not move is drawn: scanlines, tint, ghost.

/** How long a set of tears and noise blocks stays on screen, in seconds: fewer than 3 changes a second. */
export const HOLD = 0.4;
/** The shortest and longest life of a stray glyph, in seconds. */
export const GLYPH_LIFE = [1.6, 2.8] as const;
/** How long a glyph takes to appear and to fade away, in seconds. */
export const GLYPH_FADE = 0.4;
/** How fast (1/s) the renderer brings the glitch to the brokenness of the world: it grows in about a second. */
export const GLITCH_EASE = 1.5;
/** How many stray glyphs at full intensity. */
export const GLYPH_SLOTS = 12;

const NOISE = '#$%&@!?*+=<>/\\|{}[]01ΣΔλψ∂∑≠∞';
const PINK = '#ff2a6d';
const CYAN = '#05d9e8';

/** A strip of the screen moved sideways: y and h in fractions of the height, dx in CSS pixels. */
export interface Tear { y: number; h: number; dx: number }
/** A coloured noise block: x, y in fractions of the screen, w and h in CSS pixels. */
export interface Block { x: number; y: number; w: number; h: number; color: string }
/** A stray glyph: x, y in fractions of the screen, alpha of its fade. */
export interface Glyph { slot: number; x: number; y: number; char: string; color: string; alpha: number }
export interface GlitchPlan { tears: Tear[]; blocks: Block[]; glyphs: Glyph[] }

/** A small seeded generator (mulberry32): the plan depends only on the clock, never on the frame. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** What the glitch shows at time t (seconds) with this intensity. Pure: same t, same plan. */
export function glitchPlan(t: number, intensity: number, still = false): GlitchPlan {
  const plan: GlitchPlan = { tears: [], blocks: [], glyphs: [] };
  if (!(intensity > 0.01) || still || !Number.isFinite(t)) return plan;
  const g = Math.min(1, intensity);

  // Tears and noise blocks: one set per HOLD, few and narrow.
  const r = rng(Math.floor(t / HOLD) * 2654435761);
  const slices = 1 + Math.floor(g * 5);
  for (let i = 0; i < slices; i++) plan.tears.push({ y: r(), h: (2 + r() * 10 * g) / 600, dx: (r() - 0.5) * 36 * g });
  const blocks = Math.floor(g * 5);
  for (let i = 0; i < blocks; i++)
    plan.blocks.push({ x: r(), y: r(), w: 6 + r() * 34, h: 1 + r() * 3, color: r() < 0.5 ? PINK : CYAN });

  // Glyphs: each slot lives its own life, staggered, and fades in and out; a slot comes in with the
  // intensity (which the renderer smooths), so a new fault does not pop a glyph on screen.
  {
    const n = Math.ceil(g * GLYPH_SLOTS);
    for (let slot = 0; slot < n; slot++) {
      const presence = Math.min(1, (g * GLYPH_SLOTS - slot) / 2);
      const life = GLYPH_LIFE[0] + rng(slot * 7919 + 1)() * (GLYPH_LIFE[1] - GLYPH_LIFE[0]);
      const local = t / life + slot * 0.618;
      const phase = local - Math.floor(local);
      const s = rng(Math.floor(local) * 104729 + slot * 31 + 7);
      const x = s(), y = s(), char = NOISE[Math.floor(s() * NOISE.length)], color = s() < 0.5 ? PINK : CYAN;
      const age = phase * life, fade = Math.min(age, life - age) / GLYPH_FADE;
      const alpha = Math.max(0, Math.min(1, fade)) * presence;
      if (alpha > 0) plan.glyphs.push({ slot, x, y, char, color, alpha });
    }
  }
  return plan;
}

/** The stray glyphs, on the overlay (CSS pixels: the context is already scaled). */
export function drawGlyphs(ctx: CanvasRenderingContext2D, w: number, h: number, plan: GlitchPlan, font: string): void {
  if (!plan.glyphs.length) return;
  ctx.save();
  ctx.font = `24px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const gl of plan.glyphs) {
    const x = gl.x * w, y = gl.y * h;
    ctx.globalAlpha = 0.85 * gl.alpha;
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 14, y - 14, 28, 28);
    ctx.fillStyle = gl.color;
    ctx.fillText(gl.char, x, y + 1);
  }
  ctx.restore();
}

/** The tears, ghost, scanlines, tint and noise of the plan, over the whole canvas (device pixels). */
export function applyGlitch(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  intensity: number,
  dpr: number,
  plan: GlitchPlan = glitchPlan(0, intensity, true),
): void {
  if (!(intensity > 0.01)) return;
  const g = Math.min(1, intensity);
  const w = canvas.width;
  const h = canvas.height;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Horizontal tearing.
  for (const t of plan.tears) {
    const y = t.y * h, sh = Math.max(1, t.h * h);
    ctx.drawImage(canvas, 0, y, w, sh, t.dx * dpr, y, w, sh);
  }

  // Chromatic ghost: a fixed offset, it does not move.
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.12 * g;
  ctx.drawImage(canvas, 3 * dpr * g, 0);
  ctx.globalAlpha = 0.08 * g;
  ctx.drawImage(canvas, -3 * dpr * g, 1 * dpr);

  // A dim red tint: the world is not well.
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 0.07 * g;
  ctx.fillStyle = '#3a0010';
  ctx.fillRect(0, 0, w, h);

  // Scanlines.
  ctx.globalAlpha = 0.06 + 0.14 * g;
  ctx.fillStyle = '#000';
  for (let y = 0; y < h; y += 3 * dpr) ctx.fillRect(0, y, w, dpr);

  // Noise blocks.
  ctx.globalAlpha = 0.35 * g;
  for (const b of plan.blocks) {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x * w, b.y * h, b.w * dpr, b.h * dpr);
  }
  ctx.restore();
}

/** How long the rare crack of a healthy world lasts, in seconds: it rises and falls, it never pops. */
export const CRACK = 0.8;

/** The intensity of the crack with `left` seconds still to go: a soft arch up to 0.22. */
export function crackLevel(left: number): number {
  if (!(left > 0)) return 0;
  return 0.22 * Math.sin(Math.PI * Math.min(1, left / CRACK));
}
