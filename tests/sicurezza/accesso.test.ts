import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AccountSettings } from '../../server/account';
import { activeHosts, admitSocket, sessionServer } from '../../server/session';
import { worldToken } from '../../server/access';
import { ledgerOf } from '../../server/ledger';
import { universeStore } from '../../server/universeStore';
import { walletRoute } from '../../server/wallet';
import { wandererRoute } from '../../server/wanderer';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { bundledFiles } from '../../src/kernel/bundle';
import { Kernel } from '../../src/kernel/kernel';
import { memoryStore } from '../../src/kernel/repo';
import { INTERNAL_HEADER, WANDERER_HEADER } from '../../src/kernel/universes';
import { accountWanderer } from '../../src/session/account';
import { publicFiles } from '../../src/session/files';
import { fakeLink, type ClientMsg } from '../../src/session/protocol';
import { SessionServer } from '../../src/session/server';

// Who may do what (T120, ADR-0102). Every test looks at the disk or at what came back. «From outside» is a request with a
// forwarding header: it is what a tunnel or a reverse proxy adds, and the check reads it as it reads an address not on the loopback.

type Handler = (req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => void;

async function serve(plugin: { configureServer?: unknown }) {
  const handlers: Handler[] = [];
  (plugin.configureServer as (s: unknown) => void)({ middlewares: { use: (h: Handler) => handlers.push(h) } });
  const server = http.createServer((req, res) => {
    const run = (i: number): void => (handlers[i] ? handlers[i](req, res, () => run(i + 1)) : ((res.statusCode = 404), void res.end()));
    run(0);
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  return { server, base: `http://127.0.0.1:${(server.address() as AddressInfo).port}` };
}

const git = (cwd: string, args: string[]) => execFileSync('git', ['-c', 'user.name=Prove', '-c', 'user.email=prove@rune.local', '-c', 'core.autocrlf=false', ...args], { cwd, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
const JSONH = { 'Content-Type': 'application/json' };
const OUTSIDE = { 'X-Forwarded-For': '203.0.113.7' };
const INTERNAL = 'segreto-finto-del-processo';
const GOOGLE_MASTER = 'MasterUid000000000000000001';
const GOOGLE_OTHER = 'AltroUid0000000000000000002';

let dir: string;
const at = (n: string, ...p: string[]) => path.join(dir, n, ...p);

function universe(name: string, partita: object | undefined, more: Record<string, string> = {}): void {
  const files: Record<string, string> = {
    'universe.json': JSON.stringify({ name, ...(partita ? { partita } : {}) }),
    'modules/sonda/manifest.json': JSON.stringify({ id: 'sonda', name: 'Sonda', kind: 'entity', logic: 'logic.lua', carta: { autore: 'a', pagante: 'b', titolare: 'altro' } }),
    'modules/sonda/logic.lua': 'return {}\n',
    'prompts/theme.md': 'segreto del tema\n',
    'world/giocatori/altro.json': JSON.stringify({ nome: 'Altro', crediti: 5 }),
    'world/consumi.json': '{}',
    'world/bible.json': JSON.stringify({ concetto: 'Un borgo.', misteri: ['segreto della bibbia'] }),
    'world/people.json': JSON.stringify({ persone: [{ nome: 'Mirella', tipo: 'npc.contadina', mestiere: 'contadina', storia: 'segreto di Mirella', ricordi: [{ testo: 'segreto' }], carta: { autore: 'a', pagante: 'b', titolare: 'altro' } }] }),
    ...more,
  };
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(path.dirname(at(name, rel)), { recursive: true });
    writeFileSync(at(name, rel), text);
  }
  git(at(name), ['init', '-q']);
  git(at(name), ['add', '-A']);
  git(at(name), ['commit', '-q', '-m', 'nasce']);
  git(at(name), ['branch', 'rami/master']);
}

const logicOf = (n: string) => readFileSync(at(n, 'modules', 'sonda', 'logic.lua'), 'utf8');
const saldoOf = (n: string) => ledgerOf(dir, n).balance('altro');

const accounts: AccountSettings = {
  config: { projectId: 'demo' },
  masterUid: GOOGLE_MASTER,
  verify: async (t) => (t === 'master' ? { uid: GOOGLE_MASTER, anonimo: false } : t === 'altro' ? { uid: GOOGLE_OTHER, anonimo: false } : t === 'anon' ? { uid: 'AnonUid00000000000000000003', anonimo: true } : undefined),
};

let local: Awaited<ReturnType<typeof serve>>;
let withAccounts: Awaited<ReturnType<typeof serve>>;

beforeAll(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'quine-accesso-'));
  for (const n of ['molti', 'fatto', 'molti-account', 'mondo']) universe(n, { modalita: 'multigiocatore', master: 'io' });
  universe('solo', undefined);
  local = await serve(universeStore(dir, { internal: INTERNAL }));
  withAccounts = await serve(universeStore(dir, { accounts, internal: INTERNAL }));
});

afterAll(() => {
  local.server.close();
  withAccounts.server.close();
  rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
});

const asked = (base: string, method: string, p: string, body: unknown, headers: Record<string, string>) => fetch(`${base}/api/universe/${p}`, { method, headers: { ...JSONH, ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
const commitLua = (mark: string) => ({ changes: { 'modules/sonda/logic.lua': `-- ${mark}\nreturn {}\n` }, message: 'sonda', author: 'player' });

/** Every operation that writes a universe of many, with what proves it did not happen. */
const WRITES: Array<[string, string, (n: string) => string, unknown, (n: string) => boolean]> = [
  ['commit', 'POST', (n) => `${n}/commit`, commitLua('V-001-tabella'), (n) => !logicOf(n).includes('V-001-tabella')],
  ['checkout', 'POST', (n) => `${n}/checkout`, { id: 'abcd' }, () => true],
  ['reset', 'POST', (n) => `${n}/reset`, {}, (n) => existsSync(at(n))],
  ['branch', 'POST', (n) => `${n}/branch`, { branch: 'sonda', files: { 'world/x.txt': 'x' }, message: 'x' }, (n) => !git(at(n), ['for-each-ref', 'refs/heads/rami/sonda']).trim()],
  ['merge', 'POST', (n) => `${n}/merge`, { branch: 'master', message: 'x' }, (n) => !!git(at(n), ['for-each-ref', 'refs/heads/rami/master']).trim()],
  ['clone', 'POST', (n) => `${n}/clone`, { nome: 'clone-tabella', master: 'intruso' }, () => !existsSync(at('clone-tabella'))],
  ['PUT map', 'PUT', (n) => `${n}/map/9_9`, {}, (n) => !existsSync(at(n, 'maps', '9_9.json'))],
];

describe('V-001 chi scrive su un universo in multigiocatore', () => {
  for (const [op, method, url, body, untouched] of WRITES) {
    it(`V-001 ${op}: rifiutato senza identità e a un viandante che non è il master`, async () => {
      for (const headers of [{}, { [WANDERER_HEADER]: 'altro' }] as Array<Record<string, string>>) expect((await asked(local.base, method, url('molti'), body, headers)).status).toBe(403);
      expect(untouched('molti')).toBe(true);
    });

    it(`V-001 ${op}: rifiutato con un account che non è il master, con un anonimo e senza account`, async () => {
      for (const headers of [{}, { Authorization: 'Bearer altro' }, { Authorization: 'Bearer anon' }, { [WANDERER_HEADER]: 'io' }] as Array<Record<string, string>>) expect((await asked(withAccounts.base, method, url('molti-account'), body, headers)).status).toBe(403);
      expect((await asked(withAccounts.base, method, url('molti-account'), body, { Authorization: 'Bearer falso' })).status).toBe(401);
      expect(untouched('molti-account')).toBe(true);
    });

    it(`V-001 ${op}: da fuori, senza account, non passa nemmeno chi dice di essere il master`, async () => {
      expect((await asked(local.base, method, url('molti'), body, { ...OUTSIDE, [WANDERER_HEADER]: 'io' })).status).toBe(403);
      expect(untouched('molti')).toBe(true);
    });
  }

  it('V-001 il master scrive il Lua e il mondo del server anche, ma i saldi solo il mondo', async () => {
    expect((await asked(local.base, 'POST', 'fatto/commit', commitLua('master'), { [WANDERER_HEADER]: 'io' })).status).toBe(200);
    expect(logicOf('fatto')).toContain('master');
    expect((await asked(local.base, 'POST', 'fatto/commit', commitLua('mondo'), { [INTERNAL_HEADER]: worldToken(INTERNAL, 'fatto') })).status).toBe(200);
    expect(logicOf('fatto')).toContain('mondo');
    const saldo = { changes: { 'world/giocatori/altro.json': JSON.stringify({ nome: 'Altro', crediti: 999 }) }, message: 'x' };
    expect((await asked(local.base, 'POST', 'fatto/commit', saldo, { [WANDERER_HEADER]: 'io' })).status).toBe(403);
    expect(saldoOf('fatto')).toBe(5);
    // Not even the world's commit makes a balance: a file is not where they are (ADR-0104).
    expect((await asked(local.base, 'POST', 'fatto/commit', saldo, { [INTERNAL_HEADER]: worldToken(INTERNAL, 'fatto') })).status).toBe(200);
    expect(saldoOf('fatto')).toBe(5);
    expect((await asked(local.base, 'POST', 'fatto/commit', commitLua('falso'), { [INTERNAL_HEADER]: 'un-altro-segreto' })).status).toBe(403);
    // A world's token opens its universe, not another's; the secret it is made from is not a token; and a world does not clone (ADR-0110).
    expect((await asked(local.base, 'POST', 'fatto/commit', commitLua('altrui'), { [INTERNAL_HEADER]: worldToken(INTERNAL, 'molti') })).status).toBe(403);
    expect((await asked(local.base, 'POST', 'fatto/commit', commitLua('segreto'), { [INTERNAL_HEADER]: INTERNAL })).status).toBe(403);
    expect((await asked(local.base, 'POST', 'fatto/clone', { nome: 'clone-del-mondo', master: 'io' }, { [INTERNAL_HEADER]: worldToken(INTERNAL, 'fatto') })).status).toBe(403);
    expect(existsSync(at('clone-del-mondo'))).toBe(false);
  });

  it('V-001 con gli account il master è chi lo prova, anche il master `io` di prima degli account', async () => {
    expect((await asked(withAccounts.base, 'POST', 'molti-account/commit', commitLua('con-account'), { Authorization: 'Bearer master', ...OUTSIDE })).status).toBe(200);
    expect(logicOf('molti-account')).toContain('con-account');
  });

  it('V-001 un clone lo fa solo il master, e il nuovo master non è chi lo fa', async () => {
    const r = await asked(local.base, 'POST', 'fatto/clone', { nome: 'clone-buono', master: 'anna' }, { [WANDERER_HEADER]: 'io' });
    expect(r.status).toBe(200);
    expect(JSON.parse(readFileSync(at('clone-buono', 'universe.json'), 'utf8')).partita.master).toBe('anna');
  });

  it('V-001 un\'altra origine e un corpo che non è JSON non scrivono, nemmeno per il master', async () => {
    const master = { [WANDERER_HEADER]: 'io' };
    expect((await asked(local.base, 'POST', 'fatto/commit', commitLua('altra-origine'), { ...master, Origin: 'http://altro.example' })).status).toBe(403);
    expect((await asked(local.base, 'POST', 'fatto/commit', commitLua('testo'), { ...master, 'Content-Type': 'text/plain' })).status).toBe(415);
    const put = await fetch(`${local.base}/api/universe/fatto/map/8_8`, { method: 'PUT', headers: { ...master, 'Content-Type': 'text/plain' }, body: '{}' });
    expect(put.status).toBe(415);
    expect(logicOf('fatto')).not.toContain('altra-origine');
    expect(logicOf('fatto')).not.toContain('testo');
    expect(existsSync(at('fatto', 'maps', '8_8.json'))).toBe(false);
    // The page of this very server does write.
    expect((await asked(local.base, 'POST', 'fatto/commit', commitLua('stessa-origine'), { ...master, Origin: local.base })).status).toBe(200);
  });
});

describe('V-001 fare un universo', () => {
  const many = (master: string) => ({ files: { 'universe.json': JSON.stringify({ name: 'x', partita: { modalita: 'multigiocatore', master } }), 'world/giocatori/io.json': JSON.stringify({ crediti: 1000 }) }, message: 'x' });

  it('V-001 in multigiocatore non si fa senza identità, né da anonimi, né da fuori senza account', async () => {
    expect((await asked(local.base, 'POST', 'nuovo-a/create', many('intruso'), {})).status).toBe(403);
    expect((await asked(withAccounts.base, 'POST', 'nuovo-a/create', many('intruso'), { Authorization: 'Bearer anon' })).status).toBe(403);
    expect((await asked(local.base, 'POST', 'nuovo-a/create', many('intruso'), { ...OUTSIDE, [WANDERER_HEADER]: 'io' })).status).toBe(403);
    expect(existsSync(at('nuovo-a'))).toBe(false);
  });

  it('V-001 il master è chi lo fa, non ciò che dicono i file, e non porta saldi', async () => {
    expect((await asked(withAccounts.base, 'POST', 'nuovo-b/create', many('intruso'), { Authorization: 'Bearer altro', ...OUTSIDE })).status).toBe(200);
    expect(JSON.parse(readFileSync(at('nuovo-b', 'universe.json'), 'utf8')).partita.master).toBe(accountWanderer(GOOGLE_OTHER));
    expect(existsSync(at('nuovo-b', 'world', 'giocatori', 'io.json'))).toBe(false);
    expect((await asked(local.base, 'POST', 'nuovo-c/create', many('intruso'), { [WANDERER_HEADER]: 'io' })).status).toBe(200);
    expect(JSON.parse(readFileSync(at('nuovo-c', 'universe.json'), 'utf8')).partita.master).toBe('io');
  });

  it('V-001 da fuori con un account un universo è sempre in multigiocatore', async () => {
    const alone = { files: { 'universe.json': JSON.stringify({ name: 'x' }) }, message: 'x' };
    expect((await asked(withAccounts.base, 'POST', 'nuovo-d/create', alone, { Authorization: 'Bearer altro', ...OUTSIDE })).status).toBe(200);
    expect(JSON.parse(readFileSync(at('nuovo-d', 'universe.json'), 'utf8')).partita).toMatchObject({ modalita: 'multigiocatore', master: accountWanderer(GOOGLE_OTHER) });
  });
});

describe('V-001 chi legge', () => {
  const SECRETS = ['modules/sonda/logic.lua', 'prompts/theme.md', 'world/giocatori/altro.json', 'world/consumi.json'];

  it('V-001 un non master legge solo ciò che è pubblico, e niente storia', async () => {
    for (const [base, headers] of [[local.base, {}], [local.base, { [WANDERER_HEADER]: 'altro' }], [withAccounts.base, { Authorization: 'Bearer altro' }]] as Array<[string, Record<string, string>]>) {
      const snap = (await (await asked(base, 'GET', 'molti', undefined, headers)).json()) as { exists: boolean; files: Record<string, string>; log?: unknown };
      expect(snap.exists).toBe(true);
      for (const p of SECRETS) expect(snap.files[p], p).toBeUndefined();
      expect(JSON.stringify(snap.files)).not.toContain('segreto');
      expect(snap.log).toBeUndefined();
      // What the hub and the lobby show.
      expect(JSON.parse(snap.files['universe.json']).partita.modalita).toBe('multigiocatore');
      expect(JSON.parse(snap.files['world/bible.json']).concetto).toBe('Un borgo.');
      expect(JSON.parse(snap.files['world/people.json']).persone[0].mestiere).toBe('contadina');
    }
  });

  it('V-001 il master e il mondo leggono tutto', async () => {
    for (const headers of [{ [WANDERER_HEADER]: 'io' }, { [INTERNAL_HEADER]: worldToken(INTERNAL, 'molti') }] as Array<Record<string, string>>) {
      const snap = (await (await asked(local.base, 'GET', 'molti', undefined, headers)).json()) as { files: Record<string, string>; log?: unknown[] };
      for (const p of SECRETS) expect(snap.files[p], p).toBeDefined();
      expect(snap.log?.length).toBeGreaterThan(0);
    }
  });

  it('V-001 i piani, l\'elenco dei luoghi e il ramo sono del master', async () => {
    for (const p of ['molti/maps', 'molti/map/0_0', 'molti/branch/master']) {
      expect((await asked(local.base, 'GET', p, undefined, {})).status, p).toBe(403);
      expect((await asked(local.base, 'GET', p, undefined, { [WANDERER_HEADER]: 'io' })).status, p).not.toBe(403);
    }
  });

  it('V-001 le carte si misurano sul server: stesse impronte, senza il codice', async () => {
    const r = (await (await asked(local.base, 'GET', 'molti/carte', undefined, {})).json()) as { carte: Array<{ id: string; impronta?: number[]; titolare: string }>; files: Record<string, string> };
    expect(r.carte.map((c) => c.id)).toEqual(expect.arrayContaining(['tipo:sonda', 'persona:mirella']));
    expect(r.carte.find((c) => c.id === 'tipo:sonda')?.impronta?.length).toBeGreaterThan(0);
    for (const p of SECRETS) expect(r.files[p], p).toBeUndefined();
    expect(JSON.stringify(r)).not.toContain('segreto');
  });

  it('V-001 la scheda pubblica non dice le storie, anche sul seme', () => {
    const files = publicFiles(bundledFiles);
    expect(Object.keys(files).filter((p) => p.endsWith('.lua') && !/^modules\/core\.(movement|carpet)\//.test(p))).toEqual([]);
    expect(Object.keys(files).filter((p) => /^(prompts|world\/(giocatori|consumi|pagamenti|grafo|stato|lessico|canone|atlas-privato))/.test(p))).toEqual([]);
  });

  it('V-001 da fuori senza account non risponde nulla, nemmeno l\'elenco', async () => {
    expect((await fetch(`${local.base}/api/universe`, { headers: OUTSIDE })).status).toBe(403);
    expect((await asked(local.base, 'GET', 'molti', undefined, OUTSIDE)).status).toBe(403);
    expect((await fetch(`${local.base}/api/universe`, { headers: { Origin: 'http://altro.example' } })).status).toBe(403);
  });
});

describe('V-001 la partita in singola, su questa macchina', () => {
  it('V-001 funziona come sempre, senza identità: nasce, legge, scrive, torna indietro', async () => {
    const files = { 'universe.json': JSON.stringify({ name: 'x' }) };
    expect((await asked(local.base, 'POST', 'solo-nuovo/create', { files, message: 'x' }, {})).status).toBe(200);
    expect((await asked(local.base, 'POST', 'solo/commit', commitLua('in-singola'), {})).status).toBe(200);
    expect(logicOf('solo')).toContain('in-singola');
    const snap = (await (await asked(local.base, 'GET', 'solo', undefined, {})).json()) as { files: Record<string, string>; log: unknown[] };
    expect(snap.files['modules/sonda/logic.lua']).toContain('in-singola');
    expect(snap.log.length).toBeGreaterThan(1);
    const first = git(at('solo'), ['rev-list', '--max-parents=0', 'HEAD']).trim();
    expect((await asked(local.base, 'POST', 'solo/checkout', { id: first }, {})).status).toBe(200);
    expect(logicOf('solo')).not.toContain('in-singola');
    expect((await asked(local.base, 'PUT', 'solo/map/1_1', {}, {})).status).toBe(200);
  });

  it('V-001 anche su un server con gli account, ma solo da questa macchina', async () => {
    expect((await asked(withAccounts.base, 'POST', 'solo/commit', commitLua('in-singola-2'), {})).status).toBe(200);
    expect((await asked(withAccounts.base, 'POST', 'solo/commit', commitLua('da-fuori'), { Authorization: 'Bearer altro', ...OUTSIDE })).status).toBe(403);
    expect(logicOf('solo')).not.toContain('da-fuori');
  });
});

describe('V-006 il viandante e i crediti del sito', () => {
  let open: { server: http.Server; base: string };
  let verified: { server: http.Server; base: string };
  beforeAll(async () => {
    const stack = (a?: AccountSettings) => ({ configureServer(s: { middlewares: { use(h: Handler): void } }) {
      for (const p of [wandererRoute({ accounts: a, universesDir: dir }), walletRoute({ accounts: a, universesDir: dir })]) (p.configureServer as unknown as (x: unknown) => void)(s);
    } });
    open = await serve(stack());
    verified = await serve(stack(accounts));
  });
  afterAll(() => {
    open.server.close();
    verified.server.close();
  });

  for (const route of ['viandante', 'crediti']) {
    it(`V-006 /api/${route}: l'id detto dalla pagina vale solo da questa macchina`, async () => {
      const r = await fetch(`${open.base}/api/${route}?universo=molti&viandante=altro`, { headers: OUTSIDE });
      expect(r.status).toBe(403);
      expect(await r.text()).not.toContain('crediti');
      expect((await fetch(`${open.base}/api/${route}?universo=molti&viandante=altro`, { headers: { Origin: 'http://altro.example' } })).status).toBe(403);
    });

    it(`V-006 /api/${route}: con gli account non si chiede il saldo di un altro`, async () => {
      expect((await fetch(`${verified.base}/api/${route}?universo=molti&viandante=altro`)).status).toBe(401);
      const r = await fetch(`${verified.base}/api/${route}?universo=molti&viandante=altro`, { headers: { Authorization: 'Bearer anon' } });
      const body = (await r.json()) as { viandante?: { id: string; crediti: number }; portafoglio?: { id: string; crediti: number } };
      const seen = body.viandante ?? body.portafoglio;
      expect(seen?.id).not.toBe('altro');
      expect(seen?.crediti).toBe(0);
    });
  }

  it('V-006 POST /api/viandante cambia il profilo, mai i crediti, e solo in JSON', async () => {
    const post = (headers: Record<string, string>) => fetch(`${open.base}/api/viandante`, { method: 'POST', headers, body: JSON.stringify({ universo: 'molti', viandante: 'altro', profilo: { nome: 'Sonda', crediti: 1000 }, crediti: 1000 }) });
    expect((await post({ 'Content-Type': 'text/plain' })).status).toBe(415);
    expect((await post(JSONH)).status).toBe(200);
    expect(saldoOf('molti')).toBe(5);
  });
});

describe('V-006 la sessione', () => {
  const socket = (remoteAddress: string, headers: Record<string, string>) => ({ socket: { remoteAddress }, headers: { host: 'localhost:5173', ...headers } });

  it('V-006 senza verificatore il WebSocket entra solo da questa macchina', () => {
    expect(admitSocket(socket('127.0.0.1', {}), undefined, false)).toEqual({ offline: false });
    expect(admitSocket(socket('::1', { origin: 'http://localhost:5173' }), undefined, false)).toEqual({ offline: false });
    expect(admitSocket(socket('192.168.1.5', {}), undefined, false)).toHaveProperty('refused');
    expect(admitSocket(socket('127.0.0.1', { 'x-forwarded-for': '203.0.113.7' }), undefined, false)).toHaveProperty('refused');
    expect(admitSocket(socket('127.0.0.1', { host: 'altro.example' }), undefined, false)).toHaveProperty('refused');
  });

  it('V-006 un\'altra origine non apre il WebSocket, con o senza account', () => {
    for (const a of [undefined, accounts]) expect(admitSocket(socket('127.0.0.1', { origin: 'http://altro.example' }), a, false)).toHaveProperty('refused');
    expect(admitSocket(socket('203.0.113.7', { host: 'quine.example', origin: 'https://quine.example' }), accounts, false)).toEqual({ offline: false });
  });

  it('V-006 con gli account il primo client non decide i modelli del mondo', () => {
    expect(admitSocket(socket('203.0.113.7', { host: 'quine.example' }), accounts, true)).toEqual({ offline: false });
    expect(admitSocket(socket('127.0.0.1', {}), undefined, true)).toEqual({ offline: true });
  });

  it('V-006 GET /api/session non elenca i viandanti', async () => {
    const route = await serve({ configureServer: (s: object) => (sessionServer().configureServer as unknown as (x: unknown) => void)({ ...s }) });
    activeHosts.set('elenco', Promise.resolve({ name: 'elenco', stop() {}, session: { connect() {}, clientCount: 1, connected: () => ['sonda-elenco'] } }));
    try {
      const r = await fetch(`${route.base}/api/session`);
      const text = await r.text();
      expect(text).toContain('elenco');
      expect(text).not.toContain('sonda-elenco');
      expect((await fetch(`${route.base}/api/session`, { headers: OUTSIDE })).status).toBe(403);
    } finally {
      activeHosts.delete('elenco');
      route.server.close();
    }
  });

  async function world(opts: ConstructorParameters<typeof SessionServer>[1] = {}) {
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, partita: { modalita: 'multigiocatore', morte: 3 } }, null, 2) };
    const kernel = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    return { kernel, server: new SessionServer(kernel, opts) };
  }

  /** A client that says what it wants; `got` has all that came back. */
  function client(server: SessionServer, entra: Record<string, unknown>) {
    const { server: s, client: c } = fakeLink();
    const got: Array<Record<string, unknown>> = [];
    c.onMessage((m) => got.push(m as unknown as Record<string, unknown>));
    server.connect(s);
    c.send({ t: 'entra', ...entra } as never);
    return { c, got };
  }

  it('V-006 con un verificatore l\'id detto non conta: il master non lo diventa nessuno dicendolo', async () => {
    const { server } = await world({ verify: accounts.verify });
    const { got } = client(server, { id: 'io', token: 'altro' });
    await new Promise((r) => setTimeout(r, 10));
    const ingresso = got.find((m) => m.t === 'ingresso');
    expect(ingresso?.id).toBe(accountWanderer(GOOGLE_OTHER));
    expect(ingresso?.master).toBeFalsy();
  });

  it('V-006 senza token, con un verificatore, non si entra', async () => {
    const { server } = await world({ verify: accounts.verify });
    const { got } = client(server, { id: 'io' });
    await new Promise((r) => setTimeout(r, 10));
    expect(got.find((m) => m.t === 'ingresso')).toBeUndefined();
    expect(got.find((m) => m.t === 'rifiuto')).toBeTruthy();
  });

  it('V-006 il tetto resta entro il saldo: nessuno alza i budget del mondo dicendolo', async () => {
    const { kernel, server } = await world();
    const before = kernel.ai.limits!.text;
    client(server, { id: 'carlo', tetto: 1e9 });
    expect(kernel.sessionCapOf('carlo')).toBe(0);
    expect(kernel.ai.limits!.text).toBe(before);
  });

  it('V-006 rientrare non aggiunge di nuovo lo stesso budget', async () => {
    const { kernel } = await world();
    const before = kernel.ai.limits!.text;
    kernel.setSessionCap('carlo', 1);
    const once = kernel.ai.limits!.text;
    expect(once).toBeGreaterThan(before);
    kernel.setSessionCap('carlo', 1);
    expect(kernel.ai.limits!.text).toBe(once);
  });

  it('V-001 nessun messaggio del protocollo fa scrivere codice a un non master', async () => {
    const { kernel, server } = await world();
    const { c, got } = client(server, { id: 'sonda', nome: 'Sonda' });
    expect(got.find((m) => m.t === 'ingresso')?.master).toBeFalsy();
    const MARK = '-- V-001-protocollo';
    const lua = `${MARK}\nreturn {}\n`;
    const modules = () => Object.entries(kernel.files).filter(([p]) => p.startsWith('modules/'));
    const before = JSON.stringify(modules());
    const first = kernel.repo.log().length;
    // Each message a client can send, by hand, with code wherever there is room for text.
    const asked: Array<Record<string, unknown>> = [
      { t: 'ramo', files: { 'modules/core.movement/logic.lua': lua }, base: {} },
      { t: 'pubblica' },
      { t: 'agente', agente: 'ingegnere', testo: lua },
      { t: 'segui', id: 'io' },
      { t: 'frase', tokens: [MARK, 'x', '=', '1'] },
      { t: 'incidi' },
      { t: 'pronuncia' },
      { t: 'profilo', profilo: { nome: MARK, presentazione: lua, logic: lua } },
      { t: 'dici', viandante: 'io', testo: lua },
      { t: 'dai', viandante: 'io', slot: 0 },
      { t: 'oggetto', op: 'azione', slot: 0, azione: lua },
      { t: 'contenitore', op: 'apri', entita: 1, slot: 0 },
      { t: 'pannello', op: 'pulsante', pannello: 'core.movement', posto: lua, azione: lua, slot: 0 },
      { t: 'casella', col: 0, row: 0, azione: lua },
      { t: 'azione', entita: 1, azione: lua },
      { t: 'chat', entita: 1, testo: lua },
      { t: 'file', files: { 'modules/core.movement/logic.lua': lua } },
      { t: 'commit', changes: { 'modules/core.movement/logic.lua': lua } },
      { t: 'sconosciuto', logic: lua },
    ];
    asked.forEach((m, i) => c.send({ ...m, seq: 100 + i } as unknown as ClientMsg));
    for (let i = 0; i < 12; i++) {
      server.tick(1 / 60);
      await new Promise((r) => setTimeout(r, 0));
    }
    const said = got.filter((m) => m.t === 'esito' && typeof m.seq === 'number');
    for (const [i, name] of [[0, 'ramo'], [1, 'pubblica'], [2, 'agente'], [3, 'segui']] as Array<[number, string]>) expect(said.find((m) => m.seq === 100 + i)?.ok, name).toBe(false);
    expect(JSON.stringify(modules())).toBe(before);
    expect(JSON.stringify(kernel.files)).not.toContain(`${MARK}\\nreturn`);
    expect(server.branchFiles()).toEqual({});
    expect(kernel.repo.log().length).toBeGreaterThanOrEqual(first);
  });
});
