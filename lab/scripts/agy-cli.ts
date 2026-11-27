// The Sculptor on Google's subscription for the lab (T516): every call through the CLI of Antigravity (`agy`), the way T391 put Claude on
// its own CLI (`claude-cli.ts`). agy cannot leave its tools out nor take a system prompt of its own (`servi.ts`: it does not serve the
// queue), so for the bench only each call runs in a new empty folder under the temporary one, with `--sandbox` and without
// `--dangerously-skip-permissions` (a tool that asks for a permission is refused in print mode), the reduced environment of the queue
// (`cliEnv`: no key, no `.env`), the Sculptor's system prompt at the head of the one message (`--input-format stream-json`), and the
// photos of a revision as PNG files in that folder, which the model opens with `view_file` (the stream takes text blocks only).
// What the model read with a tool and every file it wrote are kept in the call. The dollars are what the tokens agy says would cost at
// the API list of Gemini 4 Neon (`NEON_LIST`, the announcement of 18/11: the kernel's `prices.ts` does not list it); the dollars of the
// Sculptor's own request at the API, without agy's prompt and tools, come from `countTokens` when the bench gives it.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AiModels, TextCall } from '../../src/kernel/ai/models';
import type { CallRecord } from '../../src/kernel/ai/usage';
import { cliEnv, promptWithSchema, runCli } from '../../tools/abbonamenti/servi';
// @ts-expect-error pipeline.mjs is untyped plain JS
import { parseUsage } from '../../tools/pipeline/pipeline.mjs';

/** Gemini 4 Neon at the API, dollars per million tokens (the announcement of 18/11, `docs/pipeline/modelli.md` 1.4). */
export const NEON_LIST = { input: 3, cached: 0.15, output: 15 };

/** One call of agy as the bench keeps it. */
export interface AgyCall {
  model: string;
  task: string;
  seconds: number;
  /** The tokens agy says: the input not read from its cache, the cache read, the output (thinking included), the thinking. */
  input: number;
  read: number;
  output: number;
  thinking: number;
  /** The turns of the agent (one, or more when it opened a photo) and the tools it used, by name. */
  turns: number;
  tools: string[];
  /** Files the model wrote in its folder (it was asked not to): their names. */
  written?: string[];
  /** The tokens of the Sculptor's request alone at the API (`countTokens`), when counted. */
  request?: number;
  /** At Neon's API list: what agy's tokens would cost, and the request alone with the same output. */
  usd: number;
  usdApi?: number;
  errore?: string;
}

/** The counters of agy's `/usage` for one group of models: how much of the 5-hour window and of the week is used, in per cent. */
export interface AgyWindow {
  session?: number;
  week?: number;
  read: string;
}

/** Reads `agy -p /usage` (not a call of a model) for the group `Gemini Models`; undefined if the CLI does not answer. */
export function readAgyWindow(cmd = 'agy', group = 'Gemini Models'): AgyWindow | undefined {
  try {
    const text = execFileSync(cmd, ['-p', '/usage'], { encoding: 'utf8', timeout: 120_000, windowsHide: true, env: { ...cliEnv(process.env), MSYS_NO_PATHCONV: '1' } });
    const counters: Array<{ nome: string; finestra: string; residuo: number }> | undefined = parseUsage('gemini', text);
    const mine = counters?.filter((c) => c.nome === group);
    if (!mine?.length) return undefined;
    const used = (w: string) => {
      const c = mine.find((x) => x.finestra === w);
      return c ? 100 - c.residuo : undefined;
    };
    return { session: used('5h'), week: used('settimana'), read: new Date().toISOString() };
  } catch {
    return undefined;
  }
}

export interface AgyCliOptions {
  /** The CLI (a fake one for the offline proof, `lab/scripts/agy-finta.mjs`), split on spaces. */
  cmd?: string;
  /** The level of thinking, the suffix of agy's id (`gemini-4-neon-low`): the game's `low` unless said. */
  level?: string;
  /** Whether the photos of a revision go to the model (default yes); without, the revision has the views in text only. */
  images?: boolean;
  timeoutMs?: number;
  /** Before each call: undefined to go on, or why the round stops. */
  gate?: () => string | undefined;
  /** The tokens of a text at the API (free), for the cost of the request without agy. */
  count?: (model: string, text: string) => Promise<number | undefined>;
  /** Every call, as it ends. */
  onCall?: (c: AgyCall, record: CallRecord) => void;
}

/** The one message: the rules of a text-only answer, the Sculptor's system prompt, the request, the photos to open. */
export function agyMessage(call: TextCall, photos: string[]): string {
  const rules = [
    'Answer this one request as a model that only writes text, not as a coding agent: do not create, edit or delete files, do not run commands, do not search the web.',
    photos.length ? `The only tool you may use is view_file, to look at the pictures named at the end, which are in the current folder.` : 'Do not use any tool.',
    'Write the whole answer in your reply, exactly in the form the instructions below ask.',
  ].join(' ');
  const pictures = photos.length ? `\n\n<pictures>\nLook at these pictures before answering (view_file): ${photos.join(', ')}. They are the photos the request speaks of, in that order.\n</pictures>` : '';
  return `${rules}\n\n<system_instructions>\n${call.system}\n</system_instructions>\n\n<request>\n${promptWithSchema(call.prompt, call.schema)}\n</request>${pictures}\n`;
}

/** The stream of agy: the result, the turns, the tools the agent called. */
export function readAgyStream(text: string): { status?: string; response?: string; error?: string; usage?: Record<string, number>; turns: number; tools: string[] } {
  let result: Record<string, unknown> | undefined;
  const tools: string[] = [];
  let turns = 0;
  for (const line of text.split('\n')) {
    let v: Record<string, unknown>;
    try {
      v = JSON.parse(line);
    } catch {
      continue;
    }
    if (v?.event === 'result') result = v.result as Record<string, unknown>;
    const s = v?.step_update as Record<string, unknown> | undefined;
    if (s?.state === 'DONE') {
      if (s.step_type === 'agent_response') turns++;
      else if (s.step_type !== 'user_input') tools.push(String(s.step_type));
    }
  }
  return {
    ...(result ? { status: String(result.status), response: String(result.response ?? ''), ...(result.error ? { error: String(result.error) } : {}), usage: result.usage as Record<string, number> } : {}),
    turns: Number(result?.num_turns ?? turns) || turns,
    tools,
  };
}

const cost = (input: number, read: number, output: number) => (input * NEON_LIST.input + read * NEON_LIST.cached + output * NEON_LIST.output) / 1e6;

/**
 * The Sculptor's calls on agy: `call.model` is the model (`gemini-4-neon`), the level its suffix. Throws on any status but SUCCESS, or
 * an empty answer, as a model that fails: `sculpt` gives up as in the game.
 */
export function agyCliModels(opts: AgyCliOptions): (call: TextCall) => Promise<string> {
  const [cmd, ...pre] = (opts.cmd ?? 'agy').split(' ').filter(Boolean);
  return async (call) => {
    const model = `${call.model}-${opts.level ?? 'low'}`;
    const stop = opts.gate?.();
    if (stop) throw new Error(stop);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-scultore-'));
    const photos: string[] = [];
    if (opts.images ?? true) {
      for (const [i, url] of (call.images ?? []).entries()) {
        const m = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(url);
        if (!m) continue;
        const name = `foto-${i + 1}.${m[1] === 'jpeg' ? 'jpg' : 'png'}`;
        fs.writeFileSync(path.join(dir, name), Buffer.from(m[2], 'base64'));
        photos.push(name);
      }
    }
    const ours = new Set(photos);
    const message = agyMessage(call, photos);
    const t0 = Date.now();
    const run = await runCli({
      cmd,
      args: [...pre, '--input-format', 'stream-json', '--output-format', 'stream-json', '--model', model, '--disable-slash-commands', '--sandbox', '-p', ''],
      stdin: `${JSON.stringify({ event: 'user', message: { role: 'user', content: message } })}\n`,
      cwd: dir,
      env: { ...cliEnv(process.env), MSYS_NO_PATHCONV: '1' },
      timeoutMs: opts.timeoutMs ?? 15 * 60_000,
    });
    const seconds = Math.round((Date.now() - t0) / 1000);
    const read = readAgyStream(run.stdout);
    const written = fs.readdirSync(dir).filter((f) => !ours.has(f));
    // A program it wrote to a file instead of the reply: the bench takes it, and says so (the rules asked for the reply).
    let text = read.response ?? '';
    if (!/<\w/.test(text)) {
      const xml = written.find((f) => /\.(xml|mjx|txt|md)$/i.test(f));
      if (xml) text = `${text}\n${fs.readFileSync(path.join(dir, xml), 'utf8')}`;
    }
    fs.rmSync(dir, { recursive: true, force: true });
    const u = read.usage ?? {};
    const input = Number(u.input_tokens ?? 0);
    const cached = Number(u.cache_read_tokens ?? 0);
    const output = Number(u.output_tokens ?? 0);
    const thinking = Number(u.thinking_tokens ?? 0);
    const failed = read.status !== 'SUCCESS' ? read.error ?? `agy: ${read.status ?? `nessun risultato (codice ${run.code}) ${run.stderr.slice(0, 300)}`}` : !text.trim() ? 'risposta vuota' : undefined;
    const request = failed || !opts.count ? undefined : await opts.count(call.model!, `${call.system}\n\n${promptWithSchema(call.prompt, call.schema)}`).catch(() => undefined);
    const c: AgyCall = {
      model,
      task: call.task,
      seconds,
      input,
      read: cached,
      output,
      thinking,
      turns: read.turns,
      tools: read.tools,
      ...(written.length ? { written } : {}),
      ...(request !== undefined ? { request, usdApi: Number(cost(request, 0, output).toFixed(6)) } : {}),
      usd: Number(cost(input, cached, output).toFixed(6)),
      ...(failed ? { errore: failed } : {}),
    };
    const record: CallRecord = {
      model: `agy:${model}`,
      agent: call.agent,
      task: call.task,
      prompt: input + cached,
      cached,
      output,
      thoughts: thinking,
      usd: c.usd,
      ...(failed ? { failed: 'errore' as const } : {}),
    };
    opts.onCall?.(c, record);
    if (failed) throw new Error(failed);
    return text;
  };
}

/** A model layer that sends the Sculptor's calls of `model` to agy and everything else (the Artist) to `rest`. */
export function routedAgy(rest: AiModels, model: string, agy: (call: TextCall) => Promise<string>): AiModels {
  return {
    name: rest.name,
    get usage() { return rest.usage; },
    limits: rest.limits,
    textModel: rest.textModel,
    text: (call: TextCall) => (call.agent === 'sculptor' && call.model === model ? agy(call) : rest.text(call)),
  };
}
