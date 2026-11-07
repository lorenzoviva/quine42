// The people of the world as one object (T327, ADR-0166): what may come into `src/kernel/npc/` and what it may import. Read from the
// sources as they are, with no build: the import statements of every file of the product (src/, server/, site/, tools/).
//  1. Outside `npc/`, only its two faces are imported: `npc/index.ts` (the behaviour, the facade) and `npc/model.ts` (the data).
//  2. Inside `npc/`, nothing of the kernel's class, the wanderers, the session, the renderer, the UI, the sound, the server, the site,
//     the tools, the lab or the tests: the world comes in through the port (`npc/host.ts`).
//  3. The data (`society`, `plots`, `jobs`, `ventures`, `route`, `model`) know nothing of the behaviour, nor of the agents' code.
//  4. No import cycle (of values: `import type` is gone at run time) passes through a file of `npc/`.
// The tests and the lab are benches: they may open the inside to try one piece.

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..');
const NPC = 'src/kernel/npc/';
const FACES = new Set([`${NPC}index.ts`, `${NPC}model.ts`]);
const DATA = new Set(['society', 'plots', 'jobs', 'ventures', 'route', 'model'].map((f) => `${NPC}${f}.ts`));
const PRODUCT = ['src', 'server', 'site', 'tools'];
const NOT_FOR_NPC = ['src/kernel/kernel.ts', 'src/kernel/wanderers.ts', 'src/session/', 'src/render/', 'src/ui/', 'src/audio/', 'src/main.ts', 'src/master.ts', 'server/', 'site/', 'tools/', 'lab/', 'tests/'];
const EXT = /\.(ts|tsx|mts|js|mjs)$/;

interface Import {
  from: string;
  to: string;
  typeOnly: boolean;
}

function walk(dir: string, out: string[] = []): string[] {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return out;
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.') || e.name === 'dist') continue;
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(rel, out);
    else if (EXT.test(e.name) && !e.name.endsWith('.d.ts')) out.push(rel);
  }
  return out;
}

/** The file a relative specifier names, from the root (undefined for a package, or what is not a source file). */
function resolve(from: string, spec: string): string | undefined {
  if (!spec.startsWith('.')) return undefined;
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(from), spec.split('?')[0]));
  for (const c of [base, `${base}.ts`, `${base}.tsx`, `${base}.mts`, `${base}.js`, `${base}.mjs`, `${base}/index.ts`]) {
    if (EXT.test(c) && fs.existsSync(path.join(ROOT, c))) return c;
  }
  return undefined;
}

/** The imports of a source file: static (`import`, `export … from`), side effects and dynamic ones; type-only when nothing of it runs. */
function importsOf(file: string, text: string): Import[] {
  const out: Import[] = [];
  const add = (spec: string, typeOnly: boolean) => {
    const to = resolve(file, spec);
    if (to) out.push({ from: file, to, typeOnly });
  };
  const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
  for (const m of code.matchAll(/(?:^|[\n;])\s*(import|export)\s+(type\s+)?([^'";]*?)\s*from\s*['"]([^'"]+)['"]/g)) {
    const names = m[3].trim();
    const list = /^\{([\s\S]*)\}$/.exec(names)?.[1];
    const allTypes = list !== undefined && list.split(',').map((s) => s.trim()).filter(Boolean).every((s) => s.startsWith('type '));
    add(m[4], !!m[2] || allTypes);
  }
  for (const m of code.matchAll(/(?:^|[\n;])\s*import\s*['"]([^'"]+)['"]/g)) add(m[1], false);
  for (const m of code.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)) add(m[1], false);
  return out;
}

/** The groups of files that import each other round (strongly connected, more than one file). */
function cycles(edges: ReadonlyArray<{ from: string; to: string }>): string[][] {
  const next = new Map<string, string[]>();
  for (const e of edges) next.set(e.from, [...(next.get(e.from) ?? []), e.to]);
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const stack: string[] = [];
  const on = new Set<string>();
  const out: string[][] = [];
  let n = 0;
  const visit = (v: string) => {
    index.set(v, n);
    low.set(v, n++);
    stack.push(v);
    on.add(v);
    for (const w of next.get(v) ?? []) {
      if (!index.has(w)) {
        visit(w);
        low.set(v, Math.min(low.get(v)!, low.get(w)!));
      } else if (on.has(w)) low.set(v, Math.min(low.get(v)!, index.get(w)!));
    }
    if (low.get(v) === index.get(v)) {
      const group: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        on.delete(w);
        group.push(w);
      } while (w !== v);
      if (group.length > 1) out.push(group.sort());
    }
  };
  for (const v of next.keys()) if (!index.has(v)) visit(v);
  return out;
}

const files = PRODUCT.flatMap((d) => walk(d));
const imports = files.flatMap((f) => importsOf(f, fs.readFileSync(path.join(ROOT, f), 'utf8')));
const inside = (f: string) => f.startsWith(NPC);

describe("l'NPC come oggetto coeso: il confine di src/kernel/npc/ (T327, ADR-0166)", () => {
  it('legge davvero gli import (il test non passa a vuoto)', () => {
    expect(files.length).toBeGreaterThan(150);
    expect(files.filter(inside).length).toBeGreaterThanOrEqual(10);
    expect(imports.length).toBeGreaterThan(800);
    expect(imports).toContainEqual({ from: 'src/kernel/kernel.ts', to: `${NPC}index.ts`, typeOnly: false });
    expect(imports.some((i) => i.from === 'src/kernel/graph.ts' && i.to === `${NPC}model.ts`)).toBe(true);
    const kinds = importsOf(`${NPC}x.ts`, "import type { A } from './host';\nimport { type B, type C } from './host';\nimport { D, type E } from './host';\nimport { F } from './nowhere';").map((i) => i.typeOnly);
    expect(kinds).toEqual([true, true, false]);
  });

  it('fuori dal confine si importano solo le due facce: npc/index.ts e npc/model.ts', () => {
    const wrong = imports.filter((i) => !inside(i.from) && inside(i.to) && !FACES.has(i.to)).map((i) => `${i.from} → ${i.to}`);
    expect(wrong).toEqual([]);
  });

  it('dentro il confine niente kernel, viandanti, sessione, rendering, interfaccia, suono, server', () => {
    const wrong = imports.filter((i) => inside(i.from) && NOT_FOR_NPC.some((p) => (p.endsWith('/') ? i.to.startsWith(p) : i.to === p))).map((i) => `${i.from} → ${i.to}`);
    expect(wrong).toEqual([]);
  });

  it('i dati non sanno niente del comportamento né del codice degli agenti', () => {
    const wrong = imports
      .filter((i) => DATA.has(i.from) && ((inside(i.to) && !DATA.has(i.to)) || (i.to.startsWith('src/kernel/agents/') && !i.typeOnly)))
      .map((i) => `${i.from} → ${i.to}`);
    expect(wrong).toEqual([]);
  });

  it('nessun ciclo di import passa da un file di npc/', () => {
    const run = imports.filter((i) => !i.typeOnly);
    expect(cycles(run).filter((g) => g.some(inside))).toEqual([]);
    // The finder finds them: the cycle of before T327 (society ⇄ wanderers) would be one.
    expect(cycles([{ from: `${NPC}society.ts`, to: 'src/kernel/wanderers.ts' }, { from: 'src/kernel/wanderers.ts', to: `${NPC}society.ts` }, { from: 'src/kernel/wanderers.ts', to: 'src/kernel/paths.ts' }])).toEqual([[`${NPC}society.ts`, 'src/kernel/wanderers.ts']]);
  });
});
