// Dev server: Stripe Checkout payments and webhooks (T45e, ADR-0083).
// Allows wanderers to top up their credits via Stripe Checkout (with Google Pay support).
// The webhook receives `checkout.session.completed` events and credits the wanderer idempotently,
// recording payments in `world/pagamenti.json`. Keys stay strictly server-side.
// Anonymous accounts cannot purchase credits.

import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import crypto from 'node:crypto';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { execFile } from 'node:child_process';
import type { AccountSettings } from './account';
import { accountWanderer } from '../src/session/account';
import type { Kernel } from '../src/kernel/kernel';
import {
  PAYMENTS_FILE,
  type PaymentRecord,
  isPaymentProcessed,
  recordPayment,
} from '../src/kernel/credits';
import { playerFile, readWandererState, validWandererId, type WandererState } from '../src/kernel/wanderers';

export interface StripeSettings {
  secretKey?: string;
  webhookSecret?: string;
  publishableKey?: string;
  /** Product tax code for Stripe Managed Payments; without it the session turns Managed Payments off (T93). */
  taxCode?: string;
  fetchFn?: typeof fetch;
}

export function stripeSettings(env: Record<string, string | undefined>): StripeSettings {
  return {
    secretKey: env.STRIPE_SECRET_KEY?.trim() || undefined,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET?.trim() || undefined,
    publishableKey: env.STRIPE_PUBLISHABLE_KEY?.trim() || undefined,
    taxCode: env.STRIPE_TAX_CODE?.trim() || undefined,
  };
}

const MAX_BODY = 1024 * 1024;
const NAME_RE = /^[a-z0-9][a-z0-9-]{0,40}$/;

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function readRawBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) reject(new Error('richiesta troppo grande'));
      else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** Verifies a Stripe webhook signature (HMAC-SHA256 with timestamp tolerance). */
export function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
  toleranceSec = 300,
): boolean {
  if (!signatureHeader || !secret) return false;
  const parts = signatureHeader.split(',');
  let timestamp = 0;
  const signatures: string[] = [];

  for (const part of parts) {
    const [k, v] = part.trim().split('=');
    if (k === 't') {
      timestamp = parseInt(v, 10);
    } else if (k === 'v1') {
      signatures.push(v);
    }
  }

  if (!timestamp || signatures.length === 0) return false;

  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - timestamp) > toleranceSec) {
    return false;
  }

  const payload = `${timestamp}.${rawBody}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload, 'utf8');
  const expectedSig = hmac.digest('hex');

  for (const sig of signatures) {
    try {
      if (
        sig.length === expectedSig.length &&
        crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))
      ) {
        return true;
      }
    } catch {
      // continue to next signature
    }
  }
  return false;
}

/** Generates a valid Stripe signature header for testing with fake webhooks. */
export function createFakeStripeSignature(
  rawBody: string,
  secret: string,
  timestamp = Math.floor(Date.now() / 1000),
): string {
  const payload = `${timestamp}.${rawBody}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload, 'utf8');
  const sig = hmac.digest('hex');
  return `t=${timestamp},v1=${sig}`;
}

/** Creates a Stripe Checkout Session via Stripe REST API. */
export async function createStripeCheckoutSession(opts: {
  secretKey: string;
  universo: string;
  wandererId: string;
  crediti: number;
  returnUrl: string;
  taxCode?: string;
  fetchFn?: typeof fetch;
}): Promise<{ url: string; id: string }> {
  if (opts.secretKey === 'mock' || opts.secretKey.startsWith('mock_')) {
    const mockId = `cs_test_mock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    return {
      id: mockId,
      url: `https://checkout.stripe.com/c/pay/${mockId}`,
    };
  }

  const amountCents = Math.round(opts.crediti * 100);
  const body = new URLSearchParams();
  body.set('mode', 'payment');
  // No payment_method_types: Stripe refuses it now; the methods (cards, Google Pay…) come from the Dashboard (T93)
  body.set('line_items[0][price_data][currency]', 'usd');
  body.set('line_items[0][price_data][unit_amount]', String(amountCents));
  body.set('line_items[0][price_data][product_data][name]', `Ricarica crediti QUINE42 (${opts.crediti} crediti)`);
  body.set('line_items[0][quantity]', '1');
  // Managed Payments (on by default) wants a product tax code: with one it stays on, without it is off for this session
  if (opts.taxCode) body.set('line_items[0][price_data][product_data][tax_code]', opts.taxCode);
  else body.set('managed_payments[enabled]', 'false');
  body.set('metadata[universo]', opts.universo);
  body.set('metadata[wandererId]', opts.wandererId);
  body.set('metadata[crediti]', String(opts.crediti));
  body.set('client_reference_id', opts.wandererId);
  body.set(
    'success_url',
    `${opts.returnUrl}${opts.returnUrl.includes('?') ? '&' : '?'}ricarica=successo&session_id={CHECKOUT_SESSION_ID}`,
  );
  body.set('cancel_url', `${opts.returnUrl}${opts.returnUrl.includes('?') ? '&' : '?'}ricarica=annullata`);

  const fetcher = opts.fetchFn ?? fetch;
  const res = await fetcher('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Stripe API error (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { url: string; id: string };
  return { url: data.url, id: data.id };
}

function git(cwd: string, args: string[]): Promise<string> {
  const full = ['-c', 'user.name=Kernel', '-c', 'user.email=kernel@rune.local', '-c', 'core.autocrlf=false', ...args];
  return new Promise((resolve, reject) => {
    execFile('git', full, { cwd, maxBuffer: 16 * 1024 * 1024, windowsHide: true }, (err, stdout, stderr) =>
      err ? reject(new Error(String(stderr || err.message).trim())) : resolve(String(stdout)),
    );
  });
}

/**
 * Applies a Stripe credit recharge to a universe (either to active in-memory kernel or to git repo on disk).
 * Handles idempotency and refuses anonymous wanderers.
 */
export async function applyPaymentToUniverse(opts: {
  universesDir: string;
  universo: string;
  payment: PaymentRecord;
  getActiveKernel?: (universe: string) => Promise<Kernel | undefined>;
}): Promise<{ ok: boolean; status: 'credited' | 'duplicate' | 'anonymous' | 'error'; motivo?: string }> {
  // 1. Try active running kernel in memory first
  const activeKernel = await opts.getActiveKernel?.(opts.universo);
  if (activeKernel) {
    const res = activeKernel.creditRecharge(opts.payment);
    if (res.duplica) return { ok: true, status: 'duplicate' };
    if (!res.ok) {
      const isAnon = res.motivo === 'un anonimo non compra crediti';
      return { ok: false, status: isAnon ? 'anonymous' : 'error', motivo: res.motivo };
    }
    return { ok: true, status: 'credited' };
  }

  // 2. If universe is not active in memory, update on disk in its git repository
  const root = path.join(opts.universesDir, opts.universo);
  const gitDir = path.join(root, '.git');
  try {
    await fs.stat(gitDir);
  } catch {
    return { ok: false, status: 'error', motivo: `universo sconosciuto: ${opts.universo}` };
  }

  // Check idempotency in world/pagamenti.json
  const paymentsPath = path.join(root, PAYMENTS_FILE);
  let paymentsText = '';
  try {
    paymentsText = await fs.readFile(paymentsPath, 'utf8');
  } catch {
    paymentsText = '';
  }
  const files: Record<string, string> = { [PAYMENTS_FILE]: paymentsText };
  if (isPaymentProcessed(files, opts.payment.eventId)) {
    return { ok: true, status: 'duplicate' };
  }

  // Check wanderer file
  const playerRel = playerFile(opts.payment.wandererId);
  const playerAbs = path.join(root, playerRel);
  let playerText = '';
  try {
    playerText = await fs.readFile(playerAbs, 'utf8');
  } catch {
    playerText = '';
  }
  const playerFiles = { [playerRel]: playerText };
  const saved = readWandererState(playerFiles, opts.payment.wandererId);
  if (saved?.anonimo) {
    return { ok: false, status: 'anonymous', motivo: 'un anonimo non compra crediti' };
  }

  // Credit wanderer
  const updatedPlayer: WandererState = saved ?? { nome: opts.payment.wandererId };
  const curCredits = updatedPlayer.crediti ?? 0;
  const nextCredits = Math.round((curCredits + opts.payment.crediti) * 1e6) / 1e6;
  updatedPlayer.crediti = nextCredits;

  recordPayment(files, opts.payment);

  // Write and commit
  await fs.mkdir(path.dirname(playerAbs), { recursive: true });
  await fs.writeFile(playerAbs, JSON.stringify(updatedPlayer, null, 1) + '\n', 'utf8');
  await fs.mkdir(path.dirname(paymentsPath), { recursive: true });
  await fs.writeFile(paymentsPath, files[PAYMENTS_FILE], 'utf8');

  try {
    // Only the payment's two files: other uncommitted changes of the universe stay out of this commit (T93)
    await git(root, ['add', '--', playerRel, PAYMENTS_FILE]);
    await git(root, [
      'commit',
      '-q',
      '-m',
      `ricarica crediti Stripe: +${opts.payment.crediti} a ${opts.payment.wandererId} (evento ${opts.payment.eventId})`,
    ]);
  } catch {
    // If commit fails (e.g. no changes), ignore
  }

  return { ok: true, status: 'credited' };
}

export interface StripeRouteOptions {
  settings: StripeSettings;
  accounts?: AccountSettings;
  universesDir: string;
  getActiveKernel?: (universe: string) => Promise<Kernel | undefined>;
}

/** Handles incoming Stripe webhooks directly (can also be invoked from tests). */
export async function handleStripeWebhookEvent(opts: {
  rawBody: string;
  signature?: string;
  settings: StripeSettings;
  universesDir: string;
  getActiveKernel?: (universe: string) => Promise<Kernel | undefined>;
}): Promise<{ status: number; body: unknown }> {
  // If webhookSecret is configured, verify signature
  if (opts.settings.webhookSecret) {
    if (!opts.signature || !verifyStripeWebhookSignature(opts.rawBody, opts.signature, opts.settings.webhookSecret)) {
      return { status: 400, body: { error: 'Firma webhook Stripe non valida' } };
    }
  }

  let event: {
    id?: string;
    type?: string;
    data?: {
      object?: {
        id?: string;
        payment_status?: string;
        amount_total?: number;
        client_reference_id?: string;
        metadata?: {
          universo?: string;
          wandererId?: string;
          crediti?: string;
        };
      };
    };
  };

  try {
    event = JSON.parse(opts.rawBody);
  } catch {
    return { status: 400, body: { error: 'JSON non valido' } };
  }

  if (event.type !== 'checkout.session.completed') {
    return { status: 200, body: { received: true, ignored: true, type: event.type } };
  }

  const session = event.data?.object;
  if (!session || session.payment_status !== 'paid') {
    return { status: 200, body: { received: true, ignored: true, payment_status: session?.payment_status } };
  }

  const eventId = event.id;
  const sessionId = session.id;
  const universo = session.metadata?.universo;
  const wandererId = session.metadata?.wandererId || session.client_reference_id;
  const crediti = parseFloat(session.metadata?.crediti ?? '0');
  const cents = session.amount_total;

  if (!eventId || !universo || !wandererId || !Number.isFinite(crediti) || crediti <= 0) {
    return { status: 400, body: { error: 'Dati di sessione incompleti o non validi' } };
  }

  const payment: PaymentRecord = {
    eventId,
    sessionId,
    wandererId,
    crediti,
    cents,
    timestamp: Date.now(),
  };

  const result = await applyPaymentToUniverse({
    universesDir: opts.universesDir,
    universo,
    payment,
    getActiveKernel: opts.getActiveKernel,
  });

  if (result.status === 'anonymous') {
    return { status: 403, body: { error: 'Un anonimo non compra crediti', status: result.status } };
  }

  if (!result.ok) {
    return { status: 500, body: { error: result.motivo ?? 'Errore durante accredito', status: result.status } };
  }

  return { status: 200, body: { received: true, status: result.status, crediti, wandererId } };
}

/** Vite plugin route for Stripe Checkout and Webhooks. */
export function stripeRoute(opts: StripeRouteOptions): Plugin {
  return {
    name: 'rune-stripe',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];

        // 1. GET /api/stripe/config
        if (req.method === 'GET' && url === '/api/stripe/config') {
          return send(res, 200, {
            available: !!opts.settings.secretKey,
            publishableKey: opts.settings.publishableKey,
            pacchetti: [5, 10, 20, 50],
          });
        }

        // 2. POST /api/stripe/checkout
        if (req.method === 'POST' && url === '/api/stripe/checkout') {
          try {
            const raw = await readRawBody(req);
            const body = JSON.parse(raw);
            const { universo, wandererId, crediti, token, returnUrl } = body;

            if (!universo || !NAME_RE.test(universo)) {
              return send(res, 400, { ok: false, motivo: 'universo non valido' });
            }
            if (!wandererId || !validWandererId(wandererId)) {
              return send(res, 400, { ok: false, motivo: 'viandante non valido' });
            }
            const amount = Number(crediti);
            if (!Number.isFinite(amount) || amount <= 0 || amount > 1000) {
              return send(res, 400, { ok: false, motivo: 'ammontare crediti non valido (1-1000)' });
            }

            // Verify account if verifier is configured
            if (opts.accounts?.verify) {
              if (!token || typeof token !== 'string') {
                return send(res, 401, { ok: false, motivo: 'token account richiesto' });
              }
              const account = await opts.accounts.verify(token);
              if (!account) {
                return send(res, 401, { ok: false, motivo: 'token non valido o scaduto' });
              }
              if (account.anonimo) {
                return send(res, 403, {
                  ok: false,
                  motivo: 'Gli account anonimi non possono acquistare crediti. Lega il tuo account a Google per ricaricare.',
                });
              }
              const expectedId = accountWanderer(account.uid);
              if (wandererId !== expectedId) {
                return send(res, 403, { ok: false, motivo: 'il viandante non corrisponde all account' });
              }
            } else {
              // Check if wanderer is marked as anonymous in running kernel or on disk
              const active = await opts.getActiveKernel?.(universo);
              if (active?.isAnonymous(wandererId)) {
                return send(res, 403, { ok: false, motivo: 'Gli anonimi non possono acquistare crediti.' });
              }
            }

            if (!opts.settings.secretKey) {
              return send(res, 503, {
                ok: false,
                motivo: 'Stripe non configurato (STRIPE_SECRET_KEY mancante sul server).',
              });
            }

            const origin = req.headers.origin || `http://${req.headers.host || 'localhost:5173'}`;
            const effectiveReturnUrl = returnUrl || `${origin}/?universo=${universo}`;

            const session = await createStripeCheckoutSession({
              secretKey: opts.settings.secretKey,
              universo,
              wandererId,
              crediti: amount,
              returnUrl: effectiveReturnUrl,
              taxCode: opts.settings.taxCode,
              fetchFn: opts.settings.fetchFn,
            });

            return send(res, 200, { ok: true, url: session.url, id: session.id });
          } catch (e) {
            return send(res, 500, { ok: false, motivo: (e as Error).message });
          }
        }

        // 3. POST /api/stripe/webhook
        if (req.method === 'POST' && url === '/api/stripe/webhook') {
          try {
            const rawBody = await readRawBody(req);
            const signature = (req.headers['stripe-signature'] as string) || '';
            const outcome = await handleStripeWebhookEvent({
              rawBody,
              signature,
              settings: opts.settings,
              universesDir: opts.universesDir,
              getActiveKernel: opts.getActiveKernel,
            });
            return send(res, outcome.status, outcome.body);
          } catch (e) {
            return send(res, 500, { error: (e as Error).message });
          }
        }

        next();
      });
    },
  };
}
