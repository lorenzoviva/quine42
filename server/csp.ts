// The pages' Content Security Policy (T132, ADR-0111): a second wall behind the escaping of the pages. A header, not a tag in the
// HTML: `frame-ancestors` only works as a header, and what the policy allows depends on this server's accounts, not on the build.

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import type { AccountConfig } from '../src/session/account';

/** A host name with its port, the only thing from the environment that goes into the header. */
const HOST_RE = /^[a-z0-9.-]+(:\d+)?$/i;

/** The origins Firebase Auth needs in the browser: only where this server has accounts. */
function accountOrigins(config: AccountConfig | undefined) {
  if (!config?.projectId) return { script: [], connect: [], frame: [] };
  const domain = config.authDomain && HOST_RE.test(config.authDomain) ? [`https://${config.authDomain}`] : [];
  const emulator = config.emulator && HOST_RE.test(config.emulator) ? [`http://${config.emulator}`] : [];
  return {
    script: ['https://apis.google.com'],
    connect: ['https://identitytoolkit.googleapis.com', 'https://securetoken.googleapis.com', ...emulator],
    frame: [...domain, ...emulator],
  };
}

/**
 * The policy. No inline script and no script from elsewhere; `wasm-unsafe-eval` is Lua's WebAssembly (wasmoon), and no JS `eval`.
 * Styles stay inline: the pages and the panels are full of `style=`, and a style cannot run anything.
 * `data:` and `blob:` images: the photos of the models. `'self'` also covers the same origin's WebSocket.
 */
export function contentSecurityPolicy(config?: AccountConfig): string {
  const firebase = accountOrigins(config);
  const directive = (name: string, ...sources: string[]) => `${name} ${sources.join(' ')}`;
  return [
    directive('default-src', "'self'"),
    directive('script-src', "'self'", "'wasm-unsafe-eval'", ...firebase.script),
    directive('style-src', "'self'", "'unsafe-inline'"),
    directive('img-src', "'self'", 'data:', 'blob:'),
    directive('font-src', "'self'", 'data:'),
    directive('connect-src', "'self'", ...firebase.connect),
    directive('worker-src', "'self'"),
    directive('frame-src', ...(firebase.frame.length ? firebase.frame : ["'none'"])),
    directive('object-src', "'none'"),
    directive('base-uri', "'self'"),
    directive('form-action', "'self'"),
    directive('frame-ancestors', "'none'"),
  ].join('; ');
}

/** The header on every answer of the dev server and of the preview: a worker's script has a policy of its own, from its own answer. */
export function securityHeaders(config?: AccountConfig): Plugin {
  const policy = contentSecurityPolicy(config);
  const handler = (_req: IncomingMessage, res: ServerResponse, next: () => void) => {
    res.setHeader('Content-Security-Policy', policy);
    next();
  };
  return {
    name: 'quine-security-headers',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
