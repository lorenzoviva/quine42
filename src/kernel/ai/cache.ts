// The explicit caches of Gemini (T351, ADR-0186): which stable prefix (the system instructions of a call that asks for it, today
// only the Actor's) has a cache at Google, until when, and when to write one. Only the policy is here; the write itself is the
// model layer's (GeminiAiModels), the gate counts it against the day's cap (server/geminiProxy.ts).
//
// The policy: a prefix asked once is not worth a cache (the write costs as much as the prompt, and the storage is paid for the
// whole `ttl`), so the cache is written the second time the same prefix is asked within a `ttl`; it is named until a margin
// before it ends (a call in flight must not name a cache that is gone), then a new one is written at the next call. A prefix
// Gemini refused (too short, a model without caches, the cap) is not asked again for a `ttl`. Calls asked together wait for the
// same write. Never more than MAX_CACHES prefixes are followed: the oldest is forgotten (Google drops it when its `ttl` ends).

import { EXPLICIT_CACHE } from './prices';

/** What a write gives back: the name Google gave the cache. */
export interface WrittenCache {
  name: string;
}

export interface ExplicitCacheOptions {
  /** Writes a cache of `system` for `model`, kept `ttl` seconds; undefined when Gemini (or the gate) said no. */
  write: (model: string, system: string, ttl: number, agent: string) => Promise<WrittenCache | undefined>;
  /** Milliseconds (tests). */
  now?: () => number;
  /** Seconds a cache is kept; EXPLICIT_CACHE.ttl when missing. */
  ttl?: number;
}

/** Seconds before its end a cache is no longer named: more than the timeout of a request (120 s). */
export const CACHE_MARGIN = 150;
/** Prefixes followed at once (a world has few: the Actor with and without a focus, a change of the rules). */
export const MAX_CACHES = 8;

interface Entry {
  name?: string;
  /** Milliseconds: when the cache is no longer named. */
  until: number;
  /** A write under way. */
  pending?: Promise<string | undefined>;
  /** Milliseconds: until when the prefix is not written again (Gemini said no). */
  refused: number;
  /** Times asked in the window that started at `since`. */
  asked: number;
  since: number;
  used: number;
  /** A cache of it was written once: when it ends and the prefix is asked again, it is written again at once. */
  proven?: boolean;
}

/** Characters per token, on the safe side (the Council's prompts are 3.26 on average, T325): a prefix shorter than this is not tried. */
const CHARS_PER_TOKEN = 4;

export class ExplicitCaches {
  readonly ttl: number;
  private entries = new Map<string, Entry>();
  private now: () => number;

  constructor(private o: ExplicitCacheOptions) {
    this.ttl = Math.max(CACHE_MARGIN * 2, Math.min(EXPLICIT_CACHE.maxTtl, Math.round(o.ttl ?? EXPLICIT_CACHE.ttl)));
    this.now = o.now ?? (() => Date.now());
  }

  /** The name of the cache to use for this prefix, or undefined: then the call goes whole, as always. Never throws. */
  async nameFor(model: string, system: string, agent = 'kernel'): Promise<string | undefined> {
    if (system.length / CHARS_PER_TOKEN < EXPLICIT_CACHE.minTokens) return undefined;
    const key = `${model}\u0000${system}`;
    const now = this.now();
    let e = this.entries.get(key);
    if (!e) {
      e = { until: 0, refused: 0, asked: 0, since: now, used: now };
      this.entries.set(key, e);
      this.trim();
    }
    e.used = now;
    if (e.pending) return e.pending;
    if (e.name && now < e.until) return e.name;
    e.name = undefined;
    if (now < e.refused) return undefined;
    if (now - e.since > this.ttl * 1000) {
      e.asked = 0;
      e.since = now;
    }
    if (++e.asked < 2 && !e.proven) return undefined;
    const entry = e;
    entry.pending = this.o
      .write(model, system, this.ttl, agent)
      .catch(() => undefined)
      .then((w) => {
        entry.pending = undefined;
        const at = this.now();
        if (w?.name) {
          entry.name = w.name;
          // From when the write ended: Google started the clock a little earlier, the margin covers it.
          entry.until = at + (this.ttl - CACHE_MARGIN) * 1000;
          entry.asked = 0;
          entry.proven = true;
          return w.name;
        }
        entry.refused = at + this.ttl * 1000;
        return undefined;
      });
    return entry.pending;
  }

  /** The cache of this prefix is gone (Gemini or the gate no longer know it): the next call goes whole and counts anew. */
  forget(model: string, system: string): void {
    this.entries.delete(`${model}\u0000${system}`);
  }

  /** The caches named now (tests, the console). */
  live(): Array<{ model: string; name: string; until: number }> {
    const now = this.now();
    return [...this.entries.entries()].filter(([, e]) => e.name && now < e.until).map(([k, e]) => ({ model: k.split('\u0000')[0], name: e.name!, until: e.until }));
  }

  private trim(): void {
    while (this.entries.size > MAX_CACHES) {
      let oldest: string | undefined;
      let at = Infinity;
      for (const [k, e] of this.entries) if (!e.pending && e.used < at) [oldest, at] = [k, e.used];
      if (oldest === undefined) return;
      this.entries.delete(oldest);
    }
  }
}
