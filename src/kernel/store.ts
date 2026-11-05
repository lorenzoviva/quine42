// The lasting store of the modules (T245a, ADR-0138; primitive D of T183): what a module keeps across the openings of the world that is
// not a tile, as plain data under a key: a market's price, a site's counter, a tournament's board. One file per module in the world,
// `world/magazzino/<module>.json`, saved with the game; never sent to a client (it is in no list of `src/session/files.ts`), never
// written by the Council (no agent produces it: the kernel writes it in the save, which commits it at once). A cap in bytes per module
// and per universe: a full store says no.

import type { FileMap } from './types';

export const STORE_DIR = 'world/magazzino/';
/** Bytes of the JSON of one module's store, and of all of them. */
export const STORE_MODULE_BYTES = 64 * 1024;
export const STORE_UNIVERSE_BYTES = 1024 * 1024;
/** Keys of one module. */
export const STORE_KEYS = 256;
/** A key: letters, digits, `_ - . :`, at most 64. */
export const STORE_KEY_RE = /^[A-Za-z0-9_.:-]{1,64}$/;
/** A module's id as a file name (`paths.ts` admits the same letters). */
const MODULE_RE = /^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,80}$/;

export const storePath = (module: string): string => `${STORE_DIR}${module}.json`;

/** Whether a value is plain data that JSON keeps as it is: no functions, no cycles, finite numbers. */
function plain(v: unknown, depth = 0): boolean {
  if (v === null || typeof v === 'string' || typeof v === 'boolean') return true;
  if (typeof v === 'number') return Number.isFinite(v);
  if (depth > 16 || typeof v !== 'object') return false;
  if (Array.isArray(v)) return v.every((x) => plain(x, depth + 1));
  return Object.entries(v as Record<string, unknown>).every(([k, x]) => k !== '__proto__' && plain(x, depth + 1));
}

export class ModuleStores {
  private data = new Map<string, Record<string, unknown>>();
  private bytes = new Map<string, number>();
  private dirty = new Set<string>();
  private total = 0;

  /** The stores of a universe's files (a reset: what was in memory and not saved goes). */
  load(files: FileMap): void {
    this.data.clear();
    this.bytes.clear();
    this.dirty.clear();
    this.total = 0;
    for (const [p, src] of Object.entries(files)) {
      if (!p.startsWith(STORE_DIR) || !p.endsWith('.json')) continue;
      const module = p.slice(STORE_DIR.length, -'.json'.length);
      if (!MODULE_RE.test(module)) continue;
      try {
        const v = JSON.parse(src);
        if (!v || typeof v !== 'object' || Array.isArray(v)) continue;
        this.data.set(module, v);
        const n = JSON.stringify(v).length;
        this.bytes.set(module, n);
        this.total += n;
      } catch {
        // A store that does not read is empty: the module starts again, the world stands.
      }
    }
  }

  /** A copy of what a module keeps under a key, or undefined. */
  get(module: string, key: unknown): unknown {
    if (typeof key !== 'string' || !STORE_KEY_RE.test(key)) return undefined;
    const v = this.data.get(module)?.[key];
    return v === undefined ? undefined : structuredClone(v);
  }

  /** Keeps a value (undefined or null takes the key away). False, and nothing changes, when the key, the value or the caps say no. */
  set(module: string, key: unknown, value: unknown): boolean {
    if (!MODULE_RE.test(module) || typeof key !== 'string' || !STORE_KEY_RE.test(key)) return false;
    if (value !== undefined && !plain(value)) return false;
    const old = this.data.get(module) ?? {};
    const next: Record<string, unknown> = { ...old };
    if (value === undefined || value === null) delete next[key];
    else next[key] = structuredClone(value);
    if (Object.keys(next).length > STORE_KEYS) return false;
    const n = JSON.stringify(next).length;
    const before = this.bytes.get(module) ?? 0;
    if (n > STORE_MODULE_BYTES || this.total - before + n > STORE_UNIVERSE_BYTES) return false;
    this.data.set(module, next);
    this.bytes.set(module, n);
    this.total += n - before;
    this.dirty.add(module);
    return true;
  }

  /** The files of the stores changed since the last save, and forgets they changed. */
  takeChanged(): FileMap {
    const out: FileMap = {};
    for (const m of this.dirty) out[storePath(m)] = JSON.stringify(this.data.get(m) ?? {}, null, 1) + '\n';
    this.dirty.clear();
    return out;
  }

  /** Bytes held, for the caps. */
  size(module?: string): number {
    return module === undefined ? this.total : (this.bytes.get(module) ?? 0);
  }
}
