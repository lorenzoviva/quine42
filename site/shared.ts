// What the site's pages with an account share (T102, T105): the navigation, the alert, the sign-in panel (Firebase Auth with
// Google or anonymously, `src/session/login.ts`; a server without accounts takes a wanderer's id), the list of universes.
// No three.js here: a page that draws nothing in 3D must not carry it.

import { validWandererId } from '../src/kernel/wanderers';
import { accountConfig, NEEDS_INVITE, signIn, type SignedIn } from '../src/session/login';
import { pickUniverse, store, stored, UNIVERSE_KEY } from './launcher-core';

// What the landing shares with the pages with an account, without carrying the sign-in (launcher-core.ts).
export { pickUniverse, store, stored, UNIVERSE_KEY };

/** Who a page asks for: an account (its token) or, without accounts, an id. */
export interface Who {
  signed?: SignedIn;
  localId?: string;
}

/** The site remembers, without accounts, the id the player typed (the universe: `UNIVERSE_KEY`, launcher-core.ts). */
const LOCAL_ID_KEY = 'quine:sito:viandante';

/** Credits in dollars, as the game's panel says them. */
export function formatCredits(n: number): string {
  return `$${(Number.isFinite(n) ? Math.max(0, n) : 0).toFixed(2)}`;
}

/** Where the game opens this universe (a server without accounts also needs to know which wanderer). */
export function playLink(universo: string, view: { id: string; account: string }): string {
  const q = new URLSearchParams({ universo });
  if (view.account === 'locale') q.set('viandante', view.id);
  return `../index.html?${q}`;
}

/** Escapes special HTML characters to prevent XSS. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

export function alertBox(kind: 'success' | 'warning' | 'error' | 'info', badge: string, text: string): void {
  const box = $('page-alert');
  box.className = `comic-alert ${kind}`;
  const b = $('page-alert-badge');
  b.className = `comic-badge ${kind === 'success' ? 'green' : kind === 'error' ? 'pink' : kind === 'warning' ? 'yellow' : 'cyan'}`;
  b.textContent = badge;
  $('page-alert-text').textContent = text;
  box.hidden = false;
}

export function hideAlert(): void {
  $('page-alert').hidden = true;
}

export function initNav(): void {
  const toggle = $('nav-toggle');
  const links = $('nav-links');
  const actions = document.querySelector('.nav-actions');
  toggle.addEventListener('click', () => {
    const open = !links.classList.contains('is-open');
    links.classList.toggle('is-open', open);
    actions?.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });
}

/** The sign-in panel's two buttons, as the way `signIn` asks how the player comes in. */
function chooseOnPage(content: HTMLElement): () => Promise<'google' | 'anonimo'> {
  let attempts = 0;
  return () =>
    new Promise((resolve) => {
      // Asked again: the popup was closed or the account refused.
      if (attempts++) alertBox('error', 'ZAP!', 'Accesso non riuscito: riprova.');
      else hideAlert();
      content.hidden = true;
      $('login-panel').hidden = false;
      $('login-accounts').hidden = false;
      $('login-direct').hidden = true;
      const done = (how: 'google' | 'anonimo') => {
        $('btn-google-login').onclick = null;
        $('btn-anon-login').onclick = null;
        $('login-panel').hidden = true;
        alertBox('info', 'UN ATTIMO', how === 'google' ? 'Apertura dell’accesso con Google…' : 'Ingresso come anonimo…');
        resolve(how);
      };
      $('btn-google-login').onclick = () => done('google');
      $('btn-anon-login').onclick = () => done('anonimo');
    });
}

/** Without accounts on the server: the wanderer's id, typed once and remembered. */
function askLocalId(content: HTMLElement): Promise<string> {
  const kept = new URLSearchParams(location.search).get('viandante')?.toLowerCase() ?? stored(LOCAL_ID_KEY);
  if (validWandererId(kept)) return Promise.resolve(kept);
  return new Promise((resolve) => {
    content.hidden = true;
    $('login-panel').hidden = false;
    $('login-accounts').hidden = true;
    $('login-sub').textContent = 'Scegli il viandante di cui aprire la scheda';
    const form = $<HTMLFormElement>('login-direct');
    form.hidden = false;
    const input = $<HTMLInputElement>('login-id');
    form.onsubmit = (e) => {
      e.preventDefault();
      const id = input.value.trim().toLowerCase();
      const ok = validWandererId(id);
      $('login-id-error').hidden = ok;
      input.classList.toggle('is-error', !ok);
      if (!ok) return;
      store(LOCAL_ID_KEY, id);
      $('login-panel').hidden = true;
      resolve(id);
    };
  });
}

/** Who is using the page: signs in on the panel, hiding `content` while it asks. Undefined if the sign-in failed. */
export async function pageLogin(content: HTMLElement): Promise<Who | undefined> {
  const config = await accountConfig();
  if (!config) return { localId: await askLocalId(content) };
  try {
    return { signed: await signIn(config, chooseOnPage(content)) };
  } catch (e) {
    // A server of invites (ADR-0193) without an identity in this browser: what to do is ask the master for a link.
    alertBox('error', 'ZAP!', String((e as Error)?.message ?? '').includes(NEEDS_INVITE) ? `${(e as Error).message}.` : 'L’accesso non è riuscito: ricarica la pagina e riprova.');
    return undefined;
  }
}

/** Leaves: the account, or the id the page remembered. */
export async function pageSignOut(who: Who): Promise<void> {
  if (who.signed) return who.signed.signOut();
  store(LOCAL_ID_KEY, undefined);
  location.replace(location.pathname);
}

/** The universes on this server, undefined if it does not answer. */
export async function universes(): Promise<string[] | undefined> {
  try {
    const r = await fetch('/api/universe', { cache: 'no-store' });
    const body = r.ok ? ((await r.json()) as { available?: boolean; universes?: string[] }) : undefined;
    return body?.available ? body.universes ?? [] : undefined;
  } catch {
    return undefined;
  }
}
