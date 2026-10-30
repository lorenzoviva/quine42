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
const REPORT = path.join(REPO, 'docs', 'pipeline', 'orchestrazione.md');
const ORCHESTRATOR = path.join(STATE_DIR, 'orchestratore.json');
const RESUME = 'Ti sei fermato in questo punto, riprendi.';

const readJson = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } };
const writeJson = (file, data) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n'); };
const git = (args, cwd = REPO) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
const now = () => new Date().toISOString();

/** Prints an event and appends it to the diary of `orchestrazione.md`, so the next orchestrator knows what happened. */
function say(text) {
  const line = `[${now()}] ${text}`;
  console.log(line);
  try { fs.appendFileSync(REPORT, `- ${line}
`); } catch { /* the report is a convenience */ }
}

/** The provider the orchestrating agent runs on (`orchestratore`, set by hand when its credits end). */
function orchestrator() {
  return readJson(ORCHESTRATOR, {}).provider ?? CONFIG.orchestratore;
}

/**
 * How many tasks a provider may run at once: `max`, one under `sogliaUnSolo` (week or 5 hours), none if the
 * orchestrator runs on it, so the tasks never take the credits the orchestration needs to go on.
 */
export function capOf({ left, session = 100, provider, orchestrator: orch, max, threshold }) {
  if (left >= threshold && session >= threshold) return max;
  return provider === orch ? 0 : 1;
}

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
      for (const t of d[1].matchAll(/T\d+[a-z]?/g)) if (!new RegExp(`^${id}[a-z]?$`).test(t[0])) deps.add(t[0]); // not itself nor its sub-tasks (T6 ≠ T63)
    const pipe = /^- Pipeline:\s*(.+)$/m.exec(block);
    const info = pipe ? parsePipelineLine(pipe[1]) : {};
    // A header that lists sub-tasks («T56a `fatto`, T56b `da fare`») gives one task per sub-task.
    const subs = [...tail.matchAll(/(T\d+[a-z])\s+`([^`]+)`/g)];
    if (subs.length) {
      for (const [, sub, status] of subs) tasks.push({ id: sub, title, status, deps: [...deps].filter((d) => d !== sub), ...info, parent: id });
    } else {
      // Without a status in backticks the tail says what the task is («spezzato in T43a-T43c»): not runnable by itself.
      const status = /`([^`]+)`/.exec(tail)?.[1] ?? (tail.trim() || 'da fare');
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
    if (CONFIG.providers[p]) out.provider = p;
    else if (/^stima\s+[\d.]+\s*%$/.test(p)) out.estimate = Number(/[\d.]+/.exec(p)[0]);
    else if (p === 'approvato') out.approved = true;
    else if (/^priorit[àa]\s+\d+$/.test(p)) out.priority = Number(/\d+/.exec(p)[0]);
  }
  return out;
}

const loadTasks = () => parseBacklog(fs.readFileSync(path.join(REPO, 'docs', 'plans', 'backlog.md'), 'utf8'));
const isDone = (s) => s.startsWith('fatto');

// --- Budget and limits -----------------------------------------------------------------------------------------

/**
 * The counters of a provider from its `/usage` (both windows, 5 hours and weekly; Gemini one per model group):
 * [{ nome, finestra: '5h' | 'settimana', residuo (%), reset (ISO) }], or undefined if the CLI does not answer.
 */
export function parseUsage(provider, text) {
  const counters = [];
  if (provider === 'claude') {
    // «Current week (all models): 99% used · resets Oct 29, 5pm (Europe/Rome)»
    for (const m of text.matchAll(/^Current (session|week[^:]*):\s*(\d+)% used · resets (.+)$/gm))
      counters.push({ nome: m[1], finestra: m[1] === 'session' ? '5h' : 'settimana', residuo: 100 - Number(m[2]), reset: localDate(m[3]) });
  } else {
    // «Gemini Models<TAB>Weekly Limit Remaining<TAB>100%<TAB>2026-11-04T18:44:53Z»
    for (const line of text.split('\n')) {
      const [nome, label, pct, reset] = line.split('\t').map((s) => s?.trim());
      if (!/%$/.test(pct ?? '')) continue;
      counters.push({ nome, finestra: /five hour/i.test(label) ? '5h' : 'settimana', residuo: Number(pct.slice(0, -1)), reset: isoOrUndefined(reset) });
    }
  }
  return counters.length ? counters : undefined;
}

const isoOrUndefined = (text) => { const d = new Date(text ?? NaN); return Number.isNaN(d.getTime()) ? undefined : d.toISOString(); };

/** «Oct 29, 12:10am (Europe/Rome)» or «5pm» in the machine's time zone (the CLI's), as ISO. */
function localDate(text) {
  const m = /(?:([A-Z][a-z]{2}) (\d+),?\s*)?(\d+)(?::(\d+))?\s*(am|pm)/i.exec(text);
  if (!m) return undefined;
  const d = new Date();
  if (m[1]) d.setMonth(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(m[1]), Number(m[2]));
  d.setHours((Number(m[3]) % 12) + (m[5].toLowerCase() === 'pm' ? 12 : 0), Number(m[4] ?? 0), 0, 0);
  if (d < new Date(Date.now() - 86_400_000)) d.setFullYear(d.getFullYear() + 1); // December → January
  return d.toISOString();
}

/**
 * Every counter of a provider's CLI (`tutti`: in Antigravity one per model group, also the ones the pipeline does not use)
 * and the ones that decide for it (`contatori`, matching `contatori` in config.json). One `/usage` per CLI per read.
 */
function readUsage(provider, cache) {
  const conf = CONFIG.providers[provider];
  try {
    if (!cache.has(conf.cmd)) {
      const text = execFileSync(conf.cmd, ['-p', '/usage'], { encoding: 'utf8', timeout: 120_000, env: { ...process.env, MSYS_NO_PATHCONV: '1' }, windowsHide: true });
      cache.set(conf.cmd, parseUsage(conf.cmd === 'claude' ? 'claude' : 'gemini', text));
    }
    const all = cache.get(conf.cmd);
    return all && { tutti: all, contatori: all.filter((c) => new RegExp(conf.contatori ?? '.').test(c.nome)) };
  } catch { return undefined; }
}

/**
 * The budget of each provider: its counters read from `/usage` (at most every `usoSecondi`); `residuo` is the lowest
 * weekly one, `sessione` the lowest 5-hour one; an empty counter stops the provider until it resets. Without counters,
 * the remaining share set by hand (`budget`), refilled at `resetSettimanale`.
 */
const lowest = (counters, w) => Math.min(100, ...counters.filter((c) => c.finestra === w).map((c) => c.residuo));

function loadBudget({ read = true } = {}) {
  const budget = readJson(BUDGET, {});
  const cache = new Map();
  for (const [prov, conf] of Object.entries(CONFIG.providers)) {
    const b = (budget[prov] ??= { residuo: 100, aggiornato: now() });
    if (read && !(b.letto && Date.now() - Date.parse(b.letto) < CONFIG.usoSecondi * 1000)) {
      const usage = readUsage(prov, cache);
      if (usage?.contatori.length) Object.assign(b, { ...usage, letto: now(), residuo: lowest(usage.contatori, 'settimana'), sessione: lowest(usage.contatori, '5h') });
    }
    if (b.contatori && b.letto && Date.now() - Date.parse(b.letto) < CONFIG.usoSecondi * 2000) {
      const empty = b.contatori.filter((c) => c.residuo <= (c.finestra === 'settimana' ? CONFIG.riserva : 0) && c.reset);
      b.fermoFino = empty.length ? empty.map((c) => c.reset).sort().at(-1) : b.fermoFino && new Date(b.fermoFino) > new Date() ? b.fermoFino : undefined;
      continue;
    }
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
export function usageLimit(output, from = new Date()) {
  if (!/usage limit|limit reached|hit your (?:[\w-]+ )?limit|rate limit|quota|resource_exhausted|\b429\b/i.test(output)) return undefined;
  const epoch = /\|(\d{10})\b/.exec(output);
  if (epoch) return new Date(Number(epoch[1]) * 1000);
  // «resets 10pm», «resets 9:30am»: the next time it is that hour (local time), a minute after.
  const at = /resets\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i.exec(output);
  if (at) {
    const d = new Date(from);
    d.setHours((Number(at[1]) % 12) + (at[3].toLowerCase() === 'pm' ? 12 : 0), Number(at[2] ?? 0), 0, 0);
    if (d <= from) d.setDate(d.getDate() + 1);
    return new Date(d.getTime() + 60_000);
  }
  return new Date(from.getTime() + CONFIG.attesaLimiteMinuti * 60_000);
}

// --- The plan --------------------------------------------------------------------------------------------------

/** Tasks by queue: running, ready (dependencies done, approved, a provider and an estimate), waiting, blocked. */
function plan(tasks, runs, budget, only) {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const open = tasks.filter((t) => !isDone(t.status));
  const queues = { inCorso: [], daIntegrare: [], pronti: [], daApprovare: [], daStimare: [], bloccati: [], inAttesa: [] };
  for (const t of open) {
    if (runs[t.id] && runs[t.id].stato !== 'finito') { queues.inCorso.push(t); continue; }
    if (runs[t.id] && !runs[t.id].integrato) { queues.daIntegrare.push({ ...t, provider: runs[t.id].provider, title: `${t.title} — ${runs[t.id].esito}` }); continue; }
    if (t.status.startsWith('in attesa')) { queues.inAttesa.push(t); continue; }
    if (!t.status.startsWith('da fare')) continue; // in corso by hand, or split into sub-tasks
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

const describe = (b) => `settimana ${b.residuo} %, 5 ore ${b.sessione ?? '?'} %${b.fermoFino ? `, fermo fino a ${b.fermoFino}` : ''}`;

function writePlan(queues, budget) {
  const line = (t) => `- **${t.id}** ${t.title}${t.provider ? ` — ${t.provider}, ${t.estimate ?? '?'} %` : ''}${t.missing ? ` (aspetta ${t.missing.join(', ')})` : ''}`;
  const section = (title, list) => `## ${title} (${list.length})\n\n${list.map(line).join('\n') || '_nessuno_'}\n`;
  const budgets = Object.entries(budget).map(([p, b]) => `- **${p}**: ${describe(b)}${b.letto ? ` (letto da /usage il ${b.letto})` : ' (impostato a mano)'}` +
    (b.contatori ?? []).map((c) => `\n  - ${c.nome}, ${c.finestra}: ${c.residuo} % residuo, reset ${c.reset}`).join('')).join('\n');
  const text = `# Il piano della pipeline\n\n> Generato da \`node tools/pipeline/pipeline.mjs stato\` il ${now()}: non modificarlo a mano,\n> la fonte è \`docs/plans/backlog.md\` (righe \`- Pipeline:\`).\n\n## Budget\n\nOrchestratore: **${orchestrator()}** (sotto il ${CONFIG.sogliaUnSolo} % nessun task su di lui; si cambia con \`orchestratore <provider>\`).\n\n${budgets}\n\n` +
    [['In corso', queues.inCorso], ['Finiti, da guardare e integrare (`integra Txx`)', queues.daIntegrare], ['Pronti, in ordine di priorità', queues.pronti], ['Da approvare (provider e stima proposti)', queues.daApprovare],
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
  for (const line of text.trim().split('\n').reverse()) { try { const v = JSON.parse(line); if (v && typeof v === 'object') { json = v; break; } } catch { /* not JSON */ } }
  if (!json) { try { const v = JSON.parse(text); json = v && typeof v === 'object' ? v : {}; } catch { json = {}; } }
  const result = String(json.result ?? json.response ?? json.text ?? text);
  return {
    session: json.session_id ?? json.sessionId ?? json.conversation_id ?? json.conversationId,
    cost: json.total_cost_usd,
    error: Boolean(json.is_error),
    result,
    outcome: /ESITO:\s*(fatto|in attesa|fallito)[^\n]*/i.exec(result)?.[0],
    browser: /BROWSER:\s*(verificato|da verificare)[^\n]*/i.exec(result)?.[0],
  };
}

async function execute({ max = CONFIG.maxParalleli, only, task, always = false } = {}) {
  const runs = readJson(RUNS, {});
  const active = new Map(); // id → promise
  let waitingUntil = 0;
  // The file wins for the runs this process is not following: `integra` and `riprendi` change it while `esegui` runs.
  const saveRuns = (...ids) => {
    const disk = readJson(RUNS, {});
    for (const id of new Set([...active.keys(), ...ids])) disk[id] = runs[id];
    writeJson(RUNS, disk);
  };
  for (;;) {
    const disk = readJson(RUNS, {});
    for (const id of Object.keys(runs)) if (!active.has(id) && !disk[id]) delete runs[id];
    for (const [id, r] of Object.entries(disk)) if (!active.has(id)) runs[id] = r;
    const orch = orchestrator();
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
    // Whether a provider can take one more task now (a suspended run only checks that the provider is not stopped).
    const fits = (prov, estimate, resuming) => {
      const b = budget[prov];
      if (!b || (b.fermoFino && new Date(b.fermoFino) > new Date())) return false;
      const committed = [...active.keys()].map((id) => runs[id]).filter((r) => r.provider === prov).reduce((s, r) => s + r.stima, 0);
      const left = b.residuo - committed;
      const cap = capOf({ left, session: b.sessione, provider: prov, orchestrator: orch, max, threshold: CONFIG.sogliaUnSolo });
      const running = [...active.keys()].filter((id) => runs[id].provider === prov).length;
      return running < cap && (resuming || estimate <= left - CONFIG.riserva);
    };
    for (const t of candidates) {
      if (active.size >= max) break;
      // A new task goes to its provider or, if that one cannot take it, to its alternatives in order (`alternative`).
      const resuming = Boolean(runs[t.id]);
      const prov = resuming ? t.provider : [t.provider, ...(CONFIG.alternative?.[t.provider] ?? [])].find((p) => (!only || p === only) && fits(p, t.estimate, false));
      if (!prov || !fits(prov, t.estimate, resuming)) continue;
      if (prov !== t.provider) say(`${t.id}: ${t.provider} non può, va su ${prov}`);
      const b = budget[prov];
      t.provider = prov;
      const run = runs[t.id] ?? { id: t.id, provider: prov, stima: t.estimate, tentativi: 0, inizio: now(), ...(() => { const w = taskWorktree(t.id); return { dir: w.dir, branch: w.branch }; })() };
      run.tentativi += 1;
      run.stato = 'in corso';
      run.prima ??= { settimana: b.residuo, sessione: b.sessione };
      runs[t.id] = run;
      saveRuns(t.id);
      say(`${run.sessione ? 'riprendo' : 'lancio'} ${t.id} su ${t.provider} (${run.dir})`);
      active.set(t.id, launch(t, run).then((r) => finish(run, r, runs, saveRuns)).finally(() => active.delete(t.id)));
    }
    if (!active.size) {
      const waiting = Object.values(runs).filter((r) => r.stato === 'sospeso');
      if (!waiting.length && !always) { console.log('Niente da lanciare: fine.'); return; }
      if (waiting.length) {
        const next = Math.min(...waiting.map((r) => new Date(r.fermoFino).getTime()));
        // Once per wait, and only on the console: the diary is for events.
        if (next !== waitingUntil) console.log(`[${now()}] tutti fermi per i limiti; riprendo il ${new Date(next).toISOString()}`);
        waitingUntil = next;
      }
    }
    await new Promise((r) => setTimeout(r, CONFIG.controlloSecondi * 1000));
  }
}

function finish(run, { code, text, log }, runs, saveRuns) {
  const out = readOutput(text);
  if (out.session) run.sessione = out.session;
  const limit = usageLimit(out.error || code !== 0 ? text : '');
  const stale = readJson(BUDGET, {});
  if (stale[run.provider]) { delete stale[run.provider].letto; writeJson(BUDGET, stale); }
  const budget = loadBudget();
  if (limit) {
    Object.assign(run, { stato: 'sospeso', fermoFino: limit.toISOString() });
    budget[run.provider].fermoFino = limit.toISOString();
    budget[run.provider].residuo = Math.min(budget[run.provider].residuo, CONFIG.sogliaUnSolo - 1);
    say(`${run.id}: limite di ${run.provider}, riprendo dopo ${run.fermoFino}`);
  } else {
    Object.assign(run, { stato: 'finito', fine: now(), esito: out.outcome ?? (code === 0 ? 'ESITO: ? (senza riga)' : `ESITO: fallito (codice ${code})`), browser: out.browser });
    // The counters just read (loadBudget above) say what the task really cost, other work on the same account included.
    const b = budget[run.provider];
    const dopo = b.letto && Date.now() - Date.parse(b.letto) < 60_000 ? { settimana: b.residuo, sessione: b.sessione } : undefined;
    if (!dopo) b.residuo = Math.max(0, b.residuo - run.stima);
    b.aggiornato = now();
    fs.mkdirSync(path.dirname(HISTORY), { recursive: true });
    fs.appendFileSync(HISTORY, JSON.stringify({ task: run.id, provider: run.provider, stima: run.stima, prima: run.prima, dopo, costoUsd: out.cost, minuti: Math.round((Date.parse(run.fine) - Date.parse(run.inizio)) / 60000), tentativi: run.tentativi, esito: run.esito, data: run.fine }) + '\n');
    say(`${run.id}: ${run.esito}${run.browser ? ` · ${run.browser}` : ''} (riepilogo e conversazione: node tools/pipeline/pipeline.mjs traccia ${run.id})`);
  }
  writeJson(BUDGET, budget);
  saveRuns(run.id);
}

// --- Commands --------------------------------------------------------------------------------------------------

function status() {
  const budget = loadBudget();
  writeJson(BUDGET, budget);
  const queues = plan(loadTasks(), readJson(RUNS, {}), budget);
  writePlan(queues, budget);
  for (const [k, l] of Object.entries(queues)) console.log(`${k}: ${l.map((t) => t.id).join(' ') || '—'}`);
  for (const [p, b] of Object.entries(budget))
    console.log(`${p}: ${describe(b)}${(b.contatori ?? []).map((c) => `\n  ${c.nome} (${c.finestra}): ${c.residuo} %, reset ${c.reset}`).join('')}`);
  const others = new Map();
  for (const b of Object.values(budget)) for (const c of b.tutti ?? []) others.set(`${c.nome} (${c.finestra})`, c);
  for (const b of Object.values(budget)) for (const c of b.contatori ?? []) others.delete(`${c.nome} (${c.finestra})`);
  if (others.size) console.log(`non usati dalla pipeline:${[...others].map(([k, c]) => `\n  ${k}: ${c.residuo} %, reset ${c.reset}`).join('')}`);
  console.log('Piano in docs/pipeline/PIANO.md');
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

/**
 * The trace of a task's run: where its CLI keeps the whole conversation (Claude: the session's `.jsonl` under
 * `~/.claude/projects/`; Antigravity: the conversation's SQLite under `~/.gemini/antigravity-cli/conversations/`), whether the
 * agent had `AGENTS.md` (Claude: its text in the transcript, imported by CLAUDE.md; Antigravity: the file opened), and the
 * agent's closing summary from the last log.
 */
function trace(id) {
  const run = readJson(RUNS, {})[id];
  if (!run) { console.log(`${id}: nessuna esecuzione in .pipeline/esecuzioni.json`); return; }
  const home = process.env.USERPROFILE ?? process.env.HOME;
  let file;
  if (CONFIG.providers[run.provider].cmd === 'claude') {
    const root = path.join(home, '.claude', 'projects');
    file = fs.readdirSync(root).map((d) => path.join(root, d, `${run.sessione}.jsonl`)).find((f) => fs.existsSync(f));
  } else file = path.join(home, '.gemini', 'antigravity-cli', 'conversations', `${run.sessione}.db`);
  const exists = file && fs.existsSync(file);
  const text = exists ? fs.readFileSync(file).toString('latin1') : '';
  const agents = run.provider === 'claude' ? text.includes('Regole inviolabili') : /[\\/]AGENTS\.md/.test(text);
  const log = path.join(LOGS, `${id}.${run.tentativi}.log`);
  const out = fs.existsSync(log) ? readOutput(fs.readFileSync(log, 'utf8')) : undefined;
  console.log(`${id} su ${run.provider}, ${run.tentativi} tentativo/i, ${run.stato}${run.esito ? ` — ${run.esito}` : ''}`);
  console.log(`Conversazione: ${exists ? file : '(non trovata)'}${run.provider === 'claude' ? '' : `  (riprendila con: agy --conversation ${run.sessione})`}`);
  if (run.provider === 'claude') console.log(`  (riprendila con: claude --resume ${run.sessione}, dalla cartella ${run.dir})`);
  console.log(`AGENTS.md: ${exists ? (agents ? 'letto' : 'NON trovato nella conversazione') : '?'}`);
  console.log(`Log: ${log}\n\n--- Riepilogo dell'agente ---\n${out?.result ?? '(nessun log)'}`);
}

/** Puts back in the queue a run that stopped without a usage limit being recognised: it resumes its conversation. */
function resume(id) {
  const runs = readJson(RUNS, {});
  const run = runs[id];
  if (!run) { console.log(`${id}: nessuna esecuzione`); return; }
  if (run.sessione) Object.assign(run, { stato: 'sospeso', fermoFino: now(), esito: undefined, fine: undefined });
  else delete runs[id];
  writeJson(RUNS, runs);
  say(`${id}: rimesso in coda (${run.sessione ? 'riprende la sua conversazione' : 'riparte da capo'})`);
}

function integrate(id) {
  const base = worktrees().find((w) => w.branch === CONFIG.base);
  git(['merge', '--no-ff', '-m', `Pipeline: integra ${id}`, `task/${id}`], base.path);
  const runs = readJson(RUNS, {});
  if (runs[id]) { runs[id].integrato = now(); writeJson(RUNS, runs); }
  // The worktree goes: first the junction alone (removing it as a folder would empty the base's node_modules).
  const wt = worktrees().find((w) => w.branch === `task/${id}`);
  if (wt) {
    const nm = path.join(wt.path, 'node_modules');
    if (fs.existsSync(nm) && fs.lstatSync(nm).isSymbolicLink()) fs.unlinkSync(nm);
    git(['worktree', 'remove', wt.path], base.path);
  }
  git(['branch', '-d', `task/${id}`], base.path);
  say(`task/${id} integrato in ${CONFIG.base}; worktree e branch tolti.`);
}

const [cmd, ...rest] = process.argv.slice(2);
const flag = (name) => { const i = rest.indexOf(`--${name}`); return i >= 0 ? rest[i + 1] : undefined; };
if (process.argv[1]?.endsWith('pipeline.mjs')) {
  if (cmd === 'stato' || !cmd) status();
  else if (cmd === 'esegui') await execute({ max: Number(flag('max') ?? CONFIG.maxParalleli), only: flag('solo'), task: flag('task'), always: rest.includes('--sempre') });
  else if (cmd === 'uso') { const b = readJson(BUDGET, {}); for (const p of Object.keys(b)) delete b[p].letto; writeJson(BUDGET, b); status(); }
  else if (cmd === 'budget') { const b = loadBudget(); b[rest[0]] = { ...b[rest[0]], residuo: Number(rest[1]), aggiornato: now(), fermoFino: undefined }; writeJson(BUDGET, b); status(); }
  else if (cmd === 'worktree') listWorktrees();
  else if (cmd === 'integra') integrate(rest[0]);
  else if (cmd === 'traccia') trace(rest[0]);
  else if (cmd === 'riprendi') resume(rest[0]);
  else if (cmd === 'nota') say(`nota: ${rest.join(' ')}`);
  else if (cmd === 'orchestratore') {
    if (rest[0] && !CONFIG.providers[rest[0]]) console.log(`Provider sconosciuto: ${rest[0]} (${Object.keys(CONFIG.providers).join(', ')})`);
    else if (rest[0]) { writeJson(ORCHESTRATOR, { provider: rest[0], dal: now() }); say(`orchestratore: ${rest[0]}`); }
    else console.log(orchestrator());
  }
  else console.log('Comandi: stato | uso (rilegge /usage) | esegui [--sempre] [--max N] [--solo claude|gemini|argon] [--task Txx] | budget <provider> <residuo %> | worktree | traccia <Txx> | integra <Txx> | riprendi <Txx> | orchestratore [provider] | nota <testo>');
}
