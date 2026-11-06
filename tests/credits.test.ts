import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { COMUNE } from '../src/kernel/cards';
import { costWithFee, DEFAULT_PLATFORM_FEE, feePercent, splitCost } from '../src/kernel/credits';
import { platformFeeOf } from '../server/ledger';
import { paidCents } from '../server/stripe';
import { fakeLink } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { ThinClient } from '../src/session/thin';
import type { TextCall } from '../src/kernel/ai/models';

const DT = 1 / 60;

async function bootMany(platformFee?: number, more: Record<string, unknown> = {}): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = {
    ...bundledFiles,
    'universe.json': JSON.stringify({ ...cfg, ...more, partita: { modalita: 'multiplayer', morte: 3 } }, null, 2),
  };
  return Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels(), platformFee });
}

async function thin(server: SessionServer, id: string): Promise<ThinClient> {
  const { server: s, client: c } = fakeLink();
  server.connect(s);
  const session = new SessionClient(c, { id });
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

async function until<T>(server: SessionServer, clients: ThinClient[], p: Promise<T>): Promise<T> {
  let done = false;
  let out!: T;
  void p.then((v) => {
    done = true;
    out = v;
  });
  for (let i = 0; i < 400 && !done; i++) {
    run(server, clients, 2);
    await new Promise((r) => setTimeout(r, 0));
  }
  expect(done).toBe(true);
  return out;
}

describe('credits and common costs (T45a)', () => {
  it('platform fee (+1%) and cost splitting', () => {
    expect(costWithFee(10, DEFAULT_PLATFORM_FEE)).toBeCloseTo(10.1, 5);
    expect(costWithFee(0.25, DEFAULT_PLATFORM_FEE)).toBeCloseTo(0.2525, 5);

    const shares = splitCost(0.2525, 3);
    expect(shares).toHaveLength(3);
    const sum = shares.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(0.2525, 6);
    expect(shares[0]).toBeCloseTo(0.084167, 5);
  });

  it('the fee is the server\'s to say: 0 is a fee, what is not a fraction is the default (ADR-0132)', () => {
    expect(platformFeeOf({})).toBe(0.01);
    expect(platformFeeOf({ QUINE_COMMISSIONE: '0' })).toBe(0);
    expect(platformFeeOf({ QUINE_COMMISSIONE: ' 0.05 ' })).toBe(0.05);
    for (const bad of ['', '  ', 'tanti', '0,5', '-0.01', '1', '5', 'NaN', 'Infinity']) expect(platformFeeOf({ QUINE_COMMISSIONE: bad })).toBe(0.01);
    expect(feePercent(0.01)).toBe('1%');
    expect(feePercent(0.005)).toBe('0,5%');
  });

  it('prices are linear: no tiers on what is paid nor on what is spent', () => {
    for (const cents of [100, 500, 1000, 2000, 5000, 100000]) expect(paidCents({ amount_total: cents, currency: 'usd' })! / 100).toBe(cents / 100);
    for (const fee of [0, 0.01]) for (const base of [0.01, 1, 10, 100, 1000]) expect(costWithFee(base * 2, fee)).toBeCloseTo(costWithFee(base, fee) * 2, 5);
  });

  const COMMON_CALL = { model: 'gemini-3.1-flash-lite', agent: 'narrator', task: 'council.session', prompt: 1_000_000, cached: 0, output: 0, thoughts: 0, chi: COMUNE };

  it('with fee 0 a balance goes down by the base cost exactly: a personal call and a common one (ADR-0132)', async () => {
    const k = await bootMany(0);
    const server = new SessionServer(k);
    const a = await thin(server, 'io');
    const b = await thin(server, 'anna');
    run(server, [a, b], 6);
    k.giveCredits('io', 10);
    k.giveCredits('anna', 10);
    // $0.25 of cost, split in two.
    k.ai.onCall!(COMMON_CALL);
    expect(k.creditsOf('io')).toBe(9.875);
    expect(k.creditsOf('anna')).toBe(9.875);
    // $0.025, all Anna's.
    k.ai.onCall!({ ...COMMON_CALL, task: 'npc.reply', prompt: 100_000, chi: 'anna' });
    expect(k.creditsOf('anna')).toBe(9.85);
    expect(k.creditsOf('io')).toBe(9.875);
  });

  it('without a word from the server the fee stays 1%, and only the server can say otherwise (ADR-0132)', async () => {
    // Neither a field written in the universe: it is not read.
    const k = await bootMany(undefined, { commissione: 0, QUINE_COMMISSIONE: 0 });
    expect(k.platformFee).toBe(0.01);
    k.addWanderer('anna', 'Anna');
    k.giveCredits('anna', 10);
    k.ai.onCall!({ ...COMMON_CALL, prompt: 100_000, chi: 'anna' });
    expect(k.creditsOf('anna')).toBe(9.97475);
    // A kernel that is not a mirror takes it from nobody.
    k.showPlatformFee(0);
    expect(k.platformFee).toBe(0.01);
  });

  it('the master\'s mirror shows the fee the server decided, and a player\'s is not told (ADR-0132)', async () => {
    const k = await bootMany(0.02);
    const server = new SessionServer(k);
    const master = await thin(server, 'io');
    const anna = await thin(server, 'anna');
    expect(master.k.platformFee).toBe(0.02);
    expect(anna.session.commissione).toBeUndefined();
  });

  it('the balance is in the ledger, not in world/giocatori/<id>.json (ADR-0104)', async () => {
    const k = await bootMany();
    k.addWanderer('anna', 'Anna');
    expect(k.creditsOf('anna')).toBe(0);

    k.giveCredits('anna', 15.5);
    expect(k.creditsOf('anna')).toBe(15.5);

    const file = JSON.parse(k.files['world/giocatori/anna.json'] ?? '{}');
    expect(file.crediti).toBeUndefined();
    expect(k.ledger.balance('anna')).toBe(15.5);
  });

  it('the master gives credits by hand within the cap; the Referente never; players neither (ADR-0104)', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const master = await thin(server, 'io');
    const anna = await thin(server, 'anna');
    run(server, [master, anna], 6);

    // Initial credits
    expect(k.creditsOf('anna')).toBe(0);

    // By hand, from the console: through the server, which writes down who gave them
    expect(await until(server, [master, anna], master.k.grantCredits('anna', 2.5))).toEqual({ ok: true });
    expect(k.creditsOf('anna')).toBe(2.5);

    // What the Referente answers moves no money
    await until(server, [master, anna], master.k.talkToAgent('liaison', 'ricarica 5 crediti ad anna'));
    expect(k.creditsOf('anna')).toBe(2.5);

    // The day's cap holds, for every wanderer together, and says what is left
    const over = await until(server, [master, anna], master.k.grantCredits('io', 18));
    expect(over.ok).toBe(false);
    expect(over.motivo).toContain('17.5');
    expect(k.creditsOf('io')).toBe(0);

    // Not an unknown wanderer, not a strange amount
    for (const [id, n] of [['nessuno', 1], ['anna', -1], ['anna', Number.NaN], ['anna', Number.POSITIVE_INFINITY]] as const) {
      expect((await until(server, [master, anna], master.k.grantCredits(id, n))).ok).toBe(false);
    }

    // A player cannot, through the message or through the Referente
    const refused = await until(server, [master, anna], anna.session.act({ t: 'ricarica', viandante: 'anna', quanti: 1 }));
    expect(refused.ok).toBe(false);
    const talk = await until(server, [master, anna], anna.session.act({ t: 'agente', agente: 'liaison', testo: 'ricarica 10 crediti ad anna' }));
    expect(talk.ok).toBe(false);
    expect(k.creditsOf('anna')).toBe(2.5);
  });

  it('two players and master connected: common expense split in three (+1% fee)', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const master = await thin(server, 'io');
    const anna = await thin(server, 'anna');
    const bruno = await thin(server, 'bruno');
    run(server, [master, anna, bruno], 6);

    // Initial balances
    k.giveCredits('io', 10);
    k.giveCredits('anna', 10);
    k.giveCredits('bruno', 10);

    expect(server.connected().sort()).toEqual(['anna', 'bruno', 'io']);

    // Trigger a common model call: gemini-3.1-flash-lite prompt: 1_000_000 tokens
    // Base cost: $0.25. Total cost (+1%): 0.25 * 1.01 = 0.2525.
    // Split in three: each ~0.084167.
    k.ai.onCall!({
      model: 'gemini-3.1-flash-lite',
      agent: 'narrator',
      task: 'council.session',
      prompt: 1_000_000,
      cached: 0,
      output: 0,
      thoughts: 0,
      chi: COMUNE,
    });

    const expectedShare = 0.2525 / 3;
    expect(k.creditsOf('io')).toBeCloseTo(10 - expectedShare, 4);
    expect(k.creditsOf('anna')).toBeCloseTo(10 - expectedShare, 4);
    expect(k.creditsOf('bruno')).toBeCloseTo(10 - expectedShare, 4);

    const totalDeducted = (10 - k.creditsOf('io')) + (10 - k.creditsOf('anna')) + (10 - k.creditsOf('bruno'));
    expect(totalDeducted).toBeCloseTo(0.2525, 5);

    // Personal expense for anna:
    // prompt 100_000 tokens of gemini-3.1-flash-lite ($0.025) + 1% = $0.02525
    const annaBefore = k.creditsOf('anna');
    const ioBefore = k.creditsOf('io');
    const brunoBefore = k.creditsOf('bruno');

    k.ai.onCall!({
      model: 'gemini-3.1-flash-lite',
      agent: 'narrator',
      task: 'npc.reply',
      prompt: 100_000,
      cached: 0,
      output: 0,
      thoughts: 0,
      chi: 'anna',
    });

    expect(k.creditsOf('anna')).toBeCloseTo(annaBefore - 0.02525, 5);
    expect(k.creditsOf('io')).toBe(ioBefore);
    expect(k.creditsOf('bruno')).toBe(brunoBefore);
  });

  it('credits exhausted (crediti <= 0): wanderer requests served by local models and wanderer knows', async () => {
    class TrackingOnlineAiModels extends MockAiModels {
      onlineCalls: string[] = [];
      async text(call: TextCall): Promise<string> {
        this.onlineCalls.push(call.task);
        return super.text(call);
      }
    }

    const online = new TrackingOnlineAiModels();
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const files = {
      ...bundledFiles,
      'universe.json': JSON.stringify({ ...cfg, partita: { modalita: 'multiplayer', morte: 3 } }, null, 2),
    };
    const k = await Kernel.boot({ files, store: memoryStore(), ai: online });
    const server = new SessionServer(k);
    const master = await thin(server, 'io');
    const anna = await thin(server, 'anna');
    run(server, [master, anna], 6);

    // Anna has 0 credits initially
    expect(k.creditsOf('anna')).toBe(0);
    expect(k.hasCredits('anna')).toBe(false);

    // Anna asks Council a personal task
    const ans = await k.council.write('narrator', 'npc.reply', 'Dimmi un segreto', { chi: 'anna' });
    expect(ans).toBeTruthy();

    // Online models were NOT called because credits were exhausted!
    expect(online.onlineCalls).not.toContain('npc.reply');

    // Feed logs that credits are exhausted
    expect(
      k.feed().some((f) => f.kind === 'info' && f.text.includes('crediti di anna sono esauriti')),
    ).toBe(true);

    // Client anna receives crediti in updated state
    run(server, [master, anna], 6);
    expect(anna.k.creditsOf('anna')).toBe(0);

    // Once master gives credits to anna
    k.giveCredits('anna', 5);
    expect(k.hasCredits('anna')).toBe(true);

    await k.council.write('narrator', 'npc.reply', 'Un altro segreto', { chi: 'anna' });
    expect(online.onlineCalls).toContain('npc.reply');
  });

  it('anonymous wanderer (T44b) has 0 credits, cannot receive credits, always uses local models', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const master = await thin(server, 'io');
    // Being anonymous is the token's to say (T120): here the account's answer is taken as already heard.
    k.addWanderer('anon1', undefined, true);
    const anon = await thin(server, 'anon1');
    run(server, [master, anon], 6);

    expect(k.isAnonymous('anon1')).toBe(true);
    expect(k.creditsOf('anon1')).toBe(0);
    expect(k.hasCredits('anon1')).toBe(false);

    // Cannot receive credits
    expect(k.giveCredits('anon1', 10)).toBe(false);
    expect(k.creditsOf('anon1')).toBe(0);

    // Common expenses are split among eligible non-anonymous wanderers only
    k.giveCredits('io', 10);
    k.ai.onCall!({
      model: 'gemini-3.1-flash-lite',
      agent: 'narrator',
      task: 'council.session',
      prompt: 1_000_000,
      cached: 0,
      output: 0,
      thoughts: 0,
      chi: COMUNE,
    });

    // Entire common expense is paid by 'io' (the only non-anonymous connected wanderer)
    expect(k.creditsOf('io')).toBeCloseTo(10 - 0.2525, 4);
    expect(k.creditsOf('anon1')).toBe(0);
  });
});
