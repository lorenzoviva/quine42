// What a MarkovJunior program did, step by step, as text for who writes it (T179, ADR-0117). A photo says what came out; this says which node did
// what: how many times, how many cells, where, with which rules. The run is the engine's own, watched (`RunOptions.watch`): same random numbers, same grid.
//
// The forms (`traceText`), all starting from the list of nodes:
//   nodi        only the nodes
//   sezioni     (a) the sections of a frame, plane by plane, in the program's letters
//   differenze  (b) what changed between one group of nodes and the next, as boxes per «letter → letter»
//   scatole     (c) a frame as a static model: its voxels grouped in boxes per letter
// A frame is a step: the grid after that many steps of the run. `tetto` is a ceiling in estimated tokens, always respected: nearby frames are merged
// (the plain `box` first, a rule node last), equal planes and rows folded, boxes cut starting from the smallest, and whatever is cut is said.

import { describe, run, type Grid3, type GridLimits, type Node3, type PaletteEntry, type RunResult, type RunWatch, type Vec3 } from './engine';
import type { MjxModel } from './model';
import { FORM_LIMITS } from './run';

export type TraceForm = 'nodi' | 'sezioni' | 'differenze' | 'scatole';
export const TRACE_FORMS: readonly TraceForm[] = ['nodi', 'sezioni', 'differenze', 'scatole'];
/** The form the bench puts in a second request: the numbers are in lab/banco/traccia.md. */
export const DEFAULT_FORM: TraceForm = 'differenze';
/** The default ceiling, in estimated tokens: about what the program itself costs in a second request. */
export const DEFAULT_CEILING = 4000;
/** Longer than the game's time: who reads a trace wants to know also what a program too slow was doing. */
const TRACE_DEADLINE = 20_000;
const MAX_STEPS = 5_000_000;
/** A unit with at least these steps is seen also at its quarters: a growth is what happens along the way. */
const LONG_PHASE = 32;

export interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
}

/** What a node of the program did over the whole run. Containers (sequence, markov) do nothing by themselves. */
export interface NodeTrace {
  /** Position in the program, in the order of the XML, from 1. */
  id: number;
  node: Node3;
  depth: number;
  /** Top-level unit: a child of the outer sequences, whatever is under it (a markov is one unit). */
  unit: number;
  /** Steps in which it did something. */
  runs: number;
  /** Cells it changed, counted once per step (a cell changed in two steps counts twice). */
  cells: number;
  box?: Box;
  first: number;
  last: number;
  /** Applications per rule. */
  fired: number[];
  /** «from→to» in the letters of the program → cells. */
  changes: Map<string, number>;
  /** Why it never did anything. */
  why?: string;
}

/** Consecutive steps of one unit. */
export interface Phase {
  unit: number;
  /** The frame before the phase and the one after it. */
  from: number;
  to: number;
  cells: number;
  box?: Box;
}

export interface ProgramTrace {
  seed: number;
  /** The box the program starts in and the one it ends in (a `map` changes it). */
  size: Vec3;
  finalSize: Vec3;
  steps: number;
  finished: boolean;
  ms: number;
  nodes: NodeTrace[];
  phases: Phase[];
  palette: Record<string, PaletteEntry>;
  result: RunResult;
}

export interface TraceOptions {
  /** Milliseconds, default 20 s. Over the game's time the trace says what the program was doing. */
  deadline?: number;
  maxSteps?: number;
  limits?: GridLimits;
}

const widen = (b: Box | undefined, x: number, y: number, z: number): Box => {
  if (!b) return { x0: x, x1: x, y0: y, y1: y, z0: z, z1: z };
  if (x < b.x0) b.x0 = x;
  if (x > b.x1) b.x1 = x;
  if (y < b.y0) b.y0 = y;
  if (y > b.y1) b.y1 = y;
  if (z < b.z0) b.z0 = z;
  if (z > b.z1) b.z1 = z;
  return b;
};
const join = (a: Box | undefined, b: Box | undefined): Box | undefined => (a && b ? { x0: Math.min(a.x0, b.x0), x1: Math.max(a.x1, b.x1), y0: Math.min(a.y0, b.y0), y1: Math.max(a.y1, b.y1), z0: Math.min(a.z0, b.z0), z1: Math.max(a.z1, b.z1) } : (a ?? b));

/** The nodes of a program, in the order of the XML. */
function listNodes(root: Node3): NodeTrace[] {
  const out: NodeTrace[] = [];
  let units = 0;
  const visit = (node: Node3, depth: number, unit: number | undefined) => {
    const opens = unit === undefined && node.type === 'sequence';
    const own = opens ? -1 : (unit ?? units++);
    out.push({ id: out.length + 1, node, depth, unit: own, runs: 0, cells: 0, first: 0, last: 0, fired: [], changes: new Map() });
    if (node.type === 'sequence' || node.type === 'markov') for (const c of node.children) visit(c, depth + 1, opens ? undefined : own);
  };
  visit(root, 0, undefined);
  return out;
}

/** Runs a program and says what each node did. The grid in `result` is the one the same run gives without a trace. */
export function traceProgram(model: Pick<MjxModel, 'program'>, seed: number, opts: TraceOptions = {}): ProgramTrace {
  const nodes = listNodes(model.program.program);
  const byNode = new Map(nodes.map((n) => [n.node, n]));
  const phases: Phase[] = [];
  let shadow = new Uint8Array(0);
  let shadowX = 0, shadowY = 0;
  let size: Vec3 = [0, 0, 0];
  let step = 0;
  const watch: RunWatch = {
    start(g) {
      shadow = new Uint8Array(g.cells);
      shadowX = g.X;
      shadowY = g.Y;
      size = [g.X, g.Y, g.Z];
    },
    step({ node, grid: g, from, epoch, fired }) {
      step++;
      const n = byNode.get(node)!;
      let cells = 0;
      let box: Box | undefined;
      const see = (idx: number) => {
        const was = shadow[idx], now = g.cells[idx];
        if (was === now) return;
        shadow[idx] = now;
        cells++;
        const key = `${g.alphabet[was]}→${g.alphabet[now]}`;
        n.changes.set(key, (n.changes.get(key) ?? 0) + 1);
        const z = Math.floor(idx / (g.X * g.Y));
        box = widen(box, idx % g.X, Math.floor(idx / g.X) % g.Y, z);
      };
      if (g.X !== shadowX || g.Y !== shadowY || g.cells.length !== shadow.length) {
        // A map: another grid. What changed is the whole of it.
        shadow = new Uint8Array(g.cells);
        shadowX = g.X;
        shadowY = g.Y;
        cells = g.cells.reduce((s, c) => s + (c ? 1 : 0), 0);
        box = { x0: 0, x1: g.X - 1, y0: 0, y1: g.Y - 1, z0: 0, z1: g.Z - 1 };
      } else if (g.epoch !== epoch) {
        // The log was emptied during this step: compare everything.
        for (let i = 0; i < g.cells.length; i++) see(i);
      } else for (let l = from; l < g.log.length; l++) see(g.log[l]);
      if (!n.runs) n.first = step;
      n.runs++;
      n.last = step;
      n.cells += cells;
      n.box = join(n.box, box);
      n.fired = [...fired];
      const p = phases[phases.length - 1];
      if (p?.unit === n.unit) {
        p.to = step;
        p.cells += cells;
        p.box = join(p.box, box);
      } else phases.push({ unit: n.unit, from: step - 1, to: step, cells, box: box && { ...box } });
    },
  };
  const result = run(model.program, seed, opts.maxSteps ?? MAX_STEPS, opts.limits ?? FORM_LIMITS, { deadline: opts.deadline ?? TRACE_DEADLINE, watch });
  for (const n of nodes) {
    if (n.runs) continue;
    const what = describe(n.node);
    if (what) n.why = result.unused?.find((u) => u.startsWith(what))?.slice(what.length + 3);
  }
  return { seed, size, finalSize: [result.grid.X, result.grid.Y, result.grid.Z], steps: result.steps, finished: result.finished, ms: result.ms, nodes, phases, palette: model.program.palette, result };
}

export interface Frame {
  step: number;
  X: number;
  Y: number;
  Z: number;
  cells: Uint8Array;
  alphabet: string[];
}

/** The grid after each of these steps (0 is before the first). The same seed gives the same run: a frame costs a run, not memory all along. */
export function framesAt(model: Pick<MjxModel, 'program'>, seed: number, steps: readonly number[], opts: TraceOptions = {}): Map<number, Frame> {
  const wanted = new Set(steps);
  const out = new Map<number, Frame>();
  let step = 0;
  const take = (g: Grid3) => {
    if (wanted.has(step)) out.set(step, { step, X: g.X, Y: g.Y, Z: g.Z, cells: new Uint8Array(g.cells), alphabet: g.alphabet });
  };
  const last = Math.max(0, ...steps);
  run(model.program, seed, last, opts.limits ?? FORM_LIMITS, {
    // Three times the first run's: a frame the first run reached is not lost to a slower machine.
    deadline: (opts.deadline ?? TRACE_DEADLINE) * 3,
    watch: {
      start: take,
      step: ({ grid }) => {
        step++;
        take(grid);
      },
    },
  });
  return out;
}

/**
 * Cells with the same non-zero label grouped in boxes that do not overlap, greedily: along x, then y, then z. The largest first.
 */
export function boxesOf(X: number, Y: number, Z: number, label: ArrayLike<number>): Array<Box & { label: number; cells: number }> {
  const seen = new Uint8Array(X * Y * Z);
  const XY = X * Y;
  const out: Array<Box & { label: number; cells: number }> = [];
  for (let z = 0; z < Z; z++)
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++) {
        const i = x + y * X + z * XY;
        const v = label[i];
        if (!v || seen[i]) continue;
        const free = (a: number, b: number, c: number) => {
          const j = a + b * X + c * XY;
          return label[j] === v && !seen[j];
        };
        let x1 = x;
        while (x1 + 1 < X && free(x1 + 1, y, z)) x1++;
        let y1 = y;
        grow: while (y1 + 1 < Y) {
          for (let a = x; a <= x1; a++) if (!free(a, y1 + 1, z)) break grow;
          y1++;
        }
        let z1 = z;
        rise: while (z1 + 1 < Z) {
          for (let b = y; b <= y1; b++) for (let a = x; a <= x1; a++) if (!free(a, b, z1 + 1)) break rise;
          z1++;
        }
        for (let c = z; c <= z1; c++) for (let b = y; b <= y1; b++) for (let a = x; a <= x1; a++) seen[a + b * X + c * XY] = 1;
        out.push({ label: v, x0: x, x1, y0: y, y1, z0: z, z1, cells: (x1 - x + 1) * (y1 - y + 1) * (z1 - z + 1) });
      }
  return out.sort((a, b) => b.cells - a.cells);
}

/**
 * Tokens of a text, estimated: no tokenizer runs offline. Letters by fours, digits by threes, a run of one letter by threes, each mark and each newline one, all by `TOKEN_SCALE`:
 * against the input a model really counted, on the traces of lab/banco/traccia.md, the sum alone stayed 20-36 % under. Scaled it stays above, so a ceiling in these tokens holds in real ones.
 */
const TOKEN_SCALE = 1.4;

export function estimateTokens(text: string): number {
  let n = 0;
  for (const m of text.match(/(.)\1{3,}|[\p{L}]+|\d+|\n|[^\s\p{L}\d]/gu) ?? []) {
    if (m === '\n') n += 1;
    else if (/^(.)\1{3,}$/su.test(m)) n += Math.ceil(m.length / 3);
    else if (/^\p{L}/u.test(m)) n += Math.ceil(m.length / 4);
    else if (/^\d/.test(m)) n += Math.ceil(m.length / 3);
    else n += 1;
  }
  return Math.ceil(n * TOKEN_SCALE);
}

// ---------------------------------------------------------------- text

const span = (a: number, b: number) => (a === b ? `${a}` : `${a}-${b}`);
const showBox = (b: Box) => `x${span(b.x0, b.x1)} y${span(b.y0, b.y1)} z${span(b.z0, b.z1)}`;
/** A pattern as the program writes it: the top layer first. The engine holds it bottom first, with air as '.'. */
const written = (s: string) => s.split(' ').reverse().join(' ');
const short = (s: string, n = 48) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** One line for a node, without what it did. */
export function nodeName(node: Node3): string {
  switch (node.type) {
    case 'one':
    case 'all':
    case 'prl': {
      const r = node.rules[0];
      return `${node.type} ${short(written(r.in))} → ${short(written(r.out))}${node.rules.length > 1 ? ` (+${node.rules.length - 1})` : ''}${node.steps !== undefined && Number.isFinite(node.steps) ? ` passi=${node.steps}` : ''}`;
    }
    case 'conv':
      return `convolution ${node.rules.map((r) => `${r.in}→${r.out}${r.sums ? ` se ${r.neighbors} in [${r.sums.join(',')}]` : ''}`).slice(0, 2).join('; ')}${node.rules.length > 2 ? ` (+${node.rules.length - 2})` : ''}`;
    case 'path':
      return `path da ${node.from} a ${node.to} su ${node.on} colore ${node.color}${node.inertia ? ' inerzia' : ''}${node.longest ? ' piu-lungo' : ''}`;
    case 'map':
      return `map scala ${node.scale.join(' ')}`;
    case 'shape':
      return node.shape === 'line' ? `line ${node.at.join(' ')} → ${node.to?.join(' ')} ${node.color}` : `${node.shape} at ${node.at.join(' ')} size ${node.size?.join(' ')} ${node.color}${node.on ? ` su ${node.on}` : ''}`;
    default:
      return node.type;
  }
}

/** What the rules of a node did, when it has more than one: the rule that never applies is the interesting one. */
function ruleLines(n: NodeTrace, pad: string): string[] {
  const node = n.node;
  if (n.fired.length < 2 || (node.type !== 'one' && node.type !== 'all' && node.type !== 'prl' && node.type !== 'conv')) return [];
  const names = node.type === 'conv' ? node.rules.map((r) => `${r.in}→${r.out}`) : node.rules.map((r) => `${short(written(r.in), 32)} → ${short(written(r.out), 32)}`);
  return [`${pad}  ${names.map((name, i) => `r${i + 1} ${name} ×${n.fired[i]}`).join('; ')}`];
}

function changesText(changes: Map<string, number>, most = 4): string {
  const list = [...changes].sort((a, b) => b[1] - a[1]);
  return `${list.slice(0, most).map(([k, v]) => `${k} ${v}`).join(', ')}${list.length > most ? `, +${list.length - most}` : ''}`;
}

function nodeLine(n: NodeTrace, changes = true): string[] {
  const pad = ' '.repeat(n.depth);
  if (n.node.type === 'sequence' || n.node.type === 'markov') return [`${pad}#${n.id} ${n.node.type}`];
  const where = n.box ? ` ${showBox(n.box)}` : '';
  return [`${pad}#${n.id} ${nodeName(n.node)}: ×${n.runs}, ${n.cells} celle${where}, passi ${span(n.first, n.last)}${changes && n.changes.size ? `, ${changesText(n.changes)}` : ''}`, ...ruleLines(n, pad)];
}

/** Consecutive phases shown together: one phase with its nodes, or several merged into a line. */
interface Group {
  phases: Phase[];
}

function splitLong(groups: Group[]): Array<{ from: number; to: number; group: Group; part?: string }> {
  const out: Array<{ from: number; to: number; group: Group; part?: string }> = [];
  for (const g of groups) {
    const from = g.phases[0].from, to = g.phases[g.phases.length - 1].to;
    if (g.phases.length === 1 && to - from >= LONG_PHASE) {
      for (let q = 0; q < 4; q++) out.push({ from: from + Math.floor(((to - from) * q) / 4), to: from + Math.floor(((to - from) * (q + 1)) / 4), group: g, part: `${q + 1}/4` });
    } else out.push({ from, to, group: g });
  }
  return out;
}

/** The kinds of node in a group, as «box×20, one×3». */
function kinds(nodes: NodeTrace[]): string {
  const count = new Map<string, number>();
  for (const n of nodes) {
    const k = n.node.type === 'shape' ? n.node.shape : n.node.type;
    count.set(k, (count.get(k) ?? 0) + 1);
  }
  return [...count].map(([k, v]) => `${k}×${v}`).join(', ');
}

/** What is lost by merging two neighbours: a plain shape says nothing the program does not say already, a rule node says what only the run knows. */
function mergeCost(t: ProgramTrace, a: Group, b: Group): number {
  const of = (g: Group) => t.nodes.filter((n) => g.phases.some((p) => p.unit === n.unit) && n.runs);
  const nodes = [...of(a), ...of(b)];
  if (nodes.some((n) => n.node.type === 'map')) return 1e15;
  const cells = (g: Group) => g.phases.reduce((s, p) => s + p.cells, 0);
  return (nodes.some((n) => n.node.type !== 'shape') ? 1e9 : 0) + cells(a) + cells(b);
}

function mergeCheapest(t: ProgramTrace, groups: Group[], howMany: number): Group[] {
  let out = groups;
  for (let k = 0; k < howMany && out.length > 1; k++) {
    let best = 0, cost = Infinity;
    for (let i = 0; i + 1 < out.length; i++) {
      const c = mergeCost(t, out[i], out[i + 1]);
      if (c < cost) {
        cost = c;
        best = i;
      }
    }
    if (cost >= 1e15) break;
    out = [...out.slice(0, best), { phases: [...out[best].phases, ...out[best + 1].phases] }, ...out.slice(best + 2)];
  }
  return out;
}

function groupLines(t: ProgramTrace, g: Group, changes = true): string[] {
  const units = new Set(g.phases.map((p) => p.unit));
  const nodes = t.nodes.filter((n) => units.has(n.unit));
  const fired = nodes.filter((n) => n.runs > 0 && n.node.type !== 'sequence' && n.node.type !== 'markov');
  if (g.phases.length === 1) return nodes.filter((n) => n.runs > 0 || n.node.type === 'sequence' || n.node.type === 'markov').flatMap((n) => nodeLine(n, changes));
  const box = g.phases.reduce<Box | undefined>((b, p) => join(b, p.box), undefined);
  const cells = g.phases.reduce((s, p) => s + p.cells, 0);
  return [`#${fired[0].id}-${fired[fired.length - 1].id} ${kinds(fired)}: ${cells} celle${box ? ` ${showBox(box)}` : ''}, passi ${g.phases[0].from + 1}-${g.phases[g.phases.length - 1].to}`];
}

function neverLines(t: ProgramTrace): string[] {
  const never = t.nodes.filter((n) => !n.runs && n.node.type !== 'sequence' && n.node.type !== 'markov');
  if (!never.length) return [];
  const most = 12;
  return ['Senza effetto (non hanno mai cambiato una cella):', ...never.slice(0, most).map((n) => `#${n.id} ${nodeName(n.node)}${n.why ? `: ${n.why}` : ''}`), ...(never.length > most ? [`… e altri ${never.length - most}`] : [])];
}

function header(t: ProgramTrace): string[] {
  const used = new Set(t.nodes.flatMap((n) => [...n.changes.keys()].flatMap((k) => k.split('→'))));
  const letters = Object.entries(t.palette).filter(([k]) => used.has(k)).map(([k, v]) => `${k}=${v.name ?? v.color ?? '?'}${v.hidden ? ' (marcatore)' : ''}`);
  const g = t.result.grid;
  const counts = new Map<number, number>();
  for (const c of g.cells) if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
  const tally = [...counts].sort((a, b) => b[1] - a[1]).map(([c, v]) => `${g.alphabet[c]} ${v}`);
  const grown = t.size.join() !== t.finalSize.join() ? ` → ${t.finalSize.join('×')}` : '';
  return [
    `Traccia, seme ${t.seed}: griglia ${t.size.join('×')}${grown}, ${t.nodes.length} nodi, ${t.steps} passi, ${t.finished ? 'finito' : 'NON finito (tempo esaurito)'} in ${t.ms} ms.`,
    'x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell\'ordine dell\'XML; ×n quante volte ha agito.',
    ...(letters.length ? [`Lettere: ${letters.join(', ')}.`] : []),
    ...(tally.length ? [`Alla fine: ${tally.join(', ')}.`] : []),
  ];
}

const size = (lines: string[]) => estimateTokens(lines.join('\n'));

/** Cuts a text to the ceiling, by lines, and says so. */
function cut(lines: string[], ceiling: number): string[] {
  if (size(lines) <= ceiling) return lines;
  const note = '… tagliato: oltre il tetto di token.';
  // Estimating line by line would count the rounding of each: the longest beginning that fits, measured whole.
  let low = 0, high = lines.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (size([...lines.slice(0, mid), note]) <= ceiling) low = mid;
    else high = mid - 1;
  }
  return [...lines.slice(0, low), note];
}

/** The groups, merged until the nodes stay under `budget`. */
function fitGroups(t: ProgramTrace, budget: number, line: (g: Group) => string[] = (g) => groupLines(t, g)): Group[] {
  let groups: Group[] = t.phases.map((p) => ({ phases: [p] }));
  for (let tries = 0; tries < 64 && size(groups.flatMap(line)) > budget && groups.length > 1; tries++) {
    const before = groups.length;
    groups = mergeCheapest(t, groups, Math.max(1, Math.ceil(groups.length / 8)));
    if (groups.length === before) break;
  }
  return groups;
}

// ---------------------------------------------------------------- the forms

/** (a) A plane as rows of letters; runs written `C×12`, equal rows and equal planes folded. `plain` is the same without folding, to measure what folding saves. */
export function sectionLines(f: Frame, opts: { plain?: boolean } = {}): string[][] {
  const planes: Array<{ z0: number; z1: number; text: string[] }> = [];
  const XY = f.X * f.Y;
  for (let z = 0; z < f.Z; z++) {
    const rows: Array<{ y0: number; y1: number; text: string }> = [];
    for (let y = 0; y < f.Y; y++) {
      const parts: string[] = [];
      for (let x = 0, i = y * f.X + z * XY; x < f.X;) {
        const c = f.cells[i];
        let run = 1;
        while (x + run < f.X && f.cells[i + run] === c) run++;
        const ch = c ? f.alphabet[c] : '.';
        parts.push(opts.plain || run < 3 ? ch.repeat(run) : `${ch}×${run}`);
        x += run;
        i += run;
      }
      const text = opts.plain ? parts.join('') : parts.join(' ');
      if (!opts.plain && /^\.[×.\d]*$/.test(text) ) continue;
      const last = rows[rows.length - 1];
      if (!opts.plain && last?.text === text && last.y1 === y - 1) last.y1 = y;
      else rows.push({ y0: y, y1: y, text });
    }
    const text = rows.map((r) => `y${span(r.y0, r.y1)} ${r.text}`);
    const last = planes[planes.length - 1];
    if (!opts.plain && !text.length) continue;
    if (!opts.plain && last && last.z1 === z - 1 && last.text.join('\n') === text.join('\n')) last.z1 = z;
    else planes.push({ z0: z, z1: z, text });
  }
  return planes.map((p) => [`z${span(p.z0, p.z1)}:`, ...p.text]);
}

function sectionsText(f: Frame, budget: number): string[] {
  const planes = sectionLines(f);
  const head = `Fotogramma al passo ${f.step}, sezioni dal basso (righe uguali e piani uguali piegati, C×12 è una fila di 12):`;
  const all = planes.flat();
  if (size(all) + estimateTokens(head) <= budget) return [head, ...all];
  // Over the ceiling: evenly spaced planes, so that what is seen is still the whole height.
  const cost = (p: string[]) => size(p) + 1;
  let keep = planes.length;
  let chosen = planes;
  while (keep > 1) {
    keep--;
    chosen = Array.from({ length: keep }, (_, i) => planes[Math.floor((i * planes.length) / keep)]);
    if (chosen.reduce((s, p) => s + cost(p), 0) + 24 <= budget) break;
  }
  return [head, `(${planes.length - chosen.length} piani su ${planes.length} tolti per il tetto)`, ...chosen.flat()];
}

/** (b) What changed between two frames: for each «letter → letter», the cells and the boxes. */
export function diffLines(a: Frame, b: Frame, most: number): string[] {
  if (a.X !== b.X || a.Y !== b.Y || a.Z !== b.Z) return [`griglia da ${a.X}×${a.Y}×${a.Z} a ${b.X}×${b.Y}×${b.Z}`];
  const ids = new Map<string, number>();
  const names: string[] = [''];
  const label = new Int32Array(a.cells.length);
  for (let i = 0; i < a.cells.length; i++) {
    if (a.cells[i] === b.cells[i]) continue;
    const key = `${a.cells[i] ? a.alphabet[a.cells[i]] : '.'}→${b.cells[i] ? b.alphabet[b.cells[i]] : '.'}`;
    let id = ids.get(key);
    if (id === undefined) {
      id = names.push(key) - 1;
      ids.set(key, id);
    }
    label[i] = id;
  }
  if (!ids.size) return ['  nessuna cella diversa'];
  return boxLines(boxesOf(a.X, a.Y, a.Z, label), names, most);
}

/** One line per label, the one with most cells first, its largest boxes and how much is left out. */
function boxLines(boxes: Array<Box & { label: number; cells: number }>, names: string[], most: number): string[] {
  const byLabel = new Map<number, typeof boxes>();
  for (const b of boxes) byLabel.set(b.label, [...(byLabel.get(b.label) ?? []), b]);
  const total = (l: typeof boxes) => l.reduce((s, b) => s + b.cells, 0);
  return [...byLabel].sort((a, b) => total(b[1]) - total(a[1])).map(([label, list]) => {
    const shown = list.slice(0, most);
    const rest = list.slice(most);
    return `  ${names[label]} ${total(list)}: ${shown.map(showBox).join('; ')}${rest.length ? `; +${rest.length} scatole, ${total(rest)} celle` : ''}`;
  });
}

function differencesText(t: ProgramTrace, model: Pick<MjxModel, 'program'>, groups: Group[], most: number, opts: TraceOptions): string[] {
  const parts = splitLong(groups);
  const frames = framesAt(model, t.seed, [...new Set(parts.flatMap((p) => [p.from, p.to]))], opts);
  const out: string[] = [];
  let last: Group | undefined;
  for (const p of parts) {
    if (p.group !== last) out.push(...groupLines(t, p.group, false));
    last = p.group;
    const a = frames.get(p.from), b = frames.get(p.to);
    if (p.part) out.push(` parte ${p.part}, passi ${p.from + 1}-${p.to}:`);
    if (a && b) out.push(...diffLines(a, b, most));
  }
  return out;
}

/** (c) A frame as a static model: the voxels of each letter grouped in boxes. */
export function boxesText(f: Frame, most: number): string[] {
  const names = f.alphabet.map((c, i) => (i ? c : ''));
  return boxLines(boxesOf(f.X, f.Y, f.Z, f.cells), names, most);
}

export interface TraceTextOptions extends TraceOptions {
  forma?: TraceForm;
  /** Ceiling in estimated tokens. */
  tetto?: number;
  /** The frame of `sezioni` and `scatole`: the step, the last if not said. */
  passo?: number;
}

/** The trace as text, under the ceiling. */
export function traceText(model: Pick<MjxModel, 'program'>, seed: number, opts: TraceTextOptions = {}): string {
  return renderTrace(traceProgram(model, seed, opts), model, opts);
}

export function renderTrace(t: ProgramTrace, model: Pick<MjxModel, 'program'>, opts: TraceTextOptions = {}): string {
  const forma = opts.forma ?? DEFAULT_FORM;
  const tetto = opts.tetto ?? DEFAULT_CEILING;
  const top = header(t);
  const never = neverLines(t);
  const room = tetto - size(top) - size(never) - 8;
  const finish = (body: string[]) => cut([...top, ...body, ...never], tetto).join('\n');
  if (room <= 0) return finish([]);
  if (forma === 'nodi') return finish(fitGroups(t, room).flatMap((g) => groupLines(t, g)));
  if (forma === 'differenze') {
    // Fewer groups and fewer boxes per letter until it fits: every try is a run, four are enough before cutting.
    let body: string[] = [];
    for (const [share, most] of [[0.5, 4], [0.35, 3], [0.2, 2], [0.1, 1]] as const) {
      body = differencesText(t, model, fitGroups(t, room * share), most, opts);
      if (size(body) <= room) break;
    }
    return finish(body);
  }
  const step = Math.max(0, Math.min(opts.passo ?? t.steps, t.steps));
  const frame = framesAt(model, t.seed, [step], opts).get(step);
  const nodes = fitGroups(t, room * 0.35).flatMap((g) => groupLines(t, g));
  const left = room - size(nodes);
  if (!frame) return finish([...nodes, `Il fotogramma al passo ${step} non si è potuto rifare.`]);
  if (forma === 'sezioni') return finish([...nodes, ...sectionsText(frame, left)]);
  const head = `Fotogramma al passo ${frame.step}, ogni lettera in scatole che non si sovrappongono:`;
  let most = 64;
  let lines = boxesText(frame, most);
  while (size(lines) > left && most > 1) {
    most = Math.floor(most / 2);
    lines = boxesText(frame, most);
  }
  return finish([...nodes, head, ...lines]);
}
