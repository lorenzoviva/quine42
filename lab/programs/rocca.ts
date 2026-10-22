// A castle written the way MarkovJunior's own examples are written (step 8D): nothing in the layout is a
// fixed template. The courtyard grows from a seed as overlapping rectangles; walls and moat are its
// contour; towers are wherever the contour turns (the collapse finds convex and concave corners from the
// sockets); the gate goes where the wall runs straight, the road is a path to the edge of the map and
// another to the keep; keep, houses and well are stamps that need room around them. Then a detail
// program runs on the composed voxels, across the borders of blocks: moss climbing from the water, ivy
// from the courtyard, worn road edges, grass, doors where the road meets a wall, flags on the towers.
//
// Blocks are 20 × 20 × 20 voxels. Walls run through the middle of their block along x (y 6..13), the
// outside of a wall is its south half (water y 14..19), merlons repeat every 4 voxels symmetrically
// (x 1-2, 5-6, … 17-18), so any turn of any piece continues any other. Materials keep one letter in
// every block (R stone, S light stone, D dark stone, A water, W wood, T roof tiles, P plaster…): the
// detail rules name them.

import type { Node3, PaletteEntry, Rule3, Vec3 } from '../mj3d/engine';
import type { Block, Blockset, Layout } from '../mj3d/structure';

const MAT: Record<string, PaletteEntry> = {
  R: { name: 'pietra', color: '#8f8e96' },
  S: { name: 'pietra chiara', color: '#aeadb4' },
  D: { name: 'pietra scura', color: '#66656e' },
  A: { name: 'acqua', color: '#3c7cc8' },
  B: { name: 'acqua chiara', color: '#62a0e0' },
  W: { name: 'legno', color: '#8a5d34' },
  K: { name: 'legno scuro', color: '#5a3a20' },
  I: { name: 'ferro', color: '#3a3a44' },
  F: { name: 'finestra', color: '#2a2430' },
  Y: { name: 'luce', color: '#f0c860' },
  T: { name: 'coppi', color: '#a8473a' },
  L: { name: 'coppi al sole', color: '#c8644e' },
  E: { name: 'gronda', color: '#6e2e26' },
  P: { name: 'intonaco', color: '#e2d6b8' },
  H: { name: 'travi', color: '#4e3420' },
  G: { name: 'foglie', color: '#4a8238' },
  g: { name: 'foglie al sole', color: '#6aa84a' },
};
const pal = (codes: string) => Object.fromEntries([...codes].map((c) => [c, MAT[c]]).concat([['h', { name: 'spazio', hidden: true }]]));

/** A box from corner to corner, both included (easier to read than centre and size). */
const span = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, color: string, on?: string): Node3 => ({
  type: 'shape',
  shape: 'box',
  at: [(x0 + x1) / 2, (y0 + y1) / 2, z0],
  size: [x1 - x0 + 1, y1 - y0 + 1, z1 - z0 + 1],
  color,
  ...(on ? { on } : {}),
});
const cyl = (d: number, z0: number, h: number, color: string, on?: string): Node3 => ({ type: 'shape', shape: 'cylinder', at: [9.5, 9.5, z0], size: [d, d, h], color, ...(on ? { on } : {}) });
const seq = (...children: Array<Node3 | Node3[]>): Node3 => ({ type: 'sequence', children: children.flat() });

/** Stone that is never one colour: lighter and darker stones, a darker course every few rows. */
const masonry: Node3[] = [
  { type: 'prl', rules: [{ in: 'R', out: 'S', p: 0.12 }, { in: 'R', out: 'D', p: 0.07 }] },
  // Joints: a stone with a light one above it darkens a little (the eye reads courses).
  { type: 'prl', rules: [{ in: 'R S', out: 'D *', p: 0.3 }] },
];
const glints: Node3 = { type: 'prl', rules: [{ in: 'A .', out: 'B .', p: 0.14 }] };

/** A wall along x (y 6..13), courtyard to the north, parapet and merlons on the outer (south) side. */
const wallX = (x0: number, x1: number, outerSouth = true): Node3[] => {
  const [p0, p1] = outerSouth ? [12, 13] : [6, 7];
  const inner = outerSouth ? 6 : 13;
  return [
    span(x0, x1, 6, 13, 0, 13, 'R'),
    span(x0, x1, 6, 13, 13, 13, 'S'),
    span(x0, x1, p0, p1, 14, 15, 'R'),
    ...[1, 5, 9, 13, 17].filter((x) => x >= x0 && x + 1 <= x1).map((x) => span(x, x + 1, p0, p1, 16, 17, 'R')),
    span(x0, x1, inner, inner, 14, 14, 'R'),
  ];
};
/** The same wall along y (x 6..13), outer side east or west. */
const wallY = (y0: number, y1: number, outerEast: boolean): Node3[] => {
  const [p0, p1] = outerEast ? [12, 13] : [6, 7];
  const inner = outerEast ? 6 : 13;
  return [
    span(6, 13, y0, y1, 0, 13, 'R'),
    span(6, 13, y0, y1, 13, 13, 'S'),
    span(p0, p1, y0, y1, 14, 15, 'R'),
    ...[1, 5, 9, 13, 17].filter((y) => y >= y0 && y + 1 <= y1).map((y) => span(p0, p1, y, y + 1, 16, 17, 'R')),
    span(inner, inner, y0, y1, 14, 14, 'R'),
  ];
};
/** A round tower in the middle of its block, a level tall, slits on the given sides. */
const tower = (slits: Array<'n' | 'e' | 's' | 'w'>): Node3[] => [
  cyl(17, 0, 2, 'D'),
  cyl(16, 0, 20, 'R'),
  // A ring of light stone every eight rows.
  cyl(16, 7, 1, 'S', 'R'),
  cyl(16, 15, 1, 'S', 'R'),
  ...slits.map((s) => (s === 'n' ? span(9, 10, 1, 2, 9, 12, 'F', 'R') : s === 's' ? span(9, 10, 17, 18, 9, 12, 'F', 'R') : s === 'w' ? span(1, 2, 9, 10, 9, 12, 'F', 'R') : span(17, 18, 9, 10, 9, 12, 'F', 'R'))),
];

const block = (code: string, name: string, role: string, walk: boolean, sockets: Block['sockets'], palette: string, children: Node3[], actions?: Block['actions']): Block => ({
  code,
  name,
  role,
  walk,
  sockets,
  ...(actions ? { actions } : {}),
  program: { size: [20, 20, 20], palette: pal(palette), program: seq(children) },
});

/** A roof slope rising towards the south edge (the ridge), eaves on the north edge. */
const slope: Node3[] = [...Array.from({ length: 10 }, (_, k) => span(0, 19, 2 * k, 19, 2 * k, 2 * k + 1, 'T')), span(0, 19, 0, 0, 0, 0, 'E', 'T')];
const tiles: Node3[] = [
  { type: 'prl', rules: [{ in: 'T .', out: 'L .', p: 0.55 }] },
  // A course of darker tiles every few rows, as tiles overlap.
  { type: 'all', rules: [{ in: 'L/T', out: '*/E' }], symmetry: 'none', steps: 1 },
];
/** The gable of a slope on the side x = gx: the end of the roof is plastered, with a beam round it. */
const gable = (gx: number): Node3[] => [span(gx, gx, 0, 19, 0, 19, 'P', 'TLE'), { type: 'prl', rules: [{ in: 'P .', out: 'H .' }], symmetry: 'none' }];

export const ROCCA: Blockset = {
  name: 'Rocca',
  faces: {
    muro: 'muro da y 6 a 13 alto 14, camminamento, parapetto e merli ogni 4 voxel (x 1-2, 5-6 …) fino a 17; acqua alta 2 da y 14 a 19 sul lato esterno',
    acqua: 'acqua alta 2 (z 0..1) su tutta la larghezza',
    ponte: 'acqua alta 2 su tutta la larghezza e il tavolato del passaggio (x 4..15, z 2..3)',
    mastio: 'pietra piena su tutta la faccia',
    casa: 'zoccolo di pietra alto 4, intonaco e travi fino a 17',
    tetto: 'la falda di un tetto a padiglione, a gradini',
    colmo: 'il colmo di un tetto a due falde: pieno, sale fino a 19',
    falda: 'il fianco di una falda: un triangolo a gradini',
    torre: 'sopra: la torre continua al livello di sopra',
  },
  open: ['acqua', 'ponte', 'mastio', 'casa'],
  blocks: [
    block('A', 'fossato', 'acqua', false, { n: 'acqua', e: 'acqua', s: 'acqua', w: 'acqua', u: 'vuoto' }, 'AB', [span(0, 19, 0, 19, 0, 1, 'A'), glints]),
    block('M', 'muro', 'muro', false, { n: 'vuoto', e: 'muro', s: 'acqua', w: 'muro', u: 'vuoto' }, 'RSDABF', [
      span(0, 19, 5, 14, 0, 2, 'D'),
      ...wallX(0, 19),
      span(0, 19, 15, 19, 0, 1, 'A', '.'),
      span(9, 10, 13, 13, 6, 9, 'F', 'R'),
      ...masonry,
      glints,
    ]),
    block('T', 'torre', 'torre', false, { n: 'acqua', e: 'muro', s: 'muro', w: 'acqua', u: 'torre' }, 'RSDABF', [
      span(0, 19, 0, 9, 0, 1, 'A'),
      span(0, 9, 0, 19, 0, 1, 'A'),
      ...wallX(10, 19, false),
      ...wallY(10, 19, false),
      ...tower(['n', 'w']),
      ...masonry,
      glints,
    ]),
    block('I', 'torre d’angolo interno', 'torre', false, { n: 'vuoto', e: 'muro', s: 'muro', w: 'vuoto', u: 'torre' }, 'RSDABF', [
      ...wallX(10, 19, true),
      ...wallY(10, 19, true),
      span(10, 19, 15, 19, 0, 1, 'A', '.'),
      span(15, 19, 10, 19, 0, 1, 'A', '.'),
      ...tower(['s', 'e']),
      ...masonry,
      glints,
    ]),
    block('U', 'cima della torre', 'tetto', false, { n: 'vuoto', e: 'vuoto', s: 'vuoto', w: 'vuoto', d: 'torre' }, 'RSDTLEI', [
      cyl(16, 0, 3, 'R'),
      // Corbels, then the ring of merlons, carved one every other step round the ring.
      cyl(18, 3, 1, 'S'),
      cyl(18, 4, 3, 'R'),
      cyl(14, 4, 3, '.'),
      span(0, 19, 8, 11, 5, 6, '.', 'R'),
      span(8, 11, 0, 19, 5, 6, '.', 'R'),
      { type: 'shape', shape: 'cone', at: [9.5, 9.5, 4], size: [15, 15, 15], color: 'T' },
      ...tiles,
      ...masonry,
    ]),
    block('G', 'portone chiuso', 'porta', false, { n: 'vuoto', e: 'muro', s: 'ponte', w: 'muro', u: 'vuoto' }, 'RSDABWKIY', [
      span(0, 19, 4, 15, 0, 15, 'R'),
      span(0, 19, 4, 15, 15, 15, 'S'),
      ...[1, 5, 9, 13, 17].map((x) => span(x, x + 1, 12, 15, 16, 18, 'R')),
      // The arch through the gatehouse.
      span(6, 13, 4, 15, 0, 8, '.'),
      { type: 'shape', shape: 'cylinder', at: [9.5, 9.5, 5], size: [8, 12, 7], color: '.', on: 'RS' },
      span(5, 14, 15, 15, 0, 11, 'S', 'R'),
      // The portcullis down: an iron grid at the front of the arch.
      ...[6, 8, 11, 13].map((x) => span(x, x, 14, 14, 0, 9, 'I', '.')),
      ...[2, 5, 8].map((z) => span(6, 13, 14, 14, z, z, 'I', '.')),
      // The doors behind it, and the bridge's end.
      span(6, 13, 6, 6, 0, 9, 'W', '.'),
      { type: 'prl', rules: [{ in: 'W', out: 'K', p: 0.25 }] },
      span(0, 19, 16, 19, 0, 1, 'A'),
      span(4, 15, 16, 19, 2, 3, 'W'),
      span(4, 4, 16, 16, 7, 8, 'Y', '.'),
      span(15, 15, 16, 16, 7, 8, 'Y', '.'),
      ...masonry,
      glints,
    ], [{ label: 'apri il portone', to: 'H' }]),
    block('H', 'portone aperto', 'porta', true, { n: 'vuoto', e: 'muro', s: 'ponte', w: 'muro', u: 'vuoto' }, 'RSDABWKIY', [
      span(0, 19, 4, 15, 0, 15, 'R'),
      span(0, 19, 4, 15, 15, 15, 'S'),
      ...[1, 5, 9, 13, 17].map((x) => span(x, x + 1, 12, 15, 16, 18, 'R')),
      span(6, 13, 4, 15, 0, 8, '.'),
      { type: 'shape', shape: 'cylinder', at: [9.5, 9.5, 5], size: [8, 12, 7], color: '.', on: 'RS' },
      span(5, 14, 15, 15, 0, 11, 'S', 'R'),
      // The portcullis up: only its teeth show under the arch.
      ...[6, 8, 11, 13].map((x) => span(x, x, 14, 14, 9, 9, 'I', '.')),
      span(6, 6, 6, 10, 0, 9, 'W', '.'),
      span(13, 13, 6, 10, 0, 9, 'W', '.'),
      span(0, 19, 16, 19, 0, 1, 'A'),
      span(4, 15, 16, 19, 2, 3, 'W'),
      span(4, 4, 16, 16, 7, 8, 'Y', '.'),
      span(15, 15, 16, 16, 7, 8, 'Y', '.'),
      ...masonry,
      glints,
    ], [{ label: 'chiudi il portone', to: 'G' }]),
    block('P', 'ponte levatoio abbassato', 'ponte', true, { n: 'ponte', e: 'acqua', s: 'ponte', w: 'acqua', u: 'vuoto' }, 'ABWKI', [
      span(0, 19, 0, 19, 0, 1, 'A'),
      span(4, 15, 0, 19, 2, 3, 'W'),
      { type: 'all', rules: [{ in: 'WWW', out: 'KWW' }], symmetry: 'none', steps: 1 },
      span(4, 4, 0, 19, 4, 4, 'K'),
      span(15, 15, 0, 19, 4, 4, 'K'),
      { type: 'shape', shape: 'line', at: [4, 18, 4], to: [4, 0, 12], color: 'I' },
      { type: 'shape', shape: 'line', at: [15, 18, 4], to: [15, 0, 12], color: 'I' },
      glints,
    ], [{ label: 'alza il ponte', to: 'Q' }]),
    block('Q', 'ponte levatoio alzato', 'ponte', false, { n: 'ponte', e: 'acqua', s: 'ponte', w: 'acqua', u: 'vuoto' }, 'ABWKI', [
      span(0, 19, 0, 19, 0, 1, 'A'),
      span(4, 15, 0, 1, 2, 16, 'W'),
      { type: 'all', rules: [{ in: 'W W W', out: 'K W W' }], symmetry: 'none', steps: 1 },
      glints,
    ], [{ label: 'abbassa il ponte', to: 'P' }]),
    block('K', 'mastio', 'muro', false, { n: 'mastio', e: 'mastio', s: 'mastio', w: 'mastio' }, 'RSDFY', [
      span(0, 19, 0, 19, 0, 19, 'R'),
      span(0, 19, 0, 19, 0, 1, 'D'),
      span(0, 19, 0, 19, 18, 18, 'S'),
      // A tall window in the middle of every face, a slit lower down (inner faces stay hidden).
      ...[[8, 11, 0, 0], [8, 11, 19, 19], [0, 0, 8, 11], [19, 19, 8, 11]].map(([x0, x1, y0, y1]) => span(x0, x1, y0, y1, 9, 14, 'F')),
      ...[[9, 10, 0, 0], [9, 10, 19, 19], [0, 0, 9, 10], [19, 19, 9, 10]].map(([x0, x1, y0, y1]) => span(x0, x1, y0, y1, 3, 5, 'F')),
      { type: 'prl', rules: [{ in: 'F', out: 'Y', p: 0.2 }] },
      ...masonry,
    ]),
    block('R', 'falda del tetto a padiglione', 'tetto', false, { n: 'vuoto', e: 'tetto', s: 'tetto', w: 'vuoto' }, 'TLE', [
      ...Array.from({ length: 10 }, (_, k) => span(2 * k, 19, 2 * k, 19, 2 * k, 2 * k + 1, 'T')),
      span(0, 19, 0, 19, 0, 0, 'E', 'T'),
      ...tiles,
    ]),
    block('X', 'casa', 'casa', false, { n: 'casa', e: 'casa', s: 'casa', w: 'casa' }, 'RSDPHFWY', [
      span(0, 19, 0, 19, 0, 3, 'R'),
      span(0, 19, 0, 19, 4, 17, 'P'),
      // The timber frame: sill, girt and plate, posts at the corners and in the middle of every face.
      ...[4, 10, 17].map((z) => span(0, 19, 0, 19, z, z, 'H', 'P')),
      ...[0, 9, 10, 19].flatMap((v) => [0, 19].flatMap((f) => [span(v, v, f, f, 4, 17, 'H', 'P'), span(f, f, v, v, 4, 17, 'H', 'P')])),
      // Windows with shutters, on every face.
      ...[[4, 6, 0, 0], [13, 15, 0, 0], [4, 6, 19, 19], [13, 15, 19, 19], [0, 0, 4, 6], [0, 0, 13, 15], [19, 19, 4, 6], [19, 19, 13, 15]].map(([x0, x1, y0, y1]) => span(x0, x1, y0, y1, 12, 15, 'F')),
      { type: 'prl', rules: [{ in: 'F', out: 'Y', p: 0.15 }] },
      { type: 'all', rules: [{ in: 'PFFFP', out: 'W***W' }], steps: 1 },
      ...masonry,
    ]),
    block('F', 'falda', 'tetto', false, { n: 'vuoto', e: 'falda', s: 'colmo', w: 'falda' }, 'TLE', [...slope, ...tiles]),
    block('J', 'falda col frontone a ovest', 'tetto', false, { n: 'vuoto', e: 'falda', s: 'colmo', w: 'vuoto' }, 'TLEPH', [...slope, ...gable(0), ...tiles]),
    block('N', 'falda col frontone a est', 'tetto', false, { n: 'vuoto', e: 'vuoto', s: 'colmo', w: 'falda' }, 'TLEPH', [...slope, ...gable(19), ...tiles]),
    block('L', 'albero', 'albero', false, { n: 'vuoto', e: 'vuoto', s: 'vuoto', w: 'vuoto' }, 'KGg', [
      // The trunk, then the crown grown from a seed inside the space it may take (a hidden ellipsoid).
      span(9, 10, 9, 10, 0, 7, 'K'),
      { type: 'shape', shape: 'ellipsoid', at: [9.5, 9.5, 5], size: [16, 16, 15], color: 'h', on: '.' },
      span(9, 10, 9, 10, 8, 9, 'G'),
      { type: 'one', rules: [{ in: 'Gh', out: 'GG' }], symmetry: 'all', steps: 650 },
      { type: 'all', rules: [{ in: 'h', out: '.' }] },
      { type: 'conv', neighborhood: 'moore', steps: 2, rules: [{ in: '.', out: 'G', neighbors: 'G', min: 15 }, { in: 'G', out: '.', neighbors: 'G', max: 5 }] },
      { type: 'prl', rules: [{ in: 'G .', out: 'g .', p: 0.65 }] },
      { type: 'prl', rules: [{ in: 'G', out: 'g', p: 0.08 }] },
    ]),
    // Commissioned for the knots of walls between two courtyards (no moat round them): a tower with no water.
    block('C', 'torre di raccordo', 'torre', false, { n: 'vuoto', e: 'muro', s: 'muro', w: 'vuoto', u: 'torre' }, 'RSDF', [...wallX(10, 19, true), ...wallY(10, 19, true), ...tower(['n', 'w']), ...masonry]),
    // Commissioned for walls meeting at a tee (the fourth side to the courtyard or to the moat) and at a cross.
    block('E', 'torre d’incrocio sul cortile', 'torre', false, { n: 'muro', e: 'muro', s: 'vuoto', w: 'muro', u: 'torre' }, 'RSDF', [...wallX(0, 19, true), ...wallY(0, 9, true), ...tower(['s']), ...masonry]),
    block('D', 'torre d’incrocio sul fossato', 'torre', false, { n: 'muro', e: 'muro', s: 'acqua', w: 'muro', u: 'torre' }, 'RSDABF', [...wallX(0, 19, true), ...wallY(0, 9, true), span(0, 19, 15, 19, 0, 1, 'A', '.'), ...tower(['s']), ...masonry, glints]),
    block('S', 'torre d’incrocio a croce', 'torre', false, { n: 'muro', e: 'muro', s: 'muro', w: 'muro', u: 'torre' }, 'RSDF', [...wallX(0, 19, true), ...wallY(0, 19, true), ...tower([]), ...masonry]),
    block('O', 'pozzo', 'pozzo', false, { n: 'vuoto', e: 'vuoto', s: 'vuoto', w: 'vuoto' }, 'RSDABWKTLE', [
      cyl(10, 0, 5, 'R'),
      cyl(7, 1, 4, 'A'),
      span(4, 5, 9, 10, 5, 13, 'W'),
      span(14, 15, 9, 10, 5, 13, 'W'),
      span(4, 15, 9, 10, 12, 12, 'K'),
      ...Array.from({ length: 3 }, (_, k) => span(3 + k, 16 - k, 5 + 2 * k, 14 - 2 * k, 14 + k, 14 + k, 'T')),
      ...tiles,
      ...masonry,
    ]),
  ],
};

// ------------------------------------------------------------------ layout

/** A rectangle w × d of courtyard that starts from a cell already courtyard (its corner). */
const room = (w: number, d: number, p = 1): Rule3 => ({
  in: Array.from({ length: d }, (_, j) => Array.from({ length: w }, (_, i) => (i === 0 && j === 0 ? 'c' : '[.c]')).join('')).join('/'),
  out: Array.from({ length: d }, () => 'c'.repeat(w)).join('/'),
  p,
});

/** A building w × d that needs a ring of courtyard round it and air above: `body` levels, then `roof`. */
const building = (w: number, d: number, levels: string[], p = 1): Rule3 => {
  const rows = (f: (i: number, j: number) => string) => Array.from({ length: d + 2 }, (_, j) => Array.from({ length: w + 2 }, (_, i) => f(i, j)).join('')).join('/');
  const inside = (i: number, j: number) => i > 0 && j > 0 && i <= w && j <= d;
  return {
    in: [rows(() => 'c'), ...levels.slice(1).map(() => rows(() => '.'))].join(' '),
    out: levels.map((code) => rows((i, j) => (inside(i, j) ? code : '*'))).join(' '),
    p,
  };
};

/**
 * The layout, X × Y tiles and 3 levels. Marks of the program (lower case) are not blocks: "e" the edge of
 * the map, "x" a margin the courtyard may not take, "c" courtyard, "s" road inside and "r" outside, "o" gardens, which are painted on the
 * ground.
 */
export function rocca(size: Vec3 = [18, 18, 3]): Layout {
  const [X, Y] = size;
  const area = (X - 6) * (Y - 6);
  const big = Math.min(X, Y) >= 24;
  return {
    name: 'Rocca',
    size,
    zones: {
      A: { name: 'fossato', blocks: 'A' },
      W: { name: 'mura', describe: 'tratti dritti di mura merlate, il cortile da un lato e il fossato dall’altro', blocks: 'M' },
      T: { name: 'torre d’angolo', describe: 'dove le mura girano attorno al cortile: il fossato sui due lati di fuori', blocks: 'T' },
      I: { name: 'torre d’angolo interno', describe: 'dove le mura girano con il cortile sui due lati e il fossato in diagonale', blocks: 'I' },
      E: { name: 'incrocio sul cortile', describe: 'tre tratti di mura che si incontrano, il quarto lato sul cortile', blocks: 'E' },
      D: { name: 'incrocio sul fossato', describe: 'tre tratti di mura che si incontrano, il quarto lato sul fossato', blocks: 'D' },
      S: { name: 'incrocio a croce', describe: 'quattro tratti di mura che si incontrano', blocks: 'S' },
      Q: { name: 'torre di raccordo', describe: 'dove le mura di due cortili si incontrano: cortile attorno, niente fossato', blocks: 'C' },
      V: { name: 'sopra le mura', blocks: 'U.' },
      G: { name: 'portone', blocks: 'G' },
      B: { name: 'ponte', blocks: 'P' },
      K: { name: 'mastio', blocks: 'K' },
      R: { name: 'tetto del mastio', blocks: 'R' },
      Z: { name: 'case', blocks: 'X' },
      Y: { name: 'tetti delle case', blocks: 'FFJNR' },
      L: { name: 'alberi', blocks: 'L' },
      O: { name: 'pozzo', blocks: 'O' },
    },
    palette: {},
    // Anything that is wall: straight, corners, the gate.
    unions: { '%': 'WTIQGEDS' },
    // The courtyard reaches the foot of the walls and lies under the well and the trees.
    // The materials of every block, by letter: the detail program names them.
    materials: Object.fromEntries(Object.entries(MAT).filter(([k]) => k !== 'h')),
    paint: { c: { name: 'cortile', color: '#a3916c', under: 'WTIQEDSGOL' }, s: { name: 'strada', color: '#c6b994' }, r: { name: 'strada fuori', color: '#c6b994' }, o: { name: 'orto', color: '#6b5034' } },
    // Courtyard, roads and gardens are not the land outside: walls show them their inner face, never water.
    open: { c: ['vuoto', 'casa', 'mastio'], s: ['vuoto', 'ponte', 'casa', 'mastio'], o: ['vuoto'] },
    program: seq(
      // The edge of the map, a margin of two tiles, the land inside.
      { type: 'shape', shape: 'box', at: [(X - 1) / 2, (Y - 1) / 2, 0], size: [X, Y, 1], color: 'e' },
      { type: 'shape', shape: 'box', at: [(X - 1) / 2, (Y - 1) / 2, 0], size: [X - 2, Y - 2, 1], color: 'x' },
      { type: 'shape', shape: 'box', at: [(X - 1) / 2, (Y - 1) / 2, 0], size: [X - 6, Y - 6, 1], color: '.' },
      // The courtyard: a first large rectangle from the seed, then smaller ones that overlap it.
      { type: 'shape', shape: 'box', at: [Math.floor(X / 2), Math.floor(Y / 2), 0], size: [1, 1, 1], color: 'c' },
      { type: 'one', rules: [room(6, 6), room(7, 5), room(5, 7)], steps: 1 },
      { type: 'one', rules: [room(5, 4), room(4, 6), room(6, 3, 0.5), room(3, 5, 0.5), room(8, 4, 0.5)], steps: Math.max(3, Math.round(area / 28)) },
      // No gaps of one tile and no pinches: walls would have courtyard on both sides.
      { type: 'all', rules: [{ in: 'c.c', out: '*c*' }, { in: 'c./.c', out: '*c/**' }] },
      // The contour: walls round the courtyard, the moat round the walls; the margin goes back to land.
      { type: 'all', rules: [{ in: 'c[.x]', out: '*W' }, { in: 'c*/*[.x]', out: '**/*W' }] },
      { type: 'all', rules: [{ in: 'W[.x]', out: '*A' }, { in: 'W*/*[.x]', out: '**/*A' }] },
      { type: 'all', rules: [{ in: 'x', out: '.' }] },
      // The gate where the wall runs straight for three tiles, the bridge in front, the road to the edge.
      { type: 'one', rules: [{ in: 'ccc/WWW/AAA/...', out: '***/*G*/*B*/*r*' }], steps: big ? 2 : 1 },
      { type: 'path', from: 'r', to: 'e', on: '.', color: 'r', inertia: true, steps: big ? 2 : 1 },
      // Which corner is which: the four sides of a corner look alike, the diagonal between its walls tells.
      // Moat on the two outer sides: a corner tower; courtyard on both sides and the moat across: an inner
      // corner; courtyard on both sides and no moat across: a knot between two courtyards.
      // Walls meeting at a cross or a tee, by what the fourth side faces.
      { type: 'all', rules: [{ in: '*%*/%W%/*%*', out: '***/*S*/***' }], optional: true },
      { type: 'all', rules: [{ in: '*%*/%W%/*[cs]*', out: '***/*E*/***' }, { in: '*%*/%W%/*A*', out: '***/*D*/***' }], optional: true },
      { type: 'all', rules: [{ in: '*A*/A%%/*%*', out: '***/*T*/***' }, { in: '*[cs]*/[cs]%%/*%A', out: '***/*I*/***' }, { in: '*[cs]*/[cs]%%/*%[cs%]', out: '***/*Q*/***' }] },
      // The keep (two levels and a hipped roof), houses with gabled roofs, a well: each needs room round it.
      { type: 'one', rules: [building(2, 2, ['K', 'K', 'R'])], steps: big ? 2 : 1 },
      // Gardens before the houses, or the houses take all the room.
      { type: 'one', rules: [building(3, 2, ['o']), building(2, 3, ['o']), building(4, 3, ['o'], 0.5)], steps: Math.max(1, Math.round(area / 90)) },
      { type: 'one', rules: [building(2, 2, ['Z', 'Y']), building(3, 2, ['Z', 'Y']), building(4, 2, ['Z', 'Y'], 0.5)], steps: Math.max(1, Math.round(area / 50)) },
      { type: 'one', rules: [{ in: 'ccc/ccc/ccc', out: '***/*O*/***' }], steps: 1 },
      // Trees, alone or two by two, where there is room round them.
      { type: 'one', rules: [building(1, 1, ['L']), building(2, 1, ['L'], 0.6)], steps: Math.max(2, Math.round(area / 30)) },
      // The road from the gate to the keep, across the courtyard.
      { type: 'path', from: 'G', to: 'K', on: 'c', color: 's', inertia: true, steps: big ? 2 : 1 },
      // Above the walls the towers go on; the collapse puts their tops above towers only.
      { type: 'all', rules: [{ in: '[WTIQEDS] .', out: '* V' }], symmetry: 'none' },
    ),
    detail: {
      palette: {
        M: { name: 'muschio', color: '#4d6a3a' },
        V: { name: 'edera', color: '#3d7438' },
        v: { name: 'edera chiara', color: '#5f9a48' },
        q: { name: 'erba', color: '#7fa45c' },
        t: { name: 'ciottoli', color: '#9d9070' },
        Z: { name: 'stendardo', color: '#b8322e' },
        u: { name: 'ortaggi', color: '#5a8e36' },
        y: { name: 'fiori', color: '#e0c240' },
      },
      unions: { '#': 'RSD', '%': 'RSDPH' },
      program: seq(
        // Moss where stone meets water, creeping up the faces in streaks.
        { type: 'prl', rules: [{ in: '#[AB]', out: 'M*', p: 0.6 }] },
        { type: 'prl', rules: [{ in: 'M[.AB] #.', out: '** M*', p: 0.45 }], steps: 5 },
        // Ivy: a few roots where the courtyard meets a wall, then it climbs and spreads along the faces.
        { type: 'one', rules: [{ in: '%c %.', out: '** *V' }], steps: Math.max(12, Math.round(area / 6)) },
        { type: 'one', rules: [{ in: '%V %.', out: '** *V', p: 3 }, { in: '%%/V.', out: '**/*V', p: 1 }], steps: Math.max(400, area * 6) },
        { type: 'prl', rules: [{ in: 'V', out: 'v', p: 0.35 }] },
        // Gardens: furrows every other row from the northern edge, plants and flowers on them.
        { type: 'all', rules: [{ in: '[cqst]/o', out: '*/u' }], symmetry: 'none' },
        { type: 'all', rules: [{ in: 'u/o/o', out: '*/*/u' }], symmetry: 'none' },
        { type: 'prl', rules: [{ in: 'u .', out: '* u', p: 0.6 }] },
        { type: 'prl', rules: [{ in: 'u .', out: '* y', p: 0.12 }] },
        // The road: cobbles, worn edges; the courtyard: tufts of grass that spread a little.
        { type: 'prl', rules: [{ in: 'sc', out: 'ss', p: 0.3 }] },
        { type: 'prl', rules: [{ in: '[sr]', out: 't', p: 0.18 }] },
        { type: 'prl', rules: [{ in: 'c', out: 'q', p: 0.05 }] },
        { type: 'prl', rules: [{ in: 'qc', out: 'qq', p: 0.3 }], steps: 2 },
        // A door where the road reaches the keep, and one on each house where the courtyard meets it.
        {
          type: 'one',
          rules: [{ in: '####/[st][st][st][st] ' + Array(7).fill('####/....').join(' '), out: '****/**** ' + Array(7).fill('KKKK/****').join(' ') }],
          steps: big ? 2 : 1,
        },
        {
          type: 'one',
          rules: [{ in: '%%%/[cq][cq][cq] ' + [...Array(3).fill('%%%/...'), ...Array(3).fill('[PH][PH][PH]/...')].join(' '), out: '***/*** ' + Array(6).fill('KKK/***').join(' ') }],
          steps: Math.max(1, Math.round(area / 50)),
        },
        // A pennant on the tip of every tower roof.
        { type: 'all', rules: [{ in: '..../.[TL][TL]./.[TL][TL]./.... ..../..../..../.... ..../..../..../.... ..../..../..../....', out: '****/****/****/**** ****/*I**/****/**** ****/*I**/****/**** ****/*IZZ/****/****' }], symmetry: 'none' },
      ),
    },
  };
}

export const ROCCA_PIANTA: Layout = rocca();
