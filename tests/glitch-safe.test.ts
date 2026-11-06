// T316: the glitch of a broken world is safe for photosensitive viewers (WCAG 2.3.1): no full-screen
// flash, fewer than 3 changes a second of what moves, glyphs that last and fade, nothing moves when
// prefers-reduced-motion asks for stillness. A fake clock at 60 Hz and a fake 2D context.

import { describe, expect, it } from 'vitest';
import { CRACK, GLITCH_EASE, GLYPH_FADE, GLYPH_LIFE, applyGlitch, crackLevel, drawGlyphs, glitchPlan, type GlitchPlan } from '../src/render/glitch';

const FPS = 60;
const SECONDS = 20;
const frames = (fn: (t: number) => void, every = 1) => {
  for (let i = 0; i < FPS * SECONDS; i += every) fn(i / FPS);
};

/** A 2D context that records what is filled, with which composite operation and alpha. */
function fakeContext() {
  const fills: Array<{ x: number; y: number; w: number; h: number; style: string; alpha: number; op: string }> = [];
  const ctx = {
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillStyle: '#000',
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    save() {},
    restore() {},
    setTransform() {},
    drawImage() {},
    fillText() {},
    fillRect(x: number, y: number, w: number, h: number) {
      fills.push({ x, y, w, h, style: String(this.fillStyle), alpha: this.globalAlpha, op: this.globalCompositeOperation });
    },
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, fills };
}

const canvas = { width: 1920, height: 1080 } as HTMLCanvasElement;
const key = (p: GlitchPlan) => JSON.stringify([p.tears, p.blocks]);

describe('T316: il glitch dei guasti senza flash', () => {
  it('niente riempimenti chiari a pieno schermo, niente inversione, e ciò che copre lo schermo non cambia', () => {
    for (const g of [0.22, 0.3, 0.6, 1]) {
      const seen = new Set<string>();
      frames((t) => {
        const { ctx, fills } = fakeContext();
        applyGlitch(ctx, canvas, g, 1, glitchPlan(t, g));
        for (const f of fills) {
          expect(f.op).not.toBe('difference');
          const big = (f.w * f.h) / (canvas.width * canvas.height) > 0.1;
          if (big) {
            expect(f.style.toLowerCase()).not.toMatch(/^#f{3}(f{3})?$/);
            expect(f.alpha).toBeLessThanOrEqual(0.1);
            seen.add(`${f.style}:${f.alpha}`);
          }
        }
      }, 7);
      // The full-screen tint is one and the same on every frame.
      expect(seen.size).toBeLessThanOrEqual(1);
    }
  });

  it('strappi e blocchi di rumore cambiano meno di 3 volte al secondo e restano qualche frame', () => {
    for (const g of [0.3, 1]) {
      let changes = 0, last = '', run = 0, shortest = Infinity;
      frames((t) => {
        const k = key(glitchPlan(t, g));
        if (k !== last && last) {
          changes++;
          shortest = Math.min(shortest, run);
          run = 0;
        }
        run++;
        last = k;
      });
      expect(changes / SECONDS).toBeLessThan(3);
      expect(shortest).toBeGreaterThanOrEqual(20); // at least a third of a second
    }
  });

  it('gli strappi sono stretti e poco spostati', () => {
    frames((t) => {
      const p = glitchPlan(t, 1);
      expect(p.tears.length).toBeLessThanOrEqual(6);
      for (const tear of p.tears) {
        expect(Math.abs(tear.dx)).toBeLessThanOrEqual(18);
        expect(tear.h * canvas.height).toBeLessThan(25);
      }
    });
  });

  it('i glifi restano almeno 1,6 s, appaiono e spariscono sfumando, cambiano poche volte al secondo', () => {
    for (const g of [0.3, 1]) {
      const born = new Map<number, { char: string; x: number; at: number }>();
      const alpha = new Map<number, number>();
      let changes = 0, shortest = Infinity;
      frames((t) => {
        const p = glitchPlan(t, g);
        const present = new Set<number>();
        for (const gl of p.glyphs) {
          present.add(gl.slot);
          const was = born.get(gl.slot);
          if (!was || was.char !== gl.char || was.x !== gl.x) {
            if (was) {
              changes++;
              if (was.at > 0) shortest = Math.min(shortest, t - was.at); // the first life starts before the clock
            }
            born.set(gl.slot, { char: gl.char, x: gl.x, at: t });
          }
          // Fades: no glyph jumps from nothing to full in one frame.
          const before = alpha.get(gl.slot) ?? 0;
          if (t > 0) expect(Math.abs(gl.alpha - before)).toBeLessThanOrEqual(1 / FPS / GLYPH_FADE + 1e-6);
          alpha.set(gl.slot, gl.alpha);
        }
        for (const slot of alpha.keys()) if (!present.has(slot)) {
          expect(alpha.get(slot)!).toBeLessThanOrEqual(1 / FPS / GLYPH_FADE + 1e-6);
          alpha.set(slot, 0);
        }
      });
      expect(shortest).toBeGreaterThanOrEqual(GLYPH_LIFE[0] - 2 / FPS);
      expect(changes / SECONDS).toBeLessThanOrEqual(g === 1 ? 8 : 3);
    }
  });

  it("quando un guasto si apre i glifi entrano sfumando con l'intensità", () => {
    let level = 0;
    const alpha = new Map<number, number>();
    frames((t) => {
      const target = t < 5 ? 0.3 : t < 10 ? 0.45 : 1; // one fault, two, many
      level += (target - level) * Math.min(1, GLITCH_EASE / FPS); // as the renderer smooths it
      const seen = new Set<number>();
      for (const gl of glitchPlan(t, level).glyphs) {
        seen.add(gl.slot);
        expect(Math.abs(gl.alpha - (alpha.get(gl.slot) ?? 0))).toBeLessThanOrEqual(0.12);
        alpha.set(gl.slot, gl.alpha);
      }
      for (const slot of alpha.keys()) if (!seen.has(slot)) alpha.set(slot, 0);
    });
  });

  it('i glifi si disegnano dal piano, mai a caso', () => {
    const plan = glitchPlan(3.3, 1);
    const a = fakeContext(), b = fakeContext();
    drawGlyphs(a.ctx, 800, 600, plan, 'monospace');
    drawGlyphs(b.ctx, 800, 600, glitchPlan(3.3, 1), 'monospace');
    expect(a.fills).toEqual(b.fills);
    expect(a.fills.length).toBe(plan.glyphs.length);
  });

  it('con prefers-reduced-motion il glitch resta statico: niente strappi, blocchi né glifi, scanline e tinta sì', () => {
    frames((t) => {
      const p = glitchPlan(t, 1, true);
      expect(p.tears.length + p.blocks.length + p.glyphs.length).toBe(0);
    });
    const { ctx, fills } = fakeContext();
    applyGlitch(ctx, canvas, 1, 1, glitchPlan(1, 1, true));
    expect(fills.some((f) => f.w === canvas.width && f.h === canvas.height)).toBe(true); // the tint
    expect(fills.filter((f) => f.h === 1).length).toBeGreaterThan(100); // the scanlines
  });

  it('la crepa del mondo sano sale e scende, non scatta', () => {
    expect(crackLevel(0)).toBe(0);
    expect(crackLevel(-1)).toBe(0);
    expect(crackLevel(Number.NaN)).toBe(0);
    let prev = 0, peak = 0;
    for (let left = CRACK; left >= 0; left -= 1 / FPS) {
      const c = crackLevel(left);
      expect(Math.abs(c - prev)).toBeLessThan(0.02);
      peak = Math.max(peak, c);
      prev = c;
    }
    expect(peak).toBeGreaterThan(0.2);
    expect(peak).toBeLessThanOrEqual(0.22);
  });

  it('il kernel che dà NaN o niente non disegna', () => {
    for (const g of [0, -1, Number.NaN]) {
      const { ctx, fills } = fakeContext();
      applyGlitch(ctx, canvas, g, 1, glitchPlan(1, g));
      expect(fills.length).toBe(0);
    }
    expect(glitchPlan(Number.NaN, 1).glyphs.length).toBe(0);
  });
});
