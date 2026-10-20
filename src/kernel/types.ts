// Shared kernel types. The manifest schema is the contract between the kernel and universe modules.

export type FileMap = Record<string, string>;

/** entity = NPCs and objects in the world; item = things that go in the inventory. */
export type ModuleKind = 'system' | 'entity' | 'item' | 'player' | 'generator' | 'data';

export interface Appearance {
  /** Fallback glyph when no sprite is available (offline, or still painting). */
  glyph: string;
  color: string;
  /** What the Artist paints. */
  imagePrompt?: string;
  /** Asset id ("img:…") of the generated sprite. */
  sprite?: string;
  /** Sprite size in cells (default 1.1). */
  scale?: number;
  /** Walk cycle: asset ids per direction (down, left, right, up), painted by the Atelier. */
  frames?: Record<string, string[]>;
}

export interface Physics {
  solid?: boolean;
  radius?: number;
  /** Can be shoved by walking into it. */
  pushable?: boolean;
  mass?: number;
  /** Fraction of velocity lost per second when sliding (0..1). */
  friction?: number;
  /** Own walking speed (NPCs), cells per second. */
  speed?: number;
}

export interface SpawnRule {
  /** Tile codes this entity may spawn on. */
  tiles: string[];
  /** Probability per attempt. */
  chance: number;
  /** Attempts (and maximum count) per chunk. */
  max: number;
}

export interface Interaction {
  /** talk → LLM-simulated character (persona); read → narrated text; lua → module's on_interact(id). */
  type: 'talk' | 'read' | 'lua';
}

export interface ItemSpec {
  stackable: boolean;
  maxStack: number;
  /** Weight units; the player carries up to CARRY_CAPACITY before slowing down. */
  weight: number;
  equippable: boolean;
  /** Controls the item adds, shown in the inventory: { usa: "…", azione: "…" }. */
  controls?: Record<string, string>;
}

export type TileLayer = 'ground' | 'floor' | 'wall' | 'door' | 'liquid' | 'vegetation' | 'rock';

export interface TileDef {
  name: string;
  /** Base colour: procedural texture offline, legend for the Artist. */
  color: string;
  solid: boolean;
  /** Walking speed multiplier on this tile (mud 0.6, road 1.1…). Default 1. */
  speed?: number;
  description?: string;
  /** How it is drawn and how paths are carved through it. Default ground (walkable) / rock (solid). */
  layer?: TileLayer;
  /** Indoor floor: buildings are indoor floor enclosed by walls; their roof hides them from outside. */
  indoor?: boolean;
  /** Asset id of the seamless texture painted by the Artist. */
  texture?: string;
  /** Asset ids of obstacle sprites standing on this tile (trees, boulders…), chosen per cell. */
  sprites?: string[];
}

export const ITEM_CATEGORIES = ['cibo', 'bevanda', 'medicina', 'attrezzo', 'arma', 'materiale', 'luce', 'vestiario', 'contenitore', 'varie'] as const;
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

/** A thing that can be carried. Mostly data (cheap text), generated in packs; custom logic is optional. */
export interface ItemDef {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  weight: number;
  /** Max stack size (1 = not stackable). */
  stack: number;
  tags: string[];
  glyph: string;
  color: string;
  /** Asset id of the icon (painted in sheets of 16). */
  icon?: string;
  iconPrompt?: string;
  equippable?: boolean;
  /** Applied by core.items when the item is used (eaten, drunk, applied). */
  effects?: { hunger?: number; thirst?: number; energy?: number; health?: number };
  /** Module with custom logic (on_use / on_action), if any. */
  module?: string;
}

export interface Recipe {
  id: string;
  name: string;
  inputs: Array<{ item: string; count: number }>;
  /** Items needed but not consumed. */
  tools?: string[];
  output: { item: string; count: number };
}

export interface LootEntry {
  item?: string;
  /** Any item with this tag (categories count as tags). */
  tag?: string;
  weight: number;
  min?: number;
  max?: number;
}

export interface LootTable {
  rolls: [number, number];
  entries: LootEntry[];
}

/** An environment: a MarkovJunior program that shapes a chunk (written by the Cartographer). */
export interface LayoutDef {
  name: string;
  description: string;
  environment: 'esterno' | 'interno' | 'misto';
  program: import('./mj').MjNode;
}

/** Something you can do to an object (E opens the menu). Handled by the module's on_act(id, user, action). */
export interface ActionDef {
  id: string;
  label: string;
  /** Item id or tag the player must carry. */
  requires?: string;
}

export interface RuneFragment {
  line: string;
  weight: number;
}

export interface Manifest {
  id: string;
  name: string;
  kind: ModuleKind;
  version?: string;
  description?: string;
  logic?: string;
  /** Systems run in ascending order each tick. */
  order?: number;
  appearance?: Appearance;
  physics?: Physics;
  components?: Record<string, any>;
  /** Components of a single entity the kernel creates at boot (e.g. the carpet). */
  singleton?: Record<string, any>;
  /** "component.field" entries kept across rollback (everything else is reset to manifest defaults). */
  persist?: string[];
  interaction?: Interaction;
  spawn?: SpawnRule;
  /** An individual: at most one in the loaded world (a named character, a unique relic). */
  unique?: boolean;
  /** Character sheet for NPCs: the LLM plays this person. */
  persona?: string;
  /** Module ids an NPC carries (can give them away). */
  inventory?: string[];
  item?: ItemSpec;
  /** Where/when this belongs in the world, for the Cartographer. */
  context?: string;
  lore?: string;
  tags?: string[];
  /** Item module ids this entity leaves behind when destroyed by an item action. */
  drops?: string[];
  /** Who generated it: genesi | agente | cartografo | combinazione | disco. */
  origin?: string;
  prompts?: Record<string, string>;
  tiles?: Record<string, TileDef>;
  /** Roof of buildings (generator modules). */
  roof?: { color: string; texture?: string };
  fragments?: RuneFragment[];
  /** Content packs (data modules). */
  items?: ItemDef[];
  recipes?: Recipe[];
  loot?: Record<string, LootTable>;
  layouts?: Record<string, LayoutDef>;
  /** Furniture and chests: a container filled from a loot table the first time it is opened. */
  container?: { size: number; loot: string };
  actions?: ActionDef[];
}

export interface ModuleEntry {
  manifest: Manifest;
  dir: string;
  manifestPath: string;
  logicPath?: string;
}

export interface AiConfig {
  textModel: string;
  imageModel: string;
  /** Per-session call budgets. */
  maxText: number;
  maxImages: number;
  /** New modules the world may forge by itself per session (cartographer, combinations). */
  maxForges: number;
  /** How characters get their walk cycle: one sheet per character, frame by frame, or none. */
  animation?: 'sheet' | 'frames' | 'none';
  /** New item packs the world writes by itself per session, as it is explored. */
  maxPacks?: number;
}

export interface UniverseConfig {
  name: string;
  seed: number;
  theme: string;
  circleRadius: number;
  chunkSize: number;
  ai: AiConfig;
}

export interface Place {
  name: string;
  description: string;
}

export interface GeneratedRune {
  line: string;
  col: number;
  row: number;
}
