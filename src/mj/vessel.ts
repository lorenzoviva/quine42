// What the kernel reads of a vessel's form and checks of it (T440, `docs/design/acqua-spazio.md` § 1.6), as it reads the parts one lives in
// of a structure (ADR-0179) and its areas (ADR-0182): the hull at its waterline (`waterline="N"` on the root, T439), how long and how wide
// it is there, whether its bow narrows toward large y, the deck one walks on from where one boards, the helm on that deck, the hold. Pure
// functions on a grid: the Sculptor's checks, the bench (`lab/scripts/banco-navi.ts`) and the kernel's helm read the same.

import { columnAreasOf, type AreaMap } from './areas';
import type { PaletteEntry } from './engine';
import { colorTable, surfaces, type VoxelGrid } from './mesh';

/** The areas a vessel's program marks (T440): the helm, where one boards (a gangway, a ladder, the gap in the rail), the hold. */
export const VESSEL_AREAS = ['helm', 'boarding', 'hold'] as const;

/**
 * The least of a vessel (T440): long at least twice as wide at its waterline; its bow (the foremost eighth of the hull there) at most this
 * share of its width; at least this share of its deck over the hull at the waterline (the hull full under the deck, and closed); a deck
 * of at least half a tile² where a body stands, dry, reached from where one boards; the helm within this many tiles of it.
 */
export const VESSEL_LEAST = { ratio: 2, bow: 0.75, deckOverHull: 0.5, deck: 0.5, helmReach: 0.75 } as const;

/** What a vessel's form measures (T440), in voxels of its grid. */
export interface VesselMeasure {
  /** The voxels of the hull under the water (`waterlineOf`); 0 if the program says none. */
  waterline: number;
  /** The hull at the waterline (the layer just under it, the sea shut out): how long along y, how wide along x, how many columns. */
  length: number;
  width: number;
  hull: number;
  /** The widest of the foremost eighth of the hull at the waterline, as a share of its width (the bow narrows: small). */
  bow: number;
  /** The columns of dry deck a body stands on, reached on foot from where one boards (a step up or down at a time). */
  deck: number;
  /** The share of those columns over the hull at the waterline. */
  deckOverHull: number;
  /** Whether a column of the helm is within `VESSEL_LEAST.helmReach` tiles of that deck. */
  helmOnDeck: boolean;
  /** Its areas, every layer counted (`columnAreasOf`). */
  areas: AreaMap;
  /** The deck reached, as a mask of the grid's columns (x + y·X). */
  deckMask: Uint8Array;
}

/**
 * What a vessel's grid is (T440): the hull at the waterline flooded from the border of its layer (what the sea does not reach is hull: the
 * planks and what they shut in), the deck walked from the columns of the boarding area, a step up or down at a time (`surfaces`, the body's
 * height free over the floor), dry (its floor at the waterline or over it).
 */
export function measureVessel(g: VoxelGrid, palette: Record<string, PaletteEntry>, vpt: number, waterline: number): VesselMeasure {
  const XY = g.X * g.Y;
  const colors = colorTable(g.alphabet, palette);
  const areas = columnAreasOf(g, palette, vpt);
  // The hull at the waterline: the layer just under the water's surface, the sea from the border of the layer.
  const hullMask = new Uint8Array(XY);
  let hull = 0, x0 = g.X, x1 = -1, y0 = g.Y, y1 = -1;
  if (waterline >= 1 && waterline <= g.Z) {
    const zl = (waterline - 1) * XY;
    const sea = new Uint8Array(XY);
    const stack: number[] = [];
    const open = (i: number) => !colors[g.cells[zl + i]];
    for (let x = 0; x < g.X; x++) for (const y of [0, g.Y - 1]) stack.push(x + y * g.X);
    for (let y = 0; y < g.Y; y++) for (const x of [0, g.X - 1]) stack.push(x + y * g.X);
    while (stack.length) {
      const i = stack.pop()!;
      if (sea[i] || !open(i)) continue;
      sea[i] = 1;
      const x = i % g.X, y = (i - x) / g.X;
      if (x > 0) stack.push(i - 1);
      if (x < g.X - 1) stack.push(i + 1);
      if (y > 0) stack.push(i - g.X);
      if (y < g.Y - 1) stack.push(i + g.X);
    }
    for (let i = 0; i < XY; i++) {
      if (sea[i]) continue;
      const x = i % g.X, y = (i - x) / g.X;
      hullMask[i] = 1;
      hull++;
      x0 = Math.min(x0, x), x1 = Math.max(x1, x), y0 = Math.min(y0, y), y1 = Math.max(y1, y);
    }
  }
  const length = y1 >= y0 ? y1 - y0 + 1 : 0, width = x1 >= x0 ? x1 - x0 + 1 : 0;
  // The bow: the foremost eighth of the hull at the waterline (large y), its widest row.
  let bowWidth = 0;
  if (length) {
    const from = y1 - Math.max(0, Math.floor(length / 8) - 1);
    for (let y = from; y <= y1; y++) {
      let lo = g.X, hi = -1;
      for (let x = 0; x < g.X; x++) if (hullMask[x + y * g.X]) (lo = Math.min(lo, x)), (hi = Math.max(hi, x));
      if (hi >= lo) bowWidth = Math.max(bowWidth, hi - lo + 1);
    }
  }
  // The deck: from the floors of the boarding area, dry, where a body stands, a step at a time.
  const step = Math.round(0.2 * vpt);
  const levels = surfaces(g, palette, step + 1, Math.ceil(0.7 * vpt));
  const { start, z, block } = levels;
  const stands = (l: number) => z[l] > 0 && z[l] >= waterline && !block[l];
  const boardLetters = new Set(g.alphabet.map((ch, k) => (palette[ch]?.area === 'boarding' ? k : -1)).filter((k) => k >= 0));
  const reached = new Uint8Array(z.length);
  const queue: number[] = [];
  if (boardLetters.size)
    for (let i = 0; i < XY; i++) {
      let here = false;
      for (let k = 0; k < g.Z && !here; k++) here = boardLetters.has(g.cells[i + k * XY]);
      if (!here) continue;
      for (let l = start[i]; l < start[i + 1]; l++) if (stands(l)) (reached[l] = 1), queue.push(l, i);
    }
  while (queue.length) {
    const i = queue.pop()!, l = queue.pop()!;
    const x = i % g.X, y = (i - x) / g.X;
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < 0 || ny < 0 || nx >= g.X || ny >= g.Y) continue;
      const n = nx + ny * g.X;
      for (let m = start[n]; m < start[n + 1]; m++) {
        if (reached[m] || !stands(m) || Math.abs(z[m] - z[l]) > step) continue;
        reached[m] = 1;
        queue.push(m, n);
      }
    }
  }
  const deckMask = new Uint8Array(XY);
  let deck = 0, over = 0;
  for (let i = 0; i < XY; i++)
    for (let l = start[i]; l < start[i + 1]; l++)
      if (reached[l]) {
        deckMask[i] = 1;
        deck++;
        if (hullMask[i]) over++;
        break;
      }
  // The helm: a column of a helm letter within reach of the deck.
  const helmLetters = new Set(g.alphabet.map((ch, k) => (palette[ch]?.area === 'helm' ? k : -1)).filter((k) => k >= 0));
  const r = Math.ceil(VESSEL_LEAST.helmReach * vpt);
  let helmOnDeck = false;
  if (helmLetters.size && deck)
    outer: for (let i = 0; i < XY; i++) {
      let here = false;
      for (let k = 0; k < g.Z && !here; k++) here = helmLetters.has(g.cells[i + k * XY]);
      if (!here) continue;
      const x = i % g.X, y = (i - x) / g.X;
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < g.X && ny < g.Y && deckMask[nx + ny * g.X]) {
            helmOnDeck = true;
            break outer;
          }
        }
    }
  return { waterline, length, width, hull, bow: width ? bowWidth / width : 0, deck, deckOverHull: deck ? over / deck : 0, helmOnDeck, areas, deckMask };
}

/**
 * Why a vessel's form is not one (T440), in the words the Sculptor reads; empty if it is. `walked`: whether it carries people (Medium and
 * up): a deck reached from where one boards, the helm on it. A small one (a toy, a model boat) only floats and is shaped as a hull.
 */
export function vesselErrors(m: VesselMeasure, vpt: number, walked = true): string[] {
  if (!m.waterline) return ['nave: manca waterline="N" sulla radice (i voxel dello scafo sotto l\'acqua, da 1 a 40, meno dell\'altezza della scatola)'];
  if (!m.hull) return [`nave: niente scafo alla linea di galleggiamento (lo strato z=${m.waterline - 1} è tutto mare)`];
  const out: string[] = [];
  if (m.length < VESSEL_LEAST.ratio * m.width) out.push(`nave: alla linea di galleggiamento lo scafo è lungo ${m.length} e largo ${m.width}: la lunghezza (lungo y) deve essere almeno il doppio della larghezza`);
  if (m.bow > VESSEL_LEAST.bow) out.push(`nave: la prua non si stringe verso y grande (l'ottavo davanti dello scafo è largo il ${Math.round(m.bow * 100)}% della nave, serve ≤ ${Math.round(VESSEL_LEAST.bow * 100)}%)`);
  if (!walked) return out;
  if (!m.areas.boarding?.length) out.push('nave: manca l\'imbarco (una lettera con area="boarding": la passerella, la scaletta, il varco nel parapetto)');
  else if (m.deck < VESSEL_LEAST.deck * vpt * vpt) out.push(`nave: dall'imbarco si cammina su ${m.deck} colonne di ponte asciutto, sopra la linea di galleggiamento (servono ≥ ${Math.ceil(VESSEL_LEAST.deck * vpt * vpt)}): un gradino alla volta, col posto per la testa`);
  else if (m.deckOverHull < VESSEL_LEAST.deckOverHull) out.push(`nave: solo il ${Math.round(m.deckOverHull * 100)}% del ponte sta sopra lo scafo alla linea di galleggiamento (serve ≥ ${Math.round(VESSEL_LEAST.deckOverHull * 100)}%): lo scafo non è pieno sotto il ponte o non chiude e il mare entra`);
  if (!m.areas.helm?.length) out.push('nave: manca il timone (una lettera con area="helm" a poppa, sul ponte)');
  else if (m.deck && !m.helmOnDeck) out.push('nave: il timone non sta sul ponte che si raggiunge dall\'imbarco');
  return out;
}
