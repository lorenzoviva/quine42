// The «fumetto» skin (T285): its drawings are what genera.ts writes, the Q is one body, the palette keeps to the inks of the logo, and the dots move only when they may.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DRIFT, DRIFT_TIMING, start } from '../site/skins/fumetto/effects';
import { INK, PROPOSAL_Q, drawings, letterQ } from '../site/skins/fumetto/genera';

const DIR = path.resolve(__dirname, '../site/skins/fumetto');
const read = (file: string) => readFileSync(path.join(DIR, file), 'utf8');
const css = read('skin.css');
const token = (name: string) => css.match(new RegExp(`--skin-${name}:\\s*(#[0-9a-f]{6});`, 'i'))?.[1];

/** WCAG contrast of two #rrggbb colours. */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

describe('the drawings', () => {
  it.each(Object.keys(drawings()))('%s is what genera.ts writes', (file) => {
    expect(read(file)).toBe(drawings()[file]);
  });

  it('the Q is one outline and its counter, with no tail laid over the ring', () => {
    const q = letterQ();
    expect(q.match(/M/g)).toHaveLength(2);
    expect(q).not.toContain(PROPOSAL_Q.tail);
    for (const file of ['logo.svg', 'icona.svg']) {
      expect(read(file)).not.toContain(PROPOSAL_Q.tail);
      expect(read(file)).toContain(q);
    }
    // The counter is the proposal's.
    expect(q.slice(q.indexOf('Z') + 1)).toBe(PROPOSAL_Q.ring.slice(PROPOSAL_Q.ring.indexOf('Z') + 1));
  });

  it('the dots of the letters are the pink printed over their face, not a fourth ink', () => {
    const multiply = (a: string, b: string) =>
      `#${[1, 3, 5].map((i) => Math.round((parseInt(a.slice(i, i + 2), 16) * parseInt(b.slice(i, i + 2), 16)) / 255).toString(16).padStart(2, '0')).join('')}`;
    expect(INK.overYellow).toBe(multiply(INK.yellow, INK.pink));
    expect(INK.overCyan).toBe(multiply(INK.cyan, INK.pink));
    expect(read('logo.svg')).not.toContain('#9d00ff');
  });
});

describe('the palette', () => {
  it('declares the inks of the drawings', () => {
    expect(token('primary')).toBe(INK.yellow);
    expect(token('accent')).toBe(INK.cyan);
    expect(token('accent-2')).toBe(INK.pink);
    expect(token('ink')).toBe(INK.black);
    expect(token('danger')).toBe(INK.overYellow);
  });

  it('writes in black ink on every bright colour, above 4.5:1', () => {
    for (const fill of ['primary', 'accent', 'accent-2', 'success', 'danger', 'rare']) {
      const on = fill === 'accent-2' || fill === 'rare' ? token('on-accent-2') : token('on-bright');
      expect(on, fill).toBe(INK.black);
      expect(contrast(on as string, token(fill) as string), fill).toBeGreaterThan(4.5);
    }
  });

  it('keeps the texts readable on the night, and on the dots of the pages at their thickest', () => {
    // The night of the page goes from the background to the panel's colour (--skin-page-background), and the dots lie on both.
    const night = [token('bg') as string, token('panel') as string];
    expect(css).toContain(`--skin-page-background: linear-gradient(180deg, ${night[0]} 0%, ${night[1]} 100%);`);
    const opacity = Number(css.match(/body::before \{[^}]*opacity:\s*([\d.]+)/)?.[1]);
    expect(opacity).toBeGreaterThan(0);
    const dot = (ink: string, under: string) =>
      `#${[1, 3, 5].map((i) => Math.round(parseInt(ink.slice(i, i + 2), 16) * opacity + parseInt(under.slice(i, i + 2), 16) * (1 - opacity)).toString(16).padStart(2, '0')).join('')}`;
    for (const text of ['text', 'text-dim', 'primary', 'accent']) {
      for (const under of night.flatMap((n) => [n, dot(INK.pink, n), dot(INK.cyan, n)])) expect(contrast(token(text) as string, under), `${text} on ${under}`).toBeGreaterThan(4.5);
    }
  });
});

describe('the motion of the dots', () => {
  let visibility: DocumentVisibilityState;
  let lessMotion: boolean;
  let docListeners: Map<string, () => void>;
  let mediaListeners: Map<string, () => void>;
  let animation: { play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn>; cancel: ReturnType<typeof vi.fn> };
  let animate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    visibility = 'visible';
    lessMotion = false;
    docListeners = new Map();
    mediaListeners = new Map();
    animation = { play: vi.fn(), pause: vi.fn(), cancel: vi.fn() };
    animate = vi.fn(() => animation);
    vi.stubGlobal('KeyframeEffect', class {
      get pseudoElement() {
        return null;
      }
    });
    vi.stubGlobal('document', {
      body: { animate },
      get visibilityState() {
        return visibility;
      },
      addEventListener: (type: string, fn: () => void) => docListeners.set(type, fn),
      removeEventListener: (type: string) => docListeners.delete(type),
    });
    vi.stubGlobal('window', {
      matchMedia: () => ({
        get matches() {
          return lessMotion;
        },
        addEventListener: (type: string, fn: () => void) => mediaListeners.set(type, fn),
        removeEventListener: (type: string) => mediaListeners.delete(type),
      }),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('drifts the halftone layer, slowly, and only it', () => {
    start();
    expect(animate).toHaveBeenCalledWith(DRIFT, DRIFT_TIMING);
    expect(DRIFT_TIMING.pseudoElement).toBe('::before');
    expect(Number(DRIFT_TIMING.duration)).toBeGreaterThanOrEqual(21_000);
    expect(animation.play).toHaveBeenCalled();
  });

  it('stops with the tab hidden and goes on when it comes back', () => {
    start();
    visibility = 'hidden';
    docListeners.get('visibilitychange')?.();
    expect(animation.pause).toHaveBeenCalledTimes(1);
    visibility = 'visible';
    animation.play.mockClear();
    docListeners.get('visibilitychange')?.();
    expect(animation.play).toHaveBeenCalledTimes(1);
  });

  it('never moves for whoever asked for less motion, and stops if they ask while it moves', () => {
    lessMotion = true;
    start();
    expect(animate).not.toHaveBeenCalled();
    lessMotion = false;
    mediaListeners.get('change')?.();
    expect(animate).toHaveBeenCalledTimes(1);
    lessMotion = true;
    mediaListeners.get('change')?.();
    expect(animation.cancel).toHaveBeenCalled();
  });

  it('leaves the page still where a pseudo-element cannot be animated', () => {
    vi.stubGlobal('KeyframeEffect', class {});
    start();
    expect(animate).not.toHaveBeenCalled();
  });

  it('stops everything when the skin changes', () => {
    const stop = start();
    stop();
    expect(animation.cancel).toHaveBeenCalled();
    expect(docListeners.size).toBe(0);
    expect(mediaListeners.size).toBe(0);
  });
});
