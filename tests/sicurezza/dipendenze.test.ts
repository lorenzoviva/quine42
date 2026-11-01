import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { createServer, type ViteDevServer } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
// @ts-expect-error the kit is plain JavaScript, without types
import { PROBES } from '../../tools/sicurezza/catalogo.mjs';

// V-014 (T131): what `npm audit` asked of the dependencies, kept. The audit needs the network, so here only what stays true
// offline: the lock does not go back, and Vite's development server does not give `.env` in any of the kit's forms
// (the forms live in the kit: docs/sicurezza/README.md). A temporary project with a fake value.

/** The first version without the advisories seen by `npm audit` on 01/11/2026. */
const FIRST_FIXED: Record<string, string> = { vite: '7.3.7', vitest: '4.1.12', '@vitest/mocker': '4.1.12', esbuild: '0.25.0', '@grpc/grpc-js': '1.13.6' };

const older = (a: string, b: string) => {
  const [x, y] = [a, b].map((v) => v.split('-')[0].split('.').map(Number));
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i];
  return false;
};

/** A request as it is written: `fetch` would normalise the path. */
const raw = (base: string, target: string) =>
  new Promise<string>((resolve, reject) => {
    const { hostname, port } = new URL(base);
    http
      .request({ hostname, port, path: target, method: 'GET' }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      })
      .on('error', reject)
      .end();
  });

describe('le dipendenze', () => {
  const VALUE = 'FINTA-dipendenze-0123456789abcdef';
  let work: string;
  let server: ViteDevServer;
  let base: string;

  beforeAll(async () => {
    work = mkdtempSync(path.join(os.tmpdir(), 'quine-dipendenze-'));
    writeFileSync(path.join(work, '.env'), `GEMINI_API_KEY=${VALUE}\n`);
    writeFileSync(path.join(work, 'index.html'), '<!doctype html>\n');
    server = await createServer({ configFile: false, root: work, logLevel: 'silent', optimizeDeps: { noDiscovery: true }, server: { host: '127.0.0.1', port: 0, watch: null, ws: false } });
    await server.listen();
    base = `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await server?.close();
    if (work) rmSync(work, { recursive: true, force: true });
  });

  it('V-014 il lock non torna a versioni con avvisi noti', () => {
    const lock = JSON.parse(readFileSync('package-lock.json', 'utf8')) as { packages: Record<string, { version?: string }> };
    const seen = new Set<string>();
    for (const [where, info] of Object.entries(lock.packages)) {
      const name = where.split('node_modules/').pop()!;
      if (!(name in FIRST_FIXED) || !info.version) continue;
      seen.add(name);
      expect(older(info.version, FIRST_FIXED[name]), `${where}@${info.version}`).toBe(false);
    }
    expect([...seen].sort()).toEqual(Object.keys(FIRST_FIXED).sort());
  });

  it('V-014 il server di sviluppo non dà il contenuto di `.env`', async () => {
    const probes = (PROBES as { id: string; run: (ctx: unknown) => Promise<{ ok: boolean; dettaglio: string }> }[]).filter((p) => p.id.startsWith('V-014.'));
    expect(probes.length).toBeGreaterThan(0);
    const ctx = {
      workUrl: path.resolve(work).split(path.sep).join('/'),
      secrets: { GEMINI_API_KEY: VALUE },
      http: async (_method: string, target: string) => ({ text: await raw(base, target), status: 0 }),
    };
    for (const probe of probes) expect((await probe.run(ctx)).ok, probe.id).toBe(true);
    // The server does answer: silence would look like a pass.
    expect(await raw(base, '/index.html')).toContain('<!doctype html>');
  });
});
