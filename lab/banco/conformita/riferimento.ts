// MarkovJunior of mxgmn, line by line in TypeScript (T500, docs/design/markov-allineamento.md): the reference our engine is measured against.
// A translation of source/ of github.com/mxgmn/MarkovJunior at 42aaf24 (MIT, (c) 2022 Maxim Gumin), the same classes, fields and loops, the
// same order of every random number (System.Random in dotnet-random.ts): the same program and the same seed give the grid the original
// gives, voxel by voxel (lab/scripts/conformita-mj.ts checks it against the C# on the models of its repository). Not the game's engine and
// never imported by src/: it reads the original's XML as the original does, with its defaults, its quirks and its errors.
//
// What is translated: Interpreter, Node, Branch, SequenceNode, MarkovNode, MapNode, RuleNode, OneNode, AllNode, ParallelNode, Rule,
// SymmetryHelper, Grid, Field, Observation (not Search), PathNode, ConvolutionNode, ConvChainNode, WFCNode, OverlapNode, TileNode.
// What is read in another way: the images and .vox files of resources/ are the text of lab/mjx/official/resources/ (lab/scripts/mjx-risorse.ts,
// T335), given in `files`, with the colours already laid on the program's letters in the order the original lays them.
// What is left out: `search` (a node with it throws), the GUI, the pictures; UpdateState of the waves uses no unseeded noise (when every cell
// holds one pattern the votes agree, and only then the original's grid is read).

import { parseXml, type XmlElement } from '../../../src/mj/xml';
import { DotnetRandom } from './dotnet-random';

export class RefError extends Error {}

/**
 * Switches for an experiment only, off as the original: what a model would do if a quirk of the original were mended. `logConvolution`:
 * the convolution's writes go into `changes`, as every rule node's (the original leaves them out, and a rule node that matched before does
 * not see them).
 */
export const VARIANTS = { logConvolution: false };

// ---------------------------------------------------------------- XMLHelper

const attr = (x: XmlElement, a: string): string | undefined => x.attrs[a];
function getString(x: XmlElement, a: string): string;
function getString(x: XmlElement, a: string, dflt: string | null): string | null;
function getString(x: XmlElement, a: string, dflt?: string | null): string | null {
  const v = attr(x, a);
  if (v === undefined) {
    if (dflt === undefined) throw new RefError(`xelement ${x.name} didn't have attribute ${a}`);
    return dflt;
  }
  return v;
}
/** Int32Converter: an integer, spaces around it allowed. */
function getInt(x: XmlElement, a: string, dflt?: number): number {
  const v = attr(x, a);
  if (v === undefined) {
    if (dflt === undefined) throw new RefError(`xelement ${x.name} didn't have attribute ${a}`);
    return dflt;
  }
  const t = v.trim();
  if (!/^[+-]?\d+$/.test(t)) throw new RefError(`${a}="${v}" is not an integer`);
  return Number(t);
}
/** DoubleConverter, invariant culture. */
function getDouble(x: XmlElement, a: string, dflt: number): number {
  const v = attr(x, a);
  if (v === undefined) return dflt;
  const n = Number(v.trim());
  if (v.trim() === '' || !Number.isFinite(n)) throw new RefError(`${a}="${v}" is not a number`);
  return n;
}
/** BooleanConverter: True or False, any case. */
function getBool(x: XmlElement, a: string, dflt: boolean): boolean {
  const v = attr(x, a);
  if (v === undefined) return dflt;
  const t = v.trim().toLowerCase();
  if (t !== 'true' && t !== 'false') throw new RefError(`${a}="${v}" is not a boolean`);
  return t === 'true';
}
/** CharConverter: one character (trimmed if longer). */
function getChar(x: XmlElement, a: string, dflt?: string): string {
  let v = attr(x, a);
  if (v === undefined) {
    if (dflt === undefined) throw new RefError(`xelement ${x.name} didn't have attribute ${a}`);
    return dflt;
  }
  if (v.length > 1) v = v.trim();
  if (v.length === 1) return v;
  if (v.length === 0) return '\0';
  throw new RefError(`${a}="${v}" is not a character`);
}
const elements = (x: XmlElement, ...names: string[]): XmlElement[] => x.children.filter((c) => names.includes(c.name));
/** MyDescendants: breadth first, through the given tags only, the element itself left out. */
function myDescendants(x: XmlElement, ...tags: string[]): XmlElement[] {
  const out: XmlElement[] = [];
  const q: XmlElement[] = [x];
  while (q.length) {
    const e = q.shift()!;
    if (e !== x) out.push(e);
    for (const c of elements(e, ...tags)) q.push(c);
  }
  return out;
}

// ---------------------------------------------------------------- Helper, ArrayHelper

function shuffle(array: Int32Array, random: DotnetRandom): void {
  for (let i = 0; i < array.length; i++) {
    const j = random.nextMax(i + 1);
    array[i] = array[j];
    array[j] = i;
  }
}
/** RandomHelper.Random(double[] weights, double r). */
function randomIndex(weights: Float64Array, r: number): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i++) sum += weights[i];
  const threshold = r * sum;
  let partialSum = 0;
  for (let i = 0; i < weights.length; i++) {
    partialSum += weights[i];
    if (partialSum >= threshold) return i;
  }
  return 0;
}
/** Helper.Ords: each value its ordinal by first appearance (with `uniques` shared between calls). */
function ords(data: ArrayLike<number>, uniques: number[] = []): [Uint8Array, number] {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    let ord = uniques.indexOf(data[i]);
    if (ord === -1) {
      ord = uniques.length;
      uniques.push(data[i]);
    }
    result[i] = ord;
  }
  return [result, uniques.length];
}

// ---------------------------------------------------------------- SymmetryHelper

const SQUARE_SUBGROUPS: Record<string, boolean[]> = {
  '()': [true, false, false, false, false, false, false, false],
  '(x)': [true, true, false, false, false, false, false, false],
  '(y)': [true, false, false, false, false, true, false, false],
  '(x)(y)': [true, true, false, false, true, true, false, false],
  '(xy+)': [true, false, true, false, true, false, true, false],
  '(xy)': [true, true, true, true, true, true, true, true],
};
const range48 = (f: (l: number) => boolean) => Array.from({ length: 48 }, (_, l) => f(l));
const CUBE_SUBGROUPS: Record<string, boolean[]> = {
  '()': range48((l) => l === 0),
  '(x)': range48((l) => l === 0 || l === 1),
  '(z)': range48((l) => l === 0 || l === 17),
  '(xy)': range48((l) => l < 8),
  '(xyz+)': range48((l) => l % 2 === 0),
  '(xyz)': range48(() => true),
};

export function squareSymmetries<T>(thing: T, rotation: (t: T) => T, reflection: (t: T) => T, same: (a: T, b: T) => boolean, subgroup?: boolean[]): T[] {
  const things: T[] = new Array(8);
  things[0] = thing;
  things[1] = reflection(things[0]);
  things[2] = rotation(things[0]);
  things[3] = reflection(things[2]);
  things[4] = rotation(things[2]);
  things[5] = reflection(things[4]);
  things[6] = rotation(things[4]);
  things[7] = reflection(things[6]);
  const result: T[] = [];
  for (let i = 0; i < 8; i++) if ((!subgroup || subgroup[i]) && !result.some((s) => same(s, things[i]))) result.push(things[i]);
  return result;
}

export function cubeSymmetries<T>(thing: T, a: (t: T) => T, b: (t: T) => T, r: (t: T) => T, same: (x: T, y: T) => boolean, subgroup?: boolean[]): T[] {
  const s: T[] = new Array(48);
  s[0] = thing;
  s[1] = r(s[0]);
  s[2] = a(s[0]);
  s[3] = r(s[2]);
  s[4] = a(s[2]);
  s[5] = r(s[4]);
  s[6] = a(s[4]);
  s[7] = r(s[6]);
  s[8] = b(s[0]);
  s[9] = r(s[8]);
  s[10] = b(s[2]);
  s[11] = r(s[10]);
  s[12] = b(s[4]);
  s[13] = r(s[12]);
  s[14] = b(s[6]);
  s[15] = r(s[14]);
  s[16] = b(s[8]);
  s[17] = r(s[16]);
  s[18] = b(s[10]);
  s[19] = r(s[18]);
  s[20] = b(s[12]);
  s[21] = r(s[20]);
  s[22] = b(s[14]);
  s[23] = r(s[22]);
  s[24] = b(s[16]);
  s[25] = r(s[24]);
  s[26] = b(s[18]);
  s[27] = r(s[26]);
  s[28] = b(s[20]);
  s[29] = r(s[28]);
  s[30] = b(s[22]);
  s[31] = r(s[30]);
  s[32] = a(s[8]);
  s[33] = r(s[32]);
  s[34] = a(s[10]);
  s[35] = r(s[34]);
  s[36] = a(s[12]);
  s[37] = r(s[36]);
  s[38] = a(s[14]);
  s[39] = r(s[38]);
  s[40] = a(s[24]);
  s[41] = r(s[40]);
  s[42] = a(s[26]);
  s[43] = r(s[42]);
  s[44] = a(s[28]);
  s[45] = r(s[44]);
  s[46] = a(s[30]);
  s[47] = r(s[46]);
  const result: T[] = [];
  for (let i = 0; i < 48; i++) if ((!subgroup || subgroup[i]) && !result.some((t) => same(t, s[i]))) result.push(s[i]);
  return result;
}

function getSymmetry(d2: boolean, s: string | null, dflt: boolean[]): boolean[] | null {
  if (s === null) return dflt;
  return (d2 ? SQUARE_SUBGROUPS[s] : CUBE_SUBGROUPS[s]) ?? null;
}

// ---------------------------------------------------------------- Grid

export class Grid {
  state!: Uint8Array;
  mask!: Uint8Array;
  MX = 0;
  MY = 0;
  MZ = 0;
  C = 0;
  characters: string[] = [];
  values = new Map<string, number>();
  waves = new Map<string, number>();
  folder: string | null = null;

  static load(xelem: XmlElement, MX: number, MY: number, MZ: number): Grid | null {
    const g = new Grid();
    g.MX = MX;
    g.MY = MY;
    g.MZ = MZ;
    const valueString = getString(xelem, 'values', null)?.replace(/ /g, '') ?? null;
    if (valueString === null) return null;
    g.C = valueString.length;
    for (let i = 0; i < g.C; i++) {
      const symbol = valueString[i];
      if (g.values.has(symbol)) return null;
      g.characters[i] = symbol;
      g.values.set(symbol, i);
      g.waves.set(symbol, 1 << i);
    }
    g.waves.set('*', (1 << g.C) - 1);
    for (const xunion of myDescendants(xelem, 'markov', 'sequence', 'union').filter((x) => x.name === 'union')) {
      const symbol = getChar(xunion, 'symbol');
      if (g.waves.has(symbol)) return null;
      g.waves.set(symbol, g.wave(getString(xunion, 'values')));
    }
    g.state = new Uint8Array(MX * MY * MZ);
    g.mask = new Uint8Array(MX * MY * MZ);
    g.folder = getString(xelem, 'folder', null);
    return g;
  }

  clear(): void {
    this.state.fill(0);
  }

  wave(values: string): number {
    let sum = 0;
    for (const ch of values) {
      const v = this.values.get(ch);
      if (v === undefined) throw new RefError(`the key ${ch} was not present`);
      sum += 1 << v;
    }
    return sum;
  }

  matches(rule: Rule, x: number, y: number, z: number): boolean {
    const { MX, MY, state } = this;
    let dz = 0, dy = 0, dx = 0;
    const input = rule.input;
    for (let di = 0; di < input.length; di++) {
      if ((input[di] & (1 << state[x + dx + (y + dy) * MX + (z + dz) * MX * MY])) === 0) return false;
      dx++;
      if (dx === rule.IMX) {
        dx = 0;
        dy++;
        if (dy === rule.IMY) {
          dy = 0;
          dz++;
        }
      }
    }
    return true;
  }
}

// ---------------------------------------------------------------- Rule

/** The text of a pattern (layers apart by spaces, the top one first, rows by "/") as cells x + y·MX + z·MX·MY, z from the bottom. */
function parsePattern(s: string): [string[], number, number, number] {
  const lines = s.split(' ').map((l) => l.split('/'));
  const MX = lines[0][0].length;
  const MY = lines[0].length;
  const MZ = lines.length;
  const result: string[] = new Array(MX * MY * MZ);
  for (let z = 0; z < MZ; z++) {
    const linesz = lines[MZ - 1 - z];
    if (linesz.length !== MY) throw new RefError('non-rectangular pattern');
    for (let y = 0; y < MY; y++) {
      const lineszy = linesz[y];
      if (lineszy.length !== MX) throw new RefError('non-rectangular pattern');
      for (let x = 0; x < MX; x++) result[x + y * MX + z * MX * MY] = lineszy[x];
    }
  }
  return [result, MX, MY, MZ];
}

/** A file of resources/ as text (lab/mjx/official/resources/): note lines out, every layer on its lines, joined as a pattern. */
function resourceText(text: string): string {
  return text
    .split(/\r?\n/)
    .filter((l) => !/^\s*#(?!\d)/.test(l) && !/^\s*<!--/.test(l))
    .join('\n')
    .replace(/\s*\/\s*/g, '/')
    .trim()
    .replace(/\s+/g, ' ');
}

export class Rule {
  input: Int32Array;
  output: Uint8Array;
  binput: Uint8Array;
  ishifts: Int32Array[];
  oshifts: Int32Array[] | null = null;
  original = false;

  constructor(
    input: Int32Array,
    public IMX: number,
    public IMY: number,
    public IMZ: number,
    output: Uint8Array,
    public OMX: number,
    public OMY: number,
    public OMZ: number,
    C: number,
    public p: number,
  ) {
    this.input = input;
    this.output = output;
    const lists: number[][] = Array.from({ length: C }, () => []);
    for (let z = 0; z < IMZ; z++)
      for (let y = 0; y < IMY; y++)
        for (let x = 0; x < IMX; x++) {
          let w = input[x + y * IMX + z * IMX * IMY];
          for (let c = 0; c < C; c++, w >>= 1) if ((w & 1) === 1) lists[c].push(x, y, z);
        }
    this.ishifts = lists.map((l) => Int32Array.from(l));
    if (OMX === IMX && OMY === IMY && OMZ === IMZ) {
      for (const l of lists) l.length = 0;
      for (let z = 0; z < OMZ; z++)
        for (let y = 0; y < OMY; y++)
          for (let x = 0; x < OMX; x++) {
            const o = output[x + y * OMX + z * OMX * OMY];
            if (o !== 0xff) lists[o].push(x, y, z);
            else for (let c = 0; c < C; c++) lists[c].push(x, y, z);
          }
      this.oshifts = lists.map((l) => Int32Array.from(l));
    }
    const wildcard = (1 << C) - 1;
    this.binput = new Uint8Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const w = input[i];
      this.binput[i] = w === wildcard ? 0xff : 31 - Math.clz32(w & -w);
    }
  }

  zRotated(): Rule {
    const { IMX, IMY, IMZ, OMX, OMY, OMZ, input, output } = this;
    const newinput = new Int32Array(input.length);
    for (let z = 0; z < IMZ; z++) for (let y = 0; y < IMX; y++) for (let x = 0; x < IMY; x++) newinput[x + y * IMY + z * IMX * IMY] = input[IMX - 1 - y + x * IMX + z * IMX * IMY];
    const newoutput = new Uint8Array(output.length);
    for (let z = 0; z < OMZ; z++) for (let y = 0; y < OMX; y++) for (let x = 0; x < OMY; x++) newoutput[x + y * OMY + z * OMX * OMY] = output[OMX - 1 - y + x * OMX + z * OMX * OMY];
    return new Rule(newinput, IMY, IMX, IMZ, newoutput, OMY, OMX, OMZ, this.ishifts.length, this.p);
  }

  yRotated(): Rule {
    const { IMX, IMY, IMZ, OMX, OMY, OMZ, input, output } = this;
    const newinput = new Int32Array(input.length);
    for (let z = 0; z < IMX; z++) for (let y = 0; y < IMY; y++) for (let x = 0; x < IMZ; x++) newinput[x + y * IMZ + z * IMZ * IMY] = input[IMX - 1 - z + y * IMX + x * IMX * IMY];
    const newoutput = new Uint8Array(output.length);
    for (let z = 0; z < OMX; z++) for (let y = 0; y < OMY; y++) for (let x = 0; x < OMZ; x++) newoutput[x + y * OMZ + z * OMZ * OMY] = output[OMX - 1 - z + y * OMX + x * OMX * OMY];
    return new Rule(newinput, IMZ, IMY, IMX, newoutput, OMZ, OMY, OMX, this.ishifts.length, this.p);
  }

  reflected(): Rule {
    const { IMX, IMY, IMZ, OMX, OMY, OMZ, input, output } = this;
    const newinput = new Int32Array(input.length);
    for (let z = 0; z < IMZ; z++) for (let y = 0; y < IMY; y++) for (let x = 0; x < IMX; x++) newinput[x + y * IMX + z * IMX * IMY] = input[IMX - 1 - x + y * IMX + z * IMX * IMY];
    const newoutput = new Uint8Array(output.length);
    for (let z = 0; z < OMZ; z++) for (let y = 0; y < OMY; y++) for (let x = 0; x < OMX; x++) newoutput[x + y * OMX + z * OMX * OMY] = output[OMX - 1 - x + y * OMX + z * OMX * OMY];
    return new Rule(newinput, IMX, IMY, IMZ, newoutput, OMX, OMY, OMZ, this.ishifts.length, this.p);
  }

  static same(a1: Rule, a2: Rule): boolean {
    if (a1.IMX !== a2.IMX || a1.IMY !== a2.IMY || a1.IMZ !== a2.IMZ || a1.OMX !== a2.OMX || a1.OMY !== a2.OMY || a1.OMZ !== a2.OMZ) return false;
    for (let i = 0; i < a1.IMX * a1.IMY * a1.IMZ; i++) if (a1.input[i] !== a2.input[i]) return false;
    for (let i = 0; i < a1.OMX * a1.OMY * a1.OMZ; i++) if (a1.output[i] !== a2.output[i]) return false;
    return true;
  }

  symmetries(symmetry: boolean[], d2: boolean): Rule[] {
    if (d2) return squareSymmetries<Rule>(this, (r) => r.zRotated(), (r) => r.reflected(), Rule.same, symmetry);
    return cubeSymmetries<Rule>(this, (r) => r.zRotated(), (r) => r.yRotated(), (r) => r.reflected(), Rule.same, symmetry);
  }

  static load(xelem: XmlElement, gin: Grid, gout: Grid, files: Files): Rule | null {
    const filepath = (name: string) => `${gout.folder !== null ? `${gout.folder}-` : ''}${name}.txt`;
    const loadResource = (file: string): [string[], number, number, number] => {
      const text = files[file];
      if (text === undefined) throw new RefError(`couldn't read ${file}`);
      return parsePattern(resourceText(text));
    };
    const inString = getString(xelem, 'in', null);
    const outString = getString(xelem, 'out', null);
    const finString = getString(xelem, 'fin', null);
    const foutString = getString(xelem, 'fout', null);
    const fileString = getString(xelem, 'file', null);
    let inRect: string[], outRect: string[];
    let IMX: number, IMY: number, IMZ: number, OMX: number, OMY: number, OMZ: number;
    if (fileString === null) {
      if (inString === null && finString === null) return null;
      if (outString === null && foutString === null) return null;
      [inRect, IMX, IMY, IMZ] = inString !== null ? parsePattern(inString) : loadResource(filepath(finString!));
      [outRect, OMX, OMY, OMZ] = outString !== null ? parsePattern(outString) : loadResource(filepath(foutString!));
      if (gin === gout && (OMZ !== IMZ || OMY !== IMY || OMX !== IMX)) return null;
    } else {
      if (inString !== null || finString !== null || outString !== null || foutString !== null) return null;
      // The original's image holds in and out side by side; the text holds them apart by a line "->" (lab/scripts/mjx-risorse.ts).
      const text = files[filepath(fileString)];
      if (text === undefined) throw new RefError(`couldn't read ${filepath(fileString)}`);
      const parts = text.split(/^[ \t]*->[ \t]*\r?$/m);
      if (parts.length !== 2) throw new RefError(`${filepath(fileString)}: no "->"`);
      [inRect, IMX, IMY, IMZ] = parsePattern(resourceText(parts[0]));
      [outRect, OMX, OMY, OMZ] = parsePattern(resourceText(parts[1]));
    }
    const input = new Int32Array(inRect.length);
    for (let i = 0; i < inRect.length; i++) {
      const value = gin.waves.get(inRect[i]);
      if (value === undefined) throw new RefError(`input code ${inRect[i]} at line ${xelem.line} is not found in codes`);
      input[i] = value;
    }
    const output = new Uint8Array(outRect.length);
    for (let o = 0; o < outRect.length; o++) {
      const c = outRect[o];
      if (c === '*') output[o] = 0xff;
      else {
        const value = gout.values.get(c);
        if (value === undefined) throw new RefError(`output code ${c} at line ${xelem.line} is not found in codes`);
        output[o] = value;
      }
    }
    const p = getDouble(xelem, 'p', 1.0);
    return new Rule(input, IMX, IMY, IMZ, output, OMX, OMY, OMZ, gin.C, p);
  }
}

// ---------------------------------------------------------------- Node, Branch

/** The files of resources/ a model reads, as text, by the names lab/mjx/official/resources/ gives them. */
export type Files = Readonly<Record<string, string>>;

const NODE_NAMES = ['one', 'all', 'prl', 'markov', 'sequence', 'path', 'map', 'convolution', 'convchain', 'wfc'];

abstract class Node {
  ip!: Interpreter;
  grid!: Grid;
  abstract load(xelem: XmlElement, symmetry: boolean[], grid: Grid): boolean;
  abstract reset(): void;
  abstract go(): boolean;

  static factory(xelem: XmlElement, symmetry: boolean[], ip: Interpreter, grid: Grid): Node | null {
    if (!NODE_NAMES.includes(xelem.name)) throw new RefError(`unknown node type "${xelem.name}" at line ${xelem.line}`);
    let result: Node;
    switch (xelem.name) {
      case 'one':
        result = new OneNode();
        break;
      case 'all':
        result = new AllNode();
        break;
      case 'prl':
        result = new ParallelNode();
        break;
      case 'markov':
        result = new MarkovNode();
        break;
      case 'sequence':
        result = new SequenceNode();
        break;
      case 'path':
        result = new PathNode();
        break;
      case 'map':
        result = new MapNode();
        break;
      case 'convolution':
        result = new ConvolutionNode();
        break;
      case 'convchain':
        result = new ConvChainNode();
        break;
      default:
        if (getString(xelem, 'sample', null) !== null) result = new OverlapNode();
        else if (getString(xelem, 'tileset', null) !== null) result = new TileNode();
        else throw new RefError('wfc without sample or tileset');
    }
    result.ip = ip;
    result.grid = grid;
    return result.load(xelem, symmetry, grid) ? result : null;
  }
}

abstract class Branch extends Node {
  parent: Branch | null = null;
  nodes: Node[] = [];
  n = 0;

  load(xelem: XmlElement, parentSymmetry: boolean[], grid: Grid): boolean {
    const symmetryString = getString(xelem, 'symmetry', null);
    const symmetry = getSymmetry(this.ip.grid.MZ === 1, symmetryString, parentSymmetry);
    if (symmetry === null) throw new RefError(`unknown symmetry ${symmetryString} at line ${xelem.line}`);
    const xchildren = elements(xelem, ...NODE_NAMES);
    this.nodes = new Array(xchildren.length);
    for (let c = 0; c < xchildren.length; c++) {
      const child = Node.factory(xchildren[c], symmetry, this.ip, grid);
      if (child === null) return false;
      if (child instanceof Branch) child.parent = child instanceof MapNode || child instanceof WFCNode ? null : this;
      this.nodes[c] = child;
    }
    return true;
  }

  go(): boolean {
    for (; this.n < this.nodes.length; this.n++) {
      const node = this.nodes[this.n];
      if (node instanceof Branch) this.ip.current = node;
      if (node.go()) return true;
    }
    this.ip.current = this.ip.current!.parent;
    this.reset();
    return false;
  }

  reset(): void {
    for (const node of this.nodes) node.reset();
    this.n = 0;
  }
}

class SequenceNode extends Branch {}

class MarkovNode extends Branch {
  static around(child: Node, ip: Interpreter): MarkovNode {
    const m = new MarkovNode();
    m.nodes = [child];
    m.ip = ip;
    m.grid = ip.grid;
    return m;
  }
  go(): boolean {
    this.n = 0;
    return super.go();
  }
}

class MapNode extends Branch {
  newgrid!: Grid;
  rules: Rule[] = [];
  NX = 1;
  NY = 1;
  NZ = 1;
  DX = 1;
  DY = 1;
  DZ = 1;

  load(xelem: XmlElement, parentSymmetry: boolean[], grid: Grid): boolean {
    const scalestring = getString(xelem, 'scale', null);
    if (scalestring === null) throw new RefError('scale should be specified in map node');
    const scales = scalestring.split(' ');
    if (scales.length !== 3) throw new RefError(`scale attribute "${scalestring}" should have 3 components separated by space`);
    const readScale = (s: string): [number, number] => {
      if (!s.includes('/')) return [Number.parseInt(s, 10), 1];
      const nd = s.split('/');
      return [Number.parseInt(nd[0], 10), Number.parseInt(nd[1], 10)];
    };
    [this.NX, this.DX] = readScale(scales[0]);
    [this.NY, this.DY] = readScale(scales[1]);
    [this.NZ, this.DZ] = readScale(scales[2]);
    const newgrid = Grid.load(xelem, Math.trunc((grid.MX * this.NX) / this.DX), Math.trunc((grid.MY * this.NY) / this.DY), Math.trunc((grid.MZ * this.NZ) / this.DZ));
    if (newgrid === null) return false;
    this.newgrid = newgrid;
    if (!super.load(xelem, parentSymmetry, newgrid)) return false;
    const symmetry = getSymmetry(grid.MZ === 1, getString(xelem, 'symmetry', null), parentSymmetry)!;
    const ruleList: Rule[] = [];
    for (const xrule of elements(xelem, 'rule')) {
      const rule = Rule.load(xrule, grid, newgrid, this.ip.files);
      if (rule === null) return false;
      rule.original = true;
      for (const r of rule.symmetries(symmetry, grid.MZ === 1)) ruleList.push(r);
    }
    this.rules = ruleList;
    return true;
  }

  private static matches(rule: Rule, x: number, y: number, z: number, state: Uint8Array, MX: number, MY: number, MZ: number): boolean {
    for (let dz = 0; dz < rule.IMZ; dz++)
      for (let dy = 0; dy < rule.IMY; dy++)
        for (let dx = 0; dx < rule.IMX; dx++) {
          let sx = x + dx, sy = y + dy, sz = z + dz;
          if (sx >= MX) sx -= MX;
          if (sy >= MY) sy -= MY;
          if (sz >= MZ) sz -= MZ;
          const inputWave = rule.input[dx + dy * rule.IMX + dz * rule.IMX * rule.IMY];
          if ((inputWave & (1 << state[sx + sy * MX + sz * MX * MY])) === 0) return false;
        }
    return true;
  }

  private static apply(rule: Rule, x: number, y: number, z: number, state: Uint8Array, MX: number, MY: number, MZ: number): void {
    for (let dz = 0; dz < rule.OMZ; dz++)
      for (let dy = 0; dy < rule.OMY; dy++)
        for (let dx = 0; dx < rule.OMX; dx++) {
          let sx = x + dx, sy = y + dy, sz = z + dz;
          if (sx >= MX) sx -= MX;
          if (sy >= MY) sy -= MY;
          if (sz >= MZ) sz -= MZ;
          const output = rule.output[dx + dy * rule.OMX + dz * rule.OMX * rule.OMY];
          if (output !== 0xff) state[sx + sy * MX + sz * MX * MY] = output;
        }
  }

  go(): boolean {
    if (this.n >= 0) return super.go();
    const { grid, newgrid } = this;
    newgrid.clear();
    for (const rule of this.rules)
      for (let z = 0; z < grid.MZ; z++)
        for (let y = 0; y < grid.MY; y++)
          for (let x = 0; x < grid.MX; x++)
            if (MapNode.matches(rule, x, y, z, grid.state, grid.MX, grid.MY, grid.MZ))
              MapNode.apply(rule, Math.trunc((x * this.NX) / this.DX), Math.trunc((y * this.NY) / this.DY), Math.trunc((z * this.NZ) / this.DZ), newgrid.state, newgrid.MX, newgrid.MY, newgrid.MZ);
    this.ip.grid = newgrid;
    this.n++;
    return true;
  }

  reset(): void {
    super.reset();
    this.n = -1;
  }
}

// ---------------------------------------------------------------- RuleNode, OneNode, AllNode, ParallelNode

abstract class RuleNode extends Node {
  rules: Rule[] = [];
  counter = 0;
  steps = 0;
  /** (r, x, y, z) four numbers each; `matchCount` of them are the list. */
  matches: number[] = [];
  matchCount = 0;
  lastMatchedTurn = -1;
  matchMask: Uint8Array[] | null = null;
  potentials: Int32Array[] | null = null;
  fields: Array<Field | null> | null = null;
  observations: Array<Observation | null> | null = null;
  temperature = 0;
  search = false;
  futureComputed = false;
  future: Int32Array | null = null;
  trajectory: Uint8Array[] | null = null;
  limit = -1;
  depthCoefficient = 0.5;
  last: Uint8Array = new Uint8Array(0);

  load(xelem: XmlElement, parentSymmetry: boolean[], grid: Grid): boolean {
    const symmetryString = getString(xelem, 'symmetry', null);
    const symmetry = getSymmetry(grid.MZ === 1, symmetryString, parentSymmetry);
    if (symmetry === null) throw new RefError(`unknown symmetry ${symmetryString} at line ${xelem.line}`);
    const ruleList: Rule[] = [];
    const xrules = elements(xelem, 'rule');
    const ruleElements = xrules.length > 0 ? xrules : [xelem];
    for (const xrule of ruleElements) {
      const rule = Rule.load(xrule, grid, grid, this.ip.files);
      if (rule === null) return false;
      rule.original = true;
      const ruleSymmetryString = getString(xrule, 'symmetry', null);
      const ruleSymmetry = getSymmetry(grid.MZ === 1, ruleSymmetryString, symmetry);
      if (ruleSymmetry === null) throw new RefError(`unknown symmetry ${ruleSymmetryString} at line ${xrule.line}`);
      for (const r of rule.symmetries(ruleSymmetry, grid.MZ === 1)) ruleList.push(r);
    }
    this.rules = ruleList;
    this.last = new Uint8Array(this.rules.length);
    this.steps = getInt(xelem, 'steps', 0);
    this.temperature = getDouble(xelem, 'temperature', 0.0);
    const xfields = elements(xelem, 'field');
    if (xfields.length) {
      this.fields = new Array(grid.C).fill(null);
      for (const xfield of xfields) {
        const c = getChar(xfield, 'for');
        const value = grid.values.get(c);
        if (value === undefined) throw new RefError(`unknown field value ${c} at line ${xfield.line}`);
        this.fields[value] = new Field(xfield, grid);
      }
      this.potentials = Array.from({ length: grid.C }, () => new Int32Array(grid.state.length));
    }
    const xobservations = elements(xelem, 'observe');
    if (xobservations.length) {
      this.observations = new Array(grid.C).fill(null);
      for (const x of xobservations) {
        const value = grid.values.get(getChar(x, 'value'));
        if (value === undefined) throw new RefError(`unknown observed value at line ${x.line}`);
        this.observations[value] = new Observation(getChar(x, 'from', grid.characters[value]), getString(x, 'to'), grid);
      }
      this.search = getBool(xelem, 'search', false);
      if (this.search) throw new RefError('search: non tradotto nel riferimento (T500)');
      this.potentials = Array.from({ length: grid.C }, () => new Int32Array(grid.state.length));
      this.future = new Int32Array(grid.state.length);
    }
    return true;
  }

  reset(): void {
    this.lastMatchedTurn = -1;
    this.counter = 0;
    this.futureComputed = false;
    this.last.fill(0);
  }

  protected add(r: number, x: number, y: number, z: number, maskr: Uint8Array | null): void {
    maskr![x + y * this.grid.MX + z * this.grid.MX * this.grid.MY] = 1;
    const k = 4 * this.matchCount;
    this.matches[k] = r;
    this.matches[k + 1] = x;
    this.matches[k + 2] = y;
    this.matches[k + 3] = z;
    this.matchCount++;
  }

  go(): boolean {
    this.last.fill(0);
    if (this.steps > 0 && this.counter >= this.steps) return false;
    const grid = this.grid;
    const { MX, MY, MZ } = grid;
    const ip = this.ip;
    if (this.observations !== null && !this.futureComputed) {
      if (!Observation.computeFutureSetPresent(this.future!, grid.state, this.observations)) return false;
      this.futureComputed = true;
      Observation.computeBackwardPotentials(this.potentials!, this.future!, MX, MY, MZ, this.rules);
    }
    const state = grid.state;
    if (this.lastMatchedTurn >= 0) {
      const changes = ip.changes;
      for (let n = ip.first[this.lastMatchedTurn]; n < ip.changeCount; n++) {
        const x = changes[3 * n], y = changes[3 * n + 1], z = changes[3 * n + 2];
        const value = state[x + y * MX + z * MX * MY];
        for (let r = 0; r < this.rules.length; r++) {
          const rule = this.rules[r];
          const maskr = this.matchMask![r];
          const shifts = rule.ishifts[value];
          for (let l = 0; l < shifts.length; l += 3) {
            const sx = x - shifts[l], sy = y - shifts[l + 1], sz = z - shifts[l + 2];
            if (sx < 0 || sy < 0 || sz < 0 || sx + rule.IMX > MX || sy + rule.IMY > MY || sz + rule.IMZ > MZ) continue;
            const si = sx + sy * MX + sz * MX * MY;
            if (!maskr[si] && grid.matches(rule, sx, sy, sz)) this.add(r, sx, sy, sz, maskr);
          }
        }
      }
    } else {
      this.matchCount = 0;
      for (let r = 0; r < this.rules.length; r++) {
        const rule = this.rules[r];
        const maskr = this.matchMask?.[r] ?? null;
        for (let z = rule.IMZ - 1; z < MZ; z += rule.IMZ)
          for (let y = rule.IMY - 1; y < MY; y += rule.IMY)
            for (let x = rule.IMX - 1; x < MX; x += rule.IMX) {
              const shifts = rule.ishifts[state[x + y * MX + z * MX * MY]];
              for (let l = 0; l < shifts.length; l += 3) {
                const sx = x - shifts[l], sy = y - shifts[l + 1], sz = z - shifts[l + 2];
                if (sx < 0 || sy < 0 || sz < 0 || sx + rule.IMX > MX || sy + rule.IMY > MY || sz + rule.IMZ > MZ) continue;
                if (grid.matches(rule, sx, sy, sz)) this.add(r, sx, sy, sz, maskr);
              }
            }
      }
    }
    if (this.fields !== null) {
      let anysuccess = false, anycomputation = false;
      for (let c = 0; c < this.fields.length; c++) {
        const field = this.fields[c];
        if (field !== null && (this.counter === 0 || field.recompute)) {
          const success = field.compute(this.potentials![c], grid);
          if (!success && field.essential) return false;
          anysuccess ||= success;
          anycomputation = true;
        }
      }
      if (anycomputation && !anysuccess) return false;
    }
    return true;
  }
}

class OneNode extends RuleNode {
  load(xelem: XmlElement, parentSymmetry: boolean[], grid: Grid): boolean {
    if (!super.load(xelem, parentSymmetry, grid)) return false;
    this.matches = [];
    this.matchMask = this.rules.map(() => new Uint8Array(grid.state.length));
    return true;
  }

  reset(): void {
    super.reset();
    if (this.matchCount !== 0) {
      for (const m of this.matchMask!) m.fill(0);
      this.matchCount = 0;
    }
  }

  private apply(rule: Rule, x: number, y: number, z: number): void {
    const { MX, MY } = this.grid;
    const state = this.grid.state;
    for (let dz = 0; dz < rule.OMZ; dz++)
      for (let dy = 0; dy < rule.OMY; dy++)
        for (let dx = 0; dx < rule.OMX; dx++) {
          const newValue = rule.output[dx + dy * rule.OMX + dz * rule.OMX * rule.OMY];
          if (newValue !== 0xff) {
            const sx = x + dx, sy = y + dy, sz = z + dz;
            const si = sx + sy * MX + sz * MX * MY;
            if (newValue !== state[si]) {
              state[si] = newValue;
              this.ip.addChange(sx, sy, sz);
            }
          }
        }
  }

  go(): boolean {
    if (!super.go()) return false;
    this.lastMatchedTurn = this.ip.counter;
    if (this.trajectory !== null) {
      if (this.counter >= this.trajectory.length) return false;
      this.grid.state.set(this.trajectory[this.counter]);
      this.counter++;
      return true;
    }
    const m = this.randomMatch(this.ip.random);
    if (m === null) return false;
    const [R, X, Y, Z] = m;
    this.last[R] = 1;
    this.apply(this.rules[R], X, Y, Z);
    this.counter++;
    return true;
  }

  private removeAt(k: number): void {
    const last = 4 * (this.matchCount - 1);
    for (let t = 0; t < 4; t++) this.matches[4 * k + t] = this.matches[last + t];
    this.matchCount--;
  }

  private randomMatch(random: DotnetRandom): [number, number, number, number] | null {
    const grid = this.grid;
    const ms = this.matches;
    if (this.potentials !== null) {
      if (this.observations !== null && Observation.isGoalReached(grid.state, this.future!)) {
        this.futureComputed = false;
        return null;
      }
      let max = -1000.0;
      let argmax = -1;
      let firstHeuristic = 0.0;
      let firstHeuristicComputed = false;
      for (let k = 0; k < this.matchCount; k++) {
        const r = ms[4 * k], x = ms[4 * k + 1], y = ms[4 * k + 2], z = ms[4 * k + 3];
        const i = x + y * grid.MX + z * grid.MX * grid.MY;
        if (!grid.matches(this.rules[r], x, y, z)) {
          this.matchMask![r][i] = 0;
          this.removeAt(k);
          k--;
        } else {
          const heuristic = Field.deltaPointwise(grid.state, this.rules[r], x, y, z, this.fields, this.potentials, grid.MX, grid.MY);
          if (heuristic === null) continue;
          const h = heuristic;
          if (!firstHeuristicComputed) {
            firstHeuristic = h;
            firstHeuristicComputed = true;
          }
          const u = random.nextDouble();
          const key = this.temperature > 0 ? Math.pow(u, Math.exp((h - firstHeuristic) / this.temperature)) : -h + 0.001 * u;
          if (key > max) {
            max = key;
            argmax = k;
          }
        }
      }
      return argmax >= 0 ? [ms[4 * argmax], ms[4 * argmax + 1], ms[4 * argmax + 2], ms[4 * argmax + 3]] : null;
    }
    while (this.matchCount > 0) {
      const matchIndex = random.nextMax(this.matchCount);
      const r = ms[4 * matchIndex], x = ms[4 * matchIndex + 1], y = ms[4 * matchIndex + 2], z = ms[4 * matchIndex + 3];
      const i = x + y * grid.MX + z * grid.MX * grid.MY;
      this.matchMask![r][i] = 0;
      this.removeAt(matchIndex);
      if (grid.matches(this.rules[r], x, y, z)) return [r, x, y, z];
    }
    return null;
  }
}

class AllNode extends RuleNode {
  load(xelem: XmlElement, parentSymmetry: boolean[], grid: Grid): boolean {
    if (!super.load(xelem, parentSymmetry, grid)) return false;
    this.matches = [];
    this.matchMask = this.rules.map(() => new Uint8Array(grid.state.length));
    return true;
  }

  private fit(r: number, x: number, y: number, z: number, newstate: Uint8Array, MX: number, MY: number): void {
    const rule = this.rules[r];
    for (let dz = 0; dz < rule.OMZ; dz++)
      for (let dy = 0; dy < rule.OMY; dy++)
        for (let dx = 0; dx < rule.OMX; dx++) {
          const value = rule.output[dx + dy * rule.OMX + dz * rule.OMX * rule.OMY];
          if (value !== 0xff && newstate[x + dx + (y + dy) * MX + (z + dz) * MX * MY]) return;
        }
    this.last[r] = 1;
    for (let dz = 0; dz < rule.OMZ; dz++)
      for (let dy = 0; dy < rule.OMY; dy++)
        for (let dx = 0; dx < rule.OMX; dx++) {
          const newvalue = rule.output[dx + dy * rule.OMX + dz * rule.OMX * rule.OMY];
          if (newvalue !== 0xff) {
            const sx = x + dx, sy = y + dy, sz = z + dz;
            const i = sx + sy * MX + sz * MX * MY;
            newstate[i] = 1;
            this.grid.state[i] = newvalue;
            this.ip.addChange(sx, sy, sz);
          }
        }
  }

  go(): boolean {
    if (!super.go()) return false;
    const ip = this.ip;
    this.lastMatchedTurn = ip.counter;
    if (this.trajectory !== null) {
      if (this.counter >= this.trajectory.length) return false;
      this.grid.state.set(this.trajectory[this.counter]);
      this.counter++;
      return true;
    }
    if (this.matchCount === 0) return false;
    const grid = this.grid;
    const { MX, MY } = grid;
    const ms = this.matches;
    if (this.potentials !== null) {
      let firstHeuristic = 0;
      let firstHeuristicComputed = false;
      const list: Array<[number, number]> = [];
      for (let m = 0; m < this.matchCount; m++) {
        const r = ms[4 * m], x = ms[4 * m + 1], y = ms[4 * m + 2], z = ms[4 * m + 3];
        const heuristic = Field.deltaPointwise(grid.state, this.rules[r], x, y, z, this.fields, this.potentials, grid.MX, grid.MY);
        if (heuristic !== null) {
          const h = heuristic;
          if (!firstHeuristicComputed) {
            firstHeuristic = h;
            firstHeuristicComputed = true;
          }
          const u = ip.random.nextDouble();
          list.push([m, this.temperature > 0 ? Math.pow(u, Math.exp((h - firstHeuristic) / this.temperature)) : -h + 0.001 * u]);
        }
      }
      // LINQ's OrderBy is stable, as Array.prototype.sort.
      const ordered = list.map((e, i) => [e[0], -e[1], i] as const).sort((a, b) => (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : a[2] - b[2]));
      for (const [m] of ordered) {
        const r = ms[4 * m], x = ms[4 * m + 1], y = ms[4 * m + 2], z = ms[4 * m + 3];
        this.matchMask![r][x + y * MX + z * MX * MY] = 0;
        this.fit(r, x, y, z, grid.mask, MX, MY);
      }
    } else {
      const order = new Int32Array(this.matchCount);
      shuffle(order, ip.random);
      for (let k = 0; k < order.length; k++) {
        const m = order[k];
        const r = ms[4 * m], x = ms[4 * m + 1], y = ms[4 * m + 2], z = ms[4 * m + 3];
        this.matchMask![r][x + y * MX + z * MX * MY] = 0;
        this.fit(r, x, y, z, grid.mask, MX, MY);
      }
    }
    const changes = ip.changes;
    for (let n = ip.first[this.lastMatchedTurn]; n < ip.changeCount; n++) grid.mask[changes[3 * n] + changes[3 * n + 1] * MX + changes[3 * n + 2] * MX * MY] = 0;
    this.counter++;
    this.matchCount = 0;
    return true;
  }
}

class ParallelNode extends RuleNode {
  private newstate!: Uint8Array;

  load(xelem: XmlElement, parentSymmetry: boolean[], grid: Grid): boolean {
    if (!super.load(xelem, parentSymmetry, grid)) return false;
    this.newstate = new Uint8Array(grid.state.length);
    return true;
  }

  protected add(r: number, x: number, y: number, z: number): void {
    const rule = this.rules[r];
    if (this.ip.random.nextDouble() > rule.p) return;
    this.last[r] = 1;
    const { MX, MY } = this.grid;
    const state = this.grid.state;
    for (let dz = 0; dz < rule.OMZ; dz++)
      for (let dy = 0; dy < rule.OMY; dy++)
        for (let dx = 0; dx < rule.OMX; dx++) {
          const newvalue = rule.output[dx + dy * rule.OMX + dz * rule.OMX * rule.OMY];
          const idi = x + dx + (y + dy) * MX + (z + dz) * MX * MY;
          if (newvalue !== 0xff && newvalue !== state[idi]) {
            this.newstate[idi] = newvalue;
            this.ip.addChange(x + dx, y + dy, z + dz);
          }
        }
    this.matchCount++;
  }

  go(): boolean {
    if (!super.go()) return false;
    const ip = this.ip;
    const { MX, MY } = this.grid;
    const changes = ip.changes;
    for (let n = ip.first[ip.counter]; n < ip.changeCount; n++) {
      const i = changes[3 * n] + changes[3 * n + 1] * MX + changes[3 * n + 2] * MX * MY;
      this.grid.state[i] = this.newstate[i];
    }
    this.counter++;
    return this.matchCount > 0;
  }
}

// ---------------------------------------------------------------- Field, Observation

class Field {
  recompute: boolean;
  inversed = false;
  essential: boolean;
  zero: number;
  substrate: number;

  constructor(xelem: XmlElement, grid: Grid) {
    this.recompute = getBool(xelem, 'recompute', false);
    this.essential = getBool(xelem, 'essential', false);
    this.substrate = grid.wave(getString(xelem, 'on'));
    let zeroSymbols = getString(xelem, 'from', null);
    if (zeroSymbols !== null) this.inversed = true;
    else zeroSymbols = getString(xelem, 'to');
    this.zero = grid.wave(zeroSymbols);
  }

  compute(potential: Int32Array, grid: Grid): boolean {
    const { MX, MY, MZ, state } = grid;
    const front: number[] = [];
    let ix = 0, iy = 0, iz = 0;
    for (let i = 0; i < state.length; i++) {
      potential[i] = -1;
      if ((this.zero & (1 << state[i])) !== 0) {
        potential[i] = 0;
        front.push(0, ix, iy, iz);
      }
      ix++;
      if (ix === MX) {
        ix = 0;
        iy++;
        if (iy === MY) {
          iy = 0;
          iz++;
        }
      }
    }
    if (!front.length) return false;
    for (let head = 0; head < front.length; head += 4) {
      const t = front[head], x = front[head + 1], y = front[head + 2], z = front[head + 3];
      const neighbors: number[] = [];
      if (x > 0) neighbors.push(x - 1, y, z);
      if (x < MX - 1) neighbors.push(x + 1, y, z);
      if (y > 0) neighbors.push(x, y - 1, z);
      if (y < MY - 1) neighbors.push(x, y + 1, z);
      if (z > 0) neighbors.push(x, y, z - 1);
      if (z < MZ - 1) neighbors.push(x, y, z + 1);
      for (let n = 0; n < neighbors.length; n += 3) {
        const i = neighbors[n] + neighbors[n + 1] * MX + neighbors[n + 2] * MX * MY;
        if (potential[i] === -1 && (this.substrate & (1 << state[i])) !== 0) {
          front.push(t + 1, neighbors[n], neighbors[n + 1], neighbors[n + 2]);
          potential[i] = t + 1;
        }
      }
    }
    return true;
  }

  static deltaPointwise(state: Uint8Array, rule: Rule, x: number, y: number, z: number, fields: Array<Field | null> | null, potentials: Int32Array[], MX: number, MY: number): number | null {
    let sum = 0;
    let dz = 0, dy = 0, dx = 0;
    for (let di = 0; di < rule.input.length; di++) {
      const newValue = rule.output[di];
      if (newValue !== 0xff && (rule.input[di] & (1 << newValue)) === 0) {
        const i = x + dx + (y + dy) * MX + (z + dz) * MX * MY;
        const newPotential = potentials[newValue][i];
        if (newPotential === -1) return null;
        const oldValue = state[i];
        const oldPotential = potentials[oldValue][i];
        sum += newPotential - oldPotential;
        if (fields !== null) {
          const oldField = fields[oldValue];
          if (oldField !== null && oldField.inversed) sum += 2 * oldPotential;
          const newField = fields[newValue];
          if (newField !== null && newField.inversed) sum -= 2 * newPotential;
        }
      }
      dx++;
      if (dx === rule.IMX) {
        dx = 0;
        dy++;
        if (dy === rule.IMY) {
          dy = 0;
          dz++;
        }
      }
    }
    return sum;
  }
}

class Observation {
  from: number;
  to: number;

  constructor(from: string, to: string, grid: Grid) {
    const f = grid.values.get(from);
    if (f === undefined) throw new RefError(`the key ${from} was not present`);
    this.from = f;
    this.to = grid.wave(to);
  }

  static computeFutureSetPresent(future: Int32Array, state: Uint8Array, observations: Array<Observation | null>): boolean {
    const mask = new Uint8Array(observations.length);
    for (let k = 0; k < observations.length; k++) if (observations[k] === null) mask[k] = 1;
    for (let i = 0; i < state.length; i++) {
      const value = state[i];
      const obs = observations[value];
      mask[value] = 1;
      if (obs !== null) {
        future[i] = obs.to;
        state[i] = obs.from;
      } else future[i] = 1 << value;
    }
    for (let k = 0; k < mask.length; k++) if (!mask[k]) return false;
    return true;
  }

  static computeBackwardPotentials(potentials: Int32Array[], future: Int32Array, MX: number, MY: number, MZ: number, rules: Rule[]): void {
    for (let c = 0; c < potentials.length; c++) {
      const potential = potentials[c];
      for (let i = 0; i < future.length; i++) potential[i] = (future[i] & (1 << c)) !== 0 ? 0 : -1;
    }
    Observation.computePotentials(potentials, MX, MY, MZ, rules, true);
  }

  private static computePotentials(potentials: Int32Array[], MX: number, MY: number, MZ: number, rules: Rule[], backwards: boolean): void {
    const queue: number[] = [];
    for (let c = 0; c < potentials.length; c++) {
      const potential = potentials[c];
      for (let i = 0; i < potential.length; i++) if (potential[i] === 0) queue.push(c, i % MX, Math.trunc((i % (MX * MY)) / MX), Math.trunc(i / (MX * MY)));
    }
    const matchMask = rules.map(() => new Uint8Array(potentials[0].length));
    for (let head = 0; head < queue.length; head += 4) {
      const value = queue[head], x = queue[head + 1], y = queue[head + 2], z = queue[head + 3];
      const i = x + y * MX + z * MX * MY;
      const t = potentials[value][i];
      for (let r = 0; r < rules.length; r++) {
        const maskr = matchMask[r];
        const rule = rules[r];
        const shifts = backwards ? rule.oshifts![value] : rule.ishifts[value];
        for (let l = 0; l < shifts.length; l += 3) {
          const sx = x - shifts[l], sy = y - shifts[l + 1], sz = z - shifts[l + 2];
          if (sx < 0 || sy < 0 || sz < 0 || sx + rule.IMX > MX || sy + rule.IMY > MY || sz + rule.IMZ > MZ) continue;
          const si = sx + sy * MX + sz * MX * MY;
          if (!maskr[si] && Observation.forwardMatches(rule, sx, sy, sz, potentials, t, MX, MY, backwards)) {
            maskr[si] = 1;
            Observation.applyForward(rule, sx, sy, sz, potentials, t, MX, MY, queue, backwards);
          }
        }
      }
    }
  }

  private static forwardMatches(rule: Rule, x: number, y: number, z: number, potentials: Int32Array[], t: number, MX: number, MY: number, backwards: boolean): boolean {
    let dz = 0, dy = 0, dx = 0;
    const a = backwards ? rule.output : rule.binput;
    for (let di = 0; di < a.length; di++) {
      const value = a[di];
      if (value !== 0xff) {
        const current = potentials[value][x + dx + (y + dy) * MX + (z + dz) * MX * MY];
        if (current > t || current === -1) return false;
      }
      dx++;
      if (dx === rule.IMX) {
        dx = 0;
        dy++;
        if (dy === rule.IMY) {
          dy = 0;
          dz++;
        }
      }
    }
    return true;
  }

  private static applyForward(rule: Rule, x: number, y: number, z: number, potentials: Int32Array[], t: number, MX: number, MY: number, q: number[], backwards: boolean): void {
    const a = backwards ? rule.binput : rule.output;
    for (let dz = 0; dz < rule.IMZ; dz++) {
      const zdz = z + dz;
      for (let dy = 0; dy < rule.IMY; dy++) {
        const ydy = y + dy;
        for (let dx = 0; dx < rule.IMX; dx++) {
          const xdx = x + dx;
          const idi = xdx + ydy * MX + zdz * MX * MY;
          const o = a[dx + dy * rule.IMX + dz * rule.IMX * rule.IMY];
          if (o !== 0xff && potentials[o][idi] === -1) {
            potentials[o][idi] = t + 1;
            q.push(o, xdx, ydy, zdz);
          }
        }
      }
    }
  }

  static isGoalReached(present: Uint8Array, future: Int32Array): boolean {
    for (let i = 0; i < present.length; i++) if (((1 << present[i]) & future[i]) === 0) return false;
    return true;
  }
}

// ---------------------------------------------------------------- PathNode

class PathNode extends Node {
  start = 0;
  finish = 0;
  substrate = 0;
  value = 0;
  inertia = false;
  longest = false;
  edges = false;
  vertices = false;

  load(xelem: XmlElement, _symmetry: boolean[], grid: Grid): boolean {
    const startSymbols = getString(xelem, 'from');
    this.start = grid.wave(startSymbols);
    const v = grid.values.get(getChar(xelem, 'color', startSymbols[0]));
    if (v === undefined) throw new RefError('path: color is not a value');
    this.value = v;
    this.finish = grid.wave(getString(xelem, 'to'));
    this.inertia = getBool(xelem, 'inertia', false);
    this.longest = getBool(xelem, 'longest', false);
    this.edges = getBool(xelem, 'edges', false);
    this.vertices = getBool(xelem, 'vertices', false);
    this.substrate = grid.wave(getString(xelem, 'on'));
    return true;
  }

  reset(): void {}

  go(): boolean {
    const grid = this.grid;
    const { MX, MY, MZ, state } = grid;
    const frontier: number[] = [];
    const startPositions: number[] = [];
    const generations = new Int32Array(state.length).fill(-1);
    for (let z = 0; z < MZ; z++)
      for (let y = 0; y < MY; y++)
        for (let x = 0; x < MX; x++) {
          const i = x + y * MX + z * MX * MY;
          generations[i] = -1;
          const s = state[i];
          if ((this.start & (1 << s)) !== 0) startPositions.push(x, y, z);
          if ((this.finish & (1 << s)) !== 0) {
            generations[i] = 0;
            frontier.push(0, x, y, z);
          }
        }
    if (!startPositions.length || !frontier.length) return false;
    const push = (t: number, x: number, y: number, z: number) => {
      const i = x + y * MX + z * MX * MY;
      const v = state[i];
      if (generations[i] === -1 && ((this.substrate & (1 << v)) !== 0 || (this.start & (1 << v)) !== 0)) {
        if ((this.substrate & (1 << v)) !== 0) frontier.push(t, x, y, z);
        generations[i] = t;
      }
    };
    for (let head = 0; head < frontier.length; head += 4) {
      const t = frontier[head], x = frontier[head + 1], y = frontier[head + 2], z = frontier[head + 3];
      const dirs = PathNode.directions(x, y, z, MX, MY, MZ, this.edges, this.vertices);
      for (let d = 0; d < dirs.length; d += 3) push(t + 1, x + dirs[d], y + dirs[d + 1], z + dirs[d + 2]);
    }
    let anyReached = false;
    for (let s = 0; s < startPositions.length; s += 3) if (generations[startPositions[s] + startPositions[s + 1] * MX + startPositions[s + 2] * MX * MY] > 0) anyReached = true;
    if (!anyReached) return false;
    const localRandom = new DotnetRandom(this.ip.random.next());
    let min = MX * MY * MZ, max = -2;
    let argmin: [number, number, number] = [-1, -1, -1], argmax: [number, number, number] = [-1, -1, -1];
    for (let s = 0; s < startPositions.length; s += 3) {
      const px = startPositions[s], py = startPositions[s + 1], pz = startPositions[s + 2];
      const g = generations[px + py * MX + pz * MX * MY];
      if (g === -1) continue;
      const noise = 0.1 * localRandom.nextDouble();
      if (g + noise < min) {
        min = g + noise;
        argmin = [px, py, pz];
      }
      if (g + noise > max) {
        max = g + noise;
        argmax = [px, py, pz];
      }
    }
    let [penx, peny, penz] = this.longest ? argmax : argmin;
    let [dirx, diry, dirz] = this.direction(penx, peny, penz, 0, 0, 0, generations, localRandom);
    penx += dirx;
    peny += diry;
    penz += dirz;
    while (generations[penx + peny * MX + penz * MX * MY] !== 0) {
      state[penx + peny * MX + penz * MX * MY] = this.value;
      this.ip.addChange(penx, peny, penz);
      [dirx, diry, dirz] = this.direction(penx, peny, penz, dirx, diry, dirz, generations, localRandom);
      penx += dirx;
      peny += diry;
      penz += dirz;
    }
    return true;
  }

  private direction(x: number, y: number, z: number, dx: number, dy: number, dz: number, generations: Int32Array, random: DotnetRandom): [number, number, number] {
    const candidates: Array<[number, number, number]> = [];
    const { MX, MY, MZ } = this.grid;
    const g = generations[x + y * MX + z * MX * MY];
    const add = (DX: number, DY: number, DZ: number) => {
      if (generations[x + DX + (y + DY) * MX + (z + DZ) * MX * MY] === g - 1) candidates.push([DX, DY, DZ]);
    };
    if (!this.vertices && !this.edges) {
      if (dx !== 0 || dy !== 0 || dz !== 0) {
        const cx = x + dx, cy = y + dy, cz = z + dz;
        if (this.inertia && cx >= 0 && cy >= 0 && cz >= 0 && cx < MX && cy < MY && cz < MZ && generations[cx + cy * MX + cz * MX * MY] === g - 1) return [dx, dy, dz];
      }
      if (x > 0) add(-1, 0, 0);
      if (x < MX - 1) add(1, 0, 0);
      if (y > 0) add(0, -1, 0);
      if (y < MY - 1) add(0, 1, 0);
      if (z > 0) add(0, 0, -1);
      if (z < MZ - 1) add(0, 0, 1);
      return candidates[random.nextMax(candidates.length)];
    }
    const dirs = PathNode.directions(x, y, z, MX, MY, MZ, this.edges, this.vertices);
    for (let d = 0; d < dirs.length; d += 3) add(dirs[d], dirs[d + 1], dirs[d + 2]);
    let result: [number, number, number] = [-1, -1, -1];
    if (this.inertia && (dx !== 0 || dy !== 0 || dz !== 0)) {
      let maxScalar = -4;
      for (const c of candidates) {
        const noise = 0.1 * random.nextDouble();
        const cos = (c[0] * dx + c[1] * dy + c[2] * dz) / Math.sqrt((c[0] * c[0] + c[1] * c[1] + c[2] * c[2]) * (dx * dx + dy * dy + dz * dz));
        if (cos + noise > maxScalar) {
          maxScalar = cos + noise;
          result = c;
        }
      }
    } else result = candidates[random.nextMax(candidates.length)];
    return result;
  }

  static directions(x: number, y: number, z: number, MX: number, MY: number, MZ: number, edges: boolean, vertices: boolean): number[] {
    const r: number[] = [];
    if (MZ === 1) {
      if (x > 0) r.push(-1, 0, 0);
      if (x < MX - 1) r.push(1, 0, 0);
      if (y > 0) r.push(0, -1, 0);
      if (y < MY - 1) r.push(0, 1, 0);
      if (edges) {
        if (x > 0 && y > 0) r.push(-1, -1, 0);
        if (x > 0 && y < MY - 1) r.push(-1, 1, 0);
        if (x < MX - 1 && y > 0) r.push(1, -1, 0);
        if (x < MX - 1 && y < MY - 1) r.push(1, 1, 0);
      }
      return r;
    }
    if (x > 0) r.push(-1, 0, 0);
    if (x < MX - 1) r.push(1, 0, 0);
    if (y > 0) r.push(0, -1, 0);
    if (y < MY - 1) r.push(0, 1, 0);
    if (z > 0) r.push(0, 0, -1);
    if (z < MZ - 1) r.push(0, 0, 1);
    if (edges) {
      if (x > 0 && y > 0) r.push(-1, -1, 0);
      if (x > 0 && y < MY - 1) r.push(-1, 1, 0);
      if (x < MX - 1 && y > 0) r.push(1, -1, 0);
      if (x < MX - 1 && y < MY - 1) r.push(1, 1, 0);
      if (x > 0 && z > 0) r.push(-1, 0, -1);
      if (x > 0 && z < MZ - 1) r.push(-1, 0, 1);
      if (x < MX - 1 && z > 0) r.push(1, 0, -1);
      if (x < MX - 1 && z < MZ - 1) r.push(1, 0, 1);
      if (y > 0 && z > 0) r.push(0, -1, -1);
      if (y > 0 && z < MZ - 1) r.push(0, -1, 1);
      if (y < MY - 1 && z > 0) r.push(0, 1, -1);
      if (y < MY - 1 && z < MZ - 1) r.push(0, 1, 1);
    }
    if (vertices) {
      if (x > 0 && y > 0 && z > 0) r.push(-1, -1, -1);
      if (x > 0 && y > 0 && z < MZ - 1) r.push(-1, -1, 1);
      if (x > 0 && y < MY - 1 && z > 0) r.push(-1, 1, -1);
      if (x > 0 && y < MY - 1 && z < MZ - 1) r.push(-1, 1, 1);
      if (x < MX - 1 && y > 0 && z > 0) r.push(1, -1, -1);
      if (x < MX - 1 && y > 0 && z < MZ - 1) r.push(1, -1, 1);
      if (x < MX - 1 && y < MY - 1 && z > 0) r.push(1, 1, -1);
      if (x < MX - 1 && y < MY - 1 && z < MZ - 1) r.push(1, 1, 1);
    }
    return r;
  }
}

// ---------------------------------------------------------------- ConvolutionNode

const KERNELS_2D: Record<string, number[]> = {
  VonNeumann: [0, 1, 0, 1, 0, 1, 0, 1, 0],
  Moore: [1, 1, 1, 1, 0, 1, 1, 1, 1],
};
const KERNELS_3D: Record<string, number[]> = {
  VonNeumann: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
  NoCorners: [0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0],
};

interface ConvolutionRule {
  input: number;
  output: number;
  values: number[] | null;
  sums: boolean[] | null;
  p: number;
}

class ConvolutionNode extends Node {
  private rules: ConvolutionRule[] = [];
  private kernel: number[] = [];
  private periodic = false;
  counter = 0;
  steps = -1;
  private sumfield: Int32Array[] = [];

  load(xelem: XmlElement, _symmetry: boolean[], grid: Grid): boolean {
    let xrules = elements(xelem, 'rule');
    if (!xrules.length) xrules = [xelem];
    this.rules = xrules.map((x) => {
      const value = (c: string) => {
        const v = grid.values.get(c);
        if (v === undefined) throw new RefError(`the key ${c} was not present`);
        return v;
      };
      const rule: ConvolutionRule = { input: value(getChar(x, 'in')), output: value(getChar(x, 'out')), p: getDouble(x, 'p', 1.0), values: null, sums: null };
      const valueString = getString(x, 'values', null);
      const sumsString = getString(x, 'sum', null);
      if ((valueString === null) !== (sumsString === null)) throw new RefError(`missing "values" or "sum" at line ${x.line}`);
      if (valueString !== null) {
        rule.values = [...valueString].map(value);
        rule.sums = new Array(28).fill(false);
        for (const s of sumsString!.split(',')) {
          if (s.includes('.')) {
            const bounds = s.split('..');
            const min = Number.parseInt(bounds[0], 10), max = Number.parseInt(bounds[1], 10);
            for (let i = min; i <= max; i++) rule.sums[i] = true;
          } else rule.sums[Number.parseInt(s, 10)] = true;
        }
      }
      return rule;
    });
    this.steps = getInt(xelem, 'steps', -1);
    this.periodic = getBool(xelem, 'periodic', false);
    const neighborhood = getString(xelem, 'neighborhood');
    const kernel = grid.MZ === 1 ? KERNELS_2D[neighborhood] : KERNELS_3D[neighborhood];
    if (!kernel) throw new RefError(`the given key '${neighborhood}' was not present in the dictionary`);
    this.kernel = kernel;
    this.sumfield = Array.from({ length: grid.state.length }, () => new Int32Array(grid.C));
    return true;
  }

  reset(): void {
    this.counter = 0;
  }

  go(): boolean {
    if (this.steps > 0 && this.counter >= this.steps) return false;
    const grid = this.grid;
    const { MX, MY, MZ, state } = grid;
    for (const s of this.sumfield) s.fill(0);
    const kernel = this.kernel;
    if (MZ === 1) {
      for (let y = 0; y < MY; y++)
        for (let x = 0; x < MX; x++) {
          const sums = this.sumfield[x + y * MX];
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              let sx = x + dx, sy = y + dy;
              if (this.periodic) {
                if (sx < 0) sx += MX;
                else if (sx >= MX) sx -= MX;
                if (sy < 0) sy += MY;
                else if (sy >= MY) sy -= MY;
              } else if (sx < 0 || sy < 0 || sx >= MX || sy >= MY) continue;
              sums[state[sx + sy * MX]] += kernel[dx + 1 + (dy + 1) * 3];
            }
        }
    } else {
      for (let z = 0; z < MZ; z++)
        for (let y = 0; y < MY; y++)
          for (let x = 0; x < MX; x++) {
            const sums = this.sumfield[x + y * MX + z * MX * MY];
            for (let dz = -1; dz <= 1; dz++)
              for (let dy = -1; dy <= 1; dy++)
                for (let dx = -1; dx <= 1; dx++) {
                  let sx = x + dx, sy = y + dy, sz = z + dz;
                  if (this.periodic) {
                    if (sx < 0) sx += MX;
                    else if (sx >= MX) sx -= MX;
                    if (sy < 0) sy += MY;
                    else if (sy >= MY) sy -= MY;
                    if (sz < 0) sz += MZ;
                    else if (sz >= MZ) sz -= MZ;
                  } else if (sx < 0 || sy < 0 || sz < 0 || sx >= MX || sy >= MY || sz >= MZ) continue;
                  sums[state[sx + sy * MX + sz * MX * MY]] += kernel[dx + 1 + (dy + 1) * 3 + (dz + 1) * 9];
                }
          }
    }
    let change = false;
    for (let i = 0; i < this.sumfield.length; i++) {
      const sums = this.sumfield[i];
      const input = state[i];
      for (const rule of this.rules) {
        if (input === rule.input && rule.output !== state[i] && (rule.p === 1.0 || this.ip.random.next() < rule.p * 2147483647)) {
          let success = true;
          if (rule.sums !== null) {
            let sum = 0;
            for (const c of rule.values!) sum += sums[c];
            success = rule.sums[sum];
          }
          if (success) {
            state[i] = rule.output;
            if (VARIANTS.logConvolution) this.ip.addChange(i % MX, Math.trunc(i / MX) % MY, Math.trunc(i / (MX * MY)));
            change = true;
            break;
          }
        }
      }
    }
    this.counter++;
    return change;
  }
}

// ---------------------------------------------------------------- ConvChainNode

class ConvChainNode extends Node {
  private N = 3;
  private temperature = 1;
  private weights = new Float64Array(0);
  c0 = 0;
  c1 = 0;
  private substrate = new Uint8Array(0);
  private substrateColor = 0;
  private counter = 0;
  private steps = -1;

  load(xelem: XmlElement, symmetry: boolean[], grid: Grid): boolean {
    if (grid.MZ !== 1) throw new RefError('convchain currently works only for 2d');
    const name = getString(xelem, 'sample');
    const text = this.ip.files[`${name}.txt`];
    if (text === undefined) throw new RefError(`couldn't load ConvChain sample ${name}`);
    const rows = resourceText(text).split('/');
    const SMX = rows[0].length, SMY = rows.length;
    const white = getChar(xelem, 'white');
    // The text writes the white pixels with the node's `white` letter (lab/scripts/mjx-risorse.ts).
    const sample = Uint8Array.from(rows.join(''), (ch) => (ch === white ? 1 : 0));
    this.N = getInt(xelem, 'n', 3);
    this.steps = getInt(xelem, 'steps', -1);
    this.temperature = getDouble(xelem, 'temperature', 1.0);
    const v = (c: string) => {
      const k = grid.values.get(c);
      if (k === undefined) throw new RefError(`the key ${c} was not present`);
      return k;
    };
    this.c0 = v(getChar(xelem, 'black'));
    this.c1 = v(white);
    this.substrateColor = v(getChar(xelem, 'on'));
    this.substrate = new Uint8Array(grid.state.length);
    const N = this.N;
    this.weights = new Float64Array(1 << (N * N));
    const pattern = (f: (x: number, y: number) => number) => {
      const r = new Uint8Array(N * N);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) r[x + y * N] = f(x, y);
      return r;
    };
    const rotated = (p: Uint8Array) => pattern((x, y) => p[N - 1 - y + x * N]);
    const reflected = (p: Uint8Array) => pattern((x, y) => p[N - 1 - x + y * N]);
    for (let y = 0; y < SMY; y++)
      for (let x = 0; x < SMX; x++) {
        const p = pattern((dx, dy) => sample[((x + dx) % SMX) + ((y + dy) % SMY) * SMX]);
        for (const q of squareSymmetries(p, rotated, reflected, () => false, symmetry)) {
          let index = 0;
          for (let i = 0, power = 1; i < q.length; i++, power *= 2) if (q[i]) index += power;
          this.weights[index] += 1;
        }
      }
    for (let k = 0; k < this.weights.length; k++) if (this.weights[k] <= 0) this.weights[k] = 0.1;
    return true;
  }

  private toggle(state: Uint8Array, i: number): void {
    state[i] = state[i] === this.c0 ? this.c1 : this.c0;
  }

  go(): boolean {
    if (this.steps > 0 && this.counter >= this.steps) return false;
    const { MX, MY, state } = this.grid;
    const random = this.ip.random;
    if (this.counter === 0) {
      let anySubstrate = false;
      for (let i = 0; i < this.substrate.length; i++)
        if (state[i] === this.substrateColor) {
          state[i] = random.nextMax(2) === 0 ? this.c0 : this.c1;
          this.substrate[i] = 1;
          anySubstrate = true;
        }
      this.counter++;
      return anySubstrate;
    }
    const N = this.N;
    for (let k = 0; k < state.length; k++) {
      const r = random.nextMax(state.length);
      if (!this.substrate[r]) continue;
      const x = r % MX, y = Math.trunc(r / MX);
      let q = 1;
      for (let sy = y - N + 1; sy <= y + N - 1; sy++)
        for (let sx = x - N + 1; sx <= x + N - 1; sx++) {
          let ind = 0, difference = 0;
          for (let dy = 0; dy < N; dy++)
            for (let dx = 0; dx < N; dx++) {
              let X = sx + dx;
              if (X < 0) X += MX;
              else if (X >= MX) X -= MX;
              let Y = sy + dy;
              if (Y < 0) Y += MY;
              else if (Y >= MY) Y -= MY;
              const value = state[X + Y * MX] === this.c1;
              const power = 1 << (dy * N + dx);
              ind += value ? power : 0;
              if (X === x && Y === y) difference = value ? power : -power;
            }
          q *= this.weights[ind - difference] / this.weights[ind];
        }
      if (q >= 1) {
        this.toggle(state, r);
        continue;
      }
      if (this.temperature !== 1) q = Math.pow(q, 1.0 / this.temperature);
      if (q > random.nextDouble()) this.toggle(state, r);
    }
    this.counter++;
    return true;
  }

  reset(): void {
    this.substrate.fill(0);
    this.counter = 0;
  }
}

// ---------------------------------------------------------------- WFCNode, OverlapNode, TileNode

const WFC_DX = [1, 0, -1, 0, 0, 0];
const WFC_DY = [0, 1, 0, -1, 0, 0];
const WFC_DZ = [0, 0, 0, 0, 1, -1];
const OPPOSITE = [2, 3, 0, 1, 5, 4];

class Wave {
  data: Uint8Array[];
  compatible: Int32Array[][];
  sumsOfOnes: Int32Array;
  sumsOfWeights: Float64Array | null = null;
  sumsOfWeightLogWeights: Float64Array | null = null;
  entropies: Float64Array | null = null;

  constructor(length: number, P: number, D: number, shannon: boolean) {
    this.data = Array.from({ length }, () => new Uint8Array(P).fill(1));
    this.compatible = Array.from({ length }, () => Array.from({ length: P }, () => new Int32Array(D).fill(-1)));
    this.sumsOfOnes = new Int32Array(length);
    if (shannon) {
      this.sumsOfWeights = new Float64Array(length);
      this.sumsOfWeightLogWeights = new Float64Array(length);
      this.entropies = new Float64Array(length);
    }
  }

  init(propagator: Int32Array[][], sumOfWeights: number, sumOfWeightLogWeights: number, startingEntropy: number, shannon: boolean): void {
    const P = this.data[0].length;
    for (let i = 0; i < this.data.length; i++) {
      for (let p = 0; p < P; p++) {
        this.data[i][p] = 1;
        for (let d = 0; d < propagator.length; d++) this.compatible[i][p][d] = propagator[OPPOSITE[d]][p].length;
      }
      this.sumsOfOnes[i] = P;
      if (shannon) {
        this.sumsOfWeights![i] = sumOfWeights;
        this.sumsOfWeightLogWeights![i] = sumOfWeightLogWeights;
        this.entropies![i] = startingEntropy;
      }
    }
  }

  copyFrom(wave: Wave, D: number, shannon: boolean): void {
    for (let i = 0; i < this.data.length; i++) {
      this.data[i].set(wave.data[i]);
      for (let t = 0; t < this.data[i].length; t++) for (let d = 0; d < D; d++) this.compatible[i][t][d] = wave.compatible[i][t][d];
      this.sumsOfOnes[i] = wave.sumsOfOnes[i];
      if (shannon) {
        this.sumsOfWeights![i] = wave.sumsOfWeights![i];
        this.sumsOfWeightLogWeights![i] = wave.sumsOfWeightLogWeights![i];
        this.entropies![i] = wave.entropies![i];
      }
    }
  }
}

abstract class WFCNode extends Branch {
  protected wave!: Wave;
  protected propagator: Int32Array[][] = [];
  protected P = 0;
  protected N = 1;
  private stack: Int32Array = new Int32Array(0);
  private stacksize = 0;
  protected weights = new Float64Array(0);
  private weightLogWeights = new Float64Array(0);
  private sumOfWeights = 0;
  private sumOfWeightLogWeights = 0;
  private startingEntropy = 0;
  protected newgrid!: Grid;
  private startwave!: Wave;
  protected map = new Map<number, Uint8Array>();
  protected periodic = false;
  protected shannon = false;
  private distribution = new Float64Array(0);
  private tries = 1000;
  private firstgo = true;
  private random: DotnetRandom | null = null;

  /** WFCNode.Load: what comes after the model's own Load (it has made the patterns, the propagator and the new grid). */
  protected loadWave(xelem: XmlElement, parentSymmetry: boolean[], _grid: Grid): boolean {
    this.shannon = getBool(xelem, 'shannon', false);
    this.tries = getInt(xelem, 'tries', 1000);
    const length = this.grid.state.length;
    this.wave = new Wave(length, this.P, this.propagator.length, this.shannon);
    this.startwave = new Wave(length, this.P, this.propagator.length, this.shannon);
    this.stack = new Int32Array(2 * length * this.P);
    this.sumOfWeights = this.sumOfWeightLogWeights = this.startingEntropy = 0;
    if (this.shannon) {
      this.weightLogWeights = new Float64Array(this.P);
      for (let t = 0; t < this.P; t++) {
        this.weightLogWeights[t] = this.weights[t] * Math.log(this.weights[t]);
        this.sumOfWeights += this.weights[t];
        this.sumOfWeightLogWeights += this.weightLogWeights[t];
      }
      this.startingEntropy = Math.log(this.sumOfWeights) - this.sumOfWeightLogWeights / this.sumOfWeights;
    }
    this.distribution = new Float64Array(this.P);
    return Branch.prototype.load.call(this, xelem, parentSymmetry, this.newgrid);
  }

  reset(): void {
    super.reset();
    this.n = -1;
    this.firstgo = true;
  }

  go(): boolean {
    if (this.n >= 0) return super.go();
    if (this.firstgo) {
      this.wave.init(this.propagator, this.sumOfWeights, this.sumOfWeightLogWeights, this.startingEntropy, this.shannon);
      for (let i = 0; i < this.wave.data.length; i++) {
        const startWave = this.map.get(this.grid.state[i]);
        if (startWave) for (let t = 0; t < this.P; t++) if (!startWave[t]) this.ban(i, t);
      }
      if (!this.propagate()) return false;
      this.startwave.copyFrom(this.wave, this.propagator.length, this.shannon);
      const goodseed = this.goodSeed();
      if (goodseed === null) return false;
      this.random = new DotnetRandom(goodseed);
      this.stacksize = 0;
      this.wave.copyFrom(this.startwave, this.propagator.length, this.shannon);
      this.firstgo = false;
      this.newgrid.clear();
      this.ip.grid = this.newgrid;
      return true;
    }
    const node = this.nextUnobservedNode(this.random!);
    if (node >= 0) {
      this.observe(node, this.random!);
      this.propagate();
    } else this.n++;
    if (this.n >= 0) this.updateState();
    return true;
  }

  private goodSeed(): number | null {
    for (let k = 0; k < this.tries; k++) {
      const seed = this.ip.random.next();
      this.random = new DotnetRandom(seed);
      this.stacksize = 0;
      this.wave.copyFrom(this.startwave, this.propagator.length, this.shannon);
      for (;;) {
        const node = this.nextUnobservedNode(this.random);
        if (node >= 0) {
          this.observe(node, this.random);
          if (!this.propagate()) break;
        } else return seed;
      }
    }
    return null;
  }

  private nextUnobservedNode(random: DotnetRandom): number {
    const { MX, MY, MZ } = this.grid;
    let min = 1e4;
    let argmin = -1;
    for (let z = 0; z < MZ; z++)
      for (let y = 0; y < MY; y++)
        for (let x = 0; x < MX; x++) {
          if (!this.periodic && (x + this.N > MX || y + this.N > MY || z + 1 > MZ)) continue;
          const i = x + y * MX + z * MX * MY;
          const remainingValues = this.wave.sumsOfOnes[i];
          const entropy = this.shannon ? this.wave.entropies![i] : remainingValues;
          if (remainingValues > 1 && entropy <= min) {
            const noise = 1e-6 * random.nextDouble();
            if (entropy + noise < min) {
              min = entropy + noise;
              argmin = i;
            }
          }
        }
    return argmin;
  }

  private observe(node: number, random: DotnetRandom): void {
    const w = this.wave.data[node];
    for (let t = 0; t < this.P; t++) this.distribution[t] = w[t] ? this.weights[t] : 0.0;
    const r = randomIndex(this.distribution, random.nextDouble());
    for (let t = 0; t < this.P; t++) if (!!w[t] !== (t === r)) this.ban(node, t);
  }

  private propagate(): boolean {
    const { MX, MY, MZ } = this.grid;
    while (this.stacksize > 0) {
      this.stacksize--;
      const i1 = this.stack[2 * this.stacksize], p1 = this.stack[2 * this.stacksize + 1];
      const x1 = i1 % MX, y1 = Math.trunc((i1 % (MX * MY)) / MX), z1 = Math.trunc(i1 / (MX * MY));
      for (let d = 0; d < this.propagator.length; d++) {
        const dx = WFC_DX[d], dy = WFC_DY[d], dz = WFC_DZ[d];
        let x2 = x1 + dx, y2 = y1 + dy, z2 = z1 + dz;
        if (!this.periodic && (x2 < 0 || y2 < 0 || z2 < 0 || x2 + this.N > MX || y2 + this.N > MY || z2 + 1 > MZ)) continue;
        if (x2 < 0) x2 += MX;
        else if (x2 >= MX) x2 -= MX;
        if (y2 < 0) y2 += MY;
        else if (y2 >= MY) y2 -= MY;
        if (z2 < 0) z2 += MZ;
        else if (z2 >= MZ) z2 -= MZ;
        const i2 = x2 + y2 * MX + z2 * MX * MY;
        const p = this.propagator[d][p1];
        const compat = this.wave.compatible[i2];
        for (let l = 0; l < p.length; l++) {
          const t2 = p[l];
          const comp = compat[t2];
          comp[d]--;
          if (comp[d] === 0) this.ban(i2, t2);
        }
      }
    }
    return this.wave.sumsOfOnes[0] > 0;
  }

  private ban(i: number, t: number): void {
    const wave = this.wave;
    wave.data[i][t] = 0;
    const comp = wave.compatible[i][t];
    for (let d = 0; d < this.propagator.length; d++) comp[d] = 0;
    this.stack[2 * this.stacksize] = i;
    this.stack[2 * this.stacksize + 1] = t;
    this.stacksize++;
    wave.sumsOfOnes[i] -= 1;
    if (this.shannon) {
      let sum = wave.sumsOfWeights![i];
      wave.entropies![i] += wave.sumsOfWeightLogWeights![i] / sum - Math.log(sum);
      wave.sumsOfWeights![i] -= this.weights[t];
      wave.sumsOfWeightLogWeights![i] -= this.weightLogWeights[t];
      sum = wave.sumsOfWeights![i];
      wave.entropies![i] -= wave.sumsOfWeightLogWeights![i] / sum - Math.log(sum);
    }
  }

  protected abstract updateState(): void;
}

class OverlapNode extends WFCNode {
  private patterns: Uint8Array[] = [];

  load(xelem: XmlElement, parentSymmetry: boolean[], grid: Grid): boolean {
    if (grid.MZ !== 1) throw new RefError('overlapping model currently works only for 2d');
    const N = (this.N = getInt(xelem, 'n', 3));
    const symmetryString = getString(xelem, 'symmetry', null);
    const symmetry = getSymmetry(true, symmetryString, parentSymmetry);
    if (symmetry === null) throw new RefError(`unknown symmetry ${symmetryString} at line ${xelem.line}`);
    const periodicInput = getBool(xelem, 'periodicInput', true);
    const newgrid = Grid.load(xelem, grid.MX, grid.MY, grid.MZ);
    if (newgrid === null) return false;
    this.newgrid = newgrid;
    this.periodic = true;
    const name = getString(xelem, 'sample');
    const text = this.ip.files[`${name}.txt`];
    if (text === undefined) throw new RefError(`couldn't read sample ${name}`);
    // The text holds the sample's colours as the node's letters in the order the original finds them (lab/scripts/mjx-risorse.ts).
    const rows = resourceText(text).split('/');
    const SMX = rows[0].length, SMY = rows.length;
    const [sample, C] = ords([...rows.join('')].map((ch) => ch.charCodeAt(0)));
    if (C > newgrid.C) throw new RefError(`there were more than ${newgrid.C} colors in the sample`);
    const W = C ** (N * N);
    const patternFromIndex = (ind: number): Uint8Array => {
      let residue = ind, power = W;
      const result = new Uint8Array(N * N);
      for (let i = 0; i < result.length; i++) {
        power /= C;
        let count = 0;
        while (residue >= power) {
          residue -= power;
          count++;
        }
        result[i] = count;
      }
      return result;
    };
    const pattern = (f: (x: number, y: number) => number) => {
      const r = new Uint8Array(N * N);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) r[x + y * N] = f(x, y);
      return r;
    };
    const rotated = (p: Uint8Array) => pattern((x, y) => p[N - 1 - y + x * N]);
    const reflected = (p: Uint8Array) => pattern((x, y) => p[N - 1 - x + y * N]);
    const indexOf = (p: Uint8Array) => {
      let result = 0, power = 1;
      for (let i = 0; i < p.length; i++, power *= C) result += p[p.length - 1 - i] * power;
      return result;
    };
    const weights = new Map<number, number>();
    const ordering: number[] = [];
    // As the original: the windows are counted over the grid's size, not the sample's.
    const ymax = periodicInput ? grid.MY : grid.MY - N + 1;
    const xmax = periodicInput ? grid.MX : grid.MX - N + 1;
    for (let y = 0; y < ymax; y++)
      for (let x = 0; x < xmax; x++) {
        const p0 = pattern((dx, dy) => sample[((x + dx) % SMX) + ((y + dy) % SMY) * SMX]);
        for (const p of squareSymmetries(p0, rotated, reflected, () => false, symmetry)) {
          const ind = indexOf(p);
          const w = weights.get(ind);
          if (w !== undefined) weights.set(ind, w + 1);
          else {
            weights.set(ind, 1);
            ordering.push(ind);
          }
        }
      }
    this.P = weights.size;
    this.patterns = ordering.map(patternFromIndex);
    this.weights = Float64Array.from(ordering, (w) => weights.get(w)!);
    const agrees = (p1: Uint8Array, p2: Uint8Array, dx: number, dy: number) => {
      const xmin = dx < 0 ? 0 : dx, xmax2 = dx < 0 ? dx + N : N, ymin = dy < 0 ? 0 : dy, ymax2 = dy < 0 ? dy + N : N;
      for (let y = ymin; y < ymax2; y++) for (let x = xmin; x < xmax2; x++) if (p1[x + N * y] !== p2[x - dx + N * (y - dy)]) return false;
      return true;
    };
    this.propagator = [];
    for (let d = 0; d < 4; d++) {
      const row: Int32Array[] = [];
      for (let t = 0; t < this.P; t++) {
        const list: number[] = [];
        for (let t2 = 0; t2 < this.P; t2++) if (agrees(this.patterns[t], this.patterns[t2], WFC_DX[d], WFC_DY[d])) list.push(t2);
        row.push(Int32Array.from(list));
      }
      this.propagator.push(row);
    }
    this.map = new Map();
    for (const xrule of elements(xelem, 'rule')) {
      const input = grid.values.get(getChar(xrule, 'in'));
      const outputs = getString(xrule, 'out').split('|').map((s) => newgrid.values.get(s[0])!);
      this.map.set(input!, Uint8Array.from(this.patterns, (p) => (outputs.includes(p[0]) ? 1 : 0)));
    }
    if (!this.map.has(0)) this.map.set(0, new Uint8Array(this.P).fill(1));
    return this.loadWave(xelem, parentSymmetry, grid);
  }

  protected updateState(): void {
    const { MX, MY } = this.newgrid;
    const votes = Array.from({ length: this.newgrid.state.length }, () => new Int32Array(this.newgrid.C));
    for (let i = 0; i < this.wave.data.length; i++) {
      const w = this.wave.data[i];
      const x = i % MX, y = Math.trunc(i / MX);
      for (let p = 0; p < this.P; p++)
        if (w[p]) {
          const pattern = this.patterns[p];
          for (let dy = 0; dy < this.N; dy++) {
            let ydy = y + dy;
            if (ydy >= MY) ydy -= MY;
            for (let dx = 0; dx < this.N; dx++) {
              let xdx = x + dx;
              if (xdx >= MX) xdx -= MX;
              votes[xdx + ydy * MX][pattern[dx + dy * this.N]]++;
            }
          }
        }
    }
    for (let i = 0; i < votes.length; i++) {
      let max = -1, argmax = 0xff;
      const v = votes[i];
      for (let c = 0; c < v.length; c++)
        if (v[c] > max) {
          argmax = c;
          max = v[c];
        }
      this.newgrid.state[i] = argmax;
    }
  }
}

class TileNode extends WFCNode {
  private tiledata: Uint8Array[] = [];
  private S = 0;
  private SZ = 0;
  private overlap = 0;
  private overlapz = 0;

  load(xelem: XmlElement, parentSymmetry: boolean[], grid: Grid): boolean {
    this.periodic = getBool(xelem, 'periodic', false);
    const name = getString(xelem, 'tileset');
    const tilesname = getString(xelem, 'tiles', name)!.replace(/\//g, '-');
    this.overlap = getInt(xelem, 'overlap', 0);
    this.overlapz = getInt(xelem, 'overlapz', 0);
    const text = this.ip.files[`${name}.xml`];
    if (text === undefined) throw new RefError(`couldn't open tileset ${name}`);
    const xroot = parseXml(text).find((r) => r.name === 'tileset');
    if (!xroot) throw new RefError(`${name}: no <tileset>`);
    const fullSymmetry = getBool(xroot, 'fullSymmetry', false);
    const tileLetters = getString(xroot, 'values', null)?.replace(/\s+/g, '') ?? null;
    const xtiles = elements(xroot, 'tiles').flatMap((t) => elements(t, 'tile'));
    // A tile of the text: layers from the top, rows from the back; the cells x + y·S + z·S·S from the bottom, as the .vox the original reads.
    const readTile = (xtile: XmlElement): [number[], number, number, number] => {
      const own = xtile.text?.trim() ? xtile.text : this.ip.files[`${getString(xtile, 'file', null) ?? `${tilesname}-${getString(xtile, 'name')}`}.txt`];
      if (own === undefined) throw new RefError(`couldn't read tile ${getString(xtile, 'name')}`);
      const [cells, MX, MY, MZ] = parsePattern(resourceText(own));
      return [cells.map((ch) => (tileLetters !== null ? tileLetters.indexOf(ch) : ch.charCodeAt(0))), MX, MY, MZ];
    };
    const [, S, SY, SZ] = readTile(xtiles[0]);
    if (S !== SY) throw new RefError(`tiles should be square shaped: ${S} != ${SY}`);
    if (fullSymmetry && S !== SZ) throw new RefError(`tiles should be cubes for the full symmetry option: ${S} != ${SZ}`);
    this.S = S;
    this.SZ = SZ;
    const newgrid = Grid.load(xelem, (S - this.overlap) * grid.MX + this.overlap, (S - this.overlap) * grid.MY + this.overlap, (SZ - this.overlapz) * grid.MZ + this.overlapz);
    if (newgrid === null) return false;
    this.newgrid = newgrid;
    const newtile = (f: (x: number, y: number, z: number) => number) => {
      const r = new Uint8Array(S * S * SZ);
      for (let z = 0; z < SZ; z++) for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) r[z * S * S + y * S + x] = f(x, y, z);
      return r;
    };
    const zRotate = (p: Uint8Array) => newtile((x, y, z) => p[y + (S - 1 - x) * S + z * S * S]);
    const yRotate = (p: Uint8Array) => newtile((x, y, z) => p[z + y * S + (S - 1 - x) * S * S]);
    const xRotate = (p: Uint8Array) => newtile((x, y, z) => p[x + z * S + (S - 1 - y) * S * S]);
    const xReflect = (p: Uint8Array) => newtile((x, y, z) => p[S - 1 - x + y * S + z * S * S]);
    const yReflect = (p: Uint8Array) => newtile((x, y, z) => p[x + (S - 1 - y) * S + z * S * S]);
    const zReflect = (p: Uint8Array) => newtile((x, y, z) => p[x + y * S + (S - 1 - z) * S * S]);
    const same = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i]);
    const namedTileData = new Map<string, Uint8Array[]>();
    const tempStationary: number[] = [];
    const uniques: number[] = [];
    const positions = new Map<string, Uint8Array>();
    let ind = 0;
    for (const xtile of xtiles) {
      const tilename = getString(xtile, 'name');
      const weight = getDouble(xtile, 'weight', 1.0);
      const [vox] = readTile(xtile);
      const [flatTile, C] = ords(vox, uniques);
      if (C > newgrid.C) throw new RefError(`there were more than ${newgrid.C} colors in vox files`);
      const localdata = fullSymmetry ? cubeSymmetries(flatTile, zRotate, yRotate, xReflect, same) : squareSymmetries(flatTile, zRotate, xReflect, same);
      const position = new Uint8Array(128);
      namedTileData.set(tilename, localdata);
      for (const p of localdata) {
        this.tiledata.push(p);
        tempStationary.push(weight);
        position[ind] = 1;
        ind++;
      }
      positions.set(tilename, position);
    }
    const P = (this.P = this.tiledata.length);
    this.weights = Float64Array.from(tempStationary);
    this.map = new Map();
    for (const xrule of elements(xelem, 'rule')) {
      const input = grid.values.get(getChar(xrule, 'in'))!;
      const position = new Uint8Array(P);
      for (const s of getString(xrule, 'out').split('|')) {
        const array = positions.get(s);
        if (!array) throw new RefError(`unknown tilename ${s} at line ${xrule.line}`);
        for (let p = 0; p < P; p++) if (array[p]) position[p] = 1;
      }
      this.map.set(input, position);
    }
    if (!this.map.has(0)) this.map.set(0, new Uint8Array(P).fill(1));
    const temp = Array.from({ length: 6 }, () => Array.from({ length: P }, () => new Uint8Array(P)));
    const index = (p: Uint8Array) => this.tiledata.findIndex((t) => same(p, t));
    const last = (attribute: string) => attribute.split(' ').at(-1)!;
    const tile = (attribute: string): Uint8Array => {
      const code = attribute.split(' ');
      const action = code.length === 2 ? code[0] : '';
      let starttile = namedTileData.get(last(attribute))![0];
      for (let i = action.length - 1; i >= 0; i--) {
        const sym = action[i];
        if (sym === 'x') starttile = xRotate(starttile);
        else if (sym === 'y') starttile = yRotate(starttile);
        else if (sym === 'z') starttile = zRotate(starttile);
        else throw new RefError(`unknown symmetry ${sym}`);
      }
      return starttile;
    };
    const tilenames = xtiles.map((x) => getString(x, 'name'));
    const never = () => false;
    for (const xneighbor of elements(xroot, 'neighbors').flatMap((n) => elements(n, 'neighbor'))) {
      if (fullSymmetry) {
        const left = getString(xneighbor, 'left'), right = getString(xneighbor, 'right');
        if (!tilenames.includes(last(left)) || !tilenames.includes(last(right))) throw new RefError(`unknown tile ${last(left)} or ${last(right)}`);
        const ltile = tile(left), rtile = tile(right);
        const lsym = squareSymmetries(ltile, xRotate, yReflect, never), rsym = squareSymmetries(rtile, xRotate, yReflect, never);
        for (let i = 0; i < lsym.length; i++) {
          temp[0][index(lsym[i])][index(rsym[i])] = 1;
          temp[0][index(xReflect(rsym[i]))][index(xReflect(lsym[i]))] = 1;
        }
        const dtile = zRotate(ltile), utile = zRotate(rtile);
        const dsym = squareSymmetries(dtile, yRotate, zReflect, never), usym = squareSymmetries(utile, yRotate, zReflect, never);
        for (let i = 0; i < dsym.length; i++) {
          temp[1][index(dsym[i])][index(usym[i])] = 1;
          temp[1][index(yReflect(usym[i]))][index(yReflect(dsym[i]))] = 1;
        }
        const btile = yRotate(ltile), ttile = yRotate(rtile);
        const bsym = squareSymmetries(btile, zRotate, xReflect, never), tsym = squareSymmetries(ttile, zRotate, xReflect, never);
        for (let i = 0; i < bsym.length; i++) {
          temp[4][index(bsym[i])][index(tsym[i])] = 1;
          temp[4][index(zReflect(tsym[i]))][index(zReflect(bsym[i]))] = 1;
        }
      } else if (getString(xneighbor, 'left', null) !== null) {
        const left = getString(xneighbor, 'left'), right = getString(xneighbor, 'right');
        if (!tilenames.includes(last(left)) || !tilenames.includes(last(right))) throw new RefError(`unknown tile ${last(left)} or ${last(right)}`);
        const ltile = tile(left), rtile = tile(right);
        temp[0][index(ltile)][index(rtile)] = 1;
        temp[0][index(yReflect(ltile))][index(yReflect(rtile))] = 1;
        temp[0][index(xReflect(rtile))][index(xReflect(ltile))] = 1;
        temp[0][index(yReflect(xReflect(rtile)))][index(yReflect(xReflect(ltile)))] = 1;
        const dtile = zRotate(ltile), utile = zRotate(rtile);
        temp[1][index(dtile)][index(utile)] = 1;
        temp[1][index(xReflect(dtile))][index(xReflect(utile))] = 1;
        temp[1][index(yReflect(utile))][index(yReflect(dtile))] = 1;
        temp[1][index(xReflect(yReflect(utile)))][index(xReflect(yReflect(dtile)))] = 1;
      } else {
        const top = getString(xneighbor, 'top', null), bottom = getString(xneighbor, 'bottom', null);
        if (top === null || bottom === null || !tilenames.includes(last(top)) || !tilenames.includes(last(bottom))) throw new RefError(`unknown tile ${top} or ${bottom}`);
        const ttile = tile(top), btile = tile(bottom);
        const tsym = squareSymmetries(ttile, zRotate, xReflect, never), bsym = squareSymmetries(btile, zRotate, xReflect, never);
        for (let i = 0; i < tsym.length; i++) temp[4][index(bsym[i])][index(tsym[i])] = 1;
      }
    }
    for (let p2 = 0; p2 < P; p2++)
      for (let p1 = 0; p1 < P; p1++) {
        temp[2][p2][p1] = temp[0][p1][p2];
        temp[3][p2][p1] = temp[1][p1][p2];
        temp[5][p2][p1] = temp[4][p1][p2];
      }
    this.propagator = temp.map((d) => d.map((tp) => Int32Array.from(Array.from(tp).flatMap((v, p2) => (v ? [p2] : [])))));
    return this.loadWave(xelem, parentSymmetry, grid);
  }

  protected updateState(): void {
    const { grid, newgrid, S, SZ } = this;
    for (let z = 0; z < grid.MZ; z++)
      for (let y = 0; y < grid.MY; y++)
        for (let x = 0; x < grid.MX; x++) {
          const w = this.wave.data[x + y * grid.MX + z * grid.MX * grid.MY];
          const votes = Array.from({ length: S * S * SZ }, () => new Int32Array(newgrid.C));
          for (let t = 0; t < this.P; t++)
            if (w[t]) {
              const tile = this.tiledata[t];
              for (let di = 0; di < S * S * SZ; di++) votes[di][tile[di]]++;
            }
          for (let dz = 0; dz < SZ; dz++)
            for (let dy = 0; dy < S; dy++)
              for (let dx = 0; dx < S; dx++) {
                const v = votes[dx + dy * S + dz * S * S];
                let max = -1, argmax = 0xff;
                for (let c = 0; c < v.length; c++)
                  if (v[c] > max) {
                    argmax = c;
                    max = v[c];
                  }
                const sx = x * (S - this.overlap) + dx, sy = y * (S - this.overlap) + dy, sz = z * (SZ - this.overlapz) + dz;
                newgrid.state[sx + sy * newgrid.MX + sz * newgrid.MX * newgrid.MY] = argmax;
              }
        }
  }
}

// ---------------------------------------------------------------- Interpreter

export class Interpreter {
  root!: Branch;
  current: Branch | null = null;
  grid!: Grid;
  private startgrid!: Grid;
  private origin = false;
  random!: DotnetRandom;
  /** (x, y, z) three numbers each; `changeCount` of them. */
  changes: number[] = [];
  changeCount = 0;
  first: number[] = [];
  counter = 0;
  files: Files = {};

  addChange(x: number, y: number, z: number): void {
    const k = 3 * this.changeCount;
    this.changes[k] = x;
    this.changes[k + 1] = y;
    this.changes[k + 2] = z;
    this.changeCount++;
  }

  static load(xelem: XmlElement, MX: number, MY: number, MZ: number, files: Files = {}): Interpreter | null {
    const ip = new Interpreter();
    ip.files = files;
    ip.origin = getBool(xelem, 'origin', false);
    const grid = Grid.load(xelem, MX, MY, MZ);
    if (grid === null) return null;
    ip.grid = grid;
    ip.startgrid = grid;
    const symmetryString = getString(xelem, 'symmetry', null);
    const symmetry = getSymmetry(grid.MZ === 1, symmetryString, new Array(grid.MZ === 1 ? 8 : 48).fill(true));
    if (symmetry === null) throw new RefError(`unknown symmetry ${symmetryString} at line ${xelem.line}`);
    const topnode = Node.factory(xelem, symmetry, ip, ip.grid);
    if (topnode === null) return null;
    ip.root = topnode instanceof Branch ? topnode : MarkovNode.around(topnode, ip);
    return ip;
  }

  /**
   * Interpreter.Run without the frames, from an empty grid or from `start` (the letters of the cells, x fastest, then y, then z upwards),
   * as lab/banco/markov/originale/Program.cs does: the last grid, its steps, whether it finished.
   */
  run(seed: number, steps: number, start?: string): { grid: Grid; steps: number; finished: boolean } {
    this.random = new DotnetRandom(seed);
    this.grid = this.startgrid;
    this.grid.clear();
    if (start !== undefined) for (let i = 0; i < this.grid.state.length; i++) this.grid.state[i] = this.grid.values.get(start[i]) ?? 0;
    else if (this.origin) this.grid.state[Math.trunc(this.grid.MX / 2) + Math.trunc(this.grid.MY / 2) * this.grid.MX + Math.trunc(this.grid.MZ / 2) * this.grid.MX * this.grid.MY] = 1;
    this.changeCount = 0;
    this.first = [0];
    this.root.reset();
    this.current = this.root;
    this.counter = 0;
    while (this.current !== null && (steps <= 0 || this.counter < steps)) {
      this.current.go();
      this.counter++;
      this.first.push(this.changeCount);
    }
    return { grid: this.grid, steps: this.counter, finished: this.current === null };
  }
}

/** The grid as text, as Program.cs prints it: a line per row (y from the back), the layers from the bottom, a blank line between them. */
export function gridText(g: Grid): string {
  const out: string[] = [];
  for (let z = 0; z < g.MZ; z++) {
    for (let y = 0; y < g.MY; y++) {
      let row = '';
      for (let x = 0; x < g.MX; x++) row += g.characters[g.state[x + y * g.MX + z * g.MX * g.MY]];
      out.push(row);
    }
    if (z < g.MZ - 1) out.push('');
  }
  return out.join('\n');
}

/** Loads a model's XML as the original (its root element) and runs it: what the original's Program.cs prints, in a few fields. */
export function runReference(xml: string, size: [number, number, number], seed: number, steps: number, files: Files = {}, start?: string) {
  const root = parseXml(xml).find((r) => !['animation', 'action', 'worn'].includes(r.name));
  if (!root) throw new RefError('no root');
  const ip = Interpreter.load(root, size[0], size[1], size[2], files);
  if (ip === null) throw new RefError('ERROR');
  const r = ip.run(seed, steps, start);
  return { ...r, text: gridText(r.grid) };
}
