// Two repositories (ADR-0021):
// 1. the KERNEL repository — this project; its `universe/` folder is the seed every universe starts
//    from. It never changes while playing.
// 2. the UNIVERSE repository — a real git repository on disk (`universes/<name>/`, served by
//    server/universeStore.ts): modules, rules, people, maps, images. It grows session after session.
// Here: the browser client of the universe repository, and the merge of kernel updates into it.

import type { FileMap } from './types';
import type { Author } from './repo';
import { hashStr, hex } from './rng';
import { assetId, type AssetStore, type ChunkRecord, type ChunkStore } from './assets';

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
  commit(changes: Record<string, string | null>, message: string, author: Author): Promise<string | null>;
  checkout(id: string): Promise<FileMap | null>;
  reset(): Promise<void>;
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
 */
export function upgradeFromSeed(files: FileMap, seed: FileMap): { files: FileMap; changes: Record<string, string | null>; updated: string[] } {
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
  const cfg = upgradeModels(out['universe.json'], seed['universe.json']);
  if (cfg && cfg !== out['universe.json']) {
    out['universe.json'] = changes['universe.json'] = cfg;
    if (!updated.includes('universe.json')) updated.push('universe.json');
  }
  const hashes = JSON.stringify(seedHashes(seed), null, 1) + '\n';
  if (out[SEED_FILE] !== hashes) out[SEED_FILE] = changes[SEED_FILE] = hashes;
  return { files: out, changes, updated };
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

/** Browser client of the universe store (server/universeStore.ts). */
export class UniverseClient implements UniverseBackend {
  private queue: Promise<unknown> = Promise.resolve();
  /** Commits not yet written to disk (shown by the console). */
  pending = 0;
  lastError = '';

  private constructor(readonly name: string) {}

  /** null when there is no universe store (static hosting, tests). */
  static async connect(name: string): Promise<UniverseClient | null> {
    try {
      const r = await fetch('/api/universe');
      if (!r.ok) return null;
      const j = await r.json();
      return j?.available ? new UniverseClient(name) : null;
    } catch {
      return null;
    }
  }

  private url(op = ''): string {
    return `/api/universe/${this.name}${op ? `/${op}` : ''}`;
  }

  private async post(op: string, body: unknown): Promise<any> {
    const r = await fetch(this.url(op), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
    return j;
  }

  async load(): Promise<UniverseSnapshot> {
    const r = await fetch(this.url());
    return r.json();
  }

  async create(files: FileMap, message: string): Promise<string | null> {
    return (await this.post('create', { files, message })).head ?? null;
  }

  /** Commits are written in order, one at a time, without blocking the game. */
  commit(changes: Record<string, string | null>, message: string, author: Author): Promise<string | null> {
    this.pending++;
    const job = this.queue.then(async () => {
      try {
        return (await this.post('commit', { changes, message, author })).head ?? null;
      } catch (e) {
        this.lastError = (e as Error).message;
        console.warn('[universo] commit non scritto su disco:', this.lastError);
        return null;
      } finally {
        this.pending--;
      }
    });
    this.queue = job;
    return job;
  }

  async checkout(id: string): Promise<FileMap | null> {
    await this.queue;
    return (await this.post('checkout', { id })).files ?? null;
  }

  async reset(): Promise<void> {
    await this.queue;
    await this.post('reset', {});
  }

  // Images and maps: files of the universe too, outside the text snapshot.
  async getAsset(id: string): Promise<string | undefined> {
    const r = await fetch(this.url(`asset/${encodeURIComponent(id)}`)).catch(() => null);
    return r?.ok ? r.text() : undefined;
  }

  async putAsset(id: string, dataUrl: string): Promise<void> {
    await fetch(this.url(`asset/${encodeURIComponent(id)}`), { method: 'PUT', body: dataUrl }).catch(() => undefined);
  }

  async getMap(key: string): Promise<unknown | undefined> {
    const r = await fetch(this.url(`map/${encodeURIComponent(key)}`)).catch(() => null);
    return r?.ok ? r.json() : undefined;
  }

  async putMap(key: string, data: unknown): Promise<void> {
    await fetch(this.url(`map/${encodeURIComponent(key)}`), { method: 'PUT', body: JSON.stringify(data) }).catch(() => undefined);
  }
}

/**
 * Images of the universe live in its repository (`assets/`). Images painted before (in the browser's
 * IndexedDB) are moved there the first time they are needed.
 */
export class UniverseAssets implements AssetStore {
  private m = new Map<string, string>();
  constructor(
    private client: UniverseClient,
    private legacy?: AssetStore,
  ) {}
  async put(dataUrl: string): Promise<string> {
    const id = assetId(dataUrl);
    if (!this.m.has(id)) {
      this.m.set(id, dataUrl);
      await this.client.putAsset(id, dataUrl);
    }
    return id;
  }
  async get(id: string): Promise<string | undefined> {
    if (this.m.has(id)) return this.m.get(id);
    let v = await this.client.getAsset(id);
    if (!v && this.legacy) {
      v = await this.legacy.get(id);
      if (v) void this.client.putAsset(id, v);
    }
    if (v) this.m.set(id, v);
    return v;
  }
  peek(id: string): string | undefined {
    return this.m.get(id);
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
