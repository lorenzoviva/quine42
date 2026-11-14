// Dev server: the accounts of the multiplayer games (T44b, ADR-0081). Firebase Auth (Google Cloud Identity Platform): the
// browser signs in with Google or anonymously and sends its ID token with `entra`; here firebase-admin verifies it
// (signature, project, expiry) and the session makes the wanderer from the uid.
// From .env, all server-side: FIREBASE_PROJECT_ID (accounts are on only with it), FIREBASE_API_KEY and
// FIREBASE_AUTH_DOMAIN (the browser's web settings: public, served by GET /api/account, never built into dist/),
// FIREBASE_AUTH_EMULATOR_HOST (the Auth emulator, e.g. localhost:9099), QUINE_MASTER (the uid of the account that is
// the master `io` of the universes made before accounts). Verifying needs no service account key: only the project.
// Without Firebase, a server that hosts its own friends verifies invites instead (`QUINE_ACCOUNT=inviti` and `QUINE_SEGRETO_INVITI`,
// server/invites.ts, ADR-0194): an identity is a token signed by the server's secret, born of an invite; `POST /api/account` renews it.

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import type { Account, AccountConfig, Verifier } from '../src/session/account';
import { IdentityBook, inviteVerifier, refusedUid, secretProblem, type InviteIdentities } from './invites';
import { bearer, gate } from './access';

export interface AccountSettings {
  config: AccountConfig;
  verify?: Verifier;
  masterUid?: string;
  /** The invite verifier's identities (ADR-0194): only on a server without Firebase that says so. */
  invites?: InviteIdentities;
}

/** What `QUINE_ACCOUNT` may say: nothing (Firebase, if it is configured) or `inviti`, the invite verifier (ADR-0194). */
export const ACCOUNT_MODES = { invites: 'inviti' } as const;

/** Which verifier the environment asks for: `firebase` (or none, when Firebase is not configured), `invites`, or undefined for a value that is neither. */
export function accountModeOf(env: Record<string, string | undefined>): 'firebase' | 'invites' | undefined {
  const said = env.QUINE_ACCOUNT?.trim().toLowerCase();
  if (!said) return 'firebase';
  return said === ACCOUNT_MODES.invites ? 'invites' : undefined;
}

export function accountSettings(env: Record<string, string | undefined>, universesDir?: string): AccountSettings {
  if (accountModeOf(env) === 'invites') {
    const secret = env.QUINE_SEGRETO_INVITI ?? '';
    // The production server does not start so (`productionProblems`); the dev server, only on this machine, goes on without accounts.
    if (secretProblem(secret) || !universesDir) {
      console.warn('QUINE_ACCOUNT=inviti senza un QUINE_SEGRETO_INVITI buono: nessun verificatore');
      return { config: {} };
    }
    const { verify, identities } = inviteVerifier(secret, IdentityBook.of(universesDir));
    return { config: { invites: true }, verify, invites: identities, masterUid: env.QUINE_MASTER?.trim() || undefined };
  }
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
      // An uid shaped like an invite's identity is no account here: the two verifiers never share a wanderer (ADR-0194).
      if (refusedUid(t.uid)) return undefined;
      // Of Google's name only the first word: the wanderer's name is theirs to choose (the profile, T44a).
      const name = typeof t.name === 'string' ? t.name.trim().split(/\s+/)[0] : undefined;
      const a: Account = { uid: t.uid, anonymous: anonymousToken(t.firebase), ...(name ? { name } : {}) };
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

/**
 * GET /api/account: what the browser needs to sign in, or {} when this server has no accounts. POST, with the invite verifier (ADR-0194): an identity
 * whose token is still good gets one that lasts longer (`{ token }`); anything else is 401.
 */
export function accountHandler(settings: AccountSettings) {
  return (req: IncomingMessage, res: ServerResponse): void => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'POST' && settings.invites) {
      const no = gate(req, settings);
      const token = no ? undefined : settings.invites.renew(bearer(req) ?? '');
      res.statusCode = no ? no.status : token ? 200 : 401;
      return void res.end(JSON.stringify(no ? { error: no.refused } : token ? { token } : { error: 'accesso scaduto o non valido' }));
    }
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
