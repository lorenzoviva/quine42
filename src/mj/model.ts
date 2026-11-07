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
// Not supported (they need search or tiles): wfc, convchain, observe and field (inference).

import { internalName } from '../kernel/internalNames';
import { Mj3Error, PARTS, SHAPES, type ConvRule, type Node3, type PaletteEntry, type Part, type Program3, type Rule3, type ShapeKind, type Sym, type Vec3 } from './engine';
import { MJ_PALETTE } from './palette';
import { soundSettings, type SoundSettings } from './sound';
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
export const MJX_NODES: readonly string[] = ['one', 'all', 'prl', 'sequence', 'markov', 'convolution', 'path', 'map', ...SHAPES];
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
 * The text of a pattern written in a child or a file as the attribute's: lines starting with "#" are notes, a "/" with spaces or
 * lines around it joins two rows, the rest stays as it is (spaces and lines between layers).
 */
export function patternText(s: string): string {
  return s
    .split(/\r?\n/)
    .filter((l) => !/^\s*#/.test(l))
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
  if (!/\b(?:import|fin|fout|file)\b/.test(src)) return out;
  const queue = [src];
  while (queue.length) {
    let roots: XmlElement[];
    try {
      roots = parseXml(queue.shift()!);
    } catch {
      continue;
    }
    const visit = (el: XmlElement) => {
      const names: string[] = [];
      if (el.name === 'import') names.push(`${el.attrs.file}.xml`);
      else if (RULE_HOLDERS.has(el.name)) for (const a of ['fin', 'fout', 'file']) if (el.attrs[a] !== undefined) names.push(`${el.attrs[a]}.txt`);
      for (const f of names) {
        if (f in out || !MJX_FILE_RE.test(f.slice(0, -4))) continue;
        const text = read(f);
        if (typeof text !== 'string') continue;
        out[f] = text;
        if (f.endsWith('.xml')) queue.push(text);
      }
      el.children.forEach(visit);
    };
    roots.forEach(visit);
  }
  return out;
}
const UNSUPPORTED: Record<string, string> = {
  wfc: 'il WFC a tessere non serve più: il modello si genera intero',
  convchain: 'convchain non è supportato',
  observe: "l'inferenza (observe) non è supportata",
  field: "i campi di potenziale (field) non sono supportati",
};

interface Ctx {
  /** The empty letter of the grid in scope (it becomes the engine's air, '.'). */
  bg: string;
  sym: Sym;
  /** Letters the grid in scope may hold. */
  values: Set<string>;
}

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
      return this.node(root, { bg: values[0], sym, values: new Set(values) }) ?? this.fail(root, 'nessun nodo da eseguire');
    });
  }

  /** The text of a rule file named by `file`: in, a line "->", out. */
  rulePair(r: XmlElement): [string, string] {
    const parts = this.fileText(r, r.attrs.file, 'txt', 'file').split(/^[ \t]*->[ \t]*\r?$/m);
    if (parts.length !== 2) this.fail(r, `models/${r.attrs.file}.txt: in e out vanno separati da una riga con "->" e nient'altro`);
    return [patternText(parts[0]), patternText(parts[1])];
  }

  /**
   * One side of a rule (T333): the attribute as it is, the text of a child `<in>`/`<out>`, or a file (`fin`/`fout`, both in `file`).
   * Two ways for the same side is an error.
   */
  side(r: XmlElement, which: 'in' | 'out'): string | undefined {
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
    if (r.attrs[own] !== undefined) return patternText(this.fileText(r, r.attrs[own], 'txt', own));
    if (r.attrs.file !== undefined) return this.rulePair(r)[which === 'in' ? 0 : 1];
    return r.attrs[which];
  }

  /** Whether a rule node has a rule of its own (on the node, not in `<rule>` children). */
  ownRule(el: XmlElement): boolean {
    return ['in', 'out', 'fin', 'fout', 'file'].some((a) => el.attrs[a] !== undefined) || el.children.some((c) => c.name === 'in' || c.name === 'out');
  }

  values(el: XmlElement, s: string | undefined): string {
    if (!s) this.fail(el, 'manca "values" (le lettere della griglia; la prima è la cella vuota)');
    const seen = new Set<string>();
    let out = '';
    for (const ch of s) {
      if (seen.has(ch)) {
        this.mend(el, `la lettera "${ch}" è ripetuta in values`);
        continue;
      }
      if (!/^[A-Za-z0-9]$/.test(ch)) {
        if (/\s|,/.test(ch)) this.mend(el, 'values è una parola di lettere, senza spazi né virgole');
        else this.fail(el, `"${ch}" non può essere un valore (solo lettere e cifre)`);
        continue;
      }
      seen.add(ch);
      this.declared.add(ch);
      out += ch;
    }
    return out;
  }

  symmetry(el: XmlElement, ctx: Ctx): Sym {
    const s = el.attrs.symmetry;
    if (s === undefined) return ctx.sym;
    const sym = SYMMETRY[s.replace(/\s+/g, '')];
    if (!sym) this.fail(el, `simmetria "${s}" sconosciuta (in 3D: ${Object.keys(SYMMETRY).join(' ')})`);
    return sym;
  }

  /** A pattern or a set of letters, in the engine's terms: the empty letter becomes '.', every letter checked. */
  letters(el: XmlElement, s: string, ctx: Ctx, what: string): string {
    let out = '';
    for (const ch of s) {
      if (ch === ctx.bg) out += '.';
      else if ('*/ []'.includes(ch) || ch === '.') out += ch;
      else if (ctx.values.has(ch) || ch in this.unions) out += ch;
      else if (!this.strict && /^[A-Za-z0-9]$/.test(ch)) {
        this.mend(el, `${what}: la lettera "${ch}" non era tra i values della griglia, aggiunta`);
        ctx.values.add(ch);
        this.declared.add(ch);
        out += ch;
      } else this.fail(el, `${what}: la lettera "${ch}" non è tra i values della griglia ("${[...ctx.values].join('')}")`);
    }
    return out;
  }

  /** MarkovJunior writes the top layer first; the engine wants the bottom first. */
  pattern(el: XmlElement, s: string | undefined, ctx: Ctx, what: string): string {
    if (typeof s !== 'string' || !s.trim()) this.fail(el, `manca "${what}"`);
    return this.letters(el, s.trim().split(/\s+/).reverse().join(' '), ctx, what);
  }

  one(el: XmlElement, s: string | undefined, ctx: Ctx, what: string): string {
    if (typeof s !== 'string' || s.length !== 1) this.fail(el, `"${what}" è una sola lettera`);
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

  /** First pass: unions and colours, wherever they are (MarkovJunior lets a union appear anywhere). */
  collect(el: XmlElement): void {
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
      const sym = el.attrs.symbol;
      if (!sym || sym.length !== 1 || '*/ []'.includes(sym)) this.fail(el, '"symbol" è un solo carattere');
      if (!el.attrs.values) this.fail(el, 'manca "values"');
      this.unions[sym] = el.attrs.values;
    } else if (el.name === 'color') {
      const sym = el.attrs.symbol;
      if (!sym || sym.length !== 1) this.fail(el, '"symbol" è una sola lettera');
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
    for (const c of el.children) this.collect(c);
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
      const input = this.side(r, 'in');
      const output = this.side(r, 'out');
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
      else if (c.name === 'in' || c.name === 'out') continue;
      else if (UNSUPPORTED[c.name]) this.fail(c, UNSUPPORTED[c.name]);
      else if (c.name !== 'union' && c.name !== 'color' && c.name !== 'sound') this.fail(c, `dentro <${el.name}> vanno solo <rule>, <in> e <out>`);
    }
    if (!out.length) this.fail(el, 'nessuna regola (in e out sul nodo, come attributi o figli <in> e <out>, o figli <rule>)');
    return out;
  }

  node(el: XmlElement, ctx: Ctx): Node3 | null {
    if (el.name === 'union' || el.name === 'color' || el.name === 'sound') return null;
    if (UNSUPPORTED[el.name]) this.fail(el, UNSUPPORTED[el.name]);
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
      };
    }
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
    if (el.name === 'import') return this.importNode(el, ctx);
    if (el.name === 'in' || el.name === 'out') this.fail(el, `<${el.name}> va dentro rule, one, all, prl o convolution`);
    if ((SHAPES as readonly string[]).includes(el.name)) return this.shape(el, ctx);
    if (el.name === 'rule') this.fail(el, '<rule> va dentro one, all, prl, convolution o map');
    this.fail(el, `nodo sconosciuto (noti: ${MJX_NODES.join(' ')} import union color sound animation action; in e out dentro le regole)`);
  }

  convolution(el: XmlElement, ctx: Ctx): Node3 {
    const hood = (el.attrs.neighborhood ?? '').toLowerCase();
    const neighborhood = hood === 'vonneumann' ? 'vonneumann' : hood === 'nocorners' ? 'nocorners' : hood === 'moore' ? 'moore' : this.fail(el, 'neighborhood vuole VonNeumann (6 vicini), NoCorners (18) o Moore (26)');
    const xs = el.children.filter((c) => c.name === 'rule');
    const sources = xs.length ? xs : [el];
    const rules: ConvRule[] = sources.map((r) => {
      const input = this.one(r, this.side(r, 'in'), ctx, 'in');
      const output = this.one(r, this.side(r, 'out'), ctx, 'out');
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
    if (scale.length !== 3 || scale.some((s) => !/^\d+$/.test(s))) this.fail(el, `scale vuole tre interi separati da spazi (le frazioni non sono supportate), non "${el.attrs.scale}"`);
    const values = this.values(el, el.attrs.values);
    // Kept, the old letters are still in the grid.
    const clear = !/^false$/i.test(el.attrs.clear ?? '');
    const inner: Ctx = { bg: values[0], sym, values: new Set(clear ? values : [...ctx.values, ...values]) };
    const rules: Rule3[] = el.children
      .filter((c) => c.name === 'rule')
      .map((r) => {
        const p = this.num(r, r.attrs.p, 'p');
        return { in: this.pattern(r, this.side(r, 'in'), ctx, 'in'), out: this.pattern(r, this.side(r, 'out'), inner, 'out'), ...(p !== undefined ? { p } : {}) };
      });
    const step: Node3 = { type: 'map', scale: scale.map(Number) as Vec3, rules, symmetry: sym, clear };
    this.final = inner;
    const rest = this.children({ ...el, children: el.children.filter((c) => c.name !== 'rule') }, inner);
    return rest.length ? { type: 'sequence', children: [step, ...rest] } : step;
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

const hasMap = (el: XmlElement): boolean => el.name === 'map' || el.children.some(hasMap);

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
  for (const r of roots) c.collect(r);
  const values = c.values(root, root.attrs.values);
  const ctx: Ctx = { bg: values[0], sym: 'all', values: new Set(values) };
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
    if (!base && !own?.color && !own?.hidden) throw new Mj3Error(`la lettera "${ch}" non ha colore nella palette di MarkovJunior: dagliene uno con <color symbol="${ch}" value="rrggbb"/>`);
    palette[ch] = { name: own?.name ?? base?.name, ...(own?.color ?? base?.color ? { color: own?.color ?? base!.color } : {}), ...(own?.part ? { part: own.part } : {}), ...(own?.hidden ? { hidden: true } : {}), ...(own?.glow ? { glow: true } : {}), ...(typeof own?.alpha === 'number' ? { alpha: own.alpha } : {}) };
  }
  for (const ch of Object.keys(c.colors)) if (!c.declared.has(ch)) c.warnings.push(`<color symbol="${ch}">: la lettera non è in nessun values`);
  const unions: Record<string, string> = {};
  for (const [k, v] of Object.entries(c.unions)) unions[k] = [...v].map((ch) => (ch === values[0] ? '.' : ch)).join('');
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
