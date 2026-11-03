# Architettura nel dettaglio — QUINE42

> Il riferimento dei sottosistemi: si legge la sezione che serve quando un task tocca quell'area. Il nucleo, con le **regole inviolabili**,
> è [`AGENTS.md`](../AGENTS.md), che vince in caso di dubbio e rimanda qui dal suo «Indice architettura del gioco e sottosistemi». Perché è
> diviso: [ADR-0120](adr/0120-agents-nucleo-e-dettagli.md). I percorsi qui sotto sono relativi alla radice del repository.

## Indice

| Argomento | File sorgente |
|---|---|
| [Stack e persistenza](#stack) | `package.json`, `server/universeStore.ts` |
| [Il sito e il tema](#sito) | `site/`, `src/theme.css`, `docs/design/sito/` |
| [Lua: confine e limiti](#lua-sandbox) | `src/kernel/sandbox.ts`, `src/kernel/prelude.lua`, `src/mj/run.ts` |
| [Gemini, l'Attore, i coefficienti di generazione](#gemini) | `universe/universe.json`, `src/kernel/ai/`, `src/kernel/coefficients.ts` |
| [La lobby multigiocatore](#lobby) | `src/ui/lobby.ts`, `src/ui/creditdialog.ts` |
| [La coda della CLI degli abbonamenti](#abbonamenti) | `src/kernel/ai/subscription.ts`, `server/subscriptionQueue.ts`, `tools/abbonamenti/servi.ts` |
| [Il Concilio al lavoro: registro, Luogo, Fucina, Genesi](#concilio) | `src/kernel/agents/`, `src/kernel/layout.ts` |
| [Spazi, rune, magia, borse](#spazi-rune-magia) | `src/kernel/kernel.ts`, `src/kernel/runes.ts`, `src/kernel/magic.ts`, `src/kernel/inventory.ts` |
| [Il lessico](#lessico) | `world/lessico.md`, `src/kernel/fourthwall.ts` |
| [Regole, effetti, stati, morte, menu, salto, contenuti](#regole-effetti) | `src/kernel/kernel.ts`, `src/kernel/content.ts`, `src/kernel/validator.ts`, `universe/modules/` |
| [Società, NPC, personaggi](#societa) | `src/kernel/society.ts`, `src/kernel/plots.ts`, `src/kernel/agents/minds.ts` |
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
| [Il rilievo](#rilievo) | `src/kernel/relief.ts` |
| [L'acqua che scorre](#acqua) | `src/kernel/water.ts` |
| [Lotti e strutture, scale e piani](#lotti) | `src/kernel/layout.ts`, `src/kernel/forms.ts` |
| [Le taglie](#taglie) | `src/mj/classes.ts` |
| [Il grafo del mondo](#grafo) | `src/kernel/graph.ts`, `world/grafo.json` |
| [Convalida nel browser (senza tentativi)](#convalida-browser) | `src/main.ts`, `src/kernel/corona.ts` |
| [Costi e prestazioni](#costi) | `src/kernel/ai/usage.ts`, `src/kernel/ai/prices.ts` |
| [Stato e prossimi passi](#stato) | `docs/plans/backlog.md` |

<a id="stack"></a>
## Stack e persistenza

- **Vite 7 + TypeScript 5** (strict; Vitest 4, ADR-0100), **three.js** per il mondo (ADR-0040) e per le pagine out-game (ADR-0095), DOM per HUD/pannelli, uno strato 2D sopra per i testi.
- **Vitest** in Node con modelli offline (`MockAiModels`): kernel, Concilio e layout testabili headless.
- Persistenza: repository git dell'universo su disco tramite il server di Vite (`server/universeStore.ts`):
  testi, `maps/` (piani dei luoghi), `world/stato.json` (lo stato del mondo), `world/giocatori/` (i viandanti), `world/consumi.json` (i consumi); saldi e pagamenti fuori dal repository, in `universes/.saldi/` (ADR-0104). Senza server:
  `localStorage` + IndexedDB. I commit vanno al disco in fila (`UniverseClient`, ADR-0122): senza risposta dal server il commit resta primo in fila e ritenta (tre volte subito, poi a ogni commit nuovo e ogni 30 s), un 5xx ritenta tre volte e cede il passo, un rifiuto (4xx) si scarta con un avviso; `checkout`, `clone`, `branch` e `merge` non passano sopra un commit in attesa.

<a id="sito"></a>
## Il sito e il tema

- **Il sito e il tema** (ADR-0095, T97): pop art a fumetti, retro arcade, neon punk e retrowave; variabili CSS unificate in `src/theme.css` per sito e gioco; pagine Vite in `site/` senza framework pesanti; three.js fuori dal gioco (hero canvas, profilo) e carte collezionabili in CSS 3D; il segreto dei gerboa nel footer; lo stile delle pagine è quello del template `docs/design/sito/` (T109), `site/site.css` lo copia; la landing (`site/landing.ts`, T101) fa crescere nell'hero programmi MarkovJunior veri con `src/mj/`; la galleria delle carte (`site/carte.html`, `carte.ts`, T104) legge lo snapshot di `/api/universe/<nome>` con `allCards(files, true)` e `receivedBy`, la rarità è derivata dagli utilizzi (`rarityOf`), le miniature sono foto dei modelli (`photo.ts`) fatte in un worker, senza WebGL. il profilo (`site/profilo.ts`, T102) entra con `signIn`, legge e salva il viandante di un universo da `/api/viandante` (`kernel.keepProfile` o i file su disco) e mostra il modello vero in three.js; i crediti (`site/pagamenti.ts`, T105) dicono saldo, ricariche e consumi del viandante in un universo da `/api/crediti` e avviano Stripe Checkout; `site/shared.ts` è ciò che le pagine con un account hanno in comune. Le interfacce in gioco (T106) leggono gli stessi token: `src/style.css` dà i suoi nomi (`--gold`, `--panel`…) alla palette di `theme.css` e costruisce le finestre con inchiostro, ombra rigida e mezze tinte (`--window-veil` le attenua dietro il testo), le battute sono fumetti, gli avvisi usano il carattere display; `tests/theme.test.ts` rifiuta un token che non esiste.

<a id="lua-sandbox"></a>
## Lua: confine e limiti

- **Lua 5.4 via wasmoon** (WebAssembly), sandbox gestita dal kernel. Il confine (ADR-0101, T122): il proxy di wasmoon è spento e tutto passa da `Crossing` (`sandbox.ts`): a Lua arriva una vista dei soli campi di dati propri di un oggetto (niente prototipi, metodi, chiamate), a JS solo dati (niente funzioni Lua, cicli, nomi di `Object.prototype`; al più 64 livelli). La prova di caricamento (`Sandbox.probe`) gira in una VM a parte con un `Host` vuoto. I limiti (ADR-0105, T126): 2 milioni di istruzioni per chiamata e 12 per tick (`tickBegin`, `tickEnd`: chi viene dopo salta il tick, il guasto è `tick:budget`, `core.*` gira comunque), il lavoro delle funzioni C addebitato, i pattern costosi nel matcher scritto in Lua del prelude, memoria (64 MB), stringhe (1 MiB) e byte allocati nell'allocatore (`Meter`), 2 s di rete per chiamata; i modelli del gioco con `FORM_LIMITS`, `MAX_FORM_TIME`, `MAX_FORM_XML` (`src/mj/run.ts`).

<a id="gemini"></a>
## Gemini, l'Attore, i coefficienti di generazione

- **Google Gemini**: `gemini-3.1-flash-lite` (testo), in
  `universe/universe.json → ai` con i budget (`maxText`, `maxForges`, `maxPacks`, `maxCast`; in multigiocatore `placesPerMinute`),
  il ragionamento (`thinking`, `low`) e il tempo massimo (`timeout`). Prezzi in `src/kernel/ai/prices.ts` (con la data).
  **L'Attore** (`ai.attore`, ADR-0116, T157): spento se non detto, e allora nulla cambia; acceso (un booleano, il nome di un modello o `{acceso, modello}`,
  `repairActor`), il Narratore scrive la scheda di ogni individuo alla sua prima battuta (`npc.sheet`, `Individual.scheda`, riscritta solo se cambiano legami o
  storia, `sheetFingerprint`) e l'agente `attore` recita `npc.reply` e `npc.dialogue` con il suo modello (`ACTOR_MODEL`, `gemini-3.8-flash`): stessi compiti,
  paganti, limiti e modelli locali; si sceglie nella Genesi, nella lobby (solo il master: messaggio `attore`) o nell'editor; `kernel.interpreter()` dice chi recita.
  I **coefficienti di generazione** (`ai.coefficienti`, ADR-0085, T45b, `src/kernel/coefficients.ts`): quanto spesso ogni agente chiama l'IA,
  da 0 a 1, riparati dal validatore; diretti (`sessioni dialoghi trame revisioni modelli`: ritmi allungati) e indiretti (`persone abitanti
  pacchetti cose`: meno di ciò che causa le chiamate); il censimento delle chiamate in `CENSUS`, il preset «Low Detail» (`LOW_DETAIL`, anche
  lo Scultore su Flash-Lite), la stima di un'ora di gioco (`hourlyEstimate`); nella Genesi si scelgono con i modelli (`kernel.setAi`).

<a id="lobby"></a>
## La lobby multigiocatore

  La **lobby multigiocatore** (ADR-0086, T45d): mostra modelli, coefficienti del master, minimi (`ai.minimi`), tetto crediti che incrementa i budget (`addBudgetFromCap`); a crediti esauriti o al tetto, tre scelte (ricarica, offline, abbandona); la collezione carte fuori dalla partita con utilizzi.

<a id="abbonamenti"></a>
## La coda della CLI degli abbonamenti

  Gli abbonamenti (ADR-0077, T68; blindati da ADR-0106): `ai.provider` (`api` predefinito, `claude`; Antigravity non può escludere gli strumenti e non sta sulla coda) e `ai.agenti` (agente → provider)
  mandano i compiti lenti (Genesi, Fucina, modelli dello Scultore, sessioni del Concilio, meccaniche) alla coda `/api/coda`, servita
  da un processo che usa la CLI dell'abbonamento di chi gioca; il resto resta sulle API. Solo in locale, mai sul server del multigiocatore. La route c'è solo con `QUINE_CODA=1` nel `.env`, da loopback, con un segreto che vive nel server; la CLI gira in una cartella vuota, con l'ambiente ridotto, senza strumenti, MCP, hook e impostazioni, il testo su stdin, e ogni esecuzione deve confermarlo dal suo `init` (`IsolationCheck` in `tools/abbonamenti/servi.ts`) o viene uccisa.

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
`terreno`, rune su tratti liberi. Il chunk (0,0) ha sempre `x`, `speed = speed` e la runa magica `luce`.
**Fucina**: concetto (tipo, contesto, aspetto, comandi, azioni, contenitore, cose portate, persona,
unicità) → fisica → codice → Arbitro → validatore → commit → bibbia; il modello (`appearance.model` suo, con la `classe`) lo scrive poi lo Scultore; gli oggetti dei pacchetti
hanno una forma comune (`forma-…`, un programma per forma, ricolorato), i terreni con cose sopra un modello loro. **Genesi**: bibbia → stile → terreni (Fisico) → Arbitro → ambienti (provati) →
pacchetto di oggetti → cast (5 npc diversi, 5 oggetti/mobili, 2 strumenti) → commit.

<a id="spazi-rune-magia"></a>
## Spazi, rune, magia, borse

- **Spazi, tappeto, corona** (ADR-0004, 0009, 0063): cerchio di simulazione di raggio 42 fermo in (0,0) (42 passi per uscire fermando il tappeto), tappeto con offset; `coronaRevealed()`.
- **Rune** (ADR-0002, 0015): un token per runa, una casella per runa (una lastra luminosa a terra), righe orizzontali eseguite ogni
  tick; binding `x y speed carpet time`. Rare; quelle del tappeto solo a ≥ 3 chunk dall'origine. Il **canone delle rune**
  (`world/canone.md`: aspetto, dove stanno, restano finché qualcuno non le raccoglie, magia, ciò che nessuno sa), con le rune
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

- **Il lessico** (ADR-0075, T65): `world/lessico.md` (seme, uguale in ogni universo e ambientazione): poche parole sostituite
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
- **Giorno e notte** (ADR-0015): `daylight()`, giornata di 10 minuti; luce dai componenti `luce`.
- **Stati e meccaniche** (ADR-0026): effetti `stato`/`togli_stato` (velocità, peso, luce, durata) per ciò che
  si usa (cavallo, barca, zaino); componente `stati` del viandante.
- **Morte e trascendenza** (ADR-0026): a salute zero la sessione finisce (continua nello stesso universo o
  ricomincia dal seme); dopo la corona non si muore e non si perde nulla.
- **Menu delle caselle** (ADR-0029): `E`/clic destro su una casella → azioni dell'entità, della casella, «Altro…»;
  le azioni libere ripetibili si imparano per tipo di terreno (`TerrainDef.actions`). Le `<action>` del modello di una
  cosa sono voci del suo menu (`modello:<nome>`), anche quelle nate da «Altro…» (ADR-0044).
- **Il salto** (ADR-0080, T56b): Spazio (`kernel.jump()`) nella simulazione: verso dove si cammina o si guarda, sopra ciò che non va più in alto di `JUMP_UP` (1,05 caselle, `topUnder` sui `Form.levels`) e sopra l'acqua, mai sopra muri, rocce o caselle solide del terreno; atterra nel primo punto da 1 a `JUMP_FAR` (2,6) caselle dove il corpo sta, altrimenti salto sul posto. Con i piani (T70) si salta dal pavimento su cui si sta (`pos.z`), conta il pieno che comincia sotto `JUMP_UP` (non il soffitto) e si atterra sul pavimento più alto che si supera (`floorBelow`). Componente `salto` del viandante portato da `jumpTick` dopo i sistemi; `kernel.jumping()` per arco e ombra. Nella corona, nello studio e nel kernel specchio Spazio fa ciò che fa `E`.
- **Contenuti** (ADR-0012): `ItemDef` in pacchetti; bottino per tag; contenitori; ricette; bisogni
  (`needs` sul giocatore, `sys.needs`); uso generico in `core.items`; menu azioni (`E`).

<a id="societa"></a>
## Società, NPC, personaggi

- **Società** (ADR-0020): `world/people.json`; individui con specie (`persona | animale`, dal tipo) e genere,
  mestiere, famiglia, routine (mattina/giorno/sera/notte → casa/lavoro/piazza/in giro, componente `meta` seguito
  da `sys.wander`). Un legame dice cosa è l'individuo per l'altro, nel suo genere; il validatore della società
  (`repairSociety` in `society.ts`) lo rende possibile per le due specie e simmetrico, un padrone per animale,
  nomi non simili (rinomina anche nelle trame); ripara a ogni aggiunta e all'avvio (`reviewSociety`).
- **Vita degli NPC** (ADR-0024): attività visibili (`attivita {tipo, ferma}`), dialoghi tra individui,
  ricordi pesati, legami col viandante e figli (effetti `legame ricordo nascita`), trame e missioni
  (`world/plots.json`, diario nell'HUD). Ogni trama passa dal validatore (`reviewPlot` in `plots.ts`): individui che
  esistono, animali da animali, legami del registro, rune del canone, niente quarta parete; ciò che non torna va al
  Narratore con il motivo, all'avvio `reviewPlots` ripara o ritira le trame aperte.
- **Personaggi** (ADR-0010, 0013, 0017, 0020): tipo + individuo (`identity`: anche `job family routine story`), `mind` (memoria, umore, modo), azioni
  `segui resta vaga dai nessuna`, oggetti citati → `wanted`. Al massimo 2 dello stesso tipo nel mondo
  caricato; nuovi tipi forgiati esplorando (`ai.maxCast`); ogni individuo è un seme del programma del suo tipo (pochi semi per classe).

<a id="corona"></a>
## La corona e gli interni dello studio

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
- **Sala del Concilio e studi** (ADR-0027): tavolo rotondo con l'universo che gira, gli otto membri seduti (con lo Scultore),
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

- **La partita** (ADR-0053, T33): `universe.json → partita` (`modalita`, `morte` 0-4, `pvp`, `altroTraGiocatori`; predefiniti:
  singola, 3, no, sì) si sceglie nella schermata della Genesi di un universo mai generato e poi non cambia: `repairGameSetup` (validatore)
  la ripara, `keepGame` riscrive un `universe.json` che dice altro. Va come principio (`gameSummary`) a Narratore, Arbitro, Ingegnere
  e Referente. Alla morte il Narratore (`player.death`) traduce il livello (`DEATH_LEVELS`) in cosa si perde (`perde_tutto` o effetti
  che tolgono) e dove si riparte (`qui | piazza`); `continueAfterDeath` è asincrona; senza risposta vale `fallbackDeath`.
- **I viandanti** (ADR-0054, T34): ogni viandante ha un id stabile (`io` in singola, `src/kernel/wanderers.ts`) e il suo stato
  in `world/giocatori/<id>.json` (da uno `stato.json` vecchio per `io`); `world/stato.json` è lo stato del mondo. Il kernel ha un
  registro (`wanderers()`, `addWanderer`); ciò che agisce su «il giocatore» agisce sul viandante che agisce (`wanderer()`), e
  `as(id, fn)`, sincrono (mai attraverso un `await`), fa agire un altro. Legami e ricordi portano `viandante: <id>` (`readPeople`
  migra «Viandante» e `legameViandante` a `io`; `bondWith`, `bondOf`, `memoriesFor`: un individuo non racconta a un viandante ciò che ha
  vissuto con un altro), le missioni `Quest.viandante`; `talk(id, testo, viandante?)` dà al Narratore il nome di chi parla; nel grafo
  `persona:viandante` è `io`, `persona:viandante-<id>` gli altri.
- **Rune per ruolo** (ADR-0057, T37): `partita.master` è chi ha creato l'universo multigiocatore (`io` per ora); in singola chi gioca
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
  pacchetti; il resto è del viandante che agisce), un `chi` esplicito vince; `world/consumi.json → paganti`. Ogni contenuto generato
  porta `carta {autore, pagante, titolare}` (moduli, oggetti, ambienti, incantesimi, ricette, modelli, individui, trame, regole giudicate,
  piani dei luoghi): i punti che creano contenuti committano con `commitContent`, che timbra ciò che il cambio porta (`stampFiles`); il
  titolare delle comuni è un viandante estratto col seme (`cardHolderOf`). Gli utilizzi (`luoghi trame prompt`) e le carte dei luoghi in
  `world/carte.json` (`CardUses`, scritto prima di ogni commit); la collezione: `kernel.cardsOf(id)`, `collectionOf`.
- **Crediti e spese comuni** (ADR-0081, T45a, ADR-0104, T125): saldo crediti per viandante nel `Ledger` del kernel (`kernel.ledger`; sul server `universes/.saldi/<nome>.json`, fuori dalla storia; `kernel.creditsOf`, `deductCredits`); ricaricato a mano solo dal master, dalla console (`grantCredits`, messaggio `ricarica`), entro il tetto al giorno per universo (`QUINE_TETTO_RICARICHE`); il Referente non dà crediti. Ogni chiamata scala dal pagante (`payerOf`) costo modello + 1% piattaforma (`PLATFORM_FEE = 0.01`, `costWithFee`); le spese comuni (`comune`) sono divise in parti uguali tra tutti i giocatori collegati in quel momento (`splitCost`), master compreso, escludendo gli anonimi. A crediti esauriti (`crediti <= 0`) o per viandanti anonimi (`anonimo: true`, 0 crediti non ricaricabili): le richieste personali sono risposte dai modelli locali (`MockAiModels`) e il giocatore lo sa (`stato.crediti` nell'aggiornamento, avviso nel feed).

<a id="multigiocatore"></a>
## Il multigiocatore: server, client, ramo del master, tra viandanti

- **Il kernel sul server** (ADR-0058, T38): ogni viandante ha il suo tappeto (`as` scambia anche lo scorrimento, `holdCarpet`);
  `core.movement` e `core.carpet` (`PER_WANDERER`) girano una volta per viandante mosso dal kernel e vedono solo lui; la tastiera
  muove `inputFor` (`io`); chunk, ritmo, frase e stati di ogni viandante. Un viandante di un client (`setRemote`) non lo muove il
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
  fumetti. Il passo è predetto e mandato ogni 50 ms, la `correzione` lo rimette a posto, oltre 8 caselle il client segue il server
  (`FAR` sul server). Le azioni (`interact perform freeAction talk inscribePhrase dropSelected castSpell action`) vanno al server
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
  `files.ts`, a elenco di campi, ADR-0109: `universe.json` senza `ai`, `models/`, rilievo, atlante, manifest senza storie né `logic` tranne `PER_WANDERER`); prompt, bibbia,
  individui, trame, regole, grafo, carte, consumi e viandanti restano sul server. L'`ingresso` dice `master`; il registro del Concilio
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
  messaggio `altro {viandante, testo}`, entro `GIVE_REACH`), giudicato come su un individuo (`ActionContext.between`); il server applica gli effetti
  sul suo corpo (`touchWanderer`: bisogni, scudo, stati come lui; `spingi` sul suo tappeto, `wanderer:pushed` azzera il suo credito di passo); ciò che
  ferisce (`unharmed`: bisogni che scendono, `spingi`, `fuoco`, `togli_stato`, stati che rallentano) solo con `partita.pvp`; sul master solo `messaggio`.
  Chi lo subisce lo sa (`wanderer:acted` → avviso `altro`).
- **Il profilo del viandante** (ADR-0074, T44a): `Profile {nome, seme, tinta, presentazione}` in `world/giocatori/<id>.json`; `repairProfile`
  (`wanderers.ts`) lo ripara (nome di 2-24 caratteri e non simile a individui o viandanti, altrimenti `freshName`; seme tra quelli della classe;
  mantello né scuro né chiaro né grigio; 4 righe) e `kernel.setProfile` lo fa nome e aspetto (`dressWanderer`). `entra {profilo}` e `profilo`
  nel protocollo, l'`ingresso`/`esito` dicono il profilo riparato e `riparato`; agli altri con `OtherView` (+ `presentazione`, «Chi è» nel
  menu). Il Narratore riceve la presentazione come affermazione del viandante. Il client lo tiene in `localStorage` sotto `rune:profilo:<universo>:<id>` (T44c); un profilo già salvato sul server non lo
  sostituisce quello che il client porta entrando, solo il messaggio `profilo`. `P` apre il pannello
  (`src/ui/profile.ts`, una foto del modello per seme).
- **Morte e ricollegamento in multigiocatore** (ADR-0076, T43c): a salute zero un giocatore (mai il master: `mortalDies`) muore sul server con la
  punizione della partita (`continueAfterDeath(id, cause)` concatenata da `die` come lui, senza alzare `dead` né fermare gli altri; `wanderer:died` →
  avviso `morte` con `perso` e `dove`, il client mostra la schermata della morte, `ui:died`, e riparte dove il verdetto dice). `world/giocatori/<id>.json` salva anche `pos {x, y}`: chi esce e rientra ritrova
  posizione, inventario, frase, stati, carte e legami.
- **Il master in god mode** (ADR-0065, T42a): in multigiocatore il master (`partita.master`, fisso come la partita) è un dio
  (`godMode`): dopo i sistemi di ogni tick `keepGods` gli rimette i bisogni pieni (non il mana), la morte annunciata da Lua passa da
  `spareGods` (muore solo un giocatore), `applyEffects` sul suo corpo da parte di un altro lascia passare solo `messaggio`. Gli altri
  lo vedono solo nel mondo (`inWorld`: sul suo tappeto, dentro il cerchio, non in un interno); uscito con la runa del Concilio è `partiti`.
- **I giocatori dalla corona** (ADR-0067, T42c): al master il server manda l'elenco dei giocatori collegati (`giocatori`, solo a lui);
  `kernel.players()` (lo specchio: `kernel.connected`; il server: il registro) li mette nel tavolo della situazione (operazioni `giocatore`,
  viola, con «Segui» nel pannello) e nell'atlante. `segui {id}` fa mandare al master ciò che è attorno al giocatore (`Client.watch`);
  `kernel.follow`, `watching`, `watched()`: il renderer (`Renderer.offset()`) mette il giocatore al centro, nasconde corona e viandante
  del master, che resta nello studio; Esc o «Torna» sull'insegna (`#watch`, `master.ts`) la lasciano.

<a id="account"></a>
## L'account Firebase

- **L'account** (ADR-0082, T44b): in multigiocatore, se il server ha `FIREBASE_PROJECT_ID` nel `.env`, si entra con Firebase Auth
  (Google o anonimo; `src/session/login.ts`, Firebase caricato con `import()`, le impostazioni web da `GET /api/account`): l'ID token va
  nell'`entra`, il server lo verifica (`firebase-admin` in `server/account.ts`, `SessionOptions.verify`) e il viandante è l'uid
  (`accountWanderer` in `src/session/account.ts`); token falso o scaduto → `rifiuto`. L'anonimo (`ingresso.anonimo`,
  `SessionServer.isAnonymous`, `kernel.isAnonymous`) usa il meccanismo unico dei crediti di ADR-0081: 0 crediti non ricaricabili,
  escluso dalle spese comuni, richieste personali gestite con i modelli locali (`MockAiModels` a crediti esauriti); legandosi a Google
  (pannello `P`, «Lega a Google») smette di essere anonimo (`setAnonymous`), tiene lo stesso uid e viandante e può ricevere crediti.
  `QUINE_MASTER` (uid) è il master `io` degli universi fatti prima degli account. Senza `FIREBASE_PROJECT_ID` (sviluppo, test) vale l'id di
  oggi; in singola nessun account.

<a id="stripe"></a>
## I pagamenti con Stripe

- **I pagamenti con Stripe** (ADR-0083, T45e): ricarica dei crediti in multigiocatore con Stripe Checkout (Google Pay compreso); chiavi solo sul server (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`); creazione sessione via `POST /api/stripe/checkout` verificata dal token account; un anonimo non compra (blocco a monte 403 e a valle sull'accredito); il webhook `POST /api/stripe/webhook` senza `STRIPE_WEBHOOK_SECRET` risponde 503 (e una chiave vera senza quel segreto non apre sessioni, T124), verifica la firma HMAC-SHA256 (`stripe-signature`), valida nomi e id come il checkout, calcola il credito dall'importo pagato (`paidCents`: tasse aggiunte escluse, mai i metadati) e accredita una volta per evento nell'archivio dei saldi (`Ledger.pay`, `Kernel.creditRecharge`, ADR-0104); pannello `P` con saldo crediti in dollari e pulsanti di ricarica rapida (`+5 $`, `+10 $`, `+20 $`). Niente `payment_method_types` (i metodi li sceglie il Dashboard); i Managed Payments di Stripe restano accesi solo con `STRIPE_TAX_CODE` nel `.env`, altrimenti la sessione li spegne; un accredito non fa commit (ADR-0104).

<a id="clone-eredita"></a>
## Il clone e l'eredità

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

<a id="sotterranei"></a>
## I sotterranei

- **I sotterranei** (ADR-0091, progetto di T52a; T52b fatto, da attuare T52c-f): parti delle strutture sotto il suolo, mai un mondo a parte. La voce del modello dice `sotto: N` (1-3, `cellarOf`; la scatola della classe si allunga in basso, `Form.base` = `N · vpt` voxel sotto il suolo): pavimenti, collisione e taglio contano da lì (`levelIn` aggiunge `base`; fuori dal modello e dove non ha voxel sotto il suolo la terra è piena fino a `base`, `surfaces(…, fill)`), dalla cantina si esce solo per la scala, e ogni pavimento sotto il suolo si raggiunge dal piano terra (`groundOfForm`; altrimenti il modello entra senza cantina: `Form.hole` assente, posato comunque più in basso). Sulle colonne della cantina (`Form.hole`) `floorAt` ignora il terreno, sopra la tromba delle scale è aria (`rampBlocks`) e il salto non ci atterra (`floorBelow`, `topUnder`); il renderer posa il modello `kernel.sunk(id)` più in basso e abbassa il terreno delle caselle della cantina al suo fondo (`kernel.holesIn(chunk)`, il buco). Il Cartografo la chiede (`strutture[].sotto`, cose `sotto`); la profondità del terreno si genera come su X e Y (terreni `strato`, bozza per colonna, programma `sottosuolo` dell’ambiente, `strati` nel piano e in `ChunkView`, fino a 2 caselle sotto la cantina più profonda, al più 6). Si vede con il buco del terreno sotto il modello e, per chi sta sotto, un taglio a caselle in un disco attorno a lui con le bande degli strati e la luce attenuata. Nella corona scende solo l’esterno dell’edificio (T52c).

<a id="cartone"></a>
## La grafica a cartone

- **La grafica a cartone** (ADR-0093, progetto T89, da attuare T89a-e): fasce toon, contorni a inchiostro dove cambiano cosa o parte (la lettera della
  palette, attributo `part`), mai dalla geometria dei voxel (sugli alberi fa rumore), luce calda con ombre tinte e prospettiva aerea, e la guida di stile che
  chiede parti di colore distinto. Oggi dietro `?cartone`; `?classica` vince sempre e mostra il vecchio aspetto. Il predefinito è una costante,
  `CARTOON_BY_DEFAULT` in `src/render/cartoon.ts`: diventa `true` quando T89b e T89c sono fatti.
- **Le fasce** (T89a): `lit()` di `materials.ts` dà il `MeshToonMaterial` a tutti i materiali illuminati di simulazione, corona e studio (`MAT`, `solid()`, le
  figure del Concilio, le cornici degli schermi, il disco del tornio). Le soglie non sono tre terzi uguali: i voxel hanno sei normali e con il sole di `SUN_FROM`
  i terzi darebbero solo due fasce; `BAND_EDGES` dà la luce piena al tetto, la mezza luce alle facce verso sud e ovest, la fascia bassa (`BAND_LEVELS`, 0,35) alle
  altre. Le facce lontane dal sole sono anche in ombra portata: `SHADOW_INTENSITY` lascia passare 0,35 di sole, o la fascia bassa non si vedrebbe mai. L'emisfero
  (`CARTOON_HEMI`) è freddo a metà strada, così le facce verticali non vanno al grigio. Le ombre hanno il raggio del filtro a 0 (`SHADOW_RADIUS`). Nello studio il
  sole è acceso (`CARTOON_STUDIO`): senza, nessuna faccia cambierebbe fascia. I voxel luminosi escono dalle fasce in `addGlow` (colore × `GLOW_BASE` + `U.glow`,
  uguale su ogni faccia), solo nello shader toon. Restano Lambert le icone e le foto (T89d) e il laboratorio (T89e).
- **I contorni** sono ancora la prova di T89 (passo `Ink` nel composer di `bloom.ts`, da profondità e normali, soglie in `window.cartone`) finché non arriva T89b.

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
- **Bozze di prova**: `kernel.sampleDrafts()` (una boscosa, una aperta, una con acqua, scelte in modo deterministico) è dove il
  validatore prova i programmi degli ambienti e dove il campionario li mostra.
- **Mappa** (ADR-0011, 0040): caselle colorate per terreno, strati `ground floor wall door liquid vegetation rock`: l'acqua è
  più bassa con le sponde, i muri sono estrusi, le porte un varco sotto l'architrave; gli edifici dei luoghi non sono più caselle ma strutture; sulle caselle con `TerrainDef.model` (bosco, roccia) stanno istanze di quel modello, ruotate e spostate.
- **Voxel luminosi** (ADR-0046): `<color glow="True">` fa brillare una lettera (fiamme, finestre, rune, neon): attributo
  `glow` nelle mesh, senza occlusione, emissione nei materiali; il renderer disegna in un target con la maschera del
  bagliore nell'alfa e un bloom leggero prende solo ciò che brilla (`src/render/bloom.ts`); nelle foto non prende ombra.

<a id="markovjunior-modelli"></a>
## MarkovJunior, i modelli, la cache delle forme

- **MarkovJunior** (ADR-0036, 0038): l'XML di MarkovJunior letto alla lettera (palette ufficiale, strati dall'alto,
  simmetrie, `map`, `convolution`; 16 modelli 3D ufficiali girano invariati), più `<color part hidden glow>`, forme di
  base, `<animation>` e `<action>` (regole sul modello finito: la porta si apre); il front-end ripara le forme
  sbagliate dagli agenti. Il codice è in `src/mj/`; il laboratorio (`lab/`, `lab/README.md`) serve ad analizzare e
  correggere i programmi che il Concilio non riesce a scrivere (sandbox 3D `/lab/3d/`, sezioni, foto, prove con Gemini).
- **Modelli** (ADR-0041): ogni cosa ha un programma della libreria `models/` (`appearance.model`, `ItemDef.model`,
  `TerrainDef.model`; senza, il generico della sua classe; gli oggetti senza modello il generico `oggetto` nel loro
  colore); un'istanza è un seme (pochi per tipo). Densità: 20 voxel per casella, o la `vpt` della voce in `models/index.json`
  (ADR-0049; la forma la porta in `Form.vpt`). `src/kernel/forms.ts`: programma + seme → griglia, impronta,
  pavimenti, azioni (in Node le esegue il kernel, nel browser i worker, che fanno anche le mesh). Componente `form`
  `{model, seed, yaw, tint, done, wanted}` (`wanted`: il modello suo, indossato appena lo Scultore lo scrive). Le cose solide bloccano con l'impronta dei loro voxel; le `<action>` del modello
  sono nel menu dell'entità e restano fatte (`stato.json → forme`). Persone e animali camminano con gli arti, la
  vegetazione al vento, le `<animation>` girano; le icone sono foto dei modelli.
- **La cache delle forme** (ADR-0108, T161): in Node ogni `InlineRunner` usa `sharedForms`, una per processo: un programma con un seme gira una volta per tutti i kernel (il primo boot ~10 s, i successivi ~0,25 s). La chiave (`formKey`) è il testo intero, il seme, la scatola e la tinta; si tiene solo ciò che ha finito, congelato (`cells` lo scrive solo `act`, sulla copia di `instanceGrid`: mai sul risultato); LRU, 4096 voci e 256 MB; non si svuota. Nei test anche su disco (`tests/setup/forms-disk.ts`, `node_modules/.cache/quine-forms/`), mai nel gioco né sul server: chi fa dipendere il motore da un file nuovo lo aggiunge a `engineVersion`. Sempre solo nei test il rilievo (`tests/setup/relief-memo.ts`, T160: `Hills` per seme e programma; `relief.test.ts` e `determinism.test.ts` lo fanno girare davvero). Nel browser restano i worker: `WorkerRunner` tiene anch'esso solo ciò che ha finito, in memoria e in IndexedDB (`FORMS_DB_VERSION`, T163), sotto `formCacheKey`: `formKey` più ciò che cambia le mesh (T164). Su questa macchina IndexedDB solo sulle porte 5173 e 4173 o con `?formecache` (`keepsFormsOnDisk`, T177): ogni altra porta è un'origine nuova, e lasciava 0,5 GB nel profilo di Chrome. Il tetto del browser (T175, ADR-0108) è a tre piani, perché gli stessi array li tengono in tre: `WorkerRunner.memory` (128 MB, LRU: ciò che esce perde le mesh anche per il `Form` che lo tiene, `meshesGone`), le geometrie che nulla disegna (`trimGeometries`, 128 MB, mai ciò che è nella scena né ciò che è stato chiesto da meno di 30 s) e IndexedDB (`IdbFormStore`, 4 GB di array, LRU con l'archivio `uses`). Una forma tolta torna da sola: `geoOf` chiama `Form.remake` e intanto dà `undefined`, come per un modello non pronto. L'anello della corona, non rivelato da 60 s, si toglie. In IndexedDB griglie e mesh stanno in due archivi (T212, `forms` e `meshes`): un caricamento legge le griglie di tutte le forme, che il kernel vuole subito (`FormRunner.withoutMeshes`), e le mesh solo di ciò che si disegna (`geoOf` → `Form.remake`, e la geometria si fa all'arrivo). Le mesh le legge un worker, che decodifica fuori dal thread della pagina e cede i buffer (T215, `IdbFormStore.meshReader`, prima dei programmi in coda); se non trova nulla legge la pagina, come chi non ha worker. La sfera di ingombro di una geometria la calcola three quando la disegna.

<a id="rilievo"></a>
## Il rilievo

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
  (`placeInside`, `floorAt`, `structureAt`); il renderer taglia la struttura in cui si è. Le scale sono rampe (T53a):
  ogni colonna di voxel ha il suo pavimento, ci si sale se è più alta al più di un gradino (0,2 caselle) di quelle vicine
  (`bodyGround`, `rampBlocks` in `forms.ts`); un muro resta un muro. Le strutture hanno più piani (T53b): una colonna ha un
  pavimento per ogni tratto di pieno (`surfaces`, `Form.levels`), il corpo sta su quello più vicino all'altezza dei suoi piedi,
  `pos.z`, che il kernel tiene dopo ogni tick (`settleHeights`) e che `free`/`free_real`/`floorAt` prendono (senza: il piano terra);
  il renderer taglia sopra il piano in cui si è.

<a id="taglie"></a>
## Le taglie

- **Le taglie** (ADR-0092, T54): le taglie di D&D (`SIZE_TIERS` in `src/mj/classes.ts`: minuscola, piccola, media, grande, enorme,
  gargantuesca, la massima), la stessa scala per creature e strutture: la classe dà la forma e la scatola della sua taglia solita
  (`AssetClass.taglia`), la taglia la scala (`tilesOf`, `boxOf(cls, taglia)`, più rada oltre 120 voxel, `densityOf`). `appearance.taglia`,
  `strutture[].taglia` del Cartografo, `struttura.taglia`, `SculptRequest.taglia`, `ModelInfo.taglia`/`vpt` (`modelSize`). Rare: una
  **Enorme** (il castello «importante» di prima) per zona di 56 × 56 luoghi (`zoneOf`), una **Gargantuesca** per **reame** di 4 × 4 zone
  (`realmOf`), una per luogo, con il modello migliore dello Scultore; `claimSizes` le adatta al lotto e alla rarità (`rareAllowed`),
  `stato.json → rari` (un `importanti` vecchio è `rari.enorme`).

<a id="grafo"></a>
## Il grafo del mondo

- **Grafo del mondo** (ADR-0045): `src/kernel/graph.ts` costruisce dai file dell'universo e dai luoghi pianificati un grafo
  di nodi tipizzati (`<tipo>:<slug>`: individui col viandante e gli attesi, tipi, luoghi `luogo:<cx>_<cy>`, regioni, ambienti,
  strutture, trame, oggetti, ricette, rune, incantesimi, regole, fatti) e archi (legami, routine, tappe, contenuti, ingredienti,
  ciò che il viandante porta); `kernel.graph()` (in cache) con `find`, `neighbors`, `context`, `check()` (riferimenti verso
  nulla, legami da un lato solo o impossibili, nomi simili, trame senza individui o luoghi). Va in `world/grafo.json` prima di
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
- **La posizione del teleport si somma a quella salvata** (T214): `pagehide` scrive la posizione in `universes/<nome>/world/giocatori/io.json` e il caricamento dopo la rende scostamento del tappeto, quindi `?dev&teleport=46,0` chiuso in modo ordinato dà scostamenti 0, 46, 92, 138 e ogni volta terreno diverso, senza che sia un difetto. Per confrontare due caricamenti rimetti lo stesso universo prima di ciascuno (una copia di `universes/<nome>/`): il file sta lì, quindi un profilo pulito del browser da solo non basta. Oppure controlla `k.carpet().ox` e `.oy` prima di guardare o misurare.
- **Multigiocatore**: `vite preview` non aggancia il WebSocket di `/api/session` (il client dà «il mondo non risponde»): serve il server
  di sviluppo, `npx vite --port <n> --strictPort`, sempre nel turno `browser`. Un universo con `partita.modalita: 'multigiocatore'`, due
  schede con `?skip&offline&universo=<nome>&viandante=io` (il master, se `partita.master` non dice altro) e `&viandante=<altro>`; la prima
  partenza del mondo richiede una ventina di secondi. Nel master `window.quine` è il kernel specchio e `window.session` il `ThinClient`; nel
  giocatore `window.rune` è il `ThinClient`. Un dono: `await session.session.act({ t: 'dai', viandante: '<altro>', slot, quanti })`.
- **Agire**: `await k.interact()` è `E` (sul dispositivo o sullo scaffale più vicino), `k.clickStudio(x, y)` il clic sinistro su un punto;
  i pannelli arrivano come eventi (`k.bus.on('ui:showcase', …)`, `ui:screens`, `ui:graph`…). Per far vedere uno stato senza Gemini:
  `k.council.say(agente, tipo, testo, a, compito)` scrive nel registro, `k.faults.raise(chiave, messaggio)` apre un guasto.
- **Guardare**: lo screenshot dello strumento del browser; la camera gira con i tasti `,` `.` mandati alla pagina (o trascinando col
  tasto centrale), la rotellina fa lo zoom. Errori: i messaggi della console della pagina.
- **Alla fine**: chiudi la scheda e ferma la preview.

<a id="costi"></a>
## Costi e prestazioni

- **Registro dei consumi** (ADR-0039): ogni chiamata passa da `kernel.usage` (per giorno, modello e compito, in token e
  dollari, cache e ragionamento compresi) e va in `world/consumi.json` con ogni commit; il costo è nel pannello del
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
