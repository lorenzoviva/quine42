// The credits page of the site (T105, ADR-0095): a wanderer's balance in a universe, a top-up through Stripe Checkout (the
// protected session of /api/stripe/checkout, ADR-0083) and the two ledgers, top-ups and spending (/api/crediti, server/wallet.ts).
// One credit is one dollar. Credits arrive only through Stripe's webhook, never from the return to this page: coming back,
// the page waits to see the payment in the ledger before it says it was credited.

import { $, alertBox, formatCredits, hideAlert, initNav, pageLogin, pageSignOut, pickUniverse, playLink, universes, UNIVERSE_KEY, store, stored, type Who } from './shared';
import { feePercent } from '../src/kernel/credits';
import { rechargesAvailable } from '../src/ui/recharges';
import type { Wallet } from '../server/wallet';

/** What the checkout accepts (`/api/stripe/checkout`). */
export const MIN_TOPUP = 1;
export const MAX_TOPUP = 1000;
/** Coming back from Stripe: how many times and how often the page looks for the payment. */
const WATCH_TRIES = 15;
const WATCH_MS = 2000;

/** A typed amount in dollars, to the cent, or undefined if the checkout would refuse it. Accepts the Italian comma. */
export function parseAmount(raw: string): number | undefined {
  const text = raw.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(text)) return undefined;
  const n = Math.round(Number(text) * 100) / 100;
  return n >= MIN_TOPUP && n <= MAX_TOPUP ? n : undefined;
}

/** Where Stripe brings the player back: this page, this universe, and without accounts this wanderer. */
export function returnUrlFor(origin: string, pathname: string, universo: string, localId?: string): string {
  const q = new URLSearchParams({ universo });
  if (localId) q.set('viandante', localId);
  return `${origin}${pathname}?${q}`;
}

/** What the address says of the return from Stripe. */
export function returnState(search: string): { esito?: 'successo' | 'annullata'; sessione?: string } {
  const q = new URLSearchParams(search);
  const r = q.get('ricarica');
  const esito = r === 'successo' || r === 'annullata' ? r : undefined;
  const sessione = esito === 'successo' ? q.get('session_id') : null;
  return { ...(esito ? { esito } : {}), ...(sessione ? { sessione } : {}) };
}

/** The address without what only the return needed, so that a reload does not announce the payment again. */
export function cleanSearch(search: string): string {
  const q = new URLSearchParams(search);
  q.delete('ricarica');
  q.delete('session_id');
  const s = q.toString();
  return s ? `?${s}` : '';
}

/** Only an https address leaves the site for the checkout. */
export function checkoutTarget(url: unknown): string | undefined {
  if (typeof url !== 'string') return undefined;
  try {
    return new URL(url).protocol === 'https:' ? url : undefined;
  } catch {
    return undefined;
  }
}

/** A date as the table says it, in the player's time. */
export function formatDate(ms: number): string {
  return new Date(ms).toLocaleString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** A day of the ledger (`2026-11-01`) as the table says it. It is already a date: no time zone may move it. */
export function formatDay(day: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!m) return day;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Spending under a cent is real money too: it must not read as zero. */
export function formatSpent(n: number): string {
  return n > 0 && n < 0.01 ? `$${n.toFixed(4)}` : formatCredits(n);
}

/** What a credit pays for, with the fee this server decided (ADR-0132). */
export function feeText(fee: number): string {
  return fee > 0 ? `il loro costo, più la commissione della piattaforma (${feePercent(fee)})` : 'il loro costo, senza commissioni';
}

/** What the balance is for, in this universe: anonymous, alone, where everyone pays their own, or where the master pays (T372, ADR-0188). */
export function walletNote(w: Pick<Wallet, 'anonimo' | 'multigiocatore' | 'masterPays' | 'master'>): string {
  if (w.multigiocatore && w.masterPays)
    return w.master
      ? 'In questo universo paghi tu la partita: ogni richiesta del mondo e dei viandanti si scala dal tuo saldo, e le carte che nascono sono tue.'
      : 'In questo universo paga il master: le tue richieste non si scalano dal tuo saldo.';
  if (w.anonimo) return 'Un viandante anonimo non ha crediti: gioca con i modelli locali.';
  return w.multigiocatore ? 'Si scala a ogni richiesta che fai al mondo.' : 'In questo universo giochi da solo: il saldo non si scala, serve quando l’universo è condiviso.';
}

/**
 * The two sentences of the page that depend on who pays (T382): how the common spending goes, and what the spending table leaves out.
 * Where the master pays (ADR-0188) nothing is split among those connected: the master pays everything, the others nothing.
 */
export function payerTexts(w: Pick<Wallet, 'multigiocatore' | 'masterPays' | 'master'>): { common: string; spendingHint: string } {
  if (w.multigiocatore && w.masterPays)
    return w.master
      ? {
          common: 'In questo universo paghi tu: le richieste degli altri viandanti e ciò che arricchisce il mondo di tutti si scalano dal tuo saldo.',
          spendingHint: 'Gli ultimi 30 giorni, per le tue richieste. Ciò che hai pagato per gli altri viandanti e per il mondo è già nel saldo ed è a parte, in «Pagate per gli altri».',
        }
      : {
          common: 'In questo universo paga il master: anche ciò che arricchisce il mondo di tutti è a suo carico.',
          spendingHint: 'Gli ultimi 30 giorni, per le richieste a tuo carico. In questo universo paga il master: ciò che chiedi non si scala dal tuo saldo e non compare qui.',
        };
  return {
    common: 'Ciò che arricchisce il mondo di tutti si divide in parti uguali tra chi è collegato.',
    spendingHint: 'Gli ultimi 30 giorni, per le richieste a tuo carico. La tua parte delle spese comuni è già nel saldo ma non compare qui.',
  };
}

/**
 * The amounts of a table and of its total as the page writes them, so that the rows add up to what it says (T382). Every row is
 * rounded to the cent (or to the hundredth of a cent if one is under a cent, which must not read as zero) by largest remainder, so
 * that they add up to the rounded sum of the rows; the total is that plus, rounded, what the days not shown add.
 */
export function tableAmounts(values: number[], total: number): { rows: string[]; total: string } {
  const clean = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
  const rows = values.map(clean);
  const shown = rows.reduce((s, v) => s + v, 0);
  const all = Math.max(clean(total), shown);
  const digits = [...rows, all].some((v) => v > 0 && v < 0.01) ? 4 : 2;
  const unit = 10 ** digits;
  // A hair of tolerance: 0.29 * 100 is 28.999999999999996, which is 29 units.
  const exact = rows.map((v) => v * unit);
  const units = exact.map((x) => Math.floor(x + 1e-6));
  let left = Math.round(shown * unit) - units.reduce((s, u) => s + u, 0);
  const order = exact.map((x, i) => [x - units[i], i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, i] of order) {
    if (left <= 0) break;
    units[i]++;
    left--;
  }
  const rest = Math.round(Math.max(0, all - shown) * unit);
  const money = (u: number) => `$${(u / unit).toFixed(digits)}`;
  return { rows: units.map(money), total: money(units.reduce((s, u) => s + u, 0) + rest) };
}

/** Who the master paid for, as the table says it: `comune` is the world itself. */
export const paidForName = (who: string): string => (who === 'comune' ? 'il mondo' : who);

function cell(text: string, className?: string): HTMLTableCellElement {
  const td = document.createElement('td');
  td.textContent = text;
  if (className) td.className = className;
  return td;
}

function emptyRow(columns: number, text: string): HTMLTableRowElement {
  const tr = document.createElement('tr');
  const td = cell(text, 'text-dim');
  td.colSpan = columns;
  tr.append(td);
  return tr;
}

class WalletPage {
  private wallet?: Wallet;
  private stripeOn = false;
  private amount = $<HTMLInputElement>('custom-amount');
  private pay = $<HTMLButtonElement>('btn-stripe-pay');
  private universe = $<HTMLSelectElement>('universe-select');
  private loads = 0;

  constructor(private who: Who) {
    for (const tier of document.querySelectorAll<HTMLButtonElement>('.tier-card')) {
      tier.onclick = () => {
        this.amount.value = tier.dataset.val ?? '';
        this.syncAmount();
      };
    }
    this.amount.addEventListener('input', () => this.syncAmount());
    this.pay.onclick = () => void this.checkout();
    this.universe.onchange = () => void this.load(this.universe.value);
    $('btn-link-google').onclick = () => {
      this.who.signed?.linkGoogle().catch((e: Error) => alertBox('error', 'ZAP!', e.message));
    };
    $('nav-out').onclick = () => void pageSignOut(this.who);
    $('nav-out').hidden = false;
    this.syncAmount();
  }

  async start(): Promise<void> {
    const list = await universes();
    if (!list) return alertBox('error', 'ZAP!', 'Il mondo non risponde: riprova tra poco.');
    if (!list.length) return alertBox('warning', 'NESSUN UNIVERSO', 'Su questo server non c’è ancora nessun universo: entra nel gioco per crearne uno.');
    this.universe.replaceChildren(
      ...list.map((name) => {
        const o = document.createElement('option');
        o.value = name;
        o.textContent = name;
        return o;
      }),
    );
    $('wallet-grid').hidden = false;
    const chosen = pickUniverse(list, new URLSearchParams(location.search).get('universo'), stored(UNIVERSE_KEY))!;
    this.universe.value = chosen;
    this.stripeOn = await rechargesAvailable();
    // Without payments (the open beta, ADR-0189) there is no top-up to offer: the panel goes, the balance and the ledgers stay.
    $('topup-panel').hidden = !this.stripeOn;
    if (!this.stripeOn) $('wallet-sub').textContent = '// UN CREDITO, UN DOLLARO · SU QUESTO SERVER NIENTE RICARICHE';
    const back = returnState(location.search);
    history.replaceState(null, '', `${location.pathname}${cleanSearch(location.search)}`);
    await this.load(chosen);
    if (back.esito === 'annullata') alertBox('warning', 'ANNULLATA', 'Ricarica annullata: non è stato addebitato nulla.');
    else if (back.esito === 'successo') void this.watch(back.sessione);
  }

  private async fetchWallet(universo: string): Promise<{ wallet?: Wallet; motivo?: string; status: number }> {
    const headers: Record<string, string> = {};
    if (this.who.signed) headers.Authorization = `Bearer ${this.who.signed.token}`;
    const q = new URLSearchParams({ universo });
    if (this.who.localId) q.set('viandante', this.who.localId);
    try {
      const r = await fetch(`/api/crediti?${q}`, { headers, cache: 'no-store' });
      const body = (await r.json().catch(() => ({}))) as { portafoglio?: Wallet; motivo?: string };
      return { wallet: r.ok ? body.portafoglio : undefined, motivo: body.motivo, status: r.status };
    } catch {
      return { motivo: 'il mondo non risponde', status: 0 };
    }
  }

  private async load(universo: string): Promise<void> {
    store(UNIVERSE_KEY, universo);
    const turn = ++this.loads;
    const r = await this.fetchWallet(universo);
    if (turn !== this.loads) return; // Another universe was chosen in the meantime.
    if (!r.wallet) {
      // The universe's selector lives in the grid: it stays, to choose another one.
      $('wallet-ledgers').hidden = true;
      this.wallet = undefined;
      this.syncPay();
      if (r.status === 401) return alertBox('error', 'ZAP!', 'Accesso scaduto: ricarica la pagina per entrare di nuovo.');
      return alertBox('error', 'ZAP!', r.motivo ?? 'Non è stato possibile leggere il portafoglio.');
    }
    hideAlert();
    this.fill(r.wallet);
    $('wallet-ledgers').hidden = false;
  }

  private fill(w: Wallet): void {
    this.wallet = w;
    $('wallet-amount').textContent = formatCredits(w.crediti);
    $('wallet-who').textContent = w.id;
    $('wallet-fee').textContent = feeText(w.commissione);
    $('wallet-note').textContent = walletNote(w);
    $<HTMLAnchorElement>('nav-play').href = playLink(w.universo, w);
    $('btn-link-google').hidden = w.account !== 'anonimo';
    this.fillPayments(w);
    this.fillSpending(w);
    this.syncPay();
  }

  private fillPayments(w: Wallet): void {
    const rows = w.pagamenti.map((p) => {
      const tr = document.createElement('tr');
      const id = cell('');
      const code = document.createElement('code');
      code.className = 'mono-text text-cyan';
      code.textContent = p.id;
      id.append(code);
      tr.append(id, cell(formatDate(p.data)), cell(p.cents === undefined ? '—' : `${formatCredits(p.cents / 100)} USD`), cell(`+${formatCredits(p.crediti)}`, 'text-green'));
      return tr;
    });
    $('payments-body').replaceChildren(...(rows.length ? rows : [emptyRow(4, 'Nessuna ricarica in questo universo.')]));
  }

  private fillSpending(w: Wallet): void {
    const texts = payerTexts(w);
    $('wallet-common').textContent = texts.common;
    $('spending-hint').textContent = texts.spendingHint;
    // The rows and the total rounded together, so that they add up (T382).
    const spent = tableAmounts(w.consumi.map((d) => d.usd), w.totaleConsumi);
    const rows = w.consumi.map((d, i) => {
      const tr = document.createElement('tr');
      tr.append(cell(formatDay(d.giorno)), cell(String(d.chiamate)), cell(spent.rows[i], 'text-yellow'));
      return tr;
    });
    $('spending-body').replaceChildren(...(rows.length ? rows : [emptyRow(3, 'Nessuna richiesta a tuo carico in questo universo.')]));
    $('spending-total').textContent = spent.total;
    // Where the master paid for the others (T372): only in their wallet.
    const paidFor = w.paidFor ?? [];
    const paid = tableAmounts(paidFor.map((d) => d.usd), w.paidForTotal ?? 0);
    $('paid-for-panel').hidden = !paidFor.length;
    $('paid-for-body').replaceChildren(
      ...paidFor.map((d, i) => {
        const tr = document.createElement('tr');
        tr.append(cell(formatDay(d.day)), cell(paidForName(d.who)), cell(String(d.calls)), cell(paid.rows[i], 'text-yellow'));
        return tr;
      }),
    );
    $('paid-for-total').textContent = paid.total;
  }

  /** The tier that matches the amount lights up; the button follows whether it can be paid. */
  private syncAmount(): void {
    const n = parseAmount(this.amount.value);
    for (const tier of document.querySelectorAll<HTMLButtonElement>('.tier-card')) {
      const on = n !== undefined && Number(tier.dataset.val) === n;
      tier.classList.toggle('selected', on);
      tier.setAttribute('aria-pressed', String(on));
    }
    const wrong = this.amount.value.trim() !== '' && n === undefined;
    this.amount.classList.toggle('is-error', wrong);
    $('amount-error').hidden = !wrong;
    this.syncPay();
  }

  private syncPay(): void {
    const w = this.wallet;
    const n = parseAmount(this.amount.value);
    this.pay.disabled = !w || w.anonimo || !this.stripeOn || n === undefined;
    $('pay-label').textContent = n === undefined ? 'PAGA CON STRIPE' : `PAGA ${formatCredits(n)} CON STRIPE`;
    const why = $('pay-why');
    why.textContent = !w ? '' : w.anonimo ? 'Gli account anonimi non possono ricaricare: lega il viandante a Google.' : this.stripeOn ? '' : 'Le ricariche non sono attive su questo server.';
    why.hidden = !why.textContent;
  }

  private async checkout(): Promise<void> {
    const w = this.wallet;
    const crediti = parseAmount(this.amount.value);
    if (!w || w.anonimo || crediti === undefined) return;
    this.pay.classList.add('is-loading');
    this.pay.disabled = true;
    const stop = (text: string) => {
      this.pay.classList.remove('is-loading');
      this.syncPay();
      alertBox('error', 'ZAP!', text);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    try {
      const r = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          universo: w.universo,
          wandererId: w.id,
          crediti,
          ...(this.who.signed ? { token: this.who.signed.token } : {}),
          returnUrl: returnUrlFor(location.origin, location.pathname, w.universo, this.who.localId),
        }),
      });
      const body = (await r.json().catch(() => ({}))) as { url?: unknown; motivo?: string };
      const target = r.ok ? checkoutTarget(body.url) : undefined;
      if (!target) return stop(r.status === 401 ? 'Accesso scaduto: ricarica la pagina per entrare di nuovo.' : body.motivo ?? 'La ricarica non è partita: riprova tra poco.');
      location.assign(target);
    } catch {
      stop('Il server non risponde: la ricarica non è partita.');
    }
  }

  /** Back from Stripe: the webhook is what credits, and it may come a moment after the player. */
  private async watch(sessione: string | undefined): Promise<void> {
    const universo = this.universe.value;
    const before = this.wallet?.pagamenti.length ?? 0;
    const seen = (w: Wallet) => (sessione ? w.pagamenti.some((p) => p.id === sessione) : w.pagamenti.length > before);
    if (this.wallet && seen(this.wallet)) return this.credited(this.wallet, sessione);
    alertBox('info', 'IN ARRIVO', 'Pagamento completato: aspettiamo la conferma per accreditarlo.');
    for (let i = 0; i < WATCH_TRIES; i++) {
      await new Promise((r) => setTimeout(r, WATCH_MS));
      if (this.universe.value !== universo) return; // Another universe: this one will show the payment when it comes back.
      const r = await this.fetchWallet(universo);
      if (r.wallet && seen(r.wallet)) {
        this.fill(r.wallet);
        return this.credited(r.wallet, sessione);
      }
    }
    alertBox('warning', 'ANCORA UN ATTIMO', 'Il pagamento è completato ma l’accredito non è ancora arrivato: ricarica la pagina tra qualche minuto.');
  }

  private credited(w: Wallet, sessione: string | undefined): void {
    const p = w.pagamenti.find((x) => x.id === sessione) ?? w.pagamenti[0];
    alertBox('success', 'ACCREDITATO!', `+${formatCredits(p?.crediti ?? 0)}: il saldo è aggiornato.`);
  }
}

async function start(): Promise<void> {
  initNav();
  const who = await pageLogin($('wallet-grid'));
  if (who) await new WalletPage(who).start();
}

if (typeof document !== 'undefined' && document.getElementById('wallet-grid')) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => void start());
  else void start();
}
