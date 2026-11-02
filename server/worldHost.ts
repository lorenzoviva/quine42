// The worlds of many, each in a process of its own, and who watches them (T127, ADR-0107). The kernel, Lua and the programs of the
// models run there; here stay the HTTP, the sockets and the secrets. A world that stops answering is killed and started
// again from what is on disk; one that keeps dying goes back to the last commit that lived; the clients stay connected and are told.
// What the world asks here (Gemini, verifying a token) passes through this process's own limits.

import { fork, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { Verifier } from '../src/session/account';
import type { ClientMsg, ServerMsg } from '../src/session/protocol';
import type { FromWorld, GeminiAnswer, GeminiCall, ToWorld, WorldCallName, WorldOpen } from '../src/session/worldwire';
import { worldToken } from './access';
import type { WorldCalls } from './worldCalls';

/** The heap of a world, in MB, unless the `.env` says otherwise (`QUINE_MONDO_MEMORIA`). */
export const DEFAULT_WORLD_MEMORY = 1024;

export interface WorldTimes {
  /** Silence after which the clients are told the world has stopped (ms). */
  notice: number;
  /** Silence after which it is killed. More than MAX_FORM_TIME, the longest a valid program may hold the world (ms). */
  kill: number;
  /** How long a world has to open (ms). */
  boot: number;
  /** Alive this long, a world's commit is taken as good and its past deaths forgotten (ms). */
  healthy: number;
  /** How long a route waits for an answer (ms). */
  call: number;
  /** After this many deaths in a row the world is given up: the next client tries again. */
  deaths: number;
}

export const WORLD_TIMES: WorldTimes = { notice: 5000, kill: 45000, boot: 180000, healthy: 60000, call: 10000, deaths: 4 };

/** A client of the session, as the sockets give it. */
export interface HostLink {
  send(m: ServerMsg): void;
  /** The same, already written. */
  sendText?(json: string): void;
  onMessage(fn: (m: unknown) => void): void;
  onClose(fn: () => void): void;
  close(): void;
}

interface Connected {
  link: HostLink;
  /** It has a place in the world running now. */
  attached: boolean;
  /** What it said before the world could hear it. */
  early: ClientMsg[];
  /** It has been in a world: when a new one is up it must come in again. */
  entered: boolean;
}

export interface WorldOptions {
  name: string;
  base: string;
  /** The server's secret: the world gets only the token derived from it. */
  internal: string;
  offline?: boolean;
  gemini?: typeof fetch;
  verify?: Verifier;
  masterUid?: string;
  ledgerFile?: string;
  grantCap?: number;
  /** The program of the process, and what it may read besides its own folder. */
  entry: string;
  entryArgs?: string[];
  reads?: string[];
  memoryMb?: number;
  times?: Partial<WorldTimes>;
  /** The commit the universe is at now, to know the last good one. */
  headOf?: () => Promise<string | undefined>;
  /** The world was given up. */
  onGiveUp?: (why: string) => void;
}

/** Node's flags that limit a world: its heap, and (where Node has it) what it may touch on disk. No child processes, no workers. */
export function worldFlags(o: Pick<WorldOptions, 'entry' | 'reads' | 'memoryMb' | 'ledgerFile'>): string[] {
  const flags = [`--max-old-space-size=${o.memoryMb ?? DEFAULT_WORLD_MEMORY}`];
  if (!process.allowedNodeEnvironmentFlags.has('--permission')) return flags;
  // A folder allowed opens all that is below it, so never one above the program (the `.env` is there). Without the two `preserve` flags Node's
  // module loader would look at every step of the path, and need them.
  const folders = [path.dirname(o.entry), ...(o.reads ?? [])];
  flags.push('--preserve-symlinks', '--preserve-symlinks-main', '--permission', ...folders.map((d) => `--allow-fs-read=${d}${path.sep}*`));
  if (o.ledgerFile) flags.push(`--allow-fs-read=${o.ledgerFile}*`, `--allow-fs-write=${o.ledgerFile}*`);
  return flags;
}

/** The environment of a world: nothing of this process's, where the secrets are. What is left only lets Windows and Node start. */
export function worldEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { NODE_ENV: 'production' };
  for (const k of ['SystemRoot', 'SYSTEMROOT', 'TEMP', 'TMP']) if (process.env[k]) env[k] = process.env[k];
  return env;
}

export class WorldHost {
  private child?: ChildProcess;
  private clients = new Map<number, Connected>();
  private nextClient = 0;
  private up = false;
  private stopped = false;
  private lastBeat = 0;
  private startedAt = 0;
  private told = false;
  private deaths = 0;
  private good?: string;
  private candidate?: string;
  private candidateAt = 0;
  private restore?: string;
  private watchdog?: ReturnType<typeof setInterval>;
  private asked = 0;
  private waiting = new Map<number, { done: (v: unknown) => void; fail: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  private readyWaiters: Array<(r: { ok: true } | { error: string }) => void> = [];
  private times: WorldTimes;
  /** How many times it has started again. */
  restarts = 0;

  constructor(private o: WorldOptions) {
    this.times = { ...WORLD_TIMES, ...o.times };
  }

  get name(): string {
    return this.o.name;
  }

  /** Starts the world; the answer says whether it opened. A world that does not open at the very first try is not kept alive. */
  start(): Promise<{ ok: true } | { error: string }> {
    this.spawn();
    this.watchdog = setInterval(() => this.watch(), Math.min(1000, Math.max(50, this.times.notice / 2)));
    this.watchdog.unref?.();
    return this.whenReady();
  }

  private whenReady(): Promise<{ ok: true } | { error: string }> {
    if (this.up) return Promise.resolve({ ok: true });
    if (this.stopped) return Promise.resolve({ error: 'il mondo è fermo' });
    return new Promise((done) => this.readyWaiters.push(done));
  }

  private spawn(): void {
    const o = this.o;
    const restore = this.restore;
    this.restore = undefined;
    const child = fork(o.entry, o.entryArgs ?? [], {
      execArgv: worldFlags(o),
      env: worldEnv(),
      stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
      serialization: 'json',
    });
    this.child = child;
    this.up = false;
    this.startedAt = this.lastBeat = Date.now();
    this.told = false;
    child.on('message', (m) => {
      if (this.child === child) this.heard(m as FromWorld);
    });
    child.on('exit', (code, signal) => {
      if (this.child === child) this.died(`uscito (${signal ?? code})`);
    });
    child.on('error', (e) => {
      if (this.child === child) this.died(e.message);
    });
    const open: WorldOpen = {
      name: o.name,
      base: o.base,
      token: worldToken(o.internal, o.name),
      ...(o.offline ? { offline: true } : {}),
      ...(o.gemini ? { gemini: true } : {}),
      ...(o.verify ? { verify: true } : {}),
      ...(o.masterUid ? { masterUid: o.masterUid } : {}),
      ...(o.ledgerFile ? { ledgerFile: o.ledgerFile, grantCap: o.grantCap } : {}),
      ...(restore ? { restore } : {}),
    };
    this.tell({ t: 'apri', open });
  }

  private tell(m: ToWorld): void {
    const c = this.child;
    if (c?.connected) c.send(m, () => undefined);
  }

  private heard(m: FromWorld): void {
    if (!m || typeof m !== 'object') return;
    switch (m.t) {
      case 'pronto':
        this.up = true;
        this.lastBeat = Date.now();
        for (const [cid, c] of this.clients) this.attach(cid, c);
        this.readyWaiters.splice(0).forEach((done) => done({ ok: true }));
        return;
      case 'errore':
        // It answered: there is nothing to run. A first opening says so to who asked; on a restart it counts as a death.
        if (!this.restarts) {
          this.stopped = true;
          this.clear();
          this.readyWaiters.splice(0).forEach((done) => done({ error: String(m.motivo) }));
        }
        this.child?.kill();
        return;
      case 'vivo':
        this.lastBeat = Date.now();
        if (this.told) {
          this.told = false;
          this.toClients({ t: 'mondo', stato: 'ripreso', testo: 'Il mondo è di nuovo in moto.' });
        }
        return;
      case 'invia': {
        const c = this.clients.get(m.cid);
        if (!c || typeof m.json !== 'string') return;
        if (c.link.sendText) c.link.sendText(m.json);
        else c.link.send(JSON.parse(m.json));
        return;
      }
      case 'chiudi':
        return this.clients.get(m.cid)?.link.close();
      case 'chiedi':
        return void this.answer(m.id, m.op, m.args);
      case 'risposta': {
        const w = this.waiting.get(m.id);
        if (!w) return;
        this.waiting.delete(m.id);
        clearTimeout(w.timer);
        if (m.ok) w.done(m.value);
        else w.fail(new Error(String(m.error ?? 'nessuna risposta')));
        return;
      }
    }
  }

  /** What the world asks of this process: only these two things, each through its own limits. */
  private async answer(id: number, op: string, args: unknown[]): Promise<void> {
    const reply = (ok: boolean, value?: unknown, error?: string) => this.tell({ t: 'risposta', id, ok, ...(ok ? { value } : { error }) });
    try {
      if (op === 'verify' && this.o.verify && typeof args?.[0] === 'string') return reply(true, await this.o.verify(args[0]));
      if (op === 'gemini' && this.o.gemini) {
        const call = args?.[0] as GeminiCall;
        const r = await this.o.gemini(String(call?.url), { method: call?.method ?? 'POST', body: String(call?.body ?? '') });
        const out: GeminiAnswer = { status: r.status, text: await r.text() };
        return reply(true, out);
      }
      reply(false, undefined, 'non si può chiedere');
    } catch (e) {
      reply(false, undefined, (e as Error).message);
    }
  }

  private attach(cid: number, c: Connected): void {
    if (c.attached || !this.up) return;
    c.attached = true;
    this.tell({ t: 'client', cid });
    // They were in the world that died: they say who they are again (with a fresh token), and get the world as it is.
    if (c.entered) c.link.send({ t: 'mondo', stato: 'ripartito', testo: 'Il mondo è ripartito dall’ultimo stato salvato.' });
    for (const m of c.early.splice(0)) this.pass(cid, c, m);
  }

  private pass(cid: number, c: Connected, m: ClientMsg): void {
    if (m?.t === 'entra') c.entered = true;
    this.tell({ t: 'msg', cid, m });
  }

  /** A client of this world. It stays connected across the world's restarts. */
  connect(link: HostLink): void {
    const cid = ++this.nextClient;
    const c: Connected = { link, attached: false, early: [], entered: false };
    this.clients.set(cid, c);
    link.onMessage((raw) => {
      const m = raw as ClientMsg;
      if (!m || typeof m !== 'object') return;
      if (c.attached && this.up) return this.pass(cid, c, m);
      // With the world down only who comes in waits for it: steps and actions belong to a world that is gone.
      if (m.t === 'entra' && !c.entered) c.early = [m];
    });
    link.onClose(() => {
      this.clients.delete(cid);
      if (c.attached && this.up) this.tell({ t: 'chiuso', cid });
    });
    this.attach(cid, c);
  }

  get clientCount(): number {
    return this.clients.size;
  }

  private toClients(m: ServerMsg): void {
    for (const c of this.clients.values()) c.link.send(m);
  }

  /** Is it still turning? And has what it runs lived long enough to be called good? */
  private watch(): void {
    if (this.stopped || !this.child) return;
    const now = Date.now();
    if (!this.up) {
      if (now - this.startedAt > this.times.boot) this.child.kill('SIGKILL');
      return;
    }
    const silent = now - this.lastBeat;
    if (silent > this.times.kill) {
      this.child.kill('SIGKILL');
      return;
    }
    if (silent > this.times.notice) {
      if (!this.told) {
        this.told = true;
        this.toClients({ t: 'mondo', stato: 'fermo', testo: 'Il mondo si è fermato: aspetta, sta per riprendere.' });
      }
      return;
    }
    void this.markGood(now);
  }

  /** A commit seen `healthy` ago, with the world alive ever since, is good; and the deaths before are forgotten. */
  private async markGood(now: number): Promise<void> {
    if (now - this.startedAt > this.times.healthy) this.deaths = 0;
    if (!this.o.headOf || now - this.candidateAt < this.times.healthy) return;
    this.candidateAt = now;
    const seen = this.candidate;
    this.candidate = undefined;
    const born = this.startedAt;
    const head = await this.o.headOf().catch(() => undefined);
    if (seen && born === this.startedAt && now - born >= this.times.healthy) this.good = seen;
    if (born === this.startedAt) this.candidate = head;
  }

  private clear(): void {
    if (this.watchdog) clearInterval(this.watchdog);
    this.watchdog = undefined;
    this.failCalls('il mondo non risponde');
  }

  private failCalls(why: string): void {
    for (const w of this.waiting.values()) {
      clearTimeout(w.timer);
      w.fail(new Error(why));
    }
    this.waiting.clear();
  }

  private died(why: string): void {
    this.child = undefined;
    this.up = false;
    this.candidate = undefined;
    this.candidateAt = 0;
    for (const c of this.clients.values()) c.attached = false;
    this.failCalls('il mondo è ripartito');
    if (this.stopped) return;
    this.deaths++;
    console.warn(`[mondo ${this.o.name}] ${why}: ${this.deaths < this.times.deaths ? 'riparte' : 'non riparte'} (${this.deaths})`);
    if (this.deaths >= this.times.deaths) return this.giveUp(why);
    this.toClients({ t: 'mondo', stato: 'fermo', testo: 'Il mondo si è fermato: sta ripartendo.' });
    // The second death in a row: what the world runs now may be what kills it. Back to the last commit that lived.
    if (this.deaths >= 2 && this.good) this.restore = this.good;
    this.restarts++;
    this.spawn();
  }

  private giveUp(why: string): void {
    this.stopped = true;
    this.clear();
    this.readyWaiters.splice(0).forEach((done) => done({ error: `il mondo non riesce a partire (${why})` }));
    for (const c of this.clients.values()) {
      c.link.send({ t: 'rifiuto', motivo: 'il mondo non riesce a ripartire: riprova tra poco' });
      c.link.close();
    }
    this.clients.clear();
    this.o.onGiveUp?.(why);
  }

  /** What the routes ask of the running world; a world that is restarting is waited for, one that does not answer fails the route. */
  private async call<T>(op: WorldCallName, args: unknown[]): Promise<T> {
    const started = Date.now();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const ready = await Promise.race([this.whenReady(), new Promise<{ error: string }>((r) => (timeout = setTimeout(() => r({ error: 'il mondo non risponde' }), this.times.call)))]);
    clearTimeout(timeout);
    if ('error' in ready) throw new Error(ready.error);
    const left = Math.max(1, this.times.call - (Date.now() - started));
    const id = ++this.asked;
    return new Promise<T>((done, fail) => {
      const timer = setTimeout(() => {
        this.waiting.delete(id);
        fail(new Error('il mondo non risponde'));
      }, left);
      this.waiting.set(id, { done: done as (v: unknown) => void, fail, timer });
      this.tell({ t: 'chiedi', id, op, args });
    });
  }

  readonly calls: WorldCalls = {
    creditRecharge: (payment) => this.call('creditRecharge', [payment]),
    isAnonymous: (id) => this.call('isAnonymous', [id]),
    wallet: (universo, id, account) => this.call('wallet', [universo, id, account]),
    view: (universo, id, account) => this.call('view', [universo, id, account]),
    keepProfile: (universo, id, account, profilo) => this.call('keepProfile', [universo, id, account, profilo]),
  };

  /** Stops the world, letting it save if it can. */
  stop(): Promise<void> {
    this.stopped = true;
    this.clear();
    const c = this.child;
    if (!c || c.exitCode !== null) return Promise.resolve();
    return new Promise((done) => {
      const timer = setTimeout(() => c.kill('SIGKILL'), 3000);
      c.once('exit', () => {
        clearTimeout(timer);
        done();
      });
      if (c.connected) c.send({ t: 'ferma' } satisfies ToWorld, () => undefined);
      else c.kill('SIGKILL');
    });
  }
}

/** The programs left by servers that were killed: the folder is shared with the pipeline's other worktrees, so only those of processes that are gone. */
export function sweepPrograms(folder: string): void {
  for (const name of fs.existsSync(folder) ? fs.readdirSync(folder) : []) {
    const pid = Number(name);
    if (!Number.isInteger(pid) || pid <= 0) continue;
    try {
      process.kill(pid, 0);
    } catch {
      fs.rmSync(path.join(folder, name), { recursive: true, force: true });
    }
  }
}

/** wasmoon is CommonJS at heart: it asks for Node's modules with a `require` and looks at `__filename`. */
const PROGRAM_HEAD = "import { createRequire as quineRequire } from 'node:module'; import { fileURLToPath as quinePath } from 'node:url'; const require = quineRequire(import.meta.url); const __filename = quinePath(import.meta.url); const __dirname = quinePath(new URL('.', import.meta.url));";

/** The world's program, built with Vite into a folder of its own, whole (dependencies and the wasm of Lua too): that folder is all a world reads. */
export async function buildWorld(root: string, opts: { outDir: string; preserveSymlinks?: boolean }): Promise<string> {
  const { build } = await import('vite');
  fs.mkdirSync(opts.outDir, { recursive: true });
  await build({
    configFile: false,
    envFile: false,
    root,
    logLevel: 'error',
    resolve: { preserveSymlinks: !!opts.preserveSymlinks },
    ssr: { noExternal: true },
    build: {
      ssr: 'src/session/worldProcess.ts',
      outDir: opts.outDir,
      emptyOutDir: true,
      minify: false,
      reportCompressedSize: false,
      commonjsOptions: { ignoreDynamicRequires: true },
      rollupOptions: { output: { entryFileNames: 'mondo.mjs', banner: PROGRAM_HEAD } },
    },
  });
  fs.copyFileSync(path.join(path.dirname(createRequire(path.join(root, 'package.json')).resolve('wasmoon')), 'glue.wasm'), path.join(opts.outDir, 'glue.wasm'));
  return path.join(opts.outDir, 'mondo.mjs');
}
