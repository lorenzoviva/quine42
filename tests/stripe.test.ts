import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { type PaymentRecord, isPaymentProcessed, readPayments } from '../src/kernel/credits';
import {
  verifyStripeWebhookSignature,
  createFakeStripeSignature,
  createStripeCheckoutSession,
  handleStripeWebhookEvent,
  applyPaymentToUniverse,
} from '../server/stripe';

async function bootMultiplayerKernel(): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = {
    ...bundledFiles,
    'universe.json': JSON.stringify({ ...cfg, partita: { modalita: 'multigiocatore', morte: 3 } }, null, 2),
  };
  return Kernel.boot({ files, store: memoryStore(), models: new MockModels() });
}

describe('Stripe payments and idempotency (T45e)', () => {
  it('Kernel.creditRecharge credits non-anonymous wanderer and stores payment idempotently', async () => {
    const k = await bootMultiplayerKernel();
    k.addWanderer('alice', 'Alice', false);

    expect(k.creditsOf('alice')).toBe(0);

    const payment: PaymentRecord = {
      eventId: 'evt_test_1',
      sessionId: 'cs_test_1',
      wandererId: 'alice',
      crediti: 10,
      cents: 1000,
      timestamp: Date.now(),
    };

    let busNotified = false;
    k.bus.on('payment:received', (p) => {
      if (p.eventId === 'evt_test_1') busNotified = true;
    });

    // 1. First credit recharge
    const res1 = k.creditRecharge(payment);
    expect(res1.ok).toBe(true);
    expect(res1.duplica).toBeUndefined();
    expect(k.creditsOf('alice')).toBe(10);
    expect(busNotified).toBe(true);

    // Verify stored in payments file
    expect(isPaymentProcessed(k.files, 'evt_test_1')).toBe(true);
    const store = readPayments(k.files);
    expect(store.eventi['evt_test_1'].crediti).toBe(10);
    expect(store.eventi['evt_test_1'].wandererId).toBe('alice');

    // 2. Second credit recharge with exact same eventId (idempotency check)
    busNotified = false;
    const res2 = k.creditRecharge(payment);
    expect(res2.ok).toBe(true);
    expect(res2.duplica).toBe(true);
    // Balance must NOT have increased!
    expect(k.creditsOf('alice')).toBe(10);
    expect(busNotified).toBe(false);
  });

  it('Kernel.creditRecharge rejects anonymous wanderer and does not credit', async () => {
    const k = await bootMultiplayerKernel();
    k.addWanderer('anon1', 'Anonimo', true);

    expect(k.isAnonymous('anon1')).toBe(true);
    expect(k.creditsOf('anon1')).toBe(0);

    const payment: PaymentRecord = {
      eventId: 'evt_anon_1',
      sessionId: 'cs_anon_1',
      wandererId: 'anon1',
      crediti: 5,
      cents: 500,
      timestamp: Date.now(),
    };

    const res = k.creditRecharge(payment);
    expect(res.ok).toBe(false);
    expect(res.motivo).toBe('un anonimo non compra crediti');
    expect(k.creditsOf('anon1')).toBe(0);
    expect(isPaymentProcessed(k.files, 'evt_anon_1')).toBe(false);
  });

  it('verifyStripeWebhookSignature validates HMAC-SHA256 signatures with timestamp check', () => {
    const secret = 'whsec_test_secret_key_12345';
    const body = JSON.stringify({ id: 'evt_123', type: 'checkout.session.completed' });

    // Valid signature
    const validHeader = createFakeStripeSignature(body, secret);
    expect(verifyStripeWebhookSignature(body, validHeader, secret)).toBe(true);

    // Tampered body
    expect(verifyStripeWebhookSignature(body + 'tampered', validHeader, secret)).toBe(false);

    // Wrong secret
    expect(verifyStripeWebhookSignature(body, validHeader, 'whsec_wrong_key')).toBe(false);

    // Expired timestamp (> 300s)
    const oldTimestamp = Math.floor(Date.now() / 1000) - 400;
    const expiredHeader = createFakeStripeSignature(body, secret, oldTimestamp);
    expect(verifyStripeWebhookSignature(body, expiredHeader, secret)).toBe(false);

    // Malformed header
    expect(verifyStripeWebhookSignature(body, 'invalid_header', secret)).toBe(false);
    expect(verifyStripeWebhookSignature(body, '', secret)).toBe(false);
  });

  it('createStripeCheckoutSession generates checkout session URL with Stripe API / mock', async () => {
    // 1. Mock mode
    const mockSession = await createStripeCheckoutSession({
      secretKey: 'mock_key',
      universo: 'test-universo',
      wandererId: 'bob',
      crediti: 20,
      returnUrl: 'http://localhost:5173/?universo=test-universo',
    });
    expect(mockSession.id).toContain('cs_test_mock');
    expect(mockSession.url).toContain('https://checkout.stripe.com/c/pay/');

    // 2. Simulated REST API call
    let requestCaptured: { url: string; headers: HeadersInit; body: string } | undefined;
    const fakeFetch: typeof fetch = async (input, init) => {
      requestCaptured = {
        url: String(input),
        headers: init?.headers ?? {},
        body: String(init?.body),
      };
      return new Response(
        JSON.stringify({
          id: 'cs_real_123',
          url: 'https://checkout.stripe.com/c/pay/cs_real_123',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    };

    const session = await createStripeCheckoutSession({
      secretKey: 'sk_test_12345',
      universo: 'universo-alpha',
      wandererId: 'charlie',
      crediti: 15,
      returnUrl: 'http://localhost:5173/?universo=universo-alpha',
      fetchFn: fakeFetch,
    });

    expect(session.id).toBe('cs_real_123');
    expect(session.url).toBe('https://checkout.stripe.com/c/pay/cs_real_123');
    expect(requestCaptured).toBeDefined();
    expect(requestCaptured!.url).toBe('https://api.stripe.com/v1/checkout/sessions');
    expect(requestCaptured!.body).toContain('line_items%5B0%5D%5Bprice_data%5D%5Bunit_amount%5D=1500');
    expect(requestCaptured!.body).toContain('metadata%5BwandererId%5D=charlie');
    expect(requestCaptured!.body).toContain('metadata%5Buniverso%5D=universo-alpha');
    expect(requestCaptured!.body).not.toContain('payment_method_types');
    expect(requestCaptured!.body).toContain('managed_payments%5Benabled%5D=false');
  });

  it('handleStripeWebhookEvent processes checkout.session.completed idempotently', async () => {
    const k = await bootMultiplayerKernel();
    k.addWanderer('viandante1', 'Viandante 1', false);
    expect(k.creditsOf('viandante1')).toBe(0);

    const secret = 'whsec_webhook_test_secret';
    const eventPayload = {
      id: 'evt_stripe_webhook_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_stripe_1',
          payment_status: 'paid',
          amount_total: 1000,
          client_reference_id: 'viandante1',
          metadata: {
            universo: 'mondo1',
            wandererId: 'viandante1',
            crediti: '10',
          },
        },
      },
    };
    const rawBody = JSON.stringify(eventPayload);
    const signature = createFakeStripeSignature(rawBody, secret);

    const settings = {
      secretKey: 'sk_test_123',
      webhookSecret: secret,
    };

    // 1. Invalid signature should return 400
    const failSig = await handleStripeWebhookEvent({
      rawBody,
      signature: 't=123,v1=wrong',
      settings,
      universesDir: 'universes',
      getActiveKernel: async () => k,
    });
    expect(failSig.status).toBe(400);

    // 2. Valid webhook adds credits
    const outcome1 = await handleStripeWebhookEvent({
      rawBody,
      signature,
      settings,
      universesDir: 'universes',
      getActiveKernel: async () => k,
    });
    expect(outcome1.status).toBe(200);
    expect((outcome1.body as any).status).toBe('credited');
    expect(k.creditsOf('viandante1')).toBe(10);

    // 3. Duplicate delivery of same webhook (idempotency check)
    const outcome2 = await handleStripeWebhookEvent({
      rawBody,
      signature,
      settings,
      universesDir: 'universes',
      getActiveKernel: async () => k,
    });
    expect(outcome2.status).toBe(200);
    expect((outcome2.body as any).status).toBe('duplicate');
    // Still 10 credits!
    expect(k.creditsOf('viandante1')).toBe(10);
  });

  it('handleStripeWebhookEvent rejects anonymous wanderer with 403', async () => {
    const k = await bootMultiplayerKernel();
    k.addWanderer('anonimo1', 'Anon', true);

    const secret = 'whsec_webhook_secret';
    const eventPayload = {
      id: 'evt_anon_webhook',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_anon',
          payment_status: 'paid',
          amount_total: 500,
          metadata: {
            universo: 'mondo1',
            wandererId: 'anonimo1',
            crediti: '5',
          },
        },
      },
    };
    const rawBody = JSON.stringify(eventPayload);
    const signature = createFakeStripeSignature(rawBody, secret);

    const outcome = await handleStripeWebhookEvent({
      rawBody,
      signature,
      settings: { webhookSecret: secret },
      universesDir: 'universes',
      getActiveKernel: async () => k,
    });
    expect(outcome.status).toBe(403);
    expect(k.creditsOf('anonimo1')).toBe(0);
  });

  it('a payment to a universe on disk commits only its two files (T93)', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'stripe-'));
    try {
      const root = path.join(dir, 'prova');
      mkdirSync(root);
      const git = (...args: string[]) =>
        execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: root, encoding: 'utf8' });
      git('init', '-q');
      writeFileSync(path.join(root, 'altro.txt'), 'prima\n');
      git('add', '-A');
      git('commit', '-q', '-m', 'inizio');
      writeFileSync(path.join(root, 'altro.txt'), 'una modifica non committata\n');
      const payment: PaymentRecord = {
        eventId: 'evt_disco',
        sessionId: 'cs_disco',
        wandererId: 'ugo',
        crediti: 5,
        cents: 500,
        timestamp: 1,
      };
      const res = await applyPaymentToUniverse({ universesDir: dir, universo: 'prova', payment });
      expect(res.status).toBe('credited');
      expect(git('show', '--name-only', '--format=', 'HEAD').trim().split('\n').sort()).toEqual([
        'world/giocatori/ugo.json',
        'world/pagamenti.json',
      ]);
      expect(git('status', '--short').trim()).toBe('M altro.txt');
      expect(JSON.parse(readFileSync(path.join(root, 'world/giocatori/ugo.json'), 'utf8')).crediti).toBe(5);
      expect((await applyPaymentToUniverse({ universesDir: dir, universo: 'prova', payment })).status).toBe('duplicate');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
