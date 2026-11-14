// The kernel: the floor of the universe. Owns the ECS state, the chunks, the sandbox, versioning,
// the assets, the content registry and the Council of agents. Everything above this floor is
// generated (by the Council) or written in Lua, and can break; the floor cannot.

import { World, type Id } from './ecs';
import { EventBus } from './events';
import { Faults } from './faults';
import { Sandbox, type Host } from './sandbox';
import { apiErrors, describeEffect, repairGameSetup, validateEffects, Validator } from './validator';
import { deathLevel, deathRule, fallbackDeath, type DeathVerdict } from './gameSetup';
import { Repo, memoryStore, type Commit, type KeyValueStore } from './repo';
import { councilMayWrite } from './paths';
import { Corona, campusModel, coronaNearby, coronaShown, tileNear, FOCUSED_RULES, folderOf, TABLETS_MAX, type CoronaTile, type Exhibit, type ShowcaseSource, type StudioItem } from './corona';
import { Archive } from './archive';
import { bibleBreaks, cleanBible, metaBreak } from './fourthwall';
import { biblePages, touchingNodes, type BibleShown } from './bible';
import { latheExecute, latheModels, type LatheModelEntry, type LatheShown } from './lathe';
import type { Rule } from './types';
import { ATLAS_FILE, defaultAtlas, direction, directionsFrom, directionWord, placeRegion, readAtlas, regionAt, writeAtlas, type Region } from './atlas';
import { STAMP_SHAPES } from './stamps';
import { repairProgram } from './mj';
import { upgradeFromSeed, type PastCommit, type UniverseBackend } from './universes';
import { dayPhase, plotText, PLOTS_FILE, readPeople, readPlots, VENTURES_FILE, writePlots, type Individual, type JobProgram, type Mind, type Plot, type Species, type Venture } from './npc/model';
import { Npc, type NpcHost } from './npc';
import { buildGraph, GRAPH_FILE, graphHash, mergeChunks, chunksOf, readGraph, slug as nodeSlug, type GraphChunk, type WorldGraph } from './graph';
import { situation as buildSituation, type PlayerSpot, type Situation } from './situation';
import { ChainMeter, chainOf, type Chain } from './chain';
import { alertOf, clampFrame, costBoard, liveFeed, SCREEN_NAME, timeline, type Budget, type ScreenField, type Screens } from './screens';
import { Input } from './input';
import { discoverModules, readConfig, repairAiSettings } from './universe';
import { askedRunes, carpetLine, CARPET_TOKENS, tileIndex, COUNCIL_RUNE, extractLines, tokenize, type RuneComp, type RuneLine } from './runes';
import { hash32, hashStr, hex, Rng } from './rng';
import { knobOfTask, onBeat, Rationing, rationedKnob, repairActor, repairCoefficients, type ActorConfig, type Coefficients } from './coefficients';
import { BudgetError, type AiModels } from './ai/models';
import type { DecisionModels } from './ai/decisions';
import { billedModel, costOf } from './ai/prices';
import { tokensOf, USAGE_FILE, UsageLog, type CallRecord } from './ai/usage';
import { SHORTFALLS_FILE, ShortfallLog, type ShortfallNote } from './shortfalls';
import { addBudgetFromCap, costWithFee, DEFAULT_GRANT_CAP, DEFAULT_PLATFORM_FEE, MemoryLedger, splitCost, type Ledger, type PaymentRecord } from './credits';
import { MemoryChunks, SealedChunks, type ChunkStore } from './chunks';
import { anyVisible, BODY_R, bodyFoot, bodyGround, Forms, holesOf, InlineRunner, instanceGrid, JUMP_FAR, JUMP_UP, levelAt, rampBlocks, stepOf, toLocal, topUnder, type Form, type FormComp, type FormRunner, type Ground } from './forms';
import { classOf, guessClass, RARE_SIZES, sizeOf, sizeRank, SIZE_TIERS, tilesOf, type SizeTier } from '../mj/classes';
import { stageGrid } from '../mj/mesh';
import { commonHouseModel, GENERIC, ModelDirector, ownModelId, structureModel } from './modeldirector';
import { ScoreDirector } from './scoredirector';
import { categoryOf, DEFAULT_SCULPTORS, sculptAction, shareableProgram, type SculptorAiModels } from './agents/sculptor';
import { entryBox, MODELS_INDEX, type ModelInfo } from './forms';
import { Content, isCategory, normName, specOf } from './content';
import { layout, type Lot, type LayoutResult, articulationPoints } from './layout';
import { AGENTS, Council, readBible, wordsOf, type AgentId, type CatalogEntry, type FeedEntry } from './agents/council';
import { designEnvironment, drawAtlas, planChunk, readStructure, type ChunkPlan, type PlannedHouse, type WaterRecord, type Where } from './agents/cartography';
import { WaterFlow, WET, type WaterChange } from './water';
import { forge, ForgeRejected, judgeCombination, repairLogic, slug, type ForgeKind, type ForgeOrigin } from './agents/forge';
import { agentReply, examine, narrate, NARRATOR_PLAYS, liaisonReply, type Interpreter, type NpcReply, type Turn } from './agents/minds';
import { planGenesis, type GenesisBrought } from './agents/genesis';
import { broughtModels, CAST_CLASSES, sameName, withCardChoice, type BringAnswer, type BringRef, type KinView } from './bring';
import { breakReason, brokenFault, broughtCardsOf, cardFamily, CARD_ID_RE, reasonText, withoutCards, type BreakKind, type BrokenCard, type BroughtCardView, type RemoveCardAnswer } from './brokencards';
import { COMPOSE_TASK } from './agents/composer';
import { soundPrograms, SOUND_CLASS } from '../mj/sound';
import { councilSession, inventRune, judgeAction, judgeCraft, judgeDeath, nameSpell } from './agents/effects';
import { canonWithRune, MAX_MAGIC_RUNES, validateNewRune } from './magic';
import { cleanPanel, designMechanic } from './agents/mechanics';
import { BENCH, cleanCases, runCase, textKey, type BenchEntry, type BenchRun, type BenchScene, type BenchShown } from './bench';
import { assemblePack, defineItems, itemPack, toItemDef, type Identity } from './agents/content';
import { addItem, CARRY_CAPACITY, countItem, HOTBAR, emptied, equippedItem, isWorn, moveSlot, newInventory, putSlot, readInventory, removeItem, takeFromSlot, takeOff, thingOf, totalWeight, type Inventory } from './inventory';
import { keepWornMarks, wornItems, wornZoneOf, ZONE_WORDS, type WornZone } from './wearing';
import { isWornZone, wornSections } from '../mj/worn';
import { facingYaw, isThing, MAX_MOVED, PUT_DOWN, putRefusal, readMoved, readParts, splitBetween, takeRefusal, thingItem, thingModule, walkGroups, type MovedRecord, type PutFailure, type TakeFailure, type ThingParts, type TileArea, type Walk } from './moving';
import { chunkLevels, HILLS, LEVEL, Relief, RELIEF_PATH, worldLevels } from './relief';
import { CardUses, CARDS_FILE, COMUNE, allCards, collectionOf, moduleCardId, receivedBy, type Received, payerOf, chunkCardId, stampFiles, cardHolderOf, type Card, type CardStamp } from './cards';
import { playerFile, PLAYERS_DIR, readWandererState, repairProfile, SOLO, validWandererId, WANDERER_NAME, wandererColor, wandererOf, wanderersIn, type Profile, type ProfileRepair, type Wanderer, type WandererState, PER_WANDERER } from './wanderers';
import type { ActionDef, AiSettings, BenchCase, Effect, FileMap, Spell, UiPanel, ItemDef, ItemSpec, Manifest, ModuleEntry, GameSetup, GameExpenses, ChunkInfo, Recipe, RuneFragment, TerrainDef, UniverseConfig } from './types';
import { checkKernelVersion, KERNEL_VERSION, stampKernel } from './version';
import { migratePlanRecord, migrateUniverse } from './migrations';
import { internalComponent, internalEvent, internalFields, internalName, internalSculptors, italianName, italianValues as italianFieldsOf } from './internalNames';
import { ModuleStores } from './store';
import { blockShape, cellsOf, discCells, findSpot, itemShape, turnsBetween, type ItemShape, type PlacedRecord, type SpotFailure, type Support } from './placing';

/** A solid entity with a model, as collision sees it: where it is, its form, where it blocks and its floors. */
interface SolidForm extends Ground {
  id: Id;
  x: number;
  y: number;
  yaw: number;
  form: Form;
  foot: Uint8Array;
}

/** A jump under way (T56b), on the wanderer: from and to in carpet space, the floors there, how high it goes, its clock. */
export interface JumpComp {
  from: { x: number; y: number };
  to: { x: number; y: number };
  h0: number;
  h1: number;
  peak: number;
  t: number;
  dur: number;
}

/** How high a jump clears (tiles above where it starts) and how far it can land (tiles). */
export { JUMP_UP, JUMP_FAR, BODY_R };
/** The water (T51b): steps of the automaton every so many ticks (100 steps a second at 60 Hz); a dig moves at most so many levels. */
const WATER_EVERY = 6;
const WATER_STEPS = 10;
const MAX_DIG = 8;
/** What the fault `universe:kernel` says first (T312): the panel of the faults, which shows the head of a reason, says the world is read-only. */
export const READ_ONLY_WORDS = 'sola lettura: niente si salva, il Concilio usa i modelli locali';

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
  /** Bumped when its levels change and its tiles do not (T51a: water found beyond it); renderer cache key too. */
  levels?: number;
  stage: 'draft' | 'planned';
  place?: ChunkInfo;
  plan?: ChunkPlan;
  lots: Lot[];
  developing?: boolean;
  /** The wanderer who first wanted it (T40): a place new to the universe is planned at their expense. */
  chi?: string;
  /** Known to have no saved plan, and waiting for the universe's quota of new places (T40). */
  held?: boolean;
  /** In a thin client (T51b): the ground dug and the water that has flowed, as the server's plan has them. */
  digs?: Record<string, number>;
  water?: Record<string, WaterRecord>;
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
  | { kind: 'code'; cell: CoronaTile; folder?: string }
  | { kind: 'studio'; item: StudioItem; building: string; recent?: string }
  | { kind: 'door'; building: string; teams: string[] }
  | { kind: 'agent'; agent: AgentId; name: string; doing?: string }
  | { kind: 'player' };

export interface PlinthSculpture {
  model: string;
  seed: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  scale: number;
  arrivalTick: number;
}

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

/** The mind of a character (`npc/model.ts`), said here too for who reads it from the kernel. */
export type { Mind };

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

/** Where a plan puts its runes and entities (cells of the chunk; runes in world columns and rows). */
interface Placements {
  runes: Array<{ token: string; line: number; col: number; row: number; origin: string }>;
  objects: Array<{ index: number; cell?: number }>;
  ground: Array<{ index: number; item?: string; cell?: number }>;
  loot: Array<{ index: number; item: string; count: number; cell?: number }>;
  pick: (where: Where, solid?: boolean) => number | undefined;
}

/** A lot of a planned place and the structure that stands on it (ADR-0043). */
interface ChunkLot {
  index: number;
  origin: string;
  x: number;
  y: number;
  form: FormComp;
  structure: { concept: string; class: string; size?: SizeTier; model?: string; stage?: number };
}

/** A planned place in miniature (T26): positions in tiles from the place's top-left corner, levels in `LEVEL`s. */
export interface ChunkMiniature {
  cx: number;
  cy: number;
  size: number;
  tiles: string;
  levels: number[];
  /** The structures in the middle of their lots (w × h tiles). */
  structures: Array<{ x: number; y: number; w: number; h: number; model: string; seed: number; yaw: number; done?: string[] }>;
  entities: Array<{ x: number; y: number; model: string; seed: number; yaw: number; tint?: string; color?: string }>;
  /** Each rune with the line (of the plan) it belongs to. */
  runes: Array<{ x: number; y: number; token: string; line: number; color?: string }>;
  /**
   * The Cartographer's work in phases (`PLACE_PHASES`), each the place as it is then: its tiles, their levels, the cells
   * that phase adds (`lit`). The last is the place as above; structures from the fifth on, entities and runes in the sixth.
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
  { name: 'cose e rune', what: 'Gli individui, le cose e le rune, ciascuna su una casella che si raggiunge.' },
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
  mini: ChunkMiniature;
  error?: string;
}

export type { Rule };

export interface RuleShown {
  rule: Rule;
  index: number;
  count: number;
  marked: boolean;
}

export type { LatheModelEntry, LatheShown };

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
  /** Balances and payments (ADR-0104): on the server the archive outside the universe; otherwise in memory. */
  ledger?: Ledger;
  /** Dollars a day the master may give by hand (ADR-0104). */
  grantCap?: number;
  /** The platform fee on every call charged (ADR-0132): only the server says it, never the universe, Lua or the Council. */
  platformFee?: number;
  store: KeyValueStore;
  ai: AiModels;
  /** Who takes the closed decisions (ADR-0157): Jev through its gate; without, the local models answer with today's rule. */
  decisions?: DecisionModels;
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
   * judged here, no system runs but those that walk this client's wanderer: places and entities are put in by the client.
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

const VOID_TILE: TerrainDef = { name: 'vuoto', color: '#2a0612', solid: false, layer: 'ground' };
const DEFAULT_ITEM: ItemSpec = { stackable: false, maxStack: 1, weight: 1, equippable: false };
const FALLBACK_PLAYER = {
  player: { speed: 6, facing: 'down', load: 0 },
  hand: { tokens: [] as string[], sel: 0 },
  needs: { hunger: 85, thirst: 85, energy: 90, health: 100, mana: 60 },
};
const STARTER_RUNES = ['x', 'speed = speed', 'lux'];
/** Chunks from the origin (in carpet space) before runes that touch the carpet can appear. */
const CARPET_RUNE_DISTANCE = 3;
/**
 * Side, in chunks, of a zone of the world that has at most one Huge structure (ADR-0043, 0092): 56 chunks
 * of 18 tiles, about 1000 × 1000 tiles (a million). Walking straight (6 tiles/s) one crosses a zone in
 * about three minutes; exploring, much more. Zones are centred on the start.
 */
export const IMPORTANT_ZONE = 56;
export const zoneOf = (cx: number, cy: number) => `${Math.floor((cx + IMPORTANT_ZONE / 2) / IMPORTANT_ZONE)},${Math.floor((cy + IMPORTANT_ZONE / 2) / IMPORTANT_ZONE)}`;
/**
 * Side, in zones, of a realm (ADR-0092): 4 × 4 zones, 224 × 224 chunks (about 4000 tiles a side), with at most one
 * Gargantuan structure. Not a region of the atlas (3-4 places).
 */
export const REALM = 4;
export const realmOf = (cx: number, cy: number) => {
  const [zx, zy] = zoneOf(cx, cy).split(',').map(Number);
  return `${Math.floor((zx + REALM / 2) / REALM)},${Math.floor((zy + REALM / 2) / REALM)}`;
};
/** The area of the world where a rare size is unique (ADR-0092): Huge per zone, Gargantuan per realm. */
export const rareAreaOf = (t: SizeTier, cx: number, cy: number) => (t === 'gargantuan' ? realmOf(cx, cy) : zoneOf(cx, cy));

const clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

export { PER_WANDERER };
/** Between wanderers (T43a): how far words are heard, how near one gives something, how long words are. */
export const HEAR = 8;
export const GIVE_REACH = 3;
export const SAY_MAX = 140;
/** Putting things down on furniture (T291): how far from where one stands, how high above and below one's feet (tiles). */
export const PLACE_REACH = 2;
export const PLACE_UP = 1.5;
export const PLACE_DOWN = 1;
/** The things lying on furniture that a save keeps, the most recent ones. */
export const MAX_PLACED = 4000;
/**
 * What goes indoors (T281): the points of a structure's floor are the middles of windows this many voxels each way of
 * ground floor (a body of 0.3 tiles at 20 voxels a tile), and a thing put there needs a box this large (tiles) that
 * `Kernel.free` finds free of what already stands there.
 */
export const INDOOR_REACH = 6;
export const INDOOR_R = 0.15;
/** How far above its height (tiles) a thing lying on furniture still finds its shelf: the rounding of a save, far less than a voxel. */
const REST_SLACK = 0.01;
/** The option of a tile's menu that puts down what is carried (T292): in `moving.ts`, so that the server reads it without the kernel. */
export { PUT_DOWN };
/**
 * Taking things of the world and putting them down elsewhere (T292): how far from the middle of a thing one takes it, how far the
 * tile it goes down on may be, how far ahead of the wanderer «in front» is (a little more than a tile: what goes down there does
 * not go into them), the half-side of the area around it whose ways it must not cut (tiles), the body those ways are for (a
 * villager's, as `world.path` measures them).
 */
export const TAKE_REACH = 2.6;
export const PUT_REACH = 2.6;
const PUT_AHEAD = 1.2;
export const MOVE_AREA = 10;
const MOVE_BODY = 0.35;

/** Why something does not go on a piece of furniture, as the world says it (T291): no word of the game in it. */
export function placeRefusal(why: SpotFailure, name: string, what: string): string {
  switch (why) {
    case 'high':
      return `Non arrivi al piano di ${name}.`;
    case 'far':
      return `Avvicinati a ${name} per posarci ${what}.`;
    case 'full':
      return `Su ${name} non c'è più posto per ${what}.`;
    case 'taken':
      return `Sopra ${name} c'è già qualcuno.`;
    default:
      return `${name} non ha un piano dove stia ${what}.`;
  }
}

/** The effects the kernel applies itself (T260): the relief, and the social ones of a judgement. */
/**
 * The fields of world/state.json and of a wanderer's file that this kernel reads and writes, those of before it migrates included (T245a):
 * any other field is a kernel of tomorrow's, and the save keeps it as it was. Credits are not data of the universe (ADR-0104): never kept.
 */
// Also known, so never kept as a field of tomorrow: the names they had until the contract 0.3 (T308a), and the balance of before the
// ledger (`crediti`, ADR-0104).
const STATE_FIELDS: ReadonlySet<string> = new Set(['consumed', 'containers', 'forms', 'rares', 'time', 'important', 'wanderer', 'placed', 'moved', ...italianFieldsOf('campi-stato')]);
const WANDERER_FIELDS: ReadonlySet<string> = new Set(['name', 'profile', 'pos', 'inventory', 'needs', 'hand', 'states', 'slots', 'transcended', 'anonymous', 'credits', ...italianFieldsOf('campi-viandante')]);

/** The fields of a saved JSON object that are not in `known`. */
function unknownFields(src: string | undefined, known: ReadonlySet<string>): Record<string, unknown> {
  if (!src) return {};
  try {
    const v = JSON.parse(src);
    if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
    return Object.fromEntries(Object.entries(v).filter(([k]) => !known.has(k) && k !== '__proto__'));
  } catch {
    return {};
  }
}

/** A field a panel reads (T263): `componente.campo`, plain names. */
const PANEL_FIELD_RE = /^[A-Za-z_][A-Za-z0-9_]{0,40}\.[A-Za-z_][A-Za-z0-9_]{0,40}$/;
/** Components of the wanderer that the kernel keeps itself: a panel's field from the server never writes them on a mirror. */
const KERNEL_COMPONENTS = new Set(['pos', 'player', 'carpet', 'hand', 'inventory', 'slots', 'needs', 'states', 'module', 'chunk', 'container', 'remote', 'body', 'form']);
/** What a client may say it holds (T263): the four directions, in the world's terms. */
const HELD_ACTIONS = new Set(['up', 'down', 'left', 'right']);

const KERNEL_EFFECTS = new Set(['relief', 'bond', 'memory', 'birth']);
/**
 * The effects a core.effects without `handles` is trusted with (T260): none since the contract 0.2 (T307a), whose effects have English
 * names that only a core.effects with `handles` knows; one of 0.1 applied the Italian ones, and would miss them all.
 */
const CORE_EFFECTS_WITHOUT_HANDLES = new Set<string>();

/** A plot that still does not hold after the Narrator's second answer. */

export class Kernel {
  readonly ecs = new World();
  readonly bus = new EventBus();
  readonly faults = new Faults();
  readonly input = new Input();
  readonly content = new Content();
  readonly ai: AiModels;
  /** What the models cost, per day, model and task (world/usage.json). */
  readonly usage = new UsageLog();
  private usageWritten = -1;
  /** What the Council could not do (T238): world/shortfalls.json, written before every commit; it survives rollbacks. */
  readonly shortfalls = new ShortfallLog();
  /** A kernel on the master's branch keeps nothing of its own: what it could not do goes to the world's. */
  private onShortfall?: (n: ShortfallNote) => void;
  /** The cards' uses and the places' cards (T36): world/cards.json, written before every commit. */
  readonly cards = new CardUses();
  private cardsWritten = -1;
  private cardIdsOf?: { files: FileMap; ids: Set<string> };
  /** The places the graph of the world knows (ADR-0045): planned chunks, by key. */
  private graphChunks = new Map<string, GraphChunk>();
  private graphCache?: { files: FileMap; places: number; graph: WorldGraph };
  private graphChunksVersion = 0;
  readonly chunkStore: ChunkStore;
  /** The models of entities (ADR-0041): the library of programs and the forms they make. */
  readonly forms: Forms;
  /** The Sculptor at work on the models the world lacks. */
  readonly sculpting = new ModelDirector(this);
  /** The Musician at work on the music the world lacks. */
  readonly composing = new ScoreDirector(this);
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
  palette: Record<string, TerrainDef> = {};
  fragments: RuneFragment[] = [];

  readonly chunks = new Map<string, Chunk>();
  readonly lines = new Map<string, LineState>();
  runeTiles = new Map<string, Id>();
  /** Speech bubbles shown above entities. */
  readonly bubbles = new Map<Id, { text: string; until: number }>();
  /** Items people talked about: they turn up more often, where coherent. */
  readonly wanted = new Set<string>();
  /** Entity cells blocked by solid bodies, rebuilt every tick. */
  private solidTiles = new Set<string>();
  /** Solid entities with a model, by the cells their footprint reaches (they block by their voxels). */
  private reliefCache?: { key: string; relief: Relief };
  /** The level of every tile, per chunk (flat water, flat lots), while its tiles, lots and the world's levels stay the same. */
  private levelCache = new WeakMap<Chunk, { tiles: string; lots: Lot[]; field: Int16Array; levels: Int16Array }>();
  /** The levels of the loaded world before the lots (T51a), while its places, their tiles, the relief and the sea stay the same. */
  private worldField?: { relief: Relief; sea: number; ground: number; tiles: Map<Chunk, string>; levels: Map<Chunk, Int16Array> };
  /** Bumped when the ground is dug or the water flows (T51b): the world's levels are made again. */
  private groundVersion = 0;
  /** The water that flows (T51b, ADR-0094): the kernel's cellular automaton on the loaded places. */
  readonly water = new WaterFlow({
    loaded: (c, r) => this.chunkAt(c, r)?.stage === 'planned',
    wet: (c, r) => this.palette[this.tileAt(c, r) ?? '']?.layer === 'liquid',
    surface: (c, r) => this.fieldAt(c, r),
    ground: (c, r) => Math.max(this.seaLevel, this.relief.level(c, r) + this.digAt(c, r)),
    record: (c, r) => this.waterAt(c, r),
    sea: () => this.seaLevel,
  });
  private solidForms = new Map<string, Array<SolidForm>>();
  /** The solid entities whose model has a cellar (T52b): where the terrain has a hole. */
  private cellars: SolidForm[] = [];
  /** Footprints of instances whose model was changed by an action (the door is open). */
  private instanceFeet = new Map<Id, Ground & { key: string; foot: Uint8Array }>();
  /**
   * The brought cards that do not work in this world (T296, ADR-0172), by id: isolated (`Forms.isolate`), shown to the master until they are
   * taken away or their program changes. Not saved: a world that opens finds them again as it runs them; a mirror takes the world's too.
   */
  private broken = new Map<string, BrokenCard>();
  /** What was done to models of entities, by stable origin (saved with the game). */
  private savedForms = new Map<string, string[]>();
  /** Zones of the world that already have their important structure: zone → the chunk that has it (saved with the game). */
  /** The places that have the rare structures (ADR-0092): size → area (zone, realm) → chunk key. */
  private rari = new Map<SizeTier, Map<string, string>>(RARE_SIZES.map((t) => [t, new Map()]));
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
  /** How far beyond the circle (tiles) the world stays loaded as it is inside: a second's walk, for who comes back (T226). */
  static WORLD_BEYOND_EDGE = 6;
  /** New places a universe of many plans per minute of the world, at most (T40; `ai.placesPerMinute`). */
  static PLACES_PER_MINUTE = 20;
  /** When (world time) the last new places were planned: the quota of a universe of many. */
  private chunksMade: number[] = [];
  private genBudget = 64;
  private tickCount = 0;
  /** Ticks since this kernel started (the clock of a session, T38). */
  get ticks(): number {
    return this.tickCount;
  }
  /** Calls into Lua with the same key in this tick: each gets its own draws (T35). */
  private luaCalls = new Map<number, number>();

  /** The entity of the wanderer acting now (the one the input moves, or another one inside `as`). */
  wandererEntity: Id = 0;
  /** The wanderers of this kernel by id (T34): `io` is the one of a game alone; others join with `addWanderer`. */
  /** Balances and payments, outside the files and their history (ADR-0104). */
  readonly ledger: Ledger;
  private readonly grantCap: number;
  private fee: number;
  private wanderersById = new Map<string, Wanderer & { entity: Id; tappeto?: { ox: number; oy: number }; profilo?: Profile; anonimo?: boolean }>();
  /** Spending ceiling for this session per wanderer (T45d: lobby). */
  private sessionCap = new Map<string, number>();
  /** How deep in `as` this moment is: someone is acting (V-022). */
  private acting = 0;
  /** What the whole world asks goes to the local models when none of those connected can pay (V-023): a public server's key is not free. */
  commonNeedsPayer = false;
  /**
   * Whether this universe is private, on invitation (ADR-0188 §2): where the master pays, an anonymous guest was invited and the master
   * answers for them, so they play with the models too. The server says it by value (the private universe is T366); false, as everywhere today.
   */
  privateWorld = false;
  /** The highest ceiling each wanderer brought: entering again does not add the same budget twice. */
  private capBudgeted = new Map<string, number>();
  /** Credits spent in this session per wanderer (T45d). */
  private sessionSpent = new Map<string, number>();
  /** Every wanderer has a carpet of their own (T38): the carpet entity holds this one's offset, the others keep theirs in `tappeto`. */
  private carpetHolder = SOLO;
  /** The wanderers a session's client moves (T38): the kernel checks their steps and does not move them itself. */
  private remote = new Set<string>();
  /** The wanderer the keyboard of this kernel moves. */
  inputFor = SOLO;
  /** Connected wanderers query, set by the multiplayer server (T45a). */
  connectedWanderers?: () => string[];
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
  /** The Library's lectern (T47a): which page of the bible it shows. */
  private bibleIndex = 0;
  /** The Library's rules wall (T47b): which window of rules it shows. */
  private rulesOffset = 0;
  /** The Sculptor's lathe (T48a): which model of the library it shows. */
  private latheIndex = 0;
  private latheCache = new Map<string, LatheShown>();
  /** The model on the plinto in the piazza of the Galleria (T48b). */
  plinthSculpture?: PlinthSculpture;
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
  private miniatures = new Map<string, { files: FileMap; mini?: ChunkMiniature }>();
  /** The environments of the sample room on their trial drafts (T26d), made once per state of the files. */
  private layoutSamples = new Map<string, { files: FileMap; sample?: LayoutSample }>();
  /** The drafts layout programs are tried on (`sampleDrafts`), per state of the files. */
  private trialDrafts?: { files: FileMap; drafts: string[][] };
  /** Grows when a miniature read from a saved plan is ready (the renderer's cache key). */
  miniatureVersion = 0;
  exitedOnce = false;
  /** The wanderer died: the session is over until they continue or start again. */
  dead = false;
  /** What death costs this time: the Narrator's verdict per wanderer, asked as soon as they die. */
  private deathVerdicts = new Map<string, Promise<DeathVerdict>>();
  /** The wanderers of a session whose death verdict is under way on the server (T43c). */
  private dying = new Map<string, Promise<void>>();
  /** The game chosen at the Genesis (ADR-0053): universe.json follows it, nothing else changes it. */
  private game?: GameSetup;
  /** Files the kernel or the master wrote and no commit has brought yet: `fenceCouncil` leaves them be. */
  private commanded = new Map<string, string>();
  /** Size of the visible area in cells, set by the renderer. */
  view = { w: 32, h: 20 };
  readonly logs: LogEntry[] = [];

  /** The scene of a kernel in miniature (T27), if this is one. */
  readonly bench?: { terreno?: string[] };
  readonly mirror: boolean;
  /**
   * In a multiplayer game, the master's mirror (T42b): the files of their branch that the world does not have yet, and the
   * gesture that publishes them. The editor and the console show it; alone there is none (every save is the world).
   */
  publisher?: { branch(): string[]; publish(): Promise<{ ok: boolean; reason?: string; text?: string }> };
  /**
   * In a multiplayer game, the master's mirror (T42c): the players connected as the server tells them, and the view that
   * follows one of them (their id; the camera goes above them, the master stays where they are). Alone there is none.
   */
  connected?: PlayerSpot[];
  watching?: string;
  /** Follows a player (or stops, without an id): the server sends the world around them. */
  follow?: (id?: string) => void;
  private wasmUri?: string;

  private constructor(opts: KernelOptions) {
    this.ai = opts.ai;
    this.bench = opts.bench;
    this.mirror = !!opts.mirror;
    this.ledger = opts.ledger ?? new MemoryLedger();
    this.grantCap = opts.grantCap ?? DEFAULT_GRANT_CAP;
    this.fee = opts.platformFee ?? DEFAULT_PLATFORM_FEE;
    this.wasmUri = opts.wasmUri;
    // Every plan read is ported to this contract (T307a): the plans of a universe of before stay on disk as they were until written again.
    const chunks = opts.chunks ?? new MemoryChunks();
    const ported: ChunkStore = { load: async (key) => { const rec = await chunks.load(key); return rec && migratePlanRecord(rec); }, save: (key, rec) => chunks.save(key, rec), clear: () => chunks.clear() };
    // A new plan of a read-only universe stays in this session (T312, ADR-0156).
    this.chunkStore = new SealedChunks(ported, () => this.readOnly() !== undefined);
    this.forms = new Forms(opts.forms ?? new InlineRunner());
  }

  static async boot(opts: KernelOptions): Promise<Kernel> {
    const k = new Kernel(opts);
    k.sandbox = await Sandbox.create(k.makeHost(), opts.wasmUri);
    k.validator = new Validator(k.sandbox);
    k.validator.modelTime = (id) => k.forms.info(id)?.time;
    k.validator.modelBox = (id) => k.forms.structureBox(id);
    k.validator.modelFile = (name) => k.forms.file(name);
    // A brought card that fails here is isolated (T296): a program that throws or stops its worker, a form with nothing to see.
    k.forms.onReady = (f) => k.formReady(f);
    k.forms.onFail = (f) => k.formFailed(f);
    k.council = new Council(opts.ai, () => ({ files: k.files, palette: k.palette, catalog: k.catalog(), graph: () => k.graph() }));
    k.council.onFeed = (e) => {
      k.archive.onFeed(e, (x) => k.pathForFeed(x));
      k.bus.emit('council', e);
    };
    const name = readConfig(opts.files).config.name;
    const { repo, synced } = Repo.open(name, opts.files, opts.store);
    k.repo = repo;
    if (opts.backend) repo.attach(opts.backend, opts.past ?? []);
    // The one place where a universe of an older contract is ported, if nobody did before (T302, ADR-0152; prepareUniverse, T307a).
    const ported = migrateUniverse(repo.working);
    if (ported.applied.length) {
      for (const p of new Set([...Object.keys(repo.working), ...Object.keys(ported.files)])) if (repo.working[p] !== ported.files[p]) repo.write(p, ported.files[p] ?? null);
      // Committed at once, by the kernel: left in the working files, the first commit of the Council would fence most of it back to HEAD.
      repo.commit(`migrazione ${ported.applied.map((a) => a.split(':')[0]).join(', ')}`, 'kernel');
      k.log('kernel', `universo portato a questo kernel: ${ported.applied.join('; ')}`);
    }
    k.bus.on('lua:death', (d: { hunger?: boolean; thirst?: boolean }) => k.mortalDies(d?.thirst ? 'sete' : d?.hunger ? 'fame' : 'ferite'));
    k.faults.onRaise = (f, isNew) => {
      if (isNew) k.log('fault', `${f.key}: ${f.message}`);
      // Where it happened (T46a): the code that runs in the world, where the wanderer was; not loading nor manifests.
      if (isNew && !f.at && k.zone === 'sim' && /^(module|rune):/.test(f.key) && !/:load$/.test(f.key)) f.at = { ...k.wandererCarpet() };
      k.bus.emit('fault', { fault: f, isNew });
      if (isNew && !k.bench && !k.mirror) void k.repairGenerated(f.key, f.message);
    };
    // The usage ledger: every call is counted; the file is written before every commit (it survives rollbacks).
    k.usage.load(repo.working[USAGE_FILE]);
    k.shortfalls.load(repo.working[SHORTFALLS_FILE]);
    k.ai.onCall = (r) => {
      k.usage.record(r);
      k.billCall(r);
    };
    // The closed decisions (ADR-0157): in the same ledger, and paid as every call.
    if (opts.decisions) {
      k.council.decisions = opts.decisions;
      opts.decisions.onCall = (r) => {
        k.usage.record(r);
        k.billCall(r);
      };
    }
    k.usage.onChange = () => k.bus.emit('usage', k.usage);
    // The cards (T36): who pays for every call (cards.ts), and how often every card goes into a prompt.
    k.cards.load(repo.working);
    k.council.payer = (task) => payerOf(task, k.payerNow());
    k.council.hasCredits = (chi) => k.hasCredits(chi);
    k.council.rationed = (task) => k.rationed(task);
    k.council.thinking = () => k.config.ai.thinking;
    k.council.readOnly = () => k.readOnly();
    k.council.onFocus = (ids) => k.cards.use(ids, 'prompt', (id) => k.isCard(id));
    // A mirror saves nothing of its own: its commits hold only the files it was told and the master's edits (T42b). The Council
    // is fenced in on a mirror too: a kernel on the master's branch is one (T42e).
    // The code written without a commit is not a valid state (T262): every commit takes it as HEAD has it.
    repo.withheld = () => k.unsaved;
    // A universe out of the range of the kernels is read-only (T312): nothing reaches its repository. A mirror's commits are its own bookkeeping.
    repo.readOnly = () => k.readOnly();
    repo.beforeCommit = (author) => {
      if (author === 'agent') k.fenceCouncil();
      k.commanded.clear();
      if (k.mirror) return;
      k.stampKernel();
      k.writeUsage();
      k.writeShortfalls();
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
    k.npc.reviewSociety();
    k.npc.reviewPlots();
    void k.seedGraphChunks();
    void k.reviewFourthWall();
    k.ai.limits = { text: k.config.ai.maxText };
    k.log('kernel', `universo «${name}» avviato su commit ${repo.head().id} (${repo.head().message}) — modelli: ${opts.ai.name}${synced ? ' — sincronizzato dal disco' : ''}`);
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
        if (this.runningSystem && PER_WANDERER.has(this.runningSystem)) ids = ids.filter((id) => id === this.wandererEntity || !this.ecs.has(id, 'player'));
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
        if (!this.ecs.alive.has(id) || ['pos', 'module', 'chunk', 'carpet', 'container'].includes(name) || (id === this.wandererEntity && ['player', 'hand', 'inventory', 'needs', 'slots'].includes(name))) return false;
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
        if (id === this.wandererEntity || [...this.singletons.values()].includes(id)) return;
        this.ecs.destroy(id);
        this.runesDirty = true;
      },
      first: (name) => this.ecs.query(name)[0],
      held: (a, id) => this.heldBy(typeof id === 'number' ? this.wandererOf(id) : this.wanderer().id, a),
      wanderers: () => this.wanderersInWorld(),
      path: (x, y, tx, ty, r) => this.npc.routeStep(x, y, tx, ty, r),
      find_tile: (code, x, y, r) => this.npc.findTile(code, x, y, r),
      act: (user, target, action) => this.npc.actAs(user, target, action),
      venture: (id) => (this.mirror ? undefined : this.npc.ventureStep(id)),
      venture_bring: (id, item) => (this.mirror ? 0 : this.npc.ventureBring(id, item)),
      // The lasting store (T245a, ADR-0138): the module running is the only one whose data a call sees. A rune, a mirror: nothing.
      store_get: (key) => (this.luaModule && !this.mirror ? this.stores.get(this.luaModule, key) : undefined),
      store_set: (key, value) => !!this.luaModule && !this.mirror && this.stores.set(this.luaModule, key, value),
      free: (x, y, r, z) => this.free(x, y, r, typeof z === 'number' ? z : undefined),
      free_real: (x, y, r, z) => this.freeReal(x, y, r, typeof z === 'number' ? z : undefined),
      tile: (x, y) => this.tileAt(Math.floor(x), Math.floor(y)) ?? '',
      speed_at: (x, y) => {
        const t = this.tileAt(Math.floor(x), Math.floor(y));
        return (t && this.palette[t]?.speed) || 1;
      },
      player_get: (key) => (key === 'x' || key === 'y' ? this.wandererPos()[key] : (this.wandererComp() as any)[key]),
      player_set: (key, v) => {
        if (typeof v !== 'number' || !Number.isFinite(v)) return `${key} deve essere un numero finito (ricevuto ${v === null ? 'nil' : typeof v})`;
        if (key === 'x' || key === 'y') this.wandererPos()[key] = v;
        else (this.wandererComp() as any)[key] = v;
        return undefined;
      },
      carpet: () => (this.lockedLine && this.carpet() ? clone(this.carpet()) : this.carpet()),
      time: () => this.time,
      log: (msg) => this.log('lua', msg),
      emit: (name, data) => this.bus.emit(`lua:${internalEvent(name)}`, data),
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
      player_id: () => this.wandererEntity,
      player_pos: () => this.wandererCarpet(),
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
        // A bonus asked by its name of before T310b (`difesa`) is the one it means (`defense`); a pack not yet ported answers to the name of today too.
        const bonus = this.content.get(id)?.bonus;
        const v = bonus?.[name] ?? bonus?.[internalName('bonus', name)] ?? bonus?.[italianName('bonus', name)];
        return typeof v === 'number' && Number.isFinite(v) ? v : 0;
      },
      slot_get: (panel, slot) => this.slots()[panel]?.[slot]?.item ?? undefined,
      set_tile: (x, y, code) => this.setTile(Math.floor(x), Math.floor(y), code),
      open: (id) => !!this.openContainer(id),
      make_container: (id, size, loot) => {
        if (!this.ecs.alive.has(id) || id === this.wandererEntity || this.ecs.has(id, 'container') || this.ecs.has(id, 'pickup') || !this.content.loot[loot]) return false;
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
    const outer = this.luaModule;
    this.luaModule = id;
    let value: unknown;
    try {
      value = this.sandbox.run(id, fn, ...args);
    } finally {
      this.luaModule = outer;
    }
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

  wandererPos(): { x: number; y: number; z?: number } {
    return this.ecs.get(this.wandererEntity, 'pos');
  }

  /** A wanderer's entity, with what they start with (e.g. a rune pouch). */
  private spawnWanderer(x: number, y: number): Id {
    const wandererModule = [...this.modules.values()].find((m) => m.manifest.kind === 'player');
    const defaults: Record<string, any> = clone(wandererModule?.manifest.components ?? FALLBACK_PLAYER);
    for (const [k, v] of Object.entries(FALLBACK_PLAYER)) if (!defaults[k]) defaults[k] = clone(v);
    if (!defaults.inventory) defaults.inventory = newInventory();
    const glyph = this.glyphOf(wandererModule?.manifest.appearance ?? { glyph: '@', color: '#ffffff' });
    const body = { r: wandererModule?.manifest.physics?.radius ?? 0.3, solid: false };
    const id = this.ecs.spawn({ ...defaults, pos: { x, y }, glyph, body, form: this.formFor(wandererModule?.manifest, 'viandante'), module: { id: wandererModule?.manifest.id ?? 'kernel.player' } });
    const was = this.wandererEntity;
    this.wandererEntity = id;
    try {
      for (const it of wandererModule?.manifest.inventory ?? []) if (this.content.get(it)) this.give(it, 1);
    } finally {
      this.wandererEntity = was || id;
    }
    return id;
  }

  /** The wanderer acting now: the one whose entity is `wandererEntity`. */
  wanderer(): Wanderer {
    for (const w of this.wanderersById.values()) if (w.entity === this.wandererEntity) return { id: w.id, name: w.name };
    return { id: SOLO, name: WANDERER_NAME };
  }

  /** The keys a wanderer's client holds (T263): world directions, set by the server from what the client says. */
  private heldKeys = new Map<string, Set<string>>();

  /** What a client holds, said by its server (T263): only the four directions, never more. */
  setHeldOf(id: string, actions: unknown): void {
    if (!this.wanderersById.has(id)) return;
    const list = Array.isArray(actions) ? actions.filter((a): a is string => typeof a === 'string' && HELD_ACTIONS.has(a)) : [];
    if (list.length) this.heldKeys.set(id, new Set(list));
    else this.heldKeys.delete(id);
  }

  /** Whether a wanderer holds an action: what their client said, or this kernel's keyboard for the one it belongs to. */
  heldBy(id: string | undefined, action: string): boolean {
    if (!id) return false;
    const said = this.heldKeys.get(id);
    if (said) return said.has(action);
    return id === this.inputFor && this.input.isHeld(action);
  }

  /** Every wanderer of this kernel with a body: what `world.wanderers()` gives Lua (T263). Who they are and where, nothing else. */
  private wanderersInWorld(): Array<{ id: number; chi: string; x: number; y: number }> {
    const out: Array<{ id: number; chi: string; x: number; y: number }> = [];
    for (const w of this.wanderersById.keys()) {
      const at = this.wandererAt(w);
      if (at && Number.isFinite(at.x) && Number.isFinite(at.y)) out.push({ id: at.entity, chi: w, x: at.x, y: at.y });
    }
    return out;
  }

  wanderers(): Wanderer[] {
    return [...this.wanderersById.values()].map((w) => ({ id: w.id, name: w.name, ...(w.anonymous ? { anonymous: true } : {}) }));
  }

  /**
   * The other wanderers in the world now and where they are (T42c): in the master's mirror what the server says, in a
   * kernel that holds them (the server's) its registry, but for the one acting and those out of the world.
   */
  players(): PlayerSpot[] {
    if (this.connected) return this.connected;
    const me = this.wanderer().id;
    const out: PlayerSpot[] = [];
    for (const w of this.wanderers()) {
      const at = w.id !== me && this.inWorld(w.id) ? this.wandererAt(w.id) : undefined;
      if (at) out.push({ id: w.id, name: w.name, x: at.x, y: at.y });
    }
    return out;
  }

  /** Where the player followed is (T42c), in the world: their entity in the mirror, or the wanderer; undefined if not followed. */
  watched(): { x: number; y: number; z?: number } | undefined {
    const id = this.watching;
    if (!id) return undefined;
    for (const e of this.ecs.query('remote', 'pos')) {
      if (this.ecs.get(e, 'remote')?.id !== id) continue;
      const p = this.ecs.get(e, 'pos');
      if (Number.isFinite(p?.x) && Number.isFinite(p?.y)) return { x: p.x, y: p.y, z: p.z };
    }
    const p = this.connected?.find((x) => x.id === id) ?? (this.wanderersById.has(id) && id !== this.wanderer().id ? this.wandererAt(id) : undefined);
    return p ? { x: p.x, y: p.y } : undefined;
  }

  /**
   * Runs `fn` as another wanderer: what it does to «the player» (inventory, needs, hand, memories, bonds,
   * quests) is theirs. Synchronous on purpose: the swap never spans an await.
   */
  as<T>(id: string, fn: () => T): T {
    this.acting++;
    try {
      return this.asWanderer(id, fn);
    } finally {
      this.acting--;
    }
  }

  /**
   * Who pays for what is asked now (V-022). `as` never spans an await, so in a multiplayer game, out of an `as`, nobody is acting: `wanderer()` would say
   * whoever holds the default body (the master `io`), who asked for nothing. What a wanderer's request asks after an await passes its `chi`; the rest is the world's.
   */
  payerNow(): string {
    return this.manyPlayers() && !this.mirror && !this.acting ? COMUNE : this.wanderer().id;
  }

  private asWanderer<T>(id: string, fn: () => T): T {
    const w = this.wanderersById.get(id);
    if (!w || w.entity === this.wandererEntity) return fn();
    if (!this.ecs.alive.has(w.entity)) {
      // Never someone else in their place: they come back with what was saved of them.
      this.wanderersById.delete(id);
      this.addWanderer(id, w.name);
      return this.asWanderer(id, fn);
    }
    const was = this.wandererEntity;
    const holder = this.carpetHolder;
    this.wandererEntity = w.entity;
    this.holdCarpet(id);
    try {
      return fn();
    } finally {
      this.holdCarpet(holder);
      this.wandererEntity = was;
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
  addWanderer(id: string, nome?: string, anonimo?: boolean): Id | undefined {
    if (!validWandererId(id)) return undefined;
    const known = this.wanderersById.get(id);
    if (known && this.ecs.alive.has(known.entity)) return known.entity;
    const p = this.wandererPos() ?? { x: 0, y: 0 };
    const entity = this.spawnWanderer(p.x + 1, p.y);
    const saved = readWandererState(this.files, id);
    const isAnon = anonimo !== undefined ? !!anonimo : !!saved?.anonymous;
    // Their carpet starts where the carpet of the one acting is: they appear beside them.
    this.wanderersById.set(id, { id, name: String(nome ?? saved?.name ?? '').trim().slice(0, 40) || WANDERER_NAME, entity, tappeto: { ...this.offset() }, anonymous: isAnon });
    if (saved?.anonymous && anonimo === false) {
      delete saved.anonymous;
      this.setAnonymous(id, false);
    }
    // The profile they had (T44a), checked again: the world may have someone of that name by now.
    if (saved?.profile) this.setProfile(id, nome ? { ...saved.profile, nome } : saved.profile);
    else this.dressWanderer(id);
    if (saved) this.as(id, () => this.applyWandererState(saved));
    return entity;
  }

  /**
   * A wanderer's look (T39, T44a): the seed and the cloak of their profile, or, for those who chose none, a seed and a
   * colour of their id: those who meet tell each other apart.
   */
  private dressWanderer(id: string): void {
    const w = this.wanderersById.get(id);
    const form: FormComp | undefined = w && this.ecs.get(w.entity, 'form');
    if (!w || !form) return;
    const pr = w.profilo;
    const seed = pr?.seed ?? (id !== SOLO ? this.forms.seedFor(form.model, `viandante:${id}`) : form.seed);
    const tint = pr?.tint ?? wandererColor(id) ?? form.tint;
    Object.assign(form, { seed, tint });
    if (!tint) delete form.tint;
  }

  /** The names a wanderer's must not be like (T44a): the people of the world, and every other wanderer, here or saved. */
  private namesTaken(id: string): string[] {
    const out = readPeople(this.files).people.map((p) => p.name);
    for (const w of [...wanderersIn(this.files), ...this.wanderersById.values()]) if (w.id !== id) out.push(w.name);
    return out;
  }

  /** A wanderer's profile (T44a), if they chose one. */
  profileOf(id: string): Profile | undefined {
    const pr = this.wanderersById.get(id)?.profilo;
    return pr ? { ...pr } : undefined;
  }

  /**
   * A wanderer chooses who they are (T44a): the profile is repaired (`repairProfile`: the name unlike everyone else's, seed
   * and colour within the limits), it becomes their name and their look, and it is saved with them.
   */
  setProfile(id: string, raw: unknown): ProfileRepair | undefined {
    const w = this.wanderersById.get(id);
    if (!w) return undefined;
    const model: string = this.ecs.get(w.entity, 'form')?.model ?? 'viandante';
    const r = repairProfile(raw, id, this.namesTaken(id), this.forms.seedsOf(model));
    w.profilo = r.profilo;
    w.name = r.profilo.name;
    this.dressWanderer(id);
    return r;
  }

  /**
   * A profile chosen outside the world (the site, T102): to the wanderer if they are here, otherwise repaired the same way
   * and written in their saved state, which they wear when they come in (a saved profile wins over the one a client brings).
   */
  keepProfile(id: string, raw: unknown): ProfileRepair | undefined {
    if (!validWandererId(id)) return undefined;
    if (this.wanderersById.has(id)) return this.setProfile(id, raw);
    if (this.mirror) return undefined;
    const r = repairProfile(raw, id, this.namesTaken(id), this.forms.seedsOf('viandante'));
    const file = playerFile(id);
    const saved: WandererState = readWandererState(this.files, id) ?? {};
    saved.profile = r.profilo;
    saved.name = r.profilo.name;
    const text = JSON.stringify(saved, null, 1) + '\n';
    this.files[file] = text;
    this.repo.write(file, text);
    return r;
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
    this.heldKeys.delete(id);
    return true;
  }

  /** Whether a session's client moves this wanderer (T38): the kernel then neither walks nor carries them, it checks their steps. */
  setRemote(id: string, on: boolean): void {
    if (on && this.wanderersById.has(id)) this.remote.add(id);
    else this.remote.delete(id);
  }

  /** A wanderer's entity and where they are in the world (carpet space), if they are in it. */
  /**
   * Whether a wanderer is in the world the others see: inside the circle, on their carpet. The master in the corona
   * or in the studio is not (T42a): for the others their body disappears until they walk back.
   */
  inWorld(id: string): boolean {
    const w = this.wanderersById.get(id);
    if (!w || !this.ecs.alive.has(w.entity) || this.offCarpet.has(w.entity)) return false;
    const p = this.ecs.get(w.entity, 'pos');
    return !!p && !this.corona.isInterior(p.x) && Math.hypot(p.x, p.y) < this.config.circleRadius;
  }

  wandererAt(id: string): { entity: Id; x: number; y: number; facing: string } | undefined {
    const w = this.wanderersById.get(id);
    if (!w || !this.ecs.alive.has(w.entity)) return undefined;
    return this.as(id, () => ({ entity: w.entity, ...this.wandererCarpet(), facing: String(this.wandererComp()?.facing ?? 'down') }));
  }

  /** How far a wanderer may walk in a second: their speed and states, on the fastest terrain around them. */
  paceOf(id: string): number {
    return this.as(id, () => {
      const pl: any = this.wandererComp();
      const { x, y } = this.wandererCarpet();
      let terrain = 1;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const t = this.tileAt(Math.floor(x) + dx, Math.floor(y) + dy);
          terrain = Math.max(terrain, (t && Number(this.palette[t]?.speed)) || 1);
        }
      const speed = Math.max(0, Math.min(60, Number(pl?.speed) || 0));
      const passo = Math.max(0.2, Math.min(4, Number(pl?.step) || 1));
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
    if (!this.wanderersById.has(id) || this.dying.has(id)) return undefined;
    return this.as(id, () => {
      const here = this.wandererCarpet();
      let { x, y } = here;
      let dx = Number(to?.x) - x;
      let dy = Number(to?.y) - y;
      const d = Math.hypot(dx, dy);
      if (!Number.isFinite(d) || d < 1e-6) return here;
      const k = d > max ? Math.max(0, max) / d : 1;
      dx *= k;
      dy *= k;
      const r = Number(this.ecs.get(this.wandererEntity, 'body')?.r) || 0.3;
      const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 0.1));
      // The floor they walk on goes with them (T53b): up a stair, on the floor above.
      let z = this.wandererPos().z;
      for (let i = 0; i < n; i++) {
        const stuck = !this.free(x, y, r, z);
        if (stuck || this.free(x + dx / n, y, r, z)) x += dx / n;
        if (stuck || this.free(x, y + dy / n, r, z)) y += dy / n;
        z = this.floorAt(x, y, z);
      }
      const pl = this.wandererComp();
      if (pl && (Math.abs(dx) > 1e-6 || Math.abs(dy) > 1e-6)) pl.facing = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      // The wanderer stays where they are on their circle: the carpet under them moves.
      const c = this.carpet();
      const p = this.wandererPos();
      if (c) Object.assign(c, { ox: x - p.x, oy: y - p.y });
      p.z = z;
      return { x, y };
    });
  }

  wandererComp(): { speed: number; facing: string; load: number } {
    return this.ecs.get(this.wandererEntity, 'player');
  }

  /** The rune hand (ordered tokens to inscribe). */
  phrase(): { tokens: string[]; sel: number } {
    return this.ecs.get(this.wandererEntity, 'hand');
  }

  inventory(): Inventory {
    return this.ecs.get(this.wandererEntity, 'inventory');
  }

  needs(): Needs | undefined {
    return this.ecs.get(this.wandererEntity, 'needs');
  }

  /** Player position on the carpet (where the simulation thinks you are). */
  wandererCarpet(): { x: number; y: number } {
    const p = this.wandererPos();
    const { ox, oy } = this.offset();
    return { x: p.x + ox, y: p.y + oy };
  }

  /**
   * The one place that decides whether the corona is drawn (T226, ADR-0124): only for whoever stands out of the circle
   * or in the studio, and never while following a player. Inside the circle nothing of it is drawn or hovered for anybody,
   * with any camera: the simulation simply continues.
   */
  coronaRevealed(): boolean {
    const p = this.wandererPos();
    return !!p && !this.watched() && coronaShown(p.x, p.y, this.config.circleRadius);
  }

  /** Whether the ring should be ready, still out of sight (T226): the wanderer is getting near the edge. */
  coronaNear(): boolean {
    const p = this.wandererPos();
    return !!p && !this.watched() && coronaNearby(p.x, p.y, this.config.circleRadius);
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
      .map((m) => ({ id: m.manifest.id, name: m.manifest.name, kind: m.manifest.persona ? 'npc' : m.manifest.container ? 'furniture' : 'object', tiles: m.manifest.spawn?.tiles ?? [], context: m.manifest.context ?? m.manifest.description ?? '' }));
  }

  itemInfo(id: string): ItemInfo {
    const d = this.content.get(id);
    return {
      id,
      name: d?.name ?? id,
      description: d?.description ?? 'Qualcosa che non esiste più nel codice del mondo.',
      glyph: d?.glyph ?? '?',
      color: d?.color ?? '#888',
      category: d?.category ?? 'misc',
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
    return hex(hashStr(readBible(this.files)?.title ?? ''));
  }

  /**
   * Loads a set of universe files. Without reset this is a hot reload: only changed modules are
   * recompiled, the ECS world is untouched and the next tick runs the new logic.
   */
  applyFiles(files: FileMap, opts: { reset?: boolean } = {}): void {
    const read = readConfig(files);
    const { error } = read;
    // A copy: without a universe.json this is the shared default, and what the kernel keeps goes into it.
    const config = { ...read.config };
    if (error) this.faults.raise('universe:config', error);
    else this.faults.clear('universe:config');
    // A universe of another contract does not open as if it were ours (T260): the world stands, nothing of it is committed.
    const version = error ? { ok: true } : checkKernelVersion(config.kernel, KERNEL_VERSION, config.kernels);
    if (!version.ok) {
      if (!this.faults.has('universe:kernel')) this.message(`Questo universo non è di questo kernel: ${version.motivo}. Si legge soltanto: niente si salva.`, 'warn');
      this.faults.raise('universe:kernel', `${READ_ONLY_WORDS} — ${version.motivo}`);
    } else this.faults.clear('universe:kernel');
    this.keepGame(config, files);
    this.keepSettings(config, files);
    const radiusChanged = !this.config || this.config.circleRadius !== config.circleRadius;
    const sizeChanged = !this.config || this.config.chunkSize !== config.chunkSize || this.config.seed !== config.seed;
    this.config = config;
    if (this.ai?.textModel !== undefined && config.ai.textModel) this.ai.textModel = config.ai.textModel;
    this.forms.load(files);
    if (radiusChanged) this.corona = new Corona(config.circleRadius);

    if (opts.reset) {
      this.stores.load(files);
      this.npc.reset(files);
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
    this.rulesOffset = this.corona.rulesOffset;
    this.placeCampus();
    // A broken card whose program is gone or written anew is not broken any more (T296): taken away, or mended by hand; it is tried again.
    this.forgetMended();
    // Entities that wait for a model of their own wear it as soon as the library has it (and it is not a card isolated here, T296).
    for (const id of this.ecs.query('form')) {
      const fc: FormComp = this.ecs.get(id, 'form');
      if (!fc.wanted || !this.forms.usable(fc.wanted)) continue;
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
    const classe = app?.class ?? (man?.kind === 'player' ? 'person' : man ? guessClass(`${man.name} ${man.description ?? ''} ${app?.look ?? ''}`, man.persona ? 'figure' : undefined).id : 'object');
    const model = this.forms.resolve(app?.model, classe);
    return { model, seed: this.forms.seedFor(model, who), yaw: man?.persona || man?.kind === 'player' ? 0 : (hashStr(who) % 628) / 100, ...(app?.model && app.model !== model ? { wanted: app.model, classe } : {}) };
  }

  /**
   * The look of an item: its own model, or the generic entity in its colour. A thing of the world carried (T292) looks as its
   * module makes it, with `seed` the one it had standing (its slot says it), else one for its module.
   */
  itemLook(item: string, seed?: number): FormComp {
    const module = thingModule(item);
    const man = module !== undefined ? this.modules.get(module)?.manifest : undefined;
    if (man) {
      const look = this.formFor(man, item);
      return { ...look, yaw: 0, ...(typeof seed === 'number' && Number.isInteger(seed) ? { seed } : {}) };
    }
    const d = this.content.get(item);
    const model = this.forms.resolve(d?.model, 'object');
    return { model, seed: 1, yaw: 0, tint: d?.color, ...(d?.model && d.model !== model ? { wanted: d.model, classe: 'object' } : {}) };
  }

  /** The actions of an entity's model that would change it now (open when closed, close when open). */
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

  /** Does an action of an entity's model: the rule runs on its voxels (the door opens), and it is remembered. */
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
   * The model whose shape an action may change: an entity's own program in the library (not the generic one
   * of a class, which many kinds share), and not a figure (people and animals change by other means).
   */
  shapeModel(id: Id): string | undefined {
    const fc: FormComp | undefined = this.ecs.get(id, 'form');
    if (!fc || GENERIC.has(fc.model) || !this.forms.info(fc.model) || this.modules.get(this.ecs.get(id, 'module')?.id)?.manifest.persona) return undefined;
    return categoryOf(this.forms.classOf(fc.model)) === 'figure' ? undefined : fc.model;
  }

  /**
   * An action that changes an entity's shape becomes a rule of its model (ADR-0044): the Sculptor writes an
   * `<action>`, the kernel tries it on the model (it finishes, changes something, does not empty it), the
   * program enters the library with it (commit) and every entity of the kind has it in its menu. This one
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
    const nome = this.forms.info(model)?.name ?? this.nameOf(id);
    this.council.say('narrator', 'propone', `«${text}» cambia ${nome}: ${change}`, 'sculptor', 'model.action');
    let r;
    try {
      r = await sculptAction(this.council, { nome, xml, classe: cls.id, azione: name, etichetta: label, testo: text, cambia: change }, this.sculptors()[categoryOf(cls)]);
    } catch (e) {
      this.council.say('sculptor', 'errore', `azione «${label}»: ${(e as Error).message}`, undefined, 'model.action');
      return undefined;
    }
    if (!r || !this.addModel(model, r.xml, this.forms.info(model) ?? { class: cls.id }, `azione imparata: ${label} (${model})`)) return undefined;
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

  /** Where a solid entity blocks and what one stands on in it: its model's, or the changed ones of this instance. */
  private groundOf(id: Id, fc: FormComp, f: Form): Ground & { foot: Uint8Array } {
    // A building that rises (T245e): what a body meets is the grid of its stage, without the site around it.
    const st = this.ecs.get(id, 'structure')?.stage;
    const staged = typeof st === 'number' && Number.isFinite(st) && st < 1;
    if (!fc.done?.length && !staged) return { foot: f.foot!, floor: f.floor!, block: f.block!, levels: f.levels!, hole: f.hole };
    const key = `${f.key}|${fc.done?.join(',') ?? ''}|${staged ? st : ''}`;
    const c = this.instanceFeet.get(id);
    if (c?.key === key) return c;
    const r = f.result!;
    const acted = fc.done?.length ? instanceGrid(this.forms, f, fc.done) : r.grid;
    const g = staged ? stageGrid(acted, r.palette, st, { base: f.base }).grid : acted;
    // A cellar that held stays one (T52b); its hole as the actions left it. Under way there is no cellar yet.
    const cellar = f.hole && !staged;
    const ground = cellar ? bodyGround(g, r.palette, f.vpt, f.base, holesOf(g, r.palette, f.base)) : bodyGround(g, r.palette, f.vpt, f.base);
    const out = { key, foot: bodyFoot(g, r.palette, f.vpt, f.base), floor: ground.floor, block: ground.block, levels: ground.levels, hole: cellar ? ground.hole : undefined };
    this.instanceFeet.set(id, out);
    return out;
  }

  /**
   * Carpet-space box (half-size r) blocked by the voxels of a solid entity (T53a): something at body height over
   * a column under it, or a rise of more than a step between two columns under it. A stair is a ramp. With the
   * height of the feet (`z`, tiles) the floors are those nearest to it (T53b): one walks under the floor above,
   * and on it; without, the ground floor.
   */
  private formBlocks(x: number, y: number, r: number, z?: number): boolean {
    // The box in the model's own frame (exact for quarter turns, a little larger otherwise). A model wholly under the
    // feet (a sign on the ground under the floor above, T70) does not stop who walks over it.
    return this.formsUnder(x, y, r).some(({ s, box }) => {
      const at = this.levelIn(s, z);
      return at <= s.form.result!.grid.Z + stepOf(s.form.vpt) && rampBlocks(s.form, s, ...box, at);
    });
  }

  private glyphOf(app: NonNullable<Manifest['appearance']>) {
    return { ch: app.glyph, color: app.color };
  }

  private ensureCoreEntities(reset: boolean): void {
    const wandererModule = [...this.modules.values()].find((m) => m.manifest.kind === 'player');
    const defaults: Record<string, any> = clone(wandererModule?.manifest.components ?? FALLBACK_PLAYER);
    for (const [k, v] of Object.entries(FALLBACK_PLAYER)) if (!defaults[k]) defaults[k] = clone(v);
    if (!defaults.inventory) defaults.inventory = newInventory();
    const app = wandererModule?.manifest.appearance ?? { glyph: '@', color: '#ffffff' };
    const glyph = this.glyphOf(app);

    if (!this.wandererEntity || !this.ecs.alive.has(this.wandererEntity)) {
      this.wandererEntity = this.spawnWanderer(0, 0);
      this.wanderersById.set(SOLO, { id: SOLO, name: this.wanderersById.get(SOLO)?.name ?? WANDERER_NAME, entity: this.wandererEntity });
    } else {
      this.ecs.set(this.wandererEntity, 'glyph', glyph);
      this.ecs.set(this.wandererEntity, 'form', this.formFor(wandererModule?.manifest, 'viandante'));
      // The look a profile chose stays (T44a).
      const me = [...this.wanderersById.values()].find((w) => w.entity === this.wandererEntity);
      if (me?.profilo) this.dressWanderer(me.id);
      if (reset) this.resetComponents(this.wandererEntity, defaults, [...(wandererModule?.manifest.persist ?? []), 'inventory.slots', 'inventory.equipped']);
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

  // --- Chunks: draft → plan (Cartographer) → layout (rules + guaranteed paths) → entities ----------

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
    const ch: Chunk = { cx, cy, key, draft, tiles: draft, version: 0, stage: 'draft', lots: [], chi: this.wanderer().id };
    this.chunks.set(key, ch);
    return ch;
  }

  private alive(ch: Chunk): boolean {
    return this.chunks.get(ch.key) === ch;
  }

  /** Plans the drafts nearest to any wanderer in the world (T40: not in the studio), a few at a time. */
  private pumpDevelopment(): void {
    if (this.generationHeld || this.developers >= 3) return;
    const S = this.config.chunkSize;
    const at: Array<{ x: number; y: number }> = [];
    for (const w of this.wanderersById.keys())
      this.as(w, () => {
        if (this.corona.isInterior(this.wandererPos().x)) return;
        const pc = this.wandererCarpet();
        at.push({ x: pc.x / S - 0.5, y: pc.y / S - 0.5 });
      });
    if (!at.length) return;
    const quota = this.chunkQuota();
    const drafts = [...this.chunks.values()].filter((c) => c.stage === 'draft' && !c.developing && (quota || !c.held));
    const dist = (c: Chunk) => Math.min(...at.map((p) => Math.hypot(c.cx - p.x, c.cy - p.y)));
    drafts.sort((a, b) => dist(a) - dist(b));
    for (const ch of drafts.slice(0, 3 - this.developers)) {
      ch.developing = true;
      this.developers++;
      void this.develop(ch).finally(() => {
        ch.developing = false;
        this.developers--;
      });
    }
  }

  /**
   * The deferred generation (T207, ADR-0143): the place (cx, cy) planned now, with nobody near it and outside the quota of new places per
   * minute (the world's time does not run there). `nuovo` if the Council planned it now, `noto` if the universe had its plan, `no` otherwise.
   */
  async planAhead(cx: number, cy: number): Promise<'nuovo' | 'noto' | 'no'> {
    if (this.mirror || !Number.isInteger(cx) || !Number.isInteger(cy)) return 'no';
    this.genBudget = Math.max(this.genBudget, 1);
    const ch = this.ensureChunk(cx, cy);
    if (!ch || ch.developing) return 'no';
    if (ch.stage === 'planned') return 'noto';
    const known = !!(await this.chunkStore.load(this.recordKey(ch)));
    ch.developing = true;
    this.developers++;
    try {
      await this.develop(ch, true);
    } finally {
      ch.developing = false;
      this.developers--;
    }
    const stage = ch.stage as Chunk['stage']; // develop() changed it
    return stage !== 'planned' ? 'no' : known ? 'noto' : 'nuovo';
  }

  /** The characters of a planned place: each gets the individual behind it (deferred generation). How many have one. */
  async peopleOf(cx: number, cy: number): Promise<number> {
    const ch = this.chunks.get(this.chunkKey(cx, cy));
    if (!ch || ch.stage !== 'planned') return 0;
    const S = this.config.chunkSize;
    const inside = (id: Id) => {
      const p = this.ecs.get(id, 'pos') as { x: number; y: number } | undefined;
      return !!p && Math.floor(p.x / S) === cx && Math.floor(p.y / S) === cy;
    };
    let n = 0;
    for (const id of this.ecs.query('module')) {
      const m = this.modules.get(this.ecs.get(id, 'module')?.id)?.manifest;
      if (!m?.persona || !inside(id)) continue;
      if (await this.npc.ensureIdentity(id)) n++;
    }
    return n;
  }

  /** Brings a chunk from draft to planned, reusing the cached plan when possible. */
  private async develop(ch: Chunk, noQuota = false): Promise<void> {
    const rec = await this.chunkStore.load(this.recordKey(ch));
    if (!this.alive(ch)) return;
    // A plan whose environment is gone belongs to another world (a Genesis under the same title, ADR-0134): planned again.
    if (rec && (!rec.plan.layout || this.content.layouts[rec.plan.layout])) return this.applyPlan(ch, rec.plan);
    // New to the universe: planned once, here, at the expense of who wanted it first (T40), within the quota.
    if (!noQuota && !this.chunkQuota()) {
      if (!ch.held) this.council.say('kernel', 'info', `luogo ${ch.key}: troppi luoghi nuovi in un minuto, aspetta`, 'cartographer', 'chunk.plan');
      ch.held = true;
      return;
    }
    ch.held = false;
    this.chunksMade.push(this.time);
    const plan = await this.makePlan(ch);
    this.cardChunk(ch, plan, ch.chi);
    await this.chunkStore.save(this.recordKey(ch), { plan });
    if (this.alive(ch)) this.applyPlan(ch, plan);
  }

  /**
   * Whether one more new place may be planned now: alone always; in a universe of many at most
   * `ai.placesPerMinute` in a minute of the world, for everyone together (T40, costs).
   */
  private chunkQuota(): boolean {
    if (!this.manyPlayers()) return true;
    this.chunksMade = this.chunksMade.filter((t) => this.time - t < 60);
    return this.chunksMade.length < (this.config.ai.placesPerMinute ?? Kernel.PLACES_PER_MINUTE);
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
  private environmentsFor(ch: Chunk): { layouts: Array<{ id: string; name: string; description: string; environment: string }>; region?: Region } {
    const all = Object.entries(this.content.layouts).map(([id, l]) => ({ id, name: l.name, description: l.description, environment: l.environment }));
    const atlas = readAtlas(this.files);
    const region = ch.cx === 0 && ch.cy === 0 ? undefined : regionAt(atlas, ch.cx, ch.cy);
    if (region && this.content.layouts[region.environment]) return { layouts: all.filter((l) => l.id === region.environment), region };
    const regional = new Set(atlas.regions.map((r) => r.environment));
    const free = all.filter((l) => !regional.has(l.id));
    return { layouts: free.length ? free : all };
  }

  private async makePlan(ch: Chunk): Promise<ChunkPlan> {
    const start = ch.cx === 0 && ch.cy === 0;
    const { layouts, region } = this.environmentsFor(ch);
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
          region: region ? { name: region.name, description: region.description } : undefined,
          rari: this.rareAllowed(ch),
          ...(this.broughtStructures().length ? { brought: this.broughtStructures() } : {}),
          chi: ch.chi,
        });
        const verdict = this.validator.validatePlan(raw, new Set(layouts.map((l) => l.id)), placeable);
        if (verdict.errors.length) {
          feedback = verdict.errors.join('; ');
          this.council.say('kernel', 'scarta', `luogo ${ch.key}: ${feedback} → rigenero`, 'cartographer', 'chunk.plan');
          continue;
        }
        if (verdict.dropped.length) this.council.say('kernel', 'scarta', `(${ch.key}) ${verdict.dropped[0]}${verdict.dropped.length > 1 ? ` (+${verdict.dropped.length - 1})` : ''}`, 'cartographer', 'chunk.plan');
        const plan = verdict.plan;
        this.council.say('cartographer', 'propone', `(${ch.key}) «${plan.place.name}» — ${this.content.layouts[plan.layout]?.name}: ${plan.objects.length} cose, ${plan.ground.length} a terra, ${plan.runes.length} rune${plan.fresh.length ? `, chiede «${plan.fresh[0].concept}»` : ''}`, undefined, 'chunk.plan');
        return plan;
      } catch (e) {
        this.council.say('cartographer', 'errore', `(${ch.key}) ${(e as Error).message}`, undefined, 'chunk.plan');
        if (e instanceof BudgetError) break;
      }
    }
    if (feedback) this.noteShortfall({ request: 'il piano di un luogo', who: ch.chi, agent: 'cartographer', task: 'chunk.plan', outcome: 'invalid', reason: feedback });
    const plan = this.fallbackPlan(ch, layouts.map((l) => l.id), start);
    if (region) plan.place = { name: region.name, description: region.description };
    return plan;
  }

  /** A universe without a geography gets one (the Cartographer may redraw it); explored places stay. */
  ensureAtlas(): void {
    if (this.files[ATLAS_FILE] || !Object.keys(this.content.layouts).length) return;
    const explored = new Set([...this.chunks.values()].filter((c) => c.stage === 'planned').map((c) => c.key));
    const atlas = defaultAtlas(this.content.layouts, explored, this.config.seed);
    this.repo.write(ATLAS_FILE, writeAtlas(atlas));
    this.applyFiles({ ...this.repo.working });
    this.repo.commit(`atlante: ${atlas.regions.length} regioni`, 'agent');
    this.council.say('cartographer', 'propone', `atlante del mondo: ${atlas.regions.map((r) => `${r.name} (${r.center.join(',')})`).join(', ')}`, undefined, 'atlas');
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
      this.council.say('cartographer', 'errore', `atlante: ${(e as Error).message}`, undefined, 'genesis.atlas');
      drafts = [];
    }
    const atlas = { regions: [] as Region[] };
    for (const d of drafts) {
      const raggio = Math.max(1, Math.min(3, Math.round(d.radius) || 1));
      const centro = placeRegion(atlas, [0, 0], d.direction, Math.max(2, Math.min(14, Math.round(d.distance) || 4)), raggio, new Set());
      atlas.regions.push({ id: `${d.environment}-${atlas.regions.length}`, name: String(d.name).slice(0, 40), description: String(d.description).slice(0, 200), environment: d.environment, center: centro, radius: raggio });
    }
    const final = atlas.regions.length >= 3 ? atlas : defaultAtlas(this.content.layouts, new Set(), this.config.seed);
    this.repo.write(ATLAS_FILE, writeAtlas(final));
    this.applyFiles({ ...this.repo.working });
    this.council.say('cartographer', 'propone', `geografia: ${final.regions.map((r) => `${r.name} (${directionWord(direction(r.center[0], r.center[1]))})`).join(', ')}`, undefined, 'genesis.atlas');
  }

  /**
   * "Un bosco degli elfi": the Cartographer writes the environment (rules, stamps, new terrains if
   * needed), the validator test-runs it, and it is placed on the atlas in an unexplored direction.
   */
  async createEnvironment(request: string): Promise<{ ok: boolean; summary: string }> {
    const chi = this.payerNow();
    const pc = this.wandererCarpet();
    const S = this.config.chunkSize;
    const here: [number, number] = [Math.floor(pc.x / S), Math.floor(pc.y / S)];
    const layouts = Object.entries(this.content.layouts).map(([id, l]) => ({ id, name: l.name, description: l.description }));
    let feedback = '';
    for (let attempt = 0; attempt < 2; attempt++) {
      let d;
      try {
        d = await designEnvironment(this.council, request, { palette: this.palette, layouts, here: this.chunkHere()?.name ?? 'qui', stamps: STAMP_SHAPES, feedback });
      } catch (e) {
        this.noteShortfall({ request: request, who: chi, agent: 'cartographer', task: 'cartographer.environment', outcome: 'error', reason: (e as Error).message });
        return { ok: false, summary: `Il Cartografo non riesce: ${(e as Error).message}` };
      }
      // New terrains: one free character each, a known layer.
      const palette = { ...this.palette };
      const added: Record<string, TerrainDef> = {};
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
          this.council.say('kernel', 'scarta', `ambiente «${d.name}»: ${feedback}`, 'cartographer', 'cartographer.environment');
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
      const centro = placeRegion(atlas, here, d.region.direction, d.region.distance, d.region.radius, this.explored());
      const region: Region = { id: `${layoutId}-${atlas.regions.length}`, name: d.region.name, description: d.region.description || d.description, environment: layoutId, center: centro, radius: d.region.radius };
      atlas.regions.push(region);
      this.repo.write(ATLAS_FILE, writeAtlas(atlas));
      this.applyFiles({ ...this.repo.working });
      const dist = Math.max(Math.abs(centro[0] - here[0]), Math.abs(centro[1] - here[1]));
      const where = `${directionWord(direction(centro[0] - here[0], centro[1] - here[1]))}, a ${dist} luoghi da qui`;
      const c = this.commitContent(`cartografo: ${region.name} (${where})`, 'cartographer.environment', 'cartographer');
      const summary = `«${region.name}» — ${region.description.replace(/\.$/, '')}. Si trova a ${where}.${Object.keys(added).length ? ` Terreni nuovi: ${Object.values(added).map((t) => t.name).join(', ')}.` : ''}`;
      this.council.say('cartographer', 'approva', `${summary} (commit ${c.id})`, undefined, 'cartographer.environment');
      return { ok: true, summary };
    }
    this.noteShortfall({ request: request, who: chi, agent: 'cartographer', task: 'cartographer.environment', outcome: 'invalid', reason: feedback });
    return { ok: false, summary: `Il Cartografo non è riuscito a scrivere un ambiente valido: ${feedback}` };
  }

  /**
   * What the Cartographer's atlas shows, without generating anything: places planned (ever, from the
   * universe's maps, and now), places only sketched (drafts loaded, not yet planned), the regions, you.
   */
  async atlasView(): Promise<{ planned: Array<{ cx: number; cy: number; name: string; layout: string }>; drafts: Array<{ cx: number; cy: number }>; regions: Region[]; here: { cx: number; cy: number }; players: Array<PlayerSpot & { cx: number; cy: number }> }> {
    const S = this.config.chunkSize;
    const planned = new Map<string, { cx: number; cy: number; name: string; layout: string }>();
    const prefix = this.recordKey({ cx: 0, cy: 0, key: '' } as Chunk).replace(/[:,]/g, '_');
    for (const m of (await this.repo.backend?.listMaps?.().catch(() => [])) ?? []) {
      if (!m.file.startsWith(prefix)) continue;
      const parts = m.file.slice(prefix.length).split('_').map(Number);
      if (parts.length >= 2 && parts.every(Number.isFinite)) planned.set(`${parts[0]},${parts[1]}`, { cx: parts[0], cy: parts[1], name: m.name, layout: internalName('ambienti', m.layout) });
    }
    for (const ch of this.chunks.values()) if (ch.stage === 'planned' && ch.place) planned.set(ch.key, { cx: ch.cx, cy: ch.cy, name: ch.place.name, layout: ch.plan?.layout ?? '' });
    const drafts = [...this.chunks.values()].filter((c) => c.stage === 'draft' && !planned.has(c.key)).map((c) => ({ cx: c.cx, cy: c.cy }));
    // Seen from the studio, "here" is where the wanderer last stood in the world.
    const pc = this.corona.isInterior(this.wandererPos().x) ? this.lastWorld : this.wandererCarpet();
    // The players connected (T42c), each on their chunk.
    const players = this.players().map((p) => ({ ...p, cx: Math.floor(p.x / S), cy: Math.floor(p.y / S) }));
    return { planned: [...planned.values()], drafts, regions: readAtlas(this.files).regions, here: { cx: Math.floor(pc.x / S), cy: Math.floor(pc.y / S) }, players };
  }

  /** Where things are, seen from a carpet point: places nearby and regions of the atlas. */
  directionsAt(x: number, y: number): string[] {
    const S = this.config.chunkSize;
    const cx = Math.floor(x / S);
    const cy = Math.floor(y / S);
    const chunks = [...this.chunks.values()].filter((c) => c.place).map((c) => ({ name: c.place!.name, cx: c.cx, cy: c.cy }));
    return directionsFrom(readAtlas(this.files), chunks, cx, cy);
  }

  private fallbackPlan(ch: Chunk, layouts: string[], start: boolean): ChunkPlan {
    const rng = new Rng(hash32(this.config.seed, ch.cx, ch.cy, 404));
    const trees = [...ch.draft].filter((c) => c === 't').length / ch.draft.length;
    const layoutId = start ? (layouts.find((l) => /borgo|villag|paese|citt|quartier/.test(l)) ?? layouts[0]) : trees > 0.3 && layouts.includes('woods') ? 'woods' : layouts[rng.int(Math.max(1, layouts.length))];
    const plan: ChunkPlan = { place: { name: 'Terra senza nome', description: 'Qui il mondo non ha ancora trovato le parole.' }, layout: layoutId ?? '', objects: [], ground: [], fresh: [], runes: [] };
    for (const m of this.modules.values()) {
      const rule = m.manifest.spawn;
      if (m.manifest.kind !== 'entity' || !rule) continue;
      for (let i = 0; i < rule.max; i++) if (rng.chance(rule.chance)) plan.objects.push({ module: m.manifest.id, where: rule.tiles.some((t) => this.palette[t]?.indoor) ? 'inside' : 'outside' });
    }
    return plan;
  }

  /** The tile the kernel digs paths with (and lays on lots). */
  private pathCode(): string {
    return this.palette.p ? 'p' : (Object.keys(this.palette).find((c) => c !== '?' && !this.palette[c].solid) ?? 'g');
  }

  /**
   * A plan laid out on its draft (deterministic): the environment's program, the guaranteed paths, the lots,
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
    for (const [tile, code] of Object.entries(plan.edits ?? {})) {
      const i = Number(tile);
      if (Number.isInteger(i) && i >= 0 && i < S * S && this.palette[code]) tiles = tiles.slice(0, i) + code + tiles.slice(i + 1);
    }
    return { result, tiles };
  }

  /** Whether a module entity represents a solid obstacle when placed in the world. */
  isSolidModule(m?: ModuleEntry): boolean {
    if (!m || m.manifest.kind === 'item') return false;
    return !!m.manifest.physics?.solid && !m.manifest.physics?.pushable;
  }

  /**
   * Where a plan puts its runes and entities: reachable cells, inside or outside lots, never on gates or doors.
   * Deterministic, the same for the world and for the model of places (T26): what was already taken keeps its cell,
   * so the rest does not move. `pick` goes on for what comes later (entities forged for the place, items introduced).
   */
  private placementsOf(ch: Pick<Chunk, 'cx' | 'cy' | 'key'>, plan: ChunkPlan, result: LayoutResult): Placements {
    const S = this.config.chunkSize;
    const rng = new Rng(hash32(this.config.seed, ch.cx, ch.cy, 991));
    const occupied = new Set<number>(result.gates);
    for (const b of result.lots) for (const d of b.doors) occupied.add(d);
    const indoorSet = new Set(result.lots.flatMap((b) => b.floor));
    const reach = [...result.reachable];
    const indoor = reach.filter((i) => indoorSet.has(i));
    const outdoor = reach.filter((i) => !indoorSet.has(i) && this.palette[result.grid[Math.floor(i / S)][i % S]]?.layer !== 'door');
    const freeTiles = new Set<number>(result.reachable);
    let arts = articulationPoints(freeTiles, S);
    const pick = (where: Where, solid = false): number | undefined => {
      let pool = (where === 'inside' && indoor.length ? indoor : where === 'outside' && outdoor.length ? outdoor : reach).filter((i) => !occupied.has(i));
      if (solid) pool = pool.filter((i) => !arts.has(i));
      if (!pool.length) return undefined;
      const tile = pool[rng.int(pool.length)];
      occupied.add(tile);
      if (solid) {
        freeTiles.delete(tile);
        arts = articulationPoints(freeTiles, S);
      }
      return tile;
    };

    // Runes: rare and precious, on a free reachable stretch of a row, anywhere in the chunk. Those that
    // touch the carpet only far from the start (you learn the logic before you can leave); sometimes a magic rune.
    const far = Math.max(Math.abs(ch.cx), Math.abs(ch.cy)) >= CARPET_RUNE_DISTANCE;
    const start = ch.cx === 0 && ch.cy === 0;
    // In a multiplayer game none of the runes that touch the carpet or write a binding are generated (T37).
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
    const objects = plan.objects.map((o, index) => {
      const m = this.modules.get(o.module);
      return { index, cell: m ? pick(o.where, this.isSolidModule(m)) : undefined };
    });
    // Things lying around: named by the Cartographer (those not known yet are introduced later), plus what the ground loot table yields.
    const ground = plan.ground.map((name, index) => {
      const item = this.content.byName(name)?.id;
      return { index, item, cell: item ? pick('outside', false) : undefined };
    });
    const loot = this.content.roll('terreno', rng, [...this.wanted]).map((l, index) => ({ index, item: l.item, count: l.count, cell: pick('anywhere', false) }));
    return { runes, objects, ground, loot, pick };
  }

  /** Runs the layout and puts entities in the world: deterministic, so a cached plan rebuilds the same place. */
  private applyPlan(ch: Chunk, plan: ChunkPlan): void {
    const S = this.config.chunkSize;
    const pathCode = this.pathCode();
    const { result, tiles } = this.layoutOf(ch, plan, pathCode);
    ch.plan = plan;
    ch.place = plan.place;
    this.graphChunks.set(ch.key, { cx: ch.cx, cy: ch.cy, nome: plan.place.name, descrizione: plan.place.description, ambiente: plan.layout, cose: plan.objects.map((o) => o.module), a_terra: plan.ground, strutture: plan.structures?.map((x) => x.concept) });
    this.graphChunksVersion++;
    ch.tiles = tiles;
    ch.lots = result.lots;
    ch.stage = 'planned';
    ch.version++;
    this.plannedCount++;
    // The ways found over it when it was not there went through what is there now (T299).
    this.npc.forgetWays();
    for (const id of this.ecs.query('chunk')) if (this.ecs.get(id, 'chunk').key === ch.key) this.ecs.destroy(id);
    // Back where nobody looked (T245f): what ripened ripens, the buildings are at the stage their ventures reached.
    const away = this.npc.returnToPlace(ch, plan);
    this.claimSizes(ch, plan);
    const structures = this.settleLots(ch, plan, pathCode);
    const place = this.placementsOf(ch, plan, result);
    const at = (tile: number) => ({ x: ch.cx * S + (tile % S) + 0.5, y: ch.cy * S + Math.floor(tile / S) + 0.5 });
    // On a lot: on the floor of its structure (once its form is ready), not inside its walls.
    const inLot = (tile: number) => {
      const lot = ch.lots.findIndex((b) => b.floor.includes(tile));
      return lot >= 0 ? structures[lot] : undefined;
    };

    for (const r of place.runes) if (!this.consumed.has(r.origin)) this.ecs.spawn({ rune: { token: r.token, col: r.col, row: r.row, source: 'gen', origin: r.origin } satisfies RuneComp, chunk: { key: ch.key } });

    const coef = this.coefficients();
    const loadedOf = (id: string) => this.ecs.query('module').filter((e) => this.ecs.get(e, 'module').id === id).length;
    for (const { index, cell } of place.objects) {
      const m = this.modules.get(plan.objects[index].module);
      const origin = `${ch.key}#o${index}`;
      if (!m || cell === undefined || this.consumed.has(origin) || this.uniqueTaken(m)) continue;
      // Variety: not the same kind of individual in every place.
      if (m.manifest.persona && loadedOf(m.manifest.id) >= Kernel.NPC_CAP) continue;
      // Fewer people per place (T45b): fewer individuals, words and dialogues.
      if (m.manifest.persona && !this.kept(origin, coef.people)) continue;
      const p = at(cell);
      const sid = inLot(cell);
      if (sid !== undefined) void this.placeInside(ch, sid, p, (x, y) => this.spawnModuleEntity(m, x, y, ch.key, origin), this.isSolidModule(m));
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
    const unknown = place.ground.filter((g) => !g.item && this.kept(`${ch.key}#g${g.index}`, coef.entities)).map((g) => plan.ground[g.index]);
    if (unknown.length) void this.introduceItems(unknown, `trovati a terra in «${plan.place.name}»`).then((defs) => {
      if (!this.alive(ch)) return;
      defs.forEach((d, i) => {
        const tile = place.pick('outside');
        if (tile !== undefined) this.spawnItem(d.id, at(tile).x, at(tile).y, 1, ch.key, `${ch.key}#n${i}`);
      });
    });
    for (const f of plan.fresh ?? []) if (this.kept(`${ch.key}:${f.concept}`, coef.entities)) void this.forgeForChunk(ch, f, place.pick, at);
    this.runesDirty = true;
    if (away !== undefined) this.npc.onReturn(ch.key, away);
    this.bus.emit('chunk:planned', { key: ch.key });
    // The rhythms of the world (T45b): stretched by the coefficients of generation.
    if (onBeat(this.plannedCount, 10, coef.packs)) void this.growContent('esplorazione');
    if (onBeat(this.plannedCount, 7, coef.inhabitants)) void this.growCast(plan.place);
    if ((this.plannedCount === 3 && coef.sessions > 0) || onBeat(this.plannedCount, 12, coef.sessions)) void this.holdSession();
  }

  /** How often every agent asks the model (T45b): universe.json → ai.coefficienti, repaired. */
  coefficients(): Coefficients {
    return repairCoefficients(this.config.ai.coefficients);
  }

  /** The Actor's option (T157, ADR-0116): universe.json → ai.attore, repaired; off unless the master turned it on. */
  actor(): ActorConfig {
    return repairActor(this.config.ai.actor);
  }

  /** Who plays the people now: the Actor with its model when the option is on, else the Narrator as always. */
  interpreter(): Interpreter {
    const a = this.actor();
    return a.on ? { agent: 'actor', model: a.model } : NARRATOR_PLAYS;
  }

  /** Whether an entity of a place stays with a coefficient: a draw of the universe for that origin, the same at every load. */
  private kept(origin: string, c: number): boolean {
    return c >= 1 || (c > 0 && hash32(this.config.seed, hashStr(origin), 4545) / 4294967296 < c);
  }

  /** The rare sizes a place may still have (ADR-0092): its area has none of that size, or this place is the one that has it. */
  rareAllowed(ch: { cx: number; cy: number; key: string }): SizeTier[] {
    return RARE_SIZES.filter((t) => {
      const owner = this.rari.get(t)!.get(rareAreaOf(t, ch.cx, ch.cy));
      return !owner || owner === ch.key;
    });
  }

  /**
   * The sizes of a plan's structures (ADR-0092), fitted as the lots will take them (the largest lot first): a
   * size whose box does not fit its lot goes down to the largest that does; a rare one (Huge per zone,
   * Gargantuan per realm, one per place) is kept by the first place of its area, the others' go down to the
   * next size allowed. The plan is changed, so it is saved as it is applied.
   */
  private claimSizes(ch: Chunk, plan: ChunkPlan): void {
    if (!plan.structures?.length) return;
    plan.structures = plan.structures.map(readStructure);
    const sides = ch.lots.map((b, i) => ({ i, area: (b.x1 - b.x0 + 1) * (b.y1 - b.y0 + 1), side: Math.max(b.x1 - b.x0 + 1, b.y1 - b.y0 + 1) })).sort((a, b) => b.area - a.area || a.i - b.i).map((b) => b.side);
    let rare = false;
    plan.structures.forEach((s, n) => {
      if (!s.size) return;
      const side = sides[n];
      const cls = classOf(side !== undefined && side >= 5 ? 'structure' : 'building')!;
      const fits = (t: SizeTier) => side !== undefined && Math.max(...tilesOf(cls, t).slice(0, 2)) <= side;
      const allowed = this.rareAllowed(ch);
      const ok = (t: SizeTier) => fits(t) && (!RARE_SIZES.includes(t) || (!rare && allowed.includes(t)));
      let t: SizeTier | undefined = s.size;
      while (t && !ok(t)) t = sizeRank(t) > 0 ? SIZE_TIERS[sizeRank(t) - 1].id : undefined;
      if (!t) delete s.size;
      else s.size = t;
      if (t && RARE_SIZES.includes(t)) {
        this.rari.get(t)!.set(rareAreaOf(t, ch.cx, ch.cy), ch.key);
        rare = true;
      }
    });
  }

  /**
   * Lots (ADR-0043): every lot of the plan becomes a structure — a whole model one enters, set on its
   * lot and turned towards its door. The Cartographer's structures go to the largest lots (the Sculptor
   * writes the ones that do not exist yet); the others are common houses. The lot's tiles become ground,
   * the path goes on from its door towards the house. Pure: the world and the model of places (T26) build the same.
   */
  /**
   * The entry a structure the Cartographer asked for wears (ADR-0160): the one of its size if the library has it; else an entry of before,
   * named without the size, as it was worn before the suffix (nothing already sculpted changes or waits for a copy), unless it is a
   * program that scales and is of another size: then its size has an entry of its own, which the `ModelDirector` gives the same program.
   */
  private structureModelFor(concept: string, size?: SizeTier): string {
    // A structure that came with the cards (T295): the concept it is named by, at its size, wears it, whatever its id (a handmade card's too).
    const brought = this.broughtStructures().find((b) => sameName(b.concept, concept) && (size === undefined ? b.size === undefined : (b.size ?? classOf(b.class)?.taglia) === size));
    if (brought) return brought.id;
    const sized = structureModel(concept, size), plain = structureModel(concept);
    if (sized === plain || this.forms.info(sized)) return sized;
    const old = this.forms.info(plain), xml = this.files[`models/${plain}.xml`];
    if (!old || !xml) return sized;
    const same = (sizeOf(old.size)?.id ?? classOf(old.class)?.taglia) === size;
    return !same && old.class === 'structure' && shareableProgram(xml) ? sized : plain;
  }

  private lotsOf(ch: Pick<Chunk, 'cx' | 'cy' | 'key' | 'draft' | 'tiles' | 'lots'>, plan: ChunkPlan, pathCode: string): { tiles: string; lots: ChunkLot[] } {
    const S = this.config.chunkSize;
    const tiles = [...ch.tiles];
    const wanted = (plan.structures ?? []).map(readStructure);
    const lots: ChunkLot[] = [];
    const order = ch.lots.map((b, i) => ({ b, i, area: (b.x1 - b.x0 + 1) * (b.y1 - b.y0 + 1) })).sort((a, b) => b.area - a.area || a.i - b.i);
    for (const { b, i } of order) {
      const w = b.x1 - b.x0 + 1, h = b.y1 - b.y0 + 1;
      const classe = Math.max(w, h) >= 5 ? 'structure' : 'building';
      const req = wanted.shift();
      // A world whose common houses are not the seed's cottages has its own (ADR-0134), one per class of lot, however many lots.
      const house = req ? undefined : this.terrain?.manifest.commonHouse;
      const own = req ? this.structureModelFor(req.concept, req.size) : house ? commonHouseModel(house, classe) : undefined;
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
        structure: { concept: req?.concept ?? house ?? (classe === 'structure' ? 'una casa' : 'una casetta'), class: classe, ...(req?.size ? { size: req.size } : {}), ...(own ? { model: own } : {}) },
      });
    }
    return { tiles: tiles.join(''), lots };
  }

  /** The lots of a planned chunk become structures in the world. Returns them, by lot index. */
  private settleLots(ch: Chunk, plan: ChunkPlan, pathCode: string): Id[] {
    const { tiles, lots } = this.lotsOf(ch, plan, pathCode);
    const out: Id[] = [];
    // A lot being built again shows its building at the stage of its venture (T245e): the plan says it, for every kernel that draws it.
    const stadi = plan.stages ?? {};
    for (const l of lots) {
      const st = stadi[l.origin];
      if (st !== undefined && Number.isFinite(st) && st < 1) l.structure = { ...l.structure, stage: Math.max(0, st) };
      out[l.index] = this.ecs.spawn({
        pos: { x: l.x, y: l.y },
        glyph: { ch: '⌂', color: this.terrain?.manifest.roof?.color ?? '#9a4632' },
        body: { r: 0.5, solid: true },
        form: l.form,
        structure: l.structure,
        chunk: { key: ch.key },
        origin: { key: l.origin },
      });
    }
    ch.tiles = tiles;
    // The houses the ventures build on free ground stand like the others, at their stage (T245d, T245e).
    for (const h of plan.houses ?? []) this.spawnPlannedHouse(ch, h);
    return out;
  }

  /**
   * A planned place in miniature (T26), for the model of places in the Office of places: its tiles with their levels,
   * the structures on its lots, its entities and runes where the plan puts them (what was taken is not there). From the
   * chunk if it is loaded, else from its saved plan: then `undefined` the first time, and `miniatureVersion` grows when
   * it is ready. Looking does not generate anything: a place never planned has no miniature.
   */
  miniature(cx: number, cy: number): ChunkMiniature | undefined {
    const key = this.chunkKey(cx, cy);
    const hit = this.miniatures.get(key);
    if (hit?.files === this.files) return hit.mini;
    const entry: { files: FileMap; mini?: ChunkMiniature } = { files: this.files };
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

  private miniatureOf(ch: Pick<Chunk, 'cx' | 'cy' | 'key' | 'draft'>, plan: ChunkPlan): ChunkMiniature {
    const S = this.config.chunkSize;
    const pathCode = this.pathCode();
    const { result, tiles: laid } = this.layoutOf(ch, plan, pathCode, true);
    const { tiles, lots } = this.lotsOf({ ...ch, tiles: laid, lots: result.lots }, plan, pathCode);
    const place = this.placementsOf(ch, plan, result);
    const liquid = (code: string) => this.palette[code]?.layer === 'liquid';
    // Its own levels, as if alone (T51a): the same miniature whether or not the places around are loaded.
    const field = worldLevels([{ ...ch, tiles }], S, liquid, (c, r) => this.relief.level(c, r), this.seaLevel)[0];
    const height = (c: number, r: number) => field[r * S + c];
    const levels = chunkLevels(tiles, S, liquid, height, result.lots);
    const local = (tile: number) => ({ x: (tile % S) + 0.5, y: Math.floor(tile / S) + 0.5 });
    const entities: ChunkMiniature['entities'] = [];
    for (const { index, cell } of place.objects) {
      const m = this.modules.get(plan.objects[index].module);
      const origin = `${ch.key}#o${index}`;
      if (!m || cell === undefined || this.consumed.has(origin)) continue;
      const f = this.formFor(m.manifest, origin);
      entities.push({ ...local(cell), model: f.model, seed: f.seed, yaw: f.yaw, color: m.manifest.appearance?.color });
    }
    const items = [...place.ground.map((g) => ({ ...g, origin: `${ch.key}#g${g.index}` })), ...place.loot.map((l) => ({ ...l, origin: `${ch.key}#l${l.index}` }))];
    for (const it of items) {
      if (!it.item || it.cell === undefined || this.consumed.has(it.origin)) continue;
      const f = this.itemLook(it.item);
      entities.push({ ...local(it.cell), model: f.model, seed: f.seed, tint: f.tint, yaw: 0, color: f.tint });
    }
    const runes = place.runes.filter((r) => !this.consumed.has(r.origin)).map((r) => ({ x: r.col - ch.cx * S + 0.5, y: r.row - ch.cy * S + 0.5, token: r.token, line: r.line, color: this.content.runes[r.token]?.color }));
    // The phases (T26): what changes from one to the next is lit; before the lots, the ground is not levelled for them.
    const changed = (a: string, b: string) => [...b].flatMap((c, i) => (c !== a[i] ? [i] : []));
    const phase = (t: string, lit: number[], lv?: Int16Array) => ({ tiles: t, levels: [...(lv ?? chunkLevels(t, S, liquid, height, []))], lit: [...new Set(lit)].sort((a, b) => a - b) });
    const gated = result.stages!.gated.join(''), programmed = result.stages!.programmed.join('');
    const tileOf = (p: { x: number; y: number }) => Math.floor(p.y) * S + Math.floor(p.x);
    const phases = [
      phase(ch.draft, []),
      phase(gated, result.gates),
      phase(programmed, changed(gated, programmed)),
      phase(laid, changed(programmed, laid)),
      phase(tiles, [...result.lots.flatMap((b) => [...b.walls, ...b.floor, ...b.doors]), ...changed(laid, tiles)], levels),
      phase(tiles, [...entities, ...runes].map(tileOf), levels),
    ];
    return {
      cx: ch.cx,
      cy: ch.cy,
      size: S,
      tiles,
      levels: [...levels],
      structures: lots.map((l) => ({ x: l.x - ch.cx * S, y: l.y - ch.cy * S, w: result.lots[l.index].x1 - result.lots[l.index].x0 + 1, h: result.lots[l.index].y1 - result.lots[l.index].y0 + 1, model: l.form.model, seed: l.form.seed, yaw: l.form.yaw, done: l.form.done })),
      entities,
      runes,
      phases,
    };
  }

  /**
   * Points of a structure's floor, inside its walls (world, carpet space), for what goes indoors: the middle of a window of
   * INDOOR_REACH voxels each way where every column is ground floor one stands on, and where `Kernel.free` finds the structure
   * no obstacle (T281: the same `rampBlocks`, on every column of the window, not one in two).
   */
  private interiorPoints(sid: Id): Array<{ x: number; y: number }> {
    const fc: FormComp | undefined = this.ecs.get(sid, 'form');
    const f = fc && this.forms.ready(fc.model, fc.seed, fc.tint);
    const p = this.ecs.get(sid, 'pos');
    // A house under way has no rooms yet: one lives there from its roof (T245e).
    if (!fc || !f?.floor || !p || (this.ecs.get(sid, 'structure')?.stage ?? 1) < 0.9) return [];
    const g = f.result!.grid;
    const X = g.X, Y = g.Y, W = INDOOR_REACH;
    const ground = this.groundOf(sid, fc, f);
    const { foot, floor, block } = ground;
    const step = stepOf(f.vpt);
    // A column where nothing goes: something at body height, no floor of the model, a floor higher than a step (what goes
    // indoors does not go up the stairs), a floor where a body does not stand (a ceiling too low, out of reach; over a cellar
    // the stairwell, T52b). Counted in a summed table, so a window is clear when it has none.
    const W1 = X + 1;
    const sum = new Int32Array(W1 * (Y + 1));
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++) {
        const i = x + y * X;
        const bad = foot[i] || !floor[i] || floor[i] > step || block[i] ? 1 : 0;
        sum[x + 1 + (y + 1) * W1] = bad + sum[x + (y + 1) * W1] + sum[x + 1 + y * W1] - sum[x + y * W1];
      }
    const badIn = (x0: number, y0: number, x1: number, y1: number) => sum[x1 + 1 + (y1 + 1) * W1] - sum[x0 + (y1 + 1) * W1] - sum[x1 + 1 + y0 * W1] + sum[x0 + y0 * W1];
    const local = (v: number, n: number) => (v + 0.5 - n / 2) / f.vpt;
    const out: Array<{ x: number; y: number }> = [];
    const c = Math.cos(fc.yaw), s = Math.sin(fc.yaw);
    for (let vy = W; vy < Y - W; vy += 4)
      for (let vx = W; vx < X - W; vx += 4) {
        if (badIn(vx - W, vy - W, vx + W, vy + W)) continue;
        // And what `free` asks besides: no two neighbouring floors more than a step apart, measured as it measures (at the ground).
        if (rampBlocks(f, ground, local(vx - W, X), local(vy - W, Y), local(vx + W, X), local(vy + W, Y), f.base)) continue;
        const lx = local(vx, X), lz = local(vy, Y);
        out.push({ x: p.x + lx * c + lz * s, y: p.y - lx * s + lz * c });
      }
    return out;
  }

  /** Puts something inside a structure, on its floor, when its form is ready (or where the plan said, if it never is). */
  private async placeInside(ch: Chunk, sid: Id, fallback: { x: number; y: number }, spawn: (x: number, y: number) => void, solid = false): Promise<void> {
    const fc: FormComp | undefined = this.ecs.get(sid, 'form');
    // As long as its program runs (T281): in the browser a structure comes from a worker in tens of seconds, and what goes in
    // would otherwise go where the plan said, inside its walls.
    if (fc) await this.forms.settled(fc.model, fc.seed, fc.tint);
    if (!this.alive(ch) || !this.ecs.alive.has(sid)) return;
    this.rebuildSolids();
    // Not where something already stands (`free`: a chest, a counter put there before, T281), and away from what is
    // there (not the structure itself: its position is the middle of its floor); a crowded floor is still better than
    // the lot, which may be inside the walls.
    const taken = this.ecs.query('pos').filter((id) => id !== sid).map((id) => this.ecs.get(id, 'pos'));
    const S = this.config.chunkSize;
    const doorPositions = solid ? ch.lots.flatMap((b) => b.doors).map((d) => ({ x: ch.cx * S + (d % S) + 0.5, y: ch.cy * S + Math.floor(d / S) + 0.5 })) : [];
    const inside = this.interiorPoints(sid);
    const open = inside.filter((q) => this.free(q.x, q.y, INDOOR_R));
    const roomy = open.filter((q) => taken.every((t) => Math.hypot(t.x - q.x, t.y - q.y) > 0.9) && (!solid || doorPositions.every((dp) => Math.hypot(dp.x - q.x, dp.y - q.y) > 1.2)));
    const pool = roomy.length ? roomy : solid ? [] : open.length ? open : inside;
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

  /** The sea's level (T51a): `universe.json → rilievo.mare`, or the one the relief gives. */
  get seaLevel(): number {
    const m = this.config.relief?.sea;
    return typeof m === 'number' && Number.isFinite(m) ? Math.round(m) : this.relief.sea;
  }

  /**
   * The levels of a loaded place before its lots (T51a): one field for the whole loaded world (`worldLevels`:
   * the sea at its level, each body of water flat as a whole, the banks), made again when a place comes, goes
   * or changes its tiles. A place whose levels change while its tiles do not is drawn again (`Chunk.levels`).
   */
  private levelsOf(ch: Chunk): Int16Array {
    const relief = this.relief, sea = this.seaLevel;
    const f = this.worldField;
    let fresh = !!f && f.relief === relief && f.sea === sea && f.ground === this.groundVersion && f.tiles.size === this.chunks.size;
    if (fresh) for (const c of this.chunks.values()) if (f!.tiles.get(c) !== c.tiles) { fresh = false; break; }
    if (!fresh) {
      const list = [...this.chunks.values()];
      const S = this.config.chunkSize;
      const out = worldLevels(list, S, (code) => this.palette[code]?.layer === 'liquid', (c, r) => relief.level(c, r) + this.digAt(c, r), sea, (k, i) => {
        const w = this.waterOf(list[k])?.[i];
        return w && w[1] > WET ? w[0] + w[1] : undefined;
      });
      const levels = new Map(list.map((c, i) => [c, out[i]]));
      if (f) for (const c of list) {
        const old = f.levels.get(c);
        if (old && f.tiles.get(c) === c.tiles && old.some((v, i) => v !== levels.get(c)![i])) c.levels = (c.levels ?? 0) + 1;
      }
      this.worldField = { relief, sea, ground: this.groundVersion, tiles: new Map(list.map((c) => [c, c.tiles])), levels };
    }
    return this.worldField!.levels.get(ch)!;
  }

  /** The ground dug or raised and the water that has flowed of a place (T51b): its plan's, or what the server said. */
  private digsOf(ch: Chunk): Record<string, number> | undefined {
    return ch.plan?.digs ?? ch.digs;
  }
  private waterOf(ch: Chunk): Record<string, WaterRecord> | undefined {
    return ch.plan?.water ?? ch.water;
  }
  private tileOf(col: number, row: number): { ch: Chunk; tile: number } | undefined {
    const ch = this.chunkAt(col, row);
    if (!ch) return undefined;
    const S = this.config.chunkSize;
    return { ch, tile: (Math.floor(row) - ch.cy * S) * S + (Math.floor(col) - ch.cx * S) };
  }
  /** Levels the ground of a tile was dug (negative) or raised (T51b). */
  private digAt(col: number, row: number): number {
    const at = this.tileOf(col, row);
    const d = at && this.digsOf(at.ch)?.[at.tile];
    return typeof d === 'number' && Number.isFinite(d) ? d : 0;
  }
  private waterAt(col: number, row: number): WaterRecord | undefined {
    const at = this.tileOf(col, row);
    return at && this.waterOf(at.ch)?.[at.tile];
  }
  /** The level of a tile in the world's field before the lots (T51a): the water's surface for water. */
  private fieldAt(col: number, row: number): number {
    const at = this.tileOf(col, row);
    if (!at) return Math.max(this.seaLevel, this.relief.level(Math.floor(col), Math.floor(row)));
    return this.levelsOf(at.ch)[at.tile];
  }

  /**
   * Digs (negative) or raises the ground of a tile by whole levels (T51b, ADR-0094): persisted in the place's plan
   * (`scavi`), never below the sea; the water around flows into the hollow (or out of what rose) in the next ticks,
   * as the kernel's cellular automaton (`water.ts`) has it. Only a planned place of the simulation; false otherwise.
   */
  dig(col: number, row: number, delta: number): boolean {
    if (this.mirror || !Number.isFinite(col) || !Number.isFinite(row) || !Number.isFinite(delta)) return false;
    const d = Math.max(-MAX_DIG, Math.min(MAX_DIG, Math.round(delta)));
    const at = this.tileOf(col, row);
    if (!d || !at || at.ch.stage !== 'planned' || !at.ch.plan) return false;
    const { ch, tile } = at;
    const plan = ch.plan!;
    const c = Math.floor(col), r = Math.floor(row);
    // The flow takes the tile as it is before the dig: its bed moves by what the ground moves.
    this.water.wake(c, r);
    const before = this.relief.level(c, r) + this.digAt(c, r);
    const scavi = (plan.digs ??= {});
    const next = Math.max(-2 * MAX_DIG, Math.min(2 * MAX_DIG, (scavi[tile] ?? 0) + d));
    if (next) scavi[tile] = next;
    else delete scavi[tile];
    const moved = this.relief.level(c, r) + next - before;
    const rec = plan.water?.[tile];
    if (rec) rec[0] += moved;
    // Under water the bed moves as it is dug; land never goes below the sea.
    const wet = !!rec || this.palette[ch.tiles[tile]]?.layer === 'liquid';
    this.water.dig(c, r, wet ? moved : Math.max(this.seaLevel, before + moved) - Math.max(this.seaLevel, before));
    this.groundVersion++;
    ch.version++;
    this.saveChunkSoon(ch);
    return true;
  }

  /** The water's steps (T51b): `WATER_STEPS` every `WATER_EVERY` ticks while it moves; what one sees changes in the plans. */
  private waterTick(): void {
    if (!this.water.moving || this.tickCount % WATER_EVERY !== 0) return;
    for (let i = 0; i < WATER_STEPS && this.water.step(); i++);
    this.applyWater(this.water.changed(!this.water.moving));
    this.water.rest();
  }

  /** Writes what the flow changed into the places: the water of each tile, and the tiles that became water or land. */
  private applyWater(list: WaterChange[]): void {
    if (!list.length) return;
    const touched = new Set<Chunk>();
    const isWet = (code?: string) => this.palette[code ?? '']?.layer === 'liquid';
    for (const x of list) {
      const at = this.tileOf(x.col, x.row);
      if (!at?.ch.plan || at.ch.stage !== 'planned') continue;
      const { ch, tile } = at;
      const acqua = (at.ch.plan.water ??= {});
      const old = acqua[tile];
      const code = ch.tiles[tile];
      const round = (v: number) => Math.round(v * 1000) / 1000;
      let prima = old?.[2];
      if (x.wet && !isWet(code)) {
        // Land that became water: the kind of water it came from, or of a neighbour, or the first of the palette.
        const near = [x.from, [x.col + 1, x.row], [x.col - 1, x.row], [x.col, x.row + 1], [x.col, x.row - 1]].map((p) => p && this.tileAt(p[0], p[1]));
        const wetCode = near.find((t) => isWet(t)) ?? Object.keys(this.palette).find((t) => isWet(t));
        if (!wetCode) continue;
        prima = code;
        this.setTile(x.col, x.row, wetCode);
      } else if (!x.wet && isWet(code)) {
        // Water that dried: what it was, or the land beside it that does not block.
        const near = [[x.col + 1, x.row], [x.col - 1, x.row], [x.col, x.row + 1], [x.col, x.row - 1]].map(([a, b]) => this.tileAt(a, b));
        const land = prima && this.palette[prima] ? prima : (near.find((t) => t && !isWet(t) && !this.palette[t]?.solid) ?? this.pathCode());
        this.setTile(x.col, x.row, land);
        prima = undefined;
      }
      if (x.water < 0.001 && !isWet(ch.tiles[tile])) delete acqua[tile];
      else acqua[tile] = prima ? [round(x.bed), round(x.water), prima] : [round(x.bed), round(x.water)];
      touched.add(ch);
    }
    for (const ch of touched) {
      ch.version++;
      this.saveChunkSoon(ch);
    }
    this.groundVersion++;
  }

  /** The height (tiles) of the ground at a point of the simulation: the world's levels (T51a); lots lie flat. */
  groundAt(x: number, y: number): number {
    const col = Math.floor(x), row = Math.floor(y);
    const S = this.config.chunkSize;
    const cx = Math.floor(col / S), cy = Math.floor(row / S);
    const ch = this.chunks.get(this.chunkKey(cx, cy));
    if (!ch) return Math.max(this.seaLevel, this.relief.level(col, row)) * LEVEL;
    const field = this.levelsOf(ch);
    let l = this.levelCache.get(ch);
    if (l?.tiles !== ch.tiles || l.lots !== ch.lots || l.field !== field) {
      const levels = chunkLevels(ch.tiles, S, (code) => this.palette[code]?.layer === 'liquid', (c, r) => field[r * S + c], ch.lots);
      l = { tiles: ch.tiles, lots: ch.lots, field, levels };
      this.levelCache.set(ch, l);
    }
    return l.levels[(row - cy * S) * S + (col - cx * S)] * LEVEL;
  }

  /**
   * A height of the world (tiles) as voxels up the grid of a solid entity (it stands on the ground under its middle,
   * its lowest `base` voxels under it, T52b); none is its ground floor.
   */
  private levelIn(s: SolidForm, z: number | undefined): number {
    return z === undefined || !Number.isFinite(z) ? s.form.base : (z - this.groundAt(s.x, s.y)) * s.form.vpt + s.form.base;
  }

  /**
   * The height (tiles) of what one stands on at a point of the simulation (the ground, a structure's floor, a step
   * of a stair): with the height of the feet (`z`), the floor nearest to it (T53b: the floor above, the roof), else
   * the ground floor. Over a cellar (T52b) the terrain is not there: its floors may be under the ground.
   */
  floorAt(x: number, y: number, z?: number): number {
    let h = -Infinity, cellar = false;
    for (const s of this.solidForms.get(`${Math.floor(x)},${Math.floor(y)}`) ?? []) {
      const [lx, lz] = toLocal(x - s.x, y - s.y, s.yaw);
      const g = s.form.result!.grid;
      const vx = Math.floor(lx * s.form.vpt + g.X / 2), vy = Math.floor(lz * s.form.vpt + g.Y / 2);
      if (vx < 0 || vy < 0 || vx >= g.X || vy >= g.Y) continue;
      const i = vx + vy * g.X;
      const f = s.levels.z[levelAt(s.levels, i, this.levelIn(s, z))];
      const hole = !!s.hole?.[i];
      cellar ||= hole;
      // A model stands on the ground under its middle.
      if (hole || f > s.form.base) h = Math.max(h, this.groundAt(s.x, s.y) + (f - s.form.base) / s.form.vpt);
    }
    return cellar ? h : Math.max(h, this.groundAt(x, y));
  }

  /** How far under the ground (tiles) an entity's model goes (T52b): the renderer lays it this much lower. */
  sunk(id: Id): number {
    const fc: FormComp | undefined = this.ecs.get(id, 'form');
    const f = fc && this.forms.ready(fc.model, fc.seed, fc.tint);
    return f ? f.base / f.vpt : 0;
  }

  /**
   * The tiles of a place over which a model has its cellar (T52b), with how deep the terrain goes down there (tiles
   * under the ground): the renderer lowers the terrain to the cellar's bottom, the hole. A tile is of the cellar if
   * the voxel column under its middle is.
   */
  holesIn(ch: Chunk): Map<number, number> {
    const S = this.config.chunkSize;
    const out = new Map<number, number>();
    for (const { x, y, yaw, form: f, hole } of this.cellars) {
      if (!hole || x + f.reach < ch.cx * S || y + f.reach < ch.cy * S || x - f.reach >= (ch.cx + 1) * S || y - f.reach >= (ch.cy + 1) * S) continue;
      const g = f.result!.grid;
      const bottom = this.groundAt(x, y) - f.base / f.vpt;
      for (let row = Math.floor(y - f.reach); row <= Math.floor(y + f.reach); row++)
        for (let col = Math.floor(x - f.reach); col <= Math.floor(x + f.reach); col++) {
          const c = col - ch.cx * S, r = row - ch.cy * S;
          if (c < 0 || r < 0 || c >= S || r >= S) continue;
          const [lx, lz] = toLocal(col + 0.5 - x, row + 0.5 - y, yaw);
          const vx = Math.floor(lx * f.vpt + g.X / 2), vy = Math.floor(lz * f.vpt + g.Y / 2);
          if (vx < 0 || vy < 0 || vx >= g.X || vy >= g.Y || !hole[vx + vy * g.X]) continue;
          out.set(r * S + c, Math.max(out.get(r * S + c) ?? 0, this.groundAt(col + 0.5, row + 0.5) - bottom));
        }
    }
    return out;
  }

  /** The highest floor (tiles) at a point of the simulation no higher than `top`: where a jump that clears it lands (T70). */
  private floorBelow(x: number, y: number, top: number): number {
    let h = this.groundAt(x, y);
    for (const s of this.solidForms.get(`${Math.floor(x)},${Math.floor(y)}`) ?? []) {
      const [lx, lz] = toLocal(x - s.x, y - s.y, s.yaw);
      const g = s.form.result!.grid;
      const vx = Math.floor(lx * s.form.vpt + g.X / 2), vy = Math.floor(lz * s.form.vpt + g.Y / 2);
      if (vx < 0 || vy < 0 || vx >= g.X || vy >= g.Y) continue;
      const { start, z } = s.levels, i = vx + vy * g.X, lim = this.levelIn(s, top), B = s.form.base;
      // Never into a cellar (T52b): over the hole only floors no lower than a step under the ground.
      const low = s.hole?.[i] ? B - stepOf(s.form.vpt) : B + 1;
      for (let l = start[i]; l < start[i + 1]; l++) if (z[l] >= low && z[l] <= lim) h = Math.max(h, this.groundAt(s.x, s.y) + (z[l] - B) / s.form.vpt);
    }
    return h;
  }

  /** The structure whose floor is under a point of the simulation (the wanderer is inside it), if any. */
  structureAt(x: number, y: number): Id | undefined {
    for (const s of this.solidForms.get(`${Math.floor(x)},${Math.floor(y)}`) ?? []) {
      if (!this.ecs.has(s.id, 'structure')) continue;
      const [lx, lz] = toLocal(x - s.x, y - s.y, s.yaw);
      const g = s.form.result!.grid;
      const vx = Math.floor(lx * s.form.vpt + g.X / 2), vy = Math.floor(lz * s.form.vpt + g.Y / 2);
      if (vx >= 0 && vy >= 0 && vx < g.X && vy < g.Y && s.floor[vx + vy * g.X]) return s.id;
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
   * intervene (items, a new inhabitant, a new entity). The base logic is theirs; so are its changes.
   */
  async holdSession(force = false): Promise<string> {
    if (!force && (this.sessions >= 4 || this.generationHeld || this.ai.name === 'offline')) return 'none';
    this.sessions++;
    // The summary goes to the Arbiter's prompt (English since T310); the rules, people and places are the world's words.
    const rules = this.rules().slice(-12).map((r) => `- ${r.text}: ${r.possible ? 'possible' : 'not possible'}`).join('\n');
    const people = readPeople(this.files).people.slice(-10).map((p) => `- ${p.name}, ${p.job}`).join('\n');
    const chunks = [...this.chunks.values()].filter((c) => c.place).slice(-8).map((c) => `- ${c.place!.name}`).join('\n');
    const wearable = [...this.content.items.values()].filter((d) => d.equippable || d.slot || ['weapon', 'clothing'].includes(d.category)).length;
    const panels = this.uiPanels().map((p) => p.panel.title);
    const mech = `Mechanics with an interface: ${panels.join(', ') || 'none'}.${wearable && !this.uiPanels().some((p) => p.panel.elements.some((e) => e.type === 'slot')) ? ` MANCA: there are ${wearable} things to wear or hold but no slot to do it.` : ''}`;
    const summary = `${mech}\nRules born from play:\n${rules || '(none)'}\nPeople met:\n${people || '(none)'}\nPlaces seen:\n${chunks || '(none)'}\nExisting things: ${this.content.items.size}; kinds of inhabitants: ${[...this.modules.values()].filter((m) => m.manifest.persona).length}.`;
    let s;
    try {
      s = await councilSession(this.council, summary);
    } catch (e) {
      this.council.say('arbiter', 'errore', `sessione del Concilio: ${(e as Error).message}`);
      return 'none';
    }
    this.council.say('arbiter', 'info', `Sessione del Concilio: ${s.assessment}${s.action !== 'none' ? ` → interviene: ${s.action}${s.request ? ` («${s.request}»)` : ''}` : ''}`, undefined, 'council.session');
    if (s.action === 'items') await this.growContent(`sessione del Concilio: ${s.request ?? ''}`, 12, true);
    else if (s.action === 'inhabitant') await this.forgeModule(s.request ?? 'un nuovo abitante del mondo', 'agente', 'npc', false, COMUNE);
    else if (s.action === 'thing' && s.request) await this.forgeModule(s.request, 'agente', 'object', false, COMUNE);
    else if (s.action === 'mechanic') await this.forgeMechanic(s.request ?? 'equipaggiamento: slot per indossare e impugnare', COMUNE);
    else if (s.action === 'rune') await this.inventRune(`the session of the Council asks for it: ${s.request ?? 'an element no rune has'}`, COMUNE);
    return s.action;
  }

  async growCast(chunk?: ChunkInfo, force = false): Promise<boolean> {
    const max = this.config.ai.maxCast ?? 3;
    if (!force && (this.castUsed >= max || this.generationHeld || this.ai.name === 'offline')) return false;
    const people = [...this.modules.values()].filter((m) => m.manifest.persona);
    if (people.length >= 14) return false;
    this.castUsed++;
    const known = people.map((m) => m.manifest.name).join(', ') || 'nessuno';
    this.council.say('narrator', 'propone', `il mondo ha bisogno di volti nuovi (finora: ${known})`, undefined, 'forge.concept');
    const r = await this.forgeModule(`un nuovo abitante del mondo${chunk ? ` che si incontra in posti come «${chunk.name}» (${chunk.description})` : ''}: un mestiere, un'età e un carattere diversi da tutti quelli già noti (${known})`, 'cartografo', 'npc');
    return r.ok;
  }

  /** The Cartographer asked for something that does not exist yet: the Forge makes it, then it appears. */
  private async forgeForChunk(ch: Chunk, f: { concept: string; where: Where; takeable?: boolean }, pick: (w: Where, solid?: boolean) => number | undefined, at: (c: number) => { x: number; y: number }): Promise<void> {
    const tag = `${ch.key}:${f.concept}`;
    if (this.forging.has(tag) || this.forgesUsed >= this.config.ai.maxForges) return;
    this.forging.add(tag);
    this.forgesUsed++;
    const r = await this.forgeModule(`${f.concept} (per il luogo «${ch.place?.name}»: ${ch.place?.description})`, 'cartografo', undefined, false, ch.chi, f.takeable);
    this.forging.delete(tag);
    if (!r.ok || !r.id || !ch.plan) return;
    ch.plan.objects.push({ module: r.id, where: f.where });
    ch.plan.fresh = ch.plan.fresh.filter((x) => x !== f);
    await this.chunkStore.save(this.recordKey(ch), { plan: ch.plan });
    const m = this.modules.get(r.id);
    const tile = pick(f.where, this.isSolidModule(m));
    if (m && this.alive(ch) && tile !== undefined) this.spawnModuleEntity(m, at(tile).x, at(tile).y, ch.key, `${ch.key}#o${ch.plan.objects.length - 1}`);
  }

  private unloadChunk(ch: Chunk): void {
    // When it was left (T245f): at the return the kernel says how long it was away.
    if (ch.stage === 'planned' && ch.plan && !this.mirror) {
      ch.plan.seen = Math.round(this.time);
      this.saveChunkSoon(ch);
    }
    for (const id of this.ecs.query('chunk')) {
      if (this.ecs.get(id, 'chunk').key !== ch.key) continue;
      if (this.ecs.has(id, 'rune')) this.runesDirty = true;
      this.ecs.destroy(id);
    }
    this.chunks.delete(ch.key);
    this.npc.forgetWays();
    this.water.forget();
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
    if (this.corona.isInterior(this.wandererPos().x)) return false;
    const S = this.config.chunkSize;
    const R = this.config.circleRadius;
    const p = this.wandererPos();
    const { ox, oy } = this.offset();
    // Inside the circle the simulation has no visible edge: the carpet fills the view. A little beyond the circle it
    // still does, though cut away, so that who walks back in finds it there (T226).
    const clamp = Math.hypot(p.x, p.y) >= R + Kernel.WORLD_BEYOND_EDGE ? R : Infinity;
    const x0 = Math.max(p.x - this.view.w / 2, -clamp) + ox;
    const x1 = Math.min(p.x + this.view.w / 2, clamp) + ox;
    const y0 = Math.max(p.y - this.view.h / 2, -clamp) + oy;
    const y1 = Math.min(p.y + this.view.h / 2, clamp) + oy;
    const pc = this.wandererCarpet();
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

  /** `parts`: the state a thing brings back into the world (T292), over its manifest's components and under the kernel's. */
  spawnModuleEntity(m: ModuleEntry, x: number, y: number, chunkKey?: string, origin?: string, parts?: ThingParts): Id {
    const man = m.manifest;
    if (man.kind === 'item') return this.spawnItem(man.id, x, y, 1, chunkKey, origin);
    const comps: Record<string, any> = {
      ...clone(man.components ?? {}),
      ...clone(readParts(parts) ?? {}),
      pos: { x, y },
      module: { id: man.id },
      body: { r: man.physics?.radius ?? 0.35, solid: !!man.physics?.solid && !man.physics?.pushable, pushable: !!man.physics?.pushable, mass: man.physics?.mass ?? 1, friction: man.physics?.friction ?? 0.6 },
    };
    if (man.appearance) comps.glyph = this.glyphOf(man.appearance);
    comps.form = this.formFor(man, origin ?? `${man.id}@${x.toFixed(2)},${y.toFixed(2)}`);
    const done = origin ? this.savedForms.get(origin) : undefined;
    if (done?.length) comps.form.done = [...done];
    if (man.interaction) comps.interact = { type: man.interaction.type };
    if (man.persona) comps.mind = { mode: 'wander', mood: 'tranquillo', history: [], ...(comps.mind ?? {}) } satisfies Mind;
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
      if (id === this.wandererEntity || exclude.includes(id) || (!this.ecs.has(id, 'module') && !this.ecs.has(id, 'pickup') && !this.ecs.has(id, 'remote'))) continue;
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
    if (id === this.wandererEntity || !this.ecs.alive.has(id) || this.ecs.has(id, 'carpet')) return;
    const m = this.modules.get(this.ecs.get(id, 'module')?.id)?.manifest;
    const p = this.ecs.get(id, 'pos');
    const origin = this.ecs.get(id, 'origin')?.key;
    const box: Container | undefined = this.ecs.get(id, 'container');
    if (origin) this.consumed.add(origin);
    // A thing moved that breaks is gone for good, wherever it stood (T292).
    if (origin) this.moved.delete(origin);
    // A building that falls is rebuilt (T245d): its lot becomes a venture of its place, once the building is gone.
    const ruin = this.ecs.get(id, 'structure');
    const ruinForm: FormComp | undefined = this.ecs.get(id, 'form');
    this.ecs.destroy(id);
    if (ruin && origin && p) this.npc.buildingFell(origin, ruin, ruinForm, p);
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
      const pc = this.wandererCarpet();
      if (Math.abs(pc.x - (col + 0.5)) < 1 && Math.abs(pc.y - (row + 0.5)) < 1) return false;
    }
    const tile = (row - ch.cy * S) * S + (col - ch.cx * S);
    if (ch.tiles[tile] === code) return true;
    ch.tiles = ch.tiles.slice(0, tile) + code + ch.tiles.slice(tile + 1);
    ch.version++;
    (ch.plan.edits ??= {})[String(tile)] = code;
    // The day it was written (T245b): what ripens counts from here.
    (ch.plan.days ??= {})[String(tile)] = this.day();
    this.npc.forgetWays();
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

  /** The lot whose floor contains this carpet point (for roofs and interiors). */
  lotAt(x: number, y: number): { chunk: Chunk; lot: Lot } | undefined {
    const S = this.config.chunkSize;
    const ch = this.chunkAt(x, y);
    if (!ch) return undefined;
    const tile = (Math.floor(y) - ch.cy * S) * S + (Math.floor(x) - ch.cx * S);
    const lot = ch.lots.find((b) => b.floor.includes(tile) || b.doors.includes(tile));
    return lot ? { chunk: ch, lot } : undefined;
  }

  private freeTile(col: number, row: number): boolean {
    const t = this.tileAt(col, row);
    if (t && this.palette[t]?.solid) return false;
    return !this.solidTiles.has(`${col},${row}`);
  }

  /** Carpet-space collision test of a box of half-size r, whose feet are at height z (tiles; none: the ground floor). */
  free(x: number, y: number, r: number, z?: number): boolean {
    if (![x, y, r].every(Number.isFinite)) return false;
    for (const [dx, dy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) if (!this.freeTile(Math.floor(x + dx), Math.floor(y + dy))) return false;
    return !this.formBlocks(x, y, r, z);
  }

  /** Real-space collision: carpet inside the circle, corona walkable, nothing beyond it. */
  freeReal(x: number, y: number, r: number, z?: number): boolean {
    if (![x, y, r].every(Number.isFinite)) return false;
    const R = this.config.circleRadius;
    const { ox, oy } = this.offset();
    // Inside the studio's buildings: rooms with walls, shelves and desks.
    if (this.corona.isInterior(x)) return [[-r, -r], [r, -r], [-r, r], [r, r]].every(([dx, dy]) => this.corona.free(x + dx, y + dy));
    let sim = false;
    for (const [dx, dy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) {
      const px = x + dx;
      const py = y + dy;
      const d = Math.hypot(px, py);
      if (d >= this.corona.outer) return false;
      if (d >= R) {
        if (!this.corona.free(px, py)) return false;
        continue;
      }
      sim = true;
      if (!this.freeTile(Math.floor(px + ox), Math.floor(py + oy))) return false;
    }
    return !sim || !this.formBlocks(x + ox, y + oy, r, z);
  }

  /** The models under a box (carpet space, half-size r), each with the box in its own frame. */
  private formsUnder(x: number, y: number, r: number): Array<{ s: SolidForm; box: [number, number, number, number] }> {
    const corners = [[-r, -r], [r, -r], [-r, r], [r, r]];
    const seen = new Set<SolidForm>();
    const out: Array<{ s: SolidForm; box: [number, number, number, number] }> = [];
    for (const [dx, dy] of corners)
      for (const s of this.solidForms.get(`${Math.floor(x + dx)},${Math.floor(y + dy)}`) ?? []) {
        if (seen.has(s)) continue;
        seen.add(s);
        let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
        for (const [ex, ey] of corners) {
          const [lx, lz] = toLocal(x + ex - s.x, y + ey - s.y, s.yaw);
          x0 = Math.min(x0, lx), z0 = Math.min(z0, lz), x1 = Math.max(x1, lx), z1 = Math.max(z1, lz);
        }
        out.push({ s, box: [x0, z0, x1, z1] });
      }
    return out;
  }

  /**
   * How high the tallest entity under a box goes (carpet space, tiles) for a jump from a floor `base` high: what
   * starts below base + JUMP_UP (on a floor above, the ceiling over it does not count, T70); the ground if nothing is there.
   */
  private heightOver(x: number, y: number, r: number, base: number): number {
    let h = this.groundAt(x, y);
    for (const { s, box } of this.formsUnder(x, y, r)) {
      const t = topUnder(s.form, s.levels, ...box, this.levelIn(s, base), JUMP_UP * s.form.vpt);
      if (t !== undefined) h = Math.max(h, this.groundAt(s.x, s.y) + t);
    }
    return h;
  }

  /**
   * Whether a box (carpet space, half-size r) can be flown over by a jump that starts on a floor `base` high (T56b):
   * water and entities no higher than JUMP_UP above it can, walls and rocks of the terrain and taller models cannot.
   */
  private airFree(x: number, y: number, r: number, base: number): boolean {
    for (const [dx, dy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) {
      const t = this.tileAt(Math.floor(x + dx), Math.floor(y + dy));
      const def = t ? this.palette[t] : undefined;
      if (!t || (def?.solid && def.layer !== 'liquid')) return false;
    }
    return this.heightOver(x, y, r, base) - base <= JUMP_UP;
  }

  /**
   * A jump (T56b, Space): towards where the wanderer walks (or faces), over what is no higher than JUMP_UP, to the
   * nearest place a tile or more away and within JUMP_FAR where the feet can rest (not water, not a floor out of
   * reach); with none, a jump on the spot. Only in the simulation: false in the corona and the studio (nothing
   * changes there), in a thin client (the server would put the wanderer back) or while already in the air.
   */
  jump(): boolean {
    if (this.mirror || this.zone !== 'sim' || this.ecs.has(this.wandererEntity, 'jump')) return false;
    const pl = this.wandererComp();
    const r = Number(this.ecs.get(this.wandererEntity, 'body')?.r) || 0.3;
    let dx = 0, dy = 0;
    if (this.wanderer().id === this.inputFor) {
      dx = (this.input.isHeld('right') ? 1 : 0) - (this.input.isHeld('left') ? 1 : 0);
      dy = (this.input.isHeld('down') ? 1 : 0) - (this.input.isHeld('up') ? 1 : 0);
    }
    if (!dx && !dy) [dx, dy] = ({ left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] } as Record<string, number[]>)[pl?.facing] ?? [0, 1];
    const n = Math.hypot(dx, dy);
    dx /= n;
    dy /= n;
    const from = this.wandererCarpet();
    const real = this.wandererPos();
    // From the floor one stands on (T70): the ground floor, the floor above, the roof.
    const h0 = this.floorAt(from.x, from.y, real.z);
    let land: { d: number; h: number } | undefined;
    let clear = 0;
    for (let i = 1; i * 0.1 <= JUMP_FAR + 1e-6 && !land; i++) {
      const d = i * 0.1, x = from.x + dx * d, y = from.y + dy * d;
      // Never out of the circle: what lies beyond is not jumped into.
      if (Math.hypot(real.x + dx * d, real.y + dy * d) > this.config.circleRadius - r - 0.5) break;
      if (!this.airFree(x, y, r, h0)) break;
      clear = Math.max(clear, this.heightOver(x, y, r, h0) - h0);
      if (i < 10) continue;
      // It lands on the highest floor it clears, if the body stands there.
      const h = this.floorBelow(x, y, h0 + JUMP_UP);
      if (this.free(x, y, r, h)) land = { d, h };
    }
    const to = land ? { x: from.x + dx * land.d, y: from.y + dy * land.d } : from;
    const jc: JumpComp = { from, to, h0, h1: land?.h ?? h0, peak: Math.min(JUMP_UP + 0.25, Math.max(0.45, clear + 0.25)), t: 0, dur: 0.32 + 0.08 * (land?.d ?? 0) };
    this.ecs.set(this.wandererEntity, 'jump', jc);
    if (pl && land) pl.facing = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    this.bus.emit('wanderer:jumped', { id: this.wanderer().id, far: land?.d ?? 0 });
    return true;
  }

  /** The jump under way, if any: how far along it is (0-1) and the height of the feet (tiles), for the renderer. */
  jumping(): { s: number; y: number } | undefined {
    const j: JumpComp | undefined = this.ecs.get(this.wandererEntity, 'jump');
    if (!j) return undefined;
    const s = Math.max(0, Math.min(1, j.t / j.dur));
    return { s, y: j.h0 + (j.h1 - j.h0) * s + 4 * j.peak * s * (1 - s) };
  }

  /** The jump carries the wanderer along its line, whatever the walking did this tick; landed, it ends. */
  private jumpTick(dt: number): void {
    const j: JumpComp | undefined = this.ecs.get(this.wandererEntity, 'jump');
    if (!j) return;
    const ok = [j.from?.x, j.from?.y, j.to?.x, j.to?.y, j.t, j.dur, j.h0, j.h1, j.peak].every(Number.isFinite) && j.dur > 0;
    if (!ok || this.zone !== 'sim') return void this.ecs.remove(this.wandererEntity, 'jump');
    j.t += dt;
    const s = Math.min(1, j.t / j.dur);
    const { ox, oy } = this.offset();
    // The feet go from one floor to the other (T70): landed, they stand on the floor of the landing.
    Object.assign(this.wandererPos(), { x: j.from.x + (j.to.x - j.from.x) * s - ox, y: j.from.y + (j.to.y - j.from.y) * s - oy, z: j.h0 + (j.h1 - j.h0) * s });
    if (s >= 1) this.ecs.remove(this.wandererEntity, 'jump');
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
    this.runeTiles = tileIndex(runes);
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
      // A line runs as who wrote it (T37); in a multiplayer game, only the master's may write the bindings.
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

  private wandererTile(): { col: number; row: number } {
    const pc = this.wandererCarpet();
    return { col: Math.floor(pc.x), row: Math.floor(pc.y) };
  }

  private facingDelta(): [number, number] {
    switch (this.wandererComp()?.facing) {
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
    const { col, row } = this.wandererTile();
    const [dx, dy] = this.facingDelta();
    const id = which !== undefined ? (this.ecs.has(which, 'rune') ? which : undefined) : (this.runeTiles.get(`${col},${row}`) ?? this.runeTiles.get(`${col + dx},${row + dy}`));
    if (id === undefined) return false;
    const rune: RuneComp = this.ecs.get(id, 'rune');
    // A rune is a thing: it goes into the rune pouch (or the slots), and onto the phrase being composed.
    if (!this.give(`rune:${rune.token}`, 1)) {
      this.message("Non hai più posto per altre rune.", 'warn');
      return true;
    }
    if (rune.origin) this.consumed.add(rune.origin);
    this.ecs.destroy(id);
    const hand = this.phrase();
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
    const { col, row } = this.wandererTile();
    const facing = this.wandererComp()?.facing;
    const start = facing === 'left' ? { col: col - width, row } : facing === 'right' ? { col: col + 1, row } : { col, row: row + (facing === 'up' ? -1 : 1) };
    for (let i = 0; i < width; i++) {
      const c = start.col + i;
      if (this.runeTiles.has(`${c},${start.row}`) || !this.freeTile(c, start.row) || !this.inCircle(c, start.row)) {
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
    const hand = this.phrase();
    hand.tokens = hand.tokens.filter((t) => t !== COUNCIL_RUNE);
    hand.sel = Math.max(0, Math.min(hand.sel, hand.tokens.length - 1));
    const hall = this.corona.building('concilio');
    if (!this.isMaster() || !hall) {
      this.message('La runa resta muta.', 'warn');
      return false;
    }
    this.offCarpet.add(this.wandererEntity);
    Object.assign(this.wandererPos(), this.corona.entrance(hall));
    this.updateZone();
    this.bus.emit('studio:teleport', {});
    this.message(hall.name, 'good');
    return true;
  }

  /**
   * Runes the Council gives the wanderer who acts (T42f: the master asked the Referente): into the rune pouch, onto the
   * phrase. Returns those that fit.
   */
  grantRunes(tokens: string[]): string[] {
    const given: string[] = [];
    for (const t of askedRunes(tokens)) if (this.give(`rune:${t}`, 1)) given.push(t);
    if (!given.length) return given;
    const hand = this.phrase();
    hand.tokens.push(...given);
    hand.sel = hand.tokens.length - 1;
    this.message(`Il Concilio ti dà: ${given.map((t) => `«${t}»`).join(' ')}`, 'good');
    return given;
  }

  /** In a multiplayer game the master always carries the Council's rune, and nobody else does (T37). */
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
    const hand = this.phrase();
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
    const hand = this.phrase();
    if (index < 0 || index >= hand.tokens.length) return;
    hand.tokens.splice(index, 1);
    hand.sel = Math.max(0, Math.min(hand.sel, hand.tokens.length - 1));
  }

  /** The phrase never uses runes the player no longer has (dropped, stored away, spent). */
  syncPhrase(): void {
    const hand = this.phrase();
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

  inscribePhrase(): void {
    const hand = this.phrase();
    if (this.inscribe(hand.tokens)) {
      hand.tokens = [];
      hand.sel = 0;
    }
  }

  dropSelected(): void {
    const hand = this.phrase();
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
    const hand = this.phrase();
    const n = hand.tokens.length;
    if (!n) return;
    const to = (hand.sel + delta + n) % n;
    if (move) [hand.tokens[hand.sel], hand.tokens[to]] = [hand.tokens[to], hand.tokens[hand.sel]];
    hand.sel = to;
  }

  /** Reorders the rune hand (drag and drop in the inventory). */
  moveRune(from: number, to: number): void {
    const t = this.phrase().tokens;
    if (from < 0 || from >= t.length || to < 0 || to >= t.length) return;
    const [tok] = t.splice(from, 1);
    t.splice(to, 0, tok);
    this.phrase().sel = to;
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
    // A garment is put on or taken off (T290): what it is worn for is its own module's to say.
    if (!custom && !def?.effects && this.wornZone(slot.item)) return this.wearSlot(index);
    if (!custom && def?.equippable && !def.effects && !['light', 'clothing'].includes(def.category)) return this.equipSlot(index);
    const { value, failed } = this.runModule(custom ?? 'core.items', custom ? 'on_use' : 'use', this.wandererEntity, slot.item);
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
    // What is held is not worn (T290): taken in hand, it comes off the body.
    if (inv.equipped === index && isWorn(inv, index)) takeOff(inv, index);
    // A thing of the world goes over the head (T292), and F puts it down.
    const held = isThing(slot.item) ? `Porti ${info.name} sopra la testa (F per posare davanti a te).` : `Impugni ${info.name}. F per usarlo su ciò che hai davanti.`;
    this.message(inv.equipped === null ? `Riponi ${info.name}.` : held);
  }

  /** The zone of the body a thing goes on (T290, ADR-0180), or undefined: its place, or the words of a garment without one. */
  wornZone(item: string): WornZone | undefined {
    if (isThing(item)) return undefined;
    const def = this.content.get(item);
    if (!def) return undefined;
    // Asked at every frame for what every figure wears: read once per definition (a pack read again makes new ones).
    let zone = this.wornZones.get(def);
    if (zone === undefined) this.wornZones.set(def, (zone = wornZoneOf(def) ?? null));
    return zone ?? undefined;
  }
  private wornZones = new WeakMap<object, WornZone | null>();

  /** What the wanderer acting now wears (T290): zone → the thing's id, only what holds (`wornSlots`). */
  outfit(): Partial<Record<WornZone, string>> {
    return wornItems(this.inventory(), (item) => this.wornZone(item));
  }

  /**
   * Puts on, or takes off, the thing of a slot (T290, ADR-0180): on its zone of the body, in place of what was there (which stays in
   * the inventory); worn already, it comes off. What is held in hand is let go of: one does not wear what one wields.
   */
  wearSlot(index: number): void {
    const inv = this.inventory();
    const slot = inv.slots[index];
    if (!slot) return;
    const info = this.itemInfo(slot.item);
    const zone = this.wornZone(slot.item);
    if (!zone) {
      this.message(`${info.name} non si indossa.`, 'warn');
      return;
    }
    keepWornMarks(inv, (item) => this.wornZone(item));
    if (inv.worn?.[zone] === index) {
      takeOff(inv, index);
      this.message(`Ti togli ${info.name}.`);
    } else {
      const before = inv.worn?.[zone];
      const was = before !== undefined ? inv.slots[before] : null;
      inv.worn = { ...inv.worn, [zone]: index };
      if (inv.equipped === index) inv.equipped = null;
      this.message(was ? `Ti togli ${this.itemInfo(was.item).name} e indossi ${info.name}.` : `Indossi ${info.name} ${ZONE_WORDS[zone]}.`);
    }
    this.bus.emit('item:worn', { item: slot.item, zone, worn: inv.worn?.[zone] === index });
    this.bus.emit('inventory:changed', {});
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
    // A thing of the world carried goes down in front (T292).
    if (isThing(item)) return void this.placeCarried(this.inventory().equipped!);
    const pc = this.wandererCarpet();
    const [dx, dy] = this.facingDelta();
    const t = target ?? this.nearest(pc.x + dx * 0.9, pc.y + dy * 0.9, 1.1) ?? null;
    const def = this.content.get(item);
    if (def?.module && this.sandbox.has(def.module, 'on_action')) {
      const { value, failed } = this.runModule(def.module, 'on_action', this.wandererEntity, t, item);
      if (!failed && typeof value === 'string' && value) this.message(value);
    } else if (t !== null && def?.tags.includes('taglio') && this.hasTag(t, 'tagliabile')) {
      this.breakEntity(t);
      this.message(`Con ${def.name} abbatti ciò che hai davanti.`);
    } else this.message(`${this.itemInfo(item).name} non fa nulla così.`, 'warn');
    this.bus.emit('item:action', { item, target: t });
  }

  dropSlot(index: number, count?: number): void {
    if (this.zone !== 'sim') return;
    // A thing of the world goes down whole, in front, where the place lets it (T292); else it stays carried.
    if (isThing(this.inventory().slots[index]?.item)) return void this.placeCarried(index);
    const taken = takeFromSlot(this.inventory(), index, count);
    if (!taken) return;
    const pc = this.wandererCarpet();
    const [dx, dy] = this.facingDelta();
    const id = this.spawnItem(taken.item, pc.x + dx * 0.8, pc.y + dy * 0.8, taken.count);
    if (taken.inv && this.ecs.alive.has(id)) this.ecs.get(id, 'pickup').inv = taken.inv;
    this.syncPhrase();
    this.message(`Posi: ${this.itemInfo(taken.item).name}${taken.count > 1 ? ` ×${taken.count}` : ''}`);
  }

  // --- Putting things down on furniture (T291, ADR-0150) ------------------------------------------

  /** A piece of furniture (T291): a thing of the world whose model is of the class `mobile` (a chest, a table, a bed, a barrel), not someone. */
  private isFurniture(id: Id): boolean {
    const fc: FormComp | undefined = this.ecs.get(id, 'form');
    const m = this.modules.get(this.ecs.get(id, 'module')?.id)?.manifest;
    return !!fc && !!m && !m.persona && !this.ecs.has(id, 'structure') && this.forms.classOf(fc.model).id === 'furniture';
  }

  /** Whether the menu of a thing offers to put down on it what is held (T291): something with a body that is not someone nor a building, or what lies on furniture. */
  private offersPlace(id: Id): boolean {
    if (this.ecs.has(id, 'placed')) return true;
    const m = this.modules.get(this.ecs.get(id, 'module')?.id)?.manifest;
    return !!m && !m.persona && this.ecs.has(id, 'form') && this.ecs.has(id, 'body') && !this.ecs.has(id, 'structure') && !this.ecs.has(id, 'pickup');
  }

  /** The furniture a thing lying on furniture lies on (T291): the solid thing under it with a shelf at its height, while it is there. */
  supportOf(id: Id): Id | undefined {
    const p = this.ecs.get(id, 'pos');
    const placed = this.ecs.get(id, 'placed');
    if (!p || !placed || !Number.isFinite(placed.z) || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return undefined;
    for (const s of this.solidForms.get(`${Math.floor(p.x)},${Math.floor(p.y)}`) ?? []) {
      if (s.id === id || !this.isFurniture(s.id)) continue;
      if (this.restsOn(s, p.x, p.y, placed.z)) return s.id;
    }
    return undefined;
  }

  /** Whether a point of the simulation at height z (tiles) is on a floor of a solid model: a shelf, its top. */
  private restsOn(s: SolidForm, x: number, y: number, z: number): boolean {
    const [lx, lz] = toLocal(x - s.x, y - s.y, s.yaw);
    const g = s.form.result!.grid;
    const vx = Math.floor(lx * s.form.vpt + g.X / 2), vy = Math.floor(lz * s.form.vpt + g.Y / 2);
    if (vx < 0 || vy < 0 || vx >= g.X || vy >= g.Y) return false;
    const i = vx + vy * g.X;
    const h = this.levelIn(s, z);
    for (let l = s.levels.start[i]; l < s.levels.start[i + 1]; l++) if (Math.abs(s.levels.z[l] - h) < 0.5) return true;
    return false;
  }

  /** The shape of an item on a shelf (T291): its model's, or a small block while its model is not there. */
  private shapeOfItem(item: string, fc?: FormComp): ItemShape {
    const look = fc ?? this.itemLook(item);
    const f = this.forms.ready(look.model, look.seed, look.tint);
    return (f?.result && itemShape(f.result.grid, f.result.palette, f.vpt)) || blockShape();
  }

  /** Who stands somewhere now (T291): every wanderer in the world and every figure, with the height of their feet (none on the ground). */
  private standing(): Array<{ x: number; y: number; z?: number; r: number }> {
    const out: Array<{ x: number; y: number; z?: number; r: number }> = [];
    for (const w of this.wanderersById.keys()) {
      if (!this.inWorld(w)) continue;
      this.as(w, () => {
        const c = this.wandererCarpet();
        out.push({ x: c.x, y: c.y, z: this.wandererPos().z, r: Number(this.ecs.get(this.wandererEntity, 'body')?.r) || 0.3 });
      });
    }
    for (const id of this.ecs.query('pos', 'body')) {
      if (this.ecs.has(id, 'player') || this.ecs.has(id, 'pickup') || !(this.ecs.has(id, 'mind') || this.ecs.has(id, 'wander') || this.ecs.has(id, 'identity'))) continue;
      const p = this.ecs.get(id, 'pos');
      out.push({ x: p.x, y: p.y, z: p.z, r: Number(this.ecs.get(id, 'body').r) || 0.3 });
    }
    return out;
  }

  /**
   * Puts what the wanderer holds onto a piece of furniture (T291): `target` is the furniture, or something lying on it (then the same
   * furniture). Where it goes the shapes of both decide (`findSpot`); it leaves the hand and lies there, at the shelf's height, for every
   * wanderer, until someone takes it; the save keeps it. False, with a sentence of the world, when it does not go.
   */
  async placeOn(target: Id): Promise<string | false> {
    const who = this.wanderer().id;
    // The shapes of what is put down and of where, the first time they are seen: a program runs in a worker, or in a promise.
    const held = equippedItem(this.inventory());
    const look = held ? this.itemLook(held) : undefined;
    const under = this.ecs.has(target, 'placed') ? this.supportOf(target) : target;
    const fc: FormComp | undefined = under !== undefined && this.ecs.alive.has(under) ? this.ecs.get(under, 'form') : undefined;
    const waits: Array<Promise<unknown>> = [];
    if (look && !this.forms.ready(look.model, look.seed, look.tint)) waits.push(this.forms.wait(look.model, look.seed, look.tint));
    if (fc && !this.forms.ready(fc.model, fc.seed, fc.tint)) waits.push(this.forms.wait(fc.model, fc.seed, fc.tint));
    if (waits.length) {
      await Promise.all(waits);
      // Who asked may have gone meanwhile: nobody does it in their place.
      if (!this.wanderersById.has(who)) return false;
    }
    return this.as(who, () => this.putOn(target));
  }

  private putOn(target: Id): string | false {
    const refuse = (text: string): false => (this.message(text, 'warn'), false);
    const inv = this.inventory();
    const at = inv.equipped;
    const held = at !== null ? inv.slots[at] : null;
    if (at === null || !held) return refuse('Non impugni nulla da posare (1–6 o inventario).');
    if (this.zone !== 'sim' || !this.ecs.alive.has(target)) return false;
    const what = this.itemInfo(held.item).name;
    // A thing of the world carried goes down on the ground, as itself (T292), never on a shelf as a thing lying there.
    if (isThing(held.item)) return refuse(putRefusal('taken', what));
    const id = this.ecs.has(target, 'placed') ? this.supportOf(target) : target;
    if (id === undefined) return refuse(`${this.nameOf(target)} non sta su un mobile.`);
    const name = this.nameOf(id);
    if (!this.isFurniture(id)) return refuse(`${name} non è un mobile: lì sopra non si posa niente.`);
    const body = this.ecs.get(id, 'body');
    if (!body?.solid || body.pushable) return refuse(`${name} si muove: lì sopra non resterebbe fermo niente.`);
    const fc: FormComp = this.ecs.get(id, 'form');
    const f = this.forms.ready(fc.model, fc.seed, fc.tint);
    const sp = this.ecs.get(id, 'pos');
    if (!f?.result || !sp || !Number.isFinite(sp.x) || !Number.isFinite(sp.y)) return refuse(`${name} non ha un piano dove stia ${what}.`);
    const g = f.result.grid;
    const support: Support = { levels: this.groundOf(id, fc, f).levels, X: g.X, Y: g.Y, vpt: f.vpt, base: f.base };
    // Heights of the world (tiles) as heights of its grid (voxels), points of the world in its own frame.
    const floor = this.groundAt(sp.x, sp.y);
    const toShelf = (z: number) => (z - floor) * f.vpt + f.base;
    const local = (x: number, y: number) => toLocal(x - sp.x, y - sp.y, fc.yaw);
    const things = new Map<number, Set<number>>();
    const bodies = new Map<number, Set<number>>();
    const take = (to: Map<number, Set<number>>, h: number, cells: number[]) => {
      if (!cells.length) return;
      let s = to.get(h);
      if (!s) to.set(h, (s = new Set()));
      for (const c of cells) s.add(c);
    };
    // What lies there already takes the rectangle of its footprint; who stands there, the disc of their body.
    const near = f.reach + 1;
    for (const other of this.ecs.query('placed', 'pickup', 'pos')) {
      const p = this.ecs.get(other, 'pos');
      const z = this.ecs.get(other, 'placed').z;
      if (!(Math.hypot(p.x - sp.x, p.y - sp.y) <= near) || !Number.isFinite(z)) continue;
      const ofc: FormComp | undefined = this.ecs.get(other, 'form');
      const [lx, ly] = local(p.x, p.y);
      take(things, Math.round(toShelf(z)), cellsOf(support, this.shapeOfItem(this.ecs.get(other, 'pickup').item, ofc), lx, ly, turnsBetween(ofc?.yaw ?? 0, fc.yaw)));
    }
    for (const b of this.standing()) {
      if (b.z === undefined || !Number.isFinite(b.z) || !(Math.hypot(b.x - sp.x, b.y - sp.y) <= near)) continue;
      const [lx, ly] = local(b.x, b.y);
      take(bodies, Math.round(toShelf(b.z)), discCells(support, lx, ly, b.r));
    }
    const wc = this.wandererCarpet();
    const feet = this.floorAt(wc.x, wc.y, this.wandererPos().z);
    const [fx, fy] = local(wc.x, wc.y);
    const r = findSpot(support, this.shapeOfItem(held.item), { things, bodies, from: { x: fx, y: fy }, reach: PLACE_REACH, top: toShelf(feet + PLACE_UP), bottom: toShelf(feet - PLACE_DOWN) });
    if ('fail' in r) return refuse(placeRefusal(r.fail, name, what));
    const taken = takeFromSlot(inv, at, 1)!;
    const c = Math.cos(fc.yaw), s = Math.sin(fc.yaw);
    const z = floor + (r.spot.h - f.base) / f.vpt;
    const item = this.spawnItem(taken.item, sp.x + r.spot.x * c + r.spot.y * s, sp.y - r.spot.x * s + r.spot.y * c, 1);
    const turn = fc.yaw + (r.spot.turns * Math.PI) / 2;
    this.ecs.get(item, 'form').yaw = ((turn % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    this.ecs.set(item, 'placed', { z });
    this.ecs.get(item, 'pos').z = z;
    if (taken.inv) this.ecs.get(item, 'pickup').inv = taken.inv;
    this.syncPhrase();
    this.bus.emit('item:placed', { item: taken.item, on: id });
    const said = `Posi ${what} su ${name}.`;
    this.message(said);
    return said;
  }

  // --- Taking things of the world and putting them down elsewhere (T292, ADR-0168) -----------------------------------------------

  /** The things moved from where their place made them (T292), by origin: where they stand; the save keeps them (`moved`). */
  private moved = new Map<string, MovedRecord>();

  /** The manifest of a thing one can take (T292): an entity of a module that says `takeable`, not someone, not a building, not an item. */
  private takeableOf(id: Id): Manifest | undefined {
    if (!this.ecs.alive.has(id) || ['structure', 'pickup', 'player', 'remote', 'identity', 'mind', 'rune', 'carpet'].some((c) => this.ecs.has(id, c))) return undefined;
    const m = this.modules.get(this.ecs.get(id, 'module')?.id)?.manifest;
    return m && m.kind === 'entity' && m.takeable === true && !m.persona ? m : undefined;
  }

  /** A container as its first opening fills it: taking a thing fills it the same way (T292), to know whether it is empty. */
  private fillContainer(id: Id): Container | undefined {
    const box = this.container(id);
    if (!box) return undefined;
    if (!box.filled) {
      box.filled = true;
      const origin = this.ecs.get(id, 'origin')?.key ?? `e${id}`;
      const rng = new Rng(hash32(this.config.seed, hashStr(origin), 7));
      for (const l of this.content.roll(box.loot, rng, [...this.wanted])) addItem(box.inv, l.item, l.count, this.itemSpec(l.item));
    }
    return box;
  }

  /** Why the wanderer acting does not take a thing now, or undefined (T292). A container never opened is filled as opening it would. */
  private takeFailure(id: Id): TakeFailure | undefined {
    if (this.zone !== 'sim') return 'nowhere';
    const p = this.ecs.get(id, 'pos');
    const c = this.wandererCarpet();
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || Math.hypot(p.x - c.x, p.y - c.y) > TAKE_REACH) return 'far';
    // Emptied first, so that no bag goes inside a bag: a chest with something in it, a thing that carries things.
    if (this.ecs.has(id, 'container') && this.fillContainer(id)!.inv.slots.some(Boolean)) return 'full';
    const own: Inventory | undefined = this.ecs.get(id, 'inventory');
    if (own?.slots?.some(Boolean)) return 'full';
    if (this.ecs.query('placed', 'pickup').some((o) => this.supportOf(o) === id)) return 'on-top';
    if (this.standsOn(id)) return 'someone';
    if (!this.inventory().slots.includes(null)) return 'no-room';
    return undefined;
  }

  /** Whether someone stands on a solid thing (on its top, on its shelf): a wanderer or a figure whose feet are on a floor of its form. */
  private standsOn(id: Id): boolean {
    const p = this.ecs.get(id, 'pos');
    const s = (this.solidForms.get(`${Math.floor(p.x)},${Math.floor(p.y)}`) ?? []).find((x) => x.id === id);
    if (!s) return false;
    return this.standing().some((b) => b.z !== undefined && Number.isFinite(b.z) && b.z > this.groundAt(b.x, b.y) + 1e-6 && Math.hypot(b.x - s.x, b.y - s.y) <= s.form.reach + b.r && this.restsOn(s, b.x, b.y, b.z));
  }

  /** An origin for a thing that has none (made by code, left by something broken): the one its look was seeded with, made unique. */
  private freshOrigin(module: string, p: { x: number; y: number }): string {
    const base = `${module}@${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    const used = (o: string) => this.consumed.has(o) || this.moved.has(o) || this.ecs.query('origin').some((e) => this.ecs.get(e, 'origin').key === o);
    let o = base;
    for (let i = 2; used(o); i++) o = `${base}#${i}`;
    return o;
  }

  /**
   * Takes a thing of the world (T292): it leaves the world and is the item `thing:<module>` in the first free slot, in hand, with who
   * it is (its origin, the seed of its look) and its state (its components that are not the kernel's). The place it was born in no
   * longer makes it (`consumed`); its container stays as it was left, empty; the actions done on its model stay. False, with a
   * sentence of the world, when it is not taken: it is not a thing one takes, something is in it or on it, someone stands on it, no room.
   */
  takeThing(id: Id): string | false {
    const refuse = (text: string): false => (this.message(text, 'warn'), false);
    if (!this.ecs.alive.has(id)) return false;
    const name = this.nameOf(id);
    const m = this.takeableOf(id);
    if (!m) return refuse(takeRefusal('fixed', name));
    const why = this.takeFailure(id);
    if (why) return refuse(takeRefusal(why, name));
    const p = this.ecs.get(id, 'pos');
    const fc: FormComp | undefined = this.ecs.get(id, 'form');
    const origin: string = this.ecs.get(id, 'origin')?.key ?? this.freshOrigin(m.id, p);
    const parts = readParts(this.ecs.componentsOf(id));
    const box: Container | undefined = this.ecs.get(id, 'container');
    if (box) this.savedContainers.set(origin, { inv: clone(box.inv), filled: true });
    if (fc?.done?.length) this.savedForms.set(origin, [...fc.done]);
    this.consumed.add(origin);
    this.moved.delete(origin);
    const inv = this.inventory();
    const at = inv.slots.indexOf(null);
    const item = thingItem(m.id);
    inv.slots[at] = { item, count: 1, thing: { origin, ...(fc && Number.isInteger(fc.seed) ? { seed: fc.seed } : {}), ...(parts ? { parts } : {}) } };
    inv.equipped = at;
    this.ecs.destroy(id);
    this.instanceFeet.delete(id);
    this.rebuildSolids();
    this.npc.forgetWays();
    this.bus.emit('item:picked', { item });
    this.bus.emit('inventory:changed', {});
    const said = `Prendi ${name}.`;
    this.message(said);
    return said;
  }

  /** The tile in front of the wanderer acting where a thing they carry goes down: a little more than a tile ahead (T292). */
  private tileInFront(): { col: number; row: number } {
    const c = this.wandererCarpet();
    const [dx, dy] = this.facingDelta();
    return { col: Math.floor(c.x + dx * PUT_AHEAD), row: Math.floor(c.y + dy * PUT_AHEAD) };
  }

  /**
   * Puts down a thing carried (T292): `slot` holds it, `at` is the tile (none: the one in front). Its form first, as a program runs in
   * a worker or a promise; then `putCarried` decides, at once. It stays in hand when it does not go, with a sentence of the world.
   */
  async placeCarried(slot: number, at?: { col: number; row: number }): Promise<string | false> {
    const who = this.wanderer().id;
    const s = this.inventory().slots[slot];
    const module = thingModule(s?.item);
    const man = module !== undefined ? this.modules.get(module)?.manifest : undefined;
    if (man) {
      const fc = this.formFor(man, thingOf(s)?.origin ?? thingItem(man.id));
      if (!this.forms.ready(fc.model, fc.seed, fc.tint)) {
        await this.forms.wait(fc.model, fc.seed, fc.tint);
        // Who asked may have gone meanwhile: nobody does it in their place.
        if (!this.wanderersById.has(who)) return false;
      }
    }
    return this.as(who, () => this.putCarried(slot, at));
  }

  private putCarried(slot: number, at?: { col: number; row: number }): string | false {
    const inv = this.inventory();
    const s = inv.slots[slot];
    const module = thingModule(s?.item);
    const name = s ? this.itemInfo(s.item).name : '';
    const refuse = (why: PutFailure): false => (this.message(putRefusal(why, name), 'warn'), false);
    if (!s || module === undefined) return refuse('nothing');
    const entry = this.modules.get(module);
    // Its module gone, or no longer a thing of the world: it stays carried, nothing is lost.
    if (!entry || entry.manifest.kind !== 'entity' || entry.manifest.persona || this.zone !== 'sim') return refuse('nowhere');
    const c = this.wandererCarpet();
    // Down on the ground floor: a thing goes where the feet stand, not onto the floor above or a roof.
    const feet = this.wandererPos().z;
    if (typeof feet === 'number' && Number.isFinite(feet) && feet - this.groundAt(c.x, c.y) > 0.2) return refuse('down');
    const tile = at ?? this.tileInFront();
    if (![tile.col, tile.row].every(Number.isInteger)) return refuse('nowhere');
    const x = tile.col + 0.5, y = tile.row + 0.5;
    if (Math.hypot(x - c.x, y - c.y) > PUT_REACH) return refuse('far');
    const thing = thingOf(s);
    const origin = thing?.origin ?? this.freshOrigin(module, { x, y });
    const yaw = facingYaw(c.x - x, c.y - y);
    const fc: FormComp = { ...this.formFor(entry.manifest, origin), yaw };
    const done = this.savedForms.get(origin);
    if (done?.length) fc.done = [...done];
    const why = this.spotFailure(entry.manifest, fc, x, y);
    if (why) return refuse(why);
    // It goes: out of the hand, into the world as itself, where it was put; the save keeps it there.
    takeFromSlot(inv, slot);
    const id = this.spawnModuleEntity(entry, x, y, undefined, origin, thing?.parts);
    this.ecs.get(id, 'form').yaw = yaw;
    this.consumed.add(origin);
    this.moved.set(origin, { module, origin, x, y, yaw, ...(thing?.parts ? { parts: thing.parts } : {}) });
    this.rebuildSolids();
    this.npc.forgetWays();
    this.bus.emit('item:placed', { item: s.item });
    this.bus.emit('inventory:changed', {});
    const said = `Posi ${name}.`;
    this.message(said);
    return said;
  }

  /**
   * Why a thing of the world does not go down at (x, y) as `fc` (T292), or undefined. Rule 10: the ground holds it, nothing is there
   * (terrain, a model, someone, something lying, a rune), and, if it is solid, it is not in front of a door and the place stays whole:
   * every tile a body walked to from another, around it, it still walks to (ADR-0064).
   */
  private spotFailure(man: Manifest, fc: FormComp, x: number, y: number): PutFailure | undefined {
    const f = this.forms.ready(fc.model, fc.seed, fc.tint);
    const solid = !!man.physics?.solid && !man.physics?.pushable;
    // Where it stands: the middle of every column of its model seen from above (its tile, without a model), and how tall it is.
    const shape = f?.result ? itemShape(f.result.grid, f.result.palette, f.vpt) : undefined;
    const points: Array<{ x: number; y: number }> = [];
    let height = 1;
    if (f?.result && shape) {
      const g = f.result.grid;
      const cos = Math.cos(fc.yaw), sin = Math.sin(fc.yaw);
      for (let vy = 0; vy < g.Y; vy++)
        for (let vx = 0; vx < g.X; vx++) {
          if (!shape.mask[vx + vy * g.X]) continue;
          const lx = (vx + 0.5 - g.X / 2) / f.vpt, ly = (vy + 0.5 - g.Y / 2) / f.vpt;
          points.push({ x: x + lx * cos + ly * sin, y: y - lx * sin + ly * cos });
        }
      height = Math.max(0.1, (shape.height - f.base) / f.vpt);
    } else points.push({ x, y });
    const ground = this.groundAt(x, y);
    const tiles = new Map<string, [number, number]>();
    for (const p of points) {
      const col = Math.floor(p.x), row = Math.floor(p.y);
      const key = `${col},${row}`;
      if (!tiles.has(key)) {
        tiles.set(key, [col, row]);
        const code = this.tileAt(col, row);
        if (code === undefined || this.chunkAt(col, row)?.stage !== 'planned') return 'nowhere';
        const def = this.palette[code];
        // Water does not hold it up; a wall, a rock, a wood leave it no room.
        if (def?.solid) return def.layer === 'liquid' ? 'ground' : 'taken';
        if (def?.layer === 'door') return 'door';
        if (this.solidTiles.has(key)) return 'taken';
        if (this.runeTiles.has(key)) return 'rune';
      }
      if (this.formFills(p.x, p.y, ground, height)) return 'taken';
    }
    // Who and what is there now: the wanderer acting, the others, the figures, what lies on the ground, what moves.
    const half = f ? 0.5 / f.vpt : 0.5;
    const covers = (bx: number, by: number, r: number) => points.some((p) => Math.abs(p.x - bx) < r + half && Math.abs(p.y - by) < r + half);
    const me = this.wanderer().id;
    for (const w of this.wanderersById.keys()) {
      if (!this.inWorld(w)) continue;
      const b = this.as(w, () => ({ c: this.wandererCarpet(), z: this.wandererPos().z, r: Number(this.ecs.get(this.wandererEntity, 'body')?.r) || 0.3 }));
      if (typeof b.z === 'number' && Number.isFinite(b.z) && b.z >= ground + height) continue;
      if (covers(b.c.x, b.c.y, b.r)) return w === me ? 'you' : 'someone';
    }
    for (const id of this.ecs.query('pos', 'body')) {
      if (this.ecs.has(id, 'player') || this.ecs.has(id, 'remote')) continue;
      const p = this.ecs.get(id, 'pos');
      const b = this.ecs.get(id, 'body');
      if (!Number.isFinite(p?.x) || !Number.isFinite(p?.y) || Math.hypot(p.x - x, p.y - y) > (f?.reach ?? 1) + 1.5) continue;
      if (typeof p.z === 'number' && Number.isFinite(p.z) && p.z >= ground + height) continue;
      const figure = this.ecs.has(id, 'mind') || this.ecs.has(id, 'wander') || this.ecs.has(id, 'identity');
      if (this.ecs.has(id, 'pickup')) {
        if (covers(p.x, p.y, 0.15)) return 'lying';
      } else if (figure) {
        if (covers(p.x, p.y, Number(b?.r) || 0.3)) return 'someone';
      } else if (!b?.solid && covers(p.x, p.y, Number(b?.r) || 0.3)) return 'taken';
    }
    if (!solid) return undefined;
    for (const [col, row] of tiles.values()) for (const [dc, dr] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) if (this.isDoor(col + dc, row + dr)) return 'door';
    return this.wouldSplit(f?.result ? { ...fc, f } : undefined, x, y) ? 'split' : undefined;
  }

  /** Whether a model of the world fills a point of the simulation from a step above the ground at `ground` to `height` over it (tiles). */
  private formFills(x: number, y: number, ground: number, height: number): boolean {
    for (const s of this.solidForms.get(`${Math.floor(x)},${Math.floor(y)}`) ?? []) {
      const [lx, lz] = toLocal(x - s.x, y - s.y, s.yaw);
      const g = s.form.result!.grid;
      const vx = Math.floor(lx * s.form.vpt + g.X / 2), vy = Math.floor(lz * s.form.vpt + g.Y / 2);
      if (vx < 0 || vy < 0 || vx >= g.X || vy >= g.Y) continue;
      const i = vx + vy * g.X;
      // Over a cellar there is no ground to stand on.
      if (s.hole?.[i]) return true;
      // The thing's heights in the model's voxels: it stands on the ground under its middle, the model on the ground under its own.
      const at = (z: number) => (z - this.groundAt(s.x, s.y)) * s.form.vpt + s.form.base;
      const lo = at(ground) + stepOf(s.form.vpt), hi = at(ground + height);
      for (let l = s.levels.start[i]; l < s.levels.start[i + 1]; l++) if (s.levels.base[l] < hi && s.levels.z[l] > lo) return true;
    }
    return false;
  }

  /** Whether a tile is a door: of the terrain, or of a lot of its place. */
  private isDoor(col: number, row: number): boolean {
    const code = this.tileAt(col, row);
    if (code && this.palette[code]?.layer === 'door') return true;
    const ch = this.chunkAt(col, row);
    if (!ch) return false;
    const S = this.config.chunkSize;
    const t = (row - ch.cy * S) * S + (col - ch.cx * S);
    return ch.lots.some((b) => b.doors.includes(t));
  }

  /**
   * Whether a body of half-size r steps from the middle of a tile to the middle of the next (both passable), as a walk sees it: the
   * tiles say it all where no model stands; else free halfway and at the end, from the floor under the start (the boxes of the three
   * points cover the way, so an edge or a rise anywhere on it is in one of them).
   */
  private stepsBetween(c: number, r: number, nc: number, nr: number, body: number): boolean {
    if (!this.solidForms.has(`${c},${r}`) && !this.solidForms.has(`${nc},${nr}`)) return true;
    const x0 = c + 0.5, y0 = r + 0.5;
    let z = this.floorAt(x0, y0);
    for (const t of [0.5, 1]) {
      const x = x0 + (nc - c) * t, y = y0 + (nr - r) * t;
      if (!this.free(x, y, body, z)) return false;
      z = this.floorAt(x, y, z);
    }
    return true;
  }

  /**
   * Whether a solid thing standing at (x, y) splits the place around it (rule 10, ADR-0064): the groups of tiles a body walks
   * between in `MOVE_AREA` tiles each way, before and with the thing there (its model in the index of solids for a moment, or its
   * tile while it has none). Only around it the tiles are walked again; elsewhere the first answer stands.
   */
  private wouldSplit(thing: (FormComp & { f: Form }) | undefined, x: number, y: number): boolean {
    const col = Math.floor(x), row = Math.floor(y);
    const area: TileArea = { col: col - MOVE_AREA, row: row - MOVE_AREA, cols: 2 * MOVE_AREA + 1, rows: 2 * MOVE_AREA + 1 };
    const memo = <K>(m: Map<K, boolean>, k: K, fn: () => boolean) => {
      let v = m.get(k);
      if (v === undefined) m.set(k, (v = fn()));
      return v;
    };
    const passes = new Map<string, boolean>(), steps = new Map<string, boolean>();
    const passable = (c: number, r: number) => this.tileAt(c, r) !== undefined && this.free(c + 0.5, r + 0.5, MOVE_BODY);
    const before: Walk = {
      passable: (c, r) => memo(passes, `${c},${r}`, () => passable(c, r)),
      step: (c, r, nc, nr) => memo(steps, `${c},${r},${nc},${nr}`, () => this.stepsBetween(c, r, nc, nr, MOVE_BODY)),
    };
    const a = walkGroups(area, before);
    // The thing, for a moment, where it would stand: in every tile its collision may reach.
    const reach = thing ? thing.f.reach : 0;
    const c0 = Math.floor(x - reach), c1 = Math.floor(x + reach), r0 = Math.floor(y - reach), r1 = Math.floor(y + reach);
    const added: Array<[string, SolidForm]> = [];
    const tileKey = `${col},${row}`;
    const hadTile = this.solidTiles.has(tileKey);
    if (thing) {
      const s: SolidForm = { id: -1, x, y, yaw: thing.yaw, form: thing.f, ...this.groundOf(-1, thing, thing.f) };
      for (let cy = r0; cy <= r1; cy++)
        for (let cx = c0; cx <= c1; cx++) {
          const key = `${cx},${cy}`;
          (this.solidForms.get(key) ?? this.solidForms.set(key, []).get(key)!).push(s);
          added.push([key, s]);
        }
    } else this.solidTiles.add(tileKey);
    try {
      const near = (c: number, r: number) => c >= c0 - 1 && c <= c1 + 1 && r >= r0 - 1 && r <= r1 + 1;
      const after: Walk = {
        passable: (c, r) => (near(c, r) ? passable(c, r) : before.passable(c, r)),
        step: (c, r, nc, nr) => (near(c, r) || near(nc, nr) ? this.stepsBetween(c, r, nc, nr, MOVE_BODY) : before.step(c, r, nc, nr)),
      };
      return splitBetween(a, walkGroups(area, after));
    } finally {
      for (const [key, s] of added) {
        const list = this.solidForms.get(key)!;
        list.splice(list.indexOf(s), 1);
        if (!list.length) this.solidForms.delete(key);
      }
      if (!thing && !hadTile) this.solidTiles.delete(tileKey);
      this.instanceFeet.delete(-1);
    }
  }

  /** The things moved as the save keeps them (T292): from the world where they stand now, the rest as they were last seen. */
  private movedToSave(): MovedRecord[] {
    const r4 = (v: number) => Math.round(v * 10000) / 10000;
    const live = new Map<string, Id>();
    for (const id of this.ecs.query('origin', 'module')) {
      const o = this.ecs.get(id, 'origin').key;
      if (this.moved.has(o)) live.set(o, id);
    }
    const out: MovedRecord[] = [];
    for (const r of [...this.moved.values()]) {
      const id = live.get(r.origin);
      if (id === undefined) {
        // Its module is there and it is not in the world: something destroyed it (Lua). A module gone: it waits in the save.
        const m = this.modules.get(r.module)?.manifest;
        if (m && m.kind === 'entity' && !m.persona) this.moved.delete(r.origin);
        else out.push(r);
        continue;
      }
      const p = this.ecs.get(id, 'pos');
      const yaw = this.ecs.get(id, 'form')?.yaw ?? r.yaw;
      if (![p?.x, p?.y, yaw].every(Number.isFinite)) continue;
      const parts = readParts(this.ecs.componentsOf(id));
      const now: MovedRecord = { module: r.module, origin: r.origin, x: r4(p.x), y: r4(p.y), yaw: r4(yaw), ...(parts ? { parts } : {}) };
      this.moved.set(r.origin, now);
      out.push(now);
    }
    return out.slice(-MAX_MOVED);
  }

  /**
   * Puts back the things moved when the game was saved (T292), where they were put, as themselves; and keeps the places from making
   * again what was taken or moved, including what a wanderer carries (`consumed` keeps only the most recent).
   */
  private restoreMoved(list: unknown): void {
    for (const r of readMoved(list)) {
      this.consumed.add(r.origin);
      this.moved.set(r.origin, r);
      const entry = this.modules.get(r.module);
      // A module gone, or not a thing any more: the record waits in the save, nothing comes into the world.
      if (!entry || entry.manifest.kind !== 'entity' || entry.manifest.persona) continue;
      if (this.ecs.query('origin').some((e) => this.ecs.get(e, 'origin').key === r.origin)) continue;
      const id = this.spawnModuleEntity(entry, r.x, r.y, undefined, r.origin, r.parts);
      this.ecs.get(id, 'form').yaw = r.yaw;
    }
  }

  /** What the wanderer acting carries of the world (T292): the places do not make it again, whatever `consumed` still remembers. */
  private keepCarried(): void {
    for (const s of this.inventory()?.slots ?? []) {
      const t = isThing(s?.item) ? thingOf(s) : undefined;
      if (t) this.consumed.add(t.origin);
    }
  }

  moveSlot(from: number, to: number): void {
    moveSlot(this.inventory(), from, to, this.itemSpec);
  }

  container(id: Id): Container | undefined {
    return this.ecs.get(id, 'container');
  }

  /** First opening fills the container from its loot table (things people talked about turn up more). */
  openContainer(id: Id): Container | undefined {
    const box = this.fillContainer(id);
    if (!box) return undefined;
    this.bus.emit('ui:container', { id, name: this.nameOf(id) });
    return box;
  }

  takeFromContainer(id: Id, slot: number): void {
    const box = this.container(id);
    const s = box?.inv.slots[slot];
    if (!box || !s) return;
    const moved = s.inv || s.thing ? putSlot(this.inventory(), s, this.itemSpec(s.item)) : this.give(s.item, s.count);
    if (!moved) return this.message("L'inventario è pieno.", 'warn');
    takeFromSlot(box.inv, slot, moved);
    this.message(`Prendi: ${this.itemInfo(s.item).name}${moved > 1 ? ` ×${moved}` : ''}`);
  }

  putIntoContainer(id: Id, slot: number): void {
    const box = this.container(id);
    const s = this.inventory().slots[slot];
    if (!box || !s) return;
    // A chest holds no furniture (T292).
    if (isThing(s.item)) return this.message(`${this.itemInfo(s.item).name} non ci va, in ${this.nameOf(id)}.`, 'warn');
    const moved = putSlot(box.inv, s, this.itemSpec(s.item));
    if (moved) takeFromSlot(this.inventory(), slot, moved);
    this.syncPhrase();
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
    // No bag inside a bag, no thing of the world in a bag (T292).
    if (!def?.container || !it || it.container || isThing(item)) return false;
    return !def.container.accepts || it.tags.includes(def.container.accepts) || isCategory(it, def.container.accepts);
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
   * slots, then any bag with room. Returns how many fit.
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
      const pc = this.wandererCarpet();
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
    // Who asks: `as` never spans an await.
    const me = this.payerNow();
    const lacking = (esito: 'refusal' | 'error', motivo: string) => this.noteShortfall({ request: `fabbricare «${text}»`, who: me, agent: 'narrator', task: 'craft.free', outcome: esito, reason: motivo });
    const key = `craft|${normName(text)}`;
    const ruled = this.rules().find((r) => r.key === key && !r.possible);
    if (ruled) {
      lacking('refusal', ruled.story);
      return { ok: false, story: ruled.story };
    }
    let j;
    try {
      j = await judgeCraft(this.council, text, this.carriedNames(), [...this.content.items.values()].map((d) => d.name), this.focusOn([]));
    } catch (e) {
      lacking('error', (e as Error).message);
      return { ok: false, story: `(il Concilio tace: ${(e as Error).message})` };
    }
    const refuse = (why: string) => {
      lacking('refusal', why);
      this.council.say('narrator', 'obietta', `fabbricare «${text}»: ${why}`, undefined, 'craft.free');
      this.recordRule({ key: key, text: `fabbricare «${text}»`, possible: false, story: why }, true, { task: 'craft.free', author: 'narrator' });
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
    const result = this.content.byName(j.result!) ?? (await this.introduceItems([j.result!], `fabbricato dal viandante: ${j.description ?? text}`, me))[0];
    if (!result) return { ok: false, story: `${j.story} (ma il Concilio non riesce a dire cosa ne esca)` };
    let id = `ricetta.${slug(result.name)}`;
    while (this.content.recipes.some((r) => r.id === id)) id += '-2';
    const recipe: Recipe = { id, name: result.name, inputs, ...(tools.length ? { tools } : {}), output: { item: result.id, count: j.count } };
    this.recordRule({ key: key, text: `fabbricare «${result.name}»`, possible: true, story: j.story, effects: [`ricetta: ${inputs.map((i) => `${this.itemInfo(i.item).name} ×${i.count}`).join(' + ')}`] }, false, { task: 'craft.free', author: 'narrator' });
    this.writePack('modules/items.scoperte/manifest.json', { id: 'items.scoperte', name: 'Ricette scoperte', description: 'Ricette che il viandante ha inventato e che il Concilio ha giudicato possibili: ora sono regole del mondo.' }, { items: [], recipes: [recipe], loot: {} });
    this.applyFiles({ ...this.repo.working });
    const c = this.commitContent(`ricetta scoperta: ${result.name}`, 'craft.free', 'narrator');
    this.council.say('narrator', 'approva', `nuova ricetta «${result.name}»: ${inputs.map((i) => `${this.itemInfo(i.item).name} ×${i.count}`).join(' + ')}${tools.length ? ` con ${tools.map((t) => this.itemInfo(t).name).join(', ')}` : ''} (commit ${c.id})`, undefined, 'craft.free');
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
    const me = this.payerNow();
    let verdict;
    try {
      verdict = await judgeCombination(this.council, ia, ib, known.map((d) => d.name).slice(-150), this.focusOn([ia.name, ib.name]));
    } catch (e) {
      this.noteShortfall({ request: `combinare «${ia.name}» e «${ib.name}»`, who: me, agent: 'narrator', task: 'craft.judge', outcome: 'error', reason: (e as Error).message });
      return `Il Concilio non risponde: ${(e as Error).message}`;
    }
    if (!verdict.possible || !verdict.result) return verdict.reason;
    let result = this.content.byName(verdict.result)?.id;
    if (!result) {
      const defs = await this.introduceItems([verdict.result], `ottenuto combinando ${ia.name} e ${ib.name}: ${verdict.description ?? ''}`, me);
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
    // Another wanderer (T43a): one talks to them and gives them what is at hand (the hotbar); «Altro…» if the game allows it (T43b).
    if (this.otherWanderer(id) !== undefined) {
      out.push({ id: 'parla', label: 'Parla', enabled: true });
      if (this.introOf(id)) out.push({ id: 'chi', label: 'Chi è', enabled: true });
      this.inventory().slots.slice(0, HOTBAR).forEach((s, i) => s && out.push({ id: `dai:${i}`, label: `Dai ${this.itemInfo(s.item).name}${s.count > 1 ? ` ×${s.count}` : ''}`, enabled: true }));
      if (this.gameSetup()?.freeActionsBetweenPlayers !== false) out.push({ id: 'altro', label: 'Altro…', enabled: true });
      return out;
    }
    const m = this.modules.get(this.ecs.get(id, 'module')?.id)?.manifest;
    const inv = this.inventory();
    const has = (req: string) => countItem(inv, req) > 0 || inv.slots.some((s) => s && this.itemInfo(s.item).tags.includes(req));
    if (this.ecs.has(id, 'pickup')) out.push({ id: 'raccogli', label: 'Raccogli', enabled: true });
    // A thing of the world one can carry elsewhere (T292); the kernel says why when it does not go.
    if (this.takeableOf(id)) out.push({ id: 'prendi', label: 'Prendi', enabled: true });
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
    // What is held goes down on furniture (T291), or beside what already lies on it; the kernel says why when it does not. A thing
    // of the world carried goes on the ground only (T292): the tile's own menu has it.
    const carrying = isThing(held);
    if (held && !carrying && this.offersPlace(id)) out.push({ id: 'posa', label: `Posa ${this.itemInfo(held).name} ${this.ecs.has(id, 'placed') ? 'accanto' : 'qui sopra'}`, enabled: true });
    if (held && !carrying) out.push({ id: 'strumento', label: `Usa ${this.itemInfo(held).name}`, enabled: true });
    out.push({ id: 'esamina', label: 'Esamina', enabled: true });
    out.push({ id: 'altro', label: 'Altro…', enabled: true });
    return out;
  }

  /** Another wanderer in the world, near enough to the one acting (T43a): where both are, or why not. */
  private besideWanderer(to: string, reach: number, far: string): { nome: string } | undefined {
    const me = this.wanderer().id;
    const a = to !== me && this.inWorld(me) ? this.wandererAt(me) : undefined;
    const b = a && this.inWorld(to) ? this.wandererAt(to) : undefined;
    if (!a || !b) return void this.message('Non c’è nessuno qui con questo nome.', 'warn');
    if (Math.hypot(a.x - b.x, a.y - b.y) > reach) return void this.message(far, 'warn');
    return { nome: this.wanderersById.get(to)!.name };
  }

  /**
   * Words to another wanderer nearby (T43a): a bubble above who speaks, which every wanderer near sees; who is spoken to
   * hears them (`wanderer:said`). No filter of the fourth wall: they are people, not the Council.
   */
  sayTo(to: string, text: string): string | false {
    const said = String(text ?? '').replace(/\s+/g, ' ').trim().slice(0, SAY_MAX);
    if (!said || !this.besideWanderer(to, HEAR, 'È troppo lontano per sentirti.')) return false;
    this.speak(this.wandererEntity, said);
    this.bus.emit('wanderer:said', { da: this.wanderer().id, a: to, testo: said });
    return said;
  }

  /**
   * Something carried, to another wanderer beside them (T43a): `count` of the slot (all of it by default), where it would
   * go if they picked it up; a bag goes whole, with what is in it, into an empty slot. A trade is two gifts.
   */
  giveTo(to: string, slot: number, count?: number): string | false {
    const inv = this.inventory();
    const s = Number.isInteger(slot) ? inv.slots[slot] : undefined;
    if (!s) return void this.message('Non porti niente lì.', 'warn'), false;
    const n = Math.min(s.count, count === undefined ? s.count : Math.floor(Number(count)));
    if (!(n >= 1)) return false;
    const other = this.besideWanderer(to, GIVE_REACH, 'Avvicinati per dargli qualcosa.');
    if (!other) return false;
    const name = this.itemInfo(s.item).name;
    // A bag goes whole with what is in it, a thing of the world with who it is (T292): a slot of their own, a copy of this one.
    const whole = !!(s.inv || s.thing);
    const moved = this.as(to, () => {
      if (!whole) return this.give(s.item, n);
      const theirs = this.inventory();
      const free = theirs.slots.findIndex((x) => !x);
      if (free < 0) return 0;
      theirs.slots[free] = { ...s };
      return s.count;
    });
    if (!moved) return void this.message(`${other.nome} non ha posto per ${name}.`, 'warn'), false;
    s.count -= moved;
    if (s.count <= 0 || whole) {
      inv.slots[slot] = null;
      emptied(inv, slot);
    }
    // A rune given is no longer in the phrase.
    this.syncPhrase();
    const what = `${name}${moved > 1 ? ` ×${moved}` : ''}`;
    this.bus.emit('inventory:changed', {});
    this.bus.emit('wanderer:gave', { da: this.wanderer().id, a: to, oggetto: s.item, quanti: moved, testo: what });
    this.message(`Dai ${what} a ${other.nome}.`, 'good');
    return what;
  }

  /** E: corona → edit code; rune → pick; otherwise the menu of the nearest entity (or a pickup directly). */
  async interact(): Promise<void> {
    if (this.zone === 'corona' || this.zone === 'studio') return this.interactStudio();
    if (this.pickUpRune()) return;
    const target = this.targetInFront();
    if (target !== undefined && this.ecs.has(target, 'pickup')) {
      this.pickUpEntity(target);
      return;
    }
    // The menu of the tile in front, with what stands on it.
    const pc = this.wandererCarpet();
    const [dx, dy] = this.facingDelta();
    const col = target !== undefined ? Math.floor(this.ecs.get(target, 'pos').x) : Math.floor(pc.x + dx);
    const row = target !== undefined ? Math.floor(this.ecs.get(target, 'pos').y) : Math.floor(pc.y + dy);
    this.openTileMenu(col, row, target);
  }

  /**
   * Every tile has a context menu: what stands on it (an object, an individual) with its actions, then the
   * actions learned on this kind of terrain, then "Altro…" for the tile itself.
   */
  tileMenu(col: number, row: number, entity?: Id): { title: string; options: ActionOption[]; entity?: Id } {
    const code = this.tileAt(col, row);
    const t = code ? this.palette[code] : undefined;
    const on = entity ?? this.nearest(col + 0.5, row + 0.5, 0.75);
    const options: ActionOption[] = [];
    if (on !== undefined) for (const o of this.actionsFor(on)) options.push({ ...o, id: `e:${o.id}`, label: o.id === 'altro' ? `Altro… (${this.nameOf(on)})` : o.label });
    // A thing of the world carried goes down here (T292); the kernel says why when it does not.
    const held = equippedItem(this.inventory());
    if (t && this.zone === 'sim' && isThing(held)) options.push({ id: `t:${PUT_DOWN}`, label: `Posa ${this.itemInfo(held!).name} qui`, enabled: true });
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
    const pc = this.wandererCarpet();
    if (Math.hypot(col + 0.5 - pc.x, row + 0.5 - pc.y) > 2.6) {
      this.message('Troppo lontano: avvicinati.');
      return false;
    }
    // What is under the pointer, as the hover says (T44c): of two wanderers side by side, the one clicked.
    this.openTileMenu(col, row, this.nearest(rx + ox, ry + oy, 0.6));
    return true;
  }

  /** A choice of a tile menu: the entity's action, a learned terrain action, or "Altro…" on the tile. */
  async performMenu(option: string, entity: Id, col: number, row: number): Promise<void> {
    if (option.startsWith('e:') && entity >= 0) return this.perform(entity, option.slice(2));
    if (option === 't:altro') return void this.bus.emit('ui:freeaction', { id: -1, col, row, name: this.palette[this.tileAt(col, row) ?? '']?.name ?? 'qui' });
    if (option === `t:${PUT_DOWN}`) {
      const at = this.inventory().equipped;
      if (at === null || !isThing(this.inventory().slots[at]?.item)) return this.message(putRefusal('nothing', ''), 'warn');
      await this.placeCarried(at, { col, row });
      return;
    }
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

  /** The entity you are facing (or standing next to). */
  targetInFront(): Id | undefined {
    const pc = this.wandererCarpet();
    const [dx, dy] = this.facingDelta();
    return this.nearest(pc.x + dx * 0.6, pc.y + dy * 0.6, 1.4) ?? this.nearest(pc.x, pc.y, 1.2);
  }

  async perform(id: Id, action: string): Promise<void> {
    if (!this.ecs.alive.has(id)) return;
    const other = this.otherWanderer(id);
    if (other !== undefined) {
      if (action === 'parla') this.bus.emit('ui:chat', { id, name: this.nameOf(id) });
      if (action === 'chi') this.bus.emit('ui:dialog', { speaker: this.nameOf(id), text: this.introOf(id) ?? '' });
      if (action.startsWith('dai:')) this.giveTo(other, Number(action.slice(4)));
      if (action === 'altro' && this.gameSetup()?.freeActionsBetweenPlayers !== false) this.bus.emit('ui:freeaction', { id, name: this.nameOf(id) });
      return;
    }
    const modId: string | undefined = this.ecs.get(id, 'module')?.id;
    const m = modId ? this.modules.get(modId)?.manifest : undefined;
    const speaker = this.nameOf(id);
    const say = (text: string) => this.bus.emit('ui:dialog', { speaker, text });
    switch (action) {
      case 'raccogli':
        this.pickUpEntity(id);
        return;
      case 'parla':
        await this.npc.ensureIdentity(id);
        this.bus.emit('ui:chat', { id, name: this.nameOf(id) });
        return;
      case 'apri':
        this.openContainer(id);
        return;
      case 'strumento':
        this.action(id);
        return;
      case 'posa':
        await this.placeOn(id);
        return;
      case 'prendi':
        this.takeThing(id);
        return;
      case 'altro':
        this.bus.emit('ui:freeaction', { id, name: speaker });
        return;
      case 'usa': {
        const { value, failed } = this.runModule(modId!, 'on_interact', id, this.wandererEntity);
        if (!failed && typeof value === 'string') say(value);
        return;
      }
      case 'leggi':
        try {
          say(await narrate(this.council, { name: speaker, description: m?.description ?? '', lore: m?.lore }, this.worldFacts(), this.focusOn([speaker, modId && `kind:${nodeSlug(modId)}`], this.ecs.get(id, 'pos'))));
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
            text = await examine(this.council, { name: what.name, description: what.description, lore: (what as { lore?: string }).lore }, this.worldFacts(), this.focusOn([what.name, modId && `kind:${nodeSlug(modId)}`], this.ecs.get(id, 'pos')));
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
          const { value, failed } = this.runModule(modId, 'on_act', id, this.wandererEntity, a.id);
          if (!failed) say(typeof value === 'string' && value ? value : `${a.label}: fatto.`);
        }
    }
  }

  /**
   * "Altro…": the player writes what they do to an entity in the world. Actions the entity already learned
   * run directly, judgements already given are remembered (rules); otherwise the Narrator judges, the
   * validator keeps only known effects, core.effects applies them, and the entity learns the action.
   */
  async freeAction(id: Id, text: string): Promise<string> {
    if (!this.ecs.alive.has(id)) return '';
    const other = this.otherWanderer(id);
    if (other !== undefined) return this.freeOnWanderer(other, text);
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
        // What the target is, for the Narrator's prompt (English since T310b; the offline Council reads it too).
        kind: pk ? (this.ecs.has(id, 'placed') ? 'a thing placed on furniture' : 'a thing on the ground') : m?.persona ? 'person' : this.ecs.has(id, 'container') ? 'furniture' : 'thing',
        learnModule: !pk && !m?.persona ? entry : undefined,
        learnItem: pk?.item,
      },
      text,
    );
  }

  /**
   * «Altro…» on another wanderer beside them (T43b), only if the game allows it (`partita.altroTraGiocatori`): judged as on
   * an individual; the server applies the effects to the other's body (`touchWanderer`). Nothing is learned: they are not a thing.
   */
  async freeOnWanderer(to: string, text: string): Promise<string> {
    if (this.gameSetup()?.freeActionsBetweenPlayers === false) {
      this.message('In questo mondo non si fa «Altro…» su un altro viandante.', 'warn');
      return '';
    }
    const other = this.besideWanderer(to, GIVE_REACH, 'Avvicinati per farlo.');
    if (!other) return '';
    const entity = this.wanderersById.get(to)!.entity;
    return this.judgeFree({ entity, wanderer: to, key: 'viandante', name: other.nome, description: `un altro viandante come te, una persona vera: ${other.nome}`, tags: ['viandante'], container: false, kind: 'another wanderer' }, text);
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

  /** Actions an entity has learned (its module's, or its item definition's). */
  learnedActions(sub: { learnModule?: ModuleEntry; learnItem?: string; learnTile?: string }): ActionDef[] {
    return [...(sub.learnModule?.manifest.actions ?? []), ...(sub.learnItem ? (this.content.get(sub.learnItem)?.actions ?? []) : []), ...(sub.learnTile ? (this.palette[sub.learnTile]?.actions ?? []) : [])].filter((a) => a.effects?.length);
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

  /**
   * The effects of «Altro…» on another wanderer (T43b), by the one acting: on a god only words (ADR-0065); what harms only
   * if the game has PvP (`harms`), otherwise the kernel takes it away. Needs, shield and states are the other's body's; a
   * push moves them on their carpet; the rest happens where they stand. Bonds, memories, births, breaking, opening: not on people.
   */
  touchWanderer(to: string, all: Effect[], text = ''): string[] {
    const b = this.wandererAt(to);
    const me = this.wandererAt(this.wanderer().id);
    if (!b || !me || to === this.wanderer().id) return [];
    let effects = all.filter((e) => !['bond', 'memory', 'birth', 'destroy', 'open', 'container'].includes(e.type));
    const dropped: string[] = [];
    if (this.godMode(to)) {
      dropped.push(...effects.filter((e) => e.type !== 'message').map((e) => e.type));
      effects = effects.filter((e) => e.type === 'message');
    } else if (!this.gameSetup()?.pvp) {
      effects = effects.flatMap((e) => {
        const kept = unharmed(e);
        if (!kept) dropped.push(e.type);
        return kept ? [kept] : [];
      });
    }
    if (dropped.length) this.council.say('kernel', 'scarta', `azione «${text}» su ${this.wanderersById.get(to)?.name ?? to}: ${dropped.join(', ')} (${this.godMode(to) ? 'nessuno tocca il master' : 'tra viandanti non ci si ferisce'})`, 'narrator', 'action.judge');
    const body: Effect[] = effects.filter((e) => e.type === 'needs' || e.type === 'shield' || e.type === 'state' || e.type === 'remove_state');
    const out: string[] = [];
    for (const e of effects) {
      if (e.type === 'push') {
        const dx = b.x - me.x;
        const dy = b.y - me.y;
        const d = Math.hypot(dx, dy) || 1;
        const force = Math.max(0, Math.min(6, Number(e.force ?? 3) || 0));
        this.stepWanderer(to, { x: b.x + (dx / d) * force, y: b.y + (dy / d) * force }, force);
        this.bus.emit('wanderer:pushed', { id: to });
      } else if (!body.includes(e)) out.push(...this.applyEffects([e], undefined, { x: b.x, y: b.y }));
    }
    if (body.length) out.push(...this.as(to, () => this.applyEffects(body)));
    if (dropped.length) out.push(this.godMode(to) ? 'Non succede niente.' : 'Ma tra viandanti non ci si ferisce.');
    return out;
  }

  /** Applies effects to the subject of an action: an entity in the world, or something carried. */
  private applyOn(sub: { entity?: Id; slot?: number; tile?: { col: number; row: number }; key: string }, all: Effect[]): string[] {
    // Acting on something never spends it by accident: only "destroy" breaks or uses it up.
    let effects = all.filter((e) => !(e.type === 'consume' && e.item === sub.key));
    // Between people: bonds, memories, births are the society's, not the Lua effects'.
    const social = effects.filter((e) => e.type === 'bond' || e.type === 'memory' || e.type === 'birth');
    effects = effects.filter((e) => !(social as Effect[]).includes(e));
    const who: Identity | undefined = sub.entity !== undefined ? this.ecs.get(sub.entity, 'identity') : undefined;
    if (who) {
      for (const e of social) {
        if (e.type === 'bond') this.npc.setBond(who.name, e.bond);
        else if (e.type === 'memory') this.npc.rememberWanderer(who.name, e.text, e.weight ?? 2);
        else if (e.type === 'birth') void this.npc.birth(sub.entity!, e.name);
      }
    }
    if (sub.entity !== undefined) return this.applyEffects(effects, sub.entity);
    // On a tile: everything happens there (destroying a tile turns it into the ground around).
    if (sub.tile) return this.applyEffects(effects.filter((e) => e.type !== 'destroy' && e.type !== 'open' && e.type !== 'container'), undefined, { x: sub.tile.col + 0.5, y: sub.tile.row + 0.5 });
    const out: string[] = [];
    const rest: Effect[] = [];
    for (const e of effects) {
      if (e.type === 'destroy' && sub.slot !== undefined) removeItem(this.inventory(), sub.key, 1);
      else if (e.type === 'open' && sub.slot !== undefined && this.content.get(sub.key)?.container) this.bus.emit('ui:bag', { slot: sub.slot });
      else if (e.type !== 'container' && e.type !== 'push') rest.push(e);
    }
    const pc = this.wandererCarpet();
    const [dx, dy] = this.facingDelta();
    out.push(...this.applyEffects(rest, undefined, { x: pc.x + dx, y: pc.y + dy }));
    this.syncPhrase();
    return out;
  }

  private async judgeFree(
    sub: { entity?: Id; wanderer?: string; slot?: number; tile?: { col: number; row: number }; key: string; name: string; description: string; tags: string[]; container: boolean; kind: string; learnModule?: ModuleEntry; learnItem?: string; learnTile?: string },
    rawText: string,
  ): Promise<string> {
    const text = rawText.trim().slice(0, 200);
    if (!text) return '';
    // Who asks: after the await what happens is theirs (`as` never spans an await).
    const me = this.wanderer().id;
    const say = (t: string) => this.bus.emit('ui:dialog', { speaker: sub.name, text: t });
    const lacking = (esito: 'refusal' | 'invalid' | 'error', motivo: string, agente: AgentId = 'narrator', compito = 'action.judge') => this.noteShortfall({ request: `«${text}» su ${sub.name}`, who: me, agent: agente, task: compito, outcome: esito, reason: motivo });
    // What its model already knows how to do (an action of the program) happens without asking.
    const own = sub.entity !== undefined && !sub.wanderer ? this.modelActions(sub.entity).find((a) => normName(a.label) === normName(text) || normName(a.name) === normName(text)) : undefined;
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
    const ruled = this.rules().find((r) => r.key === ruleKey && !r.possible);
    if (ruled) {
      lacking('refusal', ruled.story);
      say(ruled.story);
      return ruled.story;
    }
    const p = sub.wanderer ? this.wandererAt(sub.wanderer) : sub.entity !== undefined ? this.ecs.get(sub.entity, 'pos') : sub.tile ? { x: sub.tile.col + 0.5, y: sub.tile.row + 0.5 } : this.wandererCarpet();
    const tile = p ? (this.palette[this.tileAt(Math.floor(p.x), Math.floor(p.y)) ?? '']?.name ?? '?') : '?';
    const inv = this.inventory();
    const held = equippedItem(inv);
    const summonable = [...this.modules.values()].filter((e) => e.manifest.kind === 'entity' && !e.manifest.unique);
    this.council.say('kernel', 'info', `il viandante prova: «${text}» su ${sub.name}`, 'narrator', 'action.judge');
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
        place: this.chunkHere()?.name ?? '',
        transcended: this.exitedOnce,
        shape: sub.entity !== undefined && !sub.wanderer && !!this.shapeModel(sub.entity),
        between: sub.wanderer ? { pvp: !!this.gameSetup()?.pvp, god: this.godMode(sub.wanderer) } : undefined,
      }, this.focusOn([sub.name, sub.learnModule && `kind:${nodeSlug(sub.learnModule.manifest.id)}`, sub.learnItem && `item:${nodeSlug(sub.learnItem)}`], p));
    } catch (e) {
      const msg = `(il Concilio tace: ${(e as Error).message})`;
      lacking('error', (e as Error).message);
      say(msg);
      return msg;
    }
    // What it needs must really be in the slots.
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
      await this.introduceItems(v.unknownItems, `nati dall'azione «${text}» su ${sub.name}`, me);
      v = validateEffects(j.possible ? j.effects : [], ectx);
    }
    v.effects = v.effects.filter((e) => !(e.type === 'consume' && e.item === sub.key));
    // What changes the entity's look becomes a rule of its model (ADR-0044): the entity stays, changed.
    const shaped = j.possible && j.shape && sub.entity !== undefined ? await this.learnShape(sub.entity, j.label || text, text, j.shape) : undefined;
    if (j.possible && j.shape && sub.entity !== undefined && !shaped) lacking('invalid', this.lastDiscard('sculptor', 'model.action'), 'sculptor', 'model.action');
    if (!j.possible) lacking('refusal', j.story);
    else if (v.dropped.length) lacking('invalid', v.dropped.join('; '));
    if (shaped) v.effects = v.effects.filter((e) => e.type !== 'destroy');
    if (v.dropped.length) this.council.say('kernel', 'scarta', `azione «${text}»: ${v.dropped.join('; ')}`, 'narrator', 'action.judge');
    this.council.say('narrator', j.possible ? 'approva' : 'obietta', `«${text}» su ${sub.name}: ${j.story}${v.effects.length ? ` [${v.effects.map((e) => e.type).join(', ')}]` : ''}`, undefined, 'action.judge');
    const out = j.possible ? this.as(me, () => (sub.wanderer ? this.touchWanderer(sub.wanderer, v.effects, text) : this.applyOn(sub, v.effects))) : [];
    if (sub.wanderer && j.possible) this.bus.emit('wanderer:acted', { da: me, a: sub.wanderer, testo: [j.story, ...out].filter(Boolean).join(' ') });
    say([j.story, ...out].filter(Boolean).join(' ') || 'Non succede niente.');
    // The decision becomes a rule of the world; a possible action stays in the entity's menu.
    const lasting = v.effects.some((e) => e.type !== 'message');
    const creates = v.effects.some((e) => e.type === 'create_item' || e.type === 'summon');
    const pays = v.effects.some((e) => e.type === 'consume') || !!need;
    // A rule of the model is already in every menu of the kind: the rest happened this once.
    const learn = j.possible && !shaped && lasting && (!creates || pays);
    this.recordRule({ key: ruleKey, text: `«${text}» su ${sub.name}`, possible: j.possible && (v.effects.length > 0 || !!shaped), story: j.story, effects: [...(shaped ? ['forma'] : []), ...v.effects.map((e) => e.type)] }, !learn, { task: 'action.judge', author: 'narrator' });
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
      return (internalFields('rules', JSON.parse(this.files['world/rules.json'] ?? '{}')).rules ?? []) as Rule[];
    } catch {
      return [];
    }
  }

  /** A judgement becomes a rule: written in the universe, shown to the Council in every later judgement. */
  recordRule(r: Rule, commit = true, card?: { task: string; author: string }): void {
    // A judgement of the Council is a card (T36); the facts the kernel notes (a death, a bond, a quest) are not.
    if (card) r.card = this.sign(`rule:${nodeSlug(r.key)}`, card.task, card.author);
    const all = this.rules().filter((x) => x.key !== r.key);
    all.push(r);
    this.repo.write('world/rules.json', JSON.stringify({ rules: all.slice(-300) }, null, 2) + '\n');
    this.files = { ...this.files, 'world/rules.json': this.repo.working['world/rules.json']! };
    if (commit) {
      this.applyFiles({ ...this.repo.working });
      this.repo.commit(`regola: ${r.text} → ${r.possible ? 'si può' : 'non si può'}`, 'agent');
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
      for (const it of man.items ?? []) out.push({ label: it.name, color: it.color, path, target: `item:${it.id}`, model: this.forms.resolve(it.model, 'object'), tint: it.color });
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
    const mini: ChunkMiniature = { cx: 0, cy: 0, size: S, tiles, levels: Array<number>(S * S).fill(0), structures: [], entities: [], runes: [], phases: [] };
    return (entry.sample = { id, name: def.name, description: def.description, environment: def.environment, path, draft: best?.draft ?? 0, changed: best?.changed ?? 0, mini, ...(best ? {} : { error }) });
  }

  /** Files changed by the latest commits of this session: the studio shows them glowing. */
  recentChanges(): Map<string, { author: string; message: string; time: number }> {
    return this.repo.recentChanges(24);
  }

  /** E in the corona and in the studio: doors, stairs, shelves, frames, the notice board, people. */
  private interactStudio(): void {
    const p = this.wandererPos();
    // Standing on a teleport, the stairs or the exit: that, before whoever stands near.
    const under = this.zone === 'studio' ? this.corona.itemNear(p.x, p.y) : undefined;
    const onPad = under && ['portal', 'up', 'down', 'exit', 'less', 'more'].includes(under.kind) && Math.hypot(under.x + 0.5 - p.x, under.y + 0.5 - p.y) < 0.75;
    const a = onPad ? undefined : this.archive.nearest(p.x, p.y);
    if (a) return void this.bus.emit('ui:agentchat', { agent: a.agent, name: a.name });
    if (this.zone === 'corona') {
      const b = this.corona.doorNear(p.x, p.y);
      if (b) {
        Object.assign(p, this.corona.entrance(b));
        this.message(`${b.name}${b.storeys.length > 1 ? ` — ${b.storeys.length} piani` : ''}`);
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
      case 'graph':
        this.bus.emit('ui:graph', {});
        return;
      case 'situation':
        this.bus.emit('ui:situation', { situation: this.situation() });
        return;
      case 'wall':
        this.openScreen(it.target as ScreenField);
        return;
      case 'console':
        this.openScreen('feed');
        return;
      case 'station':
        this.openStation(it.target!);
        return;
      case 'bench':
        this.openBench();
        return;
      case 'lectern':
        this.openBible();
        return;
      case 'slab':
        this.openRule(it.target ?? '');
        return;
      case 'lathe':
        this.openTornio();
        return;
      case 'showcase':
        this.openShowcase(it.target!);
        return;
      case 'prev':
      case 'next':
        if (it.target === 'time') this.stepTimeline(it.kind === 'prev' ? 1 : -1);
        else if (it.target === 'bench') this.stepBench(it.kind === 'prev' ? -1 : 1);
        else if (it.target === 'lectern') this.stepBible(it.kind === 'prev' ? -1 : 1);
        else if (it.target === 'regole') this.stepRules(it.kind === 'prev' ? -1 : 1);
        else if (it.target === 'lathe') this.stepTornio(it.kind === 'prev' ? -1 : 1);
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
        const next = room.storey.index + (it.kind === 'up' ? 1 : -1);
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
    const it = this.corona.itemNear(rx, ry, 1.6, ['showcase', 'prev', 'next', 'less', 'more', 'graph', 'situation', 'wall', 'console', 'station', 'bench', 'lectern', 'layout', 'slab', 'lathe']);
    if (!it) return false;
    const p = this.wandererPos();
    const c = tileNear(it, p.x, p.y);
    if (Math.hypot(c.x + 0.5 - p.x, c.y + 0.5 - p.y) > 4) {
      this.message('Troppo lontano: avvicinati.');
      return false;
    }
    if (it.kind === 'graph') this.bus.emit('ui:graph', {});
    else if (it.kind === 'situation') this.bus.emit('ui:situation', { situation: this.situation() });
    else if (it.kind === 'wall') this.openScreen(it.target as ScreenField);
    else if (it.kind === 'console') this.openScreen('feed');
    else if (it.kind === 'station') this.openStation(it.target!);
    else if (it.kind === 'bench') this.openBench();
    else if (it.kind === 'lectern') this.openBible();
    else if (it.kind === 'slab') this.openRule(it.target ?? '');
    else if (it.kind === 'lathe') this.openTornio();
    else if (it.target === 'time') this.stepTimeline(it.kind === 'prev' ? 1 : -1);
    else if (it.target === 'bench') this.stepBench(it.kind === 'prev' ? -1 : 1);
    else if (it.target === 'lectern') this.stepBible(it.kind === 'prev' ? -1 : 1);
    else if (it.target === 'regole') this.stepRules(it.kind === 'prev' ? -1 : 1);
    else if (it.target === 'lathe') this.stepTornio(it.kind === 'prev' ? -1 : 1);
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
    const extra = [
      'corona-albero-luce', 'corona-lampione', 'corona-panchina', 'corona-totem',
      'corona-drone', 'corona-treno',
      'corona-gerboa', 'corona-gerboa-narrator', 'corona-gerboa-cartographer',
      'corona-gerboa-artist', 'corona-gerboa-sculptor', 'corona-gerboa-physicist',
      'corona-gerboa-engineer', 'corona-gerboa-arbiter', 'corona-gerboa-liaison', 'corona-gerboa-musician', 'corona-gerboa-actor',
      'schermo-scritte', 'schermo-struttura', 'circuito-3D'
    ];
    for (const m of extra) {
      if (this.forms.info(m)) this.forms.preload(m);
    }
    if (this.plinthSculpture) this.updatePlinto();
    else if (this.zone === 'corona') this.visitCorona(this.tickCount);
  }

  /** What a source of showcases has to show, in a stable order. */
  showcaseEntries(source: ShowcaseSource): ShowcaseEntry[] {
    // The places change as they are planned, loaded (what is known of them) and visited (their order).
    const here = this.lastChunk();
    const stamp = source === 'chunks' ? `${this.graphChunksVersion}|${this.plannedCount}|${this.chunks.size}|${here.cx},${here.cy}` : '';
    const hit = this.showcaseCache.get(source);
    if (hit?.files === this.files && hit.stamp === stamp) return hit.entries;
    const entries = this.listShowcase(source);
    this.showcaseCache.set(source, { files: this.files, stamp, entries });
    return entries;
  }

  /** The place where the wanderer stands, or (from the studio) last stood in the world. */
  private lastChunk(): { cx: number; cy: number } {
    const S = this.config.chunkSize;
    const p = this.corona.isInterior(this.wandererPos().x) ? this.lastWorld : this.wandererCarpet();
    return { cx: Math.floor(p.x / S), cy: Math.floor(p.y / S) };
  }

  private listShowcase(source: ShowcaseSource): ShowcaseEntry[] {
    const out: ShowcaseEntry[] = [];
    if (source === 'runes') {
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
        const facts: Array<[string, string]> = [['Rune', tokens.map((t) => `${runes[t].glyph} ${runes[t].name} («${t}», ${italianName('elementi', runes[t].element)})`).join(' · ')]];
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
    if (source === 'chunks') return this.listChunks();
    if (source === 'items') {
      for (const d of [...this.content.items.values()].sort((a, b) => a.id.localeCompare(b.id))) {
        const path = `modules/${this.content.itemSource.get(d.id) ?? d.module ?? ''}/manifest.json`;
        out.push({ id: `item:${d.id}`, label: d.name, model: this.forms.resolve(d.model, 'object'), tint: d.color, color: d.color, path: this.files[path] ? path : undefined, facts: [['Oggetto', d.id], ['Categoria', d.category], ['Descrizione', d.description], ...(d.look ? [['Aspetto', d.look] as [string, string]] : []), ['Peso', String(d.weight)]] });
      }
      return out;
    }
    // People and things: the modules of their building that have a look.
    const people = readPeople(this.files).people;
    for (const path of Object.keys(this.files).sort()) {
      // The building of the source: the studio's room, `persone` or `cose` (T307b: the sources are internal, the rooms are not).
      if (!/^modules\/[^/]+\/manifest\.json$/.test(path) || folderOf(path) !== (source === 'people' ? 'persone' : 'cose')) continue;
      let man: Manifest;
      try {
        man = JSON.parse(this.files[path]);
      } catch {
        continue;
      }
      if (!man.appearance) continue;
      const facts: Array<[string, string]> = [['Modulo', man.id]];
      if (man.description) facts.push(['Descrizione', man.description]);
      if (man.appearance.look) facts.push(['Aspetto', man.appearance.look]);
      if (man.context) facts.push(['Contesto', man.context]);
      if (man.lore) facts.push(['Storia', man.lore]);
      if (man.persona) facts.push(['Carattere', man.persona]);
      const model = this.formFor(man, man.id).model;
      const who = source === 'people' ? people.filter((x) => x.kind === man.id) : [];
      if (who.length) facts.push(['Individui', who.map((x) => `${x.name} (${x.job})`).join(', ')]);
      out.push({ id: `module:${man.id}`, label: man.name, model, color: man.appearance.color, path, facts });
      // T23: after its type, each individual, with the look it has in the world (its seed) and the module under it.
      for (const p of who)
        out.push({ id: `individual:${p.name}`, label: `${p.name} · ${p.job}`, model, seed: this.forms.seedFor(model, p.origin ?? p.name), color: man.appearance.color, path, facts: [...individualFacts(p, man.name), ...facts.filter(([w]) => w !== 'Individui').map(([w, t]): [string, string] => [w === 'Aspetto' || w === 'Carattere' ? `${w} del tipo` : w, t])] });
    }
    return out;
  }

  /**
   * The places planned in this universe (T26), the one where the wanderer last stood first, then the others by distance;
   * what is known of each: where, the region, the environment (its module: «Apri il file»), what is inside and outside,
   * the structures, the runes, the file of its plan.
   */
  private listChunks(): ShowcaseEntry[] {
    const here = this.lastChunk();
    const far = (p: { cx: number; cy: number }) => Math.hypot(p.cx - here.cx, p.cy - here.cy);
    const chunks = mergeChunks(this.files, [...this.graphChunks.values()]).sort((a, b) => far(a) - far(b) || a.cx - b.cx || a.cy - b.cy);
    const atlas = readAtlas(this.files);
    const nameOf = (id: string) => this.modules.get(id)?.manifest.name ?? id;
    const list = (xs: string[]) => [...new Set(xs)].join(', ');
    return chunks.map((p): ShowcaseEntry => {
      const key = this.chunkKey(p.cx, p.cy);
      const plan = this.chunks.get(key)?.plan;
      const region = p.cx === 0 && p.cy === 0 ? undefined : regionAt(atlas, p.cx, p.cy);
      const env = p.ambiente ? this.content.layouts[p.ambiente] : undefined;
      const envModule = p.ambiente ? [...this.modules.values()].find((m) => m.manifest.layouts?.[p.ambiente!]) : undefined;
      const path = envModule ? `modules/${envModule.manifest.id}/manifest.json` : undefined;
      const facts: Array<[string, string]> = [['Dove', `luogo ${p.cx}, ${p.cy}${p.cx === here.cx && p.cy === here.cy ? ' (qui sei stato per ultimo)' : ''}`]];
      if (region) facts.push(['Regione', `${region.name}: ${region.description}`]);
      if (p.descrizione) facts.push(['Descrizione', p.descrizione]);
      if (p.ambiente) facts.push(['Ambiente', env ? `${env.name} (${p.ambiente}): ${env.description}` : p.ambiente]);
      if (plan) {
        const by = (w: Where) => list(plan.objects.filter((o) => o.where === w).map((o) => nameOf(o.module)));
        if (by('inside')) facts.push(['Dentro', by('inside')]);
        if (by('outside')) facts.push(['Fuori', by('outside')]);
        if (by('anywhere')) facts.push(['Ovunque', by('anywhere')]);
      } else if (p.cose?.length) facts.push(['Cose', list(p.cose.map(nameOf))]);
      if (p.a_terra?.length) facts.push(['A terra', list(p.a_terra)]);
      if (p.strutture?.length) facts.push(['Strutture', list(p.strutture)]);
      // The runes as they lie there (the starting place has its own), when the place is loaded.
      const runes = plan ? this.miniature(p.cx, p.cy)?.runes : undefined;
      if (runes?.length) facts.push(['Rune', [...new Set(runes.map((r) => r.line))].map((l) => `«${runes.filter((r) => r.line === l).map((r) => r.token).join(' ')}»`).join(' · ')]);
      facts.push(['Piano', `maps/${this.recordKey({ cx: p.cx, cy: p.cy, key } as Chunk).replace(/[:,]/g, '_')}.json`]);
      return { id: `chunk:${p.cx}_${p.cy}`, label: p.nome, place: { cx: p.cx, cy: p.cy }, path, facts };
    });
  }

  /** What a showcase (by building) shows now, with its place in the list; a model of places also its phase (T26). */
  showcaseOf(building: string): { entry: ShowcaseEntry; index: number; count: number; phase?: number } | undefined {
    const source = this.corona.building(building)?.storeys[0]?.items.find((i) => i.kind === 'showcase')?.source;
    const all = source ? this.showcaseEntries(source) : [];
    if (!all.length) return undefined;
    const index = (((this.showcaseIndex.get(building) ?? 0) % all.length) + all.length) % all.length;
    return { entry: all[index], index, count: all.length, ...(source === 'chunks' ? { phase: this.showcasePhase.get(building) ?? PLACE_PHASES.length - 1 } : {}) };
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
    const paths = new Set(b?.storeys.flatMap((f) => f.items.map((i) => i.path).filter(Boolean)) as string[]);
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
    const own = (o: { look?: string; model?: string }, name: string, fallback: string) => {
      if (why) o.look = `${o.look ?? name}; ${why}`;
      const current = o.model && this.forms.info(o.model) ? o.model : undefined;
      if (!current || this.sculpting.isGeneric(current)) o.model = ownModelId(fallback);
      return { id: o.model!, previous: current };
    };
    let req: { id: string; previous?: string; nome: string; aspetto: string; classe: string; worn?: WornZone } | undefined;
    if (kind === 'module' && load(this.modules.get(id)?.manifestPath)) {
      if (!man.appearance) return false;
      const r = own(man.appearance, man.name, man.id);
      req = { ...r, nome: man.name, aspetto: man.appearance.look ?? man.description ?? man.name, classe: man.appearance.class ?? this.forms.classOf(this.forms.resolve(r.previous ?? r.id, undefined)).id };
    } else if (kind === 'item' && load(this.modules.get(this.content.itemSource.get(id) ?? '')?.manifestPath)) {
      const it = (man.items ?? []).find((x: ItemDef) => x.id === id);
      const o = it ?? man.appearance;
      if (!o) return false;
      const r = own(o, it?.name ?? man.name, id);
      // A thing worn keeps (or gets) its section for its zone (T290).
      const zone = this.wornZone(id);
      req = { ...r, nome: it?.name ?? man.name, aspetto: o.look ?? it?.description ?? man.name, classe: 'object', ...(zone ? { worn: zone } : {}) };
    } else if (kind === 'model') {
      const info = this.forms.info(id);
      const previous = this.repo.working[`models/${id}.xml`];
      if (!previous) return false;
      this.council.say('artist', 'propone', `da riscolpire: ${target}${why ? ` (${why})` : ''}`, 'sculptor', 'model.resculpt');
      // A program with a worn section is redone with one for the same zone (T290).
      const zone = wornSections(previous).map((w) => w.zone).find(isWornZone);
      void this.sculpting.make({ id, nome: info?.name ?? id, aspetto: `${info?.name ?? id}${why ? `; ${why}` : ''}`, classe: info?.class ?? 'object', previous, ...(why ? { desiderio: why } : {}), ...(zone ? { worn: zone } : {}) });
      return true;
    } else return false;
    this.repo.write(path!, JSON.stringify(man, null, 2) + '\n');
    this.applyFiles({ ...this.repo.working });
    this.repo.commit(`scultore: da riscolpire ${target}`, 'agent');
    this.council.say('artist', 'propone', `da riscolpire: ${target}${why ? ` (${why})` : ''}`, 'sculptor', 'model.resculpt');
    const previous = req.previous ? this.repo.working[`models/${req.previous}.xml`] : undefined;
    void this.sculpting.make({ id: req.id, nome: req.nome, aspetto: req.aspetto, classe: req.classe, ...(previous ? { previous } : {}), ...(why ? { desiderio: why } : {}), ...(req.worn ? { worn: req.worn } : {}) });
    return true;
  }

  /** The Sculptor's models per class (universe.json → ai.scultori over the defaults). */
  sculptors(): SculptorAiModels {
    return { ...DEFAULT_SCULPTORS, ...internalSculptors(this.config.ai.sculptors ?? {}) };
  }

  // --- The cards brought before the start (T295, ADR-0170) --------------------------------------------------------------------

  private broughtCache?: { files: FileMap; list: Array<{ id: string; info: ModelInfo }> };

  /**
   * The models that came with a choice of cards (`brought` in the library's index) and work here: one isolated (T296) is not offered to the
   * Cartographer, to the Narrator or to the `ModelDirector`, which would copy it again under the id of a request.
   */
  broughtModels(): Array<{ id: string; info: ModelInfo }> {
    if (this.broughtCache?.files !== this.files) this.broughtCache = { files: this.files, list: broughtModels(this.files) };
    return this.broken.size ? this.broughtCache.list.filter(({ id }) => this.forms.usable(id)) : this.broughtCache.list;
  }

  /** The structures that came with the cards, by the concept they are named by and their size: the Cartographer may ask for them, and they cost nothing. */
  broughtStructures(): Array<{ id: string; class: string; concept: string; size?: SizeTier }> {
    return this.broughtModels()
      .filter(({ info }) => info.class === 'structure' || info.class === 'building')
      .map(({ id, info }) => ({ id, class: info.class, concept: info.name ?? id, ...(sizeOf(info.size) ? { size: info.size as SizeTier } : {}) }));
  }

  /** What the agents of the Genesis are told came with the cards: everything for the style guide, the music by environment, the figures and things by name. */
  private broughtForGenesis(): GenesisBrought | undefined {
    const all = this.broughtModels();
    if (!all.length) return undefined;
    const music = soundPrograms(this.files).filter((p) => all.some((b) => b.id === p.id) && p.sound?.use === 'music' && p.sound.environments?.length);
    return {
      all: all.map(({ id, info }) => ({ name: info.name ?? id, class: info.class })),
      music: music.map((p) => ({ name: p.name ?? p.id, environments: p.sound!.environments! })),
      cast: all.filter(({ info }) => CAST_CLASSES.has(info.class)).map(({ id, info }) => ({ name: info.name ?? id, class: info.class })),
    };
  }

  /**
   * The choice of the cards closes (T295, ADR-0170): when the Genesis begins, or when the first wanderer enters (`lockSettings`). universe.json loses
   * `cardChoice` in a commit of the kernel; a mirror, the bench and a universe that is only read write nothing.
   */
  private closeCardChoice(why: string): void {
    if (this.mirror || this.bench || !this.config.cardChoice || this.readOnly() !== undefined) return;
    const text = this.repo.working['universe.json'];
    if (text === undefined) return;
    const closed = withCardChoice(text, undefined);
    this.writeCommanded('universe.json', closed);
    this.config = { ...this.config, cardChoice: undefined };
    this.files = { ...this.files, 'universe.json': closed };
    this.repo.commit(`la scelta delle carte si chiude: ${why}`, 'kernel');
  }

  /** What the master may bring now, from the store (kin universes, handmade cards, whether the choice is open); undefined without one. */
  async cardChoice(): Promise<KinView | undefined> {
    const b = this.repo.backend;
    if (this.mirror || !b?.kin) return undefined;
    return b.kin().catch(() => undefined);
  }

  /**
   * Brings the cards chosen (T295): the store reads them from the disk, checks them and commits them (one commit of the kernel); here the
   * same files enter this session, and the next commit finds them on the disk already. Only the master, only while the choice is open
   * and before the match.
   */
  async bringCards(cards: BringRef[]): Promise<BringAnswer> {
    const no = (reason: string): BringAnswer => ({ ok: false, reason });
    if (this.mirror) return no('le carte le porta il mondo, non uno specchio');
    if (!this.isMaster()) return no('solo il master porta le carte nel suo universo');
    if (this.settingsLocked) return no('la partita è cominciata: le carte si portano prima');
    if (!this.config.cardChoice) return no('la scelta delle carte è chiusa');
    if (this.readOnly() !== undefined) return no('questo universo si legge soltanto');
    const b = this.repo.backend;
    if (!b?.bring) return no('senza il server degli universi le carte non vengono');
    const r = await b.bring(cards).catch((e: unknown): BringAnswer => no((e as Error).message));
    if (!r.ok) {
      this.council.say('kernel', 'scarta', `carte da portare: ${r.reason}${r.cards?.length ? ` (${r.cards.map((c) => `${c.card}: ${c.reason}`).join('; ')})` : ''}`);
      return r;
    }
    // The store committed the cards; this commit finds them on the disk and carries only what the kernel keeps (ledgers, graph).
    for (const [p, v] of Object.entries(r.changes)) this.repo.write(p, v);
    this.applyFiles({ ...this.repo.working });
    this.repo.commit(`il kernel prende le carte portate: ${r.brought.map((x) => x.id).join(', ')}`, 'kernel');
    for (const x of r.brought) this.bus.emit('model:added', { id: x.id });
    this.council.say('kernel', 'approva', `carte portate: ${r.brought.map((x) => `«${x.name}» (${x.from})`).join(', ')}`);
    return r;
  }

  /** A program enters the library (or replaces one): validated, written with its index entry, committed. */
  addModel(id: string, xml: string, info: ModelInfo, message: string, card?: { task: string; author: string; chi?: string }): boolean {
    const path = `models/${id}.xml`;
    // A large structure's program without a box of its own runs in its class's at its size (ADR-0160): it is tried there.
    const errors = this.validator.validateFile(path, xml, info.class === 'structure' ? entryBox(classOf('structure')!, info) : undefined);
    if (errors.length) {
      this.council.say('kernel', 'scarta', errors.join('; '), card?.author === 'musician' ? 'musician' : 'sculptor', card?.task ?? 'model.sculpt');
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
    const c = card ? this.commitContent(message, card.task, card.author, card.chi) : this.repo.commit(message, 'agent');
    this.council.say('kernel', 'approva', `modello «${info.name ?? id}» (${id}) → validato, commit ${c.id}`, undefined, card?.task ?? 'model.sculpt');
    this.bus.emit('model:added', { id });
    return true;
  }

  // --- The cards that do not work here (T296, ADR-0172) -----------------------------------------------------------------------

  /** Whether a model of the library is a card that came with a choice (T295): only those are isolated and taken away like this. */
  private isBrought(model: string): boolean {
    return typeof this.forms.info(model)?.brought === 'string';
  }

  /** A form is ready: a brought card's program that made nothing one sees is broken. */
  private formReady(f: Form): void {
    if (!f.result || this.broken.has(f.model) || !this.isBrought(f.model) || !this.forms.current(f)) return;
    if (!anyVisible(f.result.grid, f.result.palette)) this.cardBroke(f.model, 'empty', breakReason('empty', { seed: f.seed }));
  }

  /** A form failed: a brought card's program that threw, or whose worker stopped or did not answer, is broken. */
  private formFailed(f: Form): void {
    if (this.broken.has(f.model) || !this.isBrought(f.model) || !this.forms.current(f)) return;
    this.cardBroke(f.model, 'fault', breakReason('fault', { seed: f.seed, error: f.error }));
  }

  /**
   * A brought card does not work in this world (T296, ADR-0172): it and its copies (the same program under other ids, `cardFamily`) are
   * isolated, what wore them wears the generic model of its class, and the master is shown why (a fault, `card:<id>`; in the world, a line of
   * the Council's log, which only the master hears). The forms say it of a model, the sound director of a sound, a mirror of what its world
   * said. What is not a brought card, or is already broken, changes nothing: false.
   */
  cardBroke(id: string, why: BreakKind, reason: string): boolean {
    if (typeof id !== 'string' || this.broken.has(id) || !this.isBrought(id)) return false;
    const info = this.forms.info(id)!;
    const name = reasonText(info.name, 120) || id;
    const kind = info.class === SOUND_CLASS ? 'sound' : 'model';
    const text = reasonText(reason) || breakReason(why);
    const family = cardFamily(this.files, id);
    for (const f of family) {
      if (this.broken.has(f)) continue;
      this.broken.set(f, { id: f, name, kind, why, reason: text, ...(f !== id ? { same: id } : {}) });
      this.forms.isolate(f);
    }
    this.unwear(new Set(family));
    // Alone the one who plays is the master; in a game of many the master's mirror (the one with a branch to publish), never a player's.
    if (!this.mirror || this.publisher) this.faults.raise(`card:${id}`, brokenFault(this.broken.get(id)!));
    const meanwhile = kind === 'sound' ? 'Il suono tace' : 'Chi la usava veste il modello generico';
    if (!this.mirror) this.council.say('kernel', 'obietta', `la carta «${name}» (${family.join(', ')}) non funziona in questo mondo: ${text}. ${meanwhile}; il master può toglierla dalla console, scheda Universo.`, kind === 'sound' ? 'musician' : 'sculptor', 'card.broken');
    this.bus.emit('card:broken', { id, ids: family, why, reason: text });
    return true;
  }

  /** The brought cards that do not work in this world, and why. */
  brokenCards(): BrokenCard[] {
    return [...this.broken.values()];
  }

  /** The brought cards of this universe as the master's console lists them: one per card (its copies with it), and why one does not work. */
  broughtCards(): BroughtCardView[] {
    return broughtCardsOf(this.files, this.broken);
  }

  /**
   * On a mirror, what its world says is broken (T296): the same cards isolated here, so that this client draws what the world uses, and the
   * master's console shows them. What this client found broken by itself stays so.
   */
  worldBroken(list: readonly BrokenCard[]): void {
    if (!this.mirror) return;
    for (const b of list) if (!this.broken.has(b.id)) this.cardBroke(b.id, b.why, b.reason);
  }

  /** A form as this kernel wears it (a mirror, of what its world sends): a card isolated here gives way to the generic of its class, which waits for it. */
  worn<T extends { model: string; seed: number | string }>(fc: T): T | (T & { wanted: string; classe: string }) {
    if (!this.broken.has(fc.model) || this.forms.usable(fc.model)) return fc;
    const classe = this.forms.classOf(fc.model).id;
    const model = this.forms.resolve(fc.model, classe);
    return { ...fc, model, seed: this.forms.seedFor(model, `${fc.model}#${fc.seed}`), wanted: fc.model, classe };
  }

  /** What wears these models wears the generic of its class, and waits for its own (`wanted`): the card mended, or what the Sculptor makes of the id. */
  private unwear(ids: ReadonlySet<string>): void {
    for (const e of this.ecs.query('form')) {
      const fc: FormComp | undefined = this.ecs.get(e, 'form');
      if (!fc || !ids.has(fc.model)) continue;
      const own = fc.model;
      const classe = fc.classe ?? this.forms.classOf(own).id;
      const model = this.forms.resolve(own, classe);
      if (model === own) continue;
      Object.assign(fc, { model, seed: this.forms.seedFor(model, this.ecs.get(e, 'origin')?.key ?? String(e)), wanted: own, classe });
      this.instanceFeet.delete(e);
    }
  }

  /**
   * The broken cards whose program is gone or written anew: not broken any more, their faults closed, their isolation let go. A program written
   * anew is tried again; one that comes back (a return to a commit of before) too, and if it still fails it is found broken again. One still
   * broken as it is written stays shown: a rollback clears every fault, and this card is no better for it.
   */
  private forgetMended(): void {
    for (const [id, b] of [...this.broken]) {
      if (this.forms.info(id) && !this.forms.usable(id)) {
        if (!b.same && (!this.mirror || this.publisher) && !this.faults.has(`card:${id}`)) this.faults.raise(`card:${id}`, brokenFault(b));
        continue;
      }
      this.broken.delete(id);
      this.faults.clear(`card:${id}`);
      this.forms.release(id);
    }
  }

  /**
   * The structures that wore a card taken away (T296) wear what their concept wears now: the kernel's own entry of the concept at its size,
   * or another card that came with the same name (`structureModelFor`), and the `ModelDirector` sculpts what is missing.
   */
  private repoint(ids: ReadonlySet<string>): Set<string> {
    const now = new Set<string>();
    for (const e of this.ecs.query('structure', 'form')) {
      const s = this.ecs.get(e, 'structure') as { model?: string; concept: string; size?: SizeTier };
      if (!s.model || !ids.has(s.model)) continue;
      const own = this.structureModelFor(s.concept, s.size);
      s.model = own;
      now.add(own);
      const fc: FormComp = this.ecs.get(e, 'form');
      if (fc.wanted && ids.has(fc.wanted)) fc.wanted = own;
    }
    return now;
  }

  /**
   * The master takes a brought card away from this universe (T296, ADR-0172), with a commit of the kernel: its program and its entry, and those
   * of its copies. What wore it wears the generic of its class and waits for the `ModelDirector`; the music of its environments is the
   * `ScoreDirector`'s to write again; within their caps. If the Council cannot make it again now, the world notes what it lacks (ADR-0130). The
   * card stays where it came from (the universe of its card, the archive of its author) and in this universe's history. Only the master; a mirror
   * asks its world; nothing for a universe that is only read.
   */
  async removeCard(id: string, by: string = this.wanderer().id): Promise<RemoveCardAnswer> {
    const no = (reason: string): RemoveCardAnswer => ({ ok: false, reason });
    if (this.mirror) return no('le carte le toglie il mondo, non uno specchio');
    if (!this.isMaster(by)) return no('solo il master toglie una carta dal suo universo');
    if (this.readOnly() !== undefined) return no('questo universo si legge soltanto');
    if (typeof id !== 'string' || !CARD_ID_RE.test(id) || !this.forms.info(id)) return no('nessuna carta con questo id in questo universo');
    if (!this.isBrought(id)) return no('così si tolgono solo le carte portate prima della Genesi');
    const info = this.forms.info(id)!;
    const name = reasonText(info.name, 120) || id;
    const kind = info.class === SOUND_CLASS ? 'sound' : 'model';
    const family = cardFamily(this.files, id);
    const ids = new Set(family);
    const why = family.map((f) => this.broken.get(f)?.reason).find(Boolean);
    // What wore it lets go first, while the library still says its class; the structures wear what their concept wears without it.
    for (const f of family) this.forms.isolate(f);
    this.unwear(ids);
    const repointed = this.repoint(ids);
    for (const [p, v] of Object.entries(withoutCards(this.repo.working, family))) this.repo.write(p, v);
    this.applyFiles({ ...this.repo.working });
    // Gone from the library: a return to a commit of before brings it back as it was, to be tried again.
    for (const f of family) this.forms.release(f);
    const lacking = this.lacksAfterRemoval(kind, name, info, new Set([...ids, ...repointed]), why);
    const c = this.repo.commit(`il master toglie la carta «${name}» (${family.join(', ')})${why ? `: ${why}` : ''}`, 'kernel');
    this.council.say('kernel', 'scarta', `carta tolta dal master: «${name}» (${family.join(', ')}) → commit ${c.id}${lacking ? `; ${lacking}` : ''}`, kind === 'sound' ? 'musician' : 'sculptor', 'card.remove');
    this.bus.emit('card:removed', { id, ids: family });
    const next = kind === 'sound' ? 'il suono tace finché il Musicista non scrive un brano nuovo' : 'chi la usava veste il modello generico della sua classe finché lo Scultore non ne scrive uno';
    return { ok: true, removed: family, commit: c.id, text: `«${name}» è tolta (commit ${c.id}): ${lacking ?? next}.` };
  }

  /**
   * After a card is taken away: what the Council would have to make again, and cannot now (the local models, a cap, a knob at zero), is a
   * shortfall (ADR-0130), with the card's reason. What it can make, it will, at its own pace: nothing to note. Says why not, or undefined.
   */
  private lacksAfterRemoval(kind: 'model' | 'sound', name: string, info: ModelInfo, ids: ReadonlySet<string>, why: string | undefined): string | undefined {
    const card = `la carta «${name}» è tolta${why ? ` (${why})` : ''}`;
    if (kind === 'model') {
      // What the world still names (a module, an item, a structure of a concept): the director would sculpt it, if it could.
      const wanted = this.sculpting.missing().filter((r) => ids.has(r.id));
      const blocked = wanted.length ? this.sculpting.blocked() : undefined;
      if (!blocked) return undefined;
      for (const r of wanted) this.noteShortfall({ request: `il modello di «${r.nome}»`, agent: 'sculptor', task: 'model.sculpt', outcome: 'fault', reason: `${card}; ${blocked}` });
      return `${blocked}; resta il modello generico`;
    }
    const environments = info.sound?.use === 'music' ? (info.sound.environments ?? []) : [];
    const blocked = environments.length ? this.composing.blocked() : undefined;
    if (!blocked) return undefined;
    this.noteShortfall({ request: `la musica di ${environments.join(', ')}`, agent: 'musician', task: COMPOSE_TASK, outcome: 'fault', reason: `${card}; ${blocked}` });
    return `${blocked}; suona la musica del momento`;
  }

  /** Which file a piece of the Council's work is about (the avatars walk there). */
  pathForFeed(e: FeedEntry): string | undefined {
    // The Musician works before the screen of the Artist's house: its programs stand on shelves upstairs, out of sight.
    if (e.task?.startsWith('sound.')) return undefined;
    for (const id of this.modules.keys()) if (e.text.includes(id)) return this.modules.get(id)!.manifestPath;
    const t = e.task ?? '';
    if (t.startsWith('chunk.')) return 'modules/world.layouts/manifest.json';
    if (t.startsWith('genesis.')) return t === 'genesis.terrain' || t === 'genesis.physics' ? 'modules/world.terrain/manifest.json' : 'world/bible.json';
    if (t.startsWith('content.')) return 'modules/items.base/manifest.json';
    if (t === 'action.judge') return 'modules/core.effects/logic.lua';
    if (t === 'spell.name') return this.files['modules/magic.spells/manifest.json'] ? 'modules/magic.spells/manifest.json' : 'modules/magic.runes/manifest.json';
    if (t.startsWith('model.')) return 'world/style.md';
    // The Actor's lines are about no file: it speaks from its post in the Studio of the Characters.
    if (e.from === 'actor') return undefined;
    return e.from === 'kernel' ? undefined : `prompts/agents/${e.from}.md`;
  }

  /** The player talks to an agent of the Council, in the corona. It may accept to make something. */
  async talkToAgent(agent: AgentId, text: string): Promise<{ say: string; forged?: string; runes?: string[] }> {
    const history = this.agentTalks.get(agent) ?? [];
    this.agentTalks.set(agent, history);
    const chi = this.payerNow();
    const here = this.chunkAt(this.wandererCarpet().x, this.wandererCarpet().y)?.plan?.layout;
    if (agent === 'liaison') return this.askLiaison(text, history, chi, here);
    let r;
    try {
      r = await agentReply(this.council, agent, history, text);
    } catch (e) {
      this.noteShortfall({ request: text, who: chi, agent: agent, task: 'agent.chat', outcome: 'error', reason: (e as Error).message });
      return { say: `(${AGENTS[agent].name} non risponde: ${(e as Error).message})` };
    }
    history.push({ who: 'player', text }, { who: 'npc', text: r.say });
    this.archive.go(agent, undefined, r.say);
    if (!r.forge) return { say: r.say };
    if (agent === 'cartographer') {
      const env = await this.createEnvironment(r.forge);
      return { say: r.say, forged: env.summary };
    }
    if (agent === 'musician') return { say: r.say, forged: (await this.composing.make({ richiesta: r.forge }, chi, here)).summary };
    const f = await this.forgeModule(r.forge, 'agente', undefined, true);
    return { say: r.say, forged: f.summary };
  }

  /**
   * The Referente takes the transcended wanderer's request to the right team: the Forge, the
   * Cartographer, the Artist, the rules, the Narrator's packs. The Council says yes to almost anything.
   */
  private async askLiaison(text: string, history: Turn[], chi: string, here: string | undefined): Promise<{ say: string; forged?: string; runes?: string[]; credits?: { target: string; amount: number } }> {
    const lacking = (esito: 'refusal' | 'invalid' | 'error', motivo: string, agente: AgentId = 'liaison') => this.noteShortfall({ request: text, who: chi, agent: agente, task: 'referente.coordinate', outcome: esito, reason: motivo });
    let r;
    try {
      r = await liaisonReply(this.council, history, text);
    } catch (e) {
      lacking('error', (e as Error).message);
      return { say: `(il Referente non risponde: ${(e as Error).message})` };
    }
    history.push({ who: 'player', text }, { who: 'npc', text: r.say });
    this.archive.go('liaison', undefined, r.say);
    if (r.refusal) {
      lacking('refusal', r.refusal);
      return { say: r.say, forged: `Il Concilio rifiuta: ${r.refusal}` };
    }
    const req = r.request ?? text;
    this.council.say('liaison', 'info', `il viandante chiede: «${text}» → ${r.task}`, r.task === 'environment' ? 'cartographer' : r.task === 'resculpt' ? 'artist' : r.task === 'music' ? 'musician' : r.task === 'rule' ? 'arbiter' : r.task === 'none' ? undefined : 'narrator', 'referente.coordinate');
    switch (r.task) {
      case 'item':
        return { say: r.say, forged: (await this.forgeModule(req, 'agente', 'item', true)).summary };
      case 'thing':
        return { say: r.say, forged: (await this.forgeModule(req, 'agente', 'object', true)).summary };
      case 'character':
        return { say: r.say, forged: (await this.forgeModule(req, 'agente', 'npc', true)).summary };
      case 'environment':
        return { say: r.say, forged: (await this.createEnvironment(req)).summary };
      case 'items':
        return { say: r.say, forged: (await this.growContent(`richiesta del viandante: ${req}`, 12, true, chi)) ? 'Il Narratore ha scritto un pacchetto di oggetti nuovi.' : 'Il pacchetto non è venuto.' };
      case 'mechanic':
        return { say: r.say, forged: (await this.forgeMechanic(req)).summary };
      case 'rule': {
        this.recordRule({ key: `regola|${normName(req).slice(0, 60)}`, text: req, possible: true, story: 'stabilito dal viandante trasceso, accolto dal Concilio', effects: ['regola'] }, true, { task: 'referente.coordinate', author: this.wanderer().id });
        return { say: r.say, forged: `Nuova regola del mondo: ${req}` };
      }
      case 'rune': {
        // The master's runes (T42f): in a multiplayer game the Council gives them, alone they are found in the world.
        if (!this.manyPlayers() || !this.isMaster()) return { say: r.say, forged: 'Le rune non si chiedono: si trovano nel mondo.' };
        const runes = askedRunes(r.runes);
        if (!runes.length) {
          lacking('invalid', 'non si capisce quali rune');
          return { say: r.say, forged: 'Il Referente non capisce quali rune vuoi.' };
        }
        // A mirror (the kernel of the master's branch) gives nothing: the server gives them in the world.
        if (!this.mirror) this.grantRunes(runes);
        return { say: r.say, forged: `Il Concilio ti dà ${runes.length === 1 ? 'la runa' : 'le rune'} ${runes.map((t) => `«${t}»`).join(' ')}.`, runes };
      }
      case 'music':
        return { say: r.say, forged: (await this.composing.make({ richiesta: req }, chi, here)).summary };
      case 'resculpt': {
        const target = this.findExhibit(r.target ?? req);
        if (!target) {
          lacking('invalid', `non trova «${r.target ?? req}»`, 'sculptor');
          return { say: r.say, forged: `Lo Scultore non trova «${r.target ?? req}».` };
        }
        if (this.requestResculpt(target.target, req)) return { say: r.say, forged: `Lo Scultore riscolpirà «${target.label}».` };
        lacking('invalid', `non può riscolpire «${target.label}»`, 'sculptor');
        return { say: r.say, forged: 'Lo Scultore non può riscolpirlo.' };
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
  gameSetup(): GameSetup {
    return this.config.game;
  }

  /** A multiplayer game (ADR-0050): the carpet, the rollback and the Council are the master's. */
  manyPlayers(): boolean {
    return this.gameSetup()?.mode === 'multiplayer';
  }

  /** Whether a wanderer (the one acting, by default) is the master (T37): alone, always. */
  isMaster(id: string | undefined = this.wanderer().id): boolean {
    return !this.manyPlayers() || (!!id && id === (this.gameSetup().master ?? SOLO));
  }

  /** God mode (T42a): in a multiplayer game the master does not die, has no needs, takes no harm from the others. */
  godMode(id: string | undefined = this.wanderer().id): boolean {
    return this.manyPlayers() && this.isMaster(id);
  }

  /** A wanderer's credit balance in USD (T45a): what the ledger says (ADR-0104); an anonymous one has none. */
  creditsOf(id: string = this.wanderer().id): number {
    return this.isAnonymous(id) ? 0 : this.ledger.balance(id);
  }

  /** Sets a wanderer's credit spending cap for this session (T45d: lobby). */
  setSessionCap(id: string, tetto: number): void {
    if (tetto <= 0) {
      this.sessionCap.set(id, 0);
      this.sessionSpent.set(id, 0);
      return;
    }
    this.sessionCap.set(id, tetto);
    this.sessionSpent.set(id, 0);
    const before = this.capBudgeted.get(id) ?? 0;
    if (tetto <= before) return;
    this.capBudgeted.set(id, tetto);
    const added = addBudgetFromCap(this.config.ai, tetto - before);
    if (this.ai?.limits) {
      this.ai.limits.text += added.textCalls;
    }
  }

  /** Credit spending cap set for this session, if any (T45d). */
  sessionCapOf(id: string = this.wanderer().id): number | undefined {
    return this.sessionCap.get(id);
  }

  /** Amount of credits spent in this session (T45d). */
  sessionSpentOf(id: string = this.wanderer().id): number {
    return this.sessionSpent.get(id) ?? 0;
  }

  private rationing = new Rationing();

  /** Whether the master's knob keeps a call of this task from the models (T247): the Council gives it to the local ones. */
  private rationed(task: string): boolean {
    const knob = knobOfTask(task);
    if (!knob) return false;
    const c = this.coefficients()[knob];
    if (c <= 0) return true;
    return rationedKnob(task) !== undefined && !this.rationing.allows(knob, c);
  }

  /**
   * Whether the calls asked by `id` (a wanderer, or `comune`) can go to the models (T45a, T45d: balance and session ceiling). Where the
   * master pays (T372, ADR-0188) it is the master's purse that answers for everyone: their balance and their ceiling; an anonymous wanderer
   * stays with the local models unless the universe is private (`privateWorld`), and without accounts what the world asks is free as before.
   */
  hasCredits(id: string = this.wanderer().id): boolean {
    if (!this.manyPlayers()) return true;
    if (this.masterPays()) {
      if (id === COMUNE) return !this.commonNeedsPayer || this.canPay(this.masterId());
      if (id !== this.masterId() && this.isAnonymous(id) && !this.privateWorld) return false;
      return this.canPay(this.masterId());
    }
    if (id === COMUNE) return !this.commonNeedsPayer || (this.connectedWanderers?.() ?? []).some((w) => this.hasCredits(w));
    return this.canPay(id);
  }

  /** Whether a wanderer's own purse pays now: an account, credits left, and the session's ceiling not reached. */
  private canPay(id: string): boolean {
    if (this.isAnonymous(id)) return false;
    const tetto = this.sessionCap.get(id);
    const spent = this.sessionSpent.get(id) ?? 0;
    if (tetto !== undefined && spent >= tetto) return false;
    return this.creditsOf(id) > 0;
  }

  /** The master of a game of many (T37); alone, the one who plays. */
  masterId(): string {
    return this.gameSetup()?.master ?? SOLO;
  }

  /** Whether every call of this match is charged to the master (T372, ADR-0188): a game of many whose expenses are the master's. */
  masterPays(): boolean {
    return this.manyPlayers() && this.gameSetup()?.expenses === 'master';
  }

  /**
   * Who is charged for a call asked by `chi` (T372, ADR-0188), the one place where the policy of the match resolves it: where the master
   * pays, the master; otherwise `chi` itself (a wanderer, or `comune`, which `charge` splits). `chi` never changes (rule 8i): the paces,
   * the usage and the shortfalls keep who asked; the cards are whoever is charged (`sign`, D54.1).
   */
  billedTo(chi: string): string {
    return this.masterPays() ? this.masterId() : chi;
  }

  /** Whether a wanderer is anonymous (T44b, T45a): no account, no credits, plays with local models. */
  isAnonymous(id: string = this.wanderer().id): boolean {
    const entry = this.wanderersById.get(id);
    if (entry?.anonymous !== undefined) return entry.anonymous;
    return !!readWandererState(this.files, id)?.anonymous;
  }

  /** Sets whether a wanderer is anonymous (T44b, T45a). An anonymous wanderer has 0 credits. */
  setAnonymous(id: string, anonimo: boolean): void {
    const entry = this.wanderersById.get(id);
    if (entry) entry.anonymous = anonimo;
    const file = playerFile(id);
    const saved = readWandererState(this.files, id);
    if (!saved && !anonimo) return;
    const updated = saved ?? { name: entry?.name ?? id };
    updated.anonymous = anonimo ? true : undefined;
    const text = JSON.stringify(updated, null, 1) + '\n';
    this.files[file] = text;
    this.repo.write(file, text);
  }

  /**
   * Credits a wanderer (T45a), in the ledger. The kernel's own: Lua, the Council, a branch or a file do not get here (ADR-0104). A
   * mirror has nothing to give: it only shows what the server says. False if the wanderer is anonymous or invalid, or the ledger failed.
   */
  giveCredits(id: string, amount: number): boolean {
    if (this.mirror || !validWandererId(id) || !Number.isFinite(amount) || amount <= 0 || this.isAnonymous(id)) return false;
    try {
      const next = this.ledger.credit(id, amount);
      this.bus.emit('credits:changed', { id, crediti: next, delta: amount });
      return true;
    } catch (e) {
      this.log('crediti', `accredito non riuscito: ${(e as Error).message}`);
      return false;
    }
  }

  /**
   * The master gives credits by hand (ADR-0104): to a wanderer the world knows, within the day's cap of this universe, written down
   * with who gave them. On the master's client this asks the server (`ThinClient`).
   */
  async grantCredits(id: string, amount: number, by: string = this.wanderer().id): Promise<{ ok: boolean; motivo?: string }> {
    if (this.mirror) return { ok: false, motivo: 'i crediti li dà solo il server' };
    if (!this.manyPlayers() || !this.isMaster(by)) return { ok: false, motivo: 'i crediti li dà solo il master, in multigiocatore' };
    if (!Number.isFinite(amount) || amount <= 0) return { ok: false, motivo: 'importo non valido' };
    if (!validWandererId(id) || !(this.wanderersById.has(id) || readWandererState(this.files, id))) return { ok: false, motivo: 'viandante sconosciuto' };
    if (this.isAnonymous(id)) return { ok: false, motivo: 'un anonimo non riceve crediti' };
    try {
      const over = this.ledger.grant(by, id, amount, this.grantCap, Date.now());
      if (over) return { ok: false, motivo: `oltre il tetto delle ricariche a mano di oggi: restano ${over.left} crediti` };
    } catch (e) {
      return { ok: false, motivo: (e as Error).message };
    }
    this.bus.emit('credits:changed', { id, crediti: this.creditsOf(id), delta: amount });
    this.council.say('kernel', 'info', `${by} dà ${amount} crediti a ${id}.`);
    return { ok: true };
  }

  /**
   * Applies a credit recharge from Stripe (T45e), once for each event (`Ledger.pay`).
   * Refuses anonymous wanderers and already processed events.
   */
  creditRecharge(payment: PaymentRecord): { ok: boolean; motivo?: string; duplica?: boolean } {
    if (!payment.eventId) return { ok: false, motivo: 'manca eventId' };
    if (this.ledger.payment(payment.eventId)) return { ok: true, duplica: true };
    if (this.isAnonymous(payment.wandererId)) return { ok: false, motivo: 'un anonimo non compra crediti' };
    if (!validWandererId(payment.wandererId)) return { ok: false, motivo: 'impossibile accreditare' };
    if (!this.ledger.pay(payment)) return { ok: true, duplica: true };
    this.bus.emit('credits:changed', { id: payment.wandererId, crediti: this.creditsOf(payment.wandererId), delta: payment.crediti });
    this.bus.emit('payment:received', payment);
    return { ok: true };
  }

  /** What a mirror shows of its own balance: what the server said (T45a). Elsewhere nothing sets a balance. */
  setCredits(id: string, amount: number): boolean {
    if (!this.mirror || !validWandererId(id) || !Number.isFinite(amount) || amount < 0) return false;
    const now = this.ledger.balance(id);
    if (amount > now) this.ledger.credit(id, amount - now);
    else if (amount < now) this.ledger.charge(id, now - amount);
    this.bus.emit('credits:changed', { id, crediti: amount });
    return true;
  }

  /** The platform fee of this world (ADR-0132). */
  get platformFee(): number {
    return this.fee;
  }

  /** What a mirror shows of the fee: what the server said. It charges nothing with it; elsewhere nothing sets it. */
  showPlatformFee(fee: unknown): void {
    if (this.mirror && typeof fee === 'number' && fee >= 0 && fee < 1) this.fee = fee;
  }

  /** Deducts credits from a wanderer (T45a), clamping to 0. Tracks session spending against tetto (T45d). */
  deductCredits(id: string, amount: number): number {
    if (amount <= 0) return this.creditsOf(id);
    const { before: cur, after: next } = this.ledger.charge(id, amount);
    const spentBefore = this.sessionSpent.get(id) ?? 0;
    const spentAfter = Math.round((spentBefore + amount) * 1e6) / 1e6;
    this.sessionSpent.set(id, spentAfter);
    this.bus.emit('credits:changed', { id, crediti: next, delta: -amount });
    // Where the master pays (T372) their purse answers for everyone's requests.
    const whose = this.masterPays() && id === this.masterId() ? 'le richieste di tutti' : 'le sue richieste';
    const tetto = this.sessionCap.get(id);
    if (tetto !== undefined && spentBefore < tetto && spentAfter >= tetto) {
      this.council.say('kernel', 'info', `${id} ha raggiunto il tetto di crediti fissato (${tetto} USD): ${whose} useranno i modelli locali.`);
      this.bus.emit('credits:exhausted', { id, motivo: 'tetto' });
      if (this.wanderer().id === id) {
        this.message('Hai raggiunto il tetto di crediti per questa sessione: le tue richieste saranno gestite dai modelli locali.', 'warn');
      }
    }
    if (cur > 0 && next === 0) {
      this.council.say('kernel', 'info', `I crediti di ${id} sono esauriti: ${whose} useranno i modelli locali.`);
      this.bus.emit('credits:exhausted', { id, motivo: 'finiti' });
      if (this.wanderer().id === id) {
        this.message('Hai esaurito i crediti: le tue richieste saranno gestite dai modelli locali.', 'warn');
      }
    }
    return next;
  }

  /**
   * Deducts credits for a completed model call (T45a).
   * Charges the payer (or divides common expenses equally among connected players) the cost plus the platform fee (ADR-0132).
   */
  billCall(r: CallRecord): void {
    if (!this.manyPlayers() || this.mirror) return;
    try {
      this.charge(r);
    } catch (e) {
      // The floor (rule 7): an archive that does not answer does not stop the world.
      this.log('crediti', `addebito non riuscito: ${(e as Error).message}`);
    }
  }

  private charge(r: CallRecord): void {
    // A model of Google's off the price list costs what the gate counts it for, the dearest, never nothing (V-024); the local ones are free.
    const usd = costOf(billedModel(r.model), tokensOf(r), r.day) ?? 0;
    if (usd <= 0) return;
    const total = costWithFee(usd, this.fee);
    // Who asked stays who asked (rule 8i); who is charged is the match's policy (T372, ADR-0188): where the master pays, them alone.
    const payer = this.billedTo(r.who || COMUNE);
    if (payer !== COMUNE) {
      this.deductCredits(payer, total);
      // What the master paid for someone else, for their wallet and for the others' (the cost alone, as the usage counts it).
      if (payer !== (r.who || COMUNE)) this.usage.paidByMaster(r);
    } else {
      const connected = this.connectedWanderers ? this.connectedWanderers() : this.wanderers().map((w) => w.id);
      const eligible = connected.filter((id) => !this.isAnonymous(id));
      if (eligible.length > 0) {
        const shares = splitCost(total, eligible.length);
        eligible.forEach((id, i) => {
          this.deductCredits(id, shares[i]);
        });
      }
    }
  }

  /** The wanderer whose body an entity is, if any. */
  wandererOf(entity: Id): string | undefined {
    for (const w of this.wanderersById.values()) if (w.entity === entity) return w.id;
    return undefined;
  }

  /** Another wanderer than the one acting (T43a), if the entity is one: in a kernel that holds them, or in a mirror (`remote`). */
  otherWanderer(entity: Id): string | undefined {
    if (entity === this.wandererEntity) return undefined;
    const remote = this.ecs.get(entity, 'remote')?.id;
    return typeof remote === 'string' ? remote : this.wandererOf(entity);
  }

  /** What another wanderer says of themselves (T44a): their profile here, or what the server told a mirror. */
  introOf(entity: Id): string | undefined {
    const remote = this.ecs.get(entity, 'remote');
    if (typeof remote?.introduction === 'string') return remote.introduction || undefined;
    const id = this.otherWanderer(entity);
    return id ? this.profileOf(id)?.introduction : undefined;
  }

  /** The gods' needs stay full, whatever the world's code did to them this tick. */
  private keepGods(): void {
    if (!this.manyPlayers()) return;
    for (const w of this.wanderersById.values()) {
      if (!this.godMode(w.id)) continue;
      const n: any = this.ecs.get(w.entity, 'needs');
      if (n) Object.assign(n, { hunger: 100, thirst: 100, energy: 100, health: 100, dead: false });
    }
  }

  /** A death the world's code announces: true when only gods were dying (they are put back, nobody dies). */
  spareGods(): boolean {
    if (!this.manyPlayers()) return false;
    let mortal = false;
    for (const w of this.wanderersById.values()) {
      const n: any = this.ecs.get(w.entity, 'needs');
      if (n?.dead && !this.godMode(w.id)) mortal = true;
    }
    this.keepGods();
    return !mortal;
  }

  /** Whether a wanderer of a session is dying right now (waiting for the Narrator's verdict on their death). */
  isDying(id: string = this.wanderer().id): boolean {
    return this.dying.has(id);
  }

  /** A death the world's code announces: gods are put back; any mortal whose health ran out dies as themselves (T43c). */
  private mortalDies(cause: string): void {
    if (!this.manyPlayers()) return this.die(cause);
    this.keepGods();
    for (const w of this.wanderersById.values()) {
      const n: any = this.ecs.get(w.entity, 'needs');
      if (!n?.dead || this.godMode(w.id) || this.deathVerdicts.has(w.id)) continue;
      const why = n.thirst <= 0 ? 'sete' : n.hunger <= 0 ? 'fame' : cause;
      this.as(w.id, () => this.die(why));
    }
  }

  /**
   * The game is chosen before the Genesis and never changes after (ADR-0053): the first universe.json
   * fixes it, a later one that says otherwise is written back; only `runGenesis` chooses a new one.
   */
  private keepGame(config: UniverseConfig, files: FileMap): void {
    if (!this.game) {
      this.game = config.game;
      return;
    }
    if (JSON.stringify(config.game) === JSON.stringify(this.game)) return;
    config.game = this.game;
    let raw: Record<string, unknown>;
    try {
      raw = internalFields('config', JSON.parse(files['universe.json'] ?? '{}'));
    } catch {
      return;
    }
    if (this.repo.working['universe.json'] !== undefined) this.repo.write('universe.json', JSON.stringify({ ...raw, game: this.game }, null, 2) + '\n');
    this.council?.say('kernel', 'scarta', "la partita (morte, modalità, PvP, «Altro…» tra giocatori) si sceglie solo alla Genesi, chi paga le sue spese solo nella lobby: universe.json la tiene com'era");
  }

  /** `universe.json → ai` as it was when the match started (T247, ADR-0133); undefined when no match is under way. */
  private settingsHeld?: string;

  /** Whether a match is under way: every knob is fixed until it ends, for the master too. */
  get settingsLocked(): boolean {
    return this.settingsHeld !== undefined;
  }

  /** Entering: the settings are fixed from here (a wanderer enters a world of many, or the one who plays alone closes the lobby). */
  lockSettings(): void {
    if (this.settingsLocked) return;
    // Whoever enters first closes the choice of the cards (T295, ADR-0170): from now on the world is played, not prepared.
    this.closeCardChoice('si entra nel mondo');
    let raw: Record<string, unknown> = {};
    try {
      raw = JSON.parse(this.repo.working['universe.json'] ?? '{}');
    } catch {
      /* a broken universe.json has nothing to hold: the default config, as without a file */
    }
    this.settingsHeld = JSON.stringify(raw.ai ?? {});
  }

  /** Nobody is in the world any more: the master may set the knobs again as they enter. Alone it never comes back here: the page reloads. */
  unlockSettings(): void {
    this.settingsHeld = undefined;
  }

  /** A universe.json with the settings of the match, if one is under way: what a branch of the master brings stays the game's. */
  withHeldSettings(text: string): string {
    if (this.settingsHeld === undefined) return text;
    try {
      return JSON.stringify({ ...JSON.parse(text), ai: JSON.parse(this.settingsHeld) }, null, 2) + '\n';
    } catch {
      return text;
    }
  }

  /**
   * Like the game, during a match the settings do not change (T247): a universe.json that says otherwise (the editor, a rollback, a
   * publication) is written back, whoever wrote it. The budgets the wanderers' ceilings add stay in memory, as always.
   */
  private keepSettings(config: UniverseConfig, files: FileMap): void {
    if (this.settingsHeld === undefined) return;
    let said: string | undefined;
    try {
      said = JSON.stringify(JSON.parse(files['universe.json'] ?? '{}').ai ?? {});
    } catch {
      said = undefined;
    }
    if (said === this.settingsHeld) return;
    config.ai = readConfig({ 'universe.json': JSON.stringify({ ai: JSON.parse(this.settingsHeld) }) }).config.ai;
    const working = this.repo.working['universe.json'];
    if (working !== undefined) this.repo.write('universe.json', this.withHeldSettings(working));
    this.council?.say('kernel', 'scarta', 'le regolazioni si fissano entrando in partita: universe.json le tiene com\'erano');
  }

  /**
   * What the master set before entering, from the lobby (T247): repaired, written and committed, unless a match is under way. Whoever
   * asks has already been checked: the server for a world of many (`SessionServer.join`), alone there is nobody else.
   */
  applySettings(raw: unknown): { ok: boolean; motivo?: string; riparati?: string[] } {
    if (this.settingsLocked) return { ok: false, motivo: 'la partita è in corso: le regolazioni restano quelle con cui è cominciata' };
    const { settings, riparati } = repairAiSettings(raw);
    const expenses = this.expensesIn(raw, riparati);
    if (!this.setAi(settings)) return { ok: false, motivo: 'le regolazioni non si possono scrivere' };
    if (expenses !== undefined) this.setExpenses(expenses);
    if (!this.mirror && this.repo.working['universe.json'] !== this.repo.head().files['universe.json']) this.repo.commit('il master regola il mondo, prima di entrare', 'kernel');
    return { ok: true, ...(riparati.length ? { riparati } : {}) };
  }

  /**
   * The detail of generation and the agents' models (T45b): the Genesis screen and the lobby write them in universe.json → ai, before
   * the match. During one nobody changes them, not even the master (T247): it answers false. They hold from the next call.
   */
  setAi(patch: AiSettings): boolean {
    if (this.settingsLocked) return false;
    let raw: Record<string, any>;
    try {
      raw = JSON.parse(this.repo.working['universe.json'] ?? '{}');
    } catch {
      raw = {};
    }
    const ai = { ...(raw.ai ?? {}), ...patch, ...(patch.coefficients !== undefined ? { coefficients: repairCoefficients(patch.coefficients) } : {}), ...(patch.actor !== undefined ? { actor: repairActor(patch.actor) } : {}) };
    const text = JSON.stringify({ ...raw, ai }, null, 2) + '\n';
    this.writeCommanded('universe.json', text);
    const before = this.config.ai.maxText;
    // Through readConfig: what is repaired on reading, and the master's minimums, hold from now as from the next boot.
    this.config = { ...this.config, ai: readConfig({ 'universe.json': text }).config.ai };
    if (this.ai.textModel !== undefined && this.config.ai.textModel) this.ai.textModel = this.config.ai.textModel;
    // The budget in use follows, with what the wanderers' ceilings already added.
    if (this.ai.limits) this.ai.limits.text = Math.max(0, this.ai.limits.text + this.config.ai.maxText - before);
    return true;
  }

  /**
   * The expenses of the match the lobby brought (`settings.game.expenses`, T372), or undefined when it says nothing of them. Alone there is
   * nobody to pay for: a word about them is dropped, and said.
   */
  private expensesIn(raw: unknown, riparati: string[]): GameExpenses | undefined {
    const game = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as { game?: unknown }).game : undefined;
    const said = game && typeof game === 'object' && !Array.isArray(game) ? (game as { expenses?: unknown }).expenses : undefined;
    if (said === undefined) return undefined;
    if (!this.manyPlayers()) {
      riparati.push('spese della partita: da soli non c’è nessuno per cui pagare');
      return undefined;
    }
    if (said === 'master' || said === 'shared') return said;
    riparati.push('spese della partita: valore sconosciuto, restano quelle di prima');
    return undefined;
  }

  /**
   * Who pays for the match (T372, ADR-0188): the one change the game takes after the Genesis, and only from the lobby, before entering
   * (`applySettings`, refused while a match is under way). `shared` is written as nothing, as in every universe before the choice.
   */
  private setExpenses(expenses: GameExpenses): void {
    const game = repairGameSetup({ ...this.gameSetup(), expenses });
    if (expenses === 'shared') delete game.expenses;
    if (JSON.stringify(game) === JSON.stringify(this.gameSetup())) return;
    let raw: Record<string, unknown>;
    try {
      raw = internalFields('config', JSON.parse(this.repo.working['universe.json'] ?? '{}'));
    } catch {
      raw = {};
    }
    const text = JSON.stringify({ ...raw, game }, null, 2) + '\n';
    this.game = game;
    this.config = { ...this.config, game };
    this.writeCommanded('universe.json', text);
    // Whoever enters next reads it in their welcome (`GAME_FIELDS`).
    this.files = { ...this.files, 'universe.json': text };
    this.council?.say('kernel', 'info', expenses === 'master' ? 'il master paga ogni spesa della partita: chi entra non usa i suoi crediti' : 'ognuno paga le sue richieste, le spese comuni si dividono fra i collegati');
  }

  /** Chooses the game of a universe that was never generated (the Genesis screen); after, it is fixed. */
  private chooseGame(choice: Partial<GameSetup>): void {
    const game = repairGameSetup({ ...this.gameSetup(), ...choice });
    let raw: Record<string, unknown>;
    try {
      raw = internalFields('config', JSON.parse(this.repo.working['universe.json'] ?? '{}'));
    } catch {
      raw = {};
    }
    this.game = game;
    this.writeCommanded('universe.json', JSON.stringify({ ...raw, game }, null, 2) + '\n');
  }

  /**
   * Death: of thirst, of hunger, of wounds. Alone, the session ends and the wanderer may continue in the
   * same universe or start again from the seed; in a session of many (T43c), `continueAfterDeath` runs on
   * the server as the player who died, without closing the others' session. What continuing costs is the
   * punishment chosen at the Genesis, which the Narrator turns into what is lost and where one wakes up.
   * Who reached the corona cannot die any more.
   */
  die(cause: string): void {
    const id = this.wanderer().id;
    if (this.mirror || (this.dead && !this.remote.has(id)) || this.deathVerdicts.has(id) || (id === SOLO && this.exitedOnce)) return;
    this.log('kernel', `il viandante è morto (${cause})`);
    this.council.say('narrator', 'info', `il viandante è morto di ${cause}`, undefined, 'player.death');
    this.deathVerdicts.set(id, this.judgeDeath(cause));
    if (this.remote.has(id)) {
      const p = this.continueAfterDeath(id, cause).finally(() => this.dying.delete(id));
      this.dying.set(id, p);
      return;
    }
    this.dead = true;
    this.bus.emit('ui:death', { cause, punizione: deathLevel(this.gameSetup()) });
  }

  /** What is carried, by item (the top level: what death can take). */
  private carriedCounts(): Array<{ name: string; count: number }> {
    const by = new Map<string, number>();
    for (const s of this.inventory().slots) if (s) by.set(s.item, (by.get(s.item) ?? 0) + s.count);
    return [...by].map(([id, count]) => ({ name: this.itemInfo(id).name, count }));
  }

  private async judgeDeath(cause: string): Promise<DeathVerdict> {
    const level = this.gameSetup().death;
    const carried = this.carriedCounts();
    try {
      return await judgeDeath(this.council, { cause, level, punishment: deathRule(level), carried, states: Object.keys(this.states()), place: this.chunkHere()?.name ?? '' });
    } catch (e) {
      this.council.say('kernel', 'errore', `il Narratore tace sulla morte (${(e as Error).message}): vale la punizione alla lettera`, 'narrator', 'player.death');
      return fallbackDeath(level, carried);
    }
  }

  /**
   * A new life in the same universe: fresh needs, then what the punishment takes (everything, or the
   * effects the Narrator chose), at the square or where the wanderer fell; the world remembers.
   */
  async continueAfterDeath(id: string = this.wanderer().id, cause?: string): Promise<void> {
    if (cause === undefined && this.dying.has(id)) return this.dying.get(id)!;
    const carried = this.as(id, () => this.carriedCounts());
    const verdict = this.deathVerdicts.get(id);
    const v = (await verdict) ?? fallbackDeath(this.gameSetup().death, carried);
    this.deathVerdicts.delete(id);
    if (!this.wanderersById.has(id)) return;
    this.as(id, () => {
      const wandererModule = [...this.modules.values()].find((m) => m.manifest.kind === 'player');
      const defaults: Record<string, any> = clone(wandererModule?.manifest.components ?? FALLBACK_PLAYER);
      Object.assign(this.needs() ?? {}, { ...FALLBACK_PLAYER.needs, ...(defaults.needs ?? {}), dead: false });
      if (v.loseAll) {
        this.ecs.set(this.wandererEntity, 'inventory', newInventory());
        this.ecs.set(this.wandererEntity, 'states', {});
        Object.assign(this.phrase(), { tokens: [], sel: 0 });
        for (const it of wandererModule?.manifest.inventory ?? []) if (this.content.get(it)) this.give(it, 1);
      }
      if (v.restart === 'square') {
        Object.assign(this.wandererPos(), { x: 0, y: 0 });
        const c = this.carpet();
        if (c) Object.assign(c, { ox: 0, oy: 0 });
      }
      const ectx = { palette: this.palette, item: (n: string) => this.content.byName(n)?.id ?? (this.content.get(n) ? n : undefined), module: () => undefined, loot: new Set<string>() };
      const effects = v.loseAll ? [] : validateEffects(v.effects, ectx).effects;
      const said = effects.flatMap((e) => (e.type === 'message' ? [e.text] : []));
      const out = this.applyEffects(effects.filter((e) => e.type !== 'message'));
      this.syncPhrase();
      // Death takes, it never heals; but nobody wakes up dying.
      const n = this.needs();
      if (n && !(n.health > 10)) n.health = 10;
      if (!this.remote.has(id)) this.dead = false;
      this.council.say('narrator', 'approva', `il viandante torna alla vita: ${v.story}${effects.length ? ` [${effects.map((e) => e.type).join(', ')}]` : ''}${v.loseAll ? ' (perde tutto)' : ''}`, undefined, 'player.death');
      this.rememberDeath();
      this.saveState();
      const words = [v.story || 'Riapri gli occhi. È un nuovo giorno, e una nuova vita.', ...said, ...out].join(' ');
      this.message(words, 'good');
      if (!this.remote.has(id)) return;
      // What death took (T44c): the dead player's screen says it, with where they wake up.
      const now = new Map(this.carriedCounts().map((c) => [c.name, c.count]));
      const perso = carried.flatMap((c) => {
        const lost = c.count - (now.get(c.name) ?? 0);
        return lost > 0 ? [`${c.name}${lost > 1 ? ` ×${lost}` : ''}`] : [];
      });
      this.bus.emit('wanderer:died', { id, causa: cause ?? 'ferite', testo: words, perso, dove: v.restart });
    });
  }

  private rememberDeath(): void {
    this.recordRule({ key: `morte|${this.worldStamp()}`, text: 'un viandante è morto', possible: true, story: 'la gente ne parla ancora, in piazza' }, false);
  }

  // --- Interfaces of modules (ADR-0028) -------------------------------------------------------

  /** Panels modules bring into the game (drawn by the kernel as tabs of the inventory). */
  /**
   * What the panels show of the wanderer acting (T263, ADR-0139): the value of every `campo` a manifest's `ui` names, and nothing
   * else. It travels in `MyState` (rule 8f): a field of a component that no panel names never leaves the server.
   */
  panelFields(): Record<string, string | number | boolean> {
    const out: Record<string, string | number | boolean> = {};
    for (const { panel } of this.uiPanels()) {
      for (const e of panel.elements) {
        if (!e.field || !PANEL_FIELD_RE.test(e.field) || e.field in out) continue;
        const v = this.uiValue(e.field);
        if (typeof v === 'string') out[e.field] = v.slice(0, 200);
        else if (typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v))) out[e.field] = v;
      }
    }
    return out;
  }

  /** The fields a server sent (T263): on a mirror they become the components the panels read. The kernel's own are never touched. */
  takePanelFields(fields: unknown): void {
    if (!fields || typeof fields !== 'object') return;
    const named = new Set(this.uiPanels().flatMap(({ panel }) => panel.elements.map((e) => e.field).filter((c): c is string => !!c)));
    for (const [campo, v] of Object.entries(fields as Record<string, unknown>)) {
      if (!named.has(campo) || !PANEL_FIELD_RE.test(campo) || !['string', 'number', 'boolean'].includes(typeof v)) continue;
      const [c, f] = campo.split('.');
      if (KERNEL_COMPONENTS.has(c)) continue;
      const comp = this.ecs.get(this.wandererEntity, c);
      if (comp && typeof comp === 'object') comp[f] = v;
      else this.ecs.set(this.wandererEntity, c, { [f]: v });
    }
  }

  uiPanels(): Array<{ module: string; panel: UiPanel }> {
    return [...this.modules.values()].filter((m) => m.manifest.ui?.elements?.length).map((m) => ({ module: m.manifest.id, panel: m.manifest.ui! }));
  }

  /** What sits in the slots of every panel: player component `slots` (kernel-owned). */
  slots(): Record<string, Record<string, { item: string; count: number } | null>> {
    let s = this.ecs.get(this.wandererEntity, 'slots');
    if (!s) s = this.ecs.set(this.wandererEntity, 'slots', {});
    return s;
  }

  /** Whether an item fits a slot: by its place (slot), category or tags. */
  fits(item: string, accetta: string[] | undefined): boolean {
    const d = this.content.get(item);
    if (!d) return false;
    if (!accetta?.length) return true;
    return accetta.some((a) => a === d.slot || isCategory(d, a) || d.tags.includes(a));
  }

  /** Puts something from the inventory into a slot of a panel; the module reacts (on_slot). */
  equip(panelId: string, slotId: string, invSlot: number): boolean {
    const p = this.uiPanels().find((x) => x.panel.id === panelId);
    const el = p?.panel.elements.find((e) => e.type === 'slot' && e.id === slotId);
    const s = this.inventory().slots[invSlot];
    if (!p || !el || !s) return false;
    // A thing of the world is carried, not worn (T292).
    if (isThing(s.item) || !this.fits(s.item, el.accepts)) {
      this.message(`${this.itemInfo(s.item).name} non va lì (${el.label}).`, 'warn');
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
    const { value, failed } = this.runModule(module, 'on_slot', this.wandererEntity, slot, item, panel);
    if (!failed && typeof value === 'string' && value) this.message(value);
  }

  /** A button of a panel: the module's on_ui(user, action). */
  uiAction(panelId: string, action: string): void {
    const p = this.uiPanels().find((x) => x.panel.id === panelId);
    if (!p || !this.sandbox.has(p.module, 'on_ui')) return;
    const { value, failed } = this.runModule(p.module, 'on_ui', this.wandererEntity, action);
    if (!failed && typeof value === 'string' && value) this.message(value);
  }

  /** A field of a player component for bars and texts ("needs.health"). */
  uiValue(campo: string | undefined): unknown {
    if (!campo) return undefined;
    const [c, f] = campo.split('.');
    return this.ecs.get(this.wandererEntity, c)?.[f];
  }

  /**
   * The Forge of mechanics: the Council adds a mechanic (equipment, a quiver, a reputation…) as a
   * system module with a panel and Lua logic; validated (panel cleaned, code compiled, dry-loaded).
   */
  async forgeMechanic(request: string, chi?: string): Promise<{ ok: boolean; id?: string; summary: string }> {
    const asker = chi ?? this.payerNow();
    const items = [...this.content.items.values()].filter((d) => d.equippable || d.slot || ['weapon', 'clothing'].includes(d.category)).map((d) => `${d.name}${d.slot ? ` [${d.slot}]` : ` (${d.category})`}${d.bonus ? ` ${JSON.stringify(d.bonus)}` : ''}`);
    const mechanics = this.uiPanels().map((p) => p.panel.title);
    let feedback = '';
    for (let attempt = 0; attempt < 2; attempt++) {
      let d;
      try {
        d = await designMechanic(this.council, request, { items, mechanics, feedback, chi });
      } catch (e) {
        this.noteShortfall({ request: request, who: asker, agent: 'engineer', task: 'mechanic.design', outcome: 'error', reason: (e as Error).message });
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
        this.council.say('kernel', 'scarta', `meccanica «${d.name}»: ${feedback}`, 'engineer', 'mechanic.design');
        continue;
      }
      // Its cases run with the real code in a kernel in miniature (T27): only those that show it working stay.
      const { cases, errors: caseErrors } = cleanCases(d.cases, panel, logic.split('\n').length);
      const failed = [...caseErrors];
      const kept: BenchCase[] = [];
      for (const c of cases) {
        const run = await this.runBenchCase(manifest, logic, c);
        if (run.errori.length) failed.push(`«${c.title}»: ${run.errori.join('; ')}`);
        else kept.push(c);
      }
      if (!cases.length) failed.push('nessun caso d’uso da mettere in scena');
      if (failed.length) this.council.say('kernel', 'scarta', `casi di «${d.name}»: ${failed.join('; ')}`, 'engineer', 'mechanic.design');
      if (!kept.length && attempt === 0) {
        feedback = `i casi d'uso non mostrano la meccanica: ${failed.join('; ')}`;
        continue;
      }
      if (kept.length) manifest.cases = kept;
      const dir = `modules/${id}/`;
      this.repo.write(`${dir}manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
      this.repo.write(`${dir}logic.lua`, logic);
      // Starting components for the wanderer (e.g. a reputation at 0).
      for (const [name, data] of Object.entries(d.components ?? {})) if (data && typeof data === 'object' && !this.ecs.has(this.wandererEntity, name) && !['player', 'hand', 'inventory', 'needs', 'pos', 'slots'].includes(name)) this.ecs.set(this.wandererEntity, name, clone(data));
      this.applyFiles({ ...this.repo.working });
      const c = this.commitContent(`meccanica: ${d.name}`, 'mechanic.design', 'engineer', chi);
      this.council.say('engineer', 'approva', `nuova meccanica «${d.name}»: ${d.description} (pannello «${panel!.title}», commit ${c.id})`, undefined, 'mechanic.design');
      return { ok: true, id, summary: `Nuova meccanica: ${d.name} — ${d.description} (la trovi nell'inventario, scheda «${panel!.title}»).` };
    }
    this.noteShortfall({ request: request, who: asker, agent: 'engineer', task: 'mechanic.design', outcome: 'invalid', reason: feedback });
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
      (m.manifest.cases ?? []).map((c, i, all) => ({
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

  /** What the case sets out: its 5 × 5 tiles in the colours of the palette, its entities with their colour and size. */
  benchScene(c: BenchCase): BenchScene {
    const base = this.benchBase();
    const tiles = Array.from({ length: BENCH * BENCH }, (_, i) => {
      const code = [...(c.terrain?.[Math.floor(i / BENCH)] ?? '')][i % BENCH];
      const t = this.palette[code && this.palette[code] ? code : base];
      return { color: t?.color ?? '#555555', ...(t?.layer ? { layer: t.layer } : {}), solid: !!t?.solid };
    });
    const entities = (c.entities ?? []).map((t) => {
      const m = this.modules.get(t.module)?.manifest;
      const fire = !!t.components?.fuoco;
      return { name: fire ? 'Fiamma' : (m?.name ?? t.module), color: fire ? '#ff8a2a' : (m?.appearance?.color ?? '#cccccc'), radius: m?.physics?.radius ?? 0.4, individual: !!(m?.components?.wander || m?.persona || m?.interaction?.type === 'talk'), fire };
    });
    return { tiles, entities };
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
    this.message(`${now.entry.name}: «${now.entry.case.title}» (${now.index + 1}/${now.count})`);
    this.bus.emit('studio:bench', now);
  }

  /** The bench seen up close: the system, the case in words, before and after, the code with its lines, the station. */
  openBench(): void {
    const now = this.benchOf();
    if (!now) return this.message('Il banco è vuoto: nessun sistema ha casi.');
    this.bus.emit('ui:bench', { bench: now, station: this.chain().stations.find((s) => s.id === now.entry.system) });
  }

  /**
   * The Library's lectern (T47a): the current page of the world's bible and touching graph nodes.
   */
  bibleOf(): BibleShown | undefined {
    const bible = readBible(this.files);
    if (!bible) return undefined;
    const pages = biblePages(bible);
    if (!pages.length) return undefined;
    this.bibleIndex = Math.max(0, Math.min(pages.length - 1, this.bibleIndex));
    const page = pages[this.bibleIndex];
    const g = this.graph();
    const nodes = touchingNodes(page, g, bible);
    return { page, index: this.bibleIndex, count: pages.length, nodes };
  }

  /**
   * «<» «>» of the lectern: flip pages of the bible.
   * Stops at the ends ("i bordi fermano", no wrap).
   */
  stepBible(d: number): void {
    const bible = readBible(this.files);
    if (!bible) return this.message('La bibbia è vuota.');
    const pages = biblePages(bible);
    if (!pages.length) return this.message('La bibbia è vuota.');
    const prev = this.bibleIndex;
    const next = Math.max(0, Math.min(pages.length - 1, prev + d));
    if (next === prev) {
      this.message(d < 0 ? 'Sei alla prima pagina.' : "Sei all'ultima pagina.");
      return;
    }
    this.bibleIndex = next;
    const now = this.bibleOf()!;
    this.message(`Pagina ${now.index + 1} di ${now.count} (${now.page.sezione}): «${now.page.titolo}»`);
    this.bus.emit('studio:bible', now);
  }

  /** The lectern seen up close: opens the Bible panel with touching graph nodes. */
  openBible(): void {
    const now = this.bibleOf();
    if (!now) return this.message('La bibbia è vuota.');
    this.bus.emit('ui:bible', now);
  }

  /**
   * The Library's rules wall (T47b): the current window of rules, and total count.
   */
  rulesWall(): { offset: number; count: number; visible: Rule[] } {
    const all = this.rules();
    const count = all.length;
    const max = TABLETS_MAX;
    const offset = Math.max(0, Math.min(Math.max(0, count - max), this.rulesOffset));
    const visible = count <= max ? all : all.slice(offset, offset + max);
    return { offset, count, visible };
  }

  /**
   * «<» «>» of the rules wall: step backward (d < 0) or forward (d > 0) in the history of rules.
   * Stops at the ends ("i bordi fermano").
   */
  stepRules(d: number): void {
    const rules = this.rules();
    if (!rules.length) return this.message('Non ci sono regole stabilite.');
    const max = TABLETS_MAX;
    if (rules.length <= max) return this.message('Tutte le regole stabilite sono già visibili a parete.');
    const maxOffset = rules.length - max;
    const prev = this.rulesOffset;
    const next = Math.max(0, Math.min(maxOffset, prev + d));
    if (next === prev) {
      this.message(d < 0 ? 'Sei alle regole più antiche.' : 'Sei alle regole più recenti.');
      return;
    }
    this.rulesOffset = next;
    this.corona.setRulesOffset(this.rulesOffset);
    this.message(`Regole a parete: dalla ${this.rulesOffset + 1} alla ${this.rulesOffset + max} di ${rules.length}`);
    this.bus.emit('studio:rules_wall', { offset: this.rulesOffset, total: rules.length });
  }

  /** The rule seen up close or picked by key/index: its judgement and card data (T47b). */
  ruleOf(chiaveOrIndex: string | number): RuleShown | undefined {
    const rules = this.rules();
    if (!rules.length) return undefined;
    let idx = -1;
    if (typeof chiaveOrIndex === 'number') {
      idx = chiaveOrIndex;
    } else {
      idx = rules.findIndex((r) => r.key === chiaveOrIndex);
    }
    if (idx < 0 || idx >= rules.length) return undefined;
    const rule = rules[idx];
    const marked = idx >= rules.length - FOCUSED_RULES;
    return { rule, index: idx, count: rules.length, marked };
  }

  /** Opens the panel of a rule's judgement (T47b). */
  openRule(chiaveOrIndex: string | number): void {
    const now = this.ruleOf(chiaveOrIndex);
    if (!now) return this.message('Regola non trovata.');
    this.bus.emit('ui:rule', now);
  }

  /**
   * The Sculptor's lathe in the Artist's gallery (T48a): all models in the library.
   */
  latheModels(): LatheModelEntry[] {
    return latheModels(this.files, this.forms);
  }

  /**
   * The model currently on the Sculptor's lathe (T48a): executed step by step with snapshots and 4 views.
   */
  latheOf(): LatheShown | undefined {
    const list = this.latheModels();
    if (!list.length) return undefined;
    this.latheIndex = (((this.latheIndex % list.length) + list.length) % list.length);
    const entry = list[this.latheIndex];
    const key = `${entry.id}@${entry.xml.length}@${entry.info.score ?? ''}`;
    const hit = this.latheCache.get(key);
    if (hit) {
      return { ...hit, index: this.latheIndex, count: list.length };
    }
    const shown = latheExecute(entry, this.forms, 20, 1, this.latheIndex, list.length);
    if (this.latheCache.size > 50) this.latheCache.clear();
    this.latheCache.set(key, shown);
    return shown;
  }

  /**
   * «<» «>» of the Sculptor's lathe: step to the previous or next model in the library.
   */
  stepTornio(d: number): void {
    const list = this.latheModels();
    if (!list.length) return this.message('Nessun modello nella libreria.');
    this.latheIndex = (((this.latheIndex + d) % list.length) + list.length) % list.length;
    const now = this.latheOf()!;
    this.message(`Il tornio dello Scultore: «${now.entry.name}» (${now.index + 1}/${now.count})`);
    this.bus.emit('studio:tornio', now);
  }

  /**
   * The Sculptor's lathe seen up close: opens the lathe panel (T48a).
   */
  openTornio(): void {
    const now = this.latheOf();
    if (!now) return this.message('Nessun modello nella libreria.');
    this.bus.emit('ui:tornio', now);
  }

  /**
   * Called on every visit to the corona (T48b): picks a library model (seed from arrival tick),
   * reduced to fit on the plinto in front of the Artist's gallery, without generating or adding new collision.
   */
  visitCorona(tick = this.tickCount): void {
    const pool = this.latheModels()
      .map((e) => e.id)
      .filter((id) => !id.startsWith('corona-'));
    const candidates = pool.length > 0 ? pool : this.latheModels().map((e) => e.id);
    if (!candidates.length) return;
    const rng = new Rng(tick);
    let model = rng.pick(candidates);
    if (candidates.length > 1 && model === this.plinthSculpture?.model) {
      const others = candidates.filter((m) => m !== this.plinthSculpture?.model);
      model = rng.pick(others);
    }
    const seed = (tick % 10000) + 1;
    this.forms.get(model, seed);
    this.updatePlinto(model, seed, tick);
  }

  updatePlinto(model?: string, seed?: number, tick?: number): void {
    if (!model) {
      if (!this.plinthSculpture) return;
      model = this.plinthSculpture.model;
      seed = this.plinthSculpture.seed;
      tick = this.plinthSculpture.arrivalTick;
    }
    const b = this.corona.building('galleria');
    const s = b?.structure;
    if (!s?.plinto) {
      this.plinthSculpture = {
        model,
        seed: seed ?? 1,
        x: 0,
        y: 0,
        z: 0,
        yaw: 0,
        scale: 1,
        arrivalTick: tick ?? this.tickCount,
      };
      return;
    }
    let scale = 1.0;
    const f = this.forms.ready(model, seed ?? 1);
    if (f?.result?.grid) {
      const g = f.result.grid;
      const sizeX = g.X / f.vpt;
      const sizeY = g.Y / f.vpt;
      const sizeZ = g.Z / f.vpt;
      const maxHoriz = Math.min(s.plinto.width, s.plinto.depth) * 0.85;
      const maxHeight = 2.4;
      scale = Math.min(maxHoriz / Math.max(sizeX, sizeY, 0.01), maxHeight / Math.max(sizeZ, 0.01), 1.0);
    }
    this.plinthSculpture = {
      model,
      seed: seed ?? 1,
      x: s.plinto.x,
      y: s.plinto.y,
      z: s.plinto.z,
      yaw: s.yaw,
      scale,
      arrivalTick: tick ?? this.tickCount,
    };
  }

  plinto(): PlinthSculpture | undefined {
    return this.plinthSculpture;
  }

  /** States of the wanderer (on horseback, with a backpack…): what they change, until when. */
  states(): Record<string, { speed: number; weight: number; light: number; expires: number }> {
    // Lua removes a state by setting it to nil (null on the JS side): those are gone.
    const st = this.ecs.get(this.wandererEntity, 'states') ?? {};
    for (const k of Object.keys(st)) if (!st[k]) delete st[k];
    return st;
  }

  /** How much the wanderer carries without slowing down (a backpack, a horse carry more). */
  carryCapacity(): number {
    return CARRY_CAPACITY + Object.values(this.states()).reduce((n, s) => n + (Number(s.weight) || 0), 0);
  }

  /** States run out; a state with light lights the wanderer's way. */
  private statesTick(): void {
    const st = this.states();
    let light = 0;
    for (const [k, s] of Object.entries(st)) {
      if (s.expires && s.expires < this.time) delete st[k];
      else light = Math.max(light, Number(s.light) || 0);
    }
    const l = this.ecs.get(this.wandererEntity, 'light');
    if (light > 0) this.ecs.set(this.wandererEntity, 'light', { ...(l ?? {}), lit: true, radius: light, fromState: true });
    else if (l?.fromState) this.ecs.set(this.wandererEntity, 'light', { lit: false });
  }

  /** Magic runes in the phrase, in their order: the incantation T would cast. */
  incantation(): string[] {
    return this.phrase().tokens.filter((t) => this.content.runes[t]);
  }

  /** Incantations of this many runes or more also burn a magic crystal. */
  static CRYSTAL_RUNES = 3;

  private crystalId(): string | undefined {
    return [...this.content.items.values()].find((d) => d.tags.includes('cristallo') && d.category === 'magic')?.id;
  }

  private castingNow = false;

  /**
   * T: the magic runes in hand, in order, are an incantation. Known ones are cast at once; a sequence
   * never spoken before is named once by the Narrator (and kept, committed, in magic.spells). Costs energy.
   */
  async castSpell(): Promise<boolean> {
    if (this.castingNow) return false;
    if (this.manyPlayers() && this.phrase().tokens.includes(COUNCIL_RUNE)) return this.councilRune();
    const seq = this.incantation();
    if (!seq.length) {
      this.message(this.phrase().tokens.length ? 'Nessuna delle rune che hai in mano è magica.' : 'Non hai rune in mano.', 'warn');
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
      const hand = this.phrase();
      hand.tokens = hand.tokens.filter((t) => !this.content.runes[t]);
      hand.sel = Math.max(0, Math.min(hand.sel, hand.tokens.length - 1));
      const pc = this.wandererCarpet();
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
      draft = await nameSpell(this.council, runes, known, Object.entries(this.palette).filter(([c]) => c !== '?').map(([, t]) => t.name), this.focusOn(seq.map((t) => `rune:${nodeSlug(t)}`)));
    } catch (e) {
      this.council.say('narrator', 'errore', `incantesimo ${seq.join(' ')}: ${(e as Error).message}`, undefined, 'spell.name');
      return undefined;
    }
    const v = validateEffects(draft.effects, { palette: this.palette, item: (x) => this.content.byName(x)?.id, module: () => undefined, loot: new Set(Object.keys(this.content.loot)) });
    if (v.dropped.length) this.council.say('kernel', 'scarta', `incantesimo «${draft.name}»: ${v.dropped.join('; ')}`, 'narrator', 'spell.name');
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
    const c = this.commitContent(`incantesimo: ${seq.join(' ')} → ${spell.name}`, 'spell.name', 'narrator');
    this.council.say('narrator', 'propone', `${seq.join(' ')} → «${spell.name}»: ${spell.description} [${spell.effects.map((e) => e.type).join(', ')}] (commit ${c.id})`, undefined, 'spell.name');
    // The formula called for an element no rune has (T57b): the world gets one more rune to find.
    if (draft.newRune) void this.inventRune(`the formula ${seq.join(' ')} («${spell.name}») calls for an element no rune has: ${draft.newRune}`);
    return spell;
  }

  private inventingRune = false;

  /**
   * A new magic rune (T57b, ADR-0097): the Narrator invents it (in a session of the Council, or when a formula
   * calls for it), the validator lets it in or sends it back with the reasons (two attempts), and it enters
   * magic.runes (with a place in the loot of magic) and the canon. From then on it lies in the world as the
   * others do: rare, picked up, composed. The token of the new rune, or undefined.
   */
  async inventRune(reason: string, chi?: string): Promise<string | undefined> {
    if (this.inventingRune || this.mirror || Object.keys(this.content.runes).length >= MAX_MAGIC_RUNES) return undefined;
    this.inventingRune = true;
    try {
      const known = Object.entries(this.content.runes).map(([token, r]) => ({ token, name: r.name, glyph: r.glyph, element: italianName('elementi', r.element), description: r.description }));
      let errors: string[] = [];
      for (let attempt = 0; attempt < 2; attempt++) {
        let draft;
        try {
          draft = await inventRune(this.council, known, reason, errors, this.focusOn(known.map((r) => `rune:${nodeSlug(r.token)}`)));
        } catch (e) {
          this.council.say('narrator', 'errore', `runa nuova: ${(e as Error).message}`, undefined, 'rune.invent');
          this.noteShortfall({ request: `una runa nuova: ${reason}`, who: chi, agent: 'narrator', task: 'rune.invent', outcome: 'error', reason: (e as Error).message });
          return undefined;
        }
        const v = validateNewRune(draft, this.content.runes, wordsOf(this.files));
        if (!v.rune) {
          errors = v.errors;
          this.council.say('kernel', 'scarta', `runa nuova «${String(draft.token ?? '')}»: ${errors.join('; ')}`, 'narrator', 'rune.invent');
          continue;
        }
        const r = v.rune;
        const path = 'modules/magic.runes/manifest.json';
        let man: Manifest;
        try {
          man = JSON.parse(this.repo.working[path] ?? 'null') ?? { id: 'magic.runes', name: 'Rune magiche', kind: 'data', version: '0.1.0', runes: {} };
        } catch {
          return undefined;
        }
        man.runes = { ...(man.runes ?? {}), [r.token]: r.rune };
        // Found as the others are: in the loot of magic, as rare as each of them.
        const magia = man.loot?.magia;
        if (magia && !magia.entries.some((e) => e.item === `rune:${r.token}`)) magia.entries.push({ item: `rune:${r.token}`, weight: 1 });
        this.repo.write(path, JSON.stringify(man, null, 2) + '\n');
        const canon = this.repo.working['world/canon.md'];
        if (canon !== undefined) this.repo.write('world/canon.md', canonWithRune(canon, r));
        this.applyFiles({ ...this.repo.working });
        const c = this.commitContent(`runa nuova: ${r.token} (${r.rune.name})`, 'rune.invent', 'narrator', chi);
        this.council.say('narrator', 'propone', `runa nuova ${r.rune.glyph} ${r.rune.name} («${r.token}», ${italianName('elementi', r.rune.element)}): ${r.rune.description} (commit ${c.id})`, undefined, 'rune.invent');
        return r.token;
      }
      this.noteShortfall({ request: `una runa nuova: ${reason}`, who: chi, agent: 'narrator', task: 'rune.invent', outcome: 'invalid', reason: errors.join('; ') });
      return undefined;
    } finally {
      this.inventingRune = false;
    }
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
    if (!this.modules.has('core.effects')) {
      for (const e of effects) if (!KERNEL_EFFECTS.has(e.type)) this.unhandledEffect(e.type);
      return out;
    }
    // Nobody touches a god but the god (T42a): on their body only words arrive.
    const god = target !== undefined && this.wandererOf(target);
    if (god && god !== this.wanderer().id && this.godMode(god)) effects = effects.filter((e) => e.type === 'message');
    for (const e of effects) {
      // The social effects are the kernel's, applied where an action is judged: here they do nothing, as before.
      if (e.type === 'bond' || e.type === 'memory' || e.type === 'birth') continue;
      if (e.type !== 'relief' && !this.effectHandled(e.type)) {
        this.unhandledEffect(e.type);
        continue;
      }
      if (e.type === 'relief') {
        const p = target !== undefined ? this.ecs.get(target, 'pos') : undefined;
        const cx = Math.floor(p?.x ?? at?.x ?? this.wandererCarpet().x);
        const cy = Math.floor(p?.y ?? at?.y ?? this.wandererCarpet().y);
        const r = e.radius ?? 1;
        const delta = e.delta ?? 0;
        if (delta) {
          for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
              if (dx * dx + dy * dy <= r * r + r) {
                this.dig(cx + dx, cy + dy, delta);
              }
            }
          }
        }
        continue;
      }
      if (target !== undefined && !this.ecs.alive.has(target)) target = undefined;
      const { value, failed } = this.runModule('core.effects', 'apply', target, this.wandererEntity, clone(e), at?.x, at?.y);
      if (failed) break;
      if (typeof value === 'string' && value) out.push(value);
    }
    this.runesDirty = true;
    return out;
  }

  /**
   * Whether core.effects applies an effect (T260): its `handles` says so; one written before it had `handles` knew only the Italian names
   * of the contract 0.1, and applies none of today (T307a): the effect is a fault, and the seed brings the core.effects that knows it.
   */
  private effectHandled(tipo: string): boolean {
    if (this.sandbox.has('core.effects', 'handles')) {
      const { value, failed } = this.runModule('core.effects', 'handles', tipo);
      return !failed && value === true;
    }
    return CORE_EFFECTS_WITHOUT_HANDLES.has(tipo);
  }

  /** An effect that nobody applies is a fault, not a silence (T260): who reads the faults sees which one. */
  private unhandledEffect(tipo: string): void {
    this.faults.raise(`effect:${tipo}`, `l'effetto «${tipo}» non ha chi lo applica: né il kernel né core.effects lo conoscono`);
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
      luogo: this.chunkHere()?.name,
      ora: Math.floor(this.time),
      momento: this.daylight() > 0.6 ? 'giorno' : this.daylight() > 0.15 ? 'crepuscolo' : 'notte',
      // Locals know their surroundings: which places and regions are where.
      dintorni: this.directionsAt(this.wandererCarpet().x, this.wandererCarpet().y),
      viandanteImpugna: held ? this.itemInfo(held).name : 'niente',
      viandante: n ? { fame: Math.round(100 - n.hunger), sete: Math.round(100 - n.thirst), stanchezza: Math.round(100 - n.energy) } : undefined,
    };
  }

  /** Where the wanderer last stood in the world (carpet space), for views opened from the studio. */
  private lastWorld = { x: 0, y: 0 };

  /** The day of the world (0 = the first). */
  day(): number {
    return Math.floor((this.time / Kernel.DAY_SECONDS) + 0.12);
  }

  // --- The people of the world (T327, ADR-0166) ----------------------------------------------------------------
  // Their behaviour is all in `npc/`, behind one facade: who they are, their day and trade, the ventures, the places nobody sees,
  // the walk, the talks, the plots. The kernel gives it the port below, the beat (`npc.tick`) and the moments of the places, and
  // answers for it what was the kernel's API before (the lines after the port, one call each).

  /** The people of the world (`npc/index.ts`). */
  readonly npc: Npc = new Npc(this.npcHost());

  /** What the people ask of the world (`npc/host.ts`): the kernel's state and acts, by name, read when asked. */
  private npcHost(): NpcHost {
    const k = this;
    return {
      get config() {
        return k.config;
      },
      files: () => k.files,
      working: () => k.repo.working,
      write: (path, text) => k.repo.write(path, text),
      keepFile: (path) => {
        k.files = { ...k.files, [path]: k.repo.working[path]! };
      },
      applyWorking: () => k.applyFiles({ ...k.repo.working }),
      commit: (message) => {
        k.repo.commit(message, 'agent');
      },
      commitContent: (message, task, agent, chi) => k.commitContent(message, task, agent, chi),
      get ecs() {
        return k.ecs;
      },
      get time() {
        return k.time;
      },
      get ticks() {
        return k.tickCount;
      },
      get mirror() {
        return k.mirror;
      },
      get generationHeld() {
        return k.generationHeld;
      },
      get offline() {
        return k.ai.name === 'offline';
      },
      day: () => k.day(),
      phase: () => dayPhase(k.time, Kernel.DAY_SECONDS),
      get modules() {
        return k.modules;
      },
      get palette() {
        return k.palette;
      },
      get content() {
        return k.content;
      },
      get consumed() {
        return k.consumed;
      },
      get stores() {
        return k.stores;
      },
      get forms() {
        return k.forms;
      },
      commonHouse: () => k.terrain?.manifest.commonHouse,
      log: (source, message) => k.log(source, message),
      worldStamp: () => k.worldStamp(),
      hasHook: (module, fn) => k.sandbox.has(module, fn),
      runModule: (module, fn, ...args) => k.runModule(module, fn, ...args),
      spawnModuleEntity: (m, x, y, chunkKey, origin) => k.spawnModuleEntity(m, x, y, chunkKey, origin),
      itemInfo: (id) => k.itemInfo(id),
      itemSpec: (id) => k.itemSpec(id),
      wornZone: (item) => k.wornZone(item),
      introduceItems: (names, context, chi) => k.introduceItems(names, context, chi),
      noteMentions: (names, context) => k.noteMentions(names, context),
      get chunks() {
        return k.chunks;
      },
      chunkAt: (x, y) => k.chunkAt(x, y),
      chunkHere: () => k.chunkHere(),
      tileAt: (col, row) => k.tileAt(col, row),
      setTile: (col, row, code) => k.setTile(col, row, code),
      pathCode: () => k.pathCode(),
      free: (x, y, r, z) => k.free(x, y, r, z),
      floorAt: (x, y, z) => k.floorAt(x, y, z),
      formOn: (col, row) => k.solidForms.has(`${col},${row}`),
      nearest: (x, y, r, tag) => k.nearest(x, y, r, tag),
      interiorPoints: (structure) => k.interiorPoints(structure),
      // A place of the people is always one of the kernel's chunks: the port hands out no other.
      saveChunkSoon: (ch) => k.saveChunkSoon(ch as Chunk),
      spawnLot: (ch, origin, stage) => k.spawnLot(ch as Chunk, origin, stage),
      spawnPlannedHouse: (ch, house) => k.spawnPlannedHouse(ch as Chunk, house),
      wanderer: () => k.wanderer(),
      wandererById: (id) => k.wanderersById.get(id),
      as: (id, fn) => k.as(id, fn),
      wandererOf: (entity) => k.wandererOf(entity),
      wandererAt: (id) => k.wandererAt(id),
      wandererCarpet: () => k.wandererCarpet(),
      wanderersInWorld: () => k.wanderersInWorld(),
      profileOf: (id) => k.profileOf(id),
      inventory: () => k.inventory(),
      carriedByName: (name) => k.carriedByName(name),
      give: (item, n) => k.give(item, n),
      message: (text, tone) => k.message(text, tone),
      speak: (id, text) => k.speak(id, text),
      recordRule: (rule, commit) => k.recordRule(rule, commit),
      directionsAt: (x, y) => k.directionsAt(x, y),
      worldFacts: () => k.worldFacts(),
      get council() {
        return k.council;
      },
      interpreter: () => k.interpreter(),
      actorOn: () => k.actor().on,
      coefficients: () => k.coefficients(),
      focusOn: (refs, at) => k.focusOn(refs, at),
      noteShortfall: (note) => k.noteShortfall(note),
      resolve: (names) => k.graph().resolve(names),
      useCards: (ids, kind) => k.cards.use(ids, kind, (id) => k.isCard(id)),
    };
  }

  /** The individual behind a character (`npc.individuate`), written once. */
  ensureIdentity(id: Id): Promise<Identity | undefined> {
    return this.npc.ensureIdentity(id);
  }

  /** A person or an animal, from the archetype's class. */
  speciesOf(type: string): Species | undefined {
    return this.npc.speciesOf(type);
  }

  /** The society and the plots kept coherent (at boot, with no model calls): what was repaired. */
  reviewSociety(): string[] {
    return this.npc.reviewSociety();
  }

  reviewPlots(): string[] {
    return this.npc.reviewPlots();
  }

  /** The registry entry of an individual, by name. */
  individualOf(name: string): Individual | undefined {
    return this.npc.individualOf(name);
  }

  /** What someone becomes to the wanderer acting now, and what they are to them. */
  setBond(name: string, bond: string): void {
    this.npc.setBond(name, bond);
  }

  bondOf(name: string): string | undefined {
    return this.npc.bondOf(name);
  }

  /** The valid programs of the trades of this universe. */
  jobPrograms(): JobProgram[] {
    return this.npc.jobPrograms();
  }

  /** The ventures as they are now (a copy). */
  ventures(): Venture[] {
    return this.npc.ventures();
  }

  /** An individual uses a thing (`world.act`). */
  actAs(user: Id, target: Id, action?: string): string | undefined {
    return this.npc.actAs(user, target, action);
  }

  /** What the deposit of a place holds. */
  placeDeposit(chunkKey: string): Record<string, number> {
    return this.npc.placeDeposit(chunkKey);
  }

  /** The nearest tile of a terrain (`world.find_tile`). */
  findTile(word: string, x: number, y: number, r: number): { x: number; y: number } | undefined {
    return this.npc.findTile(word, x, y, r);
  }

  /** Talks to an NPC (`npc.reply`): `wanderer` is who talks. */
  talk(id: Id, text: string, wanderer?: string): Promise<NpcReply> {
    return this.npc.talk(id, text, wanderer);
  }

  /** The Narrator weaves a horizontal plot among existing people and places. */
  weaveStory(force = false): Promise<Plot | undefined> {
    return this.npc.weaveStory(force);
  }

  /** Quests the wanderer acting now is on (for the HUD). */
  quests(): Array<{ titolo: string; da: string; testo: string; obiettivo: string }> {
    return this.npc.quests();
  }

  /** The structure of a lot of a loaded place laid again at a stage (T245e): a venture rebuilds it. */
  private spawnLot(ch: Chunk, origin: string, stage: number): void {
    if (!ch.plan) return;
    const { lots } = this.lotsOf(ch, ch.plan, this.pathCode());
    const l = lots.find((x) => x.origin === origin);
    if (l) this.ecs.spawn({ pos: { x: l.x, y: l.y }, glyph: { ch: '⌂', color: this.terrain?.manifest.roof?.color ?? '#9a4632' }, body: { r: 0.5, solid: true }, form: l.form, structure: { ...l.structure, ...(stage < 1 ? { stage } : {}) }, chunk: { key: ch.key }, origin: { key: l.origin } });
  }

  /** A house of the plan built on free ground (T245d, T245e): a structure like those of the lots, with its model, seed, turn and stage. */
  private spawnPlannedHouse(ch: Chunk, h: PlannedHouse | undefined): void {
    if (!h || typeof h.origin !== 'string' || ![h.x, h.y].every(Number.isFinite) || this.ecs.query('structure', 'origin').some((e) => this.ecs.get(e, 'origin').key === h.origin)) return;
    const classe = typeof h.class === 'string' ? h.class : 'building';
    const model = this.forms.resolve(typeof h.model === 'string' ? h.model : undefined, classe);
    const form: FormComp = { model, seed: Number.isFinite(h.seed) ? h.seed : this.forms.seedFor(model, h.origin), yaw: Number.isFinite(h.yaw) ? h.yaw : 0, ...(h.model && h.model !== model ? { wanted: h.model, classe } : {}) };
    const done = this.savedForms.get(h.origin);
    if (done?.length) form.done = [...done];
    const stadio = Number.isFinite(h.stage) ? Math.max(0, Math.min(1, h.stage)) : 1;
    this.ecs.spawn({ pos: { x: h.x, y: h.y }, glyph: { ch: '⌂', color: this.terrain?.manifest.roof?.color ?? '#9a4632' }, body: { r: 0.5, solid: true }, form, structure: { concept: String(h.concept ?? 'una casetta').slice(0, 80), class: classe, ...(h.model ? { model: h.model } : {}), ...(stadio < 1 ? { stage: stadio } : {}) }, chunk: { key: ch.key }, origin: { key: h.origin } });
  }

  /**
   * The situation table of the Direction (T46a): the wanderer, the places being generated, the open plots at their beat,
   * the quests, the faults, each on its chunk and region; from what there is already, generating nothing.
   */
  situation(): Situation {
    const S = this.config.chunkSize;
    const people = readPeople(this.files).people;
    const chunkOf = (x: number, y: number) => ({ cx: Math.floor(x / S), cy: Math.floor(y / S) });
    const locate = (name: string) => {
      const id = this.npc.entityOf(name);
      const pos = id === undefined ? undefined : this.ecs.get(id, 'pos');
      if (pos) return chunkOf(pos.x, pos.y);
      const p = people.find((x) => x.name === name);
      const m = /^(-?\d+),(-?\d+)#/.exec(p?.origin ?? '');
      if (m) return { cx: Number(m[1]), cy: Number(m[2]) };
      const ch = p?.place ? [...this.chunks.values()].find((c) => c.place?.name === p.place) : undefined;
      return ch ? { cx: ch.cx, cy: ch.cy } : undefined;
    };
    // Seen from the studio, the wanderer is where they last stood in the world.
    const pc = this.corona.isInterior(this.wandererPos().x) || this.zone !== 'sim' ? this.lastWorld : this.wandererCarpet();
    return buildSituation({
      atlas: readAtlas(this.files),
      plots: readPlots(this.files),
      faults: this.faults.list(),
      wanderer: chunkOf(pc.x, pc.y),
      players: this.players(),
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
      { nome: 'testo', usati: this.ai.usage.text, max: ai.maxText },
      { nome: 'Fucina', usati: this.forgesUsed, max: ai.maxForges },
      { nome: 'pacchetti', usati: this.packsUsed, max: ai.maxPacks ?? 4 },
      { nome: 'tipi nuovi', usati: this.castUsed, max: ai.maxCast ?? 3 },
      { nome: 'modelli', usati: this.sculpting.count, max: ai.maxModels ?? 40 },
      { nome: 'brani', usati: this.composing.count, max: ai.maxPieces ?? 8 },
    ];
    return {
      time: timeline(log, Math.max(0, i), (c) => (c.parent ? this.repo.find(c.parent) : undefined)),
      feed: liveFeed(this.feed(), this.usage.lastCall, now, this.ai.name === 'offline' ? 'offline' : ai.textModel),
      costs: costBoard(this.usage, budgets),
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
    const t = this.screens().time;
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
  async introduceItems(names: string[], context: string, chi?: string): Promise<ItemDef[]> {
    const fresh = [...new Set(names.map((n) => n.trim()).filter((n) => n.length >= 2 && !this.content.byName(n)))].slice(0, 6);
    if (!fresh.length) return names.map((n) => this.content.byName(n)).filter((d): d is ItemDef => !!d);
    let raw;
    try {
      raw = await defineItems(this.council, fresh, context);
    } catch (e) {
      this.council.say('narrator', 'errore', (e as Error).message);
      this.noteShortfall({ request: `definire ${fresh.join(', ')}: ${context}`, who: chi, agent: 'narrator', task: 'content.define', outcome: 'error', reason: (e as Error).message });
      return [];
    }
    const taken = new Set(this.content.items.keys());
    const defs = raw.map((r) => toItemDef(r, taken)).filter((d): d is ItemDef => !!d);
    if (!defs.length) {
      this.noteShortfall({ request: `definire ${fresh.join(', ')}: ${context}`, who: chi, agent: 'narrator', task: 'content.define', outcome: 'invalid', reason: 'nessuna definizione valida' });
      return [];
    }
    this.writePack('modules/items.citati/manifest.json', { id: 'items.citati', name: 'Oggetti di cui si è parlato', description: 'Oggetti entrati nel mondo perché qualcuno ne ha parlato.' }, { items: defs, recipes: [], loot: {} });
    this.applyFiles({ ...this.repo.working });
    this.commitContent(`contenuti: ${defs.map((d) => d.name).join(', ')}`, 'items.citati', 'narrator');
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
  async growContent(reason: string, count = 16, force = false, chi?: string): Promise<boolean> {
    if (this.growing || (!force && (this.packsUsed >= (this.config.ai.maxPacks ?? 4) || this.ai.name === 'offline'))) return false;
    this.growing = true;
    this.packsUsed++;
    try {
      const tags = [...new Set([...this.content.items.values()].flatMap((d) => d.tags))].slice(0, 30);
      const raw = await itemPack(this.council, { count, existing: [...this.content.items.values()].map((d) => d.name), hints: [...this.wanted].map((id) => this.itemInfo(id).name), tags });
      const known = new Map([...this.content.items.values()].map((d) => [normName(d.name), d.id]));
      const pack = assemblePack(raw, known, new Set(this.content.items.keys()));
      const errors = this.validator.validateItems(pack.items);
      if (errors.length || !pack.items.length) {
        this.council.say('kernel', 'scarta', `pacchetto: ${errors.join('; ') || 'vuoto'}`, 'narrator');
        this.noteShortfall({ request: `un pacchetto di oggetti: ${reason}`, who: chi, agent: 'narrator', task: 'content.items', outcome: 'invalid', reason: errors.join('; ') || 'vuoto' });
        return false;
      }
      let n = 1;
      while (this.repo.working[`modules/items.pacco-${n}/manifest.json`]) n++;
      this.writePack(`modules/items.pacco-${n}/manifest.json`, { id: `items.pacco-${n}`, name: `Pacchetto ${n}`, description: `Oggetti scritti dal Concilio (${reason}).` }, pack);
      this.applyFiles({ ...this.repo.working });
      const c = this.commitContent(`contenuti: pacchetto ${n} (${pack.items.length} oggetti, ${pack.recipes.length} ricette)`, 'content.items', 'narrator');
      this.council.say('kernel', 'approva', `pacchetto ${n}: ${pack.items.length} oggetti, ${pack.recipes.length} ricette, ${Object.keys(pack.loot).length} tabelle → commit ${c.id}`);
      return true;
    } catch (e) {
      this.council.say('narrator', 'errore', `pacchetto: ${(e as Error).message}`);
      this.noteShortfall({ request: `un pacchetto di oggetti: ${reason}`, who: chi, agent: 'narrator', task: 'content.items', outcome: 'error', reason: (e as Error).message });
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
    const p = at ?? this.wandererCarpet();
    const ch = this.chunkAt(p.x, p.y);
    return [...refs.filter((r): r is string => !!r), ...(ch ? [`chunk:${nodeSlug(`${ch.cx}_${ch.cy}`)}`] : [])];
  }

  chunkHere(): ChunkInfo | undefined {
    const pc = this.wandererCarpet();
    return this.chunkAt(pc.x, pc.y)?.place;
  }

  /** Tooltip contents for a real-space point. */
  hoverAt(rx: number, ry: number): HoverInfo | null {
    const p = this.wandererPos();
    if (Math.hypot(rx - p.x, ry - p.y) < 0.5) return { kind: 'player' };
    const R = this.config.circleRadius;
    if (this.coronaRevealed() && (this.corona.isInterior(rx) || Math.hypot(rx, ry) >= R)) {
      const a = this.archive.nearest(rx, ry, 0.7);
      if (a) return { kind: 'agent', agent: a.agent, name: a.name, doing: a.say ?? (a.path ? `lavora su ${a.path}` : undefined) };
      const tile = this.corona.at(Math.floor(rx), Math.floor(ry));
      if (tile?.kind === 'item' && tile.item && tile.item.kind !== 'desk') {
        const recent = tile.item.path ? this.recentChanges().get(tile.item.path) : undefined;
        return { kind: 'studio', item: tile.item, building: this.corona.building(tile.building)?.name ?? '', recent: recent ? `${recent.author}: ${recent.message}` : undefined };
      }
      if (tile?.kind === 'door' || tile?.kind === 'building') {
        const b = this.corona.building(tile.building);
        return b ? { kind: 'door', building: b.name, teams: b.teams.map((t) => AGENTS[t as AgentId]?.name ?? t) } : null;
      }
      return null;
    }
    const { ox, oy } = this.offset();
    const cx = rx + ox;
    const cy = ry + oy;
    const id = this.runeTiles.get(`${Math.floor(cx)},${Math.floor(cy)}`);
    if (id !== undefined && this.ecs.alive.has(id)) {
      const rune: RuneComp = this.ecs.get(id, 'rune');
      const symbol = /^[A-Za-z_]\w*$/.test(rune.token) && !['true', 'false', 'nil', 'not', 'and', 'or'].includes(rune.token) ? this.sandbox.eval(rune.token) : null;
      const mr = this.content.runes[rune.token];
      const doc = mr ? `${mr.glyph} ${mr.name} — runa magica (${italianName('elementi', mr.element)}): ${mr.description}. Tienila in mano e premi T.` : SYMBOL_DOCS[rune.token];
      return { kind: 'rune', token: rune.token, doc, symbol, line: this.lineOfRune(id), source: rune.source };
    }
    for (const eid of this.ecs.query('pos', 'glyph')) {
      if (eid === this.wandererEntity) continue;
      const ep = this.ecs.get(eid, 'pos');
      if (Math.hypot(ep.x - cx, ep.y - cy) >= 0.6) continue;
      // Another wanderer (T44c): their name and the first line of what they say of themselves.
      if (this.otherWanderer(eid) !== undefined) return { kind: 'entity', name: this.nameOf(eid), description: this.introOf(eid)?.split('\n')[0] ?? '' };
      const pk = this.ecs.get(eid, 'pickup');
      if (pk) {
        const info = this.itemInfo(pk.item);
        return { kind: 'entity', name: info.name, description: info.description, extra: `E per raccogliere${pk.count > 1 ? ` (×${pk.count})` : ''}` };
      }
      const m = this.modules.get(this.ecs.get(eid, 'module')?.id)?.manifest;
      const mind: Mind | undefined = this.ecs.get(eid, 'mind');
      const identity: Identity | undefined = this.ecs.get(eid, 'identity');
      const doing = this.npc.routineNow(identity)?.does;
      const extra = mind ? `${doing ? `${doing} · ` : ''}umore: ${mind.mood}` : this.ecs.has(eid, 'container') ? 'E per aprire' : m?.actions?.length ? `E: ${m.actions.map((a) => a.label).join(', ')}` : undefined;
      const fam = identity?.family?.length ? ` ${identity.family.map((f) => `${f.bond[0].toUpperCase()}${f.bond.slice(1)} di ${f.name}`).join(', ')}.` : '';
      return { kind: 'entity', name: identity?.name ?? m?.name ?? '???', description: identity ? `${identity.job ? identity.job[0].toUpperCase() + identity.job.slice(1) : m?.name}.${fam} ${identity.look}` : (m?.description ?? ''), extra };
    }
    const t = this.tileAt(Math.floor(cx), Math.floor(cy));
    return t ? { kind: 'tile', name: `${this.palette[t]?.name ?? t}${this.palette[t]?.solid ? ' (invalicabile)' : ''}` } : null;
  }

  // --- The Forge and Genesis ---------------------------------------------------------------------

  /** Forges a module through the Council, then validates, commits and hot loads it; the Sculptor gives it a model. */
  /** `takeable` (T292): whether the thing can be taken and put down elsewhere, when who asks for it decided (the Cartographer). */
  async forgeModule(prompt: string, origin: ForgeOrigin, kind?: ForgeKind, permissive = false, chi?: string, takeable?: boolean): Promise<{ ok: boolean; id?: string; summary: string }> {
    // The Genesis is the world's; what the wanderer who transcended asks is theirs, and they wrote it (T36).
    if (origin === 'genesi') chi = COMUNE;
    const autore = permissive ? this.wanderer().id : 'narrator';
    const asker = chi ?? (permissive ? this.payerNow() : COMUNE);
    const ids = [...this.modules.keys()];
    try {
      const r = await forge(
        this.council,
        { prompt, origin, kind, chi, existingIds: ids, paletteCodes: Object.keys(this.palette).filter((c) => c !== '?' && !this.palette[c].solid), permissive, existingNames: [...this.modules.values()].filter((m) => m.manifest.kind === 'entity' || m.manifest.kind === 'item').map((m) => m.manifest.name), ...(takeable !== undefined ? { takeable } : {}) },
        (m, logic) => this.validator.validateForged(m, logic, new Set(ids)),
      );
      // What a character carries: existing items by name, new ones defined by the Narrator.
      if (r.concept.carries?.length) {
        const known = r.concept.carries.map((n) => this.content.byName(n)).filter((d): d is ItemDef => !!d);
        const fresh = r.concept.carries.filter((n) => !this.content.byName(n));
        const defs = [...known, ...(fresh.length ? await this.introduceItems(fresh, `portati da ${r.concept.name}`) : [])];
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
      this.noteShortfall({ request: prompt, who: asker, agent: (e as { agent?: string }).agent ?? 'kernel', task: 'forge.concept', outcome: e instanceof ForgeRejected ? 'invalid' : 'error', reason: msg });
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
    this.council.say('kernel', 'obietta', `${m[1]}.${m[2]} fallisce durante il gioco: ${message}`, 'engineer', 'forge.fix');
    const unrepaired = (motivo: string) => this.noteShortfall({ request: `riparare ${m[1]}.${m[2]}: ${message}`, agent: 'engineer', task: 'forge.fix', outcome: 'fault', reason: motivo });
    // The knob of the repairs (T247): a local repair would empty the module, so without a call it stays as it is, isolated by its fault.
    if (!this.rationing.allows('repairs', this.coefficients().repairs)) {
      unrepaired('le riparazioni sono regolate dal master');
      return false;
    }
    let feedback = '';
    for (let round = 0; round < 2; round++) {
      try {
        const logic = await repairLogic(this.council, entry.manifest, this.repo.working[entry.logicPath] ?? '', message, feedback);
        const errors = [...this.validator.checkLua(entry.logicPath, logic), ...apiErrors(logic)];
        if (errors.length) {
          feedback = errors.join('; ');
          this.council.say('kernel', 'scarta', feedback, 'engineer');
          continue;
        }
        this.repo.write(entry.logicPath, logic.endsWith('\n') ? logic : logic + '\n');
        this.applyFiles({ ...this.repo.working });
        this.faults.clearPrefix(`module:${m[1]}:`);
        const c = this.repo.commit(`riparazione: ${m[1]}`, 'agent');
        this.council.say('engineer', 'corregge', `${m[1]} riparato → commit ${c.id}`);
        return true;
      } catch (e) {
        this.council.say('engineer', 'errore', (e as Error).message);
        unrepaired((e as Error).message);
        return false;
      }
    }
    unrepaired(feedback);
    return false;
  }

  /** The Narrator's memory: every new being or thing becomes part of the world bible. */
  private recordInBible(m: Manifest): void {
    const bible = readBible(this.repo.working);
    if (!bible) return;
    const line = `${m.name} — ${m.description ?? ''}`.slice(0, 200);
    if (m.persona) bible.characters = [...(bible.characters ?? []), line].slice(-30);
    else bible.facts = [...(bible.facts ?? []), line].slice(-40);
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
    if (this.rules().some((r) => r.key === marker)) return [];
    const generated = [...this.modules.values()].filter((m) => m.manifest.origin && m.manifest.origin !== 'esempio' && (m.manifest.kind === 'entity' || m.manifest.kind === 'item'));
    const oldBible = readBible(this.repo.working);
    const plots = readPlots(this.repo.working);
    const words = wordsOf(this.repo.working);
    const brokenPlots = plots.filter((p) => metaBreak(plotText(p), words));
    // Nothing created yet (a universe just born from the seed): nothing to review.
    if (!generated.length && !brokenPlots.length && !(oldBible && bibleBreaks(oldBible, words).length)) return [];
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
    if (generated.length && this.ai.name !== 'offline') {
      try {
        const r = await this.council.ask<{ withdraw?: string[]; reason?: string }>(
          'arbiter',
          'review.fourthwall',
          `Review these modules created by the Council. Retire those that break the fourth wall (references to code, simulation, unstable or fake reality, worlds that repeat, abstract roles like keepers of reality, censors, archivists of the world, measurers of anomalies; also dressed up as legends: whoever always comes back to the square, whoever watches every wanderer, borders nobody crosses), those that duplicate the runes (other glowing symbols in the ground) and the doubles. Keep everything that is a real person or thing of the world.\n${generated.map((m) => `- ${m.manifest.id} «${m.manifest.name}»: ${(m.manifest.description ?? '').slice(0, 140)} ${(m.manifest.persona ?? '').slice(0, 160)}`).join('\n')}`,
          { type: 'OBJECT', properties: { withdraw: { type: 'ARRAY', items: { type: 'STRING' } }, reason: { type: 'STRING' } }, required: ['withdraw'] },
          { data: { ids: generated.map((m) => m.manifest.id) }, temperature: 0.2 },
        );
        for (const id of r.withdraw ?? []) if (this.modules.get(id)?.manifest.origin && this.modules.get(id)?.manifest.origin !== 'esempio') retire.add(id);
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
      const bible = cleanBible(oldBible, words);
      bible.characters = bible.characters.filter((l) => !gone.has(normName(l.split(' — ')[0])));
      bible.facts = bible.facts.filter((l) => !gone.has(normName(l.split(' — ')[0])));
      this.repo.write('world/bible.json', JSON.stringify(bible, null, 2) + '\n');
    }
    // Plots that hint at the game, or give the runes a life of their own, are dropped.
    if (brokenPlots.length) {
      this.repo.write(PLOTS_FILE, writePlots(plots.filter((p) => !brokenPlots.includes(p))));
      names.push(...brokenPlots.map((p) => `trama «${p.title}»`));
    }
    this.recordRule({ key: marker, text: 'revisione della quarta parete', possible: true, story: names.length ? `ritirati: ${names.join(', ')}` : 'niente da ritirare' }, false);
    this.applyFiles({ ...this.repo.working });
    this.repo.commit(names.length ? `l'Arbitro ritira ${names.length} moduli fuori dal mondo: ${[...new Set(names)].join(', ')}` : 'revisione della quarta parete', 'agent');
    if (names.length) this.council.say('arbiter', 'approva', `quarta parete: ritirati ${names.length} moduli (${[...new Set(names)].join(', ')})`, undefined, 'review.fourthwall');
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
    const share = (d: string, test: (t: TerrainDef | undefined) => boolean) => [...d].filter((c) => test(this.palette[c])).length / d.length;
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
  async runGenesis(theme: string, onProgress?: (step: string) => void, game?: Partial<GameSetup>): Promise<boolean> {
    this.generationHeld = true;
    const backup = { ...this.repo.working };
    const keptGame = this.game;
    try {
      // The game is chosen once, for a universe that was never generated (ADR-0053).
      // The cards came before (T295): the Genesis closes the choice (a commit of its own, before the game is chosen), and its agents know what came.
      this.closeCardChoice('comincia la Genesi');
      if (game && this.needsGenesis()) this.chooseGame(game);
      onProgress?.('Il Concilio si riunisce');
      const plan = await planGenesis(this.council, theme, this.repo.working, (id, def, palette) => this.validator.validateLayout(id, def, palette, this.sampleDrafts()), this.broughtForGenesis());
      for (const [p, src] of Object.entries(plan.files)) this.repo.write(p, src);
      this.stampContent('genesis.layouts', 'cartographer', COMUNE);
      // Example content shipped on disk makes room for the generated world.
      for (const m of this.modules.values()) {
        if (m.manifest.origin !== 'esempio') continue;
        for (const p of Object.keys(this.repo.working)) if (p.startsWith(m.dir)) this.repo.write(p, null);
      }
      this.applyFiles({ ...this.repo.working });
      this.consumed.clear();
      this.savedContainers.clear();
      for (const m of this.rari.values()) m.clear();
      // What lay on the furniture of the world of before goes with it (T291), and what was moved in it (T292).
      for (const id of this.ecs.query('placed')) this.ecs.destroy(id);
      for (const id of this.ecs.query('origin')) if (this.moved.has(this.ecs.get(id, 'origin').key)) this.ecs.destroy(id);
      this.moved.clear();
      this.repo.write('world/state.json', null);
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
          onProgress?.(`La Fucina crea: ${next.request}`);
          await this.forgeModule(next.request, 'genesi', next.type);
          done++;
        }
      };
      await Promise.all([worker(), worker()]);
      const path = 'modules/core.player/manifest.json';
      const man = JSON.parse(this.repo.working[path]);
      man.appearance = { glyph: '@', color: '#ffffff', look: plan.wandererPrompt };
      this.repo.write(path, JSON.stringify(man, null, 2) + '\n');
      this.applyFiles({ ...this.repo.working });
      this.clearChunks();
      const title = readBible(this.repo.working)?.title ?? 'nuovo universo';
      const c = this.commitContent(`genesi: ${title}`, 'genesis.cast', 'narrator', COMUNE);
      this.council.say('kernel', 'approva', `Genesi completata: «${title}», ${done} moduli, ${this.content.items.size} oggetti, ${Object.keys(this.content.layouts).length} ambienti, commit ${c.id}.`);
      this.bus.emit('genesis:done', { title });
      return true;
    } catch (e) {
      this.council.say('kernel', 'errore', `Genesi fallita: ${(e as Error).message}`);
      this.noteShortfall({ request: 'la Genesi', agent: (e as { agent?: string }).agent ?? 'kernel', task: 'genesis', outcome: 'error', reason: (e as Error).message });
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
  /** The lasting stores of the modules (T245a, ADR-0138): `world/stores/`, saved with the game. */
  readonly stores = new ModuleStores();
  /** The module whose Lua runs now: whose store `world.store_get/set` reach. */
  private luaModule: string | undefined;
  /** Files the player wrote that are not a valid state (T262, ADR-0137): in the working files, never in a commit. */
  private unsaved = new Set<string>();

  /**
   * The state of play is part of the universe too (`world/state.json`): what the wanderer carries,
   * what was taken from the world, what is left in chests. Saved only while the universe is valid.
   */
  saveState(): boolean {
    // A fault invalidates code, not the data of the game (T262, ADR-0137): what is broken is withheld from every commit
    // (`unsaved`), the rest is saved. Only a universe that is not this world's (its configuration, another kernel) saves nothing.
    if (this.generationHeld || this.mirror || this.foreignUniverse()) return false;
    const containers: Record<string, { inv: Inventory; filled: boolean }> = Object.fromEntries(this.savedContainers);
    for (const id of this.ecs.query('container', 'origin')) {
      const c: Container = this.ecs.get(id, 'container');
      if (c.filled) containers[this.ecs.get(id, 'origin').key] = { inv: c.inv, filled: true };
    }
    const placed = this.placedToSave();
    const moved = this.movedToSave();
    const state = {
      consumed: [...this.consumed].slice(-5000),
      containers,
      forms: this.formsToSave(),
      rares: Object.fromEntries([...this.rari].map(([t, m]) => [t, Object.fromEntries(m)])),
      time: Math.round(this.time),
      ...(placed.length ? { placed } : {}),
      ...(moved.length ? { moved } : {}),
    };
    // Each wanderer in their own file (T34); the world's state no longer carries one.
    const players = Object.fromEntries([...this.wanderersById.values()].map((w) => [playerFile(w.id), this.as(w.id, () => this.wandererState(w))]));
    // A request that ended badly commits nothing of its own: the save carries it (`beforeCommit`), even if nothing else moved.
    const json = JSON.stringify([state, players, this.shortfalls.version]);
    const stores = this.stores.takeChanged();
    // The ventures (T245d): the kernel's own file, written with the game when something moved.
    const ventures = this.npc.venturesToSave();
    if (ventures !== undefined && ventures !== this.repo.working[VENTURES_FILE]) stores[VENTURES_FILE] = ventures;
    if (json === this.lastState && !Object.keys(stores).length) return false;
    this.lastState = json;
    const written: FileMap = { ...stores };
    for (const [p, v] of Object.entries(stores)) this.repo.write(p, v);
    // What this kernel does not know of a file it saves stays in it (T245a): a kernel of tomorrow wrote it, a kernel of today keeps it.
    const kept = (p: string, v: object, known: ReadonlySet<string>) => ({ ...unknownFields(this.repo.working[p], known), ...v });
    for (const [p, v] of Object.entries({ 'world/state.json': kept('world/state.json', state, STATE_FIELDS), ...Object.fromEntries(Object.entries(players).map(([q, w]) => [q, kept(q, w, WANDERER_FIELDS)])) })) {
      this.repo.write(p, JSON.stringify(v, null, 1) + '\n');
      written[p] = this.repo.working[p]!;
    }
    this.files = { ...this.files, ...written };
    this.repo.commit('salvataggio della partita', 'player');
    return true;
  }

  /**
   * Why nothing reaches the universe's repository now (T312, ADR-0156), or undefined: the fault `universe:kernel` is open. Commits, plans,
   * branches, merges and rollbacks on the disk wait for it to close (`Repo.readOnly`, `SealedChunks`), and the Council calls only the local
   * models. A mirror is never read-only: its repository is in memory, and the one it mirrors decides.
   */
  readOnly(): string | undefined {
    if (this.mirror) return undefined;
    return this.faults.get('universe:kernel')?.message;
  }

  /** universe.json unreadable or of another kernel (T260): the world running is not the universe's, nothing of it is saved. */
  private foreignUniverse(): boolean {
    return this.faults.has('universe:config') || this.faults.has('universe:kernel');
  }

  /** What is saved of the wanderer acting now. */
  private wandererState(w: Wanderer): WandererState {
    const at = this.corona.isInterior(this.wandererPos().x) ? this.lastWorld : this.wandererCarpet();
    const entry = this.wanderersById.get(w.id);
    return {
      ...(w.name !== WANDERER_NAME ? { name: w.name } : {}),
      ...(entry?.profilo ? { profile: entry.profilo } : {}),
      pos: { x: Math.round(at.x * 1000) / 1000, y: Math.round(at.y * 1000) / 1000 },
      inventory: this.inventory(),
      needs: this.needs() as unknown as Record<string, number>,
      hand: this.phrase(),
      states: this.states(),
      slots: this.slots(),
      ...(w.id === SOLO ? { transcended: this.exitedOnce } : {}),
      ...(entry?.anonymous ? { anonymous: true } : {}),
    };
  }

  /** Gives the wanderer acting now what was saved of them. */
  private applyWandererState(v: WandererState): void {
    if (Number.isFinite(v.pos?.x) && Number.isFinite(v.pos?.y)) {
      const c = this.carpet();
      const p = this.wandererPos();
      if (c && p) Object.assign(c, { ox: v.pos!.x - p.x, oy: v.pos!.y - p.y });
    }
    if (v.inventory?.slots) {
      this.ecs.set(this.wandererEntity, 'inventory', v.inventory);
      this.keepCarried();
      // What was worn (T290) only where it still holds: a thing gone from the world, a slot written by hand.
      keepWornMarks(v.inventory, (item) => this.wornZone(item));
    }
    if (v.needs) Object.assign(this.needs() ?? {}, v.needs, { dead: false });
    if (v.hand?.tokens) Object.assign(this.phrase(), v.hand);
    if (v.states) this.ecs.set(this.wandererEntity, 'states', internalComponent('states', Object.fromEntries(Object.entries(v.states).filter(([, x]) => x && typeof x === 'object'))));
    if (v.slots && typeof v.slots === 'object') this.ecs.set(this.wandererEntity, 'slots', v.slots);
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
    if (c && c.files === this.files && c.places === this.graphChunksVersion) return c.graph;
    const graph = buildGraph(this.files, [...this.graphChunks.values()], (t) => this.npc.speciesOf(t));
    this.graphCache = { files: this.files, places: this.graphChunksVersion, graph };
    return graph;
  }

  /** Puts the graph in the working files when what it is made of changed (the commit carries it). */
  private writeGraph(): void {
    if (!this.repo) return;
    const files = this.repo.working;
    const chunks = [...this.graphChunks.values()];
    if (readGraph(files)?.graph.hash === graphHash(files, mergeChunks(files, chunks))) return;
    this.repo.write(GRAPH_FILE, buildGraph(files, chunks, (t) => this.npc.speciesOf(t)).toJson());
    this.files = { ...this.files, [GRAPH_FILE]: this.repo.working[GRAPH_FILE]! };
  }

  /** The places planned in earlier sessions that the graph does not have yet (from the universe's maps). */
  private async seedGraphChunks(): Promise<void> {
    const maps = (await this.repo.backend?.listMaps?.().catch(() => [])) ?? [];
    if (!maps.length) return;
    const prefix = this.recordKey({ cx: 0, cy: 0, key: '' } as Chunk).replace(/[:,]/g, '_');
    const known = new Set(chunksOf(readGraph(this.files)).map((p) => `${p.cx},${p.cy}`));
    for (const m of maps) {
      if (!m.file.startsWith(prefix)) continue;
      const [cx, cy] = m.file.slice(prefix.length).split('_').map(Number);
      const key = `${cx},${cy}`;
      if (!Number.isFinite(cx) || !Number.isFinite(cy) || known.has(key) || this.graphChunks.has(key)) continue;
      this.graphChunks.set(key, { cx, cy, nome: m.name, ambiente: m.layout ? internalName('ambienti', m.layout) : undefined });
      this.graphChunksVersion++;
    }
  }

  /** universe.json says the kernel that writes it (T260): a compatible universe takes this kernel's version at its next commit. */
  private stampKernel(): void {
    if (!this.repo || this.faults.has('universe:kernel')) return;
    const stamped = stampKernel(this.repo.working['universe.json']);
    if (stamped === undefined) return;
    this.repo.write('universe.json', stamped);
    this.files = { ...this.files, 'universe.json': stamped };
    this.config = { ...this.config, kernel: KERNEL_VERSION };
  }

  /** Puts the usage ledger in the working files when it changed (the next commit carries it). */
  private writeUsage(): void {
    if (this.usage.version === this.usageWritten || !this.repo) return;
    this.usageWritten = this.usage.version;
    this.repo.write(USAGE_FILE, this.usage.toJson());
    this.files = { ...this.files, [USAGE_FILE]: this.repo.working[USAGE_FILE]! };
  }

  /**
   * What the Council could not do goes in the working files when they do not say it already: by the text, because a rollback brings
   * the file back to what it was and the log, as the usage, stays as it is.
   */
  private writeShortfalls(): void {
    if (!this.repo || !this.shortfalls.list().length) return;
    const json = this.shortfalls.toJson();
    if (this.repo.working[SHORTFALLS_FILE] === json) return;
    this.repo.write(SHORTFALLS_FILE, json);
    this.files = { ...this.files, [SHORTFALLS_FILE]: json };
  }

  /**
   * One request of a wanderer or of the world that the Council could not satisfy (T238): nothing shows it, in the world or on a
   * client. `chi` is who asked: `as` never spans an await, so what comes after one passes it; without one, the world asked.
   */
  noteShortfall(n: Omit<ShortfallNote, 'who'> & { who?: string }): void {
    if (this.bench) return;
    const note = { ...n, who: n.who || COMUNE };
    if (this.mirror) this.onShortfall?.(note);
    else this.shortfalls.note(note);
  }

  /** The last thing the kernel threw out of an agent's task: an agent's own attempts end without saying why. */
  lastDiscard(agent: AgentId, task: string): string {
    return [...this.council.feed].reverse().find((e) => e.from === 'kernel' && e.kind === 'scarta' && e.to === agent && e.task === task)?.text ?? 'nessun tentativo valido';
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

  /** A write the kernel or the master commands, which may wait for its commit: the next commit of the Council is not what brought it. */
  private writeCommanded(path: string, content: string): void {
    this.commanded.set(path, content);
    this.repo.write(path, content);
  }

  /**
   * Before a commit of the Council (T130, ADR-0109): it changes only the world's content (`councilMayWrite`). What else the working
   * files have against the last commit goes back, whoever in the Council wrote it, unless the kernel or the master commanded it.
   * So `universe.json → ai`, budgets and providers, moves only on their command (`setAi`, the editor).
   */
  private fenceCouncil(): void {
    const { working } = this.repo;
    const head = this.repo.head().files;
    const refused = [...new Set([...Object.keys(working), ...Object.keys(head)])].filter((p) => working[p] !== head[p] && !councilMayWrite(p) && working[p] !== this.commanded.get(p));
    if (!refused.length) return;
    for (const p of refused) this.repo.write(p, head[p] ?? null);
    this.council?.say('kernel', 'scarta', `il Concilio non scrive qui: ${refused.slice(0, 4).join(', ')}${refused.length > 4 ? '…' : ''}`);
    this.applyFiles({ ...working });
  }

  /** A commit of generated content: what it brings becomes cards of whoever pays for the task. */
  private commitContent(message: string, task: string, autore: string, chi?: string): Commit {
    this.stampContent(task, autore, chi);
    return this.repo.commit(message, 'agent');
  }

  /** A place planned for the first time: its card, and one use of every card it holds (T36). */
  private cardChunk(ch: Chunk, plan: ChunkPlan, chi?: string): void {
    plan.card ??= this.sign(chunkCardId(ch.cx, ch.cy), 'chunk.plan', 'cartographer', chi);
    this.cards.addChunk(`${ch.cx}_${ch.cy}`, plan.place.name, plan.card);
    const ids = [`environment:${nodeSlug(plan.layout)}`];
    for (const o of plan.objects) ids.push(...this.entityCards(o.module));
    for (const n of plan.ground) {
      const d = this.content.byName(n);
      if (d) ids.push(...this.entityCards(d.id));
    }
    for (const s of plan.structures ?? []) ids.push(`model:${nodeSlug(this.structureModelFor(s.concept, s.size))}`);
    this.cards.use(ids, 'chunks', (id) => this.isCard(id));
  }

  /** The cards an entity in a place stands for: its module or item, and its model. */
  private entityCards(id: string): string[] {
    const m = this.modules.get(id)?.manifest;
    if (m) return [moduleCardId(m), ...(m.appearance?.model ? [`model:${nodeSlug(m.appearance.model)}`] : [])];
    const d = this.content.get(id);
    return d ? [`item:${nodeSlug(d.id)}`, ...(d.model ? [`model:${nodeSlug(d.model)}`] : [])] : [];
  }

  /**
   * Who wrote and who pays for a piece of content made now by a task, and whose card it is: the payer, or for
   * what the world pays one of the wanderers, drawn with the seed. `chi` overrides the task's payer. Where the master pays (T372,
   * ADR-0188, D54.1) the card is whoever pays, the master: payer and holder, and so the shares of the heritage; nothing of the campaign
   * lands in the players' collections before they meet it.
   */
  sign(cardId: string, task: string, autore: string, chi?: string): CardStamp {
    const pagante = this.billedTo(chi ?? payerOf(task, this.payerNow()));
    const all = [...new Set([...this.wanderers().map((w) => w.id), ...wanderersIn(this.files).map((w) => w.id)])];
    return { author: autore, payer: pagante, holder: cardHolderOf(cardId, pagante, all.length ? all : [SOLO], this.config?.seed ?? 0) };
  }

  /** Whether an id (of the graph's kind) is a card of this universe. */
  isCard(id: string): boolean {
    if (id.startsWith('chunk:')) return this.cards.hasChunk(id.slice(6));
    if (this.cardIdsOf?.files !== this.files) this.cardIdsOf = { files: this.files, ids: new Set(allCards(this.files).map((c) => c.id)) };
    return this.cardIdsOf.ids.has(id);
  }

  /** Every card of the universe, with its uses; with an id, that wanderer's collection. */
  cardsOf(wanderer?: string): Card[] {
    const files = { ...this.files, [CARDS_FILE]: this.cards.toJson() };
    return wanderer === undefined ? allCards(files) : collectionOf(files, wanderer);
  }

  /** What a wanderer receives from this universe's cards as one who held them before a clone (T45c, ADR-0084). */
  received(wanderer = this.wanderer().id): Received[] {
    return receivedBy({ ...this.files, [CARDS_FILE]: this.cards.toJson() }, wanderer);
  }

  /** On leaving: the spending of this session goes into the universe even if nothing else changed. */
  saveUsage(): boolean {
    if (this.mirror) return false;
    // Broken code is withheld from the commit (T262): the ledger is saved anyway, unless the universe is not this world's.
    if ((this.usage.version === this.usageWritten && this.cards.version === this.cardsWritten) || this.foreignUniverse()) return false;
    this.repo.commit('consumi dei modelli', 'kernel');
    return true;
  }

  /** What was done to the models of entities in the world, by origin. */
  private formsToSave(): Record<string, string[]> {
    return Object.fromEntries([...this.savedForms].filter(([, d]) => d.length));
  }

  /** What lies on furniture (T291): enough to put it back where it was, turned as it was; the most recent if they are very many. */
  private placedToSave(): PlacedRecord[] {
    const out: PlacedRecord[] = [];
    const r4 = (v: number) => Math.round(v * 10000) / 10000;
    for (const id of this.ecs.query('placed', 'pickup', 'pos')) {
      const pk = this.ecs.get(id, 'pickup');
      const p = this.ecs.get(id, 'pos');
      const z = this.ecs.get(id, 'placed').z;
      const yaw = this.ecs.get(id, 'form')?.yaw ?? 0;
      if (typeof pk?.item !== 'string' || !(pk.count >= 1) || ![p.x, p.y, z, yaw].every(Number.isFinite)) continue;
      out.push({ item: pk.item, count: Math.floor(pk.count), x: r4(p.x), y: r4(p.y), z: r4(z), yaw: r4(yaw), ...(pk.inv ? { inv: pk.inv } : {}) });
    }
    return out.slice(-MAX_PLACED);
  }

  /**
   * Puts back what lay on furniture when the game was saved (T291). `world/state.json` is a file of the universe, which a master may
   * write by hand: whatever is not a known item at a finite place is left out, never thrown at the world.
   */
  private restorePlaced(list: unknown): void {
    if (!Array.isArray(list)) return;
    for (const r of list.slice(-MAX_PLACED)) {
      if (!r || typeof r !== 'object') continue;
      const { item, count, x, y, z, yaw, inv } = r as Record<string, unknown>;
      if (typeof item !== 'string' || !this.content.get(item)) continue;
      const at = [x, y, z].map((v) => (typeof v === 'number' && Number.isFinite(v) && Math.abs(v) < 1e6 ? v : NaN));
      if (!at.every(Number.isFinite)) continue;
      const n = typeof count === 'number' && Number.isInteger(count) && count >= 1 ? Math.min(count, 999) : 1;
      const id = this.spawnItem(item, at[0], at[1], n);
      if (typeof yaw === 'number' && Number.isFinite(yaw)) this.ecs.get(id, 'form').yaw = yaw;
      this.ecs.set(id, 'placed', { z: at[2] });
      this.ecs.get(id, 'pos').z = at[2];
      const bag = readInventory(inv);
      if (bag) this.ecs.get(id, 'pickup').inv = bag;
    }
  }

  /** Restores what was saved: the same wanderer, the same world, after a restart. */
  loadState(): void {
    let st: any;
    try {
      // A state of the contract 0.3 (`consumati`, `rari`, `ora`) reads internal (T308a): the kernel ports it at boot anyway.
      st = internalFields('state', JSON.parse(this.files['world/state.json'] ?? 'null'));
    } catch {
      st = null;
    }
    // Each wanderer from their own file, `me` also from the wanderer of an older state of the world.
    for (const w of this.wanderersById.values()) {
      const v = readWandererState(this.files, w.id);
      if (!v) continue;
      if (v.name && w.id !== SOLO) w.name = String(v.name).slice(0, 40);
      if (v.profile && !this.mirror) this.setProfile(w.id, v.profile);
      this.as(w.id, () => this.applyWandererState(v));
      if (w.id === SOLO && v.transcended) this.exitedOnce = true;
    }
    if (!st) return;
    for (const k of st.consumed ?? []) this.consumed.add(String(k));
    for (const [k, c] of Object.entries(st.containers ?? {})) this.savedContainers.set(k, c as { inv: Inventory; filled: boolean });
    for (const [k, d] of Object.entries(st.forms ?? {})) if (Array.isArray(d)) this.savedForms.set(k, d.map(String));
    this.restorePlaced(st.placed);
    // After the containers and the forms: a thing moved comes back with what its origin keeps (T292).
    this.restoreMoved(st.moved);
    // The important structures of before ADR-0092 are the Huge ones.
    for (const [z, c] of Object.entries(st.important ?? {})) if (typeof c === 'string') this.rari.get('huge')!.set(z, c);
    for (const t of RARE_SIZES) for (const [z, c] of Object.entries(st.rares?.[t] ?? {})) if (typeof c === 'string') this.rari.get(t)!.set(z, c);
    if (Number.isFinite(st.time)) this.time = st.time;
    this.lastState = JSON.stringify(st);
  }

  /**
   * A player's rollback in a multiplayer game (T37): the runes they wrote come back to their phrase, and with them
   * goes whatever those lines were doing; the repository, and everyone else's world, stay as they are.
   */
  private takeBackRunes(): void {
    const me = this.wanderer().id;
    const hand = this.phrase();
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
    if (this.readOnly() !== undefined) {
      this.message('Questo universo si legge soltanto: non torna a un commit di prima.', 'warn');
      return false;
    }
    const files = await this.repo.backend?.checkout(commitId).catch(() => null);
    if (!files) return false;
    for (const [p, v] of Object.entries(files)) this.repo.write(p, v);
    for (const p of Object.keys(this.repo.working)) if (!(p in files)) this.repo.write(p, null);
    this.unsaved.clear();
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
    // In a multiplayer game the repository goes back only for the master (T37); a player takes back what they wrote.
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
        if (this.give(`rune:${rune.token}`, 1)) this.phrase().tokens.push(rune.token);
      });
      this.ecs.destroy(id);
    }
    const files = commitId ? this.repo.checkout(commitId) : this.repo.restore();
    this.unsaved.clear();
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
    this.writeCommanded(path, content);
    this.applyFiles({ ...this.repo.working });
    const broken = this.faults.list().some((f) => f.key.startsWith('manifest:') || f.key.endsWith(':load') || f.key === 'universe:config' || f.key === 'universe:kernel');
    let committed = false;
    if (!errors.length && !broken) {
      this.unsaved.delete(path);
      const c = this.repo.commit(`modifica ${path}`, 'player');
      this.log('repo', `commit ${c.id}: ${c.message}`);
      committed = true;
    } else {
      this.unsaved.add(path);
      this.log('repo', `${path} scritto senza commit: l'universo è in uno stato non valido`);
    }
    return { errors, committed, written: true };
  }

  /**
   * The master's branch published (T42b): its files, validated, go into the world at once and become one commit of
   * the main line. A world they would break (a manifest, a module that does not load) is put back as it was.
   */
  publish(changes: Record<string, string | null>, message: string): { ok: boolean; motivo?: string; commit?: Commit } {
    const paths = Object.keys(changes);
    if (!paths.length) return { ok: false, motivo: 'niente da pubblicare' };
    for (const p of paths) {
      const v = changes[p];
      const errors = v === null ? [] : this.validator.validateFile(p, v);
      if (errors.length) return { ok: false, motivo: `${p}: ${errors.join(' · ')}` };
    }
    const before = Object.fromEntries(paths.map((p) => [p, this.repo.working[p] ?? null]));
    for (const p of paths) this.repo.write(p, changes[p]);
    this.applyFiles({ ...this.repo.working });
    const broken = this.faults.list().find((f) => f.key.startsWith('manifest:') || f.key.endsWith(':load') || f.key === 'universe:config' || f.key === 'universe:kernel');
    if (broken) {
      for (const p of paths) this.repo.write(p, before[p]);
      this.applyFiles({ ...this.repo.working });
      return { ok: false, motivo: `il mondo si romperebbe: ${broken.message}` };
    }
    for (const p of paths) this.unsaved.delete(p);
    const commit = this.repo.commit(message, 'player');
    this.log('repo', `commit ${commit.id}: ${message}`);
    return { ok: true, commit };
  }

  /**
   * A kernel on the master's branch (T42e): `files` are this world's with the branch on top. The same models (and their
   * budget), the calls in this kernel's ledger, the Council's words in this feed; nothing generated, saved or ticking of
   * its own (a mirror), the one acting is `wanderer`. What a request to the Council commits there is the branch's.
   */
  async branchKernel(files: FileMap, wanderer: string): Promise<Kernel> {
    const decisions = this.council.decisions === this.council.localAiModels ? undefined : this.council.decisions;
    const k = await Kernel.boot({ files, store: memoryStore(), ai: this.ai, decisions, wasmUri: this.wasmUri, mirror: true });
    this.ai.onCall = (r) => {
      this.usage.record(r);
      this.billCall(r);
    };
    if (decisions)
      decisions.onCall = (r) => {
        this.usage.record(r);
        this.billCall(r);
      };
    k.bus.on('council', (e: FeedEntry) => this.council.say(e.from, e.kind, e.text, e.to, e.task));
    const body = k.addWanderer(wanderer);
    if (body !== undefined) k.wandererEntity = body;
    k.council.payer = (task) => payerOf(task, wanderer);
    k.council.hasCredits = (chi) => this.hasCredits(chi);
    k.council.rationed = (task) => this.rationed(task);
    k.council.thinking = () => this.config.ai.thinking;
    k.onShortfall = (n) => this.noteShortfall(n);
    return k;
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
    if (!this.corona.isInterior(this.wandererPos().x)) this.lastWorld = { ...this.wandererCarpet() };
    if (this.zone === 'corona') this.archive.meet(this.wandererPos().x, this.wandererPos().y);
    this.npc.tick();
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
          this.syncPhrase();
          this.statesTick();
          const n = this.needs();
          if (n && !Number.isFinite(n.mana)) n.mana = 60;
        });
    }
    this.updateChunks();
    this.waterTick();
    this.pumpDevelopment();
    if (this.time - this.lastSculptPump > 2) {
      this.lastSculptPump = this.time;
      this.sculpting.pump();
      this.composing.pump();
    }
    this.rebuildSolids();
    for (const w of this.wanderersById.keys()) this.as(w, () => (this.wandererComp().load = totalWeight(this.inventory(), this.itemSpec) / this.carryCapacity()));
    this.syncRunes();
    this.sandbox.tickBegin();
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
    // The tick's budget (ADR-0105): a fault of its own, not of the modules that had to wait.
    if (this.sandbox.tickEnd() > 0) this.faults.raise('tick:budget', 'budget del tick esaurito: alcune chiamate sono saltate');
    else this.faults.clear('tick:budget');
    for (const w of this.wanderersById.keys()) !this.remote.has(w) && this.as(w, () => this.jumpTick(dt));
    this.keepGods();
    this.syncRunes();
    this.sanitize();
    this.settleHeights();
    this.updateZone();
    for (const [id, b] of this.bubbles) if (b.until < this.time || !this.ecs.alive.has(id)) this.bubbles.delete(id);
  }

  /**
   * A thin client's tick (T39): its wanderer walks and the carpet carries them, as in a game alone, against the
   * entities the server sent; the rest of the world moves on the server and arrives with its updates.
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
    this.settleHeights();
    this.updateZone();
    for (const [id, b] of this.bubbles) if (b.until < this.time || !this.ecs.alive.has(id)) this.bubbles.delete(id);
  }

  /**
   * The floor, for the wanderer acting: states switched off by Lua are removed, and the pace they give is a plain
   * number on the player (Lua must not iterate tables that live on the JS side: wasmoon cannot).
   */
  private paceTick(): void {
    const states = this.ecs.get(this.wandererEntity, 'states');
    let step = 1;
    if (states)
      for (const k of Object.keys(states)) {
        if (!states[k] || typeof states[k] !== 'object') delete states[k];
        else step *= Number(states[k].speed) || 1;
      }
    const pl = this.ecs.get(this.wandererEntity, 'player');
    if (pl) pl.step = Math.max(0.2, Math.min(4, step));
  }

  private rebuildSolids(): void {
    this.solidTiles.clear();
    this.solidForms.clear();
    this.cellars = [];
    for (const id of this.ecs.query('body', 'pos')) {
      if (id === this.wandererEntity) continue;
      const b = this.ecs.get(id, 'body');
      if (!b.solid) continue;
      const p = this.ecs.get(id, 'pos');
      const fc: FormComp | undefined = this.ecs.get(id, 'form');
      const f = fc && this.forms.ready(fc.model, fc.seed, fc.tint);
      // A solid thing whose brought model stops nobody (T296, rule 10): the card is isolated, the thing blocks its tile until the generic is ready.
      if (!fc || !f?.foot || (f.footless && this.isBrought(fc.model) && this.cardBroke(fc.model, 'footless', breakReason('footless', { seed: f.seed })))) {
        this.solidTiles.add(`${Math.floor(p.x)},${Math.floor(p.y)}`);
        continue;
      }
      // An entity with a model blocks with its voxels: it is listed in every cell its footprint may reach.
      const s: SolidForm = { id, x: p.x, y: p.y, yaw: fc.yaw, form: f, ...this.groundOf(id, fc, f) };
      if (s.hole) this.cellars.push(s);
      for (let cy = Math.floor(p.y - f.reach); cy <= Math.floor(p.y + f.reach); cy++)
        for (let cx = Math.floor(p.x - f.reach); cx <= Math.floor(p.x + f.reach); cx++) {
          const key = `${cx},${cy}`;
          (this.solidForms.get(key) ?? this.solidForms.set(key, []).get(key)!).push(s);
        }
    }
  }

  /** The kernel never lets the core state become meaningless (NaN, missing, absurd). */
  private sanitize(): void {
    const p = this.ecs.get(this.wandererEntity, 'pos');
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
    if (!p) this.ecs.set(this.wandererEntity, 'pos', { x: this.lastGood.px, y: this.lastGood.py });
    else if (!okPos) Object.assign(p, { x: this.lastGood.px, y: this.lastGood.py });
    if (c && !okCarpet) Object.assign(c, { ox: this.lastGood.ox, oy: this.lastGood.oy });
    this.faults.raise('kernel:sanitize', 'stato del mondo non valido: il kernel ha ripristinato posizione e tappeto');
  }

  /**
   * Where every body stands (T53b): the floor under it nearest to where its feet were, in `pos.z` (tiles). Who
   * went up the stairs stays on the floor above, who walks under it on the ground floor. The wanderers by their
   * carpet; out of the circle (corona, studio) they have no floor of the simulation. Away from entities with a model
   * there is only the ground: no height is kept (the tick stays cheap).
   */
  private settleHeights(): void {
    const settle = (p: { x: number; y: number; z?: number }, x: number, y: number) => {
      if (!this.solidForms.has(`${Math.floor(x)},${Math.floor(y)}`)) delete p.z;
      else p.z = this.floorAt(x, y, Number.isFinite(p.z) ? p.z : undefined);
    };
    const wanderers = new Set<Id>();
    for (const w of this.wanderersById.keys())
      this.as(w, () => {
        wanderers.add(this.wandererEntity);
        const p = this.wandererPos();
        if (!p) return;
        if (this.corona.isInterior(p.x) || Math.hypot(p.x, p.y) >= this.config.circleRadius) delete p.z;
        else {
          const c = this.wandererCarpet();
          settle(p, c.x, c.y);
        }
      });
    for (const id of this.ecs.query('body', 'pos')) {
      if (wanderers.has(id)) continue;
      const p = this.ecs.get(id, 'pos');
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
      // What lies on furniture rests on the highest floor no higher than where it was put (T291): its shelf, or, if the furniture is
      // not there (gone, or its form still on its way), what is under it. Where it was put stays, so the shelf takes it back.
      const placed = this.ecs.get(id, 'placed');
      if (placed && Number.isFinite(placed.z)) p.z = this.floorBelow(p.x, p.y, placed.z + REST_SLACK);
      else settle(p, p.x, p.y);
    }
  }

  private updateZone(): void {
    const p = this.wandererPos();
    const zone = this.corona.isInterior(p.x) ? 'studio' : Math.hypot(p.x, p.y) >= this.config.circleRadius ? 'corona' : 'sim';
    if (zone === 'sim') this.offCarpet.delete(this.wandererEntity);
    if (zone === this.zone) return;
    this.zone = zone;
    this.bus.emit('zone', { zone, first: zone === 'corona' && !this.exitedOnce });
    if (zone === 'corona') {
      this.exitedOnce = true;
      this.visitCorona(this.tickCount);
    }
  }

  /** 0..1, how broken the universe currently is. */
  brokenness(): number {
    const n = this.faults.size;
    return n === 0 ? 0 : Math.min(1, 0.3 + 0.15 * (n - 1));
  }
}

/** What the Studio of characters says of an individual (T23), in the order a visitor reads it. */
function individualFacts(p: Individual, type: string): Array<[string, string]> {
  const out: Array<[string, string]> = [['Individuo', p.name]];
  const who = [p.species === 'animal' ? 'animale' : 'persona', p.gender ? italianName('specie', p.gender) : undefined, p.age].filter(Boolean).join(', ');
  out.push(['Chi è', `${type} (${who})`], ['Mestiere', p.job]);
  if (p.look) out.push(['Aspetto', p.look]);
  if (p.persona) out.push(['Carattere', p.persona]);
  if (p.story) out.push(['Storia', p.story]);
  if (p.family?.length) out.push(['Famiglia', p.family.map((r) => `${r.bond} di ${r.name}`).join(', ')]);
  for (const r of p.family ?? []) if (wandererOf(r)) out.push([wandererOf(r) === SOLO && r.name === WANDERER_NAME ? 'Per il viandante' : `Per ${r.name}`, r.bond]);
  if (p.routine?.length) out.push(['Giornata', p.routine.map((r) => `${italianName('momenti', r.when)}: ${r.does}`).join('; ')]);
  if (p.place) out.push(['Incontrato a', p.place]);
  if (p.carries?.length) out.push(['Porta con sé', p.carries.join(', ')]);
  if (p.memories?.length) out.push(['Ricorda', p.memories.slice(-3).map((m) => m.text).join(' · ')]);
  return out;
}

/**
 * An effect on another wanderer without what would harm them (T43b, no PvP): needs only where they go up, no push, no fire,
 * no state that slows them, none of theirs taken away; undefined when nothing is left.
 */
export function unharmed(e: Effect): Effect | undefined {
  switch (e.type) {
    case 'needs': {
      const kept = Object.fromEntries((['hunger', 'thirst', 'energy', 'health'] as const).filter((k) => Number(e[k]) > 0).map((k) => [k, e[k]]));
      return Object.keys(kept).length ? { type: 'needs', ...kept } : undefined;
    }
    case 'push':
    case 'fire':
    case 'remove_state':
      return undefined;
    case 'state':
      return e.speed !== undefined && Number(e.speed) < 1 ? undefined : e;
    default:
      return e;
  }
}
