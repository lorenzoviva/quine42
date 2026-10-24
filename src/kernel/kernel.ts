// The kernel: the floor of the universe. Owns the ECS state, the chunks, the sandbox, versioning,
// the assets, the content registry and the Council of agents. Everything above this floor is
// generated (by the Council) or written in Lua, and can break; the floor cannot.

import { World, type Id } from './ecs';
import { EventBus } from './events';
import { Faults } from './faults';
import { Sandbox, type Host } from './sandbox';
import { apiErrors, describeEffect, repairPartita, validateEffects, Validator } from './validator';
import { deathLevel, fallbackDeath, type DeathVerdict } from './partita';
import { Repo, type Commit, type KeyValueStore } from './repo';
import { Corona, campusModel, cellNear, folderOf, type CoronaCell, type Exhibit, type ShowcaseSource, type StudioItem } from './corona';
import { Archive } from './archive';
import { bibleBreaks, cleanBible, metaBreak } from './fourthwall';
import { ATLAS_FILE, defaultAtlas, direction, directionsFrom, placeRegion, readAtlas, regionAt, writeAtlas, type Region } from './atlas';
import { STAMP_SHAPES } from './stamps';
import { repairProgram } from './mj';
import { upgradeFromSeed, type PastCommit, type UniverseBackend } from './universes';
import { addPerson, applyRenames, dayPhase, defaultRoutine, freshName, greeting, guessGender, inferActivity, memorySummary, readPeople, remember, repairSociety, similarNames, societySummary, type Activity, type DayPhase, type Person, type Species } from './society';
import { buildGraph, GRAPH_FILE, graphHash, mergePlaces, placesOf, readGraph, slug as nodeSlug, type GraphPlace, type WorldGraph } from './graph';
import { situation as buildSituation, type Situation } from './situation';
import { ChainMeter, chainOf, type Chain } from './chain';
import { alertOf, clampFrame, costBoard, liveFeed, SCREEN_NAME, timeline, type Budget, type ScreenField, type Screens } from './screens';
import { activeQuests, plotFromRaw, plotText, PLOTS_FILE, readPlots, reviewPlot, secretsOf, writePlots, type Plot } from './plots';
import { Input } from './input';
import { discoverModules, readConfig } from './universe';
import { carpetLine, CARPET_TOKENS, cellIndex, COUNCIL_RUNE, extractLines, tokenize, type RuneComp, type RuneLine } from './runes';
import { hash32, hashStr, hex, Rng } from './rng';
import { BudgetError, type Models } from './ai/models';
import { USAGE_FILE, UsageLedger } from './ai/usage';
import { MemoryChunks, type ChunkStore } from './chunks';
import { bodyFoot, footBlocks, Forms, InlineRunner, instanceGrid, toLocal, type Form, type FormComp, type FormRunner } from './forms';
import { guessClass } from '../mj/classes';
import { GENERIC, ModelDirector, ownModelId } from './modeldirector';
import { categoryOf, DEFAULT_SCULPTORS, sculptAction, type SculptorModels } from './agents/sculptor';
import { MODELS_INDEX, type ModelInfo } from './forms';
import { Content, normName, specOf } from './content';
import { layout, type Building, type LayoutResult } from './layout';
import { AGENTS, Council, readBible, type AgentId, type CatalogEntry, type FeedEntry } from './agents/council';
import { designEnvironment, drawAtlas, planChunk, type ChunkPlan, type Where } from './agents/cartography';
import { forge, judgeCombination, repairLogic, slug, type ForgeOrigin } from './agents/forge';
import { agentReply, examine, narrate, npcDialogue, npcReply, referenteReply, weavePlot, type NpcReply, type Turn } from './agents/minds';
import { planGenesis } from './agents/genesis';
import { councilSession, judgeAction, judgeCraft, judgeDeath, nameSpell } from './agents/effects';
import { cleanPanel, designMechanic } from './agents/mechanics';
import { BENCH, cleanCases, runCase, textKey, type BenchEntry, type BenchRun, type BenchScene, type BenchShown } from './bench';
import { assemblePack, defineItems, individuate, itemPack, toItemDef, type Identity } from './agents/content';
import { addItem, CARRY_CAPACITY, countItem, equippedItem, moveSlot, newInventory, putSlot, removeItem, takeFromSlot, totalWeight, type Inventory } from './inventory';
import { chunkLevels, HILLS, LEVEL, Relief, RELIEF_PATH } from './relief';
import { CardLedger, CARDS_FILE, COMUNE, allCards, collectionOf, moduleCardId, payerOf, placeCardId, stampFiles, titolareOf, type Card, type Carta } from './cards';
import { bondWith, memoriesFor, playerFile, PLAYERS_DIR, readWandererState, SOLO, validWandererId, WANDERER_NAME, wandererColor, wandererOf, wanderersIn, type Wanderer, type WandererState } from './wanderers';
import type { ActionDef, BenchCase, Effect, FileMap, Spell, UiPanel, ItemDef, ItemSpec, Manifest, ModuleEntry, Partita, Place, Recipe, RuneFragment, TileDef, UniverseConfig } from './types';

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
  | { kind: 'code'; cell: CoronaCell; folder?: string }
  | { kind: 'studio'; item: StudioItem; building: string; recent?: string }
  | { kind: 'door'; building: string; team: string }
  | { kind: 'agent'; agent: AgentId; name: string; doing?: string }
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

/** A decision of the Council, kept as a rule of the world. */
/** One thing a showcase of the studio can show (T21): its model, its file, what is known of it. */
export interface ShowcaseEntry {
  id: string;
  label: string;
  model?: string;
  /** The instance of the model (T23: an individual is a seed of its type's program). */
  seed?: number;
  tint?: string;
  color?: string;
  /** Runes on show (a magic rune, or the sequence of a spell). */
  runes?: string[];
  path?: string;
  /** A planned place (T26): the model of places shows it in miniature (`Kernel.miniature`). */
  place?: { cx: number; cy: number };
  /** What the panel says of it, in order: [what, value]. */
  facts: Array<[string, string]>;
}

/** Where a plan puts its runes and things (cells of the chunk; runes in world columns and rows). */
interface Placements {
  runes: Array<{ token: string; line: number; col: number; row: number; origin: string }>;
  objects: Array<{ index: number; cell?: number }>;
  ground: Array<{ index: number; item?: string; cell?: number }>;
  loot: Array<{ index: number; item: string; count: number; cell?: number }>;
  pick: (where: Where) => number | undefined;
}

/** A lot of a planned place and the structure that stands on it (ADR-0043). */
interface PlaceLot {
  index: number;
  origin: string;
  x: number;
  y: number;
  form: FormComp;
  struttura: { concetto: string; classe: string; importante: boolean; model?: string };
}

/** A planned place in miniature (T26): positions in tiles from the place's top-left corner, levels in `LEVEL`s. */
export interface PlaceMiniature {
  cx: number;
  cy: number;
  size: number;
  tiles: string;
  levels: number[];
  /** The structures in the middle of their lots (w × h tiles). */
  structures: Array<{ x: number; y: number; w: number; h: number; model: string; seed: number; yaw: number; done?: string[] }>;
  things: Array<{ x: number; y: number; model: string; seed: number; yaw: number; tint?: string; color?: string }>;
  /** Each rune with the line (of the plan) it belongs to. */
  runes: Array<{ x: number; y: number; token: string; line: number; color?: string }>;
  /**
   * The Cartographer's work in phases (`PLACE_PHASES`), each the place as it is then: its tiles, their levels, the cells
   * that phase adds (`lit`). The last is the place as above; structures from the fifth on, things and runes in the sixth.
   */
  phases: Array<{ tiles: string; levels: number[]; lit: number[] }>;
}

/** The phases of a place's making (T26), as the model of places shows them: a name and what happens, in one line. */
export const PLACE_PHASES: ReadonlyArray<{ name: string; what: string }> = [
  { name: 'bozza', what: 'Il terreno prima di tutto: una bozza continua, che non si ferma ai bordi del luogo.' },
  { name: 'varchi', what: 'Un varco per lato, lo stesso per i due luoghi che lo condividono: da lì si entra e si esce.' },
  { name: 'ambiente', what: "Il programma dell'ambiente riscrive l'interno con le sue regole; il bordo resta com'era." },
  { name: 'sentieri', what: 'Ciò che resterebbe isolato viene collegato dal sentiero più breve: ogni angolo si raggiunge.' },
  { name: 'lotti e strutture', what: 'Ogni edificio diventa un lotto in piano con la sua struttura, girata verso la porta.' },
  { name: 'cose e rune', what: 'Le persone, le cose e le rune, ciascuna su una casella che si raggiunge.' },
];

/**
 * An environment in the sample room (T26d): its program run on a trial draft as the validator tries it (`layout()` on
 * one of `sampleDrafts`, the one it changes most), shown in miniature like a place. `error` if it does not run.
 */
export interface LayoutSample {
  id: string;
  name: string;
  description: string;
  environment: string;
  path: string;
  /** Which of the trial drafts, and how many of its tiles the environment changed. */
  draft: number;
  changed: number;
  mini: PlaceMiniature;
  error?: string;
}

export interface Rule {
  chiave: string;
  testo: string;
  possibile: boolean;
  racconto: string;
  effetti?: string[];
  /** Who judged it and who paid (T36): only the Council's judgements are cards. */
  carta?: Carta;
}

export interface Needs {
  hunger: number;
  thirst: number;
  energy: number;
  health: number;
  /** Magic strength: spells cost it, it slowly comes back, magic crystals restore it. */
  mana: number;
}

export interface KernelOptions {
  files: FileMap;
  store: KeyValueStore;
  models: Models;
  chunks?: ChunkStore;
  /** Who runs the MarkovJunior programs of the models (default: this thread; the browser uses workers). */
  forms?: FormRunner;
  wasmUri?: string;
  /** The universe repository on disk (ADR-0021), and its history from earlier sessions. */
  backend?: UniverseBackend;
  past?: PastCommit[];
  /** A kernel in miniature for the bench of the Sala sistemi (T27): a fixed scene, nothing generated, nothing saved. */
  bench?: { terreno?: string[] };
  /**
   * The world of a thin client (T39, ADR-0059): the server's world as it tells it. Nothing is generated, saved or
   * judged here, no system runs but those that walk this client's wanderer: places and things are put in by the client.
   */
  mirror?: boolean;
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

/** Draft codes of the biomes and the base terrain each falls back to, if a world lacks them. */
const DRAFT_FALLBACK: Record<string, string> = { s: 'g', n: 'g', j: 't', o: 'w', k: 'r' };

const VOID_TILE: TileDef = { name: 'vuoto', color: '#2a0612', solid: false, layer: 'ground' };
const DEFAULT_ITEM: ItemSpec = { stackable: false, maxStack: 1, weight: 1, equippable: false };
const FALLBACK_PLAYER = {
  player: { speed: 6, facing: 'down', load: 0 },
  hand: { tokens: [] as string[], sel: 0 },
  needs: { hunger: 85, thirst: 85, energy: 90, health: 100, mana: 60 },
};
const STARTER_RUNES = ['x', 'speed = speed', 'luce'];
/** Chunks from the origin (in carpet space) before runes that touch the carpet can appear. */
const CARPET_RUNE_DISTANCE = 3;
/**
 * Side, in chunks, of a zone of the world that has at most one important structure (ADR-0043): 56 chunks
 * of 18 tiles, about 1000 × 1000 tiles (a million). Walking straight (6 tiles/s) one crosses a zone in
 * about three minutes; exploring, much more. Zones are centred on the start.
 */
export const IMPORTANT_ZONE = 56;
export const zoneOf = (cx: number, cy: number) => `${Math.floor((cx + IMPORTANT_ZONE / 2) / IMPORTANT_ZONE)},${Math.floor((cy + IMPORTANT_ZONE / 2) / IMPORTANT_ZONE)}`;

const clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

/**
 * Systems that move one wanderer (T38): they run once for each wanderer the kernel moves itself, as that
 * wanderer, and see no other wanderer. Those a session's client moves (`setRemote`) they skip.
 */
const PER_WANDERER = new Set(['core.movement', 'core.carpet']);

export class Kernel {
  readonly ecs = new World();
  readonly bus = new EventBus();
  readonly faults = new Faults();
  readonly input = new Input();
  readonly content = new Content();
  readonly models: Models;
  /** What the models cost, per day, model and task (world/consumi.json). */
  readonly usage = new UsageLedger();
  private usageWritten = -1;
  /** The cards' uses and the places' cards (T36): world/carte.json, written before every commit. */
  readonly cards = new CardLedger();
  private cardsWritten = -1;
  private cardIdsOf?: { files: FileMap; ids: Set<string> };
  /** The places the graph of the world knows (ADR-0045): planned chunks, by key. */
  private graphPlaces = new Map<string, GraphPlace>();
  private graphCache?: { files: FileMap; places: number; graph: WorldGraph };
  private graphPlacesVersion = 0;
  readonly chunkStore: ChunkStore;
  /** The models of things (ADR-0041): the library of programs and the forms they make. */
  readonly forms: Forms;
  /** The Sculptor at work on the models the world lacks. */
  readonly sculpting = new ModelDirector(this);
  private lastSculptPump = 0;
  council!: Council;
  sandbox!: Sandbox;
  validator!: Validator;
  repo!: Repo;
  corona!: Corona;
  /** The Council's figures walking the corona. */
  readonly archive = new Archive(() => this.corona);
  private agentTalks = new Map<AgentId, Turn[]>();

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
  /** Solid things with a model, by the cells their footprint reaches (they block by their voxels). */
  private reliefCache?: { key: string; relief: Relief };
  /** The level of every tile, per chunk (flat water, flat lots), while its tiles, lots and relief stay the same. */
  private levelCache = new WeakMap<Chunk, { tiles: string; lots: Building[]; relief: Relief; levels: Int16Array }>();
  private solidForms = new Map<string, Array<{ id: Id; x: number; y: number; yaw: number; form: Form; foot: Uint8Array }>>();
  /** Footprints of instances whose model was changed by an action (the door is open). */
  private instanceFeet = new Map<Id, { key: string; foot: Uint8Array }>();
  /** What was done to models of things, by stable origin (saved with the game). */
  private savedForms = new Map<string, string[]>();
  /** Zones of the world that already have their important structure: zone → the chunk that has it (saved with the game). */
  private importanti = new Map<string, string>();
  private runesDirty = true;
  private consumed = new Set<string>();
  private loaded = new Map<string, string>();
  private singletons = new Map<string, Id>();
  private faultFlag: string | null = null;
  private lastGood = { px: 0, py: 0, ox: 0, oy: 0 };
  private forgesUsed = 0;
  private packsUsed = 0;
  private castUsed = 0;
  /** At most this many of the same kind of character in the loaded world (individuals: one). */
  static NPC_CAP = 2;
  private plannedCount = 0;
  private growing = false;
  private forging = new Set<string>();
  private developers = 0;
  private repaired = new Set<string>();
  private examined = new Map<string, string>();
  /** While true no chunk is planned and nothing is painted (e.g. during genesis). */
  generationHeld = false;
  /** Terrain generation is Lua and costs a few ms: at most this many new chunks per tick. */
  static CHUNKS_PER_TICK = 1;
  private genBudget = 64;
  private tickCount = 0;
  /** Ticks since this kernel started (the clock of a session, T38). */
  get ticks(): number {
    return this.tickCount;
  }
  /** Calls into Lua with the same key in this tick: each gets its own draws (T35). */
  private luaCalls = new Map<number, number>();

  /** The entity of the wanderer acting now (the one the input moves, or another one inside `as`). */
  playerId: Id = 0;
  /** The wanderers of this kernel by id (T34): `io` is the one of a game alone; others join with `addWanderer`. */
  private wanderersById = new Map<string, Wanderer & { entity: Id; tappeto?: { ox: number; oy: number } }>();
  /** Every wanderer has a carpet of their own (T38): the carpet entity holds this one's offset, the others keep theirs in `tappeto`. */
  private carpetHolder = SOLO;
  /** The wanderers a session's client moves (T38): the kernel checks their steps and does not move them itself. */
  private remote = new Set<string>();
  /** The wanderer the keyboard of this kernel moves. */
  inputFor = SOLO;
  time = 0;
  zone: 'sim' | 'corona' | 'studio' = 'sim';
  /** What each showcase of the studio shows: building → index in its entries (not saved). */
  private showcaseIndex = new Map<string, number>();
  /** The phase each model of places shows (T26, an index of `PLACE_PHASES`): the finished place until it is moved. */
  private showcasePhase = new Map<string, number>();
  /** The bench of the Systems Room (T27b): the case it shows, the runs it has (by case and code), those under way. */
  private benchIndex = 0;
  private benchRuns = new Map<string, BenchRun>();
  private benchRunning = new Set<string>();
  /** The commit the Direction's timeline shows (T46b); none: the newest. */
  private filmAt?: string;
  /** What each system costs in the tick (T27a): the chain of the Systems Room shows it. */
  private meter = new ChainMeter();
  /** The entities the running system touches through the Host, while it runs. */
  private touching?: Set<number>;
  /** The system running now (the carpet lets go of whoever is off it, T37). */
  private runningSystem?: string;
  /** A rune line whose writes to the bindings are ignored is running (T37): the Host hands out copies. */
  private lockedLine = false;
  /** The wanderers no carpet holds (T37): the master gone to the Council's hall by his rune, until back in the world. */
  private offCarpet = new Set<Id>();
  /** The library's version when the campus last looked for its buildings' models (T20). */
  private campusVersion = -1;
  private showcaseCache = new Map<ShowcaseSource, { files: FileMap; stamp: string; entries: ShowcaseEntry[] }>();
  /** The places in miniature (T26), by chunk key, made once per state of the files. */
  private miniatures = new Map<string, { files: FileMap; mini?: PlaceMiniature }>();
  /** The environments of the sample room on their trial drafts (T26d), made once per state of the files. */
  private layoutSamples = new Map<string, { files: FileMap; sample?: LayoutSample }>();
  /** The drafts layout programs are tried on (`sampleDrafts`), per state of the files. */
  private trialDrafts?: { files: FileMap; drafts: string[][] };
  /** Grows when a miniature read from a saved plan is ready (the renderer's cache key). */
  miniatureVersion = 0;
  exitedOnce = false;
  /** The wanderer died: the session is over until they continue or start again. */
  dead = false;
  /** What death costs this time: the Narrator's verdict, asked as soon as the wanderer dies. */
  private deathVerdict?: Promise<DeathVerdict>;
  /** The game chosen at the Genesis (ADR-0053): universe.json follows it, nothing else changes it. */
  private game?: Partita;
  /** Size of the visible area in cells, set by the renderer. */
  view = { w: 32, h: 20 };
  readonly logs: LogEntry[] = [];

  /** The scene of a kernel in miniature (T27), if this is one. */
  readonly bench?: { terreno?: string[] };
  readonly mirror: boolean;
  private wasmUri?: string;

  private constructor(opts: KernelOptions) {
    this.models = opts.models;
    this.bench = opts.bench;
    this.mirror = !!opts.mirror;
    this.wasmUri = opts.wasmUri;
    this.chunkStore = opts.chunks ?? new MemoryChunks();
    this.forms = new Forms(opts.forms ?? new InlineRunner());
  }

  static async boot(opts: KernelOptions): Promise<Kernel> {
    const k = new Kernel(opts);
    k.sandbox = await Sandbox.create(k.makeHost(), opts.wasmUri);
    k.validator = new Validator(k.sandbox);
    k.council = new Council(opts.models, () => ({ files: k.files, palette: k.palette, catalog: k.catalog(), graph: () => k.graph() }));
    k.council.onFeed = (e) => {
      k.archive.onFeed(e, (x) => k.pathForFeed(x));
      k.bus.emit('council', e);
    };
    const name = readConfig(opts.files).config.name;
    const { repo, synced } = Repo.open(name, opts.files, opts.store);
    k.repo = repo;
    if (opts.backend) repo.attach(opts.backend, opts.past ?? []);
    k.bus.on('lua:morte', (d: { fame?: boolean; sete?: boolean }) => k.die(d?.sete ? 'sete' : d?.fame ? 'fame' : 'ferite'));
    k.faults.onRaise = (f, isNew) => {
      if (isNew) k.log('fault', `${f.key}: ${f.message}`);
      // Where it happened (T46a): the code that runs in the world, where the wanderer was; not loading nor manifests.
      if (isNew && !f.at && k.zone === 'sim' && /^(module|rune):/.test(f.key) && !/:load$/.test(f.key)) f.at = { ...k.playerCarpet() };
      k.bus.emit('fault', { fault: f, isNew });
      if (isNew && !k.bench && !k.mirror) void k.repairGenerated(f.key, f.message);
    };
    // The usage ledger: every call is counted; the file is written before every commit (it survives rollbacks).
    k.usage.load(repo.working[USAGE_FILE]);
    k.models.onCall = (r) => k.usage.record(r);
    k.usage.onChange = () => k.bus.emit('usage', k.usage);
    // The cards (T36): who pays for every call (cards.ts), and how often every card goes into a prompt.
    k.cards.load(repo.working);
    k.council.payer = (task) => payerOf(task, k.wanderer().id);
    k.council.onFocus = (ids) => k.cards.use(ids, 'prompt', (id) => k.isCard(id));
    repo.beforeCommit = () => {
      k.writeUsage();
      k.writeCards();
      k.writeGraph();
    };
    k.applyFiles(repo.working, { reset: true });
    if (k.bench || k.mirror) {
      k.generationHeld = true;
      return k;
    }
    k.loadState();
    k.ensureAtlas();
    k.reviewSociety();
    k.reviewPlots();
    void k.seedGraphPlaces();
    void k.reviewFourthWall();
    k.models.limits = { text: k.config.ai.maxText };
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
      query: (names) => {
        let ids = this.ecs.query(...names.split(',').map((s) => s.trim()).filter(Boolean));
        // A system that moves one wanderer sees only the one acting (T38); the carpet lets go of whoever is off it.
        if (this.runningSystem && PER_WANDERER.has(this.runningSystem)) ids = ids.filter((id) => id === this.playerId || !this.ecs.has(id, 'player'));
        return (this.runningSystem === 'core.carpet' && this.offCarpet.size ? ids.filter((id) => !this.offCarpet.has(id)) : ids).join(',');
      },
      get: (id, name) => {
        this.touching?.add(id);
        const c = this.ecs.get(id, name) ?? undefined;
        // A line that may not move anyone reads the carpet and the positions, it does not hold them (T37).
        return this.lockedLine && c && (name === 'carpet' || name === 'pos') ? clone(c) : c;
      },
      set: (id, name, data) => {
        this.touching?.add(id);
        // The floor protects what keeps the universe navigable: position, the player, the carpet.
        if (!this.ecs.alive.has(id) || ['pos', 'module', 'chunk', 'carpet', 'container'].includes(name) || (id === this.playerId && ['player', 'hand', 'inventory', 'needs', 'slots'].includes(name))) return false;
        if (data === null || typeof data !== 'object') return false;
        this.ecs.set(id, name, data);
        return true;
      },
      spawn: (c) => {
        const id = this.spawnFromLua(c);
        if (id !== undefined) this.touching?.add(id);
        return id;
      },
      destroy: (id) => {
        this.touching?.add(id);
        if (id === this.playerId || [...this.singletons.values()].includes(id)) return;
        this.ecs.destroy(id);
        this.runesDirty = true;
      },
      first: (name) => this.ecs.query(name)[0],
      held: (a) => this.wanderer().id === this.inputFor && this.input.isHeld(a),
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
      carpet: () => (this.lockedLine && this.carpet() ? clone(this.carpet()) : this.carpet()),
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
        return d ? { id: d.id, name: d.name, category: d.category, weight: d.weight, tags: d.tags.join(','), slot: d.slot ?? '', effects: { ...(d.effects ?? {}) } } : undefined;
      },
      item_bonus: (id, name) => {
        const v = this.content.get(id)?.bonus?.[name];
        return typeof v === 'number' && Number.isFinite(v) ? v : 0;
      },
      slot_get: (panel, slot) => this.slots()[panel]?.[slot]?.item ?? undefined,
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
    this.seedLua(key, typeof args[0] === 'number' ? args[0] : 0);
    const value = this.sandbox.run(id, fn, ...args);
    const failed = this.faultFlag === key;
    if (!failed) this.faults.clear(key);
    return { value, failed };
  }

  /**
   * Shared seeds (T35, ADR-0055): math.random of universe code draws from (universe seed, tick, who calls, entity),
   * never from the clock, so two kernels with the same universe and the same input draw the same numbers.
   */
  private seedLua(key: string, entity: number): void {
    const k = hash32(hashStr(key), Number.isFinite(entity) ? entity : 0);
    const n = this.luaCalls.get(k) ?? 0;
    this.luaCalls.set(k, n + 1);
    this.sandbox.seed(hash32(this.config?.seed ?? 0, this.tickCount, k, n));
  }

  /** A generator for one draw of the kernel at this tick (T35): the same in every kernel of the universe. */
  rngFor(...salt: number[]): Rng {
    return new Rng(hash32(this.config?.seed ?? 0, this.tickCount, ...salt));
  }

  private lastStamp = '';
  private stampN = 0;

  /** A name unique in this universe from the time of the world, not of the machine (T35): the same in every kernel. */
  worldStamp(): string {
    const base = Math.round(this.time * 1000).toString(36);
    this.stampN = base === this.lastStamp ? this.stampN + 1 : 0;
    this.lastStamp = base;
    return this.stampN ? `${base}-${this.stampN}` : base;
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

  /** A wanderer's entity, with what they start with (e.g. a rune pouch). */
  private spawnWanderer(x: number, y: number): Id {
    const playerMod = [...this.modules.values()].find((m) => m.manifest.kind === 'player');
    const defaults: Record<string, any> = clone(playerMod?.manifest.components ?? FALLBACK_PLAYER);
    for (const [k, v] of Object.entries(FALLBACK_PLAYER)) if (!defaults[k]) defaults[k] = clone(v);
    if (!defaults.inventory) defaults.inventory = newInventory();
    const glyph = this.glyphOf(playerMod?.manifest.appearance ?? { glyph: '@', color: '#ffffff' });
    const body = { r: playerMod?.manifest.physics?.radius ?? 0.3, solid: false };
    const id = this.ecs.spawn({ ...defaults, pos: { x, y }, glyph, body, form: this.formFor(playerMod?.manifest, 'viandante'), module: { id: playerMod?.manifest.id ?? 'kernel.player' } });
    const was = this.playerId;
    this.playerId = id;
    try {
      for (const it of playerMod?.manifest.inventory ?? []) if (this.content.get(it)) this.give(it, 1);
    } finally {
      this.playerId = was || id;
    }
    return id;
  }

  /** The wanderer acting now: the one whose entity is `playerId`. */
  wanderer(): Wanderer {
    for (const w of this.wanderersById.values()) if (w.entity === this.playerId) return { id: w.id, nome: w.nome };
    return { id: SOLO, nome: WANDERER_NAME };
  }

  wanderers(): Wanderer[] {
    return [...this.wanderersById.values()].map((w) => ({ id: w.id, nome: w.nome }));
  }

  /**
   * Runs `fn` as another wanderer: what it does to «the player» (inventory, needs, hand, memories, bonds,
   * quests) is theirs. Synchronous on purpose: the swap never spans an await.
   */
  as<T>(id: string, fn: () => T): T {
    const w = this.wanderersById.get(id);
    if (!w || w.entity === this.playerId) return fn();
    if (!this.ecs.alive.has(w.entity)) {
      // Never someone else in their place: they come back with what was saved of them.
      this.wanderersById.delete(id);
      this.addWanderer(id, w.nome);
      return this.as(id, fn);
    }
    const was = this.playerId;
    const holder = this.carpetHolder;
    this.playerId = w.entity;
    this.holdCarpet(id);
    try {
      return fn();
    } finally {
      this.holdCarpet(holder);
      this.playerId = was;
    }
  }

  /** The carpet entity takes the offset of this wanderer's carpet, and the one it held goes back to its owner. */
  private holdCarpet(id: string): void {
    if (id === this.carpetHolder) return;
    const c = this.carpet();
    const from = this.wanderersById.get(this.carpetHolder);
    const to = this.wanderersById.get(id);
    if (c && from) from.tappeto = { ox: c.ox, oy: c.oy };
    if (c && to?.tappeto) Object.assign(c, to.tappeto);
    this.carpetHolder = id;
  }

  /**
   * Another wanderer in this world (T34; the server of T38 will add one per player): an entity of their own
   * beside the first, with the state saved for them, if any. Returns their entity.
   */
  addWanderer(id: string, nome?: string): Id | undefined {
    if (!validWandererId(id)) return undefined;
    const known = this.wanderersById.get(id);
    if (known && this.ecs.alive.has(known.entity)) return known.entity;
    const p = this.playerPos() ?? { x: 0, y: 0 };
    const entity = this.spawnWanderer(p.x + 1, p.y);
    // Each wanderer is a seed of the wanderer's program (T39): those who meet tell each other apart.
    const form: FormComp | undefined = this.ecs.get(entity, 'form');
    if (form && id !== SOLO) Object.assign(form, { seed: this.forms.seedFor(form.model, `viandante:${id}`), tint: wandererColor(id) });
    const saved = readWandererState(this.files, id);
    // Their carpet starts where the carpet of the one acting is: they appear beside them.
    this.wanderersById.set(id, { id, nome: String(nome ?? saved?.nome ?? '').trim().slice(0, 40) || WANDERER_NAME, entity, tappeto: { ...this.offset() } });
    if (saved) this.as(id, () => this.applyWandererState(saved));
    return entity;
  }

  /**
   * A wanderer leaves this world (T38: their client went away): what they carry is saved with the state of play,
   * their entity goes. `io` stays, it is the one every universe has.
   */
  removeWanderer(id: string): boolean {
    const w = this.wanderersById.get(id);
    if (!w || id === SOLO) return false;
    this.saveState();
    this.ecs.destroy(w.entity);
    this.wanderersById.delete(id);
    this.remote.delete(id);
    return true;
  }

  /** Whether a session's client moves this wanderer (T38): the kernel then neither walks nor carries them, it checks their steps. */
  setRemote(id: string, on: boolean): void {
    if (on && this.wanderersById.has(id)) this.remote.add(id);
    else this.remote.delete(id);
  }

  /** A wanderer's entity and where they are in the world (carpet space), if they are in it. */
  wandererAt(id: string): { entity: Id; x: number; y: number; facing: string } | undefined {
    const w = this.wanderersById.get(id);
    if (!w || !this.ecs.alive.has(w.entity)) return undefined;
    return this.as(id, () => ({ entity: w.entity, ...this.playerCarpet(), facing: String(this.playerComp()?.facing ?? 'down') }));
  }

  /** How far a wanderer may walk in a second: their speed and states, on the fastest terrain around them. */
  paceOf(id: string): number {
    return this.as(id, () => {
      const pl: any = this.playerComp();
      const { x, y } = this.playerCarpet();
      let terrain = 1;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const t = this.tileAt(Math.floor(x) + dx, Math.floor(y) + dy);
          terrain = Math.max(terrain, (t && Number(this.palette[t]?.speed)) || 1);
        }
      const speed = Math.max(0, Math.min(60, Number(pl?.speed) || 0));
      const passo = Math.max(0.2, Math.min(4, Number(pl?.passo) || 1));
      return speed * passo * Math.min(4, terrain);
    });
  }

  /**
   * The step a client claims for its wanderer (T38, rule 10): from where they are toward `to` (carpet space), at
   * most `max` tiles, through the collision of the walk (`core.movement`: axis by axis, a box of the body's
   * radius, and whoever the world grew around may always get out). Their carpet carries them there; where they
   * end up is returned.
   */
  stepWanderer(id: string, to: { x: number; y: number }, max: number): { x: number; y: number } | undefined {
    if (!this.wanderersById.has(id)) return undefined;
    return this.as(id, () => {
      const here = this.playerCarpet();
      let { x, y } = here;
      let dx = Number(to?.x) - x;
      let dy = Number(to?.y) - y;
      const d = Math.hypot(dx, dy);
      if (!Number.isFinite(d) || d < 1e-6) return here;
      const k = d > max ? Math.max(0, max) / d : 1;
      dx *= k;
      dy *= k;
      const r = Number(this.ecs.get(this.playerId, 'body')?.r) || 0.3;
      const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 0.1));
      for (let i = 0; i < n; i++) {
        const stuck = !this.free(x, y, r);
        if (stuck || this.free(x + dx / n, y, r)) x += dx / n;
        if (stuck || this.free(x, y + dy / n, r)) y += dy / n;
      }
      const pl = this.playerComp();
      if (pl && (Math.abs(dx) > 1e-6 || Math.abs(dy) > 1e-6)) pl.facing = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      // The wanderer stays where they are on their circle: the carpet under them moves.
      const c = this.carpet();
      const p = this.playerPos();
      if (c) Object.assign(c, { ox: x - p.x, oy: y - p.y });
      return { x, y };
    });
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
  /**
   * Which world a cached place belongs to. Only a new genesis (a new bible) makes places obsolete:
   * new environments, tiles or regions must not regenerate what was already explored.
   */
  private worldSignature(): string {
    return hex(hashStr(readBible(this.files)?.titolo ?? ''));
  }

  /**
   * Loads a set of universe files. Without reset this is a hot reload: only changed modules are
   * recompiled, the ECS world is untouched and the next tick runs the new logic.
   */
  applyFiles(files: FileMap, opts: { reset?: boolean } = {}): void {
    const { config, error } = readConfig(files);
    if (error) this.faults.raise('universe:config', error);
    else this.faults.clear('universe:config');
    this.keepGame(config, files);
    const radiusChanged = !this.config || this.config.circleRadius !== config.circleRadius;
    const sizeChanged = !this.config || this.config.chunkSize !== config.chunkSize || this.config.seed !== config.seed;
    this.config = config;
    this.forms.load(files);
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

    if (sizeChanged || (before && before !== this.worldSignature())) this.clearChunks();
    else if (!this.terrain || changed.has(this.terrain.manifest.id) || opts.reset) for (const ch of this.chunks.values()) if (ch.stage === 'draft') this.regenerateDraft(ch);

    this.corona.build(files, this.exhibits(files), this.terrainExhibits(), this.layoutExhibits(), this.systems.map((m) => ({ id: m.manifest.id, name: m.manifest.name || m.manifest.id })));
    this.placeCampus();
    // Things that wait for a model of their own wear it as soon as the library has it.
    for (const id of this.ecs.query('form')) {
      const fc: FormComp = this.ecs.get(id, 'form');
      if (!fc.wanted || !this.forms.info(fc.wanted)) continue;
      fc.model = fc.wanted;
      fc.seed = this.forms.seedFor(fc.wanted, this.ecs.get(id, 'origin')?.key ?? String(id));
      delete fc.wanted;
      this.instanceFeet.delete(id);
    }
    this.archive.reset();
    this.bus.emit('universe:reloaded', { changed: [...changed] });
  }

  /**
   * The look of a module's instance: its program (or the generic one of its class), a seed for who it is
   * (instances of a kind differ, a few seeds per kind), the way it faces.
   */
  private formFor(man: Manifest | undefined, who: string): FormComp {
    const app = man?.appearance;
    const classe = app?.classe ?? (man?.kind === 'player' ? 'persona' : man ? guessClass(`${man.name} ${man.description ?? ''} ${app?.aspetto ?? ''}`, man.persona ? 'figura' : undefined).id : 'oggetto');
    const model = this.forms.resolve(app?.model, classe);
    return { model, seed: this.forms.seedFor(model, who), yaw: man?.persona || man?.kind === 'player' ? 0 : (hashStr(who) % 628) / 100, ...(app?.model && app.model !== model ? { wanted: app.model, classe } : {}) };
  }

  /** The look of an item: its own model, or the generic thing in its colour. */
  itemLook(item: string): FormComp {
    const d = this.content.get(item);
    const model = this.forms.resolve(d?.model, 'oggetto');
    return { model, seed: 1, yaw: 0, tint: d?.color, ...(d?.model && d.model !== model ? { wanted: d.model, classe: 'oggetto' } : {}) };
  }

  /** The actions of a thing's model that would change it now (open when closed, close when open). */
  modelActions(id: Id): Array<{ name: string; label: string }> {
    const fc: FormComp | undefined = this.ecs.get(id, 'form');
    const f = fc && this.forms.ready(fc.model, fc.seed, fc.tint);
    if (!fc || !f?.result?.actions.length) return [];
    const m = this.forms.compiled(fc.model);
    const now = instanceGrid(this.forms, f, fc.done ?? []);
    const out: Array<{ name: string; label: string }> = [];
    for (const a of f.result.actions) {
      const after = instanceGrid(this.forms, f, [...(fc.done ?? []), a.name]);
      if (m && after.cells.some((c, i) => c !== now.cells[i])) out.push({ name: a.name, label: a.label ?? a.name });
    }
    return out;
  }

  /** Does an action of a thing's model: the rule runs on its voxels (the door opens), and it is remembered. */
  doModelAction(id: Id, name: string): boolean {
    const fc: FormComp | undefined = this.ecs.get(id, 'form');
    if (!fc || !this.modelActions(id).some((a) => a.name === name)) return false;
    const f = this.forms.ready(fc.model, fc.seed, fc.tint)!;
    const done = [...(fc.done ?? []), name];
    // Back to how it was made: nothing to remember. A long history keeps its last steps.
    const base = f.result!.grid.cells;
    const g = instanceGrid(this.forms, f, done);
    fc.done = g.cells.every((c, i) => c === base[i]) ? [] : done.slice(-32);
    const origin = this.ecs.get(id, 'origin')?.key;
    if (origin) this.savedForms.set(origin, [...fc.done]);
    this.instanceFeet.delete(id);
    this.bus.emit('form:changed', { id });
    return true;
  }

  /**
   * The model whose shape an action may change: a thing's own program in the library (not the generic one
   * of a class, which many kinds share), and not a figure (people and animals change by other means).
   */
  shapeModel(id: Id): string | undefined {
    const fc: FormComp | undefined = this.ecs.get(id, 'form');
    if (!fc || GENERIC.has(fc.model) || !this.forms.info(fc.model) || this.modules.get(this.ecs.get(id, 'module')?.id)?.manifest.persona) return undefined;
    return categoryOf(this.forms.classOf(fc.model)) === 'figura' ? undefined : fc.model;
  }

  /**
   * An action that changes a thing's shape becomes a rule of its model (ADR-0044): the Sculptor writes an
   * `<action>`, the kernel tries it on the model (it finishes, changes something, does not empty it), the
   * program enters the library with it (commit) and every thing of the kind has it in its menu. This one
   * does it now. Returns the action's name, or undefined (then only the effects happen).
   */
  async learnShape(id: Id, label: string, text: string, change: string): Promise<string | undefined> {
    const model = this.shapeModel(id);
    const xml = model && this.files[`models/${model}.xml`];
    if (!model || !xml) return undefined;
    const cls = this.forms.classOf(model);
    const taken = new Set(this.forms.compiled(model)?.actions.map((a) => a.name) ?? []);
    let name = slug(label);
    for (let i = 2; taken.has(name); i++) name = `${slug(label)}-${i}`;
    const nome = this.forms.info(model)?.nome ?? this.nameOf(id);
    this.council.say('narratore', 'propone', `«${text}» cambia ${nome}: ${change}`, 'scultore', 'model.action');
    let r;
    try {
      r = await sculptAction(this.council, { nome, xml, classe: cls.id, azione: name, etichetta: label, testo: text, cambia: change }, this.sculptors()[categoryOf(cls)]);
    } catch (e) {
      this.council.say('scultore', 'errore', `azione «${label}»: ${(e as Error).message}`, undefined, 'model.action');
      return undefined;
    }
    if (!r || !this.addModel(model, r.xml, this.forms.info(model) ?? { classe: cls.id }, `azione imparata: ${label} (${model})`)) return undefined;
    // The program changed (a new form is on its way): this instance remembers what was done to it.
    const fc: FormComp | undefined = this.ecs.get(id, 'form');
    if (fc) {
      fc.done = [...(fc.done ?? []), name].slice(-32);
      const origin = this.ecs.get(id, 'origin')?.key;
      if (origin) this.savedForms.set(origin, [...fc.done]);
      this.instanceFeet.delete(id);
      this.bus.emit('form:changed', { id });
    }
    return name;
  }

  /** Where a solid thing blocks: its model's footprint, or the changed one of this instance. */
  private footOf(id: Id, fc: FormComp, f: Form): Uint8Array {
    if (!fc.done?.length) return f.foot!;
    const key = `${f.key}|${fc.done.join(',')}`;
    const c = this.instanceFeet.get(id);
    if (c?.key === key) return c.foot;
    const r = f.result!;
    const foot = bodyFoot(instanceGrid(this.forms, f, fc.done), r.palette, f.vpt);
    this.instanceFeet.set(id, { key, foot });
    return foot;
  }

  /** Carpet-space point blocked by the voxels of a solid thing. */
  private formBlocks(x: number, y: number): boolean {
    for (const s of this.solidForms.get(`${Math.floor(x)},${Math.floor(y)}`) ?? []) {
      const [lx, lz] = toLocal(x - s.x, y - s.y, s.yaw);
      if (footBlocks(s.form, s.foot, lx, lz)) return true;
    }
    return false;
  }

  private glyphOf(app: NonNullable<Manifest['appearance']>) {
    return { ch: app.glyph, color: app.color };
  }

  private ensureCoreEntities(reset: boolean): void {
    const playerMod = [...this.modules.values()].find((m) => m.manifest.kind === 'player');
    const defaults: Record<string, any> = clone(playerMod?.manifest.components ?? FALLBACK_PLAYER);
    for (const [k, v] of Object.entries(FALLBACK_PLAYER)) if (!defaults[k]) defaults[k] = clone(v);
    if (!defaults.inventory) defaults.inventory = newInventory();
    const app = playerMod?.manifest.appearance ?? { glyph: '@', color: '#ffffff' };
    const glyph = this.glyphOf(app);

    if (!this.playerId || !this.ecs.alive.has(this.playerId)) {
      this.playerId = this.spawnWanderer(0, 0);
      this.wanderersById.set(SOLO, { id: SOLO, nome: this.wanderersById.get(SOLO)?.nome ?? WANDERER_NAME, entity: this.playerId });
    } else {
      this.ecs.set(this.playerId, 'glyph', glyph);
      this.ecs.set(this.playerId, 'form', this.formFor(playerMod?.manifest, 'viandante'));
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
    if (this.bench) return this.benchDraft(cx, cy);
    if (this.terrain) {
      const id = this.terrain.manifest.id;
      const { value, failed } = this.runModule(id, 'generate_chunk', cx, cy, this.config.seed, S);
      if (!failed) {
        // A code the palette lacks becomes the nearest base terrain (sand → grass, sea → water…), never the void.
        if (typeof value === 'string' && value.length === n) return [...value].map((c) => (this.palette[c] ? c : this.palette[DRAFT_FALLBACK[c]] ? DRAFT_FALLBACK[c] : '?')).join('');
        this.faults.raise(`module:${id}:generate_chunk`, `generate_chunk deve restituire una stringa di ${n} caratteri`);
      }
    }
    return '?'.repeat(n);
  }

  /** The scene of the bench (5 × 5 around the cell of the wanderer, (0, 0)); the first walkable terrain around it. */
  private benchDraft(cx: number, cy: number): string {
    const S = this.config.chunkSize;
    const base = this.benchBase();
    const scene = this.bench?.terreno;
    const h = Math.floor(BENCH / 2);
    let out = '';
    for (let r = 0; r < S; r++)
      for (let c = 0; c < S; c++) {
        const code = [...(scene?.[cy * S + r + h] ?? '')][cx * S + c + h];
        out += code && this.palette[code] ? code : base;
      }
    return out;
  }

  /** The terrain of the bench's scene where its case says nothing: the first one that is walked on. */
  private benchBase(): string {
    return Object.keys(this.palette).find((c) => c !== '?' && !this.palette[c].solid && !this.palette[c].layer?.match(/liquid|wall|door/)) ?? '?';
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
    // A thin client has only the places the server sent.
    if (this.genBudget <= 0 || this.mirror) return undefined;
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
    if (this.corona.isInterior(this.playerPos().x)) return;
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
    this.cardPlace(ch, plan);
    await this.chunkStore.save(this.recordKey(ch), { plan });
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

  /** Environments that belong to a region of the atlas are used only there; the rest anywhere. */
  private layoutsFor(ch: Chunk): { layouts: Array<{ id: string; name: string; description: string; environment: string }>; region?: Region } {
    const all = Object.entries(this.content.layouts).map(([id, l]) => ({ id, name: l.name, description: l.description, environment: l.environment }));
    const atlas = readAtlas(this.files);
    const region = ch.cx === 0 && ch.cy === 0 ? undefined : regionAt(atlas, ch.cx, ch.cy);
    if (region && this.content.layouts[region.ambiente]) return { layouts: all.filter((l) => l.id === region.ambiente), region };
    const regional = new Set(atlas.regioni.map((r) => r.ambiente));
    const free = all.filter((l) => !regional.has(l.id));
    return { layouts: free.length ? free : all };
  }

  private async makePlan(ch: Chunk): Promise<ChunkPlan> {
    const start = ch.cx === 0 && ch.cy === 0;
    const { layouts, region } = this.layoutsFor(ch);
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
          region: region ? { nome: region.nome, descrizione: region.descrizione } : undefined,
          importante: this.importantAllowed(ch),
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
    const plan = this.fallbackPlan(ch, layouts.map((l) => l.id), start);
    if (region) plan.place = { name: region.nome, description: region.descrizione };
    return plan;
  }

  /** A universe without a geography gets one (the Cartographer may redraw it); explored places stay. */
  ensureAtlas(): void {
    if (this.files[ATLAS_FILE] || !Object.keys(this.content.layouts).length) return;
    const explored = new Set([...this.chunks.values()].filter((c) => c.stage === 'planned').map((c) => c.key));
    const atlas = defaultAtlas(this.content.layouts, explored, this.config.seed);
    this.repo.write(ATLAS_FILE, writeAtlas(atlas));
    this.applyFiles({ ...this.repo.working });
    this.repo.commit(`atlante: ${atlas.regioni.length} regioni`, 'agent');
    this.council.say('cartografo', 'propone', `atlante del mondo: ${atlas.regioni.map((r) => `${r.nome} (${r.centro.join(',')})`).join(', ')}`, undefined, 'atlas');
  }

  private explored(): Set<string> {
    return new Set([...this.chunks.values()].filter((c) => c.stage === 'planned').map((c) => c.key));
  }

  /** Genesis: the Cartographer draws the geography of the new world. */
  async drawGenesisAtlas(): Promise<void> {
    const layouts = Object.entries(this.content.layouts).map(([id, l]) => ({ id, name: l.name, description: l.description }));
    let drafts: Awaited<ReturnType<typeof drawAtlas>>;
    try {
      drafts = await drawAtlas(this.council, layouts);
    } catch (e) {
      this.council.say('cartografo', 'errore', `atlante: ${(e as Error).message}`, undefined, 'genesis.atlas');
      drafts = [];
    }
    const atlas = { regioni: [] as Region[] };
    for (const d of drafts) {
      const raggio = Math.max(1, Math.min(3, Math.round(d.raggio) || 1));
      const centro = placeRegion(atlas, [0, 0], d.direzione, Math.max(2, Math.min(14, Math.round(d.distanza) || 4)), raggio, new Set());
      atlas.regioni.push({ id: `${d.ambiente}-${atlas.regioni.length}`, nome: String(d.nome).slice(0, 40), descrizione: String(d.descrizione).slice(0, 200), ambiente: d.ambiente, centro, raggio });
    }
    const final = atlas.regioni.length >= 3 ? atlas : defaultAtlas(this.content.layouts, new Set(), this.config.seed);
    this.repo.write(ATLAS_FILE, writeAtlas(final));
    this.applyFiles({ ...this.repo.working });
    this.council.say('cartografo', 'propone', `geografia: ${final.regioni.map((r) => `${r.nome} (${direction(r.centro[0], r.centro[1])})`).join(', ')}`, undefined, 'genesis.atlas');
  }

  /**
   * "Un bosco degli elfi": the Cartographer writes the environment (rules, stamps, new terrains if
   * needed), the validator test-runs it, and it is placed on the atlas in an unexplored direction.
   */
  async createEnvironment(request: string): Promise<{ ok: boolean; summary: string }> {
    const pc = this.playerCarpet();
    const S = this.config.chunkSize;
    const here: [number, number] = [Math.floor(pc.x / S), Math.floor(pc.y / S)];
    const layouts = Object.entries(this.content.layouts).map(([id, l]) => ({ id, name: l.name, description: l.description }));
    let feedback = '';
    for (let attempt = 0; attempt < 2; attempt++) {
      let d;
      try {
        d = await designEnvironment(this.council, request, { palette: this.palette, layouts, here: this.placeHere()?.name ?? 'qui', stamps: STAMP_SHAPES, feedback });
      } catch (e) {
        return { ok: false, summary: `Il Cartografo non riesce: ${(e as Error).message}` };
      }
      // New terrains: one free character each, a known layer.
      const palette = { ...this.palette };
      const added: Record<string, TileDef> = {};
      const free = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'].filter((c) => !palette[c]);
      for (const t of d.tiles) {
        if (!['ground', 'floor', 'wall', 'door', 'liquid', 'vegetation', 'rock'].includes(t.tile.layer ?? '')) continue;
        const code = t.code && !palette[t.code] && t.code !== '?' && /\S/.test(t.code) ? t.code : free.shift();
        if (!code) break;
        palette[code] = added[code] = t.tile;
        // A model's own code for the terrain may appear in its program: map it to the one assigned.
        if (t.code && t.code !== code && d.program) d.program = JSON.parse(JSON.stringify(d.program).split(`"${t.code}"`).join(`"${code}"`));
      }
      let layoutId = d.reuse;
      if (!layoutId) {
        const notes: string[] = [];
        const program = repairProgram(d.program, notes);
        let id = d.id;
        while (this.content.layouts[id]) id += '_';
        const def = program ? { name: d.name, description: d.description, environment: d.environment, program } : undefined;
        const errs = def ? this.validator.validateLayout(id, def, palette, this.sampleDrafts()) : ['programma mancante o incomprensibile'];
        if (errs.length) {
          feedback = errs.join('; ');
          this.council.say('kernel', 'scarta', `ambiente «${d.name}»: ${feedback}`, 'cartografo', 'cartographer.environment');
          continue;
        }
        layoutId = id;
        const tp = this.terrain?.manifestPath;
        if (tp && Object.keys(added).length) {
          const tm = JSON.parse(this.repo.working[tp]);
          tm.tiles = { ...tm.tiles, ...added };
          this.repo.write(tp, JSON.stringify(tm, null, 2) + '\n');
        }
        const lp = [...this.modules.values()].find((m) => m.manifest.layouts)?.manifestPath ?? 'modules/world.layouts/manifest.json';
        const lm = JSON.parse(this.repo.working[lp] ?? '{"id":"world.layouts","name":"Ambienti","kind":"data","layouts":{}}');
        lm.layouts = { ...(lm.layouts ?? {}), [id]: def };
        this.repo.write(lp, JSON.stringify(lm, null, 2) + '\n');
      }
      const atlas = readAtlas(this.repo.working);
      const centro = placeRegion(atlas, here, d.region.direzione, d.region.distanza, d.region.raggio, this.explored());
      const region: Region = { id: `${layoutId}-${atlas.regioni.length}`, nome: d.region.nome, descrizione: d.region.descrizione || d.description, ambiente: layoutId, centro, raggio: d.region.raggio };
      atlas.regioni.push(region);
      this.repo.write(ATLAS_FILE, writeAtlas(atlas));
      this.applyFiles({ ...this.repo.working });
      const dist = Math.max(Math.abs(centro[0] - here[0]), Math.abs(centro[1] - here[1]));
      const where = `${direction(centro[0] - here[0], centro[1] - here[1])}, a ${dist} luoghi da qui`;
      const c = this.commitContent(`cartografo: ${region.nome} (${where})`, 'cartographer.environment', 'cartografo');
      const summary = `«${region.nome}» — ${region.descrizione.replace(/\.$/, '')}. Si trova a ${where}.${Object.keys(added).length ? ` Terreni nuovi: ${Object.values(added).map((t) => t.name).join(', ')}.` : ''}`;
      this.council.say('cartografo', 'approva', `${summary} (commit ${c.id})`, undefined, 'cartographer.environment');
      return { ok: true, summary };
    }
    return { ok: false, summary: `Il Cartografo non è riuscito a scrivere un ambiente valido: ${feedback}` };
  }

  /**
   * What the Cartographer's atlas shows, without generating anything: places planned (ever, from the
   * universe's maps, and now), places only sketched (drafts loaded, not yet planned), the regions, you.
   */
  async atlasView(): Promise<{ planned: Array<{ cx: number; cy: number; name: string; layout: string }>; drafts: Array<{ cx: number; cy: number }>; regions: Region[]; here: { cx: number; cy: number } }> {
    const S = this.config.chunkSize;
    const planned = new Map<string, { cx: number; cy: number; name: string; layout: string }>();
    const prefix = this.recordKey({ cx: 0, cy: 0, key: '' } as Chunk).replace(/[:,]/g, '_');
    for (const m of (await this.repo.backend?.listMaps?.().catch(() => [])) ?? []) {
      if (!m.file.startsWith(prefix)) continue;
      const parts = m.file.slice(prefix.length).split('_').map(Number);
      if (parts.length >= 2 && parts.every(Number.isFinite)) planned.set(`${parts[0]},${parts[1]}`, { cx: parts[0], cy: parts[1], name: m.name, layout: m.layout });
    }
    for (const ch of this.chunks.values()) if (ch.stage === 'planned' && ch.place) planned.set(ch.key, { cx: ch.cx, cy: ch.cy, name: ch.place.name, layout: ch.plan?.layout ?? '' });
    const drafts = [...this.chunks.values()].filter((c) => c.stage === 'draft' && !planned.has(c.key)).map((c) => ({ cx: c.cx, cy: c.cy }));
    // Seen from the studio, "here" is where the wanderer last stood in the world.
    const pc = this.corona.isInterior(this.playerPos().x) ? this.lastWorld : this.playerCarpet();
    return { planned: [...planned.values()], drafts, regions: readAtlas(this.files).regioni, here: { cx: Math.floor(pc.x / S), cy: Math.floor(pc.y / S) } };
  }

  /** Where things are, seen from a carpet point: places nearby and regions of the atlas. */
  directionsAt(x: number, y: number): string[] {
    const S = this.config.chunkSize;
    const cx = Math.floor(x / S);
    const cy = Math.floor(y / S);
    const places = [...this.chunks.values()].filter((c) => c.place).map((c) => ({ name: c.place!.name, cx: c.cx, cy: c.cy }));
    return directionsFrom(readAtlas(this.files), places, cx, cy);
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

  /** The tile the kernel digs paths with (and lays on lots). */
  private pathCode(): string {
    return this.palette.p ? 'p' : (Object.keys(this.palette).find((c) => c !== '?' && !this.palette[c].solid) ?? 'g');
  }

  /**
   * A plan laid out on its draft (deterministic): the environment's program, the guaranteed paths, the buildings,
   * the Cartographer's edits. `quiet` for the model of places (T26): a program that fails there is not news.
   */
  private layoutOf(ch: Pick<Chunk, 'cx' | 'cy' | 'draft'>, plan: ChunkPlan, pathCode: string, quiet = false): { result: LayoutResult; tiles: string } {
    const S = this.config.chunkSize;
    let result: LayoutResult;
    // Quiet is the model of places: it shows the phases too.
    const opts = { cx: ch.cx, cy: ch.cy, seed: this.config.seed, pathCode, stages: quiet };
    try {
      result = layout(this.rows(ch.draft), this.palette, { ...opts, program: this.content.layouts[plan.layout]?.program });
    } catch (e) {
      if (!quiet) this.council.say('kernel', 'errore', `ambiente ${plan.layout} non eseguibile: ${(e as Error).message}`);
      result = layout(this.rows(ch.draft), this.palette, opts);
    }
    let tiles = result.grid.join('');
    for (const [cell, code] of Object.entries(plan.edits ?? {})) {
      const i = Number(cell);
      if (Number.isInteger(i) && i >= 0 && i < S * S && this.palette[code]) tiles = tiles.slice(0, i) + code + tiles.slice(i + 1);
    }
    return { result, tiles };
  }

  /**
   * Where a plan puts its runes and things: reachable cells, inside or outside buildings, never on gates or doors.
   * Deterministic, the same for the world and for the model of places (T26): what was already taken keeps its cell,
   * so the rest does not move. `pick` goes on for what comes later (things forged for the place, items introduced).
   */
  private placementsOf(ch: Pick<Chunk, 'cx' | 'cy' | 'key'>, plan: ChunkPlan, result: LayoutResult): Placements {
    const S = this.config.chunkSize;
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

    // Runes: rare and precious, on a free reachable stretch of a row, anywhere in the chunk. Those that
    // touch the carpet only far from the start (you learn the logic before you can leave); sometimes a magic rune.
    const far = Math.max(Math.abs(ch.cx), Math.abs(ch.cy)) >= CARPET_RUNE_DISTANCE;
    const start = ch.cx === 0 && ch.cy === 0;
    // In a game of many none of the runes that touch the carpet or write a binding are generated (T37).
    const many = this.manyPlayers();
    const lines = start ? STARTER_RUNES.filter((l) => !many || !carpetLine(l)) : plan.runes.filter((l) => (many ? !carpetLine(l) : !tokenize(l).some((t) => CARPET_TOKENS.has(t)) || (far && rng.chance(0.5)))).slice(0, far ? 2 : 1);
    const magic = Object.keys(this.content.runes);
    if (!start && magic.length && rng.chance(0.3)) lines.push(magic[rng.int(magic.length)]);
    const runes: Placements['runes'] = [];
    lines.forEach((line, i) => {
      const toks = tokenize(line);
      const w = toks.length;
      for (let tries = 0; tries < 200; tries++) {
        const row = 1 + rng.int(S - 2);
        const col = 1 + rng.int(Math.max(1, S - 1 - w));
        let ok = col + w <= S - 1;
        for (let k = -1; k <= w && ok; k++) if (occupied.has(row * S + col + k)) ok = false;
        for (let k = 0; k < w && ok; k++) if (!result.reachable.has(row * S + col + k) || indoorSet.has(row * S + col + k)) ok = false;
        if (!ok) continue;
        for (let k = 0; k < w; k++) occupied.add(row * S + col + k);
        toks.forEach((token, j) => runes.push({ token, line: i, col: ch.cx * S + col + j, row: ch.cy * S + row, origin: `${ch.key}#r${i}.${j}` }));
        break;
      }
    });
    const objects = plan.objects.map((o, index) => ({ index, cell: this.modules.has(o.module) ? pick(o.where) : undefined }));
    // Things lying around: named by the Cartographer (those not known yet are introduced later), plus what the ground loot table yields.
    const ground = plan.ground.map((name, index) => {
      const item = this.content.byName(name)?.id;
      return { index, item, cell: item ? pick('fuori') : undefined };
    });
    const loot = this.content.roll('terreno', rng, [...this.wanted]).map((l, index) => ({ index, item: l.item, count: l.count, cell: pick('ovunque') }));
    return { runes, objects, ground, loot, pick };
  }

  /** Runs the layout and puts things in the world: deterministic, so a cached plan rebuilds the same place. */
  private applyPlan(ch: Chunk, plan: ChunkPlan): void {
    const S = this.config.chunkSize;
    const pathCode = this.pathCode();
    const { result, tiles } = this.layoutOf(ch, plan, pathCode);
    ch.plan = plan;
    ch.place = plan.place;
    this.graphPlaces.set(ch.key, { cx: ch.cx, cy: ch.cy, nome: plan.place.name, descrizione: plan.place.description, ambiente: plan.layout, cose: plan.objects.map((o) => o.module), a_terra: plan.ground, strutture: plan.strutture?.map((x) => x.concetto) });
    this.graphPlacesVersion++;
    ch.tiles = tiles;
    ch.buildings = result.buildings;
    ch.stage = 'planned';
    ch.version++;
    this.plannedCount++;
    for (const id of this.ecs.query('chunk')) if (this.ecs.get(id, 'chunk').key === ch.key) this.ecs.destroy(id);
    this.claimImportant(ch, plan);
    const structures = this.settleLots(ch, plan, pathCode);
    const place = this.placementsOf(ch, plan, result);
    const at = (cell: number) => ({ x: ch.cx * S + (cell % S) + 0.5, y: ch.cy * S + Math.floor(cell / S) + 0.5 });
    // On a lot: on the floor of its structure (once its form is ready), not inside its walls.
    const inLot = (cell: number) => {
      const lot = ch.buildings.findIndex((b) => b.floor.includes(cell));
      return lot >= 0 ? structures[lot] : undefined;
    };

    for (const r of place.runes) if (!this.consumed.has(r.origin)) this.ecs.spawn({ rune: { token: r.token, col: r.col, row: r.row, source: 'gen', origin: r.origin } satisfies RuneComp, chunk: { key: ch.key } });

    const loadedOf = (id: string) => this.ecs.query('module').filter((e) => this.ecs.get(e, 'module').id === id).length;
    for (const { index, cell } of place.objects) {
      const m = this.modules.get(plan.objects[index].module);
      const origin = `${ch.key}#o${index}`;
      if (!m || cell === undefined || this.consumed.has(origin) || this.uniqueTaken(m)) continue;
      // Variety: not the same kind of person in every place.
      if (m.manifest.persona && loadedOf(m.manifest.id) >= Kernel.NPC_CAP) continue;
      const p = at(cell);
      const sid = inLot(cell);
      if (sid !== undefined) void this.placeInside(ch, sid, p, (x, y) => this.spawnModuleEntity(m, x, y, ch.key, origin));
      else this.spawnModuleEntity(m, p.x, p.y, ch.key, origin);
    }

    for (const g of place.ground) {
      const origin = `${ch.key}#g${g.index}`;
      if (g.item && g.cell !== undefined && !this.consumed.has(origin)) this.spawnItem(g.item, at(g.cell).x, at(g.cell).y, 1, ch.key, origin);
    }
    for (const l of place.loot) {
      const origin = `${ch.key}#l${l.index}`;
      if (l.cell === undefined || this.consumed.has(origin)) continue;
      const sid = inLot(l.cell);
      if (sid !== undefined) void this.placeInside(ch, sid, at(l.cell), (x, y) => this.spawnItem(l.item, x, y, l.count, ch.key, origin));
      else this.spawnItem(l.item, at(l.cell).x, at(l.cell).y, l.count, ch.key, origin);
    }
    const unknown = place.ground.filter((g) => !g.item).map((g) => plan.ground[g.index]);
    if (unknown.length) void this.introduceItems(unknown, `trovati a terra in «${plan.place.name}»`).then((defs) => {
      if (!this.alive(ch)) return;
      defs.forEach((d, i) => {
        const cell = place.pick('fuori');
        if (cell !== undefined) this.spawnItem(d.id, at(cell).x, at(cell).y, 1, ch.key, `${ch.key}#n${i}`);
      });
    });
    for (const f of plan.fresh) void this.forgeForChunk(ch, f, place.pick, at);
    this.runesDirty = true;
    this.bus.emit('chunk:planned', { key: ch.key });
    if (this.plannedCount % 10 === 0) void this.growContent('esplorazione');
    if (this.plannedCount % 7 === 0) void this.growCast(plan.place);
    if (this.plannedCount === 3 || this.plannedCount % 12 === 0) void this.holdSession();
  }

  /** Whether a place may still have an important structure: its zone has none, or this place is the one that has it. */
  importantAllowed(ch: { cx: number; cy: number; key: string }): boolean {
    const owner = this.importanti.get(zoneOf(ch.cx, ch.cy));
    return !owner || owner === ch.key;
  }

  /**
   * One important structure per zone (ADR-0043): the first place of a zone that has one keeps it, the
   * others' become ordinary (the plan is changed, so it is saved as it is applied).
   */
  private claimImportant(ch: Chunk, plan: ChunkPlan): void {
    let kept = false;
    for (const s of plan.strutture ?? []) {
      if (!s.importante) continue;
      // One per place, too.
      if (!kept && this.importantAllowed(ch)) {
        this.importanti.set(zoneOf(ch.cx, ch.cy), ch.key);
        kept = true;
      } else delete s.importante;
    }
  }

  /**
   * Lots (ADR-0043): every building of the plan becomes a structure — a whole model one enters, set on its
   * lot and turned towards its door. The Cartographer's structures go to the largest lots (the Sculptor
   * writes the ones that do not exist yet); the others are common houses. The lot's tiles become ground,
   * the path goes on from its door towards the house. Pure: the world and the model of places (T26) build the same.
   */
  private lotsOf(ch: Pick<Chunk, 'cx' | 'cy' | 'key' | 'draft' | 'tiles' | 'buildings'>, plan: ChunkPlan, pathCode: string): { tiles: string; lots: PlaceLot[] } {
    const S = this.config.chunkSize;
    const tiles = [...ch.tiles];
    const wanted = [...(plan.strutture ?? [])];
    const lots: PlaceLot[] = [];
    const order = ch.buildings.map((b, i) => ({ b, i, area: (b.x1 - b.x0 + 1) * (b.y1 - b.y0 + 1) })).sort((a, b) => b.area - a.area || a.i - b.i);
    for (const { b, i } of order) {
      const w = b.x1 - b.x0 + 1, h = b.y1 - b.y0 + 1;
      const classe = Math.max(w, h) >= 5 ? 'grande' : 'edificio';
      const req = wanted.shift();
      const own = req ? `struttura-${ownModelId(req.concetto).slice(0, 30)}` : undefined;
      for (const c of [...b.walls, ...b.floor, ...b.doors]) {
        const d = this.palette[ch.draft[c]];
        tiles[c] = d && !d.solid && (d.layer ?? 'ground') === 'ground' ? ch.draft[c] : pathCode;
      }
      // The front of the model looks towards the door; the path goes on from the door into the lot.
      const door = b.doors[0];
      let yaw = 0;
      if (door !== undefined) {
        const dc = door % S, dr = Math.floor(door / S);
        const [dx, dy] = dr === b.y1 ? [0, -1] : dr === b.y0 ? [0, 1] : dc === b.x0 ? [1, 0] : [-1, 0];
        yaw = dr === b.y1 ? 0 : dr === b.y0 ? Math.PI : dc === b.x0 ? -Math.PI / 2 : Math.PI / 2;
        for (let s = 0, c = dc, r = dr; s < 2 && c > b.x0 - 1 && c < b.x1 + 1 && r > b.y0 - 1 && r < b.y1 + 1; s++, c += dx, r += dy) tiles[r * S + c] = pathCode;
      }
      const origin = `${ch.key}#s${i}`;
      const model = this.forms.resolve(own, classe);
      const form: FormComp = { model, seed: this.forms.seedFor(model, origin), yaw, ...(own && own !== model ? { wanted: own, classe } : {}) };
      const done = this.savedForms.get(origin);
      if (done?.length) form.done = [...done];
      lots.push({
        index: i,
        origin,
        x: ch.cx * S + (b.x0 + b.x1 + 1) / 2,
        y: ch.cy * S + (b.y0 + b.y1 + 1) / 2,
        form,
        struttura: { concetto: req?.concetto ?? (classe === 'grande' ? 'una casa' : 'una casetta'), classe, importante: !!req?.importante, ...(own ? { model: own } : {}) },
      });
    }
    return { tiles: tiles.join(''), lots };
  }

  /** The lots of a planned chunk become structures in the world. Returns them, by building index. */
  private settleLots(ch: Chunk, plan: ChunkPlan, pathCode: string): Id[] {
    const { tiles, lots } = this.lotsOf(ch, plan, pathCode);
    const out: Id[] = [];
    for (const l of lots)
      out[l.index] = this.ecs.spawn({
        pos: { x: l.x, y: l.y },
        glyph: { ch: '⌂', color: this.terrain?.manifest.roof?.color ?? '#9a4632' },
        body: { r: 0.5, solid: true },
        form: l.form,
        struttura: l.struttura,
        chunk: { key: ch.key },
        origin: { key: l.origin },
      });
    ch.tiles = tiles;
    return out;
  }

  /**
   * A planned place in miniature (T26), for the model of places in the Office of places: its tiles with their levels,
   * the structures on its lots, its things and runes where the plan puts them (what was taken is not there). From the
   * chunk if it is loaded, else from its saved plan: then `undefined` the first time, and `miniatureVersion` grows when
   * it is ready. Looking does not generate anything: a place never planned has no miniature.
   */
  miniature(cx: number, cy: number): PlaceMiniature | undefined {
    const key = this.chunkKey(cx, cy);
    const hit = this.miniatures.get(key);
    if (hit?.files === this.files) return hit.mini;
    const entry: { files: FileMap; mini?: PlaceMiniature } = { files: this.files };
    this.miniatures.set(key, entry);
    const ch = this.chunks.get(key);
    if (ch?.stage === 'planned' && ch.plan) return (entry.mini = this.miniatureOf(ch, ch.plan));
    void this.chunkStore
      .load(this.recordKey({ cx, cy, key } as Chunk))
      .then((rec) => {
        if (!rec?.plan || this.miniatures.get(key) !== entry) return;
        entry.mini = this.miniatureOf({ cx, cy, key, draft: this.genDraft(cx, cy) }, rec.plan);
        this.miniatureVersion++;
      })
      .catch(() => undefined);
    return undefined;
  }

  private miniatureOf(ch: Pick<Chunk, 'cx' | 'cy' | 'key' | 'draft'>, plan: ChunkPlan): PlaceMiniature {
    const S = this.config.chunkSize;
    const pathCode = this.pathCode();
    const { result, tiles: laid } = this.layoutOf(ch, plan, pathCode, true);
    const { tiles, lots } = this.lotsOf({ ...ch, tiles: laid, buildings: result.buildings }, plan, pathCode);
    const place = this.placementsOf(ch, plan, result);
    const relief = this.relief;
    const liquid = (code: string) => this.palette[code]?.layer === 'liquid';
    const height = (c: number, r: number) => relief.level(ch.cx * S + c, ch.cy * S + r);
    const levels = chunkLevels(tiles, S, liquid, height, result.buildings);
    const local = (cell: number) => ({ x: (cell % S) + 0.5, y: Math.floor(cell / S) + 0.5 });
    const things: PlaceMiniature['things'] = [];
    for (const { index, cell } of place.objects) {
      const m = this.modules.get(plan.objects[index].module);
      const origin = `${ch.key}#o${index}`;
      if (!m || cell === undefined || this.consumed.has(origin)) continue;
      const f = this.formFor(m.manifest, origin);
      things.push({ ...local(cell), model: f.model, seed: f.seed, yaw: f.yaw, color: m.manifest.appearance?.color });
    }
    const items = [...place.ground.map((g) => ({ ...g, origin: `${ch.key}#g${g.index}` })), ...place.loot.map((l) => ({ ...l, origin: `${ch.key}#l${l.index}` }))];
    for (const it of items) {
      if (!it.item || it.cell === undefined || this.consumed.has(it.origin)) continue;
      const f = this.itemLook(it.item);
      things.push({ ...local(it.cell), model: f.model, seed: f.seed, tint: f.tint, yaw: 0, color: f.tint });
    }
    const runes = place.runes.filter((r) => !this.consumed.has(r.origin)).map((r) => ({ x: r.col - ch.cx * S + 0.5, y: r.row - ch.cy * S + 0.5, token: r.token, line: r.line, color: this.content.runes[r.token]?.color }));
    // The phases (T26): what changes from one to the next is lit; before the lots, the ground is not levelled for them.
    const changed = (a: string, b: string) => [...b].flatMap((c, i) => (c !== a[i] ? [i] : []));
    const phase = (t: string, lit: number[], lv?: Int16Array) => ({ tiles: t, levels: [...(lv ?? chunkLevels(t, S, liquid, height, []))], lit: [...new Set(lit)].sort((a, b) => a - b) });
    const gated = result.stages!.gated.join(''), programmed = result.stages!.programmed.join('');
    const cellOf = (p: { x: number; y: number }) => Math.floor(p.y) * S + Math.floor(p.x);
    const phases = [
      phase(ch.draft, []),
      phase(gated, result.gates),
      phase(programmed, changed(gated, programmed)),
      phase(laid, changed(programmed, laid)),
      phase(tiles, [...result.buildings.flatMap((b) => [...b.walls, ...b.floor, ...b.doors]), ...changed(laid, tiles)], levels),
      phase(tiles, [...things, ...runes].map(cellOf), levels),
    ];
    return {
      cx: ch.cx,
      cy: ch.cy,
      size: S,
      tiles,
      levels: [...levels],
      structures: lots.map((l) => ({ x: l.x - ch.cx * S, y: l.y - ch.cy * S, w: result.buildings[l.index].x1 - result.buildings[l.index].x0 + 1, h: result.buildings[l.index].y1 - result.buildings[l.index].y0 + 1, model: l.form.model, seed: l.form.seed, yaw: l.form.yaw, done: l.form.done })),
      things,
      runes,
      phases,
    };
  }

  /** Points of a structure's floor, inside its walls (world, carpet space), for what goes indoors. */
  private interiorPoints(sid: Id): Array<{ x: number; y: number }> {
    const fc: FormComp | undefined = this.ecs.get(sid, 'form');
    const f = fc && this.forms.ready(fc.model, fc.seed, fc.tint);
    const p = this.ecs.get(sid, 'pos');
    if (!fc || !f?.floor || !p) return [];
    const g = f.result!.grid;
    const foot = this.footOf(sid, fc, f);
    const clear = (vx: number, vy: number) => {
      for (let dy = -6; dy <= 6; dy += 2) for (let dx = -6; dx <= 6; dx += 2) {
        const x = vx + dx, y = vy + dy;
        if (x < 0 || y < 0 || x >= g.X || y >= g.Y || foot[x + y * g.X] || !f.floor![x + y * g.X]) return false;
      }
      return true;
    };
    const out: Array<{ x: number; y: number }> = [];
    const c = Math.cos(fc.yaw), s = Math.sin(fc.yaw);
    for (let vy = 6; vy < g.Y - 6; vy += 4)
      for (let vx = 6; vx < g.X - 6; vx += 4) {
        if (!clear(vx, vy)) continue;
        const lx = (vx + 0.5 - g.X / 2) / f.vpt, lz = (vy + 0.5 - g.Y / 2) / f.vpt;
        out.push({ x: p.x + lx * c + lz * s, y: p.y - lx * s + lz * c });
      }
    return out;
  }

  /** Puts something inside a structure, on its floor, when its form is ready (or where the plan said, if it never is). */
  private async placeInside(ch: Chunk, sid: Id, fallback: { x: number; y: number }, spawn: (x: number, y: number) => void): Promise<void> {
    const fc: FormComp | undefined = this.ecs.get(sid, 'form');
    if (fc) await this.forms.wait(fc.model, fc.seed, fc.tint);
    if (!this.alive(ch) || !this.ecs.alive.has(sid)) return;
    this.rebuildSolids();
    // Away from what already stands there (not the structure itself: its position is the middle of its floor);
    // a crowded floor is still better than the lot, which may be inside the walls.
    const taken = this.ecs.query('pos').filter((id) => id !== sid).map((id) => this.ecs.get(id, 'pos'));
    const inside = this.interiorPoints(sid);
    const free = inside.filter((q) => taken.every((t) => Math.hypot(t.x - q.x, t.y - q.y) > 0.9));
    const pool = free.length ? free : inside;
    const p = pool.length ? pool[hash32(sid, pool.length, this.ecs.query('pos').length) % pool.length] : fallback;
    spawn(p.x, p.y);
  }

  /** The relief of the simulation (ADR-0048), made the first time it is asked for, again if the seed or the program change. */
  get relief(): Relief {
    const xml = this.files[RELIEF_PATH] ?? HILLS;
    const key = `${this.config.seed}|${xml}`;
    if (this.reliefCache?.key !== key) {
      let relief: Relief;
      try {
        relief = new Relief(this.config.seed, xml);
        this.faults.clear('universe:relief');
      } catch (e) {
        this.faults.raise('universe:relief', `${RELIEF_PATH}: ${(e as Error).message}`);
        relief = new Relief(this.config.seed);
      }
      this.reliefCache = { key, relief };
    }
    return this.reliefCache.relief;
  }

  /** The height (tiles) of the ground at a point of the simulation: the relief of its tile; water lies flat, lots too. */
  groundAt(x: number, y: number): number {
    const col = Math.floor(x), row = Math.floor(y);
    const S = this.config.chunkSize;
    const cx = Math.floor(col / S), cy = Math.floor(row / S);
    const ch = this.chunks.get(this.chunkKey(cx, cy));
    const relief = this.relief;
    if (!ch) return relief.height(col, row);
    let l = this.levelCache.get(ch);
    if (l?.tiles !== ch.tiles || l.lots !== ch.buildings || l.relief !== relief) {
      const levels = chunkLevels(ch.tiles, S, (code) => this.palette[code]?.layer === 'liquid', (c, r) => relief.level(cx * S + c, cy * S + r), ch.buildings);
      l = { tiles: ch.tiles, lots: ch.buildings, relief, levels };
      this.levelCache.set(ch, l);
    }
    return l.levels[(row - cy * S) * S + (col - cx * S)] * LEVEL;
  }

  /** The height (tiles) of what one stands on at a point of the simulation (the ground, a structure's floor, a step). */
  floorAt(x: number, y: number): number {
    let h = this.groundAt(x, y);
    for (const s of this.solidForms.get(`${Math.floor(x)},${Math.floor(y)}`) ?? []) {
      const [lx, lz] = toLocal(x - s.x, y - s.y, s.yaw);
      const g = s.form.result!.grid;
      const vx = Math.floor(lx * s.form.vpt + g.X / 2), vy = Math.floor(lz * s.form.vpt + g.Y / 2);
      const f = vx >= 0 && vy >= 0 && vx < g.X && vy < g.Y ? (s.form.floor?.[vx + vy * g.X] ?? 0) : 0;
      // A model stands on the ground under its middle.
      if (f) h = Math.max(h, this.groundAt(s.x, s.y) + f / s.form.vpt);
    }
    return h;
  }

  /** The structure whose floor is under a point of the simulation (the wanderer is inside it), if any. */
  structureAt(x: number, y: number): Id | undefined {
    for (const s of this.solidForms.get(`${Math.floor(x)},${Math.floor(y)}`) ?? []) {
      if (!this.ecs.has(s.id, 'struttura')) continue;
      const [lx, lz] = toLocal(x - s.x, y - s.y, s.yaw);
      const g = s.form.result!.grid;
      const vx = Math.floor(lx * s.form.vpt + g.X / 2), vy = Math.floor(lz * s.form.vpt + g.Y / 2);
      if (vx >= 0 && vy >= 0 && vx < g.X && vy < g.Y && s.form.floor?.[vx + vy * g.X]) return s.id;
    }
    return undefined;
  }

  /**
   * The world needs new faces: as it is explored, the Forge creates a new kind of inhabitant, different
   * from those already known and fitting where the player is (it then turns up in the next places).
   */
  private sessions = 0;

  /**
   * The Council meets: it reads the rules born from play, the people met, the places seen, and may
   * intervene (items, a new inhabitant, a new thing). The base logic is theirs; so are its changes.
   */
  async holdSession(force = false): Promise<string> {
    if (!force && (this.sessions >= 4 || this.generationHeld || this.models.name === 'offline')) return 'nessuno';
    this.sessions++;
    const rules = this.rules().slice(-12).map((r) => `- ${r.testo}: ${r.possibile ? 'si può' : 'non si può'}`).join('\n');
    const people = readPeople(this.files).persone.slice(-10).map((p) => `- ${p.nome}, ${p.mestiere}`).join('\n');
    const places = [...this.chunks.values()].filter((c) => c.place).slice(-8).map((c) => `- ${c.place!.name}`).join('\n');
    const wearable = [...this.content.items.values()].filter((d) => d.equippable || d.slot || ['arma', 'vestiario'].includes(d.category)).length;
    const panels = this.uiPanels().map((p) => p.panel.titolo);
    const mech = `Meccaniche con interfaccia: ${panels.join(', ') || 'nessuna'}.${wearable && !this.uiPanels().some((p) => p.panel.elementi.some((e) => e.tipo === 'slot')) ? ` MANCA: ci sono ${wearable} oggetti da indossare o impugnare ma nessuno slot per farlo.` : ''}`;
    const summary = `${mech}\nRegole nate dal gioco:\n${rules || '(nessuna)'}\nPersone incontrate:\n${people || '(nessuna)'}\nLuoghi visti:\n${places || '(nessuno)'}\nOggetti esistenti: ${this.content.items.size}; tipi di abitanti: ${[...this.modules.values()].filter((m) => m.manifest.persona).length}.`;
    let s;
    try {
      s = await councilSession(this.council, summary);
    } catch (e) {
      this.council.say('arbitro', 'errore', `sessione del Concilio: ${(e as Error).message}`);
      return 'nessuno';
    }
    this.council.say('arbitro', 'info', `Sessione del Concilio: ${s.assessment}${s.action !== 'nessuno' ? ` → interviene: ${s.action}${s.request ? ` («${s.request}»)` : ''}` : ''}`, undefined, 'council.session');
    if (s.action === 'oggetti') await this.growContent(`sessione del Concilio: ${s.request ?? ''}`, 12, true);
    else if (s.action === 'abitante') await this.forgeModule(s.request ?? 'un nuovo abitante del mondo', 'agente', 'npc', false, COMUNE);
    else if (s.action === 'cosa' && s.request) await this.forgeModule(s.request, 'agente', 'oggetto', false, COMUNE);
    else if (s.action === 'meccanica') await this.forgeMechanic(s.request ?? 'equipaggiamento: slot per indossare e impugnare', COMUNE);
    return s.action;
  }

  async growCast(place?: Place, force = false): Promise<boolean> {
    const max = this.config.ai.maxCast ?? 3;
    if (!force && (this.castUsed >= max || this.generationHeld || this.models.name === 'offline')) return false;
    const people = [...this.modules.values()].filter((m) => m.manifest.persona);
    if (people.length >= 14) return false;
    this.castUsed++;
    const known = people.map((m) => m.manifest.name).join(', ') || 'nessuno';
    this.council.say('narratore', 'propone', `il mondo ha bisogno di volti nuovi (finora: ${known})`, undefined, 'forge.concept');
    const r = await this.forgeModule(`un nuovo abitante del mondo${place ? ` che si incontra in posti come «${place.name}» (${place.description})` : ''}: un mestiere, un'età e un carattere diversi da tutti quelli già noti (${known})`, 'cartografo', 'npc');
    return r.ok;
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
    await this.chunkStore.save(this.recordKey(ch), { plan: ch.plan });
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

  /** Loads the chunks needed to draw the visible area of every wanderer (T38); unloads the far ones. */
  private updateChunks(): void {
    const want = new Set<string>();
    let any = false;
    for (const w of this.wanderersById.keys()) any = this.as(w, () => this.wantChunks(want)) || any;
    this.genBudget = Kernel.CHUNKS_PER_TICK;
    if (any && this.chunks.size > want.size + 16) {
      for (const ch of [...this.chunks.values()]) if (!want.has(ch.key)) this.unloadChunk(ch);
    }
  }

  /** The chunks the wanderer acting sees, loaded and added to `want`; false inside the studio (nothing to load). */
  private wantChunks(want: Set<string>): boolean {
    // Inside the studio there is no world to load (interiors are far away in real space on purpose).
    if (this.corona.isInterior(this.playerPos().x)) return false;
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
    return true;
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
    comps.form = this.formFor(man, origin ?? `${man.id}@${x.toFixed(2)},${y.toFixed(2)}`);
    const done = origin ? this.savedForms.get(origin) : undefined;
    if (done?.length) comps.form.done = [...done];
    if (man.interaction) comps.interact = { type: man.interaction.type };
    if (man.persona) comps.mind = { mode: 'vaga', mood: 'tranquillo', history: [], ...(comps.mind ?? {}) } satisfies Mind;
    if (man.container) {
      const saved = origin ? this.savedContainers.get(origin) : undefined;
      comps.container = saved ? { inv: clone(saved.inv), loot: man.container.loot, filled: saved.filled } : ({ inv: newInventory(man.container.size), loot: man.container.loot, filled: false } satisfies Container);
    }
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
      glyph: { ch: d?.glyph ?? '?', color: d?.color ?? '#aaa' },
      body: { r: 0.2, solid: false },
      form: { ...this.itemLook(item), yaw: (hash32(Math.round(x * 100), Math.round(y * 100)) % 628) / 100 } satisfies FormComp,
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
    const rng = this.rngFor(id, 77);
    for (const s of box?.inv.slots ?? []) if (s) this.spawnItem(s.item, p.x + (rng.next() - 0.5) * 0.6, p.y + (rng.next() - 0.5) * 0.6, s.count);
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
      if (ch.plan) void this.chunkStore.save(this.recordKey(ch), { plan: ch.plan });
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
    for (const [dx, dy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) if (!this.freeCell(Math.floor(x + dx), Math.floor(y + dy)) || this.formBlocks(x + dx, y + dy)) return false;
    return true;
  }

  /** Real-space collision: carpet inside the circle, corona walkable, nothing beyond it. */
  freeReal(x: number, y: number, r: number): boolean {
    if (![x, y, r].every(Number.isFinite)) return false;
    const R = this.config.circleRadius;
    const { ox, oy } = this.offset();
    // Inside the studio's buildings: rooms with walls, shelves and desks.
    if (this.corona.isInterior(x)) return [[-r, -r], [r, -r], [-r, r], [r, r]].every(([dx, dy]) => this.corona.free(x + dx, y + dy));
    for (const [dx, dy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) {
      const px = x + dx;
      const py = y + dy;
      const d = Math.hypot(px, py);
      if (d >= this.corona.outer) return false;
      if (d >= R) {
        if (!this.corona.free(px, py)) return false;
        continue;
      }
      if (!this.freeCell(Math.floor(px + ox), Math.floor(py + oy)) || this.formBlocks(px + ox, py + oy)) return false;
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
      // A line runs as who wrote it (T37); in a game of many, only the master's may write the bindings.
      const by = st.line.ids.map((id) => (this.ecs.get(id, 'rune') as RuneComp | undefined)?.by).find(Boolean);
      this.faultFlag = null;
      this.seedLua(key, 0);
      this.lockedLine = !this.isMaster(by);
      let r: string | null;
      try {
        r = by ? this.as(by, () => this.sandbox.runLine(st.line.key, this.lockedLine)) : this.sandbox.runLine(st.line.key, this.lockedLine);
      } finally {
        this.lockedLine = false;
      }
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

  /** E on a rune: the one under the wanderer or in front of them, or the rune `which` (a client of a session names it). */
  pickUpRune(which?: Id): boolean {
    const { col, row } = this.playerCell();
    const [dx, dy] = this.facingDelta();
    const id = which !== undefined ? (this.ecs.has(which, 'rune') ? which : undefined) : (this.runeCells.get(`${col},${row}`) ?? this.runeCells.get(`${col + dx},${row + dy}`));
    if (id === undefined) return false;
    const rune: RuneComp = this.ecs.get(id, 'rune');
    // A rune is a thing: it goes into the rune pouch (or the pockets), and onto the phrase being composed.
    if (!this.give(`rune:${rune.token}`, 1)) {
      this.message("Non hai più posto per altre rune.", 'warn');
      return true;
    }
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
    if (this.manyPlayers() && tokens.includes(COUNCIL_RUNE)) return this.councilRune();
    if (this.zone !== 'sim') {
      this.message("Qui non c'è tappeto su cui scrivere.", 'warn');
      return false;
    }
    const missing = this.missingRunes(tokens);
    if (missing) {
      this.message(`Non hai la runa «${missing}».`, 'warn');
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
      removeItem(this.inventory(), `rune:${token}`, 1);
      this.ecs.spawn({ rune: { token, col: c, row: start.row, source: 'player', by: this.wanderer().id } satisfies RuneComp });
      c += 1;
    }
    this.runesDirty = true;
    this.bus.emit('rune:inscribed', { tokens });
    this.message(`Hai inciso: ${tokens.join(' ')}`);
    return true;
  }

  /**
   * The master's rune (T37): spoken or written, it takes them to the Council's hall and is never spent.
   * The carpet lets them go until they walk back into the world. For anyone else it does not exist.
   */
  councilRune(): boolean {
    const hand = this.hand();
    hand.tokens = hand.tokens.filter((t) => t !== COUNCIL_RUNE);
    hand.sel = Math.max(0, Math.min(hand.sel, hand.tokens.length - 1));
    const hall = this.corona.building('concilio');
    if (!this.isMaster() || !hall) {
      this.message('La runa resta muta.', 'warn');
      return false;
    }
    this.offCarpet.add(this.playerId);
    Object.assign(this.playerPos(), this.corona.entrance(hall));
    this.updateZone();
    this.bus.emit('studio:teleport', {});
    this.message(hall.name, 'good');
    return true;
  }

  /** In a game of many the master always carries the Council's rune, and nobody else does (T37). */
  private councilStock(): void {
    if (!this.manyPlayers()) return;
    const item = `rune:${COUNCIL_RUNE}`;
    for (const w of this.wanderersById.values())
      this.as(w.id, () => {
        const n = countItem(this.inventory(), item);
        if (this.isMaster(w.id)) {
          if (n < 1) this.give(item, 1);
        } else if (n) removeItem(this.inventory(), item, n);
      });
  }

  /** The first token of a phrase the player does not carry enough runes for, if any. */
  missingRunes(tokens: string[]): string | undefined {
    const need = new Map<string, number>();
    for (const t of tokens) need.set(t, (need.get(t) ?? 0) + 1);
    for (const [t, n] of need) if (countItem(this.inventory(), `rune:${t}`) < n) return t;
    return undefined;
  }

  /** Adds a carried rune to the phrase being composed (if there is one left that is not already in it). */
  composeRune(token: string): boolean {
    const hand = this.hand();
    if (this.missingRunes([...hand.tokens, token])) {
      this.message(`Non hai altre rune «${token}».`, 'warn');
      return false;
    }
    hand.tokens.push(token);
    hand.sel = hand.tokens.length - 1;
    return true;
  }

  /** Takes a rune out of the phrase (it stays in the pouch). */
  uncompose(index: number): void {
    const hand = this.hand();
    if (index < 0 || index >= hand.tokens.length) return;
    hand.tokens.splice(index, 1);
    hand.sel = Math.max(0, Math.min(hand.sel, hand.tokens.length - 1));
  }

  /** The phrase never uses runes the player no longer has (dropped, stored away, spent). */
  syncHand(): void {
    const hand = this.hand();
    if (!hand?.tokens?.length) return;
    const left = new Map<string, number>();
    const keep: string[] = [];
    for (const t of hand.tokens) {
      if (!left.has(t)) left.set(t, countItem(this.inventory(), `rune:${t}`));
      if (left.get(t)! > 0) {
        keep.push(t);
        left.set(t, left.get(t)! - 1);
      }
    }
    if (keep.length !== hand.tokens.length) {
      hand.tokens = keep;
      hand.sel = Math.max(0, Math.min(hand.sel, keep.length - 1));
    }
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
    const added = pk.inv ? putSlot(this.inventory(), { item: pk.item, count: 1, inv: pk.inv }, info.spec) : this.give(pk.item, pk.count);
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
    if (def?.container) return void this.bus.emit('ui:bag', { slot: index });
    if (slot.item.startsWith('rune:')) return void this.composeRune(slot.item.slice(5));
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
    const id = this.spawnItem(taken.item, pc.x + dx * 0.8, pc.y + dy * 0.8, taken.count);
    if (taken.inv && this.ecs.alive.has(id)) this.ecs.get(id, 'pickup').inv = taken.inv;
    this.syncHand();
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
    const moved = s.inv ? putSlot(this.inventory(), s, this.itemSpec(s.item)) : this.give(s.item, s.count);
    if (!moved) return this.message("L'inventario è pieno.", 'warn');
    takeFromSlot(box.inv, slot, moved);
    this.message(`Prendi: ${this.itemInfo(s.item).name}${moved > 1 ? ` ×${moved}` : ''}`);
  }

  putIntoContainer(id: Id, slot: number): void {
    const box = this.container(id);
    const s = this.inventory().slots[slot];
    if (!box || !s) return;
    const moved = putSlot(box.inv, s, this.itemSpec(s.item));
    if (moved) takeFromSlot(this.inventory(), slot, moved);
    this.syncHand();
  }

  /** The inventory inside a bag the player carries (created the first time it is opened). */
  bag(slot: number): Inventory | undefined {
    const s = this.inventory().slots[slot];
    const def = s ? this.content.get(s.item) : undefined;
    if (!s || !def?.container) return undefined;
    s.inv ??= newInventory(Math.max(1, Math.min(24, def.container.size)));
    return s.inv;
  }

  /** Can this item go into that bag? (A rune pouch takes only runes; no bag inside a bag.) */
  bagAccepts(slot: number, item: string): boolean {
    const s = this.inventory().slots[slot];
    const def = s ? this.content.get(s.item) : undefined;
    const it = this.content.get(item);
    if (!def?.container || !it || it.container) return false;
    return !def.container.accepts || it.tags.includes(def.container.accepts) || it.category === def.container.accepts;
  }

  takeFromBag(bagSlot: number, i: number): void {
    const b = this.bag(bagSlot);
    const s = b?.slots[i];
    if (!b || !s) return;
    const moved = addItem(this.inventory(), s.item, s.count, this.itemSpec(s.item));
    if (!moved) return this.message("L'inventario è pieno.", 'warn');
    takeFromSlot(b, i, moved);
  }

  putIntoBag(bagSlot: number, i: number): void {
    const s = this.inventory().slots[i];
    const b = this.bag(bagSlot);
    if (!b || !s || i === bagSlot) return;
    if (!this.bagAccepts(bagSlot, s.item)) return this.message(`${this.itemInfo(s.item).name} non ci va, in ${this.itemInfo(this.inventory().slots[bagSlot]!.item).name}.`, 'warn');
    const moved = addItem(b, s.item, s.count, this.itemSpec(s.item));
    if (moved) takeFromSlot(this.inventory(), i, moved);
  }

  /**
   * Gives the player something: first into a bag made for it (runes into the rune pouch), then the
   * pockets, then any bag with room. Returns how many fit.
   */
  give(item: string, n: number): number {
    const inv = this.inventory();
    const spec = this.itemSpec(item);
    let left = Math.max(0, Math.floor(n));
    const bags = inv.slots.map((s, i) => ({ s, i })).filter(({ s }) => s && this.content.get(s.item)?.container);
    for (const { i } of bags) if (left && this.content.get(inv.slots[i]!.item)!.container!.accepts && this.bagAccepts(i, item)) left -= addItem(this.bag(i)!, item, left, spec);
    if (left) left -= addItem(inv, item, left, spec);
    for (const { i } of bags) if (left && !this.content.get(inv.slots[i]!.item)!.container!.accepts && this.bagAccepts(i, item)) left -= addItem(this.bag(i)!, item, left, spec);
    return Math.floor(n) - left;
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
    const added = this.give(r.output.item, r.output.count);
    if (added < r.output.count) {
      const pc = this.playerCarpet();
      this.spawnItem(r.output.item, pc.x, pc.y, r.output.count - added);
    }
    this.message(`Hai fatto: ${this.itemInfo(r.output.item).name}${r.output.count > 1 ? ` ×${r.output.count}` : ''}`, 'good');
    this.bus.emit('item:crafted', { recipe: r.id });
    return true;
  }

  /** A carried item whose name matches what a model said (exact first, then partial). */
  private carriedByName(name: string): string | undefined {
    const n = normName(name);
    const ids = new Set<string>();
    const walk = (inv: Inventory) => inv.slots.forEach((s) => s && (ids.add(s.item), s.inv && walk(s.inv)));
    walk(this.inventory());
    const list = [...ids];
    return list.find((id) => normName(this.itemInfo(id).name) === n) ?? list.find((id) => {
      const m = normName(this.itemInfo(id).name);
      return Math.min(m.length, n.length) >= 4 && (m.includes(n) || n.includes(m));
    });
  }

  /**
   * "Altro…" in crafting: the player says what to make. The Council decides from what (only things
   * carried); the kernel checks it; a possible recipe becomes a known recipe of the world, then is made.
   */
  async freeCraft(rawText: string): Promise<{ ok: boolean; story: string }> {
    const text = rawText.trim().slice(0, 120);
    if (!text) return { ok: false, story: '' };
    const key = `craft|${normName(text)}`;
    const ruled = this.rules().find((r) => r.chiave === key && !r.possibile);
    if (ruled) return { ok: false, story: ruled.racconto };
    let j;
    try {
      j = await judgeCraft(this.council, text, this.carriedNames(), [...this.content.items.values()].map((d) => d.name), this.focusOn([]));
    } catch (e) {
      return { ok: false, story: `(il Concilio tace: ${(e as Error).message})` };
    }
    const refuse = (why: string) => {
      this.council.say('narratore', 'obietta', `fabbricare «${text}»: ${why}`, undefined, 'craft.free');
      this.recordRule({ chiave: key, testo: `fabbricare «${text}»`, possibile: false, racconto: why }, true, { task: 'craft.free', autore: 'narratore' });
      return { ok: false, story: why };
    };
    if (!j.possible) return refuse(j.story || 'Non si può fare.');
    const inputs: Array<{ item: string; count: number }> = [];
    for (const i of j.inputs) {
      const id = this.carriedByName(i.item);
      if (!id) return { ok: false, story: `${j.story} Ma non hai «${i.item}».` };
      if (countItem(this.inventory(), id) < i.count) return { ok: false, story: `${j.story} Ma ti servono ${i.count} «${this.itemInfo(id).name}».` };
      inputs.push({ item: id, count: i.count });
    }
    if (!inputs.length) return refuse('Dal nulla non si fabbrica niente.');
    const tools: string[] = [];
    for (const t of j.tools) {
      const id = this.carriedByName(t);
      if (!id) return { ok: false, story: `${j.story} Ma non hai «${t}».` };
      if (!inputs.some((i) => i.item === id)) tools.push(id);
    }
    const result = this.content.byName(j.result!) ?? (await this.introduceItems([j.result!], `fabbricato dal viandante: ${j.description ?? text}`))[0];
    if (!result) return { ok: false, story: `${j.story} (ma il Concilio non riesce a dire cosa ne esca)` };
    let id = `ricetta.${slug(result.name)}`;
    while (this.content.recipes.some((r) => r.id === id)) id += '-2';
    const recipe: Recipe = { id, name: result.name, inputs, ...(tools.length ? { tools } : {}), output: { item: result.id, count: j.count } };
    this.recordRule({ chiave: key, testo: `fabbricare «${result.name}»`, possibile: true, racconto: j.story, effetti: [`ricetta: ${inputs.map((i) => `${this.itemInfo(i.item).name} ×${i.count}`).join(' + ')}`] }, false, { task: 'craft.free', autore: 'narratore' });
    this.writePack('modules/items.scoperte/manifest.json', { id: 'items.scoperte', name: 'Ricette scoperte', description: 'Ricette che il viandante ha inventato e che il Concilio ha giudicato possibili: ora sono regole del mondo.' }, { items: [], recipes: [recipe], loot: {} });
    this.applyFiles({ ...this.repo.working });
    const c = this.commitContent(`ricetta scoperta: ${result.name}`, 'craft.free', 'narratore');
    this.council.say('narratore', 'approva', `nuova ricetta «${result.name}»: ${inputs.map((i) => `${this.itemInfo(i.item).name} ×${i.count}`).join(' + ')}${tools.length ? ` con ${tools.map((t) => this.itemInfo(t).name).join(', ')}` : ''} (commit ${c.id})`, undefined, 'craft.free');
    this.craft(id);
    return { ok: true, story: j.story };
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
      verdict = await judgeCombination(this.council, ia, ib, known.map((d) => d.name).slice(-150), this.focusOn([ia.name, ib.name]));
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
    this.give(result, 1);
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
    // What its model can do: rules on its voxels (a door that opens, a lid that lifts).
    for (const a of this.modelActions(id)) out.push({ id: `modello:${a.name}`, label: a.label, enabled: true });
    const pickupItem = this.ecs.get(id, 'pickup')?.item;
    for (const a of [...(m?.actions ?? []), ...(pickupItem ? (this.content.get(pickupItem)?.actions ?? []) : [])]) {
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
    if (this.zone === 'corona' || this.zone === 'studio') return this.interactStudio();
    if (this.pickUpRune()) return;
    const target = this.targetInFront();
    if (target !== undefined && this.ecs.has(target, 'pickup')) {
      this.pickUpEntity(target);
      return;
    }
    // The menu of the tile in front, with what stands on it.
    const pc = this.playerCarpet();
    const [dx, dy] = this.facingDelta();
    const col = target !== undefined ? Math.floor(this.ecs.get(target, 'pos').x) : Math.floor(pc.x + dx);
    const row = target !== undefined ? Math.floor(this.ecs.get(target, 'pos').y) : Math.floor(pc.y + dy);
    this.openTileMenu(col, row, target);
  }

  /**
   * Every tile has a context menu: what stands on it (an object, a person) with its actions, then the
   * actions learned on this kind of terrain, then "Altro…" for the tile itself.
   */
  tileMenu(col: number, row: number, entity?: Id): { title: string; options: ActionOption[]; entity?: Id } {
    const code = this.tileAt(col, row);
    const t = code ? this.palette[code] : undefined;
    const on = entity ?? this.nearest(col + 0.5, row + 0.5, 0.75);
    const options: ActionOption[] = [];
    if (on !== undefined) for (const o of this.actionsFor(on)) options.push({ ...o, id: `e:${o.id}`, label: o.id === 'altro' ? `Altro… (${this.nameOf(on)})` : o.label });
    if (t) {
      for (const a of t.actions ?? []) if (a.effects?.length) options.push({ id: `t:${a.id}`, label: `${a.label} (${t.name})`, enabled: !a.requires || countItem(this.inventory(), a.requires) > 0, reason: a.requires && countItem(this.inventory(), a.requires) <= 0 ? `serve: ${this.itemInfo(a.requires).name}` : undefined });
      options.push({ id: 't:altro', label: `Altro… (${t.name})`, enabled: true });
    }
    const title = [on !== undefined ? this.nameOf(on) : '', t?.name ?? ''].filter(Boolean).join(' — ');
    return { title, options, entity: on };
  }

  openTileMenu(col: number, row: number, entity?: Id): void {
    const m = this.tileMenu(col, row, entity);
    if (!m.options.length) return;
    this.bus.emit('ui:actions', { id: m.entity ?? -1, col, row, name: m.title, options: m.options });
  }

  /** Right click: the menu of a tile near the wanderer (real-space point → carpet tile). */
  contextAt(rx: number, ry: number): boolean {
    if (this.zone !== 'sim') return false;
    const { ox, oy } = this.offset();
    const col = Math.floor(rx + ox);
    const row = Math.floor(ry + oy);
    const pc = this.playerCarpet();
    if (Math.hypot(col + 0.5 - pc.x, row + 0.5 - pc.y) > 2.6) {
      this.message('Troppo lontano: avvicinati.');
      return false;
    }
    this.openTileMenu(col, row);
    return true;
  }

  /** A choice of a tile menu: the entity's action, a learned terrain action, or "Altro…" on the tile. */
  async performMenu(option: string, entity: Id, col: number, row: number): Promise<void> {
    if (option.startsWith('e:') && entity >= 0) return this.perform(entity, option.slice(2));
    if (option === 't:altro') return void this.bus.emit('ui:freeaction', { id: -1, col, row, name: this.palette[this.tileAt(col, row) ?? '']?.name ?? 'qui' });
    if (option.startsWith('t:')) {
      const code = this.tileAt(col, row);
      const a = code ? this.palette[code]?.actions?.find((x) => x.id === option.slice(2)) : undefined;
      if (!a?.effects) return;
      if (a.requires && countItem(this.inventory(), a.requires) <= 0) return this.message(`Ti serve ${this.itemInfo(a.requires).name}.`, 'warn');
      const out = this.applyOn({ tile: { col, row }, key: `tile:${code}` }, a.effects);
      this.bus.emit('ui:dialog', { speaker: this.palette[code!].name, text: out.join(' ') || `${a.label}: fatto.` });
    }
  }

  /** "Altro…" on a tile: what the wanderer does there (dig, draw water, cut the tree…). */
  async freeTileAction(col: number, row: number, text: string): Promise<string> {
    const code = this.tileAt(col, row);
    const t = code ? this.palette[code] : undefined;
    if (!t || !code) return '';
    return this.judgeFree({ tile: { col, row }, key: `tile:${code}`, name: t.name, description: t.description ?? t.name, tags: [t.layer ?? 'ground'], container: false, kind: 'terreno (una casella del mondo)', learnTile: code }, text);
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
          say(await narrate(this.council, { name: speaker, description: m?.description ?? '', lore: m?.lore }, this.worldFacts(), this.focusOn([speaker, modId && `tipo:${nodeSlug(modId)}`], this.ecs.get(id, 'pos'))));
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
            text = await examine(this.council, { name: what.name, description: what.description, lore: (what as { lore?: string }).lore }, this.worldFacts(), this.focusOn([what.name, modId && `tipo:${nodeSlug(modId)}`], this.ecs.get(id, 'pos')));
            this.examined.set(key, text);
          } catch (e) {
            text = `${what.description} (${(e as Error).message})`;
          }
        }
        say(text);
        return;
      }
      default:
        if (action.startsWith('modello:')) {
          const a = this.modelActions(id).find((x) => `modello:${x.name}` === action);
          if (a && this.doModelAction(id, a.name)) this.message(`${a.label}.`);
          return;
        }
        if (action.startsWith('act:')) {
          const pickupItem = this.ecs.get(id, 'pickup')?.item;
          const a = [...(m?.actions ?? []), ...(pickupItem ? (this.content.get(pickupItem)?.actions ?? []) : [])].find((x) => `act:${x.id}` === action);
          const opt = this.actionsFor(id).find((o) => o.id === action);
          if (!a || !opt?.enabled) return say(opt?.reason ?? 'Non puoi farlo.');
          if (a.effects?.length) {
            const out = this.applyEffects(a.effects, id);
            return say(out.join(' ') || `${a.label}: fatto.`);
          }
          if (!modId) return;
          const { value, failed } = this.runModule(modId, 'on_act', id, this.playerId, a.id);
          if (!failed) say(typeof value === 'string' && value ? value : `${a.label}: fatto.`);
        }
    }
  }

  /**
   * "Altro…": the player writes what they do to a thing in the world. Actions the thing already learned
   * run directly, judgements already given are remembered (rules); otherwise the Narrator judges, the
   * validator keeps only known effects, core.effects applies them, and the thing learns the action.
   */
  async freeAction(id: Id, text: string): Promise<string> {
    if (!this.ecs.alive.has(id)) return '';
    const modId: string | undefined = this.ecs.get(id, 'module')?.id;
    const entry = modId ? this.modules.get(modId) : undefined;
    const m = entry?.manifest;
    const pk = this.ecs.get(id, 'pickup');
    const info = pk ? this.itemInfo(pk.item) : undefined;
    const identity: Identity | undefined = this.ecs.get(id, 'identity');
    return this.judgeFree(
      {
        entity: id,
        key: pk ? pk.item : (modId ?? this.nameOf(id)),
        name: this.nameOf(id),
        description: info?.description ?? `${m?.description ?? ''}${identity ? ` ${identity.look}` : ''}`,
        tags: info?.tags ?? m?.tags ?? [],
        container: this.ecs.has(id, 'container'),
        kind: pk ? 'oggetto a terra' : m?.persona ? 'persona' : this.ecs.has(id, 'container') ? 'mobile' : 'cosa',
        learnModule: !pk && !m?.persona ? entry : undefined,
        learnItem: pk?.item,
      },
      text,
    );
  }

  /** "Altro…" on something the player carries: a fanciful use, judged like any other action. */
  async freeItemAction(slot: number, text: string): Promise<string> {
    const s = this.inventory().slots[slot];
    if (!s) return '';
    const info = this.itemInfo(s.item);
    return this.judgeFree(
      { slot, key: s.item, name: info.name, description: info.description, tags: info.tags, container: !!this.content.get(s.item)?.container, kind: 'oggetto che porti con te', learnItem: s.item },
      text,
    );
  }

  /** Actions a thing has learned (its module's, or its item definition's). */
  learnedActions(sub: { learnModule?: ModuleEntry; learnItem?: string; learnTile?: string }): ActionDef[] {
    return [...(sub.learnModule?.manifest.actions ?? []), ...(sub.learnItem ? (this.content.get(sub.learnItem)?.actions ?? []) : []), ...(sub.learnTile ? (this.palette[sub.learnTile]?.actions ?? []) : [])].filter((a) => a.effects?.length);
  }

  /**
   * A child is born to someone and the wanderer (the Council allowed it): a new person of the same
   * kind, with the family already written, who will grow up in the same place.
   */
  async birth(parentId: Id, name?: string): Promise<Id | undefined> {
    const parent: Identity | undefined = this.ecs.get(parentId, 'identity');
    const entry = this.modules.get(this.ecs.get(parentId, 'module')?.id);
    const p = this.ecs.get(parentId, 'pos');
    if (!parent || !entry || !p) return undefined;
    const origin = `${this.ecs.get(parentId, 'origin')?.key ?? parent.name}#figlio${this.worldStamp()}`;
    const child = this.spawnModuleEntity(entry, p.x + 0.7, p.y + 0.4, this.ecs.get(parentId, 'chunk')?.key, origin);
    const gender = name ? guessGender({ nome: name, mestiere: '', famiglia: [] }) : hashStr(origin) % 2 ? 'femmina' : 'maschio';
    // A name of their own, unlike anyone else's (not "Piccola Berta" beside Berta).
    const taken = readPeople(this.files).persone.map((x) => x.nome);
    const nome = name && !taken.some((t) => similarNames(t, name)) ? name : freshName(this.speciesOf(entry.manifest.id) ?? 'persona', gender, taken, origin);
    const child_ = gender === 'femmina' ? 'figlia' : 'figlio';
    const w = this.wanderer();
    const other = this.wandererWord(w);
    const ofOther = other === 'il viandante' ? 'del viandante' : `di ${other}`;
    const identity: Identity = {
      name: nome,
      persona: `Sei ${nome}, ${gender === 'femmina' ? 'una bambina appena nata' : 'un bambino appena nato'}, ${child_} di ${parent.name} e ${ofOther}. Parli a monosillabi, guardi tutto con meraviglia.`,
      look: 'piccolissimo, in fasce',
      carrying: [],
      job: 'bambino',
      age: 'neonato',
      gender,
      family: [{ nome: parent.name, legame: child_ }, { nome: w.nome, legame: child_, viandante: w.id }],
      routine: [
        { quando: 'mattina', fa: 'gioca vicino a casa', dove: 'casa', azione: 'passeggia' },
        { quando: 'giorno', fa: 'segue il genitore al lavoro', dove: 'lavoro', azione: 'passeggia' },
        { quando: 'sera', fa: 'ascolta storie in piazza', dove: 'piazza', azione: 'chiacchiera' },
        { quando: 'notte', fa: 'dorme', dove: 'casa', azione: 'dorme' },
      ],
    };
    this.ecs.set(child, 'identity', identity);
    const glyph = this.ecs.get(child, 'glyph');
    if (glyph) glyph.scale = (glyph.scale ?? 1.1) * 0.6;
    const next = addPerson(readPeople(this.files), { nome, tipo: entry.manifest.id, specie: this.speciesOf(entry.manifest.id) ?? 'persona', genere: gender, mestiere: 'bambino', eta: 'neonato', famiglia: identity.family!, routine: identity.routine!, origine: origin, persona: identity.persona, aspetto: identity.look }, (t) => this.speciesOf(t));
    this.repo.write('world/people.json', JSON.stringify(next, null, 2) + '\n');
    this.applyFiles({ ...this.repo.working });
    this.commitContent(`nascita: ${nome}, ${child_} di ${parent.name} e ${ofOther}`, 'npc.birth', 'narratore');
    this.rememberWanderer(parent.name, `è ${gender === 'femmina' ? 'nata nostra figlia' : 'nato nostro figlio'}, ${nome}`, 3);
    this.message(`È ${gender === 'femmina' ? 'nata' : 'nato'} ${nome}!`, 'good');
    this.council.say('narratore', 'approva', `nasce ${nome}, ${child_} di ${parent.name} e ${ofOther}`, undefined, 'npc.birth');
    return child;
  }

  /** Runs a learned action of something carried (inventory buttons). */
  itemAct(slot: number, actionId: string): void {
    const s = this.inventory().slots[slot];
    const a = s ? this.content.get(s.item)?.actions?.find((x) => x.id === actionId) : undefined;
    if (!s || !a?.effects) return;
    if (a.requires && countItem(this.inventory(), a.requires) <= 0) return this.message(`Ti serve ${this.itemInfo(a.requires).name}.`, 'warn');
    const out = this.applyOn({ slot, key: s.item }, a.effects);
    this.message(out.join(' ') || `${a.label}: fatto.`);
  }

  /** Applies effects to the subject of an action: a thing in the world, or something carried. */
  private applyOn(sub: { entity?: Id; slot?: number; tile?: { col: number; row: number }; key: string }, all: Effect[]): string[] {
    // Acting on something never spends it by accident: only "distruggi" breaks or uses it up.
    let effects = all.filter((e) => !(e.tipo === 'consuma' && e.oggetto === sub.key));
    // Between people: bonds, memories, births are the society's, not the Lua effects'.
    const social = effects.filter((e) => e.tipo === 'legame' || e.tipo === 'ricordo' || e.tipo === 'nascita');
    effects = effects.filter((e) => !(social as Effect[]).includes(e));
    const who: Identity | undefined = sub.entity !== undefined ? this.ecs.get(sub.entity, 'identity') : undefined;
    if (who) {
      for (const e of social) {
        if (e.tipo === 'legame') this.setBond(who.name, e.legame);
        else if (e.tipo === 'ricordo') this.rememberWanderer(who.name, e.testo, e.peso ?? 2);
        else if (e.tipo === 'nascita') void this.birth(sub.entity!, e.nome);
      }
    }
    if (sub.entity !== undefined) return this.applyEffects(effects, sub.entity);
    // On a tile: everything happens there (destroying a tile turns it into the ground around).
    if (sub.tile) return this.applyEffects(effects.filter((e) => e.tipo !== 'distruggi' && e.tipo !== 'apri' && e.tipo !== 'contenitore'), undefined, { x: sub.tile.col + 0.5, y: sub.tile.row + 0.5 });
    const out: string[] = [];
    const rest: Effect[] = [];
    for (const e of effects) {
      if (e.tipo === 'distruggi' && sub.slot !== undefined) removeItem(this.inventory(), sub.key, 1);
      else if (e.tipo === 'apri' && sub.slot !== undefined && this.content.get(sub.key)?.container) this.bus.emit('ui:bag', { slot: sub.slot });
      else if (e.tipo !== 'contenitore' && e.tipo !== 'spingi') rest.push(e);
    }
    const pc = this.playerCarpet();
    const [dx, dy] = this.facingDelta();
    out.push(...this.applyEffects(rest, undefined, { x: pc.x + dx, y: pc.y + dy }));
    this.syncHand();
    return out;
  }

  private async judgeFree(
    sub: { entity?: Id; slot?: number; tile?: { col: number; row: number }; key: string; name: string; description: string; tags: string[]; container: boolean; kind: string; learnModule?: ModuleEntry; learnItem?: string; learnTile?: string },
    rawText: string,
  ): Promise<string> {
    const text = rawText.trim().slice(0, 200);
    if (!text) return '';
    // Who asks: after the await what happens is theirs (`as` never spans an await).
    const me = this.wanderer().id;
    const say = (t: string) => this.bus.emit('ui:dialog', { speaker: sub.name, text: t });
    // What its model already knows how to do (an action of the program) happens without asking.
    const own = sub.entity !== undefined ? this.modelActions(sub.entity).find((a) => normName(a.label) === normName(text) || normName(a.name) === normName(text)) : undefined;
    if (own && this.doModelAction(sub.entity!, own.name)) {
      say(`${own.label}.`);
      return own.label;
    }
    const learned = this.learnedActions(sub).find((a) => normName(a.label) === normName(text));
    if (learned) {
      if (learned.requires && countItem(this.inventory(), learned.requires) <= 0) {
        say(`Ti serve ${this.itemInfo(learned.requires).name}.`);
        return learned.label;
      }
      say(this.applyOn(sub, learned.effects!).join(' ') || `${learned.label}: fatto.`);
      return learned.label;
    }
    // What the Council already ruled impossible stays impossible: no need to ask again.
    const ruleKey = `${sub.key}|${normName(text)}`;
    const ruled = this.rules().find((r) => r.chiave === ruleKey && !r.possibile);
    if (ruled) {
      say(ruled.racconto);
      return ruled.racconto;
    }
    const p = sub.entity !== undefined ? this.ecs.get(sub.entity, 'pos') : sub.tile ? { x: sub.tile.col + 0.5, y: sub.tile.row + 0.5 } : this.playerCarpet();
    const tile = p ? (this.palette[this.tileAt(Math.floor(p.x), Math.floor(p.y)) ?? '']?.name ?? '?') : '?';
    const inv = this.inventory();
    const held = equippedItem(inv);
    const summonable = [...this.modules.values()].filter((e) => e.manifest.kind === 'entity' && !e.manifest.unique);
    this.council.say('kernel', 'info', `il viandante prova: «${text}» su ${sub.name}`, 'narratore', 'action.judge');
    let j;
    try {
      j = await judgeAction(this.council, {
        text,
        target: { name: sub.name, description: sub.description, tags: sub.tags, container: sub.container, kind: sub.kind },
        carrying: this.carriedNames(),
        holding: held ? this.itemInfo(held).name : 'niente',
        tile,
        terrains: Object.entries(this.palette).filter(([c]) => c !== '?').map(([, t]) => t.name),
        summonable: summonable.map((e) => e.manifest.name),
        loot: Object.keys(this.content.loot),
        place: this.placeHere()?.name ?? '',
        transcended: this.exitedOnce,
        shape: sub.entity !== undefined && !!this.shapeModel(sub.entity),
      }, this.focusOn([sub.name, sub.learnModule && `tipo:${nodeSlug(sub.learnModule.manifest.id)}`, sub.learnItem && `oggetto:${nodeSlug(sub.learnItem)}`], p));
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
      await this.introduceItems(v.unknownItems, `nati dall'azione «${text}» su ${sub.name}`);
      v = validateEffects(j.possible ? j.effects : [], ectx);
    }
    v.effects = v.effects.filter((e) => !(e.tipo === 'consuma' && e.oggetto === sub.key));
    // What changes the thing's look becomes a rule of its model (ADR-0044): the thing stays, changed.
    const shaped = j.possible && j.shape && sub.entity !== undefined ? await this.learnShape(sub.entity, j.label || text, text, j.shape) : undefined;
    if (shaped) v.effects = v.effects.filter((e) => e.tipo !== 'distruggi');
    if (v.dropped.length) this.council.say('kernel', 'scarta', `azione «${text}»: ${v.dropped.join('; ')}`, 'narratore', 'action.judge');
    this.council.say('narratore', j.possible ? 'approva' : 'obietta', `«${text}» su ${sub.name}: ${j.story}${v.effects.length ? ` [${v.effects.map((e) => e.tipo).join(', ')}]` : ''}`, undefined, 'action.judge');
    const out = j.possible ? this.as(me, () => this.applyOn(sub, v.effects)) : [];
    say([j.story, ...out].filter(Boolean).join(' ') || 'Non succede niente.');
    // The decision becomes a rule of the world; a possible action stays in the thing's menu.
    const lasting = v.effects.some((e) => e.tipo !== 'messaggio');
    const creates = v.effects.some((e) => e.tipo === 'crea_oggetto' || e.tipo === 'evoca');
    const pays = v.effects.some((e) => e.tipo === 'consuma') || !!need;
    // A rule of the model is already in every menu of the kind: the rest happened this once.
    const learn = j.possible && !shaped && lasting && (!creates || pays);
    this.recordRule({ chiave: ruleKey, testo: `«${text}» su ${sub.name}`, possibile: j.possible && (v.effects.length > 0 || !!shaped), racconto: j.story, effetti: [...(shaped ? ['forma'] : []), ...v.effects.map((e) => e.tipo)] }, !learn, { task: 'action.judge', autore: 'narratore' });
    if (learn) this.learnAction(sub, { id: '', label: j.label || text, requires: need?.id, effects: v.effects });
    return j.story;
  }

  /** Names of what the player carries, bags included. */
  carriedNames(): string[] {
    const out: string[] = [];
    const walk = (inv: Inventory) => {
      for (const s of inv.slots) {
        if (!s) continue;
        out.push(`${this.itemInfo(s.item).name}${s.count > 1 ? ` ×${s.count}` : ''}`);
        if (s.inv) walk(s.inv);
      }
    };
    walk(this.inventory());
    return out;
  }

  /** The rules the Council established while the world was played (world/rules.json). */
  rules(): Rule[] {
    try {
      return (JSON.parse(this.files['world/rules.json'] ?? '{}').regole ?? []) as Rule[];
    } catch {
      return [];
    }
  }

  /** A judgement becomes a rule: written in the universe, shown to the Council in every later judgement. */
  recordRule(r: Rule, commit = true, card?: { task: string; autore: string }): void {
    // A judgement of the Council is a card (T36); the facts the kernel notes (a death, a bond, a quest) are not.
    if (card) r.carta = this.sign(`regola:${nodeSlug(r.chiave)}`, card.task, card.autore);
    const all = this.rules().filter((x) => x.chiave !== r.chiave);
    all.push(r);
    this.repo.write('world/rules.json', JSON.stringify({ regole: all.slice(-300) }, null, 2) + '\n');
    this.files = { ...this.files, 'world/rules.json': this.repo.working['world/rules.json']! };
    if (commit) {
      this.applyFiles({ ...this.repo.working });
      this.repo.commit(`regola: ${r.testo} → ${r.possibile ? 'si può' : 'non si può'}`, 'agent');
    }
  }

  /** What the gallery shows: every thing of this universe that has (or will have) a model. */
  private exhibits(files: FileMap): Exhibit[] {
    const out: Exhibit[] = [];
    for (const path of Object.keys(files)) {
      if (!/^modules\/[^/]+\/manifest\.json$/.test(path)) continue;
      let man: Manifest;
      try {
        man = JSON.parse(files[path]);
      } catch {
        continue;
      }
      if (man.appearance) out.push({ label: man.name, color: man.appearance.color, path, target: `module:${man.id}`, model: this.formFor(man, man.id).model });
      for (const it of man.items ?? []) out.push({ label: it.name, color: it.color, path, target: `item:${it.id}`, model: this.forms.resolve(it.model, 'oggetto'), tint: it.color });
    }
    return out;
  }

  /** What the map room shows: every kind of terrain. */
  private terrainExhibits(): Exhibit[] {
    const path = this.terrain?.manifestPath ?? 'modules/world.terrain/manifest.json';
    const out: Exhibit[] = [];
    for (const [code, t] of Object.entries(this.palette)) {
      if (code === '?') continue;
      out.push({ label: `${t.name} («${code}»)`, color: t.color, path, target: `tile:${code}` });
    }
    return out;
  }

  /** What the sample room shows after the terrains (T26d): every environment, in the order of its module. */
  private layoutExhibits(): Exhibit[] {
    const out: Exhibit[] = [];
    for (const m of this.modules.values())
      for (const [id, def] of Object.entries(m.manifest.layouts ?? {})) if (this.content.layouts[id] === def) out.push({ label: def.name, path: m.manifestPath, target: `layout:${id}` });
    return out;
  }

  /**
   * An environment run on a trial draft (T26d), as the validator tries it: each of `sampleDrafts` laid out with its
   * program, the one it changes most kept. Deterministic, made once per state of the files; it does not plan anything.
   */
  layoutSample(id: string): LayoutSample | undefined {
    const hit = this.layoutSamples.get(id);
    if (hit?.files === this.files) return hit.sample;
    const def = this.content.layouts[id];
    const entry: { files: FileMap; sample?: LayoutSample } = { files: this.files };
    this.layoutSamples.set(id, entry);
    if (!def) return undefined;
    const S = this.config.chunkSize;
    const path = [...this.modules.values()].find((m) => m.manifest.layouts?.[id] === def)?.manifestPath ?? '';
    const drafts = this.sampleDrafts();
    let best: { draft: number; changed: number; tiles: string } | undefined;
    let error: string | undefined;
    drafts.forEach((draft, i) => {
      try {
        const r = layout(draft, this.palette, { cx: 100 + i, cy: -100, seed: 1, program: def.program, pathCode: this.pathCode() });
        const before = draft.join(''), tiles = r.grid.join('');
        const changed = [...tiles].filter((c, j) => c !== before[j]).length;
        if (!best || changed > best.changed) best = { draft: i, changed, tiles };
      } catch (e) {
        error ??= (e as Error).message;
      }
    });
    const tiles = best?.tiles ?? drafts[0].join('');
    const mini: PlaceMiniature = { cx: 0, cy: 0, size: S, tiles, levels: Array<number>(S * S).fill(0), structures: [], things: [], runes: [], phases: [] };
    return (entry.sample = { id, name: def.name, description: def.description, environment: def.environment, path, draft: best?.draft ?? 0, changed: best?.changed ?? 0, mini, ...(best ? {} : { error }) });
  }

  /** Files changed by the latest commits of this session: the studio shows them glowing. */
  recentChanges(): Map<string, { author: string; message: string; time: number }> {
    return this.repo.recentChanges(24);
  }

  /** E in the corona and in the studio: doors, stairs, shelves, frames, the notice board, people. */
  private interactStudio(): void {
    const p = this.playerPos();
    // Standing on a teleport, the stairs or the exit: that, before whoever stands near.
    const under = this.zone === 'studio' ? this.corona.itemNear(p.x, p.y) : undefined;
    const onPad = under && ['portal', 'up', 'down', 'exit', 'less', 'more'].includes(under.kind) && Math.hypot(under.x + 0.5 - p.x, under.y + 0.5 - p.y) < 0.75;
    const a = onPad ? undefined : this.archive.nearest(p.x, p.y);
    if (a) return void this.bus.emit('ui:agentchat', { agent: a.agent, name: a.name });
    if (this.zone === 'corona') {
      const b = this.corona.doorNear(p.x, p.y);
      if (b) {
        Object.assign(p, this.corona.entrance(b));
        this.message(`${b.name}${b.floors.length > 1 ? ` — ${b.floors.length} piani` : ''}`);
        this.updateZone();
        return;
      }
      this.message('Avvicinati alla porta di un edificio, o a qualcuno del Concilio.');
      return;
    }
    const it = this.corona.itemNear(p.x, p.y);
    const room = this.corona.roomAt(p.x, p.y);
    if (!it || !room) return this.message('Avvicinati a uno scaffale, a un quadro, alla bacheca o alle scale.');
    switch (it.kind) {
      case 'file':
        this.bus.emit('ui:edit', { path: it.path, line: 1 });
        return;
      case 'sprite':
      case 'tile':
        this.bus.emit('ui:exhibit', { item: it, building: room.building.name });
        return;
      case 'layout':
        this.openLayout(it, room.building.name);
        return;
      case 'screen':
        this.bus.emit('ui:board', { building: room.building.id, name: room.building.name });
        return;
      case 'atlas':
        this.bus.emit('ui:atlas', {});
        return;
      case 'grafo':
        this.bus.emit('ui:graph', {});
        return;
      case 'situazione':
        this.bus.emit('ui:situation', { situation: this.situation() });
        return;
      case 'parete':
        this.openScreen(it.target as ScreenField);
        return;
      case 'console':
        this.openScreen('registro');
        return;
      case 'stazione':
        this.openStation(it.target!);
        return;
      case 'banco':
        this.openBench();
        return;
      case 'showcase':
        this.openShowcase(it.target!);
        return;
      case 'prev':
      case 'next':
        if (it.target === 'tempo') this.stepTimeline(it.kind === 'prev' ? 1 : -1);
        else if (it.target === 'banco') this.stepBench(it.kind === 'prev' ? -1 : 1);
        else this.stepShowcase(it.target!, it.kind === 'prev' ? -1 : 1);
        return;
      case 'less':
      case 'more':
        this.stepPhase(it.target!, it.kind === 'less' ? -1 : 1);
        return;
      case 'table':
        this.message("Al centro del tavolo, sullo schermo rotondo, l'universo gira. Ognuno del Concilio ha alle spalle il teletrasporto per la sua sala.");
        return;
      case 'portal': {
        const to = this.corona.building(it.target);
        if (to) {
          Object.assign(p, this.corona.entrance(to));
          this.message(to.name);
        } else {
          Object.assign(p, this.corona.exitPoint(room.building));
          this.updateZone();
        }
        this.bus.emit('studio:teleport', {});
        return;
      }
      case 'up':
      case 'down': {
        const next = room.floor.index + (it.kind === 'up' ? 1 : -1);
        Object.assign(p, this.corona.entrance(room.building, next, it.kind === 'up' ? 'up' : 'down'));
        this.message(`${room.building.name}, piano ${next + 1}`);
        return;
      }
      case 'exit':
        Object.assign(p, this.corona.exitPoint(room.building));
        this.updateZone();
        return;
    }
  }

  /**
   * A left click in the studio (T21): on a showcase or its arrows (or the phases of the model of places, T26), or on the Nucleus's graph (T28), within reach, the same as E there.
   * The click falls on the ground, often behind something tall: the nearest of them to that point counts.
   * Returns whether it did something.
   */
  /** An environment of the sample room (T26d): its panel, with the program on its trial draft. */
  private openLayout(it: StudioItem, building: string): void {
    const sample = it.target ? this.layoutSample(it.target.replace(/^layout:/, '')) : undefined;
    if (sample) this.bus.emit('ui:layout', { sample, building });
  }

  clickStudio(rx: number, ry: number): boolean {
    if (this.zone !== 'studio') return false;
    const it = this.corona.itemNear(rx, ry, 1.6, ['showcase', 'prev', 'next', 'less', 'more', 'grafo', 'situazione', 'parete', 'console', 'stazione', 'banco', 'layout']);
    if (!it) return false;
    const p = this.playerPos();
    const c = cellNear(it, p.x, p.y);
    if (Math.hypot(c.x + 0.5 - p.x, c.y + 0.5 - p.y) > 4) {
      this.message('Troppo lontano: avvicinati.');
      return false;
    }
    if (it.kind === 'grafo') this.bus.emit('ui:graph', {});
    else if (it.kind === 'situazione') this.bus.emit('ui:situation', { situation: this.situation() });
    else if (it.kind === 'parete') this.openScreen(it.target as ScreenField);
    else if (it.kind === 'console') this.openScreen('registro');
    else if (it.kind === 'stazione') this.openStation(it.target!);
    else if (it.kind === 'banco') this.openBench();
    else if (it.target === 'tempo') this.stepTimeline(it.kind === 'prev' ? 1 : -1);
    else if (it.target === 'banco') this.stepBench(it.kind === 'prev' ? -1 : 1);
    else if (it.kind === 'layout') this.openLayout(it, this.corona.roomAt(it.x, it.y)?.building.name ?? '');
    else if (it.kind === 'showcase') this.openShowcase(it.target!);
    else if (it.kind === 'less' || it.kind === 'more') this.stepPhase(it.target!, it.kind === 'less' ? -1 : 1);
    else this.stepShowcase(it.target!, it.kind === 'prev' ? -1 : 1);
    return true;
  }

  /**
   * The buildings of the campus that have a model in the library (`models/corona-<id>.xml`) wear it as soon as it
   * has run (T20, ADR-0049): its voxels block, its door is where one goes in; the others stay plain blocks.
   */
  placeCampus(): void {
    this.campusVersion = this.forms.version;
    for (const b of this.corona.buildings) {
      const model = campusModel(b.id);
      if (b.structure || !this.forms.info(model)) continue;
      const f = this.forms.ready(model, 1);
      if (f) this.corona.placeStructure(b.id, model, f);
    }
  }

  /** What a source of showcases has to show, in a stable order. */
  showcaseEntries(source: ShowcaseSource): ShowcaseEntry[] {
    // The places change as they are planned, loaded (what is known of them) and visited (their order).
    const here = this.lastPlace();
    const stamp = source === 'luoghi' ? `${this.graphPlacesVersion}|${this.plannedCount}|${this.chunks.size}|${here.cx},${here.cy}` : '';
    const hit = this.showcaseCache.get(source);
    if (hit?.files === this.files && hit.stamp === stamp) return hit.entries;
    const entries = this.listShowcase(source);
    this.showcaseCache.set(source, { files: this.files, stamp, entries });
    return entries;
  }

  /** The place where the wanderer stands, or (from the studio) last stood in the world. */
  private lastPlace(): { cx: number; cy: number } {
    const S = this.config.chunkSize;
    const p = this.corona.isInterior(this.playerPos().x) ? this.lastWorld : this.playerCarpet();
    return { cx: Math.floor(p.x / S), cy: Math.floor(p.y / S) };
  }

  private listShowcase(source: ShowcaseSource): ShowcaseEntry[] {
    const out: ShowcaseEntry[] = [];
    if (source === 'rune') {
      // T22: every magic rune on its own, then every known combination; each with what it does when spoken.
      const runes = this.content.runes;
      let discovered: Record<string, unknown> = {};
      try {
        discovered = JSON.parse(this.files['modules/magic.spells/manifest.json'] ?? '{}').spells ?? {};
      } catch {
        // A broken file of discovered spells: they are still in the content, only not pointed at.
      }
      const names = {
        tile: (c: string) => this.palette[c]?.name,
        item: (id: string) => this.content.get(id)?.name,
        module: (id: string) => this.modules.get(id)?.manifest.name,
      };
      const combos = [...Object.keys(runes), ...Object.keys(this.content.spells).filter((s) => !runes[s] && s.split(' ').every((t) => runes[t])).sort((a, b) => a.split(' ').length - b.split(' ').length || a.localeCompare(b))];
      for (const seq of combos) {
        const tokens = seq.split(' ');
        const sp = this.content.spells[seq];
        const one = tokens.length === 1 ? runes[seq] : undefined;
        const facts: Array<[string, string]> = [['Rune', tokens.map((t) => `${runes[t].glyph} ${runes[t].name} («${t}», ${runes[t].element})`).join(' · ')]];
        if (one) facts.push(['Significato', one.description]);
        if (sp) {
          // What casting it really does: the effects as the kernel would apply them.
          const does = validateEffects(sp.effects, { palette: this.palette, item: (x) => this.content.byName(x)?.id ?? (this.content.get(x) ? x : undefined), module: (x) => (this.modules.get(x)?.manifest.kind === 'entity' ? x : undefined), loot: new Set(Object.keys(this.content.loot)) }).effects.map((e) => describeEffect(e, names)).filter(Boolean);
          facts.push(['Incantesimo', sp.name], ['Effetto', sp.description]);
          if (does.length) facts.push(['Cosa fa', does.join('; ')]);
          facts.push(['Mana', String(sp.cost)]);
        } else facts.push(['Effetto', 'Nessuno ancora: la prima volta che qualcuno la pronuncia, il Narratore le dà un nome e un effetto.']);
        if (tokens.length >= Kernel.CRYSTAL_RUNES) facts.push(['Cristallo', 'ne consuma uno']);
        facts.push(['Si pronuncia', `con ${tokens.length > 1 ? 'queste rune in mano, in quest’ordine' : 'la runa in mano'}, premendo T; le rune si consumano`]);
        out.push({
          id: one ? `rune:${seq}` : `spell:${seq}`,
          label: sp ? (one ? `${one.name} · ${sp.name}` : sp.name) : `${one?.name ?? seq}`,
          color: runes[tokens[0]].color,
          runes: tokens,
          path: discovered[seq] ? 'modules/magic.spells/manifest.json' : 'modules/magic.runes/manifest.json',
          facts,
        });
      }
      return out;
    }
    if (source === 'luoghi') return this.listPlaces();
    if (source === 'oggetti') {
      for (const d of [...this.content.items.values()].sort((a, b) => a.id.localeCompare(b.id))) {
        const path = `modules/${this.content.itemSource.get(d.id) ?? d.module ?? ''}/manifest.json`;
        out.push({ id: `item:${d.id}`, label: d.name, model: this.forms.resolve(d.model, 'oggetto'), tint: d.color, color: d.color, path: this.files[path] ? path : undefined, facts: [['Oggetto', d.id], ['Categoria', d.category], ['Descrizione', d.description], ...(d.aspetto ? [['Aspetto', d.aspetto] as [string, string]] : []), ['Peso', String(d.weight)]] });
      }
      return out;
    }
    // People and things: the modules of their building that have a look.
    const people = readPeople(this.files).persone;
    for (const path of Object.keys(this.files).sort()) {
      if (!/^modules\/[^/]+\/manifest\.json$/.test(path) || folderOf(path) !== source) continue;
      let man: Manifest;
      try {
        man = JSON.parse(this.files[path]);
      } catch {
        continue;
      }
      if (!man.appearance) continue;
      const facts: Array<[string, string]> = [['Modulo', man.id]];
      if (man.description) facts.push(['Descrizione', man.description]);
      if (man.appearance.aspetto) facts.push(['Aspetto', man.appearance.aspetto]);
      if (man.context) facts.push(['Contesto', man.context]);
      if (man.lore) facts.push(['Storia', man.lore]);
      if (man.persona) facts.push(['Carattere', man.persona]);
      const model = this.formFor(man, man.id).model;
      const who = source === 'persone' ? people.filter((x) => x.tipo === man.id) : [];
      if (who.length) facts.push(['Individui', who.map((x) => `${x.nome} (${x.mestiere})`).join(', ')]);
      out.push({ id: `module:${man.id}`, label: man.name, model, color: man.appearance.color, path, facts });
      // T23: after its type, each individual, with the look it has in the world (its seed) and the module under it.
      for (const p of who)
        out.push({ id: `person:${p.nome}`, label: `${p.nome} · ${p.mestiere}`, model, seed: this.forms.seedFor(model, p.origine ?? p.nome), color: man.appearance.color, path, facts: [...personFacts(p, man.name), ...facts.filter(([w]) => w !== 'Individui').map(([w, t]): [string, string] => [w === 'Aspetto' || w === 'Carattere' ? `${w} del tipo` : w, t])] });
    }
    return out;
  }

  /**
   * The places planned in this universe (T26), the one where the wanderer last stood first, then the others by distance;
   * what is known of each: where, the region, the environment (its module: «Apri il file»), what is inside and outside,
   * the structures, the runes, the file of its plan.
   */
  private listPlaces(): ShowcaseEntry[] {
    const here = this.lastPlace();
    const far = (p: { cx: number; cy: number }) => Math.hypot(p.cx - here.cx, p.cy - here.cy);
    const places = mergePlaces(this.files, [...this.graphPlaces.values()]).sort((a, b) => far(a) - far(b) || a.cx - b.cx || a.cy - b.cy);
    const atlas = readAtlas(this.files);
    const nameOf = (id: string) => this.modules.get(id)?.manifest.name ?? id;
    const list = (xs: string[]) => [...new Set(xs)].join(', ');
    return places.map((p): ShowcaseEntry => {
      const key = this.chunkKey(p.cx, p.cy);
      const plan = this.chunks.get(key)?.plan;
      const region = p.cx === 0 && p.cy === 0 ? undefined : regionAt(atlas, p.cx, p.cy);
      const env = p.ambiente ? this.content.layouts[p.ambiente] : undefined;
      const envModule = p.ambiente ? [...this.modules.values()].find((m) => m.manifest.layouts?.[p.ambiente!]) : undefined;
      const path = envModule ? `modules/${envModule.manifest.id}/manifest.json` : undefined;
      const facts: Array<[string, string]> = [['Dove', `luogo ${p.cx}, ${p.cy}${p.cx === here.cx && p.cy === here.cy ? ' (qui sei stato per ultimo)' : ''}`]];
      if (region) facts.push(['Regione', `${region.nome}: ${region.descrizione}`]);
      if (p.descrizione) facts.push(['Descrizione', p.descrizione]);
      if (p.ambiente) facts.push(['Ambiente', env ? `${env.name} (${p.ambiente}): ${env.description}` : p.ambiente]);
      if (plan) {
        const by = (w: Where) => list(plan.objects.filter((o) => o.where === w).map((o) => nameOf(o.module)));
        if (by('dentro')) facts.push(['Dentro', by('dentro')]);
        if (by('fuori')) facts.push(['Fuori', by('fuori')]);
        if (by('ovunque')) facts.push(['Ovunque', by('ovunque')]);
      } else if (p.cose?.length) facts.push(['Cose', list(p.cose.map(nameOf))]);
      if (p.a_terra?.length) facts.push(['A terra', list(p.a_terra)]);
      if (p.strutture?.length) facts.push(['Strutture', list(p.strutture)]);
      // The runes as they lie there (the starting place has its own), when the place is loaded.
      const runes = plan ? this.miniature(p.cx, p.cy)?.runes : undefined;
      if (runes?.length) facts.push(['Rune', [...new Set(runes.map((r) => r.line))].map((l) => `«${runes.filter((r) => r.line === l).map((r) => r.token).join(' ')}»`).join(' · ')]);
      facts.push(['Piano', `maps/${this.recordKey({ cx: p.cx, cy: p.cy, key } as Chunk).replace(/[:,]/g, '_')}.json`]);
      return { id: `luogo:${p.cx}_${p.cy}`, label: p.nome, place: { cx: p.cx, cy: p.cy }, path, facts };
    });
  }

  /** What a showcase (by building) shows now, with its place in the list; a model of places also its phase (T26). */
  showcaseOf(building: string): { entry: ShowcaseEntry; index: number; count: number; phase?: number } | undefined {
    const source = this.corona.building(building)?.floors[0]?.items.find((i) => i.kind === 'showcase')?.source;
    const all = source ? this.showcaseEntries(source) : [];
    if (!all.length) return undefined;
    const index = (((this.showcaseIndex.get(building) ?? 0) % all.length) + all.length) % all.length;
    return { entry: all[index], index, count: all.length, ...(source === 'luoghi' ? { phase: this.showcasePhase.get(building) ?? PLACE_PHASES.length - 1 } : {}) };
  }

  /** «−» «+» of the model of places (T26): the phase before or after, the same for every place, up to the first or the last. */
  stepPhase(building: string, d: number): void {
    const now = this.showcaseOf(building);
    if (now?.phase === undefined) return this.message('La vetrina è vuota.');
    const phase = Math.max(0, Math.min(PLACE_PHASES.length - 1, now.phase + d));
    this.showcasePhase.set(building, phase);
    const p = PLACE_PHASES[phase];
    this.message(`Fase ${phase + 1} di ${PLACE_PHASES.length}, ${p.name}: ${p.what}`);
    this.bus.emit('studio:showcase', { building, ...now, phase });
  }

  /** «<» «>»: the showcase shows the previous or the next thing. */
  stepShowcase(building: string, d: number): void {
    const n = this.showcaseOf(building)?.count ?? 0;
    if (!n) return this.message('La vetrina è vuota.');
    this.showcaseIndex.set(building, ((((this.showcaseIndex.get(building) ?? 0) + d) % n) + n) % n);
    const now = this.showcaseOf(building)!;
    this.message(`${now.entry.label} (${now.index + 1}/${now.count})`);
    this.bus.emit('studio:showcase', { building, ...now });
  }

  /** The showcase seen up close: a panel with what it shows. */
  openShowcase(building: string): void {
    const now = this.showcaseOf(building);
    if (!now) return this.message('La vetrina è vuota.');
    this.bus.emit('ui:showcase', { building, name: this.corona.building(building)?.name ?? building, ...now });
  }

  /** The latest changes to the files of a building (for its notice board). */
  boardOf(buildingId: string): Array<{ path: string; author: string; message: string; time: number }> {
    const b = this.corona.building(buildingId);
    const paths = new Set(b?.floors.flatMap((f) => f.items.map((i) => i.path).filter(Boolean)) as string[]);
    return [...this.recentChanges().entries()].filter(([p]) => paths.has(p)).map(([path, c]) => ({ path, ...c })).sort((x, y) => y.time - x.time);
  }

  /**
   * "Riscolpiscilo": the wish goes into how the thing looks (its `aspetto`, committed); the Sculptor
   * writes a new program for it from there.
   */
  requestResculpt(target: string, why = ''): boolean {
    const [kind, id] = [target.slice(0, target.indexOf(':')), target.slice(target.indexOf(':') + 1)];
    let path: string | undefined;
    let man: any;
    const load = (p: string | undefined) => {
      if (!p) return false;
      try {
        man = JSON.parse(this.repo.working[p]);
        path = p;
        return true;
      } catch {
        return false;
      }
    };
    // The wish is added to how it looks ({ aspetto } of a module's appearance or of an item), and the thing
    // gets a model of its own if it showed a generic one.
    const own = (o: { aspetto?: string; model?: string }, name: string, fallback: string) => {
      if (why) o.aspetto = `${o.aspetto ?? name}; ${why}`;
      const current = o.model && this.forms.info(o.model) ? o.model : undefined;
      if (!current || this.sculpting.isGeneric(current)) o.model = ownModelId(fallback);
      return { id: o.model!, previous: current };
    };
    let req: { id: string; previous?: string; nome: string; aspetto: string; classe: string } | undefined;
    if (kind === 'module' && load(this.modules.get(id)?.manifestPath)) {
      if (!man.appearance) return false;
      const r = own(man.appearance, man.name, man.id);
      req = { ...r, nome: man.name, aspetto: man.appearance.aspetto ?? man.description ?? man.name, classe: man.appearance.classe ?? this.forms.classOf(this.forms.resolve(r.previous ?? r.id, undefined)).id };
    } else if (kind === 'item' && load(this.modules.get(this.content.itemSource.get(id) ?? '')?.manifestPath)) {
      const it = (man.items ?? []).find((x: ItemDef) => x.id === id);
      const o = it ?? man.appearance;
      if (!o) return false;
      const r = own(o, it?.name ?? man.name, id);
      req = { ...r, nome: it?.name ?? man.name, aspetto: o.aspetto ?? it?.description ?? man.name, classe: 'oggetto' };
    } else return false;
    this.repo.write(path!, JSON.stringify(man, null, 2) + '\n');
    this.applyFiles({ ...this.repo.working });
    this.repo.commit(`scultore: da riscolpire ${target}`, 'agent');
    this.council.say('artista', 'propone', `da riscolpire: ${target}${why ? ` (${why})` : ''}`, 'scultore', 'model.resculpt');
    const previous = req.previous ? this.repo.working[`models/${req.previous}.xml`] : undefined;
    void this.sculpting.make({ id: req.id, nome: req.nome, aspetto: req.aspetto, classe: req.classe, ...(previous ? { previous } : {}), ...(why ? { desiderio: why } : {}) });
    return true;
  }

  /** The Sculptor's models per class (universe.json → ai.scultori over the defaults). */
  sculptors(): SculptorModels {
    return { ...DEFAULT_SCULPTORS, ...(this.config.ai.scultori ?? {}) };
  }

  /** A program enters the library (or replaces one): validated, written with its index entry, committed. */
  addModel(id: string, xml: string, info: ModelInfo, message: string): boolean {
    const path = `models/${id}.xml`;
    const errors = this.validator.validateFile(path, xml);
    if (errors.length) {
      this.council.say('kernel', 'scarta', errors.join('; '), 'scultore', 'model.sculpt');
      return false;
    }
    let index: Record<string, ModelInfo> = {};
    try {
      index = JSON.parse(this.repo.working[MODELS_INDEX] ?? '{}');
    } catch {
      index = {};
    }
    index[id] = info;
    this.repo.write(path, xml);
    this.repo.write(MODELS_INDEX, JSON.stringify(index, null, 1) + '\n');
    this.applyFiles({ ...this.repo.working });
    const c = this.repo.commit(message, 'agent');
    this.council.say('kernel', 'approva', `modello «${info.nome ?? id}» (${id}) → validato, commit ${c.id}`, undefined, 'model.sculpt');
    this.bus.emit('model:added', { id });
    return true;
  }

  /** Which file a piece of the Council's work is about (the avatars walk there). */
  pathForFeed(e: FeedEntry): string | undefined {
    for (const id of this.modules.keys()) if (e.text.includes(id)) return this.modules.get(id)!.manifestPath;
    const t = e.task ?? '';
    if (t.startsWith('chunk.')) return 'modules/world.layouts/manifest.json';
    if (t.startsWith('genesis.')) return t === 'genesis.terrain' || t === 'genesis.physics' ? 'modules/world.terrain/manifest.json' : 'world/bible.json';
    if (t.startsWith('content.')) return 'modules/items.base/manifest.json';
    if (t === 'action.judge') return 'modules/core.effects/logic.lua';
    if (t === 'spell.name') return this.files['modules/magic.spells/manifest.json'] ? 'modules/magic.spells/manifest.json' : 'modules/magic.runes/manifest.json';
    if (t.startsWith('model.')) return 'world/style.md';
    return e.from === 'kernel' ? undefined : `prompts/agents/${e.from}.md`;
  }

  /** The player talks to an agent of the Council, in the corona. It may accept to make something. */
  async talkToAgent(agent: AgentId, text: string): Promise<{ say: string; forged?: string }> {
    const history = this.agentTalks.get(agent) ?? [];
    this.agentTalks.set(agent, history);
    if (agent === 'referente') return this.askReferente(text, history);
    let r;
    try {
      r = await agentReply(this.council, agent, history, text);
    } catch (e) {
      return { say: `(${AGENTS[agent].name} non risponde: ${(e as Error).message})` };
    }
    history.push({ who: 'giocatore', text }, { who: 'npc', text: r.say });
    this.archive.go(agent, undefined, r.say);
    if (!r.forge) return { say: r.say };
    if (agent === 'cartografo') {
      const env = await this.createEnvironment(r.forge);
      return { say: r.say, forged: env.summary };
    }
    const f = await this.forgeModule(r.forge, 'agente', undefined, true);
    return { say: r.say, forged: f.summary };
  }

  /**
   * The Referente takes the transcended wanderer's request to the right team: the Forge, the
   * Cartographer, the Artist, the rules, the Narrator's packs. The Council says yes to almost anything.
   */
  private async askReferente(text: string, history: Turn[]): Promise<{ say: string; forged?: string }> {
    let r;
    try {
      r = await referenteReply(this.council, history, text);
    } catch (e) {
      return { say: `(il Referente non risponde: ${(e as Error).message})` };
    }
    history.push({ who: 'giocatore', text }, { who: 'npc', text: r.say });
    this.archive.go('referente', undefined, r.say);
    if (r.refusal) return { say: r.say, forged: `Il Concilio rifiuta: ${r.refusal}` };
    const req = r.request ?? text;
    this.council.say('referente', 'info', `il viandante chiede: «${text}» → ${r.task}`, r.task === 'ambiente' ? 'cartografo' : r.task === 'riscolpisci' ? 'artista' : r.task === 'regola' ? 'arbitro' : r.task === 'nessuno' ? undefined : 'narratore', 'referente.coordinate');
    switch (r.task) {
      case 'oggetto':
        return { say: r.say, forged: (await this.forgeModule(req, 'agente', 'strumento', true)).summary };
      case 'cosa':
        return { say: r.say, forged: (await this.forgeModule(req, 'agente', 'oggetto', true)).summary };
      case 'personaggio':
        return { say: r.say, forged: (await this.forgeModule(req, 'agente', 'npc', true)).summary };
      case 'ambiente':
        return { say: r.say, forged: (await this.createEnvironment(req)).summary };
      case 'oggetti':
        return { say: r.say, forged: (await this.growContent(`richiesta del viandante: ${req}`, 12, true)) ? 'Il Narratore ha scritto un pacchetto di oggetti nuovi.' : 'Il pacchetto non è venuto.' };
      case 'meccanica':
        return { say: r.say, forged: (await this.forgeMechanic(req)).summary };
      case 'regola': {
        this.recordRule({ chiave: `regola|${normName(req).slice(0, 60)}`, testo: req, possibile: true, racconto: 'stabilito dal viandante trasceso, accolto dal Concilio', effetti: ['regola'] }, true, { task: 'referente.coordinate', autore: this.wanderer().id });
        return { say: r.say, forged: `Nuova regola del mondo: ${req}` };
      }
      case 'riscolpisci': {
        const target = this.findExhibit(r.target ?? req);
        if (!target) return { say: r.say, forged: `Lo Scultore non trova «${r.target ?? req}».` };
        return { say: r.say, forged: this.requestResculpt(target.target, req) ? `Lo Scultore riscolpirà «${target.label}».` : 'Lo Scultore non può riscolpirlo.' };
      }
    }
    return { say: r.say };
  }

  /** Something with a model, by name (a module, an item, a terrain). */
  findExhibit(name: string): Exhibit | undefined {
    const n = normName(name);
    const all = [...this.exhibits(this.files), ...this.terrainExhibits()];
    return all.find((e) => normName(e.label) === n) ?? all.find((e) => n.includes(normName(e.label).split(' ')[0]) && normName(e.label).length >= 3) ?? all.find((e) => normName(e.label).includes(n));
  }

  /** The game of this universe (universe.json → partita), chosen at the Genesis. */
  partita(): Partita {
    return this.config.partita;
  }

  /** A game of many (ADR-0050): the carpet, the rollback and the Council are the master's. */
  manyPlayers(): boolean {
    return this.partita()?.modalita === 'multigiocatore';
  }

  /** Whether a wanderer (the one acting, by default) is the master (T37): alone, always. */
  isMaster(id: string | undefined = this.wanderer().id): boolean {
    return !this.manyPlayers() || (!!id && id === (this.partita().master ?? SOLO));
  }

  /**
   * The game is chosen before the Genesis and never changes after (ADR-0053): the first universe.json
   * fixes it, a later one that says otherwise is written back; only `runGenesis` chooses a new one.
   */
  private keepGame(config: UniverseConfig, files: FileMap): void {
    if (!this.game) {
      this.game = config.partita;
      return;
    }
    if (JSON.stringify(config.partita) === JSON.stringify(this.game)) return;
    config.partita = this.game;
    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(files['universe.json'] ?? '{}');
    } catch {
      return;
    }
    if (this.repo.working['universe.json'] !== undefined) this.repo.write('universe.json', JSON.stringify({ ...raw, partita: this.game }, null, 2) + '\n');
    this.council?.say('kernel', 'scarta', "la partita (morte, modalità, PvP, «Altro…» tra giocatori) si sceglie solo alla Genesi: universe.json la tiene com'era");
  }

  /** Chooses the game of a universe that was never generated (the Genesis screen); after, it is fixed. */
  private chooseGame(choice: Partial<Partita>): void {
    const game = repairPartita({ ...this.partita(), ...choice });
    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(this.repo.working['universe.json'] ?? '{}');
    } catch {
      raw = {};
    }
    this.game = game;
    this.repo.write('universe.json', JSON.stringify({ ...raw, partita: game }, null, 2) + '\n');
  }

  /**
   * Death: of thirst, of hunger, of wounds. The session ends; the wanderer may continue in the same
   * universe or start again from the seed. What continuing costs is the punishment chosen at the Genesis,
   * which the Narrator turns into what is lost and where one wakes up (asked now, applied on continue).
   * Who reached the corona cannot die any more.
   */
  die(cause: string): void {
    if (this.dead || this.exitedOnce) return;
    this.dead = true;
    this.log('kernel', `il viandante è morto (${cause})`);
    this.council.say('narratore', 'info', `il viandante è morto di ${cause}`, undefined, 'player.death');
    this.deathVerdict = this.judgeDeath(cause);
    this.bus.emit('ui:death', { cause, punizione: deathLevel(this.partita()) });
  }

  /** What is carried, by item (the top level: what death can take). */
  private carriedCounts(): Array<{ name: string; count: number }> {
    const by = new Map<string, number>();
    for (const s of this.inventory().slots) if (s) by.set(s.item, (by.get(s.item) ?? 0) + s.count);
    return [...by].map(([id, count]) => ({ name: this.itemInfo(id).name, count }));
  }

  private async judgeDeath(cause: string): Promise<DeathVerdict> {
    const level = this.partita().morte;
    const carried = this.carriedCounts();
    const d = deathLevel(this.partita());
    try {
      return await judgeDeath(this.council, { cause, level, punishment: `${d.nome} (${level} su 4): ${d.testo}`, carried, states: Object.keys(this.states()), place: this.placeHere()?.name ?? '' });
    } catch (e) {
      this.council.say('kernel', 'errore', `il Narratore tace sulla morte (${(e as Error).message}): vale la punizione alla lettera`, 'narratore', 'player.death');
      return fallbackDeath(level, carried);
    }
  }

  /**
   * A new life in the same universe: fresh needs, then what the punishment takes (everything, or the
   * effects the Narrator chose), at the square or where the wanderer fell; the world remembers.
   */
  async continueAfterDeath(): Promise<void> {
    const v = (await this.deathVerdict) ?? fallbackDeath(this.partita().morte, this.carriedCounts());
    this.deathVerdict = undefined;
    const playerMod = [...this.modules.values()].find((m) => m.manifest.kind === 'player');
    const defaults: Record<string, any> = clone(playerMod?.manifest.components ?? FALLBACK_PLAYER);
    Object.assign(this.needs() ?? {}, { ...FALLBACK_PLAYER.needs, ...(defaults.needs ?? {}), morto: false });
    if (v.loseAll) {
      this.ecs.set(this.playerId, 'inventory', newInventory());
      this.ecs.set(this.playerId, 'stati', {});
      Object.assign(this.hand(), { tokens: [], sel: 0 });
      for (const it of playerMod?.manifest.inventory ?? []) if (this.content.get(it)) this.give(it, 1);
    }
    if (v.restart === 'piazza') {
      Object.assign(this.playerPos(), { x: 0, y: 0 });
      const c = this.carpet();
      if (c) Object.assign(c, { ox: 0, oy: 0 });
    }
    const ectx = { palette: this.palette, item: (n: string) => this.content.byName(n)?.id ?? (this.content.get(n) ? n : undefined), module: () => undefined, loot: new Set<string>() };
    const effects = v.loseAll ? [] : validateEffects(v.effects, ectx).effects;
    const said = effects.flatMap((e) => (e.tipo === 'messaggio' ? [e.testo] : []));
    const out = this.applyEffects(effects.filter((e) => e.tipo !== 'messaggio'));
    // Death takes, it never heals; but nobody wakes up dying.
    const n = this.needs();
    if (n && !(n.health > 10)) n.health = 10;
    this.dead = false;
    this.council.say('narratore', 'approva', `il viandante torna alla vita: ${v.story}${effects.length ? ` [${effects.map((e) => e.tipo).join(', ')}]` : ''}${v.loseAll ? ' (perde tutto)' : ''}`, undefined, 'player.death');
    this.rememberDeath();
    this.saveState();
    this.message([v.story || 'Riapri gli occhi. È un nuovo giorno, e una nuova vita.', ...said, ...out].join(' '), 'good');
  }

  private rememberDeath(): void {
    this.recordRule({ chiave: `morte|${this.worldStamp()}`, testo: 'un viandante è morto', possibile: true, racconto: 'la gente ne parla ancora, in piazza' }, false);
  }

  // --- Interfaces of modules (ADR-0028) -------------------------------------------------------

  /** Panels modules bring into the game (drawn by the kernel as tabs of the inventory). */
  uiPanels(): Array<{ module: string; panel: UiPanel }> {
    return [...this.modules.values()].filter((m) => m.manifest.ui?.elementi?.length).map((m) => ({ module: m.manifest.id, panel: m.manifest.ui! }));
  }

  /** What sits in the slots of every panel: player component `slots` (kernel-owned). */
  slots(): Record<string, Record<string, { item: string; count: number } | null>> {
    let s = this.ecs.get(this.playerId, 'slots');
    if (!s) s = this.ecs.set(this.playerId, 'slots', {});
    return s;
  }

  /** Whether an item fits a slot: by its place (slot), category or tags. */
  fits(item: string, accetta: string[] | undefined): boolean {
    const d = this.content.get(item);
    if (!d) return false;
    if (!accetta?.length) return true;
    return accetta.some((a) => a === d.slot || a === d.category || d.tags.includes(a));
  }

  /** Puts something from the inventory into a slot of a panel; the module reacts (on_slot). */
  equip(panelId: string, slotId: string, invSlot: number): boolean {
    const p = this.uiPanels().find((x) => x.panel.id === panelId);
    const el = p?.panel.elementi.find((e) => e.tipo === 'slot' && e.id === slotId);
    const s = this.inventory().slots[invSlot];
    if (!p || !el || !s) return false;
    if (!this.fits(s.item, el.accetta)) {
      this.message(`${this.itemInfo(s.item).name} non va lì (${el.etichetta}).`, 'warn');
      return false;
    }
    const slots = this.slots();
    slots[panelId] ??= {};
    const old = slots[panelId][slotId];
    takeFromSlot(this.inventory(), invSlot, 1);
    slots[panelId][slotId] = { item: s.item, count: 1 };
    if (old) this.give(old.item, old.count);
    this.slotChanged(p.module, panelId, slotId, s.item);
    return true;
  }

  unequip(panelId: string, slotId: string): boolean {
    const p = this.uiPanels().find((x) => x.panel.id === panelId);
    const cur = this.slots()[panelId]?.[slotId];
    if (!p || !cur) return false;
    if (!this.give(cur.item, cur.count)) {
      this.message("L'inventario è pieno.", 'warn');
      return false;
    }
    this.slots()[panelId][slotId] = null;
    this.slotChanged(p.module, panelId, slotId, undefined);
    return true;
  }

  private slotChanged(module: string, panel: string, slot: string, item: string | undefined): void {
    if (!this.sandbox.has(module, 'on_slot')) return;
    const { value, failed } = this.runModule(module, 'on_slot', this.playerId, slot, item, panel);
    if (!failed && typeof value === 'string' && value) this.message(value);
  }

  /** A button of a panel: the module's on_ui(user, action). */
  uiAction(panelId: string, action: string): void {
    const p = this.uiPanels().find((x) => x.panel.id === panelId);
    if (!p || !this.sandbox.has(p.module, 'on_ui')) return;
    const { value, failed } = this.runModule(p.module, 'on_ui', this.playerId, action);
    if (!failed && typeof value === 'string' && value) this.message(value);
  }

  /** A field of a player component for bars and texts ("needs.health"). */
  uiValue(campo: string | undefined): unknown {
    if (!campo) return undefined;
    const [c, f] = campo.split('.');
    return this.ecs.get(this.playerId, c)?.[f];
  }

  /**
   * The Forge of mechanics: the Council adds a mechanic (equipment, a quiver, a reputation…) as a
   * system module with a panel and Lua logic; validated (panel cleaned, code compiled, dry-loaded).
   */
  async forgeMechanic(request: string, chi?: string): Promise<{ ok: boolean; id?: string; summary: string }> {
    const items = [...this.content.items.values()].filter((d) => d.equippable || d.slot || ['arma', 'vestiario'].includes(d.category)).map((d) => `${d.name}${d.slot ? ` [${d.slot}]` : ` (${d.category})`}${d.bonus ? ` ${JSON.stringify(d.bonus)}` : ''}`);
    const mechanics = this.uiPanels().map((p) => p.panel.titolo);
    let feedback = '';
    for (let attempt = 0; attempt < 2; attempt++) {
      let d;
      try {
        d = await designMechanic(this.council, request, { items, mechanics, feedback, chi });
      } catch (e) {
        return { ok: false, summary: `L'Ingegnere non riesce: ${(e as Error).message}` };
      }
      let id = `mech.${slug(d.name)}`;
      while (this.modules.has(id)) id += '-2';
      const { panel, errors } = cleanPanel(d.panel, slug(d.name));
      const logic = d.logic.endsWith('\n') ? d.logic : `${d.logic}\n`;
      const manifest: Manifest = { id, name: d.name, kind: 'system', version: '0.1.0', origin: 'agente', description: d.description, logic: 'logic.lua', order: 60, ...(panel ? { ui: panel } : {}) };
      const errs = [...errors, ...(panel ? [] : ['nessun pannello']), ...this.validator.validateForged(manifest, logic, new Set(this.modules.keys()), { system: true })];
      if (errs.length) {
        feedback = errs.join('; ');
        this.council.say('kernel', 'scarta', `meccanica «${d.name}»: ${feedback}`, 'ingegnere', 'mechanic.design');
        continue;
      }
      // Its cases run with the real code in a kernel in miniature (T27): only those that show it working stay.
      const { cases, errors: caseErrors } = cleanCases(d.cases, panel, logic.split('\n').length);
      const failed = [...caseErrors];
      const kept: BenchCase[] = [];
      for (const c of cases) {
        const run = await this.runBenchCase(manifest, logic, c);
        if (run.errori.length) failed.push(`«${c.titolo}»: ${run.errori.join('; ')}`);
        else kept.push(c);
      }
      if (!cases.length) failed.push('nessun caso d’uso da mettere in scena');
      if (failed.length) this.council.say('kernel', 'scarta', `casi di «${d.name}»: ${failed.join('; ')}`, 'ingegnere', 'mechanic.design');
      if (!kept.length && attempt === 0) {
        feedback = `i casi d'uso non mostrano la meccanica: ${failed.join('; ')}`;
        continue;
      }
      if (kept.length) manifest.casi = kept;
      const dir = `modules/${id}/`;
      this.repo.write(`${dir}manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
      this.repo.write(`${dir}logic.lua`, logic);
      // Starting components for the wanderer (e.g. a reputation at 0).
      for (const [name, data] of Object.entries(d.components ?? {})) if (data && typeof data === 'object' && !this.ecs.has(this.playerId, name) && !['player', 'hand', 'inventory', 'needs', 'pos', 'slots'].includes(name)) this.ecs.set(this.playerId, name, clone(data));
      this.applyFiles({ ...this.repo.working });
      const c = this.commitContent(`meccanica: ${d.name}`, 'mechanic.design', 'ingegnere', chi);
      this.council.say('ingegnere', 'approva', `nuova meccanica «${d.name}»: ${d.description} (pannello «${panel!.titolo}», commit ${c.id})`, undefined, 'mechanic.design');
      return { ok: true, id, summary: `Nuova meccanica: ${d.name} — ${d.description} (la trovi nell'inventario, scheda «${panel!.titolo}»).` };
    }
    return { ok: false, summary: `L'Ingegnere non è riuscito a scrivere una meccanica valida: ${feedback}` };
  }

  /**
   * Runs a case of a system in a kernel in miniature (T27): only `core.*`, the content and that system, on the
   * case's scene; objects the universe lacks become trial objects. Nothing of this universe changes.
   */
  runBenchCase(manifest: Manifest, logic: string, c: BenchCase): Promise<BenchRun> {
    const known = (name: string) => this.content.byName(name)?.id ?? (this.content.get(name) ? name : undefined);
    return runCase(this.files, manifest, logic, c, { wasmUri: this.wasmUri, boot: (o) => Kernel.boot(o), known });
  }

  /** The cases of the bench (T27b): those of every system, in the order of the tick. */
  benchCases(): BenchEntry[] {
    return this.systems.flatMap((m) =>
      (m.manifest.casi ?? []).map((c, i, all) => ({
        id: `${m.manifest.id}#${i}`,
        system: m.manifest.id,
        name: m.manifest.name || m.manifest.id,
        ...(m.manifest.description ? { description: m.manifest.description } : {}),
        path: m.logicPath ?? `${m.dir}/logic.lua`,
        of: i,
        cases: all.length,
        case: c,
      })),
    );
  }

  /** What the case sets out: its 5 × 5 tiles in the colours of the palette, its things with their colour and size. */
  benchScene(c: BenchCase): BenchScene {
    const base = this.benchBase();
    const tiles = Array.from({ length: BENCH * BENCH }, (_, i) => {
      const code = [...(c.terreno?.[Math.floor(i / BENCH)] ?? '')][i % BENCH];
      const t = this.palette[code && this.palette[code] ? code : base];
      return { color: t?.color ?? '#555555', ...(t?.layer ? { layer: t.layer } : {}), solid: !!t?.solid };
    });
    const things = (c.cose ?? []).map((t) => {
      const m = this.modules.get(t.modulo)?.manifest;
      const fire = !!t.componenti?.fuoco;
      return { name: fire ? 'Fiamma' : (m?.name ?? t.modulo), color: fire ? '#ff8a2a' : (m?.appearance?.color ?? '#cccccc'), radius: m?.physics?.radius ?? 0.4, person: !!(m?.components?.wander || m?.persona || m?.interaction?.type === 'talk'), fire };
    });
    return { tiles, things };
  }

  /**
   * The bench now (T27b): the case chosen and, once the kernel in miniature has run it with the code the system has now,
   * its run (kept by case and code: rewriting the system runs it again). Asking starts the run; `studio:bench` says when it is done.
   */
  benchOf(): BenchShown | undefined {
    const all = this.benchCases();
    if (!all.length) return undefined;
    const index = ((this.benchIndex % all.length) + all.length) % all.length;
    const entry = all[index];
    const m = this.modules.get(entry.system)!;
    const logic = this.files[entry.path] ?? '';
    const key = `${entry.id}|${textKey(JSON.stringify(m.manifest) + logic)}`;
    const run = this.benchRuns.get(key);
    if (!run && !this.benchRunning.has(key)) {
      this.benchRunning.add(key);
      void this.runBenchCase(m.manifest, logic, entry.case)
        .catch((e): BenchRun => ({ prima: {}, dopo: {}, cambiati: [], frames: [], messaggi: [], errori: [`il banco non parte: ${e instanceof Error ? e.message : String(e)}`] }))
        .then((r) => {
          this.benchRunning.delete(key);
          if (this.benchRuns.size >= 40) this.benchRuns.clear();
          this.benchRuns.set(key, r);
          this.bus.emit('studio:bench', this.benchOf());
        });
    }
    return { entry, index, count: all.length, key, scene: this.benchScene(entry.case), code: logic.split('\n'), ...(run ? { run } : {}) };
  }

  /** «<» «>» of the bench: the case before or after, across the systems. */
  stepBench(d: number): void {
    const n = this.benchCases().length;
    if (!n) return this.message('Il banco è vuoto: nessun sistema ha casi.');
    this.benchIndex = (((this.benchIndex + d) % n) + n) % n;
    const now = this.benchOf()!;
    this.message(`${now.entry.name}: «${now.entry.case.titolo}» (${now.index + 1}/${now.count})`);
    this.bus.emit('studio:bench', now);
  }

  /** The bench seen up close: the system, the case in words, before and after, the code with its lines, the station. */
  openBench(): void {
    const now = this.benchOf();
    if (!now) return this.message('Il banco è vuoto: nessun sistema ha casi.');
    this.bus.emit('ui:bench', { bench: now, station: this.chain().stations.find((s) => s.id === now.entry.system) });
  }

  /** States of the wanderer (on horseback, with a backpack…): what they change, until when. */
  states(): Record<string, { velocita: number; peso: number; luce: number; fino: number }> {
    // Lua removes a state by setting it to nil (null on the JS side): those are gone.
    const st = this.ecs.get(this.playerId, 'stati') ?? {};
    for (const k of Object.keys(st)) if (!st[k]) delete st[k];
    return st;
  }

  /** How much the wanderer carries without slowing down (a backpack, a horse carry more). */
  carryCapacity(): number {
    return CARRY_CAPACITY + Object.values(this.states()).reduce((n, s) => n + (Number(s.peso) || 0), 0);
  }

  /** States run out; a state with light lights the wanderer's way. */
  private statesTick(): void {
    const st = this.states();
    let light = 0;
    for (const [k, s] of Object.entries(st)) {
      if (s.fino && s.fino < this.time) delete st[k];
      else light = Math.max(light, Number(s.luce) || 0);
    }
    const l = this.ecs.get(this.playerId, 'luce');
    if (light > 0) this.ecs.set(this.playerId, 'luce', { ...(l ?? {}), accesa: true, raggio: light, daStato: true });
    else if (l?.daStato) this.ecs.set(this.playerId, 'luce', { accesa: false });
  }

  /** Magic runes in the phrase, in their order: the incantation T would cast. */
  incantation(): string[] {
    return this.hand().tokens.filter((t) => this.content.runes[t]);
  }

  /** Incantations of this many runes or more also burn a magic crystal. */
  static CRYSTAL_RUNES = 3;

  private crystalId(): string | undefined {
    return [...this.content.items.values()].find((d) => d.tags.includes('cristallo') && d.category === 'magia')?.id;
  }

  private castingNow = false;

  /**
   * T: the magic runes in hand, in order, are an incantation. Known ones are cast at once; a sequence
   * never spoken before is named once by the Narrator (and kept, committed, in magic.spells). Costs energy.
   */
  async castSpell(): Promise<boolean> {
    if (this.castingNow) return false;
    if (this.manyPlayers() && this.hand().tokens.includes(COUNCIL_RUNE)) return this.councilRune();
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
      if (n && (n.mana ?? 0) < spell.cost) {
        this.message(`«${spell.name}» chiede più mana di quanto te ne resti (${spell.cost}). Un cristallo magico aiuterebbe.`, 'warn');
        return false;
      }
      const crystal = seq.length >= Kernel.CRYSTAL_RUNES ? this.crystalId() : undefined;
      if (seq.length >= Kernel.CRYSTAL_RUNES && (!crystal || countItem(this.inventory(), crystal) < 1)) {
        this.message(`Un incantesimo di ${seq.length} rune ha bisogno di un cristallo magico da consumare.`, 'warn');
        return false;
      }
      const missing = this.missingRunes(seq);
      if (missing) {
        this.message(`Non hai la runa «${missing}».`, 'warn');
        return false;
      }
      const ctx = {
        palette: this.palette,
        item: (x: string) => this.content.byName(x)?.id ?? (this.content.get(x) ? x : undefined),
        module: (x: string) => (this.modules.get(x)?.manifest.kind === 'entity' ? x : undefined),
        loot: new Set(Object.keys(this.content.loot)),
      };
      const effects = validateEffects(spell.effects, ctx).effects;
      if (n) n.mana = Math.max(0, (n.mana ?? 0) - spell.cost);
      // Spoken runes are spent: worth collecting and keeping.
      for (const t of seq) removeItem(this.inventory(), `rune:${t}`, 1);
      if (crystal) removeItem(this.inventory(), crystal, 1);
      const hand = this.hand();
      hand.tokens = hand.tokens.filter((t) => !this.content.runes[t]);
      hand.sel = Math.max(0, Math.min(hand.sel, hand.tokens.length - 1));
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
      draft = await nameSpell(this.council, runes, known, Object.entries(this.palette).filter(([c]) => c !== '?').map(([, t]) => t.name), this.focusOn(seq.map((t) => `runa:${nodeSlug(t)}`)));
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
    const c = this.commitContent(`incantesimo: ${seq.join(' ')} → ${spell.name}`, 'spell.name', 'narratore');
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

  /**
   * A thing learns an action: it enters the menu of every copy of it — the module's actions for things
   * in the world, the item definition's for things you carry or find on the ground.
   */
  private learnAction(sub: { learnModule?: ModuleEntry; learnItem?: string; learnTile?: string }, def: ActionDef): void {
    let path: string | undefined;
    let man: Manifest;
    let actions: ActionDef[];
    let owner: string;
    try {
      if (sub.learnTile && this.terrain) {
        // A terrain learns: every tile of this kind offers the action from now on.
        path = this.terrain.manifestPath;
        man = JSON.parse(this.repo.working[path] ?? '');
        const tile = man.tiles?.[sub.learnTile];
        if (!tile) return;
        actions = tile.actions ??= [];
        owner = tile.name;
      } else if (sub.learnModule) {
        path = sub.learnModule.manifestPath;
        man = JSON.parse(this.repo.working[path] ?? '');
        actions = man.actions ??= [];
        owner = man.name;
      } else if (sub.learnItem && !sub.learnItem.startsWith('rune:')) {
        const src = this.content.itemSource.get(sub.learnItem);
        path = src ? this.modules.get(src)?.manifestPath : undefined;
        if (!path) return;
        man = JSON.parse(this.repo.working[path] ?? '');
        if (man.kind === 'item') {
          actions = man.actions ??= [];
        } else {
          const it = man.items?.find((x) => x.id === sub.learnItem);
          if (!it) return;
          actions = it.actions ??= [];
        }
        owner = this.itemInfo(sub.learnItem).name;
      } else return;
    } catch {
      return;
    }
    if (actions.length >= 8 || actions.some((a) => normName(a.label) === normName(def.label))) return;
    let id = normName(def.label).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 24) || 'azione';
    while (actions.some((a) => a.id === id)) id += '_';
    const learned: ActionDef = { id, label: def.label, effects: def.effects };
    if (def.requires) learned.requires = def.requires;
    actions.push(learned);
    this.repo.write(path, JSON.stringify(man, null, 2) + '\n');
    this.applyFiles({ ...this.repo.working });
    const c = this.repo.commit(`azione imparata: ${owner} → ${def.label}`, 'agent');
    this.council.say('kernel', 'approva', `${owner} impara «${def.label}» (commit ${c.id})`);
  }

  private worldFacts(): Record<string, unknown> {
    const held = equippedItem(this.inventory());
    const n = this.needs();
    return {
      luogo: this.placeHere()?.name,
      ora: Math.floor(this.time),
      momento: this.daylight() > 0.6 ? 'giorno' : this.daylight() > 0.15 ? 'crepuscolo' : 'notte',
      // Locals know their surroundings: which places and regions are where.
      dintorni: this.directionsAt(this.playerCarpet().x, this.playerCarpet().y),
      viandanteImpugna: held ? this.itemInfo(held).name : 'niente',
      viandante: n ? { fame: Math.round(100 - n.hunger), sete: Math.round(100 - n.thirst), stanchezza: Math.round(100 - n.energy) } : undefined,
    };
  }

  /**
   * Behind every character there is an individual: name, story, own pockets, a job, a family among the
   * people already known, a daily routine (written once, cheap text, kept in world/people.json: met
   * again, they are the same person).
   */
  async ensureIdentity(id: Id): Promise<Identity | undefined> {
    const existing: Identity | undefined = this.ecs.get(id, 'identity');
    if (existing) return existing;
    const pending = this.individuating.get(id);
    if (pending) return pending;
    const job = this.individuate(id);
    this.individuating.set(id, job);
    try {
      return await job;
    } finally {
      this.individuating.delete(id);
    }
  }

  private individuating = new Map<Id, Promise<Identity | undefined>>();

  private async individuate(id: Id): Promise<Identity | undefined> {
    const modId: string | undefined = this.ecs.get(id, 'module')?.id;
    const m = (modId ? this.modules.get(modId)?.manifest : undefined);
    if (!m?.persona) return undefined;
    const origin: string | undefined = this.ecs.get(id, 'origin')?.key;
    const people = readPeople(this.files);
    const known = origin ? people.persone.find((p) => p.origine === origin && p.tipo === modId) : undefined;
    let identity: Identity;
    if (known) {
      identity = { name: known.nome, persona: known.persona ?? m.persona, look: known.aspetto ?? '', carrying: known.porta ?? [], job: known.mestiere, gender: known.genere, age: known.eta, family: known.famiglia, routine: known.routine, story: known.storia };
    } else {
      const specie = this.speciesOf(modId!) ?? 'persona';
      // Names already taken (people met, people around): a newcomer's name is unlike all of them,
      // unless they are someone named and awaited.
      const taken = () => [...readPeople(this.files).persone.map((p) => p.nome), ...this.ecs.query('identity').map((e) => this.ecs.get(e, 'identity').name as string)];
      const awaited = (n: string) => readPeople(this.files).attesi.some((a) => a.nome.toLowerCase() === n.toLowerCase());
      const alike = (n: string) => (awaited(n) && !taken().includes(n) ? [] : taken().filter((t) => similarNames(t, n)));
      try {
        const ask = (avoid?: string[]) => individuate(this.council, { name: m.name, description: m.description ?? '', persona: m.persona!, specie }, { place: this.placeHere()?.name ?? '', common: [...this.content.items.values()].map((d) => d.name), society: societySummary(readPeople(this.files)), avoid, focus: this.focusOn([`tipo:${nodeSlug(modId!)}`], this.ecs.get(id, 'pos')) });
        identity = await ask();
        // A person of the world, not of the Council's table: once more if the fourth wall breaks,
        // or if the name is like someone else's.
        if (metaBreak(`${identity.persona} ${identity.story ?? ''} ${identity.job ?? ''}`)) identity = await ask();
        else if (alike(identity.name).length) {
          this.council.say('kernel', 'scarta', `il nome «${identity.name}» è troppo simile a ${alike(identity.name).join(', ')}`, 'narratore', 'npc.individuate');
          identity = await ask([...alike(identity.name), identity.name]);
        }
      } catch {
        identity = { name: m.name, persona: m.persona, look: '', carrying: [], routine: defaultRoutine('') };
      }
      identity.gender ??= guessGender({ nome: identity.name, mestiere: identity.job ?? '', famiglia: identity.family ?? [] });
      // Still alike: a name the kernel picks (and the persona says it).
      if (identity.name !== m.name && alike(identity.name).length) {
        const old = identity.name;
        identity.name = freshName(specie, identity.gender, taken(), origin ?? old);
        identity.persona = applyRenames(identity.persona, [[old, identity.name]]);
      }
    }
    if (!this.ecs.alive.has(id)) return identity;
    this.ecs.set(id, 'identity', identity);
    const resolved = identity.carrying.map((n) => this.content.byName(n));
    const unknown = identity.carrying.filter((_, i) => !resolved[i]);
    const defs = [...resolved.filter((d): d is ItemDef => !!d), ...(unknown.length ? await this.introduceItems(unknown, `portati da ${identity.name}`) : [])];
    let inv: Inventory | undefined = this.ecs.get(id, 'inventory');
    if (!inv) inv = this.ecs.set(id, 'inventory', newInventory(10));
    if (!inv.slots.some(Boolean)) for (const d of defs) addItem(inv, d.id, 1, this.itemSpec(d.id));
    if (!known && identity.name !== m.name) {
      const person: Person = {
        nome: identity.name, tipo: modId!, specie: this.speciesOf(modId!) ?? 'persona', genere: identity.gender, mestiere: identity.job || m.name, eta: identity.age, famiglia: identity.family ?? [], routine: identity.routine ?? defaultRoutine(identity.job ?? ''),
        storia: identity.story, luogo: this.chunkAt(this.ecs.get(id, 'pos')?.x ?? 0, this.ecs.get(id, 'pos')?.y ?? 0)?.place?.name, origine: origin, persona: identity.persona, aspetto: identity.look, porta: identity.carrying,
      };
      // The kernel makes the society coherent: the other side of each relation, what this species can be.
      const next = addPerson(readPeople(this.files), person, (t) => this.speciesOf(t));
      this.repo.write('world/people.json', JSON.stringify(next, null, 2) + '\n');
      this.applyFiles({ ...this.repo.working });
      this.commitContent(`persone: ${identity.name}, ${person.mestiere}`, 'npc.individuate', 'narratore');
      // Relatives already met learn about the newcomer too (and the newcomer's relations may be corrected).
      for (const other of this.ecs.query('identity')) {
        const oi: Identity = this.ecs.get(other, 'identity');
        const back = next.persone.find((p) => p.nome === oi.name);
        if (back) oi.family = back.famiglia;
      }
      const fam = (identity.family ?? []).map((f) => `${f.legame} di ${f.nome}`).join(', ');
      this.council.say('narratore', 'propone', `${m.name} → ${identity.name}, ${person.mestiere}${fam ? `; ${fam}` : ''}: ${identity.look} (porta ${defs.map((d) => d.name).join(', ') || 'niente'})`, undefined, 'npc.individuate');
    }
    return identity;
  }

  /** What the routine says this person does now. */
  routineNow(identity: Identity | undefined): { quando: DayPhase; fa: string; dove: string } | undefined {
    if (!identity?.routine?.length) return undefined;
    const q = dayPhase(this.time, Kernel.DAY_SECONDS);
    return identity.routine.find((r) => r.quando === q);
  }

  private greeted = new Map<string, number>();
  private lastPhase = new Map<Id, string>();
  private queuedSpeech: Array<{ id: Id; text: string; at: number }> = [];
  private talking = false;
  private lastTalk = -1e9;
  private worldPhase = '';
  /** Where the wanderer last stood in the world (carpet space), for views opened from the studio. */
  private lastWorld = { x: 0, y: 0 };
  private plotsWoven = 0;

  /** The day of the world (0 = the first) and a label for memories. */
  day(): number {
    return Math.floor((this.time / Kernel.DAY_SECONDS) + 0.12);
  }

  private when(): string {
    return `giorno ${this.day() + 1}, ${dayPhase(this.time, Kernel.DAY_SECONDS)}`;
  }

  /** A person or an animal, from the archetype's class (a cat, a dog, a horse are animals). */
  speciesOf(tipo: string): Species | undefined {
    const man = this.modules.get(tipo)?.manifest;
    if (!man) return undefined;
    const app = man.appearance;
    const classe = app?.classe ?? (app?.model === 'animale' || app?.model === 'bestia' ? app.model : guessClass(`${man.name} ${man.description ?? ''} ${app?.aspetto ?? ''}`, man.persona ? 'figura' : undefined).id);
    return classe === 'animale' || classe === 'bestia' ? 'animale' : 'persona';
  }

  /**
   * The society is kept coherent (src/kernel/society.ts): at boot the registry is checked and, if
   * something is wrong (relations impossible for the species or the gender, one side only, names
   * alike), repaired and committed; renamed people are renamed in the plots too. No model calls.
   */
  reviewSociety(): string[] {
    const people = readPeople(this.repo.working);
    if (!people.persone.length) return [];
    const { people: fixed, fixes, renames } = repairSociety(people, (t) => this.speciesOf(t));
    if (!fixes.length) return [];
    this.repo.write('world/people.json', JSON.stringify(fixed, null, 2) + '\n');
    if (renames.length && this.repo.working[PLOTS_FILE]) this.repo.write(PLOTS_FILE, writePlots(applyRenames(readPlots(this.repo.working), renames)));
    this.applyFiles({ ...this.repo.working });
    this.repo.commit(`società: ${fixes.length} correzioni${renames.length ? ` (${renames.length} nomi nuovi)` : ''}`, 'agent');
    this.council.say('arbitro', 'approva', `società: ${fixes.length} correzioni — ${fixes.slice(0, 6).join('; ')}${fixes.length > 6 ? '…' : ''}`, undefined, 'review.society');
    return fixes;
  }

  /**
   * The open plots are kept coherent with the society and the rune canon (reviewPlot): at boot what
   * can be repaired is (beats of people who do not exist, animals that talk, impossible quests), what
   * contradicts the registry or the canon is dropped (the history keeps it). No model calls.
   */
  reviewPlots(): string[] {
    const plots = readPlots(this.repo.working);
    if (!plots.length) return [];
    const people = readPeople(this.repo.working);
    const fixes: string[] = [];
    const kept: Plot[] = [];
    for (const p of plots) {
      if (p.stato !== 'attiva') {
        kept.push(p);
        continue;
      }
      const r = reviewPlot(p, people);
      if (!r.problems.length) kept.push(p);
      else if (r.plot) kept.push(r.plot), fixes.push(`«${p.titolo}»: ${r.problems.join('; ')}`);
      else fixes.push(`«${p.titolo}» ritirata: ${r.problems.join('; ')}`);
    }
    if (!fixes.length) return [];
    this.repo.write(PLOTS_FILE, writePlots(kept));
    this.applyFiles({ ...this.repo.working });
    this.repo.commit(`trame: ${fixes.length} corrette o ritirate`, 'agent');
    this.council.say('arbitro', 'corregge', `trame: ${fixes.join(' — ')}`.slice(0, 600), 'narratore', 'review.plots');
    return fixes;
  }

  /** The registry entry of a person, by name. */
  personOf(name: string): Person | undefined {
    return readPeople(this.files).persone.find((p) => p.nome === name);
  }

  private updatePerson(name: string, fn: (p: Person) => void): void {
    const people = readPeople(this.files);
    const p = people.persone.find((x) => x.nome === name);
    if (!p) return;
    fn(p);
    this.repo.write('world/people.json', JSON.stringify(people, null, 2) + '\n');
    this.files = { ...this.files, 'world/people.json': this.repo.working['world/people.json']! };
  }

  /**
   * People remember: promises, favours, betrayals, what they saw. Memories are written in the society
   * registry (committed with the next save) and read back whenever they speak.
   */
  rememberAbout(name: string, testo: string, con?: string, peso = 1, viandante?: string): void {
    if (!testo.trim()) return;
    this.updatePerson(name, (p) => (p.ricordi = remember(p.ricordi, { quando: this.when(), testo: testo.slice(0, 200), ...(con ? { con } : {}), ...(viandante ? { viandante } : {}), peso: Math.max(1, Math.min(3, peso)) })));
  }

  /** A memory of the wanderer acting now: only they hear of it again (T34). */
  private rememberWanderer(name: string, testo: string, peso: number): void {
    const w = this.wanderer();
    this.rememberAbout(name, testo, w.nome, peso, w.id);
  }

  /** How the world speaks of a wanderer: «il viandante» when alone, their name otherwise. */
  private wandererWord(w: Wanderer): string {
    return w.id === SOLO && w.nome === WANDERER_NAME ? 'il viandante' : w.nome;
  }

  /** What someone becomes to the wanderer acting now (friend, sweetheart, spouse, child…): a fact of the world. */
  setBond(name: string, legame: string): void {
    const w = this.wanderer();
    this.updatePerson(name, (p) => {
      // As everywhere in the registry: what this person is to the other one.
      p.famiglia = [...p.famiglia.filter((f) => wandererOf(f) !== w.id), { nome: w.nome, legame, viandante: w.id }];
    });
    const who = this.wandererWord(w);
    this.recordRule({ chiave: `legame|${name}${w.id === SOLO ? '' : `|${w.id}`}`, testo: `${name} e ${who}`, possibile: true, racconto: `${name} ora è ${legame} ${who === 'il viandante' ? 'del viandante' : `di ${who}`}.`, effetti: ['legame'] }, false);
    this.message(`${name} ora è: ${legame}.`, 'good');
  }

  /** What a person is to the wanderer acting now, if anything. */
  bondOf(name: string): string | undefined {
    const p = this.personOf(name);
    return p ? bondWith(p, this.wanderer().id) : undefined;
  }

  /**
   * Society, once a second: people met nearby get an identity; everyone follows their routine — goes
   * where it happens and does it visibly; people who meet talk (by their relation); plots unfold.
   */
  private societyTick(): void {
    for (const q of this.queuedSpeech.filter((x) => x.at <= this.time)) this.speak(q.id, q.text);
    this.queuedSpeech = this.queuedSpeech.filter((x) => x.at > this.time);
    if (this.tickCount % 60 !== 0) return;
    const pc = this.playerCarpet();
    const people = this.ecs.query('mind', 'pos');
    let started = 0;
    for (const id of people) {
      const p = this.ecs.get(id, 'pos');
      const identity: Identity | undefined = this.ecs.get(id, 'identity');
      if (!identity) {
        if (!this.generationHeld && started < 2 && this.individuating.size < 2 && Math.hypot(p.x - pc.x, p.y - pc.y) < 9) {
          started++;
          void this.ensureIdentity(id);
        }
        continue;
      }
      const mind: Mind = this.ecs.get(id, 'mind');
      const now = this.routineNow(identity);
      if (!now) continue;
      const activity: Activity = (now as { azione?: Activity }).azione ?? inferActivity(now.fa, now.dove);
      const phaseKey = `${now.quando}`;
      if (this.lastPhase.get(id) !== phaseKey) {
        this.lastPhase.set(id, phaseKey);
        this.ecs.set(id, 'attivita', { tipo: activity, ferma: false });
        if (mind.mode === 'vaga') this.ecs.set(id, 'meta', this.placeFor(id, identity, now.dove, activity) ?? { none: true });
        if (Math.hypot(p.x - pc.x, p.y - pc.y) < 10) this.speak(id, `(${now.fa})`);
      }
      // Arrived: they do it, there, visibly (lying in bed, hoeing the field, fishing on the bank).
      const meta = this.ecs.get(id, 'meta');
      const att = this.ecs.get(id, 'attivita');
      if (att && mind.mode === 'vaga') {
        const arrived = !meta?.x || Math.hypot(meta.x - p.x, meta.y - p.y) < 1.3;
        att.ferma = arrived && activity !== 'passeggia' && activity !== 'pattuglia';
        att.tipo = activity;
      } else if (att) att.ferma = false;
    }
    this.meetings(people, pc);
    this.plotTick();
    this.questTick();
  }

  /** People who meet talk: by their relation, what they remember, the plots they are in. */
  private meetings(people: Id[], pc: { x: number; y: number }): void {
    const ids = people.filter((id) => this.ecs.has(id, 'identity'));
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i];
        const b = ids[j];
        const pa = this.ecs.get(a, 'pos');
        const pb = this.ecs.get(b, 'pos');
        if (Math.hypot(pa.x - pb.x, pa.y - pb.y) > 2.4) continue;
        const ia: Identity = this.ecs.get(a, 'identity');
        const ib: Identity = this.ecs.get(b, 'identity');
        if (this.ecs.get(a, 'attivita')?.tipo === 'dorme' || this.ecs.get(b, 'attivita')?.tipo === 'dorme') continue;
        const rel = ia.family?.find((f) => f.nome === ib.name);
        const key = [ia.name, ib.name].sort().join('|');
        if ((this.greeted.get(key) ?? -1e9) > this.time - (rel ? 90 : 240)) continue;
        const near = Math.hypot(pa.x - pc.x, pa.y - pc.y) < 10;
        // A real conversation (the Narrator) when the wanderer can hear it, at most one at a time.
        if (near && !this.talking && this.time - this.lastTalk > 40 && !this.generationHeld) {
          this.greeted.set(key, this.time);
          void this.converse(a, b, ia, ib, rel?.legame);
          return;
        }
        if (!rel) continue;
        this.greeted.set(key, this.time);
        const [la, lb] = greeting({ nome: ia.name, mestiere: ia.job ?? '' }, { nome: ib.name }, rel.legame, this.routineNow(ia)?.fa ?? '');
        this.speak(a, la);
        this.queuedSpeech.push({ id: b, text: lb, at: this.time + 2.2 });
      }
  }

  private async converse(a: Id, b: Id, ia: Identity, ib: Identity, legame?: string): Promise<void> {
    this.talking = true;
    this.lastTalk = this.time;
    const plots = readPlots(this.files);
    const day = this.day();
    const as = (who: Identity, other: Identity, l?: string) => ({
      nome: who.name,
      mestiere: who.job ?? '',
      legame: l ?? who.family?.find((f) => f.nome === other.name)?.legame,
      fa: this.routineNow(who)?.fa ?? '',
      ricordi: memorySummary(this.personOf(who.name)?.ricordi?.filter((m) => !m.con || m.con === other.name || m.peso >= 3), 6),
      segreti: secretsOf(plots, who.name, day),
    });
    try {
      const r = await npcDialogue(this.council, as(ia, ib, legame), as(ib, ia), this.chunkAt(this.ecs.get(a, 'pos')?.x ?? 0, this.ecs.get(a, 'pos')?.y ?? 0)?.place?.name ?? 'qui', this.focusOn([ia.name, ib.name], this.ecs.get(a, 'pos')));
      r.lines.forEach((l, i) => this.queuedSpeech.push({ id: l.who === 'a' ? a : b, text: l.say, at: this.time + i * 2.6 }));
      if (r.memoryA) this.rememberAbout(ia.name, r.memoryA, ib.name, 1);
      if (r.memoryB) this.rememberAbout(ib.name, r.memoryB, ia.name, 1);
      this.council.say('narratore', 'info', `${ia.name} e ${ib.name}: ${r.lines.map((l) => `«${l.say}»`).join(' ')}`, undefined, 'npc.dialogue');
    } catch {
      if (legame) {
        const [la, lb] = greeting({ nome: ia.name, mestiere: ia.job ?? '' }, { nome: ib.name }, legame, this.routineNow(ia)?.fa ?? '');
        this.speak(a, la);
        this.queuedSpeech.push({ id: b, text: lb, at: this.time + 2.2 });
      }
    } finally {
      this.talking = false;
    }
  }

  /** The entity of a person, if they walk the loaded world. */
  private entityOf(name: string): Id | undefined {
    return this.ecs.query('identity').find((id) => this.ecs.get(id, 'identity').name === name);
  }

  /**
   * Plots unfold: at each change of the moment of the day, the beats due happen — the person goes
   * there, does it, says the line (and remembers it). Seen or not, it happened.
   */
  private plotTick(): void {
    const phase = `${this.day()}|${dayPhase(this.time, Kernel.DAY_SECONDS)}`;
    if (phase === this.worldPhase) return;
    const first = !this.worldPhase;
    this.worldPhase = phase;
    const plots = readPlots(this.files);
    const day = this.day();
    const q = dayPhase(this.time, Kernel.DAY_SECONDS);
    let changed = false;
    const pc = this.playerCarpet();
    for (const plot of plots) {
      if (plot.stato !== 'attiva') continue;
      for (const beat of plot.tappe) {
        if (beat.fatto || plot.inizio + beat.giorno > day || (plot.inizio + beat.giorno === day && beat.momento !== q)) continue;
        beat.fatto = true;
        changed = true;
        this.rememberAbout(beat.chi, `${beat.cosa}${beat.battuta ? ` («${beat.battuta}»)` : ''}`, undefined, 2);
        const id = this.entityOf(beat.chi);
        if (id !== undefined) {
          const identity: Identity = this.ecs.get(id, 'identity');
          const place = ['casa', 'lavoro', 'piazza'].includes(beat.dove) ? this.placeFor(id, identity, beat.dove, inferActivity(beat.cosa, beat.dove)) : undefined;
          if (place) this.ecs.set(id, 'meta', place);
          this.queuedSpeech.push({ id, text: beat.battuta ? beat.battuta : `(${beat.cosa})`, at: this.time + 1 });
          const p = this.ecs.get(id, 'pos');
          if (p && Math.hypot(p.x - pc.x, p.y - pc.y) < 12) this.message(`${beat.chi} ${beat.cosa}${beat.indizio ? ` — ${beat.indizio}` : ''}`);
        }
        this.council.say('narratore', 'info', `trama «${plot.titolo}»: ${beat.chi} ${beat.cosa} (${beat.dove}, ${beat.momento})`, undefined, 'plot.beat');
      }
      if (plot.tappe.every((b) => b.fatto) && (!plot.missione || plot.missione.stato !== 'accettata') && day > plot.inizio + 3) {
        plot.stato = 'chiusa';
        changed = true;
      }
    }
    if (changed) {
      this.repo.write(PLOTS_FILE, writePlots(plots));
      this.files = { ...this.files, [PLOTS_FILE]: this.repo.working[PLOTS_FILE]! };
    }
    // A new day without a story: the Narrator weaves one among the people already met.
    if (!first && !plots.some((p) => p.stato === 'attiva')) void this.weaveStory();
  }

  /** The Narrator weaves a horizontal plot among existing people and places (westworld-like). */
  async weaveStory(force = false): Promise<Plot | undefined> {
    const society = readPeople(this.files);
    if (!force && (this.plotsWoven >= 3 || society.persone.length < 3 || this.models.name === 'offline' || this.generationHeld)) return undefined;
    this.plotsWoven++;
    const pc = this.playerCarpet();
    const places = this.directionsAt(pc.x, pc.y).join('\n');
    const recent = society.persone.flatMap((p) => (p.ricordi ?? []).filter((m) => m.peso >= 2).slice(-2).map((m) => `${p.nome}: ${m.testo}`)).slice(-10).join('\n');
    // The plot is checked against the people and the canon; what does not hold goes back to the
    // Narrator once, with the reasons; the second answer is repaired, or dropped if it cannot be.
    const attempt = async (feedback?: string) => {
      const raw = plotFromRaw(await weavePlot(this.council, societySummary(society, 20), places, recent, feedback, this.focusOn(society.persone.slice(-20).map((p) => p.nome))), this.day(), `trama-${this.worldStamp()}`);
      return { titolo: raw.titolo, ...reviewPlot(raw, society) };
    };
    let plot: Plot | undefined;
    try {
      let a = await attempt();
      if (a.problems.length) {
        const why = `la trama «${a.titolo}» non torna: ${a.problems.join('; ')}.`;
        this.council.say('kernel', 'scarta', why, 'narratore', 'plot.weave');
        a = await attempt(why);
        if (!a.plot) throw new Error(`ancora incoerente: ${a.problems.join('; ')}`);
        if (a.problems.length) this.council.say('arbitro', 'corregge', `trama «${a.titolo}»: ${a.problems.join('; ')}`, 'narratore', 'plot.weave');
      }
      plot = a.plot;
    } catch (e) {
      this.council.say('narratore', 'errore', `trama: ${(e as Error).message}`, undefined, 'plot.weave');
      return undefined;
    }
    if (!plot || plot.tappe.length < 2) return undefined;
    const plots = [...readPlots(this.files), plot];
    this.repo.write(PLOTS_FILE, writePlots(plots));
    this.applyFiles({ ...this.repo.working });
    this.commitContent(`trama: ${plot.titolo}`, 'plot.weave', 'narratore');
    this.cards.use([...plot.coinvolti.map((n) => `persona:${nodeSlug(n)}`), ...this.graph().resolve(plot.tappe.map((t) => t.dove))], 'trame', (id) => this.isCard(id));
    this.council.say('narratore', 'propone', `nuova trama «${plot.titolo}» tra ${plot.coinvolti.join(', ')}${plot.missione ? `; ${plot.missione.da} avrà una richiesta per il viandante` : ''}`, undefined, 'plot.weave');
    return plot;
  }

  private updatePlots(fn: (plots: Plot[]) => boolean): void {
    const plots = readPlots(this.files);
    if (!fn(plots)) return;
    this.repo.write(PLOTS_FILE, writePlots(plots));
    this.files = { ...this.files, [PLOTS_FILE]: this.repo.working[PLOTS_FILE]! };
  }

  /** Quests the wanderer acting now is on (for the HUD). */
  quests(): Array<{ titolo: string; da: string; testo: string; obiettivo: string }> {
    return activeQuests(readPlots(this.files), this.wanderer().id).map(({ plot, quest }) => ({
      titolo: plot.titolo,
      da: quest.da,
      testo: quest.testo,
      obiettivo: quest.obiettivo.tipo === 'porta' ? `porta ${quest.obiettivo.oggetto ?? 'ciò che serve'} a ${quest.obiettivo.a ?? quest.da}` : quest.obiettivo.tipo === 'vai' ? `vai a ${quest.obiettivo.luogo ?? '?'}` : `parla con ${quest.obiettivo.a ?? '?'}`,
    }));
  }

  /**
   * The situation table of the Direction (T46a): the wanderer, the places being generated, the open plots at their beat,
   * the quests, the faults, each on its chunk and region; from what there is already, generating nothing.
   */
  situation(): Situation {
    const S = this.config.chunkSize;
    const people = readPeople(this.files).persone;
    const chunkOf = (x: number, y: number) => ({ cx: Math.floor(x / S), cy: Math.floor(y / S) });
    const locate = (name: string) => {
      const id = this.entityOf(name);
      const pos = id === undefined ? undefined : this.ecs.get(id, 'pos');
      if (pos) return chunkOf(pos.x, pos.y);
      const p = people.find((x) => x.nome === name);
      const m = /^(-?\d+),(-?\d+)#/.exec(p?.origine ?? '');
      if (m) return { cx: Number(m[1]), cy: Number(m[2]) };
      const ch = p?.luogo ? [...this.chunks.values()].find((c) => c.place?.name === p.luogo) : undefined;
      return ch ? { cx: ch.cx, cy: ch.cy } : undefined;
    };
    // Seen from the studio, the wanderer is where they last stood in the world.
    const pc = this.corona.isInterior(this.playerPos().x) || this.zone !== 'sim' ? this.lastWorld : this.playerCarpet();
    return buildSituation({
      atlas: readAtlas(this.files),
      plots: readPlots(this.files),
      faults: this.faults.list(),
      wanderer: chunkOf(pc.x, pc.y),
      chunks: [...this.chunks.values()].map((c) => ({ cx: c.cx, cy: c.cy, stage: c.stage, developing: c.developing, name: c.place?.name })),
      locate,
      chunkSize: S,
    });
  }

  /**
   * The Direction's wall of screens (T46b): the timeline of the commits around the one chosen, the live log of the
   * Council, the board of the costs with the budgets of `universe.json → ai`; from what there is, changing nothing;
   * and the band of alert under its ceiling (T46c): faults, the validator's rejections, the budgets.
   */
  screens(now = Date.now()): Screens {
    const log = this.repo.log();
    const i = this.filmAt ? log.findIndex((c) => c.id === this.filmAt) : 0;
    const ai = this.config.ai;
    const budgets: Budget[] = [
      { nome: 'testo', usati: this.models.usage.text, max: ai.maxText },
      { nome: 'Fucina', usati: this.forgesUsed, max: ai.maxForges },
      { nome: 'pacchetti', usati: this.packsUsed, max: ai.maxPacks ?? 4 },
      { nome: 'tipi nuovi', usati: this.castUsed, max: ai.maxCast ?? 3 },
      { nome: 'modelli', usati: this.sculpting.count, max: ai.maxModels ?? 40 },
    ];
    return {
      tempo: timeline(log, Math.max(0, i), (c) => (c.parent ? this.repo.find(c.parent) : undefined)),
      registro: liveFeed(this.feed(), this.usage.lastCall, now, this.models.name === 'offline' ? 'offline' : ai.textModel),
      costi: costBoard(this.usage, budgets),
      allerta: alertOf(this.faults.list(), this.feed(), budgets, now),
    };
  }

  /**
   * «<» «>» of the timeline: an older (d > 0) or a newer commit, stopping at the first and the last. Only the film
   * moves: looking never goes back (R is the only way).
   */
  stepTimeline(d: number): void {
    const log = this.repo.log();
    if (!log.length) return this.message('La pellicola è vuota.');
    const from = Math.max(0, this.filmAt ? log.findIndex((c) => c.id === this.filmAt) : 0);
    const to = clampFrame(from + d, log.length);
    if (to === from) return this.message(to === 0 ? 'La pellicola finisce qui: è il presente.' : "La pellicola finisce qui: è l'inizio dell'universo.");
    // The newest is not held: new commits keep it at the present.
    this.filmAt = to === 0 ? undefined : log[to].id;
    const t = this.screens().tempo;
    this.message(`${t.chosen?.message ?? ''} — ${t.chosen?.who ?? ''} (${t.count - t.index}/${t.count})`);
    this.bus.emit('studio:screens', { screens: this.screens() });
  }

  /**
   * The chain of the Systems Room (T27a): the systems in the order of the tick, each with what it cost in the last second
   * (milliseconds and entities touched per tick) and its open fault; from what the tick measures, changing nothing.
   */
  chain(): Chain {
    return chainOf(this.systems, this.meter, this.faults.list());
  }

  /** A station of the chain seen up close: what the system does, its place in the tick, its measures, its code. */
  openStation(id: string): void {
    const chain = this.chain();
    const station = chain.stations.find((s) => s.id === id);
    if (station) this.bus.emit('ui:station', { station, chain });
  }

  /** The agents at work now, as the live log says (T46c). */
  working(now = Date.now()): AgentId[] {
    return liveFeed(this.feed(), this.usage.lastCall, now).desks.filter((d) => d.working).map((d) => d.agent);
  }

  /** A field of the wall seen up close. */
  openScreen(field: ScreenField): void {
    if (!SCREEN_NAME[field]) return;
    this.bus.emit('ui:screens', { field, screens: this.screens() });
  }

  /** "Vai" quests are done by arriving: the place or the region you stand in. */
  private questTick(): void {
    const here = [this.placeHere()?.name ?? '', ...this.directionsAt(this.playerCarpet().x, this.playerCarpet().y).filter((d) => d.startsWith('qui siamo'))].join(' ').toLowerCase();
    for (const { plot, quest } of activeQuests(readPlots(this.files), this.wanderer().id)) {
      if (quest.obiettivo.tipo === 'vai' && quest.obiettivo.luogo && here.includes(normName(quest.obiettivo.luogo).split(' ')[0] ?? '~')) void this.completeQuest(plot.id);
    }
  }

  private async completeQuest(plotId: string): Promise<void> {
    let done: Plot | undefined;
    this.updatePlots((plots) => {
      const p = plots.find((x) => x.id === plotId);
      if (!p?.missione || p.missione.stato !== 'accettata') return false;
      p.missione.stato = 'compiuta';
      done = p;
      return true;
    });
    if (!done?.missione) return;
    const q = done.missione;
    // Whoever accepted it is remembered and rewarded, wherever the others are.
    const by = q.viandante ?? SOLO;
    const who = this.as(by, () => this.wandererWord(this.wanderer()));
    this.as(by, () => this.rememberWanderer(q.da, `${who} ha mantenuto la promessa: ${q.testo}`, 3));
    this.recordRule({ chiave: `missione|${plotId}`, testo: `missione di ${q.da}: ${q.testo}`, possibile: true, racconto: `compiuta da${who === 'il viandante' ? 'l viandante' : ` ${who}`}`, effetti: ['missione'] }, false);
    this.message(`Missione compiuta: ${q.testo}`, 'good');
    if (q.ricompensa) {
      const d = this.content.byName(q.ricompensa) ?? (await this.introduceItems([q.ricompensa], `ricompensa di ${q.da}`))[0];
      if (d && this.as(by, () => this.give(d.id, 1))) this.message(`${q.da} ti ricompensa: ${d.name}`, 'good');
    }
  }

  /** Talking to someone may complete a quest: the one to talk to, or the one waiting for something. */
  private questsOnTalk(name: string): void {
    for (const { plot, quest } of activeQuests(readPlots(this.files), this.wanderer().id)) {
      const o = quest.obiettivo;
      if (o.tipo === 'parla' && o.a === name) void this.completeQuest(plot.id);
      if (o.tipo === 'porta' && (o.a ?? quest.da) === name && o.oggetto) {
        const id = this.carriedByName(o.oggetto);
        if (id) {
          removeItem(this.inventory(), id, 1);
          this.message(`Consegni ${this.itemInfo(id).name} a ${name}.`);
          void this.completeQuest(plot.id);
        }
      }
    }
  }

  /**
   * Where a routine step happens: home (a building of their place), work, the square — and for what
   * they do, the right spot: a bed to sleep, a field to hoe, a bank to fish, a wood to cut.
   */
  private placeFor(id: Id, identity: Identity, where: string, activity?: Activity): { x: number; y: number } | undefined {
    if (where === 'in giro' && !activity) return undefined;
    const S = this.config.chunkSize;
    const key: string | undefined = this.ecs.get(id, 'chunk')?.key;
    const p = this.ecs.get(id, 'pos');
    const ch = (key ? this.chunks.get(key) : undefined) ?? this.chunkAt(p.x, p.y);
    if (!ch || ch.stage !== 'planned') return undefined;
    const h = hashStr(identity.name);
    const cell = (i: number) => ({ x: ch.cx * S + (i % S) + 0.5, y: ch.cy * S + Math.floor(i / S) + 0.5 });
    const free = (i: number) => !this.palette[ch.tiles[i]]?.solid;
    const around = (i: number, pred: (t: TileDef | undefined) => boolean) => [i - 1, i + 1, i - S, i + S].some((n) => n >= 0 && n < S * S && pred(this.palette[ch.tiles[n]]));
    const pickCell = (pred: (i: number) => boolean) => {
      const list: number[] = [];
      for (let i = 0; i < S * S; i++) if (free(i) && pred(i)) list.push(i);
      return list.length ? cell(list[h % list.length]) : undefined;
    };
    if (activity === 'dorme') {
      // A bed of their place, always the same one.
      const beds = this.ecs.query('module', 'pos').filter((e) => {
        const m = this.modules.get(this.ecs.get(e, 'module').id)?.manifest;
        const ep = this.ecs.get(e, 'pos');
        return !!m && /letto|giaciglio|branda|pagliericcio|amaca/i.test(`${m.name} ${(m.tags ?? []).join(' ')}`) && this.chunkAt(ep.x, ep.y) === ch;
      });
      if (beds.length) {
        const bp = this.ecs.get(beds[h % beds.length], 'pos');
        return { x: bp.x + 0.6, y: bp.y };
      }
    }
    if (activity === 'zappa') {
      const field = pickCell((i) => /campo|orto|arato|solchi/i.test(this.palette[ch.tiles[i]]?.name ?? ''));
      if (field) return field;
    }
    if (activity === 'pesca') {
      const bank = pickCell((i) => around(i, (t) => t?.layer === 'liquid'));
      if (bank) return bank;
    }
    if (activity === 'taglia_legna') {
      const edge = pickCell((i) => around(i, (t) => t?.layer === 'vegetation'));
      if (edge) return edge;
    }
    if (where === 'in giro') return undefined;
    if (where === 'casa' || activity === 'dorme' || activity === 'prega' || (where === 'lavoro' && /fabbr|forn|oste|locand|bottega|mercant|sart|panett|cuoc|tessit|speziale|scriv|mago|monac/i.test(identity.job ?? ''))) {
      const bs = ch.buildings.filter((b) => b.floor.some(free));
      if (bs.length) {
        const b = bs[(h + (where === 'lavoro' ? 1 : 0)) % bs.length];
        // Home is the floor of the house's model, inside its walls (its lot, until the model is ready).
        const sid = this.ecs.query('struttura', 'origin').find((e) => this.ecs.get(e, 'origin').key === `${ch.key}#s${ch.buildings.indexOf(b)}`);
        const inside = sid !== undefined ? this.interiorPoints(sid) : [];
        if (inside.length) return inside[h % inside.length];
        const floor = b.floor.filter(free);
        return cell(floor[h % floor.length]);
      }
    }
    if (where === 'piazza') {
      const pathCode = this.palette.p ? 'p' : undefined;
      const centre = (S * S) / 2 + S / 2;
      let best = -1;
      for (let i = 0; i < S * S; i++) if ((pathCode ? ch.tiles[i] === pathCode : free(i)) && (best < 0 || Math.abs(i - centre) < Math.abs(best - centre))) best = i;
      if (best >= 0) return cell(best);
    }
    // Work outdoors (fields, woods, flock): a free spot of their place, always the same.
    for (let k = 0; k < 40; k++) {
      const i = (h + k * 7919) % (S * S);
      if (free(i)) return cell(i);
    }
    return undefined;
  }

  /**
   * Talks to an NPC: the Narrator plays the individual; the chosen action is validated and applied. `wanderer`
   * is who talks (T34; the one acting now by default): the person knows their name, their bond, what they did together.
   */
  async talk(id: Id, text: string, wanderer?: string): Promise<NpcReply> {
    const me = wanderer && this.wanderersById.has(wanderer) ? this.wanderersById.get(wanderer)! : this.wanderer();
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
      const now = this.routineNow(identity);
      const social = identity
        ? `\nIl tuo mestiere: ${identity.job ?? '—'}. La tua famiglia: ${(identity.family ?? []).map((f) => `${f.legame} ${f.nome}`).join(', ') || 'nessuno'}.${identity.story ? ` La tua storia: ${identity.story}` : ''}${now ? ` Adesso (${now.quando}) stai: ${now.fa}.` : ''}`
        : '';
      const person = this.personOf(name);
      reply = await npcReply(this.council, {
        name,
        wanderer: me.nome,
        memories: memorySummary(memoriesFor(person?.ricordi, me.id), 12),
        bond: person ? bondWith(person, me.id) : undefined,
        secrets: secretsOf(readPlots(this.files), name, this.day()),
        persona: (identity?.persona ?? m.persona) + social, mood: mind.mood, mode: mind.mode, carrying, place: this.placeHere()?.name ?? '', history: mind.history.filter((t) => (t.con ?? SOLO) === me.id), facts: this.worldFacts() }, text, this.focusOn([name], this.ecs.get(id, 'pos')));
    } catch (e) {
      return { say: `(${name} ti guarda in silenzio — ${(e as Error).message})`, action: 'nessuna', mood: mind.mood };
    }
    mind.history.push({ who: 'giocatore', text, con: me.id }, { who: 'npc', text: reply.say, con: me.id });
    if (mind.history.length > 16) mind.history.splice(0, mind.history.length - 16);
    mind.mood = reply.mood;
    if (reply.action === 'segui' || reply.action === 'resta' || reply.action === 'vaga') mind.mode = reply.action;
    // What follows happens to the wanderer who talked (synchronous: `as` never spans an await).
    const carry = this.as(me.id, () => {
      if (reply.action === 'dai') {
        const wantedName = normName(reply.item ?? '');
        const slot = inv?.slots.find((s) => s && normName(this.itemInfo(s.item).name) === wantedName) ?? inv?.slots.find((s) => s && wantedName && normName(this.itemInfo(s.item).name).includes(wantedName));
        if (slot && inv && this.give(slot.item, 1)) {
          removeItem(inv, slot.item, 1);
          this.message(`${name} ti dà: ${this.itemInfo(slot.item).name}`, 'good');
        } else reply.action = 'nessuna';
      }
      if (reply.mentioned?.length) void this.noteMentions(reply.mentioned, `di cui si parla con ${name}`);
      if (reply.memory) this.rememberWanderer(name, reply.memory, reply.weight ?? 1);
      if (reply.bond && reply.bond !== this.bondOf(name)) this.setBond(name, reply.bond);
      let given = '';
      let carry: string | undefined;
      if (reply.action === 'missione') {
        this.updatePlots((plots) => {
          const p = plots.find((x) => x.stato === 'attiva' && x.missione?.da === name && x.missione.stato === 'offerta');
          if (!p?.missione) return false;
          p.missione.stato = 'accettata';
          p.missione.viandante = me.id;
          given = p.missione.testo;
          if (p.missione.obiettivo.tipo === 'porta') carry = p.missione.obiettivo.oggetto;
          return true;
        });
        if (given) this.message(`Nuova missione da ${name}: ${given}`, 'good');
      }
      return carry && !this.carriedByName(carry) ? carry : undefined;
    });
    // "Take this to…": whoever asks hands over what is to be carried.
    if (carry) {
      const d = this.content.byName(carry) ?? (await this.introduceItems([carry], `affidato da ${name} a ${this.wandererWord(me)}`))[0];
      if (d && this.as(me.id, () => this.give(d.id, 1))) this.message(`${name} ti affida: ${d.name}`, 'good');
    }
    this.as(me.id, () => this.questsOnTalk(name));
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
    this.commitContent(`contenuti: ${defs.map((d) => d.name).join(', ')}`, 'items.citati', 'narratore');
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
      const c = this.commitContent(`contenuti: pacchetto ${n} (${pack.items.length} oggetti, ${pack.recipes.length} ricette)`, 'content.items', 'narratore');
      this.council.say('kernel', 'approva', `pacchetto ${n}: ${pack.items.length} oggetti, ${pack.recipes.length} ricette, ${Object.keys(pack.loot).length} tabelle → commit ${c.id}`);
      return true;
    } catch (e) {
      this.council.say('narratore', 'errore', `pacchetto: ${(e as Error).message}`);
      return false;
    } finally {
      this.growing = false;
    }
  }

  /**
   * What a task of the Narrator is about, as nodes of the graph of the world (T13): the things named,
   * and the place where it happens (the wanderer's, or the given carpet point's). Not the wanderer: what
   * they carry is in the prompts, and who is bound to them says it in their own line.
   */
  focusOn(refs: Array<string | false | undefined>, at?: { x: number; y: number }): string[] {
    const p = at ?? this.playerCarpet();
    const ch = this.chunkAt(p.x, p.y);
    return [...refs.filter((r): r is string => !!r), ...(ch ? [`luogo:${nodeSlug(`${ch.cx}_${ch.cy}`)}`] : [])];
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
    if (this.corona.isInterior(rx) || (Math.hypot(rx, ry) >= R && this.coronaRevealed())) {
      const a = this.archive.nearest(rx, ry, 0.7);
      if (a) return { kind: 'agent', agent: a.agent, name: a.name, doing: a.say ?? (a.path ? `lavora su ${a.path}` : undefined) };
      const cell = this.corona.at(Math.floor(rx), Math.floor(ry));
      if (cell?.kind === 'item' && cell.item && cell.item.kind !== 'desk') {
        const recent = cell.item.path ? this.recentChanges().get(cell.item.path) : undefined;
        return { kind: 'studio', item: cell.item, building: this.corona.building(cell.building)?.name ?? '', recent: recent ? `${recent.author}: ${recent.message}` : undefined };
      }
      if (cell?.kind === 'door' || cell?.kind === 'building') {
        const b = this.corona.building(cell.building);
        return b ? { kind: 'door', building: b.name, team: AGENTS[b.team as AgentId]?.name ?? b.team } : null;
      }
      return null;
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
      const doing = this.routineNow(identity)?.fa;
      const extra = mind ? `${doing ? `${doing} · ` : ''}umore: ${mind.mood}` : this.ecs.has(eid, 'container') ? 'E per aprire' : m?.actions?.length ? `E: ${m.actions.map((a) => a.label).join(', ')}` : undefined;
      const fam = identity?.family?.length ? ` ${identity.family.map((f) => `${f.legame[0].toUpperCase()}${f.legame.slice(1)} di ${f.nome}`).join(', ')}.` : '';
      return { kind: 'entity', name: identity?.name ?? m?.name ?? '???', description: identity ? `${identity.job ? identity.job[0].toUpperCase() + identity.job.slice(1) : m?.name}.${fam} ${identity.look}` : (m?.description ?? ''), extra };
    }
    const t = this.tileAt(Math.floor(cx), Math.floor(cy));
    return t ? { kind: 'tile', name: `${this.palette[t]?.name ?? t}${this.palette[t]?.solid ? ' (invalicabile)' : ''}` } : null;
  }

  // --- The Forge and Genesis ---------------------------------------------------------------------

  /** Forges a module through the Council, then validates, commits and hot loads it; the Sculptor gives it a model. */
  async forgeModule(prompt: string, origin: ForgeOrigin, kind?: 'npc' | 'oggetto' | 'strumento', permissive = false, chi?: string): Promise<{ ok: boolean; id?: string; summary: string }> {
    // The Genesis is the world's; what the wanderer who transcended asks is theirs, and they wrote it (T36).
    if (origin === 'genesi') chi = COMUNE;
    const autore = permissive ? this.wanderer().id : 'narratore';
    const ids = [...this.modules.keys()];
    try {
      const r = await forge(
        this.council,
        { prompt, origin, kind, chi, existingIds: ids, paletteCodes: Object.keys(this.palette).filter((c) => c !== '?' && !this.palette[c].solid), permissive, existingNames: [...this.modules.values()].filter((m) => m.manifest.kind === 'entity' || m.manifest.kind === 'item').map((m) => m.manifest.name) },
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
      const c = this.commitContent(`${origin}: ${r.summary}`, 'forge.concept', autore, chi);
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

  /**
   * Once per universe, the Arbiter reviews what the Council created before the two tables were kept
   * apart (ADR-0025): characters or things that break the fourth wall, and duplicates, are retired
   * (their files removed, the bible cleaned, plots dropped). The universe's history keeps them, recoverable.
   * The marker has a version: when the principles grow (legends that hint at the game, doubles of the
   * runes), universes already reviewed are reviewed again.
   */
  async reviewFourthWall(): Promise<string[]> {
    const marker = 'revisione|quarta-parete-2';
    if (this.rules().some((r) => r.chiave === marker)) return [];
    const generated = [...this.modules.values()].filter((m) => m.manifest.origin && m.manifest.origin !== 'esempio' && (m.manifest.kind === 'entity' || m.manifest.kind === 'item'));
    const oldBible = readBible(this.repo.working);
    const plots = readPlots(this.repo.working);
    const brokenPlots = plots.filter((p) => metaBreak(plotText(p)));
    // Nothing created yet (a universe just born from the seed): nothing to review.
    if (!generated.length && !brokenPlots.length && !(oldBible && bibleBreaks(oldBible).length)) return [];
    const retire = new Set<string>();
    const seen = new Map<string, string>();
    // The first of a kind (the shortest id: "-2", "-3" came later) is the one that stays.
    generated.sort((x, y) => x.manifest.id.length - y.manifest.id.length || x.manifest.id.localeCompare(y.manifest.id));
    for (const m of generated) {
      const man = m.manifest;
      if (metaBreak(`${man.name} ${man.description ?? ''} ${man.persona ?? ''} ${man.lore ?? ''}`)) retire.add(man.id);
      const key = normName(man.name);
      if (seen.has(key)) retire.add(man.id);
      else seen.set(key, man.id);
    }
    // The Arbiter sees subtler breaks the words miss (offline models answer nothing).
    if (generated.length && this.models.name !== 'offline') {
      try {
        const r = await this.council.ask<{ ritira?: string[]; motivo?: string }>(
          'arbitro',
          'review.fourthwall',
          `Rivedi questi moduli creati dal Concilio. Ritira quelli che rompono la quarta parete (riferimenti a codice, simulazione, realtà instabile o finta, mondi che si ripetono, ruoli astratti come custodi della realtà, censori, archivisti del mondo, misuratori di anomalie; anche travestiti da leggenda: chi torna sempre in piazza, chi osserva ogni viandante, confini che nessuno supera), quelli che duplicano le rune (altri simboli luminosi nel terreno) e i doppioni. Tieni tutto ciò che è una persona o una cosa vera del mondo.\n${generated.map((m) => `- ${m.manifest.id} «${m.manifest.name}»: ${(m.manifest.description ?? '').slice(0, 140)} ${(m.manifest.persona ?? '').slice(0, 160)}`).join('\n')}`,
          { type: 'OBJECT', properties: { ritira: { type: 'ARRAY', items: { type: 'STRING' } }, motivo: { type: 'STRING' } }, required: ['ritira'] },
          { data: { ids: generated.map((m) => m.manifest.id) }, temperature: 0.2 },
        );
        for (const id of r.ritira ?? []) if (this.modules.get(id)?.manifest.origin && this.modules.get(id)?.manifest.origin !== 'esempio') retire.add(id);
      } catch {
        /* the words are enough */
      }
    }
    const names: string[] = [];
    for (const id of retire) {
      const m = this.modules.get(id);
      if (!m) continue;
      names.push(m.manifest.name);
      for (const p of Object.keys(this.repo.working)) if (p.startsWith(m.dir)) this.repo.write(p, null);
    }
    if (oldBible) {
      const gone = new Set(names.map(normName));
      const bible = cleanBible(oldBible);
      bible.personaggi = bible.personaggi.filter((l) => !gone.has(normName(l.split(' — ')[0])));
      bible.fatti = bible.fatti.filter((l) => !gone.has(normName(l.split(' — ')[0])));
      this.repo.write('world/bible.json', JSON.stringify(bible, null, 2) + '\n');
    }
    // Plots that hint at the game, or give the runes a life of their own, are dropped.
    if (brokenPlots.length) {
      this.repo.write(PLOTS_FILE, writePlots(plots.filter((p) => !brokenPlots.includes(p))));
      names.push(...brokenPlots.map((p) => `trama «${p.titolo}»`));
    }
    this.recordRule({ chiave: marker, testo: 'revisione della quarta parete', possibile: true, racconto: names.length ? `ritirati: ${names.join(', ')}` : 'niente da ritirare' }, false);
    this.applyFiles({ ...this.repo.working });
    this.repo.commit(names.length ? `l'Arbitro ritira ${names.length} moduli fuori dal mondo: ${[...new Set(names)].join(', ')}` : 'revisione della quarta parete', 'agent');
    if (names.length) this.council.say('arbitro', 'approva', `quarta parete: ritirati ${names.length} moduli (${[...new Set(names)].join(', ')})`, undefined, 'review.fourthwall');
    return names;
  }

  /** Asks the in-world agent for a new module (console → Agente). */
  async askAgent(prompt: string): Promise<{ ok: boolean; id?: string; summary: string }> {
    return this.forgeModule(prompt, 'agente');
  }

  /**
   * Real drafts to test layout programs on: one forest-ish, one open, one with water on land (T26d: with the biomes a
   * fixed place can be all sea). Deterministic: the first place that fits each, from the old three outwards; a role no
   * place fits keeps its old place. Made once per state of the files.
   */
  sampleDrafts(): string[][] {
    if (this.trialDrafts?.files === this.files) return this.trialDrafts.drafts;
    const old: Array<[number, number]> = [[3, -7], [-11, 4], [20, 13]];
    const near: Array<[number, number]> = [];
    for (let cy = -8; cy <= 8; cy += 2) for (let cx = -8; cx <= 8; cx += 2) near.push([cx, cy]);
    near.sort((a, b) => Math.hypot(...a) - Math.hypot(...b) || a[1] - b[1] || a[0] - b[0]);
    const share = (d: string, test: (t: TileDef | undefined) => boolean) => [...d].filter((c) => test(this.palette[c])).length / d.length;
    const roles: Array<(d: string) => boolean> = [
      (d) => share(d, (t) => t?.layer === 'vegetation') >= 0.25 && share(d, (t) => t?.layer === 'liquid') <= 0.2,
      (d) => share(d, (t) => !!t && !t.solid) >= 0.8,
      (d) => { const w = share(d, (t) => t?.layer === 'liquid'); return w >= 0.15 && w <= 0.5 && share(d, (t) => !!t && !t.solid) >= 0.4; },
    ];
    const picked: Array<string | undefined> = [undefined, undefined, undefined];
    const used = new Set<string>();
    for (const [cx, cy] of [...old, ...near]) {
      if (picked.every(Boolean)) break;
      const d = this.genDraft(cx, cy);
      const role = roles.findIndex((fits, i) => !picked[i] && fits(d));
      if (role < 0 || used.has(`${cx},${cy}`)) continue;
      picked[role] = d;
      used.add(`${cx},${cy}`);
    }
    const drafts = picked.map((d, i) => this.rows(d ?? this.genDraft(...old[i])));
    this.trialDrafts = { files: this.files, drafts };
    return drafts;
  }

  /** The Council generates a whole new universe from a theme. Constants (carpet, movement, physics, needs, runes) stay. */
  async runGenesis(theme: string, onProgress?: (step: string) => void, game?: Partial<Partita>): Promise<boolean> {
    this.generationHeld = true;
    const backup = { ...this.repo.working };
    const keptGame = this.game;
    try {
      // The game is chosen once, for a universe that was never generated (ADR-0053).
      if (game && this.needsGenesis()) this.chooseGame(game);
      onProgress?.('Il Concilio si riunisce');
      const plan = await planGenesis(this.council, theme, this.repo.working, (id, def, palette) => this.validator.validateLayout(id, def, palette, this.sampleDrafts()));
      for (const [p, src] of Object.entries(plan.files)) this.repo.write(p, src);
      this.stampContent('genesis.layouts', 'cartografo', COMUNE);
      // Example content shipped on disk makes room for the generated world.
      for (const m of this.modules.values()) {
        if (m.manifest.origin !== 'esempio') continue;
        for (const p of Object.keys(this.repo.working)) if (p.startsWith(m.dir)) this.repo.write(p, null);
      }
      this.applyFiles({ ...this.repo.working });
      this.consumed.clear();
      this.savedContainers.clear();
      this.importanti.clear();
      this.repo.write('world/stato.json', null);
      for (const p of Object.keys(this.repo.working)) if (p.startsWith(PLAYERS_DIR)) this.repo.write(p, null);
      this.wanted.clear();
      onProgress?.('Il Narratore scrive gli oggetti comuni del mondo');
      if (!(await this.growContent('genesi', 30, true))) {
        // Without a pack the world would be empty: keep the example one.
        for (const [p, src] of Object.entries(backup)) if (p.startsWith('modules/items.base/')) this.repo.write(p, src);
        this.applyFiles({ ...this.repo.working });
      }
      this.packsUsed = 0;
      onProgress?.('Il Cartografo disegna la geografia del mondo');
      await this.drawGenesisAtlas();
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
      man.appearance = { glyph: '@', color: '#ffffff', aspetto: plan.playerPrompt };
      this.repo.write(path, JSON.stringify(man, null, 2) + '\n');
      this.applyFiles({ ...this.repo.working });
      this.clearChunks();
      const title = readBible(this.repo.working)?.titolo ?? 'nuovo universo';
      const c = this.commitContent(`genesi: ${title}`, 'genesis.cast', 'narratore', COMUNE);
      this.council.say('kernel', 'approva', `Genesi completata: «${title}», ${done} moduli, ${this.content.items.size} oggetti, ${Object.keys(this.content.layouts).length} ambienti, commit ${c.id}.`);
      this.bus.emit('genesis:done', { title });
      return true;
    } catch (e) {
      this.council.say('kernel', 'errore', `Genesi fallita: ${(e as Error).message}`);
      this.game = keptGame;
      this.repo.restore();
      this.applyFiles({ ...this.repo.working });
      return false;
    } finally {
      this.generationHeld = false;
    }
  }

  // --- Versioning ------------------------------------------------------------------------------

  /** Returns the player's inscribed runes to the hand and restores the last valid commit. */
  /** Containers opened in earlier sessions, by stable origin: they keep what was left in them. */
  private savedContainers = new Map<string, { inv: Inventory; filled: boolean }>();
  private lastState = '';

  /**
   * The state of play is part of the universe too (`world/stato.json`): what the wanderer carries,
   * what was taken from the world, what is left in chests. Saved only while the universe is valid.
   */
  saveState(): boolean {
    if (this.faults.size || this.generationHeld || this.mirror) return false;
    const containers: Record<string, { inv: Inventory; filled: boolean }> = Object.fromEntries(this.savedContainers);
    for (const id of this.ecs.query('container', 'origin')) {
      const c: Container = this.ecs.get(id, 'container');
      if (c.filled) containers[this.ecs.get(id, 'origin').key] = { inv: c.inv, filled: true };
    }
    const state = {
      consumati: [...this.consumed].slice(-5000),
      contenitori: containers,
      forme: this.formsToSave(),
      importanti: Object.fromEntries(this.importanti),
      ora: Math.round(this.time),
    };
    // Each wanderer in their own file (T34); the world's state no longer carries one.
    const players = Object.fromEntries([...this.wanderersById.values()].map((w) => [playerFile(w.id), this.as(w.id, () => this.wandererState(w))]));
    const json = JSON.stringify([state, players]);
    if (json === this.lastState) return false;
    this.lastState = json;
    const written: FileMap = {};
    for (const [p, v] of Object.entries({ 'world/stato.json': state, ...players })) {
      this.repo.write(p, JSON.stringify(v, null, 1) + '\n');
      written[p] = this.repo.working[p]!;
    }
    this.files = { ...this.files, ...written };
    this.repo.commit('salvataggio della partita', 'player');
    return true;
  }

  /** What is saved of the wanderer acting now. */
  private wandererState(w: Wanderer): WandererState {
    return {
      ...(w.nome !== WANDERER_NAME ? { nome: w.nome } : {}),
      inventory: this.inventory(),
      needs: this.needs() as unknown as Record<string, number>,
      hand: this.hand(),
      stati: this.states(),
      slots: this.slots(),
      ...(w.id === SOLO ? { trasceso: this.exitedOnce } : {}),
    };
  }

  /** Gives the wanderer acting now what was saved of them. */
  private applyWandererState(v: WandererState): void {
    if (v.inventory?.slots) this.ecs.set(this.playerId, 'inventory', v.inventory);
    if (v.needs) Object.assign(this.needs() ?? {}, v.needs);
    if (v.hand?.tokens) Object.assign(this.hand(), v.hand);
    if (v.stati) this.ecs.set(this.playerId, 'stati', Object.fromEntries(Object.entries(v.stati).filter(([, x]) => x && typeof x === 'object')));
    if (v.slots && typeof v.slots === 'object') this.ecs.set(this.playerId, 'slots', v.slots);
    // What the mechanics derive from the slots (defence, states) is rebuilt by their own on_slot.
    for (const p of this.uiPanels()) {
      const filled = Object.entries(this.slots()[p.panel.id] ?? {}).find(([, x]) => x);
      if (filled) this.slotChanged(p.module, p.panel.id, filled[0], filled[1]!.item);
    }
  }

  // --- The graph of the world (ADR-0045) -------------------------------------------------------

  /** The graph of the universe as it is now: built from the files and the places known, rebuilt when they change. */
  graph(): WorldGraph {
    const c = this.graphCache;
    if (c && c.files === this.files && c.places === this.graphPlacesVersion) return c.graph;
    const graph = buildGraph(this.files, [...this.graphPlaces.values()], (t) => this.speciesOf(t));
    this.graphCache = { files: this.files, places: this.graphPlacesVersion, graph };
    return graph;
  }

  /** Puts the graph in the working files when what it is made of changed (the commit carries it). */
  private writeGraph(): void {
    if (!this.repo) return;
    const files = this.repo.working;
    const places = [...this.graphPlaces.values()];
    if (readGraph(files)?.graph.hash === graphHash(files, mergePlaces(files, places))) return;
    this.repo.write(GRAPH_FILE, buildGraph(files, places, (t) => this.speciesOf(t)).toJson());
    this.files = { ...this.files, [GRAPH_FILE]: this.repo.working[GRAPH_FILE]! };
  }

  /** The places planned in earlier sessions that the graph does not have yet (from the universe's maps). */
  private async seedGraphPlaces(): Promise<void> {
    const maps = (await this.repo.backend?.listMaps?.().catch(() => [])) ?? [];
    if (!maps.length) return;
    const prefix = this.recordKey({ cx: 0, cy: 0, key: '' } as Chunk).replace(/[:,]/g, '_');
    const known = new Set(placesOf(readGraph(this.files)).map((p) => `${p.cx},${p.cy}`));
    for (const m of maps) {
      if (!m.file.startsWith(prefix)) continue;
      const [cx, cy] = m.file.slice(prefix.length).split('_').map(Number);
      const key = `${cx},${cy}`;
      if (!Number.isFinite(cx) || !Number.isFinite(cy) || known.has(key) || this.graphPlaces.has(key)) continue;
      this.graphPlaces.set(key, { cx, cy, nome: m.name, ambiente: m.layout || undefined });
      this.graphPlacesVersion++;
    }
  }

  /** Puts the usage ledger in the working files when it changed (the next commit carries it). */
  private writeUsage(): void {
    if (this.usage.version === this.usageWritten || !this.repo) return;
    this.usageWritten = this.usage.version;
    this.repo.write(USAGE_FILE, this.usage.toJson());
    this.files = { ...this.files, [USAGE_FILE]: this.repo.working[USAGE_FILE]! };
  }

  /** Puts the cards' ledger in the working files when it changed (T36). */
  private writeCards(): void {
    if (this.cards.version === this.cardsWritten || !this.repo) return;
    this.cardsWritten = this.cards.version;
    this.repo.write(CARDS_FILE, this.cards.toJson());
    this.files = { ...this.files, [CARDS_FILE]: this.repo.working[CARDS_FILE]! };
  }

  // --- The cards (T36) -----------------------------------------------------------------------

  /** Stamps the content the working files bring against the last commit (cards.ts, stampFiles). */
  private stampContent(task: string, autore: string, chi?: string): void {
    const changed = stampFiles(this.repo.working, this.repo.head().files, (id) => this.sign(id, task, autore, chi));
    if (!Object.keys(changed).length) return;
    for (const [p, src] of Object.entries(changed)) this.repo.write(p, src);
    this.files = { ...this.files, ...changed };
  }

  /** A commit of generated content: what it brings becomes cards of whoever pays for the task. */
  private commitContent(message: string, task: string, autore: string, chi?: string): Commit {
    this.stampContent(task, autore, chi);
    return this.repo.commit(message, 'agent');
  }

  /** A place planned for the first time: its card, and one use of every card it holds (T36). */
  private cardPlace(ch: Chunk, plan: ChunkPlan): void {
    plan.carta ??= this.sign(placeCardId(ch.cx, ch.cy), 'chunk.plan', 'cartografo');
    this.cards.addPlace(`${ch.cx}_${ch.cy}`, plan.place.name, plan.carta);
    const ids = [`ambiente:${nodeSlug(plan.layout)}`];
    for (const o of plan.objects) ids.push(...this.thingCards(o.module));
    for (const n of plan.ground) {
      const d = this.content.byName(n);
      if (d) ids.push(...this.thingCards(d.id));
    }
    for (const s of plan.strutture ?? []) ids.push(`modello:${nodeSlug(`struttura-${ownModelId(s.concetto).slice(0, 30)}`)}`);
    this.cards.use(ids, 'luoghi', (id) => this.isCard(id));
  }

  /** The cards a thing in a place stands for: its module or item, and its model. */
  private thingCards(id: string): string[] {
    const m = this.modules.get(id)?.manifest;
    if (m) return [moduleCardId(m), ...(m.appearance?.model ? [`modello:${nodeSlug(m.appearance.model)}`] : [])];
    const d = this.content.get(id);
    return d ? [`oggetto:${nodeSlug(d.id)}`, ...(d.model ? [`modello:${nodeSlug(d.model)}`] : [])] : [];
  }

  /**
   * Who wrote and who pays for a piece of content made now by a task, and whose card it is: the payer, or for
   * what the world pays one of the wanderers, drawn with the seed. `chi` overrides the task's payer.
   */
  sign(cardId: string, task: string, autore: string, chi?: string): Carta {
    const pagante = chi ?? payerOf(task, this.wanderer().id);
    const all = [...new Set([...this.wanderers().map((w) => w.id), ...wanderersIn(this.files).map((w) => w.id)])];
    return { autore, pagante, titolare: titolareOf(cardId, pagante, all.length ? all : [SOLO], this.config?.seed ?? 0) };
  }

  /** Whether an id (of the graph's kind) is a card of this universe. */
  isCard(id: string): boolean {
    if (id.startsWith('luogo:')) return this.cards.hasPlace(id.slice(6));
    if (this.cardIdsOf?.files !== this.files) this.cardIdsOf = { files: this.files, ids: new Set(allCards(this.files).map((c) => c.id)) };
    return this.cardIdsOf.ids.has(id);
  }

  /** Every card of the universe, with its uses; with an id, that wanderer's collection. */
  cardsOf(wanderer?: string): Card[] {
    const files = { ...this.files, [CARDS_FILE]: this.cards.toJson() };
    return wanderer === undefined ? allCards(files) : collectionOf(files, wanderer);
  }

  /** On leaving: the spending of this session goes into the universe even if nothing else changed. */
  saveUsage(): boolean {
    if (this.mirror) return false;
    // Only valid states are committed: with a fault the ledger waits for the next valid commit.
    if ((this.usage.version === this.usageWritten && this.cards.version === this.cardsWritten) || this.faults.size) return false;
    this.repo.commit('consumi dei modelli', 'kernel');
    return true;
  }

  /** What was done to the models of things in the world, by origin. */
  private formsToSave(): Record<string, string[]> {
    return Object.fromEntries([...this.savedForms].filter(([, d]) => d.length));
  }

  /** Restores what was saved: the same wanderer, the same world, after a restart. */
  loadState(): void {
    let st: any;
    try {
      st = JSON.parse(this.files['world/stato.json'] ?? 'null');
    } catch {
      st = null;
    }
    // Each wanderer from their own file, `io` also from the wanderer of an older stato.json.
    for (const w of this.wanderersById.values()) {
      const v = readWandererState(this.files, w.id);
      if (!v) continue;
      if (v.nome && w.id !== SOLO) w.nome = String(v.nome).slice(0, 40);
      this.as(w.id, () => this.applyWandererState(v));
      if (w.id === SOLO && v.trasceso) this.exitedOnce = true;
    }
    if (!st) return;
    for (const k of st.consumati ?? []) this.consumed.add(String(k));
    for (const [k, c] of Object.entries(st.contenitori ?? {})) this.savedContainers.set(k, c as { inv: Inventory; filled: boolean });
    for (const [k, d] of Object.entries(st.forme ?? {})) if (Array.isArray(d)) this.savedForms.set(k, d.map(String));
    for (const [z, c] of Object.entries(st.importanti ?? {})) if (typeof c === 'string') this.importanti.set(z, c);
    if (Number.isFinite(st.ora)) this.time = st.ora;
    this.lastState = JSON.stringify(st);
  }

  /**
   * A player's rollback in a game of many (T37): the runes they wrote come back to their phrase, and with them
   * goes whatever those lines were doing; the repository, and everyone else's world, stay as they are.
   */
  private takeBackRunes(): void {
    const me = this.wanderer().id;
    const hand = this.hand();
    let n = 0;
    for (const { id, rune } of this.runeList()) {
      if (rune.source !== 'player' || rune.by !== me) continue;
      if (this.give(`rune:${rune.token}`, 1)) hand.tokens.push(rune.token);
      this.ecs.destroy(id);
      n++;
    }
    this.runesDirty = true;
    this.message(n ? 'Le rune che avevi inciso tornano a te.' : 'Non hai inciso niente da riprendere.', n ? 'good' : 'info');
  }

  /** Back to a commit of an earlier session: only the universe repository on disk has its files. */
  async rollbackPast(commitId: string): Promise<boolean> {
    const files = await this.repo.backend?.checkout(commitId).catch(() => null);
    if (!files) return false;
    for (const [p, v] of Object.entries(files)) this.repo.write(p, v);
    for (const p of Object.keys(this.repo.working)) if (!(p in files)) this.repo.write(p, null);
    this.applyFiles({ ...this.repo.working }, { reset: true });
    // The disk already has the commit ("ritorno a …"): here only the session snapshot.
    const backend = this.repo.backend;
    this.repo.backend = undefined;
    this.repo.commit(`ritorno a ${commitId}`, 'kernel');
    this.repo.backend = backend;
    this.message(`Il mondo torna a ${commitId}`, 'good');
    return true;
  }

  rollback(commitId?: string): void {
    // In a game of many the repository goes back only for the master (T37); a player takes back what they wrote.
    if (!this.isMaster()) return this.takeBackRunes();
    if (commitId && !this.repo.find(commitId)) {
      void this.rollbackPast(commitId);
      return;
    }
    const me = this.wanderer().id;
    for (const { id, rune } of this.runeList()) {
      if (rune.source !== 'player') continue;
      // Every rune goes back to whoever wrote it.
      this.as(rune.by ?? me, () => {
        if (this.give(`rune:${rune.token}`, 1)) this.hand().tokens.push(rune.token);
      });
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

  /**
   * Dev only: the kernel's seed changed on disk (Vite HMR). The universe takes the new versions of the
   * files it never changed itself (same merge as at boot); its own creations stay.
   */
  syncFromDisk(seed: FileMap): void {
    const up = upgradeFromSeed({ ...this.repo.working }, seed);
    if (!up.updated.length) return;
    for (const [p, v] of Object.entries(up.changes)) this.repo.write(p, v);
    this.applyFiles({ ...this.repo.working });
    const c = this.repo.commit(`aggiornamento dal kernel: ${up.updated.join(', ')}`, 'dev');
    this.log('dev', `seme aggiornato (${up.updated.length} file) → commit ${c.id}`);
  }

  feed(): FeedEntry[] {
    return this.council.feed;
  }

  // --- Tick ------------------------------------------------------------------------------------

  tick(dt: number): void {
    // Dead: the world waits for the choice (continue or start again).
    if (this.dead) return;
    if (this.mirror) return this.mirrorTick(dt);
    this.time += dt;
    for (const w of this.wanderersById.keys()) this.as(w, () => this.paceTick());
    this.tickCount++;
    this.luaCalls.clear();
    if (this.campusVersion !== this.forms.version) this.placeCampus();
    this.archive.tick(dt);
    // Who works in the Council's log sits at their console in the Direction (T46c); looked at once a second.
    if (this.tickCount % 60 === 0) this.archive.consoles(this.working());
    if (!this.corona.isInterior(this.playerPos().x)) this.lastWorld = { ...this.playerCarpet() };
    if (this.zone === 'corona') this.archive.meet(this.playerPos().x, this.playerPos().y);
    this.societyTick();
    if (this.repo.backend && this.tickCount % (60 * 120) === 0) this.saveState();
    // Transcended: nothing is lost any more (needs stay full, no death).
    if (this.exitedOnce) {
      const n = this.needs();
      if (n) Object.assign(n, { hunger: 100, thirst: 100, energy: 100, health: 100 });
    }
    if (this.tickCount % 10 === 0) {
      this.councilStock();
      for (const w of this.wanderersById.keys())
        this.as(w, () => {
          this.syncHand();
          this.statesTick();
          const n = this.needs();
          if (n && !Number.isFinite(n.mana)) n.mana = 60;
        });
    }
    this.updateChunks();
    this.pumpDevelopment();
    if (this.time - this.lastSculptPump > 2) {
      this.lastSculptPump = this.time;
      this.sculpting.pump();
    }
    this.rebuildSolids();
    for (const w of this.wanderersById.keys()) this.as(w, () => (this.playerComp().load = totalWeight(this.inventory(), this.itemSpec) / this.carryCapacity()));
    this.syncRunes();
    this.runRunes();
    // Each system measured (T27a): how long it takes, how many entities it touches.
    this.touching = new Set();
    for (const s of this.systems) {
      this.touching.clear();
      const t0 = performance.now();
      this.runningSystem = s.manifest.id;
      if (PER_WANDERER.has(s.manifest.id)) for (const w of this.wanderersById.keys()) !this.remote.has(w) && this.as(w, () => this.runModule(s.manifest.id, 'update', dt));
      else this.runModule(s.manifest.id, 'update', dt);
      this.runningSystem = undefined;
      this.meter.record(s.manifest.id, performance.now() - t0, this.touching.size);
    }
    this.touching = undefined;
    this.meter.endTick();
    this.syncRunes();
    this.sanitize();
    this.updateZone();
    for (const [id, b] of this.bubbles) if (b.until < this.time || !this.ecs.alive.has(id)) this.bubbles.delete(id);
  }

  /**
   * A thin client's tick (T39): its wanderer walks and the carpet carries them, as in a game alone, against the
   * things the server sent; the rest of the world moves on the server and arrives with its updates.
   */
  private mirrorTick(dt: number): void {
    this.time += dt;
    this.tickCount++;
    this.luaCalls.clear();
    this.paceTick();
    if (this.campusVersion !== this.forms.version) this.placeCampus();
    this.rebuildSolids();
    for (const s of this.systems) {
      if (!PER_WANDERER.has(s.manifest.id)) continue;
      this.runningSystem = s.manifest.id;
      this.runModule(s.manifest.id, 'update', dt);
      this.runningSystem = undefined;
    }
    this.sanitize();
    this.updateZone();
    for (const [id, b] of this.bubbles) if (b.until < this.time || !this.ecs.alive.has(id)) this.bubbles.delete(id);
  }

  /**
   * The floor, for the wanderer acting: states switched off by Lua are removed, and the pace they give is a plain
   * number on the player (Lua must not iterate tables that live on the JS side: wasmoon cannot).
   */
  private paceTick(): void {
    const stati = this.ecs.get(this.playerId, 'stati');
    let passo = 1;
    if (stati)
      for (const k of Object.keys(stati)) {
        if (!stati[k] || typeof stati[k] !== 'object') delete stati[k];
        else passo *= Number(stati[k].velocita) || 1;
      }
    const pl = this.ecs.get(this.playerId, 'player');
    if (pl) pl.passo = Math.max(0.2, Math.min(4, passo));
  }

  private rebuildSolids(): void {
    this.solidCells.clear();
    this.solidForms.clear();
    for (const id of this.ecs.query('body', 'pos')) {
      if (id === this.playerId) continue;
      const b = this.ecs.get(id, 'body');
      if (!b.solid) continue;
      const p = this.ecs.get(id, 'pos');
      const fc: FormComp | undefined = this.ecs.get(id, 'form');
      const f = fc && this.forms.ready(fc.model, fc.seed, fc.tint);
      if (!fc || !f?.foot) {
        this.solidCells.add(`${Math.floor(p.x)},${Math.floor(p.y)}`);
        continue;
      }
      // A thing with a model blocks with its voxels: it is listed in every cell its footprint may reach.
      const s = { id, x: p.x, y: p.y, yaw: fc.yaw, form: f, foot: this.footOf(id, fc, f) };
      for (let cy = Math.floor(p.y - f.reach); cy <= Math.floor(p.y + f.reach); cy++)
        for (let cx = Math.floor(p.x - f.reach); cx <= Math.floor(p.x + f.reach); cx++) {
          const key = `${cx},${cy}`;
          (this.solidForms.get(key) ?? this.solidForms.set(key, []).get(key)!).push(s);
        }
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
      if (d > max && !this.corona.isInterior(p.x)) {
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
    const zone = this.corona.isInterior(p.x) ? 'studio' : Math.hypot(p.x, p.y) >= this.config.circleRadius ? 'corona' : 'sim';
    if (zone === 'sim') this.offCarpet.delete(this.playerId);
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

/** What the Studio of characters says of an individual (T23), in the order a visitor reads it. */
function personFacts(p: Person, type: string): Array<[string, string]> {
  const out: Array<[string, string]> = [['Individuo', p.nome]];
  const who = [p.specie === 'animale' ? 'animale' : 'persona', p.genere, p.eta].filter(Boolean).join(', ');
  out.push(['Chi è', `${type} (${who})`], ['Mestiere', p.mestiere]);
  if (p.aspetto) out.push(['Aspetto', p.aspetto]);
  if (p.persona) out.push(['Carattere', p.persona]);
  if (p.storia) out.push(['Storia', p.storia]);
  if (p.famiglia?.length) out.push(['Famiglia', p.famiglia.map((r) => `${r.legame} di ${r.nome}`).join(', ')]);
  for (const r of p.famiglia ?? []) if (wandererOf(r)) out.push([wandererOf(r) === SOLO && r.nome === WANDERER_NAME ? 'Per il viandante' : `Per ${r.nome}`, r.legame]);
  if (p.routine?.length) out.push(['Giornata', p.routine.map((r) => `${r.quando}: ${r.fa}`).join('; ')]);
  if (p.luogo) out.push(['Incontrato a', p.luogo]);
  if (p.porta?.length) out.push(['Porta con sé', p.porta.join(', ')]);
  if (p.ricordi?.length) out.push(['Ricorda', p.ricordi.slice(-3).map((m) => m.testo).join(' · ')]);
  return out;
}
