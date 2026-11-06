// The same trial on Gemini through `agy` (T156): the bench's own prompt, trusted (ADR-0106: the queue never serves agy, because
// Antigravity cannot exclude its tools; here nothing comes from a player). From an empty folder, in its sandbox, the prompt and the
// target in one message: agy has no system prompt of its own to replace. A message too long for a command line goes in a file
// of that folder, and the message asks to read it.

import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { costOf } from '../../src/kernel/ai/prices';
import { cliEnv, runCli } from '../../tools/abbonamenti/servi';
// @ts-expect-error pipeline.mjs is untyped plain JS
import { usageLimit } from '../../tools/pipeline/pipeline.mjs';
import { LimiteAbbonamento, type Risposta, type Token } from './claude';

/** Characters of a command line on Windows, with room for the rest of the arguments. */
const LINEA = 30_000;

/** The usage agy writes at the end (`--output-format json`): thinking is billed as output by Gemini. */
export function leggiAgy(stdout: string): { testo?: string; errore?: string; token: Token & { pensiero: number }; conversazione?: string } {
  let fine: Record<string, unknown> | undefined;
  for (const line of stdout.trim().split('\n').reverse()) {
    try {
      const v = JSON.parse(line);
      if (v && typeof v === 'object' && 'status' in v) {
        fine = v;
        break;
      }
    } catch {
      /* not the answer */
    }
  }
  const u = (fine?.usage ?? {}) as Record<string, unknown>;
  const n = (k: string) => Number(u[k]) || 0;
  const letta = n('cache_read_tokens'), input = n('input_tokens'), pensiero = n('thinking_tokens');
  // `input_tokens` already counts what was read from the cache (an «ok» costs its system prompt, ~10 800).
  const token = { input: Math.max(0, input - letta), cacheScritta: 0, cacheLetta: letta, output: n('output_tokens') + pensiero, inputTotale: input, pensiero };
  const conversazione = typeof fine?.conversation_id === 'string' ? fine.conversation_id : undefined;
  if (!fine) return { token, errore: 'nessun risultato da agy' };
  if (fine.status !== 'SUCCESS') return { token, errore: String(fine.error ?? fine.status) };
  return { token, testo: String(fine.response ?? ''), ...(conversazione ? { conversazione } : {}) };
}

/** The model's id for the price list: `gemini-3.8-flash-high` → `gemini-3.8-flash`. */
export const listino = (modello: string) => modello.replace(/-(low|medium|high)$/, '');

export async function chiediAgy(system: string, bersaglio: string, opts: { modello?: string; timeoutMs?: number } = {}): Promise<Risposta & { conversazione?: string }> {
  const modello = opts.modello ?? 'gemini-3.8-flash-high';
  const vuota = await fs.mkdtemp(path.join(os.tmpdir(), 'quine-banco-agy-'));
  const intero = `${system}\n\n---\n\n${bersaglio}\n\nRispondi nel messaggio con il solo XML. Non scrivere né leggere file e non usare strumenti.`;
  let messaggio = intero;
  if (intero.length > LINEA) {
    await fs.writeFile(path.join(vuota, 'richiesta.md'), `${system}\n\n---\n\n${bersaglio}\n`);
    messaggio = 'Leggi il file richiesta.md di questa cartella: sono le istruzioni e la richiesta. Poi rispondi nel messaggio con il solo XML che chiede. Non scrivere file e non usare altri strumenti.';
  }
  const t0 = Date.now();
  const run = await runCli({ cmd: 'agy', args: ['--output-format', 'json', '--sandbox', '--disable-slash-commands', '--model', modello, '-p', messaggio], cwd: vuota, env: cliEnv(process.env), timeoutMs: opts.timeoutMs ?? 25 * 60_000 });
  await fs.rm(vuota, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }).catch(() => undefined);
  const letto = leggiAgy(run.stdout);
  if (!letto.testo) {
    const reset = usageLimit(run.combined);
    if (reset) throw new LimiteAbbonamento(reset);
  }
  if (run.code !== 0 || letto.errore || letto.testo === undefined) throw new Error(`errore di agy: ${letto.errore ?? (run.stderr.trim().slice(0, 400) || `codice ${run.code}`)}`);
  const dollari = costOf(listino(modello), { prompt: letto.token.inputTotale, cached: letto.token.cacheLetta, output: letto.token.output });
  return { testo: letto.testo, token: letto.token, modello, ...(dollari !== undefined ? { dollari } : {}), ms: Date.now() - t0, ...(letto.conversazione ? { conversazione: letto.conversazione } : {}) };
}
