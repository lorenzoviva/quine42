// The spending declared (T496, D68.2a, D69.4): the lobby's estimate with the implicit cache Google really served and the ceiling of the new
// structures of T495, and in play the session's spending and its pace an hour, for the master and for whoever pays, out of the world.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CALL_TOKENS, callCost, hourlyEstimate, IMPLICIT_CACHE, IMPLICIT_CACHE_SHARE, implicitCacheShare, newStructuresCeiling, structureCost } from '../src/kernel/coefficients';
import { costOf } from '../src/kernel/ai/prices';
import { hourlyPace, PACE_SECONDS, readSpend, shownSpend, type CallRecord } from '../src/kernel/ai/usage';
import { NEW_STRUCTURES_PER_HOUR } from '../src/kernel/reuse';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { readConfig } from '../src/kernel/universe';
import { COMUNE } from '../src/kernel/cards';
import { fakeLink } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { ThinClient } from '../src/session/thin';
import { paceTag, spendLines } from '../src/ui/spend';

const DAY = '2026-11-22';

describe('la cache implicita misurata (D68.2a)', () => {
  it('ogni modello misurato ha la sua parte del prefisso, vicina a ciò che il registro della run ha servito', () => {
    const run = JSON.parse(readFileSync('lab/banco/run-1/cache.json', 'utf8')) as { models: Array<{ model: string; calls: number; ofPrefix: number }> };
    for (const m of run.models) {
      expect(IMPLICIT_CACHE[m.model], m.model).toBeDefined();
      // Argon and 3.8 Flash also take T473's bench (1-5 % and 16-18 % of the input), so within a tenth of the run alone.
      expect(Math.abs(implicitCacheShare(m.model) - m.ofPrefix), m.model).toBeLessThanOrEqual(0.1);
    }
    // Flash-Lite serves most of the prefix, Argon almost nothing, 3.5 Flash with the photo nothing; a model not measured the mixed share.
    expect(implicitCacheShare('gemini-3.1-flash-lite')).toBeGreaterThan(IMPLICIT_CACHE_SHARE);
    expect(implicitCacheShare('gemini-4-argon')).toBeLessThan(0.1);
    expect(implicitCacheShare('gemini-3.5-flash')).toBe(0);
    expect(implicitCacheShare('gemini-3.5-flash-lite')).toBe(IMPLICIT_CACHE_SHARE);
  });

  it('una struttura di Argon costa quasi l’ingresso pieno, un piano di Flash-Lite meno di quanto la stima diceva', () => {
    const w = CALL_TOKENS['model.sculpt'];
    const old = (model: string, task: string) => {
      const t = CALL_TOKENS[task];
      return costOf(model, { prompt: t.prompt, cached: Math.round(t.prefix * 0.6), output: t.output }, DAY) ?? 0;
    };
    expect(callCost('gemini-4-argon', 'model.sculpt', DAY)).toBeGreaterThan(old('gemini-4-argon', 'model.sculpt'));
    expect(callCost('gemini-3.1-flash-lite', 'chunk.plan', DAY)).toBeLessThan(old('gemini-3.1-flash-lite', 'chunk.plan'));
    const full = costOf('gemini-4-argon', { prompt: w.prompt, cached: 0, output: w.output }, DAY) ?? 0;
    expect(callCost('gemini-4-argon', 'model.sculpt', DAY)).toBeGreaterThan(full * 0.95);
    expect(structureCost('gemini-4-argon', DAY)).toBeGreaterThan(0);
  });
});

describe('la stima della lobby col tetto delle strutture nuove (T495)', () => {
  const ai = readConfig(bundledFiles).config.ai;
  const models = (n?: number) => hourlyEstimate({ ...ai, newStructuresPerHour: n }, DAY, { decisions: true }).righe.find((r) => r.voce === 'Modelli nuovi')!.dollari;

  it('il tetto della lobby è quello che il kernel legge: 2 se non detto, intero, mai sotto 0', () => {
    expect(newStructuresCeiling({})).toBe(NEW_STRUCTURES_PER_HOUR);
    expect(newStructuresCeiling({ newStructuresPerHour: 5.4 })).toBe(5);
    expect(newStructuresCeiling({ newStructuresPerHour: -1 })).toBe(NEW_STRUCTURES_PER_HOUR);
    expect(newStructuresCeiling({ newStructuresPerHour: Number.NaN })).toBe(NEW_STRUCTURES_PER_HOUR);
  });

  it('più strutture nuove all’ora costano di più, e il tetto a 2 non vale più di due strutture di Argon', () => {
    expect(models(0)).toBeLessThan(models(2));
    expect(models(2)).toBeLessThan(models(60));
    expect(models()).toBeCloseTo(models(2), 9);
    expect(models(2) - models(0)).toBeLessThanOrEqual(2 * structureCost('gemini-4-argon', DAY));
    // Without a ceiling in the way, what the walk sculpted when the kernel invites a new concept every ten plans, no more.
    expect(models(60)).toBeCloseTo(models(1000), 9);
  });
});

describe('il consumo in gioco (D69.4)', () => {
  it('la proiezione oraria dal registro: niente nei primi due minuti, poi i dollari sui secondi giocati', () => {
    expect(hourlyPace(0.2, PACE_SECONDS - 1)).toBeUndefined();
    expect(hourlyPace(0.5, 600)).toBeCloseTo(3, 9);
    expect(hourlyPace(Number.NaN, 600)).toBeUndefined();
    expect(hourlyPace(-1, 600)).toBe(0);
  });

  it('sul filo arrotondato, e letto senza fidarsi', () => {
    expect(shownSpend({ whose: 'world', session: 0.123456, hour: 3.14159 })).toEqual({ whose: 'world', session: 0.123, hour: 3.14 });
    expect(readSpend({ whose: 'mine', session: 0.5, hour: 'tanto', common: -2 })).toEqual({ whose: 'mine', session: 0.5 });
    expect(readSpend({ whose: 'tutti', session: 1 })).toBeUndefined();
    expect(readSpend({ whose: 'world' })).toBeUndefined();
    expect(readSpend(null)).toBeUndefined();
    expect(readSpend('world')).toBeUndefined();
  });

  /** $0.025 on Flash-Lite (100k tokens in). */
  const call = (who: string, task = 'npc.reply', prompt = 100_000): CallRecord => ({ model: 'gemini-3.1-flash-lite', agent: 'narrator', task, prompt, cached: 0, output: 0, thoughts: 0, who, day: DAY });

  it('da soli il consumo è quello del mondo, coi secondi che il kernel conta a ogni tick', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    for (let i = 0; i < 60; i++) k.tick(1 / 60);
    expect(k.usage.played).toBeCloseTo(1, 6);
    k.ai.onCall!(call('me'));
    k.ai.onCall!(call(COMUNE, 'chunk.plan'));
    const early = k.spendView();
    expect(early.whose).toBe('world');
    expect(early.session).toBeCloseTo(0.05, 6);
    expect(early.hour).toBeUndefined();
    k.usage.played = 600;
    expect(k.spendView().hour).toBeCloseTo(0.3, 6);
    const lines = spendLines(k.spendView(), { estimate: 3.5 });
    expect(lines[0]).toContain('$0.05');
    expect(lines[0]).toContain('$0.30 l’ora');
    expect(lines.join(' ')).toContain('stima della lobby');
    expect(paceTag(k.spendView())).toBe(' · $0.30/h');
    expect(spendLines({ whose: 'world', session: 0 }, { local: true }).join(' ')).toContain('modelli locali');
  }, 60_000);

  async function many(game: Record<string, unknown>) {
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, game: { mode: 'multiplayer', death: 3, master: 'me', ...game } }, null, 2) };
    const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    const server = new SessionServer(k);
    const join = async (id: string) => {
      const { server: s, client: c } = fakeLink();
      server.connect(s);
      const session = new SessionClient(c, { id });
      await session.ready;
      return new ThinClient(await Kernel.boot({ files: session.files, store: memoryStore(), ai: new MockAiModels(), mirror: true }), session);
    };
    const master = await join('me');
    const anna = await join('anna');
    const run = (frames: number) => {
      for (let i = 0; i < frames; i++) {
        for (const c of [master, anna]) {
          c.k.tick(1 / 60);
          c.frame(1 / 60);
        }
        server.tick(1 / 60);
      }
    };
    return { k, master, anna, run };
  }

  it('in molti il master vede il mondo, chi paga le sue richieste e le spese comuni; dove paga il master, glielo dice', async () => {
    const { k, master, anna, run } = await many({});
    k.ai.onCall!(call('anna'));
    k.ai.onCall!(call(COMUNE, 'chunk.plan'));
    k.usage.played = 600;
    run(30);
    expect(master.k.spendView()).toEqual({ whose: 'world', session: 0.05, hour: 0.3 });
    expect(anna.k.spendView()).toEqual({ whose: 'mine', session: 0.025, hour: 0.15, common: 0.025 });
    expect(spendLines(anna.k.spendView()).join(' ')).toContain('spese comuni');

    const paid = await many({ expenses: 'master' });
    paid.k.ai.onCall!(call('anna'));
    paid.k.usage.played = 600;
    paid.run(30);
    expect(paid.anna.k.spendView().whose).toBe('master');
    expect(spendLines(paid.anna.k.spendView())[0]).toContain('le paga il master');
    expect(paid.master.k.spendView().session).toBeCloseTo(0.025, 6);
  }, 60_000);
});
