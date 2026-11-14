// Dev server: the wallet as the site sees it (T105, ADR-0095). GET /api/crediti?universo=<nome> says a wanderer's balance,
// the top-ups credited to them (the ledger, ADR-0104) and what they spent day by day (`world/usage.json → payers`).
// Only their own lines: those records hold everybody's, so they never go to the page as they are. Who asks comes from the
// account's token, as in /api/viandante (`whoAsks`). The running world is asked first, then the files on disk. Where the master
// pays (T372, ADR-0188) the master's wallet also says what they paid for whom (`masterPaid`), and a player's spending is only theirs.

import type { Connect, Plugin } from 'vite';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import type { Kernel } from '../src/kernel/kernel';
import type { FileMap } from '../src/kernel/types';
import { isMultiplayer } from '../src/kernel/gameSetup';
import { internalFields, internalSoloIn } from '../src/kernel/internalNames';
import { repairGameSetup } from '../src/kernel/validator';
import { pathsBefore, portedFiles } from '../src/kernel/migrations';
import { costWithFee, DEFAULT_PLATFORM_FEE, type Ledger, type PaymentRecord } from '../src/kernel/credits';
import { USAGE_FILE } from '../src/kernel/ai/usage';
import { playerFile, readWandererState } from '../src/kernel/wanderers';
import { UNIVERSE_NAME_RE } from '../src/kernel/paths';
import { bearer, failureText, gate, refuse } from './access';
import { openLedger } from './ledger';
import { seesUniverse, send, whoAsks, type WandererRouteOptions, type WandererView } from './wanderer';

/** The days of spending a page shows. */
export const WALLET_DAYS = 30;

/** A top-up credited to the wanderer. */
export interface WalletPayment {
  /** The Stripe session it came from, or the event when the session is not known. */
  id: string;
  /** When it was credited (ms). */
  data: number;
  crediti: number;
  /** What was paid, in cents, when Stripe said it. */
  cents?: number;
}

/** What a wanderer spent on a day: their own calls, not their share of the common ones, nor those the master paid for them (T372). */
export interface WalletDay {
  giorno: string;
  chiamate: number;
  usd: number;
}

/** What the master paid on a day for someone else (T372, ADR-0188): a wanderer, or `comune` for what the world asked. */
export interface WalletPaidFor {
  day: string;
  who: string;
  calls: number;
  usd: number;
}

export interface Wallet {
  id: string;
  universo: string;
  account: WandererView['account'];
  anonimo: boolean;
  crediti: number;
  /** Credits are charged only in a multiplayer game (`Kernel.billCall`). */
  multigiocatore: boolean;
  /** The platform fee on every call charged, as this server decided it (ADR-0132). */
  commissione: number;
  /** Newest first. */
  pagamenti: WalletPayment[];
  /** Newest first, at most WALLET_DAYS. */
  consumi: WalletDay[];
  /** On every day. */
  totaleConsumi: number;
  /** In this universe the master pays every call of the match (T372, ADR-0188): a player spends nothing of theirs. */
  masterPays: boolean;
  /** The wallet is the master's, in a game of many (T372): the page says they pay, and only theirs has `paidFor`. */
  master: boolean;
  /** Only in the master's wallet, where they paid for someone: by day and by who asked, newest first, at most WALLET_DAYS days. */
  paidFor?: WalletPaidFor[];
  /** On every day: what the master paid for the others. */
  paidForTotal?: number;
}

type Tallies = Record<string, Record<string, { calls?: number; usd?: number }>>;
type Lines = Pick<Wallet, 'pagamenti' | 'consumi' | 'totaleConsumi' | 'paidFor' | 'paidForTotal'>;

/** The two tallies of the usage file, day → who → tally, whatever contract wrote it (`paganti` and the payer `io` before 0.4). */
function talliesOf(usageText: string | undefined): { payers: Tallies; masterPaid: Tallies } {
  const table = (v: unknown): Tallies => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Tallies) : {});
  try {
    const f = internalSoloIn(internalFields('usage', JSON.parse(usageText ?? '{}') ?? {})) as { payers?: unknown; masterPaid?: unknown };
    return { payers: table(f?.payers), masterPaid: table(f?.masterPaid) };
  } catch {
    /* no ledger: nothing spent that we know of */
    return { payers: {}, masterPaid: {} };
  }
}

/**
 * This wanderer's lines of the two ledgers. A usage file written by hand or by an older version must not break the page. `master`: the
 * wallet is the master's, who sees what they paid for the others (T372); anyone else sees nothing of anyone else's.
 */
export function linesOf(payments: PaymentRecord[], usageText: string | undefined, id: string, many: boolean, fee: number, master = false): Lines {
  const pagamenti: WalletPayment[] = [];
  for (const p of payments) {
    if (p?.wandererId !== id || !Number.isFinite(p.crediti) || !Number.isFinite(p.timestamp)) continue;
    pagamenti.push({ id: p.sessionId || p.eventId, data: p.timestamp, crediti: p.crediti, ...(Number.isFinite(p.cents) ? { cents: p.cents } : {}) });
  }
  pagamenti.sort((a, b) => b.data - a.data);

  const { payers, masterPaid } = talliesOf(usageText);
  // What the balance lost: the fee is charged with the call, and only in a multiplayer game. The ledger keeps the cost alone, so a day
  // before the fee changed reads at today's fee (ADR-0132).
  const lost = (base: number) => (many ? costWithFee(base, fee) : base);
  const days: WalletDay[] = [];
  let total = 0;
  for (const [giorno, byPayer] of Object.entries(payers)) {
    const t = byPayer?.[id];
    if (!t) continue;
    // What the master paid for them that day was not theirs to pay (T372).
    const paid = masterPaid[giorno]?.[id];
    const base = Math.max(0, (Number(t.usd) || 0) - (Number(paid?.usd) || 0));
    const chiamate = Math.max(0, (Number(t.calls) || 0) - (Number(paid?.calls) || 0));
    if (paid && !chiamate && !base) continue;
    const usd = lost(base);
    total += usd;
    days.push({ giorno, chiamate, usd });
  }
  days.sort((a, b) => b.giorno.localeCompare(a.giorno));
  const out: Lines = { pagamenti, consumi: days.slice(0, WALLET_DAYS), totaleConsumi: Math.round(total * 1e6) / 1e6 };
  if (!master) return out;
  const paidFor: WalletPaidFor[] = [];
  let paidTotal = 0;
  for (const [day, byAsker] of Object.entries(masterPaid))
    for (const [who, t] of Object.entries(byAsker ?? {})) {
      if (who === id || !t) continue;
      const usd = lost(Number(t.usd) || 0);
      paidTotal += usd;
      paidFor.push({ day, who, calls: Number(t.calls) || 0, usd });
    }
  if (!paidFor.length) return out;
  const shown = new Set([...new Set(paidFor.map((r) => r.day))].sort().reverse().slice(0, WALLET_DAYS));
  out.paidFor = paidFor.filter((r) => shown.has(r.day)).sort((a, b) => b.day.localeCompare(a.day) || a.who.localeCompare(b.who));
  out.paidForTotal = Math.round(paidTotal * 1e6) / 1e6;
  return out;
}

/** The game as universe.json says it: whether it is of many, its master, and whether the master pays (T372). */
function gameIn(files: FileMap): { many: boolean; master?: string; masterPays: boolean } {
  try {
    const raw = internalFields('config', JSON.parse(files['universe.json'] ?? '{}') ?? {})?.game;
    if (!isMultiplayer(raw?.mode)) return { many: false, masterPays: false };
    const game = repairGameSetup(raw);
    return { many: true, master: game.master, masterPays: game.expenses === 'master' };
  } catch {
    return { many: false, masterPays: false };
  }
}

/** The wallet as the universe's files on disk say. */
export function walletFromFiles(files: FileMap, ledger: Ledger, universo: string, id: string, account: WandererView['account'], fee: number): Wallet {
  const saved = readWandererState(files, id);
  const anonimo = account === 'anonimo' || !!saved?.anonymous;
  const { many, master, masterPays } = gameIn(files);
  return { id, universo, account, anonimo, crediti: anonimo ? 0 : ledger.balance(id), multigiocatore: many, commissione: fee, masterPays, master: many && id === master, ...linesOf(ledger.paymentsOf(id), files[USAGE_FILE], id, many, fee, many && id === master) };
}

/** The wallet from a world running here, whose ledgers are fresher than the disk. */
export function walletFromKernel(k: Kernel, universo: string, id: string, account: WandererView['account']): Wallet {
  const anonimo = account === 'anonimo' || k.isAnonymous(id);
  const many = k.manyPlayers();
  return { id, universo, account, anonimo, crediti: anonimo ? 0 : k.creditsOf(id), multigiocatore: many, commissione: k.platformFee, masterPays: k.masterPays(), master: many && id === k.masterId(), ...linesOf(k.ledger.paymentsOf(id), k.usage.toJson(), id, many, k.platformFee, many && id === k.masterId()) };
}

/** The few files a wallet needs, as this kernel reads them (a universe not opened since the contract 0.4 is ported in memory, T308a). */
async function walletFiles(root: string, id: string): Promise<FileMap> {
  const files: FileMap = {};
  await Promise.all(
    pathsBefore(['universe.json', 'world/state.json', USAGE_FILE, playerFile(id)]).map(async (rel) => {
      try {
        files[rel] = await fs.readFile(path.join(root, rel), 'utf8');
      } catch {
        /* missing: not there */
      }
    }),
  );
  return portedFiles(files);
}

/** The wallet's route says the fee when no world is running: the server's. */
export interface WalletRouteOptions extends WandererRouteOptions {
  platformFee?: number;
}

export function walletHandler(opts: WalletRouteOptions): Connect.NextHandleFunction {
  return (req, res, next) => {
    const [url, query = ''] = (req.url ?? '').split('?');
    if (url !== '/api/crediti') return next();
    // Another site never; without accounts, where the id is only said, only this machine (T120, ADR-0102).
    const no = gate(req, opts.accounts);
    if (no) return refuse(res, no, (motivo) => ({ ok: false, motivo }));
    void (async () => {
      try {
        if (req.method !== 'GET') return send(res, 405, { ok: false, motivo: 'metodo non ammesso' });
        const params = new URLSearchParams(query);
        const universo = params.get('universo') ?? '';
        if (!UNIVERSE_NAME_RE.test(universo)) return send(res, 400, { ok: false, motivo: 'universo non valido' });
        const who = await whoAsks(opts.accounts, bearer(req), params.get('viandante'));
        if ('error' in who) return send(res, who.status, { ok: false, motivo: who.error });
        // A private universe is not there for who is neither its master nor a guest (ADR-0193): as a name that does not exist.
        if (!seesUniverse(opts, universo, who)) return send(res, 404, { ok: false, motivo: `universo sconosciuto: ${universo}` });
        const active = await opts.getActiveWorld?.(universo);
        if (active) return send(res, 200, { ok: true, portafoglio: await active.wallet(universo, who.id, who.account) });
        const root = path.join(opts.universesDir, universo);
        try {
          await fs.stat(path.join(root, '.git'));
        } catch {
          return send(res, 404, { ok: false, motivo: `universo sconosciuto: ${universo}` });
        }
        return send(res, 200, { ok: true, portafoglio: walletFromFiles(await walletFiles(root, who.id), await openLedger(opts.universesDir, universo), universo, who.id, who.account, opts.platformFee ?? DEFAULT_PLATFORM_FEE) });
      } catch (e) {
        return send(res, 500, { ok: false, motivo: failureText('crediti', e) });
      }
    })();
  };
}

/** GET /api/crediti, in the dev server and in the preview. */
export function walletRoute(opts: WalletRouteOptions): Plugin {
  const handler = walletHandler(opts);
  return {
    name: 'rune-crediti',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
