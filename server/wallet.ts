// Dev server: the wallet as the site sees it (T105, ADR-0095). GET /api/crediti?universo=<nome> says a wanderer's balance,
// the top-ups credited to them (the ledger, ADR-0104) and what they spent day by day (`world/consumi.json → paganti`).
// Only their own lines: those records hold everybody's, so they never go to the page as they are. Who asks comes from the
// account's token, as in /api/viandante (`whoAsks`). The world running in this process is asked first, then the files on disk.

import type { Connect, Plugin } from 'vite';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import type { Kernel } from '../src/kernel/kernel';
import type { FileMap } from '../src/kernel/types';
import { costWithFee, type Ledger, type PaymentRecord } from '../src/kernel/credits';
import { USAGE_FILE } from '../src/kernel/ai/usage';
import { playerFile, readWandererState } from '../src/kernel/wanderers';
import { UNIVERSE_NAME_RE } from '../src/kernel/paths';
import { bearer, gate, refuse } from './access';
import { openLedger } from './ledger';
import { send, whoAsks, type WandererRouteOptions, type WandererView } from './wanderer';

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

/** What a wanderer spent on a day: their own calls, not their share of the common ones. */
export interface WalletDay {
  giorno: string;
  chiamate: number;
  usd: number;
}

export interface Wallet {
  id: string;
  universo: string;
  account: WandererView['account'];
  anonimo: boolean;
  crediti: number;
  /** Credits are charged only in a game of many (`Kernel.billCall`). */
  multigiocatore: boolean;
  /** Newest first. */
  pagamenti: WalletPayment[];
  /** Newest first, at most WALLET_DAYS. */
  consumi: WalletDay[];
  /** On every day. */
  totaleConsumi: number;
}

/** This wanderer's lines of the two ledgers. A usage file written by hand or by an older version must not break the page. */
export function linesOf(payments: PaymentRecord[], usageText: string | undefined, id: string, many: boolean): Pick<Wallet, 'pagamenti' | 'consumi' | 'totaleConsumi'> {
  const pagamenti: WalletPayment[] = [];
  for (const p of payments) {
    if (p?.wandererId !== id || !Number.isFinite(p.crediti) || !Number.isFinite(p.timestamp)) continue;
    pagamenti.push({ id: p.sessionId || p.eventId, data: p.timestamp, crediti: p.crediti, ...(Number.isFinite(p.cents) ? { cents: p.cents } : {}) });
  }
  pagamenti.sort((a, b) => b.data - a.data);

  let paganti: Record<string, Record<string, { calls?: number; usd?: number }>> = {};
  try {
    paganti = JSON.parse(usageText ?? '{}')?.paganti ?? {};
  } catch {
    /* no ledger: nothing spent that we know of */
  }
  const days: WalletDay[] = [];
  let total = 0;
  for (const [giorno, payers] of Object.entries(paganti)) {
    const t = payers?.[id];
    if (!t) continue;
    const base = Number(t.usd) || 0;
    // What the balance really lost: the fee is charged with the call, and only in a game of many.
    const usd = many ? costWithFee(base) : base;
    total += usd;
    days.push({ giorno, chiamate: Number(t.calls) || 0, usd });
  }
  days.sort((a, b) => b.giorno.localeCompare(a.giorno));
  return { pagamenti, consumi: days.slice(0, WALLET_DAYS), totaleConsumi: Math.round(total * 1e6) / 1e6 };
}

function manyIn(files: FileMap): boolean {
  try {
    return JSON.parse(files['universe.json'] ?? '{}')?.partita?.modalita === 'multigiocatore';
  } catch {
    return false;
  }
}

/** The wallet as the universe's files on disk say. */
export function walletFromFiles(files: FileMap, ledger: Ledger, universo: string, id: string, account: WandererView['account']): Wallet {
  const saved = readWandererState(files, id);
  const anonimo = account === 'anonimo' || !!saved?.anonimo;
  const many = manyIn(files);
  return { id, universo, account, anonimo, crediti: anonimo ? 0 : ledger.balance(id), multigiocatore: many, ...linesOf(ledger.paymentsOf(id), files[USAGE_FILE], id, many) };
}

/** The wallet from a world running here, whose ledgers are fresher than the disk. */
export function walletFromKernel(k: Kernel, universo: string, id: string, account: WandererView['account']): Wallet {
  const anonimo = account === 'anonimo' || k.isAnonymous(id);
  const many = k.manyPlayers();
  return { id, universo, account, anonimo, crediti: anonimo ? 0 : k.creditsOf(id), multigiocatore: many, ...linesOf(k.ledger.paymentsOf(id), k.usage.toJson(), id, many) };
}

/** The few files a wallet needs. */
async function walletFiles(root: string, id: string): Promise<FileMap> {
  const files: FileMap = {};
  await Promise.all(
    ['universe.json', 'world/stato.json', USAGE_FILE, playerFile(id)].map(async (rel) => {
      try {
        files[rel] = await fs.readFile(path.join(root, rel), 'utf8');
      } catch {
        /* missing: not there */
      }
    }),
  );
  return files;
}

export function walletHandler(opts: WandererRouteOptions): Connect.NextHandleFunction {
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
        const active = await opts.getActiveKernel?.(universo);
        if (active) return send(res, 200, { ok: true, portafoglio: walletFromKernel(active, universo, who.id, who.account) });
        const root = path.join(opts.universesDir, universo);
        try {
          await fs.stat(path.join(root, '.git'));
        } catch {
          return send(res, 404, { ok: false, motivo: `universo sconosciuto: ${universo}` });
        }
        return send(res, 200, { ok: true, portafoglio: walletFromFiles(await walletFiles(root, who.id), await openLedger(opts.universesDir, universo), universo, who.id, who.account) });
      } catch (e) {
        return send(res, 500, { ok: false, motivo: (e as Error).message });
      }
    })();
  };
}

/** GET /api/crediti, in the dev server and in the preview. */
export function walletRoute(opts: WandererRouteOptions): Plugin {
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
