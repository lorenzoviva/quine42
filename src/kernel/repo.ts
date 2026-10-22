// Versioning of a universe: snapshots of the universe files, one commit per valid state; rollback
// always returns to the last valid commit. In the browser the snapshots of this session live in
// memory and every commit is also written to the universe's git repository on disk (a backend,
// ADR-0021); without a backend (tests, static hosting) the repo persists in a key-value store.

import type { FileMap } from './types';
import { hashStr, hex } from './rng';
import type { PastCommit, UniverseBackend } from './universes';

export type Author = 'genesis' | 'player' | 'agent' | 'dev' | 'kernel';

export interface Commit {
  id: string;
  parent: string | null;
  message: string;
  author: Author;
  time: number;
  files: FileMap;
}

interface RepoData {
  name: string;
  /** Hash of the bundled (on-disk) universe this repo was last synced with. */
  base: string;
  head: string;
  commits: Commit[];
}

export interface KeyValueStore {
  load(key: string): string | null;
  save(key: string, value: string): void;
}

export const memoryStore = (): KeyValueStore => {
  const m = new Map<string, string>();
  return { load: (k) => m.get(k) ?? null, save: (k, v) => void m.set(k, v) };
};

export const localStore: KeyValueStore = {
  load: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  save: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch (e) {
      console.warn('[repo] salvataggio fallito', e);
    }
  },
};

const MAX_COMMITS = 120;

export function hashFiles(files: FileMap): string {
  const keys = Object.keys(files).sort();
  return hex(hashStr(keys.map((k) => `${k}\0${files[k]}`).join('\u0001')));
}

export class Repo {
  /** Files currently loaded in the universe; may differ from HEAD (uncommitted / broken edits). */
  working: FileMap;
  private data: RepoData;
  /** The universe repository on disk, if any: commits are written there too. */
  backend?: UniverseBackend;
  /** Commits of earlier sessions (from the backend): history only, no snapshots. */
  past: PastCommit[] = [];
  /** Runs before every commit: the kernel writes files it keeps in memory (the usage ledger). */
  beforeCommit?: () => void;

  private constructor(
    data: RepoData,
    private store: KeyValueStore,
  ) {
    this.data = data;
    this.working = { ...this.head().files };
  }

  /** Opens (or creates) the repo; if the bundled files changed on disk, they become a new commit. */
  static open(name: string, bundled: FileMap, store: KeyValueStore): { repo: Repo; synced: boolean } {
    const key = Repo.key(name);
    const base = hashFiles(bundled);
    const raw = store.load(key);
    let data: RepoData | null = null;
    if (raw) {
      try {
        data = JSON.parse(raw) as RepoData;
      } catch {
        data = null;
      }
    }
    if (!data || !data.commits?.length) {
      const genesis = Repo.makeCommit(null, 'genesi', 'genesis', bundled);
      data = { name, base, head: genesis.id, commits: [genesis] };
      const repo = new Repo(data, store);
      repo.persist();
      return { repo, synced: false };
    }
    const repo = new Repo(data, store);
    if (data.base !== base) {
      data.base = base;
      repo.working = { ...bundled };
      repo.commit('sincronizzato dal disco', 'dev');
      return { repo, synced: true };
    }
    return { repo, synced: false };
  }

  static key(name: string): string {
    return `rune:repo:${name}`;
  }

  private static makeCommit(parent: string | null, message: string, author: Author, files: FileMap): Commit {
    const time = Date.now();
    const id = hex(hashStr(`${parent}|${message}|${time}|${hashFiles(files)}`)).slice(0, 7);
    return { id, parent, message, author, time, files: { ...files } };
  }

  head(): Commit {
    return this.find(this.data.head)!;
  }

  find(id: string): Commit | undefined {
    return this.data.commits.find((c) => c.id === id);
  }

  /** This session's commits, newest first, then earlier sessions' (without snapshots). */
  log(): Commit[] {
    const known = new Set(this.data.commits.map((c) => c.id));
    const older = this.past.filter((p) => !known.has(p.id)).map((p) => ({ id: p.id, parent: null, message: p.message, author: (p.author === 'Concilio' ? 'agent' : p.author === 'Viandante' ? 'player' : 'kernel') as Author, time: p.time, files: {} as FileMap, past: true }));
    return [...[...this.data.commits].reverse(), ...older];
  }

  /** Who last changed a file (by walking the history back), or null if it never changed since genesis. */
  lastAuthorOf(path: string): Author | null {
    if (this.working[path] !== this.head().files[path]) return 'player';
    const commits = this.data.commits;
    for (let i = commits.length - 1; i > 0; i--) {
      if (commits[i].files[path] !== commits[i - 1].files[path]) return commits[i].author;
    }
    return commits[0]?.files[path] !== undefined ? commits[0].author : null;
  }

  isDirty(): boolean {
    return hashFiles(this.working) !== hashFiles(this.head().files);
  }

  write(path: string, content: string | null): void {
    if (content === null) delete this.working[path];
    else this.working[path] = content;
  }

  commit(message: string, author: Author): Commit {
    this.beforeCommit?.();
    const prev = this.head().files;
    const c = Repo.makeCommit(this.data.head, message, author, this.working);
    if (this.backend) {
      const changes: Record<string, string | null> = {};
      for (const [p, v] of Object.entries(this.working)) if (prev[p] !== v) changes[p] = v;
      for (const p of Object.keys(prev)) if (!(p in this.working)) changes[p] = null;
      if (Object.keys(changes).length) void this.backend.commit(changes, message, author);
    }
    this.data.commits.push(c);
    if (this.data.commits.length > MAX_COMMITS) this.data.commits.splice(1, this.data.commits.length - MAX_COMMITS);
    this.data.head = c.id;
    this.persist();
    return c;
  }

  /** Moves HEAD to a commit and resets the working files to it. */
  checkout(id: string): FileMap {
    const c = this.find(id);
    if (!c) throw new Error(`commit sconosciuto: ${id}`);
    this.data.head = c.id;
    this.working = { ...c.files };
    this.persist();
    return this.working;
  }

  /** Discards uncommitted changes. */
  restore(): FileMap {
    this.working = { ...this.head().files };
    return this.working;
  }

  export(): string {
    return JSON.stringify(this.data);
  }

  import(json: string): void {
    const data = JSON.parse(json) as RepoData;
    if (!data.commits?.length || !data.head) throw new Error('file universo non valido');
    data.name = this.data.name;
    data.base = this.data.base;
    this.data = data;
    this.working = { ...this.head().files };
    this.persist();
  }

  private persist(): void {
    // With a universe repository on disk, nothing goes to the (small) browser store.
    if (this.backend) return;
    this.store.save(Repo.key(this.data.name), JSON.stringify(this.data));
  }

  /** Files changed by the latest commits of this session (newest wins), for the studio to show. */
  recentChanges(n: number): Map<string, { author: string; message: string; time: number }> {
    const out = new Map<string, { author: string; message: string; time: number }>();
    const cs = this.data.commits;
    for (let i = cs.length - 1; i > 0 && i >= cs.length - n; i--) {
      const a = cs[i].files;
      const b = cs[i - 1].files;
      for (const p of new Set([...Object.keys(a), ...Object.keys(b)])) if (a[p] !== b[p] && !out.has(p)) out.set(p, { author: cs[i].author, message: cs[i].message, time: cs[i].time });
    }
    return out;
  }

  /** Writes commits to a universe repository from now on (the files are already there). */
  attach(backend: UniverseBackend, past: PastCommit[]): void {
    this.backend = backend;
    this.past = past;
  }
}
