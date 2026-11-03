// Dev server: the accounts of the multiplayer games (T44b, ADR-0081). Firebase Auth (Google Cloud Identity Platform): the
// browser signs in with Google or anonymously and sends its ID token with `entra`; here firebase-admin verifies it
// (signature, project, expiry) and the session makes the wanderer from the uid.
// From .env, all server-side: FIREBASE_PROJECT_ID (accounts are on only with it), FIREBASE_API_KEY and
// FIREBASE_AUTH_DOMAIN (the browser's web settings: public, served by GET /api/account, never built into dist/),
// FIREBASE_AUTH_EMULATOR_HOST (the Auth emulator, e.g. localhost:9099), QUINE_MASTER (the uid of the account that is
// the master `io` of the universes made before accounts). Verifying needs no service account key: only the project.

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import type { Account, AccountConfig, Verifier } from '../src/session/account';

export interface AccountSettings {
  config: AccountConfig;
  verify?: Verifier;
  masterUid?: string;
}

export function accountSettings(env: Record<string, string | undefined>): AccountSettings {
  const projectId = env.FIREBASE_PROJECT_ID?.trim();
  if (!projectId) return { config: {} };
  const emulator = env.FIREBASE_AUTH_EMULATOR_HOST?.trim() || undefined;
  // firebase-admin reads the emulator from the process' environment (and then takes unsigned tokens: only for it).
  if (emulator) process.env.FIREBASE_AUTH_EMULATOR_HOST = emulator;
  const config: AccountConfig = {
    projectId,
    apiKey: env.FIREBASE_API_KEY?.trim() || (emulator ? 'emulatore' : undefined),
    authDomain: env.FIREBASE_AUTH_DOMAIN?.trim() || `${projectId}.firebaseapp.com`,
    ...(emulator ? { emulator } : {}),
  };
  let auth: Promise<{ verifyIdToken(t: string): Promise<{ uid: string; name?: unknown; firebase?: { sign_in_provider?: string; identities?: Record<string, unknown> } }> }> | undefined;
  const verify: Verifier = async (token) => {
    auth ??= (async () => {
      const { initializeApp, getApps } = await import('firebase-admin/app');
      const { getAuth } = await import('firebase-admin/auth');
      const app = getApps().find((a) => a.name === 'quine') ?? initializeApp({ projectId }, 'quine');
      return getAuth(app);
    })();
    try {
      const t = await (await auth).verifyIdToken(token);
      // Of Google's name only the first word: the wanderer's name is theirs to choose (the profile, T44a).
      const nome = typeof t.name === 'string' ? t.name.trim().split(/\s+/)[0] : undefined;
      const a: Account = { uid: t.uid, anonimo: anonymousToken(t.firebase), ...(nome ? { nome } : {}) };
      return a;
    } catch {
      return undefined;
    }
  };
  return { config, verify, masterUid: env.QUINE_MASTER?.trim() || undefined };
}

/**
 * Whether a token is of an account that is still anonymous. Not `sign_in_provider` alone: an anonymous account linked to
 * Google keeps signing in as `anonymous` (its session goes on), but its token lists the identities it was linked to.
 */
export function anonymousToken(f: { sign_in_provider?: string; identities?: Record<string, unknown> } | undefined): boolean {
  return f?.sign_in_provider === 'anonymous' && !Object.keys(f.identities ?? {}).length;
}

/** GET /api/account: what the browser needs to sign in, or {} when this server has no accounts. */
export function accountHandler(settings: AccountSettings) {
  return (req: IncomingMessage, res: ServerResponse): void => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(req.method === 'GET' ? settings.config : {}));
  };
}

export function accountRoute(settings: AccountSettings): Plugin {
  return {
    name: 'rune-account',
    configureServer(server) {
      server.middlewares.use('/api/account', accountHandler(settings));
    },
  };
}
