// The only place that spends GEMINI_API_KEY (T123, ADR-0099). Everything passes through a GeminiGate: models on a list,
// a limited body, a daily cap in dollars. Two doors: the route /api/gemini, for the kernel in the browser of whoever
// plays alone on this machine (loopback only, same origin), and `direct()`, for the worlds of many, which run in
// a process of their own and ask this one over their channel (ADR-0110), with no route at all. The key never reaches the client bundle or the browser.
// The explicit caches (T351, ADR-0186) pass here too: a write (`cachedContents`) only for a model whose storage has a price, its body
// rebuilt field by field, a `ttl` up to EXPLICIT_CACHE.maxTtl, its tokens and their storage for the whole `ttl` held and spent against
// the cap; a call may name only a cache this gate wrote, for its model, while it lives.

import fs from 'node:fs';
import path from 'node:path';
import type { Connect, Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { billedModel, cacheable, costOf, ESTIMATED, EXPLICIT_CACHE, PRICES } from '../src/kernel/ai/prices';

const UPSTREAM = 'https://generativelanguage.googleapis.com/v1beta/models';
const CACHE_UPSTREAM = 'https://generativelanguage.googleapis.com/v1beta/cachedContents';
/** Explicit caches alive at once (T351): their storage is already in the cap, this keeps the list small. */
export const MAX_LIVE_CACHES = 64;
/** The shortest `ttl` a cache may ask (seconds). */
const MIN_CACHE_TTL = 60;
const CACHE_NAME = /^cachedContents\/[\w-]{1,128}$/;
/** The largest real request is a long prompt with the Artist's sheet of four photographs, well under this. */
export const MAX_BODY = 2 * 1024 * 1024;
/** USD a day, unless `.env` says otherwise (GEMINI_TETTO_GIORNALIERO). */
export const DEFAULT_DAILY_CAP = 10;
/** What a call in flight holds of the cap, besides its prompt: many at once cannot all slip under it. */
const HELD_OUTPUT_TOKENS = 8192;
/** Not «try again»: GeminiAiModels repeats 429 and 5xx, and this one lasts until tomorrow. */
export const STATUS_CAP = 402;

const MODEL_IN_PATH = /\/models\/(gemini-[\w.-]+):generateContent$/;
const CACHES_IN_PATH = /\/cachedContents$/;
const LOOPBACK_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

export interface GateOptions {
  apiKey?: string;
  /** USD a day; a value that is not a number ≥ 0 means the default. */
  dailyCap?: number | string;
  /** Where the universes are: their `universe.json` can name other models. */
  universesDir?: string;
  /** The file that keeps the day's spending across restarts; without, it stays in memory. */
  ledgerFile?: string;
  fetchImpl?: typeof fetch;
  /** The day (ISO), in tests. */
  today?: () => string;
  /** The clock in milliseconds (the lives of the explicit caches), in tests. */
  now?: () => number;
}

export interface GateAnswer {
  status: number;
  text: string;
}

const refusal = (status: number, message: string): GateAnswer => ({ status, text: JSON.stringify({ error: { message } }) });

/** The models a `universe.json` names: its text model and the Sculptor's. */
export function modelsOfConfig(json: string): string[] {
  try {
    const ai = JSON.parse(json)?.ai;
    return [ai?.textModel, ...Object.values(ai?.scultori ?? {})].filter((m): m is string => typeof m === 'string');
  } catch {
    return [];
  }
}

export class GeminiGate {
  private spent = 0;
  private held = 0;
  private day = '';
  private readonly cap: number;
  private readonly fetchImpl: typeof fetch;
  private readonly today: () => string;
  private readonly now: () => number;
  /** The explicit caches this gate wrote (T351): name → model and when it ends (milliseconds). */
  private readonly caches = new Map<string, { model: string; until: number }>();

  constructor(private opts: GateOptions) {
    const cap = opts.dailyCap === undefined || opts.dailyCap === '' ? NaN : Number(opts.dailyCap);
    this.cap = Number.isFinite(cap) && cap >= 0 ? cap : DEFAULT_DAILY_CAP;
    this.fetchImpl = opts.fetchImpl ?? ((...a) => fetch(...a));
    this.today = opts.today ?? (() => new Date().toISOString().slice(0, 10));
    this.now = opts.now ?? (() => Date.now());
    this.restore();
  }

  get available(): boolean {
    return !!this.opts.apiKey;
  }

  /** The prices' models, and whatever a universe asks in its `universe.json` (read only for a model off the prices). */
  allows(model: string): boolean {
    const id = /^gemini-[\w.-]+$/.test(model) ? model : '';
    if (!id) return false;
    return id in PRICES || id in ESTIMATED || this.namedByUniverse(id);
  }

  private namedByUniverse(model: string): boolean {
    const dir = this.opts.universesDir;
    if (!dir) return false;
    try {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!e.isDirectory() || e.name.startsWith('.')) continue;
        const file = path.join(dir, e.name, 'universe.json');
        if (fs.existsSync(file) && modelsOfConfig(fs.readFileSync(file, 'utf8')).includes(model)) return true;
      }
    } catch {
      /* no universes: nothing more is allowed */
    }
    return false;
  }

  /** USD spent today, what is in flight excluded. */
  spentToday(): number {
    this.roll();
    return this.spent;
  }

  /**
   * One call to Google. A refusal is an answer; a failed connection throws, so that each door says it in its own way.
   * What fails with no answer stays counted: Gemini may have generated and billed it anyway.
   */
  async forward(model: string, body: string, signal?: AbortSignal | null): Promise<GateAnswer> {
    if (!this.opts.apiKey) return refusal(503, 'GEMINI_API_KEY mancante in .env');
    if (!this.allows(model)) return refusal(403, 'modello non ammesso');
    const bytes = Buffer.byteLength(body);
    if (bytes > MAX_BODY) return refusal(413, 'richiesta troppo grande');
    const named = this.namedCacheRefusal(model, body);
    if (named) return named;
    this.roll();
    const day = this.day;
    const hold = costOf(billedModel(model), { prompt: bytes / 4, output: HELD_OUTPUT_TOKENS }, day) ?? 0;
    if (this.spent + this.held + hold > this.cap) return refusal(STATUS_CAP, 'tetto di spesa del giorno raggiunto');
    this.held += hold;
    let cost = hold;
    try {
      const upstream = await this.fetchImpl(`${UPSTREAM}/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.opts.apiKey },
        body,
        ...(signal ? { signal } : {}),
      });
      const text = await upstream.text();
      // An answer that says no is not billed; one that says yes without saying how much counts as what it held.
      cost = upstream.ok ? (this.costIn(model, text, day) ?? hold) : 0;
      return { status: upstream.status, text };
    } finally {
      this.held -= hold;
      this.spend(cost, day);
    }
  }

  /** A call that names an explicit cache this gate did not write, for another model, or that has ended: refused here (T351). */
  private namedCacheRefusal(model: string, body: string): GateAnswer | undefined {
    if (!body.includes('cachedContent')) return undefined;
    let name: unknown;
    try {
      name = JSON.parse(body)?.cachedContent;
    } catch {
      return undefined;
    }
    if (name === undefined) return undefined;
    const c = typeof name === 'string' ? this.caches.get(name) : undefined;
    if (c && this.now() < c.until && c.model === model) return undefined;
    if (c && this.now() >= c.until) this.caches.delete(name as string);
    return refusal(404, 'cache sconosciuta');
  }

  /** Explicit caches alive now. */
  liveCaches(): number {
    const now = this.now();
    for (const [name, c] of this.caches) if (now >= c.until) this.caches.delete(name);
    return this.caches.size;
  }

  /**
   * The write of an explicit cache (T351): its model on the list and with a storage price, a `ttl` between MIN_CACHE_TTL and
   * EXPLICIT_CACHE.maxTtl, only system instructions in text; the body is rebuilt from those fields alone. What it holds of the cap is
   * its prompt and the storage for the whole `ttl`; what it spends, the tokens Google counted and their storage.
   */
  async writeCache(body: string, signal?: AbortSignal | null): Promise<GateAnswer> {
    if (!this.opts.apiKey) return refusal(503, 'GEMINI_API_KEY mancante in .env');
    if (Buffer.byteLength(body) > MAX_BODY) return refusal(413, 'richiesta troppo grande');
    let req: any;
    try {
      req = JSON.parse(body);
    } catch {
      return refusal(400, 'corpo non leggibile');
    }
    const model = typeof req?.model === 'string' ? /^models\/(gemini-[\w.-]+)$/.exec(req.model)?.[1] : undefined;
    if (!model || !this.allows(model)) return refusal(403, 'modello non ammesso');
    this.roll();
    const day = this.day;
    if (!cacheable(model, day)) return refusal(403, 'modello senza cache esplicita');
    const ttlMatch = typeof req.ttl === 'string' ? /^(\d{1,5})s$/.exec(req.ttl) : null;
    const ttl = ttlMatch ? Number(ttlMatch[1]) : NaN;
    if (!(ttl >= MIN_CACHE_TTL && ttl <= EXPLICIT_CACHE.maxTtl)) return refusal(400, 'durata non ammessa');
    const parts: unknown = req.systemInstruction?.parts;
    const texts = Array.isArray(parts) && parts.length && parts.every((p) => p && typeof p === 'object' && typeof p.text === 'string' && Object.keys(p).length === 1) ? parts.map((p) => String(p.text)) : undefined;
    if (!texts) return refusal(400, 'solo istruzioni di sistema in testo');
    if (this.liveCaches() >= MAX_LIVE_CACHES) return refusal(429, 'troppe cache vive');
    const clean = JSON.stringify({ model: `models/${model}`, systemInstruction: { parts: [{ text: texts.join('') }] }, ttl: `${ttl}s` });
    const hours = ttl / 3600;
    const tokens = Buffer.byteLength(clean) / 4;
    const hold = costOf(model, { prompt: tokens, output: 0, stored: tokens * hours }, day) ?? 0;
    if (this.spent + this.held + hold > this.cap) return refusal(STATUS_CAP, 'tetto di spesa del giorno raggiunto');
    this.held += hold;
    let cost = hold;
    try {
      const upstream = await this.fetchImpl(CACHE_UPSTREAM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.opts.apiKey },
        body: clean,
        ...(signal ? { signal } : {}),
      });
      const text = await upstream.text();
      if (!upstream.ok) {
        cost = 0;
        return { status: upstream.status, text };
      }
      let j: any;
      try {
        j = JSON.parse(text);
      } catch {
        j = undefined;
      }
      const counted = Number(j?.usageMetadata?.totalTokenCount);
      if (Number.isFinite(counted) && counted >= 0) cost = costOf(model, { prompt: counted, output: 0, stored: counted * hours }, day) ?? hold;
      if (typeof j?.name === 'string' && CACHE_NAME.test(j.name)) this.caches.set(j.name, { model, until: this.now() + ttl * 1000 });
      return { status: upstream.status, text };
    } finally {
      this.held -= hold;
      this.spend(cost, day);
    }
  }

  /** The door of the worlds of many: a `fetch` for GeminiAiModels that goes to Google with no route. Undefined without a key. */
  direct(): typeof fetch | undefined {
    if (!this.available) return undefined;
    return (async (input: RequestInfo | URL, init?: RequestInit) => {
      if (CACHES_IN_PATH.test(String(input))) {
        const w = await this.writeCache(String(init?.body ?? ''), init?.signal);
        return new Response(w.text, { status: w.status, headers: { 'Content-Type': 'application/json' } });
      }
      const model = MODEL_IN_PATH.exec(String(input))?.[1] ?? '';
      const r = await this.forward(model, String(init?.body ?? ''), init?.signal);
      return new Response(r.text, { status: r.status, headers: { 'Content-Type': 'application/json' } });
    }) as typeof fetch;
  }

  private costIn(model: string, text: string, day: string): number | undefined {
    try {
      const u = JSON.parse(text)?.usageMetadata;
      if (!u) return undefined;
      return costOf(billedModel(model), { prompt: u.promptTokenCount ?? 0, cached: u.cachedContentTokenCount ?? 0, output: u.candidatesTokenCount ?? 0, thoughts: u.thoughtsTokenCount ?? 0 }, day);
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
      if (j.giorno === this.day && Number.isFinite(j.spesi) && j.spesi > 0) this.spent = j.spesi;
    } catch {
      /* never saved: nothing spent yet */
    }
  }

  private save(): void {
    const file = this.opts.ledgerFile;
    if (!file) return;
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify({ giorno: this.day, spesi: this.spent }));
    } catch (e) {
      console.warn(`spesa di Gemini non salvata: ${(e as Error).message}`);
    }
  }
}

/**
 * Why a request may not use the route, or undefined. Only from this machine, and in a browser only from the page this
 * server serves: another site open in the author's browser sends another Origin, a name of another site pointed at
 * 127.0.0.1 another Host, a tunnel or a reverse proxy its forwarding headers.
 */
export function accessRefusal(req: Pick<IncomingMessage, 'headers'> & { socket: { remoteAddress?: string } }): string | undefined {
  const address = req.socket.remoteAddress ?? '';
  if (!/^(::ffff:)?127\.\d+\.\d+\.\d+$/.test(address) && address !== '::1') return 'solo da questa macchina';
  const { host } = req.headers;
  if (req.headers['x-forwarded-for'] || req.headers['x-forwarded-host'] || req.headers.forwarded) return 'solo da questa macchina';
  if (!host || !LOOPBACK_HOST.test(host)) return 'host non ammesso';
  return originRefusal(req);
}

/** Why a request comes from another site's page, or undefined: its `Origin`, if it has one, must be the `Host` it asks. */
export function originRefusal(req: Pick<IncomingMessage, 'headers'>): string | undefined {
  const { host, origin } = req.headers;
  if (origin === undefined) return undefined;
  try {
    const u = new URL(origin);
    if ((u.protocol === 'http:' || u.protocol === 'https:') && u.host === new URL(`http://${host}`).host) return undefined;
  } catch {
    /* `null` and the like: another origin */
  }
  return 'origine non ammessa';
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

export class TooLarge extends Error {}

/** A request's body, up to `max` bytes: past it, nothing more is kept and it fails with TooLarge (the gate of TypeSafe reads with its own). */
export function readBody(req: IncomingMessage, max = MAX_BODY): Promise<string> {
  return new Promise((resolve, reject) => {
    if (Number(req.headers['content-length']) > max) return reject(new TooLarge());
    let size = 0;
    const chunks: Buffer[] = [];
    const onData = (c: Buffer) => {
      size += c.length;
      if (size <= max) return void chunks.push(c);
      chunks.length = 0;
      req.off('data', onData);
      reject(new TooLarge());
    };
    req.on('data', onData);
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** The route, as a middleware of the server. */
export function geminiRoute(gate: GeminiGate): Connect.NextHandleFunction {
  return (req, res, next) => {
    if (!req.url?.startsWith('/api/gemini')) return next();
    const denied = accessRefusal(req);
    if (denied) return send(res, 403, { error: { message: denied } });
    const route = req.url.split('?')[0];
    if (route === '/api/gemini/status') return send(res, 200, { available: gate.available });
    const m = /^\/api\/gemini\/models\/(gemini-[\w.-]+):generateContent$/.exec(route);
    // The write of an explicit cache (T351): the same door, its own checks in the gate.
    const caches = route === '/api/gemini/cachedContents';
    if ((!m && !caches) || req.method !== 'POST') return send(res, 404, { error: { message: 'endpoint sconosciuto' } });
    // A form of another site cannot send this type without asking first.
    if (!/^application\/json\b/i.test(req.headers['content-type'] ?? '')) return send(res, 415, { error: { message: 'solo JSON' } });
    readBody(req)
      .then((body) => (m ? gate.forward(m[1], body) : gate.writeCache(body)))
      .then((answer) => send(res, answer.status, answer.text))
      .catch((e: Error) => {
        if (e instanceof TooLarge) {
          // What is still coming is not read: the connection ends with the answer.
          res.setHeader('Connection', 'close');
          req.resume();
          return send(res, 413, { error: { message: 'richiesta troppo grande' } });
        }
        console.warn(`Gemini non raggiunto: ${e.message}`);
        send(res, 502, { error: { message: 'Gemini non raggiungibile' } });
      });
  };
}

export function geminiProxy(gate: GeminiGate): Plugin {
  const handler = geminiRoute(gate);
  return {
    name: 'rune-gemini-proxy',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
