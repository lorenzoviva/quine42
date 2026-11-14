// `npm run inviti`: the owner of a server without Firebase (QUINE_ACCOUNT=inviti, ADR-0193), on the server's machine. It reads the `.env` (only
// QUINE_SEGRETO_INVITI, QUINE_UNIVERSI and QUINE_ORIGINI) and writes only the book of the identities beside the universes, under its lock: the
// server may be running. Never prints the secret; a token it prints only for `padrone`, in the fragment of a link, which no server's log sees.
//
//   npm run inviti -- padrone [--giorni 30]   the owner's identity (`inv-owner`), made good again if it was revoked, and the link that signs in with it
//   npm run inviti -- elenco                  the identities: id, where they were born, whether revoked (no token)
//   npm run inviti -- revoca <id>             an identity is nobody's from now on (its guests' places stay, but nobody can use them)

import path from 'node:path';
import { IdentityBook, IDENTITY_DAYS, isInviteId, OWNER_ID, ownerIdentity, secretProblem } from '../../server/invites';
import { originsOf } from '../../server/production';

try {
  process.loadEnvFile('.env');
} catch {
  /* no .env: the environment as it is */
}

const env = process.env;
const [command, ...rest] = process.argv.slice(2).filter((a) => a !== '--');
const universesDir = path.resolve(env.QUINE_UNIVERSI?.trim() || 'universes');
const book = IdentityBook.of(universesDir);

function fail(text: string): never {
  console.error(text);
  process.exit(1);
}

switch (command) {
  case 'padrone': {
    const bad = secretProblem(env.QUINE_SEGRETO_INVITI);
    if (bad) fail(`QUINE_SEGRETO_INVITI ${bad}: scrivilo nel .env del server (almeno 32 caratteri casuali)`);
    const i = rest.indexOf('--giorni');
    const days = i >= 0 ? Number(rest[i + 1]) : IDENTITY_DAYS;
    if (!Number.isInteger(days) || days < 1 || days > 365) fail('--giorni: da 1 a 365');
    const token = ownerIdentity(env.QUINE_SEGRETO_INVITI!, book, Date.now(), days);
    const origin = originsOf(env.QUINE_ORIGINI).origins[0] ?? `http://localhost:${env.QUINE_PORTA?.trim() || env.PORT?.trim() || 8080}`;
    console.log(`Il tuo accesso da padrone del server (${OWNER_ID}), valido ${days} giorni e rinnovato a ogni ingresso:`);
    console.log(`${origin}/site/profilo.html#accesso=${token}`);
    console.log('Aprilo nel tuo browser e non darlo a nessuno: chi lo ha entra come te. Per toglierlo: npm run inviti -- revoca inv-owner');
    break;
  }
  case 'elenco': {
    const all = Object.entries(book.read());
    if (!all.length) console.log('nessuna identità');
    for (const [id, r] of all) console.log(`${id}\t${r.via}\t${new Date(r.made).toISOString().slice(0, 10)}${r.revoked !== undefined ? `\trevocata il ${new Date(r.revoked).toISOString().slice(0, 10)}` : ''}`);
    break;
  }
  case 'revoca': {
    const id = rest[0];
    if (!isInviteId(id)) fail('revoca <id>: un id che comincia con inv-');
    const done = book.change((b) => {
      const r = b[id];
      if (!r) return false;
      if (r.revoked === undefined) r.revoked = Date.now();
      return true;
    });
    if (!done) fail(`nessuna identità ${id}`);
    console.log(`${id} è revocata: i suoi accessi non valgono più`);
    break;
  }
  default:
    fail('uso: npm run inviti -- padrone [--giorni 30] | elenco | revoca <id>');
}
