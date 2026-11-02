# ADR-0112 · Il server di produzione

- Stato: accettato
- Data: 2026-11-02
- Task: T133 (correzione 1 dell'audit; V-014; le note per T133 di V-001, V-002, V-006, V-009, V-015; tocca ADR-0058, ADR-0099, ADR-0102, ADR-0106, ADR-0110, ADR-0111)

## Contesto

Fino a qui il server era un insieme di plugin di Vite: il server di sviluppo non va esposto (ha dato `.env` con due forme della richiesta, V-014), e le route lasciano passare ciò che su una macchina sola è sicuro: senza verificatore l'id detto vale da questa macchina, la route di Gemini e la coda stanno su loopback. Serve un modo di stare in pubblico che non dipenda dal ricordarsi una configurazione.

## Decisione

1. **Niente Vite in esecuzione.** `server/production.ts` è un `http.createServer` semplice; `server/serve.ts` è il suo avvio, costruito da `server/buildServer.ts` in `dist-server/server.mjs` con il programma dei mondi in `dist-server/mondo/` (`npm run build:server`; il client è `npm run build`). Nel file costruito `firebase-admin` resta una dipendenza da installare (passa a `dependencies`, l'unica che serve in esecuzione), `ws` è dentro. `buildWorld` ci resta con il suo `import('vite')`, che non viene mai chiamato: i mondi sono già costruiti.
2. **Le stesse route, non copie**: i plugin di `vite.config.ts` e il server di produzione montano gli stessi handler (`universeHandler`, `accountHandler`, `stripeHandler`, `wandererHandler`, `walletHandler`, `sessionList`, `attachSessions`).
3. **A elenco.** Da disco solo `dist/`, senza `lab/`, senza nomi che iniziano con un punto, con un tipo noto, realmente sotto la cartella (`buildFile`). Le route sono quelle del punto 2; tutto il resto sotto `/api` è un 404. **Non ci sono `/api/gemini`** (per chi gioca da solo sulla sua macchina: i mondi usano `direct()`) **né `/api/coda`**, anche con `QUINE_CODA=1`. Un altro WebSocket viene chiuso.
4. **Non parte senza** (`productionProblems`, l'errore nomina le variabili, mai i valori): `FIREBASE_PROJECT_ID` e `FIREBASE_API_KEY`, `STRIPE_WEBHOOK_SECRET`, `QUINE_ORIGINI`, e `GEMINI_TETTO_GIORNALIERO` se c'è la chiave. Rifiuta anche `FIREBASE_AUTH_EMULATOR_HOST` (firebase-admin prenderebbe token senza firma) e una chiave `mock` di Stripe. La chiave di Gemini può mancare: i mondi usano i modelli locali, e lo dice il log. `STRIPE_SECRET_KEY` può mancare: il checkout risponde 503.
5. **Le origini** (`QUINE_ORIGINI`, `frontDoorRefusal`): prima di ogni route e del WebSocket, un `Origin` che c'è deve essere nell'elenco e `Host` deve essere di una di quelle origini. L'eccezione è questa macchina nel senso di `accessRefusal` (socket e `Host` di loopback, niente intestazioni di inoltro): è da lì che i mondi parlano all'archivio. Le origini sono `https://…`, `http://` solo per loopback, senza percorsi né jolly.
6. **Ogni risposta** ha la CSP di ADR-0111 (dalla stessa `contentSecurityPolicy`, con gli account di questo server), più `X-Content-Type-Options: nosniff` e `Referrer-Policy: same-origin`: pagine, route, errori, rifiuti. I file con un hash sono `immutable`, le pagine `no-cache`.
7. **I mondi come in sviluppo** (ADR-0110): `WorldHost`, un processo per mondo, senza segreti, che legge solo `dist-server/mondo/`; il `.env` e `server.mjs` stanno fuori da quella cartella. Il segreto interno è nuovo a ogni avvio.
8. **La pagina del gioco senza universo non si apre**: `/` porta a `/site/`, `/index.html` senza `?universo=` a `/site/sessioni.html`. Sarebbe una partita da sola, e qui nessuno la crea (`newUniverse`: solo da questa macchina). Nel client `?universo=` vale in ogni build: lo dicono i link del sito e il ritorno da un pagamento, e prima solo `?dev` lo faceva ascoltare; cosa si può leggere e scrivere lo decide comunque il server.
9. **Se non è detto, ascolta solo su questa macchina**: `QUINE_HOST` è `127.0.0.1` se non detto; per uscire va scritto (`0.0.0.0`), `PORT` è quello di Cloud Run. Legge l'ambiente; `npm run serve` aggiunge il `.env` se c'è (`--env-file-if-exists`, Node 22.9).

## Alternative

- **`vite preview` con i plugin**: è ancora Vite, con le sue route; e non avvia i mondi.
- **Express o simili**: una dipendenza in più per un elenco di poche righe.
- **Un interruttore nell'ambiente per un verificatore di prova**: basta sbagliare un `.env` per aprire tutto. I test passano `accounts` da codice (`ProductionOptions.accounts`), `serve.ts` non lo fa.

## Conseguenze

- V-014 è chiusa. `tests/sicurezza/produzione.test.ts` costruisce il server davvero e lo prova: file costruito senza configurazione e con, partita di due con WebSocket veri e un mondo in un processo.
- Chi aggiunge una route la aggiunge anche a `production.ts`, o là non c'è: è ciò che si vuole.
- **Restano**, per T45f: TLS, compressione e limiti di connessione sono del bilanciatore; un controllo di salute che chiami con un altro `Host` riceverebbe 403 (Cloud Run di default prova la porta TCP); la lettura di `/api/universe` e `/api/session` resta pubblica come da ADR-0102; `?universo=` su una partita in singola che esiste apre il kernel nel browser con i soli `publicFiles`, e i salvataggi sono rifiutati. Il testo delle eccezioni di `universeStore`, `wallet`, `wanderer` e `session` arriva ancora al client (V-020, T167).
- Non provato: l'accesso con Firebase vero; nella verifica nel browser il servizio delle identità era un finto locale.
