// The site's profile page (T102): the wanderer's route (server/wanderer.ts) on disk and with a world running, and the
// pure parts of the page (site/profilo.ts).
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { readWandererState } from '../src/kernel/wanderers';
import { worldOf } from '../server/worldCalls';
import { keepProfileInFiles, viewFromFiles, wandererHandler, whoAsks, type WandererRouteOptions } from '../server/wanderer';
import { clampSeed, CLOAKS, formatCredits, pickUniverse, playLink, worldCloak } from '../site/profilo';

/** Calls the route as the server would; resolves with the status and the body. */
function call(opts: WandererRouteOptions, method: string, url: string, body?: unknown, headers: Record<string, string> = {}) {
  return new Promise<{ status: number; body: any; next?: true }>((resolve) => {
    const req = Object.assign(Readable.from(body === undefined ? [] : [Buffer.from(JSON.stringify(body))]), { method, url, headers: { host: 'localhost', 'content-type': 'application/json', ...headers }, socket: { remoteAddress: '127.0.0.1' } }) as unknown as IncomingMessage;
    const res = {
      statusCode: 200,
      setHeader() {},
      end(this: { statusCode: number }, text: string) {
        resolve({ status: this.statusCode, body: JSON.parse(text) });
      },
    } as unknown as ServerResponse;
    wandererHandler(opts)(req, res, () => resolve({ status: 0, body: undefined, next: true }));
  });
}

const PEOPLE = JSON.stringify({ persone: [{ nome: 'Mirella', tipo: 'npc.contadina', mestiere: 'contadina', famiglia: [] }] });

function diskUniverse(): { dir: string; root: string; git: (...a: string[]) => string } {
  const dir = mkdtempSync(path.join(tmpdir(), 'viandante-'));
  const root = path.join(dir, 'prova');
  mkdirSync(path.join(root, 'world', 'giocatori'), { recursive: true });
  mkdirSync(path.join(root, 'models'), { recursive: true });
  const git = (...args: string[]) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: root, encoding: 'utf8' });
  git('init', '-q');
  for (const f of ['models/index.json', 'models/viandante.xml']) writeFileSync(path.join(root, f), bundledFiles[f]);
  writeFileSync(path.join(root, 'world/people.json'), PEOPLE);
  writeFileSync(path.join(root, 'world/giocatori/ugo.json'), JSON.stringify({ nome: 'Ugo', crediti: 3.5 }));
  writeFileSync(path.join(root, 'world/giocatori/zed.json'), JSON.stringify({ nome: 'Zed', anonimo: true }));
  git('add', '-A');
  git('commit', '-q', '-m', 'inizio');
  return { dir, root, git };
}

describe('the wanderer route of the site (T102)', () => {
  it('without accounts reads the wanderer the page names, with credits and the program of the look', async () => {
    const { dir } = diskUniverse();
    try {
      const r = await call({ universesDir: dir }, 'GET', '/api/viandante?universo=prova&viandante=ugo');
      expect(r.status).toBe(200);
      const v = r.body.viandante;
      expect(v).toMatchObject({ id: 'ugo', account: 'locale', anonimo: false, crediti: 3.5, nelMondo: false, noto: true });
      expect(v.modello.xml).toContain('<sequence');
      expect(v.modello.semi).toBe(8);
      expect(v.modello.tinta).toBe('N');
      const anon = (await call({ universesDir: dir }, 'GET', '/api/viandante?universo=prova&viandante=zed')).body.viandante;
      expect(anon).toMatchObject({ anonimo: true, crediti: 0 });
      const fresh = (await call({ universesDir: dir }, 'GET', '/api/viandante?universo=prova')).body.viandante;
      expect(fresh).toMatchObject({ id: 'io', noto: false });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refuses unknown universes and bad ids, and lets other paths through', async () => {
    const { dir } = diskUniverse();
    try {
      expect((await call({ universesDir: dir }, 'GET', '/api/viandante?universo=altro')).status).toBe(404);
      expect((await call({ universesDir: dir }, 'GET', '/api/viandante?universo=../x')).status).toBe(400);
      expect((await call({ universesDir: dir }, 'GET', '/api/viandante?universo=prova&viandante=a%2Fb')).status).toBe(400);
      expect((await call({ universesDir: dir }, 'GET', '/api/altro')).next).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('keeps a profile on disk repaired, committing only the player file', async () => {
    const { dir, root, git } = diskUniverse();
    try {
      writeFileSync(path.join(root, 'non-mio.txt'), 'una modifica non committata\n');
      const r = await call({ universesDir: dir }, 'POST', '/api/viandante', { universo: 'prova', viandante: 'ugo', profilo: { nome: 'Zed', seme: 99, tinta: '#000000', presentazione: 'Vengo dal mare.' } });
      expect(r.status).toBe(200);
      // «Zed» is another wanderer's name, the seed is past the program's, black is too dark.
      expect(r.body.profilo.nome).not.toBe('Zed');
      expect(r.body.profilo.seme).toBe(3); // 99 folded into the 8 seeds
      expect(r.body.profilo.tinta).not.toBe('#000000');
      expect(r.body.riparato.length).toBeGreaterThan(0);
      const saved = JSON.parse(readFileSync(path.join(root, 'world/giocatori/ugo.json'), 'utf8'));
      // The balance left the file for the ledger the first time the universe was met (ADR-0104), and is still theirs.
      expect(saved.crediti).toBeUndefined();
      expect(r.body.viandante.crediti).toBe(3.5);
      expect(saved.profilo).toEqual(r.body.profilo);
      expect(git('show', '--name-only', '--format=', 'HEAD').trim()).toBe('world/giocatori/ugo.json');
      expect(git('status', '--short').trim()).toBe('?? non-mio.txt');
      expect(r.body.viandante.profilo).toEqual(r.body.profilo);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('with accounts the wanderer is the token’s, never the one the page says', async () => {
    const accounts = { config: { projectId: 'demo' }, verify: async (t: string) => (t === 'buono' ? { uid: 'UgoUID', anonimo: false } : t === 'anon' ? { uid: 'anonUID', anonimo: true } : undefined) };
    expect(await whoAsks(accounts, undefined, 'ugo')).toMatchObject({ status: 401 });
    expect(await whoAsks(accounts, 'falso', 'ugo')).toMatchObject({ status: 401 });
    expect(await whoAsks(accounts, 'buono', 'ugo')).toEqual({ id: 'ugouid', account: 'google' });
    expect(await whoAsks(accounts, 'anon', undefined)).toEqual({ id: 'anonuid', account: 'anonimo' });
    const { dir } = diskUniverse();
    try {
      const r = await call({ universesDir: dir, accounts }, 'GET', '/api/viandante?universo=prova&viandante=ugo', undefined, { authorization: 'Bearer buono' });
      expect(r.body.viandante).toMatchObject({ id: 'ugouid', account: 'google', noto: false });
      expect((await call({ universesDir: dir, accounts }, 'GET', '/api/viandante?universo=prova')).status).toBe(401);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('with the world running, asks the kernel: the wanderer in the world wears it, the one away finds it saved', async () => {
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, partita: { modalita: 'multiplayer', morte: 3 } }) };
    const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    k.addWanderer('alice', 'Alice', false);
    k.giveCredits('alice', 7);
    const opts: WandererRouteOptions = { universesDir: '/nessuno', getActiveWorld: async (u) => (u === 'vivo' ? worldOf(k) : undefined) };
    const got = (await call(opts, 'GET', '/api/viandante?universo=vivo&viandante=alice')).body.viandante;
    expect(got).toMatchObject({ id: 'alice', nelMondo: true, crediti: 7 });
    const kept = await call(opts, 'POST', '/api/viandante', { universo: 'vivo', viandante: 'alice', profilo: { nome: 'Alda', seme: 3, tinta: '#ff2a85' } });
    expect(kept.body.profilo).toMatchObject({ nome: 'Alda', seme: 3, tinta: '#ff2a85' });
    expect(k.profileOf('alice')).toMatchObject({ nome: 'Alda', seme: 3 });
    // Away from the world: written in their saved state, which they wear when they come in.
    const away = await call(opts, 'POST', '/api/viandante', { universo: 'vivo', viandante: 'bruno', profilo: { nome: 'Bruno', seme: 2 } });
    expect(away.body.viandante).toMatchObject({ nelMondo: false, noto: true });
    expect(readWandererState(k.files, 'bruno')?.profilo).toMatchObject({ nome: 'Bruno', seme: 2 });
    k.addWanderer('bruno');
    expect(k.profileOf('bruno')).toMatchObject({ nome: 'Bruno', seme: 2 });
  });

  it('a profile repaired in the files is unlike the people of the world', () => {
    const someone = 'Mirella';
    const files = { ...bundledFiles, 'world/people.json': PEOPLE };
    const { repair } = keepProfileInFiles(files, 'ugo', { nome: someone });
    expect(repair.profilo.nome).not.toBe(someone);
    expect(viewFromFiles(files, 'x', 'ugo', 'locale').profilo).toEqual(repair.profilo);
  });
});

describe('the profile page (T102)', () => {
  it('offers cloaks the world accepts, and says the colour it would really paint', () => {
    for (const c of CLOAKS) expect(worldCloak(c)).toBe(c);
    expect(worldCloak('#000000')).not.toBe('#000000');
    expect(worldCloak('#ffffff')).not.toBe('#ffffff');
  });

  it('formats credits, picks the universe, clamps the seed, links the game', () => {
    expect(formatCredits(3.456)).toBe('$3.46');
    expect(formatCredits(NaN)).toBe('$0.00');
    expect(pickUniverse(['a', 'b'], 'b', 'a')).toBe('b');
    expect(pickUniverse(['a', 'b'], 'z', 'b')).toBe('b');
    expect(pickUniverse(['a', 'b'], null, null)).toBe('a');
    expect(pickUniverse([], null, null)).toBeUndefined();
    expect(clampSeed(99, 8)).toBe(8);
    expect(clampSeed('x', 8)).toBe(1);
    expect(clampSeed(3, 8)).toBe(3);
    expect(playLink('prova', { id: 'ugo', account: 'locale' })).toBe('../index.html?universo=prova&viandante=ugo');
    expect(playLink('prova', { id: 'ugo', account: 'google' })).toBe('../index.html?universo=prova');
  });
});
