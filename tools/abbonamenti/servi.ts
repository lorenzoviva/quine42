// The process that serves the Council's slow queue with subscription CLIs (T68b, ADR-0077).
// Runs non-interactively without tools (Claude Code or Antigravity), answers via /api/coda disk protocol,
// extracts token usage, repairs schemas with parseJson, and pauses upon hitting subscription limits.

import { execFileSync, spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
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
  status?: 'ok' | 'error' | 'limit';
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

/** Builds the non-interactive CLI command and arguments for the chosen subscription provider. */
export function buildCliCommand(
  provider: SubscriptionProvider,
  req: QueuedRequest,
  customCmd?: string,
): CliCommand {
  const p = promptWithSchema(req.prompt, req.schema);
  const rawCmd = customCmd ?? (provider === 'claude' ? 'claude' : 'agy');
  const parts = rawCmd.trim().split(/\s+/).filter(Boolean);
  const cmd = parts[0];
  const prefixArgs = parts.slice(1);

  if (provider === 'claude') {
    // Non-interactive (-p), json output, no tools (--tools "").
    const args = [...prefixArgs, '-p', p, '--output-format', 'json', '--tools', ''];
    if (req.system) {
      args.push('--system-prompt', req.system);
    }
    return { cmd, args };
  } else {
    const fullPrompt = req.system ? `System:\n${req.system}\n\nUser:\n${p}` : p;
    // Antigravity print mode: --output-format json before -p.
    const args = [...prefixArgs, '--output-format', 'json', '-p', fullPrompt];
    return { cmd, args };
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
  for (const line of text.trim().split('\n').reverse()) {
    try {
      const v = JSON.parse(line);
      if (v && typeof v === 'object') {
        json = v;
        break;
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

/** Executes a CLI process non-interactively and gathers stdout/stderr. */
export function runCli(opts: { cmd: string; args: string[]; timeoutMs?: number }): Promise<CliRunResult> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';

    const child = spawn(opts.cmd, opts.args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    child.stdout?.on('data', (d) => { stdout += d.toString(); });
    child.stderr?.on('data', (d) => { stderr += d.toString(); });

    let timer: NodeJS.Timeout | undefined;
    if (opts.timeoutMs && opts.timeoutMs > 0) {
      timer = setTimeout(() => {
        try {
          if (process.platform === 'win32' && child.pid) {
            execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
          } else if (child.pid) {
            child.kill('SIGTERM');
          }
        } catch {
          /* already exited */
        }
      }, opts.timeoutMs);
    }

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

  // Images check: neither Claude Code nor Antigravity CLI accepts images in print mode.
  if (req.images && req.images.length > 0) {
    const errore = `la CLI di ${provider} non supporta immagini da riga di comando`;
    await answer(dir, req.id, { errore });
    return { served: true, id: req.id, status: 'error', errore };
  }

  const { cmd, args } = buildCliCommand(provider, req, opts.cmd);
  const run = await runCli({ cmd, args, timeoutMs: opts.timeoutMs ?? 15 * 60_000 });

  // 1. Subscription usage limit check
  const reset = usageLimit(run.combined);
  if (reset) {
    const errore = `limite abbonamento ${provider} raggiunto, reset alle ${reset.toISOString()}`;
    await answer(dir, req.id, { errore });
    return { served: true, id: req.id, status: 'limit', errore, reset };
  }

  // 2. Process failure
  const parsed = readCliOutput(run.stdout || run.stderr);
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
      const p = argv[++i];
      if (p !== 'claude' && p !== 'antigravity') {
        throw new Error(`Provider non valido: ${p}. Provider supportati: claude, antigravity`);
      }
      provider = p;
    } else if (arg.startsWith('--provider=')) {
      const p = arg.slice('--provider='.length);
      if (p !== 'claude' && p !== 'antigravity') {
        throw new Error(`Provider non valido: ${p}. Provider supportati: claude, antigravity`);
      }
      provider = p;
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
