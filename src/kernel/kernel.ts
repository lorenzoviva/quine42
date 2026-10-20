// The kernel: the floor of the universe. Owns the ECS state, the chunks, the sandbox, versioning,
// the assets, the content registry and the Council of agents. Everything above this floor is
// generated (by the Council) or written in Lua, and can break; the floor cannot.

import { World, type Id } from './ecs';
import { EventBus } from './events';
import { Faults } from './faults';
import { Sandbox, type Host } from './sandbox';
import { apiErrors, validateEffects, Validator } from './validator';
import { Repo, type KeyValueStore } from './repo';
import { Corona, type CoronaCell } from './corona';
import { Input } from './input';
import { discoverModules, readConfig } from './universe';
import { CARPET_TOKENS, cellIndex, extractLines, tokenize, type RuneComp, type RuneLine } from './runes';
import { hash32, hashStr, hex, Rng } from './rng';
import { BudgetError, type Models } from './ai/models';
import { MemoryAssets, MemoryChunks, type AssetStore, type ChunkStore } from './assets';
import type { ImageTools } from './imaging';
import { Content, normName, specOf } from './content';
import { layout, type Building } from './layout';
import { ArtDirector } from './art';
import { Council, readBible, type CatalogEntry, type FeedEntry } from './agents/council';
import { planChunk, type ChunkPlan, type Where } from './agents/cartography';
import { forge, judgeCombination, repairLogic, type ForgeOrigin } from './agents/forge';
import { examine, narrate, npcReply, type NpcReply, type Turn } from './agents/minds';
import { planGenesis } from './agents/genesis';
import { judgeAction, nameSpell } from './agents/effects';
import { assemblePack, defineItems, individuate, itemPack, toItemDef, type Identity } from './agents/content';
import { addItem, CARRY_CAPACITY, countItem, equippedItem, moveSlot, newInventory, removeItem, takeFromSlot, totalWeight, type Inventory } from './inventory';
import type { ActionDef, Effect, FileMap, Spell, ItemDef, ItemSpec, Manifest, ModuleEntry, Place, Recipe, RuneFragment, TileDef, UniverseConfig } from './types';

export interface Chunk {
  cx: number;
  cy: number;
  key: string;
  /** The continuous procedural draft (kept to rebuild the layout). */
  draft: string;
  /** size² tile codes: what is drawn and what blocks, the same grid. */
  tiles: string;
  /** Bumped whenever tiles change (renderer cache key). */
  version: number;
  stage: 'draft' | 'planned';
  place?: Place;
  plan?: ChunkPlan;
  buildings: Building[];
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
  category: string;
  spec: ItemSpec;
  effects?: ItemDef['effects'];
  tags: string[];
}

export interface Mind {
  mode: 'vaga' | 'segui' | 'resta';
  mood: string;
  history: Turn[];
}

export interface Container {
  inv: Inventory;
  loot: string;
  filled: boolean;
}

export interface ActionOption {
  id: string;
  label: string;
  enabled: boolean;
  reason?: string;
}

export interface Needs {
  hunger: number;
  thirst: number;
  energy: number;
  health: number;
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

const VOID_TILE: TileDef = { name: 'vuoto', color: '#2a0612', solid: false, layer: 'ground' };
const DEFAULT_ITEM: ItemSpec = { stackable: false, maxStack: 1, weight: 1, equippable: false };
const FALLBACK_PLAYER = {
  player: { speed: 6, facing: 'down', load: 0 },
  hand: { tokens: [] as string[], sel: 0 },
  needs: { hunger: 85, thirst: 85, energy: 90, health: 100 },
};
const STARTER_RUNES = ['x', 'speed = speed', 'luce'];
/** Chunks from the origin (in carpet space) before runes that touch the carpet can appear. */
const CARPET_RUNE_DISTANCE = 3;

const clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

export class Kernel {
  readonly ecs = new World();
  readonly bus = new EventBus();
  readonly faults = new Faults();
  readonly input = new Input();
  readonly content = new Content();
  readonly models: Models;
  readonly assets: AssetStore;
  readonly chunkStore: ChunkStore;
  readonly imageTools?: ImageTools;
  readonly art: ArtDirector;
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
  /** Items people talked about: they turn up more often, where coherent. */
  readonly wanted = new Set<string>();
  /** Entity cells blocked by solid bodies, rebuilt every tick. */
  private solidCells = new Set<string>();
  private runesDirty = true;
  private consumed = new Set<string>();
  private loaded = new Map<string, string>();
  private singletons = new Map<string, Id>();
  private faultFlag: string | null = null;
  private lastGood = { px: 0, py: 0, ox: 0, oy: 0 };
  private forgesUsed = 0;
  private packsUsed = 0;
  private plannedCount = 0;
  private growing = false;
  private forging = new Set<string>();
  private developers = 0;
  private repaired = new Set<string>();
  private examined = new Map<string, string>();
  private lastArtPump = 0;
  /** While true no chunk is planned and nothing is painted (e.g. during genesis). */
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
    this.art = new ArtDirector(this);
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
    const inv = (id: number): Inventory | undefined => this.ecs.get(id, 'inventory');
    return {
      query: (names) => this.ecs.query(...names.split(',').map((s) => s.trim()).filter(Boolean)).join(','),
      get: (id, name) => this.ecs.get(id, name) ?? undefined,
      set: (id, name, data) => {
        // The floor protects what keeps the universe navigable: position, the player, the carpet.
        if (!this.ecs.alive.has(id) || ['pos', 'module', 'chunk', 'carpet', 'container'].includes(name) || (id === this.playerId && ['player', 'hand', 'inventory', 'needs'].includes(name))) return false;
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
        if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
        if (this.content.get(module) && !this.modules.has(module)) return this.spawnItem(module, x, y, 1);
        const m = this.modules.get(module);
        if (!m || (m.manifest.kind !== 'entity' && m.manifest.kind !== 'item')) return undefined;
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
        const i = inv(id);
        return i && Number.isFinite(n) ? removeItem(i, item, n) : 0;
      },
      inv_count: (id, item) => {
        const i = inv(id);
        return i ? countItem(i, item) : 0;
      },
      inv_equipped: (id) => {
        const i = inv(id);
        return (i && equippedItem(i)) ?? undefined;
      },
      item_find: (name) => this.content.byName(name)?.id,
      item_def: (id) => {
        const d = this.content.get(id);
        return d ? { id: d.id, name: d.name, category: d.category, weight: d.weight, tags: d.tags.join(','), effects: { ...(d.effects ?? {}) } } : undefined;
      },
      set_tile: (x, y, code) => this.setTile(Math.floor(x), Math.floor(y), code),
      open: (id) => !!this.openContainer(id),
      make_container: (id, size, loot) => {
        if (!this.ecs.alive.has(id) || id === this.playerId || this.ecs.has(id, 'container') || this.ecs.has(id, 'pickup') || !this.content.loot[loot]) return false;
        this.ecs.set(id, 'container', { inv: newInventory(Math.max(1, Math.min(16, Math.floor(size) || 6))), loot, filled: false } satisfies Container);
        return true;
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

  needs(): Needs | undefined {
    return this.ecs.get(this.playerId, 'needs');
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

  /** Placeable world modules (people, animals, furniture, things), for the Cartographer. */
  catalog(): CatalogEntry[] {
    return [...this.modules.values()]
      .filter((m) => m.manifest.kind === 'entity')
      .map((m) => ({ id: m.manifest.id, name: m.manifest.name, kind: m.manifest.persona ? 'npc' : m.manifest.container ? 'mobile' : 'oggetto', tiles: m.manifest.spawn?.tiles ?? [], context: m.manifest.context ?? m.manifest.description ?? '' }));
  }

  itemInfo(id: string): ItemInfo {
    const d = this.content.get(id);
    return {
      id,
      name: d?.name ?? id,
      description: d?.description ?? 'Qualcosa che non esiste più nel codice del mondo.',
      glyph: d?.glyph ?? '?',
      color: d?.color ?? '#888',
      sprite: d?.icon,
      category: d?.category ?? 'varie',
      spec: specOf(d) ?? DEFAULT_ITEM,
      effects: d?.effects,
      tags: d?.tags ?? [],
    };
  }

  private itemSpec = (id: string): ItemSpec | undefined => specOf(this.content.get(id));

  /** Name of an entity as the player knows it: an individual's name, or its kind. */
  nameOf(id: Id): string {
    const identity: Identity | undefined = this.ecs.get(id, 'identity');
    if (identity) return identity.name;
    const pk = this.ecs.get(id, 'pickup');
    if (pk) return this.itemInfo(pk.item).name;
    return this.modules.get(this.ecs.get(id, 'module')?.id)?.manifest.name ?? 'qualcosa';
  }

  // --- Universe loading & hot reload ----------------------------------------------------------

  /** What makes chunks different: codes, solidity, layers, layouts (not textures or sprites). */
  private worldSignature(): string {
    const pal = Object.entries(this.palette).map(([c, t]) => `${c}${t.solid ? 1 : 0}${t.layer ?? ''}${t.indoor ? 'i' : ''}`);
    return hex(hashStr(pal.join('|') + JSON.stringify(this.content.layouts) + (readBible(this.files)?.titolo ?? '')));
  }

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

    const before = this.palette && this.files ? this.worldSignature() : '';
    this.files = files;
    this.modules = new Map(modules.map((m) => [m.manifest.id, m]));
    this.systems = modules.filter((m) => m.manifest.kind === 'system').sort((a, b) => (a.manifest.order ?? 50) - (b.manifest.order ?? 50));
    this.terrain = modules.find((m) => m.manifest.kind === 'generator');
    this.palette = { '?': VOID_TILE, ...(this.terrain?.manifest.tiles ?? {}) };
    this.fragments = modules.flatMap((m) => m.manifest.fragments ?? []);
    this.content.rebuild(modules);

    this.ensureCoreEntities(opts.reset ?? false);
    for (const id of this.ecs.query('module', 'glyph')) {
      const modId = this.ecs.get(id, 'module').id;
      const app = this.modules.get(modId)?.manifest.appearance;
      if (app && changed.has(modId)) this.ecs.set(id, 'glyph', this.glyphOf(app));
    }
    // Item icons arrive later than the items themselves.
    for (const id of this.ecs.query('pickup', 'glyph')) {
      const d = this.content.get(this.ecs.get(id, 'pickup').item);
      if (d?.icon) this.ecs.get(id, 'glyph').sprite = d.icon;
    }

    if (sizeChanged || (before && before !== this.worldSignature())) this.clearChunks();
    else if (!this.terrain || changed.has(this.terrain.manifest.id) || opts.reset) for (const ch of this.chunks.values()) if (ch.stage === 'draft') this.regenerateDraft(ch);

    this.corona.build(files);
    this.bus.emit('universe:reloaded', { changed: [...changed] });
  }

  private glyphOf(app: NonNullable<Manifest['appearance']>) {
    return { ch: app.glyph, color: app.color, sprite: app.sprite, scale: app.scale ?? 1.1, frames: app.frames };
  }

  private ensureCoreEntities(reset: boolean): void {
    const playerMod = [...this.modules.values()].find((m) => m.manifest.kind === 'player');
    const defaults: Record<string, any> = clone(playerMod?.manifest.components ?? FALLBACK_PLAYER);
    for (const [k, v] of Object.entries(FALLBACK_PLAYER)) if (!defaults[k]) defaults[k] = clone(v);
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

  // --- Chunks: draft → plan (Cartographer) → layout (rules + guaranteed paths) → things ----------

  private chunkKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  private recordKey(ch: Chunk): string {
    return `${this.config.name}:${this.config.seed}:${this.worldSignature()}:${ch.key}`;
  }

  private genDraft(cx: number, cy: number): string {
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

  private regenerateDraft(ch: Chunk): void {
    ch.draft = ch.tiles = this.genDraft(ch.cx, ch.cy);
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
    const draft = this.genDraft(cx, cy);
    const ch: Chunk = { cx, cy, key, draft, tiles: draft, version: 0, stage: 'draft', buildings: [] };
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

  /** Brings a chunk from draft to planned, reusing the cached plan when possible. */
  private async develop(ch: Chunk): Promise<void> {
    const rec = await this.chunkStore.load(this.recordKey(ch));
    if (!this.alive(ch)) return;
    if (rec) return this.applyPlan(ch, rec.plan);
    const plan = await this.makePlan(ch);
    await this.chunkStore.save(this.recordKey(ch), { plan, grid: [], painted: false });
    if (this.alive(ch)) this.applyPlan(ch, plan);
  }

  private terrainSummary(draft: string): string {
    const counts: Record<string, number> = {};
    for (const c of draft) counts[c] = (counts[c] ?? 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([c, n]) => `${this.palette[c]?.name ?? c} ${Math.round((n / draft.length) * 100)}%`)
      .join(', ');
  }

  private async makePlan(ch: Chunk): Promise<ChunkPlan> {
    const start = ch.cx === 0 && ch.cy === 0;
    const layouts = Object.entries(this.content.layouts).map(([id, l]) => ({ id, name: l.name, description: l.description, environment: l.environment }));
    const neighbors = [[0, -1], [0, 1], [-1, 0], [1, 0]]
      .map(([dx, dy]) => this.chunks.get(this.chunkKey(ch.cx + dx, ch.cy + dy)))
      .filter((n): n is Chunk => !!n?.place)
      .map((n) => ({ place: n.place!.name, layout: n.plan?.layout ?? '' }));
    const placeable = new Set(this.catalog().map((c) => c.id));
    let feedback = '';
    for (let attempt = 0; attempt < 3 && layouts.length; attempt++) {
      try {
        const raw = await planChunk(this.council, {
          cx: ch.cx, cy: ch.cy, terrain: this.terrainSummary(ch.draft), neighbors, layouts, catalog: this.catalog(),
          fragments: this.fragments.map((f) => f.line), wanted: [...this.wanted].map((id) => this.itemInfo(id).name).slice(0, 8), start, attempt, feedback,
        });
        const verdict = this.validator.validatePlan(raw, new Set(layouts.map((l) => l.id)), placeable);
        if (verdict.errors.length) {
          feedback = verdict.errors.join('; ');
          this.council.say('kernel', 'scarta', `luogo ${ch.key}: ${feedback} → rigenero`, 'cartografo', 'chunk.plan');
          continue;
        }
        if (verdict.dropped.length) this.council.say('kernel', 'scarta', `(${ch.key}) ${verdict.dropped[0]}${verdict.dropped.length > 1 ? ` (+${verdict.dropped.length - 1})` : ''}`, 'cartografo', 'chunk.plan');
        const plan = verdict.plan;
        this.council.say('cartografo', 'propone', `(${ch.key}) «${plan.place.name}» — ${this.content.layouts[plan.layout]?.name}: ${plan.objects.length} cose, ${plan.ground.length} a terra, ${plan.runes.length} rune${plan.fresh.length ? `, chiede «${plan.fresh[0].concept}»` : ''}`, undefined, 'chunk.plan');
        return plan;
      } catch (e) {
        this.council.say('cartografo', 'errore', `(${ch.key}) ${(e as Error).message}`, undefined, 'chunk.plan');
        if (e instanceof BudgetError) break;
      }
    }
    return this.fallbackPlan(ch, layouts.map((l) => l.id), start);
  }

  private fallbackPlan(ch: Chunk, layouts: string[], start: boolean): ChunkPlan {
    const rng = new Rng(hash32(this.config.seed, ch.cx, ch.cy, 404));
    const trees = [...ch.draft].filter((c) => c === 't').length / ch.draft.length;
    const layoutId = start ? (layouts.find((l) => /borgo|villag|paese/.test(l)) ?? layouts[0]) : trees > 0.3 && layouts.includes('bosco') ? 'bosco' : layouts[rng.int(Math.max(1, layouts.length))];
    const plan: ChunkPlan = { place: { name: 'Terra senza nome', description: 'Qui il mondo non ha ancora trovato le parole.' }, layout: layoutId ?? '', objects: [], ground: [], fresh: [], runes: [] };
    for (const m of this.modules.values()) {
      const rule = m.manifest.spawn;
      if (m.manifest.kind !== 'entity' || !rule) continue;
      for (let i = 0; i < rule.max; i++) if (rng.chance(rule.chance)) plan.objects.push({ module: m.manifest.id, where: rule.tiles.some((t) => this.palette[t]?.indoor) ? 'dentro' : 'fuori' });
    }
    return plan;
  }

  /** Runs the layout and puts things in the world: deterministic, so a cached plan rebuilds the same place. */
  private applyPlan(ch: Chunk, plan: ChunkPlan): void {
    const S = this.config.chunkSize;
    const pathCode = this.palette.p ? 'p' : (Object.keys(this.palette).find((c) => c !== '?' && !this.palette[c].solid) ?? 'g');
    let result;
    try {
      result = layout(this.rows(ch.draft), this.palette, { cx: ch.cx, cy: ch.cy, seed: this.config.seed, program: this.content.layouts[plan.layout]?.program, pathCode });
    } catch (e) {
      this.council.say('kernel', 'errore', `ambiente ${plan.layout} non eseguibile: ${(e as Error).message}`);
      result = layout(this.rows(ch.draft), this.palette, { cx: ch.cx, cy: ch.cy, seed: this.config.seed, pathCode });
    }
    ch.plan = plan;
    ch.place = plan.place;
    ch.tiles = result.grid.join('');
    for (const [cell, code] of Object.entries(plan.edits ?? {})) {
      const i = Number(cell);
      if (Number.isInteger(i) && i >= 0 && i < S * S && this.palette[code]) ch.tiles = ch.tiles.slice(0, i) + code + ch.tiles.slice(i + 1);
    }
    ch.buildings = result.buildings;
    ch.stage = 'planned';
    ch.version++;
    this.plannedCount++;
    for (const id of this.ecs.query('chunk')) if (this.ecs.get(id, 'chunk').key === ch.key) this.ecs.destroy(id);

    // Where things can go: reachable cells, inside or outside buildings, never on gates or doors.
    const rng = new Rng(hash32(this.config.seed, ch.cx, ch.cy, 991));
    const occupied = new Set<number>(result.gates);
    for (const b of result.buildings) for (const d of b.doors) occupied.add(d);
    const indoorSet = new Set(result.buildings.flatMap((b) => b.floor));
    const reach = [...result.reachable];
    const indoor = reach.filter((i) => indoorSet.has(i));
    const outdoor = reach.filter((i) => !indoorSet.has(i) && this.palette[result.grid[Math.floor(i / S)][i % S]]?.layer !== 'door');
    const pick = (where: Where): number | undefined => {
      const pool = (where === 'dentro' && indoor.length ? indoor : where === 'fuori' && outdoor.length ? outdoor : reach).filter((i) => !occupied.has(i));
      if (!pool.length) return undefined;
      const cell = pool[rng.int(pool.length)];
      occupied.add(cell);
      return cell;
    };
    const at = (cell: number) => ({ x: ch.cx * S + (cell % S) + 0.5, y: ch.cy * S + Math.floor(cell / S) + 0.5 });

    // Runes: rare and precious, on a free reachable stretch of a row, anywhere in the chunk. Those that
    // touch the carpet only far from the start (you learn the logic before you can leave); sometimes a magic rune.
    const far = Math.max(Math.abs(ch.cx), Math.abs(ch.cy)) >= CARPET_RUNE_DISTANCE;
    const start = ch.cx === 0 && ch.cy === 0;
    const lines = start ? [...STARTER_RUNES] : plan.runes.filter((l) => !tokenize(l).some((t) => CARPET_TOKENS.has(t)) || (far && rng.chance(0.5))).slice(0, far ? 2 : 1);
    const magic = Object.keys(this.content.runes);
    if (!start && magic.length && rng.chance(0.3)) lines.push(magic[rng.int(magic.length)]);
    const reachSet = result.reachable;
    lines.forEach((line, i) => {
      const toks = tokenize(line);
      const w = toks.length;
      for (let tries = 0; tries < 200; tries++) {
        const row = 1 + rng.int(S - 2);
        const col = 1 + rng.int(Math.max(1, S - 1 - w));
        let ok = col + w <= S - 1;
        for (let k = -1; k <= w && ok; k++) if (occupied.has(row * S + col + k)) ok = false;
        for (let k = 0; k < w && ok; k++) if (!reachSet.has(row * S + col + k) || indoorSet.has(row * S + col + k)) ok = false;
        if (!ok) continue;
        for (let k = 0; k < w; k++) occupied.add(row * S + col + k);
        let c = ch.cx * S + col;
        toks.forEach((token, j) => {
          const origin = `${ch.key}#r${i}.${j}`;
          if (!this.consumed.has(origin)) this.ecs.spawn({ rune: { token, col: c, row: ch.cy * S + row, source: 'gen', origin } satisfies RuneComp, chunk: { key: ch.key } });
          c += 1;
        });
        break;
      }
    });

    plan.objects.forEach((o, i) => {
      const m = this.modules.get(o.module);
      const origin = `${ch.key}#o${i}`;
      if (!m || this.consumed.has(origin) || this.uniqueTaken(m)) return;
      const cell = pick(o.where);
      if (cell === undefined) return;
      const p = at(cell);
      this.spawnModuleEntity(m, p.x, p.y, ch.key, origin);
    });

    // Things lying around: named by the Cartographer, plus what the ground loot table yields.
    const unknown: string[] = [];
    plan.ground.forEach((name, i) => {
      const d = this.content.byName(name);
      if (!d) return void unknown.push(name);
      const origin = `${ch.key}#g${i}`;
      const cell = pick('fuori');
      if (cell !== undefined && !this.consumed.has(origin)) this.spawnItem(d.id, at(cell).x, at(cell).y, 1, ch.key, origin);
    });
    this.content.roll('terreno', rng, [...this.wanted]).forEach((l, i) => {
      const origin = `${ch.key}#l${i}`;
      const cell = pick('ovunque');
      if (cell !== undefined && !this.consumed.has(origin)) this.spawnItem(l.item, at(cell).x, at(cell).y, l.count, ch.key, origin);
    });
    if (unknown.length) void this.introduceItems(unknown, `trovati a terra in «${plan.place.name}»`).then((defs) => {
      if (!this.alive(ch)) return;
      defs.forEach((d, i) => {
        const cell = pick('fuori');
        if (cell !== undefined) this.spawnItem(d.id, at(cell).x, at(cell).y, 1, ch.key, `${ch.key}#n${i}`);
      });
    });
    for (const f of plan.fresh) void this.forgeForChunk(ch, f, pick, at);
    this.runesDirty = true;
    this.bus.emit('chunk:planned', { key: ch.key });
    if (this.plannedCount % 10 === 0) void this.growContent('esplorazione');
  }

  /** The Cartographer asked for something that does not exist yet: the Forge makes it, then it appears. */
  private async forgeForChunk(ch: Chunk, f: { concept: string; where: Where }, pick: (w: Where) => number | undefined, at: (c: number) => { x: number; y: number }): Promise<void> {
    const tag = `${ch.key}:${f.concept}`;
    if (this.forging.has(tag) || this.forgesUsed >= this.config.ai.maxForges) return;
    this.forging.add(tag);
    this.forgesUsed++;
    const r = await this.forgeModule(`${f.concept} (per il luogo «${ch.place?.name}»: ${ch.place?.description})`, 'cartografo');
    this.forging.delete(tag);
    if (!r.ok || !r.id || !ch.plan) return;
    ch.plan.objects.push({ module: r.id, where: f.where });
    ch.plan.fresh = ch.plan.fresh.filter((x) => x !== f);
    await this.chunkStore.save(this.recordKey(ch), { plan: ch.plan, grid: [], painted: false });
    const m = this.modules.get(r.id);
    const cell = pick(f.where);
    if (m && this.alive(ch) && cell !== undefined) this.spawnModuleEntity(m, at(cell).x, at(cell).y, ch.key, `${ch.key}#o${ch.plan.objects.length - 1}`);
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
    if (man.kind === 'item') return this.spawnItem(man.id, x, y, 1, chunkKey, origin);
    const comps: Record<string, any> = {
      ...clone(man.components ?? {}),
      pos: { x, y },
      module: { id: man.id },
      body: { r: man.physics?.radius ?? 0.35, solid: !!man.physics?.solid && !man.physics?.pushable, pushable: !!man.physics?.pushable, mass: man.physics?.mass ?? 1, friction: man.physics?.friction ?? 0.6 },
    };
    if (man.appearance) comps.glyph = this.glyphOf(man.appearance);
    if (man.interaction) comps.interact = { type: man.interaction.type };
    if (man.persona) comps.mind = { mode: 'vaga', mood: 'tranquillo', history: [], ...(comps.mind ?? {}) } satisfies Mind;
    if (man.container) comps.container = { inv: newInventory(man.container.size), loot: man.container.loot, filled: false } satisfies Container;
    if (man.inventory?.length) {
      const inv = newInventory(8);
      for (const it of man.inventory) if (this.content.get(it)) addItem(inv, it, 1, this.itemSpec(it));
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

  /** An item lying on the ground. */
  spawnItem(item: string, x: number, y: number, count = 1, chunkKey?: string, origin?: string): Id {
    const d = this.content.get(item);
    const comps: Record<string, any> = {
      pos: { x, y },
      pickup: { item, count },
      glyph: { ch: d?.glyph ?? '?', color: d?.color ?? '#aaa', sprite: d?.icon, scale: 0.75 },
      body: { r: 0.2, solid: false },
    };
    if (chunkKey) comps.chunk = { key: chunkKey };
    if (origin) comps.origin = { key: origin };
    return this.ecs.spawn(comps);
  }

  private nearest(x: number, y: number, r: number, tag?: string, exclude: Id[] = []): Id | undefined {
    let best: Id | undefined;
    let bestD = r;
    for (const id of this.ecs.query('pos')) {
      if (id === this.playerId || exclude.includes(id) || (!this.ecs.has(id, 'module') && !this.ecs.has(id, 'pickup'))) continue;
      if (tag && !this.hasTag(id, tag)) continue;
      const p = this.ecs.get(id, 'pos');
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bestD) [best, bestD] = [id, d];
    }
    return best;
  }

  private hasTag(id: Id, tag: string): boolean {
    const pk = this.ecs.get(id, 'pickup');
    if (pk) return this.itemInfo(pk.item).tags.includes(tag);
    const m = this.modules.get(this.ecs.get(id, 'module')?.id)?.manifest;
    return !!m?.tags?.includes(tag);
  }

  /** Destroys an entity (never the player) and leaves its drops (and its container's contents) on the ground. */
  private breakEntity(id: Id): void {
    if (id === this.playerId || !this.ecs.alive.has(id) || this.ecs.has(id, 'carpet')) return;
    const m = this.modules.get(this.ecs.get(id, 'module')?.id)?.manifest;
    const p = this.ecs.get(id, 'pos');
    const origin = this.ecs.get(id, 'origin')?.key;
    const box: Container | undefined = this.ecs.get(id, 'container');
    if (origin) this.consumed.add(origin);
    this.ecs.destroy(id);
    if (!p) return;
    for (const d of m?.drops ?? []) {
      if (this.content.get(d)) this.spawnItem(d, p.x, p.y);
      else if (this.modules.get(d)) this.spawnModuleEntity(this.modules.get(d)!, p.x, p.y);
    }
    for (const s of box?.inv.slots ?? []) if (s) this.spawnItem(s.item, p.x + (Math.random() - 0.5) * 0.6, p.y + (Math.random() - 0.5) * 0.6, s.count);
  }

  private invAdd(id: Id, item: string, n: number): number {
    const inv: Inventory | undefined = this.ecs.get(id, 'inventory');
    if (!inv || !this.content.get(item) || !Number.isFinite(n)) return 0;
    return addItem(inv, item, n, this.itemSpec(item));
  }

  /** An individual already walks the loaded world. */
  private uniqueTaken(m: ModuleEntry): boolean {
    return !!m.manifest.unique && this.ecs.query('module').some((id) => this.ecs.get(id, 'module').id === m.manifest.id);
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

  /**
   * Changes one tile of a planned chunk (effects, spells, Lua). Persisted with the place's plan, so
   * a changed world stays changed. The floor refuses a solid tile under the player.
   */
  setTile(col: number, row: number, code: string): boolean {
    const S = this.config.chunkSize;
    const ch = this.chunkAt(col, row);
    const def = this.palette[code];
    if (!ch || ch.stage !== 'planned' || !ch.plan || !def || code === '?') return false;
    if (def.solid) {
      const pc = this.playerCarpet();
      if (Math.abs(pc.x - (col + 0.5)) < 1 && Math.abs(pc.y - (row + 0.5)) < 1) return false;
    }
    const cell = (row - ch.cy * S) * S + (col - ch.cx * S);
    if (ch.tiles[cell] === code) return true;
    ch.tiles = ch.tiles.slice(0, cell) + code + ch.tiles.slice(cell + 1);
    ch.version++;
    (ch.plan.edits ??= {})[String(cell)] = code;
    this.saveChunkSoon(ch);
    return true;
  }

  private saving = new Set<string>();
  private saveChunkSoon(ch: Chunk): void {
    if (this.saving.has(ch.key)) return;
    this.saving.add(ch.key);
    setTimeout(() => {
      this.saving.delete(ch.key);
      if (ch.plan) void this.chunkStore.save(this.recordKey(ch), { plan: ch.plan, grid: [], painted: false });
    }, 500);
  }

  chunkAt(x: number, y: number): Chunk | undefined {
    const S = this.config.chunkSize;
    return this.chunks.get(this.chunkKey(Math.floor(x / S), Math.floor(y / S)));
  }

  /** The building whose floor contains this carpet point (for roofs and interiors). */
  buildingAt(x: number, y: number): { chunk: Chunk; building: Building } | undefined {
    const S = this.config.chunkSize;
    const ch = this.chunkAt(x, y);
    if (!ch) return undefined;
    const cell = (Math.floor(y) - ch.cy * S) * S + (Math.floor(x) - ch.cx * S);
    const building = ch.buildings.find((b) => b.floor.includes(cell) || b.doors.includes(cell));
    return building ? { chunk: ch, building } : undefined;
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
    const width = tokens.length;
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
      c += 1;
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

  // --- Inventory, containers, crafting ---------------------------------------------------------

  private pickUpEntity(id: Id): boolean {
    const pk = this.ecs.get(id, 'pickup');
    if (!pk) return false;
    const info = this.itemInfo(pk.item);
    const added = addItem(this.inventory(), pk.item, pk.count, info.spec);
    if (!added) {
      this.message("L'inventario è pieno.", 'warn');
      return true;
    }
    pk.count -= added;
    if (pk.count <= 0) {
      const origin = this.ecs.get(id, 'origin')?.key;
      if (origin) this.consumed.add(origin);
      this.ecs.destroy(id);
    }
    this.bus.emit('item:picked', { item: pk.item });
    this.message(`Raccolto: ${info.name}${added > 1 ? ` ×${added}` : ''}`);
    return true;
  }

  useSlot(index: number): void {
    const slot = this.inventory().slots[index];
    if (!slot) return;
    const def = this.content.get(slot.item);
    const custom = def?.module && this.sandbox.has(def.module, 'on_use') ? def.module : null;
    if (!custom && def?.equippable && !def.effects && !['luce', 'vestiario'].includes(def.category)) return this.equipSlot(index);
    const { value, failed } = this.runModule(custom ?? 'core.items', custom ? 'on_use' : 'use', this.playerId, slot.item);
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
    this.message(inv.equipped === null ? `Riponi ${info.name}.` : `Impugni ${info.name}. F per usarlo su ciò che hai davanti.`);
  }

  /** Hotbar keys 1–6: equip what can be held, use the rest. */
  hotbar(index: number): void {
    const slot = this.inventory().slots[index];
    if (!slot) return;
    if (this.itemInfo(slot.item).spec.equippable) this.equipSlot(index);
    else this.useSlot(index);
  }

  /** F: the held item acts on what is in front of you. */
  action(target?: Id): void {
    const item = equippedItem(this.inventory());
    if (!item) {
      this.message('Non impugni nulla (1–6 o inventario).', 'warn');
      return;
    }
    const pc = this.playerCarpet();
    const [dx, dy] = this.facingDelta();
    const t = target ?? this.nearest(pc.x + dx * 0.9, pc.y + dy * 0.9, 1.1) ?? null;
    const def = this.content.get(item);
    if (def?.module && this.sandbox.has(def.module, 'on_action')) {
      const { value, failed } = this.runModule(def.module, 'on_action', this.playerId, t, item);
      if (!failed && typeof value === 'string' && value) this.message(value);
    } else if (t !== null && def?.tags.includes('taglio') && this.hasTag(t, 'tagliabile')) {
      this.breakEntity(t);
      this.message(`Con ${def.name} abbatti ciò che hai davanti.`);
    } else this.message(`${this.itemInfo(item).name} non fa nulla così.`, 'warn');
    this.bus.emit('item:action', { item, target: t });
  }

  dropSlot(index: number, count?: number): void {
    if (this.zone !== 'sim') return;
    const taken = takeFromSlot(this.inventory(), index, count);
    if (!taken) return;
    const pc = this.playerCarpet();
    const [dx, dy] = this.facingDelta();
    this.spawnItem(taken.item, pc.x + dx * 0.8, pc.y + dy * 0.8, taken.count);
    this.message(`Posi: ${this.itemInfo(taken.item).name}${taken.count > 1 ? ` ×${taken.count}` : ''}`);
  }

  moveSlot(from: number, to: number): void {
    moveSlot(this.inventory(), from, to, this.itemSpec);
  }

  container(id: Id): Container | undefined {
    return this.ecs.get(id, 'container');
  }

  /** First opening fills the container from its loot table (things people talked about turn up more). */
  openContainer(id: Id): Container | undefined {
    const box = this.container(id);
    if (!box) return undefined;
    if (!box.filled) {
      box.filled = true;
      const origin = this.ecs.get(id, 'origin')?.key ?? `e${id}`;
      const rng = new Rng(hash32(this.config.seed, hashStr(origin), 7));
      for (const l of this.content.roll(box.loot, rng, [...this.wanted])) addItem(box.inv, l.item, l.count, this.itemSpec(l.item));
    }
    this.bus.emit('ui:container', { id, name: this.nameOf(id) });
    return box;
  }

  takeFromContainer(id: Id, slot: number): void {
    const box = this.container(id);
    const s = box?.inv.slots[slot];
    if (!box || !s) return;
    const moved = addItem(this.inventory(), s.item, s.count, this.itemSpec(s.item));
    if (!moved) return this.message("L'inventario è pieno.", 'warn');
    takeFromSlot(box.inv, slot, moved);
    this.message(`Prendi: ${this.itemInfo(s.item).name}${moved > 1 ? ` ×${moved}` : ''}`);
  }

  putIntoContainer(id: Id, slot: number): void {
    const box = this.container(id);
    const s = this.inventory().slots[slot];
    if (!box || !s) return;
    const moved = addItem(box.inv, s.item, s.count, this.itemSpec(s.item));
    if (moved) takeFromSlot(this.inventory(), slot, moved);
  }

  /** Recipes the player can make now, and all known ones. */
  recipes(): { available: Set<string>; all: Recipe[] } {
    const inv = this.inventory();
    const ok = this.content.craftable((item) => countItem(inv, item));
    return { available: new Set(ok.map((r) => r.id)), all: this.content.recipes };
  }

  craft(recipeId: string): boolean {
    const r = this.content.recipes.find((x) => x.id === recipeId);
    const inv = this.inventory();
    if (!r || !this.content.craftable((item) => countItem(inv, item)).includes(r)) {
      this.message('Ti manca qualcosa per farlo.', 'warn');
      return false;
    }
    for (const i of r.inputs) removeItem(inv, i.item, i.count);
    const added = addItem(inv, r.output.item, r.output.count, this.itemSpec(r.output.item));
    if (added < r.output.count) {
      const pc = this.playerCarpet();
      this.spawnItem(r.output.item, pc.x, pc.y, r.output.count - added);
    }
    this.message(`Hai fatto: ${this.itemInfo(r.output.item).name}${r.output.count > 1 ? ` ×${r.output.count}` : ''}`, 'good');
    this.bus.emit('item:crafted', { recipe: r.id });
    return true;
  }

  /** Drag one item onto another: the Council decides if they combine, forging the result if needed. */
  async combine(a: number, b: number): Promise<string> {
    const inv = this.inventory();
    const sa = inv.slots[a];
    const sb = inv.slots[b];
    if (!sa || !sb || a === b) return '';
    const ia = this.itemInfo(sa.item);
    const ib = this.itemInfo(sb.item);
    const known = [...this.content.items.values()];
    let verdict;
    try {
      verdict = await judgeCombination(this.council, ia, ib, known.map((d) => d.name).slice(-150));
    } catch (e) {
      return `Il Concilio non risponde: ${(e as Error).message}`;
    }
    if (!verdict.possible || !verdict.result) return verdict.reason;
    let result = this.content.byName(verdict.result)?.id;
    if (!result) {
      const defs = await this.introduceItems([verdict.result], `ottenuto combinando ${ia.name} e ${ib.name}: ${verdict.description ?? ''}`);
      result = defs[0]?.id;
      if (!result) return 'Il Concilio non riesce a dare forma al risultato.';
    }
    removeItem(inv, sa.item, 1);
    removeItem(inv, sb.item, 1);
    addItem(inv, result, 1, this.itemSpec(result));
    const name = this.itemInfo(result).name;
    this.message(`${ia.name} + ${ib.name} → ${name}`, 'good');
    return `${verdict.reason} Ottieni: ${name}.`;
  }

  // --- Interaction ----------------------------------------------------------------------------

  /** What can be done to an entity: generic actions, its own actions, the held tool. */
  actionsFor(id: Id): ActionOption[] {
    const out: ActionOption[] = [];
    const m = this.modules.get(this.ecs.get(id, 'module')?.id)?.manifest;
    const inv = this.inventory();
    const has = (req: string) => countItem(inv, req) > 0 || inv.slots.some((s) => s && this.itemInfo(s.item).tags.includes(req));
    if (this.ecs.has(id, 'pickup')) out.push({ id: 'raccogli', label: 'Raccogli', enabled: true });
    const it = this.ecs.get(id, 'interact');
    if (it?.type === 'talk') out.push({ id: 'parla', label: 'Parla', enabled: true });
    if (it?.type === 'read') out.push({ id: 'leggi', label: 'Leggi', enabled: true });
    if (it?.type === 'lua') out.push({ id: 'usa', label: 'Usa', enabled: true });
    if (this.ecs.has(id, 'container')) out.push({ id: 'apri', label: 'Apri', enabled: true });
    for (const a of m?.actions ?? []) {
      const ok = !a.requires || has(a.requires);
      out.push({ id: `act:${a.id}`, label: a.label, enabled: ok, reason: ok ? undefined : `serve: ${this.content.get(a.requires!)?.name ?? a.requires}` });
    }
    const held = equippedItem(inv);
    if (held) out.push({ id: 'strumento', label: `Usa ${this.itemInfo(held).name}`, enabled: true });
    out.push({ id: 'esamina', label: 'Esamina', enabled: true });
    out.push({ id: 'altro', label: 'Altro…', enabled: true });
    return out;
  }

  /** E: corona → edit code; rune → pick; otherwise the menu of the nearest thing (or a pickup directly). */
  async interact(): Promise<void> {
    if (this.zone === 'corona') {
      const p = this.playerPos();
      const cell = this.corona.at(Math.floor(p.x), Math.floor(p.y));
      if (cell?.path) this.bus.emit('ui:edit', { path: cell.path, line: cell.line ?? 1 });
      return;
    }
    if (this.pickUpRune()) return;
    const target = this.targetInFront();
    if (target === undefined) return;
    if (this.ecs.has(target, 'pickup')) {
      this.pickUpEntity(target);
      return;
    }
    const options = this.actionsFor(target);
    const main = options.filter((o) => o.id !== 'esamina' && o.id !== 'strumento' && o.id !== 'altro');
    if (main.length === 1 && main[0].enabled && options.length <= 3) return this.perform(target, main[0].id);
    this.bus.emit('ui:actions', { id: target, name: this.nameOf(target), options });
  }

  /** The thing you are facing (or standing next to). */
  targetInFront(): Id | undefined {
    const pc = this.playerCarpet();
    const [dx, dy] = this.facingDelta();
    return this.nearest(pc.x + dx * 0.6, pc.y + dy * 0.6, 1.4) ?? this.nearest(pc.x, pc.y, 1.2);
  }

  async perform(id: Id, action: string): Promise<void> {
    if (!this.ecs.alive.has(id)) return;
    const modId: string | undefined = this.ecs.get(id, 'module')?.id;
    const m = modId ? this.modules.get(modId)?.manifest : undefined;
    const speaker = this.nameOf(id);
    const say = (text: string) => this.bus.emit('ui:dialog', { speaker, text });
    switch (action) {
      case 'raccogli':
        this.pickUpEntity(id);
        return;
      case 'parla':
        await this.ensureIdentity(id);
        this.bus.emit('ui:chat', { id, name: this.nameOf(id) });
        return;
      case 'apri':
        this.openContainer(id);
        return;
      case 'strumento':
        this.action(id);
        return;
      case 'altro':
        this.bus.emit('ui:freeaction', { id, name: speaker });
        return;
      case 'usa': {
        const { value, failed } = this.runModule(modId!, 'on_interact', id, this.playerId);
        if (!failed && typeof value === 'string') say(value);
        return;
      }
      case 'leggi':
        try {
          say(await narrate(this.council, { name: speaker, description: m?.description ?? '', lore: m?.lore }, this.worldFacts()));
        } catch (e) {
          say(`(le parole si confondono: ${(e as Error).message})`);
        }
        return;
      case 'esamina': {
        const identity: Identity | undefined = this.ecs.get(id, 'identity');
        const key = `${modId ?? this.ecs.get(id, 'pickup')?.item}|${identity?.name ?? ''}`;
        let text = this.examined.get(key);
        if (!text) {
          const pk = this.ecs.get(id, 'pickup');
          const what = pk ? this.itemInfo(pk.item) : { name: speaker, description: `${m?.description ?? ''}${identity ? ` ${identity.look}` : ''}`, lore: m?.lore };
          try {
            text = await examine(this.council, { name: what.name, description: what.description, lore: (what as { lore?: string }).lore }, this.worldFacts());
            this.examined.set(key, text);
          } catch (e) {
            text = `${what.description} (${(e as Error).message})`;
          }
        }
        say(text);
        return;
      }
      default:
        if (action.startsWith('act:') && modId) {
          const a = m?.actions?.find((x) => `act:${x.id}` === action);
          const opt = this.actionsFor(id).find((o) => o.id === action);
          if (!a || !opt?.enabled) return say(opt?.reason ?? 'Non puoi farlo.');
          if (a.effects?.length) {
            const out = this.applyEffects(a.effects, id);
            return say(out.join(' ') || `${a.label}: fatto.`);
          }
          const { value, failed } = this.runModule(modId, 'on_act', id, this.playerId, a.id);
          if (!failed) say(typeof value === 'string' && value ? value : `${a.label}: fatto.`);
        }
    }
  }

  /**
   * "Altro…": the player writes what they do. Actions the object already learned run directly; otherwise
   * the Narrator judges, the validator keeps only known effects, core.effects applies them, and a
   * sensible repeatable action is learned by the object's module (committed, so it stays).
   */
  async freeAction(id: Id, text: string): Promise<string> {
    text = text.trim().slice(0, 200);
    if (!text || !this.ecs.alive.has(id)) return '';
    const modId: string | undefined = this.ecs.get(id, 'module')?.id;
    const entry = modId ? this.modules.get(modId) : undefined;
    const m = entry?.manifest;
    const learned = m?.actions?.find((a) => a.effects?.length && normName(a.label) === normName(text));
    if (learned) {
      await this.perform(id, `act:${learned.id}`);
      return learned.label;
    }
    const pk = this.ecs.get(id, 'pickup');
    const info = pk ? this.itemInfo(pk.item) : undefined;
    const identity: Identity | undefined = this.ecs.get(id, 'identity');
    const p = this.ecs.get(id, 'pos');
    const tile = p ? (this.palette[this.tileAt(Math.floor(p.x), Math.floor(p.y)) ?? '']?.name ?? '?') : '?';
    const inv = this.inventory();
    const held = equippedItem(inv);
    const summonable = [...this.modules.values()].filter((e) => e.manifest.kind === 'entity' && !e.manifest.unique);
    const say = (t: string) => this.bus.emit('ui:dialog', { speaker: this.nameOf(id), text: t });
    this.council.say('kernel', 'info', `il viandante prova: «${text}» su ${this.nameOf(id)}`, 'narratore', 'action.judge');
    let j;
    try {
      j = await judgeAction(this.council, {
        text,
        target: {
          name: this.nameOf(id),
          description: info?.description ?? `${m?.description ?? ''}${identity ? ` ${identity.look}` : ''}`,
          tags: info?.tags ?? m?.tags ?? [],
          container: this.ecs.has(id, 'container'),
          kind: pk ? 'oggetto a terra' : m?.persona ? 'persona' : this.ecs.has(id, 'container') ? 'mobile' : 'cosa',
        },
        carrying: inv.slots.filter((s): s is NonNullable<typeof s> => !!s).map((s) => this.itemInfo(s.item).name),
        holding: held ? this.itemInfo(held).name : 'niente',
        tile,
        terrains: Object.entries(this.palette).filter(([c]) => c !== '?').map(([, t]) => t.name),
        summonable: summonable.map((e) => e.manifest.name),
        loot: Object.keys(this.content.loot),
        place: this.placeHere()?.name ?? '',
      });
    } catch (e) {
      const msg = `(il Concilio tace: ${(e as Error).message})`;
      say(msg);
      return msg;
    }
    // What it needs must really be in the pockets.
    const need = j.requires ? this.content.byName(j.requires) : undefined;
    if (j.possible && need && countItem(inv, need.id) <= 0) {
      say(`${j.story} Ma ti serve ${need.name}.`.trim());
      return j.story;
    }
    const ectx = {
      palette: this.palette,
      item: (n: string) => this.content.byName(n)?.id,
      module: (n: string) => summonable.find((e) => e.manifest.id === n || normName(e.manifest.name) === normName(n))?.manifest.id,
      loot: new Set(Object.keys(this.content.loot)),
    };
    let v = validateEffects(j.possible ? j.effects : [], ectx);
    if (v.unknownItems.length) {
      await this.introduceItems(v.unknownItems, `nati dall'azione «${text}» su ${this.nameOf(id)}`);
      v = validateEffects(j.possible ? j.effects : [], ectx);
    }
    if (v.dropped.length) this.council.say('kernel', 'scarta', `azione «${text}»: ${v.dropped.join('; ')}`, 'narratore', 'action.judge');
    this.council.say('narratore', j.possible ? 'approva' : 'obietta', `«${text}» su ${this.nameOf(id)}: ${j.story}${v.effects.length ? ` [${v.effects.map((e) => e.tipo).join(', ')}]` : ''}`, undefined, 'action.judge');
    const out = j.possible ? this.applyEffects(v.effects, id) : [];
    say([j.story, ...out].filter(Boolean).join(' ') || 'Non succede niente.');
    const lasting = v.effects.some((e) => e.tipo !== 'messaggio');
    const oneOff = v.effects.some((e) => e.tipo === 'evoca' || e.tipo === 'crea_oggetto' || e.tipo === 'contenitore');
    if (j.possible && j.repeatable && lasting && !oneOff && entry && !m?.persona) this.learnAction(entry, { id: '', label: j.label || text, requires: need?.id, effects: v.effects });
    return j.story;
  }

  /** Magic runes in hand, in their order: the incantation T would cast. */
  incantation(): string[] {
    return this.hand().tokens.filter((t) => this.content.runes[t]);
  }

  private castingNow = false;

  /**
   * T: the magic runes in hand, in order, are an incantation. Known ones are cast at once; a sequence
   * never spoken before is named once by the Narrator (and kept, committed, in magic.spells). Costs energy.
   */
  async castSpell(): Promise<boolean> {
    if (this.castingNow) return false;
    const seq = this.incantation();
    if (!seq.length) {
      this.message(this.hand().tokens.length ? 'Nessuna delle rune che hai in mano è magica.' : 'Non hai rune in mano.', 'warn');
      return false;
    }
    if (this.zone !== 'sim') {
      this.message('Qui la magia non ha niente su cui agire.', 'warn');
      return false;
    }
    const key = seq.join(' ');
    this.castingNow = true;
    try {
      let spell: Spell | undefined = this.content.spells[key];
      if (!spell) {
        this.message(`Pronunci ${seq.map((t) => this.content.runes[t].name).join(' · ')}… il mondo esita.`);
        spell = await this.inventSpell(seq);
        if (!spell) {
          this.message("Le rune si spengono: questa sequenza non vuol dire niente, per ora.", 'warn');
          return false;
        }
      }
      const n = this.needs();
      if (n && n.energy < spell.cost) {
        this.message(`«${spell.name}» chiede più forze di quante te ne restino (${spell.cost}).`, 'warn');
        return false;
      }
      const ctx = {
        palette: this.palette,
        item: (x: string) => this.content.byName(x)?.id ?? (this.content.get(x) ? x : undefined),
        module: (x: string) => (this.modules.get(x)?.manifest.kind === 'entity' ? x : undefined),
        loot: new Set(Object.keys(this.content.loot)),
      };
      const effects = validateEffects(spell.effects, ctx).effects;
      if (n) n.energy = Math.max(0, n.energy - spell.cost);
      const pc = this.playerCarpet();
      const [dx, dy] = this.facingDelta();
      const at = { x: pc.x + dx * 1.5, y: pc.y + dy * 1.5 };
      const target = this.nearest(at.x, at.y, 1.2);
      const out = this.applyEffects(effects, target, at);
      this.bus.emit('spell:cast', { name: spell.name, at, color: this.content.runes[seq[0]].color });
      this.message(`«${spell.name}»: ${[spell.description, ...out].filter(Boolean).join(' ')}`, 'good');
      return true;
    } finally {
      this.castingNow = false;
    }
  }

  private async inventSpell(seq: string[]): Promise<Spell | undefined> {
    const runes = seq.map((t) => ({ token: t, ...this.content.runes[t] }));
    const known = Object.entries(this.content.spells).map(([sequence, sp]) => ({ sequence, name: sp.name, description: sp.description }));
    let draft;
    try {
      draft = await nameSpell(this.council, runes, known, Object.entries(this.palette).filter(([c]) => c !== '?').map(([, t]) => t.name));
    } catch (e) {
      this.council.say('narratore', 'errore', `incantesimo ${seq.join(' ')}: ${(e as Error).message}`, undefined, 'spell.name');
      return undefined;
    }
    const v = validateEffects(draft.effects, { palette: this.palette, item: (x) => this.content.byName(x)?.id, module: () => undefined, loot: new Set(Object.keys(this.content.loot)) });
    if (v.dropped.length) this.council.say('kernel', 'scarta', `incantesimo «${draft.name}»: ${v.dropped.join('; ')}`, 'narratore', 'spell.name');
    if (!v.effects.length) return undefined;
    const spell: Spell = { name: draft.name, description: draft.description, cost: draft.cost, effects: v.effects };
    const path = 'modules/magic.spells/manifest.json';
    let man: Manifest;
    try {
      man = JSON.parse(this.repo.working[path] ?? 'null') ?? { id: 'magic.spells', name: 'Incantesimi scoperti', kind: 'data', version: '0.1.0', description: 'Sequenze di rune pronunciate dal viandante, a cui il Concilio ha dato un nome e un effetto.', spells: {} };
    } catch {
      return spell;
    }
    man.spells = { ...(man.spells ?? {}), [seq.join(' ')]: spell };
    this.repo.write(path, JSON.stringify(man, null, 2) + '\n');
    this.applyFiles({ ...this.repo.working });
    const c = this.repo.commit(`incantesimo: ${seq.join(' ')} → ${spell.name}`, 'agent');
    this.council.say('narratore', 'propone', `${seq.join(' ')} → «${spell.name}»: ${spell.description} [${spell.effects.map((e) => e.tipo).join(', ')}] (commit ${c.id})`, undefined, 'spell.name');
    return spell;
  }

  /** Day and night: 0 = deep night, 1 = full day. A day lasts DAY_SECONDS; the world is born in the morning. */
  daylight(): number {
    const phase = (this.time / Kernel.DAY_SECONDS + 0.12) % 1;
    const sun = Math.sin(phase * Math.PI * 2);
    return Math.max(0, Math.min(1, 0.5 + sun * 1.4));
  }

  static DAY_SECONDS = 600;

  /** Applies validated effects through core.effects (Lua): the world's own code decides how they happen. */
  applyEffects(effects: Effect[], target?: Id, at?: { x: number; y: number }): string[] {
    const out: string[] = [];
    if (!this.modules.has('core.effects')) return out;
    for (const e of effects) {
      if (target !== undefined && !this.ecs.alive.has(target)) target = undefined;
      const { value, failed } = this.runModule('core.effects', 'apply', target, this.playerId, clone(e), at?.x, at?.y);
      if (failed) break;
      if (typeof value === 'string' && value) out.push(value);
    }
    this.runesDirty = true;
    return out;
  }

  /** An object learns an action: it enters the module's menu, with its effects, for every copy of it. */
  private learnAction(entry: ModuleEntry, def: ActionDef): void {
    const path = entry.manifestPath;
    let man: Manifest;
    try {
      man = JSON.parse(this.repo.working[path] ?? '');
    } catch {
      return;
    }
    const actions = (man.actions ??= []);
    if (actions.length >= 8 || actions.some((a) => normName(a.label) === normName(def.label))) return;
    let id = normName(def.label).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 24) || 'azione';
    while (actions.some((a) => a.id === id)) id += '_';
    const learned: ActionDef = { id, label: def.label, effects: def.effects };
    if (def.requires) learned.requires = def.requires;
    actions.push(learned);
    this.repo.write(path, JSON.stringify(man, null, 2) + '\n');
    this.applyFiles({ ...this.repo.working });
    const c = this.repo.commit(`azione imparata: ${man.name} → ${def.label}`, 'agent');
    this.council.say('kernel', 'approva', `${man.name} impara «${def.label}» (commit ${c.id})`);
  }

  private worldFacts(): Record<string, unknown> {
    const p = this.playerPos();
    const held = equippedItem(this.inventory());
    const n = this.needs();
    return {
      distanceToEdge: Math.round((this.config.circleRadius - Math.hypot(p.x, p.y)) * 10) / 10,
      luogo: this.placeHere()?.name,
      ora: Math.floor(this.time),
      momento: this.daylight() > 0.6 ? 'giorno' : this.daylight() > 0.15 ? 'crepuscolo' : 'notte',
      viandanteImpugna: held ? this.itemInfo(held).name : 'niente',
      viandante: n ? { fame: Math.round(100 - n.hunger), sete: Math.round(100 - n.thirst), stanchezza: Math.round(100 - n.energy) } : undefined,
    };
  }

  /** Behind every character there is an individual: name, story, own pockets (written once, cheap text). */
  async ensureIdentity(id: Id): Promise<Identity | undefined> {
    const existing: Identity | undefined = this.ecs.get(id, 'identity');
    if (existing) return existing;
    const m = this.modules.get(this.ecs.get(id, 'module')?.id)?.manifest;
    if (!m?.persona) return undefined;
    let identity: Identity;
    try {
      identity = await individuate(this.council, { name: m.name, description: m.description ?? '', persona: m.persona }, { place: this.placeHere()?.name ?? '', common: [...this.content.items.values()].map((d) => d.name) });
    } catch {
      identity = { name: m.name, persona: m.persona, look: '', carrying: [] };
    }
    this.ecs.set(id, 'identity', identity);
    const resolved = identity.carrying.map((n) => this.content.byName(n));
    const unknown = identity.carrying.filter((_, i) => !resolved[i]);
    const defs = [...resolved.filter((d): d is ItemDef => !!d), ...(unknown.length ? await this.introduceItems(unknown, `portati da ${identity.name}`) : [])];
    let inv: Inventory | undefined = this.ecs.get(id, 'inventory');
    if (!inv) inv = this.ecs.set(id, 'inventory', newInventory(10));
    for (const d of defs) addItem(inv, d.id, 1, this.itemSpec(d.id));
    this.council.say('narratore', 'propone', `${m.name} → ${identity.name}: ${identity.look} (porta ${defs.map((d) => d.name).join(', ') || 'niente'})`);
    return identity;
  }

  /** Talks to an NPC: the Narrator plays the individual; the chosen action is validated and applied. */
  async talk(id: Id, text: string): Promise<NpcReply> {
    const m = this.modules.get(this.ecs.get(id, 'module')?.id)?.manifest;
    if (!m?.persona || !this.ecs.alive.has(id)) return { say: '…', action: 'nessuna', mood: '' };
    const identity = await this.ensureIdentity(id);
    let mind: Mind = this.ecs.get(id, 'mind');
    if (!mind) mind = this.ecs.set(id, 'mind', { mode: 'vaga', mood: 'tranquillo', history: [] });
    mind.history ??= [];
    const inv: Inventory | undefined = this.ecs.get(id, 'inventory');
    const carrying = inv ? inv.slots.filter(Boolean).map((s) => this.itemInfo(s!.item).name) : [];
    const name = identity?.name ?? m.name;
    let reply: NpcReply;
    try {
      reply = await npcReply(this.council, { name, persona: identity?.persona ?? m.persona, mood: mind.mood, mode: mind.mode, carrying, place: this.placeHere()?.name ?? '', history: mind.history, facts: this.worldFacts() }, text);
    } catch (e) {
      return { say: `(${name} ti guarda in silenzio — ${(e as Error).message})`, action: 'nessuna', mood: mind.mood };
    }
    mind.history.push({ who: 'giocatore', text }, { who: 'npc', text: reply.say });
    if (mind.history.length > 16) mind.history.splice(0, mind.history.length - 16);
    mind.mood = reply.mood;
    if (reply.action === 'segui' || reply.action === 'resta' || reply.action === 'vaga') mind.mode = reply.action;
    if (reply.action === 'dai') {
      const wantedName = normName(reply.item ?? '');
      const slot = inv?.slots.find((s) => s && normName(this.itemInfo(s.item).name) === wantedName) ?? inv?.slots.find((s) => s && wantedName && normName(this.itemInfo(s.item).name).includes(wantedName));
      if (slot && inv && addItem(this.inventory(), slot.item, 1, this.itemSpec(slot.item))) {
        removeItem(inv, slot.item, 1);
        this.message(`${name} ti dà: ${this.itemInfo(slot.item).name}`, 'good');
      } else reply.action = 'nessuna';
    }
    if (reply.mentioned?.length) void this.noteMentions(reply.mentioned, `di cui si parla con ${name}`);
    this.speak(id, reply.say);
    return reply;
  }

  /** Things mentioned in conversation become part of the world: defined if new, then found more often. */
  async noteMentions(names: string[], context: string): Promise<void> {
    const unknown: string[] = [];
    for (const n of names) {
      const d = this.content.byName(n);
      if (d) this.wanted.add(d.id);
      else unknown.push(n);
    }
    if (unknown.length) for (const d of await this.introduceItems(unknown, context)) this.wanted.add(d.id);
    while (this.wanted.size > 24) this.wanted.delete(this.wanted.values().next().value!);
  }

  /** New items, defined by the Narrator, written into the "citati" pack, committed. */
  async introduceItems(names: string[], context: string): Promise<ItemDef[]> {
    const fresh = [...new Set(names.map((n) => n.trim()).filter((n) => n.length >= 2 && !this.content.byName(n)))].slice(0, 6);
    if (!fresh.length) return names.map((n) => this.content.byName(n)).filter((d): d is ItemDef => !!d);
    let raw;
    try {
      raw = await defineItems(this.council, fresh, context);
    } catch (e) {
      this.council.say('narratore', 'errore', (e as Error).message);
      return [];
    }
    const taken = new Set(this.content.items.keys());
    const defs = raw.map((r) => toItemDef(r, taken)).filter((d): d is ItemDef => !!d);
    if (!defs.length) return [];
    this.writePack('modules/items.citati/manifest.json', { id: 'items.citati', name: 'Oggetti di cui si è parlato', description: 'Oggetti entrati nel mondo perché qualcuno ne ha parlato.' }, { items: defs, recipes: [], loot: {} });
    this.applyFiles({ ...this.repo.working });
    this.repo.commit(`contenuti: ${defs.map((d) => d.name).join(', ')}`, 'agent');
    return defs;
  }

  private writePack(path: string, head: { id: string; name: string; description: string }, pack: { items: ItemDef[]; recipes: any[]; loot: Record<string, any> }): void {
    const existing = this.repo.working[path] ? JSON.parse(this.repo.working[path]) : { ...head, kind: 'data', version: '0.1.0', items: [], recipes: [], loot: {} };
    existing.items = [...(existing.items ?? []), ...pack.items];
    existing.recipes = [...(existing.recipes ?? []), ...pack.recipes];
    existing.loot = { ...(existing.loot ?? {}), ...pack.loot };
    this.repo.write(path, JSON.stringify(existing, null, 2) + '\n');
  }

  /** The world grows as it is explored: a new pack of items, recipes and loot (text only, cheap). */
  async growContent(reason: string, count = 16, force = false): Promise<boolean> {
    if (this.growing || (!force && (this.packsUsed >= (this.config.ai.maxPacks ?? 4) || this.models.name === 'offline'))) return false;
    this.growing = true;
    this.packsUsed++;
    try {
      const tags = [...new Set([...this.content.items.values()].flatMap((d) => d.tags))].slice(0, 30);
      const raw = await itemPack(this.council, { count, existing: [...this.content.items.values()].map((d) => d.name), hints: [...this.wanted].map((id) => this.itemInfo(id).name), tags });
      const known = new Map([...this.content.items.values()].map((d) => [normName(d.name), d.id]));
      const pack = assemblePack(raw, known, new Set(this.content.items.keys()));
      const errors = this.validator.validateItems(pack.items);
      if (errors.length || !pack.items.length) {
        this.council.say('kernel', 'scarta', `pacchetto: ${errors.join('; ') || 'vuoto'}`, 'narratore');
        return false;
      }
      let n = 1;
      while (this.repo.working[`modules/items.pacco-${n}/manifest.json`]) n++;
      this.writePack(`modules/items.pacco-${n}/manifest.json`, { id: `items.pacco-${n}`, name: `Pacchetto ${n}`, description: `Oggetti scritti dal Concilio (${reason}).` }, pack);
      this.applyFiles({ ...this.repo.working });
      const c = this.repo.commit(`contenuti: pacchetto ${n} (${pack.items.length} oggetti, ${pack.recipes.length} ricette)`, 'agent');
      this.council.say('kernel', 'approva', `pacchetto ${n}: ${pack.items.length} oggetti, ${pack.recipes.length} ricette, ${Object.keys(pack.loot).length} tabelle → commit ${c.id}`);
      return true;
    } catch (e) {
      this.council.say('narratore', 'errore', `pacchetto: ${(e as Error).message}`);
      return false;
    } finally {
      this.growing = false;
    }
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
      const mr = this.content.runes[rune.token];
      const doc = mr ? `${mr.glyph} ${mr.name} — runa magica (${mr.element}): ${mr.description}. Tienila in mano e premi T.` : SYMBOL_DOCS[rune.token];
      return { kind: 'rune', token: rune.token, doc, symbol, line: this.lineOfRune(id), source: rune.source };
    }
    for (const eid of this.ecs.query('pos', 'glyph')) {
      if (eid === this.playerId) continue;
      const ep = this.ecs.get(eid, 'pos');
      if (Math.hypot(ep.x - cx, ep.y - cy) >= 0.6) continue;
      const pk = this.ecs.get(eid, 'pickup');
      if (pk) {
        const info = this.itemInfo(pk.item);
        return { kind: 'entity', name: info.name, description: info.description, extra: `E per raccogliere${pk.count > 1 ? ` (×${pk.count})` : ''}` };
      }
      const m = this.modules.get(this.ecs.get(eid, 'module')?.id)?.manifest;
      const mind: Mind | undefined = this.ecs.get(eid, 'mind');
      const identity: Identity | undefined = this.ecs.get(eid, 'identity');
      const extra = mind ? `umore: ${mind.mood}` : this.ecs.has(eid, 'container') ? 'E per aprire' : m?.actions?.length ? `E: ${m.actions.map((a) => a.label).join(', ')}` : undefined;
      return { kind: 'entity', name: identity?.name ?? m?.name ?? '???', description: identity ? `${m?.name}. ${identity.look}` : (m?.description ?? ''), extra };
    }
    const t = this.tileAt(Math.floor(cx), Math.floor(cy));
    return t ? { kind: 'tile', name: `${this.palette[t]?.name ?? t}${this.palette[t]?.solid ? ' (invalicabile)' : ''}` } : null;
  }

  // --- The Forge and Genesis ---------------------------------------------------------------------

  /** Forges a module through the Council, then validates, commits and hot loads it; the Atelier paints it later. */
  async forgeModule(prompt: string, origin: ForgeOrigin, kind?: 'npc' | 'oggetto' | 'strumento'): Promise<{ ok: boolean; id?: string; summary: string }> {
    const ids = [...this.modules.keys()];
    try {
      const r = await forge(
        this.council,
        { prompt, origin, kind, existingIds: ids, paletteCodes: Object.keys(this.palette).filter((c) => c !== '?' && !this.palette[c].solid), paint: false },
        (m, logic) => this.validator.validateForged(m, logic, new Set(ids)),
      );
      // What a character carries: existing items by name, new ones defined by the Narrator.
      if (r.concept.porta?.length) {
        const known = r.concept.porta.map((n) => this.content.byName(n)).filter((d): d is ItemDef => !!d);
        const fresh = r.concept.porta.filter((n) => !this.content.byName(n));
        const defs = [...known, ...(fresh.length ? await this.introduceItems(fresh, `portati da ${r.concept.nome}`) : [])];
        if (defs.length) r.manifest.inventory = defs.map((d) => d.id);
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

  /** The Narrator's memory: every new being or thing becomes part of the world bible. */
  private recordInBible(m: Manifest): void {
    const bible = readBible(this.repo.working);
    if (!bible) return;
    const line = `${m.name} — ${m.description ?? ''}`.slice(0, 200);
    if (m.persona) bible.personaggi = [...(bible.personaggi ?? []), line].slice(-30);
    else bible.fatti = [...(bible.fatti ?? []), line].slice(-40);
    this.repo.write('world/bible.json', JSON.stringify(bible, null, 2) + '\n');
  }

  /** Asks the in-world agent for a new module (console → Agente). */
  async askAgent(prompt: string): Promise<{ ok: boolean; id?: string; summary: string }> {
    return this.forgeModule(prompt, 'agente');
  }

  /** Real drafts to test layout programs on (forest-ish, open, watery). */
  sampleDrafts(): string[][] {
    return [[3, -7], [-11, 4], [20, 13]].map(([cx, cy]) => this.rows(this.genDraft(cx, cy)));
  }

  /** The Council generates a whole new universe from a theme. Constants (carpet, movement, physics, needs, runes) stay. */
  async runGenesis(theme: string, onProgress?: (step: string) => void): Promise<boolean> {
    this.generationHeld = true;
    const backup = { ...this.repo.working };
    try {
      onProgress?.('Il Concilio si riunisce');
      const plan = await planGenesis(this.council, theme, this.repo.working, (id, def, palette) => this.validator.validateLayout(id, def, palette, this.sampleDrafts()));
      for (const [p, src] of Object.entries(plan.files)) this.repo.write(p, src);
      // Example content shipped on disk makes room for the generated world.
      for (const m of this.modules.values()) {
        if (m.manifest.origin !== 'esempio') continue;
        for (const p of Object.keys(this.repo.working)) if (p.startsWith(m.dir)) this.repo.write(p, null);
      }
      this.repo.write('world/atelier.json', JSON.stringify({ pairs: [] }, null, 2) + '\n');
      this.applyFiles({ ...this.repo.working });
      this.consumed.clear();
      this.wanted.clear();
      onProgress?.('Il Narratore scrive gli oggetti comuni del mondo');
      if (!(await this.growContent('genesi', 30, true))) {
        // Without a pack the world would be empty: keep the example one.
        for (const [p, src] of Object.entries(backup)) if (p.startsWith('modules/items.base/')) this.repo.write(p, src);
        this.applyFiles({ ...this.repo.working });
      }
      this.packsUsed = 0;
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
      const path = 'modules/core.player/manifest.json';
      const man = JSON.parse(this.repo.working[path]);
      man.appearance = { glyph: '@', color: '#ffffff', scale: 1.3, imagePrompt: plan.playerPrompt };
      this.repo.write(path, JSON.stringify(man, null, 2) + '\n');
      this.applyFiles({ ...this.repo.working });
      this.clearChunks();
      const title = readBible(this.repo.working)?.titolo ?? 'nuovo universo';
      const c = this.repo.commit(`genesi: ${title}`, 'agent');
      this.council.say('kernel', 'approva', `Genesi completata: «${title}», ${done} moduli, ${this.content.items.size} oggetti, ${Object.keys(this.content.layouts).length} ambienti, commit ${c.id}. L'Artista ora dipinge tile e sprite.`);
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
    if (this.time - this.lastArtPump > 2) {
      this.lastArtPump = this.time;
      this.art.pump();
    }
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
