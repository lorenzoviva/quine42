// The layer of closed decisions (T348, ADR-0157): a model that does not write but chooses (TypeSafe's Jev) gets a state and typed questions
// (Choice: one option of a list; Noul: the probability of a yes; Score: a level of a rubric) and answers within the options. Beside AiModels,
// never inside it: what is decided here is a value the kernel already knows how to use, never a text.
//
// The floor is today's rule (ADR-0157 §3): every call brings the answer the kernel would give by itself (`rule`), and whatever goes wrong
// (no key, the gate's cap, a refusal, the network, an answer outside the options, the master's knob at 0, a read-only universe, no credits)
// the rule is the answer. The local models answer with the rule, so the tests and the game without a key are the same as before.
//
// Only data of the world and of the catalogue go to Jev, never the free text of a wanderer (D45.3, until TypeSafe offers zero retention):
// the state of a call is built by the kernel. Which tasks may decide is said by the census (`CENSUS`, the rows with `via: 'decide'`).

import { BudgetError, Semaphore } from './models';
import type { CallRecord } from './usage';

/** The models the gate lets through (fixed versions, never an alias that moves: ADR-0157 §1). Changing it means running the bench again (§7). */
export const JEV_MODELS = ['jev-1.13.0', 'jev-1.14.0'] as const;
export type JevModel = (typeof JEV_MODELS)[number];
/** The production model of today. */
export const JEV_MODEL: JevModel = 'jev-1.13.0';
/**
 * The largest request that crosses the gate, in bytes. The bench's largest was 60 KB (rubrics on text views), and Jev's production context is
 * 32k tokens (about 100 KB): past this a question is too long to be reliable anyway (docs.typesafe.ai, «jaggedness»).
 */
export const JEV_MAX_BODY = 128 * 1024;
/** At most this many questions in a call: a batch of people decided together stays well under it. */
export const JEV_MAX_QUESTIONS = 64;

export type DecisionQuestion =
  | { type: 'choice'; instructions: string; criteria: Record<string, string> }
  | { type: 'noul'; instructions: string; criteria?: { true?: string; false?: string } }
  | { type: 'score'; instructions: string; criteria: string[] };

/** A choice is the key of an option, a Noul a yes or a no, a Score the index of a level (0 the first). */
export type DecisionValue = string | boolean | number;
export type Decisions = Record<string, DecisionValue>;

export interface DecisionCall {
  agent: string;
  /** A task of the census with `via: 'decide'` (`model.reuse`…): its knob, its line in the usage ledger. */
  task: string;
  /** What the world is now, as the kernel writes it: data of the world, never a wanderer's free text (D45.3). */
  state: unknown;
  questions: Record<string, DecisionQuestion>;
  /** What the kernel decides today without a model, question by question: the floor, and the local models' answer. */
  rule: Decisions;
  /** Who pays (ADR-0113): a wanderer's id, or `comune`. */
  chi?: string;
  model?: JevModel;
}

export interface DecisionModels {
  readonly name: string;
  /** Every call, with its tokens (the kernel's usage ledger listens). */
  onCall?: (r: CallRecord) => void;
  /** The answers as the model gave them: the Council keeps only those within the options (`settleDecisions`). */
  decide(call: DecisionCall): Promise<Partial<Decisions>>;
}

/** Whether a value answers a question: an option of the list, a boolean, a level of the rubric. */
export function answers(q: DecisionQuestion, v: unknown): v is DecisionValue {
  if (q.type === 'choice') return typeof v === 'string' && Object.prototype.hasOwnProperty.call(q.criteria, v);
  if (q.type === 'noul') return typeof v === 'boolean';
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < q.criteria.length;
}

/** The answers the kernel uses: the model's where it answered within the options, the rule's elsewhere; nothing a question did not ask. */
export function settleDecisions(call: Pick<DecisionCall, 'questions' | 'rule'>, raw: unknown): Decisions {
  const given = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const out: Decisions = {};
  for (const [id, q] of Object.entries(call.questions)) {
    const v = Object.prototype.hasOwnProperty.call(given, id) ? given[id] : undefined;
    if (answers(q, v)) out[id] = v;
    else if (call.rule[id] !== undefined) out[id] = call.rule[id];
  }
  return out;
}

/** The rule alone: what the kernel does without a model. */
export const ruleDecisions = (call: Pick<DecisionCall, 'questions' | 'rule'>): Decisions => settleDecisions(call, undefined);

/** The body Jev gets: the model, the state once, every question under its id. Nothing else (no images, no «Danger Zone»). */
export function jevBody(call: Pick<DecisionCall, 'state' | 'questions'>, model: string): { model: string; state: unknown; questions: Record<string, unknown> } {
  const questions = Object.fromEntries(
    Object.entries(call.questions).map(([id, q]) => [id, q.type === 'noul' ? { type: 'noul', instructions: q.instructions, ...(q.criteria ? { criteria: q.criteria } : {}) } : { type: q.type, instructions: q.instructions, criteria: q.criteria }]),
  );
  return { model, state: call.state, questions };
}

/** Jev's answers read without trusting them: a choice is its `choice`, a Noul a probability of 0.5 or more, a Score the likeliest level. */
export function readJevAnswers(raw: unknown, questions: Record<string, DecisionQuestion>): Partial<Decisions> {
  const all = raw && typeof raw === 'object' ? (raw as Record<string, any>) : {};
  const out: Partial<Decisions> = {};
  for (const [id, q] of Object.entries(questions)) {
    const a = Object.prototype.hasOwnProperty.call(all, id) ? all[id] : undefined;
    if (!a || typeof a !== 'object') continue;
    if (q.type === 'choice') {
      if (typeof a.choice === 'string') out[id] = a.choice;
    } else if (q.type === 'noul') {
      const p = typeof a.noul === 'number' ? a.noul : NaN;
      if (Number.isFinite(p) && p >= 0 && p <= 1) out[id] = p >= 0.5;
    } else {
      const probs = a.probabilities && typeof a.probabilities === 'object' ? (a.probabilities as Record<string, unknown>) : {};
      const best = Object.entries(probs)
        .filter((e): e is [string, number] => typeof e[1] === 'number' && Number.isFinite(e[1]))
        .sort((x, y) => y[1] - x[1])[0]?.[0];
      const level = best !== undefined ? Number(best) : typeof a.score === 'number' ? Math.round(a.score) : NaN;
      if (Number.isInteger(level)) out[id] = level;
    }
  }
  return out;
}

export interface JevOptions {
  /** The gate: `/api/typesafe` in the browser of whoever plays alone; on the server the channel's `fetch` (ADR-0110). */
  endpoint?: string;
  model?: JevModel;
  fetchImpl?: typeof fetch;
  /** Milliseconds before a request is given up (default 20 s): Jev answers in 150-250 ms. */
  timeout?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** 429 and 529 (overloaded) are tried again, with a wait; nothing else is (ADR-0157 §1). */
const RETRIES = 3;

/** Jev of TypeSafe through the gate (`server/typesafeProxy.ts`): the key never comes here. */
export class JevDecisionModels implements DecisionModels {
  readonly name = 'jev';
  readonly usage = { decisions: 0, failures: 0, inputTokens: 0 };
  onCall?: (r: CallRecord) => void;
  private gate = new Semaphore(4);
  private endpoint: string;
  private fetchImpl: typeof fetch;

  constructor(private opts: JevOptions = {}) {
    this.endpoint = opts.endpoint ?? '/api/typesafe';
    this.fetchImpl = opts.fetchImpl ?? ((...a) => fetch(...a));
  }

  /** Whether the gate has a key (in the browser: the route answers only on this machine). */
  static async available(endpoint = '/api/typesafe'): Promise<boolean> {
    try {
      const r = await fetch(`${endpoint}/status`);
      return r.ok && (await r.json()).available === true;
    } catch {
      return false;
    }
  }

  async decide(call: DecisionCall): Promise<Partial<Decisions>> {
    const model = call.model ?? this.opts.model ?? JEV_MODEL;
    const ids = Object.keys(call.questions);
    if (!ids.length) return {};
    if (ids.length > JEV_MAX_QUESTIONS) throw new Error(`Jev: più di ${JEV_MAX_QUESTIONS} domande in una richiesta`);
    const body = JSON.stringify(jevBody(call, model));
    // Not sent: the gate would refuse it, and a question this long is not one Jev answers well.
    if (new TextEncoder().encode(body).length > JEV_MAX_BODY) throw new Error('Jev: richiesta troppo grande');
    this.usage.decisions++;
    return this.gate.run(async () => readJevAnswers((await this.post(model, body, call)).answers, call.questions));
  }

  private async post(model: string, body: string, call: DecisionCall): Promise<any> {
    const report = (u: any, extra: Partial<CallRecord> = {}) => {
      const r: CallRecord = {
        model,
        agent: call.agent,
        task: call.task,
        prompt: typeof u?.input_tokens === 'number' ? u.input_tokens : 0,
        cached: 0,
        output: typeof u?.output_tokens === 'number' ? u.output_tokens : 0,
        thoughts: 0,
        ...(call.chi ? { who: call.chi } : {}),
        ...extra,
      };
      this.usage.inputTokens += r.prompt;
      this.onCall?.(r);
    };
    let last = '';
    let retries = 0;
    for (let attempt = 0; attempt <= RETRIES; attempt++) {
      let r: Response;
      try {
        r = await this.fetchImpl(`${this.endpoint}/v1/systemone`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal: AbortSignal.timeout(this.opts.timeout ?? 20_000),
        });
      } catch (e) {
        // No answer: it may have been billed all the same. Never again; the rule answers.
        const timeout = /abort|timeout/i.test(`${(e as Error).name} ${(e as Error).message}`);
        this.usage.failures++;
        report(undefined, { failed: timeout ? 'timeout' : 'errore', retries });
        throw new Error(`Jev ${model}: ${timeout ? 'tempo scaduto' : (e as Error).message} (non ripetuta)`);
      }
      const j: any = await r.json().catch(() => ({}));
      if (r.ok) {
        report(j?.usage, { retries });
        return j ?? {};
      }
      // The gate's daily cap: nothing more today.
      if (r.status === 402) throw new BudgetError('la spesa del giorno di Jev');
      last = `${r.status} ${typeof j?.error?.message === 'string' ? j.error.message : r.statusText}`;
      if (r.status !== 429 && r.status !== 529) break;
      if (attempt < RETRIES) {
        retries++;
        await sleep(500 * 2 ** attempt);
      }
    }
    this.usage.failures++;
    throw new Error(`Jev ${model}: ${last}`);
  }
}
