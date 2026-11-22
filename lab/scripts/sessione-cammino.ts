// T488: a scripted session of walking, offline, with the calls counted: the path of the first run of the beta (lab/banco/run-1/percorso.json,
// written by consumi-run.ts) walked again over the seed's world in `--minuti` minutes of the world, by a kernel on local models that answer
// as Gemini did in the run, after the time Gemini takes (in the world's time, not the machine's):
//   npx vite-node lab/scripts/sessione-cammino.ts -- [--minuti 18] [--sorgente <cartella con src/ e universe/>] [--vicino <caselle>] [--json f]
// `--sorgente` runs another kernel (the one of before: `git archive <commit> src universe | tar -x -C <cartella>`); `--vicino Infinity` widens the
// reach of T488 to every loaded place (the rule of before, in this kernel).
// The models are the local ones (MockAiModels) under another name, so the kernel asks what it asks a real model (packs, kinds, sessions); the
// plans of the Cartographer get what Gemini's had in the run (per plan: 3 things on the ground, some never seen before; 1.2 structures, most of
// a new concept; half a new thing asked for). The Sculptor is not run: each model it would make is counted by class and takes its time.
// The dollars: each call at what a call of its task cost in the run (`lab/banco/run-1/misura.json`), each model at what a model of its kind
// cost; and at the lobby's estimate (`callCost`, `structureCost`). Also how long the wanderer stood on a draft.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (name: string, def?: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const root = path.resolve(opt('--sorgente', path.resolve(import.meta.dirname ?? '.', '../..'))!);
const minutes = Number(opt('--minuti', '18'));
const near = opt('--vicino');
const load = async (p: string) => import(pathToFileURL(path.join(root, p)).href);
const { Kernel } = await load('src/kernel/kernel.ts');
const { bundledFiles } = await load('src/kernel/bundle.ts');
const { memoryStore } = await load('src/kernel/repo.ts');
const { MockAiModels } = await load('src/kernel/ai/mock.ts');
const { MemoryChunks } = await load('src/kernel/chunks.ts');
const { emptyUsage } = await load('src/kernel/ai/models.ts');
const { callCost, structureCost, sculptPlan, repairCoefficients } = await load('src/kernel/coefficients.ts');
if (near !== undefined) {
  if (!Kernel.REACH) throw new Error('questo kernel non ha il raggio di T488: --vicino non vale');
  Kernel.REACH = { ...Kernel.REACH, near: Number(near) };
}

// --- The path ---
const walk = JSON.parse(await fs.readFile(path.resolve(import.meta.dirname ?? '.', '../banco/run-1/percorso.json'), 'utf8')) as { seconds: number; points: Array<{ x: number; y: number; t: number; helm?: boolean; jump?: boolean }> };
const T = minutes * 60;
const scale = T / walk.seconds;
const pts = walk.points.map((p) => ({ ...p, t: p.t * scale }));
function at(t: number): { x: number; y: number; helm: boolean } {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if (t > b.t) continue;
    if (b.jump || b.t <= a.t) return { x: a.x, y: a.y, helm: !!b.helm };
    const f = (t - a.t) / (b.t - a.t);
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, helm: !!b.helm };
  }
  const z = pts[pts.length - 1];
  return { x: z.x, y: z.y, helm: !!z.helm };
}

// --- Gemini's time and Gemini's plans ---
/** Seconds of the world a call takes (a guess from the run: Flash-Lite with a little thinking; the Sculptor's structure is five calls of Argon). */
const LATENCY: Record<string, number> = { 'chunk.plan': 6, 'content.define': 5, 'npc.individuate': 8, 'council.session': 6 };
const SCULPT_TIME: Record<string, number> = { structure: 150, building: 150, person: 45, animal: 45, beast: 45, figure: 45 };
let now = 0;
const waiting: Array<{ at: number; done: () => void }> = [];
const later = (s: number) => new Promise<void>((done) => waiting.push({ at: now + s, done }));
const calls: Record<string, number> = {};
let fresh = 0;
/** A name no thing of the world has, nor holds (the kernel finds things by a part of their name): three syllables, twice. */
const SYL = ['zu', 'qa', 'xe', 'vo', 'ki', 'dru', 'fe', 'gno', 'hu', 'jo', 'ky', 'wy', 'ny', 'pyr', 'bly', 'tz'];
const word = (n: number) => SYL[n % 16] + SYL[(n >> 4) % 16] + SYL[(n >> 8) % 16];
const newName = () => {
  const n = ++fresh;
  return `${word(n)} ${word(n * 7 + 3)}`;
};
const rng = (seed: string) => {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
};
class RunLike {
  readonly name = 'banco';
  readonly world = undefined;
  readonly usage = emptyUsage();
  limits = { text: Infinity };
  textModel = 'gemini-3.1-flash-lite';
  inner = Object.assign(new MockAiModels(), { latency: 0 });
  decide(call: unknown) {
    return this.inner.decide(call);
  }
  async text(call: { task: string; data?: any }): Promise<string> {
    this.usage.text++;
    calls[call.task] = (calls[call.task] ?? 0) + 1;
    await later(LATENCY[call.task] ?? 5);
    const answer = await this.inner.text(call);
    if (call.task !== 'chunk.plan') return answer;
    const plan = JSON.parse(answer);
    const d = call.data ?? {};
    const r = rng(`${d.cx},${d.cy},${d.attempt}`);
    // The run's plans: 3 things on the ground (some new to the world), 1.2 structures (most of a new concept), half a new thing.
    const known = [...((d.wanted as string[]) ?? []), 'pane', 'mela', 'corda'];
    plan.ground = [0, 1, 2].map(() => (r() < 0.35 ? newName() : known[Math.floor(r() * known.length)]));
    if (!plan.structures?.length && !d.start) plan.structures = r() < 0.75 ? [{ concept: r() < 0.7 ? `edificio ${newName()}` : 'la bottega del borgo' }] : [];
    if (r() < 0.5) plan.fresh = [{ concept: `strumento ${newName()}`, where: 'outside' }];
    return JSON.stringify(plan);
  }
}
const ai = new RunLike();

// --- The world: the seed's, its first places planned as a generated universe has them ---
const files = { ...bundledFiles };
const u = JSON.parse(files['universe.json']);
u.ai = { ...u.ai, maxText: 1200 };
files['universe.json'] = JSON.stringify(u);
const k = await Kernel.boot({ files, store: memoryStore(), ai, chunks: new MemoryChunks() });
// The Sculptor counted, not run; the Musician and the Scenografo quiet (the run asked neither).
const sculpted: Record<string, number> = {};
const director = k.sculpting as any;
director.make = async (req: { id: string; classe: string; taglia?: string }) => {
  director.busy = true;
  director.used++;
  const kind = ['structure', 'building'].includes(req.classe) ? 'structure' : ['person', 'animal', 'beast'].includes(req.classe) ? 'figure' : 'simple';
  sculpted[kind] = (sculpted[kind] ?? 0) + 1;
  await later(SCULPT_TIME[req.classe] ?? 15);
  director.skip.add(req.id);
  director.busy = false;
  return true;
};
k.composing.pump = () => {};
k.furnishing.pump = () => {};
const flush = () => new Promise<void>((r) => setImmediate(r));
async function advance(dt: number) {
  k.tick(dt);
  now = k.time;
  for (const w of waiting.filter((x) => x.at <= now)) {
    waiting.splice(waiting.indexOf(w), 1);
    w.done();
  }
  await flush();
}
const S = k.config.chunkSize;
const WALK_VIEW = { w: Math.ceil(15 * 2.4 * (16 / 9)), h: Math.ceil(15 * 2.2) };
const HELM_VIEW = { w: Math.ceil(22 * 2.4 * (16 / 9)), h: Math.ceil(22 * 2.2) };
k.view = WALK_VIEW;
for (let cy = -2; cy <= 2; cy++)
  for (let cx = -2; cx <= 2; cx++) {
    let done = false;
    void k.planAhead(cx, cy).finally(() => (done = true));
    for (let i = 0; i < 6000 && !done; i++) await advance(1 / 60);
  }
for (let i = 0; i < 600; i++) await advance(1 / 60);
for (const key of Object.keys(calls)) delete calls[key];
for (const key of Object.keys(sculpted)) delete sculpted[key];
const planned0 = [...k.chunks.values()].filter((c: any) => c.stage === 'planned').length;

// --- The walk ---
const place = (x: number, y: number) => k.chunks.get(`${Math.floor(x / S)},${Math.floor(y / S)}`);
let onDraft = 0, aheadDraft = 0, longest = 0, run = 0;
const plannedKeys = new Set<string>();
k.bus.on('chunk:planned', (e: { key: string }) => plannedKeys.add(e.key));
const start = k.time;
const dt = 1 / 60;
let last = at(0);
for (let t = 0; t < T; t += dt) {
  const p = at(t);
  k.view = p.helm ? HELM_VIEW : WALK_VIEW;
  const me = k.wandererPos();
  me.x = 0;
  me.y = 0;
  Object.assign(k.carpet()!, { ox: p.x, oy: p.y });
  const n = k.needs();
  if (n) Object.assign(n, { hunger: 100, thirst: 100, energy: 100, health: 100 });
  await advance(dt);
  const here = place(p.x, p.y);
  const v = Math.hypot(p.x - last.x, p.y - last.y);
  const ahead = v > 0 ? place(p.x + ((p.x - last.x) / v) * 2, p.y + ((p.y - last.y) / v) * 2) : here;
  last = p;
  if (!here || here.stage === 'draft') {
    if (args.includes('--debug') && Math.round(t * 60) % 60 === 0) console.log('bozza', t.toFixed(1), JSON.stringify(p), here?.key, here?.far, here?.developing, here?.held, (k as any).developers, JSON.stringify((k as any).walkersNow), JSON.stringify(calls));
    onDraft += dt;
    run += dt;
    longest = Math.max(longest, run);
  } else run = 0;
  if (!ahead || ahead.stage === 'draft') aheadDraft += dt;
}
const seconds = k.time - start;

// --- The dollars ---
const misura = JSON.parse(await fs.readFile(path.resolve(import.meta.dirname ?? '.', '../banco/run-1/misura.json'), 'utf8'));
const runCall = (task: string) => {
  const rows = (misura.calls as Array<{ model: string; task: string; calls: number; usd: number }>).filter((c) => c.task === task && c.model === 'gemini-3.1-flash-lite');
  const n = rows.reduce((s, c) => s + c.calls, 0);
  return n ? rows.reduce((s, c) => s + c.usd, 0) / n : callCost('gemini-3.1-flash-lite', task);
};
const runModel = (model: string, task = 'model.sculpt') => (misura.calls as Array<{ model: string; task: string; calls: number; usd: number }>).find((c) => c.model === model && c.task === task);
const argon = runModel('gemini-4-argon');
const structures = (misura.structures as Array<{ author: string }>).filter((s) => s.author === 'gemini-4-argon').length;
const judge = runModel('gemini-3.5-flash', 'model.judge');
const sculptCalls = (misura.calls as Array<{ task: string; calls: number }>).filter((c) => c.task === 'model.sculpt').reduce((s, c) => s + c.calls, 0);
const judgeEach = judge ? judge.usd / sculptCalls : 0;
const simple = runModel('gemini-3.1-flash-lite');
const figure = runModel('gemini-3.8-flash');
const MODEL_RUN = {
  structure: argon ? argon.usd / Math.max(1, structures) + (argon.calls / Math.max(1, structures)) * judgeEach : 0.35,
  simple: simple ? (simple.usd + simple.calls * judgeEach) / 9 : 0.02,
  figure: figure ? (figure.usd + figure.calls * judgeEach) / 4 : 0.03,
};
const plan = sculptPlan(repairCoefficients(k.config.ai.coefficients).reviews);
const MODEL_LIST = {
  structure: structureCost('gemini-4-argon'),
  simple: plan.semplici * callCost('gemini-3.1-flash-lite', 'model.sculpt') + (plan.giudizio ? callCost('gemini-3.5-flash', 'model.judge') : 0),
  figure: (1 + (plan.revisione ? 0.5 : 0)) * (callCost('gemini-3.8-flash', 'model.sculpt') + (plan.giudizio ? callCost('gemini-3.5-flash', 'model.judge') : 0)),
};
const rows = Object.entries(calls).sort((a, b) => b[1] - a[1]).map(([task, n]) => ({ task, n, run: n * runCall(task), list: n * callCost('gemini-3.1-flash-lite', task) }));
const models = Object.entries(sculpted).map(([kind, n]) => ({ kind, n, run: n * MODEL_RUN[kind as keyof typeof MODEL_RUN], list: n * MODEL_LIST[kind as keyof typeof MODEL_LIST] }));
const total = (key: 'run' | 'list') => rows.reduce((s, r) => s + r[key], 0) + models.reduce((s, r) => s + r[key], 0);
const perHour = (x: number) => (x * 3600) / seconds;
const out = {
  kernel: root,
  reach: Kernel.REACH ?? 'prima di T488',
  minutes: seconds / 60,
  plannedBefore: planned0,
  plannedInWalk: plannedKeys.size,
  calls,
  sculpted,
  onDraft: Math.round(onDraft * 10) / 10,
  longestOnDraft: Math.round(longest * 10) / 10,
  aheadDraft: Math.round(aheadDraft * 10) / 10,
  usdRun: total('run'),
  usdList: total('list'),
  perHourRun: perHour(total('run')),
  perHourList: perHour(total('list')),
  rows,
  models,
};
const json = opt('--json');
if (json) await fs.writeFile(json, JSON.stringify(out, null, 1) + '\n');
console.log(`kernel ${root}; raggio ${JSON.stringify(out.reach)}`);
console.log(`${out.minutes.toFixed(1)} minuti; luoghi pianificati prima del cammino ${planned0}, nel cammino ${plannedKeys.size}; sulla bozza ${out.onDraft} s (al più ${out.longestOnDraft} di fila), bozza due caselle davanti ${out.aheadDraft} s`);
console.log(`${total('run').toFixed(3)} $ ai costi della run (${out.perHourRun.toFixed(2)} $/h), ${total('list').toFixed(3)} $ alla stima della lobby (${out.perHourList.toFixed(2)} $/h)`);
for (const r of rows) console.log(`  ${r.task} ${r.n} ${r.run.toFixed(3)} ${r.list.toFixed(3)}`);
for (const m of models) console.log(`  modelli ${m.kind} ${m.n} ${m.run.toFixed(3)} ${m.list.toFixed(3)}`);
process.exit(0);
