// Our engine against MarkovJunior of mxgmn, node by node (T500, docs/design/markov-allineamento.md, lab/banco/conformita/README.md).
//
// Three engines: the original (the C# of github.com/mxgmn/MarkovJunior at 42aaf24, built as lab/banco/markov/README.md says, in
// lab/out/markov/mj/), the reference (lab/banco/conformita/riferimento.ts, the original line by line in TypeScript, with System.Random) and
// ours (src/mj/engine.ts, never changed here). The original is the truth; the reference is checked against it and then stands in for it
// where .NET is not there (the tests); ours is measured against both.
//
//   npx vite-node lab/scripts/conformita-mj.ts -- --caso [--registra]          System.Random: the copy against .NET (lab/banco/conformita/caso/)
//   npx vite-node lab/scripts/conformita-mj.ts -- --programmi [--registra]     the programs of the differences (c*, and T498's d*): the original,
//                                                                              the reference, ours
//   npx vite-node lab/scripts/conformita-mj.ts -- --modelli [--semi 1,2,3] [--solo A,B] [--originale] [--registra] [--mj]
//                                                                              the 3D models of the original's repository: with --originale the
//                                                                              C# against the reference voxel by voxel, then ours today, compared
//                                                                              by the letters they write (our random numbers are others); with --mj
//                                                                              ours with the switch of the semantics on (T526-T528), against the
//                                                                              reference voxel by voxel, steps and end included (--programmi too)
//   npx vite-node lab/scripts/conformita-mj.ts -- --varianza [--semi 6] [--universi <cartella>] [--solo-concilio]
//                                                                              how much the programs change between seeds: the seed's, the
//                                                                              universes', the author's fort, the original's (in the reference)
//   npx vite-node lab/scripts/conformita-mj.ts -- --censimento [--universi <cartella>]
//                                                                              what of ours the original does not have, what it would read
//                                                                              otherwise, what an export must translate (static, no runs)
// Common: --md f, --json f write the report. --registra writes lab/banco/conformita/uscite.json (what the C# printed). No calls to the
// models; reads the original's clone in lab/out/markov/repo (README) and the universes given, writes only lab/out/conformita/ and the files said.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { CASES, CASO_SEEDS, casoLine, EXAMPLES, gridHash, REPO_3D, SEEDS_OF_CASES } from '../banco/conformita/casi';
import { runReference } from '../banco/conformita/riferimento';
import { OFFICIAL_FILES } from '../mjx/official/index';
import { run, runOn, type Grid3, type Program3 } from '../../src/mj/engine';
import { compileMjx, mjxIncludes } from '../../src/mj/model';
import { originalPort } from '../../src/mj/original';
import { MJX_LIMITS } from '../../src/mj/run';
import { symbolName } from '../../src/mj/symbols';
import { parseXml, type XmlElement } from '../../src/mj/xml';
import { CLASSES } from '../../src/mj/classes';
import { cellarVoxels, entryBox, rootTag, type ModelInfo } from '../../src/kernel/forms';

const args = process.argv.slice(2).filter((a) => a !== '--');
const flag = (k: string) => args.includes(`--${k}`);
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const many = (k: string) => args.flatMap((a, i) => (a === `--${k}` ? [args[i + 1]] : []));

const ROOT = path.resolve('.');
const BENCH = path.join(ROOT, 'lab/banco/conformita');
const PROGRAMS = path.join(BENCH, 'programmi');
const OUT = path.join(ROOT, 'lab/out/conformita');
const REPO = path.join(ROOT, 'lab/out/markov/repo');
const MJ_DLL = path.join(ROOT, 'lab/out/markov/mj/mj.dll');
const CASO_DLL = path.join(OUT, 'caso/caso.dll');
const RECORDED = path.join(BENCH, 'uscite.json');
const FORT = path.join(ROOT, 'docs/userchats/forte-handmade-2026-11-22.xml');

type Vec3 = [number, number, number];
export interface Outcome {
  letters: string;
  steps: number;
  finished: boolean;
}

const flat = (t: string) => t.replace(/\s+/g, '');
const has = (file: string) => fs.existsSync(file);
/**
 * Ours with the switch of the original's semantics on (T526, ADR-0263; the rules and the matches since T527, ADR-0268; the branches since
 * T528, ADR-0273; map, path, convolution, convchain and `d` since T529, ADR-0274).
 */
const MJ = flag('mj');

// ---------------------------------------------------------------- the original (C#)

interface CsRun {
  seed: number;
  steps: number;
  finished: boolean;
  text: string;
}

/** The original's Program.cs (lab/banco/markov/originale/) on a model, for one seed or a range: what it printed, or why not. */
function runCs(xmlFile: string, size: Vec3, seeds: string, steps: number, start?: string, cwd = ROOT): CsRun[] | string {
  let out: string;
  try {
    out = execFileSync('dotnet', [MJ_DLL, xmlFile, ...size.map(String), seeds, String(steps), ...(start ? [start] : [])], { cwd, encoding: 'utf8', maxBuffer: 1 << 30, timeout: 1_200_000, stdio: ['ignore', 'pipe', 'pipe'] }).replace(/\r/g, '');
  } catch (e) {
    const err = String((e as { stderr?: string }).stderr ?? e);
    return `eccezione: ${err.split('\n').find((l) => /Exception/.test(l))?.trim().slice(0, 140) ?? err.slice(0, 140)}`;
  }
  if (!out.includes('GRID')) return `errore: ${out.trim().split('\n').join(' / ').slice(0, 160)}`;
  const runs: CsRun[] = [];
  const lines = out.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('SEED ')) continue;
    const seed = Number(lines[i].slice(5));
    const stepsN = Number(lines[i + 1].slice(6));
    const finished = lines[i + 2].endsWith('true');
    const [, X, Y, Z] = lines[i + 3].split(' ').map(Number);
    const rows = lines.slice(i + 4, i + 4 + Z * Y + (Z - 1));
    runs.push({ seed, steps: stepsN, finished, text: rows.join('\n').trim() });
    void X;
  }
  return runs;
}

// ---------------------------------------------------------------- ours

/**
 * Our engine on a model from a grid written in letters (the first value is the empty cell): its letters, steps and end. `original`: the
 * text is the original's, read as it is (T531, `compileMjx(…, { original: true })`), and its grid is written back in the original's
 * characters; a program of ours (the lab's copies, an example written for both) says false. With --mj the switch is on.
 */
function runOurs(xml: string, size: Vec3, seed: number, steps: number, start?: string, files?: Record<string, string>, original = true): Outcome & { X: number; Y: number; Z: number } {
  const m = compileMjx(xml, { size, ...(files ? { files } : {}), ...(original ? { original: true } : {}), ...(MJ ? { semantics: 'mj' as const } : {}) });
  const values = /values="([^"]*)"/.exec(xml)![1].replace(/\s+/g, '');
  if (start === undefined) {
    const r = run(m.program as Program3, seed, steps, MJX_LIMITS, { deadline: 60_000 });
    // A symbol of ours back to the original's character (`#8` is "8", `#10` the first value that is not a letter: src/mj/original.ts).
    const back = new Map([...(original ? originalPort(xml) : new Map<string, string>())].map(([o, ours]) => [ours, o]));
    const shown = (ch: string) => back.get(symbolName(ch)) ?? symbolName(ch);
    return { letters: Array.from(r.grid.cells, (c) => shown(c === 0 ? m.background : r.grid.alphabet[c])).join(''), steps: r.steps, finished: r.finished, X: r.grid.X, Y: r.grid.Y, Z: r.grid.Z };
  }
  const alpha = ['.', ...[...values].slice(1)];
  const g: Grid3 = { X: size[0], Y: size[1], Z: size[2], cells: new Uint8Array(size[0] * size[1] * size[2]), alphabet: alpha, log: [], epoch: 0 };
  for (let i = 0; i < start.length; i++) g.cells[i] = Math.max(0, alpha.indexOf(start[i] === values[0] ? '.' : start[i]));
  const r = runOn(g, m.program, seed, steps);
  return { letters: Array.from(r.grid.cells, (c) => (c === 0 ? values[0] : r.grid.alphabet[c])).join(''), steps: r.steps, finished: r.finished, X: r.grid.X, Y: r.grid.Y, Z: r.grid.Z };
}

const outcomeText = (o: Outcome | string) => (typeof o === 'string' ? o : `${o.letters} · ${o.steps} passi · ${o.finished ? 'finisce' : 'non finisce'}`);

// ---------------------------------------------------------------- --caso

function caso(report: Report): void {
  if (!has(CASO_DLL)) throw new Error(`manca ${path.relative(ROOT, CASO_DLL)}: costruiscilo come dice lab/banco/conformita/README.md`);
  const draws = 3000;
  const net = execFileSync('dotnet', [CASO_DLL, CASO_SEEDS.join(','), String(draws)], { encoding: 'utf8' }).replace(/\r/g, '').trim().split('\n');
  const ours = CASO_SEEDS.map((s) => casoLine(s, draws));
  const same = net.every((l, i) => l === ours[i]);
  report.md.push(`## System.Random\n\n${CASO_SEEDS.length} semi × ${draws} numeri (Next, Next(n) con dieci n, NextDouble come i suoi 64 bit): ${same ? '**gli stessi di .NET**' : '**diversi**'}.\n`);
  report.json.caso = { seeds: CASO_SEEDS, draws, same };
  if (flag('registra')) record((r) => (r.caso = { seeds: CASO_SEEDS, draws: 60, lines: net.map((l) => l.split(' ').slice(0, 62).join(' ')) }));
  console.log(same ? 'System.Random: uguale a .NET' : 'System.Random: DIVERSO');
}

// ---------------------------------------------------------------- --programmi

interface Recorded {
  caso?: { seeds: number[]; draws: number; lines: string[] };
  programmi?: Record<string, Record<string, Outcome | string>>;
  esempi?: Record<string, Record<string, { steps: number; finished: boolean; hash: string }>>;
  modelli?: Record<string, { size: Vec3; steps: number; seeds: Record<string, { steps: number; finished: boolean; hash: string }> }>;
}
const recorded = (): Recorded => (has(RECORDED) ? JSON.parse(fs.readFileSync(RECORDED, 'utf8')) : {});
function record(f: (r: Recorded) => void): void {
  const r = recorded();
  f(r);
  fs.writeFileSync(RECORDED, `${JSON.stringify(r, null, 1)}\n`);
  console.log(`scritto ${path.relative(ROOT, RECORDED)}`);
}

function programmi(report: Report): void {
  const md = ['## I programmi delle differenze\n', `| programma | semi | l’originale (C#) | il riferimento | il nostro motore${MJ ? ' (l’interruttore acceso)' : ''} |`, '|---|---|---|---|---|'];
  const rec: Record<string, Record<string, Outcome | string>> = {};
  const csThere = has(MJ_DLL);
  for (const c of CASES) {
    const xmlFile = path.join(PROGRAMS, `${c.name}.xml`);
    const startFile = path.join(PROGRAMS, `${c.name}.txt`);
    const xml = fs.readFileSync(xmlFile, 'utf8').trim();
    const start = flat(fs.readFileSync(startFile, 'utf8'));
    rec[c.name] = {};
    for (const seed of SEEDS_OF_CASES) {
      let cs: Outcome | string = 'non fatto girare';
      if (csThere) {
        const r = runCs(path.relative(ROOT, xmlFile), c.size, String(seed), c.steps, path.relative(ROOT, startFile));
        cs = typeof r === 'string' ? r : { letters: flat(r[0].text), steps: r[0].steps, finished: r[0].finished };
        rec[c.name][seed] = cs;
      }
      let ref: Outcome | string;
      try {
        const r = runReference(xml, c.size, seed, c.steps, {}, start);
        ref = { letters: flat(r.text), steps: r.steps, finished: r.finished };
      } catch (e) {
        ref = `errore: ${(e as Error).message.slice(0, 100)}`;
      }
      let ours: Outcome | string;
      try {
        const r = runOurs(xml, c.size, seed, c.steps, start);
        ours = { letters: r.letters, steps: r.steps, finished: r.finished };
      } catch (e) {
        ours = `errore: ${(e as Error).message.slice(0, 100)}`;
      }
      md.push(`| ${c.name} | ${seed} | ${outcomeText(cs)} | ${outcomeText(ref)} | ${outcomeText(ours)} |`);
    }
  }
  // The examples (esempi/): the original's grid against the reference's, by its hash, and whether ours finishes.
  const examples: NonNullable<Recorded['esempi']> = {};
  md.push('', '| esempio | seme | l’originale (C#): passi, fine, impronta | il riferimento | il nostro motore: passi, fine |', '|---|---|---|---|---|');
  for (const e of EXAMPLES) {
    const xmlFile = path.join(BENCH, 'esempi', `${e.name}.xml`);
    const xml = fs.readFileSync(xmlFile, 'utf8');
    examples[e.name] = {};
    const cs = csThere ? runCs(path.relative(ROOT, xmlFile), e.size, `${Math.min(...e.seeds)}-${Math.max(...e.seeds)}`, e.steps) : 'non fatto girare';
    for (const seed of e.seeds) {
      const c = typeof cs === 'string' ? undefined : cs.find((x) => x.seed === seed);
      if (c) examples[e.name][seed] = { steps: c.steps, finished: c.finished, hash: gridHash(c.text) };
      const r = runReference(xml, e.size, seed, e.steps);
      const o = runOurs(xml, e.size, seed, e.steps, undefined, undefined, false);
      md.push(`| ${e.name} | ${seed} | ${c ? `${c.steps}, ${c.finished ? 'finisce' : 'non finisce'}, ${gridHash(c.text)}` : String(cs)} | ${r.steps}, ${r.finished ? 'finisce' : 'non finisce'}, ${gridHash(r.text.trim())} | ${o.steps}, ${o.finished ? 'finisce' : 'non finisce'} |`);
    }
  }
  report.md.push(md.join('\n'), '');
  report.json.programmi = rec;
  if (flag('registra') && csThere)
    record((r) => {
      r.programmi = rec;
      r.esempi = examples;
    });
}

// ---------------------------------------------------------------- --modelli

interface RepoModel {
  name: string;
  size: Vec3;
  steps: number;
}

/** The 3D models of the original's models.xml (casi.ts: their box and steps), their text frozen in lab/banco/conformita/mxgmn/. */
function repoModels(): RepoModel[] {
  return REPO_3D;
}

/** The share of each letter in a grid's text. */
function histogram(letters: string): Map<string, number> {
  const h = new Map<string, number>();
  for (const ch of letters) h.set(ch, (h.get(ch) ?? 0) + 1);
  for (const [k, v] of h) h.set(k, v / letters.length);
  return h;
}
function meanHistogram(hs: Array<Map<string, number>>): Map<string, number> {
  const m = new Map<string, number>();
  for (const h of hs) for (const [k, v] of h) m.set(k, (m.get(k) ?? 0) + v / hs.length);
  return m;
}
/** Total variation distance between two shares of letters: 0 the same, 1 nothing in common. */
function tv(a: Map<string, number>, b: Map<string, number>): number {
  let s = 0;
  for (const k of new Set([...a.keys(), ...b.keys()])) s += Math.abs((a.get(k) ?? 0) - (b.get(k) ?? 0));
  return s / 2;
}

function modelli(report: Report): void {
  const seeds = (opt('semi') ?? '1,2,3').split(',').map(Number);
  const only = opt('solo')?.split(',');
  const withCs = flag('originale') && has(MJ_DLL);
  const md = [
    '## I modelli 3D del repository di mxgmn\n',
    `Semi ${seeds.join(', ')}; i passi di models.xml (50 000 se non li dice). «Riferimento = C#»: la stessa griglia voxel per voxel e gli stessi passi su ogni seme. «Noi»: il nostro motore di oggi; ${'`'}TV${'`'} è la distanza fra le quote delle lettere della griglia (0 uguali, 1 niente in comune), la nostra media contro quella del riferimento, accanto a quanto si allontana dalla sua media un seme del riferimento.\n`,
    ...(MJ ? ['Noi con l’interruttore della semantica acceso (`--mj`): «noi = riferimento» è la stessa griglia voxel per voxel, gli stessi passi e la stessa fine, seme per seme; «la griglia» la stessa griglia e la stessa fine, i passi a parte (T529: i modelli con la `wfc`, che l’originale osserva una cella per passo, A1-5).\n'] : []),
    `| modello | scatola | riferimento = C# | il riferimento: passi, fine | noi: gira? | noi: passi, fine |${MJ ? ' noi = riferimento | la griglia |' : ''} TV noi/originale | TV fra semi dell’originale |`,
    `|---|---|---|---|---|---|${MJ ? '---|---|' : ''}---|---|`,
  ];
  const rows: Record<string, unknown>[] = [];
  const rec: NonNullable<Recorded['modelli']> = {};
  for (const m of repoModels()) {
    if (only && !only.includes(m.name)) continue;
    const xml = fs.readFileSync(path.join(BENCH, 'mxgmn', `${m.name}.xml`), 'utf8');
    const row: Record<string, unknown> = { name: m.name, size: m.size, steps: m.steps };
    // The reference, on every seed.
    const refs: Array<{ text: string; steps: number; finished: boolean; dims: string } | string> = seeds.map((s) => {
      try {
        const r = runReference(xml, m.size, s, m.steps, OFFICIAL_FILES);
        return { text: r.text, steps: r.steps, finished: r.finished, dims: [r.grid.MX, r.grid.MY, r.grid.MZ].join('x') };
      } catch (e) {
        return `non legge: ${(e as Error).message.slice(0, 80)}`;
      }
    });
    let csCell = 'non fatto girare';
    if (withCs) {
      const cs = runCs(`models/${m.name}.xml`, m.size, `${Math.min(...seeds)}-${Math.max(...seeds)}`, m.steps, undefined, REPO);
      if (typeof cs === 'string') csCell = cs;
      else {
        const same = seeds.map((s, i) => {
          const c = cs.find((x) => x.seed === s);
          const r = refs[i];
          return !!c && typeof r !== 'string' && c.text === r.text.trim() && c.steps === r.steps && c.finished === r.finished;
        });
        csCell = refs.every((r) => typeof r === 'string') ? 'il C# gira, il riferimento non ne legge le risorse' : same.every(Boolean) ? `**sì** (${same.length} semi)` : `no: ${same.map((v, i) => `${seeds[i]} ${v ? 'sì' : 'no'}`).join(', ')}`;
        rec[m.name] = { size: m.size, steps: m.steps, seeds: Object.fromEntries(cs.map((c) => [String(c.seed), { steps: c.steps, finished: c.finished, hash: gridHash(c.text) }])) };
      }
    }
    row.csSame = csCell;
    const okRefs = refs.filter((r): r is { text: string; steps: number; finished: boolean; dims: string } => typeof r !== 'string');
    const refCell = okRefs.length ? `${okRefs.map((r) => r.steps).join(', ')}; ${okRefs.every((r) => r.finished) ? 'finisce' : `finisce ${okRefs.filter((r) => r.finished).length}/${okRefs.length}`}` : String(refs[0]);
    // Ours, from the original's text as it is (T531: `original`), the resources as text (lab/mjx/official/resources/).
    let oursCell = '—';
    let oursRun = '—';
    let tvOurs = '—';
    let tvRef = '—';
    let sameCell = '—';
    let gridCell = '—';
    {
      try {
        const files = mjxIncludes(xml, (f) => OFFICIAL_FILES[f], { original: true });
        const runs = seeds.map((s) => runOurs(xml, m.size, s, m.steps > 0 ? m.steps : 5_000_000, undefined, files));
        // Each seed against its own: the original's grid may end at another size on another seed (ModernHouse).
        oursCell = runs.some((r, i) => { const ref = refs[i]; return typeof ref !== 'string' && [r.X, r.Y, r.Z].join('x') !== ref.dims; }) ? 'gira (un’altra griglia finale)' : 'gira';
        oursRun = `${runs.map((r) => r.steps).join(', ')}; ${runs.every((r) => r.finished) ? 'finisce' : `finisce ${runs.filter((r) => r.finished).length}/${runs.length}`}`;
        if (MJ) {
          const same = runs.map((r, i) => {
            const ref = refs[i];
            return typeof ref !== 'string' && r.letters === flat(ref.text) && r.steps === ref.steps && r.finished === ref.finished;
          });
          sameCell = same.every(Boolean) ? `**sì** (${same.length} semi)` : `no: ${same.map((v, i) => `${seeds[i]} ${v ? 'sì' : 'no'}`).join(', ')}`;
          const grid = runs.map((r, i) => {
            const ref = refs[i];
            return typeof ref !== 'string' && r.letters === flat(ref.text) && r.finished === ref.finished;
          });
          gridCell = grid.every(Boolean) ? `**sì** (${grid.length} semi)` : `no: ${grid.map((v, i) => `${seeds[i]} ${v ? 'sì' : 'no'}`).join(', ')}`;
        }
        if (okRefs.length) {
          const refH = okRefs.map((r) => histogram(flat(r.text)));
          const refMean = meanHistogram(refH);
          const oursH = runs.map((r) => histogram(r.letters));
          tvOurs = (oursH.reduce((s, h) => s + tv(h, refMean), 0) / oursH.length).toFixed(3);
          tvRef = (refH.reduce((s, h) => s + tv(h, refMean), 0) / refH.length).toFixed(3);
        }
      } catch (e) {
        oursCell = `non gira: ${(e as Error).message.slice(0, 90)}`;
      }
    }
    Object.assign(row, { reference: refCell, ours: oursCell, oursRun, tvOurs, tvRef, ...(MJ ? { same: sameCell, grid: gridCell } : {}) });
    rows.push(row);
    md.push(`| ${m.name} | ${m.size.join('×')} | ${csCell} | ${refCell} | ${oursCell} | ${oursRun} |${MJ ? ` ${sameCell} | ${gridCell} |` : ''} ${tvOurs} | ${tvRef} |`);
    console.log(m.name, csCell, '|', refCell, '|', oursCell, oursRun, MJ ? `${sameCell} | griglia ${gridCell}` : '', tvOurs, tvRef);
  }
  report.md.push(md.join('\n'), '');
  report.json.modelli = rows;
  if (flag('registra') && withCs) record((r) => (r.modelli = { ...(r.modelli ?? {}), ...rec }));
}

// ---------------------------------------------------------------- our programs: where they are, their box

interface Program {
  where: string;
  id: string;
  file: string;
  xml: string;
  info?: ModelInfo;
  files: Record<string, string>;
}

function filesOf(dir: string): Record<string, string> {
  const files: Record<string, string> = {};
  if (!fs.existsSync(dir)) return files;
  for (const f of fs.readdirSync(dir)) if (/\.(xml|txt)$/.test(f)) files[f] = fs.readFileSync(path.join(dir, f), 'utf8');
  return files;
}

/** The programs of a models/ folder (the seed's or a universe's), with their index entry; sounds and tilesets left out. */
function programsOf(where: string, dir: string, seedFiles: Record<string, string>): Program[] {
  const index: Record<string, ModelInfo> = has(path.join(dir, 'index.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8')) : {};
  const files = { ...seedFiles, ...filesOf(dir) };
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.xml'))
    .map((f) => ({ where, id: f.slice(0, -4), file: path.join(dir, f), xml: fs.readFileSync(path.join(dir, f), 'utf8'), info: index[f.slice(0, -4)], files }))
    .filter((p) => !/<sound\b/.test(p.xml) && !/^\s*<tileset\b/.test(p.xml.replace(/<!--[\s\S]*?-->/g, '')) && p.info?.class !== 'sound');
}

/** The box a program runs in, as the game gives it (`Forms`: its `size`, or its entry's box and cellar). */
function boxFor(xml: string, info: ModelInfo | undefined): Vec3 | undefined {
  if (/\ssize="/.test(rootTag(xml))) return undefined;
  const cls = CLASSES.find((c) => c.id === info?.class) ?? CLASSES.find((c) => c.id === 'thing') ?? CLASSES[0];
  const [X, Y, Z] = entryBox(cls, info);
  return [X, Y, Z + cellarVoxels(info, xml)];
}

function universeDirs(): Array<{ name: string; dir: string }> {
  return many('universi').flatMap((u) => {
    const root = path.resolve(u);
    if (has(path.join(root, 'models'))) return [{ name: path.basename(root), dir: path.join(root, 'models') }];
    return fs.existsSync(root) ? fs.readdirSync(root).filter((n) => !n.startsWith('.') && has(path.join(root, n, 'models'))).map((n) => ({ name: n, dir: path.join(root, n, 'models') })) : [];
  });
}

// ---------------------------------------------------------------- --varianza

/** How two runs of a program differ: the share of voxels full in one and empty in the other (shape), of the cells full in either with another letter. */
function difference(a: string, b: string, empty: string): { shape: number; letters: number } {
  let either = 0, xor = 0, other = 0;
  for (let i = 0; i < a.length; i++) {
    const fa = a[i] !== empty, fb = b[i] !== empty;
    if (fa || fb) either++;
    if (fa !== fb) xor++;
    if ((fa || fb) && a[i] !== b[i]) other++;
  }
  return either ? { shape: xor / either, letters: other / either } : { shape: 0, letters: 0 };
}
const median = (v: number[]) => {
  const s = [...v].sort((a, b) => a - b);
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : NaN;
};

/** What in a program draws random numbers, read from its XML: the constructs the original makes vary. */
export function constructsOf(xml: string): string[] {
  const out: string[] = [];
  const t = xml.replace(/<!--[\s\S]*?-->/g, '');
  const count = (re: RegExp) => (t.match(re) ?? []).length;
  if (count(/<one\b/g)) out.push('one');
  if (/<prl\b[^>]*\sp="0?\.\d+"|<rule\b[^>]*\sp="0?\.\d+"/.test(t)) out.push('prl a moneta');
  if (count(/<markov\b/g)) out.push('markov');
  if (count(/<path\b/g)) out.push('path');
  if (count(/<wfc\b/g)) out.push('wfc');
  if (count(/<convchain\b/g)) out.push('convchain');
  if (count(/<field\b/g)) out.push('field');
  if (/temperature="/.test(t)) out.push('temperature');
  if (count(/<(box|ellipsoid|cylinder|cone|line)\b/g)) out.push('forme');
  if (count(/<all\b/g)) out.push('all');
  if (count(/<map\b/g)) out.push('map');
  if (count(/<import\b/g)) out.push('import');
  return out;
}

interface VarianceRow {
  where: string;
  id: string;
  seeds: number;
  shape: number;
  letters: number;
  constructs: string[];
  note?: string;
}

function varianza(report: Report): void {
  const K = Number(opt('semi') ?? 6);
  const seeds = Array.from({ length: K }, (_, i) => i + 1);
  const rows: VarianceRow[] = [];
  const measure = (where: string, id: string, runs: () => string[], empty: string, xml: string) => {
    let grids: string[];
    try {
      grids = runs();
    } catch (e) {
      rows.push({ where, id, seeds: 0, shape: NaN, letters: NaN, constructs: constructsOf(xml), note: (e as Error).message.slice(0, 80) });
      return;
    }
    const d: Array<{ shape: number; letters: number }> = [];
    for (let i = 0; i < grids.length; i++) for (let j = i + 1; j < grids.length; j++) if (grids[i].length === grids[j].length) d.push(difference(grids[i], grids[j], empty));
    rows.push({ where, id, seeds: grids.length, shape: median(d.map((x) => x.shape)), letters: median(d.map((x) => x.letters)), constructs: constructsOf(xml) });
  };
  // Ours: the seed, the fort, the universes (with --solo-concilio only what is not a copy of the seed).
  const seedDir = path.join(ROOT, 'universe/models');
  const seedFiles = filesOf(seedDir);
  const seedPrograms = programsOf('seme', seedDir, {});
  const seedTexts = new Set(seedPrograms.map((p) => p.xml));
  const ours = (p: Program) => () =>
    seeds.flatMap((s) => {
      const size = boxFor(p.xml, p.info);
      const m = compileMjx(p.xml, { ...(size ? { size } : {}), files: p.files, self: p.id });
      const r = run(m.program as Program3, s, 2_000_000, MJX_LIMITS, { deadline: 8_000 });
      return r.finished ? [Array.from(r.grid.cells, (c) => String.fromCharCode(c + 33)).join('')] : [];
    });
  const empty = String.fromCharCode(33);
  // With --solo-mxgmn only the original's models, in the two engines.
  if (!flag('solo-mxgmn')) {
    for (const p of seedPrograms) measure('seme', p.id, ours(p), empty, p.xml);
    if (has(FORT)) {
      const xml = fs.readFileSync(FORT, 'utf8');
      measure('forte dell’autore', 'forte-handmade', ours({ where: 'forte', id: 'forte-handmade', file: FORT, xml, files: seedFiles }), empty, xml);
    }
    for (const u of universeDirs()) {
      for (const p of programsOf(u.name, u.dir, seedFiles)) {
        if (flag('solo-concilio') && seedTexts.has(p.xml)) continue;
        measure(u.name, p.id, ours(p), empty, p.xml);
      }
      console.log('varianza:', u.name, rows.filter((r) => r.where === u.name).length);
    }
  }
  // The original's 3D models, in the reference; and the same models in our engine, from the same text (T531: `original`).
  for (const m of repoModels()) {
    const xml = fs.readFileSync(path.join(BENCH, 'mxgmn', `${m.name}.xml`), 'utf8');
    const values = /values="([^"]*)"/.exec(xml)![1].replace(/\s+/g, '');
    measure('mxgmn', m.name, () => seeds.map((s) => flat(runReference(xml, m.size, s, m.steps, OFFICIAL_FILES).text)), values[0], xml);
    const files = mjxIncludes(xml, (f) => OFFICIAL_FILES[f], { original: true });
    measure('mxgmn nel nostro motore', m.name, () => seeds.map((s) => runOurs(xml, m.size, s, m.steps > 0 ? m.steps : 5_000_000, undefined, files).letters), values[0], xml);
  }
  report.json.varianza = rows;
  const groups = [...new Set(rows.map((r) => r.where))];
  const md = ['## Quanto variano fra i semi\n', `${K} semi per programma, alla scatola del gioco (i nostri) o di models.xml (mxgmn, nel riferimento); la mediana delle coppie di semi. «Forma»: i voxel pieni in un seme e vuoti nell’altro, sui pieni in almeno uno; «lettere»: le celle piene in almeno uno con un’altra lettera. Statico: forma sotto 0,01 (la soglia di lab/banco/varianza.ts).\n`, '| dove | programmi misurati | forma: mediana | statici (forma < 0,01) | lettere: mediana | non misurati |', '|---|---|---|---|---|---|'];
  for (const g of groups) {
    const rs = rows.filter((r) => r.where === g);
    const ok = rs.filter((r) => Number.isFinite(r.shape));
    md.push(`| ${g} | ${ok.length} | ${median(ok.map((r) => r.shape)).toFixed(3)} | ${ok.filter((r) => r.shape < 0.01).length} | ${median(ok.map((r) => r.letters)).toFixed(3)} | ${rs.length - ok.length} |`);
  }
  // Which constructs go with variance.
  md.push('', '### I costrutti e la varianza (tutti i programmi misurati, nostri e di mxgmn)\n', '| costrutto | programmi con | forma: mediana con | statici con | programmi senza | forma: mediana senza |', '|---|---|---|---|---|---|');
  const measured = rows.filter((r) => Number.isFinite(r.shape));
  for (const c of ['one', 'prl a moneta', 'markov', 'path', 'wfc', 'convchain', 'field', 'temperature', 'all', 'map', 'forme', 'import']) {
    const w = measured.filter((r) => r.constructs.includes(c));
    const wo = measured.filter((r) => !r.constructs.includes(c));
    if (!w.length) continue;
    md.push(`| ${c} | ${w.length} | ${median(w.map((r) => r.shape)).toFixed(3)} | ${w.filter((r) => r.shape < 0.01).length} | ${wo.length} | ${median(wo.map((r) => r.shape)).toFixed(3)} |`);
  }
  const random = (r: VarianceRow) => r.constructs.some((c) => ['one', 'prl a moneta', 'path', 'wfc', 'convchain'].includes(c));
  const ourRows = measured.filter((r) => r.where !== 'mxgmn');
  md.push('', `Dei nostri ${ourRows.length} programmi misurati, ${ourRows.filter((r) => !random(r)).length} non hanno né \`one\`, né una \`prl\` a moneta, né \`path\`, \`wfc\` o \`convchain\`: ${ourRows.filter((r) => !random(r) && r.shape < 0.01).length} di loro sono statici. Di quelli di mxgmn, ${measured.filter((r) => r.where === 'mxgmn' && !random(r)).length} su ${measured.filter((r) => r.where === 'mxgmn').length}.`, '');
  report.md.push(md.join('\n'));
}

// ---------------------------------------------------------------- --censimento

/** What of a program the original does not read, or reads otherwise (static, from the XML; the parts imported are counted where they are). */
export function featuresOf(xml: string): Set<string> {
  const f = new Set<string>();
  let roots: XmlElement[];
  try {
    roots = parseXml(xml);
  } catch {
    f.add('xml illeggibile');
    return f;
  }
  const main = roots.find((r) => !['animation', 'action', 'worn'].includes(r.name));
  if (roots.some((r) => ['animation', 'action'].includes(r.name)) || roots.some((r) => r.name === 'worn')) f.add('animazioni, azioni, capi indossati');
  if (!main) return f;
  const ra = main.attrs;
  if (ra.ground) f.add('ground');
  if (ra.soil || ra.suolo) f.add('soil');
  if (ra.under || ra.vpt) f.add('under, vpt');
  if (/^bottom$/i.test(ra.origin ?? '')) f.add('origin="bottom"');
  if (ra.size) f.add('size nel programma');
  const values = (ra.values ?? '').replace(/\s+/g, '');
  const numbered = (s: string) => /#\d/.test(s);
  const RULE = new Set(['one', 'all', 'prl']);
  const BRANCH = new Set(['sequence', 'markov']);
  const visit = (el: XmlElement, parent: XmlElement | undefined) => {
    const a = el.attrs;
    if (Object.values(a).some(numbered) || numbered(el.text ?? '')) f.add('simboli #N');
    if (/\[[^\]]+\]/.test(`${a.in ?? ''}${el.children.filter((c) => c.name === 'in').map((c) => c.text ?? '').join('')}`)) f.add('insiemi [..] negli ingressi');
    if (el.name === 'import') f.add('import');
    if (el.name === 'pieces') f.add('pieces');
    if (['box', 'ellipsoid', 'cylinder', 'cone', 'line'].includes(el.name)) f.add('forme (box, cylinder…)');
    if (el.name === 'color' && (a.part || a.hidden || a.glow || a.alpha || a.opacity || a.glass || a.translucent || a.area)) f.add('color con part, hidden, glow, alpha, area');
    if (el.name === 'sound') f.add('sound');
    if (el.name === 'map' && /^false$/i.test(a.clear ?? '')) f.add('map clear="False"');
    if ((el.name === 'in' || el.name === 'out') && parent && (RULE.has(parent.name) || parent.name === 'rule' || parent.name === 'convolution')) f.add('<in>/<out> figli');
    if (el.name === 'sample' && parent?.name === 'convchain') f.add('<sample> nel convchain');
    if (a.d !== undefined && el.name !== 'model') f.add('d="2"/d="3" (l’originale lo ignora)');
    if (a.optional !== undefined) f.add('optional');
    if (el.name === 'path' && a.color === undefined) f.add('path senza color');
    if (el.name === 'path' && a.steps !== undefined) f.add('path con steps');
    if (el.name === 'convolution' && Number(a.steps) > 30) f.add('convolution steps oltre 30');
    if (RULE.has(el.name) && el.children.some((c) => c.name === 'union')) f.add('union dentro un nodo di regole');
    if (RULE.has(el.name)) {
      const rules = el.children.some((c) => c.name === 'rule') ? el.children.filter((c) => c.name === 'rule') : [el];
      if (el.name === 'one' && rules.some((r) => r.attrs.p !== undefined)) f.add('p nelle regole di one (l’originale lo ignora)');
      if (rules.some((r) => r.attrs.p !== undefined && !(Number(r.attrs.p) > 0))) f.add('p="0" (da noi vale 1)');
      for (const r of rules) {
        const i = (r.attrs.in ?? '').replace(/\s+/g, ' '), o = (r.attrs.out ?? '').replace(/\s+/g, ' ');
        if (i && o && i.length === o.length && [...o].every((ch, k) => ch === '*' || ch === ' ' || ch === '/' || (ch === i[k] && /[A-Za-z]/.test(ch) && !/\[/.test(i)))) f.add('regola che non cambia niente');
      }
    }
    if (BRANCH.has(el.name) && parent && (BRANCH.has(parent.name) || parent.name === 'map' || parent.name === 'wfc' || parent.name === 'pieces')) {
      f.add(el.name === 'sequence' ? `sequence dentro ${parent.name}` : `markov dentro ${parent.name}`);
      if (el.name === 'sequence' && parent.name === 'markov') f.add(parent.children.filter((c) => ![ 'union', 'color'].includes(c.name)).at(-1) === el ? 'sequence ultimo figlio di markov' : 'sequence non ultimo figlio di markov');
    }
    // A node after a map or a wfc in the same branch: the original ends the run when the map's nodes end.
    if ((el.name === 'map' || el.name === 'wfc') && parent) {
      const kids = parent.children.filter((c) => !['union', 'color', 'rule'].includes(c.name));
      if (kids.indexOf(el) < kids.length - 1) f.add(`nodi dopo una ${el.name} (l’originale non li esegue)`);
    }
    if (el.name === 'map' || el.name === 'wfc' || el === main) {
      const v = (a.values ?? '').replace(/\s+/g, '');
      const n = [...v.matchAll(/#\d+|./g)].length;
      if (n > 31) f.add('più di 31 valori in una griglia');
    }
    for (const c of el.children) visit(c, el);
  };
  visit(main, undefined);
  void values;
  return f;
}

function censimento(report: Report): void {
  const sources: Array<{ where: string; programs: Array<{ id: string; xml: string }> }> = [];
  const seedDir = path.join(ROOT, 'universe/models');
  sources.push({ where: 'seme', programs: programsOf('seme', seedDir, {}).map((p) => ({ id: p.id, xml: p.xml })) });
  const lab = path.join(ROOT, 'lab/mjx/models');
  if (has(lab)) sources.push({ where: 'laboratorio (lab/mjx/models)', programs: fs.readdirSync(lab).filter((f) => f.endsWith('.xml')).map((f) => ({ id: f.slice(0, -4), xml: fs.readFileSync(path.join(lab, f), 'utf8') })) });
  if (has(FORT)) sources.push({ where: 'forte dell’autore', programs: [{ id: 'forte', xml: fs.readFileSync(FORT, 'utf8') }] });
  const seedTexts = new Set(sources[0].programs.map((p) => p.xml));
  for (const u of universeDirs()) sources.push({ where: `${u.name} (del Concilio)`, programs: programsOf(u.name, u.dir, {}).filter((p) => !seedTexts.has(p.xml)).map((p) => ({ id: p.id, xml: p.xml })) });
  const repo = path.join(REPO, 'models');
  if (has(repo)) sources.push({ where: 'mxgmn (159 modelli)', programs: fs.readdirSync(repo).filter((f) => f.endsWith('.xml')).map((f) => ({ id: f.slice(0, -4), xml: fs.readFileSync(path.join(repo, f), 'utf8') })) });
  const all = new Map<string, Map<string, number>>();
  const totals = new Map<string, number>();
  for (const s of sources) {
    const counts = new Map<string, number>();
    for (const p of s.programs) for (const k of featuresOf(p.xml)) counts.set(k, (counts.get(k) ?? 0) + 1);
    all.set(s.where, counts);
    totals.set(s.where, s.programs.length);
  }
  const keys = [...new Set([...all.values()].flatMap((m) => [...m.keys()]))].sort();
  const cols = [...all.keys()];
  const md = ['## Che cosa dei nostri programmi l’originale non ha, o legge altrimenti\n', `Programmi che lo usano, per sorgente (fra parentesi i programmi letti; negli universi solo quelli che non sono copie del seme).\n`, `| | ${cols.map((c) => `${c} (${totals.get(c)})`).join(' | ')} |`, `|---|${cols.map(() => '---').join('|')}|`];
  for (const k of keys) md.push(`| ${k} | ${cols.map((c) => all.get(c)!.get(k) ?? 0).join(' | ')} |`);
  report.md.push(md.join('\n'), '');
  report.json.censimento = Object.fromEntries([...all].map(([k, v]) => [k, { programmi: totals.get(k), ...Object.fromEntries(v) }]));
}

// ---------------------------------------------------------------- main

interface Report {
  md: string[];
  json: Record<string, unknown>;
}

function main(): void {
  fs.mkdirSync(OUT, { recursive: true });
  const report: Report = { md: [], json: {} };
  if (flag('caso')) caso(report);
  if (flag('programmi')) programmi(report);
  if (flag('modelli')) modelli(report);
  if (flag('varianza')) varianza(report);
  if (flag('censimento')) censimento(report);
  if (!report.md.length) {
    console.log('niente da fare: --caso, --programmi, --modelli, --varianza o --censimento');
    return;
  }
  const md = opt('md');
  const json = opt('json');
  if (md) fs.writeFileSync(md, `${report.md.join('\n')}\n`);
  if (json) fs.writeFileSync(json, `${JSON.stringify(report.json, null, 1)}\n`);
  if (!md) console.log(report.md.join('\n'));
}

main();
