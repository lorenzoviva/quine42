# AGENTS.md — RUNE

> **Unica fonte di verità per gli agenti** (Claude Code, Gemini CLI, chiunque altro).
> Leggi questo file e `docs/` prima di qualsiasi lavoro. Ogni decisione architetturale va
> registrata qui **e** in un ADR in `docs/adr/` (stesso commit).

## Visione in breve

RUNE è un gioco 3D visto dall'alto in 3/4, fatto di voxel semplici e di contenuti ricchissimi, in cui il
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
9. **La chiave API non arriva mai al browser**: passa dal proxy di Vite (`server/geminiProxy.ts`).
10. **Ciò che sembra invalicabile lo è**: il terreno blocca a caselle, i modelli con i loro voxel (ADR-0041);
    ogni luogo è connesso (varchi + sentieri scavati dal kernel, porte delle strutture sul sentiero).
11. **Solo testo, niente immagini generate** (ADR-0037): contenuti come dati e ogni aspetto come programma
    MarkovJunior; un programma per tipo, le istanze sono semi diversi.

## Stack

- **Vite 5 + TypeScript 5** (strict), **three.js** per il mondo (ADR-0040), DOM per HUD/pannelli, uno strato 2D sopra per i testi.
- **Lua 5.4 via wasmoon** (WebAssembly), sandbox gestita dal kernel.
- **Google Gemini**: `gemini-3.1-flash-lite` (testo), in
  `universe/universe.json → ai` con i budget (`maxText`, `maxForges`, `maxPacks`, `maxCast`),
  il ragionamento (`thinking`, `low`) e il tempo massimo (`timeout`). Prezzi in `src/kernel/ai/prices.ts` (con la data).
- **Vitest** in Node con modelli offline (`MockModels`): kernel, Concilio e layout testabili headless.
- Persistenza: repository git dell'universo su disco tramite il server di Vite (`server/universeStore.ts`):
  testi, `maps/` (piani dei luoghi), `world/stato.json` (la partita), `world/consumi.json` (i consumi). Senza server:
  `localStorage` + IndexedDB.

## Comandi

```bash
npm install          # dipendenze
npm run dev          # gioco su http://localhost:5173 (proxy Gemini; hot reload anche di universe/)
npm test             # test (kernel, Concilio offline, MarkovJunior, layout, validatore, contenuti, sandbox)
npm run typecheck    # tsc --noEmit
npm run build        # typecheck + build (npx vite preview la serve, proxy incluso)
```

`.env`: `GEMINI_API_KEY=...` (ignorato da git). Senza chiave o con `?offline`: modelli locali, texture e
ostacoli procedurali. URL: `?skip` salta intro e Genesi; `?dev&teleport=46,0` porta oltre il tappeto.
Graphify (facoltativo, ADR-0045): `pip install graphifyy` in un ambiente a parte, poi `GRAPHIFY_BACKEND=none graphify update .`
(solo codice, offline, ~12 s; `graphify-out/` è ignorato da git; niente skill, MCP né hook).
In console del browser: `window.rune` è il kernel (`.feed()`, `.models.usage`, `.content`).

## Struttura

```
server/geminiProxy.ts   proxy /api/gemini → Google, chiave da .env
server/universeStore.ts /api/universe: ogni universo è un repository git in universes/<nome>/
src/
  main.ts               bootstrap: modelli, kernel, renderer, UI, loop a 60 Hz
  kernel/               IL PAVIMENTO — mai scrivibile da Lua
    kernel.ts           orchestratore: tick, luoghi, oggetti, contenitori, azioni (anche libere), effetti, magia, chat, Fucina, Genesi, rollback
    corona.ts           la corona come studio: edifici, interni su più piani, scaffali, gallerie
    archive.ts          le squadre del Concilio e il Referente nello studio
    society.ts          la società: persone, legami, routine, attività, ricordi
    plots.ts            trame orizzontali e missioni
    graph.ts            il grafo del mondo: nodi e archi dai file dell'universo, interrogazioni, controlli
    atlas.ts            l'atlante: regioni geolocalizzate, direzioni
    stamps.ts           timbri di strutture (castelli, torri, templi, piramidi, sotterranei…)
    universes.ts        client del repository dell'universo, aggiornamenti dal seme
    fourthwall.ts       principi del Concilio (due tavoli) e filtro della quarta parete
    mj.ts               motore di riscrittura stile MarkovJunior
    layout.ts           bozza → varchi → programma → sentieri garantiti → edifici
    content.ts          registro di oggetti, ricette, bottino, ambienti
    forms.ts            libreria dei modelli, forme (programma + seme → griglia, impronta, pavimenti, azioni)
    modeldirector.ts    i modelli che mancano, uno alla volta, entro `ai.maxModels`
    chunks.ts           archivio dei piani dei luoghi
    ai/                 models.ts, gemini.ts, mock.ts, prices.ts (prezzi, con la data), usage.ts (registro dei consumi)
    agents/             council.ts, cartography.ts, forge.ts, genesis.ts, minds.ts, content.ts, sculptor.ts, effects.ts, mechanics.ts
    ecs.ts, sandbox.ts, prelude.lua, validator.ts, runes.ts, repo.ts, universe.ts,
    inventory.ts, bundle.ts, faults.ts, events.ts, input.ts, rng.ts, types.ts
  render/               renderer.ts (three.js: camera 3/4, luce, spazi), terrain.ts (chunk, muri, tetti), things.ts (entità, viandante,
                        rune, luci), models.ts (geometrie dei modelli), forms.ts + worker.ts (i programmi nei worker),
                        thumbs.ts (icone: foto dei modelli), bloom.ts (bagliore dei voxel luminosi), corona3d.ts (corona, studio, avatar), overlay.ts (testi, E, mouse),
                        materials.ts, glitch.ts
  ui/                   hud.ts (anche il diario delle missioni), inventory.ts, actions.ts, chat.ts, feed.ts, genesis.ts, editor.ts, console.ts, studio.ts, atlas.ts, dom.ts
universe/
  universe.json         nome, seme, raggio, chunk (18), modelli e budget
  world/                bible.json (memoria del Narratore), style.md (guida di stile dei modelli), canone.md (le rune), consumi.json,
                        rules.json (regole), people.json (la società, con i ricordi), plots.json (trame),
                        atlas.json (geografia), stato.json (la partita), grafo.json (il grafo del mondo, derivato)
  prompts/              theme.md, agents/<agente>.md
  models/               index.json + <id>.xml: i programmi MarkovJunior di ogni cosa (ADR-0041), uno per tipo
  modules/<id>/         manifest.json (+ logic.lua): sistemi, terreni, ambienti, pacchetti di oggetti, mobili, persone,
                        effetti (core.effects), fuoco (sys.fire), rune magiche e incantesimi (magic.runes, magic.spells)
tests/  docs/
src/mj/                 MarkovJunior del gioco (ADR-0036, 0038): engine.ts (motore 3D), xml.ts e model.ts (XML alla lettera), palette.ts,
                        run.ts (esecuzione, animazioni, azioni), rig.ts (arti), mesh.ts (voxel → triangoli, impronte, pavimenti),
                        classes.ts (classi e scatole), photo.ts (foto in 3/4 per l'Artista), check.ts (misure di un modello)
lab/                    laboratorio di MarkovJunior (ADR-0038): sandbox 3D /lab/3d/, modelli ufficiali e conformità, script per
                        affettare, fotografare, misurare e provare i programmi con Gemini; non importarlo da src/
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
| Referente | nella corona accoglie il viandante trasceso e porta le sue richieste alla squadra giusta (Fucina, Cartografo, Scultore, regole, pacchetti) |

Registro: `kernel.feed()`, pannello Concilio (`G`) e console. Nella corona ogni agente è una squadra: un
membro per edificio, che va allo scaffale del file che cambia; si vedono parlare solo quelli che
interagiscono nel registro; con `E` ci si parla. Il Cartografo crea ambienti e li colloca sull'atlante.
Il Narratore intreccia trame tra le persone e scrive i loro dialoghi.

**Luogo** (18×18): bozza Lua continua (`g p t w r`) → piano del Cartografo (ambiente, cose `dentro`/
`fuori`/`ovunque`, oggetti `a_terra`, rune, `strutture`) → layout (varchi deterministici, programma con bordo
congelato, sentieri garantiti, edifici) → lotti: ogni edificio diventa una struttura, un modello intero girato
verso la porta (ADR-0043) → cose su celle raggiungibili (quelle `dentro` sul pavimento del modello), bottino
`terreno`, rune su tratti liberi. Il chunk (0,0) ha sempre `x`, `speed = speed` e la runa magica `luce`.

**Fucina**: concetto (tipo, contesto, aspetto, comandi, azioni, contenitore, cose portate, persona,
unicità) → fisica → codice → Arbitro → validatore → commit → bibbia; il modello (`appearance.model` suo, con la `classe`) lo scrive poi lo Scultore; gli oggetti dei pacchetti
hanno una forma comune (`forma-…`, un programma per forma, ricolorato), i terreni con cose sopra un modello loro. **Genesi**: bibbia → stile → terreni (Fisico) → Arbitro → ambienti (provati) →
pacchetto di oggetti → cast (5 npc diversi, 5 oggetti/mobili, 2 strumenti) → commit.

## Architettura del gioco

- **Spazi, tappeto, corona** (ADR-0004, 0009): cerchio fermo in (0,0), tappeto con offset; `coronaRevealed()`.
- **Rune** (ADR-0002, 0015): un token per runa, una casella per runa (una lastra luminosa a terra), righe orizzontali eseguite ogni
  tick; binding `x y speed carpet time`. Rare; quelle del tappeto solo a ≥ 3 chunk dall'origine. Il **canone delle rune**
  (`world/canone.md`: aspetto, dove stanno, restano finché qualcuno non le raccoglie, magia, ciò che nessuno sa), con le rune
  magiche e gli incantesimi dell'universo, va con ogni compito del Narratore e dell'Arbitro (`canonSummary`): nessuna storia
  dà alle rune comportamenti che lì non ci sono.
- **Magia** (ADR-0015, 0018): rune magiche `luce fuoco acqua terra vita scudo vento`; ogni runa è un oggetto
  `rune:<token>`; la **frase** (`hand.tokens`) è la selezione ordinata; `T` pronuncia le magiche della frase e
  le consuma; incantesimi noti in `spells`, nuovi nominati una volta dal Narratore; costano **mana**
  (`needs.mana`); da 3 rune consumano un **cristallo magico** (tabella di bottino `magia`).
- **Borse** (ADR-0018): `ItemDef.container {size, accepts}`; lo slot ha `inv`; la borsa delle rune accetta `runa`.
- **Regole** (ADR-0019): ogni giudizio in `world/rules.json`, mostrato al Concilio; le azioni possibili si
  imparano (modulo o `ItemDef.actions`); «Altro…» anche nell'inventario e nel crafting (ricette in
  `items.scoperte`); sessioni del Concilio ogni 12 luoghi.
- **Società** (ADR-0020): `world/people.json`; individui con specie (`persona | animale`, dal tipo) e genere,
  mestiere, famiglia, routine (mattina/giorno/sera/notte → casa/lavoro/piazza/in giro, componente `meta` seguito
  da `sys.wander`). Un legame dice cosa è la persona per l'altro, nel suo genere; il validatore della società
  (`repairSociety` in `society.ts`) lo rende possibile per le due specie e simmetrico, un padrone per animale,
  nomi non simili (rinomina anche nelle trame); ripara a ogni aggiunta e all'avvio (`reviewSociety`).
- **Effetti** (ADR-0014): insieme chiuso (`messaggio bisogni crea_oggetto consuma distruggi apri contenitore
  terreno fuoco luce scudo spingi evoca`), validati dal kernel, applicati da `core.effects`. Usati da
  azioni libere («Altro…»), azioni imparate (`actions[].effects`) e incantesimi. Terreno cambiato persistente.
  Ciò che cambia l'**aspetto** di una cosa con una forma sua non è un effetto (ADR-0044): il Narratore lo dice in
  `forma`, lo Scultore scrive un'`<action>` sul programma del tipo (`sculptAction`), il kernel la prova sul modello
  (`checkAction`: finisce, cambia qualcosa, non lo svuota) e la mette nella libreria; gli effetti restano per il resto.
- **Giorno e notte** (ADR-0015): `daylight()`, giornata di 10 minuti; luce dai componenti `luce`.
- **Corona** (ADR-0009, 0016, 0022): studio; edifici per cartella con porte che teletrasportano in interni
  più grandi (stanze 24×15 su più piani, zona `studio`), scaffali di file, Galleria dell'Artista (i modelli,
  «riscolpisci»), Studio del Cartografo (terreni), bacheche con le modifiche recenti (che brillano).
- **Geografia** (ADR-0023): biomi nel generatore (`s j o k n`), 20 ambienti nel seme, nodo `stamp` di
  MarkovJunior, atlante di regioni (`world/atlas.json`), direzioni note a NPC e Cartografo.
- **Stati e meccaniche** (ADR-0026): effetti `stato`/`togli_stato` (velocità, peso, luce, durata) per ciò che
  si usa (cavallo, barca, zaino); componente `stati` del viandante.
- **Morte e trascendenza** (ADR-0026): a salute zero la sessione finisce (continua nello stesso universo o
  ricomincia dal seme); dopo la corona non si muore e non si perde nulla.
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
- **Menu delle caselle** (ADR-0029): `E`/clic destro su una casella → azioni dell'entità, della casella, «Altro…»;
  le azioni libere ripetibili si imparano per tipo di terreno (`TileDef.actions`). Le `<action>` del modello di una
  cosa sono voci del suo menu (`modello:<nome>`), anche quelle nate da «Altro…» (ADR-0044).
- **Il mondo in 3D** (ADR-0040): three.js, camera fissa in 3/4 da sud (il nord è in alto, come vuole il movimento del
  kernel), un'unità = una casella, kernel (x, y) = three.js (x, z). La simulazione (chunk, cose, rune) è in coordinate del
  tappeto e si disegna spostata del suo scorrimento; viandante, corona e studio in coordinate reali; quando la corona si
  vede, nulla della simulazione si disegna oltre il cerchio (un taglio nello shader). Testi, fumetti, «E», passaggio del
  mouse e glitch su uno strato 2D sopra. Il tasto destro sceglie la casella con un raggio sul terreno.
- **MarkovJunior** (ADR-0036, 0038): l'XML di MarkovJunior letto alla lettera (palette ufficiale, strati dall'alto,
  simmetrie, `map`, `convolution`; 16 modelli 3D ufficiali girano invariati), più `<color part hidden glow>`, forme di
  base, `<animation>` e `<action>` (regole sul modello finito: la porta si apre); il front-end ripara le forme
  sbagliate dagli agenti. Il codice è in `src/mj/`; il laboratorio (`lab/`, `lab/README.md`) serve ad analizzare e
  correggere i programmi che il Concilio non riesce a scrivere (sandbox 3D `/lab/3d/`, sezioni, foto, prove con Gemini).
- **Mappa** (ADR-0011, 0040): caselle colorate per terreno, strati `ground floor wall door liquid vegetation rock`: l'acqua è
  più bassa con le sponde, i muri sono estrusi, le porte un varco sotto l'architrave; gli edifici dei luoghi non sono più caselle ma strutture; sulle caselle con `TileDef.model` (bosco, roccia) stanno istanze di quel modello, ruotate e spostate.
- **Voxel luminosi** (ADR-0046): `<color glow="True">` fa brillare una lettera (fiamme, finestre, rune, neon): attributo
  `glow` nelle mesh, senza occlusione, emissione nei materiali; il renderer disegna in un target con la maschera del
  bagliore nell'alfa e un bloom leggero prende solo ciò che brilla (`src/render/bloom.ts`); nelle foto non prende ombra.
- **Modelli** (ADR-0041): ogni cosa ha un programma della libreria `models/` (`appearance.model`, `ItemDef.model`,
  `TileDef.model`; senza, il generico della sua classe; gli oggetti senza modello il generico `oggetto` nel loro
  colore); un'istanza è un seme (pochi per tipo). `src/kernel/forms.ts`: programma + seme → griglia, impronta,
  pavimenti, azioni (in Node le esegue il kernel, nel browser i worker, che fanno anche le mesh). Componente `form`
  `{model, seed, yaw, tint, done, wanted}` (`wanted`: il modello suo, indossato appena lo Scultore lo scrive). Le cose solide bloccano con l'impronta dei loro voxel; le `<action>` del modello
  sono nel menu dell'entità e restano fatte (`stato.json → forme`). Persone e animali camminano con gli arti, la
  vegetazione al vento, le `<animation>` girano; le icone sono foto dei modelli.
- **Lotti e strutture** (ADR-0043): ogni edificio del piano è un lotto con una struttura (entità `struttura`, origine
  `<chunk>#s<i>`): il modello `edificio`/`grande` o `struttura-<concetto>` chiesto dal Cartografo sui lotti più grandi,
  al centro del lotto, girato verso la porta; le caselle del lotto tornano terreno. Dentro = sul pavimento del modello
  (`placeInside`, `floorAt`, `structureAt`); il renderer taglia la struttura in cui si è. Una struttura `importante`
  (Argon) per zona di 56 × 56 luoghi (`zoneOf`, `stato.json → importanti`).
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
`appearance` (`glyph`, `color`, `aspetto`, `model`, `classe`), `physics`
(`solid`, `radius`, `pushable`, `mass`, `friction`, `speed`), `components`, `singleton`, `persist`,
`interaction` (`talk | read | lua`), `actions` (`id`, `label`, `requires`, `effects`), `container` (`size`, `loot`),
`ui` (pannello: `titolo`, `elementi`), `spawn`, `persona`, `unique`, `inventory` (id di oggetti), `item`, `context`, `lore`, `tags`, `drops`,
`origin`; generatori: `tiles` (`name`, `color`, `solid`, `layer`, `indoor`, `speed`, `model`, `actions`),
`roof`; dati: `items` (anche `model`, `aspetto`, `container`, `actions`, `slot`, `bonus`, effetti `mana`), `recipes`, `loot`, `layouts`, `fragments`, `runes`, `spells`.

### API Lua — l'unica disponibile, il validatore rifiuta il resto
`ecs.each/get/set/spawn/destroy/first`; `world.free/free_real/tile/speed_at/spawn/player/player_pos/
nearest/has_tag/break_entity/say/speak/set_tile/open/make_container`; `inventory.add/remove/count/equipped`; `items.find/def/bonus`; `ui.slot`;
`input.held`; `bus.emit`; `log`; `hash`; `math string table utf8 pairs pcall…`.
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
3. **Alla fine**: `npm test` e `npm run typecheck` verdi (e la verifica nel browser se tocca il gioco); ADR e
   questo file aggiornati se la decisione è architetturale; il task segnato `fatto` con il commit e una riga su
   cosa è cambiato rispetto al previsto; commit (mai su `main`). Poi **dai all'autore il prompt per la sessione
   successiva** (quello in testa al backlog, con il numero del prossimo task) e di' in una riga cosa farà.

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
> [`docs/reports/step9.md`](docs/reports/step9.md); piano e diario delle fasi: [`docs/plans/step9-3d.md`](docs/plans/step9-3d.md).
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
giudice; lotti come strutture girate verso la porta, una struttura importante per zona; azioni come regole
(«Altro…» che cambia la forma scrive un'`<action>`); aiuto senza meta-gioco.

Prossimi passi (il dettaglio è nel backlog):
1. Coerenza del mondo: canone delle rune, prompt narrativi più semplici, società e trame coerenti, il grafo del
   mondo come contesto degli agenti (T07-T13, fatti).
2. Grafica e controlli 3D: voxel luminosi (T14, fatto), telecamera che ruota, terreno con le altezze (Hills), lotti in piano.
3. La corona più grande, con gli esterni e gli interni come modelli.
4. Ancore del piano («vicino a…»), forme degli oggetti portati e dei terreni che cambiano con «Altro…».
5. Multiplayer con un master: piano e punti aperti in [`docs/plans/multiplayer.md`](docs/plans/multiplayer.md).
