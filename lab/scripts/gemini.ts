// Gemini for the lab's scripts: the kernel's GeminiModels sent straight to Google (scripts have no proxy),
// with the key from .env (never printed) and the kernel's usage ledger counting every call.

import fs from 'node:fs';
import path from 'node:path';
import { GeminiModels } from '../../src/kernel/ai/gemini';
import type { Thinking } from '../../src/kernel/ai/models';
import { UsageLedger } from '../../src/kernel/ai/usage';

/** The key in <root>/.env (a git worktree has none: pass the main checkout as root). */
export function readKey(root: string): string {
  let key: string | undefined;
  try {
    key = /^GEMINI_API_KEY\s*=\s*"?([^"\r\n]+)"?/m.exec(fs.readFileSync(path.join(root, '.env'), 'utf8'))?.[1]?.trim();
  } catch {
    key = undefined;
  }
  if (!key) throw new Error(`nessuna GEMINI_API_KEY in ${path.join(root, '.env')}`);
  return key;
}

export function direct(model: string, key: string, ledger: UsageLedger, opts: { thinking?: Thinking; timeout?: number; max?: number } = {}): GeminiModels {
  const g = new GeminiModels({
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    textModel: model,
    limits: { text: opts.max ?? 200 },
    thinking: opts.thinking ?? 'low',
    timeout: opts.timeout ?? 240_000,
    fetchImpl: (url, init) => fetch(url, { ...init, headers: { ...(init?.headers as Record<string, string>), 'x-goog-api-key': key } }),
  });
  g.onCall = (r) => ledger.record(r);
  return g;
}
