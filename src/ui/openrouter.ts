// «Collega OpenRouter» (T364, ADR-0197, docs/design/open-beta.md § 1.2): the player's own key of OpenRouter, linked from the game (the lobby, the
// panel P) and from the site. The main way is OpenRouter's OAuth PKCE: this page makes the verifier and its challenge, the server gives the
// `state` (`/api/openrouter/begin`), OpenRouter asks the player and comes back here with a code; the code and the verifier go to the server,
// which exchanges them and keeps the key: the key never reaches this page. The fallback is a key pasted by the player. What the page shows of a
// key is its fingerprint and what OpenRouter says of its limit (`GET /api/openrouter/key`, from `/api/v1/key`). OpenRouter takes no limit with
// the link: the game proposes one (the ceiling of the lobby, or PROPOSED_LIMIT) and the player sets it on the key, on OpenRouter's page.
// No three.js and nothing of the kernel here but types: the site carries it too.

import type { KeyLimits } from '../kernel/ai/openrouter';
import { el } from './dom';

/** Where OpenRouter asks the player (the PKCE flow) and where a key's limit is set. */
export const OPENROUTER_AUTH = 'https://openrouter.ai/auth';
export const OPENROUTER_KEYS_PAGE = 'https://openrouter.ai/settings/keys';
/** The name the key gets on OpenRouter, so that the player knows which one to limit or revoke. */
export const KEY_LABEL = 'QUINE42';
/** Dollars proposed as the key's limit where no ceiling is chosen (the panel P, the site). */
export const PROPOSED_LIMIT = 5;
/** Where a flow waits for the way back, in this tab only: the verifier and the state, never a key. */
const FLOW_KEY = 'quine:openrouter:flow';
/** How long a flow may wait for the way back: OpenRouter's code lives ten minutes. */
const FLOW_TTL = 15 * 60 * 1000;

/** What `/api/openrouter/status` says: whether the calls of whoever asks can be paid, and with what. Never a key. */
export interface LinkStatus {
  available: boolean;
  linked: boolean;
  server: boolean;
  /** Whether the worlds of many of this server pay through OpenRouter (absent where the server does not say). */
  worlds?: boolean;
  fingerprint?: string;
  exhausted?: boolean;
}

/** What `GET /api/openrouter/key` says of the caller's key. */
export interface KeyState {
  linked: boolean;
  fingerprint?: string;
  exhausted?: boolean;
  limits?: KeyLimits;
  limitsError?: string;
  /** OpenRouter said 401 while asked: the key was revoked, and forgotten. */
  forgotten?: boolean;
}

export type LinkAnswer = { ok: true; fingerprint: string } | { ok: false; reason: string };

/** How a page says who it is to the route: a token, or (without accounts) the wanderer's id. */
export type LinkHeaders = () => Record<string, string> | Promise<Record<string, string>>;

const b64url = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** A verifier (RFC 7636: 43-128 unreserved characters) and its S256 challenge. */
export async function pkcePair(): Promise<{ verifier: string; challenge: string }> {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(48)));
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  return { verifier, challenge: b64url(digest) };
}

/** The address of a page as the way back: without the code and the state of a flow, and without a fragment (an invite is never carried there). */
export function callbackOf(href: string): string {
  const u = new URL(href);
  u.searchParams.delete('code');
  u.searchParams.delete('state');
  u.hash = '';
  return u.toString();
}

/** OpenRouter's page that asks the player (the PKCE flow with S256, the state against CSRF, the key's label). */
export function authUrl(o: { callback: string; challenge: string; state: string }): string {
  const q = new URLSearchParams({ callback_url: o.callback, code_challenge: o.challenge, code_challenge_method: 'S256', state: o.state, key_label: KEY_LABEL });
  return `${OPENROUTER_AUTH}?${q}`;
}

interface Flow {
  verifier: string;
  state: string;
  at: number;
}

function readFlow(): Flow | undefined {
  try {
    const f = JSON.parse(sessionStorage.getItem(FLOW_KEY) ?? 'null');
    return f && typeof f.verifier === 'string' && typeof f.state === 'string' && Number.isFinite(f.at) ? f : undefined;
  } catch {
    return undefined;
  }
}

const dropFlow = () => {
  try {
    sessionStorage.removeItem(FLOW_KEY);
  } catch {
    /* nothing kept */
  }
};

const reasonOf = (body: unknown, fallback: string): string => {
  const e = (body as { error?: unknown })?.error;
  return typeof e === 'string' ? e : typeof (e as { message?: unknown })?.message === 'string' ? String((e as { message: string }).message) : fallback;
};

/** The route of the keys, for one page: who it is comes from `headers`. */
export class OpenRouterLink {
  constructor(
    private headers: LinkHeaders,
    private base = '/api/openrouter',
  ) {}

  private async call(path: string, init: { method?: string; body?: unknown } = {}): Promise<{ ok: boolean; status: number; body: unknown }> {
    try {
      const who = await this.headers();
      const r = await fetch(`${this.base}${path}`, {
        method: init.method ?? 'GET',
        cache: 'no-store',
        headers: { ...who, ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
        ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
      });
      return { ok: r.ok, status: r.status, body: await r.json().catch(() => undefined) };
    } catch {
      return { ok: false, status: 0, body: undefined };
    }
  }

  /** Whether this server has the route and what it can pay with for whoever asks; undefined without the route. */
  async status(): Promise<LinkStatus | undefined> {
    const r = await this.call('/status');
    return r.ok && r.body && typeof r.body === 'object' ? (r.body as LinkStatus) : undefined;
  }

  /** The caller's key as OpenRouter sees it; undefined if the route refused. */
  async key(): Promise<KeyState | undefined> {
    const r = await this.call('/key');
    return r.ok && r.body && typeof r.body === 'object' ? (r.body as KeyState) : undefined;
  }

  /** Begins the flow: a reason if it could not, else the page goes to OpenRouter. */
  async begin(href = location.href, go: (url: string) => void = (u) => location.assign(u)): Promise<string | undefined> {
    if (!globalThis.crypto?.subtle) return 'questa pagina non è in un contesto sicuro (https o localhost): incolla una chiave';
    const r = await this.call('/begin', { method: 'POST' });
    const state = (r.body as { state?: unknown })?.state;
    if (!r.ok || typeof state !== 'string') return reasonOf(r.body, r.status ? `il server non ha cominciato il collegamento (${r.status})` : 'il server non risponde');
    const { verifier, challenge } = await pkcePair();
    try {
      sessionStorage.setItem(FLOW_KEY, JSON.stringify({ verifier, state, at: Date.now() } satisfies Flow));
    } catch {
      return 'questa scheda non può tenere il collegamento a metà: incolla una chiave';
    }
    go(authUrl({ callback: callbackOf(href), challenge, state }));
    return undefined;
  }

  /** Whether this page is the way back of a flow begun in this tab. */
  static returning(href = location.href): boolean {
    const q = new URL(href).searchParams;
    return q.has('code') && !!readFlow();
  }

  /**
   * The way back: the code and the state off the address at once (no history keeps them), checked against the flow of this tab, then the code
   * and the verifier to the server, which exchanges them. Undefined if this page is not a way back.
   */
  async finish(href = location.href): Promise<LinkAnswer | undefined> {
    const u = new URL(href);
    const code = u.searchParams.get('code');
    const state = u.searchParams.get('state');
    const flow = readFlow();
    if (!code || !flow) return undefined;
    try {
      history.replaceState(history.state, '', callbackOf(href));
    } catch {
      /* not a page: the tests */
    }
    dropFlow();
    if (Date.now() - flow.at > FLOW_TTL) return { ok: false, reason: 'il collegamento è scaduto: ricomincia' };
    if (state !== flow.state) return { ok: false, reason: 'il ritorno da OpenRouter non è quello cominciato qui: ricomincia' };
    const r = await this.call('/key', { method: 'POST', body: { code, verifier: flow.verifier, state } });
    const fingerprint = (r.body as { fingerprint?: unknown })?.fingerprint;
    return r.ok && typeof fingerprint === 'string' ? { ok: true, fingerprint } : { ok: false, reason: reasonOf(r.body, 'il collegamento non è riuscito') };
  }

  /** The fallback: a key the player pasted. */
  async paste(key: string): Promise<LinkAnswer> {
    const r = await this.call('/key', { method: 'POST', body: { key: key.trim() } });
    const fingerprint = (r.body as { fingerprint?: unknown })?.fingerprint;
    return r.ok && typeof fingerprint === 'string' ? { ok: true, fingerprint } : { ok: false, reason: reasonOf(r.body, 'la chiave non è stata presa') };
  }

  /** Forgets the caller's key on this server (on OpenRouter it stays until the player revokes it). */
  async forget(): Promise<boolean> {
    const r = await this.call('/key', { method: 'DELETE' });
    return r.ok;
  }
}

const dollars = (v: number) => `$${v.toFixed(2)}`;

/** What the key's limit says in words: what is left, and whether it is near the proposed ceiling. */
export function limitWords(l: KeyLimits, proposed: number): { text: string; warn?: string } {
  const period = l.reset === 'daily' ? ' al giorno' : l.reset === 'weekly' ? ' alla settimana' : l.reset === 'monthly' ? ' al mese' : '';
  const spent = `spesi finora ${dollars(l.usage)}`;
  if (l.limit === null) return { text: `Chiave senza limite (${spent}).`, warn: `Ti proponiamo un limite di ${dollars(proposed)}${period || ''}: impostalo sulla chiave «${l.label ?? KEY_LABEL}» nella pagina delle chiavi di OpenRouter.` };
  const left = l.remaining ?? Math.max(0, l.limit - l.usage);
  const text = `Limite della chiave ${dollars(l.limit)}${period}: restano ${dollars(left)} (${spent}).`;
  if (left <= 0) return { text, warn: 'Il limite è finito: alzalo su OpenRouter, o il gioco continua con i modelli locali.' };
  if (l.limit > proposed * 4) return { text, warn: `È molto più del tetto proposto (${dollars(proposed)}): se vuoi, abbassalo su OpenRouter.` };
  return { text };
}

export interface LinkBoxOptions {
  /** The limit the game proposes for the key, in dollars (the ceiling of the lobby, or PROPOSED_LIMIT). */
  proposed?: () => number;
  /** Alone on this machine: the key also stays beside the universes, and takes effect when the page loads again. */
  alone?: boolean;
  /** Something changed (linked, forgotten): who shows the box may want to say it elsewhere. */
  onChange?: (state: KeyState) => void;
}

/**
 * The box «Collega OpenRouter»: the state of the key (fingerprint, limit and what is left), the button of the PKCE flow, the fallback of the
 * paste, «Scollega». On the way back of a flow begun in this tab, it finishes it first.
 */
export function openRouterBox(link: OpenRouterLink, o: LinkBoxOptions = {}): HTMLElement {
  const proposed = () => Math.max(0.5, Number(o.proposed?.()) || PROPOSED_LIMIT);
  const root = el('div', { class: 'openrouter-box' });
  const title = el('div', { class: 'section-title' }, 'La tua chiave di OpenRouter');
  const state = el('div', { class: 'openrouter-state' }, 'Lettura della chiave…');
  const limits = el('div', { class: 'openrouter-limits note' });
  const warn = el('div', { class: 'openrouter-warn note' });
  const status = el('div', { class: 'openrouter-status note', role: 'status' });
  const connect = el('button', { type: 'button', class: 'primary comic-btn', 'data-openrouter': 'collega' }, 'Collega OpenRouter');
  const forget = el('button', { type: 'button', class: 'comic-btn', 'data-openrouter': 'scollega' }, 'Scollega');
  const pasteInput = el('input', { type: 'password', autocomplete: 'off', spellcheck: 'false', placeholder: 'sk-or-v1-…', 'aria-label': 'Chiave di OpenRouter' }) as HTMLInputElement;
  const pasteButton = el('button', { type: 'button', class: 'comic-btn', 'data-openrouter': 'incolla' }, 'Usa questa chiave');
  const paste = el(
    'details',
    { class: 'openrouter-paste' },
    el('summary', {}, 'Hai già una chiave? Incollala'),
    el('div', { class: 'note' }, 'Meglio una chiave con un limite suo, solo per questo gioco. Il server la tiene e non la mostra più: qui ne vedi solo l’impronta.'),
    el('div', { class: 'row' }, pasteInput, pasteButton),
  );
  const proposal = el('div', { class: 'note openrouter-proposal' });
  const keysPage = el('a', { href: OPENROUTER_KEYS_PAGE, target: '_blank', rel: 'noopener noreferrer' }, 'pagina delle chiavi di OpenRouter');
  const proposalText = () => {
    proposal.replaceChildren(
      `Paghi i modelli con il tuo credito di OpenRouter, senza ricarichi. La chiave che nasce si chiama «${KEY_LABEL}»; ti proponiamo un limite di ${dollars(proposed())}: OpenRouter non lo prende dal collegamento: lo imposti tu sulla chiave, nella `,
      keysPage,
      '.',
    );
  };
  root.append(title, state, limits, warn, el('div', { class: 'row openrouter-actions' }, connect, forget), paste, proposal, status);
  if (o.alone) root.append(el('div', { class: 'note' }, 'Da soli su questo PC la chiave resta accanto agli universi (mai dentro un universo). Collegata con il pulsante vale subito; incollata, dalla prossima apertura del gioco.'));

  const show = (k: KeyState | undefined) => {
    proposalText();
    limits.textContent = '';
    warn.textContent = '';
    if (!k) {
      state.textContent = 'Questo server non collega chiavi di OpenRouter (o serve un account).';
      connect.hidden = true;
      forget.hidden = true;
      paste.hidden = true;
      return;
    }
    connect.hidden = false;
    paste.hidden = false;
    forget.hidden = !k.linked;
    connect.textContent = k.linked ? 'Collega un’altra chiave' : 'Collega OpenRouter';
    if (!k.linked) {
      state.textContent = k.forgotten ? 'La chiave è stata revocata su OpenRouter: il server l’ha dimenticata.' : 'Nessuna chiave collegata: le tue chiamate vanno ai modelli locali (o alla chiave di chi ospita).';
      return;
    }
    state.replaceChildren('Collegata: ', el('code', { title: 'SHA-256 della chiave, come lo mostra OpenRouter' }, `${k.fingerprint?.slice(0, 12)}…`), k.exhausted ? ' · credito finito (402): collega una chiave nuova o alza il limite' : '');
    if (k.limits) {
      const w = limitWords(k.limits, proposed());
      limits.textContent = w.text;
      warn.textContent = w.warn ?? '';
    } else if (k.limitsError) limits.textContent = `Il limite della chiave non si legge ora: ${k.limitsError}.`;
  };
  const refresh = async () => {
    const k = await link.key();
    show(k);
    if (k) o.onChange?.(k);
    return k;
  };
  const busy = (on: boolean) => {
    for (const b of [connect, forget, pasteButton]) b.disabled = on;
  };
  connect.onclick = async () => {
    busy(true);
    status.textContent = 'Si va su OpenRouter: accedi, autorizza, e il gioco torna qui.';
    const why = await link.begin();
    if (why) {
      status.textContent = `Non riesco a cominciare: ${why}.`;
      busy(false);
    }
  };
  forget.onclick = async () => {
    busy(true);
    status.textContent = (await link.forget()) ? 'Scollegata: il server l’ha dimenticata. Su OpenRouter resta finché non la revochi.' : 'Non è stato possibile scollegarla.';
    await refresh();
    busy(false);
  };
  pasteButton.onclick = async () => {
    if (!pasteInput.value.trim()) return;
    busy(true);
    const r = await link.paste(pasteInput.value);
    pasteInput.value = '';
    status.textContent = r.ok ? `Chiave collegata${o.alone ? ': vale dalla prossima apertura del gioco' : ''}.` : `Non collegata: ${r.reason}.`;
    if (r.ok) paste.open = false;
    await refresh();
    busy(false);
  };
  // Typing a key is not playing.
  root.addEventListener('keydown', (e) => e.stopPropagation());
  void (async () => {
    if (OpenRouterLink.returning()) {
      status.textContent = 'Ritorno da OpenRouter: il server scambia il codice…';
      const r = await link.finish();
      if (r) status.textContent = r.ok ? `OpenRouter collegato${o.alone ? ': vale dalla prossima apertura del gioco' : ''}.` : `Collegamento non riuscito: ${r.reason}.`;
    }
    await refresh();
  })();
  return root;
}
