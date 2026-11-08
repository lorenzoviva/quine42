// Where the time of the seed's MarkovJunior programs goes (T331, docs/design/gpu.md): each program of `universe/models/` (the sound ones
// apart) run as a worker of the game runs it (`runForm`: compile, run with the form limits, then the meshes of `formMeshes`), timed, and
// sampled with V8's profiler, so that the run's time divides into matching the rules, the random choice, writing the grid, the other
// nodes, compiling and the meshes. Nothing of the engine changes: the parts come from the functions the samples fall in.
//
//   npx vite-node lab/scripts/misura-mj.ts -- [--semi 3] [--taglie large,huge,gargantuan] [--classi structure,building] [--solo id,id]
//                                            [--senza-profilo] [--json out.json]
//
// Without `--taglie` each program runs at its own size (the index's, or its class's). With `--taglie`, the programs of the classes that
// grow (`--classi`, by default building, structure, monument) run also at those sizes: the same program in a larger box, as the bench does.
// Offline, no models, no browser.

import fs from 'node:fs';
import path from 'node:path';
import { Session } from 'node:inspector';
import { Forms, InlineRunner, FormCache, runForm, type ModelInfo, type FormRequest } from '../../src/kernel/forms';
import { formMeshes } from '../../src/render/formmeshes';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const semi = Number(opt('semi') ?? 3);
const taglie = opt('taglie')?.split(',') ?? [];
const classi = (opt('classi') ?? 'building,structure,monument').split(',');
const solo = opt('solo')?.split(',');
const profilo = !args.includes('--senza-profilo');

const ROOT = path.resolve('universe');
function seedFiles(): Record<string, string> {
  const files: Record<string, string> = {};
  for (const f of fs.readdirSync(path.join(ROOT, 'models'))) files[`models/${f}`] = fs.readFileSync(path.join(ROOT, 'models', f), 'utf8');
  return files;
}

// ---------------------------------------------------------------- the profiler

type Part = 'match' | 'scelta' | 'scrittura' | 'altri nodi' | 'inferenza' | 'compilazione' | 'mesh' | 'gc' | 'altro';
const PARTS: Part[] = ['match', 'scelta', 'scrittura', 'altri nodi', 'inferenza', 'compilazione', 'mesh', 'gc', 'altro'];

/**
 * The class each line of a script belongs to: the profiler names a method, not its class (`go` is in every runner). The lines are
 * those of the code as it runs (vite-node transforms it), so the text is asked of the inspector, by the script's id.
 */
const classLines = new Map<string, string[]>();
async function learnClasses(scriptId: string): Promise<void> {
  if (classLines.has(scriptId)) return;
  const { scriptSource } = await post<{ scriptSource: string }>('Debugger.getScriptSource', { scriptId });
  const at: string[] = [];
  let cls = '';
  scriptSource.split('\n').forEach((line, i) => {
    const m = /^\s*(?:export )?(?:abstract )?class (\w+)/.exec(line);
    if (m) cls = /\{\s*\}\s*$/.test(line) ? '' : m[1];
    else if (/^(?:export )?(?:async )?(?:function|const|let|var) /.test(line)) cls = '';
    at[i] = cls;
  });
  classLines.set(scriptId, at);
}
const classOf = (scriptId: string, line: number) => classLines.get(scriptId)?.[line] ?? '';

const MATCH_FUNCS = new Set(['scan', 'scanPattern', 'checkAt', 'fitsAt', 'sync', 'probe', 'censusOf', 'codesOf', 'fits']);
const MATCHSET = new Set(['MatchSet', 'Census']);
const WRITE_FUNCS = new Set(['write', 'apply', 'moved']);
const OTHER_RUNNERS = new Set(['ConvRunner', 'PathRunner', 'MapRunner', 'ShapeRunner']);

function partOf(fn: string, url: string, cls: string): Part {
  if (fn === '(garbage collector)') return 'gc';
  if (/src\/mj\/(mesh|rig|hold)\.ts|formmeshes\.ts/.test(url)) return 'mesh';
  if (/src\/mj\/infer\.ts/.test(url)) return 'inferenza';
  if (/src\/kernel\/rng\.ts/.test(url)) return 'scelta';
  if (/src\/mj\/(model|xml|palette)\.ts/.test(url)) return 'compilazione';
  if (/src\/mj\/engine\.ts/.test(url)) {
    if (cls === 'Census' && fn === 'moved') return 'scrittura';
    if (MATCHSET.has(cls)) return 'match';
    if (WRITE_FUNCS.has(fn)) return 'scrittura';
    if (MATCH_FUNCS.has(fn)) return 'match';
    if (OTHER_RUNNERS.has(cls)) return 'altri nodi';
    if (cls === 'GuidedRunner') return 'inferenza';
    // A rule node's own `go`: the shuffle of `all`, the draws of `prl`, the weighted pick of `one`.
    if (cls === 'RuleRunner' && fn === 'go') return 'scelta';
    if (/^(compile|compileNode|parsePattern|variants|transform|symmetries|alphabetOf|index|mask|checkSize|layersOf|cellsOf)$/.test(fn)) return 'compilazione';
    return 'altro';
  }
  return 'altro';
}

interface ProfileNode {
  id: number;
  callFrame: { functionName: string; url: string; lineNumber: number; scriptId: string };
  hitCount?: number;
  children?: number[];
}
interface Profile {
  nodes: ProfileNode[];
  samples?: number[];
  timeDeltas?: number[];
  startTime: number;
  endTime: number;
}

const session = new Session();
session.connect();
const post = <T>(method: string, params: object = {}) => new Promise<T>((ok, ko) => session.post(method, params, (e, r) => (e ? ko(e) : ok(r as T))));

/** The milliseconds of each part in a profile: each sample's time goes to the function it fell in (self time). */
async function parts(p: Profile): Promise<Record<Part, number> & { funcs: Map<string, number> }> {
  for (const n of p.nodes) if (/src\/mj\/engine\.ts/.test(n.callFrame.url)) await learnClasses(n.callFrame.scriptId);
  const byId = new Map(p.nodes.map((n) => [n.id, n]));
  const out = Object.fromEntries(PARTS.map((k) => [k, 0])) as Record<Part, number>;
  const funcs = new Map<string, number>();
  const samples = p.samples ?? [];
  const deltas = p.timeDeltas ?? [];
  for (let i = 0; i < samples.length; i++) {
    const n = byId.get(samples[i]);
    if (!n) continue;
    // The delta after a sample is the time it stands for.
    const ms = (deltas[i + 1] ?? 0) / 1000;
    const { functionName, url, lineNumber, scriptId } = n.callFrame;
    const cls = /engine\.ts/.test(url) ? classOf(scriptId, lineNumber) : '';
    if (functionName === '(idle)' || functionName === '(program)' || functionName === '(root)') continue;
    const part = partOf(functionName, url, cls);
    out[part] += ms;
    const name = `${cls ? cls + '.' : ''}${functionName || '(anon)'} ${path.basename(url)}`;
    funcs.set(name, (funcs.get(name) ?? 0) + ms);
  }
  return Object.assign(out, { funcs });
}

// ---------------------------------------------------------------- the runs

interface Row {
  model: string;
  class: string;
  size: string;
  box: string;
  cells: number;
  compileMs: number;
  runMs: number[];
  meshMs: number[];
  finished: number;
  parts?: Record<Part, number>;
}

const files = seedFiles();
const index = JSON.parse(files['models/index.json']) as Record<string, ModelInfo>;
const models = Object.entries(index).filter(([id, info]) => info.class !== 'suono' && info.class !== 'sound' && files[`models/${id}.xml`] && (!solo || solo.includes(id)));

function requestAt(id: string, size: string | undefined, seed: number): FormRequest | undefined {
  const lib = size ? { ...index, [id]: { ...index[id], size } } : index;
  const forms = new Forms(new InlineRunner(new FormCache()));
  forms.load({ ...files, 'models/index.json': JSON.stringify(lib) });
  return forms.request(id, seed);
}

if (profilo) {
  await post('Profiler.enable');
  await post('Debugger.enable');
  await post('Profiler.setSamplingInterval', { interval: 100 });
}

const rows: Row[] = [];
const totals = Object.fromEntries(PARTS.map((k) => [k, 0])) as Record<Part, number>;
const allFuncs = new Map<string, number>();
// A first run of a small program: the engine's code is compiled by V8 before anything is measured.
{
  const q = requestAt(models[0][0], undefined, 1);
  if (q) runForm(q);
}

for (const [id, info] of models) {
  const sizes: Array<string | undefined> = [undefined, ...(classi.includes(info.class) ? taglie.filter((t) => t !== info.size) : [])];
  for (const size of sizes) {
    const row: Row = { model: id, class: info.class, size: size ?? info.size ?? '(classe)', box: '', cells: 0, compileMs: 0, runMs: [], meshMs: [], finished: 0 };
    let prof: Profile | undefined;
    if (profilo) await post('Profiler.start');
    for (let seed = 1; seed <= semi; seed++) {
      const q = requestAt(id, size, seed);
      if (!q) continue;
      const t0 = performance.now();
      const r = runForm(q);
      const t1 = performance.now();
      const meshes = formMeshes(r, q);
      const t2 = performance.now();
      void meshes;
      row.runMs.push(t1 - t0);
      row.meshMs.push(t2 - t1);
      if (r.finished) row.finished++;
      row.box = `${r.grid.X}×${r.grid.Y}×${r.grid.Z}`;
      row.cells = r.grid.X * r.grid.Y * r.grid.Z;
    }
    if (profilo) {
      prof = (await post<{ profile: Profile }>('Profiler.stop')).profile;
      const p = await parts(prof);
      row.parts = Object.fromEntries(PARTS.map((k) => [k, p[k]])) as Record<Part, number>;
      for (const k of PARTS) totals[k] += p[k];
      for (const [f, ms] of p.funcs) allFuncs.set(f, (allFuncs.get(f) ?? 0) + ms);
    }
    rows.push(row);
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
    const pr = row.parts;
    const engine = pr ? pr.match + pr.scelta + pr.scrittura + pr['altri nodi'] + pr.inferenza + pr.altro : 0;
    const pct = (v: number) => (engine > 0 ? `${Math.round((100 * v) / engine)}%` : '-');
    console.log(
      `${id.padEnd(28)} ${row.class.padEnd(10)} ${row.size.padEnd(11)} ${row.box.padEnd(12)} programma ${mean(row.runMs).toFixed(1).padStart(8)} ms (max ${Math.max(...row.runMs).toFixed(0)}) · mesh ${mean(row.meshMs).toFixed(1).padStart(6)} ms · finiti ${row.finished}/${row.runMs.length}` +
        (pr ? ` · match ${pct(pr.match)} scelta ${pct(pr.scelta)} scrittura ${pct(pr.scrittura)} altri ${pct(pr['altri nodi'])} infer ${pct(pr.inferenza)} gc ${pr.gc.toFixed(0)} ms` : ''),
    );
  }
}

// ---------------------------------------------------------------- the summary

const SIZES = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan', '(classe)'];
console.log('\n# Per taglia (media dei semi, somma dei programmi)');
const bySize = new Map<string, { n: number; run: number; mesh: number; max: number; maxId: string }>();
for (const r of rows) {
  const k = `${r.size}`;
  const s = bySize.get(k) ?? { n: 0, run: 0, mesh: 0, max: 0, maxId: '' };
  const run = r.runMs.reduce((a, b) => a + b, 0) / r.runMs.length;
  s.n++;
  s.run += run;
  s.mesh += r.meshMs.reduce((a, b) => a + b, 0) / r.meshMs.length;
  if (run > s.max) Object.assign(s, { max: run, maxId: r.model });
  bySize.set(k, s);
}
for (const [k, s] of [...bySize].sort((a, b) => SIZES.indexOf(a[0]) - SIZES.indexOf(b[0])))
  console.log(`${k.padEnd(11)} ${String(s.n).padStart(3)} programmi · programma in media ${(s.run / s.n).toFixed(1).padStart(8)} ms · mesh in media ${(s.mesh / s.n).toFixed(1).padStart(6)} ms · il più lento ${s.maxId} ${s.max.toFixed(0)} ms`);

console.log('\n# Per classe');
const byClass = new Map<string, { n: number; run: number; mesh: number }>();
for (const r of rows) {
  const k = `${r.class}${r.size !== '(classe)' ? '/' + r.size : ''}`;
  const s = byClass.get(k) ?? { n: 0, run: 0, mesh: 0 };
  s.n++;
  s.run += r.runMs.reduce((a, b) => a + b, 0) / r.runMs.length;
  s.mesh += r.meshMs.reduce((a, b) => a + b, 0) / r.meshMs.length;
  byClass.set(k, s);
}
for (const [k, s] of [...byClass].sort((a, b) => b[1].run / b[1].n - a[1].run / a[1].n))
  console.log(`${k.padEnd(22)} ${String(s.n).padStart(3)} programmi · programma ${(s.run / s.n).toFixed(1).padStart(8)} ms · mesh ${(s.mesh / s.n).toFixed(1).padStart(6)} ms`);

if (profilo) {
  const all = PARTS.reduce((a, k) => a + totals[k], 0);
  console.log('\n# Dove va il tempo (tutti i programmi, campioni di V8 ogni 100 µs)');
  for (const k of PARTS) console.log(`${k.padEnd(13)} ${totals[k].toFixed(0).padStart(8)} ms  ${((100 * totals[k]) / all).toFixed(1).padStart(5)} %`);
  console.log('\n# Le funzioni più costose');
  for (const [f, ms] of [...allFuncs].sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(`${ms.toFixed(0).padStart(8)} ms  ${f}`);
}

const out = opt('json');
if (out) fs.writeFileSync(out, JSON.stringify({ rows, totals, funcs: Object.fromEntries([...allFuncs].sort((a, b) => b[1] - a[1]).slice(0, 60)) }, null, 2));
session.disconnect();
