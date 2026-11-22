// The parts of the trades (T471, S5 of T458, ADR-0241, lab/banco/parti/README.md): the wheel, the windows, the leaves and lids that open,
// written by hand in the seed like the parts one lives in. Each alone builds its trial scene and passes the validator; included, it works only
// from the letters its contract names, in any box and at any density (the joiner's wardrobe and cart, the mason's cottage, the Sculptor's
// country house with part-window); `partResources` offers each to the specialties its entry in the index says, and the request of every trade
// carries its own and no other's.

import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { checkProgram, DEFAULT_SCULPTORS, filesOf, MAX_PARTS, partResources, partSpecialties, sculpt, SPECIALTIES, TRADE_PARTS, type SculptRequest, type SculptorSpecialty } from '../src/kernel/agents/sculptor';
import { Council } from '../src/kernel/agents/council';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { bundledFiles } from '../src/kernel/bundle';
import type { FileMap } from '../src/kernel/types';
import { modelErrors } from '../src/kernel/validator';
import { analyse } from '../src/mj/check';
import { classOf } from '../src/mj/classes';
import { compileMjx, mjxIncludes, type MjxFiles } from '../src/mj/model';
import { act, runMjx } from '../src/mj/run';
import { letterAt, pieces, sizeOf, type Piece } from '../lab/banco/parti/misure';
import { villettaWithWindows } from '../lab/banco/parti/villetta';
import { MOCK_STRUCTURE_PROGRAM } from '../src/kernel/ai/mockStructure';

const TRADE_PARTS_IDS = ['part-wheel', 'part-window', 'part-leaf'];
const read = (id: string) => fs.readFileSync(`universe/models/${id}.xml`, 'utf8');
const seedFiles = (xml: string): MjxFiles => mjxIncludes(xml, (f) => (fs.existsSync(`universe/models/${f}`) ? fs.readFileSync(`universe/models/${f}`, 'utf8') : undefined));
const bench = (name: string) => fs.readFileSync(`lab/banco/parti/${name}.xml`, 'utf8');
function run(xml: string, size?: [number, number, number], seed = 1) {
  const m = compileMjx(xml, { ...(size ? { size } : {}), files: seedFiles(xml) });
  const r = runMjx(m, seed, { deadline: 20_000 });
  return { m, r, g: r.grid };
}
/** The wheels of a grid: the pieces of I and J bigger than a spoke's cell. */
const wheels = (g: Parameters<typeof pieces>[0]): Piece[] => pieces(g, ['I', 'J']).filter((p) => p.cells > 20);

describe('the parts of the trades alone (T471)', () => {
  it('each builds its scene from its origin, rests on the ground in one body and passes the validator of the library', () => {
    for (const id of TRADE_PARTS_IDS) {
      const xml = read(id);
      expect(modelErrors(`models/${id}.xml`, xml), id).toEqual([]);
      const { m, r } = run(xml);
      expect(r.finished, id).toBe(true);
      expect(analyse(r, m.program.palette, { grounded: true }).errors, id).toEqual([]);
    }
  }, 60_000);

  it('the contract is the first paragraph of the comment, and says the letters the part reads and writes', () => {
    for (const id of TRADE_PARTS_IDS) expect(read(id), id).toMatch(/^<!--\n[\s\S]+?\n\n[\s\S]+?Written by lab\/banco\/taglie\/parti\.mjs \(T471; ADR-0182, ADR-0239, ADR-0241\)\.\n-->/);
    const line = (id: string) => partResources(bundledFiles, id === 'part-window' ? 'mason' : 'joiner').find((l) => l.includes(`file="${id}"`))!;
    expect(line('part-wheel')).toMatch(/mark each hub with H[\s\S]*I the iron tyre and hub, J the felloe and eight spokes/);
    expect(line('part-window')).toMatch(/mark with U a band of your walls[\s\S]*the frame N[\s\S]*the glass G[\s\S]*<prl in="U" out="W"\/>/);
    expect(line('part-leaf')).toMatch(/shut with L[\s\S]*hinge with #80[\s\S]*It writes #81[\s\S]*<rule in="L" out="#82"\/><rule in="#81" out="#83"\/>/);
    for (const id of TRADE_PARTS_IDS) expect(line(id), id).not.toMatch(/Alone it builds|Written by/);
    // None uses the letter of the scenes, which an include never has, in what it writes.
    for (const id of TRADE_PARTS_IDS) expect(line(id), id).not.toMatch(/\bS\b/);
  });

  it('included, a part does nothing from its origin: the scene letter S never appears', () => {
    for (const name of ['armadio', 'carretto', 'casetta']) {
      const { g } = run(bench(name));
      expect(g.alphabet.includes('S') ? g.cells.filter((c) => g.alphabet[c] === 'S').length : 0, name).toBe(0);
    }
  });
});

describe('the wheel (part-wheel)', () => {
  it('alone: a wheel at each end of the axle, across it, as large as the hub is high, touching the ground', () => {
    const { g } = run(read('part-wheel'));
    const w = wheels(g);
    expect(w.map(sizeOf)).toEqual([[1, 13, 13], [1, 13, 13]]);
    for (const p of w) expect(p.min[2]).toBe(0);
    // The hub of iron in the middle of each, on the axle's height; eight spokes from it to the felloe.
    for (const x of [w[0].min[0], w[1].min[0]]) {
      expect(letterAt(g, x, 8, 6)).toBe('I');
      for (const [dy, dz] of [[0, 3], [0, -3], [3, 0], [-3, 0], [2, 2], [2, -2], [-2, 2], [-2, -2]]) expect(letterAt(g, x, 8 + dy, 6 + dz), `${x}: ${dy},${dz}`).toBe('J');
      expect(letterAt(g, x, 8, 0)).toBe('I');
      expect(letterAt(g, x, 8, 12)).toBe('I');
    }
  });

  it('in the joiner’s cart: four wheels two thick on two axles, the radius the hubs’ height, on the ground at every seed', () => {
    for (const seed of [1, 2, 3]) {
      const { g, m, r } = run(bench('carretto'), undefined, seed);
      const w = wheels(g);
      expect(w.map(sizeOf)).toEqual(Array(4).fill([2, 17, 17]));
      for (const p of w) expect(p.min[2]).toBe(0);
      expect(analyse(r, m.program.palette, { grounded: true }).errors).toEqual([]);
      // H is the hub the cart marked: it becomes the iron hub.
      expect(g.cells.filter((c) => g.alphabet[c] === 'H').length).toBe(0);
    }
  });

  it('on an axle along y the wheel stands across it, and a hub with nothing of air under it makes no wheel', () => {
    const helm = '<sequence values="BPXH" size="20 12 18" symmetry="()"><box at="10 4 0" size="2 3 9" color="P"/><box at="10 6 8" size="1 1 1" color="X"/><all in="X/B" out="*/H" steps="1"/><import file="part-wheel"/></sequence>';
    const { g } = run(helm);
    const w = wheels(g);
    expect(w.map(sizeOf)).toEqual([[17, 1, 17]]);
    expect(w[0].min[2]).toBe(0);
    // The hubs on the ground: no plumb line, no wheel; they become iron all the same.
    const flat = '<sequence values="BXH" size="12 12 8" symmetry="()"><box at="6 6 0" size="5 1 1" color="X"/><all in="XB" out="*H" symmetry="(x)" steps="1"/><import file="part-wheel"/></sequence>';
    const f = run(flat).g;
    expect(wheels(f)).toEqual([]);
    expect(pieces(f, ['I', 'J']).map((p) => p.cells)).toEqual([1, 1]);
    expect(f.cells.filter((c) => f.alphabet[c] === 'H').length).toBe(0);
  });
});

describe('the windows (part-window)', () => {
  it('alone: a window centred on every face of the house, more along the long ones, symmetric, framed, the sill out by one, the wall open behind', () => {
    const { g } = run(read('part-window'));
    const panes = pieces(g, ['G']).map((p) => ({ size: sizeOf(p), at: p.min }));
    // The long faces (45, odd): a window of 9 in the middle, one of 8 at each side; the short ones (34, even): one of 8.
    expect(panes.filter((p) => p.size[1] === 1).map((p) => [p.size[0], p.at[0]]).sort((a, b) => a[1] - b[1] || a[0] - b[0])).toEqual([[6, 7], [6, 7], [7, 21], [7, 21], [6, 36], [6, 36]]);
    expect(panes.filter((p) => p.size[0] === 1).map((p) => p.size[1])).toEqual([6, 6]);
    for (const p of panes) expect(p.size[2]).toBe(12);
    // Around the glass of the middle window of the front: the frame; under it the sill out in front; behind it the room.
    expect(letterAt(g, 20, 36, 14)).toBe('N');
    expect(letterAt(g, 28, 36, 14)).toBe('N');
    expect(letterAt(g, 24, 36, 8)).toBe('N');
    expect(letterAt(g, 24, 36, 21)).toBe('N');
    expect(letterAt(g, 24, 37, 8)).toBe('N');
    expect(letterAt(g, 24, 35, 14)).toBe('.');
    // Inside the rooms (an inner corner at every end) no window: the inner faces stay band.
    expect(letterAt(g, 24, 34, 14)).toBe('.');
    expect(letterAt(g, 3, 10, 14)).toBe('U');
    expect(letterAt(g, 3, 20, 14)).toBe('.');
  });

  it('in the mason’s cottage: none over the door, one centred on each stretch beside it and on every other face', () => {
    const { g } = run(bench('casetta'));
    const panes = pieces(g, ['G']).map((p) => `${sizeOf(p).join('×')}@${p.min.join(',')}`);
    expect(panes.sort()).toEqual(['1×7×10@44,23,13', '1×7×10@6,23,13', '6×1×10@10,39,13', '6×1×10@35,39,13', '7×1×10@22,13,13']);
    expect(g.cells.filter((c) => g.alphabet[c] === 'U').length).toBe(0);
  });

  it('in the Sculptor’s country house it takes the place of the windows of before and passes the checks of the structures', () => {
    const xml = villettaWithWindows();
    expect(xml).toContain('<import file="part-window"/>');
    expect(xml).not.toContain('LUUUUB');
    const { g } = run(xml, [100, 100, 80]);
    const panes = pieces(g, ['G']);
    // Every storey: on the free side a window centred on every stretch, on the faces that run to the edge of the box from their free end.
    expect(panes.length).toBe(31);
    expect(new Set(panes.map((p) => p.min[2]))).toEqual(new Set([7, 39]));
    const structure = classOf('structure')!;
    for (const size of ['large', 'huge'] as const) expect(checkProgram(xml, structure, size, filesOf(xml, bundledFiles)).error, size).toBeUndefined();
    // The house of before is the same: only the copy of the bench changed.
    expect(MOCK_STRUCTURE_PROGRAM).toContain('LUUUUB');
  }, 120_000);
});

describe('the leaves and lids (part-leaf)', () => {
  it('alone: two leaves sharing one run of the front, each open as far as it is wide, and a lid that rises on its back edge', () => {
    const { g } = run(read('part-leaf'));
    const open = pieces(g, ['#81']).map(sizeOf);
    expect(open.sort()).toEqual([[1, 7, 10], [1, 7, 10], [13, 1, 5]]);
    // The two leaves share the 13 cells of the front, the odd one in the middle to both: 7 and 7, the same at every layer (no saw edge).
    for (let z = 2; z <= 11; z++) {
      const column = (x: number) => Array.from({ length: g.Y }, (_, y) => letterAt(g, x, y, z)).filter((l) => l === '#81').length;
      expect([column(5), column(17)], `z=${z}`).toEqual([7, 7]);
    }
  });

  it('open and close swap the leaves of the joiner’s wardrobe and back, voxel for voxel', () => {
    const { m, g } = run(bench('armadio'));
    const shut = new Uint8Array(g.cells);
    const open = m.actions.find((a) => a.name === 'open')!;
    const close = m.actions.find((a) => a.name === 'close')!;
    const opened = act({ ...g, cells: new Uint8Array(g.cells), alphabet: [...g.alphabet], log: [], epoch: 0 }, open, 1).grid;
    expect(pieces(opened, ['#83']).map(sizeOf)).toEqual([[1, 5, 14], [1, 5, 14]]);
    // Every layer of each leaf open is 5 long: the 9 cells of the front, the middle one to both.
    expect(pieces(opened, ['#83']).map((p) => p.cells)).toEqual([70, 70]);
    expect(pieces(opened, ['L'])).toEqual([]);
    const closed = act(opened, close, 1).grid;
    expect(Array.from(closed.cells)).toEqual(Array.from(shut));
  });

  it('the mason’s door turns into the room on its hinge, as tall as the door', () => {
    const { g } = run(bench('casetta'));
    expect(pieces(g, ['#81']).map(sizeOf)).toEqual([[1, 11, 30]]);
  });
});

/** A Council that keeps what it sent (as tests/sculptor-trades.test.ts). */
function recording(files: FileMap = bundledFiles) {
  const calls: TextCall[] = [];
  class Recording extends MockAiModels {
    async text(call: TextCall): Promise<string> {
      calls.push(call);
      return super.text(call);
    }
  }
  return { calls, council: new Council(new Recording(), () => ({ files, palette: {}, catalog: [] })) };
}
const ONE = { semplici: 1, revisione: false, giudizio: false };
const ids = (s: SculptorSpecialty, files: FileMap = bundledFiles, fortified = true) => partResources(files, s, fortified).map((l) => /file="([^"]+)"/.exec(l)![1]);

describe('the parts by specialty (T471)', () => {
  it('each trade gets the parts its entry says: the architect those one lives in and the windows, the mason windows and leaves, the joiner leaves and wheel, the coachbuilder the wheel', () => {
    expect(ids('architect')).toEqual(['part-battlements', 'part-cellar', 'part-door', 'part-slits', 'part-stair', 'part-window']);
    expect(ids('architect', bundledFiles, false)).toEqual(['part-cellar', 'part-door', 'part-stair', 'part-window']);
    expect(ids('mason')).toEqual(['part-leaf', 'part-window']);
    expect(ids('joiner')).toEqual(['part-leaf', 'part-wheel']);
    expect(ids('coachbuilder')).toEqual(['part-wheel']);
    for (const s of ['landscaper', 'tailor', 'figurist', 'actions'] as const) expect(ids(s), s).toEqual([]);
  });

  it('an entry without a specialty, or with none the kernel knows, is the architect’s, as every part was before; never an action’s', () => {
    expect(partSpecialties(undefined)).toEqual(['architect']);
    expect(partSpecialties({ class: 'structure' })).toEqual(['architect']);
    expect(partSpecialties({ class: 'furniture', specialty: 'joiner' })).toEqual(['joiner']);
    expect(partSpecialties({ class: 'furniture', specialty: ['joiner', 'joiner', 'mason'] })).toEqual(['joiner', 'mason']);
    expect(partSpecialties({ class: 'furniture', specialty: ['wizard', 'actions', 7] as unknown as string[] })).toEqual(['architect']);
    // A universe whose index is the one of before (no specialty on the parts) keeps the parts with the architect, the new ones arrive with theirs.
    const index = JSON.parse(bundledFiles['models/index.json']!);
    for (const id of Object.keys(index)) if (/^part-/.test(id)) delete index[id].specialty;
    const before = { ...bundledFiles, 'models/index.json': JSON.stringify(index) };
    expect(ids('architect', before)).toEqual(['part-battlements', 'part-cellar', 'part-door', 'part-leaf', 'part-slits', 'part-stair', 'part-wheel', 'part-window']);
    expect(ids('joiner', before)).toEqual([]);
    expect(ids('joiner', { ...bundledFiles, 'models/index.json': '{ not json' })).toEqual([]);
  });

  it('at most MAX_PARTS, in the order of their names', () => {
    const many: FileMap = { 'models/index.json': JSON.stringify(Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`part-p${String(i).padStart(2, '0')}`, { class: 'furniture', specialty: 'joiner' }]))) };
    for (let i = 0; i < 12; i++) many[`models/part-p${String(i).padStart(2, '0')}.xml`] = `<!--\nPart ${i}.\n-->\n<sequence values="BW"><all in="W" out="B"/></sequence>`;
    expect(ids('joiner', many)).toEqual(Array.from({ length: MAX_PARTS }, (_, i) => `part-p0${i}`));
  });

  it('the request of every trade carries its parts and no other’s, the architect with its line of before', async () => {
    const r = (id: string, classe: string, nome: string, more: Partial<SculptRequest> = {}): SculptRequest => ({ id: `t471-${id}`, classe, nome, aspetto: nome, ...more });
    const cases: Array<[SculptRequest, string[]]> = [
      [r('armadio', 'furniture', 'Armadio'), ['part-leaf', 'part-wheel']],
      [r('lanterna', 'object', 'Lanterna'), ['part-leaf', 'part-wheel']],
      [r('cappello', 'object', 'Cappello', { worn: 'head' }), []],
      [r('pozzo', 'building', 'Pozzo'), ['part-leaf', 'part-window']],
      [r('barca', 'vessel', 'Barca', { taglia: 'large' }), ['part-wheel']],
      [r('quercia', 'tree', 'Quercia'), []],
      [r('mulino', 'structure', 'Mulino', { taglia: 'large' }), ['part-cellar', 'part-door', 'part-stair', 'part-window']],
    ];
    for (const [req, want] of cases) {
      const { calls, council } = recording();
      await sculpt(council, req, DEFAULT_SCULPTORS, ONE);
      const prompt = calls.find((x) => x.task === 'model.sculpt')!.prompt;
      const listed = [...prompt.matchAll(/^- <import file="(part-[a-z0-9-]+)"\/>/gm)].map((m) => m[1]);
      expect(listed, req.id).toEqual(want);
      const architect = req.classe === 'structure' && req.taglia === 'large';
      if (want.length && !architect) expect(prompt, req.id).toContain(TRADE_PARTS);
      if (architect) expect(prompt).toMatch(/Parts of the seed the program includes with <import file="…"\/> \(each says/);
      if (!want.length) expect(prompt, req.id).not.toMatch(/Parts of the seed/);
    }
    expect(SPECIALTIES.length).toBe(8);
  }, 60_000);
});
