// What the Sculptor «sees» of a grid without photographs (T337): views in text, small enough to send back after every block of a program.
// A plan from above (the letter on top of each column) and the heights as digits, a front and a side elevation (the first letter one meets
// looking from the front or from the right). A cell of a view is a square of `passo` columns of the grid: the letter that covers most of
// them, so that a thin line of one voxel is not lost nor doubled.

import type { Grid3, PaletteEntry } from '../../src/mj/engine';
import { colorTable } from '../../src/mj/mesh';
import { symbolName } from '../../src/mj/symbols';

export interface OpzioniVista {
  /** Grid cells per character; by default whatever keeps the view within `larghezza`. */
  passo?: number;
  larghezza?: number;
  /** Count hidden letters (markers) too: what a block in progress leaves on the grid is worth seeing. */
  nascoste?: boolean;
}

const vuoto = '.';
/** Heights as one character: 0-9 then a-z, 36 steps of the box's height. */
const CIFRE = '0123456789abcdefghijklmnopqrstuvwxyz';

function visibili(g: Grid3, palette: Record<string, PaletteEntry>, nascoste: boolean): boolean[] {
  const colors = colorTable(g.alphabet, palette);
  return g.alphabet.map((c, i) => i !== 0 && (!!colors[i] || (nascoste && c !== g.alphabet[0])));
}

const nome = (g: Grid3, code: number) => {
  const s = symbolName(g.alphabet[code]);
  // A `#12` would take three characters: in a view one is enough, the legend says which.
  return s.length === 1 ? s : '#';
};

/** The most frequent of some codes, or -1 if none. */
function piuFrequente(codici: number[]): number {
  if (!codici.length) return -1;
  const conta = new Map<number, number>();
  let best = -1, n = 0;
  for (const c of codici) {
    const k = (conta.get(c) ?? 0) + 1;
    conta.set(c, k);
    if (k > n) (n = k), (best = c);
  }
  return best;
}

/** Plan and heights: one line per row of the grid (the back at the top, the front at the bottom, as the photos). */
export function vistaPianta(g: Grid3, palette: Record<string, PaletteEntry>, o: OpzioniVista = {}): { pianta: string; altezze: string; passo: number } {
  const vis = visibili(g, palette, o.nascoste ?? true);
  const passo = o.passo ?? Math.max(1, Math.ceil(Math.max(g.X, g.Y) / (o.larghezza ?? 50)));
  const XY = g.X * g.Y;
  const top = new Int32Array(XY).fill(-1);
  const lettera = new Int32Array(XY).fill(-1);
  for (let i = 0; i < XY; i++)
    for (let z = g.Z - 1; z >= 0; z--) {
      const c = g.cells[i + z * XY];
      if (vis[c]) {
        top[i] = z;
        lettera[i] = c;
        break;
      }
    }
  const righeP: string[] = [], righeA: string[] = [];
  for (let y0 = 0; y0 < g.Y; y0 += passo) {
    let rp = '', ra = '';
    for (let x0 = 0; x0 < g.X; x0 += passo) {
      const codici: number[] = [];
      let alto = -1, n = 0, piene = 0;
      for (let y = y0; y < Math.min(g.Y, y0 + passo); y++)
        for (let x = x0; x < Math.min(g.X, x0 + passo); x++) {
          n++;
          const i = x + y * g.X;
          if (top[i] < 0) continue;
          piene++;
          codici.push(lettera[i]);
          alto = Math.max(alto, top[i]);
        }
      if (piene * 2 < n) {
        rp += vuoto;
        ra += vuoto;
        continue;
      }
      rp += nome(g, piuFrequente(codici));
      ra += CIFRE[Math.min(CIFRE.length - 1, Math.floor(((alto + 1) * CIFRE.length) / (g.Z + 1)))];
    }
    righeP.push(rp);
    righeA.push(ra);
  }
  return { pianta: righeP.join('\n'), altezze: righeA.join('\n'), passo };
}

/** An elevation: from the front (looking towards small y) or from the right (towards small x); the top at the top. */
export function vistaAlzato(g: Grid3, palette: Record<string, PaletteEntry>, lato: 'fronte' | 'destra', o: OpzioniVista = {}): { testo: string; passo: number } {
  const vis = visibili(g, palette, o.nascoste ?? true);
  const W = lato === 'fronte' ? g.X : g.Y;
  const D = lato === 'fronte' ? g.Y : g.X;
  const passo = o.passo ?? Math.max(1, Math.ceil(Math.max(W, g.Z) / (o.larghezza ?? 50)));
  const XY = g.X * g.Y;
  const at = (u: number, d: number, z: number) => (lato === 'fronte' ? u + (g.Y - 1 - d) * g.X : g.X - 1 - d + u * g.X) + z * XY;
  const righe: string[] = [];
  for (let z0 = Math.floor((g.Z - 1) / passo) * passo; z0 >= 0; z0 -= passo) {
    let r = '';
    for (let u0 = 0; u0 < W; u0 += passo) {
      const codici: number[] = [];
      let n = 0;
      for (let z = z0; z < Math.min(g.Z, z0 + passo); z++)
        for (let u = u0; u < Math.min(W, u0 + passo); u++) {
          n++;
          for (let d = 0; d < D; d++) {
            const c = g.cells[at(u, d, z)];
            if (vis[c]) {
              codici.push(c);
              break;
            }
          }
        }
      r += codici.length * 2 < n ? vuoto : nome(g, piuFrequente(codici));
    }
    righe.push(r);
  }
  // Empty rows above the model say nothing.
  while (righe.length > 1 && /^\.*$/.test(righe[0])) righe.shift();
  return { testo: righe.join('\n'), passo };
}

/** The letters of a view and their names, for whoever reads it. */
export function legenda(g: Grid3, palette: Record<string, PaletteEntry>): string {
  const usate = new Set<number>();
  for (const c of g.cells) usate.add(c);
  return [...usate]
    .filter((c) => c !== 0)
    .sort((a, b) => a - b)
    .map((c) => {
      const s = symbolName(g.alphabet[c]);
      const p = palette[g.alphabet[c]];
      const what = p?.name ?? (p?.hidden ? 'marcatore' : p?.color ? '' : 'senza colore');
      return `${s.length === 1 ? s : `# = ${s}`}${what ? ` ${what}` : ''}`;
    })
    .join(', ');
}

/** All the views of a run, with a header: what goes back to the Sculptor after a block. */
export function vistePerTesto(g: Grid3, palette: Record<string, PaletteEntry>, titolo: string, o: OpzioniVista & { sezioni?: number[] } = {}): string {
  const p = vistaPianta(g, palette, o);
  const tagli = (o.sezioni ?? []).filter((z) => z >= 0 && z < g.Z).flatMap((z) => [`Sezione a z=${z} (le lettere a quell'altezza: porte, stanze, scale):`, "```", vistaSezione(g, palette, z, o).testo, "```"]);
  const f = vistaAlzato(g, palette, 'fronte', o);
  const d = vistaAlzato(g, palette, 'destra', o);
  return [
    `### ${titolo}: griglia ${g.X}×${g.Y}×${g.Z}, un carattere = ${p.passo}×${p.passo} celle (il retro in alto, il davanti in basso; «.» vuoto)`,
    `Lettere: ${legenda(g, palette)}`,
    'Pianta (la lettera in cima a ogni colonna):',
    '```',
    p.pianta,
    '```',
    `Altezze (la cima di ogni colonna, da 0 a z: ${CIFRE.length} gradini dell'altezza della griglia):`,
    '```',
    p.altezze,
    '```',
    'Fronte (guardando dal davanti; in alto il cielo):',
    '```',
    f.testo,
    '```',
    'Lato destro (guardando da destra):',
    '```',
    d.testo,
    '```',
    ...tagli,
  ].join('\n');
}

/** A horizontal cut at height `z`: the letter of each cell there («.» empty), the back at the top. Doors, rooms and stairs show here. */
export function vistaSezione(g: Grid3, palette: Record<string, PaletteEntry>, z: number, o: OpzioniVista = {}): { testo: string; passo: number } {
  const vis = visibili(g, palette, o.nascoste ?? true);
  const passo = o.passo ?? Math.max(1, Math.ceil(Math.max(g.X, g.Y) / (o.larghezza ?? 50)));
  const XY = g.X * g.Y;
  const righe: string[] = [];
  for (let y0 = 0; y0 < g.Y; y0 += passo) {
    let r = '';
    for (let x0 = 0; x0 < g.X; x0 += passo) {
      const codici: number[] = [];
      let n = 0;
      for (let y = y0; y < Math.min(g.Y, y0 + passo); y++)
        for (let x = x0; x < Math.min(g.X, x0 + passo); x++) {
          n++;
          const c = g.cells[x + y * g.X + Math.min(g.Z - 1, z) * XY];
          if (vis[c]) codici.push(c);
        }
      r += codici.length * 2 < n ? vuoto : nome(g, piuFrequente(codici));
    }
    righe.push(r);
  }
  return { testo: righe.join('\n'), passo };
}
