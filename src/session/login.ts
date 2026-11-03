// Signing in to a multiplayer game (T44b, ADR-0081): Firebase Auth in the browser, with Google or anonymously. The server
// says how (GET /api/account, server/account.ts); without settings there are no accounts and the tab's id goes as before.
// Firebase is loaded only when it is needed: a game alone never fetches it. Its web settings are public; the token is
// what proves the account, and the server verifies it.

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
  const { initializeApp } = await import('firebase/app');
  const fa = await import('firebase/auth');
  const app = initializeApp({ apiKey: config.apiKey, authDomain: config.authDomain, projectId: config.projectId }, 'quine');
  const auth = fa.getAuth(app);
  if (config.emulator) fa.connectAuthEmulator(auth, `http://${config.emulator}`, { disableWarnings: true });
  await auth.authStateReady();
  let user = auth.currentUser;
  while (!user) {
    const how = await choose();
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
