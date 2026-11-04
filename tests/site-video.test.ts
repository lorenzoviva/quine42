// The videos' route (T244, ADR-0131): only what is on the list, only inside its folder, in pieces; a wrong piece is refused, and many slow views do not hold a file in memory.

import { closeSync, ftruncateSync, mkdirSync, mkdtempSync, openSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import net, { type AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AccountSettings } from '../server/account';
import { createProductionServer, FRONT_RATES, type FrontRates, type ProductionServer } from '../server/production';
import { listedVideos, parseRange, parseVideoList, videoFolder, videoHandler, type VideoOptions } from '../server/video';
import { readVideos, renderVideos } from '../site/video-testo';

const CONTENT = Buffer.from(Array.from({ length: 1000 }, (_, i) => i % 251));
/** A verifier is there: who asks is a stranger with a page of this site, as in production. */
const ACCOUNTS = { verify: async () => undefined } as unknown as VideoOptions['accounts'];

let work: string;
let folder: string;
let server: http.Server;
let port: number;
let handler: ReturnType<typeof videoHandler>;

const list = (video: unknown) => writeFileSync(path.join(folder, 'video.json'), JSON.stringify({ video }));

const ask = (target: string, headers: Record<string, string> = {}, method = 'GET') =>
  new Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }>((resolve, reject) => {
    const r = http.request({ host: '127.0.0.1', port, path: target, method, headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    r.on('error', reject);
    r.end();
  });

/** A request as it is written: `http.request` and `URL` would tidy the path up. */
const raw = (target: string) =>
  new Promise<string>((resolve, reject) => {
    const s = net.connect(port, '127.0.0.1', () => s.write(`GET ${target} HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n`));
    let out = '';
    s.on('data', (c) => (out += c.toString('latin1')));
    s.on('end', () => resolve(out.split('\r\n')[0]));
    s.on('error', reject);
  });

const serve = async (o: Partial<VideoOptions> = {}) => {
  await new Promise<void>((r) => (server ? server.close(() => r()) : r()));
  handler = videoHandler({ folder, accounts: ACCOUNTS, ...o });
  server = http.createServer((req, res) =>
    handler(req, res, () => {
      res.statusCode = 418;
      res.end();
    }),
  );
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  port = (server.address() as AddressInfo).port;
};

const waitFor = async (ok: () => boolean) => {
  for (let i = 0; i < 200 && !ok(); i++) await new Promise((r) => setTimeout(r, 25));
  expect(ok()).toBe(true);
};

beforeAll(async () => {
  work = mkdtempSync(path.join(os.tmpdir(), 'quine-video-'));
  folder = path.join(work, 'video');
  mkdirSync(folder);
  writeFileSync(path.join(folder, 'uno.mp4'), CONTENT);
  writeFileSync(path.join(folder, 'fuori-elenco.mp4'), CONTENT);
  writeFileSync(path.join(work, 'segreto.mp4'), 'SEGRETO');
  writeFileSync(path.join(work, '.env'), 'GEMINI_API_KEY=FINTA');
  await serve();
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((r) => server.close(() => r()));
  rmSync(work, { recursive: true, force: true });
});

describe('l’elenco', () => {
  beforeAll(() => list([{ file: 'manca.mp4', titolo: 'Non c’è' }, { file: 'uno.mp4', titolo: 'Il progetto', descrizione: 'Lungo.' }]));

  it('si vede solo ciò che ha il file, nell’ordine del file, senza dire dove sta', async () => {
    const r = await ask('/api/video');
    expect(r.status).toBe(200);
    expect(JSON.parse(r.body.toString())).toEqual({ video: [{ titolo: 'Il progetto', descrizione: 'Lungo.', url: '/api/video/uno.mp4' }] });
    expect(r.body.toString()).not.toContain(folder.replace(/\\/g, '\\\\'));
  });

  it('un video in più non chiede di riavviare, un elenco rotto non rompe nulla', async () => {
    list([{ file: 'uno.mp4', titolo: 'A' }, { file: 'fuori-elenco.mp4', titolo: 'B' }]);
    expect(JSON.parse((await ask('/api/video')).body.toString()).video.map((v: { titolo: string }) => v.titolo)).toEqual(['A', 'B']);
    writeFileSync(path.join(folder, 'video.json'), '{ non è json');
    expect(JSON.parse((await ask('/api/video')).body.toString())).toEqual({ video: [] });
    list([{ file: 'uno.mp4', titolo: 'Il progetto' }]);
  });

  it('senza la variabile non c’è nessun video', async () => {
    expect(videoFolder({})).toBeUndefined();
    expect(videoFolder({ QUINE_VIDEO: '  ' })).toBeUndefined();
    expect(await listedVideos(undefined)).toEqual([]);
  });

  it.each(['../segreto.mp4', '..\\segreto.mp4', '/etc/passwd.mp4', 'C:/x.mp4', '.nascosto.mp4', 'video.json', 'a b.mp4', 'x.mp4/../y.mp4', 'x.exe', 'x.html', 'x.svg', 'x.MP4%00', 7, null])('«%s» non è un nome di video', (file) => {
    expect(parseVideoList(JSON.stringify({ video: [{ file, titolo: 'T' }] }))).toEqual([]);
  });

  it('un titolo è un testo, e sulla pagina resta tale', () => {
    expect(parseVideoList(JSON.stringify({ video: [{ file: 'a.mp4' }, { file: 'b.mp4', titolo: 7 }, { file: 'c.mp4', titolo: ' ' }, null, 'x'] }))).toEqual([]);
    const html = renderVideos(readVideos({ video: [{ titolo: '<img src=x onerror=alert(1)>', descrizione: '"><script>alert(1)</script>', url: '/api/video/a.mp4' }] }));
    expect(html).not.toMatch(/<script|<img/i);
    expect(html).toContain('&lt;img');
    expect(readVideos({ video: [{ titolo: 'T', url: 'javascript:alert(1)' }, { titolo: 'T', url: 'https://altrove.example/x.mp4' }, { titolo: 'T', url: '/api/video/../account' }] })).toEqual([]);
    expect(readVideos(undefined)).toEqual([]);
  });
});

describe('nessun percorso fuori dalla sua cartella', () => {
  beforeAll(() => list([{ file: 'uno.mp4', titolo: 'Il progetto' }]));

  it.each([
    '/api/video/../segreto.mp4',
    '/api/video/..%2fsegreto.mp4',
    '/api/video/..%2F..%2F.env',
    '/api/video/%2e%2e/segreto.mp4',
    '/api/video/..%5csegreto.mp4',
    '/api/video/..\\segreto.mp4',
    '/api/video/%2e%2e%2f.env',
    '/api/video/uno.mp4%00',
    '/api/video/uno.mp4/',
    '/api/video/uno.mp4::$DATA',
    '/api/video/UNO.MP4',
    '/api/video/video.json',
    '/api/video/fuori-elenco.mp4',
    '/api/video/%',
    '/api/video/',
  ])('%s non c’è', async (target) => {
    const line = await raw(target);
    expect(line).not.toContain('200');
    expect(line).not.toContain('206');
  });

  it('un link nella cartella che porta fuori non è un video', async (t) => {
    try {
      symlinkSync(path.join(work, 'segreto.mp4'), path.join(folder, 'link.mp4'));
    } catch {
      return t.skip(); // Windows without the privilege to make links
    }
    list([{ file: 'link.mp4', titolo: 'Link' }]);
    expect((await ask('/api/video/link.mp4')).status).toBe(404);
    expect(JSON.parse((await ask('/api/video')).body.toString())).toEqual({ video: [] });
    list([{ file: 'uno.mp4', titolo: 'Il progetto' }]);
  });

  it('ciò che non è una lettura non passa', async () => {
    for (const method of ['POST', 'PUT', 'DELETE']) expect((await ask('/api/video/uno.mp4', {}, method)).status).toBe(405);
  });

  it('una pagina di un altro sito no; senza verificatore solo da questa macchina', async () => {
    expect((await ask('/api/video/uno.mp4', { Origin: 'https://altrove.example' })).status).toBe(403);
    await serve({ accounts: undefined });
    expect((await ask('/api/video/uno.mp4', { Host: 'altrove.example' })).status).toBe(403);
    expect((await ask('/api/video/uno.mp4')).status).toBe(200);
    await serve();
  });
});

describe('Range', () => {
  beforeAll(() => list([{ file: 'uno.mp4', titolo: 'Il progetto' }]));

  it('legge ciò che è valido', () => {
    expect(parseRange('bytes=0-99', 1000)).toEqual({ start: 0, end: 99 });
    expect(parseRange('bytes=900-', 1000)).toEqual({ start: 900, end: 999 });
    expect(parseRange('bytes=-100', 1000)).toEqual({ start: 900, end: 999 });
    expect(parseRange('bytes=-5000', 1000)).toEqual({ start: 0, end: 999 });
    expect(parseRange('bytes=990-5000', 1000)).toEqual({ start: 990, end: 999 });
    expect(parseRange('bytes=999-999', 1000)).toEqual({ start: 999, end: 999 });
  });

  it.each(['', 'bytes', 'bytes=', 'bytes=-', 'bytes=-0', 'bytes=5-2', 'bytes=1000-', 'bytes=1000-1001', 'bytes=abc-', 'bytes=-abc', 'bytes=1.5-2', 'bytes=-1-2', 'bytes=0-1,5-6', 'bytes=0-0,0-0,0-0', 'items=0-1', 'BYTES=0-1', ' bytes=0-1', 'bytes=0x10-', 'bytes=99999999999999999-', 'bytes=1e3-', 'bytes=٠-١'])('rifiuta «%s»', async (header) => {
    expect(parseRange(header, 1000)).toBe('refused');
  });

  it('un file intero, un pezzo, la fine', async () => {
    const whole = await ask('/api/video/uno.mp4');
    expect(whole.status).toBe(200);
    expect(whole.headers['accept-ranges']).toBe('bytes');
    expect(whole.headers['content-type']).toBe('video/mp4');
    expect(whole.headers['x-content-type-options']).toBe('nosniff');
    expect(whole.body.equals(CONTENT)).toBe(true);

    const piece = await ask('/api/video/uno.mp4', { Range: 'bytes=100-199' });
    expect(piece.status).toBe(206);
    expect(piece.headers['content-range']).toBe('bytes 100-199/1000');
    expect(piece.headers['content-length']).toBe('100');
    expect(piece.body.equals(CONTENT.subarray(100, 200))).toBe(true);

    const tail = await ask('/api/video/uno.mp4', { Range: 'bytes=-10' });
    expect(tail.body.equals(CONTENT.subarray(990))).toBe(true);
  });

  it.each(['bytes=abc', 'bytes=5-2', 'bytes=1000-', 'bytes=0-1,5-6', 'items=0-1'])('«%s» è un 416 che dice quanto è lungo, e nessun byte', async (range) => {
    const r = await ask('/api/video/uno.mp4', { Range: range });
    expect(r.status).toBe(416);
    expect(r.headers['content-range']).toBe('bytes */1000');
    expect(r.body.length).toBe(0);
  });

  it('riprendere un file cambiato dà quello nuovo intero; uguale, solo il pezzo', async () => {
    const etag = (await ask('/api/video/uno.mp4', {}, 'HEAD')).headers.etag as string;
    expect((await ask('/api/video/uno.mp4', { Range: 'bytes=0-9', 'If-Range': etag })).status).toBe(206);
    expect((await ask('/api/video/uno.mp4', { Range: 'bytes=0-9', 'If-Range': '"altro"' })).status).toBe(200);
    expect((await ask('/api/video/uno.mp4', { 'If-None-Match': etag })).status).toBe(304);
  });

  it('HEAD dice quanto è lungo senza mandarlo', async () => {
    const r = await ask('/api/video/uno.mp4', {}, 'HEAD');
    expect(r.status).toBe(200);
    expect(r.headers['content-length']).toBe('1000');
    expect(r.body.length).toBe(0);
  });
});

describe('quanto costa', () => {
  const GB = 1024 ** 3;
  beforeAll(() => {
    // A sparse file: long on paper, nothing on disk. Only a server that holds it in memory would pay for it.
    const fd = openSync(path.join(folder, 'lungo.mp4'), 'w');
    ftruncateSync(fd, 4 * GB);
    closeSync(fd);
    list([{ file: 'lungo.mp4', titolo: 'Lungo' }]);
  });

  /** A viewer that asks and then does not read: the worst for who sends. */
  const stalled = (at: number) =>
    new Promise<net.Socket>((resolve, reject) => {
      const s = net.connect(port, '127.0.0.1', () => {
        s.write(`GET /api/video/lungo.mp4 HTTP/1.1\r\nHost: 127.0.0.1\r\nRange: bytes=${at}-\r\n\r\n`);
        s.once('data', () => {
          s.pause();
          resolve(s);
        });
      });
      s.on('error', reject);
    });

  it('un salto in un file di 4 GB arriva subito, dal punto giusto', async () => {
    const at = 3 * GB;
    const started = Date.now();
    const piece = await new Promise<{ status: number; range: string | undefined }>((resolve, reject) => {
      const r = http.get({ host: '127.0.0.1', port, path: '/api/video/lungo.mp4', headers: { Range: `bytes=${at}-` } }, (res) => {
        res.once('data', () => {
          resolve({ status: res.statusCode ?? 0, range: res.headers['content-range'] });
          r.destroy();
        });
      });
      r.on('error', reject);
    });
    expect(Date.now() - started).toBeLessThan(5000);
    expect(piece).toEqual({ status: 206, range: `bytes ${at}-${4 * GB - 1}/${4 * GB}` });
    await waitFor(() => handler.views() === 0);
  });

  it('cento visioni ferme di un file di 4 GB tengono in memoria pochi MB, e chi se ne va libera il posto', async () => {
    await serve({ atOnce: 100, inAll: 100 });
    global.gc?.();
    const before = process.memoryUsage().arrayBuffers;
    const viewers = await Promise.all(Array.from({ length: 100 }, (_, i) => stalled(i * 1024 * 1024)));
    await waitFor(() => handler.views() === 100);
    await new Promise((r) => setTimeout(r, 300));
    const held = process.memoryUsage().arrayBuffers - before;
    // 64 KiB of read-ahead for each, and what the socket holds: a file read whole would be 400 GB.
    expect(held / 100).toBeLessThan(1024 * 1024);
    for (const v of viewers) v.destroy();
    await waitFor(() => handler.views() === 0);
  });

  it('i tetti: per indirizzo e in tutto, con 429; una lettura ferma lascia il posto', async () => {
    await serve({ atOnce: 2, inAll: 3 });
    const two = [await stalled(0), await stalled(0)];
    const third = await ask('/api/video/lungo.mp4', { Range: 'bytes=0-' });
    expect(third.status).toBe(429);
    expect(third.headers['retry-after']).toBeDefined();
    // Asking how long it is takes no place.
    expect((await ask('/api/video/lungo.mp4', {}, 'HEAD')).status).toBe(200);
    for (const s of two) s.destroy();
    await waitFor(() => handler.views() === 0);

    await serve({ stallMs: 150 });
    await stalled(0);
    await waitFor(() => handler.views() === 1);
    await waitFor(() => handler.views() === 0);
    await serve();
  });

});

describe('nel server di produzione', () => {
  const SITE = 'https://gioco.example';
  const ENV = { FIREBASE_PROJECT_ID: 'prova', FIREBASE_API_KEY: 'finta', STRIPE_WEBHOOK_SECRET: 'finto', QUINE_ORIGINI: SITE };
  let running: ProductionServer | undefined;
  const asked = { Host: 'gioco.example' };

  const start = async (env: Record<string, string>, rates: Partial<FrontRates> = {}) => {
    await running?.stop();
    running = createProductionServer({ env: { ...ENV, ...env }, dist: path.join(work, 'dist'), worldProgram: path.resolve('tests/sicurezza/fixtures/mondo-finto.mjs'), universesDir: path.join(work, 'universes'), accounts: ACCOUNTS as AccountSettings, rates });
    await new Promise<void>((r) => running!.server.listen(0, '127.0.0.1', r));
    port = (running.server.address() as AddressInfo).port;
  };

  beforeAll(() => {
    mkdirSync(path.join(work, 'dist'), { recursive: true });
    writeFileSync(path.join(work, 'dist', 'index.html'), '<!doctype html>');
    list([{ file: 'uno.mp4', titolo: 'Il progetto' }]);
  });

  afterAll(async () => {
    await running?.stop();
  });

  it('la rotta è sull’elenco: risponde a pezzi, con le intestazioni di tutte le risposte', async () => {
    await start({ QUINE_VIDEO: folder });
    expect(JSON.parse((await ask('/api/video', asked)).body.toString()).video).toHaveLength(1);
    const piece = await ask('/api/video/uno.mp4', { ...asked, Range: 'bytes=10-19' });
    expect(piece.status).toBe(206);
    expect(piece.body.equals(CONTENT.subarray(10, 20))).toBe(true);
    expect(piece.headers['content-security-policy']).toContain("default-src 'self'");
    expect((await ask('/api/video/uno.mp4', { ...asked, Range: 'bytes=9-1' })).status).toBe(416);
    expect((await ask('/api/video/uno.mp4', { ...asked, Origin: 'https://altrove.example' })).status).toBe(403);
    expect((await ask('/api/video/uno.mp4', { Host: 'altrove.example', 'X-Forwarded-For': '1.2.3.4' })).status).toBe(403);
  });

  it('senza QUINE_VIDEO non ci sono video, e il server parte lo stesso; così con una cartella che non c’è', async () => {
    await start({});
    expect(JSON.parse((await ask('/api/video', asked)).body.toString())).toEqual({ video: [] });
    expect((await ask('/api/video/uno.mp4', asked)).status).toBe(404);
    await start({ QUINE_VIDEO: path.join(work, 'non-esiste') });
    expect(JSON.parse((await ask('/api/video', asked)).body.toString())).toEqual({ video: [] });
  });

  it('i pezzi hanno il loro ritmo per indirizzo, e l’elenco non lo consuma', async () => {
    await start({ QUINE_VIDEO: folder }, { video: { burst: 2, perSecond: 0.001 } });
    expect((await ask('/api/video/uno.mp4', asked)).status).toBe(200);
    expect((await ask('/api/video/uno.mp4', asked)).status).toBe(200);
    expect((await ask('/api/video/uno.mp4', asked)).status).toBe(429);
    expect((await ask('/api/video', asked)).status).toBe(200);
  });

  it('i video aperti hanno il loro tetto', async () => {
    await start({ QUINE_VIDEO: folder }, { videosAtOnce: 0 });
    expect((await ask('/api/video/uno.mp4', asked)).status).toBe(429);
    expect((await ask('/api/video/uno.mp4', { ...asked, Range: 'bytes=0-1' })).status).toBe(429);
    expect(FRONT_RATES.videosAtOnce).toBeLessThanOrEqual(FRONT_RATES.videosInAll);
  });
});
