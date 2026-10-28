#!/usr/bin/env node
// The agentic pipeline (ADR-0072): reads the backlog, plans the runnable tasks on Claude Code and Gemini (Antigravity
// CLI), runs them in parallel, one worktree each, within the usage budget, and resumes them after a usage limit.
// No dependencies; state that is only local lives in `.pipeline/` (ignored by git). See docs/pipeline/README.md.
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const REPO = path.resolve(HERE, '..', '..');
const CONFIG = JSON.parse(fs.readFileSync(path.join(HERE, 'config.json'), 'utf8'));
const STATE_DIR = path.join(REPO, '.pipeline');
const LOGS = path.join(STATE_DIR, 'log');
const RUNS = path.join(STATE_DIR, 'esecuzioni.json');
const BUDGET = path.join(STATE_DIR, 'budget.json');
const HISTORY = path.join(REPO, 'docs', 'pipeline', 'consumi.jsonl');
const PLAN = path.join(REPO, 'docs', 'pipeline', 'PIANO.md');
const RESUME = 'Ti sei fermato in questo punto, riprendi.';

const readJson = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } };
const writeJson = (file, data) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n'); };
const git = (args, cwd = REPO) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
const now = () => new Date().toISOString();

// --- The backlog -----------------------------------------------------------------------------------------------

/** Every task of the backlog: id, title, status, dependencies, and the `- Pipeline:` line if the planner wrote one. */
export function parseBacklog(text) {
  const tasks = [];
  const blocks = text.split(/^(?=### )/m).filter((b) => b.startsWith('### '));
  for (const block of blocks) {
    const header = block.split('\n', 1)[0];
    const m = /^### (T\d+[a-z]?) · (.+?)(?: — (.*))?$/.exec(header);
    if (!m) continue;
    const [, id, title, tail = ''] = m;
    const deps = new Set();
    for (const d of block.matchAll(/(?:dipende da|dipendenze:|dopo)\s*:?\s*([^)\n;.]*)/gi))
      for (const t of d[1].matchAll(/T\d+[a-z]?/g)) if (!t[0].startsWith(id)) deps.add(t[0]);
    const pipe = /^- Pipeline:\s*(.+)$/m.exec(block);
    const info = pipe ? parsePipelineLine(pipe[1]) : {};
    // A header that lists sub-tasks («T56a `fatto`, T56b `da fare`») gives one task per sub-task.
    const subs = [...tail.matchAll(/(T\d+[a-z])\s+`([^`]+)`/g)];
    if (subs.length) {
      for (const [, sub, status] of subs) tasks.push({ id: sub, title, status, deps: [...deps].filter((d) => d !== sub), ...info, parent: id });
    } else {
      const status = /`([^`]+)`/.exec(tail)?.[1] ?? 'da fare';
      tasks.push({ id, title, status, deps: [...deps], ...info });
    }
  }
  return tasks;
}

/** `claude · stima 4% · approvato · priorità 2` → { provider, estimate, approved, priority }. */
export function parsePipelineLine(line) {
  const parts = line.split('·').map((s) => s.trim().toLowerCase());
  const out = { provider: undefined, estimate: undefined, approved: false, priority: 100 };
  for (const p of parts) {
    if (p === 'claude' || p === 'gemini') out.provider = p;
    else if (/^stima\s+[\d.]+\s*%$/.test(p)) out.estimate = Number(/[\d.]+/.exec(p)[0]);
    else if (p === 'approvato') out.approved = true;
    else if (/^priorit[àa]\s+\d+$/.test(p)) out.priority = Number(/\d+/.exec(p)[0]);
  }
  return out;
}

const loadTasks = () => parseBacklog(fs.readFileSync(path.join(REPO, 'docs', 'plans', 'backlog.md'), 'utf8'));
const isDone = (s) => s.startsWith('fatto');

// --- Budget and limits -----------------------------------------------------------------------------------------

/** The remaining share (in % of the weekly limit) of each provider, refilled when its weekly reset has passed. */
function loadBudget() {
  const budget = readJson(BUDGET, {});
  for (const [prov, conf] of Object.entries(CONFIG.providers)) {
    const b = (budget[prov] ??= { residuo: 100, aggiornato: now() });
    const reset = lastReset(conf.resetSettimanale);
    if (reset && new Date(b.aggiornato) < reset) Object.assign(b, { residuo: 100, aggiornato: now(), fermoFino: undefined });
  }
  return budget;
}

/** The last weekly reset before now, from «giorno ora» (`gio 09:00`). */
function lastReset(spec) {
  if (!spec) return undefined;
  const days = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
  const [day, hm = '00:00'] = spec.split(/\s+/);
  const [h, min] = hm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, min, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() - days.indexOf(day) + 7) % 7));
  if (d > new Date()) d.setDate(d.getDate() - 7);
  return d;
}

/** Recognises the message of a usage limit in a CLI's output; gives when it resets, if it says so. */
export function usageLimit(output) {
  if (!/usage limit|limit reached|hit your limit|rate limit|quota|resource_exhausted|429/i.test(output)) return undefined;
  const epoch = /\|(\d{10})\b/.exec(output);
  if (epoch) return new Date(Number(epoch[1]) * 1000);
  return new Date(Date.now() + CONFIG.attesaLimiteMinuti * 60_000);
}

// --- The plan --------------------------------------------------------------------------------------------------

/** Tasks by queue: running, ready (dependencies done, approved, a provider and an estimate), waiting, blocked. */
function plan(tasks, runs, budget, only) {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const open = tasks.filter((t) => !isDone(t.status));
  const queues = { inCorso: [], pronti: [], daApprovare: [], daStimare: [], bloccati: [], inAttesa: [] };
  for (const t of open) {
    if (runs[t.id] && runs[t.id].stato !== 'finito') { queues.inCorso.push(t); continue; }
    if (t.status.startsWith('in attesa')) { queues.inAttesa.push(t); continue; }
    if (t.status.startsWith('in corso')) continue; // someone is working on it by hand
    // A dependency without a block of its own (T53a) is its parent's (T53).
    const missing = t.deps.map((d) => (byId.has(d) ? d : d.replace(/[a-z]$/, ''))).filter((d) => byId.has(d) && !isDone(byId.get(d).status));
    if (missing.length) { queues.bloccati.push({ ...t, missing }); continue; }
    if (!t.provider || t.estimate === undefined) { queues.daStimare.push(t); continue; }
    if (!t.approved && CONFIG.approvazione === 'manuale') { queues.daApprovare.push(t); continue; }
    if (only && t.provider !== only) continue;
    queues.pronti.push(t);
  }
  queues.pronti.sort((a, b) => a.priority - b.priority);
  return queues;
}

function writePlan(queues, budget) {
  const line = (t) => `- **${t.id}** ${t.title}${t.provider ? ` — ${t.provider}, ${t.estimate ?? '?'} %` : ''}${t.missing ? ` (aspetta ${t.missing.join(', ')})` : ''}`;
  const section = (title, list) => `## ${title} (${list.length})\n\n${list.map(line).join('\n') || '_nessuno_'}\n`;
  const budgets = Object.entries(budget).map(([p, b]) => `- ${p}: ${b.residuo} % residuo${b.fermoFino ? `, fermo fino a ${b.fermoFino}` : ''}`).join('\n');
  const text = `# Il piano della pipeline\n\n> Generato da \`node tools/pipeline/pipeline.mjs stato\` il ${now()}: non modificarlo a mano,\n> la fonte è \`docs/plans/backlog.md\` (righe \`- Pipeline:\`).\n\n## Budget\n\n${budgets}\n\n` +
    [['In corso', queues.inCorso], ['Pronti, in ordine di priorità', queues.pronti], ['Da approvare (provider e stima proposti)', queues.daApprovare],
      ['Da stimare (manca la riga `- Pipeline:`)', queues.daStimare], ['Bloccati da dipendenze', queues.bloccati], ['In attesa dell\'autore', queues.inAttesa]]
      .map(([t, l]) => section(t, l)).join('\n');
  fs.writeFileSync(PLAN, text);
}

// --- Worktrees -------------------------------------------------------------------------------------------------

function worktrees() {
  const out = git(['worktree', 'list', '--porcelain']);
  return out.split(/\n\n/).map((b) => ({ path: /^worktree (.+)$/m.exec(b)?.[1], branch: /^branch refs\/heads\/(.+)$/m.exec(b)?.[1] })).filter((w) => w.path);
}

/** The worktree of a task: `.claude/worktrees/<id>` of the main repository, branch `task/<id>` from the base. */
function taskWorktree(id) {
  const branch = `task/${id}`;
  const existing = worktrees().find((w) => w.branch === branch);
  if (existing) return { dir: existing.path, branch };
  const main = path.resolve(git(['rev-parse', '--path-format=absolute', '--git-common-dir']), '..');
  const dir = path.join(main, '.claude', 'worktrees', id.toLowerCase());
  const exists = git(['branch', '--list', branch]) !== '';
  git(['worktree', 'add', dir, ...(exists ? [branch] : ['-b', branch, CONFIG.base])]);
  // node_modules of the base, shared through a junction (no install per task).
  const base = worktrees().find((w) => w.branch === CONFIG.base)?.path ?? REPO;
  const nm = path.join(base, 'node_modules');
  if (fs.existsSync(nm) && !fs.existsSync(path.join(dir, 'node_modules'))) fs.symlinkSync(nm, path.join(dir, 'node_modules'), 'junction');
  return { dir, branch };
}

// --- Running a task --------------------------------------------------------------------------------------------

function taskPrompt(t, wt) {
  return CONFIG.prompt.replaceAll('{id}', t.id).replaceAll('{dir}', wt.dir).replaceAll('{branch}', wt.branch).replaceAll('{base}', CONFIG.base);
}

/** Starts (or resumes) the CLI of a task's provider; resolves with the run when the process ends. */
function launch(t, run) {
  const conf = CONFIG.providers[t.provider];
  const resume = Boolean(run.sessione);
  const args = resume
    ? [...conf.args, ...conf.resume.map((a) => a.replace('{sessione}', run.sessione)), '-p', RESUME]
    : [...conf.args, '-p', taskPrompt(t, run)];
  fs.mkdirSync(LOGS, { recursive: true });
  const log = path.join(LOGS, `${t.id}.${run.tentativi}.log`);
  const out = fs.createWriteStream(log);
  const child = spawn(conf.cmd, args, { cwd: run.dir, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  let text = '';
  child.stdout.on('data', (d) => { text += d; out.write(d); });
  child.stderr.on('data', (d) => { text += d; out.write(d); });
  return new Promise((resolve) => child.on('close', (code) => { out.end(); resolve({ code, text, log }); }));
}

/** What a CLI said, from its JSON output (Claude: `session_id`, `total_cost_usd`, `result`; Gemini: what it has). */
export function readOutput(text) {
  let json;
  for (const line of text.trim().split('\n').reverse()) { try { json = JSON.parse(line); break; } catch { /* not JSON */ } }
  if (!json) { try { json = JSON.parse(text); } catch { json = {}; } }
  const result = String(json.result ?? json.response ?? json.text ?? text);
  return {
    session: json.session_id ?? json.sessionId ?? json.conversation_id ?? json.conversationId,
    cost: json.total_cost_usd,
    error: Boolean(json.is_error),
    result,
    outcome: /ESITO:\s*(fatto|in attesa|fallito)[^\n]*/i.exec(result)?.[0],
  };
}

async function execute({ max = CONFIG.maxParalleli, only, task } = {}) {
  const runs = readJson(RUNS, {});
  const active = new Map(); // id → promise
  const saveRuns = () => writeJson(RUNS, runs);
  for (;;) {
    const budget = loadBudget();
    const tasks = loadTasks();
    const queues = plan(tasks, runs, budget, only);
    writePlan(queues, budget);
    // Suspended runs whose limit has reset come first; then ready tasks within the budget.
    const candidates = [
      ...Object.values(runs).filter((r) => r.stato === 'sospeso' && !active.has(r.id) && new Date(r.fermoFino) <= new Date())
        .map((r) => ({ ...tasks.find((t) => t.id === r.id), id: r.id, provider: r.provider, estimate: r.stima })),
      ...queues.pronti.filter((t) => !runs[t.id] && (!task || t.id === task)),
    ];
    for (const t of candidates) {
      const b = budget[t.provider];
      if (b.fermoFino && new Date(b.fermoFino) > new Date()) continue;
      const committed = [...active.keys()].map((id) => runs[id]).filter((r) => r.provider === t.provider).reduce((s, r) => s + r.stima, 0);
      const left = b.residuo - committed;
      const cap = left < CONFIG.sogliaUnSolo ? 1 : max;
      const running = [...active.keys()].filter((id) => runs[id].provider === t.provider).length;
      if (active.size >= max || running >= cap || (!runs[t.id] && t.estimate > left - CONFIG.riserva)) continue;
      const run = runs[t.id] ?? { id: t.id, provider: t.provider, stima: t.estimate, tentativi: 0, inizio: now(), ...(() => { const w = taskWorktree(t.id); return { dir: w.dir, branch: w.branch }; })() };
      run.tentativi += 1;
      run.stato = 'in corso';
      runs[t.id] = run;
      saveRuns();
      console.log(`[${now()}] ${run.sessione ? 'riprendo' : 'lancio'} ${t.id} su ${t.provider} (${run.dir})`);
      active.set(t.id, launch(t, run).then((r) => finish(run, r, runs, saveRuns)).finally(() => active.delete(t.id)));
    }
    if (!active.size) {
      const waiting = Object.values(runs).filter((r) => r.stato === 'sospeso');
      if (!waiting.length) { console.log('Niente da lanciare: fine.'); return; }
      const next = Math.min(...waiting.map((r) => new Date(r.fermoFino).getTime()));
      console.log(`[${now()}] tutti fermi per i limiti; riprendo il ${new Date(next).toISOString()}`);
    }
    await new Promise((r) => setTimeout(r, CONFIG.controlloSecondi * 1000));
  }
}

function finish(run, { code, text, log }, runs, saveRuns) {
  const out = readOutput(text);
  if (out.session) run.sessione = out.session;
  const limit = usageLimit(out.error || code !== 0 ? text : '');
  const budget = loadBudget();
  if (limit) {
    Object.assign(run, { stato: 'sospeso', fermoFino: limit.toISOString() });
    budget[run.provider].fermoFino = limit.toISOString();
    budget[run.provider].residuo = Math.min(budget[run.provider].residuo, CONFIG.sogliaUnSolo - 1);
    console.log(`[${now()}] ${run.id}: limite di ${run.provider}, riprendo dopo ${run.fermoFino}`);
  } else {
    Object.assign(run, { stato: 'finito', fine: now(), esito: out.outcome ?? (code === 0 ? 'ESITO: ? (senza riga)' : `ESITO: fallito (codice ${code})`) });
    budget[run.provider].residuo = Math.max(0, budget[run.provider].residuo - run.stima);
    budget[run.provider].aggiornato = now();
    fs.mkdirSync(path.dirname(HISTORY), { recursive: true });
    fs.appendFileSync(HISTORY, JSON.stringify({ task: run.id, provider: run.provider, stima: run.stima, costoUsd: out.cost, minuti: Math.round((Date.parse(run.fine) - Date.parse(run.inizio)) / 60000), tentativi: run.tentativi, esito: run.esito, data: run.fine }) + '\n');
    console.log(`[${now()}] ${run.id}: ${run.esito} (log ${log})`);
  }
  writeJson(BUDGET, budget);
  saveRuns();
}

// --- Commands --------------------------------------------------------------------------------------------------

function status() {
  const budget = loadBudget();
  writeJson(BUDGET, budget);
  const queues = plan(loadTasks(), readJson(RUNS, {}), budget);
  writePlan(queues, budget);
  for (const [k, l] of Object.entries(queues)) console.log(`${k}: ${l.map((t) => t.id).join(' ') || '—'}`);
  console.log(`Budget: ${Object.entries(budget).map(([p, b]) => `${p} ${b.residuo} %`).join(', ')}. Piano in docs/pipeline/PIANO.md`);
}

function listWorktrees() {
  for (const w of worktrees()) {
    if (!w.branch) { console.log(`${w.path}: (staccato)`); continue; }
    const unique = w.branch === CONFIG.base ? 0 : Number(git(['rev-list', '--count', '--cherry-pick', '--right-only', `${CONFIG.base}...${w.branch}`]));
    const dirty = git(['status', '--porcelain'], w.path).split('\n').filter(Boolean).length;
    const note = w.branch === CONFIG.base ? 'base' : !unique && !dirty ? 'tutto già in base: si può togliere (git worktree remove)' : `${unique} commit non in ${CONFIG.base}, ${dirty} file non committati`;
    console.log(`${w.branch.padEnd(14)} ${note}  — ${w.path}`);
  }
}

function integrate(id) {
  const base = worktrees().find((w) => w.branch === CONFIG.base);
  git(['merge', '--no-ff', '-m', `Pipeline: integra ${id}`, `task/${id}`], base.path);
  const runs = readJson(RUNS, {});
  if (runs[id]) { runs[id].integrato = now(); writeJson(RUNS, runs); }
  console.log(`task/${id} integrato in ${CONFIG.base}. Per togliere il worktree: git worktree remove ${runs[id]?.dir ?? `<dir di ${id}>`}`);
}

const [cmd, ...rest] = process.argv.slice(2);
const flag = (name) => { const i = rest.indexOf(`--${name}`); return i >= 0 ? rest[i + 1] : undefined; };
if (process.argv[1]?.endsWith('pipeline.mjs')) {
  if (cmd === 'stato' || !cmd) status();
  else if (cmd === 'esegui') await execute({ max: Number(flag('max') ?? CONFIG.maxParalleli), only: flag('solo'), task: flag('task') });
  else if (cmd === 'budget') { const b = loadBudget(); b[rest[0]] = { ...b[rest[0]], residuo: Number(rest[1]), aggiornato: now(), fermoFino: undefined }; writeJson(BUDGET, b); status(); }
  else if (cmd === 'worktree') listWorktrees();
  else if (cmd === 'integra') integrate(rest[0]);
  else console.log('Comandi: stato | esegui [--max N] [--solo claude|gemini] [--task Txx] | budget <claude|gemini> <residuo %> | worktree | integra <Txx>');
}
