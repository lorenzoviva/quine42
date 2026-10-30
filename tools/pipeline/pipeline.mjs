#!/usr/bin/env node
// The agentic pipeline (ADR-0072): reads the backlog, plans the runnable tasks on Claude Code and Gemini (Antigravity
// CLI), runs them in parallel, one worktree each, within the usage budget, and resumes them after a usage limit.
// No dependencies; state that is only local lives in `.pipeline/` (ignored by git). See docs/pipeline/README.md.
import { spawn, execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
export const REPO = path.resolve(HERE, '..', '..');
// PIPELINE_CONFIG and PIPELINE_STATE: another configuration and another state (with its own diary), for trying the
// pipeline with fake CLIs without touching the real runs.
export const CONFIG = JSON.parse(fs.readFileSync(process.env.PIPELINE_CONFIG ?? path.join(HERE, 'config.json'), 'utf8'));
export const STATE_DIR = process.env.PIPELINE_STATE ?? path.join(REPO, '.pipeline');
const LOGS = path.join(STATE_DIR, 'log');
const RUNS = path.join(STATE_DIR, 'esecuzioni.json');
export const BUDGET = path.join(STATE_DIR, 'budget.json');
const HISTORY = path.join(REPO, 'docs', 'pipeline', 'consumi.jsonl');
const PLAN = process.env.PIPELINE_STATE ? path.join(STATE_DIR, 'PIANO.md') : path.join(REPO, 'docs', 'pipeline', 'PIANO.md');
const REPORT = process.env.PIPELINE_STATE ? path.join(STATE_DIR, 'diario.md') : path.join(REPO, 'docs', 'pipeline', 'orchestrazione.md');
const ORCHESTRATOR = path.join(STATE_DIR, 'orchestratore.json');
const RESUME = 'Ti sei fermato in questo punto, riprendi.';

export const readJson = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } };
export const writeJson = (file, data) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n'); };
const git = (args, cwd = REPO) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
export const now = () => new Date().toISOString();

/** The diary's lines as they are written, for the orchestrator's process (orchestra.mjs). */
export const bus = new EventEmitter();

/** Prints an event and appends it to the diary of `orchestrazione.md`, so the next orchestrator knows what happened. */
export function say(text, reportFile = REPORT) {
  const line = `[${now()}] ${text}`;
  console.log(line);
  try { fs.mkdirSync(path.dirname(reportFile), { recursive: true }); fs.appendFileSync(reportFile, `- ${line}\n`); } catch { /* the report is a convenience */ }
  bus.emit('diario', line);
}

/** Paths of all pipeline files for the repository or an isolated test directory. */
export function pathsOf(opts = {}) {
  const repo = opts.repo ?? REPO;
  const stateDir = opts.stateDir ?? (opts.repo ? path.join(repo, '.pipeline') : STATE_DIR);
  const config = opts.config ?? CONFIG;
  const customState = Boolean((opts.stateDir || process.env.PIPELINE_STATE) && !opts.repo);
  return {
    repo,
    stateDir,
    config,
    logs: path.join(stateDir, 'log'),
    runs: path.join(stateDir, 'esecuzioni.json'),
    budget: path.join(stateDir, 'budget.json'),
    orchestrator: path.join(stateDir, 'orchestratore.json'),
    history: path.join(repo, 'docs', 'pipeline', 'consumi.jsonl'),
    plan: customState ? path.join(stateDir, 'PIANO.md') : path.join(repo, 'docs', 'pipeline', 'PIANO.md'),
    report: customState ? path.join(stateDir, 'diario.md') : path.join(repo, 'docs', 'pipeline', 'orchestrazione.md'),
    backlog: path.join(repo, 'docs', 'plans', 'backlog.md'),
    quadro: path.join(repo, 'docs', 'pipeline', 'quadro.md'),
    todo: path.join(repo, 'docs', 'userchats', 'to-do.md'),
    domande: path.join(repo, 'docs', 'pipeline', 'domande'),
    adrDir: path.join(repo, 'docs', 'adr'),
  };
}

/** The provider the orchestrating agent runs on (`orchestratore`: set by orchestra.mjs, or by hand). */
export function orchestrator(opts) {
  const p = pathsOf(opts);
  return readJson(p.orchestrator, {}).provider ?? p.config.orchestratore;
}

export function setOrchestrator(provider, opts) {
  const p = pathsOf(opts);
  writeJson(p.orchestrator, { provider, dal: now() });
}

/**
 * How many tasks a provider may run at once (ADR-0087): its dynamic slots (`slot`, between 0 and the ceiling), one more for an
 * urgent request of the author (priority 0), never over its ceiling (`tetto`). Near 0 % (`sogliaUnSolo`, week or 5 hours)
 * nothing new starts and at most one task goes on (resumed), none on the orchestrator's provider, so the tasks never take
 * the credits the orchestration needs to go on. For weekly-only providers (Argon or finestra5h === false), session is the week.
 */
export function capOf({ left, session, provider, orchestrator: orch, slot = 1, tetto = 1, threshold, urgent = false, resuming = false }) {
  const conf = CONFIG.providers?.[provider];
  const isWeeklyOnly = conf?.finestra5h === false || provider === 'argon';
  const sess = isWeeklyOnly ? left : (session ?? left);
  if (left < threshold || sess < threshold) return resuming && provider !== orch ? 1 : 0;
  return Math.min(tetto, resuming ? Math.max(slot, 1) : slot + (urgent ? 1 : 0));
}

/**
 * The ceiling of a provider, decided by the author (`limiti` in config.json): the one of its model (`modello`: the entries
 * of `providers`) and the one of its CLI (`provider`: `claude`, `agy`), the lower; without `limiti`, `maxParalleli`.
 */
export function ceilingOf(provider, config = CONFIG) {
  const l = config.limiti ?? {};
  const cmd = config.providers?.[provider]?.cmd;
  return Math.min(config.maxParalleli ?? Infinity, l.modello?.[provider] ?? Infinity, l.provider?.[cmd] ?? Infinity);
}

/**
 * When the week of a provider reaches 100 % at the pace of the last days (`storia`: [{ t, residuo }] from `budget.json`):
 * the samples since the last refill (a residuo that went up is a reset), within `giorni`; undefined if it is not
 * being used (or there is too little to say).
 */
export function forecastEmpty(storia = [], nowMs = Date.now(), giorni = 3) {
  const recent = storia.filter((s) => nowMs - Date.parse(s.t) <= giorni * 86_400_000);
  let start = 0;
  for (let i = 1; i < recent.length; i++) if (recent[i].residuo > recent[i - 1].residuo) start = i;
  const seg = recent.slice(start);
  if (seg.length < 2) return undefined;
  const first = seg[0], last = seg.at(-1);
  const ms = Date.parse(last.t) - Date.parse(first.t);
  const used = first.residuo - last.residuo;
  if (ms < 3_600_000 || used <= 0) return undefined; // under an hour of samples the pace is noise
  return new Date(Date.parse(last.t) + (last.residuo / used) * ms).toISOString();
}

/** The next weekly reset of a provider: its weekly counter's (`/usage`), or the next `resetSettimanale`. */
export function weeklyResetOf(b = {}, conf = {}, nowMs = Date.now()) {
  const weekly = (b.contatori ?? []).filter((c) => c.finestra === 'settimana' && c.reset && Date.parse(c.reset) > nowMs).sort((x, y) => x.residuo - y.residuo)[0];
  if (weekly) return weekly.reset;
  const last = lastReset(conf.resetSettimanale, new Date(nowMs));
  return last && new Date(last.getTime() + 7 * 86_400_000).toISOString();
}

/**
 * The dynamic slots of a provider after a check: one more if the week would end after its reset (or it is not being used),
 * one less if before; between 0 and the ceiling, and no more than its schedule needs (`domanda`, at least one).
 * Without a reset to compare with, they stay.
 */
export function nextSlot({ slot = 1, tetto = 1, previsione, reset, domanda = Infinity }) {
  if (!reset) return Math.min(slot, tetto);
  const after = !previsione || Date.parse(previsione) > Date.parse(reset);
  const next = after ? Math.max(slot, Math.min(slot + 1, Math.max(1, domanda))) : slot - 1;
  return Math.max(0, Math.min(tetto, next));
}

/**
 * The schedule of each provider: the tasks it could run (in progress, ready) and those blocked only by other tasks of the
 * backlog; not the ones that wait for the author (`in attesa`, also through their dependencies).
 */
export function demandOf(queues) {
  const waiting = new Set(queues.inAttesa.map((t) => t.id));
  const blocked = new Map(queues.bloccati.map((t) => [t.id, t]));
  const waitsForAuthor = (id, seen = new Set()) => {
    if (waiting.has(id)) return true;
    const t = blocked.get(id);
    if (!t || seen.has(id)) return false;
    seen.add(id);
    return t.missing.some((d) => waitsForAuthor(d, seen));
  };
  const out = {};
  for (const t of [...queues.inCorso, ...queues.pronti, ...queues.bloccati.filter((t) => !waitsForAuthor(t.id))])
    if (t.provider) out[t.provider] = (out[t.provider] ?? 0) + 1;
  return out;
}

/**
 * At each check, for every provider: the sample of its week (`storia`, the last `giorniStoria` days, one every `usoSecondi`),
 * the forecast, the reset and its slots (moved at most once every `usoSecondi`). Writes into `budget`.
 */
export function updateSlots(budget, queues, { config = CONFIG, nowMs = Date.now() } = {}) {
  const demand = demandOf(queues);
  for (const [prov, conf] of Object.entries(config.providers)) {
    const b = (budget[prov] ??= { residuo: 100 });
    const storia = (b.storia ??= []);
    const keep = (config.giorniStoria ?? 7) * 86_400_000;
    const step = (config.usoSecondi ?? 300) * 1000;
    if (!storia.length || nowMs - Date.parse(storia.at(-1).t) >= step || storia.at(-1).residuo !== b.residuo) storia.push({ t: new Date(nowMs).toISOString(), residuo: b.residuo });
    b.storia = storia.filter((s) => nowMs - Date.parse(s.t) <= keep);
    b.tetto = ceilingOf(prov, config);
    b.previsione = forecastEmpty(b.storia, nowMs, config.giorniPrevisione ?? 3);
    b.resetSettimana = weeklyResetOf(b, conf, nowMs);
    b.domanda = demand[prov] ?? 0;
    if (b.slot === undefined) b.slot = Math.min(1, b.tetto);
    else if (!b.slotAggiornato || nowMs - Date.parse(b.slotAggiornato) >= step) {
      b.slot = nextSlot({ slot: b.slot, tetto: b.tetto, previsione: b.previsione, reset: b.resetSettimana, domanda: b.domanda });
      b.slotAggiornato = new Date(nowMs).toISOString();
    }
    b.slot = Math.min(b.slot, b.tetto);
  }
  return budget;
}

// --- The backlog -----------------------------------------------------------------------------------------------

/** Recognises whether a task requires browser verification from its text or pipeline line. */
export function taskNeedsBrowser(block) {
  const fattoQuando = /-\s*Fatto quando:([^\n]+)/i.exec(block)?.[1] ?? '';
  const fare = /-\s*Fare:([^\n]+)/i.exec(block)?.[1] ?? '';
  const pipe = /^- Pipeline:\s*(.+)$/m.exec(block)?.[1] ?? '';
  return /\bbrowser\b/i.test(pipe)
    || /\b(?:verifica(?:re)?\s+nel\s+browser|nel\s+browser|screenshot)\b/i.test(fattoQuando)
    || /\bverifica(?:re)?\s+nel\s+browser\b/i.test(fare);
}

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
    const needsBrowser = Boolean(info.needsBrowser || taskNeedsBrowser(block));
    // A header that lists sub-tasks («T56a `fatto`, T56b `da fare`») gives one task per sub-task.
    const subs = [...tail.matchAll(/(T\d+[a-z])\s+`([^`]+)`/g)];
    if (subs.length) {
      for (const [, sub, status] of subs) tasks.push({ id: sub, title, status, deps: [...deps].filter((d) => d !== sub), ...info, needsBrowser, parent: id });
    } else {
      // Without a status in backticks the tail says what the task is («spezzato in T43a-T43c»): not runnable by itself.
      const status = /`([^`]+)`/.exec(tail)?.[1] ?? (tail.trim() || 'da fare');
      tasks.push({ id, title, status, deps: [...deps], ...info, needsBrowser });
    }
  }
  return tasks;
}

/** `claude · stima 4% · approvato · priorità 2` → { provider, estimate, approved, priority, needsBrowser }. */
export function parsePipelineLine(line) {
  const parts = line.split('·').map((s) => s.trim().toLowerCase());
  const out = { provider: undefined, estimate: undefined, approved: false, priority: 100, needsBrowser: false };
  for (const p of parts) {
    if (CONFIG.providers[p]) out.provider = p;
    else if (/^stima\s+[\d.]+\s*%$/.test(p)) out.estimate = Number(/[\d.]+/.exec(p)[0]);
    else if (p === 'approvato') out.approved = true;
    else if (/^priorit[àa]\s+\d+$/.test(p)) out.priority = Number(/\d+/.exec(p)[0]);
    else if (p === 'browser') out.needsBrowser = true;
  }
  return out;
}

export const loadTasks =() => parseBacklog(fs.readFileSync(path.join(REPO, 'docs', 'plans', 'backlog.md'), 'utf8'));
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

/**
 * Computes residuo and sessione from counters for a provider.
 * When a provider has no 5-hour window (finestra5h === false, or no '5h' counters),
 * its session limit is based on its weekly limit.
 */
export function computeBudget(provider, conf = CONFIG.providers?.[provider], counters = []) {
  const residuo = lowest(counters, 'settimana');
  const has5h = conf?.finestra5h !== false && provider !== 'argon' && counters.some((c) => c.finestra === '5h');
  const sessione = has5h ? lowest(counters, '5h') : residuo;
  return { residuo, sessione };
}

export function loadBudget({ read = true } = {}) {
  const budget = readJson(BUDGET, {});
  const cache = new Map();
  for (const [prov, conf] of Object.entries(CONFIG.providers)) {
    const b = (budget[prov] ??= { residuo: 100, aggiornato: now() });
    if (read && !(b.letto && Date.now() - Date.parse(b.letto) < CONFIG.usoSecondi * 1000)) {
      const usage = readUsage(prov, cache);
      if (usage?.contatori.length) {
        const { residuo, sessione } = computeBudget(prov, conf, usage.contatori);
        Object.assign(b, { ...usage, letto: now(), residuo, sessione });
      }
    }
    const isWeeklyOnly = conf.finestra5h === false || prov === 'argon' || (b.contatori && !b.contatori.some((c) => c.finestra === '5h'));
    if (isWeeklyOnly) b.sessione = b.residuo;
    if (b.contatori && b.letto && Date.now() - Date.parse(b.letto) < CONFIG.usoSecondi * 2000) {
      const empty = b.contatori.filter((c) => c.residuo <= (c.finestra === 'settimana' ? CONFIG.riserva : 0) && c.reset);
      b.fermoFino = empty.length ? empty.map((c) => c.reset).sort().at(-1) : b.fermoFino && new Date(b.fermoFino) > new Date() ? b.fermoFino : undefined;
      continue;
    }
    const reset = lastReset(conf.resetSettimanale);
    if (reset && new Date(b.aggiornato) < reset) Object.assign(b, { residuo: 100, sessione: 100, aggiornato: now(), fermoFino: undefined });
  }
  return budget;
}

/** The last weekly reset before now, from «giorno ora» (`gio 09:00`). */
function lastReset(spec, from = new Date()) {
  if (!spec) return undefined;
  const days = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
  const [day, hm = '00:00'] = spec.split(/\s+/);
  const [h, min] = hm.split(':').map(Number);
  const d = new Date(from);
  d.setHours(h, min, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() - days.indexOf(day) + 7) % 7));
  if (d > from) d.setDate(d.getDate() - 7);
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
export function plan(tasks, runs, budget, only) {
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
    if (t.needsBrowser && !(CONFIG.providers[t.provider]?.browser ?? t.provider === 'claude')) {
      queues.bloccati.push({ ...t, missing: ['provider con browser (claude)'] });
      continue;
    }
    if (!t.approved && CONFIG.approvazione === 'manuale') { queues.daApprovare.push(t); continue; }
    if (only && t.provider !== only) continue;
    queues.pronti.push(t);
  }
  queues.pronti.sort((a, b) => a.priority - b.priority);
  return queues;
}

const describe = (b) => `settimana ${b.residuo} %, 5 ore ${b.sessione ?? '?'} %${b.fermoFino ? `, fermo fino a ${b.fermoFino}` : ''}` +
  `; tetto ${b.tetto ?? '?'}, slot ${b.slot ?? '?'}${b.domanda !== undefined ? ` (task in programma ${b.domanda})` : ''}, esaurimento previsto ${b.previsione ?? 'mai a questo ritmo'}, reset ${b.resetSettimana ?? '?'}`;

export function writePlan(queues, budget, opts) {
  const p = pathsOf(opts);
  const line = (t) => `- **${t.id}** ${t.title}${t.provider ? ` — ${t.provider}, ${t.estimate ?? '?'} %` : ''}${t.missing ? ` (aspetta ${t.missing.join(', ')})` : ''}`;
  const section = (title, list) => `## ${title} (${list.length})\n\n${list.map(line).join('\n') || '_nessuno_'}\n`;
  const budgets = Object.entries(budget).map(([prov, b]) => `- **${prov}**: ${describe(b)}${b.letto ? ` (letto da /usage il ${b.letto})` : ' (impostato a mano)'}` +
    (b.contatori ?? []).map((c) => `\n  - ${c.nome}, ${c.finestra}: ${c.residuo} % residuo, reset ${c.reset}`).join('')).join('\n');
  const text = `# Il piano della pipeline\n\n> Generato da \`node tools/pipeline/pipeline.mjs stato\` il ${now()}: non modificarlo a mano,\n> la fonte è \`docs/plans/backlog.md\` (righe \`- Pipeline:\`).\n\n## Budget\n\nOrchestratore: **${orchestrator(opts)}** (sotto il ${p.config.sogliaUnSolo} % nessun task su di lui; si cambia con \`orchestratore <provider>\`).\n\n${budgets}\n\n` +
    [['In corso', queues.inCorso], ['Finiti, da guardare e integrare (`integra Txx`)', queues.daIntegrare], ['Pronti, in ordine di priorità', queues.pronti], ['Da approvare (provider e stima proposti)', queues.daApprovare],
      ['Da stimare (manca la riga `- Pipeline:`)', queues.daStimare], ['Bloccati da dipendenze', queues.bloccati], ['In attesa dell\'autore', queues.inAttesa]]
      .map(([t, l]) => section(t, l)).join('\n');
  fs.mkdirSync(path.dirname(p.plan), { recursive: true });
  fs.writeFileSync(p.plan, text);
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

const readText = (file) => { try { return fs.readFileSync(file, 'utf8'); } catch { return ''; } };

/**
 * Starts (or resumes) the CLI of a task's provider; resolves with the run when the process ends. The process writes
 * straight into its log and is detached: it outlives the pipeline's process, which finds it again when it restarts
 * (`adopt`). A provider that lets us name the session (`sessioneNuova`: Claude's `--session-id`) has it from the start,
 * so even a run killed before its first answer resumes its conversation.
 */
export function launch(t, run, saveRuns = () => {}) {
  const conf = CONFIG.providers[t.provider];
  const resume = Boolean(run.sessione);
  if (!resume && conf.sessioneNuova) run.sessione = randomUUID();
  const args = resume
    ? [...conf.args, ...conf.resume.map((a) => a.replace('{sessione}', run.sessione)), '-p', RESUME]
    : [...conf.args, ...(conf.sessioneNuova ?? []).map((a) => a.replace('{sessione}', run.sessione)), '-p', taskPrompt(t, run)];
  fs.mkdirSync(LOGS, { recursive: true });
  const log = path.join(LOGS, `${t.id}.${run.tentativi}.log`);
  const fd = fs.openSync(log, 'w');
  // PIPELINE_TASK: who holds a turn (`turno`) started by the task.
  const child = spawn(conf.cmd, args, { cwd: run.dir, stdio: ['ignore', fd, fd], windowsHide: true, detached: true, env: { ...process.env, PIPELINE_TASK: t.id } });
  fs.closeSync(fd);
  Object.assign(run, { pid: child.pid, log });
  saveRuns(run.id);
  return new Promise((resolve) => {
    child.on('error', (e) => resolve({ code: -1, text: `${readText(log)}\n${e.message}`, log }));
    child.on('close', (code) => resolve({ code, text: readText(log), log }));
  });
}

/** Whether a process is still there. */
export function alive(pid) {
  if (!pid) return false;
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}

/** Waits until a process is gone (one this process did not start: it cannot wait on its exit). */
const gone = (pid) => new Promise((resolve) => { const t = setInterval(() => { if (!alive(pid)) { clearInterval(t); resolve(); } }, 5000); });

/** Kills a process and its children (the CLI and what it started). */
function killTree(pid) {
  try {
    if (process.platform === 'win32') execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
    else process.kill(-pid, 'SIGTERM');
  } catch { /* already gone */ }
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

export async function execute({ max = CONFIG.maxParalleli, only, task, always = false } = {}) {
  const runs = readJson(RUNS, {});
  const active = new Map(); // id → promise
  let waitingUntil = 0;
  let lastLaunch = 0; // the last new task: they are spaced (holdBack)
  // The file wins for the runs this process is not following: `integra` and `riprendi` change it while `esegui` runs.
  const saveRuns = (...ids) => {
    const disk = readJson(RUNS, {});
    for (const id of new Set([...active.keys(), ...ids])) disk[id] = runs[id];
    writeJson(RUNS, disk);
  };
  // Runs left «in corso» by a process that died: the CLI is still working (follow it) or gone (resume it).
  for (const r of Object.values(runs)) {
    if (r.stato !== 'in corso') continue;
    if (alive(r.pid)) {
      say(`${r.id}: ancora al lavoro (processo ${r.pid}), lo seguo`);
      const log = r.log ?? path.join(LOGS, `${r.id}.${r.tentativi}.log`);
      active.set(r.id, gone(r.pid).then(() => finish(r, { code: null, text: readText(log), log }, runs, saveRuns)).finally(() => active.delete(r.id)));
    } else {
      Object.assign(r, { stato: 'sospeso', fermoFino: now(), pid: undefined });
      say(`${r.id}: il suo processo non c'è più, riprende${r.sessione ? ' la sua conversazione' : ' da capo'}`);
    }
    saveRuns(r.id);
  }
  for (;;) {
    const disk = readJson(RUNS, {});
    for (const id of Object.keys(runs)) if (!active.has(id) && !disk[id]) delete runs[id];
    for (const [id, r] of Object.entries(disk)) if (!active.has(id)) runs[id] = r;
    const orch = orchestrator();
    const budget = loadBudget();
    const tasks = loadTasks();
    const queues = plan(tasks, runs, budget, only);
    updateSlots(budget, queues);
    writeJson(BUDGET, budget);
    writePlan(queues, budget);
    // Suspended runs whose limit has reset come first; then ready tasks within the budget.
    const candidates = [
      ...Object.values(runs).filter((r) => r.stato === 'sospeso' && !active.has(r.id) && new Date(r.fermoFino) <= new Date())
        .map((r) => ({ ...tasks.find((t) => t.id === r.id), id: r.id, provider: r.provider, estimate: r.stima })),
      ...queues.pronti.filter((t) => !runs[t.id] && (!task || t.id === task)),
    ];
    // Whether a provider can take one more task now: under its slots and its ceiling, and its CLI under its own
    // (`limiti.provider`); a new task also needs its estimate to fit (a suspended run only that the provider is not stopped).
    const fits = (prov, t, resuming) => {
      const b = budget[prov];
      if (!b || (b.fermoFino && new Date(b.fermoFino) > new Date())) return false;
      const live = [...active.keys()].map((id) => runs[id]);
      const mine = live.filter((r) => r.provider === prov);
      const left = b.residuo - mine.reduce((s, r) => s + r.stima, 0);
      const cap = capOf({ left, session: b.sessione, provider: prov, orchestrator: orch, slot: b.slot, tetto: b.tetto ?? ceilingOf(prov), threshold: CONFIG.sogliaUnSolo, urgent: t.priority === 0, resuming });
      const cmd = CONFIG.providers[prov].cmd;
      const cli = live.filter((r) => CONFIG.providers[r.provider]?.cmd === cmd).length;
      return mine.length < cap && cli < (CONFIG.limiti?.provider?.[cmd] ?? Infinity) && (resuming || t.estimate <= left - CONFIG.riserva);
    };
    for (const t of candidates) {
      if (active.size >= max) break;
      // A new task goes to its provider or, if that one cannot take it, to its alternatives in order (`alternative`).
      const resuming = Boolean(runs[t.id]);
      const allowed = t.needsBrowser
        ? [t.provider, ...(CONFIG.alternative?.[t.provider] ?? [])].filter((p) => CONFIG.providers[p]?.browser ?? p === 'claude')
        : [t.provider, ...(CONFIG.alternative?.[t.provider] ?? [])];
      const prov = resuming ? t.provider : allowed.find((p) => (!only || p === only) && fits(p, t, false));
      if (!prov || !fits(prov, t, resuming)) continue;
      if (t.needsBrowser && !(CONFIG.providers[prov]?.browser ?? prov === 'claude')) continue;
      if (holdBack(t, [...active.keys()].map((id) => runs[id]), { resuming, lastLaunch })) continue;
      if (prov !== t.provider) say(`${t.id}: ${t.provider} non può, va su ${prov}`);
      const b = budget[prov];
      t.provider = prov;
      const run = runs[t.id] ?? { id: t.id, provider: prov, stima: t.estimate, tentativi: 0, inizio: now(), ...(() => { const w = taskWorktree(t.id); return { dir: w.dir, branch: w.branch }; })() };
      run.tentativi += 1;
      run.needsBrowser = Boolean(t.needsBrowser);
      if (!resuming) lastLaunch = Date.now();
      run.stato = 'in corso';
      run.prima ??= { settimana: b.residuo, sessione: b.sessione };
      runs[t.id] = run;
      saveRuns(t.id);
      say(`${run.sessione ? 'riprendo' : 'lancio'} ${t.id} su ${t.provider} (${run.dir})`);
      active.set(t.id, launch(t, run, saveRuns).then((r) => finish(run, r, runs, saveRuns)).finally(() => active.delete(t.id)));
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
  run.pid = undefined;
  // Stopped on purpose (`interrompi`): it waits, with its conversation, for `riprendi`.
  if (readJson(RUNS, {})[run.id]?.stato === 'interrotto') {
    run.stato = 'interrotto';
    say(`${run.id}: interrotto (riprende con riprendi ${run.id})`);
    saveRuns(run.id);
    return;
  }
  const limit = usageLimit(out.error || code !== 0 ? text : '');
  const stale = readJson(BUDGET, {});
  if (stale[run.provider]) { delete stale[run.provider].letto; writeJson(BUDGET, stale); }
  const budget = loadBudget();
  if (limit) {
    Object.assign(run, { stato: 'sospeso', fermoFino: limit.toISOString() });
    budget[run.provider].fermoFino = limit.toISOString();
    const residuo = Math.min(budget[run.provider].residuo, CONFIG.sogliaUnSolo - 1);
    budget[run.provider].residuo = residuo;
    if (CONFIG.providers?.[run.provider]?.finestra5h === false || run.provider === 'argon') {
      budget[run.provider].sessione = residuo;
    }
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

/** What `stato` shows without moving the slots (only `esegui` moves them): ceiling, forecast, reset, schedule. */
function showSlots(budget, queues) {
  const demand = demandOf(queues);
  for (const [prov, conf] of Object.entries(CONFIG.providers)) {
    const b = (budget[prov] ??= { residuo: 100 });
    Object.assign(b, { tetto: ceilingOf(prov), previsione: forecastEmpty(b.storia, Date.now(), CONFIG.giorniPrevisione ?? 3), resetSettimana: weeklyResetOf(b, conf), domanda: demand[prov] ?? 0 });
    b.slot = Math.min(b.slot ?? 1, b.tetto);
  }
}

// --- Turns (ADR-0088) ------------------------------------------------------------------------------------------

/**
 * The lock of the heavy operations, shared by every worktree: `.pipeline/lock/` of the main repository (the worktrees of the
 * tasks have their own `.pipeline/`), or `PIPELINE_LOCK`.
 */
export function lockDir() {
  if (process.env.PIPELINE_LOCK) return process.env.PIPELINE_LOCK;
  try { return path.join(path.resolve(git(['rev-parse', '--path-format=absolute', '--git-common-dir']), '..'), '.pipeline', 'lock'); }
  catch { return path.join(STATE_DIR, 'lock'); }
}

/** The kinds of turn and how long one may hold it before it counts as abandoned (`turni` in config.json). */
export const TURNS = { browser: 45, test: 60, ...Object.fromEntries(Object.entries(CONFIG.turni ?? {}).map(([k, v]) => [k, v.massimoMinuti ?? v])) };

/** Who holds a turn now (`{ chi, pid, comando, dal }`), or undefined: a holder whose process is gone or older than its limit does not. */
export function holderOf(kind, { dir = lockDir(), nowMs = Date.now(), isAlive = alive, minutes = TURNS[kind] ?? 60 } = {}) {
  const h = readJson(path.join(dir, `${kind}.json`), undefined);
  if (!h) return undefined;
  if (!isAlive(h.pid) || nowMs - Date.parse(h.dal) > minutes * 60_000) return undefined;
  return h;
}

/**
 * Tries to take a turn for `me` (`{ chi, pid, comando }`): free, and `me` first among the living waiting (a queue in arrival
 * order, `<kind>.attesa/`), so nobody waits forever behind newcomers. Taken: the holder's file, created exclusively (two
 * processes at once: one wins). Not taken: `me` is in the queue, and the answer says who holds it.
 */
export function tryTurn(kind, me, { dir = lockDir(), nowMs = Date.now(), isAlive = alive } = {}) {
  const queue = path.join(dir, `${kind}.attesa`);
  fs.mkdirSync(queue, { recursive: true });
  const mine = path.join(queue, `${String(me.arrivo ?? nowMs).padStart(15, '0')}-${me.pid}.json`);
  if (!fs.readdirSync(queue).some((f) => f.endsWith(`-${me.pid}.json`))) writeJson(mine, { ...me, arrivo: me.arrivo ?? nowMs });
  const waiting = fs.readdirSync(queue).sort().filter((f) => {
    const w = readJson(path.join(queue, f), undefined);
    if (w && isAlive(w.pid)) return true;
    try { fs.rmSync(path.join(queue, f)); } catch { /* another one cleaned it */ }
    return false;
  });
  const lock = path.join(dir, `${kind}.json`);
  const holder = holderOf(kind, { dir, nowMs, isAlive });
  if (holder) return { taken: holder.pid === me.pid, holder };
  if (!waiting[0]?.endsWith(`-${me.pid}.json`)) return { taken: false, holder: readJson(path.join(queue, waiting[0]), undefined), queued: true };
  try { fs.rmSync(lock, { force: true }); } catch { /* gone already */ }
  try {
    fs.writeFileSync(lock, JSON.stringify({ chi: me.chi, pid: me.pid, comando: me.comando, dal: new Date(nowMs).toISOString() }, null, 2) + '\n', { flag: 'wx' });
  } catch { return { taken: false, holder: holderOf(kind, { dir, nowMs, isAlive }) }; }
  for (const f of fs.readdirSync(queue)) if (f.endsWith(`-${me.pid}.json`)) fs.rmSync(path.join(queue, f), { force: true });
  return { taken: true };
}

/** Leaves a turn (only its holder) and the queue. */
export function leaveTurn(kind, pid, { dir = lockDir() } = {}) {
  const lock = path.join(dir, `${kind}.json`);
  if (readJson(lock, {}).pid === pid) fs.rmSync(lock, { force: true });
  const queue = path.join(dir, `${kind}.attesa`);
  if (fs.existsSync(queue)) for (const f of fs.readdirSync(queue)) if (f.endsWith(`-${pid}.json`)) fs.rmSync(path.join(queue, f), { force: true });
}

/** Every turn: who holds it and how many wait. */
export function turnsOf({ dir = lockDir() } = {}) {
  return Object.fromEntries(Object.keys(TURNS).map((kind) => {
    const queue = path.join(dir, `${kind}.attesa`);
    const waiting = fs.existsSync(queue) ? fs.readdirSync(queue).filter((f) => alive(readJson(path.join(queue, f), {}).pid)).length : 0;
    return [kind, { ...holderOf(kind, { dir }), attesa: waiting }];
  }));
}

/**
 * `turno <kind> -- <command>`: waits for the turn, runs the command (its output is ours, its exit code too) and leaves the turn
 * when it ends, however it ends. A preview started this way holds the browser's turn until it is stopped.
 */
export async function runInTurn(kind, command, { dir = lockDir(), every = Number(process.env.PIPELINE_TURNO_OGNI ?? 5000) } = {}) {
  if (!TURNS[kind]) { console.error(`Turno sconosciuto: ${kind} (${Object.keys(TURNS).join(', ')})`); return 2; }
  const me = { chi: process.env.PIPELINE_TASK ?? path.basename(process.cwd()), pid: process.pid, comando: command.join(' '), arrivo: Date.now() };
  const leave = () => leaveTurn(kind, me.pid, { dir });
  process.on('exit', leave);
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => { leave(); process.exit(130); });
  let told;
  for (;;) {
    const r = tryTurn(kind, me, { dir });
    if (r.taken) break;
    const who = r.holder ? `${r.holder.chi} (${r.holder.comando}, dal ${r.holder.dal ?? 'in coda prima di te'})` : '?';
    if (who !== told) console.error(`[turno ${kind}] aspetto: tocca prima a ${who}`);
    told = who;
    await new Promise((res) => setTimeout(res, every));
  }
  console.error(`[turno ${kind}] è mio: ${me.comando}`);
  const code = await new Promise((resolve) => {
    const child = spawn(command.join(' '), { stdio: 'inherit', shell: true, env: { ...process.env, PIPELINE_TURNO: kind } });
    child.on('error', (e) => { console.error(e.message); resolve(1); });
    child.on('close', (c) => resolve(c ?? 1));
  });
  leave();
  console.error(`[turno ${kind}] lasciato`);
  return code;
}

/**
 * Whether the pipeline may start a task now, given the live runs (ADR-0088): never two that verify in the browser together,
 * and new tasks spaced by `intervalloLanciMinuti`, so their full test suites do not land at the same time. A resumed run only
 * waits for the browser. The reason, or undefined.
 */
export function holdBack(t, live, { resuming = false, lastLaunch = 0, nowMs = Date.now(), minutes = CONFIG.intervalloLanciMinuti ?? 0 } = {}) {
  if (t.needsBrowser && live.some((r) => r.needsBrowser)) return 'un altro task verifica già nel browser';
  if (!resuming && live.length && nowMs - lastLaunch < minutes * 60_000) return `un lancio ogni ${minutes} minuti`;
  return undefined;
}

// --- Commands --------------------------------------------------------------------------------------------------

function status() {
  const budget = loadBudget();
  const queues = plan(loadTasks(), readJson(RUNS, {}), budget);
  showSlots(budget, queues);
  writeJson(BUDGET, budget);
  writePlan(queues, budget);
  for (const [k, l] of Object.entries(queues)) console.log(`${k}: ${l.map((t) => t.id).join(' ') || '—'}`);
  for (const [p, b] of Object.entries(budget))
    console.log(`${p}: ${describe(b)}${(b.contatori ?? []).map((c) => `\n  ${c.nome} (${c.finestra}): ${c.residuo} %, reset ${c.reset}`).join('')}`);
  const others = new Map();
  for (const b of Object.values(budget)) for (const c of b.tutti ?? []) others.set(`${c.nome} (${c.finestra})`, c);
  for (const b of Object.values(budget)) for (const c of b.contatori ?? []) others.delete(`${c.nome} (${c.finestra})`);
  if (others.size) console.log(`non usati dalla pipeline:${[...others].map(([k, c]) => `\n  ${k}: ${c.residuo} %, reset ${c.reset}`).join('')}`);
  for (const [kind, h] of Object.entries(turnsOf())) console.log(`turno ${kind}: ${h.chi ? `${h.chi} (${h.comando}, dal ${h.dal})` : 'libero'}${h.attesa ? `, ${h.attesa} in attesa` : ''}`);
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

const summarizeToolInput = (input) => {
  if (!input || typeof input !== 'object') return String(input ?? '');
  const pick = input.file_path ?? input.path ?? input.Path ?? input.command ?? input.CommandLine ?? input.pattern ?? input.query ?? input.url;
  if (pick !== undefined) return String(pick).slice(0, 200);
  try { return JSON.stringify(input).slice(0, 200); } catch { return ''; }
};

/**
 * Parses a live or completed agent conversation transcript (Claude `.jsonl` or Antigravity `transcript.jsonl`)
 * into structured steps for the web interface (`utente`, `pensiero`, `strumento`, `agente`).
 */
export function parseConversation(text, isClaude = true) {
  const steps = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line.startsWith('{')) continue;
    let j;
    try { j = JSON.parse(line); } catch { continue; }
    if (!j || typeof j !== 'object') continue;
    if (j.type === 'USER_INPUT' || (!isClaude && j.source === 'USER_EXPLICIT')) {
      if (j.content) steps.push({ ruolo: 'utente', t: j.created_at, testo: String(j.content) });
      continue;
    }
    if (j.type === 'PLANNER_RESPONSE') {
      if (j.thinking) steps.push({ ruolo: 'pensiero', t: j.created_at, testo: String(j.thinking) });
      if (Array.isArray(j.tool_calls)) {
        for (const tc of j.tool_calls) {
          steps.push({ ruolo: 'strumento', t: j.created_at, nome: tc.name ?? tc.tool_name ?? 'tool', argomenti: summarizeToolInput(tc.args ?? tc.arguments ?? tc.input) });
        }
      }
      if (j.content) steps.push({ ruolo: 'agente', t: j.created_at, testo: String(j.content) });
      continue;
    }
    if (j.type === 'user' && !j.isMeta) {
      if (typeof j.message?.content === 'string') steps.push({ ruolo: 'utente', t: j.timestamp, testo: j.message.content });
      continue;
    }
    if (j.type === 'assistant' && Array.isArray(j.message?.content)) {
      for (const c of j.message.content) {
        if (c.type === 'thinking' && c.thinking) steps.push({ ruolo: 'pensiero', t: j.timestamp, testo: String(c.thinking) });
        else if (c.type === 'tool_use') steps.push({ ruolo: 'strumento', t: j.timestamp, nome: c.name ?? 'tool', argomenti: summarizeToolInput(c.input) });
        else if (c.type === 'text' && c.text) steps.push({ ruolo: 'agente', t: j.timestamp, testo: String(c.text) });
      }
    }
  }
  return steps;
}

/**
 * The trace of a task's run: where its CLI keeps the whole conversation (Claude: the session's `.jsonl` under
 * `~/.claude/projects/`; Antigravity: `transcript.jsonl` under `~/.gemini/antigravity-cli/brain/` or SQLite under
 * `conversations/`), whether the agent had `AGENTS.md`, the closing summary from the log, and the live conversation steps.
 */
export function traceOf(id, opts) {
  const p = pathsOf(opts);
  const run = readJson(p.runs, {})[id];
  if (!run) return undefined;
  const home = opts?.home ?? process.env.USERPROFILE ?? process.env.HOME;
  const isClaude = p.config.providers[run.provider]?.cmd === 'claude';
  const localConv = path.join(p.stateDir, 'conversazioni', `${id}.jsonl`);
  let file;
  let transcriptFile;
  if (fs.existsSync(localConv)) {
    file = localConv;
    transcriptFile = localConv;
  } else if (isClaude) {
    const root = path.join(home, '.claude', 'projects');
    if (fs.existsSync(root)) {
      if (run.sessione) file = fs.readdirSync(root).map((d) => path.join(root, d, `${run.sessione}.jsonl`)).find((f) => fs.existsSync(f));
      if (!file && run.dir) {
        const sub = path.join(root, run.dir.replace(/[^A-Za-z0-9]/g, '-'));
        if (fs.existsSync(sub)) {
          file = fs.readdirSync(sub).filter((f) => f.endsWith('.jsonl')).map((f) => path.join(sub, f))
            .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
        }
      }
      transcriptFile = file;
    }
  } else {
    const brain = path.join(home, '.gemini', 'antigravity-cli', 'brain');
    if (run.sessione) {
      file = path.join(home, '.gemini', 'antigravity-cli', 'conversations', `${run.sessione}.db`);
      const tf = path.join(brain, run.sessione, '.system_generated', 'logs', 'transcript.jsonl');
      if (fs.existsSync(tf)) transcriptFile = tf;
    }
    if (!transcriptFile && fs.existsSync(brain)) {
      try {
        const recent = fs.readdirSync(brain).map((d) => {
          const tf = path.join(brain, d, '.system_generated', 'logs', 'transcript.jsonl');
          return fs.existsSync(tf) ? { d, tf, mtime: fs.statSync(tf).mtimeMs } : null;
        }).filter(Boolean).sort((a, b) => b.mtime - a.mtime).slice(0, 15);
        const hit = recent.find((x) => {
          const head = fs.readFileSync(x.tf, 'utf8').slice(0, 2500);
          return head.includes(`**${id}**`) || head.toLowerCase().includes(`worktrees\\${id.toLowerCase()}`) || head.toLowerCase().includes(`worktrees/${id.toLowerCase()}`);
        });
        if (hit) {
          transcriptFile = hit.tf;
          if (!file) file = hit.tf;
        }
      } catch { /* ignore */ }
    }
    if (!file && run.sessione) file = path.join(home, '.gemini', 'antigravity-cli', 'conversations', `${run.sessione}.db`);
  }
  const exists = Boolean((file && fs.existsSync(file)) || (transcriptFile && fs.existsSync(transcriptFile)));
  const rawCheck = file && fs.existsSync(file) ? fs.readFileSync(file).toString('latin1') : transcriptFile && fs.existsSync(transcriptFile) ? fs.readFileSync(transcriptFile, 'utf8') : '';
  const agents = isClaude ? rawCheck.includes('Regole inviolabili') : /[\\/]AGENTS\.md/.test(rawCheck);
  const log = path.join(p.logs, `${id}.${run.tentativi}.log`);
  const logText = fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : '';
  const out = logText ? readOutput(logText) : undefined;
  const convText = transcriptFile && fs.existsSync(transcriptFile) ? fs.readFileSync(transcriptFile, 'utf8') : '';
  const conversazione = convText ? parseConversation(convText, isClaude) : [];
  return { id, run, file: file ?? transcriptFile, transcriptFile, exists, agents, log, logText, out, conversazione };
}

function trace(id) {
  const t = traceOf(id);
  if (!t) { console.log(`${id}: nessuna esecuzione in .pipeline/esecuzioni.json`); return; }
  const { run, file, exists, agents, log, out } = t;
  console.log(`${id} su ${run.provider}, ${run.tentativi} tentativo/i, ${run.stato}${run.esito ? ` — ${run.esito}` : ''}`);
  console.log(`Conversazione: ${exists ? file : '(non trovata)'}${run.provider === 'claude' ? '' : `  (riprendila con: agy --conversation ${run.sessione})`}`);
  if (run.provider === 'claude') console.log(`  (riprendila con: claude --resume ${run.sessione}, dalla cartella ${run.dir})`);
  console.log(`AGENTS.md: ${exists ? (agents ? 'letto' : 'NON trovato nella conversazione') : '?'}`);
  console.log(`Log: ${log}\n\n--- Riepilogo dell'agente ---\n${out?.result ?? '(nessun log)'}`);
}

/** Puts back in the queue a run that stopped without a usage limit being recognised: it resumes its conversation. */
export function resumeTasks(ids, opts) {
  const p = pathsOf(opts);
  const runs = readJson(p.runs, {});
  const resumed = [];
  for (const id of ids) {
    const run = runs[id];
    if (!run) { console.log(`${id}: nessuna esecuzione`); continue; }
    if (run.sessione) Object.assign(run, { stato: 'sospeso', fermoFino: now(), esito: undefined, fine: undefined, pid: undefined });
    else delete runs[id];
    writeJson(p.runs, runs);
    say(`${id}: rimesso in coda (${run.sessione ? 'riprende la sua conversazione' : 'riparte da capo'})`, p.report);
    resumed.push(id);
  }
  return resumed;
}

/** Stops a running task (the orchestrator does it when a bug would spoil its checks): it keeps its conversation. */
export function interruptTasks(ids, opts) {
  const p = pathsOf(opts);
  const runs = readJson(p.runs, {});
  const list = ids.includes('--tutti') ? Object.values(runs).filter((r) => r.stato === 'in corso').map((r) => r.id) : ids;
  const interrupted = [];
  for (const id of list) {
    const run = runs[id];
    if (run?.stato !== 'in corso') { console.log(`${id}: non è in corso`); continue; }
    Object.assign(run, { stato: 'interrotto', interrotto: now() });
    writeJson(p.runs, runs);
    if (run.pid) killTree(run.pid);
    say(`${id}: interrotto dall'orchestratore (riprende con riprendi ${id})`, p.report);
    interrupted.push(id);
  }
  return interrupted;
}

/**
 * Merges a finished task into the base. A conflict leaves the base as it was: the merge is aborted and the files are
 * named, so whoever orchestrates delegates the merge to an agent (a task that merges `task/<Txx>` in its own worktree).
 */
export function integrateTask(id, opts) {
  const p = pathsOf(opts);
  const base = worktrees().find((w) => w.branch === p.config.base);
  try {
    git(['merge', '--no-ff', '-m', `Pipeline: integra ${id}`, `task/${id}`], base.path);
  } catch (e) {
    const conflicts = (() => { try { return git(['diff', '--name-only', '--diff-filter=U'], base.path).split('\n').filter(Boolean); } catch { return []; } })();
    try { git(['merge', '--abort'], base.path); } catch { /* nothing to abort: the merge did not start */ }
    const msg = `integra ${id}: ${conflicts.length ? `conflitti in ${conflicts.join(', ')}` : `non riuscito (${String(e.stderr ?? e.message).trim().split('\n')[0]})`}; il base è com'era`;
    say(msg, p.report);
    process.exitCode = 1;
    return { ok: false, message: msg, conflicts };
  }
  const runs = readJson(p.runs, {});
  if (runs[id]) { runs[id].integrato = now(); writeJson(p.runs, runs); }
  // The worktree goes: first the junction alone (removing it as a folder would empty the base's node_modules).
  const wt = worktrees().find((w) => w.branch === `task/${id}`);
  if (wt) {
    const nm = path.join(wt.path, 'node_modules');
    if (fs.existsSync(nm) && fs.lstatSync(nm).isSymbolicLink()) fs.unlinkSync(nm);
    git(['worktree', 'remove', wt.path], base.path);
  }
  git(['branch', '-d', `task/${id}`], base.path);
  const msg = `task/${id} integrato in ${p.config.base}; worktree e branch tolti.`;
  say(msg, p.report);
  return { ok: true, message: msg };
}

// --- What the orchestrator reads and changes ---------------------------------------------------------------------

const BACKLOG = path.join(REPO, 'docs', 'plans', 'backlog.md');

/** The block of a task in the backlog: from its `### Txx ·` line to the next heading. */
export function taskBlock(text, id) {
  const m = new RegExp(`^### ${id} · [^\\n]*\\n(?:(?!#{2,4} )[^\\n]*\\n?)*`, 'm').exec(text);
  return m?.[0];
}

/**
 * Sets the `- Pipeline:` line of a task (`approva`, `assegna`): `change` gets the parsed line (or nothing) and
 * gives the new one; the line goes right under the heading.
 */
export function setPipelineLine(text, id, change) {
  const block = taskBlock(text, id);
  if (!block) throw new Error(`${id}: non c'è nel backlog`);
  const old = /^- Pipeline:\s*(.+)$/m.exec(block);
  const info = change(old ? parsePipelineLine(old[1]) : undefined);
  const browserTag = info.needsBrowser ? ' · browser' : '';
  const line = `- Pipeline: ${info.provider} · stima ${info.estimate}%${info.approved ? ' · approvato' : ''}${browserTag} · priorità ${info.priority}`;
  const next = old ? block.replace(old[0], line) : block.replace(/\n/, `\n${line}\n`);
  return text.replace(block, next);
}

function editPipeline(id, change, opts) {
  const p = pathsOf(opts);
  const text = fs.readFileSync(p.backlog, 'utf8');
  fs.writeFileSync(p.backlog, setPipelineLine(text, id, change));
}

export function approveTasks(ids, opts) {
  for (const id of ids) {
    editPipeline(id, (i) => {
      if (!i?.provider) throw new Error(`${id}: senza provider e stima (assegna prima)`);
      return { ...i, approved: true };
    }, opts);
  }
  return ids;
}

export function assignTask(id, { provider, stima, priorita, approva }, opts) {
  const p = pathsOf(opts);
  if (!p.config.providers[provider] || !(Number(stima) > 0)) {
    throw new Error('Uso: assegna <Txx> <claude|gemini|argon> <stima %> [priorità] [--approva]');
  }
  const tasks = parseBacklog(readText(p.backlog));
  const t = tasks.find((x) => x.id === id);
  const provConf = p.config.providers[provider];
  if (t?.needsBrowser && !(provConf?.browser ?? provider === 'claude')) {
    const valid = Object.keys(p.config.providers).filter((k) => p.config.providers[k].browser ?? k === 'claude').join(', ');
    throw new Error(`${id}: richiede verifica nel browser, va solo su un provider con browser (${valid})`);
  }
  editPipeline(id, (i) => ({
    provider,
    estimate: Number(stima),
    priority: priorita !== undefined && priorita !== '' && !String(priorita).startsWith('--') ? Number(priorita) : i?.priority ?? 100,
    approved: Boolean(approva || i?.approved),
    needsBrowser: t?.needsBrowser ?? i?.needsBrowser ?? false,
  }), opts);
  return { id, provider, stima: Number(stima) };
}

export function setBudgetManual(provider, residuo, opts) {
  const p = pathsOf(opts);
  const b = readJson(p.budget, {});
  const conf = p.config.providers?.[provider] ?? CONFIG.providers?.[provider];
  const isWeeklyOnly = conf?.finestra5h === false || provider === 'argon';
  const val = Number(residuo);
  b[provider] = {
    ...b[provider],
    residuo: val,
    ...(isWeeklyOnly ? { sessione: val } : {}),
    aggiornato: now(),
    fermoFino: undefined,
  };
  writeJson(p.budget, b);
  return b;
}

export function refreshUsage(opts) {
  const p = pathsOf(opts);
  const b = readJson(p.budget, {});
  for (const k of Object.keys(b)) delete b[k].letto;
  writeJson(p.budget, b);
  if (!opts?.repo) {
    const fresh = loadBudget();
    writeJson(p.budget, fresh);
    return fresh;
  }
  return b;
}

/** The first task number nobody has used. */
export function nextTaskId(text) {
  const n = Math.max(0, ...[...text.matchAll(/^#{3,4} T(\d+)/gm)].map((m) => Number(m[1])));
  return `T${n + 1}`;
}

/** One line per task: the orchestrator's view of the whole backlog. */
function index() {
  const runs = readJson(RUNS, {});
  for (const t of loadTasks()) {
    const r = runs[t.id];
    const run = r && !r.integrato ? ` [${r.stato}${r.esito ? `: ${r.esito.replace(/^ESITO:\s*/, '').slice(0, 60)}` : ''}]` : '';
    console.log(`${t.id} · ${t.status}${t.provider ? ` · ${t.provider} ${t.estimate ?? '?'}%${t.approved ? ' ✓' : ''} p${t.priority}` : ''}${t.deps.length ? ` · dopo ${t.deps.join(' ')}` : ''} · ${t.title}${run}`);
  }
}

/**
 * Everything about a task that whoever works on it needs, built from the files and git (no agent writes it): its
 * block, its run, its commits and files, the ADRs it names, the tasks it depends on, those that depend on it, and
 * the tasks whose commits touched the same files. The orchestrator opens it on demand and passes it on.
 */
export function dossierOf(id, opts) {
  const p = pathsOf(opts);
  const safeGit = (args) => { try { return execFileSync('git', args, { cwd: p.repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };
  const text = fs.readFileSync(p.backlog, 'utf8');
  const tasks = parseBacklog(text);
  const block = taskBlock(text, id) ?? taskBlock(text, id.replace(/[a-z]$/, ''));
  const run = readJson(p.runs, {})[id];
  const out = [`# Dossier di ${id}`, '', block?.trim() ?? '(non c\'è nel backlog)', ''];
  if (run) out.push('## Esecuzione', '', `${run.provider}, ${run.tentativi} tentativo/i, ${run.stato}${run.integrato ? `, integrato il ${run.integrato}` : ''}`,
    ...[run.esito, run.browser, run.sessione && `sessione ${run.sessione} (traccia: node tools/pipeline/pipeline.mjs traccia ${id})`].filter(Boolean), '');
  const word = new RegExp(`\\b${id}\\b`);
  // The id in the subject or in the body (a fix of T63 made by another task says so in its message).
  const commits = safeGit(['log', '--all', '--format=%h %ad %s%x01%b%x02', '--date=short', `--grep=${id}`, '-n', '60']).split('\x02')
    .map((c) => c.trim()).filter((c) => word.test(c)).map((c) => c.split('\x01')[0]).slice(0, 30);
  if (commits.length) out.push('## Commit', '', ...commits.map((c) => `- ${c}`), '');
  const files = new Set();
  for (const c of commits.map((l) => l.split(' ')[0])) {
    const merge = safeGit(['rev-list', '--parents', '-n', '1', c]).split(' ').length > 2;
    for (const f of safeGit(['show', '--format=', '--name-only', ...(merge ? ['-m', '--first-parent'] : []), c]).split('\n').filter(Boolean)) files.add(f);
  }
  if (files.size) out.push('## File', '', ...[...files].sort().map((f) => `- ${f}`), '');
  const adrs = new Set([...`${block ?? ''}\n${commits.join('\n')}`.matchAll(/ADR-(\d{4})/g)].map((m) => m[1]));
  const adrFiles = fs.existsSync(p.adrDir) ? fs.readdirSync(p.adrDir) : [];
  const adrList = [...adrs].sort().map((n) => `docs/adr/${adrFiles.find((f) => f.startsWith(n)) ?? `${n}-…`}`);
  if (adrList.length) out.push('## ADR', '', ...adrList.map((a) => `- ${a}`), '');
  const me = tasks.find((t) => t.id === id);
  const after = tasks.filter((t) => t.deps.includes(id)).map((t) => t.id);
  const near = new Map();
  if (files.size) {
    const cleanFiles = [...files].filter((f) => !/backlog|PIANO|consumi|orchestrazione|AGENTS\.md|README/.test(f)).slice(0, 40);
    const subjects = cleanFiles.length ? safeGit(['log', '--format=%s', '-n', '400', '--', ...cleanFiles]) : '';
    for (const m of subjects.matchAll(/\bT\d+[a-z]?\b/g)) if (m[0] !== id) near.set(m[0], (near.get(m[0]) ?? 0) + 1);
  }
  const sameFiles = [...near].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t, n]) => ({ id: t, count: n }));
  out.push('## Collegati', '', `- dipende da: ${me?.deps.join(', ') || '—'}`, `- dipendono da lui: ${after.join(', ') || '—'}`,
    `- stessi file: ${sameFiles.map((s) => `${s.id} (${s.count})`).join(', ') || '—'}`);
  const q = path.join(p.domande, `${id}.md`);
  const hasQuestions = fs.existsSync(q);
  if (hasQuestions) out.push(`- domande: docs/pipeline/domande/${id}.md`);
  return {
    id,
    markdown: out.join('\n'),
    block: block?.trim(),
    run,
    commits,
    files: [...files].sort(),
    adrs: adrList,
    deps: me?.deps ?? [],
    after,
    sameFiles,
    hasQuestions,
  };
}

function dossier(id) {
  console.log(dossierOf(id).markdown);
}

const [cmd, ...rest] = process.argv.slice(2);
const flag = (name) => { const i = rest.indexOf(`--${name}`); return i >= 0 ? rest[i + 1] : undefined; };
if (process.argv[1]?.endsWith('pipeline.mjs')) {
  if (cmd === 'stato' || !cmd) status();
  else if (cmd === 'esegui') await execute({ max: Number(flag('max') ?? CONFIG.maxParalleli), only: flag('solo'), task: flag('task'), always: rest.includes('--sempre') });
  else if (cmd === 'uso') { refreshUsage(); status(); }
  else if (cmd === 'budget') {
    const b = loadBudget();
    const prov = rest[0];
    const residuo = Number(rest[1]);
    const conf = CONFIG.providers?.[prov];
    const isWeeklyOnly = conf?.finestra5h === false || prov === 'argon';
    b[prov] = { ...b[prov], residuo, ...(isWeeklyOnly ? { sessione: residuo } : {}), aggiornato: now(), fermoFino: undefined };
    writeJson(BUDGET, b);
    status();
  }
  else if (cmd === 'worktree') listWorktrees();
  else if (cmd === 'integra') integrateTask(rest[0]);
  else if (cmd === 'traccia') trace(rest[0]);
  else if (cmd === 'riprendi') resumeTasks(rest);
  else if (cmd === 'interrompi') interruptTasks(rest);
  else if (cmd === 'dossier') dossier(rest[0]);
  else if (cmd === 'indice') index();
  else if (cmd === 'prossimo') console.log(nextTaskId(fs.readFileSync(BACKLOG, 'utf8')));
  else if (cmd === 'approva') { approveTasks(rest); for (const id of rest) console.log(`${id}: approvato`); }
  else if (cmd === 'assegna') {
    const [id, provider, stima, priorita] = rest;
    if (!CONFIG.providers[provider] || !(Number(stima) > 0)) console.log('Uso: assegna <Txx> <claude|gemini|argon> <stima %> [priorità] [--approva]');
    else { assignTask(id, { provider, stima, priorita, approva: rest.includes('--approva') }); console.log(`${id}: ${provider}, ${stima}%`); }
  }
  else if (cmd === 'turno') {
    const sep = rest.indexOf('--');
    if (!rest[0] || sep < 0 || sep === rest.length - 1) {
      for (const [kind, h] of Object.entries(turnsOf())) console.log(`turno ${kind}: ${h.chi ? `${h.chi} (${h.comando}, dal ${h.dal})` : 'libero'}${h.attesa ? `, ${h.attesa} in attesa` : ''}`);
      if (rest[0]) console.log('Uso: turno browser|test -- <comando>');
    } else process.exitCode = await runInTurn(rest[0], rest.slice(sep + 1));
  }
  else if (cmd === 'nota') say(`nota: ${rest.join(' ')}`);
  else if (cmd === 'orchestratore') {
    if (rest[0] && !CONFIG.providers[rest[0]]) console.log(`Provider sconosciuto: ${rest[0]} (${Object.keys(CONFIG.providers).join(', ')})`);
    else if (rest[0]) { writeJson(ORCHESTRATOR, { provider: rest[0], dal: now() }); say(`orchestratore: ${rest[0]}`); }
    else console.log(orchestrator());
  }
  // Not awaited: orchestra.mjs and web.mjs import this module, which must finish evaluating first.
  else if (cmd === 'orchestra') void import('./orchestra.mjs').then((m) => m.orchestra({ agente: flag('agente'), porta: flag('porta') ? Number(flag('porta')) : undefined }));
  else if (cmd === 'web') void import('./web.mjs').then((m) => m.startWebServer({ port: Number(flag('porta') ?? CONFIG.orchestra?.porta ?? 4242) }));
  else console.log(`Comandi:
  orchestra [--agente claude|argon|gemini] [--porta 4242]   l'orchestratore, la pipeline e l'interfaccia web
  web [--porta 4242]                                        solo l'interfaccia web della pipeline
  stato | uso | indice | dossier <Txx> | traccia <Txx> | worktree | prossimo
  esegui [--sempre] [--max N] [--solo <provider>] [--task Txx]
  approva <Txx…> | assegna <Txx> <provider> <stima %> [priorità] [--approva]
  interrompi <Txx…|--tutti> | riprendi <Txx…> | integra <Txx>
  budget <provider> <residuo %> | orchestratore [provider] | nota <testo>
  turno [browser|test -- <comando>]                         aspetta il turno, esegue, lo lascia (ADR-0088)`);
}
