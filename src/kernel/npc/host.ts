// What the people of the world ask of the kernel (T327, ADR-0166): the one port of `npc/`. The NPC does not know the class `Kernel`:
// it gets this, and nothing else, when the kernel makes it. Everything an individual reads or changes outside itself passes here —
// the ECS, the files of the universe and their commits, the places and their tiles, the wanderers, the Council's table — so what the
// people depend on is a list one can read, and a test can give a world of its own. The kernel implements it in `npcHost()`.

import type { Id, World } from '../ecs';
import type { Council } from '../agents/council';
import type { Uses } from '../cards';
import type { Interpreter } from '../agents/minds';
import type { ChunkPlan, PlannedHouse } from '../agents/cartography';
import type { Coefficients } from '../coefficients';
import type { Content } from '../content';
import type { Forms } from '../forms';
import type { Inventory } from '../inventory';
import type { Lot } from '../layout';
import type { Commit } from '../repo';
import type { ShortfallNote } from '../shortfalls';
import type { ModuleStores } from '../store';
import type { ChunkInfo, FileMap, ItemDef, ItemSpec, ModuleEntry, Rule, TerrainDef } from '../types';
import type { WornZone } from '../wearing';
import type { DayPhase } from './society';

/** A place of the world as the people see it: a loaded chunk (the kernel's `Chunk` is one). */
export interface NpcPlace {
  key: string;
  cx: number;
  cy: number;
  stage: 'draft' | 'planned';
  tiles: string;
  lots: Lot[];
  place?: ChunkInfo;
  plan?: ChunkPlan;
}

/** A wanderer as the people know them: an id and a name (the rest is the kernel's). */
export interface NpcWanderer {
  id: string;
  name: string;
}

export interface NpcHost {
  // --- The universe: configuration, files, commits ---------------------------------------------
  readonly config: { readonly seed: number; readonly chunkSize: number };
  /** The files as the world reads them now. */
  files(): FileMap;
  /** The working tree of the universe's repository. */
  working(): FileMap;
  /** Writes a file of the working tree (committed with the next commit). */
  write(path: string, text: string): void;
  /** A file just written is read by the world at once, with nothing else reloaded. */
  keepFile(path: string): void;
  /** The whole working tree read again (`applyFiles`): what was written changes the world. */
  applyWorking(): void;
  /** A commit of the kernel (`agent`). */
  commit(message: string): void;
  /** A commit of content, signed by the agent that wrote it and paid by `chi` (cards, ADR-0056). */
  commitContent(message: string, task: string, agent: string, chi?: string): Commit;

  // --- The world: time, entities, registry -----------------------------------------------------
  readonly ecs: World;
  readonly time: number;
  /** Ticks since the start (the ways' cache counts in them). */
  readonly ticks: number;
  /** A thin client's kernel: it shows what the server sends, it decides nothing. */
  readonly mirror: boolean;
  /** Generation held (a bench, a mirror, the Genesis not done): no new individual, no model called by the society. */
  readonly generationHeld: boolean;
  /** The models are the local ones (`offline`). */
  readonly offline: boolean;
  /** The day of the world (0 = the first) and its phase now. */
  day(): number;
  phase(): DayPhase;
  readonly modules: ReadonlyMap<string, ModuleEntry>;
  readonly palette: Readonly<Record<string, TerrainDef>>;
  readonly content: Content;
  /** What was taken from the world (origins): a person whose origin is here is gone. */
  readonly consumed: Set<string>;
  readonly stores: ModuleStores;
  readonly forms: Pick<Forms, 'resolve' | 'seedFor'>;
  /** The common house of the world's terrain (ADR-0134), if it says one. */
  commonHouse(): string | undefined;
  log(source: string, message: string): void;
  /** A stamp unique in this world (ids of plots, origins of the born). */
  worldStamp(): string;
  /** Whether a module has a Lua function, and running it. */
  hasHook(module: string, fn: string): boolean;
  runModule(module: string, fn: string, ...args: unknown[]): { value: unknown; failed: boolean };
  spawnModuleEntity(m: ModuleEntry, x: number, y: number, chunkKey?: string, origin?: string): Id;
  itemInfo(id: string): { name: string };
  itemSpec(id: string): ItemSpec | undefined;
  /** The zone of the body a thing is worn on (T353), or undefined if it is not worn (`Kernel.wornZone`). */
  wornZone(item: string): WornZone | undefined;
  /** New items defined by the Narrator (the «citati» pack). */
  introduceItems(names: string[], context: string, chi?: string): Promise<ItemDef[]>;
  /** Things mentioned in a talk become part of the world. */
  noteMentions(names: string[], context: string): Promise<void>;

  // --- The places: chunks, tiles, collisions, structures ---------------------------------------
  readonly chunks: ReadonlyMap<string, NpcPlace>;
  chunkAt(x: number, y: number): NpcPlace | undefined;
  /** The place the wanderer acting now is in. */
  chunkHere(): ChunkInfo | undefined;
  tileAt(col: number, row: number): string | undefined;
  setTile(col: number, row: number, code: string): boolean;
  /** The code of the paths of the palette. */
  pathCode(): string;
  /** Whether a body of half-size r stands at a point (at the height z of its feet). */
  free(x: number, y: number, r: number, z?: number): boolean;
  floorAt(x: number, y: number, z?: number): number;
  /** Whether a solid model stands on a tile (else the tiles say it all). */
  formOn(col: number, row: number): boolean;
  /** The nearest entity within r with a tag. */
  nearest(x: number, y: number, r: number, tag?: string): Id | undefined;
  /** Where one stands inside a structure, on its floor. */
  interiorPoints(structure: Id): Array<{ x: number; y: number }>;
  /** A plan changed: saved soon. */
  saveChunkSoon(ch: NpcPlace): void;
  /** The structure of a lot of a loaded place, laid again at a stage (1: whole). */
  spawnLot(ch: NpcPlace, origin: string, stage: number): void;
  /** A house of the plan on free ground, laid at its stage (once). */
  spawnPlannedHouse(ch: NpcPlace, house: PlannedHouse | undefined): void;

  // --- The wanderers ---------------------------------------------------------------------------
  /** The wanderer acting now. */
  wanderer(): NpcWanderer;
  wandererById(id: string): NpcWanderer | undefined;
  /** Acting as a wanderer (synchronous: never spans an await). */
  as<T>(id: string, fn: () => T): T;
  /** The wanderer an entity is, if it is one. */
  wandererOf(entity: Id): string | undefined;
  /** Where a wanderer is in the world (carpet space). */
  wandererAt(id: string): { x: number; y: number } | undefined;
  wandererCarpet(): { x: number; y: number };
  wanderersInWorld(): Array<{ id: Id; chi: string; x: number; y: number }>;
  profileOf(id: string): { introduction?: string } | undefined;
  /** The inventory of the wanderer acting now. */
  inventory(): Inventory;
  /** An item the wanderer acting now carries, by name. */
  carriedByName(name: string): string | undefined;
  give(item: string, n: number): number;
  message(text: string, tone?: 'info' | 'warn' | 'good'): void;
  speak(id: Id, text: string): void;
  recordRule(rule: Rule, commit?: boolean): void;
  directionsAt(x: number, y: number): string[];
  /** What a local knows of the moment (the hour, the place, the wanderer's state), for a reply. */
  worldFacts(): Record<string, unknown>;

  // --- The Council ----------------------------------------------------------------------------
  readonly council: Council;
  /** Who plays the people: the Actor when on, else the Narrator. */
  interpreter(): Interpreter;
  actorOn(): boolean;
  coefficients(): Coefficients;
  /** The nodes of the world graph a request is about (the Narrator's context). */
  focusOn(refs: Array<string | false | undefined>, at?: { x: number; y: number }): string[];
  noteShortfall(note: Omit<ShortfallNote, 'who'> & { who?: string }): void;
  /** The cards of the graph that some names stand for, and their use by a task. */
  resolve(names: string[]): string[];
  useCards(ids: string[], kind: keyof Uses): void;
}

