// The generator of the leftover credits (T88, ADR-0177): when a subscription would reach its weekly reset with credits left
// even with every slot full, the pipeline runs the deferred generation (T207, ADR-0143: `npm run genera`) on the next universe
// of `generazione` in config.json, within what is left and the ceiling of each universe. It holds one place under the ceiling
// of its CLI (`limiti.provider`), which does not change, and always gives it back to a ready task; stopping it keeps the work
// done (the generation writes only whole valid steps, and resumes from them). The author turns it off with `generatore spegni`.
//
// No dependency on pipeline.mjs (which imports this): the decisions are pure functions of the budget, the state and the
// universes' progress; `Generator` adds the processes and the state file (`.pipeline/generatore.json`).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const DAY = 86_400_000;
const NAME_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/i;
/** How long an universe whose generation ended in error waits before it is tried again. */
const RETRY_MS = 6 * 3_600_000;

const readJson = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } };
// On Windows a rename onto a file another process has open (the web page, `stato`, an antivirus) fails with EPERM or EBUSY:
// it is retried a few times, then the file is written in place; the state file is never worth crashing the pipeline for.
const writeJson = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const text = JSON.stringify(data, null, 2) + '\n';
  const tmp = `${file}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tmp, text);
    for (let i = 0; ; i++) {
      try { fs.renameSync(tmp, file); return; } catch (e) {
        if (i >= 4 || !['EPERM', 'EBUSY', 'EACCES'].includes(e.code)) throw e;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 25 * (i + 1));
      }
    }
  } catch (e) {
    try { fs.rmSync(tmp, { force: true }); } catch { /* left for the next write */ }
    try { fs.writeFileSync(file, text); } catch (e2) { console.error(`generatore: ${file} non scritto (${e2.code ?? e2.message})`); }
  }
};
const readText = (file) => { try { return fs.readFileSync(file, 'utf8'); } catch { return ''; } };
const round = (n) => Math.round(n * 10) / 10;

/** The generator's settings, with their defaults (`generatore` in config.json). */
export function generatorConf(config = {}) {
  const g = config.generatore ?? {};
  return {
    acceso: g.acceso !== false,
    provider: g.provider ?? 'claude',
    minimo: g.minimo ?? 10,
    sessioneMinima: g.sessioneMinima ?? 30,
    sessioneArresto: g.sessioneArresto ?? 15,
    comando: g.comando ?? ['npm', 'run', 'genera', '--', '{universo}', '--tema', '{ambientazione}', '--partita', '{partita}', '--tetto', '{tetto}'],
    coda: g.coda ?? ['npm', 'run', 'abbonamento'],
    cartellaUniversi: g.cartellaUniversi ?? 'universes',
  };
}

/**
 * The pace of a week (% per ms) from the samples since its last refill within `giorni`, as `forecastEmpty` reads them;
 * 0 when it is not being used, undefined when there is too little to say.
 */
export function paceOf(storia = [], nowMs = Date.now(), giorni = 3) {
  const recent = storia.filter((s) => nowMs - Date.parse(s.t) <= giorni * DAY);
  let start = 0;
  for (let i = 1; i < recent.length; i++) if (recent[i].residuo > recent[i - 1].residuo) start = i;
  const seg = recent.slice(start);
  if (seg.length < 2) return undefined;
  const ms = Date.parse(seg.at(-1).t) - Date.parse(seg[0].t);
  if (ms < 3_600_000) return undefined; // under an hour of samples the pace is noise
  return Math.max(0, (seg[0].residuo - seg.at(-1).residuo) / ms);
}

/**
 * What would be left of the week at its reset with every slot full: the pace of the last days scaled from the slots it ran
 * with to the ceiling (`tetto / slot`). Undefined without a reset or a pace.
 */
export function leftoverAtReset({ residuo = 100, storia = [], reset, slot = 1, tetto = 1, nowMs = Date.now(), giorni = 3 }) {
  if (!reset) return undefined;
  const until = Date.parse(reset) - nowMs;
  if (!(until > 0)) return undefined;
  const pace = paceOf(storia, nowMs, giorni);
  if (pace === undefined) return undefined;
  const full = pace * Math.max(1, tetto / Math.max(1, slot));
  return round(residuo - full * until);
}

/** The progress of a universe's generation (`universes/.generation/<nome>.json`, `.generazione/` before the contract 0.4). */
export function readProgress(dir, name) {
  return readJson(path.join(dir, '.generation', `${name}.json`), undefined) ?? readJson(path.join(dir, '.generazione', `${name}.json`), undefined);
}

/** What a universe's generation has spent of this week (the reset it measured is this week's), or of the one it knows. */
export function weekSpent(progress, reset) {
  const c = progress?.consumo;
  if (!c) return 0;
  const speso = Number(c.speso) || 0;
  if (!c.reset || !reset) return speso;
  return Math.abs(Date.parse(c.reset) - Date.parse(reset)) < 6 * 3_600_000 ? speso : 0;
}

/** Whether a universe is out for now: finished, its ceiling reached this week, an error not old enough to try again. */
export function isOut(entry, nowMs = Date.now()) {
  if (!entry) return false;
  if (entry.stato === 'finito') return true;
  return Boolean(entry.fino) && nowMs < Date.parse(entry.fino);
}

/** The next universe of `generazione` to generate, with what it spent this week; undefined if none is left. */
export function nextUniverse(list = [], state = {}, { reset, nowMs = Date.now(), progressOf = () => undefined } = {}) {
  for (const u of list) {
    if (!NAME_RE.test(u.universo ?? '') || (u.ambientazione && !NAME_RE.test(u.ambientazione))) continue;
    if (isOut(state.universi?.[u.universo], nowMs)) continue;
    const speso = weekSpent(progressOf(u.universo), reset);
    if (speso >= (u.tettoSettimana ?? 10)) continue;
    return { ...u, speso };
  }
  return undefined;
}

/**
 * What the generator does at a check: `avvia` (with the universe and the ceiling to give it), `ferma` (with why), or
 * nothing (`continua`, `attende` with why). `live` are the tasks running on its account's CLI; `wanting` says that a ready
 * task of that CLI would start if the generator were not there.
 */
export function generatorDecision({ conf, list = [], state = {}, b = {}, live = 0, ceiling = 1, wanting = false, stopping = false, running = false, nowMs = Date.now(), giorni = 3, riserva = 3, progressOf }) {
  const reset = b.resetSettimana;
  const leftover = leftoverAtReset({ residuo: b.residuo, storia: b.storia, reset, slot: b.slot, tetto: b.tetto, nowMs, giorni });
  const session = b.sessione ?? b.residuo ?? 100;
  const halted = (b.fermoFino && Date.parse(b.fermoFino) > nowMs) || b.sospeso;
  const why = stopping ? 'la pipeline si spegne'
    : !conf.acceso || state.spento ? 'spento dall’autore'
    : wanting ? 'un task pronto vuole lo slot'
    : halted ? `${conf.provider} è fermo o sospeso`
    : undefined;
  if (running) {
    const stop = why
      ?? (session < conf.sessioneArresto ? `finestra delle 5 ore al ${session} % (sotto il ${conf.sessioneArresto} %)` : undefined)
      ?? (leftover !== undefined && leftover <= riserva ? `al reset non avanzerebbe più niente (${leftover} %)` : undefined);
    return stop ? { azione: 'ferma', motivo: stop, leftover } : { azione: 'continua', leftover };
  }
  const wait = why
    ?? (live + 1 > ceiling ? `nessun posto sotto il tetto della CLI (${live} di ${ceiling})` : undefined)
    ?? (session < conf.sessioneMinima ? `finestra delle 5 ore al ${session} % (parte dal ${conf.sessioneMinima} %)` : undefined)
    ?? (leftover === undefined ? 'nessuna previsione dell’avanzo (serve il ritmo di almeno un’ora e il reset)' : undefined)
    ?? (leftover < conf.minimo ? `al reset avanzerebbe il ${leftover} % (parte dal ${conf.minimo} %)` : undefined);
  if (wait) return { azione: 'attende', motivo: wait, leftover };
  const next = nextUniverse(list, state, { reset, nowMs, progressOf });
  if (!next) return { azione: 'attende', motivo: 'nessun universo da generare', leftover };
  const tetto = round(Math.min(next.tettoSettimana ?? 10, next.speso + leftover - riserva));
  return { azione: 'avvia', universo: next, tetto, leftover };
}

/** The outcome the generation printed last (`finito|tetto|interrotto|errore[: motivo] — n passi`). */
export function readOutcome(text = '') {
  const all = [...String(text).matchAll(/^(finito|tetto|interrotto|errore)(?::\s*(.*?))?\s+—\s+\d+ passi/gm)];
  const last = all.at(-1);
  return last ? { esito: last[1], ...(last[2] ? { motivo: last[2] } : {}) } : undefined;
}

/**
 * What a generation that ended says of its universe (mutates `state.universi`): finished for good; its ceiling reached this
 * week (until the reset); an error, or an exit without an outcome (tried again in some hours). A ceiling that was only the
 * leftover of this run, or an interruption, changes nothing: it resumes from there.
 */
export function settle(state, run, outcome, { speso = 0, reset, nowMs = Date.now() } = {}) {
  const universi = (state.universi ??= {});
  const t = new Date(nowMs).toISOString();
  const esito = outcome?.esito ?? 'errore';
  const motivo = outcome ? outcome.motivo : 'uscito senza esito';
  if (esito === 'finito') universi[run.universo] = { stato: 'finito', t };
  else if (esito === 'tetto' && speso >= (run.tettoSettimana ?? Infinity)) universi[run.universo] = { stato: 'tetto', t, fino: reset ?? new Date(nowMs + 7 * DAY).toISOString() };
  else if (esito === 'errore') universi[run.universo] = { stato: 'errore', t, motivo, fino: new Date(nowMs + RETRY_MS).toISOString() };
  state.ultimo = { universo: run.universo, esito, ...(motivo ? { motivo } : {}), fine: t, speso: round(speso - (run.speso0 ?? 0)) };
  return state;
}

/** A command of config.json with its placeholders filled; undefined if a value is not a plain name or number. */
export function fillCommand(cmd, values) {
  const out = [];
  for (const a of cmd) {
    const filled = a.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ''));
    if (/\{\w+\}/.test(a) && !/^[\w.-]+$/.test(filled)) return undefined;
    out.push(filled);
  }
  return out;
}

/** The generator's processes and its state file. Every check calls `tick`; `stop` for the shutdown. */
export class Generator {
  constructor({ config, stateFile, switchFile, repo, logs, spawnFn = spawn, kill, isAlive, say = () => {}, progressOf } = {}) {
    Object.assign(this, { config, stateFile, switchFile, repo, logs, spawnFn, kill, isAlive, say });
    this.progressOf = progressOf ?? ((name) => readProgress(path.resolve(repo, generatorConf(config).cartellaUniversi), name));
  }

  get conf() { return generatorConf(this.config); }
  load() { return readJson(this.stateFile, {}); }
  save(s) { writeJson(this.stateFile, s); }
  isOff() { return Boolean(readJson(this.switchFile, undefined)?.spento); }
  running(s = this.load()) { return Boolean(s.corrente?.pid && this.isAlive(s.corrente.pid)); }

  /** A check: settles a generation that ended, stops the one that must give way, starts one on what is left. */
  tick({ budget = {}, live = 0, ceiling = 1, wanting = false, stopping = false, nowMs = Date.now() } = {}) {
    const s = this.load();
    const conf = this.conf;
    const b = budget[conf.provider] ?? {};
    if (s.corrente && !this.isAlive(s.corrente.pid)) this.ended(s, b, nowMs);
    const d = generatorDecision({
      conf, list: this.config.generazione ?? [], state: { ...s, spento: this.isOff() }, b, live, ceiling, wanting, stopping,
      running: Boolean(s.corrente), nowMs, giorni: this.config.giorniPrevisione ?? 3, riserva: this.config.riserva ?? 3, progressOf: this.progressOf,
    });
    s.avanzo = d.leftover;
    s.controllo = new Date(nowMs).toISOString();
    if (d.azione === 'ferma') this.halt(s, d.motivo, b, nowMs);
    else if (d.azione === 'avvia') this.start(s, d, b, nowMs);
    s.attesa = d.azione === 'attende' || d.azione === 'ferma' ? d.motivo : undefined;
    this.save(s);
    return d;
  }

  start(s, d, b, nowMs) {
    const u = d.universo;
    const conf = this.conf;
    const args = fillCommand(conf.comando, { universo: u.universo, ambientazione: u.ambientazione ?? 'medievale', partita: u.partita ?? 'singola', tetto: d.tetto });
    if (!args) { s.universi = { ...s.universi, [u.universo]: { stato: 'errore', motivo: 'comando non valido', t: new Date(nowMs).toISOString(), fino: new Date(nowMs + RETRY_MS).toISOString() } }; return; }
    fs.mkdirSync(this.logs, { recursive: true });
    const stamp = new Date(nowMs).toISOString().replace(/[:.]/g, '-');
    const log = path.join(this.logs, `generatore-${u.universo}-${stamp}.log`);
    const coda = this.serveQueue(stamp, nowMs);
    const pid = this.spawnLogged(args, log);
    if (!pid) { if (coda) this.kill(coda); return; }
    s.corrente = { universo: u.universo, tettoSettimana: u.tettoSettimana ?? 10, tetto: d.tetto, speso0: u.speso, pid, ...(coda ? { coda } : {}), dal: new Date(nowMs).toISOString(), log, avanzo: d.leftover };
    this.say(`generatore: genera ${u.universo} (${u.ambientazione ?? 'medievale'}) su ${conf.provider}, tetto ${d.tetto} % della settimana (speso finora ${u.speso} %, al reset avanzerebbe il ${d.leftover} %)`);
  }

  /** The process that serves the subscription's queue, if nobody serves it (its heartbeat): the pid of the one started. */
  serveQueue(stamp, nowMs) {
    const dir = path.resolve(this.repo, this.conf.cartellaUniversi);
    const beat = readJson(path.join(dir, '.queue', `servitore-${this.conf.provider}.json`), undefined) ?? readJson(path.join(dir, '.coda', `servitore-${this.conf.provider}.json`), undefined);
    if (beat && nowMs - Date.parse(beat.tempo) < 30_000 && this.isAlive(beat.pid)) return undefined;
    if (!this.conf.coda?.length) return undefined;
    return this.spawnLogged(this.conf.coda, path.join(this.logs, `generatore-coda-${stamp}.log`));
  }

  spawnLogged([cmd, ...args], log) {
    const fd = fs.openSync(log, 'w');
    try {
      const child = this.spawnFn(cmd, args, { cwd: this.repo, stdio: ['ignore', fd, fd], windowsHide: true, detached: true, shell: process.platform === 'win32' });
      child.on?.('error', (e) => fs.appendFileSync(log, `\n${e.message}\n`));
      child.unref?.();
      return child.pid;
    } finally { fs.closeSync(fd); }
  }

  /** A generation that ended by itself: what it says of its universe, and the queue's process goes with it. */
  ended(s, b, nowMs) {
    const run = s.corrente;
    if (run.coda) this.kill(run.coda);
    const outcome = readOutcome(readText(run.log));
    const speso = weekSpent(this.progressOf(run.universo), b.resetSettimana);
    settle(s, run, outcome, { speso, reset: b.resetSettimana, nowMs });
    s.corrente = undefined;
    this.say(`generatore: ${run.universo} ${outcome?.esito ?? 'uscito senza esito'}${outcome?.motivo ? ` (${outcome.motivo})` : ''}, speso ${s.ultimo.speso} % in questa esecuzione`);
  }

  /** Stops the generation now: the step in progress is not written, the ones before stay (ADR-0143). */
  halt(s, motivo, b = {}, nowMs = Date.now()) {
    const run = s.corrente;
    if (!run) return;
    this.kill(run.pid);
    if (run.coda) this.kill(run.coda);
    const speso = weekSpent(this.progressOf(run.universo), b.resetSettimana);
    s.ultimo = { universo: run.universo, esito: 'fermato', motivo, fine: new Date(nowMs).toISOString(), speso: round(speso - (run.speso0 ?? 0)) };
    s.corrente = undefined;
    this.say(`generatore: fermo ${run.universo} (${motivo}), il lavoro fatto resta e riprende da lì`);
  }

  /** For the shutdown of the pipeline. */
  stop(motivo, budget = {}) {
    const s = this.load();
    if (!s.corrente) return;
    this.halt(s, motivo, budget[this.conf.provider]);
    this.save(s);
  }

  /** What `stato` says: on or off, what it generates and what it spent, why it waits, each universe. */
  describe(budget = {}) {
    const s = this.load();
    const conf = this.conf;
    const reset = budget[conf.provider]?.resetSettimana;
    const lines = [`generatore (${conf.provider}): ${!conf.acceso ? 'spento in config.json' : this.isOff() ? 'spento dall’autore (generatore accendi)' : 'acceso'}`
      + (s.avanzo !== undefined ? `, al reset avanzerebbe il ${s.avanzo} %` : '')];
    if (s.corrente && this.running(s)) {
      const speso = weekSpent(this.progressOf(s.corrente.universo), reset);
      lines.push(`  genera ${s.corrente.universo} dal ${s.corrente.dal} (processo ${s.corrente.pid}), tetto ${s.corrente.tetto} %, speso ${round(speso - (s.corrente.speso0 ?? 0))} % in questa esecuzione, log ${s.corrente.log}`);
    } else if (s.attesa) lines.push(`  fermo: ${s.attesa}`);
    if (s.ultimo) lines.push(`  ultima: ${s.ultimo.universo} ${s.ultimo.esito}${s.ultimo.motivo ? ` (${s.ultimo.motivo})` : ''} il ${s.ultimo.fine}, speso ${s.ultimo.speso} %`);
    for (const u of this.config.generazione ?? []) {
      const e = s.universi?.[u.universo];
      const speso = weekSpent(this.progressOf(u.universo), reset);
      lines.push(`  ${u.universo}: speso ${speso} di ${u.tettoSettimana ?? 10} % questa settimana${e && isOut(e) ? `, ${e.stato}${e.fino ? ` fino al ${e.fino}` : ''}${e.motivo ? ` (${e.motivo})` : ''}` : ''}`);
    }
    return lines;
  }
}

/** The author's switch (`generatore spegni|accendi`): a file of its own, so it never races with the running pipeline. */
export function setGeneratorSwitch(switchFile, spento, chi) {
  if (spento) writeJson(switchFile, { spento: true, t: new Date().toISOString(), ...(chi ? { chi } : {}) });
  else fs.rmSync(switchFile, { force: true });
}
