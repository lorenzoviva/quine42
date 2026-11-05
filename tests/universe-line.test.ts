import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { browserOwedStorage, ORPHAN_LINE_MS, OWED_MAX, OWED_MAX_BYTES, UniverseClient, type OwedStorage, type OwedWrite } from '../src/kernel/universes';

// T265 (ADR-0136 on ADR-0122): one line for every write, kept across a reload, with a ceiling; a 401 renews the token.

const noAnswer = () => Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNREFUSED' } });
const answer = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** A storage in memory, as the browser's would keep it across a reload. */
function memoryLine(): OwedStorage & { line: OwedWrite[]; saves: number } {
  const s = {
    line: [] as OwedWrite[],
    saves: 0,
    load: () => JSON.parse(JSON.stringify(s.line)) as OwedWrite[],
    save: (line: OwedWrite[]) => {
      s.saves++;
      s.line = JSON.parse(JSON.stringify(line));
      return true;
    },
  };
  return s;
}

/** A store made of a list: every write it took, as `op:label`, in order; `decide` may fail any of them. The files it has, too. */
function fakeStore(decide: (op: string, label: string, headers: Record<string, string>) => Response | Error | undefined = () => undefined) {
  const took: string[] = [];
  const asked: string[] = [];
  const files: Record<string, string | null> = {};
  vi.stubGlobal('fetch', vi.fn(async (url: unknown, init?: RequestInit) => {
    const u = String(url);
    if (u.endsWith('/api/universe')) return answer(200, { available: true });
    const m = /\/api\/universe\/[^/]+(?:\/([a-z]+)(?:\/([^/]+))?)?$/.exec(u)!;
    const op = m[1] ?? 'load';
    if (op === 'load') return answer(200, { exists: true, files: { ...files } });
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    const label = op === 'map' ? decodeURIComponent(m[2]!) : (body.message ?? op);
    asked.push(`${op}:${label}`);
    const f = decide(op, label, (init?.headers ?? {}) as Record<string, string>);
    if (f instanceof Error) throw f;
    if (f) return f;
    took.push(`${op}:${label}`);
    if (op === 'commit') Object.assign(files, body.changes);
    return answer(200, { head: `h-${label}` });
  }));
  return { took, asked, files };
}

const connect = (storage: OwedStorage | null = null) => UniverseClient.connect('sonda', '', {}, { storage }) as Promise<UniverseClient>;

describe('una fila sola per ogni scrittura (T265)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('server che cade e torna: commit, piani, rami e pubblicazioni arrivano tutti, nell’ordine in cui sono partiti', async () => {
    let down = true;
    const { took } = fakeStore(() => (down ? noAnswer() : undefined));
    const client = await connect();
    void client.commit({ 'world/a.json': '1' }, 'a', 'agent');
    await vi.advanceTimersByTimeAsync(5200);
    void client.putMap('0,0', { piano: 1 });
    void client.branch('master', { 'world/b.json': '2' }, 'ramo', 'player');
    void client.commit({ 'world/c.json': '3' }, 'c', 'agent');
    void client.merge('master', 'pubblica');
    void client.putMap('0,1', { piano: 2 });
    await vi.advanceTimersByTimeAsync(0);
    expect(client.pending).toBe(6);
    expect(took).toEqual([]);
    down = false;
    await vi.advanceTimersByTimeAsync(30_000);
    expect(took).toEqual(['commit:a', 'map:0,0', 'branch:ramo', 'commit:c', 'merge:pubblica', 'map:0,1']);
    expect(client.pending).toBe(0);
  });

  it('un piano che non passa ritenta come un commit; ciò che la fila ha è ciò che si legge', async () => {
    let down = true;
    const { took } = fakeStore(() => (down ? noAnswer() : undefined));
    const client = await connect();
    void client.putMap('3,4', { piano: 'nuovo' });
    await vi.advanceTimersByTimeAsync(5200);
    expect(client.pending).toBe(1);
    expect(await client.getMap('3,4')).toEqual({ piano: 'nuovo' });
    down = false;
    await vi.advanceTimersByTimeAsync(30_000);
    expect(took).toEqual(['map:3,4']);
  });

  it('un rifiuto del server non si ritenta, per nessuna scrittura, e non ferma quelle dopo', async () => {
    const { took, asked } = fakeStore((op) => (op === 'map' || op === 'merge' ? answer(403, { error: 'non tuo' }) : undefined));
    const client = await connect();
    await expect(client.putMap('0,0', {})).resolves.toBeUndefined();
    await expect(client.merge('master', 'pubblica')).resolves.toBeUndefined();
    await expect(client.commit({ 'world/a.json': '1' }, 'a', 'agent')).resolves.toBe('h-a');
    expect(asked).toEqual(['map:0,0', 'merge:pubblica', 'commit:a']);
    expect(took).toEqual(['commit:a']);
    expect(client.pending).toBe(0);
  });

  it('ricarica a metà fila: la pagina dopo trova le scritture, le scrive prima di leggere l’universo, in ordine', async () => {
    let down = true;
    const store = fakeStore(() => (down ? noAnswer() : undefined));
    const storage = memoryLine();
    const before = await connect(storage);
    void before.commit({ 'world/a.json': '1' }, 'a', 'agent');
    await vi.advanceTimersByTimeAsync(5200);
    void before.putMap('0,0', { piano: 1 });
    void before.commit({ 'world/b.json': '2' }, 'b', 'player');
    await vi.advanceTimersByTimeAsync(0);
    before.close(); // the page goes
    expect(storage.line.map((w) => w.kind)).toEqual(['commit', 'map', 'commit']);

    down = false;
    const after = await connect(storage);
    expect(after.pending).toBe(3);
    const snap = await after.load();
    expect(store.took).toEqual(['commit:a', 'map:0,0', 'commit:b']);
    expect(snap.files).toEqual({ 'world/a.json': '1', 'world/b.json': '2' });
    expect(after.pending).toBe(0);
    expect(storage.line).toEqual([]);
  });

  it('ciò che la fila salva non ha mai il token', async () => {
    fakeStore(() => noAnswer());
    const storage = memoryLine();
    const client = await connect(storage);
    client.identify({ Authorization: 'Bearer segreto-123' });
    void client.commit({ 'world/a.json': '1' }, 'a', 'agent');
    await vi.advanceTimersByTimeAsync(5200);
    expect(JSON.stringify(storage.line)).not.toContain('segreto-123');
  });

  it('token scaduto: un 401 rinnova il token e riprova subito, senza perdere il commit', async () => {
    const { took, asked } = fakeStore((_, __, h) => (h.Authorization === 'Bearer nuovo' ? undefined : answer(401, { error: 'token scaduto' })));
    const client = await connect();
    client.identify({ Authorization: 'Bearer vecchio' });
    let renewals = 0;
    client.renewAuth = async () => (renewals++, { Authorization: 'Bearer nuovo' });
    await expect(client.commit({ 'world/a.json': '1' }, 'a', 'agent')).resolves.toBe('h-a');
    expect(renewals).toBe(1);
    expect(asked).toEqual(['commit:a', 'commit:a']);
    expect(took).toEqual(['commit:a']);
    // The fresh token stays: the next write does not renew again.
    await client.commit({ 'world/b.json': '2' }, 'b', 'agent');
    expect(renewals).toBe(1);
  });

  it('un token che ora non si rinnova tiene il commit in fila; quando si rinnova passa', async () => {
    let online = false;
    const { took } = fakeStore((_, __, h) => (h.Authorization === 'Bearer nuovo' ? undefined : answer(401)));
    const client = await connect();
    client.renewAuth = async () => (online ? { Authorization: 'Bearer nuovo' } : undefined);
    await expect(client.commit({ 'world/a.json': '1' }, 'a', 'agent')).resolves.toBeNull();
    expect(client.pending).toBe(1);
    online = true;
    await vi.advanceTimersByTimeAsync(30_000);
    expect(took).toEqual(['commit:a']);
    expect(client.pending).toBe(0);
  });

  it('un 401 anche col token nuovo è un rifiuto; senza chi rinnova, un 401 è un rifiuto come prima', async () => {
    const { asked } = fakeStore(() => answer(401));
    const client = await connect();
    client.renewAuth = async () => ({ Authorization: 'Bearer nuovo' });
    await expect(client.commit({ 'world/a.json': '1' }, 'a', 'agent')).resolves.toBeNull();
    expect(asked).toEqual(['commit:a', 'commit:a']);
    expect(client.pending).toBe(0);
    client.renewAuth = undefined;
    await client.commit({ 'world/b.json': '2' }, 'b', 'agent');
    expect(asked.slice(2)).toEqual(['commit:b']);
  });

  it('al tetto i commit nuovi si uniscono all’ultimo in fila: la storia perde dettaglio, il disco nessun file', async () => {
    let down = true;
    const store = fakeStore(() => (down ? noAnswer() : undefined));
    const storage = memoryLine();
    const client = await connect(storage);
    void client.commit({ 'world/0.json': '0' }, 'c0', 'agent');
    await vi.advanceTimersByTimeAsync(5200);
    for (let i = 1; i < OWED_MAX + 10; i++) void client.commit({ [`world/${i}.json`]: String(i), 'world/ultimo.json': String(i) }, `c${i}`, 'agent');
    await vi.advanceTimersByTimeAsync(0);
    expect(client.pending).toBe(OWED_MAX);
    expect(storage.line).toHaveLength(OWED_MAX);
    const last = storage.line[OWED_MAX - 1] as Extract<OwedWrite, { kind: 'commit' }>;
    expect(last.message).toContain('fila piena');
    down = false;
    await vi.advanceTimersByTimeAsync(30_000);
    expect(store.took).toHaveLength(OWED_MAX);
    for (let i = 0; i < OWED_MAX + 10; i++) expect(store.files[`world/${i}.json`]).toBe(String(i));
    expect(store.files['world/ultimo.json']).toBe(String(OWED_MAX + 9));
  });

  it('oltre il tetto dei byte la fila resta in memoria e avvisa che una ricarica la perderebbe', async () => {
    fakeStore(() => noAnswer());
    const storage = memoryLine();
    const client = await connect(storage);
    const big = 'x'.repeat(Math.ceil(OWED_MAX_BYTES / 3));
    void client.commit({ 'world/a.json': big }, 'a', 'agent');
    await vi.advanceTimersByTimeAsync(5200);
    void client.commit({ 'world/b.json': big }, 'b', 'agent');
    void client.commit({ 'world/c.json': big }, 'c', 'agent');
    void client.commit({ 'world/d.json': big }, 'd', 'agent');
    await vi.advanceTimersByTimeAsync(0);
    expect(client.pending).toBe(2); // c and d folded into b: a may be in flight
    expect(storage.line.length).toBeLessThanOrEqual(3);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('una ricarica la perderebbe'));
  });
});

describe('la fila nel browser (T265)', () => {
  /** A Storage made of a Map. */
  function webStorage(): Storage {
    const m = new Map<string, string>();
    return {
      get length() {
        return m.size;
      },
      key: (i: number) => [...m.keys()][i] ?? null,
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, String(v)),
      removeItem: (k: string) => void m.delete(k),
      clear: () => m.clear(),
    } as Storage;
  }
  afterEach(() => vi.unstubAllGlobals());

  it('una ricarica trova la sua fila; quella di un’altra scheda viva no, quella di una scheda chiusa sì; ciò che non è una scrittura si scarta', () => {
    const local = webStorage();
    let now = 1_000_000;
    vi.stubGlobal('document', {});
    vi.stubGlobal('localStorage', local);
    vi.stubGlobal('sessionStorage', webStorage());
    const mine = browserOwedStorage('sonda', () => now)!;
    expect(mine.save([{ kind: 'commit', changes: { 'world/a.json': '1' }, message: 'a', author: 'agent' }])).toBe(true);

    local.setItem('quine:fila:sonda:altrascheda', JSON.stringify({ at: now, line: [{ kind: 'merge', branch: 'master', message: 'viva' }] }));
    local.setItem('quine:fila:sonda:chiusa', JSON.stringify({ at: now - ORPHAN_LINE_MS - 1, line: [{ kind: 'map', key: '0,0', data: 1 }, { kind: 'commit', changes: 'no' }, null] }));
    local.setItem('quine:fila:altro:chiusa', JSON.stringify({ at: 0, line: [{ kind: 'merge', branch: 'x', message: 'di un altro universo' }] }));

    now += 1000;
    const reloaded = browserOwedStorage('sonda', () => now)!; // same tab: same sessionStorage
    expect(reloaded.load()).toEqual([
      { kind: 'map', key: '0,0', data: 1 },
      { kind: 'commit', changes: { 'world/a.json': '1' }, message: 'a', author: 'agent' },
    ]);
    expect(local.getItem('quine:fila:sonda:chiusa')).toBeNull();
    expect(local.getItem('quine:fila:sonda:altrascheda')).not.toBeNull();
    expect(local.getItem('quine:fila:altro:chiusa')).not.toBeNull();
    reloaded.save([]);
    expect([...Array(local.length).keys()].map((i) => local.key(i))).not.toContain(expect.stringMatching(/^quine:fila:sonda:(?!altrascheda)/));
  });

  it('senza pagina (un processo Node) non c’è fila salvata', () => {
    vi.stubGlobal('localStorage', webStorage());
    vi.stubGlobal('sessionStorage', webStorage());
    expect(browserOwedStorage('sonda')).toBeUndefined();
  });
});
