// The players' keys of OpenRouter in a world of many (T363, ADR-0197): two wanderers with two keys, each paying their own calls, the commons by
// turns on the key of whoever has paid the least of them; the ledger as the register of the spending; a key that says 402 out of the turn and
// its owner on the local models, as with an empty balance. Fake OpenRouter: nothing leaves the machine.
import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { OpenRouterAiModels } from '../src/kernel/ai/openrouter';
import { BudgetError } from '../src/kernel/ai/models';
import { COMUNE } from '../src/kernel/cards';
import { OpenRouterGate } from '../server/openrouterProxy';
import { fakeLink } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { worldOf } from '../server/worldCalls';
import { walletFromKernel } from '../server/wallet';
import type { LobbySettings } from '../src/kernel/types';

const ANNA = 'sk-or-v1-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const BRUNO = 'sk-or-v1-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

/** OpenRouter as the gate sees it: which key every call came with, the cost it says. */
function fakeOpenRouter(costOf: (key: string | undefined, n: number) => number | 'exhausted' | 'revoked') {
  const keys: Array<string | undefined> = [];
  const impl = (async (_url: string, init: RequestInit) => {
    const key = (init.headers as Record<string, string>).Authorization?.replace(/^Bearer /, '');
    keys.push(key);
    const cost = costOf(key, keys.length);
    if (cost === 'exhausted') return new Response(JSON.stringify({ error: { message: 'insufficient credits' } }), { status: 402 });
    if (cost === 'revoked') return new Response(JSON.stringify({ error: { message: 'revoked' } }), { status: 401 });
    return new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: '{"ok":true}' } }], usage: { prompt_tokens: 100, completion_tokens: 10, cost } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as unknown as typeof fetch;
  return { keys, impl };
}

/** A world of many on the players' keys, as `openUniverse` wires it: the gate's door, the policy, who holds a key, the turn from the kernel. */
async function world(gate: OpenRouterGate, policy = { players: true, server: false }): Promise<{ k: Kernel; server: SessionServer }> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, game: { mode: 'multiplayer', death: 3 } }, null, 2) };
  const models = new OpenRouterAiModels({ fetchImpl: gate.direct(), endpoint: 'openrouter:', textModel: 'gemini-3.1-flash-lite', limits: { text: 100 } });
  const k = await Kernel.boot({ files, store: memoryStore(), ai: models, platformFee: 0 });
  k.setKeyPolicy(policy);
  k.setKeys(gate.holders());
  models.keyPayers = (chi) => k.keyPayersFor(chi);
  gate.onChange = (keys) => void worldOf(k).setKeys(keys);
  return { k, server: new SessionServer(k) };
}

async function enter(server: SessionServer, id: string, opts: { cap?: number; settings?: LobbySettings } = {}): Promise<SessionClient> {
  const { server: s, client: c } = fakeLink();
  server.connect(s);
  const session = new SessionClient(c, { id, ...opts });
  await session.ready;
  return session;
}

describe('le chiavi dei giocatori in un mondo di molti (T363, ADR-0197)', () => {
  it('ognuno paga le sue con la sua chiave; le comuni si alternano fra chi ha pagato meno; il ledger è il registro della spesa', async () => {
    const { keys, impl } = fakeOpenRouter(() => 0.01);
    const gate = new OpenRouterGate({ fetchImpl: impl });
    gate.setKey('anna', ANNA);
    gate.setKey('bruno', BRUNO);
    const { k, server } = await world(gate);
    expect(k.payWithKeys()).toBe(true);
    await enter(server, 'anna', { cap: 1 });
    await enter(server, 'bruno', { cap: 1 });
    // Nothing is prepaid: the balances stay at zero, yet both can call the models, with the ceiling they asked.
    expect(k.creditsOf('anna')).toBe(0);
    expect(k.hasCredits('anna')).toBe(true);
    expect(k.hasCredits('bruno')).toBe(true);
    expect(k.hasCredits(COMUNE)).toBe(true);
    expect(k.sessionCapOf('anna')).toBe(1);

    await k.council.write('narrator', 'npc.reply', 'Dimmi un segreto', { chi: 'anna' });
    await k.council.write('narrator', 'npc.reply', 'E a me?', { chi: 'bruno' });
    await k.council.write('narrator', 'npc.reply', 'Ancora', { chi: 'bruno' });
    expect(keys).toEqual([ANNA, BRUNO, BRUNO]);
    expect(k.ledger.spentOf('anna')).toEqual({ usd: 0.01, common: 0 });
    expect(k.ledger.spentOf('bruno')).toEqual({ usd: 0.02, common: 0 });

    // The commons, by turns: at par the ids' order, then whoever paid the least of them.
    for (let i = 0; i < 4; i++) await k.council.write('narrator', 'plot.weave', 'Una trama');
    expect(keys.slice(3)).toEqual([ANNA, BRUNO, ANNA, BRUNO]);
    expect(k.ledger.spentOf('anna')).toEqual({ usd: 0.03, common: 0.02 });
    expect(k.ledger.spentOf('bruno')).toEqual({ usd: 0.04, common: 0.02 });
    // Who asked stays who asked (rule 8i): the usage counts the commons as the world's.
    expect(k.usage.payers()[COMUNE].calls).toBe(4);
    expect(k.usage.payers().anna.calls).toBe(1);
    expect(k.usage.payers().bruno.calls).toBe(2);
    // The cards of the commons stay the world's: the payer `comune`, the holder drawn with the seed.
    expect(k.sign('plot:siccita', 'plot.weave', 'narrator').payer).toBe(COMUNE);
    expect(k.sign('item:lanterna', 'npc.reply', 'narrator', 'anna')).toMatchObject({ payer: 'anna', holder: 'anna' });
    // The ceiling of the session counts what the key spent.
    expect(k.sessionSpentOf('anna')).toBeCloseTo(0.03, 9);
    expect(k.sessionSpentOf('bruno')).toBeCloseTo(0.04, 9);
    // The wallet says nothing is prepaid, and what was spent.
    expect(walletFromKernel(k, 'prova', 'anna', 'locale').crediti).toBe(0);
  });

  it('una chiave che dice 402 esce dal turno e chi l’aveva passa ai modelli locali, avvisato; una revocata è dimenticata; una nuova rientra', async () => {
    const { keys, impl } = fakeOpenRouter((key, n) => (key === ANNA && n >= 3 ? 'exhausted' : key === BRUNO && n >= 6 ? 'revoked' : 0.01));
    const gate = new OpenRouterGate({ fetchImpl: impl });
    gate.setKey('anna', ANNA);
    gate.setKey('bruno', BRUNO);
    const { k, server } = await world(gate);
    const exhausted: string[] = [];
    k.bus.on('credits:exhausted', (e: { id: string }) => void exhausted.push(e.id));
    await enter(server, 'anna');
    await enter(server, 'bruno');
    await k.council.write('narrator', 'plot.weave', 'Una trama');
    await k.council.write('narrator', 'plot.weave', 'Una trama');
    expect(keys).toEqual([ANNA, BRUNO]);
    // Anna's key says 402 on the third call: hers is a common one, so bruno's pays it; from now on she is on the local models and hears it.
    await k.council.write('narrator', 'plot.weave', 'Una trama');
    expect(keys).toEqual([ANNA, BRUNO, ANNA, BRUNO]);
    expect(exhausted).toEqual(['anna']);
    expect(k.hasCredits('anna')).toBe(false);
    expect(k.holdsKey('anna')).toBe(false);
    expect(k.hasCredits('bruno')).toBe(true);
    expect(k.hasCredits(COMUNE)).toBe(true);
    expect(k.keyPayersFor(COMUNE)).toEqual(['bruno']);
    expect(k.keyPayersFor('anna')).toEqual([]);
    // Her own request goes to the local models now, without a call.
    await k.council.write('narrator', 'npc.reply', 'Dimmi', { chi: 'anna' });
    expect(keys).toHaveLength(4);
    // Bruno's key is revoked on his next call: forgotten, nobody can pay the commons, the local models answer.
    await k.council.write('narrator', 'npc.reply', 'Dimmi', { chi: 'bruno' });
    await expect(k.council.write('narrator', 'npc.reply', 'Dimmi', { chi: 'bruno' })).rejects.toBeInstanceOf(BudgetError);
    expect(exhausted).toEqual(['anna', 'bruno']);
    expect(k.hasCredits(COMUNE)).toBe(false);
    expect(gate.holders()).toEqual({ holders: [], exhausted: ['anna'] });
    // A new key of Anna's puts her back in.
    gate.setKey('anna', 'sk-or-v1-a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2');
    expect(k.hasCredits('anna')).toBe(true);
    expect(k.keyPayersFor(COMUNE)).toEqual(['anna']);
  });

  it('dove paga il master, la sua chiave paga per tutti; con la chiave di chi ospita le comuni non vanno a turno', async () => {
    const { keys, impl } = fakeOpenRouter(() => 0.01);
    const gate = new OpenRouterGate({ fetchImpl: impl });
    gate.setKey('me', ANNA);
    gate.setKey('bruno', BRUNO);
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, game: { mode: 'multiplayer', death: 3, expenses: 'master' } }, null, 2) };
    const models = new OpenRouterAiModels({ fetchImpl: gate.direct(), endpoint: 'openrouter:', textModel: 'gemini-3.1-flash-lite', limits: { text: 100 } });
    const k = await Kernel.boot({ files, store: memoryStore(), ai: models, platformFee: 0 });
    k.setKeyPolicy({ players: true, server: false });
    k.setKeys(gate.holders());
    models.keyPayers = (chi) => k.keyPayersFor(chi);
    const server = new SessionServer(k);
    await enter(server, 'me');
    await enter(server, 'bruno');
    await enter(server, 'carla');
    expect(k.masterPays()).toBe(true);
    expect(k.hasCredits('carla')).toBe(true);
    await k.council.write('narrator', 'npc.reply', 'Dimmi', { chi: 'carla' });
    await k.council.write('narrator', 'plot.weave', 'Una trama');
    expect(keys).toEqual([ANNA, ANNA]);
    expect(k.ledger.spentOf('me')).toEqual({ usd: 0.02, common: 0.01 });
    expect(Object.keys(k.usage.paidForOthers()).sort()).toEqual(['carla', COMUNE]);

    // The host's key (option C): the commons on it, never on a player's; a player's own calls on theirs.
    const hosted = new OpenRouterGate({ fetchImpl: impl, apiKey: 'sk-or-v1-ssssssssssssssssssssssssssssssss' });
    hosted.setKey('anna', ANNA);
    const w = await world(hosted, { players: true, server: true });
    await enter(w.server, 'anna');
    await enter(w.server, 'dario');
    expect(w.k.hasCredits(COMUNE)).toBe(true);
    expect(w.k.hasCredits('dario')).toBe(false);
    expect(w.k.keyPayersFor(COMUNE)).toEqual([]);
    await w.k.council.write('narrator', 'plot.weave', 'Una trama');
    await w.k.council.write('narrator', 'npc.reply', 'Dimmi', { chi: 'anna' });
    expect(keys.slice(2)).toEqual(['sk-or-v1-ssssssssssssssssssssssssssssssss', ANNA]);
    expect(w.k.ledger.spentOf('anna')).toEqual({ usd: 0.01, common: 0 });
  });

  it('senza le chiavi dei giocatori niente cambia: i crediti del ledger, le comuni divise', async () => {
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, game: { mode: 'multiplayer', death: 3 } }, null, 2) };
    const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels(), platformFee: 0 });
    expect(k.payWithKeys()).toBe(false);
    expect(k.keyPayersFor('anna')).toEqual([]);
    expect(k.keyPayersFor(COMUNE)).toEqual([]);
    k.setKeys({ holders: ['anna'], exhausted: [] });
    expect(k.hasCredits('anna')).toBe(false);
    k.giveCredits('anna', 1);
    expect(k.hasCredits('anna')).toBe(true);
    expect(k.sessionCapFor('anna', 5)).toBe(1);
  });
});
