// Dev/preview server middleware: the browser talks to /api/gemini/*, this forwards to Google with
// the key read from .env. The key never reaches the client bundle or the browser.

import type { Connect, Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

const UPSTREAM = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_BODY = 12 * 1024 * 1024;

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
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

export function geminiProxy(apiKey: string | undefined): Plugin {
  const handler: Connect.NextHandleFunction = (req, res, next) => {
    if (!req.url?.startsWith('/api/gemini')) return next();
    const path = req.url.split('?')[0];
    if (path === '/api/gemini/status') return send(res, 200, { available: !!apiKey });
    const m = /^\/api\/gemini\/models\/(gemini-[\w.-]+):generateContent$/.exec(path);
    if (!m || req.method !== 'POST') return send(res, 404, { error: { message: 'endpoint sconosciuto' } });
    if (!apiKey) return send(res, 503, { error: { message: 'GEMINI_API_KEY mancante in .env' } });
    readBody(req)
      .then((body) =>
        fetch(`${UPSTREAM}/${m[1]}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body,
        }),
      )
      .then(async (upstream) => {
        res.statusCode = upstream.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(await upstream.text());
      })
      .catch((e: Error) => send(res, 502, { error: { message: e.message } }));
  };
  return {
    name: 'rune-gemini-proxy',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
