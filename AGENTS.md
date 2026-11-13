# AGENTS.md — QUINE42

> **Unica fonte di verità per gli agenti** (Claude Code, Gemini CLI, chiunque altro).
> Leggi questo file e `docs/` prima di qualsiasi lavoro. Ogni decisione architetturale va
> registrata qui **e** in un ADR in `docs/adr/` (stesso commit).
> **Questo file è il nucleo**; i sottosistemi sono in [`docs/architettura-dettagli.md`](docs/architettura-dettagli.md) (ADR-0120).

## Visione in breve

QUINE42 (in precedenza Rune, ADR-0062) è un gioco 3D visto dall'alto in 3/4, fatto di voxel semplici e di contenuti ricchissimi, in cui il
mondo è generato da IA in ogni aspetto tranne il kernel, ed è fatto del proprio codice sorgente. Il giocatore
vive in un cerchio di simulazione; un **tappeto** compensa ogni suo passo e lo riporta al centro. Attorno,
ferma e **invisibile finché il tappeto lo tiene**, c'è la **corona**: il codice sorgente dell'universo,
lo studio di una software house di giochi (un edificio per cartella, interni su più piani, gallerie di
modelli e terreni) dove si vedono lavorare le squadre del Concilio. Chi ci arriva è trasceso: ne fa parte.
Un **Concilio di agenti** su Google Gemini scrive storia, ambienti, oggetti, individui e il loro codice,
e scolpisce l'aspetto di ogni cosa come programma MarkovJunior. Nel terreno brillano **rune**: token Lua
veri, una per casella. Ciò che è scritto sul tappeto **si esegue**: componendo frasi il giocatore può rompere
la simulazione, o uscirne e riscriverla. Le rune raccolte sono oggetti (nella borsa delle rune); alcune sono anche **magia**:
pronunciate (T) diventano incantesimi e si consumano. Ciò che il Concilio decide diventa **regola** del mondo.

**Due tavoli** (ADR-0025), come in Dungeons & Dragons: il Concilio (o il giocatore che fa il Dungeon
Master, nella corona) crea e fa evolvere il mondo; dentro il mondo il viandante e gli individui vivono un
mondo reale. Nei contenuti mai meta-gioco: niente codice, simulazione, Concilio, «crepe», bordi misurati.

Design doc originale: [`docs/design.md`](docs/design.md). Decisioni: [`docs/adr/`](docs/adr/README.md).

## Regole inviolabili

0. **Niente meta-gioco dentro il mondo** (ADR-0025): i principi del Concilio (`src/kernel/fourthwall.ts`)
   vanno con ogni richiesta; ciò che rompe la quarta parete (anche travestito da leggenda: la piazza che riporta
   indietro, chi osserva ogni viandante, confini invalicabili) o duplica un elemento del gioco (altri «simboli
   luminosi» al posto delle rune) viene richiesto di nuovo o ritirato. Il filtro legge la lingua del mondo, l'italiano e
   l'inglese (ADR-0165).

1. **Il kernel non è mai modificabile da Lua.** Il kernel è TypeScript in `src/kernel/`. Il codice
   dell'universo gira in ambienti Lua che non vedono `_G`, `debug`, `load`, `os`, `io`, `package`.
   Tutto ciò che Lua può toccare passa da `Host` (`src/kernel/sandbox.ts`).
2. **Tutto il generato passa dal validatore** (`src/kernel/validator.ts`): piani dei luoghi,
   programmi degli ambienti (eseguiti di prova su bozze reali), oggetti, manifest, codice (compilazione, API
   esistente, caricamento di prova). L'invalido torna, con il motivo, all'agente responsabile.
   **L'IA non rompe mai il gioco**; se un modulo generato fallisce a runtime, l'Ingegnere lo ripara.
3. **Il giocatore può rompere il gioco.** Il suo input non si blocca: si isola (fault), si mostra
   (glitch), si garantisce il rollback. La riparazione automatica non tocca file modificati da lui.
4. **Stato nei componenti, logica stateless.** Hot reload = sostituzione delle funzioni.
5. **Ogni contenuto è un modulo autosufficiente** con `manifest.json`; il manifest dei moduli
   generati lo assembla il kernel (forma garantita). Gli oggetti stanno in pacchetti di dati.
6. **Due repository** (ADR-0021): il kernel (questo progetto; `universe/` è il seme, immutabile) e
   l'universo (repository git su disco, `universes/<nome>/`). Si committano solo stati validi, e un guasto invalida il codice, non i dati (ADR-0137): il codice
   scritto senza commit è trattenuto da ogni commit (`Repo.withheld`), stato, viandanti e piani si salvano anche con un guasto aperto (non un universo
   di un altro kernel o con `universe.json` illeggibile); `R` torna all'ultimo valido, che ha i dati dell'ultimo salvataggio; ripartire dal seme mette l'universo in `universes/.trash/`. Ogni scrittura (commit, piano, ramo, pubblicazione) che la rete non porta resta in fila, in ordine, anche dopo una ricarica e fino a un tetto oltre il quale si unisce; un 401 rinnova il token; un rifiuto del server non si ritenta (ADR-0122, ADR-0144).
7. **Il kernel è il pavimento**: sopravvive a NaN, nil, cicli infiniti, binding recisi. Le API del
   `Host` validano gli input e restituiscono `undefined` (mai `null`).
8. **Dal cerchio nessuno vede la corona** (ADR-0009, ADR-0124): si disegna solo per chi è fuori dal tappeto (a `circleRadius` o più dal centro) o in un interno dello studio; lo decide solo `kernel.coronaRevealed()`, che non guarda ruolo né camera. Dentro il cerchio niente anello, luci, etichette, hover né sfondo, per il giocatore, per chi è tornato, per il master e in god mode; la camera di base è la 3/4 e l'orbita libera non accende nulla.
8b. **Chi non è il master non riscrive il mondo** (ADR-0102): identità verificata sul server (`server/access.ts`), un'altra origine mai; senza account l'id detto vale solo da questa macchina; una partita di molti è del suo master e del suo mondo, gli altri leggono `publicFiles` e non scrivono; i saldi li scrive solo il mondo; `anonimo`, `offline` e `tetto` non li decide il client. Una route nuova passa da `gate`.
8b-bis. **A partita in corso nessuno cambia `ai`, nemmeno il master** (ADR-0133): le regolazioni entrano con il master (`join`, `applySettings`), si fissano quando entra il primo viandante e si sbloccano quando esce l'ultimo; da soli dalla lobby alla ricarica della pagina. Un compito nuovo in `CENSUS` ha una manopola. Il tetto di ogni viandante resta suo.
8c. **Un universo contiene solo percorsi ammessi** (ADR-0103): un elenco in `src/kernel/paths.ts` (`modules/ models/ world/ maps/ prompts/ universe.json seed.json`, nomi semplici), mai un divieto su `.git`; il server lancia git solo da `server/git.ts`.
8d. **I saldi stanno fuori dall'universo** (ADR-0104): saldi e pagamenti solo in `universes/.balances/<nome>.json` (`server/ledger.ts`, `Ledger` in `credits.ts`), mai in un file dell'universo; niente Lua, Concilio, ramo o rollback ci arriva; ogni accredito è un passo atomico; a mano solo il master, entro `QUINE_TETTO_RICARICHE` al giorno. La commissione la decide solo il server (`QUINE_COMMISSIONE`, ADR-0132). Fuori dagli universi anche le carte fatte a mano: `universes/.handmade/<viandante>.json`, scritte solo dal loro autore, quello del token (ADR-0161).
8e. **Un giocatore solo non consuma il mondo** (ADR-0107): ritmo per viandante all'arrivo di ogni messaggio (`LIMITS` in `src/session/server.ts`), ciò che può chiamare i modelli (`heavy`) ne ha uno più stretto e una coda per pagante, il testo verso il Concilio è tagliato (`words`), prendere e posare un mobile ne ha uno suo (`moveRate`, ADR-0168). Un messaggio nuovo che chiama i modelli passa da lì.
8f. **Ciò che esce e ciò che il Concilio scrive sono elenchi** (ADR-0109): a un client solo i campi nominati in `src/session/files.ts` (`playerFiles`, `publicFiles`), un campo nuovo resta a casa finché non lo si nomina; `universes/` non si serve mai (`server/hidden.ts`); un commit del Concilio cambia solo `councilMayWrite` (`paths.ts`), `universe.json → ai` si muove solo dal kernel su comando del master, prima di entrare (`setAi`, la lobby, ADR-0133).
8g. **Ogni mondo di molti è un processo senza segreti** (ADR-0110): `server/worldHost.ts` lo avvia con il solo programma leggibile, il token del suo universo e un limite di memoria, e lo uccide se tace; Gemini, TypeSafe (ADR-0157) e la verifica dei token passano dal canale, le rotte da `WorldCalls`. Mai permettere al mondo una cartella sopra il programma: apre anche il `.env`. `healthy` si conta da `pronto` e `stop()` aspetta i git del suo universo (ADR-0121). I programmi MarkovJunior vi girano uno per turno del ciclo (`TurnRunner` in `host.ts`), così tra due passa il battito. Lo stesso programma, avviato per un controllo solo (`check`, `server/programCheck.ts`), prova i programmi delle carte fatte a mano: mai nel processo dell'HTTP del server di produzione (ADR-0161).
8h. **In pubblico solo il server di produzione** (ADR-0112): `server/production.ts`, senza Vite, serve `dist/` e le rotte del suo elenco, senza `/api/gemini`, `/api/typesafe` né `/api/coda`; non parte senza verificatore, segreto del webhook, `QUINE_ORIGINI` e, con una chiave, il suo tetto (`productionProblems`); una route nuova si aggiunge lì, un'intestazione nuova anche. `npm run dev` non si espone.
8i. **Chi paga si dice, non si ricava** (ADR-0113): fuori da un `as`, in una partita di molti, `payerNow()` è `comune`; una richiesta di un viandante che chiama i modelli dopo un `await` passa `chi`; con gli account le spese comuni senza un collegato con crediti vanno ai modelli locali. Ciò che arriva dal filo non getta eccezioni (`handleSafely`), un numero o un testo si legge guardando il tipo.
8j. **Un socket costa solo se dice chi è, un mondo solo finché c'è qualcuno** (ADR-0114): il mondo parte dopo un `join` con un token verificato (`admit` in `server/session.ts`) e, vuoto per 5 minuti, si salva e si ferma; universi a quota (`QUINE_UNIVERSI_PER_ACCOUNT`), rotte e socket a ritmo per indirizzo (`FRONT_RATES` in `server/production.ts`). L'indirizzo è quello del socket o, con `QUINE_PROXY_FIDATI`, ciò che i proxy dichiarati hanno visto: mai ciò che scrive il client. Una rotta nuova che legge o scrive un universo intero sta sotto `HEAVY`.
9. **La chiave API non arriva mai al browser**: la tiene solo `GeminiGate` (`server/geminiProxy.ts`, ADR-0099): modelli a elenco, corpo limitato, tetto di spesa giornaliero; la route solo da questa macchina e dalla stessa origine, in multigiocatore il server chiama Google senza route. Così `TYPESAFE_KEY` per Jev: solo `TypeSafeGate` (`server/typesafeProxy.ts`, ADR-0157), le versioni fisse di Jev, il corpo rifatto campo per campo, il suo tetto; a Jev solo dati del mondo e del catalogo, **mai il testo libero del viandante** finché TypeSafe non ha la ritenzione zero (D45).
10. **Ciò che sembra invalicabile lo è**: il terreno blocca a caselle, i modelli con i loro voxel (ADR-0041);
    ogni luogo è connesso (varchi + sentieri scavati dal kernel, porte delle strutture sul sentiero; niente cose solide su punti di articolazione né davanti alle porte, ADR-0064).
11. **Solo testo, niente immagini generate** (ADR-0037): contenuti come dati e ogni aspetto come programma
    MarkovJunior; un programma per tipo, le istanze sono semi diversi.

## Stack

- **Vite 7 + TypeScript 5** (strict), **Vitest 4** in Node con modelli offline (`MockAiModels`), **three.js** per il mondo e per le pagine out-game, DOM per HUD e pannelli; il sito in `site/`, senza framework, con `src/theme.css` (→ `#sito`).
- **Lua 5.4 via wasmoon**, sandbox del kernel: il confine è `Crossing` (`sandbox.ts`, ADR-0101), con limiti di istruzioni, memoria, stringhe e rete (ADR-0105; → `#lua-sandbox`).
- **Google Gemini**: modelli, budget e opzioni in `universe/universe.json → ai`, prezzi in `src/kernel/ai/prices.ts`; l'Attore e i coefficienti di generazione (→ `#gemini`), la lobby (→ `#lobby`), la coda degli abbonamenti, solo in locale (→ `#abbonamenti`).
- **Jev di TypeSafe** per le decisioni chiuse (ADR-0157): stato e domande tipizzate → scelte, con la regola di oggi come pavimento e come risposta dei modelli locali (`src/kernel/ai/decisions.ts`, `Council.decide`); la prima accesa è `model.reuse`: prima dello Scultore un modello della libreria della stessa classe, solo mobili, piante, rocce e strutture, con la Noul compagna (`ModelDirector.reuse`, T349; → `#gemini`).
- **Persistenza**: repository git dell'universo su disco tramite il server; saldi e pagamenti fuori, in `universes/.balances/`; senza server `localStorage` + IndexedDB (→ `#stack`).

## Comandi

```bash
npm install          # dipendenze
npm run dev          # gioco su http://localhost:5173 (proxy Gemini; hot reload anche di universe/)
npm test             # test (kernel, Concilio offline, MarkovJunior, layout, validatore, contenuti, sandbox)
npm run typecheck    # tsc --noEmit
npm run build        # typecheck + build (npx vite preview la serve, proxy incluso)
npm run test:sicurezza # solo la suite delle vulnerabilità (tests/sicurezza/, già dentro npm test; ADR-0098)
npm run sicurezza:prove # le prove dell'autore contro un server vero in un progetto usa e getta (T137, docs/sicurezza/README.md)
npm run build:server # il server di produzione: dist-server/server.mjs e il programma dei mondi (ADR-0112)
npm run serve        # lo avvia (dopo build e build:server), legge il .env se c'è; rifiuta di partire senza configurazione
npx vite-node lab/scripts/mjx-sound.ts -- sound-cellular-fugue  # un programma sonoro: WAV, traccia e rapporto in testo, senza browser né modelli (ADR-0125)
npx vite-node lab/scripts/jev-banco.ts -- --offline  # il banco di Jev (T313, lab/banco/jev/README.md): le stesse domande tipizzate a Jev di TypeSafe e a Flash-Lite, ogni chiamata in consumi.jsonl, i tetti sul registro intero; senza --offline legge TYPESAFE_KEY e GEMINI_API_KEY dai .env di --env; con --prepara immagini e --gruppi immagini le foto dei modelli (T324, Danger Zone di TypeSafe, solo lab/)
npx vite-node lab/scripts/riuso-modelli.ts -- [--luoghi 8] [--scrivi lab/banco/jev/riuso.md]  # quanto fa risparmiare `model.reuse` su una Genesi offline: modelli chiesti, domande a Jev, chiamate dello Scultore e dell'Artista con la regola, al tasso della stima e al tetto (T349)
npx vite-node lab/scripts/jev-casi-d-uso.ts -- --offline  # i casi d'uso di TypeSafe (T325, lab/banco/jev/casi-d-uso.md): quanto delle richieste del Concilio è contesto (--contesto --conta: countTokens, gratis), le guardie, le battute riusate, il contesto scelto da Jev; senza --offline le prove costano, con i tetti sul loro registro
npx vite-node lab/scripts/prompt-tokens.ts -- --roles <ref>  # i token dei prompt del Concilio prima e dopo (countTokens, gratis; --capture e --count per le richieste intere di una Genesi offline); lingua-uscite.ts -- universes/<nome> dice in che lingua il Concilio ha scritto il mondo (T310)
npx vite-node lab/scripts/carte-mano.ts  # quanto costano i programmi del seme contro i tetti di una carta fatta a mano (ADR-0161); con -- --tutti anche i modelli fatti a mano del laboratorio
npx vite-node lab/scripts/misura-tetto.ts -- [--lati 120,240,360,480] [--z 96] [--solo id]  # dove sta il tetto di un modello: ogni programma in scatole più grandi, in un processo suo (tempo, picco di memoria, la mesh); banco-pezzi.ts -- --semi 4 --foto la fattoria e il forte grandi a pezzi contro la griglia intera, con i controlli sui bordi (T339, lab/banco/pezzi/README.md)
npx vite-node lab/scripts/banco-taglie.ts -- [--semi 2] [--foto] [--json f]  # fattoria e forte del banco a tre taglie (T338, lab/banco/taglie/README.md): parti abitabili, composizione, i controlli dello Scultore; con --misura le strutture del seme e lo scheletro
npx vite-node lab/scripts/mj-simboli.ts -- --scrivi [<cartella>…]  # porta i programmi ai simboli del contratto 0.6 (una cifra da sola → `#` e la cifra) con la funzione della migrazione; senza cartelle universe/models e lab/, gli universi dentro esclusi (ADR-0175)
npm run mancanze -- <universo>  # il rapporto di ciò che il Concilio non è riuscito a fare, per il kernel 1.0.0 (senza nome: tutti gli universi; ADR-0130)
npm run universi:cloud  # installa in universes/ aurora, orichalcum, neapolis e sidera con le strutture, i modelli e i suoni di Claude Cloud, a costo zero (T273, lab/banco/universi-cloud/INTEGRAZIONE.md)
node lab/scripts/misura-frame.mjs <porta> [--secondi 8] [--json f]  # dove va il tempo di un frame su una preview della build (T331, docs/design/gpu.md): tick del kernel per parte, disegno per parte, GPU (timer query), draw call, worker, in un Chrome headless sulla GPU vera
npx vite-node lab/scripts/misura-mj.ts -- [--semi 3] [--taglie large,huge] [--solo id]  # i programmi del seme come li fa un worker, per taglia e per classe, il tempo diviso tra match, scelta, scrittura, altri nodi e mesh dal profilatore di V8, offline (T331)
node tools/vesti/misura.mjs --url http://127.0.0.1:<porta>/site/index.html [--webgl] [--telefono] [--posizioni cima,insieme,sotto]  # quanto costano gli effetti delle vesti su una preview: CPU rallentata, thread principale, ms per fotogramma, il fotogramma più lungo, peso (ADR-0151, ADR-0164)
npx vite-node tools/produzione/laboratori.ts -- --porta <n> [--spenti]  # il server di produzione vero sulla build, con i laboratori accesi o spenti, segreti finti e un universo dal seme in una cartella temporanea, per provarli nel browser (ADR-0169)
npm run abbonamento  # serve la coda /api/coda con la CLI di Claude (con QUINE_CODA=1 nel .env, ADR-0077, ADR-0106)
npm run genera -- <universo> [--partita singola|multigiocatore] [--luoghi 25] [--tetto 10]  # genera un universo prima di giocarlo, solo dalla coda degli abbonamenti (servita da npm run abbonamento), mai con un mondo acceso (ADR-0143)
```

`.env`: `GEMINI_API_KEY=...` (ignorato da git), per il server di produzione `QUINE_ORIGINI` (i siti per cui risponde, separati da virgole: `https://…`, `http://` solo per questa macchina), `QUINE_PORTA` o `PORT` (8080), `QUINE_HOST` (127.0.0.1 se non detto; `0.0.0.0` per uscire), `QUINE_UNIVERSI` (ADR-0112), `QUINE_MONDO_MEMORIA` (MB di heap di ogni mondo di molti, predefinito 1024, ADR-0110), `QUINE_MONDI_MASSIMI` (mondi accesi insieme, predefinito 16, ADR-0113), `QUINE_UNIVERSI_PER_ACCOUNT` (universi di cui un account è master, predefinito 3, ADR-0114), `QUINE_PROXY_FIDATI` (quanti proxy nostri stanno davanti al server, predefinito 0: si misura al deploy, ADR-0114), `QUINE_VIDEO` (la cartella dei video del sito, con il loro `video.json`, fuori dal progetto; anche per `npm run dev`, ADR-0131), `GEMINI_TETTO_GIORNALIERO` (dollari al giorno per la chiave, predefinito 10; la spesa in `universes/.gemini-spend.json`, ADR-0099), `QUINE_COMMISSIONE` (la commissione sui consumi come frazione, predefinita 0.01, 0 in beta; un valore non valido dà il predefinito, ADR-0132); `QUINE_CODA=1` accende la coda degli abbonamenti (ADR-0106); `TYPESAFE_KEY` (Jev di TypeSafe) la legge il server (`TypeSafeGate`, ADR-0157) e il banco (`lab/scripts/jev-banco.ts`), mai il browser né un mondo; `TYPESAFE_TETTO_GIORNALIERO` (dollari al giorno per quella chiave, predefinito 1, scritto per il server di produzione; la spesa in `universes/.typesafe-spend.json`); per gli account in multigiocatore `FIREBASE_PROJECT_ID` (e `FIREBASE_API_KEY`,
`FIREBASE_AUTH_DOMAIN`, `QUINE_MASTER`, `QUINE_TETTO_RICARICHE`, dollari al giorno per universo che il master può dare a mano, ADR-0104: 0 con gli account, 20 senza; con l'emulatore `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099` e un progetto `demo-…`, ADR-0082); per i pagamenti Stripe in prova `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (e `STRIPE_TAX_CODE` per i Managed Payments, ADR-0083). Senza chiave o con `?offline`: modelli locali, texture e
ostacoli procedurali. URL: `?skip` salta intro e Genesi; `?classica` mostra il vecchio aspetto al posto del cartone (ADR-0093); `?dev&teleport=46,0` porta oltre il tappeto (o `teleport=X,Y` dovunque: anche dentro una stanza, vedi `docs/architettura-dettagli.md#convalida-browser`); `?universo=<nome>` apre un altro
universo di `universes/` (quello che può leggere e scrivere lo decide il server); in sviluppo `?viandante=<id>` sceglie il viandante della scheda in multigiocatore (due schede, due viandanti).
Graphify (facoltativo, ADR-0045): `pip install graphifyy` in un ambiente a parte, poi `GRAPHIFY_BACKEND=none graphify update .`
(solo codice, offline, ~12 s; `graphify-out/` è ignorato da git; niente skill, MCP né hook).
In console del browser: `window.quine` (o `window.rune`) è il kernel (`.feed()`, `.ai.usage`, `.content`).

## Struttura

```
server/access.ts        chi chiede e cosa può (ADR-0102): `callerOf`, `gate`, `owns`, `newUniverse`; ogni route che ascolta un client passa da qui
server/csp.ts           la CSP delle pagine (ADR-0111): `contentSecurityPolicy`, `securityHeaders`; niente script né gestori scritti nell'HTML, una risorsa esterna nuova passa da qui
server/hidden.ts        ciò che il server di sviluppo non serve (ADR-0109, ADR-0110): `universes/` e i programmi dei mondi (`node_modules/.quine-mondo/`), per qualunque via
server/ledger.ts        l'archivio di saldi e pagamenti fuori dall'universo (ADR-0104): `FileLedger`, `ledgerOf`, `openLedger`, la migrazione (`sweepBalances`)
server/git.ts           l'unico modo in cui il server lancia git (ADR-0103): `runGit`, senza hook né monitor, senza risalire al repository di sopra; `settleGit`, chi si ferma aspetta i git di una cartella e non lascia lock (ADR-0121)
server/geminiProxy.ts   l'unico varco della chiave (ADR-0099): GeminiGate, la route /api/gemini (solo loopback) e direct() per i mondi di molti
server/typesafeProxy.ts l'unico varco di TYPESAFE_KEY (ADR-0157): TypeSafeGate (versioni fisse di Jev, il corpo rifatto da `jevRequest`, il tetto), la route /api/typesafe (solo loopback, mai in produzione) e direct() per i mondi di molti
server/universeStore.ts /api/universe: ogni universo è un repository git in universes/<nome>/ (e il ramo del master, `rami/master`; il clone)
server/subscriptionQueue.ts /api/coda: la coda su disco degli abbonamenti (`universes/.queue/`), servita da un processo che usa la CLI (ADR-0077); solo su richiesta, da loopback, con un segreto (ADR-0106)
server/session.ts       /api/session (WebSocket; `npm run dev` e produzione, `attachSessions`): i client delle partite in multigiocatore (ADR-0058)
server/production.ts    il server di produzione senza Vite (ADR-0112): `createProductionServer`, `productionProblems`, `frontDoorRefusal`, `buildFile`; serve.ts è il suo avvio, buildServer.ts lo costruisce in `dist-server/`
server/account.ts       /api/account e la verifica dei token di Firebase Auth (ADR-0082)
server/stripe.ts        /api/stripe/checkout e /api/stripe/webhook per i pagamenti Stripe Checkout (ADR-0083)
server/wanderer.ts      /api/viandante: il viandante dell'account in un universo per il sito (profilo, crediti), GET e POST (T102, ADR-0095)
server/wallet.ts        /api/crediti: saldo e righe del viandante nei registri di pagamenti e consumi, per il sito (T105, ADR-0095)
server/worldHost.ts     ogni mondo di molti nel suo processo e il sorvegliante (ADR-0110): `WorldHost`, `buildWorld`, `worldFlags`, `worldEnv`
server/video.ts         i video del sito (ADR-0131): `/api/video`, solo ciò che è in `video.json` e ha il file, a pezzi (`parseRange`), con i tetti (`videoHandler`, `videoRoute`)
server/betaGuide.ts     le istruzioni della beta (ADR-0131): `docs/beta/` nella build solo se ci sono e solo ciò che `site/beta.json` accende (`betaGuide`, `guideParts`)
server/rates.ts         quanto spesso si può chiedere e chi chiede (ADR-0114): `Rates`, `clientAddress`, `proxyHops`
server/worldCalls.ts    ciò che le rotte chiedono al mondo acceso (ADR-0110): `WorldCalls`, `worldOf`
server/skins.ts         le vesti del sito (ADR-0145): trova le cartelle di `site/skins/`, genera `/skins/boot.js`, le porta in `dist/skins/` (`siteSkins`, `readSkins`, `bootScript`)
server/folders.ts       le cartelle del server accanto agli universi (ADR-0159): `serverPath`, `serverName`; `.balances`, `.trash`, `.queue`, `.running`, `.generation`, `.gemini-spend.json`, `.handmade` (ADR-0161), la cartella di prima spostata la prima volta che serve
server/handmade.ts      le carte fatte a mano (ADR-0161): l'archivio fuori dagli universi (`universes/.handmade/`, `HandmadeArchive`), le rotte `/api/handmade` (`handmadeHandler`), dove nasce una carta letto dal disco (`resolveFrom`)
server/programCheck.ts  chi prova il programma di una carta (ADR-0161): nel server di produzione il programma dei mondi, un processo per controllo (`processChecker`); in sviluppo questo processo (`inlineChecker`)
server/generation.ts    chi ha un universo ora (ADR-0143): il segno di un mondo acceso (`universes/.running/`), il lucchetto e il progresso della generazione differita (`universes/.generation/`)
server/bring.ts         le carte portate prima della Genesi (ADR-0170): i parenti per radice (`kinOf`), la scelta aperta (`choiceOf`), ogni carta riletta dal disco e controllata (`bringCards`), per le rotte `kin` e `bring` dello store
src/
  main.ts               bootstrap: modelli, kernel, renderer, UI, loop a 60 Hz
  master.ts             gli strumenti del master (editor, console, registro, Genesi, studio, atlante, grafo, corona), caricati con import() (ADR-0061)
  kernel/               IL PAVIMENTO — mai scrivibile da Lua
    kernel.ts           orchestratore: tick, luoghi, oggetti, contenitori, azioni (anche libere), effetti, magia, chat, Fucina, Genesi, rollback
    corona.ts           la corona come studio: edifici, interni su più piani, scaffali, gallerie
    archive.ts          le squadre del Concilio e il Referente nello studio
    npc/                le persone del mondo come un oggetto solo (ADR-0166): tutto il comportamento degli individui dietro la facciata `Npc` (`index.ts`),
                        che ne possiede lo stato e vede il mondo solo dalla porta `NpcHost` (`host.ts`); dentro: chi sono (`people.ts`), dove vanno e la via
                        (`places.ts`), i mestieri e ciò che matura (`trades.ts`), le imprese al lavoro (`worksites.ts`), fuori vista (`away.ts`), le battute
                        (`speech.ts`), le trame (`stories.ts`), i dialoghi (`talk.ts`); i dati, puri, con la loro faccia `model.ts`: la società (`society.ts`:
                        individui, legami, routine, attività, ricordi), le trame e le missioni (`plots.ts`), i programmi dei mestieri (`jobs.ts`:
                        `validateJobProgram`, `matchJob`, `JOB_BEHAVIOURS`, ADR-0140), le imprese (`ventures.ts`: `world/ventures.json`, il progresso
                        derivato, la squadra, il passo, ADR-0147), la via tra due caselle (`route.ts`: `findRoute`, `RouteCache`), gli abiti
                        (`outfits.ts`: `outfitOf`, la scheda prima e il mestiere per le zone nude, `tradeStems`, ADR-0181); da fuori si importano
                        solo `npc/index.ts` e `npc/model.ts` (`tests/npc-architecture.test.ts`)
    graph.ts            il grafo del mondo: nodi e archi dai file dell'universo, interrogazioni, controlli
    atlas.ts            l'atlante: regioni geolocalizzate, direzioni
    relief.ts           il rilievo: Hills di MarkovJunior → livello di ogni casella, mare, acqua piana tra i luoghi (ADR-0048)
    water.ts            l'acqua che scorre: l'automa cellulare del kernel sui luoghi caricati (ADR-0094)
    stamps.ts           timbri di strutture (castelli, torri, templi, piramidi, sotterranei…)
    universes.ts        client del repository dell'universo, aggiornamenti dal seme
    fourthwall.ts       principi del Concilio (due tavoli) e filtro della quarta parete, una tabella per lingua (ADR-0165)
    language.ts         la lingua del mondo (`universe.json → language`, `it` se manca), il blocco «Lingua» di ogni richiesta, il rilevatore (ADR-0165)
    mj.ts               motore di riscrittura stile MarkovJunior
    layout.ts           bozza → varchi → programma → sentieri garantiti → edifici
    content.ts          registro di oggetti, ricette, bottino, ambienti
    forms.ts            libreria dei modelli, forme (programma + seme → griglia, impronta, pavimenti, azioni); la cache delle forme del processo (`sharedForms`, ADR-0108)
    modeldirector.ts    i modelli che mancano, uno alla volta, entro `ai.maxModels`
    scoredirector.ts    i brani che mancano e quelli chiesti, uno alla volta, entro `ai.maxPieces` e il coefficiente `brani` (ADR-0127)
    chunks.ts           archivio dei piani dei luoghi
    bench.ts            il banco della Sala sistemi: i casi dei sistemi in un kernel in miniatura (ADR-0052)
    paths.ts            i percorsi che un universo può contenere (`allowedPath`), `UNIVERSE_NAME_RE` (ADR-0103), ciò che il Concilio può scrivere (`councilMayWrite`, ADR-0109)
    magic.ts            le rune nuove dal Concilio: validatore, riga del canone (ADR-0097)
    cards.ts            chi paga ogni chiamata, le carte dei contenuti, i loro utilizzi (`world/cards.json`), la collezione (ADR-0056; con `shares` anche quote e impronta)
    heritage.ts         l'eredità dei cloni: catena dei titolari, impronte, quote (ADR-0084)
    themes.ts           le quattro ambientazioni della Genesi, testo modificabile (`WORLD_THEMES`, ADR-0134; il censimento in `docs/temi-censimento.md`)
    gameSetup.ts        la partita scelta alla Genesi: livelli della morte, principio per il Concilio (ADR-0053)
    coefficients.ts     i coefficienti di generazione: quanto spesso ogni agente chiama l'IA, «Low Detail», censimento, stima oraria (ADR-0085)
    wanderers.ts        i viandanti con un id (`me` in singola), il loro stato in `world/players/`, legami e ricordi per id (ADR-0054); l'id da solo
                        (`SOLO`, `wandererOf`) in wandererIds.ts, che leggono anche le persone (ADR-0166)
    situation.ts, screens.ts  la Direzione: il tavolo della situazione e la parete di schermi (T46), funzioni pure
    clone.ts            il clone con un altro master: `universe.json` e le carte che passano (ADR-0068)
    chain.ts            la catena della Sala sistemi (T27a): misure di ogni sistema nel tick, stazioni
                        (bench.ts: anche il banco di prova, T27b: casi, scena, nomi dei campi)
    shortfalls.ts       le mancanze (ADR-0130): ciò che il Concilio non è riuscito a fare (`world/shortfalls.json`, mai ai client), il rapporto
    store.ts            il magazzino dei moduli (`ModuleStores`, `world/stores/<modulo>.json`, tetti in byte, ADR-0138)
    bring.ts            le carte portate prima della Genesi (ADR-0170): ciò che un universo può dare (`kinCards`), la voce che una carta diventa dove entra (`broughtEntry`: la carta del master, un anello in più), i doppioni (`doubles`), la scelta in `universe.json` (`cardChoiceIn`, `withCardChoice`), i modelli portati (`broughtModels`)
    brokencards.ts      le carte guaste (ADR-0172): i quattro modi (`BreakKind`), la carta e le sue copie (`cardFamily`), ciò che toglierla cambia (`withoutCards`), l'elenco del filo letto (`readBrokenCards`), le righe della console (`broughtCardsOf`)
    handmade.ts         le carte fatte a mano (ADR-0161): la forma (`HandmadeCard`), i testi di un giocatore (`cleanText`, `cleanCardName`), il programma provato sul motore vero (`handmadeProgramErrors`, `HANDMADE_LIMITS`), i tetti per account (`HANDMADE_CAPS`), ciò che esce agli altri (`handmadeSummary`, `handmadeView`)
    placing.ts          posare sui mobili (ADR-0150): i ripiani di una forma (`shelvesOf`), l'impronta di un oggetto (`itemShape`), dove sta (`findSpot`)
    moving.ts           prendere e spostare i mobili (ADR-0168): l'oggetto `thing:<modulo>` e la cosa portata (`CarriedThing`: origine, seme, stato, `readParts`), `moved` (`readMoved`), il verso (`facingYaw`), il luogo connesso (`walkGroups`, `splitBetween`), le frasi del mondo (`takeRefusal`, `putRefusal`)
    wearing.ts          ciò che si indossa (ADR-0180): la zona di un capo dal suo posto o dal nome (`wornZoneOf`, `SLOT_ZONES`), i segni dell'inventario letti senza fidarsi (`wornSlots`, `wornItems`, `keepWornMarks`), ciò che arriva dal filo (`readWorn`); vestire un inventario come decide il kernel (`dressInventory`, gli individui, ADR-0181)
    version.ts          la versione del kernel `X.Y.Z` (`KERNEL_VERSION`, `checkKernelVersion`, `stampKernel`, ADR-0136) e l'intervallo dei kernel di un universo (`universeKernels`, `rangeLabel`, `runsOnThisKernel`, ADR-0152; fuori intervallo sola lettura, ADR-0156)
    migrations.ts       le migrazioni da un contratto al successivo (`MIGRATIONS`: 0.1 → 0.2, T307a; 0.2 → 0.3, T307b, ADR-0158; 0.3 → 0.4, T308a, ADR-0159, con `portedFiles` e `pathsBefore` per chi legge il disco; 0.4 → 0.5, T308b, ADR-0163, con `luaFor0_5` per il Lua del Concilio; `migrateUniverse` all'avvio, ADR-0152; `migratePlanRecord` su ogni piano letto, ADR-0155; `opensOnThisKernel`, chi si apre qui una volta portato, ADR-0156)
    internalNames.ts    la lingua interna come dato (ADR-0153): `INTERNAL_NAMES`, ogni nome italiano di oggi → inglese (o latino per le rune), dominio per dominio, con il task che lo applica; i campi per forma di file (`FIELD_SHAPES`, `internalFields`, ADR-0159)
    deferred.ts         la generazione differita (ADR-0143): `DeferredModels` (tutto alla coda, il resto ferma), `StepGate` (si scrive solo un passo valido), `runDeferred`, `spiral`
    credits.ts          la commissione di piattaforma (`costWithFee`, la decide il server, ADR-0132) e la divisione delle spese comuni (ADR-0081)
    ai/                 models.ts, gemini.ts, mock.ts, prices.ts (prezzi, con la data; `DECISION_PRICES` per Jev), usage.ts (registro dei consumi),
                        decisions.ts (le decisioni chiuse, ADR-0157: `DecisionCall`, `JevDecisionModels`, `settleDecisions`; la regola come pavimento),
                        subscription.ts (la tabella dei provider, RoutedAiModels, QueueAiModels: i compiti lenti sugli abbonamenti, ADR-0077)
    agents/             council.ts, cartography.ts, forge.ts, genesis.ts, minds.ts, content.ts, sculptor.ts, composer.ts (il Musicista), effects.ts, mechanics.ts
    ecs.ts, sandbox.ts, prelude.lua, validator.ts, runes.ts, repo.ts, universe.ts,
    inventory.ts, bundle.ts, faults.ts, events.ts, input.ts, rng.ts, types.ts
  render/               renderer.ts (three.js: camera 3/4, luce, spazi), terrain.ts (luoghi, muri, tetti), entities.ts (entità, viandante,
                        rune, luci), held.ts (ciò che si impugna, in mano: la mesh di terra sul perno del braccio, ADR-0167), dressed.ts (ciò che si indossa: il corpo vestito chiesto al worker, `dressedFor`, ADR-0180), models.ts (geometrie dei modelli), forms.ts + worker.ts (i programmi nei worker, e la lettura delle mesh dalla cache; formmeshes.ts, le mesh di una forma, anche nei test),
                        thumbs.ts (icone: foto dei modelli), bloom.ts (bagliore dei voxel luminosi), corona3d.ts (corona, studio, avatar), coronaview.ts (la corona nel renderer, solo del master), screens.ts (la parete della Direzione), chain.ts (la catena della Sala sistemi), bench.ts (il banco di prova), overlay.ts (testi, E, mouse),
                        materials.ts, glitch.ts
  audio/                il suono nel gioco (ADR-0126): director.ts (la scelta del brano, gli effetti), renders.ts + worker.ts (il rendering fuori dalla pagina, la cache), prepare.ts (programma → ciò che si suona), sfx.ts (l'uscita: dissolvenze, volume, muto)
  ui/                   hud.ts (anche il diario delle missioni), profile.ts (il profilo del viandante), inventory.ts, actions.ts, chat.ts, feed.ts, genesis.ts, editor.ts, console.ts, studio.ts, atlas.ts,
                        graph.ts + graphlayout.ts (il grafo del mondo nel Nucleo), dom.ts, cardchoice.ts (le carte da portare, nella Genesi e nella lobby di un clone, ADR-0170), lobby.ts (la lobby: le regolazioni del master, minimi, tetto e carte; anche da soli, ADR-0086, ADR-0133), creditdialog.ts (la modale crediti esauriti, ADR-0086)
universe/
  universe.json         nome, seme, raggio, lato del luogo (18), modelli e budget, `game` (scelta alla Genesi, ADR-0053), `ai.minimums` (ADR-0086), `relief.sea` (facoltativo), `heritage` (le quote dei cloni, ADR-0084)
  world/                bible.json (memoria del Narratore), ventures.json (le imprese, le scrive solo il kernel), style.md (guida di stile dei modelli), canon.md (le rune), lexicon.md (come parla la gente), usage.json, shortfalls.json (ciò che il Concilio non è riuscito a fare),
                        rules.json (regole), people.json (la società, con i ricordi), plots.json (trame),
                        atlas.json (geografia), state.json (lo stato del mondo), graph.json (il grafo del mondo, derivato),
                        players/<id>.json (lo stato di ogni viandante: inventario, bisogni, stati, slot, frase),
                        cards.json (gli utilizzi delle carte e le carte dei luoghi),
                        stores/<modulo>.json (il magazzino di ogni modulo, `world.store_get/set`, mai ai client, ADR-0138)
                        (nomi di file e di campo in inglese dal contratto 0.4, ADR-0159)
  prompts/              theme.md, agents/<agente>.md
  models/               index.json + <id>.xml: i programmi MarkovJunior di ogni cosa (ADR-0041), uno per tipo
  modules/<id>/         manifest.json (+ logic.lua): sistemi, terreni, ambienti, pacchetti di oggetti, mobili, individui,
                        effetti (core.effects), fuoco (sys.fire), rune magiche e incantesimi (magic.runes, magic.spells),
                        il lavoro (sys.work) e i programmi dei mestieri (job.<trade>, `kind: data` con `jobs`, ADR-0140)
tests/  docs/
src/mj/                 MarkovJunior del gioco (ADR-0036, 0038): engine.ts (motore 3D; `Stepper`, il passo persistente, ADR-0164), xml.ts e model.ts (XML alla lettera; `<in>`/`<out>` figli, regole da file, `<import>`, ADR-0171), symbols.ts (i simboli: lettere o `#` e un numero, il carattere del motore e il nome, ADR-0175), palette.ts,
                        run.ts (esecuzione, animazioni, azioni), rig.ts (arti), hold.ts (come un corpo tiene un oggetto: la mano dal rig, la presa dalla forma, un punto di aggancio per posto, la posa; ADR-0167), worn.ts (ciò che si indossa: le zone del corpo, la via C dei colori, la via B della sezione `<worn>`, il corpo vestito, i corpi di prova; ADR-0180), mesh.ts (voxel → triangoli, impronte, pavimenti),
                        sound.ts (il suono come programma: `<sound>`, griglia → partitura, ADR-0123), synth.ts (partitura + seme → campioni, l'unica fonte del suono), soundanalysis.ts (cosa suona e cosa non va, in testo, con le soglie che usa anche il validatore; ADR-0125, `lab/banco/suono.md`), classes.ts (classi e scatole), infer.ts (`field`, `observe` e `search` di MarkovJunior, con i tetti `INFERENCE_LIMITS`; ADR-0173), wfc.ts (`wfc` a tessere e a sovrapposizione e `convchain` di MarkovJunior: tileset, finestre, il `WfcSolver`, i tetti `WFC_LIMITS`; ADR-0174), photo.ts (foto in 3/4 per l'Artista, a cartone), toonlight.ts (i numeri della luce del cartone, senza three.js), check.ts (misure di un modello), trace.ts (la traccia in testo di un programma: per nodo volte, celle, scatola, regole; ADR-0118, `lab/banco/traccia.md`)
src/session/             il kernel sul server (ADR-0058): worldProcess.ts e worldwire.ts (il processo di un mondo e il suo canale, ADR-0110), protocol.ts (messaggi, fakeLink), files.ts (ciò che esce, a elenco: `playerFiles`, `publicFiles`, ADR-0109), server.ts (SessionServer), client.ts
                        (SessionClient: ciò che un client sa del mondo), host.ts (apre un universo e fa girare il suo mondo), account.ts e login.ts (l'account, ADR-0082);
                        il client sottile (ADR-0059): thin.ts (ThinClient: riempie il kernel specchio), socket.ts (WebSocket, id della scheda)
tools/pipeline/          la pipeline agentica (ADR-0072, 0079): pipeline.mjs (code, budget, esecuzione nei worktree, ripresa dopo i limiti, dossier),
                        orchestra.mjs (il processo dell'orchestratore: chat, eventi, epoche), web.mjs (l'interfaccia web locale, T69), config.json
tools/sicurezza/        il kit delle prove dell'autore (T137): prove.mjs (esecuzione, esito), catalogo.mjs (le prove), ambiente.mjs (i limiti: loopback, cartella temporanea, segreti finti), server.mjs, sandbox.mjs (processi a parte)
tools/lingua/           commenti.ts e cli.ts: i commenti del seme in inglese (T309): dove sono (`commentUnits`), il codice uguale togliendoli (`codeDifference`: token Lua, albero XML), `estrai`, `applica`, `confronta <ref>`, `italiano`
tools/glossario/        glossario.mjs: legge docs/glossario.md e riscrive il censimento dei sinonimi, docs/glossario-censimento.md (ADR-0117)
tools/mancanze/         rapporto.ts (il comando), leggi.ts (legge `world/shortfalls.json` degli universi sul disco, ADR-0130)
tools/generazione/      genera.ts (il comando della generazione differita, `npm run genera`, ADR-0143)
tools/abbonamenti/      servi.ts (il processo che serve la coda degli abbonamenti con la CLI isolata, ADR-0077, ADR-0106)
tools/vesti/            scritta.ts ed estrai.ts (la scritta della veste futuristica estratta dalla proposta, verificata cella per cella), logo.ts (logo e icona della sobria, gli elementi SVG della proposta così come sono), misura.mjs e cattura.mjs (quanto costano gli effetti di una veste, le catture): un Chrome headless proprio, solo loopback (cdp.mjs, ADR-0151)
lab/                    laboratorio di MarkovJunior (ADR-0038); le tre pagine dei giocatori con la barra delle carte fatte a mano (`lab/handmade/`, ADR-0169): sandbox 3D /lab/3d/, editor modelli /lab/editor/ (T59a, T59b, T59c, T59d), entrambi con l'interruttore cartone/classica (`lab/look.ts`), SoundLab /lab/suono/ (T222), modelli ufficiali e conformità, i pattern con cui crescono le strutture e tre programmi di riferimento del cantiere (lab/banco/pattern.md, lab/banco/riferimento/, T181), script per
                        affettare, fotografare, misurare e provare i programmi con Gemini; non importarlo da src/
site/                   il sito web (ADR-0095, T97): landing (il palco 3D caricato a richiesta, `hero-stage.ts`, i suoi programmi in un worker, `hero-worker.ts`, ADR-0164), carte 3D, sessioni, profilo, crediti, notizie (`site/notizie/`, un Markdown per notizia, ADR-0129), video e istruzioni della beta (ADR-0131); theme.css condiviso con il gioco; le vesti in `site/skins/<id>/`, una cartella per veste sopra la base comune, `site/skin.ts` il selettore (ADR-0145)
```

## Il Concilio (ADR-0008, 0011, 0012, 0013, 0014, 0016, 0042)

| Agente | Fa |
|---|---|
| Narratore | bibbia; concetti dei moduli; individui dietro ogni NPC (mestiere, famiglia, routine); chat nel personaggio; pacchetti di oggetti, ricette, bottino; oggetti citati; "Esamina"; combinazioni; giudica azioni libere e fabbricazioni libere; dà nome agli incantesimi nuovi |
| Cartografo | terreni (con strati) e ambienti (programmi di riscrittura) alla Genesi; per ogni luogo: ambiente, nome, cosa c'è dentro e fuori, rune |
| Artista | guida di stile (palette, forme, luce); guarda le foto dei modelli da quattro lati e li giudica (voto, problemi, consigli) |
| Scultore | scrive i programmi MarkovJunior dei modelli (ADR-0042) e le `<action>` che «Altro…» chiede (ADR-0044): per classe (3.1 Flash-Lite per le cose semplici, due programmi; 3.8 Flash per figure e strutture, con una revisione; Argon per le strutture importanti); i modelli che mancano li trova il `ModelDirector` |
| Fisico | fisica di moduli, terreni e oggetti (pesi, pile, effetti) |
| Ingegnere | logic.lua (`on_act`, `on_use`, `on_action`…); meccaniche con pannelli (`mechanic.design`); ripara il codice che fallisce |
| Arbitro | coerenza tra narrativa, aspetto, fisica e codice; rimanda all'agente responsabile; tiene le sessioni del Concilio |
| Referente | nella corona accoglie il viandante trasceso e porta le sue richieste alla squadra giusta (Fucina, Cartografo, Scultore, regole, pacchetti; in multigiocatore dà al master le rune che chiede) |
| Musicista | nella casa dell'Artista (ADR-0127): scrive i programmi sonori di ciò che il mondo chiede (un ambiente che non ha un brano) e di ciò che il viandante chiede al Referente; il validatore applica le soglie dell'analisi e l'invalido torna a lui col motivo |
| Attore | solo se il master lo accende (`ai.actor`, ADR-0116): interpreta gli individui (`npc.reply`, `npc.dialogue`) dalle **schede** che il Narratore scrive una volta per individuo; non inventa fatti del mondo; nello studio ha il suo gerboa, il posto al tavolo accanto al Narratore e la console, e a opzione spenta resta a riposo (T158) |

Registro, Luogo, Fucina e Genesi → `docs/architettura-dettagli.md#concilio`.

## Indice architettura del gioco e sottosistemi

> I rimandi `→ #sezione` sono sezioni di [`docs/architettura-dettagli.md`](docs/architettura-dettagli.md): prima di toccare un'area leggi la sua.

- **Spazi, tappeto, rune, magia, borse**: cerchio di raggio 42 col tappeto, rune come token Lua eseguiti, canone, frase, `T` e mana → `#spazi-rune-magia`
- **Lessico**: le parole e le usanze del mondo, mai spiegate come un glossario → `#lessico`
- **Regole, effetti, stati, morte, menu, salto, contenuti**: i giudizi diventano regole, gli effetti sono un insieme chiuso; ciò che si impugna si posa sul ripiano di un mobile, dove la sua impronta sta (`placing.ts`, il componente `placed`, `state.json → placed`, ADR-0150); ciò che il manifest dice `takeable` si prende (vuoto, niente sopra, nessuno sopra) e si posa a terra altrove come sé stesso (`thing:<modulo>`, `moving.ts`), dove il terreno lo regge, niente è in mezzo, non davanti a una porta e il luogo resta connesso (regola 10, `wouldSplit`), e lì resta (`state.json → moved`, `consumed`, ADR-0168) → `#regole-effetti`
- **Società, vita degli NPC, personaggi**: individui, legami, routine, trame, missioni; i mestieri come programmi (`sys.work`, esiti `done`/`ongoing`/`failed:<motivo>`, `ripens` nei terreni, il giorno in `plan.days`, ADR-0140); la via va dove va il passo, e chi non ha via rinuncia al compito (`world.path` col raggio di chi cammina, ADR-0154); le imprese (`world/ventures.json`, scritto solo dal kernel, progresso derivato da ciò che è portato e lavorato, regole senza chiamate, `costruisci`, il pannello del cantiere, ADR-0147); l'edificio per stadi (la griglia finita filtrata, `stageGrid`, picchetti e impalcature, `plan.stages` e `plan.houses`, ADR-0148); fuori vista (la contabilità una volta al giorno, il ritorno, `on_return`, ADR-0149); tutto questo è un oggetto solo, `src/kernel/npc/`: la facciata `Npc` che il kernel chiama (un campo, `npc.tick()`), la porta `NpcHost` da cui l'NPC vede il mondo, due facce per chi sta fuori (`npc/index.ts`, `npc/model.ts`), una direzione sola di import, nessuna di kernel, viandanti, sessione, rendering, UI o server (ADR-0166, `tests/npc-architecture.test.ts`); gli abiti degli individui dalla scheda del Narratore (`indossa` in `npc.individuate`, la stessa chiamata, `world/people.json → wears`) o dal mestiere fra i capi del mondo (`outfitOf`, senza chiamate; un mestiere senza capi non veste), coi segni dell'inventario che il renderer legge come per il viandante (`dressInventory`, ADR-0181) → `#societa`
- **Corona e interni dello studio**: campus, edifici, vetrine, plastico, Nucleo, Biblioteca, Direzione, Galleria, Sala del Concilio → `#corona`
- **Meccaniche, casi dei sistemi, catena, banco di prova** (Sala sistemi) → `#sala-sistemi`
- **Geografia**: biomi, ambienti, timbri, atlante → `#geografia`
- **La partita, i viandanti, le rune per ruolo**: scelte alla Genesi e fisse, `as(id, fn)` sincrono, il master → `#partita-viandanti`
- **Semi condivisi**: la simulazione non estrae mai dall'orologio → `#semi`
- **Chi paga, carte, crediti**: `chi` su ogni chiamata, `commitContent`, commissione decisa dal server (`QUINE_COMMISSIONE`), spese comuni divise; le carte fatte a mano (la collezione dell'account fuori dagli universi, `/api/handmade` dietro l'interruttore `laboratori` di `site/beta.json`, il programma provato sul motore vero con tetti misurati sul seme, ADR-0161); i laboratori dei giocatori (serviti solo con l'interruttore, la build senza gli strumenti degli sviluppatori decisi da `import.meta.env.MODE`, il fork, la bozza, «Salva» coi motivi del server, `site/laboratori.html`, le carte fatte a mano in `carte.html`, ADR-0169) → `#carte-crediti`
- **Regolazioni del consumo**: ogni compito ha una manopola, si fissano entrando (ADR-0133); `lives` (Cronaca, Vita, Teatro; `vite` prima di T307b) assente vale 0 (ADR-0138) → `#lobby`
- **Multigiocatore**: kernel sul server, client sottile, luoghi nuovi, file del giocatore, ramo del master, god mode, doni, PvP, profilo, morte; i `campo` dei pannelli in `MyState.fields` (a elenco, regola 8f) e i tasti di ogni viandante (`keys`, `world.wanderers()`, `input.held(azione, id)`, ADR-0139); i messaggi e i loro campi in inglese dal contratto 0.5 (`join`, `step`, `welcome`, `update`, `result`…, ADR-0163); ciò che un altro viandante impugna (`OtherView.held`, a elenco, ADR-0167) e indossa (`OtherView.worn`, zona → id, e l'operazione `wear`, ADR-0180); ciò che un individuo indossa (`EntityView.worn`, zona → id, il componente `worn` dello specchio, ADR-0181); di una cosa del mondo portata esce solo il seme del suo aspetto (`shownInventory`, `OtherView.heldSeed`, ADR-0168) → `#multigiocatore`
- **Account Firebase e anonimi** → `#account`; **Stripe Checkout** → `#stripe`; **lobby** → `#lobby`; **coda CLI degli abbonamenti** → `#abbonamenti`
- **Clone con un altro master, eredità delle carte, le carte portate prima della Genesi** (la radice del contratto: ogni universo nato dal seme di un contratto comincia dallo stesso commit, e chi ha una radice in comune è parente; la scelta aperta in `universe.json → cardChoice` fino alla Genesi o al primo ingresso; `kin` e `bring` solo del master, ogni carta riletta dal disco e controllata, tutto o niente in un commit del kernel; il titolare il master, un anello in più nella catena; nessun saldo si muove; ADR-0170; le carte guaste: una carta portata che nel mondo getta o ferma il suo worker, non produce niente, non ferma un corpo solido o tace si isola col generico della classe, si mostra al master col motivo e lui la toglie dalla console con un commit dei soli `models/`, chi la usava torna ai direttori entro i tetti, in un mondo di molti l'elenco `broken` a ogni client e il messaggio `card` solo del master; ADR-0172) → `#clone-eredita`
- **Mondo in 3D, bozze di prova, mappa, voxel luminosi**: un'unità = una casella, kernel (x, y) = three.js (x, z); ciò che si impugna si vede in mano con la mesh di terra, la mano dal rig e la presa dalla forma, senza una tabella per oggetto, un punto di aggancio per posto (`MOUNTS`), e lo vedono gli altri (`OtherView.held`, ADR-0167); una cosa del mondo portata va sopra la testa, sul corpo, con le braccia alzate (`overheadPose`, ADR-0168); ciò che si indossa (testa, busto, schiena: `inventory.worn`, `wearSlot`) rifà nel worker il corpo di chi lo indossa, con la sezione `<worn>` del programma del capo dove c'è e con i suoi due colori sulla zona altrimenti (via B e via C, la C per tutto ciò che esiste), con il rig del corpo nudo, e lo vedono gli altri (`OtherView.worn`; ADR-0180; gli individui dopo) → `#mondo3d`
- **MarkovJunior, modelli, cache delle forme**: ogni aspetto è un programma, un'istanza è un seme ; un simbolo è una lettera o `#` e un numero (`#12`, avido: `#12A` sono due), una cifra da sola e `#` senza numero sono errori del compilatore col motivo, al più 255 simboli per programma oltre la cella vuota (`MAX_SYMBOLS`, le celle sono byte), dentro un carattere per simbolo (`#0`-`#9` le cifre: un programma di prima convertito è lo stesso per il motore) e fuori sempre il nome (`symbolName`), in `src/mj/symbols.ts` (contratto 0.6, ADR-0175); il motore si ottimizza solo voxel per voxel identico (`tests/mj-engine-determinism.test.ts`, ADR-0142); ciò che si muove a ogni tick di una pagina sta su un passo persistente (`Stepper`: `advance` è `runOn` a pezzi, `tick` rifà il programma con le corrispondenze tenute, ADR-0164); un lato di una regola come attributo o come figlio `<in>`/`<out>`, mai i due, le regole da file di testo (`fin`, `fout`, `file`) e `<import file>` da `models/` per nome semplice, che il compilatore riceve (`compileMjx(…, { files })`, `mjxIncludes`) e la cache delle forme conta (ADR-0171); l'inferenza dell'originale (`field`, `temperature`, `observe`, `search`) in `src/mj/infer.ts`, solo nei nodi che la usano (`GuidedRunner`), con tetti di stati e byte deterministici e uno di tempo che lascia la corsa non finita (ADR-0173); `<wfc>` a tessere (un tileset di `models/` in testo, le tessere come pattern, anche da file) e a sovrapposizione (un campione di testo), `<convchain>`, `map` a scala frazionaria, `folder` per le regole da file e le unioni di ogni griglia: il compilatore fa rotazioni, vicini e finestre (`src/mj/wfc.ts`), il motore l'onda in un passo e i nodi dentro solo se c'è una soluzione, deterministica dal seme con tetti di motivi, tentativi, byte e tempo (ADR-0174); il mondo prende questi nodi dentro tetti suoi più stretti, contati in unità e misurati sui modelli dell'originale (`WORLD_NODE_LIMITS`, `worldNodeErrors` nel validatore: l'onda, i motivi, `tries` e `limit` scritti, i passi di `convchain`, i file letti e gli import uno dentro l'altro; l'onda e i potenziali come `ceilings` della corsa, che sotto non cambia niente), i tileset di `models/` si validano come li legge una `wfc` (`tilesetErrors`), le carte fatte a mano e i controlli dello Scultore vogliono gli stessi tetti e lo Scultore legge i file di `models/` che la richiesta gli elenca (ADR-0176); i modelli grandi a parti coerenti: il piano grossolano decide, una `map` porta ai voxel e il dettaglio gira in `<pieces piece margin time>`, un pezzo alla volta su una finestra col margine che cresce e si butta, ognuno col suo generatore e il suo tempo, così una regola che non dipende dall'ordine e guarda non oltre il margine dà la griglia intera voxel per voxel; `one` sceglie nel suo pezzo; la griglia più grande e il tempo dei pezzi (`FORM_PIECES`) solo dove il gioco fa le forme, non nel validatore (ADR-0178); un capo da indossare ha accanto alla radice la sezione `<worn zone="head|torso|back">`, regole sulla copia del corpo di chi lo indossa con le lettere `z o r m` del kernel, che la corsa a terra salta e che lo Scultore scrive quando la richiesta dice la zona, provata dal validatore e dai suoi controlli su due corpi del kernel (`wornErrors`, ADR-0180) → `#markovjunior-modelli`
- **Il suono**: programmi MarkovJunior con `<sound>` in `models/sound-*.xml` (classe `suono`; `suono-*` prima di T307b), griglia → partitura → campioni con una funzione pura; il browser suona quei campioni (ADR-0123); nel gioco il suono è del client, senza messaggi: il direttore sceglie il brano con una funzione pura, il rendering sta in un worker con la cache, ciò che fallisce tace (ADR-0126); il SoundLab e i ritocchi del piano roll; un agente lo legge con `lab/scripts/mjx-sound.ts` (ADR-0125); li scrive il Musicista, che abita nella casa dell'Artista perché una stanza ha un elenco di squadre (`Building.teams`, ADR-0127) → `#suono`
- **Lotti e strutture, scale, piani** → `#lotti`, con le strutture grandi che crescono a regole: il prompt procedurale dello Scultore, un programma senza scatola per più taglie (una voce per taglia, `struttura-<concetto>-<taglia>`) e più semi (`ModelInfo.seeds`, ADR-0160), e almeno due piani raggiungibili a piedi nei controlli (`reachableStoreys`, ADR-0162); ciò che entra, non l'edificio rimpicciolito: a 20 voxel per casella a ogni taglia fino a `STRUCTURE_SIDE` (`densityFor`; le voci di prima tengono la scatola, `entryBox`), le parti abitabili con misure minime in caselle (`PARTS`, misurate da `habitableParts`, una sotto misura è un errore, `partErrors`) e la taglia più grande che contiene di più (`compositionOf`, `varietyError`; ADR-0179, banco `lab/banco/taglie/`); **taglie di D&D** → `#taglie`; **sotterranei** → `#sotterranei`, con la lettera del suolo: `soil="E"` sulla radice, il kernel la scrive sullo strato `base`, lo stesso programma serve ogni taglia (ADR-0135)
- **Rilievo** (`Relief`, altezze, mare) → `#rilievo`; **acqua che scorre** (automa del kernel, `kernel.dig`) → `#acqua`; **grafica a cartone** (il predefinito, ADR-0093; `?classica` per confronto) → `#cartone`
- **Grafo del mondo**: nodi e archi dai file, `focus` come contesto del Narratore → `#grafo`
- **Ambientazioni**: quattro testi tra cui scegliere nella Genesi, un seme solo; ciò che sopravvive alla Genesi parla di epoca, le case comuni dipendono dal mondo (`commonHouse`, ADR-0134) → `#concilio`
- **Il Concilio al lavoro**: registro, come nasce un luogo, Fucina, Genesi, le mancanze (ciò che non è riuscito a fare, ADR-0130) → `#concilio`
- **Il sito e il tema, le vesti** (la home è il launcher: il pannello di lancio accanto al palco, ciò che non ha contenuti resta nascosto, T233; una cartella di `site/skins/`, `data-skin` sulla radice; la base legge solo token `--skin-*`, misure dalla scala aurea, ADR-0145; la futuristica: la scritta della proposta estratta così com'è, effetti a tick, le luci scelte coi numeri, ADR-0151; il labirinto MarkovJunior in 2D sotto l'hero coi colori invertiti, le luci sul passo persistente, ADR-0164) → `#sito`; **confine e limiti di Lua** → `#lua-sandbox`; **Gemini, Attore, coefficienti, decisioni chiuse (Jev)** → `#gemini`
- **Convalida nel browser**: build, preview, spostarsi fermando il tappeto, `interact()` → `#convalida-browser`
- **Costi e prestazioni** → `#costi`; **stato del progetto e prossimi passi** → `#stato`; il lavoro da fare è in [`docs/plans/backlog.md`](docs/plans/backlog.md)
- **La lingua interna** (ADR-0153): inglese per ciò che il codice legge, latino per i token delle rune magiche, la lingua dell'universo per il mondo; la tabella, i contratti `0.2`-`0.5` e il piano dei task in [`docs/lingua-interna.md`](docs/lingua-interna.md); i prompt del Concilio in inglese con il blocco «Lingua» (ADR-0165)
- **Fasi e step** (ADR-0128): le quattro fasi dello sviluppo e gli step, obiettivi condivisi tra task, in [`docs/fasi.md`](docs/fasi.md): ogni task sta in una sola riga della tabella, il numero di uno step non cambia; `pipeline.mjs step` ne copia il numero nella riga `- Step:` del backlog e priorizza uno step (T231)

### Manifest (`src/kernel/types.ts`)
`id`, `name`, `kind` (`system | entity | item | player | generator | data`), `logic`, `order`,
`appearance` (`glyph`, `color`, `look`, `model`, `class`, `size`), `physics`
(`solid`, `radius`, `pushable`, `mass`, `friction`, `speed`), `components`, `singleton`, `persist`,
`interaction` (`talk | read | lua`), `actions` (`id`, `label`, `requires`, `effects`), `container` (`size`, `loot`),
`ui` (pannello: `title`, `elements`), `spawn`, `persona`, `unique`, `takeable` (si prende e si sposta, assente vale no, ADR-0168), `inventory` (id di oggetti), `item`, `context`, `lore`, `tags`, `drops`,
`origin`; generatori: `tiles` (`id` interno dal contratto 0.2, `name` nella lingua del mondo, `color`, `solid`, `layer`, `indoor`, `speed`, `model`, `actions`, `ripens`),
`roof`, `commonHouse`; dati: `items` (anche `model`, `look`, `container`, `actions`, `slot`, `bonus`, effetti `mana`), `recipes`, `loot`, `layouts`, `fragments`, `runes`, `spells`, `jobs` (ADR-0140).

### API Lua — l'unica disponibile, il validatore rifiuta il resto
`ecs.each/get/set/spawn/destroy/first`; `world.free/free_real/tile/speed_at/spawn/player/player_pos/wanderers/path/find_tile/act/
nearest/has_tag/break_entity/say/speak/set_tile/open/make_container/store_get/store_set` (il magazzino del modulo, ADR-0138), `world.venture/venture_bring` (il passo dell'impresa e ciò che le si porta, ADR-0147; `impresa/impresa_porta` fino al contratto 0.4); `inventory.add/remove/count/equipped`; `items.find/def/bonus`; `ui.slot`;
`input.held(azione, id?)` (i tasti di ogni viandante, ADR-0139); `bus.emit`; `log`; `hash`; `math string table utf8 pairs pcall…` (`math.random` seminato dal kernel, ADR-0055).
Hook: `update(dt)` (sistemi), `generate_chunk`, `on_spawn(id)`, `on_interact(id, user)`,
`on_act(id, user, action)`, `on_use(user, item)`, `on_action(user, target, item)`, `on_slot(user, slot, item, panel)`, `on_ui(user, azione)`, `on_return(luogo, trascorso)` (un luogo lasciato torna, ADR-0149); `core.items.use(user, item)`;
`core.effects.apply(target, user, effect, x, y)`. Componenti noti (in inglese dal contratto 0.5, ADR-0163; `fino` è `expires`, non `until`, parola riservata di Lua):
`light {radius, lit, color}`, `fire {radius}`, `ephemeral {expires}` (sparisce a tempo), `shield {expires, off}`, `goal {x, y}` (dove va un NPC),
`activity {kind, still}`, `states` (del viandante, ogni stato `{speed, weight, light, expires}`), `job`, `work`, `load`, `structure {concept, class, size, stage}`.
`bus.emit("death", {hunger, thirst})` da `sys.needs` chiude la sessione.

## Protocollo delle sessioni

Il progetto si porta avanti in **sessioni brevi**, una per task: ogni sessione riparte da zero e lo stato del
lavoro vive nei file, non nella chat.

1. **All'inizio**: leggi questo file. Poi apri [`docs/userchats/to-do.md`](docs/userchats/to-do.md): se nella
   sezione «Modifiche da fare» ci sono richieste dell'autore non ancora pianificate, trasformale in task atomici
   in [`docs/plans/backlog.md`](docs/plans/backlog.md) (contesto, cosa fare, quando è fatto, dipendenze,
   domande per l'autore) e **toglile dal to-do** (il testo originale va in `docs/userchats/to-do-<data>.md` se i
   task lo citano). Questo conta già come lavoro della sessione: committalo.
2. **Il task**: esegui un solo task del backlog, quello indicato nel prompt (o il primo `da fare` con le
   dipendenze fatte). Segnalo `in corso`. Se scopri che è troppo grande, spezzalo nel backlog e fai il primo
   pezzo. Se serve una decisione dell'autore, segnalo `in attesa` con la domanda scritta nel task e chiedila.
3. **Alla fine**: `npm test` e `npm run typecheck` verdi (e la verifica nel browser se tocca il gioco, vedi sotto); ADR e
   questo file aggiornati se la decisione è architetturale; il task segnato `fatto` con il commit e una riga su
   cosa è cambiato rispetto al previsto; commit (mai su `main`). Poi **dai all'autore il prompt per la sessione
   successiva** (quello in testa al backlog, con il numero del prossimo task) e di' in una riga cosa farà.

**La pipeline** (ADR-0072, [`docs/pipeline/README.md`](docs/pipeline/README.md)): la pianificazione (to-do → backlog → stima e
provider nella riga `- Pipeline:` del task) la fa un agente con [`docs/pipeline/pianifica.md`](docs/pipeline/pianifica.md) (`/pipeline` in Claude Code);
l'esecuzione la fa `node tools/pipeline/pipeline.mjs esegui`: task in parallelo su Claude Code e Gemini entro i tetti dell'autore (`limiti`) e gli slot dinamici dalla previsione dei crediti (ADR-0087, mai sotto 1 e sospendi/riattiva T96), una verifica nel browser, una suite intera di test (al più 6 worker), un typecheck e una build alla volta (`pipeline.mjs turno browser|test|typecheck|build -- <comando>`, ADR-0088), uno per worktree
(`task/<Txx>`), entro il budget di ogni provider, ripresi dopo un limite. **Chi esegue un task lanciato dalla pipeline è in un ambiente
condiviso**: segue le «Regole per chi esegue un task» del README (solo il suo worktree, mai il backlog, niente merge né
domande: le scrive in `docs/pipeline/domande/<Txx>.md`) al posto dei punti 1 e 3 sul to-do e sul prompt successivo.
**Fable** (ADR-0115, ADR-0146): il provider `fable` (tetto 1, dentro i 3 della CLI di Claude) solo per i task più difficili; orchestra solo se l'autore spunta la sua casella, fuori da `orchestra.ordine`, con `/agente`.
**I modelli e lo sforzo** (ADR-0146): `claude` è Opus 5.5 e il predefinito; `sonnet`, `haiku`, `agy-opus`, `agy-sonnet` in prova, a tetto 1, non orchestrano; `- Pipeline:` dice `sforzo low|medium|high|extra|xhigh|max` (`assegna --sforzo`, predefinito `high`), che arriva alla CLI e sta in `consumi.jsonl`; si sceglie da [`docs/pipeline/modelli.md`](docs/pipeline/modelli.md).
**Il generatore sui crediti che avanzano** (ADR-0177): se a slot pieni Claude arriverebbe al reset con almeno `generatore.minimo` % avanzato, `esegui` lancia `npm run genera` sul prossimo universo di `config.json → generazione` entro l'avanzo e il tetto dell'universo, in uno dei posti del tetto della CLI (che non cambia), e lo ferma, tenendo il lavoro fatto, per un task pronto, la finestra delle 5 ore, `ferma` o l'autore (`generatore spegni|accendi`); `stato` dice cosa genera e quanto ha speso.
**I piani e il contesto dei task** (ADR-0119): `abbonamenti` e `piani` in `config.json` scalano le stime e dicono i provider attivi; un task nuovo parte solo se la finestra delle 5 ore lo regge (`windowAdmits`), e solo sul suo provider, senza ripiego; gli agenti leggono `.pipeline-task.md` e non toccano il backlog: stato ed esito li scrive `integra`, che rinumera anche gli ADR in conflitto; `quadro.md` è una fotografia sotto le 75 righe.
**L'orchestratore** (ADR-0078, [`docs/pipeline/orchestra.md`](docs/pipeline/orchestra.md), `/pipeline` in Claude Code e in Antigravity)
è l'agente da cui l'autore lancia sempre la pipeline: pianifica, lancia `esegui`, riporta ogni task, delega a un subagente la verifica nel
browser che il task chiede e non ha fatto (riga `BROWSER:`), integra rinumerando gli ADR che si scontrano, e tiene
[`docs/pipeline/orchestrazione.md`](docs/pipeline/orchestrazione.md) (passaggio di consegne e diario). Il suo provider
(`orchestratore <provider>`, a mano quando i crediti finiscono) sotto `sogliaUnSolo` non riceve task.
**L'ambiente dell'orchestratore** (ADR-0079): la pipeline si lancia con `node tools/pipeline/pipeline.mjs orchestra [--agente claude|argon|gemini] [--porta 4242]`
(`tools/pipeline/orchestra.mjs`): un processo con `esegui` sempre acceso, l'interfaccia web locale (`tools/pipeline/web.mjs`, T69; anche da sola con `node tools/pipeline/pipeline.mjs web`) e la conversazione con l'orchestratore a turni (`claude -p --resume`,
`agy -p --conversation`), la chat nel terminale e sul web (stessa coda `.pipeline/orchestra/coda.json`), eventi e chat su disco (`.pipeline/orchestra/`), epoche che ripartono dal **quadro**
(`docs/pipeline/quadro.md`) al 35 % della finestra o quando i crediti finiscono (provider successivo di `orchestra.ordine`), con `avvio.md` compatto (senza indice intero, chat troncata e deduplicata) e interpellando l'orchestratore solo per messaggi dell'autore o decisioni (esiti, limiti, conflitti; ADR-0089). L'orchestratore
decide e delega (`interrompi`, `approva`, `assegna`, `dossier`, `indice`, `prossimo`, `ferma --ora|--dopo` quando l'autore chiede di spegnere, ADR-0090: Ctrl+C è `ferma --ora`, i task interrotti riprendono al riavvio e `avvio.md` dice cosa era in corso e cosa è finito; `integra` su un conflitto annulla e la risoluzione
diventa un task); i task sopravvivono al processo (log diretti, `--session-id`, ripresi al riavvio).

**Le vulnerabilità** (ADR-0098, T136, [`docs/sicurezza/README.md`](docs/sicurezza/README.md)): rilevamento → scheda → specifica → task → test → chiusura. Il registro `docs/sicurezza/registro.md` ha una voce `V-NNN` per ognuna;
la suite `tests/sicurezza/` afferma le proprietà, con `it.fails` per le voci aperte (chi chiude una falla toglie `.fails`). Chi esegue un task che tocca `server/`, `src/session/`, la sandbox, il validatore, i crediti o i pagamenti scrive nell'esito
«sicurezza: nessuna superficie nuova» o le voci che ha aggiunto. Non è una vulnerabilità ciò che resta dentro il gioco: a parte i crediti, tutto si può modificare.

### Convalida nel browser

La procedura, con gli snippet per spostarsi nelle stanze, è in [`docs/architettura-dettagli.md#convalida-browser`](docs/architettura-dettagli.md#convalida-browser).

## Convenzioni

- **L'inglese è la lingua interna** (ADR-0153, step 42): identificatori, commenti TypeScript, valori che il codice confronta, campi su disco e sul filo,
  percorsi dell'universo, nomi visibili a Lua, commenti di Lua e XML e prompt in **inglese**; i token delle rune magiche in **latino**; documentazione, UI e
  testi del mondo (la lingua del suo universo, oggi l'italiano) in **italiano**. Il passaggio lo fanno T307a-T310 con una migrazione per contratto (fatti T307a, contratto `0.2`: la simulazione e le rune latine, ADR-0155; T307b, contratto `0.3`: la società e il Concilio, ADR-0158; T308a, contratto `0.4`: i campi e i percorsi dei file dell'universo, le cartelle del server, `io` → `me`, ADR-0159; e T308b, contratto `0.5`: il filo e Lua, i messaggi del protocollo e i loro campi, i componenti e i loro campi, l'API `world.venture`, l'evento `death`, ADR-0163; T309, kernel `0.5.1`: i commenti del Lua e degli XML del seme, con `tools/lingua/cli.ts` che controlla che il codice attorno non cambi e `tests/seed-comments.test.ts` che li tiene inglesi; T310, kernel `0.5.2`: i prompt del Concilio in inglese, la lingua del mondo e il blocco «Lingua» dopo i principi, gli id degli schemi interni, la quarta parete in italiano e inglese, ADR-0165; i campi degli schemi, il tipo di legame come id e le espressioni regolari che leggono il mondo sono T310b): la tabella
  è `src/kernel/internalNames.ts` (`INTERNAL_NAMES`), raccontata in [`docs/lingua-interna.md`](docs/lingua-interna.md); un nome nuovo su disco, sul filo o in Lua nasce inglese.
- **Un nome per ogni concetto** (ADR-0117): [`docs/glossario.md`](docs/glossario.md) dice per ogni concetto il nome italiano, quello inglese del codice, i sinonimi da non usare e ciò che è fermo. Un identificatore italiano non è un'eccezione: si rinomina (le righe R del glossario; le eccezioni dette da ADR-0117 sono tolte). Un concetto nuovo ha una voce lì nello stesso commit. Ciò che è su disco, sul filo o visibile a Lua (campi JSON, messaggi del protocollo, API Lua, effetti) non si rinomina senza una migrazione; gli ADR non si riscrivono.
- File in LF (`.gitattributes`). Su Windows niente `Get-Content`/`Set-Content` di PowerShell 5.1 sui sorgenti.
- Nuova API per Lua: `Host` + `prelude.lua` + `LUA_API` nel validatore + prompt dell'Ingegnere + questo file.
- Nuovo compito per un agente: schema Gemini + risposta in `MockAiModels` + voce nel registro.
- Nuova decisione chiusa (ADR-0157): una riga di `CENSUS` con `via: 'decide'` e la sua manopola, `Council.decide` con la regola di oggi in `rule` (il pavimento e la risposta dei modelli locali), uno stato scritto dal kernel con soli dati del mondo.
- **La versione del kernel** (ADR-0136): `X.Y.Z` = era, contratto, incremento, in `src/kernel/version.ts` (`KERNEL_VERSION`) e in `package.json`, uguali. Chi cambia `src/kernel/` sale di `Z` se gli universi della stessa `X.Y` restano buoni, di `Y` (e `Z` a 0) se cambia il contratto (formati, senso di una primitiva, regole del terreno, caso): un contratto nuovo vuole un universo nuovo. `universe.json → kernel` lo scrive il kernel, con `kernels`, l'intervallo dei contratti su cui l'universo gira (`from`, aperto finché il contratto non cambia; ricavato da `kernel` se manca, ADR-0152); `checkKernelVersion` al caricamento, un universo fuori intervallo resta in piedi con il guasto `universe:kernel` e **si legge soltanto** (ADR-0156): niente arriva al suo repository (`Repo.readOnly`: commit, rami, pubblicazioni, ritorni; i piani restano in memoria, `SealedChunks`) e il Concilio usa i modelli locali (`Kernel.readOnly()`, `Council.write`); un universo che le migrazioni portano nell'intervallo non lo è; si vede con l'etichetta («kernel 0.1–0.1») dove si scelgono gli universi, non si cancella e non prende niente dal seme. Le migrazioni da un `X.Y` al successivo stanno solo in `src/kernel/migrations.ts` (oggi `0.1 → 0.2`, ADR-0155, `0.2 → 0.3`, ADR-0158, `0.3 → 0.4`, ADR-0159, `0.4 → 0.5`, ADR-0163, che riscrive anche il Lua del Concilio con `luaFor0_5`, la stessa funzione che porta al contratto il codice che l'Ingegnere scrive ancora coi nomi di prima, e `0.5 → 0.6`, ADR-0175, i simboli dei programmi MarkovJunior: una cifra da sola diventa `#` e la cifra solo dove sta un simbolo, con `programFor0_6`, che serve anche alle carte fatte a mano di prima, `portedProgram`): pure, deterministiche, i piani dei luoghi idempotenti; un caricamento migra e poi prende il seme (`prepareUniverse`); il validatore ripara i valori italiani del contratto prima ancora un contratto dopo T310, che ha cambiato i prompt (ADR-0165), e ogni lettura accetta anche i campi di prima (`internalFields`, per forma di file); ciò che legge un universo dal disco senza aprirlo lo porta in memoria (`portedFiles`).
- Prima di consegnare: `npm test` e `npm run typecheck` verdi.
- Un sottosistema nuovo o cambiato si descrive in `docs/architettura-dettagli.md`; qui una riga nell'indice (ADR-0120).
