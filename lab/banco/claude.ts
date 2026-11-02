// A trial of the prompt without any other context (T154): `claude -p` from an empty folder, with the same isolation as the subscriptions'
// queue (ADR-0106): no tools, no MCP, no hooks, no settings, no files of the project, a reduced environment, confirmed by the CLI's own `init`.

import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { cliEnv, IsolationCheck, ISOLATION_ARGS, runCli } from '../../tools/abbonamenti/servi';
// @ts-expect-error pipeline.mjs is untyped plain JS
import { usageLimit } from '../../tools/pipeline/pipeline.mjs';

export interface Token {
  /** Input not read from the cache. */
  input: number;
  cacheScritta: number;
  cacheLetta: number;
  output: number;
  /** All the input the prompt and the target took: what the prompt is optimised for. */
  inputTotale: number;
}

export interface Risposta {
  testo: string;
  token: Token;
  modello?: string;
  dollari?: number;
  ms: number;
}

export class LimiteAbbonamento extends Error {
  constructor(readonly reset: Date) {
    super(`limite dell'abbonamento, riparte alle ${reset.toISOString()}`);
  }
}

/** The tokens in the last event of a run: the CLI counts the input in three parts, and the cached ones are most of it. */
export function leggiToken(usage: Record<string, unknown> | undefined): Token {
  const n = (k: string) => Number(usage?.[k]) || 0;
  const input = n('input_tokens'), cacheScritta = n('cache_creation_input_tokens'), cacheLetta = n('cache_read_input_tokens');
  return { input, cacheScritta, cacheLetta, output: n('output_tokens'), inputTotale: input + cacheScritta + cacheLetta };
}

/** Reads the events of a run: the answer, the tokens, the model that gave them. */
export function leggiEventi(stdout: string): { testo?: string; errore?: string; token: Token; modello?: string; dollari?: number } {
  let modello: string | undefined;
  let fine: Record<string, unknown> | undefined;
  for (const line of stdout.split('\n')) {
    try {
      const e = JSON.parse(line);
      if (e?.type === 'system' && e.subtype === 'init') modello = e.model;
      if (e?.type === 'result') fine = e;
    } catch {
      /* not an event */
    }
  }
  const token = leggiToken(fine?.usage as Record<string, unknown> | undefined);
  const dollari = typeof fine?.total_cost_usd === 'number' ? fine.total_cost_usd : undefined;
  const base = { token, ...(modello ? { modello } : {}), ...(dollari !== undefined ? { dollari } : {}) };
  if (!fine) return { ...base, errore: 'nessun risultato dalla CLI' };
  if (fine.is_error) return { ...base, errore: String(fine.result ?? fine.subtype ?? 'errore') };
  return { ...base, testo: String(fine.result ?? '') };
}

export async function chiedi(system: string, bersaglio: string, opts: { modello?: string; timeoutMs?: number } = {}): Promise<Risposta> {
  const args = [...ISOLATION_ARGS, '--system-prompt', system, ...(opts.modello ? ['--model', opts.modello] : [])];
  const check = new IsolationCheck();
  const vuota = await fs.mkdtemp(path.join(os.tmpdir(), 'quine-banco-'));
  const t0 = Date.now();
  const run = await runCli({ cmd: 'claude', args, stdin: bersaglio, cwd: vuota, env: cliEnv(process.env), timeoutMs: opts.timeoutMs ?? 15 * 60_000, onLine: (l) => check.see(l) });
  await fs.rm(vuota, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }).catch(() => undefined);
  if (check.breach) throw new Error(`isolamento della CLI non confermato: ${check.breach}`);
  const reset = usageLimit(run.combined);
  if (reset) throw new LimiteAbbonamento(reset);
  const letto = leggiEventi(run.stdout);
  if (run.code === 0 && !check.confirmed) throw new Error('isolamento della CLI non confermato: nessun evento di avvio');
  if (run.code !== 0 || letto.errore || letto.testo === undefined) throw new Error(`errore della CLI: ${letto.errore ?? (run.stderr.trim() || `codice ${run.code}`)}`);
  return { testo: letto.testo, token: letto.token, ...(letto.modello ? { modello: letto.modello } : {}), ...(letto.dollari !== undefined ? { dollari: letto.dollari } : {}), ms: Date.now() - t0 };
}
