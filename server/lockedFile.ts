// A file of the server beside the universes, written whole and atomically (a temporary file, fsync, rename) under a lock file that holds
// across processes: the guests of a private universe and the identities of the invite verifier (T366, ADR-0194). The same steps as the
// ledger's and the handmade cards' archive (ADR-0104, ADR-0161), for files that are not money: a command of the owner (`npm run inviti`)
// may write the identities while the server runs.

import { closeSync, fsyncSync, mkdirSync, openSync, renameSync, rmSync, statSync, writeSync } from 'node:fs';
import path from 'node:path';
import { threadId } from 'node:worker_threads';

/** How long to wait for the lock, and when a lock is taken for one a dead process left behind. */
const LOCK_WAIT_MS = 5000;
const LOCK_STALE_MS = 15000;

const sleepCell = new Int32Array(new SharedArrayBuffer(4));
const sleep = (ms: number) => void Atomics.wait(sleepCell, 0, 0, ms);
const codeOf = (e: unknown) => (e as NodeJS.ErrnoException).code;
/** On Windows a file being deleted or just renamed answers these for a moment. */
const busy = (e: unknown) => ['EEXIST', 'EPERM', 'EACCES', 'EBUSY'].includes(codeOf(e) ?? '');

/** `fn` with the file's lock held; `busyText` is the error when another holds it for too long. */
export function lockedSync<T>(file: string, busyText: string, fn: () => T): T {
  mkdirSync(path.dirname(file), { recursive: true });
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
      if (Date.now() - start > LOCK_WAIT_MS) throw new Error(busyText);
      sleep(2);
    }
  }
  try {
    return fn();
  } finally {
    rmSync(lock, { force: true });
  }
}

/** Writes the whole file or nothing: a reader sees the old text or the new one, never half. */
export function writeAtomic(file: string, text: string): void {
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
