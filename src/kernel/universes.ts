// Two repositories (ADR-0021):
// 1. the KERNEL repository — this project; its `universe/` folder is the seed every universe starts
//    from. It never changes while playing.
// 2. the UNIVERSE repository — a real git repository on disk (`universes/<name>/`, served by
//    server/universeStore.ts): modules, rules, people, models, maps. It grows session after session.
// Here: the browser client of the universe repository, and the merge of kernel updates into it.

import type { FileMap } from './types';
import { allowedPath } from './paths';
import type { Author } from './repo';
import { hashStr, hex } from './rng';
import { checkKernelVersion } from './version';
import type { ChunkRecord, ChunkStore } from './chunks';

export interface PastCommit {
  id: string;
  author: string;
  time: number;
  message: string;
}

export interface UniverseSnapshot {
  exists: boolean;
  head?: string;
  log?: PastCommit[];
  files?: FileMap;
}

/** Where commits go: the universe repository on disk. Tests and static hosting have none. */
export interface UniverseBackend {
  readonly name: string;
  listMaps?(): Promise<Array<{ file: string; name: string; layout: string }>>;
  commit(changes: Record<string, string | null>, message: string, author: Author): Promise<string | null>;
  checkout(id: string): Promise<FileMap | null>;
  reset(): Promise<void>;
  /** A branch (T42b: the master's), whole: the main line as it is now with these files changed; none deletes it. */
  branch?(name: string, files: Record<string, string | null>, message: string, author: Author): Promise<string | null>;
  /** What a branch changes against the main line it was last written on, or null if there is none. */
  readBranch?(name: string): Promise<Record<string, string | null> | null>;
  /** A branch published: merged into the main line (whose files already are the branch's), then gone. */
  merge?(name: string, message: string): Promise<void>;
  /** A copy of this universe with another master (T42d), under a new name; returns the clone's head. */
  clone?(nome: string, master: string, titolari: 'restano' | 'master'): Promise<string | null>;
}

/** Hash of every seed file a universe was made from (or last updated from): `seed.json`. */
export const SEED_FILE = 'seed.json';
const h = (s: string) => hex(hashStr(s));

export function seedHashes(seed: FileMap): Record<string, string> {
  return Object.fromEntries(Object.entries(seed).map(([p, c]) => [p, h(c)]));
}

/**
 * The kernel improves its seed (a new system, a fixed module); universes made from an older seed get
 * the improvement only where they never changed that file themselves — a three-way merge where the
 * universe always wins. New seed files arrive; files the universe deleted or rewrote stay as they are.
 * The models in universe.json always follow the kernel (they are infrastructure, not content).
 * A universe out of the range of the kernels it runs on (T302, ADR-0152) takes nothing: the seed is of another contract.
 */
/** Whether a universe.json runs on this kernel; one that is not readable is left to the fault of the configuration. */
function ofThisKernel(src: string | undefined): boolean {
  let parsed: { kernel?: unknown; kernels?: unknown };
  try {
    parsed = JSON.parse(src ?? '');
  } catch {
    return true;
  }
  if (!parsed || typeof parsed !== 'object') return true;
  return checkKernelVersion(parsed.kernel, undefined, parsed.kernels).ok;
}

export function upgradeFromSeed(files: FileMap, seed: FileMap): { files: FileMap; changes: Record<string, string | null>; updated: string[] } {
  if (!ofThisKernel(files['universe.json'])) return { files, changes: {}, updated: [] };
  let base: Record<string, string> = {};
  try {
    base = JSON.parse(files[SEED_FILE] ?? '{}');
  } catch {
    base = {};
  }
  const out: FileMap = { ...files };
  const changes: Record<string, string | null> = {};
  const updated: string[] = [];
  for (const [p, content] of Object.entries(seed)) {
    const mine = files[p];
    const was = base[p];
    if (mine === undefined) {
      // Never had it (a new kernel module), or deleted it on purpose (it was in the old seed).
      if (was !== undefined) continue;
      out[p] = changes[p] = content;
      updated.push(p);
    } else if (was !== undefined && h(mine) === was && mine !== content) {
      out[p] = changes[p] = content;
      updated.push(p);
    }
  }
  // Manifests the universe rewrote still receive what the kernel added to them: new terrains, new
  // environments, new runes and incantations — never replacing what the universe has.
  for (const [p, content] of Object.entries(seed)) {
    const mine = out[p];
    if (!mine || mine === content || !p.endsWith('manifest.json')) continue;
    const merged = mergeKeyed(mine, content);
    if (merged && merged !== mine) {
      out[p] = changes[p] = merged;
      if (!updated.includes(p)) updated.push(p);
    }
  }
  // The library's index the Sculptor rewrote still receives the kernel's new models (the corona's buildings).
  const index = 'models/index.json';
  if (out[index] && seed[index] && out[index] !== seed[index]) {
    const merged = mergeEntries(out[index], seed[index]);
    if (merged && merged !== out[index]) {
      out[index] = changes[index] = merged;
      if (!updated.includes(index)) updated.push(index);
    }
  }
  const cfg = upgradeModels(out['universe.json'], seed['universe.json']);
  if (cfg && cfg !== out['universe.json']) {
    out['universe.json'] = changes['universe.json'] = cfg;
    if (!updated.includes('universe.json')) updated.push('universe.json');
  }
  const hashes = JSON.stringify(seedHashes(seed), null, 1) + '\n';
  if (out[SEED_FILE] !== hashes) out[SEED_FILE] = changes[SEED_FILE] = hashes;
  return { files: out, changes, updated };
}

const KEYED = ['tiles', 'layouts', 'runes', 'spells'] as const;

/** The seed's top-level entries the universe lacks, added; the universe's own never replaced. */
function mergeEntries(mine: string, seed: string): string | undefined {
  try {
    const m = JSON.parse(mine);
    const s = JSON.parse(seed);
    const add = Object.keys(s).filter((id) => !(id in m));
    if (!add.length) return mine;
    for (const id of add) m[id] = s[id];
    return JSON.stringify(m, null, 1) + '\n';
  } catch {
    return undefined;
  }
}

function mergeKeyed(mine: string, seed: string): string | undefined {
  try {
    const m = JSON.parse(mine);
    const s = JSON.parse(seed);
    let changed = false;
    for (const k of KEYED) {
      if (!s[k] || typeof s[k] !== 'object') continue;
      m[k] ??= {};
      for (const [id, v] of Object.entries(s[k])) {
        if (id in m[k]) continue;
        m[k][id] = v;
        changed = true;
      }
    }
    return changed ? JSON.stringify(m, null, 2) + '\n' : mine;
  } catch {
    return undefined;
  }
}

function upgradeModels(mine: string | undefined, seed: string | undefined): string | undefined {
  if (!mine || !seed) return mine;
  try {
    const m = JSON.parse(mine);
    const s = JSON.parse(seed);
    if (!s.ai || !m.ai || (m.ai.textModel === s.ai.textModel && m.ai.imageModel === s.ai.imageModel)) return mine;
    m.ai.textModel = s.ai.textModel;
    m.ai.imageModel = s.ai.imageModel;
    return JSON.stringify(m, null, 2) + '\n';
  } catch {
    return mine;
  }
}

/** How the world of this server's own process proves itself to the store (T120, ADR-0102); the secret never leaves the process. */
export const INTERNAL_HEADER = 'x-quine-interno';
/** On a server without accounts, the wanderer a page on this machine says it is. */
export const WANDERER_HEADER = 'x-quine-viandante';

/** The waits between the tries of a write that failed (ms), one after the other: a socket that dropped comes back at once, a lock in a moment. */
const COMMIT_TRIES_MS = [200, 1000, 4000];
/** How often a write in waiting tries again by itself, when no new write comes to carry it (ms). */
const COMMIT_WAITING_MS = 30_000;
/**
 * The ceiling of the line (T265): past either, a new commit folds into the last commit in line, a place's plan replaces the one with
 * its key, a branch the last of its name (when no merge of it comes after). History loses detail; the disk does not lose a file.
 */
export const OWED_MAX = 256;
/** Characters of the saved line: localStorage holds about 5 million per site, shared with the rest of the game. */
export const OWED_MAX_BYTES = 2 * 1024 * 1024;

/** A write the store has not taken yet: commits, places' plans, branches and merges, in one line (T265). Saved as it is, never a token. */
export type OwedWrite =
  | { kind: 'commit'; changes: Record<string, string | null>; message: string; author: Author; folded?: number }
  | { kind: 'map'; key: string; data: unknown }
  | { kind: 'branch'; branch: string; files: Record<string, string | null>; message: string; author: Author }
  | { kind: 'merge'; branch: string; message: string };

/** One in line: what to write, what the store answered, its size when saved. */
interface Owed {
  write: OwedWrite;
  head?: string | null;
  bytes: number;
}

/** Where the line lives across a reload (T265): the browser's storage, or nothing (a world's process, tests that do not ask). */
export interface OwedStorage {
  /** What the last page left in line, oldest first. */
  load(): OwedWrite[];
  /** The line as it is now (empty: nothing left); false if it could not be kept. */
  save(line: OwedWrite[]): boolean;
}

const AUTHORS = new Set(['player', 'agent', 'kernel']);
const isChanges = (v: unknown): v is Record<string, string | null> =>
  !!v && typeof v === 'object' && !Array.isArray(v) && Object.values(v).every((x) => x === null || typeof x === 'string');

/** What a storage gave back, only if it is a write of the line: anything else is dropped. */
export function owedWrite(v: unknown): OwedWrite | undefined {
  const w = v as Partial<Record<string, unknown>> | undefined;
  if (!w || typeof w !== 'object') return undefined;
  const text = (k: string) => typeof w[k] === 'string';
  if (w.kind === 'commit' && isChanges(w.changes) && text('message') && AUTHORS.has(String(w.author)))
    return { kind: 'commit', changes: w.changes, message: w.message as string, author: w.author as Author };
  if (w.kind === 'map' && text('key') && w.data !== undefined) return { kind: 'map', key: w.key as string, data: w.data };
  if (w.kind === 'branch' && text('branch') && isChanges(w.files) && text('message') && AUTHORS.has(String(w.author)))
    return { kind: 'branch', branch: w.branch as string, files: w.files, message: w.message as string, author: w.author as Author };
  if (w.kind === 'merge' && text('branch') && text('message')) return { kind: 'merge', branch: w.branch as string, message: w.message as string };
  return undefined;
}

/** A line left by a tab that closed is taken by the next page after this long without news of it (ms). */
export const ORPHAN_LINE_MS = 2 * 60_000;

/**
 * The browser's line (T265): one key per tab and universe in localStorage, `quine:fila:<universo>:<scheda>`, the tab's id in its
 * sessionStorage, so a reload finds its own line and two tabs never write each other's. A line whose tab gave no news for
 * `ORPHAN_LINE_MS` (closed, crashed) is taken by the next page of that universe. Undefined without storage.
 */
export function browserOwedStorage(name: string, now: () => number = () => Date.now()): OwedStorage | undefined {
  const g = globalThis as { localStorage?: Storage; sessionStorage?: Storage; document?: unknown };
  let local: Storage;
  let tab: string;
  try {
    // A page only: a Node with web storage (a world's process) keeps its line in memory, as before.
    if (!g.document || !g.localStorage || !g.sessionStorage) return undefined;
    local = g.localStorage;
    tab = g.sessionStorage.getItem('quine:scheda') ?? '';
    if (!/^[a-z0-9]{6,20}$/.test(tab)) {
      tab = Math.random().toString(36).slice(2, 12).padEnd(6, '0');
      g.sessionStorage.setItem('quine:scheda', tab);
    }
  } catch {
    return undefined;
  }
  const prefix = `quine:fila:${name}:`;
  const own = prefix + tab;
  const read = (key: string): { at: number; line: OwedWrite[] } | undefined => {
    try {
      const j = JSON.parse(local.getItem(key) ?? 'null');
      if (!j || !Array.isArray(j.line)) return undefined;
      return { at: Number(j.at) || 0, line: j.line.map(owedWrite).filter((w: OwedWrite | undefined): w is OwedWrite => !!w) };
    } catch {
      return undefined;
    }
  };
  return {
    load() {
      const lines: Array<{ at: number; line: OwedWrite[] }> = [];
      try {
        for (let i = 0; i < local.length; i++) {
          const key = local.key(i);
          if (!key?.startsWith(prefix)) continue;
          const l = read(key);
          if (key === own) {
            if (l) lines.push(l);
          } else if (!l || now() - l.at > ORPHAN_LINE_MS) {
            if (l) lines.push(l);
            local.removeItem(key);
            i--;
          }
        }
      } catch {
        /* a storage that does not answer: nothing to take */
      }
      return lines.sort((a, b) => a.at - b.at).flatMap((l) => l.line);
    },
    save(line) {
      try {
        if (line.length) local.setItem(own, JSON.stringify({ at: now(), line }));
        else local.removeItem(own);
        return true;
      } catch {
        return false;
      }
    },
  };
}

/** The store answered, and not with what was asked. */
class StoreAnswer extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/**
 * What a failure means for a write. `waits`: nobody took it and it stays in line (no answer at all, a gateway with no store behind it, a "later").
 * `tries`: the store failed on it, maybe not by its fault: a few tries, then it gives way, since a write that always fails must not stop those after it.
 * `refused`: the store said no (a path, a permission) and would say no again. A 401 the client could renew is not here (`written`).
 */
function failureKind(e: unknown): 'waits' | 'tries' | 'refused' {
  if (!(e instanceof StoreAnswer)) return 'waits';
  if ([408, 429, 502, 503, 504].includes(e.status)) return 'waits';
  return e.status >= 500 ? 'tries' : 'refused';
}

/** A failure in words, with what Node keeps under its bare «fetch failed». */
function failureWords(e: unknown): string {
  const cause = (e as { cause?: { code?: string; message?: string } }).cause;
  const under = cause?.code ?? cause?.message;
  return under ? `${(e as Error).message} (${under})` : (e as Error).message;
}

const WORDS: Record<OwedWrite['kind'], string> = { commit: 'commit', map: 'piano', branch: 'ramo', merge: 'pubblicazione del ramo' };

export interface UniverseClientOptions {
  /** Where the line lives across a reload; by default the browser's (`browserOwedStorage`), none in Node. */
  storage?: OwedStorage | null;
}

/** Client of the universe store (server/universeStore.ts): the browser's, or the session server's with an absolute `base` (T38). */
export class UniverseClient implements UniverseBackend {
  private queue: Promise<unknown> = Promise.resolve();
  lastError = '';
  /**
   * Every write in order, the first is the next (ADR-0122, T265): commits carry only what changed, so one skipped would never reach the disk
   * and the next must not pass it; plans, branches and merges keep their place among them.
   */
  private owed: Owed[] = [];
  private owedBytes = 0;
  /** The first in line has used its tries: until it passes, one try each time, not to make the queue wait at every write. */
  private waiting = false;
  private retry?: ReturnType<typeof setTimeout>;
  private closed = false;
  private storage?: OwedStorage;
  /** The line could not be saved: said once. */
  private unsaved = false;
  /**
   * A 401 asks for this (T265): fresh headers (an account's token renewed), or undefined if they cannot be had now. Without it a 401 is a refusal.
   * The headers never go into the saved line.
   */
  renewAuth?: () => Promise<Record<string, string> | undefined>;

  private constructor(
    readonly name: string,
    private base = '',
    private headers: Record<string, string> = {},
    opts: UniverseClientOptions = {},
  ) {
    this.storage = opts.storage === undefined ? browserOwedStorage(base ? `${base}|${name}` : name) : (opts.storage ?? undefined);
    const left = this.storage?.load() ?? [];
    for (const w of left) this.enter(w, false);
    if (left.length) {
      this.lastError = `${left.length} scritture lasciate in fila dalla pagina prima`;
      console.warn(`[universo] ${this.lastError}: si scrivono prima di leggere l'universo`);
      this.waitForStore();
    }
  }

  /** null when there is no universe store (static hosting, tests). */
  static async connect(name: string, base = '', headers: Record<string, string> = {}, opts: UniverseClientOptions = {}): Promise<UniverseClient | null> {
    try {
      const r = await fetch(`${base}/api/universe`, { headers });
      if (!r.ok) return null;
      const j = await r.json();
      return j?.available ? new UniverseClient(name, base, headers, opts) : null;
    } catch {
      return null;
    }
  }

  /** Writes not yet on disk (shown by the console), those in waiting too. */
  get pending(): number {
    return this.owed.length;
  }

  /** Who is asking from now on: an account's token, or on a server without accounts the wanderer's id. */
  identify(headers: Record<string, string>): void {
    this.headers = headers;
  }

  private url(op = ''): string {
    return `${this.base}/api/universe/${this.name}${op ? `/${op}` : ''}`;
  }

  private async post(op: string, body: unknown): Promise<any> {
    const r = await fetch(this.url(op), { method: 'POST', headers: { 'Content-Type': 'application/json', ...this.headers }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new StoreAnswer(j.error ?? `HTTP ${r.status}`, r.status);
    return j;
  }

  /** The universe as the disk has it: what the page before left in line is written first, if the store takes it. */
  async load(): Promise<UniverseSnapshot> {
    if (this.owed.length) await this.inLine(() => this.writeOwed());
    const r = await fetch(this.url(), { headers: this.headers });
    return r.json();
  }

  async create(files: FileMap, message: string): Promise<string | null> {
    return (await this.post('create', { files: this.admitted(files), message })).head ?? null;
  }

  /**
   * What the store takes (ADR-0103). A path it would refuse (a player's: the rule is that they may break the game) stays in
   * the game and out of the disk, with the rest of its commit written: commits carry only what changed, so a refused one would be lost.
   */
  private admitted<T>(files: Record<string, T>): Record<string, T> {
    const refused = Object.keys(files).filter((p) => !allowedPath(p));
    if (!refused.length) return files;
    this.lastError = `percorsi non ammessi: ${refused.slice(0, 5).join(', ')}`;
    console.warn('[universo]', this.lastError);
    return Object.fromEntries(Object.entries(files).filter(([p]) => allowedPath(p)));
  }

  /**
   * Into the line, or folded into one already there when the line is at its ceiling (`OWED_MAX`, `OWED_MAX_BYTES`). Returns the entry
   * whose answer is this write's.
   */
  private enter(write: OwedWrite, save = true): Owed {
    const bytes = JSON.stringify(write).length;
    const full = this.owed.length >= OWED_MAX || this.owedBytes + bytes > OWED_MAX_BYTES;
    const into = full ? this.foldTarget(write) : undefined;
    let entry: Owed;
    if (into) {
      const before = into.bytes;
      const w = into.write;
      if (w.kind === 'commit' && write.kind === 'commit') {
        w.changes = { ...w.changes, ...write.changes };
        w.folded = (w.folded ?? 0) + 1;
        if (!w.message.includes('(fila piena')) w.message += ' (fila piena: con i commit dopo)';
      } else into.write = write;
      into.bytes = JSON.stringify(into.write).length;
      this.owedBytes += into.bytes - before;
      entry = into;
      if (!this.unsaved) console.warn(`[universo] fila al tetto (${this.owed.length} scritture): ${WORDS[write.kind]} unito a uno in fila`);
    } else {
      entry = { write, bytes };
      this.owed.push(entry);
      this.owedBytes += bytes;
    }
    if (save) this.persist();
    return entry;
  }

  /** At the ceiling: the last commit (for a commit), the plan of the same key, the last branch of the name with no merge of it after. Never the first, which may be in flight. */
  private foldTarget(write: OwedWrite): Owed | undefined {
    for (let i = this.owed.length - 1; i >= 1; i--) {
      const w = this.owed[i].write;
      if (write.kind === 'commit' && w.kind === 'commit') return this.owed[i];
      if (write.kind === 'map' && w.kind === 'map' && w.key === write.key) return this.owed[i];
      if (write.kind === 'branch' && w.kind === 'merge' && w.branch === write.branch) return undefined;
      if (write.kind === 'branch' && w.kind === 'branch' && w.branch === write.branch) return this.owed[i];
    }
    return undefined;
  }

  /** The line into its storage, so a reload finds it. */
  private persist(): void {
    if (!this.storage) return;
    const line = this.owedBytes <= OWED_MAX_BYTES ? this.owed.map((o) => o.write) : undefined;
    const ok = line ? this.storage.save(line) : false;
    if (!ok && !this.unsaved) {
      this.unsaved = true;
      console.warn('[universo] la fila non si salva (spazio del browser): una ricarica la perderebbe');
    }
    if (ok) this.unsaved = false;
  }

  /** Writes the line in order, as far as it goes, then gives the answer of `entry` (or `fallback` while it waits). */
  private through<T>(entry: Owed, answer: (o: Owed) => T): Promise<T> {
    return this.inLine(() => this.writeOwed()).then(() => answer(entry));
  }

  /**
   * Commits are written in order, one at a time, without blocking the game. One the store did not take stays first in line (ADR-0122): tried again
   * now and then and by every write after it, never passed. Resolves with its head, or null if it was refused or has not been written yet.
   */
  commit(all: Record<string, string | null>, message: string, author: Author): Promise<string | null> {
    const entry = this.enter({ kind: 'commit', changes: this.admitted(all), message, author });
    return this.through(entry, (o) => o.head ?? null);
  }

  private inLine<T>(fn: () => Promise<T>): Promise<T> {
    const job = this.queue.then(fn);
    this.queue = job.catch(() => undefined);
    return job;
  }

  /** Only from the queue: the writes in line, as far as they go. Never throws. */
  private async writeOwed(): Promise<void> {
    while (this.owed.length) {
      const first = this.owed[0];
      if (!(await this.written(first))) {
        this.persist();
        this.waitForStore();
        return;
      }
      this.owed.shift();
      this.owedBytes -= first.bytes;
      this.persist();
    }
    if (this.waiting) console.warn('[universo] la fila delle scritture in attesa è finita');
    this.waiting = false;
  }

  /** One write, as the store wants it. */
  private async send(o: Owed): Promise<void> {
    const w = o.write;
    if (w.kind === 'commit') o.head = (await this.post('commit', { changes: w.changes, message: w.message, author: w.author })).head ?? null;
    else if (w.kind === 'branch') o.head = (await this.post('branch', { branch: w.branch, files: w.files, message: w.message, author: w.author })).head ?? null;
    else if (w.kind === 'merge') await this.post('merge', { branch: w.branch, message: w.message });
    else {
      const r = await fetch(this.url(`map/${encodeURIComponent(w.key)}`), { method: 'PUT', headers: { 'Content-Type': 'application/json', ...this.headers }, body: JSON.stringify(w.data) });
      if (!r.ok) throw new StoreAnswer((await r.json().catch(() => ({}))).error ?? `HTTP ${r.status}`, r.status);
    }
  }

  /** False if the write stays in line; true if it is done with, on disk or given up. */
  private async written(o: Owed): Promise<boolean> {
    let renewed = false;
    for (let i = 0; ; i++) {
      try {
        await this.send(o);
        return true;
      } catch (e) {
        this.lastError = failureWords(e);
        // A token that expired (T265): renewed once per round and tried again at once; one that cannot be renewed now waits, the write with it.
        if (e instanceof StoreAnswer && e.status === 401 && this.renewAuth && !renewed) {
          renewed = true;
          const fresh = await this.renewAuth().catch(() => undefined);
          if (fresh) {
            this.headers = fresh;
            i--;
            continue;
          }
          return false;
        }
        const kind = failureKind(e);
        const spent = i >= COMMIT_TRIES_MS.length || (kind === 'waits' && this.waiting);
        if (kind === 'refused' || (kind === 'tries' && spent)) {
          console.warn(`[universo] ${WORDS[o.write.kind]} non scritto su disco:`, this.lastError);
          return true;
        }
        if (spent) return false;
        await new Promise((r) => setTimeout(r, COMMIT_TRIES_MS[i]));
      }
    }
  }

  private waitForStore(): void {
    if (!this.waiting) console.warn(`[universo] scrittura in attesa (${this.lastError}): si ritenta`);
    this.waiting = true;
    if (this.retry !== undefined || this.closed) return;
    this.retry = setTimeout(() => {
      this.retry = undefined;
      void this.inLine(() => this.writeOwed());
    }, COMMIT_WAITING_MS);
    // A world that stops does not stay up for this.
    (this.retry as { unref?: () => void }).unref?.();
  }

  /** What comes after the writes must find them on disk: it does not go on past one in waiting. */
  private async afterCommits(): Promise<void> {
    await this.inLine(() => this.writeOwed());
    if (this.owed.length) throw new Error(`${this.owed.length} scritture in attesa: ${this.lastError}`);
  }

  /** No more tries by itself: who stops has waited as long as it could. Says what stays behind (saved for the next page, in a browser). */
  close(): void {
    this.closed = true;
    if (this.retry !== undefined) clearTimeout(this.retry);
    this.retry = undefined;
    if (this.owed.length) console.warn(`[universo] ${this.owed.length} scritture non su disco alla chiusura: ${this.lastError}`);
  }

  async checkout(id: string): Promise<FileMap | null> {
    await this.afterCommits();
    return (await this.post('checkout', { id })).files ?? null;
  }

  async reset(): Promise<void> {
    await this.inLine(() => this.writeOwed());
    await this.post('reset', {});
    // The universe went to the bin: what was still owed to it has nowhere to go.
    this.owed = [];
    this.owedBytes = 0;
    this.waiting = false;
    this.persist();
  }

  /** Branches are written in the same line as the commits (T265): a merge comes after the commit that publishes it, and waits with it. */
  branch(name: string, files: Record<string, string | null>, message: string, author: Author): Promise<string | null> {
    return this.through(this.enter({ kind: 'branch', branch: name, files, message, author }), (o) => o.head ?? null);
  }

  async readBranch(name: string): Promise<Record<string, string | null> | null> {
    await this.queue;
    const r = await fetch(this.url(`branch/${encodeURIComponent(name)}`), { headers: this.headers }).catch(() => null);
    const j = r?.ok ? await r.json().catch(() => null) : null;
    return j?.exists ? j.files : null;
  }

  merge(name: string, message: string): Promise<void> {
    return this.through(this.enter({ kind: 'merge', branch: name, message }), () => undefined);
  }

  /** After the writes in flight, so the clone has them. Throws with the store's reason (a name taken, a master already). */
  async clone(nome: string, master: string, titolari: 'restano' | 'master' = 'restano'): Promise<string | null> {
    await this.afterCommits();
    return (await this.post('clone', { nome, master, titolari })).head ?? null;
  }

  // Maps: files of the universe too, outside the text snapshot.
  /** Every place ever planned in this universe (file name, place name, environment). */
  async listMaps(): Promise<Array<{ file: string; name: string; layout: string }>> {
    const r = await fetch(this.url('maps'), { headers: this.headers }).catch(() => null);
    return r?.ok ? r.json() : [];
  }

  /** A place's plan: the one still in line if there is one (it is newer than the disk's). */
  async getMap(key: string): Promise<unknown | undefined> {
    for (let i = this.owed.length - 1; i >= 0; i--) {
      const w = this.owed[i].write;
      if (w.kind === 'map' && w.key === key) return w.data;
    }
    const r = await fetch(this.url(`map/${encodeURIComponent(key)}`), { headers: this.headers }).catch(() => null);
    return r?.ok ? r.json() : undefined;
  }

  /** In the line with the commits (T265): tried again like them, in their order. */
  putMap(key: string, data: unknown): Promise<void> {
    return this.through(this.enter({ kind: 'map', key, data }), () => undefined);
  }
}

/** The maps (each place's plan) are files of the universe too (`maps/`). */
export class UniverseChunks implements ChunkStore {
  constructor(
    private client: UniverseClient,
    private legacy?: ChunkStore,
  ) {}
  async load(key: string): Promise<ChunkRecord | undefined> {
    const r = (await this.client.getMap(key)) as ChunkRecord | undefined;
    if (r) return r;
    const old = await this.legacy?.load(key);
    if (old) void this.client.putMap(key, old);
    return old;
  }
  async save(key: string, record: ChunkRecord): Promise<void> {
    await this.client.putMap(key, record);
  }
  async clear(): Promise<void> {
    await this.legacy?.clear();
  }
}
