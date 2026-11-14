// Dev/preview server middleware: every universe is a real git repository on disk, under
// `universes/<name>/` (ignored by the kernel's own repository). The kernel repository — this
// project, with the seed universe in `universe/` — never changes at runtime; a universe starts as a
// copy of the seed and grows session after session: modules, models, rules, people, maps (`maps/`).
// Resetting means moving the universe aside and starting again from the seed.
//
//   GET  /api/universe/<name>                 → { exists, head, log, files }   (text files, no maps)
//   POST /api/universe/<name>/create          { files, message }               → { head }
//   POST /api/universe/<name>/commit          { changes, message, author }     → { head }
//   POST /api/universe/<name>/checkout        { id }                            → { head, files }
//   POST /api/universe/<name>/reset                                             → { trashed }
//   POST /api/universe/<name>/branch          { branch, files, message, author } → { head }   (T42b: the master's branch)
//   GET  /api/universe/<name>/branch/<branch> → { exists, files }                what it changes against the main line
//   POST /api/universe/<name>/merge           { branch, message }               the branch published, then gone
//   POST /api/universe/<name>/clone           { nome, master, titolari }        → { nome, head }  (T42d: another master)
//   GET|PUT /api/universe/<name>/map/<key>    JSON
//   GET  /api/universe/<name>/maps            → [{ file, name, layout }] every place ever planned
//   GET  /api/universe/<name>/carte           → { exists, carte, files }      the cards measured here, what shows them (T104, T120)
//   GET  /api/universe/<name>/kin             → { open, kin, handmade… }      the cards the master may bring before the start (T295, server/bring.ts)
//   POST /api/universe/<name>/bring           { cards }                       → { head, brought, changes }
//   GET|POST|DELETE /api/universe/<name>/guests                               the private universe: guests and invites (T366, server/campaign.ts)
//
// A universe born here starts from the root of its contract (T295, ADR-0170, `plantRoot`): every universe born from the seed of that
// contract has it, so they are kin. A return to the root is refused: it holds no file.
//
// Who may do what (T120, ADR-0102, server/access.ts): a game alone is of whoever is on this machine, a multiplayer game of its master and
// its world. Everyone else reads only `publicFiles` and writes nothing. In a multiplayer game balances are written only by the world.
// A private universe (ADR-0193) is not there for who is neither its master nor a guest: every route answers as for a name that does not exist,
// and the list does not say it.

import type { Connect, Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { cloneChanges, type CloneOptions } from '../src/kernel/clone';
import { allCards } from '../src/kernel/cards';
import { allowedPath, UNIVERSE_NAME_RE } from '../src/kernel/paths';
import { publicFiles } from '../src/session/files';
import { portedFiles } from '../src/kernel/migrations';
import type { AccountSettings } from './account';
import { sealLedger, sweepBalances } from './ledger';
import { callerOf, creditFile, failureText, gameIn, isJson, newSecret, newUniverse, owns, type Access } from './access';
import { EMPTY_TREE, holdGit, plantRoot, runGit } from './git';
import { Rates, type Pace } from './rates';
import { accountWanderer } from '../src/session/account';
import { serverPath } from './folders';
import { bringCards, kinOf } from './bring';
import { HandmadeArchive } from './handmade';
import type { ProgramChecker } from './programCheck';
import { withCardChoice } from '../src/kernel/bring';
import { KERNEL_CONTRACT } from '../src/kernel/version';
import { CampaignArchive, guestsAnswer, type GuestsContext } from './campaign';

const MAX_BODY = 32 * 1024 * 1024;
/** Universes of which an account is the master, unless the `.env` says otherwise (`QUINE_UNIVERSI_PER_ACCOUNT`, V-026). */
export const DEFAULT_UNIVERSES_PER_ACCOUNT = 3;
/** Universes an account may make or clone: what goes to the bin stays on the disk, so a quota alone would not hold (V-026). Twelve, then one every two hours. */
export const UNIVERSES_MADE: Pace = { burst: 12, perSecond: 12 / 86400 };
/** Choices of cards a master may bring: each one checks its programs for seconds (V-033). Six, then one a minute. */
export const BRINGS: Pace = { burst: 6, perSecond: 1 / 60 };

/** `QUINE_UNIVERSI_PER_ACCOUNT`: a number, or the default. */
export function universesPerAccount(text: string | undefined): number {
  const t = text?.trim();
  return t && /^\d+$/.test(t) ? Number(t) : DEFAULT_UNIVERSES_PER_ACCOUNT;
}

/** The universes this wanderer is the master of: what `universe.json` says of each, which only the server writes when one is made (`newUniverse`, `cloneChanges`). */
export async function universesOf(baseDir: string, id: string): Promise<number> {
  const es = await fs.readdir(baseDir, { withFileTypes: true }).catch(() => []);
  let n = 0;
  for (const e of es) {
    if (!e.isDirectory() || e.name.startsWith('.')) continue;
    const game = gameIn(await fs.readFile(path.join(baseDir, e.name, 'universe.json'), 'utf8').catch(() => undefined));
    if (game.many && game.master === id) n++;
  }
  return n;
}
const AUTHORS: Record<string, [string, string]> = {
  agent: ['Concilio', 'concilio@rune.local'],
  player: ['Viandante', 'viandante@rune.local'],
  genesis: ['Genesi', 'genesi@rune.local'],
  kernel: ['Kernel', 'kernel@rune.local'],
  dev: ['Sviluppo', 'dev@rune.local'],
};

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

/** What the `guests` route reads: a few words. */
const GUESTS_BODY = 4 * 1024;

function readBody(req: IncomingMessage, max = MAX_BODY): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > max) reject(new Error('richiesta troppo grande'));
      else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function git(cwd: string, args: string[], author?: [string, string], opts: { env?: NodeJS.ProcessEnv; input?: string } = {}): Promise<string> {
  return runGit(cwd, args, { ...opts, author: author ?? AUTHORS.kernel });
}

// --- Branches (T42b) ----------------------------------------------------------------------------
// The master's changes wait on a branch while the main line goes on (the Council commits there). A branch is written
// without touching the working tree, which is the main line's: a temporary index made from the main line as it is now,
// the branch's files on it, a commit on top of the branch's last one. Its message ends with the main line it was
// written on, so what the branch changes can be read back after a restart. Branches live under `refs/heads/rami/`:
// the main line itself may be called `master`.

const BRANCH_RE = /^[a-z][a-z0-9-]{0,30}$/;
const branchRef = (branch: string) => {
  if (!BRANCH_RE.test(branch)) throw new Error(`ramo non valido: ${branch}`);
  return `refs/heads/rami/${branch}`;
};
const revParse = (root: string, ref: string) => git(root, ['rev-parse', '--verify', '-q', ref]).then((s) => s.trim(), () => '');

/** Writes a branch, whole: the main line as it is now with these files changed (null: deleted); none deletes it. */
export async function writeBranch(root: string, branch: string, files: Record<string, string | null>, message: string, author: string): Promise<string | null> {
  const ref = branchRef(branch);
  for (const rel of Object.keys(files)) safePath(root, rel);
  if (!Object.keys(files).length) {
    await git(root, ['update-ref', '-d', ref]).catch(() => '');
    return null;
  }
  const main = await revParse(root, 'HEAD');
  const tip = await revParse(root, ref);
  const index = path.join(root, '.git', `rune-ramo-${branch}.index`);
  const env = { ...process.env, GIT_INDEX_FILE: index };
  try {
    await git(root, ['read-tree', main], undefined, { env });
    for (const [rel, content] of Object.entries(files)) {
      if (content === null) await git(root, ['update-index', '--force-remove', '--', rel], undefined, { env });
      else {
        const sha = (await git(root, ['hash-object', '-w', '--stdin'], undefined, { input: content })).trim();
        await git(root, ['update-index', '--add', '--cacheinfo', `100644,${sha},${rel}`], undefined, { env });
      }
    }
    const tree = (await git(root, ['write-tree'], undefined, { env })).trim();
    const commit = (await git(root, ['commit-tree', tree, '-p', tip || main, '-m', `${message.slice(0, 500)}\n\nbase: ${main}`], AUTHORS[author] ?? AUTHORS.kernel)).trim();
    await git(root, ['update-ref', ref, commit]);
    return commit.slice(0, 7);
  } finally {
    await fs.rm(index, { force: true });
  }
}

/** What a branch changes against the main line it was last written on, or null if there is no such branch. */
export async function readBranch(root: string, branch: string): Promise<Record<string, string | null> | null> {
  const tip = await revParse(root, branchRef(branch));
  if (!tip) return null;
  const body = await git(root, ['log', '-1', '--format=%B', tip]);
  const base = /base: ([0-9a-f]{40})/.exec(body)?.[1] ?? (await git(root, ['merge-base', 'HEAD', tip])).trim();
  const raw = (await git(root, ['diff', '--name-status', '--no-renames', '-z', base, tip])).split('\0').filter(Boolean);
  const out: Record<string, string | null> = {};
  for (let i = 0; i + 1 < raw.length; i += 2) out[raw[i + 1]] = raw[i] === 'D' ? null : await git(root, ['show', `${tip}:${raw[i + 1]}`]);
  return out;
}

/** A branch published: merged into the main line, which already has its files (the main line's tree stays), then gone. */
export async function mergeBranch(root: string, branch: string, message: string): Promise<void> {
  const ref = branchRef(branch);
  if (!(await revParse(root, ref))) return;
  await git(root, ['merge', '-q', '-s', 'ours', '--no-ff', '-m', message.slice(0, 500), ref], AUTHORS.player);
  await git(root, ['update-ref', '-d', ref]);
}

// --- Clones (T42d) ------------------------------------------------------------------------------
// The master of a multiplayer game never changes: another master means another universe, copied whole — history, maps,
// the state of every wanderer — with its name and master changed (and the old master's cards, if they pass) in one
// more commit. What the old master was trying on their branch is theirs, unpublished: the clone has no branches.

/** Copies the universe at `root` into `<baseDir>/<opts.nome>` with another master; the source is never touched. */
export async function cloneUniverse(baseDir: string, root: string, opts: CloneOptions): Promise<{ nome: string; head: string | null; from: string }> {
  if (!(await exists(path.join(root, '.git')))) throw new Error('universo sconosciuto');
  // No balance leaves with a copy: the source's go to its ledger first, the clone's starts empty (ADR-0104).
  await sweepBalances(baseDir, path.basename(root));
  const files = await readTree(root);
  const { changes, from } = cloneChanges(files, opts);
  const dest = path.join(baseDir, opts.nome);
  if (await exists(dest)) throw new Error(`esiste già: ${opts.nome}`);
  await fs.cp(root, dest, { recursive: true });
  sealLedger(baseDir, opts.nome);
  try {
    const refs = await git(dest, ['for-each-ref', '--format=%(refname)', 'refs/heads/rami/']);
    for (const ref of refs.split('\n').filter(Boolean)) await git(dest, ['update-ref', '-d', ref]);
    for (const f of await fs.readdir(path.join(dest, '.git'))) if (/^rune-ramo-.*\.index$/.test(f)) await fs.rm(path.join(dest, '.git', f), { force: true });
    await writeFiles(dest, changes);
    const head = await commitAll(dest, `clone di «${path.basename(root)}»: il master è ${opts.master} (prima ${from})`, 'kernel');
    return { nome: opts.nome, head, from };
  } catch (e) {
    await fs.rm(dest, { recursive: true, force: true });
    throw e;
  }
}

/** A universe-relative path among those a universe may hold (ADR-0103), as a path on this disk. */
function safePath(root: string, rel: string): string {
  if (!allowedPath(rel)) throw new Error(`percorso non ammesso: ${rel}`);
  const abs = path.resolve(root, rel);
  if (!abs.startsWith(path.resolve(root) + path.sep)) throw new Error(`percorso fuori dall'universo: ${rel}`);
  return abs;
}

async function exists(p: string): Promise<boolean> {
  return fs.stat(p).then(
    () => true,
    () => false,
  );
}

async function readTree(root: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const walk = async (dir: string, rel: string) => {
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      if (e.name === '.git') continue;
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (!rel && (e.name === 'assets' || e.name === 'maps')) continue;
      if (e.isDirectory()) await walk(path.join(dir, e.name), r);
      else out[r] = await fs.readFile(path.join(dir, e.name), 'utf8');
    }
  };
  await walk(root, '');
  return out;
}

async function head(root: string): Promise<string | null> {
  return git(root, ['rev-parse', '--short=7', 'HEAD']).then(
    (s) => s.trim(),
    () => null,
  );
}

async function log(root: string): Promise<Array<{ id: string; author: string; time: number; message: string }>> {
  const raw = await git(root, ['log', '-n', '300', '--format=%h%x09%an%x09%at%x09%T%x09%s']).catch(() => '');
  // The root of a contract (T295) is no state of the universe: nothing to go back to, so not in its history.
  return raw
    .split('\n')
    .filter(Boolean)
    .map((l) => l.split('\t'))
    .filter(([, , , tree]) => tree !== EMPTY_TREE)
    .map(([id, author, time, , ...msg]) => ({ id, author, time: Number(time) * 1000, message: msg.join('\t') }));
}

async function writeFiles(root: string, changes: Record<string, string | null>): Promise<void> {
  // All of them or none: a refused path leaves no half of a commit in the working tree.
  for (const rel of Object.keys(changes)) safePath(root, rel);
  for (const [rel, content] of Object.entries(changes)) {
    const abs = safePath(root, rel);
    if (content === null) await fs.rm(abs, { force: true });
    else {
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.writeFile(abs, content, 'utf8');
    }
  }
}

async function commitAll(root: string, message: string, author: string): Promise<string | null> {
  await git(root, ['add', '-A']);
  const status = await git(root, ['status', '--porcelain']);
  if (status.trim()) await git(root, ['commit', '-q', '-m', message.slice(0, 500)], AUTHORS[author] ?? AUTHORS.kernel);
  return head(root);
}

/** The route, as a middleware: the dev server, the preview and the production server (T133) mount this same one. */
/** The settings a universe.json says, to compare them; what cannot be read says something else than anything readable. */
const aiOf = (text: string): string => {
  try {
    return JSON.stringify(JSON.parse(text).ai ?? {});
  } catch {
    return text;
  }
};

export interface UniverseStoreOptions {
  accounts?: AccountSettings;
  internal?: string;
  quota?: number;
  /** What checks the programs of the cards a master brings (T295): in production the world's program, a process each. None: no card comes. */
  checker?: ProgramChecker;
  /** The labs (`site/beta.json → laboratori`): closed, no handmade card comes into a universe (ADR-0161). */
  labs?: () => boolean;
  /** The private universes' guests and invites (ADR-0193): those beside `baseDir` unless said. */
  campaigns?: CampaignArchive;
  /** What the `guests` route does to the worlds: who is in one, closing a guest's sockets, telling a world it is private (server/session.ts). */
  worlds?: Pick<GuestsContext, 'inWorld' | 'expel' | 'tellWorld'>;
}

export function universeHandler(baseDir: string, opts: UniverseStoreOptions = {}): Connect.NextHandleFunction {
  const queues = new Map<string, Promise<unknown>>();
  /** One operation at a time per universe (git is not happy with concurrent writers). */
  const serial = <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const prev = queues.get(name) ?? Promise.resolve();
    // Held from now, the wait in the queue too: a world that stops waits for the last save it sent.
    const next = holdGit(path.join(baseDir, name), () => prev.then(fn, fn));
    queues.set(name, next.catch(() => undefined));
    return next;
  };

  const access: Access = { accounts: opts.accounts, internal: opts.internal ?? newSecret() };
  const masterUid = opts.accounts?.masterUid;
  const quota = opts.quota ?? DEFAULT_UNIVERSES_PER_ACCOUNT;
  const makings = new Rates(UNIVERSES_MADE);
  const brings = new Rates(BRINGS);
  const labs = opts.labs ?? (() => false);
  const archive = HandmadeArchive.of(baseDir);
  const campaigns = opts.campaigns ?? CampaignArchive.of(baseDir);
  /** With accounts, whether this wanderer has no room for one more; the author (`QUINE_MASTER`) is not counted. */
  const noRoom = async (id: string | undefined) => !!opts.accounts?.verify && !!id && !(masterUid && id === accountWanderer(masterUid)) && (await universesOf(baseDir, id)) >= quota;
  const full = () => `al più ${quota} universi per account`;

  const handle = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = (req.url ?? '').split('?')[0];
    const who = await callerOf(req, access);
    if ('refused' in who) return send(res, who.status, { error: who.refused });
    const m = /^\/api\/universe\/([^/]+)(?:\/(create|commit|checkout|reset|map|maps|branch|merge|clone|carte|kin|bring|guests)(?:\/([^/]+))?)?$/.exec(url);
    if (url === '/api/universe' || url === '/api/universe/') {
      const es = await fs.readdir(baseDir, { withFileTypes: true }).catch(() => []);
      // A private universe only for its master and its guests, and to them said so (`invite`): to anyone else it does not exist (ADR-0193).
      const names = es.filter((e) => e.isDirectory() && !e.name.startsWith('.')).map((e) => e.name);
      const seen = names.filter((n) => !UNIVERSE_NAME_RE.test(n) || campaigns.lets(n, who, undefined, masterUid));
      const invite = seen.filter((n) => UNIVERSE_NAME_RE.test(n) && campaigns.isPrivate(n));
      return send(res, 200, { available: true, universes: seen, ...(invite.length ? { invite } : {}) });
    }
    if (!m || !UNIVERSE_NAME_RE.test(m[1])) return send(res, 404, { error: 'universo sconosciuto' });
    const name = m[1];
    const op = m[2];
    const arg = m[3] ? decodeURIComponent(m[3]) : undefined;
    const root = path.join(baseDir, name);
    const game = gameIn(await fs.readFile(path.join(root, 'universe.json'), 'utf8').catch(() => undefined));
    const mine = owns(who, game, masterUid);
    const notYours = () => send(res, 403, { error: game.many ? 'solo il master di questo universo' : 'solo da questa macchina' });
    // The world's token is for its own universe: making others is not a world's to do (ADR-0110), nor bringing them cards from others; nor
    // knowing its guests (rule 8g).
    if (who.server && (op === 'clone' || op === 'kin' || op === 'bring' || op === 'guests')) return notYours();
    const unknown = () => send(res, 404, { error: 'universo sconosciuto' });
    // A private universe for who is neither its master nor a guest: as a name that does not exist, whatever is asked (no enumeration, ADR-0193).
    // Only an invite to it gets past (`redeem`, in the route below); making one with its name stays refused, as for every name that is taken.
    const hidden = op !== 'create' && !mine && !campaigns.lets(name, who, game, masterUid);
    /** Whether the caller may see another universe of the folder (the cards a master brings from it, ADR-0170). */
    const sees = (other: string) => campaigns.lets(other, who, undefined, masterUid);
    if (op === 'guests' && !arg) {
      if (!(await exists(path.join(root, '.git')))) return unknown();
      if (req.method !== 'GET' && !isJson(req)) return send(res, 415, { error: 'solo JSON' });
      let body: Record<string, unknown> = {};
      if (req.method !== 'GET') {
        try {
          const raw = await readBody(req, GUESTS_BODY);
          body = raw ? (JSON.parse(raw) ?? {}) : {};
        } catch {
          return send(res, 400, { error: 'richiesta non valida' });
        }
        if (typeof body !== 'object' || Array.isArray(body)) return send(res, 400, { error: 'richiesta non valida' });
      }
      const r = await guestsAnswer(req.method ?? 'GET', body, { name, who, game, masterUid, archive: campaigns, invites: opts.accounts?.invites, ...opts.worlds });
      return r.status !== 200 && hidden ? unknown() : send(res, r.status, r.body);
    }
    // Hidden, it answers what a name with no universe answers this caller: the reads say it does not exist, the rest is not theirs (a game alone).
    if (hidden) return (op === undefined || op === 'carte') && !arg && req.method === 'GET' ? send(res, 200, { exists: false }) : send(res, 403, { error: 'solo da questa macchina' });

    // --- What anyone may read: cut down to what is public, unless the universe is theirs. ---
    if (!op && req.method === 'GET') {
      const r = await serial(name, async () => {
        if (!(await exists(path.join(root, '.git')))) return { exists: false };
        const files = await readTree(root);
        // What is not the master's is read as this kernel reads it: a universe not opened since its contract changed, ported in memory (T308a).
        return mine ? { exists: true, head: await head(root), log: await log(root), files } : { exists: true, head: await head(root), files: publicFiles(portedFiles(files)) };
      });
      return send(res, 200, r);
    }
    if (op === 'carte' && !arg && req.method === 'GET') {
      // The gallery of the cards: measured here on the whole universe, since what measures a card (its code) does not leave it.
      const r = await serial(name, async () => {
        if (!(await exists(path.join(root, '.git')))) return { exists: false };
        const files = portedFiles(await readTree(root));
        return { exists: true, carte: allCards(files, true), files: publicFiles(files) };
      });
      return send(res, 200, r);
    }

    // --- The rest is of who owns the universe. ---
    if (op !== 'create' && !mine) return notYours();
    if (op === 'maps' && req.method === 'GET') {
      // The atlas of what has been explored: names and environments of every planned place.
      const dir = path.join(root, 'maps');
      const files = await fs.readdir(dir).catch(() => [] as string[]);
      const out: Array<{ file: string; name: string; layout: string }> = [];
      for (const f of files) {
        if (!f.endsWith('.json')) continue;
        try {
          const rec = JSON.parse(await fs.readFile(path.join(dir, f), 'utf8'));
          out.push({ file: f.slice(0, -5), name: String(rec?.plan?.place?.name ?? ''), layout: String(rec?.plan?.layout ?? '') });
        } catch {
          /* a broken map is skipped */
        }
      }
      return send(res, 200, out);
    }
    if (op === 'map' && arg) {
      if (!/^[\w:.,-]+$/.test(arg)) return send(res, 400, { error: 'nome non valido' });
      const rel = `maps/${arg.replace(/[:,]/g, '_')}.json`;
      if (!allowedPath(rel)) return send(res, 400, { error: 'nome non valido' });
      const file = safePath(root, rel);
      if (req.method === 'GET') {
        return fs.readFile(file, 'utf8').then(
          (t) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(t);
          },
          () => send(res, 404, { error: 'non trovato' }),
        );
      }
      if (req.method === 'PUT') {
        if (!isJson(req)) return send(res, 415, { error: 'solo JSON' });
        const body = await readBody(req);
        await serial(name, async () => {
          await fs.mkdir(path.dirname(file), { recursive: true });
          await fs.writeFile(file, body, 'utf8');
        });
        return send(res, 200, { ok: true });
      }
    }
    if (op === 'branch' && arg && req.method === 'GET') {
      const files = await serial(name, () => readBranch(root, arg));
      return send(res, 200, files ? { exists: true, files } : { exists: false });
    }
    // The cards the master may bring before the start (T295): what the other universes and the archive have, and whether the choice is open.
    if (op === 'kin' && !arg && req.method === 'GET') return send(res, 200, await kinOf(name, { baseDir, labs, archive, asker: who.id, sees }));
    if (req.method !== 'POST') return send(res, 405, { error: 'metodo non ammesso' });
    if (!isJson(req)) return send(res, 415, { error: 'solo JSON' });
    // Before reading up to MAX_BODY of who could not make anything anyway (V-028): `newUniverse` says the rest from the files.
    if (op === 'create' && (who.anonimo || (!who.local && !who.id))) return send(res, 403, { error: 'per fare un universo serve un account' });
    if (op === 'create' && (await noRoom(who.id))) return send(res, 403, { error: full() });
    if ((op === 'create' || op === 'clone') && opts.accounts?.verify && who.id && !makings.take(who.id)) return send(res, 429, { error: 'troppi universi fatti di recente: riprova più tardi' });
    if (op === 'bring' && !opts.checker) return send(res, 503, { error: 'questo server non controlla i programmi: le carte non entrano' });
    // Each choice checks its programs for seconds: with accounts, at a pace per master (V-033); without, only this machine is here.
    if (op === 'bring' && opts.accounts?.verify && !brings.take(who.id ?? '')) return send(res, 429, { error: 'troppe scelte di carte di recente: riprova tra poco' });
    const raw = await readBody(req);
    const body = raw ? JSON.parse(raw) : {};
    if (op === 'bring') {
      // Read, checked and written in the universe's own line: one commit of the kernel, or nothing (server/bring.ts). Whose the cards become: the master's.
      const r = await serial(name, async () => {
        const out = await bringCards(name, body.cards, { baseDir, master: game.master, checker: opts.checker!, labs, archive, asker: who.id, sees });
        if (!('ok' in out)) return out;
        await writeFiles(root, out.changes);
        return { ...out, head: await commitAll(root, out.message, 'kernel') };
      });
      if (!('ok' in r)) return send(res, r.status, { error: r.refused, ...(r.cards ? { cards: r.cards } : {}) });
      return send(res, 200, { ok: true, head: r.head, brought: r.brought, changes: r.changes });
    }
    // In a multiplayer game the balances are the world's: not even its master writes them from outside (ADR-0081, ADR-0102).
    const touched = op === 'commit' ? body.changes : op === 'branch' ? body.files : undefined;
    if (Object.keys((op === 'create' ? body.files : touched) ?? {}).some((p) => !allowedPath(p))) return send(res, 400, { error: 'percorso non ammesso' });
    if (!who.server && game.many && Object.keys(touched ?? {}).some(creditFile)) return send(res, 403, { error: 'i crediti non si scrivono da qui' });
    // In a multiplayer game `ai` moves only with the master entering from the lobby, through the world (T247, ADR-0133): from outside it would wait on the disk.
    if (!who.server && game.many && typeof (touched ?? {})['universe.json'] === 'string' && aiOf(touched['universe.json']) !== aiOf(await fs.readFile(path.join(root, 'universe.json'), 'utf8').catch(() => '{}'))) return send(res, 403, { error: 'le regolazioni si cambiano nella lobby, entrando' });
    const made = op === 'create' ? newUniverse(who, body.files ?? {}) : undefined;
    if (made && 'refused' in made) return send(res, made.status, { error: made.refused });
    const work = () => serial(name, async () => {
      switch (op) {
        case 'create': {
          if (await exists(path.join(root, '.git'))) throw new Error('esiste già');
          sealLedger(baseDir, name);
          // Born public, with nobody (ADR-0188): the guests of a universe that had this name before are not this one's.
          campaigns.forget(name);
          await fs.mkdir(root, { recursive: true });
          await git(root, ['init', '-q']);
          // From the root of this kernel's contract, the same for every universe born here (T295, ADR-0170); the files come in the commit after.
          await plantRoot(root, KERNEL_CONTRACT, AUTHORS.kernel);
          const born = made && 'files' in made ? made.files : {};
          // A universe just born may bring cards, until its Genesis or its first entry: the kernel closes the choice.
          const config = born['universe.json'];
          await writeFiles(root, typeof config === 'string' ? { ...born, 'universe.json': withCardChoice(config, 'seed') } : born);
          await fs.writeFile(path.join(root, '.gitattributes'), '* text=auto eol=lf\n', 'utf8');
          return { head: await commitAll(root, body.message ?? 'nasce dal seme del kernel', 'genesis') };
        }
        case 'commit':
          if (!(await exists(path.join(root, '.git')))) throw new Error('universo sconosciuto');
          await writeFiles(root, body.changes ?? {});
          return { head: await commitAll(root, String(body.message ?? 'commit'), String(body.author ?? 'kernel')) };
        case 'checkout': {
          if (!/^[0-9a-f]{4,40}$/.test(String(body.id))) throw new Error('commit non valido');
          // The root of a contract holds no file (T295): going back there would be a universe of nothing.
          const tree = await git(root, ['rev-parse', '--verify', '-q', `${body.id}^{tree}`]).then((s) => s.trim(), () => '');
          if (!tree || tree === EMPTY_TREE) throw new Error('commit non valido');
          await git(root, ['restore', `--source=${body.id}`, '--staged', '--worktree', '--', '.']);
          await commitAll(root, `ritorno a ${body.id}`, 'kernel');
          // An old commit may bring balances back: they count for nothing, and they do not stay (ADR-0104).
          await sweepBalances(baseDir, name);
          return { head: await head(root), files: await readTree(root) };
        }
        case 'branch':
          return { head: await writeBranch(root, String(body.branch), body.files ?? {}, String(body.message ?? 'ramo'), String(body.author ?? 'player')) };
        case 'merge':
          await mergeBranch(root, String(body.branch), String(body.message ?? 'pubblicazione'));
          return { head: await head(root) };
        case 'clone': {
          // Only a multiplayer game's own master gives it to another: `mine`, from who they proved to be. Nobody names themselves master.
          const { nome, head: h } = await cloneUniverse(baseDir, root, { nome: String(body.nome ?? ''), master: String(body.master ?? ''), titolari: body.titolari === 'master' ? 'master' : 'restano' });
          return { nome, head: h };
        }
        case 'reset': {
          if (!(await exists(root))) return { trashed: null };
          // Never deleted: moved aside, so a universe can always be recovered by hand.
          const trash = path.join(serverPath(baseDir, 'trash'), `${name}-${Date.now()}`);
          await fs.mkdir(path.dirname(trash), { recursive: true });
          await fs.rename(root, trash);
          return { trashed: path.relative(baseDir, trash) };
        }
      }
      throw new Error('operazione sconosciuta');
    });
    // Counted and made one at a time for each master: two requests together do not both find room for one. A clone counts for who it is given to.
    const owner = op === 'create' ? who.id : op === 'clone' ? String(body.master ?? '') : undefined;
    const r = owner ? await serial(`quota:${owner}`, async () => ((await noRoom(owner)) ? undefined : work())) : await work();
    if (!r) return send(res, 403, { error: full() });
    return send(res, 200, r);
  };

  return (req, res, next) => {
    if (!req.url?.startsWith('/api/universe')) return next();
    handle(req, res).catch((e: Error) => send(res, 500, { error: failureText('universi', e) }));
  };
}

export function universeStore(baseDir: string, opts: UniverseStoreOptions = {}): Plugin {
  const handler = universeHandler(baseDir, opts);
  return {
    name: 'rune-universe-store',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
