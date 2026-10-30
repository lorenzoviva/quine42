// The heritage of clones (T45c, ADR-0084): a clone copies the cards of a universe, and a clone of a clone copies
// content that may have been changed more than once; who held it first gets a share of every use. A card carries
// the chain of the holders it had before (`origini`), one link per clone, each with a fingerprint of the content as
// it was cloned. At every use the shares go back along the chain: a fixed base (`eredita.base` in universe.json)
// plus a part that grows the less the content was changed since (`eredita.copia`); the rest stays with the holder
// after. Pure and light: the store on the dev server imports it through clone.ts.

import { hash32, hashStr } from './rng';

/** A holder a card had before a clone. */
export interface Origine {
  /** Whose card it was in the universe it came from. */
  titolare: string;
  /** That universe's name. */
  universo: string;
  /** The content's fingerprint when it was cloned (`fingerprint`). */
  impronta: number[];
}

/** universe.json → eredita: the share that goes back along the chain at every use. */
export interface Eredita {
  /** Always, however much the content was changed (0-1). */
  base: number;
  /** On top, for content cloned and never changed; less the more it was (0-1). */
  copia: number;
}

export const EREDITA: Eredita = { base: 0.1, copia: 0.4 };

/** Repairs universe.json → eredita: two numbers between 0 and 1 whose sum is at most 1. */
export function repairEredita(raw: unknown): Eredita {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : d);
  const base = num(r.base, EREDITA.base);
  return { base, copia: Math.min(num(r.copia, EREDITA.copia), 1 - base) };
}

/** The content of what holds a card, as text: keys sorted, every `carta` left out (who holds it is not what it is). */
export function contentText(o: unknown): string {
  const canon = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(canon);
    if (!v || typeof v !== 'object') return v;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v).sort()) if (k !== 'carta') out[k] = canon((v as Record<string, unknown>)[k]);
    return out;
  };
  return JSON.stringify(canon(o)) ?? '';
}

/** How many numbers a fingerprint has: the resolution of `changeOf` is their inverse. */
export const FINGERPRINT = 32;

/**
 * A fingerprint of a text (a MinHash of its runs of three words): two texts share as many of its numbers as they
 * share runs, so how much a content was changed is measured without keeping what it was.
 */
export function fingerprint(text: string): number[] {
  const words = text.match(/[\p{L}\p{N}_.-]+|[^\s\p{L}\p{N}]/gu) ?? [];
  const runs = new Set<number>();
  for (let i = 0; i < Math.max(1, words.length - 2); i++) runs.add(hashStr(words.slice(i, i + 3).join(' ')));
  const out: number[] = [];
  for (let k = 0; k < FINGERPRINT; k++) {
    let min = 0xffffffff;
    for (const h of runs) min = Math.min(min, hash32(k + 1, h));
    out.push(min);
  }
  return out;
}

/** How much a content changed between two fingerprints: 0 the same, 1 nothing in common. */
export function changeOf(before: number[], after: number[]): number {
  const n = Math.min(before.length, after.length);
  if (!n) return 1;
  let same = 0;
  for (let i = 0; i < n; i++) if (before[i] === after[i]) same++;
  return 1 - same / n;
}

/** A valid chain of origins (what is not one is left out). */
export function readOrigins(raw: unknown): Origine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((o) => o && typeof o.titolare === 'string' && typeof o.universo === 'string' && Array.isArray(o.impronta))
    .map((o) => ({ titolare: o.titolare, universo: o.universo, impronta: o.impronta.filter((n: unknown) => Number.isInteger(n)) }));
}

/**
 * Who gets what of one use of a card (wanderer → share, summing to 1): going back from the holder of now, each
 * link keeps what the content owes to the ones before — `base + copia × (1 − change)` — and passes it on; the
 * first holder keeps what reaches them. `now` is the fingerprint of the content as it is.
 */
export function sharesOf(titolare: string, origini: Origine[], now: number[], cfg: Eredita = EREDITA): Record<string, number> {
  const out: Record<string, number> = {};
  const add = (who: string, q: number) => {
    if (q > 0) out[who] = (out[who] ?? 0) + q;
  };
  let rest = 1;
  let later = now;
  for (let i = origini.length - 1; i >= 0; i--) {
    const past = cfg.base + cfg.copia * (1 - changeOf(origini[i].impronta, later));
    add(i === origini.length - 1 ? titolare : origini[i + 1].titolare, rest * (1 - past));
    rest *= past;
    later = origini[i].impronta;
  }
  add(origini.length ? origini[0].titolare : titolare, rest);
  return out;
}
