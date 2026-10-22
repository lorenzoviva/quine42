# AGENTS.md — RUNE

> **Unica fonte di verità per gli agenti** (Claude Code, Gemini CLI, chiunque altro).
> Leggi questo file e `docs/` prima di qualsiasi lavoro. Ogni decisione architetturale va
> registrata qui **e** in un ADR in `docs/adr/` (stesso commit).

## Visione in breve

RUNE è un gioco 2D top-down, a grafica semplice e contenuti ricchissimi, in cui il mondo è generato
da IA in ogni aspetto tranne il kernel, ed è fatto del proprio codice sorgente. Il giocatore vive in
un cerchio di simulazione; un **tappeto** compensa ogni suo passo e lo riporta al centro. Attorno,
ferma e **invisibile finché il tappeto lo tiene**, c'è la **corona**: il codice sorgente dell'universo,
lo studio di una software house di giochi (un edificio per cartella, interni su più piani, gallerie di
sprite e terreni) dove si vedono lavorare le squadre del Concilio. Chi ci arriva è trasceso: ne fa parte.
Un **Concilio di agenti** su Google Gemini scrive storia, ambienti, oggetti, persone e il loro codice,
e dipinge a lotti tile e sprite. Nel terreno brillano **rune**: token Lua veri, una per casella. Ciò che è
scritto sul tappeto **si esegue**: componendo frasi il giocatore può rompere la simulazione, o uscirne e
riscriverla. Le rune raccolte sono oggetti (nella borsa delle rune); alcune sono anche **magia**:
pronunciate (T) diventano incantesimi e si consumano. Ciò che il Concilio decide diventa **regola** del mondo.

**Due tavoli** (ADR-0025), come in Dungeons & Dragons: il Concilio (o il giocatore che fa il Dungeon
Master, nella corona) crea e fa evolvere il mondo; dentro il mondo il viandante e le persone vivono un
mondo reale. Nei contenuti mai meta-gioco: niente codice, simulazione, Concilio, «crepe», bordi misurati.

Design doc originale: [`docs/design.md`](docs/design.md). Decisioni: [`docs/adr/`](docs/adr/README.md).

## Regole inviolabili

0. **Niente meta-gioco dentro il mondo** (ADR-0025): i principi del Concilio (`src/kernel/fourthwall.ts`)
   vanno con ogni richiesta; ciò che rompe la quarta parete viene richiesto di nuovo o ritirato.

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
10. **Collisione e grafica sono la stessa griglia**: ciò che sembra invalicabile lo è; ogni luogo è
    connesso (varchi + sentieri scavati dal kernel).
11. **Testo abbondante, immagini poche e riusate**: contenuti come dati (economici); immagini a lotti.

## Stack

- **Vite 5 + TypeScript 5** (strict), Canvas 2D per il mondo, DOM per HUD/pannelli.
- **Lua 5.4 via wasmoon** (WebAssembly), sandbox gestita dal kernel.
- **Google Gemini**: `gemini-3.1-flash-lite` (testo) e `gemini-3.1-flash-lite-image` (immagini), in
  `universe/universe.json → ai` con i budget (`maxText`, `maxImages`, `maxForges`, `maxPacks`, `animation`),
  il ragionamento (`thinking`, `low`) e il tempo massimo (`timeout`). Prezzi in `src/kernel/ai/prices.ts` (con la data).
- **Vitest** in Node con modelli offline (`MockModels`): kernel, Concilio e layout testabili headless.
- Persistenza: repository git dell'universo su disco tramite il server di Vite (`server/universeStore.ts`):
  testi, `maps/` (piani dei luoghi), `assets/` (immagini), `world/stato.json` (la partita). Senza server:
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
    atlas.ts            l'atlante: regioni geolocalizzate, direzioni
    stamps.ts           timbri di strutture (castelli, torri, templi, piramidi, sotterranei…)
    universes.ts        client del repository dell'universo, aggiornamenti dal seme
    fourthwall.ts       principi del Concilio (due tavoli) e filtro della quarta parete
    mj.ts               motore di riscrittura stile MarkovJunior
    layout.ts           bozza → varchi → programma → sentieri garantiti → edifici
    content.ts          registro di oggetti, ricette, bottino, ambienti
    art.ts              ArtDirector: coda di lavori grafici entro il budget
    ai/                 models.ts, gemini.ts, mock.ts
    agents/             council.ts, cartography.ts, forge.ts, genesis.ts, minds.ts, content.ts, atelier.ts, effects.ts, mechanics.ts
    ecs.ts, sandbox.ts, prelude.lua, validator.ts, runes.ts, repo.ts, universe.ts,
    inventory.ts, assets.ts, imaging.ts, bundle.ts, faults.ts, events.ts, input.ts, rng.ts, types.ts
  render/               renderer.ts (tile, transizioni, ostacoli, tetti, animazioni), imagetools.ts, glitch.ts
  ui/                   hud.ts (anche il diario delle missioni), inventory.ts, actions.ts, chat.ts, feed.ts, genesis.ts, editor.ts, console.ts, studio.ts, atlas.ts
universe/
  universe.json         nome, seme, raggio, chunk (18), modelli e budget
  world/                bible.json (memoria del Narratore), style.md, atelier.json (coppie few-shot),
                        rules.json (regole), people.json (la società, con i ricordi), plots.json (trame),
                        atlas.json (geografia), stato.json (la partita)
  prompts/              theme.md, agents/<agente>.md
  modules/<id>/         manifest.json (+ logic.lua): sistemi, terreni, ambienti, pacchetti di oggetti, mobili, persone,
                        effetti (core.effects), fuoco (sys.fire), rune magiche e incantesimi (magic.runes, magic.spells)
tests/  docs/
src/mj/                 MarkovJunior del gioco (ADR-0036, 0038): engine.ts (motore 3D), xml.ts e model.ts (XML alla lettera), palette.ts,
                        run.ts (esecuzione, animazioni, azioni), rig.ts (arti), mesh.ts (voxel → triangoli, impronte, pavimenti),
                        classes.ts (classi e scatole), photo.ts (foto in 3/4 per l'Artista), check.ts (misure di un modello)
lab/                    laboratorio di MarkovJunior (ADR-0038): sandbox 3D /lab/3d/, modelli ufficiali e conformità, script per
                        affettare, fotografare, misurare e provare i programmi con Gemini; non importarlo da src/
```

## Il Concilio (ADR-0008, 0011, 0012, 0013, 0014, 0016)

| Agente | Fa |
|---|---|
| Narratore | bibbia; concetti dei moduli; individui dietro ogni NPC (mestiere, famiglia, routine); chat nel personaggio; pacchetti di oggetti, ricette, bottino; oggetti citati; "Esamina"; combinazioni; giudica azioni libere e fabbricazioni libere; dà nome agli incantesimi nuovi |
| Cartografo | terreni (con strati) e ambienti (programmi di riscrittura) alla Genesi; per ogni luogo: ambiente, nome, cosa c'è dentro e fuori, rune |
| Artista | guida di stile; texture seamless (4/immagine), ostacoli, sprite few-shot, camminate, icone (16/immagine) |
| Fisico | fisica di moduli, terreni e oggetti (pesi, pile, effetti) |
| Ingegnere | logic.lua (`on_act`, `on_use`, `on_action`…); meccaniche con pannelli (`mechanic.design`); ripara il codice che fallisce |
| Arbitro | coerenza tra narrativa, aspetto, fisica e codice; rimanda all'agente responsabile; tiene le sessioni del Concilio |
| Referente | nella corona accoglie il viandante trasceso e porta le sue richieste alla squadra giusta (Fucina, Cartografo, Artista, regole, pacchetti) |

Registro: `kernel.feed()`, pannello Concilio (`G`) e console. Nella corona ogni agente è una squadra: un
membro per edificio, che va allo scaffale del file che cambia; si vedono parlare solo quelli che
interagiscono nel registro; con `E` ci si parla. Il Cartografo crea ambienti e li colloca sull'atlante.
Il Narratore intreccia trame tra le persone e scrive i loro dialoghi.

**Luogo** (18×18): bozza Lua continua (`g p t w r`) → piano del Cartografo (ambiente, cose `dentro`/
`fuori`/`ovunque`, oggetti `a_terra`, rune) → layout (varchi deterministici, programma con bordo
congelato, sentieri garantiti, edifici) → cose su celle raggiungibili, bottino `terreno`, rune su tratti
liberi. Il chunk (0,0) ha sempre `x`, `speed = speed` e la runa magica `luce`.

**Fucina**: concetto (tipo, contesto, aspetto, comandi, azioni, contenitore, cose portate, persona,
unicità) → fisica → codice → Arbitro → validatore → commit → bibbia; lo sprite (few-shot) e la camminata
li fa poi l'ArtDirector. **Genesi**: bibbia → stile → terreni (Fisico) → Arbitro → ambienti (provati) →
pacchetto di oggetti → cast (5 npc diversi, 5 oggetti/mobili, 2 strumenti) → commit; poi l'Artista dipinge.

## Architettura del gioco

- **Spazi, tappeto, corona** (ADR-0004, 0009): cerchio fermo in (0,0), tappeto con offset; `coronaRevealed()`.
- **Rune** (ADR-0002, 0015): un token per runa, una casella per runa (glifo), righe orizzontali eseguite ogni
  tick; binding `x y speed carpet time`. Rare; quelle del tappeto solo a ≥ 3 chunk dall'origine.
- **Magia** (ADR-0015, 0018): rune magiche `luce fuoco acqua terra vita scudo vento`; ogni runa è un oggetto
  `rune:<token>`; la **frase** (`hand.tokens`) è la selezione ordinata; `T` pronuncia le magiche della frase e
  le consuma; incantesimi noti in `spells`, nuovi nominati una volta dal Narratore; costano **mana**
  (`needs.mana`); da 3 rune consumano un **cristallo magico** (tabella di bottino `magia`).
- **Borse** (ADR-0018): `ItemDef.container {size, accepts}`; lo slot ha `inv`; la borsa delle rune accetta `runa`.
- **Regole** (ADR-0019): ogni giudizio in `world/rules.json`, mostrato al Concilio; le azioni possibili si
  imparano (modulo o `ItemDef.actions`); «Altro…» anche nell'inventario e nel crafting (ricette in
  `items.scoperte`); sessioni del Concilio ogni 12 luoghi.
- **Società** (ADR-0020): `world/people.json`; individui con mestiere, famiglia (legami simmetrici), routine
  (mattina/giorno/sera/notte → casa/lavoro/piazza/in giro, componente `meta` seguito da `sys.wander`).
- **Effetti** (ADR-0014): insieme chiuso (`messaggio bisogni crea_oggetto consuma distruggi apri contenitore
  terreno fuoco luce scudo spingi evoca`), validati dal kernel, applicati da `core.effects`. Usati da
  azioni libere («Altro…»), azioni imparate (`actions[].effects`) e incantesimi. Terreno cambiato persistente.
- **Giorno e notte** (ADR-0015): `daylight()`, giornata di 10 minuti; luce dai componenti `luce`.
- **Corona** (ADR-0009, 0016, 0022): studio; edifici per cartella con porte che teletrasportano in interni
  più grandi (stanze 24×15 su più piani, zona `studio`), scaffali di file, Galleria dell'Artista (sprite e
  icone, «ridipingi»), Studio del Cartografo (terreni), bacheche con le modifiche recenti (che brillano).
- **Geografia** (ADR-0023): biomi nel generatore (`s j o k n`), 20 ambienti nel seme, nodo `stamp` di
  MarkovJunior, atlante di regioni (`world/atlas.json`), direzioni note a NPC e Cartografo.
- **Stati e meccaniche** (ADR-0026): effetti `stato`/`togli_stato` (velocità, peso, luce, durata) per ciò che
  si usa (cavallo, barca, zaino); componente `stati` del viandante.
- **Morte e trascendenza** (ADR-0026): a salute zero la sessione finisce (continua nello stesso universo o
  ricomincia dal seme); dopo la corona non si muore e non si perde nulla.
- **Sala del Concilio e studi** (ADR-0027): tavolo rotondo con l'universo che gira, i sette membri seduti,
  teletrasporti verso le sale e ritorno, schermi della storia, stile neon punk; atlante navigabile.
- **Vita degli NPC** (ADR-0024): attività visibili (`attivita {tipo, ferma}`), dialoghi tra persone,
  ricordi pesati, legami col viandante e figli (effetti `legame ricordo nascita`), trame e missioni
  (`world/plots.json`, diario nell'HUD).
- **Meccaniche con interfacce** (ADR-0028): un modulo di sistema può avere un pannello (`manifest.ui`:
  `slot barra testo pulsante`) che il kernel disegna come scheda dell'inventario; hook `on_slot`/`on_ui`,
  componente `slots` del viandante; oggetti con `slot` (posto) e `bonus`. Le crea la Fucina delle meccaniche
  (`forgeMechanic`), su richiesta delle sessioni del Concilio o del Referente: il kernel dà gli strumenti, non i contenuti.
- **Menu delle caselle** (ADR-0029): `E`/clic destro su una casella → azioni dell'entità, della casella, «Altro…»;
  le azioni libere ripetibili si imparano per tipo di terreno (`TileDef.actions`).
- **Prospettiva 3/4 e scontorno** (ADR-0030): `PERSPECTIVE` nella guida di stile, muri con faccia frontale, tetti
  in 3/4; il magenta serve perché i modelli di immagine non danno alfa; `keyAndFit` trova lo sfondo e tiene il soggetto.
- **MarkovJunior** (ADR-0036, 0038): l'XML di MarkovJunior letto alla lettera (palette ufficiale, strati dall'alto,
  simmetrie, `map`, `convolution`; 16 modelli 3D ufficiali girano invariati), più `<color part hidden>`, forme di
  base, `<animation>` e `<action>` (regole sul modello finito: la porta si apre); il front-end ripara le forme
  sbagliate dagli agenti. Il codice è in `src/mj/`; il laboratorio (`lab/`, `lab/README.md`) serve ad analizzare e
  correggere i programmi che il Concilio non riesce a scrivere (sandbox 3D `/lab/3d/`, sezioni, foto, prove con Gemini).
- **Mappa** (ADR-0011): tile con texture, strati `ground floor wall door liquid vegetation rock`, tetti.
- **Contenuti** (ADR-0012): `ItemDef` in pacchetti; bottino per tag; contenitori; ricette; bisogni
  (`needs` sul giocatore, `sys.needs`); uso generico in `core.items`; menu azioni (`E`).
- **Personaggi** (ADR-0010, 0013, 0017, 0020): tipo + individuo (`identity`: anche `job family routine story`), `mind` (memoria, umore, modo), azioni
  `segui resta vaga dai nessuna`, oggetti citati → `wanted`. Al massimo 2 dello stesso tipo nel mondo
  caricato; nuovi tipi forgiati esplorando (`ai.maxCast`); abiti e statura variano per individuo.

### Manifest (`src/kernel/types.ts`)
`id`, `name`, `kind` (`system | entity | item | player | generator | data`), `logic`, `order`,
`appearance` (`glyph`, `color`, `imagePrompt`, `sprite`, `scale`, `frames` per direzione), `physics`
(`solid`, `radius`, `pushable`, `mass`, `friction`, `speed`), `components`, `singleton`, `persist`,
`interaction` (`talk | read | lua`), `actions` (`id`, `label`, `requires`, `effects`), `container` (`size`, `loot`),
`ui` (pannello: `titolo`, `elementi`), `spawn`, `persona`, `unique`, `inventory` (id di oggetti), `item`, `context`, `lore`, `tags`, `drops`,
`origin`; generatori: `tiles` (`name`, `color`, `solid`, `layer`, `indoor`, `speed`, `texture`, `sprites`),
`roof`; dati: `items` (anche `container`, `actions`, `slot`, `bonus`, effetti `mana`), `recipes`, `loot`, `layouts`, `fragments`, `runes`, `spells`.

### API Lua — l'unica disponibile, il validatore rifiuta il resto
`ecs.each/get/set/spawn/destroy/first`; `world.free/free_real/tile/speed_at/spawn/player/player_pos/
nearest/has_tag/break_entity/say/speak/set_tile/open/make_container`; `inventory.add/remove/count/equipped`; `items.find/def/bonus`; `ui.slot`;
`input.held`; `bus.emit`; `log`; `hash`; `math string table utf8 pairs pcall…`.
Hook: `update(dt)` (sistemi), `generate_chunk`, `on_spawn(id)`, `on_interact(id, user)`,
`on_act(id, user, action)`, `on_use(user, item)`, `on_action(user, target, item)`, `on_slot(user, slot, item, panel)`, `on_ui(user, azione)`; `core.items.use(user, item)`;
`core.effects.apply(target, user, effect, x, y)`. Componenti noti: `luce {raggio, accesa, colore}`, `fuoco {raggio}`,
`effimero {fino}` (sparisce a tempo), `scudo {fino}`, `meta {x, y}` (dove va un NPC), `stati` (del viandante).
`bus.emit("morte", …)` da `sys.needs` chiude la sessione.

## Convenzioni

- Documentazione, UI, prompt degli agenti e testi di gioco in **italiano**; identificatori e commenti
  TypeScript in **inglese**; commenti Lua dell'universo in **italiano**. Prompt di immagine in inglese.
- File in LF (`.gitattributes`). Su Windows niente `Get-Content`/`Set-Content` di PowerShell 5.1 sui sorgenti.
- Nuova API per Lua: `Host` + `prelude.lua` + `LUA_API` nel validatore + prompt dell'Ingegnere + questo file.
- Nuovo compito per un agente: schema Gemini + risposta in `MockModels` + voce nel registro.
- Prima di consegnare: `npm test` e `npm run typecheck` verdi.

## Costi e prestazioni

- **Registro dei consumi** (ADR-0039): ogni chiamata passa da `kernel.usage` (per giorno, modello e compito, in token e
  dollari, cache e ragionamento compresi) e va in `world/consumi.json` con ogni commit; il costo è nel pannello del
  Concilio (`G`). `GeminiModels` non ripete mai una richiesta scaduta (può essere stata pagata); ripete solo 429/5xx.

- Testo per mondo: Genesi ~60 chiamate; poi 1 per luogo, 1-2 per individuo, ~4 per pacchetto di oggetti.
- Immagini per mondo: ~3 texture, 1-2 ostacoli, 1-2 per tipo di personaggio o oggetto (sprite +
  camminata), 1 ogni 16 icone. Nessuna immagine per luogo.
- Misurato (Genesi + ~20 luoghi + l'Artista che dipinge tutto + una chat): 127 chiamate di testo, 25 immagini
  (12 texture in 3 immagini, 9 sprite con 4 camminate, 87 icone in 6 fogli), ~5 minuti.
- Tick ≈ 5 ms in Node con ~100 entità (`sys.wander` il più costoso); budget di istruzioni Lua ~1.5×.
- Lezione ricorrente: i modelli non contano caratteri né caselle. Il kernel ripara le forme (griglie,
  regole dei programmi, nomi nelle ricette) e posiziona le cose; si scarta solo ciò che non si capisce.

## Stato e prossimi passi

> **Decisione (ADR-0037, step 8.2C): si passa al 3D.** Il rendering 2D (tile con texture, sprite, Atelier e
> ArtDirector che dipingono, scontorno) si toglie su un branch nuovo nello step 9; gli asset diventano programmi
> MarkovJunior (ADR-0036); lo spazio è una scala di griglie (regione → piano → modello → corpi,
> [`docs/plans/universo-continuo.md`](docs/plans/universo-continuo.md)); i costi seguono
> [`docs/reports/costi-step8.2B.md`](docs/reports/costi-step8.2B.md). Il prompt dello step 9 è in
> [`docs/userchats/step9-3d.md`](docs/userchats/step9-3d.md); il piano, con il diario delle fasi, in
> [`docs/plans/step9-3d.md`](docs/plans/step9-3d.md) (branch `3d`). Finché lo step 9 non è fatto, quanto sotto
> descrive ancora il gioco 2D.

Fatto: kernel, sandbox, rune (una per casella, rare), tappeto, corona nascosta e organizzata come archivio
con il Concilio che vi lavora, versionamento, Concilio su Gemini, mappe a tile senza cuciture con layout a
regole e connettività garantita, interni con tetti, contenuti come dati (pacchetti, bottino, contenitori,
ricette, bisogni), menu delle azioni con azioni libere giudicate dal Concilio e imparate dagli oggetti,
effetti, magia e incantesimi, fuoco, giorno e notte, individui con abiti propri, varietà di persone,
oggetti citati, Atelier few-shot con camminate, icone a fogli, riparazione automatica, rune come oggetti
con borsa e frase, mana e cristalli, borse nell'inventario, regole nate dal gioco, fabbricazione libera,
società degli NPC con famiglie e routine, sessioni del Concilio, test.

Fatto anche: due repository (seme del kernel + universo git su disco), stato della partita salvato,
menu delle caselle, prospettiva 3/4, meccaniche con pannelli generate dal Concilio (equipaggiamento),
studio della corona con squadre e Referente, atlante e timbri, biomi, vita degli NPC con trame e missioni.

Prossimi passi suggeriti:
1. Interni del mondo come zone separate (case più grandi dentro), come già nello studio.
2. Notte con conseguenze (NPC che dormono, creature notturne); luce delle lanterne impugnate.
3. Personaggi con iniziativa (orari, mestieri, scambi tra loro) e quest generate.
4. Port più ampio di MarkovJunior (campi, WFC) per interni complessi; interni come zone separate.
5. Multiplayer con un master: piano e punti aperti in [`docs/plans/multiplayer.md`](docs/plans/multiplayer.md).
