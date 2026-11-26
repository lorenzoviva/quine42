// The process that serves the Council's slow queue with a subscription's CLI (T68b, ADR-0077).
// Runs Claude Code non-interactively, answers via /api/coda disk protocol, extracts token usage, repairs schemas with
// parseJson, and pauses upon hitting subscription limits.
//
// What it runs may be dictated by whoever plays, so the CLI gets nothing to act with (ADR-0106): an empty folder, a reduced
// environment, no tools, no MCP, no hooks, no customization, the text on stdin; and each run has to confirm it (`IsolationCheck`),
// before the model is called, or it is killed. Antigravity cannot exclude its tools: it does not serve the queue.
//
// Paid with Anthropic's API credits (T542, ADR-0262: `--api --tetto-api <usd>`, or the `.env`): only the child gets ANTHROPIC_API_KEY,
// read from the `.env` (`tools/abbonamenti/api.ts`); each run has to say it pays with the key (`apiKeySource` of its `init`) and,
// without `--api`, that it pays with nothing but the subscription; every run is priced in the ledger, and past the ceiling the queue stops.

import { execFileSync, spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { answer, beat, type QueuedRequest } from '../../server/subscriptionQueue';
import { parseJson } from '../../src/kernel/ai/models';
import type { Provider, QueuedAnswer } from '../../src/kernel/ai/subscription';
// @ts-expect-error pipeline.mjs is untyped plain JS
import { cliSaid, usageLimit } from '../pipeline/pipeline.mjs';
import { serverPath } from '../../server/folders';
import { API_KEY_VAR as API_KEY_NAME, apiSettings, capReached, childEnv, CREDITS_OVER, NO_WORKSPACE, dollars, markLedger, priceRun, readLedger, recordCall, redact, spentIn, type ApiSettings } from './api';

export type SubscriptionProvider = Exclude<Provider, 'api'>;

export interface ServeOptions {
  provider: SubscriptionProvider;
  dir: string;
  cmd?: string;
  pollMs?: number;
  beatMs?: number;
  timeoutMs?: number;
  once?: boolean;
  /** Paid with the API (T542): the key and the ceiling; undefined on the subscription. */
  api?: ApiSettings;
  /** What the command line asked of the API (`--api`, `--tetto-api`, `--env`), which `apiSettings` resolves with the `.env`. */
  apiAsk?: { api: boolean; cap?: number; envFile?: string };
}

export interface CliCommand {
  cmd: string;
  args: string[];
  /** What the CLI reads as its prompt: never an argument, where a text beginning with a dash could become an option. */
  stdin: string;
  /**
   * The system prompt and the file the CLI reads it from (`--system-prompt-file`, T427): never an argument, which grows with the request
   * past the 32 767 characters of a command line on Windows (`spawn ENAMETOOLONG`). Whoever runs the command writes it first.
   */
  system?: { file: string; text: string };
}

/** The name of the system prompt's file in the folder of a run (T427), next to the empty folder the CLI runs in, never inside it. */
export const SYSTEM_FILE = 'system-prompt.txt';

/** The empty folder the CLI runs in, inside the folder of the run (`runFolders`). */
export const EMPTY_DIR = 'empty';

/**
 * The folders of a run (T427): `root` from `mkdtemp` (0700 where the system has the bits), with the system prompt's file, and `empty` inside
 * it, the CLI's working folder, empty as ADR-0106 wants. Removing `root` removes both.
 */
export async function runFolders(prefix: string): Promise<{ root: string; empty: string }> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  const empty = path.join(root, EMPTY_DIR);
  await fs.mkdir(empty, { mode: 0o700 });
  return { root, empty };
}

/**
 * Writes the system prompt of a command in the folder of its run: only the run's user may read it (0600 where the system has the bits),
 * never over a file that is there already. It goes with the folder when the run ends.
 */
export async function writeSystemPrompt(command: Pick<CliCommand, 'system'>): Promise<void> {
  if (command.system) await fs.writeFile(command.system.file, command.system.text, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
}

export interface CliRunResult {
  code: number | null;
  stdout: string;
  stderr: string;
  combined: string;
}

export interface ServeStepResult {
  served: boolean;
  id?: string;
  /**
   * `isolation`: the CLI did not confirm it has nothing to act with; `billing`: it would not pay as it was told (T542); `cap`: the API's
   * ceiling is reached, or its credits are over. The process stops serving on each of them.
   */
  status?: 'ok' | 'error' | 'limit' | 'isolation' | 'billing' | 'cap';
  text?: string;
  errore?: string;
  reset?: Date;
  usage?: QueuedAnswer['usage'];
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Enhances the prompt with JSON schema requirements if a schema is defined. */
export function promptWithSchema(prompt: string, schema?: unknown): string {
  if (!schema) return prompt;
  return `${prompt}\n\nRispondi esclusivamente con un oggetto JSON valido conforme a questo schema (senza testo introduttivo né commenti, solo il JSON):\n${JSON.stringify(schema, null, 2)}`;
}

/**
 * What every run of the CLI says: print mode with its events (`IsolationCheck` reads them), no tools, no MCP but an empty list,
 * no settings of the machine (so none of their hooks) and hooks off anyway, no customization, nothing that could ask or stay.
 * Not `--bare`: it does not read the subscription's login.
 */
export const ISOLATION_ARGS: readonly string[] = [
  '-p',
  '--output-format',
  'stream-json',
  '--verbose',
  '--include-hook-events',
  '--tools',
  '',
  '--strict-mcp-config',
  '--mcp-config',
  '{"mcpServers":{}}',
  '--setting-sources',
  '',
  '--settings',
  '{"disableAllHooks":true}',
  '--safe-mode',
  '--restricted',
  '--disable-slash-commands',
  '--no-session-persistence',
  '--no-chrome',
  '--permission-prompts',
  'none',
];

/**
 * The model and the effort of a run (T391: the bench chooses them; the queue of the game says neither, and the CLI uses its own), and
 * whether the images of the request go with it: then the prompt goes as one user message of events (`--input-format stream-json`).
 */
export interface CliChoice {
  model?: string;
  effort?: string;
  images?: boolean;
}

/** An id of a model or an effort: letters, digits, dots and dashes, never an option of the CLI. */
const CHOICE_RE = /^[a-z0-9][a-z0-9.-]{0,63}$/i;

/** A data URL (image/png, image/jpeg) as an image block of Claude's messages; anything else is refused. */
export function imageBlock(url: string): { type: 'image'; source: { type: 'base64'; media_type: string; data: string } } {
  const m = /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(url);
  if (!m) throw new Error('immagine non valida: solo data URL png o jpeg');
  return { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } };
}

/**
 * Builds the non-interactive CLI command and arguments for the chosen subscription provider; `runDir` is the folder of the run
 * (`runFolders`), where its system prompt is written (`writeSystemPrompt`). No argument grows with the request.
 */
export function buildCliCommand(
  provider: SubscriptionProvider,
  req: Pick<QueuedRequest, 'system' | 'prompt' | 'schema' | 'images'> & Partial<QueuedRequest>,
  customCmd?: string,
  choice: CliChoice = {},
  runDir = '.',
): CliCommand {
  if (provider !== 'claude') throw new Error(`${String(provider)} non serve la coda: non può escludere gli strumenti`);
  for (const v of [choice.model, choice.effort]) if (v !== undefined && !CHOICE_RE.test(v)) throw new Error(`scelta della CLI non valida: ${v}`);
  const parts = (customCmd ?? 'claude').trim().split(/\s+/).filter(Boolean);
  const text = promptWithSchema(req.prompt, req.schema);
  const images = choice.images ? (req.images ?? []) : [];
  const chosen = [
    ...(choice.model ? ['--model', choice.model] : []),
    ...(choice.effort ? ['--effort', choice.effort] : []),
    ...(images.length ? ['--input-format', 'stream-json'] : []),
  ];
  // The system prompt in place of the CLI's, from its file: the argument is a path we chose, whatever the request says.
  const system = req.system ? { file: path.resolve(runDir, SYSTEM_FILE), text: req.system } : undefined;
  const args = [...parts.slice(1), ...ISOLATION_ARGS, ...chosen, ...(system ? ['--system-prompt-file', system.file] : [])];
  const stdin = images.length
    ? `${JSON.stringify({ type: 'user', message: { role: 'user', content: [...images.map(imageBlock), { type: 'text', text }] } })}\n`
    : text;
  return { cmd: parts[0], args, stdin, ...(system ? { system } : {}) };
}

/** What the CLI needs to run and to find the subscription's login, by name; everything else (keys, the `.env`) stays here. */
const CLI_ENV = new Set(
  'PATH PATHEXT SYSTEMROOT SYSTEMDRIVE WINDIR COMSPEC TEMP TMP TMPDIR HOME USERPROFILE HOMEDRIVE HOMEPATH APPDATA LOCALAPPDATA PROGRAMDATA USER USERNAME LOGNAME LANG LC_ALL CLAUDE_CONFIG_DIR CLAUDE_CODE_OAUTH_TOKEN'.split(' '),
);

/** The reduced environment of the CLI. */
export function cliEnv(source: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return Object.fromEntries(Object.entries(source).filter(([k]) => CLI_ENV.has(k.toUpperCase())));
}

/** Why the `init` of a run says it has something to act with; a list it does not give counts as a breach. */
export function isolationBreach(init: Record<string, unknown>): string | undefined {
  for (const k of ['tools', 'mcp_servers', 'skills', 'slash_commands']) {
    const list = init[k];
    if (!Array.isArray(list)) return `la CLI non dice ${k}`;
    if (list.length) return `la CLI ha ${k}: ${list.length}`;
  }
  // The CLI's own plugins come with it; whatever comes from the machine does not.
  const plugins = init.plugins;
  if (!Array.isArray(plugins)) return 'la CLI non dice plugins';
  if (plugins.some((p) => p?.path !== 'builtin')) return 'la CLI ha plugin della macchina';
  return undefined;
}

/**
 * The confirmation of each run: the events of the CLI, as they come. Its `init` comes before the model is called and must
 * have nothing to act with in it; a hook that runs or a tool the model asks for are a breach too, whenever.
 */
export class IsolationCheck {
  confirmed = false;
  breach?: string;
  /** Why the run would not pay as it was told (T542): its `init` says another source of the key; it is stopped before the model. */
  billing?: string;
  /** The model the `init` says. */
  model?: string;

  /** `ANTHROPIC_API_KEY` when the run pays with the API, `none` on the subscription (what the CLI's `init` says, T542). */
  constructor(private readonly pays: 'ANTHROPIC_API_KEY' | 'none' = 'none') {}

  /** A line of the output; true when the run has to be stopped. */
  see(line: string): boolean {
    if (this.billing) return true; // stopped at its init: what comes after it is not the model's
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(line);
    } catch {
      return false; // not an event
    }
    if (!event || typeof event !== 'object') return false;
    if (event.type === 'system' && event.subtype === 'init') {
      this.breach ??= isolationBreach(event);
      if (typeof event.model === 'string') this.model = event.model;
      // A CLI that does not say it is taken at its word only on the subscription: with the key it has to say it pays with it.
      const source = event.apiKeySource;
      if (source === undefined ? this.pays !== 'none' : source !== this.pays) this.billing ??= `la CLI paga con ${String(source ?? 'niente che dica')}, non con ${this.pays === 'none' ? 'l’abbonamento' : this.pays}`;
      this.confirmed = !this.breach && !this.billing;
      if (this.billing) return true;
    } else if (typeof event.subtype === 'string' && event.subtype.startsWith('hook')) {
      this.breach ??= 'è partito un hook';
    } else if (event.type === 'assistant') {
      if (!this.confirmed) this.breach ??= 'il modello risponde prima della conferma';
      const content = (event.message as { content?: unknown } | undefined)?.content;
      if (Array.isArray(content) && content.some((c) => c?.type === 'tool_use' || c?.type === 'server_tool_use')) this.breach ??= 'il modello ha chiesto uno strumento';
    }
    return !!this.breach;
  }
}

/** Extracts token usage metrics reported by the CLI in its JSON output envelope. */
export function extractUsage(rawJson: unknown): QueuedAnswer['usage'] | undefined {
  if (!rawJson || typeof rawJson !== 'object') return undefined;
  const obj = rawJson as Record<string, unknown>;
  const u = (obj.usage ?? obj.stats ?? obj) as Record<string, unknown>;
  if (!u || typeof u !== 'object') return undefined;

  // Claude's CLI says apart the prompt's tokens it wrote to its cache (`cache_creation_input_tokens`): they are input too (T411), read or not.
  const written = Number(u.cache_creation_input_tokens);
  const said = u.input_tokens ?? u.prompt_tokens ?? u.prompt ?? u.inputTokens;
  const prompt = said !== undefined && Number.isFinite(written) && written > 0 ? Number(said) + written : said;
  const output = u.output_tokens ?? u.completion_tokens ?? u.output ?? u.outputTokens;
  const cached = u.cache_read_tokens ?? u.cache_read_input_tokens ?? u.cached ?? u.cachedTokens;
  const thoughts = u.thinking_tokens ?? u.thoughtTokens ?? u.thoughts;

  if (prompt !== undefined || output !== undefined || cached !== undefined || thoughts !== undefined) {
    return {
      ...(prompt !== undefined ? { prompt: Number(prompt) } : {}),
      ...(output !== undefined ? { output: Number(output) } : {}),
      ...(cached !== undefined ? { cached: Number(cached) } : {}),
      ...(thoughts !== undefined ? { thoughts: Number(thoughts) } : {}),
    };
  }
  return undefined;
}

/** Reads the JSON output produced by claude or agy with --output-format json. */
export function readCliOutput(text: string): {
  result: string;
  error?: string | boolean;
  usage?: QueuedAnswer['usage'];
  rawJson?: unknown;
} {
  let json: Record<string, unknown> | undefined;
  // With its events the answer is the `result`, and something else may come after it.
  for (const line of text.trim().split('\n').reverse()) {
    try {
      const v = JSON.parse(line);
      if (v && typeof v === 'object') {
        json ??= v;
        if (v.type === 'result') {
          json = v;
          break;
        }
      }
    } catch {
      /* not JSON */
    }
  }
  if (!json) {
    try {
      const v = JSON.parse(text);
      if (v && typeof v === 'object') json = v;
    } catch {
      json = undefined;
    }
  }

  const result = String(json?.result ?? json?.response ?? json?.text ?? text);
  const error = (json?.is_error as boolean) ?? json?.error ?? (json?.status === 'ERROR');

  return {
    result,
    error: error ? (typeof error === 'string' ? error : true) : undefined,
    usage: extractUsage(json),
    rawJson: json,
  };
}

/** Executes a CLI process non-interactively and gathers stdout/stderr; `onLine` returning true stops it there. */
export function runCli(opts: { cmd: string; args: string[]; stdin?: string; cwd?: string; env?: NodeJS.ProcessEnv; timeoutMs?: number; onLine?: (line: string) => boolean }): Promise<CliRunResult> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let pending = '';

    const child = spawn(opts.cmd, opts.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      ...(opts.cwd ? { cwd: opts.cwd } : {}),
      ...(opts.env ? { env: opts.env } : {}),
    });

    const kill = () => {
      try {
        if (process.platform === 'win32' && child.pid) {
          execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
        } else if (child.pid) {
          child.kill('SIGTERM');
        }
      } catch {
        /* already exited */
      }
    };

    child.stdin?.on('error', () => undefined); // a CLI that exits without reading
    child.stdin?.end(opts.stdin ?? '');

    child.stdout?.setEncoding('utf8');
    child.stdout?.on('data', (d: string) => {
      stdout += d;
      if (!opts.onLine) return;
      const lines = (pending + d).split('\n');
      pending = lines.pop() ?? '';
      if (lines.some((l) => opts.onLine!(l))) kill();
    });
    child.stderr?.on('data', (d) => { stderr += d.toString(); });

    let timer: NodeJS.Timeout | undefined;
    if (opts.timeoutMs && opts.timeoutMs > 0) timer = setTimeout(kill, opts.timeoutMs);

    child.on('error', (err) => {
      if (timer) clearTimeout(timer);
      resolve({
        code: -1,
        stdout,
        stderr: `${stderr}\n${err.message}`.trim(),
        combined: `${stdout}\n${stderr}\n${err.message}`.trim(),
      });
    });

    child.on('close', (code) => {
      if (timer) clearTimeout(timer);
      if (pending) opts.onLine?.(pending); // the last line, without its newline
      resolve({
        code,
        stdout,
        stderr,
        combined: `${stdout}\n${stderr}`.trim(),
      });
    });
  });
}

/** What one isolated run gave: `raw` is the CLI's last event (the `result`, with its usage per model), for who prices it (T391). */
export interface IsolatedRun {
  status: 'ok' | 'error' | 'limit' | 'isolation' | 'billing';
  text?: string;
  errore?: string;
  reset?: Date;
  usage?: QueuedAnswer['usage'];
  raw?: unknown;
  /** The model the run's `init` said (who prices a run whose request named none, T542). */
  model?: string;
}

/**
 * One request through the isolated CLI, without the queue (T391): an empty folder, the reduced environment, the confirmation of
 * each run. The queue serves with it (`serveOne`); the bench of the Sculptor too, with the model, the effort and the images it chooses.
 */
export async function runIsolated(
  provider: SubscriptionProvider,
  req: Pick<QueuedRequest, 'system' | 'prompt' | 'schema' | 'images'> & Partial<QueuedRequest>,
  opts: { cmd?: string; timeoutMs?: number; choice?: CliChoice; apiKey?: string; workspace?: string } = {},
): Promise<IsolatedRun> {
  const run = await runChecked(provider, req, opts);
  // The key is not in what the CLI says, but if it ever were it would not go further (T542).
  return opts.apiKey ? { ...run, ...(run.text !== undefined ? { text: redact(run.text, opts.apiKey) } : {}), ...(run.errore ? { errore: redact(run.errore, opts.apiKey) } : {}) } : run;
}

async function runChecked(
  provider: SubscriptionProvider,
  req: Pick<QueuedRequest, 'system' | 'prompt' | 'schema' | 'images'> & Partial<QueuedRequest>,
  opts: { cmd?: string; timeoutMs?: number; choice?: CliChoice; apiKey?: string; workspace?: string },
): Promise<IsolatedRun> {
  const check = new IsolationCheck(opts.apiKey ? 'ANTHROPIC_API_KEY' : 'none');
  const { root, empty } = await runFolders('quine-coda-');
  let run: CliRunResult;
  try {
    const command = buildCliCommand(provider, req, opts.cmd, opts.choice, root);
    await writeSystemPrompt(command);
    run = await runCli({ cmd: command.cmd, args: command.args, stdin: command.stdin, cwd: empty, env: childEnv(cliEnv(process.env), opts.apiKey, opts.workspace), timeoutMs: opts.timeoutMs ?? 15 * 60_000, onLine: (l) => check.see(l) });
  } finally {
    // The folders go with the system prompt, whatever happened.
    await fs.rm(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }).catch(() => undefined);
  }

  // 0. It had something to act with: no answer from that run, and no more runs.
  if (check.breach) return { status: 'isolation', errore: `isolamento della CLI non confermato: ${check.breach}` };
  // 0b. It would not pay as told: stopped at its `init`, before the model (T542).
  if (check.billing) return { status: 'billing', errore: check.billing };
  const model = check.model ? { model: check.model } : {};

  // 1. Subscription usage limit check
  const reset = usageLimit(cliSaid(run.combined));
  if (reset) return { status: 'limit', errore: `limite abbonamento ${provider} raggiunto, reset alle ${reset.toISOString()}`, reset };

  // 2. Process failure, or a run that never said what it had
  const parsed = readCliOutput(run.stdout || run.stderr);
  const raw = parsed.rawJson;
  if (run.code === 0 && !check.confirmed) return { status: 'isolation', errore: 'isolamento della CLI non confermato: nessun evento di avvio' };
  if (run.code !== 0 || parsed.error) {
    // A `result` that says it is an error says why in its text (an unknown model, T391).
    const said = parsed.error === true && (raw as { type?: unknown } | undefined)?.type === 'result' ? parsed.result.trim() : '';
    const detail = typeof parsed.error === 'string'
      ? parsed.error
      : (said || run.stderr.trim() || run.stdout.trim() || `codice di uscita ${run.code}`);
    return { status: 'error', errore: `errore CLI (${provider}): ${detail}`, usage: parsed.usage, raw, ...model };
  }

  // 3. Success: validate schema if required, or take raw text
  let text = parsed.result;
  if (req.schema) {
    try {
      text = JSON.stringify(parseJson(parsed.result));
    } catch (e) {
      return { status: 'error', errore: `la CLI non ha prodotto un JSON valido conforme allo schema: ${(e as Error).message}`, usage: parsed.usage, raw, ...model };
    }
  } else {
    text = text.trim();
    if (!text) return { status: 'error', errore: 'risposta vuota dalla CLI', usage: parsed.usage, raw, ...model };
  }
  return { status: 'ok', text, usage: parsed.usage, raw, ...model };
}

/**
 * Takes the oldest request for this provider and serves it through the CLI. The model and the effort the request says (T411, ADR-0216: one
 * of the lists, `checkRequest` read again here, as the file on disk may not have come through the queue) and its images, as one message of
 * events (T391's way, `imageBlock`: png or jpeg data URLs only); the CLI has nothing to act with whatever the request says (ADR-0106).
 * Paid with the API (T542), nothing is taken past the ceiling, and every run that says its tokens goes into the ledger.
 */
export async function serveOne(
  dir: string,
  provider: SubscriptionProvider,
  opts: { cmd?: string; timeoutMs?: number; api?: ApiSettings; now?: () => Date } = {},
): Promise<ServeStepResult> {
  const { take, checkRequest } = await import('../../server/subscriptionQueue');
  const now = opts.now ?? (() => new Date());
  if (opts.api && capReached(readLedger(dir), opts.api.cap, now())) {
    return { served: false, status: 'cap', errore: `tetto dei crediti API raggiunto: ${dollars(spentIn(readLedger(dir), now()).speso)} di ${dollars(opts.api.cap)} questo mese` };
  }
  const req = await take(dir, provider);
  if (!req) return { served: false };

  const refused = checkRequest(req);
  if (refused) {
    await answer(dir, req.id, { errore: refused });
    return { served: true, id: req.id, status: 'error', errore: refused };
  }
  const choice: CliChoice = { ...(req.model ? { model: req.model } : {}), ...(req.effort ? { effort: req.effort } : {}), images: !!req.images?.length };
  let r: IsolatedRun;
  try {
    r = await runIsolated(provider, req, { cmd: opts.cmd, timeoutMs: opts.timeoutMs, choice, ...(opts.api ? { apiKey: opts.api.key, ...(opts.api.workspace ? { workspace: opts.api.workspace } : {}) } : {}) });
  } catch (e) {
    // An image that is not one (`imageBlock`), a choice the CLI could misread: the request fails, the process goes on serving.
    r = { status: 'error', errore: `richiesta non servita: ${(e as Error).message}` };
  }
  let status: ServeStepResult['status'] = r.status;
  if (opts.api) {
    if (r.raw !== undefined) {
      const priced = priceRun(r.raw, req.model ?? r.model ?? 'claude-opus-5-5');
      recordCall(dir, {
        id: req.id,
        ...(req.task ? { task: req.task } : {}),
        ...priced,
        usd: priced.usd ?? priced.usdCli ?? 0,
        esito: r.status,
      }, now());
    }
    if (r.errore && NO_WORKSPACE.test(r.errore)) {
      // A key of no workspace wants the header with the workspace's id: no request is served until the `.env` says it.
      status = 'billing';
      r = { ...r, errore: `la chiave API non è di un workspace: scrivi ANTHROPIC_WORKSPACE_ID nel .env (l’id del workspace nella console di Anthropic) o usa una chiave di un workspace; l’API dice: ${r.errore}` };
    } else if (r.errore && CREDITS_OVER.test(r.errore)) {
      status = 'cap';
      markLedger(dir, { fermo: { motivo: 'i crediti API sono finiti (lo dice l’API)', t: now().toISOString() } });
    }
  }
  await answer(dir, req.id, r.status === 'ok' ? { text: r.text, usage: r.usage } : { errore: r.errore, ...(r.usage ? { usage: r.usage } : {}) });
  return {
    served: true,
    id: req.id,
    status,
    ...(r.text !== undefined ? { text: r.text } : {}),
    ...(r.errore ? { errore: r.errore } : {}),
    ...(r.reset ? { reset: r.reset } : {}),
    ...(r.usage ? { usage: r.usage } : {}),
  };
}

function providerArg(p: string): SubscriptionProvider {
  if (p === 'claude') return p;
  if (p === 'antigravity') throw new Error('Antigravity non serve la coda: la sua CLI non può escludere gli strumenti (ADR-0106).');
  throw new Error(`Provider non valido: ${p}. Provider supportato: claude`);
}

/** Parses CLI arguments for running the serving daemon. */
export function parseArgs(argv: string[]): ServeOptions {
  const defaultDir = serverPath(path.resolve(process.cwd(), 'universes'), 'queue');
  let provider: SubscriptionProvider = 'claude';
  let dir = defaultDir;
  let cmd: string | undefined;
  let pollMs = 1000;
  let beatMs = 10_000;
  let timeoutMs = 15 * 60_000;
  let once = false;
  const apiAsk: { api: boolean; cap?: number; envFile?: string } = { api: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--provider' && argv[i + 1]) {
      provider = providerArg(argv[++i]);
    } else if (arg.startsWith('--provider=')) {
      provider = providerArg(arg.slice('--provider='.length));
    } else if (arg === '--coda' && argv[i + 1]) {
      dir = path.resolve(argv[++i]);
    } else if (arg.startsWith('--coda=')) {
      dir = path.resolve(arg.slice('--coda='.length));
    } else if (arg === '--cmd' && argv[i + 1]) {
      cmd = argv[++i];
    } else if (arg === '--poll' && argv[i + 1]) {
      pollMs = Number(argv[++i]);
    } else if (arg === '--beat' && argv[i + 1]) {
      beatMs = Number(argv[++i]);
    } else if (arg === '--timeout' && argv[i + 1]) {
      timeoutMs = Number(argv[++i]);
    } else if (arg === '--once') {
      once = true;
    } else if (arg === '--api') {
      apiAsk.api = true;
    } else if (arg === '--tetto-api' && argv[i + 1]) {
      apiAsk.cap = Number(argv[++i]);
    } else if (arg.startsWith('--tetto-api=')) {
      apiAsk.cap = Number(arg.slice('--tetto-api='.length));
    } else if (arg === '--env' && argv[i + 1]) {
      apiAsk.envFile = argv[++i];
    }
  }

  return { provider, dir, cmd, pollMs, beatMs, timeoutMs, once, apiAsk };
}

/** The main serving loop: beats heartbeat every 10s and serves queued requests. */
export async function serve(opts: ServeOptions): Promise<void> {
  const { provider, dir, beatMs = 10_000, pollMs = 1000, once = false } = opts;
  let running = true;

  const api = opts.api;
  const cleanup = async () => {
    running = false;
    if (api) markLedger(dir, { servitore: undefined });
    try {
      await fs.unlink(path.join(dir, `servitore-${provider}.json`));
    } catch {
      /* ignore */
    }
  };

  process.on('SIGINT', () => { cleanup().then(() => process.exit(0)); });
  process.on('SIGTERM', () => { cleanup().then(() => process.exit(0)); });

  console.log(`[servi] Avvio servitore per «${provider}» su ${dir} (battito ogni ${Math.round(beatMs / 1000)}s)...`);
  const spent = () => `speso ${dollars(spentIn(readLedger(dir)).speso)} di ${dollars(api!.cap)} questo mese (la CLI dice ${dollars(spentIn(readLedger(dir)).spesoCli)})`;
  if (api) {
    // Where the key comes from, never the key.
    console.log(`[servi] Pagata coi crediti API di Anthropic (${API_KEY_NAME} da ${api.from}${api.workspace ? `, workspace ${api.workspace}` : ''}), ${spent()}`);
    if (capReached(readLedger(dir), api.cap)) {
      console.warn('[servi] Il tetto dei crediti API è già raggiunto: non servo.');
      return;
    }
    markLedger(dir, { tetto: api.cap, servitore: { pid: process.pid, dal: new Date().toISOString() }, fermo: undefined });
  }
  await beat(dir, provider);
  let lastBeat = Date.now();

  while (running) {
    if (Date.now() - lastBeat >= beatMs) {
      await beat(dir, provider);
      lastBeat = Date.now();
    }

    const step = await serveOne(dir, provider, { cmd: opts.cmd, timeoutMs: opts.timeoutMs, ...(api ? { api } : {}) });

    if (step.status === 'cap') {
      // Past the ceiling, or the credits are over: the queue stops serving, and whoever waits on it sees nobody serves it.
      console.warn(`[servi] Mi fermo: ${step.errore ?? 'i crediti API sono finiti'}${api ? `, ${spent()}` : ''}.`);
      if (api && !readLedger(dir).fermo) markLedger(dir, { fermo: { motivo: step.errore ?? 'tetto raggiunto', t: new Date().toISOString() } });
      await cleanup();
      return;
    }
    if (step.served) {
      console.log(`[servi] Richiesta ${step.id}: ${step.status}${step.errore ? ` (${step.errore})` : ''}${api ? `, ${spent()}` : ''}`);
      if (step.status === 'isolation') {
        await cleanup();
        throw new Error(`mi fermo, non servo una CLI che può agire: ${step.errore}`);
      }
      if (step.status === 'billing') {
        await cleanup();
        throw new Error(`mi fermo, la CLI non paga come le è detto: ${step.errore}`);
      }
      if (step.status === 'limit' && step.reset) {
        const pauseUntil = step.reset.getTime();
        const pauseSeconds = Math.max(0, Math.round((pauseUntil - Date.now()) / 1000));
        console.warn(`[servi] Limite raggiunto per ${provider}. Pausa fino al reset: ${step.reset.toISOString()} (~${pauseSeconds}s)...`);

        while (running && Date.now() < pauseUntil) {
          const waitChunk = Math.min(beatMs, pauseUntil - Date.now());
          if (waitChunk <= 0) break;
          await sleep(waitChunk);
          await beat(dir, provider);
          lastBeat = Date.now();
        }
        console.log(`[servi] Ripresa del servizio per ${provider}.`);
      }
      continue;
    }

    if (once) break;
    await sleep(pollMs);
  }

  await cleanup();
}

// When executed directly as entrypoint script via vite-node
if (!process.env.VITEST && process.argv[1] && (process.argv[1].endsWith('servi.ts') || process.argv[1].endsWith('servi.mjs'))) {
  try {
    const opts = parseArgs(process.argv.slice(2));
    const api = apiSettings(opts.apiAsk ?? { api: false });
    if (typeof api === 'string') throw new Error(api);
    if (api) opts.api = api;
    serve(opts).catch((err) => {
      console.error('[servi] Errore fatale:', err);
      process.exit(1);
    });
  } catch (err) {
    console.error('[servi]', (err as Error).message);
    process.exit(1);
  }
}
