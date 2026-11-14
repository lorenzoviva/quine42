// The handmade cards (T293, ADR-0161): the collection of every account, outside every universe, and its routes.
//
//   GET    /api/handmade              → { ok, cards }                          the latest cards of everyone, without their programs
//   GET    /api/handmade?mine=1       → { ok, cards, signature, used, caps }   the asker's own
//   GET    /api/handmade/<id>         → { ok, card }                           one card, with its program
//   POST   /api/handmade              { kind, name, class?, size?, xml, kernel, from? }  → 201 { ok, card }
//   POST   /api/handmade/<id>         { name?, class?, size?, xml?, kernel? }            → { ok, card }   only its author
//   DELETE /api/handmade/<id>                                                            → { ok }         only its author
//   POST   /api/handmade/signature    { signature }                                      → { ok, signature }
//
// The archive is `universes/.handmade/<wanderer>.json`, one file per account, written whole and atomically under a lock, like the
// balances (rule 8d): no universe's repository holds it, so no Lua, no Council, no branch and no rollback reaches it, and a world's
// process reads only its own folder. Whose file is written comes only from the verified identity, never from the request: only the author
// writes their cards. Everything passes `gate`, then the switch (`site/beta.json → laboratori`): off, every route refuses everyone. With
// accounts reading wants one (an anonymous one too); writing wants one that is not anonymous. What another is told is by list (rule 8f,
// `handmadeSummary`, `handmadeView`): never the author's id, never the chain. A program is checked by `ProgramChecker` (programCheck.ts).

import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { threadId } from 'node:worker_threads';
import type { Connect, Plugin } from 'vite';
import {
  cleanCardName,
  cleanText,
  contractSaid,
  forkedOrigins,
  handmadeFingerprint,
  handmadeRecordText,
  handmadeSummary,
  handmadeView,
  HANDMADE_CAPS,
  HANDMADE_CONTRACT,
  HANDMADE_ID_RE,
  HANDMADE_LIMITS,
  heldCards,
  newHandmadeId,
  programShapeErrors,
  readHandmadeRecord,
  SIGNATURE_MAX,
  type HandmadeCaps,
  type HandmadeCard,
  type HandmadeFrom,
  type HandmadeKind,
  type HandmadeProgram,
  type HandmadeRecord,
  type HandmadeView,
} from '../src/kernel/handmade';
import type { CardOrigin } from '../src/kernel/heritage';
import { MODELS_DIR, MODELS_INDEX } from '../src/kernel/forms';
import { internalCardsIn, internalFields } from '../src/kernel/internalNames';
import { portedFiles } from '../src/kernel/migrations';
import { UNIVERSE_NAME_RE } from '../src/kernel/paths';
import { MODEL_RE } from '../src/kernel/validator';
import { SOLO, validWandererId } from '../src/kernel/wanderers';
import type { FileMap } from '../src/kernel/types';
import type { AccountSettings } from './account';
import { callerOf, gate, isJson, newSecret, type Caller, type Refusal } from './access';
import { CampaignArchive } from './campaign';
import { serverName, serverPath } from './folders';
import type { ProgramChecker } from './programCheck';
import { Rates, type Pace } from './rates';

export const HANDMADE_ROUTE = '/api/handmade';
/** The archive's folder under the universes': a dot, so no universe can be called that and no list shows it. */
export const HANDMADE_DIR = serverName('handmade');
/** How often an account may write: each write may run a program for seconds (V-030). Twelve, then one every twenty seconds. */
export const HANDMADE_WRITES: Pace = { burst: 12, perSecond: 1 / 20 };
/** The cards of everyone a list says, the most recently changed first. */
export const LIST_MAX = 500;
/** A body: the longest program, written in JSON, and room for the rest. */
const MAX_BODY = 4 * HANDMADE_LIMITS.xmlChars + 64 * 1024;
const LOCK_WAIT_MS = 5000;
const LOCK_STALE_MS = 15000;

const sleepCell = new Int32Array(new SharedArrayBuffer(4));
const sleep = (ms: number) => void Atomics.wait(sleepCell, 0, 0, ms);
const codeOf = (e: unknown) => (e as NodeJS.ErrnoException).code;
/** On Windows a file being deleted or just renamed answers these for a moment. */
const busy = (e: unknown) => ['EEXIST', 'EPERM', 'EACCES', 'EBUSY'].includes(codeOf(e) ?? '');

/** Why a write would take an account past its caps, or undefined. What this kernel keeps without reading counts too. */
export function overCaps(record: HandmadeRecord, caps: HandmadeCaps): string | undefined {
  if (heldCards(record) > caps.cards) return `al più ${caps.cards} carte per account`;
  const bytes = Buffer.byteLength(handmadeRecordText(record));
  if (bytes > caps.bytes) return `le tue carte supererebbero ${Math.round(caps.bytes / 1024)} KiB (sarebbero ${Math.ceil(bytes / 1024)})`;
  return undefined;
}

/** The archive: one file per account, `<dir>/<wanderer>.json`. */
export class HandmadeArchive {
  private cache = new Map<string, { stamp: string; record: HandmadeRecord }>();

  constructor(readonly dir: string) {}

  static of(universesDir: string): HandmadeArchive {
    return new HandmadeArchive(serverPath(universesDir, 'handmade'));
  }

  fileOf(author: string): string {
    if (!validWandererId(author)) throw new Error('viandante non valido');
    return path.join(this.dir, `${author}.json`);
  }

  /** An account's cards; none if it has no file. A file that cannot be read throws: written over, its cards would be lost. */
  read(author: string): HandmadeRecord {
    const file = this.fileOf(author);
    let stamp: string;
    try {
      const st = statSync(file);
      stamp = `${st.mtimeMs}:${st.size}`;
    } catch (e) {
      if (codeOf(e) !== 'ENOENT') throw e;
      this.cache.delete(file);
      return { cards: [] };
    }
    const hit = this.cache.get(file);
    if (hit && hit.stamp === stamp) return hit.record;
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(file, 'utf8'));
    } catch {
      throw new Error('archivio delle carte fatte a mano illeggibile');
    }
    // A card of this file is of this file's account: one that says another author is kept, not read.
    const record = readHandmadeRecord(parsed, author);
    this.cache.set(file, { stamp, record });
    return record;
  }

  /**
   * Changes an account's file under its lock, reading it again first: `fn` says the record to write (undefined: nothing) and what to
   * answer, or why not. What would be past the caps is not written.
   */
  change<T>(author: string, caps: HandmadeCaps, fn: (record: HandmadeRecord) => { record?: HandmadeRecord; out: T } | Refusal): T | Refusal {
    const file = this.fileOf(author);
    return this.locked(file, () => {
      this.cache.delete(file);
      const r = fn(this.read(author));
      if ('refused' in r) return r;
      if (r.record) {
        const over = overCaps(r.record, caps);
        if (over) return { status: 413, refused: over };
        if (heldCards(r.record) || r.record.signature) this.write(file, handmadeRecordText(r.record));
        else rmSync(file, { force: true });
        this.cache.delete(file);
      }
      return r.out;
    });
  }

  /** Every account with cards, as `read` gives them; one that cannot be read is left out of the list. */
  all(): Array<{ author: string; record: HandmadeRecord }> {
    let names: string[];
    try {
      names = readdirSync(this.dir);
    } catch {
      return [];
    }
    return names.flatMap((name) => {
      const author = name.endsWith('.json') ? name.slice(0, -5) : '';
      if (!validWandererId(author)) return [];
      try {
        return [{ author, record: this.read(author) }];
      } catch {
        return [];
      }
    });
  }

  private locked<T>(file: string, fn: () => T): T {
    mkdirSync(this.dir, { recursive: true });
    const lock = `${file}.lock`;
    const start = Date.now();
    for (;;) {
      try {
        closeSync(openSync(lock, 'wx'));
        break;
      } catch (e) {
        if (!busy(e)) throw e;
        try {
          if (Date.now() - statSync(lock).mtimeMs > LOCK_STALE_MS) rmSync(lock, { force: true });
        } catch {
          /* gone meanwhile: the next try takes it */
        }
        if (Date.now() - start > LOCK_WAIT_MS) throw new Error('archivio delle carte occupato: riprova tra poco');
        sleep(2);
      }
    }
    try {
      return fn();
    } finally {
      rmSync(lock, { force: true });
    }
  }

  private write(file: string, text: string): void {
    const tmp = `${file}.${process.pid}.${threadId}.tmp`;
    const fd = openSync(tmp, 'w');
    try {
      writeSync(fd, text);
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    for (let i = 0; ; i++) {
      try {
        renameSync(tmp, file);
        return;
      } catch (e) {
        if (i >= 50 || !busy(e)) {
          rmSync(tmp, { force: true });
          throw e;
        }
        sleep(5);
      }
    }
  }
}

/**
 * The files of a universe a fork of `model` needs: its settings, its index and the program, as this kernel reads them (a universe of
 * another contract ported in memory). Only if the program is not under its name of now (a sound of before the contract 0.3, renamed by a
 * migration) is the whole folder of the models read.
 */
export async function modelFiles(root: string, model: string): Promise<FileMap> {
  const files: FileMap = {};
  const read = async (rel: string) => {
    try {
      files[rel] = await fs.readFile(path.join(root, rel), 'utf8');
    } catch {
      /* not there */
    }
  };
  await Promise.all(['universe.json', MODELS_INDEX, `${MODELS_DIR}${model}.xml`].map(read));
  const ported = portedFiles(files);
  if (ported[`${MODELS_DIR}${model}.xml`] !== undefined) return ported;
  const names = await fs.readdir(path.join(root, 'models')).catch(() => [] as string[]);
  await Promise.all(names.filter((n) => n.endsWith('.xml')).map((n) => read(`${MODELS_DIR}${n}`)));
  return portedFiles(files);
}

/**
 * Where a card is born, and its chain, as the server reads them: the client names a model of a universe, or one of its own cards; the
 * fingerprint, the holder and the chain are taken from what is on the disk, never from what the client says (ADR-0084).
 */
export async function resolveFrom(raw: unknown, universesDir: string, own: HandmadeRecord, sees: (universe: string) => boolean = () => true): Promise<{ from?: HandmadeFrom; origins?: CardOrigin[] } | Refusal> {
  if (raw === undefined || raw === null) return {};
  const said = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : undefined;
  if (said && typeof said.card === 'string') {
    if (!HANDMADE_ID_RE.test(said.card)) return { status: 400, refused: 'from: id di carta non valido' };
    const source = own.cards.find((c) => c.id === said.card);
    if (!source) return { status: 404, refused: 'from: nessuna tua carta con questo id' };
    return { from: { card: source.id, fingerprint: handmadeFingerprint(source.xml) }, ...(source.origins?.length ? { origins: source.origins } : {}) };
  }
  if (!said || typeof said.universe !== 'string' || typeof said.model !== 'string') return { status: 400, refused: 'from: { universe, model } oppure { card }' };
  const { universe, model } = said;
  if (!UNIVERSE_NAME_RE.test(universe) || !MODEL_RE.test(model)) return { status: 400, refused: 'from: universo o modello non valido' };
  const root = path.join(universesDir, universe);
  // A private universe is not there for who is neither its master nor a guest (ADR-0193): not even whether it has a model.
  if (!existsSync(path.join(root, '.git')) || !sees(universe)) return { status: 404, refused: `from: universo sconosciuto: ${universe}` };
  const files = await modelFiles(root, model);
  const xml = files[`${MODELS_DIR}${model}.xml`];
  if (xml === undefined) return { status: 404, refused: `from: nessun modello «${model}» in «${universe}»` };
  let entry: { card?: { holder?: unknown; origins?: unknown } } | undefined;
  try {
    const index = internalFields('modelIndex', (internalCardsIn(JSON.parse(files[MODELS_INDEX] ?? '{}')) ?? {}) as Record<string, typeof entry>);
    entry = Object.hasOwn(index, model) ? index[model] : undefined;
  } catch {
    /* no index: a model without a card */
  }
  const origins = forkedOrigins(entry?.card, universe, xml);
  return { from: { universe, model, fingerprint: handmadeFingerprint(xml) }, ...(origins.length ? { origins } : {}) };
}

export interface HandmadeRouteOptions {
  accounts?: AccountSettings;
  universesDir: string;
  /** The switch (`site/beta.json → laboratori`), asked at every request. */
  labs: () => boolean;
  checker: ProgramChecker;
  /** For the tests: only by code. */
  caps?: HandmadeCaps;
  writes?: Pace;
  now?: () => Date;
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

const no = (res: ServerResponse, r: Refusal, more: Record<string, unknown> = {}) => send(res, r.status, { ok: false, reason: r.refused, ...more });

/** The checker has too many waiting: nothing was written. */
function checkerBusy(res: ServerResponse): void {
  res.setHeader('Retry-After', '10');
  no(res, { status: 503, refused: 'il controllo dei programmi è occupato: riprova tra poco' });
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) reject(new Error('richiesta troppo grande'));
      else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** What a client says of a program, read: the kind, the text, a model's class and size. */
function programOf(body: Record<string, unknown>, kind: unknown): HandmadeProgram {
  return {
    kind: kind as HandmadeKind,
    xml: body.xml as string,
    ...(body.class !== undefined ? { class: body.class as string } : {}),
    ...(body.size !== undefined && body.size !== null ? { size: body.size as string } : {}),
  };
}

/** The contract a write says it is for: this kernel's, or why not. */
function contractRefusal(said: unknown): Refusal | undefined {
  const c = contractSaid(said);
  if (!c) return { status: 400, refused: `manca la versione del kernel per cui è scritto il programma (kernel: "${HANDMADE_CONTRACT}")` };
  if (c !== HANDMADE_CONTRACT) return { status: 409, refused: `il programma è scritto per il kernel ${c}, questo server è del ${HANDMADE_CONTRACT}: riaprilo nel laboratorio di questo kernel` };
  return undefined;
}

export function handmadeHandler(o: HandmadeRouteOptions): Connect.NextHandleFunction {
  const archive = HandmadeArchive.of(o.universesDir);
  const campaigns = CampaignArchive.of(o.universesDir);
  const caps = o.caps ?? HANDMADE_CAPS;
  const writes = new Rates(o.writes ?? HANDMADE_WRITES);
  const access = { accounts: o.accounts, internal: newSecret() };
  const now = () => (o.now ? o.now() : new Date()).toISOString();

  /** The cards of everyone, the most recently changed first, as another may read them. */
  const everyone = (asker: string) =>
    archive
      .all()
      .flatMap(({ author, record }) => record.cards.map((card) => handmadeSummary(card, record.signature, author === asker)))
      .sort((a, b) => b.changed.localeCompare(a.changed) || a.id.localeCompare(b.id))
      .slice(0, LIST_MAX);

  const find = (id: string): { card: HandmadeCard; record: HandmadeRecord; author: string } | undefined => {
    for (const { author, record } of archive.all()) {
      const card = record.cards.find((c) => c.id === id);
      if (card) return { card, record, author };
    }
    return undefined;
  };

  const create = async (res: ServerResponse, author: string, body: Record<string, unknown>, who: Caller) => {
    const name = cleanCardName(body.name);
    if ('error' in name) return no(res, { status: 400, refused: name.error });
    const program = programOf(body, body.kind);
    const shape = programShapeErrors(program);
    if (shape.length) return no(res, { status: 400, refused: 'il programma non va' }, { errors: shape });
    if (program.xml.length > HANDMADE_LIMITS.xmlChars) return no(res, { status: 413, refused: `programma troppo lungo: al più ${HANDMADE_LIMITS.xmlChars} caratteri` });
    const version = contractRefusal(body.kernel);
    if (version) return no(res, version);
    const before = archive.read(author);
    if (heldCards(before) >= caps.cards) return no(res, { status: 413, refused: `hai già ${heldCards(before)} carte: al più ${caps.cards} per account` });
    const born = await resolveFrom(body.from, o.universesDir, before, (u) => campaigns.lets(u, who, undefined, o.accounts?.masterUid));
    if ('refused' in born) return no(res, born);
    const checked = await o.checker.check(program);
    if ('busy' in checked) return checkerBusy(res);
    if (checked.errors.length) return no(res, { status: 422, refused: 'il programma non può essere una carta' }, { errors: checked.errors });
    const when = now();
    const card: HandmadeCard = {
      id: newHandmadeId(randomBytes(10)),
      kind: program.kind,
      name: name.text,
      ...(program.kind === 'model' ? { class: program.class } : {}),
      ...(program.kind === 'model' && program.size ? { size: program.size as HandmadeCard['size'] } : {}),
      xml: program.xml,
      kernel: HANDMADE_CONTRACT,
      author,
      ...born,
      made: when,
      changed: when,
    };
    const r = archive.change<HandmadeView>(author, caps, (record) => ({ record: { ...record, cards: [...record.cards, card] }, out: handmadeView(card, record.signature, true) }));
    if ('refused' in r) return no(res, r);
    return send(res, 201, { ok: true, card: r });
  };

  const update = async (res: ServerResponse, author: string, id: string, body: Record<string, unknown>) => {
    const card = archive.read(author).cards.find((c) => c.id === id);
    if (!card) return no(res, { status: 404, refused: 'nessuna tua carta con questo id' });
    const next: HandmadeCard = { ...card };
    let changed = false;
    if (body.name !== undefined) {
      const name = cleanCardName(body.name);
      if ('error' in name) return no(res, { status: 400, refused: name.error });
      changed ||= name.text !== card.name;
      next.name = name.text;
    }
    const programChanged = body.xml !== undefined || body.class !== undefined || body.size !== undefined;
    if (programChanged) {
      const program = programOf({ xml: card.xml, class: card.class, size: card.size, ...body }, card.kind);
      if (body.size === null) delete program.size;
      const shape = programShapeErrors(program);
      if (shape.length) return no(res, { status: 400, refused: 'il programma non va' }, { errors: shape });
      if (program.xml.length > HANDMADE_LIMITS.xmlChars) return no(res, { status: 413, refused: `programma troppo lungo: al più ${HANDMADE_LIMITS.xmlChars} caratteri` });
      const version = contractRefusal(body.kernel);
      if (version) return no(res, version);
      const checked = await o.checker.check(program);
      if ('busy' in checked) return checkerBusy(res);
      if (checked.errors.length) return no(res, { status: 422, refused: 'il programma non può essere una carta' }, { errors: checked.errors });
      next.xml = program.xml;
      if (card.kind === 'model') {
        next.class = program.class;
        if (program.size) next.size = program.size as HandmadeCard['size'];
        else delete next.size;
      }
      next.kernel = HANDMADE_CONTRACT;
      changed = true;
    }
    if (!changed) return no(res, { status: 400, refused: 'niente da cambiare' });
    next.changed = now();
    const r = archive.change<HandmadeView>(author, caps, (record) => {
      const at = record.cards.findIndex((c) => c.id === id);
      if (at < 0) return { status: 404, refused: 'nessuna tua carta con questo id' };
      const cards = [...record.cards];
      cards[at] = next;
      return { record: { ...record, cards }, out: handmadeView(next, record.signature, true) };
    });
    if ('refused' in r) return no(res, r);
    return send(res, 200, { ok: true, card: r });
  };

  const remove = (res: ServerResponse, author: string, id: string) => {
    const r = archive.change<true>(author, caps, (record) => {
      if (!record.cards.some((c) => c.id === id)) return { status: 404, refused: 'nessuna tua carta con questo id' };
      return { record: { ...record, cards: record.cards.filter((c) => c.id !== id) }, out: true };
    });
    if (r !== true) return no(res, r);
    return send(res, 200, { ok: true });
  };

  const sign = (res: ServerResponse, author: string, body: Record<string, unknown>) => {
    let signature: string | undefined;
    if (body.signature !== null && body.signature !== '') {
      const clean = cleanText(body.signature, SIGNATURE_MAX, 'la firma');
      if ('error' in clean) return no(res, { status: 400, refused: clean.error });
      signature = clean.text;
    }
    const r = archive.change<string>(author, caps, (record) => {
      const { signature: _old, ...rest } = record;
      return { record: signature ? { ...rest, signature } : rest, out: signature ?? '' };
    });
    if (typeof r !== 'string') return no(res, r);
    return send(res, 200, { ok: true, signature: r });
  };

  const handle = async (req: IncomingMessage, res: ServerResponse, rest: string, query: URLSearchParams) => {
    const refused = gate(req, o.accounts);
    if (refused) return no(res, refused);
    if (!o.labs()) return no(res, { status: 403, refused: 'i laboratori non sono aperti' });
    const segment = rest.replace(/^\//, '');
    if (segment.includes('/')) return no(res, { status: 404, refused: 'non trovato' });
    const method = req.method ?? 'GET';
    if (!['GET', 'POST', 'DELETE'].includes(method)) {
      res.setHeader('Allow', 'GET, POST, DELETE');
      return no(res, { status: 405, refused: 'metodo non ammesso' });
    }
    const who = await callerOf(req, access);
    if ('refused' in who) return no(res, who);
    // Without accounts only this machine is here (`gate`): the id it says, or the one who plays alone.
    const author = o.accounts?.verify ? who.id : (who.id ?? SOLO);
    if (!author) return no(res, { status: 401, refused: 'serve un account' });

    if (method === 'GET') {
      if (!segment) {
        if (query.get('mine') === '1') {
          const record = archive.read(author);
          return send(res, 200, {
            ok: true,
            cards: record.cards.map((c) => handmadeSummary(c, record.signature, true)),
            signature: record.signature ?? '',
            used: { cards: heldCards(record), bytes: heldCards(record) || record.signature ? Buffer.byteLength(handmadeRecordText(record)) : 0 },
            caps,
          });
        }
        return send(res, 200, { ok: true, cards: everyone(author) });
      }
      if (!HANDMADE_ID_RE.test(segment)) return no(res, { status: 404, refused: 'carta sconosciuta' });
      const found = find(segment);
      if (!found) return no(res, { status: 404, refused: 'carta sconosciuta' });
      return send(res, 200, { ok: true, card: handmadeView(found.card, found.record.signature, found.author === author) });
    }

    // --- Writing: an account that can be found again, at its rhythm, in JSON. ---
    if (who.anonimo) return no(res, { status: 403, refused: 'un accesso anonimo non salva carte: lega prima l’account a Google' });
    if (!writes.take(author)) {
      res.setHeader('Retry-After', '20');
      return no(res, { status: 429, refused: 'troppi salvataggi: riprova tra poco' });
    }
    let body: Record<string, unknown> = {};
    if (method === 'POST') {
      if (!isJson(req)) return no(res, { status: 415, refused: 'solo JSON' });
      try {
        const parsed = JSON.parse(await readBody(req));
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return no(res, { status: 400, refused: 'richiesta non valida' });
        body = parsed;
      } catch (e) {
        return no(res, (e as Error).message === 'richiesta troppo grande' ? { status: 413, refused: 'richiesta troppo grande' } : { status: 400, refused: 'richiesta non valida' });
      }
    }
    if (method === 'POST' && !segment) return create(res, author, body, who);
    if (method === 'POST' && segment === 'signature') return sign(res, author, body);
    if (!HANDMADE_ID_RE.test(segment)) return no(res, { status: 404, refused: 'carta sconosciuta' });
    if (method === 'POST') return update(res, author, segment, body);
    return remove(res, author, segment);
  };

  return (req, res, next) => {
    const [pathname, query = ''] = (req.url ?? '').split('?');
    if (pathname !== HANDMADE_ROUTE && !pathname.startsWith(`${HANDMADE_ROUTE}/`)) return next();
    void handle(req, res, pathname.slice(HANDMADE_ROUTE.length), new URLSearchParams(query)).catch((e: Error) => {
      // The archive's and the file system's words stay in this server's log; the client hears that it did not work.
      console.warn(`[carte fatte a mano] ${e?.message ?? e}`);
      if (res.headersSent) return void res.destroy();
      const mine = /^archivio delle carte (fatte a mano illeggibile|occupato)/.test(e?.message ?? '');
      send(res, mine ? 503 : 500, { ok: false, reason: mine ? e.message : 'il server non è riuscito a farlo: riprova tra poco' });
    });
  };
}

/** The routes in `npm run dev` and in the preview: the switch read at every request, the program checked in the server's process (only this machine listens). */
export function handmadeRoute(o: HandmadeRouteOptions): Plugin {
  const handler = handmadeHandler(o);
  return {
    name: 'quine-handmade',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
