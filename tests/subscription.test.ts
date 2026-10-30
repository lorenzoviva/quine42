import { describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { MockModels } from '../src/kernel/ai/mock';
import { costOf } from '../src/kernel/ai/prices';
import {
  describeQueue,
  describeQueueDetails,
  describeSubscriptions,
  providerFor,
  QueueModels,
  RoutedModels,
  slowTask,
  subscriptionsOf,
  usesSubscriptions,
} from '../src/kernel/ai/subscription';
import { UsageLedger, type CallRecord } from '../src/kernel/ai/usage';
import {
  answer,
  beat,
  checkRequest,
  enqueue,
  listInProgress,
  listWaiting,
  look,
  served,
  take,
  waiting,
  withdraw,
} from '../server/subscriptionQueue';
import type { Models, TextCall } from '../src/kernel/ai/models';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { FeedPanel } from '../src/ui/feed';

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
    if (route === 'stato') {
      const [serviti, inCoda, richieste, inEsecuzione] = await Promise.all([
        served(d),
        waiting(d),
        listWaiting(d),
        listInProgress(d),
      ]);
      return json(200, { serviti, inCoda, richieste, inEsecuzione });
    }
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

describe('stato della coda e formattazione abbonamenti (T68c)', () => {
  it('describeSubscriptions formatta provider predefinito ed eccezioni', () => {
    expect(describeSubscriptions(subscriptionsOf({ provider: 'api' }))).toBe('nessun abbonamento');
    expect(describeSubscriptions(subscriptionsOf({ provider: 'claude' }))).toBe('abbonamenti: claude (tutti gli agenti)');
    expect(describeSubscriptions(subscriptionsOf({ provider: 'claude', agenti: { scultore: 'antigravity' } }))).toBe(
      'abbonamenti: claude (altri agenti), antigravity (scultore)',
    );
    expect(
      describeSubscriptions(
        subscriptionsOf({ provider: 'claude', agenti: { scultore: 'antigravity', narratore: 'api' } }),
      ),
    ).toBe('abbonamenti: claude (altri agenti), antigravity (scultore), api (narratore)');
    expect(describeSubscriptions(subscriptionsOf({ provider: 'api', agenti: { scultore: 'claude' } }))).toBe(
      'abbonamenti: claude (scultore)',
    );
    expect(
      describeSubscriptions(
        subscriptionsOf({ provider: 'api', agenti: { scultore: 'claude', narratore: 'antigravity' } }),
      ),
    ).toBe('abbonamenti: claude (scultore), antigravity (narratore)');
  });

  it('describeQueue e describeQueueDetails formattano le richieste in attesa e in corso', () => {
    expect(describeQueue(undefined)).toBe('coda non disponibile');
    expect(describeQueue({ serviti: ['claude'], inCoda: 0 })).toBe('in coda: 0');
    expect(
      describeQueue({
        serviti: ['claude'],
        inCoda: 1,
        richieste: [{ id: '1', provider: 'claude', agent: 'scultore', task: 'model.sculpt' }],
      }),
    ).toBe('in coda: 1 (scultore: model.sculpt)');
    expect(
      describeQueue({
        serviti: ['claude'],
        inCoda: 0,
        inEsecuzione: [{ id: '1', provider: 'claude', agent: 'scultore', task: 'model.sculpt' }],
      }),
    ).toBe('in coda: 0 · in corso: scultore: model.sculpt');
    const details = describeQueueDetails({
      serviti: ['claude'],
      inCoda: 1,
      richieste: [{ id: '1', provider: 'claude', agent: 'scultore', task: 'model.sculpt' }],
      inEsecuzione: [{ id: '2', provider: 'claude', agent: 'narratore', task: 'genesis.bible' }],
    });
    expect(details).toContain('Richieste in coda (1):');
    expect(details).toContain('[claude] scultore (model.sculpt)');
    expect(details).toContain('In corso:');
    expect(details).toContain('[claude] narratore (genesis.bible)');
  });

  it('listWaiting e listInProgress tracciano lo stato della coda su disco e via queryState', async () => {
    const d = dir();
    const qStateInit = await QueueModels.queryState('/api/coda', diskFetch(d));
    expect(qStateInit?.inCoda).toBe(0);
    expect(qStateInit?.serviti).toEqual([]);

    const id = await enqueue(d, {
      provider: 'claude',
      agent: 'scultore',
      task: 'model.sculpt',
      system: 'sys',
      prompt: 'p',
    });
    expect(await waiting(d)).toBe(1);
    expect(await listWaiting(d)).toEqual([
      { id, provider: 'claude', agent: 'scultore', task: 'model.sculpt' },
    ]);
    expect(await listInProgress(d)).toEqual([]);

    const qStateWaiting = await QueueModels.queryState('/api/coda', diskFetch(d));
    expect(qStateWaiting?.inCoda).toBe(1);
    expect(qStateWaiting?.richieste).toHaveLength(1);

    const taken = await take(d, 'claude');
    expect(taken?.id).toBe(id);
    expect(await waiting(d)).toBe(0);
    expect(await listWaiting(d)).toEqual([]);
    expect(await listInProgress(d)).toEqual([
      { id, provider: 'claude', agent: 'scultore', task: 'model.sculpt' },
    ]);

    await answer(d, id, { text: 'ok' });
    expect(await listInProgress(d)).toEqual([]);
  });
});

describe('il pannello del Concilio e gli abbonamenti (T68c)', () => {
  function makeMockElement(tag: string): any {
    return {
      tagName: tag.toUpperCase(),
      className: '',
      textContent: '',
      title: '',
      hidden: false,
      children: [] as any[],
      classList: {
        toggle() {},
        add() {},
        remove() {},
      },
      setAttribute(k: string, v: string) {
        (this as any)[k] = v;
      },
      append(...nodes: any[]) {
        for (const n of nodes) {
          if (typeof n === 'string') this.children.push({ textContent: n });
          else this.children.push(n);
        }
      },
      remove() {},
      onclick: null,
    };
  }

  it('mostra abbonamenti e stato della coda nel pannello del Concilio con RoutedModels', async () => {
    const d = dir();
    await beat(d, 'claude');
    const q = new QueueModels({ provider: 'claude', fetchImpl: diskFetch(d), poll: 5 });
    const api = new MockModels();
    const table = subscriptionsOf({ provider: 'api', agenti: { scultore: 'claude' } });
    const models = new RoutedModels(api, table, { claude: q });
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models });

    const prevDoc = (globalThis as any).document;
    (globalThis as any).document = { createElement: makeMockElement };
    try {
      const host = makeMockElement('div');
      const panel = new FeedPanel(host, k);

      // Give async showSubs a tick
      await new Promise((r) => setTimeout(r, 20));

      const root = host.children[0];
      const subsEl = root.children.find((c: any) => c.className === 'subs');
      expect(subsEl).toBeDefined();
      expect(subsEl.hidden).toBe(false);
      expect(subsEl.textContent).toContain('abbonamenti: claude (scultore)');
      expect(subsEl.textContent).toContain('in coda: 0');

      panel.destroy();
    } finally {
      (globalThis as any).document = prevDoc;
    }
  });

  it('nasconde le indicazioni di abbonamento quando non si usano RoutedModels', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });

    const prevDoc = (globalThis as any).document;
    (globalThis as any).document = { createElement: makeMockElement };
    try {
      const host = makeMockElement('div');
      const panel = new FeedPanel(host, k);

      await new Promise((r) => setTimeout(r, 20));

      const root = host.children[0];
      const subsEl = root.children.find((c: any) => c.className === 'subs');
      expect(subsEl).toBeDefined();
      expect(subsEl.hidden).toBe(true);

      panel.destroy();
    } finally {
      (globalThis as any).document = prevDoc;
    }
  });
});

describe('Genesi offline con la coda servita da una CLI finta (T68c)', () => {
  it('esegue la Genesi instradando tutti i compiti lenti alla coda con esito positivo', async () => {
    const d = dir();
    await beat(d, 'claude');
    const q = new QueueModels({ provider: 'claude', fetchImpl: diskFetch(d), poll: 5, timeout: 10000 });
    const mock = new MockModels();
    const table = subscriptionsOf({ provider: 'claude', agenti: {} });
    const routed = new RoutedModels(mock, table, { claude: q });

    // CLI fake in background: serves requests from the queue
    let serving = true;
    const servedTasks: string[] = [];
    const fakeCliLoop = (async () => {
      while (serving) {
        const req = await take(d, 'claude');
        if (req) {
          servedTasks.push(req.task);
          const answerText = await mock.text({
            agent: req.agent,
            task: req.task,
            system: req.system,
            prompt: req.prompt,
            schema: req.schema as any,
          });
          await answer(d, req.id, {
            text: answerText,
            usage: { prompt: 150, output: 75 },
          });
        }
        await new Promise((r) => setTimeout(r, 5));
      }
    })();

    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models: routed });
    expect(k.needsGenesis()).toBe(true);

    const ok = await k.runGenesis('un regno di pastori sulle colline');
    serving = false;
    await fakeCliLoop;

    expect(ok).toBe(true);
    expect(k.needsGenesis()).toBe(false);

    // Verify tasks passed through the queue
    expect(servedTasks).toContain('genesis.bible');
    expect(servedTasks).toContain('genesis.style');
    expect(servedTasks).toContain('genesis.cast');

    // Token usage recorded for the subscription
    expect(q.usage.text).toBeGreaterThanOrEqual(3);
    expect(q.usage.inputTokens).toBeGreaterThan(0);
    expect(k.models.usage.text).toBeGreaterThanOrEqual(3);

    // The subscription calls cost zero USD in the session ledger
    expect(k.usage.session.usd).toBe(0);
  });
});
