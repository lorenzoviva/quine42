// The lettering of the futuristic skin (T284): proposal 05 «Il quine» of Claude, v2 after the votes, taken from the page as it is.
// `npx vite-node --script tools/vesti/estrai.ts` writes site/skins/futuristica/{scritta.ts, scritta.svg, icona.svg} from the proposal;
// tests/site-skin-futuristica.test.ts checks that what is written there draws the same cells as the proposal, one by one.
//
// The drawing is 13 057 squares of 1.2: the big letters QUINE42 are rows of a small 3×5 QUINE42, and each row starts again from its Q
// at its first small letter and skips the gaps between the big letters. So it is all said by where the small letters are (16 rows),
// the seven small letters and two colours. If the page says anything else, this refuses it: it never draws its own idea of the proposal.

import fs from 'node:fs';
import path from 'node:path';

/** The proposal, in the repository since D41. */
export const PROPOSAL = 'docs/design/logo/proposte/claude/QUINE42 Logo v2 standalone.html';
/** Its section and its drawing on the dark ground. */
export const SECTION = 'dir5';
export const DRAWING = 'dir5-scuro';

export interface Lettering {
  /** The small text, as the drawing's `aria-label` says it. */
  text: string;
  /** The small letters: 3 × 5 cells each, row by row, '#' drawn. */
  glyphs: Record<string, string>;
  /** One string per row of small text, one char per small letter's place: '#' where there is one. */
  rows: string[];
  /** The side of a cell, and where cell (0, 0) is, in the units of the drawing. */
  cell: number;
  x0: number;
  y0: number;
  /** Cells from a small letter to the next, from a row to the next. */
  pitch: [number, number];
  /** The cell row of the first row of small text. */
  top: number;
  viewBox: [number, number, number, number];
  colors: { ground: string; text: string; q: string };
}

export const GLYPH_W = 3;
export const GLYPH_H = 5;

/** The page inside a "__bundler" standalone file: its template, as it was written. A plain page stays as it is. */
export function unbundle(html: string): string {
  const open = '<script type="__bundler/template">';
  const at = html.indexOf(open);
  if (at < 0) return html;
  const end = html.indexOf('</script>', at);
  return JSON.parse(html.slice(at + open.length, end)) as string;
}

/** From `<section id="…">` to the next section, or to the end. */
export function sectionOf(page: string, id: string): string {
  const at = page.indexOf(`<section id="${id}"`);
  if (at < 0) throw new Error(`la sezione ${id} non c'è`);
  const next = page.indexOf('<section id="', at + 1);
  return page.slice(at, next < 0 ? undefined : next);
}

/** An `<svg id="…">` of a page. */
export function svgOf(html: string, id: string): string {
  const m = html.match(new RegExp(`<svg[^>]*id="${id}"[\\s\\S]*?</svg>`));
  if (!m) throw new Error(`il disegno ${id} non c'è`);
  return m[0];
}

const round = (v: number) => Math.round(v * 1000) / 1000;

/** The squares of a drawing made of `h…v…h-…z` squares: their corner and their fill. */
export function squaresOf(svg: string): Array<{ x: number; y: number; side: number; fill: string }> {
  const out: Array<{ x: number; y: number; side: number; fill: string }> = [];
  for (const [, d, fill] of svg.matchAll(/<path d="([^"]*)" fill="([^"]*)"/g)) {
    const pieces = d.split('z').filter(Boolean);
    for (const piece of pieces) {
      const m = piece.match(/^M(-?[\d.]+) (-?[\d.]+)h([\d.]+)v([\d.]+)h-([\d.]+)$/);
      if (!m || m[3] !== m[4] || m[3] !== m[5]) throw new Error(`non è un quadrato: ${piece.slice(0, 40)}`);
      out.push({ x: Number(m[1]), y: Number(m[2]), side: Number(m[3]), fill: fill.toLowerCase() });
    }
  }
  return out;
}

/** The squares as `column,row` of the cell grid → fill. */
export function cellsOf(squares: Array<{ x: number; y: number; fill: string }>, cell: number, x0: number, y0: number): Map<string, string> {
  const cells = new Map<string, string>();
  for (const s of squares) {
    const c = (s.x - x0) / cell;
    const r = (s.y - y0) / cell;
    if (Math.abs(c - Math.round(c)) > 1e-6 || Math.abs(r - Math.round(r)) > 1e-6) throw new Error(`quadrato fuori griglia: ${s.x} ${s.y}`);
    cells.set(`${Math.round(c)},${Math.round(r)}`, s.fill);
  }
  return cells;
}

/** Reads the lettering of the proposal: refuses whatever is not rows of the small text. */
export function extractLettering(html: string): Lettering {
  const section = sectionOf(unbundle(html), SECTION);
  const svg = svgOf(section, DRAWING);
  const text = svg.match(/aria-label="([^"]+)"/)?.[1];
  if (!text) throw new Error('il disegno non dice il suo testo');
  const viewBox = (svg.match(/viewBox="([^"]+)"/)?.[1] ?? '').split(/\s+/).map(Number) as [number, number, number, number];
  if (viewBox.length !== 4 || viewBox.some((v) => !Number.isFinite(v))) throw new Error('viewBox illeggibile');
  const ground = section.match(new RegExp(`background:(#[0-9a-f]{6})[^>]*>\\s*<svg[^>]*id="${DRAWING}"`, 'i'))?.[1]?.toLowerCase();
  if (!ground) throw new Error('il fondo del disegno non c\'è');

  const squares = squaresOf(svg);
  const sides = new Set(squares.map((s) => s.side));
  if (sides.size !== 1) throw new Error(`quadrati di misure diverse: ${[...sides]}`);
  const cell = [...sides][0];
  const phase = (v: number) => round(((v % cell) + cell) % cell);
  const x0 = phase(squares[0].x);
  const y0 = phase(squares[0].y);
  const cells = cellsOf(squares, cell, x0, y0);

  // The rows of small text: runs of 5 cell rows, one empty between them.
  const usedRows = [...new Set([...cells.keys()].map((k) => Number(k.split(',')[1])))].sort((a, b) => a - b);
  const top = usedRows[0];
  const pitchY = GLYPH_H + 1;
  if (usedRows.some((r) => (r - top) % pitchY >= GLYPH_H)) throw new Error('le righe non sono alte 5 celle con 1 di stacco');
  const lines = (usedRows[usedRows.length - 1] - top + 1 + 1) / pitchY;
  // The small letters: 3 cells wide with 1 between them, on columns that never move.
  const pitchX = GLYPH_W + 1;
  const usedCols = [...new Set([...cells.keys()].map((k) => Number(k.split(',')[0])))];
  const gap = [0, 1, 2, 3].find((p) => usedCols.every((c) => ((c % pitchX) + pitchX) % pitchX !== p));
  if (gap === undefined) throw new Error('le lettere piccole non stanno su colonne fisse');
  const shift = (gap + 1) % pitchX;
  if (usedCols.some((c) => c < shift)) throw new Error('una lettera piccola prima della prima colonna');
  const width = Math.floor((Math.max(...usedCols) - shift) / pitchX) + 1;

  const fills = [...new Set(squares.map((s) => s.fill))];
  if (fills.length !== 2) throw new Error(`i colori non sono due: ${fills}`);

  const glyphAt = (i: number, j: number) => {
    let bits = '';
    const colors = new Set<string>();
    for (let r = 0; r < GLYPH_H; r++)
      for (let d = 0; d < GLYPH_W; d++) {
        const fill = cells.get(`${shift + pitchX * i + d},${top + pitchY * j + r}`);
        bits += fill ? '#' : '.';
        if (fill) colors.add(fill);
      }
    return { bits, colors };
  };

  // Each row starts from the first small letter of the text: the glyphs get their names from the order of the text.
  const glyphs: Record<string, string> = {};
  const colorOf: Record<string, string> = {};
  const rows: string[] = [];
  for (let j = 0; j < lines; j++) {
    let row = '';
    let n = 0;
    for (let i = 0; i < width; i++) {
      const { bits, colors } = glyphAt(i, j);
      if (!colors.size) {
        row += '.';
        continue;
      }
      if (colors.size !== 1) throw new Error(`una lettera piccola di due colori (riga ${j}, colonna ${i})`);
      const letter = text[n % text.length];
      if (glyphs[letter] === undefined) glyphs[letter] = bits;
      else if (glyphs[letter] !== bits) throw new Error(`riga ${j}, colonna ${i}: ci si aspettava «${letter}»`);
      const color = [...colors][0];
      if (colorOf[letter] === undefined) colorOf[letter] = color;
      else if (colorOf[letter] !== color) throw new Error(`«${letter}» di due colori`);
      row += '#';
      n++;
    }
    rows.push(row);
  }
  if (Object.keys(glyphs).length !== new Set(text).size) throw new Error('non tutte le lettere del testo sono nel disegno');
  const first = text[0];
  const others = new Set(Object.entries(colorOf).filter(([k]) => k !== first).map(([, v]) => v));
  if (others.size !== 1 || others.has(colorOf[first])) throw new Error('i colori non sono «la prima lettera» e «le altre»');

  // The module keeps the drawing's own cell numbers: the small letters start at column 0.
  if (shift !== 0) throw new Error(`le lettere piccole partono dalla colonna ${shift}: il modulo suppone 0`);
  const lettering: Lettering = {
    text,
    glyphs,
    rows,
    cell,
    x0,
    y0,
    pitch: [pitchX, pitchY],
    top,
    viewBox,
    colors: { ground, text: [...others][0], q: colorOf[first] },
  };
  // What is written must draw the very same cells.
  const again = letteringCells(lettering);
  if (again.size !== cells.size || [...cells].some(([k, v]) => again.get(k) !== v)) throw new Error('la scritta ricavata non ridisegna la proposta');
  return lettering;
}

/** The cells the lettering draws, `column,row` → fill, as `cellsOf` reads them from the drawing. */
export function letteringCells(l: Lettering, offset = 0): Map<string, string> {
  const cells = new Map<string, string>();
  const [px, py] = l.pitch;
  l.rows.forEach((row, j) => {
    let n = 0;
    for (let i = 0; i < row.length; i++) {
      if (row[i] !== '#') continue;
      const letter = l.text[(n + offset) % l.text.length];
      const bits = l.glyphs[letter];
      const fill = letter === l.text[0] ? l.colors.q : l.colors.text;
      for (let r = 0; r < GLYPH_H; r++) for (let d = 0; d < GLYPH_W; d++) if (bits[r * GLYPH_W + d] === '#') cells.set(`${px * i + d},${l.top + py * j + r}`, fill);
      n++;
    }
  });
  return cells;
}

/** The cells of the drawing's box that hold something: [first column, first row, columns, rows]. */
export function letteringBox(l: Lettering): [number, number, number, number] {
  const cols = l.rows.flatMap((row) => [...row].map((c, i) => (c === '#' ? i : -1)).filter((i) => i >= 0));
  const first = Math.min(...cols);
  const last = Math.max(...cols);
  const [px, py] = l.pitch;
  return [px * first, l.top, px * (last - first) + GLYPH_W, py * (l.rows.length - 1) + GLYPH_H];
}

/** A glyph as a path in cells, a run of each row at a time. */
function glyphPath(bits: string): string {
  let d = '';
  for (let r = 0; r < GLYPH_H; r++) {
    let d0 = -1;
    for (let c = 0; c <= GLYPH_W; c++) {
      const on = c < GLYPH_W && bits[r * GLYPH_W + c] === '#';
      if (on && d0 < 0) d0 = c;
      if (!on && d0 >= 0) {
        d += `M${d0} ${r}h${c - d0}v1h-${c - d0}z`;
        d0 = -1;
      }
    }
  }
  return d;
}

/**
 * The lettering as a still SVG, for the bar and the footer: the same cells, a `<use>` per small letter, a group per colour and a group
 * per row in it, so that a small letter only says where it is across. Its box is the drawing's, without the empty margin of the sheet.
 */
export function letteringSvg(l: Lettering): string {
  const [bx, by, bw, bh] = letteringBox(l);
  const [px, py] = l.pitch;
  const ids = Object.fromEntries([...new Set(l.text)].map((c, i) => [c, String.fromCharCode(97 + i)]));
  const defs = [...new Set(l.text)].map((c) => `<path id="${ids[c]}" d="${glyphPath(l.glyphs[c])}"/>`).join('');
  const fillOf = (letter: string) => (letter === l.text[0] ? l.colors.q : l.colors.text);
  const body = [l.colors.text, l.colors.q]
    .map((fill) => {
      const rows = l.rows.map((row, j) => {
        const uses: string[] = [];
        let n = 0;
        for (let i = 0; i < row.length; i++) {
          if (row[i] !== '#') continue;
          const letter = l.text[n++ % l.text.length];
          if (fillOf(letter) === fill) uses.push(`<use href="#${ids[letter]}" x="${px * i - bx}"/>`);
        }
        return uses.length ? `<g transform="translate(0 ${l.top + py * j - by})">${uses.join('')}</g>` : '';
      });
      return `<g fill="${fill}">${rows.join('')}</g>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${bw} ${bh}" role="img" aria-label="${l.text}"><defs>${defs}</defs>${body}</svg>
`;
}

/** The first big letter: the columns of small letters up to the first column that is empty in every row. */
export function firstLetter(l: Lettering): { from: number; to: number } {
  const width = Math.max(...l.rows.map((r) => r.length));
  const used = (i: number) => l.rows.some((r) => r[i] === '#');
  let from = 0;
  while (from < width && !used(from)) from++;
  let to = from;
  while (to < width && used(to)) to++;
  return { from, to };
}

/** Pixels as a path, a run of each row at a time. */
function runs(pixels: Array<[number, number]>): string {
  const rows = new Map<number, number[]>();
  for (const [x, y] of pixels) rows.set(y, [...(rows.get(y) ?? []), x]);
  let d = '';
  for (const [y, xs] of [...rows].sort((a, b) => a[0] - b[0])) {
    xs.sort((a, b) => a - b);
    for (let k = 0; k < xs.length; ) {
      let e = k;
      while (e + 1 < xs.length && xs[e + 1] === xs[e] + 1) e++;
      const n = xs[e] - xs[k] + 1;
      d += `M${xs[k]} ${y}h${n}v1h-${n}z`;
      k = e + 1;
    }
  }
  return d;
}

/**
 * The icon (T284): the first letter of the lettering, the Q, drawn from the lettering itself at two sizes in one file.
 * Small (a favicon, up to 63 px): one pixel row for each row of small text, 16 rows, so at 16 px it is the lettering's own Q pixel for
 * pixel in height; across, the small letters fall into 15 columns, each pixel the colour of the small letters it covers most (the
 * small Q pink, the others cyan), as the lettering looks from afar. Large (64 px and more, a media query of the SVG): the very cells of
 * the Q of the lettering, small letters and all.
 */
export function iconSvg(l: Lettering, columns = 15): string {
  const { from, to } = firstLetter(l);
  const span = to - from;
  const size = Math.max(l.rows.length, columns);
  const pixels: Record<string, Array<[number, number]>> = { [l.colors.text]: [], [l.colors.q]: [] };
  const left = Math.floor((size - columns) / 2);
  l.rows.forEach((row, j) => {
    // What each small letter of the row is: the row restarts from the first letter of the text, as in the lettering.
    const letters: string[] = [];
    let n = 0;
    for (let i = 0; i < row.length; i++) {
      if (row[i] === '#') letters[i] = l.text[n++ % l.text.length];
    }
    for (let p = 0; p < columns; p++) {
      const a = from + (p * span) / columns;
      const b = from + ((p + 1) * span) / columns;
      let on = 0;
      let q = 0;
      for (let i = Math.floor(a); i < Math.ceil(b); i++) {
        const part = Math.min(b, i + 1) - Math.max(a, i);
        if (!letters[i]) continue;
        on += part;
        if (letters[i] === l.text[0]) q += part;
      }
      if (on / (b - a) < 0.5) continue;
      pixels[q / on >= 0.5 ? l.colors.q : l.colors.text].push([left + p, j]);
    }
  });
  const coarse = Object.entries(pixels)
    .filter(([, d]) => d.length)
    .map(([fill, d]) => `<path fill="${fill}" d="${runs(d)}"/>`)
    .join('');
  // The large one: the small letters of the first big letter, each a `<use>` of its glyph, fitted into the icon with a margin of one unit.
  const [px, py] = l.pitch;
  const w = px * (span - 1) + GLYPH_W;
  const h = py * (l.rows.length - 1) + GLYPH_H;
  const ids = Object.fromEntries([...l.text].map((c, i) => [c, `i${i}`]));
  const defs = [...new Set(l.text)].map((c) => `<path id="${ids[c]}" d="${glyphPath(l.glyphs[c])}"/>`).join('');
  const uses: Record<string, string[]> = { [l.colors.text]: [], [l.colors.q]: [] };
  l.rows.forEach((row, j) => {
    let n = 0;
    for (let i = 0; i < row.length; i++) {
      if (row[i] !== '#') continue;
      const letter = l.text[n++ % l.text.length];
      if (i < from || i >= to) continue;
      uses[letter === l.text[0] ? l.colors.q : l.colors.text].push(`<use href="#${ids[letter]}" x="${px * (i - from)}" y="${py * j}"/>`);
    }
  });
  const side = Math.max(w, h);
  const scale = (size - 2) / side;
  const dx = 1 + ((side - w) * scale) / 2;
  const dy = 1 + ((side - h) * scale) / 2;
  const large = Object.entries(uses)
    .filter(([, u]) => u.length)
    .map(([fill, u]) => `<g fill="${fill}">${u.join('')}</g>`)
    .join('');
  const style = '.l{display:none}@media (min-width:64px){.s{display:none}.l{display:inline}}';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><style>${style}</style>` +
    `<rect width="${size}" height="${size}" fill="${l.colors.ground}"/>` +
    `<g class="s" shape-rendering="crispEdges">${coarse}</g>` +
    `<defs>${defs}</defs><g class="l" transform="translate(${round(dx)} ${round(dy)}) scale(${round(scale)})">${large}</g></svg>
`
  );
}

/** The TS module of the skin with the lettering. */
export function letteringModule(l: Lettering): string {
  const rows = l.rows.map((r) => `    '${r}',`).join('\n');
  const glyphs = Object.entries(l.glyphs)
    .map(([k, v]) => `    '${k}': '${v}',`)
    .join('\n');
  return `// Generated by tools/vesti/scritta.ts from ${PROPOSAL} (§ 05 «Il quine», v2 after the votes): do not edit by hand.
// tests/site-skin-futuristica.test.ts checks that these cells are the proposal's, one by one.

/** The lettering of the proposal: the big letters ${l.text} are rows of the small text ${l.text}. */
export const LETTERING = {
  /** The small text. Each row starts again from its first letter, at its first small letter, and skips the gaps between the big letters. */
  text: '${l.text}',
  /** The small letters, ${GLYPH_W} × ${GLYPH_H} cells, row by row: '#' is drawn. */
  glyphs: {
${glyphs}
  } as Record<string, string>,
  /** Where the small letters are: one string per row of small text, '#' a small letter. */
  rows: [
${rows}
  ],
  /** Cells from a small letter to the next and from a row to the next; the cell row of the first row; the side of a cell in the proposal. */
  pitch: [${l.pitch[0]}, ${l.pitch[1]}] as const,
  top: ${l.top},
  cell: ${l.cell},
  /** The proposal on the dark ground: the small ${l.text[0]} pink, the other small letters cyan. */
  colors: { ground: '${l.colors.ground}', text: '${l.colors.text}', q: '${l.colors.q}' },
};
`;
}

/** Writes the skin's files from the proposal. */
export function writeLettering(root: string): string[] {
  const lettering = extractLettering(fs.readFileSync(path.join(root, PROPOSAL), 'utf8'));
  const dir = path.join(root, 'site', 'skins', 'futuristica');
  const files: Record<string, string> = {
    'scritta.ts': letteringModule(lettering),
    'scritta.svg': letteringSvg(lettering),
    'icona.svg': iconSvg(lettering),
  };
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), text);
  return Object.keys(files).map((f) => path.join('site', 'skins', 'futuristica', f));
}

