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
//   <color symbol="N" value="8b5a2b" part="gamba" hidden="True"/>  recolours a letter (MarkovJunior's
//                                           palette.xml syntax); `part` names a limb that moves when the
//                                           figure walks; `hidden` keeps a marker out of the picture
//   <box|ellipsoid|cylinder|cone at="x y z" size="w d h" color="A" on="B"/>, <line at to r color/>
//                                           solid shapes, `at` the centre of the base, z from the floor up
//   <animation name="fiamma" frames="6">…</animation>  nodes run once per frame on the finished model,
//                                           each frame on the one before (flames, water, blinking)
//   <action name="apri" label="Apri la porta">…</action>  nodes run on the model when someone acts on it
// Not supported (they need files, search or tiles): wfc, convchain, observe and field (inference),
// rule files (fin, fout, file).

import { Mj3Error, PARTS, SHAPES, type ConvRule, type Node3, type PaletteEntry, type Part, type Program3, type Rule3, type ShapeKind, type Sym, type Vec3 } from '../mj3d/engine';
import { MJ_PALETTE } from './palette';
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
  warnings: string[];
}

const SYMMETRY: Record<string, Sym> = { '()': 'none', '(x)': 'x', '(y)': 'y', '(z)': 'z', '(xy)': 'xy', '(xyz+)': 'rot', '(xyz)': 'all' };
const RULE_NODES = new Set(['one', 'all', 'prl']);
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
  /**
   * Strict: MarkovJunior's own checks. Otherwise the shapes models get wrong and whose meaning is clear
   * are mended, with a warning (spaces or repeats in values, a letter used but not declared, an unknown
   * part): models do not count characters.
   */
  constructor(private strict: boolean) {}

  fail(el: XmlElement, msg: string): never {
    throw new Mj3Error(`riga ${el.line}, <${el.name}>: ${msg}`);
  }

  mend(el: XmlElement, msg: string): void {
    if (this.strict) this.fail(el, msg);
    this.warnings.push(`riga ${el.line}: ${msg} (riparato)`);
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
      let part: string | undefined = el.attrs.part;
      if (part !== undefined && !(PARTS as readonly string[]).includes(part)) {
        this.mend(el, `part "${part}" sconosciuta (${PARTS.join(', ')}): tolta`);
        part = undefined;
      }
      this.colors[sym] = {
        ...(value ? { color: `#${value.toLowerCase()}` } : {}),
        ...(el.attrs.name || el.attrs.comment ? { name: el.attrs.name ?? el.attrs.comment } : {}),
        ...(part ? { part: part as Part } : {}),
        ...(/^true$/i.test(el.attrs.hidden ?? '') ? { hidden: true } : {}),
      };
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
        this.pending.push(c);
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
      if (r.attrs.fin || r.attrs.fout || r.attrs.file) this.fail(r, 'le regole da file (fin, fout, file) non sono supportate: scrivi in e out');
      if (r.attrs.d === '2') return;
      const rs = own ? sym : this.symmetry(r, { ...ctx, sym });
      const p = this.num(r, r.attrs.p, 'p');
      const rule: Rule3 = { in: this.pattern(r, r.attrs.in, ctx, 'in'), out: this.pattern(r, r.attrs.out, ctx, 'out'), ...(p !== undefined ? { p } : {}) };
      const shape = (s: string) => s.split(' ').map((layer) => layer.split('/').map((row) => (row.match(/\[[^\]]*\]|./g) ?? []).length).join('×')).join(' | ');
      if (!this.strict && shape(rule.in) !== shape(rule.out) || !regular(rule.in) || !regular(rule.out)) {
        const [a, b] = pad(rule.in, rule.out);
        if (!this.strict && (a !== rule.in || b !== rule.out)) {
          this.mend(r, `pattern irregolari completati con "*": in "${r.attrs.in}", out "${r.attrs.out}"`);
          rule.in = a;
          rule.out = b;
        }
      }
      if (shape(rule.in) !== shape(rule.out))
        this.fail(r, `in e out devono avere la stessa forma (strati separati da spazi, righe da "/"): in ${shape(rule.in)}, out ${shape(rule.out)}`);
      if (rs !== sym) rule.symmetry = rs;
      out.push(rule);
    };
    if (el.attrs.in !== undefined || el.attrs.out !== undefined) add(el, true);
    for (const c of el.children) {
      if (c.name === 'rule') add(c, false);
      else if (UNSUPPORTED[c.name]) this.fail(c, UNSUPPORTED[c.name]);
      else if (c.name !== 'union' && c.name !== 'color') this.fail(c, `dentro <${el.name}> vanno solo <rule>`);
    }
    if (!out.length) this.fail(el, 'nessuna regola (in e out sul nodo, o figli <rule>)');
    return out;
  }

  node(el: XmlElement, ctx: Ctx): Node3 | null {
    if (el.name === 'union' || el.name === 'color') return null;
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
    if ((SHAPES as readonly string[]).includes(el.name)) return this.shape(el, ctx);
    if (el.name === 'rule') this.fail(el, '<rule> va dentro one, all, prl, convolution o map');
    this.fail(el, `nodo sconosciuto (noti: one all prl sequence markov convolution path map union color ${SHAPES.join(' ')} animation action)`);
  }

  convolution(el: XmlElement, ctx: Ctx): Node3 {
    const hood = (el.attrs.neighborhood ?? '').toLowerCase();
    const neighborhood = hood === 'vonneumann' ? 'vonneumann' : hood === 'nocorners' ? 'nocorners' : hood === 'moore' ? 'moore' : this.fail(el, 'neighborhood vuole VonNeumann (6 vicini), NoCorners (18) o Moore (26)');
    const xs = el.children.filter((c) => c.name === 'rule');
    const sources = xs.length ? xs : [el];
    const rules: ConvRule[] = sources.map((r) => {
      const input = this.one(r, r.attrs.in, ctx, 'in');
      const output = this.one(r, r.attrs.out, ctx, 'out');
      const p = this.num(r, r.attrs.p, 'p');
      if ((r.attrs.values === undefined) !== (r.attrs.sum === undefined)) this.fail(r, 'values e sum vanno insieme');
      let sums: number[];
      let neighbors = input;
      if (r.attrs.sum !== undefined) {
        neighbors = this.letters(r, r.attrs.values!, ctx, 'values');
        sums = r.attrs.sum.split(',').flatMap((part) => {
          const [a, b] = part.split('..').map((v) => Number(v.trim()));
          if (!Number.isInteger(a) || (b !== undefined && !Number.isInteger(b))) this.fail(r, `sum "${r.attrs.sum}" non valido (es. "5..8" o "1,3")`);
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
    const inner: Ctx = { bg: values[0], sym, values: new Set(values) };
    const rules: Rule3[] = el.children
      .filter((c) => c.name === 'rule')
      .map((r) => {
        const p = this.num(r, r.attrs.p, 'p');
        return { in: this.pattern(r, r.attrs.in, ctx, 'in'), out: this.pattern(r, r.attrs.out, inner, 'out'), ...(p !== undefined ? { p } : {}) };
      });
    const step: Node3 = { type: 'map', scale: scale.map(Number) as Vec3, rules, symmetry: sym, clear: true };
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
    return { type: 'shape', shape, at, size: this.vec(el, el.attrs.size, 'size'), color, ...(on ? { on } : {}) };
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

/** Compiles a program; `size` (the class's box) wins over the program's own. Throws Mj3Error with the line. */
export function compileMjx(src: string, opts: { size?: Vec3; strict?: boolean } = {}): MjxModel {
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
  const c = new Compiler(opts.strict === true);
  for (const r of roots) c.collect(r);
  const values = c.values(root, root.attrs.values);
  const ctx: Ctx = { bg: values[0], sym: 'all', values: new Set(values) };
  // The root's symmetry is inherited by everything below, animations and actions included.
  const rootSym = c.symmetry(root, ctx);
  ctx.sym = rootSym;
  let program: Node3 | null;
  if (RULE_NODES.has(root.name) || root.name === 'sequence' || root.name === 'markov' || root.name === 'map' || root.name === 'convolution' || root.name === 'path') program = c.node(root, ctx);
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
    palette[ch] = { name: own?.name ?? base?.name, ...(own?.color ?? base?.color ? { color: own?.color ?? base!.color } : {}), ...(own?.part ? { part: own.part } : {}), ...(own?.hidden ? { hidden: true } : {}) };
  }
  for (const ch of Object.keys(c.colors)) if (!c.declared.has(ch)) c.warnings.push(`<color symbol="${ch}">: la lettera non è in nessun values`);
  const unions: Record<string, string> = {};
  for (const [k, v] of Object.entries(c.unions)) unions[k] = [...v].map((ch) => (ch === values[0] ? '.' : ch)).join('');
  for (const clip of [...c.animations, ...c.actions]) clip.program = { ...clip.program, palette, unions };

  const origin = root.attrs.origin;
  const ground = root.attrs.ground;
  return {
    name: root.attrs.name,
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
      program: program!,
    },
  };
}
