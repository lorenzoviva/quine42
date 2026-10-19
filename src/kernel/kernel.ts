// The kernel: the floor of the universe. Owns the ECS state, the chunks, the sandbox, versioning
// and the AI gateway. Universe code (Lua) can break everything above this floor, never the floor:
// a broken universe is always recoverable by rollback.

import { World, type Id } from './ecs';
import { EventBus } from './events';
import { Faults } from './faults';
import { Sandbox, type Host } from './sandbox';
import { Validator } from './validator';
import { Repo, type KeyValueStore } from './repo';
import { Corona, type CoronaCell } from './corona';
import { AIGateway, type AIProvider } from './gateway/gateway';
import { Input } from './input';
import { discoverModules, readConfig } from './universe';
import { cellIndex, extractLines, tokenize, type RuneComp, type RuneLine } from './runes';
import { hash32, hashStr, Rng } from './rng';
import type { ChunkContent, FileMap, ModuleEntry, Place, RuneFragment, TileDef, UniverseConfig } from './types';

export interface Chunk {
  cx: number;
  cy: number;
  key: string;
  tiles: string;
  /** Bumped whenever tiles are regenerated (renderer cache key). */
  version: number;
  content?: ChunkContent;
}

export interface LineState {
  line: RuneLine;
  src: string;
  compiled: boolean;
  /** Expression without calls: no effects, so it is re-evaluated only every few ticks. */
  pure: boolean;
  result: string | null;
  error: string | null;
}

export interface LogEntry {
  time: number;
  source: string;
  message: string;
}

export type HoverInfo =
  | { kind: 'rune'; token: string; doc?: string; symbol: string | null; line: LineState | undefined; source: 'gen' | 'player' }
  | { kind: 'entity'; name: string; description: string }
  | { kind: 'tile'; name: string }
  | { kind: 'code'; cell: CoronaCell }
  | { kind: 'player' };

export interface KernelOptions {
  files: FileMap;
  store: KeyValueStore;
  provider: AIProvider;
  wasmUri?: string;
}

/** Documentation of the live symbols runes can bind to. */
export const SYMBOL_DOCS: Record<string, string> = {
  x: 'posizione X globale del giocatore (non quella del tappeto)',
  y: 'posizione Y globale del giocatore (non quella del tappeto)',
  speed: 'velocità del giocatore, in celle al secondo',
  carpet: 'il tappeto che ti riporta al centro',
  time: 'secondi trascorsi dalla nascita del mondo',
  strength: 'campo del tappeto: quanto ti riporta indietro (1 = tutto)',
  rate: 'campo del tappeto: quanto in fretta ti riporta indietro',
  active: 'campo del tappeto: se sta girando',
  ox: 'campo del tappeto: scorrimento orizzontale accumulato',
  oy: 'campo del tappeto: scorrimento verticale accumulato',
};

const VOID_TILE: TileDef = { name: 'vuoto', glyph: '?', color: '#ff3366', bg: '#16040a', solid: false };
const FALLBACK_PLAYER = {
  player: { speed: 6, facing: 'down' },
  hand: { tokens: [] as string[], sel: 0 },
  glyph: { ch: '@', color: '#ffffff' },
  body: { r: 0.3, solid: false },
};

const clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

export class Kernel {
  readonly ecs = new World();
  readonly bus = new EventBus();
  readonly faults = new Faults();
  readonly input = new Input();
  readonly gateway: AIGateway;
  sandbox!: Sandbox;
  validator!: Validator;
  repo!: Repo;
  corona!: Corona;

  config!: UniverseConfig;
  files: FileMap = {};
  modules = new Map<string, ModuleEntry>();
  systems: ModuleEntry[] = [];
  terrain?: ModuleEntry;
  palette: Record<string, TileDef> = {};
  fragments: RuneFragment[] = [];

  readonly chunks = new Map<string, Chunk>();
  readonly lines = new Map<string, LineState>();
  runeCells = new Map<string, Id>();
  /** Entity cells blocked by solid bodies, rebuilt every tick. */
  private solidCells = new Set<string>();
  private runesDirty = true;
  private consumed = new Set<string>();
  private contentCache = new Map<string, ChunkContent>();
  private pending = new Set<string>();
  private loaded = new Map<string, string>();
  private singletons = new Map<string, Id>();
  private faultFlag: string | null = null;
  /** Terrain generation is Lua and costs a few ms: at most this many new chunks per tick. */
  static CHUNKS_PER_TICK = 1;
  private genBudget = 64;
  private tickCount = 0;
  private lastGood = { px: 0, py: 0, ox: 0, oy: 0 };

  playerId: Id = 0;
  time = 0;
  zone: 'sim' | 'corona' = 'sim';
  exitedOnce = false;
  /** Size of the visible area in cells, set by the renderer. */
  view = { w: 64, h: 40 };
  readonly logs: LogEntry[] = [];

  private constructor(opts: KernelOptions) {
    this.gateway = new AIGateway(opts.provider);
  }

  static async boot(opts: KernelOptions): Promise<Kernel> {
    const k = new Kernel(opts);
    k.sandbox = await Sandbox.create(k.makeHost(), opts.wasmUri);
    k.validator = new Validator(k.sandbox);
    const name = readConfig(opts.files).config.name;
    const { repo, synced } = Repo.open(name, opts.files, opts.store);
    k.repo = repo;
    k.faults.onRaise = (f, isNew) => {
      if (isNew) k.log('fault', `${f.key}: ${f.message}`);
      k.bus.emit('fault', { fault: f, isNew });
    };
    k.applyFiles(repo.working, { reset: true });
    k.log('kernel', `universo «${name}» avviato su commit ${repo.head().id} (${repo.head().message})${synced ? ' — sincronizzato dal disco' : ''}`);
    return k;
  }

  // --- Host: the only surface Lua can touch ---------------------------------------------------

  private makeHost(): Host {
    return {
      query: (names) => this.ecs.query(...names.split(',').map((s) => s.trim()).filter(Boolean)).join(','),
      get: (id, name) => this.ecs.get(id, name) ?? undefined,
      spawn: (c) => this.spawnFromLua(c),
      destroy: (id) => {
        if (id === this.playerId || [...this.singletons.values()].includes(id)) return;
        this.ecs.destroy(id);
        this.runesDirty = true;
      },
      first: (name) => this.ecs.query(name)[0],
      held: (a) => this.input.isHeld(a),
      free: (x, y, r) => this.free(x, y, r),
      free_real: (x, y, r) => this.freeReal(x, y, r),
      tile: (x, y) => this.tileAt(Math.floor(x), Math.floor(y)) ?? '',
      player_get: (key) => (key === 'x' || key === 'y' ? this.playerPos()[key] : (this.playerComp() as any)[key]),
      player_set: (key, v) => {
        if (typeof v !== 'number' || !Number.isFinite(v)) return `${key} deve essere un numero finito (ricevuto ${v === null ? 'nil' : typeof v})`;
        if (key === 'x' || key === 'y') this.playerPos()[key] = v;
        else (this.playerComp() as any)[key] = v;
        return undefined;
      },
      carpet: () => this.carpet(),
      time: () => this.time,
      log: (msg) => this.log('lua', msg),
      emit: (name, data) => this.bus.emit(`lua:${name}`, data),
      describe: (v) => this.describe(v),
      fault: (key, msg) => {
        this.faultFlag = key;
        this.faults.raise(key, msg);
      },
    };
  }

  private describe(v: unknown): string {
    if (v === this.carpet()) {
      const c = this.carpet()!;
      return `carpet{strength=${c.strength}, rate=${c.rate}, active=${c.active}}`;
    }
    if (v && typeof v === 'object') {
      const parts = Object.entries(v)
        .filter(([, x]) => typeof x !== 'object')
        .slice(0, 5)
        .map(([k, x]) => `${k}=${typeof x === 'number' ? Math.round(x * 100) / 100 : x}`);
      return `{${parts.join(', ')}}`;
    }
    return String(v);
  }

  private spawnFromLua(c: unknown): Id | undefined {
    if (!c || typeof c !== 'object') return undefined;
    const comps = c as Record<string, any>;
    if (comps.pos && !(Number.isFinite(comps.pos.x) && Number.isFinite(comps.pos.y))) return undefined;
    if (comps.rune) this.runesDirty = true;
    return this.ecs.spawn(comps);
  }

  /** Runs a module function; faults raised during the call are kept, otherwise cleared. */
  runModule(id: string, fn: string, ...args: unknown[]): { value: unknown; failed: boolean } {
    const key = `module:${id}:${fn}`;
    this.faultFlag = null;
    const value = this.sandbox.run(id, fn, ...args);
    const failed = this.faultFlag === key;
    if (!failed) this.faults.clear(key);
    return { value, failed };
  }

  // --- Accessors -----------------------------------------------------------------------------

  carpet(): { strength: number; rate: number; active: boolean; ox: number; oy: number } | undefined {
    const id = this.singletons.get('core.carpet') ?? this.ecs.query('carpet')[0];
    return id ? this.ecs.get(id, 'carpet') : undefined;
  }

  offset(): { ox: number; oy: number } {
    const c = this.carpet();
    const ox = Number(c?.ox);
    const oy = Number(c?.oy);
    return { ox: Number.isFinite(ox) ? ox : this.lastGood.ox, oy: Number.isFinite(oy) ? oy : this.lastGood.oy };
  }

  playerPos(): { x: number; y: number } {
    return this.ecs.get(this.playerId, 'pos');
  }

  playerComp(): { speed: number; facing: string } {
    return this.ecs.get(this.playerId, 'player');
  }

  hand(): { tokens: string[]; sel: number } {
    return this.ecs.get(this.playerId, 'hand');
  }

  /** Player position on the carpet (where the simulation thinks you are). */
  playerCarpet(): { x: number; y: number } {
    const p = this.playerPos();
    const { ox, oy } = this.offset();
    return { x: p.x + ox, y: p.y + oy };
  }

  log(source: string, message: string): void {
    const e = { time: Date.now(), source, message };
    this.logs.push(e);
    if (this.logs.length > 500) this.logs.shift();
    this.bus.emit('log', e);
  }

  message(text: string, tone: 'info' | 'warn' | 'good' = 'info'): void {
    this.bus.emit('ui:message', { text, tone });
  }

  // --- Universe loading & hot reload ----------------------------------------------------------

  /**
   * Loads a set of universe files. Without reset this is a hot reload: only changed modules are
   * recompiled, the ECS world is untouched and the next tick runs the new logic.
   */
  applyFiles(files: FileMap, opts: { reset?: boolean } = {}): void {
    const { config, error } = readConfig(files);
    if (error) this.faults.raise('universe:config', error);
    else this.faults.clear('universe:config');
    const radiusChanged = !this.config || this.config.circleRadius !== config.circleRadius;
    const sizeChanged = !this.config || this.config.chunkSize !== config.chunkSize || this.config.seed !== config.seed;
    this.config = config;
    if (radiusChanged) this.corona = new Corona(config.circleRadius);

    if (opts.reset) {
      this.sandbox.reset();
      this.loaded.clear();
      this.lines.clear();
      this.runesDirty = true;
    }

    const { modules, errors } = discoverModules(files, this.validator);
    this.faults.clearPrefix('manifest:');
    for (const e of errors) this.faults.raise(`manifest:${e.path}`, e.message);

    const ids = new Set(modules.map((m) => m.manifest.id));
    for (const id of this.loaded.keys()) {
      if (ids.has(id)) continue;
      this.sandbox.unloadModule(id);
      this.faults.clearPrefix(`module:${id}:`);
      this.loaded.delete(id);
      this.log('kernel', `modulo rimosso: ${id}`);
    }

    const changed = new Set<string>();
    for (const m of modules) {
      const id = m.manifest.id;
      const src = m.logicPath ? files[m.logicPath] : undefined;
      const sig = `${files[m.manifestPath]}\0${src ?? ''}`;
      if (this.loaded.get(id) === sig) continue;
      changed.add(id);
      this.loaded.set(id, sig);
      this.faults.clearPrefix(`module:${id}:`);
      if (src === undefined) {
        this.sandbox.unloadModule(id);
        continue;
      }
      const err = this.sandbox.loadModule(id, src, m.logicPath);
      if (err) this.faults.raise(`module:${id}:load`, err);
      if (!opts.reset) this.log('kernel', `ricaricato a caldo: ${id}${err ? ' (con errori)' : ''}`);
    }

    this.modules = new Map(modules.map((m) => [m.manifest.id, m]));
    this.systems = modules.filter((m) => m.manifest.kind === 'system').sort((a, b) => (a.manifest.order ?? 50) - (b.manifest.order ?? 50));
    this.terrain = modules.find((m) => m.manifest.kind === 'generator');
    this.palette = { '?': VOID_TILE, ...(this.terrain?.manifest.tiles ?? {}) };
    this.fragments = modules.flatMap((m) => m.manifest.fragments ?? []);

    this.ensureCoreEntities(opts.reset ?? false);
    for (const id of this.ecs.query('module', 'glyph')) {
      const modId = this.ecs.get(id, 'module').id;
      const app = this.modules.get(modId)?.manifest.appearance;
      if (app && changed.has(modId)) this.ecs.set(id, 'glyph', { ch: app.glyph, color: app.color });
    }

    const terrainChanged = !this.terrain || changed.has(this.terrain.manifest.id) || opts.reset || sizeChanged;
    if (sizeChanged) this.clearChunks();
    else if (terrainChanged) for (const ch of this.chunks.values()) this.regenerateTiles(ch);

    this.files = files;
    this.corona.build(files);
    this.bus.emit('universe:reloaded', { changed: [...changed] });
  }

  private ensureCoreEntities(reset: boolean): void {
    const playerMod = [...this.modules.values()].find((m) => m.manifest.kind === 'player');
    const defaults: Record<string, any> = clone(playerMod?.manifest.components ?? { player: FALLBACK_PLAYER.player, hand: FALLBACK_PLAYER.hand });
    if (!defaults.player) defaults.player = clone(FALLBACK_PLAYER.player);
    if (!defaults.hand) defaults.hand = clone(FALLBACK_PLAYER.hand);
    const app = playerMod?.manifest.appearance;
    const glyph = app ? { ch: app.glyph, color: app.color } : clone(FALLBACK_PLAYER.glyph);
    const body = { r: playerMod?.manifest.physics?.radius ?? 0.3, solid: false };

    if (!this.playerId || !this.ecs.alive.has(this.playerId)) {
      this.playerId = this.ecs.spawn({ ...defaults, pos: { x: 0, y: 0 }, glyph, body, module: { id: playerMod?.manifest.id ?? 'kernel.player' } });
    } else {
      this.ecs.set(this.playerId, 'glyph', glyph);
      if (reset) this.resetComponents(this.playerId, defaults, playerMod?.manifest.persist ?? []);
    }

    for (const m of this.modules.values()) {
      if (!m.manifest.singleton) continue;
      const existing = this.singletons.get(m.manifest.id);
      if (existing && this.ecs.alive.has(existing)) {
        if (reset) this.resetComponents(existing, clone(m.manifest.singleton), m.manifest.persist ?? []);
        else for (const [name, data] of Object.entries(m.manifest.singleton)) if (!this.ecs.has(existing, name)) this.ecs.set(existing, name, clone(data));
      } else {
        this.singletons.set(m.manifest.id, this.ecs.spawn({ ...clone(m.manifest.singleton), module: { id: m.manifest.id } }));
      }
    }
  }

  /** Restores components to manifest defaults, keeping the fields listed in `persist`. */
  private resetComponents(id: Id, defaults: Record<string, any>, persist: string[]): void {
    for (const [name, data] of Object.entries(defaults)) {
      const current = this.ecs.get(id, name);
      const next = clone(data);
      for (const p of persist) {
        const [c, field] = p.split('.');
        if (c === name && current && field in current) next[field] = current[field];
      }
      if (current && typeof current === 'object') {
        for (const k of Object.keys(current)) delete current[k];
        Object.assign(current, next);
      } else this.ecs.set(id, name, next);
    }
  }

  // --- Chunks -------------------------------------------------------------------------------

  private chunkKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  private genTiles(cx: number, cy: number): string {
    const S = this.config.chunkSize;
    const n = S * S;
    if (this.terrain) {
      const id = this.terrain.manifest.id;
      const { value, failed } = this.runModule(id, 'generate_chunk', cx, cy, this.config.seed, S);
      if (!failed) {
        if (typeof value === 'string' && value.length === n) return value;
        this.faults.raise(`module:${id}:generate_chunk`, `generate_chunk deve restituire una stringa di ${n} caratteri`);
      }
    }
    return '?'.repeat(n);
  }

  private regenerateTiles(ch: Chunk): void {
    ch.tiles = this.genTiles(ch.cx, ch.cy);
    ch.version++;
  }

  private ensureChunk(cx: number, cy: number): Chunk | undefined {
    const key = this.chunkKey(cx, cy);
    let ch = this.chunks.get(key);
    if (ch) return ch;
    if (this.genBudget <= 0) return undefined;
    this.genBudget--;
    ch = { cx, cy, key, tiles: this.genTiles(cx, cy), version: 0 };
    this.chunks.set(key, ch);
    this.spawnEntities(ch);
    const cached = this.contentCache.get(key);
    if (cached) this.applyContent(ch, cached);
    else void this.requestContent(ch);
    return ch;
  }

  private unloadChunk(ch: Chunk): void {
    for (const id of this.ecs.query('chunk')) {
      if (this.ecs.get(id, 'chunk').key !== ch.key) continue;
      if (this.ecs.has(id, 'rune')) this.runesDirty = true;
      this.ecs.destroy(id);
    }
    this.chunks.delete(ch.key);
  }

  private clearChunks(): void {
    for (const ch of [...this.chunks.values()]) this.unloadChunk(ch);
    this.contentCache.clear();
  }

  /** Loads the chunks needed to draw the visible part of the circle; unloads the far ones. */
  private updateChunks(): void {
    const S = this.config.chunkSize;
    const R = this.config.circleRadius;
    const p = this.playerPos();
    const { ox, oy } = this.offset();
    const x0 = Math.max(p.x - this.view.w / 2, -R) + ox;
    const x1 = Math.min(p.x + this.view.w / 2, R) + ox;
    const y0 = Math.max(p.y - this.view.h / 2, -R) + oy;
    const y1 = Math.min(p.y + this.view.h / 2, R) + oy;
    const want = new Set<string>();
    // The chunk under the player comes first (collisions); then the visible ones nearest to it.
    const pc = this.playerCarpet();
    const pcx = Math.floor(pc.x / S);
    const pcy = Math.floor(pc.y / S);
    this.genBudget = Math.max(this.genBudget, 1);
    this.ensureChunk(pcx, pcy);
    want.add(this.chunkKey(pcx, pcy));
    if (x0 <= x1 && y0 <= y1) {
      const cells: Array<[number, number]> = [];
      for (let cy = Math.floor(y0 / S) - 1; cy <= Math.floor(y1 / S) + 1; cy++)
        for (let cx = Math.floor(x0 / S) - 1; cx <= Math.floor(x1 / S) + 1; cx++) cells.push([cx, cy]);
      cells.sort((a, b) => Math.hypot(a[0] - pcx, a[1] - pcy) - Math.hypot(b[0] - pcx, b[1] - pcy));
      for (const [cx, cy] of cells) {
        want.add(this.chunkKey(cx, cy));
        this.ensureChunk(cx, cy);
      }
    }
    this.genBudget = Kernel.CHUNKS_PER_TICK;
    if (this.chunks.size > want.size + 24) {
      for (const ch of [...this.chunks.values()]) if (!want.has(ch.key)) this.unloadChunk(ch);
    }
  }

  private spawnEntities(ch: Chunk): void {
    const S = this.config.chunkSize;
    for (const m of this.modules.values()) {
      const rule = m.manifest.spawn;
      if (m.manifest.kind !== 'entity' || !rule) continue;
      const rng = new Rng(hash32(this.config.seed, ch.cx, ch.cy, hashStr(m.manifest.id)));
      for (let i = 0; i < rule.max; i++) {
        if (!rng.chance(rule.chance)) continue;
        const col = rng.int(S);
        const row = rng.int(S);
        const tile = ch.tiles[row * S + col];
        if (!rule.tiles.includes(tile) || this.palette[tile]?.solid) continue;
        const wx = ch.cx * S + col;
        const wy = ch.cy * S + row;
        if (Math.abs(wx) < 3 && Math.abs(wy) < 3) continue;
        this.spawnModuleEntity(m, wx + 0.5, wy + 0.5, ch.key);
      }
    }
  }

  spawnModuleEntity(m: ModuleEntry, x: number, y: number, chunkKey?: string): Id {
    const man = m.manifest;
    const comps: Record<string, any> = {
      ...clone(man.components ?? {}),
      pos: { x, y },
      module: { id: man.id },
      body: { r: man.physics?.radius ?? 0.35, solid: !!man.physics?.solid },
    };
    if (man.appearance) comps.glyph = { ch: man.appearance.glyph, color: man.appearance.color };
    if (man.interaction) comps.interact = { ...man.interaction, talks: 0 };
    if (chunkKey) comps.chunk = { key: chunkKey };
    const id = this.ecs.spawn(comps);
    if (this.sandbox.has(man.id, 'on_spawn')) this.runModule(man.id, 'on_spawn', id);
    return id;
  }

  /** Asks the AI for the chunk's place and runes; validates; discards and retries invalid answers. */
  private async requestContent(ch: Chunk): Promise<void> {
    if (this.pending.has(ch.key)) return;
    this.pending.add(ch.key);
    const S = this.config.chunkSize;
    const neighbors = [this.chunkKey(ch.cx - 1, ch.cy), this.chunkKey(ch.cx + 1, ch.cy), this.chunkKey(ch.cx, ch.cy - 1), this.chunkKey(ch.cx, ch.cy + 1)]
      .map((k) => this.contentCache.get(k)?.place.name)
      .filter((n): n is string => !!n);
    let content: ChunkContent | null = null;
    try {
      for (let attempt = 0; attempt < 3 && !content; attempt++) {
        let answer: ChunkContent;
        try {
          answer = await this.gateway.chunk({
            cx: ch.cx, cy: ch.cy, seed: this.config.seed, attempt, size: S, tiles: ch.tiles, palette: this.palette,
            catalog: this.fragments, theme: this.files[this.config.theme] ?? '', prompt: this.files['prompts/chunk.md'] ?? '', neighbors,
          });
        } catch (e) {
          this.gateway.record('chunk', `(${ch.key}) errore del provider: ${(e as Error).message}`, false);
          continue;
        }
        const errors = this.validator.validateChunkContent(answer, ch.tiles, S, this.palette);
        if (errors.length) {
          this.gateway.record('chunk', `(${ch.key}) scartato: ${errors[0]} → rigenero`, false);
          this.log('validator', `chunk ${ch.key} scartato: ${errors.join('; ')}`);
          continue;
        }
        content = answer;
        this.gateway.record('chunk', `(${ch.key}) «${answer.place.name}», ${answer.runes.length} rune`, true);
      }
    } finally {
      this.pending.delete(ch.key);
    }
    content ??= { place: { name: 'Terra senza nome', description: 'Qui il mondo non ha ancora trovato le parole.' }, runes: [] };
    this.contentCache.set(ch.key, content);
    if (this.chunks.get(ch.key) === ch) this.applyContent(ch, content);
  }

  private applyContent(ch: Chunk, content: ChunkContent): void {
    ch.content = content;
    const S = this.config.chunkSize;
    content.runes.forEach((r, i) => {
      let col = ch.cx * S + r.col;
      tokenize(r.line).forEach((token, j) => {
        const origin = `${ch.key}#${i}.${j}`;
        if (!this.consumed.has(origin)) {
          const rune: RuneComp = { token, col, row: ch.cy * S + r.row, source: 'gen', origin };
          this.ecs.spawn({ rune, chunk: { key: ch.key } });
        }
        col += token.length;
      });
    });
    this.runesDirty = true;
  }

  // --- Space & collisions ----------------------------------------------------------------------

  /** Tile at a carpet cell, or undefined if its chunk is not loaded (never generates: may be called from Lua). */
  tileAt(col: number, row: number): string | undefined {
    const S = this.config.chunkSize;
    const cx = Math.floor(col / S);
    const cy = Math.floor(row / S);
    const ch = this.chunks.get(this.chunkKey(cx, cy));
    return ch?.tiles[(row - cy * S) * S + (col - cx * S)];
  }

  private freeCell(col: number, row: number): boolean {
    const t = this.tileAt(col, row);
    if (t && this.palette[t]?.solid) return false;
    return !this.solidCells.has(`${col},${row}`);
  }

  /** Carpet-space collision test of a box of half-size r. */
  free(x: number, y: number, r: number): boolean {
    if (![x, y, r].every(Number.isFinite)) return false;
    for (const [dx, dy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) if (!this.freeCell(Math.floor(x + dx), Math.floor(y + dy))) return false;
    return true;
  }

  /** Real-space collision: carpet inside the circle, corona walkable, nothing beyond it. */
  freeReal(x: number, y: number, r: number): boolean {
    if (![x, y, r].every(Number.isFinite)) return false;
    const R = this.config.circleRadius;
    const { ox, oy } = this.offset();
    for (const [dx, dy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) {
      const px = x + dx;
      const py = y + dy;
      const d = Math.hypot(px, py);
      if (d >= this.corona.outer) return false;
      if (d >= R) continue;
      if (!this.freeCell(Math.floor(px + ox), Math.floor(py + oy))) return false;
    }
    return true;
  }

  // --- Runes ---------------------------------------------------------------------------------

  private runeList(): Array<{ id: Id; rune: RuneComp }> {
    return this.ecs.query('rune').map((id) => ({ id, rune: this.ecs.get(id, 'rune') }));
  }

  /** Recompiles the lines whose text changed since last tick. */
  private syncRunes(): void {
    if (!this.runesDirty) return;
    this.runesDirty = false;
    const runes = this.runeList();
    this.runeCells = cellIndex(runes);
    const next = new Map<string, LineState>();
    for (const line of extractLines(runes)) {
      const prev = this.lines.get(line.key);
      if (prev && prev.src === line.src) {
        prev.line = line;
        next.set(line.key, prev);
        continue;
      }
      const err = this.sandbox.setLine(line.key, line.src);
      if (err) this.faults.raise(`rune:${line.key}`, `«${line.src}» — ${err}`);
      else this.faults.clear(`rune:${line.key}`);
      const kind = err ? null : this.sandbox.runeKind(line.src);
      const pure = !!kind && 'kind' in kind && kind.kind === 'expr' && !line.tokens.includes('(');
      next.set(line.key, { line, src: line.src, compiled: !err, pure, result: null, error: err });
    }
    for (const key of this.lines.keys()) {
      if (next.has(key)) continue;
      this.sandbox.removeLine(key);
      this.faults.clear(`rune:${key}`);
    }
    this.lines.clear();
    for (const [k, v] of next) this.lines.set(k, v);
  }

  /** What is written on the carpet runs. Every tick. */
  private runRunes(): void {
    const refresh = this.tickCount % 10 === 0;
    for (const st of this.lines.values()) {
      if (!st.compiled || (st.pure && !refresh && st.result !== null)) continue;
      const key = `rune:${st.line.key}`;
      this.faultFlag = null;
      const r = this.sandbox.runLine(st.line.key);
      if (this.faultFlag === key) {
        st.error = this.faults.get(key)?.message ?? 'errore';
      } else {
        this.faults.clear(key);
        st.result = r;
        st.error = null;
      }
    }
  }

  lineOfRune(id: Id): LineState | undefined {
    for (const st of this.lines.values()) if (st.line.ids.includes(id)) return st;
    return undefined;
  }

  private playerCell(): { col: number; row: number } {
    const pc = this.playerCarpet();
    return { col: Math.floor(pc.x), row: Math.floor(pc.y) };
  }

  private facingDelta(): [number, number] {
    switch (this.playerComp()?.facing) {
      case 'left': return [-1, 0];
      case 'right': return [1, 0];
      case 'up': return [0, -1];
      default: return [0, 1];
    }
  }

  private inCircle(col: number, row: number): boolean {
    const { ox, oy } = this.offset();
    return Math.hypot(col + 0.5 - ox, row + 0.5 - oy) < this.config.circleRadius - 0.5;
  }

  pickUp(): boolean {
    if (this.zone !== 'sim') return false;
    const { col, row } = this.playerCell();
    const [dx, dy] = this.facingDelta();
    const id = this.runeCells.get(`${col},${row}`) ?? this.runeCells.get(`${col + dx},${row + dy}`);
    if (id === undefined) return false;
    const rune: RuneComp = this.ecs.get(id, 'rune');
    if (rune.origin) this.consumed.add(rune.origin);
    this.ecs.destroy(id);
    const hand = this.hand();
    hand.tokens.push(rune.token);
    hand.sel = hand.tokens.length - 1;
    this.runesDirty = true;
    this.bus.emit('rune:picked', { token: rune.token });
    this.message(`Raccolta la runa «${rune.token}»`);
    return true;
  }

  /** Writes tokens on the carpet in front of the player, as one touching row. */
  inscribe(tokens: string[]): boolean {
    if (!tokens.length) {
      this.message('La tua mano è vuota.', 'warn');
      return false;
    }
    if (this.zone !== 'sim') {
      this.message('Qui non c\'è tappeto su cui scrivere.', 'warn');
      return false;
    }
    const width = tokens.reduce((n, t) => n + t.length, 0);
    const { col, row } = this.playerCell();
    const facing = this.playerComp()?.facing;
    const start = facing === 'left' ? { col: col - width, row } : facing === 'right' ? { col: col + 1, row } : { col, row: row + (facing === 'up' ? -1 : 1) };
    for (let i = 0; i < width; i++) {
      const c = start.col + i;
      if (this.runeCells.has(`${c},${start.row}`) || !this.freeCell(c, start.row) || !this.inCircle(c, start.row)) {
        this.message('Non c\'è spazio per scrivere qui.', 'warn');
        return false;
      }
    }
    let c = start.col;
    for (const token of tokens) {
      const rune: RuneComp = { token, col: c, row: start.row, source: 'player' };
      this.ecs.spawn({ rune });
      c += token.length;
    }
    this.runesDirty = true;
    this.bus.emit('rune:inscribed', { tokens });
    this.message(`Hai inciso: ${tokens.join(' ')}`);
    return true;
  }

  inscribeHand(): void {
    const hand = this.hand();
    if (this.inscribe(hand.tokens)) {
      hand.tokens = [];
      hand.sel = 0;
    }
  }

  dropSelected(): void {
    const hand = this.hand();
    const token = hand.tokens[hand.sel];
    if (token === undefined) {
      this.message('La tua mano è vuota.', 'warn');
      return;
    }
    if (this.inscribe([token])) {
      hand.tokens.splice(hand.sel, 1);
      hand.sel = Math.max(0, Math.min(hand.sel, hand.tokens.length - 1));
    }
  }

  select(delta: number, move = false): void {
    const hand = this.hand();
    const n = hand.tokens.length;
    if (!n) return;
    const to = (hand.sel + delta + n) % n;
    if (move) [hand.tokens[hand.sel], hand.tokens[to]] = [hand.tokens[to], hand.tokens[hand.sel]];
    hand.sel = to;
  }

  // --- Interaction ----------------------------------------------------------------------------

  /** E: corona → edit code; carpet → pick a rune, else talk/read/use the nearest entity. */
  async interact(): Promise<void> {
    if (this.zone === 'corona') {
      const p = this.playerPos();
      const cell = this.corona.at(Math.floor(p.x), Math.floor(p.y));
      if (cell?.path) this.bus.emit('ui:edit', { path: cell.path, line: cell.line ?? 1 });
      return;
    }
    if (this.pickUp()) return;
    const pc = this.playerCarpet();
    let best: Id | null = null;
    let bestD = 1.6;
    for (const id of this.ecs.query('interact', 'pos')) {
      const p = this.ecs.get(id, 'pos');
      const d = Math.hypot(p.x - pc.x, p.y - pc.y);
      if (d < bestD) [best, bestD] = [id, d];
    }
    if (best === null) return;
    const it = this.ecs.get(best, 'interact');
    const modId: string = this.ecs.get(best, 'module')?.id;
    const m = this.modules.get(modId);
    const speaker = m?.manifest.name ?? 'Qualcuno';
    if (it.type === 'lua') {
      const { value, failed } = this.runModule(modId, 'on_interact', best);
      if (!failed && typeof value === 'string') this.bus.emit('ui:dialog', { speaker, text: value });
      return;
    }
    it.talks = (it.talks ?? 0) + 1;
    const place = this.placeHere();
    const p = this.playerPos();
    const text = await this.gateway.text({
      kind: it.type, speaker, persona: it.persona ?? '', theme: this.files[this.config.theme] ?? '',
      prompt: m?.manifest.prompts?.dialogue ?? '', seed: this.config.seed + best,
      context: { place: place?.name, talks: it.talks, distanceToEdge: this.config.circleRadius - Math.hypot(p.x, p.y) },
    });
    this.bus.emit('ui:dialog', { speaker, text });
  }

  placeHere(): Place | undefined {
    const pc = this.playerCarpet();
    const S = this.config.chunkSize;
    return this.chunks.get(this.chunkKey(Math.floor(pc.x / S), Math.floor(pc.y / S)))?.content?.place;
  }

  /** Tooltip contents for a real-space point. */
  hoverAt(rx: number, ry: number): HoverInfo | null {
    const p = this.playerPos();
    if (Math.hypot(rx - p.x, ry - p.y) < 0.5) return { kind: 'player' };
    const R = this.config.circleRadius;
    if (Math.hypot(rx, ry) >= R) {
      const cell = this.corona.at(Math.floor(rx), Math.floor(ry));
      return cell && cell.kind !== 'empty' ? { kind: 'code', cell } : null;
    }
    const { ox, oy } = this.offset();
    const cx = rx + ox;
    const cy = ry + oy;
    const id = this.runeCells.get(`${Math.floor(cx)},${Math.floor(cy)}`);
    if (id !== undefined && this.ecs.alive.has(id)) {
      const rune: RuneComp = this.ecs.get(id, 'rune');
      const symbol = /^[A-Za-z_]\w*$/.test(rune.token) && !['true', 'false', 'nil', 'not', 'and', 'or'].includes(rune.token) ? this.sandbox.eval(rune.token) : null;
      return { kind: 'rune', token: rune.token, doc: SYMBOL_DOCS[rune.token], symbol, line: this.lineOfRune(id), source: rune.source };
    }
    for (const eid of this.ecs.query('module', 'pos', 'glyph')) {
      if (eid === this.playerId) continue;
      const ep = this.ecs.get(eid, 'pos');
      if (Math.hypot(ep.x - cx, ep.y - cy) < 0.6) {
        const m = this.modules.get(this.ecs.get(eid, 'module').id)?.manifest;
        return { kind: 'entity', name: m?.name ?? '???', description: m?.description ?? '' };
      }
    }
    const t = this.tileAt(Math.floor(cx), Math.floor(cy));
    return t ? { kind: 'tile', name: this.palette[t]?.name ?? t } : null;
  }

  // --- Versioning ------------------------------------------------------------------------------

  /** Returns the player's inscribed runes to the hand and restores the last valid commit. */
  rollback(commitId?: string): void {
    const hand = this.hand();
    for (const { id, rune } of this.runeList()) {
      if (rune.source !== 'player') continue;
      hand.tokens.push(rune.token);
      this.ecs.destroy(id);
    }
    const files = commitId ? this.repo.checkout(commitId) : this.repo.restore();
    this.faults.clearAll();
    this.applyFiles(files, { reset: true });
    const head = this.repo.head();
    this.log('kernel', `rollback a ${head.id} (${head.message})`);
    this.bus.emit('rollback', { commit: head });
    this.message(`Il mondo torna a «${head.message}» (${head.id})`, 'good');
  }

  /** Writes a file from the editor. Valid code is hot reloaded and committed; invalid code is the player's right. */
  saveFile(path: string, content: string, force = false): { errors: string[]; committed: boolean; written: boolean } {
    const errors = this.validator.validateFile(path, content);
    if (errors.length && !force) return { errors, committed: false, written: false };
    this.repo.write(path, content);
    this.applyFiles({ ...this.repo.working });
    const broken = this.faults.list().some((f) => f.key.startsWith('manifest:') || f.key.endsWith(':load') || f.key === 'universe:config');
    let committed = false;
    if (!errors.length && !broken) {
      const c = this.repo.commit(`modifica ${path}`, 'player');
      this.log('repo', `commit ${c.id}: ${c.message}`);
      committed = true;
    } else {
      this.log('repo', `${path} scritto senza commit: l'universo è in uno stato non valido`);
    }
    return { errors, committed, written: true };
  }

  /** Asks the in-world agent for a new module; validated, then committed and hot loaded. */
  async askAgent(prompt: string): Promise<{ ok: boolean; summary: string }> {
    const ids = [...this.modules.keys()];
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await this.gateway.module({ prompt, theme: this.files[this.config.theme] ?? '', existingIds: ids, instructions: this.files['prompts/module.md'] ?? '' });
      const errors = this.validator.validateModule(result.files, new Set(ids));
      if (errors.length) {
        this.gateway.record('module', `scartato: ${errors[0]} → rigenero`, false);
        continue;
      }
      for (const [p, src] of Object.entries(result.files)) this.repo.write(p, src);
      this.applyFiles({ ...this.repo.working });
      const c = this.repo.commit(`agente: ${result.summary}`, 'agent');
      this.gateway.record('module', `${result.summary} → commit ${c.id}`, true);
      this.log('agent', `${result.summary} (commit ${c.id})`);
      return { ok: true, summary: result.summary };
    }
    return { ok: false, summary: 'L\'agente non è riuscito a produrre un modulo valido.' };
  }

  /** Dev only: files on disk changed (Vite HMR). */
  syncFromDisk(files: FileMap): void {
    for (const p of Object.keys(this.repo.working)) if (!(p in files)) this.repo.write(p, null);
    for (const [p, src] of Object.entries(files)) this.repo.write(p, src);
    this.applyFiles({ ...this.repo.working });
    const c = this.repo.commit('dev: modifica dal disco', 'dev');
    this.log('dev', `hot reload dal disco → commit ${c.id}`);
  }

  // --- Tick ------------------------------------------------------------------------------------

  tick(dt: number): void {
    this.time += dt;
    this.tickCount++;
    this.updateChunks();
    this.rebuildSolids();
    this.syncRunes();
    this.runRunes();
    for (const s of this.systems) this.runModule(s.manifest.id, 'update', dt);
    this.syncRunes();
    this.sanitize();
    this.updateZone();
  }

  private rebuildSolids(): void {
    this.solidCells.clear();
    for (const id of this.ecs.query('body', 'pos')) {
      if (id === this.playerId) continue;
      const b = this.ecs.get(id, 'body');
      if (!b.solid) continue;
      const p = this.ecs.get(id, 'pos');
      this.solidCells.add(`${Math.floor(p.x)},${Math.floor(p.y)}`);
    }
  }

  /** The kernel never lets the core state become meaningless (NaN, missing, absurd). */
  private sanitize(): void {
    const p = this.ecs.get(this.playerId, 'pos');
    const c = this.carpet();
    const okPos = p && Number.isFinite(p.x) && Number.isFinite(p.y);
    const okCarpet = !c || (Number.isFinite(c.ox) && Number.isFinite(c.oy));
    if (okPos && okCarpet) {
      const d = Math.hypot(p.x, p.y);
      const max = this.corona.outer - 0.5;
      if (d > max) {
        p.x *= max / d;
        p.y *= max / d;
      }
      this.lastGood = { px: p.x, py: p.y, ox: c?.ox ?? 0, oy: c?.oy ?? 0 };
      this.faults.clear('kernel:sanitize');
      return;
    }
    if (!p) this.ecs.set(this.playerId, 'pos', { x: this.lastGood.px, y: this.lastGood.py });
    else if (!okPos) Object.assign(p, { x: this.lastGood.px, y: this.lastGood.py });
    if (c && !okCarpet) Object.assign(c, { ox: this.lastGood.ox, oy: this.lastGood.oy });
    this.faults.raise('kernel:sanitize', 'stato del mondo non valido: il kernel ha ripristinato posizione e tappeto');
  }

  private updateZone(): void {
    const p = this.playerPos();
    const zone = Math.hypot(p.x, p.y) >= this.config.circleRadius ? 'corona' : 'sim';
    if (zone === this.zone) return;
    this.zone = zone;
    this.bus.emit('zone', { zone, first: zone === 'corona' && !this.exitedOnce });
    if (zone === 'corona') this.exitedOnce = true;
  }

  /** 0..1, how broken the universe currently is. */
  brokenness(): number {
    const n = this.faults.size;
    return n === 0 ? 0 : Math.min(1, 0.3 + 0.15 * (n - 1));
  }
}
