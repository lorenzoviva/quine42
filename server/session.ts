// Dev server: the sessions of the games of many (T38, ADR-0058). A WebSocket at /api/session?universo=<name>
// is a client of that universe; the first one starts its world (src/session/host.ts, loaded through Vite so the
// kernel's imports resolve as in the browser), which then keeps running in this process. Each message is
// one JSON object of src/session/protocol.ts. `?offline` starts a world with the local models.
// Only `npm run dev`: the preview server cannot load the kernel's sources. With accounts (server/account.ts, T44b) every
// world verifies the token of who comes in.

import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Duplex } from 'node:stream';
import { WebSocketServer, type WebSocket } from 'ws';
import type { AccountSettings } from './account';
import { UNIVERSE_NAME_RE } from '../src/kernel/paths';
import { gate, refuse } from './access';
import { ledgerOf, sweepBalances } from './ledger';
import type { Kernel } from '../src/kernel/kernel';


/**
 * Whether a socket may open, and with which models its world starts if it is the first (T120, ADR-0102). Another site's page never;
 * without a verifier only this machine, and then what it asks is its own to decide; with accounts `?offline` is not heard.
 */
export function admitSocket(req: Pick<IncomingMessage, 'headers'> & { socket: { remoteAddress?: string } }, accounts: AccountSettings | undefined, askedOffline: boolean): { refused: string } | { offline: boolean } {
  const no = gate(req, accounts);
  if (no) return { refused: no.refused };
  return { offline: askedOffline && !accounts?.verify };
}
/** A message bigger than this is not a client's (the files go the other way). */
const MAX_MESSAGE = 256 * 1024;
/** Messages kept for a world still opening (T129): the rest is not heard. */
const MAX_EARLY = 16;

export type ActiveHost = { name: string; session: { connect(link: unknown): void; readonly kernel: Kernel; readonly clientCount?: number; connected?(): string[] }; stop(): void };
export const activeHosts = new Map<string, Promise<ActiveHost | { error: string }>>();

/** Returns the running kernel of an active universe session, if open. */
export async function getActiveUniverseKernel(name: string): Promise<Kernel | undefined> {
  const h = await activeHosts.get(name);
  if (h && 'session' in h && h.session?.kernel) {
    return h.session.kernel;
  }
  return undefined;
}

/** A WebSocket as a link of the protocol: what arrives before anyone listens is kept for them. */
function wsLink(ws: WebSocket) {
  const fns: Array<(m: unknown) => void> = [];
  const closes: Array<() => void> = [];
  const early: unknown[] = [];
  ws.on('message', (data) => {
    let m: unknown;
    try {
      m = JSON.parse(String(data));
    } catch {
      return;
    }
    if (fns.length) fns.forEach((f) => f(m));
    // Only `entra` is owed an answer before the world is open: a few are plenty.
    else if (early.length < MAX_EARLY) early.push(m);
  });
  ws.on('close', () => closes.forEach((f) => f()));
  return {
    send: (m: unknown) => {
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(m));
    },
    onMessage: (fn: (m: unknown) => void) => {
      fns.push(fn);
      early.splice(0).forEach(fn);
    },
    onClose: (fn: () => void) => void closes.push(fn),
    close: () => ws.close(),
  };
}

export function sessionServer(accounts?: AccountSettings, gemini?: typeof fetch, internal?: string, credits?: { universesDir: string; grantCap: number }): Plugin {
  return {
    name: 'rune-session',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url === '/api/session' && req.method === 'GET') {
          const no = gate(req, accounts);
          if (no) return refuse(res, no, (error) => ({ error }));
          // How many, not who: the master has the list of the players through their own session.
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
          return;
        }
        next();
      });
      const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_MESSAGE });
      const open = (name: string, offline: boolean) => {
        let h = activeHosts.get(name);
        if (!h) {
          const port = (server.httpServer?.address() as AddressInfo | null)?.port ?? 5173;
          // The balances come out of the universe's files before the world reads them, and go to its ledger (ADR-0104).
          h = (credits ? sweepBalances(credits.universesDir, name) : Promise.resolve())
            .then(() => server.ssrLoadModule('/src/session/host.ts'))
            .then((mod) => mod.openUniverse({ name, base: `http://localhost:${port}`, offline, gemini, verify: accounts?.verify, masterUid: accounts?.masterUid, internal, ...(credits ? { ledger: ledgerOf(credits.universesDir, name), grantCap: credits.grantCap } : {}) }))
            .catch((e: Error) => ({ error: e.message }));
          activeHosts.set(name, h);
          // A universe that could not open is tried again by the next client.
          void h.then((r) => 'error' in r && activeHosts.delete(name));
        }
        return h;
      };
      server.httpServer?.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        // Vite's own socket (hot reload) has its own path and protocol: only ours is taken.
        if (url.pathname !== '/api/session') return;
        const admitted = admitSocket(req, accounts, url.searchParams.has('offline'));
        if ('refused' in admitted) {
          socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
          socket.destroy();
          return;
        }
        wss.handleUpgrade(req, socket, head, (ws) => {
          const link = wsLink(ws);
          const name = url.searchParams.get('universo') ?? '';
          if (!UNIVERSE_NAME_RE.test(name)) {
            link.send({ t: 'rifiuto', motivo: 'universo sconosciuto' });
            return ws.close();
          }
          void open(name, admitted.offline).then((h) => {
            if ('error' in h) {
              link.send({ t: 'rifiuto', motivo: h.error });
              return ws.close();
            }
            h.session.connect(link);
          });
        });
      });
      server.httpServer?.on('close', () => {
        for (const h of activeHosts.values()) void h.then((x) => 'stop' in x && x.stop());
        activeHosts.clear();
        wss.close();
      });
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
