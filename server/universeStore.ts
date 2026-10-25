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
//   GET|PUT /api/universe/<name>/map/<key>    JSON
//   GET  /api/universe/<name>/maps            → [{ file, name, layout }] every place ever planned

import type { Connect, Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const MAX_BODY = 32 * 1024 * 1024;
const NAME_RE = /^[a-z0-9][a-z0-9-]{0,40}$/;
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

function git(cwd: string, args: string[], author?: [string, string], opts: { env?: NodeJS.ProcessEnv; input?: string } = {}): Promise<string> {
  // Identity only for this repository and this command: the machine's global config is never touched.
  const id = author ?? AUTHORS.kernel;
  const full = ['-c', `user.name=${id[0]}`, '-c', `user.email=${id[1]}`, '-c', 'core.autocrlf=false', '-c', 'core.quotepath=false', ...args];
  return new Promise((resolve, reject) => {
    const child = execFile('git', full, { cwd, env: opts.env, maxBuffer: 64 * 1024 * 1024, windowsHide: true }, (err, stdout, stderr) => (err ? reject(new Error(String(stderr || err.message).trim())) : resolve(String(stdout))));
    if (opts.input !== undefined) child.stdin?.end(opts.input, 'utf8');
  });
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

/** A universe-relative path that stays inside the universe and out of git's own folder. */
function safePath(root: string, rel: string): string {
  const p = rel.replace(/\\/g, '/');
  if (!p || p.startsWith('/') || p.split('/').some((s) => s === '..' || s === '' || s === '.git')) throw new Error(`percorso non valido: ${rel}`);
  const abs = path.resolve(root, p);
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
  const raw = await git(root, ['log', '-n', '300', '--format=%h%x09%an%x09%at%x09%s']).catch(() => '');
  return raw
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      const [id, author, time, ...msg] = l.split('\t');
      return { id, author, time: Number(time) * 1000, message: msg.join('\t') };
    });
}

async function writeFiles(root: string, changes: Record<string, string | null>): Promise<void> {
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

export function universeStore(baseDir: string): Plugin {
  const queues = new Map<string, Promise<unknown>>();
  /** One operation at a time per universe (git is not happy with concurrent writers). */
  const serial = <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const prev = queues.get(name) ?? Promise.resolve();
    const next = prev.then(fn, fn);
    queues.set(name, next.catch(() => undefined));
    return next;
  };

  const handler: Connect.NextHandleFunction = (req, res, next) => {
    if (!req.url?.startsWith('/api/universe')) return next();
    const url = req.url.split('?')[0];
    const m = /^\/api\/universe\/([^/]+)(?:\/(create|commit|checkout|reset|map|maps|branch|merge)(?:\/([^/]+))?)?$/.exec(url);
    if (url === '/api/universe' || url === '/api/universe/') {
      void fs
        .readdir(baseDir, { withFileTypes: true })
        .then((es) => send(res, 200, { available: true, universes: es.filter((e) => e.isDirectory() && !e.name.startsWith('.')).map((e) => e.name) }))
        .catch(() => send(res, 200, { available: true, universes: [] }));
      return;
    }
    if (!m || !NAME_RE.test(m[1])) return send(res, 404, { error: 'universo sconosciuto' });
    const name = m[1];
    const op = m[2];
    const arg = m[3] ? decodeURIComponent(m[3]) : undefined;
    const root = path.join(baseDir, name);
    const fail = (e: Error) => send(res, 500, { error: e.message });

    if (!op && req.method === 'GET') {
      void serial(name, async () => {
        if (!(await exists(path.join(root, '.git')))) return { exists: false };
        return { exists: true, head: await head(root), log: await log(root), files: await readTree(root) };
      }).then((r) => send(res, 200, r), fail);
      return;
    }
    if (op === 'maps' && req.method === 'GET') {
      // The atlas of what has been explored: names and environments of every planned place.
      void (async () => {
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
        send(res, 200, out);
      })();
      return;
    }
    if (op === 'map' && arg) {
      if (!/^[\w:.,-]+$/.test(arg)) return send(res, 400, { error: 'nome non valido' });
      const file = path.join(root, 'maps', `${arg.replace(/[:,]/g, '_')}.json`);
      if (req.method === 'GET') {
        void fs.readFile(file, 'utf8').then(
          (t) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(t);
          },
          () => send(res, 404, { error: 'non trovato' }),
        );
        return;
      }
      if (req.method === 'PUT') {
        void readBody(req)
          .then((body) => serial(name, async () => {
            await fs.mkdir(path.dirname(file), { recursive: true });
            await fs.writeFile(file, body, 'utf8');
          }))
          .then(() => send(res, 200, { ok: true }), fail);
        return;
      }
    }
    if (op === 'branch' && arg && req.method === 'GET') {
      void serial(name, () => readBranch(root, arg)).then((files) => send(res, 200, files ? { exists: true, files } : { exists: false }), fail);
      return;
    }
    if (req.method !== 'POST') return send(res, 405, { error: 'metodo non ammesso' });
    void readBody(req)
      .then((raw) => (raw ? JSON.parse(raw) : {}))
      .then((body) =>
        serial(name, async () => {
          switch (op) {
            case 'create': {
              if (await exists(path.join(root, '.git'))) throw new Error('esiste già');
              await fs.mkdir(root, { recursive: true });
              await git(root, ['init', '-q']);
              await writeFiles(root, body.files ?? {});
              await fs.writeFile(path.join(root, '.gitattributes'), '* text=auto eol=lf\n', 'utf8');
              return { head: await commitAll(root, body.message ?? 'nasce dal seme del kernel', 'genesis') };
            }
            case 'commit':
              await writeFiles(root, body.changes ?? {});
              return { head: await commitAll(root, String(body.message ?? 'commit'), String(body.author ?? 'kernel')) };
            case 'checkout': {
              if (!/^[0-9a-f]{4,40}$/.test(String(body.id))) throw new Error('commit non valido');
              await git(root, ['restore', `--source=${body.id}`, '--staged', '--worktree', '--', '.']);
              const h = await commitAll(root, `ritorno a ${body.id}`, 'kernel');
              return { head: h, files: await readTree(root) };
            }
            case 'branch':
              return { head: await writeBranch(root, String(body.branch), body.files ?? {}, String(body.message ?? 'ramo'), String(body.author ?? 'player')) };
            case 'merge':
              await mergeBranch(root, String(body.branch), String(body.message ?? 'pubblicazione'));
              return { head: await head(root) };
            case 'reset': {
              if (!(await exists(root))) return { trashed: null };
              // Never deleted: moved aside, so a universe can always be recovered by hand.
              const trash = path.join(baseDir, '.cestino', `${name}-${Date.now()}`);
              await fs.mkdir(path.dirname(trash), { recursive: true });
              await fs.rename(root, trash);
              return { trashed: path.relative(baseDir, trash) };
            }
          }
          throw new Error('operazione sconosciuta');
        }),
      )
      .then((r) => send(res, 200, r), fail);
  };
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
