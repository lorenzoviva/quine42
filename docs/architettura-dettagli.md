# Architettura nel dettaglio — QUINE42

> Il riferimento dei sottosistemi: si legge la sezione che serve quando un task tocca quell'area. Il nucleo, con le **regole inviolabili**,
> è [`AGENTS.md`](../AGENTS.md), che vince in caso di dubbio e rimanda qui dal suo «Indice architettura del gioco e sottosistemi». Perché è
> diviso: [ADR-0120](adr/0120-agents-nucleo-e-dettagli.md). I percorsi qui sotto sono relativi alla radice del repository.

## Indice

| Argomento | File sorgente |
|---|---|
| [Stack e persistenza](#stack) | `package.json`, `server/universeStore.ts` |
| [Il sito e il tema](#sito) | `site/`, `site/skins/`, `server/skins.ts`, `src/theme.css`, `docs/design/sito/` |
| [Lua: confine e limiti](#lua-sandbox) | `src/kernel/sandbox.ts`, `src/kernel/prelude.lua`, `src/mj/run.ts` |
| [Gemini, l'Attore, i coefficienti di generazione](#gemini) | `universe/universe.json`, `src/kernel/ai/`, `src/kernel/coefficients.ts` |
| [La lobby multigiocatore](#lobby) | `src/ui/lobby.ts`, `src/ui/creditdialog.ts` |
| [La coda della CLI degli abbonamenti](#abbonamenti) | `src/kernel/ai/subscription.ts`, `server/subscriptionQueue.ts`, `tools/abbonamenti/servi.ts`, `src/kernel/deferred.ts`, `tools/generazione/genera.ts` |
| [Il Concilio al lavoro: registro, Luogo, Fucina, Genesi](#concilio) | `src/kernel/agents/`, `src/kernel/layout.ts` |
| [Spazi, rune, magia, borse](#spazi-rune-magia) | `src/kernel/kernel.ts`, `src/kernel/runes.ts`, `src/kernel/magic.ts`, `src/kernel/inventory.ts` |
| [Il lessico](#lessico) | `world/lexicon.md`, `src/kernel/fourthwall.ts` |
| [Regole, effetti, stati, morte, menu, salto, contenuti](#regole-effetti) | `src/kernel/kernel.ts`, `src/kernel/content.ts`, `src/kernel/validator.ts`, `src/kernel/placing.ts`, `universe/modules/` |
| [Società, NPC, personaggi](#societa) | `src/kernel/npc/` (la facciata `index.ts`, la porta `host.ts`, i dati `model.ts`), `src/kernel/agents/minds.ts` |
| [La corona e gli interni dello studio](#corona) | `src/kernel/corona.ts`, `src/kernel/archive.ts`, `src/kernel/bible.ts`, `src/kernel/situation.ts`, `src/kernel/screens.ts`, `src/render/corona3d.ts`, `src/render/screens.ts`, `src/ui/studio.ts`, `src/ui/graph.ts` |
| [Meccaniche, casi dei sistemi, catena e banco di prova](#sala-sistemi) | `src/kernel/agents/mechanics.ts`, `src/kernel/bench.ts`, `src/kernel/chain.ts`, `src/render/chain.ts`, `src/render/bench.ts` |
| [Geografia](#geografia) | `src/kernel/atlas.ts`, `src/kernel/stamps.ts`, `world/atlas.json` |
| [La partita, i viandanti, le rune per ruolo](#partita-viandanti) | `src/kernel/gameSetup.ts`, `src/kernel/wanderers.ts`, `src/kernel/runes.ts` |
| [Semi condivisi](#semi) | `src/kernel/rng.ts`, `tests/determinism.test.ts` |
| [Chi paga, le carte, i crediti](#carte-crediti) | `src/kernel/cards.ts`, `src/kernel/credits.ts`, `server/ledger.ts` |
| [Il multigiocatore: server, client, ramo del master, tra viandanti](#multigiocatore) | `src/session/`, `server/session.ts`, `server/universeStore.ts`, `server/access.ts`, `src/master.ts` |
| [L'account Firebase](#account) | `src/session/account.ts`, `src/session/login.ts`, `server/account.ts` |
| [I pagamenti con Stripe](#stripe) | `server/stripe.ts`, `server/ledger.ts`, `site/pagamenti.ts` |
| [Il clone e l'eredità](#clone-eredita) | `src/kernel/clone.ts`, `src/kernel/heritage.ts`, `server/universeStore.ts` |
| [I sotterranei](#sotterranei) | `src/kernel/forms.ts`, `src/mj/mesh.ts`, `src/render/terrain.ts` |
| [La grafica a cartone](#cartone) | `src/render/cartoon.ts`, `src/render/materials.ts`, `src/render/bloom.ts` |
| [Il mondo in 3D, bozze di prova, mappa, voxel luminosi](#mondo3d) | `src/render/`, `src/kernel/layout.ts` |
| [MarkovJunior, i modelli, la cache delle forme](#markovjunior-modelli) | `src/mj/`, `src/kernel/forms.ts`, `src/kernel/modeldirector.ts`, `src/render/worker.ts`, `lab/` |
| [Il suono](#suono) | `src/mj/sound.ts`, `src/mj/synth.ts`, `src/audio/`, `universe/models/suono-*.xml` |
| [Il rilievo](#rilievo) | `src/kernel/relief.ts` |
| [L'acqua che scorre](#acqua) | `src/kernel/water.ts` |
| [Lotti e strutture, scale e piani](#lotti) | `src/kernel/layout.ts`, `src/kernel/forms.ts` |
| [Le taglie](#taglie) | `src/mj/classes.ts` |
| [Il grafo del mondo](#grafo) | `src/kernel/graph.ts`, `world/graph.json` |
| [Convalida nel browser (senza tentativi)](#convalida-browser) | `src/main.ts`, `src/kernel/corona.ts` |
| [Costi e prestazioni](#costi) | `src/kernel/ai/usage.ts`, `src/kernel/ai/prices.ts` |
| [Stato e prossimi passi](#stato) | `docs/plans/backlog.md` |

<a id="stack"></a>
## Stack e persistenza

- **Vite 7 + TypeScript 5** (strict; Vitest 4, ADR-0100), **three.js** per il mondo (ADR-0040) e per le pagine out-game (ADR-0095), DOM per HUD/pannelli, uno strato 2D sopra per i testi.
- **Vitest** in Node con modelli offline (`MockAiModels`): kernel, Concilio e layout testabili headless.
- Persistenza: repository git dell'universo su disco tramite il server di Vite (`server/universeStore.ts`):
  testi, `maps/` (piani dei luoghi), `world/state.json` (lo stato del mondo), `world/players/` (i viandanti), `world/usage.json` (i consumi); saldi e pagamenti fuori dal repository, in `universes/.balances/` (ADR-0104). Senza server:
  `localStorage` + IndexedDB. I commit vanno al disco in fila (`UniverseClient`, ADR-0122): senza risposta dal server il commit resta primo in fila e ritenta (tre volte subito, poi a ogni commit nuovo e ogni 30 s), un 5xx ritenta tre volte e cede il passo, un rifiuto (4xx) si scarta con un avviso; `checkout` e `clone` non passano sopra un commit in attesa. Nella stessa fila stanno anche i piani (`putMap`), i rami e le pubblicazioni, che ritentano come i commit (ADR-0144); nel browser la fila si salva per scheda in `localStorage` (`browserOwedStorage`, mai il token) e la pagina dopo la scrive prima di leggere l'universo; al tetto (256 scritture o 2 milioni di caratteri) una scrittura nuova si unisce a una in fila; un 401 chiede un token nuovo (`renewAuth`) e riprova.
- **La versione del kernel e l'intervallo dei kernel** (ADR-0136, ADR-0152): `universe.json → kernel` è l'ultimo kernel che ha scritto l'universo, `kernels` (`{ "from": "0.1" }`, `to` facoltativo) i contratti su cui gira: aperto, arriva al contratto di `kernel`. Li scrive il kernel prima di ogni commit (`stampKernel`) e solo se l'universo è nell'intervallo; un universo senza `kernels` lo ricava da `kernel`. Fuori intervallo: il guasto `universe:kernel` con l'intervallo nel motivo e l'universo **in sola lettura** (ADR-0156, T312): `Kernel.readOnly()` è il predicato, `Repo.readOnly` non fa nessun commit (Concilio, viandante, stato, magazzini, editor, pubblicazione) e il backend avvolto da `Repo.attach` non scrive commit, rami, `merge` né ritorni (`checkout`); i piani nuovi restano in memoria (`SealedChunks`); `Council.write` manda ogni compito ai modelli locali; il motivo del guasto lo dice (`READ_ONLY_WORDS`); `/api/viandante` a mondo spento risponde 409 se nemmeno le migrazioni portano l'universo qui (`opensOnThisKernel`, T317); restano il cestino, il clone e i saldi; un universo che le migrazioni portano nell'intervallo non è in sola lettura (la migrazione si committa in `Kernel.boot` prima che `Repo.readOnly` si colleghi, e il guasto si decide su `universe.json` già portato). Niente dal seme (`upgradeFromSeed`), l'etichetta «kernel 0.1–0.1» sulla scheda della pagina delle sessioni e nella lobby; l'universo resta sul disco. Le migrazioni da un contratto al successivo si registrano solo in `src/kernel/migrations.ts` (`MIGRATIONS`): `migrateUniverse` porta un universo lungo la catena se c'è tutta e scrive `kernels.from` del kernel; la chiamano `prepareUniverse` (`universes.ts`: migra, poi `upgradeFromSeed`, un commit solo) nella pagina, nei mondi di molti, nella generazione differita e per i quattro universi del laboratorio, e `Kernel.boot` per chi non passa di lì, con un commit subito (il primo commit del Concilio la recinterebbe); il server di un'altra versione è solo descritto in ADR-0152 (una build per `X.Y`, il front che sceglie dall'intervallo).
- **La prima migrazione, 0.1 → 0.2** (T307a, ADR-0153, ADR-0155): la lingua interna della simulazione (i domini T307a di `internalNames.ts`). I dati campo per campo (un JSON si riscrive con la sua indentazione, solo se cambia); le chiavi che altri puntano con ogni riferimento: i token delle rune e le formule in latino (`terra fuoco` → `terra ignis`, anche nel canone e nelle rune portate e nella mano), gli ambienti del seme e i timbri dei programmi, i modelli che il kernel nomina (i generici delle classi `persona.xml` → `person.xml`, `forma-*` → `shape-*`, `casa-comune-<classe>-*`), con l'indice, le imprese, le carte e le azioni fatte sulle forme; i terreni del seme prendono un `id` (`meadow`) e tengono il `name` del mondo (`world.find_tile`, `matura.in` e gli effetti cercano codice, id, nome: `Kernel.tileCodeOf`). Il Lua solo nei moduli del Concilio (`origin`), solo dove il kernel legge un valore: una categoria confrontata, un effetto costruito come tabella (`luaFor0_2`, un lessico che lascia commenti e stringhe lunghe); quello del giocatore resta (regola 3), quello del seme lo porta il seme. `seed.json` segue la migrazione: un file tenuto come il seme resta del seme e il seme della 0.2 lo sostituisce (così `core.effects` legge gli effetti inglesi). I piani dei luoghi non dicono il loro contratto: `migratePlan` è idempotente e il `chunkStore` del kernel la applica a ogni piano che legge (`migratePlanRecord`). Finché T310 non cambia i prompt, il validatore ripara l'italiano del contratto 0.1 (`internalManifest` in `parseManifest`, `internalEffect` in `validateEffects`, `validatePlan`, Fucina, pacchetti, pannelli, casi, timbri, rune nuove, indice dei modelli) e gli schemi del Concilio elencano i valori in italiano (`italianValues`); ciò che il mondo mostra usa la parola italiana (`italianName`: «Runa magica (luce)»).
- **La seconda migrazione, 0.2 → 0.3** (T307b, ADR-0153, ADR-0158): la lingua interna della società e del Concilio. I file cambiano nome con ciò che nominano: i moduli del seme che il kernel nomina (`sys.lavoro` → `sys.work`, `lavoro.<mestiere>` → `job.<trade>`, `obj.letto|cassa|banco|credenza` → `obj.bed|chest|counter|cupboard`, `item.forbici` → `item.scissors`) con il loro magazzino, `prompts/agents/<agente>.md` → `prompts/agents/<agent>.md`, i programmi sonori del seme (`suono-*` → `sound-*`, il dominio `suoni-seme`) e i gerboa (`corona-gerboa-<agent>`); ogni stringa JSON che è l'id di uno di quei moduli e ogni `carta.autore` che è un agente cambiano ovunque. Campo per campo: persone (specie, genere, routine), trame e missioni, imprese, programmi dei mestieri (`internalJobProgram`) e i casi del banco, l'indice dei suoni, le parti dei programmi, `universe.json` (chiavi di `ai.sculptors`, `ai.coefficients`, `ai.agents`, `ai.minimums`; la modalità), le carte e il grafo (`modello:` → `model:`, `persona:` → `individual:`…), le mancanze. Il Lua del Concilio dove il kernel legge un valore (un id di modulo del seme, l'attività di `attivita`); `migratePlan` porta le cose dei piani (`obj.letto` → `obj.bed`) e l'autore della carta del luogo. Le stesse funzioni riparano ciò che il Concilio scrive ancora in italiano in ogni lettura (`readPeople`, `readPlots`, `readVenture`, `readShortfalls`, `readCards`, l'indice dei suoni, `jobPrograms`, `model.ts`); il server legge `multigiocatore` come `multiplayer` (`isMultiplayer`). L'id del viandante solo (`io`) restava: lo porta T308a con i percorsi dei viandanti e i saldi.
- **La terza migrazione, 0.3 → 0.4** (T308a, ADR-0153, ADR-0159): i campi e i percorsi dei file dell’universo. I campi per **forma di file** (`FIELD_SHAPES` in `internalNames.ts`, `internalFields(forma, json)`): ogni forma dice quali chiavi italiane di quale oggetto un dominio rinomina (`only`), le altre sono contenuto o di un altro contratto e restano (`posto` è `slot`, `workplace` o `spot` secondo l’oggetto; i componenti di una cosa restano a T308b). `universe.json` (`game`, `relief.sea`, `heritage`, `ai.sculptors|agents|coefficients|minimums|actor|maxPieces`), i manifest (`appearance.look|class|size`, `ui.title|elements`, `cases`, `jobs` con `names`, `workplace`, `day` e i compiti `does|where|from|to|tile|drop|item|with|count|duration|pose|says|route|action`, `tiles.*.ripens`), persone, trame, bibbia (via le «crepe»), atlante, regole, stato (`consumed`, `containers`, `forms`, `rares`, `time`, `placed`), viandanti (`name`, `profile`, `states`, `transcended`, `anonymous`; mai `crediti`), imprese, carte, consumi, mancanze (`entries`), piani (`structures`, `houses`, `days`, `stages`, `seen`, `digs`, `water`), indice dei modelli (`class`, `size`, `cellar`, `score`, `sound.use|environments|moments|beyond|effects`); i timbri `carta` → `card` (`author`, `payer`, `holder`, `origins`) a ogni profondità (`internalCardsIn`); il viandante solo `io` → `me` dove un campo tiene un viandante e nel nome del suo file (`internalSoloIn`); i percorsi `world/players/`, `world/state.json`, `world/ventures.json`, `world/stores/`, `world/usage.json`, `world/shortfalls.json`, `world/cards.json`, `world/graph.json`, `world/canon.md`, `world/lexicon.md` (`internalPath`); l’attributo `soil="E"` dei programmi (il parser legge anche `suolo`). Lo stato di prima di T245a: le `importanti` sono le Enormi di `rares`, il `viandante` è `world/players/me.json`. **Ogni lettura** accetta anche i campi di prima (i valori di 0.2 e 0.3 si riparano prima, sulle chiavi italiane): così si legge ciò che il Concilio scrive ancora con i campi italiani dei suoi schemi (T310) e un universo del disco non ancora aperto; il server porta in memoria ciò che legge dal disco (`portedFiles`, `pathsBefore`: portafoglio, viandante, carte, ciò che è pubblico, Stripe, il rapporto delle mancanze). Le **cartelle del server** sono in `server/folders.ts` (`serverPath`): `.trash`, `.balances`, `.queue`, `.running`, `.generation`, `.gemini-spend.json`, e la cartella di prima si sposta al nome nuovo la prima volta che serve (un archivio dei saldi di prima legge `io` come `me`). La **fila del browser** è in `quine:owed:`; una sotto `quine:fila:` si prende comunque, portata (`owedTo0_4`). Lua: `sys.work` legge i compiti e il passo dell’impresa (`world.impresa`: `does`, `item`, `pose`) con i campi di 0.4; i posti sono `tile:<codice>` ed `entity:<tag>`.
- **La quarta migrazione, 0.4 → 0.5** (T308b, ADR-0153, ADR-0163): il filo e Lua. **Il protocollo** (`src/session/protocol.ts`) parla inglese, client e server insieme e senza dati da migrare: i messaggi (`join`, `profile`, `step`, `keys`, `phrase`, `inscribe`, `cast`, `action`, `other`, `chat`, `say`, `give`, `item`, `container`, `craft`, `panel`, `tile`, `branch`, `publish`, `follow`, `agent`, `recharge`; dal server `welcome`, `update`, `correction`, `result`, `refusal`, `world`, `council`, `file`, `branch`), le operazioni (`use`, `wield`, `put_down`, `move`, `to_bag`, `from_bag`, `action`; `open`, `take`, `put`; `put`, `remove`, `button` con `socket` per il posto di un pannello), gli stati del mondo (`stopped`, `resumed`, `restarted`), gli avvisi (`type: say|give|other|death|credits`, `from`, `name`, `text`, `lost`, `where: here|square`, `reason: exhausted|cap`) e i campi (`time`, `state`, `chunks`, `entities`, `gone`, `wanderers`, `departed`, `players`, `notices`, `text`, `reason`…); anche l'`Account` verificato (`anonymous`, `name`) e i campi del `SessionClient`. Il canale tra il server e il processo di un mondo (`worldwire.ts`: `apri`, `pronto`, `vivo`…) e le rotte HTTP restano come sono. **I componenti** che Lua vede e i loro campi (`COMPONENT_FIELDS` in `internalNames.ts`: un campo si rinomina solo nel componente che ce l'ha): `luce {raggio, accesa, colore, daStato}` → `light {radius, lit, color, fromState}`, `fuoco` → `fire`, `effimero {fino}` → `ephemeral {expires}`, `scudo {fino, spento}` → `shield {expires, off}`, `meta` → `goal`, `stati` → `states` (ogni stato `{speed, weight, light, expires}`), `attivita {tipo, ferma}` → `activity {kind, still}`, `posato` → `placed`, `struttura {concetto, classe, taglia, stadio}` → `structure {concept, class, size, stage}`, `salto {da, a, alto}` → `jump {from, to, peak}`, `lavoro` → `work`, `carico` → `load`, `mestiere {fase, giorno, luogo, compiti, impresa, impresa_posto}` → `job {phase, day, chunk, tasks, venture, venture_spot}`, `cantiere` → `worksite` (il pannello di `sys.work`, campi `title`, `phase`, `state`, `missing`, `team`, il pulsante `bring`), `raccolto`/`frugato {si}` → `harvested`/`searched {yes}`, `player.passo` → `step`, `needs.morto` → `dead`. `fino` è `expires` e non `until`: `until` è una parola riservata di Lua (`e.until` non compila; i `taken` del dominio lo vietano). **L'API**: `world.impresa` → `world.venture`, `world.impresa_porta` → `world.venture_bring`; l'evento `morte` → `death` con `{hunger, thirst}` (l'emit ripara ancora `morte`, `internalEvent`); la chiave del deposito `deposito:` → `deposit:`. **Nei file**: i manifest (`components`, `singleton`, `persist`, i campi dei pannelli `componente.campo`, i casi con i loro componenti e i campi guardati; `internalManifest0_5`, anche nel validatore), gli stati dei viandanti (`world/players/<id>.json → states`), il magazzino di `sys.work` (`world/stores/sys.work.json`, solo le chiavi `deposito:`; il magazzino di un altro modulo è suo). **Il Lua dei moduli del Concilio** (`luaFor0_5`, sul lessico di T307a): i nomi dei componenti in `ecs.get/set/first/each` e le chiavi della tabella di `ecs.spawn`; i campi dove la tabella del componente si costruisce (`ecs.set(u, "luce", { raggio = 3 })`, `ecs.get(u, "luce") or { accesa = false }`, uno stato di `stati` messo per nome o per chiave) e dove si legge su ciò che `ecs.get`/`ecs.each` ha dato (`local l = ecs.get(...); l.accesa`, `ecs.get(...).stadio`); l'API e l'evento; commenti, stringhe lunghe e le altre stringhe restano. Un componente di un modulo che ha il nome di uno della tabella si rinomina con lui, in tutto il modulo: si comporta com'era. La stessa funzione porta al contratto il codice che l'Ingegnere scrive ancora con i nomi di prima (`forge.ts`, `mechanics.ts`, `repairLogic`), e `internalComponents` i suoi `componenti_json`, finché T310 non cambia i prompt. Il Lua del giocatore resta (regola 3); il seme porta il suo. I piani non hanno nulla di questi.

<a id="sito"></a>
## Il sito e il tema

- **Il sito e il tema** (ADR-0095, T97): pop art a fumetti, retro arcade, neon punk e retrowave; variabili CSS unificate in `src/theme.css` per sito e gioco; pagine Vite in `site/` senza framework pesanti; three.js fuori dal gioco (hero canvas, profilo) e carte collezionabili in CSS 3D; il segreto dei gerboa nel footer; lo stile delle pagine è quello del template `docs/design/sito/` (T109), `site/site.css` lo copia; la landing (`site/landing.ts`, T101) fa crescere nell'hero programmi MarkovJunior veri con `src/mj/`; la galleria delle carte (`site/carte.html`, `carte.ts`, T104) legge lo snapshot di `/api/universe/<nome>` con `allCards(files, true)` e `receivedBy`, la rarità è derivata dagli utilizzi (`rarityOf`), le miniature sono foto dei modelli (`photo.ts`) fatte in un worker, senza WebGL. il profilo (`site/profilo.ts`, T102) entra con `signIn`, legge e salva il viandante di un universo da `/api/viandante` (`kernel.keepProfile` o i file su disco) e mostra il modello vero in three.js; i crediti (`site/pagamenti.ts`, T105) dicono saldo, ricariche e consumi del viandante in un universo da `/api/crediti` e avviano Stripe Checkout; `site/shared.ts` è ciò che le pagine con un account hanno in comune. Le interfacce in gioco (T106) leggono gli stessi token: `src/style.css` dà i suoi nomi (`--gold`, `--panel`…) alla palette di `theme.css` e costruisce le finestre con inchiostro, ombra rigida e mezze tinte (`--window-veil` le attenua dietro il testo), le battute sono fumetti, gli avvisi usano il carattere display; `tests/theme.test.ts` rifiuta un token che non esiste.
- **Le notizie** (ADR-0129, T234): un file Markdown per notizia in `site/notizie/` (la guida è `LEGGIMI.md`), con `titolo`, `data`, `tag`, `riassunto` e, per un sondaggio o la pianificazione dei server, `link`; Vite li raccoglie alla build (`notizie-file.ts`, `import.meta.glob`), senza rotte né database. `site/notizie.html` è l'elenco, con i filtri per tag (`?tag=`), e la notizia singola (`?n=<nome del file>`); le ultime tre stanno nella landing. `notizie-testo.ts` trasforma il testo in HTML: tutto ciò che è scritto in un file esce escapato, un link è solo http(s) o del sito, un file che non va resta fuori e lo dice (`problems`: nella pagina in sviluppo, in `tests/site-news.test.ts`).
- **La scala aurea** (T241): spazi, corpi, interlinea e larghezze di HUD e pannelli stanno in `src/theme.css` come token, e `src/style.css` li legge tutti (`tests/theme.test.ts` rifiuta un `font`, `padding`, `margin` o `gap` in px scritti a mano). Restano fuori bordi, ombre e i pallini delle legende. Solo stile. Il sito la legge anche lui (T283), vedi sotto; le classi `comic-*` in `src/theme.css` non sono cambiate. I rapporti:

  | Che cosa | Token | Valori | Rapporto |
  |---|---|---|---|
  | Spazi | `--space-N` | 1, 2, 3, 5, 8, 13, 21, 34, 144 | Fibonacci: ogni passo ≈ φ il precedente |
  | Corpi | `--text-N` | 8, 11, 13, 18, 21, 29, 34, 47, 55, 76, 89, 144 | Fibonacci e Lucas alternati: φ ogni due passi (13 → 21, 18 → 29) |
  | Interlinea | `--leading-read`, `-snug`, `-tight` | 1,618 · 1,272 · 1,128 | φ, √φ, φ^¼; il corpo di base è 13 su 21 |
  | Larghezze e celle | `--measure-N` | 47, 55, 76, 89, 123, 144, 199, 233, 322, 377, 521, 610, 843 | Fibonacci e Lucas |
  | Inventario | griglia : dettagli | 322 : 521 (843) | φ; 6 celle da 47 con spazi da 8 fanno 322 |
  | Bisogni | etichetta : barra | 55 : 89 | φ |
  | Barra in basso | `--measure-123`, `--space-144` | 123 messaggi e chat, 144 il fumetto | ciò che sta sopra la barra: due valori della scala, non un rapporto |

- **Le vesti** (ADR-0145, T283): il sito è una base comune (`site/site.css`, `carte.css`, `sessioni.css`: struttura e proporzioni) più una veste, una cartella di `site/skins/<id>/` (`skin.json`, `skin.css`, icona, file propri, `effects.ts` facoltativo; guida in `site/skins/LEGGIMI.md`), scelta con `data-skin` sulla radice. La base legge solo token `--skin-*` e non ne dichiara nessuno: ciò che legge è il contratto, e `tests/site-skins.test.ts` lo controlla per ogni veste. `server/skins.ts` trova le cartelle, genera `/skins/boot.js` (primo script della pagina: sceglie tra gli id noti e scrive il foglio col parser, così blocca il primo disegno) e copia i file in `dist/skins/`: nessuna rotta. `site/skin.ts` è il selettore nella barra: ricorda la scelta in `localStorage` (`quine:sito:veste`), cambia foglio solo quando quello nuovo è arrivato, avvia `effects.ts` della veste in uso e segnala `quine:skin` ai palchi three.js. Una pagina nuova mette in testa `boot.js` e il `<noscript>`, e `skin.ts` tra i moduli (lo chiede il test). La sobria è la veste di partenza (`DEFAULT_SKIN`), sotto; il fumetto e la futuristica sono sotto.
- **La veste sobria** (T286): «vediamoci chiaro», la veste di partenza. Il logo e l'icona sono i disegni della proposta 04 «Il cerchio e il tappeto» di Claude (v2; quella delle prove `landing-tests/4-claude-2.png`), **estratti così come sono** da `tools/vesti/logo.ts` (lo stesso `estrai.ts`): gli elementi SVG della sezione `dir4` (`dir4-scuro`, `dir4-icona`) nello stesso ordine e con gli stessi attributi, in `site/skins/sobria/scritta.svg` (barra e piede, al posto delle lettere a fumetti) e `icona.svg` (la favicon); lo strumento rifiuta ciò che non è una forma, e `tests/site-skin-sobria.test.ts` li confronta elemento per elemento con la proposta. La personalità viene da tre gesti presi dalla Q, solo CSS e senza parole nuove: sotto la barra l'anello rosa sopra quello ciano, scostati come nella Q; il palco 3D è la pancia della Q, con gli anelli del tappeto alle misure del disegno attorno al modello che cresce al centro; davanti ai titoli delle sezioni la pancia della Q in piccolo (l'anello ciano col punto rosa dell'icona). Le catture a 1920 e 390 px in `docs/design/vesti/sobria/`.
- **La veste a fumetto** (T285, `docs/design/vesti/fumetto.md`; non più una prima stesura): scritta e icona della proposta 01 di Claude (v2) estratte così come sono, con la Q in un corpo solo (anello e asticella uniti, l'occhiello intero) e i pois del logo nel rosa in sovrastampa; la palette resta nei tre inchiostri del logo, nel nero e nei neutri viola (fuori: il viola elettrico, il grigio beige, il bianco sul rosa, il rosso gemello del rosa); un retino a mezzatinta agli angoli della finestra (`body::before`, opacità 0,32: i testi restano sopra 4,5:1 sul pixel peggiore) che `effects.ts` fa respirare piano, fermo a scheda nascosta e con `prefers-reduced-motion`. I disegni li scrive `site/skins/fumetto/genera.ts`; `tests/site-skin-fumetto.test.ts` li confronta.
- **La veste futuristica** (ADR-0151, T284; mista con ADR-0164, T315): l'inception di scritte al neon. Il logo è la scritta della proposta 05 «Il quine» di Claude (v2), **estratta così com'è** da `tools/vesti/scritta.ts` (`npx vite-node --script tools/vesti/estrai.ts`): 16 righe di posti, sette lettere 3 × 5, due colori, e la regola della proposta (ogni riga è QUINE42 dalla Q, sui soli posti delle lettere grandi). Ne escono `site/skins/futuristica/scritta.ts`, `scritta.svg` (barra e piede, stesse celle della proposta in 34,8 KB) e `icona.svg` (la Q della scritta: una riga di pixel per riga di testo fino a 63 px, la Q con le lettere piccole da 64 px); `tests/site-skin-futuristica.test.ts` li confronta cella per cella con la proposta e rifiuta un ritocco a mano. Si muovono (`effects.ts`, `surface.ts`) la scritta grande in testa all'hero della landing e le strisce della stessa scritta, più tenui (sotto la barra, in cima a ogni sezione e al piede): le lettere piccole scorrono sulle righe come un tappeto, una riga in un verso e la successiva nell'altro, teste di luce le percorrono come un cursore che compila e ogni tanto un'onda accende una lettera grande. Le luci sono un programma MarkovJunior (`lights-mj.ts`) che il motore del gioco tiene sulla sua griglia fra un tick e l'altro (`Stepper.tick`, il passo persistente, vedi `#markovjunior-modelli`): così costano quanto gli stessi cicli scritti a mano (`lights-simple.ts`, solo per il confronto con `?fx=semplice`), che nella pagina a 4× costano qualche punto in meno (la tabella sotto).
  **Il labirinto** (`program.ts`): nella landing, in una sezione sua subito sotto l'hero (`.fx-labirinto`: la mette `effects.ts`, che la toglie quando la veste cambia), una banda larga quanto la pagina con un programma MarkovJunior in due dimensioni scritto con le lettere della scritta: un labirinto cresce dal centro in 40 tick (`Stepper.advance`, la corsa di `runOn` a pezzi), poi la sua via più lunga si accende di giallo, resta 44 tick e ricomincia con un altro seme. I colori sono al contrario di quelli della scritta: le pareti sono lettere tenui (17 %), i percorsi liberi bande di luce del ciano con le lettere incise in scuro e le Q rosa (`mazeInk`; `Ink.block` unisce due posti liberi vicini anche nello spazio fra loro), ogni riga tre lettere dopo quella di sopra; il nome, i passi e l'etichetta stanno sul loro fondo scuro. Un timer aspetta il tick (90 ms), poi i pezzi in vista si dipingono finché il fotogramma ha speso 4 ms e il resto va al fotogramma dopo; un pezzo che non è cambiato non si ridipinge; tutto si ferma fuori schermo e a scheda nascosta, e con `prefers-reduced-motion` la scritta è ferma com'è nella proposta e il labirinto fermo e finito.
  **Il palco 3D della landing** (di ogni veste, `hero-stage.ts`): three.js si carica quando il palco sta per vedersi (mezzo schermo di margine), il ciclo dei fotogrammi si ferma quando il palco esce dallo schermo o la scheda si nasconde, con `prefers-reduced-motion` il modello è fermo e finito e si gira solo trascinandolo; i programmi girano in un worker (`hero-worker.ts`, `hero-programs.ts` senza three.js) che manda le celle visibili di ogni fotogramma, e alla scheda grafica vanno solo le istanze disegnate (`addUpdateRange`).
  Le misure, con `node tools/vesti/misura.mjs --url http://127.0.0.1:<porta>/site/index.html --webgl --rallenta 4 --posizioni cima,insieme,sotto [--telefono] [--profilo]` sulla preview (un Chrome headless proprio, solo loopback, GPU vera; 1920 × 1080 a DPR 1 o un telefono, 390 × 844 a DPR 2; finestre di 24 s, i tre programmi del palco col pino; «cima» è l'inizio della pagina, «insieme» il fondo dell'hero a metà schermo, palco e labirinto in vista insieme, «sotto» il fondo dell'hero in cima allo schermo, il labirinto in vista e il palco no). La veste di oggi è la build prima di T315, misurata allo stesso modo nella stessa sessione:

  | Landing | Larghezza, CPU | Cima | Insieme | Sotto | Fotogramma più lungo | ms per fotogramma degli effetti (media / p95 / max, la posizione peggiore) | Scaricati, JS compresso |
  |---|---|---|---|---|---|---|---|
  | sobria, prima di T315 | 1920, 4× | 30,0 % | 31,4 % | 9,8 % | 901,2 ms | — | 195,5 KB |
  | sobria, con T315 (il palco) | 1920, 4× | 20,8 % | 21,7 % | 0,4 % | 3,1 ms | — | 206,1 KB |
  | futuristica di T284 (luci semplici, niente labirinto) | 1920, 4× | 33,0 % | 33,7 % | 13,8 % | 839,0 ms | 3,2 / 4,6 / 5,1 | 201,4 KB |
  | **futuristica mista** (luci MarkovJunior, labirinto) | 1920, 4× | 25,5 % | 28,4 % | 12,8 % | 13,4 ms | 3,5 / 5,3 / 13,4 | 222,8 KB |
  | futuristica mista, luci semplici (`?fx=semplice`) | 1920, 4× | 24,7 % | 27,5 % | 10,1 % | 9,3 ms | 3,5 / 5,4 / 9,3 | 222,9 KB |
  | futuristica ferma, prima di T315 | 1920, 4× | 32,0 % | 32,1 % | 10,3 % | 839,3 ms | — | 201,4 KB |
  | futuristica ferma, con T315 | 1920, 4× | 0,4 % | 0,4 % | 0,5 % | 0,0 ms | — | 222,8 KB |
  | sobria, prima di T315 | 390, 4× | 10,1 % | 29,5 % | 9,8 % | 810,6 ms | — | 195,5 KB |
  | sobria, con T315 (il palco) | 390, 4× | 0,4 % | 18,7 % | 0,4 % | 5,9 ms | — | 206,1 KB |
  | futuristica di T284 (luci semplici, niente labirinto) | 390, 4× | 13,7 % | 31,4 % | 13,9 % | 820,8 ms | 2,3 / 3,5 / 5,0 | 201,4 KB |
  | **futuristica mista** (luci MarkovJunior, labirinto) | 390, 4× | 6,1 % | 23,9 % | 7,3 % | 7,8 ms | 2,6 / 4,3 / 7,8 | 222,8 KB |
  | futuristica mista, luci semplici (`?fx=semplice`) | 390, 4× | 6,1 % | 23,0 % | 6,0 % | 4,7 ms | 2,6 / 4,3 / 4,7 | 222,9 KB |
  | futuristica ferma, prima di T315 | 390, 4× | 10,5 % | 30,6 % | 11,3 % | 803,4 ms | — | 201,4 KB |
  | futuristica ferma, con T315 | 390, 4× | 0,4 % | 0,5 % | 0,5 % | 0,0 ms | — | 222,8 KB |
  | sobria, prima di T315 | 1920, 1× | 7,3 % | 7,4 % | — | 187,4 ms | — | 195,5 KB |
  | sobria, con T315 (il palco) | 1920, 1× | 4,1 % | 4,5 % | 0,2 % | 2,8 ms | — | 206,1 KB |
  | futuristica di T284 (luci semplici, niente labirinto) | 1920, 1× | 8,3 % | 8,0 % | — | 203,4 ms | 0,4 / 0,9 / 1,5 | 201,4 KB |
  | **futuristica mista** (luci MarkovJunior, labirinto) | 1920, 1× | 5,2 % | 6,7 % | 3,3 % | 6,0 ms | 1,6 / 2,8 / 6,0 | 222,8 KB |
  | futuristica mista, luci semplici (`?fx=semplice`) | 1920, 1× | 5,0 % | 5,9 % | 2,8 % | 4,5 ms | 1,2 / 2,8 / 4,5 | 222,9 KB |
  | futuristica ferma, prima di T315 | 1920, 1× | 7,3 % | 7,5 % | — | 193,6 ms | — | 201,4 KB |
  | futuristica ferma, con T315 | 1920, 1× | 0,2 % | 0,2 % | 0,2 % | 0,0 ms | — | 222,8 KB |

  Le catture a 1920 e a 390 px, una registrazione APNG della scritta e una del labirinto che cresce sono in `docs/design/vesti/futuristica/`, rifatte da `node tools/vesti/cattura.mjs --url …`.
- **La griglia del sito** (T283): spazi, corpi e interlinea solo dalla scala aurea, in base e vesti (`tests/site-skins.test.ts`). I rapporti:

  | Che cosa | Token o valore | Rapporto |
  |---|---|---|
  | Larghezza di pagina | `--page-width` = `--measure-1364` | Lucas: 843 + 521 |
  | Due colonne (hero, crediti) | `--column-major` : `--column-minor` = 1,618 : 1 | φ |
  | Vetrina e schede laterali | `--measure-322` e il resto | 322 è la colonna minore di 843 |
  | Altezza dell'hero | 61,8 vh | 1/φ dello schermo |
  | Titolo dell'hero | da `--text-34` a `--text-76`, 4,236 vw | φ³ % della larghezza |
  | Palco 3D | `--measure-521`, 377 sotto 992 px, 322 sotto 768 | Lucas e Fibonacci |
  | Carta | `--measure-322` × `--measure-521` | φ |
  | Corpo del testo | `--text-18` su `--leading-read` | 18 × φ = 29 |
  | Sezioni | `--space-55` sopra e sotto, `--space-21` ai lati | Fibonacci |

  Restano fuori bordi, ombre (sono della veste), pallini e le altezze minime dei riquadri piccoli.

- **La home per la beta** (ADR-0131, T244): la landing perde il tono da pitch e parte dei fumetti (`body.home`, con `site/istruzioni.html`); restano i programmi MarkovJunior e la striscia «coming soon», escono pilastri e carta dimostrativa. La corona non si nomina.
- **I video** (ADR-0131, T244): i file stanno in una cartella del server (`QUINE_VIDEO`), mai nel repository né in `dist/`, con `video.json` accanto (`file`, `titolo`, `descrizione`, nell'ordine). `server/video.ts` risponde a `/api/video` (solo ciò che è nell'elenco e ha il file: niente build né riavvio) e a `/api/video/<file>`, in produzione, in sviluppo e nella preview. Il nome chiesto si confronta con l'elenco e non si unisce mai a un percorso; un `Range` non valido è un 416. Tetti: `FRONT_RATES` (`video`, `videosAtOnce`, `videosInAll`). Una visione costa circa 200 KB, non il file. Guida: `docs/beta/LEGGIMI.md`.
- **Le istruzioni** (ADR-0131, T244): `docs/beta/guida.md` e, solo con `{ "laCorona": true }` in `site/beta.json`, `docs/beta/la-corona.md`. `server/betaGuide.ts` li porta nella build come moduli virtuali, con la trasformazione delle notizie (`markdownToHtml`). Spenta, la seconda parte non viene mai letta, quindi non è in `dist/` (`tests/site-guide.test.ts`, con una build vera). Senza testi `site/istruzioni.html` non è tra gli ingressi di Rollup e nessun link la mostra.
- **I laboratori per i giocatori** (ADR-0161, T293): un secondo interruttore in `site/beta.json`, `{ "laboratori": true }`, separato da `laCorona` (`labsOn` in `server/betaGuide.ts`). Spento (il seme del repository) le rotte delle carte fatte a mano rifiutano chiunque e il server di produzione non serve `/lab`; nessun link porta ai laboratori. `npm run dev` lo legge a ogni richiesta, il server di produzione quando parte. Che cosa si accende è in `#carte-crediti`. Acceso (ADR-0169, T294), il server di produzione serve le tre pagine dei laboratori e nient'altro di `/lab`, e la build ha `site/laboratori.html` e il link «Laboratori» (`labsPage`, `virtual:quine-laboratori`); accenderlo vuole una build e un riavvio.

<a id="lua-sandbox"></a>
## Lua: confine e limiti

- **Lua 5.4 via wasmoon** (WebAssembly), sandbox gestita dal kernel. Il confine (ADR-0101, T122): il proxy di wasmoon è spento e tutto passa da `Crossing` (`sandbox.ts`): a Lua arriva una vista dei soli campi di dati propri di un oggetto (niente prototipi, metodi, chiamate), a JS solo dati (niente funzioni Lua, cicli, nomi di `Object.prototype`; al più 64 livelli). La prova di caricamento (`Sandbox.probe`) gira in una VM a parte con un `Host` vuoto. I limiti (ADR-0105, T126): 2 milioni di istruzioni per chiamata e 12 per tick (`tickBegin`, `tickEnd`: chi viene dopo salta il tick, il guasto è `tick:budget`, `core.*` gira comunque), il lavoro delle funzioni C addebitato, i pattern costosi nel matcher scritto in Lua del prelude, memoria (64 MB), stringhe (1 MiB) e byte allocati nell'allocatore (`Meter`), 2 s di rete per chiamata; i modelli del gioco con `FORM_LIMITS`, `MAX_FORM_TIME`, `MAX_FORM_XML` (`src/mj/run.ts`).

<a id="gemini"></a>
## Gemini, l'Attore, i coefficienti di generazione

- **Google Gemini**: `gemini-3.1-flash-lite` (testo), in
  `universe/universe.json → ai` con i budget (`maxText`, `maxForges`, `maxPacks`, `maxCast`; in multigiocatore `placesPerMinute`),
  il ragionamento (`thinking`, `low`) e il tempo massimo (`timeout`). Prezzi in `src/kernel/ai/prices.ts` (con la data).
  **L'Attore** (`ai.actor`, ADR-0116, T157): spento se non detto, e allora nulla cambia; acceso (un booleano, il nome di un modello o `{acceso, modello}`,
  `repairActor`), il Narratore scrive la scheda di ogni individuo alla sua prima battuta (`npc.sheet`, `Individual.scheda`, riscritta solo se cambiano legami o
  storia, `sheetFingerprint`) e l'agente `attore` recita `npc.reply` e `npc.dialogue` con il suo modello (`ACTOR_MODEL`, `gemini-3.8-flash`): stessi compiti,
  paganti, limiti e modelli locali; si sceglie nella Genesi o nella lobby (solo il master, entrando: → #lobby); `kernel.interpreter()` dice chi recita.
  I **coefficienti di generazione** (`ai.coefficients`, ADR-0085, T45b, `src/kernel/coefficients.ts`): quanto spesso ogni agente chiama l'IA,
  da 0 a 1, riparati dal validatore; diretti (`sessioni dialoghi trame revisioni modelli brani`: ritmi allungati; `luoghi parole sguardi azioni magia morte riparazioni studio`: la quota che va ai modelli, ADR-0133) e indiretti (`persone abitanti
  pacchetti cose`: meno di ciò che causa le chiamate); a 0 nessuna chiamata, per nessuna riga; il censimento delle chiamate in `CENSUS`, dove solo la Genesi non ha una manopola, il preset «Low Detail» (`LOW_DETAIL`, anche
  lo Scultore su Flash-Lite), la stima di un'ora di gioco (`hourlyEstimate`); nella Genesi si scelgono con i modelli (`kernel.setAi`).

<a id="lobby"></a>
## La lobby multigiocatore

  La **lobby** (ADR-0086, T45d; ADR-0133, T247): il master regola tutto il consumo prima di entrare (preset, ogni coefficiente, ogni modello, ragionamento, Attore, budget, minimi), con la stima di un'ora che segue i valori e, accanto a ogni manopola, cosa fa il gioco a 0; gli altri vedono e non toccano. Il tetto crediti di chi entra incrementa i budget (`addBudgetFromCap`); a crediti esauriti o al tetto, tre scelte (ricarica, offline, abbandona), che restano di ogni viandante anche a partita in corso; la collezione carte fuori dalla partita con utilizzi.

  **Quando compare**: in una partita di molti a ogni apertura della pagina, anche di un universo già avviato, se non c'è `?skip`. Da soli la stessa schermata con `alone` (solo le regolazioni), a ogni apertura di un universo già generato se ci sono i modelli (`?lobby` la forza; senza modelli non c'è nulla da regolare); un universo mai generato ha la Genesi.

  **Partita in corso** (`kernel.settingsLocked`): in una partita di molti da quando il primo viandante entra a quando l'ultimo esce, anche se il mondo resta acceso; da soli da quando si chiude la lobby a quando si ricarica la pagina. In quel tempo nessuno cambia `ai`, nemmeno il master: `setAi` risponde `false`, `keepSettings` riscrive un `universe.json` che dice altro (editor, rollback, pubblicazione), `takeBranch` lo toglie dal ramo, `/api/universe` rifiuta da fuori un cambio di `ai` in un universo di molti. `/api/viandante` dice `inCorso` alla lobby. Le regolazioni entrano con il master nel messaggio `join` (`settings`), riparate da `repairAiSettings`; i minimi valgono per ogni via (`withinMinimums` in `readConfig`), e il server rifiuta un tetto sopra 0 e sotto il minimo.

<a id="abbonamenti"></a>
## La coda della CLI degli abbonamenti

  Gli abbonamenti (ADR-0077, T68; blindati da ADR-0106): `ai.provider` (`api` predefinito, `claude`; Antigravity non può escludere gli strumenti e non sta sulla coda) e `ai.agents` (agente → provider)
  mandano i compiti lenti (Genesi, Fucina, modelli dello Scultore, sessioni del Concilio, meccaniche) alla coda `/api/coda`, servita
  da un processo che usa la CLI dell'abbonamento di chi gioca; il resto resta sulle API. Solo in locale, mai sul server del multigiocatore. La route c'è solo con `QUINE_CODA=1` nel `.env`, da loopback, con un segreto che vive nel server; la CLI gira in una cartella vuota, con l'ambiente ridotto, senza strumenti, MCP, hook e impostazioni, il testo su stdin, e ogni esecuzione deve confermarlo dal suo `init` (`IsolationCheck` in `tools/abbonamenti/servi.ts`) o viene uccisa.

  **La generazione differita** (ADR-0137, T207): `npm run genera -- <universo>` genera un universo prima che qualcuno lo giochi, senza browser e solo
  dalla coda: ogni compito, anche i veloci, va all'abbonamento (`DeferredModels`), uno che andrebbe alle API ferma il comando. I passi (Genesi, luoghi a
  spirale da `(0, 0)` con i loro individui, modelli, brani) si scrivono solo se finiscono validi (`StepGate`); il progresso e il tetto in percentuale
  della settimana (riletto a ogni passo, misurato da `/usage`) stanno in `universes/.generation/<nome>.json`; il comando non parte su un universo con
  un mondo acceso (`universes/.running/`, `server/generation.ts`) e un mondo non si accende su un universo che si genera. Un universo di un'altra `X.Y` del kernel non si genera.

<a id="concilio"></a>
## Il Concilio al lavoro: registro, Luogo, Fucina, Genesi

Registro: `kernel.feed()`, pannello Concilio (`G`) e console. Nella corona ogni agente è una squadra: un
membro per edificio, che va allo scaffale del file che cambia; si vedono parlare solo quelli che
interagiscono nel registro; con `E` ci si parla. Il Cartografo crea ambienti e li colloca sull'atlante.
Il Narratore intreccia trame tra gli individui e scrive i loro dialoghi.
**Luogo** (18×18): bozza Lua continua (`g p t w r`) → piano del Cartografo (ambiente, cose `dentro`/
`fuori`/`ovunque`, oggetti `a_terra`, rune, `strutture`) → layout (varchi deterministici, programma con bordo
congelato, sentieri garantiti, edifici) → lotti: ogni edificio diventa una struttura, un modello intero girato
verso la porta (ADR-0043) → cose su celle raggiungibili (quelle `dentro` sul pavimento del modello; niente cose solide su punti di articolazione né davanti alle porte, ADR-0064), bottino
`terreno`, rune su tratti liberi. Il chunk (0,0) ha sempre `x`, `speed = speed` e la runa magica `lux` (`luce` fino al contratto 0.1).
**Fucina**: concetto (tipo, contesto, aspetto, comandi, azioni, contenitore, cose portate, persona,
unicità) → fisica → codice → Arbitro → validatore → commit → bibbia; il modello (`appearance.model` suo, con la `classe`) lo scrive poi lo Scultore; gli oggetti dei pacchetti
hanno una forma comune (`forma-…`, un programma per forma, ricolorato), i terreni con cose sopra un modello loro. **Genesi**: bibbia → stile → terreni (Fisico) → Arbitro → ambienti (provati) →
pacchetto di oggetti → cast (5 npc diversi, 5 oggetti/mobili, 2 strumenti) → commit.
**Ambientazioni** (ADR-0134, censimento in `docs/temi-censimento.md`): la schermata offre quattro testi (`WORLD_THEMES`: medievale, steampunk, moderno, futuristico), che si possono riscrivere; il kernel non sa quale, resta `prompts/theme.md` e l'epoca la portano bibbia e stile. I prompt e il canone parlano di epoca; i nomi dei timbri sono forme e non escono dal programma. `case_comuni` dell'Artista diventa `commonHouse` nel manifest dei terreni: i lotti senza struttura chiesta hanno allora un modello del mondo (`commonHouseModel`, per classe, primo nella coda del `ModelDirector`), altrimenti quelli generici del seme. Con meno di 3 ambienti generati restano solo quelli senza epoca (`TIMELESS_LAYOUTS`). `?offline` può fare una Genesi con i modelli locali, solo per le prove: scrivono sempre Valmora.
**La lingua delle richieste** (ADR-0165, T310): i prompt del Concilio sono inglesi (ruoli in `prompts/agents/`, tema, principi, frammenti degli agenti e del kernel); ogni richiesta è ruolo → principi → blocco «Lingua» (`languageBlock(languageOf(files))`, `src/kernel/language.ts`: il testo del mondo nella lingua dell'universo, `universe.json → language`, `it` se manca; gli id dello schema in inglese) → contesto dell'agente → `system` del compito → focus. Gli schemi elencano i valori interni (`internalValues`), la riparazione dei valori italiani resta un contratto ancora. Il contesto del mondo (bibbia, canone, lessico, catalogo, grafo) resta nella lingua del mondo, i motivi del validatore e del kernel in italiano (sono anche il registro). La quarta parete (`metaBreak`, `glossaryBreak`) legge la lingua del mondo, l'italiano e l'inglese, una tabella per lingua; i prestiti italiani (`server`, `loop`) solo in un mondo italiano.
**Mancanze** (ADR-0130): una richiesta che finisce male, di un viandante o del mondo, è una voce di `world/shortfalls.json` (`noteShortfall`, `ShortfallLog` in `src/kernel/shortfalls.ts`): richiesta, chi (`comune` se è il mondo), agente, compito, esito, motivo, volte. Gli esiti: `rifiuto` (Referente, azione o fabbricazione libera giudicata impossibile, anche quando è già una regola), `invalido` (il validatore ha rifiutato l'ultimo tentativo o scartato ciò che il Concilio proponeva: Fucina, ambienti, meccaniche, rune, pacchetti, piani dei luoghi, trame, modelli, brani), `errore` (il modello non ha dato una risposta usabile), `guasto` (l'Ingegnere non ripara). Non si conta ciò che manca al viandante (non ha gli ingredienti, non può chiedere rune) né la combinazione di due oggetti giudicata impossibile: il Narratore lì è severo di proposito. La stessa richiesta allo stesso agente per lo stesso compito è una voce sola; tetto di 500 voci. Il file si scrive prima di ogni commit e il salvataggio lo porta anche se non è cambiato altro; come i consumi sopravvive ai rollback. Il kernel del ramo del master non tiene niente: passa la voce al mondo. Nessun file di `playerFiles`/`publicFiles`, niente nel gioco; il master lo vede solo come ogni file del suo universo. `npm run mancanze [-- <universo>] [--cartella <dir>]` stampa il rapporto per il kernel 1.0.0.

<a id="spazi-rune-magia"></a>
## Spazi, rune, magia, borse

- **Spazi, tappeto, corona** (ADR-0004, 0009, 0063): cerchio di simulazione di raggio 42 fermo in (0,0) (42 passi per uscire fermando il tappeto), tappeto con offset; `coronaRevealed()`.
- **Rune** (ADR-0002, 0015): un token per runa, una casella per runa (una lastra luminosa a terra), righe orizzontali eseguite ogni
  tick; binding `x y speed carpet time`. Rare; quelle del tappeto solo a ≥ 3 chunk dall'origine. Il **canone delle rune**
  (`world/canon.md`: aspetto, dove stanno, restano finché qualcuno non le raccoglie, magia, ciò che nessuno sa), con le rune
  magiche e gli incantesimi dell'universo, va con ogni compito del Narratore e dell'Arbitro (`canonSummary`): nessuna storia
  dà alle rune comportamenti che lì non ci sono.
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

<a id="lessico"></a>
## Il lessico

- **Il lessico** (ADR-0075, T65): `world/lexicon.md` (seme, uguale in ogni universo e ambientazione): poche parole sostituite
  (`bonombo` il saluto, `macico`, `lerpio`, `pagosso`, `Ciok Ciok`), saluti, buone maniere, usanze, modi di dire. Va con ogni compito del
  Narratore e dell'Arbitro (`lexiconSummary`, con le al più 3 `usanze` che la bibbia aggiunge, `cleanBible`); nessun testo del mondo lo
  spiega come un glossario (`glossaryBreak` in `fourthwall.ts`, dentro `metaBreak(text, wordsOf(files))`).

<a id="regole-effetti"></a>
## Regole, effetti, stati, morte, menu, salto, contenuti

- **Regole** (ADR-0019): ogni giudizio in `world/rules.json`, mostrato al Concilio; le azioni possibili si
  imparano (modulo o `ItemDef.actions`); «Altro…» anche nell'inventario e nel crafting (ricette in
  `items.scoperte`); sessioni del Concilio ogni 12 luoghi.
- **Effetti** (ADR-0014, 0096): insieme chiuso (`messaggio bisogni crea_oggetto consuma distruggi apri contenitore
  terreno rilievo fuoco luce scudo spingi evoca legame ricordo nascita stato togli_stato`), validati dal kernel;
  applicati da `core.effects` (Lua) e, per `rilievo {delta, raggio}`, dal kernel (`kernel.dig`, ADR-0094: persistente
  in `scavi`, sveglia l'acqua che scorre). Usati da azioni libere («Altro…»), azioni imparate (`actions[].effects`)
  e incantesimi. Terreno e rilievo cambiati persistenti.
  Ciò che cambia l'**aspetto** di una cosa con una forma sua non è un effetto (ADR-0044): il Narratore lo dice in
  `forma`, lo Scultore scrive un'`<action>` sul programma del tipo (`sculptAction`), il kernel la prova sul modello
  (`checkAction`: finisce, cambia qualcosa, non lo svuota) e la mette nella libreria; gli effetti restano per il resto.
- **Giorno e notte** (ADR-0015): `daylight()`, giornata di 10 minuti; luce dai componenti `light` (`luce` fino al contratto 0.4).
- **Stati e meccaniche** (ADR-0026): effetti `stato`/`togli_stato` (velocità, peso, luce, durata) per ciò che
  si usa (cavallo, barca, zaino); componente `states` del viandante (`stati` fino al contratto 0.4; ogni stato `{speed, weight, light, expires}`).
- **Morte e trascendenza** (ADR-0026): a salute zero la sessione finisce (continua nello stesso universo o
  ricomincia dal seme); dopo la corona non si muore e non si perde nulla.
- **Menu delle caselle** (ADR-0029): `E`/clic destro su una casella → azioni dell'entità, della casella, «Altro…»;
  le azioni libere ripetibili si imparano per tipo di terreno (`TerrainDef.actions`). Le `<action>` del modello di una
  cosa sono voci del suo menu (`modello:<nome>`), anche quelle nate da «Altro…» (ADR-0044).
- **Il salto** (ADR-0080, T56b): Spazio (`kernel.jump()`) nella simulazione: verso dove si cammina o si guarda, sopra ciò che non va più in alto di `JUMP_UP` (1,05 caselle, `topUnder` sui `Form.levels`) e sopra l'acqua, mai sopra muri, rocce o caselle solide del terreno; atterra nel primo punto da 1 a `JUMP_FAR` (2,6) caselle dove il corpo sta, altrimenti salto sul posto. Con i piani (T70) si salta dal pavimento su cui si sta (`pos.z`), conta il pieno che comincia sotto `JUMP_UP` (non il soffitto) e si atterra sul pavimento più alto che si supera (`floorBelow`). Componente `jump` del viandante (`salto` fino al contratto 0.4) portato da `jumpTick` dopo i sistemi; `kernel.jumping()` per arco e ombra. Nella corona, nello studio e nel kernel specchio Spazio fa ciò che fa `E`.
- **Contenuti** (ADR-0012): `ItemDef` in pacchetti; bottino per tag; contenitori; ricette; bisogni
  (`needs` sul giocatore, `sys.needs`); uso generico in `core.items`; menu azioni (`E`).
- **Posare sui mobili** (ADR-0150, T291): nel menu di una cosa (`E`, tasto destro) chi impugna qualcosa ha «Posa *X* qui sopra»
  (`perform(id, 'posa')` → `kernel.placeOn`; su ciò che è già posato «Posa *X* accanto», sullo stesso mobile). Un **mobile** è una
  cosa ferma e solida di classe `mobile` (non `pushable`, non una persona né una struttura); il **ripiano** è un pavimento della sua
  forma sopra il suo suolo (`Form.levels`, con le azioni fatte), da `PLACE_DOWN` (1) sotto a `PLACE_UP` (1,5 caselle) sopra i piedi,
  entro `PLACE_REACH` (2) da chi posa. `findSpot` (`src/kernel/placing.ts`, funzioni pure) prova le quattro quarte di giro dell'oggetto
  (girato come il mobile): ogni colonna del suo modello visto dall'alto sta su legno alla stessa altezza con lo spazio per la sua
  altezza, il rettangolo della sua **impronta** non tocca quello di ciò che c'è già né il disco di chi ci sta in piedi; sceglie il
  ripiano più largo (poi il più alto) e, riga per riga, l'angolo più vicino a chi posa. Quanti oggetti stanno su un ripiano lo dicono
  le impronte (la cassapanca del seme tiene due oggetti generici, il banco con gli attrezzi uno). Altrimenti una frase del mondo
  (`placeRefusal`: non è un mobile, si muove, non ha un piano, non arrivi, avvicinati, non c'è più posto, c'è già qualcuno). L'oggetto
  è un `pickup` senza luogo con il componente `posato {z}` (l'altezza del ripiano): `settleHeights` lo posa sul pavimento più alto
  non sopra `z` (`floorBelow`), quindi sul ripiano o, se il mobile non c'è più o non è ancora pronto, su ciò che sta sotto, e non si
  perde; non è solido e non cambia pavimenti (regola 10); si raccoglie come da terra. Il salvataggio lo tiene in `world/state.json →
  posati` (oggetto, quanti, x, y, z, yaw, la borsa; al più `MAX_PLACED`), letto con validazione; la Genesi lo toglie. In
  multigiocatore `placed` (`posato` fino al contratto 0.4) è in `ENTITY_PARTS` e il kernel specchio lo posa sulla sua copia del mobile; l'azione viaggia in `action`
  (nessun messaggio nuovo). Il renderer lo disegna fermo, all'altezza del ripiano, girato come lo si è posato.
- **Prendere e spostare i mobili** (ADR-0168, T292): una cosa il cui manifest dice `takeable` (assente vale no: nel seme credenza,
  cassapanca, letto, banco, cassa; non il pozzo né il cartello) ha «Prendi» nel menu (`perform(id, 'prendi')` → `kernel.takeThing`).
  Non si prende, con una frase del mondo (`takeRefusal` in `src/kernel/moving.ts`), se dentro c'è qualcosa (un contenitore mai aperto
  si riempie come l'aprirebbe: si vuota prima, niente borse dentro borse), se sopra c'è qualcosa di posato o qualcuno, se non c'è posto,
  oltre `TAKE_REACH`. Presa, l'entità esce dal mondo ed entra in mano come l'oggetto `thing:<modulo>` (`Content.things`: dal manifest,
  pila 1, impugnabile, peso metà della massa tra 2 e 20; fuori da pacchetti, bottino e nomi) con la **cosa portata** (`Slot.thing`:
  l'origine, il seme dell'aspetto, lo stato, cioè i componenti che non sono del kernel, `readParts`, al più 4096 caratteri); l'origine
  va in `consumed`, il contenitore vuoto in `savedContainers`, le azioni del modello in `savedForms`. Si muove solo intera: mai in
  una borsa, in un contenitore o in un pannello; a un altro viandante passa intera. Si posa a terra dal menu della casella («Posa *X* qui»,
  `t:_posa`), con F o «Posa davanti a te» (la casella a 1,2 caselle davanti): `placeCarried` aspetta la sua forma, poi decide
  (`putCarried`, `spotFailure`): chi posa è a terra, la casella entro `PUT_REACH`, sotto ogni colonna della sua impronta il terreno
  la regge (non l'acqua), nessun terreno solido né modello che salga oltre un gradino entro la sua altezza (`formFills`), nessuno,
  niente a terra, nessuna runa; se è solida, né su né accanto a una porta (del terreno o dei lotti) e **il luogo resta connesso**
  (`wouldSplit`: le caselle di `MOVE_AREA` attorno, passabili e unite come la via le vede, `free` e `stepsBetween`, prima e con la
  cosa per un momento nell'indice dei solidi; due caselle unite prima lo restano; `walkGroups`, `splitBetween`). Altrimenti una frase
  (`putRefusal`) e resta in mano. Torna con la sua origine (contenitore e azioni), il suo stato sopra quello del manifest e prima di
  `on_spawn`, girata con la fronte verso chi la posa (`facingYaw`); `npc.forgetWays()` a ogni presa e posa. Il salvataggio la tiene
  in `world/state.json → moved` (modulo, origine, x, y, yaw, stato; al più `MAX_MOVED`, letto con `readMoved`): senza luogo, come gli
  oggetti posati, nasce al caricamento dove è stata posata e il piano del suo luogo non la rifà (le origini delle cose spostate e portate
  tornano in `consumed` a ogni caricamento); la Genesi le toglie, `breakEntity` la toglie. Il Narratore lo decide nel concetto della
  Fucina (`takeable`), il Cartografo per ciò che chiede a un luogo (`nuovi[].takeable`, l'ultima parola); il kernel lo scrive solo per
  un `oggetto` delle `TAKEABLE_CLASSES` (`furniture`, `object`, `pebble`) non grande. Non coperto: portare via i mobili dalla casa
  di un individuo non ha conseguenze.

<a id="societa"></a>
## Società, NPC, personaggi

- **L'NPC come oggetto** (T327, ADR-0166; il progetto in `docs/design/comportamento-npc.md` §10): tutto ciò che segue vive in
  `src/kernel/npc/`, dietro una facciata, la classe `Npc` (`npc/index.ts`), che ne possiede lo stato (le imprese in memoria, la cache
  dei mestieri e delle vie, le schede che si scrivono, le battute in coda, i saluti, la fase delle trame e della maturazione, la
  contabilità del giorno) e vede il mondo solo dalla porta `NpcHost` (`npc/host.ts`: l'ECS, i file e i commit, i luoghi e le
  collisioni, i viandanti, il tavolo del Concilio, a elenco). Il kernel ha un campo, `npc`, e chiama solo la facciata: `npc.tick()`
  dove era la società, `reset` quando i file si rileggono, `venturesToSave` al salvataggio, `returnToPlace` e `onReturn` quando un
  luogo si stende, `forgetWays` quando cambia il terreno sotto le vie, `buildingFell`, e le cinque primitive dell'Host (`world.path`,
  `find_tile`, `act`, `venture`, `venture_bring`); l'API di prima (`talk`, `quests`, `ventures`, `ensureIdentity`…) resta sul kernel,
  una chiamata ciascuna. Restano del kernel l'orologio (`day`, `DAY_SECONDS`), la stesura delle strutture (`spawnPlannedHouse`,
  `spawnLot`), ciò che sa un locale (`worldFacts`), lo studio dei personaggi. Dentro, le parti in una direzione sola: la facciata →
  `talk.ts` (dialoghi, `npc.reply`, `npc.dialogue`) → `stories.ts` (trame e missioni) → `people.ts` (chi sono: `npc.individuate`,
  `npc.sheet`, ricordi, legami, specie, nascite, le revisioni dell'avvio), `places.ts` (dove vanno, `findTile`, la via con la cache),
  `speech.ts` (le battute a tempo); `worksites.ts` (le imprese al lavoro, il pannello) → `people.ts`, `trades.ts` (i programmi, il
  deposito, `world.act`, ciò che matura) → `places.ts`; `away.ts` (fuori vista) → `worksites.ts`, `trades.ts`; tutte → i dati
  (`society.ts`, `plots.ts`, `jobs.ts`, `ventures.ts`, `route.ts`, puri) e la porta. Da fuori si importano solo due facce: `npc/index.ts`
  (il comportamento: il kernel) e `npc/model.ts` (i dati e le loro parole: il grafo, le carte, il sito, il rendering, gli agenti che
  scrivono persone); dentro, niente kernel, viandanti, sessione, rendering, UI, suono, server: l'id di un viandante sta in
  `wandererIds.ts`, che leggono le persone e i viandanti (il ciclo `society` ⇄ `wanderers` non c'è più). Lo dice
  `tests/npc-architecture.test.ts`, che legge gli import del prodotto (`src/`, `server/`, `site/`, `tools/`); test e laboratorio
  possono aprire l'interno per provare un pezzo. Un comportamento nuovo (i mestieri del Narratore, i bivi, le vite lunghe) è una
  parte nuova di `npc/` con una voce della facciata, non un metodo del kernel.
- **Società** (ADR-0020): `world/people.json`; individui con specie (`persona | animale`, dal tipo) e genere,
  mestiere, famiglia, routine (mattina/giorno/sera/notte → casa/lavoro/piazza/in giro, componente `meta` seguito
  da `sys.wander`). Un legame dice cosa è l'individuo per l'altro, nel suo genere; il validatore della società
  (`repairSociety` in `npc/society.ts`) lo rende possibile per le due specie e simmetrico, un padrone per animale,
  nomi non simili (rinomina anche nelle trame); ripara a ogni aggiunta e all'avvio (`reviewSociety`).
- **Vita degli NPC** (ADR-0024): attività visibili (`attivita {tipo, ferma}`), dialoghi tra individui,
  ricordi pesati, legami col viandante e figli (effetti `legame ricordo nascita`), trame e missioni
  (`world/plots.json`, diario nell'HUD). Ogni trama passa dal validatore (`reviewPlot` in `npc/plots.ts`): individui che
  esistono, animali da animali, legami del registro, rune del canone, niente quarta parete; ciò che non torna va al
  Narratore con il motivo, all'avvio `reviewPlots` ripara o ritira le trame aperte.
- **Il lavoro** (ADR-0140, T245b; progetto in `docs/design/comportamento-npc.md`): un mestiere con un **programma** (`jobs` di un
  modulo `data`, `job.<trade>/manifest.json`: nomi, posto, i compiti di ogni fase) si abbina per nome, poi per parola
  (`matchJob` in `npc/jobs.ts`); il programma passa dal validatore per riferimento (`validateJobProgram`: comportamenti di un elenco chiuso,
  caselle del terreno, oggetti del registro, durate 5-300 s, al più 6 compiti per fase). A ogni fase del giorno il kernel mette
  all'individuo il componente `job` (`mestiere` fino al contratto 0.4: i compiti della fase in `tasks`, `home`, `square` e `work` da `placeFor` e `findTile`, che non dà mai una casella di un lotto: l'erba sotto una casa non è un pascolo, T281) e non gli sceglie più
  la meta; `sys.work` (seme, ordine 28; `sys.lavoro` prima di T307b) esegue i compiti uno dopo l'altro con lo stato in `work` e ciò che porta in `load`, e
  cammina mettendo `goal` al prossimo punto di `world.path` (A* sulle caselle dei luoghi caricati, `npc/route.ts`, con la cache di `npc/places.ts`), che
  `sys.wander` segue. **La via va dove va il passo** (T299, ADR-0154): una casella è libera se lo è un corpo al suo centro, e un passo
  fra due caselle libere vale solo se il corpo ci cammina davvero (`stepFree`: senza modelli sulle caselle basta il terreno, altrimenti
  `free` ogni decimo di casella con i piedi sul pavimento, come `stepWanderer`), così un muro sottile sul bordo o il gradino di un modello
  più alto di un passo (una platea, un mobile) non si attraversano; il raggio è di chi chiede (`world.path(x, y, tx, ty, r)`, se no
  quello di un abitante, `ROUTE_BODY`); il punto dato è il più lontano dei due prossimi che si raggiunge dritti da dove si è, ad almeno
  `ROUTE_AHEAD`; una meta che nessuna via raggiunge (il centro di una bottega, un banco nel muro) si raggiunge il più vicino possibile,
  entro `ROUTE_NEAR`; chi è già su una via verso la stessa meta ne prende il resto, e i passi provati restano quanto le vie (la cache
  si svuota quando un luogo si carica o si scarica, quando cambia una casella e quando il primo passo di una via non è più libero).
  Senza via `sys.work` fa fallire il compito subito (`failed:no_way`; gli esiti sono `done`, `ongoing`, `failed:<motivo>`, il dominio `esiti-lavoro`) e passa al prossimo: nessuno resta a spingere contro un
  dislivello. `transform` e `gather` cambiano davvero le caselle (`world.set_tile`, quindi `plan.edits`), senza chiamare i
  modelli; al più 12 al lavoro per luogo, chi segue il viandante smette. **Ciò che matura** è del kernel: un terreno con
  `matura {dopo, in}` diventa `in` dopo `dopo` giorni da quando la casella è stata scritta (`plan.days`, il giorno di ogni modifica;
  una modifica senza giorno vale da oggi), a ogni fase del giorno nei luoghi caricati (`matureTick`). Il seme ha il contadino (ara
  `g→m`, semina `m→e`, il seminato matura in grano `u` in un giorno, miete `u→m` con `item.grano`), il boscaiolo (`t→x` con
  `item.ciocco`, la ceppaia ricresce in bosco in tre giorni) e il pescatore (`item.pesce` dalla riva di `w`). Con T245c (ADR-0141) i
  mestieri del seme sono dodici, con i nomi delle quattro ambientazioni (pastore, fabbro, oste, mercante, guardia, sacerdote, scrivano,
  cuoco, impiegato in più); `carry` e `take` passano dal **deposito del luogo** (la voce `deposit:<cx>:<cy>` del magazzino di
  `sys.work`, il luogo è `job.chunk`, `placeDeposit`), `produce` consuma `con` e fa un pezzo al banco, `use` chiama l'`on_act`
  di una cosa con l'individuo come chi la usa (`world.act`, solo azioni senza effetti, entro 2,5 caselle). La via vede le forme dei
  modelli (`free`); chi è fermo a meno di tre caselle dalla meta è arrivato, chi è fermo lontano per otto secondi lascia il compito.
- **Le imprese** (T245d, ADR-0147, `src/kernel/npc/ventures.ts` i dati, `npc/worksites.ts` il lavoro): il lavoro di molti verso un risultato che si vede, in `world/ventures.json`,
  scritto solo dal kernel (in memoria, nel file con il salvataggio come il magazzino; mai ai client; torna indietro con `R`). Il
  **progresso è derivato** da `portati` e `lavorato` (`ventureProgress`: la fase di adesso è la prima con materiali o lavoro che
  mancano; il lavoro conta solo fin dove i materiali lo permettono, `workAllowed`); lo stato si legge (`ventureState`: `active`,
  `waiting` se a nessuno della squadra né ai depositi resta ciò che manca, `stopped` senza squadra, `finished`). Tre **regole del kernel**,
  senza chiamate: un edificio che cade (`breakEntity` di una struttura) si ricostruisce sul suo lotto, che resta vuoto finché l'impresa
  non finisce; un luogo con tre famiglie (gruppi di legami tra chi vi appartiene) più delle sue case e un terreno libero che tiene
  unito il luogo (`freeArea`: caselle di terra fuori dai sentieri e dai lotti, i varchi e le porte ancora collegati) fa una casa comune
  (`commonHouse` del mondo, ADR-0134), che finita sta in piedi come le altre; ogni anno del mondo (`YEAR_DAYS` 24, giorno 16) un luogo
  con almeno quattro caselle di un raccolto seminato (un `gather` di un mestiere su ciò che matura da una casella che un mestiere
  semina) fa il raccolto, che dura al più tre giorni. La **squadra** (`fillTeam`, al più 6, a ogni giorno nuovo): per mestiere, poi per
  vicinanza (lo stesso luogo, poi fino a due luoghi), poi per un'estrazione del seme sul nome; chi non c'è più (non è in `people.json`
  o il suo corpo è stato preso, `consumed`) se ne va e un altro prende il posto. Per chi è in squadra il giorno comincia con
  `build`: `world.venture(id)` dà il passo (`carry` un materiale dal carico o dal deposito del suo luogo, in piazza, al cantiere
  con `world.venture_bring`; `work` fermo al suo posto attorno al cantiere; `gather` per il raccolto) e senza passo si torna al
  mestiere. Il **lavoro lo conta il kernel** guardando chi sta fermo al compito `build` vicino al cantiere (o nel luogo, per un
  raccolto), in secondi del mondo; una fase chiusa è una riga del registro (`impresa.fase`), la fine un ricordo di peso 3 per la squadra.
  Il **pannello** «Il cantiere» (`ui` di `sys.work`): i campi `cantiere.*` sul corpo di ogni viandante, l'impresa più vicina entro 30
  caselle, viaggiano con W (ADR-0139); il pulsante porta dalla borsa ciò che serve, a meno di 6 caselle dal cantiere, e chi è lì lo
  ricorda (peso 2).
- **L'edificio per stadi** (T245e, ADR-0148): il programma della struttura gira una volta; la griglia finita si mostra filtrata per lo
  stadio dell'impresa (`stageGrid` in `src/mj/mesh.ts`, pura: le quote del primo pavimento e della base del tetto dagli strati pieni
  della griglia; 0 niente, 0,2 il piano terra, fino a 0,7 i muri, da 0,9 tutto a luci spente, 1 com'è), con il cantiere attorno (un
  voxel in più per lato: picchetti e corda a 0, impalcature mentre sale). Impronta, pavimenti e piani seguono lo stadio senza il
  cantiere (`groundOf`); le stanze valgono dal tetto. Lo stadio sta nel piano del luogo (`plan.stages` per i lotti, `plan.houses` per
  le case nuove), che il kernel aggiorna quando una fase si chiude (`syncVenturePlan`) e che `settleLots` legge; sul filo va solo
  `struttura.stadio`, e il renderer rifà la mesh dell'istanza (`stagedBody`).
- **Fuori vista** (T245f, ADR-0149): un luogo non caricato non ha Lua; una volta al giorno, quando comincia la sera, il kernel tiene i
  conti (`awayTick`, `npc/away.ts`): un'impresa di un luogo non caricato prende dal deposito ciò che le serve e aggiunge un giorno di lavoro per
  ognuno della squadra (`AWAY_WORK`), i mestieri dei luoghi non caricati e in nessuna impresa portano al deposito del loro luogo ciò
  che portano in un giorno (`dailyProduce`, fino a 60 per oggetto); un orologio spostato in avanti conta una volta. Al **ritorno**
  (`returnToPlace`, prima di posare i lotti) ciò che matura matura per data e il piano prende lo stadio delle imprese, e perde quello che nessuna impresa regge (il piano va su disco prima di `world/ventures.json`: una scheda chiusa in mezzo o `R` non lasciano impalcature per sempre); `plan.visto`
  (quando il luogo è stato lasciato, solo mentre nessuno lo vede) dà a `on_return(luogo, trascorso)` dei moduli quanto è durata
  l'assenza. A mondo fermo il tempo resta fermo (ADR-0114).
- **Personaggi** (ADR-0010, 0013, 0017, 0020): tipo + individuo (`identity`: anche `job family routine story`), `mind` (memoria, umore, modo), azioni
  `segui resta vaga dai nessuna`, oggetti citati → `wanted`. Al massimo 2 dello stesso tipo nel mondo
  caricato; nuovi tipi forgiati esplorando (`ai.maxCast`); ogni individuo è un seme del programma del suo tipo (pochi semi per classe).

<a id="corona"></a>
## La corona e gli interni dello studio

- **Quando si vede** (ADR-0124, T226): la corona si disegna solo se il viandante è fuori dal cerchio o in una stanza dello studio: `coronaShown` (`corona.ts`), funzione pura della posizione, e `kernel.coronaRevealed()`, l'unico che la usa, falso anche mentre si segue un giocatore. Da lì dipendono `CoronaView.root.visible` (l'anello, le stanze, gli avatar), il taglio del mondo (`U.clipR`), lo sfondo e la luce, le etichette, il suolo sotto il mouse e `hoverAt`. La camera non c'entra: `canFreeOrbit()` è vero per il god mode (il master lo ha), per chi segue un giocatore e nella corona o nello studio; dentro il cerchio la base è la 3/4 (l'inclinazione e lo zoom fermi; il giro attorno al viandante col tasto centrale c'è da T55). Da `CORONA_READY_AT` (0,3 del raggio, `coronaNear`) l'anello si costruisce e si carica sulla GPU senza vedersi: `Renderer.loadRing` disegna copie delle sue mesh in un bersaglio di 1 pixel, 6 ms a fotogramma, perché three carica al primo disegno e `visible = false` da solo lascerebbe il carico al bordo; si butta dopo 60 s lontano (`RING_IDLE`). La nebbia è una sola e sempre accesa (nella corona è lontanissima): toglierla ricompilava 5-7 programmi al bordo. Il mondo resta caricato come dentro fino a `WORLD_BEYOND_EDGE` (6 caselle) oltre il cerchio, per chi torna.
- **Corona** (ADR-0009, 0016, 0022): studio; edifici per cartella con porte che teletrasportano in interni
  più grandi (stanze 24×15 su più piani, zona `studio`; sul pavimento una griglia tenue a esagoni di lato una casella, solo disegno: `hexLines`, T220), scaffali di file; una stanza ha un elenco di squadre (`Building.teams`, ADR-0127), ognuna al suo posto davanti allo schermo: la Galleria ne ha due, Artista e Musicista, e lo Studio dei Personaggi due, Narratore e Attore; Galleria dell'Artista (i modelli,
  «riscolpisci»), Ufficio dei luoghi che è anche lo studio del Cartografo (ADR-0051: i terreni nel campionario, da un piano
  loro dopo i file, e dopo di loro un riquadro per ambiente, il suo programma provato su una bozza in miniatura, T26d, `layoutSample`; l'atlante contro la parete di fondo; il posto del Cartografo al tavolo porta lì), bacheche con le modifiche recenti (che brillano).
  Fuori, il campus è un anello profondo 36 caselle oltre il cerchio (`CAMPUS` in `corona.ts`): il viale con il cerchio al
  neon, una corona circolare tra due cerchi perfetti concentrici sul centro del mondo (T219, `buildAvenue` e `outsideCircle` in `corona3d.ts`: il disegno non segue le caselle, il suolo si taglia sul cerchio esterno; le caselle che il cerchio interno attraversa esistono tutte, così ciò che è oltre il cerchio si cammina), le porte, un blocco di 16 × ~20 caselle per edificio (lo spazio di un modello), vicoli tra i settori, prati,
  il bordo luminoso; sopra ogni porta un'insegna al neon con il nome. Lungo il campus arredi futuristici (`CampusProp` in `corona.ts`, T50: lampioni
  neon lungo il viale, alberi di luce sui prati, panchine e totem olografici nei vicoli, porte e viali sempre liberi) e logistica operosa
  animata (droni volanti tra gli edifici e trenini magnetici di file sul binario ad anello, `corona3d.ts`). Negli interni e nella Direzione
  gli avatar del Concilio sono gerboa giganti pacioccosi (`corona-gerboa-<agent>.xml`, T50), ciascuno con cappello distintivo per ruolo; l'Attore (T158) ha il cappello da moschettiere piumato, la mezza maschera e la gorgiera, siede al tavolo accanto al Narratore e il suo posto di lavoro è lo Studio dei Personaggi (seconda squadra di `persone`, un passo oltre il Narratore). Con l'opzione spenta (`ai.actor`) resta a riposo come chi non lavora: posto, console e avatar non dipendono dalla configurazione, così la sala non cambia quando il master la cambia; alla console siede solo se lavora, e da spento non lavora.
  Un edificio con un programma suo (`models/corona-<id>.xml`, 8 voxel per casella, ADR-0049) è quel modello: davanti al viale, la porta
  sulla lettera `porta`, collisione dai voxel (`placeStructure`, `kernel.placeCampus`); senza, il blocco. Davanti alla Galleria dell'Artista, sulla lettera `plinto` (T48b), il kernel posa un'istanza di un modello della libreria scelto a ogni visita della corona (seme dal tick d'arrivo), ridotto a stare sul plinto, senza collisione nuova oltre al plinto. Dentro, le **vetrine** (T21, `SHOWCASES` in
  `corona.ts`): uno schermo (Torre della Magia: ogni runa magica e ogni combinazione nota, nei loro colori; il pannello dice l'effetto in parole, `describeEffect` in `validator.ts`), un silos (Studio dei personaggi: ogni tipo e dopo di lui i suoi individui, ciascuno col seme che ha nel mondo, che fluttuano in un liquido viscoso; il pannello dice l'individuo e il modulo), una stampante
  3 × 3 (T24, `PRINTER`: Laboratorio delle cose, Magazzino degli oggetti; la cosa sulla casella centrale, ridotta a una casella se è
  più grande), un plastico (T26a, Ufficio dei luoghi: un luogo già pianificato in miniatura, `kernel.miniature(cx, cy)` con lo stesso
  codice del mondo, `layoutOf` / `lotsOf` / `placementsOf`, dal chunk o dal piano salvato, senza generare nulla; T26b: le sei fasi del Cartografo,
  `PLACE_PHASES` e `ChunkMiniature.phases` con le griglie intermedie di `layout()` (`stages`) e ciò che ogni fase aggiunge acceso in
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
- **Sala del Concilio e studi** (ADR-0027): tavolo rotondo con l'universo che gira, i dieci membri seduti (con lo Scultore, il Musicista e l'Attore; i posti partono mezzo passo dopo la cima, così nessuno cade sulla colonna dell'uscita),
  teletrasporti verso le sale e ritorno, schermi della storia, stile neon punk; atlante navigabile.

<a id="sala-sistemi"></a>
## Meccaniche, casi dei sistemi, catena e banco di prova

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

<a id="geografia"></a>
## Geografia

- **Geografia** (ADR-0023): biomi nel generatore (`s j o k n`), 20 ambienti nel seme, nodo `stamp` di
  MarkovJunior, atlante di regioni (`world/atlas.json`), direzioni note a NPC e Cartografo.

<a id="partita-viandanti"></a>
## La partita, i viandanti, le rune per ruolo

- **La partita** (ADR-0053, T33): `universe.json → game` (`modalita`, `morte` 0-4, `pvp`, `altroTraGiocatori`; predefiniti:
  singola, 3, no, sì) si sceglie nella schermata della Genesi di un universo mai generato e poi non cambia: `repairGameSetup` (validatore)
  la ripara, `keepGame` riscrive un `universe.json` che dice altro. Va come principio (`gameSummary`) a Narratore, Arbitro, Ingegnere
  e Referente. Alla morte il Narratore (`player.death`) traduce il livello (`DEATH_LEVELS`) in cosa si perde (`perde_tutto` o effetti
  che tolgono) e dove si riparte (`qui | piazza`); `continueAfterDeath` è asincrona; senza risposta vale `fallbackDeath`.
- **I viandanti** (ADR-0054, T34): ogni viandante ha un id stabile (`me` in singola, `src/kernel/wanderers.ts`) e il suo stato
  in `world/players/<id>.json` (da uno `stato.json` vecchio per `me`); `world/state.json` è lo stato del mondo. Il kernel ha un
  registro (`wanderers()`, `addWanderer`); ciò che agisce su «il giocatore» agisce sul viandante che agisce (`wanderer()`), e
  `as(id, fn)`, sincrono (mai attraverso un `await`), fa agire un altro. Legami e ricordi portano `viandante: <id>` (`readPeople`
  migra «Viandante» e `legameViandante` a `me`; `bondWith`, `bondOf`, `memoriesFor`: un individuo non racconta a un viandante ciò che ha
  vissuto con un altro), le missioni `Quest.viandante`; `talk(id, testo, viandante?)` dà al Narratore il nome di chi parla; nel grafo
  `persona:viandante` è `me`, `persona:viandante-<id>` gli altri.
- **Rune per ruolo** (ADR-0057, T37): `game.master` è chi ha creato l'universo multigiocatore (`me` per ora); in singola chi gioca
  è il master di tutto (`isMaster()`) e nulla cambia. In multigiocatore nessuna riga del tappeto (`carpetLine` in `runes.ts`: token del
  tappeto, la runa `concilio`, un binding scritto) nei luoghi; ogni riga gira come chi l'ha incisa (`RuneComp.by`, `as`) e, se non è il
  master (o è generata), le scritture dei binding non arrivano (`K.run_line(key, lock)`, il `Host` dà copie di tappeto e posizioni).
  Il master porta sempre la runa `concilio` (`COUNCIL_RUNE`, `councilStock`): pronunciata o incisa lo porta nella Sala del Concilio
  senza consumarsi, e `core.carpet` non lo tiene (`offCarpet`) finché non rientra nel cerchio. `R`: il rollback del repository è del
  master (ogni runa incisa torna a chi l'ha scritta); un giocatore riprende solo le sue rune (`takeBackRunes`).

<a id="semi"></a>
## Semi condivisi

- **Semi condivisi** (ADR-0055, T35): ogni estrazione della simulazione viene da (seme dell'universo, tick, chi, entità), mai
  dall'orologio. Prima di ogni chiamata nel Lua dell'universo (`runModule`, righe delle rune) il kernel semina `math.random`
  (`seedLua` → `Sandbox.seed`); `math.randomseed()` senza argomenti vale 0; il kernel tira da `rngFor(...sale)`, i nomi unici dal tempo
  del mondo (`worldStamp`). L'orologio solo fuori dalla simulazione (registro, consumi, commit, guasti, misure, schermi).
  Due kernel con lo stesso universo e lo stesso input arrivano allo stesso stato (`tests/determinism.test.ts`).

<a id="carte-crediti"></a>
## Chi paga, le carte, i crediti

- **Chi paga e le carte** (ADR-0056, T36): ogni chiamata ha un `chi` (un viandante o `comune`): lo mette il Concilio con la
  politica di `payerOf` (`src/kernel/cards.ts`: comuni Genesi, sessioni, trame, revisioni, dialoghi tra individui, modelli che mancano,
  pacchetti; il resto è del viandante che agisce), un `chi` esplicito vince; `world/usage.json → paganti`. Ogni contenuto generato
  porta `carta {autore, pagante, titolare}` (moduli, oggetti, ambienti, incantesimi, ricette, modelli, individui, trame, regole giudicate,
  piani dei luoghi): i punti che creano contenuti committano con `commitContent`, che timbra ciò che il cambio porta (`stampFiles`); il
  titolare delle comuni è un viandante estratto col seme (`cardHolderOf`). Gli utilizzi (`luoghi trame prompt`) e le carte dei luoghi in
  `world/cards.json` (`CardUses`, scritto prima di ogni commit); la collezione: `kernel.cardsOf(id)`, `collectionOf`.
- **Crediti e spese comuni** (ADR-0081, T45a, ADR-0104, T125): saldo crediti per viandante nel `Ledger` del kernel (`kernel.ledger`; sul server `universes/.balances/<nome>.json`, fuori dalla storia; `kernel.creditsOf`, `deductCredits`); ricaricato a mano solo dal master, dalla console (`grantCredits`, messaggio `recharge`), entro il tetto al giorno per universo (`QUINE_TETTO_RICARICHE`); il Referente non dà crediti. Ogni chiamata scala dal pagante (`payerOf`) costo modello + commissione di piattaforma (`costWithFee`): la decide solo il server (`QUINE_COMMISSIONE`, `platformFeeOf` in `server/ledger.ts`, predefinita 0,01; 0 è ammesso, un valore che non sia una frazione da 0 a meno di 1 dà il predefinito, ADR-0132), arriva al mondo per valore (`worldEnv`, `KernelOptions.platformFee`, `kernel.platformFee`) e si mostra da lì: `Wallet.commissione` sul sito (`feeText`), `ingresso.commissione` nella console del master (`showPlatformFee`, solo uno specchio); mai da `universe.json`, Lua, Concilio o client. Ricariche e consumi sono lineari, senza fasce né interessi: un credito è un dollaro; i consumi su disco tengono il costo senza commissione, quindi il portafoglio mostra anche i giorni passati alla commissione di oggi; le spese comuni (`comune`) sono divise in parti uguali tra tutti i giocatori collegati in quel momento (`splitCost`), master compreso, escludendo gli anonimi. A crediti esauriti (`crediti <= 0`) o per viandanti anonimi (`anonimo: true`, 0 crediti non ricaricabili): le richieste personali sono risposte dai modelli locali (`MockAiModels`) e il giocatore lo sa (`stato.crediti` nell'aggiornamento, avviso nel feed).
- **Le carte fatte a mano** (ADR-0161, T293; D40 A): un programma (modello o suono) che un giocatore ha forkato nei laboratori e cambiato è una carta della **collezione del suo account, fuori dagli universi**; entra in un mondo solo all'inizio di un universo (T295). La forma (`HandmadeCard`, `src/kernel/handmade.ts`): `id` del server (`handmade-` e dieci caratteri, mai quello dell'originale: un fork non lo sostituisce mai; vale come id di modello), `kind` (`model`, `sound`), `name`, `class` e `size` per un modello, `xml`, `kernel` (il contratto `X.Y` del controllo), `author` (il viandante dell'account, mai agli altri), `from` (`{universe, model}` o `{card}` con l'impronta del programma di partenza) e `origins` (la catena di `heritage.ts`), che **legge il server dal disco** (`resolveFrom`), `made`, `changed`; di una carta fatta a mano si misura il programma (`handmadeFingerprint`). L'archivio: `universes/.handmade/<viandante>.json` (`HandmadeArchive` in `server/handmade.ts`), scritto atomico sotto lucchetto come i saldi, fuori dalla portata di Lua, Concilio, rami, ritorni e mondi; un file illeggibile non si riscrive, e una voce con l'id di una carta che questo kernel non sa leggere (o di un altro autore) resta nel file com'è (`unread`), conta nei tetti e non esce; 50 carte e 2 MiB per account (`HANDMADE_CAPS`), un ritmo di scritture (`HANDMADE_WRITES`), la firma (`signature`) per farsi vedere dagli altri. Le rotte `/api/handmade` (GET elenco senza programmi, `?mine=1`, `/<id>` col programma; POST crea, `/<id>` aggiorna, `/signature`; DELETE `/<id>`): `gate`, poi l'interruttore `laboratori` di `site/beta.json` (`labsOn`; spento rifiutano chiunque e `/lab` resta fuori dal server di produzione), poi l'identità (con gli account si legge anche da anonimi, si scrive da non anonimi); il file da scrivere viene solo dal token; agli altri un elenco (`handmadeSummary`, `handmadeView`: la firma, non l'id; niente catena né impronte). Il programma passa da `handmadeProgramErrors` sul motore vero, con i tetti misurati sul seme (`HANDMADE_LIMITS`, `lab/scripts/carte-mano.ts`: 128 KiB, 2 milioni di celle e 256 di lato, 250 000 passi e 4 s a corsa, ogni seme della classe, azioni e fotogrammi entro 1 s, i suoni con le soglie del Musicista entro 8 s, tutto entro 15 s); nel server di produzione lo controlla il programma dei mondi, un processo per controllo senza segreti, ucciso a 25 s, uno alla volta (`processChecker` in `server/programCheck.ts`, messaggio `check`); in sviluppo e nell'anteprima il processo del server (`inlineChecker`). Nome e firma sono testi ostili (`cleanText`, `cleanCardName`: una riga, niente markup né caratteri invisibili, la quarta parete per il nome). Un programma scritto per un altro contratto torna 409.
- **I laboratori dei giocatori** (ADR-0169, T294): la build di `lab/3d/`, `lab/editor/`, `lab/suono/` è dei giocatori: gli strumenti degli sviluppatori (lo Scultore con Gemini, `lab/3d/sculpt.ts`; le prove, i modelli ufficiali e quelli dell'editor; l'apertura e il salvataggio su disco del SoundLab) ci sono solo fuori da una build (`import.meta.env.MODE !== 'production'`, mai `DEV`, che segue `NODE_ENV`). La barra delle carte (`lab/handmade/bar.ts`, la logica pura in `logic.ts`, le richieste in `client.ts`) sta nell'editor e nel SoundLab: `?fork=<universo>/<modello>` copia un modello o un suono di ciò che il giocatore legge dell'universo (`publicFiles`, `forkables`), `?card=<id>` apre una carta (di un altro solo da provare); «Salva» crea o aggiorna, «Salva come nuova» fa una carta da una propria, i motivi del server si vedono tutti; ciò che non è salvato resta in `localStorage` (`draftKey`, `resume`). Un modello si cambia nell'editor (nella scatola della sua classe, `boxFor`), un suono nel SoundLab; la sandbox mostra i modelli fatti a mano di tutti. L'ingresso è `site/laboratori.html` (le proprie carte, la firma, ciò che si forka); `site/carte.html` mostra le carte fatte a mano di tutti con la firma e il link al laboratorio (`site/carte-mano.ts`). Senza account il viandante è quello per id del sito (`?viandante=`, `quine:sito:viandante`). Per provarli sul server di produzione vero: `npm run build` con l'interruttore acceso, poi `npx vite-node tools/produzione/laboratori.ts -- --porta <n> [--spenti]`.

<a id="multigiocatore"></a>
## Il multigiocatore: server, client, ramo del master, tra viandanti

- **Il kernel sul server** (ADR-0058, T38): ogni viandante ha il suo tappeto (`as` scambia anche lo scorrimento, `holdCarpet`);
  `core.movement` e `core.carpet` (`PER_WANDERER`) girano una volta per viandante mosso dal kernel e vedono solo lui; la tastiera
  muove `inputFor` (`me`); chunk, ritmo, frase e stati di ogni viandante. Un viandante di un client (`setRemote`) non lo muove il
  kernel: il client manda dove è nel mondo e `stepWanderer` lo porta lì al più per il ritmo (`paceOf`), con la collisione del
  cammino. `src/session/`: protocollo JSON (`entra passo frase incidi pronuncia azione altro chat oggetto contenitore fabbrica pannello
  casella dici dai` → `ingresso aggiorna correzione esito rifiuto`), `SessionServer` (messaggi a ogni tick, aggiornamenti a 10 Hz di ciò che è cambiato vicino, credito di passo di
  mezzo secondo, azioni a 3 caselle, chi esce è salvato e lascia il mondo), `fakeLink` nei test. Nel server di Vite il WebSocket
  `/api/session?universo=<nome>` (`server/session.ts`, pacchetto `ws`) avvia al primo client il mondo dell'universo
  (`host.ts`, in un processo suo, `worldProcess.ts`, ADR-0110, T127), solo se è in multigiocatore. Il client resta collegato se il mondo si ferma o riparte (`mondo` nel protocollo, poi rientra da solo). In singola nulla cambia.
- **Il client sottile** (ADR-0059, T39): se l'universo è in multigiocatore `main.ts` entra nella sessione (`socket.ts`, il
  viandante della scheda: `?viandante=<id>` o uno per scheda) e avvia un **kernel specchio** (`KernelOptions.mirror`: niente
  generazione, salvataggi né Concilio; `mirrorTick` muove solo il suo viandante) che `ThinClient` (`thin.ts`) riempie: luoghi →
  chunk (con i lotti), cose → entità con `ENTITY_PARTS`, altri viandanti → entità `remote` interpolate (`FOLLOW`), con arti e
  fumetti. Il passo è predetto e mandato ogni 50 ms, la `correction` lo rimette a posto, oltre 8 caselle il client segue il server
  (`FAR` sul server). Le azioni (`interact perform freeAction talk inscribePhrase dropSelected castSpell action`) vanno al server
  con esito ottimistico (la cosa raccolta sparisce, la porta si apre, la frase incisa lascia la mano), annullato se rifiutato o
  se il prossimo aggiornamento dice altro. Ciò che si porta (T39b): tasche, borse, contenitori (il contenuto arriva nel `result`),
  fabbricazione, pannelli delle meccaniche, azioni e «Altro…» sulle caselle vanno al server, che li fa con `as`; gli spostamenti di
  slot si vedono subito e, finché sono in viaggio, l'inventario del server non li sovrascrive (`pending`). Ogni
  viandante oltre `me` è un seme suo del `viandante` col mantello del suo colore (`wandererColor`, `tinta: N`).
- **I pannelli e i tasti di ogni viandante** (ADR-0139, T263): `MyState.fields` porta, per ogni viandante, il valore di ogni `campo` che
  un `manifest.ui` nomina (`panelFields`: solo testi, numeri e booleani, testi a 200 caratteri); un campo che nessun pannello nomina
  resta sul server (regola 8f). Sul client `takePanelFields` scrive quei campi nei componenti del suo viandante, mai in quelli del
  kernel (`needs`, `states`, `inventory`…). Il client dice al server le direzioni che tiene con `keys` (solo quando cambiano, senza
  risposta, nel ritmo di ogni messaggio); il server tiene solo `up down left right` (`setHeldOf`). Lua le legge con
  `input.held(azione, id)` e vede ogni viandante con `world.wanderers()` (`{id, chi, x, y}`): un sistema che gira una volta sola sul
  server guida un carro con i tasti di chi guida e rilancia la palla a chiunque la tocchi. Da soli tutto come prima.
- **Luoghi nuovi con il lock** (ADR-0060, T40): il chunk ricorda chi lo ha voluto vedere per primo (`Chunk.chi`); se il piano non è
  in `maps/` lo paga lui (la chiamata del Cartografo, la carta del luogo, la Fucina di ciò che il piano chiede). Le bozze si pianificano
  vicino a qualunque viandante fuori dallo studio (il master nello studio o scollegato non ferma gli altri); in multigiocatore al più
  `ai.placesPerMinute` (20) luoghi nuovi per minuto del mondo, gli altri restano bozze (`Chunk.held`). Il Concilio gira solo sul server.
- **Il client del giocatore** (ADR-0061, T41): a un giocatore il server manda solo i file che il client disegna (`playerFiles` in
  `files.ts`, a elenco di campi, ADR-0109: `universe.json` senza `ai`, `models/`, rilievo, atlante, manifest senza storie né `logic` tranne `PER_WANDERER`); prompt, bibbia,
  individui, trame, regole, grafo, carte, consumi e viandanti restano sul server. Il `welcome` dice `master`; il registro del Concilio
  (`concilio`) va solo al master, e `ThinClient` lo versa nello specchio. Corona e strumenti del master (`src/master.ts`: editor,
  console, registro, Genesi, pannelli dello studio, atlante, grafo; `src/render/coronaview.ts`: ciò che il renderer disegna della
  corona) si caricano con `import()` solo dal master (in singola sempre); `window.rune` (e `window.quine`) del giocatore è il `ThinClient`.
- **Chi può scrivere** (ADR-0102, T120): il modello di minaccia e le regole sono nell'ADR. `/api/universe`: `X-Quine-Viandante` su un server senza account, `Authorization: Bearer` con gli account, `X-Quine-Interno` (un segreto del processo) per il mondo di `host.ts`; `GET …/carte` dà le carte misurate sul server e i `publicFiles`. La lobby legge il saldo da `/api/viandante`. `POST …/clone` lo fa solo il master, e nomina il nuovo.
- **Il ramo del master** (ADR-0066, T42b): in multigiocatore i salvataggi validi dell'editor del master sono commit del suo specchio,
  e ciò che l'ultimo ha di diverso dai file del mondo è il suo **ramo**: va intero al server a ogni commit (`ramo`, con l'hash della
  versione del mondo di ogni file), che lo tiene da parte, lo rimanda nel `welcome` del master e lo scrive su disco
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
  (`wanderer:said`/`wanderer:gave` → `notices` nell'`update`; la chat aperta con chi parla, `ui:heard`). Uno scambio sono due doni.
- **«Altro…» e PvP tra viandanti** (ADR-0073, T43b): «Altro…» su un altro viandante solo se `partita.altroTraGiocatori` (`freeOnWanderer`,
  messaggio `altro {viandante, testo}`, entro `GIVE_REACH`), giudicato come su un individuo (`ActionContext.between`); il server applica gli effetti
  sul suo corpo (`touchWanderer`: bisogni, scudo, stati come lui; `spingi` sul suo tappeto, `wanderer:pushed` azzera il suo credito di passo); ciò che
  ferisce (`unharmed`: bisogni che scendono, `spingi`, `fuoco`, `togli_stato`, stati che rallentano) solo con `partita.pvp`; sul master solo `messaggio`.
  Chi lo subisce lo sa (`wanderer:acted` → avviso `altro`).
- **Il profilo del viandante** (ADR-0074, T44a): `Profile {nome, seme, tinta, presentazione}` in `world/players/<id>.json`; `repairProfile`
  (`wanderers.ts`) lo ripara (nome di 2-24 caratteri e non simile a individui o viandanti, altrimenti `freshName`; seme tra quelli della classe;
  mantello né scuro né chiaro né grigio; 4 righe) e `kernel.setProfile` lo fa nome e aspetto (`dressWanderer`). `entra {profilo}` e `profilo`
  nel protocollo, il `welcome`/`result` dicono il profilo riparato e `repaired`; agli altri con `OtherView` (+ `introduction`, «Chi è» nel
  menu). Il Narratore riceve la presentazione come affermazione del viandante. Il client lo tiene in `localStorage` sotto `rune:profilo:<universo>:<id>` (T44c); un profilo già salvato sul server non lo
  sostituisce quello che il client porta entrando, solo il messaggio `profilo`. `P` apre il pannello
  (`src/ui/profile.ts`, una foto del modello per seme).
- **Morte e ricollegamento in multigiocatore** (ADR-0076, T43c): a salute zero un giocatore (mai il master: `mortalDies`) muore sul server con la
  punizione della partita (`continueAfterDeath(id, cause)` concatenata da `die` come lui, senza alzare `dead` né fermare gli altri; `wanderer:died` →
  avviso `morte` con `perso` e `dove`, il client mostra la schermata della morte, `ui:died`, e riparte dove il verdetto dice). `world/players/<id>.json` salva anche `pos {x, y}`: chi esce e rientra ritrova
  posizione, inventario, frase, stati, carte e legami.
- **Il master in god mode** (ADR-0065, T42a): in multigiocatore il master (`game.master`, fisso come la partita) è un dio
  (`godMode`): dopo i sistemi di ogni tick `keepGods` gli rimette i bisogni pieni (non il mana), la morte annunciata da Lua passa da
  `spareGods` (muore solo un giocatore), `applyEffects` sul suo corpo da parte di un altro lascia passare solo `messaggio`. Gli altri
  lo vedono solo nel mondo (`inWorld`: sul suo tappeto, dentro il cerchio, non in un interno); uscito con la runa del Concilio è `partiti`.
- **I giocatori dalla corona** (ADR-0067, T42c): al master il server manda l'elenco dei giocatori collegati (`giocatori`, solo a lui);
  `kernel.players()` (lo specchio: `kernel.connected`; il server: il registro) li mette nel tavolo della situazione (operazioni `giocatore`,
  viola, con «Segui» nel pannello) e nell'atlante. `segui {id}` fa mandare al master ciò che è attorno al giocatore (`Client.watch`);
  `kernel.follow`, `watching`, `watched()`: il renderer (`Renderer.offset()`) mette il giocatore al centro, nasconde corona e viandante
  del master, che resta nello studio; Esc o «Torna» sull'insegna (`#watch`, `master.ts`) la lasciano.
- **I mobili che si spostano, tra molti** (ADR-0168, T292): la presa viaggia in `action` (`prendi`), la posa in `tile` (`_posa`) o in
  `item` (`put_down`; il client sottile manda F così), con il raggio del server e nei messaggi che ci sono, al più `LIMITS.moveRate` (4) al
  secondo e 8 di fila (ogni posa rifà le vie attorno: qualche millisecondo). Due che prendono la stessa
  cosa nello stesso momento: il server fa l'una (`takeThing` è un passo solo), l'altra trova che non c'è più (`outOfReach`); per tutti
  sparisce con l'aggiornamento dopo (`gone`). Di una cosa portata a chi la porta esce solo il seme del suo aspetto (`shownInventory`:
  origine e stato restano sul server), agli altri `OtherView.heldSeed` accanto a `held`, letto solo se è un intero. Il manifest dice
  `takeable` anche ai client (`MANIFEST_FIELDS`): il menu del kernel specchio offre «Prendi».

<a id="account"></a>
## L'account Firebase

- **L'account** (ADR-0082, T44b): in multigiocatore, se il server ha `FIREBASE_PROJECT_ID` nel `.env`, si entra con Firebase Auth
  (Google o anonimo; `src/session/login.ts`, Firebase caricato con `import()`, le impostazioni web da `GET /api/account`): l'ID token va
  nel `join`, il server lo verifica (`firebase-admin` in `server/account.ts`, `SessionOptions.verify`) e il viandante è l'uid
  (`accountWanderer` in `src/session/account.ts`); token falso o scaduto → `refusal`. L'anonimo (`welcome.anonymous`,
  `SessionServer.isAnonymous`, `kernel.isAnonymous`) usa il meccanismo unico dei crediti di ADR-0081: 0 crediti non ricaricabili,
  escluso dalle spese comuni, richieste personali gestite con i modelli locali (`MockAiModels` a crediti esauriti); legandosi a Google
  (pannello `P`, «Lega a Google») smette di essere anonimo (`setAnonymous`), tiene lo stesso uid e viandante e può ricevere crediti.
  `QUINE_MASTER` (uid) è il master `me` degli universi fatti prima degli account. Senza `FIREBASE_PROJECT_ID` (sviluppo, test) vale l'id di
  oggi; in singola nessun account.

<a id="stripe"></a>
## I pagamenti con Stripe

- **I pagamenti con Stripe** (ADR-0083, T45e): ricarica dei crediti in multigiocatore con Stripe Checkout (Google Pay compreso); chiavi solo sul server (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`); creazione sessione via `POST /api/stripe/checkout` verificata dal token account; un anonimo non compra (blocco a monte 403 e a valle sull'accredito); il webhook `POST /api/stripe/webhook` senza `STRIPE_WEBHOOK_SECRET` risponde 503 (e una chiave vera senza quel segreto non apre sessioni, T124), verifica la firma HMAC-SHA256 (`stripe-signature`), valida nomi e id come il checkout, calcola il credito dall'importo pagato (`paidCents`: tasse aggiunte escluse, mai i metadati) e accredita una volta per evento nell'archivio dei saldi (`Ledger.pay`, `Kernel.creditRecharge`, ADR-0104); pannello `P` con saldo crediti in dollari e pulsanti di ricarica rapida (`+5 $`, `+10 $`, `+20 $`). Niente `payment_method_types` (i metodi li sceglie il Dashboard); i Managed Payments di Stripe restano accesi solo con `STRIPE_TAX_CODE` nel `.env`, altrimenti la sessione li spegne; un accredito non fa commit (ADR-0104).

<a id="clone-eredita"></a>
## Il clone e l'eredità

- **Il clone con un altro master** (ADR-0068, T42d): il master non cambia; un altro master è un altro universo. `cloneUniverse`
  (`server/universeStore.ts`, `POST /api/universe/<nome>/clone {nome, master, titolari}`) copia la cartella intera (storia, `maps/`,
  viandanti, carte, consumi; non i rami `rami/*` né i saldi, ADR-0104) e committa ciò che dà `cloneChanges` (`src/kernel/clone.ts`): `name` e
  `game.master` in `universe.json`; autore e pagante delle carte restano, il titolare resta o, con `titolari: 'master'`, le carte
  del vecchio master passano al nuovo (`passCards`). Nella console del master in multigiocatore, scheda «Universo» (`Console.onClone`).
- **L'eredità dei cloni** (ADR-0084, T45c): a ogni clone `inheritCards` (`clone.ts`) allunga la catena di ogni carta (`carta.origini`:
  titolare, universo, impronta MinHash del contenuto, `src/kernel/heritage.ts`) e mette gli utilizzi di allora in `world/cards.json →
  allaNascita`. A ogni utilizzo dopo, risalendo la catena ogni anello passa indietro `base + copia × (1 − cambio)` (`universe.json →
  eredita`, 0,1 e 0,4; `sharesOf`), il resto al titolare; `allCards(files, true)` dà le `quote`, `receivedBy` / `kernel.received(id)`
  ciò che un viandante riceve come titolare di prima.
- **Le carte portate prima della Genesi** (ADR-0170, T295; D39 A): **la radice del contratto** (`server/git.ts`): ogni universo che nasce dal seme (`create` dello store) comincia da un commit fisso, scritto come i byte dell'oggetto di git (`plantRoot`: albero vuoto, `Kernel <kernel@rune.local>` del 2026-11-07, «radice degli universi del contratto X.Y»; `rootCommitText`, `rootCommitId`, uguale su ogni macchina), poi il seme e ciò che è dell'universo; dipende solo da `X.Y` (il seme cambia dentro un contratto), un clone la tiene, la radice non è nel registro del master e non ci si torna; due universi sono **parenti** se hanno una radice in comune (`rootsOf`: `git rev-list --max-parents=0 HEAD`, solo da `server/git.ts`); gli universi nati prima non ne hanno una in comune con nessuno. **La scelta aperta**: `universe.json → cardChoice` (`seed` alla nascita, `clone` al clone; assente vale chiusa), che il kernel toglie con un commit suo quando la Genesi comincia (`runGenesis`) e al primo ingresso (`lockSettings`, chiunque entri; giocare l'universo di esempio è entrare); lo store la ricontrolla (`choiceOf`: la scelta scritta, lo stesso contratto, nessun commit `genesi:` dietro un universo dal seme, nessun mondo acceso né generazione). **Le rotte** (`server/bring.ts`, dentro lo store e la sua coda per universo): `GET /api/universe/<nome>/kin` (solo chi possiede l'universo, mai il mondo: aperta o no e perché, i parenti con la loro versione e, del contratto di questo kernel, le carte che si possono portare, `kinCards`: le voci con una `card` e il programma; con i laboratori aperti le carte fatte a mano del contratto come `handmadeSummary` le dice) e `POST /api/universe/<nome>/bring { cards }` (il client dice solo dove, `{universe, model}` o `{handmade}`, al più 24): ogni carta riletta dal disco (la stessa radice, il contratto letto sul disco com'è, una carta e non il seme, il nome con `cleanBroughtName`, il timbro e la catena con nomi semplici e al più 32 anelli, il programma con `ProgramChecker` come una carta fatta a mano, in produzione in un processo suo), i doppioni prima di partire (`doubles`: due carte con un id, un id che c'è già; 409), tutto o niente (422 con il motivo di ognuna), poi un commit del kernel dei soli `models/` («carte portate prima della Genesi: …»); con gli account un ritmo per master (`BRINGS`). **Ciò che una carta diventa** (`broughtEntry`, `src/kernel/bring.ts`): la voce rifatta campo per campo (classe, taglia e densità ricalcolata, cantina, semi, voto, tinta, autore del programma, scopo di un suono; mai `time`, né i consigli dell'Artista di un altro mondo), `brought` (l'universo, o `.handmade`), la carta con autore e pagante di prima, **il titolare il master**, un anello in più (chi la teneva, dove, l'impronta del contenuto come entra: la voce, o il programma per una carta fatta a mano, che `allCards` misura sul programma); le quote seguono ADR-0084; **nessun saldo si muove**. **Chi la usa**: in singola il pannello «Le carte da portare» nella Genesi (`src/ui/cardchoice.ts`; le carte entrano con «Genera il mondo», `Kernel.bringCards` prende i file scritti), in un clone nella lobby del master prima di «Entra nel mondo» (il mondo non è acceso, li legge partendo); il `ModelDirector` non scolpisce un id che c'è e prende un modello portato della stessa classe, taglia e nome di una richiesta (`reused`, `free`, anche in `runDeferred`); il Cartografo ha nel piano di un luogo le strutture portate per concetto e taglia e il kernel veste il lotto con quella (`structureModelFor`), e alla Genesi gli ambienti che hanno già una musica; il Narratore le figure e le cose per nome; lo Scultore impara dai programmi portati dopo quelli a mano (`examplesFor`); l'Artista scrive la guida sapendo che ci sono e non li rigiudica. I modelli che lo Scultore fa ora sono carte (`model.sculpt`, comune); quelli di prima di 0.5.6 no, e non si portano. Offline (con i direttori accesi) lo stesso mondo con le carte del primo: 21 → 0 programmi chiesti allo Scultore, 21 → 0 giudizi, 68 → 26 chiamate.

<a id="sotterranei"></a>
## I sotterranei

- **I sotterranei** (ADR-0091, progetto di T52a; T52b fatto, da attuare T52c-f): parti delle strutture sotto il suolo, mai un mondo a parte. La voce del modello dice `sotto: N` (1-3, `cellarOf`; la scatola della classe si allunga in basso, `Form.base` = `N · vpt` voxel sotto il suolo): pavimenti, collisione e taglio contano da lì (`levelIn` aggiunge `base`; fuori dal modello e dove non ha voxel sotto il suolo la terra è piena fino a `base`, `surfaces(…, fill)`), dalla cantina si esce solo per la scala, e ogni pavimento sotto il suolo si raggiunge dal piano terra (`groundOfForm`; altrimenti il modello entra senza cantina: `Form.hole` assente, posato comunque più in basso). Sulle colonne della cantina (`Form.hole`) `floorAt` ignora il terreno, sopra la tromba delle scale è aria (`rampBlocks`) e il salto non ci atterra (`floorBelow`, `topUnder`); il renderer posa il modello `kernel.sunk(id)` più in basso e abbassa il terreno delle caselle della cantina al suo fondo (`kernel.holesIn(chunk)`, il buco). Il Cartografo la chiede (`strutture[].sotto`, cose `sotto`); la profondità del terreno si genera come su X e Y (terreni `strato`, bozza per colonna, programma `sottosuolo` dell’ambiente, `strati` nel piano e in `ChunkView`, fino a 2 caselle sotto la cantina più profonda, al più 6). Si vede con il buco del terreno sotto il modello e, per chi sta sotto, un taglio a caselle in un disco attorno a lui con le bande degli strati e la luce attenuata. Nella corona scende solo l’esterno dell’edificio (T52c). **La lettera del suolo** (ADR-0135, T258): un programma con `soil="E"` sulla radice trova quella lettera sullo strato `base`, con `origin="bottom"` al centro, così lo stesso XML serve ogni taglia e scava fino al fondo (`ground="Z"`) con regole senza `steps`; vale per chi la dice, e non con `map`.

<a id="cartone"></a>
## La grafica a cartone

- **La grafica a cartone** (ADR-0093, T89a-e): il mondo si disegna così, sempre; `?classica` mostra il vecchio aspetto per confronto (`cartoonOn` in `src/render/cartoon.ts`). Fasce toon,
  contorni a inchiostro dove cambiano cosa o parte (attributo `part`), mai dalla geometria dei voxel (sugli alberi fa rumore), luce calda con ombre tinte e prospettiva aerea, e la guida di
  stile che chiede parti di colore distinto.
- **Il laboratorio** (T89e): `lab/3d/` e `lab/editor/` hanno un interruttore dal vivo, un bottone «Cartone»/«Classica» (`LabLook` in `lab/look.ts`), perché ricaricare perderebbe il mondo della sandbox e il modello dell'editor: ogni materiale esiste nei due aspetti (`twin`), il bottone li scambia su ciò che è in scena, muove luce, ombre e bloom e tiene l'URL (`?classica`), da cui parte anche il laboratorio. L'inchiostro si accende e si spegne con `Bloom.inked`. Nell'editor col cartone la luce di riempimento è spenta, perché `addShade` legge il sole come unica luce direzionale (l'emisfero fa da riempimento), «Bagliore» spegne l'alone e non l'inchiostro, e in wireframe l'inchiostro non c'è. Le foto del laboratorio (`lab/mjx/`, `lab/banco/`, gli script) restano classiche.
- **Il costo** (T89e): si misura con `lab/scripts/misura-cartone.mjs` (Chrome headless sulla GPU vera); i numeri sono in ADR-0093.
- **Le fasce** (T89a): `lit()` di `materials.ts` dà il `MeshToonMaterial` a tutti i materiali illuminati di simulazione, corona e studio (`MAT`, `solid()`, le
  figure del Concilio, le cornici degli schermi, il disco del tornio). Le soglie non sono tre terzi uguali: i voxel hanno sei normali e con il sole di `SUN_FROM`
  i terzi darebbero solo due fasce; `BAND_EDGES` dà la luce piena al tetto, la mezza luce alle facce verso sud e ovest, la fascia bassa (`BAND_LEVELS`, 0,35) alle
  altre. Le facce lontane dal sole sono anche in ombra portata: `SHADOW_INTENSITY` lascia passare 0,35 di sole, o la fascia bassa non si vedrebbe mai. L'emisfero
  (`CARTOON_HEMI`) è freddo a metà strada, così le facce verticali non vanno al grigio. Le ombre hanno il raggio del filtro a 0 (`SHADOW_RADIUS`). Nello studio il
  sole è acceso (`CARTOON_STUDIO`): senza, nessuna faccia cambierebbe fascia. I voxel luminosi escono dalle fasce in `addGlow` (colore × `GLOW_BASE` + `U.glow`,
  uguale su ogni faccia), solo nello shader toon.
- **La luce e l'aria** (T89c): `cartoonLight(day)` in `cartoon.ts` mescola tre momenti (`PHASES`: giorno, tramonto, notte, agli stessi gradini del cielo) e dà al renderer colore e
  intensità della luce chiave, emisfero, tinta delle ombre e forza del bloom; di notte la luce chiave è una luna fredda, altrimenti tutte le facce avrebbero la stessa fascia. L'ombra
  tinta è `addShade`, un pezzo di shader dopo `lights_fragment_end` (da `toon()` e da `addGlow`): `directLight` lì è ancora il sole con l'ombra già moltiplicata, e confrontato col
  colore del sole dice quanta ombra c'è, senza rileggere la mappa; le facce girate dal sole contano sempre come in ombra; la tinta (`SHADE`) moltiplica luce diretta e indiretta. La
  nebbia è `aerial(distanza, day)`: in 3/4 il suolo va da 0,8 a 1,33 distanze della camera, quindi comincia a 0,85 e la cima dello schermo è già sbiadita; è tutta cielo a 2,2 distanze,
  prima della fine di ciò che il kernel carica (1,1 distanze più un chunk), anche con la camera libera bassa sull'orizzonte; da vicino resta lontana; di notte si accorcia. Nella corona
  e nello studio niente nebbia, come prima, e la luce è `CARTOON_INDOORS`. L'inchiostro sbiadisce con la nebbia (`uFog` in `Ink`). Il
  bloom è più stretto (`CARTOON_BLOOM_RADIUS`, 0,3) e più debole di giorno (0,5) che di notte (0,85). Il classico non cambia. Il raggio della camera delle ombre resta ±22: con la camera
  più lontana della vista predefinita le ombre portate finiscono prima del suolo visibile, come nel classico.
- **I contorni** (T89b): `Ink` in `cartoon.ts` disegna la scena una volta in più prima del composer (senza MRT, che chiederebbe di cambiare ogni materiale della scena; senza rifare la mappa delle ombre), con
  `idsOf` di `materials.ts`: per ogni materiale uno `ShaderMaterial` che scrive rosso = la **cosa** (`thingOf`: la mesh, o `TERRAIN_THING` per terreno e muri di tutti i chunk), verde = l'istanza
  (`gl_InstanceID`), blu = la **parte**, e tiene taglio del cerchio, `CUT` e vento del materiale che sostituisce. L'inchiostro va dove cambia uno dei tre (con gli angoli a metà, perché il bersaglio non ha campioni) o dove la
  profondità salta di oltre `uDepthEdge` caselle (0,6-1,1), misurata sull'inverso della profondità, che su un piano cambia in modo uniforme: un pendio radente non è un salto. Largo un pixel CSS per lato a ogni
  `devicePixelRatio`; niente su ciò che dà luce (l'alfa del fotogramma, `U.glowMask`). Fuori dai contorni: neon e righe del pavimento (`noInk`), ciò che è trasparente e non è voxel (etichette, l'ombra del viandante).
  **La parte di un modello non è la lettera**: i programmi spargono più verdi su una chioma e una riga lungo ciascuno è di nuovo il rumore. `partTable` di `mesh.ts` unisce le lettere che sono sfumature di un colore (in Lab: tinta entro 15°, luminosità entro 25, anche
  passando per una terza; due grigi solo la luminosità), quelle di una stessa `<color part>`, mai ciò che dà luce o è trasparente con ciò che non lo è. Un muro chiaro e una porta scura della stessa tinta restano due parti. Il valore (l'attributo `part`, un byte per vertice) è la
  prima lettera del gruppo, e la cache delle forme è passata alla versione 6. **Il terreno**: la parte è il codice della casella, le facce laterali un'altra (`SIDE_PART`), così un gradino visto di fronte, dove la profondità non salta, ha la sua riga in cima e al piede. **Ciò che
  fa un `Builder` altrove** (corona, studio, sostituti): senza `fixedPart` la parte è il colore della faccia. Una geometria senza `part` lo riceve a 0 dopo il fotogramma, solo se l'inchiostro la disegna: il classico non paga.
- **Le foto e lo stile** (T89d): `photo.ts` con `cartoonRender(px)` disegna i modelli come il mondo, senza three.js e anche in Node: un tono piatto per il piano e uno per il davanti, gli stessi in ombra (`toonTones` di `src/mj/toonlight.ts`, lo shader toon fatto a mano con i numeri del sole di giorno, che `cartoon.ts` legge da lì), ombra a terra fredda, e `inkRaster`: un pixel per lato dove cambia la parte, sulla sagoma o dove la profondità salta di almeno 12 voxel, mai su ciò che dà luce. Ciò che dà luce tiene il suo colore. Le usano l'Artista (`views`: disegnate alla grandezza a cui le guarda, non ingrandite dopo, o l'inchiostro sarebbe un voxel intero) e il tornio della Galleria, **sempre**, anche con `?classica`: il giudizio gira anche sul server. Il laboratorio e le carte del sito restano alle foto classiche. Le **icone** (`thumbs.ts`) sono del client e seguono l'interruttore: con il cartone usano `lit`, la luce di giorno (qualunque ora sia nel mondo: `SHADE` si rimette a posto dopo lo scatto) e `Ink`; la scena si disegna due volte, con il segno di ciò che dà luce nell'alfa per l'inchiostro e senza per l'alfa finale, che sennò cancellerebbe i voxel luminosi. La guida del seme, i prompt di Artista e Scultore e la richiesta `genesis.style` chiedono ciò che i contorni sanno disegnare: un colore pieno per parte, parti vicine staccate di luminosità (la soglia di `partTable` detta a parole), dettagli come lettere scure, forme tozze, ambiente smorzato e pochi accenti; il giudizio guarda anche se le parti si leggono a contorni.

<a id="mondo3d"></a>
## Il mondo in 3D, bozze di prova, mappa, voxel luminosi

- **Il mondo in 3D** (ADR-0040, 0047): three.js, camera in 3/4 da sud che gira liberamente trascinando col tasto centrale
  o a quarti di giro (`,` `.`), zoom in/out con rotellina; l'input traduce le direzioni dello schermo in quelle del mondo
  con l'angolo continuo, così il movimento del kernel resta in coordinate del mondo e `W` va sempre in alto; in simulazione l'orbita
  è orizzontale e lo zoom non supera la vista predefinita, da master (god mode) o nella corona la rotazione e lo zoom sono liberi in
  tutte le direzioni; un'unità = una casella, kernel (x, y) = three.js (x, z). La simulazione (chunk, cose, rune) è in coordinate del
  tappeto e si disegna spostata del suo scorrimento; viandante, corona e studio in coordinate reali; quando la corona si
  vede, nulla della simulazione si disegna oltre il cerchio (un taglio nello shader). Testi, fumetti, «E», passaggio del
  mouse e glitch su uno strato 2D sopra. Il tasto destro sceglie la casella con un raggio sul terreno.
- **La GPU** (T330): ogni `THREE.WebGLRenderer` del gioco, del laboratorio e del sito nasce da `makeRenderer` (`src/render/gpu.ts`), che chiede `powerPreference: 'high-performance'` (`GPU_PREFERENCE`): su un portatile con due GPU il browser prende la dedicata. La GPU in uso (`gpuName`, da `WEBGL_debug_renderer_info` se il browser la dà) è in console come `window.gpu` e in una riga `[gpu]` all'avvio; resta nel client. `tests/gpu.test.ts` legge i sorgenti: nessun `new WebGLRenderer(` fuori dall'aiuto.
- **Il glitch dei guasti** (T316, WCAG 2.3.1): `src/render/glitch.ts` è un piano dell'orologio, non del frame (`glitchPlan(t, intensità, fermo)`, puro): niente lampi né inversioni a pieno schermo, strappi e blocchi di rumore stretti che restano `HOLD` (0,4 s: meno di 3 cambi al secondo), glifi che vivono 1,6-2,8 s e appaiono e spariscono sfumando, l'intensità che sale in circa un secondo (`GLITCH_EASE`); la crepa rara del mondo sano è un arco di 0,8 s (`crackLevel`). Con `prefers-reduced-motion` restano solo scanline, tinta e fantasma, fermi; il riquadro dei guasti respira piano (`faultpulse`). `tests/glitch-safe.test.ts` lo misura con un orologio finto.
- **Bozze di prova**: `kernel.sampleDrafts()` (una boscosa, una aperta, una con acqua, scelte in modo deterministico) è dove il
  validatore prova i programmi degli ambienti e dove il campionario li mostra.
- **Mappa** (ADR-0011, 0040): caselle colorate per terreno, strati `ground floor wall door liquid vegetation rock`: l'acqua è
  più bassa con le sponde, i muri sono estrusi, le porte un varco sotto l'architrave; gli edifici dei luoghi non sono più caselle ma strutture; sulle caselle con `TerrainDef.model` (bosco, roccia) stanno istanze di quel modello, ruotate e spostate.
- **Voxel luminosi** (ADR-0046): `<color glow="True">` fa brillare una lettera (fiamme, finestre, rune, neon): attributo
  `glow` nelle mesh, senza occlusione, emissione nei materiali; il renderer disegna in un target con la maschera del
  bagliore nell'alfa e un bloom leggero prende solo ciò che brilla (`src/render/bloom.ts`); nelle foto non prende ombra.
- **Ciò che si impugna** (ADR-0167, T288): ciò che una figura impugna (`inventory.equipped`) si disegna con la mesh che l'oggetto ha a terra, la stessa geometria condivisa di ogni istanza (`geoOf`), appesa al perno del braccio del suo **punto di aggancio** (`MOUNTS` in `src/mj/hold.ts`, uno per punto: `hand`, la mano destra, per tutto; `forearm`, l'avambraccio sinistro, per lo `scudo`, letto anche come `shield`), quindi oscilla con il passo e gira con il corpo. Tutto viene dai voxel, senza una tabella per oggetto. La **mano** (`handsOf`) è l'estremità libera di ogni braccio del rig: in basso per un braccio lungo il fianco, in alto per uno che non scende a metà del corpo (il braccio alzato di metà dei semi del viandante); la figura guarda verso le y grandi, la sua destra è x piccola; `modelObject` la legge una volta per forma e la accoppia al perno del worker per giunto, il sostituto ha la sua. La **presa** (`gripOf`) prende gli assi principali dei voxel: ciò che è lungo si tiene per un'estremità (quella che non brilla, poi quella di legno, poi la più leggera, poi quella accanto alla fetta più larga, un'elsa; altrimenti dal basso), lungo l'asse del manico se il manico è un'asta, e punta avanti, in fuori dal fianco, un poco in giù (in su da una mano alzata; `aimOf`, `HOLD_AIM`) con la larghezza in piano e il grosso avanti, così si legge da ogni quarto di giro della camera; ciò che è spesso al centro (un arco) si tiene al centro, in piedi; ciò che è piatto è lungo dove le sue estremità differiscono di più (le forbici); ciò che è compatto pende dalla cima, sopra il suolo; nulla supera l'80 % del corpo (`MAX_SHARE`); lo scudo guarda fuori dall'avambraccio. La posa (`holdPose`) è nel sistema del perno. Il renderer (`hold` in `src/render/held.ts`) legge la presa di una forma una volta (`gripFor`) e a ogni fotogramma non cerca niente finché l'oggetto, la sua definizione e `forms.version` restano: un cambio fa due oggetti three.js, nessuna griglia né geometria. Un oggetto senza forma pronta o che il client non conosce, un corpo senza braccia (la contadina, gli animali), un inventario scritto male non mostrano niente. In multigiocatore `OtherView.held` porta l'id dell'oggetto impugnato (a elenco, regola 8f: dell'inventario nient'altro), il client sottile lo mette in `remote.held` (`heldBy`) e arriva a chi è vicino con il prossimo `update`. Gli individui non hanno niente in mano: nessuna API lo dà loro (il renderer lo mostrerebbe da un loro `inventory.equipped` in singola; sul filo mancherebbe il campo). Le mesh di una forma le fa `formMeshes` (`src/render/formmeshes.ts`), nel worker e nei test. Costo: in Node 60 portatori costano quanto 60 mani vuote entro il rumore, 60 cambi insieme 3 ms; nel browser (cartone, RTX 2070) il fotogramma intero 4,72 contro 4,24 ms, tre chiamate di disegno per mano (scena, ombre, inchiostro), 3 geometrie per 60 mani. La tinta di un modello si legge anche in `hsl()` (`hexColor` in `Forms.request`): prima la lettera tinta degli oggetti del Narratore spariva. Catture in `docs/catture/T288/`.
- **Sopra la testa** (ADR-0168, T292): una cosa del mondo portata (`thing:<modulo>`) va sul punto di aggancio `overhead`: sul **corpo**
  (dondola col passo, non col braccio), dritta, la fronte dove guarda il corpo, il fondo sulle mani alzate o sulla testa (`overheadPose`,
  `raisedHand`, `boxOf` in `src/mj/hold.ts`; `boxFor` legge la scatola di una forma una volta), il lato più largo al più 0,48 e
  l'altezza al più 0,5 dell'altezza del corpo (`OVERHEAD`, scelti sulle catture: a grandezza piena copre il viandante); le braccia
  restano alzate finché la porta (`animateLimbs`, `overheadTurn`: un braccio già alzato dal modello resta com'è). La mesh è quella di
  terra della sua forma, con il seme dell'istanza (`heldSeedOf`: dalla tasca per il viandante, da `remote.heldSeed` per un altro).
  Catture in `docs/catture/T292/`.

<a id="markovjunior-modelli"></a>
## MarkovJunior, i modelli, la cache delle forme

- **MarkovJunior** (ADR-0036, 0038): l'XML di MarkovJunior letto alla lettera (palette ufficiale, strati dall'alto,
  simmetrie, `map`, `convolution`; 16 modelli 3D ufficiali girano invariati), più `<color part hidden glow>`, forme di
  base, `<animation>` e `<action>` (regole sul modello finito: la porta si apre); il front-end ripara le forme
  sbagliate dagli agenti. Il codice è in `src/mj/`; il laboratorio (`lab/`, `lab/README.md`) serve ad analizzare e
  correggere i programmi che il Concilio non riesce a scrivere (sandbox 3D `/lab/3d/`, sezioni, foto, prove con Gemini).
- **Pattern nei figli, regole da file, programmi inclusi** (ADR-0171, T333): un lato di una regola si scrive come attributo
  (`in="…"`) oppure come testo di un figlio `<in>`/`<out>` (stessa sintassi, gli strati anche su righe diverse, una `/` può
  chiudere una riga, `#` è una nota; i due insieme sono un errore), oppure si legge da un file di testo di `models/`
  (`fin`, `fout`; `file` con in, una riga `->`, out). `<import file="x"/>` esegue lì il programma di `models/x.xml` sulle sue
  lettere (ne vengono lettere, colori e unioni, quelli di chi include vincono; non la scatola, `origin`, `ground`, `soil`,
  suono, animazioni, azioni). Il compilatore (`src/mj/model.ts`) non legge il disco: `compileMjx(xml, { files, self })` riceve i
  testi per nome semplice (`MJX_FILE_RE`), raccolti da `mjxIncludes(xml, read)`: `Forms.includesOf` dai file dell'universo, il
  validatore da `Validator.modelFile`, il laboratorio da `lab/mjx/models/` (`LAB_FILES`, `labIncludes`). Tetti: 6 inclusioni una
  dentro l'altra, 64 per programma, un milione di caratteri letti; i cicli e i file che mancano sono errori col file e la riga.
  L'inclusione avviene nella compilazione: il motore riceve gli stessi nodi e non cambia. `FormRequest.files` porta i file al
  worker, `formKey` e l'hash di `Forms` li contano: cambiare un incluso cambia la forma di chi lo include, un programma che non
  include nulla tiene la chiave. Il validatore controlla anche i `.txt` di `models/` (`ruleFileErrors`). Nel laboratorio il
  modello di prova è la torre merlata (`torre-merlata.xml` + `merli.xml` + `torre-porta.txt`).
- **Modelli** (ADR-0041): ogni cosa ha un programma della libreria `models/` (`appearance.model`, `ItemDef.model`,
  `TerrainDef.model`; senza, il generico della sua classe; gli oggetti senza modello il generico `oggetto` nel loro
  colore); un'istanza è un seme (pochi per tipo). Densità: 20 voxel per casella, o la `vpt` della voce in `models/index.json`
  (ADR-0049; la forma la porta in `Form.vpt`). `src/kernel/forms.ts`: programma + seme → griglia, impronta,
  pavimenti, azioni (in Node le esegue il kernel, nel browser i worker, che fanno anche le mesh). Componente `form`
  `{model, seed, yaw, tint, done, wanted}` (`wanted`: il modello suo, indossato appena lo Scultore lo scrive). Le cose solide bloccano con l'impronta dei loro voxel; le `<action>` del modello
  sono nel menu dell'entità e restano fatte (`stato.json → forme`). Persone e animali camminano con gli arti, la
  vegetazione al vento, le `<animation>` girano; le icone sono foto dei modelli.
- **La cache delle forme** (ADR-0108, T161): in Node ogni `InlineRunner` usa `sharedForms`, una per processo: un programma con un seme gira una volta per tutti i kernel (il primo boot ~10 s, i successivi ~0,25 s). La chiave (`formKey`) è il testo intero, il seme, la scatola e la tinta, più `base` per i soli programmi con la lettera del suolo (ADR-0135: le chiavi degli altri non cambiano, `FORMS_DB_VERSION` nemmeno); si tiene solo ciò che ha finito, congelato (`cells` lo scrive solo `act`, sulla copia di `instanceGrid`: mai sul risultato); LRU, 4096 voci e 256 MB; non si svuota. Nei test anche su disco (`tests/setup/forms-disk.ts`, `node_modules/.cache/quine-forms/`), mai nel gioco né sul server: chi fa dipendere il motore da un file nuovo lo aggiunge a `engineVersion`. Sempre solo nei test il rilievo (`tests/setup/relief-memo.ts`, T160: `Hills` per seme e programma; `relief.test.ts` e `determinism.test.ts` lo fanno girare davvero). Nel browser restano i worker: `WorkerRunner` tiene anch'esso solo ciò che ha finito, in memoria e in IndexedDB (`FORMS_DB_VERSION`, T163), sotto `formCacheKey`: `formKey` più ciò che cambia le mesh (T164). Su questa macchina IndexedDB solo sulle porte 5173 e 4173 o con `?formecache` (`keepsFormsOnDisk`, T177): ogni altra porta è un'origine nuova, e lasciava 0,5 GB nel profilo di Chrome. Il tetto del browser (T175, ADR-0108) è a tre piani, perché gli stessi array li tengono in tre: `WorkerRunner.memory` (128 MB, LRU: ciò che esce perde le mesh anche per il `Form` che lo tiene, `meshesGone`), le geometrie che nulla disegna (`trimGeometries`, 128 MB, mai ciò che è nella scena né ciò che è stato chiesto da meno di 30 s) e IndexedDB (`IdbFormStore`, 4 GB di array, LRU con l'archivio `uses`). Una forma tolta torna da sola: `geoOf` chiama `Form.remake` e intanto dà `undefined`, come per un modello non pronto. L'anello della corona, lontano dal bordo da 60 s, si toglie (T226). In IndexedDB griglie e mesh stanno in due archivi (T212, `forms` e `meshes`): un caricamento legge le griglie di tutte le forme, che il kernel vuole subito (`FormRunner.withoutMeshes`), e le mesh solo di ciò che si disegna (`geoOf` → `Form.remake`, e la geometria si fa all'arrivo). Le mesh le legge un worker, che decodifica fuori dal thread della pagina e cede i buffer (T215, `IdbFormStore.meshReader`, prima dei programmi in coda); se non trova nulla legge la pagina, come chi non ha worker. La sfera di ingombro di una geometria la calcola three quando la disegna.
- **Il motore sulle griglie grandi** (ADR-0142, D33): `src/mj/engine.ts` tiene un censimento delle lettere per riga (`Census`, aggiornato da `write`); una scansione intera di un pattern guarda solo le righe dove può stare la sua cella più rara, nello stesso ordine di prima, e `conv` salta le righe senza celle d'ingresso. L'ordine delle chiavi di `MatchSet` fa parte dell'esecuzione: ogni ottimizzazione lo conserva, e `tests/mj-engine-determinism.test.ts` confronta l'impronta di ogni modello del seme e dei riferimenti del banco con `tests/fixtures/mj-engine-hashes.json` (presa col motore di prima; si rifà solo con `lab/scripts/mj-hashes.ts -- --scrivi` e un motore di cui ci si fida). La cantina a Enorme è passata da 5,6 s a 0,5 s; `lab/scripts/bench-engine.ts` misura.
- **Il passo persistente** (ADR-0164, T315): `Stepper` in `src/mj/engine.ts` tiene un programma compilato sulla sua griglia fra una chiamata e l'altra, con il suo generatore e il suo censimento, per ciò che si muove un poco a ogni tick di una pagina. `advance(n)` prosegue la stessa corsa: a pezzi è la corsa di `runOn` con lo stesso seme, voxel per voxel (`tests/mj-stepper.test.ts`). `tick(n)` rifà il programma dal primo nodo, come un `runOn` nuovo, ma i nodi tengono le corrispondenze e le aggiornano dal registro della griglia (`rewind` invece di `reset`, solo mentre il flag `keeping` è acceso): stesse regole, un altro ordine delle corrispondenze, quindi non la corsa di `runOn`; il registro ricomincia oltre 4 volte le celle. `run` e `runOn` non cambiano (il flag è spento per loro, `tests/mj-engine-determinism.test.ts`). Sulle luci della veste futuristica un tick costa un quarto di un `runOn` (0,08–0,11 ms contro 0,33–0,41 a 1× sulla scritta), nel banco meno dei cicli scritti a mano; nella pagina a 4× quanto loro, a meno di qualche punto (ADR-0164). Con lo stesso vincolo il nodo `path` non fa più un array per cella (stessi vicini, stesso ordine, stesse estrazioni: `tests/mj-path.test.ts` ha le impronte prese prima): la soluzione di un labirinto di 5115 celle passa da 9 a 2,6 ms la prima volta.
- **Il vetro di un modello** (`<color alpha>`, T217): la geometria ha un gruppo per l'opaco e uno per il vetro (`opaqueCount` di `src/mj/mesh.ts`), e con un solo materiale three disegna entrambi con quello: il vetro esce pieno. Ogni mesh della geometria di un modello prende i materiali da `modelMaterials` (`src/render/models.ts`), che accoppia `MAT.corona` e `MAT.coronaSway` a `MAT.coronaGlass`, `MAT.cut` a `MAT.cutGlass` e il resto a `MAT.glass`.
- **Oltre il cerchio niente materiali tagliati** (T218): `MAT.world`, `MAT.sway` e i vetri di simulazione scartano ciò che sta oltre `U.clipR` appena la corona si rivela, ma le ombre del campus no: un modello del campus con quei materiali lascia solo l'ombra. La vegetazione del campus usa `MAT.coronaSway` (`windy` di `materials.ts`: lo stesso vento, senza taglio), scelta da `geo.sway`.

<a id="suono"></a>
## Il suono

ADR-0123. Un programma sonoro è un programma MarkovJunior con `<sound>` sulla radice, sul motore di sempre.

- **La griglia è la partitura** (`scoreOf`, `src/mj/sound.ts`): X il tempo in sedicesimi, Y la traccia, Z l'altezza sulla scala. N nota, S sustain, A accento, G ghost, K cassa, H hi-hat (aperto da Z = 4), C rullante; ogni altra lettera è muta. Le tre voci `lead`, `pad` e `bass` stanno un'ottava l'una dall'altra; una A su Z = 0 del basso è anche una cassa.
- **`<sound bpm scale root swing cutoff space>`** con i `<track y instrument volume>`: i parametri stanno nell'XML, ciò che manca è il predefinito del SoundLab, ciò che è fuori range torna con la riga. Scale in `SCALES`.
- **Una sola fonte** (`renderScore`, `src/mj/synth.ts`): partitura + seme → campioni mono, senza Web Audio, orologio né `Math.random`. `renderSoundProgram` fa tutta la strada dal testo; il browser suona quei campioni e basta. Non si scrive un secondo sintetizzatore: un suono nuovo passa da qui.
- **Tetti**: `MAX_EVENTS`, `MAX_SECONDS`, `SOUND_LIMITS`, `SOUND_MAX_STEPS` e i secondi di voci di una resa; ciò che resta fuori lo dice `truncated`. Il segnale non supera mai 1: oltre 0,98 si scala tutto.
- **Dove stanno**: `models/suono-<id>.xml` con `class: "suono"` in `index.json`; `soundPrograms(files)` li elenca. `suono` non è tra le `CLASSES`. Il validatore (`modelErrors`) chiede che finiscano e che la partitura non sia vuota. I quattro preset del SoundLab sono nel seme.
- **Il SoundLab** (`/lab/suono/`, T222): la pagina per scrivere, ascoltare, correggere e salvare un programma sonoro a mano. Non ha voci: programma e sintetizzatore girano in due worker (`lab/suono/worker.ts`; chi esegue i programmi si uccide dopo 8 s senza risposta, senza scadenze dentro la corsa, perché l'orologio non sceglie le note), e `LoopPlayer` (`player.ts`) suona i campioni; una resa nuova parte allo stesso punto del ciclo e si dissolve sulla vecchia in 60 ms, ed è così che una manopola non scatta. Tutto ciò che si salva sta nel testo, toccato sul posto e mai riscritto da un albero (`logic.ts`): le manopole scrivono in `<sound>`, il volume in `<track>`, il seme in un commento sulla prima riga. Il muto è solo ascolto.
- **I ritocchi** (`retouch`, `lab/suono/logic.ts`): ciò che il piano roll cambia rispetto alle regole diventa una serie di `<box>` in fondo alla `<sequence>` radice, tra due commenti, così il file dice tutto e il gioco suona la stessa griglia; stanno sopra a ciò che le regole scrivono con ogni seme. `retouch` riesegue il risultato e confronta: se la griglia non torna (una radice che non è una `sequence`, un programma che non arriva in fondo) non scrive nulla e la pagina lo dice. Si dipinge solo sull'ultimo passo.
- **L'analisi** (ADR-0125, `src/mj/soundanalysis.ts`, comando `lab/scripts/mjx-sound.ts`, guida `lab/banco/suono.md`): dalla partitura e dai campioni veri un rapporto in testo, identico a ogni giro, con la partitura parola per parola, le misure per seme e per traccia, il segnale e lo spettro. `SOUND_THRESHOLDS` dice i difetti `empty`, `flat`, `repetitive`, `off_key`, `off_volume`, `seam` (nei messaggi con le parole di prima): un limite parla quando lo passa più di metà dei semi (solo «non finisce» e «partitura vuota» bastano su un seme), e sotto una battuta il programma è un effetto, senza `piatto` né `ripetitivo`. Il validatore usa le stesse soglie su tre semi con un solo rendering, e nessuno se la partitura basta già a rifiutare.
- **Nel gioco** (T224, ADR-0126): il suono è del client, senza messaggi. Il **direttore** (`SoundDirector`, `src/audio/director.ts`) guarda due volte al secondo `coronaRevealed()`, l'ambiente del luogo e il momento del giorno; `chooseMusic` è pura. Tiene conto del campo `suono` in `models/index.json`: `uso` (`music`, `effect`), `ambienti` (uguale o contenuto nell'id: `castello_nero` è un castello), `momenti`, `oltre`, `effetti`; senza quel campo un programma è solo del SoundLab. Vince chi nomina l'ambiente, poi chi non ne nomina nessuno, poi uno degli altri secondo il nome dell'ambiente; il seme viene da universo, ambiente, momento e variante.
- **Sette brani, nove effetti**: `sound-music-pastoral`, `woods`, `stone` (mattina e giorno), `deep` (sotterranei e rovine, a ogni ora), `sunset`, `night` (ovunque all'aperto), `beyond` (solo fuori dal tappeto e nello studio); `sound-effect-rune`, `item`, `arpeggio`, `spell`, `fault`, `rollback`, `threshold`, `jump`, `death` (gli effetti che il gioco chiama, T307b). `SOUND_CUES` dice quale momento del gioco chiama quale effetto e con quali semi. I brani sono scritti a teste che camminano: una testa d'armonia lascia una radice ogni battuta, da cui nascono basso e pad, una di melodia avanza nel tempo e sale o scende, una segna le battute della batteria. Passano tutti le soglie dell'analisi (T228, numeri in `lab/banco/suono.md`), tranne `suono-effetto-morte`: uguale su ogni seme, quindi `ripetitivo`. È una scelta dell'autore e resta così: il gioco lo suona, il validatore rifiuta di ripubblicarlo senza una variazione tra i semi; i test lo sanno (`keptByTheAuthor`, `tests/helpers.ts`). L'analisi non conosce `uso`: un effetto di una battuta o più si misura come un brano.
- **I tempi**: un cambio di luogo aspetta 4 s stabili e si dissolve in 3 s, così un confine non fa sfarfallare; oltre il bordo si cambia subito. Ogni 75 s il brano diventa un'altra delle sue 4 varianti (un altro seme, allo stesso punto del ciclo).
- **Il percorso**: `SoundRenders` (`renders.ts`, un worker, musica davanti agli effetti, 64 MB in memoria, cane da guardia a 20 s) → `worker.ts` (IndexedDB `quine-suoni`, 256 MB, sulle origini di `keepsFormsOnDisk`; alza `SOUND_CACHE_VERSION` se cambi ciò che esce dal sintetizzatore, un test te lo ricorda) → `prepareSound` (`prepare.ts`: il passaggio che gira, o l'effetto senza silenzio finale) → `Sfx` (`sfx.ts`: solo guadagni e dissolvenze). Ciò che fallisce tace. Volume e muto nel pannello d'aiuto (`H`), in `localStorage`. Dalla console: `window.suono` (`sfx.outputRms()`, `director.now`, `renders.measures`, `renders.failures`).
- **Le misure** (T224): Chrome headless, RTX 2070, ?skip&offline, turni da 15 s: 59,2 e 60,0 fps senza suono; 60,0 durante il primo rendering e 60,0 e 60,0 con la musica; p99 16,9 ms, il frame peggiore 17 ms contro i 183,6 di un caricamento senza suono. Un brano si calcola in 0,6-1,1 s nel worker (in Node 0,8-1,7 s), un effetto in 3-48 ms, tutti e 22 in circa 0,3 s; dal disco i 22 effetti in 80 ms in tutto. Un brano pesa 3,1-6,0 MB, gli effetti insieme 5,8 MB; dopo aver sentito sette brani la memoria della pagina tiene 36 MB (tetto 64), e ciò che suona ne ha una copia in più nell'AudioBuffer. Livelli all'uscita, volume 70 %, RMS massimo su 46 ms: musica 0,02-0,11; effetti 0,03-0,14; muto 0.
- **Il Musicista** (T225, ADR-0127): `sound.compose` (`src/kernel/agents/composer.ts`), prompt `prompts/agents/musician.md`, modello `ai.sculptors.musician`. Risponde con nome, programma e scopo; il kernel prende ciò che il mondo sa nominare, e un programma che non passa il validatore, i nomi del mondo (regola 0) o i 32 passi di un brano torna indietro col motivo, due volte al più. `ScoreDirector` (`src/kernel/scoredirector.ts`, `kernel.composing`): un ambiente di un luogo caricato che nessun programma nomina riceve il suo brano di giorno, entro `ai.maxPieces` (8) e il coefficiente `brani`, spese comuni; con il seme non chiede nulla, perché il seme li nomina tutti. Il viandante chiede al Referente (incarico `musica`) o al Musicista con `E`, e paga: senza un ambiente nominato il brano è di dove sta; un effetto prende l'id del programma di quell'effetto e lo sostituisce. In `chooseMusic` chi nomina l'ambiente per intero batte chi ne nomina una parte, e tra pari suona l'ultimo dell'indice. Provare il prompt: `npx vite-node lab/scripts/musicista-prova.ts -- <cartella con il .env> --max 10`.
- **In multigiocatore** suona ciò che il client sa: musica e raccolte, iscrizioni, incantesimi, ritorni, morte. Il client non riceve `item:crafted` né `forge:done` e non salta da sé, quindi quei suoni restano del gioco in singola.

<a id="rilievo"></a>
## Il rilievo

- **Rilievo** (ADR-0048): il terreno ha le altezze. `Relief` (`src/kernel/relief.ts`) fa girare `Hills` di MarkovJunior
  (o `world/rilievo.xml`) su due scatole di lati 64 e 45, lette come piastrelle che si ripetono e rammendate; il livello
  di una casella è la somma (un livello = un quarto di casella, fra vicini al più due: si sale sempre, non è mai un
  ostacolo). Il mare sta al suo livello (`universe.json → relief.sea`, o `Relief.sea`), la terra mai sotto; ogni specchio
  d'acqua è piano per intero attraverso i chunk caricati, al suo livello più basso e mai sopra la riva, con sponde che
  scendono di due livelli a casella (T51a, `worldLevels`: un campo per il mondo caricato, uguale in qualunque ordine arrivino
  i chunk; `Chunk.levels` ridisegna chi cambia livelli); ogni lotto è piano, con un anello
  attorno, e il resto del chunk si piega verso di lui lasciando il bordo al campo (`chunkLevels`). `kernel.groundAt(x, y)` è l'altezza del
  suolo, `floorAt` la comprende (i modelli stanno sul suolo sotto il loro centro); il renderer disegna colonne con i fianchi e
  posa tutto sul suolo. Corona e studio restano piani.

<a id="acqua"></a>
## L'acqua che scorre

- **L'acqua che scorre** (ADR-0094, T51b): un automa cellulare del kernel (`src/kernel/water.ts`, `kernel.water`): letto e quantità
  d'acqua per casella, scorre verso i vicini più bassi solo dove qualcosa è cambiato (100 passi al secondo, `waterTick`), si ferma in
  equilibrio, conserva la quantità, il mare è una sorgente. `kernel.dig(col, row, delta)` scava o alza il suolo (lo strumento di T57c e
  di «Altro…» che scava); il piano tiene `scavi` e `acqua` (il campo di `worldLevels` li prende: la superficie dell'acqua che ha scorso
  è fissata), le caselle che si riempiono o si asciugano cambiano tipo con `setTile`; il client sottile li riceve nel `ChunkView`.
  MarkovJunior resta per generare.

<a id="lotti"></a>
## Lotti e strutture, scale e piani

- **Lotti e strutture** (ADR-0043): ogni edificio del piano è un lotto con una struttura (entità `struttura`, origine
  `<chunk>#s<i>`): il modello `edificio`/`grande` o `struttura-<concetto>` chiesto dal Cartografo sui lotti più grandi,
  al centro del lotto, girato verso la porta; le caselle del lotto tornano terreno. Dentro = sul pavimento del modello
  (`placeInside`, `floorAt`, `structureAt`); il renderer taglia la struttura in cui si è. I punti di quel pavimento
  (`interiorPoints`, anche le case degli individui) sono il centro di finestre di `INDOOR_REACH` voxel per lato, ogni colonna
  guardata, dove un corpo sta sul piano terra con le regole di `free` (`block` e `rampBlocks`, T281); `placeInside` scarta quelli
  dove `free(x, y, INDOOR_R)` trova ciò che c'è già (un banco, un forziere). Aspetta la forma finché il suo programma corre (`Forms.settled`, al più `SETTLE_CAP_MS`): nel browser una struttura arriva dal worker in decine di secondi. Le scale sono rampe (T53a):
  ogni colonna di voxel ha il suo pavimento, ci si sale se è più alta al più di un gradino (0,2 caselle) di quelle vicine
  (`bodyGround`, `rampBlocks` in `forms.ts`); un muro resta un muro. Le strutture hanno più piani (T53b): una colonna ha un
  pavimento per ogni tratto di pieno (`surfaces`, `Form.levels`), il corpo sta su quello più vicino all'altezza dei suoi piedi,
  `pos.z`, che il kernel tiene dopo ogni tick (`settleHeights`) e che `free`/`free_real`/`floorAt` prendono (senza: il piano terra);
  il renderer taglia sopra il piano in cui si è.
- **Le strutture che crescono** (ADR-0160, T156): la classe `structure` da Grande in su ha il prompt procedurale del banco (T182),
  la parte di `prompts/agents/sculptor.md` dopo `<!-- strutture -->` (`sculptorRole(files, true)`, `procedural`), senza esempi della libreria:
  lo scheletro è nel prompt, e offline è la risposta dei modelli locali (`skeletonOf`). Il programma non ha una `size` sua (`withoutSize`):
  gira nella scatola della taglia di ogni voce. `checkProgram` lo prova a `STRUCTURE_SEEDS` semi alla sua taglia e al primo seme della
  successiva (`triedSizes`), verificando che vi siano almeno due piani raggiungibili a piedi dalla porta (`reachableStoreys`, ADR-0162), e dice dove cade (`failedAt`); la seconda richiesta (il difetto o la revisione dell'Artista) porta la traccia di
  quel seme (`traceOf`, T179). L'id ha la taglia se non è Grande (`structureModel`: `struttura-<concetto>`, `struttura-<concetto>-huge`); un lotto indossa la voce
  di prima senza suffisso finché la libreria non ha quella della sua taglia, salvo che sia un programma che scala a un'altra taglia
  (`Kernel.structureModelFor`): nulla di già scolpito cambia. Il
  `ModelDirector` dà a una taglia nuova il programma di un'altra (`shared`, senza chiamate) se è la stessa taglia (una voce di prima, senza
  suffisso) o se il programma scala (`shareableProgram`); la voce dice i suoi semi (`ModelInfo.seeds`, `seedsOf`). Il validatore prova un
  programma senza `size` della classe `structure` nella scatola della sua voce (`Validator.modelBox`, `Forms.structureBox`).

<a id="taglie"></a>
## Le taglie

- **Le taglie** (ADR-0092, T54): le taglie di D&D (`SIZE_TIERS` in `src/mj/classes.ts`: minuscola, piccola, media, grande, enorme,
  gargantuesca, la massima), la stessa scala per creature e strutture: la classe dà la forma e la scatola della sua taglia solita
  (`AssetClass.taglia`), la taglia la scala (`tilesOf`, `boxOf(cls, taglia)`, più rada oltre 120 voxel, `densityOf`). `appearance.size`,
  `structures[].size` del Cartografo, `struttura.taglia`, `SculptRequest.taglia`, `ModelInfo.size`/`vpt` (`modelSize`). Rare: una
  **Enorme** (il castello «importante» di prima) per zona di 56 × 56 luoghi (`zoneOf`), una **Gargantuesca** per **reame** di 4 × 4 zone
  (`realmOf`), una per luogo, con il modello migliore dello Scultore; `claimSizes` le adatta al lotto e alla rarità (`rareAllowed`),
  `stato.json → rari` (un `importanti` vecchio è `rari.enorme`).

<a id="grafo"></a>
## Il grafo del mondo

- **Grafo del mondo** (ADR-0045): `src/kernel/graph.ts` costruisce dai file dell'universo e dai luoghi pianificati un grafo
  di nodi tipizzati (`<tipo>:<slug>`: individui col viandante e gli attesi, tipi, luoghi `luogo:<cx>_<cy>`, regioni, ambienti,
  strutture, trame, oggetti, ricette, rune, incantesimi, regole, fatti) e archi (legami, routine, tappe, contenuti, ingredienti,
  ciò che il viandante porta); `kernel.graph()` (in cache) con `find`, `neighbors`, `context`, `check()` (riferimenti verso
  nulla, legami da un lato solo o impossibili, nomi simili, trame senza individui o luoghi). Va in `world/graph.json` prima di
  ogni commit se è cambiato ciò di cui è fatto (formato di Graphify, una riga per nodo e arco; tiene i luoghi del file
  precedente; `GRAPH_BUILD` da alzare quando si costruisce in modo diverso). I compiti narrativi (risposte e dialoghi degli NPC, «Esamina», «Leggi», azioni libere, fabbricazione, combinazioni,
  incantesimi nuovi, individui, trame) passano un `focus` (`kernel.focusOn`: le cose nominate e il luogo, id o nomi): il
  Narratore riceve allora la testa della bibbia, il canone, le ultime 12 regole e, in fondo al system (dopo la parte che
  la cache serve), il vicinato di quei nodi (`graph.context`, ~700 token) al posto della bibbia intera e del catalogo;
  se il grafo non conosce nulla del focus, i riassunti di prima. Graphify sul codice è facoltativo e fuori dal progetto (vedi Comandi).

<a id="convalida-browser"></a>
## Convalida nel browser (senza tentativi)

Il kernel è in console come `window.quine` (o `window.rune`) in singola e per il master; per un giocatore in multigiocatore è il
`ThinClient` (ADR-0061). Da lì si va dove serve e si fa ciò che farebbe un tasto: niente WASD per arrivare.

- **Avvio**: `NODE_ENV=production npm run build`, poi `npx vite preview --port <n> --strictPort` (una porta libera: altre sessioni
  possono averne una aperta), poi `http://localhost:<n>/?skip&offline`. Aspetta il kernel prima di usarlo:
  `for (let i = 0; i < 40 && !window.quine?.corona; i++) await new Promise((r) => setTimeout(r, 500));`
- **I tempi legati ai frame non si prendono nella scheda di Claude in Chrome** (T213, T215): lì il ritmo è di circa 1 Hz anche con una pagina vuota, con il thread libero, e i tempi che dipendono dai frame ne escono moltiplicati. Prima di misurare, misura una pagina vuota con `requestAnimationFrame`; fps, arrivi e caricamenti si prendono in Chrome headless con la GPU vera (`--headless=new --use-angle=d3d11 --ignore-gpu-blocklist --enable-gpu`, un `--user-data-dir` usa e getta non su C:, pilotato da `--remote-debugging-port` con `ws`, una scheda nuova per ogni misura, `WEBGL_debug_renderer_info` per controllare la GPU). Con la cache delle forme su una porta libera serve `?formecache`. La scheda resta buona per ciò che si guarda.
- **Spostarsi ovunque**: ciò che riporta il viandante al centro è il **tappeto** (non `sanitize()`, che tocca solo posizioni non
  finite o fuori dal bordo del campus, mai gli interni). Fermalo e assegna la posizione, come fa `?dev&teleport=X,Y` in `main.ts`:
  ```js
  const k = window.quine;
  k.carpet().active = false;
  const f = k.corona.building('persone').storeys[0];        // id dell'edificio (vedi ROOMS in corona.ts), piano
  Object.assign(k.wandererPos(), { x: f.ox + 12.5, y: f.oy + 10.5 }); // casella locale nella stanza 24 × 15
  ```
  La zona (`studio`, `corona`, `sim`) e la stanza disegnata seguono da sole al tick dopo; nessuna porta né `E`. Le caselle dei
  dispositivi sono le costanti di `corona.ts` (`SHOWCASE_AT`, `GRAPH_AT`, `SITUATION_AT`, `WALL_AT`, `CONSOLES_AT`, `BENCH_AT`…,
  relative a `f.ox`, `f.oy`); il dispositivo sta sulla colonna 12, l'uscita in basso (y 14): stare a y 10.5 lo inquadra con la
  parete di fondo, ma `E` lo raggiunge da y 7.5. Per gli esterni: `k.corona.building(id).door` (il viale davanti alla porta) o `?dev&teleport=46,0`.
- **Il teleport non si somma più a quella salvata** (T264, prima T214): `pagehide` scrive la posizione in `universes/<nome>/world/players/me.json` e il caricamento dopo la rende scostamento del tappeto; con `?dev&teleport=X,Y` `applyTeleport` (`src/kernel/teleport.ts`) ferma il tappeto e ne azzera lo scostamento, quindi due caricamenti dello stesso URL arrivano allo stesso punto (prima davano 0, 46, 92, 138). Senza `teleport` vale lo scostamento salvato: chi chiude nella corona riparte dov'era.
- **Multigiocatore**: `vite preview` non aggancia il WebSocket di `/api/session` (il client dà «il mondo non risponde»): serve il server
  di sviluppo, `npx vite --port <n> --strictPort`, sempre nel turno `browser`. Un universo con `game.mode: 'multigiocatore'`, due
  schede con `?skip&offline&universo=<nome>&viandante=me` (il master, se `game.master` non dice altro) e `&viandante=<altro>`; la prima
  partenza del mondo richiede una ventina di secondi. Nel master `window.quine` è il kernel specchio e `window.session` il `ThinClient`; nel
  giocatore `window.rune` è il `ThinClient`. Un dono: `await session.session.act({ t: 'give', wanderer: '<altro>', slot, count })` (i messaggi in inglese dal contratto 0.5, ADR-0163).
- **Agire**: `await k.interact()` è `E` (sul dispositivo o sullo scaffale più vicino), `k.clickStudio(x, y)` il clic sinistro su un punto;
  i pannelli arrivano come eventi (`k.bus.on('ui:showcase', …)`, `ui:screens`, `ui:graph`…). Per far vedere uno stato senza Gemini:
  `k.council.say(agente, tipo, testo, a, compito)` scrive nel registro, `k.faults.raise(chiave, messaggio)` apre un guasto.
- **Guardare**: lo screenshot dello strumento del browser; la camera gira con i tasti `,` `.` mandati alla pagina (o trascinando col
  tasto centrale), la rotellina fa lo zoom. Errori: i messaggi della console della pagina.
- **Alla fine**: chiudi la scheda e ferma la preview.

<a id="costi"></a>
## Costi e prestazioni

- **Registro dei consumi** (ADR-0039): ogni chiamata passa da `kernel.usage` (per giorno, modello e compito, in token e
  dollari, cache e ragionamento compresi) e va in `world/usage.json` con ogni commit; il costo è nel pannello del
  Concilio (`G`). `GeminiAiModels` non ripete mai una richiesta scaduta (può essere stata pagata); ripete solo 429/5xx.

- Testo per mondo: Genesi ~60 chiamate; poi 1 per luogo, 1-2 per individuo, ~4 per pacchetto di oggetti.
- Niente immagini (step 9): il costo dell'aspetto è testo, un programma per tipo (vedi il report 8.2B, sezione 4).
- Tick ≈ 5 ms in Node con ~100 entità (`sys.wander` il più costoso); budget di istruzioni Lua ~1.5×.
- Lezione ricorrente: i modelli non contano caratteri né caselle. Il kernel ripara le forme (griglie,
  regole dei programmi, nomi nelle ricette) e posiziona le cose; si scarta solo ciò che non si capisce.

<a id="stato"></a>
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
incantesimi, fuoco, giorno e notte, varietà di individui, oggetti citati, riparazione automatica, rune come oggetti
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
