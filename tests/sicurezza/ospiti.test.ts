// V-038 (T366, ADR-0194): the private universe and the invite verifier. A server without Firebase (`QUINE_ACCOUNT=inviti`) where the owner makes a
// universe private and invites two people: a third account is refused, an invite has one use, a guest taken out is gone (their identity too),
// the list and every read say nothing of a private universe to a stranger, the tokens are nowhere on the disk, the world never learns who the guests are.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { accountHandler, accountModeOf, accountSettings, type AccountSettings } from '../../server/account';
import { worldToken } from '../../server/access';
import { CAMPAIGN_LIMITS, CampaignArchive, inviteHash, letsIn, newInviteToken } from '../../server/campaign';
import { IdentityBook, INVITE_PREFIX, inviteVerifier, newInviteId, OWNER_ID, ownerIdentity, readIdentity, refusedUid, secretProblem, signIdentity } from '../../server/invites';
import { productionProblems } from '../../server/production';
import { activeHosts, attachSessions, expelFrom, wanderersIn } from '../../server/session';
import { universeHandler } from '../../server/universeStore';
import { wandererHandler } from '../../server/wanderer';
import { walletHandler } from '../../server/wallet';
import { INTERNAL_HEADER } from '../../src/kernel/universes';
import { accountWanderer } from '../../src/session/account';
import type { ServerMsg } from '../../src/session/protocol';

const SECRET = 'segreto-di-prova-lungo-abbastanza-per-firmare-0123';
const FAKE = path.resolve('tests/sicurezza/fixtures/mondo-finto.mjs');
const DAY = 86_400_000;

const until = async (what: () => unknown, ms = 10000, label = 'attesa') => {
  const end = Date.now() + ms;
  for (;;) {
    if (what()) return;
    if (Date.now() > end) throw new Error(`scaduta: ${label}`);
    await new Promise((r) => setTimeout(r, 20));
  }
};

/** A universe of many on the disk, with its master. */
function universe(dir: string, name: string, master: string) {
  const root = path.join(dir, name);
  mkdirSync(path.join(root, 'world'), { recursive: true });
  writeFileSync(path.join(root, 'universe.json'), JSON.stringify({ name, game: { mode: 'multiplayer', master } }));
  const git = (...a: string[]) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd: root, stdio: 'ignore', windowsHide: true });
  git('init', '-q');
  git('add', '-A');
  git('commit', '-q', '-m', 'nasce');
}

describe('V-038 il verificatore a inviti', () => {
  let dir: string;
  beforeAll(() => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'quine-inviti-'));
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }));

  it('V-038 un token vale solo firmato da questo segreto, prima della scadenza, per un id del verificatore', () => {
    const now = Date.now();
    const good = signIdentity(SECRET, 'inv-abc', now + DAY);
    expect(readIdentity(SECRET, good, now)).toEqual({ id: 'inv-abc', expires: now + DAY });
    expect(readIdentity(`${SECRET}x`, good, now)).toBeUndefined();
    expect(readIdentity(SECRET, good, now + 2 * DAY)).toBeUndefined();
    const [head, body, sig] = good.split('.');
    const other = Buffer.from(JSON.stringify({ id: 'inv-altro', exp: now + DAY })).toString('base64url');
    expect(readIdentity(SECRET, `${head}.${other}.${sig}`, now)).toBeUndefined();
    expect(readIdentity(SECRET, `${head}.${body}.${sig.slice(0, -2)}AA`, now)).toBeUndefined();
    // An id that is not the verifier's, even signed, is nobody: an uid of Firebase never comes from here.
    expect(readIdentity(SECRET, signIdentity(SECRET, 'abcdefuid', now + DAY), now)).toBeUndefined();
    for (const junk of ['', 'qid1..', 'x.y.z', 42, null, 'a'.repeat(600)]) expect(readIdentity(SECRET, junk, now)).toBeUndefined();
  });

  it('V-038 un id del verificatore non si scontra con un account: inv- è rifiutato da Firebase', () => {
    expect(newInviteId()).toMatch(/^inv-[a-z2-7]{16}$/);
    expect(refusedUid('INV-qualcosa')).toBe(true);
    expect(refusedUid('AbC123def456')).toBe(false);
    // Every account's wanderer is its uid made small, or `a` and a hash: never an `inv-` once Firebase refuses those uids.
    expect(accountWanderer('AbC123def456').startsWith(INVITE_PREFIX)).toBe(false);
  });

  it('V-038 il libro decide: un token firmato ma non nel libro, o revocato, non è nessuno; il rinnovo solo per chi è buono', async () => {
    const book = new IdentityBook(path.join(dir, 'libro.json'));
    const { verify, identities } = inviteVerifier(SECRET, book);
    const stray = signIdentity(SECRET, 'inv-mai-fatto', Date.now() + DAY);
    expect(await verify(stray)).toBeUndefined();
    const made = identities.mint('campagna');
    expect(await verify(made.token)).toEqual({ uid: made.id, anonymous: false });
    const renewed = identities.renew(made.token);
    expect(renewed && (await verify(renewed))?.uid).toBe(made.id);
    expect(identities.revoke(made.id)).toBe(true);
    expect(await verify(made.token)).toBeUndefined();
    expect(identities.renew(made.token)).toBeUndefined();
    // The book has ids, never a token or the secret.
    const text = readFileSync(book.file, 'utf8');
    expect(text).not.toContain(made.token);
    expect(text).not.toContain(SECRET);
  });

  it('V-038 un libro illeggibile non fa entrare nessuno', async () => {
    const book = new IdentityBook(path.join(dir, 'rotto.json'));
    const { verify, identities } = inviteVerifier(SECRET, book);
    const made = identities.mint('x');
    writeFileSync(book.file, '{ non è json');
    expect(await verify(made.token)).toBeUndefined();
  });

  it('V-038 il server di produzione: QUINE_ACCOUNT=inviti vuole il suo segreto, al posto di Firebase e mai con Firebase', () => {
    const base = { QUINE_ORIGINI: 'https://gioco.example', QUINE_PROXY_FIDATI: '0', QUINE_PAGAMENTI: 'spenti' };
    expect(productionProblems({ ...base, QUINE_ACCOUNT: 'inviti', QUINE_SEGRETO_INVITI: SECRET })).toEqual([]);
    expect(productionProblems({ ...base, QUINE_ACCOUNT: 'inviti' }).join(' ')).toMatch(/QUINE_SEGRETO_INVITI/);
    expect(productionProblems({ ...base, QUINE_ACCOUNT: 'inviti', QUINE_SEGRETO_INVITI: 'corto' }).join(' ')).toMatch(/troppo corto/);
    expect(productionProblems({ ...base, QUINE_ACCOUNT: 'inviti', QUINE_SEGRETO_INVITI: SECRET, FIREBASE_PROJECT_ID: 'p' }).join(' ')).toMatch(/un verificatore solo/);
    expect(productionProblems({ ...base, QUINE_ACCOUNT: 'tutti' }).join(' ')).toMatch(/QUINE_ACCOUNT/);
    // The secret's value is never in what is said.
    expect(productionProblems({ ...base, QUINE_ACCOUNT: 'inviti', QUINE_SEGRETO_INVITI: 'corto-segreto' }).join(' ')).not.toContain('corto-segreto');
    expect(accountModeOf({})).toBe('firebase');
    expect(secretProblem(undefined)).toBe('manca');
  });

  it('V-038 /api/account rinnova solo un’identità buona, e solo con il verificatore a inviti', async () => {
    const universes = mkdtempSync(path.join(dir, 'u-'));
    const settings = accountSettings({ QUINE_ACCOUNT: 'inviti', QUINE_SEGRETO_INVITI: SECRET }, universes);
    expect(settings.config).toEqual({ invites: true });
    const owner = ownerIdentity(SECRET, IdentityBook.of(universes));
    const server = http.createServer((req, res) => accountHandler(settings)(req, res));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/account`;
    try {
      const ok = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${owner}` } });
      expect(ok.status).toBe(200);
      const fresh = ((await ok.json()) as { token: string }).token;
      expect(readIdentity(SECRET, fresh, Date.now())?.id).toBe(OWNER_ID);
      expect((await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer falso' } })).status).toBe(401);
      expect((await fetch(url, { method: 'POST' })).status).toBe(401);
      // Another site's page never.
      expect((await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${owner}`, Origin: 'https://altro.example' } })).status).toBe(403);
      expect(await (await fetch(url)).json()).toEqual({ invites: true });
    } finally {
      await new Promise((r) => server.close(r));
    }
    // Without a good secret, no verifier at all (the production server would not start).
    expect(accountSettings({ QUINE_ACCOUNT: 'inviti', QUINE_SEGRETO_INVITI: 'corto' }, universes).verify).toBeUndefined();
  });
});

describe('V-038 l’universo privato: un server senza Firebase con due invitati', () => {
  let dir: string;
  let server: http.Server;
  let base: string;
  let accounts: AccountSettings;
  let owner: string;
  let stranger: string;
  const expelled: Array<[string, string]> = [];
  let toldWorld: boolean | undefined;

  const call = (p: string, token?: string, body?: unknown, method = body ? 'POST' : 'GET', extra: Record<string, string> = {}) =>
    fetch(`${base}${p}`, {
      method,
      // From outside, as on a public server: from this machine nobody is a stranger (rule 8b).
      headers: { 'X-Forwarded-For': '203.0.113.5', ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }).then(async (r) => ({ status: r.status, body: (await r.json().catch(() => ({}))) as Record<string, unknown> }));

  beforeAll(async () => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'quine-ospiti-'));
    accounts = accountSettings({ QUINE_ACCOUNT: 'inviti', QUINE_SEGRETO_INVITI: SECRET }, dir);
    owner = ownerIdentity(SECRET, IdentityBook.of(dir));
    // A third account: an identity born elsewhere on this server.
    stranger = accounts.invites!.mint('altrove').token;
    universe(dir, 'campagna', OWNER_ID);
    universe(dir, 'piazza', OWNER_ID);
    const store = universeHandler(dir, {
      accounts,
      internal: 'segreto-interno',
      worlds: { inWorld: () => ['qualcuno-nel-mondo'], expel: (n, id) => void expelled.push([n, id]), tellWorld: async (_n, v) => void (toldWorld = v) },
    });
    const wanderer = wandererHandler({ accounts, universesDir: dir });
    const wallet = walletHandler({ accounts, universesDir: dir });
    server = http.createServer((req, res) => {
      const next = () => void res.writeHead(404).end();
      if (req.url?.startsWith('/api/viandante')) return wanderer(req, res, next);
      if (req.url?.startsWith('/api/crediti')) return wallet(req, res, next);
      return store(req, res, next);
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise((r) => server.close(r));
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  });

  let guestA: { id: string; identity: string };
  let guestB: { id: string; identity: string };
  let inviteA: string;
  let inviteB: string;

  it('V-038 solo il master scrive ospiti e inviti; il mondo non li sa nemmeno leggere', async () => {
    expect((await call('/api/universe/campagna/guests', stranger)).status).toBe(403);
    expect((await call('/api/universe/campagna/guests', stranger, { op: 'private', value: true })).status).toBe(403);
    expect((await call('/api/universe/campagna/guests', stranger, { op: 'invite' })).status).toBe(403);
    expect((await call('/api/universe/campagna/guests', undefined, { op: 'add', id: 'inv-io' })).status).toBe(403);
    expect((await call('/api/universe/campagna/guests', undefined, undefined, 'GET', { [INTERNAL_HEADER]: worldToken('segreto-interno', 'campagna') })).status).toBe(403);
    const off = await call('/api/universe/campagna/guests', owner);
    expect(off.body).toMatchObject({ ok: true, private: false, guests: [], invites: [] });
    // Only JSON: a form of another site cannot write it.
    const form = await fetch(`${base}/api/universe/campagna/guests`, { method: 'POST', headers: { Authorization: `Bearer ${owner}`, 'Content-Type': 'text/plain' }, body: '{"op":"private","value":true}' });
    expect(form.status).toBe(415);
  });

  it('V-038 il master lo fa privato e fa due inviti: il token esce una volta, sul disco c’è solo la sua impronta', async () => {
    const on = await call('/api/universe/campagna/guests', owner, { op: 'private', value: true });
    expect(on.body.private).toBe(true);
    expect(toldWorld).toBe(true);
    // Who was in the world stays, among the guests.
    expect((on.body.guests as Array<{ id: string }>).map((g) => g.id)).toEqual(['qualcuno-nel-mondo']);
    const a = await call('/api/universe/campagna/guests', owner, { op: 'invite', note: 'Anna' });
    const b = await call('/api/universe/campagna/guests', owner, { op: 'invite', days: 2, note: 'Bruno' });
    expect(a.status).toBe(200);
    inviteA = a.body.token as string;
    inviteB = b.body.token as string;
    expect(inviteA).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a.body.invite).toMatchObject({ uses: 1, left: 1, note: 'Anna' });
    // The answer says the universe as it is now, for the master's console: still private, with both invites, none by its token.
    expect(b.body).toMatchObject({ private: true });
    expect((b.body.invites as unknown[]).length).toBe(2);
    expect((a.body.invite as { expires: number; made: number }).expires - (a.body.invite as { made: number }).made).toBe(7 * DAY);
    const seen = await call('/api/universe/campagna/guests', owner);
    expect((seen.body.invites as unknown[]).length).toBe(2);
    expect(JSON.stringify(seen.body)).not.toContain(inviteA);
    const file = readFileSync(path.join(dir, '.campaign', 'campagna.json'), 'utf8');
    expect(file).not.toContain(inviteA);
    expect(file).toContain(inviteHash(inviteA));
    // Nothing of it is in the universe, which travels with clones and rollbacks.
    expect(existsSync(path.join(dir, 'campagna', 'campaign.json'))).toBe(false);
    // Out of the limits, refused with the reason.
    expect((await call('/api/universe/campagna/guests', owner, { op: 'invite', days: 0 })).status).toBe(400);
    expect((await call('/api/universe/campagna/guests', owner, { op: 'invite', uses: 99 })).status).toBe(400);
    expect((await call('/api/universe/campagna/guests', owner, { op: 'invite', note: '<script>' })).status).toBe(400);
  });

  it('V-038 a un terzo account, e a chi non ha un account, l’universo privato non esiste: né nell’elenco né per nome', async () => {
    for (const token of [stranger, undefined]) {
      const list = await call('/api/universe', token);
      expect(list.body.universes).toEqual(['piazza']);
      expect(list.body.invite).toBeUndefined();
      // As a name with no universe: the same answers, word for word.
      for (const p of ['/api/universe/campagna', '/api/universe/campagna/carte', '/api/universe/campagna/maps', '/api/universe/campagna/kin']) {
        const hidden = await call(p, token);
        const none = await call(p.replace('campagna', 'nessuno'), token);
        expect({ p, status: hidden.status, body: hidden.body }).toEqual({ p, status: none.status, body: none.body });
      }
      expect((await call('/api/universe/campagna/guests', token)).status).toBe(404);
      expect((await call('/api/universe/campagna/guests', token, { op: 'redeem', invite: newInviteToken() })).body).toEqual({ error: 'universo sconosciuto' });
    }
    expect((await call('/api/viandante?universo=campagna', stranger)).status).toBe(404);
    expect((await call('/api/crediti?universo=campagna', stranger)).status).toBe(404);
    // Its master sees it, said private.
    const mine = await call('/api/universe', owner);
    expect(mine.body).toMatchObject({ universes: expect.arrayContaining(['campagna', 'piazza']), invite: ['campagna'] });
  });

  it('V-038 il primo invitato entra con l’invito, senza un account: il server gli fa un’identità', async () => {
    const r = await call('/api/universe/campagna/guests', undefined, { op: 'redeem', invite: inviteA });
    expect(r.status).toBe(200);
    guestA = { id: r.body.id as string, identity: r.body.identity as string };
    expect(guestA.id.startsWith(INVITE_PREFIX)).toBe(true);
    expect((await accounts.verify!(guestA.identity))?.uid).toBe(guestA.id);
    const snap = await call('/api/universe/campagna', guestA.identity);
    expect(snap.body.exists).toBe(true);
    expect((await call('/api/universe', guestA.identity)).body).toMatchObject({ invite: ['campagna'] });
    expect((await call('/api/viandante?universo=campagna', guestA.identity)).status).toBe(200);
    // A guest reads, and does not write the list.
    expect((await call('/api/universe/campagna/guests', guestA.identity)).status).toBe(403);
  });

  it('V-038 un invito a un uso non fa entrare un secondo: né con un account, né facendosene uno', async () => {
    const before = Object.keys(JSON.parse(readFileSync(path.join(dir, '.identities.json'), 'utf8'))).length;
    expect((await call('/api/universe/campagna/guests', undefined, { op: 'redeem', invite: inviteA })).status).toBe(404);
    expect((await call('/api/universe/campagna/guests', stranger, { op: 'redeem', invite: inviteA })).status).toBe(404);
    // No identity was made for the second try.
    expect(Object.keys(JSON.parse(readFileSync(path.join(dir, '.identities.json'), 'utf8'))).length).toBe(before);
    expect((await call('/api/universe/campagna', stranger)).body).toEqual({ exists: false });
  });

  it('V-038 il secondo invitato entra col suo; il master vede due ospiti e nessun invito aperto', async () => {
    const r = await call('/api/universe/campagna/guests', undefined, { op: 'redeem', invite: inviteB });
    guestB = { id: r.body.id as string, identity: r.body.identity as string };
    expect(r.status).toBe(200);
    const seen = await call('/api/universe/campagna/guests', owner);
    expect((seen.body.guests as Array<{ id: string }>).map((g) => g.id).sort()).toEqual([guestA.id, guestB.id, 'qualcuno-nel-mondo'].sort());
    expect(seen.body.invites).toEqual([]);
  });

  it('V-038 un ospite tolto sparisce: la sua identità, nata qui, non vale più, e il suo socket si chiude', async () => {
    const r = await call('/api/universe/campagna/guests', owner, { guest: guestA.id }, 'DELETE');
    expect(r.status).toBe(200);
    expect(expelled).toContainEqual(['campagna', guestA.id]);
    expect(await accounts.verify!(guestA.identity)).toBeUndefined();
    expect((await call('/api/universe/campagna', guestA.identity)).status).toBe(401);
    // The other guest is still in; the master cannot be taken out.
    expect((await call('/api/universe/campagna', guestB.identity)).body.exists).toBe(true);
    expect((await call('/api/universe/campagna/guests', owner, { guest: OWNER_ID }, 'DELETE')).status).toBe(400);
    // A guest added by id (an account of this server) and taken out: the universe is not there for them any more.
    const c = await accounts.invites!.mint('altrove2');
    await call('/api/universe/campagna/guests', owner, { op: 'add', id: c.id });
    expect((await call('/api/universe/campagna', c.token)).body.exists).toBe(true);
    await call('/api/universe/campagna/guests', owner, { guest: c.id }, 'DELETE');
    expect((await call('/api/universe/campagna', c.token)).body).toEqual({ exists: false });
    // Born elsewhere, their identity stays: only this universe is gone for them.
    expect(await accounts.verify!(c.token)).toBeDefined();
  });

  it('V-038 un invito revocato non vale; uno scaduto nemmeno', async () => {
    const r = await call('/api/universe/campagna/guests', owner, { op: 'invite' });
    const id = (r.body.invite as { id: string }).id;
    expect((await call('/api/universe/campagna/guests', owner, { invite: id }, 'DELETE')).status).toBe(200);
    expect((await call('/api/universe/campagna/guests', undefined, { op: 'redeem', invite: r.body.token })).status).toBe(404);
    const archive = CampaignArchive.of(dir);
    const late = await call('/api/universe/campagna/guests', owner, { op: 'invite', days: 1 });
    expect(archive.redeem('campagna', late.body.token as string, 'inv-tardi', Date.now() + 2 * DAY)).toEqual({ refused: 'invito non valido o scaduto' });
  });

  it('V-038 un universo che nasce di nuovo con quel nome nasce pubblico', async () => {
    const archive = CampaignArchive.of(dir);
    archive.change('rinato', (c) => {
      c.private = true;
      c.guests['inv-vecchio'] = { since: 1, by: OWNER_ID };
    });
    const made = await call('/api/universe/rinato/create', owner, { files: { 'universe.json': JSON.stringify({ name: 'rinato' }) }, message: 'nasce' });
    expect(made.status).toBe(200);
    expect(archive.read('rinato')).toEqual({ private: false, guests: {}, invites: {} });
  });
});

describe('V-038 le regole, una per una', () => {
  it('V-038 il master e il mondo vedono sempre; un ospite anonimo è un ospite; un file illeggibile vale privato', () => {
    const game = { many: true, master: 'mastro' };
    const closed = { private: true, guests: { anna: { since: 1, by: 'mastro' } }, invites: {} };
    expect(letsIn({ local: false, id: 'mastro' }, game, closed)).toBe(true);
    expect(letsIn({ local: false, server: true }, game, closed)).toBe(true);
    expect(letsIn({ local: false, id: 'anna', anonimo: true }, game, closed)).toBe(true);
    expect(letsIn({ local: false, id: 'bruno' }, game, closed)).toBe(false);
    expect(letsIn({ local: false }, game, closed)).toBe(false);
    // An anonymous account is never the master, even if its id says so.
    expect(letsIn({ local: false, id: 'mastro', anonimo: true }, game, closed)).toBe(false);
    const dir = mkdtempSync(path.join(os.tmpdir(), 'quine-regole-'));
    try {
      const archive = CampaignArchive.of(dir);
      mkdirSync(archive.dir, { recursive: true });
      writeFileSync(archive.fileOf('rotto'), '{ non json');
      expect(archive.isPrivate('rotto')).toBe(true);
      expect(archive.lets('rotto', { local: false, id: 'chiunque' }, game)).toBe(false);
      expect(() => archive.fileOf('../fuori')).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('V-038 i tetti: ospiti e inviti aperti', () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'quine-tetti-'));
    try {
      const archive = CampaignArchive.of(dir);
      archive.change('pieno', (c) => {
        for (let i = 0; i < CAMPAIGN_LIMITS.guests; i++) c.guests[`g${i}`] = { since: 1, by: 'm' };
        c.invites[inviteHash('x'.repeat(43))] = { made: 1, expires: Date.now() + DAY, uses: 1, left: 1, by: 'm' };
      });
      expect(archive.redeem('pieno', 'x'.repeat(43), 'nuovo')).toEqual({ refused: `al più ${CAMPAIGN_LIMITS.guests} ospiti` });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('V-038 l’ingresso nel mondo: admit', () => {
  let dir: string;
  let server: http.Server;
  let sessions: { stop(): Promise<void> };
  let port: number;
  let accounts: AccountSettings;

  const socketOf = () => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/api/session?universo=segreto`);
    const heard: ServerMsg[] = [];
    const state = { closed: false };
    ws.on('message', (d) => heard.push(JSON.parse(String(d))));
    ws.on('close', () => (state.closed = true));
    ws.on('error', () => (state.closed = true));
    const opened = new Promise<void>((r) => {
      ws.on('open', () => r());
      ws.on('close', () => r());
    });
    return { ws, heard, state, opened, refusal: () => heard.find((m) => m.t === 'refusal') as { reason: string } | undefined };
  };

  beforeAll(async () => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'quine-admit-'));
    accounts = accountSettings({ QUINE_ACCOUNT: 'inviti', QUINE_SEGRETO_INVITI: SECRET }, dir);
    universe(dir, 'segreto', OWNER_ID);
    server = http.createServer();
    sessions = attachSessions(server, {
      accounts,
      internal: 'finto',
      program: async () => FAKE,
      entryMs: 2000,
      campaigns: CampaignArchive.of(dir),
      times: { notice: 300, kill: 1500, boot: 20000, healthy: 100000, call: 3000, deaths: 4, idle: 100000 },
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    port = (server.address() as AddressInfo).port;
  });

  afterEach(() => undefined);

  afterAll(async () => {
    await sessions.stop();
    await new Promise((r) => server.close(r));
    for (const k of activeHosts.keys()) activeHosts.delete(k);
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  });

  it('V-038 chi non è ospite non entra e il mondo non parte; l’ospite entra; il master sempre; tolto, il suo socket si chiude', async () => {
    const archive = CampaignArchive.of(dir);
    const guest = accounts.invites!.mint('segreto');
    const third = accounts.invites!.mint('altrove');
    archive.change('segreto', (c) => {
      c.private = true;
      c.guests[guest.id] = { since: Date.now(), by: OWNER_ID };
    });

    const stranger = socketOf();
    await stranger.opened;
    stranger.ws.send(JSON.stringify({ t: 'join', id: 'x', token: third.token }));
    await until(() => stranger.state.closed, 5000, 'rifiutato');
    expect(stranger.refusal()?.reason).toBe('questo mondo è su invito');
    expect(activeHosts.has('segreto')).toBe(false);

    const g = socketOf();
    await g.opened;
    g.ws.send(JSON.stringify({ t: 'join', id: 'x', token: guest.token }));
    await until(() => wanderersIn('segreto').includes(guest.id), 10000, 'ospite dentro');
    expect(activeHosts.has('segreto')).toBe(true);

    const m = socketOf();
    await m.opened;
    m.ws.send(JSON.stringify({ t: 'join', id: 'x', token: ownerIdentity(SECRET, IdentityBook.of(dir)) }));
    await until(() => wanderersIn('segreto').includes(OWNER_ID), 10000, 'master dentro');

    expelFrom('segreto', guest.id, 'il master ti ha tolto dagli ospiti di questo mondo');
    await until(() => g.state.closed, 5000, 'ospite fuori');
    expect(g.refusal()?.reason).toMatch(/tolto dagli ospiti/);
    expect(wanderersIn('segreto')).toEqual([OWNER_ID]);
    expect(m.state.closed).toBe(false);
    m.ws.close();
  });
});

describe('V-038 con gli account: l’invito non è un’identità', () => {
  let dir: string;
  let server: http.Server;
  let base: string;
  // A token says its account: `vero-<uid>`, `anon-<uid>`.
  const accounts: AccountSettings = {
    config: { projectId: 'prova', apiKey: 'pubblica', authDomain: 'prova.firebaseapp.com' },
    verify: async (t) => (t.startsWith('vero-') ? { uid: t.slice(5), anonymous: false } : t.startsWith('anon-') ? { uid: t.slice(5), anonymous: true } : undefined),
  };
  const call = (p: string, token?: string, body?: unknown) =>
    fetch(`${base}${p}`, {
      method: body ? 'POST' : 'GET',
      headers: { 'X-Forwarded-For': '203.0.113.9', ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }).then(async (r) => ({ status: r.status, body: (await r.json().catch(() => ({}))) as Record<string, unknown> }));

  beforeAll(async () => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'quine-ospiti-fb-'));
    universe(dir, 'tavolo', accountWanderer('mastro0000000000000000000001'));
    const store = universeHandler(dir, { accounts, internal: 'x' });
    server = http.createServer((req, res) => store(req, res, () => void res.writeHead(404).end()));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(async () => {
    await new Promise((r) => server.close(r));
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  });

  it('V-038 un account entra con un invito e resta per il suo id; un secondo no; senza account l’invito non basta; un anonimo invitato è un ospite', async () => {
    const master = 'vero-mastro0000000000000000000001';
    await call('/api/universe/tavolo/guests', master, { op: 'private', value: true });
    const one = (await call('/api/universe/tavolo/guests', master, { op: 'invite' })).body.token as string;
    const two = (await call('/api/universe/tavolo/guests', master, { op: 'invite' })).body.token as string;
    expect((await call('/api/universe/tavolo', 'vero-terzo')).body).toEqual({ exists: false });
    // Without an account an invite makes no one: the identity is the verified token's (rule 8b).
    expect((await call('/api/universe/tavolo/guests', undefined, { op: 'redeem', invite: one })).status).toBe(404);
    expect((await call('/api/universe/tavolo/guests', 'vero-anna', { op: 'redeem', invite: one })).body).toMatchObject({ ok: true, id: 'anna' });
    expect((await call('/api/universe/tavolo', 'vero-anna')).body.exists).toBe(true);
    expect((await call('/api/universe/tavolo/guests', 'vero-terzo', { op: 'redeem', invite: one })).status).toBe(404);
    expect((await call('/api/universe/tavolo', 'vero-terzo')).body).toEqual({ exists: false });
    expect((await call('/api/universe/tavolo/guests', 'anon-ospite', { op: 'redeem', invite: two })).status).toBe(200);
    expect((await call('/api/universe/tavolo', 'anon-ospite')).body.exists).toBe(true);
  });
});
