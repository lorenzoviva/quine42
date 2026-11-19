// The look of what has no model of its own (T430): the generic thing of the seed (`models/object.xml`) is a star of four points, and here is
// how it moves: it turns and stretches in height and width, as the flash of a tube screen going out. Only the renderer moves it, at its frame:
// the kernel knows nothing of it. Pure, without three.js: the inventory's icons say the same with a CSS animation (`.icon.star`, style.css).

/** The generic model of the class `object`, what `Forms.resolve` gives an item or a thing without a model of its own. */
export const STAR = 'object';

/** Whether a look is the star: the generic thing, not a model of one's own. */
export const isStar = (model: string | undefined): boolean => model === STAR;

/** How it moves at time `t` (seconds), out of step with the others by `phase`: its turn (radians), its width and its height (1 is as made). */
export function starPulse(t: number, phase = 0): { spin: number; width: number; height: number } {
  const tt = Number.isFinite(t) ? t : 0;
  const p = Number.isFinite(phase) ? phase : 0;
  // A slow breath, wider while lower, and now and then a quick squeeze, as a flash narrowing to a line.
  const breath = Math.sin(tt * 2.2 + p);
  const flash = Math.pow(Math.max(0, Math.sin(tt * 0.9 + p * 1.7)), 12);
  return {
    spin: tt * 0.9 + p,
    width: 1 + 0.16 * breath - 0.45 * flash,
    height: 1 - 0.14 * breath + 0.25 * flash,
  };
}
