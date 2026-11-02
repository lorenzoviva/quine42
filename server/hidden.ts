// What the dev server must not serve (T130, ADR-0107): Vite serves whatever is under its root, and `universes/` is there, with
// the wanderers, the balances, the queue's requests. A universe reaches a browser only through its routes (`/api/universe`, with
// who may read what: ADR-0102). `/universes/…`, `/@fs/…/universes/…`, in any case, with any query, by any other name of the folder.

import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import type { Plugin } from 'vite';

/** A segment that on some file system is that folder: any case, trailing dots and spaces, an NTFS stream. */
const FOLDER_RE = /^universes[. ]*(?::.*)?$/i;

const real = (p: string): string | undefined => {
  try {
    return fs.realpathSync.native(p);
  } catch {
    return undefined;
  }
};

function within(parent: string, child: string): boolean {
  const norm = (p: string) => (process.platform === 'win32' ? p.toLowerCase() : p);
  const rel = path.relative(norm(parent), norm(child));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/** Whether a request's URL leads into `universes/`. One that cannot even be decoded counts as if it did. */
export function leadsToUniverses(url: string, root: string, universesDir: string): boolean {
  let pathname: string;
  try {
    pathname = decodeURIComponent(url.split(/[?#]/)[0]).replace(/\\/g, '/');
  } catch {
    return true;
  }
  if (pathname.split('/').some((s) => FOLDER_RE.test(s))) return true;
  // Another name of the same folder: a short name of NTFS, a link. Only the file system knows.
  const inner = /^\/@(?:fs|id)\/+(.*)$/.exec(pathname)?.[1];
  const candidates = [path.join(root, pathname)];
  if (inner !== undefined) candidates.push(/^[A-Za-z]:/.test(inner) ? inner : `/${inner}`);
  const folder = real(universesDir) ?? universesDir;
  return candidates.some((c) => {
    const found = real(c);
    return found !== undefined && within(folder, found);
  });
}

export function hideUniverses(root: string, universesDir: string): Plugin {
  const handler = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!leadsToUniverses(req.url ?? '/', root, universesDir)) return next();
    res.statusCode = 404;
    res.end();
  };
  return {
    name: 'quine-hide-universes',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
