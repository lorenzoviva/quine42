// Signing in to a multiplayer game (T44b, ADR-0081): Firebase Auth in the browser, with Google or anonymously. The server
// says how (GET /api/account, server/account.ts); without settings there are no accounts and the tab's id goes as before.
// Firebase is loaded only when it is needed: a game alone never fetches it. Its web settings are public; the token is
// what proves the account, and the server verifies it. A server without Firebase verifies the identities born of its invites (ADR-0193): the
// browser keeps its token (`localStorage`), renews it at every sign-in, and gets it the first time from an invite (`#invito=` in the link) or
// from the owner's link (`#accesso=`, `npm run inviti`). Both stay in the fragment, which the browser never sends: no server's log sees them.

import type { AccountConfig } from './account';
import { el } from '../ui/dom';

export interface SignedIn {
  /** The ID token to send with `entra`. */
  token: string;
  /** A token good now, for coming in again when the world has started again (T127). */
  freshToken(): Promise<string>;
  uid: string;
  anonimo: boolean;
  /** Links an anonymous account to Google: same uid, so the same wanderer (the page enters again). */
  linkGoogle(): Promise<void>;
  signOut(): Promise<void>;
}

/** What the server says of accounts: undefined when it has none (development, the preview, a game alone). */
export async function accountConfig(): Promise<AccountConfig | undefined> {
  try {
    const r = await fetch('/api/account', { cache: 'no-store' });
    if (!r.ok) return undefined;
    const c = (await r.json()) as AccountConfig;
    if (c?.invites === true) return { invites: true };
    return c && typeof c.projectId === 'string' && c.projectId ? c : undefined;
  } catch {
    return undefined;
  }
}

/** Asks the player how they come in, unless they are already signed in. */
function chooseHow(): Promise<'google' | 'anonimo'> {
  return new Promise((resolve) => {
    const google = el('button', { class: 'primary comic-btn arcade' }, 'Entra con Google');
    const anon = el('button', {}, 'Entra come anonimo');
    const box = el(
      'div',
      { id: 'login' },
      el('div', { class: 'title' }, 'Entra nel mondo'),
      el('p', {}, 'Con un account Google il tuo viandante ti segue ovunque.'),
      google,
      el('p', { class: 'dim' }, 'Da anonimo giochi solo con i modelli locali e non puoi recuperare il viandante finché non lo leghi a Google.'),
      anon,
    );
    const done = (how: 'google' | 'anonimo') => {
      box.remove();
      resolve(how);
    };
    google.onclick = () => done('google');
    anon.onclick = () => done('anonimo');
    document.body.append(box);
  });
}

/** How the player chooses to come in: the game's own box, or the site's buttons (T102). */
export type ChooseHow = () => Promise<'google' | 'anonimo'>;

export async function signIn(config: AccountConfig, choose: ChooseHow = chooseHow): Promise<SignedIn> {
  return (await firebaseSignIn(config, choose))!;
}

/** Who this browser is already signed in as, without asking: undefined if nobody (ADR-0193: a guest's page reads a private universe as them). */
export async function signedIn(config: AccountConfig): Promise<SignedIn | undefined> {
  if (config.invites) return storedIdentity() || location.hash.includes('accesso=') ? signInWithIdentity() : undefined;
  return firebaseSignIn(config, undefined);
}

async function firebaseSignIn(config: AccountConfig, choose: ChooseHow | undefined): Promise<SignedIn | undefined> {
  if (config.invites) return signInWithIdentity();
  const { getApps, initializeApp } = await import('firebase/app');
  const fa = await import('firebase/auth');
  // A page may ask twice (whether it is signed in, then to sign in): the app and its emulator once.
  const known = getApps().find((x) => x.name === 'quine');
  const app = known ?? initializeApp({ apiKey: config.apiKey, authDomain: config.authDomain, projectId: config.projectId }, 'quine');
  const auth = fa.getAuth(app);
  if (config.emulator && !known) fa.connectAuthEmulator(auth, `http://${config.emulator}`, { disableWarnings: true });
  await auth.authStateReady();
  let user = auth.currentUser;
  if (!user && !choose) return undefined;
  while (!user) {
    const how = await choose!();
    try {
      user = (how === 'google' ? await fa.signInWithPopup(auth, new fa.GoogleAuthProvider()) : await fa.signInAnonymously(auth)).user;
    } catch {
      // A closed popup, a refused account: ask again.
    }
  }
  const u = user;
  return {
    // A fresh token: one about to expire would not last the way in, and it says the account as it is now (linked or not).
    token: await u.getIdToken(true),
    freshToken: () => u.getIdToken(),
    uid: u.uid,
    anonimo: u.isAnonymous,
    async linkGoogle() {
      try {
        await fa.linkWithPopup(u, new fa.GoogleAuthProvider());
      } catch (e) {
        // That Google account has a wanderer already: the anonymous one stays as it is.
        throw new Error((e as { code?: string }).code === 'auth/credential-already-in-use' ? 'questo account Google ha già un viandante' : 'accesso con Google non riuscito');
      }
      location.reload();
    },
    async signOut() {
      await fa.signOut(auth);
      location.reload();
    },
  };
}

// --- The invite verifier (ADR-0193) -------------------------------------------------------------------------------------------------------------

const IDENTITY_KEY = 'quine:identity';
/** What a page says when this server lets in only who has an invite, and this browser has no identity. */
export const NEEDS_INVITE = 'su questo server si entra con un invito: chiedi un link al master';

function storedIdentity(): string | undefined {
  try {
    return localStorage.getItem(IDENTITY_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

function keepIdentity(token: string | undefined): void {
  try {
    if (token) localStorage.setItem(IDENTITY_KEY, token);
    else localStorage.removeItem(IDENTITY_KEY);
  } catch {
    /* a browser that keeps nothing asks for an invite again next time */
  }
}

/** The id an identity token names (read, not verified: the server verifies it). */
function identityId(token: string): string {
  try {
    const body = token.split('.')[1] ?? '';
    const id = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')))?.id;
    return typeof id === 'string' ? id : '';
  } catch {
    return '';
  }
}

/**
 * A word of the address that the page takes and removes, so that it stays neither in the address bar nor in the history: in the fragment
 * (`#invito=…`, which never reaches a server) or, as the study first wrote it, in the query.
 */
export function takeFromAddress(name: string): string | undefined {
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  const query = new URLSearchParams(location.search);
  const said = hash.get(name) ?? query.get(name) ?? undefined;
  if (!said) return undefined;
  hash.delete(name);
  query.delete(name);
  const h = hash.toString();
  const q = query.toString();
  history.replaceState(history.state, '', `${location.pathname}${q ? `?${q}` : ''}${h ? `#${h}` : ''}`);
  return said;
}

/** Signed in with the identity this browser keeps (or the owner's link brought), renewed by the server; without one, an error that says to ask for an invite. */
async function signInWithIdentity(): Promise<SignedIn> {
  const brought = takeFromAddress('accesso');
  if (brought) keepIdentity(brought);
  const kept = storedIdentity();
  if (!kept) throw new Error(NEEDS_INVITE);
  const r = await fetch('/api/account', { method: 'POST', headers: { Authorization: `Bearer ${kept}` }, cache: 'no-store' }).catch(() => undefined);
  if (r?.status === 401) {
    keepIdentity(undefined);
    throw new Error(`il tuo accesso è scaduto o è stato revocato: ${NEEDS_INVITE}`);
  }
  // The server did not answer: the token kept is tried as it is.
  const fresh = r?.ok ? ((await r.json().catch(() => ({}))) as { token?: unknown }).token : undefined;
  const token = typeof fresh === 'string' && fresh ? fresh : kept;
  keepIdentity(token);
  return {
    token,
    freshToken: async () => storedIdentity() ?? token,
    uid: identityId(token),
    anonimo: false,
    async linkGoogle() {
      throw new Error('su questo server non ci sono account Google');
    },
    async signOut() {
      keepIdentity(undefined);
      location.reload();
    },
  };
}

/** What an invite did: the universe is now there for this wanderer, or why not. */
export type Redeemed = { ok: true; account?: SignedIn } | { ok: false; reason: string };

/**
 * An invite to a private universe (ADR-0193), used by who opens its link: signed in first (Firebase, or the identity this browser keeps), the
 * server makes them a guest. On a server of invites a browser with no identity gets one from the invite itself. Without accounts (only this
 * machine) the wanderer is the one the page says (`headers`).
 */
export async function redeemInvite(universe: string, invite: string, config: AccountConfig | undefined, headers: Record<string, string> = {}): Promise<Redeemed> {
  let account: SignedIn | undefined;
  if (config && !(config.invites && !storedIdentity())) account = await signIn(config);
  const auth = account ? { Authorization: `Bearer ${account.token}` } : config ? {} : headers;
  const r = await fetch(`/api/universe/${encodeURIComponent(universe)}/guests`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth }, body: JSON.stringify({ op: 'redeem', invite }) }).catch(() => undefined);
  const j = ((await r?.json().catch(() => ({}))) ?? {}) as { error?: unknown; identity?: unknown };
  if (!r?.ok) return { ok: false, reason: typeof j.error === 'string' ? j.error : 'il server non risponde' };
  if (typeof j.identity === 'string' && j.identity) {
    keepIdentity(j.identity);
    account = await signInWithIdentity();
  }
  return { ok: true, ...(account ? { account } : {}) };
}
