// Accounts (T44b, ADR-0081): in a multiplayer game, who a wanderer is comes from their account (Firebase Auth: Google or
// anonymous), not from what the tab says. The server verifies the token the client sends with `join` and the wanderer's
// id is the account's uid. No network and no Firebase here: the verifier is given (firebase-admin in server/account.ts,
// a fake one in the tests). Without a verifier (development, tests) the id the client says goes, as before.

import { validWandererId } from '../kernel/wanderers';
import { hashStr } from '../kernel/rng';

/** An account as the verified token says it. */
export interface Account {
  uid: string;
  /** Signed in anonymously: nothing to recover the account with, so no credits and only the local models. */
  anonymous: boolean;
  /** The name the account has (Google's), if any. */
  name?: string;
}

/** Checks a client's token: the account it proves, or undefined (forged, expired, of another project). */
export type Verifier = (token: string) => Promise<Account | undefined>;

/** What the browser needs to sign in (public: Firebase's web settings are not secrets). Empty: no accounts here. */
export interface AccountConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  /** The Auth emulator (`localhost:9099`), when the server uses it. */
  emulator?: string;
  /** No Firebase: the server verifies the identities born of its invites (ADR-0193). */
  invites?: true;
}

/**
 * The wanderer of an account: the uid itself, in small letters (an id names a file, and a disk may not tell cases apart;
 * Firebase's uids are 28 random letters and digits, two that differ only by case do not happen). A uid that is not a
 * valid id (too long, other characters) becomes `a` and its hash.
 */
export function accountWanderer(uid: string): string {
  const low = uid.toLowerCase();
  if (validWandererId(low)) return low;
  return `a${hashStr(uid).toString(36)}${hashStr(`~${uid}`).toString(36)}`;
}
