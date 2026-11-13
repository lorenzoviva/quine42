// What the Sculptor «sees» of a grid without photographs (T337, T354): views in text, small enough to go back after every block of
// a program. A plan from above (the letter on top of each column) and the heights as digits, a front and a side elevation (the first
// letter one meets looking from the front or from the right), horizontal cuts at the storeys (where doors, rooms and stairs show), the
// legend of the letters, and how much two plans differ (whether the seeds vary). A cell of a view is a square of `step` columns of the
// grid: the letter that covers most of them, so that a thin line of one voxel is not lost nor doubled.

import type { Grid3, PaletteEntry } from './engine';
import { colorTable } from './mesh';
import { MJ_PALETTE } from './palette';
import { symbolName } from './symbols';

export interface ViewOptions {
  /** Grid cells per character; by default whatever keeps the view within `width`. */
  step?: number;
  width?: number;
  /** Count hidden letters (markers) too: what a block in progress leaves on the grid is worth seeing. */
  hidden?: boolean;
}

const EMPTY = '.';
/** Heights as one character: 0-9 then a-z, 36 steps of the box's height. */
const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';

function visible(g: Grid3, palette: Record<string, PaletteEntry>, hidden: boolean): boolean[] {
  const colors = colorTable(g.alphabet, palette);
  return g.alphabet.map((c, i) => i !== 0 && (!!colors[i] || (hidden && c !== g.alphabet[0])));
}

const nameOf = (g: Grid3, code: number) => {
  const s = symbolName(g.alphabet[code]);
  // A `#12` would take three characters: in a view one is enough, the legend says which.
  return s.length === 1 ? s : '#';
};

/** The most frequent of some codes, or -1 if none. */
function mostFrequent(codes: number[]): number {
  if (!codes.length) return -1;
  const count = new Map<number, number>();
  let best = -1, n = 0;
  for (const c of codes) {
    const k = (count.get(c) ?? 0) + 1;
    count.set(c, k);
    if (k > n) (n = k), (best = c);
  }
  return best;
}

const stepFor = (g: Grid3, o: ViewOptions, w = Math.max(g.X, g.Y)) => o.step ?? Math.max(1, Math.ceil(w / (o.width ?? 50)));

/** Plan and heights: one line per row of the grid (the back at the top, the front at the bottom, as the photos). */
export function planView(g: Grid3, palette: Record<string, PaletteEntry>, o: ViewOptions = {}): { plan: string; heights: string; step: number } {
  const vis = visible(g, palette, o.hidden ?? true);
  const step = stepFor(g, o);
  const XY = g.X * g.Y;
  const top = new Int32Array(XY).fill(-1);
  const letter = new Int32Array(XY).fill(-1);
  for (let i = 0; i < XY; i++)
    for (let z = g.Z - 1; z >= 0; z--) {
      const c = g.cells[i + z * XY];
      if (vis[c]) {
        top[i] = z;
        letter[i] = c;
        break;
      }
    }
  const planRows: string[] = [], heightRows: string[] = [];
  for (let y0 = 0; y0 < g.Y; y0 += step) {
    let rp = '', rh = '';
    for (let x0 = 0; x0 < g.X; x0 += step) {
      const codes: number[] = [];
      let high = -1, n = 0, full = 0;
      for (let y = y0; y < Math.min(g.Y, y0 + step); y++)
        for (let x = x0; x < Math.min(g.X, x0 + step); x++) {
          n++;
          const i = x + y * g.X;
          if (top[i] < 0) continue;
          full++;
          codes.push(letter[i]);
          high = Math.max(high, top[i]);
        }
      if (full * 2 < n) {
        rp += EMPTY;
        rh += EMPTY;
        continue;
      }
      rp += nameOf(g, mostFrequent(codes));
      rh += DIGITS[Math.min(DIGITS.length - 1, Math.floor(((high + 1) * DIGITS.length) / (g.Z + 1)))];
    }
    planRows.push(rp);
    heightRows.push(rh);
  }
  return { plan: planRows.join('\n'), heights: heightRows.join('\n'), step };
}

/** An elevation: from the front (looking towards small y) or from the right (towards small x); the top at the top. */
export function elevationView(g: Grid3, palette: Record<string, PaletteEntry>, side: 'front' | 'right', o: ViewOptions = {}): { text: string; step: number } {
  const vis = visible(g, palette, o.hidden ?? true);
  const W = side === 'front' ? g.X : g.Y;
  const D = side === 'front' ? g.Y : g.X;
  const step = stepFor(g, o, Math.max(W, g.Z));
  const XY = g.X * g.Y;
  const at = (u: number, d: number, z: number) => (side === 'front' ? u + (g.Y - 1 - d) * g.X : g.X - 1 - d + u * g.X) + z * XY;
  const rows: string[] = [];
  for (let z0 = Math.floor((g.Z - 1) / step) * step; z0 >= 0; z0 -= step) {
    let r = '';
    for (let u0 = 0; u0 < W; u0 += step) {
      const codes: number[] = [];
      let n = 0;
      for (let z = z0; z < Math.min(g.Z, z0 + step); z++)
        for (let u = u0; u < Math.min(W, u0 + step); u++) {
          n++;
          for (let d = 0; d < D; d++) {
            const c = g.cells[at(u, d, z)];
            if (vis[c]) {
              codes.push(c);
              break;
            }
          }
        }
      r += codes.length * 2 < n ? EMPTY : nameOf(g, mostFrequent(codes));
    }
    rows.push(r);
  }
  // Empty rows above the model say nothing.
  while (rows.length > 1 && /^\.*$/.test(rows[0])) rows.shift();
  return { text: rows.join('\n'), step };
}

/** A horizontal cut at height `z`: the letter of each cell there («.» empty), the back at the top. Doors, rooms and stairs show here. */
export function sectionView(g: Grid3, palette: Record<string, PaletteEntry>, z: number, o: ViewOptions = {}): { text: string; step: number } {
  const vis = visible(g, palette, o.hidden ?? true);
  const step = stepFor(g, o);
  const XY = g.X * g.Y;
  const rows: string[] = [];
  for (let y0 = 0; y0 < g.Y; y0 += step) {
    let r = '';
    for (let x0 = 0; x0 < g.X; x0 += step) {
      const codes: number[] = [];
      let n = 0;
      for (let y = y0; y < Math.min(g.Y, y0 + step); y++)
        for (let x = x0; x < Math.min(g.X, x0 + step); x++) {
          n++;
          const c = g.cells[x + y * g.X + Math.min(g.Z - 1, z) * XY];
          if (vis[c]) codes.push(c);
        }
      r += codes.length * 2 < n ? EMPTY : nameOf(g, mostFrequent(codes));
    }
    rows.push(r);
  }
  return { text: rows.join('\n'), step };
}

/** The letters of a view and their names, for whoever reads it. */
export function legend(g: Grid3, palette: Record<string, PaletteEntry>): string {
  const used = new Set<number>();
  for (const c of g.cells) used.add(c);
  return [...used]
    .filter((c) => c !== 0)
    .sort((a, b) => a - b)
    .map((c) => {
      const s = symbolName(g.alphabet[c]);
      const p = palette[g.alphabet[c]];
      // A hidden letter that only has the palette's own name (honey, slate…) is a marker: the name says nothing of the thing.
      const named = p?.name && !(p.hidden && p.name === MJ_PALETTE[s]?.name) ? p.name : undefined;
      const what = named ?? (p?.hidden ? 'marker' : p?.color ? '' : 'no colour');
      return `${s.length === 1 ? s : `# = ${s}`}${what ? ` ${what}` : ''}`;
    })
    .join(', ');
}

/** Where to cut a grid: a third of the way up each storey of `storey` voxels (32 at 20 voxels a tile), up to three cuts. */
export function sectionHeights(g: Grid3, storey = 32): number[] {
  const out: number[] = [];
  for (let z = Math.round(storey / 3); z < g.Z && out.length < 3; z += storey) out.push(z);
  return out;
}

/** Whether a grid is only a plan: nothing above its lowest layer (the coarse grid of a first block). */
export function isFlat(g: Grid3): boolean {
  const XY = g.X * g.Y;
  for (let i = XY; i < g.cells.length; i++) if (g.cells[i] !== 0) return false;
  return true;
}

/** All the views of a run, with a header: what goes back to the Sculptor after a block. A flat grid (a plan) gives only its plan. */
export function viewsText(g: Grid3, palette: Record<string, PaletteEntry>, title: string, o: ViewOptions & { sections?: number[] } = {}): string {
  const p = planView(g, palette, o);
  const head = `### ${title}: grid ${g.X}×${g.Y}×${g.Z}, one character = ${p.step}×${p.step} cells (the back at the top, the front at the bottom; «.» empty)`;
  const fence = (s: string) => ['```', s, '```'];
  if (isFlat(g)) return [head, `Letters: ${legend(g, palette)}`, 'Plan (the letter of every cell):', ...fence(p.plan)].join('\n');
  const cuts = (o.sections ?? []).filter((z) => z >= 0 && z < g.Z).flatMap((z) => [`Cut at z=${z} (the letters at that height: doors, rooms, stairs):`, ...fence(sectionView(g, palette, z, o).text)]);
  const f = elevationView(g, palette, 'front', o);
  const d = elevationView(g, palette, 'right', o);
  return [
    head,
    `Letters: ${legend(g, palette)}`,
    'Plan (the letter on top of every column):',
    ...fence(p.plan),
    `Heights (the top of every column, from 0 to z: ${DIGITS.length} steps of the height of the grid):`,
    ...fence(p.heights),
    'Front (looking from the front; the sky at the top):',
    ...fence(f.text),
    'Right side (looking from the right):',
    ...fence(d.text),
    ...cuts,
  ].join('\n');
}

/** Two blocks of text side by side, for the plans of two seeds. */
export function sideBySide(a: string, b: string, gap = '   '): string {
  const la = a.split('\n'), lb = b.split('\n');
  const w = Math.max(...la.map((l) => l.length));
  return Array.from({ length: Math.max(la.length, lb.length) }, (_, i) => `${(la[i] ?? '').padEnd(w)}${gap}${lb[i] ?? ''}`).join('\n');
}

/**
 * How much two plans differ (T354): the share of the cells where the letter on top differs, over the cells one of them builds on; 0
 * the same plan, 1 nothing in common. The ground does not count: the letter most of the first plan is made of (the soil, the lawn) is
 * taken as its ground, and a cell that is ground in both is neither built nor different. Plans of different grids are compared on
 * the smaller one's cells.
 */
export function planDistance(a: Grid3, b: Grid3, palette: Record<string, PaletteEntry>): number {
  const pa = planView(a, palette, { step: 1 }).plan.split('\n');
  const pb = planView(b, palette, { step: 1 }).plan.split('\n');
  const count = new Map<string, number>();
  for (const row of pa) for (const ch of row) if (ch !== EMPTY) count.set(ch, (count.get(ch) ?? 0) + 1);
  const ground = [...count.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] ?? EMPTY;
  let union = 0, differ = 0;
  for (let y = 0; y < Math.min(pa.length, pb.length); y++)
    for (let x = 0; x < Math.min(pa[y].length, pb[y].length); x++) {
      const ca = pa[y][x], cb = pb[y][x];
      if ((ca === EMPTY || ca === ground) && (cb === EMPTY || cb === ground)) continue;
      union++;
      if (ca !== cb) differ++;
    }
  return union ? differ / union : 0;
}
