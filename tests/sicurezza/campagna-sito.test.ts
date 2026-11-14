// V-042 (T377, ADR-0202): the campaign from the site, the store's `campaign` route. Only the master of a universe of many reads and writes the
// directives and the regions; never a world's token, a player, a stranger; a private universe is not there for whoever does not see it; what does
// not hold leaves the universe as it was; the body has a cap. Fake values only.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { universeHandler } from '../../server/universeStore';
import { CampaignArchive } from '../../server/campaign';
import { worldToken } from '../../server/access';
import { ATLAS_FILE } from '../../src/kernel/atlas';
import { CAMPAIGN_FILE } from '../../src/kernel/campaign';
import { INTERNAL_HEADER, WANDERER_HEADER } from '../../src/kernel/universes';
import { KERNEL_VERSION } from '../../src/kernel/version';

const LAYOUTS = JSON.stringify({ id: 'world.layouts', name: 'Ambienti', kind: 'data', layouts: { lake: { name: 'Lago', description: 'acqua' } } });
const region = { name: 'Le Acque Ferme', center: [4, 0], radius: 1, kind: 'filler', environment: 'lake' };

describe('V-042 la campagna dal sito', () => {
  let dir: string;
  let port: number;
  let server: http.Server;
  const git = (root: string, ...a: string[]) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd: root, encoding: 'utf8', windowsHide: true }).trim();
  const ask = (method: string, target: string, o: { body?: unknown; raw?: string; who?: string; headers?: Record<string, string> } = {}) =>
    new Promise<{ status: number; body: any }>((resolve, reject) => {
      const r = http.request(
        { host: '127.0.0.1', port, path: target, method, headers: { Host: `127.0.0.1:${port}`, 'Content-Type': 'application/json', ...(o.who ? { [WANDERER_HEADER]: o.who } : {}), ...o.headers } },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf8');
            resolve({ status: res.statusCode ?? 0, body: text ? JSON.parse(text) : undefined });
          });
        },
      );
      r.on('error', () => resolve({ status: 0, body: undefined }));
      r.end(o.raw ?? (o.body === undefined ? undefined : JSON.stringify(o.body)));
      void reject;
    });

  beforeAll(async () => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'quine-campagna-v042-'));
    for (const name of ['mondo', 'segreto']) {
      const root = path.join(dir, name);
      mkdirSync(path.join(root, 'modules', 'world.layouts'), { recursive: true });
      writeFileSync(path.join(root, 'universe.json'), JSON.stringify({ kernel: KERNEL_VERSION, game: { mode: 'multiplayer', master: 'anna' } }));
      writeFileSync(path.join(root, 'modules', 'world.layouts', 'manifest.json'), LAYOUTS);
      git(root, 'init', '-q');
      git(root, 'add', '-A');
      git(root, 'commit', '-q', '-m', 'nasce');
    }
    const campaigns = CampaignArchive.of(dir);
    campaigns.change('segreto', (c) => {
      c.private = true;
      c.guests.bruno = { since: Date.now(), by: 'anna' };
    });
    const handler = universeHandler(dir, { internal: 'segreto-del-test', campaigns });
    server = http.createServer((req, res) => handler(req as never, res, () => ((res.statusCode = 404), res.end('{}'))));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    port = (server.address() as AddressInfo).port;
  });
  afterAll(async () => {
    await new Promise<void>((r) => server.close(() => r()));
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  });

  it('V-042 legge e scrive solo il master: non un giocatore, non chi non dice chi è, non il token del mondo', async () => {
    const head = git(path.join(dir, 'mondo'), 'rev-parse', 'HEAD');
    for (const o of [{ who: 'bruno' }, {}, { headers: { [INTERNAL_HEADER]: worldToken('segreto-del-test', 'mondo') } }]) {
      expect((await ask('GET', '/api/universe/mondo/campaign', o)).status).toBe(403);
      expect((await ask('POST', '/api/universe/mondo/campaign', { ...o, body: { op: 'region', region } })).status).toBe(403);
      expect((await ask('POST', '/api/universe/mondo/campaign', { ...o, body: { op: 'text', text: '## Per tutti\n- x' } })).status).toBe(403);
    }
    expect(git(path.join(dir, 'mondo'), 'rev-parse', 'HEAD')).toBe(head);
  });

  it('V-042 un universo privato non c’è per chi non lo vede; un ospite lo vede ma non ne scrive la campagna', async () => {
    expect((await ask('GET', '/api/universe/segreto/campaign', { who: 'carlo' })).status).toBe(404);
    expect((await ask('POST', '/api/universe/segreto/campaign', { who: 'carlo', body: { op: 'release', id: 'master-1' } })).status).toBe(404);
    expect((await ask('GET', '/api/universe/segreto/campaign', { who: 'bruno' })).status).toBe(403);
    expect((await ask('GET', '/api/universe/segreto/campaign', { who: 'anna' })).status).toBe(200);
  });

  it('V-042 ciò che non regge lascia l’universo com’era, col motivo; un corpo troppo grande non si legge', async () => {
    const root = path.join(dir, 'mondo');
    const head = git(root, 'rev-parse', 'HEAD');
    const bad = [
      { op: 'region', region: { ...region, name: '<b>x</b>'.repeat(20) } },
      { op: 'region', region: { ...region, environment: '__proto__' } },
      { op: 'region', region: { ...region, center: [0, 0], radius: 3 } },
      { op: 'release', id: 'cartografo-1' },
      { op: 'text', text: '## Sezione nuova\n- x' },
      { op: 'text', text: 7 },
      { op: 'boh' },
    ];
    for (const body of bad) {
      const r = await ask('POST', '/api/universe/mondo/campaign', { who: 'anna', body });
      expect(r.status, JSON.stringify(body)).toBe(400);
      expect(typeof r.body.error).toBe('string');
    }
    const huge = await ask('POST', '/api/universe/mondo/campaign', { who: 'anna', raw: JSON.stringify({ op: 'text', text: 'x'.repeat(200 * 1024) }) });
    expect(huge.status).toBeGreaterThanOrEqual(400);
    expect(git(root, 'rev-parse', 'HEAD')).toBe(head);
    expect(() => readFileSync(path.join(root, ATLAS_FILE))).toThrow();
    expect(() => readFileSync(path.join(root, CAMPAIGN_FILE))).toThrow();
  });

  it('V-042 il master scrive soltanto i due file della campagna, con un commit', async () => {
    const root = path.join(dir, 'mondo');
    const r = await ask('POST', '/api/universe/mondo/campaign', { who: 'anna', body: { op: 'region', region, path: 'world/state.json' } });
    expect(r.status).toBe(200);
    expect(git(root, 'show', '--name-only', '--format=', 'HEAD')).toBe(ATLAS_FILE);
  });
});
