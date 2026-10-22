import { describe, expect, it } from 'vitest';
import { run, type Grid3, type Program3 } from '../mj3d/engine';
import { EXAMPLES } from '../mj3d/examples';
import { viandante } from '../programs/viandante';
import { toMjx } from '../mjx/convert';
import { compileMjx } from '../mjx/model';
import { OFFICIAL } from '../mjx/official';
import { act, clipFrames, runMjx } from '../mjx/run';
import { extractXml, mjxSystem } from '../mjx/sculptor';

const EXAMPLE_XML = Object.fromEntries(
  Object.entries(import.meta.glob('../mjx/models/*.xml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>).map(([k, v]) => [k.replace(/^.*\/|\.xml$/g, ''), v]),
);

const letters = (g: Grid3) => Array.from(g.cells, (c) => g.alphabet[c]).join('');
const count = (g: Grid3) => {
  const n: Record<string, number> = {};
  for (const c of g.cells) n[g.alphabet[c]] = (n[g.alphabet[c]] ?? 0) + 1;
  return n;
};

describe('MarkovJunior XML (lab/mjx)', () => {
  it('reads layers top first, as MarkovJunior does', () => {
    const m = compileMjx('<one values="BWN" size="1 1 2" ground="W" in="B W" out="N W"/>');
    const g = runMjx(m, 1).grid;
    // z = 0 is the floor (W); the cell above it matched "B over W".
    expect(letters(g)).toBe('WN');
  });

  it('uses the first value as the empty cell and MarkovJunior colours', () => {
    const m = compileMjx('<sequence values="BRG" size="3 3 3"><prl in="B" out="R" steps="1"/></sequence>');
    expect(m.program.palette.R.color).toBe('#ff004d');
    expect(m.program.palette.B).toBeUndefined();
    expect(count(runMjx(m, 1).grid).R).toBe(27);
  });

  it('says where the program is wrong', () => {
    expect(() => compileMjx('<sequence values="BW" size="4 4 4">\n  <one in="BX" out="WW"/>\n</sequence>', { strict: true })).toThrow(/riga 2.*"X"/);
    // Without strict, what the sculptors get wrong in form is mended, with a warning.
    const m = compileMjx('<sequence values="B W W" size="4 4 4">\n  <color symbol="X" value="ff0000" part="busto"/>\n  <one in="BX" out="WW"/>\n</sequence>');
    expect(m.warnings.join(' ')).toMatch(/spazi.*ripetuta|ripetuta.*spazi/);
    expect(m.warnings.join(' ')).toMatch(/"X".*aggiunta/);
    expect(m.warnings.join(' ')).toMatch(/busto/);
    expect(() => compileMjx('<sequence values="BW" size="4 4 4">\n  <one in="B" out="W">\n</sequence>')).toThrow(/riga 3/);
    expect(() => compileMjx('<sequence values="BW" size="4 4 4"><wfc/></sequence>')).toThrow(/WFC/);
    expect(() => compileMjx('<one values="BW" size="4 4 4" in="B" out="W" symmetry="(ab)"/>')).toThrow(/simmetria/);
  });

  it('runs the 3D models of MarkovJunior unchanged', () => {
    for (const o of OFFICIAL) {
      const m = compileMjx(o.xml, { size: o.size });
      const r = runMjx(m, 7, { maxSteps: o.steps ?? 5_000_000, deadline: 30_000 });
      const n = count(r.grid);
      if (o.name === 'Growth') expect(n.W).toBe(3001);
      if (o.name === 'MazeGrowth') {
        // A maze is a tree: one corridor cell (A) between every two rooms (W).
        expect(n.A).toBe(n.W - 1);
        expect(r.finished).toBe(true);
      }
      if (o.name === 'Counting') expect(n).toMatchObject({ R: 8, G: 72 });
      if (!o.steps) expect(r.finished, o.name).toBe(true);
    }
  }, 120_000);

  it('rewrites the JSON programs of steps 8A-8E without changing a voxel', () => {
    const programs: Program3[] = [...EXAMPLES.map((e) => e.program), viandante(28, [20, 15, 30])];
    for (const p of programs) {
      const xml = toMjx(p);
      const m = compileMjx(xml);
      // Letters may be renamed (B is the empty cell): compare what each voxel looks like.
      const look = (g: Grid3, pal: Program3['palette']) => Array.from(g.cells, (c) => (c ? (pal[g.alphabet[c]]?.hidden ? 'h' : pal[g.alphabet[c]]?.color ?? 'h') : '.')).join();
      for (const seed of [1, 2]) expect(look(runMjx(m, seed, { maxSteps: 20000 }).grid, m.program.palette), p.name).toBe(look(run(p, seed).grid, p.palette));
    }
  });

  it('animates and acts with MarkovJunior rules on the finished model', () => {
    const m = compileMjx(`
      <sequence values="BWDO" size="3 3 3" symmetry="(xy)">
        <prl in="B" out="W" steps="1"/>
        <action name="apri" label="Apri"><all in="W" out="B"/></action>
      </sequence>
      <animation name="brace" frames="4"><prl in="W" out="O" p="0.5" steps="1"/></animation>`);
    expect(m.actions.map((a) => a.name)).toEqual(['apri']);
    const g = runMjx(m, 1).grid;
    const frames = clipFrames(g, m.animations[0], 1);
    expect(frames).toHaveLength(4);
    expect(count(frames[0]).W).toBe(27);
    expect(count(frames[3]).O ?? 0).toBeGreaterThan(count(frames[1]).O ?? 0);
    act(g, m.actions[0], 1);
    expect(count(g)['.']).toBe(27);
  });

  it('gives the sculptor the palette, the boxes and two examples of the class, and reads its answer', () => {
    const s = mjxSystem('persona');
    expect(s).toContain('IL PRIMO STRATO È QUELLO IN ALTO');
    expect(s).toContain('N ab5236');
    expect(s).toContain('persona (persona): 20×15×30');
    expect(s).not.toMatch(/@@/);
    expect(s).toContain('Fabbro robusto');
    expect(extractXml('Ecco:\n```xml\n<one values="BW" in="B" out="W"/>\n```\nfine')).toBe('<one values="BW" in="B" out="W"/>');
    expect(extractXml('<one values="BW" in="B" out="W"/>')).toBe('<one values="BW" in="B" out="W"/>');
    // Every model the examples come from compiles and finishes.
    for (const id of ['viandante', 'fabbro', 'gatto', 'lupo', 'pino', 'fiore', 'cespuglio', 'masso', 'falo', 'barile', 'casa']) {
      const m = compileMjx(EXAMPLE_XML[id]);
      expect(runMjx(m, 1).finished, id).toBe(true);
    }
  });

  it('keeps the model growing, frame by frame', () => {
    const m = compileMjx('<one values="BW" size="9 9 9" origin="True" in="WB" out="WW" steps="300"/>');
    const r = runMjx(m, 1, { snapshots: 20 });
    expect(r.snapshots!.length).toBeGreaterThan(10);
    expect(r.snapshots!.length).toBeLessThanOrEqual(41);
    const w = r.snapshots!.map((s) => s.cells.filter((c) => c !== 0).length);
    expect(w[0]).toBe(1);
    expect(w[w.length - 1]).toBe(301);
  });
});
