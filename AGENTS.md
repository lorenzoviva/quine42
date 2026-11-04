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
   luminosi» al posto delle rune) viene richiesto di nuovo o ritirato.

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
   l'universo (repository git su disco, `universes/<nome>/`). Si committano solo stati validi; `R` torna
   all'ultimo valido; ripartire dal seme mette l'universo in `universes/.cestino/`. Un commit che la rete non porta resta in fila, in ordine; un rifiuto del server non si ritenta (ADR-0122).
7. **Il kernel è il pavimento**: sopravvive a NaN, nil, cicli infiniti, binding recisi. Le API del
   `Host` validano gli input e restituiscono `undefined` (mai `null`).
8. **Dal cerchio nessuno vede la corona** (ADR-0009, ADR-0124): si disegna solo per chi è fuori dal tappeto (a `circleRadius` o più dal centro) o in un interno dello studio; lo decide solo `kernel.coronaRevealed()`, che non guarda ruolo né camera. Dentro il cerchio niente anello, luci, etichette, hover né sfondo, per il giocatore, per chi è tornato, per il master e in god mode; la camera di base è la 3/4 e l'orbita libera non accende nulla.
8b. **Chi non è il master non riscrive il mondo** (ADR-0102): identità verificata sul server (`server/access.ts`), un'altra origine mai; senza account l'id detto vale solo da questa macchina; una partita di molti è del suo master e del suo mondo, gli altri leggono `publicFiles` e non scrivono; i saldi li scrive solo il mondo; `anonimo`, `offline` e `tetto` non li decide il client. Una route nuova passa da `gate`.
8c. **Un universo contiene solo percorsi ammessi** (ADR-0103): un elenco in `src/kernel/paths.ts` (`modules/ models/ world/ maps/ prompts/ universe.json seed.json`, nomi semplici), mai un divieto su `.git`; il server lancia git solo da `server/git.ts`.
8d. **I saldi stanno fuori dall'universo** (ADR-0104): saldi e pagamenti solo in `universes/.saldi/<nome>.json` (`server/ledger.ts`, `Ledger` in `credits.ts`), mai in un file dell'universo; niente Lua, Concilio, ramo o rollback ci arriva; ogni accredito è un passo atomico; a mano solo il master, entro `QUINE_TETTO_RICARICHE` al giorno. La commissione la decide solo il server (`QUINE_COMMISSIONE`, ADR-0132).
8e. **Un giocatore solo non consuma il mondo** (ADR-0107): ritmo per viandante all'arrivo di ogni messaggio (`LIMITS` in `src/session/server.ts`), ciò che può chiamare i modelli (`heavy`) ne ha uno più stretto e una coda per pagante, il testo verso il Concilio è tagliato (`words`). Un messaggio nuovo che chiama i modelli passa da lì.
8f. **Ciò che esce e ciò che il Concilio scrive sono elenchi** (ADR-0109): a un client solo i campi nominati in `src/session/files.ts` (`playerFiles`, `publicFiles`), un campo nuovo resta a casa finché non lo si nomina; `universes/` non si serve mai (`server/hidden.ts`); un commit del Concilio cambia solo `councilMayWrite` (`paths.ts`), `universe.json → ai` si muove solo dal kernel su comando del master (`setAi`, l'editor).
8g. **Ogni mondo di molti è un processo senza segreti** (ADR-0110): `server/worldHost.ts` lo avvia con il solo programma leggibile, il token del suo universo e un limite di memoria, e lo uccide se tace; Gemini e la verifica dei token passano dal canale, le rotte da `WorldCalls`. Mai permettere al mondo una cartella sopra il programma: apre anche il `.env`. `healthy` si conta da `pronto` e `stop()` aspetta i git del suo universo (ADR-0121). I programmi MarkovJunior vi girano uno per turno del ciclo (`TurnRunner` in `host.ts`), così tra due passa il battito.
8h. **In pubblico solo il server di produzione** (ADR-0112): `server/production.ts`, senza Vite, serve `dist/` e le rotte del suo elenco, senza `/api/gemini` né `/api/coda`; non parte senza verificatore, segreto del webhook, `QUINE_ORIGINI` e, con la chiave, il tetto (`productionProblems`); una route nuova si aggiunge lì, un'intestazione nuova anche. `npm run dev` non si espone.
8i. **Chi paga si dice, non si ricava** (ADR-0113): fuori da un `as`, in una partita di molti, `payerNow()` è `comune`; una richiesta di un viandante che chiama i modelli dopo un `await` passa `chi`; con gli account le spese comuni senza un collegato con crediti vanno ai modelli locali. Ciò che arriva dal filo non getta eccezioni (`handleSafely`), un numero o un testo si legge guardando il tipo.
8j. **Un socket costa solo se dice chi è, un mondo solo finché c'è qualcuno** (ADR-0114): il mondo parte dopo un `entra` con un token verificato (`admit` in `server/session.ts`) e, vuoto per 5 minuti, si salva e si ferma; universi a quota (`QUINE_UNIVERSI_PER_ACCOUNT`), rotte e socket a ritmo per indirizzo (`FRONT_RATES` in `server/production.ts`). L'indirizzo è quello del socket o, con `QUINE_PROXY_FIDATI`, ciò che i proxy dichiarati hanno visto: mai ciò che scrive il client. Una rotta nuova che legge o scrive un universo intero sta sotto `HEAVY`.
9. **La chiave API non arriva mai al browser**: la tiene solo `GeminiGate` (`server/geminiProxy.ts`, ADR-0099): modelli a elenco, corpo limitato, tetto di spesa giornaliero; la route solo da questa macchina e dalla stessa origine, in multigiocatore il server chiama Google senza route.
10. **Ciò che sembra invalicabile lo è**: il terreno blocca a caselle, i modelli con i loro voxel (ADR-0041);
    ogni luogo è connesso (varchi + sentieri scavati dal kernel, porte delle strutture sul sentiero; niente cose solide su punti di articolazione né davanti alle porte, ADR-0064).
11. **Solo testo, niente immagini generate** (ADR-0037): contenuti come dati e ogni aspetto come programma
    MarkovJunior; un programma per tipo, le istanze sono semi diversi.

## Stack

- **Vite 7 + TypeScript 5** (strict), **Vitest 4** in Node con modelli offline (`MockAiModels`), **three.js** per il mondo e per le pagine out-game, DOM per HUD e pannelli; il sito in `site/`, senza framework, con `src/theme.css` (→ `#sito`).
- **Lua 5.4 via wasmoon**, sandbox del kernel: il confine è `Crossing` (`sandbox.ts`, ADR-0101), con limiti di istruzioni, memoria, stringhe e rete (ADR-0105; → `#lua-sandbox`).
- **Google Gemini**: modelli, budget e opzioni in `universe/universe.json → ai`, prezzi in `src/kernel/ai/prices.ts`; l'Attore e i coefficienti di generazione (→ `#gemini`), la lobby (→ `#lobby`), la coda degli abbonamenti, solo in locale (→ `#abbonamenti`).
- **Persistenza**: repository git dell'universo su disco tramite il server; saldi e pagamenti fuori, in `universes/.saldi/`; senza server `localStorage` + IndexedDB (→ `#stack`).

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
npx vite-node lab/scripts/mjx-sound.ts -- suono-fuga-cellulare  # un programma sonoro: WAV, traccia e rapporto in testo, senza browser né modelli (ADR-0125)
npm run mancanze -- <universo>  # il rapporto di ciò che il Concilio non è riuscito a fare, per il kernel 1.0.0 (senza nome: tutti gli universi; ADR-0130)
npm run abbonamento  # serve la coda /api/coda con la CLI di Claude (con QUINE_CODA=1 nel .env, ADR-0077, ADR-0106)
```

`.env`: `GEMINI_API_KEY=...` (ignorato da git), per il server di produzione `QUINE_ORIGINI` (i siti per cui risponde, separati da virgole: `https://…`, `http://` solo per questa macchina), `QUINE_PORTA` o `PORT` (8080), `QUINE_HOST` (127.0.0.1 se non detto; `0.0.0.0` per uscire), `QUINE_UNIVERSI` (ADR-0112), `QUINE_MONDO_MEMORIA` (MB di heap di ogni mondo di molti, predefinito 1024, ADR-0110), `QUINE_MONDI_MASSIMI` (mondi accesi insieme, predefinito 16, ADR-0113), `QUINE_UNIVERSI_PER_ACCOUNT` (universi di cui un account è master, predefinito 3, ADR-0114), `QUINE_PROXY_FIDATI` (quanti proxy nostri stanno davanti al server, predefinito 0: si misura al deploy, ADR-0114), `GEMINI_TETTO_GIORNALIERO` (dollari al giorno per la chiave, predefinito 10; la spesa in `universes/.spesa-gemini.json`, ADR-0099), `QUINE_COMMISSIONE` (la commissione sui consumi come frazione, predefinita 0.01, 0 in beta; un valore non valido dà il predefinito, ADR-0132); `QUINE_CODA=1` accende la coda degli abbonamenti (ADR-0106); per gli account in multigiocatore `FIREBASE_PROJECT_ID` (e `FIREBASE_API_KEY`,
`FIREBASE_AUTH_DOMAIN`, `QUINE_MASTER`, `QUINE_TETTO_RICARICHE`, dollari al giorno per universo che il master può dare a mano, ADR-0104: 0 con gli account, 20 senza; con l'emulatore `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099` e un progetto `demo-…`, ADR-0082); per i pagamenti Stripe in prova `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (e `STRIPE_TAX_CODE` per i Managed Payments, ADR-0083). Senza chiave o con `?offline`: modelli locali, texture e
ostacoli procedurali. URL: `?skip` salta intro e Genesi; `?dev&teleport=46,0` porta oltre il tappeto (o `teleport=X,Y` dovunque: anche dentro una stanza, vedi `docs/architettura-dettagli.md#convalida-browser`); `?universo=<nome>` apre un altro
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
server/universeStore.ts /api/universe: ogni universo è un repository git in universes/<nome>/ (e il ramo del master, `rami/master`; il clone)
server/subscriptionQueue.ts /api/coda: la coda su disco degli abbonamenti (`universes/.coda/`), servita da un processo che usa la CLI (ADR-0077); solo su richiesta, da loopback, con un segreto (ADR-0106)
server/session.ts       /api/session (WebSocket; `npm run dev` e produzione, `attachSessions`): i client delle partite in multigiocatore (ADR-0058)
server/production.ts    il server di produzione senza Vite (ADR-0112): `createProductionServer`, `productionProblems`, `frontDoorRefusal`, `buildFile`; serve.ts è il suo avvio, buildServer.ts lo costruisce in `dist-server/`
server/account.ts       /api/account e la verifica dei token di Firebase Auth (ADR-0082)
server/stripe.ts        /api/stripe/checkout e /api/stripe/webhook per i pagamenti Stripe Checkout (ADR-0083)
server/wanderer.ts      /api/viandante: il viandante dell'account in un universo per il sito (profilo, crediti), GET e POST (T102, ADR-0095)
server/wallet.ts        /api/crediti: saldo e righe del viandante nei registri di pagamenti e consumi, per il sito (T105, ADR-0095)
server/worldHost.ts     ogni mondo di molti nel suo processo e il sorvegliante (ADR-0110): `WorldHost`, `buildWorld`, `worldFlags`, `worldEnv`
server/rates.ts         quanto spesso si può chiedere e chi chiede (ADR-0114): `Rates`, `clientAddress`, `proxyHops`
server/worldCalls.ts    ciò che le rotte chiedono al mondo acceso (ADR-0110): `WorldCalls`, `worldOf`
src/
  main.ts               bootstrap: modelli, kernel, renderer, UI, loop a 60 Hz
  master.ts             gli strumenti del master (editor, console, registro, Genesi, studio, atlante, grafo, corona), caricati con import() (ADR-0061)
  kernel/               IL PAVIMENTO — mai scrivibile da Lua
    kernel.ts           orchestratore: tick, luoghi, oggetti, contenitori, azioni (anche libere), effetti, magia, chat, Fucina, Genesi, rollback
    corona.ts           la corona come studio: edifici, interni su più piani, scaffali, gallerie
    archive.ts          le squadre del Concilio e il Referente nello studio
    society.ts          la società: individui, legami, routine, attività, ricordi
    plots.ts            trame orizzontali e missioni
    graph.ts            il grafo del mondo: nodi e archi dai file dell'universo, interrogazioni, controlli
    atlas.ts            l'atlante: regioni geolocalizzate, direzioni
    relief.ts           il rilievo: Hills di MarkovJunior → livello di ogni casella, mare, acqua piana tra i luoghi (ADR-0048)
    water.ts            l'acqua che scorre: l'automa cellulare del kernel sui luoghi caricati (ADR-0094)
    stamps.ts           timbri di strutture (castelli, torri, templi, piramidi, sotterranei…)
    universes.ts        client del repository dell'universo, aggiornamenti dal seme
    fourthwall.ts       principi del Concilio (due tavoli) e filtro della quarta parete
    mj.ts               motore di riscrittura stile MarkovJunior
    layout.ts           bozza → varchi → programma → sentieri garantiti → edifici
    content.ts          registro di oggetti, ricette, bottino, ambienti
    forms.ts            libreria dei modelli, forme (programma + seme → griglia, impronta, pavimenti, azioni); la cache delle forme del processo (`sharedForms`, ADR-0108)
    modeldirector.ts    i modelli che mancano, uno alla volta, entro `ai.maxModels`
    scoredirector.ts    i brani che mancano e quelli chiesti, uno alla volta, entro `ai.maxBrani` e il coefficiente `brani` (ADR-0127)
    chunks.ts           archivio dei piani dei luoghi
    bench.ts            il banco della Sala sistemi: i casi dei sistemi in un kernel in miniatura (ADR-0052)
    paths.ts            i percorsi che un universo può contenere (`allowedPath`), `UNIVERSE_NAME_RE` (ADR-0103), ciò che il Concilio può scrivere (`councilMayWrite`, ADR-0109)
    magic.ts            le rune nuove dal Concilio: validatore, riga del canone (ADR-0097)
    cards.ts            chi paga ogni chiamata, le carte dei contenuti, i loro utilizzi (`world/carte.json`), la collezione (ADR-0056; con `shares` anche quote e impronta)
    heritage.ts         l'eredità dei cloni: catena dei titolari, impronte, quote (ADR-0084)
    gameSetup.ts        la partita scelta alla Genesi: livelli della morte, principio per il Concilio (ADR-0053)
    coefficients.ts     i coefficienti di generazione: quanto spesso ogni agente chiama l'IA, «Low Detail», censimento, stima oraria (ADR-0085)
    wanderers.ts        i viandanti con un id (`io` in singola), il loro stato in `world/giocatori/`, legami e ricordi per id (ADR-0054)
    situation.ts, screens.ts  la Direzione: il tavolo della situazione e la parete di schermi (T46), funzioni pure
    clone.ts            il clone con un altro master: `universe.json` e le carte che passano (ADR-0068)
    chain.ts            la catena della Sala sistemi (T27a): misure di ogni sistema nel tick, stazioni
                        (bench.ts: anche il banco di prova, T27b: casi, scena, nomi dei campi)
    shortfalls.ts       le mancanze (ADR-0130): ciò che il Concilio non è riuscito a fare (`world/mancanze.json`, mai ai client), il rapporto
    credits.ts          la commissione di piattaforma (`costWithFee`, la decide il server, ADR-0132) e la divisione delle spese comuni (ADR-0081)
    ai/                 models.ts, gemini.ts, mock.ts, prices.ts (prezzi, con la data), usage.ts (registro dei consumi),
                        subscription.ts (la tabella dei provider, RoutedAiModels, QueueAiModels: i compiti lenti sugli abbonamenti, ADR-0077)
    agents/             council.ts, cartography.ts, forge.ts, genesis.ts, minds.ts, content.ts, sculptor.ts, composer.ts (il Musicista), effects.ts, mechanics.ts
    ecs.ts, sandbox.ts, prelude.lua, validator.ts, runes.ts, repo.ts, universe.ts,
    inventory.ts, bundle.ts, faults.ts, events.ts, input.ts, rng.ts, types.ts
  render/               renderer.ts (three.js: camera 3/4, luce, spazi), terrain.ts (luoghi, muri, tetti), entities.ts (entità, viandante,
                        rune, luci), models.ts (geometrie dei modelli), forms.ts + worker.ts (i programmi nei worker, e la lettura delle mesh dalla cache),
                        thumbs.ts (icone: foto dei modelli), bloom.ts (bagliore dei voxel luminosi), corona3d.ts (corona, studio, avatar), coronaview.ts (la corona nel renderer, solo del master), screens.ts (la parete della Direzione), chain.ts (la catena della Sala sistemi), bench.ts (il banco di prova), overlay.ts (testi, E, mouse),
                        materials.ts, glitch.ts
  audio/                il suono nel gioco (ADR-0126): director.ts (la scelta del brano, gli effetti), renders.ts + worker.ts (il rendering fuori dalla pagina, la cache), prepare.ts (programma → ciò che si suona), sfx.ts (l'uscita: dissolvenze, volume, muto)
  ui/                   hud.ts (anche il diario delle missioni), profile.ts (il profilo del viandante), inventory.ts, actions.ts, chat.ts, feed.ts, genesis.ts, editor.ts, console.ts, studio.ts, atlas.ts,
                        graph.ts + graphlayout.ts (il grafo del mondo nel Nucleo), dom.ts, lobby.ts (la lobby multigiocatore, minimi, tetto e carte, ADR-0086), creditdialog.ts (la modale crediti esauriti, ADR-0086)
universe/
  universe.json         nome, seme, raggio, lato del luogo (18), modelli e budget, `partita` (scelta alla Genesi, ADR-0053), `ai.minimi` (ADR-0086), `rilievo.mare` (facoltativo), `eredita` (le quote dei cloni, ADR-0084)
  world/                bible.json (memoria del Narratore), style.md (guida di stile dei modelli), canone.md (le rune), lessico.md (come parla la gente), consumi.json, mancanze.json (ciò che il Concilio non è riuscito a fare),
                        rules.json (regole), people.json (la società, con i ricordi), plots.json (trame),
                        atlas.json (geografia), stato.json (lo stato del mondo), grafo.json (il grafo del mondo, derivato),
                        giocatori/<id>.json (lo stato di ogni viandante: inventario, bisogni, stati, slot, frase),
                        carte.json (gli utilizzi delle carte e le carte dei luoghi)
  prompts/              theme.md, agents/<agente>.md
  models/               index.json + <id>.xml: i programmi MarkovJunior di ogni cosa (ADR-0041), uno per tipo
  modules/<id>/         manifest.json (+ logic.lua): sistemi, terreni, ambienti, pacchetti di oggetti, mobili, individui,
                        effetti (core.effects), fuoco (sys.fire), rune magiche e incantesimi (magic.runes, magic.spells)
tests/  docs/
src/mj/                 MarkovJunior del gioco (ADR-0036, 0038): engine.ts (motore 3D), xml.ts e model.ts (XML alla lettera), palette.ts,
                        run.ts (esecuzione, animazioni, azioni), rig.ts (arti), mesh.ts (voxel → triangoli, impronte, pavimenti),
                        sound.ts (il suono come programma: `<sound>`, griglia → partitura, ADR-0123), synth.ts (partitura + seme → campioni, l'unica fonte del suono), soundanalysis.ts (cosa suona e cosa non va, in testo, con le soglie che usa anche il validatore; ADR-0125, `lab/banco/suono.md`), classes.ts (classi e scatole), photo.ts (foto in 3/4 per l'Artista), check.ts (misure di un modello), trace.ts (la traccia in testo di un programma: per nodo volte, celle, scatola, regole; ADR-0118, `lab/banco/traccia.md`)
src/session/             il kernel sul server (ADR-0058): worldProcess.ts e worldwire.ts (il processo di un mondo e il suo canale, ADR-0110), protocol.ts (messaggi, fakeLink), files.ts (ciò che esce, a elenco: `playerFiles`, `publicFiles`, ADR-0109), server.ts (SessionServer), client.ts
                        (SessionClient: ciò che un client sa del mondo), host.ts (apre un universo e fa girare il suo mondo), account.ts e login.ts (l'account, ADR-0082);
                        il client sottile (ADR-0059): thin.ts (ThinClient: riempie il kernel specchio), socket.ts (WebSocket, id della scheda)
tools/pipeline/          la pipeline agentica (ADR-0072, 0079): pipeline.mjs (code, budget, esecuzione nei worktree, ripresa dopo i limiti, dossier),
                        orchestra.mjs (il processo dell'orchestratore: chat, eventi, epoche), web.mjs (l'interfaccia web locale, T69), config.json
tools/sicurezza/        il kit delle prove dell'autore (T137): prove.mjs (esecuzione, esito), catalogo.mjs (le prove), ambiente.mjs (i limiti: loopback, cartella temporanea, segreti finti), server.mjs, sandbox.mjs (processi a parte)
tools/glossario/        glossario.mjs: legge docs/glossario.md e riscrive il censimento dei sinonimi, docs/glossario-censimento.md (ADR-0117)
tools/mancanze/         rapporto.ts (il comando), leggi.ts (legge `world/mancanze.json` degli universi sul disco, ADR-0130)
tools/abbonamenti/      servi.ts (il processo che serve la coda degli abbonamenti con la CLI isolata, ADR-0077, ADR-0106)
lab/                    laboratorio di MarkovJunior (ADR-0038): sandbox 3D /lab/3d/, editor modelli /lab/editor/ (T59a, T59b, T59c, T59d), SoundLab /lab/suono/ (T222), modelli ufficiali e conformità, i pattern con cui crescono le strutture e tre programmi di riferimento del cantiere (lab/banco/pattern.md, lab/banco/riferimento/, T181), script per
                        affettare, fotografare, misurare e provare i programmi con Gemini; non importarlo da src/
site/                   il sito web (ADR-0095, T97): landing, carte 3D, sessioni, profilo, crediti e notizie (`site/notizie/`, un Markdown per notizia, ADR-0129); theme.css condiviso con il gioco
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
| Attore | solo se il master lo accende (`ai.attore`, ADR-0116): interpreta gli individui (`npc.reply`, `npc.dialogue`) dalle **schede** che il Narratore scrive una volta per individuo; non inventa fatti del mondo; nello studio ha il suo gerboa, il posto al tavolo accanto al Narratore e la console, e a opzione spenta resta a riposo (T158) |

Registro, Luogo, Fucina e Genesi → `docs/architettura-dettagli.md#concilio`.

## Indice architettura del gioco e sottosistemi

> I rimandi `→ #sezione` sono sezioni di [`docs/architettura-dettagli.md`](docs/architettura-dettagli.md): prima di toccare un'area leggi la sua.

- **Spazi, tappeto, rune, magia, borse**: cerchio di raggio 42 col tappeto, rune come token Lua eseguiti, canone, frase, `T` e mana → `#spazi-rune-magia`
- **Lessico**: le parole e le usanze del mondo, mai spiegate come un glossario → `#lessico`
- **Regole, effetti, stati, morte, menu, salto, contenuti**: i giudizi diventano regole, gli effetti sono un insieme chiuso → `#regole-effetti`
- **Società, vita degli NPC, personaggi**: individui, legami, routine, trame, missioni → `#societa`
- **Corona e interni dello studio**: campus, edifici, vetrine, plastico, Nucleo, Biblioteca, Direzione, Galleria, Sala del Concilio → `#corona`
- **Meccaniche, casi dei sistemi, catena, banco di prova** (Sala sistemi) → `#sala-sistemi`
- **Geografia**: biomi, ambienti, timbri, atlante → `#geografia`
- **La partita, i viandanti, le rune per ruolo**: scelte alla Genesi e fisse, `as(id, fn)` sincrono, il master → `#partita-viandanti`
- **Semi condivisi**: la simulazione non estrae mai dall'orologio → `#semi`
- **Chi paga, carte, crediti**: `chi` su ogni chiamata, `commitContent`, commissione decisa dal server (`QUINE_COMMISSIONE`), spese comuni divise → `#carte-crediti`
- **Multigiocatore**: kernel sul server, client sottile, luoghi nuovi, file del giocatore, ramo del master, god mode, doni, PvP, profilo, morte → `#multigiocatore`
- **Account Firebase e anonimi** → `#account`; **Stripe Checkout** → `#stripe`; **lobby** → `#lobby`; **coda CLI degli abbonamenti** → `#abbonamenti`
- **Clone con un altro master, eredità delle carte** → `#clone-eredita`
- **Mondo in 3D, bozze di prova, mappa, voxel luminosi**: un'unità = una casella, kernel (x, y) = three.js (x, z) → `#mondo3d`
- **MarkovJunior, modelli, cache delle forme**: ogni aspetto è un programma, un'istanza è un seme → `#markovjunior-modelli`
- **Il suono**: programmi MarkovJunior con `<sound>` in `models/suono-*.xml` (classe `suono`), griglia → partitura → campioni con una funzione pura; il browser suona quei campioni (ADR-0123); nel gioco il suono è del client, senza messaggi: il direttore sceglie il brano con una funzione pura, il rendering sta in un worker con la cache, ciò che fallisce tace (ADR-0126); il SoundLab e i ritocchi del piano roll; un agente lo legge con `lab/scripts/mjx-sound.ts` (ADR-0125); li scrive il Musicista, che abita nella casa dell'Artista perché una stanza ha un elenco di squadre (`Building.teams`, ADR-0127) → `#suono`
- **Lotti e strutture, scale, piani** → `#lotti`; **taglie di D&D** → `#taglie`; **sotterranei** → `#sotterranei`
- **Rilievo** (`Relief`, altezze, mare) → `#rilievo`; **acqua che scorre** (automa del kernel, `kernel.dig`) → `#acqua`; **grafica a cartone** → `#cartone`
- **Grafo del mondo**: nodi e archi dai file, `focus` come contesto del Narratore → `#grafo`
- **Il Concilio al lavoro**: registro, come nasce un luogo, Fucina, Genesi, le mancanze (ciò che non è riuscito a fare, ADR-0130) → `#concilio`
- **Il sito e il tema** → `#sito`; **confine e limiti di Lua** → `#lua-sandbox`; **Gemini, Attore, coefficienti** → `#gemini`
- **Convalida nel browser**: build, preview, spostarsi fermando il tappeto, `interact()` → `#convalida-browser`
- **Costi e prestazioni** → `#costi`; **stato del progetto e prossimi passi** → `#stato`; il lavoro da fare è in [`docs/plans/backlog.md`](docs/plans/backlog.md)
- **Fasi e step** (ADR-0128): le quattro fasi dello sviluppo e gli step, obiettivi condivisi tra task, in [`docs/fasi.md`](docs/fasi.md): ogni task sta in una sola riga della tabella, il numero di uno step non cambia; `pipeline.mjs step` ne copia il numero nella riga `- Step:` del backlog e priorizza uno step (T231)

### Manifest (`src/kernel/types.ts`)
`id`, `name`, `kind` (`system | entity | item | player | generator | data`), `logic`, `order`,
`appearance` (`glyph`, `color`, `aspetto`, `model`, `classe`, `taglia`), `physics`
(`solid`, `radius`, `pushable`, `mass`, `friction`, `speed`), `components`, `singleton`, `persist`,
`interaction` (`talk | read | lua`), `actions` (`id`, `label`, `requires`, `effects`), `container` (`size`, `loot`),
`ui` (pannello: `titolo`, `elementi`), `spawn`, `persona`, `unique`, `inventory` (id di oggetti), `item`, `context`, `lore`, `tags`, `drops`,
`origin`; generatori: `tiles` (`name`, `color`, `solid`, `layer`, `indoor`, `speed`, `model`, `actions`),
`roof`; dati: `items` (anche `model`, `aspetto`, `container`, `actions`, `slot`, `bonus`, effetti `mana`), `recipes`, `loot`, `layouts`, `fragments`, `runes`, `spells`.

### API Lua — l'unica disponibile, il validatore rifiuta il resto
`ecs.each/get/set/spawn/destroy/first`; `world.free/free_real/tile/speed_at/spawn/player/player_pos/
nearest/has_tag/break_entity/say/speak/set_tile/open/make_container`; `inventory.add/remove/count/equipped`; `items.find/def/bonus`; `ui.slot`;
`input.held`; `bus.emit`; `log`; `hash`; `math string table utf8 pairs pcall…` (`math.random` seminato dal kernel, ADR-0055).
Hook: `update(dt)` (sistemi), `generate_chunk`, `on_spawn(id)`, `on_interact(id, user)`,
`on_act(id, user, action)`, `on_use(user, item)`, `on_action(user, target, item)`, `on_slot(user, slot, item, panel)`, `on_ui(user, azione)`; `core.items.use(user, item)`;
`core.effects.apply(target, user, effect, x, y)`. Componenti noti: `luce {raggio, accesa, colore}`, `fuoco {raggio}`,
`effimero {fino}` (sparisce a tempo), `scudo {fino}`, `meta {x, y}` (dove va un NPC), `stati` (del viandante).
`bus.emit("morte", …)` da `sys.needs` chiude la sessione.

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
**Fable** (ADR-0115): il provider `fable` (tetto 1, dentro i 2 della CLI di Claude) solo per i task più difficili, mai orchestratore.
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

- Documentazione, UI, prompt degli agenti e testi di gioco in **italiano**; identificatori e commenti
  TypeScript in **inglese**; commenti Lua dell'universo in **italiano**.
- **Un nome per ogni concetto** (ADR-0117): [`docs/glossario.md`](docs/glossario.md) dice per ogni concetto il nome italiano, quello inglese del codice, i sinonimi da non usare e ciò che è fermo. Un identificatore italiano non è un'eccezione: si rinomina (le righe R del glossario; le eccezioni dette da ADR-0117 sono tolte). Un concetto nuovo ha una voce lì nello stesso commit. Ciò che è su disco, sul filo o visibile a Lua (campi JSON, messaggi del protocollo, API Lua, effetti) non si rinomina senza una migrazione; gli ADR non si riscrivono.
- File in LF (`.gitattributes`). Su Windows niente `Get-Content`/`Set-Content` di PowerShell 5.1 sui sorgenti.
- Nuova API per Lua: `Host` + `prelude.lua` + `LUA_API` nel validatore + prompt dell'Ingegnere + questo file.
- Nuovo compito per un agente: schema Gemini + risposta in `MockAiModels` + voce nel registro.
- Prima di consegnare: `npm test` e `npm run typecheck` verdi.
- Un sottosistema nuovo o cambiato si descrive in `docs/architettura-dettagli.md`; qui una riga nell'indice (ADR-0120).
