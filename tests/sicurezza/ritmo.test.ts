// V-039 (T373, ADR-0196): the pace of the world. The master's alone, on the wire (with a pace of its own) and on the store's route (never the world's
// token, never a stranger, a private universe not there for them); kept in `.campaign`, repaired, and touching nothing else of that file; what any
// pace says never makes the world plan more new places a minute than the lobby set. Fake values only.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { accountSettings, type AccountSettings } from '../../server/account';
import { worldToken } from '../../server/access';
import { CampaignArchive, keepPace } from '../../server/campaign';
import { IdentityBook, OWNER_ID, ownerIdentity } from '../../server/invites';
import { universeHandler } from '../../server/universeStore';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { bundledFiles } from '../../src/kernel/bundle';
import { Kernel } from '../../src/kernel/kernel';
import { memoryStore } from '../../src/kernel/repo';
import { INTERNAL_HEADER } from '../../src/kernel/universes';
import { NORMAL_PACE, placesPerMinute, readPace } from '../../src/kernel/worldPace';
import { fakeLink } from '../../src/session/protocol';
import { LIMITS, SessionServer } from '../../src/session/server';
import { SessionClient } from '../../src/session/client';

const SECRET = 'segreto-di-prova-lungo-abbastanza-per-firmare-0123';

function universe(dir: string, name: string, master: string) {
  const root = path.join(dir, name);
  mkdirSync(path.join(root, 'world'), { recursive: true });
  writeFileSync(path.join(root, 'universe.json'), JSON.stringify({ name, game: { mode: 'multiplayer', master } }));
  const git = (...a: string[]) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd: root, stdio: 'ignore', windowsHide: true });
  git('init', '-q');
  git('add', '-A');
  git('commit', '-q', '-m', 'nasce');
}

async function bootMany(): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, ai: { ...cfg.ai, placesPerMinute: 3 }, game: { mode: 'multiplayer', death: 3 } }, null, 2) };
  return Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
}

async function asked<T>(server: SessionServer, p: Promise<T>): Promise<T> {
  let done = false;
  void p.finally(() => (done = true));
  for (let i = 0; i < 200 && !done; i++) {
    server.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 5));
  }
  return p;
}

describe('V-039 il ritmo sul filo', () => {
  it('V-039 solo il master cambia il ritmo, e non più spesso del suo ritmo', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const link = (id: string) => {
      const { server: s, client: c } = fakeLink();
      server.connect(s);
      return new SessionClient(c, { id });
    };
    const master = link('me');
    const anna = link('anna');
    await asked(server, Promise.all([master.ready, anna.ready]));
    const refused = await asked(server, anna.act({ t: 'pace', mode: 'hold' }));
    expect(refused.ok).toBe(false);
    expect(k.worldPace()).toEqual(NORMAL_PACE);
    // The kernel itself refuses whoever is not the master, whatever the way.
    expect((await k.setPace({ mode: 'hold' }, 'anna')).ok).toBe(false);
    const answers = await asked(server, Promise.all(Array.from({ length: LIMITS.paceBurst + 3 }, () => master.act({ t: 'pace', mode: 'slow' }))));
    expect(answers.filter((a) => a.ok)).toHaveLength(LIMITS.paceBurst);
  });

  it('V-039 qualunque ritmo detto, il mondo non pianifica più luoghi nuovi al minuto della lobby', async () => {
    const k = await bootMany();
    for (const raw of [{ mode: 'slow', placesPerMinute: 120 }, { mode: 'slow', placesPerMinute: 1e12 }, { mode: 'slow', placesPerMinute: -1 }, { mode: 'normal', placesPerMinute: 99 }, { mode: 'hold' }, { mode: '__proto__' }, null, 'hold', 42]) {
      const r = await k.setPace(raw, k.masterId());
      expect(r.ok).toBe(true);
      expect(placesPerMinute(k.worldPace(), 3)).toBeLessThanOrEqual(3);
      expect(k.pacedGap(10)).toBeGreaterThanOrEqual(10);
    }
  });
});

describe('V-039 il ritmo sul server', () => {
  let dir: string;
  let server: http.Server;
  let base: string;
  let accounts: AccountSettings;
  let owner: string;
  let stranger: string;
  const told: unknown[] = [];

  const call = (p: string, token?: string, body?: unknown, extra: Record<string, string> = {}) =>
    fetch(`${base}${p}`, {
      method: body ? 'POST' : 'GET',
      headers: { 'X-Forwarded-For': '203.0.113.5', ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }).then(async (r) => ({ status: r.status, body: (await r.json().catch(() => ({}))) as Record<string, unknown> }));

  beforeAll(async () => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'quine-ritmo-'));
    accounts = accountSettings({ QUINE_ACCOUNT: 'inviti', QUINE_SEGRETO_INVITI: SECRET }, dir);
    owner = ownerIdentity(SECRET, IdentityBook.of(dir));
    stranger = accounts.invites!.mint('altrove').token;
    universe(dir, 'campagna', OWNER_ID);
    universe(dir, 'segreta', OWNER_ID);
    new CampaignArchive(path.join(dir, '.campaign'), dir).change('segreta', (c) => void (c.private = true));
    const store = universeHandler(dir, { accounts, internal: 'segreto-interno', worlds: { tellPace: async (_n, p) => (told.push(p), readPace(p)) } });
    server = http.createServer((req, res) => store(req, res, () => void res.writeHead(404).end()));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(async () => {
    await new Promise((r) => server.close(r));
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  });

  it('V-039 la rotta del ritmo: solo il master, mai il mondo né un estraneo; un universo privato non c’è per chi non lo vede', async () => {
    expect((await call('/api/universe/campagna/pace', stranger, { mode: 'hold' })).status).toBe(403);
    expect((await call('/api/universe/campagna/pace', undefined, { mode: 'hold' })).status).toBe(403);
    // The world's own token: not the world's to keep (rule 8g).
    const world = await fetch(`${base}/api/universe/campagna/pace`, { method: 'POST', headers: { 'Content-Type': 'application/json', [INTERNAL_HEADER]: worldToken('segreto-interno', 'campagna') }, body: '{"mode":"hold"}' });
    expect(world.status).toBe(403);
    expect((await call('/api/universe/segreta/pace', stranger, { mode: 'hold' })).status).toBe(404);
    expect((await call('/api/universe/segreta/pace', stranger)).status).toBe(404);
    // Only JSON.
    const form = await fetch(`${base}/api/universe/campagna/pace`, { method: 'POST', headers: { Authorization: `Bearer ${owner}`, 'Content-Type': 'text/plain' }, body: '{"mode":"hold"}' });
    expect(form.status).toBe(415);
    expect(told).toEqual([]);
    const ok = await call('/api/universe/campagna/pace', owner, { mode: 'hold' });
    expect(ok.status).toBe(200);
    expect(ok.body.pace).toEqual({ mode: 'hold' });
    expect(told).toEqual([{ mode: 'hold' }]);
  });

  it('V-039 il ritmo sta nel file .campaign, riparato, e non tocca nient’altro di quel file', () => {
    const archive = new CampaignArchive(path.join(dir, '.campaign'), dir);
    const before = archive.read('segreta');
    // What a world says (it may be compromised) goes through the same repair: at worst it holds or slows itself.
    keepPace(archive, 'segreta', { mode: 'slow', placesPerMinute: 1e9, private: false, guests: { intruso: {} } });
    const after = archive.read('segreta');
    expect(after.private).toBe(true);
    expect(after.guests).toEqual(before.guests);
    expect(after.pace).toEqual({ mode: 'slow', placesPerMinute: 120 });
    const text = readFileSync(path.join(dir, '.campaign', 'segreta.json'), 'utf8');
    expect(text).not.toContain('intruso');
  });
});
