// T398 (D57): lo Scultore delle strutture scelto alla Genesi e nella lobby, standard, performante o massimo, a elenco per via; pagato da chi paga
// la partita; fermo a partita in corso come le altre regolazioni; il varco ammette solo gli id dell'elenco e riscrive il tetto dei token.
import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { costOf, priceOf } from '../src/kernel/ai/prices';
import { OPENROUTER_MODELS, OpenRouterAiModels, openRouterBody, openRouterId } from '../src/kernel/ai/openrouter';
import { modelFor, repairSculptorTier, sculptorsOn, TIER_MODELS } from '../src/kernel/agents/sculptor';
import { hourlyEstimate, LOW_DETAIL, sculptorTiers, structureCost } from '../src/kernel/coefficients';
import { readConfig, repairAiSettings } from '../src/kernel/universe';
import { classOf } from '../src/mj/classes';
import { chatRequest } from '../server/openrouterProxy';

const OPUS = 'claude-opus-5-5';
const FABLE = 'claude-fable-5-1';
const structure = classOf('structure')!;
const req = { id: 'struttura-forte-huge', nome: 'forte', aspetto: 'un forte', classe: 'structure', taglia: 'huge' as const };

describe('i tre livelli dello Scultore delle strutture', () => {
  it('su OpenRouter: standard è T397, performante Opus da subito, massimo Fable 5.1; per le strutture e le importanti, il resto com’è', () => {
    const before = '2026-11-17';
    expect(sculptorsOn({}, 'openrouter', before, 'standard').structure).toBe('gemini-4-argon');
    for (const [tier, model] of [['strong', OPUS], ['max', FABLE]] as const) {
      const m = sculptorsOn({}, 'openrouter', before, tier);
      expect(m.structure, tier).toBe(model);
      expect(m.important, tier).toBe(model);
      expect(modelFor(req, structure, m, before)).toBe(model);
      expect(modelFor({ ...req, taglia: 'large' }, structure, m, before)).toBe(model);
      expect(m.figure).toBe('gemini-3.8-flash');
      expect(m.simple).toBe('gemini-3.1-flash-lite');
    }
    expect(sculptorsOn({}, 'openrouter', '2026-12-02', 'standard').structure).toBe(OPUS);
    expect(sculptorsOn({}, 'openrouter', '2026-12-02', 'max').structure).toBe(FABLE);
    // Un livello sopra standard è l'ultima parola del master sulle strutture: vince anche su un modello scelto per la classe.
    expect(sculptorsOn({ structure: 'gemini-3.8-flash' }, 'openrouter', before, 'strong').structure).toBe(OPUS);
  });

  it('sulla via di Google solo i Gemini: ogni livello scrive con Argon', () => {
    for (const tier of ['standard', 'strong', 'max'] as const) {
      for (const day of ['2026-11-17', '2026-12-02']) expect(sculptorsOn({}, 'google', day, tier)).toMatchObject({ structure: 'gemini-4-argon', important: 'gemini-4-argon' });
    }
  });

  it('i modelli dei livelli stanno nell’elenco dell’adattatore, col prezzo letto su OpenRouter', () => {
    for (const model of Object.values(TIER_MODELS)) expect(openRouterId(model), model).toBeDefined();
    expect(openRouterId(FABLE)).toBe('anthropic/claude-fable-5.1');
    expect(OPENROUTER_MODELS[FABLE]).toMatchObject({ snapshot: 'anthropic/claude-fable-5.1-20260831', temperature: false, cacheSystem: true, maxTokens: 32_000 });
    expect(priceOf(FABLE)).toMatchObject({ input: 10, output: 50, cached: 0.25 });
    expect(priceOf('anthropic/claude-fable-5.1')).toEqual(priceOf(FABLE));
    expect(costOf('anthropic/claude-fable-5.1', { prompt: 1e6, output: 1e6 })).toBeCloseTo(60, 9);
  });

  it('una parola che non è un livello è standard; dalla lobby passa solo uno dei tre, mai il nome di un modello', () => {
    expect(repairSculptorTier(undefined)).toBe('standard');
    expect(repairSculptorTier('claude-fable-5-1')).toBe('standard');
    expect(repairSculptorTier('max')).toBe('max');
    expect(repairAiSettings({ sculptorTier: 'max' }).settings.sculptorTier).toBe('max');
    const bad = repairAiSettings({ sculptorTier: 'anthropic/claude-fable-5.2' });
    expect(bad.settings).not.toHaveProperty('sculptorTier');
    expect(bad.riparati.join(' ')).toMatch(/Scultore delle strutture/);
    // Nemmeno come modello di una classe: Opus e Fable non sono tra i modelli della lobby.
    expect(repairAiSettings({ sculptors: { structure: FABLE } }).settings.sculptors).toBeUndefined();
    const json = (tier: unknown) => JSON.stringify({ name: 'u', ai: { textModel: 'gemini-3.1-flash-lite', sculptorTier: tier } });
    expect(readConfig({ 'universe.json': json('strong') }).config.ai.sculptorTier).toBe('strong');
    expect(readConfig({ 'universe.json': json('tutto') }).config.ai.sculptorTier).toBe('standard');
  });
});

describe('il costo per struttura e la stima oraria cambiano davanti a chi sceglie', () => {
  const ai = readConfig(bundledFiles).config.ai;
  const day = '2026-11-17';

  it('su OpenRouter ogni livello costa di più a struttura e all’ora; su Google costano uguale', () => {
    const or = sculptorTiers(ai, 'openrouter', day);
    expect(or.map((t) => t.model)).toEqual(['gemini-4-argon', OPUS, FABLE]);
    expect(or.map((t) => t.name)).toEqual(['standard', 'performante', 'massimo']);
    expect(or[0].perStructure).toBeLessThan(or[1].perStructure);
    expect(or[1].perStructure).toBeLessThan(or[2].perStructure);
    expect(or[1].perStructure).toBeCloseTo(structureCost(OPUS, day), 9);
    const hour = (tier: 'standard' | 'strong' | 'max', route: 'google' | 'openrouter') => hourlyEstimate({ ...ai, sculptorTier: tier }, day, { route }).dollari;
    expect(hour('standard', 'openrouter')).toBeLessThan(hour('strong', 'openrouter'));
    expect(hour('strong', 'openrouter')).toBeLessThan(hour('max', 'openrouter'));
    const google = sculptorTiers(ai, 'google', day);
    expect(new Set(google.map((t) => t.perStructure)).size).toBe(1);
    expect(hour('max', 'google')).toBeCloseTo(hour('standard', 'google'), 9);
  });

  it('una struttura di Fable costa sotto i 3 $ che l’autore ha messo in conto, una di Opus come il giro di T402', () => {
    expect(structureCost(OPUS, day)).toBeGreaterThan(0.4);
    expect(structureCost(OPUS, day)).toBeLessThan(1);
    expect(structureCost(FABLE, day)).toBeGreaterThan(1);
    expect(structureCost(FABLE, day)).toBeLessThan(3);
  });

  it('Low Detail col livello massimo conta Fable: il livello vince sulla classe', () => {
    const low = hourlyEstimate({ ...ai, ...LOW_DETAIL, sculptorTier: 'standard' } as typeof ai, day, { route: 'openrouter' }).dollari;
    const lowMax = hourlyEstimate({ ...ai, ...LOW_DETAIL, sculptorTier: 'max' } as typeof ai, day, { route: 'openrouter' }).dollari;
    expect(lowMax).toBeGreaterThan(low);
  });
});

describe('nel kernel: una regolazione come le altre', () => {
  const boot = (ai: Kernel['ai']) => Kernel.boot({ files: bundledFiles, store: memoryStore(), ai });
  const openRouter = () => new OpenRouterAiModels({ textModel: 'gemini-3.1-flash-lite', limits: { text: 0 }, fetchImpl: (async () => new Response('{}', { status: 500 })) as unknown as typeof fetch });

  it('la Genesi e la lobby la scrivono in universe.json → ai; lo Scultore del mondo la segue sulla sua via', async () => {
    const k = await boot(openRouter());
    expect(k.applySettings({ sculptorTier: 'max' }).ok).toBe(true);
    expect(JSON.parse(k.repo.working['universe.json']).ai.sculptorTier).toBe('max');
    expect(k.sculptors().structure).toBe(FABLE);
    expect(k.setAi({ sculptorTier: 'strong' })).toBe(true);
    expect(k.sculptors().structure).toBe(OPUS);
    const google = await boot(new MockAiModels());
    google.setAi({ sculptorTier: 'max' });
    expect(google.sculptors().structure).toBe('gemini-4-argon');
  });

  it('a partita in corso non cambia, nemmeno per il master', async () => {
    const k = await boot(openRouter());
    k.setAi({ sculptorTier: 'strong' });
    k.lockSettings();
    expect(k.applySettings({ sculptorTier: 'max' }).ok).toBe(false);
    expect(k.setAi({ sculptorTier: 'max' })).toBe(false);
    expect(k.sculptors().structure).toBe(OPUS);
  });
});

describe('il varco', () => {
  const CALL = { agent: 'sculptor', task: 'model.sculpt', system: 'Sei lo Scultore.', prompt: 'Un forte.' };

  it('ammette Fable 5.1 dell’elenco e nessun altro Fable', () => {
    const ok = chatRequest(JSON.stringify(openRouterBody(CALL, OPENROUTER_MODELS[FABLE], 'low')));
    expect(ok).toMatchObject({ model: 'anthropic/claude-fable-5.1' });
    for (const model of ['anthropic/claude-fable-5.2', 'anthropic/claude-fable-5.1:batch', '~anthropic/claude-fable-latest', 'anthropic/claude-fable-5', FABLE]) {
      expect(chatRequest(JSON.stringify({ model, messages: [{ role: 'user', content: 'x' }] })), model).toMatchObject({ status: 403 });
    }
  });

  it('riscrive il tetto dei token dei modelli che ne hanno uno: mai sopra, e c’è anche se il corpo non lo dice', () => {
    const sent = (body: object) => JSON.parse((chatRequest(JSON.stringify(body)) as { body: string }).body);
    const msg = [{ role: 'user', content: 'x' }];
    expect(sent({ model: 'anthropic/claude-fable-5.1', messages: msg, max_tokens: 128_000 }).max_tokens).toBe(32_000);
    expect(sent({ model: 'anthropic/claude-fable-5.1', messages: msg }).max_tokens).toBe(32_000);
    expect(sent({ model: 'anthropic/claude-fable-5.1', messages: msg, max_tokens: 'tanti' }).max_tokens).toBe(32_000);
    expect(sent({ model: 'anthropic/claude-opus-5.5', messages: msg, max_tokens: 4000 }).max_tokens).toBe(4000);
    // I modelli di Google restano come prima.
    expect(sent({ model: 'google/gemini-3.8-flash', messages: msg })).not.toHaveProperty('max_tokens');
  });
});
