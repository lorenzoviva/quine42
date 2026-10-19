// The model layer: the only place that talks to generative models. Agents (src/kernel/agents)
// build prompts on top of it; the kernel validates whatever comes back.

/** Gemini-style response schema (OpenAPI subset, uppercase types). Mock models ignore it. */
export type Schema = {
  type: 'OBJECT' | 'ARRAY' | 'STRING' | 'NUMBER' | 'INTEGER' | 'BOOLEAN';
  properties?: Record<string, Schema>;
  required?: string[];
  items?: Schema;
  enum?: string[];
  description?: string;
  nullable?: boolean;
};

export interface TextCall {
  agent: string;
  /** Stable task name ("chunk.plan", "forge.concept"…): routing for mocks, label for logs. */
  task: string;
  system: string;
  prompt: string;
  schema?: Schema;
  /** Data URLs (image/png, image/jpeg) the model should look at. */
  images?: string[];
  temperature?: number;
  /** Structured context, used by offline models instead of parsing the prompt. */
  data?: unknown;
}

export interface ImageCall {
  agent: string;
  task: string;
  prompt: string;
  images?: string[];
  data?: unknown;
}

export interface Usage {
  text: number;
  images: number;
  failures: number;
  inputTokens: number;
  outputTokens: number;
}

export interface Limits {
  text: number;
  images: number;
}

export interface Models {
  readonly name: string;
  /** Whether image() can return pictures (offline models cannot). */
  readonly canPaint: boolean;
  readonly usage: Usage;
  limits: Limits;
  text(call: TextCall): Promise<string>;
  image(call: ImageCall): Promise<string | null>;
}

export class BudgetError extends Error {
  constructor(kind: string) {
    super(`budget di sessione esaurito per ${kind}`);
  }
}

export const emptyUsage = (): Usage => ({ text: 0, images: 0, failures: 0, inputTokens: 0, outputTokens: 0 });

/** Parses a model's JSON answer, tolerating code fences and leading prose. */
export function parseJson<T>(text: string): T {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.search(/[[{]/);
  return JSON.parse(start > 0 ? body.slice(start) : body) as T;
}

export class Semaphore {
  private waiting: Array<() => void> = [];
  constructor(private free: number) {}
  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.free > 0) this.free--;
    else await new Promise<void>((r) => this.waiting.push(r));
    try {
      return await fn();
    } finally {
      const next = this.waiting.shift();
      if (next) next();
      else this.free++;
    }
  }
}
