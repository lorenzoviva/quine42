// The archive of balances and payments (T125, ADR-0104): `universes/.saldi/<nome>.json`, outside every universe's repository, so
// no checkout, rollback, published branch, clone or generated code can reach it. Written whole and atomically (a temporary
// file, fsync, rename) under a lock file that holds across processes and threads: checking an event and crediting it are one step.
// Node only: the kernel knows `Ledger`, the server gives it this one.

import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync, writeSync } from 'node:fs';
import path from 'node:path';
import { threadId } from 'node:worker_threads';
import { DEFAULT_GRANT_CAP, DEFAULT_PLATFORM_FEE, emptyBook, Ledger, PAYMENTS_FILE, type LedgerBook, type PaymentRecord } from '../src/kernel/credits';
import { UNIVERSE_NAME_RE } from '../src/kernel/paths';
import { PLAYERS_DIR, validWandererId } from '../src/kernel/wanderers';
import { runGit } from './git';

/** The archive's folder under the universes': a dot, so no universe can be called that and no list shows it. */
export const LEDGER_DIR = '.saldi';
/** How long to wait for the lock, and when a lock is taken for one a dead process left behind. */
const LOCK_WAIT_MS = 5000;
const LOCK_STALE_MS = 15000;

const sleepCell = new Int32Array(new SharedArrayBuffer(4));
const sleep = (ms: number) => void Atomics.wait(sleepCell, 0, 0, ms);
const codeOf = (e: unknown) => (e as NodeJS.ErrnoException).code;
/** On Windows a file being deleted or just renamed answers these for a moment. */
const busy = (e: unknown) => ['EEXIST', 'EPERM', 'EACCES', 'EBUSY'].includes(codeOf(e) ?? '');

/**
 * Dollars a day the master of a universe may give by hand. With accounts the server is public and a gift spends its owner's key, so
 * nothing unless the owner's `.env` says so; without, it is whoever sits at this machine (ADR-0104).
 */
export function grantCapOf(env: Record<string, string | undefined>, hasAccounts: boolean): number {
  const said = Number(env.QUINE_TETTO_RICARICHE);
  if (env.QUINE_TETTO_RICARICHE?.trim() && Number.isFinite(said) && said >= 0) return said;
  return hasAccounts ? 0 : DEFAULT_GRANT_CAP;
}

/**
 * The platform fee, a fraction of the cost (ADR-0132): `QUINE_COMMISSIONE`, the server's alone. 0 is a fee (the beta's); what is not a
 * fraction from 0 up to, not including, 1 is the default: a typing slip must neither charge a player double nor take a price away.
 */
export function platformFeeOf(env: Record<string, string | undefined>): number {
  const said = Number(env.QUINE_COMMISSIONE);
  return env.QUINE_COMMISSIONE?.trim() && said >= 0 && said < 1 ? said : DEFAULT_PLATFORM_FEE;
}

function readBook(text: string): LedgerBook {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object' || !data.saldi || !data.eventi) throw new Error('archivio dei saldi illeggibile');
  return { saldi: data.saldi, eventi: data.eventi, ricariche: Array.isArray(data.ricariche) ? data.ricariche : [] };
}

export class FileLedger extends Ledger {
  private cache?: LedgerBook;
  private stamp = '';

  /** `folderReady`: a world's process may write only this file and those beside it, not make the folder (T127). */
  constructor(
    readonly file: string,
    private opts: { folderReady?: boolean } = {},
  ) {
    super();
  }

  /** The book on disk. An archive that cannot be read throws: it is money, and it is never taken for an empty one. */
  private load(fresh: boolean): LedgerBook {
    let stamp: string;
    try {
      const st = statSync(this.file);
      stamp = `${st.mtimeMs}:${st.size}`;
    } catch (e) {
      if (codeOf(e) !== 'ENOENT') throw e;
      this.cache = undefined;
      return emptyBook();
    }
    if (!fresh && this.cache && stamp === this.stamp) return this.cache;
    this.cache = readBook(readFileSync(this.file, 'utf8'));
    this.stamp = stamp;
    return this.cache;
  }

  protected read(): LedgerBook {
    try {
      return this.load(false);
    } catch {
      // Reading a balance never stops the world; writing on what cannot be read does not happen (`update`).
      return this.cache ?? emptyBook();
    }
  }

  protected update<T>(fn: (book: LedgerBook) => T): T {
    return this.locked(() => {
      const book = this.load(true);
      const before = JSON.stringify(book);
      try {
        const out = fn(book);
        const text = JSON.stringify(book);
        if (text !== before) this.write(text);
        return out;
      } catch (e) {
        this.cache = undefined;
        throw e;
      }
    });
  }

  /** Writes the book given only if there is no archive yet (the first time a universe is seen). */
  seed(book: () => LedgerBook): void {
    if (existsSync(this.file)) return;
    this.locked(() => {
      if (!existsSync(this.file)) this.write(JSON.stringify(book()));
    });
  }

  private locked<T>(fn: () => T): T {
    if (!this.opts.folderReady) mkdirSync(path.dirname(this.file), { recursive: true });
    const lock = `${this.file}.lock`;
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
        if (Date.now() - start > LOCK_WAIT_MS) throw new Error('archivio dei saldi occupato');
        sleep(2);
      }
    }
    try {
      return fn();
    } finally {
      rmSync(lock, { force: true });
    }
  }

  private write(text: string): void {
    const tmp = `${this.file}.${process.pid}.${threadId}.tmp`;
    const fd = openSync(tmp, 'w');
    try {
      writeSync(fd, text);
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    for (let i = 0; ; i++) {
      try {
        renameSync(tmp, this.file);
        break;
      } catch (e) {
        if (i >= 50 || !busy(e)) {
          rmSync(tmp, { force: true });
          throw e;
        }
        sleep(5);
      }
    }
    this.cache = readBook(text);
    const st = statSync(this.file);
    this.stamp = `${st.mtimeMs}:${st.size}`;
  }
}

const parse = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

/** The player files in a universe's folder, by file name. */
function playerFilesIn(root: string): Array<{ rel: string; id: string; data: Record<string, unknown> | undefined }> {
  const dir = path.join(root, PLAYERS_DIR);
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  return names
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const data = parse(readFileSync(path.join(dir, f), 'utf8'));
      return { rel: `${PLAYERS_DIR}${f}`, id: f.slice(0, -5), data: data && typeof data === 'object' ? (data as Record<string, unknown>) : undefined };
    });
}

/** What a universe of before this archive says of balances and payments, once, the first time it is seen. */
function bookFromFiles(root: string): LedgerBook {
  const book = emptyBook();
  for (const { id, data } of playerFilesIn(root)) {
    const crediti = data?.crediti;
    if (validWandererId(id) && !data?.anonimo && typeof crediti === 'number' && Number.isFinite(crediti) && crediti > 0) book.saldi[id] = crediti;
  }
  try {
    const eventi = (parse(readFileSync(path.join(root, PAYMENTS_FILE), 'utf8')) as { eventi?: Record<string, PaymentRecord> } | undefined)?.eventi;
    for (const [event, p] of Object.entries(eventi ?? {})) if (p && typeof p === 'object') book.eventi[event] = p;
  } catch {
    /* no payments yet */
  }
  return book;
}

const instances = new Map<string, FileLedger>();
const swept = new Map<string, Promise<void>>();

function instanceOf(universesDir: string, name: string): FileLedger {
  if (!UNIVERSE_NAME_RE.test(name)) throw new Error(`nome di universo non valido: ${name}`);
  const file = path.join(universesDir, LEDGER_DIR, `${name}.json`);
  let ledger = instances.get(file);
  if (!ledger) instances.set(file, (ledger = new FileLedger(file)));
  return ledger;
}

/** The ledger of a universe that exists. The first time, what its files say comes in; from then on its files are never read again. */
export function ledgerOf(universesDir: string, name: string): FileLedger {
  const ledger = instanceOf(universesDir, name);
  ledger.seed(() => bookFromFiles(path.join(universesDir, name)));
  return ledger;
}

/** A universe being made (or cloned): an empty ledger now, so what its files say is never believed. An archive already there stays. */
export function sealLedger(universesDir: string, name: string): void {
  instanceOf(universesDir, name).seed(emptyBook);
}

/**
 * Takes balances and payments out of a universe's files, after they entered the archive: the payments' file goes, the `crediti` of
 * the player files too, in one commit of those files alone. Also after a return to an old commit, which brings them back. They would
 * be read by nobody; this way they go to nobody.
 */
export async function sweepBalances(universesDir: string, name: string): Promise<void> {
  ledgerOf(universesDir, name);
  const root = path.join(universesDir, name);
  const changed: string[] = [];
  if (existsSync(path.join(root, PAYMENTS_FILE))) {
    rmSync(path.join(root, PAYMENTS_FILE), { force: true });
    changed.push(PAYMENTS_FILE);
  }
  for (const { rel, data } of playerFilesIn(root)) {
    if (!data || !('crediti' in data)) continue;
    delete data.crediti;
    writeFileSync(path.join(root, rel), JSON.stringify(data, null, 1) + '\n', 'utf8');
    changed.push(rel);
  }
  if (!changed.length || !existsSync(path.join(root, '.git'))) return;
  const git = (args: string[]) => runGit(root, args, { author: ['Kernel', 'kernel@rune.local'], maxBuffer: 4 * 1024 * 1024 });
  try {
    const tracked = (await git(['ls-files', '--', ...changed])).split('\n').filter(Boolean);
    if (!tracked.length) return;
    await git(['add', '--', ...tracked]);
    await git(['commit', '-q', '-m', 'i saldi escono dalla storia dell’universo', '--', ...tracked]);
  } catch {
    /* git busy: the files are clean already, the next commit carries them */
  }
}

/** The ledger of a universe, ready: the files swept the first time this process meets it. */
export async function openLedger(universesDir: string, name: string): Promise<FileLedger> {
  const ledger = ledgerOf(universesDir, name);
  let once = swept.get(ledger.file);
  if (!once) swept.set(ledger.file, (once = sweepBalances(universesDir, name)));
  await once;
  return ledger;
}
