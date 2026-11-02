// How often someone may ask (T172, ADR-0114): a bucket per key, and who a request comes from. The limits of the messages of a game are in the world
// (ADR-0107); these are for what reaches this process before a world knows anyone: sockets, routes, what an account makes.

import { isIPv4, isIPv6 } from 'node:net';
import type { IncomingMessage } from 'node:http';

export interface Pace {
  /** What can be asked at once. */
  burst: number;
  /** What comes back every second. */
  perSecond: number;
}

/** Keys kept at most: whoever has this many addresses gets a fresh start by pushing out the oldest, and this process's memory stays what it is. */
const MAX_KEYS = 65536;

export class Rates {
  private buckets = new Map<string, { left: number; at: number }>();

  constructor(
    private pace: Pace,
    private now: () => number = Date.now,
  ) {}

  /** Whether `key` may ask now: if so, it is counted. */
  take(key: string): boolean {
    const t = this.now();
    const b = this.buckets.get(key);
    const left = b ? Math.min(this.pace.burst, b.left + ((t - b.at) / 1000) * this.pace.perSecond) : this.pace.burst;
    // Last in the map's order is the last heard: the first is the one to forget.
    this.buckets.delete(key);
    if (this.buckets.size >= MAX_KEYS) this.buckets.delete(this.buckets.keys().next().value as string);
    const ok = left >= 1;
    this.buckets.set(key, { left: ok ? left - 1 : left, at: t });
    return ok;
  }
}

/** An address as a bucket's key: an IPv4 as it is, however it arrives; an IPv6 by its first 64 bits, what one customer gets. Anything else is one key. */
export function addressKey(address: string): string {
  const s = address.trim().replace(/^::ffff:/i, '');
  if (isIPv4(s)) return s;
  if (!isIPv6(s)) return 'ignoto';
  const [head, tail] = s.split('%')[0].split('::');
  const before = head ? head.split(':') : [];
  const after = tail ? tail.split(':') : [];
  const missing = s.includes('::') ? 8 - before.length - after.length : 0;
  const whole = [...before, ...Array<string>(Math.max(0, missing)).fill('0'), ...after];
  return whole
    .slice(0, 4)
    .map((h) => parseInt(h, 16).toString(16))
    .join(':');
}

/** How many proxies of ours stand in front of this server (`QUINE_PROXY_FIDATI`), or undefined if what it says is not a number of them. */
export function proxyHops(text: string | undefined): number | undefined {
  const t = text?.trim();
  if (!t) return 0;
  return /^\d{1,2}$/.test(t) ? Number(t) : undefined;
}

/**
 * Who a request comes from. With no proxy of ours, the socket: `X-Forwarded-For` is only what the client wrote. With `hops`, each of them adds on the right
 * the address it saw, so the one the outermost saw is `hops` from the end, and what a client wrote stays to the left of it. Too short a list did not come through them.
 */
export function clientAddress(req: Pick<IncomingMessage, 'headers'> & { socket: { remoteAddress?: string } }, hops: number): string {
  if (hops > 0) {
    const said = String(req.headers['x-forwarded-for'] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const seen = said[said.length - hops];
    if (seen && addressKey(seen) !== 'ignoto') return addressKey(seen);
  }
  return addressKey(req.socket.remoteAddress ?? '');
}
