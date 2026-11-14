// The private universe (ADR-0188 point 2, T366, ADR-0193): who may come into a universe of many, outside the universe like the balances
// (`universes/.campaign/<nome>.json`, ADR-0104), so that no clone, export, brought card, rollback, Lua, Council or branch reaches it, and the world
// never reads it (rule 8g). The guests by wanderer id; the invites as SHA-256 of random tokens, with an expiry and the uses left. Only the master
// writes it, through the store's `guests` route:
//
//   GET    /api/universe/<name>/guests                                   → { private, guests, invites }   (the master; no token ever)
//   POST   /api/universe/<name>/guests { op: 'private', value }          the universe private or not; going private, who is in the world now stays
//   POST   /api/universe/<name>/guests { op: 'add', id, note? }          a guest by id
//   POST   /api/universe/<name>/guests { op: 'invite', days?, uses?, note? } → { token, invite }  the token goes out once, here
//   POST   /api/universe/<name>/guests { op: 'redeem', invite }          anyone: an invite good for this universe makes the caller a guest; with
//                                                                        the invite verifier and no identity, it makes one (`identity`, once)
//   DELETE /api/universe/<name>/guests { guest: id } | { invite: name }  a guest out (their sockets closed, an identity born here revoked), an invite revoked
//
// To whoever is not its master nor a guest, a private universe is not there: the store's reads, the list, the sessions and the wanderer's routes
// answer as for a name that does not exist (`letsIn`); the sockets are refused in `admit` (server/session.ts) before the world starts.

import { createHash, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { cleanText } from '../src/kernel/cleantext';
import { UNIVERSE_NAME_RE } from '../src/kernel/paths';
import { validWandererId } from '../src/kernel/wanderers';
import { gameIn, isMasterOf, owns, type Caller, type Game } from './access';
import { serverPath } from './folders';
import type { InviteIdentities } from './invites';
import { lockedSync, writeAtomic } from './lockedFile';

export interface Guest {
  /** Since when (ms). */
  since: number;
  /** Who let them in: the master, by id or by an invite. */
  by: string;
  note?: string;
  /** The invite they came with (its name, never its token). */
  invite?: string;
}

export interface Invite {
  made: number;
  expires: number;
  uses: number;
  left: number;
  by: string;
  note?: string;
}

export interface Campaign {
  private: boolean;
  guests: Record<string, Guest>;
  /** By the SHA-256 of the token, in hex: the token itself is nowhere on this server. */
  invites: Record<string, Invite>;
}

/** What the master may write: guests and live invites at most, a note's length, an invite's days and uses (the defaults are D54.7: a week, one use). */
export const CAMPAIGN_LIMITS = {
  guests: 200,
  invites: 50,
  note: 80,
  days: { min: 1, max: 30, default: 7 },
  uses: { min: 1, max: 20, default: 1 },
} as const;

const DAY = 86_400_000;
const HASH_RE = /^[0-9a-f]{64}$/;
/** What names an invite to its master: the start of its hash, which says nothing of the token. */
export const inviteName = (hash: string) => hash.slice(0, 16);
export const newInviteToken = () => randomBytes(32).toString('base64url');
export const inviteHash = (token: string) => createHash('sha256').update(token).digest('hex');
const INVITE_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

export const emptyCampaign = (): Campaign => ({ private: false, guests: {}, invites: {} });

const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : 0);
const noteOf = (x: unknown) => (typeof x === 'string' && x ? { note: x.slice(0, CAMPAIGN_LIMITS.note) } : {});

/** A campaign as the file says it, repaired: what is not a guest or an invite is left out. */
export function readCampaign(raw: unknown): Campaign {
  const c = emptyCampaign();
  if (!raw || typeof raw !== 'object') return c;
  const r = raw as Record<string, unknown>;
  c.private = r.private === true;
  for (const [id, g] of Object.entries((r.guests as Record<string, Partial<Guest>>) ?? {})) {
    if (!validWandererId(id) || !g || typeof g !== 'object') continue;
    c.guests[id] = { since: num(g.since), by: typeof g.by === 'string' ? g.by : '', ...noteOf(g.note), ...(typeof g.invite === 'string' ? { invite: g.invite.slice(0, 16) } : {}) };
  }
  for (const [hash, i] of Object.entries((r.invites as Record<string, Partial<Invite>>) ?? {})) {
    if (!HASH_RE.test(hash) || !i || typeof i !== 'object') continue;
    c.invites[hash] = { made: num(i.made), expires: num(i.expires), uses: Math.max(1, num(i.uses)), left: Math.max(0, num(i.left)), by: typeof i.by === 'string' ? i.by : '', ...noteOf(i.note) };
  }
  return c;
}

/** The invites that can still be used. */
const liveInvites = (c: Campaign, now: number) => Object.entries(c.invites).filter(([, i]) => i.expires > now && i.left > 0);

/** The guests and invites of every universe of a folder: one file each, read again when it changes, written under its lock. */
export class CampaignArchive {
  private cache = new Map<string, { stamp: string; campaign: Campaign }>();

  constructor(
    readonly dir: string,
    readonly universesDir: string,
  ) {}

  static of(universesDir: string): CampaignArchive {
    return new CampaignArchive(serverPath(universesDir, 'campaign'), universesDir);
  }

  fileOf(name: string): string {
    if (!UNIVERSE_NAME_RE.test(name)) throw new Error('nome non valido');
    return path.join(this.dir, `${name}.json`);
  }

  /** A universe's campaign; a public one with nobody if it has no file. One that cannot be read throws: `letsIn` takes it for private. */
  read(name: string): Campaign {
    const file = this.fileOf(name);
    let stamp: string;
    try {
      const st = statSync(file);
      stamp = `${st.mtimeMs}:${st.size}`;
    } catch {
      if (existsSync(file)) throw new Error('archivio degli ospiti illeggibile');
      this.cache.delete(file);
      return emptyCampaign();
    }
    const hit = this.cache.get(file);
    if (hit?.stamp === stamp) return hit.campaign;
    let campaign: Campaign;
    try {
      campaign = readCampaign(JSON.parse(readFileSync(file, 'utf8')));
    } catch {
      throw new Error('archivio degli ospiti illeggibile');
    }
    this.cache.set(file, { stamp, campaign });
    return campaign;
  }

  /** Changes a universe's campaign under its lock, reading it again first; what is spent or expired goes away. */
  change<T>(name: string, fn: (c: Campaign) => T, now = Date.now()): T {
    const file = this.fileOf(name);
    return lockedSync(file, 'archivio degli ospiti occupato: riprova tra poco', () => {
      this.cache.delete(file);
      const c = this.read(name);
      const before = JSON.stringify(c);
      const out = fn(c);
      for (const [hash, i] of Object.entries(c.invites)) if (i.expires <= now || i.left <= 0) delete c.invites[hash];
      if (JSON.stringify(c) !== before) writeAtomic(file, `${JSON.stringify(c, null, 1)}\n`);
      this.cache.delete(file);
      return out;
    });
  }

  /** A universe born again under this name starts public, with nobody (ADR-0188): the file of the one before goes. */
  forget(name: string): void {
    const file = this.fileOf(name);
    lockedSync(file, 'archivio degli ospiti occupato: riprova tra poco', () => rmSync(file, { force: true }));
    this.cache.delete(file);
  }

  /** What a universe's `universe.json` says of its game. */
  gameOf(name: string): Game {
    let text: string | undefined;
    try {
      text = readFileSync(path.join(this.universesDir, name, 'universe.json'), 'utf8');
    } catch {
      /* none: a game alone */
    }
    return gameIn(text);
  }

  /** Whether a universe is private; one whose file cannot be read is. */
  isPrivate(name: string): boolean {
    try {
      return this.read(name).private;
    } catch {
      return true;
    }
  }

  /** Whether this caller may see the universe: `letsIn`, with a file that cannot be read taken for a private one with nobody. */
  lets(name: string, who: Caller, game: Game = this.gameOf(name), masterUid?: string): boolean {
    let c: Campaign;
    try {
      c = this.read(name);
    } catch {
      c = { ...emptyCampaign(), private: true };
    }
    return letsIn(who, game, c, masterUid);
  }

  /**
   * An invite used by `id`: one use spent and `id` among the guests, or why not. A guest already in does not spend it (it can go to someone else).
   * The words are the same for a token that never was and one spent or expired: who tries tokens learns nothing.
   */
  redeem(name: string, token: string, id: string, now = Date.now()): { ok: true; already?: true } | { refused: string } {
    if (!INVITE_TOKEN_RE.test(token) || !validWandererId(id)) return { refused: 'invito non valido o scaduto' };
    const hash = inviteHash(token);
    return this.change(
      name,
      (c): { ok: true; already?: true } | { refused: string } => {
        const i = c.invites[hash];
        if (!i || i.expires <= now || i.left <= 0) return { refused: 'invito non valido o scaduto' };
        if (c.guests[id]) return { ok: true, already: true };
        if (Object.keys(c.guests).length >= CAMPAIGN_LIMITS.guests) return { refused: `al più ${CAMPAIGN_LIMITS.guests} ospiti` };
        i.left--;
        c.guests[id] = { since: now, by: i.by, ...(i.note ? { note: i.note } : {}), invite: inviteName(hash) };
        return { ok: true };
      },
      now,
    );
  }
}

/** Whether a caller is among a universe's guests. */
export const guestOf = (who: Pick<Caller, 'id'>, c: Campaign): boolean => !!who.id && Object.hasOwn(c.guests, who.id);

/** Whether a universe is there for this caller: its world and its master always; a private one for its guests only (ADR-0193). */
export function letsIn(who: Caller, game: Game, c: Campaign, masterUid?: string): boolean {
  if (owns(who, game, masterUid)) return true;
  return !c.private || guestOf(who, c);
}

/** What the master reads: the guests, and the invites still good by their names, never a token. */
export function campaignView(c: Campaign, now = Date.now()) {
  return {
    private: c.private,
    guests: Object.entries(c.guests).map(([id, g]) => ({ id, ...g })),
    invites: liveInvites(c, now).map(([hash, i]) => ({ id: inviteName(hash), ...i })),
  };
}

export interface GuestsContext {
  name: string;
  who: Caller;
  game: Game;
  masterUid?: string;
  archive: CampaignArchive;
  /** The invite verifier's identities: with them, who redeems an invite without one gets one. */
  invites?: InviteIdentities;
  /** The wanderers who are in the world of this universe now (`server/session.ts`). */
  inWorld?: (name: string) => string[];
  /** Closes the sockets of a wanderer in this universe's world. */
  expel?: (name: string, id: string, reason: string) => void;
  /** Tells the running world, if there is one, whether its universe is private (the master's purse answers for an anonymous guest, ADR-0188). */
  tellWorld?: (name: string, value: boolean) => Promise<void>;
  now?: number;
}

export interface GuestsAnswer {
  status: number;
  body: Record<string, unknown>;
}

const refused = (status: number, error: string): GuestsAnswer => ({ status, body: { error } });

/** The store's `guests` route: what each may do, and the answer. The caller is already through `gate` and the universe exists. */
export async function guestsAnswer(method: string, body: Record<string, unknown>, o: GuestsContext): Promise<GuestsAnswer> {
  const now = o.now ?? Date.now();
  const { name, who, game } = o;
  const mine = owns(who, game, o.masterUid) && !who.server;
  if (!game.many) return refused(409, 'ospiti e inviti solo negli universi di molti');
  if (method === 'POST' && body.op === 'redeem') {
    const token = typeof body.invite === 'string' ? body.invite : '';
    if (isMasterOf(who, game, o.masterUid)) return refused(400, 'sei il master: entri sempre');
    if (who.id) {
      const r = o.archive.redeem(name, token, who.id, now);
      return 'refused' in r ? refused(404, r.refused) : { status: 200, body: { ok: true, id: who.id, ...(r.already ? { already: true } : {}) } };
    }
    // Without an identity: the invite verifier makes one, only for a good invite, and in the same step that spends it.
    if (!o.invites) return refused(401, 'serve un account');
    if (!INVITE_TOKEN_RE.test(token)) return refused(404, 'invito non valido o scaduto');
    const live = o.archive.read(name).invites[inviteHash(token)];
    if (!live || live.expires <= now || live.left <= 0) return refused(404, 'invito non valido o scaduto');
    const made = o.invites.mint(name);
    const r = o.archive.redeem(name, token, made.id, now);
    if ('refused' in r) {
      o.invites.revoke(made.id);
      return refused(404, r.refused);
    }
    return { status: 200, body: { ok: true, id: made.id, identity: made.token } };
  }
  if (!mine) return refused(403, 'solo il master di questo universo');
  if (method === 'GET') return { status: 200, body: { ok: true, ...campaignView(o.archive.read(name), now) } };
  if (method === 'POST') {
    switch (body.op) {
      case 'private': {
        if (typeof body.value !== 'boolean') return refused(400, 'privato: sì o no');
        const value = body.value;
        // Who is in the world now stays: going private keeps nobody out who was already in (the master sees them among the guests).
        const present = value ? (o.inWorld?.(name) ?? []).filter((id) => !isMasterOf({ local: false, id }, game, o.masterUid)) : [];
        o.archive.change(
          name,
          (c) => {
            c.private = value;
            for (const id of present) if (!c.guests[id] && Object.keys(c.guests).length < CAMPAIGN_LIMITS.guests) c.guests[id] = { since: now, by: who.id ?? '', note: 'era nel mondo' };
          },
          now,
        );
        await o.tellWorld?.(name, value).catch(() => undefined);
        return { status: 200, body: { ok: true, ...campaignView(o.archive.read(name), now) } };
      }
      case 'add': {
        const id = typeof body.id === 'string' ? body.id.trim().toLowerCase() : '';
        if (!validWandererId(id)) return refused(400, 'id del viandante non valido');
        if (id === game.master) return refused(400, 'il master entra sempre');
        const note = body.note === undefined || body.note === '' ? undefined : cleanText(body.note, CAMPAIGN_LIMITS.note, 'la nota');
        if (note && 'error' in note) return refused(400, note.error);
        const r = o.archive.change(
          name,
          (c) => {
            if (c.guests[id]) return true;
            if (Object.keys(c.guests).length >= CAMPAIGN_LIMITS.guests) return false;
            c.guests[id] = { since: now, by: who.id ?? '', ...(note ? { note: note.text } : {}) };
            return true;
          },
          now,
        );
        if (!r) return refused(409, `al più ${CAMPAIGN_LIMITS.guests} ospiti`);
        return { status: 200, body: { ok: true, ...campaignView(o.archive.read(name), now) } };
      }
      case 'invite': {
        const days = body.days === undefined ? CAMPAIGN_LIMITS.days.default : Number(body.days);
        const uses = body.uses === undefined ? CAMPAIGN_LIMITS.uses.default : Number(body.uses);
        if (!Number.isInteger(days) || days < CAMPAIGN_LIMITS.days.min || days > CAMPAIGN_LIMITS.days.max) return refused(400, `giorni: da ${CAMPAIGN_LIMITS.days.min} a ${CAMPAIGN_LIMITS.days.max}`);
        if (!Number.isInteger(uses) || uses < CAMPAIGN_LIMITS.uses.min || uses > CAMPAIGN_LIMITS.uses.max) return refused(400, `usi: da ${CAMPAIGN_LIMITS.uses.min} a ${CAMPAIGN_LIMITS.uses.max}`);
        const note = body.note === undefined || body.note === '' ? undefined : cleanText(body.note, CAMPAIGN_LIMITS.note, 'la nota');
        if (note && 'error' in note) return refused(400, note.error);
        const token = newInviteToken();
        const hash = inviteHash(token);
        const invite: Invite = { made: now, expires: now + days * DAY, uses, left: uses, by: who.id ?? '', ...(note ? { note: note.text } : {}) };
        const made = o.archive.change(
          name,
          (c) => {
            if (liveInvites(c, now).length >= CAMPAIGN_LIMITS.invites) return false;
            c.invites[hash] = invite;
            return true;
          },
          now,
        );
        if (!made) return refused(409, `al più ${CAMPAIGN_LIMITS.invites} inviti aperti: revocane qualcuno`);
        // The only time the token leaves the server: the file has its hash. With it, the universe as the master reads it now.
        return { status: 200, body: { ok: true, ...campaignView(o.archive.read(name), now), token, invite: { id: inviteName(hash), ...invite } } };
      }
    }
    return refused(400, 'operazione sconosciuta');
  }
  if (method === 'DELETE') {
    if (typeof body.guest === 'string') {
      const id = body.guest;
      if (!validWandererId(id)) return refused(400, 'id del viandante non valido');
      if (id === game.master) return refused(400, 'il master non si toglie');
      const was = o.archive.change(
        name,
        (c) => {
          const g = c.guests[id];
          delete c.guests[id];
          return g;
        },
        now,
      );
      if (!was) return refused(404, 'non è un ospite');
      // An identity born of this universe's invite is nobody's now: it was for this universe only.
      if (o.invites?.record(id)?.via === name) o.invites.revoke(id);
      o.expel?.(name, id, 'il master ti ha tolto dagli ospiti di questo mondo');
      return { status: 200, body: { ok: true, ...campaignView(o.archive.read(name), now) } };
    }
    if (typeof body.invite === 'string') {
      const id = body.invite;
      const gone = o.archive.change(
        name,
        (c) => {
          const hash = Object.keys(c.invites).find((h) => inviteName(h) === id);
          if (hash) delete c.invites[hash];
          return !!hash;
        },
        now,
      );
      if (!gone) return refused(404, 'invito sconosciuto');
      return { status: 200, body: { ok: true, ...campaignView(o.archive.read(name), now) } };
    }
    return refused(400, 'togli un ospite (guest) o un invito (invite)');
  }
  return refused(405, 'metodo non ammesso');
}
