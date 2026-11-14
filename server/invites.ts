// The invite verifier (ADR-0184 §8, T366, ADR-0194): who a wanderer is on a server without Firebase (`QUINE_ACCOUNT=inviti`). The owner of the
// server has the secret (`QUINE_SEGRETO_INVITI`); an identity is a token signed with it (HMAC-SHA256), with an expiry, for an id that only this
// verifier makes: `inv-` and random letters, which no account of Firebase can be (`refusedUid`), so a universe that changes verifier never mixes
// the two. Every identity is written in a book beside the universes (`universes/.identities.json`, what made it and whether it is revoked): a
// token that is signed but not in the book, or revoked, is nobody. Identities are born of an invite to a private universe (the store's `guests`
// route, `campaign.ts`), and the owner's from a command on the server's machine (`npm run inviti`, tools/inviti/cli.ts). The token goes
// back to the browser once and is renewed while it is good (`POST /api/account`); it never goes in a log.

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import type { Account, Verifier } from '../src/session/account';
import { validWandererId } from '../src/kernel/wanderers';
import { serverPath } from './folders';
import { lockedSync, writeAtomic } from './lockedFile';

/** What every id of this verifier starts with: a Firebase uid that would start so is refused there (`refusedUid`), so the two never meet. */
export const INVITE_PREFIX = 'inv-';
/** The owner of the server: the one id that is not random, made by the command on the server's machine. */
export const OWNER_ID = 'inv-owner';
/** How long an identity token lasts; the browser renews it every time it comes back. */
export const IDENTITY_DAYS = 30;
/** The shortest secret the server takes (`productionProblems`). */
export const MIN_SECRET = 32;
const HEAD = 'qid1';
const DAY = 86_400_000;

export interface IdentityRecord {
  /** When it was made (ms). */
  made: number;
  /** The universe whose invite made it, or `owner`. */
  via: string;
  /** When it was revoked: from then on its tokens are nobody's. */
  revoked?: number;
}

/** What the server does with the identities, besides verifying them. */
export interface InviteIdentities {
  /** A new identity, born of an invite to `via`. */
  mint(via: string): { id: string; token: string };
  /** A token good for longer, for an identity whose token is still good; undefined otherwise. */
  renew(token: string): string | undefined;
  /** The identity is nobody's from now on. False: there was none. */
  revoke(id: string): boolean;
  /** What the book says of an id. */
  record(id: string): IdentityRecord | undefined;
}

/** Whether an id is one this verifier makes. */
export const isInviteId = (id: unknown): id is string => typeof id === 'string' && id.startsWith(INVITE_PREFIX) && validWandererId(id);

/** Why a secret is not good enough, or undefined. Never its value. */
export function secretProblem(secret: string | undefined): string | undefined {
  const s = secret?.trim() ?? '';
  if (!s) return 'manca';
  if (s.length < MIN_SECRET) return `è troppo corto: almeno ${MIN_SECRET} caratteri`;
  return undefined;
}

const keyOf = (secret: string) => createHmac('sha256', secret.trim()).update('quine:identity').digest();
const signature = (secret: string, body: string) => createHmac('sha256', keyOf(secret)).update(`${HEAD}.${body}`).digest('base64url');

/** A token for an identity, good until `expires` (ms). */
export function signIdentity(secret: string, id: string, expires: number): string {
  const body = Buffer.from(JSON.stringify({ id, exp: expires })).toString('base64url');
  return `${HEAD}.${body}.${signature(secret, body)}`;
}

/** The identity a token proves, if its signature is this secret's and it has not expired; it says nothing of the book. */
export function readIdentity(secret: string, token: unknown, now: number): { id: string; expires: number } | undefined {
  if (typeof token !== 'string' || token.length > 512) return undefined;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== HEAD) return undefined;
  const said = Buffer.from(parts[2]);
  const right = Buffer.from(signature(secret, parts[1]));
  if (said.length !== right.length || !timingSafeEqual(said, right)) return undefined;
  try {
    const p = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (!isInviteId(p?.id) || typeof p.exp !== 'number' || !Number.isFinite(p.exp) || p.exp <= now) return undefined;
    return { id: p.id, expires: p.exp };
  } catch {
    return undefined;
  }
}

function readBook(text: string): Record<string, IdentityRecord> {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('libro delle identità illeggibile');
  const out: Record<string, IdentityRecord> = {};
  for (const [id, r] of Object.entries(data as Record<string, Partial<IdentityRecord>>)) {
    if (!isInviteId(id) || !r || typeof r !== 'object') continue;
    out[id] = { made: Number(r.made) || 0, via: typeof r.via === 'string' ? r.via : '', ...(typeof r.revoked === 'number' ? { revoked: r.revoked } : {}) };
  }
  return out;
}

/** The book of the identities: one file, read again when it changes on disk, written under its lock. */
export class IdentityBook {
  private cache?: { stamp: string; book: Record<string, IdentityRecord> };

  constructor(readonly file: string) {}

  static of(universesDir: string): IdentityBook {
    return new IdentityBook(serverPath(universesDir, 'identities'));
  }

  /** The book; none if there is no file. One that cannot be read throws: verifying on it would let in, or keep out, the wrong ones. */
  read(): Record<string, IdentityRecord> {
    let stamp: string;
    try {
      const st = statSync(this.file);
      stamp = `${st.mtimeMs}:${st.size}`;
    } catch {
      if (existsSync(this.file)) throw new Error('libro delle identità illeggibile');
      this.cache = undefined;
      return {};
    }
    if (this.cache?.stamp === stamp) return this.cache.book;
    const book = readBook(readFileSync(this.file, 'utf8'));
    this.cache = { stamp, book };
    return book;
  }

  /** Whether an identity is in the book and not revoked. A book that cannot be read lets nobody in. */
  live(id: string): boolean {
    try {
      const r = this.read()[id];
      return !!r && r.revoked === undefined;
    } catch {
      return false;
    }
  }

  /** Changes the book under its lock, reading it again first. */
  change<T>(fn: (book: Record<string, IdentityRecord>) => T): T {
    return lockedSync(this.file, 'libro delle identità occupato: riprova tra poco', () => {
      this.cache = undefined;
      const book = this.read();
      const before = JSON.stringify(book);
      const out = fn(book);
      const text = JSON.stringify(book, null, 1);
      if (JSON.stringify(book) !== before) writeAtomic(this.file, `${text}\n`);
      this.cache = undefined;
      return out;
    });
  }
}

/** A new random id: `inv-` and 16 letters and digits (80 bits), never the owner's. */
export function newInviteId(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
  const bytes = randomBytes(16);
  let s = '';
  for (const b of bytes) s += alphabet[b & 31];
  return `${INVITE_PREFIX}${s}`;
}

/** The verifier of a server without Firebase, and what the routes do with its identities. */
export function inviteVerifier(secret: string, book: IdentityBook, opts: { now?: () => number; days?: number } = {}): { verify: Verifier; identities: InviteIdentities } {
  const now = opts.now ?? Date.now;
  const life = (opts.days ?? IDENTITY_DAYS) * DAY;
  const verify: Verifier = async (token) => {
    const said = readIdentity(secret, token, now());
    if (!said || !book.live(said.id)) return undefined;
    const a: Account = { uid: said.id, anonymous: false };
    return a;
  };
  const identities: InviteIdentities = {
    mint(via) {
      const at = now();
      const id = book.change((b) => {
        let made = newInviteId();
        while (b[made]) made = newInviteId();
        b[made] = { made: at, via };
        return made;
      });
      return { id, token: signIdentity(secret, id, at + life) };
    },
    renew(token) {
      const said = readIdentity(secret, token, now());
      if (!said || !book.live(said.id)) return undefined;
      return signIdentity(secret, said.id, now() + life);
    },
    revoke(id) {
      if (!isInviteId(id)) return false;
      return book.change((b) => {
        const r = b[id];
        if (!r) return false;
        if (r.revoked === undefined) r.revoked = now();
        return true;
      });
    },
    record(id) {
      try {
        return book.read()[id];
      } catch {
        return undefined;
      }
    },
  };
  return { verify, identities };
}

/** The owner's identity, made (or made good again) in the book, and a token for it: what the command on the server's machine prints. */
export function ownerIdentity(secret: string, book: IdentityBook, at = Date.now(), days = IDENTITY_DAYS): string {
  book.change((b) => {
    const r = b[OWNER_ID];
    if (!r || r.revoked !== undefined) b[OWNER_ID] = { made: at, via: 'owner' };
  });
  return signIdentity(secret, OWNER_ID, at + days * DAY);
}

/** Whether a Firebase uid would look like an id of this verifier: refused there, so that an account and an invite never share a wanderer. */
export const refusedUid = (uid: string) => uid.toLowerCase().startsWith(INVITE_PREFIX);
