// The videos of the site (T244, ADR-0131): files too large for the repository or the build, in a folder of the server (`QUINE_VIDEO`), with a list next to them
// (`video.json`: which ones, what they are called, in which order). What a client says is only compared with that list, never joined to a path: a file not on it does
// not exist. Long videos ask for pieces (`Range`), and a view costs a file's stream, not the file: see the numbers in the ADR.

import { createReadStream, promises as fs } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { pipeline } from 'node:stream';
import type { Plugin } from 'vite';
import type { AccountSettings } from './account';
import { gate } from './access';

/** The list, in the videos' folder. */
export const VIDEO_LIST = 'video.json';

const LIST_MAX_BYTES = 256 * 1024;
const TITLE_MAX = 200;
const ABOUT_MAX = 1000;
const TYPES: Record<string, string> = { '.mp4': 'video/mp4', '.webm': 'video/webm' };
/** A plain name of a video: no folder, no dot in front, nothing the file system or a URL reads in another way. */
const FILE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(mp4|webm)$/;
const ROUTE_RE = /^\/api\/video(?:\/([^/]*))?$/;

/** How many views at once, by default: `FRONT_RATES` says it for the production server. */
export const VIDEOS_AT_ONCE = 24;
export const VIDEOS_IN_ALL = 200;
/** A view that takes nothing for this long lets its socket go: a paused player asks again from where it was. */
const STALL_MS = 120_000;

export interface VideoEntry {
  file: string;
  title: string;
  about?: string;
}

/** Where the videos are, or undefined: without the variable there are none. */
export function videoFolder(env: Record<string, string | undefined>): string | undefined {
  const said = env.QUINE_VIDEO?.trim();
  return said ? path.resolve(said) : undefined;
}

/** The entries of a list's text that can be videos, in its order. What is not one stays out. */
export function parseVideoList(text: string): VideoEntry[] {
  let list: unknown;
  try {
    list = (JSON.parse(text) as { video?: unknown })?.video;
  } catch {
    return [];
  }
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const entries: VideoEntry[] = [];
  for (const item of list as Record<string, unknown>[]) {
    const { file, titolo, descrizione } = item ?? {};
    if (typeof file !== 'string' || !FILE_RE.test(file) || seen.has(file) || typeof titolo !== 'string' || !titolo.trim()) continue;
    seen.add(file);
    entries.push({ file, title: titolo.trim().slice(0, TITLE_MAX), ...(typeof descrizione === 'string' && descrizione.trim() ? { about: descrizione.trim().slice(0, ABOUT_MAX) } : {}) });
  }
  return entries;
}

export type ByteRange = { start: number; end: number };

/**
 * What a `Range` header asks of a file of this size: a piece (`end` included), or `'refused'`. Only one piece, in bytes: several would be several reads of the same
 * file for one request. RFC 9110 lets a server ignore what it does not understand; here it is said no to, so that a wrong request does not cost the whole file.
 */
export function parseRange(header: string, size: number): ByteRange | 'refused' {
  const m = /^bytes=(\d{0,16})-(\d{0,16})$/.exec(header);
  if (!m || (!m[1] && !m[2])) return 'refused';
  if (!m[1]) {
    const last = Number(m[2]);
    return last > 0 && size > 0 ? { start: Math.max(0, size - last), end: size - 1 } : 'refused';
  }
  const start = Number(m[1]);
  const end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  return start < size && start <= end ? { start, end } : 'refused';
}

/** The real path of a listed file, only if it is a file really in the folder: a link that leads out is not one. */
async function videoFile(folder: string, name: string): Promise<{ file: string; size: number; mtimeMs: number } | undefined> {
  try {
    const root = await fs.realpath(folder);
    const file = await fs.realpath(path.join(root, name));
    if (path.dirname(file) !== root) return undefined;
    const { size, mtimeMs } = await fs.stat(file).then((s) => (s.isFile() ? s : { size: 0, mtimeMs: 0 }));
    return size > 0 ? { file, size, mtimeMs } : undefined;
  } catch {
    return undefined;
  }
}

/** The list as it is now on disk: adding a video asks for no restart. */
async function readList(folder: string): Promise<VideoEntry[]> {
  try {
    const list = path.join(folder, VIDEO_LIST);
    if ((await fs.stat(list)).size > LIST_MAX_BYTES) return [];
    return parseVideoList(await fs.readFile(list, 'utf8'));
  } catch {
    return [];
  }
}

/** What a client sees: only what is on the list and has its file. */
export async function listedVideos(folder: string | undefined): Promise<VideoEntry[]> {
  if (!folder) return [];
  const entries = await readList(folder);
  const present = await Promise.all(entries.map((e) => videoFile(folder, e.file)));
  return entries.filter((_, i) => present[i]);
}

/** Who is watching: a view takes a place until its socket closes. */
class Views {
  private byAddress = new Map<string, number>();
  private all = 0;

  constructor(
    private atOnce: number,
    private inAll: number,
  ) {}

  /** The way to give the place back, or undefined if there is none. */
  take(address: string): (() => void) | undefined {
    const mine = this.byAddress.get(address) ?? 0;
    if (mine >= this.atOnce || this.all >= this.inAll) return undefined;
    this.byAddress.set(address, mine + 1);
    this.all++;
    return () => {
      this.all--;
      const left = (this.byAddress.get(address) ?? 1) - 1;
      if (left > 0) this.byAddress.set(address, left);
      else this.byAddress.delete(address);
    };
  }

  get open(): number {
    return this.all;
  }
}

export interface VideoOptions {
  folder: string | undefined;
  accounts: AccountSettings | undefined;
  /** Who a request comes from, as the front door says it. */
  addressOf?: (req: IncomingMessage) => string;
  atOnce?: number;
  inAll?: number;
  /** For the tests: only by code. */
  stallMs?: number;
}

type VideoHandler = ((req: IncomingMessage, res: ServerResponse, next: () => void) => void) & { views: () => number };

function answer(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

/** GET /api/video: the list. GET and HEAD /api/video/<file>: a video, whole or a piece. */
export function videoHandler(o: VideoOptions): VideoHandler {
  const views = new Views(o.atOnce ?? VIDEOS_AT_ONCE, o.inAll ?? VIDEOS_IN_ALL);
  const addressOf = o.addressOf ?? ((req: IncomingMessage) => req.socket.remoteAddress ?? 'ignoto');

  const send = async (name: string, req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const known = o.folder && (await readList(o.folder)).some((e) => e.file === name);
    const found = known && o.folder ? await videoFile(o.folder, name) : undefined;
    if (!found) return answer(res, 404, { error: 'non trovato' });
    const { file, size, mtimeMs } = found;
    const etag = `"${size.toString(16)}-${Math.floor(mtimeMs).toString(16)}"`;
    res.setHeader('Content-Type', TYPES[path.extname(file).toLowerCase()]);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    if (req.headers['if-none-match'] === etag) {
      res.statusCode = 304;
      return void res.end();
    }
    // Asked to go on with a file that has since changed: the whole new one, not a piece of it.
    const said = req.headers.range;
    const stale = req.headers['if-range'] !== undefined && req.headers['if-range'] !== etag;
    const range = said !== undefined && !stale ? parseRange(said, size) : undefined;
    if (range === 'refused') {
      res.removeHeader('ETag');
      res.removeHeader('Cache-Control');
      res.statusCode = 416;
      res.setHeader('Content-Range', `bytes */${size}`);
      return void res.end();
    }
    const [start, end] = range ? [range.start, range.end] : [0, size - 1];
    res.statusCode = range ? 206 : 200;
    if (range) res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
    res.setHeader('Content-Length', end - start + 1);
    if (req.method === 'HEAD') return void res.end();
    const release = views.take(addressOf(req));
    if (!release) {
      res.removeHeader('Content-Range');
      res.removeHeader('Content-Length');
      return answer(res, 429, { error: 'troppi video aperti: riprova tra poco' }, { 'Retry-After': '10' });
    }
    res.once('close', release);
    res.setTimeout(o.stallMs ?? STALL_MS, () => res.destroy());
    // `pipeline`, not `pipe`: who goes away closes the file, and the file is read only as fast as the socket takes it, a piece at a time.
    pipeline(createReadStream(file, { start, end }), res, () => undefined);
  };

  const handler = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const m = ROUTE_RE.exec((req.url ?? '').split('?')[0]);
    if (!m) return next();
    const refused = gate(req, o.accounts);
    if (refused) return answer(res, refused.status, { error: refused.refused });
    if (req.method !== 'GET' && req.method !== 'HEAD') return answer(res, 405, { error: 'metodo non ammesso' }, { Allow: 'GET, HEAD' });
    const fail = () => {
      if (res.headersSent) return void res.destroy();
      answer(res, 500, { error: 'non riuscito' });
    };
    const name = m[1];
    if (name === undefined) {
      return void listedVideos(o.folder)
        .then((videos) => answer(res, 200, { video: videos.map((v) => ({ titolo: v.title, ...(v.about ? { descrizione: v.about } : {}), url: `/api/video/${v.file}` })) }, { 'Cache-Control': 'no-cache' }))
        .catch(fail);
    }
    void send(name, req, res).catch(fail);
  };
  return Object.assign(handler, { views: () => views.open });
}

/** The same route in the dev server and in the preview: the same folder, the same answers. */
export function videoRoute(o: VideoOptions): Plugin {
  const handler = videoHandler(o);
  return {
    name: 'quine-video',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
