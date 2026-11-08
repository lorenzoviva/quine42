// MarkovJunior programs written as MarkovJunior writes them (github.com/mxgmn/MarkovJunior): XML, the
// grid's letters in `values` (the first one is the empty cell), MarkovJunior's palette, patterns with
// '/' between rows and ' ' between layers — the TOP layer first, as in MarkovJunior (Rule.cs reads
// layer MZ-1-z) — and the same nodes: one, all, prl, sequence, markov, convolution, path, map, union.
// They compile to the lab's engine (lab/mj3d/engine.ts), which flips the layers (bottom first).
//
// What the lab adds, all optional:
//   <sequence values=".." size="20 15 30">  the box (MarkovJunior gives it outside the program); the
//                                           sculptor's box comes from the class and overrides it
//   origin="True" | "bottom"                MarkovJunior's centre of the box, or the centre of the floor
//   ground="G"                              fills the floor layer before the program starts
//   soil="E"                                fills the layer of the world's ground, `base` voxels up (ADR-0135): the same program at every size
//   <color symbol="N" value="8b5a2b" part="gamba" hidden="True" glow="True"/>  recolours a letter
//                                           (MarkovJunior's palette.xml syntax); `part` names a limb that
//                                           moves when the figure walks; `hidden` keeps a marker out of the
//                                           picture; `glow` makes it give light (flames, windows, neon)
//   <box|ellipsoid|cylinder|cone at="x y z" size="w d h" color="A" on="B"/>, <line at to r color/>
//                                           solid shapes, `at` the centre of the base, z from the floor up
//   <animation name="fiamma" frames="6">…</animation>  nodes run once per frame on the finished model,
//                                           each frame on the one before (flames, water, blinking)
//   <action name="apri" label="Apri la porta">…</action>  nodes run on the model when someone acts on it
//   <sound bpm scale root swing cutoff space><track y instrument volume/></sound>  the grid is a score (src/mj/sound.ts)
//   <map … clear="False">                   the grid is scaled and kept (every cell a block of itself) before the rules write on it
//   <rule><in>…</in><out>…</out></rule>     a pattern as the text of a child, in place of the attribute (T333, ADR-0171): the same
//                                           syntax, layers apart by spaces or lines, and a "/" may end a line (the row goes on below);
//                                           on one, all, prl, convolution and every rule; the attribute or the child, never both
//   <rule fin="a" fout="b"/>, <rule file="c"/>  a pattern read from a text file of models/ (`a.txt`; `file` holds in, a line "->", out)
//   <import file="x"/>                      the program of models/x.xml run here as a node: its letters, colours and unions come
//                                           with it; its box, origin, ground, soil, sound, animations and actions do not
// Files come from `opts.files` (`mjxIncludes` gathers them): plain names, never a path, bounded in depth, number and size.
// Inference, as MarkovJunior (T334, ADR-0173, src/mj/infer.ts): inside one, all and prl, <field for from|to on recompute essential/> and
// <observe value from to/>, with temperature, search, limit and depthCoefficient on the node.
// Tiles and samples, as MarkovJunior (T335, ADR-0174, src/mj/wfc.ts), only text:
//   <wfc tileset="x" values=".." periodic overlap overlapz tiles shannon tries><rule in="W" out="Empty|Line"/>…nodes…</wfc>
//                                           the tileset is models/x.xml, root <tileset values fullSymmetry> with <tiles><tile name weight
//                                           file>pattern</tile></tiles> and <neighbors><neighbor left right | top bottom/></neighbors>; a tile
//                                           is the text of its <tile>, or models/<file>.txt, or models/<tiles>-<name>.txt
//   <wfc sample="x" values=".." n symmetry periodicInput shannon tries><rule in="W" out="A|B"/>…</wfc>  a flat sample, models/x.txt
//   <convchain sample="x" n temperature on black white steps/>  a flat sample of the black and white letters, models/x.txt
//   <map scale="5/3 5/3 6/3">               a fraction: the new grid is M·N/D cells, the rules write at x·N/D
//   folder="F" on the root, a map or a wfc  the rule files of that grid are models/F-<name>.txt (MarkovJunior's folders)
// A union belongs to its grid (the root, a map, a wfc), as in MarkovJunior: the same symbol may mean other letters in another grid.
// Symbols (T342, ADR-0175, src/mj/symbols.ts): a letter, or `#` and a number (`#12`) when the letters are not enough; a digit alone
// is not one (up to the contract 0.5 it was: the migration writes `3` as `#3`). The compiler hands the engine one character per symbol.

import { internalName } from '../kernel/internalNames';
import { Mj3Error, PARTS, SHAPES, type ConvRule, type FieldSpec, type Inference, type Node3, type ObserveSpec, type PaletteEntry, type Part, type Program3, type Rule3, type ShapeKind, type Sym, type Vec3 } from './engine';
import { MJ_PALETTE } from './palette';
import { soundSettings, type SoundSettings } from './sound';
import { overlapModel, squareSubgroup, tileModel, WFC_LIMITS, WfcError, type NeighborSource, type TileSource, type WfcModel } from './wfc';
import { isNoteLine, isSymbolCode, MAX_SYMBOLS, readSymbols, showSymbols, SymbolError, symbolName, symbolTokens } from './symbols';
import { parseXml, XmlError, type XmlElement } from './xml';

export interface MjxClip {
  name: string;
  label?: string;
  /** Frames of an animation (an action runs once). */
  frames: number;
  program: Pick<Program3, 'palette' | 'unions' | 'program'>;
}

export interface MjxModel {
  name?: string;
  program: Program3;
  animations: MjxClip[];
  actions: MjxClip[];
  /** The letter of the empty cell. */
  background: string;
  /** What `<sound>` says: the program is a score. */
  sound?: SoundSettings;
  warnings: string[];
}

const SYMMETRY: Record<string, Sym> = { '()': 'none', '(x)': 'x', '(y)': 'y', '(z)': 'z', '(xy)': 'xy', '(xyz+)': 'rot', '(xyz)': 'all' };
const RULE_NODES = new Set(['one', 'all', 'prl']);
/** Every node the engine runs, as the XML names it (`<import>` is not one: it becomes the nodes of the file it reads). */
export const MJX_NODES: readonly string[] = ['one', 'all', 'prl', 'sequence', 'markov', 'convolution', 'path', 'map', 'wfc', 'convchain', ...SHAPES];
/** The nodes a program may start with (its root, or an imported file's). */
const ROOT_NODES = new Set(['one', 'all', 'prl', 'sequence', 'markov', 'map', 'convolution', 'path']);

/**
 * The files of models/ a program reads (T333, ADR-0171), by name in that folder: `x.xml` for `<import file="x"/>`, `x.txt` for a rule's
 * `fin`, `fout` or `file`. Only text, only plain names: nothing outside the folder can be named.
 */
export type MjxFiles = Readonly<Record<string, string>>;
/** A file a program may name: the same as a model's id. */
export const MJX_FILE_RE = /^[a-z0-9][a-z0-9-]{0,40}$/i;
/** Imports one inside the other. */
export const MJX_INCLUDE_DEPTH = 6;
/** Imports in a program, counting each time one is used. */
export const MJX_INCLUDE_COUNT = 64;
/** Characters of what a program reads from files, counting each time one is read. */
export const MJX_INCLUDE_CHARS = 1_000_000;
/** The nodes that hold a rule, so whose `file` is a rule file. */
const RULE_HOLDERS = new Set(['one', 'all', 'prl', 'rule', 'convolution']);

/**
 * The text of a pattern written in a child or a file as the attribute's: lines starting with "#" and no number are notes (`#12AB` is a
 * row, T342), a "/" with spaces or lines around it joins two rows, the rest stays as it is (spaces and lines between layers).
 */
export function patternText(s: string): string {
  return s
    .split(/\r?\n/)
    .filter((l) => !isNoteLine(l))
    .join('\n')
    .replace(/\s*\/\s*/g, '/')
    .trim();
}

/**
 * Every file a program reads, with its text (imports of imports too), from `read` (a name in models/ → its text). What is missing stays
 * out: compiling says why. A program that names no file costs no parse.
 */
export function mjxIncludes(src: string, read: (file: string) => string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!/\b(?:import|fin|fout|file|tileset|sample)\b/.test(src)) return out;
  const queue = [src];
  /** Reads a file once; its text, if it is there. */
  const take = (f: string): string | undefined => {
    if (f in out) return out[f];
    if (!MJX_FILE_RE.test(f.slice(0, -4))) return undefined;
    const text = read(f);
    if (typeof text !== 'string') return undefined;
    return (out[f] = text);
  };
  while (queue.length) {
    let roots: XmlElement[];
    try {
      roots = parseXml(queue.shift()!);
    } catch {
      continue;
    }
    // `folder` belongs to the grid the rules write: the root's, a map's, a wfc's.
    const visit = (el: XmlElement, folder: string | undefined) => {
      if (el.name === 'import') {
        const f = `${el.attrs.file}.xml`;
        const known = f in out;
        const text = take(f);
        if (text !== undefined && !known) queue.push(text);
      } else if (RULE_HOLDERS.has(el.name)) for (const a of ['fin', 'fout', 'file']) if (el.attrs[a] !== undefined) take(`${inFolder(folder, el.attrs[a])}.txt`);
      if ((el.name === 'wfc' || el.name === 'convchain') && el.attrs.sample !== undefined) take(`${el.attrs.sample}.txt`);
      if (el.name === 'wfc' && el.attrs.tileset !== undefined) {
        const text = take(`${el.attrs.tileset}.xml`);
        if (text !== undefined) for (const t of tilesOf(text)) if (!t.text?.trim()) take(`${t.attrs.file ?? `${el.attrs.tiles ?? el.attrs.tileset}-${t.attrs.name}`}.txt`);
      }
      const inner = el.name === 'map' || el.name === 'wfc' ? el.attrs.folder : folder;
      for (const c of el.children) visit(c, inner);
    };
    for (const r of roots) visit(r, r.attrs.folder);
  }
  return out;
}

/** A rule file's name in its grid's folder (MarkovJunior's resources/rules/<folder>/): `F-name`. */
const inFolder = (folder: string | undefined, name: string) => (folder ? `${folder}-${name}` : name);

/** The <tile> elements of a tileset's text (none if it does not read). */
function tilesOf(text: string): XmlElement[] {
  try {
    const root = parseXml(text).find((r) => r.name === 'tileset');
    return root?.children.filter((c) => c.name === 'tiles').flatMap((c) => c.children.filter((t) => t.name === 'tile')) ?? [];
  } catch {
    return [];
  }
}
/** What infers inside a rule node (T334): not a node of its own. */
const INFERENCE_TAGS = new Set(['field', 'observe']);
const truthy = (s: string | undefined) => /^true$/i.test(s ?? '');

interface Ctx {
  /** The empty letter of the grid in scope (it becomes the engine's air, '.'). */
  bg: string;
  sym: Sym;
  /** Letters the grid in scope may hold. */
  values: Set<string>;
  /** The grid's folder (MarkovJunior's `folder`): its rule files are models/<folder>-<name>.txt. */
  folder?: string;
  /** The elements of the grids in scope, outermost first (the root, then each map and wfc): where a union belongs (T335). */
  scopes?: readonly XmlElement[];
}

/** The grids of a program: a union written in one belongs to it (MarkovJunior's Grid.Load). */
const GRID_TAGS = new Set(['map', 'wfc']);
/** The symbols a union becomes when it means other letters in another grid: the engine has one table (private use, never typed). */
const PRIVATE_UNION = 0xe000;
/** Where the numbered symbols begin (symbols.ts): the private unions stop before. */
const PRIVATE_UNION_END = 0xf000;

class Compiler {
  unions: Record<string, string> = {};
  colors: Record<string, PaletteEntry> = {};
  /** Every letter declared by any grid (root and maps). */
  declared = new Set<string>();
  warnings: string[] = [];
  animations: MjxClip[] = [];
  actions: MjxClip[] = [];
  sound?: SoundSettings;
  /**
   * Strict: MarkovJunior's own checks. Otherwise the shapes models get wrong and whose meaning is clear
   * are mended, with a warning (spaces or repeats in values, a letter used but not declared, an unknown
   * part): models do not count characters.
   */
  constructor(
    private strict: boolean,
    private files: MjxFiles = {},
    /** The program's own name in models/, if it has one: importing itself is a cycle at once. */
    self?: string,
  ) {
    if (self) this.chain.push(self);
    this.top = this.chain.length;
  }

  /** The imports from the program down to the one being compiled now (the program's own name first, if known). */
  chain: string[] = [];
  /** Where the imports begin in `chain`. */
  private top: number;
  /** The imported file being compiled now; undefined in the program itself. */
  file?: string;
  imports = 0;
  /** Characters read from files. */
  read = 0;
  /** Each imported file parsed once. */
  parsed = new Map<string, XmlElement>();
  /** Files whose colours and unions were collected. */
  collected = new Set<string>();
  /** The unions the program itself writes (not its imports), each with its grid (T335). */
  unionDefs: Array<{ sym: string; values: string; scope: XmlElement }> = [];
  /** Symbols whose unions mean other letters in other grids (and "."): each grid has its own private symbol for them. */
  conflicted = new Set<string>();
  scopedUnions = new Map<XmlElement, Map<string, string>>();
  /** The letters of those private symbols, the grid's empty letter as ".". */
  privateUnions: Record<string, string> = {};
  /** `legend` said once: a text file has its letters. */
  private legendSaid = false;

  where(el: XmlElement): string {
    return `${this.file ? `models/${this.file}.xml, ` : ''}riga ${el.line}`;
  }

  fail(el: XmlElement, msg: string): never {
    throw new Mj3Error(`${this.where(el)}, <${el.name}>: ${msg}`);
  }

  mend(el: XmlElement, msg: string): void {
    if (this.strict) this.fail(el, msg);
    this.warnings.push(`${this.where(el)}: ${msg} (riparato)`);
  }

  /** A text of symbols as the engine reads it (`#12` one character, T342), or why not. */
  syms(el: XmlElement, s: string, what: string): string {
    try {
      return readSymbols(s);
    } catch (e) {
      if (e instanceof SymbolError) this.fail(el, `${what}: ${e.message}`);
      throw e;
    }
  }

  /** A symbol on its own, as the engine reads it (not the grid's '.'): a union's or a colour's sign, black and white of a sample. */
  sign(el: XmlElement, s: string | undefined, what: string): string {
    const t = typeof s === 'string' ? this.syms(el, s, what) : '';
    if (t.length !== 1) this.fail(el, `"${what}" è un solo simbolo (una lettera o # e un numero), non "${s ?? ''}"`);
    return t;
  }

  /** A file of models/ by its plain name, counted. */
  fileText(el: XmlElement, name: string | undefined, ext: 'xml' | 'txt', what: string): string {
    if (!name || !MJX_FILE_RE.test(name)) this.fail(el, `${what} vuole il nome semplice di un file di models/ (lettere, cifre e "-", niente percorsi né estensione), non "${name ?? ''}"`);
    const key = `${name}.${ext}`;
    const text = Object.prototype.hasOwnProperty.call(this.files, key) ? this.files[key] : undefined;
    if (typeof text !== 'string') this.fail(el, `manca il file models/${key}`);
    this.read += text.length;
    if (this.read > MJX_INCLUDE_CHARS) this.fail(el, `i file letti sono troppo lunghi (al più ${MJX_INCLUDE_CHARS} caratteri in tutto)`);
    return text;
  }

  /** The program of an imported file: its one root (animations and actions beside it stay in that file). */
  importRoot(el: XmlElement, name: string | undefined): XmlElement {
    const text = this.fileText(el, name, 'xml', '<import file>');
    const known = this.parsed.get(name!);
    if (known) return known;
    let roots: XmlElement[];
    try {
      roots = parseXml(text);
    } catch (e) {
      if (e instanceof XmlError) this.fail(el, `models/${name}.xml: XML: ${e.message}`);
      throw e;
    }
    const mains = roots.filter((r) => !CLIP_TAGS.has(r.name));
    if (mains.length !== 1) this.fail(el, `models/${name}.xml deve avere un solo nodo radice (trovati ${mains.length})`);
    if (roots.length > 1) this.warnings.push(`${this.where(el)}: models/${name}.xml: le sue animazioni e azioni restano sue, qui non entrano`);
    this.parsed.set(name!, mains[0]);
    return mains[0];
  }

  /** Compiles inside an imported file: messages say which, the chain finds cycles. */
  inside<T>(name: string, fn: () => T): T {
    const outer = this.file;
    this.chain.push(name);
    this.file = name;
    try {
      return fn();
    } finally {
      this.file = outer;
      this.chain.pop();
    }
  }

  /** `<import file="x"/>`: the program of models/x.xml, compiled here as a node, on its own letters. */
  importNode(el: XmlElement, ctx: Ctx): Node3 {
    const name = el.attrs.file;
    if (name !== undefined && this.chain.includes(name)) this.fail(el, `ciclo di inclusione: ${[...this.chain, name].join(' → ')}`);
    if (this.chain.length - this.top >= MJX_INCLUDE_DEPTH) this.fail(el, `troppe inclusioni una dentro l'altra (al più ${MJX_INCLUDE_DEPTH})`);
    if (++this.imports > MJX_INCLUDE_COUNT) this.fail(el, `troppe inclusioni (al più ${MJX_INCLUDE_COUNT} per programma)`);
    const root = this.importRoot(el, name);
    if (!ROOT_NODES.has(root.name)) this.fail(el, `models/${name}.xml: <${root.name}> non può essere la radice di un programma`);
    const sym = this.symmetry(el, ctx);
    return this.inside(name!, () => {
      for (const a of ['origin', 'ground', 'soil', 'suolo'])
        if (root.attrs[a] !== undefined) this.warnings.push(`${this.where(root)}: ${a} vale solo quando il programma si apre da sé, non incluso`);
      const values = this.values(root, root.attrs.values);
      return this.node(root, { bg: values[0], sym, values: new Set(values), folder: root.attrs.folder, scopes: [...(ctx.scopes ?? []), root] }) ?? this.fail(root, 'nessun nodo da eseguire');
    });
  }

  /** The text of a rule file named by `file`: in, a line "->", out. */
  rulePair(r: XmlElement, folder?: string): [string, string] {
    const name = inFolder(folder, r.attrs.file);
    const parts = this.fileText(r, name, 'txt', 'file').split(/^[ \t]*->[ \t]*\r?$/m);
    if (parts.length !== 2) this.fail(r, `models/${name}.txt: in e out vanno separati da una riga con "->" e nient'altro`);
    return [patternText(parts[0]), patternText(parts[1])];
  }

  /**
   * One side of a rule (T333): the attribute as it is, the text of a child `<in>`/`<out>`, or a file (`fin`/`fout`, both in `file`), in
   * the folder of the grid the rule writes (T335). Two ways for the same side is an error.
   */
  side(r: XmlElement, which: 'in' | 'out', folder?: string): string | undefined {
    if (r.attrs.legend !== undefined && !this.legendSaid && ['fin', 'fout', 'file'].some((a) => r.attrs[a] !== undefined)) {
      this.legendSaid = true;
      this.warnings.push(`${this.where(r)}: legend vale per le immagini dell'originale; un file di testo ha già le sue lettere (ignorato)`);
    }
    const own = which === 'in' ? 'fin' : 'fout';
    const kids = r.children.filter((c) => c.name === which);
    const ways = [
      ...(r.attrs[which] !== undefined ? [`l'attributo ${which}`] : []),
      ...(kids.length ? [`il figlio <${which}>`] : []),
      ...(r.attrs[own] !== undefined ? [own] : []),
      ...(r.attrs.file !== undefined ? ['file'] : []),
    ];
    if (ways.length > 1) this.fail(r, `"${which}" è scritto in due modi (${ways.join(' e ')}): se ne usa uno solo`);
    if (kids.length > 1) this.fail(kids[1], `un solo <${which}> per regola`);
    if (kids.length) {
      const k = kids[0];
      if (k.children.length || Object.keys(k.attrs).length) this.fail(k, `<${which}> contiene solo il pattern, come testo`);
      return patternText(k.text ?? '');
    }
    if (r.attrs[own] !== undefined) return patternText(this.fileText(r, inFolder(folder, r.attrs[own]), 'txt', own));
    if (r.attrs.file !== undefined) return this.rulePair(r, folder)[which === 'in' ? 0 : 1];
    return r.attrs[which];
  }

  /** Whether a rule node has a rule of its own (on the node, not in `<rule>` children). */
  ownRule(el: XmlElement): boolean {
    return ['in', 'out', 'fin', 'fout', 'file'].some((a) => el.attrs[a] !== undefined) || el.children.some((c) => c.name === 'in' || c.name === 'out');
  }

  /** The symbols of a grid, in the engine's characters: letters, or `#` and a number (T342); the first is the empty cell. */
  values(el: XmlElement, s: string | undefined): string {
    if (!s) this.fail(el, 'manca "values" (i simboli della griglia; il primo è la cella vuota)');
    const seen = new Set<string>();
    let out = '';
    for (const t of symbolTokens(s)) {
      if (t.error) this.fail(el, `values: ${t.error}`);
      const ch = t.code;
      if (ch === undefined) {
        if (/\s|,/.test(t.text)) this.mend(el, 'values è una parola di simboli, senza spazi né virgole');
        else this.fail(el, `"${t.text}" non può essere un valore (solo lettere, o # e un numero: #12)`);
        continue;
      }
      if (seen.has(ch)) {
        this.mend(el, `il simbolo "${t.text}" è ripetuto in values`);
        continue;
      }
      seen.add(ch);
      this.declared.add(ch);
      out += ch;
    }
    if (this.declared.size > MAX_SYMBOLS + 1) this.fail(el, `troppi simboli: ${this.declared.size - 1} oltre la cella vuota, il motore ne regge al più ${MAX_SYMBOLS} in un programma`);
    return out;
  }

  symmetry(el: XmlElement, ctx: Ctx): Sym {
    const s = el.attrs.symmetry;
    if (s === undefined) return ctx.sym;
    const sym = SYMMETRY[s.replace(/\s+/g, '')];
    if (!sym) this.fail(el, `simmetria "${s}" sconosciuta (in 3D: ${Object.keys(SYMMETRY).join(' ')})`);
    return sym;
  }

  /** A pattern or a set of symbols as written, in the engine's terms: every symbol one character, the empty one '.', every one checked. */
  letters(el: XmlElement, s: string, ctx: Ctx, what: string): string {
    let out = '';
    for (const ch of this.syms(el, s, what)) {
      if (ch === ctx.bg) out += '.';
      else if (this.conflicted.has(ch)) out += this.scopedUnion(ch, ctx);
      else if ('*/ []'.includes(ch) || ch === '.') out += ch;
      else if (ctx.values.has(ch) || ch in this.unions) out += ch;
      else if (!this.strict && isSymbolCode(ch)) {
        this.mend(el, `${what}: il simbolo "${symbolName(ch)}" non era tra i values della griglia, aggiunto`);
        ctx.values.add(ch);
        this.declared.add(ch);
        out += ch;
      } else this.fail(el, `${what}: il simbolo "${symbolName(ch)}" non è tra i values della griglia ("${showSymbols([...ctx.values].join(''))}")`);
    }
    return out;
  }

  /** MarkovJunior writes the top layer first; the engine wants the bottom first. */
  pattern(el: XmlElement, s: string | undefined, ctx: Ctx, what: string): string {
    if (typeof s !== 'string' || !s.trim()) this.fail(el, `manca "${what}"`);
    return this.letters(el, s.trim().split(/\s+/).reverse().join(' '), ctx, what);
  }

  one(el: XmlElement, s: string | undefined, ctx: Ctx, what: string): string {
    if (typeof s !== 'string' || this.syms(el, s, what).length !== 1) this.fail(el, `"${what}" è un solo simbolo (una lettera o # e un numero)`);
    return this.letters(el, s, ctx, what);
  }

  steps(el: XmlElement): number {
    const n = Number(el.attrs.steps);
    return Number.isInteger(n) && n > 0 ? n : Infinity;
  }

  num(el: XmlElement, s: string | undefined, what: string): number | undefined {
    if (s === undefined) return undefined;
    const n = Number(s);
    if (!Number.isFinite(n)) this.fail(el, `"${what}" vuole un numero`);
    return n;
  }

  vec(el: XmlElement, s: string | undefined, what: string): Vec3 {
    const v = (s ?? '').trim().split(/[\s,]+/).map(Number);
    if (v.length !== 3 || v.some((n) => !Number.isFinite(n))) this.fail(el, `"${what}" vuole tre numeri separati da spazi`);
    return v as Vec3;
  }

  /** The private symbol of a union in the grids in scope, the innermost first (else the first grid that writes it). */
  scopedUnion(ch: string, ctx: Ctx): string {
    for (let i = (ctx.scopes?.length ?? 0) - 1; i >= 0; i--) {
      const own = this.scopedUnions.get(ctx.scopes![i])?.get(ch);
      if (own) return own;
    }
    const first = this.unionDefs.find((d) => d.sym === ch)!;
    return this.scopedUnions.get(first.scope)!.get(ch)!;
  }

  /**
   * After the first pass: a symbol whose unions mean other letters in other grids (ModernHouse writes "." three times) gets a private
   * symbol in each grid (T335); one with one meaning stays in the program-wide table, as before.
   */
  resolveUnions(): void {
    const bySym = new Map<string, Array<{ values: string; scope: XmlElement }>>();
    for (const d of this.unionDefs) {
      const list = bySym.get(d.sym) ?? [];
      list.push(d);
      bySym.set(d.sym, list);
    }
    let next = PRIVATE_UNION;
    for (const [sym, defs] of bySym) {
      if (sym !== '.' && defs.every((d) => d.values === defs[0].values)) continue;
      this.conflicted.add(sym);
      delete this.unions[sym];
      for (const d of defs) {
        const mine = this.scopedUnions.get(d.scope) ?? new Map<string, string>();
        this.scopedUnions.set(d.scope, mine);
        if (mine.has(sym)) {
          if (defs.some((e) => e.scope === d.scope && e.values !== d.values)) throw new Mj3Error(`riga ${d.scope.line}: l'unione "${symbolName(sym)}" è scritta due volte nella stessa griglia, con simboli diversi`);
          continue;
        }
        // The grid's empty symbol, as `values` will read it (a values that does not read fails there, with its line).
        const bg = symbolTokens((d.scope.attrs.values ?? '').replace(/\s+/g, ''))[0]?.code;
        if (next >= PRIVATE_UNION_END) throw new Mj3Error(`riga ${d.scope.line}: troppe unioni con più sensi (al più ${PRIVATE_UNION_END - PRIVATE_UNION})`);
        const priv = String.fromCharCode(next++);
        mine.set(sym, priv);
        this.privateUnions[priv] = [...d.values].map((ch) => (ch === bg ? '.' : ch)).join('');
      }
    }
  }

  /** First pass: unions and colours, wherever they are (MarkovJunior lets a union appear anywhere), each union with its grid. */
  collect(el: XmlElement, scope: XmlElement = el): void {
    if (el.name === 'import') {
      // An imported file's colours and unions come with it; the program's own win (they are written over them, or kept).
      const name = el.attrs.file;
      if (name === undefined || this.collected.has(name) || this.chain.includes(name) || this.chain.length - this.top >= MJX_INCLUDE_DEPTH) return;
      this.collected.add(name);
      const root = this.importRoot(el, name);
      this.read -= this.files[`${name}.xml`]?.length ?? 0;
      const own = { colors: this.colors, unions: this.unions, sound: this.sound };
      this.colors = {};
      this.unions = {};
      try {
        this.inside(name, () => this.collect(root));
      } finally {
        this.colors = { ...this.colors, ...own.colors };
        this.unions = { ...this.unions, ...own.unions };
        this.sound = own.sound;
      }
      return;
    }
    if (el.name === 'union') {
      // A symbol (`?`, `#12`, a letter), or a sign of one character: not a mark of a pattern, not "#" (it starts a numbered symbol).
      const sym = this.syms(el, el.attrs.symbol ?? '', 'symbol');
      if (sym.length !== 1 || '*/ []'.includes(sym)) this.fail(el, '"symbol" è un solo simbolo o un segno (?, !, ~…), non uno di * / [ ] né uno spazio');
      if (!el.attrs.values) this.fail(el, 'manca "values"');
      const values = this.syms(el, el.attrs.values, 'values');
      this.unions[sym] = values;
      if (!this.file) this.unionDefs.push({ sym, values, scope });
    } else if (el.name === 'color') {
      const sym = this.sign(el, el.attrs.symbol, 'symbol');
      const value = el.attrs.value?.replace(/^#/, '');
      if (value !== undefined && !/^[0-9a-fA-F]{6}$/.test(value)) this.fail(el, `"value" è un colore esadecimale (rrggbb), non "${el.attrs.value}"`);
      // A part of the contract 0.2 (`gamba`) reads internal (T307b): the Sculptor still writes it in Italian until its prompt changes (T310).
      let part: string | undefined = el.attrs.part === undefined ? undefined : internalName('parti', el.attrs.part);
      if (part !== undefined && !(PARTS as readonly string[]).includes(part)) {
        this.mend(el, `part "${part}" sconosciuta (${PARTS.join(', ')}): tolta`);
        part = undefined;
      }
      let alpha: number | undefined;
      const alphaAttr = el.attrs.alpha ?? el.attrs.opacity;
      if (alphaAttr !== undefined) {
        const parsed = parseFloat(alphaAttr);
        if (Number.isFinite(parsed)) alpha = Math.max(0.05, Math.min(1.0, parsed));
      } else if (/^true$/i.test(el.attrs.glass ?? '') || /^true$/i.test(el.attrs.translucent ?? '')) {
        alpha = 0.5;
      }

      this.colors[sym] = {
        ...(value ? { color: `#${value.toLowerCase()}` } : {}),
        ...(el.attrs.name || el.attrs.comment ? { name: el.attrs.name ?? el.attrs.comment } : {}),
        ...(part ? { part: part as Part } : {}),
        ...(/^true$/i.test(el.attrs.hidden ?? '') ? { hidden: true } : {}),
        ...(/^true$/i.test(el.attrs.glow ?? '') ? { glow: true } : {}),
        ...(alpha !== undefined ? { alpha } : {}),
      };
    } else if (el.name === 'sound') {
      if (this.file) {
        this.warnings.push(`${this.where(el)}: il <sound> di un programma incluso resta suo, qui non entra`);
        return;
      }
      if (this.sound) this.fail(el, 'un solo <sound> per programma');
      this.sound = soundSettings(el);
      return;
    }
    const inner = GRID_TAGS.has(el.name) ? el : scope;
    for (const c of el.children) this.collect(c, inner);
  }

  /** Animations and actions wait for the end: they run on the finished model, in its last grid's letters. */
  pending: XmlElement[] = [];
  /** The grid the program ends in (the root's, or the last map's). */
  final?: Ctx;

  /** The nodes among an element's children (unions, colours, animations and actions are not nodes). */
  children(el: XmlElement, ctx: Ctx): Node3[] {
    return el.children.flatMap((c) => {
      if (c.name === 'animation' || c.name === 'action') {
        if (this.file) this.warnings.push(`${this.where(c)}: <${c.name}> di un programma incluso resta suo, qui non entra`);
        else this.pending.push(c);
        return [];
      }
      const n = this.node(c, ctx);
      return n ? [n] : [];
    });
  }

  clip(el: XmlElement, ctx: Ctx): void {
    const name = el.attrs.name;
    if (!name) this.fail(el, 'manca "name"');
    const sym = this.symmetry(el, ctx);
    const kids = this.children(el, { ...ctx, sym });
    if (!kids.length) this.fail(el, 'nessun nodo dentro');
    const frames = el.name === 'animation' ? Math.max(2, Math.min(32, Number(el.attrs.frames) || 8)) : 1;
    const clip: MjxClip = { name, ...(el.attrs.label ? { label: el.attrs.label } : {}), frames, program: { palette: {}, program: kids.length === 1 ? kids[0] : { type: 'sequence', children: kids } } };
    (el.name === 'animation' ? this.animations : this.actions).push(clip);
  }

  rules(el: XmlElement, ctx: Ctx, sym: Sym): Rule3[] {
    const out: Rule3[] = [];
    const add = (r: XmlElement, own: boolean) => {
      if (r.attrs.d === '2') return;
      const input = this.side(r, 'in', ctx.folder);
      const output = this.side(r, 'out', ctx.folder);
      const rs = own ? sym : this.symmetry(r, { ...ctx, sym });
      const p = this.num(r, r.attrs.p, 'p');
      const rule: Rule3 = { in: this.pattern(r, input, ctx, 'in'), out: this.pattern(r, output, ctx, 'out'), ...(p !== undefined ? { p } : {}) };
      const shape = (s: string) => s.split(' ').map((layer) => layer.split('/').map((row) => (row.match(/\[[^\]]*\]|./g) ?? []).length).join('×')).join(' | ');
      if (!this.strict && shape(rule.in) !== shape(rule.out) || !regular(rule.in) || !regular(rule.out)) {
        const [a, b] = pad(rule.in, rule.out);
        if (!this.strict && (a !== rule.in || b !== rule.out)) {
          this.mend(r, `pattern irregolari completati con "*": in "${input}", out "${output}"`);
          rule.in = a;
          rule.out = b;
        }
      }
      if (shape(rule.in) !== shape(rule.out))
        this.fail(r, `in e out devono avere la stessa forma (strati separati da spazi, righe da "/"): in ${shape(rule.in)}, out ${shape(rule.out)}`);
      if (rs !== sym) rule.symmetry = rs;
      out.push(rule);
    };
    if (this.ownRule(el)) add(el, true);
    for (const c of el.children) {
      if (c.name === 'rule') add(c, false);
      else if (c.name === 'in' || c.name === 'out' || INFERENCE_TAGS.has(c.name)) continue;
      else if (c.name !== 'union' && c.name !== 'color' && c.name !== 'sound') this.fail(c, `dentro <${el.name}> vanno solo <rule>, <in> e <out>`);
    }
    if (!out.length) this.fail(el, 'nessuna regola (in e out sul nodo, come attributi o figli <in> e <out>, o figli <rule>)');
    return out;
  }

  node(el: XmlElement, ctx: Ctx): Node3 | null {
    if (el.name === 'union' || el.name === 'color' || el.name === 'sound') return null;
    // A node meant only for 2D grids (MarkovJunior's d="2").
    if (el.attrs.d === '2') return null;
    const sym = this.symmetry(el, ctx);
    if (RULE_NODES.has(el.name)) {
      return {
        type: el.name as 'one' | 'all' | 'prl',
        rules: this.rules(el, ctx, sym),
        steps: this.steps(el),
        symmetry: sym,
        ...(/^true$/i.test(el.attrs.optional ?? '') ? { optional: true } : {}),
        ...this.inference(el, ctx),
      };
    }
    if (INFERENCE_TAGS.has(el.name)) this.fail(el, 'va dentro one, all o prl');
    if (el.name === 'sequence' || el.name === 'markov') {
      const children = this.children(el, { ...ctx, sym });
      if (!children.length) this.fail(el, 'nessun nodo dentro');
      return { type: el.name, children };
    }
    if (el.name === 'convolution') return this.convolution(el, ctx);
    if (el.name === 'path') {
      if (el.attrs.edges || el.attrs.vertices) this.warnings.push(`riga ${el.line}: path con edges/vertices: qui si muove solo per facce`);
      return {
        type: 'path',
        from: this.letters(el, el.attrs.from ?? this.fail(el, 'manca "from"'), ctx, 'from'),
        to: this.letters(el, el.attrs.to ?? this.fail(el, 'manca "to"'), ctx, 'to'),
        on: this.letters(el, el.attrs.on ?? this.fail(el, 'manca "on"'), ctx, 'on'),
        color: this.one(el, el.attrs.color, ctx, 'color'),
        steps: this.steps(el),
        ...(/^true$/i.test(el.attrs.inertia ?? '') ? { inertia: true } : {}),
        ...(/^true$/i.test(el.attrs.longest ?? '') ? { longest: true } : {}),
      };
    }
    if (el.name === 'map') return this.map(el, ctx, sym);
    if (el.name === 'wfc') return this.wfc(el, ctx, sym);
    if (el.name === 'convchain') return this.convchain(el, ctx, sym);
    if (el.name === 'import') return this.importNode(el, ctx);
    if (el.name === 'in' || el.name === 'out') this.fail(el, `<${el.name}> va dentro rule, one, all, prl o convolution`);
    if ((SHAPES as readonly string[]).includes(el.name)) return this.shape(el, ctx);
    if (el.name === 'rule') this.fail(el, '<rule> va dentro one, all, prl, convolution o map');
    this.fail(el, `nodo sconosciuto (noti: ${MJX_NODES.join(' ')} import union color sound animation action; in e out dentro le regole)`);
  }

  /** MarkovJunior's fields and observations of a rule node, and the attributes that go with them (RuleNode.Load). */
  inference(el: XmlElement, ctx: Ctx): Inference {
    const fields: FieldSpec[] = el.children
      .filter((c) => c.name === 'field')
      .map((f) => {
        const from = f.attrs.from;
        if (from === undefined && f.attrs.to === undefined) this.fail(f, 'vuole "to" (verso dove scende il potenziale) o "from" (da dove sale)');
        return {
          for: this.one(f, f.attrs.for, ctx, 'for'),
          ...(from !== undefined ? { from: this.letters(f, from, ctx, 'from') } : { to: this.letters(f, f.attrs.to!, ctx, 'to') }),
          on: this.letters(f, f.attrs.on ?? this.fail(f, 'manca "on" (le celle su cui si propaga)'), ctx, 'on'),
          ...(truthy(f.attrs.recompute) ? { recompute: true } : {}),
          ...(truthy(f.attrs.essential) ? { essential: true } : {}),
        };
      });
    const observe: ObserveSpec[] = el.children
      .filter((c) => c.name === 'observe')
      .map((o) => ({
        value: this.one(o, o.attrs.value, ctx, 'value'),
        ...(o.attrs.from !== undefined ? { from: this.one(o, o.attrs.from, ctx, 'from') } : {}),
        to: this.letters(o, o.attrs.to ?? this.fail(o, 'manca "to" (ciò che la cella deve diventare)'), ctx, 'to'),
      }));
    const temperature = this.num(el, el.attrs.temperature, 'temperature');
    if (temperature !== undefined && temperature < 0) this.fail(el, 'temperature vuole un numero da 0 in su');
    const out: Inference = {
      ...(fields.length ? { fields } : {}),
      ...(observe.length ? { observe } : {}),
      ...(temperature !== undefined ? { temperature } : {}),
    };
    if (truthy(el.attrs.search)) {
      if (!observe.length) this.warnings.push(`riga ${el.line}: search senza observe non cerca niente`);
      const limit = this.num(el, el.attrs.limit, 'limit');
      const depthCoefficient = this.num(el, el.attrs.depthCoefficient, 'depthCoefficient');
      Object.assign(out, { search: true, ...(limit !== undefined && limit > 0 ? { limit: Math.floor(limit) } : {}), ...(depthCoefficient !== undefined ? { depthCoefficient } : {}) });
    }
    if (temperature !== undefined && !fields.length && !observe.length) this.warnings.push(`riga ${el.line}: temperature senza field né observe non cambia niente`);
    return out;
  }

  convolution(el: XmlElement, ctx: Ctx): Node3 {
    const hood = (el.attrs.neighborhood ?? '').toLowerCase();
    const neighborhood = hood === 'vonneumann' ? 'vonneumann' : hood === 'nocorners' ? 'nocorners' : hood === 'moore' ? 'moore' : this.fail(el, 'neighborhood vuole VonNeumann (6 vicini), NoCorners (18) o Moore (26)');
    const xs = el.children.filter((c) => c.name === 'rule');
    const sources = xs.length ? xs : [el];
    const rules: ConvRule[] = sources.map((r) => {
      const input = this.one(r, this.side(r, 'in', ctx.folder), ctx, 'in');
      const output = this.one(r, this.side(r, 'out', ctx.folder), ctx, 'out');
      const p = this.num(r, r.attrs.p, 'p');
      // A rule may take values or sum from its node (models put them there), spaces between letters go.
      let values = r.attrs.values;
      let sum = r.attrs.sum;
      if (!this.strict && r !== el) {
        if (values === undefined && el.attrs.values !== undefined) (values = el.attrs.values), this.mend(r, 'values preso dal nodo convolution');
        if (sum === undefined && el.attrs.sum !== undefined) (sum = el.attrs.sum), this.mend(r, 'sum preso dal nodo convolution');
      }
      if (values !== undefined && /\s/.test(values) && !this.strict) values = values.replace(/\s+/g, '');
      if ((values === undefined) !== (sum === undefined)) this.fail(r, 'values e sum vanno insieme');
      let sums: number[];
      let neighbors = input;
      if (sum !== undefined) {
        neighbors = this.letters(r, values!, ctx, 'values');
        sums = sum.split(',').flatMap((part) => {
          const [a, b] = part.split('..').map((v) => Number(v.trim()));
          if (!Number.isInteger(a) || (b !== undefined && !Number.isInteger(b))) this.fail(r, `sum "${sum}" non valido (es. "5..8" o "1,3")`);
          return Array.from({ length: (b ?? a) - a + 1 }, (_, k) => a + k);
        });
      } else sums = Array.from({ length: 27 }, (_, k) => k);
      return { in: input, out: output, neighbors, sums, ...(p !== undefined ? { p } : {}) };
    });
    return { type: 'conv', rules, neighborhood, steps: this.steps(el), ...(/^true$/i.test(el.attrs.periodic ?? '') ? { periodic: true } : {}) };
  }

  map(el: XmlElement, ctx: Ctx, sym: Sym): Node3 {
    const scale = (el.attrs.scale ?? '').trim().split(/\s+/);
    if (scale.length !== 3 || scale.some((s) => !/^\d+(\/\d+)?$/.test(s))) this.fail(el, `scale vuole tre interi o frazioni (5/3) separati da spazi, non "${el.attrs.scale}"`);
    const [num, den] = [0, 1].map((k) => scale.map((s) => Number(s.split('/')[k] ?? 1)) as Vec3);
    if ([...num, ...den].some((v) => v < 1 || v > 32)) this.fail(el, 'i numeri di scale vanno da 1 a 32');
    const values = this.values(el, el.attrs.values);
    // Kept, the old letters are still in the grid.
    const clear = !/^false$/i.test(el.attrs.clear ?? '');
    const fraction = den.some((d) => d !== 1);
    if (fraction && !clear) this.fail(el, 'una scala frazionaria vale solo con la griglia nuova vuota (senza clear="False")');
    const inner: Ctx = { bg: values[0], sym, values: new Set(clear ? values : [...ctx.values, ...values]), folder: el.attrs.folder, scopes: [...(ctx.scopes ?? []), el] };
    const rules: Rule3[] = el.children
      .filter((c) => c.name === 'rule')
      .map((r) => {
        const p = this.num(r, r.attrs.p, 'p');
        // MarkovJunior reads both sides of a map's rule files from the new grid's folder.
        return { in: this.pattern(r, this.side(r, 'in', inner.folder), ctx, 'in'), out: this.pattern(r, this.side(r, 'out', inner.folder), inner, 'out'), ...(p !== undefined ? { p } : {}) };
      });
    const step: Node3 = { type: 'map', scale: num, ...(fraction ? { divide: den } : {}), rules, symmetry: sym, clear };
    this.final = inner;
    const rest = this.children({ ...el, children: el.children.filter((c) => c.name !== 'rule') }, inner);
    return rest.length ? { type: 'sequence', children: [step, ...rest] } : step;
  }

  /** An integer attribute between `min` and `max`, or undefined if it is not there. */
  int(el: XmlElement, name: string, min: number, max: number): number | undefined {
    const n = this.num(el, el.attrs[name], name);
    if (n === undefined) return undefined;
    if (!Number.isInteger(n) || n < min || n > max) this.fail(el, `"${name}" è un intero da ${min} a ${max}`);
    return n;
  }

  /** A pattern's text as cells, a symbol each (the engine's character): layers from the top (as written), rows from the back; every layer and row of one size. */
  block(el: XmlElement, text: string, what: string): string[][][] {
    const layers = patternText(text).split(/\s+/).filter(Boolean).map((l) => l.split('/').map((row) => [...this.syms(el, row, what)]));
    if (!layers.length) this.fail(el, `${what} è vuoto`);
    const dy = layers[0].length, dx = layers[0][0].length;
    if (!dx || layers.some((l) => l.length !== dy || l.some((r) => r.length !== dx))) this.fail(el, `${what}: ogni strato con le stesse righe, ogni riga con le stesse celle`);
    return layers;
  }

  /**
   * MarkovJunior's <wfc> (T335, ADR-0174): `tileset` (a file of models/ with its tiles) or `sample` (a flat text of letters). The rules
   * say which patterns a letter of the grid may become; the nodes inside run on the new grid, in the wfc's own `values`.
   */
  wfc(el: XmlElement, ctx: Ctx, sym: Sym): Node3 {
    const { tileset, sample } = el.attrs;
    if ((tileset === undefined) === (sample === undefined)) this.fail(el, 'vuole tileset="…" (a tessere: un file di models/) o sample="…" (a sovrapposizione: un campione di models/), uno dei due');
    const values = this.values(el, el.attrs.values);
    const inner: Ctx = { bg: values[0], sym, values: new Set(values), folder: el.attrs.folder, scopes: [...(ctx.scopes ?? []), el] };
    const letterOf = (k: number) => (k === 0 ? '.' : values[k]);
    const tries = this.int(el, 'tries', 1, WFC_LIMITS.tries);
    const shannon = truthy(el.attrs.shannon);
    const rules = el.children.filter((c) => c.name === 'rule');
    const map: Record<string, number[]> = {};
    const mapLetter = (r: XmlElement) => {
      const input = this.one(r, r.attrs.in, ctx, 'in');
      if (input in map) this.fail(r, `una sola regola per il simbolo "${r.attrs.in}"`);
      if (!r.attrs.out) this.fail(r, 'manca "out" (le tessere, o le lettere, separate da "|")');
      return input;
    };
    let built: WfcModel;
    let node: Node3;
    try {
      if (tileset !== undefined) {
        const tiles = this.tileset(el, tileset, values);
        built = tiles.model;
        for (const r of rules) {
          const input = mapLetter(r);
          map[input] = [
            ...new Set(
              r.attrs.out.split('|').flatMap((name) => tiles.model.positions.get(name.trim()) ?? this.fail(r, `tessera sconosciuta "${name}" (il tileset ha ${[...tiles.model.positions.keys()].join(', ')})`)),
            ),
          ].sort((a, b) => a - b);
        }
        const overlap: Vec3 = [this.int(el, 'overlap', -64, tiles.S - 1) ?? 0, 0, this.int(el, 'overlapz', -64, tiles.SZ - 1) ?? 0];
        overlap[1] = overlap[0];
        node = {
          type: 'wfc',
          model: 'tile',
          patterns: [],
          dims: [tiles.S, tiles.S, tiles.SZ],
          weights: built.weights,
          propagator: built.propagator,
          map,
          ...(overlap.some((v) => v !== 0) ? { overlap } : {}),
          ...(truthy(el.attrs.periodic) ? { periodic: true } : {}),
        };
      } else {
        const N = this.int(el, 'n', 1, 8) ?? 3;
        const text = this.fileText(el, sample, 'txt', 'sample');
        const layers = this.block(el, text, `models/${sample}.txt`);
        if (layers.length !== 1) this.fail(el, `models/${sample}.txt: il campione è piano, uno strato solo (come nell'originale)`);
        const rows = layers[0];
        const cells = Uint8Array.from(rows.flat(), (ch) => {
          const k = values.indexOf(ch);
          if (k < 0) this.fail(el, `models/${sample}.txt: il simbolo "${symbolName(ch)}" non è tra i values del nodo ("${showSymbols(values)}")`);
          return k;
        });
        if (cells.length > WFC_LIMITS.sampleCells) this.fail(el, `il campione è troppo grande (al più ${WFC_LIMITS.sampleCells} celle)`);
        built = overlapModel(cells, rows[0].length, rows.length, N, !/^false$/i.test(el.attrs.periodicInput ?? ''), squareSubgroup(sym));
        for (const r of rules) {
          const input = mapLetter(r);
          const outs = new Set(r.attrs.out.split('|').map((s) => {
            const ch = this.syms(r, s.trim(), 'out');
            const k = values.indexOf(ch);
            if (ch.length !== 1 || k < 0) this.fail(r, `"${s}" non è un simbolo dei values del nodo ("${showSymbols(values)}")`);
            return k;
          }));
          map[input] = built.patterns.flatMap((p, t) => (outs.has(p[0]) ? [t] : []));
        }
        node = { type: 'wfc', model: 'overlap', patterns: [], dims: [N, N, 1], weights: built.weights, propagator: built.propagator, map };
      }
    } catch (e) {
      if (e instanceof WfcError) this.fail(el, e.message);
      throw e;
    }
    node.patterns = built.patterns.map((p) => Array.from(p, letterOf).join(''));
    if (shannon) node.shannon = true;
    if (tries !== undefined) node.tries = tries;
    this.final = inner;
    // Its nodes run on the new grid, so only if there is one: a wave without a solution leaves them out (MarkovJunior's WFCNode).
    const rest = this.children({ ...el, children: el.children.filter((c) => c.name !== 'rule') }, inner);
    return rest.length ? { type: 'sequence', children: [node, ...rest], gated: true } : node;
  }

  /**
   * A tileset of models/ (T335): `<tileset values fullSymmetry>`, its tiles (the text of a `<tile>`, or `file`, or `<tiles>-<name>`),
   * its neighbours. The tileset's `values` are its letters in order: the k-th becomes the k-th of the node's, as MarkovJunior lays the
   * colours of its tiles on the node's values; without them its letters are the node's.
   */
  tileset(el: XmlElement, name: string, values: string): { model: ReturnType<typeof tileModel>; S: number; SZ: number } {
    const text = this.fileText(el, name, 'xml', 'tileset');
    let roots: XmlElement[];
    try {
      roots = parseXml(text);
    } catch (e) {
      if (e instanceof XmlError) this.fail(el, `models/${name}.xml: XML: ${e.message}`);
      throw e;
    }
    const tilesFolder = el.attrs.tiles ?? name;
    return this.inside(name, () => {
      const root = roots.find((r) => r.name === 'tileset') ?? this.fail(el, `models/${name}.xml non è un tileset (la sua radice è <tileset>)`);
      const own = root.attrs.values === undefined ? undefined : this.syms(root, root.attrs.values.replace(/\s+/g, ''), 'values');
      if (own !== undefined && new Set(own).size !== own.length) this.fail(root, 'un simbolo è ripetuto nei values del tileset');
      const ordinal = (t: XmlElement, ch: string) => {
        const k = own !== undefined ? own.indexOf(ch) : values.indexOf(ch);
        if (k < 0) this.fail(t, `il simbolo "${symbolName(ch)}" non è tra i values ${own !== undefined ? `del tileset ("${showSymbols(own)}")` : `del nodo ("${showSymbols(values)}")`}`);
        if (k >= values.length) this.fail(t, `il simbolo "${symbolName(ch)}" è il ${k + 1}º del tileset, e il nodo ha solo ${values.length} values`);
        return k;
      };
      const full = truthy(root.attrs.fullSymmetry);
      const list = root.children.filter((c) => c.name === 'tiles').flatMap((c) => c.children.filter((t) => t.name === 'tile'));
      if (!list.length) this.fail(root, 'nessuna <tile> dentro <tiles>');
      let dims: Vec3 | undefined;
      const tiles: TileSource[] = list.map((t) => {
        const tname = t.attrs.name;
        if (!tname || /\s|\|/.test(tname)) this.fail(t, 'ogni tessera ha un nome, senza spazi né "|"');
        const weight = this.num(t, t.attrs.weight, 'weight') ?? 1;
        if (!(weight > 0)) this.fail(t, 'weight è un numero positivo');
        const own = t.text?.trim() ? t.text : t.attrs.file !== undefined ? this.fileText(t, t.attrs.file, 'txt', 'file') : this.fileText(t, `${tilesFolder}-${tname}`, 'txt', `la tessera ${tname}`);
        const layers = this.block(t, own, `la tessera ${tname}`);
        const d: Vec3 = [layers[0][0].length, layers[0].length, layers.length];
        if (d[0] !== d[1]) this.fail(t, `la tessera ${tname} è ${d.join('×')}: le tessere sono quadrate (larghe quanto profonde)`);
        if (dims && dims.join() !== d.join()) this.fail(t, `la tessera ${tname} è ${d.join('×')}, le altre ${dims.join('×')}`);
        dims = d;
        const [S, , SZ] = d;
        const cells = new Uint8Array(S * S * SZ);
        // The text goes from the top layer, the cells from the bottom one (as a rule's pattern).
        for (let z = 0; z < SZ; z++) for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) cells[x + y * S + z * S * S] = ordinal(t, layers[SZ - 1 - z][y][x]);
        return { name: tname, weight, cells };
      });
      const neighbors: NeighborSource[] = root.children
        .filter((c) => c.name === 'neighbors')
        .flatMap((c) => c.children.filter((n) => n.name === 'neighbor'))
        .map((n) => ({ ...(n.attrs.left !== undefined ? { left: n.attrs.left } : {}), ...(n.attrs.right !== undefined ? { right: n.attrs.right } : {}), ...(n.attrs.top !== undefined ? { top: n.attrs.top } : {}), ...(n.attrs.bottom !== undefined ? { bottom: n.attrs.bottom } : {}) }));
      try {
        return { model: tileModel(tiles, dims![0], dims![2], full, neighbors), S: dims![0], SZ: dims![2] };
      } catch (e) {
        if (e instanceof WfcError) this.fail(root, e.message);
        throw e;
      }
    });
  }

  /**
   * MarkovJunior's <convchain> (T335): a flat sample of models/ in the node's two letters, `black` and `white`; the `on` cells of the
   * grid become one or the other and then change as the sample's windows say.
   */
  convchain(el: XmlElement, ctx: Ctx, sym: Sym): Node3 {
    const name = el.attrs.sample;
    if (name === undefined) this.fail(el, 'manca "sample" (un campione piano di models/, nei simboli black e white)');
    const black = this.one(el, el.attrs.black, ctx, 'black');
    const white = this.one(el, el.attrs.white, ctx, 'white');
    if (black === white) this.fail(el, 'black e white sono due simboli diversi');
    // The sample is written in the symbols themselves, not in the grid's '.' for the empty one.
    const [b, w] = [this.sign(el, el.attrs.black, 'black'), this.sign(el, el.attrs.white, 'white')];
    const layers = this.block(el, this.fileText(el, name, 'txt', 'sample'), `models/${name}.txt`);
    if (layers.length !== 1) this.fail(el, `models/${name}.txt: il campione è piano, uno strato solo (come nell'originale)`);
    const rows = layers[0];
    const sample = rows.flat().map((ch) => (ch === w ? '1' : ch === b ? '0' : this.fail(el, `models/${name}.txt: il simbolo "${symbolName(ch)}" non è né black ("${el.attrs.black}") né white ("${el.attrs.white}")`))).join('');
    if (sample.length > WFC_LIMITS.sampleCells) this.fail(el, `il campione è troppo grande (al più ${WFC_LIMITS.sampleCells} celle)`);
    const temperature = this.num(el, el.attrs.temperature, 'temperature');
    if (temperature !== undefined && !(temperature > 0)) this.fail(el, 'temperature è un numero positivo');
    return {
      type: 'convchain',
      sample,
      sampleSize: [rows[0].length, rows.length],
      n: this.int(el, 'n', 1, WFC_LIMITS.convchainN) ?? 3,
      ...(temperature !== undefined ? { temperature } : {}),
      on: this.one(el, el.attrs.on, ctx, 'on'),
      black,
      white,
      steps: this.steps(el),
      symmetry: sym,
    };
  }

  shape(el: XmlElement, ctx: Ctx): Node3 {
    const color = this.one(el, el.attrs.color, ctx, 'color');
    const on = el.attrs.on !== undefined ? this.letters(el, el.attrs.on, ctx, 'on') : undefined;
    const at = this.vec(el, el.attrs.at, 'at');
    const shape = el.name as ShapeKind;
    if (shape === 'line') {
      const r = this.num(el, el.attrs.r, 'r');
      return { type: 'shape', shape, at, to: this.vec(el, el.attrs.to, 'to'), color, ...(r !== undefined ? { r } : {}), ...(on ? { on } : {}) };
    }
    return { type: 'shape', shape, at, size: this.shapeSize(el), color, ...(on ? { on } : {}) };
  }

  /** `size`, or what models write instead when the meaning is clear: radii (rx ry rz, r) and a height (h). */
  shapeSize(el: XmlElement): Vec3 {
    const a = el.attrs;
    if (a.size !== undefined && !this.strict) {
      const v = a.size.trim().split(/[\s,]+/).map(Number);
      if (v.length === 1 && Number.isFinite(v[0])) {
        this.mend(el, `size con un solo numero: un cubo di ${v[0]}`);
        return [v[0], v[0], v[0]];
      }
    }
    if (a.size !== undefined || this.strict) return this.vec(el, a.size, 'size');
    const n = (k: string) => (a[k] !== undefined ? this.num(el, a[k], k) : undefined);
    const rx = n('rx') ?? n('r') ?? n('radius'), ry = n('ry') ?? n('r') ?? n('radius'), rz = n('rz');
    const h = n('h') ?? n('height');
    const w = n('w') ?? n('width'), d = n('d') ?? n('depth');
    const x = w ?? (rx !== undefined ? 2 * rx : undefined);
    const y = d ?? (ry !== undefined ? 2 * ry : x);
    const z = h ?? (rz !== undefined ? 2 * rz : undefined);
    if (x === undefined || y === undefined || z === undefined) this.fail(el, '"size" vuole tre numeri separati da spazi: larghezza, profondità, altezza');
    this.mend(el, `size ricavata dagli altri attributi: ${x} ${y} ${z}`);
    return [x, y, z];
  }
}

const CLIP_TAGS = new Set(['animation', 'action']);

const cellsOf = (row: string) => row.match(/\[[^\]]*\]|./g) ?? [];
const grid = (s: string) => s.split(' ').map((layer) => layer.split('/').map(cellsOf));
/** Every layer with the same rows, every row with the same cells. */
const regular = (s: string) => {
  const g = grid(s);
  return g.every((l) => l.length === g[0].length && l.every((r) => r.length === g[0][0].length));
};
/**
 * Two patterns (engine order, bottom layer first) brought to one box, missing cells written "*": the
 * bottom layers, back rows and left cells are kept where they are (models drop what they think obvious).
 */
function pad(a: string, b: string): [string, string] {
  const ga = grid(a), gb = grid(b);
  const dz = Math.max(ga.length, gb.length);
  const dy = Math.max(...[...ga, ...gb].map((l) => l.length));
  const dx = Math.max(...[...ga, ...gb].flatMap((l) => l.map((r) => r.length)));
  const fit = (g: string[][][], out: boolean) =>
    Array.from({ length: dz }, (_, k) => Array.from({ length: dy }, (_, j) => Array.from({ length: dx }, (_, i) => {
      const c = g[k]?.[j]?.[i] ?? '*';
      return out && c.startsWith('[') ? '*' : c;
    }).join('')).join('/')).join(' ');
  return [fit(ga, false), fit(gb, true)];
}

const hasMap = (el: XmlElement): boolean => GRID_TAGS.has(el.name) || el.children.some(hasMap);

/**
 * What a program infers: `field` and `observe` in its rule nodes, its animations and its actions (T334); the world takes them within
 * its ceilings (`worldNodeErrors`, T336).
 */
export function inferenceIn(m: Pick<MjxModel, 'program'> & Partial<Pick<MjxModel, 'animations' | 'actions'>>): string[] {
  const found = new Set<string>();
  const visit = (n: Node3) => {
    if (n.type === 'sequence' || n.type === 'markov') n.children.forEach(visit);
    else if (n.type === 'one' || n.type === 'all' || n.type === 'prl') {
      if (n.fields?.length) found.add('field');
      if (n.observe?.length) found.add('observe');
    }
  };
  visit(m.program.program);
  for (const clip of [...(m.animations ?? []), ...(m.actions ?? [])]) visit(clip.program.program);
  return [...found];
}

/**
 * The nodes of T334-T335 a program uses: `field` and `observe`, `wfc` and `convchain`, in its nodes, its animations and its actions.
 * The world takes them within its ceilings (`WORLD_NODE_LIMITS`, T336, ADR-0176).
 */
export function newNodesIn(m: Pick<MjxModel, 'program'> & Partial<Pick<MjxModel, 'animations' | 'actions'>>): string[] {
  const found = new Set<string>(inferenceIn(m));
  const visit = (n: Node3) => {
    if (n.type === 'sequence' || n.type === 'markov') n.children.forEach(visit);
    else if (n.type === 'wfc' || n.type === 'convchain') found.add(n.type);
  };
  visit(m.program.program);
  for (const clip of [...(m.animations ?? []), ...(m.actions ?? [])]) visit(clip.program.program);
  return ['field', 'observe', 'wfc', 'convchain'].filter((n) => found.has(n));
}

/**
 * Compiles a program; `size` (the class's box) wins over the program's own, `base` says how many voxels of it are under the ground
 * (`soil` marks that layer); `files` are the files of models/ it may read (`mjxIncludes`), `self` its own name there. Throws Mj3Error with
 * the line.
 */
export function compileMjx(src: string, opts: { size?: Vec3; strict?: boolean; base?: number; files?: MjxFiles; self?: string } = {}): MjxModel {
  let roots: XmlElement[];
  try {
    roots = parseXml(src);
  } catch (e) {
    if (e instanceof XmlError) throw new Mj3Error(`XML: ${e.message}`);
    throw e;
  }
  const mains = roots.filter((r) => !CLIP_TAGS.has(r.name));
  if (!mains.length) throw new Mj3Error('nessun programma: il primo elemento è il nodo radice (sequence, markov, one…) con values');
  if (mains.length > 1) throw new Mj3Error(`un solo nodo radice (trovati: ${mains.map((m) => `<${m.name}>`).join(', ')}); animazioni e azioni possono stare accanto`);
  const root = mains[0];
  const c = new Compiler(opts.strict === true, opts.files, opts.self);
  for (const r of roots) c.collect(r, r);
  c.resolveUnions();
  const values = c.values(root, root.attrs.values);
  const ctx: Ctx = { bg: values[0], sym: 'all', values: new Set(values), folder: root.attrs.folder, scopes: [root] };
  // The root's symmetry is inherited by everything below, animations and actions included.
  const rootSym = c.symmetry(root, ctx);
  ctx.sym = rootSym;
  let program: Node3 | null;
  if (ROOT_NODES.has(root.name)) program = c.node(root, ctx);
  else throw new Mj3Error(`riga ${root.line}: <${root.name}> non può essere la radice`);
  const last = { ...(c.final ?? ctx), sym: rootSym };
  for (const r of [...c.pending, ...roots.filter((r) => CLIP_TAGS.has(r.name))]) c.clip(r, last);

  const size = opts.size ?? (root.attrs.size ? c.vec(root, root.attrs.size, 'size') : undefined);
  if (!size) throw new Mj3Error('manca la scatola: size="X Y Z" sulla radice');

  const palette: Record<string, PaletteEntry> = {};
  for (const ch of c.declared) {
    if (ch === values[0]) continue;
    const base = MJ_PALETTE[ch];
    const own = c.colors[ch];
    if (!base && !own?.color && !own?.hidden) throw new Mj3Error(`il simbolo "${symbolName(ch)}" non ha colore nella palette di MarkovJunior: dagliene uno con <color symbol="${symbolName(ch)}" value="rrggbb"/>`);
    palette[ch] = { name: own?.name ?? base?.name, ...(own?.color ?? base?.color ? { color: own?.color ?? base!.color } : {}), ...(own?.part ? { part: own.part } : {}), ...(own?.hidden ? { hidden: true } : {}), ...(own?.glow ? { glow: true } : {}), ...(typeof own?.alpha === 'number' ? { alpha: own.alpha } : {}) };
  }
  for (const ch of Object.keys(c.colors)) if (!c.declared.has(ch)) c.warnings.push(`<color symbol="${symbolName(ch)}">: il simbolo non è in nessun values`);
  const unions: Record<string, string> = {};
  for (const [k, v] of Object.entries(c.unions)) unions[k] = [...v].map((ch) => (ch === values[0] ? '.' : ch)).join('');
  Object.assign(unions, c.privateUnions);
  for (const clip of [...c.animations, ...c.actions]) clip.program = { ...clip.program, palette, unions };

  const origin = root.attrs.origin;
  const ground = root.attrs.ground;
  // `soil` since the contract 0.4 (T308a); `suolo`, as the Sculptor still writes it until its prompts change (T310), is the same.
  const soil = root.attrs.soil ?? root.attrs.suolo;
  // `base` counts voxels of the finished model: on the coarse grid of a `map` it would be another height.
  if (soil && hasMap(root)) c.fail(root, 'suolo non vale con map: il suolo si conta in voxel del modello finito');
  return {
    name: root.attrs.name,
    ...(c.sound ? { sound: c.sound } : {}),
    background: values[0],
    warnings: c.warnings,
    animations: c.animations,
    actions: c.actions,
    program: {
      ...(root.attrs.name ? { name: root.attrs.name } : {}),
      size,
      palette,
      ...(Object.keys(unions).length ? { unions } : {}),
      ...(origin && !/^false$/i.test(origin) ? { origin: values[1] ?? c.fail(root, 'origin vuole almeno due values'), originAt: /^bottom$/i.test(origin) ? ('bottom' as const) : ('centre' as const) } : {}),
      ...(ground ? { ground: c.one(root, ground, ctx, 'ground') } : {}),
      ...(soil ? { soil: c.one(root, soil, ctx, 'soil'), soilAt: opts.base ?? 0 } : {}),
      program: program!,
    },
  };
}
