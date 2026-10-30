# ADR-0081 — L'account e l'autenticazione

Data: 2026-10-30 · Stato: accettato (task T44b del backlog) · Fase 3 di ADR-0050 (il multiplayer); estende ADR-0054 (i viandanti),
ADR-0058 (il kernel sul server) e ADR-0074 (il profilo).

## Contesto
Fin qui in multigiocatore il viandante era l'id che la scheda diceva (`?viandante=<id>` o uno inventato per scheda, `tabWanderer`):
chiunque poteva entrare come chiunque altro, master compreso. Decisioni dell'autore (29/10/2026, `docs/pipeline/domande/T44b.md`):
Firebase Auth / Identity Platform di Google Cloud, accesso con Google e anonimo; in singola nessun account; un anonimo non può
recuperare l'account, quindi non compra crediti e gioca solo con i modelli locali finché non lo lega a Google.

## Decisione
1. **Il fornitore**: Firebase Auth. Il browser accede (`src/session/login.ts`, `firebase/app` e `firebase/auth` caricati con
   `import()` solo in una partita di molti su un server con gli account) con Google (popup) o anonimo, e manda l'ID token
   nell'`entra` (`token`). Il server lo verifica con `firebase-admin` (`server/account.ts`: firma, progetto, scadenza; basta l'id del
   progetto, nessuna chiave di servizio). Le impostazioni web di Firebase sono pubbliche e le dà il server (`GET /api/account`), così
   nulla di Firebase entra in `dist/`; ciò che prova l'account è il token.
2. **La configurazione** (`.env`, solo sul server): `FIREBASE_PROJECT_ID` accende gli account; `FIREBASE_API_KEY`,
   `FIREBASE_AUTH_DOMAIN` per il browser; `FIREBASE_AUTH_EMULATOR_HOST` per l'emulatore; `QUINE_MASTER` l'uid dell'account di chi
   fa girare il server. Senza `FIREBASE_PROJECT_ID` (sviluppo, preview, test) non ci sono account e vale l'id di oggi.
3. **Il viandante è l'account** (`src/session/account.ts`): `SessionOptions.verify` (un `Verifier`: token → `Account {uid, anonimo,
   nome}` o niente); con un verificatore l'id dell'`entra` non conta, l'id è `accountWanderer(uid)`: l'uid in minuscolo (un id è un
   nome di file e un disco può non distinguere le maiuscole; gli uid di Firebase sono 28 caratteri casuali) o, se non è un id valido,
   `a` e il suo hash. Un token assente, falso o scaduto → `rifiuto`. Il profilo (ADR-0074), l'inventario, la posizione e le carte
   restano in `world/giocatori/<id>.json`: sono dell'account. Il nome di Google (la prima parola) chiama solo un viandante nuovo.
4. **L'anonimo che si lega**: `linkWithPopup` tiene lo stesso uid, quindi lo stesso viandante; la pagina rientra (con un token
   nuovo, `getIdToken(true)`) e il server lo vede non più anonimo: non da `sign_in_provider`, che dopo il legame resta
   `anonymous`, ma dalle identità del token (`firebase.identities`, `anonymousToken`). Se quell'account Google ha già un viandante, il legame non si fa e l'anonimo resta com'era.
5. **L'anonimo gioca offline**: il server tiene chi è entrato anonimo (`SessionServer.isAnonymous`, aggiornato a ogni ingresso);
   `PayerModels` (`src/kernel/ai/local.ts`) manda ai modelli locali ogni chiamata il cui `chi` (ADR-0056) è un anonimo, il resto
   ai modelli del mondo. L'`ingresso` dice `anonimo`, il client lo mostra; nel pannello del profilo (`P`) «Lega a Google» e «Esci».
   Un anonimo non avrà crediti (T45a) e non comprerà (T45e).
6. **Il master**: `partita.master` è un id di viandante; con gli account è quello di un account. Gli universi fatti prima degli
   account (e quelli nati in singola) hanno master `io`: l'account `QUINE_MASTER` (non anonimo) entra come `io` in quelli, e solo
   in quelli. Un clone con un altro master (ADR-0068) prende l'id del suo account.
7. **In singola** nulla cambia: niente accesso, il viandante è `io`.

## Conseguenze
- Il token si verifica all'ingresso; una partita lunga oltre la scadenza del token (un'ora) continua, chi rientra ne manda uno nuovo
  (il client di Firebase lo rinnova da sé).
- `firebase` (client, a richiesta) e `firebase-admin` (server, tra le dipendenze di sviluppo come `ws`) sono nuove dipendenze.
- `tests/account.test.ts` (6 test, verificatore finto): l'id dall'uid; l'anonimo legato riconosciuto dalle identità; token valido, scaduto o assente; senza verificatore l'id di
  oggi; l'anonimo con i modelli locali che si lega e tiene viandante, profilo e tasche; l'account del server come master `io`.
