// Dev server: the sessions of the games of many (T38, ADR-0058). A WebSocket at /api/session?universo=<name>
// is a client of that universe; the first one starts its world (src/session/host.ts, loaded through Vite so the
// kernel's imports resolve as in the browser), which then keeps running in this process. Each message is
// one JSON object of src/session/protocol.ts. `?offline` starts a world with the local models.
// Only `npm run dev`: the preview server cannot load the kernel's sources.

import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Duplex } from 'node:stream';
import { WebSocketServer, type WebSocket } from 'ws';

const NAME_RE = /^[a-z0-9][a-z0-9-]{0,40}$/;
/** A message bigger than this is not a client's (the files go the other way). */
const MAX_MESSAGE = 256 * 1024;

type Host = { name: string; session: { connect(link: unknown): void }; stop(): void };

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
    else early.push(m);
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

export function sessionServer(): Plugin {
  const hosts = new Map<string, Promise<Host | { error: string }>>();
  return {
    name: 'rune-session',
    configureServer(server: ViteDevServer) {
      const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_MESSAGE });
      const open = (name: string, offline: boolean) => {
        let h = hosts.get(name);
        if (!h) {
          const port = (server.httpServer?.address() as AddressInfo | null)?.port ?? 5173;
          h = server
            .ssrLoadModule('/src/session/host.ts')
            .then((mod) => mod.openUniverse({ name, base: `http://localhost:${port}`, offline }))
            .catch((e: Error) => ({ error: e.message }));
          hosts.set(name, h);
          // A universe that could not open is tried again by the next client.
          void h.then((r) => 'error' in r && hosts.delete(name));
        }
        return h;
      };
      server.httpServer?.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        // Vite's own socket (hot reload) has its own path and protocol: only ours is taken.
        if (url.pathname !== '/api/session') return;
        wss.handleUpgrade(req, socket, head, (ws) => {
          const link = wsLink(ws);
          const name = url.searchParams.get('universo') ?? '';
          if (!NAME_RE.test(name)) {
            link.send({ t: 'rifiuto', motivo: 'universo sconosciuto' });
            return ws.close();
          }
          void open(name, url.searchParams.has('offline')).then((h) => {
            if ('error' in h) {
              link.send({ t: 'rifiuto', motivo: h.error });
              return ws.close();
            }
            h.session.connect(link);
          });
        });
      });
      server.httpServer?.on('close', () => {
        for (const h of hosts.values()) void h.then((x) => 'stop' in x && x.stop());
        wss.close();
      });
    },
  };
}
