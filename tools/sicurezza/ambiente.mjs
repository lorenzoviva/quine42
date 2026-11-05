// What keeps the author's kit harmless (T137): loopback only, a throwaway project in the temp folder (its own `.env` with
// fake values, its own `universes/`), a clean environment for the server, no network out. Nothing here reads the real `.env`
// or the real `universes/`; docs/sicurezza/esiti/ is the only place outside the temp folder that the kit writes.

import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { promises as fs, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
/** What the throwaway project links to (read by the server, never written) and what it copies. */
export const LINKS = ['src', 'server', 'site', 'lab', 'public', 'universe', 'node_modules'];
export const COPIES = ['vite.config.ts', 'package.json', 'tsconfig.json', 'index.html'];
/** The text the fake Stripe answers with: the kit looks for it in what the server says to the client. */
export const STRIPE_DETAIL = 'DETTAGLIO-INTERNO-FINTO';
const LOOPBACK = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

export const isLoopback = (host) => LOOPBACK.has(String(host).toLowerCase());

/** Every request of the kit passes from here: any other host is an error, not an option. */
export function assertLoopback(url) {
  const host = new URL(url).hostname;
  if (!isLoopback(host)) throw new Error(`il kit parla solo con il loopback, non con ${host}`);
}

/** Whether `child` is `parent` or inside it. */
export function inside(parent, child) {
  const rel = path.relative(path.resolve(parent), path.resolve(child));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/** Refuses a work folder that could be the author's: it must be new, in the system's temp folder, outside the repository. */
export function assertThrowaway(dir) {
  if (!inside(os.tmpdir(), dir) || path.resolve(dir) === path.resolve(os.tmpdir())) throw new Error(`cartella di lavoro fuori dalla cartella temporanea: ${dir}`);
  if (inside(REPO, dir) || inside(dir, REPO)) throw new Error(`cartella di lavoro che tocca il repository: ${dir}`);
}

/** Fake values, new at each run: recognisable, so that the kit can look for them in everything that comes out. */
export function fakeSecrets() {
  const tag = randomBytes(9).toString('hex');
  return {
    GEMINI_API_KEY: `FINTA-gemini-${tag}`,
    STRIPE_SECRET_KEY: `FINTA-stripe-${tag}`,
    STRIPE_WEBHOOK_SECRET: `FINTA-webhook-${tag}`,
  };
}

/**
 * The server's environment: only what node and git need, whatever the author's shell holds (Vite's `loadEnv` also
 * reads `process.env`, so a key exported in the shell would win over the fake `.env`). Git reads no configuration of the machine.
 */
export function cleanEnv(work, source = process.env) {
  const keep = ['PATH', 'Path', 'PATHEXT', 'SystemRoot', 'SYSTEMROOT', 'SystemDrive', 'windir', 'ComSpec', 'NUMBER_OF_PROCESSORS', 'PROCESSOR_ARCHITECTURE'];
  const env = {};
  for (const k of keep) if (source[k] !== undefined) env[k] = source[k];
  return {
    ...env,
    HOME: work,
    USERPROFILE: work,
    TEMP: work,
    TMP: work,
    TMPDIR: work,
    // An empty file of its own: git on Windows refuses the null device here.
    GIT_CONFIG_GLOBAL: path.join(work, 'gitconfig-vuoto'),
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_TERMINAL_PROMPT: '0',
    NO_COLOR: '1',
  };
}

const envText = (values) => Object.entries(values).map(([k, v]) => `${k}=${v}\n`).join('');

let emptyConfig;

/** The throwaway project: the server runs with this as its folder and root, so `.env` and `universes/` are these. */
export async function makeProject(secrets) {
  const work = await fs.mkdtemp(path.join(os.tmpdir(), 'quine-prove-'));
  assertThrowaway(work);
  for (const name of LINKS) await fs.symlink(path.join(REPO, name), path.join(work, name), 'junction');
  for (const name of COPIES) await fs.copyFile(path.join(REPO, name), path.join(work, name));
  await fs.mkdir(path.join(work, 'universes'));
  await fs.writeFile(path.join(work, 'gitconfig-vuoto'), '', 'utf8');
  emptyConfig = path.join(work, 'gitconfig-vuoto');
  await fs.writeFile(path.join(work, '.env'), envText(secrets), 'utf8');
  return work;
}

/** A throwaway project with other fake values (the webhook's secret on, for instance). */
export const writeEnv = (work, values) => fs.writeFile(path.join(work, '.env'), envText(values), 'utf8');

/**
 * Removes the throwaway project. The links go first, one by one and each checked to be a link, so that the recursive
 * removal can never walk into the sources; if one cannot go, the folder stays and the kit says so.
 */
export async function removeProject(work) {
  assertThrowaway(work);
  for (const name of LINKS) {
    const link = path.join(work, name);
    const st = await fs.lstat(link).catch(() => undefined);
    if (!st) continue;
    if (!st.isSymbolicLink()) return `${name} non è un collegamento: cartella lasciata in ${work}`;
    await fs.unlink(link).catch(() => fs.rmdir(link));
    if (await fs.lstat(link).catch(() => undefined)) return `collegamento ${name} non tolto: cartella lasciata in ${work}`;
  }
  await fs.rm(work, { recursive: true, force: true, maxRetries: 8, retryDelay: 250 }).catch(() => undefined);
  return (await fs.lstat(work).catch(() => undefined)) ? `cartella non tolta del tutto: ${work}` : undefined;
}

/** Git with no identity or configuration of the machine. */
export function git(cwd, args, env = process.env) {
  return execFileSync('git', ['-c', 'user.name=Prove', '-c', 'user.email=prove@rune.local', '-c', 'core.autocrlf=false', ...args], {
    cwd,
    env: { ...env, GIT_CONFIG_NOSYSTEM: '1', ...(emptyConfig ? { GIT_CONFIG_GLOBAL: emptyConfig } : {}) },
    encoding: 'utf8',
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    // A universe's whole history with its patches (`log -p`) passes the 1 MB of the default: the seed alone is 2 MB since T273.
    maxBuffer: 1 << 28,
  });
}

/** Text with no value of a secret and no folder of this machine: what may be printed and written in an outcome. */
export function scrub(text, secrets, work) {
  let out = String(text);
  for (const [name, value] of Object.entries(secrets)) if (value) out = out.split(value).join(`<${name}>`);
  if (work) {
    for (const form of [work, work.replace(/\\/g, '/')]) out = out.split(form).join('<tmp>');
  }
  for (const form of [REPO, REPO.replace(/\\/g, '/')]) out = out.split(form).join('<repo>');
  return out;
}

/** The kit's version line: which code the outcome speaks of. */
export function versions() {
  const read = (p) => JSON.parse(readFileSync(p, 'utf8')).version;
  let commit = '';
  try {
    commit = git(REPO, ['rev-parse', '--short=7', 'HEAD']).trim();
  } catch {
    /* not a repository: the outcome has no commit */
  }
  return { commit, vite: read(path.join(REPO, 'node_modules', 'vite', 'package.json')), node: process.version, piattaforma: process.platform };
}
