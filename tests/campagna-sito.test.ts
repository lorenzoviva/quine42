// The campaign from the site (T377, ADR-0202): the master's directives and regions through the store's `campaign` route, as the console and the
// Direction do in the game. Pure on the files (src/kernel/campaignEdit.ts); on the disk when the world is not running, a commit of the universe's
// line; through the world when it is (`WorldCalls.campaign`), a commit of its main line. Only the master of a universe of many, never a world.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { universeHandler, type UniverseStoreOptions } from '../server/universeStore';
import { worldOf } from '../server/worldCalls';
import { worldToken } from '../server/access';
import { campaignEdit, campaignSeen, CAMPAIGN_TEXT_CHARS, environmentsIn, readCampaignEdit } from '../src/kernel/campaignEdit';
import { ATLAS_FILE, readAtlas } from '../src/kernel/atlas';
import { CAMPAIGN_FILE, campaignTemplate } from '../src/kernel/campaign';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { INTERNAL_HEADER, WANDERER_HEADER } from '../src/kernel/universes';
import { KERNEL_VERSION } from '../src/kernel/version';

const LAYOUTS = JSON.stringify({ id: 'world.layouts', name: 'Ambienti', kind: 'data', layouts: { woods: { name: 'Bosco', description: 'alberi' }, lake: { name: 'Lago', description: 'acqua' } } });
const FILES = { 'universe.json': JSON.stringify({ kernel: KERNEL_VERSION, game: { mode: 'multiplayer', master: 'anna' } }), 'modules/world.layouts/manifest.json': LAYOUTS };
const filler = { name: 'Le Acque Ferme', description: 'un lago che non finisce', center: [4, 0], radius: 2, kind: 'filler', environment: 'lake' };

describe('la campagna sui file, una funzione pura (T377)', () => {
  it('gli ambienti dai manifest, le direttive col modello quando non ci sono', () => {
    expect(environmentsIn(FILES)).toEqual({ woods: { name: 'Bosco' }, lake: { name: 'Lago' } });
    expect(environmentsIn({ 'modules/x/manifest.json': '{rotto' })).toEqual({});
    const seen = campaignSeen(FILES, environmentsIn(FILES));
    expect(seen).toMatchObject({ template: true, text: campaignTemplate('it'), regions: [] });
    expect(seen.environments.map((e) => e.name)).toEqual(['Bosco', 'Lago']);
  });

  it('legge dal filo solo le tre richieste, coi tipi giusti', () => {
    expect(readCampaignEdit({ op: 'text', text: 'x' })).toEqual({ op: 'text', text: 'x' });
    expect(readCampaignEdit({ op: 'release', id: 'master-1' })).toEqual({ op: 'release', id: 'master-1' });
    for (const junk of [null, 42, [], { op: 'text', text: 3 }, { op: 'region', region: [] }, { op: 'release' }, { op: 'boh' }]) expect(readCampaignEdit(junk)).toBeUndefined();
  });

  it('le direttive come le controlla il validatore; le righe fuori dal mondo dette, non rifiutate', () => {
    const ok = campaignEdit(FILES, { op: 'text', text: '# Campagna\n\n## Per tutti\n- La siccità dura da tre anni.\n- Il master scrive il codice del mondo.' }, environmentsIn(FILES));
    expect('path' in ok && ok.path).toBe(CAMPAIGN_FILE);
    expect('path' in ok && ok.done.left?.length).toBe(1);
    const bad = campaignEdit(FILES, { op: 'text', text: '## Sezione che non esiste\n- niente' }, environmentsIn(FILES));
    expect(bad).toMatchObject({ ok: false });
    expect(campaignEdit(FILES, { op: 'text', text: 'x'.repeat(CAMPAIGN_TEXT_CHARS + 1) }, {})).toMatchObject({ ok: false });
  });

  it('le regioni come le controlla il kernel: un ambiente che il mondo ha, e Libera solo le regioni del master', () => {
    const env = environmentsIn(FILES);
    const made = campaignEdit(FILES, { op: 'region', region: filler }, env);
    if (!('path' in made)) throw new Error(made.reasons.join());
    expect(made.path).toBe(ATLAS_FILE);
    const atlas = readAtlas({ [ATLAS_FILE]: made.text });
    expect(atlas.regions).toEqual([expect.objectContaining({ id: 'master-1', master: true, kind: 'filler', environment: 'lake' })]);
    expect(campaignEdit(FILES, { op: 'region', region: { ...filler, environment: 'deserto' } }, env)).toMatchObject({ ok: false });
    const after = { ...FILES, [ATLAS_FILE]: made.text };
    const freed = campaignEdit(after, { op: 'release', id: 'master-1' }, env);
    expect('path' in freed && readAtlas({ [ATLAS_FILE]: freed.text }).regions).toEqual([]);
    expect(campaignEdit(after, { op: 'release', id: 'cartografo-1' }, env)).toMatchObject({ ok: false });
  });
});

interface Answer {
  status: number;
  body: any;
}

async function serveStore(dir: string, o: UniverseStoreOptions = {}) {
  const handler = universeHandler(dir, { internal: 'segreto', ...o });
  const server = http.createServer((req, res) => handler(req as never, res, () => ((res.statusCode = 404), res.end('{}'))));
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const port = (server.address() as AddressInfo).port;
  const ask = (method: string, target: string, opts: { body?: unknown; who?: string; headers?: Record<string, string> } = {}) =>
    new Promise<Answer>((resolve, reject) => {
      const r = http.request(
        { host: '127.0.0.1', port, path: target, method, headers: { Host: `127.0.0.1:${port}`, ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(opts.who ? { [WANDERER_HEADER]: opts.who } : {}), ...opts.headers } },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf8');
            resolve({ status: res.statusCode ?? 0, body: text ? JSON.parse(text) : undefined });
          });
        },
      );
      r.on('error', reject);
      r.end(opts.body === undefined ? undefined : JSON.stringify(opts.body));
    });
  return { ask, close: () => new Promise<void>((r) => server.close(() => r())) };
}

const git = (root: string, ...a: string[]) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd: root, encoding: 'utf8', windowsHide: true }).trim();

function universe(dir: string, name: string, files: Record<string, string>) {
  const root = path.join(dir, name);
  for (const [p, t] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, p)), { recursive: true });
    writeFileSync(path.join(root, p), t);
  }
  git(root, 'init', '-q');
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'nasce');
  return root;
}

describe('la rotta campaign dello store (T377)', () => {
  let dir: string;
  let store: Awaited<ReturnType<typeof serveStore>>;
  beforeAll(async () => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'quine-campagna-'));
    universe(dir, 'mondo', { ...FILES, 'maps/1_0.json': JSON.stringify({ plan: { place: { name: 'Il guado' }, layout: 'woods' } }), 'maps/x.json': '{}' });
    universe(dir, 'solo', { 'universe.json': JSON.stringify({ kernel: KERNEL_VERSION }) });
    universe(dir, 'vecchio', { ...FILES, 'universe.json': JSON.stringify({ kernel: '0.6.3', game: { mode: 'multiplayer', master: 'anna' } }) });
    store = await serveStore(dir);
  });
  afterAll(async () => {
    await store.close();
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  });

  it('solo il master di un universo di molti, mai il token del mondo', async () => {
    expect((await store.ask('GET', '/api/universe/mondo/campaign', { who: 'bruno' })).status).toBe(403);
    expect((await store.ask('POST', '/api/universe/mondo/campaign', { who: 'bruno', body: { op: 'release', id: 'master-1' } })).status).toBe(403);
    expect((await store.ask('GET', '/api/universe/mondo/campaign', { headers: { [INTERNAL_HEADER]: worldToken('segreto', 'mondo') } })).status).toBe(403);
    expect((await store.ask('GET', '/api/universe/solo/campaign')).status).toBe(409);
    expect((await store.ask('GET', '/api/universe/nessuno/campaign', { who: 'anna' })).status).toBe(404);
    expect((await store.ask('POST', '/api/universe/mondo/campaign', { who: 'anna', body: { op: 'boh' } })).status).toBe(400);
    const plain = await store.ask('POST', '/api/universe/mondo/campaign', { who: 'anna', headers: { 'Content-Type': 'text/plain' } });
    expect(plain.status).toBe(415);
  });

  it('a mondo spento legge dal disco e scrive con un commit: le direttive, una regione, Libera', async () => {
    const root = path.join(dir, 'mondo');
    const seen = await store.ask('GET', '/api/universe/mondo/campaign', { who: 'anna' });
    expect(seen.status).toBe(200);
    expect(seen.body).toMatchObject({ ok: true, running: false, template: true, regions: [], places: [{ cx: 1, cy: 0, name: 'Il guado', layout: 'woods' }] });
    expect(seen.body.environments).toEqual([{ id: 'woods', name: 'Bosco' }, { id: 'lake', name: 'Lago' }]);

    const text = '# Campagna\n\n## Narratore\n- Primo atto: la siccità.\n';
    const saved = await store.ask('POST', '/api/universe/mondo/campaign', { who: 'anna', body: { op: 'text', text } });
    expect(saved.body).toMatchObject({ ok: true, done: { ok: true }, text, template: false });
    expect(readFileSync(path.join(root, CAMPAIGN_FILE), 'utf8')).toBe(text);
    expect(git(root, 'log', '-1', '--format=%s')).toBe('direttive del master (dal sito)');

    const wrong = await store.ask('POST', '/api/universe/mondo/campaign', { who: 'anna', body: { op: 'text', text: '## Chi?\n- x' } });
    expect(wrong.status).toBe(400);
    expect(wrong.body.reasons.length).toBeGreaterThan(0);
    expect(readFileSync(path.join(root, CAMPAIGN_FILE), 'utf8')).toBe(text);

    const region = await store.ask('POST', '/api/universe/mondo/campaign', { who: 'anna', body: { op: 'region', region: filler } });
    expect(region.body).toMatchObject({ ok: true, done: { ok: true, region: { id: 'master-1', kind: 'filler' } } });
    expect(readAtlas({ [ATLAS_FILE]: readFileSync(path.join(root, ATLAS_FILE), 'utf8') }).regions.map((r) => r.id)).toEqual(['master-1']);
    expect(git(root, 'log', '-1', '--format=%s')).toContain('Le Acque Ferme');
    const over = await store.ask('POST', '/api/universe/mondo/campaign', { who: 'anna', body: { op: 'region', region: { ...filler, center: [0, 0] } } });
    expect(over.status).toBe(400);

    const freed = await store.ask('POST', '/api/universe/mondo/campaign', { who: 'anna', body: { op: 'release', id: 'master-1' } });
    expect(freed.body).toMatchObject({ ok: true, regions: [] });
    expect(git(root, 'log', '-1', '--format=%s')).toContain('liberata');
  });

  it('un universo di un altro contratto non si scrive dal sito: lo porta il suo mondo', async () => {
    const r = await store.ask('POST', '/api/universe/vecchio/campaign', { who: 'anna', body: { op: 'region', region: filler } });
    expect(r.status).toBe(409);
    expect((await store.ask('GET', '/api/universe/vecchio/campaign', { who: 'anna' })).status).toBe(200);
  });

  it('a mondo acceso lo fa il mondo: il disco non si tocca, e ciò che il mondo rifiuta torna col motivo', async () => {
    const asked: unknown[] = [];
    const lit = await serveStore(dir, {
      worlds: {
        campaign: async (_name, edit) => {
          asked.push(edit);
          if (edit?.op === 'release') return { seen: campaignSeen({}, {}), done: { ok: false, reasons: ['nessuna regione del master con questo nome'] } };
          return { seen: campaignSeen({ [CAMPAIGN_FILE]: 'dal mondo' }, {}), ...(edit ? { done: { ok: true, said: 'fatto' } } : {}) };
        },
      },
    });
    try {
      const head = git(path.join(dir, 'mondo'), 'rev-parse', 'HEAD');
      expect((await lit.ask('GET', '/api/universe/mondo/campaign', { who: 'anna' })).body).toMatchObject({ running: true, text: 'dal mondo' });
      expect((await lit.ask('POST', '/api/universe/mondo/campaign', { who: 'anna', body: { op: 'region', region: filler } })).body).toMatchObject({ ok: true, running: true, done: { said: 'fatto' } });
      const no = await lit.ask('POST', '/api/universe/mondo/campaign', { who: 'anna', body: { op: 'release', id: 'x' } });
      expect(no.status).toBe(400);
      expect(git(path.join(dir, 'mondo'), 'rev-parse', 'HEAD')).toBe(head);
      expect(asked).toEqual([undefined, { op: 'region', region: filler }, { op: 'release', id: 'x' }]);
    } finally {
      await lit.close();
    }
  });
});

describe('la campagna nel mondo acceso (T377)', () => {
  it('il mondo scrive le direttive e le regioni nella sua linea, e le usa subito', async () => {
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, game: { mode: 'multiplayer', death: 3 } }, null, 2) };
    const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    const calls = worldOf(k);
    const env = Object.keys(k.content.layouts)[0];
    const seen = await calls.campaign();
    expect(seen.seen.environments.length).toBe(Object.keys(k.content.layouts).length);
    const r = await calls.campaign({ op: 'region', region: { ...filler, environment: env } });
    expect(r.done).toMatchObject({ ok: true, region: { id: 'master-1' } });
    expect(readAtlas(k.files).regions.some((x) => x.id === 'master-1' && x.master)).toBe(true);
    expect(k.repo.head().message).toContain('Le Acque Ferme');
    const t = await calls.campaign({ op: 'text', text: '## Per tutti\n- Il conte nega l’acqua.\n' });
    expect(t.done).toMatchObject({ ok: true });
    expect(k.files[CAMPAIGN_FILE]).toContain('Il conte nega');
    expect(t.seen.text).toContain('Il conte nega');
    const bad = await calls.campaign({ op: 'region', region: { ...filler, environment: 'non-esiste' } });
    expect(bad.done).toMatchObject({ ok: false });
  });
});

describe('la campagna nella pagina della sessione (T377)', () => {
  it('di chi è un universo lo dice il server (l’istantanea intera), e il privato si dice a chi lo vede', async () => {
    const { parseUniverseSnapshot } = await import('../site/sessioni');
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, game: { mode: 'multiplayer', master: 'anna' } }) };
    expect(parseUniverseSnapshot('mondo', files, undefined, { mine: true, invite: true })).toMatchObject({ isMine: true, many: true, invite: true });
    expect(parseUniverseSnapshot('mondo', files, undefined, { mine: false })).toMatchObject({ isMine: false, many: true, invite: false });
    expect(parseUniverseSnapshot('seme', bundledFiles).many).toBe(false);
  });

  it('l’elenco degli universi con gli intestatari di chi guarda, e quelli su invito', async () => {
    const { fetchUniverseIndex } = await import('../site/sessioni');
    const seen: Array<Record<string, string>> = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      seen.push((init?.headers ?? {}) as Record<string, string>);
      return { ok: true, json: async () => ({ available: true, universes: ['a', 'b', 3], invite: ['b'] }) } as Response;
    }) as typeof fetch;
    try {
      expect(await fetchUniverseIndex('', { [WANDERER_HEADER]: 'anna' })).toEqual({ universes: ['a', 'b'], invite: ['b'] });
      expect(seen[0]).toEqual({ [WANDERER_HEADER]: 'anna' });
    } finally {
      globalThis.fetch = original;
    }
  });

  it('il link dell’invito porta il token nel frammento; l’atlante arriva fin dove arrivano luoghi e regioni, entro un tetto', async () => {
    const { atlasReach, inviteLink } = await import('../site/campagna');
    expect(inviteLink('https://quine.example', 'il mondo', 'tok_EN')).toBe('https://quine.example/?universo=il%20mondo#invito=tok_EN');
    expect(atlasReach([], [])).toBe(7);
    expect(atlasReach([{ cx: -9, cy: 2 }], [])).toBe(10);
    expect(atlasReach([], [{ center: [10, 0], radius: 3 }])).toBe(14);
    expect(atlasReach([{ cx: 500, cy: 0 }], [])).toBe(24);
  });
});
