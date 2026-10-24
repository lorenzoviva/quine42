import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { countItem } from '../src/kernel/inventory';
import { repairPartita } from '../src/kernel/validator';
import { DEFAULT_PARTITA } from '../src/kernel/partita';

/** Ticks until every loaded chunk has been planned. */
async function develop(k: Kernel) {
  for (let i = 0; i < 80; i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 25));
    if ([...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
  k.tick(1 / 60);
}

/** Offline models that remember every call. */
class Recording extends MockModels {
  calls: TextCall[] = [];
  async text(call: TextCall): Promise<string> {
    this.calls.push(call);
    return super.text(call);
  }
}

/** The seed universe with a game of its own. */
async function bootWith(partita: Record<string, unknown>) {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, partita }, null, 2) };
  const models = new Recording();
  const k = await Kernel.boot({ files, store: memoryStore(), models });
  await develop(k);
  return { k, models };
}

describe('the game chosen at the Genesis (T33)', () => {
  it('the validator mends any game: unknown mode, death out of range or in words, missing fields', () => {
    expect(repairPartita(undefined)).toEqual(DEFAULT_PARTITA);
    expect(repairPartita({ modalita: 'cooperativa', morte: 9, pvp: 'sì' })).toEqual({ ...DEFAULT_PARTITA, morte: 4, pvp: true });
    expect(repairPartita({ morte: -2.4, altroTraGiocatori: 'no' }).morte).toBe(0);
    expect(repairPartita({ morte: 'molto punitiva' }).morte).toBe(4);
    expect(repairPartita({ morte: 'poco punitiva' }).morte).toBe(1);
    expect(repairPartita({ morte: 'media' }).morte).toBe(2);
    expect(repairPartita({ modalita: 'multigiocatore', morte: 1.6 })).toMatchObject({ modalita: 'multigiocatore', morte: 2 });
    expect(repairPartita({ altroTraGiocatori: 'no' }).altroTraGiocatori).toBe(false);
  });

  it('two universes with different punishments: the Narrator is asked differently, and death costs differently', async () => {
    const mild = await bootWith({ morte: 0 });
    const hard = await bootWith({ morte: 3 });
    for (const { k } of [mild, hard]) {
      k.give('item.coltello', 1);
      k.playerPos().x += 2;
    }
    const where = [mild, hard].map(({ k }) => ({ ...k.playerPos() }));
    for (const { k } of [mild, hard]) k.die('ferite');
    expect(mild.k.dead && hard.k.dead).toBe(true);
    await Promise.all([mild.k.continueAfterDeath(), hard.k.continueAfterDeath()]);
    const asked = [mild, hard].map(({ models }) => models.calls.find((c) => c.task === 'player.death')!);
    expect(asked.every(Boolean)).toBe(true);
    // The punishment is a principle of the Council (system) and the heart of the task (prompt).
    expect(asked[0].system).toMatch(/La morte è nessuna \(0 su 4\)/);
    expect(asked[1].system).toMatch(/La morte è dura \(3 su 4\)/);
    expect(asked[0].prompt).not.toBe(asked[1].prompt);
    // Nothing lost, up where they fell; everything lost, back at the square.
    expect(countItem(mild.k.inventory(), 'item.coltello')).toBe(1);
    expect(mild.k.playerPos()).toMatchObject({ x: where[0].x, y: where[0].y });
    expect(countItem(hard.k.inventory(), 'item.coltello')).toBe(0);
    expect(hard.k.playerPos()).toMatchObject({ x: 0, y: 0 });
    for (const { k } of [mild, hard]) {
      expect(k.dead).toBe(false);
      expect(k.needs()!.health).toBeGreaterThan(50);
    }
  });

  it('the game goes with every request of who builds on it, not with the Sculptor', async () => {
    const { k, models } = await bootWith({ modalita: 'multigiocatore', morte: 4, pvp: true, altroTraGiocatori: false });
    expect(k.partita()).toEqual({ modalita: 'multigiocatore', morte: 4, pvp: true, altroTraGiocatori: false });
    k.die('fame');
    await k.continueAfterDeath();
    const narr = models.calls.find((c) => c.task === 'player.death')!;
    expect(narr.system).toMatch(/spietata/);
    expect(narr.system).toMatch(/possono ferirsi; «Altro…» non si fa su un altro viandante/);
    for (const a of ['arbitro', 'ingegnere', 'referente'] as const) expect(k.council.context(a)).toMatch(/## La partita/);
    for (const a of ['scultore', 'artista', 'cartografo', 'fisico'] as const) expect(k.council.context(a)).not.toMatch(/## La partita/);
  });

  it('after the Genesis the game never changes: a rewritten universe.json is written back', async () => {
    const { k } = await bootWith({ morte: 2 });
    const cfg = JSON.parse(k.repo.working['universe.json']);
    k.repo.write('universe.json', JSON.stringify({ ...cfg, circleRadius: cfg.circleRadius, partita: { ...cfg.partita, morte: 0, modalita: 'multigiocatore' } }));
    k.applyFiles({ ...k.repo.working });
    expect(k.partita()).toMatchObject({ morte: 2, modalita: 'singola' });
    expect(JSON.parse(k.repo.working['universe.json']).partita).toMatchObject({ morte: 2, modalita: 'singola' });
    expect(k.feed().some((e) => e.kind === 'scarta' && /si sceglie solo alla Genesi/.test(e.text))).toBe(true);
    // The rest of universe.json is the universe's to change.
    k.repo.write('universe.json', JSON.stringify({ ...cfg, ai: { ...cfg.ai, maxCast: 5 } }));
    k.applyFiles({ ...k.repo.working });
    expect(k.config.ai.maxCast).toBe(5);
    expect(k.partita().morte).toBe(2);
  });

  it('the Genesis chooses the game of a universe never generated, and only that one', async () => {
    const { k } = await bootWith({});
    expect(k.needsGenesis()).toBe(true);
    expect(await k.runGenesis('un regno di pastori', undefined, { morte: 1, modalita: 'multigiocatore', pvp: true })).toBe(true);
    expect(k.partita()).toMatchObject({ morte: 1, modalita: 'multigiocatore', pvp: true });
    expect(JSON.parse(k.repo.head().files['universe.json']).partita).toMatchObject({ morte: 1, pvp: true });
    // A second Genesis keeps it.
    expect(await k.runGenesis('un arcipelago', undefined, { morte: 4 })).toBe(true);
    expect(k.partita().morte).toBe(1);
  }, 60000);
});
