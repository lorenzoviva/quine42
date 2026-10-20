// A small MarkovJunior-style rewrite engine (https://github.com/mxgmn/MarkovJunior).
// A program is a tree of nodes rewriting a grid of tile codes with local rules `in → out`.
// The engine is kernel; the programs are universe data, written by the Cartographer.
//
// Rules: patterns of equal size, rows separated by '/'. In an input pattern '*' matches anything and
// "[gp]" matches any listed code; in an output pattern '*' leaves the cell unchanged.
// Nodes:
//   one      — apply one random match per step (MarkovJunior "exists")
//   all      — apply a maximal set of non-overlapping matches per step ("forall")
//   prl      — apply every match at once, each with probability p
//   sequence — run children in order, each until it can do nothing more
//   markov   — every step, run the first child that can do something
//   path     — draw a shortest path of `color` from a `from` cell to the nearest `to` cell over `on` cells
// `steps` limits how many times a node may apply; `symmetry` ("all" by default) also tries rotations
// and mirrors of each rule.

import { Rng } from './rng';

export interface MjRule {
  in: string;
  out: string;
  /** Probability (prl) or weight (one) of the rule. */
  p?: number;
}

export type MjNode =
  | { type: 'one' | 'all' | 'prl'; rules: MjRule[]; steps?: number; symmetry?: 'all' | 'none' }
  | { type: 'sequence' | 'markov'; children: MjNode[] }
  | { type: 'path'; from: string; to: string; on: string; color: string; steps?: number };

export interface MjGrid {
  w: number;
  h: number;
  cells: string[];
  /** Cells the program may read but never write (borders shared with neighbours, gates). */
  fixed?: Set<number>;
}

interface Pattern {
  w: number;
  h: number;
  /** Per cell: null = any, otherwise the set of accepted codes. */
  input: Array<string | null>;
  /** Per cell: null = keep. */
  output: Array<string | null>;
  p: number;
}

export class MjError extends Error {}

function parseRows(src: string, isInput: boolean): Array<Array<string | null>> {
  return src.split('/').map((row) => {
    const cells: Array<string | null> = [];
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '[' && isInput) {
        const end = row.indexOf(']', i);
        if (end < 0) throw new MjError(`"[" senza "]" in ${src}`);
        cells.push(row.slice(i + 1, end));
        i = end;
      } else cells.push(ch === '*' ? null : ch);
    }
    return cells;
  });
}

function parseRule(rule: MjRule): Pattern {
  if (typeof rule?.in !== 'string' || typeof rule?.out !== 'string') throw new MjError('regola senza in/out');
  const i = parseRows(rule.in, true);
  const o = parseRows(rule.out, false);
  const h = i.length;
  const w = i[0].length;
  if (o.length !== h || i.some((r) => r.length !== w) || o.some((r) => r.length !== w)) throw new MjError(`in e out devono avere la stessa forma: ${rule.in} = ${rule.out}`);
  if (w * h > 144) throw new MjError(`regola troppo grande (max 12×12): ${rule.in}`);
  return { w, h, input: i.flat(), output: o.flat(), p: rule.p ?? 1 };
}

function transform(p: Pattern, fn: (x: number, y: number) => [number, number], w: number, h: number): Pattern {
  const input = new Array<string | null>(w * h);
  const output = new Array<string | null>(w * h);
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      const [nx, ny] = fn(x, y);
      input[ny * w + nx] = p.input[y * p.w + x];
      output[ny * w + nx] = p.output[y * p.w + x];
    }
  return { w, h, input, output, p: p.p };
}

/** The 8 symmetries of the square (rotations and mirrors), deduplicated. */
function variants(p: Pattern): Pattern[] {
  const rot = (q: Pattern) => transform(q, (x, y) => [q.h - 1 - y, x], q.h, q.w);
  const mirror = (q: Pattern) => transform(q, (x, y) => [q.w - 1 - x, y], q.w, q.h);
  const out: Pattern[] = [];
  const seen = new Set<string>();
  let q = p;
  for (let r = 0; r < 4; r++) {
    for (const v of [q, mirror(q)]) {
      const key = `${v.w}x${v.h}|${v.input.join(',')}|${v.output.join(',')}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(v);
      }
    }
    q = rot(q);
  }
  return out;
}

interface Match {
  pattern: Pattern;
  x: number;
  y: number;
}

abstract class Runner {
  count = 0;
  constructor(protected limit?: number) {}
  reset(): void {
    this.count = 0;
  }
  /** One step: true if the node changed the grid. */
  abstract go(g: MjGrid, rng: Rng): boolean;
}

class RuleRunner extends Runner {
  private patterns: Pattern[];
  constructor(
    private kind: 'one' | 'all' | 'prl',
    rules: MjRule[],
    limit: number | undefined,
    symmetry: 'all' | 'none',
  ) {
    super(limit);
    if (!Array.isArray(rules) || !rules.length) throw new MjError(`nodo ${kind} senza regole`);
    this.patterns = rules.map(parseRule).flatMap((p) => (symmetry === 'none' ? [p] : variants(p)));
  }

  private matches(g: MjGrid): Match[] {
    const out: Match[] = [];
    for (const pattern of this.patterns) {
      for (let y = 0; y + pattern.h <= g.h; y++)
        for (let x = 0; x + pattern.w <= g.w; x++) {
          let ok = true;
          let changes = false;
          for (let j = 0; j < pattern.h && ok; j++)
            for (let i = 0; i < pattern.w && ok; i++) {
              const k = j * pattern.w + i;
              const idx = (y + j) * g.w + x + i;
              const cell = g.cells[idx];
              const want = pattern.input[k];
              if (want !== null && !want.includes(cell)) ok = false;
              const put = pattern.output[k];
              if (put !== null && put !== cell) {
                if (g.fixed?.has(idx)) ok = false;
                changes = true;
              }
            }
          if (ok && changes) out.push({ pattern, x, y });
        }
    }
    return out;
  }

  private apply(g: MjGrid, m: Match, written?: Set<number>): boolean {
    const cells: number[] = [];
    for (let j = 0; j < m.pattern.h; j++)
      for (let i = 0; i < m.pattern.w; i++) {
        const idx = (m.y + j) * g.w + m.x + i;
        if (written?.has(idx)) return false;
        cells.push(idx);
      }
    cells.forEach((idx, k) => {
      const put = m.pattern.output[k];
      if (put !== null) g.cells[idx] = put;
      written?.add(idx);
    });
    return true;
  }

  go(g: MjGrid, rng: Rng): boolean {
    if (this.limit !== undefined && this.count >= this.limit) return false;
    const ms = this.matches(g);
    if (!ms.length) return false;
    if (this.kind === 'one') {
      const total = ms.reduce((s, m) => s + m.pattern.p, 0);
      let r = rng.next() * total;
      const pick = ms.find((m) => (r -= m.pattern.p) < 0) ?? ms[ms.length - 1];
      this.apply(g, pick);
    } else if (this.kind === 'all') {
      const written = new Set<number>();
      for (let i = ms.length - 1; i > 0; i--) {
        const j = rng.int(i + 1);
        [ms[i], ms[j]] = [ms[j], ms[i]];
      }
      for (const m of ms) this.apply(g, m, written);
    } else {
      let any = false;
      const snapshot = [...g.cells];
      for (const m of ms) {
        if (rng.next() >= m.pattern.p) continue;
        any = true;
        for (let j = 0; j < m.pattern.h; j++)
          for (let i = 0; i < m.pattern.w; i++) {
            const put = m.pattern.output[j * m.pattern.w + i];
            if (put !== null) g.cells[(m.y + j) * g.w + m.x + i] = put;
          }
      }
      if (!any) {
        g.cells = snapshot;
        return false;
      }
    }
    this.count++;
    return true;
  }
}

class PathRunner extends Runner {
  constructor(private node: { from: string; to: string; on: string; color: string }, limit?: number) {
    super(limit ?? 1);
    for (const k of ['from', 'to', 'on', 'color'] as const) if (typeof node[k] !== 'string' || !node[k]) throw new MjError(`path: manca "${k}"`);
  }

  go(g: MjGrid, rng: Rng): boolean {
    if (this.limit !== undefined && this.count >= this.limit) return false;
    const starts = g.cells.map((c, i) => (this.node.from.includes(c) ? i : -1)).filter((i) => i >= 0);
    for (let s = starts.length - 1; s > 0; s--) {
      const j = rng.int(s + 1);
      [starts[s], starts[j]] = [starts[j], starts[s]];
    }
    for (const start of starts) {
      const prev = new Map<number, number>([[start, -1]]);
      const queue = [start];
      let end = -1;
      while (queue.length && end < 0) {
        const cur = queue.shift()!;
        const x = cur % g.w;
        const y = Math.floor(cur / g.w);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= g.w || ny >= g.h) continue;
          const n = ny * g.w + nx;
          if (prev.has(n)) continue;
          if (this.node.to.includes(g.cells[n])) {
            prev.set(n, cur);
            end = n;
            break;
          }
          if (!this.node.on.includes(g.cells[n]) || g.fixed?.has(n)) continue;
          prev.set(n, cur);
          queue.push(n);
        }
      }
      if (end < 0) continue;
      let changed = false;
      for (let c = prev.get(end)!; c !== start && c >= 0; c = prev.get(c)!) {
        if (g.cells[c] !== this.node.color) {
          g.cells[c] = this.node.color;
          changed = true;
        }
      }
      if (changed) {
        this.count++;
        return true;
      }
    }
    return false;
  }
}

class SequenceRunner extends Runner {
  private index = 0;
  constructor(private children: Runner[]) {
    super();
  }
  reset(): void {
    super.reset();
    this.index = 0;
    for (const c of this.children) c.reset();
  }
  go(g: MjGrid, rng: Rng): boolean {
    while (this.index < this.children.length) {
      if (this.children[this.index].go(g, rng)) return true;
      this.index++;
      if (this.index < this.children.length) this.children[this.index].reset();
    }
    return false;
  }
}

class MarkovRunner extends Runner {
  constructor(private children: Runner[]) {
    super();
  }
  reset(): void {
    super.reset();
    for (const c of this.children) c.reset();
  }
  go(g: MjGrid, rng: Rng): boolean {
    for (const c of this.children) if (c.go(g, rng)) return true;
    return false;
  }
}

export function compile(node: MjNode, depth = 0): Runner {
  if (depth > 12) throw new MjError('programma troppo annidato');
  if (!node || typeof node !== 'object') throw new MjError('nodo non valido');
  switch (node.type) {
    case 'one':
    case 'all':
    case 'prl':
      // A probability is meant once: prl applies a single time unless steps says otherwise.
      return new RuleRunner(node.type, node.rules, node.steps ?? (node.type === 'prl' ? 1 : undefined), node.symmetry ?? 'all');
    case 'path':
      return new PathRunner(node, node.steps);
    case 'sequence':
    case 'markov': {
      if (!Array.isArray(node.children) || !node.children.length) throw new MjError(`nodo ${node.type} senza figli`);
      const children = node.children.map((c) => compile(c, depth + 1));
      return node.type === 'sequence' ? new SequenceRunner(children) : new MarkovRunner(children);
    }
    default:
      throw new MjError(`tipo di nodo sconosciuto: ${(node as { type: string }).type}`);
  }
}

/** Runs a program on the grid (in place). Returns the number of steps taken. */
export function run(node: MjNode, g: MjGrid, seed: number, maxSteps = 4000): number {
  const root = compile(node);
  root.reset();
  const rng = new Rng(seed);
  let steps = 0;
  while (steps < maxSteps && root.go(g, rng)) steps++;
  return steps;
}

const cellsOf = (row: string) => row.match(/\[[^\]]*\]|./g) ?? [];

/**
 * Models do not count characters: rows of different lengths, outputs shaped unlike inputs, node
 * types that do not exist. Small mistakes are mended (missing output cells become '*' = keep,
 * extra ones are cut); what cannot be understood is dropped. Returns null if nothing is left.
 */
export function repairProgram(node: unknown, notes: string[] = [], depth = 0): MjNode | null {
  const n = node as any;
  if (!n || typeof n !== 'object' || depth > 12) return null;
  if (n.type === 'sequence' || n.type === 'markov') {
    const children = (Array.isArray(n.children) ? n.children : []).map((c: unknown) => repairProgram(c, notes, depth + 1)).filter(Boolean);
    return children.length ? { type: n.type, children } : null;
  }
  if (n.type === 'path') return typeof n.from === 'string' && typeof n.to === 'string' && typeof n.on === 'string' && typeof n.color === 'string' && n.color.length === 1 ? { ...n } : (notes.push('path incompleto rimosso'), null);
  if (n.type === 'one' || n.type === 'all' || n.type === 'prl') {
    const rules: MjRule[] = [];
    for (const r of Array.isArray(n.rules) ? n.rules : []) {
      if (typeof r?.in !== 'string' || typeof r?.out !== 'string') continue;
      const inRows = r.in.split('/').map(cellsOf);
      const width = Math.max(...inRows.map((x: string[]) => x.length));
      if (!width || inRows.length * width > 144) {
        notes.push(`regola troppo grande rimossa: ${r.in.slice(0, 30)}`);
        continue;
      }
      const fit = (row: string[]) => [...row.slice(0, width), ...Array(Math.max(0, width - row.length)).fill('*')].join('');
      const outRows = r.out.split('/').map(cellsOf);
      const fixedIn = inRows.map(fit);
      const fixedOut = inRows.map((_: unknown, i: number) => fit((outRows[i] ?? []).map((c: string) => (c.startsWith('[') ? '*' : c))));
      if (fixedIn.join('/') !== r.in || fixedOut.join('/') !== r.out) notes.push(`regola riparata: ${r.in.slice(0, 20)}…`);
      rules.push({ in: fixedIn.join('/'), out: fixedOut.join('/'), ...(typeof r.p === 'number' ? { p: r.p } : {}) });
    }
    if (!rules.length) return null;
    return { type: n.type, rules, ...(Number.isInteger(n.steps) ? { steps: n.steps } : {}), ...(n.symmetry === 'none' ? { symmetry: 'none' as const } : {}) };
  }
  notes.push(`nodo sconosciuto "${n.type}" rimosso`);
  return null;
}

/** Every code a program can write. */
export function writtenCodes(node: MjNode): Set<string> {
  const out = new Set<string>();
  const walk = (n: MjNode) => {
    if (n.type === 'sequence' || n.type === 'markov') n.children.forEach(walk);
    else if (n.type === 'path') out.add(n.color);
    else if ("rules" in n) for (const r of n.rules) for (const ch of r.out.replace(/[/*]/g, "")) out.add(ch);
  };
  walk(node);
  return out;
}
