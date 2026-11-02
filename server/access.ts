// Who is asking (T120, ADR-0102): the one place where a request to the server of the universes becomes a caller. An account
// proved by its token; on a server without accounts, whoever is on this machine, with the id they say (nobody else gets in);
// the server's own world, which proves itself with a secret of this process. What each may do is decided here too.

import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { accountWanderer } from '../src/session/account';
import { INTERNAL_HEADER, WANDERER_HEADER } from '../src/kernel/universes';
import { SOLO, validWandererId } from '../src/kernel/wanderers';
import type { AccountSettings } from './account';
import { accessRefusal, originRefusal } from './geminiProxy';

type Req = Pick<IncomingMessage, 'headers'> & { socket: { remoteAddress?: string } };

export interface Caller {
  /** The world of this process, through the store. */
  server?: true;
  /** On this machine and from a page of this server. */
  local: boolean;
  /** The wanderer: the account's, or on a server without accounts the one they say. None: nobody in particular. */
  id?: string;
  uid?: string;
  anonimo?: boolean;
}

export interface Refusal {
  status: number;
  refused: string;
}

export interface Access {
  accounts?: AccountSettings;
  /** What the server's own world says to prove itself; never leaves the process. */
  internal: string;
}

export const newSecret = () => randomBytes(32).toString('hex');

/**
 * Why a request does not get as far as being heard, or undefined. Another site's page never (`Origin`). Without a verifier the id
 * a client says is all there is, so only from this machine (`accessRefusal`: socket, `Host`, no forwarding headers).
 */
export function gate(req: Req, accounts: AccountSettings | undefined): Refusal | undefined {
  const origin = originRefusal(req);
  if (origin) return { status: 403, refused: origin };
  if (accounts?.verify) return undefined;
  const local = accessRefusal(req);
  return local ? { status: 403, refused: local } : undefined;
}

/** A form of another site cannot send this type without asking first. */
export const isJson = (req: Pick<IncomingMessage, 'headers'>) => /^application\/json\b/i.test(req.headers['content-type'] ?? '');

function isInternal(req: Req, secret: string): boolean {
  const said = req.headers[INTERNAL_HEADER];
  if (typeof said !== 'string') return false;
  const a = Buffer.from(said);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function bearer(req: Pick<IncomingMessage, 'headers'>): string | undefined {
  const h = req.headers.authorization;
  const m = typeof h === 'string' ? /^Bearer\s+(.+)$/i.exec(h.trim()) : null;
  return m?.[1];
}

/** The caller of a request, or why it is refused. A token that is there and false is refused, not taken for nobody. */
export async function callerOf(req: Req, access: Access): Promise<Caller | Refusal> {
  const refused = gate(req, access.accounts);
  if (refused) return refused;
  if (isInternal(req, access.internal)) return { server: true, local: true };
  const local = !accessRefusal(req);
  const verify = access.accounts?.verify;
  if (verify) {
    const token = bearer(req);
    if (!token) return { local };
    const a = await verify(token).catch(() => undefined);
    if (!a?.uid) return { status: 401, refused: 'accesso scaduto o non valido' };
    return { local, id: accountWanderer(a.uid), uid: a.uid, anonimo: !!a.anonimo };
  }
  const said = req.headers[WANDERER_HEADER];
  const id = typeof said === 'string' ? said.toLowerCase() : undefined;
  return { local, ...(validWandererId(id) ? { id } : {}) };
}

/** What a universe's `universe.json` says of the game. */
export interface Game {
  many: boolean;
  master: string;
}

export function gameIn(universeJson: string | undefined): Game {
  try {
    const partita = JSON.parse(universeJson ?? '{}')?.partita;
    // As repairPartita reads it: a master that is not a wanderer's id is the one who plays alone.
    return { many: partita?.modalita === 'multigiocatore', master: validWandererId(partita?.master) ? partita.master : SOLO };
  } catch {
    return { many: false, master: SOLO };
  }
}

/** The master of this game: never an anonymous account; `QUINE_MASTER` is the master `io` of the universes made before accounts. */
export function isMasterOf(who: Caller, game: Game, masterUid?: string): boolean {
  if (!who.id || who.anonimo) return false;
  return who.id === game.master || (!!masterUid && who.uid === masterUid && game.master === SOLO);
}

/** Who sees a universe whole and may write it: its world and its master; a game alone belongs to whoever is on this machine. */
export function owns(who: Caller, game: Game, masterUid?: string): boolean {
  if (who.server) return true;
  return game.many ? isMasterOf(who, game, masterUid) : who.local;
}

/** A wanderer's state (and where balances and payments were, before their ledger, ADR-0104): over HTTP only the world writes it in a game of many, and it never travels with a universe that is made. */
export const creditFile = (p: string) => /^world\/(giocatori\/|pagamenti\.json$)/i.test(p.replace(/\\/g, '/'));

/**
 * The files of a universe being made, or why not. A game alone only from this machine, as ever. A game of many has a master,
 * who is whoever makes it (not what the files say), and nobody's balances.
 */
export function newUniverse(who: Caller, files: Record<string, string | null>): { files: Record<string, string | null> } | Refusal {
  const game = gameIn(files['universe.json'] ?? undefined);
  if (!game.many && who.local) return { files };
  if (!who.id || who.anonimo) return { status: 403, refused: 'per fare un universo serve un account' };
  let cfg: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(files['universe.json'] ?? '{}');
    if (parsed && typeof parsed === 'object') cfg = parsed;
  } catch {
    /* not a config: the kernel repairs what it reads */
  }
  const kept = Object.fromEntries(Object.entries(files).filter(([p]) => !creditFile(p)));
  const partita = { ...(cfg.partita as object | undefined), modalita: 'multigiocatore', master: who.id };
  return { files: { ...kept, 'universe.json': JSON.stringify({ ...cfg, partita }, null, 2) + '\n' } };
}

export function refuse(res: ServerResponse, r: Refusal, body: (message: string) => unknown): void {
  res.statusCode = r.status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body(r.refused)));
}
