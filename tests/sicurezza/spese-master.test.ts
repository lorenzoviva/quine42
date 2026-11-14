// V-036 (T372, ADR-0188): where the master pays for the match, the payer is resolved by the match's policy in the kernel. Only the master
// says it, before the match, and nothing else moves it; the master's purse spends within their balance and their ceiling; who did not
// pay (an anonymous wanderer of a public universe) does not reach it; a clone does not inherit it; for whom the master paid stays theirs.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../../src/kernel/kernel';
import { bundledFiles } from '../../src/kernel/bundle';
import { memoryStore } from '../../src/kernel/repo';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { cloneChanges } from '../../src/kernel/clone';
import { fakeLink } from '../../src/session/protocol';
import { SessionServer } from '../../src/session/server';
import { SessionClient } from '../../src/session/client';
import { playerFiles, publicFiles } from '../../src/session/files';
import { walletFromKernel } from '../../server/wallet';
import type { TextCall } from '../../src/kernel/ai/models';
import type { CallRecord } from '../../src/kernel/ai/usage';
import type { LobbySettings } from '../../src/kernel/types';

class Tracking extends MockAiModels {
  online: string[] = [];
  async text(call: TextCall): Promise<string> {
    this.online.push(`${call.task}:${call.chi}`);
    return super.text(call);
  }
}

async function bootMany(game: Record<string, unknown> = {}, ai = new MockAiModels()): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, game: { mode: 'multiplayer', death: 3, ...game } }, null, 2) };
  return Kernel.boot({ files, store: memoryStore(), ai });
}

async function enter(server: SessionServer, id: string, opts: { cap?: number; settings?: LobbySettings } = {}): Promise<SessionClient> {
  const { server: s, client: c } = fakeLink();
  server.connect(s);
  const session = new SessionClient(c, { id, ...opts });
  await session.ready;
  return session;
}

const call = (who: string): CallRecord => ({ model: 'gemini-3.1-flash-lite', agent: 'narrator', task: 'npc.reply', prompt: 100_000, cached: 0, output: 0, thoughts: 0, who });

describe('V-036 il pagante risolto dalla politica della partita', () => {
  it('V-036 solo il master sceglie chi paga, e solo prima della partita: un giocatore, il Concilio, un universe.json riscritto non lo muovono', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    // A player who comes first, with the master's word in their settings, sets nothing.
    const anna = await enter(server, 'anna', { settings: { game: { expenses: 'master' } } });
    expect(anna.settingsAnswer?.ok).toBe(false);
    expect(k.masterPays()).toBe(false);
    // During the match, not even the master.
    expect(k.applySettings({ game: { expenses: 'master' } }).ok).toBe(false);
    expect(k.masterPays()).toBe(false);
    // A universe.json that says otherwise (the editor, a publication, a rollback) is written back.
    const cfg = JSON.parse(k.repo.working['universe.json']);
    k.repo.write('universe.json', JSON.stringify({ ...cfg, game: { ...cfg.game, expenses: 'master' } }));
    k.applyFiles({ ...k.repo.working });
    expect(k.masterPays()).toBe(false);
    expect(JSON.parse(k.repo.working['universe.json']).game.expenses).toBeUndefined();
  });

  it('V-036 la borsa del master spende entro il suo saldo e il suo tetto, per tutti', async () => {
    const k = await bootMany({ expenses: 'master' });
    k.giveCredits('me', 10);
    const server = new SessionServer(k);
    await enter(server, 'me', { cap: 0.03 });
    await enter(server, 'anna', { cap: 100 });
    k.ai.onCall!(call('anna'));
    k.ai.onCall!(call('anna'));
    expect(k.hasCredits('anna')).toBe(false);
    expect(k.creditsOf('me')).toBeGreaterThan(9.9);
  });

  it('V-036 un anonimo di un universo pubblico non arriva alla borsa del master', async () => {
    const ai = new Tracking();
    const k = await bootMany({ expenses: 'master' }, ai);
    k.giveCredits('me', 10);
    const server = new SessionServer(k);
    await enter(server, 'me');
    k.addWanderer('anon1', undefined, true);
    await enter(server, 'anon1');
    expect(k.hasCredits('anon1')).toBe(false);
    await k.council.write('narrator', 'npc.reply', 'Parlami', { chi: 'anon1' });
    expect(ai.online.filter((c) => c.endsWith(':anon1'))).toEqual([]);
    expect(k.creditsOf('me')).toBe(10);
  });

  it('V-036 un clone ha un altro master: non eredita chi paga', () => {
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, game: { mode: 'multiplayer', master: 'me', expenses: 'master' } }) };
    const { changes } = cloneChanges(files, { nome: 'copia', master: 'zed' });
    const game = JSON.parse(changes['universe.json']).game;
    expect(game.master).toBe('zed');
    expect(game.expenses).toBeUndefined();
  });

  it('V-036 per chi il master ha pagato resta del master: né i file dei giocatori né il portafoglio di un altro lo dicono', async () => {
    const k = await bootMany({ expenses: 'master' });
    k.giveCredits('me', 10);
    const server = new SessionServer(k);
    await enter(server, 'me');
    await enter(server, 'anna');
    await enter(server, 'bruno');
    k.ai.onCall!(call('anna'));
    k.ai.onCall!(call('bruno'));
    expect(JSON.parse(k.usage.toJson()).masterPaid).toBeTruthy();
    expect(playerFiles(k.files)['world/usage.json']).toBeUndefined();
    expect(publicFiles(k.files)['world/usage.json']).toBeUndefined();
    const hers = JSON.stringify(walletFromKernel(k, 'prova', 'anna', 'locale'));
    expect(hers).not.toContain('bruno');
    expect(hers).not.toContain('paidFor');
  });
});
