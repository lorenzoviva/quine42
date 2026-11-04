// The site's credits page (T105): the wallet's route (server/wallet.ts), the checkout's amount, the page's pure parts.
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Connect } from 'vite';
import { linesOf, WALLET_DAYS, walletHandler } from '../server/wallet';
import { stripeHandler, type StripeRouteOptions } from '../server/stripe';
import type { AccountSettings } from '../server/account';
import { accountWanderer } from '../src/session/account';
import type { PaymentRecord } from '../src/kernel/credits';
import { checkoutTarget, cleanSearch, feeText, formatDay, formatSpent, parseAmount, returnState, returnUrlFor } from '../site/pagamenti';

function call(handler: Connect.NextHandleFunction, method: string, url: string, body?: unknown, headers: Record<string, string> = {}) {
  return new Promise<{ status: number; body: any; next?: true }>((resolve) => {
    const req = Object.assign(Readable.from(body === undefined ? [] : [Buffer.from(JSON.stringify(body))]), { method, url, headers: { host: 'localhost', 'content-type': 'application/json', ...headers }, socket: { remoteAddress: '127.0.0.1' } }) as unknown as IncomingMessage;
    const res = {
      statusCode: 200,
      setHeader() {},
      end(this: { statusCode: number }, text: string) {
        resolve({ status: this.statusCode, body: JSON.parse(text) });
      },
    } as unknown as ServerResponse;
    void handler(req as Connect.IncomingMessage, res, () => resolve({ status: 0, body: undefined, next: true }));
  });
}

const PAYMENTS = {
  eventi: {
    evt_old: { eventId: 'evt_old', sessionId: 'cs_old', wandererId: 'ugo', crediti: 5, cents: 500, timestamp: 1000 },
    evt_new: { eventId: 'evt_new', wandererId: 'ugo', crediti: 10, timestamp: 2000 },
    evt_other: { eventId: 'evt_other', sessionId: 'cs_other', wandererId: 'zed', crediti: 50, cents: 5000, timestamp: 3000 },
  },
};
const tally = (calls: number, usd: number) => ({ calls, prompt: 0, cached: 0, output: 0, thoughts: 0, usd, retries: 0, timeouts: 0, failures: 0, unpriced: 0 });
const USAGE = {
  prezzi: 'x',
  giorni: {},
  paganti: {
    '2026-10-30': { ugo: tally(3, 1), zed: tally(9, 9), comune: tally(7, 7) },
    '2026-10-31': { ugo: tally(2, 0.5) },
    '2026-11-01': { zed: tally(1, 1) },
  },
};

function diskUniverse(modalita = 'multigiocatore'): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'crediti-'));
  const root = path.join(dir, 'prova');
  mkdirSync(path.join(root, 'world', 'giocatori'), { recursive: true });
  writeFileSync(path.join(root, 'universe.json'), JSON.stringify({ partita: { modalita } }));
  writeFileSync(path.join(root, 'world/pagamenti.json'), JSON.stringify(PAYMENTS));
  writeFileSync(path.join(root, 'world/consumi.json'), JSON.stringify(USAGE));
  writeFileSync(path.join(root, 'world/giocatori/ugo.json'), JSON.stringify({ nome: 'Ugo', crediti: 3.5 }));
  writeFileSync(path.join(root, 'world/giocatori/zed.json'), JSON.stringify({ nome: 'Zed', crediti: 40 }));
  writeFileSync(path.join(root, 'world/giocatori/ano.json'), JSON.stringify({ nome: 'Ano', anonimo: true, crediti: 7 }));
  execFileSync('git', ['init', '-q'], { cwd: root });
  return dir;
}

describe('the wallet route (T105)', () => {
  it('gives a wanderer only their own lines, newest first, with what the balance really lost', async () => {
    const dir = diskUniverse();
    try {
      const r = await call(walletHandler({ universesDir: dir }), 'GET', '/api/crediti?universo=prova&viandante=ugo');
      expect(r.status).toBe(200);
      const w = r.body.portafoglio;
      expect(w).toMatchObject({ id: 'ugo', account: 'locale', anonimo: false, crediti: 3.5, multigiocatore: true, commissione: 0.01 });
      expect(w.pagamenti).toEqual([
        { id: 'evt_new', data: 2000, crediti: 10 },
        { id: 'cs_old', data: 1000, crediti: 5, cents: 500 },
      ]);
      expect(w.consumi).toEqual([
        { giorno: '2026-10-31', chiamate: 2, usd: 0.505 },
        { giorno: '2026-10-30', chiamate: 3, usd: 1.01 },
      ]);
      expect(w.totaleConsumi).toBe(1.515);
      // Nothing of anyone else's, nor the common spending, anywhere in the answer.
      const text = JSON.stringify(r.body);
      expect(text).not.toContain('cs_other');
      expect(text).not.toContain('zed');
      expect(text).not.toContain('comune');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('alone the balance is not charged: the cost carries no fee', async () => {
    const dir = diskUniverse('singola');
    try {
      const w = (await call(walletHandler({ universesDir: dir }), 'GET', '/api/crediti?universo=prova&viandante=ugo')).body.portafoglio;
      expect(w.multigiocatore).toBe(false);
      expect(w.totaleConsumi).toBe(1.5);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('the fee is the server\'s: at 0 what is shown is the cost alone, and the page says so (ADR-0130)', async () => {
    const dir = diskUniverse();
    try {
      const w = (await call(walletHandler({ universesDir: dir, platformFee: 0 }), 'GET', '/api/crediti?universo=prova&viandante=ugo')).body.portafoglio;
      expect(w.commissione).toBe(0);
      expect(w.consumi).toEqual([
        { giorno: '2026-10-31', chiamate: 2, usd: 0.5 },
        { giorno: '2026-10-30', chiamate: 3, usd: 1 },
      ]);
      expect(w.totaleConsumi).toBe(1.5);
      expect(feeText(0)).toBe('il loro costo, senza commissioni');
      expect(feeText(0.01)).toBe('il loro costo, più la commissione della piattaforma (1%)');
      expect(feeText(0.005)).toContain('(0,5%)');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('with accounts the token says who: the id in the address is ignored, no token no wallet', async () => {
    const dir = diskUniverse();
    const uid = 'ugo';
    const accounts = { verify: async (t: string) => (t === 'buono' ? { uid, anonimo: false } : undefined) } as unknown as AccountSettings;
    try {
      const h = walletHandler({ universesDir: dir, accounts });
      expect((await call(h, 'GET', '/api/crediti?universo=prova&viandante=zed')).status).toBe(401);
      expect((await call(h, 'GET', '/api/crediti?universo=prova', undefined, { authorization: 'Bearer falso' })).status).toBe(401);
      const w = (await call(h, 'GET', '/api/crediti?universo=prova&viandante=zed', undefined, { authorization: 'Bearer buono' })).body.portafoglio;
      expect(w.id).toBe(accountWanderer(uid));
      expect(w.id).not.toBe('zed');
      expect(w.account).toBe('google');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('an anonymous wanderer has no credits, whatever the file says', async () => {
    const dir = diskUniverse();
    try {
      const w = (await call(walletHandler({ universesDir: dir }), 'GET', '/api/crediti?universo=prova&viandante=ano')).body.portafoglio;
      expect(w).toMatchObject({ anonimo: true, crediti: 0 });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refuses a bad universe, an unknown one, another method, and lets other addresses pass', async () => {
    const dir = diskUniverse();
    try {
      const h = walletHandler({ universesDir: dir });
      expect((await call(h, 'GET', '/api/crediti?universo=..%2F..%2Fetc')).status).toBe(400);
      expect((await call(h, 'GET', '/api/crediti?universo=nessuno')).status).toBe(404);
      expect((await call(h, 'GET', '/api/crediti?universo=prova&viandante=..%2Fugo')).status).toBe(400);
      expect((await call(h, 'POST', '/api/crediti?universo=prova', {})).status).toBe(405);
      expect((await call(h, 'GET', '/api/altro')).next).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('broken or foreign ledgers do not break the page, and the days are bounded', () => {
    expect(linesOf([], 'non json', 'ugo', true, 0.01)).toEqual({ pagamenti: [], consumi: [], totaleConsumi: 0 });
    const junk = [null, { wandererId: 'ugo', crediti: 'tanti', timestamp: 1 }] as unknown as PaymentRecord[];
    expect(linesOf(junk, undefined, 'ugo', true, 0.01).pagamenti).toEqual([]);
    const paganti: Record<string, unknown> = {};
    for (let d = 1; d <= 28; d++) for (const m of ['10', '11']) paganti[`2026-${m}-${String(d).padStart(2, '0')}`] = { ugo: tally(1, 1) };
    const many = linesOf([], JSON.stringify({ paganti }), 'ugo', false, 0.01);
    expect(many.consumi.length).toBe(WALLET_DAYS);
    expect(many.consumi[0].giorno).toBe('2026-11-28');
    expect(many.totaleConsumi).toBe(56);
  });
});

describe('the checkout from the page (T105)', () => {
  const opts: StripeRouteOptions = { settings: { secretKey: 'mock' }, universesDir: '.' };
  const body = { universo: 'prova', wandererId: 'ugo', returnUrl: 'http://localhost/site/pagamenti.html?universo=prova' };

  it('takes the amounts the page offers and starts a session', async () => {
    for (const crediti of [1, 5, 10, 20, 50, 12.34, 1000]) {
      const r = await call(stripeHandler(opts), 'POST', '/api/stripe/checkout', { ...body, crediti });
      expect(r.status).toBe(200);
      expect(r.body.url).toMatch(/^https:\/\/checkout\.stripe\.com\//);
    }
  });

  it('refuses what is outside 1-1000 and what is no number', async () => {
    for (const crediti of [0, 0.5, -5, 1000.01, 'tanti', null]) {
      const r = await call(stripeHandler(opts), 'POST', '/api/stripe/checkout', { ...body, crediti });
      expect(r.status).toBe(400);
    }
  });

  it('credits to the cent what Stripe charges', async () => {
    let sent = '';
    const fetchFn = (async (_u: string, init: { body: string }) => {
      sent = init.body;
      return new Response(JSON.stringify({ url: 'https://checkout.stripe.com/x', id: 'cs_x' }));
    }) as unknown as typeof fetch;
    const r = await call(stripeHandler({ settings: { secretKey: 'sk_test_x', webhookSecret: 'finto', fetchFn }, universesDir: '.' }), 'POST', '/api/stripe/checkout', { ...body, crediti: 10.555 });
    expect(r.status).toBe(200);
    const q = new URLSearchParams(sent);
    expect(q.get('line_items[0][price_data][unit_amount]')).toBe('1056');
    expect(q.get('metadata[crediti]')).toBe('10.56');
  });
});

describe('the page of the credits (T105)', () => {
  it('reads an amount as the checkout wants it', () => {
    expect(parseAmount('10')).toBe(10);
    expect(parseAmount(' 12,5 ')).toBe(12.5);
    expect(parseAmount('12.345')).toBe(12.35);
    expect(parseAmount('1000')).toBe(1000);
    for (const bad of ['', '0', '0.99', '1000.01', '-5', 'abc', '1e3', '5,5,5', 'Infinity']) expect(parseAmount(bad)).toBeUndefined();
  });

  it('comes back to itself, and reads the return', () => {
    expect(returnUrlFor('http://x', '/site/pagamenti.html', 'prova')).toBe('http://x/site/pagamenti.html?universo=prova');
    expect(returnUrlFor('http://x', '/p', 'prova', 'ugo')).toBe('http://x/p?universo=prova&viandante=ugo');
    expect(returnState('?universo=a&ricarica=successo&session_id=cs_1')).toEqual({ esito: 'successo', sessione: 'cs_1' });
    expect(returnState('?ricarica=annullata&session_id=cs_1')).toEqual({ esito: 'annullata' });
    expect(returnState('?ricarica=boh')).toEqual({});
    expect(cleanSearch('?universo=a&ricarica=successo&session_id=cs_1')).toBe('?universo=a');
    expect(cleanSearch('?ricarica=annullata')).toBe('');
  });

  it('leaves the site only for an https address', () => {
    expect(checkoutTarget('https://checkout.stripe.com/c/pay/x')).toBe('https://checkout.stripe.com/c/pay/x');
    for (const bad of ['javascript:alert(1)', 'http://checkout.stripe.com', 'non un indirizzo', undefined, 5]) expect(checkoutTarget(bad)).toBeUndefined();
  });

  it('says days and small costs as they are', () => {
    expect(formatDay('2026-11-01')).toBe('1 novembre 2026');
    expect(formatDay('ieri')).toBe('ieri');
    expect(formatSpent(0.0012)).toBe('$0.0012');
    expect(formatSpent(0)).toBe('$0.00');
    expect(formatSpent(1.5)).toBe('$1.50');
  });
});
