// The process of a world of many (T127, ADR-0110): started by server/worldHost.ts, built into one file with Vite. It has no secret in its
// environment and only reads what the server lets it (the permission model of Node); what needs a secret (Gemini, verifying a
// token) it asks over the channel. If the server goes away, so does it. The same program, started for one check and nothing else, tries the program
// of a handmade card (`check`, server/programCheck.ts, ADR-0161): it opens no universe then, and is killed past its time.

import { fileURLToPath } from 'node:url';
import { FileLedger, platformFeeOf } from '../../server/ledger';
import { handmadeProgramErrors } from '../kernel/handmade';
import { worldOf, type WorldCalls } from '../../server/worldCalls';
import { openUniverse, type UniverseHost } from './host';
import type { Account, Verifier } from './account';
import type { ClientMsg, ServerLink, ServerMsg } from './protocol';
import { WORLD_CALLS, type FromWorld, type GeminiAnswer, type GeminiCall, type ToWorld, type WorldOpen } from './worldwire';

/** A client's link at this end of the channel. */
interface Linked {
  fns: Array<(m: ClientMsg) => void>;
  closes: Array<() => void>;
  early: ClientMsg[];
}

const send = (m: FromWorld) => void process.send?.(m);
const linked = new Map<number, Linked>();
const waiting = new Map<number, { done: (v: unknown) => void; fail: (e: Error) => void }>();
let asked = 0;
let host: UniverseHost | undefined;
let calls: WorldCalls | undefined;

function ask<T>(op: 'gemini' | 'verify' | 'typesafe', args: unknown[]): Promise<T> {
  const id = ++asked;
  return new Promise<T>((done, fail) => {
    waiting.set(id, { done: done as (v: unknown) => void, fail });
    send({ t: 'chiedi', id, op, args });
  });
}

/** `fetch` for Gemini (or for TypeSafe, ADR-0157): over the channel, to the only one who has the key and its limits. */
const overChannel = (op: 'gemini' | 'typesafe') => (async (input: RequestInfo | URL, init?: RequestInit) => {
  const call: GeminiCall = { url: String(input), method: init?.method, body: typeof init?.body === 'string' ? init.body : undefined };
  const answer = ask<GeminiAnswer>(op, [call]);
  const signal = init?.signal;
  // Who gave up does not wait; what was already sent may be paid, as with any request.
  const r = await (signal
    ? Promise.race([answer, new Promise<never>((_, fail) => (signal.aborted ? fail(signal.reason) : signal.addEventListener('abort', () => fail(signal.reason), { once: true })))])
    : answer);
  return new Response(r.text, { status: r.status, headers: { 'Content-Type': 'application/json' } });
}) as typeof fetch;
const gemini = overChannel('gemini');
const typesafe = overChannel('typesafe');

const verify: Verifier = (token) => ask<Account | undefined>('verify', [token]);

function linkOf(cid: number): ServerLink {
  const l: Linked = { fns: [], closes: [], early: [] };
  linked.set(cid, l);
  return {
    send: (m: ServerMsg) => send({ t: 'invia', cid, json: JSON.stringify(m) }),
    onMessage(fn) {
      l.fns.push(fn);
      l.early.splice(0).forEach(fn);
    },
    onClose: (fn) => void l.closes.push(fn),
    close: () => send({ t: 'chiudi', cid }),
  };
}

async function open(o: WorldOpen): Promise<void> {
  const opened = await openUniverse({
    name: o.name,
    base: o.base,
    token: o.token,
    offline: o.offline,
    gemini: o.gemini ? gemini : undefined,
    typesafe: o.typesafe ? typesafe : undefined,
    verify: o.verify ? verify : undefined,
    masterUid: o.masterUid,
    restore: o.restore,
    grantCap: o.grantCap,
    // Its environment holds only what the server put there (`worldEnv`).
    platformFee: platformFeeOf(process.env),
    // The server made the folder: this process may write only this file and those beside it (its lock, its temporary one).
    ledger: o.ledgerFile ? new FileLedger(o.ledgerFile, { folderReady: true }) : undefined,
    onBeat: (tick) => send({ t: 'vivo', tick }),
    // Beside the program: the only folder this process reads.
    wasmUri: fileURLToPath(new URL('./glue.wasm', import.meta.url)),
  });
  if ('error' in opened) return send({ t: 'errore', motivo: opened.error });
  host = opened;
  calls = worldOf(opened.session.kernel);
  send({ t: 'pronto' });
}

async function answer(id: number, op: string, args: unknown[]): Promise<void> {
  try {
    if (!calls || !(WORLD_CALLS as readonly string[]).includes(op)) throw new Error('il mondo non sa rispondere');
    const fn = calls[op as keyof WorldCalls] as (...a: unknown[]) => unknown;
    send({ t: 'risposta', id, ok: true, value: await fn(...args) });
  } catch (e) {
    send({ t: 'risposta', id, ok: false, error: (e as Error).message });
  }
}

async function stop(): Promise<void> {
  try {
    await host?.stop();
  } finally {
    process.exit(0);
  }
}

process.on('message', (m: ToWorld) => {
  switch (m.t) {
    case 'apri':
      return void open(m.open).catch((e: Error) => send({ t: 'errore', motivo: e.message }));
    case 'client':
      host?.session.connect(linkOf(m.cid));
      return;
    case 'msg': {
      const l = linked.get(m.cid);
      if (!l) return;
      if (l.fns.length) {
        try {
          l.fns.forEach((f) => f(m.m));
        } catch (e) {
          // The floor (rule 7): what a client says does not end the world's process.
          console.warn(`[mondo] messaggio non capito: ${(e as Error).message}`);
        }
      } else l.early.push(m.m);
      return;
    }
    case 'chiuso': {
      const l = linked.get(m.cid);
      linked.delete(m.cid);
      l?.closes.forEach((f) => f());
      return;
    }
    case 'chiedi':
      return void answer(m.id, m.op, m.args);
    case 'risposta': {
      const w = waiting.get(m.id);
      waiting.delete(m.id);
      if (m.ok) w?.done(m.value);
      else w?.fail(new Error(m.error ?? 'nessuna risposta'));
      return;
    }
    case 'ferma':
      return void stop();
    case 'check': {
      // The program of a handmade card (ADR-0161): the whole check here, in a process that has nothing else and is killed past its time.
      let errors: string[];
      try {
        errors = handmadeProgramErrors(m.program);
      } catch (e) {
        errors = [`il programma non si può controllare: ${(e as Error)?.message ?? e}`];
      }
      return void send({ t: 'checked', id: m.id, errors });
    }
  }
});
process.on('disconnect', () => process.exit(0));
// A promise nobody waits for fails: it is logged. By default Node would end the process, and every player in it would lose what was not saved.
process.on('unhandledRejection', (e) => console.warn(`[mondo] promessa fallita: ${(e as Error)?.message ?? e}`));
