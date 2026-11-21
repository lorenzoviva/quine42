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
| [Il self-hosting](#self-hosting) | `Dockerfile`, `docker-compose.yml`, `.env.example`, `tools/produzione/immagine.mjs`, `docs/self-hosting.md` |
| [I pagamenti con Stripe](#stripe) | `server/stripe.ts`, `server/ledger.ts`, `site/pagamenti.ts` |
| [Il clone e l'eredità](#clone-eredita) | `src/kernel/clone.ts`, `src/kernel/heritage.ts`, `server/universeStore.ts` |
| [I sotterranei](#sotterranei) | `src/kernel/forms.ts`, `src/kernel/strata.ts`, `src/mj/mesh.ts`, `src/render/terrain.ts` |
| [La grafica a cartone](#cartone) | `src/render/cartoon.ts`, `src/render/materials.ts`, `src/render/bloom.ts` |
| [Il mondo in 3D, bozze di prova, mappa, voxel luminosi](#mondo3d) | `src/render/`, `src/kernel/layout.ts` |
| [MarkovJunior, i modelli, la cache delle forme](#markovjunior-modelli) | `src/mj/`, `src/kernel/forms.ts`, `src/kernel/modeldirector.ts`, `src/render/worker.ts`, `lab/` |
| [Il suono](#suono) | `src/mj/sound.ts`, `src/mj/synth.ts`, `src/audio/`, `universe/models/suono-*.xml` |
| [I pianeti e il viaggio](#pianeti) | `src/kernel/planets.ts`, `src/render/planet.ts`, `src/kernel/relief.ts` |
| [La fisica rimodellabile e la natura del mondo](#fisica) | `src/kernel/nature.ts`, `src/kernel/agents/genesis.ts`, `src/kernel/migrations.ts` |
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
  `localStorage` + IndexedDB. I commit vanno al disco in fila (`UniverseClient`, ADR-0122): senza risposta dal server il commit resta primo in fila e ritenta (tre volte subito, poi a ogni commit nuovo e ogni 30 s), un 5xx ritenta tre volte e cede il passo, un rifiuto (4xx) si scarta con un avviso; `checkout` e `clone` non passano sopra un commit in attesa. Nella stessa fila stanno anche i piani (`putMap`), i rami e le pubblicazioni, che ritentano come i commit (ADR-0144); nel browser la fila si salva per scheda in `localStorage` (`browserOwedStorage`, mai il token) e la pagina dopo la scrive prima di leggere l'universo; al tetto (256 scritture o 2 milioni di caratteri) una scrittura nuova si unisce a una in fila; un 401 chiede un token nuovo (`renewAuth`) e riprova. Ogni scrittura dice la testa su cui è stata fatta (`base`, l'ultima che lo store ha dato) e lo store la prende solo nel repository che ha quel commit nella sua storia (`madeHere`): una fila lasciata per un universo che poi è finito nel cestino o è stato installato di nuovo con lo stesso nome riceve un 409 e si scarta, come una scheda rimasta aperta su di lui (ADR-0217, T421: così neapolis si era aperto come «aurora»); senza base si scrive come prima.
- **La versione del kernel e l'intervallo dei kernel** (ADR-0136, ADR-0152): `universe.json → kernel` è l'ultimo kernel che ha scritto l'universo, `kernels` (`{ "from": "0.1" }`, `to` facoltativo) i contratti su cui gira: aperto, arriva al contratto di `kernel`. Li scrive il kernel prima di ogni commit (`stampKernel`) e solo se l'universo è nell'intervallo; un universo senza `kernels` lo ricava da `kernel`. Fuori intervallo: il guasto `universe:kernel` con l'intervallo nel motivo e l'universo **in sola lettura** (ADR-0156, T312): `Kernel.readOnly()` è il predicato, `Repo.readOnly` non fa nessun commit (Concilio, viandante, stato, magazzini, editor, pubblicazione) e il backend avvolto da `Repo.attach` non scrive commit, rami, `merge` né ritorni (`checkout`); i piani nuovi restano in memoria (`SealedChunks`); `Council.write` manda ogni compito ai modelli locali; il motivo del guasto lo dice (`READ_ONLY_WORDS`); `/api/viandante` a mondo spento risponde 409 se nemmeno le migrazioni portano l'universo qui (`opensOnThisKernel`, T317); restano il cestino, il clone e i saldi; un universo che le migrazioni portano nell'intervallo non è in sola lettura (la migrazione si committa in `Kernel.boot` prima che `Repo.readOnly` si colleghi, e il guasto si decide su `universe.json` già portato). Niente dal seme (`upgradeFromSeed`), l'etichetta «kernel 0.1–0.1» sulla scheda della pagina delle sessioni e nella lobby; l'universo resta sul disco. Le migrazioni da un contratto al successivo si registrano solo in `src/kernel/migrations.ts` (`MIGRATIONS`): `migrateUniverse` porta un universo lungo la catena se c'è tutta e scrive `kernels.from` del kernel; la chiamano `prepareUniverse` (`universes.ts`: migra, poi `upgradeFromSeed`, un commit solo) nella pagina, nei mondi di molti, nella generazione differita e per i quattro universi del laboratorio, e `Kernel.boot` per chi non passa di lì, con un commit subito (il primo commit del Concilio la recinterebbe); il server di un'altra versione è solo descritto in ADR-0152 (una build per `X.Y`, il front che sceglie dall'intervallo).
- **La prima migrazione, 0.1 → 0.2** (T307a, ADR-0153, ADR-0155): la lingua interna della simulazione (i domini T307a di `internalNames.ts`). I dati campo per campo (un JSON si riscrive con la sua indentazione, solo se cambia); le chiavi che altri puntano con ogni riferimento: i token delle rune e le formule in latino (`terra fuoco` → `terra ignis`, anche nel canone e nelle rune portate e nella mano), gli ambienti del seme e i timbri dei programmi, i modelli che il kernel nomina (i generici delle classi `persona.xml` → `person.xml`, `forma-*` → `shape-*`, `casa-comune-<classe>-*`), con l'indice, le imprese, le carte e le azioni fatte sulle forme; i terreni del seme prendono un `id` (`meadow`) e tengono il `name` del mondo (`world.find_tile`, `matura.in` e gli effetti cercano codice, id, nome: `Kernel.tileCodeOf`). Il Lua solo nei moduli del Concilio (`origin`), solo dove il kernel legge un valore: una categoria confrontata, un effetto costruito come tabella (`luaFor0_2`, un lessico che lascia commenti e stringhe lunghe); quello del giocatore resta (regola 3), quello del seme lo porta il seme. `seed.json` segue la migrazione: un file tenuto come il seme resta del seme e il seme della 0.2 lo sostituisce (così `core.effects` legge gli effetti inglesi). I piani dei luoghi non dicono il loro contratto: `migratePlan` è idempotente e il `chunkStore` del kernel la applica a ogni piano che legge (`migratePlanRecord`). Finché T310 non cambia i prompt, il validatore ripara l'italiano del contratto 0.1 (`internalManifest` in `parseManifest`, `internalEffect` in `validateEffects`, `validatePlan`, Fucina, pacchetti, pannelli, casi, timbri, rune nuove, indice dei modelli) e gli schemi del Concilio elencano i valori in italiano (`italianValues`); ciò che il mondo mostra usa la parola italiana (`italianName`: «Runa magica (luce)»).
- **La seconda migrazione, 0.2 → 0.3** (T307b, ADR-0153, ADR-0158): la lingua interna della società e del Concilio. I file cambiano nome con ciò che nominano: i moduli del seme che il kernel nomina (`sys.lavoro` → `sys.work`, `lavoro.<mestiere>` → `job.<trade>`, `obj.letto|cassa|banco|credenza` → `obj.bed|chest|counter|cupboard`, `item.forbici` → `item.scissors`) con il loro magazzino, `prompts/agents/<agente>.md` → `prompts/agents/<agent>.md`, i programmi sonori del seme (`suono-*` → `sound-*`, il dominio `suoni-seme`) e i gerboa (`corona-gerboa-<agent>`); ogni stringa JSON che è l'id di uno di quei moduli e ogni `carta.autore` che è un agente cambiano ovunque. Campo per campo: persone (specie, genere, routine), trame e missioni, imprese, programmi dei mestieri (`internalJobProgram`) e i casi del banco, l'indice dei suoni, le parti dei programmi, `universe.json` (chiavi di `ai.sculptors`, `ai.coefficients`, `ai.agents`, `ai.minimums`; la modalità), le carte e il grafo (`modello:` → `model:`, `persona:` → `individual:`…), le mancanze. Il Lua del Concilio dove il kernel legge un valore (un id di modulo del seme, l'attività di `attivita`); `migratePlan` porta le cose dei piani (`obj.letto` → `obj.bed`) e l'autore della carta del luogo. Le stesse funzioni riparano ciò che il Concilio scrive ancora in italiano in ogni lettura (`readPeople`, `readPlots`, `readVenture`, `readShortfalls`, `readCards`, l'indice dei suoni, `jobPrograms`, `model.ts`); il server legge `multigiocatore` come `multiplayer` (`isMultiplayer`). L'id del viandante solo (`io`) restava: lo porta T308a con i percorsi dei viandanti e i saldi.
- **La terza migrazione, 0.3 → 0.4** (T308a, ADR-0153, ADR-0159): i campi e i percorsi dei file dell’universo. I campi per **forma di file** (`FIELD_SHAPES` in `internalNames.ts`, `internalFields(forma, json)`): ogni forma dice quali chiavi italiane di quale oggetto un dominio rinomina (`only`), le altre sono contenuto o di un altro contratto e restano (`posto` è `slot`, `workplace` o `spot` secondo l’oggetto; i componenti di una cosa restano a T308b). `universe.json` (`game`, `relief.sea`, `heritage`, `ai.sculptors|agents|coefficients|minimums|actor|maxPieces`), i manifest (`appearance.look|class|size`, `ui.title|elements`, `cases`, `jobs` con `names`, `workplace`, `day` e i compiti `does|where|from|to|tile|drop|item|with|count|duration|pose|says|route|action`, `tiles.*.ripens`), persone, trame, bibbia (via le «crepe»), atlante, regole, stato (`consumed`, `containers`, `forms`, `rares`, `time`, `placed`), viandanti (`name`, `profile`, `states`, `transcended`, `anonymous`; mai `crediti`), imprese, carte, consumi, mancanze (`entries`), piani (`structures`, `houses`, `days`, `stages`, `seen`, `digs`, `water`), indice dei modelli (`class`, `size`, `cellar`, `score`, `sound.use|environments|moments|beyond|effects`); i timbri `carta` → `card` (`author`, `payer`, `holder`, `origins`) a ogni profondità (`internalCardsIn`); il viandante solo `io` → `me` dove un campo tiene un viandante e nel nome del suo file (`internalSoloIn`); i percorsi `world/players/`, `world/state.json`, `world/ventures.json`, `world/stores/`, `world/usage.json`, `world/shortfalls.json`, `world/cards.json`, `world/graph.json`, `world/canon.md`, `world/lexicon.md` (`internalPath`); l’attributo `soil="E"` dei programmi (il parser legge anche `suolo`). Lo stato di prima di T245a: le `importanti` sono le Enormi di `rares`, il `viandante` è `world/players/me.json`. **Ogni lettura** accetta anche i campi di prima (i valori di 0.2 e 0.3 si riparano prima, sulle chiavi italiane): così si legge ciò che il Concilio scrive ancora con i campi italiani dei suoi schemi (T310) e un universo del disco non ancora aperto; il server porta in memoria ciò che legge dal disco (`portedFiles`, `pathsBefore`: portafoglio, viandante, carte, ciò che è pubblico, Stripe, il rapporto delle mancanze). Le **cartelle del server** sono in `server/folders.ts` (`serverPath`): `.trash`, `.balances`, `.queue`, `.running`, `.generation`, `.gemini-spend.json`, e la cartella di prima si sposta al nome nuovo la prima volta che serve (un archivio dei saldi di prima legge `io` come `me`). La **fila del browser** è in `quine:owed:`; una sotto `quine:fila:` si prende comunque, portata (`owedTo0_4`). Lua: `sys.work` legge i compiti e il passo dell’impresa (`world.impresa`: `does`, `item`, `pose`) con i campi di 0.4; i posti sono `tile:<codice>` ed `entity:<tag>`.
- **La quarta migrazione, 0.4 → 0.5** (T308b, ADR-0153, ADR-0163): il filo e Lua. **Il protocollo** (`src/session/protocol.ts`) parla inglese, client e server insieme e senza dati da migrare: i messaggi (`join`, `profile`, `step`, `keys`, `phrase`, `inscribe`, `cast`, `action`, `other`, `chat`, `say`, `give`, `item`, `container`, `craft`, `panel`, `tile`, `branch`, `publish`, `follow`, `agent`, `recharge`; dal server `welcome`, `update`, `correction`, `result`, `refusal`, `world`, `council`, `file`, `branch`), le operazioni (`use`, `wield`, `put_down`, `move`, `to_bag`, `from_bag`, `action`; `open`, `take`, `put`; `put`, `remove`, `button` con `socket` per il posto di un pannello), gli stati del mondo (`stopped`, `resumed`, `restarted`), gli avvisi (`type: say|give|other|death|credits`, `from`, `name`, `text`, `lost`, `where: here|square`, `reason: exhausted|cap`) e i campi (`time`, `state`, `chunks`, `entities`, `gone`, `wanderers`, `departed`, `players`, `notices`, `text`, `reason`…); anche l'`Account` verificato (`anonymous`, `name`) e i campi del `SessionClient`. Il canale tra il server e il processo di un mondo (`worldwire.ts`: `apri`, `pronto`, `vivo`…) e le rotte HTTP restano come sono. **I componenti** che Lua vede e i loro campi (`COMPONENT_FIELDS` in `internalNames.ts`: un campo si rinomina solo nel componente che ce l'ha): `luce {raggio, accesa, colore, daStato}` → `light {radius, lit, color, fromState}`, `fuoco` → `fire`, `effimero {fino}` → `ephemeral {expires}`, `scudo {fino, spento}` → `shield {expires, off}`, `meta` → `goal`, `stati` → `states` (ogni stato `{speed, weight, light, expires}`), `attivita {tipo, ferma}` → `activity {kind, still}`, `posato` → `placed`, `struttura {concetto, classe, taglia, stadio}` → `structure {concept, class, size, stage}`, `salto {da, a, alto}` → `jump {from, to, peak}`, `lavoro` → `work`, `carico` → `load`, `mestiere {fase, giorno, luogo, compiti, impresa, impresa_posto}` → `job {phase, day, chunk, tasks, venture, venture_spot}`, `cantiere` → `worksite` (il pannello di `sys.work`, campi `title`, `phase`, `state`, `missing`, `team`, il pulsante `bring`), `raccolto`/`frugato {si}` → `harvested`/`searched {yes}`, `player.passo` → `step`, `needs.morto` → `dead`. `fino` è `expires` e non `until`: `until` è una parola riservata di Lua (`e.until` non compila; i `taken` del dominio lo vietano). **L'API**: `world.impresa` → `world.venture`, `world.impresa_porta` → `world.venture_bring`; l'evento `morte` → `death` con `{hunger, thirst}` (l'emit ripara ancora `morte`, `internalEvent`); la chiave del deposito `deposito:` → `deposit:`. **Nei file**: i manifest (`components`, `singleton`, `persist`, i campi dei pannelli `componente.campo`, i casi con i loro componenti e i campi guardati; `internalManifest0_5`, anche nel validatore), gli stati dei viandanti (`world/players/<id>.json → states`), il magazzino di `sys.work` (`world/stores/sys.work.json`, solo le chiavi `deposito:`; il magazzino di un altro modulo è suo). **Il Lua dei moduli del Concilio** (`luaFor0_5`, sul lessico di T307a): i nomi dei componenti in `ecs.get/set/first/each` e le chiavi della tabella di `ecs.spawn`; i campi dove la tabella del componente si costruisce (`ecs.set(u, "luce", { raggio = 3 })`, `ecs.get(u, "luce") or { accesa = false }`, uno stato di `stati` messo per nome o per chiave) e dove si legge su ciò che `ecs.get`/`ecs.each` ha dato (`local l = ecs.get(...); l.accesa`, `ecs.get(...).stadio`); l'API e l'evento; commenti, stringhe lunghe e le altre stringhe restano. Un componente di un modulo che ha il nome di uno della tabella si rinomina con lui, in tutto il modulo: si comporta com'era. La stessa funzione porta al contratto il codice che l'Ingegnere scrive ancora con i nomi di prima (`forge.ts`, `mechanics.ts`, `repairLogic`), e `internalComponents` i suoi `componenti_json`, finché T310 non cambia i prompt. Il Lua del giocatore resta (regola 3); il seme porta il suo. I piani non hanno nulla di questi.
- **La sesta migrazione, 0.6 → 0.7** (T310b, ADR-0190; la quinta, 0.5 → 0.6, è dei simboli, ADR-0175): i valori che gli schemi del Concilio elencavano ancora in italiano e il tipo di ogni legame. I domini del passo `T310b` di `internalNames.ts`: `dove-piano` (`dentro`/`fuori`/`ovunque` → `inside`/`outside`/`anywhere`: `objects[].where` e `fresh[].where` dei piani, idempotente su ogni piano letto), `tipi-ambiente` (`esterno`/`interno`/`misto` → `outdoor`/`indoor`/`mixed`: `layouts[].environment`), `ruoli-timbri` (`muro`, `pavimento`, `porta`, `acqua`, `ponte`, `terreno`, `strada`, `roccia`, `recinto` → `wall`, `floor`, `door`, `water`, `bridge`, `ground`, `road`, `rock`, `fence`: i `codes` dei timbri nei programmi degli ambienti, `StampCodes`), `posti` (`testa`, `corpo`, `gambe`, `piedi`, `mani`, `arma`, `scudo`, `anello`, `collo`, `schiena` → `head`, `torso`, `legs`, `feet`, `hands`, `weapon`, `shield`, `ring`, `neck`, `back`: `items[].slot`, ciò che gli slot di un pannello accettano, le cose dei casi; gli id degli slot restano parole del modulo), `bonus` (`difesa`, `attacco`, `velocita`, `peso`, `luce`, `calore` → `defense`, `attack`, `speed`, `weight`, `light`, `warmth`: le chiavi di `items[].bonus`, `items.bonus` in Lua), `comandi` (`usa`/`azione` → `use`/`action`: le chiavi di `item.controls`), `azioni-npc` (`nessuna`, `segui`, `resta`, `vaga`, `dai`, `missione` → `none`, `follow`, `stay`, `wander`, `give`, `quest`: le azioni di un dialogo e `mind.mode` nei componenti, nei casi e nel Lua), e, solo nel codice e nei prompt, `direzioni` (`nord-est` → `north-east`; `direction` dà id, `directionWord` la parola del mondo), `tipi-fucina` (`npc`/`oggetto`/`strumento` → `npc`/`object`/`item`), `incarichi` (il Referente e la sessione: `riscolpisci` → `resculpt`, `abitante` → `inhabitant`, `oggetto` → `item`…), `interazioni` (`parla`/`leggi`/`usa`/`nessuna` → `talk`/`read`/`use`/`none`), `ripartenza` (`qui`/`piazza` → `here`/`square`). **Il Lua dei moduli del Concilio** (`luaFor0_7`, sul lessico di T307a): un modo confrontato con o dato a `mode` (`mind.mode ~= "segui"`, `{ mode = "vaga" }`), un bonus chiesto a `items.bonus(it, "difesa")`; la stessa funzione porta il codice che l'Ingegnere scrive ancora coi valori di prima (`forge.ts`, `mechanics.ts`). **Il tipo di legame**: `world/people.json → people[].family[].kind` e `expected[].kind`, ricavato dalla parola italiana (`relationKind`) dove manca. I lettori accettano i valori di prima un contratto ancora (`internalName` sul dominio: `whereOf`, `environmentTypeOf`, `forgeKindOf`, `internalConcept`, `item_bonus`, `repairProgram`, `directionVector`). Il seme è riscritto con la stessa migrazione; `seed.json` segue; le carte fatte a mano della 0.6 passano come sono (`PROGRAM_STEPS['0.6']`).

<a id="sito"></a>
## Il sito e il tema

- **Il sito e il tema** (ADR-0095, T97): pop art a fumetti, retro arcade, neon punk e retrowave; variabili CSS unificate in `src/theme.css` per sito e gioco; pagine Vite in `site/` senza framework pesanti; three.js fuori dal gioco (hero canvas, profilo) e carte collezionabili in CSS 3D; il segreto dei gerboa nel footer; lo stile delle pagine è quello del template `docs/design/sito/` (T109), `site/site.css` lo copia; la landing (`site/landing.ts`, T101) fa crescere nell'hero programmi MarkovJunior veri con `src/mj/`; la galleria delle carte (`site/carte.html`, `carte.ts`, T104) legge lo snapshot di `/api/universe/<nome>` con `allCards(files, true)` e `receivedBy`, la rarità è derivata dagli utilizzi (`rarityOf`), le miniature sono foto dei modelli (`photo.ts`) fatte in un worker, senza WebGL. il profilo (`site/profilo.ts`, T102) entra con `signIn`, legge e salva il viandante di un universo da `/api/viandante` (`kernel.keepProfile` o i file su disco) e mostra il modello vero in three.js; i crediti (`site/pagamenti.ts`, T105) dicono saldo, ricariche e consumi del viandante in un universo da `/api/crediti` e avviano Stripe Checkout; `site/shared.ts` è ciò che le pagine con un account hanno in comune. Le interfacce in gioco (T106) leggono gli stessi token: `src/style.css` dà i suoi nomi (`--gold`, `--panel`…) alla palette di `theme.css` e costruisce le finestre con inchiostro, ombra rigida e mezze tinte (`--window-veil` le attenua dietro il testo), le battute sono fumetti, gli avvisi usano il carattere display; `tests/theme.test.ts` rifiuta un token che non esiste.
- **Le notizie** (ADR-0129, T234): un file Markdown per notizia in `site/notizie/` (la guida è `LEGGIMI.md`), con `titolo`, `data`, `tag`, `riassunto` e, per un sondaggio o la pianificazione dei server, `link`; Vite li raccoglie alla build (`notizie-file.ts`, `import.meta.glob`), senza rotte né database. `site/notizie.html` è l'elenco, con i filtri per tag (`?tag=`), e la notizia singola (`?n=<nome del file>`); le ultime tre stanno nella landing. `notizie-testo.ts` trasforma il testo in HTML: tutto ciò che è scritto in un file esce escapato, un link è solo http(s) o del sito, un file che non va resta fuori e lo dice (`problems`: nella pagina in sviluppo, in `tests/site-news.test.ts`).
- **«Come usiamo l'IA»** (T368, piano di lancio D6.5): `site/ia.html`, una pagina statica nel piè di pagina di ogni pagina del sito (`tests/site-ai.test.ts`): che cosa genera l'IA e che cosa no, i modelli, chi paga (la chiave di OpenRouter del giocatore, le comuni a turno, il master che paga, i modelli locali senza chiave; ADR-0197, ADR-0188), dove sta la chiave e dove va il testo (server → OpenRouter → Google; a Jev solo dati del mondo, D45), i guardrail. Chi cambia una di queste cose cambia anche la pagina.
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
- **Il launcher** (T233): la home è il launcher di un gioco multigiocatore, sulla base comune e con ogni veste (solo token `--skin-*`, senza framework). Nell'hero, accanto al palco 3D, il pannello di lancio: l'universo (un `<select>` con quelli del server, chi è in gioco prima, il più affollato prima; la scelta è quella che il sito ricorda, `quine:sito:reame`, la stessa di profilo e crediti), GIOCA (anche quello della barra) verso `../index.html?universo=<nome>`, una riga su quanti universi e quanti viandanti in gioco, e al più cinque righe «in gioco ora» con ENTRA. Legge solo `/api/universe` e `/api/session` (quanti, non chi), insieme e con quattro secondi al più: nessuna rotta nuova. Senza server GIOCA apre il gioco in questo browser. `site/launcher-core.ts` è puro (letture col tipo, nomi solo se `UNIVERSE_NAME_RE`, numeri limitati) e porta anche `pickUniverse`, `store`, `stored` e `UNIVERSE_KEY`, che `shared.ts` riesporta: la landing non carica l'accesso. Sotto: novità (le ultime tre notizie), video e showcase (T235: carte famose, strutture, universi più giocati) restano nascosti, anche nella barra, finché non hanno contenuti, niente «coming soon» finti; poi le porte del sito (universi, carte, viandante, crediti; una carta intera è il link), la striscia «coming soon» degli altri universi, che resta, e «Dentro il gioco». `.launcher [hidden]` nasconde davvero ciò che una classe mostrerebbe. `tests/site-launcher.test.ts`.
- **I video** (ADR-0131, T244): i file stanno in una cartella del server (`QUINE_VIDEO`), mai nel repository né in `dist/`, con `video.json` accanto (`file`, `titolo`, `descrizione`, nell'ordine). `server/video.ts` risponde a `/api/video` (solo ciò che è nell'elenco e ha il file: niente build né riavvio) e a `/api/video/<file>`, in produzione, in sviluppo e nella preview. Il nome chiesto si confronta con l'elenco e non si unisce mai a un percorso; un `Range` non valido è un 416. Tetti: `FRONT_RATES` (`video`, `videosAtOnce`, `videosInAll`). Una visione costa circa 200 KB, non il file. Guida: `docs/beta/LEGGIMI.md`.
- **Le istruzioni** (ADR-0131, T244): `docs/beta/guida.md` e, solo con `{ "laCorona": true }` in `site/beta.json`, `docs/beta/la-corona.md`. `server/betaGuide.ts` li porta nella build come moduli virtuali, con la trasformazione delle notizie (`markdownToHtml`). Spenta, la seconda parte non viene mai letta, quindi non è in `dist/` (`tests/site-guide.test.ts`, con una build vera). Senza testi `site/istruzioni.html` non è tra gli ingressi di Rollup e nessun link la mostra.
- **I laboratori per i giocatori** (ADR-0161, T293): un secondo interruttore in `site/beta.json`, `{ "laboratori": true }`, separato da `laCorona` (`labsOn` in `server/betaGuide.ts`). Spento (il seme del repository) le rotte delle carte fatte a mano rifiutano chiunque e il server di produzione non serve `/lab`; nessun link porta ai laboratori. `npm run dev` lo legge a ogni richiesta, il server di produzione quando parte. Che cosa si accende è in `#carte-crediti`. Acceso (ADR-0169, T294), il server di produzione serve le tre pagine dei laboratori e nient'altro di `/lab`, e la build ha `site/laboratori.html` e il link «Laboratori» (`labsPage`, `virtual:quine-laboratori`); accenderlo vuole una build e un riavvio.
- **La campagna nel sito** (ADR-0202, T377, kernel 0.7.12; ADR-0188 § 6 riga 7): l'hub delle sessioni (`site/sessioni.ts`) sa chi guarda
  (`siteCaller`: un account già collegato in questo browser, `signedIn`, mai chiesto per leggere; senza account il viandante di questa macchina,
  `localWandererId` o `me`) e lo manda con l'elenco e le istantanee: «mia» è una carta la cui istantanea arriva intera (`log`), «SU INVITO»
  un universo che l'elenco dice privato (`invite`), «ACCEDI» se il server ha gli account e nessuno è collegato. Sulle carte del master di un
  universo di molti «CAMPAGNA» apre il pannello (`site/campagna.ts`, `CampaignPanel`; anche dal link `?campagna=<nome>`): ospiti e inviti
  (la rotta `guests`, come la console: privato o pubblico, «Togli», «Revoca», «Aggiungi ospite», «Crea invito» col link una volta), il ritmo
  (la rotta `pace`, i tre pulsanti), l'atlante (un canvas: luoghi pianificati da `maps/`, regioni del master piene e del Cartografo
  tratteggiate, il primo luogo e quello scelto; un clic mette il centro) con «Dichiara regione», «Cambia» e «Libera», e le direttive
  (`world/campaign.md` in un'area di testo, «Salva», le righe lasciate fuori dalla quarta parete dette). Direttive e regioni passano dalla rotta
  `campaign` dello store (`server/campaignSite.ts`): `GET` → `{ running, text, template, regions, environments, places }`, `POST`
  `{op:'text', text}` | `{op:'region', region}` | `{op:'release', id}`; solo il master di un universo di molti, mai un mondo, il privato come un nome
  che non c'è, JSON di al più 160 KiB. I controlli sono quelli del gioco in una funzione pura (`src/kernel/campaignEdit.ts`, `campaignEdit`:
  `readCampaign`, `masterRegion`, `withoutMasterRegion`). A mondo acceso scrive il mondo (`WorldCalls.campaign` → `Kernel.publish`, un
  commit della linea principale, e risponde con ciò che ha ora); a mondo spento lo store, nella fila dell'universo, con un commit; un universo
  di un altro contratto non si scrive dal sito (409). La guida per chi fa il master: `docs/beta/campagna.md`. Test: `tests/campagna-sito.test.ts`,
  `tests/sicurezza/campagna-sito.test.ts` (V-042).

<a id="lua-sandbox"></a>
## Lua: confine e limiti

- **Lua 5.4 via wasmoon** (WebAssembly), sandbox gestita dal kernel. Il confine (ADR-0101, T122): il proxy di wasmoon è spento e tutto passa da `Crossing` (`sandbox.ts`): a Lua arriva una vista dei soli campi di dati propri di un oggetto (niente prototipi, metodi, chiamate), a JS solo dati (niente funzioni Lua, cicli, nomi di `Object.prototype`; al più 64 livelli). La prova di caricamento (`Sandbox.probe`) gira in una VM a parte con un `Host` vuoto. I limiti (ADR-0105, T126): 2 milioni di istruzioni per chiamata e 12 per tick (`tickBegin`, `tickEnd`: chi viene dopo salta il tick, il guasto è `tick:budget`, `core.*` gira comunque), il lavoro delle funzioni C addebitato, i pattern costosi nel matcher scritto in Lua del prelude, memoria (64 MB), stringhe (1 MiB) e byte allocati nell'allocatore (`Meter`), 2 s di rete per chiamata; i modelli del gioco con `FORM_LIMITS`, `MAX_FORM_TIME`, `MAX_FORM_XML` (`src/mj/run.ts`).
- **Le chiamate annidate** (T439, ADR-0227): il kernel che chiama Lua, che chiama l'Host, che chiama di nuovo Lua, al più `MAX_NESTING` (32) aperte
  insieme (`Sandbox.enter`); oltre, la chiamata è un guasto e non entra. Prima un rientro senza fine finiva solo quando una pila traboccava, e un
  trabocco nel mezzo del codice C della VM (l'interning delle stringhe) la lasciava rotta: la chiamata dopo non tornava più. Dipendeva dalla
  disposizione della memoria (tre funzioni in più nell'Host dei test bastavano). `tests/sicurezza/uscita.test.ts`.

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
  lo Scultore su Flash-Lite), la stima di un'ora di gioco (`hourlyEstimate`: i token di ogni chiamata compito per compito sono quelli misurati da T325 con `countTokens`, `CALL_TOKENS` con la data in `TOKENS_MEASURED`, il prefisso stabile servito dalla cache implicita al 60 % e mai su 3.8 Flash; si rimisurano con `lab/scripts/jev-casi-d-uso.ts -- --contesto --conta`, T352); nella Genesi si scelgono con i modelli (`kernel.setAi`).
- **Le decisioni chiuse, Jev di TypeSafe** (ADR-0157, T348, kernel 0.6.6): un modello che non scrive ma sceglie. Lo strato è `src/kernel/ai/decisions.ts`, accanto ad
  `AiModels`: una `DecisionCall` porta l'agente, il compito, lo **stato** (scritto dal kernel, solo dati del mondo e del catalogo: il testo libero del
  viandante solo su una via a ritenzione zero, D45.3, D55.2), le **domande** (Choice: la chiave di un'opzione; Noul: un sì o un no; Score: l'indice di un
  livello) e la **regola** di oggi, domanda per domanda. Chiede il Concilio, `Council.decide(agent, task, { state, questions, rule, chi })`: solo per un
  compito che `CENSUS` dice decisione (`via: 'decide'`, `decisionKnob`, ognuno con la sua manopola: il primo è `model.reuse` con `models`); come `write`
  sceglie chi paga e passa ai modelli locali con la manopola a 0, senza crediti o in sola lettura; tiene della risposta solo ciò che sta nelle opzioni
  (`settleDecisions`) e mette la regola al posto del resto, di un errore o del tetto; non getta mai. I modelli locali (`MockAiModels.decide`) rispondono con la
  regola: senza chiave, offline e nei test il gioco è quello di prima. Jev arriva da `JevDecisionModels` (versione fissa `jev-1.13.0`; `jev-1.14.0` ammessa),
  che ripete solo 429 e 529, porta un 402 come `BudgetError` e non manda una richiesta oltre 128 KB o 64 domande. **Il varco** è `TypeSafeGate`
  (`server/typesafeProxy.ts`): la chiave `TYPESAFE_KEY` solo lì, il corpo rifatto campo per campo (`jevRequest`: modello dell'elenco, stato, domande; niente
  immagini), il tetto `TYPESAFE_TETTO_GIORNALIERO` (1 $ se non detto) con la spesa in `universes/.typesafe-spend.json`; la route `/api/typesafe` (`status`,
  `v1/systemone`) solo da questa macchina e dalla stessa origine, nel server di sviluppo e nella preview, mai in quello di produzione; i mondi di molti
  chiedono per il canale (`op: 'typesafe'`, `direct()`). Ogni chiamata va nel registro dei consumi sotto il suo modello e compito, al prezzo di
  `DECISION_PRICES` (`prices.ts`: 0,042 $ al milione di token in ingresso, la risposta gratis), e si addebita come le altre.
- **Il riuso dei modelli, `model.reuse`** (T349, kernel 0.6.7, la prima decisione accesa): prima di chiamare lo Scultore il `ModelDirector` chiede se un
  modello della libreria mostra già ciò che manca (`reuse`, in `make`). Solo per le classi di `REUSE_CLASSES` (mobili, alberi, cespugli, rocce, sassi,
  monumenti, edifici, strutture: mai persone, animali, bestie e oggetti piccoli, D45.2), mai per una richiesta di riscolpire (`previous`, `desiderio`: possono
  essere parole del viandante), un capo da indossare o una forma comune tinta. Le opzioni (`reuseOptions`) sono i modelli della stessa classe che la
  richiesta può indossare così come sono (la stessa taglia, o un programma che scala: `wearable`, lo stesso controllo di `shared`), usabili, non suoni né
  studio, un'opzione per programma, il generico della classe per primo, al più 48; senza opzioni non si chiede. Lo stato è la cosa come il mondo la descrive
  (nome, classe, aspetto, taglia, luogo) e la libreria (id e nome); le domande sono quelle del banco: una Choice fra la libreria e `new`, e la **Noul
  compagna** `fits`: si riusa solo se dice sì (T313: senza, Jev sceglie il più vicino anche quando non va). La regola, il pavimento, è `{ model: new,
  fits: false }`: si scolpisce. Un riuso copia il programma sotto l'id della richiesta (come le carte portate) con il nome della richiesta, è una carta del
  mondo (`model.reuse` è un compito comune, `cards.ts`), non conta in `ai.maxModels` e non fa partire la pausa della manopola. **La stima** della lobby e della
  Genesi (`hourlyEstimate(ai, date, { decisions })`, solo se Jev decide: nel gioco da soli lo sa il kernel, nella lobby di molti ancora no) toglie dalle
  sculture `REUSE_SHARE` = `REUSE_ASKED` 0,4 (misurato su una Genesi offline con 12 luoghi: 6 modelli su 15 si possono chiedere) × `REUSE_HIT` 0,4 (il
  mezzo dei 30-50 % di T325) e aggiunge la riga del riuso; la misura è `lab/scripts/riuso-modelli.ts` → `lab/banco/jev/riuso.md`.
- **Le guardie e la quarta parete** (T350, kernel 0.6.9, D45.5; `src/kernel/fourthwall.ts`): due decisioni chiuse dell'Arbitro. **`text.guard`**, sul
  testo libero del viandante prima del Concilio, alle cinque porte (`npc.reply`, `action.judge`, `craft.free`, `referente.coordinate`, `agent.chat`:
  `Council.guard(door, text)`): cinque Noul del banco di T325 (`GUARD_QUESTIONS`: detta ordini a chi risponde, parla del gioco, chiede della vita vera,
  esplicito, senza senso) e la rotta in codice (`guardRoute`): niente si ferma (regola 3); senza senso, della vita vera, esplicito o il gioco detto a una
  persona del mondo → `character`, la chiamata parte con la nota di restare nel mondo; ordini a chi scrive → `isolate`, la nota che le parole tra «» non
  comandano niente; nello studio parlare del codice è legittimo. Le parole del viandante vanno sempre tra «» con i loro «» cambiati in ‹› (`quoteWanderer`).
  La regola, il pavimento, sono i pattern locali in italiano e in inglese (`guardRule`, solo ciò che è inequivocabile: 62 rotte giuste su 63 sui casi del
  banco, nessun testo del mondo toccato; scritti guardando quei casi). Il testo del viandante **arriva a Jev solo da OpenRouter con la ritenzione
  zero** (D55.2, ADR-0204; mai a TypeSafe direttamente, che tiene ciò che legge, D45.3): la riga del censimento ha `freeText` e `Council.decide` la manda
  ai modelli locali qualunque cosa dica il resto se la via delle decisioni non dice di non tenere niente (`freeTextDecision`, `keepsNothing`: solo
  `OpenRouterDecisionModels.zeroRetention`, che manda `provider.zdr`; `JevDecisionModels` e i modelli locali no). I due varchi del server tengono la stessa
  linea da soli, leggendo il corpo e non ciò che il corpo dice di sé (`carriesWandererText`: una domanda della guardia o il suo stato, una porta e un
  testo): `TypeSafeGate` (`jevRequest`) rifiuta un corpo così qualunque cosa dica, `OpenRouterGate` (`decisionRequest`) lo rifiuta se non ha chiesto
  `provider.zdr: true` e rifà ogni corpo con `zdr`. Se OpenRouter non trova un endpoint a ritenzione zero rifiuta, e risponde la regola. La stima conta
  la riga delle guardie solo su quella via (`hourlyEstimate` con `{ guards }`). **`text.fourthwall`**, sui testi che il Concilio scrive per il mondo
  (`Council.fourthWall(text)`): le parole di `metaBreak` prima, senza chiamata; poi quattro Noul (`FOURTH_WALL_QUESTIONS`, le `domande-2` di T313: 91 %,
  94 % con `metaBreak` davanti) con il mondo in una riga accanto al testo; ciò che rompe torna a chi l'ha scritto col motivo (`FOURTH_WALL_REASONS`), come
  `metaBreak`. Lo usano il concetto della Fucina, l'individuo nuovo, la scheda per l'Attore e la trama nuova; non le battute, che possono ripetere le parole
  del viandante e passano una volta sola. Manopole: `words` per la guardia, `sessions` (come `review.fourthwall`) per la quarta parete; la stima con
  `{ decisions }` aggiunge la riga della quarta parete (meno di mezzo centesimo l'ora).
- **La cache esplicita dell'Attore** (ADR-0186, T351, kernel 0.6.11, D45.7): 3.8 Flash non usa la cache implicita (T325), così le istruzioni di
  sistema dell'Attore vanno in una cache esplicita di Gemini. Gli agenti con la cache sono `CACHED_AGENTS` (`council.ts`, solo `actor`): per loro
  `Council.write` mette il focus del grafo in testa al prompt e chiede `TextCall.cache`; il prefisso (ruolo, principi, «Lingua», contesto) è lo
  stesso per ogni persona e ogni dialogo, la scheda resta nel prompt. `GeminiAiModels` usa la cache solo per un modello con il prezzo della
  conservazione (`cacheable`, `Price.storage`); la politica è `ExplicitCaches` (`src/kernel/ai/cache.ts`): si scrive alla seconda richiesta dello
  stesso prefisso entro un `ttl` (`EXPLICIT_CACHE`: 1800 s, al più 3600, almeno 1024 token), si nomina fino a 150 s dalla fine (`CACHE_MARGIN`),
  poi si riscrive alla chiamata seguente; un rifiuto non si riprova per un `ttl`; una chiamata che nomina una cache sparita riparte intera, una
  volta. La scrittura è una riga `cache.write` del registro (`world/usage.json`): i token come prompt al prezzo d'ingresso e `stored` (token ×
  ore) per tutto il `ttl` al prezzo della conservazione, pagata da `comune` (`CACHE_PAYER`); `tokensOf` porta una riga ai prezzi per il registro
  e per l'addebito. Il varco: `GeminiGate.writeCache` (route `/api/gemini/cachedContents`, e `direct()` per i mondi di molti) accetta solo un
  modello con prezzo di conservazione, un `ttl` da 60 a 3600 s e istruzioni in testo, rifà il corpo, conta scrittura e conservazione nel tetto
  del giorno, tiene al più 64 cache vive; una chiamata può nominare solo una cache scritta da lui, per il suo modello, finché vive. La stima della
  lobby paga il 70 % del prompt dell'Attore al prezzo della cache e aggiunge la riga «Cache dell'Attore». La misura offline:
  `prompt-tokens.ts -- --cache` → `lab/banco/jev/cache-attore.md` (−47 % sulle righe dell'Attore, 0,16 $ l'ora).
- **OpenRouter** (ADR-0193, T362, kernel 0.7.4; la open beta, ADR-0184): gli stessi modelli e Jev con la chiave del giocatore. In
  `src/kernel/ai/openrouter.ts`, senza chiavi: una base (`endpoint`: il varco `/api/openrouter` di T363, o `OPENROUTER_API` in uno script che aggiunge
  la chiave) e due porte. **`OpenRouterAiModels`**, lo stesso `AiModels` di `GeminiAiModels`, su `/v1/chat/completions`: gli id fissi e a elenco
  (`OPENROUTER_MODELS`: il nostro id → `google/<id>`, la versione datata letta, se ogni endpoint standard prende la temperatura; un modello fuori elenco
  non parte e non consuma il budget); le istruzioni di sistema prima, il prompt e le foto dell'Artista come parti `image_url`; lo schema del Concilio
  come schema JSON (`toJsonSchema`) in `response_format` con `strict: false`; `reasoning.effort` con `exclude` (`off` non manda niente, come per
  Google); `provider: { require_parameters: true, data_collection: 'deny' }`. Gli errori: senza risposta, 408 e un 200 con l'errore (nel corpo o nella
  scelta) non si ripetono e restano nel registro; 429 e 5xx tre volte, dopo `Retry-After`; 402 è un `BudgetError`; 401 lo dice con lo stato.
  **`OpenRouterDecisionModels`**, lo stesso `DecisionModels` di `JevDecisionModels`, su `/alpha/decisions`: le versioni del gioco →
  `typesafe/jev-1.13` e `typesafe/jev-1.14` (`OPENROUTER_JEV`), il corpo del varco di TypeSafe più `provider.zdr` (l'endpoint di TypeSafe è
  nell'elenco della ritenzione zero di OpenRouter); per questo è l'unica via che porta il testo del viandante (`zeroRetention`, D55.2, ADR-0204). **Il costo detto**: ogni risposta dice ciò che OpenRouter ha
  addebitato (`usage.cost`, più quello di Google con una chiave di Google del giocatore), e va in `CallRecord.usd`: il registro dei consumi e
  l'addebito lo prendono al posto del listino (`callCost`), che resta per le stime e per chi non dice. Le chiamate stanno nel registro sotto l'id di
  OpenRouter (`google/gemini-3.8-flash`, `typesafe/jev-1.13`), che `priceOf` legge come quello di Google (`DECISION_PRICES` ha gli id di Jev).
  La prova pagata con la chiave dell'autore: `npx vite-node lab/scripts/openrouter-prova.ts` (`--offline` con un OpenRouter finto), il rapporto in
  `lab/banco/openrouter/prova.md`.
- **Opus 5.5, Scultore delle strutture su OpenRouter** (ADR-0205, T397, kernel 0.7.14; D57): `OPENROUTER_MODELS['claude-opus-5-5']` è
  `anthropic/claude-opus-5.5` (versione `-20260921`, letta il 16/11, `OPUS_READ_ON`), senza temperatura (nessun endpoint la prende), con le istruzioni di
  sistema in una parte di testo con `cache_control: { type: 'ephemeral' }` (`cacheSystem`: nessun endpoint di Anthropic ha la cache implicita; i blocchi e
  le correzioni di una struttura la leggono entro cinque minuti) e `max_tokens` 32 000 (`maxTokens`); i modelli di Google come prima. Prezzo in
  `PRICES['claude-opus-5-5']` (4 / 20 / 0,20, `OPUS_PRICES_READ_ON`), `priceOf` legge anche l'id di OpenRouter col punto. **La via del mondo**:
  `Kernel.aiRoute()` (`openrouter` se il Concilio scrive con `OpenRouterAiModels`, anche dietro il router degli abbonamenti; `google` altrimenti) e
  `Kernel.sculptors()` = `sculptorsOn(ai.sculptors, via)` (`src/kernel/agents/sculptor.ts`): su OpenRouter da `openRouterFrom` (2026-12-01)
  `openRouterStructure` per `structure` e `important` dove il master ha lasciato i predefiniti; sulla via di Google un modello che Google non ha torna
  al predefinito. **La stima oraria** conta le strutture dei concetti nuovi col loro Scultore (`STRUCTURE_SCULPT`: tre chiamate di 20 mila token,
  7,5 mila stabili, 6,5 mila in uscita, da T392; al più `HOUR.strutture`, 4 l'ora) e prende la via (`hourlyEstimate(…, { route })`: la lobby da soli
  dal kernel, in una partita di molti da `/api/openrouter/status` → `worlds`, la Genesi dal kernel). Il banco: `lab/scripts/scultore-gemini.ts --
  --modelli claude-opus-5-5 --via openrouter --tetto 4 --out lab/banco/taglie/modelli/openrouter` (`OPENROUTER_API_KEY` dal `.env`, `--offline`
  con un OpenRouter finto).
- **Le chiavi dei giocatori e il turno delle comuni** (ADR-0197, T363, kernel 0.7.8): **il varco** è `OpenRouterGate` (`server/openrouterProxy.ts`),
  gemello di `GeminiGate`. Le chiavi dei giocatori stanno nella memoria del processo del server, per id di viandante, mai su disco né in un log né in una
  risposta (altrove l'impronta SHA-256, `keyFingerprint`); quella di chi ospita è `OPENROUTER_API_KEY`, col tetto `OPENROUTER_TETTO_GIORNALIERO` (10 $,
  scritto in produzione; la spesa in `universes/.openrouter-spend.json`). **La rotta** `/api/openrouter`: `GET status` (per chi chiede: `available`,
  `linked`, `fingerprint`, `exhausted`, `server`), `POST begin` (lo `state` del PKCE, dieci minuti, quattro per viandante), `POST key` con
  `{ code, verifier, state }` (lo scambio `POST /api/v1/auth/keys` lo fa il server, lo `state` si consuma una volta e solo da una richiesta ben formata)
  o con `{ key }` incollata, `DELETE key`; tutte da `callerOf` (il token; senza account l'id detto da questa macchina; un anonimo collega la sua, D52.4)
  con un ritmo per viandante (`KEY_PACE`); le porte dei modelli (`/v1/chat/completions`, `/alpha/decisions`) solo loopback e stessa origine, mai in
  produzione, e chi gioca qui paga con la sua chiave o con quella del server, mai con quella di un altro. **I corpi** si rifanno campo per campo
  (`chatRequest`: un modello di `OPENROUTER_MODELS`, i campi di una chiamata, il `provider` del varco; `decisionRequest`: come `jevRequest` più
  `provider.zdr`). **Il canale** (`op: 'openrouter'`): l'adattatore scrive in `x-quine-payers` chi può pagare in ordine (`keyPayers`, che il kernel dà
  con `keyPayersFor`: il viandante, o il master dove paga lui; per le comuni la chiave di chi ospita se c'è, altrimenti il turno: i collegati con una chiave
  valida, prima chi ha pagato meno delle comuni in questo universo, `Ledger.spentOf(id).common`, poi per id), il varco prova le chiavi in quell'ordine,
  su un 402 mette la chiave fuori dal turno (`exhausted`) e passa alla seguente, su un 401 la dimentica, e dice chi ha pagato in `x-quine-paid-by`
  (`CallRecord.paidBy`); senza nessuno, 402 (`BudgetError`); con un ritmo per chiave (`CALL_PACE`). Il mondo riceve per valore come si paga
  (`WorldOpen.openrouter`: `players`, `server`) e chi ha una chiave (`WorldOpen.keys`, poi `setKeys` a ogni cambiamento, `tellKeys` a ogni mondo
  acceso): `kernel.setKeyPolicy`, `setKeys`, `payWithKeys`. **Quando un mondo va su OpenRouter** (`worldsPayWith`): chi ospita ha dato una chiave di
  OpenRouter, oppure non ha una chiave di Google e i giocatori possono portare le loro (account, o una chiave già collegata su questa macchina);
  altrimenti Gemini o i modelli locali come prima. Su OpenRouter anche Jev passa di lì (`OpenRouterDecisionModels`). **Nel kernel** con `payWithKeys`:
  `hasCredits` è «ha una chiave che non ha detto 402, sotto il tetto della lobby» (`canPay`, anche per un anonimo), le comuni vogliono qualcuno che possa
  pagare (o la chiave di chi ospita), dove paga il master la sua chiave paga per tutti; chi perde la chiave lo sente come i crediti finiti
  (`credits:exhausted`); il tetto della lobby non si limita al saldo (`sessionCapFor`); `charge` scrive nel ledger la spesa di chi ha pagato
  (`Ledger.spend`, `spent[id] = { usd, common }` in `universes/.balances/<nome>.json`), mai un addebito su un saldo; `chi` non cambia e le carte delle
  comuni restano del mondo (`payer: comune`, il titolare col seme). Senza chiavi dei giocatori niente cambia. Le prove: `tests/sicurezza/openrouter.test.ts` (V-040), `tests/openrouter-keys.test.ts` (due viandanti con due chiavi: ognuno paga le sue,
  le comuni si alternano, il 402 e il 401, il master che paga, la chiave di chi ospita).
- **«Collega OpenRouter»** (ADR-0200, T364, kernel 0.7.10): un modulo per tutte le pagine, `src/ui/openrouter.ts`: `OpenRouterLink` (la rotta per
  una pagina, chi è lo dicono le intestazioni: il token, o l'id del viandante) e il riquadro `openRouterBox`. **Il PKCE dalla pagina**: verifier e
  challenge S256 fatti qui, lo `state` dal server (`POST begin`), verifier e state nel `sessionStorage` della scheda, poi
  `https://openrouter.ai/auth?callback_url=<la pagina>&code_challenge=…&code_challenge_method=S256&state=…&key_label=QUINE42`; al ritorno
  (`returning`, `finish`) codice e state escono dall'indirizzo, lo state si confronta con quello della scheda e il server scambia. **L'incolla** è
  il ripiego; **Scollega** la dimentica sul server. **Lo stato**: `GET /api/openrouter/key` dice impronta, `exhausted` e il limite letto da
  OpenRouter (`keyLimits`: `GET /api/v1/key` dal server, `readKeyLimits` campo per campo, detto di nuovo per un minuto, `LIMITS_TTL`; un 401 la
  dimentica, `forgotten`); `status` dice anche `worlds` (se i mondi di molti di questo server pagano su OpenRouter). **Il tetto proposto**: OpenRouter
  non prende un limite dal collegamento (solo `POST /api/v1/auth/keys/code`, con una chiave di gestione): il riquadro propone il tetto della lobby (o
  `PROPOSED_LIMIT`, 5 $) e dice se la chiave è senza limite, finita o molto sopra (`limitWords`). **Dove**: la lobby di molti (se chi entra paga per
  sé e `worlds`), la lobby da soli (se il gioco non va su Gemini), il pannello `P` (sempre, rifatto a ogni apertura), il profilo del sito (se c'è
  la rotta). **Da soli sul PC** la chiave collegata da questa macchina (`who.local`) resta in `universes/.keys/openrouter.json` (`keysFile`: solo
  `vite.config.ts`, mai il server di produzione), riletta a un riavvio, tolta quando si scollega o è revocata; e il gioco da solo senza chiave di
  Google va su OpenRouter (`OpenRouterAiModels`, `OpenRouterDecisionModels` con le intestazioni di chi gioca, `soloFetch` in `main.ts`); il
  ritorno del PKCE si finisce prima di scegliere i modelli. Le prove: `tests/openrouter-link.test.ts` (il flusso intero contro la rotta vera e un
  OpenRouter finto, il file, le parti pure).

<a id="lobby"></a>
## La lobby multigiocatore

  La **lobby** (ADR-0086, T45d; ADR-0133, T247): il master regola tutto il consumo prima di entrare (preset, ogni coefficiente, ogni modello, ragionamento, Attore, budget, minimi), con la stima di un'ora che segue i valori e, accanto a ogni manopola, cosa fa il gioco a 0; gli altri vedono e non toccano. Il tetto crediti di chi entra incrementa i budget (`addBudgetFromCap`); a crediti esauriti o al tetto, tre scelte (ricarica, offline, abbandona), che restano di ogni viandante anche a partita in corso; la collezione carte fuori dalla partita con utilizzi.

  **Quando compare**: in una partita di molti a ogni apertura della pagina, anche di un universo già avviato, se non c'è `?skip`. Da soli la stessa schermata con `alone` (solo le regolazioni), a ogni apertura di un universo già generato se ci sono i modelli (`?lobby` la forza; senza modelli non c'è nulla da regolare); un universo mai generato ha la Genesi.

  **Partita in corso** (`kernel.settingsLocked`): in una partita di molti da quando il primo viandante entra a quando l'ultimo esce, anche se il mondo resta acceso; da soli da quando si chiude la lobby a quando si ricarica la pagina. In quel tempo nessuno cambia `ai`, nemmeno il master: `setAi` risponde `false`, `keepSettings` riscrive un `universe.json` che dice altro (editor, rollback, pubblicazione), `takeBranch` lo toglie dal ramo, `/api/universe` rifiuta da fuori un cambio di `ai` in un universo di molti. `/api/viandante` dice `inCorso` alla lobby. Le regolazioni entrano con il master nel messaggio `join` (`settings`), riparate da `repairAiSettings`; i minimi valgono per ogni via (`withinMinimums` in `readConfig`), e il server rifiuta un tetto sopra 0 e sotto il minimo.

  **Le spese della partita** (ADR-0188, T372): con le regolazioni il master sceglie chi paga, `settings.game.expenses` (`LobbySettings`): `shared` (assente: ognuno le sue, le comuni divise) o `master` (ogni chiamata del mondo e dei viandanti al master). È l'unico campo di `game` che cambia dopo la Genesi, e solo da qui: `applySettings` lo ripara (`expensesIn`: da soli non c'è nessuno per cui pagare, un valore ignoto resta quello di prima) e lo scrive (`setExpenses`, `shared` come niente), rifiutato a partita in corso come il resto; `keepGame` riscrive un `universe.json` che dice altro. Esce ai client in `GAME_FIELDS`: la lobby di un giocatore dice «paga il master», non chiede un tetto né il tetto minimo (il server non applica `minimums.cap` né `setSessionCap` a chi non paga, e il suo tetto non si somma ai budget); quella del master ha la scelta (`#lobby-spese`) e dice che il suo tetto è quello di tutti.

  **Lo Scultore delle strutture** (ADR-0207, T398, D57): una manopola come le altre, `ai.sculptorTier` (`SculptorTier`): `standard` (assente: ADR-0205,
  Argon e su OpenRouter Opus 5.5 dall'1/12), `strong` «performante» (Opus 5.5 su OpenRouter da subito), `max` «massimo» (Fable 5.1 su OpenRouter,
  `claude-fable-5-1` nell'elenco dell'adattatore). Solo le strutture e le importanti; sopra `standard` vince sul modello della classe; sulla via di
  Google solo i Gemini, ogni livello è Argon (`sculptorsOn(…, tier)`, `TIER_MODELS`). Entra solo come una delle tre parole (`repairAiSettings`,
  `repairSculptorTier` in `readConfig`), si fissa entrando come il resto. La Genesi e la lobby (`src/ui/sculptortier.ts`: `#genesi-scultore-livello`,
  `#lobby-scultore-livello`) mostrano per ogni livello il modello e il costo di una struttura di un concetto nuovo sulla via del mondo (`sculptorTiers`,
  `structureCost` coi pesi di `STRUCTURE_SCULPT`: 0,29 $ Argon, 0,58 Opus, 1,44 Fable al 17/11), la stima oraria che segue (2,67 / 3,83 / 7,29 $ su
  OpenRouter) e chi la paga (chi gioca da soli; il master se paga la partita; altrimenti le spese comuni); Low Detail rimette `standard`. Il varco
  riscrive `max_tokens` dei modelli dell'elenco che ne hanno uno (Opus e Fable, 32 000), così il tetto al giorno regge il modello più caro.

  **Il ritmo del mondo** (ADR-0188 punto 3, ADR-0196, T373): l'eccezione «solo verso il basso» alla partita in corso. Il master, in ogni momento, può
  rallentare (`slow`: `placesPerMinute` al più quello della lobby, 4 se non dice altro, anche da soli dove la lobby non ha quota; le pause dello Scultore e
  del Musicista doppie, almeno 60 s) o fermare (`hold`) ciò che il mondo fa da sé, mai accelerarlo: `src/kernel/worldPace.ts` (`readPace`,
  `placesPerMinute`, `paceGap`), `Kernel.setPace` (solo il master) e `applyPace`. In pausa la quota dei luoghi nuovi è 0: le bozze nuove restano
  bozze (`held`), un luogo con il piano su disco torna senza ciò che chiederebbe (oggetti ignoti, concetti nuovi, i battiti dei pacchetti, del cast e
  delle sessioni), e sono fermi i direttori dei modelli e dei brani, le sessioni del Concilio e, nella società (`NpcHost.paused`), gli individui nuovi,
  le trame (le tappe dovute accadono al primo sguardo dopo) e i dialoghi fra individui; ciò che un viandante fa ha la sua risposta. «Normale» riprende
  dalle bozze più vicine ai viandanti. Si cambia col messaggio `pace` (solo il master, `LIMITS.paceRate`), dalla console («Concilio») e dalla
  Direzione (`src/ui/pace.ts`), dalla rotta `/api/universe/<nome>/pace` (il sito, T377); ogni client lo riceve (`welcome`, `update`) e l'HUD dice
  «Il mondo è in pausa: il master lo sta scrivendo» (`#paused`). Sta in `universes/.campaign/<nome>.json → pace`, scritto solo dal server
  (`keepPace`, anche quando il mondo dice che il master l'ha cambiato), al mondo per valore (`WorldOpen.pace`, `WorldCalls.setPace`); da soli non si tiene.

<a id="abbonamenti"></a>
## La coda della CLI degli abbonamenti

  Gli abbonamenti (ADR-0077, T68; blindati da ADR-0106): `ai.provider` (`api` predefinito, `claude`; Antigravity non può escludere gli strumenti e non sta sulla coda) e `ai.agents` (agente → provider)
  mandano i compiti lenti (Genesi, Fucina, modelli dello Scultore, sessioni del Concilio, meccaniche) alla coda `/api/coda`, servita
  da un processo che usa la CLI dell'abbonamento di chi gioca; il resto resta sulle API. Solo in locale, mai sul server del multigiocatore. La route c'è solo con `QUINE_CODA=1` nel `.env`, da loopback, con un segreto che vive nel server; la CLI gira in una cartella vuota, con l'ambiente ridotto, senza strumenti, MCP, hook e impostazioni, il testo su stdin, e ogni esecuzione deve confermarlo dal suo `init` (`IsolationCheck` in `tools/abbonamenti/servi.ts`) o viene uccisa. Il prompt di sistema non è un argomento (T427: quello dello Scultore delle strutture passa i 32 767 caratteri della riga di comando di Windows, `spawn ENAMETOOLONG`): sta in un file (`system-prompt.txt`, 0600, scritto in esclusiva) accanto alla cartella vuota, dentro la cartella della corsa (`runFolders`, da `mkdtemp`), e la CLI lo legge con `--system-prompt-file`; la cartella della corsa si toglie alla fine, comunque sia andata. Così anche il banco (`lab/banco/claude.ts`) e lo Scultore su Claude del banco delle taglie, che passa da `runIsolated`.

  **La generazione differita** (ADR-0137, T207): `npm run genera -- <universo>` genera un universo prima che qualcuno lo giochi, senza browser e solo
  dalla coda: ogni compito, anche i veloci, va all'abbonamento (`DeferredModels`), uno che andrebbe alle API ferma il comando. I passi (Genesi, luoghi a
  spirale da `(0, 0)` con i loro individui, modelli, brani) si scrivono solo se finiscono validi (`StepGate`); il progresso e il tetto in percentuale
  della settimana (riletto a ogni passo, misurato da `/usage`) stanno in `universes/.generation/<nome>.json`; il comando non parte su un universo con
  un mondo acceso (`universes/.running/`, `server/generation.ts`) e un mondo non si accende su un universo che si genera. Un universo di un'altra `X.Y` del kernel non si genera.
  Un passo che finisce in errore si conta nel progresso (`tries`) e dopo `MAX_STEP_TRIES` (3) giri si lascia, così una cosa che non viene non ferma il resto (T411).

  **La rigenerazione dei modelli** (ADR-0216, T411): `npm run genera -- <universo> --rigenera modelli [--tipi …] [--classi …] [--modelli n] [--tetto %]`
  riscolpisce i tipi di `models/index.json` che il mondo indossa (`wearersOf`: moduli, oggetti, le strutture dei piani di tutti i luoghi pianificati
  dell'universo, le case comuni) delle classi `furniture`, `structure`, `building` (da T428, ADR-0219: la casa comune dei lotti sotto 5 caselle, chiesta come in gioco, e gli edifici dei moduli), `person`, `animal`, `beast` (`REGEN_CLASSES`), mai quelli del kernel
  (`kernelModel`: i generici, la corona, gli schermi, le parti `part-…`, i suoni), i corpi dei viandanti né le carte portate (`regenerationTargets`).
  Allo Scultore la richiesta dal concetto, come il `ModelDirector` (la taglia, la cantina della voce o del piano, l'abitazione per le case comuni), mai il
  programma di prima; il giudizio dell'Artista con le sue foto e la revisione come in gioco (`sculptPlan` delle manopole); poi l'interno dallo
  Scenografo (`interno:<modello>`, l'autore il modello della CLI). Tutto sulla coda col **modello e lo sforzo della CLI detti dalla richiesta**
  (`QueueAiModels` `model`/`effort`, a elenco: `CLI_MODELS`, `CLI_EFFORTS`, controllati da `checkRequest` all'ingresso e da `serveOne` che li rilegge;
  le immagini come un messaggio di eventi, la via di T391): per la rigenerazione Opus 5.5 a sforzo `low` (`REGEN_MODEL`, `REGEN_EFFORT`), lo Scultore
  stabile del banco di T406 e T413. **I lotti** (`regenerationPlan`): dove una struttura riscolpita a 16 non starebbe nel suo lotto di prima (tagliato
  per 20: le case di 5 × 5, 6 × 5), il suo ambiente si ritaglia prima delle strutture (`ambiente:<id>`): il programma del seme di oggi se l'universo
  teneva quello del seme di prima (T407), le regole-scatola del Cartografo allargate di 20/16 e almeno 7 (`stretchBoxes`, `stretchRule`: righe e
  colonne interne ripetute, la porta una sola, `steps` diviso per (20/16)²) o, se così un luogo perde spazio, solo fino a 7 (`least`), i timbri a 16;
  i piani di quell'ambiente prendono `vpt: 16`. Si prende la prima via che il validatore degli ambienti accetta e con cui **nessun luogo perde una
  struttura** che i suoi lotti tengono oggi (`structureLotSizes`, come `claimSizes`) **né una che oggi sta su un lotto, anche se non la tiene**
  (`losesStructure`, T435: ogni lotto dà una struttura del piano, e la partenza di sidera mostrava le sue due Grandi su case di 5 × 4 che le case
  allargate a 7 × 7 non trovavano più sulla sua bozza; un ambiente con una struttura senza lotto si ritaglia anche lui); altrimenti **lo riscrive il Cartografo** (T422, ADR-0218,
  `ambiente:<id>` col compito `environment.recut`, `recutEnvironment` in `agents/cartography.ts`): gli si dice il programma, il lato che i suoi edifici
  devono avere (7 una Grande a 16, 10 un'Enorme; mura comprese), i suoi luoghi con le strutture, gli edifici di oggi e la bozza (le quote dei terreni,
  intera per i luoghi con una struttura); il kernel prova la risposta col validatore e sulle bozze vere dei luoghi (`recutFaults`: ogni struttura del
  piano trova un edificio che la tiene, ogni edificio di 5 o più sul lato lungo tiene una casa comune riscolpita), e ciò che non tiene gli torna col
  motivo, fino a 3 volte (`RECUT_TRIES`); scritto (commit del kernel), i suoi piani prendono `vpt: 16` e le densità si ricalcolano sui lotti nuovi.
  Se il Cartografo non riesce l'ambiente resta com'era (una mancanza) e le strutture che vi stanno si riscolpiscono **a 20** (`vpt: 20` nella voce,
  gli stessi voxel: la taglia non cambia al caricamento). Un ambiente già ritagliato non si ritaglia di nuovo. Una struttura resta a 20 solo se un lotto che la porta la mostrerebbe a 16 più piccola di quanto la mostra oggi (`shownRank`, T436, ADR-0223: il bistrot Enorme di neapolis su una casa di 7 × 8 è Grande sia a 20 sia a 16, e va a 16). Il Cartografo riceve un lato per tutti gli edifici grandi (7) e uno per la struttura più grande, che si disegna per prima, una per luogo; il bordo del luogo resta quello della bozza; nel ritorno anche la pianta dei luoghi che non tengono dopo il suo programma (`Kernel.placeLaidOut`). `--ambienti <id,…>` gli manda un ambiente anche dove una via del kernel non perde strutture; `--giro <nome>` dà a un compito il suo progresso (`<nome>.rigenera-modelli-<giro>.json`), così rifà ciò che il generatore ha già fatto. `piano-rigenerazione.ts --prova <ambiente> <programma.json>` prova un programma sui luoghi come il kernel prova quello del Cartografo; `--bozze` stampa le bozze. Cosa farebbe la rigenerazione a un
  universo sul disco, senza chiamate: `lab/scripts/piano-rigenerazione.ts`. Prima di scrivere, la testa dell'universo prende il tag `prima-della-rigenerazione` (una volta, `tagUniverse` con il git di `server/git.ts`).
  Il progresso sta in `universes/.generation/<nome>.rigenera-modelli.json`; il comando aspetta fino a 2 minuti chi serve la coda, poi si ferma. Nella
  pipeline una voce di `generazione` con `"rigenera": "modelli"` lancia `comandoRigenera` e ha il suo posto nello stato (`<nome>:rigenera-modelli`, T88).

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
**Il luogo che il budget ferma** (ADR-0231, T457, kernel 0.10.7): se il Cartografo non si può chiedere perché il budget è finito (`BudgetError`: il testo della sessione, `ai.maxText`; il tetto del giorno del varco; una chiave senza credito) il luogo resta bozza trattenuta, niente piano di ripiego salvato né carta, e per `Kernel.BUDGET_RETRY` (60 s del mondo, `budgetHeld()`) i luoghi nuovi restano bozze senza chiamate; poi uno si richiede. `planAhead` risponde `no`. Ogni altro fallimento (tre risposte invalide, un errore) dà ancora il ripiego del kernel, «Terra senza nome» con un ambiente del mondo, salvato.
**Fucina**: concetto (tipo, contesto, aspetto, comandi, azioni, contenitore, cose portate, persona,
unicità) → fisica → codice → Arbitro → validatore → commit → bibbia; il modello (`appearance.model` suo, con la `classe`) lo scrive poi lo Scultore; gli oggetti dei pacchetti
hanno una forma comune (`forma-…`, un programma per forma, ricolorato), i terreni con cose sopra un modello loro. **Genesi**: bibbia → stile → terreni (Fisico) → Arbitro → ambienti (provati) →
pacchetto di oggetti → cast (5 npc diversi, 5 oggetti/mobili, 2 strumenti) → commit.
**Ambientazioni** (ADR-0134, censimento in `docs/temi-censimento.md`): la schermata offre sette testi (`WORLD_THEMES`: medievale, steampunk, moderno, futuristico; far west, pirati e spazio, ADR-0221, che non chiedono di navigare né il vuoto: le isole si camminano, il mondo lontano ha l'aria che si respira), che si possono riscrivere; il kernel non sa quale, resta `prompts/theme.md` e l'epoca la portano bibbia e stile. I prompt e il canone parlano di epoca; i nomi dei timbri sono forme e non escono dal programma. `case_comuni` dell'Artista diventa `commonHouse` nel manifest dei terreni: i lotti senza struttura chiesta hanno allora un modello del mondo (`commonHouseModel`, per classe, primo nella coda del `ModelDirector`), altrimenti quelli generici del seme. Con meno di 3 ambienti generati restano solo quelli senza epoca (`TIMELESS_LAYOUTS`). `?offline` può fare una Genesi con i modelli locali, solo per le prove: scrivono sempre Valmora. Per questo i modelli dicono il mondo che scrivono (`AiModels.world`: i locali `LOCAL_WORLD`, Valmora) e sopra un universo con un'altra bibbia (`kernel.localModelsAbroad()`, ADR-0222) non pianificano: un luogo senza piano resta bozza trattenuta (`develop`, `pumpDevelopment`), un personaggio senza individuo resta il suo archetipo (`npc/people.ts`, niente in `world/people.json`, niente scheda dell'Attore); il salvataggio della partita resta. Con l'aggiornamento dal seme un manifest riscritto riceve gli ambienti nuovi del seme solo se l'universo è dell'epoca del seme (`seedAged`: il tema medievale com'è, quello da cui è nato, o nessuno), altrimenti solo quelli senza epoca (`mergeKeyed`).
**La lingua delle richieste** (ADR-0165, T310): i prompt del Concilio sono inglesi (ruoli in `prompts/agents/`, tema, principi, frammenti degli agenti e del kernel); ogni richiesta è ruolo → principi → blocco «Lingua» (`languageBlock(languageOf(files))`, `src/kernel/language.ts`: il testo del mondo nella lingua dell'universo, `universe.json → language`, `it` se manca; gli id dello schema in inglese) → contesto dell'agente → `system` del compito → focus. Gli schemi elencano i valori interni (`internalValues`) e nominano i campi in inglese (T310b, ADR-0190: `say`, `title`, `beats`, `possible`, `story`…; `Council.ask` riporta i campi di prima con la tabella `campi-risposte`, `internalAnswer`, a ogni profondità; `storia`, `oggetti` e `tag` li legge ciascun lettore perché cambiano senso fra schemi); la riparazione dei valori italiani resta un contratto ancora. Il contesto del mondo (bibbia, canone, lessico, catalogo, grafo) resta nella lingua del mondo, i motivi del validatore e del kernel in italiano (sono anche il registro). La quarta parete (`metaBreak`, `glossaryBreak`) legge la lingua del mondo, l'italiano e l'inglese, una tabella per lingua; i prestiti italiani (`server`, `loop`) solo in un mondo italiano.
**Mancanze** (ADR-0130): una richiesta che finisce male, di un viandante o del mondo, è una voce di `world/shortfalls.json` (`noteShortfall`, `ShortfallLog` in `src/kernel/shortfalls.ts`): richiesta, chi (`comune` se è il mondo), agente, compito, esito, motivo, volte. Gli esiti: `rifiuto` (Referente, azione o fabbricazione libera giudicata impossibile, anche quando è già una regola), `invalido` (il validatore ha rifiutato l'ultimo tentativo o scartato ciò che il Concilio proponeva: Fucina, ambienti, meccaniche, rune, pacchetti, piani dei luoghi, trame, modelli, brani), `errore` (il modello non ha dato una risposta usabile), `guasto` (l'Ingegnere non ripara). Non si conta ciò che manca al viandante (non ha gli ingredienti, non può chiedere rune) né la combinazione di due oggetti giudicata impossibile: il Narratore lì è severo di proposito. La stessa richiesta allo stesso agente per lo stesso compito è una voce sola; tetto di 500 voci. Il file si scrive prima di ogni commit e il salvataggio lo porta anche se non è cambiato altro; come i consumi sopravvive ai rollback. Il kernel del ramo del master non tiene niente: passa la voce al mondo. Nessun file di `playerFiles`/`publicFiles`, niente nel gioco; il master lo vede solo come ogni file del suo universo. `npm run mancanze [-- <universo>] [--cartella <dir>]` stampa il rapporto per il kernel 1.0.0.
**Le direttive del master** (ADR-0191, T374; ADR-0188 punto 4): `world/campaign.md`, nella lingua del mondo, a sezioni per squadra (`## Per tutti`, `## Narratore`, `## Cartografo`, `## Scultore e Artista`, `## Ingegnere e Fisico`, `## Musicista`; i titoli valgono in ogni lingua del mondo e per id), dicono **come** si fa il mondo da qui in avanti, mai i fatti (quelli stanno nella bibbia, nelle persone, nelle trame, nell'atlante). `src/kernel/campaign.ts`, puro: `readCampaign` (sezioni, righe senza commenti né caratteri invisibili, i tetti di 4.000 caratteri per sezione e 12.000 per il file tenendo le prime righe, gli errori di forma per il validatore, le righe che `metaBreak` ferma in `left`), `campaignSectionsFor` (ogni agente «Per tutti» e la sua; l'Arbitro e il Referente tutto; l'Attore solo «Per tutti»), `campaignPrompt` (il blocco, intestazione inglese, righe nella lingua del mondo), `withDirective` (una riga in fondo alla sua sezione, la sezione o il file dal modello se mancano, i tetti), `directiveText` (`cleanText` di `src/kernel/cleantext.ts` e `metaBreak`). `Council.context` mette il blocco dopo il riassunto della partita, nella parte stabile (la cache la serve), e lo rilegge solo quando cambiano il file, il lessico o la lingua; una riga lasciata fuori la dice una volta nel registro (solo il master lo sente). Le decisioni chiuse non lo ricevono, e la quarta parete delle direttive è solo locale: il testo del master non va a Jev (D54.5). Il Referente ha l'incarico `directive` (`section` nello schema): `Kernel.addDirective` la scrive solo per il master, `- (giorno N) …` in fondo alla sua sezione, un commit del kernel; se la quarta parete la ferma torna al Referente una volta col motivo, poi il motivo va al master e la mancanza è `invalid`. L'editor mostra il file anche quando manca (`campaignTemplate`, le sezioni vuote e una nota in un commento) e, salvando, dice le righe che restano fuori; in una partita di molti va sul ramo del master e nel mondo quando pubblica. Non esce ai client (`playerFiles`, `publicFiles`: V-037). La misura: `npx vite-node lab/scripts/prompt-tokens.ts -- --campaign [--file f.md]`.

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
  cosa sono voci del suo menu (`modello:<nome>`), anche quelle nate da «Altro…» (ADR-0044). Una cosa si trova dal suo centro
  (`nearest`: davanti 1,4 caselle per `E`, 0,75 dalla casella cliccata); se lì non c'è niente, dalla sua impronta (T426,
  `builtAt`): la cosa solida i cui voxel sopra il suolo, come il programma li ha fatti, stanno nella casella cliccata o subito
  davanti al viandante (da 0,3 a 1,2 caselle), così la porta di una struttura Grande, che ha il centro a più di tre caselle, si
  apre e si chiude da fuori e da dentro. La porta chiusa blocca: il corpo urta l'impronta dell'istanza (`groundOf`, con `done`),
  mentre il cammino che il validatore misura nelle forme la apre (`walkIn`). **Per piano** (T431): `E`, il tasto destro, l'azione
  di ciò che si impugna e il cursore trovano solo ciò che sta sul piano del viandante (`onFloor`: l'altezza della cosa, `pos.z` o il piano
  terra, da mezza casella sotto i piedi a meno di 1,5 sopra, `FLOOR_UNDER`, `FLOOR_ABOVE`; un piano è alto 1,9 caselle), così dal piano di
  sopra non si apre la cassa del piano terra; una struttura vale su ogni suo piano. Chi sta su un piano o in cantina (i piedi a più di
  mezza casella dal suolo) punta il cursore sul piano dei suoi piedi (`toReal`, `FEET_OFF`), non sul suolo sotto. Il cursore trova una
  cosa anche dalla sua impronta su quel piano (`builtAt` con i piedi: l'estremità di un bancone) e i mobili che il kernel ha posato in un
  edificio (T410), che sono voxel dell'edificio e non entità: `FormResult.furniture` dà di ogni pezzo l'id e la scatola nella griglia
  (`PieceBox`, da `furnishWithRules`), e `furnitureAt` trova il pezzo la cui scatola sta sulla colonna del cursore e il cui piede è entro
  mezza casella dai piedi: il suo nome della libreria, «Arredo — *concetto dell'edificio*» (`FURNISHING` = 2 nella chiave dell'interno, così
  la cache del browser rifà gli edifici arredati prima, senza le scatole).
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
- **Gli abiti degli individui** (ADR-0181, T353): la scheda di `npc.individuate` dice anche cosa indossano (`indossa`: 0–3 capi per testa,
  busto e schiena, i comuni quando vanno bene; un animale niente), nella stessa chiamata di prima; i capi che il mondo non ha entrano con
  `introduceItems` nella stessa chiamata di ciò che portano; la scelta resta in `world/people.json → wears` (`Identity.wearing`). Le zone
  che la scheda lascia nude le veste il **mestiere**, senza chiamate (`outfitOf` in `npc/outfits.ts`, puro, dalla faccia `model.ts`): fra i
  capi del mondo uno il cui nome, descrizione o tag comincia con una radice del mestiere (`tradeStems`: parole di almeno quattro lettere
  tagliate a 4–7, «contadina» e «contadini» una radice sola; `garmentOfTrade`), scelto da un hash del nome e della zona (lo stesso
  individuo sempre uguale, non tutti uguali); un mestiere senza capi non veste. Il seme ha il cappello di paglia (contadini, pastori) e il
  grembiule di cuoio (fabbri, fornai). `People.dress` mette i segni nell'inventario dell'individuo (`dressInventory` in `wearing.ts`: il
  capo nella tasca in cui sta o aggiunto, il segno sulla zona) dopo ogni individuazione, anche di chi è già nel registro (rivisto dopo
  che un luogo è stato lasciato): il renderer li legge come quelli del viandante (`wornBy`), il filo li porta in `EntityView.worn`
  (`#multigiocatore`). La zona la dà la porta (`NpcHost.wornZone`). Gli individui non si cambiano: chi veste è l'individuazione.
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
  mestieri del seme sono dodici, con i nomi delle sette ambientazioni (pastore, fabbro, oste, mercante, guardia, sacerdote, scrivano,
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
- **Individui e trame dichiarati dal master** (ADR-0192, T376; ADR-0188 § 5.2-5.3): l'incarico `individual` del Referente porta al Narratore
  i fatti del master (`npc.individuate` con `facts` e il nome detto, una chiamata, la manopola `people`), solo per il master, puliti
  (`cleanText`) e col filtro locale (`metaBreak`, mai Jev); il luogo è un luogo pianificato per nome o una regione dell'atlante, il tipo
  quello che i fatti nominano (`Kernel.declareIndividual`). L'individuo sta in `world/people.json` con `declared` (`place`, `at` o
  `region`); senza `origin` è **atteso**: il primo `applyPlan` del suo luogo (o subito, se è caricato: `settleLoaded`) mette nel piano un
  personaggio del suo tipo marcato col suo nome (`individual` sull'oggetto, `settleDeclared`), gli dà l'origine `<luogo>#o<n>` e chi
  nasce lì è lui, fuori dalla varietà e dalla manopola delle persone. Il grafo (`atteso`, `dichiarato`) e il silos li mostrano.
  «Scrivi trama» nel tavolo della situazione (solo il master): titolo, mistero, fino a 8 tappe; `masterPlot` (`cleanText`, giorni 0-4,
  momenti e posti del mondo, `reviewPlot`) e `Kernel.writePlot` (`saveFile` di `world/plots.json`, nessuna chiamata, niente missioni);
  le tappe accadono come quelle del Narratore. «Modifica» sul leggio apre la bibbia nell'editor, solo per il master.

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

- **Geografia** (ADR-0023): biomi nel generatore (`s j o k n`), 21 ambienti nel seme (il porto da T443), nodo `stamp` di
  MarkovJunior, atlante di regioni (`world/atlas.json`), direzioni note a NPC e Cartografo.
- **I timbri e gli ambienti per le strutture a 16** (ADR-0211, T407, kernel 0.9.1): ogni edificio che un timbro o un ambiente del seme
  disegna tiene la struttura per cui è tagliato, nei due versi, senza scendere né sporgere (`STAMP_SIZES` in `stamps.ts`: il tempio
  di 10 × 10 un'Enorme; casa (7-8), mastio del castello, caserma della fortezza (14 di lato), torre, piramide (7 × 9), sotterraneo (le
  stanze verso gli angoli), le due sale della caserma (14 × 7) una Grande; capanne e stalla del recinto una casetta; il borgo 7 × 7,
  la locanda 10 × 10 per un'Enorme, un lotto solo). A 16 i timbri **non si coprono** (`StampCut.claimed`: tutta la scatola di ognuno)
  né coprono o toccano gli edifici delle regole (`built`: i codici di muri, porte e pavimenti interni), un loro muro o recinto **non
  tocca il bordo** né le caselle ferme (un varco del luogo resta raggiunto attorno), e ogni ingresso sul loro bordo (porta, ponte, strada)
  dà su una casella raggiungibile, che poi resta loro; le case delle regole del borgo, della locanda e dei campi hanno **un anello di
  terreno libero** attorno (l'ingresso della regola più largo di una casella, `*` nell'uscita), così né un varco né la porta di un'altra
  casa restano chiusi (regola 10; il prompt del Cartografo lo insegna); il borgo le mette con `all` (al più quattro, mai addossate).
  Un mobile solido che non entra in nessuna casa del luogo sta accanto alla sua, fuori dai lotti, dove il controllo del posare lo ammette
  (`placeInside` con `spotFailure`), mai sulla casella del piano dentro i muri; un lotto rifatto al caricamento lascia com'erano le
  caselle che il piano ha cambiato (`edits`). **I piani di prima**: il kernel scrive
  `vpt: 16` su ogni piano che fa (`ChunkPlan.vpt`, Cartografo, blocco, riempitivo); un piano che non lo dice è di prima e i suoi timbri
  sono quelli di allora (`layout(…, { vpt: TILE })`, `patternAt20`), perché le sue modifiche, le cose e le forme dei lotti sono per
  casella. **Gli ambienti che un universo ha** restano suoi (`keepEnvironments` in `upgradeFromSeed`): un programma del seme cambiato
  non arriva dove l'universo ha già quell'ambiente, arrivano solo gli ambienti nuovi. `tests/stamp-lots.test.ts` lo afferma per ogni
  timbro e ambiente del seme.
- **Le regioni del master** (ADR-0201, T375, kernel 0.7.11; ADR-0188 § 5, D54.6): una regione dell'atlante con `master: true` l'ha dichiarata
  il master, e vince su quella del Cartografo dove copre un luogo (`regionAt`; fra le sue la più vicina, così un'isola è una regione piccola dentro
  la grande); non toglie il suo ambiente al resto del mondo (`environmentsFor`). `kind` dice che cosa fa ai luoghi nuovi: assente, li pianifica il
  Cartografo con l'ambiente della regione; `filler` (il **riempitivo**), il kernel li stende col programma dell'ambiente e il seme del luogo
  (`fillerPlan` in `develop`: nome e descrizione della regione, nessuna cosa, persona, runa o struttura chiesta, nessuna carta, il piano salvato),
  senza chiamate né battiti del mondo (`applyPlan`), fuori dalla quota e dalla pausa; `held` (la **trattenuta**), restano bozze (la pompa e
  `planAhead` li saltano) finché il master non la libera o la cambia. I luoghi già pianificati restano come sono. Le dichiara e le libera solo il
  master: `Kernel.declareRegion`, `releaseRegion`, controllate da `masterRegion` (`cleanText`, `metaBreak`, `MASTER_REGION_LIMITS`: raggio 0-8,
  centro entro 200, 32 regioni, nome 40 e descrizione 200 caratteri; un ambiente del mondo, facoltativo per `held`; mai sul primo luogo; un `id`
  cambia solo una regione del master), scritte dal kernel in `world/atlas.json` con un commit suo; sul filo il messaggio `region` (`declare` con
  `region`, `release` con `id`), col ritmo di `pace`, e il client sottile del master le manda da lì. Ai giocatori l'atlante coi campi di
  `REGION_FIELDS` e senza le trattenute (`playerFiles`). Nello studio: l'atlante dell'Ufficio dei luoghi (un clic sceglie un luogo, «Dichiara
  regione qui», le regioni del master con «Cambia» e «Libera», il riempitivo tinto e la trattenuta tratteggiata) e la Direzione («Dichiara regione»,
  «Regione qui» sui luoghi in coda, i luoghi trattenuti detti sul tavolo), con lo stesso modulo (`src/ui/regions.ts`). Nel sito la pagina della
  sessione fa le stesse cose senza entrare (ADR-0202, `#sito`).

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
- **Il costo di ogni carta e il server** (ADR-0195, T365): il timbro ha anche `usd` (i dollari delle chiamate che l'hanno fatta) e `server`
  (l'origine del server il cui mondo l'ha fatta), facoltativi, letti con `costFields`. `CARD_MAKERS` dice quali compiti fanno le carte di
  un compito del timbro (una chat, una guardia, una sessione non fanno carte); ogni chiamata (`Kernel.called`, anche Jev) aggiunge `callCost`
  al suo gruppo in `CardCosts`; un timbro prende la sua parte e la divide tra le carte che firma (`stampFiles(…, settle)`, `priceCards`): tutto
  ciò che è in attesa, o diviso per le richieste aperte dove girano insieme (`begin` nella Fucina e nei luoghi). Il `server` lo dà solo il server
  di produzione (la prima di `QUINE_ORIGINI`, per valore sul canale fino a `KernelOptions.server`); da soli nel browser e in sviluppo non c'è.
  Un clone e una carta portata tengono ciò che dicevano; impronte e quote non cambiano.
- **Crediti e spese comuni** (ADR-0081, T45a, ADR-0104, T125): saldo crediti per viandante nel `Ledger` del kernel (`kernel.ledger`; sul server `universes/.balances/<nome>.json`, fuori dalla storia; `kernel.creditsOf`, `deductCredits`); ricaricato a mano solo dal master, dalla console (`grantCredits`, messaggio `recharge`), entro il tetto al giorno per universo (`QUINE_TETTO_RICARICHE`); il Referente non dà crediti. Ogni chiamata scala dal pagante (`payerOf`) costo modello + commissione di piattaforma (`costWithFee`): la decide solo il server (`QUINE_COMMISSIONE`, `platformFeeOf` in `server/ledger.ts`, predefinita 0,01; 0 è ammesso, un valore che non sia una frazione da 0 a meno di 1 dà il predefinito, ADR-0132; 0 sempre con `QUINE_PAGAMENTI=spenti`, ADR-0189), arriva al mondo per valore (`worldEnv`, `KernelOptions.platformFee`, `kernel.platformFee`) e si mostra da lì: `Wallet.commissione` sul sito (`feeText`), `ingresso.commissione` nella console del master (`showPlatformFee`, solo uno specchio); mai da `universe.json`, Lua, Concilio o client. Ricariche e consumi sono lineari, senza fasce né interessi: un credito è un dollaro; i consumi su disco tengono il costo senza commissione, quindi il portafoglio mostra anche i giorni passati alla commissione di oggi; le spese comuni (`comune`) sono divise in parti uguali tra tutti i giocatori collegati in quel momento (`splitCost`), master compreso, escludendo gli anonimi. A crediti esauriti (`crediti <= 0`) o per viandanti anonimi (`anonimo: true`, 0 crediti non ricaricabili): le richieste personali sono risposte dai modelli locali (`MockAiModels`) e il giocatore lo sa (`stato.crediti` nell'aggiornamento, avviso nel feed).
- **Le chiavi dei giocatori** (ADR-0197, T363): dove il mondo va su OpenRouter con le chiavi dei giocatori (`kernel.payWithKeys()`) niente è
  prepagato: `hasCredits` guarda chi ha una chiave valida (`setKeys`, per valore dal server) e il tetto della lobby, il saldo non conta; ogni chiamata
  scrive nel ledger la **spesa** di chi ha pagato (`Ledger.spend`, `spentOf`: `usd` e la parte `common`), le comuni vanno a turno sulla chiave di chi ne
  ha pagate meno (`keyPayersFor`), e `chi`, il registro dei consumi e le carte non cambiano. Il resto in → #gemini.
- **Il master paga tutto** (ADR-0188, T372, D54.1-2): con `game.expenses = master` (`kernel.masterPays()`) `chi` non cambia (regola 8i: i ritmi, il registro dei consumi e le mancanze dicono chi ha chiesto); cambia chi viene addebitato, in un punto solo, `billedTo(chi)`, che `charge` usa: ogni chiamata, personale o comune, scala dal master, senza `splitCost`, e ciò che ha pagato per un altro va in `world/usage.json → masterPaid` (giorno → chi ha chiesto → conteggio; `usage.paidByMaster`, `paidForOthers`; assente dove nessuno ha pagato per un altro). `hasCredits` risponde con la borsa del master per tutti (`canPay(masterId)`: saldo e tetto della sessione del master): a saldo zero o al suo tetto tutti passano ai modelli locali, e l'avviso `credits` va a ogni client (ai giocatori «i crediti del master»; la modale non propone a loro la ricarica, `masters`). Le comuni senza account restano libere come prima (`commonNeedsPayer`). Un anonimo resta ai modelli locali **a meno che l'universo sia privato** (`kernel.privateWorld`, che il server dirà per valore con T366). Le carte: titolare è chi paga, il master (`sign` con `billedTo`: pagante e titolare, quindi anche le quote dell'eredità; niente spoiler nelle collezioni dei giocatori; scambi e cessioni più avanti). Il portafoglio (`/api/crediti`, `server/wallet.ts`): `masterPays` e `master`; nella spesa di un giocatore non c'è ciò che il master ha pagato per lui (`payers − masterPaid`); quello del master ha le righe `paidFor` (giorno, per chi, richieste, costo; `comune` è «il mondo») e `paidForTotal`, che `site/pagamenti.html` mostra in «Pagate per gli altri» (`walletNote`, `paidForName`). Il portafoglio legge il registro di ogni contratto (`payers`, e `paganti` di prima: da un mondo acceso prima di T372 i consumi non comparivano).
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
- **Ciò che si indossa, tra molti** (ADR-0180, T290): il messaggio `item` con l'operazione `wear` (`Kernel.wearSlot` sul server), che il
  client sottile fa subito anche da sé, come `wield` (anche «Usa» e il doppio clic su un capo: `useSlot` lo manda come `wear`); il proprio
  inventario arriva intero in `MyState`, i segni `worn` compresi. Agli altri `OtherView.worn` porta zona → id dei capi (`wornItems`, letti
  come li legge il kernel; dell'inventario nient'altro, regola 8f), il client sottile li mette in `remote.worn` (`readWorn`: solo le tre
  zone, testi tagliati) e ne fa il corpo con i suoi file. Gli individui (ADR-0181, T353): `EntityView.worn` porta zona → id dei capi di
  un'entità con segni nell'inventario (`wornItems`; dell'inventario nient'altro), il client sottile lo mette nel componente `worn` dello
  specchio (`readWorn`), che `wornBy` legge dopo `remote.worn` e prima dei segni; se ne va con il prossimo `update` senza segni.
- **Il veicolo tra molti** (ADR-0232, T442): il server porta sul ponte anche chi gioca da un suo client; ai client la posa del veicolo a elenco
  (`EntityView.vehicle`), che lo specchio porta avanti invece di inseguirla; il passo sul ponte nel riferimento del veicolo (`step.on`); gli altri
  a bordo dove stanno sul ponte (`OtherView.on`, `lx`, `ly`); timone, ancora e «Tuffati» dal menu dello specchio; le parole del mondo a un viandante
  fuori dai suoi messaggi con l'avviso `world`, il posto che il mondo gli dà con una correzione subito (`wanderer:pushed`). Il resto → `#veicoli`.
- **L'universo privato** (ADR-0194, T366; ADR-0188 punto 2): gli ospiti e gli inviti di un universo di molti stanno fuori dall'universo,
  `universes/.campaign/<nome>.json` (`CampaignArchive` in `server/campaign.ts`: `private`, `guests` per id, `invites` per impronta SHA-256 del
  token), scritto intero sotto un lucchetto fra processi (`server/lockedFile.ts`); un file illeggibile vale privato e senza ospiti; un universo
  che nasce con un nome e un clone nascono pubblici. **Chi lo vede** (`letsIn`): il mondo, il master (mai un anonimo), gli ospiti (anche anonimi).
  A chiunque altro non esiste: lo store risponde come per un nome senza universo (`{ exists: false }` allo snapshot e a `carte`, «solo da questa
  macchina» al resto), `/api/universe` non lo elenca (a chi lo vede lo dice in `invite`), `/api/session` non dice mai un universo privato,
  `kin`, `bring`, `/api/viandante`, `/api/crediti` e il `from` di una carta fatta a mano lo saltano. **L'ingresso**: `admit` rifiuta chi non è
  master né ospite («questo mondo è su invito») prima di `open`; il mondo sa solo se è privato (`WorldOpen.private`, `setPrivate` fra le
  `WorldCalls`, `kernel.privateWorld`, che fa pagare al master un ospite anonimo, ADR-0188), mai chi sono gli ospiti; il server tiene chi ha
  ammesso (`wanderersIn`) e chiude i socket di chi è tolto (`expelFrom`). **La rotta** `/api/universe/<nome>/guests` (`guestsAnswer`): `GET`
  la lista e gli inviti vivi (per nome, l'inizio dell'impronta; mai un token); `POST` `{op:'private', value}` (diventando privato chi è nel
  mondo resta come ospite), `{op:'add', id, note?}`, `{op:'invite', days?, uses?, note?}` (7 giorni e un uso se non detto, il token **una
  volta** nella risposta); `DELETE` `{guest}` (chiude i suoi socket; un'identità nata da un invito di quell'universo è revocata) o `{invite}`;
  solo il master, mai il mondo, JSON di al più 4 KiB, `CAMPAIGN_LIMITS`. **L'invito si usa** con `POST {op:'redeem', invite}`, aperto a tutti,
  prima di leggere l'universo: con un account aggiunge l'account agli ospiti (l'invito non è un'identità), un ospite già dentro non lo spende,
  le stesse parole per un token mai esistito, speso o scaduto. Il link è `/?universo=<nome>#invito=<token>`: il frammento non arriva a nessun
  server, la pagina lo toglie dall'indirizzo (`takeFromAddress`) e lo usa (`redeemInvite` in `src/session/login.ts`) prima dello snapshot; uno
  snapshot che non c'è si rilegge come chi è già collegato (`signedIn`, senza chiedere) o, senza account, come il viandante della scheda (T377: prima il master non entrava nel suo universo privato su un server senza account); se non c'è nemmeno così, con gli account da un'altra macchina
  (o su un server a inviti) la pagina dice che non c'è o è su invito. Nella console del master, scheda «Universo», la
  sezione «Ospiti e inviti» (`Console.guests` → `UniverseClient.guests`): privato o pubblico, ospiti con «Togli» a due clic, inviti con
  «Revoca», «Aggiungi ospite», «Crea invito» col link mostrato una volta. Nel sito le stesse cose dalla pagina della sessione (ADR-0202, `#sito`),
  e l'hub delle sessioni mostra «SU INVITO» gli universi privati al master e agli ospiti, gli unici a cui l'elenco li dice.

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
- **Il verificatore a inviti** (ADR-0194, T366; ADR-0184 § 8): per chi ospita senza Firebase, `QUINE_ACCOUNT=inviti` e `QUINE_SEGRETO_INVITI`
  (almeno 32 caratteri; il server di produzione non parte senza, né con Firebase insieme). Un'identità è un token `qid1.<{id, exp}>.<firma>`
  (HMAC-SHA256 con una chiave derivata dal segreto, confronto a tempo costante; `signIdentity`, `readIdentity` in `server/invites.ts`) per un id
  `inv-` e 16 lettere casuali, che il verificatore di Firebase rifiuta come uid (`refusedUid`): un account e un invito non condividono mai un
  viandante. Vale se l'id è nel libro delle identità (`universes/.identities.json`, `IdentityBook`: quando, da dove, se revocata; mai un token) e
  non è revocato; un libro illeggibile non fa entrare nessuno. Nasce da un invito usato senza identità (`redeem` risponde `identity`, una volta),
  scade in 30 giorni e si rinnova a ogni ingresso (`POST /api/account`, `accountHandler`); il browser la tiene in `localStorage → quine:identity`
  (`signInWithIdentity` in `src/session/login.ts`; `GET /api/account` dice `{ invites: true }`). Il padrone del server è `inv-owner`:
  `npm run inviti -- padrone` (`tools/inviti/cli.ts`, sulla macchina del server, col `.env`) lo fa o lo rifà e stampa il link
  `…/site/profilo.html#accesso=<token>`; `elenco` e `revoca <id>` per il resto. Togliere un ospite revoca l'identità nata da un invito di
  quell'universo; quella nata altrove resta. `whoAsks` dice `account: 'invito'`, il profilo del sito «SU INVITO».

<a id="self-hosting"></a>
## Il self-hosting: l'immagine e la guida

- **Il pacchetto** (ADR-0203, T367): il server di produzione (ADR-0112) consegnato a chi ospita. `Dockerfile` a tre stadi su `node:22-bookworm-slim`:
  la build (`npm ci`, `npm run build`, `npm run build:server`), le dipendenze di esecuzione (`npm ci --omit=dev`: il server importa solo
  `firebase-admin`), ciò che gira (git, tini, `dist/`, `dist-server/`, `site/beta.json`, i due script). Gli universi in un volume su
  `/app/universes`; dentro il container `QUINE_HOST=0.0.0.0`, la porta `QUINE_PORTA`, `PORT` o 8080; `HEALTHCHECK` su `/healthz` (ADR-0189).
  `KERNEL_VERSION` (argomento di build) deve essere la versione di `package.json` o la build si ferma; diventa le etichette `quine42.kernel` e
  `org.opencontainers.image.version`. `npm run immagine` (`tools/produzione/immagine.mjs`) etichetta `quine42:X.Y.Z` e `quine42:X.Y`, mai `latest`.
- **Chi gira**: `quine-avvio` (`tools/produzione/immagine/avvio.sh`) parte da root solo per dare a `node` la cartella degli universi (un volume
  nuovo di Fly o Railway è di root), poi `exec setpriv` a `node`. Il comando del padrone (ADR-0194) è `inviti` nell'immagine
  (`tools/produzione/immagine/inviti.sh` → `node dist-server/inviti.mjs`, che `buildServer` costruisce da `tools/inviti/cli.ts`), anch'esso come `node`.
- **Compose** (`docker-compose.yml`): `quine` col `.env` come `env_file`, la porta su `QUINE_PUBBLICA_SU:QUINE_PUBBLICA_PORTA` (predefiniti
  `127.0.0.1:8080`), il volume `universi`, l'immagine `quine42:${QUINE_KERNEL}` (richiesta); i profili `tunnel` (Cloudflare Tunnel con nome,
  `CLOUDFLARE_TUNNEL_TOKEN`), `tunnel-rapido` (trycloudflare.com) e `backup` (un `tar` del volume in `./backup/`, a server fermo).
- **`.env.example`**: ogni variabile, vuote chiavi, segreti e token, la open beta detta (`QUINE_PAGAMENTI=spenti`, `QUINE_ACCOUNT=inviti`); com'è,
  `productionProblems` chiede solo `QUINE_SEGRETO_INVITI`. `.dockerignore` tiene fuori `.env` e ogni `.env.*` tranne l'esempio, gli universi, le
  build, `node_modules`, `.git`, le cartelle degli agenti, `backup/`.
- **La guida** per chi ospita: [`docs/self-hosting.md`](self-hosting.md) (la fiducia, il contratto e gli aggiornamenti, il `.env`, il padrone,
  PC di casa, VM o VPS, Railway senza template, Fly, il pacchetto Node, `/healthz`, il backup e il ripristino, lo spegnimento). I test sono
  `tests/sicurezza/pacchetto.test.ts` (i file) e `produzione.test.ts` (il comando degli inviti costruito), V-043.

<a id="stripe"></a>
## I pagamenti con Stripe

- **La modalità senza pagamenti** (ADR-0189, T361; la open beta, ADR-0184): `QUINE_PAGAMENTI=spenti`, detto e letto da `paymentsOf` (`server/ledger.ts`; `accesi` o assente come prima, ogni altro valore un problema di `productionProblems`): le rotte di Stripe non sono montate (404, anche nel server di sviluppo), `STRIPE_WEBHOOK_SECRET` non è chiesto, la commissione è 0 (`platformFeeOf`); il gioco (lobby, pannello `P`, modale dei crediti) e il sito (crediti, profilo) mostrano una ricarica solo se `/api/stripe/config` dice `available` (`rechargesAvailable`, `src/ui/recharges.ts`); saldi, ricariche a mano del master e Jev restano. Il controllo di salute `GET|HEAD /healthz` (`HEALTH_PATH`) sta prima della porta d'ingresso: qualunque `Host`, la parola `ok`, 503 mentre il server si ferma, nient'altro.
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
- **Le carte guaste** (ADR-0172, T296): una carta portata (`brought`) che nel mondo non funziona si **isola**, con le sue copie (`cardFamily`: la stessa provenienza, la stessa carta e lo stesso programma, come le copie di `reused` e `shared`). Quattro modi (`BreakKind`, `src/kernel/brokencards.ts`): `fault` (il programma getta, o il suo worker si ferma o non risponde: `Forms.onFail`), `empty` (finisce senza un voxel visibile: `Forms.onReady`, `anyVisible`), `footless` (la indossa una cosa solida e la forma non ha niente all'altezza del corpo: `Form.footless`, in `rebuildSolids`), `mute` (un suono che non suona: lo dice il direttore del suono del client, `SoundDirector.onFail`, e `main.ts` lo passa al kernel). `Kernel.cardBroke` la mette in `Forms.isolate` (per il programma com'è scritto: riscritta, si riprova): `resolve` dà il generico della classe, chi la indossava lo veste e la aspetta (`wanted`), il terreno torna al suo aspetto, il suono tace, `broughtModels()` non la offre più agli agenti né al `ModelDirector`; il master vede il guasto `card:<id>` (in singola e nello specchio del master, quello con `publisher`), una riga `card.broken` del registro e la scheda «Universo» della console (`broughtCards()`: «Le carte portate», «funziona» o «⚠ non funziona» col motivo, «Togli» con due clic). Niente si salva: chi apre il mondo la ritrova guasta eseguendola; `R` non la guarisce. **In un mondo di molti** il mondo dice a ogni client l'elenco (`broken` in `welcome` e `update`, `readBrokenCards`), ogni specchio isola le stesse (`worldBroken`, `worn` sulle forme che arrivano). **La rimozione** (`Kernel.removeCard`; in un mondo di molti il messaggio `card` con `op: 'remove'`, solo del master, controllato nel server e nel kernel): ogni carta portata, anche una che funziona, con un commit del kernel dei soli `models/<id>.xml` e delle voci di `models/index.json` (`withoutCards`); chi la usava torna al generico e ai direttori (le strutture al modello del loro concetto, `structureModelFor`), entro `ai.maxModels`, `ai.maxPieces` e i coefficienti; ciò che il Concilio adesso non può rifare (`blocked()` dei due direttori: modelli locali, tetto, manopola a zero) è una mancanza (`world/shortfalls.json`, esito `fault`). La carta resta nell'universo da cui viene, nell'archivio del suo autore e nella storia: un ritorno a prima la riporta e la riprova (`Forms.release`). Nessun saldo si muove.

<a id="sotterranei"></a>
## I sotterranei

- **I sotterranei** (ADR-0091, progetto di T52a; T52b, T415, T416, T418 e T52f (T417) fatti, la cantina arredata dallo Scenografo (T419, ADR-0215, → `#lotti`), da attuare T52c e il resto di T52d): parti delle strutture sotto il suolo, mai un mondo a parte. La voce del modello dice `sotto: N` (1-3, `cellarOf`; la scatola della classe si allunga in basso, `Form.base` = `N · vpt` voxel sotto il suolo): pavimenti, collisione e taglio contano da lì (`levelIn` aggiunge `base`; fuori dal modello e dove non ha voxel sotto il suolo la terra è piena fino a `base`, `surfaces(…, fill)`), dalla cantina si esce solo per la scala, e ogni pavimento sotto il suolo si raggiunge dal piano terra (`groundOfForm`; altrimenti il modello entra senza cantina: `Form.hole` assente, posato comunque più in basso). Sulle colonne della cantina (`Form.hole`) `floorAt` ignora il terreno, sopra la tromba delle scale è aria (`rampBlocks`: una colonna sopra la cantina vuota al livello del suolo, T417; il pavimento del piano terra sopra la cantina, e ciò che vi sta, è un pavimento come gli altri) e il salto non ci atterra (`floorBelow`, `topUnder`); un modello tutto sopra la testa non ferma chi sta in cantina e uno tutto sotto i piedi, misurato dai suoi voxel, non ferma chi ci passa sopra (`formBlocks`, `topOf`), e un pavimento più di un gradino sopra i piedi non è sotto di essi (`floorAt` con l’altezza, T417); una cosa in cantina sta alla sua altezza per il kernel e per il renderer (`SolidForm.stand`, `restsAt`) e ai client va il componente `below: {z}` (`ENTITY_PARTS`); le cose del piano terra stanno a tre quarti di casella dalla tromba della cantina, quelle solide a 1,2 come dalle porte (`interiorPoints`, `WELL_KEEP`, `DOOR_KEEP`, T429: un bancone lungo una casella chiudeva l'uscita della scala), e le solide a 1,2 dalle prime pedate di una scala che sale (T431, `interiorPoints(…, stairKeep)`: un pavimento raggiunto più di un gradino sopra il piano terra e non oltre `TREAD_TOP`, una casella; non le persone, che lì stanno e lavorano: in sidera i muratori restavano senza posto); una cosa solida messa dentro sta in squadra con i muri (`squareIndoors`: il suo verso al quarto più vicino; girata in diagonale la sua scatola di collisione era più grande di lei e chiudeva la via dalla porta alla scala). La guardia degli interni lo faceva già per i mobili dello Scenografo, girati solo di quarti: due pezzi che si toccano d'angolo, o con un varco più stretto di un corpo, il secondo è rifiutato (`tests/interior-floors.test.ts`); il renderer posa il modello `kernel.sunk(id)` più in basso e abbassa il terreno al fondo della cantina (`kernel.holesIn(chunk)`, il buco) su tutta la sua impronta e solo lì (T415): una casella che la cantina copre solo in parte si apre sulle sue sotto-celle (`HOLE_CELLS` = 16 per lato, `holeCover`, una sotto-cella è del buco se lo è la colonna di voxel sotto il suo centro, calcolata una volta per cantina), con i fianchi dove incontrano il resto; prima si apriva solo la casella col centro sulla cantina, 3 su 15 della locanda a 16 voxel per casella. Dove il terreno resta il kernel sta sul terreno, dove si apre sui pavimenti della cantina (`floorAt`), come il disegno. Sul buco non si posano alberi né rocce del terreno. **Chi la chiede** (T417, T52f): il Cartografo dice `cellar: true` su una struttura del piano (`structures[].cellar`, «ogni tanto», solo vero) e mette le cose che vanno giù con `where: "under"` (`Where`; il validatore le porta `inside` se nessuna struttura del piano ha la cantina); il lotto la passa al componente `structure` (`cellar`: 1 casella, 2 per le taglie rare, `cellarFor`, solo per una struttura che cresce a regole, `hasCellar`) e il `ModelDirector` chiede la voce con la cantina (`SculptRequest.cellar`; il riuso offre solo modelli con la cantina, mai le parti `part-…`). Lo Scultore la scava con la parte del seme `part-cellar` (`universe/models/part-cellar.xml`, scritta da `lab/banco/taglie/parti.mjs`: `D` segnata sotto il pavimento di una stanza sul suolo, il pavimento `D`, i muri `V` di due, una scala lungo il muro davanti a pedate di 5 e alzate di 3, perché sopra la cantina il corpo vuole un pavimento entro un gradino su ogni colonna, che apre il pavimento sopra le pedate più alte; senza spazio sotto il suolo non fa niente) e la richiesta dice quanto scende (`cellar · 20` voxel, 1,25 caselle a 16, `cellarOfRequest`); i controlli girano nella scatola più bassa con `base` (`checkProgram(…, cellar)`, `analyse` con `base`) e vogliono la cantina che regge e che si raggiunge a piedi dalla porta (`habitableParts().cellar`, `cellarStoreys`); i piani raggiungibili non la contano (`reachableStoreys`, `aboveGround`, ADR-0162). Una struttura la cui cantina non regge torna allo Scultore col motivo (`cantina: …`) e, se ancora non regge, entra senza (`Checked.cellarOnly`, `cellarless`, `SculptResult.cellar` assente); il validatore prova un modello con la cantina come lo fa girare il mondo (`modelErrors` con `base`, `Validator.modelBase`). Le cose `under` vanno sul pavimento della cantina (`cellarPoints`: il pavimento sotto il suolo più comune, raggiunto dal piano terra, a 1,2 caselle dal piede della scala e a tre quarti dai suoi fianchi; `placeInside(…, under)` con l’altezza `pos.z` e `below`), altrimenti dentro. Offline la villetta dello Scultore ha la cantina quando la richiesta la vuole e i piani di `MockAiModels` ogni tanto chiedono «la casa con la cantina» con una cassapanca giù (`CELLAR_CHANCE`). La rigenerazione dei modelli (T411) passa `cellar` dalla voce nella richiesta.  la profondità del terreno si genera come su X e Y; oggi nella forma ridotta di T418 (`src/kernel/strata.ts`): i terreni degli strati sono `strata` del generatore (`layer: 'stratum'`, mai una casella delle mappe; il seme ne ha cinque, terra, argilla, sabbia compatta, fango e roccia viva, `SEED_STRATA`, e un universo senza i suoi ha quelli, `strataPalette`), la bozza per colonna dal bioma della bozza procedurale e da un hash della casella e del seme del mondo (`draftStrata`: terra uno o due caselle e argilla sopra la roccia viva da due o tre, sabbia compatta sotto la sabbia, fango sotto l’acqua, roccia sotto la roccia), `STRATA_DEPTH` = 4 righe di `S × S` codici nel piano (`ChunkPlan.strata`, scritte quando il luogo si pianifica; un piano di prima le ricalcola dalla bozza, `Kernel.strataOf`) e in `ChunkView.strata`, mandate a un client una volta per luogo e tenute; `kernel.stratumAt(x, y, profondità)`. Il programma `sottosuolo` dell’ambiente, il Cartografo che scrive gli strati alla Genesi e la profondità dalla cantina più profonda restano da fare. Si vede con il buco del terreno sotto il modello e, per chi sta sotto (T416, `kernel.underground()`: il pavimento più di un gradino sotto il suolo), un taglio a caselle in un disco attorno a lui (`src/kernel/underground.ts`: raggio 6, 3 caselle più lungo verso la camera, a quarti, `inCutDisc`): gli shader della simulazione (`clipped`, `U.cutY`) non disegnano ciò che nel disco sta più di 1,15 caselle sopra il pavimento, terreno, strutture e cose, e una mesh piccola (`buildCut` in `terrain.ts`) mette i tappi all'altezza del taglio, del colore dello strato a cui ogni colonna arriva, e i fianchi delle colonne attorno al disco a bande, una per strato (`strataSide`, T418); il sole e il cielo si attenuano con la profondità fino a un terzo (`dimAt`). Il viandante e le ombre non si tagliano. I fianchi del buco della cantina restano di un colore: li coprono i muri della cantina. Nella corona scende solo l’esterno dell’edificio (T52c). **La lettera del suolo** (ADR-0135, T258): un programma con `soil="E"` sulla radice trova quella lettera sullo strato `base`, con `origin="bottom"` al centro, così lo stesso XML serve ogni taglia e scava fino al fondo (`ground="Z"`) con regole senza `steps`; vale per chi la dice, e non con `map`.

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
  mouse e glitch su uno strato 2D sopra. Il tasto destro sceglie la casella con un raggio sul terreno. I limiti dello zoom sono uno, per la
  rotella e per il pizzico: `ZOOM`, `zoomDistance`, `pinchDistance` in `src/render/camera.ts`.
- **Il gioco al tocco** (ADR-0198, T387): uno strato solo col dito (`TouchControls`, `src/ui/touch.ts`; la classe `touch` sulla radice),
  acceso da un puntatore `touch` o da un puntatore principale `coarse`, spento dal primo clic di un mouse: su un desktop niente cambia. La
  **levetta** in basso a sinistra tiene le direzioni di WASD (`Input.setHeld`; `stickAxes`, `axesKeys` in `src/ui/gestures.ts`: una delle
  otto direzioni dei tasti, la zona morta `STICK.dead`), quindi in multigiocatore partono gli stessi `keys`. I **pulsanti** in basso a destra
  premono i tasti (`pressKey`: `keydown` e `keyup` sul `body`, come un tasto con niente a fuoco): E, salta, T (magia), I (la borsa) sempre in
  vista (`TOUCH_MAIN`), gli altri del pannello dei controlli nel menu ⋯ (`TOUCH_MORE`; G e F2 solo oltre il bordo o allo sviluppatore); con una
  finestra aperta (`input.enabled` falso o l'aiuto) resta solo ✕, cioè Esc; la hotbar si tocca come `1`–`6`. **Le dita sulla scena**
  (`SceneGestures`, puro): un tocco breve è il clic sinistro (`clickStudio`) e per 2,5 s mostra ciò che il mouse direbbe lì (`renderer.mouse`),
  un tocco lungo (`TOUCH.longPress`, 500 ms) il destro (`contextAt`), un dito che si sposta oltre `TOUCH.slop` (10 px) il tasto centrale
  trascinato (l'orbita), due dita la rotella (`Renderer.zoomTo`); il `pointerdown` del dito è cancellato, e l'eco del mouse (il menu del tocco
  lungo di Chrome, un clic tardo) la riconosce `ownsMouse`. Sopra la scena `touch-action: none`, altrove `manipulation`; nel `viewport`
  `interactive-widget=resizes-content` e, dove il browser non rimpicciolisce la pagina, `--keyboard` dal `visualViewport`: scrivendo (`typing`)
  lo strato si toglie e chat e «Altro…» stanno sopra la tastiera. Restano del mouse il trascinare nell'inventario, l'editor e la console.
  Catture in `docs/catture/T387/`.
- **L'HUD su uno schermo piccolo** (T388, `src/ui/hud.ts`, `src/style.css`): **«?»** in alto a destra, ovunque, apre la finestrella
  dei comandi (`#keyhelp`: la legenda dei tasti copiata dalla riga in fondo, col dito anche ciò che fanno levetta e dita, «Tutto l'aiuto» che
  preme H); si chiude con ✕, Esc e, col dito, con il ✕ dello strato del tocco (la finestrella conta come una finestra aperta). Su uno
  **schermo basso** (`COMPACT`, `max-height: 520px`: un telefono di lato, una finestra bassa) la riga dei tasti va in «?», i pannelli
  rimpiccioliscono e il luogo con i bisogni e il diario si richiudono al tocco (chiusi all'inizio: il nome del luogo e le barre senza parole,
  «Missioni» col numero), i messaggi vanno in alto al centro (gli ultimi tre), il fumetto sopra la hotbar, nulla sopra levetta e pulsanti; col
  dito la borsa lascia a destra il posto del ✕, che le sta sopra. Su un desktop con lo spazio cambia solo «?». **In verticale** su un telefono
  (`UPRIGHT_SMALL`, verticale e lato corto sotto 600 px, con la classe `touch`) una schermata a tutto schermo chiede di girarlo
  (`#rotate`), e il mondo dietro non si disegna (`Hud.rotating`: il kernel va avanti, il renderer si ferma). Catture in `docs/catture/T388/`.
- **Ogni finestra ha una via d'uscita al tocco** (ADR-0199, T393, `src/ui/panels.ts`): il censimento `PANELS` dice per ogni finestra come si apre e come si chiude; una finestra sopra il gioco ha la croce in alto a destra (`closeButton`, ✕, almeno `--touch-target` = 47 px col dito, col mouse com'era; nuova su inventario, menu delle azioni, aiuto e fumetto, l'editor la mostra solo col dito), un tocco fuori la chiude solo col dito e solo dove il censimento lo dice (`OutsideTouches`: sempre aiuto, «?», atlante, grafo; inventario, azioni e studio se nessun campo ha qualcosa scritto; mai chat, profilo, console, editor) e non arriva a nient'altro; le scelte (crediti, morte, lobby, Genesi, entrare) escono dai loro pulsanti, alti `--touch-target` col dito. Una finestra nuova entra nel censimento (`tests/pannelli-tocco.test.ts`). Catture in `docs/catture/T393/`.
- **I laboratori al tocco e su uno schermo piccolo** (T389, `lab/touch.ts`): l'editor `/lab/editor/` e la sandbox `/lab/3d/` usano le stesse funzioni pure del gioco (`SceneGestures`, `stickAxes` di `src/ui/gestures.ts`; il laboratorio importa `src/`, mai il contrario): sulla preview un dito orbita, due pizzicano (`pinchFactor`), il tocco breve è il clic (nell'editor lo strumento CAD, nella sandbox ispeziona e apre il pannello), solo `pointerType: touch`, il mouse resta com'era. Sotto `COMPACT_QUERY` (900 px di larghezza o 520 di altezza) l'editor mostra un riquadro alla volta, la preview per prima e intera, l'XML dal pulsante «XML» dell'intestazione (Esegui torna alla preview); seme e voxel per casella nel menu «⋯» (sopra la soglia `display: contents`, l'intestazione di prima), gli strumenti del codice in «Strumenti ▾», le quattro barre sopra la preview (CAD, colori, vista, tempo) chiuse e una alla volta dal dock, «⌖» centra; la barra delle carte (`lab/handmade/`) tiene in una riga stato e «Salva» e apre nome, classe, taglia e «Le tue carte» da «⋯». La sandbox chiude il pannello dietro «☰ Pannello» e ha la levetta (`mountStick`, tiene i tasti di WASD) e la «E» toccabile; con un puntatore grossolano la levetta c'è anche sopra la soglia. Sopra la soglia e col mouse nessuna funzione cambia. Catture in `docs/catture/T389/`.
- **Il SoundLab su uno schermo piccolo** (T390, `lab/suono/`): sotto la stessa `COMPACT_QUERY` la pagina è lo schermo (niente scorrimento) e mostra un riquadro alla volta dalle schede dell'intestazione (`SOUND_PANES` in `lab/suono/logic.ts`: «Roll», «Suono», «3D», «XML», il piano roll per primo; ogni pannello dice in `data-pane` dove sta, `tests/soundlab.test.ts`): il roll alto quanto c'è posto coi passi sopra e i pennelli in una fila che scorre (in orizzontale i due accanto al roll), manopole e tracce (in orizzontale affiancate), la vista 3D intera, il codice con la diagnostica (in orizzontale accanto). L'intestazione tiene preset, ⚡, ▶/⏸, ↶ e le schede; seme, 🎲, «+1», oscilloscopio, file, Copia, WAV vanno in «⋯» (`bindCompact` li sposta, con un segno dove stavano, e li rimette sopra la soglia). Sulla vista 3D un dito ruota e due zoomano (`attachPreviewTouch`, il mouse com'era); il tratto sul roll finisce anche con `pointercancel` e il roll si ridisegna quando cambia misura (`ResizeObserver`). Pulsanti alti 36 px, selettori e campi a 16 px (un telefono non ingrandisce la pagina). Sopra la soglia nulla cambia. Catture prima e dopo in `docs/catture/T390/`.
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
- **Ciò che si indossa** (ADR-0180, T290; la via scelta dall'autore sul banco di T289, `lab/banco/indossati.md`: C + B). **Indossare** è un
  segno nell'inventario, come impugnare: `Inventory.worn` (zona → tasca; `src/kernel/inventory.ts`), il capo resta nell'inventario (il peso
  conta; spostato il segno lo segue, `moveSlot`; gettato, dato o messo in una borsa non è più indossato, `emptied`; tolto per ultimo da
  `removeItem`). Tre **zone**: `head`, `torso`, `back`. `Kernel.wearSlot` mette o toglie il capo di una tasca nella sua zona (al posto di
  ciò che c'era, che resta nell'inventario), lo lascia dalla mano; impugnare un capo indossato lo toglie; «Usa», il doppio clic e i tasti
  1–6 su un capo lo mettono o lo tolgono, salvo un `on_use` del suo modulo. Nell'inventario «Indossa» / «Togli», il segno ◆ verde sulla
  tasca e «si indossa sulla testa»; si salva con l'inventario e al caricamento i segni che non reggono più si lasciano (`keepWornMarks`).
  **Dove va un capo** (`wornZoneOf`, `src/kernel/wearing.ts`): dal suo posto (`ItemDef.slot`: `testa`/`capo`/`head`,
  `corpo`/`busto`/`petto`/`torso`/`body`/`chest`, `schiena`/`spalle`/`back`/`shoulders`, `SLOT_ZONES`); un capo (`clothing`) senza posto
  dalle parole del nome, in italiano e in inglese, la prima detta (`GARMENT_WORDS`: il mantello del seme va sulla schiena, gli stivali no);
  un posto di un'altra zona (piedi, mani, collo, gambe) non si indossa ancora. **Le zone del corpo** (`bodyOf`, `src/mj/worn.ts`, dal banco):
  dai voxel e dal rig, in piedi o a quattro zampe, il busto a quattro zampe girato in piedi per scriverci (`turnUp`). **La via C**, il
  pavimento: i voxel esterni della zona nei due colori principali del capo (`mainColors`: la lettera più usata e la più usata che non ne è
  una sfumatura; senza modello il generico tinto col colore del pacchetto) e la caduta del mantello per chi sta in piedi. **La via B**: la
  sezione `<worn zone="head|torso|back">` del programma del capo, accanto alla radice (o dentro, come un'azione; il compilatore la salta
  nella corsa a terra, `ASIDE_TAGS`), fatta programma a sé con le lettere e i colori della forma del capo e le quattro del kernel
  (`wornProgram`: `z` la zona, `o` il resto del corpo, `r` l'aria dove il capo può stare, `m` quell'aria sulla linea di mezzo; le lettere
  del corpo le regole non le vedono, ciò che scrivono su `o` non resta, un voxel del corpo non si toglie mai), solo `one all prl sequence
  markov convolution` e le loro regole (`WORN_NODES`), 20 000 passi e 1 s; se la sezione per quella zona manca, non compila, non finisce
  o non scrive niente su quel corpo, C (`dressBody`, `Change.fault`). Più capi dal più esterno: schiena, busto, testa. **Il corpo vestito**
  si fa nel worker (`dressMeshes` in `src/render/formmeshes.ts`, il messaggio `dress` del worker, `WorkerRunner.dress`, prima dei programmi):
  la griglia del corpo dell'istanza (le azioni fatte) in una scatola di `PAD` voxel più grande attorno e sopra, con lo stesso centro e lo
  stesso suolo, e le mesh con il rig del corpo nudo spostato lì: gli stessi arti attorno agli stessi giunti, quindi ciò che si impugna
  resta in mano e ciò che è ricolorato su un arto si muove con lui; nessun programma rigira; niente animazione finché si indossa qualcosa.
  `dressedFor` (`src/render/dressed.ts`) lo chiede quando cambia ciò che una figura indossa (o la sua forma, o una forma dei capi): finché
  non arriva la figura resta com'era, poi `Entities` e `Wanderer` la rifanno (`modelObject` con `dressed`). Gli stessi capi sulla stessa
  forma sono un corpo solo, condiviso; il worker ne tiene 32 MB (`DRESSED_MEMORY_BYTES`), le geometrie stanno con quelle delle forme
  (`keepGeometry`, sotto `trimGeometries`). Il multigiocatore è in `#multigiocatore`; lo Scultore in `#markovjunior-modelli`. Catture
  in `docs/catture/T290/` (prima, la via B di fronte, di fianco e di spalle, la via C con l'ascia in mano, l'inventario, dopo). Gli
  **individui** si vestono dalla scheda del Narratore o dal mestiere (ADR-0181, T353, `#societa`): i loro segni sono quelli dell'inventario
  e il renderer li legge allo stesso modo; catture in `docs/catture/T353/`.

<a id="markovjunior-modelli"></a>
## MarkovJunior, i modelli, la cache delle forme

- **MarkovJunior** (ADR-0036, 0038): l'XML di MarkovJunior letto alla lettera (palette ufficiale, strati dall'alto,
  simmetrie, `map` anche frazionaria, `convolution`, `field` e `observe`, `wfc` e `convchain`; i modelli ufficiali girano invariati, con le risorse dell'originale in testo), più `<color part hidden glow>`, forme di
  base, `<animation>` e `<action>` (regole sul modello finito: la porta si apre); il front-end ripara le forme
  sbagliate dagli agenti. Il codice è in `src/mj/`; il laboratorio (`lab/`, `lab/README.md`) serve ad analizzare e
  correggere i programmi che il Concilio non riesce a scrivere (sandbox 3D `/lab/3d/`, sezioni, foto, prove con Gemini).
- **La stella** (ADR-0220, T430, kernel 0.9.16): ciò che non ha un modello suo veste il generico della classe `object` (`Forms.resolve`),
  che dal 19/11 è una stella a quattro punte (`universe/models/object.xml`, 17 voxel a 32 per casella, 0,53 caselle, perché entri
  anche sul coperchio di un barile; la lettera `C` prende il colore della cosa, `tint`, o uno dal suo id se la cosa non lo dice, `itemLook`), al posto del sacco legato che sembrava una pozione. Il giro e la deformazione
  sono del renderer, al suo fotogramma (`starPulse` in `src/render/star.ts`, `EntityView.star` in `entities.ts`: un oggetto a terra senza
  modello suo gira, si stira in altezza e larghezza attorno al suo mezzo e ogni tanto si stringe come il lampo di uno schermo a tubo); posato su un
  mobile resta fermo. L'icona è la foto della stella (`thumbs.ts`) e nell'inventario si muove con un'animazione CSS (`.icon.star`,
  `itemIcon`, ferma con `prefers-reduced-motion`). Gli universi la prendono dal seme se non hanno riscritto `models/object.xml`
  (`upgradeFromSeed`), e la voce di un programma preso dal seme ora segue quella del seme (`mergeEntries` con `taken`: `vpt`, `tint`, il nome;
  i campi che ha solo l'universo restano).
- **I simboli** (ADR-0175, T342, contratto 0.6): un simbolo è una lettera o `#` e un numero (`#0`…`#2047`), letto avidamente
  (`#12A` sono `#12` e `A`, `#1#2` due), senza zeri davanti; una cifra da sola e un `#` senza numero sono errori del compilatore
  col motivo, anche nel modo che ripara. Valgono ovunque si legge un simbolo: `values`, pattern (attributi, figli, file),
  unioni (i loro segni restano `? ! ~…`, tranne `#`), `<color symbol>`, `origin`/`ground`/`soil`, `path`, forme, `field`/`observe`,
  tessere e campioni di `wfc`/`convchain`, la tinta di `models/index.json`; nei testi di un pattern una riga con `#` e nessun
  numero è una nota. `src/mj/symbols.ts` legge i simboli (`symbolTokens`, `readSymbols`, `symbolOf`) e li nomina (`symbolName`,
  `showSymbols`); il compilatore dà al motore un carattere per simbolo: le lettere sé stesse, `#0`-`#9` le cifre, da `#10` un
  carattere dell'area d'uso privato (da U+F000; le unioni private stanno sotto, da U+E000). Un programma di prima, convertito, è
  così lo stesso per il motore, voce per voce; traccia, messaggi, lettere delle azioni dello Scultore, editor e SoundLab mostrano
  e scrivono il nome. Tetto: 255 simboli per programma oltre la cella vuota (`MAX_SYMBOLS`; le celle sono byte, `MAX_CODES` 256),
  contati su tutte le griglie. La migrazione `0.5 → 0.6` (`programFor0_6`, `patternFileFor0_6`) scrive `#` davanti a ogni cifra
  solo dove sta un simbolo, elemento per elemento (mai `size`, `steps`, `scale`, `at`, il `to` di una `line`, i file, le tessere
  di una `wfc` a tessere), lascia il resto carattere per carattere, dà a un'unione `#` un segno libero ed è idempotente; le carte
  fatte a mano della 0.5 ci passano quando si leggono (`portedProgram`), quelle portate da un universo di prima con
  `portedFiles`. Il seme e il laboratorio sono convertiti con la stessa funzione (`lab/scripts/mj-simboli.ts`, gli universi del
  laboratorio esclusi: li porta la migrazione); `tests/mj-engine-determinism.test.ts` confronta le griglie e i campioni dei suoni
  del seme con le impronte prese prima.
- **Pattern nei figli, regole da file, programmi inclusi** (ADR-0171, T333): un lato di una regola si scrive come attributo
  (`in="…"`) oppure come testo di un figlio `<in>`/`<out>` (stessa sintassi, gli strati anche su righe diverse, una `/` può
  chiudere una riga, `#` senza numero è una nota; i due insieme sono un errore), oppure si legge da un file di testo di `models/`
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
- **Un worker che si guasta** (ADR-0172, T296): nel `WorkerRunner` un worker che si ferma (`onerror`) o non risponde entro `FORM_WATCHDOG_MS` (120 s; un programma si ferma da sé a `MAX_FORM_TIME`, 30 s) fa fallire solo ciò che stava facendo, viene terminato e un altro prende il suo posto, al più `RESPAWNS` volte nella vita della pagina; senza worker rimasti ciò che aspetta fallisce (prima un errore faceva fallire tutto ciò che aspettava e il worker restava fuori dal gruppo). Una forma che fallisce lo dice a `Forms.onFail`, una pronta a `Forms.onReady`; i ganci non fanno mai fallire una forma.
- **Il motore sulle griglie grandi** (ADR-0142, D33): `src/mj/engine.ts` tiene un censimento delle lettere per riga (`Census`, aggiornato da `write`); una scansione intera di un pattern guarda solo le righe dove può stare la sua cella più rara, nello stesso ordine di prima, e `conv` salta le righe senza celle d'ingresso. L'ordine delle chiavi di `MatchSet` fa parte dell'esecuzione: ogni ottimizzazione lo conserva, e `tests/mj-engine-determinism.test.ts` confronta l'impronta di ogni modello del seme e dei riferimenti del banco con `tests/fixtures/mj-engine-hashes.json` (presa col motore di prima; si rifà solo con `lab/scripts/mj-hashes.ts -- --scrivi` e un motore di cui ci si fida). La cantina a Enorme è passata da 5,6 s a 0,5 s; `lab/scripts/bench-engine.ts` misura.
- **Il passo persistente** (ADR-0164, T315): `Stepper` in `src/mj/engine.ts` tiene un programma compilato sulla sua griglia fra una chiamata e l'altra, con il suo generatore e il suo censimento, per ciò che si muove un poco a ogni tick di una pagina. `advance(n)` prosegue la stessa corsa: a pezzi è la corsa di `runOn` con lo stesso seme, voxel per voxel (`tests/mj-stepper.test.ts`). `tick(n)` rifà il programma dal primo nodo, come un `runOn` nuovo, ma i nodi tengono le corrispondenze e le aggiornano dal registro della griglia (`rewind` invece di `reset`, solo mentre il flag `keeping` è acceso): stesse regole, un altro ordine delle corrispondenze, quindi non la corsa di `runOn`; il registro ricomincia oltre 4 volte le celle. `run` e `runOn` non cambiano (il flag è spento per loro, `tests/mj-engine-determinism.test.ts`). Sulle luci della veste futuristica un tick costa un quarto di un `runOn` (0,08–0,11 ms contro 0,33–0,41 a 1× sulla scritta), nel banco meno dei cicli scritti a mano; nella pagina a 4× quanto loro, a meno di qualche punto (ADR-0164). Con lo stesso vincolo il nodo `path` non fa più un array per cella (stessi vicini, stesso ordine, stesse estrazioni: `tests/mj-path.test.ts` ha le impronte prese prima): la soluzione di un labirinto di 5115 celle passa da 9 a 2,6 ms la prima volta.
- **L'inferenza** (ADR-0173, T334): `<field for to|from on recompute essential>` e `<observe value from to>` dentro `one`, `all` e `prl`, con `temperature`, `search`, `limit` e `depthCoefficient` sul nodo, come nell'originale ma in 3D. Gli algoritmi sono puri in `src/mj/infer.ts` (`fieldPotential`, `backwardPotentials`, `forwardPotentials`, `search`); il nodo che li usa è un `GuidedRunner` (`engine.ts`), che vede una corrispondenza dovunque l'ingresso combacia, anche se non cambia niente: solo lui, ogni altro nodo è quello di sempre e il test di ADR-0142 non si tocca. `one` prende la corrispondenza dall'euristica migliore (a temperatura T la probabilità è ∝ `exp(-h/T)`), `all` le applica dalla migliore dove non si sovrappongono, con le osservazioni `one` si ferma nel futuro e con la ricerca rigioca la traiettoria trovata. I tetti sono `INFERENCE_LIMITS`: 100 000 stati, 64 MB di stati e 4096 figli per stato contano unità (deterministici: oltre, la ricerca non trova e il nodo sceglie a caso, come l'originale), i 10 s di una ricerca (o la scadenza della corsa) la fermano e la corsa **non è finita**; 128 MB di potenziali e 32 codici osservati, se no è un errore del programma. Il mondo li prende dal T336 entro i suoi tetti (ADR-0176, qui sotto). La traccia dice cosa inferisce un nodo e cosa ha trovato la ricerca (`NodeStep.note`); i modelli del repository che li usano sono in `lab/mjx/official/`, le foto accanto a quelle dell'originale in C# in `lab/banco/inferenza/` (con il `Program.cs` senza immagini per rifarle).
- **Tessere, campioni, scale frazionarie** (ADR-0174, T335): `<wfc>` come nell'originale, in due modi. **A tessere** (`tileset="x"`): il tileset è `models/x.xml`, radice `<tileset values fullSymmetry>`, con `<tiles><tile name weight file>…</tile></tiles>` e `<neighbors><neighbor left right | top bottom/></neighbors>`; una tessera è il testo del suo `<tile>` (la sintassi di un pattern: strati dall'alto, righe con `/`), oppure `models/<file>.txt`, oppure `models/<tiles>-<nome>.txt` (`tiles` sulla `wfc`, se no il nome del tileset): così un sottoblocco di T333 è anche una tessera. Le lettere del tileset (i suoi `values`) vanno su quelle del nodo per posizione, come l'originale stende i colori dei suoi `.vox`; ogni tessera vale con le sue 8 rotazioni attorno a z (48 del cubo con `fullSymmetry`), i vicini con le rotazioni scritte davanti al nome (`zz Turn`), la griglia nuova è `(S - overlap)·M + overlap` per asse (`overlap`, `overlapz`; negativo lascia spazi). **A sovrapposizione** (`sample="x"`): un campione piano `models/x.txt` nelle lettere del nodo, le sue finestre N×N con le simmetrie del nodo, la griglia della stessa misura, sempre periodica e solo piana (come l'originale). Le `<rule in out>` della `wfc` dicono quali tessere (o lettere) può avere una lettera della griglia; `periodic`, `shannon`, `tries`. Tutto ciò che è statico (rotazioni, vicini, finestre) lo fa il compilatore con `src/mj/wfc.ts` (`tileModel`, `overlapModel`): il nodo `wfc` del motore porta già motivi, pesi e propagatore. Il motore (`WfcRunner`) in **un passo** osserva l'onda con il `WfcSolver` (la cella di meno entropia o di meno motivi, un motivo estratto per peso, le esclusioni propagate; fino a `tries` tentativi, ognuno da un seme estratto dal generatore della corsa: deterministica) e cambia la griglia come una `map`; senza soluzione non fa niente, la griglia resta e i nodi dentro la `wfc` non girano (una sequenza `gated`, come il ramo dell'originale). Una cella senza motivi è sempre una contraddizione (l'originale guarda solo la prima). **ConvChain** (`<convchain sample n temperature on black white steps>`, solo su una griglia piana): le celle `on` diventano black o white, poi ogni passo è una passata di Metropolis sulle finestre N×N del campione (in `black` e `white`). **`map` frazionaria** (`scale="5/3 5/3 6/3"`, il nodo ha `divide`): la griglia nuova è M·N/D e una regola scrive a x·N/D, solo con la griglia nuova vuota; una scala intera compila come prima. **`folder`** sulla radice, una `map` o una `wfc`: le regole da file di quella griglia sono `models/<folder>-<nome>.txt`; `legend` (per le immagini) si ignora con un avviso. **Le unioni appartengono alla loro griglia** (la radice, una `map`, una `wfc`): un simbolo scritto con lettere diverse in due griglie (ModernHouse scrive `.` tre volte) diventa in ognuna un simbolo privato, gli altri restano nella tabella di prima. Tetti (`WFC_LIMITS`, deterministici): 2048 motivi, 1000 tentativi, 4 milioni di vicini, 128 MB di onde, N di ConvChain fino a 4, campioni fino a 16 384 celle; il tempo di una `wfc` (10 s, o la scadenza della corsa) ferma la corsa, **non finita**. Il mondo li prende dal T336 entro i suoi tetti (ADR-0176, qui sotto). `mjxIncludes` raccoglie anche tileset, tessere, campioni e i file nelle cartelle, quindi la cache delle forme li conta. La traccia scrive `wfc a tessere 5×5×5, 16 motivi`, `convchain su B → D/A N=3`, `map scala 5/3 5/3 6/3` e, del nodo, a che tentativo ha trovato; l'editor colora i nodi e gli attributi nuovi e non disegna le regole di una `wfc` (sono nomi di tessere). I modelli dell'originale in `lab/mjx/official/` (ModernHouse, SeaVilla, Apartemazements, PillarsOfEternity, Partitioning, Surface, Escher e le sue varianti, ChainDungeon, WaveDungeon, StairsPath intero) leggono le risorse dell'originale portate in testo da `lab/scripts/mjx-risorse.ts` (`lab/mjx/official/resources/`, nel laboratorio anche per i programmi scritti lì, mai nella build dei giocatori); le foto accanto a quelle dell'originale in C# in `lab/banco/wfc/`.
- **I nodi nuovi nel mondo** (ADR-0176, T336): il validatore prende `field`, `observe`, `search`, `wfc`, `convchain`, `<import>` e le regole da file entro `WORLD_NODE_LIMITS` (`src/kernel/validator.ts`), più stretti di quelli del motore perché un modello gira a ogni seme in ogni mondo e su ogni client, e tutti contati in unità (lo stesso programma ha la stessa risposta su ogni macchina; il tempo resta quello del validatore, 8 s o il `tempo` del modello). Quelli che si leggono dal programma compilato li dice `worldNodeErrors`: una ricerca scrive `limit` (al più 2000 stati), una `wfc` scrive `tries` (1-100: senza sarebbero 1000) e ha al più 1024 motivi, una `convchain` scrive `steps` (al più 50) e `n` fino a 3, si leggono al più 64 file di `models/` per 200 000 caratteri e gli import vanno al più 3 uno dentro l'altro (`importDepth`). Quelli che dipendono dalla griglia del momento li controlla la corsa stessa: `RunOptions.ceilings` (`NodeCeilings`: le celle e i byte dell'onda, 32 768 e 32 MB, i byte dei potenziali, 32 MB) li porta nel motore, che oltre getta un `Mj3Error` col motivo e sotto non cambia niente, quindi il mondo, che non li passa, fa la stessa griglia. I numeri vengono dai modelli dell'originale (`lab/scripts/nodi-mondo.ts`, `lab/banco/nodi/tabella.txt`): l'onda più grande è di 2500 celle e 5 MB (`WaveDungeon`), il modello che legge più file ne legge 43 (`SeaVilla`); nessuno scrive `tries`, quindi portati nel mondo lo scrivono. Un tileset di `models/` (radice `<tileset>`, `isTileset`) non è un programma: `validateFile` lo manda a `tilesetErrors`, che lo compila come lo leggerebbe una `wfc` di un tentativo sulle sue lettere. Le carte fatte a mano (che non leggono file: niente `wfc`, `convchain` né `<import>`) e i controlli dello Scultore (`checkProgram`, che ora compila con i file di `models/` dell'universo, `filesOf`) vogliono gli stessi tetti; il banco delle strutture anche (`esegui` in `lab/banco/misure.ts`). Lo Scultore li conosce dal prompt (una sezione per tutte le classi, una per le strutture: `field` con `temperature` per la varianza, `observe` solo su pezzi piccoli) e la richiesta gli elenca i tileset, i campioni e i file di regole della biblioteca (`libraryResources`); il seme non ne ha ancora. Offline lo Scultore senza un programma della classe risponde con `MOCK_FIELD_PROGRAM` (un `field` porta un camminatore alla meta, la regola nei figli `<in>`/`<out>`). Strada facendo: `reachableStoreys` misura la porta aperta con l'azione `open` (dal contratto 0.5; prima cercava `apr…` e misurava la porta chiusa, così ogni struttura procedurale tornava allo Scultore con «piani: 0»).
- **La griglia a pezzi** (ADR-0178, T339): `<pieces piece="x y" margin time>` (non c'è nell'originale) fa girare i suoi nodi su un **pezzo** della griglia alla volta, `piece` celle per lato e tutta l'altezza, in righe dal fondo: ogni pezzo su una **finestra** che è il pezzo più `margin` celle attorno (8 se non detto, al più 64), dall'inizio, col suo generatore (da un'estrazione sola della corsa), il suo censimento, le sue corrispondenze e il suo tempo (`time`, al più `pieceMs`); della finestra torna nella griglia solo il pezzo. Ogni pezzo legge la griglia com'era quando il nodo è cominciato, quindi i pezzi non dipendono l'uno dall'altro, e il margine cresce con le regole del pezzo e poi si butta: **una regola che dà lo stesso risultato in qualunque ordine e guarda non più lontano del margine dà nei pezzi la griglia intera, voxel per voxel** (`tests/mj-pieces.test.ts`: tetti a padiglione, scale di trenta gradini). Il modo di scrivere che ne viene: ciò che il modello decide una volta (dove stanno casa, campi, recinti, sentieri; quanto è alto un muro) sta sul piano grossolano, prima, e una `map` lo porta ai voxel; nei pezzi il dettaglio locale. `one` sceglie solo dove cambia il pezzo (i suoi `steps` sono per pezzo: le feritoie del forte del banco sono `steps="5"` per nove pezzi); ciò che è a caso e largo più celle (un'impronta, una finestra) può essere tagliato dove due pezzi si incontrano, per questo i pezzi si allineano alle celle del piano e ciò che si timbra sta dentro una cella. Dentro `pieces` non vanno `map`, `wfc` (fanno un'altra griglia), le forme (coordinate della griglia intera), `observe` e `search` (il futuro di tutta la griglia) né un altro `pieces`, e `pieces` non va in un'azione o un'animazione: il compilatore lo dice con la riga. Il motore: `PiecesRunner` in `src/mj/engine.ts`; ogni cella della finestra è del pezzo, del margine che cresce o ferma (`pieceGuard`: `write` non cambia mai una cella ferma, e una regola non corrisponde dove ne cambierebbe una); ciò che non è in un pezzo (`pieceGuard` vuoto) gira com'è sempre girato, e `tests/mj-engine-determinism.test.ts` non cambia. Le due varianti misurate restano scrivibili per il banco: `halo="written"` (la via b: un pezzo legge ciò che hanno scritto i pezzi prima, che restano fermi) e `edge="frozen"` (il margine fermo); spezzano scale e tetti ai bordi (ADR-0178). **I tetti**: chi fa girare il programma può dare ai pezzi una griglia più grande e un tempo loro (`GridLimits.pieces`, `PieceLimits`): il gioco lo fa solo dove fa le forme (`runForm` con `FORM_RUN_LIMITS`: `FORM_LIMITS` più `FORM_PIECES`, 1024 di lato e 64 milioni di celle dal T356, 4 s a pezzo, 45 s in tutto, 1024 pezzi), e il tempo dei pezzi non è quello del modello (`MODEL_TIME`, `tempo`); un pezzo che sfora ferma la corsa, **non finita**, dopo aver fatto girare gli altri. Il validatore e le carte fatte a mano no: lì un programma con i pezzi gira nei limiti di sempre e nel suo tempo, quindi nel gioco non fa più di ciò che ha passato. I tetti del mondo sui nodi nuovi (`worldNodeErrors`, ADR-0176) entrano anche nei figli di `pieces`. `RunResult.pieces` dice di ogni pezzo dove sta, quanto ha impiegato, i passi e se ha finito; la traccia vede il nodo come un passo, con la nota (quanti pezzi, il più lento). Il banco (`lab/banco/pezzi/`, `lab/scripts/banco-pezzi.ts`, `lab/scripts/misura-tetto.ts`): una fattoria di 50 × 50 caselle e un forte grande, le misure del tetto di oggi (il motore regge la griglia intera, a fermarsi sono `FORM_LIMITS` e la mesh), i controlli sui bordi.
- **Il tetto dei voxel delle gargantuesche, la mesh in due passate senza il fondo** (ADR-0185, T356, kernel 0.6.11): l'autore vuole le gargantuesche a 20-50 caselle (oggi 10 × 10, 200 voxel). Misurato sui programmi del banco delle taglie (`lab/scripts/misura-tetto.ts`, tabelle in `lab/banco/taglie/README.md`): il motore regge anche 1000 × 1000 × 160 (50 caselle, 160 milioni di celle, 8-9 s), il tetto era la mesh. `meshVoxels` (`src/mj/mesh.ts`) ora fa due passate: conta le facce che toccano il vuoto e le scrive in array tipizzati della misura finale, stessi quadrati, vertici, colori e ordine di prima (niente array di numeri che crescono: il picco della fattoria a 400 di lato scende da 541 a 129 MB, la mesh si fa in metà tempo); con `underside: false` lascia fuori le facce rivolte in basso sul fondo della griglia (z = 0), che una cosa posata a terra non mostra mai: le forme del gioco le lasciano fuori (`formMeshes` per corpi e fotogrammi, `changedBody`, `stagedBody`; un arto le tiene, un piede che si alza mostra la suola; il laboratorio e l'editor le tengono), −24 % di mesh a 10 caselle, −48 % a 20 (la fattoria a 400: 0,93 milioni di vertici, 44 MB su un tetto del worker di 128). `FORM_LIMITS` da 8 a 32 milioni di celle (la scatola di 20 caselle è 25,6; il lato resta 512, il tempo quello del validatore), `FORM_PIECES` 64, `MJX_LIMITS` 64 (laboratorio); le carte fatte a mano e `WORLD_NODE_LIMITS` non cambiano; `FORMS_DB_VERSION` resta (una mesh di prima col fondo è buona). **`STRUCTURE_SIDE` e le caselle della gargantuesca non cambiano ancora**: una struttura sta in un lotto del suo luogo (18 caselle) e `claimSizes` fa scendere la taglia che non entra; il lotto di una gargantuesca di 20 caselle è la domanda all'autore (`docs/pipeline/domande/T356.md`, raccomandato un lotto di 2 × 2 luoghi). Nel laboratorio 3D e nel banco (`banco-taglie.ts -- --venti`) i programmi delle taglie hanno la quarta scatola «Gargantuesca a 20 × 20» (400 × 400 × 160), con le foto. Il lotto è venuto col T370 (ADR-0206, `#lotti`): un blocco di 2 × 2 luoghi, `STRUCTURE_SIDE` 500, `FORM_LIMITS` 40 milioni.
- **La sezione indossata** (`<worn>`, ADR-0180, T290): un capo da indossare ha nel suo programma, accanto alla radice, le regole che lo
  mettono addosso a chi lo indossa (il mondo in `#mondo3d`). Lo Scultore la scrive quando la richiesta dice la zona (`SculptRequest.worn`:
  il `ModelDirector` per i modelli propri dei capi e per la forma comune dei cappelli, `shape-hat`; riscolpire un capo o un programma con
  la sezione la tiene), dal prompt («Worn things» in `prompts/agents/sculptor.md`); i suoi controlli (`checkProgram`) e il validatore
  (`modelErrors`) provano ogni sezione su due corpi del kernel, uno in piedi e uno a quattro zampe (`trialBodies`, `wornErrors`): una zona
  per sezione e una delle tre, dopo la radice, nessuna delle lettere `z o r m` fra quelle della cosa, compila con i nodi ammessi, finisce,
  scrive su almeno uno. Un programma senza sezione resta buono: il capo si vede con la via C. Offline lo Scultore scrive una sezione
  semplice per la zona (`mockWorn`).
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
- **Ciò che tace** (ADR-0172, T296): `tryPrepareSound` dice «non suona nulla» anche di una resa il cui campione più forte resta sotto `MUTE_FLOOR` (circa −80 dB: prima un brano a volume zero suonava silenzio in ciclo); il direttore dice quale programma tace e perché (`onFail`, il motivo da `SoundRenders.reasonFor`), anche degli effetti preparati in anticipo; in `main.ts` una carta portata che tace diventa una carta guasta (`kernel.cardBroke`, `mute`). Il suono resta del client: il mondo di molti non lo sente, lo specchio del master sì.
- **Sette brani, nove effetti**: `sound-music-pastoral`, `woods`, `stone` (mattina e giorno), `deep` (sotterranei e rovine, a ogni ora), `sunset`, `night` (ovunque all'aperto), `beyond` (solo fuori dal tappeto e nello studio); `sound-effect-rune`, `item`, `arpeggio`, `spell`, `fault`, `rollback`, `threshold`, `jump`, `death` (gli effetti che il gioco chiama, T307b). `SOUND_CUES` dice quale momento del gioco chiama quale effetto e con quali semi. I brani sono scritti a teste che camminano: una testa d'armonia lascia una radice ogni battuta, da cui nascono basso e pad, una di melodia avanza nel tempo e sale o scende, una segna le battute della batteria. Passano tutti le soglie dell'analisi (T228, numeri in `lab/banco/suono.md`), tranne `suono-effetto-morte`: uguale su ogni seme, quindi `ripetitivo`. È una scelta dell'autore e resta così: il gioco lo suona, il validatore rifiuta di ripubblicarlo senza una variazione tra i semi; i test lo sanno (`keptByTheAuthor`, `tests/helpers.ts`). L'analisi non conosce `uso`: un effetto di una battuta o più si misura come un brano.
- **I tempi**: un cambio di luogo aspetta 4 s stabili e si dissolve in 3 s, così un confine non fa sfarfallare; oltre il bordo si cambia subito. Ogni 75 s il brano diventa un'altra delle sue 4 varianti (un altro seme, allo stesso punto del ciclo).
- **Il percorso**: `SoundRenders` (`renders.ts`, un worker, musica davanti agli effetti, 64 MB in memoria, cane da guardia a 20 s) → `worker.ts` (IndexedDB `quine-suoni`, 256 MB, sulle origini di `keepsFormsOnDisk`; alza `SOUND_CACHE_VERSION` se cambi ciò che esce dal sintetizzatore, un test te lo ricorda) → `prepareSound` (`prepare.ts`: il passaggio che gira, o l'effetto senza silenzio finale) → `Sfx` (`sfx.ts`: solo guadagni e dissolvenze). Ciò che fallisce tace. Volume e muto nel pannello d'aiuto (`H`), in `localStorage`. Dalla console: `window.suono` (`sfx.outputRms()`, `director.now`, `renders.measures`, `renders.failures`).
- **Le misure** (T224): Chrome headless, RTX 2070, ?skip&offline, turni da 15 s: 59,2 e 60,0 fps senza suono; 60,0 durante il primo rendering e 60,0 e 60,0 con la musica; p99 16,9 ms, il frame peggiore 17 ms contro i 183,6 di un caricamento senza suono. Un brano si calcola in 0,6-1,1 s nel worker (in Node 0,8-1,7 s), un effetto in 3-48 ms, tutti e 22 in circa 0,3 s; dal disco i 22 effetti in 80 ms in tutto. Un brano pesa 3,1-6,0 MB, gli effetti insieme 5,8 MB; dopo aver sentito sette brani la memoria della pagina tiene 36 MB (tetto 64), e ciò che suona ne ha una copia in più nell'AudioBuffer. Livelli all'uscita, volume 70 %, RMS massimo su 46 ms: musica 0,02-0,11; effetti 0,03-0,14; muto 0.
- **Il Musicista** (T225, ADR-0127): `sound.compose` (`src/kernel/agents/composer.ts`), prompt `prompts/agents/musician.md`, modello `ai.sculptors.musician`. Risponde con nome, programma e scopo; il kernel prende ciò che il mondo sa nominare, e un programma che non passa il validatore, i nomi del mondo (regola 0) o i 32 passi di un brano torna indietro col motivo, due volte al più. `ScoreDirector` (`src/kernel/scoredirector.ts`, `kernel.composing`): un ambiente di un luogo caricato che nessun programma nomina riceve il suo brano di giorno, entro `ai.maxPieces` (8) e il coefficiente `brani`, spese comuni; con il seme non chiede nulla, perché il seme li nomina tutti. Il viandante chiede al Referente (incarico `musica`) o al Musicista con `E`, e paga: senza un ambiente nominato il brano è di dove sta; un effetto prende l'id del programma di quell'effetto e lo sostituisce. In `chooseMusic` chi nomina l'ambiente per intero batte chi ne nomina una parte, e tra pari suona l'ultimo dell'indice. Provare il prompt: `npx vite-node lab/scripts/musicista-prova.ts -- <cartella con il .env> --max 10`.
- **In multigiocatore** suona ciò che il client sa: musica e raccolte, iscrizioni, incantesimi, ritorni, morte. Il client non riceve `item:crafted` né `forge:done` e non salta da sé, quindi quei suoni restano del gioco in singola.

<a id="fisica"></a>
## La fisica rimodellabile e la natura del mondo

- **Le primitive della fisica sono dati** (ADR-0224, T437, kernel 0.10.0, contratto 0.10): ciò che un corpo fa su una casella e ciò di cui il
  mondo è fatto si leggono da `src/kernel/nature.ts`, sempre entro i tetti del kernel (regola 7). **Il modo di attraversare** (`TerrainDef.cross`,
  `crossingOf`): `walk` a piedi, `swim` a nuoto (solo un liquido), `none` per niente; `solid` resta ciò che non si cammina e tutto il codice
  che lo legge (layout di oggi, cose posate, NPC, vie, `world.free`) resta com'è, `cross` dice come si attraversa ciò che non si cammina. **Il
  passo** (`speed`) a piedi 0,3-1,5, a nuoto 0,2-0,6 (0,4 se non detto, `SWIM_PACE`); **la fatica** a nuoto (`fatigue`, 1-6, 3 se non detta);
  **la profondità** (`depth`, `shallow` o `deep`, solo dove si nuota); **l'aria** (`air`, vero se non detto). `terrainPhysics` le legge
  riparate, `terrainPhysicsErrors` è ciò che il validatore rifiuta di un manifest (un `cross` che contraddice `solid`, il nuoto fuori da un
  liquido, profondità e fatica dove non si nuota, il passo dell'acqua fuori dal suo intervallo).
- **L'acqua si nuota in ogni universo**: `w` (fiumi, laghi, stagni, fossati, `shallow`) e `o` (il mare, `deep`) sono `cross: swim` nei
  codici di base (`BASE_CODES`, `WATER_CODES`), nel seme e, con la migrazione `0.9 → 0.10` (`migrate0_10`), nei manifest di ogni universo; la
  lava del seme e ogni liquido che nessuno dice resta `none`. Il kernel 0.10.0 scavava ancora l'acqua e il corpo non nuotava; da T438
  (ADR-0225, kernel 0.10.1) il layout la conta come via solo per i piani col suo segno (`swim`, come `vpt`, ADR-0211), così i luoghi
  pianificati restano come sono. `tests/luoghi-campione.test.ts`
  fissa la bozza e il layout di tre luoghi del seme (la partenza con lo stagno, la costa a (5, -5), il mare aperto a (-7, 6): 0, 16 e 37
  caselle d'acqua scavate) e dice che cosa fare se cambiano.
- **Il layout che non scava l'acqua** (T438, ADR-0225): ogni piano che il kernel fa dice `swim: true` (`ChunkPlan.swim`: il piano del
  Cartografo, del blocco, del riempitivo); il suo layout (`LayoutOptions.swim`) attraversa le caselle che si nuotano nel flood della connessione e
  nel percorso più economico (a costo 1) e non le scava mai, un varco sull'acqua resta acqua, una sacca si misura da ciò che si cammina, e
  `reachable` resta ciò che si cammina (niente si posa sull'acqua). Da un'isola chiusa dagli scogli si scava la roccia fino all'acqua. Un piano
  senza segno tiene i sentieri che ha scavato. Il validatore e la stanza dei campioni provano i programmi col layout dei piani nuovi.
- **Il corpo che nuota** (T438, ADR-0225, `src/kernel/swim.ts`): la collisione del viandante è `bodyFree` (`world.free_real`, il salto,
  `stepWanderer` del server): le caselle che si nuotano lasciano entrare, l'acqua profonda no a chi porta più di metà della portata o una cosa
  sopra la testa (`SWIM_LOAD`, «Sei troppo carico per nuotare…» ogni 4 secondi, anche nello specchio); `free` resta l'acqua solida per NPC,
  cose e vie: gli NPC non nuotano. Il passo è la casella (`world.speed_at` → `terrainPhysics`), il server dà il passo del nuoto a chi ha
  intorno solo acqua (`paceOf`). La fatica e l'annegare sono del kernel (`swimmingTick`, ogni viandante, anche dei client): `fatigue − 1`
  volte l'energia di un secondo di cammino del seme (`WALK_ENERGY`), poi la salute (`DROWN_HEALTH`), e a zero `die('annegato')` col livello
  della morte; non gli dei, non chi è trasceso da solo. Il salto atterra sulla terra entro la sua portata o, se non c'è, nella prima acqua
  (`swimsAt`), ed esce dall'acqua sulla riva. A schermo il corpo è immerso fino al petto (`swimFloor`, `SWIM_SINK`) con le bracciate
  (`swimLimbs`), la camera ferma (`Wanderer.sunk`); gli altri viandanti nuotano a schermo dalle caselle dello specchio (`swimsAt`), senza campi
  sul filo. `tests/nuoto.test.ts`.
- **Il Fisico alla Genesi** (`genesis.physics`): lo schema dice `cross`, `speed`, `fatigue`, `depth`; `toPalette` scrive ogni terreno con
  `physicsOf` dentro lo strato (muri, vegetazione e roccia mai, pavimenti e porte sempre, la terra a piedi o no, un altro liquido a nuoto o no) e i
  limiti; dei codici di base il Fisico dice solo il passo e la fatica dell'acqua; un passo fuori dall'intervallo del nuoto (l'1 del Cartografo) è
  quello dell'acqua. Ogni terreno di una tavolozza nuova dice `cross`. Dopo la Genesi un terreno cambia solo per mano del kernel: con le
  azioni imparate, e col Fisico a mondo acceso (sotto).
- **Il Fisico a mondo acceso** (T452, ADR-0235, kernel 0.10.11): il Referente porta al Fisico (l'incarico `physics`) una richiesta che cambia
  come i corpi vanno sul mondo, anche una regola che lo dice (una regola che cambia la fisica diventa un dato, ADR-0224); il Fisico risponde
  (`physics.reshape`, `src/kernel/agents/physicist.ts`, la manopola `studio`) coi terreni che cambiano e i soli campi che cambiano (`cross`,
  `speed`, `fatigue`, `depth`, `air`) e, se la richiesta lo dice, la gravità del mondo. Il kernel legge la risposta senza fidarsi e senza
  tagliarla (`src/kernel/reshape.ts`: `reshapedTerrain`, `reshapedGravity`): un valore fuori dai tetti o ciò che è fermo (lo strato di un
  terreno, come si attraversa e la profondità di un codice di base, il vuoto, l'aria dei codici di base, e della natura tutto tranne la
  gravità) si rifiuta col motivo. **La regola 10**: se un codice cambia come si attraversa (`crossingChanged`), `Kernel.crossingBreaks`
  guarda ogni luogo del mondo: un luogo caricato le cui caselle di adesso si dividerebbero (`walkGroups`, `splitBetween`) e un luogo
  pianificato, caricato o sul disco (`plannedPlaces`), che il layout disporrebbe altrimenti (scaverebbe un sentiero dove il luogo era intero,
  o non ne scaverebbe uno che c'è: `laidWith`, la tavolozza di prova solo per quella chiamata); in un kernel del ramo del master lo chiede al
  mondo che rappresenta (`branchOf`). Ciò che il kernel rifiuta torna al Fisico una volta coi motivi; ciò che resta rifiutato non entra, i
  motivi vanno nella risposta del Referente e nelle mancanze. Accettato, un commit del Concilio: il manifest dei terreni (`councilMayWrite`) e
  la gravità in `universe.json` per mano del kernel (`writeCommanded`), che `keepNature` ora lascia passare (`keptNature`: la gravità da
  ciò che universe.json dice, il resto della natura dalla Genesi). In una partita di molti il master lo chiede sul suo ramo (il suo specchio
  prende i file del ramo come il server li ha scritti, `writeCommanded`), e pubblicato lo hanno il mondo e ogni client (`TILE_FIELDS`,
  `UNIVERSE_FIELDS`). Mai da Lua. `tests/fisico-acceso.test.ts`.
- **La natura del mondo** (`universe.json → nature`, `WorldNature`: `geography`, `sky`, `day`, `gravity`, `oxygen`): la porta l'ambientazione
  (`WorldTheme.nature`), la scrive il kernel a ogni Genesi (`chooseNature`), il primo universe.json la fissa e uno dopo che dice altro torna
  com'era (`keepNature`, accanto a `keepGame`; la gravità no: la rimodella il Fisico, T452); `repairNature` accetta solo ciò che il kernel sa rendere vero (`NATURE_ACCEPTS`: il mondo
  di oggi, `continent`, `earth`, 600 secondi, gravità 1, niente respiro; in più la gravità 0,2-2, l'arcipelago, il vuoto, le stelle, il giorno di 120-3600 secondi o 0 e il respiro), e il resto è `DEFAULT_NATURE`, che non cambia mai perché è la natura
  degli universi che non la dicono. Il task che rende vero un valore lo apre lì (l'arcipelago T441, il vuoto, le stelle e il giorno T445, il respiro
  T446; la gravità da T447) e lo dà alla sua ambientazione. Pubblica: `nature` in `UNIVERSE_FIELDS`, i campi nuovi dei terreni in `TILE_FIELDS`
  (`src/session/files.ts`). Lua la legge con `world.nature()` (`Host.nature`, una copia a ogni chiamata), il kernel con `Kernel.nature()`.
- **La gravità** (ADR-0226, T447, kernel 0.10.2): `nature.gravity` da 0,2 a 2 (`NATURE_ACCEPTS`), letta da `gravityOf` (1 fuori). Il salto ha
  la stessa spinta (`leapOf`): altezza e portata scalano con 1/g ma **mai sotto quelle della terra**, perché `reachableStoreys` e i controlli
  dello Scultore verificano con `JUMP_UP` e `JUMP_FAR` (regola 10); la durata dell'arco con 1/g (0,32 s per 1/g più 0,08 s a casella); il
  kernel salta con `jumpUp()` e `jumpFar()`. Il passo appena (`gaitOf`: 1 sulla terra, 0,9 a 0,2), moltiplicato in `player.step`
  (`paceTick`), che `core.movement` e il ritmo del server (`paceOf`) leggono. Una **regione del master** ne dice una sua (`Region.gravity`,
  la riga «gravità» del modulo «Dichiara regione», controllata da `masterRegion`, mai su una trattenuta; `regionGravity`); `gravityAt(x, y)` è
  quella di un punto (la regione del master del luogo, o il mondo; il primo luogo è del mondo), `gravity()` quella del viandante che agisce
  (nella corona e nello studio la terra). In multigiocatore il salto è solo da soli; il client prevede il passo con la gravità del mondo, non
  con quella delle regioni del master che non vede, uno scarto entro la tolleranza del server. Nessuna ambientazione porta oggi una gravità
  diversa (l'asteroide e i pianeti: T445, T449); la pagina della campagna nel sito non ha ancora la riga (la rotta la accetta).
- **L'arcipelago** (ADR-0229, T441, kernel 0.10.5): `nature.geography: 'archipelago'`, portato dai Pirati. **Le isole sono del kernel**, dal solo
  seme (`src/kernel/islands.ts`): una per cella di `ISLAND_PITCH` (180 caselle, 10 luoghi), il centro scosso di al più 18 caselle, la riva una
  curva chiusa attorno al centro (`shoreAt`: raggio 16-40, mosso di al più un quinto; la partenza la più grande, centrata sulla prima casella).
  **Lo stretto più lungo** è `MAX_STRAIT` = 144 caselle (8 luoghi) d'acqua fra due rive, misurato sul corpo che nuota (`straitCost`): nel mare
  del seme 60 secondi e 17 di energia, nel più faticoso che il Fisico può scrivere con il passo più pesante di una gravità 77, sotto i 90 con cui
  si nasce. Fra due isole di celle vicine sugli assi, se l'acqua fra le rive lungo la retta dei centri è più lunga, **un isolotto** (raggio 5)
  a metà (`isletBetween`): così ogni isola è unita alle quattro vicine e dalla partenza si arriva a ogni isola (regola 10). Un isolotto non
  ridà energia (la ridanno cibo e letto), è un riposo dall'acqua. **La bozza**: il generatore del seme in un arcipelago non fa il suo mare
  (`world.nature()`), il kernel ci disegna sopra le isole (`islandDraft`, in `genDraft`): mare aperto `o`, due caselle d'acqua bassa `w`, due
  di spiaggia `s` (ogni riva un approdo), dentro la terra del generatore (il suo mare una laguna `w`); un generatore riscritto ha le isole lo
  stesso. **Le isole sono ferme**: solo il seme e la natura le decidono, mai l'atlante, il master o il Cartografo. **Il mare aperto senza
  chiamate**, in ogni mondo: un luogo la cui bozza è tutta acqua profonda che si nuota lo pianifica il kernel (`openSea`, `seaPlan`: «Mare
  aperto» nella lingua del mondo, `OPEN_SEA`; nessun ambiente, cosa, runa o carta), fuori dalla quota e dalla pausa come il riempitivo (non i modelli locali sopra un mondo che non è il loro, T433).
  **Il battesimo**: il primo luogo pianificato su un'isola (`islandOfPlace`, l'isola con più terra e spiaggia nel luogo) porta nella richiesta
  del Cartografo `island` e lo schema chiede nome e riga; il kernel li controlla (`cleanText`, `metaBreak`) e scrive nell'atlante una regione
  con `island` (l'id), il centro e la portata in luoghi (`islandPlaces`), l'ambiente del primo luogo, in un commit (`nameIsland`); i luoghi
  dopo ricevono il nome. Una regione d'isola non è una regione dei luoghi (`regionAt` la salta, `islandRegion` la trova) né toglie il suo
  ambiente al resto del mondo; `island` esce ai client nell'atlante (`REGION_FIELDS`). **Lua**: `world.region_at(x, y)` (la regione del luogo,
  mai una trattenuta, e l'id dell'isola sotto la casella; `Kernel.regionInfoAt`) e `world.islands(x, y, r)` (entro r ≤ 720 caselle, al più 32,
  i più vicini prima, col nome; `Kernel.islandsSeen`), copie. `tests/arcipelago.test.ts` (la misura, le coppie di 60 semi, la traversata
  sulle caselle di 5 × 5 celle, il kernel, Lua). Gli NPC restano sulla loro isola.
- **Porti, moli e secche** (ADR-0230, T443, kernel 0.10.6). **La secca** è una profondità dell'acqua (`depth: 'reef'`, `DEPTHS`): si nuota come
  ogni acqua (anche troppo carichi: non è profonda), **nessuno scafo vi galleggia** (`carries`): la nave che la tocca si ferma, il timoniere
  legge «Lo scafo tocca la secca e si ferma.» (`onReef`, `VEHICLE_WORDS.aground`, `vehicle:bumped` con `reef: true`). Il Fisico la dice di un
  liquido alla Genesi (`genesis.physics`); il seme ha il terreno `y` «secca» (id `reef`) e il molo `i` (id `pier`, un `floor` senza tetto).
  **Il timbro `harbour`** (`stamps.ts`) non è un disegno: da una riva che si cammina per due caselle (`StampCut.ground`, `stampGround`: come
  si attraversa ogni codice, dal layout) un molo dritto di caselle `pier` sopra l'acqua che si nuota, finché `PIER_INTO_DEEP` (2) sue caselle
  stanno nell'acqua profonda, al più `MAX_PIER` (8); dove l'acqua è bassa fino in fondo, un molo corto di `SHALLOW_PIER` (3) che non la
  attraversa; prima le rive da cui l'acqua profonda si raggiunge, il molo più corto, poi il seme. **La garanzia** (`pierTouches`): la testa
  tocca l'acqua profonda dove l'ha raggiunta, l'acqua comunque; se no il kernel allunga il molo di una casella, e una riva dove nemmeno così
  la tocca non si prende. Mai sul bordo né su ciò che un altro timbro ha preso (molo, radice e la casella dietro restano presi); al largo della
  testa, a tre o più caselle dalla sua linea e mai accanto al molo, due o tre secche dove il mondo ha un terreno di secca (ruolo `reef`; `pier`:
  un terreno che si cammina chiamato molo, altrimenti il ponte). Senza riva non disegna niente. Il rilievo mette il molo due livelli sopra il
  mare (la terra scende verso l'acqua di due livelli a casella): nel browser 0,75 contro 1,06 del ponte della barca a vela del seme, più di un
  gradino, e dalla testa del molo si sale a bordo con un salto. **Il ponte di una nave si raggiunge dall'imbarco** (`cellarGround`): i piani
  delle colonne dell'area `boarding` sono raggiunti come quelli a gradini dall'acqua (prima il ponte del generico, 9 voxel sopra la linea, era
  tutto «dove non si sta»).
  **L'ambiente «Porto»** del seme (`harbour`: il molo, due case, le strade dalle porte al molo) è senza epoca (`TIMELESS_LAYOUTS`), mai una
  regione dell'atlante. **Il Cartografo**: alla Genesi di un arcipelago gli ambienti delle rive (`ARCHIPELAGO_ENVIRONMENTS`), nel prompt delle
  terre le tavole dei moli e una secca, nel piano di un luogo d'isola che un porto va solo dove c'è il mare (`SHORE_LINE`); i modelli locali
  scelgono il porto solo sulla riva di un'isola, a parte (`HARBOUR` in `mock.ts`). `tests/porti.test.ts`.
- **Il vuoto, il cielo, il giorno** (ADR-0233, T445, kernel 0.10.9). **Il vuoto** è un terreno del kernel: il codice `~` (`VOID_CODE`), lo
  strato `void` (`voidTerrain` nella lingua del mondo, `isVoid`), che il kernel aggiunge alla palette solo in un mondo con
  `nature.geography: 'void'` (`paletteOf`, anche in `chooseNature`), sopra un terreno del generatore con lo stesso codice; la Genesi rifiuta `~`
  (`terrainErrors`), un manifest non può dire lo strato. `crossingOf` lo dà `none` qualunque cosa dica, `terrainPhysics` senz'aria; è solido e
  non è un liquido, quindi il corpo si ferma al bordo e il salto non lo passa (`airFree`); non è tra le caselle raggiungibili, quindi niente vi
  si posa; `setTile` non vi scrive e non lo scrive (effetti, incantesimi, `world.set_tile`); l'automa dell'acqua non lo carica
  (`WaterWorld.loaded`); un lotto di un blocco non lo copre (`blockFree`). **Le terre** sono il reticolo delle isole (`islandOf(…, 'void')`, gli
  stessi centri): la partenza una stazione grande quanto l'isola della partenza, una terra su tre un asteroide (`ASTEROID_ONE_IN`, raggio
  10-24), le altre stazioni (bordo a superellisse, `shoreAt`); niente isolotti. **La bozza** (`voidDraft`): fuori il vuoto (anche l'acqua bassa
  di un'isola), nella stazione il sentiero `p`, nell'asteroide ciò che il generatore ha disegnato senza prato, alberi né acqua (`s`, `r`, `n`).
  **Il layout** (`layout.ts`): `carvePath` salta il vuoto, un varco sul vuoto resta vuoto e non è da raggiungere, dopo il programma ogni
  casella torna alla bozza se il programma ha scritto sul vuoto o l'ha scritto; senza varchi sulla terra si parte dalla terra più vicina al
  mezzo (`landNearMiddle`); i varchi del kernel per un mondo del vuoto sono `voidGates` (dal varco dell'hash la prima casella lungo il lato
  che è terra dalle due parti, uguale per i due luoghi), passati come `opts.gates` da `layoutOf`, che salta anche i ritocchi (`edits`) sul
  vuoto. **Il vuoto costa zero**: un luogo tutto vuoto (`allVoid`) lo pianifica il kernel come il mare aperto (`seaPlan(true)`, `OPEN_VOID`).
  Il Cartografo battezza la stazione o l'asteroide (`islandUnder` con `body`, `VOID_LINE` al posto di `SHORE_LINE`, i nomi offline in
  `mock.ts`); `world.region_at` e `world.islands` (con `body`) leggono le terre del vuoto. **Il cielo di stelle** (`nature.sky: 'stars'`,
  `src/render/stars.ts`, `Stars`): sfondo e nebbia `STAR_SKY`, una sfera di 1800 stelle alla camera e un campo periodico sotto il piano
  (120 caselle, 4 × 4) che scorre con il tappeto e la camera al 40 % (`FIELD_PARALLAX`), `fog: false`, mai con la corona; `terrain.ts` non
  disegna le caselle del vuoto e dà alla terra accanto un fianco di `VOID_SLAB` (0,9) più scuro. **Il giorno** (`nature.day`, 120-3600 o 0):
  `Kernel.daySeconds()` (`clockDay`) per `day()`, la fase delle routine (`dayPhase`) e il suono; `daylight()` con la luce ferma (`STILL_DAY`,
  `stillLight`) è 1 e l'orologio tiene i 600 secondi della terra. **Nessuna ambientazione porta il vuoto** ancora: la capsula a ogni approdo
  c'è (T448, `#veicoli`), i terreni e gli ambienti dello spazio sono di T450; lo Spazio della Genesi resta la colonia con il cielo della terra.
  **Il mondo del vuoto è piano** (T448, ADR-0234: `flatRelief`, il rilievo dove ogni casella è al livello 0): una capsula agganciata a ogni bordo
  ha il ponte un gradino sopra la terra. `tests/vuoto.test.ts`.
- **L'aria e l'ossigeno** (ADR-0237, T446, kernel 0.10.13). **L'aria** è una proprietà di caselle, luoghi e veicoli, mai un gas
  (`src/kernel/air.ts`): `Kernel.airAt(x, y, z)` la dice in un punto del tappeto, dalla prima fonte che parla (`airOf`): il ponte di un
  veicolo che la tiene (`vehicle.air`, vero se non detto per `medium: void`: la capsula; un ponte aperto ha l'aria della casella sotto), poi il
  terreno senz'aria (`air: false`, il vuoto sempre), una regione del master che la dice (`Region.air`, vero o falso, mai una trattenuta,
  `regionAir`; la riga «aria» del modulo «Dichiara regione», solo dove il mondo conta il respiro), l'ambiente del luogo che dice
  `air: false` (il validatore rifiuta altro), il corpo del vuoto (un asteroide no, una stazione sì); altrove c'è. Lua la legge con
  `world.air_at(x, y)` (vero o falso, anche dove il respiro non conta: una fiamma che non si accende). **Il respiro** (`nature.oxygen`, aperto
  in `NATURE_ACCEPTS`; nessuna ambientazione lo porta ancora, T450): solo allora il kernel dà ai bisogni `oxygen` (0-100, pieno se manca) e
  lo fa lui, non `sys.needs` (`breathingTick` dopo il nuoto, ogni viandante, anche dei client): fuori dall'aria cala di `OXYGEN_DRAIN`
  (100 in due minuti), dieci volte più piano con una tuta indossata (`bonus.breath`, il più grande di ciò che si indossa, 1-10,
  `breathOf`), nell'aria risale di `OXYGEN_REFILL` (in cinque secondi); a zero la salute (`ASPHYXIA_HEALTH`) e `die('asfissia')` col
  livello della morte; non gli dei, non chi è trasceso, non chi sta già morendo; nella corona e nello studio si respira. Il mondo lo dice
  una volta a ogni cambio (`NO_AIR`, `AIR_AGAIN`). La rinascita, gli dei e chi è trasceso hanno l'ossigeno pieno. **La bombola** è un
  oggetto con `effects.oxygen` (il Narratore fino a 100, `toItemDef`; la bombola dei reami di T278): `core.items` lo fa respirare qualunque
  sia la categoria («Respiri: …»); l'effetto `needs` accetta `oxygen` (±40, «ossigeno +N»), che `core.effects` cambia solo dove c'è.
  **Il Concilio**: in un mondo che conta il respiro il Fisico può dire `air: false` di un terreno che non è dei codici di base e il
  Cartografo di un ambiente della Genesi (`PHYS_SCHEMA_BREATH`, `LAYOUTS_SCHEMA_BREATH`, `BREATH_ENVIRONMENTS`); in un mondo di oggi le
  richieste non cambiano. L'HUD mostra la barra «ossigeno» solo se i bisogni la hanno; i bisogni vanno al client come prima. Niente
  sott'acqua né falle: il fiato del nuoto sotto la superficie e l'aria che si svuota da una stanza sono dopo. `tests/aria.test.ts`.

<a id="veicoli"></a>
## Il veicolo

- **Una primitiva, non una barca** (ADR-0227, T439, kernel 0.10.3): un'entità il cui manifest dice `vehicle` (`medium` `water`, `land` o `void`,
  `speed`, `accel`, `turn`, `draught`) porta chi sta sul suo ponte; il Concilio ne fa barche e carri, il kernel le capsule del vuoto (T448). Le funzioni
  pure in `src/kernel/vehicle.ts`: `vehicleSpecOf` legge il manifest entro `VEHICLE_LIMITS` (velocità 0,5-8 caselle al secondo,
  accelerazione 0,2-4, giro 0,2-2 rad/s; `void` da T448), `vehicleSpecErrors` è ciò che il validatore rifiuta
  (anche un veicolo che è qualcuno o si prende), `carries` dice se una casella regge lo scafo (l'acqua che si nuota, solo quella profonda per un
  `draught: deep`; ciò che si cammina per un carro; il vuoto solo, per una capsula). Lo stato è il componente `vehicle` (`heading` = lo `yaw` della forma, `speed`, `turn`,
  `thrust`, `steer`, `power`, `anchored`, `helm`, `bumped`), scritto solo dal kernel e riparato a ogni lettura (`saneVehicle`).
- **Il ponte** (`Kernel.deckAt`): i pavimenti della forma del veicolo (le `decks`, rifatte con i solidi in `rebuildSolids`) alla quota dei piedi,
  o, finché la forma non c'è o se il veicolo non è solido, il disco del suo corpo. **La linea di galleggiamento** è `waterline="N"` sulla radice
  del programma (`waterlineOf`, 1-40 voxel): la forma si posa N voxel sotto la superficie come una cantina (`Form.base`, ADR-0091) ma senza
  suolo, e il suo pavimento entro un gradino sopra la base si raggiunge dall'acqua e dalla riva. Sul ponte non si nuota (`swimsAt`), l'acqua
  sotto non conta per il corpo (`bodyFree`, `freeReal`: anche chi è troppo carico ci cammina sopra l'acqua profonda), il salto ci atterra come
  sulla terra, e ciò che vi giace si disegna sul ponte (`restsAt`). La barca dei test è `tests/fixtures/barca-prova.xml` (scafo sotto 6 voxel,
  ponte 3 sopra l'acqua, parapetto basso, albero).
- **Il moto** (`vehicleTick`, nel tick prima di `rebuildSolids`, mai in uno specchio): per ogni veicolo il timone dà `thrust` e `steer`
  (`helmOrders`: su e giù spingono, sinistra gira la prua alla sua sinistra) o li ha dati Lua; `vehicleStep` integra l'abbrivio entro
  l'accelerazione (indietro a metà, l'ancora frena tre volte più in fretta) e il giro (a riposo un terzo, `TURN_AT_REST`); lo scafo prova la
  posa nuova, poi solo il giro, poi solo l'andare (`hullFits`: ogni punto dello scafo, `hullPoints` sulle colonne della forma ogni quarto di
  casella e i bordi o `discPoints`, su ciò che lo porta e fuori dal piede dei solidi e dallo scafo intero degli altri veicoli). Fermato perde
  l'abbrivio e dice `bumped`; chi tiene il timone sente «Lo scafo urta e si ferma.» una volta finché preme lì (`BUMP_EVERY`), e il bus dice
  `vehicle:bumped`. Poi i solidi si rifanno e **chi era sul ponte va con lui** (`carryAboard`): i viandanti (`wanderersAboard`; da T442 anche chi gioca da
  un suo client, spostato sul suo tappeto, `shiftWanderer`) con la stessa rototraslazione (`carried`) se il corpo può stare lì, il salto in corso con loro; le cose che vi giacciono (`thingsAboard`: non
  persone, animali, edifici, altri veicoli) col loro verso, e il loro luogo diventa quello sotto di loro. Nessuno a bordo: l'ancora si getta da sé.
- **Il timone e l'ancora**: dal menu del veicolo (`vehicleActions`, solo sul ponte; da T442 anche in uno specchio, che manda la scelta al server: «Prendi il timone», «Lascia il
  timone», «Getta l'ancora», «Leva l'ancora»; su un carro la guida e il freno, `VEHICLE_WORDS`). E apre il menu del veicolo a chi è sul ponte
  senza altro davanti e sempre al timone; Spazio al timone fa lo stesso (`jump` rifiuta). Prendere il timone leva l'ancora; chi lo tiene non
  cammina (`HELM_STILLS`, `core.movement` saltato) e guarda dove guarda la prua (`facingOf`); lo lascia dal menu, o scendendo, saltando,
  morendo, uscendo (`letGoHelm`).
- **Non è di un luogo** (come `moved`, ADR-0168): `spawnModuleEntity` gli dà un'origine (`freshOrigin` se non ne ha), lo toglie al suo luogo
  (niente `chunk`) e mette l'origine in `consumed`; al più `MAX_VEHICLES` (32), oltre un veicolo di un luogo è una cosa del luogo e Lua non ne fa.
  Il salvataggio: `world/state.json → vehicles` (`vehiclesToSave`: modulo, origine, x, y, verso, ancora; `restoreVehicles` al caricamento, letto con
  `readVehicles`; un modulo che non c'è aspetta nel salvataggio). La Genesi li toglie. Il carico non si salva ancora (la stiva, T444). Il catalogo del Cartografo non offre i veicoli (`catalog`): li fanno Lua e i porti (T443).
- **Lua** (V-045): `world.vehicle(id)` (una copia, con `aboard` e `helm` come corpi), `world.vehicle_set(id, t)` (`power` 0…1; `thrust` e `steer`
  −1…1 solo senza timoniere; `anchored`; `helm` a un viandante sul ponte, in silenzio se non può, o `false`), `world.vehicle_of(id)`. La `pos` e
  il `vehicle` di un veicolo arrivano a Lua come copie, `vehicle` non si scrive né nasce da `ecs.spawn`. `mech.barca` di T183 è il vento sulla
  vela, senza sedile a mano.
- **Lo Scultore delle navi** (ADR-0228, T440, kernel 0.10.4): la classe `vessel` ha scatole lunghe sue (`VESSEL_TILES` in
  `src/mj/classes.ts`: Media la scialuppa 1 × 2,5 × 1, Grande la barca a vela 2,5 × 6 × 4, sua taglia, Enorme il brigantino 4 × 10 × 6,
  Gargantuesca il galeone 6 × 16 × 9; Minuscola e Piccola il modellino e la canoa) a `VESSEL_VPT` (16) a ogni taglia; una voce non scrive la
  densità (`modelSize`), `vptOf` la legge. Il generico del seme è `universe/models/vessel.xml`. Ciò che il kernel legge di una nave sta in
  `src/mj/vessel.ts`: le aree su ogni strato (`columnAreasOf`, una casella di ogni area che vi ha una cella: `helm`, `boarding`, `hold`;
  per una forma `formDeckAreas`), lo scafo alla linea (lo strato `waterline - 1`, il mare allagato dal bordo: ciò che non raggiunge è scafo),
  lungo, largo, la prua (l'ottavo davanti), il ponte dall'imbarco (`surfaces`: asciutto, un gradino alla volta, la testa libera), quanto ne sta
  sopra lo scafo, il timone accanto (`measureVessel`). I controlli (`vesselErrors`, `VESSEL_LEAST`) sono nei controlli dello Scultore
  (`checkProgram` → `vesselNotes`): la linea sulla radice, lo scafo chiuso lungo il doppio con la prua che si stringe; dalla Media in su
  (`carriesPeople`) l'imbarco, mezza casella² di ponte, metà sopra lo scafo, il timone sul ponte. Una nave è della categoria delle strutture
  (lo Scultore più forte, una revisione) ma non cresce a regole: un programma per taglia. La sezione «Vessels» del prompt dice come, la richiesta
  i numeri (`vesselLine`). Offline `mockVesselProgram` (`src/kernel/ai/mockVessel.ts`) scrive una barca per la scatola chiesta (aperta fino
  alla Media; dalla Grande ponte, parapetto, varco dell'imbarco, timone a poppa, stiva, uno-tre alberi con le vele come azioni `furl`/`hoist`).
  **Il timone dov'è**: con l'area `helm` nella forma si prende solo entro `HELM_REACH` (1,5 caselle) da una sua casella (`nearHelm`, anche da
  Lua); il menu lo mostra spento con «Il timone è più in là.» Senza l'area, da ovunque sul ponte. Il banco: `lab/scripts/banco-navi.ts`,
  `lab/banco/navi/`; nel laboratorio 3D il gruppo «Navi alle taglie». I test: `tests/navi.test.ts`.
- **A schermo**: il verso di ogni cosa a ogni fotogramma (`Entities.update`); chi è a bordo muove le gambe solo se cammina sul ponte; al
  timone la camera arretra una volta a `HELM_VIEW` (22) e la rotella e il pizzico arrivano a `ZOOM.helm` (30, `zoomMax` in
  `src/render/camera.ts`); lasciato il timone torna entro 15.
- **In molti** (ADR-0232, T442, kernel 0.10.8). Il server muove il veicolo e **porta anche chi gioca da un suo client**. **Ai client la posa a
  elenco**: `EntityView.vehicle` (`heading`, `speed`, `turn`, `anchored`, `helm`; `vehicleSeen`) a ogni spostamento, la forma senza `yaw`, il
  manifest con `vehicle` (`VEHICLE_FIELDS` in `src/session/files.ts`); una vista con soli `id x y on lx ly vehicle` è uno spostamento (`isMove`).
  **Lo specchio porta avanti il veicolo** (`sail` in `src/session/thin.ts`): dall'ultima parola del server col suo abbrivio e il suo giro
  (`coast`, al più `COAST` oltre), lo scarto chiuso a poco a poco (`SETTLE`), tutto oltre `JUMP`/`JUMP_TURN`; il kernel specchio lo sposta e porta
  il suo viandante (`carryMirrored`); il timoniere non predice. **Il passo sul ponte**: `step { x, y, on }` col punto del ponte nel riferimento
  del veicolo (`onDeck`), che il server mette dove ha il veicolo (`offDeck`, `deckNear`: un veicolo entro `near`) e controlla come ogni passo
  (credito, `FAR`, collisione): il ponte porta, il credito conta solo il cammino; la correzione dice anche il punto del ponte (`correction.on/lx/ly`).
  **Gli altri a bordo** e ciò che giace sul ponte arrivano dove stanno su di lui (`OtherView.on/lx/ly`, `EntityView.on/lx/ly`, `carriedOn`) e lo
  specchio li tiene lì sul ponte che porta avanti (`onDecks`); il renderer muove le gambe di chi cammina sul ponte, non di chi vi è portato.
  **Il timone**: il menu dello specchio (dal `vehicle` mandato; il timone del suo client è il suo viandante, quello di un altro `other:<id>`,
  mai l'id `me` che ogni specchio dà al suo), le scelte al server (`action`), il
  veicolo su cui si sta a portata da tutto il ponte (`outOfReach`); i tasti col messaggio `keys`; al timone lo specchio non cammina. Uno tenuto
  da un altro solo al master o con `pvp`, dal menu (`seizesHelm`; chi lo perde: «Qualcuno ti prende il timone.»). **Tuffarsi** («Tuffati», sui
  carri «Scendi», `over` → `leaveDeck`): sempre, chiunque governi, il posto più vicino fuori dallo scafo entro `LEAVE_REACH`; in molti un client
  non salta. **La spinta dello scafo** (`pushAside`): chi non sta sul ponte ed è sopra lo scafo dove è arrivato (`overHull`: le colonne sopra la
  linea) va da parte per dove è andato quel punto dello scafo, al più `PUSH_REACH`; mai schiacciato. **Ciò che il mondo fa a un viandante fuori da
  ciò che fa lui** arriva al suo client: le parole (`tell` → `wanderer:told` → l'avviso `world`) e il posto (`wanderer:pushed` → una correzione
  subito). **Sul ponte si cammina**: `world.speed_at` e il credito del server sopra l'acqua coperta da un ponte (`onAnyDeck`, `aboard`) danno il
  passo di chi cammina. V-046. `tests/veicolo.test.ts`, `tests/veicolo-molti.test.ts` (con `tests/fleet.ts`), `tests/sicurezza/veicolo.test.ts`,
  `tests/sicurezza/veicolo-molti.test.ts`, `tests/espressivita/scenari.test.ts` (la barca).
- **Salire a bordo dal menu** (ADR-0234, T448, kernel 0.10.10): accanto a un veicolo e su nessun ponte, il suo menu offre `board` («Sali a
  bordo», «Sali» su un carro, «Entra» in una capsula; `vehicleActions`, anche nello specchio, che manda la scelta al server): `boardDeck` mette il
  corpo sul posto libero del ponte più vicino, prima l'area `boarding` (`boardingSpot`), entro `BOARD_REACH` (2,5 caselle), e lo dice al client
  come una spinta (`wanderer:pushed`); dall'acqua accanto allo scafo, dalla testa del molo; il server lo prende anche quando il mezzo del veicolo
  è oltre la sua portata (`outOfReach` con `canBoard`). **Il piede sul ponte**: dove la casella sotto un piede
  non porta il corpo, il ponte lo porta se sta entro un gradino dai piedi (`DECK_STEP` in `bodyFree` e `freeReal`; `deckAt` con la sua tolleranza).
- **Le capsule del vuoto** (ADR-0234, T448). Uno scafo `medium: void` sta solo sul vuoto (`carries`: `isVoid`), il bordo di una terra lo
  ferma («La capsula urta e si ferma.»); le parole sono quelle dei comandi e dei motori (`VEHICLE_WORDS.void`: «Prendi i comandi», «Spegni i
  motori», «Esci», «Entra»); «Esci» nel vuoto solo verso una terra entro `LEAVE_REACH`. **L'approdo** di ogni terra (`dockOf` in
  `src/kernel/islands.ts`, una funzione del seme e della terra, in cache per terra nel kernel): sull'asse verso la più vicina delle quattro
  vicine del reticolo, dove la terra finisce sulla riga (o la colonna) del centro, la capsula (`CAPSULE_TILES` 2,5 × 4) oltre il bordo con la
  prua lontano dalla terra e la poppa sopra il bordo di `DOCK_OVERLAP` (1/64), spostata fuori di una casella finché una casella sotto di lei è
  terra; `Dock.land`, la terra al portello, nell'`apron` del layout del suo luogo (`dockApron`, con quello del blocco: camminata e raggiunta
  dai varchi). **La capsula del seme**: `vehicle.capsule` (`CAPSULE`), `universe/models/capsule.xml` (classe `vessel`, la scatola nel
  programma 40 × 64 × 32 a 16; il ponte di un voxel, le pareti, senza tetto, l'arco sopra la testa, i comandi `helm` a prua, il portello
  `boarding` a poppa, i motori `glow`). **Il kernel la mette** in `applyPlan` (`dockCapsules`, mai in uno specchio) per ogni approdo il cui
  mezzo sta nel luogo, se nessun veicolo è entro `DOCK_NEAR` (2,5); origine `dock:<terra>` (o `dock:<terra>/<n>`), il verso dell'approdo,
  `vehicle:docked` sul bus; oltre `MAX_VEHICLES` il guasto `kernel:capsule`. **La capsula lasciata** (`idleCapsule`: motori spenti, nessuno ai
  comandi né a bordo) non si salva e lascia il mondo con il luogo in cui sta (`unloadChunk`): il luogo dell'approdo ne rimette una. `tests/capsula.test.ts`.


<a id="pianeti"></a>
## I pianeti e il viaggio

- **Fasce lontane dello stesso piano** (ADR-0236, T449, la via C1 di D64; `src/kernel/planets.ts`): il pianeta k è la striscia di luoghi attorno a
  (k · `planetPitch`, 0), 2^20 caselle in luoghi interi (`PLANET_SPAN`, 58 254 luoghi a 18 caselle); la fascia 0 è l'orbita (il vuoto, le stazioni,
  gli asteroidi) e ogni mondo senza pianeti (`bandOfPlace`, `bandOfTile`, `Kernel.bandOf`, `bandAt`). Nessun campo nuovo su disco né sul filo per
  la fascia: si ricava dalla coordinata; un universo di oggi non ha pianeti.
- **I pianeti della natura** (`universe.json → nature.planets`, `Planet`, `repairPlanets` in `nature.ts`): solo con `geography: void`, al più
  `MAX_PLANETS` (8); `name` (una riga), `seed` (`planetSeed`: del mondo e della fascia se manca), `geography` (`continent`), `sky`, `day`, `gravity`,
  `sea` (0-24 livelli); fissati alla Genesi con la natura. `natureOfBand` e `Kernel.natureAt`: il cielo, il giorno e la gravità del pianeta; la
  gravità di un punto (`gravityAt`), la luce (`daylight(x)`), `world.nature()` (la fascia del luogo che il generatore disegna, `draftBand`, o del
  viandante che agisce; mai l'elenco). Le destinazioni con i nomi (`destinations`; senza nome `planetName` dal seme; l'orbita «l'orbita»). Ogni nome che il kernel conia a sillabe (un pianeta, una persona quando i nomi del mondo sono finiti, `freshName`) passa dal filtro dei nomi coniati (`src/kernel/coined.ts`, T462): `foldName` lo sente senza accenti né doppie, con `k`/`c`, `th`/`t` e simili uguali, e `badRootOf` lo confronta con le radici offensive, volgari o ridicole in italiano, inglese, francese e spagnolo; un nome che ci cade si ricompone col seme successivo.
- **La terra, il rilievo, il mare**: `genDraft` chiama `generate_chunk` con il luogo nelle coordinate del pianeta (`planetLocal`) e il suo seme;
  niente reticolo del kernel su un pianeta (`lattice(cx)`), i varchi del vuoto solo nell'orbita. `BandedRelief` (`relief.ts`): l'orbita col suo
  rilievo (piatto nel vuoto), ogni pianeta le sue colline dal suo seme lette nelle sue coordinate e alzate perché il suo mare (`sea` o quello del suo
  rilievo) stia al livello del mare del mondo; fatto la prima volta che serve (~350 ms), il renderer lo fa nelle pause.
- **Lo spazioporto** (`PAD`, `planetDock`, `padTiles`): la piazzola nel primo luogo del pianeta (la capsula di 2,5 × 4, la prua a nord, il portello
  sulla casella (1, 4)); `docksOf` la dà come un approdo del vuoto, `dockApron` tiene camminate le sue caselle, `placementsOf` non vi posa niente,
  `dockCapsules` vi mette la capsula (regola 10).
- **Il viaggio** (`travelTo`, `transitTick`, `jumpVehicle`, `landingOf`): «Rotta per …» (`travel:<fascia>`) nel menu di chi tiene i comandi di un
  veicolo del vuoto, per ogni corpo che non è quello dov'è; rifiutata se l'approdo ha un altro veicolo che non è una capsula ferma e vuota. Lo stato
  `transit` del componente `vehicle` (`from`, `to`, `t`, `total`, `jumped`; `saneTransit`, anche sul filo in `vehicleSeen` e `readVehicleView`,
  copiato dallo specchio). 16 s (`TRAVEL_SECONDS`): il veicolo non guida, «Esci» risponde «Siete in viaggio», nessuno sale. A metà (`TRAVEL_JUMP`) il
  veicolo va all'approdo della destinazione col suo verso, chi è a bordo allo stesso posto del ponte spostando lo scorrimento del tappeto (mai la
  posizione nel cerchio: la corona non se ne accorge), i piedi alzati quanto il suolo, ciò che vi giace con lui; la capsula ferma all'approdo gli
  lascia il posto; `wanderer:pushed` ai client. Alla fine l'ancora e «Siete arrivati: …». Il bus dice `vehicle:travel`, `vehicle:jumped`,
  `vehicle:arrived`. Lua non ha un'API del viaggio.
- **A schermo** (`Renderer.voyageNow`, `transitView`): fino al salto il corpo lasciato, dopo quello raggiunto; il veicolo e chi è a bordo
  (`carriedOn`) in un gruppo alzato della quota (`Entities.aloft`, `Wanderer.aloft`), da 0 a `GLOBE_TOP` raggi del globo (360 caselle,
  `ORBIT_TOP`, per l'orbita) e giù, esponenziale (`altitudeAt`); la camera li tiene senza inseguirli, il piano lontano e la nebbia seguono la quota;
  sopra un pianeta oltre `PLACES_BELOW` (160) il resto del mondo si nasconde.
- **I livelli di dettaglio** (`PlanetLod` in `planets.ts`, `Planets` in `src/render/planet.ts`): sedici livelli di 32 × 32 celle centrate sul
  centro del pianeta, da 32 768 caselle alla casella (`lodCell`, `lodPoint`); il codice di ogni cella dal generatore (`Kernel.planetTile`: una casella
  col seme del pianeta, senza toccare `seedLua` né i guasti; ~0,18 ms nel browser). Si riempiono dal più grosso nelle pause (5 ms ogni 40, 14 in
  viaggio, il pianeta del viaggio per primo) e si tengono nel `localStorage` (`quine:pianeta:v<LOD_VERSION>:<planetSignature>`). Ogni livello è una
  mesh di voxel sul globo (`levelGeometry`, `globePoint`: mappa azimutale equidistante, raggio `GLOBE_RADIUS`, l'equatore lungo la fascia; le
  altezze da `cellHeight` e dal rilievo dove la cella è di poche caselle), al più `KEPT` (10) mesh sulla GPU.
- **Il passaggio fra i livelli**: il voluto ha celle di circa nove pixel (`lodWanted`); il più fine entra a retino complementare (`ditherAt` dello
  schermo: `uShow`, il quadrato `uInner` che il più grosso gli lascia con `uInnerShow`), i più grossi fino a cinque sotto; sotto `PLACES_BELOW` il
  rettangolo dei luoghi caricati della fascia è un buco dei livelli (`uHole`). Da lontano il globo gira attorno al veicolo verso dove guarda la
  camera e torna sotto di lui da R/30 in giù. Il globo e le sue stelle (`Stars.around`) nel passaggio prima del mondo (`Bloom.background`), la
  camera del mondo coi piani dalla quota; il mondo sopra senza sfondo, con la profondità pulita; i programmi fatti prima del viaggio
  (`Planets.warm`). `window.view.planetStats()`: livelli pronti, mesh, triangoli, byte, celle campionate.
- **L'origine mobile**: `Builder.geometry(origin)` e `FoamBuilder.geometry(origin)` (i vertici relativi all'angolo del luogo, il gruppo lì), le
  istanze relative; `buildCut` relativo alla sua casella; `U.cutOff` la frazione dello scorrimento e `U.cutTile` relativa alla parte intera; le
  onde dall'attributo `seaPhase` (`swellPhases`, in doppia precisione) e la schiuma da `foamPhase`; la scia relativa al primo sbuffo.
- **Le misure** (`lab/scripts/misura-frame.mjs --viaggio <universo>`): sono nell'ADR-0236; i long task del viaggio cadono dopo il salto, quando
  arrivano i luoghi nuovi del pianeta, come in un caricamento a freddo.
- **Test**: `tests/pianeti.test.ts` (la natura, le fasce, la terra e il rilievo, lo spazioporto, il viaggio, il filo, i livelli, l'origine mobile).

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
- **Il mare a schermo** (T451, § 1.7 di `docs/design/acqua-spazio.md`): solo disegno, niente sul filo né nei dati, `src/render/sea.ts`.
  Le cime delle caselle d'acqua stanno in una mesh loro per luogo (`SEA_MAT.water`), che l'**onda lunga** muove nel vertex shader: tre
  sinusoidi delle coordinate del tappeto (così le onde restano sul mare quando il tappeto scorre) e del tempo (`SWELL`, `SEA_GLSL`, la stessa
  somma in `swellAt`), la pendenza come normale e le creste più chiare (le bande del cartone non mostrerebbero una pendenza così lieve). Il
  peso di ogni vertice (`wave`, `seaWeight`) è 1 dove le quattro caselle attorno all'angolo sono acqua dello stesso livello e 0 dove tocca
  altro: lì l'acqua resta al suo livello, così l'argine scende fino a lei e un'onda non apre mai una fessura; gli ids dell'inchiostro
  muovono i vertici allo stesso modo (`userData.pars`, `userData.begin` letti da `idsOf`). La **schiuma** è una striscia sull'acqua lungo
  ciò che la ferma alla sua altezza, che va e viene (`FoamBuilder`, `SEA_MAT.foam`, senza inchiostro). Un veicolo su una casella d'acqua
  **rolla** e beccheggia sul suo corpo (non sulla radice: il verso resta quello del kernel) con l'onda e si inclina in fuori in virata
  (`rollOf`), e lascia la **scia** (`Sea`, in `Entities`): un punto ogni `WAKE.every` caselle oltre `WAKE.slow`, dal moto che si vede
  fotogramma per fotogramma (vale anche nello specchio), con due bracci che si allargano e il ribollire nel mezzo, in una mesh con i buffer
  fatti una volta. Chi nuota galleggia sull'onda; la camera no (`Wanderer.sunk` la toglie). Nessun numero è del kernel: non sale `Z`.

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
  la parte di `prompts/agents/sculptor.md` dopo `<!-- strutture -->` (`sculptorRole(files, true)`, `procedural`), senza esempi della libreria
  e, dal T354, senza scheletro (ADR-0183: il metodo e gli attrezzi, non un edificio da ricopiare); offline la risposta dei modelli locali è
  `MOCK_STRUCTURE_PROGRAM` (`src/kernel/ai/mockStructure.ts`), la villetta scritta a mano come il prompt chiede. Il programma non ha una `size` sua (`withoutSize`):
  gira nella scatola della taglia di ogni voce. `checkProgram` lo prova a `STRUCTURE_SEEDS` semi alla sua taglia e al primo seme della
  successiva (`triedSizes`), verificando che vi siano almeno due piani raggiungibili a piedi dalla porta (`reachableStoreys`, ADR-0162), e dice dove cade (`failedAt`); la seconda richiesta (il difetto o la revisione dell'Artista) porta la traccia di
  quel seme (`traceOf`, T179) e le viste in testo (`textViews`, T354). L'id ha la taglia se non è Grande (`structureModel`: `struttura-<concetto>`, `struttura-<concetto>-huge`); un lotto indossa la voce
  di prima senza suffisso finché la libreria non ha quella della sua taglia, salvo che sia un programma che scala a un'altra taglia
  (`Kernel.structureModelFor`): nulla di già scolpito cambia. Il
  `ModelDirector` dà a una taglia nuova il programma di un'altra (`shared`, senza chiamate) se è la stessa taglia (una voce di prima, senza
  suffisso) o se il programma scala (`shareableProgram`); la voce dice i suoi semi (`ModelInfo.seeds`, `seedsOf`). Il validatore prova un
  programma senza `size` della classe `structure` nella scatola della sua voce (`Validator.modelBox`, `Forms.structureBox`).
- **Ciò che entra, non l'edificio rimpicciolito** (ADR-0179, T338): una struttura che cresce a regole (`growsByRules` in `src/mj/classes.ts`)
  gira alla stessa densità a ogni taglia fino a `STRUCTURE_SIDE` (500 dal T370, 200 prima): Grande 100, Enorme 150, Gargantuesca 500 voxel di lato
  (`densityFor`; a `TILE`, 20, fino a T405, a `STRUCTURE_VPT`, 16, dopo: sotto), così una taglia più grande è un'area più grande alla stessa scala. Una voce scolpita prima tiene la sua scatola: la scatola di
  una voce è la sua taglia alla densità che la voce dice (`entryBox` in `forms.ts`: `vpt` 16 all'Enorme, 120 voxel), una nuova non scrive
  `vpt` (`modelSize`); una carta portata tiene il suo (`bring.ts`). Le parti abitabili hanno misure minime in caselle, le stesse a ogni
  taglia (`PARTS`, `partVoxels`): porta 0,6875 × 1,875 (11 × 30 a 16), piano 1,875 di luce, stanza 1,75 di lato, tettoia 1,875 di luce e
  1,25 di fondo (fino a T405 0,55 × 1,5, 1,5, 1,4, 1,5 e 1: gli stessi voxel a 20). `habitableParts` (`forms.ts`) le misura sulla griglia: i piani raggiunti a piedi (`reachableStoreys`), le stanze su ogni
  pavimento coperto dove sta un corpo, raggiunto o no (il lato del quadrato più grande con il soffitto ad almeno la luce di un piano,
  il corpo compreso), le porte dalle celle che l'azione `open` cambia. In `checkProgram` (`checkOnce`) una parte sotto la sua misura
  è un errore col motivo (`partErrors` in `src/mj/check.ts`: la fattoria di 5 × 5 di prima ha la stanza di 0,6-1,3 caselle); al primo seme
  delle due taglie provate la più grande deve contenere di più (`compositionOf`: le parti sono i pezzi di una lettera di almeno
  `MIN_PART` voxel; `varietyError`: un tipo di parte in più o un quarto di parti in più, `failedAt` alla più grande). L'altezza minima
  di una struttura che cresce a regole è quella della scatola della sua classe (`leastHeight`): l'area cresce, l'altezza non deve. Il
  prompt procedurale e il messaggio (`bodyLine`) dicono le misure e il metodo: il corpo principale a `steps`, il resto che cresce fino
  al bordo, una parte dove un pattern di terreno libero della sua misura combacia (un nodo che non trova niente non fa niente); lo
  scheletro aggiunge un muro di cinta a 150 e un viale a 200 (la sua sezione 7). Il validatore e i modelli del seme non applicano le
  misure: le chiede lo Scultore a ciò che scrive. Le carte fatte a mano restano alla densità di prima (`boxUnderMaxSide`), dove sono
  misurati i loro tetti. Il banco: `lab/banco/taglie/` (fattoria e forte alle tre taglie, `npx vite-node
  lab/scripts/banco-taglie.ts`).
- **Le parti abitabili come sottoblocchi del seme, le aree, le `map` che tornano** (ADR-0182, T346, kernel 0.6.8, passo 1 di D48): quattro programmi di
  `universe/models/` che una struttura include con `<import file="part-…"/>` (ADR-0171) invece di riscriverli: `part-stair` (la scala da una
  striscia `T` di 16 × 11 nell'aria sopra un pavimento, scritta da chi include con `symmetry="()"`: sale verso le x grandi due per uno, apre
  il solaio sopra la striscia, riempie sotto; l'unione `=` sono i pavimenti), `part-door` (dal seme `O` di 11 scritto attraverso il muro al
  piede: sale 30 attraverso l'unione `+` dei muri, architrave e stipiti `N`, assi `o`; le azioni `open`/`close` restano di chi include),
  `part-battlements` (sul bordo di ogni cima piatta delle lettere `+`: merli di 5 e vuoti di 3, alti 6, regolari da ogni angolo), `part-slits`
  (sotto il centro di ogni merlo di 5 una feritoia di 1 × 6 attraverso l'unione `%`). Il contratto: le lettere di chi include che la parte
  legge e scrive (chi include dà i colori), le unioni che chi include ridefinisce (la sua vince), i marcatori `#90`-`#91` suoi. Da sola ogni
  parte è un modello: la scena dall'origine (la lettera `S`, che un'inclusione non ha: quei nodi non fanno niente inclusi), `size`, `ground`,
  la porta con le azioni per la scala, così il validatore la prova e `habitableParts` la misura; le scrive `lab/banco/taglie/parti.mjs`.
  **Le aree** (`src/mj/areas.ts`): `area="pasture"` su una `<color>` (`AREA_RE`, anche nascosta: resta nella griglia senza vedersi);
  `areasOf(grid, palette, vpt, base)` legge lo strato del suolo casella per casella (l'area con più celle, a parità la prima in ordine
  alfabetico), `formAreas(form)` una volta per forma nel frame del modello (`Form.areas`, prima di `yaw`); una struttura non disegna persone
  né animali, marca dove vanno, per il Narratore e lo Scenografo (un task loro). **Le `map` che tornano** (`mapsBackToBox` in `model.ts`): un
  programma le cui `map` hanno prodotto di scala 1 su ogni asse (un piano a `1/10 1/10 1`, poi `10 10 1`) prende la scatola che gli si dà:
  `shareableProgram`, `withSize`, `checkProgram` lo trattano come uno senza `map`, e `soil` vale (la prima `map` lo porta giù); la scala del
  piano deve dividere le scatole. Il banco (`lab/banco/taglie/`): la fattoria col piano di T339 (cortile irregolare, strada, staccionata,
  tracciati, appezzamenti a incastro, pascoli recintati con i cancelli a sbarre, il fienile a lato) e la casa di T338 (due piani, tettoia,
  fieno); il forte con la cinta di 12 e il camminamento, le torri cave con la porta dal camminamento, merli e feritoie dalle parti; i
  controlli `merlonRuns` e `animalLetters`, le aree per taglia, `--parti` per le parti da sole.
- **Lo Scultore delle strutture senza scheletro, a blocchi** (ADR-0183, T354, kernel 0.6.10, passo 2 di D48): il prompt dopo `<!-- strutture -->` non ha più
  un programma da ricopiare (T337: lo scheletro era il 78-92 % di ogni programma, e ogni concetto dava lo stesso edificio) ma un metodo in tre
  livelli dentro un programma solo: la composizione del concetto sul piano a un quinto (`map scale="1/5 1/5 1"`, una cella un quarto di
  casella: 20, 30 e 40 celle di lato alle tre taglie; `soil` e `origin` portati giù dalla prima `map`), le altezze come colonne a passi dopo la
  `map` che torna (`5 5 1`, un blocco di 5 × 5 per lettera del piano: un piano di 32, la striscia `T` della scala nell'aria sopra la sua zona),
  la scala piena (le porte dove la strada tocca il piede del muro, le parti incluse dopo che le colonne sono salite, finestre, tetti, pulizia),
  con gli attrezzi provati (il corpo da una linea per il centro e una moneta su una cella sola, l'ala, cortile e cinta, le torri sugli angoli
  convessi, la via dal centro al fronte, `field` per «il più lontano dal portone», la zona della scala col pianerottolo, ciò che entra con i
  pattern di terreno libero a `steps="1"`, gli anelli oltre il costruito misurati dal cortile verso fuori) e il divieto delle lettere delle parti
  (`S`, `#90`-`#97`). **Le parti nella richiesta** (`partResources` in `sculptor.ts`, come `libraryResources`): per ogni `models/part-*.xml` il
  primo paragrafo del commento in testa, il contratto per chi include. **Due blocchi** (`BLOCKS`): la prima richiesta chiede la composizione
  sola (`isPlanOnly`: una `map` che non torna), il kernel la fa girare a tre semi e al primo della taglia successiva con il suolo letto come
  `ground` (`planBlock`) e rimanda le piante in testo con quanto differiscono i semi; la seconda il programma intero con le piante davanti; una
  risposta che già torna alla scatola si controlla come programma intero (offline una chiamata). Ciò che non passa torna con il motivo e il suo
  significato (`withMeaning`), le viste in testo del seme caduto con pianta e altezze di altri due semi (`Checked.others`, che dopo una caduta
  girano comunque fino al terzo) e la traccia (`traceOf`, ora con i file inclusi); la revisione dell'Artista porta anche le viste. **Le viste
  in testo** (`src/mj/views.ts`, da `lab/banco/viste.ts` di T337, che le riesporta): `planView` (la lettera in cima a ogni colonna e le altezze in
  cifre), `elevationView` (fronte, lato destro), `sectionView` (un taglio), `legend` (una lettera nascosta col solo nome della palette è
  «marker»), `viewsText` (tutte, entro una larghezza; una griglia piatta dà solo la pianta), `sectionHeights`, `sideBySide`, `planDistance` (le
  celle in cui la lettera in cima differisce, sulle celle costruite da almeno una, il terreno escluso). **La scala del seme è tollerante**:
  `part-stair` prende i primi 16 voxel della striscia dal lato basso e rende il resto all'aria, apre il solaio di qualunque spessore, non chiede
  aria sul lato basso; il contratto vuole dieci voxel liberi prima del primo gradino (il corpo sale in linea) e pavimento oltre il sedicesimo.
  Il banco (`lab/banco/taglie/`): la villetta (`MOCK_STRUCTURE_PROGRAM`) e la rocca (`scultore-rocca.xml`) scritte a mano come lo Scultore,
  con `--viste` il ritorno; nel laboratorio 3D accanto a fattoria e forte. Il giro su Gemini è T355. **Chi le scrive**: Argon a ogni taglia (T395,
  D58); dall'1/12, su un mondo che va su OpenRouter, Opus 5.5 (11 su 12 a 0,75 $ per riuscita nel giro di T392; `sculptorsOn`, ADR-0205, in `#gemini`).
- **Il lotto di più luoghi** (ADR-0206, T370, contratto 0.8, D53 opzione 1): la **gargantuesca delle strutture** è 25 × 25 × 8 caselle
  (`GARGANTUAN_LOT`, `tilesOf`: 500 × 500 × 160 voxel a 20 per casella, `STRUCTURE_SIDE` 500, `FORM_LIMITS` 40 milioni di celle), la misura del
  forte disegnato a mano dall'autore a 20 voxel per casella (`lab/mjx/models/handmade/forte-handmade.xml`; la sua voce lo vuole a 10, 50 × 50 su
  3 × 3 luoghi, sotto); le altre classi e taglie restano la scala di D&D
  (`scaledTiles`), e così ciò che è venuto prima: una voce che dice la sua densità (`vpt`) e una carta fatta a mano (`boxUnderMaxSide`).
  Non entra in un luogo di 18: sta su un **blocco** di 2 × 2 luoghi (`src/kernel/block.ts`: il luogo in alto a sinistra lo nomina, `BlockMark`),
  nel mezzo, con cinque caselle di anello prima e sei dopo (`blockLot`, `lotIn`). **Chi lo prende**: il piano nuovo di un luogo che chiede una
  gargantuesca e può averla (`rareAllowed`), appena scritto dal Cartografo (`develop` → `claimBlock`): il primo dei quattro blocchi attorno al
  luogo (`blocksAround`) i cui altri tre luoghi sono bozze che nessuno sta pianificando, in nessun blocco, non la partenza, fuori dalle regioni
  del master e nella stessa regione dell'atlante (un ambiente per i quattro), col lotto al più per un quarto d'acqua (`blockFree`) e senza un
  piano salvato. Il piano è segnato (`block`), la sua gargantuesca va prima nelle `structures` (sta sul lotto più grande), la gargantuesca del
  reame è sua (`rari`); gli altri tre luoghi hanno il **piano del kernel** (`blockPlan`: lo stesso nome e lo stesso ambiente, niente cose,
  rune né strutture, il segno del blocco), salvato subito, senza chiamate né carte. Senza un blocco libero niente cambia: la struttura scende alla
  taglia che i suoi lotti ricevono (`claimSizes`). **Dove si ricorda**: il segno nei quattro piani di `maps/` e `world/state.json → blocks`
  (in alto a sinistra → il luogo con la struttura); il registro (`Kernel.blocks`, `blockOfPlace`) li prende tutti e due, e un piano applicato
  vince (`knowBlock`); un luogo del blocco senza piano salvato lo prende da quello con la struttura (`anchorPlan`: in memoria, caricato o dal
  disco), altrimenti dal Cartografo, col segno. **Il layout** di un luogo del blocco (`blockLayout`, `layout(… { reserved, gates, apron })`):
  le caselle sotto il lotto sono **riservate** (il programma dell'ambiente non le scrive, nessun sentiero le attraversa, non sono mai
  raggiungibili, niente vi è posato) e poi tornano terreno (`lotGround`); il varco di un lato fra due luoghi del blocco che cadrebbe sotto il
  lotto va nell'anello (`blockGates`, lo stesso per i due luoghi); le caselle accanto al lotto (anche sul bordo fra due luoghi) si camminano e
  i varchi le raggiungono, così le porte della struttura, da qualunque lato, si aprono su un sentiero (regola 10) e l'anello gira attorno; niente
  del piano vi è posato (`placementsOf`). Il
  lotto è **piano a un livello solo** per i quattro (`blockLevel`: la mediana del rilievo sul lotto, entro due livelli a casella dei bordi
  fuori dal lotto, dal rilievo soltanto), `Chunk.blockLot` con `LotBox.level` per `chunkLevels`, `ChunkView.block` per i client sottili.
  **La struttura** è un lotto del luogo che l'ha chiesta (`structureLots`: dopo i suoi, l'origine `<luogo>#s<n>`), nel mezzo del lotto (mezza
  casella prima dell'angolo dei quattro), girata per il seme del luogo; vive con quel luogo, e i quattro si caricano e si scaricano insieme
  (`updateChunks`). **Una gargantuesca di prima** (10 × 10 caselle, in un luogo solo): la migrazione 0.7 → 0.8 scrive la sua densità nella voce
  (`vpt: 20`), la sua scatola resta 200 (`entryBox`) e il suo luogo la tiene sul suo lotto (`lotTiles` in `claimSizes`). **Il validatore**: una
  struttura che cresce a regole è un insieme di parti a terra, ciò che poggia sul fondo è un corpo solo e staccato è ciò che galleggia
  (`analyse(…, { groundJoins })`, `Validator.modelGrows`, `checkProgram`; `addModel` prova una voce nuova col suo `time` e la sua crescita):
  la fattoria a 20 caselle non cade più per i recinti e i campi. Il prompt dello Scultore: il piano a 1/5 è 100 × 100 celle alla gargantuesca. Le
  misure col forte dell'autore (7,2 s, mesh 77 MB, 197 fps dentro) sono nel banco `lab/banco/taglie/`. Dal T405 la gargantuesca nuova è
  31,25 × 31,25 caselle a 16 voxel per casella, su un blocco di 2 × 2 col lotto di 32 (sotto).
- **Il blocco grande quanto la sua struttura** (ADR-0208, T404, kernel 0.8.2, D60 A e D61 A2): il forte dell'autore è a **10 voxel per
  casella**, la densità della sua voce (`{ class: 'structure', size: 'gargantuan', vpt: 10, time: 30000 }`): 500 × 500 × 148 voxel sono
  50 × 50 × 14,8 caselle, e tutto ciò che il gioco misura sulla forma scala con lei (il gradino `stepOf(10)` = 2 voxel, l'alzata delle sue
  scale; l'impronta, i pavimenti, `habitableParts`, `reachableStoreys`, `formAreas`, la mesh); nel laboratorio 3D parte da 10
  (`HANDMADE_VPT`); nel seme non c'è, entra in un mondo come ogni voce (`addModel`). **Le caselle di una gargantuesca** sono quelle della voce
  che indosserà (`lotTiles` → `Forms.entryTiles`: la scatola del programma se la dice, altrimenti `entryBox`, divise per `vptOf`; una da
  scolpire: `tilesOf`, 25). **Il blocco** ha un lato in luoghi e un lotto in caselle (`BlockMark.side`, `.lot`; 2 e 25 se non li dice):
  `blockShapeFor` fa il lotto grande quanto la struttura (mai sotto i 25 di prima) e il lato il più piccolo da `BLOCK` 2 a `MAX_BLOCK` 3 che
  lo tiene con almeno `RING` 2 caselle d'anello per lato; il forte: 3 × 3 luoghi (54 caselle), lotto di 50, due caselle d'anello. Oltre
  3 × 3 nessun blocco: il registro lo dice («più grande del blocco più grande») e la struttura scende (`claimSizes`). `blocksAround(cx, cy,
  forma)` dà i nove candidati di un 3 × 3 (prima quello dove il luogo è in alto a sinistra) e `claimBlock` salta quelli dove il luogo che
  chiede sarebbe tutto lotto (il luogo di mezzo): le cose, le rune e le persone del suo piano hanno l'anello; gli altri otto hanno il piano
  del kernel, i nove si caricano insieme; `blockOfPlace` cerca fra i blocchi noti. **Con l'anello di due caselle** il varco di un lato fra
  due luoghi del blocco che cade sotto il lotto va sulla casella accanto all'angolo, che è bordo del lotto e si cammina (`blockGates`: fra 2 e
  17 come prima, se lì è tutto lotto fra 1 e 16); il luogo di mezzo è tutto lotto e un lato che il lotto copre tutto tiene il varco sotto il
  lotto; il layout parte dal primo varco fuori dal lotto (`layout`; per i 2 × 2 sempre quello ovest). **Dove si ricorda**: `block: { x, y,
  side?, lot? }` nei piani e `blocks: { "x,y": "ax,ay" | { anchor, side, lot } }` nello stato, i 2 × 2 col lotto di 25 scritti come prima
  (`markOf`, `blockRecord`); `readBlockMark` e `readBlocks` rifiutano un lato fuori da 2-3 o un lotto non sano. **Le misure**: col cammino
  del kernel (`lab/scripts/forte-scala.ts -- --cammina 20,10,5`) a 10 il corpo raggiunge a piedi quattro piani del forte (il suolo, il
  camminatoio a 23 voxel, i piani del mastio a 35 e 59), a 5 solo il suolo; nel browser (`misura-frame.mjs <porta> --blocco <xml> --vpt 10`,
  `lab/banco/riferimento/misure/`) il 3 × 3 si pianifica in 1,9 s, il forte arriva in 11,5 s, 184 fps accanto (il 2 × 2 a 20: 1,4 s, 12,2 s,
  192 fps), i buffer a 200 MB in tutti e due; a piedi il viandante entra dalla porta del mastio e sale la rampa al secondo piano
  (`docs/img/forte-gioco-10-*.jpg`). Le mura di 1,5 viandanti sono il disegno dell'autore: le alza il programma, non il kernel.
- **Le strutture a 16 voxel per casella** (ADR-0209, T405, contratto 0.9, kernel 0.9.0, D61 B2): una struttura che cresce a regole è a
  `STRUCTURE_VPT` (16) voxel per casella con i voxel che aveva a 20 (`structureVoxels`: 100 × 100 × 80 alla Grande, 150 × 150 × 120
  all'Enorme, 500 × 500 × 160 alla Gargantuesca, multipli dei piani a 1/5 e 1/10), così è un quarto più grande accanto al viandante: 6,25,
  9,375 e 31,25 caselle di lato (`tilesOf`), una porta di 30 voxel 1,875 caselle (1,25 viandanti), un piano di 32 da pavimento a pavimento
  1,33 viandanti; il corpo vi sale gradini di 3 voxel (`stepOf(16)`), è largo 7 e ha la testa a 11. **La scelta** (14, 15 e 16 provati
  sulle strutture del banco, `lab/scripts/strutture-scala.ts -- --densita 20,16,15,14`, `lab/banco/riferimento/forte-scala.md` (§ «14, 15 o 16», T405)): a
  tutte e tre il corpo sale ogni piano; 16 tiene la gargantuesca su un blocco di 2 × 2 (lotto di 32, a 15 e 14 vorrebbe 3 × 3) e la Grande
  in un lotto di 7, ed è la densità della locanda Enorme del seme. **`PARTS`** sono i voxel di prima letti a 16 (`partVoxels(16)` = 11 × 30,
  30, 28, 30 × 20): lo Scultore scrive le stesse misure, che ora sono più grandi del viandante, e il prompt lo dice («a tile is always 16
  voxels and a person 24 tall», `bodyLine`). **Le voci**: una della classe `structure` da Grande in su che non dice `vpt` è a 16
  (`vptOf`); `modelSize` non lo scrive, una carta portata lo tiene se c'è (`sized` in `bring.ts`); una che lo dice resta com'era
  (`entryBox`: la scala di D&D alla sua densità); la cantina resta di 20 voxel per casella dichiarata (`cellarVoxels`: 1,25 caselle a 16). **Il lotto** prende a ogni taglia le caselle della voce che la struttura indosserà
  (`lotTiles` → `Forms.entryTiles`): una voce di prima sta dove stava, una nuova vuole un lotto di 7 alla Grande e di 10 all'Enorme, e su uno
  più piccolo scende (`claimSizes`); il prompt del Cartografo chiede edifici di 7 × 7 per una Grande. I timbri del kernel e i programmi
  degli ambienti del seme sono tagliati per le strutture a 16 dal T407 (ADR-0211, § «Geografia»): ogni lotto tiene la sua struttura;
  i piani di prima tengono i timbri di prima. **Gli universi di prima** (la migrazione 0.8 → 0.9, `migrate0_9`): ogni
  voce della classe `structure` da Grande in su senza `vpt` prende `vpt: 20` e tiene scatola e caselle; una gargantuesca senza `vpt` (T370,
  500 voxel a 20) dice anche la scatola nel suo programma (`size`, con la cantina); `models/index.json` smette di seguire il seme
  (riceve solo le voci nuove, `mergeEntries`); ciò che lo Scultore scolpisce dopo è a 16. **Il laboratorio 3D** mostra il banco delle
  taglie e i programmi degli Scultori a 16 (`lab/3d/catalog.ts`) e il comando «voxel per casella» ha il 16.
- **Il riferimento dell'ottima** (ADR-0210, T371, D53): il forte disegnato a mano dall'autore (`lab/mjx/models/handmade/forte-handmade.xml`, 500 × 500 ×
  150 voxel, 50 × 50 caselle a 10 voxel per casella, D61) è il metro della qualità migliore: nessun modello di oggi deve raggiungerlo, è il
  riferimento. Nel banco è **versionato** (`lab/banco/riferimento/ottima/forte-v1.json`: i tratti di tre semi, l'impronta SHA-256 del file, il
  commit; `forte-v1.png` i quattro lati a cartone, `forte-v1-viste.txt` le viste in testo che lo Scultore vedrebbe, `forte-v1-lab3d.png` nel
  laboratorio 3D a 10): una versione nuova del forte si misura con `banco-ottima.ts -- --riferimento --versione v2` e sostituisce i numeri, la
  scala resta (`REFERENCE_VERSION` in `lab/banco/riferimento/ottima.ts`; `lab/tests/ottima.test.ts` controlla che le misure salvate siano del
  forte su disco). **La scala** (`fortTraits`, `SCALE`, `scoreOf`): quattordici tratti letti dai soli voxel, mai dalle lettere della palette
  (così un forte di Gemini, di Claude o a mano si misura allo stesso modo): il cortile e i suoi angoli rientranti (un'unione di rettangoli),
  gli angoli del contorno, le torri sugli angoli convessi, le masse più alte delle mura, l'altezza delle mura e della cima in viandanti, la
  sagoma, i piani raggiunti a piedi dal portone (girato verso il fronte, su qualunque lato stia), i piani in quota, i piani con stanze, le
  merlature come denti del perimetro, le aperture, il mastio lontano dal portone; ogni tratto vale la quota del riferimento che raggiunge (al
  più 1), il voto su 10 è la media; ogni forte degli Scultori (T355, T391, T392, T402) e del banco è nella tabella del README, le taglie degli Scultori alla densità
  della loro voce (`structureVoxels`, `vptOf`: 16 dal T405). **Nel prompt
  delle strutture** il forte è un metro, non un esempio (ADR-0183: un programma nel prompt si copia): la sezione «The measure of done well»
  lo descrive in dieci righe, in voxel (500 × 500, la scatola della gargantuesca, non le sue 50 caselle a 10), entro la misura che il prompt aveva prima (16 023 caratteri dopo il
  T405, `tests/sculptor-structures.test.ts`), coi doppioni
  di ciò che la richiesta già dice tolti. Il forte misura la **ricchezza** (più volumi, piani, vie dentro), **mai la forma** (T434): merli e
  feritoie solo su una fortificazione. Chi lo è lo dice la richiesta (`SculptRequest.fortified`; la rigenerazione la mette quando il concetto
  che il mondo indossa lo dice) o il nome (`isFortified` in `src/mj/classes.ts`: forte, castello, rocca, mastio, bastione, cittadella, mura,
  torre di guardia, `fortificat…`, in italiano e in inglese; una torre da sola no, né una caserma che non si dice fortificata); solo a lei la
  richiesta elenca `part-battlements` e `part-slits` (`FORT_PARTS`, `partResources(files, fortified)`) e dice che le appartengono, a ogni altra
  dice che non ne ha e che le sue cime piatte finiscono in un cornicione, un parapetto pieno, una ringhiera, un lucernario o una cupola
  (`UNFORTIFIED_LINE`). Trovato da T153: con l'elenco intero e il forte come forma, cattedrali, bistrot, laboratori e stazioni avevano i merli.
- **Gli interni, la parte del kernel** (ADR-0212, T409; il progetto in `docs/design/scenografo.md`): un edificio che cresce a regole cambia
  a ogni seme, e il suo interno lo scrive lo Scenografo sull'edificio fatto (i suoi task sono il § 10.2-10.3). Il kernel dà il pavimento,
  in `src/kernel/interior.ts`: il piano (`interiorPlan`) sullo strato dei piedi di ogni piano raggiunto (`walkIn`, `storeysOf`), il
  pavimento libero solo sotto un tetto, il protetto (porta e strada dritta, piedi e teste delle scale, anche quelle piene sotto le pedate dai
  centri accanto alla prima, T419, ciò che non è di una stanza, le stanze
  sotto 0,6 caselle², i piani sotto `SMALL_STOREY` 2 caselle²), il posto degli animali (le aree che li nominano, `ANIMAL_AREAS`); il palco
  (`stageGrid`: `W` l'edificio, `F` libero, `C` cantina, `P` protetto, `A` animali), l'unica cosa che un programma di secondo stadio
  legge; la guardia (`InteriorGuard`) che tiene un pezzo solo se non scrive sull'edificio né sugli animali, lascia la cantina che regge
  come il terreno del kernel la misura (`groundOfForm` tiene il buco; prima di T419 ogni colonna sotto il suolo doveva arrivare al
  soffitto, ADR-0215), lascia la stanza dello Scultore (`partErrors`) e non toglie a nessun posto raggiunto prima la via dalla porta: il cammino del
  kernel senza i salti, coi passi vicino al pezzo riprovati sul terreno rifatto (`groundOfForm`, `rampBlocks`); `furnishFromStage` porta
  nell'edificio ciò che il programma ha scritto, pezzo per pezzo. Un edificio arredato sta nella cache delle forme con la chiave
  dell'interno (`interiorKey`, `furnishedResult`: la via, il testo, il seme dell'arredo, poi la `formKey` dell'edificio).
- **Lo Scenografo, la via dei dati** (ADR-0214, T410; § 10.2 di `docs/design/scenografo.md`): l'agente `scenographer` (lo Scenografo,
  nella casa dell'Artista, `prompts/agents/scenographer.md`) sceglie **una volta per tipo di edificio** quali mobili della libreria vanno in
  quale stanza e quanti: il compito `interior.design` (`src/kernel/agents/scenographer.ts`, `designInterior`) riceve ciò che il kernel misura
  dell'edificio nudo ai semi 1 e 2 (`describeBuilding`: piani, porta, parti abitabili, stanze col tipo `hall`/`room`/`small`, l'area sotto, il
  soffitto, il riquadro; le aree del suolo; gli animali), mai il programma, e nelle istruzioni il catalogo (la classe `furniture` indossata ora,
  mai la corona, `Forms.furniture`, con la misura in caselle a cui il kernel la posa); risponde con regole `{ storey?, area?, room?,
  furniture[], count }` (lo schema elenca gli id), che tornano una volta col motivo se nessuna è usabile. Le regole stanno sulla voce
  dell'edificio in `models/index.json` (`interior: { rules, author }`, `Kernel.setInterior`, un commit del Concilio senza carta: l'interno è
  della carta dell'edificio), lette senza fidarsi (`readInterior`). **La posa** è del kernel, `src/kernel/furnish.ts`: le stanze dei piani
  sopra il suolo (`interiorRooms`), la prima regola che corrisponde, un pezzo alla volta a caso fra i suoi id, girato, sul pavimento libero
  contro un muro, mai sugli animali né oltre metà dei centri della stanza, prima un filtro (i centri del piano restano in tanti pezzi quanti
  prima) e poi **la guardia** (al più 4 rifiuti per pezzo; 0,75-1,2 s per edificio); i mobili (`pieceOf`) col primo seme, ritagliati e
  ricampionati alla densità dell'edificio, tenuti dal processo (`furniturePiece`); i loro colori una lettera per aspetto, mai oltre 255; un
  pezzo non va oltre l'edificio sopra di lui. Alla fine **i piani del cammino del kernel** (`storeysOf(walkIn)`, i salti compresi, che la
  guardia non cammina): se l'arredo ne toglie uno, il primo pezzo con cui si perde se ne va, trovato dimezzando, al più 12 cammini
  (`FURNISH_CAPS.walks`, T419). **La cantina** (ADR-0215, T419) è una stanza di tipo `cellar` (il piano -1, dopo le altre) che arreda solo
  una regola che la nomina; lì i posti provati hanno la schiena del pezzo a contatto del muro, il pezzo è portato al soffitto (`toHeight`:
  tagliato se più alto, stirato se gli manca un gradino) e reso tale che la cantina lo regga (`cellarSafe`: ogni cima che il terreno del
  kernel conterebbe come un pavimento nessuno raggiunge si riempie fino a ciò che ha sopra, e il pavimento chiuso dentro il pezzo; oltre
  `CELLAR_GROWTH` il pezzo lì non va), non va sotto un soffitto che l'edificio percorso non ha (la soglia di una porta, una botola: la guardia lo misura con le porte aperte, T429), non entra in un altro, e la guardia lo tiene solo se la cantina regge ancora (`cellar`). I mobili della
  cantina del seme sono `cellar-shelf` e `cellar-rack` (Grande, dello Scultore, `lab/scripts/mobili-cantina.ts`); il banco è
  `lab/scripts/scenografo-cantina.ts`. **Un edificio con l'interno è una forma**: `Forms.request` gli dà `interior` (regole, programmi dei mobili, seme, cantina),
  `runForm` lo arreda (il worker, `InlineRunner`, `TurnRunner`), la chiave è quella dell'interno; `Forms.get` è l'arredato, `Forms.bare` il
  nudo, `Forms.ready` il nudo finché l'arredato non è pronto, un arredato che fallisce è il nudo. **Il direttore** (`InteriorDirector`,
  `kernel.furnishing`) chiede ogni pochi secondi, un tipo alla volta, l'interno dei modelli propri delle strutture caricate che crescono a
  regole e non ne hanno (mai il generico della classe; un edificio senza stanze da arredare non si chiede), entro la manopola `interiors` e 16
  per sessione; non da sé coi modelli locali (offline lo si chiama a mano: la console, `tests/scenografo.test.ts`), e un interno dei modelli
  locali (`author: offline`) si richiede quando non lo sono. Compito comune, lento quanto basta per la coda degli abbonamenti, con il passo
  `interno:<modello>` della generazione differita. Le case del borgo del seme portano la casa generica `structure` (1,7 caselle² a terra):
  restano nude.
- **La casa che usa la Grande** (ADR-0213, T413): un'abitazione che cresce a regole dà alla casa il pavimento della sua taglia, non un
  corpo di 35-45 voxel in un giardino. Chi lo è lo dice la richiesta (`SculptRequest.dwelling`: le case comuni del mondo) o il concetto
  (`isDwelling` in `src/mj/classes.ts`, le parole di una casa e nessuna di un forte, una torre, un tempio, in italiano e in inglese). Il
  kernel misura il pavimento coperto di ogni piano in stanze (`storeyFloors` in `interior.ts`, sul cammino di `habitablePartsOf`: i centri
  del corpo con qualcosa sopra, tagliati a `NARROW` da `roomsOf`, la misura `stanzeDi` del banco dello Scenografo); i controlli dello
  Scultore (`checkProgram(…, { dwelling })`, `dwellingErrors` in `src/mj/check.ts`) vogliono `DWELLING`: 10 caselle² al piano terra e a un
  altro piano, il piano terra in 2 stanze di 1,5 caselle² o più. La richiesta lo dice (`DWELLING_LINE`), il prompt delle strutture dà il corpo
  di un'abitazione (6 celle dietro il centro, 6 davanti, 7 per lato), il muro interno e la sua porta; la villetta offline è un'abitazione
  che passa, anche con la cantina (T420: i controlli vogliono insieme la casa e la cantina di T417, `CheckOptions`; `storeyFloors` non
  conta la cantina come piano, come `reachableStoreys`).

<a id="taglie"></a>
## Le taglie

- **Le taglie** (ADR-0092, T54): le taglie di D&D (`SIZE_TIERS` in `src/mj/classes.ts`: minuscola, piccola, media, grande, enorme,
  gargantuesca, la massima), la stessa scala per creature e strutture: la classe dà la forma e la scatola della sua taglia solita
  (`AssetClass.taglia`), la taglia la scala (`tilesOf`, `boxOf(cls, taglia)`, più rada oltre 120 voxel, `densityOf`); la classe `structure`
  da Grande in su ha i voxel della scala a 20 a 16 voxel per casella (`structureVoxels`, `STRUCTURE_VPT`, ADR-0209: Grande 6,25, Enorme
  9,375, Gargantuesca 31,25 caselle). `appearance.size`,
  `structures[].size` del Cartografo, `struttura.taglia`, `SculptRequest.taglia`, `ModelInfo.size`/`vpt` (`modelSize`). Rare: una
  **Enorme** (il castello «importante» di prima) per zona di 56 × 56 luoghi (`zoneOf`), una **Gargantuesca** per **reame** di 4 × 4 zone
  (`realmOf`), una per luogo, con il modello migliore dello Scultore, la struttura sul lotto di un blocco di più luoghi (ADR-0206, ADR-0208, `#lotti`); `claimSizes` le adatta al lotto e alla rarità (`rareAllowed`),
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
- **Al tocco** (T387): nella scheda, `PointerEvent` con `pointerType: 'touch'` sulla scena (`#world`) o sulla levetta (`#touch .stick`)
  dalla console, i pulsanti con `.click()`; la pagina non si apre in un iframe (`frame-ancestors 'none'`) e la finestra massimizzata non si
  stringe, quindi la disposizione a 844 × 390 si guarda in un Chrome headless con `Emulation.setDeviceMetricsOverride` (`mobile: true`),
  `Emulation.setTouchEmulationEnabled` e tocchi veri (`Input.dispatchTouchEvent`), con l'aiuto di `tools/vesti/cdp.mjs`. Sul telefono vero:
  `npx vite preview --host --port <n> --strictPort` e, dal telefono sulla stessa rete, `http://<ip del computer>:<n>/?skip`.
- **Alla fine**: chiudi la scheda e ferma la preview.

<a id="costi"></a>
## Costi e prestazioni

- **Registro dei consumi** (ADR-0039): ogni chiamata passa da `kernel.usage` (per giorno, modello e compito, in token e
  dollari, cache e ragionamento compresi) e va in `world/usage.json` con ogni commit; il costo è nel pannello del
  Concilio (`G`). `GeminiAiModels` non ripete mai una richiesta scaduta (può essere stata pagata); ripete solo 429/5xx.

- Testo per mondo: Genesi ~60 chiamate; poi 1 per luogo, 1-2 per individuo, ~4 per pacchetto di oggetti.
- Niente immagini (step 9): il costo dell'aspetto è testo, un programma per tipo (vedi il report 8.2B, sezione 4).
- Tick ≈ 5 ms in Node con ~100 entità (`sys.wander` il più costoso); budget di istruzioni Lua ~1.5×.
- **Dove va il tempo** (T331, [`docs/design/gpu.md`](design/gpu.md)): nel browser il frame sta in 5-8 ms su 16,7 (tick 2,6-3,5 ms, di cui Lua il 60 %; disegno 2,3-3,9 ms; GPU 2-4 ms su una RTX 2070), l'acqua non costa; nei worker l'83 % del tempo di un modello è la mesh (`meshVoxels`), non il programma, e gli edifici della corona sono i lavori più lunghi del caricamento. MarkovJunior su WebGPU non conviene ora. Si rimisura con `lab/scripts/misura-frame.mjs` e `lab/scripts/misura-mj.ts`.
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
