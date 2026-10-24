// A universe of many on the server (T38, ADR-0058): its repository opened through the universe store, the
// kernel booted headless (as in the tests: no DOM, programs run inline), the Council on Gemini through the
// proxy (or the local models), and the world ticking at 60 Hz whether or not anyone is connected.
// Loaded by server/session.ts through Vite (ssrLoadModule), so the kernel's imports work as in the browser.

import { Kernel } from '../kernel/kernel';
import { bundledFiles } from '../kernel/bundle';
import { memoryStore } from '../kernel/repo';
import { MockModels } from '../kernel/ai/mock';
import { GeminiModels } from '../kernel/ai/gemini';
import type { Models } from '../kernel/ai/models';
import { readConfig } from '../kernel/universe';
import { UniverseChunks, UniverseClient, upgradeFromSeed } from '../kernel/universes';
import { SessionServer } from './server';

const DT = 1 / 60;
/** At most this many ticks to catch up after a pause of the process: the world does not run ahead in bursts. */
const CATCH_UP = 5;

export interface UniverseHost {
  name: string;
  session: SessionServer;
  stop(): void;
}

/**
 * Opens a universe of many and starts its world. `base` is the address of this same server (the store and the
 * proxy are its HTTP routes). A universe that does not exist, or is a game alone, is not opened: alone the
 * kernel stays in the browser.
 */
export async function openUniverse(opts: { name: string; base: string; offline?: boolean }): Promise<UniverseHost | { error: string }> {
  const client = await UniverseClient.connect(opts.name, opts.base);
  if (!client) return { error: 'nessun archivio degli universi' };
  const snap = await client.load();
  if (!snap.exists || !snap.files) return { error: `l'universo «${opts.name}» non esiste` };
  if (readConfig(snap.files).config.partita?.modalita !== 'multigiocatore') return { error: `«${opts.name}» è una partita in singola` };
  const up = upgradeFromSeed(snap.files, bundledFiles);
  if (Object.keys(up.changes).length) await client.commit(up.changes, `aggiornamento dal kernel: ${up.updated.slice(0, 6).join(', ') || 'seme'}${up.updated.length > 6 ? '…' : ''}`, 'kernel');
  const ai = readConfig(up.files).config.ai;
  const endpoint = `${opts.base}/api/gemini`;
  const online = !opts.offline && (await GeminiModels.available(endpoint));
  const models: Models = online
    ? new GeminiModels({ endpoint, textModel: ai.textModel, limits: { text: ai.maxText }, thinking: ai.thinking, timeout: (ai.timeout ?? 120) * 1000 })
    : new MockModels();
  const kernel = await Kernel.boot({ files: up.files, store: memoryStore(), models, chunks: new UniverseChunks(client), backend: client, past: snap.log ?? [] });
  const session = new SessionServer(kernel);
  let last = performance.now();
  let owed = 0;
  const timer = setInterval(() => {
    const now = performance.now();
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
    stop() {
      clearInterval(timer);
      kernel.saveState();
      kernel.saveUsage();
    },
  };
}
