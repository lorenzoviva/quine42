// Host side of the Lua sandbox (wasmoon = Lua 5.4 compiled to WebAssembly).
// The kernel talks to Lua only through the table returned by prelude.lua.

import { LuaFactory, type LuaEngine } from 'wasmoon';
import prelude from './prelude.lua?raw';

/**
 * Functions the kernel exposes to Lua. snake_case because Lua calls them by these names.
 * Return `undefined` (never `null`) for "nothing": wasmoon probes results for `.then`.
 */
export interface Host {
  query(names: string): string;
  get(id: number, name: string): unknown;
  spawn(components: unknown): number | undefined;
  destroy(id: number): void;
  first(name: string): number | undefined;
  held(action: string): boolean;
  free(x: number, y: number, r: number): boolean;
  free_real(x: number, y: number, r: number): boolean;
  tile(x: number, y: number): string;
  player_get(key: string): unknown;
  /** Returns an error message to raise in Lua, or undefined. */
  player_set(key: string, value: unknown): string | undefined;
  carpet(): unknown;
  time(): number;
  log(msg: string): void;
  emit(name: string, data: unknown): void;
  describe(value: unknown): string;
  fault(key: string, message: string): void;
}

interface KernelLua {
  reset(): void;
  load_module(id: string, src: string, chunkname: string): string | null;
  unload_module(id: string): void;
  has(id: string, fn: string): boolean;
  run(id: string, fn: string, a?: unknown, b?: unknown, c?: unknown, d?: unknown): unknown;
  check(src: string, chunkname: string): string | null;
  rune_kind(src: string): string;
  set_line(key: string, src: string): string | null;
  remove_line(key: string): void;
  run_line(key: string): string | null;
  eval(src: string): string | null;
}

export class Sandbox {
  private constructor(
    private engine: LuaEngine,
    private K: KernelLua,
  ) {}

  static async create(host: Host, wasmUri?: string): Promise<Sandbox> {
    const factory = new LuaFactory(wasmUri);
    const engine = await factory.createEngine({ openStandardLibs: true, injectObjects: false });
    engine.global.set('__host', host);
    const K = engine.doStringSync(prelude) as KernelLua;
    return new Sandbox(engine, K);
  }

  /** Fresh universe environment: clears modules, rune lines and reassigned bindings. */
  reset(): void {
    this.K.reset();
  }

  loadModule(id: string, src: string, chunkname = id): string | null {
    return this.K.load_module(id, src, chunkname) ?? null;
  }

  unloadModule(id: string): void {
    this.K.unload_module(id);
  }

  has(id: string, fn: string): boolean {
    return !!this.K.has(id, fn);
  }

  run(id: string, fn: string, ...args: unknown[]): unknown {
    return this.K.run(id, fn, ...args);
  }

  /** Syntax check of a Lua chunk without running it. */
  check(src: string, chunkname = 'check'): string | null {
    return this.K.check(src, chunkname) ?? null;
  }

  runeKind(src: string): { kind: 'expr' | 'stmt' } | { error: string } {
    const r = this.K.rune_kind(src);
    if (r === 'expr' || r === 'stmt') return { kind: r };
    return { error: r.replace(/^error: /, '') };
  }

  setLine(key: string, src: string): string | null {
    return this.K.set_line(key, src) ?? null;
  }

  removeLine(key: string): void {
    this.K.remove_line(key);
  }

  runLine(key: string): string | null {
    return this.K.run_line(key) ?? null;
  }

  eval(src: string): string | null {
    return this.K.eval(src) ?? null;
  }

  close(): void {
    this.engine.global.close();
  }
}
