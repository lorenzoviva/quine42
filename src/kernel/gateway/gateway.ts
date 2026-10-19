// The AI gateway: the only door between the universe and generative models.
// Providers are swappable; whatever they return is untrusted and goes through the Validator.

import type { ChunkContent, FileMap, RuneFragment, TileDef } from '../types';

export interface ChunkRequest {
  cx: number;
  cy: number;
  seed: number;
  /** Retry counter: 0 on the first try, incremented after every rejected answer. */
  attempt: number;
  size: number;
  /** size*size tile codes, row-major. */
  tiles: string;
  palette: Record<string, TileDef>;
  catalog: RuneFragment[];
  theme: string;
  /** Generation prompt from the universe (prompts/chunk.md). */
  prompt: string;
  neighbors: string[];
}

export interface TextRequest {
  kind: 'talk' | 'read';
  /** Who speaks (manifest name). */
  speaker: string;
  persona: string;
  theme: string;
  prompt: string;
  seed: number;
  /** Free-form context: place, counters, measurements of the world... */
  context: Record<string, unknown>;
}

export interface ModuleRequest {
  prompt: string;
  theme: string;
  existingIds: string[];
  /** Instructions for module authoring (prompts/module.md). */
  instructions: string;
}

export interface ModuleResult {
  id: string;
  summary: string;
  files: FileMap;
}

export interface ImageRequest {
  /** Inpainting context: neighbouring chunk borders, place description, narrative. */
  prompt: string;
  cx: number;
  cy: number;
}

export interface AIProvider {
  readonly name: string;
  generateChunk(req: ChunkRequest): Promise<ChunkContent>;
  generateText(req: TextRequest): Promise<string>;
  generateModule(req: ModuleRequest): Promise<ModuleResult>;
  /** Not used yet: the first iteration renders glyphs. Returns a data URL or null. */
  generateImage(req: ImageRequest): Promise<string | null>;
}

export interface GatewayLogEntry {
  time: number;
  kind: string;
  summary: string;
  ok: boolean;
}

/** Wraps a provider with logging. Validation/retry policy is applied by the kernel. */
export class AIGateway {
  readonly log: GatewayLogEntry[] = [];
  onLog?: (e: GatewayLogEntry) => void;

  constructor(public provider: AIProvider) {}

  record(kind: string, summary: string, ok: boolean): void {
    const e = { time: Date.now(), kind, summary, ok };
    this.log.push(e);
    if (this.log.length > 300) this.log.shift();
    this.onLog?.(e);
  }

  async chunk(req: ChunkRequest): Promise<ChunkContent> {
    return this.provider.generateChunk(req);
  }

  async text(req: TextRequest): Promise<string> {
    const t = await this.provider.generateText(req);
    this.record('text', `${req.speaker}: ${t.slice(0, 60)}`, true);
    return t;
  }

  async module(req: ModuleRequest): Promise<ModuleResult> {
    return this.provider.generateModule(req);
  }
}
