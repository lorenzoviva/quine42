// The sections of the trades (T470, S4 of T458 § 2.1): the new instructions of the landscaper, the joiner, the tailor, the figurist, the
// mason and the coachbuilder, each in its section, within the tokens of § 2.2. Every request of a class carries its trade's and no other's;
// what each section says the kernel does is what the kernel does (the wind, opening, putting down, holding, the rig, the zones, the hull):
// if the kernel changes, this fails and the prompt is told the new truth.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { Council } from '../src/kernel/agents/council';
import { checkProgram, DEFAULT_SCULPTORS, sculpt, sculptAction, sculptorRole, sculptorSection, specialtyOf, type SculptorSpecialty, type SculptRequest } from '../src/kernel/agents/sculptor';
import { BODY_R, stepOf, VPT, waterlineOf } from '../src/kernel/forms';
import { blockShape, findSpot, type Support } from '../src/kernel/placing';
import type { FileMap } from '../src/kernel/types';
import { classOf } from '../src/mj/classes';
import type { Grid3, PaletteEntry } from '../src/mj/engine';
import { gripOf, handsOf } from '../src/mj/hold';
import { meshVoxels, surfaces, type VoxelGrid } from '../src/mj/mesh';
import { compileMjx } from '../src/mj/model';
import { rig } from '../src/mj/rig';
import { act, runMjx } from '../src/mj/run';
import { measureVessel, VESSEL_LEAST } from '../src/mj/vessel';
import { bodyOf, DRESSING_ORDER, mainColors, REACH, reachOf, trialBodies } from '../src/mj/worn';

type Trade = Exclude<SculptorSpecialty, 'architect' | 'actions'>;
const TRADES: Trade[] = ['landscaper', 'joiner', 'tailor', 'figurist', 'mason', 'coachbuilder'];
const section = (t: Trade) => sculptorSection(bundledFiles, t);

/** What only the new text of each trade says (T470): its title and a line of it. */
const MARKS: Record<Trade, string[]> = {
  landscaper: ['## Growing like nature', 'the lowest quarter stays still', 'Write no animation for it', 'The crown stays on its wood'],
  joiner: ['## What the world does with them', 'labelled by the part', "the handle, not the hammer's head", 'without `close` the chest stays open'],
  tailor: ['## Every body', 'from the outside in', 'two main colours'],
  figurist: ['## How the kernel moves a figure', 'swing in diagonal pairs', 'without `part="arm"` nothing is seen'],
  mason: ['## Building in one box', 'a house a person enters', 'A monument stands on its base'],
  coachbuilder: ['## Building a hull', 'floods the hull', 'shut by a transom'],
};

/**
 * The tokens of § 2.2 of the study (`docs/design/scultori-specializzati.md`): the core and the section of each trade with its new instructions.
 * Measured with countTokens in `misure-s4.md`; here at 3.3 characters a token, what the core and the sections measured (3.28-3.32).
 */
// The landscaper 50 more since T545 (ADR-0269): the line of its new class, `cover`, in its section (`@@CLASSES@@`).
const BUDGET: Record<Trade, number> = { landscaper: 3700, joiner: 3700, tailor: 3900, figurist: 3800, mason: 3900, coachbuilder: 4000 };
const CHARS_PER_TOKEN = 3.3;

/** A Council that keeps what it sent. */
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
const r = (id: string, classe: string, nome: string, aspetto: string, more: Partial<SculptRequest> = {}): SculptRequest => ({ id: `t470-${id}`, classe, nome, aspetto, ...more });
/** A request of every class, and of what changes the trade (a thing worn, a structure below and from Large). */
const REQUESTS: SculptRequest[] = [
  r('ciottolo', 'pebble', 'Ciottolo', 'un sasso liscio'),
  r('masso', 'rock', 'Masso', 'una roccia tozza'),
  r('ginepro', 'bush', 'Ginepro', 'un cespuglio spinoso'),
  r('castagno', 'tree', 'Castagno', 'un albero dal tronco largo'),
  r('lanterna', 'object', 'Lanterna', 'una lanterna di ferro'),
  r('fiasco', 'object', 'Fiasco', 'una bottiglia panciuta', { tinta: true }),
  r('baule', 'furniture', 'Baule', 'un baule di legno'),
  r('cappuccio', 'object', 'Cappuccio', 'un cappuccio di lana', { worn: 'head' }),
  r('mugnaia', 'person', 'Mugnaia', 'una donna col grembiule'),
  r('gatto', 'animal', 'Gatto', 'un gatto tigrato'),
  r('cinghiale', 'beast', 'Cinghiale', 'un cinghiale con le zanne'),
  r('statua', 'monument', 'Statua', 'un uomo di pietra su un basamento'),
  r('pozzo', 'building', 'Pozzo', 'un pozzo di pietra'),
  r('capanno', 'structure', 'Capanno', 'una baracca di assi', { taglia: 'medium' }),
  r('barca', 'vessel', 'Barca da pesca', 'una barca a vela', { taglia: 'large' }),
  r('mulino', 'structure', 'Mulino', 'un mulino di pietra', { taglia: 'large' }),
];

/** A grid of letters painted by a function, the empty cell first. */
function grid(X: number, Y: number, Z: number, alphabet: string[], paint: (x: number, y: number, z: number) => string | undefined): Grid3 {
  const cells = new Uint8Array(X * Y * Z);
  for (let z = 0; z < Z; z++)
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++) {
        const ch = paint(x, y, z);
        if (ch) cells[x + y * X + z * X * Y] = alphabet.indexOf(ch);
      }
  return { X, Y, Z, cells, alphabet, log: [], epoch: 0 };
}
const inBox = (x: number, y: number, z: number, [x0, y0, z0]: number[], [x1, y1, z1]: number[]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
const asGrid3 = (g: VoxelGrid): Grid3 => ({ ...g, log: [], epoch: 0 });

describe('le sezioni dei mestieri (T470)', () => {
  it('ogni mestiere ha il suo testo nuovo, nella sua sezione e in nessun’altra, né nel nucleo', () => {
    const core = sculptorRole(bundledFiles, 'landscaper');
    const actions = sculptorRole(bundledFiles, 'actions');
    const architect = sculptorRole(bundledFiles, 'architect');
    for (const t of TRADES) {
      for (const m of MARKS[t]) expect(section(t), `${t}: ${m}`).toContain(m);
      for (const other of TRADES.filter((o) => o !== t)) for (const m of MARKS[other]) expect(section(t), `${t} ≠ ${other}: ${m}`).not.toContain(m);
      for (const m of MARKS[t]) for (const role of [core, actions, architect]) expect(role, m).not.toContain(m);
      // The notes for whoever edits the prompt stay home.
      expect(section(t), t).not.toMatch(/<!--|@@|T470/);
    }
  });

  it('il nucleo e la sezione di ogni mestiere stanno nei token del § 2.2', () => {
    const core = sculptorRole(bundledFiles, 'landscaper').length;
    for (const t of TRADES) expect(core + section(t).length, t).toBeLessThanOrEqual(BUDGET[t] * CHARS_PER_TOKEN);
  });

  it('la richiesta di ogni classe porta il testo del suo mestiere e non quello degli altri; l’Architetto nessuno', async () => {
    for (const req of REQUESTS) {
      const { calls, council } = recording();
      await sculpt(council, req, DEFAULT_SCULPTORS, ONE);
      const call = calls.find((x) => x.task === 'model.sculpt')!;
      const trade = specialtyOf(classOf(req.classe)!, req);
      expect(call.specialty, req.id).toBe(trade);
      for (const t of TRADES) for (const m of MARKS[t]) expect(call.system.includes(m), `${req.id} (${trade}): ${m}`).toBe(t === trade);
    }
  }, 60_000);

  it('un’azione porta il testo del mestiere del suo modello: il Mobiliere per un baule, il Capomastro per una struttura a regole', async () => {
    const cases: Array<{ classe: string; taglia?: 'large'; xml: string; trade: Trade }> = [
      { classe: 'furniture', xml: bundledFiles['models/barile.xml']!, trade: 'joiner' },
      { classe: 'building', xml: bundledFiles['models/building.xml']!, trade: 'mason' },
      { classe: 'structure', taglia: 'large', xml: bundledFiles['models/building.xml']!, trade: 'mason' },
    ];
    for (const c of cases) {
      const { calls, council } = recording();
      await sculptAction(council, { nome: 'Cosa', xml: c.xml, classe: c.classe, azione: 'open', etichetta: 'Apri', testo: 'apro', cambia: 'si apre', ...(c.taglia ? { taglia: c.taglia } : {}) }, DEFAULT_SCULPTORS.simple, 0);
      const call = calls.find((x) => x.task === 'model.action')!;
      for (const t of TRADES) for (const m of MARKS[t]) expect(call.system.includes(m), `${c.classe}: ${m}`).toBe(t === c.trade);
    }
  }, 30_000);
});

describe('ciò che le sezioni dicono del kernel è vero (T470)', () => {
  it('Paesaggista: una forma posa sul suo at; la chioma messa a metà galleggia e il kernel la scarta, quella cresciuta dal legno no (T497)', () => {
    // A chestnut in the tree's box: a trunk, a crown 26 tall; placed whole on its mark, or grown from the wood inside it.
    const tree = (crownAt: number, trunk: number, grown: boolean) => `<sequence values="BTLV" size="40 40 60" symmetry="(xy)" name="Castagno">
      <color symbol="T" value="6b4a2e"/><color symbol="L" value="2f6b3a"/><color symbol="V" hidden="True"/>
      <cylinder at="20 20 0" size="8 8 ${trunk}" color="T" on="B"/>
      <ellipsoid at="20 20 ${crownAt}" size="32 32 26" color="V" on="B"/>
      ${grown ? '<all steps="40" symmetry="(xyz)"><rule in="TV" out="TL"/><rule in="LV" out="LL"/></all><all in="V" out="B"/>' : '<all in="V" out="L"/>'}
    </sequence>`;
    const error = (crownAt: number, trunk: number, grown: boolean) => checkProgram(tree(crownAt, trunk, grown), classOf('tree')!).error;
    const floats = /il corpo principale galleggia|pezzi staccati/;
    // The mark's `at` is its bottom: below the trunk's top the crown holds, the trunk inside it.
    expect(error(30, 40, false)).toBeUndefined();
    expect(error(30, 40, true)).toBeUndefined();
    // At the crown's middle, as the chestnuts of T473 put it (z 40-48), it starts above the wood and floats; so over a short trunk.
    expect(error(44, 40, false)).toMatch(floats);
    expect(error(30, 20, false)).toMatch(floats);
    // Leaves that grow only beside wood or leaves never float: where the wood does not reach the mark there is no crown at all.
    expect(error(44, 40, true) ?? '').not.toMatch(floats);
    expect(error(30, 20, true)).toMatch(/troppo basso/);
  });

  it('Paesaggista: il vento piega per altezza, il quarto più basso fermo e la cima di più', () => {
    const top = 20;
    const g = grid(1, 1, top, ['.', 'T'], () => 'T');
    const m = meshVoxels(g, { T: { color: '#6b4a2e' } }, { vpt: VPT, sway: true });
    const heights = Array.from({ length: m.sway!.length }, (_, v) => m.positions[3 * v + 1] * VPT);
    heights.forEach((h, v) => {
      if (h <= top / 4) expect(m.sway![v], `z=${h}`).toBe(0);
      else expect(m.sway![v], `z=${h}`).toBeGreaterThan(0);
    });
    expect(Math.max(...m.sway!)).toBeCloseTo(1);
    // The crown sways more than the trunk below it.
    const at = (z: number) => m.sway![heights.findIndex((h) => h === z)];
    expect(at(top)).toBeGreaterThan(at(top / 2));
  });

  it('Mobiliere: il coperchio del prompt si apre e si chiude, e il menu offre solo l’azione che cambia il modello ora', () => {
    // Both actions as the section writes them (T497: `close` beside `open`, or the chest stays open).
    const action = (name: string) => new RegExp('`(<action name="' + name + '"[^`]*</action>)`').exec(section('joiner'))![1];
    const open = action('open');
    const close = action('close');
    // A chest: the body, the shut lid on it, the open lid marked where it goes (raised at the back), hidden.
    const xml = `<sequence values="BWLlUu" size="9 9 12">
      <color symbol="W" value="7a5634"/><color symbol="L" value="5a3a1e"/><color symbol="U" value="5a3a1e"/>
      <color symbol="l" hidden="True"/><color symbol="u" hidden="True"/>
      <box at="4 4 0" size="9 5 5" color="W"/>
      <box at="4 4 5" size="9 5 1" color="L"/>
      <box at="4 2 6" size="9 1 5" color="u"/>
    </sequence>
    ${open}
    ${close}`;
    const model = compileMjx(xml);
    const shut = runMjx(model, 1).grid;
    const count = (g: Grid3, ch: string) => g.cells.reduce((n, c) => n + (g.alphabet[c] === ch ? 1 : 0), 0);
    const after = (g: Grid3, name: string) => {
      const copy: Grid3 = { ...g, cells: new Uint8Array(g.cells), alphabet: [...g.alphabet], log: [], epoch: 0 };
      act(copy, model.actions.find((a) => a.name === name)!, 1);
      return copy;
    };
    // As `Kernel.modelActions` offers them: an action whose rules change nothing now is not in the menu (compared by letter: an action may add letters).
    const changes = (g: Grid3, name: string) => {
      const a = after(g, name);
      return a.cells.some((c, i) => a.alphabet[c] !== g.alphabet[g.cells[i]]);
    };
    const offered = (g: Grid3) => ['open', 'close'].filter((name) => changes(g, name));
    expect(offered(shut)).toEqual(['open']);
    const opened = after(shut, 'open');
    expect(count(opened, 'L') + count(opened, 'u')).toBe(0);
    expect(count(opened, 'U')).toBe(count(shut, 'u'));
    expect(offered(opened)).toEqual(['close']);
    const again = after(opened, 'close');
    expect(again.cells.every((c, i) => again.alphabet[c] === shut.alphabet[shut.cells[i]])).toBe(true);
  });

  it('Mobiliere: si posa su una faccia piana alla stessa altezza; un voxel in piedi la rompe lì', () => {
    // A table top of 16 × 16 at z=14 on four legs; the same with a voxel standing up every third column.
    const table = (bumps: boolean) =>
      grid(16, 16, 20, ['.', 'W'], (x, y, z) => {
        if (z === 14) return 'W';
        if (z < 14 && (x === 0 || x === 15) && (y === 0 || y === 15)) return 'W';
        if (bumps && z === 15 && x % 3 === 1 && y % 3 === 1) return 'W';
        return undefined;
      });
    const support = (g: Grid3): Support => ({ levels: surfaces(g, { W: { color: '#8a5a2b' } }, stepOf(VPT) + 1, Math.ceil(0.7 * VPT)), X: g.X, Y: g.Y, vpt: VPT, base: 0 });
    const cup = blockShape(4, 4, VPT);
    const query = { from: { x: 0, y: 0.6 }, reach: 2, top: 40, bottom: 0 };
    const flat = findSpot(support(table(false)), cup, query);
    expect('spot' in flat && flat.spot.h).toBe(15);
    expect(findSpot(support(table(true)), cup, query)).toEqual({ fail: 'no-shelf' });
  });

  it('Mobiliere: la presa dalla forma, il manico di legno, l’estremità con meno voxel, la cosa raccolta appesa per la cima', () => {
    // A hammer: a handle 2 × 2 × 14 and a head 8 × 2 × 4 over it.
    const hammer = (handle: string) => {
      const g = grid(8, 2, 18, ['.', 'H', 'M'], (x, _y, z) => (z >= 14 ? 'M' : x >= 3 && x <= 4 ? 'H' : undefined));
      return { g, pal: { H: { color: handle }, M: { color: '#8c8d95' } } as Record<string, PaletteEntry> };
    };
    for (const handle of ['#8a5a2b', '#8c8d95']) {
      const { g, pal } = hammer(handle);
      const grip = gripOf(g, pal, VPT)!;
      expect(grip.by, handle).toBe('end');
      // The hand at the handle's end, under the middle: by the wood, or (all of one metal) by the end with fewer voxels.
      expect(grip.at[1], handle).toBeLessThan(grip.centre[1]);
    }
    const lantern = grid(6, 6, 6, ['.', 'L'], () => 'L');
    expect(gripOf(lantern, { L: { color: '#3a3a3a' } }, VPT)!.by).toBe('top');
  });

  it('Sarto: l’aria delle zone, l’ordine dei capi, i due colori dove la sezione non va', () => {
    const tailor = section('tailor');
    expect(tailor).toContain(`over and round the head ${REACH.head} voxels, round the torso ${REACH.torso}`);
    expect(tailor).toContain('(the back, the torso, the head)');
    expect(DRESSING_ORDER).toEqual(['back', 'torso', 'head']);
    // Behind a back standing: 3 deep, 2 wider on each side, from the ground to over the shoulders.
    const g = grid(20, 20, 30, ['.', 'S'], (x, y, z) => (inBox(x, y, z, [6, 8, 12], [13, 11, 22]) ? 'S' : undefined));
    const back = [...g.cells.keys()].filter((i) => g.cells[i] && Math.floor(i / 20) % 20 === 8);
    const { reach } = reachOf(g, back, 'back', true, (c) => c > 0);
    const at = [...reach.keys()].filter((i) => reach[i]).map((i) => [i % 20, Math.floor(i / 20) % 20, Math.floor(i / 400)]);
    const span = (a: number) => [Math.min(...at.map((p) => p[a])), Math.max(...at.map((p) => p[a]))];
    expect(span(0)).toEqual([6 - 2, 13 + 2]);
    expect(span(1)[0]).toBe(8 - 3);
    expect(span(2)).toEqual([1, 22 + 2]);
    // The two colours: the letter with the most voxels, then the most used that reads apart from it (not a shade of it).
    const cloth = grid(10, 1, 10, ['.', 'R', 'r', 'G'], (x, _y, z) => (z < 6 ? 'R' : z < 9 ? 'r' : x < 3 ? 'G' : undefined));
    const colors = mainColors(cloth, { R: { color: '#a03030' }, r: { color: '#a43232' }, G: { color: '#e0b040' } });
    expect(colors.map((c) => c.color)).toEqual(['#a03030', '#e0b040']);
  });

  it('Figurinista: gli arti dai pezzi di una parte, i perni, il passo, le quattro zampe, la testa, le mani', () => {
    const [standing, prone] = trialBodies();
    const s = rig(asGrid3(standing.grid), standing.palette);
    const legs = s.limbs.filter((l) => l.part === 'leg');
    const arms = s.limbs.filter((l) => l.part === 'arm');
    expect([legs.length, arms.length]).toEqual([2, 2]);
    // Left against right; each arm against the leg of its side. A leg and an arm turn round their top.
    expect(legs[0].phase).toBe(-legs[1].phase);
    const side = (l: (typeof legs)[number]) => Math.sign(l.joint[0] - standing.grid.X / 2);
    for (const a of arms) expect(a.phase).toBe(-legs.find((l) => side(l) === side(a))!.phase);
    for (const l of [...legs, ...arms]) expect(l.joint[2]).toBe(Math.max(...l.cells.map((c) => Math.floor(c / (standing.grid.X * standing.grid.Y)))) + 0.5);
    // On all fours: four legs, in diagonal pairs.
    const p = rig(asGrid3(prone.grid), prone.palette);
    const four = p.limbs.filter((l) => l.part === 'leg');
    expect(four).toHaveLength(4);
    const corner = (l: (typeof four)[number]) => [Math.sign(l.joint[0] - prone.grid.X / 2), Math.sign(l.joint[1] - prone.grid.Y / 2)];
    for (const a of four) for (const b of four) if (a !== b) expect(a.phase === b.phase).toBe(corner(a)[0] !== corner(b)[0] && corner(a)[1] !== corner(b)[1]);
    // Touching at a corner is touching: two pieces of an arm meeting at a corner are one limb, a voxel apart they are two.
    const pal = { A: { color: '#8a6040', part: 'arm' as const }, S: { color: '#b07850' } };
    const arm = (gap: number) => grid(10, 4, 12, ['.', 'A', 'S'], (x, y, z) => (inBox(x, y, z, [6, 1, 0], [9, 2, 11]) ? 'S' : inBox(x, y, z, [0, 1, 6], [1, 2, 7]) || inBox(x, y, z, [2 + gap, 1, 8], [2 + gap, 2, 9]) ? 'A' : undefined));
    expect(rig(arm(0), pal).limbs.filter((l) => l.part === 'arm')).toHaveLength(1);
    expect(rig(arm(1), pal).limbs.filter((l) => l.part === 'arm')).toHaveLength(2);
    // Two legs that touch are cut down the middle; without any part the lowest quarter is the legs.
    const skirt = grid(10, 4, 20, ['.', 'L', 'S'], (x, _y, z) => (z < 8 && x >= 2 && x <= 7 ? 'L' : z >= 8 && x >= 1 && x <= 8 ? 'S' : undefined));
    expect(rig(skirt, { L: { color: '#4a3424', part: 'leg' }, S: { color: '#b07850' } }).limbs.filter((l) => l.part === 'leg')).toHaveLength(2);
    const bare = rig(grid(4, 4, 20, ['.', 'S'], () => 'S'), { S: { color: '#b07850' } });
    expect(bare.guessed).toBe(true);
    const zs = bare.limbs.flatMap((l) => l.cells.map((c) => Math.floor(c / 16)));
    expect(Math.max(...zs) + 1).toBeLessThanOrEqual(Math.ceil(20 * 0.3));
    // The head as a part tells the neck; the right hand is at small x; without arms nothing is held.
    expect(bodyOf(standing.grid, { ...standing.palette, H: { ...standing.palette.H, part: 'head' } }).neck.found).toBe('rig');
    const hands = handsOf(standing.grid, standing.palette, VPT);
    const right = hands.find((h) => h.side === 'right')!, left = hands.find((h) => h.side === 'left')!;
    expect(right.joint[0]).toBeLessThan(left.joint[0]);
    expect(handsOf(standing.grid, { ...standing.palette, A: { color: standing.palette.A.color } }, VPT)).toEqual([]);
  });

  it('Capomastro: la porta di mezza casella fa passare il corpo, la persona è 1,5 caselle, 30 voxel a 20', () => {
    const mason = section('mason');
    expect(mason).toContain('at least half a tile wide');
    expect(2 * BODY_R).toBeLessThan(0.5);
    expect(mason).toContain('who is 1.5 tiles (30 voxels at 20 a tile)');
    expect(classOf('person')!.tiles[2]).toBe(1.5);
    expect(1.5 * VPT).toBe(30);
  });

  it('Carrozziere: un buco nello strato sotto la linea di galleggiamento allaga lo scafo, e il ponte non sta più sopra', () => {
    const xml = bundledFiles['models/vessel.xml']!;
    const model = compileMjx(xml);
    const g = runMjx(model, 1).grid;
    const pal = model.program.palette;
    const waterline = waterlineOf(xml);
    const vpt = 16;
    const whole = measureVessel(g, pal, vpt, waterline);
    expect(whole.deckOverHull).toBeGreaterThanOrEqual(VESSEL_LEAST.deckOverHull);
    // A gunport through the side, in the layer just under the waterline, amidships: the planks from outside to the inside.
    const holed = { ...g, cells: new Uint8Array(g.cells) };
    const z = waterline - 1, y = Math.floor(g.Y / 2);
    const at = (x: number) => x + y * g.X + z * g.X * g.Y;
    let x = 0;
    while (x < g.X && !holed.cells[at(x)]) x++;
    while (x < g.X && holed.cells[at(x)]) holed.cells[at(x++)] = 0;
    expect(x).toBeLessThan(g.X / 2);
    const flooded = measureVessel(holed, pal, vpt, waterline);
    expect(flooded.hull).toBeLessThan(whole.hull / 2);
    expect(flooded.deckOverHull).toBeLessThan(VESSEL_LEAST.deckOverHull);
  });
});
