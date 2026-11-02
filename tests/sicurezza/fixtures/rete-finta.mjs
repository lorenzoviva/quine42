// T134: loaded with `--import` in front of a real server. Nothing leaves this machine: Google and Stripe answer from here, any other socket towards
// the outside is stopped, and what would have gone out is written to RETE_FINTA (hosts and booleans, never a value).

import { appendFileSync } from 'node:fs';
import net from 'node:net';

const LOOPBACK = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const note = (entry) => appendFileSync(process.env.RETE_FINTA, JSON.stringify(entry) + '\n', 'utf8');

const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const first = Array.isArray(args[0]) ? args[0][0] : args[0];
  const host = first && typeof first === 'object' ? (first.host ?? first.hostname) : undefined;
  if (host && !LOOPBACK.has(String(host).toLowerCase())) {
    note({ bloccato: String(host) });
    throw new Error('questa prova non esce dalla macchina');
  }
  return connect.apply(this, args);
};

const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(typeof input === 'string' ? input : (input.url ?? String(input)));
  if (LOOPBACK.has(url.hostname)) return realFetch(input, init);
  const headers = new Headers(init.headers);
  const body = typeof init.body === 'string' ? init.body : '';
  if (url.hostname === 'generativelanguage.googleapis.com') {
    const key = process.env.GEMINI_API_KEY;
    note({ a: 'gemini', conChiave: headers.get('x-goog-api-key') === key, chiaveNellUrl: url.href.includes(key), chiaveNelCorpo: body.includes(key) });
    return new Response(JSON.stringify({ candidates: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.hostname === 'api.stripe.com') {
    const form = new URLSearchParams(body);
    note({ a: 'stripe', conChiave: headers.get('authorization') === `Bearer ${process.env.STRIPE_SECRET_KEY}`, ritorno: new URL(form.get('success_url') ?? 'http://nessuno').hostname });
    // Seven credits: the worst Stripe can do, an error that repeats what it was sent.
    if (form.get('metadata[crediti]') === '7') return new Response(`DETTAGLIO-INTERNO-FINTO ${headers.get('authorization')}`, { status: 400 });
    return new Response(JSON.stringify({ url: 'https://checkout.stripe.com/c/pay/finta', id: 'cs_finta' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  note({ bloccato: url.hostname });
  throw new Error('questa prova non esce dalla macchina');
};
