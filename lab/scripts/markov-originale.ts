// `<markov>` and `<sequence>` in our engine against MarkovJunior of mxgmn (T498, docs/design/markov.md, lab/banco/markov/README.md).
//
// The engine is not changed: this script writes a copy of src/mj/engine.ts in lab/out/markov/ whose sequence and markov run as the
// original's Branch, MarkovNode and Interpreter (Node.cs, Interpreter.cs): the deepest branch at work has the turn (`ip.current`), a
// branch that finishes gives it back to its parent with a step that does nothing and starts anew, a markov asks its children from the
// first at every step and never starts their steps again until it finishes, a map ends the run when its nodes are done; and a `prl`
// counts among its steps the turns in which it applied nothing (ParallelNode.Go). The rule nodes are ours (the matches where something
// changes, our random numbers): a program whose branches the original runs as we do gives in the copy the same grid voxel by voxel.
//
//   npx vite-node lab/scripts/markov-originale.ts -- [--differenze] [--cicli [--semi 100]] [--forte [--semi 4]] [--censimento [--universi <cartella>…]]
//     [--originale <cartella dei modelli di mxgmn>] [--json f] [--md f]
//   --differenze  the programs of lab/banco/markov/programmi/ (d*), ours and the copy, against what the original printed (originale.json)
//   --cicli       the four loops of the author's fort as small programs (l*): what they give over many seeds, ours, the copy, the original
//   --forte       the author's fort (docs/userchats/forte-handmade-2026-11-22.xml, never written), ours and the copy, at its box
//   --censimento  the programs of the seed, of lab/ and of the universes given that use <markov> (or a branch inside a branch): how, and
//                 whether the copy changes their grid; with --originale also the models of the original's repository, read only
//   --registra    with an SDK .NET 6 and lab/banco/markov/originale/ built in lab/out/markov/mj/ (README), runs the original on the d* and
//                 l* programs and writes originale.json
// No calls to the models; writes only lab/out/markov/ and the files given.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { run as ourRun, runOn as ourRunOn, type Grid3, type Program3, type RunResult } from '../../src/mj/engine';
import { compileMjx } from '../../src/mj/model';
import { MJX_LIMITS } from '../../src/mj/run';
import { parseXml, type XmlElement } from '../../src/mj/xml';
import { CLASSES } from '../../src/mj/classes';
import { cellarVoxels, entryBox, rootTag, type ModelInfo } from '../../src/kernel/forms';

const args = process.argv.slice(2);
const flag = (k: string) => args.includes(`--${k}`);
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const many = (k: string) => args.flatMap((a, i) => (a === `--${k}` ? [args[i + 1]] : []));

const ROOT = path.resolve('.');
const BENCH = path.join(ROOT, 'lab/banco/markov');
const PROGRAMS = path.join(BENCH, 'programmi');
const OUT = path.join(ROOT, 'lab/out/markov');
const FORT = path.join(ROOT, 'docs/userchats/forte-handmade-2026-11-22.xml');

// ---------------------------------------------------------------- the copy of the engine with the original's branches

/** What the copy adds at the end of engine.ts: the original's Branch, MarkovNode and Interpreter over our runners. */
const BRANCHES = `
// ---------------------------------------------------------------- T498: the branches of MarkovJunior (Node.cs, Interpreter.cs)
export const FLOW = { original: false };
/** The branch that has the turn (\`ip.current\`): the interpreter asks it, not the root. */
let turn: OrigBranch | null = null;
class OrigBranch extends Runner {
  n = 0;
  parent: OrigBranch | null = null;
  private opened = false;
  /** \`ends\`: a map (or a wave) is a branch without a parent: when its nodes are done, the run is (Node.cs, Branch.Load). */
  constructor(private nodes: Runner[], private markov: boolean, private gated: boolean, readonly ends: boolean) {
    super();
    for (const c of nodes) if (c instanceof OrigBranch) c.parent = c.ends ? null : this;
  }
  reset(): void {
    super.reset();
    for (const c of this.nodes) c.reset();
    this.n = 0;
    this.opened = false;
  }
  rewind(): void {
    this.reset();
  }
  /** Branch.Go, with MarkovNode.Go's \`n = 0\`. */
  go(g: Grid3, rng: Rng): boolean {
    if (this.markov) this.n = 0;
    for (; this.n < this.nodes.length; this.n++) {
      const node = this.nodes[this.n];
      if (node instanceof OrigBranch) turn = node;
      if (node.go(g, rng)) {
        if (this.n === 0) this.opened = true;
        return true;
      }
      // A wave without a solution leaves its nodes out (our gated sequence).
      if (this.gated && this.n === 0 && !this.opened) break;
    }
    turn = this.parent;
    this.reset();
    return false;
  }
}
/** Interpreter.Run: at every step the branch that has the turn; a step in which a branch finishes is a step. */
class OrigRoot extends Runner {
  constructor(private top: OrigBranch) {
    super();
  }
  reset(): void {
    this.top.reset();
    turn = this.top;
  }
  rewind(): void {
    this.reset();
  }
  go(g: Grid3, rng: Rng): boolean {
    if (!turn) return false;
    turn.go(g, rng);
    return true;
  }
}
/** The root as the original holds it: a branch, or a node inside a markov (Interpreter.Load). */
function rootOf(r: Runner): Runner {
  if (!FLOW.original) return r;
  return new OrigRoot(r instanceof OrigBranch ? r : new OrigBranch([r], true, false, false));
}
`;

/** Writes the copy (the same code, with the original's branches when FLOW.original) and loads it. */
async function originalEngine(): Promise<{ FLOW: { original: boolean }; run: typeof ourRun; runOn: typeof ourRunOn }> {
  let src = fs.readFileSync(path.join(ROOT, 'src/mj/engine.ts'), 'utf8');
  const swap = (from: string | RegExp, to: string, count: number) => {
    const n = typeof from === 'string' ? src.split(from).length - 1 : (src.match(new RegExp(from.source, 'g')) ?? []).length;
    if (n !== count) throw new Error(`la copia del motore: «${from}» compare ${n} volte, non ${count} (il motore è cambiato: aggiorna lo script)`);
    src = typeof from === 'string' ? src.split(from).join(to) : src.replace(new RegExp(from.source, 'g'), to);
  };
  swap("from '../kernel/rng'", "from '../../../src/kernel/rng'", 1);
  swap("from './infer'", "from '../../../src/mj/infer'", 1);
  swap("from './symbols'", "from '../../../src/mj/symbols'", 1);
  swap("from './wfc'", "from '../../../src/mj/wfc'", 1);
  swap(
    "return node.type === 'sequence' ? new SequenceRunner(children, node.gated === true) : new MarkovRunner(children);",
    "if (FLOW.original && !inPieces) return new OrigBranch(children, node.type === 'markov', node.gated === true, node.children[0]?.type === 'map' || node.children[0]?.type === 'wfc');\n      return node.type === 'sequence' ? new SequenceRunner(children, node.gated === true) : new MarkovRunner(children);",
    1,
  );
  swap('const root = compile(p.program, alpha, limits, 0, trace, opts.watch);', 'const root = rootOf(compile(p.program, alpha, limits, 0, trace, opts.watch));', 2);
  // ParallelNode.Go: counter++ before `return matchCount > 0`, so a turn that applied nothing is one of its steps.
  swap(
    '      if (!chosen.length) return false;',
    '      if (!chosen.length) {\n        if (FLOW.original) this.count++;\n        return false;\n      }',
    1,
  );
  swap(
    '    if (!keys.length) {\n      if (!this.total && !this.why) {',
    "    if (!keys.length) {\n      if (FLOW.original && this.kind === 'prl') this.count++;\n      if (!this.total && !this.why) {",
    1,
  );
  // A copy left in lab/out/ by an older engine must not stop the typecheck (lab/ is in it).
  src = `// @ts-nocheck\n// Written by lab/scripts/markov-originale.ts (T498) from src/mj/engine.ts: do not edit, do not import from src/.\n${src}\n${BRANCHES}`;
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, 'engine-originale.ts');
  fs.writeFileSync(file, src);
  // Not a literal: the copy is written now, and the typecheck does not look for it.
  return (await import(/* @vite-ignore */ pathToFileURL(file).href)) as never;
}

// ---------------------------------------------------------------- grids

/** A grid from text (x fastest, then y, then z; whitespace ignored), its first letter the empty cell, as the original reads start.txt. */
function gridFrom(text: string, values: string, X: number, Y: number, Z: number): Grid3 {
  const letters = text.replace(/\s+/g, '');
  if (letters.length !== X * Y * Z) throw new Error(`griglia di ${letters.length} celle, non ${X * Y * Z}`);
  const alphabet = ['.'];
  const cells = new Uint8Array(X * Y * Z);
  for (let i = 0; i < letters.length; i++) {
    const ch = letters[i];
    if (ch === values[0]) continue;
    let k = alphabet.indexOf(ch);
    if (k < 0) k = alphabet.push(ch) - 1;
    cells[i] = k;
  }
  return { X, Y, Z, cells, alphabet, log: [], epoch: 0 };
}
/** The letters of a grid as the original prints them (x fastest, then y, then z), the empty cell as `bg`. */
const lettersOf = (g: Grid3, bg: string) => Array.from(g.cells, (c) => (c === 0 ? bg : g.alphabet[c])).join('');
const count = (s: string, ch: string) => [...s].filter((c) => c === ch).length;

// ---------------------------------------------------------------- the programs of the bench

interface BenchProgram {
  name: string;
  xml: string;
  values: string;
  size: [number, number, number];
  start: string;
}
function benchProgram(name: string): BenchProgram {
  const xml = fs.readFileSync(path.join(PROGRAMS, `${name}.xml`), 'utf8');
  const start = fs.readFileSync(path.join(PROGRAMS, `${name}.txt`), 'utf8');
  const values = /values="([^"]+)"/.exec(xml)![1];
  // The size from the start grid: rows are lines, layers blank-line separated.
  const layers = start.trim().split(/\n\s*\n/);
  const rows = layers[0].trim().split('\n');
  return { name, xml, values, size: [rows[0].trim().length, rows.length, layers.length], start };
}
const benchNames = (prefix: string) =>
  fs
    .readdirSync(PROGRAMS)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.xml'))
    .map((f) => f.slice(0, -4))
    .sort((a, b) => a.localeCompare(b, 'it', { numeric: true }));

type Runner = { runOn: typeof ourRunOn };
function runBench(engine: Runner, p: BenchProgram, seed: number, maxSteps = 100_000): { letters: string; steps: number; finished: boolean } {
  const m = compileMjx(p.xml, { size: p.size });
  const r = engine.runOn(gridFrom(p.start, p.values, ...p.size), m.program, seed, maxSteps);
  return { letters: lettersOf(r.grid, p.values[0]), steps: r.steps, finished: r.finished };
}

/** What the original printed (`--registra`): for each program and seed, the letters, the steps, whether it finished. */
type Recorded = Record<string, Record<string, { letters?: string; outcome?: number; steps: number; finished: boolean }>>;
const RECORDED = path.join(BENCH, 'originale.json');
const recorded = (): Recorded => (fs.existsSync(RECORDED) ? JSON.parse(fs.readFileSync(RECORDED, 'utf8')) : {});

/** Runs the original (lab/out/markov/mj/mj.dll, built from lab/banco/markov/originale/ as the README says) on a bench program. */
function runOriginal(p: BenchProgram, seeds: [number, number], maxSteps: number): Record<string, { letters: string; steps: number; finished: boolean }> {
  const dll = path.join(OUT, 'mj', 'mj.dll');
  if (!fs.existsSync(dll)) throw new Error(`manca ${dll}: costruisci l'originale come dice lab/banco/markov/README.md`);
  const out = execFileSync('dotnet', [dll, path.join(PROGRAMS, `${p.name}.xml`), ...p.size.map(String), `${seeds[0]}-${seeds[1]}`, String(maxSteps), path.join(PROGRAMS, `${p.name}.txt`)], {
    encoding: 'utf8',
    maxBuffer: 1 << 30,
  });
  const res: Record<string, { letters: string; steps: number; finished: boolean }> = {};
  for (const block of out.split(/^SEED /m).slice(1)) {
    const lines = block.split(/\r?\n/);
    const seed = lines[0].trim();
    const steps = Number(/^STEPS (\d+)/m.exec(block)![1]);
    const finished = /^FINISHED true/m.test(block);
    const gridAt = lines.findIndex((l) => l.startsWith('GRID '));
    const letters = lines.slice(gridAt + 1).join('').replace(/\s+/g, '');
    res[seed] = { letters, steps, finished };
  }
  return res;
}

// ---------------------------------------------------------------- the outcome of each loop

/** What a loop program decides, in a number: the courtyard's cells, the keep's cells, the storeys. */
function outcomeOf(name: string, letters: string): number {
  if (name.startsWith('l1') || name.startsWith('l2')) return count(letters, 'x');
  if (name.startsWith('l3')) return count(letters, 'k') + count(letters, 'K');
  if (name.startsWith('l4')) return count(letters, 'F') / 3;
  return NaN;
}
const OUTCOME: Record<string, string> = { l1: 'celle del cortile', l2: 'celle del cortile', l3: 'celle del mastio', l4: 'piani' };

interface Stats {
  n: number;
  mean: number;
  min: number;
  max: number;
  unfinished: number;
  histogram?: Record<string, number>;
}
function stats(values: number[], unfinished: number, histogram = false): Stats {
  const n = values.length;
  const mean = values.reduce((s, v) => s + v, 0) / Math.max(1, n);
  const h: Record<string, number> = {};
  if (histogram) for (const v of values) h[String(Math.round(v * 100) / 100)] = (h[String(Math.round(v * 100) / 100)] ?? 0) + 1;
  return { n, mean: Math.round(mean * 100) / 100, min: Math.min(...values), max: Math.max(...values), unfinished, ...(histogram ? { histogram: h } : {}) };
}

// ---------------------------------------------------------------- the census

interface MarkovUse {
  /** Where the markov is: the root, or inside a sequence, a markov, a map. */
  inside: string;
  children: string[];
  /** Children with `steps` (rule nodes). */
  stepped: number;
  /** Children that are a sequence or a markov. */
  branches: number;
  lastIsBranch: boolean;
  /** `prl` children with p < 1. */
  coins: number;
}
interface CensusRow {
  file: string;
  where: string;
  markovs: MarkovUse[];
  /** Sequences and markovs that are not the root, as written: the original asks each again until it has nothing to do. */
  nested: number;
  /** Of them the sequences (inside a sequence, a markov or a map): once here, a loop of passes in the original. */
  nestedSequences: number;
  /** Ours and the copy at two seeds: the same grid, another, or the reason it did not run. */
  same?: boolean[];
  note?: string;
  ms?: number;
}
const BRANCH = new Set(['sequence', 'markov']);
const NODES = new Set(['one', 'all', 'prl', 'sequence', 'markov', 'convolution', 'path', 'map', 'wfc', 'convchain', 'pieces', 'box', 'ellipsoid', 'cylinder', 'cone', 'line', 'import']);
function censusOf(root: XmlElement): Pick<CensusRow, 'markovs' | 'nested' | 'nestedSequences'> {
  const markovs: MarkovUse[] = [];
  let nested = 0;
  let nestedSequences = 0;
  const visit = (el: XmlElement, parent: string) => {
    if (el.name === 'markov') {
      const kids = el.children.filter((c) => NODES.has(c.name));
      markovs.push({
        inside: parent || 'radice',
        children: kids.map((c) => c.name),
        stepped: kids.filter((c) => (c.name === 'one' || c.name === 'all' || c.name === 'prl') && c.attrs.steps !== undefined).length,
        branches: kids.filter((c) => BRANCH.has(c.name)).length,
        lastIsBranch: BRANCH.has(kids[kids.length - 1]?.name ?? ''),
        coins: kids.filter((c) => c.name === 'prl' && (Number(c.attrs.p ?? 1) < 1 || c.children.some((r) => r.name === 'rule' && Number(r.attrs.p ?? 1) < 1))).length,
      });
    }
    if (BRANCH.has(el.name) && parent) nested++;
    if (el.name === 'sequence' && parent) nestedSequences++;
    for (const c of el.children) if (NODES.has(c.name)) visit(c, el.name);
  };
  visit(root, '');
  return { markovs, nested, nestedSequences };
}

/** The box a program of a models/ folder runs in, as the game gives it (`Forms`: its `size`, or its entry's box and cellar). */
function boxFor(xml: string, info: ModelInfo | undefined): [number, number, number] | undefined {
  if (/\ssize="/.test(rootTag(xml))) return undefined;
  const cls = CLASSES.find((c) => c.id === info?.class) ?? CLASSES.find((c) => c.id === 'thing') ?? CLASSES[0];
  const [X, Y, Z] = entryBox(cls, info);
  return [X, Y, Z + cellarVoxels(info, xml)];
}

function filesOf(dir: string): Record<string, string> {
  const files: Record<string, string> = {};
  if (!fs.existsSync(dir)) return files;
  for (const f of fs.readdirSync(dir)) if (/\.(xml|txt)$/.test(f)) files[f] = fs.readFileSync(path.join(dir, f), 'utf8');
  return files;
}

async function census(engine: Awaited<ReturnType<typeof originalEngine>>, sources: Array<{ where: string; files: string[]; models?: string }>, runThem: boolean): Promise<CensusRow[]> {
  const rows: CensusRow[] = [];
  for (const s of sources) {
    const index: Record<string, ModelInfo> = s.models && fs.existsSync(path.join(s.models, 'index.json')) ? JSON.parse(fs.readFileSync(path.join(s.models, 'index.json'), 'utf8')) : {};
    const files = s.models ? filesOf(s.models) : {};
    const seedFiles = filesOf(path.join(ROOT, 'universe/models'));
    for (const file of s.files) {
      const xml = fs.readFileSync(file, 'utf8');
      if (!/<markov\b/.test(xml) && !/<sequence\b[\s\S]*<sequence\b/.test(xml)) continue;
      let roots: XmlElement[];
      try {
        roots = parseXml(xml);
      } catch {
        continue;
      }
      const root = roots.find((r) => r.name !== 'color' && r.name !== 'action' && r.name !== 'animation' && r.name !== 'worn' && r.name !== 'union');
      if (!root) continue;
      const c = censusOf(root);
      // The loops of an animation or an action run on the model's grid (clipFrames): counted, not run here.
      for (const clip of roots.filter((r) => r.name === 'action' || r.name === 'animation' || r.name === 'worn')) {
        const k = censusOf(clip);
        c.markovs.push(...k.markovs.map((m) => ({ ...m, inside: `${clip.name} ${clip.attrs.name ?? clip.attrs.zone ?? ''}`.trim() + (m.inside === clip.name ? '' : `/${m.inside}`) })));
      }
      if (!c.markovs.length && !c.nested) continue;
      const row: CensusRow = { file: path.relative(ROOT, file).replace(/\\/g, '/'), where: s.where, ...c };
      if (runThem) {
        const id = path.basename(file, '.xml');
        const size = boxFor(xml, index[id]);
        try {
          const m = compileMjx(xml, { ...(size ? { size } : {}), files: { ...seedFiles, ...(s.models ? files : filesOf(path.dirname(file))) }, self: id });
          const t0 = Date.now();
          row.same = [];
          for (const seed of [1, 2]) {
            engine.FLOW.original = false;
            const a = engine.run(m.program as Program3, seed, 2_000_000, MJX_LIMITS, { deadline: 20_000 });
            // A run cut by the time is not one grid: nothing to compare.
            if (!a.finished) {
              row.note = `non finisce nemmeno da noi in 20 s`;
              row.same = undefined;
              break;
            }
            const aLetters = lettersOf(a.grid, '.');
            engine.FLOW.original = true;
            const b = engine.run(m.program as Program3, seed, 2_000_000, MJX_LIMITS, { deadline: 20_000 });
            engine.FLOW.original = false;
            row.same.push(b.finished && aLetters === lettersOf(b.grid, '.') && a.grid.X === b.grid.X && a.grid.Z === b.grid.Z);
            if (!b.finished) row.note = `col flusso dell’originale non finisce (${b.steps} passi)`;
          }
          row.ms = Date.now() - t0;
        } catch (e) {
          row.note = `non gira: ${(e as Error).message.slice(0, 100)}`;
        }
      }
      rows.push(row);
    }
  }
  return rows;
}

function xmlFiles(dir: string, recursive = false): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && recursive && e.name !== 'out' && e.name !== 'node_modules') out.push(...xmlFiles(p, true));
    else if (e.isFile() && e.name.endsWith('.xml')) out.push(p);
  }
  return out;
}

// ---------------------------------------------------------------- main

async function main(): Promise<void> {
  const engine = await originalEngine();
  const report: Record<string, unknown> = {};
  const md: string[] = [];
  const ours: Runner = { runOn: (...a) => ((engine.FLOW.original = false), engine.runOn(...a)) };
  const copy: Runner = {
    runOn: (...a) => {
      engine.FLOW.original = true;
      try {
        return engine.runOn(...a);
      } finally {
        engine.FLOW.original = false;
      }
    },
  };
  // The copy with the flag off is our engine: checked on every bench program against src/mj/engine.ts.
  const sameAsOurs = (p: BenchProgram, seed: number) => {
    const a = runBench({ runOn: ourRunOn }, p, seed);
    const b = runBench(ours, p, seed);
    if (a.letters !== b.letters || a.steps !== b.steps) throw new Error(`la copia del motore non è il motore su ${p.name}`);
  };

  if (flag('registra')) {
    const rec = recorded();
    for (const name of [...benchNames('d'), ...benchNames('l')]) {
      const p = benchProgram(name);
      const seeds: [number, number] = name.startsWith('l') ? [1, Number(opt('semi') ?? 100)] : name === 'd9-one-e-p' ? [1, 5] : [1, 1];
      const got = runOriginal(p, seeds, name.startsWith('d8') ? 200 : name.startsWith('l4') ? 20_000 : 100_000);
      // A loop is kept as what it decides (its grids are large and many); a difference with its grid.
      rec[name] = name.startsWith('l') ? Object.fromEntries(Object.entries(got).map(([k, v]) => [k, { outcome: outcomeOf(name, v.letters), steps: v.steps, finished: v.finished }])) : got;
      console.log(`registrato ${name} (${Object.keys(rec[name]).length} semi)`);
    }
    // One line per program: the loops have 400 seeds each.
    const lines = Object.entries(rec).map(([k, v]) => ` ${JSON.stringify(k)}: ${JSON.stringify(v)}`);
    fs.writeFileSync(RECORDED, `{\n${lines.join(',\n')}\n}\n`);
  }

  if (flag('differenze')) {
    const rec = recorded();
    const rows: Array<Record<string, unknown>> = [];
    md.push('## Le differenze, una per programma', '', '| programma | l’originale (C#) | la copia col flusso dell’originale | il nostro motore |', '|---|---|---|---|');
    for (const name of benchNames('d')) {
      const p = benchProgram(name);
      sameAsOurs(p, 1);
      const maxSteps = name.startsWith('d8') ? 200 : 100_000;
      const a = runBench(ours, p, 1, maxSteps);
      const b = runBench(copy, p, 1, maxSteps);
      const o = rec[name]?.['1'];
      const show = (r?: { letters?: string; steps: number; finished: boolean }) => (r ? `\`${r.letters}\` ${r.steps} passi${r.finished ? '' : ', non finisce'}` : '—');
      rows.push({ name, original: o, copy: b, ours: a, copyIsOriginal: o ? o.letters === b.letters && o.finished === b.finished : undefined });
      md.push(`| ${name} | ${show(o)} | ${show(b)}${o && o.letters === b.letters ? '' : ' ≠'} | ${show(a)}${o && o.letters === a.letters ? '' : ' ≠'} |`);
    }
    report.differenze = rows;
    md.push('');
  }

  if (flag('cicli')) {
    const rec = recorded();
    const semi = Number(opt('semi') ?? 100);
    const rows: Array<Record<string, unknown>> = [];
    md.push(`## I quattro cicli del forte, ${semi} semi`, '', '| programma | misura | l’originale (C#) | la copia | il nostro motore | la copia dà la nostra griglia |', '|---|---|---|---|---|---|');
    for (const name of benchNames('l')) {
      const p = benchProgram(name);
      sameAsOurs(p, 1);
      const grids = new Map<Runner, string[]>();
      const take = (r: Runner) => {
        const v: number[] = [];
        const g: string[] = [];
        let unfinished = 0;
        for (let s = 1; s <= semi; s++) {
          const x = runBench(r, p, s, name.startsWith('l4') ? 20_000 : 100_000);
          v.push(outcomeOf(name, x.letters));
          g.push(x.letters);
          if (!x.finished) unfinished++;
        }
        grids.set(r, g);
        return stats(v, unfinished, name.startsWith('l4') || name.startsWith('l3'));
      };
      const oSeeds = Object.values(rec[name] ?? {});
      const o = oSeeds.length ? stats(oSeeds.map((x) => x.outcome ?? outcomeOf(name, x.letters ?? '')), oSeeds.filter((x) => !x.finished).length, name.startsWith('l4') || name.startsWith('l3')) : undefined;
      const b = take(copy);
      const a = take(ours);
      // The same grid voxel by voxel, ours and the copy, seed by seed: where the original's branches draw as ours do.
      const same = grids.get(ours)!.filter((g, i) => g === grids.get(copy)![i]).length;
      rows.push({ name, outcome: OUTCOME[name.slice(0, 2)], original: o, copy: b, ours: a, sameGrids: same });
      const show = (s?: Stats) =>
        s ? `media ${s.mean} (${s.min}-${s.max})${s.unfinished ? `, ${s.unfinished} su ${s.n} non finiscono` : ''}${s.histogram ? `; ${Object.entries(s.histogram).sort((x, y) => Number(x[0]) - Number(y[0])).map(([k, n]) => `${k}: ${n}`).join(', ')}` : ''}` : '—';
      md.push(`| ${name} | ${OUTCOME[name.slice(0, 2)]} | ${show(o)}${o ? ` (${o.n} semi)` : ''} | ${show(b)} | ${show(a)} | ${same} su ${semi} |`);
    }
    report.cicli = rows;
    md.push('');
  }

  if (flag('forte')) {
    const semi = Number(opt('semi') ?? 4);
    const xml = fs.readFileSync(FORT, 'utf8');
    const m = compileMjx(xml, {});
    const rows: Array<Record<string, unknown>> = [];
    // The copy never finishes the fort (its storeys go on): it has the time it takes to reach the top and more.
    const time = Number(opt('tempo') ?? 120) * 1000;
    md.push(
      '## Il forte dell’autore (copia del 22/11), alla sua scatola',
      '',
      `| seme | motore | finito | passi | ms | griglia | solai \`F\` (strati con un solaio, a gruppi) | il mastio (\`K\` o \`k\`) fino allo strato | uguale |`,
      '|---|---|---|---|---|---|---|---|---|',
    );
    for (let seed = 1; seed <= semi; seed++) {
      const one = (original: boolean) => {
        engine.FLOW.original = original;
        const t0 = Date.now();
        const r: RunResult = engine.run(m.program as Program3, seed, 50_000_000, MJX_LIMITS, { deadline: original ? time : 600_000 });
        engine.FLOW.original = false;
        const g = r.grid;
        const L = lettersOf(g, '.');
        const XY = g.X * g.Y;
        const codes = (chs: string) => new Set([...chs].map((c) => g.alphabet.indexOf(c)).filter((c) => c > 0));
        const keep = codes(g.Z > 60 ? 'K' : 'k');
        const slab = codes('F');
        let top = -1;
        const slabbed = new Array<boolean>(g.Z).fill(false);
        for (let i = 0; i < g.cells.length; i++) {
          if (keep.has(g.cells[i])) top = Math.max(top, Math.floor(i / XY));
          if (slab.has(g.cells[i])) slabbed[Math.floor(i / XY)] = true;
        }
        // The storeys: the runs of layers with a slab (a slab is a cell on the plan at a quarter, four voxels at full scale).
        const slabs = slabbed.filter((s, z) => s && !slabbed[z - 1]).length;
        return { finished: r.finished, steps: r.steps, ms: Date.now() - t0, grid: `${g.X}×${g.Y}×${g.Z}`, slabs, keepTop: top, letters: L };
      };
      const a = one(false);
      const b = one(true);
      for (const [who, r] of [['nostro', a], ['originale', b]] as const) {
        const { letters, ...rest } = r;
        void letters;
        rows.push({ seed, engine: who, ...rest, same: a.letters === b.letters });
        md.push(`| ${seed} | ${who === 'nostro' ? 'il nostro' : 'col flusso dell’originale'} | ${r.finished ? 'sì' : `no (${Math.round(r.ms / 1000)} s)`} | ${r.steps} | ${r.ms} | ${r.grid} | ${r.slabs} | ${r.keepTop} | ${a.letters === b.letters ? 'sì' : 'no'} |`);
      }
      console.log(`forte, seme ${seed}: ${a.ms} + ${b.ms} ms`);
    }
    report.forte = rows;
    md.push('');
  }

  if (flag('censimento')) {
    const universes = many('universi');
    const lab = (execFileSync('git', ['ls-files', 'lab/*.xml', 'lab/**/*.xml'], { encoding: 'utf8' }).split('\n').filter(Boolean) as string[]).map((f) => path.join(ROOT, f));
    const sources: Array<{ where: string; files: string[]; models?: string }> = [
      { where: 'seme', files: xmlFiles(path.join(ROOT, 'universe/models')), models: path.join(ROOT, 'universe/models') },
      { where: 'laboratorio', files: lab },
      { where: 'forte dell’autore', files: [FORT] },
      ...universes.flatMap((u) => fs.readdirSync(u, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('.')).map((d) => ({ where: `universo ${d.name}`, files: xmlFiles(path.join(u, d.name, 'models')), models: path.join(u, d.name, 'models') }))),
    ];
    const rows = await census(engine, sources, !flag('senza-giri'));
    let original: CensusRow[] = [];
    const orig = opt('originale');
    if (orig) original = await census(engine, [{ where: 'modelli di mxgmn', files: xmlFiles(orig) }], false);
    report.censimento = { rows, original, scanned: Object.fromEntries(sources.map((s) => [s.where, s.files.length])) };
    const by = new Map<string, CensusRow[]>();
    for (const r of rows) by.set(r.where, [...(by.get(r.where) ?? []), r]);
    md.push('## Chi usa `<markov>` (o un ramo dentro un ramo)', '', '| dove | programmi letti | con `<markov>` | cicli | con un ramo dentro il ciclo | il ramo ultimo figlio | figli con `steps` | `prl` a moneta | rami annidati | la copia dà un’altra griglia (seme 1 o 2) |', '|---|---|---|---|---|---|---|---|---|---|');
    const line = (where: string, list: CensusRow[], scanned: number) => {
      const ms = list.flatMap((r) => r.markovs);
      const changed = list.filter((r) => r.same?.some((s) => !s)).length;
      const ran = list.filter((r) => r.same).length;
      md.push(
        `| ${where} | ${scanned} | ${list.filter((r) => r.markovs.length).length} | ${ms.length} | ${ms.filter((m) => m.branches).length} | ${ms.filter((m) => m.lastIsBranch).length} | ${ms.filter((m) => m.stepped).length} | ${ms.filter((m) => m.coins).length} | ${list.filter((r) => r.nested).length} | ${ran ? `${changed} su ${ran}` : '—'} |`,
      );
    };
    for (const s of sources) line(s.where, by.get(s.where) ?? [], s.files.length);
    if (orig) line('modelli di mxgmn', original, xmlFiles(orig).length);
    md.push('', '| programma | dove | i cicli (dove stanno: figli) | rami annidati | la copia |', '|---|---|---|---|---|');
    for (const r of rows)
      md.push(
        `| \`${r.file}\` | ${r.where} | ${r.markovs.map((m) => `${m.inside}: ${m.children.join(' ')}`).join('; ') || '—'} | ${r.nested} | ${r.same ? (r.same.every(Boolean) ? 'uguale' : `cambia (${r.same.map((s) => (s ? '=' : '≠')).join('')})`) : '—'}${r.note ? `, ${r.note}` : ''} |`,
      );
    md.push('');
  }

  const json = opt('json');
  if (json) fs.writeFileSync(json, JSON.stringify(report, null, 1) + '\n');
  const mdFile = opt('md');
  if (mdFile) fs.writeFileSync(mdFile, md.join('\n') + '\n');
  console.log(md.join('\n'));
}

// vite-node keeps the copy of the engine it loaded open: the script ends when its work is done.
void main().then(() => process.exit(0));
