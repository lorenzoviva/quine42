import type { CardStamp } from './cards';

export type FileMap = Record<string, string>;

export interface Rule {
  key: string;
  text: string;
  possible: boolean;
  story: string;
  effects?: string[];
  /** Who judged it and who paid (T36): only the Council's judgements are cards. */
  card?: CardStamp;
}

/** entity = NPCs and objects in the world; item = things that go in the inventory. */
export type ModuleKind = 'system' | 'entity' | 'item' | 'player' | 'generator' | 'data';

export interface Appearance {
  /** A sign for lists and the atlas, and the colour of its stand-in while it has no model. */
  glyph: string;
  color: string;
  /** How it looks, in words: what the Sculptor sculpts. */
  look?: string;
  /** Its look: a program of the library (`models/<id>.xml`); without one, the generic model of its class. */
  model?: string;
  /** Asset class (src/mj/classes.ts): person, animal, tree, furniture, building… */
  class?: string;
  /** Its size of D&D (ADR-0092: minuscola … gargantuesca), if not its class's own: the model's box scales with it. */
  size?: string;
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

export type TerrainLayer = 'ground' | 'floor' | 'wall' | 'door' | 'liquid' | 'vegetation' | 'rock';

export interface TerrainDef {
  /**
   * The terrain's internal id (T307a, ADR-0153): what the code and Lua name it by (`world.find_tile`, `matura.in`, effects), the same in
   * every language; `name` is its word in the language of the world. A terrain of the Genesis may have none: the name then stands for it.
   */
  id?: string;
  name: string;
  /** Colour of the ground. */
  color: string;
  solid: boolean;
  /** Walking speed multiplier on this tile (mud 0.6, road 1.1…). Default 1. */
  speed?: number;
  description?: string;
  /** How it is drawn and how paths are carved through it. Default ground (walkable) / rock (solid). */
  layer?: TerrainLayer;
  /** Indoor floor: lots are indoor floor enclosed by walls; their roof hides them from outside. */
  indoor?: boolean;
  /** What stands on tiles of this terrain (trees on woods, boulders on rock): a program of `models/`. */
  model?: string;
  /** Actions learned on this kind of terrain ("Altro…" on a tile): effects at that place. */
  actions?: ActionDef[];
  /** What it becomes by itself (T245b, ADR-0140): after `dopo` days of the world from when the tile was written, the tile `in`. */
  ripens?: { after: number; in: string };
}

export const ITEM_CATEGORIES = ['food', 'drink', 'medicine', 'tool', 'weapon', 'material', 'light', 'clothing', 'container', 'magic', 'misc'] as const;
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
  /** How it looks, in words: what the Sculptor sculpts. */
  look?: string;
  /** Its look (a program of `models/`); items of a kind can share one, tinted with `color`. */
  model?: string;
  equippable?: boolean;
  /** Applied by core.items when the item is used (eaten, drunk, applied, absorbed). */
  effects?: { hunger?: number; thirst?: number; energy?: number; health?: number; mana?: number };
  /** Bags, pouches, baskets: an inventory inside the item (only things with tag `accepts`, if set). */
  container?: { size: number; accepts?: string };
  /** Learned uses ("Altro…" in the inventory): effects applied without asking the Council again. */
  actions?: ActionDef[];
  /** Module with custom logic (on_use / on_action), if any. */
  module?: string;
  /** What wearing or wielding it gives (difesa, attacco, velocita, peso, luce, calore…): mechanics read it. */
  bonus?: Record<string, number>;
  /** Where it is worn or held (testa, corpo, gambe, piedi, mani, arma, scudo, anello…), for slots. */
  slot?: string;
}

/**
 * An interface a module brings into the game (ADR-0028): the kernel draws it (a tab of the inventory),
 * the module's Lua reacts (`on_slot`, `on_ui`). The Council writes these to add mechanics: equipment,
 * a quiver, a horse's saddlebags, a reputation sheet.
 */
export interface UiElement {
  type: 'slot' | 'bar' | 'text' | 'button';
  /** Slot id, or the action a button sends to on_ui. */
  id?: string;
  label?: string;
  /** Slot: what fits (item slot names, categories or tags: "testa", "clothing", "weapon"). */
  accepts?: string[];
  /** Bar/text: a field of a player component, "componente.campo" (e.g. "needs.health"). */
  field?: string;
  max?: number;
  color?: string;
}

export interface UiPanel {
  id: string;
  title: string;
  description?: string;
  elements: UiElement[];
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
export interface EnvironmentDef {
  name: string;
  description: string;
  environment: 'esterno' | 'interno' | 'misto';
  program: import('./mj').MjNode;
}

/**
 * What can happen in the world, from a closed set: the Council chooses, the kernel validates,
 * core.effects (Lua) applies. Used by free actions ("Altro…"), learned actions and spells.
 */
export type Effect =
  | { type: 'message'; text: string }
  | { type: 'needs'; hunger?: number; thirst?: number; energy?: number; health?: number }
  | { type: 'create_item'; item: string; quantity?: number }
  | { type: 'consume'; item: string; quantity?: number }
  | { type: 'destroy' }
  | { type: 'open' }
  | { type: 'container'; capacity?: number; loot?: string }
  // A terrain: `to` and `from` are tile codes of the palette (the validator resolves ids and names to them).
  | { type: 'terrain'; to: string; from?: string; radius?: number }
  | { type: 'relief'; delta: number; radius?: number }
  | { type: 'fire'; radius?: number; duration?: number }
  | { type: 'light'; radius?: number; duration?: number }
  | { type: 'shield'; duration?: number }
  | { type: 'push'; force?: number }
  | { type: 'summon'; module: string }
  // Between people (only on someone): what they become to the wanderer (`bond`, a word of the world), what they will remember, a birth.
  | { type: 'bond'; bond: string }
  | { type: 'memory'; text: string; weight?: number }
  | { type: 'birth'; name?: string }
  // New mechanics: a state of the wanderer (on horseback, rowing, wearing a backpack…) that changes how
  // fast they go, how much they carry, how far they see; duration 0 = until taken off.
  | { type: 'state'; name: string; speed?: number; weight?: number; light?: number; duration?: number }
  | { type: 'remove_state'; name: string };

export const EFFECT_TYPES = ['message', 'needs', 'create_item', 'consume', 'destroy', 'open', 'container', 'terrain', 'relief', 'fire', 'light', 'shield', 'push', 'summon', 'bond', 'memory', 'birth', 'state', 'remove_state'] as const;
export type EffectType = (typeof EFFECT_TYPES)[number];

/**
 * Something you can do to an object (E opens the menu). Either handled by the module's
 * on_act(id, user, action), or, for learned actions, by its `effects`.
 */
export interface ActionDef {
  id: string;
  label: string;
  /** Item id or tag the player must carry. */
  requires?: string;
  /** Learned through "Altro…": what the action does, applied without asking the Council again. */
  effects?: Effect[];
}

/** A magic rune: its token is what it means as code; as magic it has an element and a glyph. */
export interface MagicRune {
  name: string;
  glyph: string;
  color: string;
  element: string;
  description: string;
}

/** An incantation: an ordered sequence of runes the Council has named and given effects to. */
export interface Spell {
  name: string;
  description: string;
  /** Energy it costs to cast. */
  cost: number;
  effects: Effect[];
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
  /**
   * A thing of the world one can take and put down elsewhere (T292, ADR-0168): a cupboard yes, a well no; absent is no. Only an
   * entity that is not someone: taken, it is the item `thing:<id>` with who it is and its state.
   */
  takeable?: boolean;
  /** Character sheet for NPCs: the LLM plays this individual. */
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
  tiles?: Record<string, TerrainDef>;
  /** Roof of buildings (generator modules). */
  roof?: { color: string };
  /** What this world's common houses are like, when not the seed's cottages (ADR-0134). */
  commonHouse?: string;
  fragments?: RuneFragment[];
  /** Content packs (data modules). */
  items?: ItemDef[];
  recipes?: Recipe[];
  loot?: Record<string, LootTable>;
  layouts?: Record<string, EnvironmentDef>;
  /** An interface panel drawn by the kernel (slots, bars, texts, buttons); the module's Lua reacts. */
  ui?: UiPanel;
  /** Magic (data modules): runes by token, incantations by sequence of tokens. */
  runes?: Record<string, MagicRune>;
  spells?: Record<string, Spell>;
  /** Furniture and chests: a container filled from a loot table the first time it is opened. */
  container?: { size: number; loot: string };
  actions?: ActionDef[];
  /** Cases of a system (T27): small scenes the bench of the Sala sistemi runs with the real code. */
  cases?: BenchCase[];
}

/**
 * A case of a system (T27): a scene of 5 × 5 tiles around the wanderer, what happens in it, and what to watch.
 * The bench runs it in a kernel in miniature (only `core.*`, the content and this system): before, the rule, after.
 */
export interface BenchCase {
  title: string;
  /** The case in words: what the visitor sees happen. */
  story: string;
  /** Five rows of five terrain codes, the wanderer in the middle (default: the first walkable terrain). */
  terrain?: string[];
  /** The wanderer: components set before the case (e.g. {"needs": {"health": 50}}), what they carry. */
  wanderer?: { components?: Record<string, Record<string, unknown>>; items?: BenchItem[] };
  /** Entities of the scene, by module, in tiles from the wanderer. */
  entities?: Array<{ module: string; x: number; y: number; components?: Record<string, Record<string, unknown>> }>;
  /** What happens, in order: an object into a slot of the panel, out of it, a button, some time, a walk. */
  steps?: BenchStep[];
  /** Seconds the case lasts after its steps (at most 30). */
  duration: number;
  /** What changes: "component.field" of the wanderer, or "<n>:component.field" of the n-th entity (from 0). */
  watch: string[];
  /** The lines of logic.lua that matter (from 1), lit on the screen above the bench. */
  lines?: number[];
}

/** An object of a case: one of the universe (by name or id) or a trial one, only for the bench. */
export interface BenchItem {
  name: string;
  slot?: string;
  category?: string;
  bonus?: Record<string, number>;
}

export type BenchStep = { type: 'slot'; slot: string; item: string } | { type: 'remove'; slot: string } | { type: 'button'; action: string } | { type: 'wait'; seconds: number } | { type: 'walk'; toward: BenchWay; seconds: number };

/** Where the wanderer walks in a case (T27b): the world's directions, held like the keys. */
export type BenchWay = 'up' | 'down' | 'left' | 'right';

export interface ModuleEntry {
  manifest: Manifest;
  dir: string;
  manifestPath: string;
  logicPath?: string;
}

export interface AiConfig {
  textModel: string;
  /** Per-session call budget. */
  maxText: number;
  /** New modules the world may forge by itself per session (cartographer, combinations). */
  maxForges: number;
  /** New item packs the world writes by itself per session, as it is explored. */
  maxPacks?: number;
  /** New kinds of inhabitants the world forges by itself per session, so the same face is not everywhere. */
  maxCast?: number;
  /** The Sculptor's model per class and the Artist's (agents/sculptor.ts → DEFAULT_SCULPTORS). */
  sculptors?: Partial<import('./agents/sculptor').SculptorAiModels>;
  /** New models the Sculptor writes by itself per session. */
  maxModels?: number;
  /** Pieces the Musician writes by themselves in a session (T225; default 8). */
  maxPieces?: number;
  /** Reasoning effort of every call (default `low`: see docs/reports/costi-step8.2B.md). */
  thinking?: 'low' | 'medium' | 'high' | 'off';
  /** Seconds before a request is given up (and not repeated). */
  timeout?: number;
  /** New places a universe of many plans per minute, for everyone together (T40; default 20). */
  placesPerMinute?: number;
  /** Where the slow tasks of every agent run (T68, ADR-0077): `api` (default) or a subscription's CLI, `claude` (ADR-0106). */
  provider?: import('./ai/subscription').Provider;
  /** Agent id → provider, the exceptions to `provider`. Only in single play and development, never on the server of many. */
  agents?: Record<string, import('./ai/subscription').Provider>;
  /** How often every agent asks the model, 0-1 (T45b, ADR-0085): an object or a preset's name (`low detail`); repaired by the validator. */
  coefficients?: Partial<import('./coefficients').Coefficients> | string;
  /** Quality and spending minimums set by the master for multiplayer (T45d). */
  minimums?: AiMinimums;
  /** The Actor (T157, ADR-0116): who plays the people with the Narrator's sheets; off by default. A boolean, a model's name or an object; repaired by the validator. */
  actor?: Partial<import('./coefficients').ActorConfig> | boolean | string;
}

/** What the master sets before entering (T247, ADR-0133): every knob of the consumption, none of the providers'. */
export type AiSettings = Partial<Pick<AiConfig, 'textModel' | 'sculptors' | 'coefficients' | 'actor' | 'minimums' | 'maxText' | 'maxForges' | 'maxPacks' | 'maxCast' | 'maxModels' | 'maxPieces' | 'placesPerMinute' | 'thinking'>>;

/** Quality and spending minimums of an universe (T45d). */
export interface AiMinimums {
  /** Minimum text model (e.g. 'gemini-3.1-flash-lite'). */
  textModel?: string;
  /** Minimum sculptor models per class (e.g. { struttura: 'gemini-3.8-flash' }). */
  sculptors?: Partial<import('./agents/sculptor').SculptorAiModels>;
  /** Minimum credit spending ceiling (USD) to enter the world. */
  cap?: number;
  /** Minimum coefficient values. */
  coefficients?: Partial<import('./coefficients').Coefficients>;
}

export interface UniverseConfig {
  name: string;
  seed: number;
  theme: string;
  circleRadius: number;
  chunkSize: number;
  ai: AiConfig;
  /** Chosen before the Genesis, never changed after (ADR-0053). */
  game: GameSetup;
  /** The relief (ADR-0048): `mare` is the sea's level (T51a); without it, the one the relief gives. */
  relief?: { sea?: number };
  /** The heritage of clones (T45c, ADR-0084): what of every use of a cloned card goes back to who held it before. */
  heritage?: import('./heritage').HeritageConfig;
  /** The kernel that wrote it (T260, ADR-0136): `X.Y.Z`; a universe of another `X.Y` does not open here. */
  kernel?: string;
  /** The range of the kernels it runs on (T302, ADR-0152): `{ from: "X.Y", to?: "X.Y" }`, written by the kernel; without it, from `kernel`. */
  kernels?: { from: string; to?: string };
  /**
   * The choice of the cards to bring (T295, ADR-0170), open since the universe was born: `seed` (from the seed, until its Genesis) or
   * `clone` (until the first wanderer enters). Absent: closed, as in every universe made before it. The kernel closes it, the store opens it.
   */
  cardChoice?: CardChoice;
}

/** Where a universe that may still bring cards was born (T295). */
export type CardChoice = 'seed' | 'clone';

/** How the game is played in this universe: chosen before the Genesis, then fixed (ADR-0053). */
export interface GameSetup {
  mode: 'single' | 'multiplayer';
  /** How punishing death is: 0 (nothing is lost) to 4 (merciless). */
  death: number;
  /** Players may hurt each other (multiplayer). */
  pvp: boolean;
  /** «Altro…» on another player (multiplayer). */
  freeActionsBetweenPlayers: boolean;
  /** The master of a multiplayer game (T37): the wanderer who created it, `io` until accounts exist (T44). Never changes. */
  master?: string;
  /**
   * Who is charged for the match's calls (T372, ADR-0188), multiplayer only: absent (`shared`) each wanderer their own and the common
   * ones split among the connected (ADR-0081); `master` every call, of the world and of the wanderers, to the master. Unlike the rest of
   * the game it is the lobby's: the master sets it before entering, and it is fixed while a match is under way (ADR-0133).
   */
  expenses?: GameExpenses;
}

/** The expenses of the match (T372, ADR-0188): `shared` is what is absent, as before the choice existed. */
export type GameExpenses = 'shared' | 'master';

/** What the master sets in the lobby (T247, T372): the knobs of `universe.json → ai`, and of the game the expenses only. */
export type LobbySettings = AiSettings & { game?: { expenses?: GameExpenses } };

export interface ChunkInfo {
  name: string;
  description: string;
}

export interface GeneratedRune {
  line: string;
  col: number;
  row: number;
}
