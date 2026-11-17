// T397 (D57, opzione 1): Opus 5.5 scrive le strutture quando il mondo va su OpenRouter, dall'1/12; sulla via di Google resta Argon.
// L'id fisso nell'elenco del varco, il prezzo letto su OpenRouter, il prompt di sistema in cache, la scelta per via e data, la stima oraria.
import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { Schema, TextCall } from '../src/kernel/ai/models';
import { costOf, DEAREST_MODEL, priceOf } from '../src/kernel/ai/prices';
import { OPENROUTER_MODELS, OpenRouterAiModels, openRouterBody, openRouterId } from '../src/kernel/ai/openrouter';
import { DEFAULT_SCULPTORS, modelFor, sculpt, sculptorsOn } from '../src/kernel/agents/sculptor';
import { hourlyEstimate, LOW_DETAIL } from '../src/kernel/coefficients';
import { readConfig } from '../src/kernel/universe';
import { classOf } from '../src/mj/classes';
import { chatRequest } from '../server/openrouterProxy';

const OPUS = 'claude-opus-5-5';
const CALL: TextCall = { agent: 'sculptor', task: 'model.sculpt', system: 'Sei lo Scultore.', prompt: 'Un forte.' };

describe('Opus 5.5 nell’elenco di OpenRouter', () => {
  it('ha un id fisso, il suo snapshot e il prezzo del listino di OpenRouter', () => {
    expect(openRouterId(OPUS)).toBe('anthropic/claude-opus-5.5');
    expect(OPENROUTER_MODELS[OPUS].snapshot).toBe('anthropic/claude-opus-5.5-20260921');
    expect(priceOf(OPUS)).toMatchObject({ input: 4, output: 20, cached: 0.2 });
    // Il registro scrive l'id di OpenRouter: lo stesso prezzo.
    expect(priceOf('anthropic/claude-opus-5.5')).toEqual(priceOf(OPUS));
    expect(costOf('anthropic/claude-opus-5.5', { prompt: 1e6, output: 1e6 })).toBeCloseTo(24, 9);
    // Un modello di Google fuori listino si conta ancora col più caro di Google, non con Opus.
    expect(DEAREST_MODEL.startsWith('gemini-')).toBe(true);
  });

  it('il corpo: il sistema in cache, niente temperatura, un tetto ai token, lo schema e il ragionamento basso', () => {
    const schema: Schema = { type: 'OBJECT', properties: { xml: { type: 'STRING' } }, required: ['xml'] };
    const body = openRouterBody({ ...CALL, schema, temperature: 0.7 }, OPENROUTER_MODELS[OPUS], 'low') as any;
    expect(body.model).toBe('anthropic/claude-opus-5.5');
    expect(body.messages[0]).toEqual({ role: 'system', content: [{ type: 'text', text: 'Sei lo Scultore.', cache_control: { type: 'ephemeral' } }] });
    expect(body.messages[1]).toEqual({ role: 'user', content: 'Un forte.' });
    expect(body).not.toHaveProperty('temperature');
    expect(body.max_tokens).toBe(32_000);
    expect(body.reasoning).toEqual({ effort: 'low', exclude: true });
    expect(body.response_format.json_schema.schema).toMatchObject({ type: 'object', required: ['xml'] });
    // I modelli di Google restano come prima: il sistema come testo, nessun tetto.
    const flash = openRouterBody(CALL, OPENROUTER_MODELS['gemini-3.8-flash'], 'low') as any;
    expect(flash.messages[0]).toEqual({ role: 'system', content: 'Sei lo Scultore.' });
    expect(flash).not.toHaveProperty('max_tokens');
  });

  it('il varco lo ammette e lascia passare il segno della cache; un altro modello di Anthropic no', () => {
    const body = JSON.stringify(openRouterBody(CALL, OPENROUTER_MODELS[OPUS], 'low'));
    const ok = chatRequest(body);
    expect(ok).toMatchObject({ model: 'anthropic/claude-opus-5.5' });
    const sent = JSON.parse((ok as { body: string }).body);
    expect(sent.messages[0].content[0].cache_control).toEqual({ type: 'ephemeral' });
    expect(sent.max_tokens).toBe(32_000);
    expect(sent.provider).toEqual({ require_parameters: true, data_collection: 'deny' });
    for (const model of ['anthropic/claude-opus-5', 'anthropic/claude-fable-5.2','anthropic/claude-opus-5.5:batch', 'claude-opus-5-5']) {
      expect(chatRequest(JSON.stringify({ model, messages: [{ role: 'user', content: 'x' }] })), model).toMatchObject({ status: 403 });
    }
  });
});

describe('lo Scultore delle strutture per via e per data', () => {
  const structure = classOf('structure')!;
  const req = { id: 'struttura-forte-huge', nome: 'forte', aspetto: 'un forte', classe: 'structure', taglia: 'huge' as const };

  it('su Google sempre Argon; su OpenRouter Argon fino al 30/11 e Opus dall’1/12, anche per le importanti', () => {
    for (const day of ['2026-11-16', '2026-12-01', '2027-03-01']) {
      const g = sculptorsOn({}, 'google', day);
      expect(modelFor(req, structure, g, day), day).toBe('gemini-4-argon');
      expect(modelFor({ ...req, taglia: 'large' }, structure, g, day), day).toBe('gemini-4-argon');
    }
    expect(modelFor(req, structure, sculptorsOn({}, 'openrouter', '2026-11-30'), '2026-11-30')).toBe('gemini-4-argon');
    const or = sculptorsOn({}, 'openrouter', '2026-12-01');
    expect(or.structure).toBe(OPUS);
    expect(or.important).toBe(OPUS);
    expect(modelFor(req, structure, or, '2026-12-01')).toBe(OPUS);
    expect(modelFor({ ...req, taglia: 'gargantuan' }, structure, or, '2026-12-01')).toBe(OPUS);
    // Figure, cose semplici, l'Artista e il Musicista non cambiano.
    for (const k of ['simple', 'figure', 'artist', 'musician'] as const) expect(or[k]).toBe(DEFAULT_SCULPTORS[k]);
  });

  it('ciò che il master ha scelto resta: Low Detail, un modello della lobby; Argon scritto dalla lobby è ancora il predefinito', () => {
    const low = sculptorsOn(LOW_DETAIL.sculptors, 'openrouter', '2026-12-02');
    expect(low.structure).toBe('gemini-3.1-flash-lite');
    expect(low.important).toBe('gemini-3.8-flash');
    expect(sculptorsOn({ structure: 'gemini-3.8-flash' }, 'openrouter', '2026-12-02')).toMatchObject({ structure: 'gemini-3.8-flash', important: OPUS });
    expect(sculptorsOn({ structure: 'gemini-4-argon', important: 'gemini-4-argon' }, 'openrouter', '2026-12-02')).toMatchObject({ structure: OPUS, important: OPUS });
  });

  it('sulla via di Google un modello che Google non ha torna al predefinito (un universe.json scritto a mano)', () => {
    expect(sculptorsOn({ structure: OPUS, important: OPUS }, 'google', '2026-12-02')).toMatchObject({ structure: 'gemini-4-argon', important: 'gemini-4-argon' });
  });

  it('il kernel sa la sua via: OpenRouter con l’adattatore, Google altrimenti', async () => {
    const boot = (ai: Kernel['ai']) => Kernel.boot({ files: bundledFiles, store: memoryStore(), ai });
    const offline = await boot(new MockAiModels());
    expect(offline.aiRoute()).toBe('google');
    expect(offline.sculptors().structure).toBe('gemini-4-argon');
    const or = await boot(new OpenRouterAiModels({ textModel: 'gemini-3.1-flash-lite', limits: { text: 0 }, fetchImpl: (async () => new Response('{}', { status: 500 })) as unknown as typeof fetch }));
    expect(or.aiRoute()).toBe('openrouter');
    const today = new Date().toISOString().slice(0, 10);
    expect(or.sculptors().structure).toBe(today >= '2026-12-01' ? OPUS : 'gemini-4-argon');
  });

  it('la struttura passa da OpenRouter con il modello di Opus e il prompt di sistema in cache', async () => {
    const asked: any[] = [];
    const offline = new MockAiModels();
    const fetchImpl = (async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      asked.push(body);
      const prompt = typeof body.messages[1].content === 'string' ? body.messages[1].content : body.messages[1].content[0].text;
      const text = await offline.text({ agent: body.model.startsWith('anthropic/') ? 'sculptor' : 'artist', task: body.model.startsWith('anthropic/') ? 'model.sculpt' : 'model.judge', prompt, system: '' });
      return new Response(JSON.stringify({ choices: [{ message: { content: text }, finish_reason: 'stop' }], usage: { prompt_tokens: 100, completion_tokens: 10, cost: 0.01 } }), { status: 200 });
    }) as unknown as typeof fetch;
    const models = new OpenRouterAiModels({ textModel: 'gemini-3.1-flash-lite', limits: { text: 50 }, fetchImpl });
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: models });
    await sculpt(k.council, req, sculptorsOn({}, 'openrouter', '2026-12-02'), { semplici: 1, revisione: false, giudizio: false });
    const sculptor = asked.filter((b) => b.model === 'anthropic/claude-opus-5.5');
    expect(sculptor.length).toBeGreaterThan(0);
    for (const b of sculptor) {
      expect(b.messages[0].content[0].cache_control).toEqual({ type: 'ephemeral' });
      expect(b).not.toHaveProperty('temperature');
    }
  });
});

describe('la stima oraria conta lo Scultore delle strutture della via', () => {
  const ai = readConfig(bundledFiles).config.ai;

  it('le strutture si contano col loro modello', () => {
    const argon = hourlyEstimate(ai, '2026-11-16');
    const lite = hourlyEstimate({ ...ai, sculptors: { structure: 'gemini-3.1-flash-lite', important: 'gemini-3.1-flash-lite' } }, '2026-11-16');
    expect(lite.dollari).toBeLessThan(argon.dollari);
  });

  it('prima dell’1/12 OpenRouter costa come Google; dopo, Opus costa quanto Argon col prezzo raddoppiato', () => {
    expect(hourlyEstimate(ai, '2026-11-16', { route: 'openrouter' }).dollari).toBeCloseTo(hourlyEstimate(ai, '2026-11-16').dollari, 9);
    const google = hourlyEstimate(ai, '2026-12-02');
    const or = hourlyEstimate(ai, '2026-12-02', { route: 'openrouter' });
    expect(or.dollari).toBeCloseTo(google.dollari, 9);
    expect(or.chiamate).toBe(google.chiamate);
  });
});
