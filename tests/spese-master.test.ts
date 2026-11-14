// The master pays for the match (T372, ADR-0188): `game.expenses` from the lobby, the payer resolved in `charge`, the master's purse
// answering for everyone, the cards the master's, the wallet that says it. Who asked (`chi`) never changes (rule 8i).
import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { COMUNE } from '../src/kernel/cards';
import { repairGameSetup } from '../src/kernel/validator';
import { fakeLink } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { ThinClient } from '../src/session/thin';
import { playerFiles } from '../src/session/files';
import { linesOf, walletFromKernel } from '../server/wallet';
import { walletNote } from '../site/pagamenti';
import type { TextCall } from '../src/kernel/ai/models';
import type { CallRecord } from '../src/kernel/ai/usage';
import type { LobbySettings } from '../src/kernel/types';

const DT = 1 / 60;

class Tracking extends MockAiModels {
  online: string[] = [];
  async text(call: TextCall): Promise<string> {
    this.online.push(`${call.task}:${call.chi}`);
    return super.text(call);
  }
}

async function bootMany(ai = new MockAiModels(), game: Record<string, unknown> = {}): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, game: { mode: 'multiplayer', death: 3, ...game } }, null, 2) };
  return Kernel.boot({ files, store: memoryStore(), ai, platformFee: 0.01 });
}

async function thin(server: SessionServer, id: string, opts: { cap?: number; settings?: LobbySettings } = {}): Promise<ThinClient> {
  const { server: s, client: c } = fakeLink();
  server.connect(s);
  const session = new SessionClient(c, { id, ...opts });
  await session.ready;
  const k = await Kernel.boot({ files: session.files, store: memoryStore(), ai: new MockAiModels(), mirror: true });
  return new ThinClient(k, session);
}

function run(server: SessionServer, clients: ThinClient[], frames: number) {
  for (let i = 0; i < frames; i++) {
    for (const c of clients) {
      c.k.tick(DT);
      c.frame(DT);
    }
    server.tick(DT);
  }
}

/** $0.025 of cost on Flash-Lite (100k tokens in), $0.02525 with the fee. */
const call = (who: string, task = 'npc.reply', prompt = 100_000): CallRecord => ({ model: 'gemini-3.1-flash-lite', agent: 'narrator', task, prompt, cached: 0, output: 0, thoughts: 0, who });

describe('the master pays for the match (T372, ADR-0188)', () => {
  it('the master sets it in the lobby: written in universe.json → game, read by whoever enters, refused to the others and during the match', async () => {
    const k = await bootMany();
    expect(k.masterPays()).toBe(false);
    const server = new SessionServer(k);
    const master = await thin(server, 'me', { settings: { game: { expenses: 'master' } } });
    expect(master.session.settingsAnswer).toEqual({ ok: true });
    expect(k.masterPays()).toBe(true);
    expect(JSON.parse(k.repo.head().files['universe.json']).game.expenses).toBe('master');
    // Whoever enters reads it (GAME_FIELDS): the lobby and the site say who pays.
    const anna = await thin(server, 'anna', { settings: { game: { expenses: 'shared' } } });
    expect(anna.session.settingsAnswer?.ok).toBe(false);
    expect(JSON.parse(anna.session.files['universe.json']).game.expenses).toBe('master');
    expect(anna.k.masterPays()).toBe(true);
    expect(JSON.parse(playerFiles(k.files)['universe.json']).game.expenses).toBe('master');
    // During the match nobody changes it, the master neither; an edit of universe.json is written back.
    expect(k.applySettings({ game: { expenses: 'shared' } }).ok).toBe(false);
    expect(k.masterPays()).toBe(true);
    run(server, [master, anna], 4);
    expect(k.masterPays()).toBe(true);
  });

  it('two wanderers without credits play with the models while the master\'s balance goes down; who asked stays who asked', async () => {
    const ai = new Tracking();
    const k = await bootMany(ai, { expenses: 'master' });
    k.giveCredits('me', 10);
    const server = new SessionServer(k);
    const before = k.ai.limits!.text;
    const master = await thin(server, 'me', { cap: 5 });
    const budget = k.ai.limits!.text;
    expect(budget).toBeGreaterThan(before);
    // Their ceilings count for nothing: below the master's minimum they still enter, and they add nothing to the budgets.
    k.config.ai.minimums = { cap: 2 };
    const anna = await thin(server, 'anna', { cap: 0.5 });
    const bruno = await thin(server, 'bruno', { cap: 3 });
    run(server, [master, anna, bruno], 6);
    expect(server.connected().sort()).toEqual(['anna', 'bruno', 'me']);
    expect(k.ai.limits!.text).toBe(budget);
    expect(k.creditsOf('anna')).toBe(0);
    expect(k.creditsOf('bruno')).toBe(0);
    expect(k.hasCredits('anna')).toBe(true);
    expect(k.hasCredits('bruno')).toBe(true);

    // Their requests go to the models, asked as themselves.
    await k.council.write('narrator', 'npc.reply', 'Dimmi un segreto', { chi: 'anna' });
    await k.council.write('narrator', 'npc.reply', 'E a me?', { chi: 'bruno' });
    expect(ai.online.filter((c) => c.startsWith('npc.reply'))).toEqual(['npc.reply:anna', 'npc.reply:bruno']);

    // What they cost, and what the world asks, is the master's alone.
    k.ai.onCall!(call('anna'));
    k.ai.onCall!(call('bruno'));
    k.ai.onCall!(call(COMUNE, 'council.session', 1_000_000));
    expect(k.creditsOf('me')).toBeCloseTo(10 - 0.02525 * 2 - 0.2525, 6);
    expect(k.creditsOf('anna')).toBe(0);
    expect(k.creditsOf('bruno')).toBe(0);
    // The usage keeps who asked; the master's ledger keeps for whom they paid.
    expect(k.usage.payers().anna.calls).toBe(1);
    expect(k.usage.payers().me).toBeUndefined();
    expect(Object.keys(k.usage.paidForOthers()).sort()).toEqual(['anna', 'bruno', COMUNE]);

    // The cards are whoever pays: the master's (D54.1), a player's request and a common one alike.
    expect(k.sign('item:lanterna', 'npc.reply', 'narrator', 'anna')).toEqual({ author: 'narrator', payer: 'me', holder: 'me' });
    expect(k.sign('plot:siccita', 'plot.weave', 'narrator')).toMatchObject({ payer: 'me', holder: 'me' });

    // The wallets: the master's says for whom, a player's spending is not theirs.
    const mine = walletFromKernel(k, 'prova', 'me', 'locale');
    expect(mine).toMatchObject({ masterPays: true, master: true, consumi: [] });
    expect(mine.paidFor?.map((r) => [r.who, r.calls])).toEqual([
      ['anna', 1],
      ['bruno', 1],
      [COMUNE, 1],
    ]);
    expect(mine.paidForTotal).toBeCloseTo(0.02525 * 2 + 0.2525, 6);
    const hers = walletFromKernel(k, 'prova', 'anna', 'locale');
    expect(hers).toMatchObject({ masterPays: true, master: false, consumi: [], totaleConsumi: 0 });
    expect(hers.paidFor).toBeUndefined();
    expect(JSON.stringify(hers)).not.toContain('bruno');
    expect(walletNote(hers)).toContain('paga il master');
    expect(walletNote(mine)).toContain('paghi tu');
  });

  it('at zero balance, or at the master\'s ceiling, everyone goes to the local models and hears it', async () => {
    const ai = new Tracking();
    const k = await bootMany(ai, { expenses: 'master' });
    k.giveCredits('me', 0.04);
    const server = new SessionServer(k);
    // With accounts what the world asks needs someone to pay (V-023): here it is the master.
    k.commonNeedsPayer = true;
    const master = await thin(server, 'me', { cap: 10 });
    const anna = await thin(server, 'anna');
    const bruno = await thin(server, 'bruno');
    run(server, [master, anna, bruno], 6);
    expect(k.hasCredits(COMUNE)).toBe(true);

    k.ai.onCall!(call('anna'));
    expect(k.hasCredits('bruno')).toBe(true);
    k.ai.onCall!(call('bruno'));
    expect(k.creditsOf('me')).toBe(0);
    for (const id of ['me', 'anna', 'bruno', COMUNE]) expect(k.hasCredits(id)).toBe(false);

    ai.online = [];
    await k.council.write('narrator', 'npc.reply', 'Ancora?', { chi: 'anna' });
    await k.council.write('narrator', 'council.session', 'Il Concilio si riunisce', { chi: COMUNE });
    expect(ai.online.filter((c) => /^(npc\.reply|council\.session):/.test(c))).toEqual([]);
    expect(k.feed().some((f) => /I crediti di me sono esauriti: le richieste di tutti/.test(f.text))).toBe(true);

    run(server, [master, anna, bruno], 6);
    // Their ceiling is their balance (T120): the master hears both, the ceiling and the end of the credits, and so does everyone.
    const said = (c: ThinClient) => c.session.notices.filter((n) => n.type === 'credits').map((n) => n.text);
    for (const c of [anna, bruno]) expect(said(c).some((t) => /crediti del master.*esauriti/.test(t))).toBe(true);
    expect(said(master).some((t) => /I tuoi crediti sono esauriti: le richieste di tutti, che paghi tu/.test(t))).toBe(true);
  });

  it('the master\'s ceiling is everyone\'s', async () => {
    const k = await bootMany(new MockAiModels(), { expenses: 'master' });
    k.giveCredits('me', 10);
    k.giveCredits('anna', 10);
    const server = new SessionServer(k);
    const master = await thin(server, 'me', { cap: 0.05 });
    const anna = await thin(server, 'anna', { cap: 5 });
    run(server, [master, anna], 6);
    k.ai.onCall!(call('anna'));
    k.ai.onCall!(call('anna'));
    expect(k.creditsOf('me')).toBeGreaterThan(9.9);
    expect(k.creditsOf('anna')).toBe(10);
    expect(k.hasCredits('anna')).toBe(false);
    run(server, [master, anna], 6);
    expect(anna.session.notices.find((n) => n.type === 'credits')).toMatchObject({ reason: 'cap' });
  });

  it('an anonymous wanderer stays with the local models, unless the universe is private (D54.2)', async () => {
    const k = await bootMany(new MockAiModels(), { expenses: 'master' });
    k.giveCredits('me', 10);
    const server = new SessionServer(k);
    const master = await thin(server, 'me');
    k.addWanderer('anon1', undefined, true);
    const anon = await thin(server, 'anon1');
    run(server, [master, anon], 6);
    expect(k.hasCredits('anon1')).toBe(false);
    // The private universe (T366) says it by value: an invited guest is the master's to pay for.
    k.privateWorld = true;
    expect(k.hasCredits('anon1')).toBe(true);
    k.ai.onCall!(call('anon1'));
    expect(k.creditsOf('me')).toBeCloseTo(10 - 0.02525, 6);
  });

  it('shared, as before the choice: each their own, the common split; nothing paid for another', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const master = await thin(server, 'me');
    const anna = await thin(server, 'anna');
    run(server, [master, anna], 6);
    k.giveCredits('me', 10);
    k.giveCredits('anna', 10);
    k.ai.onCall!(call('anna'));
    k.ai.onCall!(call(COMUNE, 'council.session', 1_000_000));
    expect(k.creditsOf('anna')).toBeCloseTo(10 - 0.02525 - 0.12625, 6);
    expect(k.creditsOf('me')).toBeCloseTo(10 - 0.12625, 6);
    expect(k.usage.paidForOthers()).toEqual({});
    expect(JSON.parse(k.usage.toJson()).masterPaid).toBeUndefined();
    expect(k.sign('item:lanterna', 'npc.reply', 'narrator', 'anna')).toMatchObject({ payer: 'anna', holder: 'anna' });
    // The wallet of a running world reads the usage of the contract 0.4 (`payers`).
    expect(walletFromKernel(k, 'prova', 'anna', 'locale')).toMatchObject({ masterPays: false, master: false, consumi: [{ chiamate: 1 }] });
  });

  it('what is repaired: alone there is nobody to pay for, an unknown word changes nothing', async () => {
    expect(repairGameSetup({ mode: 'multiplayer', expenses: 'master' }).expenses).toBe('master');
    expect(repairGameSetup({ mode: 'multiplayer', expenses: 'tutti' }).expenses).toBeUndefined();
    expect(repairGameSetup({ mode: 'single', expenses: 'master' }).expenses).toBeUndefined();
    const k = await bootMany();
    const unknown = k.applySettings({ game: { expenses: 'tutti' } });
    expect(unknown.ok).toBe(true);
    expect(unknown.riparati?.some((r) => r.startsWith('spese della partita'))).toBe(true);
    expect(k.masterPays()).toBe(false);
    k.applySettings({ game: { expenses: 'master' } });
    expect(k.masterPays()).toBe(true);
    k.applySettings({ game: { expenses: 'shared' } });
    expect(k.masterPays()).toBe(false);
    expect(JSON.parse(k.repo.head().files['universe.json']).game.expenses).toBeUndefined();
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const alone = await Kernel.boot({ files: { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, game: { mode: 'single', death: 3 } }) }, store: memoryStore(), ai: new MockAiModels() });
    const said = alone.applySettings({ game: { expenses: 'master' } });
    expect(said.riparati?.some((r) => r.includes('da soli'))).toBe(true);
    expect(alone.masterPays()).toBe(false);
  });

  it('the wallet lines from the files: the master sees for whom they paid, a player only what was theirs', () => {
    const t = (calls: number, usd: number) => ({ calls, usd });
    const usage = JSON.stringify({
      payers: { '2026-11-13': { anna: t(3, 1), me: t(1, 0.5), comune: t(2, 2) }, '2026-11-14': { anna: t(2, 1) } },
      // On the 13th the match was shared until the master chose to pay: only two of Anna's three calls were theirs.
      masterPaid: { '2026-11-13': { anna: t(1, 0.25), comune: t(2, 2) }, '2026-11-14': { anna: t(2, 1) } },
    });
    const anna = linesOf([], usage, 'anna', true, 0);
    expect(anna.consumi).toEqual([{ giorno: '2026-11-13', chiamate: 2, usd: 0.75 }]);
    expect(anna.paidFor).toBeUndefined();
    const me = linesOf([], usage, 'me', true, 0, true);
    expect(me.consumi).toEqual([{ giorno: '2026-11-13', chiamate: 1, usd: 0.5 }]);
    expect(me.paidFor).toEqual([
      { day: '2026-11-14', who: 'anna', calls: 2, usd: 1 },
      { day: '2026-11-13', who: 'anna', calls: 1, usd: 0.25 },
      { day: '2026-11-13', who: 'comune', calls: 2, usd: 2 },
    ]);
    expect(me.paidForTotal).toBe(3.25);
  });
});
