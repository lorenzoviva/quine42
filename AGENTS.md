# AGENTS.md — QUINE42

> **Unica fonte di verità per gli agenti** (Claude Code, Gemini CLI, chiunque altro).
> Leggi questo file e `docs/` prima di qualsiasi lavoro. Ogni decisione architetturale va
> registrata qui **e** in un ADR in `docs/adr/` (stesso commit).

## Visione in breve

QUINE42 (in precedenza Rune, ADR-0062) è un gioco 3D visto dall'alto in 3/4, fatto di voxel semplici e di contenuti ricchissimi, in cui il
mondo è generato da IA in ogni aspetto tranne il kernel, ed è fatto del proprio codice sorgente. Il giocatore
vive in un cerchio di simulazione; un **tappeto** compensa ogni suo passo e lo riporta al centro. Attorno,
ferma e **invisibile finché il tappeto lo tiene**, c'è la **corona**: il codice sorgente dell'universo,
lo studio di una software house di giochi (un edificio per cartella, interni su più piani, gallerie di
modelli e terreni) dove si vedono lavorare le squadre del Concilio. Chi ci arriva è trasceso: ne fa parte.
Un **Concilio di agenti** su Google Gemini scrive storia, ambienti, oggetti, persone e il loro codice,
e scolpisce l'aspetto di ogni cosa come programma MarkovJunior. Nel terreno brillano **rune**: token Lua
veri, una per casella. Ciò che è scritto sul tappeto **si esegue**: componendo frasi il giocatore può rompere
la simulazione, o uscirne e riscriverla. Le rune raccolte sono oggetti (nella borsa delle rune); alcune sono anche **magia**:
pronunciate (T) diventano incantesimi e si consumano. Ciò che il Concilio decide diventa **regola** del mondo.

**Due tavoli** (ADR-0025), come in Dungeons & Dragons: il Concilio (o il giocatore che fa il Dungeon
Master, nella corona) crea e fa evolvere il mondo; dentro il mondo il viandante e le persone vivono un
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
   programmi di layout (eseguiti di prova su bozze reali), oggetti, manifest, codice (compilazione, API
   esistente, caricamento di prova). L'invalido torna, con il motivo, all'agente responsabile.
   **L'IA non rompe mai il gioco**; se un modulo generato fallisce a runtime, l'Ingegnere lo ripara.
3. **Il giocatore può rompere il gioco.** Il suo input non si blocca: si isola (fault), si mostra
   (glitch), si garantisce il rollback. La riparazione automatica non tocca file modificati da lui.
4. **Stato nei componenti, logica stateless.** Hot reload = sostituzione delle funzioni.
5. **Ogni contenuto è un modulo autosufficiente** con `manifest.json`; il manifest dei moduli
   generati lo assembla il kernel (forma garantita). Gli oggetti stanno in pacchetti di dati.
6. **Due repository** (ADR-0021): il kernel (questo progetto; `universe/` è il seme, immutabile) e
   l'universo (repository git su disco, `universes/<nome>/`). Si committano solo stati validi; `R` torna
   all'ultimo valido; ripartire dal seme mette l'universo in `universes/.cestino/`.
7. **Il kernel è il pavimento**: sopravvive a NaN, nil, cicli infiniti, binding recisi. Le API del
   `Host` validano gli input e restituiscono `undefined` (mai `null`).
8. **La corona è nascosta finché il tappeto funziona** (ADR-0009).
8b. **Chi non è il master non riscrive il mondo** (ADR-0102): identità verificata sul server (`server/access.ts`), un'altra origine mai; senza account l'id detto vale solo da questa macchina; una partita di molti è del suo master e del suo mondo, gli altri leggono `publicFiles` e non scrivono; i saldi li scrive solo il mondo; `anonimo`, `offline` e `tetto` non li decide il client. Una route nuova passa da `gate`.
8c. **Un universo contiene solo percorsi ammessi** (ADR-0103): un elenco in `src/kernel/paths.ts` (`modules/ models/ world/ maps/ prompts/ universe.json seed.json`, nomi semplici), mai un divieto su `.git`; il server lancia git solo da `server/git.ts`.
8d. **I saldi stanno fuori dall'universo** (ADR-0104): saldi e pagamenti solo in `universes/.saldi/<nome>.json` (`server/ledger.ts`, `Ledger` in `credits.ts`), mai in un file dell'universo; niente Lua, Concilio, ramo o rollback ci arriva; ogni accredito è un passo atomico; a mano solo il master, entro `QUINE_TETTO_RICARICHE` al giorno.
8e. **Ciò che esce e ciò che il Concilio scrive sono elenchi** (ADR-0107): a un client solo i campi nominati in `src/session/files.ts` (`playerFiles`, `publicFiles`), un campo nuovo resta a casa finché non lo si nomina; `universes/` non si serve mai (`server/hidden.ts`); un commit del Concilio cambia solo `councilMayWrite` (`paths.ts`), `universe.json → ai` si muove solo dal kernel su comando del master (`setAi`, l'editor).
9. **La chiave API non arriva mai al browser**: la tiene solo `GeminiGate` (`server/geminiProxy.ts`, ADR-0099): modelli a elenco, corpo limitato, tetto di spesa giornaliero; la route solo da questa macchina e dalla stessa origine, in multigiocatore il server chiama Google senza route.
10. **Ciò che sembra invalicabile lo è**: il terreno blocca a caselle, i modelli con i loro voxel (ADR-0041);
    ogni luogo è connesso (varchi + sentieri scavati dal kernel, porte delle strutture sul sentiero; niente cose solide su punti di articolazione né davanti alle porte, ADR-0064).
11. **Solo testo, niente immagini generate** (ADR-0037): contenuti come dati e ogni aspetto come programma
    MarkovJunior; un programma per tipo, le istanze sono semi diversi.

## Stack

- **Vite 7 + TypeScript 5** (strict; Vitest 4, ADR-0100), **three.js** per il mondo (ADR-0040) e per le pagine out-game (ADR-0095), DOM per HUD/pannelli, uno strato 2D sopra per i testi.
- **Il sito e il tema** (ADR-0095, T97): pop art a fumetti, retro arcade, neon punk e retrowave; variabili CSS unificate in `src/theme.css` per sito e gioco; pagine Vite in `site/` senza framework pesanti; three.js fuori dal gioco (hero canvas, profilo) e carte collezionabili in CSS 3D; il segreto dei gerboa nel footer; lo stile delle pagine è quello del template `docs/design/sito/` (T109), `site/site.css` lo copia; la landing (`site/landing.ts`, T101) fa crescere nell'hero programmi MarkovJunior veri con `src/mj/`; la galleria delle carte (`site/carte.html`, `carte.ts`, T104) legge lo snapshot di `/api/universe/<nome>` con `allCards(files, true)` e `receivedBy`, la rarità è derivata dagli utilizzi (`rarityOf`), le miniature sono foto dei modelli (`photo.ts`) fatte in un worker, senza WebGL. il profilo (`site/profilo.ts`, T102) entra con `signIn`, legge e salva il viandante di un reame da `/api/viandante` (`kernel.keepProfile` o i file su disco) e mostra il modello vero in three.js; i crediti (`site/pagamenti.ts`, T105) dicono saldo, ricariche e consumi del viandante in un reame da `/api/crediti` e avviano Stripe Checkout; `site/shared.ts` è ciò che le pagine con un account hanno in comune.
- **Lua 5.4 via wasmoon** (WebAssembly), sandbox gestita dal kernel. Il confine (ADR-0101, T122): il proxy di wasmoon è spento e tutto passa da `Crossing` (`sandbox.ts`): a Lua arriva una vista dei soli campi di dati propri di un oggetto (niente prototipi, metodi, chiamate), a JS solo dati (niente funzioni Lua, cicli, nomi di `Object.prototype`; al più 64 livelli). La prova di caricamento (`Sandbox.probe`) gira in una VM a parte con un `Host` vuoto. I limiti (ADR-0105, T126): 2 milioni di istruzioni per chiamata e 12 per tick (`tickBegin`, `tickEnd`: chi viene dopo salta il tick, il guasto è `tick:budget`, `core.*` gira comunque), il lavoro delle funzioni C addebitato, i pattern costosi nel matcher scritto in Lua del prelude, memoria (64 MB), stringhe (1 MiB) e byte allocati nell'allocatore (`Meter`), 2 s di rete per chiamata; i modelli del gioco con `FORM_LIMITS`, `MAX_FORM_TIME`, `MAX_FORM_XML` (`src/mj/run.ts`).
- **Google Gemini**: `gemini-3.1-flash-lite` (testo), in
  `universe/universe.json → ai` con i budget (`maxText`, `maxForges`, `maxPacks`, `maxCast`; in multigiocatore `placesPerMinute`),
  il ragionamento (`thinking`, `low`) e il tempo massimo (`timeout`). Prezzi in `src/kernel/ai/prices.ts` (con la data).
  I **coefficienti di generazione** (`ai.coefficienti`, ADR-0085, T45b, `src/kernel/coefficients.ts`): quanto spesso ogni agente chiama l'IA,
  da 0 a 1, riparati dal validatore; diretti (`sessioni dialoghi trame revisioni modelli`: ritmi allungati) e indiretti (`persone abitanti
  pacchetti cose`: meno di ciò che causa le chiamate); il censimento delle chiamate in `CENSUS`, il preset «Low Detail» (`LOW_DETAIL`, anche
  lo Scultore su Flash-Lite), la stima di un'ora di gioco (`hourlyEstimate`); nella Genesi si scelgono con i modelli (`kernel.setAi`).
  La **lobby multigiocatore** (ADR-0086, T45d): mostra modelli, coefficienti del master, minimi (`ai.minimi`), tetto crediti che incrementa i budget (`addBudgetFromTetto`); a crediti esauriti o al tetto, tre scelte (ricarica, offline, abbandona); la collezione carte fuori dalla partita con utilizzi.
  Gli abbonamenti (ADR-0077, T68; blindati da ADR-0106): `ai.provider` (`api` predefinito, `claude`; Antigravity non può escludere gli strumenti e non sta sulla coda) e `ai.agenti` (agente → provider)
  mandano i compiti lenti (Genesi, Fucina, modelli dello Scultore, sessioni del Concilio, meccaniche) alla coda `/api/coda`, servita
  da un processo che usa la CLI dell'abbonamento di chi gioca; il resto resta sulle API. Solo in locale, mai sul server del multigiocatore. La route c'è solo con `QUINE_CODA=1` nel `.env`, da loopback, con un segreto che vive nel server; la CLI gira in una cartella vuota, con l'ambiente ridotto, senza strumenti, MCP, hook e impostazioni, il testo su stdin, e ogni esecuzione deve confermarlo dal suo `init` (`IsolationCheck` in `tools/abbonamenti/servi.ts`) o viene uccisa.
- **Vitest** in Node con modelli offline (`MockModels`): kernel, Concilio e layout testabili headless.
- Persistenza: repository git dell'universo su disco tramite il server di Vite (`server/universeStore.ts`):
  testi, `maps/` (piani dei luoghi), `world/stato.json` (lo stato del mondo), `world/giocatori/` (i viandanti), `world/consumi.json` (i consumi); saldi e pagamenti fuori dal repository, in `universes/.saldi/` (ADR-0104). Senza server:
  `localStorage` + IndexedDB.

## Comandi

```bash
npm install          # dipendenze
npm run dev          # gioco su http://localhost:5173 (proxy Gemini; hot reload anche di universe/)
npm test             # test (kernel, Concilio offline, MarkovJunior, layout, validatore, contenuti, sandbox)
npm run typecheck    # tsc --noEmit
npm run build        # typecheck + build (npx vite preview la serve, proxy incluso)
npm run test:sicurezza # solo la suite delle vulnerabilità (tests/sicurezza/, già dentro npm test; ADR-0098)
npm run sicurezza:prove # le prove dell'autore contro un server vero in un progetto usa e getta (T137, docs/sicurezza/README.md)
npm run abbonamento  # serve la coda /api/coda con la CLI di Claude (con QUINE_CODA=1 nel .env, ADR-0077, ADR-0106)
```

`.env`: `GEMINI_API_KEY=...` (ignorato da git), `GEMINI_TETTO_GIORNALIERO` (dollari al giorno per la chiave, predefinito 10; la spesa in `universes/.spesa-gemini.json`, ADR-0099); `QUINE_CODA=1` accende la coda degli abbonamenti (ADR-0106); per gli account in multigiocatore `FIREBASE_PROJECT_ID` (e `FIREBASE_API_KEY`,
`FIREBASE_AUTH_DOMAIN`, `QUINE_MASTER`, `QUINE_TETTO_RICARICHE`, dollari al giorno per universo che il master può dare a mano, ADR-0104: 0 con gli account, 20 senza; con l'emulatore `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099` e un progetto `demo-…`, ADR-0082); per i pagamenti Stripe in prova `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (e `STRIPE_TAX_CODE` per i Managed Payments, ADR-0083). Senza chiave o con `?offline`: modelli locali, texture e
ostacoli procedurali. URL: `?skip` salta intro e Genesi; `?dev&teleport=46,0` porta oltre il tappeto (o `teleport=X,Y` dovunque: anche dentro una stanza, vedi «Convalida nel browser»); in sviluppo `?universo=<nome>` apre un altro
universo di `universes/` e `?viandante=<id>` sceglie il viandante della scheda in multigiocatore (due schede, due viandanti).
Graphify (facoltativo, ADR-0045): `pip install graphifyy` in un ambiente a parte, poi `GRAPHIFY_BACKEND=none graphify update .`
(solo codice, offline, ~12 s; `graphify-out/` è ignorato da git; niente skill, MCP né hook).
In console del browser: `window.quine` (o `window.rune`) è il kernel (`.feed()`, `.models.usage`, `.content`).

## Struttura

```
server/access.ts        chi chiede e cosa può (ADR-0102): `callerOf`, `gate`, `owns`, `newUniverse`; ogni route che ascolta un client passa da qui
server/hidden.ts        ciò che il server di sviluppo non serve (ADR-0107): `universes/`, per qualunque via
server/ledger.ts        l'archivio di saldi e pagamenti fuori dall'universo (ADR-0104): `FileLedger`, `ledgerOf`, `openLedger`, la migrazione (`sweepBalances`)
server/git.ts           l'unico modo in cui il server lancia git (ADR-0103): `runGit`, senza hook né monitor, senza risalire al repository di sopra
server/geminiProxy.ts   l'unico varco della chiave (ADR-0099): GeminiGate, la route /api/gemini (solo loopback) e direct() per i mondi di molti
server/universeStore.ts /api/universe: ogni universo è un repository git in universes/<nome>/ (e il ramo del master, `rami/master`; il clone)
server/subscriptionQueue.ts /api/coda: la coda su disco degli abbonamenti (`universes/.coda/`), servita da un processo che usa la CLI (ADR-0077); solo su richiesta, da loopback, con un segreto (ADR-0106)
server/session.ts       /api/session (WebSocket, solo npm run dev): i client delle partite in multigiocatore (ADR-0058)
server/account.ts       /api/account e la verifica dei token di Firebase Auth (ADR-0082)
server/stripe.ts        /api/stripe/checkout e /api/stripe/webhook per i pagamenti Stripe Checkout (ADR-0083)
server/wanderer.ts      /api/viandante: il viandante dell'account in un reame per il sito (profilo, crediti), GET e POST (T102, ADR-0095)
server/wallet.ts        /api/crediti: saldo e righe del viandante nei registri di pagamenti e consumi, per il sito (T105, ADR-0095)
src/
  main.ts               bootstrap: modelli, kernel, renderer, UI, loop a 60 Hz
  master.ts             gli strumenti del master (editor, console, registro, Genesi, studio, atlante, grafo, corona), caricati con import() (ADR-0061)
  kernel/               IL PAVIMENTO — mai scrivibile da Lua
    kernel.ts           orchestratore: tick, luoghi, oggetti, contenitori, azioni (anche libere), effetti, magia, chat, Fucina, Genesi, rollback
    corona.ts           la corona come studio: edifici, interni su più piani, scaffali, gallerie
    archive.ts          le squadre del Concilio e il Referente nello studio
    society.ts          la società: persone, legami, routine, attività, ricordi
    plots.ts            trame orizzontali e missioni
    graph.ts            il grafo del mondo: nodi e archi dai file dell'universo, interrogazioni, controlli
    atlas.ts            l'atlante: regioni geolocalizzate, direzioni
    relief.ts           il rilievo: Hills di MarkovJunior → livello di ogni casella, mare, acqua piana tra i chunk (ADR-0048)
    water.ts            l'acqua che scorre: l'automa cellulare del kernel sui luoghi caricati (ADR-0094)
    stamps.ts           timbri di strutture (castelli, torri, templi, piramidi, sotterranei…)
    universes.ts        client del repository dell'universo, aggiornamenti dal seme
    fourthwall.ts       principi del Concilio (due tavoli) e filtro della quarta parete
    mj.ts               motore di riscrittura stile MarkovJunior
    layout.ts           bozza → varchi → programma → sentieri garantiti → edifici
    content.ts          registro di oggetti, ricette, bottino, ambienti
    forms.ts            libreria dei modelli, forme (programma + seme → griglia, impronta, pavimenti, azioni)
    modeldirector.ts    i modelli che mancano, uno alla volta, entro `ai.maxModels`
    chunks.ts           archivio dei piani dei luoghi
    bench.ts            il banco della Sala sistemi: i casi dei sistemi in un kernel in miniatura (ADR-0052)
    paths.ts            i percorsi che un universo può contenere (`allowedPath`), `UNIVERSE_NAME_RE` (ADR-0103), ciò che il Concilio può scrivere (`councilMayWrite`, ADR-0107)
    magic.ts            le rune nuove dal Concilio: validatore, riga del canone (ADR-0097)
    cards.ts            chi paga ogni chiamata, le carte dei contenuti, i loro utilizzi (`world/carte.json`), la collezione (ADR-0056; con `shares` anche quote e impronta)
    heritage.ts         l'eredità dei cloni: catena dei titolari, impronte, quote (ADR-0084)
    partita.ts          la partita scelta alla Genesi: livelli della morte, principio per il Concilio (ADR-0053)
    coefficients.ts     i coefficienti di generazione: quanto spesso ogni agente chiama l'IA, «Low Detail», censimento, stima oraria (ADR-0085)
    wanderers.ts        i viandanti con un id (`io` in singola), il loro stato in `world/giocatori/`, legami e ricordi per id (ADR-0054)
    situation.ts, screens.ts  la Direzione: il tavolo della situazione e la parete di schermi (T46), funzioni pure
    clone.ts            il clone con un altro master: `universe.json` e le carte che passano (ADR-0068)
    chain.ts            la catena della Sala sistemi (T27a): misure di ogni sistema nel tick, stazioni
                        (bench.ts: anche il banco di prova, T27b: casi, scena, nomi dei campi)
    credits.ts          la commissione di piattaforma (+1%, P#1) e la divisione delle spese comuni (ADR-0081)
    ai/                 models.ts, gemini.ts, mock.ts, prices.ts (prezzi, con la data), usage.ts (registro dei consumi),
                        subscription.ts (la tabella dei provider, RoutedModels, QueueModels: i compiti lenti sugli abbonamenti, ADR-0077)
    agents/             council.ts, cartography.ts, forge.ts, genesis.ts, minds.ts, content.ts, sculptor.ts, effects.ts, mechanics.ts
    ecs.ts, sandbox.ts, prelude.lua, validator.ts, runes.ts, repo.ts, universe.ts,
    inventory.ts, bundle.ts, faults.ts, events.ts, input.ts, rng.ts, types.ts
  render/               renderer.ts (three.js: camera 3/4, luce, spazi), terrain.ts (chunk, muri, tetti), things.ts (entità, viandante,
                        rune, luci), models.ts (geometrie dei modelli), forms.ts + worker.ts (i programmi nei worker),
                        thumbs.ts (icone: foto dei modelli), bloom.ts (bagliore dei voxel luminosi), corona3d.ts (corona, studio, avatar), coronaview.ts (la corona nel renderer, solo del master), screens.ts (la parete della Direzione), chain.ts (la catena della Sala sistemi), bench.ts (il banco di prova), overlay.ts (testi, E, mouse),
                        materials.ts, glitch.ts
  ui/                   hud.ts (anche il diario delle missioni), profile.ts (il profilo del viandante), inventory.ts, actions.ts, chat.ts, feed.ts, genesis.ts, editor.ts, console.ts, studio.ts, atlas.ts,
                        graph.ts + graphlayout.ts (il grafo del mondo nel Nucleo), dom.ts, lobby.ts (la lobby multigiocatore, minimi, tetto e carte, ADR-0086), creditdialog.ts (la modale crediti esauriti, ADR-0086)
universe/
  universe.json         nome, seme, raggio, chunk (18), modelli e budget, `partita` (scelta alla Genesi, ADR-0053), `ai.minimi` (ADR-0086), `rilievo.mare` (facoltativo), `eredita` (le quote dei cloni, ADR-0084)
  world/                bible.json (memoria del Narratore), style.md (guida di stile dei modelli), canone.md (le rune), lessico.md (come parla la gente), consumi.json,
                        rules.json (regole), people.json (la società, con i ricordi), plots.json (trame),
                        atlas.json (geografia), stato.json (lo stato del mondo), grafo.json (il grafo del mondo, derivato),
                        giocatori/<id>.json (lo stato di ogni viandante: inventario, bisogni, stati, slot, frase),
                        carte.json (gli utilizzi delle carte e le carte dei luoghi)
  prompts/              theme.md, agents/<agente>.md
  models/               index.json + <id>.xml: i programmi MarkovJunior di ogni cosa (ADR-0041), uno per tipo
  modules/<id>/         manifest.json (+ logic.lua): sistemi, terreni, ambienti, pacchetti di oggetti, mobili, persone,
                        effetti (core.effects), fuoco (sys.fire), rune magiche e incantesimi (magic.runes, magic.spells)
tests/  docs/
src/mj/                 MarkovJunior del gioco (ADR-0036, 0038): engine.ts (motore 3D), xml.ts e model.ts (XML alla lettera), palette.ts,
                        run.ts (esecuzione, animazioni, azioni), rig.ts (arti), mesh.ts (voxel → triangoli, impronte, pavimenti),
                        classes.ts (classi e scatole), photo.ts (foto in 3/4 per l'Artista), check.ts (misure di un modello)
src/session/             il kernel sul server (ADR-0058): protocol.ts (messaggi, fakeLink), files.ts (ciò che esce, a elenco: `playerFiles`, `publicFiles`, ADR-0107), server.ts (SessionServer), client.ts
                        (SessionClient: ciò che un client sa del mondo), host.ts (apre un universo e fa girare il suo mondo), account.ts e login.ts (l'account, ADR-0082);
                        il client sottile (ADR-0059): thin.ts (ThinClient: riempie il kernel specchio), socket.ts (WebSocket, id della scheda)
tools/pipeline/          la pipeline agentica (ADR-0072, 0079): pipeline.mjs (code, budget, esecuzione nei worktree, ripresa dopo i limiti, dossier),
                        orchestra.mjs (il processo dell'orchestratore: chat, eventi, epoche), web.mjs (l'interfaccia web locale, T69), config.json
tools/sicurezza/        il kit delle prove dell'autore (T137): prove.mjs (esecuzione, esito), catalogo.mjs (le prove), ambiente.mjs (i limiti: loopback, cartella temporanea, segreti finti), server.mjs, sandbox.mjs (processi a parte)
tools/abbonamenti/      servi.ts (il processo che serve la coda degli abbonamenti con la CLI isolata, ADR-0077, ADR-0106)
lab/                    laboratorio di MarkovJunior (ADR-0038): sandbox 3D /lab/3d/, editor modelli /lab/editor/ (T59a, T59b, T59c, T59d), modelli ufficiali e conformità, script per
                        affettare, fotografare, misurare e provare i programmi con Gemini; non importarlo da src/
site/                   il sito web (ADR-0095, T97): landing, carte 3D, sessioni, profilo e crediti; theme.css condiviso con il gioco
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

Registro: `kernel.feed()`, pannello Concilio (`G`) e console. Nella corona ogni agente è una squadra: un
membro per edificio, che va allo scaffale del file che cambia; si vedono parlare solo quelli che
interagiscono nel registro; con `E` ci si parla. Il Cartografo crea ambienti e li colloca sull'atlante.
Il Narratore intreccia trame tra le persone e scrive i loro dialoghi.

**Luogo** (18×18): bozza Lua continua (`g p t w r`) → piano del Cartografo (ambiente, cose `dentro`/
`fuori`/`ovunque`, oggetti `a_terra`, rune, `strutture`) → layout (varchi deterministici, programma con bordo
congelato, sentieri garantiti, edifici) → lotti: ogni edificio diventa una struttura, un modello intero girato
verso la porta (ADR-0043) → cose su celle raggiungibili (quelle `dentro` sul pavimento del modello; niente cose solide su punti di articolazione né davanti alle porte, ADR-0064), bottino
`terreno`, rune su tratti liberi. Il chunk (0,0) ha sempre `x`, `speed = speed` e la runa magica `luce`.

**Fucina**: concetto (tipo, contesto, aspetto, comandi, azioni, contenitore, cose portate, persona,
unicità) → fisica → codice → Arbitro → validatore → commit → bibbia; il modello (`appearance.model` suo, con la `classe`) lo scrive poi lo Scultore; gli oggetti dei pacchetti
hanno una forma comune (`forma-…`, un programma per forma, ricolorato), i terreni con cose sopra un modello loro. **Genesi**: bibbia → stile → terreni (Fisico) → Arbitro → ambienti (provati) →
pacchetto di oggetti → cast (5 npc diversi, 5 oggetti/mobili, 2 strumenti) → commit.

## Architettura del gioco

- **Spazi, tappeto, corona** (ADR-0004, 0009, 0063): cerchio di simulazione di raggio 42 fermo in (0,0) (42 passi per uscire fermando il tappeto), tappeto con offset; `coronaRevealed()`.
- **Rune** (ADR-0002, 0015): un token per runa, una casella per runa (una lastra luminosa a terra), righe orizzontali eseguite ogni
  tick; binding `x y speed carpet time`. Rare; quelle del tappeto solo a ≥ 3 chunk dall'origine. Il **canone delle rune**
  (`world/canone.md`: aspetto, dove stanno, restano finché qualcuno non le raccoglie, magia, ciò che nessuno sa), con le rune
  magiche e gli incantesimi dell'universo, va con ogni compito del Narratore e dell'Arbitro (`canonSummary`): nessuna storia
  dà alle rune comportamenti che lì non ci sono.
- **Il lessico** (ADR-0075, T65): `world/lessico.md` (seme, uguale in ogni universo e ambientazione): poche parole sostituite
  (`bonombo` il saluto, `macico`, `lerpio`, `pagosso`, `Ciok Ciok`), saluti, buone maniere, usanze, modi di dire. Va con ogni compito del
  Narratore e dell'Arbitro (`lexiconSummary`, con le al più 3 `usanze` che la bibbia aggiunge, `cleanBible`); nessun testo del mondo lo
  spiega come un glossario (`glossaryBreak` in `fourthwall.ts`, dentro `metaBreak(text, wordsOf(files))`).
- **Magia** (ADR-0015, 0018): rune magiche `luce fuoco acqua terra vita scudo vento`; ogni runa è un oggetto
  `rune:<token>`; la **frase** (`hand.tokens`) è la selezione ordinata; `T` pronuncia le magiche della frase e
  le consuma; incantesimi noti in `spells`, nuovi nominati una volta dal Narratore; costano **mana**
  (`needs.mana`); da 3 rune consumano un **cristallo magico** (tabella di bottino `magia`). Una sequenza è un
  programma (T57a): la chiave è la sequenza nell'ordine (`terra fuoco` ≠ `fuoco terra`), ripetere una runa la rafforza;
  come si compone lo dicono il canone, `SPELL_GUIDE` (`agents/effects.ts`, con le permutazioni già note) e i prompt di
  Narratore, Fisico e Arbitro, con esempi da D&D e terraformazione (effetto `rilievo`, T57c); gli effetti restano l'insieme chiuso del kernel.
  Le **rune nuove** (ADR-0097, T57b): il Narratore ne inventa una (`rune.invent`: token, nome, glifo, colore, elemento, riga del canone)
  quando una sessione del Concilio lo decide (intervento `runa`) o una formula la chiede (`runa_nuova` di `nameSpell`); `validateNewRune`
  (`src/kernel/magic.ts`) rifiuta token non parola, già usati, riservati o simili, nomi simili, quarta parete, oltre `MAX_MAGIC_RUNES` (16),
  e ripara glifo (non `FUTHARK`, non usato) e colore; `kernel.inventRune` la mette in `magic.runes` (e nel bottino `magia`), nel canone
  («Le rune trovate dopo») e nelle carte (`runa:<token>`); poi sta nel mondo come le altre.
- **Borse** (ADR-0018): `ItemDef.container {size, accepts}`; lo slot ha `inv`; la borsa delle rune accetta `runa`.
- **Regole** (ADR-0019): ogni giudizio in `world/rules.json`, mostrato al Concilio; le azioni possibili si
  imparano (modulo o `ItemDef.actions`); «Altro…» anche nell'inventario e nel crafting (ricette in
  `items.scoperte`); sessioni del Concilio ogni 12 luoghi.
- **Società** (ADR-0020): `world/people.json`; individui con specie (`persona | animale`, dal tipo) e genere,
  mestiere, famiglia, routine (mattina/giorno/sera/notte → casa/lavoro/piazza/in giro, componente `meta` seguito
  da `sys.wander`). Un legame dice cosa è la persona per l'altro, nel suo genere; il validatore della società
  (`repairSociety` in `society.ts`) lo rende possibile per le due specie e simmetrico, un padrone per animale,
  nomi non simili (rinomina anche nelle trame); ripara a ogni aggiunta e all'avvio (`reviewSociety`).
- **Effetti** (ADR-0014, 0096): insieme chiuso (`messaggio bisogni crea_oggetto consuma distruggi apri contenitore
  terreno rilievo fuoco luce scudo spingi evoca legame ricordo nascita stato togli_stato`), validati dal kernel;
  applicati da `core.effects` (Lua) e, per `rilievo {delta, raggio}`, dal kernel (`kernel.dig`, ADR-0094: persistente
  in `scavi`, sveglia l'acqua che scorre). Usati da azioni libere («Altro…»), azioni imparate (`actions[].effects`)
  e incantesimi. Terreno e rilievo cambiati persistenti.
  Ciò che cambia l'**aspetto** di una cosa con una forma sua non è un effetto (ADR-0044): il Narratore lo dice in
  `forma`, lo Scultore scrive un'`<action>` sul programma del tipo (`sculptAction`), il kernel la prova sul modello
  (`checkAction`: finisce, cambia qualcosa, non lo svuota) e la mette nella libreria; gli effetti restano per il resto.
- **Giorno e notte** (ADR-0015): `daylight()`, giornata di 10 minuti; luce dai componenti `luce`.
- **Corona** (ADR-0009, 0016, 0022): studio; edifici per cartella con porte che teletrasportano in interni
  più grandi (stanze 24×15 su più piani, zona `studio`), scaffali di file, Galleria dell'Artista (i modelli,
  «riscolpisci»), Ufficio dei luoghi che è anche lo studio del Cartografo (ADR-0051: i terreni nel campionario, da un piano
  loro dopo i file, e dopo di loro un riquadro per ambiente, il suo programma provato su una bozza in miniatura, T26d, `layoutSample`; l'atlante contro la parete di fondo; il posto del Cartografo al tavolo porta lì), bacheche con le modifiche recenti (che brillano).
  Fuori, il campus è un anello profondo 36 caselle oltre il cerchio (`CAMPUS` in `corona.ts`): il viale con la linea al
  neon, le porte, un blocco di 16 × ~20 caselle per edificio (lo spazio di un modello), vicoli tra i settori, prati,
  il bordo luminoso; sopra ogni porta un'insegna al neon con il nome. Lungo il campus arredi futuristici (`CampusProp` in `corona.ts`, T50: lampioni
  neon lungo il viale, alberi di luce sui prati, panchine e totem olografici nei vicoli, porte e viali sempre liberi) e logistica operosa
  animata (droni volanti tra gli edifici e trenini magnetici di file sul binario ad anello, `corona3d.ts`). Negli interni e nella Direzione
  gli avatar del Concilio sono gerboa giganti pacioccosi (`corona-gerboa-<agente>.xml`, T50), ciascuno con cappello distintivo per ruolo.
  Un edificio con un programma suo (`models/corona-<id>.xml`, 8 voxel per casella, ADR-0049) è quel modello: davanti al viale, la porta
  sulla lettera `porta`, collisione dai voxel (`placeStructure`, `kernel.placeCampus`); senza, il blocco. Davanti alla Galleria dell'Artista, sulla lettera `plinto` (T48b), il kernel posa un'istanza di un modello della libreria scelto a ogni visita della corona (seme dal tick d'arrivo), ridotto a stare sul plinto, senza collisione nuova oltre al plinto. Dentro, le **vetrine** (T21, `SHOWCASES` in
  `corona.ts`): uno schermo (Torre della Magia: ogni runa magica e ogni combinazione nota, nei loro colori; il pannello dice l'effetto in parole, `describeEffect` in `validator.ts`), un silos (Studio dei personaggi: ogni tipo e dopo di lui i suoi individui, ciascuno col seme che ha nel mondo, che fluttuano in un liquido viscoso; il pannello dice l'individuo e il modulo), una stampante
  3 × 3 (T24, `PRINTER`: Laboratorio delle cose, Magazzino degli oggetti; la cosa sulla casella centrale, ridotta a una casella se è
  più grande), un plastico (T26a, Ufficio dei luoghi: un luogo già pianificato in miniatura, `kernel.miniature(cx, cy)` con lo stesso
  codice del mondo, `layoutOf` / `lotsOf` / `placementsOf`, dal chunk o dal piano salvato, senza generare nulla; T26b: le sei fasi del Cartografo,
  `PLACE_PHASES` e `PlaceMiniature.phases` con le griglie intermedie di `layout()` (`stages`) e ciò che ogni fase aggiunge acceso in
  verde, scorse dalle pedane «−» «+» davanti al tavolo, `stepPhase`) con «<» «>» ai lati; E o un clic (`kernel.clickStudio`) cambiano ciò
  che mostrano (`showcaseOf`, `stepShowcase`) o aprono il pannello (`ui:showcase`: modello, modulo, individui).
  Ogni dispositivo (vetrina, grafo, tavolo della situazione) sta al centro del piano terra, sulla colonna dell'uscita, con
  `DEVICE_MARGIN` (3) caselle libere attorno, frecce e pedane comprese (T49b); lì gli scaffali sono corti, ai due lati
  (`DEVICE_SLOTS`, 24 posti), e i file che non ci stanno salgono ai piani sopra.
  Nel **Nucleo** (T28, `GRAPH_AT`) il grafo del mondo gira come ologramma su un piedistallo; E o un clic aprono `ui:graph`
  (`src/ui/graph.ts`): tutti i nodi di `kernel.graph()` disposti a forze (`graphlayout.ts`, deterministico, senza DOM),
  colori e nomi in `NODE_COLOR`/`NODE_NAME`/`EDGE_NAME` di `graph.ts`, ciò che `check()` trova cerchiato di rosso; ricerca,
  tipi da nascondere, il nodo scelto con i suoi archi (cliccabili), il vicinato a due passi, «Apri il file». Guardare non cambia nulla.
  Nella **Biblioteca del Mondo** (T47a, `LEGGIO_AT`) su una vasca d'acqua scura con bordo al neon il leggio con un libro aperto olografico:
  «<» «>» ai lati sfogliano la bibbia (`world/bible.json`, `biblePages` in `src/kernel/bible.ts`: prologo, luoghi, personaggi, fatti, misteri, una voce per pagina;
  i bordi fermano senza ripartire); E o un clic aprono `ui:bible` nel pannello dello studio con la pagina e i nodi del grafo che la toccano (`touchingNodes`),
  cliccabili per aprire il grafo nel Nucleo. Contro la parete di fondo le **tavole delle regole** (T47b, `TABLETS_WALL`, `world/rules.json`: fino a 16 lastre, «<» «>» se di più; le ultime 12 brillano), E o clic aprono il giudizio nel pannello (`ui:rule`).
  Nella **Direzione** (T46a, `SITUATION_AT`, 5 × 3) il tavolo della situazione: `kernel.situation()` (`src/kernel/situation.ts`, dai dati
  che ci sono) dà le operazioni in corso, ciascuna sul suo chunk e la sua regione: il viandante, i giocatori collegati (T42c), i luoghi in coda o in generazione
  (pulsano), le trame aperte alla tappa a cui sono (dove sta chi la fa: entità, `origine`, `luogo`), le missioni accettate, i
  guasti (`Fault.at`: dove era il viandante quando è nato un guasto di codice che gira nel mondo; quelli di caricamento e dei
  manifest non hanno luogo); E o un clic → `ui:situation` (pannello in `studio.ts`, colori in `OPERATION_COLOR`).
  Contro la parete di fondo la **parete di schermi** (T46b, `WALL_AT`, voci `parete`): `kernel.screens()` (`src/kernel/screens.ts`)
  dà la **linea del tempo** (`repo.log()` come pellicola di `FILM` fotogrammi; «<» «>» sotto di lei, `stepTimeline`, si fermano ai
  bordi e spostano solo la pellicola: guardare non torna indietro, `R` resta l'unico modo; il fotogramma dice i file cambiati e chi
  l'ha voluto, `whoWanted`), il **registro dal vivo** (una console per agente: ultima riga, compito, modello da `usage.lastCall`,
  al lavoro se attivo negli ultimi `WORKING_S` secondi) e il **quadro dei costi** (sessione, oggi, in tutto come il pannello del
  Concilio; per agente da `usage.sessionByAgent`, per compito; i budget di `universe.json → ai` come fondo scala). Gli schermi
  sono texture su canvas inclinate verso la camera (`src/render/screens.ts`), ridisegnate solo quando cambia ciò che mostrano;
  E o un clic → `ui:screens` (pannello in `studio.ts`, segue la pellicola con `studio:screens`).
  Sotto il soffitto la **fascia d'allerta** (T46c, `alertOf` in `screens.ts`, `Screens.allerta`): rossa per guasti aperti o un budget
  esaurito, ambra per rifiuti del validatore nell'ultima ora o un budget oltre l'80 %, verde altrimenti; i motivi nel pannello. Davanti alla
  parete le **console** (`CONSOLES_AT`, voci `console`), una per agente: chi lavora nel registro siede alla sua (`Archive.consoles`,
  `kernel.working()`); E sulla console apre il registro.
- **Geografia** (ADR-0023): biomi nel generatore (`s j o k n`), 20 ambienti nel seme, nodo `stamp` di
  MarkovJunior, atlante di regioni (`world/atlas.json`), direzioni note a NPC e Cartografo.
- **Stati e meccaniche** (ADR-0026): effetti `stato`/`togli_stato` (velocità, peso, luce, durata) per ciò che
  si usa (cavallo, barca, zaino); componente `stati` del viandante.
- **Morte e trascendenza** (ADR-0026): a salute zero la sessione finisce (continua nello stesso universo o
  ricomincia dal seme); dopo la corona non si muore e non si perde nulla.
- **La partita** (ADR-0053, T33): `universe.json → partita` (`modalita`, `morte` 0-4, `pvp`, `altroTraGiocatori`; predefiniti:
  singola, 3, no, sì) si sceglie nella schermata della Genesi di un universo mai generato e poi non cambia: `repairPartita` (validatore)
  la ripara, `keepGame` riscrive un `universe.json` che dice altro. Va come principio (`gameSummary`) a Narratore, Arbitro, Ingegnere
  e Referente. Alla morte il Narratore (`player.death`) traduce il livello (`DEATH_LEVELS`) in cosa si perde (`perde_tutto` o effetti
  che tolgono) e dove si riparte (`qui | piazza`); `continueAfterDeath` è asincrona; senza risposta vale `fallbackDeath`.
- **I viandanti** (ADR-0054, T34): ogni viandante ha un id stabile (`io` in singola, `src/kernel/wanderers.ts`) e il suo stato
  in `world/giocatori/<id>.json` (da uno `stato.json` vecchio per `io`); `world/stato.json` è lo stato del mondo. Il kernel ha un
  registro (`wanderers()`, `addWanderer`); ciò che agisce su «il giocatore» agisce sul viandante che agisce (`wanderer()`), e
  `as(id, fn)`, sincrono (mai attraverso un `await`), fa agire un altro. Legami e ricordi portano `viandante: <id>` (`readPeople`
  migra «Viandante» e `legameViandante` a `io`; `bondWith`, `bondOf`, `memoriesFor`: una persona non racconta a un viandante ciò che ha
  vissuto con un altro), le missioni `Quest.viandante`; `talk(id, testo, viandante?)` dà al Narratore il nome di chi parla; nel grafo
  `persona:viandante` è `io`, `persona:viandante-<id>` gli altri.
- **Semi condivisi** (ADR-0055, T35): ogni estrazione della simulazione viene da (seme dell'universo, tick, chi, entità), mai
  dall'orologio. Prima di ogni chiamata nel Lua dell'universo (`runModule`, righe delle rune) il kernel semina `math.random`
  (`seedLua` → `Sandbox.seed`); `math.randomseed()` senza argomenti vale 0; il kernel tira da `rngFor(...sale)`, i nomi unici dal tempo
  del mondo (`worldStamp`). L'orologio solo fuori dalla simulazione (registro, consumi, commit, guasti, misure, schermi).
  Due kernel con lo stesso universo e lo stesso input arrivano allo stesso stato (`tests/determinism.test.ts`).
- **Chi paga e le carte** (ADR-0056, T36): ogni chiamata ha un `chi` (un viandante o `comune`): lo mette il Concilio con la
  politica di `payerOf` (`src/kernel/cards.ts`: comuni Genesi, sessioni, trame, revisioni, dialoghi tra persone, modelli che mancano,
  pacchetti; il resto è del viandante che agisce), un `chi` esplicito vince; `world/consumi.json → paganti`. Ogni contenuto generato
  porta `carta {autore, pagante, titolare}` (moduli, oggetti, ambienti, incantesimi, ricette, modelli, persone, trame, regole giudicate,
  piani dei luoghi): i punti che creano contenuti committano con `commitContent`, che timbra ciò che il cambio porta (`stampFiles`); il
  titolare delle comuni è un viandante estratto col seme (`titolareOf`). Gli utilizzi (`luoghi trame prompt`) e le carte dei luoghi in
  `world/carte.json` (`CardLedger`, scritto prima di ogni commit); la collezione: `kernel.cardsOf(id)`, `collectionOf`.
- **Crediti e spese comuni** (ADR-0081, T45a, ADR-0104, T125): saldo crediti per viandante nel `Ledger` del kernel (`kernel.ledger`; sul server `universes/.saldi/<nome>.json`, fuori dalla storia; `kernel.creditsOf`, `deductCredits`); ricaricato a mano solo dal master, dalla console (`grantCredits`, messaggio `ricarica`), entro il tetto al giorno per universo (`QUINE_TETTO_RICARICHE`); il Referente non dà crediti. Ogni chiamata scala dal pagante (`payerOf`) costo modello + 1% piattaforma (`PLATFORM_FEE = 0.01`, `costWithFee`); le spese comuni (`comune`) sono divise in parti uguali tra tutti i giocatori collegati in quel momento (`splitCost`), master compreso, escludendo gli anonimi. A crediti esauriti (`crediti <= 0`) o per viandanti anonimi (`anonimo: true`, 0 crediti non ricaricabili): le richieste personali sono risposte dai modelli locali (`MockModels`) e il giocatore lo sa (`stato.crediti` nell'aggiornamento, avviso nel feed).
- **Rune per ruolo** (ADR-0057, T37): `partita.master` è chi ha creato l'universo multigiocatore (`io` per ora); in singola chi gioca
  è il master di tutto (`isMaster()`) e nulla cambia. In multigiocatore nessuna riga del tappeto (`carpetLine` in `runes.ts`: token del
  tappeto, la runa `concilio`, un binding scritto) nei luoghi; ogni riga gira come chi l'ha incisa (`RuneComp.by`, `as`) e, se non è il
  master (o è generata), le scritture dei binding non arrivano (`K.run_line(key, lock)`, il `Host` dà copie di tappeto e posizioni).
  Il master porta sempre la runa `concilio` (`COUNCIL_RUNE`, `councilStock`): pronunciata o incisa lo porta nella Sala del Concilio
  senza consumarsi, e `core.carpet` non lo tiene (`offCarpet`) finché non rientra nel cerchio. `R`: il rollback del repository è del
  master (ogni runa incisa torna a chi l'ha scritta); un giocatore riprende solo le sue rune (`takeBackRunes`).
- **Il kernel sul server** (ADR-0058, T38): ogni viandante ha il suo tappeto (`as` scambia anche lo scorrimento, `holdCarpet`);
  `core.movement` e `core.carpet` (`PER_WANDERER`) girano una volta per viandante mosso dal kernel e vedono solo lui; la tastiera
  muove `inputFor` (`io`); chunk, ritmo, frase e stati di ogni viandante. Un viandante di un client (`setRemote`) non lo muove il
  kernel: il client manda dove è nel mondo e `stepWanderer` lo porta lì al più per il ritmo (`paceOf`), con la collisione del
  cammino. `src/session/`: protocollo JSON (`entra passo frase incidi pronuncia azione altro chat oggetto contenitore fabbrica pannello
  casella dici dai` → `ingresso aggiorna correzione esito rifiuto`), `SessionServer` (messaggi a ogni tick, aggiornamenti a 10 Hz di ciò che è cambiato vicino, credito di passo di
  mezzo secondo, azioni a 3 caselle, chi esce è salvato e lascia il mondo), `fakeLink` nei test. Nel server di Vite il WebSocket
  `/api/session?universo=<nome>` (`server/session.ts`, pacchetto `ws`) avvia al primo client il mondo dell'universo
  (`host.ts` con `ssrLoadModule`), solo se è in multigiocatore. In singola nulla cambia.
- **Il client sottile** (ADR-0059, T39): se l'universo è in multigiocatore `main.ts` entra nella sessione (`socket.ts`, il
  viandante della scheda: `?viandante=<id>` o uno per scheda) e avvia un **kernel specchio** (`KernelOptions.mirror`: niente
  generazione, salvataggi né Concilio; `mirrorTick` muove solo il suo viandante) che `ThinClient` (`thin.ts`) riempie: luoghi →
  chunk (con i lotti), cose → entità con `THING_PARTS`, altri viandanti → entità `remote` interpolate (`FOLLOW`), con arti e
  fumetti. Il passo è predetto e mandato ogni 50 ms, la `correzione` lo rimette a posto, oltre 8 caselle il client segue il server
  (`FAR` sul server). Le azioni (`interact perform freeAction talk inscribeHand dropSelected castSpell action`) vanno al server
  con esito ottimistico (la cosa raccolta sparisce, la porta si apre, la frase incisa lascia la mano), annullato se rifiutato o
  se il prossimo aggiornamento dice altro. Ciò che si porta (T39b): tasche, borse, contenitori (il contenuto arriva nell'`esito`),
  fabbricazione, pannelli delle meccaniche, azioni e «Altro…» sulle caselle vanno al server, che li fa con `as`; gli spostamenti di
  slot si vedono subito e, finché sono in viaggio, l'inventario del server non li sovrascrive (`pending`). Ogni
  viandante oltre `io` è un seme suo del `viandante` col mantello del suo colore (`wandererColor`, `tinta: N`).
- **Luoghi nuovi con il lock** (ADR-0060, T40): il chunk ricorda chi lo ha voluto vedere per primo (`Chunk.chi`); se il piano non è
  in `maps/` lo paga lui (la chiamata del Cartografo, la carta del luogo, la Fucina di ciò che il piano chiede). Le bozze si pianificano
  vicino a qualunque viandante fuori dallo studio (il master nello studio o scollegato non ferma gli altri); in multigiocatore al più
  `ai.placesPerMinute` (20) luoghi nuovi per minuto del mondo, gli altri restano bozze (`Chunk.held`). Il Concilio gira solo sul server.
- **Il client del giocatore** (ADR-0061, T41): a un giocatore il server manda solo i file che il client disegna (`playerFiles` in
  `files.ts`, a elenco di campi, ADR-0107: `universe.json` senza `ai`, `models/`, rilievo, atlante, manifest senza storie né `logic` tranne `PER_WANDERER`); prompt, bibbia,
  persone, trame, regole, grafo, carte, consumi e viandanti restano sul server. L'`ingresso` dice `master`; il registro del Concilio
  (`concilio`) va solo al master, e `ThinClient` lo versa nello specchio. Corona e strumenti del master (`src/master.ts`: editor,
  console, registro, Genesi, pannelli dello studio, atlante, grafo; `src/render/coronaview.ts`: ciò che il renderer disegna della
  corona) si caricano con `import()` solo dal master (in singola sempre); `window.rune` (e `window.quine`) del giocatore è il `ThinClient`.
- **Chi può scrivere** (ADR-0102, T120): il modello di minaccia e le regole sono nell'ADR. `/api/universe`: `X-Quine-Viandante` su un server senza account, `Authorization: Bearer` con gli account, `X-Quine-Interno` (un segreto del processo) per il mondo di `host.ts`; `GET …/carte` dà le carte misurate sul server e i `publicFiles`. La lobby legge il saldo da `/api/viandante`. `POST …/clone` lo fa solo il master, e nomina il nuovo.
- **Il ramo del master** (ADR-0066, T42b): in multigiocatore i salvataggi validi dell'editor del master sono commit del suo specchio,
  e ciò che l'ultimo ha di diverso dai file del mondo è il suo **ramo**: va intero al server a ogni commit (`ramo`, con l'hash della
  versione del mondo di ogni file), che lo tiene da parte, lo rimanda nell'`ingresso` del master e lo scrive su disco
  (`refs/heads/rami/master`, senza toccare la cartella di lavoro; `writeBranch`/`readBranch`/`mergeBranch` in `universeStore.ts`).
  I giocatori non lo vedono finché il master non **pubblica** («Pubblica (n)» nell'editor o nei commit della console, `kernel.publisher`):
  `kernel.publish` valida, applica e committa sul principale (se il mondo si rompe, torna com'era); sui file cambiati anche dal mondo
  vince il master e il registro lo dice; su disco il ramo si fonde (`merge -s ours`) e sparisce. Il Concilio committa sul principale.
  I file del mondo che cambiano arrivano a ogni client a 10 Hz (`file`; ai giocatori `playerChanges`) e lo specchio li committa, tranne
  quelli del ramo del master. `R` del master riporta il ramo all'ultimo valido (o a un commit dello specchio); il mondo resta com'è.
  Il master prova da solo ciò che il suo client disegna (modelli, aspetto, terreni, corona, cammino): la logica del mondo gira sul server.
  Il Concilio sul ramo (ADR-0069, T42e): ciò che il master chiede al Referente e alle squadre nella corona (`talkToAgent` dello specchio →
  `agente`) gira sul server, una richiesta alla volta, in un kernel del ramo (`kernel.branchKernel`: file del mondo più il ramo, stessi modelli,
  il master che agisce e paga); ciò che vi si committa entra nel ramo e arriva al master (`ramo`), da pubblicare come l'editor.
  Le rune chieste al Referente (ADR-0070, T42f): l'incarico `runa` (`askedRunes` in `runes.ts`: ogni token che una runa può portare,
  al più 12, mai `concilio`) dà al master le rune nel mondo (`as(master, grantRunes)`), non sul ramo; in singola il Referente non dà rune.
- **Parole e doni tra viandanti** (ADR-0071, T43a): nel menu di un altro viandante (`kernel.otherWanderer`: il registro o l'entità `remote`
  dello specchio) «Parla» e «Dai <cosa>» per ogni tasca della barra rapida (`dai:<tasca>`). `dici {viandante, testo}` → `sayTo`: il fumetto
  di chi parla, a chi è entro `HEAR` (8) caselle, senza filtro della quarta parete; `dai {viandante, slot, quanti}` → `giveTo`: entro `GIVE_REACH`
  (3) caselle, dove andrebbe raccogliendolo, una borsa intera in una tasca vuota, la frase dimentica le rune date. Chi riceve lo sa
  (`wanderer:said`/`wanderer:gave` → `avvisi` nell'`aggiorna`; la chat aperta con chi parla, `ui:heard`). Uno scambio sono due doni.
- **«Altro…» e PvP tra viandanti** (ADR-0073, T43b): «Altro…» su un altro viandante solo se `partita.altroTraGiocatori` (`freeOnWanderer`,
  messaggio `altro {viandante, testo}`, entro `GIVE_REACH`), giudicato come su una persona (`ActionContext.between`); il server applica gli effetti
  sul suo corpo (`touchWanderer`: bisogni, scudo, stati come lui; `spingi` sul suo tappeto, `wanderer:pushed` azzera il suo credito di passo); ciò che
  ferisce (`unharmed`: bisogni che scendono, `spingi`, `fuoco`, `togli_stato`, stati che rallentano) solo con `partita.pvp`; sul master solo `messaggio`.
  Chi lo subisce lo sa (`wanderer:acted` → avviso `altro`).
- **Il profilo del viandante** (ADR-0074, T44a): `Profile {nome, seme, tinta, presentazione}` in `world/giocatori/<id>.json`; `repairProfile`
  (`wanderers.ts`) lo ripara (nome di 2-24 caratteri e non simile a persone o viandanti, altrimenti `freshName`; seme tra quelli della classe;
  mantello né scuro né chiaro né grigio; 4 righe) e `kernel.setProfile` lo fa nome e aspetto (`dressWanderer`). `entra {profilo}` e `profilo`
  nel protocollo, l'`ingresso`/`esito` dicono il profilo riparato e `riparato`; agli altri con `OtherView` (+ `presentazione`, «Chi è» nel
  menu). Il Narratore riceve la presentazione come affermazione del viandante. Il client lo tiene in `localStorage` sotto `rune:profilo:<universo>:<id>` (T44c); un profilo già salvato sul server non lo
  sostituisce quello che il client porta entrando, solo il messaggio `profilo`. `P` apre il pannello
  (`src/ui/profile.ts`, una foto del modello per seme).
- **L'account** (ADR-0082, T44b): in multigiocatore, se il server ha `FIREBASE_PROJECT_ID` nel `.env`, si entra con Firebase Auth
  (Google o anonimo; `src/session/login.ts`, Firebase caricato con `import()`, le impostazioni web da `GET /api/account`): l'ID token va
  nell'`entra`, il server lo verifica (`firebase-admin` in `server/account.ts`, `SessionOptions.verify`) e il viandante è l'uid
  (`accountWanderer` in `src/session/account.ts`); token falso o scaduto → `rifiuto`. L'anonimo (`ingresso.anonimo`,
  `SessionServer.isAnonymous`, `kernel.isAnonymous`) usa il meccanismo unico dei crediti di ADR-0081: 0 crediti non ricaricabili,
  escluso dalle spese comuni, richieste personali gestite con i modelli locali (`MockModels` a crediti esauriti); legandosi a Google
  (pannello `P`, «Lega a Google») smette di essere anonimo (`setAnonymous`), tiene lo stesso uid e viandante e può ricevere crediti.
  `QUINE_MASTER` (uid) è il master `io` degli universi fatti prima degli account. Senza `FIREBASE_PROJECT_ID` (sviluppo, test) vale l'id di
  oggi; in singola nessun account.
- **I pagamenti con Stripe** (ADR-0083, T45e): ricarica dei crediti in multigiocatore con Stripe Checkout (Google Pay compreso); chiavi solo sul server (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`); creazione sessione via `POST /api/stripe/checkout` verificata dal token account; un anonimo non compra (blocco a monte 403 e a valle sull'accredito); il webhook `POST /api/stripe/webhook` senza `STRIPE_WEBHOOK_SECRET` risponde 503 (e una chiave vera senza quel segreto non apre sessioni, T124), verifica la firma HMAC-SHA256 (`stripe-signature`), valida nomi e id come il checkout, calcola il credito dall'importo pagato (`paidCents`: tasse aggiunte escluse, mai i metadati) e accredita una volta per evento nell'archivio dei saldi (`Ledger.pay`, `Kernel.creditRecharge`, ADR-0104); pannello `P` con saldo crediti in dollari e pulsanti di ricarica rapida (`+5 $`, `+10 $`, `+20 $`). Niente `payment_method_types` (i metodi li sceglie il Dashboard); i Managed Payments di Stripe restano accesi solo con `STRIPE_TAX_CODE` nel `.env`, altrimenti la sessione li spegne; un accredito non fa commit (ADR-0104).
- **Morte e ricollegamento in multigiocatore** (ADR-0076, T43c): a salute zero un giocatore (mai il master: `mortalDies`) muore sul server con la
  punizione della partita (`continueAfterDeath(id, cause)` concatenata da `die` come lui, senza alzare `dead` né fermare gli altri; `wanderer:died` →
  avviso `morte` con `perso` e `dove`, il client mostra la schermata della morte, `ui:died`, e riparte dove il verdetto dice). `world/giocatori/<id>.json` salva anche `pos {x, y}`: chi esce e rientra ritrova
  posizione, inventario, frase, stati, carte e legami.
- **Il clone con un altro master** (ADR-0068, T42d): il master non cambia; un altro master è un altro universo. `cloneUniverse`
  (`server/universeStore.ts`, `POST /api/universe/<nome>/clone {nome, master, titolari}`) copia la cartella intera (storia, `maps/`,
  viandanti, carte, consumi; non i rami `rami/*` né i saldi, ADR-0104) e committa ciò che dà `cloneChanges` (`src/kernel/clone.ts`): `name` e
  `partita.master` in `universe.json`; autore e pagante delle carte restano, il titolare resta o, con `titolari: 'master'`, le carte
  del vecchio master passano al nuovo (`passCards`). Nella console del master in multigiocatore, scheda «Universo» (`Console.onClone`).
- **L'eredità dei cloni** (ADR-0084, T45c): a ogni clone `inheritCards` (`clone.ts`) allunga la catena di ogni carta (`carta.origini`:
  titolare, universo, impronta MinHash del contenuto, `src/kernel/heritage.ts`) e mette gli utilizzi di allora in `world/carte.json →
  allaNascita`. A ogni utilizzo dopo, risalendo la catena ogni anello passa indietro `base + copia × (1 − cambio)` (`universe.json →
  eredita`, 0,1 e 0,4; `sharesOf`), il resto al titolare; `allCards(files, true)` dà le `quote`, `receivedBy` / `kernel.received(id)`
  ciò che un viandante riceve come titolare di prima.
- **Il master in god mode** (ADR-0065, T42a): in multigiocatore il master (`partita.master`, fisso come la partita) è un dio
  (`godMode`): dopo i sistemi di ogni tick `keepGods` gli rimette i bisogni pieni (non il mana), la morte annunciata da Lua passa da
  `spareGods` (muore solo un giocatore), `applyEffects` sul suo corpo da parte di un altro lascia passare solo `messaggio`. Gli altri
  lo vedono solo nel mondo (`inWorld`: sul suo tappeto, dentro il cerchio, non in un interno); uscito con la runa del Concilio è `partiti`.
- **I giocatori dalla corona** (ADR-0067, T42c): al master il server manda l'elenco dei giocatori collegati (`giocatori`, solo a lui);
  `kernel.players()` (lo specchio: `kernel.connected`; il server: il registro) li mette nel tavolo della situazione (operazioni `giocatore`,
  viola, con «Segui» nel pannello) e nell'atlante. `segui {id}` fa mandare al master ciò che è attorno al giocatore (`Client.watch`);
  `kernel.follow`, `watching`, `watched()`: il renderer (`Renderer.offset()`) mette il giocatore al centro, nasconde corona e viandante
  del master, che resta nello studio; Esc o «Torna» sull'insegna (`#watch`, `master.ts`) la lasciano.
- **Sala del Concilio e studi** (ADR-0027): tavolo rotondo con l'universo che gira, gli otto membri seduti (con lo Scultore),
  teletrasporti verso le sale e ritorno, schermi della storia, stile neon punk; atlante navigabile.
- **Vita degli NPC** (ADR-0024): attività visibili (`attivita {tipo, ferma}`), dialoghi tra persone,
  ricordi pesati, legami col viandante e figli (effetti `legame ricordo nascita`), trame e missioni
  (`world/plots.json`, diario nell'HUD). Ogni trama passa dal validatore (`reviewPlot` in `plots.ts`): persone che
  esistono, animali da animali, legami del registro, rune del canone, niente quarta parete; ciò che non torna va al
  Narratore con il motivo, all'avvio `reviewPlots` ripara o ritira le trame aperte.
- **Meccaniche con interfacce** (ADR-0028): un modulo di sistema può avere un pannello (`manifest.ui`:
  `slot barra testo pulsante`) che il kernel disegna come scheda dell'inventario; hook `on_slot`/`on_ui`,
  componente `slots` del viandante; oggetti con `slot` (posto) e `bonus`. Le crea la Fucina delle meccaniche
  (`forgeMechanic`), su richiesta delle sessioni del Concilio o del Referente: il kernel dà gli strumenti, non i contenuti.
- **Casi dei sistemi** (ADR-0052, T27): `Manifest.casi` (`BenchCase`: scena 5 × 5 col viandante al centro, cose, ciò che porta,
  anche oggetti di prova, passi `slot togli pulsante attendi cammina`, durata, campi da guardare, righe del codice) gira con il codice
  vero in un **kernel in miniatura** (`kernel.runBenchCase` → `runCase` in `bench.ts`: un `Kernel` con `bench`, solo `core.*`, i
  moduli che non sono sistemi e quel sistema; generazione ferma, niente salvataggi né riparazioni) e dà prima, fotogrammi e
  dopo. L'Ingegnere scrive i casi di ogni meccanica in `mechanic.design`; il kernel li ripara (`cleanCases`), li esegue e tiene
  quelli in cui ciò che guardano cambia (se nessuno regge, un secondo tentativo; poi la meccanica entra senza casi).
  Nello studio le meccaniche `mech.*` stanno nella Sala sistemi con i `sys.*` (T27d); l'Archivio (`altro`) è solo per prefissi sconosciuti.
  Contro la parete di fondo della Sala sistemi la **catena** (T27a, `src/kernel/chain.ts`, voci `stazione`, `CHAIN`/`chainSlots` in
  `corona.ts`): una stazione per sistema nell'ordine del tick, su un nastro luminoso percorso da un impulso. Il tick misura ogni
  sistema (`ChainMeter`: ms e entità toccate, cioè gli id passati a `get set spawn destroy` dello `Host` durante `update`) e pubblica
  le medie una volta al secondo; `kernel.chain()` dà le stazioni con misure, pannello (`mech.*`) e guasto aperto (rossa); E o un clic →
  `ui:station` (pannello in `studio.ts`: cosa fa, posto nel tick, misure, tutta la catena, «Apri il file»).
  Al centro della sala il **banco di prova** (T27b, `BENCH_AT`, voce `banco`, «<» «>» con `target: 'banco'`): una teca 3 × 3 con i casi
  di tutti i sistemi (`kernel.benchCases()`, nell'ordine del tick; quelli del seme nei manifest di `sys.*`). `kernel.benchOf()` dà il
  caso scelto, la scena (`benchScene`: caselle nei colori della tavolozza, cose) e il codice, ed esegue il caso nel kernel in miniatura
  con il codice che il sistema ha adesso (in cache per caso e codice; `studio:bench` quando arriva). `src/render/bench.ts` lo ripete a
  ciclo: prima (fermo), la regola (i fotogrammi, le `righe` accese sullo schermo sopra la teca), dopo (ciò che è cambiato in verde);
  E o un clic → `ui:bench` (pannello in `studio.ts`: il caso in parole, prima → dopo, il codice con le righe accese, la stazione).
  Passi dei casi: `slot togli pulsante attendi cammina` (`cammina`: verso e secondi, tiene premuti i tasti).
- **Menu delle caselle** (ADR-0029): `E`/clic destro su una casella → azioni dell'entità, della casella, «Altro…»;
  le azioni libere ripetibili si imparano per tipo di terreno (`TileDef.actions`). Le `<action>` del modello di una
  cosa sono voci del suo menu (`modello:<nome>`), anche quelle nate da «Altro…» (ADR-0044).
- **Il salto** (ADR-0080, T56b): Spazio (`kernel.jump()`) nella simulazione: verso dove si cammina o si guarda, sopra ciò che non va più in alto di `JUMP_UP` (1,05 caselle, `topUnder` sui `Form.levels`) e sopra l'acqua, mai sopra muri, rocce o caselle solide del terreno; atterra nel primo punto da 1 a `JUMP_FAR` (2,6) caselle dove il corpo sta, altrimenti salto sul posto. Con i piani (T70) si salta dal pavimento su cui si sta (`pos.z`), conta il pieno che comincia sotto `JUMP_UP` (non il soffitto) e si atterra sul pavimento più alto che si supera (`floorBelow`). Componente `salto` del viandante portato da `jumpTick` dopo i sistemi; `kernel.jumping()` per arco e ombra. Nella corona, nello studio e nel kernel specchio Spazio fa ciò che fa `E`.
- **I sotterranei** (ADR-0091, progetto di T52a; T52b fatto, da attuare T52c-f): parti delle strutture sotto il suolo, mai un mondo a parte. La voce del modello dice `sotto: N` (1-3, `sottoOf`; la scatola della classe si allunga in basso, `Form.base` = `N · vpt` voxel sotto il suolo): pavimenti, collisione e taglio contano da lì (`levelIn` aggiunge `base`; fuori dal modello e dove non ha voxel sotto il suolo la terra è piena fino a `base`, `surfaces(…, fill)`), dalla cantina si esce solo per la scala, e ogni pavimento sotto il suolo si raggiunge dal piano terra (`groundOfForm`; altrimenti il modello entra senza cantina: `Form.hole` assente, posato comunque più in basso). Sulle colonne della cantina (`Form.hole`) `floorAt` ignora il terreno, sopra la tromba delle scale è aria (`rampBlocks`) e il salto non ci atterra (`floorBelow`, `topUnder`); il renderer posa il modello `kernel.sunk(id)` più in basso e abbassa il terreno delle caselle della cantina al suo fondo (`kernel.holesIn(chunk)`, il buco). Il Cartografo la chiede (`strutture[].sotto`, cose `sotto`); la profondità del terreno si genera come su X e Y (terreni `strato`, bozza per colonna, programma `sottosuolo` dell’ambiente, `strati` nel piano e in `PlaceView`, fino a 2 caselle sotto la cantina più profonda, al più 6). Si vede con il buco del terreno sotto il modello e, per chi sta sotto, un taglio a caselle in un disco attorno a lui con le bande degli strati e la luce attenuata. Nella corona scende solo l’esterno dell’edificio (T52c).
- **La grafica a cartone** (ADR-0093, progetto T89, da attuare T89a-e): fasce toon, contorni a inchiostro dove cambiano cosa o parte (la lettera della
  palette, attributo `part`), mai dalla geometria dei voxel (sugli alberi fa rumore), luce calda con ombre tinte e prospettiva aerea, e la guida di stile che
  chiede parti di colore distinto. Per ora una prova dietro `?cartone` (`src/render/cartoon.ts`: `MeshToonMaterial` a tre fasce in `lit()` di `materials.ts`,
  passo `Ink` nel composer di `bloom.ts`, soglie in `window.cartone`).
- **Il mondo in 3D** (ADR-0040, 0047): three.js, camera in 3/4 da sud che gira liberamente trascinando col tasto centrale
  o a quarti di giro (`,` `.`), zoom in/out con rotellina; l'input traduce le direzioni dello schermo in quelle del mondo
  con l'angolo continuo, così il movimento del kernel resta in coordinate del mondo e `W` va sempre in alto; in simulazione l'orbita
  è orizzontale e lo zoom non supera la vista predefinita, da master (god mode) o nella corona la rotazione e lo zoom sono liberi in
  tutte le direzioni; un'unità = una casella, kernel (x, y) = three.js (x, z). La simulazione (chunk, cose, rune) è in coordinate del
  tappeto e si disegna spostata del suo scorrimento; viandante, corona e studio in coordinate reali; quando la corona si
  vede, nulla della simulazione si disegna oltre il cerchio (un taglio nello shader). Testi, fumetti, «E», passaggio del
  mouse e glitch su uno strato 2D sopra. Il tasto destro sceglie la casella con un raggio sul terreno.
- **Bozze di prova**: `kernel.sampleDrafts()` (una boscosa, una aperta, una con acqua, scelte in modo deterministico) è dove il
  validatore prova i programmi degli ambienti e dove il campionario li mostra.
- **MarkovJunior** (ADR-0036, 0038): l'XML di MarkovJunior letto alla lettera (palette ufficiale, strati dall'alto,
  simmetrie, `map`, `convolution`; 16 modelli 3D ufficiali girano invariati), più `<color part hidden glow>`, forme di
  base, `<animation>` e `<action>` (regole sul modello finito: la porta si apre); il front-end ripara le forme
  sbagliate dagli agenti. Il codice è in `src/mj/`; il laboratorio (`lab/`, `lab/README.md`) serve ad analizzare e
  correggere i programmi che il Concilio non riesce a scrivere (sandbox 3D `/lab/3d/`, sezioni, foto, prove con Gemini).
- **Rilievo** (ADR-0048): il terreno ha le altezze. `Relief` (`src/kernel/relief.ts`) fa girare `Hills` di MarkovJunior
  (o `world/rilievo.xml`) su due scatole di lati 64 e 45, lette come piastrelle che si ripetono e rammendate; il livello
  di una casella è la somma (un livello = un quarto di casella, fra vicini al più due: si sale sempre, non è mai un
  ostacolo). Il mare sta al suo livello (`universe.json → rilievo.mare`, o `Relief.sea`), la terra mai sotto; ogni specchio
  d'acqua è piano per intero attraverso i chunk caricati, al suo livello più basso e mai sopra la riva, con sponde che
  scendono di due livelli a casella (T51a, `worldLevels`: un campo per il mondo caricato, uguale in qualunque ordine arrivino
  i chunk; `Chunk.levels` ridisegna chi cambia livelli); ogni lotto è piano, con un anello
  attorno, e il resto del chunk si piega verso di lui lasciando il bordo al campo (`chunkLevels`). `kernel.groundAt(x, y)` è l'altezza del
  suolo, `floorAt` la comprende (i modelli stanno sul suolo sotto il loro centro); il renderer disegna colonne con i fianchi e
  posa tutto sul suolo. Corona e studio restano piani.
- **L'acqua che scorre** (ADR-0094, T51b): un automa cellulare del kernel (`src/kernel/water.ts`, `kernel.water`): letto e quantità
  d'acqua per casella, scorre verso i vicini più bassi solo dove qualcosa è cambiato (100 passi al secondo, `waterTick`), si ferma in
  equilibrio, conserva la quantità, il mare è una sorgente. `kernel.dig(col, row, delta)` scava o alza il suolo (lo strumento di T57c e
  di «Altro…» che scava); il piano tiene `scavi` e `acqua` (il campo di `worldLevels` li prende: la superficie dell'acqua che ha scorso
  è fissata), le caselle che si riempiono o si asciugano cambiano tipo con `setTile`; il client sottile li riceve nel `PlaceView`.
  MarkovJunior resta per generare.
- **Mappa** (ADR-0011, 0040): caselle colorate per terreno, strati `ground floor wall door liquid vegetation rock`: l'acqua è
  più bassa con le sponde, i muri sono estrusi, le porte un varco sotto l'architrave; gli edifici dei luoghi non sono più caselle ma strutture; sulle caselle con `TileDef.model` (bosco, roccia) stanno istanze di quel modello, ruotate e spostate.
- **Voxel luminosi** (ADR-0046): `<color glow="True">` fa brillare una lettera (fiamme, finestre, rune, neon): attributo
  `glow` nelle mesh, senza occlusione, emissione nei materiali; il renderer disegna in un target con la maschera del
  bagliore nell'alfa e un bloom leggero prende solo ciò che brilla (`src/render/bloom.ts`); nelle foto non prende ombra.
- **Modelli** (ADR-0041): ogni cosa ha un programma della libreria `models/` (`appearance.model`, `ItemDef.model`,
  `TileDef.model`; senza, il generico della sua classe; gli oggetti senza modello il generico `oggetto` nel loro
  colore); un'istanza è un seme (pochi per tipo). Densità: 20 voxel per casella, o la `vpt` della voce in `models/index.json`
  (ADR-0049; la forma la porta in `Form.vpt`). `src/kernel/forms.ts`: programma + seme → griglia, impronta,
  pavimenti, azioni (in Node le esegue il kernel, nel browser i worker, che fanno anche le mesh). Componente `form`
  `{model, seed, yaw, tint, done, wanted}` (`wanted`: il modello suo, indossato appena lo Scultore lo scrive). Le cose solide bloccano con l'impronta dei loro voxel; le `<action>` del modello
  sono nel menu dell'entità e restano fatte (`stato.json → forme`). Persone e animali camminano con gli arti, la
  vegetazione al vento, le `<animation>` girano; le icone sono foto dei modelli.
- **Lotti e strutture** (ADR-0043): ogni edificio del piano è un lotto con una struttura (entità `struttura`, origine
  `<chunk>#s<i>`): il modello `edificio`/`grande` o `struttura-<concetto>` chiesto dal Cartografo sui lotti più grandi,
  al centro del lotto, girato verso la porta; le caselle del lotto tornano terreno. Dentro = sul pavimento del modello
  (`placeInside`, `floorAt`, `structureAt`); il renderer taglia la struttura in cui si è. Le scale sono rampe (T53a):
  ogni colonna di voxel ha il suo pavimento, ci si sale se è più alta al più di un gradino (0,2 caselle) di quelle vicine
  (`bodyGround`, `rampBlocks` in `forms.ts`); un muro resta un muro. Le strutture hanno più piani (T53b): una colonna ha un
  pavimento per ogni tratto di pieno (`surfaces`, `Form.levels`), il corpo sta su quello più vicino all'altezza dei suoi piedi,
  `pos.z`, che il kernel tiene dopo ogni tick (`settleHeights`) e che `free`/`free_real`/`floorAt` prendono (senza: il piano terra);
  il renderer taglia sopra il piano in cui si è.
- **Le taglie** (ADR-0092, T54): le taglie di D&D (`TAGLIE` in `src/mj/classes.ts`: minuscola, piccola, media, grande, enorme,
  gargantuesca, la massima), la stessa scala per creature e strutture: la classe dà la forma e la scatola della sua taglia solita
  (`AssetClass.taglia`), la taglia la scala (`tilesOf`, `boxOf(cls, taglia)`, più rada oltre 120 voxel, `densityOf`). `appearance.taglia`,
  `strutture[].taglia` del Cartografo, `struttura.taglia`, `SculptRequest.taglia`, `ModelInfo.taglia`/`vpt` (`modelSize`). Rare: una
  **Enorme** (il castello «importante» di prima) per zona di 56 × 56 luoghi (`zoneOf`), una **Gargantuesca** per **reame** di 4 × 4 zone
  (`realmOf`), una per luogo, con il modello migliore dello Scultore; `claimSizes` le adatta al lotto e alla rarità (`rareAllowed`),
  `stato.json → rari` (un `importanti` vecchio è `rari.enorme`).
- **Grafo del mondo** (ADR-0045): `src/kernel/graph.ts` costruisce dai file dell'universo e dai luoghi pianificati un grafo
  di nodi tipizzati (`<tipo>:<slug>`: persone col viandante e gli attesi, tipi, luoghi `luogo:<cx>_<cy>`, regioni, ambienti,
  strutture, trame, oggetti, ricette, rune, incantesimi, regole, fatti) e archi (legami, routine, tappe, contenuti, ingredienti,
  ciò che il viandante porta); `kernel.graph()` (in cache) con `find`, `neighbors`, `context`, `check()` (riferimenti verso
  nulla, legami da un lato solo o impossibili, nomi simili, trame senza persone o luoghi). Va in `world/grafo.json` prima di
  ogni commit se è cambiato ciò di cui è fatto (formato di Graphify, una riga per nodo e arco; tiene i luoghi del file
  precedente; `GRAPH_BUILD` da alzare quando si costruisce in modo diverso). I compiti narrativi (risposte e dialoghi degli NPC, «Esamina», «Leggi», azioni libere, fabbricazione, combinazioni,
  incantesimi nuovi, individui, trame) passano un `focus` (`kernel.focusOn`: le cose nominate e il luogo, id o nomi): il
  Narratore riceve allora la testa della bibbia, il canone, le ultime 12 regole e, in fondo al system (dopo la parte che
  la cache serve), il vicinato di quei nodi (`graph.context`, ~700 token) al posto della bibbia intera e del catalogo;
  se il grafo non conosce nulla del focus, i riassunti di prima. Graphify sul codice è facoltativo e fuori dal progetto (vedi Comandi).
- **Contenuti** (ADR-0012): `ItemDef` in pacchetti; bottino per tag; contenitori; ricette; bisogni
  (`needs` sul giocatore, `sys.needs`); uso generico in `core.items`; menu azioni (`E`).
- **Personaggi** (ADR-0010, 0013, 0017, 0020): tipo + individuo (`identity`: anche `job family routine story`), `mind` (memoria, umore, modo), azioni
  `segui resta vaga dai nessuna`, oggetti citati → `wanted`. Al massimo 2 dello stesso tipo nel mondo
  caricato; nuovi tipi forgiati esplorando (`ai.maxCast`); ogni individuo è un seme del programma del suo tipo (pochi semi per classe).

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
condiviso**: segue le «Regole per chi esegue un task» del README (solo il suo worktree e il suo blocco del backlog, niente merge né
domande: le scrive in `docs/pipeline/domande/<Txx>.md`) al posto dei punti 1 e 3 sul to-do e sul prompt successivo.
**L'orchestratore** (ADR-0078, [`docs/pipeline/orchestra.md`](docs/pipeline/orchestra.md), `/pipeline` in Claude Code e in Antigravity)
è l'agente da cui l'autore lancia sempre la pipeline: pianifica, lancia `esegui`, riporta ogni task, delega a un subagente la verifica nel
browser che il task chiede e non ha fatto (riga `BROWSER:`), integra rinumerando gli ADR che si scontrano, e tiene
[`docs/pipeline/orchestrazione.md`](docs/pipeline/orchestrazione.md) (passaggio di consegne e diario). Il suo provider
(`orchestratore <provider>`, a mano quando i crediti finiscono) sotto `sogliaUnSolo` non riceve task.
**L'ambiente dell'orchestratore** (ADR-0079): la pipeline si lancia con `node tools/pipeline/pipeline.mjs orchestra [--agente claude|argon|gemini] [--porta 4242]`
(`tools/pipeline/orchestra.mjs`): un processo con `esegui` sempre acceso, l'interfaccia web locale (`tools/pipeline/web.mjs`, T69; anche da sola con `node tools/pipeline/pipeline.mjs web`) e la conversazione con l'orchestratore a turni (`claude -p --resume`,
`agy -p --conversation`), la chat nel terminale e sul web (stessa coda `.pipeline/orchestra/coda.json`), eventi e chat su disco (`.pipeline/orchestra/`), epoche che ripartono dal **quadro**
(`docs/pipeline/quadro.md`) a metà finestra o quando i crediti finiscono (provider successivo di `orchestra.ordine`), con `avvio.md` compatto (senza indice intero, chat troncata e deduplicata) e interpellando l'orchestratore solo per messaggi dell'autore o decisioni (esiti, limiti, conflitti; ADR-0089). L'orchestratore
decide e delega (`interrompi`, `approva`, `assegna`, `dossier`, `indice`, `prossimo`, `ferma --ora|--dopo` quando l'autore chiede di spegnere, ADR-0090: Ctrl+C è `ferma --ora`, i task interrotti riprendono al riavvio e `avvio.md` dice cosa era in corso e cosa è finito; `integra` su un conflitto annulla e la risoluzione
diventa un task); i task sopravvivono al processo (log diretti, `--session-id`, ripresi al riavvio).

**Le vulnerabilità** (ADR-0098, T136, [`docs/sicurezza/README.md`](docs/sicurezza/README.md)): rilevamento → scheda → specifica → task → test → chiusura. Il registro `docs/sicurezza/registro.md` ha una voce `V-NNN` per ognuna;
la suite `tests/sicurezza/` afferma le proprietà, con `it.fails` per le voci aperte (chi chiude una falla toglie `.fails`). Chi esegue un task che tocca `server/`, `src/session/`, la sandbox, il validatore, i crediti o i pagamenti scrive nell'esito
«sicurezza: nessuna superficie nuova» o le voci che ha aggiunto. Non è una vulnerabilità ciò che resta dentro il gioco: a parte i crediti, tutto si può modificare.

### Convalida nel browser (senza tentativi)

Il kernel è in console come `window.quine` (o `window.rune`) in singola e per il master; per un giocatore in multigiocatore è il
`ThinClient` (ADR-0061). Da lì si va dove serve e si fa ciò che farebbe un tasto: niente WASD per arrivare.

- **Avvio**: `NODE_ENV=production npm run build`, poi `npx vite preview --port <n> --strictPort` (una porta libera: altre sessioni
  possono averne una aperta), poi `http://localhost:<n>/?skip&offline`. Aspetta il kernel prima di usarlo:
  `for (let i = 0; i < 40 && !window.quine?.corona; i++) await new Promise((r) => setTimeout(r, 500));`
- **Spostarsi ovunque**: ciò che riporta il viandante al centro è il **tappeto** (non `sanitize()`, che tocca solo posizioni non
  finite o fuori dal bordo del campus, mai gli interni). Fermalo e assegna la posizione, come fa `?dev&teleport=X,Y` in `main.ts`:
  ```js
  const k = window.quine;
  k.carpet().active = false;
  const f = k.corona.building('persone').floors[0];        // id dell'edificio (vedi ROOMS in corona.ts), piano
  Object.assign(k.playerPos(), { x: f.ox + 12.5, y: f.oy + 10.5 }); // casella locale nella stanza 24 × 15
  ```
  La zona (`studio`, `corona`, `sim`) e la stanza disegnata seguono da sole al tick dopo; nessuna porta né `E`. Le caselle dei
  dispositivi sono le costanti di `corona.ts` (`SHOWCASE_AT`, `GRAPH_AT`, `SITUATION_AT`, `WALL_AT`, `CONSOLES_AT`, `BENCH_AT`…,
  relative a `f.ox`, `f.oy`); il dispositivo sta sulla colonna 12, l'uscita in basso (y 14): stare a y 10.5 lo inquadra con la
  parete di fondo. Per gli esterni: `k.corona.building(id).door` (il viale davanti alla porta) o `?dev&teleport=46,0`.
- **Agire**: `await k.interact()` è `E` (sul dispositivo o sullo scaffale più vicino), `k.clickStudio(x, y)` il clic sinistro su un punto;
  i pannelli arrivano come eventi (`k.bus.on('ui:showcase', …)`, `ui:screens`, `ui:graph`…). Per far vedere uno stato senza Gemini:
  `k.council.say(agente, tipo, testo, a, compito)` scrive nel registro, `k.faults.raise(chiave, messaggio)` apre un guasto.
- **Guardare**: lo screenshot dello strumento del browser; la camera gira con i tasti `,` `.` mandati alla pagina (o trascinando col
  tasto centrale), la rotellina fa lo zoom. Errori: i messaggi della console della pagina.
- **Alla fine**: chiudi la scheda e ferma la preview.

## Convenzioni

- Documentazione, UI, prompt degli agenti e testi di gioco in **italiano**; identificatori e commenti
  TypeScript in **inglese**; commenti Lua dell'universo in **italiano**.
- File in LF (`.gitattributes`). Su Windows niente `Get-Content`/`Set-Content` di PowerShell 5.1 sui sorgenti.
- Nuova API per Lua: `Host` + `prelude.lua` + `LUA_API` nel validatore + prompt dell'Ingegnere + questo file.
- Nuovo compito per un agente: schema Gemini + risposta in `MockModels` + voce nel registro.
- Prima di consegnare: `npm test` e `npm run typecheck` verdi.

## Costi e prestazioni

- **Registro dei consumi** (ADR-0039): ogni chiamata passa da `kernel.usage` (per giorno, modello e compito, in token e
  dollari, cache e ragionamento compresi) e va in `world/consumi.json` con ogni commit; il costo è nel pannello del
  Concilio (`G`). `GeminiModels` non ripete mai una richiesta scaduta (può essere stata pagata); ripete solo 429/5xx.

- Testo per mondo: Genesi ~60 chiamate; poi 1 per luogo, 1-2 per individuo, ~4 per pacchetto di oggetti.
- Niente immagini (step 9): il costo dell'aspetto è testo, un programma per tipo (vedi il report 8.2B, sezione 4).
- Tick ≈ 5 ms in Node con ~100 entità (`sys.wander` il più costoso); budget di istruzioni Lua ~1.5×.
- Lezione ricorrente: i modelli non contano caratteri né caselle. Il kernel ripara le forme (griglie,
  regole dei programmi, nomi nelle ricette) e posiziona le cose; si scarta solo ciò che non si capisce.

## Stato e prossimi passi

> **Step 9 fatto (ADR-0037 attuato): il gioco è 3D.** Niente immagini generate; ogni aspetto è un programma
> MarkovJunior scritto dallo Scultore e giudicato dall'Artista; lo spazio è una scala di griglie (atlante → piano a
> caselle → lotti e strutture → modelli a voxel → corpi). Riassunto, costi e ciò che manca:
> [`docs/archivio/2-step/reports/step9.md`](docs/archivio/2-step/reports/step9.md); piano e diario delle fasi: [`docs/archivio/2-step/plans/step9-3d.md`](docs/archivio/2-step/plans/step9-3d.md).
> Il lavoro va avanti un task per sessione dal [backlog](docs/plans/backlog.md). Il gioco 2D è su `main` e negli
> universi `valmora` (backup in `H:/projects/rune-backup/universi-2d/`); il seme del 3D si chiama `aurora`.

Fatto: kernel, sandbox, rune (una per casella, rare), tappeto, corona nascosta e organizzata come studio
con il Concilio che vi lavora, versionamento, Concilio su Gemini, piani dei luoghi a caselle senza cuciture con
layout a regole e connettività garantita, contenuti come dati (pacchetti, bottino, contenitori, ricette, bisogni),
menu delle azioni con azioni libere giudicate dal Concilio e imparate dagli oggetti, effetti, magia e
incantesimi, fuoco, giorno e notte, varietà di persone, oggetti citati, riparazione automatica, rune come oggetti
con borsa e frase, mana e cristalli, borse nell'inventario, regole nate dal gioco, fabbricazione libera,
società degli NPC con famiglie e routine, sessioni del Concilio, test.

Fatto anche: due repository (seme del kernel + universo git su disco), stato della partita salvato,
menu delle caselle, meccaniche con pannelli generate dal Concilio (equipaggiamento), studio della corona con
squadre e Referente, atlante e timbri, biomi, vita degli NPC con trame e missioni.

Fatto nello step 9 (3D): MarkovJunior del gioco in `src/mj/` e laboratorio di MarkovJunior; registro dei consumi
in dollari; kernel senza immagini; renderer three.js (camera 3/4, giorno e notte, corona e studio dalle celle,
taglio al cerchio anche per istanze e ombre); libreria dei modelli con forme, semi, collisione e pavimenti dai
voxel, arti, vento, animazioni, `<action>` nel menu; icone come foto dei modelli; Scultore per classe e Artista
giudice; lotti come strutture girate verso la porta, una struttura Enorme per zona e una Gargantuesca per reame (le taglie di D&D); azioni come regole
(«Altro…» che cambia la forma scrive un'`<action>`); aiuto senza meta-gioco.

Prossimi passi (il dettaglio è nel backlog):
1. Coerenza del mondo: canone delle rune, prompt narrativi più semplici, società e trame coerenti, il grafo del
   mondo come contesto degli agenti (T07-T13, fatti).
2. Grafica e controlli 3D: voxel luminosi (T14, fatto), telecamera che ruota (T15, fatto), terreno con le altezze (T16, fatto), lotti in piano (T17, fatto).
3. La corona più grande (T18, fatto), con gli esterni come modelli (motore: T20, fatto; i programmi di tutti gli undici edifici: T31, fatto) e gli interni.
4. Ancore del piano («vicino a…»), forme degli oggetti portati e dei terreni che cambiano con «Altro…».
5. Multiplayer (ADR-0050): il server unica fonte di verità, modalità singola e multigiocatore, master fisso in god mode,
   crediti e carte; piano in [`docs/archivio/3-to-do-backlog/plans/multiplayer.md`](docs/archivio/3-to-do-backlog/plans/multiplayer.md), task T33-T45.
