// The only way the server runs git (T121, ADR-0103). A universe's folder is written from outside, so nothing in it decides what
// runs: hooks and the file system monitor are off whatever its configuration says, tree entries that are git's folder in
// disguise are refused on every system, and git never climbs out of the folder to find a repository (the kernel's, above it).
// Whoever stops waits for what git is doing in a folder (`settleGit`, T209): a process that exits under a `git commit` leaves its locks in the universe.

import { execFile, type ChildProcess } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// Not an empty value: git would look for its hooks at the root of the disk (`/pre-commit`).
const NO_HOOKS = '/dev/null';
const HARDENED = ['-c', `core.hooksPath=${NO_HOOKS}`, '-c', 'core.fsmonitor=false', '-c', 'core.protectNTFS=true', '-c', 'core.protectHFS=true', '-c', 'core.autocrlf=false', '-c', 'core.quotepath=false'];

export interface GitOptions {
  /** Name and email of this command only: the machine's global configuration is never touched. */
  author: [string, string];
  env?: NodeJS.ProcessEnv;
  input?: string;
  maxBuffer?: number;
}

/** How long whoever stops waits for the git of a folder (ms). Then what is left is killed: a commit cut short is not lost, the files are there and the next one takes them. */
export const GIT_SETTLE_MS = 5000;
/** How long what was killed has to go, before its locks are taken away (ms). */
const KILL_MS = 1000;
const LOOK_MS = 25;

interface Busy {
  /** The git running in this folder. */
  children: Set<ChildProcess>;
  /** Work made of many commands, its wait in a queue included (`holdGit`). */
  held: number;
}

const folders = new Map<string, Busy>();
const busyOf = (key: string): Busy => {
  let b = folders.get(key);
  if (!b) folders.set(key, (b = { children: new Set(), held: 0 }));
  return b;
};
const release = (key: string, b: Busy) => {
  if (!b.children.size && !b.held && folders.get(key) === b) folders.delete(key);
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function runGit(cwd: string, args: string[], opts: GitOptions): Promise<string> {
  const key = path.resolve(cwd);
  const full = [...HARDENED, '-c', `user.name=${opts.author[0]}`, '-c', `user.email=${opts.author[1]}`, ...args];
  const env = { ...(opts.env ?? process.env), GIT_CEILING_DIRECTORIES: path.dirname(key) };
  return new Promise((resolve, reject) => {
    const busy = busyOf(key);
    const child = execFile('git', full, { cwd, env, maxBuffer: opts.maxBuffer ?? 64 * 1024 * 1024, windowsHide: true }, (err, stdout, stderr) => {
      busy.children.delete(child);
      release(key, busy);
      if (err) reject(new Error(String(stderr || err.message).trim()));
      else resolve(String(stdout));
    });
    busy.children.add(child);
    if (opts.input !== undefined) child.stdin?.end(opts.input, 'utf8');
  });
}

/** Work of many commands in a folder: from now until it ends, whoever settles the folder waits for it too. */
export async function holdGit<T>(cwd: string, work: () => Promise<T>): Promise<T> {
  const key = path.resolve(cwd);
  const busy = busyOf(key);
  busy.held++;
  try {
    return await work();
  } finally {
    busy.held--;
    release(key, busy);
  }
}

// --- The root of a contract (T295, ADR-0169) ---------------------------------------------------------------------------------------
// Every universe born from the seed of a contract starts from the same commit: an empty tree, a fixed author and date, a message that names
// the contract. Written as the bytes of the object, so nothing of this machine (its git, its configuration, its clock) changes it; the
// seed comes in the commit after, with what is the universe's own. Universes with a root in common are kin: one brings the cards of the other.

/** git's empty tree: the root holds no file, so a return to it would be a universe of nothing (the store refuses it). */
export const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
/** Who wrote every root, and when: 2026-11-07, the day the roots began. */
const ROOT_SIGNATURE = 'Kernel <kernel@rune.local> 1794009600 +0000';

/** The text of the root of a contract (`X.Y`): a commit of git, as `git cat-file commit` shows it. */
export function rootCommitText(contract: string): string {
  if (!/^\d{1,4}\.\d{1,5}$/.test(contract)) throw new Error(`contratto non valido: ${contract}`);
  return `tree ${EMPTY_TREE}\nauthor ${ROOT_SIGNATURE}\ncommitter ${ROOT_SIGNATURE}\n\nradice degli universi del contratto ${contract}\n`;
}

/** The id of the root of a contract, as git computes it: the same on every machine. */
export function rootCommitId(contract: string): string {
  const body = Buffer.from(rootCommitText(contract), 'utf8');
  return createHash('sha1').update(Buffer.concat([Buffer.from(`commit ${body.length}\0`, 'utf8'), body])).digest('hex');
}

/** A repository just made (`git init`, no commit) starts from the root of `contract`: its HEAD is the root. Returns the root's id. */
export async function plantRoot(cwd: string, contract: string, author: [string, string]): Promise<string> {
  // The empty tree is written too: what reads the root (a check, a copy) finds every object it names.
  const tree = (await runGit(cwd, ['mktree'], { author, input: '' })).trim();
  if (tree !== EMPTY_TREE) throw new Error(`albero vuoto inatteso: ${tree}`);
  const id = (await runGit(cwd, ['hash-object', '-t', 'commit', '-w', '--stdin'], { author, input: rootCommitText(contract) })).trim();
  if (id !== rootCommitId(contract)) throw new Error(`radice inattesa: ${id}`);
  await runGit(cwd, ['update-ref', 'HEAD', id], { author });
  return id;
}

/** The roots of a repository (the commits without parents its HEAD comes from), sorted; none for a folder without commits or not git's. */
export async function rootsOf(cwd: string, author: [string, string]): Promise<string[]> {
  const out = await runGit(cwd, ['rev-list', '--max-parents=0', 'HEAD'], { author }).catch(() => '');
  return out.split('\n').map((s) => s.trim()).filter((s) => /^[0-9a-f]{40}$/.test(s)).sort();
}

/** The locks of a repository: all that is in `.git`, outside its objects. */
export function gitLocks(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (e.name !== 'objects') walk(path.join(dir, e.name));
      } else if (e.name.endsWith('.lock')) out.push(path.join(dir, e.name));
    }
  };
  try {
    walk(path.join(root, '.git'));
  } catch {
    /* no repository, or it was just moved aside (a reset): no lock here */
  }
  return out;
}

/**
 * Returns when git has finished in this folder or, within about `ms`, with what was still running killed; either way with no lock left. Every git of this
 * server passes from here and no other process runs one in a universe, so with none running a lock belongs to nobody. What was half done stays undone.
 */
export async function settleGit(cwd: string, ms = GIT_SETTLE_MS): Promise<void> {
  const key = path.resolve(cwd);
  const end = Date.now() + ms;
  while (folders.has(key) && Date.now() < end) await sleep(LOOK_MS);
  const busy = folders.get(key);
  if (busy) {
    for (const child of busy.children) child.kill('SIGKILL');
    const gone = Date.now() + KILL_MS;
    while (busy.children.size && Date.now() < gone) await sleep(LOOK_MS);
    if (busy.children.size) return console.warn(`[git] non si ferma in ${path.basename(key)}: i suoi lock restano`);
  }
  for (const lock of gitLocks(key)) fs.rmSync(lock, { force: true });
}

/** The same for every folder where something is running: for who ends the whole process. */
export async function settleAllGit(ms = GIT_SETTLE_MS): Promise<void> {
  await Promise.all([...folders.keys()].map((key) => settleGit(key, ms)));
}
