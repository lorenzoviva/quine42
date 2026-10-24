// Shared kernel types. The manifest schema is the contract between the kernel and universe modules.

export type FileMap = Record<string, string>;

/** entity = NPCs and objects in the world; item = things that go in the inventory. */
export type ModuleKind = 'system' | 'entity' | 'item' | 'player' | 'generator' | 'data';

export interface Appearance {
  /** A sign for lists and the atlas, and the colour of its stand-in while it has no model. */
  glyph: string;
  color: string;
  /** How it looks, in words: what the Sculptor sculpts. */
  aspetto?: string;
  /** Its look: a program of the library (`models/<id>.xml`); without one, the generic model of its class. */
  model?: string;
  /** Asset class (src/mj/classes.ts): persona, animale, albero, mobile, edificio… */
  classe?: string;
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
  /** Colour of the ground. */
  color: string;
  solid: boolean;
  /** Walking speed multiplier on this tile (mud 0.6, road 1.1…). Default 1. */
  speed?: number;
  description?: string;
  /** How it is drawn and how paths are carved through it. Default ground (walkable) / rock (solid). */
  layer?: TileLayer;
  /** Indoor floor: buildings are indoor floor enclosed by walls; their roof hides them from outside. */
  indoor?: boolean;
  /** What stands on tiles of this terrain (trees on woods, boulders on rock): a program of `models/`. */
  model?: string;
  /** Actions learned on this kind of terrain ("Altro…" on a tile): effects at that place. */
  actions?: ActionDef[];
}

export const ITEM_CATEGORIES = ['cibo', 'bevanda', 'medicina', 'attrezzo', 'arma', 'materiale', 'luce', 'vestiario', 'contenitore', 'magia', 'varie'] as const;
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
  aspetto?: string;
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
  tipo: 'slot' | 'barra' | 'testo' | 'pulsante';
  /** Slot id, or the action a button sends to on_ui. */
  id?: string;
  etichetta?: string;
  /** Slot: what fits (item slot names, categories or tags: "testa", "vestiario", "arma"). */
  accetta?: string[];
  /** Bar/text: a field of a player component, "componente.campo" (e.g. "needs.health"). */
  campo?: string;
  max?: number;
  colore?: string;
}

export interface UiPanel {
  id: string;
  titolo: string;
  descrizione?: string;
  elementi: UiElement[];
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

/**
 * What can happen in the world, from a closed set: the Council chooses, the kernel validates,
 * core.effects (Lua) applies. Used by free actions ("Altro…"), learned actions and spells.
 */
export type Effect =
  | { tipo: 'messaggio'; testo: string }
  | { tipo: 'bisogni'; fame?: number; sete?: number; energia?: number; salute?: number }
  | { tipo: 'crea_oggetto'; oggetto: string; quantita?: number }
  | { tipo: 'consuma'; oggetto: string; quantita?: number }
  | { tipo: 'distruggi' }
  | { tipo: 'apri' }
  | { tipo: 'contenitore'; capienza?: number; bottino?: string }
  | { tipo: 'terreno'; a: string; da?: string; raggio?: number }
  | { tipo: 'fuoco'; raggio?: number; durata?: number }
  | { tipo: 'luce'; raggio?: number; durata?: number }
  | { tipo: 'scudo'; durata?: number }
  | { tipo: 'spingi'; forza?: number }
  | { tipo: 'evoca'; modulo: string }
  // Between people (only on someone): what they become to the wanderer, what they will remember, a birth.
  | { tipo: 'legame'; legame: string }
  | { tipo: 'ricordo'; testo: string; peso?: number }
  | { tipo: 'nascita'; nome?: string }
  // New mechanics: a state of the wanderer (on horseback, rowing, wearing a backpack…) that changes how
  // fast they go, how much they carry, how far they see; durata 0 = until taken off.
  | { tipo: 'stato'; nome: string; velocita?: number; peso?: number; luce?: number; durata?: number }
  | { tipo: 'togli_stato'; nome: string };

export const EFFECT_TYPES = ['messaggio', 'bisogni', 'crea_oggetto', 'consuma', 'distruggi', 'apri', 'contenitore', 'terreno', 'fuoco', 'luce', 'scudo', 'spingi', 'evoca', 'legame', 'ricordo', 'nascita', 'stato', 'togli_stato'] as const;

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
  roof?: { color: string };
  fragments?: RuneFragment[];
  /** Content packs (data modules). */
  items?: ItemDef[];
  recipes?: Recipe[];
  loot?: Record<string, LootTable>;
  layouts?: Record<string, LayoutDef>;
  /** An interface panel drawn by the kernel (slots, bars, texts, buttons); the module's Lua reacts. */
  ui?: UiPanel;
  /** Magic (data modules): runes by token, incantations by sequence of tokens. */
  runes?: Record<string, MagicRune>;
  spells?: Record<string, Spell>;
  /** Furniture and chests: a container filled from a loot table the first time it is opened. */
  container?: { size: number; loot: string };
  actions?: ActionDef[];
  /** Cases of a system (T27): small scenes the bench of the Sala sistemi runs with the real code. */
  casi?: BenchCase[];
}

/**
 * A case of a system (T27): a scene of 5 × 5 tiles around the wanderer, what happens in it, and what to watch.
 * The bench runs it in a kernel in miniature (only `core.*`, the content and this system): before, the rule, after.
 */
export interface BenchCase {
  titolo: string;
  /** The case in words: what the visitor sees happen. */
  racconto: string;
  /** Five rows of five terrain codes, the wanderer in the middle (default: the first walkable terrain). */
  terreno?: string[];
  /** The wanderer: components set before the case (e.g. {"needs": {"health": 50}}), what they carry. */
  viandante?: { componenti?: Record<string, Record<string, unknown>>; oggetti?: BenchItem[] };
  /** Things of the scene, by module, in tiles from the wanderer. */
  cose?: Array<{ modulo: string; x: number; y: number; componenti?: Record<string, Record<string, unknown>> }>;
  /** What happens, in order: an object into a slot of the panel, out of it, a button, some time, a walk. */
  passi?: BenchStep[];
  /** Seconds the case lasts after its steps (at most 30). */
  durata: number;
  /** What changes: "component.field" of the wanderer, or "<n>:component.field" of the n-th thing (from 0). */
  guarda: string[];
  /** The lines of logic.lua that matter (from 1), lit on the screen above the bench. */
  righe?: number[];
}

/** An object of a case: one of the universe (by name or id) or a trial one, only for the bench. */
export interface BenchItem {
  nome: string;
  posto?: string;
  categoria?: string;
  bonus?: Record<string, number>;
}

export type BenchStep = { tipo: 'slot'; slot: string; oggetto: string } | { tipo: 'togli'; slot: string } | { tipo: 'pulsante'; azione: string } | { tipo: 'attendi'; secondi: number } | { tipo: 'cammina'; verso: BenchWay; secondi: number };

/** Where the wanderer walks in a case (T27b): the world's directions, held like the keys. */
export type BenchWay = 'su' | 'giu' | 'sinistra' | 'destra';

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
  scultori?: Partial<import('./agents/sculptor').SculptorModels>;
  /** New models the Sculptor writes by itself per session. */
  maxModels?: number;
  /** Reasoning effort of every call (default `low`: see docs/reports/costi-step8.2B.md). */
  thinking?: 'low' | 'medium' | 'high' | 'off';
  /** Seconds before a request is given up (and not repeated). */
  timeout?: number;
  /** New places a universe of many plans per minute, for everyone together (T40; default 20). */
  placesPerMinute?: number;
}

export interface UniverseConfig {
  name: string;
  seed: number;
  theme: string;
  circleRadius: number;
  chunkSize: number;
  ai: AiConfig;
  /** Chosen before the Genesis, never changed after (ADR-0053). */
  partita: Partita;
}

/** How the game is played in this universe: chosen before the Genesis, then fixed (ADR-0053). */
export interface Partita {
  modalita: 'singola' | 'multigiocatore';
  /** How punishing death is: 0 (nothing is lost) to 4 (merciless). */
  morte: number;
  /** Players may hurt each other (multiplayer). */
  pvp: boolean;
  /** «Altro…» on another player (multiplayer). */
  altroTraGiocatori: boolean;
  /** The master of a game of many (T37): the wanderer who created it, `io` until accounts exist (T44). Never changes. */
  master?: string;
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
