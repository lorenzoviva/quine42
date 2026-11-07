// What a lab and the site ask the server of the handmade cards (T294, ADR-0169): `/api/handmade` (server/handmade.ts) with the account's
// token, and what a player may read of a universe (`/api/universe/<name>`, only what `publicFiles` gives to who is not its master).
// Never Gemini: the labs run every program in the browser, so for a player they cost no credits.

import type { HandmadeSummary, HandmadeView } from '../../src/kernel/handmade';
import type { FileMap } from '../../src/kernel/types';
import type { SignedIn } from '../../src/session/login';
import { validWandererId } from '../../src/kernel/wandererIds';

export interface Answer<T = Record<string, unknown>> {
  ok: boolean;
  status: number;
  body: T & { ok?: boolean; reason?: string; errors?: string[] };
}

export const HANDMADE_API = '/api/handmade';
/** How a client says its wanderer to a server without accounts (only this machine): `WANDERER_HEADER` of src/kernel/universes.ts. */
export const LOCAL_WANDERER_HEADER = 'x-quine-viandante';

/** The routes of the cards, as an account (or, on a server without accounts, as this machine: the id it says, or who plays alone). */
export class CardsClient {
  constructor(
    private readonly signed?: SignedIn,
    private readonly localId?: string,
  ) {}

  get anonymous(): boolean {
    return !!this.signed?.anonimo;
  }

  private async headers(json: boolean): Promise<Record<string, string>> {
    const h: Record<string, string> = {};
    if (this.signed) h.Authorization = `Bearer ${await this.signed.freshToken()}`;
    else if (this.localId) h[LOCAL_WANDERER_HEADER] = this.localId;
    if (json) h['Content-Type'] = 'application/json';
    return h;
  }

  async ask<T = Record<string, unknown>>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown): Promise<Answer<T>> {
    try {
      const r = await fetch(`${HANDMADE_API}${path}`, { method, headers: await this.headers(body !== undefined), cache: 'no-store', ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
      const parsed = (await r.json().catch(() => ({}))) as Answer<T>['body'];
      return { ok: r.ok, status: r.status, body: parsed };
    } catch {
      return { ok: false, status: 0, body: { reason: 'il server non risponde' } as Answer<T>['body'] };
    }
  }

  mine() {
    return this.ask<{ cards?: HandmadeSummary[]; signature?: string; used?: { cards: number; bytes: number }; caps?: { cards: number; bytes: number } }>('GET', '?mine=1');
  }

  everyone() {
    return this.ask<{ cards?: HandmadeSummary[] }>('GET', '');
  }

  open(id: string) {
    return this.ask<{ card?: HandmadeView }>('GET', `/${encodeURIComponent(id)}`);
  }

  create(body: Record<string, unknown>) {
    return this.ask<{ card?: HandmadeView }>('POST', '', body);
  }

  update(id: string, body: Record<string, unknown>) {
    return this.ask<{ card?: HandmadeView }>('POST', `/${encodeURIComponent(id)}`, body);
  }

  remove(id: string) {
    return this.ask('DELETE', `/${encodeURIComponent(id)}`);
  }

  sign(signature: string) {
    return this.ask<{ signature?: string }>('POST', '/signature', { signature });
  }

  /** The files of a universe this account may read: for who is not its master, only what `publicFiles` gives. */
  async universe(name: string): Promise<FileMap | undefined> {
    try {
      const r = await fetch(`/api/universe/${encodeURIComponent(name)}`, { headers: await this.headers(false), cache: 'no-store' });
      const snap = r.ok ? ((await r.json()) as { exists?: boolean; files?: FileMap }) : undefined;
      return snap?.exists && snap.files && typeof snap.files === 'object' ? snap.files : undefined;
    } catch {
      return undefined;
    }
  }
}

/** The universes on this server. */
export async function universeNames(): Promise<string[]> {
  try {
    const r = await fetch('/api/universe', { cache: 'no-store' });
    const body = r.ok ? ((await r.json()) as { universes?: unknown }) : undefined;
    return Array.isArray(body?.universes) ? body.universes.filter((n): n is string => typeof n === 'string') : [];
  } catch {
    return [];
  }
}

/** Whether a refusal says the labs are switched off (`site/beta.json → laboratori`). */
export const labsClosed = (a: Answer): boolean => a.status === 403 && /laboratori non sono aperti/.test(String(a.body.reason ?? ''));

/** Remembers the id this machine plays with, for the labs a page links to (their addresses do not carry it). */
export function rememberLocalWanderer(id: string): string {
  try {
    localStorage.setItem(LOCAL_ID_KEY, id);
  } catch {
    /* not remembered: the address says it */
  }
  return id;
}

/** The site's key of the id a player typed on a server without accounts (site/shared.ts). */
const LOCAL_ID_KEY = 'quine:sito:viandante';

/**
 * Without accounts (only this machine: development, the preview), the wanderer as the site and the game say it: `?viandante=` in the
 * address, remembered, or the one the site's pages remembered. None: who plays alone.
 */
export function localWanderer(): string | undefined {
  const asked = new URLSearchParams(location.search).get('viandante')?.toLowerCase();
  if (validWandererId(asked)) return rememberLocalWanderer(asked);
  let kept: string | null = null;
  try {
    kept = localStorage.getItem(LOCAL_ID_KEY);
  } catch {
    /* nothing kept */
  }
  return validWandererId(kept) ? kept : undefined;
}
