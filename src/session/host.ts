// A universe of many on the server (T38, ADR-0058): its repository opened through the universe store, the
// kernel booted headless (as in the tests: no DOM, programs run inline), the Council straight on Gemini with no
// public route (`gemini`, from server/geminiProxy.ts; or the local models), and the world ticking at 60 Hz whether or not anyone is connected.
// It runs in the world's own process (src/session/worldProcess.ts, T127, ADR-0110), built with Vite so the kernel's imports work as in the browser.

import { Kernel } from '../kernel/kernel';
import { InlineRunner, type FormRequest, type FormResult, type FormRunner } from '../kernel/forms';
import { bundledFiles } from '../kernel/bundle';
import { memoryStore } from '../kernel/repo';
import { MockAiModels } from '../kernel/ai/mock';
import { GeminiAiModels } from '../kernel/ai/gemini';
import { JevDecisionModels } from '../kernel/ai/decisions';
import type { AiModels } from '../kernel/ai/models';
import type { Ledger } from '../kernel/credits';
import { readConfig } from '../kernel/universe';
import { INTERNAL_HEADER, prepareUniverse, UniverseChunks, UniverseClient } from '../kernel/universes';
import { BRANCH, SessionServer } from './server';
import type { Verifier } from './account';

const DT = 1 / 60;
/** At most this many ticks to catch up after a pause of the process: the world does not run ahead in bursts. */
const CATCH_UP = 5;
const BEAT_MS = 1000;

/**
 * The programs one for each turn of the event loop, not all those a tick asks for in a row: only the ticks' timer tells the watcher the world is
 * alive (ADR-0110), and it must find a way in between two programs. So a silence is at most one program (MAX_FORM_TIME), never the sum of a burst.
 * As with the browser's workers, a form may be pending across ticks.
 */
export class TurnRunner implements FormRunner {
  private last: Promise<unknown> = Promise.resolve();

  constructor(private inner: FormRunner = new InlineRunner()) {}

  run(q: FormRequest): Promise<FormResult> {
    const turn = this.last.then(() => new Promise<void>((r) => setImmediate(r))).then(() => this.inner.run(q));
    this.last = turn.catch(() => undefined);
    return turn;
  }

  /** Once all that was asked has run. */
  async idle(): Promise<void> {
    for (let seen; seen !== this.last; ) {
      seen = this.last;
      await seen;
    }
  }
}

export interface UniverseHost {
  name: string;
  session: SessionServer;
  /** Saves what it can and waits for the disk. */
  stop(): Promise<void>;
}

/** How long a world that stops waits for its commits to reach the disk. */
const FLUSH_MS = 2500;

/**
 * Opens a universe of many and starts its world. `base` is the address of this same server (the store is its HTTP
 * route); `gemini` is the `fetch` that spends the key, which stays in the server: without it, the local models. A universe that does not exist, or is a game alone, is not opened: alone the
 * kernel stays in the browser.
 */
export async function openUniverse(opts: { name: string; base: string; offline?: boolean; gemini?: typeof fetch; typesafe?: typeof fetch; verify?: Verifier; masterUid?: string; private?: boolean; token?: string; ledger?: Ledger; grantCap?: number; platformFee?: number; restore?: string; onBeat?: (tick: number) => void; wasmUri?: string }): Promise<UniverseHost | { error: string }> {
  // The world reads and writes its universe whole: the store knows it by a token good for this universe only (T120, ADR-0102, ADR-0110).
  const client = await UniverseClient.connect(opts.name, opts.base, opts.token ? { [INTERNAL_HEADER]: opts.token } : {});
  if (!client) return { error: 'nessun archivio degli universi' };
  // The world kept dying on what came after this commit: the universe goes back to it, with a commit that says so.
  if (opts.restore) await client.checkout(opts.restore).catch(() => null);
  const snap = await client.load();
  if (!snap.exists || !snap.files) return { error: `l'universo «${opts.name}» non esiste` };
  if (readConfig(snap.files).config.game?.mode !== 'multiplayer') return { error: `«${opts.name}» è una partita in singola` };
  // A universe of an older contract is ported first (T307a), then takes the seed: one commit says both.
  const up = prepareUniverse(snap.files, bundledFiles);
  if (Object.keys(up.changes).length) await client.commit(up.changes, `${up.applied.length ? `migrazione ${up.applied.map((a) => a.split(':')[0]).join(', ')}; ` : ''}aggiornamento dal kernel: ${up.updated.slice(0, 6).join(', ') || 'seme'}${up.updated.length > 6 ? '…' : ''}`, 'kernel');
  const ai = readConfig(up.files).config.ai;
  const models: AiModels = !opts.offline && opts.gemini
    ? new GeminiAiModels({ fetchImpl: opts.gemini, textModel: ai.textModel, limits: { text: ai.maxText }, thinking: ai.thinking, timeout: (ai.timeout ?? 120) * 1000 })
    : new MockAiModels();
  // The closed decisions (ADR-0157): Jev through the server's gate over the channel; without it the local models, which answer with the rule.
  const decisions = !opts.offline && opts.typesafe ? new JevDecisionModels({ fetchImpl: opts.typesafe, endpoint: 'typesafe:' }) : undefined;
  const runner = new TurnRunner();
  const kernel = await Kernel.boot({ files: up.files, store: memoryStore(), ai: models, decisions, forms: runner, chunks: new UniverseChunks(client), backend: client, past: snap.log ?? [], wasmUri: opts.wasmUri, ledger: opts.ledger, grantCap: opts.grantCap, platformFee: opts.platformFee });
  // Private or not, by value (ADR-0194): an anonymous guest is the master's to pay for only in a private universe (ADR-0188).
  kernel.privateWorld = opts.private === true;
  const session = new SessionServer(kernel, { verify: opts.verify, masterUid: opts.masterUid });
  // The master's branch waits on disk while the server is down (T42b).
  const branch = await client.readBranch(BRANCH).catch(() => null);
  if (branch) session.restoreBranch(branch);
  // What the boot asked for runs before the world says it is open: until then nobody is watching its silence, and the slowest programs (seconds each) are
  // those of the campus, here at every start because the cache of the forms starts empty with the process.
  await runner.idle();
  let last = performance.now();
  let owed = 0;
  let beat = 0;
  const timer = setInterval(() => {
    const now = performance.now();
    // From here, not from a timer of its own: the watcher hears that the ticks turn.
    if (now - beat >= BEAT_MS) {
      beat = now;
      opts.onBeat?.(kernel.ticks);
    }
    owed = Math.min(owed + (now - last) / 1000, CATCH_UP * DT);
    last = now;
    while (owed >= DT) {
      owed -= DT;
      try {
        session.tick(DT);
      } catch (e) {
        // The kernel is the floor (rule 7): what escapes it is logged, the world goes on.
        kernel.log('sessione', `tick fallito: ${(e as Error).message}`);
      }
    }
  }, 1000 * DT);
  return {
    name: opts.name,
    session,
    async stop() {
      clearInterval(timer);
      kernel.saveState();
      kernel.saveUsage();
      const until = performance.now() + FLUSH_MS;
      while (client.pending > 0 && performance.now() < until) await new Promise((r) => setTimeout(r, 25));
      client.close();
    },
  };
}
