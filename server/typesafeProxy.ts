// The only place that spends TYPESAFE_KEY (T348, ADR-0157), as GeminiGate spends Gemini's (ADR-0099, rule 9): the models on a list (fixed
// versions of Jev), a limited body made again field by field (a model, a state, the questions: no images, no «Danger Zone»), a daily cap in
// dollars. Two doors: the route /api/typesafe, for the kernel in the browser of whoever plays alone on this machine (loopback only, same
// origin; the production server does not serve it, ADR-0112), and `direct()`, for the worlds of many, which ask over their channel
// (ADR-0110). The key never reaches the browser, the bundle, a world or a universe.

import fs from 'node:fs';
import path from 'node:path';
import type { Connect, Plugin } from 'vite';
import type { ServerResponse } from 'node:http';
import { accessRefusal, readBody, STATUS_CAP, TooLarge } from './geminiProxy';
import { costOf } from '../src/kernel/ai/prices';
import { JEV_MAX_BODY, JEV_MAX_QUESTIONS, JEV_MODELS } from '../src/kernel/ai/decisions';

const UPSTREAM = 'https://api.typesafe.ai/v1/systemone';
/** USD a day, unless `.env` says otherwise (TYPESAFE_TETTO_GIORNALIERO): at 0.042 $ a million tokens, some twenty million. */
export const DEFAULT_TYPESAFE_CAP = 1;
/** What a request of n bytes holds of the cap before its answer: about three bytes a token, and what TypeSafe adds of its own. */
const heldTokens = (bytes: number) => Math.ceil(bytes / 3) + 300;
const QUESTION_TYPES = new Set(['choice', 'noul', 'score']);
const ROUTE = /^\/api\/typesafe\/v1\/systemone$/;

export interface TypeSafeGateOptions {
  apiKey?: string;
  /** USD a day; a value that is not a number ≥ 0 means the default. */
  dailyCap?: number | string;
  /** The file that keeps the day's spending across restarts; without, it stays in memory. */
  ledgerFile?: string;
  fetchImpl?: typeof fetch;
  /** The day (ISO), in tests. */
  today?: () => string;
}

export interface TypeSafeAnswer {
  status: number;
  text: string;
}

const refusal = (status: number, message: string): TypeSafeAnswer => ({ status, text: JSON.stringify({ error: { message } }) });

/**
 * The request as it goes to TypeSafe, made again from what arrived: the model on the list, the state, the questions (each of a known
 * type); anything else is a refusal, never passed on: then the reason and the status.
 */
export function jevRequest(body: string): { model: string; body: string } | { error: string; status: number } {
  let j: unknown;
  try {
    j = JSON.parse(body);
  } catch {
    return { status: 400, error: 'non è JSON' };
  }
  if (!j || typeof j !== 'object' || Array.isArray(j)) return { status: 400, error: 'non è una richiesta' };
  const r = j as Record<string, unknown>;
  if (Object.keys(r).some((k) => k !== 'model' && k !== 'state' && k !== 'questions')) return { status: 400, error: 'campi non ammessi' };
  if (typeof r.model !== 'string' || !(JEV_MODELS as readonly string[]).includes(r.model)) return { status: 403, error: 'modello non ammesso' };
  const q = r.questions;
  if (!q || typeof q !== 'object' || Array.isArray(q)) return { status: 400, error: 'domande mancanti' };
  const entries = Object.entries(q as Record<string, unknown>);
  if (!entries.length || entries.length > JEV_MAX_QUESTIONS) return { status: 400, error: 'numero di domande non ammesso' };
  for (const [, v] of entries) {
    const t = v && typeof v === 'object' ? (v as Record<string, unknown>).type : undefined;
    if (typeof t !== 'string' || !QUESTION_TYPES.has(t)) return { status: 400, error: 'tipo di domanda non ammesso' };
  }
  return { model: r.model, body: JSON.stringify({ model: r.model, state: r.state ?? null, questions: q }) };
}

export class TypeSafeGate {
  private spent = 0;
  private held = 0;
  private day = '';
  private readonly cap: number;
  private readonly fetchImpl: typeof fetch;
  private readonly today: () => string;

  constructor(private opts: TypeSafeGateOptions) {
    const cap = opts.dailyCap === undefined || opts.dailyCap === '' ? NaN : Number(opts.dailyCap);
    this.cap = Number.isFinite(cap) && cap >= 0 ? cap : DEFAULT_TYPESAFE_CAP;
    this.fetchImpl = opts.fetchImpl ?? ((...a) => fetch(...a));
    this.today = opts.today ?? (() => new Date().toISOString().slice(0, 10));
    this.restore();
  }

  get available(): boolean {
    return !!this.opts.apiKey;
  }

  /** USD spent today, what is in flight excluded. */
  spentToday(): number {
    this.roll();
    return this.spent;
  }

  /** One call to TypeSafe. A refusal is an answer; a failed connection throws. What fails with no answer stays counted as what it held. */
  async forward(body: string, signal?: AbortSignal | null): Promise<TypeSafeAnswer> {
    if (!this.opts.apiKey) return refusal(503, 'TYPESAFE_KEY mancante in .env');
    if (Buffer.byteLength(body) > JEV_MAX_BODY) return refusal(413, 'richiesta troppo grande');
    const req = jevRequest(body);
    if ('error' in req) return refusal(req.status, req.error);
    this.roll();
    const day = this.day;
    const hold = costOf(req.model, { prompt: heldTokens(Buffer.byteLength(req.body)), output: 0 }, day) ?? 0;
    if (this.spent + this.held + hold > this.cap) return refusal(STATUS_CAP, 'tetto di spesa del giorno raggiunto');
    this.held += hold;
    let cost = hold;
    try {
      const upstream = await this.fetchImpl(UPSTREAM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.opts.apiKey}` },
        body: req.body,
        ...(signal ? { signal } : {}),
      });
      const text = await upstream.text();
      // A refusal is not billed; an answer that does not say how much counts as what it held.
      cost = upstream.ok ? (this.costIn(req.model, text, day) ?? hold) : 0;
      return { status: upstream.status, text };
    } finally {
      this.held -= hold;
      this.spend(cost, day);
    }
  }

  /** The door of the worlds of many: a `fetch` for JevDecisionModels that goes to TypeSafe with no route. Undefined without a key. */
  direct(): typeof fetch | undefined {
    if (!this.available) return undefined;
    return (async (input: RequestInfo | URL, init?: RequestInit) => {
      // The world names only the path it asks; the address is this gate's.
      const r = /\/v1\/systemone$/.test(String(input)) ? await this.forward(String(init?.body ?? ''), init?.signal) : refusal(404, 'endpoint sconosciuto');
      return new Response(r.text, { status: r.status, headers: { 'Content-Type': 'application/json' } });
    }) as typeof fetch;
  }

  private costIn(model: string, text: string, day: string): number | undefined {
    try {
      const u = JSON.parse(text)?.usage;
      if (!u || typeof u.input_tokens !== 'number') return undefined;
      return costOf(model, { prompt: u.input_tokens, output: typeof u.output_tokens === 'number' ? u.output_tokens : 0 }, day);
    } catch {
      return undefined;
    }
  }

  private roll(): void {
    const day = this.today();
    if (day !== this.day) {
      this.day = day;
      this.spent = 0;
    }
  }

  private spend(cost: number, day: string): void {
    if (!(cost > 0)) return;
    this.roll();
    // A call that ends after midnight was billed yesterday.
    if (day !== this.day) return;
    this.spent += cost;
    this.save();
  }

  private restore(): void {
    this.roll();
    const file = this.opts.ledgerFile;
    if (!file) return;
    try {
      const j = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (j.day === this.day && Number.isFinite(j.spent) && j.spent > 0) this.spent = j.spent;
    } catch {
      /* never saved: nothing spent yet */
    }
  }

  private save(): void {
    const file = this.opts.ledgerFile;
    if (!file) return;
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify({ day: this.day, spent: this.spent }));
    } catch (e) {
      console.warn(`spesa di TypeSafe non salvata: ${(e as Error).message}`);
    }
  }
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

/** The route, as a middleware of the development server (and of the preview): never of the production one. */
export function typesafeRoute(gate: TypeSafeGate): Connect.NextHandleFunction {
  return (req, res, next) => {
    if (!req.url?.startsWith('/api/typesafe')) return next();
    const denied = accessRefusal(req);
    if (denied) return send(res, 403, { error: { message: denied } });
    const route = req.url.split('?')[0];
    if (route === '/api/typesafe/status') return send(res, 200, { available: gate.available });
    if (!ROUTE.test(route) || req.method !== 'POST') return send(res, 404, { error: { message: 'endpoint sconosciuto' } });
    // A form of another site cannot send this type without asking first.
    if (!/^application\/json\b/i.test(req.headers['content-type'] ?? '')) return send(res, 415, { error: { message: 'solo JSON' } });
    readBody(req, JEV_MAX_BODY)
      .then((body) => gate.forward(body))
      .then((answer) => send(res, answer.status, answer.text))
      .catch((e: Error) => {
        if (e instanceof TooLarge) {
          res.setHeader('Connection', 'close');
          req.resume();
          return send(res, 413, { error: { message: 'richiesta troppo grande' } });
        }
        console.warn(`TypeSafe non raggiunto: ${e.message}`);
        send(res, 502, { error: { message: 'TypeSafe non raggiungibile' } });
      });
  };
}

export function typesafeProxy(gate: TypeSafeGate): Plugin {
  const handler = typesafeRoute(gate);
  return {
    name: 'quine-typesafe-proxy',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
