// The server's own folders beside the universes (T308a): English since the contract 0.4 (ADR-0153, ADR-0159). A folder of before
// (`universes/.saldi/`) is moved to its new name (`.balances/`) the first time it is asked for, while it is still there: nothing it
// holds is lost, and from then on nothing reads two places. If the move cannot be made (another process holds it), the old one is
// used as it is, so a balance is never read from an empty folder. Their names start with a dot: no universe can be called that.

import fs from 'node:fs';
import path from 'node:path';

/** Every folder (or file) of the server beside the universes: its name, and the one it had until the contract 0.3. */
export const SERVER_FOLDERS = {
  /** Universes put aside, when one starts again from the seed (`universeStore.ts`). */
  trash: ['.trash', '.cestino'],
  /** Balances and payments, one file per universe (ADR-0104, `ledger.ts`). */
  balances: ['.balances', '.saldi'],
  /** The subscriptions' queue (ADR-0077, `subscriptionQueue.ts`). */
  queue: ['.queue', '.coda'],
  /** The worlds of many that are lit (ADR-0143, `generation.ts`). */
  running: ['.running', '.accesi'],
  /** The deferred generations: lock and progress (ADR-0143, `generation.ts`). */
  generation: ['.generation', '.generazione'],
  /** What the key spent today (ADR-0099, `geminiProxy.ts`). */
  geminiSpend: ['.gemini-spend.json', '.spesa-gemini.json'],
  /** The handmade cards, one file per account (ADR-0161, `handmade.ts`): born with the contract 0.4, it has no name of before. */
  handmade: ['.handmade'],
} as const satisfies Record<string, readonly [string, string?]>;

export type ServerFolder = keyof typeof SERVER_FOLDERS;

/** The name of a folder of the server, beside the universes. */
export const serverName = (f: ServerFolder): string => SERVER_FOLDERS[f][0];

const settled = new Set<string>();

/** The path of a folder of the server under `universesDir`: the old one moved there first, if it is still there and the new one is not; a folder without an old name is just where it is. */
export function serverPath(universesDir: string, f: ServerFolder): string {
  const [now, before] = SERVER_FOLDERS[f] as readonly [string, string?];
  const to = path.join(universesDir, now);
  if (settled.has(to) || !before) return to;
  const from = path.join(universesDir, before);
  try {
    if (!fs.existsSync(to) && fs.existsSync(from)) fs.renameSync(from, to);
  } catch {
    /* busy, or another process moved it first: see below */
  }
  if (fs.existsSync(to) || !fs.existsSync(from)) {
    settled.add(to);
    return to;
  }
  return from;
}
