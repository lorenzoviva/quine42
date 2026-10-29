import { describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { MockModels } from '../src/kernel/ai/mock';
import { costOf } from '../src/kernel/ai/prices';
import { providerFor, QueueModels, RoutedModels, slowTask, subscriptionsOf, usesSubscriptions } from '../src/kernel/ai/subscription';
import { UsageLedger, type CallRecord } from '../src/kernel/ai/usage';
import { answer, beat, checkRequest, enqueue, look, served, take, withdraw } from '../server/subscriptionQueue';
import type { Models, TextCall } from '../src/kernel/ai/models';

const dir = () => mkdtempSync(path.join(tmpdir(), 'coda-'));

/** A fetch that talks to the queue on disk as the Vite middleware does. */
function diskFetch(d: string): typeof fetch {
  return (async (url: string, init?: RequestInit) => {
    const json = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body }) as Response;
    const route = String(url).slice('/api/coda'.length).replace(/^\//, '');
    if (!route && init?.method === 'POST') {
      const raw = JSON.parse(String(init.body));
      const why = checkRequest(raw);
      return why ? json(400, { errore: why }) : json(200, { id: await enqueue(d, raw) });
    }
    if (route === 'stato') return json(200, { serviti: await served(d) });
    if (init?.method === 'DELETE') return (await withdraw(d, route), json(200, { ok: true }));
    return json(200, await look(d, route));
  }) as typeof fetch;
}

const call = (task: string, agent = 'scultore'): TextCall => ({ agent, task, system: 'sys', prompt: 'p', schema: { type: 'OBJECT' }, data: { x: 1 }, chi: 'io' });

describe('la tabella dei provider (T68)', () => {
  it('solo i compiti lenti vanno agli abbonamenti', () => {
    for (const t of ['genesis.bible', 'forge.code', 'model.sculpt', 'model.resculpt', 'council.session', 'mechanic.design']) expect(slowTask(t)).toBe(true);
    for (const t of ['npc.reply', 'chunk.plan', 'model.judge', 'action.judge', 'agent.chat']) expect(slowTask(t)).toBe(false);
  });

  it('ripara la tabella e sceglie per agente, col predefinito', () => {
    const s = subscriptionsOf({ provider: 'claude', agenti: { narratore: 'api', scultore: 'antigravity', fisico: 'openai' } });
    expect(s).toEqual({ provider: 'claude', agenti: { narratore: 'api', scultore: 'antigravity' } });
    expect(providerFor(s, 'scultore', 'model.sculpt')).toBe('antigravity');
    expect(providerFor(s, 'narratore', 'genesis.bible')).toBe('api');
    expect(providerFor(s, 'fisico', 'forge.physics')).toBe('claude');
    expect(providerFor(s, 'scultore', 'npc.reply')).toBe('api');
    expect(usesSubscriptions(subscriptionsOf({ provider: 'gemini', agenti: [] }))).toBe(false);
    expect(usesSubscriptions(subscriptionsOf(undefined))).toBe(false);
  });

  it('le chiamate degli abbonamenti costano zero dollari', () => {
    expect(costOf('abbonamento-claude', { prompt: 1000, output: 1000 })).toBe(0);
  });
});

describe('la coda su disco (T68)', () => {
  it('richiesta → presa → risposta, una volta sola', async () => {
    const d = dir();
    const id = await enqueue(d, { provider: 'claude', agent: 'scultore', task: 'model.sculpt', system: 's', prompt: 'p' });
    expect(await look(d, id)).toEqual({ stato: 'in coda' });
    expect(await take(d, 'antigravity')).toBeUndefined();
    const req = await take(d, 'claude');
    expect(req?.id).toBe(id);
    expect(await take(d, 'claude')).toBeUndefined();
    expect(await look(d, id)).toEqual({ stato: 'in corso' });
    expect(await answer(d, id, { text: '<xml/>', usage: { prompt: 10, output: 5 } })).toBe(true);
    expect(await look(d, id)).toEqual({ stato: 'fatta', text: '<xml/>', usage: { prompt: 10, output: 5 } });
    expect((await look(d, id)).stato).toBe('fallita');
  });

  it('serve prima la più vecchia; una ritirata non ha più risposta', async () => {
    const d = dir();
    const a = await enqueue(d, { provider: 'claude', agent: 'a', task: 't', system: '', prompt: '1' }, new Date(1000));
    await enqueue(d, { provider: 'claude', agent: 'a', task: 't', system: '', prompt: '2' }, new Date(2000));
    expect((await take(d, 'claude'))?.id).toBe(a);
    await withdraw(d, a);
    expect(await answer(d, a, { text: 'tardi' })).toBe(false);
  });

  it('rifiuta ciò che non è una richiesta, e sa chi serve', async () => {
    expect(checkRequest({ provider: 'api', agent: 'a', task: 't', system: '', prompt: '' })).toMatch(/provider/);
    expect(checkRequest({ provider: 'claude', agent: 'a', task: 't', prompt: '' })).toMatch(/system/);
    const d = dir();
    expect(await served(d)).toEqual([]);
    await beat(d, 'claude', new Date());
    expect(await served(d)).toEqual(['claude']);
    expect(await served(d, new Date(Date.now() + 60_000))).toEqual([]);
  });
});

describe('QueueModels e RoutedModels (T68)', () => {
  it('manda la richiesta, aspetta la risposta e la conta nel registro', async () => {
    const d = dir();
    const records: CallRecord[] = [];
    const q = new QueueModels({ provider: 'claude', endpoint: '/api/coda', fetchImpl: diskFetch(d), poll: 5 });
    q.onCall = (r) => records.push(r);
    // The serving process (T68b), here by hand.
    const serve = (async () => {
      for (;;) {
        const r = await take(d, 'claude');
        if (r) {
          expect(r).toMatchObject({ agent: 'scultore', task: 'model.sculpt', system: 'sys', prompt: 'p', schema: { type: 'OBJECT' }, chi: 'io' });
          expect(r).not.toHaveProperty('data');
          return answer(d, r.id, { text: '{"ok":true}', usage: { prompt: 100, output: 20 } });
        }
        await new Promise((res) => setTimeout(res, 5));
      }
    })();
    expect(await q.text(call('model.sculpt'))).toBe('{"ok":true}');
    await serve;
    expect(records).toEqual([{ model: 'abbonamento-claude', agent: 'scultore', task: 'model.sculpt', prompt: 100, cached: 0, output: 20, thoughts: 0, chi: 'io' }]);
    const ledger = new UsageLedger();
    ledger.record(records[0]);
    expect(ledger.session.usd).toBe(0);
    expect(ledger.session.unpriced).toBe(0);
  });

  it('una risposta che non arriva in tempo non si ripete e viene ritirata', async () => {
    const d = dir();
    const q = new QueueModels({ provider: 'claude', fetchImpl: diskFetch(d), poll: 5, timeout: 30 });
    await expect(q.text(call('model.sculpt'))).rejects.toThrow(/tempo scaduto/);
    expect(q.usage.timeouts).toBe(1);
    expect(await take(d, 'claude')).toBeUndefined();
  });

  it('un errore della CLI torna come errore della chiamata', async () => {
    const d = dir();
    const q = new QueueModels({ provider: 'antigravity', fetchImpl: diskFetch(d), poll: 5 });
    const p = q.text(call('genesis.bible', 'narratore'));
    let r;
    while (!(r = await take(d, 'antigravity'))) await new Promise((res) => setTimeout(res, 5));
    await answer(d, r.id, { errore: 'limite raggiunto' });
    await expect(p).rejects.toThrow(/limite raggiunto/);
  });

  it('instrada i compiti lenti alla coda e il resto alle API; usage e limiti sono delle API', async () => {
    const d = dir();
    const api = new MockModels();
    const q = new QueueModels({ provider: 'claude', fetchImpl: diskFetch(d), poll: 5 });
    const m = new RoutedModels(api, subscriptionsOf({ provider: 'api', agenti: { scultore: 'claude' } }), { claude: q });
    expect(m.route(call('model.sculpt'))).toBe('claude');
    expect(m.route(call('model.judge', 'artista'))).toBe('api');
    expect(m.route(call('genesis.bible', 'narratore'))).toBe('api');
    // A provider of the table without its queue goes to the API.
    const none = new RoutedModels(api, subscriptionsOf({ provider: 'antigravity' }), { claude: q });
    expect(none.route(call('genesis.bible', 'narratore'))).toBe('api');
    m.limits = { text: 7 };
    expect(api.limits.text).toBe(7);
    expect(m.usage).toBe(api.usage);
    const seen: string[] = [];
    m.onCall = (r) => seen.push(r.model);
    expect(q.onCall).toBe((api as Models).onCall);
    expect(await QueueModels.available('claude', '/api/coda', diskFetch(d))).toBe(false);
    await beat(d, 'claude');
    expect(await QueueModels.available('claude', '/api/coda', diskFetch(d))).toBe(true);
    expect(seen).toEqual([]);
  });
});
