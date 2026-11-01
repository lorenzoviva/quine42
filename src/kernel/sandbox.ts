// Host side of the Lua sandbox (wasmoon = Lua 5.4 compiled to WebAssembly).
// The kernel talks to Lua only through the table returned by prelude.lua.

import { LuaFactory, LuaMultiReturn, LuaType, LuaTypeExtension, type Decoration, type LuaEngine, type LuaGlobal, type LuaThread } from 'wasmoon';
import prelude from './prelude.lua?raw';

/**
 * Functions the kernel exposes to Lua. snake_case because Lua calls them by these names.
 * Return `undefined` (never `null`) for "nothing": wasmoon probes results for `.then`.
 */
export interface Host {
  query(names: string): string;
  get(id: number, name: string): unknown;
  /** Replaces a component (not on the player's core components). Returns success. */
  set(id: number, name: string, data: unknown): boolean;
  spawn(components: unknown): number | undefined;
  destroy(id: number): void;
  first(name: string): number | undefined;
  held(action: string): boolean;
  /** z: the height of the feet (tiles, `pos.z`), the floor of a structure one is on (T53b). */
  free(x: number, y: number, r: number, z?: number): boolean;
  free_real(x: number, y: number, r: number, z?: number): boolean;
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
  speed_at(x: number, y: number): number;
  spawn_module(module: string, x: number, y: number): number | undefined;
  player_id(): number;
  player_pos(): { x: number; y: number };
  nearest(x: number, y: number, r: number, tag?: string): number | undefined;
  has_tag(id: number, tag: string): boolean;
  break_entity(id: number): void;
  say(text: string): void;
  speak(id: number, text: string): void;
  inv_add(id: number, item: string, n: number): number;
  inv_remove(id: number, item: string, n: number): number;
  inv_count(id: number, item: string): number;
  inv_equipped(id: number): string | undefined;
  item_find(name: string): string | undefined;
  /** A copy of an item definition (name, category, weight, tags, effects). */
  item_def(id: string): unknown;
  /** A number of an item's bonus (difesa, velocita…), 0 if none. */
  item_bonus(id: string, name: string): number;
  /** The item in a slot of a module's panel, or undefined. */
  slot_get(panel: string, slot: string): string | undefined;
  /** Changes the tile at a carpet cell (persisted with the place). Returns success. */
  set_tile(x: number, y: number, code: string): boolean;
  /** Opens a container for the player (the container panel). */
  open(id: number): boolean;
  /** Gives an entity an empty container filled from a loot table on first opening. */
  make_container(id: number, size: number, loot: string): boolean;
}

interface KernelLua {
  reset(): void;
  load_module(id: string, src: string, chunkname: string): string | null;
  unload_module(id: string): void;
  seed(n: number): void;
  has(id: string, fn: string): boolean;
  run(id: string, fn: string, a?: unknown, b?: unknown, c?: unknown, d?: unknown): unknown;
  check(src: string, chunkname: string): string | null;
  rune_kind(src: string): string;
  set_line(key: string, src: string): string | null;
  remove_line(key: string): void;
  run_line(key: string, lock?: boolean): string | null;
  eval(src: string): string | null;
}

/** How deep a Lua table given to the kernel is read: what is deeper does not arrive. */
const MAX_TABLE_DEPTH = 64;

/** A JS object as Lua sees it: its own data fields and nothing else (no prototype, no method, no call). */
function visible(self: object, key: string | number): boolean {
  if (!Object.prototype.hasOwnProperty.call(self, key)) return false;
  const t = typeof (self as Record<string, unknown>)[key];
  return t !== 'function' && t !== 'symbol' && t !== 'bigint';
}

function fieldOf(self: object, key: unknown): unknown {
  const k = typeof key === 'number' ? key - 1 : key;
  if ((typeof k !== 'string' && typeof k !== 'number') || !visible(self, k)) return undefined;
  return (self as Record<string, unknown>)[k] ?? undefined;
}

interface Reading {
  done: Map<number, unknown>;
  open: Set<number>;
  depth: number;
}

/**
 * The only crossing between JS and Lua once the prelude has loaded (ADR-0099). It replaces wasmoon's proxy, whose metatable
 * gives Lua prototypes, methods and calls: a JS object becomes a view of its own data fields; a Lua table becomes plain data,
 * without functions, without the names of `Object.prototype`, without cycles and with a bounded depth, so no Lua function ever
 * runs out of `guarded`.
 */
class Crossing extends LuaTypeExtension<unknown> {
  private gc: number;

  constructor(global: LuaGlobal) {
    super(global, 'quine_view');
    const lua = global.lua;
    this.gc = lua.module.addFunction((L: number) => {
      const ud = lua.luaL_checkudata(L, 1, this.name);
      lua.unref(lua.module.getValue(ud, '*'));
      return 0;
    }, 'ii');
    if (lua.luaL_newmetatable(global.address, this.name)) {
      const at = lua.lua_gettop(global.address);
      const field = (name: string, fn: (...args: any[]) => unknown) => {
        global.pushValue(fn);
        lua.lua_setfield(global.address, at, name);
      };
      lua.lua_pushstring(global.address, 'protected metatable');
      lua.lua_setfield(global.address, at, '__metatable');
      lua.lua_pushcclosure(global.address, this.gc, 0);
      lua.lua_setfield(global.address, at, '__gc');
      field('__index', fieldOf);
      field('__newindex', (self: Record<string, unknown>, key: unknown, value: unknown) => {
        const k = typeof key === 'number' ? key - 1 : key;
        if ((typeof k !== 'string' && typeof k !== 'number') || value === undefined) return;
        // What is not its own comes from the prototype chain: never written, or written through (`__proto__`).
        if (k in self && !Object.prototype.hasOwnProperty.call(self, k)) return;
        try {
          self[k] = value;
        } catch {
          // A frozen object stays as it is.
        }
      });
      field('__tostring', (self: object) => (Array.isArray(self) ? self.filter((x) => typeof x !== 'object' && typeof x !== 'function').join(',') : '[object Object]'));
      field('__len', (self: object) => {
        const n = fieldOf(self, 'length');
        return typeof n === 'number' ? n : 0;
      });
      field('__pairs', (self: object) => {
        const keys = Object.getOwnPropertyNames(self).filter((k) => visible(self, k));
        let i = 0;
        const next = () => {
          const k = keys[i++];
          return LuaMultiReturn.of(k, k === undefined ? undefined : (self as Record<string, unknown>)[k] ?? undefined);
        };
        return LuaMultiReturn.of(next, self);
      });
      field('__eq', (self: unknown, other: unknown) => self === other);
    }
    lua.lua_pop(global.address, 1);
  }

  isType(_thread: LuaThread, _index: number, type: LuaType): boolean {
    return type === LuaType.Table || type === LuaType.Function || type === LuaType.Userdata;
  }

  pushValue(thread: LuaThread, value: Decoration<unknown>, userdata?: unknown): boolean {
    const target = value.target;
    if (typeof target !== 'object' || target === null) return false;
    return super.pushValue(thread, value, userdata);
  }

  getValue(thread: LuaThread, index: number, reading?: unknown): unknown {
    const lua = thread.lua;
    const type = lua.lua_type(thread.address, index);
    if (type === LuaType.Table) return this.readTable(thread, index, (reading as Reading) ?? { done: new Map(), open: new Set(), depth: 0 });
    if (type !== LuaType.Userdata) return undefined;
    if (lua.luaL_testudata(thread.address, index, this.name)) return super.getValue(thread, index);
    // An error wasmoon itself raised: only its text; any other userdata means nothing here.
    const inner = lua.luaL_testudata(thread.address, index, 'js_error') ? lua.getRef(lua.module.getValue(lua.lua_touserdata(thread.address, index), '*')) : undefined;
    return inner instanceof Error ? inner.message : undefined;
  }

  close(): void {
    this.thread.lua.module.removeFunction(this.gc);
  }

  private keyAt(thread: LuaThread): string | undefined {
    const t = thread.lua.lua_type(thread.address, -2);
    return t === LuaType.String || t === LuaType.Number || t === LuaType.Boolean ? thread.indexToString(-2) : undefined;
  }

  private readTable(thread: LuaThread, index: number, reading: Reading): unknown {
    const lua = thread.lua;
    const id = lua.lua_topointer(thread.address, index) as number;
    if (reading.done.has(id)) return reading.done.get(id);
    // Every level holds a key and a value on the Lua stack, which C code has to ask for.
    if (reading.open.has(id) || reading.depth >= MAX_TABLE_DEPTH || !lua.lua_checkstack(thread.address, 4)) return undefined;
    reading.open.add(id);
    reading.depth++;
    const keys: (string | undefined)[] = [];
    lua.lua_pushnil(thread.address);
    while (lua.lua_next(thread.address, index)) {
      keys.push(this.keyAt(thread));
      thread.pop();
    }
    const list = keys.length > 0 && keys.every((k, i) => k === String(i + 1));
    const out: unknown = list ? [] : {};
    lua.lua_pushnil(thread.address);
    while (lua.lua_next(thread.address, index)) {
      const key = this.keyAt(thread);
      const value = thread.getValue(-1, undefined, reading);
      if (list) (out as unknown[]).push(value);
      else if (key !== undefined && value !== undefined && !(key in Object.prototype)) (out as Record<string, unknown>)[key] = value;
      thread.pop();
    }
    reading.depth--;
    reading.open.delete(id);
    reading.done.set(id, out);
    return out;
  }
}

/** What Lua holds of the Host: its functions, each giving only data back and raising only text. */
function hostFunctions(host: Host): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const name of Object.keys(host)) {
    out[name] = (...args: unknown[]) => {
      let r: unknown;
      try {
        r = (host as unknown as Record<string, (...a: unknown[]) => unknown>)[name](...args);
      } catch (e) {
        throw String((e as Error)?.message ?? e);
      }
      return r === null || typeof r === 'function' ? undefined : r;
    };
  }
  return out;
}

/** A VM of its own: wasm instance, Lua state, the prelude, the crossing. */
async function openVm(host: Host, wasmUri?: string): Promise<{ engine: LuaEngine; K: KernelLua }> {
  const factory = new LuaFactory(wasmUri);
  const engine = await factory.createEngine({ openStandardLibs: true, injectObjects: false, enableProxy: false });
  engine.global.set('__host', hostFunctions(host));
  // K's functions become JS here, before the crossing refuses Lua functions for good.
  const K = engine.doStringSync(prelude) as KernelLua;
  engine.global.registerTypeExtension(10, new Crossing(engine.global));
  return { engine, K };
}

/** The world a module not yet approved loads in: nothing it does reaches anything. */
function emptyHost(): Host {
  return {
    query: () => '',
    get: () => undefined,
    set: () => false,
    spawn: () => undefined,
    destroy: () => {},
    first: () => undefined,
    held: () => false,
    free: () => true,
    free_real: () => true,
    tile: () => '',
    player_get: () => 0,
    player_set: () => undefined,
    carpet: () => ({ strength: 1, rate: 6, active: true, ox: 0, oy: 0 }),
    time: () => 0,
    log: () => {},
    emit: () => {},
    describe: () => '',
    fault: () => {},
    speed_at: () => 1,
    spawn_module: () => undefined,
    player_id: () => 0,
    player_pos: () => ({ x: 0, y: 0 }),
    nearest: () => undefined,
    has_tag: () => false,
    break_entity: () => {},
    say: () => {},
    speak: () => {},
    inv_add: () => 0,
    inv_remove: () => 0,
    inv_count: () => 0,
    inv_equipped: () => undefined,
    item_find: () => undefined,
    item_def: () => undefined,
    item_bonus: () => 0,
    slot_get: () => undefined,
    set_tile: () => false,
    open: () => false,
    make_container: () => false,
  };
}

export class Sandbox {
  private constructor(
    private engine: LuaEngine,
    private K: KernelLua,
    private probeVm: { engine: LuaEngine; K: KernelLua },
  ) {}

  static async create(host: Host, wasmUri?: string): Promise<Sandbox> {
    const [live, probe] = await Promise.all([openVm(host, wasmUri), openVm(emptyHost(), wasmUri)]);
    return new Sandbox(live.engine, live.K, probe);
  }

  /** Dry load of a module not yet approved (V-008): in a VM of its own, wiped before each one, with a Host that does nothing. */
  probe(src: string, chunkname: string): string | null {
    const { K } = this.probeVm;
    K.reset();
    return K.load_module('prova', src, chunkname) ?? null;
  }

  /** Fresh universe environment: clears modules, rune lines and reassigned bindings. */
  reset(): void {
    this.K.reset();
  }

  loadModule(id: string, src: string, chunkname = id): string | null {
    return this.K.load_module(id, src, chunkname) ?? null;
  }

  /** Reseeds math.random of universe code (T35): the same seed, the same draws, on every machine. */
  seed(n: number): void {
    this.K.seed(n >>> 0);
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

  /** Runs a rune line; `lock`: its writes to the bindings (x y speed carpet time) are ignored (T37). */
  runLine(key: string, lock = false): string | null {
    return this.K.run_line(key, lock) ?? null;
  }

  eval(src: string): string | null {
    return this.K.eval(src) ?? null;
  }

  close(): void {
    this.engine.global.close();
    this.probeVm.engine.global.close();
  }
}
