import { spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { Readable } from 'node:stream';
import type { Connect } from 'vite';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { contentSecurityPolicy, securityHeaders } from '../../server/csp';
import { createFakeStripeSignature, handleStripeWebhookEvent, sameOriginReturn, stripeHandler } from '../../server/stripe';
import { parseUniverseSnapshot, renderUniverseCard } from '../../site/sessioni';
// @ts-expect-error a plain .mjs of the kit, without types
import { cleanEnv, fakeSecrets, makeProject, removeProject, REPO } from '../../tools/sicurezza/ambiente.mjs';

// The small ones (T132): what a page shows, where a payment comes back to, what an error tells, what a build contains. Fake values only.

const HOST = 'gioco.example:4000';
const ELSEWHERE = 'http://altro.example/dopo';
const DETAIL = 'DETTAGLIO-INTERNO-FINTO';

function call(handler: Connect.NextHandleFunction, url: string, body: unknown, headers: Record<string, string> = {}) {
  return new Promise<{ status: number; text: string }>((resolve) => {
    const raw = typeof body === 'string' ? body : JSON.stringify(body);
    const req = Object.assign(Readable.from([Buffer.from(raw)]), { method: 'POST', url, headers: { host: HOST, 'content-type': 'application/json', ...headers }, socket: { remoteAddress: '127.0.0.1' } }) as unknown as IncomingMessage;
    const res = {
      statusCode: 200,
      setHeader() {},
      end(this: { statusCode: number }, text: string) {
        resolve({ status: this.statusCode, text });
      },
    } as unknown as ServerResponse;
    void handler(req as Connect.IncomingMessage, res, () => resolve({ status: 0, text: '' }));
  });
}

/** A fake Stripe: what it was told to send the payer back to, and an answer of ours. */
function fakeStripe(answer: () => Response = () => new Response(JSON.stringify({ url: 'https://checkout.stripe.com/x', id: 'cs_x' }))) {
  const back: string[] = [];
  const fetchFn = (async (_u: string, init: { body: string }) => {
    back.push(new URLSearchParams(init.body).get('success_url') ?? '');
    return answer();
  }) as unknown as typeof fetch;
  return { back, fetchFn };
}

// With accounts, as a server that has a public address like HOST: without, it would answer only this machine (V-028).
const checkout = { universo: 'prova', wandererId: 'ugo', crediti: 5, token: 'finto' };
const settings = (fetchFn: typeof fetch) => ({ settings: { secretKey: 'FINTA-chiave', webhookSecret: 'FINTO-segreto', fetchFn }, universesDir: '.', accounts: { config: {}, verify: async () => ({ uid: 'ugo', anonymous: false }) } });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('V-015: ciò che una pagina mostra, e dove torna un pagamento', () => {
  it('V-015 un seme che non è un numero non diventa HTML nella pagina degli universi', () => {
    const html = '<img id="sonda" src=x>';
    const files = { 'universe.json': JSON.stringify({ name: 'sonda', seed: html, ai: { textModel: 'x', minimi: { tetto: html } } }) };
    const universe = parseUniverseSnapshot('sonda', files, { name: 'sonda', active: true, clients: html as unknown as number });
    expect(universe.seed).toBe(0);
    vi.stubGlobal('document', { createElement: () => ({ dataset: {} }) });
    const card = renderUniverseCard({ ...universe, master: html, description: html, name: html });
    expect(card.innerHTML).toContain('SEME #0');
    expect(card.innerHTML).not.toContain('<img');
  });

  it('V-015 il seme numerico si vede come è', () => {
    expect(parseUniverseSnapshot('sonda', { 'universe.json': JSON.stringify({ name: 'sonda', seed: 42 }) }).seed).toBe(42);
  });

  it('V-015 il checkout rifiuta un ritorno su un altro sito, in ogni forma', async () => {
    const { back, fetchFn } = fakeStripe();
    const forms = [ELSEWHERE, `http://${HOST}@altro.example/`, `http://x:y@${HOST}/`, '//altro.example/', 'javascript:alert(1)', `ftp://${HOST}/`, 'dopo', 7, { a: 1 }, `http://${HOST}.altro.example/`];
    for (const returnUrl of forms) {
      const r = await call(stripeHandler(settings(fetchFn)), '/api/stripe/checkout', { ...checkout, returnUrl });
      expect(r.status, String(returnUrl)).toBe(400);
    }
    expect(back).toEqual([]);
  });

  it('V-015 il checkout torna alla pagina di questo server', async () => {
    const { back, fetchFn } = fakeStripe();
    const r = await call(stripeHandler(settings(fetchFn)), '/api/stripe/checkout', { ...checkout, returnUrl: `http://${HOST}/site/pagamenti.html?universo=prova#in-fondo` });
    expect(r.status).toBe(200);
    expect(back[0]).toBe(`http://${HOST}/site/pagamenti.html?universo=prova&ricarica=successo&session_id={CHECKOUT_SESSION_ID}`);
    expect(sameOriginReturn(`http://${HOST.toUpperCase()}/`, HOST)).toBe(`http://${HOST}/`);
  });

  it('V-015 senza ritorno detto, un Origin di un altro sito non decide dove si torna', async () => {
    const { back, fetchFn } = fakeStripe();
    expect((await call(stripeHandler(settings(fetchFn)), '/api/stripe/checkout', checkout, { origin: 'https://altro.example' })).status).toBe(403);
    await call(stripeHandler(settings(fetchFn)), '/api/stripe/checkout', checkout);
    await call(stripeHandler(settings(fetchFn)), '/api/stripe/checkout', checkout, { origin: `https://${HOST}` });
    expect(new URL(back[0]).host).toBe(HOST);
    expect(new URL(back[0]).pathname).toBe('/');
    expect(back[1].startsWith(`https://${HOST}/?universo=prova`)).toBe(true);
  });

  it('V-015 la CSP non lascia eseguire script scritti nella pagina, né fuori da questa origine', () => {
    const policy = contentSecurityPolicy();
    const script = /script-src ([^;]*)/.exec(policy)?.[1] ?? '';
    expect(script).toBe("'self' 'wasm-unsafe-eval'");
    for (const closed of ["object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'", "frame-src 'none'", "default-src 'self'"]) expect(policy).toContain(closed);
  });

  it('V-015 la CSP apre Firebase solo dove ci sono gli account, e nulla di ciò che non è un host', () => {
    const policy = contentSecurityPolicy({ projectId: 'p', authDomain: 'p.firebaseapp.com', emulator: 'localhost:9099' });
    expect(policy).toContain('https://apis.google.com');
    expect(policy).toContain('frame-src https://p.firebaseapp.com http://localhost:9099');
    expect(policy).toContain('http://localhost:9099');
    const dressed = contentSecurityPolicy({ projectId: 'p', authDomain: 'x; script-src *' });
    expect(dressed).not.toContain('script-src *');
    expect(dressed).toContain("frame-src 'none'");
    expect(contentSecurityPolicy()).not.toContain('google');
  });

  it('V-015 il server di sviluppo e la preview mettono la CSP a ogni risposta', () => {
    expect(readFileSync('vite.config.ts', 'utf8')).toMatch(/securityHeaders\(accounts\.config\)/);
    for (const hook of ['configureServer', 'configurePreviewServer'] as const) {
      let handler: ((req: unknown, res: { setHeader(n: string, v: string): void }, next: () => void) => void) | undefined;
      (securityHeaders()[hook] as unknown as (s: unknown) => void)({ middlewares: { use: (h: typeof handler) => (handler = h) } });
      const headers: Record<string, string> = {};
      let went = false;
      handler!({}, { setHeader: (n, v) => (headers[n] = v) }, () => (went = true));
      expect(headers['Content-Security-Policy']).toBe(contentSecurityPolicy());
      expect(went).toBe(true);
    }
  });

  it('V-015 la CSP viene prima di ogni rotta: anche il 404 di ciò che si nasconde e le risposte delle sessioni la portano (T170)', () => {
    const config = readFileSync('vite.config.ts', 'utf8');
    const first = config.slice(config.indexOf('plugins: ['));
    const policy = first.indexOf('securityHeaders(accounts.config)');
    expect(policy).toBeGreaterThan(-1);
    for (const later of ['hideUniverses(', 'geminiProxy(', 'universeStore(', 'sessionServer(']) {
      expect(first.indexOf(later), later).toBeGreaterThan(policy);
    }
  });

  it('V-015 nessuna pagina ha script o gestori scritti nell’HTML, che la CSP fermerebbe', () => {
    const pages = ['index.html', 'lab/3d/index.html', 'lab/editor/index.html', 'lab/suono/index.html', ...readdirSync('site').filter((f) => f.endsWith('.html')).map((f) => `site/${f}`)];
    expect(pages.length).toBeGreaterThan(5);
    for (const page of pages) {
      const html = readFileSync(page, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
      expect(html, page).not.toMatch(/<[a-z][^>]*\son[a-z]+\s*=/i);
      for (const tag of html.matchAll(/<script\b([^>]*)>/gi)) expect(tag[1], page).toMatch(/\bsrc=/);
    }
  });
});

describe('V-016: ciò che un errore dice, e ciò che una build contiene', () => {
  it('V-016 il testo d’errore di Stripe resta nel log, senza la chiave, e al client una frase sola', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { fetchFn } = fakeStripe(() => new Response(`${DETAIL} FINTA-chiave`, { status: 400 }));
    const r = await call(stripeHandler(settings(fetchFn)), '/api/stripe/checkout', checkout);
    expect(r.status).toBe(500);
    expect(r.text).not.toContain(DETAIL);
    expect(r.text).not.toContain('Stripe API');
    const logged = warn.mock.calls.flat().join(' ');
    expect(logged).toContain(DETAIL);
    expect(logged).not.toContain('FINTA-chiave');
  });

  it('V-016 una richiesta che non si legge non racconta perché', async () => {
    const { fetchFn } = fakeStripe();
    const r = await call(stripeHandler(settings(fetchFn)), '/api/stripe/checkout', '{non è json');
    expect(r.status).toBe(400);
    expect(r.text).not.toMatch(/JSON|position|token/i);
    expect((await call(stripeHandler(settings(fetchFn)), '/api/stripe/checkout', 'null')).status).toBe(400);
  });

  it('V-016 un accredito che fallisce non dice al chiamante percorsi e nomi', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const event = JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed', data: { object: { id: 'cs_1', payment_status: 'paid', amount_total: 500, currency: 'usd', metadata: { universo: 'non-esiste', wandererId: 'ugo' } } } });
    const r = await handleStripeWebhookEvent({ rawBody: event, signature: createFakeStripeSignature(event, 'FINTO-segreto'), settings: { webhookSecret: 'FINTO-segreto' }, universesDir: path.join(REPO, 'cartella-che-non-esiste') });
    expect(r.status).toBe(500);
    expect(JSON.stringify(r.body)).not.toContain('non-esiste');
    expect(warn.mock.calls.flat().join(' ')).toContain('non-esiste');
  });

  it('V-016 nessun valore finto dei segreti in dist/ dopo una build con un ambiente di prova', async () => {
    const secrets = fakeSecrets();
    const work = await makeProject(secrets);
    try {
      const code = await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [path.join(REPO, 'tools', 'sicurezza', 'server.mjs'), 'build'], { cwd: work, env: cleanEnv(work), stdio: 'ignore', windowsHide: true });
        child.on('error', reject);
        child.on('exit', resolve);
      });
      expect(code).toBe(0);
      const dist = path.join(work, 'dist');
      expect(existsSync(path.join(dist, 'index.html'))).toBe(true);
      const values = Object.values(secrets) as string[];
      const found: string[] = [];
      let seen = 0;
      for (const f of readdirSync(dist, { recursive: true })) {
        const file = path.join(dist, String(f));
        if (!statSync(file).isFile()) continue;
        seen++;
        const bytes = readFileSync(file);
        if (values.some((v) => bytes.includes(v))) found.push(String(f));
      }
      expect(seen).toBeGreaterThan(5);
      expect(found).toEqual([]);
    } finally {
      expect(await removeProject(work)).toBeUndefined();
    }
  }, 600000);
});
