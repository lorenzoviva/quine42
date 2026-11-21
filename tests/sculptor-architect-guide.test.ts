// The guide of T469 (S3 of T458 § 5) in the Sculptor's prompt: the loops in the core and in the architect's prompt, the textures with
// `<convchain>` (and what a `<wfc>` is not for), the cellar, the Gargantuan's full scale in pieces with the rule of the margin; `path longest`
// and `(xyz+)` for the landscaper, the translucent letters for the joiner and the mason. The pieces of program the prompt shows are taken
// from it and run: they do what the prompt says they do.

import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { filesOf, sculptorRole, sculptorSection } from '../src/kernel/agents/sculptor';
import { WORLD_NODE_LIMITS } from '../src/kernel/validator';
import { run, type Grid3, type GridLimits } from '../src/mj/engine';
import { compileMjx } from '../src/mj/model';
import { FORM_LIMITS, FORM_PIECES, runMjx } from '../src/mj/run';
import { boxOf, classOf } from '../src/mj/classes';

const architect = sculptorRole(bundledFiles, 'architect');
const core = sculptorRole(bundledFiles, 'landscaper');
/** A section of the architect's prompt, from its title to the next. */
function section(title: string): string {
  const at = architect.indexOf(`## ${title}`);
  expect(at, title).toBeGreaterThanOrEqual(0);
  const next = architect.indexOf('\n## ', at + 3);
  return architect.slice(at, next < 0 ? undefined : next);
}
/** The letters of a layer of a grid (the empty cell `B`). */
const layer = (g: Grid3, z = 0) => Array.from(g.cells.subarray(z * g.X * g.Y, (z + 1) * g.X * g.Y), (c) => (c === 0 ? 'B' : g.alphabet[c])).join('');
const count = (s: string, ch: string) => [...s].filter((c) => c === ch).length;

describe('la guida di T469 nel prompt dello Scultore', () => {
  it('il nucleo insegna il ciclo, la map frazionaria e clear, a ogni mestiere e alle azioni', () => {
    for (const text of [core, sculptorRole(bundledFiles, 'actions')]) {
      expect(text).toContain('Loops: `<markov>` repeats');
      expect(text).toContain('when the LAST one works they all');
      expect(text).toContain('`<markov><sequence>…</sequence></markov>` is a loop');
    }
    expect(core).toContain('scale="1/3 1/3 1"');
    expect(core).toContain('clear="False"');
  });

  it("l'Architetto porta i cicli, le trame con convchain e la wfc, la cantina e i pezzi con la regola del margine", () => {
    const loops = section('Loops: grow until a mark stops it');
    expect(loops).toContain('when the LAST one works they all start again');
    expect(loops).toContain('<prl p="0.5" in="N" out="M"/>');
    const textures = section('Textures: `<convchain>` on the plan');
    expect(textures).toContain('<sample>');
    expect(textures).toContain('65 536 cells');
    expect(textures).toContain('A `<wfc>` makes a grid of its own');
    const cellar = section('Under the ground: a cellar');
    expect(cellar).toContain('<import file="part-cellar"/>');
    expect(cellar).toContain('a body walking down from the door');
    const pieces = section("A Gargantuan's full scale in pieces");
    expect(pieces).toContain('<pieces piece="125" margin="24">');
    expect(pieces).toContain('reaches no farther than the margin gives the whole grid, voxel by voxel');
    expect(pieces).toContain('part-battlements counts from the corners');
  });

  it('le sezioni: path longest e (xyz+) al Paesaggista, le lettere traslucide al Mobiliere e al Capomastro, a nessun altro', () => {
    const landscaper = sculptorSection(bundledFiles, 'landscaper');
    expect(landscaper).toContain('longest="True"');
    expect(landscaper).toContain('symmetry="(xyz+)"');
    for (const s of ['joiner', 'mason'] as const) expect(sculptorSection(bundledFiles, s), s).toMatch(/alpha="0\.4"/);
    for (const s of ['landscaper', 'tailor', 'figurist', 'coachbuilder'] as const) expect(sculptorSection(bundledFiles, s), s).not.toContain('alpha=');
    for (const s of ['joiner', 'tailor', 'figurist', 'mason', 'coachbuilder'] as const) expect(sculptorSection(bundledFiles, s), s).not.toContain('longest=');
  });

  it('il ciclo del mastio del prompt gira: cresce nella sua stanza a un anello per giro finché il segno o il bordo della stanza non lo ferma', () => {
    const loops = section('Loops: grow until a mark stops it');
    const loop = /```xml\n([\s\S]*?)```/.exec(loops)![1];
    const room = /The room first: `([^`]*)`/.exec(loops)![1];
    // A plan of 40 × 40: the lot E, the centre H; the room, a first square of 9 × 9, the loop of the prompt.
    const xml = `<sequence values="BHEiuz" symmetry="(xy)" ground="E" origin="True" size="40 40 1">
      ${room}
      <all steps="4"><rule in="[Hi][Eu]" out="*i"/><rule in="[Hi]*/*[Eu]" out="**/*i"/></all>
      ${loop}
    </sequence>`;
    const p = compileMjx(xml).program;
    const sides = new Set<number>();
    for (let seed = 1; seed <= 8; seed++) {
      const r = run(p, seed);
      expect(r.finished).toBe(true);
      const t = layer(r.grid);
      // The marks are gone, the room is ground again; the keep is a square around the centre, never in the seven cells of the edge.
      expect(count(t, 'z') + count(t, 'u')).toBe(0);
      const cells = [...t].flatMap((c, i) => (c === 'i' || c === 'H' ? [[i % 40, Math.floor(i / 40)]] : []));
      const xs = cells.map(([x]) => x), ys = cells.map(([, y]) => y);
      const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
      expect(cells.length).toBe((x1 - x0 + 1) * (y1 - y0 + 1));
      expect(Math.min(x0, y0)).toBeGreaterThanOrEqual(7);
      expect(Math.max(x1, y1)).toBeLessThanOrEqual(32);
      expect(x1 - x0 + 1).toBeGreaterThanOrEqual(9);
      sides.add(x1 - x0 + 1);
    }
    // The size is the seeds': the rare mark stops it at another ring.
    expect(sides.size).toBeGreaterThan(1);
  });

  it('la trama del prompt gira dentro i tetti del mondo, su uno strato solo, e oltre 65 536 celle il mondo la rifiuta', () => {
    const chain = /`(<convchain\s[\s\S]*?<\/convchain>)`/.exec(section('Textures: `<convchain>` on the plan'))![1];
    const xml = (size: string) => `<sequence values="BcEl" ground="c" size="${size}">${chain}</sequence>`;
    const r = runMjx(compileMjx(xml('60 60 4')), 2, { ceilings: WORLD_NODE_LIMITS });
    expect(r.finished).toBe(true);
    const ground = layer(r.grid);
    // Flagstones and grass in patches, both of them; the layers above are untouched.
    expect(count(ground, 'l')).toBeGreaterThan(0.2 * 3600);
    expect(count(ground, 'c')).toBeGreaterThan(0.2 * 3600);
    expect(layer(r.grid, 1) + layer(r.grid, 2)).toBe('B'.repeat(7200));
    expect(() => runMjx(compileMjx(xml('260 260 2')), 1, { ceilings: WORLD_NODE_LIMITS })).toThrow(/nel mondo lavora su al più 65536 celle/);
  });

  it('i pezzi del prompt: con il margine 24 porte e scale della rocca a Gargantuesca sono quelle della griglia intera, col 12 la scala si spezza', () => {
    // The fort of the bench written as the Sculptor would with the guide (lab/banco/taglie/scultore-rocca-ciclo.xml): its doors and its
    // stairs (part-door, part-stair) in the pieces of the prompt, everything after them cut, against the same nodes on the whole grid.
    const rocca = fs.readFileSync('lab/banco/taglie/scultore-rocca-ciclo.xml', 'utf8');
    const open = /<pieces piece="125" margin="24">/.exec(section("A Gargantuan's full scale in pieces"))![0];
    const from = rocca.indexOf('<!-- 2. The doors'), to = rocca.indexOf('<!-- 4. Battlements'), end = rocca.indexOf('</sequence>\n    </map>');
    const cut = (inner: string) => rocca.slice(0, from) + inner + '\n' + rocca.slice(end);
    const files = filesOf(rocca, bundledFiles);
    const limits: GridLimits = { ...FORM_LIMITS, pieces: FORM_PIECES };
    const size = boxOf(classOf('structure')!, 'gargantuan');
    const grid = (xml: string) => run(compileMjx(xml, { size, files }).program, 1, 5_000_000, limits, { deadline: 120_000 }).grid;
    const whole = grid(cut(rocca.slice(from, to)));
    const differ = (margin: string) => {
      const g = grid(cut(open.replace('"24"', `"${margin}"`) + rocca.slice(from, to) + '</pieces>'));
      let n = 0;
      for (let i = 0; i < g.cells.length; i++) if (g.alphabet[g.cells[i]] !== whole.alphabet[whole.cells[i]]) n++;
      return n;
    };
    expect(differ('24')).toBe(0);
    expect(differ('12')).toBeGreaterThan(0);
  }, 120_000);
});
