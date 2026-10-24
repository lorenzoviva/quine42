// The browser's end of a session (T39): a WebSocket at /api/session (server/session.ts) as a link of the protocol,
// and who this browser's wanderer is. What is sent before the socket opens waits for it.

import { validWandererId } from '../kernel/wanderers';
import type { ClientLink, ClientMsg, ServerMsg } from './protocol';

export function socketLink(universe: string, offline: boolean): ClientLink {
  const url = new URL('/api/session', location.href);
  url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  url.searchParams.set('universo', universe);
  if (offline) url.searchParams.set('offline', '');
  const ws = new WebSocket(url);
  const queue: string[] = [];
  const fns: Array<(m: ServerMsg) => void> = [];
  const closes: Array<() => void> = [];
  ws.onopen = () => queue.splice(0).forEach((m) => ws.send(m));
  ws.onmessage = (e) => {
    let m: ServerMsg;
    try {
      m = JSON.parse(String(e.data));
    } catch {
      return;
    }
    fns.forEach((f) => f(m));
  };
  ws.onclose = () => closes.forEach((f) => f());
  return {
    send: (m: ClientMsg) => {
      const s = JSON.stringify(m);
      if (ws.readyState === WebSocket.OPEN) ws.send(s);
      else if (ws.readyState === WebSocket.CONNECTING) queue.push(s);
    },
    onMessage: (fn) => void fns.push(fn),
    onClose: (fn) => void closes.push(fn),
    close: () => ws.close(),
  };
}

/**
 * This tab's wanderer: `?viandante=<id>`, or one made up once per tab (two tabs are two wanderers, a reload is
 * the same one). Accounts come with T44.
 */
export function tabWanderer(params: URLSearchParams): string {
  const asked = params.get('viandante')?.toLowerCase();
  if (validWandererId(asked)) return asked;
  try {
    const kept = sessionStorage.getItem('rune:viandante');
    if (validWandererId(kept)) return kept;
    const made = `v${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('rune:viandante', made);
    return made;
  } catch {
    return `v${Math.random().toString(36).slice(2, 8)}`;
  }
}
