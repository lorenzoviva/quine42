// OpenRouter (ADR-0184, ADR-0193, T362): the same models of Google and Jev of TypeSafe through one API, paid by whoever's key it is. One base
// (`endpoint`), two doors: `/v1/chat/completions` for the models that write (OpenRouterAiModels, beside GeminiAiModels) and `/alpha/decisions`
// for Jev (OpenRouterDecisionModels, beside JevDecisionModels). The key never comes here: the gate of the server (T363) or a script of the lab adds it.
//
// The ids are fixed and on a list (OPENROUTER_MODELS, OPENROUTER_JEV): never an alias that moves (`~…-latest`), `openrouter/auto` or a tier
// (`:floor`, `:nitro`); a model off the list is never asked. The Council's schema becomes a JSON Schema in `response_format` (`toJsonSchema`), with
// `require_parameters`, so that only an endpoint that takes every parameter answers; the reasoning is `reasoning.effort` (Gemini's `thinkingLevel`,
// one to one) and does not come back; the Artist's photos are `image_url` parts with the data URLs of today. What a call cost is what OpenRouter
// says (`usage.cost`, and on a key of the player's own Google account the upstream's too): the ledger takes it over the price list
// (`CallRecord.usd`), which stays for the estimates and for whoever does not say.
// As GeminiAiModels: a request with no answer, or one OpenRouter gave up on (408) or broke off with an error after accepting it, is never repeated
// (it may have been billed); 429 and 5xx are, a few times, after `Retry-After` when it says; 402 (the credits or the limit of the key) is a
// BudgetError; 401 (a key revoked or wrong) says so, with its status, and is not repeated.

import { BudgetError, emptyUsage, Semaphore, type AiModels, type Limits, type Schema, type TextCall, type Thinking } from './models';
import type { CallRecord } from './usage';
import { JEV_MAX_BODY, JEV_MAX_QUESTIONS, JEV_MODEL, jevBody, readJevAnswers, type DecisionCall, type DecisionModels, type Decisions, type JevModel } from './decisions';

/** When the ids, the snapshots and the parameters of the endpoints below were read (https://openrouter.ai/api/v1/models/<id>/endpoints). */
export const OPENROUTER_READ_ON = '2026-11-14';
/** The API of OpenRouter, for the scripts of the lab; the game goes through the gate (`/api/openrouter`, T363). */
export const OPENROUTER_API = 'https://openrouter.ai/api';

export interface OpenRouterModel {
  /** OpenRouter's id, as asked. */
  id: string;
  /** The dated version it served on OPENROUTER_READ_ON (`canonical_slug`): what the answer's `model` says. */
  snapshot: string;
  /**
   * Whether every endpoint of the standard tier takes a temperature. With `require_parameters` a parameter one of them does not take would leave
   * only the others (the Vertex endpoints of the newer Flash do not take it): where not, the model's own temperature.
   */
  temperature: boolean;
}

/** Our id → OpenRouter's: the models of `prices.ts`, the same prices (OpenRouter adds nothing to what Google asks). */
export const OPENROUTER_MODELS: Readonly<Record<string, OpenRouterModel>> = {
  'gemini-3.1-flash-lite': { id: 'google/gemini-3.1-flash-lite', snapshot: 'google/gemini-3.1-flash-lite-20260507', temperature: true },
  'gemini-3.5-flash-lite': { id: 'google/gemini-3.5-flash-lite', snapshot: 'google/gemini-3.5-flash-lite-20260721', temperature: false },
  'gemini-3.5-flash': { id: 'google/gemini-3.5-flash', snapshot: 'google/gemini-3.5-flash-20260519', temperature: true },
  'gemini-3.6-flash': { id: 'google/gemini-3.6-flash', snapshot: 'google/gemini-3.6-flash-20260721', temperature: false },
  'gemini-3.7-flash': { id: 'google/gemini-3.7-flash', snapshot: 'google/gemini-3.7-flash-20260813', temperature: false },
  'gemini-3.8-flash': { id: 'google/gemini-3.8-flash', snapshot: 'google/gemini-3.8-flash-20260902', temperature: false },
  'gemini-4-argon': { id: 'google/gemini-4-argon', snapshot: 'google/gemini-4-argon-20261013', temperature: true },
  'gemini-3.1-pro-preview': { id: 'google/gemini-3.1-pro-preview', snapshot: 'google/gemini-3.1-pro-preview-20260219', temperature: true },
  'gemini-3-flash-preview': { id: 'google/gemini-3-flash-preview', snapshot: 'google/gemini-3-flash-preview-20251217', temperature: true },
};

/** The versions of Jev the game knows → OpenRouter's ids (TypeSafe's endpoint, the only one, is in OpenRouter's list of zero retention). */
export const OPENROUTER_JEV: Readonly<Record<JevModel, string>> = { 'jev-1.13.0': 'typesafe/jev-1.13', 'jev-1.14.0': 'typesafe/jev-1.14' };

/** OpenRouter's id of one of ours, or undefined: a model off the list is never asked. */
export const openRouterId = (model: string): string | undefined => (Object.prototype.hasOwnProperty.call(OPENROUTER_MODELS, model) ? OPENROUTER_MODELS[model].id : undefined);

/** A JSON Schema, as `response_format` wants it: the types in lower case. */
export interface JsonSchema {
  type: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: Array<string | null>;
  description?: string;
}

/**
 * The Council's schema (Gemini's style: OBJECT, STRING…) as a JSON Schema: the same types in lower case, `nullable` as a type that may be
 * `null`, the properties, the items, the values; `required` only for properties the schema has. Nothing else crosses.
 */
export function toJsonSchema(s: Schema): JsonSchema {
  const type = String(s?.type ?? 'STRING').toLowerCase();
  const out: JsonSchema = { type: s.nullable ? [type, 'null'] : type };
  if (typeof s.description === 'string' && s.description) out.description = s.description;
  if (Array.isArray(s.enum)) out.enum = s.nullable ? [...s.enum, null] : [...s.enum];
  if (s.properties && typeof s.properties === 'object') out.properties = Object.fromEntries(Object.entries(s.properties).map(([k, v]) => [k, toJsonSchema(v)]));
  if (Array.isArray(s.required)) {
    const has = out.properties ?? {};
    const required = s.required.filter((k) => Object.prototype.hasOwnProperty.call(has, k));
    if (required.length) out.required = required;
  }
  if (s.items) out.items = toJsonSchema(s.items);
  return out;
}

/** The name of a schema (letters, digits, `_` and `-`, at most 64): the task's. */
export const schemaName = (task: string): string => task.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 64) || 'answer';

/** An image of the Artist's as OpenRouter wants it: the same data URL, in a part of its own. */
export function imagePart(dataUrl: string): { type: 'image_url'; image_url: { url: string } } {
  if (typeof dataUrl !== 'string' || !/^data:image\/[\w.+-]+;base64,/.test(dataUrl)) throw new Error('immagine non in formato data URL');
  return { type: 'image_url', image_url: { url: dataUrl } };
}

/**
 * The body of a call, as it goes to `/v1/chat/completions`: the system instructions first (a stable prefix, as for Gemini), the prompt with the
 * photos after it, the schema as a JSON Schema (`strict: false`: the validator is the safety net, rule 2, and the strict modes narrow the schema), the
 * reasoning when it is asked (never sent back), and the routing: every parameter taken (`require_parameters`), no provider that keeps the words
 * to train on them (`data_collection: deny`).
 */
export function openRouterBody(call: TextCall, model: OpenRouterModel, thinking: Thinking): Record<string, unknown> {
  const images = (call.images ?? []).map(imagePart);
  return {
    model: model.id,
    messages: [
      ...(call.system ? [{ role: 'system', content: call.system }] : []),
      { role: 'user', content: images.length ? [{ type: 'text', text: call.prompt }, ...images] : call.prompt },
    ],
    ...(model.temperature ? { temperature: call.temperature ?? 0.8 } : {}),
    ...(call.schema ? { response_format: { type: 'json_schema', json_schema: { name: schemaName(call.task), strict: false, schema: toJsonSchema(call.schema) } } } : {}),
    ...(thinking !== 'off' ? { reasoning: { effort: thinking, exclude: true } } : {}),
    provider: { require_parameters: true, data_collection: 'deny' },
  };
}

const count = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);

/**
 * The dollars of a call as OpenRouter says them, or undefined when it does not: `usage.cost` (what it charged), and with a key of the player's own
 * Google account (`is_byok`) what Google charged it too (`cost_details.upstream_inference_cost`).
 */
export function reportedCost(usage: unknown): number | undefined {
  const u = usage && typeof usage === 'object' ? (usage as Record<string, any>) : undefined;
  if (!u || typeof u.cost !== 'number' || !Number.isFinite(u.cost) || u.cost < 0) return undefined;
  return u.cost + (u.is_byok === true ? count(u.cost_details?.upstream_inference_cost) : 0);
}

/** The tokens of an answer of `/v1/chat/completions`: the reasoning apart from the answer (OpenRouter counts it in `completion_tokens`). */
export function chatTokens(usage: unknown): Pick<CallRecord, 'prompt' | 'cached' | 'output' | 'thoughts'> {
  const u = usage && typeof usage === 'object' ? (usage as Record<string, any>) : {};
  const prompt = count(u.prompt_tokens);
  const thoughts = count(u.completion_tokens_details?.reasoning_tokens);
  return { prompt, cached: Math.min(prompt, count(u.prompt_tokens_details?.cached_tokens)), output: Math.max(0, count(u.completion_tokens) - thoughts), thoughts };
}

/** The text of an answer, or an error: OpenRouter may say 200 and put the error in the body or in the choice. */
export function answerText(j: any): { text: string; finish?: string } | { error: string; status: number } {
  const failure = j?.error ?? j?.choices?.[0]?.error;
  if (failure || j?.choices?.[0]?.finish_reason === 'error') {
    const status = typeof failure?.code === 'number' ? failure.code : 502;
    return { status, error: short(typeof failure?.message === 'string' ? failure.message : 'errore del fornitore') };
  }
  const choice = j?.choices?.[0];
  const c = choice?.message?.content;
  const text = typeof c === 'string' ? c : Array.isArray(c) ? c.map((p: any) => (typeof p?.text === 'string' ? p.text : '')).join('') : '';
  return { text, finish: typeof choice?.finish_reason === 'string' ? choice.finish_reason : undefined };
}

/** What a refusal says, short: it goes to the feed. */
const short = (s: string): string => s.replace(/\s+/g, ' ').slice(0, 200);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const RETRIES = 3;
/** The longest wait a `Retry-After` may ask, in milliseconds: a longer one is cut to this (a call of the Council does not wait minutes). */
const MAX_WAIT = 20_000;

/** How long to wait before trying again: `Retry-After` (seconds) where it says, else the doubling of today. */
export function retryWait(r: Pick<Response, 'headers'>, attempt: number, base: number): number {
  const raw = r.headers?.get?.('retry-after');
  // Absent is not «at once» (Number(null) is 0); a date or a word is not a number of seconds either.
  const said = raw && /^\s*\d+(\.\d+)?\s*$/.test(raw) ? Number(raw) : NaN;
  return Number.isFinite(said) ? Math.min(said * 1000, MAX_WAIT) : base * 2 ** attempt;
}

/** Whether a status says «try again»: 429 and the server's errors, not 408 (OpenRouter gave up: it may have been billed). */
const tryAgain = (status: number) => status === 429 || status >= 500;

/** The error a refusal becomes: 402 a BudgetError (nothing more on this key), the others with their status. */
function refused(what: string, status: number, message: string): Error {
  if (status === 402) return Object.assign(new BudgetError('il credito della chiave OpenRouter'), { status });
  if (status === 401) return Object.assign(new Error(`${what}: chiave OpenRouter non valida o revocata`), { status });
  return Object.assign(new Error(`${what}: ${status} ${message}`), { status });
}

/** What a failed request becomes in the ledger, and its error: never repeated, it may have been billed. */
function unanswered(e: unknown): { failed: 'timeout' | 'errore'; message: string } {
  const timeout = /abort|timeout/i.test(`${(e as Error)?.name} ${(e as Error)?.message}`);
  return { failed: timeout ? 'timeout' : 'errore', message: timeout ? 'tempo scaduto' : (e as Error)?.message ?? 'rete' };
}

export interface OpenRouterOptions {
  /** The base: the gate in the game (`/api/openrouter`, T363), OPENROUTER_API in a script of the lab, with the key in its `fetchImpl`. */
  endpoint?: string;
  textModel: string;
  limits: Limits;
  fetchImpl?: typeof fetch;
  /** Default reasoning effort (`low`). */
  thinking?: Thinking;
  /** Milliseconds before a request is given up (default 120 s); it is then not repeated. */
  timeout?: number;
}

/** The models that write, through OpenRouter: the same AiModels as GeminiAiModels, the same calls, the same text back. */
export class OpenRouterAiModels implements AiModels {
  readonly name = 'openrouter';
  readonly usage = emptyUsage();
  limits: Limits;
  onCall?: (r: CallRecord) => void;
  private textGate = new Semaphore(4);
  private endpoint: string;
  private fetchImpl: typeof fetch;

  get textModel(): string {
    return this.opts.textModel;
  }
  set textModel(m: string) {
    this.opts.textModel = m;
  }

  constructor(private opts: OpenRouterOptions) {
    this.limits = opts.limits;
    this.endpoint = opts.endpoint ?? '/api/openrouter';
    this.fetchImpl = opts.fetchImpl ?? ((...a) => fetch(...a));
  }

  /** Whether the gate has a key for whoever plays here (T363). */
  static async available(endpoint = '/api/openrouter'): Promise<boolean> {
    try {
      const r = await fetch(`${endpoint}/status`);
      return r.ok && (await r.json()).available === true;
    } catch {
      return false;
    }
  }

  async text(call: TextCall): Promise<string> {
    const asked = call.model ?? this.opts.textModel;
    const model = Object.prototype.hasOwnProperty.call(OPENROUTER_MODELS, asked) ? OPENROUTER_MODELS[asked] : undefined;
    // Never an id off the list: not even to OpenRouter, which would route it wherever it is.
    if (!model) throw new Error(`OpenRouter: ${asked} non è fra i modelli ammessi`);
    if (this.usage.text >= this.limits.text) throw new BudgetError('il testo');
    this.usage.text++;
    return this.textGate.run(async () => {
      const body = JSON.stringify(openRouterBody(call, model, call.thinking ?? this.opts.thinking ?? 'low'));
      const j = await this.post(model.id, body, call);
      const a = answerText(j);
      if ('error' in a) throw Object.assign(new Error(`OpenRouter ${model.id}: ${a.status} ${a.error} (non ripetuta)`), { status: a.status });
      if (!a.text) throw new Error(`risposta vuota (${a.finish ?? 'sconosciuto'})`);
      return a.text;
    });
  }

  private async post(model: string, body: string, call: { agent: string; task: string; chi?: string }): Promise<any> {
    const report = (j: any, extra: Partial<CallRecord> = {}) => {
      const usd = reportedCost(j?.usage);
      const r: CallRecord = { model, agent: call.agent, task: call.task, ...chatTokens(j?.usage), ...(usd !== undefined ? { usd } : {}), ...(call.chi ? { who: call.chi } : {}), ...extra };
      this.usage.inputTokens += r.prompt;
      this.usage.cachedTokens += r.cached;
      this.usage.outputTokens += r.output;
      this.usage.thoughtTokens += r.thoughts;
      this.onCall?.(r);
    };
    let last: Error | undefined;
    let retries = 0;
    for (let attempt = 0; attempt <= RETRIES; attempt++) {
      let r: Response;
      try {
        r = await this.fetchImpl(`${this.endpoint}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal: AbortSignal.timeout(this.opts.timeout ?? 120_000),
        });
      } catch (e) {
        // No answer: the request may have been generated and billed all the same. Never again.
        const u = unanswered(e);
        this.usage.failures++;
        if (u.failed === 'timeout') this.usage.timeouts++;
        report(undefined, { failed: u.failed, retries });
        throw new Error(`OpenRouter ${model}: ${u.message} (non ripetuta)`);
      }
      const j: any = await r.json().catch(() => ({}));
      if (r.ok) {
        // An answer, or an error OpenRouter could only put in the body: either way what it counted is counted, and the error is not repeated.
        const broken = 'error' in answerText(j);
        if (broken) this.usage.failures++;
        report(j, { retries, ...(broken ? { failed: 'errore' as const } : {}) });
        return j;
      }
      last = refused(`OpenRouter ${model}`, r.status, short(typeof j?.error?.message === 'string' ? j.error.message : r.statusText));
      if (!tryAgain(r.status)) break;
      if (attempt < RETRIES) {
        retries++;
        this.usage.retries++;
        await sleep(retryWait(r, attempt, 800));
      }
    }
    this.usage.failures++;
    throw last ?? new Error(`OpenRouter ${model}: nessuna risposta`);
  }
}

/** What Jev may be shown as a state: an object or a text as it is, the rest written as JSON (an array would be read as parts of a message). */
export function decisionState(state: unknown): string | Record<string, unknown> {
  if (typeof state === 'string') return state;
  if (state && typeof state === 'object' && !Array.isArray(state)) return state as Record<string, unknown>;
  return JSON.stringify(state ?? null);
}

/**
 * The body of a decision, as it goes to `/alpha/decisions`: the model, the state, the questions as Jev's own gate makes them (`jevBody`), and only
 * an endpoint that keeps nothing of what it reads (`provider.zdr`).
 */
export function decisionsBody(call: Pick<DecisionCall, 'state' | 'questions'>, id: string): Record<string, unknown> {
  const { questions } = jevBody(call, id);
  return { model: id, state: decisionState(call.state), questions, provider: { zdr: true } };
}

export interface OpenRouterJevOptions {
  /** The base, as for OpenRouterAiModels. */
  endpoint?: string;
  model?: JevModel;
  fetchImpl?: typeof fetch;
  /** Milliseconds before a request is given up (default 20 s): Jev answers in a few hundred. */
  timeout?: number;
}

/** Jev of TypeSafe through OpenRouter (D52): the same decisions as JevDecisionModels, the same answers, OpenRouter's ids and costs. */
export class OpenRouterDecisionModels implements DecisionModels {
  readonly name = 'jev-openrouter';
  /**
   * Every request asks for an endpoint that keeps nothing (`provider.zdr`): OpenRouter refuses rather than send it elsewhere. A fact of this door,
   * not a permission: whether the free text of a wanderer may go to Jev is still D45.3 (`JEV_ZERO_RETENTION`), the author's.
   */
  readonly zeroRetention = true;
  readonly usage = { decisions: 0, failures: 0, inputTokens: 0 };
  onCall?: (r: CallRecord) => void;
  private gate = new Semaphore(4);
  private endpoint: string;
  private fetchImpl: typeof fetch;

  constructor(private opts: OpenRouterJevOptions = {}) {
    this.endpoint = opts.endpoint ?? '/api/openrouter';
    this.fetchImpl = opts.fetchImpl ?? ((...a) => fetch(...a));
  }

  async decide(call: DecisionCall): Promise<Partial<Decisions>> {
    const version = call.model ?? this.opts.model ?? JEV_MODEL;
    const id = Object.prototype.hasOwnProperty.call(OPENROUTER_JEV, version) ? OPENROUTER_JEV[version] : undefined;
    if (!id) throw new Error(`OpenRouter: ${version} non è una versione di Jev ammessa`);
    const ids = Object.keys(call.questions);
    if (!ids.length) return {};
    if (ids.length > JEV_MAX_QUESTIONS) throw new Error(`Jev: più di ${JEV_MAX_QUESTIONS} domande in una richiesta`);
    const body = JSON.stringify(decisionsBody(call, id));
    if (new TextEncoder().encode(body).length > JEV_MAX_BODY) throw new Error('Jev: richiesta troppo grande');
    this.usage.decisions++;
    return this.gate.run(async () => readJevAnswers((await this.post(id, body, call)).answers, call.questions));
  }

  private async post(model: string, body: string, call: DecisionCall): Promise<any> {
    const report = (j: any, extra: Partial<CallRecord> = {}) => {
      const u = j?.usage && typeof j.usage === 'object' ? j.usage : {};
      const usd = reportedCost(u);
      const prompt = count(u.input_tokens);
      const r: CallRecord = {
        model,
        agent: call.agent,
        task: call.task,
        prompt,
        cached: Math.min(prompt, count(u.input_tokens_details?.cached_tokens)),
        output: count(u.output_tokens),
        thoughts: 0,
        ...(usd !== undefined ? { usd } : {}),
        ...(call.chi ? { who: call.chi } : {}),
        ...extra,
      };
      this.usage.inputTokens += r.prompt;
      this.onCall?.(r);
    };
    let last: Error | undefined;
    let retries = 0;
    for (let attempt = 0; attempt <= RETRIES; attempt++) {
      let r: Response;
      try {
        r = await this.fetchImpl(`${this.endpoint}/alpha/decisions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal: AbortSignal.timeout(this.opts.timeout ?? 20_000),
        });
      } catch (e) {
        // No answer: it may have been billed all the same. Never again; the rule answers.
        const u = unanswered(e);
        this.usage.failures++;
        report(undefined, { failed: u.failed, retries });
        throw new Error(`Jev ${model}: ${u.message} (non ripetuta)`);
      }
      const j: any = await r.json().catch(() => ({}));
      if (r.ok) {
        if (j?.error) {
          // Accepted, then broken off: what it counted is counted, and the rule answers.
          this.usage.failures++;
          report(j, { retries, failed: 'errore' });
          throw new Error(`Jev ${model}: ${typeof j.error.code === 'number' ? j.error.code : 502} ${short(String(j.error.message ?? 'errore del fornitore'))} (non ripetuta)`);
        }
        report(j, { retries });
        return j ?? {};
      }
      last = refused(`Jev ${model}`, r.status, short(typeof j?.error?.message === 'string' ? j.error.message : r.statusText));
      if (!tryAgain(r.status)) break;
      if (attempt < RETRIES) {
        retries++;
        await sleep(retryWait(r, attempt, 500));
      }
    }
    this.usage.failures++;
    throw last ?? new Error(`Jev ${model}: nessuna risposta`);
  }
}
