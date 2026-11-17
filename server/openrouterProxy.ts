// The only place that spends a key of OpenRouter (T363, ADR-0197; the open beta, ADR-0184): the players' own keys and, for who hosts and chooses,
// the server's (OPENROUTER_API_KEY). A player's key comes from the OAuth PKCE of OpenRouter, exchanged here (the browser brings the code and the
// verifier, never sees the key), or pasted as a fallback; it lives in the memory of this process, by wanderer, never on disk, never in a log, never
// to a world or a client: elsewhere only its SHA-256. Two doors, as GeminiGate (ADR-0099): the route /api/openrouter for the kernel in the browser
// of whoever plays alone on this machine (the model doors loopback only, same origin; the key doors for any caller the accounts prove), and
// `direct()` for the worlds of many, which ask over their channel (ADR-0110) naming who may pay (`x-quine-payers`, in order: the wanderer, or the
// turn of the commons as the kernel sorts it) and are told whose key answered (`x-quine-paid-by`). A 402 of OpenRouter puts that key out of the
// turn (exhausted) and the call goes to the next; a 401 forgets the key. The server's key alone has a daily cap in dollars; a player's has the limit
// OpenRouter gives it and the ceiling of the lobby, held in the world.
// Whoever plays alone on this machine (T364): a key linked from this machine may also be kept in a file beside the universes (`universes/.keys/`,
// `keysFile`), so that it outlives a restart as `.env` does; only the development server and the preview give the file, never production. What
// the player sees of a key is its fingerprint and what OpenRouter says of its limit (`GET /api/v1/key`: limit, remaining, usage), asked here.

import { createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Connect, Plugin } from 'vite';
import type { ServerResponse } from 'node:http';
import { accessRefusal, MAX_BODY, readBody, STATUS_CAP, TooLarge } from './geminiProxy';
import { callerOf, isJson, type Access } from './access';
import { Rates, type Pace } from './rates';
import { costOf } from '../src/kernel/ai/prices';
import { type KeyLimits, OPENROUTER_API, OPENROUTER_JEV, OPENROUTER_MODELS, PAID_BY_HEADER, PAYERS_HEADER, reportedCost } from '../src/kernel/ai/openrouter';
import { JEV_MAX_BODY, JEV_MAX_QUESTIONS } from '../src/kernel/ai/decisions';
import { carriesWandererText } from '../src/kernel/fourthwall';
import { writeAtomic } from './lockedFile';
import { validWandererId } from '../src/kernel/wandererIds';
import type { KeyHolders, KeyPolicy } from '../src/kernel/credits';

export { PAID_BY_HEADER, PAYERS_HEADER };
export type { KeyLimits };
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
/** How long what OpenRouter said of a key's limit is told again without asking (ms). */
export const LIMITS_TTL = 60 * 1000;
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
/**
 * The ceiling of an answer's tokens of a model of the list that has one (Opus 5.5, Fable 5.1: T398): the gate writes it again, never above, so
 * that one call of the dearest model costs a known most (about 1,60 $ of Fable's output) and the daily ceiling holds whatever the body asked.
 */
const CHAT_MAX_TOKENS = new Map(Object.values(OPENROUTER_MODELS).flatMap((m) => (m.maxTokens ? [[m.id, m.maxTokens] as const] : [])));
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
  /**
   * Alone on this machine (T364): the file beside the universes where the keys linked from this machine are kept across restarts
   * (`universes/.keys/openrouter.json`). Only the development server and the preview give it; the production server never.
   */
  keysFile?: string;
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
  const most = CHAT_MAX_TOKENS.get(r.model);
  if (most !== undefined) {
    const asked = out.max_tokens;
    out.max_tokens = typeof asked === 'number' && Number.isInteger(asked) && asked > 0 ? Math.min(asked, most) : most;
  }
  out.provider = { require_parameters: true, data_collection: 'deny' };
  return { model: r.model, body: JSON.stringify(out) };
}

/**
 * The decision body as it goes to OpenRouter: a version of Jev on the list, the state, the questions (each of a known type), and only zero
 * retention (`provider.zdr`, always written again here). A body that carries the free text of a wanderer (the guard, `carriesWandererText`)
 * and did not ask for zero retention itself is refused (D55.2, ADR-0204): whoever sent it did not know where it was going.
 */
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
  const zdr = !!r.provider && typeof r.provider === 'object' && (r.provider as Record<string, unknown>).zdr === true;
  if (!zdr && carriesWandererText({ state: r.state, questions: q })) return { status: 403, error: 'il testo del viandante va solo con la ritenzione zero' };
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
  /** Kept in the file beside the universes (alone on this machine, T364). */
  kept?: boolean;
  /** What OpenRouter last said of its limit, and when. */
  limits?: { at: number; view: KeyLimits };
}

const finite = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** What `GET /api/v1/key` answered, read field by field: undefined if it is not one. */
export function readKeyLimits(j: unknown): KeyLimits | undefined {
  const d = j && typeof j === 'object' ? (j as { data?: unknown }).data : undefined;
  if (!d || typeof d !== 'object') return undefined;
  const r = d as Record<string, unknown>;
  const label = typeof r.label === 'string' ? r.label.slice(0, 100) : undefined;
  return {
    ...(label ? { label } : {}),
    limit: finite(r.limit),
    remaining: finite(r.limit_remaining),
    usage: finite(r.usage) ?? 0,
    reset: typeof r.limit_reset === 'string' && /^(daily|weekly|monthly)$/.test(r.limit_reset) ? r.limit_reset : null,
    freeTier: r.is_free_tier === true,
  };
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
    this.restoreKeys();
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

  /**
   * Keeps a key for a wanderer (pasted, or exchanged): its fingerprint back, never the key. A key that is not one is not kept. With `keep`
   * (who linked it is on this machine) and the file of this server alone (`keysFile`), it is also written there.
   */
  setKey(id: string, key: unknown, keep = false): { fingerprint: string } | { error: string; status: number } {
    if (typeof key !== 'string' || !KEY_RE.test(key)) return { status: 400, error: 'non è una chiave di OpenRouter' };
    const fingerprint = keyFingerprint(key);
    const kept = keep && !!this.opts.keysFile;
    const was = this.keys.get(id)?.kept;
    this.keys.set(id, { key, fingerprint, exhausted: false, ...(kept ? { kept } : {}) });
    if (kept || was) this.saveKeys();
    this.changed();
    return { fingerprint };
  }

  /** Forgets a wanderer's key, in memory and in the file: true if there was one. */
  forgetKey(id: string): boolean {
    const k = this.keys.get(id);
    if (!k) return false;
    this.keys.delete(id);
    if (k.kept) this.saveKeys();
    this.changed();
    return true;
  }

  /**
   * What OpenRouter says of a wanderer's key (`GET /api/v1/key`, with the key, from here): its limit, what is left, what it spent. Told again
   * for a minute without asking; a 401 forgets the key (revoked). Undefined without a key; an error when OpenRouter did not say.
   */
  async keyLimits(id: string): Promise<KeyLimits | { error: string; status: number } | undefined> {
    const k = this.keys.get(id);
    if (!k) return undefined;
    const now = this.now();
    if (k.limits && now - k.limits.at < LIMITS_TTL) return k.limits.view;
    let upstream: Response;
    try {
      upstream = await this.fetchImpl(`${OPENROUTER_API}/v1/key`, { method: 'GET', headers: this.headers(k.key) });
    } catch {
      return { status: 502, error: 'OpenRouter non raggiungibile' };
    }
    if (upstream.status === 401) {
      if (this.keys.get(id) === k) this.forgetKey(id);
      return undefined;
    }
    const view = upstream.ok ? readKeyLimits(await upstream.json().catch(() => undefined)) : undefined;
    if (!view) return { status: 502, error: 'OpenRouter non ha detto il limite della chiave' };
    k.limits = { at: now, view };
    return view;
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
  async exchange(id: string, said: { code?: unknown; verifier?: unknown; state?: unknown }, keep = false): Promise<{ fingerprint: string } | { error: string; status: number }> {
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
    return this.setKey(id, key, keep);
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
        // Revoked, or never good: nothing more on it (nor in the file), and the next of the turn pays.
        this.forgetKey(id);
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

  /** The keys linked alone on this machine, from the file beside the universes: each read as a key, the rest left out. */
  private restoreKeys(): void {
    const file = this.opts.keysFile;
    if (!file) return;
    let j: unknown;
    try {
      j = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return;
    }
    const said = j && typeof j === 'object' ? (j as { keys?: unknown }).keys : undefined;
    if (!said || typeof said !== 'object' || Array.isArray(said)) return;
    for (const [id, key] of Object.entries(said as Record<string, unknown>)) {
      if (validWandererId(id) && typeof key === 'string' && KEY_RE.test(key)) this.keys.set(id, { key, fingerprint: keyFingerprint(key), exhausted: false, kept: true });
    }
  }

  /** Writes the kept keys whole (a temporary file, then a rename); a failure is said without a key, and the key stays in memory. */
  private saveKeys(): void {
    const file = this.opts.keysFile;
    if (!file) return;
    const keys: Record<string, string> = {};
    for (const [id, k] of this.keys) if (k.kept) keys[id] = k.key;
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      writeAtomic(file, JSON.stringify({ keys }, null, 1) + '\n');
    } catch (e) {
      console.warn(`chiavi di OpenRouter non salvate accanto agli universi: ${(e as NodeJS.ErrnoException)?.code ?? 'errore'}`);
    }
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
  /** Whether the worlds of many of this server pay through OpenRouter (T364): told to the lobby, which offers the link only there. */
  worlds?: () => boolean;
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
          return send(res, 200, { available: gate.serverKey || (!!own && !own.exhausted), linked: !!own, server: gate.serverKey, ...(o.worlds ? { worlds: o.worlds() } : {}), ...(own ? { fingerprint: own.fingerprint, exhausted: own.exhausted } : {}) });
        }
        // A key is a wanderer's: the world of this server, and whoever has no id, link nothing.
        if (who.server || !who.id) return send(res, 403, { error: 'per collegare una chiave serve un account' });
        // What OpenRouter says of the key (T364): its limit and what is left, never the key; asked at most once a minute, outside the doors' pace.
        if (door === 'key' && method === 'GET') {
          if (!gate.keyOf(who.id)) return send(res, 200, { linked: false });
          const limits = await gate.keyLimits(who.id);
          const still = gate.keyOf(who.id);
          if (!still) return send(res, 200, { linked: false, forgotten: true });
          return send(res, 200, { linked: true, fingerprint: still.fingerprint, exhausted: still.exhausted, ...(limits && !('error' in limits) ? { limits } : limits ? { limitsError: limits.error } : {}) });
        }
        if (!keyRate.take(who.id)) return send(res, 429, { error: 'troppe richieste: riprova tra poco' });
        if (door === 'begin') {
          if (method !== 'POST') return send(res, 405, { error: 'solo POST' });
          return send(res, 200, gate.beginFlow(who.id));
        }
        if (method === 'DELETE') return send(res, 200, { forgotten: gate.forgetKey(who.id) });
        if (method !== 'POST') return send(res, 405, { error: 'solo GET, POST o DELETE' });
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
        // Alone on this machine (T364) the key is also kept in the file beside the universes, where this server has one (never production).
        const r = 'key' in said ? gate.setKey(who.id, said.key, who.local) : await gate.exchange(who.id, said, who.local);
        if ('error' in r) return send(res, r.status, { error: r.error });
        send(res, 200, { linked: true, fingerprint: r.fingerprint });
      } catch (e) {
        console.warn(`rotta di OpenRouter non riuscita: ${(e as Error)?.name ?? 'errore'}`);
        send(res, 500, { error: 'il server non è riuscito a farlo: riprova tra poco' });
      }
    })();
  };
}

export function openrouterProxy(gate: OpenRouterGate, access: Access, worlds?: () => boolean): Plugin {
  const handler = openrouterRoute(gate, { access, models: true, ...(worlds ? { worlds } : {}) });
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
