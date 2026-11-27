// The complex of T557 as one program (the author's corrections 1, 4, 5: a set is one model, one MarkovJunior program; the massing is part of
// it; the stitching is written in MarkovJunior, in the model, and changes with the seed). Five stages in one `<sequence>`, run once by the
// game's engine on the grid of bays the kernel prepares:
//
// 1. **the massing** (masse.ts): which bays are streets, buildings, storeys, roofs;
// 2. **the wave over the set** (`<wfc set="…" stage="sig">`, our extension, D2 A of T543): a cell a bay, a pattern a signature of the set
//    (insieme.ts) and the state the stitching starts from (reached, to reach, neither) in the layer above it: the grid becomes two layers a
//    storey;
// 3. **the stitching**, MarkovJunior rules on those two layers: what is reached spreads through the passages the signatures say (and
//    through the doors and stairs already opened); where a bay to reach is not reached and a reached one stands beside it, one of the
//    walls between them (chosen at random: the seed) becomes a door, marked in the state; where no door can, a stair from the storey
//    below (a ramp and a hole in the slab above it); and so on until nothing more can be reached;
// 4. **the dressing** (a `map` to one layer a storey): a signature and its state become the letter of the bay to write (the bay as the
//    source has it, or its copy with that door, with the ramp, with the hole);
// 5. **the voxels** (`<wfc set="…" stage="voxels">`): every bay of its letter, chosen by weight among the bays that have it, written whole.
//
// The program is text (`xml`), as the Architect would write it; the two `<wfc set>` are the only extension: the kernel would build them from
// the set (the bricks, their faces read from the voxels). Here `compileComplex` puts a marker in their place, compiles the rest with the
// game's compiler and puts the two nodes back.

import { compileMjx } from '../../../src/mj/model';
import { runOn, type Grid3, type GridLimits, type Node3, type NodeCeilings, type PaletteEntry, type Program3, type WfcNode } from '../../../src/mj/engine';
import { numberedSymbol, symbolName } from '../../../src/mj/symbols';
import { C, H } from './sorgente';
import { DIR, OPP } from './estrattore';
import type { ExtractedSet, Signature } from './insieme';
import { massingXml, prepared, type Ground, type MassingSpec } from './masse';

/** The states of the stitching: reached, to reach, neither; a door carved on a side, reached or not; the ramp, the hole, reached or not. */
const CR = ['E', 'S', 'W', 'N'];
const CU = ['e', 's', 'w', 'n'];
/** A street with the stair outside, rising toward a side (+x, +y, -x, -y): reached, like the street it is. */
const OST = ['F', 'G', 'J', 'K'];
const STATES = ['r', 'u', 'x', ...CR, ...CU, 'U', 'd', 'D', ...OST];
const REACH: Record<string, string> = { u: 'r', e: 'E', s: 'S', w: 'W', n: 'N', d: 'D' };
const UNREACHED = Object.keys(REACH);
/** Where the numbered symbols of the set begin (signatures, then the dressed bays over them), and those of the unions. */
const FIRST = 100;
const UNION = 1900;
const MARK_SIG = 1990, MARK_VOX = 1992;
/** The massings' own letters. */
const MASSING_LETTERS = 'SUOYhzabcHBR';

export interface Dressed {
  name: string;
  sig: number;
  kind: 'nat' | 'door' | 'up' | 'down' | 'out';
  side?: number;
  motifs: number[];
}

export interface Complex {
  set: ExtractedSet;
  spec: MassingSpec;
  xml: string;
  program: Pick<Program3, 'palette' | 'unions' | 'program'>;
  stages: { massing: Node3; sig: WfcNode; stitch: Node3; dress: Node3; voxels: WfcNode };
  air: string;
  sigNames: string[];
  dressed: Dressed[];
  /** Distinct symbols of the program (the engine's cells are bytes: 255 at most besides the air). */
  symbols: number;
  /** The motifs the second wave may write, in its patterns' order. */
  motifs: number[];
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const name = (n: number) => `#${n}`;

/** The XML of a rule on a pair of bays: A and B side by side on side `d` of A (0-3), or one over the other (4: B above, 5: B below). */
function pairText(d: number, a: { sig?: string; state?: string }, b: { sig?: string; state?: string }): string {
  const s = (x?: string) => x ?? '*';
  if (d === 0) return `${s(a.state)}${s(b.state)} ${s(a.sig)}${s(b.sig)}`;
  if (d === 2) return `${s(b.state)}${s(a.state)} ${s(b.sig)}${s(a.sig)}`;
  if (d === 1) return `${s(a.state)}/${s(b.state)} ${s(a.sig)}/${s(b.sig)}`;
  if (d === 3) return `${s(b.state)}/${s(a.state)} ${s(b.sig)}/${s(a.sig)}`;
  // XML writes the layers from the top: B's state, B's signature, A's state, A's signature when B is above.
  if (d === 4) return `${s(b.state)} ${s(b.sig)} ${s(a.state)} ${s(a.sig)}`;
  return `${s(a.state)} ${s(a.sig)} ${s(b.state)} ${s(b.sig)}`;
}
const rule = (d: number, inA: { sig?: string; state?: string }, inB: { sig?: string; state?: string }, outA: { state?: string }, outB: { state?: string }) =>
  `<rule in="${pairText(d, inA, inB)}" out="${pairText(d, { state: outA.state }, { state: outB.state })}"/>`;

/**
 * The XML of a rule on a street bay A, the bay over it and the bay B beside that one on side d (a storey up): the stair outside. Layers from
 * the top: the states a storey up, the signatures a storey up, A's state, A's signature.
 */
function diagText(d: number, c: { aSig?: string; aState?: string; upSig?: string; upState?: string; bSig?: string; bState?: string }): string {
  const s = (x?: string) => x ?? '*';
  const pair = (a: string, b: string) => (d === 0 ? `${a}${b}` : d === 2 ? `${b}${a}` : d === 1 ? `${a}/${b}` : `${b}/${a}`);
  return [pair(s(c.upState), s(c.bState)), pair(s(c.upSig), s(c.bSig)), pair(s(c.aState), '*'), pair(s(c.aSig), '*')].join(' ');
}

/** The complex of a set with a massing: the program's text, compiled, and what the measures need. */
export function buildComplex(set: ExtractedSet, spec: MassingSpec): Complex {
  const sigs = set.sigs;
  const sigNames = sigs.map((_, i) => name(FIRST + i));
  // The dressed bays: a signature as it is, with each door, with the ramp, with the hole.
  const dressed: Dressed[] = [];
  for (const s of sigs) {
    dressed.push({ name: '', sig: s.index, kind: 'nat', motifs: s.motifs });
    s.doors.forEach((m, d) => m.length && dressed.push({ name: '', sig: s.index, kind: 'door', side: d, motifs: m }));
    if (s.up.length) dressed.push({ name: '', sig: s.index, kind: 'up', motifs: s.up });
    if (s.down.length) dressed.push({ name: '', sig: s.index, kind: 'down', motifs: s.down });
    s.out.forEach((m, d) => m.length && dressed.push({ name: '', sig: s.index, kind: 'out', side: d, motifs: m }));
  }
  dressed.forEach((d, i) => (d.name = name(FIRST + i)));
  // The voxels' letters, as the program writes them; the air is a letter no one else uses.
  const voxelNames = set.alphabet.slice(1).map((ch) => symbolName(ch));
  const used = new Set([...voxelNames, ...MASSING_LETTERS, ...STATES]);
  const air = [...'ZQXKJGFPLVTIMkjgfpvtiloq'].find((ch) => !used.has(ch))!;
  // Unions: the signatures that pass each way, that a door opens each side of, that hold the ramp, the hole; the reached states.
  let u = UNION;
  const unions: Array<{ sym: string; values: string; what: string }> = [];
  const union = (values: string[], what: string) => {
    const sym = name(u++);
    unions.push({ sym, values: values.join(''), what });
    return sym;
  };
  const P = [0, 1, 2, 3, 4, 5].map((d) => union(sigs.filter((s) => s.pass[d]).map((s) => sigNames[s.index]), `the signatures a body leaves through ${['+x', '+y', '-x', '-y', 'the top', 'the bottom'][d]}`));
  const O = [0, 1, 2, 3].map((d) => union(sigs.filter((s) => s.doors[d].length).map((s) => sigNames[s.index]), `a door can be opened on ${['+x', '+y', '-x', '-y'][d]}`));
  const UP = union(sigs.filter((s) => s.up.length).map((s) => sigNames[s.index]), 'a stair can start here');
  const DN = union(sigs.filter((s) => s.down.length).map((s) => sigNames[s.index]), 'a stair can arrive here');
  const OUT = [0, 1, 2, 3].map((d) => union(sigs.filter((s) => s.out[d].length).map((s) => sigNames[s.index]), `a stair outside can rise toward ${['+x', '+y', '-x', '-y'][d]}`));
  const AIRS = union(sigs.filter((s) => s.family === 'air').map((s) => sigNames[s.index]), 'the air');
  const RS = union(['r', ...CR, 'U', 'D', ...OST], 'reached');
  const DOOR = [0, 1, 2, 3].map((d) => union([CR[d], CU[d]], `a door on ${['+x', '+y', '-x', '-y'][d]}`));
  const HOLE = union(['d', 'D'], 'the hole of a stair');
  const empty = (sym: string) => !unions.find((x) => x.sym === sym)!.values;
  // The stitching. The flood: what is reached spreads to an unreached neighbour through a passage both sides have (or a door opened).
  const flood: string[] = [];
  for (let d = 0; d < 4; d++) {
    const o = OPP[d];
    for (const X of UNREACHED) {
      if (!empty(P[d]) && !empty(P[o])) flood.push(rule(d, { sig: P[d], state: RS }, { sig: P[o], state: X }, {}, { state: REACH[X] }));
      if (!empty(P[o])) flood.push(rule(d, { state: CR[d] }, { sig: P[o], state: X }, {}, { state: REACH[X] }));
    }
    if (!empty(P[d])) flood.push(rule(d, { sig: P[d], state: RS }, { state: CU[o] }, {}, { state: CR[o] }));
    flood.push(rule(d, { state: CR[d] }, { state: CU[o] }, {}, { state: CR[o] }));
  }
  for (const X of UNREACHED) {
    if (!empty(P[4]) && !empty(P[5])) {
      flood.push(rule(4, { sig: P[4], state: RS }, { sig: P[5], state: X }, {}, { state: REACH[X] }));
      flood.push(rule(5, { sig: P[5], state: RS }, { sig: P[4], state: X }, {}, { state: REACH[X] }));
    }
  }
  flood.push(rule(4, { state: 'U' }, { state: 'd' }, {}, { state: 'D' }));
  // Up the stair outside: from the street to the door of the room against which it rises.
  for (let d = 0; d < 4; d++) flood.push(`<rule in="${diagText(d, { aState: OST[d], bState: CU[OPP[d]] })}" out="${diagText(d, { bState: CR[OPP[d]] })}"/>`);
  // The doors: one at a time, at random among the walls between what is reached and a bay to reach that a door opens.
  const doors: string[] = [];
  for (let d = 0; d < 4; d++) {
    const o = OPP[d];
    if (!empty(O[o])) {
      if (!empty(P[d])) doors.push(rule(d, { sig: P[d], state: RS }, { sig: O[o], state: 'u' }, {}, { state: CU[o] }));
      doors.push(rule(d, { state: CR[d] }, { sig: O[o], state: 'u' }, {}, { state: CU[o] }));
    }
    if (!empty(O[d])) {
      if (!empty(P[o])) doors.push(rule(d, { sig: O[d], state: 'r' }, { sig: P[o], state: 'u' }, { state: CR[d] }, {}));
      if (!empty(O[o])) doors.push(rule(d, { sig: O[d], state: 'r' }, { sig: O[o], state: 'u' }, { state: CR[d] }, { state: CU[o] }));
    }
  }
  // The stairs: where no door can, a ramp from a reached room to the room above it, one at a time, at random.
  const stairs = !empty(UP) && !empty(DN) ? [rule(4, { sig: UP, state: 'r' }, { sig: DN, state: 'u' }, { state: 'U' }, { state: 'd' })] : [];
  // A stair outside: a reached street under the air, beside a room a storey up that a door opens toward it.
  for (let d = 0; d < 4; d++)
    if (!empty(OUT[d]) && !empty(O[OPP[d]]) && !empty(AIRS))
      stairs.push(`<rule in="${diagText(d, { aSig: OUT[d], aState: 'r', upSig: AIRS, bSig: O[OPP[d]], bState: 'u' })}" out="${diagText(d, { aState: OST[d], bState: CU[OPP[d]] })}"/>`);
  // The dressing: a signature and its state → the bay to write (the plain one first: what follows writes over it).
  const dress: string[] = [];
  for (const dd of dressed) {
    const sig = sigNames[dd.sig];
    const state = dd.kind === 'nat' ? '*' : dd.kind === 'door' ? DOOR[dd.side!] : dd.kind === 'up' ? 'U' : dd.kind === 'out' ? OST[dd.side!] : HOLE;
    dress.push(`<rule in="${state} ${sig}" out="${dd.name}"/>`);
  }
  // The program's text.
  const massing = massingXml(spec, air);
  const inner = massing.slice(massing.indexOf('>') + 1, massing.lastIndexOf('</sequence>')).trim();
  const values = [air, ...new Set([...MASSING_LETTERS, ...STATES]), ...voxelNames.filter((v) => !MASSING_LETTERS.includes(v) && !STATES.includes(v)), ...sigNames, ...dressed.slice(sigNames.length).map((d) => d.name), name(MARK_SIG), name(MARK_SIG + 1)];
  const colors: string[] = [];
  for (const ch of set.alphabet.slice(1)) {
    const e = set.palette[ch];
    colors.push(`<color symbol="${symbolName(ch)}" value="${e?.color ?? '808080'}"${e?.name ? ` name="${esc(e.name)}"` : ''}/>`);
  }
  for (const v of values.slice(1)) if (!voxelNames.includes(v)) colors.push(`<color symbol="${v}" hidden="True"/>`);
  const mapValues = [air, ...dressed.map((d) => d.name), name(MARK_VOX), name(MARK_VOX + 1)].join('');
  const xml = `<!-- T557: «${esc(set.name)}» as one program: the massing (${spec.name}), the wave over the set's ${sigs.length} signatures, the stitching,
     the dressing, the voxels of its ${set.motifs.length} bays (${set.bricks.length} bricks). Written by the lab (lab/strutture-modulari/estratti/). -->
<sequence values="${values.join('')}" symmetry="(xy)">
  ${colors.join('\n  ')}
  ${unions.filter((x) => x.values).map((x) => `<union symbol="${x.sym}" values="${x.values}"/><!-- ${x.what} -->`).join('\n  ')}
  <!-- 1. the massing -->
  <sequence>
  ${inner}
  </sequence>
  <!-- 2. the wave over the set: a bay a cell, its signature and, above it, the state the stitching starts from -->
  <wfc set="${esc(set.name)}" stage="sig" tries="100"/>
  <!-- 3. the stitching: reach, then a door, then a stair, again and again -->
  <markov symmetry="()">
    <all>
      ${flood.join('\n      ')}
    </all>
    <one>
      ${doors.join('\n      ')}
    </one>
    ${stairs.length ? `<one>\n      ${stairs.join('\n      ')}\n    </one>` : ''}
  </markov>
  <!-- 4. the dressing: a signature and its state, the letter of the bay to write -->
  <map scale="1 1 1/2" values="${mapValues}" symmetry="()">
    ${dress.join('\n    ')}
    <!-- 5. the voxels: every bay of its letter -->
    <wfc set="${esc(set.name)}" stage="voxels" tries="1"/>
  </map>
</sequence>`;
  // Compiled as the game would, the two waves in their place.
  const forCompiler = xml
    .replace(/<wfc set="[^"]*" stage="sig" tries="\d+"\/>/, `<prl in="${name(MARK_SIG)}" out="${name(MARK_SIG + 1)}" steps="1"/>`)
    .replace(/<wfc set="[^"]*" stage="voxels" tries="\d+"\/>/, `<prl in="${name(MARK_VOX)}" out="${name(MARK_VOX + 1)}" steps="1"/>`)
    .replace(`values="${values.join('')}"`, `values="${values.join('')}${name(MARK_VOX)}${name(MARK_VOX + 1)}"`)
    .replace(`<color symbol="${name(MARK_SIG)}" hidden="True"/>`, `<color symbol="${name(MARK_SIG)}" hidden="True"/><color symbol="${name(MARK_VOX)}" hidden="True"/><color symbol="${name(MARK_VOX + 1)}" hidden="True"/>`);
  const grid = prepared(spec, 'lotto');
  const m = compileMjx(forCompiler, { size: [grid.X, grid.Y, grid.Z] });
  const ch = (s: string) => numberedSymbol(Number(s.slice(1)));
  const sigWave: WfcNode = {
    type: 'wfc',
    model: 'tile',
    patterns: sigs.map((s) => `${ch(sigNames[s.index])}${s.start}`),
    dims: [1, 1, 2],
    weights: sigs.map((s) => Math.max(1, s.weight)),
    propagator: set.propagator,
    map: Object.fromEntries(
      [['.', 'A'], ['S', 'S'], ['H', 'H'], ['B', 'B'], ['R', 'R']].map(([letter, role]) => [
        letter,
        sigs.filter((s) => s.roles.has(role as never) || (role === 'S' && s.roles.has('Y' as never))).map((s) => s.index),
      ]),
    ),
    tries: 100,
  };
  // The second wave: the bays every dressed letter may be, free of each other (their faces are their signatures', met by the first wave).
  const motifs = [...new Set(dressed.flatMap((d) => d.motifs))];
  const at = new Map(motifs.map((m, i) => [m, i]));
  const vox = (v: Uint8Array) => {
    let s = '';
    for (const c of v) s += c ? set.alphabet[c] : '.';
    return s;
  };
  const voxelWave: WfcNode = {
    type: 'wfc',
    model: 'tile',
    patterns: motifs.map((mi) => vox(set.motifs[mi].voxels)),
    dims: [C, C, H],
    weights: motifs.map((mi) => Math.max(1, set.motifs[mi].weight)),
    propagator: [0, 1, 2, 3, 4, 5].map(() => motifs.map(() => [] as number[])),
    map: Object.fromEntries(dressed.map((d) => [ch(d.name), d.motifs.map((mi) => at.get(mi)!)])),
    tries: 1,
  };
  // Put the two waves where their markers are.
  const markSig = ch(name(MARK_SIG)), markVox = ch(name(MARK_VOX));
  const stages: Partial<Complex['stages']> = {};
  const swap = (n: Node3): Node3 => {
    if (n.type === 'prl' && n.rules.length === 1 && n.rules[0].in === markSig) return sigWave;
    if (n.type === 'prl' && n.rules.length === 1 && n.rules[0].in === markVox) return voxelWave;
    if (n.type === 'sequence' || n.type === 'markov') return { ...n, children: n.children.map(swap) };
    return n;
  };
  const root = swap(m.program.program);
  if (root.type !== 'sequence') throw new Error('la radice del complesso non è una sequenza');
  // The stages, for the measures (the root: massing, the first wave, the stitching, the dressing with the voxels inside).
  const [massingNode, sigNode, stitchNode, dressNode] = root.children;
  stages.massing = massingNode;
  stages.sig = sigNode as WfcNode;
  stages.stitch = stitchNode;
  stages.dress = dressNode;
  stages.voxels = voxelWave;
  if (stages.sig.type !== 'wfc') throw new Error('la prima onda non è al suo posto');
  const palette: Record<string, PaletteEntry> = { ...m.program.palette };
  for (const k of [markSig, ch(name(MARK_SIG + 1)), markVox, ch(name(MARK_VOX + 1))]) delete palette[k];
  const symbols = new Set([...Object.keys(palette)]).size;
  return { set, spec, xml, program: { palette, unions: m.program.unions, program: root }, stages: stages as Complex['stages'], air, sigNames, dressed, symbols, motifs };
}

export interface RunOut {
  grid: Grid3;
  ms: number;
  finished: boolean;
  why?: string;
}

/** Runs the complex (or its first `upTo` stages: 1 the massing, 2 the first wave, 3 the stitching, 5 all of it) on a ground at a seed. */
export function runComplex(cx: Complex, ground: Ground, seed: number, o: { upTo?: 1 | 2 | 3 | 5; limits?: GridLimits; ceilings?: NodeCeilings; deadline?: number; from?: Grid3 } = {}): RunOut {
  const root = cx.program.program as { type: 'sequence'; children: Node3[] };
  const upTo = o.upTo ?? 5;
  // The stages run: all, or the first `upTo`; from a given grid (a massing already run), without the massing.
  const children = (upTo === 5 ? root.children : root.children.slice(0, upTo)).slice(o.from ? 1 : 0);
  const prog: Node3 = { ...root, children };
  const grid: Grid3 = o.from ? { ...o.from, cells: new Uint8Array(o.from.cells), alphabet: [...o.from.alphabet], log: [], epoch: 0 } : prepared(cx.spec, ground);
  const t0 = performance.now();
  const r = runOn(grid, { palette: cx.program.palette, unions: cx.program.unions, program: prog }, seed, 5_000_000, o.limits ?? { side: 1024, cells: 64_000_000 }, { deadline: o.deadline ?? 60_000, ...(o.ceilings ? { ceilings: o.ceilings } : {}) });
  return { grid, ms: performance.now() - t0, finished: r.finished, ...(r.unused?.length ? { why: r.unused.join('; ') } : {}) };
}

/** The signature and the state of every bay of a grid after the first wave (two layers a storey); undefined where the wave found nothing. */
export function bayStates(cx: Complex, g: Grid3): { X: number; Y: number; Z: number; sig: Int32Array; state: string[] } | undefined {
  if (g.Z % 2) return undefined;
  const X = g.X, Y = g.Y, Z = g.Z / 2;
  const sigOf = new Map(cx.sigNames.map((n, i) => [numberedSymbol(Number(n.slice(1))), i]));
  const sig = new Int32Array(X * Y * Z).fill(-1);
  const state: string[] = new Array(X * Y * Z).fill('');
  for (let z = 0; z < Z; z++)
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++) {
        const a = g.alphabet[g.cells[x + y * X + 2 * z * X * Y]];
        const b = g.alphabet[g.cells[x + y * X + (2 * z + 1) * X * Y]];
        const s = sigOf.get(a);
        if (s === undefined) return undefined;
        sig[x + y * X + z * X * Y] = s;
        state[x + y * X + z * X * Y] = b;
      }
  return { X, Y, Z, sig, state };
}

/** Whether a body goes from a bay of signature `a` to its neighbour of signature `b` on side d, as the stitching reads it (doors aside). */
export const passes = (sigs: Signature[], a: number, d: number, b: number) => sigs[a].pass[d] && sigs[b].pass[d < 4 ? OPP[d] : d === 4 ? 5 : 4];
export { DIR };
