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
  /** Whether an action is held: by the wanderer acting, or by the wanderer whose body is `id` (T263, ADR-0139). */
  held(action: string, id?: number): boolean;
  /** Every wanderer in this kernel: their body, who they are, where they are in the world (T263, ADR-0139). */
  wanderers(): unknown;
  /** The next point of the way from (x, y) to (tx, ty) on the tiles of the places loaded (T245b, ADR-0140), for a body of half-size r (T299), or undefined. */
  path(x: number, y: number, tx: number, ty: number, r?: number): { x: number; y: number } | undefined;
  /** An individual uses a thing as the wanderer does with «Usa» (T245c, ADR-0141): its `on_act`, with the individual as user. The text, or undefined. */
  act(user: number, target: number, action?: string): string | undefined;
  /** The next step of the venture an individual works at (T245d, ADR-0147): `{does, x, y, …}`, or undefined. */
  venture(id: number): unknown;
  /** Brings to the venture nearby what `id` carries (an individual's `load`, a wanderer's bag): how many were taken. */
  venture_bring(id: number, item?: string | null): number;
  /** The centre of the nearest tile with this code within r of (x, y) (T245b), or undefined. */
  find_tile(code: string, x: number, y: number, r: number): { x: number; y: number } | undefined;
  /** What the module running keeps under a key in its lasting store (T245a, ADR-0138), or undefined. */
  store_get(key: string): unknown;
  /** Keeps a value in the store of the module running (nil takes it away); false when the key, the value or the caps say no. */
  store_set(key: string, value: unknown): boolean;
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
  native_pattern(limit: number): void;
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
  tick_begin(): void;
  tick_end(): number;
  unwind(open: number): void;
}

// The memory of universe code (ADR-0105), enforced by the allocator, where no way of making a value escapes.
/** What the VM may hold, the kernel's part included. */
const MEMORY_MAX = 64 * 1024 * 1024;
/** The longest string, however it is made (`..`, `rep`, `concat`, what the Host gives). */
const MAX_STRING = 1024 * 1024;
/** Bytes one call may allocate in all: copying is work too, and a loop on `s .. 'x'` costs one instruction per copy. */
const CHURN_MAX = 256 * 1024 * 1024;
/** Lua's tag for a new string, passed as the old size when a new object is allocated. */
const LUA_TSTRING = 4;
/** What a string takes beyond its characters. */
const STRING_HEADER = 32;

/**
 * Lua's allocator, measured. Limits hold only while universe code runs, inside its pcall: there a refused allocation is an
 * ordinary error, outside it (the kernel pushing arguments from JS) Lua would panic and the wasm instance would die.
 */
class Meter {
  on = false;
  depth = 0;
  private used = 0;
  private churn = 0;
  private pointer = 0;

  install(global: LuaGlobal): void {
    const module = global.lua.module;
    this.pointer = module.addFunction((_ud: number, ptr: number, old: number, size: number) => {
      if (size === 0) {
        if (ptr) {
          this.used -= old;
          module._free(ptr);
        }
        return 0;
      }
      const grow = ptr ? size - old : size;
      if (this.on && grow > 0) {
        if (this.used + grow > MEMORY_MAX || this.churn + grow > CHURN_MAX || (!ptr && old === LUA_TSTRING && size > MAX_STRING + STRING_HEADER)) return 0;
        this.churn += grow;
      }
      const r = module._realloc(ptr, size);
      if (r) this.used += grow;
      return r;
    }, 'iiiii');
    global.lua.lua_setallocf(global.address, this.pointer, null);
  }

  /** What Lua calls around universe code; it gives back the bytes allocated when the outermost call ends. */
  toggle = (on: boolean): number => {
    if (on) {
      if (this.depth++ === 0) this.churn = 0;
      this.on = true;
      return 0;
    }
    this.on = false;
    return --this.depth === 0 ? this.churn : 0;
  };

  close(global: LuaGlobal): void {
    const module = global.lua.module;
    global.close();
    if (this.pointer) module.removeFunction(this.pointer);
  }
}

/** How deep a Lua table given to the kernel is read: what is deeper does not arrive. */
const MAX_TABLE_DEPTH = 64;
/**
 * How many keys one table given to the kernel may hold when written out in full. A table shared at every level is small in Lua and 2^64 when anyone
 * walks it (every JSON.stringify of the kernel): what is past this does not arrive (V-027).
 */
const MAX_TABLE_SIZE = 1 << 20;

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
  done: Map<number, { value: unknown; size: number }>;
  open: Set<number>;
  depth: number;
  /** The keys read so far, a table met twice counted twice. */
  size: number;
}

/**
 * The only crossing between JS and Lua once the prelude has loaded (ADR-0101). It replaces wasmoon's proxy, whose metatable
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
        // A list grows by one at a time: `length` or an index far ahead is a list of billions of holes for whoever reads it next (V-027).
        if (Array.isArray(self)) {
          const at = Number(k);
          if (!Number.isInteger(at) || at < 0 || at > self.length) return;
        }
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
    if (type === LuaType.Table) return this.readTable(thread, index, (reading as Reading) ?? { done: new Map(), open: new Set(), depth: 0, size: 0 });
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
    const met = reading.done.get(id);
    if (met) {
      if (reading.size + met.size > MAX_TABLE_SIZE) return undefined;
      reading.size += met.size;
      return met.value;
    }
    if (reading.size > MAX_TABLE_SIZE) return undefined;
    const from = reading.size;
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
      reading.size++;
      const value = thread.getValue(-1, undefined, reading);
      if (list) (out as unknown[]).push(value);
      else if (key !== undefined && value !== undefined && !(key in Object.prototype)) (out as Record<string, unknown>)[key] = value;
      thread.pop();
    }
    reading.depth--;
    reading.open.delete(id);
    reading.done.set(id, { value: out, size: reading.size - from });
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

interface Vm {
  engine: LuaEngine;
  K: KernelLua;
  meter: Meter;
}

/** A VM of its own: wasm instance, Lua state, the prelude, the crossing. */
async function openVm(host: Host, wasmUri?: string): Promise<Vm> {
  const factory = new LuaFactory(wasmUri);
  const engine = await factory.createEngine({ openStandardLibs: true, injectObjects: false, enableProxy: false });
  const meter = new Meter();
  meter.install(engine.global);
  engine.global.set('__meter', meter.toggle);
  engine.global.set('__host', hostFunctions(host));
  // K's functions become JS here, before the crossing refuses Lua functions for good.
  const K = engine.doStringSync(prelude) as KernelLua;
  engine.global.registerTypeExtension(10, new Crossing(engine.global));
  return { engine, K, meter };
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
    wanderers: () => [],
    path: () => undefined,
    find_tile: () => undefined,
    act: () => undefined,
    venture: () => undefined,
    venture_bring: () => 0,
    store_get: () => undefined,
    store_set: () => false,
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
    private meter: Meter,
    private host: Host,
    private probeVm: Vm,
  ) {}

  static async create(host: Host, wasmUri?: string): Promise<Sandbox> {
    const [live, probe] = await Promise.all([openVm(host, wasmUri), openVm(emptyHost(), wasmUri)]);
    return new Sandbox(live.engine, live.K, live.meter, host, probe);
  }

  /**
   * From JS into Lua: no limit on what the kernel pushes (see Meter), and the floor under a VM that cannot go on: what comes
   * out of it as an exception is a fault, never an exception in the tick.
   */
  private enter<T>(key: string, fallback: T, call: () => T): T {
    const { on, depth } = this.meter;
    this.meter.on = false;
    try {
      return call();
    } catch (e) {
      this.meter.depth = depth;
      try {
        this.K.unwind(depth);
      } catch {
        // The VM is gone: each call ends here until a restart.
      }
      this.host.fault(key, String((e as Error)?.message ?? e).slice(0, 400));
      return fallback;
    } finally {
      this.meter.on = on;
    }
  }

  /** Dry load of a module not yet approved (V-008): in a VM of its own, wiped before each one, with a Host that does nothing. */
  probe(src: string, chunkname: string): string | null {
    const { K } = this.probeVm;
    K.reset();
    return K.load_module('prova', src, chunkname) ?? null;
  }

  /** Fresh universe environment: clears modules, rune lines and reassigned bindings. */
  reset(): void {
    this.enter('sandbox:reset', undefined, () => this.K.reset());
  }

  loadModule(id: string, src: string, chunkname = id): string | null {
    return this.enter(`module:${id}:load`, 'la sandbox non risponde', () => this.K.load_module(id, src, chunkname) ?? null);
  }

  /** Reseeds math.random of universe code (T35): the same seed, the same draws, on every machine. */
  seed(n: number): void {
    this.enter('sandbox:seed', undefined, () => this.K.seed(n >>> 0));
  }

  unloadModule(id: string): void {
    this.enter('sandbox:unload', undefined, () => this.K.unload_module(id));
  }

  has(id: string, fn: string): boolean {
    return this.enter('sandbox:has', false, () => !!this.K.has(id, fn));
  }

  run(id: string, fn: string, ...args: unknown[]): unknown {
    return this.enter(`module:${id}:${fn}`, undefined, () => this.K.run(id, fn, ...args));
  }

  /** The tick's budget begins (ADR-0105): universe code from here to tickEnd shares it. */
  tickBegin(): void {
    this.enter('sandbox:tick', undefined, () => this.K.tick_begin());
  }

  /** The tick's budget ends: how many calls did not run because it was gone. */
  tickEnd(): number {
    return this.enter('sandbox:tick', 0, () => this.K.tick_end());
  }

  /** Syntax check of a Lua chunk without running it. */
  check(src: string, chunkname = 'check'): string | null {
    return this.enter('sandbox:check', 'la sandbox non risponde', () => this.K.check(src, chunkname) ?? null);
  }

  runeKind(src: string): { kind: 'expr' | 'stmt' } | { error: string } {
    const r = this.enter('sandbox:rune', 'error: la sandbox non risponde', () => this.K.rune_kind(src));
    if (r === 'expr' || r === 'stmt') return { kind: r };
    return { error: r.replace(/^error: /, '') };
  }

  setLine(key: string, src: string): string | null {
    return this.enter(`rune:${key}`, 'la sandbox non risponde', () => this.K.set_line(key, src) ?? null);
  }

  removeLine(key: string): void {
    this.enter(`rune:${key}`, undefined, () => this.K.remove_line(key));
  }

  /** Runs a rune line; `lock`: its writes to the bindings (x y speed carpet time) are ignored (T37). */
  runLine(key: string, lock = false): string | null {
    return this.enter(`rune:${key}`, null, () => this.K.run_line(key, lock) ?? null);
  }

  eval(src: string): string | null {
    return this.enter('sandbox:eval', null, () => this.K.eval(src) ?? null);
  }

  close(): void {
    this.meter.close(this.engine.global);
    this.probeVm.meter.close(this.probeVm.engine.global);
  }
}
