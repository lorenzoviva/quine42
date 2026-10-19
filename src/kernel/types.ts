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

export interface TileDef {
  name: string;
  /** Colour of the tile in layout sketches (and in the offline rendering). */
  color: string;
  solid: boolean;
  /** Walking speed multiplier on this tile (mud 0.6, road 1.1…). Default 1. */
  speed?: number;
  description?: string;
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
  fragments?: RuneFragment[];
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
