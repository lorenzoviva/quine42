// The only place that spends a key of OpenRouter (T363, ADR-0197; the open beta, ADR-0184): the players' own keys and, for who hosts and chooses,
// the server's (OPENROUTER_API_KEY). A player's key comes from the OAuth PKCE of OpenRouter, exchanged here (the browser brings the code and the
// verifier, never sees the key), or pasted as a fallback; it lives in the memory of this process, by wanderer, never on disk, never in a log, never
// to a world or a client: elsewhere only its SHA-256. Two doors, as GeminiGate (ADR-0099): the route /api/openrouter for the kernel in the browser
// of whoever plays alone on this machine (the model doors loopback only, same origin; the key doors for any caller the accounts prove), and
// `direct()` for the worlds of many, which ask over their channel (ADR-0110) naming who may pay (`x-quine-payers`, in order: the wanderer, or the
// turn of the commons as the kernel sorts it) and are told whose key answered (`x-quine-paid-by`). A 402 of OpenRouter puts that key out of the
// turn (exhausted) and the call goes to the next; a 401 forgets the key. The server's key alone has a daily cap in dollars; a player's has the limit
// OpenRouter gives it and the ceiling of the lobby, held in the world.

import { createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Connect, Plugin } from 'vite';
import type { ServerResponse } from 'node:http';
import { accessRefusal, MAX_BODY, readBody, STATUS_CAP, TooLarge } from './geminiProxy';
import { callerOf, isJson, type Access } from './access';
import { Rates, type Pace } from './rates';
import { costOf } from '../src/kernel/ai/prices';
import { OPENROUTER_API, OPENROUTER_JEV, OPENROUTER_MODELS, PAID_BY_HEADER, PAYERS_HEADER, reportedCost } from '../src/kernel/ai/openrouter';
import { JEV_MAX_BODY, JEV_MAX_QUESTIONS } from '../src/kernel/ai/decisions';
import { validWandererId } from '../src/kernel/wandererIds';
import type { KeyHolders, KeyPolicy } from '../src/kernel/credits';

export { PAID_BY_HEADER, PAYERS_HEADER };
/** USD a day for the server's key, unless `.env` says otherwise (OPENROUTER_TETTO_GIORNALIERO). */
export const DEFAULT_OPENROUTER_CAP = 10;
/** What a call in flight holds of the cap, besides its prompt. */
const HELD_OUTPUT_TOKENS = 8192;
/** How long a PKCE flow may take between `begin` and the exchange (ms), and how many a wanderer may have open. */
export const FLOW_TTL = 10 * 60 * 1000;
export const FLOWS_PER_WANDERER = 4;
/** The key doors (begin, exchange, paste, forget) per wanderer: a few, then one every half minute. */
export const KEY_PACE: Pace = { burst: 6, perSecond: 1 / 30 };
/** Calls per key owner: a world that asks in somebody's name is contained here as `heavy` contains a wanderer (ADR-0107); far above a game. */
export const CALL_PACE: Pace = { burst: 120, perSecond: 2 };
/** A key of OpenRouter as it is written (`sk-or-v1-…`): anything else is not kept. */
const KEY_RE = /^sk-or-[A-Za-z0-9_-]{8,256}$/;
/** An authorization code and a verifier (RFC 7636: 43 to 128 of these characters). */
const CODE_RE = /^[A-Za-z0-9._~-]{8,512}$/;
const VERIFIER_RE = /^[A-Za-z0-9._~-]{43,128}$/;
const STATE_RE = /^[a-f0-9]{32}$/;
const CHAT_PATH = /\/v1\/chat\/completions$/;
const DECISIONS_PATH = /\/alpha\/decisions$/;
const QUESTION_TYPES = new Set(['choice', 'noul', 'score']);
const CHAT_MODELS = new Set(Object.values(OPENROUTER_MODELS).map((m) => m.id));
const JEV_MODELS = new Set(Object.values(OPENROUTER_JEV));
/** What a chat call may carry to OpenRouter: the rest (fallback `models`, `route`, `plugins`, `transforms`, another `provider`) is dropped. */
const CHAT_FIELDS = ['model', 'messages', 'temperature', 'response_format', 'reasoning', 'max_tokens'] as const;

export interface OpenRouterGateOptions {
  /** The server's key, for who hosts and chooses: the commons, and whoever has no key of their own where the world says so. */
  apiKey?: string;
  /** USD a day for the server's key; a value that is not a number ≥ 0 means the default. */
  dailyCap?: number | string;
  /** The file that keeps the day's spending of the server's key across restarts; without, it stays in memory. */
  ledgerFile?: string;
  fetchImpl?: typeof fetch;
  /** The day (ISO), in tests. */
  today?: () => string;
  /** The clock in milliseconds (the PKCE flows, the rates), in tests. */
  now?: () => number;
  /** Calls per key owner; the default is CALL_PACE. */
  callPace?: Pace;
}

export interface OpenRouterAnswer {
  status: number;
  text: string;
  /** Whose key answered: a wanderer's id; absent for the server's key, or for a refusal of this gate. */
  paidBy?: string;
}

/** What is said of a key, never the key: its SHA-256 (what OpenRouter's own pages show), and whether it said 402. */
export interface KeyView {
  fingerprint: string;
  exhausted: boolean;
}

const refusal = (status: number, message: string): OpenRouterAnswer => ({ status, text: JSON.stringify({ error: { message } }) });

/** The SHA-256 of a key, in hex: the only thing of it that leaves this module. */
export const keyFingerprint = (key: string): string => createHash('sha256').update(key).digest('hex');

/** The chat body as it goes to OpenRouter, made again from what arrived: a model on the list and the fields a call has, the routing this gate's. */
export function chatRequest(body: string): { model: string; body: string } | { error: string; status: number } {
  let j: unknown;
  try {
    j = JSON.parse(body);
  } catch {
    return { status: 400, error: 'non è JSON' };
  }
  if (!j || typeof j !== 'object' || Array.isArray(j)) return { status: 400, error: 'non è una richiesta' };
  const r = j as Record<string, unknown>;
  if (typeof r.model !== 'string' || !CHAT_MODELS.has(r.model)) return { status: 403, error: 'modello non ammesso' };
  if (!Array.isArray(r.messages) || !r.messages.length) return { status: 400, error: 'messaggi mancanti' };
  const out: Record<string, unknown> = {};
  for (const k of CHAT_FIELDS) if (r[k] !== undefined) out[k] = r[k];
  out.provider = { require_parameters: true, data_collection: 'deny' };
  return { model: r.model, body: JSON.stringify(out) };
}

/** The decision body as it goes to OpenRouter: a version of Jev on the list, the state, the questions (each of a known type), and only zero retention. */
export function decisionRequest(body: string): { model: string; body: string } | { error: string; status: number } {
  let j: unknown;
  try {
    j = JSON.parse(body);
  } catch {
    return { status: 400, error: 'non è JSON' };
  }
  if (!j || typeof j !== 'object' || Array.isArray(j)) return { status: 400, error: 'non è una richiesta' };
  const r = j as Record<string, unknown>;
  if (typeof r.model !== 'string' || !JEV_MODELS.has(r.model)) return { status: 403, error: 'modello non ammesso' };
  const q = r.questions;
  if (!q || typeof q !== 'object' || Array.isArray(q)) return { status: 400, error: 'domande mancanti' };
  const entries = Object.entries(q as Record<string, unknown>);
  if (!entries.length || entries.length > JEV_MAX_QUESTIONS) return { status: 400, error: 'numero di domande non ammesso' };
  for (const [, v] of entries) {
    const t = v && typeof v === 'object' ? (v as Record<string, unknown>).type : undefined;
    if (typeof t !== 'string' || !QUESTION_TYPES.has(t)) return { status: 400, error: 'tipo di domanda non ammesso' };
  }
  return { model: r.model, body: JSON.stringify({ model: r.model, state: r.state ?? null, questions: q, provider: { zdr: true } }) };
}

/** The ids a `x-quine-payers` header names, in order: valid ids only, at most a few dozen (a world names its connected wanderers). */
export function payersIn(header: unknown): string[] {
  if (typeof header !== 'string' || !header) return [];
  return header
    .split(',')
    .map((s) => s.trim())
    .filter(validWandererId)
    .slice(0, 64);
}

interface HeldKey {
  key: string;
  fingerprint: string;
  exhausted: boolean;
}

export class OpenRouterGate {
  private keys = new Map<string, HeldKey>();
  private flows = new Map<string, Array<{ state: string; until: number }>>();
  private spent = 0;
  private held = 0;
  private day = '';
  private readonly cap: number;
  private readonly fetchImpl: typeof fetch;
  private readonly today: () => string;
  private readonly now: () => number;
  private readonly calls: Rates;
  private warnedServerKey = false;
  /** The keys held changed (one came, one went, one said 402): who keeps the worlds tells them, by value. */
  onChange?: (keys: KeyHolders) => void;

  constructor(private opts: OpenRouterGateOptions) {
    const cap = opts.dailyCap === undefined || opts.dailyCap === '' ? NaN : Number(opts.dailyCap);
    this.cap = Number.isFinite(cap) && cap >= 0 ? cap : DEFAULT_OPENROUTER_CAP;
    this.fetchImpl = opts.fetchImpl ?? ((...a) => fetch(...a));
    this.today = opts.today ?? (() => new Date().toISOString().slice(0, 10));
    this.now = opts.now ?? (() => Date.now());
    this.calls = new Rates(opts.callPace ?? CALL_PACE, () => this.now());
    this.restore();
  }

  /** Whether who hosts gave this server a key of its own. */
  get serverKey(): boolean {
    return !!this.opts.apiKey;
  }

  /** How many wanderers' keys are held now. */
  get playerKeys(): number {
    return this.keys.size;
  }

  /** What is said of a wanderer's key, or undefined if none is held. */
  keyOf(id: string): KeyView | undefined {
    const k = this.keys.get(id);
    return k ? { fingerprint: k.fingerprint, exhausted: k.exhausted } : undefined;
  }

  /** The ids whose key is held, by value. */
  holders(): KeyHolders {
    const holders: string[] = [];
    const exhausted: string[] = [];
    for (const [id, k] of this.keys) (k.exhausted ? exhausted : holders).push(id);
    return { holders: holders.sort(), exhausted: exhausted.sort() };
  }

  /** Keeps a key for a wanderer (pasted, or exchanged): its fingerprint back, never the key. A key that is not one is not kept. */
  setKey(id: string, key: unknown): { fingerprint: string } | { error: string; status: number } {
    if (typeof key !== 'string' || !KEY_RE.test(key)) return { status: 400, error: 'non è una chiave di OpenRouter' };
    const fingerprint = keyFingerprint(key);
    this.keys.set(id, { key, fingerprint, exhausted: false });
    this.changed();
    return { fingerprint };
  }

  /** Forgets a wanderer's key: true if there was one. */
  forgetKey(id: string): boolean {
    const had = this.keys.delete(id);
    if (had) this.changed();
    return had;
  }

  /** Begins a PKCE flow for a wanderer: the `state` the browser sends to OpenRouter and brings back with the code. */
  beginFlow(id: string): { state: string } {
    const now = this.now();
    const open = (this.flows.get(id) ?? []).filter((f) => f.until > now);
    const state = randomBytes(16).toString('hex');
    open.push({ state, until: now + FLOW_TTL });
    // The oldest goes when there are too many: a browser that begins again and again holds nothing.
    this.flows.set(id, open.slice(-FLOWS_PER_WANDERER));
    return { state };
  }

  /** Takes a flow's state, once: false if it is not this wanderer's, or has ended. */
  private takeFlow(id: string, state: unknown): boolean {
    if (typeof state !== 'string' || !STATE_RE.test(state)) return false;
    const now = this.now();
    const open = (this.flows.get(id) ?? []).filter((f) => f.until > now);
    const i = open.findIndex((f) => f.state === state);
    if (i < 0) {
      this.flows.set(id, open);
      return false;
    }
    open.splice(i, 1);
    this.flows.set(id, open);
    return true;
  }

  /**
   * The exchange of a PKCE flow (https://openrouter.ai/docs/guides/overview/auth/oauth): the code and the verifier the browser brought, with
   * the `state` this gate gave it, go to OpenRouter from here, and the key that comes back stays here. The browser gets the fingerprint.
   */
  async exchange(id: string, said: { code?: unknown; verifier?: unknown; state?: unknown }): Promise<{ fingerprint: string } | { error: string; status: number }> {
    const code = said?.code;
    const verifier = said?.verifier;
    if (typeof code !== 'string' || !CODE_RE.test(code) || typeof verifier !== 'string' || !VERIFIER_RE.test(verifier)) return { status: 400, error: 'codice o verifier non validi' };
    // The state is spent only by a request that could be the flow's: a malformed one leaves it for the right one.
    if (!this.takeFlow(id, said?.state)) return { status: 400, error: 'il collegamento non era cominciato da qui, o è scaduto: ricomincia' };
    let upstream: Response;
    try {
      upstream = await this.fetchImpl(`${OPENROUTER_API}/v1/auth/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, code_verifier: verifier, code_challenge_method: 'S256' }),
      });
    } catch {
      return { status: 502, error: 'OpenRouter non raggiungibile' };
    }
    let j: unknown;
    try {
      j = await upstream.json();
    } catch {
      j = undefined;
    }
    const key = j && typeof j === 'object' ? (j as { key?: unknown }).key : undefined;
    if (!upstream.ok || typeof key !== 'string') return { status: upstream.ok ? 502 : 400, error: upstream.ok ? 'OpenRouter non ha dato una chiave' : 'OpenRouter ha rifiutato il codice: ricomincia' };
    return this.setKey(id, key);
  }

  /** USD the server's key spent today, what is in flight excluded. */
  spentToday(): number {
    this.roll();
    return this.spent;
  }

  /**
   * One call to OpenRouter, on the first key of `payers` that can pay, else (with no payer named) on the server's key. A refusal is an answer;
   * a failed connection throws, so that each door says it in its own way. What fails with no answer stays counted on the server's key: OpenRouter
   * may have generated and billed it anyway.
   */
  async forward(door: 'chat' | 'decisions', body: string, payers: string[] = [], signal?: AbortSignal | null): Promise<OpenRouterAnswer> {
    const max = door === 'chat' ? MAX_BODY : JEV_MAX_BODY;
    if (Buffer.byteLength(body) > max) return refusal(413, 'richiesta troppo grande');
    const req = door === 'chat' ? chatRequest(body) : decisionRequest(body);
    if ('error' in req) return refusal(req.status, req.error);
    const url = `${OPENROUTER_API}/${door === 'chat' ? 'v1/chat/completions' : 'alpha/decisions'}`;
    for (const id of payers) {
      const k = this.keys.get(id);
      if (!k || k.exhausted) continue;
      if (!this.calls.take(id)) return refusal(429, 'troppe chiamate per questo viandante: riprova tra poco');
      const upstream = await this.fetchImpl(url, { method: 'POST', headers: this.headers(k.key), body: req.body, ...(signal ? { signal } : {}) });
      const text = await upstream.text();
      if (upstream.status === 401) {
        // Revoked, or never good: nothing more on it, and the next of the turn pays.
        this.keys.delete(id);
        this.changed();
        continue;
      }
      if (upstream.status === 402) {
        // The credits or the limit of the key: out of the turn until the player says otherwise (a new key).
        k.exhausted = true;
        this.changed();
        continue;
      }
      return { status: upstream.status, text, paidBy: id };
    }
    if (payers.length) return refusal(STATUS_CAP, 'nessuna chiave con credito fra chi paga');
    return this.withServerKey(req.model, url, req.body, signal);
  }

  private headers(key: string): Record<string, string> {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'X-Title': 'QUINE42' };
  }

  /** The server's key, under its daily cap (as GeminiGate): what a call holds is its prompt and an answer, what it spends is what OpenRouter said. */
  private async withServerKey(model: string, url: string, body: string, signal?: AbortSignal | null): Promise<OpenRouterAnswer> {
    if (!this.opts.apiKey) return refusal(503, 'nessuna chiave di OpenRouter: collega la tua, o OPENROUTER_API_KEY in .env');
    if (!this.calls.take('')) return refusal(429, 'troppe chiamate: riprova tra poco');
    this.roll();
    const day = this.day;
    const hold = costOf(model, { prompt: Buffer.byteLength(body) / 4, output: HELD_OUTPUT_TOKENS }, day) ?? 0;
    if (this.spent + this.held + hold > this.cap) return refusal(STATUS_CAP, 'tetto di spesa del giorno raggiunto');
    this.held += hold;
    let cost = hold;
    try {
      const upstream = await this.fetchImpl(url, { method: 'POST', headers: this.headers(this.opts.apiKey), body, ...(signal ? { signal } : {}) });
      const text = await upstream.text();
      if (upstream.status === 401 && !this.warnedServerKey) {
        this.warnedServerKey = true;
        console.warn('OPENROUTER_API_KEY rifiutata da OpenRouter: i mondi che non hanno altre chiavi usano i modelli locali');
      }
      // A refusal is not billed; an answer that does not say how much counts as what it held.
      cost = upstream.ok ? (this.costIn(model, text, day) ?? hold) : 0;
      return { status: upstream.status, text };
    } finally {
      this.held -= hold;
      this.spend(cost, day);
    }
  }

  /** The door of the worlds of many: a `fetch` for the adapters that goes to OpenRouter with no route; when nothing can pay, it says so. */
  direct(): typeof fetch {
    return (async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string> | undefined;
      const payers = payersIn(headers?.[PAYERS_HEADER] ?? headers?.[PAYERS_HEADER.toUpperCase()]);
      const url = String(input);
      const door = CHAT_PATH.test(url) ? 'chat' : DECISIONS_PATH.test(url) ? 'decisions' : undefined;
      const r = door ? await this.forward(door, String(init?.body ?? ''), payers, init?.signal) : refusal(404, 'endpoint sconosciuto');
      return new Response(r.text, { status: r.status, headers: { 'Content-Type': 'application/json', ...(r.paidBy ? { [PAID_BY_HEADER]: r.paidBy } : {}) } });
    }) as typeof fetch;
  }

  private changed(): void {
    this.onChange?.(this.holders());
  }

  private costIn(model: string, text: string, day: string): number | undefined {
    try {
      const j = JSON.parse(text);
      const said = reportedCost(j?.usage);
      if (said !== undefined) return said;
      const u = j?.usage;
      if (!u) return undefined;
      return costOf(model, { prompt: Number(u.prompt_tokens ?? u.input_tokens) || 0, output: Number(u.completion_tokens ?? u.output_tokens) || 0 }, day);
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
      console.warn(`spesa di OpenRouter non salvata: ${(e as Error).message}`);
    }
  }
}

/** What a world of many gets of the gate (T363): the door over the channel, how the calls are paid, and who holds a key at its start. */
export interface WorldsOpenRouter {
  fetch: typeof fetch;
  policy: KeyPolicy;
  keys: () => KeyHolders;
}

/**
 * How the worlds of this server pay their calls (T363, ADR-0197), asked when a world starts: through OpenRouter when who hosts gave a key of
 * OpenRouter, or has no key of Google and the players may bring theirs (accounts, or a key already held on this machine); else undefined, and
 * the world goes to Gemini or to the local models as before. A server that wants the players to pay has no key of Google.
 */
export function worldsPayWith(gate: OpenRouterGate, o: { gemini: boolean; accounts: boolean }): WorldsOpenRouter | undefined {
  const players = o.accounts || gate.playerKeys > 0;
  if (!gate.serverKey && (o.gemini || !players)) return undefined;
  return { fetch: gate.direct(), policy: { players, server: gate.serverKey }, keys: () => gate.holders() };
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

export interface OpenRouterRouteOptions {
  /** Who asks (ADR-0102): the key doors are for a caller with an id the accounts prove (or, without accounts, this machine). */
  access: Access;
  /** The model doors (`/v1/chat/completions`, `/alpha/decisions`), loopback only: the development server and the preview, never production. */
  models?: boolean;
  /** For the tests: only by code. */
  keyPace?: Pace;
}

/**
 * The route: `/status` (what this caller can pay with: never a key), `/begin` and `/key` (the PKCE flow, or a pasted key; DELETE forgets), and with
 * `models` the two doors of the adapters for whoever plays alone on this machine, on their own key or the server's.
 */
export function openrouterRoute(gate: OpenRouterGate, o: OpenRouterRouteOptions): Connect.NextHandleFunction {
  const keyRate = new Rates(o.keyPace ?? KEY_PACE);
  return (req, res, next) => {
    if (!req.url?.startsWith('/api/openrouter')) return next();
    const route = req.url.split('?')[0];
    const method = req.method ?? 'GET';
    const chat = CHAT_PATH.test(route);
    const decisions = DECISIONS_PATH.test(route);
    if (chat || decisions) {
      if (!o.models) return send(res, 404, { error: { message: 'endpoint sconosciuto' } });
      const denied = accessRefusal(req);
      if (denied) return send(res, 403, { error: { message: denied } });
      if (method !== 'POST') return send(res, 404, { error: { message: 'endpoint sconosciuto' } });
      if (!isJson(req)) return send(res, 415, { error: { message: 'solo JSON' } });
      void (async () => {
        try {
          const who = await callerOf(req, o.access);
          if ('refused' in who) return send(res, who.status, { error: { message: who.refused } });
          // Who plays here pays with their own key if they have one, else with the server's: never with another's, whatever a page names.
          const body = await readBody(req, chat ? MAX_BODY : JEV_MAX_BODY);
          const payers = !who.server && who.id && gate.keyOf(who.id) ? [who.id] : [];
          const answer = await gate.forward(chat ? 'chat' : 'decisions', body, payers);
          if (answer.paidBy) res.setHeader(PAID_BY_HEADER, answer.paidBy);
          send(res, answer.status, answer.text);
        } catch (e) {
          if (e instanceof TooLarge) {
            res.setHeader('Connection', 'close');
            req.resume();
            return send(res, 413, { error: { message: 'richiesta troppo grande' } });
          }
          console.warn(`OpenRouter non raggiunto: ${(e as Error).message}`);
          send(res, 502, { error: { message: 'OpenRouter non raggiungibile' } });
        }
      })();
      return;
    }
    const door = /^\/api\/openrouter\/(status|begin|key)$/.exec(route)?.[1];
    if (!door) return send(res, 404, { error: { message: 'endpoint sconosciuto' } });
    void (async () => {
      try {
        const who = await callerOf(req, o.access);
        if ('refused' in who) return send(res, who.status, { error: who.refused });
        if (door === 'status') {
          if (method !== 'GET') return send(res, 405, { error: 'solo GET' });
          const own = !who.server && who.id ? gate.keyOf(who.id) : undefined;
          return send(res, 200, { available: gate.serverKey || (!!own && !own.exhausted), linked: !!own, server: gate.serverKey, ...(own ? { fingerprint: own.fingerprint, exhausted: own.exhausted } : {}) });
        }
        // A key is a wanderer's: the world of this server, and whoever has no id, link nothing.
        if (who.server || !who.id) return send(res, 403, { error: 'per collegare una chiave serve un account' });
        if (!keyRate.take(who.id)) return send(res, 429, { error: 'troppe richieste: riprova tra poco' });
        if (door === 'begin') {
          if (method !== 'POST') return send(res, 405, { error: 'solo POST' });
          return send(res, 200, gate.beginFlow(who.id));
        }
        if (method === 'DELETE') return send(res, 200, { forgotten: gate.forgetKey(who.id) });
        if (method !== 'POST') return send(res, 405, { error: 'solo POST o DELETE' });
        if (!isJson(req)) return send(res, 415, { error: 'solo JSON' });
        let said: Record<string, unknown>;
        try {
          const parsed: unknown = JSON.parse(await readBody(req, 4096));
          said = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
        } catch (e) {
          if (e instanceof TooLarge) {
            res.setHeader('Connection', 'close');
            req.resume();
            return send(res, 413, { error: 'richiesta troppo grande' });
          }
          return send(res, 400, { error: 'corpo non leggibile' });
        }
        // The fallback: a key pasted by the player (ADR-0184 punto 2); the main way: the code and the verifier of the flow begun here.
        const r = 'key' in said ? gate.setKey(who.id, said.key) : await gate.exchange(who.id, said);
        if ('error' in r) return send(res, r.status, { error: r.error });
        send(res, 200, { linked: true, fingerprint: r.fingerprint });
      } catch (e) {
        console.warn(`rotta di OpenRouter non riuscita: ${(e as Error)?.name ?? 'errore'}`);
        send(res, 500, { error: 'il server non è riuscito a farlo: riprova tra poco' });
      }
    })();
  };
}

export function openrouterProxy(gate: OpenRouterGate, access: Access): Plugin {
  const handler = openrouterRoute(gate, { access, models: true });
  return {
    name: 'quine-openrouter-proxy',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
