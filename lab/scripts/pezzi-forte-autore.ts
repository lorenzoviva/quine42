// The three `<pieces>` of the author's fort (T469, lab/banco/pezzi/README.md «Come si usa `<pieces>`»): the file is read, never written.
// For each pieces node: the program up to the end of that node, the pieces before it run as sequences (so the same seed draws the same
// numbers until the node), run in pieces and as a sequence on the whole grid, voxel by voxel, at several margins: what changes, where, and
// the least margin that gives the whole grid. Then the whole fort as it is and without its pieces: time, steps, what changes.
//
//   npx vite-node lab/scripts/pezzi-forte-autore.ts -- [--file lab/mjx/models/handmade/forte-handmade.xml] [--semi 1,2] [--margini 0,8,16,24,32,40] [--nodi 1,2,3] [--senza-forte] [--tempi] [--json lab/banco/pezzi/misure/forte-autore.json]
//   --tempi: where the time of the whole fort goes, without its pieces, cut at every stage (the plan, the map to the voxels, each node)

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { run, type Grid3, type GridLimits } from '../../src/mj/engine';
import { compileMjx } from '../../src/mj/model';
import { FORM_LIMITS, FORM_PIECES } from '../../src/mj/run';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const FILE = opt('file') ?? 'lab/mjx/models/handmade/forte-handmade.xml';
const SEMI = (opt('semi') ?? '1,2').split(',').map(Number);
const MARGINI = (opt('margini') ?? '0,8,16,24,32,40').split(',').map(Number);
/** The pieces nodes to look at, from 1; all if not said. */
const NODI = opt('nodi')?.split(',').map(Number);
/** The pieces run as the game makes its forms; the whole grid with limits as large as it needs (as `banco-pezzi.ts`). */
const PIECES: GridLimits = { ...FORM_LIMITS, pieces: FORM_PIECES };
const WHOLE: GridLimits = { side: 4096, cells: 256_000_000 };

const xml = fs.readFileSync(FILE, 'utf8');
const fingerprint = createHash('sha1').update(xml).digest('hex').slice(0, 12);

/** Where every `<pieces …>` opens and its `</pieces>` closes (they are never one inside the other). */
const opens = [...xml.matchAll(/<pieces\b[^>]*>/g)].map((m) => ({ at: m.index!, tag: m[0] }));
const closes = [...xml.matchAll(/<\/pieces>/g)].map((m) => m.index!);
if (opens.length !== closes.length) throw new Error('pieces aperti e chiusi in numero diverso');
/** Where the map at full scale closes: what comes after a node cut there is the closing of the maps, the colours, the root. */
const innerClose = xml.lastIndexOf('</map>', xml.lastIndexOf('</map>') - 1);

/**
 * The program with the pieces nodes before `k` as sequences, the k-th as pieces with `margin` (or as a sequence, `margin` undefined),
 * and everything after it, up to the closing of the full-scale map, cut.
 */
function upTo(k: number, margin: number | undefined): string {
  let out = '';
  let from = 0;
  for (let j = 0; j <= k; j++) {
    const o = opens[j];
    const tag = j < k || margin === undefined ? '<sequence>' : o.tag.replace(/\smargin="\d+"/, ` margin="${margin}"`);
    out += xml.slice(from, o.at) + tag + xml.slice(o.at + o.tag.length, closes[j]) + (j < k || margin === undefined ? '</sequence>' : '</pieces>');
    from = closes[j] + '</pieces>'.length;
  }
  return out + '\n    ' + xml.slice(innerClose);
}

const senzaPezzi = (s: string) => s.replace(/<pieces\b[^>]*>/g, '<sequence>').replace(/<\/pieces>/g, '</sequence>');

interface Corsa {
  grid: Grid3;
  ms: number;
  finished: boolean;
  steps: number;
  pezzi?: number;
  pezzoLento?: number;
  pezziMs?: number;
}
function corsa(src: string, seed: number, limits: GridLimits): Corsa {
  const m = compileMjx(src, {});
  const t0 = performance.now();
  const r = run(m.program, seed, 50_000_000, limits, { deadline: 600_000 });
  const ms = Math.round(performance.now() - t0);
  return { grid: r.grid, ms, finished: r.finished, steps: r.steps, ...(r.pieces ? { pezzi: r.pieces.length, pezzoLento: Math.max(...r.pieces.map((p) => p.ms)), pezziMs: r.pieces.reduce((s, p) => s + p.ms, 0) } : {}) };
}

/** Voxels where two grids differ, by letter pair (`a>b`: the whole grid's letter, then the pieces'), and the columns of the borders they touch. */
function confronta(a: Grid3, b: Grid3, piece: number): { diversi: number; coppie: Record<string, number>; aiBordi: number } {
  let diversi = 0;
  let aiBordi = 0;
  const coppie: Record<string, number> = {};
  const XY = a.X * a.Y;
  for (let i = 0; i < a.cells.length; i++) {
    const x = a.alphabet[a.cells[i]] ?? '.', y = b.alphabet[b.cells[i]] ?? '.';
    if (x === y) continue;
    diversi++;
    const k = `${x === '.' ? 'B' : x}>${y === '.' ? 'B' : y}`;
    coppie[k] = (coppie[k] ?? 0) + 1;
    const c = i % XY, cx = c % a.X, cy = Math.floor(c / a.X);
    // Within the margin of a border between two pieces (40 is the author's margin).
    const near = (v: number) => Math.min(v % piece, piece - (v % piece)) < 40;
    if (near(cx) || near(cy)) aiBordi++;
  }
  return { diversi, coppie, aiBordi };
}

const piece = Number(/piece="(\d+)/.exec(opens[0]?.tag ?? '')?.[1] ?? 128);
console.log(`${FILE} (impronta ${fingerprint}): ${opens.length} nodi <pieces>, ${opens.map((o) => o.tag).join(' · ')}`);
const nodi: unknown[] = [];
for (let k = 0; k < opens.length; k++) {
  if (NODI && !NODI.includes(k + 1)) continue;
  const righe: unknown[] = [];
  for (const seed of SEMI) {
    const intera = corsa(upTo(k, undefined), seed, WHOLE);
    for (const margin of MARGINI) {
      const p = corsa(upTo(k, margin), seed, PIECES);
      const d = confronta(intera.grid, p.grid, piece);
      righe.push({ seme: seed, margine: margin, interaMs: intera.ms, pezziMs: p.ms, pezzi: p.pezzi, pezzoLento: p.pezzoLento, finito: p.finished, ...d });
      console.log(`nodo ${k + 1} seme ${seed} margine ${String(margin).padStart(2)}: ${d.diversi} voxel diversi${d.diversi ? ` (${Object.entries(d.coppie).map(([c, n]) => `${c} ${n}`).join(', ')}; ai bordi dei pezzi ${d.aiBordi})` : ''} · intera ${intera.ms} ms, a pezzi ${p.ms} ms (${p.pezzi} pezzi, il più lento ${p.pezzoLento} ms)`);
    }
  }
  nodi.push({ nodo: k + 1, tag: opens[k].tag, righe });
}

// The whole fort, as it is and without its pieces: after the first pieces node the generator of the run goes another way (the pieces draw
// one number, the sequence one for each choice), so what is at random after it is another draw, as another seed would give.
const forte: unknown[] = [];
for (const seed of args.includes('--senza-forte') ? [] : SEMI) {
  const a = corsa(xml, seed, PIECES);
  const b = corsa(senzaPezzi(xml), seed, WHOLE);
  const d = confronta(b.grid, a.grid, piece);
  forte.push({ seme: seed, pezzi: { ms: a.ms, passi: a.steps, finito: a.finished, pezzi: a.pezzi, pezzoLento: a.pezzoLento, pezziMs: a.pezziMs }, intera: { ms: b.ms, passi: b.steps, finito: b.finished }, ...d });
  console.log(`forte intero, seme ${seed}: a pezzi ${a.ms} ms (${a.pezzi} pezzi, ${a.pezziMs} ms nei pezzi, il più lento ${a.pezzoLento} ms, fuori dai pezzi ${a.ms - (a.pezziMs ?? 0)} ms), senza pezzi ${b.ms} ms; ${d.diversi} voxel diversi (${Object.entries(d.coppie).sort((x, y) => y[1] - x[1]).slice(0, 8).map(([c, n]) => `${c} ${n}`).join(', ')})`);
}
// Where the time goes (`--tempi`): the fort without its pieces, cut after the plan, after the map to the voxels, after each pieces node.
const tempi: Array<{ fin: string; ms: number }> = [];
if (args.includes('--tempi')) {
  const mapAt = xml.search(/<map scale="4 4 4"/);
  const tappe: Array<[string, string]> = [
    ['il piano (A e B, a un quarto)', xml.slice(0, mapAt) + xml.slice(innerClose + '</map>'.length)],
    ['la map ai voxel, senza i nodi a piena scala', xml.slice(0, opens[0].at) + '\n    ' + xml.slice(innerClose)],
    ...opens.map((_, k): [string, string] => [`fino al nodo ${k + 1} compreso`, upTo(k, undefined)]),
    ['il forte intero', senzaPezzi(xml)],
  ];
  for (const [fin, src] of tappe) {
    const ms = Math.min(...SEMI.map((seed) => corsa(src, seed, WHOLE).ms));
    tempi.push({ fin, ms });
    console.log(`tempo, ${fin}: ${ms} ms (il più breve dei semi ${SEMI.join(', ')})`);
  }
}
const warnings = compileMjx(xml, {}).warnings;
console.log(`avvisi del compilatore: ${warnings.length}`);
const out = opt('json');
if (out) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ file: FILE, impronta: fingerprint, griglia: '500×500×148', nodi, forte, tempi, avvisi: warnings }, null, 1));
}
