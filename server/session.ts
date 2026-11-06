// The sessions of the multiplayer games (T38, ADR-0058). A WebSocket at /api/session?universo=<name>
// is a client of that universe; the first one starts its world, in a process of its own (server/worldHost.ts, T127, ADR-0110), which then
// keeps running watched from here. Each message is one JSON object of src/session/protocol.ts. `?offline` starts a world with the local models.
// `npm run dev` and the production server (server/production.ts, T133): the preview server does not start worlds. With accounts (server/account.ts, T44b) every world verifies, through
// this process, the token of who comes in.

import { isGenerating, worldLit, worldOut } from './generation';
import type { Connect, Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Duplex } from 'node:stream';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocketServer, type WebSocket } from 'ws';
import type { AccountSettings } from './account';
import { UNIVERSE_NAME_RE } from '../src/kernel/paths';
import { failureText, gameIn, gate, refuse } from './access';
import { PROGRAMS_DIR } from './hidden';
import { runGit, settleGit } from './git';
import { serverPath } from './folders';
import { sweepBalances } from './ledger';
import { Rates, type Pace } from './rates';
import { buildWorld, sweepPrograms, WorldHost, type HostLink, type WorldTimes } from './worldHost';
import type { WorldCalls } from './worldCalls';


/**
 * Whether a socket may open, and with which models its world starts if it is the first (T120, ADR-0102). Another site's page never;
 * without a verifier only this machine, and then what it asks is its own to decide; with accounts `?offline` is not heard.
 */
export function admitSocket(req: Pick<IncomingMessage, 'headers'> & { socket: { remoteAddress?: string } }, accounts: AccountSettings | undefined, askedOffline: boolean): { refused: string } | { offline: boolean } {
  const no = gate(req, accounts);
  if (no) return { refused: no.refused };
  return { offline: askedOffline && !accounts?.verify };
}
/** Worlds running at once, unless the `.env` says otherwise (`QUINE_MONDI_MASSIMI`): each is a process with its own heap (V-025). */
export const DEFAULT_MAX_WORLDS = 16;

/**
 * Why a socket may not start the world of this universe, or undefined. A socket says a name before it says who it is, so only a multiplayer game that
 * exists starts anything, and no more than `max` at once: a process for every name asked would stop this machine (V-025).
 */
export function worldRefusal(universesDir: string | undefined, name: string, running: number, max = DEFAULT_MAX_WORLDS): string | undefined {
  if (universesDir) {
    const root = path.join(universesDir, name);
    if (!fs.existsSync(path.join(root, '.git'))) return `l'universo «${name}» non esiste`;
    let config: string | undefined;
    try {
      config = fs.readFileSync(path.join(root, 'universe.json'), 'utf8');
    } catch {
      /* read as nothing: a game alone */
    }
    if (!gameIn(config).many) return `«${name}» è una partita in singola`;
    // A deferred generation holds it (T207, ADR-0143): the world would write over what it commits.
    if (isGenerating(universesDir, name)) return `«${name}» si sta generando: riprova quando ha finito`;
  }
  return running >= max ? 'troppi mondi accesi su questo server: riprova tra poco' : undefined;
}

/** A message bigger than this is not a client's (the files go the other way). */
const MAX_MESSAGE = 256 * 1024;
/** Messages kept for a world still opening (T129): the rest is not heard. */
const MAX_EARLY = 16;
/** How long a socket has to say who it is (ms): until then it holds a place in no world, and costs only itself (V-026). */
export const ENTRY_MS = 15000;
/** Sockets of one account at once: tabs, not a place in every world (V-026). */
export const ACCOUNT_SOCKETS = 4;
/** How often an account, or an address, may be the one who starts a world that was stopped: six, then one every 100 s (V-026). */
export const WORLD_STARTS: Pace = { burst: 6, perSecond: 0.01 };

export type ActiveHost = { name: string; session: { connect(link: HostLink): void; readonly clientCount?: number; connected?(): string[] }; calls?: WorldCalls; stop(): void | Promise<void> };
export const activeHosts = new Map<string, Promise<ActiveHost | { error: string }>>();
/** The worlds that were left empty, while they save: the next one of that universe starts when they have finished (V-026). */
const stopping = new Map<string, Promise<void>>();

/** What the routes can ask of the running world of a universe, if there is one. */
export async function getActiveWorld(name: string): Promise<WorldCalls | undefined> {
  // What it is saving is on the disk the route would read.
  await stopping.get(name);
  const h = await activeHosts.get(name);
  return h && 'calls' in h ? h.calls : undefined;
}

/** What a socket said to come in. */
export interface EntrySaid {
  token?: unknown;
}

/** A WebSocket as a link of the protocol: what arrives before anyone listens is kept for them, from `join` on (before it nothing goes to a world). */
export function wsLink(ws: Pick<WebSocket, 'on' | 'send' | 'close' | 'readyState' | 'OPEN'>): HostLink & { entry(ms: number): Promise<EntrySaid | undefined> } {
  const fns: Array<(m: unknown) => void> = [];
  const closes: Array<() => void> = [];
  const early: unknown[] = [];
  let said: EntrySaid | undefined;
  let before = 0;
  let waiting: ((m: EntrySaid | undefined) => void) | undefined;
  ws.on('message', (data) => {
    let m: unknown;
    try {
      m = JSON.parse(String(data));
    } catch {
      return;
    }
    if (!said) {
      if ((m as { t?: unknown } | null)?.t !== 'join') {
        // Who only talks without saying who they are has nothing to wait for.
        if (++before > MAX_EARLY) ws.close();
        return;
      }
      said = m as EntrySaid;
      waiting?.(said);
    }
    if (fns.length) fns.forEach((f) => f(m));
    // Only `join` is owed an answer before the world is open: a few are plenty.
    else if (early.length < MAX_EARLY) early.push(m);
  });
  ws.on('close', () => {
    waiting?.(undefined);
    closes.forEach((f) => f());
  });
  return {
    /** What it said to come in, or undefined if it closed, or said nothing in `ms`. */
    entry: (ms) =>
      new Promise((done) => {
        if (said || ws.readyState !== ws.OPEN) return done(said);
        const timer = setTimeout(() => done(undefined), ms);
        waiting = (m) => {
          clearTimeout(timer);
          done(m);
        };
      }),
    send: (m: unknown) => {
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(m));
    },
    sendText: (json: string) => {
      if (ws.readyState === ws.OPEN) ws.send(json);
    },
    onMessage: (fn: (m: unknown) => void) => {
      fns.push(fn);
      early.splice(0).forEach(fn);
    },
    // A socket can close while its world opens, before anyone listens: it would stay in that world for ever (V-028).
    onClose: (fn: () => void) => {
      if (ws.readyState === ws.OPEN) closes.push(fn);
      else fn();
    },
    close: () => ws.close(),
  };
}

/** GET /api/session: how many, not who (the master has the list of the players through their own session). */
export function sessionList(accounts?: AccountSettings): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const url = req.url?.split('?')[0];
    if (url !== '/api/session' || req.method !== 'GET') return next();
    const no = gate(req, accounts);
    if (no) return refuse(res, no, (error) => ({ error }));
    const sessions: Array<{ name: string; active: boolean; clients: number }> = [];
    for (const [name, hostPromise] of activeHosts.entries()) {
      try {
        const h = await hostPromise;
        if (h && 'session' in h) {
          sessions.push({
            name,
            active: true,
            clients: h.session.clientCount ?? h.session.connected?.().length ?? 0,
          });
        }
      } catch {
        // ignore
      }
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ sessions }));
  };
}

export interface SessionOptions {
  accounts?: AccountSettings;
  gemini?: typeof fetch;
  internal?: string;
  credits?: { universesDir: string; grantCap: number; platformFee?: number };
  memoryMb?: number;
  /** Worlds running at once (`QUINE_MONDI_MASSIMI`, V-025). */
  maxWorlds?: number;
  /** For the tests: how long a world lasts empty, and the rest of its times. */
  times?: Partial<WorldTimes>;
  /** For the tests: how long a socket has to say who it is. */
  entryMs?: number;
  /** Who a socket comes from and how many it may have: the production server's, where strangers are (ADR-0114). */
  crowd?: { addressOf(req: IncomingMessage): string; rate(address: string): boolean; atOnce: number };
  /** The program of the worlds: built when needed by the dev server, already there in production. */
  program: () => Promise<string>;
  /** What is refused before the rules of `gate`: the production server's origins (T133). */
  guard?: (req: IncomingMessage) => string | undefined;
}

/** The sockets of the multiplayer games on a server, whichever it is. `stop` stops the worlds, saving what they can, and closes the clients. */
export function attachSessions(httpServer: HttpServer, o: SessionOptions): { stop(): Promise<void> } {
  const { accounts, gemini, internal, credits, memoryMb, maxWorlds, program, crowd } = o;
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_MESSAGE });
  /** Sockets now, by account and by address. */
  const accountSockets = new Map<string, number>();
  const addressSockets = new Map<string, number>();
  const starts = new Rates(WORLD_STARTS);
  const count = (of: Map<string, number>, key: string, by: 1 | -1) => {
    const n = (of.get(key) ?? 0) + by;
    if (n > 0) of.set(key, n);
    else of.delete(key);
  };
  /** A world left empty: from now on the universe has none, and the next client waits for this one to have saved. */
  const retire = (name: string) => {
    const h = activeHosts.get(name);
    if (!h) return;
    activeHosts.delete(name);
    const done = h
      .then((x) => ('stop' in x ? x.stop() : undefined))
      .catch(() => undefined)
      .finally(() => stopping.delete(name));
    stopping.set(name, done);
  };
  const running = () => activeHosts.size + stopping.size;
  const startWorld = async (name: string, offline: boolean): Promise<ActiveHost | { error: string }> => {
    const port = (httpServer.address() as AddressInfo | null)?.port ?? 5173;
    const universes = credits?.universesDir;
    // The balances come out of the universe's files before the world reads them, and go to its ledger (ADR-0104).
    if (universes) {
      await sweepBalances(universes, name);
      fs.mkdirSync(serverPath(universes, 'balances'), { recursive: true });
    }
    const world = new WorldHost({
      name,
      base: `http://localhost:${port}`,
      internal: internal ?? '',
      offline,
      gemini,
      verify: accounts?.verify,
      masterUid: accounts?.masterUid,
      ...(universes && credits ? { ledgerFile: path.join(serverPath(universes, 'balances'), `${name}.json`), grantCap: credits.grantCap, platformFee: credits.platformFee } : {}),
      entry: await program(),
      memoryMb,
      headOf: universes ? () => runGit(path.join(universes, name), ['rev-parse', 'HEAD'], { author: ['kernel', 'kernel@quine'] }).then((out) => out.trim()) : undefined,
      gits: universes ? () => settleGit(path.join(universes, name)) : undefined,
      times: o.times,
      onGiveUp: () => {
        activeHosts.delete(name);
        if (universes) worldOut(universes, name);
      },
      onIdle: () => retire(name),
    });
    // Lit before it opens: a generation that starts now sees it (T207). Out again when it fails or stops.
    if (universes) {
      worldLit(universes, name);
      // Each side writes its marker and then looks at the other's: of a world and a generation starting together, one sees the other.
      if (isGenerating(universes, name)) {
        worldOut(universes, name);
        return { error: `«${name}» si sta generando: riprova quando ha finito` };
      }
    }
    const opened = await world.start().catch((e: Error) => ({ error: e.message }));
    if ('error' in opened) {
      if (universes) worldOut(universes, name);
      return opened;
    }
    return {
      name,
      session: {
        connect: (link) => world.connect(link),
        get clientCount() {
          return world.clientCount;
        },
      },
      calls: world.calls,
      stop: () => world.stop().finally(() => universes && worldOut(universes, name)),
    };
  };
  const open = async (name: string, offline: boolean) => {
    await stopping.get(name);
    let h = activeHosts.get(name);
    if (!h) {
      const no = worldRefusal(credits?.universesDir, name, running(), maxWorlds);
      if (no) return { error: no };
      h = startWorld(name, offline).catch((e: Error) => ({ error: e.message }));
      activeHosts.set(name, h);
      // A universe that could not open is tried again by the next client.
      void h.then((r) => 'error' in r && activeHosts.delete(name));
    }
    return h;
  };
  /** A socket comes in: only now, and only for who proves who they are, does it take a place in a world, and start it if it is the first (V-026). */
  const admit = async (ws: WebSocket, link: ReturnType<typeof wsLink>, name: string, offline: boolean, address: string) => {
    const no = (reason: string) => {
      link.send({ t: 'refusal', reason });
      ws.close();
    };
    const said = await link.entry(o.entryMs ?? ENTRY_MS);
    if (!said) return no('nessun ingresso: entra di nuovo');
    if (accounts?.verify) {
      const token = typeof said.token === 'string' ? said.token : '';
      const account = token ? await accounts.verify(token).catch(() => undefined) : undefined;
      // The same words as the world's, which verifies again whoever it lets in.
      if (typeof account?.uid !== 'string' || !account.uid) return no(token ? 'accesso non valido o scaduto: entra di nuovo' : 'serve un account per entrare');
      if (ws.readyState !== ws.OPEN) return;
      const uid = account.uid;
      if ((accountSockets.get(uid) ?? 0) >= ACCOUNT_SOCKETS) return no('troppe finestre aperte con questo account');
      count(accountSockets, uid, 1);
      ws.once('close', () => count(accountSockets, uid, -1));
      const first = !activeHosts.has(name);
      if (first && !(starts.take(`account:${uid}`) && starts.take(`indirizzo:${address}`))) return no('troppi mondi avviati di recente: riprova tra poco');
    }
    if (ws.readyState !== ws.OPEN) return;
    const h = await open(name, offline);
    if ('error' in h) return no(failureText('mondo', h.error));
    h.session.connect(link);
  };
  httpServer.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    // Vite's own socket (hot reload) has its own path and protocol: only ours is taken.
    if (url.pathname !== '/api/session') return;
    const guarded = o.guard?.(req);
    const admitted = guarded ? { refused: guarded } : admitSocket(req, accounts, url.searchParams.has('offline'));
    if ('refused' in admitted) {
      socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }
    const address = crowd?.addressOf(req) ?? req.socket.remoteAddress ?? '';
    if (crowd && (!crowd.rate(address) || (addressSockets.get(address) ?? 0) >= crowd.atOnce)) {
      socket.write('HTTP/1.1 429 Too Many Requests\r\nRetry-After: 30\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }
    if (crowd) {
      count(addressSockets, address, 1);
      socket.once('close', () => count(addressSockets, address, -1));
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      const link = wsLink(ws);
      const name = url.searchParams.get('universo') ?? '';
      if (!UNIVERSE_NAME_RE.test(name)) {
        link.send({ t: 'refusal', reason: 'universo sconosciuto' });
        return ws.close();
      }
      // A name that could never start a world is told at once, without waiting to hear who asks (V-025).
      const never = activeHosts.has(name) || stopping.has(name) ? undefined : worldRefusal(credits?.universesDir, name, running(), maxWorlds);
      if (never) {
        link.send({ t: 'refusal', reason: failureText('mondo', never) });
        return ws.close();
      }
      admit(ws, link, name, admitted.offline, address).catch((e) => {
        link.send({ t: 'refusal', reason: failureText('mondo', e) });
        ws.close();
      });
    });
  });
  let stopped: Promise<void> | undefined;
  const stop = () =>
    (stopped ??= (async () => {
      const halting = [...activeHosts.values()].map((h) => h.then((x) => ('stop' in x ? x.stop() : undefined)));
      activeHosts.clear();
      await Promise.allSettled([...halting, ...stopping.values()]);
      for (const ws of wss.clients) ws.terminate();
      wss.close();
    })());
  httpServer.on('close', () => void stop());
  return { stop };
}

export function sessionServer(accounts?: AccountSettings, gemini?: typeof fetch, internal?: string, credits?: SessionOptions['credits'], memoryMb?: number, maxWorlds?: number): Plugin {
  return {
    name: 'rune-session',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(sessionList(accounts));
      // The program of the worlds: built once, and again if the sources changed since (a world that is running keeps its own).
      let outDir: string | undefined;
      let built: Promise<string> | undefined;
      server.watcher?.on('change', (f) => {
        if (/[\\/](src|universe|server)[\\/]/.test(f)) built = undefined;
      });
      const program = () => {
        const root = server.config.root;
        const folder = path.join(root, PROGRAMS_DIR);
        if (!outDir) sweepPrograms(folder);
        outDir = path.join(folder, String(process.pid));
        return (built ??= buildWorld(root, { outDir, preserveSymlinks: server.config.resolve.preserveSymlinks }));
      };
      if (!server.httpServer) return;
      const { stop } = attachSessions(server.httpServer as HttpServer, { accounts, gemini, internal, credits, memoryMb, maxWorlds, program });
      server.httpServer.on('close', () => void stop().then(() => outDir && fs.rmSync(outDir, { recursive: true, force: true })));
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url === '/api/session' && req.method === 'GET') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ sessions: [] }));
          return;
        }
        next();
      });
    },
  };
}
