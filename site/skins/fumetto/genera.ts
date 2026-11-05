// The drawings of the «fumetto» skin (T285): the lettering and the icon of proposal 01 (Claude, v2, docs/design/logo/proposte/claude/), and the halftone of the pages.
// `npx vite-node site/skins/fumetto/genera.ts -- --scrivi` writes logo.svg, icona.svg, pois-rosa.svg and pois-ciano.svg next to this file; tests/site-skin-fumetto.test.ts checks
// that the files are what this writes. The shapes of the letters are the proposal's, as they are; what changes:
// - the Q is one body: the ring and the tail are united, with rounded joins, so no outline crosses the letter and the counter stays whole (the tail of the proposal was a
//   stick laid on the ring, each with its own outline);
// - the halftone of the letters is the pink ink printed over the face (yellow + pink = red, cyan + pink = blue), not violet: violet over yellow took 70 % of its chroma;
// - the copies of the extrusion are <use> of one word, and each row of dots is a dashed line: the same drawing in 4 KB instead of 105.
// Not served (only the files of server/skins.ts's list are) and not bundled (site/skin.ts takes only effects.ts): it runs by hand.

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The inks of the skin: they are also its tokens in skin.css. */
export const INK = {
  yellow: '#ffe600',
  cyan: '#00f0ff',
  pink: '#ff2a85',
  black: '#07040d',
  /** Pink printed over yellow, and over cyan: the colour of the dots on each face (the product of the two, channel by channel). */
  overYellow: '#ff2600',
  overCyan: '#002885',
} as const;

// --- Geometry: cubic Béziers as four points --------------------------------------------------------------------------

interface Pt {
  x: number;
  y: number;
}
type Curve = [Pt, Pt, Pt, Pt];

const P = (x: number, y: number): Pt => ({ x, y });
const add = (a: Pt, b: Pt) => P(a.x + b.x, a.y + b.y);
const sub = (a: Pt, b: Pt) => P(a.x - b.x, a.y - b.y);
const scale = (a: Pt, k: number) => P(a.x * k, a.y * k);
const lerp = (a: Pt, b: Pt, t: number) => P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
const length = (a: Pt) => Math.hypot(a.x, a.y);

function at(c: Curve, t: number): Pt {
  const [p0, p1, p2, p3] = c;
  const a = lerp(p0, p1, t), b = lerp(p1, p2, t), d = lerp(p2, p3, t);
  return lerp(lerp(a, b, t), lerp(b, d, t), t);
}

function split(c: Curve, t: number): [Curve, Curve] {
  const [p0, p1, p2, p3] = c;
  const a = lerp(p0, p1, t), b = lerp(p1, p2, t), d = lerp(p2, p3, t), e = lerp(a, b, t), f = lerp(b, d, t), g = lerp(e, f, t);
  return [[p0, a, e, g], [g, f, d, p3]];
}

/** The piece of a curve between two parameters. */
const piece = (c: Curve, t0: number, t1: number): Curve => (t0 <= 0 ? split(c, t1)[0] : split(split(c, t1)[0], t0 / t1)[1]);

/** Where a curve crosses the segment a→b: the curve's parameter `t` and the point. */
function crossing(c: Curve, a: Pt, b: Pt): { t: number; p: Pt } {
  const normal = P(a.y - b.y, b.x - a.x);
  const side = (t: number) => {
    const p = at(c, t);
    return (p.x - a.x) * normal.x + (p.y - a.y) * normal.y;
  };
  const steps = 400;
  for (let i = 1; i <= steps; i++) {
    let lo = (i - 1) / steps, hi = i / steps;
    if (side(lo) * side(hi) > 0) continue;
    for (let k = 0; k < 60; k++) {
      const mid = (lo + hi) / 2;
      if (side(lo) * side(mid) <= 0) hi = mid;
      else lo = mid;
    }
    const t = (lo + hi) / 2, p = at(c, t), d = sub(b, a);
    const u = ((p.x - a.x) * d.x + (p.y - a.y) * d.y) / (d.x * d.x + d.y * d.y);
    if (u > 0 && u < 1) return { t, p };
  }
  throw new Error('the tail does not cross the ring');
}

/** The parameter `distance` away along the curve from `t0`, forwards (+1) or backwards (-1). */
function walk(c: Curve, t0: number, distance: number, direction: 1 | -1): number {
  let travelled = 0, t = t0, p = at(c, t);
  const dt = direction * 1e-4;
  while (travelled < distance && t + dt >= 0 && t + dt <= 1) {
    const q = at(c, t + dt);
    travelled += length(sub(q, p));
    p = q;
    t += dt;
  }
  return t;
}

const line = (a: Pt, b: Pt): Curve => [a, lerp(a, b, 1 / 3), lerp(a, b, 2 / 3), b];
/** A rounded join from A to B in place of the sharp corner J. */
const round = (a: Pt, j: Pt, b: Pt): Curve => [a, lerp(a, j, 0.55), lerp(b, j, 0.55), b];

const num = (v: number): string => {
  const r = Math.round(v * 100) / 100;
  return String(Object.is(r, -0) ? 0 : r);
};

function pathOf(curves: Curve[]): string {
  let d = `M${num(curves[0][0].x)} ${num(curves[0][0].y)}`;
  for (const c of curves) {
    const straight = length(sub(c[1], lerp(c[0], c[3], 1 / 3))) < 1e-6 && length(sub(c[2], lerp(c[0], c[3], 2 / 3))) < 1e-6;
    if (straight && length(sub(c[3], c[0])) < 1e-6) continue;
    d += straight ? `L${num(c[3].x)} ${num(c[3].y)}` : `C${num(c[1].x)} ${num(c[1].y)} ${num(c[2].x)} ${num(c[2].y)} ${num(c[3].x)} ${num(c[3].y)}`;
  }
  return `${d}Z`;
}

// --- The Q ---------------------------------------------------------------------------------------------------------------

/** The ring of the proposal (outside clockwise, the counter the other way) and its tail, the quadrilateral 54,78 76,66 116,128 92,138. */
const RING: Curve[] = [
  [P(55, 0), P(88, 0), P(110, 26), P(110, 62)],
  [P(110, 62), P(110, 98), P(88, 124), P(55, 124)],
  [P(55, 124), P(22, 124), P(0, 98), P(0, 62)],
  [P(0, 62), P(0, 26), P(22, 0), P(55, 0)],
];
const COUNTER: Curve[] = [
  [P(55, 28), P(40, 28), P(31, 42), P(31, 62)],
  [P(31, 62), P(31, 82), P(40, 96), P(55, 96)],
  [P(55, 96), P(70, 96), P(79, 82), P(79, 62)],
  [P(79, 62), P(79, 42), P(70, 28), P(55, 28)],
];
const TAIL = [P(54, 78), P(76, 66), P(116, 128), P(92, 138)] as const;

/** The two paths of the proposal's Q, ring and tail: what the new one replaces. */
export const PROPOSAL_Q = { ring: pathOf([...RING]) + pathOf([...COUNTER]), tail: 'M54 78L76 66L116 128L92 138Z' };

/**
 * The Q as one outline: the tail starts inside the ring's stroke (not in the counter) and leaves it at the bottom right, where the two meet with joins of radius `join`.
 * The counter is the proposal's.
 */
export function letterQ(join = 12): string {
  // The tail's top, moved along its two long sides until it lies within the stroke of the ring.
  const [topLeft, topRight, bottomRight, bottomLeft] = TAIL;
  const right = [lerp(topRight, bottomRight, 0.3), bottomRight] as const;
  const left = [bottomLeft, lerp(bottomLeft, topLeft, 0.55)] as const;
  const arc = RING[1];
  const out = crossing(arc, right[0], right[1]);
  const back = crossing(arc, left[0], left[1]);
  const along = (a: Pt, b: Pt) => scale(sub(b, a), 1 / length(sub(b, a)));
  const r1 = Math.min(join, 0.45 * length(sub(out.p, bottomRight)));
  const r2 = Math.min(join, 0.45 * length(sub(back.p, bottomLeft)));
  const t1 = walk(arc, out.t, r1, -1), t2 = walk(arc, back.t, r2, 1);
  const a1 = at(arc, t1), b1 = add(out.p, scale(along(right[0], right[1]), r1));
  const b2 = add(back.p, scale(along(left[1], left[0]), r2)), a2 = at(arc, t2);
  const outline: Curve[] = [
    RING[0],
    piece(arc, 0, t1),
    round(a1, out.p, b1),
    line(b1, bottomRight),
    line(bottomRight, bottomLeft),
    line(bottomLeft, b2),
    round(b2, back.p, a2),
    piece(arc, t2, 1),
    RING[2],
    RING[3],
  ];
  return pathOf(outline) + pathOf(COUNTER);
}

// --- The lettering ---------------------------------------------------------------------------------------------------------

type Face = 'yellow' | 'cyan';
interface Letter {
  id: string;
  face: Face;
  at: string;
  d: string;
}

/** The other letters of the proposal, with where each stands. `face` is its ink. */
const LETTERS: Letter[] = [
  { id: 'u', face: 'cyan', at: 'translate(122 36) rotate(3 35 50)', d: 'M0 0H26V66Q26 76 35 76Q44 76 44 66V0H70V68Q70 100 35 100Q0 100 0 68Z' },
  { id: 'i', face: 'cyan', at: 'translate(190 30) rotate(-2 14 50)', d: 'M-2 0H30L27 100H1Z' },
  { id: 'n', face: 'cyan', at: 'translate(216 35) rotate(2 37 50)', d: 'M0 0H24L50 52V0H74V100H52L24 46V100H0Z' },
  { id: 'e', face: 'cyan', at: 'translate(288 31) rotate(-3 31 50)', d: 'M0 0H60L57 22H25V39H52V60H25V78H60L62 100H0Z' },
  { id: 'f', face: 'yellow', at: 'translate(348 8) rotate(4 46 62)', d: 'M50 0H80V76H92V100H80V124H54V100H0V78ZM54 40L24 76H54Z' },
  { id: 't', face: 'yellow', at: 'translate(438 8) rotate(-2 41 62)', d: 'M6 30C10 10 26 0 44 0C68 0 82 16 82 38C82 58 70 72 50 88L38 98H82V124H0V102L40 66C52 55 56 48 56 40C56 30 50 25 42 25C34 25 30 30 28 40Z' },
];
/** The steps of the extrusion, from the back. */
const DEPTH = [10.4, 9.1, 7.8, 6.5, 5.2, 3.9, 2.6, 1.3];
const DOT_INK: Record<Face, string> = { yellow: INK.overYellow, cyan: INK.overCyan };

export function lettering(): string {
  const letters: Letter[] = [{ id: 'q', face: 'yellow', at: 'translate(14 8) rotate(-4 55 62)', d: letterQ() }, ...LETTERS];
  const defs = letters.map((l) => `<path id="${l.id}" transform="${l.at}" d="${l.d}"/>`).join('');
  const word = `<g id="w">${letters.map((l) => `<use href="#${l.id}"/>`).join('')}</g>`;
  const extrusion = (attributes: string) => `<g ${attributes}>${DEPTH.map((k) => `<use href="#w" transform="translate(${k} ${k})"/>`).join('')}</g>`;
  const faces = `<g stroke="${INK.black}" stroke-width="8" stroke-linejoin="round">${letters.map((l) => `<use href="#${l.id}" fill="${INK[l.face]}"/>`).join('')}</g>`;
  const faceList: Face[] = ['yellow', 'cyan'];
  const clips = faceList.map((face) => `<clipPath id="on-${face}" clip-rule="evenodd">${letters.filter((l) => l.face === face).map((l) => `<use href="#${l.id}"/>`).join('')}</clipPath>`).join('');
  // The halftone of the proposal: rows 6 apart from y 78, the dots growing from 0.48 to 2.4, every other row shifted by half a step.
  let rows = '';
  for (let i = 0; i < 14; i++) {
    const r = Math.min(2.4, 0.48 + 0.18 * i);
    rows += `<path d="M${i % 2 ? 6 : 3} ${78 + 6 * i}H${i % 2 ? 558 : 561}" stroke-width="${num(2 * r)}"/>`;
  }
  const dots = faceList.map((face) => `<g clip-path="url(#on-${face})" fill="none" stroke="${DOT_INK[face]}" stroke-linecap="round" stroke-dasharray="0 6">${rows}</g>`).join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -6 540 172" role="img" aria-label="QUINE42"><defs>${defs}${word}${clips}</defs><g fill-rule="evenodd">` +
    extrusion(`fill="${INK.black}" stroke="${INK.black}" stroke-width="12" stroke-linejoin="round"`) +
    extrusion(`fill="${INK.pink}"`) +
    faces +
    dots +
    `<use href="#w" fill="none" stroke="${INK.black}" stroke-width="8" stroke-linejoin="round"/></g></svg>\n`
  );
}

/** The icon of the proposal: the Q in yellow with its black shadow on a pink tile. */
export function icon(): string {
  const q = `<use href="#q"/>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="QUINE42"><defs><path id="q" d="${letterQ()}"/></defs>` +
    `<rect width="64" height="64" rx="12" fill="${INK.pink}"/><g transform="translate(9 5) scale(.38)" fill-rule="evenodd" stroke="${INK.black}" stroke-width="10" stroke-linejoin="round">` +
    `<g transform="translate(10 10)" fill="${INK.black}">${q}</g><g fill="${INK.yellow}">${q}</g></g></svg>\n`
  );
}

// --- The halftone of the pages ------------------------------------------------------------------------------------------------

/**
 * A burst of dots from a corner of the window, on a screen of 21 at 45°: the dots shrink with the distance from the corner and are gone at `reach`, before the middle,
 * where one reads. skin.css puts the pink one at the top right and the cyan one at the bottom left. Each band of the burst is a ring filled with a pattern of one size
 * (all on the same grid), so the drawing stays small.
 */
export function halftone({ ink, corner, reach = 843, step = 21, bands = 21, biggest = 5 }: { ink: string; corner: 'top-right' | 'bottom-left'; reach?: number; step?: number; bands?: number; biggest?: number }): string {
  const [cx, cy] = corner === 'top-right' ? [reach, 0] : [0, reach];
  const h = step / 2;
  const patterns: string[] = [];
  const rings: string[] = [];
  // A ring between two circles, by the even-odd rule.
  const circle = (radius: number) =>
    radius <= 0 ? '' : `M${num(cx - radius)} ${cy}A${num(radius)} ${num(radius)} 0 1 1 ${num(cx + radius)} ${cy}A${num(radius)} ${num(radius)} 0 1 1 ${num(cx - radius)} ${cy}Z`;
  for (let i = 0; i < bands; i++) {
    const r = num(biggest * (1 - (i + 0.5) / bands));
    const dots = [[h, h], [0, 0], [step, 0], [0, step], [step, step]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('');
    patterns.push(`<pattern id="p${i}" width="${step}" height="${step}" patternUnits="userSpaceOnUse"><g fill="${ink}">${dots}</g></pattern>`);
    rings.push(`<path fill="url(#p${i})" d="${circle((reach * (i + 1)) / bands)}${circle((reach * i) / bands)}"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${reach} ${reach}"><defs>${patterns.join('')}</defs><g fill-rule="evenodd">${rings.join('')}</g></svg>\n`;
}

/** Every drawing of the skin, by file name. */
export function drawings(): Record<string, string> {
  return {
    'logo.svg': lettering(),
    'icona.svg': icon(),
    'pois-rosa.svg': halftone({ ink: INK.pink, corner: 'top-right' }),
    'pois-ciano.svg': halftone({ ink: INK.cyan, corner: 'bottom-left' }),
  };
}

// Only when asked: importing this file (the test does) writes nothing.
if (process.argv.includes('--scrivi')) {
  const here = dirname(fileURLToPath(import.meta.url));
  for (const [file, svg] of Object.entries(drawings())) writeFileSync(join(here, file), svg);
}
