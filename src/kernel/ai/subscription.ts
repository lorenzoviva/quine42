// Generating with subscriptions (T68, ADR-0073): the slow tasks of the Council (Genesis, Forge, the Sculptor's models,
// the Council's sessions) may run on the CLI subscription of whoever plays locally (Claude Code, Antigravity) instead of
// the paid API. Which provider for which agent is a table in `universe.json → ai` (`provider` is the default,
// `agenti` the exceptions); every other task stays on the API. Never on the server of many (ADR-0058): the
// subscription is personal, so only `main.ts` in single play and development builds these models.
//
// The request does not go to the CLI from here: `QueueModels` puts it in a queue on disk (`/api/coda`, see
// server/subscriptionQueue.ts) that a process using the CLIs serves (T68b); the answer comes back with the same
// schema, and its tokens go to the same usage ledger (at the price of a subscription, zero dollars).

import { emptyUsage, Semaphore, type Limits, type Models, type TextCall } from './models';
import type { CallRecord } from './usage';

/** `api`: Gemini, paid per call. The others: a subscription's CLI, through the queue. */
export type Provider = 'api' | 'claude' | 'antigravity';
export const PROVIDERS: readonly Provider[] = ['api', 'claude', 'antigravity'];
export const SUBSCRIPTIONS: readonly Exclude<Provider, 'api'>[] = ['claude', 'antigravity'];

/** The name a subscription's calls have in the usage ledger (prices.ts prices them at zero). */
export const SUBSCRIPTION_MODEL: Record<Exclude<Provider, 'api'>, string> = { claude: 'abbonamento-claude', antigravity: 'abbonamento-antigravity' };

/**
 * The tasks already slow enough that a CLI answering in seconds or minutes changes nothing for whoever plays.
 * The Artist's judgement (`model.judge`) looks at photos: it stays on the API.
 */
const SLOW = [/^genesis\./, /^forge\./, /^model\.(sculpt|resculpt)$/, /^council\.session$/, /^mechanic\.design$/];

export const slowTask = (task: string): boolean => SLOW.some((r) => r.test(task));

export interface Subscriptions {
  /** The provider of every agent the table does not name. */
  provider: Provider;
  /** agent id → provider. */
  agenti: Record<string, Provider>;
}

const isProvider = (v: unknown): v is Provider => typeof v === 'string' && (PROVIDERS as readonly string[]).includes(v);

/** The table of `universe.json → ai`, repaired: unknown providers fall back to the API, nothing else is guessed. */
export function subscriptionsOf(ai: { provider?: unknown; agenti?: unknown } | undefined): Subscriptions {
  const agenti: Record<string, Provider> = {};
  if (ai?.agenti && typeof ai.agenti === 'object' && !Array.isArray(ai.agenti))
    for (const [agent, p] of Object.entries(ai.agenti as Record<string, unknown>)) if (isProvider(p)) agenti[agent] = p;
  return { provider: isProvider(ai?.provider) ? ai.provider : 'api', agenti };
}

/** Whether any agent can run on a subscription at all. */
export const usesSubscriptions = (s: Subscriptions): boolean => s.provider !== 'api' || Object.values(s.agenti).some((p) => p !== 'api');

/** Where a call goes: the API unless the task is slow and the table says otherwise. */
export function providerFor(s: Subscriptions, agent: string, task: string): Provider {
  if (!slowTask(task)) return 'api';
  return s.agenti[agent] ?? s.provider;
}

/**
 * The models of the kernel when some agents run on subscriptions: each call to the provider of the table. `usage` and
 * `limits` are the API's (the session budget is for what is paid); the queues count their calls in the same ledger.
 */
export class RoutedModels implements Models {
  readonly name: string;
  private routes: Partial<Record<Provider, Models>>;

  constructor(
    private api: Models,
    private table: Subscriptions,
    queues: Partial<Record<Exclude<Provider, 'api'>, Models>>,
  ) {
    this.name = api.name;
    this.routes = { ...queues, api };
  }

  get usage() {
    return this.api.usage;
  }
  get limits(): Limits {
    return this.api.limits;
  }
  set limits(l: Limits) {
    this.api.limits = l;
  }
  get onCall() {
    return this.api.onCall;
  }
  set onCall(f: ((r: CallRecord) => void) | undefined) {
    for (const m of Object.values(this.routes)) m.onCall = f;
  }

  /** The provider a call would go to (the API when that queue is not there). */
  route(call: Pick<TextCall, 'agent' | 'task'>): Provider {
    const p = providerFor(this.table, call.agent, call.task);
    return this.routes[p] ? p : 'api';
  }

  text(call: TextCall): Promise<string> {
    return this.routes[this.route(call)]!.text(call);
  }
}

/** What the queue answers (server/subscriptionQueue.ts). */
export interface QueuedAnswer {
  stato: 'in coda' | 'in corso' | 'fatta' | 'fallita';
  text?: string;
  errore?: string;
  /** The tokens the CLI says it used, when it says so. */
  usage?: { prompt?: number; cached?: number; output?: number; thoughts?: number };
}

export interface QueueOptions {
  provider: Exclude<Provider, 'api'>;
  endpoint?: string;
  fetchImpl?: typeof fetch;
  /** Milliseconds between two looks at the queue (default 500: almost in real time). */
  poll?: number;
  /** Milliseconds before a request is given up (default 15 minutes: a CLI may wait for its turn). */
  timeout?: number;
  /** Requests waiting at once (default 2: the CLI serves them one by one anyway). */
  parallel?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A subscription's CLI, through the queue on disk. A request that is not answered in time is not repeated. */
export class QueueModels implements Models {
  readonly name: string;
  readonly usage = emptyUsage();
  /** The queue has no budget of its own: the CLI's limits are the subscription's. */
  limits: Limits = { text: Infinity };
  onCall?: (r: CallRecord) => void;
  private gate: Semaphore;
  private endpoint: string;
  private fetchImpl: typeof fetch;

  constructor(private opts: QueueOptions) {
    this.name = opts.provider;
    this.endpoint = opts.endpoint ?? '/api/coda';
    this.fetchImpl = opts.fetchImpl ?? ((...a) => fetch(...a));
    this.gate = new Semaphore(opts.parallel ?? 2);
  }

  /** Whether a process serves the queue for this provider (its heartbeat is recent). */
  static async available(provider: Exclude<Provider, 'api'>, endpoint = '/api/coda', fetchImpl: typeof fetch = (...a) => fetch(...a)): Promise<boolean> {
    try {
      const r = await fetchImpl(`${endpoint}/stato`);
      const j = r.ok ? await r.json() : undefined;
      return Array.isArray(j?.serviti) && j.serviti.includes(provider);
    } catch {
      return false;
    }
  }

  text(call: TextCall): Promise<string> {
    this.usage.text++;
    return this.gate.run(async () => {
      const model = SUBSCRIPTION_MODEL[this.opts.provider];
      const report = (u: QueuedAnswer['usage'], extra: Partial<CallRecord> = {}) => {
        const r: CallRecord = {
          model,
          agent: call.agent,
          task: call.task,
          prompt: u?.prompt ?? 0,
          cached: u?.cached ?? 0,
          output: u?.output ?? 0,
          thoughts: u?.thoughts ?? 0,
          ...(call.chi ? { chi: call.chi } : {}),
          ...extra,
        };
        this.usage.inputTokens += r.prompt;
        this.usage.cachedTokens += r.cached;
        this.usage.outputTokens += r.output;
        this.usage.thoughtTokens += r.thoughts;
        this.onCall?.(r);
      };
      const fail = (why: string, kind: 'timeout' | 'errore' = 'errore'): never => {
        this.usage.failures++;
        if (kind === 'timeout') this.usage.timeouts++;
        report(undefined, { failed: kind });
        throw new Error(`${this.opts.provider}: ${why} (non ripetuta)`);
      };
      // `data` is for the offline models; the rest is the request as the API would get it.
      const request = {
        provider: this.opts.provider,
        agent: call.agent,
        task: call.task,
        system: call.system,
        prompt: call.prompt,
        ...(call.schema ? { schema: call.schema } : {}),
        ...(call.images?.length ? { images: call.images } : {}),
        ...(call.temperature !== undefined ? { temperature: call.temperature } : {}),
        ...(call.thinking ? { thinking: call.thinking } : {}),
        ...(call.chi ? { chi: call.chi } : {}),
      };
      let id: string;
      try {
        const r = await this.fetchImpl(this.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || typeof j.id !== 'string') return fail(`la coda non accetta la richiesta (${j.errore ?? r.status})`);
        id = j.id;
      } catch (e) {
        return fail((e as Error).message);
      }
      const until = Date.now() + (this.opts.timeout ?? 15 * 60_000);
      while (Date.now() < until) {
        await sleep(this.opts.poll ?? 500);
        let a: QueuedAnswer;
        try {
          const r = await this.fetchImpl(`${this.endpoint}/${encodeURIComponent(id)}`);
          a = await r.json();
        } catch {
          continue; // the server restarting: the request is still on disk
        }
        if (a.stato === 'fatta' && typeof a.text === 'string' && a.text) {
          report(a.usage);
          return a.text;
        }
        if (a.stato === 'fatta' || a.stato === 'fallita') return fail(a.errore ?? 'risposta vuota');
      }
      // Withdrawn, so the process does not serve it after the game stopped waiting.
      await this.fetchImpl(`${this.endpoint}/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => undefined);
      return fail('tempo scaduto', 'timeout');
    });
  }
}
