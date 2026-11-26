// The Sculptor on Claude's subscription for the lab (T391, for T392): every call through the isolated CLI of the queue of the
// subscriptions (`runIsolated` of `tools/abbonamenti/servi.ts`, ADR-0077, ADR-0106: an empty folder, no tools, MCP, hooks nor
// settings, the Sculptor's system prompt in place of the CLI's, each run confirmed), with the model and the effort the bench
// chooses and the images of the revision as one message of events. The dollars are what the call would cost on Anthropic's API
// (`anthropicCost`, the list in `prices.ts`), from the tokens the CLI says; the CLI's own figure is kept beside them.
// Since T411 (ADR-0216) the queue of the game does the same when a request says them: a model and an effort of the lists, the images.

import { execFileSync } from 'node:child_process';
import type { AiModels, TextCall } from '../../src/kernel/ai/models';
import { listedModel as listed, priceRun } from '../../tools/abbonamenti/api';
import type { CallRecord } from '../../src/kernel/ai/usage';
import { runIsolated, type IsolatedRun } from '../../tools/abbonamenti/servi';
// @ts-expect-error pipeline.mjs is untyped plain JS
import { parseUsage } from '../../tools/pipeline/pipeline.mjs';

/** One call of Claude as the bench keeps it: the tokens, the dollars at the API list, the CLI's own figure. */
export interface ClaudeCall {
  model: string;
  task: string;
  seconds: number;
  input: number;
  written5m: number;
  written1h: number;
  read: number;
  output: number;
  usd?: number;
  /** `total_cost_usd` of the CLI's result (its own estimate at the API list). */
  usdCli?: number;
  errore?: string;
}

export { priceRun } from '../../tools/abbonamenti/api';

/** The counters of Claude's `/usage`: how much of the 5-hour window and of the week is used, in per cent. */
export interface ClaudeWindow {
  session?: number;
  week?: number;
  read: string;
}

/** Reads `claude -p /usage` (not a call of a model); undefined if the CLI does not answer. */
export function readWindow(cmd = 'claude'): ClaudeWindow | undefined {
  try {
    const text = execFileSync(cmd, ['-p', '/usage'], { encoding: 'utf8', timeout: 120_000, windowsHide: true });
    const counters: Array<{ nome: string; finestra: string; residuo: number }> | undefined = parseUsage('claude', text);
    if (!counters) return undefined;
    const used = (w: string) => {
      const c = counters.filter((x) => x.finestra === w);
      return c.length ? 100 - Math.min(...c.map((x) => x.residuo)) : undefined;
    };
    return { session: used('5h'), week: used('settimana'), read: new Date().toISOString() };
  } catch {
    return undefined;
  }
}

export interface ClaudeCliOptions {
  /** The CLI (a fake one for the offline proof). */
  cmd?: string;
  /** Whether the images of a revision go to the CLI (default yes); without, the revision has the views in text only. */
  images?: boolean;
  /** `--effort` of the CLI: the game's thinking (`low`) unless said. */
  effort?: string;
  timeoutMs?: number;
  /** Before each call: undefined to go on, or why the round stops (the 5-hour window over 80 %). */
  gate?: () => string | undefined;
  /** Every call, as it ends. */
  onCall?: (c: ClaudeCall, record: CallRecord) => void;
}

/**
 * The Sculptor's calls on the CLI: `call.model` is the model (`claude-…`), the system prompt goes in place of the CLI's, the images
 * of a revision go with the prompt. Throws on any status but `ok`, as a model that fails: `sculpt` gives up as in the game.
 */
export function claudeCliModels(opts: ClaudeCliOptions): (call: TextCall) => Promise<string> {
  return async (call) => {
    const model = call.model;
    if (!model || !listed(model)) throw new Error(`modello di Claude sconosciuto: ${model}`);
    const stop = opts.gate?.();
    if (stop) throw new Error(stop);
    const t0 = Date.now();
    let run: IsolatedRun;
    try {
      run = await runIsolated('claude', { system: call.system, prompt: call.prompt, schema: call.schema, images: call.images }, {
        cmd: opts.cmd,
        timeoutMs: opts.timeoutMs ?? 15 * 60_000,
        choice: { model, effort: opts.effort, images: opts.images ?? true },
      });
    } catch (e) {
      run = { status: 'error', errore: (e as Error).message };
    }
    const priced = priceRun(run.raw, model);
    const c: ClaudeCall = { ...priced, task: call.task, seconds: Math.round((Date.now() - t0) / 1000), ...(run.status !== 'ok' ? { errore: run.errore ?? run.status } : {}) };
    const record: CallRecord = {
      model,
      agent: call.agent,
      task: call.task,
      prompt: c.input + c.written5m + c.written1h + c.read,
      cached: c.read,
      output: c.output,
      thoughts: 0,
      ...(c.usd !== undefined ? { usd: c.usd } : {}),
      ...(run.status !== 'ok' ? { failed: 'errore' as const } : {}),
    };
    opts.onCall?.(c, record);
    if (run.status !== 'ok') throw new Error(run.errore ?? run.status);
    return run.text!;
  };
}

/** A model layer that sends the Sculptor's calls on a Claude model to the CLI and everything else (the Artist) to `rest`. */
export function routed(rest: AiModels, claude: (call: TextCall) => Promise<string>): AiModels {
  return {
    name: rest.name,
    get usage() { return rest.usage; },
    limits: rest.limits,
    textModel: rest.textModel,
    text: (call: TextCall) => (call.agent === 'sculptor' && call.model?.startsWith('claude-') ? claude(call) : rest.text(call)),
  };
}
