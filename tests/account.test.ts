import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { fakeLink } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { accountWanderer, type Account, type Verifier } from '../src/session/account';
import { SOLO, validWandererId } from '../src/kernel/wanderers';
import { anonymousToken } from '../server/account';

// Accounts (T44b): the server verifies the client's token and the wanderer is the account's uid; an anonymous account
// plays with the local models, and linked to Google it keeps its wanderer. The verifier here is a fake one.

async function bootMany(): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, partita: { modalita: 'multigiocatore', morte: 3 } }, null, 2) };
  return Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
}

/** Tokens as a fake Firebase would sign them: `<uid>:<provider>`, and `scaduto` for one past its hour. */
const tokens = new Map<string, Account>();
const verify: Verifier = async (token) => tokens.get(token);
const GOOGLE = 'Kq3ZtV9xLmPa7RcYw2NbHs4UeJd1';
tokens.set('google', { uid: GOOGLE, anonimo: false, nome: 'Ilaria' });
tokens.set('anonimo', { uid: 'AnOn5tUvWxYz0aBcDeFgHiJkLm12', anonimo: true });
tokens.set('legato', { uid: 'AnOn5tUvWxYz0aBcDeFgHiJkLm12', anonimo: false, nome: 'Bruno' });
tokens.set('autore', { uid: 'AuThOr0000000000000000000001', anonimo: false });

async function enter(server: SessionServer, id: string, token?: string): Promise<SessionClient> {
  const { server: s, client: c } = fakeLink();
  server.connect(s);
  const session = new SessionClient(c, { id, ...(token ? { token } : {}) });
  await session.ready;
  return session;
}

describe('accounts (T44b)', () => {
  it('the wanderer of an account is its uid, as a valid id', () => {
    expect(accountWanderer(GOOGLE)).toBe(GOOGLE.toLowerCase());
    const long = accountWanderer('x'.repeat(60) + '|ÀÈ');
    expect(validWandererId(long)).toBe(true);
    expect(long).toBe(accountWanderer('x'.repeat(60) + '|ÀÈ'));
    expect(long).not.toBe(accountWanderer('x'.repeat(60) + '|ÀÉ'));
  });

  it('an anonymous account linked to Google is not anonymous, though its session still signs in as one', () => {
    expect(anonymousToken({ sign_in_provider: 'anonymous', identities: {} })).toBe(true);
    expect(anonymousToken({ sign_in_provider: 'anonymous', identities: { 'google.com': ['1'], email: ['a@b.c'] } })).toBe(false);
    expect(anonymousToken({ sign_in_provider: 'google.com', identities: { 'google.com': ['1'] } })).toBe(false);
    expect(anonymousToken(undefined)).toBe(false);
  });

  it('a valid token comes in as its account, whatever id the client says; an expired or missing one does not', async () => {
    const k = await bootMany();
    const server = new SessionServer(k, { verify });
    const ok = await enter(server, 'chiunque', 'google');
    expect(ok.refused).toBeUndefined();
    expect(ok.id).toBe(GOOGLE.toLowerCase());
    expect(ok.anonimo).toBe(false);
    expect(server.connected()).toEqual([GOOGLE.toLowerCase()]);
    expect(k.wanderers().find((w) => w.id === ok.id)?.nome).toBe('Ilaria');

    const old = await enter(server, 'chiunque', 'scaduto');
    expect(old.refused).toMatch(/scaduto/);
    const none = await enter(server, 'chiunque');
    expect(none.refused).toMatch(/account/);
    expect(server.connected()).toEqual([GOOGLE.toLowerCase()]);
  });

  it('without a verifier the id the client says goes, as before', async () => {
    const server = new SessionServer(await bootMany());
    const s = await enter(server, 'ila');
    expect(s.id).toBe('ila');
  });

  it('an anonymous account plays offline (0 credits); linked to Google it keeps its wanderer, profile and slots', async () => {
    class TrackingOnlineAiModels extends MockAiModels {
      calls: string[] = [];
      async text(call: TextCall): Promise<string> {
        this.calls.push(call.task);
        return super.text(call);
      }
    }
    const online = new TrackingOnlineAiModels();
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, partita: { modalita: 'multigiocatore', morte: 3 } }, null, 2) };
    const k = await Kernel.boot({ files, store: memoryStore(), ai: online });
    const server = new SessionServer(k, { verify });
    const anon = await enter(server, '', 'anonimo');
    const id = anon.id;
    expect(anon.anonimo).toBe(true);
    expect(server.isAnonymous(id)).toBe(true);
    expect(k.isAnonymous(id)).toBe(true);
    expect(k.creditsOf(id)).toBe(0);
    expect(k.hasCredits(id)).toBe(false);
    expect(k.giveCredits(id, 10)).toBe(false);

    // Personal call by anonymous wanderer uses local models (does not call online models)
    await k.council.write('narratore', 'npc.talk', 'Ciao', { chi: id });
    expect(online.calls).not.toContain('npc.talk');

    // Who they are and what they carry (T44a, T43c): kept by the server under the wanderer's id.
    k.setProfile(id, { nome: 'Nebbia', presentazione: 'Vengo dal mare.' });
    k.as(id, () => k.grantRunes(['luce']));
    const carried = JSON.stringify(k.as(id, () => k.inventory()));
    anon.leave();
    expect(server.connected()).toEqual([]);

    const linked = await enter(server, '', 'legato');
    expect(linked.id).toBe(id);
    expect(linked.anonimo).toBe(false);
    expect(server.isAnonymous(id)).toBe(false);
    expect(k.isAnonymous(id)).toBe(false);
    expect(linked.profilo?.nome).toBe('Nebbia');
    expect(JSON.stringify(k.as(id, () => k.inventory()))).toBe(carried);

    // Linked to Google: can receive credits and use online models
    expect(k.giveCredits(id, 10)).toBe(true);
    expect(k.creditsOf(id)).toBe(10);
    expect(k.hasCredits(id)).toBe(true);
    await k.council.write('narratore', 'npc.talk', 'Ciao da legato', { chi: id });
    expect(online.calls).toContain('npc.talk');
  });

  it("the server's own account is the master `io` of a universe made before accounts", async () => {
    const k = await bootMany();
    expect(k.gameSetup().master ?? SOLO).toBe(SOLO);
    const server = new SessionServer(k, { verify, masterUid: 'AuThOr0000000000000000000001' });
    const author = await enter(server, '', 'autore');
    expect(author.id).toBe(SOLO);
    expect(author.master).toBe(true);
    const other = await enter(server, SOLO, 'google');
    expect(other.id).toBe(GOOGLE.toLowerCase());
    expect(other.master).toBe(false);
  });
});
