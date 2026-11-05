import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { universeHandler } from '../server/universeStore';
import { UniverseClient } from '../src/kernel/universes';

// T211, ADR-0122: a commit carries only what changed, so one lost would stay lost: a failure of the network keeps it in line, a refusal does not.

const realFetch = globalThis.fetch;
const noAnswer = () => Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNRESET' } });
const answer = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const isCommit = (url: unknown) => String(url).endsWith('/commit');

/** A client on a store made of a list: what it took, in order. `fails` decides each commit that arrives. */
async function onFakeStore(fails: (message: string, nth: number) => Response | Error | undefined) {
  const took: string[] = [];
  const asked: string[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: unknown, init?: RequestInit) => {
    if (!isCommit(url)) return String(url).endsWith('/api/universe') ? answer(200, { available: true }) : answer(200, {});
    const { message } = JSON.parse(String(init?.body));
    asked.push(message);
    const f = fails(message, asked.filter((m) => m === message).length);
    if (f instanceof Error) throw f;
    if (f) return f;
    took.push(message);
    return answer(200, { head: `h-${message}` });
  }));
  const client = (await UniverseClient.connect('sonda'))!;
  return { client, took, asked };
}

describe('il commit che fallisce, con un server vero (T211)', () => {
  let dir: string;
  let root: string;
  let server: http.Server;
  let base: string;
  const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });

  beforeAll(async () => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'quine-commit-'));
    root = path.join(dir, 'sonda');
    mkdirSync(path.join(root, 'world'), { recursive: true });
    writeFileSync(path.join(root, 'universe.json'), '{"name":"sonda"}\n');
    git('init', '-q');
    git('add', '-A');
    git('-c', 'user.name=prova', '-c', 'user.email=prova@rune.local', 'commit', '-q', '-m', 'inizio');
    const handler = universeHandler(dir);
    server = http.createServer((req, res) => handler(req, res, () => ((res.statusCode = 404), res.end())));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    vi.unstubAllGlobals();
    await new Promise((r) => server.close(r));
    rmSync(dir, { recursive: true, force: true, maxRetries: 5 });
  });

  it('un fetch che fallisce una volta: su disco alla fine c’è tutto, in ordine', async () => {
    let requests = 0;
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      if (isCommit(url) && ++requests === 1) throw noAnswer();
      return realFetch(url, init);
    });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const client = (await UniverseClient.connect('sonda', base))!;
    const first = client.commit({ 'world/primo.json': '1\n' }, 'il primo', 'agent');
    const second = client.commit({ 'world/secondo.json': '2\n' }, 'il secondo', 'agent');
    expect(client.pending).toBe(2);
    expect(await first).toBeTruthy();
    expect(await second).toBeTruthy();
    expect(client.pending).toBe(0);
    expect(requests).toBe(3); // The first, which failed; the first again; the second.
    expect(readFileSync(path.join(root, 'world', 'primo.json'), 'utf8')).toBe('1\n');
    expect(readFileSync(path.join(root, 'world', 'secondo.json'), 'utf8')).toBe('2\n');
    expect(git('log', '-n', '2', '--format=%s').trim().split('\n')).toEqual(['il secondo', 'il primo']);
    expect(git('status', '--porcelain').trim()).toBe('');
  });

  it('un rifiuto vero del server non si ritenta e non ferma il commit dopo', async () => {
    let requests = 0;
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      // The store refuses what is not admitted; the client's own filter would not let it get here, so the body is changed on the way.
      if (!isCommit(url)) return realFetch(url, init);
      requests++;
      const body = JSON.parse(String(init?.body));
      if (body.message === 'rifiutato') body.changes = { '.git/config': 'sonda' };
      return realFetch(url, { ...init, body: JSON.stringify(body) });
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const client = (await UniverseClient.connect('sonda', base))!;
    expect(await client.commit({ 'world/no.json': '{}\n' }, 'rifiutato', 'agent')).toBeNull();
    expect(requests).toBe(1);
    expect(client.lastError).toBe('percorso non ammesso');
    expect(warn).toHaveBeenCalledWith('[universo] commit non scritto su disco:', 'percorso non ammesso');
    expect(existsSync(path.join(root, 'world', 'no.json'))).toBe(false);
    expect(await client.commit({ 'world/dopo.json': '3\n' }, 'dopo il rifiuto', 'agent')).toBeTruthy();
    expect(client.pending).toBe(0);
    expect(existsSync(path.join(root, 'world', 'dopo.json'))).toBe(true);
  });
});

describe('la coda dei commit (T211)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each([[401], [403], [400], [404]])('HTTP %i è un rifiuto: una richiesta sola', async (status) => {
    const { client, asked } = await onFakeStore(() => answer(status, { error: 'no' }));
    await expect(client.commit({ 'world/a.json': '1' }, 'a', 'agent')).resolves.toBeNull();
    expect(asked).toEqual(['a']);
    expect(client.pending).toBe(0);
  });

  it('senza server resta in attesa, non blocca chi committa, e il commit dopo non lo sorpassa', async () => {
    let down = true;
    const { client, took, asked } = await onFakeStore(() => (down ? noAnswer() : undefined));
    const a = client.commit({ 'world/a.json': '1' }, 'a', 'agent');
    await vi.advanceTimersByTimeAsync(5200); // All its tries: 4 requests.
    expect(asked).toEqual(['a', 'a', 'a', 'a']);
    await expect(a).resolves.toBeNull();
    expect(client.pending).toBe(1);
    expect(client.lastError).toBe('fetch failed (ECONNRESET)');

    // In waiting each commit after it tries once, the first in line.
    const b = client.commit({ 'world/b.json': '2' }, 'b', 'agent');
    await vi.advanceTimersByTimeAsync(0);
    await expect(b).resolves.toBeNull();
    expect(asked.slice(4)).toEqual(['a']);
    expect(client.pending).toBe(2);
    expect(took).toEqual([]);

    down = false;
    const c = client.commit({ 'world/c.json': '3' }, 'c', 'agent');
    await vi.advanceTimersByTimeAsync(0);
    await expect(c).resolves.toBe('h-c');
    expect(took).toEqual(['a', 'b', 'c']);
    expect(client.pending).toBe(0);
  });

  it('senza commit nuovi ritenta da solo, e poi smette', async () => {
    let down = true;
    const { client, took, asked } = await onFakeStore(() => (down ? noAnswer() : undefined));
    void client.commit({ 'world/a.json': '1' }, 'a', 'agent');
    await vi.advanceTimersByTimeAsync(5200);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(asked.length).toBe(5);
    down = false;
    await vi.advanceTimersByTimeAsync(30_000);
    expect(took).toEqual(['a']);
    expect(client.pending).toBe(0);
    await vi.advanceTimersByTimeAsync(120_000);
    expect(asked.length).toBe(6);
  });

  it('close: niente più tentativi, e dice cosa resta', async () => {
    const { client, asked } = await onFakeStore(() => noAnswer());
    void client.commit({ 'world/a.json': '1' }, 'a', 'agent');
    await vi.advanceTimersByTimeAsync(5200);
    client.close();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(asked.length).toBe(4);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('1 scritture non su disco alla chiusura'));
  });

  it('un errore del server si ritenta poco, poi cede il passo: non ferma per sempre i commit dopo', async () => {
    const { client, took, asked } = await onFakeStore((m) => (m === 'a' ? answer(500, { error: 'index.lock' }) : undefined));
    const a = client.commit({ 'world/a.json': '1' }, 'a', 'agent');
    const b = client.commit({ 'world/b.json': '2' }, 'b', 'agent');
    await vi.advanceTimersByTimeAsync(5200);
    await expect(a).resolves.toBeNull();
    await expect(b).resolves.toBe('h-b');
    expect(asked).toEqual(['a', 'a', 'a', 'a', 'b']);
    expect(took).toEqual(['b']);
    expect(client.lastError).toBe('index.lock');
    expect(client.pending).toBe(0);
  });

  it('un 500 che passa al secondo tentativo non perde il commit', async () => {
    const { client, took } = await onFakeStore((_, n) => (n === 1 ? answer(500, { error: 'index.lock' }) : undefined));
    const a = client.commit({ 'world/a.json': '1' }, 'a', 'agent');
    await vi.advanceTimersByTimeAsync(200);
    await expect(a).resolves.toBe('h-a');
    expect(took).toEqual(['a']);
  });

  it.each([[429], [503]])('HTTP %i non è un rifiuto: il commit aspetta', async (status) => {
    let down = true;
    const { client, took } = await onFakeStore(() => (down ? answer(status) : undefined));
    void client.commit({ 'world/a.json': '1' }, 'a', 'agent');
    await vi.advanceTimersByTimeAsync(5200);
    expect(client.pending).toBe(1);
    down = false;
    await vi.advanceTimersByTimeAsync(30_000);
    expect(took).toEqual(['a']);
  });

  it('clone e checkout non passano sopra un commit in attesa; il ramo nemmeno; il cestino lo lascia andare', async () => {
    let down = true;
    const others: string[] = [];
    const { client } = await onFakeStore(() => (down ? noAnswer() : undefined));
    const stub = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const inner = stub.getMockImplementation() as (url: unknown, init?: RequestInit) => Promise<Response>;
    stub.mockImplementation(async (url: unknown, init?: RequestInit) => {
      if (!isCommit(url)) others.push(String(url).split('/').pop()!);
      return inner(url, init);
    });
    void client.commit({ 'world/a.json': '1' }, 'a', 'agent');
    await vi.advanceTimersByTimeAsync(5200);
    await expect(client.clone('copia', 'io')).rejects.toThrow('1 scritture in attesa');
    await expect(client.checkout('abcd')).rejects.toThrow('1 scritture in attesa');
    await expect(client.merge('master', 'pubblica')).resolves.toBeUndefined();
    await expect(client.branch('master', { 'world/x.json': '1' }, 'ramo', 'player')).resolves.toBeNull();
    expect(others).toEqual([]);
    await client.reset();
    expect(others).toEqual(['reset']);
    expect(client.pending).toBe(0);
    down = false;
    await vi.advanceTimersByTimeAsync(120_000);
    expect(client.pending).toBe(0);
  });
});
