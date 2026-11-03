// Dev server: the wanderer as the site sees them (T102, ADR-0095). GET /api/viandante?universo=<nome> says who the
// account's wanderer is in that universe (id, account, profile, credits, whether they are in the world now) and the
// program of their look; POST /api/viandante {universo, profilo} keeps the profile they chose. Who they are comes from the
// account's token (`Authorization: Bearer <token>`, verified as the session does); a server without accounts (development,
// the preview) takes the id the page says (`viandante`, `io` by default), as the session does without a verifier.
// The running world (a multiplayer game, in its own process) has the wanderer's state in memory: it is asked first; otherwise
// the universe's files on disk are read, and a profile kept there is committed alone.

import type { Connect, Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import type { AccountSettings } from './account';
import { bearer, failureText, gameIn, gate, isJson, refuse } from './access';
import { runGit } from './git';
import { openLedger } from './ledger';
import { Rates, type Pace } from './rates';
import { UNIVERSE_NAME_RE } from '../src/kernel/paths';
import { accountWanderer } from '../src/session/account';
import type { Kernel } from '../src/kernel/kernel';
import type { WorldCalls } from './worldCalls';
import type { FileMap } from '../src/kernel/types';
import { Forms, InlineRunner, MODELS_DIR, MODELS_INDEX } from '../src/kernel/forms';
import { readPeople } from '../src/kernel/society';
import {
  PLAYERS_DIR,
  playerFile,
  readWandererState,
  repairProfile,
  SOLO,
  validWandererId,
  wanderersIn,
  type Profile,
  type ProfileRepair,
  type WandererState,
} from '../src/kernel/wanderers';

const MAX_BODY = 16 * 1024;
/** How often an account may keep a profile: each is a file and a commit (V-026). Six, then one a minute. */
export const PROFILE_SAVES: Pace = { burst: 6, perSecond: 1 / 60 };
/** The program of every wanderer's look. */
export const WANDERER_MODEL = 'viandante';

/** What the site is told of a wanderer. */
export interface WandererView {
  id: string;
  universo: string;
  /** How they are signed in: Google, anonymous, or no accounts on this server. */
  account: 'google' | 'anonimo' | 'locale';
  anonimo: boolean;
  profilo?: Profile;
  crediti: number;
  /** In the world right now (the multiplayer game running here has them). */
  nelMondo: boolean;
  /** Whether the universe knows them already (a saved state, or in the world). */
  noto: boolean;
  /** The program of their look, its seeds, and the letter the cloak's colour paints. */
  modello?: { xml: string; semi: number; tinta?: string };
}

/** The files of a universe the wanderer's view needs (not the whole tree: people, players, the models' index). */
export async function wandererFiles(root: string): Promise<FileMap> {
  const files: FileMap = {};
  const read = async (rel: string) => {
    try {
      files[rel] = await fs.readFile(path.join(root, rel), 'utf8');
    } catch {
      /* missing: not there */
    }
  };
  await Promise.all(['world/people.json', 'world/stato.json', MODELS_INDEX, `${MODELS_DIR}${WANDERER_MODEL}.xml`].map(read));
  const players = await fs.readdir(path.join(root, PLAYERS_DIR)).catch(() => [] as string[]);
  await Promise.all(players.filter((f) => f.endsWith('.json')).map((f) => read(`${PLAYERS_DIR}${f}`)));
  return files;
}

/** The look's program of a universe: from its files, or undefined. */
function lookOf(files: FileMap): WandererView['modello'] {
  const xml = files[`${MODELS_DIR}${WANDERER_MODEL}.xml`];
  if (!xml) return undefined;
  const forms = new Forms(new InlineRunner());
  forms.load(files);
  let tinta: string | undefined;
  try {
    const t = JSON.parse(files[MODELS_INDEX] ?? '{}')?.[WANDERER_MODEL]?.tinta;
    if (typeof t === 'string' && t.length === 1) tinta = t;
  } catch {
    /* no index: no cloak to paint */
  }
  return { xml, semi: forms.seedsOf(WANDERER_MODEL), ...(tinta ? { tinta } : {}) };
}

/** A wanderer as the universe's files on disk say. */
export function viewFromFiles(files: FileMap, universo: string, id: string, account: WandererView['account'], crediti = 0): WandererView {
  const saved = readWandererState(files, id);
  const anonimo = account === 'anonimo' || !!saved?.anonimo;
  return {
    id,
    universo,
    account,
    anonimo,
    ...(saved?.profilo ? { profilo: saved.profilo } : {}),
    crediti: anonimo ? 0 : crediti,
    nelMondo: false,
    noto: !!saved,
    modello: lookOf(files),
  };
}

/**
 * A profile kept in the universe's files (no world running): repaired as the kernel does (`repairProfile`: the name unlike
 * the people's and the other wanderers', seed and colour within the limits) and written in the player's file.
 */
export function keepProfileInFiles(files: FileMap, id: string, raw: unknown): { repair: ProfileRepair; file: string; text: string } {
  const taken = readPeople(files).persone.map((p) => p.nome);
  for (const w of wanderersIn(files)) if (w.id !== id) taken.push(w.nome);
  const forms = new Forms(new InlineRunner());
  forms.load(files);
  const repair = repairProfile(raw, id, taken, forms.seedsOf(WANDERER_MODEL));
  const saved: WandererState = readWandererState(files, id) ?? {};
  saved.profilo = repair.profilo;
  saved.nome = repair.profilo.nome;
  const file = playerFile(id);
  const text = JSON.stringify(saved, null, 1) + '\n';
  files[file] = text;
  return { repair, file, text };
}

/** Who asks: the account's wanderer (with a verifier), or the id the page says (without). */
export async function whoAsks(
  accounts: AccountSettings | undefined,
  token: string | undefined,
  asked: unknown,
): Promise<{ id: string; account: WandererView['account'] } | { error: string; status: number }> {
  if (accounts?.verify) {
    if (!token) return { status: 401, error: 'serve un account' };
    const a = await accounts.verify(token);
    if (!a) return { status: 401, error: 'accesso scaduto o non valido' };
    return { id: accountWanderer(a.uid), account: a.anonimo ? 'anonimo' : 'google' };
  }
  const id = typeof asked === 'string' && asked ? asked.toLowerCase() : SOLO;
  if (!validWandererId(id)) return { status: 400, error: 'viandante non valido' };
  return { id, account: 'locale' };
}

export function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
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

function git(cwd: string, args: string[]): Promise<string> {
  return runGit(cwd, args, { author: ['Kernel', 'kernel@rune.local'], maxBuffer: 4 * 1024 * 1024 });
}

export interface WandererRouteOptions {
  accounts?: AccountSettings;
  universesDir: string;
  getActiveWorld?: (universe: string) => Promise<WorldCalls | undefined>;
}

/** The view from a world running here, if it is. */
export function viewFromKernel(k: Kernel, universo: string, id: string, account: WandererView['account']): WandererView {
  const inWorld = k.wanderers().some((w) => w.id === id);
  const saved = readWandererState(k.files, id);
  const anonimo = account === 'anonimo' || k.isAnonymous(id);
  const profilo = k.profileOf(id) ?? saved?.profilo;
  return {
    id,
    universo,
    account,
    anonimo,
    ...(profilo ? { profilo } : {}),
    crediti: anonimo ? 0 : k.creditsOf(id),
    nelMondo: inWorld,
    noto: inWorld || !!saved,
    modello: lookOf(k.files),
  };
}

export function wandererHandler(opts: WandererRouteOptions): Connect.NextHandleFunction {
  const saves = new Rates(PROFILE_SAVES);
  return (req, res, next) => {
    const [url, query = ''] = (req.url ?? '').split('?');
    if (url !== '/api/viandante') return next();
    // Another site never; without accounts, where the id is only said, only this machine (T120, ADR-0102).
    const no = gate(req, opts.accounts);
    if (no) return refuse(res, no, (motivo) => ({ ok: false, motivo }));
    void (async () => {
      try {
        const params = new URLSearchParams(query);
        let body: Record<string, unknown> = {};
        if (req.method === 'POST') {
          if (!isJson(req)) return send(res, 415, { ok: false, motivo: 'solo JSON' });
          try {
            body = JSON.parse(await readBody(req)) ?? {};
          } catch {
            return send(res, 400, { ok: false, motivo: 'richiesta non valida' });
          }
        } else if (req.method !== 'GET') return send(res, 405, { ok: false, motivo: 'metodo non ammesso' });
        const universo = String(body.universo ?? params.get('universo') ?? '');
        if (!UNIVERSE_NAME_RE.test(universo)) return send(res, 400, { ok: false, motivo: 'universo non valido' });
        const who = await whoAsks(opts.accounts, bearer(req), body.viandante ?? params.get('viandante'));
        if ('error' in who) return send(res, who.status, { ok: false, motivo: who.error });
        const root = path.join(opts.universesDir, universo);
        const active = await opts.getActiveWorld?.(universo);
        if (!active) {
          try {
            await fs.stat(path.join(root, '.git'));
          } catch {
            return send(res, 404, { ok: false, motivo: `universo sconosciuto: ${universo}` });
          }
        }

        if (req.method === 'GET') {
          const view = active ? await active.view(universo, who.id, who.account) : viewFromFiles(await wandererFiles(root), universo, who.id, who.account, (await openLedger(opts.universesDir, universo)).balance(who.id));
          return send(res, 200, { ok: true, viandante: view });
        }

        // POST: keep the profile.
        if (!body.profilo || typeof body.profilo !== 'object') return send(res, 400, { ok: false, motivo: 'manca il profilo' });
        // With accounts anyone can ask: what they leave on the disk has a rhythm, and who costs nothing to make leaves nothing where the world does not know them (V-026).
        if (opts.accounts?.verify) {
          if (!saves.take(who.id)) return send(res, 429, { ok: false, motivo: 'troppi salvataggi: riprova tra poco' });
          if (!active && !gameIn(await fs.readFile(path.join(root, 'universe.json'), 'utf8').catch(() => undefined)).many) return send(res, 403, { ok: false, motivo: 'solo negli universi di molti' });
          if (who.account === 'anonimo') {
            const known = active
              ? (await active.view(universo, who.id, who.account)).noto
              : await fs.stat(path.join(root, playerFile(who.id))).then(
                  () => true,
                  () => false,
                );
            if (!known) return send(res, 403, { ok: false, motivo: 'entra prima in questo universo' });
          }
        }
        if (active) {
          const r = await active.keepProfile(universo, who.id, who.account, body.profilo);
          if (!r) return send(res, 500, { ok: false, motivo: 'non è stato possibile salvarlo' });
          return send(res, 200, { ok: true, profilo: r.profilo, riparato: r.riparato, viandante: r.viandante });
        }
        await openLedger(opts.universesDir, universo);
        const files = await wandererFiles(root);
        const kept = keepProfileInFiles(files, who.id, body.profilo);
        await fs.mkdir(path.dirname(path.join(root, kept.file)), { recursive: true });
        await fs.writeFile(path.join(root, kept.file), kept.text, 'utf8');
        try {
          // Only the player's file: other changes of the universe stay out of this commit (as the payments, T93).
          await git(root, ['add', '--', kept.file]);
          await git(root, ['commit', '-q', '-m', `profilo di ${who.id} dal sito`, '--', kept.file]);
        } catch {
          /* nothing changed: nothing to commit */
        }
        return send(res, 200, { ok: true, profilo: kept.repair.profilo, riparato: kept.repair.riparato, viandante: viewFromFiles(files, universo, who.id, who.account, (await openLedger(opts.universesDir, universo)).balance(who.id)) });
      } catch (e) {
        return send(res, 500, { ok: false, motivo: failureText('viandante', e) });
      }
    })();
  };
}

/** GET and POST /api/viandante, in the dev server and in the preview. */
export function wandererRoute(opts: WandererRouteOptions): Plugin {
  const handler = wandererHandler(opts);
  return {
    name: 'rune-viandante',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
