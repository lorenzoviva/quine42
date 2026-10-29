// The queue of the subscriptions (T68, ADR-0077): /api/coda keeps the Council's slow requests on disk until a process
// using the CLIs of a subscription (Claude Code, Antigravity) serves them. Local only: the dev server and the preview of
// whoever plays; the server of many never uses it (src/kernel/ai/subscription.ts).
//
// One folder (`universes/.coda/`, ignored by git), one file per state of a request:
//   <id>.richiesta.json   waiting (what QueueModels sent: provider, agent, task, system, prompt, schema…)
//   <id>.presa.json       taken by the process (renamed, so two processes never take the same)
//   <id>.risposta.json    answered: { text } or { errore }, with `usage` when the CLI says it
//   servitore-<provider>.json   the heartbeat of the process that serves that provider ({ tempo, pid })
// Ids sort by time: the oldest request is served first.

import type { Connect, Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { SUBSCRIPTIONS, type Provider, type QueuedAnswer } from '../src/kernel/ai/subscription';

const MAX_BODY = 24 * 1024 * 1024;
/** A process whose heartbeat is older than this does not serve any more. */
export const HEARTBEAT_S = 30;

export interface QueuedRequest {
  id: string;
  provider: Exclude<Provider, 'api'>;
  agent: string;
  task: string;
  system: string;
  prompt: string;
  schema?: unknown;
  images?: string[];
  temperature?: number;
  thinking?: string;
  chi?: string;
  /** ISO time it entered the queue. */
  creata: string;
}

const file = (dir: string, id: string, kind: 'richiesta' | 'presa' | 'risposta') => path.join(dir, `${id}.${kind}.json`);
const safeId = (id: string) => /^[a-z0-9-]{1,40}$/.test(id);
let counter = 0;

async function exists(p: string): Promise<boolean> {
  return fs.access(p).then(
    () => true,
    () => false,
  );
}

/** Written whole or not at all: the other side never reads half a file. */
async function writeAtomic(p: string, body: unknown): Promise<void> {
  const tmp = `${p}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(body), 'utf8');
  await fs.rename(tmp, p);
}

/** Checks what a client sent; gives the reason when it is not a request. */
export function checkRequest(raw: unknown): string | undefined {
  const r = raw as Partial<QueuedRequest> | undefined;
  if (!r || typeof r !== 'object') return 'richiesta non valida';
  if (!SUBSCRIPTIONS.includes(r.provider as Exclude<Provider, 'api'>)) return `provider sconosciuto: ${String(r.provider)}`;
  for (const k of ['agent', 'task', 'system', 'prompt'] as const) if (typeof r[k] !== 'string') return `manca ${k}`;
  if (r.images !== undefined && (!Array.isArray(r.images) || r.images.some((i) => typeof i !== 'string'))) return 'immagini non valide';
  return undefined;
}

export async function enqueue(dir: string, raw: Omit<QueuedRequest, 'id' | 'creata'>, now = new Date()): Promise<string> {
  await fs.mkdir(dir, { recursive: true });
  const id = `${now.getTime().toString(36).padStart(10, '0')}-${(counter++ % 1296).toString(36).padStart(2, '0')}${Math.random().toString(36).slice(2, 6)}`;
  const { provider, agent, task, system, prompt, schema, images, temperature, thinking, chi } = raw;
  const req: QueuedRequest = { id, provider, agent, task, system, prompt, schema, images, temperature, thinking, chi, creata: now.toISOString() };
  await writeAtomic(file(dir, id, 'richiesta'), req);
  return id;
}

/** Where a request is; once answered, the answer is given once and its files go away. */
export async function look(dir: string, id: string): Promise<QueuedAnswer> {
  if (!safeId(id)) return { stato: 'fallita', errore: 'id non valido' };
  const answer = file(dir, id, 'risposta');
  if (await exists(answer)) {
    let a: { text?: unknown; errore?: unknown; usage?: QueuedAnswer['usage'] } = {};
    try {
      a = JSON.parse(await fs.readFile(answer, 'utf8'));
    } catch {
      a = { errore: 'risposta illeggibile' };
    }
    await withdraw(dir, id);
    if (typeof a.text === 'string' && a.text) return { stato: 'fatta', text: a.text, ...(a.usage ? { usage: a.usage } : {}) };
    return { stato: 'fallita', errore: typeof a.errore === 'string' ? a.errore : 'risposta vuota', ...(a.usage ? { usage: a.usage } : {}) };
  }
  if (await exists(file(dir, id, 'presa'))) return { stato: 'in corso' };
  if (await exists(file(dir, id, 'richiesta'))) return { stato: 'in coda' };
  return { stato: 'fallita', errore: 'richiesta sconosciuta' };
}

/** Every file of a request (the game stopped waiting, or it read the answer). */
export async function withdraw(dir: string, id: string): Promise<void> {
  if (!safeId(id)) return;
  await Promise.all((['richiesta', 'presa', 'risposta'] as const).map((k) => fs.rm(file(dir, id, k), { force: true })));
}

/** The serving process: the oldest waiting request of its provider, now taken; undefined when there is none. */
export async function take(dir: string, provider: Exclude<Provider, 'api'>): Promise<QueuedRequest | undefined> {
  const names = await fs.readdir(dir).catch(() => [] as string[]);
  for (const name of names.filter((n) => n.endsWith('.richiesta.json')).sort()) {
    const id = name.slice(0, -'.richiesta.json'.length);
    let req: QueuedRequest;
    try {
      req = JSON.parse(await fs.readFile(path.join(dir, name), 'utf8'));
    } catch {
      continue;
    }
    if (req.provider !== provider) continue;
    try {
      await fs.rename(path.join(dir, name), file(dir, id, 'presa'));
    } catch {
      continue; // another process took it
    }
    return req;
  }
  return undefined;
}

/** The serving process: the answer of a taken request (dropped if the game withdrew it meanwhile). */
export async function answer(dir: string, id: string, a: { text?: string; errore?: string; usage?: QueuedAnswer['usage'] }): Promise<boolean> {
  if (!safeId(id) || !(await exists(file(dir, id, 'presa')))) return false;
  await writeAtomic(file(dir, id, 'risposta'), a);
  await fs.rm(file(dir, id, 'presa'), { force: true });
  return true;
}

/** The serving process says it is alive. */
export async function beat(dir: string, provider: Exclude<Provider, 'api'>, now = new Date()): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
  await writeAtomic(path.join(dir, `servitore-${provider}.json`), { tempo: now.toISOString(), pid: process.pid });
}

/** The providers a live process serves. */
export async function served(dir: string, now = new Date()): Promise<Array<Exclude<Provider, 'api'>>> {
  const out: Array<Exclude<Provider, 'api'>> = [];
  for (const p of SUBSCRIPTIONS) {
    try {
      const h = JSON.parse(await fs.readFile(path.join(dir, `servitore-${p}.json`), 'utf8'));
      if (now.getTime() - Date.parse(h.tempo) < HEARTBEAT_S * 1000) out.push(p);
    } catch {
      /* nobody serves it */
    }
  }
  return out;
}

/** Requests waiting, of every provider (the status of the queue). */
export async function waiting(dir: string): Promise<number> {
  const names = await fs.readdir(dir).catch(() => [] as string[]);
  return names.filter((n) => n.endsWith('.richiesta.json')).length;
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) reject(new Error('richiesta troppo grande'));
      else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** `POST /api/coda` → { id }; `GET /api/coda/<id>` → QueuedAnswer; `DELETE /api/coda/<id>`; `GET /api/coda/stato`. */
export function subscriptionQueue(dir: string): Plugin {
  const handler: Connect.NextHandleFunction = (req, res, next) => {
    if (!req.url?.startsWith('/api/coda')) return next();
    const route = req.url.split('?')[0].slice('/api/coda'.length).replace(/^\//, '');
    (async () => {
      if (!route && req.method === 'POST') {
        let raw: unknown;
        try {
          raw = JSON.parse(await readBody(req));
        } catch (e) {
          return send(res, 400, { errore: (e as Error).message });
        }
        const why = checkRequest(raw);
        if (why) return send(res, 400, { errore: why });
        return send(res, 200, { id: await enqueue(dir, raw as QueuedRequest) });
      }
      if (route === 'stato' && req.method === 'GET') return send(res, 200, { serviti: await served(dir), inCoda: await waiting(dir) });
      if (route && req.method === 'GET') return send(res, 200, await look(dir, decodeURIComponent(route)));
      if (route && req.method === 'DELETE') {
        await withdraw(dir, decodeURIComponent(route));
        return send(res, 200, { ok: true });
      }
      send(res, 404, { errore: 'endpoint sconosciuto' });
    })().catch((e: Error) => send(res, 500, { errore: e.message }));
  };
  return {
    name: 'rune-subscription-queue',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
