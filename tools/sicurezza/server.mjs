// The server of the author's kit (T137), a process of its own started by prove.mjs in the throwaway project: the project's
// real `vite.config.ts`, so what is measured is what `npm run dev` does. No request leaves the machine: Gemini and Stripe answer
// from here and what would have gone to them is written in rete.jsonl (hosts and sizes, never a key).

import { appendFileSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { isLoopback, STRIPE_DETAIL } from './ambiente.mjs';

const work = process.cwd();
const network = path.join(work, 'rete.jsonl');
const note = (entry) => appendFileSync(network, JSON.stringify(entry) + '\n', 'utf8');

function hostOf(target) {
  if (!target || typeof target !== 'object') return undefined;
  return target.host ?? target.hostname;
}

// Everything else that opens a socket stops here, whichever library it comes from.
const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const first = Array.isArray(args[0]) ? args[0][0] : args[0];
  const host = hostOf(first);
  if (host && !isLoopback(host)) {
    note({ bloccato: String(host) });
    throw new Error('il kit non esce dalla macchina');
  }
  return connect.apply(this, args);
};

const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(typeof input === 'string' ? input : (input.url ?? String(input)));
  if (isLoopback(url.hostname)) return realFetch(input, init);
  const body = typeof init.body === 'string' ? init.body : '';
  if (url.hostname === 'generativelanguage.googleapis.com') {
    note({ a: 'gemini', percorso: url.pathname, byte: body.length, conChiave: !!new Headers(init.headers).get('x-goog-api-key') });
    return new Response(JSON.stringify({ candidates: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.hostname === 'api.stripe.com') {
    const success = new URLSearchParams(body).get('success_url') ?? '';
    let ritorno = '';
    try {
      ritorno = new URL(success).hostname;
    } catch {
      /* not a URL: the host stays empty */
    }
    note({ a: 'stripe', ritorno });
    return new Response(STRIPE_DETAIL, { status: 400 });
  }
  note({ bloccato: url.hostname });
  throw new Error('il kit non esce dalla macchina');
};

// From the project's own node_modules (a link to the real one): `import 'vite'` resolves from the kit's folder.
const { createServer, build } = await import('vite');
// Keeps the links' paths: the sources stay under this root, and the server's allowed folders are the kit's.
const inline = {
  root: work,
  configFile: path.join(work, 'vite.config.ts'),
  cacheDir: path.join(work, '.cache'),
  logLevel: 'warn',
  clearScreen: false,
  resolve: { preserveSymlinks: true },
};

if (process.argv[2] === 'build') {
  await build({ ...inline, build: { outDir: path.join(work, 'dist'), emptyOutDir: true, minify: false, reportCompressedSize: false } });
  process.exit(0);
}

const server = await createServer({
  ...inline,
  server: { host: 'localhost', port: Number(process.env.KIT_PORTA || 0), strictPort: !!process.env.KIT_PORTA, open: false },
  optimizeDeps: { noDiscovery: true },
  // Nothing here changes while the kit runs: no need to watch the sources through the links.
  plugins: [{ name: 'kit-no-watch', config: (c) => void ((c.server ??= {}).watch = null) }],
});
await server.listen();
const address = server.httpServer.address();
if (!isLoopback(address.address === '::1' ? 'localhost' : address.address)) {
  console.error('il server non ascolta sul loopback');
  process.exit(3);
}
console.log(JSON.stringify({ pronto: true, porta: address.port, url: pathToFileURL(work).href }));
