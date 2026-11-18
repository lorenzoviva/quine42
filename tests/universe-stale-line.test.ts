import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { universeHandler } from '../server/universeStore';
import { settleGit } from '../server/git';
import { owedWrite, UniverseClient, type OwedStorage, type OwedWrite } from '../src/kernel/universes';

// T421: neapolis opened as «aurora», seed 1337, from the 6th of November. A page had left a commit in line for a universe called neapolis
// (T265: the line lives in the browser under the universe's name); that universe was replaced on disk by the one T273 installed, and the
// next page wrote the old line into the new repository before reading it: universe.json of the seed, the old game's places and cards.
// A write now says the head it was made on (`base`), and the store takes it only into the repository that has that commit.

const realFetch = globalThis.fetch;
const noAnswer = () => Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNREFUSED' } });

/** A storage in memory, as the browser's keeps it across a reload. */
function memoryLine(): OwedStorage & { line: OwedWrite[] } {
  const s = {
    line: [] as OwedWrite[],
    load: () => JSON.parse(JSON.stringify(s.line)) as OwedWrite[],
    save: (line: OwedWrite[]) => {
      s.line = JSON.parse(JSON.stringify(line));
      return true;
    },
  };
  return s;
}

describe('la fila di un universo sostituito con lo stesso nome non entra nel nuovo (T421)', () => {
  let dir: string;
  let server: http.Server;
  let base: string;
  const root = () => path.join(dir, 'sonda');
  const git = (...args: string[]) => execFileSync('git', args, { cwd: root(), encoding: 'utf8' });
  /** A universe as an installer writes it: a folder, a repository, one commit. Whatever was there goes aside, never deleted. */
  const install = async (name: string, seed: number) => {
    if (existsSync(root())) await aside(root());
    mkdirSync(path.join(root(), 'world'), { recursive: true });
    writeFileSync(path.join(root(), 'universe.json'), JSON.stringify({ name, seed }) + '\n');
    writeFileSync(path.join(root(), 'world', 'people.json'), '[]\n');
    // Two installs of the same files in the same second would make the same commit: the same repository, as far as git can tell.
    writeFileSync(path.join(root(), 'world', 'state.json'), JSON.stringify({ installed: ++installs }) + '\n');
    git('init', '-q');
    git('add', '-A');
    git('-c', 'user.name=Genesi', '-c', 'user.email=genesi@rune.local', 'commit', '-q', '-m', `genesi: ${name}`);
  };
  /** Moved aside as the installer does: after the store's git in that folder, and again while Windows still holds it (a scan, a handle). */
  const aside = async (from: string) => {
    await settleGit(from);
    for (let i = 0; ; i++) {
      try {
        return renameSync(from, path.join(dir, `sonda-${Date.now()}-${i}`));
      } catch (e) {
        const code = (e as NodeJS.ErrnoException).code;
        if ((code !== 'EBUSY' && code !== 'EPERM') || i >= 40) throw e;
        await new Promise((r) => setTimeout(r, 250));
      }
    }
  };
  /** The network goes away for a while: what is written now stays in line. */
  let offline = false;
  let installs = 0;

  beforeAll(async () => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'quine-stale-'));
    const handler = universeHandler(dir);
    server = http.createServer((req, res) => handler(req, res, () => ((res.statusCode = 404), res.end())));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise((r) => server.close(r));
    rmSync(dir, { recursive: true, force: true, maxRetries: 5 });
  });

  beforeEach(() => {
    offline = false;
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      if (offline && !String(url).endsWith('/api/universe')) throw noAnswer();
      return realFetch(url, init);
    });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  /** A page of the game alone: it reads the universe, then saves; the save stays in line while the network is away. */
  async function pageLeavesALine(storage: OwedStorage) {
    const page = (await UniverseClient.connect('sonda', base, {}, { storage }))!;
    const snap = await page.load();
    offline = true;
    void page.commit({ 'universe.json': '{"name":"aurora","seed":1337}\n', 'world/cards.json': '{"places":{"-1_-1":{"name":"Borgo Immobile"}}}\n' }, 'salvataggio della partita', 'player');
    void page.putMap('aurora:1337:c534aeb4:-1,-1', { plan: { place: { name: 'Borgo Immobile' } } });
    await vi.waitFor(() => expect(page.pending).toBe(2));
    page.close();
    offline = false;
    return snap;
  }

  it('il caso di neapolis: la pagina dopo non scrive nel repository nuovo ciò che era dovuto a quello di prima', async () => {
    await install('neapolis', 1990);
    const storage = memoryLine();
    const before = await pageLeavesALine(storage);
    expect(before.head).toMatch(/^[0-9a-f]{7}$/);
    // What the line keeps says the head it was made on.
    expect(storage.line.map((w) => w.base)).toEqual([before.head, before.head]);

    // The universe is installed again under the same name (T273: the old one aside, a new repository).
    await install('neapolis', 1990);
    const genesis = git('rev-parse', '--short=7', 'HEAD').trim();

    const next = (await UniverseClient.connect('sonda', base, {}, { storage }))!;
    const snap = await next.load();
    expect(JSON.parse(snap.files!['universe.json'])).toEqual({ name: 'neapolis', seed: 1990 });
    expect(snap.files!['world/cards.json']).toBeUndefined();
    expect(existsSync(path.join(root(), 'maps'))).toBe(false);
    expect(git('rev-parse', '--short=7', 'HEAD').trim()).toBe(genesis);
    expect(git('status', '--porcelain').trim()).toBe('');
    // Refused, not kept to try forever: the line is empty, and the page writes its own saves into the universe it read.
    expect(next.pending).toBe(0);
    expect(storage.line).toEqual([]);
    expect(await next.commit({ 'world/people.json': '[{"id":"gemma"}]\n' }, 'persone: Gemma', 'agent')).toMatch(/^[0-9a-f]{7}$/);
    expect(readFileSync(path.join(root(), 'world', 'people.json'), 'utf8')).toBe('[{"id":"gemma"}]\n');
  });

  it('nello stesso universo la fila della pagina prima arriva come sempre, prima di leggerlo', async () => {
    await install('neapolis', 1990);
    const storage = memoryLine();
    await pageLeavesALine(storage);
    const next = (await UniverseClient.connect('sonda', base, {}, { storage }))!;
    const snap = await next.load();
    expect(JSON.parse(snap.files!['universe.json'])).toEqual({ name: 'aurora', seed: 1337 });
    expect(snap.files!['world/cards.json']).toContain('Borgo Immobile');
    expect(existsSync(path.join(root(), 'maps', 'aurora_1337_c534aeb4_-1_-1.json'))).toBe(true);
    expect(git('log', '-1', '--format=%s').trim()).toBe('salvataggio della partita');
  });

  it('una scheda rimasta aperta mentre l’universo è sostituito non ci scrive più', async () => {
    await install('neapolis', 1990);
    const tab = (await UniverseClient.connect('sonda', base, {}, { storage: null }))!;
    await tab.load();
    expect(await tab.commit({ 'world/people.json': '[{"id":"prima"}]\n' }, 'prima', 'agent')).toBeTruthy();
    await install('neapolis', 1990);
    const genesis = git('rev-parse', 'HEAD').trim();
    expect(await tab.commit({ 'universe.json': '{"name":"aurora","seed":1337}\n' }, 'salvataggio della partita', 'player')).toBeNull();
    await tab.putMap('aurora:1337:c534aeb4:0,0', { plan: {} });
    expect(tab.lastError).toMatch(/aveva questo nome prima/);
    expect(git('rev-parse', 'HEAD').trim()).toBe(genesis);
    expect(JSON.parse(readFileSync(path.join(root(), 'universe.json'), 'utf8'))).toEqual({ name: 'neapolis', seed: 1990 });
    expect(existsSync(path.join(root(), 'maps'))).toBe(false);
  });

  it('dopo un ritorno a un commit vecchio la base resta nella storia: le scritture entrano', async () => {
    await install('neapolis', 1990);
    const tab = (await UniverseClient.connect('sonda', base, {}, { storage: null }))!;
    const first = (await tab.load()).head!;
    await tab.commit({ 'world/people.json': '[{"id":"a"}]\n' }, 'a', 'agent');
    await tab.checkout(first);
    expect(await tab.commit({ 'world/people.json': '[{"id":"b"}]\n' }, 'b', 'agent')).toBeTruthy();
    expect(readFileSync(path.join(root(), 'world', 'people.json'), 'utf8')).toBe('[{"id":"b"}]\n');
  });

  it('lo store: una base che non è un commit, o non è di questo repository, è un 409; senza base si scrive come prima', async () => {
    await install('neapolis', 1990);
    const post = (body: unknown) => realFetch(`${base}/api/universe/sonda/commit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const write = { changes: { 'world/x.json': '1\n' }, message: 'x', author: 'agent' };
    expect((await post({ ...write, base: 'deadbee' })).status).toBe(409);
    expect((await post({ ...write, base: '--all' })).status).toBe(409);
    expect((await post({ ...write, base: 42 })).status).toBe(409);
    expect(existsSync(path.join(root(), 'world', 'x.json'))).toBe(false);
    const head = git('rev-parse', '--short=7', 'HEAD').trim();
    expect((await post({ ...write, base: head })).status).toBe(200);
    expect((await post({ ...write, changes: { 'world/y.json': '2\n' } })).status).toBe(200);
    const map = (q: string) => realFetch(`${base}/api/universe/sonda/map/k${q}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    expect((await map('?base=deadbee')).status).toBe(409);
    expect(existsSync(path.join(root(), 'maps', 'k.json'))).toBe(false);
    expect((await map(`?base=${head}`)).status).toBe(200);
  });

  it('una fila salvata: la base si tiene se è un commit, si lascia se non lo è', () => {
    expect(owedWrite({ kind: 'commit', changes: {}, message: 'm', author: 'player', base: 'abc1234' })).toEqual({ kind: 'commit', changes: {}, message: 'm', author: 'player', base: 'abc1234' });
    expect(owedWrite({ kind: 'map', key: 'k', data: {}, base: 'HEAD~1' })).toEqual({ kind: 'map', key: 'k', data: {} });
    expect(owedWrite({ kind: 'merge', branch: 'master', message: 'm' })).toEqual({ kind: 'merge', branch: 'master', message: 'm' });
  });
});
