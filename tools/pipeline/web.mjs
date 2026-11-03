// The web interface of the agentic pipeline (T69, ADR-0072, ADR-0079): a local server with no dependencies that reads
// and writes the same files and runs the same commands as `pipeline.mjs` and `orchestra.mjs`.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { markdownToHtml } from './markdown.mjs';
import {
  approveTasks,
  assignTask,
  canOrchestrate,
  dossierOf,
  integrateTask,
  interruptTasks,
  liveConversations,
  now,
  orchestrator,
  parseBacklog,
  pathsOf,
  plan,
  providerEnabled,
  readJson,
  refreshUsage,
  resumeProvider,
  resumeTasks,
  say,
  setBudgetManual,
  setOrchestrator,
  suspendProvider,
  traceOf,
  updateConfig,
  writeJson,
  writePlan,
} from './pipeline.mjs';
import { dequeueMessages, enqueueMessage, readInbox } from './orchestra.mjs';

const readText = (file, fallback = '') => { try { return fs.readFileSync(file, 'utf8'); } catch { return fallback; } };
const readJsonl = (file) => readText(file).split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return undefined; } }).filter(Boolean);

/**
 * Reads the `Stato: aperta|chiusa` line at the head of a question file: only the title and blank lines may precede it.
 * Returns undefined when there is none, so a line further down, quoted in the text, decides nothing.
 */
function questionState(text) {
  for (const line of text.split('\n')) {
    const l = line.trim();
    if (!l || l.startsWith('# ')) continue;
    return /^(?:\*\*)?Stato:(?:\*\*)?\s*(aperta|chiusa)\b/i.exec(l)?.[1].toLowerCase();
  }
  return undefined;
}

/** What is left of an answer without the bold markers of `**Risposta:**`: bare `**` is no answer. */
const answerText = (raw) => raw.trim().replace(/^\*\*\s*|\s*\*\*$/g, '').trim();

/**
 * Parses a question file (`docs/pipeline/domande/Txx.md`) into structured questions and whether it is settled.
 * The `Stato:` line, when present, decides `answered`. Without it the answers do: numbered questions
 * (`1. **...**\n   Risposta: ...`), section questions (`## Domanda ... ## Risposta`) or, in free form,
 * every `Risposta:` line. An answer stays on its own line.
 */
export function parseQuestionFile(id, text) {
  const items = [];
  const numbered = [...text.matchAll(/^(\d+)\.\s+([\s\S]*?)(?=^\d+\.\s+|(?![\s\S]))/gm)];
  if (numbered.length && /Risposta:/i.test(text)) {
    for (const m of numbered) {
      const num = Number(m[1]);
      const body = m[2];
      const rm = /(?:^|\n)[ \t]*(?:\*\*)?Risposta:[ \t]*(.*)$/im.exec(body);
      const qText = (rm ? body.slice(0, rm.index) : body).trim().replace(/\s+/g, ' ');
      const ans = answerText(rm ? rm[1] : '');
      items.push({ numero: num, domanda: qText, risposta: ans });
    }
  } else if (/^##\s+Domand[ae]/im.test(text)) {
    const qm = /^##\s+Domand[ae][^\n]*\n([\s\S]*?)(?=^##\s+|(?![\s\S]))/im.exec(text);
    const rm = /^##\s+Rispost[ae][^\n]*\n([\s\S]*?)(?=^##\s+|(?![\s\S]))/im.exec(text);
    const ans = (rm ? rm[1] : '').trim();
    items.push({
      numero: 1,
      domanda: (qm ? qm[1] : text).trim().replace(/\s+/g, ' '),
      risposta: answerText(ans) ? ans : '',
    });
  }
  const stato = questionState(text);
  const answered = stato ? stato === 'chiusa' : items.length > 0 ? items.every((i) => i.risposta.length > 0) : freeFormAnswered(text);
  return { id, items, answered, stato };
}

/** A file with neither numbered nor section questions: every `Risposta:` line is filled in, or a `## Risposta` section is. */
function freeFormAnswered(text) {
  const lines = [...text.matchAll(/Risposta(?:\*\*)?:(.*)$/gim)];
  if (lines.length && lines.every((m) => answerText(m[1]))) return true;
  const section = /^##\s+Rispost[ae][^\n]*\n([\s\S]*?)(?=^##\s+|(?![\s\S]))/im.exec(text);
  return Boolean(section && answerText(section[1]));
}

/** Applies an object or array of answers (`{ 1: '...', 2: '...' }`) to a `domande/Txx.md` markdown string. */
export function applyAnswersToMarkdown(text, risposte = {}) {
  if (!risposte || typeof risposte !== 'object') return text;
  if (/^##\s+Domand[ae]/im.test(text) && !/^\d+\.\s+/m.test(text)) {
    const ans = String(risposte[1] ?? risposte['1'] ?? Object.values(risposte)[0] ?? '').trim();
    if (/^##\s+Rispost[ae][^\n]*$/im.test(text)) {
      return text.replace(/(^##\s+Rispost[ae][^\n]*\n?)[\s\S]*$/im, `$1${ans}\n`);
    }
    return `${text.trimEnd()}\n\n## Risposta\n${ans}\n`;
  }
  const lines = text.split('\n');
  let currentNum = 0;
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nm = /^(\d+)\.\s+/.exec(line);
    if (nm) currentNum = Number(nm[1]);
    const label = /^[ \t]*(?:\*\*)?Risposta:(?:\*\*)?/i.exec(line)?.[0];
    if (currentNum && label && (risposte[currentNum] !== undefined || risposte[String(currentNum)] !== undefined)) {
      const val = String(risposte[currentNum] ?? risposte[String(currentNum)] ?? '').trim();
      out.push(`${label} ${val}`);
    } else {
      out.push(line);
    }
  }
  return out.join('\n');
}

/** Appends a structured author request under `# Modifiche da fare` in `docs/userchats/to-do.md`. */
export function appendTodoRequest(text, { titolo, testo, provider, priorita, dipende }) {
  const title = String(titolo ?? '').trim();
  const body = String(testo ?? '').trim();
  if (!title && !body) return text;
  const block = [];
  if (title) block.push(`## ${title}`);
  const meta = [];
  if (provider && provider !== 'nessuno') meta.push(`> Provider proposto: ${provider}`);
  if (priorita !== undefined && priorita !== '') meta.push(`> Priorità: ${priorita}`);
  if (dipende && String(dipende).trim()) meta.push(`> Dipende da: ${String(dipende).trim()}`);
  if (meta.length) block.push(meta.join('\n'));
  if (body) block.push(body);
  const entry = `\n${block.join('\n\n')}\n`;
  if (/# Modifiche da fare/i.test(text)) {
    return `${text.trimEnd()}\n${entry}`;
  }
  return `${text.trimEnd()}\n\n# Modifiche da fare\n${entry}`;
}

/** Builds the complete live state of the pipeline from the files on disk. */
export function buildStateSnapshot(opts = {}) {
  const p = pathsOf(opts);
  const backlogText = readText(p.backlog);
  const rawTasks = parseBacklog(backlogText);
  const runs = readJson(p.runs, {});
  const budget = readJson(p.budget, {});
  for (const prov of Object.keys(p.config.providers)) {
    budget[prov] ??= { residuo: 100, aggiornato: now() };
  }
  const queues = plan(rawTasks, runs, budget);
  const queueMap = new Map();
  for (const [qName, list] of Object.entries(queues)) {
    for (const item of list) queueMap.set(item.id, qName);
  }
  const tasks = rawTasks.map((t) => ({
    ...t,
    coda: queueMap.get(t.id) ?? (t.status.startsWith('fatto') ? 'fatto' : 'altro'),
    esecuzione: runs[t.id] ?? undefined,
    missing: queues.bloccati.find((b) => b.id === t.id)?.missing,
  }));

  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const domandeFiles = fs.existsSync(p.domande)
    ? fs.readdirSync(p.domande).filter((f) => /^T\d+[a-z]?\.md$/i.test(f)).sort()
    : [];
  const domande = domandeFiles.map((file) => {
    const id = file.replace(/\.md$/i, '');
    const content = readText(path.join(p.domande, file));
    const parsed = parseQuestionFile(id, content);
    const task = taskById.get(id) ?? tasks.find((t) => t.parent === id);
    return {
      id,
      file: `docs/pipeline/domande/${file}`,
      content,
      items: parsed.items,
      answered: parsed.answered,
      stato: parsed.stato,
      taskTitle: task?.title ?? id,
      taskStatus: task?.status ?? '—',
    };
  }).sort((a, b) => Number(a.answered) - Number(b.answered)); // open ones first, by file name within each group

  const orchState = readJson(path.join(p.stateDir, 'orchestra', 'stato.json'), {
    provider: undefined,
    sessione: undefined,
    epoca: 0,
    contesto: 0,
    consegnati: 0,
  });
  const live = opts.getLive?.() ?? {};
  const activeOrch = orchestrator(opts);
  const windowTokens = p.config.orchestra?.finestra?.[orchState.provider ?? activeOrch] ?? 200_000;

  const others = new Map();
  for (const b of Object.values(budget)) for (const c of b.tutti ?? []) others.set(`${c.nome} (${c.finestra})`, c);
  for (const b of Object.values(budget)) for (const c of b.contatori ?? []) others.delete(`${c.nome} (${c.finestra})`);

  const reportLines = readText(p.report).split('\n').filter((l) => l.startsWith('- [')).map((l) => l.slice(2));

  return {
    adesso: now(),
    orchestratore: {
      provider: activeOrch,
      stato: orchState,
      finestra: windowTokens,
      percentualeContesto: Math.round((100 * (orchState.contesto ?? 0)) / windowTokens),
      inCoda: readInbox(p.stateDir),
      alLavoro: Boolean(live.busy),
      wanted: live.wanted,
      rotate: live.rotate,
    },
    config: {
      providers: Object.keys(p.config.providers),
      sogliaUnSolo: p.config.sogliaUnSolo,
      riserva: p.config.riserva,
      maxParalleli: p.config.maxParalleli,
      limiti: p.config.limiti ?? {},
      approvazione: p.config.approvazione,
      ordine: p.config.orchestra?.ordine ?? ['claude', 'argon', 'gemini'],
      abbonamenti: p.config.abbonamenti ?? {},
      piani: Object.fromEntries(Object.entries(p.config.piani ?? {}).map(([sub, list]) => [sub, Object.keys(list)])),
      abilitati: Object.keys(p.config.providers).filter((k) => providerEnabled(k, p.config)),
      permessoOrchestrare: Object.fromEntries(Object.entries(p.config.providers).map(([k, c]) => [k, c.orchestrabile !== false])),
      orchestrabili: Object.keys(p.config.providers).filter((k) => canOrchestrate(k, p.config)),
    },
    budget,
    contatoriNonUsati: [...others.values()],
    code: queues,
    tasks,
    chat: readJsonl(path.join(p.stateDir, 'orchestra', 'chat.jsonl')).slice(-80),
    eventi: readJsonl(path.join(p.stateDir, 'orchestra', 'eventi.jsonl')).slice(-100),
    diario: reportLines.slice(-80),
    quadro: readText(p.quadro),
    consumi: readJsonl(p.history),
    domande,
    domandeAperte: domande.filter((d) => !d.answered).length,
    todo: readText(p.todo),
  };
}

const syncPlanFile = (opts) => {
  const p = pathsOf(opts);
  const tasks = parseBacklog(readText(p.backlog));
  const runs = readJson(p.runs, {});
  const budget = readJson(p.budget, {});
  const queues = plan(tasks, runs, budget);
  writePlan(queues, budget, opts);
  return queues;
};

/**
 * Pure API dispatcher (`GET`/`POST` routes for the web interface): every action runs the pipeline's own functions on
 * the repository's files. Exported so Vitest can test all routes directly without a browser.
 */
export function handleApi(method, rawUrl, body = {}, opts = {}) {
  const p = pathsOf(opts);
  const url = new URL(rawUrl, 'http://localhost');
  const pathname = url.pathname;

  try {
    if (method === 'GET' && pathname === '/api/stato') {
      return { status: 200, data: buildStateSnapshot(opts) };
    }

    const taskMatch = /^\/api\/task\/(T\d+[a-z]?)$/i.exec(pathname);
    if (method === 'GET' && taskMatch) {
      const id = taskMatch[1];
      const dossier = dossierOf(id, opts);
      const traccia = traceOf(id, opts);
      const qFile = path.join(p.domande, `${id}.md`);
      const qParent = path.join(p.domande, `${id.replace(/[a-z]$/i, '')}.md`);
      const domandePath = fs.existsSync(qFile) ? qFile : fs.existsSync(qParent) ? qParent : undefined;
      const domandeContent = domandePath ? readText(domandePath) : undefined;
      return {
        status: 200,
        data: {
          id,
          dossier,
          traccia: traccia ?? null,
          domande: domandeContent ? parseQuestionFile(id, domandeContent) : null,
          domandeMarkdown: domandeContent ?? null,
        },
      };
    }

    if (method === 'GET' && pathname === '/api/conversazioni') {
      return { status: 200, data: liveConversations(opts) };
    }

    if (method === 'POST' && pathname === '/api/chat') {
      const testo = String(body?.testo ?? '').trim();
      if (!testo) return { status: 400, data: { error: 'Messaggio vuoto' } };
      if (testo === '/stato') {
        syncPlanFile(opts);
        return { status: 200, data: { ok: true, inCoda: readInbox(p.stateDir) } };
      }
      if (testo.startsWith('/sospendi ')) {
        const parts = testo.split(/\s+/).slice(1);
        const prov = parts[0];
        const dateStr = parts.slice(1).join(' ').trim().replace(/^fino\s+a\s+/i, '').replace(/^fino\s+/i, '').trim() || undefined;
        if (p.config.providers?.[prov]) {
          try {
            suspendProvider(prov, dateStr, opts);
            syncPlanFile(opts);
            return { status: 200, data: { ok: true, inCoda: readInbox(p.stateDir) } };
          } catch (e) {
            return { status: 400, data: { error: e.message } };
          }
        }
      }
      if (testo.startsWith('/riattiva ')) {
        const prov = testo.split(/\s+/)[1];
        if (p.config.providers?.[prov]) {
          try {
            resumeProvider(prov, opts);
            syncPlanFile(opts);
            return { status: 200, data: { ok: true, inCoda: readInbox(p.stateDir) } };
          } catch (e) {
            return { status: 400, data: { error: e.message } };
          }
        }
      }
      if (testo.startsWith('/nota ')) {
        say(`nota: ${testo.slice(6).trim()}`, p.report);
        return { status: 200, data: { ok: true, inCoda: readInbox(p.stateDir) } };
      }
      const item = enqueueMessage(testo, p.stateDir);
      return { status: 200, data: { ok: true, item, inCoda: readInbox(p.stateDir) } };
    }

    if (method === 'POST' && pathname === '/api/approva') {
      const rawIds = Array.isArray(body?.ids) ? body.ids : body?.id ? [body.id] : [];
      const ids = rawIds.map((x) => String(x).trim()).filter(Boolean);
      if (!ids.length) return { status: 400, data: { error: 'Nessun task specificato' } };
      approveTasks(ids, opts);
      syncPlanFile(opts);
      return { status: 200, data: { ok: true, approvati: ids } };
    }

    if (method === 'POST' && pathname === '/api/assegna') {
      const { id, provider, stima, priorita, approva } = body ?? {};
      if (!id) return { status: 400, data: { error: 'Manca id del task' } };
      const res = assignTask(String(id).trim(), { provider, stima, priorita, approva }, opts);
      syncPlanFile(opts);
      return { status: 200, data: { ok: true, ...res } };
    }

    if (method === 'POST' && pathname === '/api/interrompi') {
      const ids = body?.tutti ? ['--tutti'] : Array.isArray(body?.ids) ? body.ids : body?.id ? [body.id] : [];
      if (!ids.length) return { status: 400, data: { error: 'Nessun task specificato' } };
      const interrotti = interruptTasks(ids, opts);
      syncPlanFile(opts);
      return { status: 200, data: { ok: true, interrotti } };
    }

    if (method === 'POST' && pathname === '/api/riprendi') {
      const ids = Array.isArray(body?.ids) ? body.ids : body?.id ? [body.id] : [];
      if (!ids.length) return { status: 400, data: { error: 'Nessun task specificato' } };
      const ripresi = resumeTasks(ids, opts);
      syncPlanFile(opts);
      return { status: 200, data: { ok: true, ripresi } };
    }

    if (method === 'POST' && pathname === '/api/integra') {
      const id = String(body?.id ?? '').trim();
      if (!id) return { status: 400, data: { error: 'Manca id del task' } };
      const res = integrateTask(id, opts);
      syncPlanFile(opts);
      return { status: res.ok ? 200 : 409, data: res };
    }

    const domMatch = /^\/api\/domande\/(T\d+[a-z]?)$/i.exec(pathname);
    if (method === 'POST' && domMatch) {
      const id = domMatch[1];
      const file = path.join(p.domande, `${id}.md`);
      fs.mkdirSync(p.domande, { recursive: true });
      let nextContent;
      if (body?.risposte && typeof body.risposte === 'object') {
        const base = typeof body?.content === 'string' ? body.content : readText(file, `# ${id} — domande\n`);
        nextContent = applyAnswersToMarkdown(base, body.risposte);
      } else if (typeof body?.content === 'string') {
        nextContent = body.content;
      } else {
        return { status: 400, data: { error: 'Contenuto o risposte mancanti' } };
      }
      fs.writeFileSync(file, nextContent.endsWith('\n') ? nextContent : `${nextContent}\n`);
      if (body?.avvisa) {
        enqueueMessage(`Ho risposto alle domande di ${id} in docs/pipeline/domande/${id}.md.`, p.stateDir);
      }
      return { status: 200, data: { ok: true, id, parsed: parseQuestionFile(id, nextContent) } };
    }

    if (method === 'POST' && pathname === '/api/todo') {
      fs.mkdirSync(path.dirname(p.todo), { recursive: true });
      let nextTodo;
      if (typeof body?.content === 'string') {
        nextTodo = body.content;
      } else if (body?.aggiungi && typeof body.aggiungi === 'object') {
        const current = readText(p.todo, '# Modifiche da fare\n');
        nextTodo = appendTodoRequest(current, body.aggiungi);
      } else {
        return { status: 400, data: { error: 'Contenuto mancante' } };
      }
      fs.writeFileSync(p.todo, nextTodo.endsWith('\n') ? nextTodo : `${nextTodo}\n`);
      if (body?.avvisa) {
        enqueueMessage('Ho aggiornato docs/userchats/to-do.md con nuove richieste da pianificare.', p.stateDir);
      }
      return { status: 200, data: { ok: true, todo: fs.readFileSync(p.todo, 'utf8') } };
    }

    if (method === 'POST' && pathname === '/api/budget') {
      if (body?.uso) {
        const b = refreshUsage(opts);
        syncPlanFile(opts);
        return { status: 200, data: { ok: true, budget: b } };
      }
      const { provider, residuo } = body ?? {};
      if (!p.config.providers[provider] || Number.isNaN(Number(residuo))) {
        return { status: 400, data: { error: 'Provider o residuo non valido' } };
      }
      const b = setBudgetManual(provider, Number(residuo), opts);
      syncPlanFile(opts);
      return { status: 200, data: { ok: true, budget: b } };
    }

    if (method === 'POST' && pathname === '/api/config') {
      const res = updateConfig({ abbonamenti: body?.abbonamenti, orchestrabile: body?.orchestrabile }, opts);
      say(`configurazione: ${JSON.stringify({ abbonamenti: body?.abbonamenti, orchestrabile: body?.orchestrabile })}`, p.report);
      syncPlanFile(opts);
      return { status: 200, data: { ok: true, ...res } };
    }

    if (method === 'POST' && pathname === '/api/orchestratore') {
      if (body?.epoca) {
        enqueueMessage('/epoca', p.stateDir);
        return { status: 200, data: { ok: true } };
      }
      if (body?.nota) {
        say(`nota: ${String(body.nota).trim()}`, p.report);
        return { status: 200, data: { ok: true } };
      }
      if (body?.rimuoviCoda) {
        dequeueMessages([String(body.rimuoviCoda)], p.stateDir);
        return { status: 200, data: { ok: true, inCoda: readInbox(p.stateDir) } };
      }
      const provider = String(body?.provider ?? '').trim();
      if (!p.config.providers[provider]) {
        return { status: 400, data: { error: `Provider sconosciuto: ${provider}` } };
      }
      if (!canOrchestrate(provider, p.config)) {
        return { status: 400, data: { error: `${provider} non può orchestrare` } };
      }
      setOrchestrator(provider, opts);
      say(`orchestratore: ${provider}`, p.report);
      enqueueMessage(`/agente ${provider}`, p.stateDir);
      syncPlanFile(opts);
      return { status: 200, data: { ok: true, provider } };
    }

    return { status: 404, data: { error: `Percorso non trovato: ${method} ${pathname}` } };
  } catch (e) {
    return { status: 400, data: { error: String(e?.message ?? e) } };
  }
}

/** Single-page HTML interface for the pipeline. */
export function renderHtml() {
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>QUINE42 · Pipeline Agentica</title>
  <style>
    :root {
      --bg: #0b0e14;
      --bg-panel: #121722;
      --bg-card: #181f2e;
      --bg-hover: #1f293d;
      --border: #263248;
      --text: #e6edf3;
      --muted: #8b9bb4;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.18);
      --green: #34d399;
      --amber: #fbbf24;
      --red: #f87171;
      --purple: #a78bfa;
      --claude: #f97316;
      --argon: #38bdf8;
      --gemini: #34d399;
      --font: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --mono: "JetBrains Mono", "Fira Code", Consolas, monospace;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: var(--font);
      font-size: 14px;
      line-height: 1.45;
    }
    header.topbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 18px;
      background: var(--bg-panel);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 20;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      font-size: 16px;
      letter-spacing: 0.4px;
    }
    .brand .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 10px var(--accent);
    }
    .orch-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 13px;
    }
    .nav-tabs {
      display: flex;
      gap: 6px;
    }
    .tab-btn {
      background: var(--bg-card);
      color: var(--muted);
      border: 1px solid var(--border);
      padding: 7px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.15s;
    }
    .tab-btn:hover { color: var(--text); background: var(--bg-hover); }
    .tab-btn.active {
      color: #061018;
      background: var(--accent);
      border-color: var(--accent);
    }
    button, .btn {
      background: var(--bg-card);
      color: var(--text);
      border: 1px solid var(--border);
      padding: 5px 10px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
    }
    button:hover { background: var(--bg-hover); border-color: var(--accent); }
    button.primary { background: var(--accent); color: #05101a; border-color: var(--accent); }
    button.primary:hover { filter: brightness(1.1); }
    button.success { background: rgba(52, 211, 153, 0.18); color: var(--green); border-color: var(--green); }
    button.warn { background: rgba(251, 191, 36, 0.18); color: var(--amber); border-color: var(--amber); }
    button.danger { background: rgba(248, 113, 113, 0.18); color: var(--red); border-color: var(--red); }
    input, select, textarea {
      background: var(--bg);
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 5px;
      padding: 6px 9px;
      font-family: inherit;
      font-size: 13px;
    }
    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: var(--accent);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 7px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      border: 1px solid transparent;
    }
    .prov-claude { background: rgba(249, 115, 22, 0.16); color: #fb923c; border-color: rgba(249, 115, 22, 0.4); }
    .prov-argon { background: rgba(56, 189, 248, 0.16); color: #38bdf8; border-color: rgba(56, 189, 248, 0.4); }
    .prov-gemini { background: rgba(52, 211, 153, 0.16); color: #34d399; border-color: rgba(52, 211, 153, 0.4); }
    .st-fatto { background: rgba(52, 211, 153, 0.14); color: var(--green); }
    .st-incorso { background: rgba(56, 189, 248, 0.18); color: var(--accent); }
    .st-attesa { background: rgba(251, 191, 36, 0.18); color: var(--amber); }
    .st-dafare { background: rgba(139, 155, 180, 0.15); color: var(--muted); }
    .st-errore { background: rgba(248, 113, 113, 0.18); color: var(--red); }

    main { padding: 14px 18px; }
    .view { display: none; }
    .view.active { display: block; }

    /* Lavagne & Chat layout */
    .workspace-grid {
      display: grid;
      grid-template-columns: 390px 1fr;
      gap: 16px;
      align-items: start;
    }
    @media (max-width: 1180px) {
      .workspace-grid { grid-template-columns: 1fr; }
    }
    .panel {
      background: var(--bg-panel);
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
    }
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      font-weight: 700;
    }
    .sub-tabs {
      display: flex;
      gap: 4px;
    }
    .sub-tab {
      background: transparent;
      border: none;
      color: var(--muted);
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .sub-tab.active { background: var(--bg-card); color: var(--accent); }
    .chat-list {
      height: 430px;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .msg {
      padding: 8px 11px;
      border-radius: 8px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      font-size: 13px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .msg.autore { border-left: 3px solid var(--accent); }
    .msg.orchestratore { border-left: 3px solid var(--green); }
    .msg.pipeline { border-left: 3px solid var(--purple); font-family: var(--mono); font-size: 12px; }
    .msg.incoda { border-left: 3px dashed var(--amber); background: rgba(251, 191, 36, 0.07); }
    .msg-meta {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--muted);
      margin-bottom: 4px;
    }
    .chat-form {
      padding: 10px 12px;
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .chat-form textarea {
      width: 100%;
      min-height: 62px;
      resize: vertical;
    }
    .chat-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    /* Trello Boards */
    .boards-wrap {
      display: grid;
      grid-template-columns: repeat(6, minmax(235px, 1fr));
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 8px;
    }
    .board-col {
      background: var(--bg-panel);
      border: 1px solid var(--border);
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 125px);
    }
    .board-col-header {
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
      font-weight: 700;
      font-size: 13px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .board-cards {
      padding: 10px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 9px;
    }
    .task-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: border-color 0.15s;
    }
    .task-card:hover { border-color: var(--accent); }
    .task-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 6px;
    }
    .task-id {
      font-family: var(--mono);
      font-weight: 700;
      color: var(--accent);
      cursor: pointer;
      text-decoration: none;
    }
    .task-id:hover { text-decoration: underline; }
    .task-title {
      font-weight: 600;
      font-size: 13px;
      color: var(--text);
      cursor: pointer;
    }
    .task-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      font-size: 11px;
      color: var(--muted);
    }
    .task-card-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 4px;
    }

    /* Table View */
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 12px;
      align-items: center;
      background: var(--bg-panel);
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid var(--border);
    }
    .table-wrap {
      background: var(--bg-panel);
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th, td {
      padding: 9px 12px;
      border-bottom: 1px solid var(--border);
      text-align: left;
      vertical-align: middle;
    }
    th {
      background: var(--bg-card);
      color: var(--muted);
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    tr:hover td { background: rgba(255, 255, 255, 0.02); }

    /* Domande & To-Do */
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      align-items: start;
    }
    @media (max-width: 1024px) {
      .two-col { grid-template-columns: 1fr; }
    }
    .q-item {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 10px;
    }
    .q-item label {
      display: block;
      font-size: 12px;
      color: var(--muted);
      margin-bottom: 6px;
    }

    /* Consumi & Budget */
    .budget-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 14px;
      margin-bottom: 18px;
    }
    .budget-card {
      background: var(--bg-panel);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px;
    }
    .progress-bar {
      width: 100%;
      height: 8px;
      background: var(--bg);
      border-radius: 999px;
      overflow: hidden;
      margin: 5px 0 10px;
      border: 1px solid var(--border);
    }
    .progress-fill {
      height: 100%;
      background: var(--green);
      transition: width 0.25s;
    }

    /* Modal / Drawer for Task Detail */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(5, 8, 14, 0.76);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 50;
      padding: 20px;
    }
    .modal-backdrop.open { display: flex; }
    .modal {
      background: var(--bg-panel);
      border: 1px solid var(--border);
      border-radius: 12px;
      width: min(1120px, 96vw);
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
    }
    .modal-header {
      padding: 14px 18px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      background: var(--bg-card);
    }
    .modal-toolbar {
      padding: 10px 18px;
      border-bottom: 1px solid var(--border);
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
      background: rgba(24, 31, 46, 0.5);
    }
    .modal-body {
      padding: 16px 18px;
      overflow-y: auto;
      flex: 1;
    }
    pre.code-block {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      font-family: var(--mono);
      font-size: 12px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
    }
    .md { white-space: normal; line-height: 1.5; overflow-wrap: anywhere; }
    .md > :first-child { margin-top: 0; }
    .md > :last-child { margin-bottom: 0; }
    .md p, .md ul, .md ol, .md blockquote, .md pre, .md table { margin: 0 0 8px; }
    .md h1, .md h2, .md h3, .md h4, .md h5, .md h6 { margin: 14px 0 6px; line-height: 1.25; }
    .md h1 { font-size: 19px; }
    .md h2 { font-size: 16px; }
    .md h3 { font-size: 14px; }
    .md h4, .md h5, .md h6 { font-size: 13px; color: var(--muted); }
    .md ul, .md ol { padding-left: 20px; }
    .md li { margin: 2px 0; }
    .md a { color: var(--accent); }
    .md hr { border: 0; border-top: 1px solid var(--border); margin: 10px 0; }
    .md blockquote { border-left: 3px solid var(--border); padding-left: 10px; color: var(--muted); }
    .md code { font-family: var(--mono); font-size: 0.92em; background: var(--bg); border: 1px solid var(--border); border-radius: 4px; padding: 0 4px; }
    .md pre { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px; overflow-x: auto; white-space: pre; }
    .md pre code { background: none; border: 0; padding: 0; }
    .md table { border-collapse: collapse; display: block; overflow-x: auto; }
    .md th, .md td { border: 1px solid var(--border); padding: 3px 8px; text-align: left; vertical-align: top; }
    .md-source { white-space: pre-wrap; word-break: break-word; font-family: var(--mono); font-size: 12px; }
    .md-doc { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 12px; font-size: 13px; }
    #btn-md-source.active { color: var(--accent); border-color: var(--accent); }
    .prov-fable { background: rgba(167, 139, 250, 0.16); color: #c4b5fd; border-color: rgba(167, 139, 250, 0.4); }
    .conv-step {
      padding: 9px 12px;
      border-radius: 8px;
      margin-bottom: 8px;
      border: 1px solid var(--border);
      background: var(--bg-card);
      font-size: 13px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .conv-step.utente { border-left: 3px solid var(--accent); }
    .conv-step.pensiero { border-left: 3px solid var(--purple); color: var(--muted); font-size: 12px; }
    .conv-step.strumento { border-left: 3px solid var(--amber); font-family: var(--mono); font-size: 12px; padding: 6px 10px; }
    .conv-step.agente { border-left: 3px solid var(--green); }
    .toast {
      position: fixed;
      bottom: 18px;
      right: 18px;
      background: var(--bg-card);
      border: 1px solid var(--accent);
      color: var(--text);
      padding: 10px 16px;
      border-radius: 8px;
      z-index: 100;
      display: none;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="brand">
      <span class="dot"></span>
      <span>QUINE42 · Pipeline Agentica</span>
    </div>

    <div class="orch-bar" id="orch-bar">
      <span>Orchestratore: <strong id="orch-prov">—</strong></span>
      <span id="orch-epoca" class="badge st-dafare">epoca 0</span>
      <span id="orch-ctx" class="badge st-dafare">contesto 0%</span>
      <span id="orch-status" class="badge st-fatto">In ascolto</span>
      <select id="orch-switch" title="Cambia provider dell'orchestratore (/agente)">
        <option value="">Passa a…</option>
      </select>
      <button id="btn-new-epoch" title="Ruota epoca (/epoca)">Nuova epoca</button>
    </div>

    <div class="nav-tabs">
      <button class="tab-btn active" data-view="lavagne">Lavagne &amp; Chat</button>
      <button class="tab-btn" data-view="tabella">Tabella Task (<span id="count-all">0</span>)</button>
      <button class="tab-btn" data-view="domande">Domande &amp; To-Do (<span id="count-domande">0</span>)</button>
      <button class="tab-btn" data-view="consumi">Consumo &amp; Budget</button>
      <button class="tab-btn" data-view="conversazioni">Conversazioni in corso (<span id="count-conv">0</span>)</button>
      <button id="btn-md-source" aria-pressed="false" title="Mostra il testo Markdown com'è scritto, e permette di modificare to-do e domande">&lt;/&gt; Sorgente</button>
      <button id="btn-refresh" title="Ricarica stato adesso">↻ Aggiorna</button>
    </div>
  </header>

  <main>
    <!-- VISTA 1: LAVAGNE & CHAT -->
    <section id="view-lavagne" class="view active">
      <div class="workspace-grid">
        <!-- Colonna sinistra: Chat con l'Orchestratore, Eventi e Quadro -->
        <div class="panel">
          <div class="panel-header">
            <span>Orchestratore &amp; Diario</span>
            <div class="sub-tabs">
              <button class="sub-tab active" data-panel="chat">Chat</button>
              <button class="sub-tab" data-panel="eventi">Eventi (<span id="count-eventi">0</span>)</button>
              <button class="sub-tab" data-panel="quadro">Il Quadro</button>
            </div>
          </div>

          <div id="subpanel-chat">
            <div class="chat-list" id="chat-list"></div>
            <form class="chat-form" id="chat-form">
              <textarea id="chat-input" placeholder="Scrivi all'orchestratore (stessa coda del terminale)… Invio o Ctrl+Invio"></textarea>
              <div class="chat-actions">
                <div style="display:flex; gap:5px;">
                  <button type="button" id="btn-quick-stato" title="Rigenera PIANO.md">/stato</button>
                  <button type="button" id="btn-quick-epoca" title="Nuova epoca">/epoca</button>
                  <button type="button" id="btn-quick-nota" title="Aggiungi una nota al diario">+ Nota</button>
                </div>
                <button type="submit" class="primary">Invia all'orchestratore</button>
              </div>
            </form>
          </div>

          <div id="subpanel-eventi" style="display:none;">
            <div class="chat-list" id="events-list" style="height:540px;"></div>
          </div>

          <div id="subpanel-quadro" style="display:none; padding:12px;">
            <div class="md-doc" id="quadro-text" style="max-height:520px; overflow-y:auto;"></div>
          </div>
        </div>

        <!-- Colonna destra: Lavagne tipo Trello con le code di PIANO.md -->
        <div class="boards-wrap" id="boards-wrap"></div>
      </div>
    </section>

    <!-- VISTA 2: TABELLA DI TUTTI I TASK -->
    <section id="view-tabella" class="view">
      <div class="filter-bar">
        <input type="search" id="filter-search" placeholder="Cerca per ID (es. T69) o titolo…" style="min-width:240px;" />
        <label>Stato:
          <select id="filter-status">
            <option value="">Tutti</option>
            <option value="da fare">da fare</option>
            <option value="in corso">in corso</option>
            <option value="in attesa">in attesa</option>
            <option value="fatto">fatto</option>
          </select>
        </label>
        <label>Provider:
          <select id="filter-provider">
            <option value="">Tutti</option>
            <option value="claude">claude</option>
            <option value="fable">fable</option>
            <option value="argon">argon</option>
            <option value="gemini">gemini</option>
          </select>
        </label>
        <label>Coda:
          <select id="filter-queue">
            <option value="">Tutte</option>
            <option value="inCorso">In corso</option>
            <option value="daIntegrare">Da integrare</option>
            <option value="pronti">Pronti</option>
            <option value="daApprovare">Da approvare</option>
            <option value="daStimare">Da stimare</option>
            <option value="bloccati">Bloccati</option>
            <option value="inAttesa">In attesa</option>
            <option value="fatto">Fatto</option>
          </select>
        </label>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Titolo</th>
              <th>Stato</th>
              <th>Coda</th>
              <th>Provider</th>
              <th>Stima</th>
              <th>Priorità</th>
              <th>Approvato</th>
              <th>Dipendenze</th>
              <th>Esecuzione</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody id="tasks-tbody"></tbody>
        </table>
      </div>
    </section>

    <!-- VISTA 3: DOMANDE & TO-DO -->
    <section id="view-domande" class="view">
      <div class="two-col">
        <!-- Domande per l'autore -->
        <div class="panel">
          <div class="panel-header">
            <span>Domande per l'autore (<code>docs/pipeline/domande/*.md</code>)</span>
            <select id="domande-select"></select>
          </div>
          <div style="padding:14px;">
            <div id="domande-structured"></div>
            <label style="display:block; font-size:12px; color:var(--muted); margin:10px 0 4px;">File Markdown (<code>docs/pipeline/domande/<span id="domande-filename">…</span></code>):</label>
            <div class="md-doc" id="domande-preview" title="Per modificare il file: Sorgente"></div>
            <textarea id="domande-editor" style="width:100%; min-height:240px; font-family:var(--mono);"></textarea>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
              <label style="font-size:12px; color:var(--muted);">
                <input type="checkbox" id="domande-notify" checked /> Avvisa l'orchestratore in chat
              </label>
              <button class="primary" id="btn-save-domande">Salva risposte</button>
            </div>
          </div>
        </div>

        <!-- Richieste in to-do.md -->
        <div class="panel">
          <div class="panel-header">
            <span>Richieste dell'autore (<code>docs/userchats/to-do.md</code>)</span>
          </div>
          <div style="padding:14px;">
            <div class="q-item">
              <strong style="display:block; margin-bottom:8px;">Aggiungi una richiesta a <code>to-do.md</code></strong>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:8px;">
                <input type="text" id="todo-add-title" placeholder="Titolo della richiesta…" style="grid-column: span 2;" />
                <select id="todo-add-provider">
                  <option value="">Provider proposto: (sceglie l'orchestratore)</option>
                  <option value="Claude Code">Provider proposto: Claude Code</option>
                  <option value="Antigravity">Provider proposto: Antigravity</option>
                </select>
                <input type="text" id="todo-add-deps" placeholder="Dipende da (es. T63)…" />
                <textarea id="todo-add-body" placeholder="Testo della richiesta…" style="grid-column: span 2; min-height:70px;"></textarea>
              </div>
              <button class="success" id="btn-add-todo">+ Aggiungi in fondo a to-do.md</button>
            </div>

            <label style="display:block; font-size:12px; color:var(--muted); margin:10px 0 4px;">Contenuto completo di <code>docs/userchats/to-do.md</code>:</label>
            <div class="md-doc" id="todo-preview" title="Per modificare il file: Sorgente"></div>
            <textarea id="todo-editor" style="width:100%; min-height:260px; font-family:var(--mono);"></textarea>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
              <label style="font-size:12px; color:var(--muted);">
                <input type="checkbox" id="todo-notify" /> Avvisa l'orchestratore in chat
              </label>
              <button class="primary" id="btn-save-todo">Salva to-do.md</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- VISTA 4: CONSUMO & BUDGET -->
    <section id="view-consumi" class="view">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h3 style="margin:0;">Contatori dei Provider (5 ore &amp; Settimana)</h3>
        <button class="primary" id="btn-refresh-usage">↻ Rileggi /usage dalle CLI (<code>uso</code>)</button>
      </div>
      <div id="plan-selectors" style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-bottom:12px;"></div>
      <div class="budget-grid" id="budget-grid"></div>

      <h3 style="margin:18px 0 10px;">Storico dei Consumi (<code>docs/pipeline/consumi.jsonl</code>)</h3>
      <div id="consumi-summary" style="margin-bottom:12px; display:flex; gap:12px; flex-wrap:wrap;"></div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Task</th>
              <th>Provider</th>
              <th>Stima</th>
              <th>Settimana (Prima → Dopo)</th>
              <th>5 Ore (Prima → Dopo)</th>
              <th>Costo USD</th>
              <th>Minuti</th>
              <th>Tentativi</th>
              <th>Esito</th>
            </tr>
          </thead>
          <tbody id="consumi-tbody"></tbody>
        </table>
      </div>
    </section>

    <!-- VISTA 5: CONVERSAZIONI IN CORSO (T86) -->
    <section id="view-conversazioni" class="view">
      <h3 style="margin:0 0 12px;">Conversazioni in corso: i task al lavoro e l'epoca dell'orchestratore</h3>
      <div class="budget-grid" id="conv-grid"></div>
    </section>
  </main>

  <!-- MODALE DETTAGLIO TASK (Dossier, Conversazione dal vivo, Log, Azioni) -->
  <div class="modal-backdrop" id="task-modal">
    <div class="modal">
      <div class="modal-header">
        <div>
          <span id="modal-task-id" class="task-id" style="font-size:16px;"></span>
          <strong id="modal-task-title" style="font-size:16px; margin-left:8px;"></strong>
          <span id="modal-task-badges" style="margin-left:10px;"></span>
        </div>
        <button id="btn-close-modal">✕ Chiudi</button>
      </div>

      <div class="modal-toolbar">
        <form id="modal-assign-form" style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
          <label>Provider:
            <select id="modal-provider">
              <option value="claude">claude</option>
              <option value="fable">fable</option>
              <option value="argon">argon</option>
              <option value="gemini">gemini</option>
            </select>
          </label>
          <label>Stima %:
            <input type="number" id="modal-stima" step="0.5" min="0.5" max="100" style="width:68px;" />
          </label>
          <label>Priorità:
            <input type="number" id="modal-priorita" step="1" style="width:68px;" />
          </label>
          <label style="display:flex; align-items:center; gap:4px;">
            <input type="checkbox" id="modal-approvato" /> Approvato
          </label>
          <button type="submit" class="primary">Salva / Assegna</button>
        </form>

        <div id="modal-exec-actions" style="display:flex; gap:6px; flex-wrap:wrap;"></div>
      </div>

      <div style="padding:8px 18px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
        <div class="sub-tabs" id="modal-tabs">
          <button class="sub-tab active" data-mtab="conv">Conversazione dal vivo (<span id="modal-conv-count">0</span>)</button>
          <button class="sub-tab" data-mtab="dossier">Dossier (<code>dossier</code>)</button>
          <button class="sub-tab" data-mtab="log">Log &amp; Riepilogo</button>
        </div>
        <span id="modal-trace-meta" style="font-size:12px; color:var(--muted);"></span>
      </div>

      <div class="modal-body">
        <div id="mtab-conv"></div>
        <div id="mtab-dossier" style="display:none;"><div class="md-doc" id="modal-dossier-text"></div></div>
        <div id="mtab-log" style="display:none;"><pre class="code-block" id="modal-log-text"></pre></div>
      </div>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    let STATE = null;
    let OPEN_TASK_ID = null;
    let DOMANDE_CURRENT_ID = null;
    let TODO_DIRTY = false;
    let DOMANDE_DIRTY = false;

    const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    ${markdownToHtml.toString()}
    let MD_SOURCE = localStorage.getItem('pipeline-md-sorgente') === '1';
    const md = (text, breaks = false) => MD_SOURCE
      ? \`<div class="md-source">\${esc(text)}</div>\`
      : \`<div class="md">\${markdownToHtml(text, { breaks })}</div>\`;
    // Only when something changes: a refresh must not lose a selection in a long document.
    const setMd = (el, text) => {
      const html = md(text);
      if (el.dataset.shown !== html) { el.innerHTML = html; el.dataset.shown = html; }
    };
    function syncEditor(name) {
      const editor = document.getElementById(name + '-editor');
      const preview = document.getElementById(name + '-preview');
      editor.style.display = MD_SOURCE ? '' : 'none';
      preview.style.display = MD_SOURCE ? 'none' : '';
      if (!MD_SOURCE) setMd(preview, editor.value || '(vuoto)');
    }
    const provBadge = (p) => p ? \`<span class="badge prov-\${esc(p)}">\${esc(p)}</span>\` : '<span class="badge st-dafare">—</span>';
    const statusBadge = (s) => {
      const v = String(s ?? '');
      const cls = v.startsWith('fatto') ? 'st-fatto' : v.startsWith('in corso') ? 'st-incorso' : v.startsWith('in attesa') ? 'st-attesa' : 'st-dafare';
      return \`<span class="badge \${cls}">\${esc(v)}</span>\`;
    };

    function showToast(msg) {
      const el = document.getElementById('toast');
      el.textContent = msg;
      el.style.display = 'block';
      clearTimeout(el._t);
      el._t = setTimeout(() => { el.style.display = 'none'; }, 3200);
    }

    async function api(method, url, body) {
      const r = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || data.message || 'Errore richiesta');
      return data;
    }

    // Navigation Tabs
    for (const btn of document.querySelectorAll('.tab-btn[data-view]')) {
      btn.addEventListener('click', () => {
        for (const b of document.querySelectorAll('.tab-btn[data-view]')) b.classList.remove('active');
        for (const v of document.querySelectorAll('.view')) v.classList.remove('active');
        btn.classList.add('active');
        document.getElementById('view-' + btn.dataset.view).classList.add('active');
      });
    }

    // Sub-tabs in left panel
    for (const btn of document.querySelectorAll('.sub-tab[data-panel]')) {
      btn.addEventListener('click', () => {
        for (const b of document.querySelectorAll('.sub-tab[data-panel]')) b.classList.remove('active');
        btn.classList.add('active');
        for (const name of ['chat', 'eventi', 'quadro']) {
          document.getElementById('subpanel-' + name).style.display = btn.dataset.panel === name ? 'block' : 'none';
        }
      });
    }

    // Sub-tabs in modal
    for (const btn of document.querySelectorAll('#modal-tabs .sub-tab')) {
      btn.addEventListener('click', () => {
        for (const b of document.querySelectorAll('#modal-tabs .sub-tab')) b.classList.remove('active');
        btn.classList.add('active');
        for (const name of ['conv', 'dossier', 'log']) {
          document.getElementById('mtab-' + name).style.display = btn.dataset.mtab === name ? 'block' : 'none';
        }
      });
    }

    function renderOrchestratorBar(s) {
      const o = s.orchestratore;
      const orchSwitch = document.getElementById('orch-switch');
      if (document.activeElement !== orchSwitch) {
        orchSwitch.innerHTML = '<option value="">Passa a…</option>' + s.config.orchestrabili.map((p) => \`<option value="\${esc(p)}">\${esc(p)}</option>\`).join('');
      }
      document.getElementById('orch-prov').innerHTML = provBadge(o.provider);
      document.getElementById('orch-epoca').textContent = \`epoca \${o.stato.epoca ?? 0}\`;
      document.getElementById('orch-ctx').textContent = \`contesto \${o.percentualeContesto ?? 0}%\`;
      const stEl = document.getElementById('orch-status');
      if (o.alLavoro) {
        stEl.className = 'badge st-incorso';
        stEl.textContent = '⚙ Al lavoro…';
      } else if (o.inCoda.length) {
        stEl.className = 'badge st-attesa';
        stEl.textContent = \`\${o.inCoda.length} msg in coda\`;
      } else {
        stEl.className = 'badge st-fatto';
        stEl.textContent = 'In ascolto';
      }
    }

    function renderChatAndEvents(s) {
      const chatEl = document.getElementById('chat-list');
      const atBottom = chatEl.scrollHeight - chatEl.scrollTop - chatEl.clientHeight < 60;
      const items = [];
      for (const c of s.chat) {
        const cls = c.chi === 'autore' ? 'autore' : c.chi === 'orchestratore' ? 'orchestratore' : 'pipeline';
        const time = (c.t || '').slice(11, 19);
        items.push(\`<div class="msg \${cls}">
          <div class="msg-meta"><strong>\${esc(c.chi)}\${c.provider ? ' (' + esc(c.provider) + ')' : ''}</strong><span>\${esc(time)}</span></div>
          <div>\${c.chi === 'pipeline' ? esc(c.testo) : md(c.testo, true)}</div>
        </div>\`);
      }
      for (const q of s.orchestratore.inCoda) {
        items.push(\`<div class="msg incoda">
          <div class="msg-meta"><strong>autore · in coda per il prossimo turno</strong><button type="button" onclick="removeQueued('\${esc(q.id)}')">✕</button></div>
          <div>\${md(q.testo, true)}</div>
        </div>\`);
      }
      chatEl.innerHTML = items.join('') || '<div style="color:var(--muted);">Nessun messaggio nella chat.</div>';
      if (atBottom) chatEl.scrollTop = chatEl.scrollHeight;

      const evEl = document.getElementById('events-list');
      const consegnati = s.orchestratore.stato.consegnati ?? 0;
      document.getElementById('count-eventi').textContent = s.eventi.length;
      const evHtml = s.eventi.slice().reverse().map((e) => {
        const done = e.n <= consegnati;
        return \`<div class="msg pipeline">
          <div class="msg-meta">
            <span>#\${e.n} · \${e.sveglia ? '<strong style="color:var(--amber)">sveglia</strong>' : 'info'}</span>
            <span class="badge \${done ? 'st-fatto' : 'st-attesa'}">\${done ? 'consegnato' : 'in coda'}</span>
          </div>
          <div>\${esc(e.testo)}</div>
        </div>\`;
      });
      evEl.innerHTML = evHtml.join('') || '<div style="color:var(--muted);">Nessun evento registrato.</div>';
      setMd(document.getElementById('quadro-text'), s.quadro || '(nessun quadro)');
    }

    function cardButtons(t) {
      const r = t.esecuzione;
      const btns = [\`<button onclick="openTask('\${esc(t.id)}')">Dettaglio</button>\`];
      if (!t.approved && t.provider && t.estimate !== undefined && !t.status.startsWith('fatto')) {
        btns.push(\`<button class="success" onclick="quickApprove('\${esc(t.id)}')">✓ Approva</button>\`);
      }
      if (r && r.stato === 'in corso') {
        btns.push(\`<button class="warn" onclick="quickInterrupt('\${esc(t.id)}')">Interrompi</button>\`);
      }
      if (r && (r.stato === 'interrotto' || r.stato === 'sospeso' || (r.stato === 'finito' && !r.integrato && /fallito/i.test(r.esito || '')))) {
        btns.push(\`<button class="primary" onclick="quickResume('\${esc(t.id)}')">Riprendi</button>\`);
      }
      if (r && r.stato === 'finito' && !r.integrato) {
        btns.push(\`<button class="success" onclick="quickIntegrate('\${esc(t.id)}')">Integra</button>\`);
      }
      if (t.status.startsWith('in attesa')) {
        btns.push(\`<button class="warn" onclick="openQuestionsFor('\${esc(t.id)}')">Rispondi</button>\`);
      }
      return btns.join('');
    }

    function renderBoards(s) {
      const cols = [
        { key: 'inCorso', title: 'In corso', list: s.code.inCorso },
        { key: 'daIntegrare', title: 'Da integrare', list: s.code.daIntegrare },
        { key: 'pronti', title: 'Pronti', list: s.code.pronti },
        { key: 'daApprovare', title: 'Da approvare / stimare', list: [...s.code.daApprovare, ...s.code.daStimare] },
        { key: 'bloccati', title: 'Bloccati', list: s.code.bloccati },
        { key: 'inAttesa', title: 'In attesa', list: s.code.inAttesa },
      ];
      const byId = new Map(s.tasks.map((t) => [t.id, t]));
      document.getElementById('boards-wrap').innerHTML = cols.map((col) => {
        const cards = col.list.map((item) => {
          const full = byId.get(item.id) || item;
          const r = full.esecuzione;
          return \`<div class="task-card" data-task-card="\${esc(full.id)}">
            <div class="task-card-top">
              <a class="task-id" onclick="openTask('\${esc(full.id)}')">\${esc(full.id)}</a>
              <div>\${provBadge(full.provider)} \${full.estimate !== undefined ? \`<span class="badge st-dafare">\${full.estimate}%</span>\` : ''}</div>
            </div>
            <div class="task-title" onclick="openTask('\${esc(full.id)}')">\${esc(full.title)}</div>
            <div class="task-meta">
              <span>p\${full.priority ?? 100}</span>
              \${full.missing?.length ? \`<span style="color:var(--amber)">aspetta \${esc(full.missing.join(', '))}</span>\` : ''}
              \${r ? \`<span>· \${esc(r.stato)} (\${r.tentativi} tent.)</span>\` : ''}
            </div>
            \${r?.esito ? \`<div style="font-size:11px; color:var(--green);">\${esc(r.esito)}</div>\` : ''}
            \${r?.browser ? \`<div style="font-size:11px; color:var(--accent);">\${esc(r.browser)}</div>\` : ''}
            <div class="task-card-actions">\${cardButtons(full)}</div>
          </div>\`;
        }).join('') || '<div style="color:var(--muted); font-size:12px; padding:6px;">Nessun task</div>';
        return \`<div class="board-col" data-board-col="\${col.key}">
          <div class="board-col-header">
            <span>\${esc(col.title)}</span>
            <span class="badge st-dafare">\${col.list.length}</span>
          </div>
          <div class="board-cards">\${cards}</div>
        </div>\`;
      }).join('');
    }

    function renderTasksTable(s) {
      document.getElementById('count-all').textContent = s.tasks.length;
      const q = document.getElementById('filter-search').value.trim().toLowerCase();
      const fStatus = document.getElementById('filter-status').value;
      const fProv = document.getElementById('filter-provider').value;
      const fQueue = document.getElementById('filter-queue').value;

      const filtered = s.tasks.filter((t) => {
        if (q && !t.id.toLowerCase().includes(q) && !t.title.toLowerCase().includes(q)) return false;
        if (fStatus && !t.status.startsWith(fStatus)) return false;
        if (fProv && t.provider !== fProv) return false;
        if (fQueue && t.coda !== fQueue) return false;
        return true;
      });

      document.getElementById('tasks-tbody').innerHTML = filtered.map((t) => {
        const r = t.esecuzione;
        const deps = (t.deps || []).map((d) => \`<a class="task-id" style="font-size:11px; margin-right:4px;" onclick="openTask('\${esc(d)}')">\${esc(d)}</a>\`).join('') || '—';
        const execInfo = r
          ? \`\${statusBadge(r.stato)} <small>\${r.tentativi} tent.\${r.esito ? ' · ' + esc(r.esito.slice(0, 48)) : ''}</small>\`
          : '—';
        return \`<tr data-task-row="\${esc(t.id)}">
          <td><a class="task-id" onclick="openTask('\${esc(t.id)}')">\${esc(t.id)}</a></td>
          <td><span style="cursor:pointer; font-weight:600;" onclick="openTask('\${esc(t.id)}')">\${esc(t.title)}</span></td>
          <td>\${statusBadge(t.status)}</td>
          <td><span class="badge st-dafare">\${esc(t.coda)}</span></td>
          <td>\${provBadge(t.provider)}</td>
          <td>\${t.estimate !== undefined ? t.estimate + '%' : '—'}</td>
          <td>p\${t.priority ?? 100}</td>
          <td>\${t.approved ? '<span class="badge st-fatto">✓ Sì</span>' : '<span class="badge st-dafare">No</span>'}</td>
          <td>\${deps}</td>
          <td>\${execInfo}</td>
          <td><div style="display:flex; gap:4px; flex-wrap:wrap;">\${cardButtons(t)}</div></td>
        </tr>\`;
      }).join('');
    }

    function renderDomandeAndTodo(s) {
      document.getElementById('count-domande').textContent = s.domandeAperte;
      const sel = document.getElementById('domande-select');
      const prev = DOMANDE_CURRENT_ID || sel.value || s.domande[0]?.id;
      sel.innerHTML = s.domande.map((d) =>
        \`<option value="\${esc(d.id)}" \${d.id === prev ? 'selected' : ''}>\${esc(d.id)} · \${esc(d.taskTitle)} (\${d.stato ?? (d.answered ? 'risposto' : 'da rispondere')})</option>\`
      ).join('');
      if (!DOMANDE_DIRTY && prev) {
        loadSelectedDomanda(prev, s);
      }
      if (!TODO_DIRTY) {
        document.getElementById('todo-editor').value = s.todo || '';
        syncEditor('todo');
      }
    }

    function loadSelectedDomanda(id, s = STATE) {
      if (!s) return;
      DOMANDE_CURRENT_ID = id;
      const d = s.domande.find((x) => x.id === id);
      document.getElementById('domande-filename').textContent = d ? id + '.md' : '…';
      if (!d) {
        document.getElementById('domande-structured').innerHTML = '<div style="color:var(--muted);">Nessun file di domande selezionato.</div>';
        document.getElementById('domande-editor').value = '';
        syncEditor('domande');
        return;
      }
      document.getElementById('domande-editor').value = d.content;
      syncEditor('domande');
      document.getElementById('domande-structured').innerHTML = d.items.map((item) => \`
        <div class="q-item">
          <label><strong>Domanda \${item.numero}:</strong>\${md(item.domanda)}</label>
          <input type="text" class="q-answer-input" data-qnum="\${item.numero}" value="\${esc(item.risposta)}" placeholder="Scrivi la risposta…" style="width:100%;" />
        </div>
      \`).join('');
      for (const inp of document.querySelectorAll('.q-answer-input')) {
        inp.addEventListener('input', () => { DOMANDE_DIRTY = 'inputs'; });
      }
    }

    function renderConsumiAndBudget(s) {
      const plans = document.getElementById('plan-selectors');
      if (!plans.contains(document.activeElement)) {
        plans.innerHTML = Object.entries(s.config.piani).map(([sub, list]) => \`<label>Piano \${esc(sub)}
          <select onchange="setPlan('\${esc(sub)}', this.value)">\${list.map((n) => \`<option value="\${esc(n)}"\${s.config.abbonamenti[sub] === n ? ' selected' : ''}>\${esc(n)}</option>\`).join('')}</select>
        </label>\`).join('');
      }
      const grid = document.getElementById('budget-grid');
      grid.innerHTML = Object.entries(s.budget).map(([prov, b]) => {
        const w = b.residuo ?? 100;
        const h5 = b.sessione ?? 100;
        const wColor = w <= s.config.sogliaUnSolo ? 'var(--red)' : w <= 25 ? 'var(--amber)' : 'var(--green)';
        const hColor = h5 <= s.config.sogliaUnSolo ? 'var(--red)' : h5 <= 25 ? 'var(--amber)' : 'var(--accent)';
        const isOrch = s.orchestratore.provider === prov;
        const counters = (b.contatori || []).map((c) =>
          \`<div style="font-size:12px; color:var(--muted); display:flex; justify-content:space-between;">
            <span>\${esc(c.nome)} (\${esc(c.finestra)})</span>
            <span><strong>\${c.residuo}%</strong>\${c.reset ? ' · reset ' + esc(c.reset.slice(0, 16).replace('T', ' ')) : ''}</span>
          </div>\`
        ).join('');
        return \`<div class="budget-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div>\${provBadge(prov)} \${isOrch ? '<span class="badge st-incorso">Orchestratore</span>' : ''}</div>
            <small style="color:var(--muted);">\${b.letto ? 'letto ' + esc(b.letto.slice(11, 19)) : 'manuale'}</small>
          </div>
          \${s.config.abilitati.includes(prov) ? '' : '<div class="badge st-errore" style="margin-bottom:8px;">Non nel piano attivo</div>'}
          <label style="display:block; font-size:12px; margin-bottom:8px;"><input type="checkbox" \${s.config.permessoOrchestrare[prov] ? 'checked' : ''} onchange="setOrchestrable('\${esc(prov)}', this.checked)" /> Può orchestrare</label>
          \${b.fermoFino ? \`<div class="badge st-errore" style="margin-bottom:8px;">Fermo fino a \${esc(b.fermoFino)}</div>\` : ''}
          \${b.sospeso ? \`<div class="badge st-in-attesa" style="margin-bottom:8px;">Sospeso\${typeof b.sospeso === 'string' && b.sospeso !== 'true' ? ' fino a ' + esc(b.sospeso) : ''}</div>\` : ''}
          <div style="display:flex; justify-content:space-between; font-size:12px;"><span>Settimana</span><strong>\${w}% residuo</strong></div>
          <div class="progress-bar"><div class="progress-fill" style="width:\${Math.max(0, Math.min(100, w))}%; background:\${wColor};"></div></div>
          <div style="display:flex; justify-content:space-between; font-size:12px;"><span>Finestra 5 ore</span><strong>\${b.sessione ?? '—'}% residuo</strong></div>
          <div class="progress-bar"><div class="progress-fill" style="width:\${Math.max(0, Math.min(100, h5))}%; background:\${hColor};"></div></div>
          <div style="margin:8px 0;">\${counters}</div>
          <div style="font-size:12px; color:var(--muted);">Slot <strong>\${b.slot ?? '?'}</strong> / tetto \${b.tetto ?? '?'} · in programma \${b.domanda ?? '?'} · esaurimento \${b.previsione ? esc(b.previsione.slice(0, 16).replace('T', ' ')) : '—'} · reset \${b.resetSettimana ? esc(b.resetSettimana.slice(0, 16).replace('T', ' ')) : '—'}</div>
          <div style="display:flex; gap:6px; align-items:center; margin-top:10px;">
            <input type="number" id="manual-budget-\${esc(prov)}" min="0" max="100" value="\${w}" style="width:70px;" />
            <button onclick="setManualBudget('\${esc(prov)}')">Imposta % manuale</button>
          </div>
        </div>\`;
      }).join('');

      const totalUsd = s.consumi.reduce((acc, c) => acc + (Number(c.costoUsd) || 0), 0);
      const totalMin = s.consumi.reduce((acc, c) => acc + (Number(c.minuti) || 0), 0);
      document.getElementById('consumi-summary').innerHTML = \`
        <span class="badge st-dafare">Esecuzioni registrate: <strong>\${s.consumi.length}</strong></span>
        <span class="badge st-dafare">Costo USD riportato (Claude): <strong>$\${totalUsd.toFixed(2)}</strong></span>
        <span class="badge st-dafare">Tempo totale: <strong>\${totalMin} min</strong></span>
      \`;

      document.getElementById('consumi-tbody').innerHTML = s.consumi.slice().reverse().map((c) => {
        const wDelta = c.prima?.settimana !== undefined && c.dopo?.settimana !== undefined
          ? \`\${c.prima.settimana}% → \${c.dopo.settimana}% (Δ \${c.prima.settimana - c.dopo.settimana}%)\`
          : '—';
        const sDelta = c.prima?.sessione !== undefined && c.dopo?.sessione !== undefined
          ? \`\${c.prima.sessione}% → \${c.dopo.sessione}% (Δ \${c.prima.sessione - c.dopo.sessione}%)\`
          : '—';
        return \`<tr>
          <td>\${esc((c.data || '').slice(0, 16).replace('T', ' '))}</td>
          <td><a class="task-id" onclick="openTask('\${esc(c.task)}')">\${esc(c.task)}</a></td>
          <td>\${provBadge(c.provider)}</td>
          <td>\${c.stima ?? '?'}%</td>
          <td>\${esc(wDelta)}</td>
          <td>\${esc(sDelta)}</td>
          <td>\${c.costoUsd !== undefined ? '$' + Number(c.costoUsd).toFixed(2) : '—'}</td>
          <td>\${c.minuti ?? 0}m</td>
          <td>\${c.tentativi ?? 1}</td>
          <td>\${esc(c.esito || '')}</td>
        </tr>\`;
      }).join('');
    }

    function renderConversations(list) {
      document.getElementById('count-conv').textContent = list.length;
      const k = (n) => n >= 1000 ? Math.round(n / 1000) + 'k' : String(n);
      document.getElementById('conv-grid').innerHTML = list.length ? list.map((c) => {
        const u = c.consumo || { chiamate: 0, input: 0, cache: 0, scritti: 0, output: 0 };
        const who = c.chi === 'orchestratore'
          ? \`<strong>orchestratore</strong> · epoca \${c.epoca}\`
          : \`<a class="task-id" onclick="openTask('\${esc(c.chi)}')">\${esc(c.chi)}</a>\`;
        return \`<div class="budget-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div>\${who} \${provBadge(c.provider)}</div>
            <small style="color:var(--muted);">\${c.dal ? 'dal ' + esc(c.dal.slice(0, 16).replace('T', ' ')) : ''}</small>
          </div>
          <div style="font-size:12px;">Conversazione: <code>\${esc(c.sessione || 'id non ancora noto')}</code></div>
          <div style="font-size:12px; color:var(--muted); word-break:break-all;">\${esc(c.file || '')}</div>
          \${c.riprendi ? \`<pre class="code-block" style="margin:6px 0;">\${esc(c.riprendi)}</pre>\` : ''}
          <div style="font-size:12px; margin:6px 0;">Consumo: <strong>\${u.chiamate}</strong> chiamate · \${k(u.input)} nuovi · \${k(u.cache)} dalla cache\${u.scritti ? ' · ' + k(u.scritti) + ' scritti' : ''} · \${k(u.output)} in uscita\${c.costoUsd !== undefined ? ' · $' + Number(c.costoUsd).toFixed(2) : ''}</div>
          <pre class="code-block" style="max-height:180px; overflow-y:auto; font-size:11px;">\${esc((c.ultime || []).join('\\n') || 'nessun passo ancora')}</pre>
        </div>\`;
      }).join('') : '<div style="color:var(--muted);">Nessuna conversazione in corso.</div>';
    }

    async function loadState() {
      try {
        STATE = await api('GET', '/api/stato');
        renderOrchestratorBar(STATE);
        renderChatAndEvents(STATE);
        renderBoards(STATE);
        renderTasksTable(STATE);
        renderDomandeAndTodo(STATE);
        renderConsumiAndBudget(STATE);
        renderConversations(await api('GET', '/api/conversazioni'));
        if (OPEN_TASK_ID) await refreshOpenTask(OPEN_TASK_ID);
      } catch (e) {
        console.error(e);
      }
    }

    // Actions
    window.openTask = async function(id) {
      OPEN_TASK_ID = id;
      document.getElementById('task-modal').classList.add('open');
      await refreshOpenTask(id);
    };

    async function refreshOpenTask(id) {
      const detail = await api('GET', '/api/task/' + encodeURIComponent(id));
      const t = STATE?.tasks.find((x) => x.id === id) || { id, title: id, status: '—' };
      document.getElementById('modal-task-id').textContent = id;
      document.getElementById('modal-task-title').textContent = t.title || '';
      document.getElementById('modal-task-badges').innerHTML = \`\${statusBadge(t.status)} \${provBadge(t.provider)}\`;

      const form = document.getElementById('modal-assign-form');
      if (form.dataset.loadedFor !== id) {
        form.dataset.loadedFor = id;
        document.getElementById('modal-provider').value = t.provider || 'claude';
        document.getElementById('modal-stima').value = t.estimate ?? 4;
        document.getElementById('modal-priorita').value = t.priority ?? 100;
        document.getElementById('modal-approvato').checked = Boolean(t.approved);
      }

      const actions = [];
      if (!t.approved && t.provider && t.estimate !== undefined) {
        actions.push(\`<button class="success" onclick="quickApprove('\${esc(id)}')">✓ Approva ora</button>\`);
      }
      if (t.esecuzione?.stato === 'in corso') {
        actions.push(\`<button class="warn" onclick="quickInterrupt('\${esc(id)}')">Interrompi</button>\`);
      }
      if (t.esecuzione && t.esecuzione.stato !== 'in corso') {
        actions.push(\`<button class="primary" onclick="quickResume('\${esc(id)}')">Riprendi conversazione</button>\`);
      }
      if (t.esecuzione?.stato === 'finito' && !t.esecuzione.integrato) {
        actions.push(\`<button class="success" onclick="quickIntegrate('\${esc(id)}')">Integra nel base</button>\`);
      }
      if (detail.dossier?.hasQuestions || detail.domande) {
        actions.push(\`<button class="warn" onclick="openQuestionsFor('\${esc(id)}')">Apri domande (\${esc(id)}.md)</button>\`);
      }
      document.getElementById('modal-exec-actions').innerHTML = actions.join('');

      setMd(document.getElementById('modal-dossier-text'), detail.dossier?.markdown || '');
      const tr = detail.traccia;
      const conv = tr?.conversazione || [];
      document.getElementById('modal-conv-count').textContent = conv.length;
      document.getElementById('modal-trace-meta').innerHTML = tr
        ? \`AGENTS.md: <strong style="color:\${tr.agents ? 'var(--green)' : 'var(--amber)'}">\${tr.agents ? 'letto ✓' : 'non rilevato'}</strong> · stato: <strong>\${esc(tr.run?.stato || '—')}</strong>\`
        : 'Nessuna esecuzione registrata';

      const convEl = document.getElementById('mtab-conv');
      if (!conv.length) {
        convEl.innerHTML = tr?.out?.result
          ? \`<div class="conv-step agente"><strong>Riepilogo finale:</strong>\${md(tr.out.result, true)}</div>\`
          : '<div style="color:var(--muted);">Nessun passo della conversazione disponibile per questo task.</div>';
      } else {
        convEl.innerHTML = conv.map((step) => {
          const time = step.t ? step.t.slice(11, 19) : '';
          if (step.ruolo === 'strumento') {
            return \`<div class="conv-step strumento">🛠 <strong>\${esc(step.nome)}</strong> <code>\${esc(step.argomenti || '')}</code> <span style="float:right; color:var(--muted);">\${esc(time)}</span></div>\`;
          }
          return \`<div class="conv-step \${esc(step.ruolo)}">
            <div class="msg-meta"><strong>\${esc(step.ruolo)}</strong><span>\${esc(time)}</span></div>
            <div>\${md(step.testo || '', true)}</div>
          </div>\`;
        }).join('');
      }
      document.getElementById('modal-log-text').textContent = tr
        ? \`--- Riepilogo ---\\n\${tr.out?.result || '(nessun riepilogo)'}\\n\\n--- Log grezzo (\${tr.log}) ---\\n\${tr.logText || '(vuoto)'}\`
        : '(nessun log)';
    }

    document.getElementById('btn-close-modal').addEventListener('click', () => {
      OPEN_TASK_ID = null;
      document.getElementById('task-modal').classList.remove('open');
    });

    document.getElementById('modal-assign-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!OPEN_TASK_ID) return;
      await api('POST', '/api/assegna', {
        id: OPEN_TASK_ID,
        provider: document.getElementById('modal-provider').value,
        stima: Number(document.getElementById('modal-stima').value),
        priorita: Number(document.getElementById('modal-priorita').value),
        approva: document.getElementById('modal-approvato').checked,
      });
      showToast(\`\${OPEN_TASK_ID} aggiornato nel backlog\`);
      await loadState();
    });

    window.quickApprove = async function(id) {
      await api('POST', '/api/approva', { ids: [id] });
      showToast(\`\${id}: approvato\`);
      await loadState();
    };
    window.quickInterrupt = async function(id) {
      await api('POST', '/api/interrompi', { ids: [id] });
      showToast(\`\${id}: interrotto\`);
      await loadState();
    };
    window.quickResume = async function(id) {
      await api('POST', '/api/riprendi', { ids: [id] });
      showToast(\`\${id}: rimesso in coda\`);
      await loadState();
    };
    window.quickIntegrate = async function(id) {
      try {
        const r = await api('POST', '/api/integra', { id });
        showToast(r.message || \`\${id}: integrato\`);
      } catch (e) {
        showToast(e.message);
      }
      await loadState();
    };
    window.openQuestionsFor = function(id) {
      document.getElementById('task-modal').classList.remove('open');
      OPEN_TASK_ID = null;
      const baseId = STATE?.domande.find((d) => d.id === id) ? id : id.replace(/[a-z]$/i, '');
      DOMANDE_CURRENT_ID = baseId;
      DOMANDE_DIRTY = false;
      document.querySelector('.tab-btn[data-view="domande"]').click();
      loadSelectedDomanda(baseId);
    };
    window.removeQueued = async function(msgId) {
      await api('POST', '/api/orchestratore', { rimuoviCoda: msgId });
      await loadState();
    };
    window.setManualBudget = async function(prov) {
      const val = Number(document.getElementById('manual-budget-' + prov).value);
      await api('POST', '/api/budget', { provider: prov, residuo: val });
      showToast(\`Budget di \${prov} impostato a \${val}%\`);
      await loadState();
    };
    window.setPlan = async function(sub, nome) {
      await api('POST', '/api/config', { abbonamenti: { [sub]: nome } });
      showToast(\`Piano \${sub}: \${nome}\`);
      document.activeElement?.blur?.();
      await loadState();
    };
    window.setOrchestrable = async function(prov, value) {
      await api('POST', '/api/config', { orchestrabile: { [prov]: value } });
      showToast(\`\${prov} \${value ? 'può' : 'non può'} orchestrare\`);
      await loadState();
    };

    // Chat form
    document.getElementById('chat-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const inp = document.getElementById('chat-input');
      const testo = inp.value.trim();
      if (!testo) return;
      inp.value = '';
      await api('POST', '/api/chat', { testo });
      showToast('Messaggio inviato alla coda dell\\'orchestratore');
      await loadState();
    });
    document.getElementById('chat-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || !e.shiftKey)) {
        e.preventDefault();
        document.getElementById('chat-form').requestSubmit();
      }
    });
    document.getElementById('btn-quick-stato').addEventListener('click', async () => {
      await api('POST', '/api/chat', { testo: '/stato' });
      showToast('PIANO.md rigenerato');
      await loadState();
    });
    document.getElementById('btn-quick-epoca').addEventListener('click', async () => {
      await api('POST', '/api/orchestratore', { epoca: true });
      showToast('Nuova epoca richiesta (/epoca)');
      await loadState();
    });
    document.getElementById('btn-quick-nota').addEventListener('click', async () => {
      const inp = document.getElementById('chat-input');
      if (!inp.value.trim()) { inp.value = '/nota '; inp.focus(); return; }
      const raw = inp.value.trim().replace(/^\\/nota\\s+/i, '');
      inp.value = '';
      await api('POST', '/api/orchestratore', { nota: raw });
      showToast('Nota aggiunta al diario');
      await loadState();
    });

    // Topbar controls
    document.getElementById('orch-switch').addEventListener('change', async (e) => {
      const provider = e.target.value;
      if (!provider) return;
      e.target.value = '';
      await api('POST', '/api/orchestratore', { provider });
      showToast(\`Orchestratore passato a \${provider}\`);
      await loadState();
    });
    document.getElementById('btn-new-epoch').addEventListener('click', async () => {
      await api('POST', '/api/orchestratore', { epoca: true });
      showToast('Nuova epoca richiesta');
      await loadState();
    });
    function showMdButton() {
      const button = document.getElementById('btn-md-source');
      button.classList.toggle('active', MD_SOURCE);
      button.setAttribute('aria-pressed', String(MD_SOURCE));
    }
    document.getElementById('btn-md-source').addEventListener('click', () => {
      MD_SOURCE = !MD_SOURCE;
      localStorage.setItem('pipeline-md-sorgente', MD_SOURCE ? '1' : '0');
      showMdButton();
      syncEditor('domande');
      syncEditor('todo');
      loadState();
    });
    showMdButton();
    syncEditor('domande');
    syncEditor('todo');
    document.getElementById('btn-refresh').addEventListener('click', () => loadState());
    document.getElementById('btn-refresh-usage').addEventListener('click', async () => {
      showToast('Lettura /usage dalle CLI in corso…');
      await api('POST', '/api/budget', { uso: true });
      showToast('Contatori /usage aggiornati');
      await loadState();
    });

    // Filters
    for (const id of ['filter-search', 'filter-status', 'filter-provider', 'filter-queue']) {
      document.getElementById(id).addEventListener('input', () => STATE && renderTasksTable(STATE));
      document.getElementById(id).addEventListener('change', () => STATE && renderTasksTable(STATE));
    }

    // Domande & To-Do handlers
    document.getElementById('domande-select').addEventListener('change', (e) => {
      DOMANDE_DIRTY = false;
      loadSelectedDomanda(e.target.value);
    });
    document.getElementById('domande-editor').addEventListener('input', () => { DOMANDE_DIRTY = 'editor'; });
    document.getElementById('btn-save-domande').addEventListener('click', async () => {
      if (!DOMANDE_CURRENT_ID) return;
      const inputs = [...document.querySelectorAll('.q-answer-input')];
      const content = document.getElementById('domande-editor').value;
      const avvisa = document.getElementById('domande-notify').checked;
      if (inputs.length && DOMANDE_DIRTY !== 'editor') {
        const risposte = {};
        for (const inp of inputs) risposte[inp.dataset.qnum] = inp.value;
        await api('POST', '/api/domande/' + encodeURIComponent(DOMANDE_CURRENT_ID), { content, risposte, avvisa });
      } else {
        await api('POST', '/api/domande/' + encodeURIComponent(DOMANDE_CURRENT_ID), { content, avvisa });
      }
      DOMANDE_DIRTY = false;
      showToast(\`Salvate risposte in docs/pipeline/domande/\${DOMANDE_CURRENT_ID}.md\`);
      await loadState();
    });

    document.getElementById('todo-editor').addEventListener('input', () => { TODO_DIRTY = true; });
    document.getElementById('btn-add-todo').addEventListener('click', async () => {
      const titolo = document.getElementById('todo-add-title').value.trim();
      const testo = document.getElementById('todo-add-body').value.trim();
      const provider = document.getElementById('todo-add-provider').value;
      const dipende = document.getElementById('todo-add-deps').value.trim();
      if (!titolo && !testo) return;
      await api('POST', '/api/todo', {
        aggiungi: { titolo, testo, provider, dipende },
        avvisa: document.getElementById('todo-notify').checked,
      });
      document.getElementById('todo-add-title').value = '';
      document.getElementById('todo-add-body').value = '';
      document.getElementById('todo-add-deps').value = '';
      TODO_DIRTY = false;
      showToast('Richiesta aggiunta a docs/userchats/to-do.md');
      await loadState();
    });
    document.getElementById('btn-save-todo').addEventListener('click', async () => {
      const content = document.getElementById('todo-editor').value;
      await api('POST', '/api/todo', {
        content,
        avvisa: document.getElementById('todo-notify').checked,
      });
      TODO_DIRTY = false;
      showToast('Salvato docs/userchats/to-do.md');
      await loadState();
    });

    loadState();
    setInterval(loadState, 3000);
  </script>
</body>
</html>`;
}

/** Creates the HTTP server for the pipeline web interface. */
export function createWebServer(opts = {}) {
  return http.createServer((req, res) => {
    const method = req.method ?? 'GET';
    const url = req.url ?? '/';
    if (method === 'GET' && (url === '/' || url.startsWith('/?') || url === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(renderHtml());
      return;
    }
    if (url.startsWith('/api/')) {
      let raw = '';
      req.on('data', (chunk) => { raw += chunk; });
      req.on('end', () => {
        let body = {};
        if (raw) {
          try { body = JSON.parse(raw); } catch {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'JSON non valido' }));
            return;
          }
        }
        const out = handleApi(method, url, body, opts);
        res.writeHead(out.status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify(out.data));
      });
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Non trovato');
  });
}

/** Starts the web interface server on `port` (or falls back to an ephemeral port if `fallbackPort` is set). */
export function startWebServer({ port = 4242, fallbackPort = false, ...opts } = {}) {
  const server = createWebServer(opts);
  return new Promise((resolve, reject) => {
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE' && fallbackPort) {
        server.listen(0, '127.0.0.1', () => {
          const actual = server.address().port;
          console.log(`Interfaccia web della pipeline: http://localhost:${actual}`);
          resolve({ server, port: actual });
        });
      } else {
        reject(err);
      }
    });
    server.listen(port, '127.0.0.1', () => {
      const actual = server.address().port;
      console.log(`Interfaccia web della pipeline: http://localhost:${actual}`);
      resolve({ server, port: actual });
    });
  });
}
