// Local versioning of a universe: full snapshots of the universe files, one commit per valid state.
// Every universe is its own repository; rollback always returns to the last valid commit.

import type { FileMap } from './types';
import { hashStr, hex } from './rng';

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

  log(): Commit[] {
    return [...this.data.commits].reverse();
  }

  isDirty(): boolean {
    return hashFiles(this.working) !== hashFiles(this.head().files);
  }

  write(path: string, content: string | null): void {
    if (content === null) delete this.working[path];
    else this.working[path] = content;
  }

  commit(message: string, author: Author): Commit {
    const c = Repo.makeCommit(this.data.head, message, author, this.working);
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
    this.store.save(Repo.key(this.data.name), JSON.stringify(this.data));
  }
}
