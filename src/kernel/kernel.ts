// The kernel: the floor of the universe. Owns the ECS state, the chunks, the sandbox, versioning,
// the assets and the Council of agents. Everything above this floor is generated (by the Council)
// or written in Lua, and can break; the floor cannot: a broken universe is always recoverable.

import { World, type Id } from './ecs';
import { EventBus } from './events';
import { Faults } from './faults';
import { Sandbox, type Host } from './sandbox';
import { Validator } from './validator';
import { Repo, type KeyValueStore } from './repo';
import { Corona, type CoronaCell } from './corona';
import { Input } from './input';
import { discoverModules, readConfig } from './universe';
import { cellIndex, extractLines, tokenize, type RuneComp, type RuneLine } from './runes';
import { hash32, hashStr, hex, Rng } from './rng';
import { BudgetError, type Models } from './ai/models';
import { MemoryAssets, MemoryChunks, type AssetStore, type ChunkStore } from './assets';
import { PAINT_MARGIN, TILE_PX, type ImageTools, type Neighbours } from './imaging';
import { Council, readBible, type CatalogEntry, type FeedEntry } from './agents/council';
import { paintPrompt, planChunk, surveyChunk, type ChunkPlan, type Edges } from './agents/cartography';
import { forge, judgeCombination, repairLogic, spritePrompt, type ForgeOrigin } from './agents/forge';
import { apiErrors } from './validator';
import { narrate, npcReply, type NpcReply, type Turn } from './agents/minds';
import { planGenesis } from './agents/genesis';
import { addItem, CARRY_CAPACITY, countItem, equippedItem, moveSlot, newInventory, removeItem, takeFromSlot, totalWeight, type Inventory } from './inventory';
import type { FileMap, ItemSpec, Manifest, ModuleEntry, Place, RuneFragment, TileDef, UniverseConfig } from './types';

export type ChunkStage = 'draft' | 'planned' | 'painted';

export interface Chunk {
  cx: number;
  cy: number;
  key: string;
  /** size² tile codes: the collision grid. */
  tiles: string;
  /** Bumped whenever tiles or image change (renderer cache key). */
  version: number;
  stage: ChunkStage;
  place?: Place;
  plan?: ChunkPlan;
  /** Asset id of the painted image. */
  image?: string;
  painting?: boolean;
  developing?: boolean;
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
  | { kind: 'entity'; name: string; description: string; extra?: string }
  | { kind: 'tile'; name: string }
  | { kind: 'code'; cell: CoronaCell }
  | { kind: 'player' };

export interface ItemInfo {
  id: string;
  name: string;
  description: string;
  glyph: string;
  color: string;
  sprite?: string;
  spec: ItemSpec;
}

export interface Mind {
  mode: 'vaga' | 'segui' | 'resta';
  mood: string;
  history: Turn[];
}

export interface KernelOptions {
  files: FileMap;
  store: KeyValueStore;
  models: Models;
  assets?: AssetStore;
  chunks?: ChunkStore;
  imageTools?: ImageTools;
  wasmUri?: string;
}

/** Documentation of the live symbols runes can bind to. */
export const SYMBOL_DOCS: Record<string, string> = {
  x: 'posizione X globale del giocatore (non quella del tappeto)',
  y: 'posizione Y globale del giocatore (non quella del tappeto)',
  speed: 'velocità del giocatore, in caselle al secondo',
  carpet: 'il tappeto che ti riporta al centro',
  time: 'secondi trascorsi dalla nascita del mondo',
  strength: 'campo del tappeto: quanto ti riporta indietro (1 = tutto)',
  rate: 'campo del tappeto: quanto in fretta ti riporta indietro',
  active: 'campo del tappeto: se sta girando',
  ox: 'campo del tappeto: scorrimento orizzontale accumulato',
  oy: 'campo del tappeto: scorrimento verticale accumulato',
};

const VOID_TILE: TileDef = { name: 'vuoto', color: '#2a0612', solid: false };
const DEFAULT_ITEM: ItemSpec = { stackable: false, maxStack: 1, weight: 1, equippable: false };
const FALLBACK_PLAYER = {
  player: { speed: 6, facing: 'down', load: 0 },
  hand: { tokens: [] as string[], sel: 0 },
};

const clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

export class Kernel {
  readonly ecs = new World();
  readonly bus = new EventBus();
  readonly faults = new Faults();
  readonly input = new Input();
  readonly models: Models;
  readonly assets: AssetStore;
  readonly chunkStore: ChunkStore;
  readonly imageTools?: ImageTools;
  council!: Council;
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
  /** Speech bubbles shown above entities. */
  readonly bubbles = new Map<Id, { text: string; until: number }>();
  /** Entity cells blocked by solid bodies, rebuilt every tick. */
  private solidCells = new Set<string>();
  private runesDirty = true;
  private consumed = new Set<string>();
  private loaded = new Map<string, string>();
  private singletons = new Map<string, Id>();
  private faultFlag: string | null = null;
  private lastGood = { px: 0, py: 0, ox: 0, oy: 0 };
  private painters = 0;
  private paintingStopped = false;
  private forgesUsed = 0;
  private forging = new Set<string>();
  private developers = 0;
  private repaired = new Set<string>();
  /** While true no chunk is planned or painted (e.g. during genesis): the Council works on one thing at a time. */
  generationHeld = false;
  /** Terrain generation is Lua and costs a few ms: at most this many new chunks per tick. */
  static CHUNKS_PER_TICK = 1;
  private genBudget = 64;
  private tickCount = 0;

  playerId: Id = 0;
  time = 0;
  zone: 'sim' | 'corona' = 'sim';
  exitedOnce = false;
  /** Size of the visible area in cells, set by the renderer. */
  view = { w: 32, h: 20 };
  readonly logs: LogEntry[] = [];

  private constructor(opts: KernelOptions) {
    this.models = opts.models;
    this.assets = opts.assets ?? new MemoryAssets();
    this.chunkStore = opts.chunks ?? new MemoryChunks();
    this.imageTools = opts.imageTools;
  }

  static async boot(opts: KernelOptions): Promise<Kernel> {
    const k = new Kernel(opts);
    k.sandbox = await Sandbox.create(k.makeHost(), opts.wasmUri);
    k.validator = new Validator(k.sandbox);
    k.council = new Council(opts.models, () => ({ files: k.files, palette: k.palette, catalog: k.catalog() }));
    k.council.onFeed = (e) => k.bus.emit('council', e);
    const name = readConfig(opts.files).config.name;
    const { repo, synced } = Repo.open(name, opts.files, opts.store);
    k.repo = repo;
    k.faults.onRaise = (f, isNew) => {
      if (isNew) k.log('fault', `${f.key}: ${f.message}`);
      k.bus.emit('fault', { fault: f, isNew });
      if (isNew) void k.repairGenerated(f.key, f.message);
    };
    k.applyFiles(repo.working, { reset: true });
    k.models.limits = { text: k.config.ai.maxText, images: k.models.canPaint ? k.config.ai.maxImages : 0 };
    k.log('kernel', `universo «${name}» avviato su commit ${repo.head().id} (${repo.head().message}) — modelli: ${opts.models.name}${synced ? ' — sincronizzato dal disco' : ''}`);
    return k;
  }

  /** True when the universe was never generated by the Council (only the bundled example content). */
  needsGenesis(): boolean {
    return !this.repo.log().some((c) => c.message.startsWith('genesi:'));
  }

  // --- Host: the only surface Lua can touch ---------------------------------------------------

  private makeHost(): Host {
    return {
      query: (names) => this.ecs.query(...names.split(',').map((s) => s.trim()).filter(Boolean)).join(','),
      get: (id, name) => this.ecs.get(id, name) ?? undefined,
      set: (id, name, data) => {
        // The floor protects what keeps the universe navigable: position, the player, the carpet.
        if (!this.ecs.alive.has(id) || ['pos', 'module', 'chunk', 'carpet'].includes(name) || (id === this.playerId && ['player', 'hand', 'inventory'].includes(name))) return false;
        if (data === null || typeof data !== 'object') return false;
        this.ecs.set(id, name, data);
        return true;
      },
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
      speed_at: (x, y) => {
        const t = this.tileAt(Math.floor(x), Math.floor(y));
        return (t && this.palette[t]?.speed) || 1;
      },
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
      spawn_module: (module, x, y) => {
        const m = this.modules.get(module);
        if (!m || !Number.isFinite(x) || !Number.isFinite(y) || (m.manifest.kind !== 'entity' && m.manifest.kind !== 'item')) return undefined;
        return this.spawnModuleEntity(m, x, y);
      },
      player_id: () => this.playerId,
      player_pos: () => this.playerCarpet(),
      nearest: (x, y, r, tag) => this.nearest(x, y, r, tag ?? undefined) ?? undefined,
      has_tag: (id, tag) => this.hasTag(id, tag),
      break_entity: (id) => this.breakEntity(id),
      say: (text) => this.message(String(text).slice(0, 300)),
      speak: (id, text) => this.speak(id, String(text)),
      inv_add: (id, item, n) => this.invAdd(id, item, n),
      inv_remove: (id, item, n) => {
        const inv: Inventory | undefined = this.ecs.get(id, 'inventory');
        return inv && Number.isFinite(n) ? removeItem(inv, item, n) : 0;
      },
      inv_count: (id, item) => {
        const inv: Inventory | undefined = this.ecs.get(id, 'inventory');
        return inv ? countItem(inv, item) : 0;
      },
      inv_equipped: (id) => {
        const inv: Inventory | undefined = this.ecs.get(id, 'inventory');
        return (inv && equippedItem(inv)) ?? undefined;
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

  playerComp(): { speed: number; facing: string; load: number } {
    return this.ecs.get(this.playerId, 'player');
  }

  /** The rune hand (ordered tokens to inscribe). */
  hand(): { tokens: string[]; sel: number } {
    return this.ecs.get(this.playerId, 'hand');
  }

  inventory(): Inventory {
    return this.ecs.get(this.playerId, 'inventory');
  }

  /** Player position on the carpet (where the simulation thinks you are). */
  playerCarpet(): { x: number; y: number } {
    const p = this.playerPos();
    const { ox, oy } = this.offset();
    return { x: p.x + ox, y: p.y + oy };
  }

  /**
   * The corona exists only for whoever escaped the carpet. While the carpet holds the player near the
   * centre nothing of it is drawn, hovered or reachable: the simulation simply continues.
   */
  coronaRevealed(): boolean {
    const p = this.playerPos();
    return !!p && Math.hypot(p.x, p.y) > this.config.circleRadius * 0.45;
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

  speak(id: Id, text: string): void {
    if (!this.ecs.alive.has(id)) return;
    this.bubbles.set(id, { text: text.slice(0, 140), until: this.time + 4 + text.length / 25 });
  }

  catalog(): CatalogEntry[] {
    return [...this.modules.values()]
      .filter((m) => m.manifest.kind === 'entity' || m.manifest.kind === 'item')
      .map((m) => ({ id: m.manifest.id, name: m.manifest.name, kind: m.manifest.kind === 'item' ? 'strumento' : m.manifest.persona ? 'npc' : 'oggetto', tiles: m.manifest.spawn?.tiles ?? [], context: m.manifest.context ?? m.manifest.description ?? '' }));
  }

  itemInfo(id: string): ItemInfo {
    const m = this.modules.get(id)?.manifest;
    return {
      id,
      name: m?.name ?? id,
      description: m?.description ?? 'Qualcosa che non esiste più nel codice del mondo.',
      glyph: m?.appearance?.glyph ?? '?',
      color: m?.appearance?.color ?? '#888',
      sprite: m?.appearance?.sprite,
      spec: m?.item ?? DEFAULT_ITEM,
    };
  }

  private itemSpec = (id: string): ItemSpec | undefined => this.modules.get(id)?.manifest.item;

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

    const oldPalette = JSON.stringify(this.palette);
    this.modules = new Map(modules.map((m) => [m.manifest.id, m]));
    this.systems = modules.filter((m) => m.manifest.kind === 'system').sort((a, b) => (a.manifest.order ?? 50) - (b.manifest.order ?? 50));
    this.terrain = modules.find((m) => m.manifest.kind === 'generator');
    this.palette = { '?': VOID_TILE, ...(this.terrain?.manifest.tiles ?? {}) };
    this.fragments = modules.flatMap((m) => m.manifest.fragments ?? []);

    this.ensureCoreEntities(opts.reset ?? false);
    for (const id of this.ecs.query('module', 'glyph')) {
      const modId = this.ecs.get(id, 'module').id;
      const app = this.modules.get(modId)?.manifest.appearance;
      if (app && changed.has(modId)) this.ecs.set(id, 'glyph', this.glyphOf(app));
    }

    const paletteChanged = oldPalette !== JSON.stringify(this.palette);
    if (sizeChanged || paletteChanged) this.clearChunks();
    else if (!this.terrain || changed.has(this.terrain.manifest.id) || opts.reset) for (const ch of this.chunks.values()) if (ch.stage === 'draft') this.regenerateTiles(ch);

    this.files = files;
    this.corona.build(files);
    this.bus.emit('universe:reloaded', { changed: [...changed] });
  }

  private glyphOf(app: NonNullable<Manifest['appearance']>) {
    return { ch: app.glyph, color: app.color, sprite: app.sprite, scale: app.scale ?? 1.1 };
  }

  private ensureCoreEntities(reset: boolean): void {
    const playerMod = [...this.modules.values()].find((m) => m.manifest.kind === 'player');
    const defaults: Record<string, any> = clone(playerMod?.manifest.components ?? FALLBACK_PLAYER);
    if (!defaults.player) defaults.player = clone(FALLBACK_PLAYER.player);
    if (!defaults.hand) defaults.hand = clone(FALLBACK_PLAYER.hand);
    if (!defaults.inventory) defaults.inventory = newInventory();
    const app = playerMod?.manifest.appearance ?? { glyph: '@', color: '#ffffff', scale: 1.3 };
    const glyph = this.glyphOf(app);
    const body = { r: playerMod?.manifest.physics?.radius ?? 0.3, solid: false };

    if (!this.playerId || !this.ecs.alive.has(this.playerId)) {
      this.playerId = this.ecs.spawn({ ...defaults, pos: { x: 0, y: 0 }, glyph, body, module: { id: playerMod?.manifest.id ?? 'kernel.player' } });
    } else {
      this.ecs.set(this.playerId, 'glyph', glyph);
      if (reset) this.resetComponents(this.playerId, defaults, [...(playerMod?.manifest.persist ?? []), 'inventory.slots', 'inventory.equipped']);
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

  // --- Chunks: draft → plan (Cartographer) → paint (Artist) → survey (Physicist) ---------------

  private chunkKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  /** Cache key: a new genesis (palette, bible) means a new world, so old chunks are not reused. */
  private recordKey(ch: Chunk): string {
    const world = hex(hashStr(JSON.stringify(this.palette) + (readBible(this.files)?.titolo ?? '')));
    return `${this.config.name}:${this.config.seed}:${world}:${ch.key}`;
  }

  private genTiles(cx: number, cy: number): string {
    const S = this.config.chunkSize;
    const n = S * S;
    if (this.terrain) {
      const id = this.terrain.manifest.id;
      const { value, failed } = this.runModule(id, 'generate_chunk', cx, cy, this.config.seed, S);
      if (!failed) {
        if (typeof value === 'string' && value.length === n) return [...value].map((c) => (this.palette[c] ? c : '?')).join('');
        this.faults.raise(`module:${id}:generate_chunk`, `generate_chunk deve restituire una stringa di ${n} caratteri`);
      }
    }
    return '?'.repeat(n);
  }

  private regenerateTiles(ch: Chunk): void {
    ch.tiles = this.genTiles(ch.cx, ch.cy);
    ch.version++;
  }

  private rows(tiles: string): string[] {
    const S = this.config.chunkSize;
    return Array.from({ length: S }, (_, r) => tiles.slice(r * S, (r + 1) * S));
  }

  private ensureChunk(cx: number, cy: number): Chunk | undefined {
    const key = this.chunkKey(cx, cy);
    const existing = this.chunks.get(key);
    if (existing) return existing;
    if (this.genBudget <= 0) return undefined;
    this.genBudget--;
    const ch: Chunk = { cx, cy, key, tiles: this.genTiles(cx, cy), version: 0, stage: 'draft' };
    this.chunks.set(key, ch);
    return ch;
  }

  private alive(ch: Chunk): boolean {
    return this.chunks.get(ch.key) === ch;
  }

  /** Plans the nearest drafts, a few at a time. */
  private pumpDevelopment(): void {
    if (this.generationHeld || this.developers >= 3) return;
    const S = this.config.chunkSize;
    const pc = this.playerCarpet();
    const pcx = pc.x / S - 0.5;
    const pcy = pc.y / S - 0.5;
    const drafts = [...this.chunks.values()].filter((c) => c.stage === 'draft' && !c.developing);
    drafts.sort((a, b) => Math.hypot(a.cx - pcx, a.cy - pcy) - Math.hypot(b.cx - pcx, b.cy - pcy));
    for (const ch of drafts.slice(0, 3 - this.developers)) {
      ch.developing = true;
      this.developers++;
      void this.develop(ch).finally(() => {
        ch.developing = false;
        this.developers--;
      });
    }
  }

  /** Brings a chunk from draft to planned (and queues painting), reusing the cache when possible. */
  private async develop(ch: Chunk): Promise<void> {
    const rec = await this.chunkStore.load(this.recordKey(ch));
    if (!this.alive(ch)) return;
    if (rec) {
      this.applyPlan(ch, rec.plan, rec.grid);
      if (rec.image) {
        ch.image = rec.image;
        ch.stage = 'painted';
        ch.version++;
      }
      return;
    }
    const plan = await this.makePlan(ch);
    await this.chunkStore.save(this.recordKey(ch), { plan, grid: plan.grid, painted: false });
    if (this.alive(ch)) this.applyPlan(ch, plan, plan.grid);
  }

  private edges(ch: Chunk): Edges {
    const S = this.config.chunkSize;
    const get = (dx: number, dy: number) => this.chunks.get(this.chunkKey(ch.cx + dx, ch.cy + dy));
    const col = (t: string, c: number) => Array.from({ length: S }, (_, r) => t[r * S + c]).join('');
    const n = get(0, -1);
    const s = get(0, 1);
    const w = get(-1, 0);
    const e = get(1, 0);
    return {
      n: n && n.stage !== 'draft' ? n.tiles.slice((S - 1) * S) : undefined,
      s: s && s.stage !== 'draft' ? s.tiles.slice(0, S) : undefined,
      w: w && w.stage !== 'draft' ? col(w.tiles, S - 1) : undefined,
      e: e && e.stage !== 'draft' ? col(e.tiles, 0) : undefined,
    };
  }

  private async makePlan(ch: Chunk): Promise<ChunkPlan> {
    const S = this.config.chunkSize;
    const draft = this.rows(ch.tiles);
    const start = ch.cx === 0 && ch.cy === 0;
    const placeable = new Map(this.catalog().map((c) => [c.id, c.tiles]));
    const neighborPlaces = [[0, -1], [0, 1], [-1, 0], [1, 0]]
      .map(([dx, dy]) => this.chunks.get(this.chunkKey(ch.cx + dx, ch.cy + dy))?.place?.name)
      .filter((n): n is string => !!n);
    let feedback = '';
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const raw = await planChunk(this.council, {
          cx: ch.cx, cy: ch.cy, size: S, draft, edges: this.edges(ch), neighborPlaces, palette: this.palette,
          catalog: this.catalog(), fragments: this.fragments.map((f) => f.line), start, attempt, feedback,
        });
        const repaired = this.repairGrid(raw.grid, draft);
        if (repaired.fixes > 0 && repaired.fixes <= S * S * 0.15) {
          raw.grid = repaired.grid;
          this.log('validator', `chunk ${ch.key}: griglia riparata (${repaired.fixes} caselle)`);
        }
        const verdict = this.validator.validatePlan(raw, S, this.palette, placeable, start);
        if (verdict.errors.length) {
          feedback = verdict.errors.join('; ');
          this.council.say('kernel', 'scarta', `chunk ${ch.key}: ${feedback} → rigenero`, 'cartografo', 'chunk.plan');
          this.log('validator', `piano del chunk ${ch.key} scartato: ${feedback}`);
          continue;
        }
        if (verdict.dropped.length) {
          this.log('validator', `chunk ${ch.key}: scartati ${verdict.dropped.join('; ')}`);
          this.council.say('kernel', 'scarta', `(${ch.key}) ${verdict.dropped[0]}${verdict.dropped.length > 1 ? ` (+${verdict.dropped.length - 1})` : ''}`, 'cartografo', 'chunk.plan');
        }
        const plan = verdict.plan;
        if (start) this.ensureStarterRunes(plan);
        this.council.say('cartografo', 'propone', `(${ch.key}) «${plan.place.name}»: ${plan.objects.length} oggetti, ${plan.runes.length} rune${plan.fresh.length ? `, chiede «${plan.fresh[0].concept}»` : ''}${verdict.moved ? `, ${verdict.moved} riposizionati dal kernel` : ''}${verdict.dropped.length ? `, ${verdict.dropped.length} scartati` : ''}`, undefined, 'chunk.plan');
        return plan;
      } catch (e) {
        const msg = (e as Error).message;
        this.council.say('cartografo', 'errore', `(${ch.key}) ${msg}`, undefined, 'chunk.plan');
        if (e instanceof BudgetError) break;
      }
    }
    return this.fallbackPlan(ch, draft, start);
  }

  /** Small mistakes (a row one character short, an unknown code) are mended from the draft; big ones are rejected. */
  private repairGrid(grid: unknown, draft: string[]): { grid: string[]; fixes: number } {
    const S = this.config.chunkSize;
    const rows = Array.isArray(grid) ? grid.map(String) : [];
    let fixes = Math.abs(rows.length - S) * S;
    const out = draft.map((d, r) => {
      const src = [...(rows[r] ?? '')];
      fixes += Math.abs(src.length - S);
      return d
        .split('')
        .map((dc, c) => {
          const v = src[c];
          if (v !== undefined && this.palette[v] && v !== '?') return v;
          if (v !== undefined) fixes++;
          return dc;
        })
        .join('');
    });
    return { grid: out, fixes };
  }

  /** The first square always offers a way in: a symbol to watch, an assignment, a carpet field. */
  private ensureStarterRunes(plan: ChunkPlan): void {
    const S = this.config.chunkSize;
    const needed = ['x', 'speed = speed', 'carpet . active'].filter((l) => !plan.runes.some((r) => r.line === l));
    const grid = plan.grid.map((r) => [...r]);
    const used = new Set<string>();
    for (const r of plan.runes) for (let i = -1; i <= tokenize(r.line).join('').length; i++) used.add(`${r.col + i},${r.row}`);
    for (const o of plan.objects) used.add(`${o.col},${o.row}`);
    for (const line of needed) {
      const w = tokenize(line).join('').length;
      search: for (let row = 4; row < S - 1; row++)
        for (let col = 1; col + w < S - 1; col++) {
          for (let i = -1; i <= w; i++) if (used.has(`${col + i},${row}`)) continue search;
          for (let i = 0; i < w; i++) if (this.palette[grid[row][col + i]]?.solid !== false) continue search;
          for (let i = 0; i < w; i++) used.add(`${col + i},${row}`);
          plan.runes.push({ line, col, row });
          break search;
        }
    }
  }

  private fallbackPlan(ch: Chunk, draft: string[], start: boolean): ChunkPlan {
    const S = this.config.chunkSize;
    const plan: ChunkPlan = { place: { name: 'Terra senza nome', description: 'Qui il mondo non ha ancora trovato le parole.' }, grid: draft, objects: [], fresh: [], runes: [] };
    for (const m of this.modules.values()) {
      const rule = m.manifest.spawn;
      if ((m.manifest.kind !== 'entity' && m.manifest.kind !== 'item') || !rule) continue;
      const rng = new Rng(hash32(this.config.seed, ch.cx, ch.cy, hashStr(m.manifest.id)));
      for (let i = 0; i < rule.max; i++) {
        if (!rng.chance(rule.chance)) continue;
        const col = rng.int(S);
        const row = rng.int(S);
        const tile = draft[row][col];
        if (!rule.tiles.includes(tile) || this.palette[tile]?.solid || (start && col < 3 && row < 3)) continue;
        plan.objects.push({ module: m.manifest.id, col, row });
      }
    }
    if (start) this.ensureStarterRunes(plan);
    return plan;
  }

  private applyPlan(ch: Chunk, plan: ChunkPlan, grid: string[]): void {
    const S = this.config.chunkSize;
    ch.plan = plan;
    ch.place = plan.place;
    ch.tiles = grid.join('');
    ch.stage = 'planned';
    ch.version++;
    // Entities of a previous application (hot reload) go away first.
    for (const id of this.ecs.query('chunk')) if (this.ecs.get(id, 'chunk').key === ch.key) this.ecs.destroy(id);
    plan.runes.forEach((r, i) => {
      let col = ch.cx * S + r.col;
      tokenize(r.line).forEach((token, j) => {
        const origin = `${ch.key}#r${i}.${j}`;
        if (!this.consumed.has(origin)) this.ecs.spawn({ rune: { token, col, row: ch.cy * S + r.row, source: 'gen', origin } satisfies RuneComp, chunk: { key: ch.key } });
        col += token.length;
      });
    });
    plan.objects.forEach((o, i) => {
      const origin = `${ch.key}#o${i}`;
      const m = this.modules.get(o.module);
      if (m && !this.consumed.has(origin) && !this.uniqueTaken(m)) this.spawnModuleEntity(m, ch.cx * S + o.col + 0.5, ch.cy * S + o.row + 0.5, ch.key, origin);
    });
    for (const f of plan.fresh) void this.forgeForChunk(ch, f);
    this.runesDirty = true;
    this.bus.emit('chunk:planned', { key: ch.key });
  }

  /** The Cartographer asked for something that does not exist yet: the Forge makes it, then it appears. */
  private async forgeForChunk(ch: Chunk, f: { concept: string; col: number; row: number }): Promise<void> {
    const tag = `${ch.key}:${f.concept}`;
    if (this.forging.has(tag) || this.forgesUsed >= this.config.ai.maxForges) return;
    this.forging.add(tag);
    this.forgesUsed++;
    const r = await this.forgeModule(`${f.concept} (per il luogo «${ch.place?.name}»: ${ch.place?.description})`, 'cartografo');
    this.forging.delete(tag);
    if (!r.ok || !r.id || !ch.plan) return;
    ch.plan.objects.push({ module: r.id, col: f.col, row: f.row });
    ch.plan.fresh = ch.plan.fresh.filter((x) => x !== f);
    await this.chunkStore.save(this.recordKey(ch), { plan: ch.plan, grid: this.rows(ch.tiles), image: ch.image, painted: ch.stage === 'painted' });
    const m = this.modules.get(r.id);
    const S = this.config.chunkSize;
    if (m && this.alive(ch)) this.spawnModuleEntity(m, ch.cx * S + f.col + 0.5, ch.cy * S + f.row + 0.5, ch.key, `${ch.key}#o${ch.plan.objects.length - 1}`);
  }

  /** Paints the nearest planned chunks, a couple at a time. */
  private pumpPainting(): void {
    if (!this.models.canPaint || !this.imageTools || this.paintingStopped || this.painters >= 2) return;
    const S = this.config.chunkSize;
    const pc = this.playerCarpet();
    const pcx = pc.x / S - 0.5;
    const pcy = pc.y / S - 0.5;
    const busy = [...this.chunks.values()].filter((c) => c.painting);
    // Two neighbours painted at the same time cannot see each other: paint them one after the other.
    const next = [...this.chunks.values()]
      .filter((c) => c.stage === 'planned' && !c.painting && Math.hypot(c.cx - pcx, c.cy - pcy) < 2.6)
      .filter((c) => !busy.some((b) => Math.abs(b.cx - c.cx) <= 1 && Math.abs(b.cy - c.cy) <= 1))
      .sort((a, b) => Math.hypot(a.cx - pcx, a.cy - pcy) - Math.hypot(b.cx - pcx, b.cy - pcy))[0];
    if (!next) return;
    next.painting = true;
    this.painters++;
    void this.paint(next).finally(() => {
      next.painting = false;
      this.painters--;
    });
  }

  private async neighbourImages(ch: Chunk): Promise<Neighbours> {
    const dirs = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0], ne: [1, -1], nw: [-1, -1], se: [1, 1], sw: [-1, 1] } as const;
    const out: Neighbours = {};
    for (const [d, [dx, dy]] of Object.entries(dirs)) {
      const n = this.chunks.get(this.chunkKey(ch.cx + dx, ch.cy + dy));
      if (n?.image) {
        const img = await this.assets.get(n.image);
        if (img) out[d as keyof Neighbours] = img;
      }
    }
    return out;
  }

  private async paint(ch: Chunk): Promise<void> {
    const tools = this.imageTools!;
    const S = this.config.chunkSize;
    const plan = ch.plan!;
    try {
      const layout = await tools.composeLayout(plan.grid, this.palette, await this.neighbourImages(ch), PAINT_MARGIN);
      this.council.say('artista', 'dipinge', `(${ch.key}) «${plan.place.name}»`, undefined, 'chunk.paint');
      const raw = await this.council.paint('chunk.paint', paintPrompt(this.council, plan, this.palette, S, PAINT_MARGIN), [layout], { cx: ch.cx, cy: ch.cy });
      if (!raw) return;
      const inner = await tools.cropInner(raw, S, PAINT_MARGIN, S * TILE_PX);
      // The Physicist realigns collisions with what was actually painted.
      let grid = plan.grid;
      try {
        const survey = await surveyChunk(this.council, await tools.downscale(inner, 576), plan.grid, this.palette, { cx: ch.cx, cy: ch.cy });
        if (!this.validator.validateGrid(survey.grid, S, this.palette).length) {
          grid = this.keepOccupiedWalkable(survey.grid, plan);
          const diff = grid.reduce((n, row, r) => n + [...row].filter((c, i) => c !== plan.grid[r][i]).length, 0);
          this.council.say('fisico', diff ? 'corregge' : 'approva', diff ? `(${ch.key}) ${diff} caselle riallineate al dipinto${survey.notes ? `: ${survey.notes}` : ''}` : `(${ch.key}) dipinto e collisioni coincidono`, 'cartografo', 'chunk.survey');
        } else this.council.say('kernel', 'scarta', `(${ch.key}) rilievo del Fisico non valido: tengo la griglia del Cartografo`, 'fisico');
      } catch (e) {
        this.council.say('fisico', 'errore', (e as Error).message);
      }
      const image = await this.assets.put(inner);
      await this.chunkStore.save(this.recordKey(ch), { plan, grid, image, painted: true });
      if (!this.alive(ch)) return;
      ch.image = image;
      ch.tiles = grid.join('');
      ch.stage = 'painted';
      ch.version++;
      this.bus.emit('chunk:painted', { key: ch.key });
    } catch (e) {
      const msg = (e as Error).message;
      this.council.say('artista', 'errore', `(${ch.key}) ${msg}`);
      if (e instanceof BudgetError) {
        this.paintingStopped = true;
        this.message('Budget immagini esaurito: il mondo resta abbozzato.', 'warn');
      }
    }
  }

  /** Cells holding runes or objects stay walkable: things lie on the ground. */
  private keepOccupiedWalkable(grid: string[], plan: ChunkPlan): string[] {
    const g = grid.map((r) => [...r]);
    const fix = (c: number, r: number) => {
      if (this.palette[g[r]?.[c]]?.solid) g[r][c] = plan.grid[r][c];
    };
    for (const o of plan.objects) fix(o.col, o.row);
    for (const r of plan.runes) for (let i = 0; i < tokenize(r.line).join('').length; i++) fix(r.col + i, r.row);
    if (plan.objects.length || plan.runes.length) return g.map((r) => r.join(''));
    return grid;
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
  }

  /** Loads the chunks needed to draw the visible area; unloads the far ones. */
  private updateChunks(): void {
    const S = this.config.chunkSize;
    const R = this.config.circleRadius;
    const p = this.playerPos();
    const { ox, oy } = this.offset();
    // While the corona is hidden the simulation has no visible edge: the carpet fills the view.
    const clamp = this.coronaRevealed() ? R : Infinity;
    const x0 = Math.max(p.x - this.view.w / 2, -clamp) + ox;
    const x1 = Math.min(p.x + this.view.w / 2, clamp) + ox;
    const y0 = Math.max(p.y - this.view.h / 2, -clamp) + oy;
    const y1 = Math.min(p.y + this.view.h / 2, clamp) + oy;
    const want = new Set<string>();
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
    if (this.chunks.size > want.size + 16) {
      for (const ch of [...this.chunks.values()]) if (!want.has(ch.key)) this.unloadChunk(ch);
    }
  }

  // --- Entities --------------------------------------------------------------------------------

  spawnModuleEntity(m: ModuleEntry, x: number, y: number, chunkKey?: string, origin?: string): Id {
    const man = m.manifest;
    const comps: Record<string, any> = {
      ...clone(man.components ?? {}),
      pos: { x, y },
      module: { id: man.id },
      body: { r: man.physics?.radius ?? 0.35, solid: !!man.physics?.solid && !man.physics?.pushable, pushable: !!man.physics?.pushable, mass: man.physics?.mass ?? 1, friction: man.physics?.friction ?? 0.6 },
    };
    if (man.appearance) comps.glyph = this.glyphOf(man.appearance);
    if (man.kind === 'item') comps.pickup = { item: man.id, count: 1 };
    if (man.interaction) comps.interact = { type: man.interaction.type };
    if (man.persona) comps.mind = { mode: 'vaga', mood: 'tranquillo', history: [], ...(comps.mind ?? {}) } satisfies Mind;
    if (man.inventory?.length) {
      const inv = newInventory(8);
      for (const it of man.inventory) addItem(inv, it, 1, this.itemSpec(it));
      comps.inventory = inv;
    }
    if (man.physics?.pushable && !comps.vel) comps.vel = { x: 0, y: 0 };
    if (man.physics?.speed && comps.wander) comps.wander.speed = man.physics.speed;
    if (chunkKey) comps.chunk = { key: chunkKey };
    if (origin) comps.origin = { key: origin };
    const id = this.ecs.spawn(comps);
    if (this.sandbox.has(man.id, 'on_spawn')) this.runModule(man.id, 'on_spawn', id);
    return id;
  }

  private nearest(x: number, y: number, r: number, tag?: string, exclude: Id[] = []): Id | undefined {
    let best: Id | undefined;
    let bestD = r;
    for (const id of this.ecs.query('module', 'pos')) {
      if (id === this.playerId || exclude.includes(id)) continue;
      if (tag && !this.hasTag(id, tag)) continue;
      const p = this.ecs.get(id, 'pos');
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bestD) [best, bestD] = [id, d];
    }
    return best;
  }

  private hasTag(id: Id, tag: string): boolean {
    const m = this.modules.get(this.ecs.get(id, 'module')?.id)?.manifest;
    return !!m?.tags?.includes(tag);
  }

  /** Destroys an entity (never the player) and leaves its drops on the ground. */
  private breakEntity(id: Id): void {
    if (id === this.playerId || !this.ecs.alive.has(id) || this.ecs.has(id, 'carpet')) return;
    const m = this.modules.get(this.ecs.get(id, 'module')?.id)?.manifest;
    const p = this.ecs.get(id, 'pos');
    const origin = this.ecs.get(id, 'origin')?.key;
    if (origin) this.consumed.add(origin);
    this.ecs.destroy(id);
    for (const d of m?.drops ?? []) {
      const dm = this.modules.get(d);
      if (dm && p) this.spawnModuleEntity(dm, p.x, p.y);
    }
  }

  private invAdd(id: Id, item: string, n: number): number {
    const inv: Inventory | undefined = this.ecs.get(id, 'inventory');
    if (!inv || !this.modules.has(item) || !Number.isFinite(n)) return 0;
    return addItem(inv, item, n, this.itemSpec(item));
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

  chunkAt(x: number, y: number): Chunk | undefined {
    const S = this.config.chunkSize;
    return this.chunks.get(this.chunkKey(Math.floor(x / S), Math.floor(y / S)));
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

  private pickUpRune(): boolean {
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
      this.message('Non hai rune in mano.', 'warn');
      return false;
    }
    if (this.zone !== 'sim') {
      this.message("Qui non c'è tappeto su cui scrivere.", 'warn');
      return false;
    }
    const width = tokens.reduce((n, t) => n + t.length, 0);
    const { col, row } = this.playerCell();
    const facing = this.playerComp()?.facing;
    const start = facing === 'left' ? { col: col - width, row } : facing === 'right' ? { col: col + 1, row } : { col, row: row + (facing === 'up' ? -1 : 1) };
    for (let i = 0; i < width; i++) {
      const c = start.col + i;
      if (this.runeCells.has(`${c},${start.row}`) || !this.freeCell(c, start.row) || !this.inCircle(c, start.row)) {
        this.message("Non c'è spazio per scrivere qui.", 'warn');
        return false;
      }
    }
    let c = start.col;
    for (const token of tokens) {
      this.ecs.spawn({ rune: { token, col: c, row: start.row, source: 'player' } satisfies RuneComp });
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
      this.message('Non hai rune in mano.', 'warn');
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

  /** Reorders the rune hand (drag and drop in the inventory). */
  moveRune(from: number, to: number): void {
    const t = this.hand().tokens;
    if (from < 0 || from >= t.length || to < 0 || to >= t.length) return;
    const [tok] = t.splice(from, 1);
    t.splice(to, 0, tok);
    this.hand().sel = to;
  }

  // --- Inventory -------------------------------------------------------------------------------

  private pickUpItem(): boolean {
    const pc = this.playerCarpet();
    const [dx, dy] = this.facingDelta();
    let best: Id | undefined;
    let bestD = 1.3;
    for (const id of this.ecs.query('pickup', 'pos')) {
      const p = this.ecs.get(id, 'pos');
      const d = Math.min(Math.hypot(p.x - pc.x, p.y - pc.y), Math.hypot(p.x - pc.x - dx * 0.6, p.y - pc.y - dy * 0.6));
      if (d < bestD) [best, bestD] = [id, d];
    }
    if (best === undefined) return false;
    const pk = this.ecs.get(best, 'pickup');
    const info = this.itemInfo(pk.item);
    const added = addItem(this.inventory(), pk.item, pk.count, info.spec);
    if (!added) {
      this.message("L'inventario è pieno.", 'warn');
      return true;
    }
    pk.count -= added;
    if (pk.count <= 0) {
      const origin = this.ecs.get(best, 'origin')?.key;
      if (origin) this.consumed.add(origin);
      this.ecs.destroy(best);
    }
    this.bus.emit('item:picked', { item: pk.item });
    this.message(`Raccolto: ${info.name}${added > 1 ? ` ×${added}` : ''}`);
    return true;
  }

  useSlot(index: number): void {
    const inv = this.inventory();
    const slot = inv.slots[index];
    if (!slot) return;
    const info = this.itemInfo(slot.item);
    if (!this.sandbox.has(slot.item, 'on_use')) {
      if (info.spec.equippable) return this.equipSlot(index);
      this.message(`${info.name}: non sai come usarlo.`, 'warn');
      return;
    }
    const { value, failed } = this.runModule(slot.item, 'on_use', this.playerId, slot.item);
    if (!failed && typeof value === 'string' && value) this.message(value);
    this.bus.emit('item:used', { item: slot.item });
  }

  equipSlot(index: number): void {
    const inv = this.inventory();
    const slot = inv.slots[index];
    if (!slot) {
      inv.equipped = null;
      return;
    }
    const info = this.itemInfo(slot.item);
    if (!info.spec.equippable) {
      this.message(`${info.name} non si può impugnare.`, 'warn');
      return;
    }
    inv.equipped = inv.equipped === index ? null : index;
    this.message(inv.equipped === null ? `Riponi ${info.name}.` : `Impugni ${info.name}. F per usarlo.`);
  }

  /** Hotbar keys 1–6: equip what can be held, use the rest. */
  hotbar(index: number): void {
    const slot = this.inventory().slots[index];
    if (!slot) return;
    if (this.itemInfo(slot.item).spec.equippable) this.equipSlot(index);
    else this.useSlot(index);
  }

  /** F: the held item acts on what is in front of you. */
  action(): void {
    const inv = this.inventory();
    const item = equippedItem(inv);
    if (!item) {
      this.message('Non impugni nulla (1–6 o inventario).', 'warn');
      return;
    }
    const pc = this.playerCarpet();
    const [dx, dy] = this.facingDelta();
    const target = this.nearest(pc.x + dx * 0.9, pc.y + dy * 0.9, 1.1) ?? null;
    if (!this.sandbox.has(item, 'on_action')) {
      this.message(`${this.itemInfo(item).name} non fa nulla così.`, 'warn');
      return;
    }
    const { value, failed } = this.runModule(item, 'on_action', this.playerId, target, item);
    if (!failed && typeof value === 'string' && value) this.message(value);
    this.bus.emit('item:action', { item, target });
  }

  dropSlot(index: number, count?: number): void {
    if (this.zone !== 'sim') return;
    const taken = takeFromSlot(this.inventory(), index, count);
    if (!taken) return;
    const pc = this.playerCarpet();
    const [dx, dy] = this.facingDelta();
    const m = this.modules.get(taken.item);
    if (!m) return;
    const id = this.spawnModuleEntity(m, pc.x + dx * 0.8, pc.y + dy * 0.8);
    this.ecs.get(id, 'pickup').count = taken.count;
    this.message(`Posi: ${m.manifest.name}${taken.count > 1 ? ` ×${taken.count}` : ''}`);
  }

  moveSlot(from: number, to: number): void {
    moveSlot(this.inventory(), from, to, this.itemSpec);
  }

  /** Drag one item onto another: the Council decides if they combine, forging the result if needed. */
  async combine(a: number, b: number): Promise<string> {
    const inv = this.inventory();
    const sa = inv.slots[a];
    const sb = inv.slots[b];
    if (!sa || !sb || a === b) return '';
    const ia = this.itemInfo(sa.item);
    const ib = this.itemInfo(sb.item);
    const items = [...this.modules.values()].filter((m) => m.manifest.kind === 'item');
    let verdict;
    try {
      verdict = await judgeCombination(this.council, ia, ib, items.map((m) => m.manifest.name));
    } catch (e) {
      return `Il Concilio non risponde: ${(e as Error).message}`;
    }
    if (!verdict.possible || !verdict.result) return verdict.reason;
    let result = items.find((m) => m.manifest.name.toLowerCase() === verdict.result!.toLowerCase())?.manifest.id;
    if (!result) {
      if (this.forgesUsed >= this.config.ai.maxForges) return 'Il Concilio ha già forgiato abbastanza per oggi.';
      this.forgesUsed++;
      const r = await this.forgeModule(`${verdict.result}: ${verdict.description ?? ''} (ottenuto combinando ${ia.name} e ${ib.name})`, 'combinazione', 'strumento');
      if (!r.ok || !r.id) return r.summary;
      result = r.id;
    }
    removeItem(inv, sa.item, 1);
    removeItem(inv, sb.item, 1);
    addItem(inv, result, 1, this.itemSpec(result));
    const name = this.itemInfo(result).name;
    this.message(`${ia.name} + ${ib.name} → ${name}`, 'good');
    return `${verdict.reason} Ottieni: ${name}.`;
  }

  // --- Interaction ----------------------------------------------------------------------------

  /** E: corona → edit code; carpet → rune, item, then talk/read/use the nearest entity. */
  async interact(): Promise<void> {
    if (this.zone === 'corona') {
      const p = this.playerPos();
      const cell = this.corona.at(Math.floor(p.x), Math.floor(p.y));
      if (cell?.path) this.bus.emit('ui:edit', { path: cell.path, line: cell.line ?? 1 });
      return;
    }
    if (this.pickUpRune() || this.pickUpItem()) return;
    const pc = this.playerCarpet();
    let best: Id | null = null;
    let bestD = 1.7;
    for (const id of this.ecs.query('interact', 'pos')) {
      const p = this.ecs.get(id, 'pos');
      const d = Math.hypot(p.x - pc.x, p.y - pc.y);
      if (d < bestD) [best, bestD] = [id, d];
    }
    if (best === null) return;
    const it = this.ecs.get(best, 'interact');
    const modId: string = this.ecs.get(best, 'module')?.id;
    const m = this.modules.get(modId)?.manifest;
    const speaker = m?.name ?? 'Qualcuno';
    if (it.type === 'talk') {
      this.bus.emit('ui:chat', { id: best, name: speaker });
      return;
    }
    if (it.type === 'lua') {
      const { value, failed } = this.runModule(modId, 'on_interact', best, this.playerId);
      if (!failed && typeof value === 'string') this.bus.emit('ui:dialog', { speaker, text: value });
      return;
    }
    try {
      const text = await narrate(this.council, { name: speaker, description: m?.description ?? '', lore: m?.lore }, this.worldFacts());
      this.bus.emit('ui:dialog', { speaker, text });
    } catch (e) {
      this.bus.emit('ui:dialog', { speaker, text: `(le parole si confondono: ${(e as Error).message})` });
    }
  }

  private worldFacts(): Record<string, unknown> {
    const p = this.playerPos();
    const held = equippedItem(this.inventory());
    return {
      distanceToEdge: Math.round((this.config.circleRadius - Math.hypot(p.x, p.y)) * 10) / 10,
      luogo: this.placeHere()?.name,
      ora: Math.floor(this.time),
      viandanteImpugna: held ? this.itemInfo(held).name : 'niente',
    };
  }

  /** Talks to an NPC: the Narrator plays its persona; the chosen action is validated and applied. */
  async talk(id: Id, text: string): Promise<NpcReply> {
    const m = this.modules.get(this.ecs.get(id, 'module')?.id)?.manifest;
    if (!m?.persona || !this.ecs.alive.has(id)) return { say: '…', action: 'nessuna', mood: '' };
    let mind: Mind = this.ecs.get(id, 'mind');
    if (!mind) mind = this.ecs.set(id, 'mind', { mode: 'vaga', mood: 'tranquillo', history: [] });
    mind.history ??= [];
    const inv: Inventory | undefined = this.ecs.get(id, 'inventory');
    const carrying = inv ? inv.slots.filter(Boolean).map((s) => this.itemInfo(s!.item).name) : [];
    let reply: NpcReply;
    try {
      reply = await npcReply(this.council, { name: m.name, persona: m.persona, mood: mind.mood, mode: mind.mode, carrying, place: this.placeHere()?.name ?? '', history: mind.history, facts: this.worldFacts() }, text);
    } catch (e) {
      return { say: `(${m.name} ti guarda in silenzio — ${(e as Error).message})`, action: 'nessuna', mood: mind.mood };
    }
    mind.history.push({ who: 'giocatore', text }, { who: 'npc', text: reply.say });
    if (mind.history.length > 16) mind.history.splice(0, mind.history.length - 16);
    mind.mood = reply.mood;
    if (reply.action === 'segui' || reply.action === 'resta' || reply.action === 'vaga') mind.mode = reply.action;
    if (reply.action === 'dai') {
      const slot = inv?.slots.find((s) => s && this.itemInfo(s.item).name.toLowerCase() === (reply.item ?? '').toLowerCase()) ?? inv?.slots.find(Boolean);
      if (slot && inv && addItem(this.inventory(), slot.item, 1, this.itemSpec(slot.item))) {
        removeItem(inv, slot.item, 1);
        this.message(`${m.name} ti dà: ${this.itemInfo(slot.item).name}`, 'good');
      } else reply.action = 'nessuna';
    }
    this.speak(id, reply.say);
    return reply;
  }

  placeHere(): Place | undefined {
    const pc = this.playerCarpet();
    return this.chunkAt(pc.x, pc.y)?.place;
  }

  /** Tooltip contents for a real-space point. */
  hoverAt(rx: number, ry: number): HoverInfo | null {
    const p = this.playerPos();
    if (Math.hypot(rx - p.x, ry - p.y) < 0.5) return { kind: 'player' };
    const R = this.config.circleRadius;
    if (Math.hypot(rx, ry) >= R && this.coronaRevealed()) {
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
        const mind: Mind | undefined = this.ecs.get(eid, 'mind');
        const pk = this.ecs.get(eid, 'pickup');
        const extra = mind ? `umore: ${mind.mood}` : pk ? `E per raccogliere${pk.count > 1 ? ` (×${pk.count})` : ''}` : undefined;
        return { kind: 'entity', name: m?.name ?? '???', description: m?.description ?? '', extra };
      }
    }
    const t = this.tileAt(Math.floor(cx), Math.floor(cy));
    return t ? { kind: 'tile', name: this.palette[t]?.name ?? t } : null;
  }

  // --- The Forge and Genesis ---------------------------------------------------------------------

  /** Forges a module through the Council, then validates, stores its sprite, commits and hot loads it. */
  async forgeModule(prompt: string, origin: ForgeOrigin, kind?: 'npc' | 'oggetto' | 'strumento'): Promise<{ ok: boolean; id?: string; summary: string }> {
    const ids = [...this.modules.keys()];
    try {
      const r = await forge(
        this.council,
        { prompt, origin, kind, existingIds: ids, paletteCodes: Object.keys(this.palette).filter((c) => c !== '?' && !this.palette[c].solid) },
        (m, logic) => this.validator.validateForged(m, logic, new Set(ids)),
      );
      if (r.sprite && this.imageTools) {
        try {
          r.manifest.appearance!.sprite = await this.assets.put(await this.imageTools.cutSprite(r.sprite, 160));
        } catch (e) {
          this.council.say('artista', 'errore', `sprite: ${(e as Error).message}`);
        }
      }
      const dir = `modules/${r.id}/`;
      this.repo.write(`${dir}manifest.json`, JSON.stringify(r.manifest, null, 2) + '\n');
      this.repo.write(`${dir}logic.lua`, r.logic.endsWith('\n') ? r.logic : r.logic + '\n');
      this.recordInBible(r.manifest);
      this.applyFiles({ ...this.repo.working });
      const c = this.repo.commit(`${origin}: ${r.summary}`, 'agent');
      this.log('agent', `${r.summary} (commit ${c.id})`);
      this.council.say('kernel', 'approva', `${r.summary} → validato, commit ${c.id}, caricato a caldo`);
      this.bus.emit('forge:done', { id: r.id, summary: r.summary });
      return { ok: true, id: r.id, summary: r.summary };
    } catch (e) {
      const msg = (e as Error).message;
      this.council.say('kernel', 'errore', `Fucina: ${msg}`);
      return { ok: false, summary: `Il Concilio non è riuscito a creare un modulo valido: ${msg}` };
    }
  }

  /** The Narrator's memory: every new being or thing becomes part of the world bible. */
  /** An individual already walks the loaded world. */
  private uniqueTaken(m: ModuleEntry): boolean {
    return !!m.manifest.unique && this.ecs.query('module').some((id) => this.ecs.get(id, 'module').id === m.manifest.id);
  }

  /**
   * Generated code is never allowed to break the world: if a module the Council wrote fails at runtime,
   * the Engineer receives the error and fixes it (once per module per session); the fix is validated,
   * committed and hot loaded. Faults of hand-written modules and of the player's code are left alone.
   */
  async repairGenerated(faultKey: string, message: string): Promise<boolean> {
    const m = /^module:([^:]+):(\w+)$/.exec(faultKey);
    if (!m || m[2] === 'load') return false;
    const entry = this.modules.get(m[1]);
    const origin = entry?.manifest.origin;
    if (!entry?.logicPath || !origin || origin === 'esempio' || this.repaired.has(m[1])) return false;
    // If the player rewrote this module, breaking it was their right.
    if (this.repo.lastAuthorOf(entry.logicPath) !== 'agent') return false;
    this.repaired.add(m[1]);
    this.council.say('kernel', 'obietta', `${m[1]}.${m[2]} fallisce durante il gioco: ${message}`, 'ingegnere', 'forge.fix');
    let feedback = '';
    for (let round = 0; round < 2; round++) {
      try {
        const logic = await repairLogic(this.council, entry.manifest, this.repo.working[entry.logicPath] ?? '', message, feedback);
        const errors = [...this.validator.checkLua(entry.logicPath, logic), ...apiErrors(logic)];
        if (errors.length) {
          feedback = errors.join('; ');
          this.council.say('kernel', 'scarta', feedback, 'ingegnere');
          continue;
        }
        this.repo.write(entry.logicPath, logic.endsWith('\n') ? logic : logic + '\n');
        this.applyFiles({ ...this.repo.working });
        this.faults.clearPrefix(`module:${m[1]}:`);
        const c = this.repo.commit(`riparazione: ${m[1]}`, 'agent');
        this.council.say('ingegnere', 'corregge', `${m[1]} riparato → commit ${c.id}`);
        return true;
      } catch (e) {
        this.council.say('ingegnere', 'errore', (e as Error).message);
        return false;
      }
    }
    return false;
  }

  private recordInBible(m: Manifest): void {
    const bible = readBible(this.repo.working);
    if (!bible) return;
    const line = `${m.name} — ${m.description ?? ''}`.slice(0, 200);
    if (m.persona) bible.personaggi = [...(bible.personaggi ?? []), line].slice(-30);
    else bible.fatti = [...(bible.fatti ?? []), line].slice(-40);
    this.repo.write('world/bible.json', JSON.stringify(bible, null, 2) + '\n');
  }

  /** Asks the in-world agent for a new module (console → Agente). */
  async askAgent(prompt: string): Promise<{ ok: boolean; summary: string }> {
    return this.forgeModule(prompt, 'agente');
  }

  /** The Council generates a whole new universe from a theme. Constants (carpet, movement, physics, runes) stay. */
  async runGenesis(theme: string, onProgress?: (step: string) => void): Promise<boolean> {
    this.generationHeld = true;
    try {
      onProgress?.('Il Concilio si riunisce');
      const plan = await planGenesis(this.council, theme, this.repo.working);
      for (const [p, src] of Object.entries(plan.files)) this.repo.write(p, src);
      // Example content shipped on disk makes room for the generated world.
      for (const m of this.modules.values()) {
        if (m.manifest.origin !== 'esempio') continue;
        for (const p of Object.keys(this.repo.working)) if (p.startsWith(m.dir)) this.repo.write(p, null);
      }
      this.applyFiles({ ...this.repo.working });
      this.consumed.clear();
      let done = 0;
      const queue = [...plan.cast];
      const worker = async () => {
        for (let next = queue.shift(); next; next = queue.shift()) {
          onProgress?.(`La Fucina crea: ${next.richiesta}`);
          await this.forgeModule(next.richiesta, 'genesi', next.tipo);
          done++;
        }
      };
      await Promise.all([worker(), worker()]);
      if (this.models.canPaint && this.imageTools) {
        onProgress?.('L\'Artista ritrae il viandante');
        this.council.say('artista', 'dipinge', `il viandante: ${plan.playerPrompt}`);
        try {
          const raw = await this.council.paint('genesis.player', spritePrompt(this.council, { nome: 'Viandante', aspetto: plan.playerPrompt, tipo: 'npc' }), []);
          if (raw) {
            const sprite = await this.assets.put(await this.imageTools.cutSprite(raw, 160));
            const path = 'modules/core.player/manifest.json';
            const man = JSON.parse(this.repo.working[path]);
            man.appearance = { ...man.appearance, sprite, imagePrompt: plan.playerPrompt };
            this.repo.write(path, JSON.stringify(man, null, 2) + '\n');
          }
        } catch (e) {
          this.council.say('artista', 'errore', (e as Error).message);
        }
      }
      this.applyFiles({ ...this.repo.working });
      this.clearChunks();
      const title = readBible(this.repo.working)?.titolo ?? 'nuovo universo';
      const c = this.repo.commit(`genesi: ${title}`, 'agent');
      this.council.say('kernel', 'approva', `Genesi completata: «${title}», ${done} moduli, commit ${c.id}`);
      this.bus.emit('genesis:done', { title });
      return true;
    } catch (e) {
      this.council.say('kernel', 'errore', `Genesi fallita: ${(e as Error).message}`);
      this.repo.restore();
      this.applyFiles({ ...this.repo.working });
      return false;
    } finally {
      this.generationHeld = false;
    }
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

  /** Dev only: files on disk changed (Vite HMR). */
  syncFromDisk(files: FileMap): void {
    for (const p of Object.keys(this.repo.working)) if (!(p in files)) this.repo.write(p, null);
    for (const [p, src] of Object.entries(files)) this.repo.write(p, src);
    this.applyFiles({ ...this.repo.working });
    const c = this.repo.commit('dev: modifica dal disco', 'dev');
    this.log('dev', `hot reload dal disco → commit ${c.id}`);
  }

  feed(): FeedEntry[] {
    return this.council.feed;
  }

  // --- Tick ------------------------------------------------------------------------------------

  tick(dt: number): void {
    this.time += dt;
    this.tickCount++;
    this.updateChunks();
    this.pumpDevelopment();
    if (!this.generationHeld) this.pumpPainting();
    this.rebuildSolids();
    this.playerComp().load = totalWeight(this.inventory(), this.itemSpec) / CARRY_CAPACITY;
    this.syncRunes();
    this.runRunes();
    for (const s of this.systems) this.runModule(s.manifest.id, 'update', dt);
    this.syncRunes();
    this.sanitize();
    this.updateZone();
    for (const [id, b] of this.bubbles) if (b.until < this.time || !this.ecs.alive.has(id)) this.bubbles.delete(id);
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
