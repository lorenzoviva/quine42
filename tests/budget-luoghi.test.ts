// A place the budget stops (T457, ADR-0231): when the Cartographer cannot be asked (the session's text, the day's cap of the gate, a key
// without credit) the new place stays a draft, held, and nothing reaches the universe's repository; asked again when there is budget, the
// Cartographer plans it. Before, the kernel saved its fallback, «Terra senza nome» with a random environment, for ever (the first run of
// the beta: four of them in orichalcum, `dungeon` and `ruins` in a world of steam). Any other failure keeps the fallback as before.
import { describe, expect, it } from 'vitest';
import { BudgetError, type TextCall } from '../src/kernel/ai/models';
import { MockAiModels } from '../src/kernel/ai/mock';
import { bundledFiles } from '../src/kernel/bundle';
import { MemoryChunks, type ChunkRecord } from '../src/kernel/chunks';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import { OPEN_SEA } from '../src/kernel/islands';
import { develop, settle } from './world';

/** The store of the plans, counting what is written to it. */
class Counting extends MemoryChunks {
  saved: string[] = [];
  async save(key: string, record: ChunkRecord): Promise<void> {
    this.saved.push(key);
    return super.save(key, record);
  }
}

/** The local models, whose Cartographer answers as `refuse` says: a budget error, another error, or its plan. */
function models(refuse: { with?: () => Error }): { ai: MockAiModels; asked: () => number } {
  const ai = new MockAiModels();
  let asked = 0;
  const text = ai.text.bind(ai);
  ai.text = async (call: TextCall) => {
    if (call.task === 'chunk.plan') {
      asked++;
      if (refuse.with) throw refuse.with();
    }
    return text(call);
  };
  return { ai, asked: () => asked };
}

/** The seed's world, its first places planned by a Cartographer that answers; then `refuse` says what it answers. */
async function world() {
  const chunks = new Counting();
  const refuse: { with?: () => Error } = {};
  const m = models(refuse);
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: m.ai, chunks });
  await develop(k);
  chunks.saved = [];
  return { k, chunks, asked: m.asked, refuse };
}

const savedAt = (chunks: Counting, cx: number, cy: number) => chunks.saved.filter((key) => key.endsWith(`:${cx},${cy}`));

describe('il luogo che il budget ferma (T457)', () => {
  it('resta una bozza e non si salva; tornato il budget, lo pianifica il Cartografo', async () => {
    const { k, chunks, asked, refuse } = await world();
    refuse.with = () => new BudgetError('la spesa del giorno');
    const before = asked();
    // (5, 0) is land in the seed's world (open sea is the kernel's, without a call).
    expect(await k.planAhead(5, 0)).toBe('no');
    expect(asked()).toBe(before + 1);
    expect(k.chunks.get('5,0')?.stage).toBe('draft');
    expect(k.chunks.get('5,0')?.place).toBeUndefined();
    expect(savedAt(chunks, 5, 0)).toEqual([]);
    expect(k.budgetHeld()).toBe(true);

    // The budget is back: the Cartographer plans it, with its name.
    refuse.with = undefined;
    expect(await k.planAhead(5, 0)).toBe('nuovo');
    expect(asked()).toBe(before + 2);
    expect(k.chunks.get('5,0')?.place?.name).toBeTruthy();
    expect(k.chunks.get('5,0')?.place?.name).not.toBe('Terra senza nome');
    expect(savedAt(chunks, 5, 0)).toHaveLength(1);
  });

  it('i luoghi nuovi accanto al viandante aspettano BUDGET_RETRY secondi prima di chiedere di nuovo', async () => {
    const { k, chunks, asked, refuse } = await world();
    const planned = new Set([...k.chunks.values()].filter((ch) => ch.stage === 'planned').map((ch) => ch.key));
    refuse.with = () => new BudgetError('il testo');
    expect(await k.planAhead(-5, 0)).toBe('no');
    const after = asked();
    // Far from where the places were planned, drafts load around the wanderer: none is asked while the budget holds them.
    Object.assign(k.carpet()!, { ox: 4 * k.config.chunkSize, oy: 4 * k.config.chunkSize });
    for (let i = 0; i < 60; i++) {
      k.tick(1 / 60);
      await settle(5);
    }
    expect(asked()).toBe(after);
    expect([...k.chunks.values()].some((ch) => ch.stage === 'draft' && ch.held)).toBe(true);
    // What reaches the store meanwhile is only the places planned before (saved again as they unload) and the open sea, the kernel's
    // without a call: no new place of the Council, no fallback.
    for (const key of chunks.saved) {
      const at = key.slice(key.lastIndexOf(':') + 1);
      const name = (await chunks.load(key))?.plan.place.name;
      if (!planned.has(at)) expect(name).toBe(OPEN_SEA.it.name);
    }
  });

  it('un errore che non è di budget dà ancora il piano di ripiego del kernel, salvato', async () => {
    const { k, chunks, asked, refuse } = await world();
    refuse.with = () => new Error('risposta senza senso');
    const before = asked();
    expect(await k.planAhead(5, 0)).toBe('nuovo');
    expect(asked()).toBe(before + 3);
    expect(k.chunks.get('5,0')?.plan?.layout).toBeTruthy();
    expect(savedAt(chunks, 5, 0)).toHaveLength(1);
    expect(k.budgetHeld()).toBe(false);
  });
});
