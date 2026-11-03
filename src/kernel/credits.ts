// The credit system (T45a, ADR-0081; P#1 of the multiplayer plan). Every model call deducts its cost + 1% (P#1) from its payer
// (`payerOf`). Common expenses (`comune`) are split equally among all currently connected players (master included). When credits
// are exhausted, what the wanderer asks for is answered by local models (like without an API key). Anonymous wanderers have no
// credits and always use local models. Stripe Checkout (T45e, ADR-0083) tops up.
// Balances and payments live in a `Ledger` (T125, ADR-0104), outside the universe's files and their history: here its rules; on the
// server `server/ledger.ts` keeps it on disk, a mirror or a test has it in memory.

/** Platform fee on top of model cost (P#1): 1%. */
export const PLATFORM_FEE = 0.01;

/** Where a universe of before the ledger kept its payments: only the migration reads it (ADR-0104). */
export const PAYMENTS_FILE = 'world/pagamenti.json';

/** Total cost with the 1% platform fee. */
export function costWithFee(baseCost: number): number {
  if (baseCost <= 0) return 0;
  return Math.round(baseCost * (1 + PLATFORM_FEE) * 1e6) / 1e6;
}

/** Split a common cost among eligible connected wanderers into exact shares summing to total. */
export function splitCost(total: number, count: number): number[] {
  if (total <= 0 || count <= 0) return Array(Math.max(0, count)).fill(0);
  const base = Math.floor((total / count) * 1e6) / 1e6;
  const shares = Array(count).fill(base);
  let remainder = Math.round((total - base * count) * 1e6);
  for (let i = 0; i < count && remainder > 0; i++, remainder--) {
    shares[i] = Math.round((shares[i] + 1e-6) * 1e6) / 1e6;
  }
  return shares;
}

/** A processed payment record from Stripe (T45e). */
export interface PaymentRecord {
  eventId: string;
  sessionId?: string;
  wandererId: string;
  crediti: number;
  cents?: number;
  timestamp: number;
}

/** A gift of credits by the master (ADR-0104). */
export interface GrantRecord {
  da: string;
  a: string;
  crediti: number;
  giorno: string;
  quando: number;
}

/** What a ledger holds. */
export interface LedgerBook {
  saldi: Record<string, number>;
  /** The events already credited: what makes a payment count once. */
  eventi: Record<string, PaymentRecord>;
  ricariche: GrantRecord[];
}

export const emptyBook = (): LedgerBook => ({ saldi: {}, eventi: {}, ricariche: [] });

const money = (v: number) => Math.round(v * 1e6) / 1e6;
const held = (b: LedgerBook, id: string) => (Object.hasOwn(b.saldi, id) ? b.saldi[id] : 0);

/**
 * Balances and payments of a universe. Each operation is one step on the book (`update`): nothing else happens between what it
 * checks and what it writes. There is no way here to set a balance to a number: credits come from a payment or a gift, and go by a charge.
 */
export abstract class Ledger {
  protected abstract read(): LedgerBook;
  protected abstract update<T>(fn: (book: LedgerBook) => T): T;

  balance(id: string): number {
    return held(this.read(), id);
  }

  /** A payment already credited, if it was. */
  payment(eventId: string): PaymentRecord | undefined {
    const book = this.read();
    return Object.hasOwn(book.eventi, eventId) ? book.eventi[eventId] : undefined;
  }

  /** A wanderer's payments, as they were recorded. */
  paymentsOf(id: string): PaymentRecord[] {
    return Object.values(this.read().eventi).filter((p) => p?.wandererId === id);
  }

  /** Adds credits. */
  credit(id: string, amount: number): number {
    return this.update((b) => (b.saldi[id] = money(held(b, id) + amount)));
  }

  /** Takes credits, down to zero at most. */
  charge(id: string, amount: number): { before: number; after: number } {
    return this.update((b) => {
      const before = held(b, id);
      const after = Math.max(0, money(before - amount));
      b.saldi[id] = after;
      return { before, after };
    });
  }

  /** Credits a payment unless its event was credited already: false then. One step: the same event twice, at the same moment, counts once. */
  pay(p: PaymentRecord): boolean {
    return this.update((b) => {
      if (Object.hasOwn(b.eventi, p.eventId)) return false;
      b.eventi[p.eventId] = { ...p };
      b.saldi[p.wandererId] = money(held(b, p.wandererId) + p.crediti);
      return true;
    });
  }

  /** A gift by the master, within what `cap` leaves of the day. What was left if it does not fit, undefined if it went through. */
  grant(da: string, a: string, crediti: number, cap: number, now: number): { left: number } | undefined {
    const giorno = new Date(now).toISOString().slice(0, 10);
    return this.update((b) => {
      const given = b.ricariche.reduce((sum, r) => sum + (r.giorno === giorno ? r.crediti : 0), 0);
      if (money(given + crediti) > cap) return { left: Math.max(0, money(cap - given)) };
      b.ricariche.push({ da, a, crediti, giorno, quando: now });
      b.saldi[a] = money(held(b, a) + crediti);
      return undefined;
    });
  }
}

/** A ledger that lasts as long as its kernel: a mirror's, which only shows what the server says, and the tests'. */
export class MemoryLedger extends Ledger {
  private book = emptyBook();
  protected read(): LedgerBook {
    return this.book;
  }
  protected update<T>(fn: (book: LedgerBook) => T): T {
    return fn(this.book);
  }
}

/** What the master may give by hand in a day when nobody said (a server without accounts: ADR-0104). */
export const DEFAULT_GRANT_CAP = 20;

/**
 * Additional AI budget derived from an entrant's credit cap (T45d: "il tetto di crediti si somma ai budget di ai").
 * When a player sets a spending ceiling in the lobby, it expands the session limits for calls and content.
 */
export function addBudgetFromCap(
  ai: { textModel?: string; maxText: number; maxForges: number; maxPacks?: number; maxCast?: number; maxModels?: number },
  tetto: number,
): { textCalls: number; forges: number; packs: number; cast: number; models: number } {
  if (tetto <= 0) return { textCalls: 0, forges: 0, packs: 0, cast: 0, models: 0 };
  const textCalls = Math.max(1, Math.round(tetto * 750));
  const forges = Math.max(0, Math.floor(tetto * 2));
  const packs = Math.max(0, Math.floor(tetto * 2));
  const cast = Math.max(0, Math.floor(tetto * 1));
  const models = Math.max(0, Math.floor(tetto * 5));
  ai.maxText += textCalls;
  ai.maxForges += forges;
  if (ai.maxPacks !== undefined) ai.maxPacks += packs;
  if (ai.maxCast !== undefined) ai.maxCast += cast;
  if (ai.maxModels !== undefined) ai.maxModels += models;
  return { textCalls, forges, packs, cast, models };
}


