// The orchestrator's environment (ADR-0079): one process runs the pipeline (`esegui`, always on) and the conversation
// with the orchestrating agent, a turn at a time through its CLI (`claude -p --resume`, `agy -p --conversation`). The
// author chats from the terminal; the pipeline's events go into a queue on disk and reach the orchestrator between
// turns. A conversation is an epoch: the process starts a new one at half the context window, when the orchestrator's
// provider runs out of credits (on the next provider of `orchestra.ordine`), or when the author asks (`/agente`). A new
// epoch starts from what is on disk: the «quadro» the orchestrator keeps (docs/pipeline/quadro.md), the index of the
// tasks, the events not yet delivered, the last messages of the chat. Nothing the orchestrator had only in its head
// is needed, and nothing the pipeline said is lost.
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { bus, BUDGET, CONFIG, execute, loadBudget, now, readJson, readOutput, REPO, say, setOrchestrator, STATE_DIR, usageLimit, writeJson } from './pipeline.mjs';

const DIR = path.join(STATE_DIR, 'orchestra');
const STATE = path.join(DIR, 'stato.json');
const EVENTS = path.join(DIR, 'eventi.jsonl');
const CHAT = path.join(DIR, 'chat.jsonl');
const INBOX = path.join(DIR, 'coda.json');
const START = path.join(DIR, 'avvio.md');
const LONG = path.join(DIR, 'messaggio.md');
const QUADRO = path.join(REPO, 'docs', 'pipeline', 'quadro.md');
const OPTS = { ordine: ['claude', 'argon', 'gemini'], finestra: { claude: 200_000, argon: 1_000_000, gemini: 1_000_000 }, rotazione: 0.5, soglia: CONFIG.sogliaUnSolo, chat: 20, porta: 4242, ...CONFIG.orchestra };

const inboxFile = (stateDir = STATE_DIR) => path.join(stateDir, 'orchestra', 'coda.json');

/** Reads the shared queue of author messages waiting for the orchestrator (terminal and web UI). */
export function readInbox(stateDir = STATE_DIR) {
  const list = readJson(inboxFile(stateDir), []);
  return Array.isArray(list) ? list : [];
}

/** Puts a message or command (`/epoca`, `/agente <provider>`) into the shared orchestrator queue and wakes it. */
export function enqueueMessage(testo, stateDir = STATE_DIR) {
  const text = String(testo ?? '').trim();
  if (!text) return undefined;
  const file = inboxFile(stateDir);
  const list = readInbox(stateDir);
  const item = { id: randomUUID(), t: now(), testo: text };
  list.push(item);
  writeJson(file, list);
  bus.emit('messaggio', item);
  return item;
}

/** Removes delivered messages from the shared queue by id. */
export function dequeueMessages(ids, stateDir = STATE_DIR) {
  const remove = new Set(ids);
  const next = readInbox(stateDir).filter((m) => !remove.has(m.id));
  writeJson(inboxFile(stateDir), next);
  return next;
}

const rel = (p) => path.relative(REPO, p).split(path.sep).join('/');
const lines = (file) => { try { return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)); } catch { return []; } };
const append = (file, v) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.appendFileSync(file, JSON.stringify(v) + '\n'); };

// --- Pure parts (tested) -------------------------------------------------------------------------------------------

/** Lines of the diary that need the orchestrator (a launch does not; an outcome, a limit, a stop do). */
export const wakes = (line) => /ESITO|BROWSER|limite|interrott|non c'è più|integra |conflitti|errore|fallito|fermi/i.test(line);

/**
 * How full the orchestrator's context is after a turn, in tokens: Claude gives each model call of the turn
 * (`iterations`), the last one is the whole context; otherwise the turn's input over its calls.
 */
export function contextOf(json) {
  const it = Array.isArray(json?.iterations) ? json.iterations.at(-1) : undefined;
  const u = it ?? json?.usage ?? {};
  const input = (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? u.cache_read_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0);
  if (it) return input + (u.output_tokens ?? 0);
  const calls = Math.max(1, json?.num_turns ?? 1);
  return Math.round(input / calls);
}

/** The provider the orchestrator should run on: the first of `order` that is not stopped and above the threshold. */
export function pickOrchestrator(order, budget, threshold, at = new Date()) {
  const usable = (p) => {
    const b = budget[p];
    if (!b) return false;
    if (b.fermoFino && new Date(b.fermoFino) > at) return false;
    return (b.residuo ?? 100) >= threshold && (b.sessione ?? 100) >= threshold;
  };
  return order.find(usable);
}

/** What the orchestrator gets in a turn: the author's messages and the pipeline's events since the last one. */
export function composeTurn(messages, events) {
  const parts = [];
  if (events.length) parts.push(`[eventi della pipeline]\n${events.map((e) => `- ${e.testo}`).join('\n')}`);
  for (const m of messages) parts.push(`[autore] ${m}`);
  return parts.join('\n\n');
}

// --- The conversation ------------------------------------------------------------------------------------------------

const state = () => readJson(STATE, { provider: undefined, sessione: undefined, epoca: 0, contesto: 0, consegnati: 0 });
const saveState = (s) => writeJson(STATE, s);

function log(chi, testo, provider) {
  append(CHAT, { t: now(), chi, provider, testo });
}

/** The page a new epoch starts from. */
function startPage(s, reason) {
  const quadro = fs.existsSync(QUADRO) ? fs.readFileSync(QUADRO, 'utf8') : '(ancora nessun quadro: scrivilo tu)';
  const index = spawnSync(process.execPath, [path.join(REPO, 'tools', 'pipeline', 'pipeline.mjs'), 'indice'], { cwd: REPO, encoding: 'utf8' }).stdout;
  const chat = lines(CHAT).slice(-OPTS.chat).map((c) => `- ${c.t} ${c.chi}${c.provider ? ` (${c.provider})` : ''}: ${c.testo.length > 1500 ? `${c.testo.slice(0, 1500)}…` : c.testo}`);
  return [
    `# Avvio dell'epoca ${s.epoca} dell'orchestratore (${s.provider})`,
    '',
    `Motivo: ${reason}. Sei l'orchestratore della pipeline di QUINE42: segui \`docs/pipeline/orchestra.md\` (leggilo ora, e \`AGENTS.md\`).`,
    'Il processo che ti fa girare (`node tools/pipeline/pipeline.mjs orchestra`) ti porta i messaggi dell\'autore e gli eventi della pipeline;',
    'ciò che rispondi l\'autore lo legge nel terminale. Non fare lavoro sul codice: decidi e delega.',
    '',
    '## Il quadro (docs/pipeline/quadro.md, lo tieni tu)',
    '',
    quadro.trim(),
    '',
    '## Indice dei task (`node tools/pipeline/pipeline.mjs indice`)',
    '',
    '```',
    index.trim(),
    '```',
    '',
    '## Gli ultimi messaggi della chat',
    '',
    ...(chat.length ? chat : ['(nessuno)']),
    '',
  ].join('\n');
}

/** Runs one turn of the orchestrator on its CLI; never throws. */
function runTurn(provider, sessione, prompt) {
  const conf = CONFIG.providers[provider];
  const args = [...conf.args.filter((a) => a !== '--chrome'), ...(sessione ? conf.resume.map((a) => a.replace('{sessione}', sessione)) : []), '-p', prompt];
  return new Promise((resolve) => {
    let text = '';
    const child = spawn(conf.cmd, args, { cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    child.stdout.on('data', (d) => { text += d; });
    child.stderr.on('data', (d) => { text += d; });
    child.on('error', (e) => resolve({ code: -1, text: `${text}\n${e.message}` }));
    child.on('close', (code) => resolve({ code, text }));
  });
}

export async function orchestra({ agente, porta } = {}) {
  fs.mkdirSync(DIR, { recursive: true });
  const order = agente ? [agente, ...OPTS.ordine.filter((p) => p !== agente)] : OPTS.ordine;
  if (!CONFIG.providers[order[0]]) throw new Error(`agente sconosciuto: ${order[0]}`);
  let busy = false;
  let wanted; // a provider the author asked for (`/agente`)
  let rotate; // why the next turn starts a new epoch

  const print = (who, text) => process.stdout.write(`\n${who} ${text}\n> `);

  const queue = (testo, sveglia) => {
    const n = lines(EVENTS).length + 1;
    append(EVENTS, { n, t: now(), testo, sveglia });
    if (sveglia) void pump();
  };
  bus.on('diario', (line) => queue(line, wakes(line)));
  bus.on('messaggio', () => void pump());

  /** Starts a new epoch on `provider`: the next turn opens a new conversation from the start page. */
  const newEpoch = (s, provider, reason) => {
    Object.assign(s, { provider, sessione: undefined, epoca: s.epoca + 1, contesto: 0, motivo: reason });
    saveState(s);
    setOrchestrator(provider);
    say(`orchestratore: epoca ${s.epoca} su ${provider} (${reason})`);
  };

  /** Asks the orchestrator to bring the quadro up to date before its conversation ends (when it still can). */
  const closeEpoch = async (s, why) => {
    const r = await runTurn(s.provider, s.sessione, `[pipeline] ${why}: questa conversazione sta per finire. Aggiorna ora docs/pipeline/quadro.md (stato, decisioni, intenzioni, cosa aspetti) e rispondi solo «quadro aggiornato».`);
    const out = readOutput(r.text);
    if (out.result) log('orchestratore', out.result, s.provider);
  };

  async function pump() {
    if (busy) return;
    busy = true;
    try {
      for (;;) {
        // Commands (`/epoca`, `/agente <provider>`) written to the shared queue from the web UI or terminal.
        const rawInbox = readInbox(STATE_DIR);
        const cmdIds = [];
        for (const item of rawInbox) {
          if (item.testo === '/epoca') { rotate = 'chiesto dall\'autore'; cmdIds.push(item.id); }
          else if (item.testo.startsWith('/agente')) {
            const p = item.testo.split(/\s+/)[1];
            if (CONFIG.providers[p]) wanted = p;
            cmdIds.push(item.id);
          }
        }
        if (cmdIds.length) dequeueMessages(cmdIds, STATE_DIR);
        const queued = readInbox(STATE_DIR);

        const s = state();
        const budget = loadBudget();
        // Which provider: the author's choice; else the current one while it has credits; else the first of the order
        // that has (at a new epoch, the order's first again, when its credits are back).
        const best = pickOrchestrator(order, budget, OPTS.soglia);
        const stopped = s.provider && !pickOrchestrator([s.provider], budget, 0);
        const low = s.provider && !pickOrchestrator([s.provider], budget, OPTS.soglia);
        if (wanted) {
          if (wanted !== s.provider) {
            if (s.sessione) await closeEpoch(s, `l'autore passa l'orchestrazione a ${wanted}`);
            newEpoch(s, wanted, 'scelto dall\'autore');
          }
          wanted = undefined;
        } else if (!s.provider || stopped) {
          if (!best) { print('·', 'nessun provider ha crediti per orchestrare: riprovo tra un minuto'); break; }
          newEpoch(s, best, s.provider ? `${s.provider} senza crediti` : 'avvio');
        } else if (low && best && best !== s.provider) {
          if (s.sessione) await closeEpoch(s, `i crediti di ${s.provider} sono sotto il ${OPTS.soglia} %`);
          newEpoch(s, best, `${s.provider} sotto il ${OPTS.soglia} %`);
        } else if (!s.sessione && best && order.indexOf(best) < order.indexOf(s.provider)) {
          newEpoch(s, best, `${best} ha di nuovo crediti`);
        } else if (s.sessione && !queued.length && s.provider !== order[0] && pickOrchestrator([order[0]], budget, 3 * OPTS.soglia)) {
          // Back to the preferred provider, at a quiet moment, once its credits are well back.
          await closeEpoch(s, `${order[0]} ha di nuovo crediti`);
          newEpoch(s, order[0], `${order[0]} ha di nuovo crediti`);
        } else if (rotate && s.sessione) {
          await closeEpoch(s, rotate);
          newEpoch(s, s.provider, rotate);
          rotate = undefined;
        }

        const st = state();
        const events = lines(EVENTS).filter((e) => e.n > st.consegnati);
        const urgent = events.some((e) => e.sveglia);
        if (!queued.length && !urgent && st.sessione) break;
        const messages = queued.map((q) => q.testo);
        const body = composeTurn(messages, events) || '[pipeline] Nuova epoca: leggi la pagina di avvio e di\' all\'autore a che punto siamo.';
        let prompt;
        if (!st.sessione) {
          fs.writeFileSync(START, `${startPage(st, st.motivo ?? 'avvio')}\n## Da rispondere ora\n\n${body}\n`);
          prompt = `Sei l'orchestratore della pipeline di QUINE42. Leggi ${rel(START)} e segui ciò che dice.`;
        } else if (body.length > 6000) {
          fs.writeFileSync(LONG, `${body}\n`);
          prompt = `Leggi ${rel(LONG)} (messaggi ed eventi di questo turno) e rispondi.`;
        } else prompt = body;

        process.stdout.write(`\n· orchestratore (${st.provider}, epoca ${st.epoca}) al lavoro…\n`);
        const r = await runTurn(st.provider, st.sessione, prompt);
        const out = readOutput(r.text);
        const limit = usageLimit(out.error || r.code !== 0 ? r.text : '');
        if (limit) {
          // Its credits are over: the provider is stopped until it resets, the turn goes to the next one, whole.
          const b = readJson(BUDGET, {});
          b[st.provider] = { ...b[st.provider], fermoFino: limit.toISOString(), residuo: Math.min(b[st.provider]?.residuo ?? 100, OPTS.soglia - 1) };
          writeJson(BUDGET, b);
          say(`orchestratore: limite di ${st.provider} fino a ${limit.toISOString()}`);
          const s2 = state();
          s2.sessione = undefined;
          saveState(s2);
          continue;
        }
        if (r.code !== 0 && !out.result) {
          print('·', `l'orchestratore non ha risposto (codice ${r.code}): riprovo tra un minuto`);
          break;
        }
        let json = {};
        try { json = JSON.parse(r.text.trim().split('\n').reverse().find((l) => l.startsWith('{')) ?? '{}'); } catch { /* not JSON */ }
        const s3 = state();
        Object.assign(s3, { sessione: out.session ?? s3.sessione, contesto: contextOf(json), consegnati: events.at(-1)?.n ?? s3.consegnati });
        saveState(s3);
        for (const m of messages) log('autore', m);
        if (events.length) log('pipeline', events.map((e) => e.testo).join('\n'));
        log('orchestratore', out.result, s3.provider);
        dequeueMessages(queued.map((q) => q.id), STATE_DIR);
        print(`orchestratore (${s3.provider})>`, out.result);
        const window = OPTS.finestra[s3.provider] ?? 200_000;
        if (s3.contesto > OPTS.rotazione * window) rotate = `contesto a ${Math.round((100 * s3.contesto) / window)} % della finestra`;
      }
    } finally {
      busy = false;
    }
  }

  // The pipeline runs in this process; its diary lines become events.
  void execute({ always: true });
  setInterval(() => void pump(), 60_000);
  setInterval(() => { if (!busy && readInbox(STATE_DIR).length) void pump(); }, 2_000);

  if (porta !== false) {
    void import('./web.mjs').then((m) => m.startWebServer({
      port: porta ?? OPTS.porta ?? 4242,
      fallbackPort: porta === undefined,
      getLive: () => ({ busy, wanted, rotate }),
    }));
  }

  const s = state();
  console.log(`Orchestratore: ${s.provider ? `${s.provider}, epoca ${s.epoca}` : 'nuovo'} · scrivi un messaggio, oppure /stato /agente <provider> /epoca /esci`);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: '> ' });
  rl.prompt();
  rl.on('line', (raw) => {
    const line = raw.trim();
    if (!line) return rl.prompt();
    if (line === '/esci') {
      console.log('I task in corso continuano: al prossimo avvio li ritrovo.');
      process.exit(0);
    }
    if (line === '/stato') {
      console.log(spawnSync(process.execPath, [path.join(REPO, 'tools', 'pipeline', 'pipeline.mjs'), 'stato'], { cwd: REPO, encoding: 'utf8' }).stdout);
      return rl.prompt();
    }
    if (line.startsWith('/agente')) {
      const p = line.split(/\s+/)[1];
      if (!CONFIG.providers[p]) console.log(`provider: ${Object.keys(CONFIG.providers).join(', ')}`);
      else { wanted = p; void pump(); }
      return rl.prompt();
    }
    if (line === '/epoca') { rotate = 'chiesto dall\'autore'; void pump(); return rl.prompt(); }
    enqueueMessage(line, STATE_DIR);
  });
  void pump();
}
