// The process that serves the Council's slow queue with a subscription's CLI (T68b, ADR-0077).
// Runs Claude Code non-interactively, answers via /api/coda disk protocol, extracts token usage, repairs schemas with
// parseJson, and pauses upon hitting subscription limits.
//
// What it runs may be dictated by whoever plays, so the CLI gets nothing to act with (ADR-0102): an empty folder, a reduced
// environment, no tools, no MCP, no hooks, no customization, the text on stdin; and each run has to confirm it (`IsolationCheck`),
// before the model is called, or it is killed. Antigravity cannot exclude its tools: it does not serve the queue.

import { execFileSync, spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { answer, beat, type QueuedRequest } from '../../server/subscriptionQueue';
import { parseJson } from '../../src/kernel/ai/models';
import type { Provider, QueuedAnswer } from '../../src/kernel/ai/subscription';
// @ts-expect-error pipeline.mjs is untyped plain JS
import { usageLimit } from '../pipeline/pipeline.mjs';

export type SubscriptionProvider = Exclude<Provider, 'api'>;

export interface ServeOptions {
  provider: SubscriptionProvider;
  dir: string;
  cmd?: string;
  pollMs?: number;
  beatMs?: number;
  timeoutMs?: number;
  once?: boolean;
}

export interface CliCommand {
  cmd: string;
  args: string[];
  /** What the CLI reads as its prompt: never an argument, where a text beginning with a dash could become an option. */
  stdin: string;
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
  /** `isolation`: the CLI did not confirm it has nothing to act with; the process stops serving. */
  status?: 'ok' | 'error' | 'limit' | 'isolation';
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

/** Builds the non-interactive CLI command and arguments for the chosen subscription provider. */
export function buildCliCommand(
  provider: SubscriptionProvider,
  req: QueuedRequest,
  customCmd?: string,
): CliCommand {
  if (provider !== 'claude') throw new Error(`${String(provider)} non serve la coda: non può escludere gli strumenti`);
  const parts = (customCmd ?? 'claude').trim().split(/\s+/).filter(Boolean);
  // `--system-prompt` takes the next argument whatever it says.
  const args = [...parts.slice(1), ...ISOLATION_ARGS, ...(req.system ? ['--system-prompt', req.system] : [])];
  return { cmd: parts[0], args, stdin: promptWithSchema(req.prompt, req.schema) };
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

  /** A line of the output; true when the run has to be stopped. */
  see(line: string): boolean {
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(line);
    } catch {
      return false; // not an event
    }
    if (!event || typeof event !== 'object') return false;
    if (event.type === 'system' && event.subtype === 'init') {
      this.breach ??= isolationBreach(event);
      this.confirmed = !this.breach;
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

  const prompt = u.input_tokens ?? u.prompt_tokens ?? u.prompt ?? u.inputTokens;
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
          execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
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

/** Takes the oldest request for this provider and serves it through the CLI. */
export async function serveOne(
  dir: string,
  provider: SubscriptionProvider,
  opts: { cmd?: string; timeoutMs?: number } = {},
): Promise<ServeStepResult> {
  const { take } = await import('../../server/subscriptionQueue');
  const req = await take(dir, provider);
  if (!req) return { served: false };

  // Images check: Claude Code does not accept images in print mode.
  if (req.images && req.images.length > 0) {
    const errore = `la CLI di ${provider} non supporta immagini da riga di comando`;
    await answer(dir, req.id, { errore });
    return { served: true, id: req.id, status: 'error', errore };
  }

  const { cmd, args, stdin } = buildCliCommand(provider, req, opts.cmd);
  const check = new IsolationCheck();
  const empty = await fs.mkdtemp(path.join(os.tmpdir(), 'quine-coda-'));
  const run = await runCli({ cmd, args, stdin, cwd: empty, env: cliEnv(process.env), timeoutMs: opts.timeoutMs ?? 15 * 60_000, onLine: (l) => check.see(l) });
  await fs.rm(empty, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }).catch(() => undefined);

  // 0. It had something to act with: no answer from that run, and no more runs.
  if (check.breach) {
    const errore = `isolamento della CLI non confermato: ${check.breach}`;
    await answer(dir, req.id, { errore });
    return { served: true, id: req.id, status: 'isolation', errore };
  }

  // 1. Subscription usage limit check
  const reset = usageLimit(run.combined);
  if (reset) {
    const errore = `limite abbonamento ${provider} raggiunto, reset alle ${reset.toISOString()}`;
    await answer(dir, req.id, { errore });
    return { served: true, id: req.id, status: 'limit', errore, reset };
  }

  // 2. Process failure, or a run that never said what it had
  const parsed = readCliOutput(run.stdout || run.stderr);
  if (run.code === 0 && !check.confirmed) {
    const errore = 'isolamento della CLI non confermato: nessun evento di avvio';
    await answer(dir, req.id, { errore });
    return { served: true, id: req.id, status: 'isolation', errore };
  }
  if (run.code !== 0 || parsed.error) {
    const detail = typeof parsed.error === 'string'
      ? parsed.error
      : (run.stderr.trim() || run.stdout.trim() || `codice di uscita ${run.code}`);
    const errore = `errore CLI (${provider}): ${detail}`;
    await answer(dir, req.id, { errore });
    return { served: true, id: req.id, status: 'error', errore };
  }

  // 3. Success: validate schema if required, or take raw text
  let text = parsed.result;
  if (req.schema) {
    try {
      const obj = parseJson(parsed.result);
      text = JSON.stringify(obj);
    } catch (e) {
      const errore = `la CLI non ha prodotto un JSON valido conforme allo schema: ${(e as Error).message}`;
      await answer(dir, req.id, { errore, usage: parsed.usage });
      return { served: true, id: req.id, status: 'error', errore, usage: parsed.usage };
    }
  } else {
    text = text.trim();
    if (!text) {
      const errore = 'risposta vuota dalla CLI';
      await answer(dir, req.id, { errore, usage: parsed.usage });
      return { served: true, id: req.id, status: 'error', errore, usage: parsed.usage };
    }
  }

  await answer(dir, req.id, { text, usage: parsed.usage });
  return { served: true, id: req.id, status: 'ok', text, usage: parsed.usage };
}

function providerArg(p: string): SubscriptionProvider {
  if (p === 'claude') return p;
  if (p === 'antigravity') throw new Error('Antigravity non serve la coda: la sua CLI non può escludere gli strumenti (ADR-0102).');
  throw new Error(`Provider non valido: ${p}. Provider supportato: claude`);
}

/** Parses CLI arguments for running the serving daemon. */
export function parseArgs(argv: string[]): ServeOptions {
  const defaultDir = path.resolve(process.cwd(), 'universes', '.coda');
  let provider: SubscriptionProvider = 'claude';
  let dir = defaultDir;
  let cmd: string | undefined;
  let pollMs = 1000;
  let beatMs = 10_000;
  let timeoutMs = 15 * 60_000;
  let once = false;

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
    }
  }

  return { provider, dir, cmd, pollMs, beatMs, timeoutMs, once };
}

/** The main serving loop: beats heartbeat every 10s and serves queued requests. */
export async function serve(opts: ServeOptions): Promise<void> {
  const { provider, dir, beatMs = 10_000, pollMs = 1000, once = false } = opts;
  let running = true;

  const cleanup = async () => {
    running = false;
    try {
      await fs.unlink(path.join(dir, `servitore-${provider}.json`));
    } catch {
      /* ignore */
    }
  };

  process.on('SIGINT', () => { cleanup().then(() => process.exit(0)); });
  process.on('SIGTERM', () => { cleanup().then(() => process.exit(0)); });

  console.log(`[servi] Avvio servitore per «${provider}» su ${dir} (battito ogni ${Math.round(beatMs / 1000)}s)...`);
  await beat(dir, provider);
  let lastBeat = Date.now();

  while (running) {
    if (Date.now() - lastBeat >= beatMs) {
      await beat(dir, provider);
      lastBeat = Date.now();
    }

    const step = await serveOne(dir, provider, { cmd: opts.cmd, timeoutMs: opts.timeoutMs });

    if (step.served) {
      console.log(`[servi] Richiesta ${step.id}: ${step.status}${step.errore ? ` (${step.errore})` : ''}`);
      if (step.status === 'isolation') {
        await cleanup();
        throw new Error(`mi fermo, non servo una CLI che può agire: ${step.errore}`);
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
// When executed directly as entrypoint script via vite-node
if (!process.env.VITEST && process.argv[1] && (process.argv[1].endsWith('servi.ts') || process.argv[1].endsWith('servi.mjs'))) {
  try {
    const opts = parseArgs(process.argv.slice(2));
    serve(opts).catch((err) => {
      console.error('[servi] Errore fatale:', err);
      process.exit(1);
    });
  } catch (err) {
    console.error('[servi]', (err as Error).message);
    process.exit(1);
  }
}
