// The production server (T133, ADR-0112): no Vite in it. It serves the build, and only the routes on the list below; it does not start without what
// makes those routes safe with strangers: who verifies identities, the webhook's secret, the origins it answers for, a cap on the key's spending. The
// Gemini route and the subscriptions' queue are not here: the first is for who plays alone on their own machine (the worlds call `direct()`),
// the second runs a CLI on the machine it is served from. Every answer has the same headers. Without payments (`QUINE_PAGAMENTI=spenti`, the open beta,
// ADR-0189) Stripe's routes are not on the list; the health check (`/healthz`) answers before the front door, with a word.

import { createReadStream, existsSync, realpathSync, statSync } from 'node:fs';
import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import path from 'node:path';
import type { Duplex } from 'node:stream';
import { accessRefusal, GeminiGate } from './geminiProxy';
import { TypeSafeGate } from './typesafeProxy';
import { isInternal, newSecret } from './access';
import { ACCOUNT_MODES, accountHandler, accountModeOf, accountSettings, type AccountSettings } from './account';
import { secretProblem } from './invites';
import { contentSecurityPolicy } from './csp';
import { settleAllGit } from './git';
import { grantCapOf, PAYMENTS, paymentsOf, platformFeeOf } from './ledger';
import { clientAddress, proxyHops, Rates, type Pace } from './rates';
import { attachSessions, expelFrom, getActiveWorld, sessionList, tellPrivate, wanderersIn, type SessionOptions } from './session';
import { CampaignArchive } from './campaign';
import { stripeHandler, stripeSettings } from './stripe';
import { universeHandler, universesPerAccount } from './universeStore';
import { videoFolder, videoHandler } from './video';
import { walletHandler } from './wallet';
import { wandererHandler } from './wanderer';
import { serverPath } from './folders';
import { handmadeHandler } from './handmade';
import { processChecker } from './programCheck';

type Next = () => void;
type Route = (req: IncomingMessage, res: ServerResponse, next: Next) => unknown;

const LOOPBACK = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

/** The addresses in `QUINE_ORIGINI` (separated by commas), or which of them is no good. By position: what is in that variable is never repeated in a log. */
export function originsOf(text: string | undefined): { origins: string[]; bad: number[] } {
  const said = (text ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const origins: string[] = [];
  const bad: number[] = [];
  said.forEach((s, i) => {
    try {
      const u = new URL(s);
      const plain = u.protocol === 'http:' && LOOPBACK.test(u.host);
      if ((u.protocol !== 'https:' && !plain) || u.origin !== s.replace(/\/$/, '') || s.includes('*')) bad.push(i + 1);
      else origins.push(u.origin);
    } catch {
      bad.push(i + 1);
    }
  });
  return { origins, bad };
}

/** Why this environment cannot serve strangers: names of variables, never their values. Empty: it can. */
export function productionProblems(env: Record<string, string | undefined>): string[] {
  const has = (k: string) => !!env[k]?.trim();
  const problems: string[] = [];
  // Who verifies identities (ADR-0193): Firebase, or for who hosts their friends without it the invite verifier, said and with its secret.
  const mode = accountModeOf(env);
  if (!mode) problems.push(`QUINE_ACCOUNT: o niente (Firebase) o «${ACCOUNT_MODES.invites}», scritto così`);
  if (mode === 'invites') {
    const bad = secretProblem(env.QUINE_SEGRETO_INVITI);
    if (bad) problems.push(`QUINE_SEGRETO_INVITI: ${bad} (firma le identità nate dagli inviti)`);
    if (has('FIREBASE_PROJECT_ID')) problems.push('QUINE_ACCOUNT=inviti con FIREBASE_PROJECT_ID: un verificatore solo, togline uno');
  } else {
    if (!has('FIREBASE_PROJECT_ID')) problems.push('FIREBASE_PROJECT_ID: senza chi verifica le identità, l’id detto da un client varrebbe per chiunque (o QUINE_ACCOUNT=inviti)');
    if (!has('FIREBASE_API_KEY')) problems.push('FIREBASE_API_KEY: senza, nessun browser può accedere');
  }
  // firebase-admin would take unsigned tokens.
  if (has('FIREBASE_AUTH_EMULATOR_HOST')) problems.push('FIREBASE_AUTH_EMULATOR_HOST: con l’emulatore un token senza firma varrebbe');
  // The open beta (ADR-0189): with the payments off, said, Stripe's routes are not there, and neither are their secrets' reasons.
  const payments = paymentsOf(env);
  if (!payments) problems.push(`QUINE_PAGAMENTI: o «${PAYMENTS.on}» (il predefinito) o «${PAYMENTS.off}», scritto così`);
  if (payments === 'on') {
    if (!has('STRIPE_WEBHOOK_SECRET')) problems.push('STRIPE_WEBHOOK_SECRET: senza, un pagamento non si può accreditare (o QUINE_PAGAMENTI=spenti, la open beta)');
    // A mock key charges nobody, and needs no webhook: for the tests.
    if (/^mock(_|$)/.test(env.STRIPE_SECRET_KEY?.trim() ?? '')) problems.push('STRIPE_SECRET_KEY: una chiave finta non incassa nulla');
  }
  const { origins, bad } = originsOf(env.QUINE_ORIGINI);
  if (bad.length) problems.push(`QUINE_ORIGINI: la voce ${bad.join(', ')} non è un’origine (https://nome, http solo per questa macchina)`);
  else if (!origins.length) problems.push('QUINE_ORIGINI: senza, non si sa per quali siti questo server risponde');
  if (proxyHops(env.QUINE_PROXY_FIDATI) === undefined) problems.push('QUINE_PROXY_FIDATI: è quanti proxy nostri stanno davanti a questo server, un numero');
  if (has('GEMINI_API_KEY') && !(Number(env.GEMINI_TETTO_GIORNALIERO) >= 0 && has('GEMINI_TETTO_GIORNALIERO'))) problems.push('GEMINI_TETTO_GIORNALIERO: con la chiave serve un tetto in dollari al giorno, scritto');
  if (has('TYPESAFE_KEY') && !(Number(env.TYPESAFE_TETTO_GIORNALIERO) >= 0 && has('TYPESAFE_TETTO_GIORNALIERO'))) problems.push('TYPESAFE_TETTO_GIORNALIERO: con la chiave di TypeSafe serve un tetto in dollari al giorno, scritto');
  return problems;
}

/** Why a request does not reach anything, or undefined: a page of another site, or a name of this server that is not one of its own. This machine (the worlds) is itself. */
export function frontDoorRefusal(req: Pick<IncomingMessage, 'headers'> & { socket: { remoteAddress?: string } }, origins: string[]): string | undefined {
  const { origin, host } = req.headers;
  if (origin !== undefined && !origins.includes(origin)) return 'origine non ammessa';
  if (origins.some((o) => new URL(o).host === host?.toLowerCase())) return undefined;
  return accessRefusal(req) ? 'host non ammesso' : undefined;
}

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
};

/** The labs: in the build, not for strangers while `laboratori` is off (ADR-0161). */
const NOT_SERVED = /^\/lab(\/|$)/i;
/** With `laboratori` on, the three labs of the players and nothing else under `/lab` (T294, ADR-0169): their pages; their scripts are in `/assets`. */
const LAB_FOLDER = /^\/lab\/(3d|editor|suono)$/;
const PLAYER_LABS = /^\/lab\/(3d|editor|suono)\/(index\.html)?$/;

/**
 * The file of the build a path asks for, or undefined. Only what is really under the build's folder, with a type on the list, and never a
 * name beginning with a dot; under `/lab` only the players' three pages, and only with `labs` on.
 */
export function buildFile(dist: string, url: string, labs = false): string | undefined {
  let pathname: string;
  try {
    pathname = decodeURIComponent(url.split(/[?#]/)[0]);
  } catch {
    return undefined;
  }
  if (!pathname.startsWith('/') || /[\\\0:]/.test(pathname)) return undefined;
  if (NOT_SERVED.test(pathname) && !(labs && PLAYER_LABS.test(pathname))) return undefined;
  const segments = pathname.split('/').filter(Boolean);
  if (segments.some((s) => s.startsWith('.'))) return undefined;
  let file = path.join(dist, ...segments);
  try {
    if (statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!statSync(file).isFile() || !TYPES[path.extname(file).toLowerCase()]) return undefined;
    const root = realpathSync(dist);
    const rel = path.relative(root, realpathSync(file));
    return rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? file : undefined;
  } catch {
    return undefined;
  }
}

function sendBuild(dist: string, req: IncomingMessage, res: ServerResponse, labs: boolean): void {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    return void res.end();
  }
  // The address of the site is its landing page. The game without a universe would be a game alone, and here nobody makes one: it starts from the universes.
  const { pathname, searchParams } = new URL(req.url ?? '/', 'http://localhost');
  if ((pathname === '/' || pathname === '/index.html') && !searchParams.has('universo')) {
    res.statusCode = 302;
    res.setHeader('Location', pathname === '/' ? '/site/' : '/site/sessioni.html');
    return void res.end();
  }
  // A lab asked without its last slash is its folder: its scripts are written relative to it.
  if (labs && LAB_FOLDER.test(pathname)) {
    res.statusCode = 301;
    res.setHeader('Location', `${pathname}/${searchParams.size ? `?${searchParams}` : ''}`);
    return void res.end();
  }
  const file = buildFile(dist, req.url ?? '/', labs);
  if (!file) {
    res.statusCode = 404;
    return void res.end();
  }
  res.setHeader('Content-Type', TYPES[path.extname(file).toLowerCase()]);
  res.setHeader('Content-Length', statSync(file).size);
  // Names with a hash never change; a page does, at every build.
  res.setHeader('Cache-Control', /[\\/]assets[\\/]/.test(file) ? 'public, max-age=31536000, immutable' : 'no-cache');
  if (req.method === 'HEAD') return void res.end();
  createReadStream(file)
    .on('error', () => res.destroy())
    .pipe(res);
}

/** What one address may ask of this server, whoever it says it is (V-026, ADR-0114). Many people can stand behind one address: these leave room for them. The pages of the build have no rhythm: nothing is computed for them. */
export interface FrontRates {
  /** Every route. */
  api: Pace;
  /** What reads or writes a universe whole. */
  heavy: Pace;
  /** New sockets. */
  sockets: Pace;
  /** Sockets at once. */
  socketsAtOnce: number;
  /** Pieces of a video: every jump forward is one (ADR-0131). */
  video: Pace;
  /** Videos being sent to one address at once: many people can stand behind it, and a page with several videos holds one each. */
  videosAtOnce: number;
  /** Videos being sent at once, to anyone. */
  videosInAll: number;
}

export const FRONT_RATES: FrontRates = {
  api: { burst: 240, perSecond: 4 },
  heavy: { burst: 60, perSecond: 1 },
  sockets: { burst: 30, perSecond: 0.5 },
  socketsAtOnce: 24,
  video: { burst: 60, perSecond: 1 },
  videosAtOnce: 24,
  videosInAll: 200,
};

/** What reads or writes a universe whole; and the handmade cards: a write may run a program for seconds, a list reads every account's file (ADR-0161). */
const HEAVY = /^\/api\/(universe\/[^/?]|handmade(\/|\?|$))/;
const VIDEO_PIECE = /^\/api\/video\/[^/?]/;
/**
 * The health check (ADR-0189): a balancer or a container's runtime asks it by address, with any `Host` and no `Origin`, so it comes before the front
 * door. It says only whether this server is serving: nothing of its configuration, its worlds or its universes, which a name that is not ours must not learn.
 */
export const HEALTH_PATH = '/healthz';

/** The answer of the health check: a word, never cached; 503 once the server is stopping, so a balancer stops sending players to it. */
function health(req: IncomingMessage, res: ServerResponse, serving: boolean): void {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    return void res.end();
  }
  res.statusCode = serving ? 200 : 503;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(req.method === 'HEAD' ? undefined : serving ? 'ok' : 'in chiusura');
}

export interface ProductionOptions {
  env: Record<string, string | undefined>;
  /** The client's build (`dist/`): all that is served from disk. */
  dist: string;
  /** The program of the worlds, already built: its folder is all a world reads (ADR-0110). */
  worldProgram: string;
  universesDir: string;
  /** For the tests and the checks in the browser: only by code, never from the environment. */
  accounts?: AccountSettings;
  /** The labs for the players (`site/beta.json → laboratori`, which serve.ts reads when it starts): off, the routes of the handmade cards refuse everyone (ADR-0161). */
  labs?: boolean;
  /** For the tests: only by code. */
  rates?: Partial<FrontRates>;
  /** For the tests: only by code. */
  sessions?: Pick<SessionOptions, 'times' | 'entryMs'>;
}

export interface ProductionServer {
  server: http.Server;
  /** The worlds stopped (saving what they can), the clients closed, the port freed. */
  stop(): Promise<void>;
}

/** Throws, naming what is missing, if this environment or these folders cannot serve. Starts nothing until `listen`. */
export function createProductionServer(o: ProductionOptions): ProductionServer {
  const problems = productionProblems(o.env);
  if (!existsSync(path.join(o.dist, 'index.html'))) problems.push(`manca la build del client (npm run build)`);
  if (!existsSync(o.worldProgram)) problems.push(`manca il programma dei mondi (npm run build:server)`);
  if (problems.length) throw new Error(`il server di produzione non parte:\n- ${problems.join('\n- ')}`);

  const { origins } = originsOf(o.env.QUINE_ORIGINI);
  const accounts = o.accounts ?? accountSettings(o.env, o.universesDir);
  const universesDir = o.universesDir;
  // The private universes' guests (ADR-0193): the store's route writes them, the sockets and the reads ask them.
  const campaigns = CampaignArchive.of(universesDir);
  const internal = newSecret();
  const hops = proxyHops(o.env.QUINE_PROXY_FIDATI) ?? 0;
  const limits = { ...FRONT_RATES, ...o.rates };
  const [apiRate, heavyRate, socketRate, videoRate] = [new Rates(limits.api), new Rates(limits.heavy), new Rates(limits.sockets), new Rates(limits.video)];
  let warned = false;
  const addressOf = (req: IncomingMessage) => {
    // A client can write this too, so it is only said, once. With a proxy of ours in front and no QUINE_PROXY_FIDATI, everyone is one address, the proxy's, and is refused together: safe, and to be known.
    if (!hops && !warned && req.headers['x-forwarded-for']) {
      warned = true;
      console.warn('una richiesta porta X-Forwarded-For: se davanti a questo server c’è un proxy, senza QUINE_PROXY_FIDATI tutti valgono come un solo indirizzo');
    }
    return clientAddress(req, hops);
  };
  /** Whether this request is over the rhythm of its address. A world's own requests are not a stranger's: they prove themselves with their token. */
  const overRate = (req: IncomingMessage) => {
    if (isInternal(req, internal)) return false;
    const address = addressOf(req);
    return !apiRate.take(address) || (HEAVY.test(req.url ?? '') && !heavyRate.take(address)) || (VIDEO_PIECE.test(req.url ?? '') && !videoRate.take(address));
  };
  const gemini = new GeminiGate({ apiKey: o.env.GEMINI_API_KEY, dailyCap: o.env.GEMINI_TETTO_GIORNALIERO, universesDir, ledgerFile: serverPath(universesDir, 'geminiSpend') });
  if (!gemini.available) console.warn('GEMINI_API_KEY assente: i mondi usano i modelli locali');
  // Jev (ADR-0157): only for the worlds, over their channel; no route here.
  const typesafe = new TypeSafeGate({ apiKey: o.env.TYPESAFE_KEY, dailyCap: o.env.TYPESAFE_TETTO_GIORNALIERO, ledgerFile: serverPath(universesDir, 'typesafeSpend') });
  const answerAccount = accountHandler(accounts);
  // The programs of the handmade cards: each checked by the program of the worlds, in a process of its own (programCheck.ts).
  const checker = processChecker({ program: async () => o.worldProgram });
  const videos = videoFolder(o.env);
  // Not a reason not to start: the site without videos is the site. The name, never the value.
  if (videos && !existsSync(videos)) console.warn('QUINE_VIDEO: la cartella non c’è, il sito resta senza video');
  // Without payments (the open beta, ADR-0189) Stripe's routes are not mounted: a checkout, a webhook, even the config are not found.
  const payments = paymentsOf(o.env) === 'on';
  const routes: Route[] = [
    // The cards a master brings before the start (T295): checked by the same processes as the handmade cards.
    universeHandler(universesDir, { accounts, internal, quota: universesPerAccount(o.env.QUINE_UNIVERSI_PER_ACCOUNT), checker, labs: () => o.labs === true, campaigns, worlds: { inWorld: wanderersIn, expel: expelFrom, tellWorld: tellPrivate } }),
    (req, res, next) => (req.url?.split('?')[0] === '/api/account' ? answerAccount(req, res) : next()),
    ...(payments ? [stripeHandler({ settings: stripeSettings(o.env), accounts, universesDir, getActiveWorld })] : []),
    wandererHandler({ accounts, universesDir, getActiveWorld }),
    walletHandler({ accounts, universesDir, getActiveWorld, platformFee: platformFeeOf(o.env) }),
    sessionList(accounts, campaigns),
    videoHandler({ folder: videos, accounts, addressOf, atOnce: limits.videosAtOnce, inAll: limits.videosInAll }),
    handmadeHandler({ accounts, universesDir, labs: () => o.labs === true, checker }),
  ] as Route[];
  const policy = contentSecurityPolicy(accounts.config);

  const fail = (res: ServerResponse, e: unknown) => {
    console.warn(`richiesta non riuscita: ${(e as Error)?.name ?? 'errore'}`);
    if (res.headersSent) return void res.destroy();
    res.statusCode = 500;
    res.end();
  };
  let stopped: Promise<void> | undefined;
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Security-Policy', policy);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    if ((req.url ?? '').split('?')[0] === HEALTH_PATH) return health(req, res, !stopped);
    const refused = frontDoorRefusal(req, origins);
    if (refused) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      return void res.end(JSON.stringify({ error: refused }));
    }
    try {
      if (!/^\/api(\/|\?|$)/.test(req.url ?? '')) return sendBuild(o.dist, req, res, o.labs === true);
      if (overRate(req)) {
        res.statusCode = 429;
        res.setHeader('Retry-After', '30');
        res.setHeader('Content-Type', 'application/json');
        return void res.end(JSON.stringify({ error: 'troppe richieste: riprova tra poco' }));
      }
      // What no route on the list takes: not found, whatever it would be elsewhere.
      const run = (i: number): unknown => {
        if (i < routes.length) return routes[i](req, res, () => run(i + 1));
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'non trovato' }));
      };
      void Promise.resolve(run(0)).catch((e) => fail(res, e));
    } catch (e) {
      fail(res, e);
    }
  });
  const sessions = attachSessions(server, {
    accounts,
    gemini: gemini.direct(),
    typesafe: typesafe.direct(),
    internal,
    credits: { universesDir, grantCap: grantCapOf(o.env, true), platformFee: platformFeeOf(o.env) },
    memoryMb: Number(o.env.QUINE_MONDO_MEMORIA) || undefined,
    maxWorlds: Number(o.env.QUINE_MONDI_MASSIMI) || undefined,
    program: async () => o.worldProgram,
    guard: (req) => frontDoorRefusal(req, origins),
    crowd: { addressOf, rate: (address) => socketRate.take(address), atOnce: limits.socketsAtOnce },
    campaigns,
    ...o.sessions,
  });
  // Nothing else is a socket here: Vite's own is not there to take it.
  server.on('upgrade', (req: IncomingMessage, socket: Duplex) => {
    if (new URL(req.url ?? '/', 'http://localhost').pathname !== '/api/session') socket.destroy();
  });
  return {
    server,
    stop: () =>
      (stopped ??= (async () => {
        await sessions.stop();
        checker.stop();
        await new Promise<void>((done) => {
          server.close(() => done());
          server.closeAllConnections();
        });
        // serve.ts exits right after this: what the routes started ends first, with a world or not.
        await settleAllGit();
      })()),
  };
}
