// The compiler reads MarkovJunior of mxgmn as it is (T531, A1-6, docs/design/markov-allineamento.md § 3.1 and § 8, ADR-0265):
// `compileMjx(…, { original: true })`. The transliteration of the original's characters into our symbols (src/mj/original.ts), its unions
// where the original finds them, its symmetries by the grid's layers, `(x)(y)` and `(xy+)`, and with `strict` the original's errors. Our
// dialect (no `original`) does not change: a union anywhere and every symmetry name on every grid are our extensions.

import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { REPO_3D } from '../lab/banco/conformita/casi';
import { OFFICIAL, OFFICIAL_FILES } from '../lab/mjx/official/index';
import { programFor0_6 } from '../src/kernel/migrations';
import { run, type Program3 } from '../src/mj/engine';
import { compileMjx, mjxIncludes } from '../src/mj/model';
import { originalPort, originalProgram, originalText } from '../src/mj/original';
import { MJX_LIMITS } from '../src/mj/run';

const BENCH = 'lab/banco/conformita/mxgmn';
const text = (name: string) => fs.readFileSync(`${BENCH}/${name}.xml`, 'utf8');

describe('la traslitterazione del testo dell’originale (originalProgram)', () => {
  it('una cifra è # e la cifra, un’unione "#" il primo segno che il programma non usa, come la migrazione 0.5 → 0.6', () => {
    const xml = '<sequence values="B8W"><union symbol="#" values="BW"/><union symbol="2" values="8W"/><one in="8#2" out="WW8"/></sequence>';
    expect(originalProgram(xml)).toBe('<sequence values="B#8W"><union symbol="~" values="BW"/><union symbol="#2" values="#8W"/><one in="#8~#2" out="WW#8"/></sequence>');
    // On what the migration met (the digits, the union "#"), the same text: ModernHouse and SeaVilla, but for the spaces of values.
    for (const name of ['ModernHouse', 'SeaVilla', 'CarmaTower'])
      expect(originalProgram(text(name))).toBe(programFor0_6(text(name)).replace(/values="([^"]*)"/g, (_, v: string) => `values="${v.replace(/\s+/g, '')}"`));
  });

  it('un valore che non è una lettera (".", "#", "?") ha un simbolo numerato suo, da #10; "[" e "]" come unioni un segno', () => {
    const xml = '<sequence values="B.#?"><union symbol="[" values="B."/><one in="B.#?[" out="?#.B*"/></sequence>';
    expect(originalProgram(xml)).toBe('<sequence values="B#10#11#12"><union symbol="~" values="B#10"/><one in="B#10#11#12~" out="#12#11#10B*"/></sequence>');
    const m = compileMjx(xml, { size: [5, 1, 1], original: true, strict: true });
    expect(m.warnings).toEqual(['il simbolo "#10" non ha colore nella palette di MarkovJunior: grigio', 'il simbolo "#11" non ha colore nella palette di MarkovJunior: grigio', 'il simbolo "#12" non ha colore nella palette di MarkovJunior: grigio']);
    const r = run(m.program, 1, 10);
    expect(Array.from(r.grid.cells, (c) => r.grid.alphabet[c]).join('')).toBe('.....');
  });

  it('gli spazi di values vanno, come in Grid.Load; misure, passi, nomi e commenti restano', () => {
    expect(originalProgram('<sequence values="B W 3" comment="2 #"><one in="B" out="3" steps="2"/></sequence>')).toBe('<sequence values="BW#3" comment="2 #"><one in="B" out="#3" steps="2"/></sequence>');
  });

  it('i file di testo che il programma legge passano dallo stesso porto, le note e la riga "->" restano', () => {
    const port = originalPort('<sequence values="BW6"><union symbol="#" values="BW"/></sequence>');
    expect(originalText('# a note\nB6#\n->\n6#B', port)).toBe('# a note\nB#6~\n->\n#6~B');
    // CarmaTower's rules hold its union "6" (lab/mjx/official/resources/CarmaTower-side_13x5.txt): read as the original reads them.
    expect(() => compileMjx(text('CarmaTower'), { size: [12, 12, 18], files: OFFICIAL_FILES })).toThrow(/la cifra "2"/);
    expect(compileMjx(text('CarmaTower'), { size: [12, 12, 18], files: OFFICIAL_FILES, original: true, strict: true }).warnings).toEqual([]);
  });
});

describe('le simmetrie dell’originale', () => {
  /** How many cells a rule writes around a W in the middle of a 5 × 5 floor of B, with a symmetry. */
  const around = (rule: string, symmetry: string, opts: { original?: boolean } = {}) => {
    const xml = `<sequence values="BWR" origin="True" symmetry="${symmetry}"><all ${rule}/></sequence>`;
    const r = run(compileMjx(xml, { size: [5, 5, 1], ...opts }).program, 1, 10);
    return Array.from(r.grid.cells).filter((c) => r.grid.alphabet[c] === 'R').length;
  };

  it('(x)(y): i due specchi del piano e il mezzo giro; (xy+): i quattro giri; in tutti e due i dialetti', () => {
    for (const opts of [{}, { original: true }]) {
      // A pattern along x: the mirrors keep it on the row, the turns bring it on the column too.
      expect(around('in="WB" out="*R"', '(x)', opts)).toBe(2);
      expect(around('in="WB" out="*R"', '(x)(y)', opts)).toBe(2);
      expect(around('in="WB" out="*R"', '(xy+)', opts)).toBe(4);
      // A diagonal: one mirror gives two, the two mirrors four.
      expect(around('in="*B/W*" out="*R/**"', '(x)', opts)).toBe(2);
      expect(around('in="*B/W*" out="*R/**"', '(x)(y)', opts)).toBe(4);
      expect(around('in="*B/W*" out="*R/**"', '(xy+)', opts)).toBe(4);
    }
  });

  it('l’originale legge i nomi del quadrato su una griglia piana e quelli del cubo sulle altre; i nostri altrove sono un’estensione', () => {
    const flat = (s: string) => `<sequence values="BW" symmetry="${s}"><one in="B" out="W"/></sequence>`;
    for (const s of ['()', '(x)', '(y)', '(x)(y)', '(xy+)', '(xy)']) expect(compileMjx(flat(s), { size: [3, 3, 1], original: true, strict: true }).warnings).toEqual([]);
    for (const s of ['(z)', '(xyz+)', '(xyz)']) {
      expect(() => compileMjx(flat(s), { size: [3, 3, 1], original: true, strict: true })).toThrow(/l'originale su una griglia piana conosce solo/);
      expect(compileMjx(flat(s), { size: [3, 3, 1], original: true }).warnings[0]).toMatch(/da noi vale com'è \(riparato\)/);
    }
    for (const s of ['()', '(x)', '(z)', '(xy)', '(xyz+)', '(xyz)']) expect(compileMjx(flat(s), { size: [3, 3, 3], original: true, strict: true }).warnings).toEqual([]);
    for (const s of ['(y)', '(x)(y)', '(xy+)']) expect(() => compileMjx(flat(s), { size: [3, 3, 3], original: true, strict: true })).toThrow(/di più strati conosce solo/);
    // Ours reads every name on every grid, strict too.
    for (const s of ['(y)', '(z)', '(x)(y)', '(xy+)', '(xyz)']) for (const z of [1, 3]) expect(compileMjx(flat(s), { size: [3, 3, z], strict: true }).warnings).toEqual([]);
  });

  it('senza symmetry l’originale prende il gruppo della sua griglia: il quadrato su una piana, il cubo altrove; il nostro il cubo', () => {
    const xml = '<sequence values="BW"><one in="B" out="W"/></sequence>';
    const sym = (m: ReturnType<typeof compileMjx>) => (m.program.program as { children: Array<{ symmetry: string }> }).children[0].symmetry;
    expect(sym(compileMjx(xml, { size: [4, 4, 1], original: true }))).toBe('xy');
    expect(sym(compileMjx(xml, { size: [4, 4, 4], original: true }))).toBe('all');
    expect(sym(compileMjx(xml, { size: [4, 4, 1] }))).toBe('all');
  });
});

describe('le unioni dell’originale', () => {
  it('c8: un’unione dentro un nodo di regole l’originale non la trova e non carica il programma; da noi è un’estensione', () => {
    const c8 = fs.readFileSync('lab/banco/conformita/programmi/c8-unione-nel-nodo.xml', 'utf8').trim();
    expect(() => compileMjx(c8, { size: [3, 1, 1], original: true, strict: true })).toThrow(/l'unione "\?" è dentro <one>.*non la trova/);
    expect(compileMjx(c8, { size: [3, 1, 1], original: true }).warnings[0]).toMatch(/da noi vale come estensione \(riparato\)/);
    expect(compileMjx(c8, { size: [3, 1, 1], strict: true }).warnings).toEqual([]);
  });

  it('la trova sotto la sua griglia attraverso sequence e markov, e sotto una map o una wfc per la loro griglia', () => {
    const xml = '<sequence values="BRG"><markov><sequence><union symbol="?" values="R"/><one in="B" out="R"/></sequence><one in="?" out="G"/></markov><map scale="1 1 1" values="BRG"><union symbol="!" values="G"/><one in="!" out="R"/></map></sequence>';
    expect(compileMjx(xml, { size: [3, 1, 1], original: true, strict: true }).warnings).toEqual([]);
    // Inside a path, a convolution or a rule of a map: not found.
    expect(() => compileMjx('<sequence values="BRG"><path from="R" to="G" on="B" color="R"><union symbol="?" values="R"/></path></sequence>', { size: [3, 1, 1], original: true, strict: true })).toThrow(/è dentro <path>/);
  });

  it('un’unione che è già un valore, scritta due volte nella stessa griglia o con un simbolo fuori dai values: l’originale non carica', () => {
    const strict = (xml: string) => () => compileMjx(xml, { size: [3, 1, 1], original: true, strict: true });
    expect(strict('<sequence values="BRG"><union symbol="R" values="BG"/><one in="R" out="G"/></sequence>')).toThrow(/è già un valore della radice/);
    expect(strict('<sequence values="BRG"><union symbol="?" values="BG"/><union symbol="?" values="BG"/><one in="?" out="G"/></sequence>')).toThrow(/scritta due volte nella griglia della radice/);
    expect(strict('<sequence values="BRG"><union symbol="?" values="BW"/><one in="?" out="G"/></sequence>')).toThrow(/nomina "W", fuori dai values della radice/);
    // Ours lets them be, as before.
    expect(compileMjx('<sequence values="BRG"><union symbol="?" values="BG"/><union symbol="?" values="BG"/><one in="?" out="G"/></sequence>', { size: [3, 1, 1], strict: true }).warnings).toEqual([]);
  });
});

describe('i 36 modelli 3D di mxgmn dal loro testo (lab/banco/conformita/mxgmn/)', () => {
  const official = new Map(OFFICIAL.map((m) => [m.name, m]));

  it('si compilano tutti, con strict, come li scrive l’originale; dove il laboratorio ne ha una copia nei nostri simboli, lo stesso programma', () => {
    expect(REPO_3D).toHaveLength(36);
    let copies = 0;
    for (const m of REPO_3D) {
      const xml = text(m.name);
      const files = mjxIncludes(xml, (f) => OFFICIAL_FILES[f], { original: true });
      const ours = compileMjx(xml, { size: m.size, files, strict: true, original: true });
      const copy = official.get(m.name);
      if (!copy) continue;
      copies++;
      expect(JSON.stringify(ours.program), m.name).toBe(JSON.stringify(compileMjx(copy.xml, { size: m.size, files: copy.files ?? OFFICIAL_FILES }).program));
    }
    expect(copies).toBe(30);
  });

  // The six without a copy in the lab (their resources came as text with A1-0): from their text in our engine, to the end.
  it('i sei senza la copia del laboratorio girano nel nostro motore dal loro testo, fino in fondo', { timeout: 120_000 }, () => {
    const without = REPO_3D.filter((m) => !official.has(m.name));
    expect(without.map((m) => m.name)).toEqual(['CarmaTower', 'ColoredKnots', 'DualRetraction3D', 'Knots3D', 'SelectLongKnots', 'SubmergedKnots']);
    for (const m of without) {
      const program = compileMjx(text(m.name), { size: m.size, files: OFFICIAL_FILES, strict: true, original: true }).program as Program3;
      const r = run(program, 1, m.steps, MJX_LIMITS, { deadline: 60_000 });
      expect(r.finished, m.name).toBe(true);
    }
  });
});
