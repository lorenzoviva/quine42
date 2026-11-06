// The labels on the tiles of the pipeline's web page (T304): priority, effort and step, each with its colour. The page gets
// these very functions through `toString()`, so they use nothing from outside. Every colour is a CSS style for a badge on
// the dark theme of the page: a dark background, a light text and a border of the same hue.

/** The style of a badge of hue `hue` (0-360): dark background, light text, so it reads on the page's dark panels. */
export function badgeStyle(hue, saturation = 70) {
  const h = Math.round(((Number(hue) % 360) + 360) % 360);
  return `background:hsl(${h} ${saturation}% 20%);color:hsl(${h} ${Math.min(100, saturation + 20)}% 80%);border:1px solid hsl(${h} ${saturation}% 38%)`;
}

/**
 * The priority's colour: the most urgent (priority 1) is red, then orange, yellow, green, up to blue at 100 (the default
 * of a task without priority) and beyond. The scale is logarithmic, because the priorities that count are the small ones.
 */
export function priorityStyle(priority) {
  const p = Number.isFinite(Number(priority)) ? Math.max(1, Number(priority)) : 100;
  const hue = 220 * Math.min(1, Math.log(p) / Math.log(100));
  return badgeStyle(hue);
}

/** The effort's colour, one scale from `low` (cool, teal) to `max` (hot, magenta); an unknown effort is grey. */
export function effortStyle(effort) {
  const order = ['low', 'medium', 'high', 'extra', 'xhigh', 'max'];
  const i = order.indexOf(String(effort ?? '').toLowerCase());
  if (i < 0) return badgeStyle(220, 10);
  return badgeStyle(180 + (i * (320 - 180)) / (order.length - 1), 60 + i * 6);
}

/**
 * The step's colour: a hue from a hash of its number, so different steps have different colours and a step has the same
 * one at every load (and in every browser). `undefined` without a step: the tile then has no step label.
 */
export function stepStyle(step) {
  if (step === undefined || step === null || step === '' || !Number.isFinite(Number(step))) return undefined;
  let h = (Math.trunc(Number(step)) + 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return badgeStyle(h % 360, 55 + ((h >>> 9) % 4) * 8);
}
