// Shared kernel types. The manifest schema is the contract between the kernel and universe modules.

export type FileMap = Record<string, string>;

export type ModuleKind = 'system' | 'entity' | 'player' | 'generator' | 'data';

export interface Appearance {
  glyph: string;
  color: string;
  /** Prompt for the (future) image pipeline. */
  imagePrompt?: string;
}

export interface Physics {
  solid?: boolean;
  radius?: number;
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
  /** talk/read → text from the AI gateway; lua → module's on_interact(id) returns the text. */
  type: 'talk' | 'read' | 'lua';
  persona?: string;
}

export interface TileDef {
  glyph: string;
  color: string;
  bg: string;
  solid: boolean;
  name: string;
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

export interface UniverseConfig {
  name: string;
  seed: number;
  theme: string;
  circleRadius: number;
  chunkSize: number;
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

export interface ChunkContent {
  place: Place;
  runes: GeneratedRune[];
}
