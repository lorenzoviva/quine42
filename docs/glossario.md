# Il glossario di QUINE42

Un nome per ogni concetto (ADR-0117). Il titolo di ogni voce è il **nome ufficiale in italiano**: quello di documenti, UI e prompt.
**Inglese** è il nome nel codice: il primo della lista è la forma base, gli altri sono i tipi e le funzioni che lo portano. **Da non usare**
sono i sinonimi da non scrivere più nel lavoro nuovo: ciò che c'è già resta finché un task di rinomina non lo cambia (qui sotto, «Le
rinomine»). **Fermo** sono i nomi che non si cambiano senza una migrazione: vanno scritti così anche se non sono ufficiali.
Finché una rinomina non è fatta, **Inglese** dice il nome di oggi e, fra parentesi e senza apici, quello d'arrivo con la sua R: un nome entra tra gli apici con la rinomina che lo crea.

`tests/glossario.test.ts` controlla che ogni voce abbia i suoi campi e che i nomi e i file citati esistano. Il conteggio dei sinonimi è in
[`glossario-censimento.md`](glossario-censimento.md), rifatto da `node tools/glossario/glossario.mjs`.

## La regola

- **Un concetto nuovo ha una voce qui nello stesso commit**; prima di coniare un nome si cerca se la voce c'è.
- **Codice**: identificatori e commenti TypeScript in inglese, con il nome di questo file. Pochi nomi propri restano uguali nelle due lingue (`corona`, `master`, `lobby`, `kernel`). **Nessun'altra eccezione**: quelle che ADR-0117 dice (`Taglia`, `Partita`) l'autore le ha tolte (scelta 6).
- **Dati**: ciò che finisce su disco, sul filo o nei prompt resta com'è (spesso in italiano) finché non lo porta in inglese il suo passo di ADR-0153, con la migrazione del suo contratto: è un formato, non uno stile. **Un nome nuovo** su disco, sul filo o visibile a Lua **nasce inglese** (la lingua interna); i token delle rune magiche sono latini; il testo del mondo è nella lingua del suo universo.
- **Italiano**: nei documenti, nella UI e nei prompt il nome ufficiale; dentro il mondo (bibbia, dialoghi) i termini tecnici non esistono comunque (ADR-0025).
- **Gli ADR sono storia**: non si riscrivono per cambiare un nome.

## Ciò che non si rinomina senza una migrazione

Queste migrazioni le fa lo step 42 (ADR-0153): T307a, T307b, T308a e T308b, un contratto ciascuno; il nome d'arrivo di ogni voce è nella tabella di [`lingua-interna.md`](lingua-interna.md) (`src/kernel/internalNames.ts`). Finché un passo non è fatto, il «Fermo» delle voci qui sotto vale com'è.

| Che cosa | Dove | Perché | Che cosa costa |
|---|---|---|---|
| Campi JSON degli universi | manifest (`tiles`, `layouts`, `items`), `universe.json` (`chunkSize`, `placesPerMinute`, `maxCast`, `partita`), `world/*.json` (`legami`, `ricordi`, `scheda`), `maps/` (`place`, `layout`, `strutture`, `scavi`), carte (`carta`, `titolare`, `pagante`) | ogni universo su disco li ha nella sua storia git | lettura che accetta i due nomi (come `readPeople`), più un aggiornamento dal seme |
| Componenti delle entità | `src/session/protocol.ts` (`ENTITY_PARTS`), `stato.json`, codice Lua (`hand`, `luce`, `fuoco`, `attivita`, `stati`, `meta`) | salvati nello stato e letti dai moduli generati | migrazione dello stato e del Lua generato |
| API Lua e hook | `LUA_API` in `src/kernel/validator.ts`, `prelude.lua`, prompt dell'Ingegnere (`world.player`, `world.player_pos`, `generate_chunk`, `on_act`) | il Lua generato negli universi li chiama, il validatore rifiuta il resto | un alias per sempre: **sconsigliato** |
| Nomi nel validatore e negli schemi | effetti (`crea_oggetto`, `togli_stato`), categorie, `AgentId`, compiti (`npc.reply`, `npc.sheet`), risposte dei modelli (`usa_ambiente`, `richiesta_fucina`) | stanno nei file generati, nei prompt, in `world/consumi.json` | prompt, schemi e validatore insieme, più i file vecchi |
| Messaggi del protocollo | `src/session/protocol.ts` (`entra`, `passo`, `incidi`, `viandanti`, `cose`, `luoghi`) | client e server parlano così | nessun dato; client e server vanno rilasciati insieme |
| Indirizzi | `/api/viandante`, `/api/crediti`, `?viandante=`, `?universo=`, chiavi di `localStorage` (`rune:profilo:`), `window.rune` | link, profili dei browser, abitudini | redirect o doppia lettura |

## Il mondo e lo spazio

### Universo
- **Inglese**: `universe`, `UniverseConfig`
- **Definizione**: il repository git di un mondo: moduli, modelli, prompt, stato e storia.
- **Dove vive**: `universes/<nome>/`, `server/universeStore.ts`, `src/kernel/universes.ts`
- **Da non usare**: `reame` (per l'universo, vedi «Reame»), `realm` (idem)
- **Fermo**: `?universo=`, messaggi e URL che dicono `universo`.

### Universo seme
- **Inglese**: `upgradeFromSeed`, `seedHashes`
- **Definizione**: la cartella `universe/` del kernel, immutabile, da cui nasce ogni universo e da cui arrivano gli aggiornamenti.
- **Dove vive**: `universe/`, `src/kernel/universes.ts`
- **Da non usare**: nessuno (dire «il seme» da solo è ambiguo con «Seme»)

### Fila delle scritture
- **Inglese**: `OwedWrite`, `OwedStorage`, `browserOwedStorage`, `renewAuth`
- **Definizione**: le scritture sull'universo che il server non ha ancora preso (commit, piani, rami, pubblicazioni), in ordine; nel browser sopravvive a una ricarica, ha un tetto (ADR-0122, ADR-0144).
- **Dove vive**: `src/kernel/universes.ts` (`UniverseClient`), `localStorage` `quine:fila:<universo>:<scheda>`
- **Da non usare**: `coda dei commit` (non ha solo commit; «coda» è quella degli abbonamenti)
- **Fermo**: la chiave `quine:fila:` e la forma delle scritture salvate.

### Seme
- **Inglese**: `seed`, `seedLua`, `rngFor`
- **Definizione**: il numero da cui escono le estrazioni: quello dell'universo e quello che fa di un modello un'istanza.
- **Dove vive**: `src/kernel/rng.ts`, `src/kernel/forms.ts`
- **Da non usare**: nessuno

### Mondo
- **Inglese**: `world`, `worldProgram`, `WorldHost`
- **Definizione**: la simulazione che gira da un universo: entità, tempo, viandanti collegati.
- **Dove vive**: `src/kernel/kernel.ts`, `src/session/worldProcess.ts`, `server/worldHost.ts`
- **Da non usare**: nessuno
- **Fermo**: la cartella `world/` dell'universo e il namespace Lua `world`.

### Partita
- **Inglese**: `GameSetup`, `repairGameSetup`, `game`
- **Definizione**: come si gioca in un universo, scelto alla Genesi e fisso: modalità, morte, PvP, master.
- **Dove vive**: `src/kernel/gameSetup.ts`, `universe.json → partita`
- **Da non usare**: `game of many` (si dice «multigiocatore»), `Partita`, `repairPartita`, `partitaSummary`, `DEFAULT_PARTITA`
- **Fermo**: `partita`, `modalita`, `altroTraGiocatori`.

### Multigiocatore
- **Inglese**: `multiplayer`, `manyPlayers`
- **Definizione**: la modalità in cui il mondo gira sul server e ogni viandante è su un client; il contrario di «singola».
- **Dove vive**: `src/session/server.ts`, `universe.json → partita.modalita`
- **Da non usare**: `partita di molti`, `game of many`
- **Fermo**: il valore `multigiocatore` di `modalita`.

### Sessione
- **Inglese**: `session`, `SessionServer`, `SessionClient`
- **Definizione**: la connessione di un client a un mondo di un multigiocatore (`/api/session`).
- **Dove vive**: `src/session/`, `server/session.ts`
- **Da non usare**: nessuno (per le altre sessioni: «Sessione del Concilio»)

### Luogo
- **Inglese**: `chunk`, `Chunk`, `ChunkInfo`, `ChunkView`, `ChunkLot`, `ChunkMiniature`, `GraphChunk`, `chunkSize`, `planChunk`, `chunkHere`, `chunkCardId`
- **Definizione**: il quadrato di 18 × 18 caselle: l'unità con cui il mondo si genera, si salva e si carica.
- **Dove vive**: `src/kernel/kernel.ts`, `src/kernel/chunks.ts`, `src/kernel/layout.ts`
- **Da non usare**: `place` (nel codice), `chunk` (nei documenti e nella UI), `Place`, `PlaceView`, `PlaceLot`, `PlaceMiniature`, `GraphPlace`, `placeHere`, `placeCardId`
- **Fermo**: `chunkSize`, `generate_chunk`, `placesPerMinute`, `plan.place` in `maps/`, `Chunk.place`, `luoghi` del protocollo.

### Piano del luogo
- **Inglese**: `plan`, `ChunkPlan`, `planOf`
- **Definizione**: ciò che il Cartografo decide di un luogo: ambiente, nome, cose, rune, strutture.
- **Dove vive**: `src/kernel/agents/cartography.ts`, `maps/` dell'universo
- **Da non usare**: `mappa`, `piano` (da solo: è anche di un edificio)

### Bozza
- **Inglese**: `draft`, `sampleDrafts`
- **Definizione**: il luogo come esce dal generatore continuo in Lua, prima del piano.
- **Dove vive**: `src/kernel/kernel.ts`, `Chunk.draft`
- **Da non usare**: nessuno
- **Fermo**: il valore `draft` di `stage`.

### Layout
- **Inglese**: `layout`, `LayoutResult`
- **Definizione**: la procedura che porta una bozza al luogo finito: varchi, programma, sentieri, edifici del piano.
- **Dove vive**: `src/kernel/layout.ts`
- **Da non usare**: nessuno (`layouts` dei manifest sono gli ambienti: vedi «Ambiente»)

### Casella
- **Inglese**: `tile`, `tileAt`, `setTile`, `tileOf`, `tileIndex`, `tileNear`, `polarTile`, `CoronaTile`, `freeTile`, `freeTiles`, `runeTiles`, `solidTiles`, `propTiles`, `doorTiles`
- **Definizione**: l'unità del mondo: un'unità di three.js, una casella di terreno.
- **Dove vive**: `src/kernel/kernel.ts`, `src/render/terrain.ts`
- **Da non usare**: `cell` (per il mondo), `cella` (idem), `freeCell`, `freeCells`, `runeCells`, `solidCells`, `cellNear`, `propCells`, `doorCells`, `cellOf`, `cellIndex`, `polarCell`, `CoronaCell`
- **Fermo**: `world.tile`, `world.set_tile`, `tiles` nei manifest e in `ChunkView`.

### Cella
- **Inglese**: `cell`, `cells`
- **Definizione**: un posto della griglia di un programma MarkovJunior o di un modello; una cella piena è un voxel.
- **Dove vive**: `src/mj/engine.ts`, `src/kernel/forms.ts`
- **Da non usare**: nessuno

### Voxel
- **Inglese**: `voxel`, `voxels`, `vpt`
- **Definizione**: il cubetto di cui è fatto un modello; quanti per casella lo dice `vpt` (20 se non detto).
- **Dove vive**: `src/mj/mesh.ts`, `src/kernel/forms.ts`
- **Da non usare**: nessuno

### Terreno
- **Inglese**: `terrain`, `TerrainDef`, `TerrainLayer`
- **Definizione**: il tipo di una casella: nome, colore, strato, se blocca, azioni imparate. Dal contratto 0.2 un terreno del seme ha un `id` interno (`meadow`) e un `name` nella lingua del mondo («prato»); il codice e Lua lo cercano per codice, id o nome (`tileCodeOf`).
- **Dove vive**: `src/kernel/types.ts`, i moduli `generator` dell'universo
- **Da non usare**: `tile` (per il tipo), `TileDef`, `TileLayer`
- **Fermo**: `tiles` nei manifest, `TerrainDef.layer`.

### Ambiente
- **Inglese**: `environment`, `EnvironmentDraft`, `EnvironmentDef`, `environmentsFor`
- **Definizione**: un programma di riscrittura che dà forma a un luogo (bosco, villaggio…), scritto dal Cartografo.
- **Dove vive**: `src/kernel/types.ts`, `src/kernel/agents/cartography.ts`, `manifest → layouts`
- **Da non usare**: `layout`, `LayoutDef`, `layoutsFor` (per l'ambiente), `bioma` (è un'altra cosa: le lettere del generatore)
- **Fermo**: `layouts` nei manifest, `layout` in `maps/`, `usa_ambiente`.

### Lotto
- **Inglese**: `lot`, `Lot`, `lots`, `findLots`, `lotAt`, `LotBox` (la sola scatola)
- **Definizione**: il rettangolo piano di un luogo su cui sta una struttura.
- **Dove vive**: `src/kernel/relief.ts`, `src/kernel/layout.ts`
- **Da non usare**: `building`, `Building`, `buildings`, `findBuildings`, `buildingAt` (per il lotto: sono l'edificio dello studio)
- **Fermo**: `lotti` del protocollo.

### Varco
- **Inglese**: `gate`, `gates`, `gateTiles`
- **Definizione**: il punto del bordo di un luogo per cui si passa nel vicino, deterministico.
- **Dove vive**: `src/kernel/layout.ts`
- **Da non usare**: `gateCells`

### Sentiero
- **Inglese**: `carvePath`, `carved`
- **Definizione**: il passaggio che il kernel scava perché ogni luogo sia connesso.
- **Dove vive**: `src/kernel/layout.ts`
- **Da non usare**: nessuno

### Rilievo
- **Inglese**: `relief`, `Relief`, `groundAt`
- **Definizione**: le altezze del terreno: a ogni casella un livello, dal programma `Hills`.
- **Dove vive**: `src/kernel/relief.ts`
- **Da non usare**: nessuno
- **Fermo**: `rilievo` in `universe.json` e nell'effetto.

### Livello
- **Inglese**: `level`, `levels`, `seaLevel`, `chunkLevels`
- **Definizione**: l'unità di altezza del suolo, un quarto di casella.
- **Dove vive**: `src/kernel/relief.ts`
- **Da non usare**: nessuno (`Form.levels` sono i pavimenti di una colonna: vedi «Gli omonimi»)

### Zona
- **Inglese**: `zoneOf`
- **Definizione**: un'area di 56 × 56 luoghi, con al più una struttura Enorme.
- **Dove vive**: `src/kernel/kernel.ts`
- **Da non usare**: nessuno (`kernel.zone`, che dice se si è in `sim`, `corona` o `studio`, è un omonimo)

### Reame
- **Inglese**: `realm`, `realmOf`
- **Definizione**: 4 × 4 zone, con al più una struttura Gargantuesca.
- **Dove vive**: `src/kernel/kernel.ts`
- **Da non usare**: nessuno (il sito diceva così per «universo» fino alla rinomina R15; ne resta l'ancora `#reami`, ferma)

### Regione
- **Inglese**: `Region`, `region`, `placeRegion`
- **Definizione**: una zona con un nome sull'atlante; la geografia che individui e Cartografo conoscono.
- **Dove vive**: `src/kernel/atlas.ts`, `world/atlas.json`
- **Da non usare**: nessuno

### Atlante
- **Inglese**: `atlas`, `Atlas`
- **Definizione**: le regioni geolocalizzate del mondo e le direzioni tra loro.
- **Dove vive**: `src/kernel/atlas.ts`, `src/ui/atlas.ts`
- **Da non usare**: nessuno

### Cerchio
- **Inglese**: `circleRadius`
- **Definizione**: il cerchio di simulazione, raggio 42, fermo in (0,0), in cui il viandante vive.
- **Dove vive**: `universe.json`, `src/kernel/kernel.ts`
- **Da non usare**: nessuno

### Tappeto
- **Inglese**: `carpet`, `carpetLine`, `holdCarpet`
- **Definizione**: lo scorrimento che compensa ogni passo del viandante e lo riporta al centro; ognuno ha il suo.
- **Dove vive**: `universe/modules/core.carpet/`, `src/kernel/kernel.ts`
- **Da non usare**: nessuno
- **Fermo**: il binding `carpet` delle rune, `core.carpet`.

### Corona
- **Inglese**: `corona`, `Corona`, `coronaRevealed`, `coronaShown`, `coronaNear`, `coronaNearby`
- **Definizione**: ciò che sta attorno al cerchio, invisibile finché il tappeto tiene: il codice dell'universo come studio.
- **Dove vive**: `src/kernel/corona.ts`, `src/render/corona3d.ts`
- **Da non usare**: `crown`, `anello`

### Studio
- **Inglese**: `studio`, `StudioItem`
- **Definizione**: la software house della corona; come zona (`kernel.zone`), gli interni dei suoi edifici.
- **Dove vive**: `src/kernel/corona.ts`, `src/ui/studio.ts`
- **Da non usare**: nessuno

### Campus
- **Inglese**: `CAMPUS`, `CampusStructure`, `CampusProp`, `placeCampus`
- **Definizione**: l'esterno dello studio: l'anello con viale, edifici, prati e arredi.
- **Dove vive**: `src/kernel/corona.ts`
- **Da non usare**: nessuno

### Edificio
- **Inglese**: `Building`, `building`, `buildingOf`
- **Definizione**: una casa dello studio, una per cartella dell'universo, con interni su più piani.
- **Dove vive**: `src/kernel/corona.ts`
- **Da non usare**: `edificio` (per ciò che sta in un luogo: è una «Struttura»)

### Piano
- **Inglese**: `Storey`, `storeys`
- **Definizione**: un livello di un edificio dello studio, con le sue stanze.
- **Dove vive**: `src/kernel/corona.ts`
- **Da non usare**: `Floor`, `floors` (`floor` è «Pavimento»: vedi «Gli omonimi»)

### Pavimento
- **Inglese**: `floorAt`, `floorBelow`, `floors`, `surfaces`
- **Definizione**: la superficie su cui un corpo sta, in quella colonna e a quell'altezza; nelle strutture un tratto di pavimento su una colonna.
- **Dove vive**: `src/kernel/forms.ts`, `src/kernel/kernel.ts`
- **Da non usare**: nessuno
- **Fermo**: lo strato `floor` di `TerrainLayer`.

### Lettera del suolo
- **Inglese**: `soil`, `soilAt`
- **Definizione**: la lettera che un programma nomina con `suolo` e che il kernel scrive sullo strato `base`, prima che parta: dice dov'è il suolo del mondo, a ogni taglia.
- **Dove vive**: `src/mj/engine.ts`, `src/mj/model.ts`, `src/kernel/forms.ts`
- **Da non usare**: nessuno
- **Fermo**: l'attributo `suolo` nei programmi.

### Cantina
- **Inglese**: `cellar`, `cellarOf`, `sunk`
- **Definizione**: la parte di una struttura sotto il suolo, con il buco nel terreno (`Form.hole`).
- **Dove vive**: `src/kernel/forms.ts`, `src/kernel/kernel.ts`
- **Da non usare**: `sottoOf`
- **Fermo**: `sotto` nelle voci dei modelli e nel piano.

### Dispositivo
- **Inglese**: `device`, `DEVICE_MARGIN`, `DEVICE_SLOTS`
- **Definizione**: ciò che sta al centro di un piano terra dello studio: vetrina, grafo, tavolo, banco.
- **Dove vive**: `src/kernel/corona.ts`
- **Da non usare**: nessuno

### Vetrina
- **Inglese**: `showcase`, `SHOWCASES`, `stepShowcase`, `showcaseOf`
- **Definizione**: il dispositivo che mostra uno per uno i contenuti di un edificio: schermo, silos, stampante, plastico.
- **Dove vive**: `src/kernel/corona.ts`
- **Da non usare**: nessuno

## Le cose del mondo

### Entità
- **Inglese**: `entity`, `ecs`, `EntityView`, `ENTITY_PARTS`, `Entities`
- **Definizione**: qualunque cosa nel mondo: un id con i suoi componenti.
- **Dove vive**: `src/kernel/ecs.ts`
- **Da non usare**: `thing`, `ThingView`, `THING_PARTS`, `Things`, `cosa` (come termine tecnico; nel testo comune «cosa» resta una parola italiana)
- **Fermo**: `ecs.*` di Lua, `entita` e `cose` del protocollo, `cose` nei prompt del Cartografo.

### Componente
- **Inglese**: `component`, `components`
- **Definizione**: un dato con un nome su un'entità: la logica è stateless, lo stato sta qui.
- **Dove vive**: `src/kernel/ecs.ts`
- **Da non usare**: nessuno
- **Fermo**: i nomi dei componenti (`luce`, `meta`, `hand`, `form`…).

### Modulo
- **Inglese**: `module`, `Manifest`, `ModuleEntry`, `ModuleKind`
- **Definizione**: un contenuto autosufficiente dell'universo: `manifest.json` e, se serve, `logic.lua`.
- **Dove vive**: `universe/modules/`, `src/kernel/types.ts`
- **Da non usare**: `mod`
- **Fermo**: i valori di `kind` (compreso `player`).

### Magazzino
- **Inglese**: `ModuleStores`, `stores`, `store_get`, `store_set`, `STORE_DIR`
- **Definizione**: ciò che un modulo tiene da un'apertura del mondo all'altra e che non è una casella (un prezzo, un contatore, un tabellone), sotto chiavi semplici, in un file per modulo, con un tetto in byte per modulo e per universo (T245a, ADR-0138). Ogni modulo vede solo il suo; non va mai ai client.
- **Dove vive**: `src/kernel/store.ts`, `world/magazzino/<modulo>.json`
- **Da non usare**: `store` (nei documenti e nella UI), `deposito` (per il magazzino di un modulo), `memoria del modulo`
- **Fermo**: `world.store_get`, `world.store_set`, la cartella `world/magazzino/`.

### Sistema
- **Inglese**: `system`
- **Definizione**: un modulo con `update(dt)`, eseguito a ogni tick nell'ordine di `order`.
- **Dove vive**: `src/kernel/kernel.ts`, moduli `sys.*` e `core.*`
- **Da non usare**: nessuno

### Meccanica
- **Inglese**: `mechanic`, `MechanicDraft`, `forgeMechanic`
- **Definizione**: un sistema nato dal Concilio, spesso con un pannello.
- **Dove vive**: `src/kernel/agents/mechanics.ts`, moduli `mech.*`
- **Da non usare**: nessuno

### Pannello
- **Inglese**: `panel`, `UiPanel`
- **Definizione**: la scheda dell'inventario di una meccanica: slot, barre, testi, pulsanti.
- **Dove vive**: `src/kernel/types.ts`, `src/ui/inventory.ts`
- **Da non usare**: nessuno (anche i pannelli dello studio si chiamano così: `ui:showcase`)

### Struttura
- **Inglese**: `structure`, `structureAt`, `placeStructure`
- **Definizione**: un'entità che è un modello intero in cui si entra, posata su un lotto di un luogo.
- **Dove vive**: `src/kernel/kernel.ts`, `src/kernel/forms.ts`
- **Da non usare**: `edificio` (nel mondo: è dello studio), `building` (idem)
- **Fermo**: `struttura`, `strutture`, `struttura-<concetto>`, la classe `struttura`.

### Modello
- **Inglese**: `model`, `ModelInfo`, `maxModels`
- **Definizione**: una voce della libreria `models/`: un programma per tipo di cosa, con la sua classe e taglia.
- **Dove vive**: `src/kernel/forms.ts`, `src/kernel/modeldirector.ts`, `models/` dell'universo
- **Da non usare**: `modello` (per Gemini: vedi «Modello di IA»)
- **Fermo**: `appearance.model`, `models/index.json`.

### Programma
- **Inglese**: `program`, `checkProgram`, `repairProgram`
- **Definizione**: il testo MarkovJunior (XML) di un modello o di un ambiente.
- **Dove vive**: `src/mj/`, `src/kernel/mj.ts`
- **Da non usare**: `codice` (è il Lua), `xml` (nei documenti)

### Programma sonoro
- **Inglese**: `SOUND_CLASS`, `soundPrograms`, `SoundSettings`, `soundSettings`
- **Definizione**: un programma con `<sound>` sulla radice: la sua griglia si ascolta invece di guardarla; sta in `models/` con la classe `suono`.
- **Dove vive**: `src/mj/sound.ts`, `universe/models/`
- **Da non usare**: `preset` (per il programma nell'universo: i preset sono solo i quattro venuti dal SoundLab)

### Partitura
- **Inglese**: `Score`, `ScoreEvent`, `scoreOf`, `scoreOfProgram`
- **Definizione**: gli eventi che una griglia sonora dice: X il tempo, Y la traccia, Z l'altezza, la lettera il tipo.
- **Dove vive**: `src/mj/sound.ts`
- **Da non usare**: `spartito`, `piano roll`

### Sintetizzatore
- **Inglese**: `renderScore`, `RenderedSound`, `renderSoundProgram`
- **Definizione**: la funzione pura partitura + seme → campioni, l'unica fonte del suono del gioco.
- **Dove vive**: `src/mj/synth.ts`
- **Da non usare**: `SoundEngine` (il motore Web Audio del mockup)

### Direttore del suono
- **Inglese**: `SoundDirector`, `chooseMusic`, `SoundState`, `SOUND_CUES`
- **Definizione**: ciò che nel client decide quale brano suona dallo stato del mondo e quale effetto risponde a un momento del gioco; non produce suono.
- **Dove vive**: `src/audio/director.ts`
- **Da non usare**: `jukebox`, `mixer`

### Uscita del suono
- **Inglese**: `Sfx`, `SoundOut`, `SoundPrefs`
- **Definizione**: il tratto fra i campioni già fatti e gli altoparlanti: dissolvenze, volume, muto, l'analizzatore; niente voci.
- **Dove vive**: `src/audio/sfx.ts`
- **Da non usare**: `AudioManager`

### Ritocco
- **Inglese**: `retouch`, `retouchBoxes`, `withoutRetouches`, `retouchCount`
- **Definizione**: ciò che il piano roll del SoundLab cambia rispetto alle regole, scritto nel programma sonoro come `<box>` in fondo alla `<sequence>` radice.
- **Dove vive**: `lab/suono/logic.ts`
- **Da non usare**: `patch`, `correzione` (per questo blocco)

### Analisi del suono
- **Inglese**: `analyzeSound`, `SoundReport`, `SoundIssue`, `SoundDefect`, `SOUND_THRESHOLDS`, `soundReportText`
- **Definizione**: ciò che un programma sonoro suona e cosa non va, misurato dalla partitura e dai campioni, con le soglie che dicono i difetti (`vuoto`, `piatto`, `ripetitivo`, `stonato`, `fuori volume`, `giuntura`).
- **Dove vive**: `src/mj/soundanalysis.ts`, `lab/scripts/mjx-sound.ts`
- **Da non usare**: `check audio`, `QA del suono`

### Forma
- **Inglese**: `Form`, `FormResult`, `FormComp`, `FormView`, `FormRunner`
- **Definizione**: ciò che esce da programma più seme più scatola: griglia, impronta, pavimenti, azioni.
- **Dove vive**: `src/kernel/forms.ts`, `src/render/forms.ts`
- **Da non usare**: nessuno (i modelli `forma-…` degli oggetti sono modelli, con un nome storico)
- **Fermo**: il componente `form`, `forma` del protocollo, gli id `forma-…`.

### Inchiostro
- **Inglese**: `Ink`, `idsOf`, `thingOf`; nelle foto dei modelli `inkRaster`
- **Definizione**: i contorni della grafica a cartone: una riga scura dove cambia la cosa o la parte, o dove la profondità salta (ADR-0093).
- **Dove vive**: `src/render/cartoon.ts`, `src/render/materials.ts`, `src/mj/photo.ts`
- **Da non usare**: `outline`, `bordo` (per questa riga)

### Interruttore dell'aspetto
- **Inglese**: `cartoonOn`, `CARTOON`
- **Definizione**: la scelta tra il cartone, il predefinito, e l'aspetto classico: nel gioco si decide una volta dall'URL (`?classica`), nel laboratorio anche dal vivo con un bottone (ADR-0093).
- **Dove vive**: `src/render/cartoon.ts`, `lab/look.ts`
- **Da non usare**: nessuno
- **Fermo**: il parametro `?classica`.

### Parte di un modello
- **Inglese**: `partTable`, `part`
- **Definizione**: ciò che l'inchiostro separa dentro un modello: le lettere della palette che sono sfumature di un colore, o quelle di una stessa `<color part>`. Non è un arto: gli arti sono le `<color part>`, e questa ne è solo una conseguenza.
- **Dove vive**: `src/mj/mesh.ts`
- **Da non usare**: nessuno
- **Fermo**: `part` di `<color>`.

### Istanza
- **Inglese**: `instanceGrid`
- **Definizione**: un'entità con il modello del suo tipo e un seme suo.
- **Dove vive**: `src/kernel/forms.ts`
- **Da non usare**: nessuno

### Classe
- **Inglese**: `AssetClass`, `classOf`, `CLASSES`
- **Definizione**: ciò che dà a un modello la forma della scatola e il modello di IA che lo scolpisce (figura, struttura…).
- **Dove vive**: `src/mj/classes.ts`
- **Da non usare**: nessuno
- **Fermo**: `classe` nel manifest, nell'indice e nel piano.

### Taglia
- **Inglese**: `SizeTier`, `SIZE_TIERS`, `tilesOf`, `boxOf`
- **Definizione**: la scala di D&D, da minuscola a gargantuesca, per creature e strutture.
- **Dove vive**: `src/mj/classes.ts`
- **Da non usare**: `size` (da solo, per la taglia), `Taglia`, `TAGLIE`
- **Fermo**: `taglia` nei file e i suoi valori.

## Viandanti e individui

### Viandante
- **Inglese**: `wanderer`, `Wanderer`, `wanderers`, `wandererId`, `wandererEntity`, `wandererPos`, `wandererCarpet`, `wandererComp`, `wandererModule`, `wandererTile`, `wandererText`, `wandererPrompt`
- **Definizione**: il personaggio di chi gioca nel mondo, con un id stabile (`io` in singola).
- **Dove vive**: `src/kernel/wanderers.ts`, `world/giocatori/<id>.json`
- **Da non usare**: `player` (per il personaggio), `giocatore` (idem), `hero`, `playerPos`, `playerCarpet`, `playerId`, `playerComp`, `playerMod`, `playerCell`, `playerText`, `playerPrompt`
- **Fermo**: `world.player`, `world.player_pos`, `kind: player`, `core.player`, `world/giocatori/`, `viandante` nei file e nel protocollo.

### Giocatore
- **Inglese**: `player`, `players`, `PlayerSpot`, `playerFiles`
- **Definizione**: chi sta al client: chi è collegato; in multigiocatore, chi non è il master.
- **Dove vive**: `src/session/server.ts`, `src/session/files.ts`, `src/kernel/situation.ts`
- **Da non usare**: `player` (per il personaggio), `utente`
- **Fermo**: `giocatori` del protocollo, `altroTraGiocatori`.

### Master
- **Inglese**: `master`, `isMaster`
- **Definizione**: chi ha creato un universo multigiocatore: lo guida, fisso; in singola chi gioca.
- **Dove vive**: `src/kernel/gameSetup.ts`, `src/master.ts`, `universe.json → partita.master`
- **Da non usare**: `dio`, `admin`, `DM` (salvo il paragone con D&D)

### God mode
- **Inglese**: `godMode`, `keepGods`, `spareGods`
- **Definizione**: ciò che il master è nel mondo in multigiocatore: bisogni pieni, non muore, non lo si ferisce.
- **Dove vive**: `src/kernel/kernel.ts`
- **Da non usare**: `dio`, `modalità dio`

### Profilo
- **Inglese**: `Profile`, `repairProfile`, `setProfile`
- **Definizione**: come un viandante si presenta: nome, seme, tinta, presentazione.
- **Dove vive**: `src/kernel/wanderers.ts`, `src/ui/profile.ts`
- **Da non usare**: nessuno
- **Fermo**: `profilo` del protocollo, `rune:profilo:`.

### Individuo
- **Inglese**: `Individual`, `people`, `readPeople` (`people` e `readPeople` restano: dicono il file)
- **Definizione**: un membro della società: uomo o animale, con mestiere, famiglia, routine, legami.
- **Dove vive**: `src/kernel/society.ts`, `world/people.json`
- **Da non usare**: `npc` (per l'individuo), `persona` (idem: è il valore di `specie`), `person`, `Person`, `DialoguePerson`, `addPerson`, `updatePerson`, `personOf`, `personFacts`, `personByName`, `personNode`, `noPerson`
- **Fermo**: `world/people.json`, `persone`, il valore `persona` di `specie`, `npc.reply`, `npc.dialogue`, `npc.sheet`, `persona` nel manifest, `identity` e `mind` dei componenti.

### Programma di mestiere
- **Inglese**: `JobProgram`, `jobPrograms`, `validateJobProgram`, `matchJob`
- **Definizione**: com'è fatta la giornata di un mestiere, scritta una volta per mestiere e usata da ogni individuo che lo ha: i compiti di ogni fase, ognuno un comportamento con i suoi parametri (T245b, ADR-0140). Dati, mai codice.
- **Dove vive**: `src/kernel/jobs.ts`, `universe/modules/lavoro.contadino/manifest.json`
- **Da non usare**: `routine` (per il programma: la routine è il testo di oggi), `script`, `job`
- **Fermo**: `mestieri` nei manifest, `giornata`, `nomi`, `posto`, i componenti `mestiere`, `lavoro`, `carico`.

### Comportamento
- **Inglese**: `JOB_BEHAVIOURS`, `JobBehaviour`
- **Definizione**: uno dei compiti di un elenco chiuso (`vai`, `trasforma`, `raccogli`, `porta`, `produci`, `usa`…) che `sys.lavoro` sa fare e che cambia il mondo davvero (T245b, ADR-0140).
- **Dove vive**: `src/kernel/jobs.ts`, `universe/modules/sys.lavoro/logic.lua`
- **Da non usare**: `azione` (per il comportamento: l'azione è del viandante), `task`
- **Fermo**: i valori di `fa`.

### Deposito del luogo
- **Inglese**: `placeDeposit`
- **Definizione**: ciò che i mestieri di un luogo portano e prendono (il grano, i ciocchi, il pane), una voce `deposito:<cx>:<cy>` del magazzino di `sys.lavoro`; il luogo è quello a cui l'individuo appartiene (`mestiere.luogo`). Dura con la partita, non va ai client (T245c, ADR-0141).
- **Dove vive**: `universe/modules/sys.lavoro/logic.lua`, `src/kernel/kernel.ts`
- **Da non usare**: `magazzino` (per il deposito: il magazzino è di un modulo), `granaio`, `scorta`
- **Fermo**: la chiave `deposito:<cx>:<cy>`, `luogo` di `mestiere`.

### Impresa
- **Inglese**: `Venture`, `ventures`, `ventureProgress`, `ventureState`
- **Definizione**: un lavoro di molti verso un risultato che si vede, lungo giorni o mesi: una costruzione, un raccolto (e, con i task che le portano, una festa, una ricerca…). Ha fasi con materiali e lavoro, una squadra e uno stato; il progresso si ricava da ciò che è stato portato e lavorato, mai da un contatore (T245d, ADR-0147).
- **Dove vive**: `src/kernel/ventures.ts`, `src/kernel/kernel.ts`, `world/imprese.json`
- **Da non usare**: `progetto` (per l'impresa: il progetto è un documento), `cantiere` (è il posto dell'impresa e il suo pannello), `quest`, `obiettivo`, `job`
- **Fermo**: `world/imprese.json`, `imprese`, `fasi`, `materiali`, `lavoro`, `stadio`, `portati`, `lavorato`, `squadra`, `ruoli`, `nato_da`, i valori di `tipo` e di `stato`; l'API Lua `world.impresa`, `world.impresa_porta`; il comportamento `costruisci`.

### Squadra di un'impresa
- **Inglese**: `fillTeam`, `VentureMember`, `staffVentures`
- **Definizione**: chi lavora a un'impresa, con il suo ruolo (capomastro, manovale, mietitore): la fa il kernel per mestiere, vicinanza e un'estrazione del seme, e la rifà a ogni giorno nuovo (chi non c'è più se ne va, un altro prende il posto) (T245d, ADR-0147).
- **Dove vive**: `src/kernel/ventures.ts`
- **Da non usare**: `squadra` da sola dove si confonde con quella del Concilio nello studio, `team` (nei documenti), `gruppo`, `ciurma`
- **Fermo**: `squadra`, `ruolo`, `ruoli` in `world/imprese.json`.

### Stadio di un edificio
- **Inglese**: `stageGrid`, `stageHeights`, `stagedBody`, `stadio`
- **Definizione**: a che punto è un edificio che un'impresa costruisce, da 0 (il lotto segnato) a 1 (finito): la griglia del suo modello, finita, mostrata fino a una quota (il piano terra, i muri, il tetto), con il cantiere attorno (picchetti, impalcature) (T245e, ADR-0148).
- **Dove vive**: `src/mj/mesh.ts`, `src/render/models.ts`, `src/kernel/kernel.ts`
- **Da non usare**: `fase` (per lo stadio: la fase è dell'impresa), `livello` (è del rilievo), `step`, `stage` (nei documenti)
- **Fermo**: `stadio` nelle fasi di `world/imprese.json` e in `struttura`, `stadi` e `case` nel piano del luogo, `c.struttura.stadio` sul filo.

### Impalcatura
- **Inglese**: `SCAFFOLD_LETTER`, `STAKE_LETTER`, `site` (di `stageGrid`)
- **Definizione**: il cantiere che il kernel aggiunge attorno a un edificio che sale: i picchetti con la corda allo stadio 0, i pali e le tavole finché non è finito. Voxel derivati dalla griglia e dallo stadio, non un modello (T245e, ADR-0148).
- **Dove vive**: `src/mj/mesh.ts`
- **Da non usare**: `ponteggio`, `scaffold` (nei documenti)
- **Fermo**: le due lettere del cantiere.

### Contabilità fuori vista
- **Inglese**: `awayTick`, `dailyProduce`, `AWAY_WORK`
- **Definizione**: ciò che il kernel conta una volta al giorno per i luoghi che nessuno vede, senza Lua e senza chiamate: le imprese prendono dal deposito e vanno avanti del lavoro della squadra, i mestieri riempiono il deposito del loro luogo (T245f, ADR-0149).
- **Dove vive**: `src/kernel/kernel.ts`, `src/kernel/jobs.ts`
- **Da non usare**: `simulazione` (per la contabilità: nessuno simula), `offline`, `background`
- **Fermo**: nessuno.

### Ritorno
- **Inglese**: `returnToPlace`, `onReturn`, `on_return`
- **Definizione**: quando un luogo lasciato torna a caricarsi: ciò che matura matura per data, gli edifici prendono lo stadio delle loro imprese, e i moduli che lo chiedono sentono `on_return(luogo, trascorso)` (T245f, ADR-0149).
- **Dove vive**: `src/kernel/kernel.ts`
- **Da non usare**: `reload`, `ricarica` (per il ritorno: la ricarica è della pagina)
- **Fermo**: l'hook `on_return`, `visto` nel piano del luogo.

### Cantiere
- **Inglese**: `cantierePanels`, `posto` (dell'impresa)
- **Definizione**: dove un'impresa si lavora (`posto`), e il pannello «Il cantiere» che dice dell'impresa più vicina a che punto è, cosa manca e chi ci lavora (T245d, ADR-0147).
- **Dove vive**: `universe/modules/sys.lavoro/manifest.json` (`ui`), `src/kernel/kernel.ts`
- **Da non usare**: `impresa` (per il posto o il pannello), `sito`, `site` (nei documenti)
- **Fermo**: il pannello `cantiere`, i campi `cantiere.titolo`, `cantiere.fase`, `cantiere.stato`, `cantiere.manca`, `cantiere.squadra`, il pulsante `porta`.

### Maturazione
- **Inglese**: `matura`, `matureTick`
- **Definizione**: ciò che una casella diventa da sola dopo qualche giorno del mondo (il seminato in grano, la ceppaia in bosco), contato dal giorno in cui la casella è stata scritta (`plan.giorni`). La fa il kernel, non Lua (T245b, ADR-0140).
- **Dove vive**: `src/kernel/kernel.ts`, `universe/modules/world.terrain/manifest.json`
- **Da non usare**: `crescita` (per la maturazione), `ripen`
- **Fermo**: `matura {dopo, in}` nei `tiles`, `giorni` nel piano del luogo.

### Tipo di individuo
- **Inglese**: `persona`
- **Definizione**: il modulo `entity` con la `persona`, il modello e l'aspetto comuni, di cui ogni individuo è un'istanza.
- **Dove vive**: `src/kernel/types.ts`, `universe/modules/`
- **Da non usare**: nessuno

### Cast
- **Inglese**: `CastEntry`, `growCast`, `maxCast`
- **Definizione**: i primi abitanti e le prime cose che la Genesi chiede alla Fucina, e quelli che si aggiungono esplorando.
- **Dove vive**: `src/kernel/agents/genesis.ts`, `src/kernel/kernel.ts`
- **Da non usare**: nessuno
- **Fermo**: `maxCast`, il compito `genesis.cast`.

### Scheda
- **Inglese**: `sheet`, `IndividualSheet`, `ensureSheet`, `sheetFingerprint`
- **Definizione**: il foglio che il Narratore scrive di un individuo perché l'Attore la reciti.
- **Dove vive**: `src/kernel/society.ts`
- **Da non usare**: `Scheda` (nel codice)
- **Fermo**: `scheda` in `world/people.json`.

### Legame
- **Inglese**: `bond`, `bonds`, `bondWith`, `bondOf`
- **Definizione**: ciò che un individuo è per un altro o per un viandante, simmetrico e possibile per le specie.
- **Dove vive**: `src/kernel/society.ts`, `src/kernel/wanderers.ts`
- **Da non usare**: nessuno
- **Fermo**: `legami`, l'effetto `legame`.

### Ricordo
- **Inglese**: `memory`, `memories`, `memoriesFor`
- **Definizione**: ciò che un individuo ha vissuto, pesato e legato a un viandante.
- **Dove vive**: `src/kernel/society.ts`, `src/kernel/wanderers.ts`
- **Da non usare**: nessuno
- **Fermo**: `ricordi`, l'effetto `ricordo`.

### Trama
- **Inglese**: `Plot`, `plot`, `reviewPlot`
- **Definizione**: una storia orizzontale tra individui, a tappe, validata.
- **Dove vive**: `src/kernel/plots.ts`, `world/plots.json`
- **Da non usare**: `storia` (è di un individuo)

### Missione
- **Inglese**: `Quest`, `quest`, `quests`
- **Definizione**: ciò che una trama chiede a un viandante; sta nel suo diario.
- **Dove vive**: `src/kernel/plots.ts`, `src/ui/hud.ts`
- **Da non usare**: `quest` (nei documenti e nella UI)
- **Fermo**: `missione` nei file e nelle risposte del Narratore.

## Oggetti, azioni, bisogni

### Oggetto
- **Inglese**: `item`, `items`, `ItemDef`
- **Definizione**: ciò che si raccoglie e si porta, definito in un pacchetto di dati.
- **Dove vive**: `src/kernel/content.ts`, `src/kernel/types.ts`
- **Da non usare**: `cosa` (per ciò che si porta)
- **Fermo**: `items` nei manifest, l'API Lua `items`, l'effetto `crea_oggetto`, il messaggio `oggetto`.

### Tasca
- **Inglese**: `slot`, `slots`, `Slot`
- **Definizione**: un posto dell'inventario, con una pila; la barra rapida sono le prime.
- **Dove vive**: `src/kernel/inventory.ts`
- **Da non usare**: `pocket`
- **Fermo**: `slot` nel protocollo e in `on_slot`.

### Borsa
- **Inglese**: `bag`, `bagSlot`, `bagAccepts`
- **Definizione**: un oggetto che contiene oggetti; la borsa delle rune accetta `runa`.
- **Dove vive**: `src/kernel/inventory.ts`
- **Da non usare**: nessuno
- **Fermo**: `ItemDef.container`, `borsa` del protocollo.

### Contenitore
- **Inglese**: `container`, `make_container`, `ContainerView`
- **Definizione**: un'entità nel mondo che contiene oggetti.
- **Dove vive**: `src/kernel/kernel.ts`
- **Da non usare**: nessuno
- **Fermo**: il componente `container`, il messaggio `contenitore`.

### Mobile
- **Inglese**: `isFurniture`, `mobile` (la classe)
- **Definizione**: una cosa del mondo della classe `mobile` (cassa, banco, letto, credenza, barile, altare), solida e ferma: ci si posano gli oggetti.
- **Dove vive**: `src/kernel/kernel.ts`, `src/mj/classes.ts`
- **Da non usare**: `arredo`, `furniture` (nei documenti)
- **Fermo**: la classe `mobile` nell'indice dei modelli.

### Ripiano
- **Inglese**: `Support`, `shelvesOf`, `findSpot`, `Spot`
- **Definizione**: un pavimento della forma di un mobile sopra il suo suolo, dove si posa un oggetto; ne tiene tanti quante impronte ci stanno.
- **Dove vive**: `src/kernel/placing.ts`
- **Da non usare**: `piano` (da solo: è di un edificio e di un luogo), `superficie`

### Impronta di un oggetto
- **Inglese**: `ItemShape`, `itemShape`, `cellsOf`
- **Definizione**: il modello di un oggetto visto dall'alto: le sue colonne stanno sul ripiano, il loro rettangolo prende il posto.
- **Dove vive**: `src/kernel/placing.ts`
- **Da non usare**: `footprint` (è dove un corpo non passa, `Form.foot`)

### Oggetto posato
- **Inglese**: `placeOn`, `PlacedComp`, `PlacedRecord`, `restorePlaced`, `supportOf`
- **Definizione**: un oggetto che un viandante ha posato sul ripiano di un mobile: sta alla sua altezza, si raccoglie come da terra, resta nel salvataggio e per tutti.
- **Dove vive**: `src/kernel/placing.ts`, `src/kernel/kernel.ts`
- **Da non usare**: `appoggiato`
- **Fermo**: il componente `posato`, il campo `posati` di `world/stato.json`, l'azione `posa`.

### Bottino
- **Inglese**: `loot`, `LootTable`, `LootEntry`
- **Definizione**: le tabelle per tag da cui escono gli oggetti di un luogo o di un contenitore.
- **Dove vive**: `src/kernel/content.ts`, `src/kernel/types.ts`
- **Da non usare**: nessuno

### Ricetta
- **Inglese**: `Recipe`, `recipes`
- **Definizione**: ciò che con certi oggetti ne fa un altro.
- **Dove vive**: `src/kernel/content.ts`, `src/kernel/types.ts`
- **Da non usare**: `crafting` (per la ricetta; il gesto è «fabbricare»)
- **Fermo**: il messaggio `fabbrica`, `items.scoperte`.

### Bisogni
- **Inglese**: `needs`
- **Definizione**: i valori del corpo del viandante (salute, fame…, e il mana), tenuti da `sys.needs`.
- **Dove vive**: `universe/modules/sys.needs/`, `src/kernel/kernel.ts`
- **Da non usare**: nessuno
- **Fermo**: il componente `needs`, l'effetto `bisogni`.

### Stato
- **Inglese**: `stati`
- **Definizione**: un effetto a tempo sul viandante (velocità, peso, luce), con una durata.
- **Dove vive**: `src/kernel/kernel.ts`
- **Da non usare**: `status`, `buff`
- **Fermo**: il componente `stati`, gli effetti `stato` e `togli_stato`.

### Effetto
- **Inglese**: `Effect`, `applyEffects`, `core.effects`
- **Definizione**: una delle cose che possono accadere, da un insieme chiuso, validata dal kernel.
- **Dove vive**: `src/kernel/types.ts`, `src/kernel/validator.ts`, `universe/modules/core.effects/`
- **Da non usare**: nessuno
- **Fermo**: i nomi degli effetti.

### Azione
- **Inglese**: `ActionDef`, `action`, `perform`
- **Definizione**: una voce del menu di un'entità, di un oggetto o di una casella.
- **Dove vive**: `src/kernel/types.ts`, `src/ui/actions.ts`
- **Da non usare**: nessuno
- **Fermo**: il messaggio `azione`, le `<action>` dei programmi.

### Azione libera
- **Inglese**: `freeAction`, `judgeAction`
- **Definizione**: ciò che il viandante scrive in «Altro…» e il Concilio giudica.
- **Dove vive**: `src/kernel/kernel.ts`, `src/kernel/agents/effects.ts`
- **Da non usare**: nessuno (la voce del menu resta «Altro…»)
- **Fermo**: il messaggio `altro`.

## Rune e magia

### Runa
- **Inglese**: `rune`, `RuneComp`, `RuneFragment`
- **Definizione**: un token Lua vero, una lastra su una casella, un oggetto quando si raccoglie.
- **Dove vive**: `src/kernel/runes.ts`
- **Da non usare**: `simbolo`, `glifo` (è il suo disegno)
- **Fermo**: `rune:<token>`, `runa`, il componente `rune`.

### Runa magica
- **Inglese**: `MagicRune`, `magic.runes`, `validateNewRune`
- **Definizione**: una runa che si pronuncia e si consuma: `luce fuoco acqua terra vita scudo vento` e quelle nuove del Concilio. I token diventano latini, uguali in ogni lingua (ADR-0153, T307a): `lux ignis aqua terra vita scutum ventus`; il nome della runa (Sowilo) resta testo del mondo.
- **Dove vive**: `src/kernel/magic.ts`, `universe/modules/`
- **Da non usare**: nessuno

### Frase
- **Inglese**: `phrase`, `syncPhrase`
- **Definizione**: le rune scelte, in ordine, che si possono incidere o pronunciare.
- **Dove vive**: `src/kernel/kernel.ts`, `src/ui/inventory.ts`
- **Da non usare**: `hand` (nel codice nuovo), `syncHand`, `inscribeHand`, `sentence`, `mano`
- **Fermo**: il componente `hand` e `hand.tokens`, il messaggio `frase`.

### Riga
- **Inglese**: `line`, `set_line`, `run_line`, `carpetLine`
- **Definizione**: rune in fila sul terreno: una riga orizzontale di Lua eseguita a ogni tick.
- **Dove vive**: `src/kernel/runes.ts`, `src/kernel/prelude.lua`
- **Da non usare**: nessuno

### Incidere
- **Inglese**: `inscribe`, `inscribePhrase`
- **Definizione**: posare a terra la frase, che diventa una riga.
- **Dove vive**: `src/kernel/kernel.ts`
- **Da non usare**: `engrave`, `scrivere` (per le rune)
- **Fermo**: il messaggio `incidi`.

### Pronunciare
- **Inglese**: `castSpell`
- **Definizione**: dire le rune magiche della frase (`T`): diventano un incantesimo e si consumano.
- **Dove vive**: `src/kernel/kernel.ts`
- **Da non usare**: `lanciare`
- **Fermo**: il messaggio `pronuncia`.

### Incantesimo
- **Inglese**: `Spell`, `spell`, `nameSpell`, `SPELL_GUIDE`
- **Definizione**: una sequenza di rune magiche con il suo nome e i suoi effetti.
- **Dove vive**: `src/kernel/agents/effects.ts`, `src/kernel/types.ts`
- **Da non usare**: `magia` (è il sistema)
- **Fermo**: `magic.spells`, `spells` nei manifest.

### Canone
- **Inglese**: `canon`, `canonSummary`
- **Definizione**: ciò che è vero delle rune, che ogni storia deve rispettare.
- **Dove vive**: `world/canone.md`
- **Da non usare**: nessuno

### Lessico
- **Inglese**: `lexicon`, `lexiconSummary`, `glossaryBreak`
- **Definizione**: come parla la gente del mondo: parole sostituite, saluti, usanze.
- **Dove vive**: `world/lessico.md`, `src/kernel/fourthwall.ts`
- **Da non usare**: `glossario` (è questo file)

## Il Concilio

### Concilio
- **Inglese**: `council`, `Council`
- **Definizione**: gli agenti su Gemini che creano e fanno evolvere il mondo.
- **Dove vive**: `src/kernel/agents/council.ts`
- **Da non usare**: nessuno
- **Fermo**: il messaggio e la runa `concilio`.

### Agente
- **Inglese**: `agent`, `AgentId`, `AGENTS`
- **Definizione**: un membro del Concilio, con il suo prompt e i suoi compiti.
- **Dove vive**: `src/kernel/agents/council.ts`, `universe/prompts/agents/`
- **Da non usare**: nessuno
- **Fermo**: i valori di `AgentId`, in italiano.

### Narratore
- **Inglese**: `Narrator`, `narratore`
- **Definizione**: l'agente della bibbia, degli individui, dei pacchetti di oggetti e dei giudizi.
- **Dove vive**: `src/kernel/agents/minds.ts`, `src/kernel/agents/content.ts`
- **Da non usare**: nessuno

### Cartografo
- **Inglese**: `Cartographer`, `cartografo`
- **Definizione**: l'agente dei terreni, degli ambienti e dei piani dei luoghi.
- **Dove vive**: `src/kernel/agents/cartography.ts`
- **Da non usare**: nessuno

### Artista
- **Inglese**: `Artist`, `artista`
- **Definizione**: l'agente della guida di stile, che giudica le foto dei modelli.
- **Dove vive**: `src/kernel/agents/genesis.ts`, `src/kernel/agents/council.ts`
- **Da non usare**: nessuno

### Scultore
- **Inglese**: `Sculptor`, `scultore`, `SculptorAiModels`
- **Definizione**: l'agente che scrive i programmi dei modelli e le loro azioni.
- **Dove vive**: `src/kernel/agents/sculptor.ts`
- **Da non usare**: `SculptorModels`

### Fisico
- **Inglese**: `Physicist`, `fisico`
- **Definizione**: l'agente della fisica di moduli, terreni e oggetti.
- **Dove vive**: `src/kernel/agents/content.ts`, `src/kernel/agents/council.ts`
- **Da non usare**: nessuno

### Ingegnere
- **Inglese**: `Engineer`, `ingegnere`
- **Definizione**: l'agente del Lua: scrive `logic.lua` e le meccaniche, ripara ciò che fallisce.
- **Dove vive**: `src/kernel/agents/forge.ts`, `src/kernel/agents/mechanics.ts`
- **Da non usare**: nessuno

### Arbitro
- **Inglese**: `Arbiter`, `arbitro`
- **Definizione**: l'agente della coerenza, che rimanda all'agente responsabile e tiene le sessioni del Concilio.
- **Dove vive**: `src/kernel/agents/content.ts`, `src/kernel/agents/effects.ts`
- **Da non usare**: nessuno

### Referente
- **Inglese**: `referente`, `liaisonReply`, `askLiaison`
- **Definizione**: l'agente che nella corona accoglie il viandante e porta le sue richieste alla squadra giusta.
- **Dove vive**: `src/kernel/archive.ts`, `src/kernel/agents/council.ts`
- **Da non usare**: `referenteReply`, `askReferente`
- **Fermo**: il valore `referente` di `AgentId`, come gli altri agenti.

### Musicista
- **Inglese**: `Musician`, `musicista`, `compose`, `ComposeRequest`, `composerRole`, `ScoreDirector`, `composing`
- **Definizione**: l'agente che scrive i programmi sonori di ciò che il mondo e il viandante chiedono; abita nella casa dell'Artista.
- **Dove vive**: `src/kernel/agents/composer.ts`, `src/kernel/scoredirector.ts`
- **Da non usare**: `Compositore`, `MusicDirector`
- **Fermo**: il valore `musicista` di `AgentId`, `scultori.musicista`, il coefficiente `brani`, `ai.maxBrani`.

### Attore
- **Inglese**: `Actor`, `ActorConfig`, `repairActor`, `attore`, `ACTOR_MODEL`
- **Definizione**: l'agente, se il master lo accende, che recita gli individui dalle loro schede.
- **Dove vive**: `src/kernel/agents/minds.ts`, `src/kernel/coefficients.ts`
- **Da non usare**: `AttoreConfig`, `repairAttore`

### Squadra
- **Inglese**: `team`
- **Definizione**: un agente nello studio, un membro per edificio, che lavora allo scaffale del file che cambia.
- **Dove vive**: `src/kernel/archive.ts`, `src/kernel/corona.ts`
- **Da non usare**: nessuno

### Compito
- **Inglese**: `task`
- **Definizione**: ciò che un agente chiede al modello: il nome di una chiamata (`npc.reply`, `genesis.bible`…).
- **Dove vive**: `src/kernel/agents/council.ts`, `src/kernel/ai/usage.ts`
- **Da non usare**: nessuno (i «task» del backlog sono un'altra cosa)

### Registro del Concilio
- **Inglese**: `feed`, `FeedEntry`
- **Definizione**: ciò che gli agenti fanno e si dicono, in ordine: pannello `G` e console.
- **Dove vive**: `src/kernel/agents/council.ts`, `src/ui/feed.ts`
- **Da non usare**: `registro` (da solo: vedi «Gli omonimi»), `log`

### Sessione del Concilio
- **Inglese**: `councilSession`
- **Definizione**: la riunione ogni 12 luoghi in cui l'Arbitro decide se intervenire.
- **Dove vive**: `src/kernel/agents/effects.ts`
- **Da non usare**: `sessione` (da sola)
- **Fermo**: il compito `council.session`.

### Fucina
- **Inglese**: `forge`, `forgeModule`, `ForgeRequest`
- **Definizione**: la catena che crea un modulo: concetto, fisica, codice, Arbitro, validatore, commit.
- **Dove vive**: `src/kernel/agents/forge.ts`
- **Da non usare**: nessuno
- **Fermo**: `maxForges`, `richiesta_fucina`.

### Genesi
- **Inglese**: `genesis`, `planGenesis`, `GenesisPlan`
- **Definizione**: la nascita di un universo: bibbia, stile, terreni, ambienti, oggetti, cast.
- **Dove vive**: `src/kernel/agents/genesis.ts`, `src/ui/genesis.ts`
- **Da non usare**: nessuno

### Generazione differita
- **Inglese**: `runDeferred`, `DeferredModels`, `StepGate`, `planAhead`
- **Definizione**: un universo generato prima che qualcuno lo giochi, senza browser, passo dopo passo e solo dalla coda degli abbonamenti (ADR-0143).
- **Dove vive**: `src/kernel/deferred.ts`, `tools/generazione/genera.ts`, `server/generation.ts`, `universes/.generazione/`
- **Da non usare**: `pregenerazione`, `generazione offline` («offline» sono i modelli locali)
- **Fermo**: il file `universes/.generazione/<nome>.json` (passi, tetto, partita, consumo) e il segno `universes/.accesi/<nome>.json`.

### Ambientazione
- **Inglese**: `WorldTheme`, `WORLD_THEMES`, `themeOfText`
- **Definizione**: uno dei testi di tema tra cui si sceglie alla Genesi; il kernel non la conosce, di una Genesi resta il tema.
- **Dove vive**: `src/kernel/themes.ts`, `src/ui/genesis.ts`
- **Da non usare**: nessuno

### Bibbia
- **Inglese**: `bible`, `readBible`, `biblePages`
- **Definizione**: la memoria del Narratore: prologo, luoghi, personaggi, fatti, misteri.
- **Dove vive**: `world/bible.json`, `src/kernel/bible.ts`
- **Da non usare**: nessuno

### Regola
- **Inglese**: `Rule`, `rules`
- **Definizione**: un giudizio del Concilio che diventa legge del mondo.
- **Dove vive**: `world/rules.json`, `src/kernel/types.ts`
- **Da non usare**: nessuno

### Grafo del mondo
- **Inglese**: `WorldGraph`, `graph`
- **Definizione**: nodi e archi ricavati dai file dell'universo: il contesto degli agenti e i controlli.
- **Dove vive**: `src/kernel/graph.ts`, `world/grafo.json`
- **Da non usare**: nessuno

### Modello di IA
- **Inglese**: `AiModels`, `MockAiModels`, `GeminiAiModels`, `kernel.ai`, `textModel`
- **Definizione**: ciò che risponde al Concilio: Gemini, una CLI di abbonamento o i modelli locali.
- **Dove vive**: `src/kernel/ai/models.ts`, `src/kernel/ai/gemini.ts`, `src/kernel/ai/mock.ts`
- **Da non usare**: `modello` (da solo: è una voce della libreria), `Models`, `MockModels`, `GeminiModels`, `kernel.models`
- **Fermo**: `textModel` in `universe.json`.

### Regolazioni
- **Inglese**: `AiSettings`, `repairAiSettings`, `applySettings`, `settingsLocked`, `lockSettings`
- **Definizione**: ciò che il master fissa prima di entrare: coefficienti, modelli, budget, minimi. Non cambiano a partita in corso, cioè da quando entra il primo viandante a quando esce l'ultimo (ADR-0133).
- **Da non usare**: impostazioni del consumo, tuning.
- **Dove vive**: `src/kernel/universe.ts`, `src/kernel/kernel.ts`, `src/ui/lobby.ts`
- **Fermo**: il campo `regolazioni` del messaggio `entra` e di `ingresso`.

### Coefficienti
- **Inglese**: `Coefficients`, `LOW_DETAIL`, `CENSUS`, `hourlyEstimate`
- **Definizione**: quanto spesso ogni agente chiama l'IA, da 0 a 1.
- **Dove vive**: `src/kernel/coefficients.ts`
- **Da non usare**: nessuno
- **Fermo**: `ai.coefficienti`.

### Vite degli individui
- **Inglese**: `vite` (la chiave), `ABSENT`
- **Definizione**: la manopola del realismo degli individui (T245a, ADR-0138): Cronaca a 0, Vita a 0,5, Teatro a 1. Assente vale 0, a differenza delle altre manopole, così un universo di prima non spende per ciò che non ha scelto; si fissa entrando come tutte (ADR-0133).
- **Dove vive**: `src/kernel/coefficients.ts`
- **Da non usare**: `realismo` (per la manopola), `grado di vita`
- **Fermo**: `ai.coefficienti.vite`, i nomi `Cronaca`, `Vita`, `Teatro`.

### Consumi
- **Inglese**: `usage`, `UsageLog`
- **Definizione**: quanto si è speso per giorno, modello e compito, in token e dollari.
- **Dove vive**: `src/kernel/ai/usage.ts`, `world/consumi.json`
- **Da non usare**: `UsageLedger`

### Mancanze
- **Inglese**: `shortfalls`, `ShortfallLog`, `noteShortfall`, `shortfallReport`
- **Definizione**: le richieste che il Concilio non è riuscito a soddisfare, con chi, agente, motivo e quante volte; da qui parte la Fase III. Non va ai client.
- **Dove vive**: `src/kernel/shortfalls.ts`, `world/mancanze.json`, `tools/mancanze/rapporto.ts`
- **Da non usare**: «registro dei fallimenti»
- **Fermo**: `world/mancanze.json` e i suoi campi (`voci`, `richiesta`, `chi`, `agente`, `compito`, `esito`, `motivo`, `volte`, `primo`, `ultimo`).

## Client, soldi e carte

### Client sottile
- **Inglese**: `ThinClient`
- **Definizione**: il client che in multigiocatore riempie uno specchio con ciò che il server dice.
- **Dove vive**: `src/session/thin.ts`
- **Da non usare**: nessuno

### Kernel specchio
- **Inglese**: `mirror`, `mirrorTick`
- **Definizione**: il kernel del client: niente generazione, salvataggi né Concilio.
- **Dove vive**: `src/kernel/kernel.ts`
- **Da non usare**: nessuno

### Ramo del master
- **Inglese**: `branch`, `branchKernel`, `publish`
- **Definizione**: ciò che il master ha cambiato e i giocatori non vedono finché non pubblica.
- **Dove vive**: `src/kernel/kernel.ts`, `server/universeStore.ts`
- **Da non usare**: nessuno
- **Fermo**: `rami/master`, i messaggi `ramo` e `pubblica`.

### Clone
- **Inglese**: `clone`, `cloneUniverse`, `cloneChanges`
- **Definizione**: una copia di un universo con un altro master.
- **Dove vive**: `src/kernel/clone.ts`, `server/universeStore.ts`
- **Da non usare**: nessuno

### Eredità
- **Inglese**: `heritage`, `HeritageConfig`, `DEFAULT_HERITAGE`, `repairHeritage`, `CardOrigin`, `sharesOf`, `inheritCards`
- **Definizione**: ciò che di ogni utilizzo di una carta clonata torna a chi la teneva prima.
- **Dove vive**: `src/kernel/heritage.ts`, `src/kernel/clone.ts`
- **Da non usare**: `Eredita`, `EREDITA`, `repairEredita`, `Origine` (nel codice)
- **Fermo**: `eredita`, `origini`, `quote`, `allaNascita`.

### Carta
- **Inglese**: `Card`, `CardStamp`, `isCardStamp`, `cards`, `CardUses`
- **Definizione**: il timbro su un contenuto generato: autore, pagante, titolare, utilizzi.
- **Dove vive**: `src/kernel/cards.ts`, `world/carte.json`
- **Da non usare**: `Carta`, `isCarta` (nel codice), `CardLedger`
- **Fermo**: `carta`, `autore`, `utilizzi`, `world/carte.json`.

### Titolare
- **Inglese**: `holder`, `cardHolderOf`
- **Definizione**: di chi è una carta: chi l'ha pagata o, per le comuni, un viandante estratto col seme.
- **Dove vive**: `src/kernel/cards.ts`
- **Da non usare**: `owner` (per le carte; `owns` è chi può leggere e scrivere), `titolareOf`
- **Fermo**: `titolare`, `titolari`.

### Pagante
- **Inglese**: `payer`, `payerOf`, `payerNow`
- **Definizione**: chi paga una chiamata: un viandante o `comune`.
- **Dove vive**: `src/kernel/cards.ts`, `src/kernel/credits.ts`
- **Da non usare**: nessuno
- **Fermo**: `pagante`, `paganti`, il campo `chi`.

### Credito
- **Inglese**: `credits`, `creditsOf`, `deductCredits`, `grantCredits`
- **Definizione**: la moneta del gioco: un credito è un dollaro.
- **Dove vive**: `src/kernel/credits.ts`, `server/wallet.ts`
- **Da non usare**: nessuno
- **Fermo**: `crediti`, `/api/crediti`.

### Saldo
- **Inglese**: `balance`, `Ledger`, `FileLedger`
- **Definizione**: i crediti di un viandante in un universo, tenuti fuori dal repository.
- **Dove vive**: `src/kernel/credits.ts`, `server/ledger.ts`, `universes/.saldi/`
- **Da non usare**: nessuno

### Commissione
- **Inglese**: `platformFee`, `DEFAULT_PLATFORM_FEE`, `platformFeeOf`, `costWithFee`
- **Definizione**: ciò che la piattaforma aggiunge al costo di ogni chiamata addebitata, come frazione del costo; la decide solo il server.
- **Dove vive**: `src/kernel/credits.ts`, `server/ledger.ts`, `server/wallet.ts`
- **Da non usare**: `fee` (nei documenti e nella UI)
- **Fermo**: `QUINE_COMMISSIONE`, `commissione` del protocollo e di `/api/crediti`.

### Tetto
- **Inglese**: `tetto`, `sessionCap`, `setSessionCap`, `sessionCapOf`, `capBudgeted`, `addBudgetFromCap`
- **Definizione**: quanto si può spendere al più, per sessione, per giorno o per universo.
- **Dove vive**: `src/kernel/credits.ts`, `src/session/server.ts`, `server/geminiProxy.ts`
- **Da non usare**: `cap` (nei documenti e nella UI), `sessionTetto`, `addBudgetFromTetto`
- **Fermo**: `tetto` del protocollo e di `ai.minimi`, `GEMINI_TETTO_GIORNALIERO`, `QUINE_TETTO_RICARICHE`.

### Lobby
- **Inglese**: `lobby`, `AiMinimums`, `repairMinimums`
- **Definizione**: la sala d'attesa prima di entrare in un mondo multigiocatore: modelli, coefficienti, tetto, carte.
- **Dove vive**: `src/ui/lobby.ts`
- **Da non usare**: `sala d'attesa` (nei documenti)

### Notizia
- **Inglese**: `NewsItem`, `parseNews`, `loadNews`
- **Definizione**: un file Markdown con un'intestazione in `site/notizie/`, che alla build diventa una voce del sito: aggiornamenti del kernel, universi nuovi, sessioni di generazione, sondaggi, server.
- **Dove vive**: `site/notizie-testo.ts`, `site/notizie/`
- **Da non usare**: nessuno

### Video del sito
- **Inglese**: `videoHandler`, `videoRoute`, `parseRange`, `parseVideoList`
- **Definizione**: un file video in una cartella del server (`QUINE_VIDEO`), mai nel repository né nella build, che il sito mostra se è nell'elenco `video.json` e il file c'è.
- **Dove vive**: `server/video.ts`, `site/video-testo.ts`
- **Da non usare**: nessuno

### Istruzioni della beta
- **Inglese**: `betaGuide`, `guideParts`, `secondPartOn`
- **Definizione**: la pagina per i tester, dal Markdown di `docs/beta/`: la prima parte se c'è, la seconda solo se `site/beta.json` la accende; spenta non entra nella build.
- **Dove vive**: `server/betaGuide.ts`, `site/istruzioni.ts`
- **Da non usare**: nessuno

## Il kernel

### Kernel
- **Inglese**: `Kernel`, `kernel`
- **Definizione**: il pavimento in TypeScript che Lua non può modificare: tick, luoghi, azioni, salvataggi.
- **Dove vive**: `src/kernel/kernel.ts`
- **Da non usare**: nessuno

### Sandbox
- **Inglese**: `Sandbox`, `Host`, `Crossing`
- **Definizione**: dove gira il Lua dell'universo; passa solo da `Host`, e `Crossing` fa passare i dati.
- **Dove vive**: `src/kernel/sandbox.ts`, `src/kernel/prelude.lua`
- **Da non usare**: nessuno

### Validatore
- **Inglese**: `Validator`, `LUA_API`, `validatePlan`
- **Definizione**: ciò da cui passa tutto il generato; l'invalido torna, con il motivo, all'agente responsabile.
- **Dove vive**: `src/kernel/validator.ts`
- **Da non usare**: nessuno

### Guasto
- **Inglese**: `Fault`, `faults`, `Faults`
- **Definizione**: un errore di codice del mondo, isolato e mostrato, che si può riparare.
- **Dove vive**: `src/kernel/faults.ts`
- **Da non usare**: `fault` (nei documenti e nella UI), `errore` (per il guasto)

### Versione del kernel
- **Inglese**: `KERNEL_VERSION`, `checkKernelVersion`, `stampKernel`, `parseVersion`
- **Definizione**: `X.Y.Z`, era, contratto con l'universo, incremento (ADR-0136); `universe.json → kernel` dice il kernel che ha scritto l'universo, e un universo di un altro contratto (`X.Y`) non si apre come se fosse di questo kernel.
- **Dove vive**: `src/kernel/version.ts`
- **Da non usare**: `release`, `edizione` (per la versione del kernel)
- **Fermo**: `kernel` in `universe.json`

### Intervallo dei kernel
- **Inglese**: `kernels`, `KernelRange`, `universeKernels`, `rangeLabel`, `runsOnThisKernel`, `migrateUniverse`, `readOnly`, `SealedChunks`
- **Definizione**: i contratti (`X.Y`) su cui un universo gira (ADR-0152): `universe.json → kernels`, da quello con cui è nato o è stato portato (`from`) a `to`, o, aperto, al contratto di `kernel`; fuori intervallo l'universo si apre con il guasto `universe:kernel`, si legge soltanto (sola lettura, `readOnly`, ADR-0156: niente arriva al repository, il Concilio usa i modelli locali) e si vede con l'etichetta «kernel 0.1–0.1». Le migrazioni da un contratto al successivo stanno in `MIGRATIONS`.
- **Dove vive**: `src/kernel/version.ts`, `src/kernel/migrations.ts`
- **Da non usare**: `compatibilità` (per l'intervallo), `range` (in italiano)
- **Fermo**: `kernels`, `from`, `to` in `universe.json`

### Migrazione
- **Inglese**: `Migration`, `MIGRATIONS`, `migrate`, `migratePlan`, `migratePlanRecord`, `prepareUniverse`
- **Definizione**: il passo che porta un universo da un contratto al successivo (ADR-0152, ADR-0155): una funzione pura sui suoi file e una, idempotente, sui piani dei luoghi, che il kernel applica a ogni piano che legge. Un caricamento migra e poi prende il seme (`prepareUniverse`). La prima è `0.1 → 0.2` (T307a, la lingua interna della simulazione).
- **Dove vive**: `src/kernel/migrations.ts`, `src/kernel/universes.ts`
- **Da non usare**: `conversione`, `upgrade` (per la migrazione: l'aggiornamento dal seme è un'altra cosa)
- **Fermo**: nessuno.

### Riparazione dei valori italiani
- **Inglese**: `internalManifest`, `internalEffect`, `internalModelId`, `internalModelInfo`, `italianValues`, `italianName`
- **Definizione**: finché i prompt del Concilio sono italiani (T310), ciò che il Concilio scrive con i valori del contratto prima si riporta ai nomi interni entrando nel kernel (manifest, effetti, piani, pannelli, casi, timbri, rune nuove, indice dei modelli); gli schemi elencano ancora i valori italiani e ciò che il mondo mostra usa la parola italiana.
- **Dove vive**: `src/kernel/internalNames.ts`, `src/kernel/validator.ts`
- **Da non usare**: `traduzione` (non è il testo del mondo)
- **Fermo**: nessuno.

### Lingua interna
- **Inglese**: `INTERNAL_NAMES`, `internalName`, `NameDomain`
- **Definizione**: la lingua di ciò che il codice legge per nome: valori dei domini, campi su disco e sul filo, percorsi, nomi visibili a Lua, commenti di Lua e XML, prompt. È l'inglese (ADR-0153), e il latino per i token delle rune magiche; il testo del mondo è nella lingua del suo universo (la lingua del mondo), l'interfaccia in quella del viandante. La tabella dei nomi italiani di oggi e di quelli d'arrivo è un dato, dominio per dominio, con il task che la applica.
- **Dove vive**: `src/kernel/internalNames.ts`, `docs/lingua-interna.md`
- **Da non usare**: `lingua di sistema`, `i18n` (per la lingua interna: sono le lingue del viandante e del mondo, T239)
- **Fermo**: nessuno.

## Lo sviluppo

### Fase
- **Inglese**: `phase`
- **Definizione**: un tratto dello sviluppo con un traguardo che si vede da fuori: I il kernel 0.9.0, II i beta tester, III il kernel 1.0.0, IV la produzione pubblica con Stripe. Possono cambiare in corso d'opera.
- **Dove vive**: `docs/fasi.md`
- **Da non usare**: `milestone`

### Step
- **Inglese**: `step`
- **Definizione**: il raggiungimento di un obiettivo condiviso tra task, con un numero che non cambia («step 25: aggiungere il suono al gioco»); la numerazione continua quella dei nove step di prima, riletti come obiettivi.
- **Dove vive**: `docs/fasi.md`
- **Da non usare**: `tappa` (per lo step)

### Scala aurea
- **Inglese**: `scale`
- **Definizione**: i numeri di Fibonacci e di Lucas e le potenze di φ da cui HUD e pannelli prendono spazi, corpi, interlinea e larghezze (nel CSS i token `--space-N`, `--text-N`, `--measure-N`, `--leading-*`).
- **Dove vive**: `src/theme.css`, `src/style.css`, `site/site.css`
- **Da non usare**: nessuno

### Scritta
- **Inglese**: `lettering`, `LETTERING`, `letteringSurface`
- **Definizione**: il nome del gioco disegnato come logo, nella barra e nel piede del sito. Nella veste futuristica è la proposta 05 di Claude estratta così com'è: le lettere grandi QUINE42 fatte di righe del piccolo QUINE42, che si muovono come un tappeto (ADR-0151).
- **Dove vive**: `site/skins/futuristica/scritta.ts`, `site/skins/futuristica/surface.ts`, `tools/vesti/scritta.ts`
- **Da non usare**: `wordmark`

### Veste
- **Inglese**: `skin`, `SkinManifest`, `siteSkins`, `SKIN_KEY`
- **Definizione**: uno degli aspetti del sito (colori, font, logo, sfondi, effetti) sopra una base comune che non cambia: una cartella di `site/skins/`, scelta con `data-skin` sulla radice. Non riguarda il gioco.
- **Dove vive**: `site/skins/`, `site/skin.ts`, `site/skin-core.ts`, `server/skins.ts`
- **Da non usare**: `tema` (per la veste: è il testo di un'ambientazione e `src/theme.css`)

## Gli omonimi

Stessa parola, concetti diversi: il problema che confonde di più, più dei sinonimi. Quando il contesto non basta si usa il nome lungo.

| Parola | Significati | Come si distinguono |
|---|---|---|
| modello / `model` | voce della libreria; IA che risponde: si chiamava `kernel.models`, `Models` fino alla rinomina R2, ora è `kernel.ai`, `AiModels` | «Modello» e «Modello di IA» |
| `Building` | edificio dello studio (`corona.ts`); il lotto si chiamava così fino alla rinomina R1, ora è `Lot` (`layout.ts`) | «Edificio» e «Lotto» |
| piano | piano di un luogo (`plan`); piano di un edificio (`Storey`) | «Piano del luogo» e «Piano» |
| `floor` | pavimento (`floorAt`); strato del terreno (`TerrainLayer`); il genere `floor` delle caselle fuori dagli edifici (`corona.ts`); `Math.floor`; il piano di un edificio si chiamava così fino alla rinomina R9, ora è `Storey` | «Pavimento» e «Piano» |
| `levels` | altezza del suolo (`Chunk.levels`); pavimenti di una colonna (`Form.levels`) | «Livello» è il primo; il secondo si dice «i pavimenti» |
| reame / `realm` | 4 × 4 zone (`realmOf`); il sito lo diceva per un universo fino alla rinomina R15 | scelta 1 |
| seme | numero (`seed`); la cartella `universe/` | «Seme» e «Universo seme» |
| sessione | connessione (`session`); riunione del Concilio; pagina del sito `sessioni.html` (è l'elenco degli universi); la sessione di gioco che finisce con la morte; sessione di lavoro di un agente (il «Protocollo delle sessioni») | «Sessione» è la prima; scelta 3 |
| cast | ciò che la Genesi chiede alla Fucina (`maxCast`, `growCast`); pronunciare (`castSpell`) | «Cast» e «Pronunciare» |
| `slot` | tasca dell'inventario; posto del pannello di una meccanica (`posto` nel protocollo); `DEVICE_SLOTS` | «Tasca» è il primo; il secondo è «posto» |
| `cell` | cella di un programma; ciò che resta col nome vecchio per una casella: i campi `cell` di `Placements` e di `HoverInfo`, `Building.cells`, l'automa di `water.ts`, `Overlay.cell`; gli altri si chiamavano così fino alla rinomina R10, ora sono `gateTiles`, `freeTiles`, `tileOf` | «Cella» e «Casella» |
| registro | del Concilio (`feed`); dei consumi (`usage`); dei viandanti (`wanderers`); delle vulnerabilità | il nome lungo |
| `Ledger` | saldi (`Ledger`); consumi e utilizzi delle carte si chiamavano così fino alla rinomina R8, ora sono `UsageLog` e `CardUses` | «Saldi» |
| `gate` | varco di un luogo (`layout.ts`); chi può passare (`gate` in `server/access.ts`, `GeminiGate`) | il file |
| zona | area di 56 × 56 luoghi (`zoneOf`); `kernel.zone` (`sim`, `corona`, `studio`) | «Zona» è la prima |
| `path` | sentiero (`carvePath`); percorso di un file | «Sentiero» |
| forma | ciò che esce da un programma (`Form`); gli id `forma-…` dei modelli degli oggetti (`ItemShape`) | «Forma» è la prima |
| pannello | scheda di una meccanica (`UiPanel`); pannello dello studio (`ui:showcase`) | il contesto |
| fase / `phase` | dello sviluppo; del giorno (`DayPhase`); di un'onda (`src/audio/sfx.ts`); le F0-F8 del piano dello step 9, nell'archivio | «Fase» è la prima, con il suo numero romano |
| step / `step` | obiettivo dello sviluppo; il passo di un calcolo nel codice (`archive.ts`); una sessione del metodo di prima, negli ADR e nei commenti («step 8.2B») | «Step» è il primo, con il suo numero |

## Le scelte fatte

L'autore ha deciso il 03/11/2026 (T187).

1. **Reame**: «universo» anche nel sito; «reame» solo per le 4 × 4 zone del kernel (R15).
2. **«Luogo» nel codice**: `chunk` (R4).
3. **«Sessione del Concilio»**: resta.
4. **«Individuo»**, `Individual`, per uomini e animali; «persona» resta il valore di `specie` e nei campi fermi (R16). `Identity` resta: unirli è un altro lavoro.
5. **«Entità»** ed `entity` come termine tecnico, senza `thing` (R6); `cose` resta nel protocollo e nei prompt del Cartografo.
6. **Nessuna eccezione alla convenzione**: `Taglia`, `Partita` e `referente` nel TypeScript diventano inglesi (R17), come il resto dell'italiano (R7); in italiano restano «taglia», «partita», «Referente» e il valore `referente` di `AgentId`.
7. **Il piano di un edificio**: `Storey` (R9).
8. **«Frase»**: `phrase` nel TypeScript (R5); il componente `hand` resta perché è salvato.

## Le rinomine

Le fanno i task T188-T204, una per task e nell'ordine: vanno in conflitto con tutti, si eseguono con pochi task in corso. Chi ne esegue una segna qui la riga, mette i nomi nuovi nelle voci e quelli vecchi tra i «da non usare», nello stesso commit. I nomi d'arrivo sono controllati: nessuno è già occupato in `src server tests site tools lab`, salvo dove la riga dice che cosa ne è di quello che c'è.

**File** è il conteggio del 03/11/2026 su `src server tests site tools lab`, per identificatori esatti (`.ts .mjs .js .html .css .lua`). **Fermo** non si tocca, qualunque R: ciò che è su disco, sul filo o visibile a Lua. Le variabili locali con lo stesso nome si cambiano solo dove la riga lo dice, e mai se fanno da chiave di ciò che si serializza (`{ hand }`).

| # | Rinomina (da → a) | Restano | File | Migrazione | Stato |
|---|---|---|---|---|---|
| R1 | Di `layout.ts`: `Building` → `Lot`, `LayoutResult.buildings` e `Chunk.buildings` → `lots`, `findBuildings` → `findLots`, `buildingAt` → `lotAt` (con il campo `building` di ciò che rende → `lot`). Di `relief.ts`, per non fare un omonimo: `Lot` → `LotBox` | il `Building` di `corona.ts`, con `buildings`, `building()`, `buildingOf`, `buildingId`. `lotsOf` e il suo `lots` locale di `kernel.ts` non si scontrano; **fermo** `lotti` del protocollo | 13 | no: il layout li ricava dalla bozza a ogni caricamento | fatto |
| R2 | `Models` → `AiModels`, `MockModels` → `MockAiModels`, `GeminiModels` → `GeminiAiModels`, `RoutedModels` → `RoutedAiModels`, `QueueModels` → `QueueAiModels`, `TrackingModels` → `TrackingAiModels`, `TrackingOnlineModels` → `TrackingOnlineAiModels`, `SculptorModels` → `SculptorAiModels`, `pricedModels` → `pricedAiModels`, `localModels` → `localAiModels`, `baseModels` → `baseAiModels`, `updateModelsHud` → `updateAiModelsHud`; il campo `models` di `Kernel` e di `Council` e l'opzione `models` di `Kernel.boot` → `ai`; `window.quine.models` → `window.quine.ai`, anche in `AGENTS.md` | la libreria: `maxModels`, `latheModels`, `upgradeModels`, `MODELS_INDEX`, `models/`, `listModels` del laboratorio; **fermi** `textModel`, `ai` di `universe.json` | 114 (76 sono test) | no | fatto |
| R3 | `playerPos` → `wandererPos`, `playerCarpet` → `wandererCarpet`, `playerId` → `wandererEntity` (è l'id dell'entità: `wandererId` c'è già ed è l'id stabile del viandante), `playerComp` → `wandererComp`, `playerMod` → `wandererModule`, `playerCell` → `wandererTile`, `playerText` → `wandererText`, `playerPrompt` → `wandererPrompt`; anche negli snippet di `docs/architettura-dettagli.md#convalida-browser` | il giocatore: `players`, `PlayerSpot`, `playerFiles`, `playerFile`, `playerFilesIn`, `playerChanges`, `PLAYERS_DIR`, `manyPlayers`; **fermi** `world.player`, `world.player_pos`, `player_id`, `player_get`, `player_set` e il binding, che Lua vede | 53 (39 sono test) | no | fatto |
| R4 | Prima `ChunkView` di `terrain.ts` → `TerrainView`; poi `Place` → `ChunkInfo`, `PlaceView` → `ChunkView`, `PlaceLot` → `ChunkLot`, `PlaceMiniature` → `ChunkMiniature`, `GraphPlace` → `GraphChunk`, `placeHere` → `chunkHere`, `placeByName` → `chunkByName`, `placesOf` → `chunksOf`, `placeList` → `chunkList`, `mergePlaces` → `mergeChunks`, `graphPlaces` → `graphChunks`, `graphPlacesVersion` → `graphChunksVersion`, `seedGraphPlaces` → `seedGraphChunks`, `addPlace` → `addChunk`, `hasPlace` → `hasChunk`, `cardPlace` → `cardChunk`, `placeCard` → `chunkCard`, `placeCardId` → `chunkCardId`, `placeIn` → `chunkIn`, `placeQuota` → `chunkQuota`, `placesMade` → `chunksMade`, `noPlace` → `noChunk`, `lastPlace` → `lastChunk`, `listPlaces` → `listChunks` | «place» verbo: `placeStructure`, `placeCampus`, `placeRegion`, `placeInside`, `placeProp`, `placeFor`, `placed`, `Placement`, `placementsOf`, `Placeable`, `PlacedObject`; i locali `place` e `places` che non sono il luogo (i locali che lo sono, passati a mano: `chunk`, `chunks`); i campi `SessionClient.places`, `Client.places`, `ShowcaseEntry.place`, i contesti degli agenti (`ctx.place`, `npc.place`, i `data` di `npcDialogue` e `weavePlot`), il metodo `ThinClient.places`, `Hud.place` (`#place`), `PLACE_PHASES`, `PLACES_PER_MINUTE`, i commenti; **fermi** `plan.place` in `maps/`, `Chunk.place`, `placesPerMinute`, `luoghi` del protocollo, `senza_luogo` | 20 (di cui 5 test) | no | fatto |
| R5 | Di `Kernel`: `hand()` → `phrase()`, `syncHand` → `syncPhrase`, `inscribeHand` → `inscribePhrase`; `lastHand` di `hud.ts` → `lastPhrase`, `handKey` → `phraseKey` | `ThinClient.phrase` e `ThinClient.syncPhrase`, su un'altra classe; i locali `hand` che tengono il componente, `Hud.hand` (`#hand`), i commenti; **fermi** il componente `hand`, `hand.tokens`, il campo `hand` dello stato sul filo (`hand: k.hand()` diventa `hand: k.phrase()`), i locali `hand` che ne fanno la chiave | 15 | no se resta il componente: con il componente, dallo stato di ogni viandante e dal Lua, ed è **sconsigliato** | fatto |
| R6 | `ThingView` → `EntityView`, `THING_PARTS` → `ENTITY_PARTS`, `Things` → `Entities`, `Thing` del laboratorio → `Entity`, `thingStandIn` → `entityStandIn`, `thingCards` → `entityCards`; i campi `things` di `Renderer`, `SessionClient`, `BenchScene` e della miniatura → `entities`; `src/render/things.ts` → `src/render/entities.ts`; nei commenti `thing` → `entity` dove è il termine tecnico | `something`, `anything` e la parola comune nei commenti (anche «things» accanto a «people» o per ciò che si porta, che non sono termini tecnici); la riga non li nomina: il campo `things` di `Client` in `server.ts`, il metodo privato `ThinClient.things`, i locali `things` e `thing` (`kernel`, `bench`, `graph`, `coefficients`, test), `things` e `userData.thing` del laboratorio, `things` di `lab/3d/world.ts`, il valore `'thing'` di `EntityView.kind`, i titoli dei test, `tests/kernel-things.test.ts`; `class Thing` di `tests/sicurezza/uscita.test.ts` non è un'entità; **fermi** `cose` ed `entita` del protocollo, `cose` dei casi del banco e dei prompt | 54 | no | fatto |
| R7 | `AttoreConfig` → `ActorConfig`, `repairAttore` → `repairActor`; `AiMinimi` → `AiMinimums`, `repairMinimi` → `repairMinimums`, `minimiBlock` → `minimumsBlock`; `Eredita` → `HeritageConfig`, `EREDITA` → `DEFAULT_HERITAGE`, `repairEredita` → `repairHeritage`, `Origine` → `CardOrigin`; `Carta` → `CardStamp` (il timbro; `Card` è la carta in una collezione e lo estende), `isCarta` → `isCardStamp`; `titolareOf` → `cardHolderOf` (`holderOf` è occupato in `tools/pipeline/`); `sottoOf` → `cellarOf`; `sessionTetto` → `sessionCap`, `setSessionTetto` → `setSessionCap`, `sessionTettoOf` → `sessionCapOf`, `tettoBudgeted` → `capBudgeted`, `addBudgetFromTetto` → `addBudgetFromCap`, in `lobby.ts` `tettoMin` → `minCap`, `defaultTetto` → `defaultCap`, `tettoInput` → `capInput`, `setTetto` → `setCap`, in `creditdialog.ts` `isTetto` → `isCap`, in `site/sessioni.ts` `tettoMinimo` → `minCap`; `Scheda` di `society.ts` → `IndividualSheet`; `Forma` → `ItemShape`, `FORME` → `ITEM_SHAPES`, `formaModel` → `itemShapeModel`; `PlintoSculpture` → `PlinthSculpture`, `plintoSculpture` → `plinthSculpture`, `plintoSymbols` → `plinthSymbols`; `TornioModelEntry` → `LatheModelEntry`, `TornioShown` → `LatheShown`, `TornioView` → `LatheView`, `tornioCache` → `latheCache`, `tornioExecute` → `latheExecute`, `tornioIndex` → `latheIndex`, `tornioModels` → `latheModels`, `tornioOf` → `latheOf`, `tornioOpen` → `latheOpen`, con i file `src/kernel/tornio.ts`, `src/render/tornio.ts` e `tests/tornio.test.ts` → `lathe` | l'italiano del laboratorio, che non è il TypeScript del gioco (`Scheda` di `lab/banco/seconda.ts`, `Piano`, `daCorreggere`); il locale `tetto`, che è la chiave del messaggio; la riga non li nomina: `stepTornio`, `openTornio`, `TORNIO_AT`, il campo `tornio` di `CoronaView`, il metodo `tornio` di `Studio`, i locali `tornio`, `Kernel.plinto()`, `updatePlinto`, il campo `plinto` della struttura; **fermi** i campi omonimi nei file (`attore`, `minimi`, `eredita`, `origini`, `carta`, `titolare`, `sotto`, `tetto`, `scheda`), gli id `forma-…`, i valori `tornio` e `plinto` di `ItemKind` e simili | 32 | no | fatto |
| R8 | `CardLedger` → `CardUses`, `UsageLedger` → `UsageLog` | `Ledger`, `FileLedger`, `MemoryLedger`, `LedgerBook`, `openLedger`: sono dei saldi; la riga non li nomina: i locali e parametri `ledger` che tengono un `UsageLog` (`lab/scripts/`, `tests/subscription.test.ts`), `ledger` di `allCards` in `cards.ts`, «ledger» nei commenti e nei titoli dei test; `docs/conversazioni.md`, che è storia; **fermi** `world/consumi.json`, `world/carte.json` | 12 | no | fatto |
| R9 | Di `corona.ts`: `Floor` → `Storey`, `Building.floors` → `storeys`, `perFloor` → `perStorey`, `nFloors` → `nStoreys`, `FLOOR_STRIDE` → `STOREY_STRIDE`; il campo `floor` di `roomAt`, il parametro `floor: Floor` e l'indice `floor` di `entrance` → `storey`; nei test `sampleFloor` → `sampleStorey`, `floorOf` → `storeyOf` (è il piano di un oggetto) | i pavimenti: `floors` di `src/mj/mesh.ts`, `floorAt`, `floorBelow`, `Math.floor`; le misure di `lab/banco/misure.ts`; `Lot.floor`, `Form.floor`; il genere `'floor'` di `CoronaTile` e la parola inglese «ground floor» nei commenti; **fermo** lo strato `floor` di `TerrainLayer` | 21 | no | fatto |
| R10 | Le caselle: `gateCells` → `gateTiles`, `freeCell` → `freeTile`, `freeCells` → `freeTiles`, `runeCells` → `runeTiles`, `solidCells` → `solidTiles`, `cellNear` → `tileNear`, `propCells` → `propTiles`, `pickCell` → `pickTile`, `doorCells` → `doorTiles`, `nicheCell` → `nicheTile`, `cellOf` → `tileOf`, `cellIndex` → `tileIndex`, `polarCell` → `polarTile`, `CoronaCell` → `CoronaTile`; i locali `cell` dove indicano una casella (anche il campo del risultato di `tileOf`, che non esce da `kernel.ts`) | le celle: `turnCells`, `cellAt` e `nCell` di `mesh.ts`, `sameCells`, i `cell` di griglie, tabelle e tele; `visibleCells` del sito e `sleepCell` di `ledger.ts`, che non sono né l'una né l'altra. `playerCell` sta in R3; la riga non li nomina: i campi `cell` di `Placements` e di `HoverInfo`, `Building.cells`, `Cell`, `cells` e `cell()` di `water.ts`, `Overlay.cell`, i locali `cells` al plurale, i commenti | 9 | no | fatto |
| R11 | `LayoutDef` → `EnvironmentDef`, `layoutsFor` → `environmentsFor` | **fermi** `layouts` nei manifest (25 file la leggono), `layout` nei piani; il campo `layouts` del risultato di `environmentsFor` e i locali `layouts`; la riga non li nomina: `designLayouts`, `validateLayout`, `checkLayout`, `LayoutCheck` | 8 | no | fatto |
| R12 | `TileDef` → `TerrainDef`, `TileLayer` → `TerrainLayer` | **fermi** `tiles` nei manifest e in `ChunkInfo` (su disco), `TerrainDef.layer`; la riga non li nomina: `tiles` e `tile` del risultato di `cartography.ts`, `VOID_TILE` | 12 | no | fatto |
| R13 | Commenti: «game of many» e «games of many» → «multiplayer»; `pocket` e `pockets` → `slot` e `slots`, anche le poche variabili | le tasche di un individuo («own pockets» in `content.ts`, `kernel.ts`, «a name and pockets» in `tests/kernel-things.test.ts`); il `pocket` di `layout.ts`, che è una zona calpestabile staccata, non un posto dell'inventario; la riga non li nomina: «universe of many», «world of many», «server of many», «session of many» | 38 | no: solo commenti e titoli dei test, tranne il metodo privato `SessionServer.pocket` → `slot` | fatto |
| R14 | `AGENTS.md`: `chunk` → «luogo» (righe di `relief.ts`, `terrain.ts`, `universe.json`), `layout` → «ambiente» dove è l'ambiente | gli ADR, che non si toccano | 1 | no | fatto |
| R15 | Sito: «reame», «reami», `Reame`, `REAME` → «universo», «universi» e maiuscole, anche il messaggio di `server/wanderer.ts`; `realm`, `realms` → `universe`, `universes`; `RealmView` → `UniverseView`, `REALM_KEY` → `UNIVERSE_KEY`, `pickRealm` → `pickUniverse`, `parseRealmSnapshot` → `parseUniverseSnapshot`, `fetchRealmDetails` → `fetchUniverseDetails`, `renderRealmCard` → `renderUniverseCard`, `loadRealms` → `loadUniverses`, `allRealms` → `allUniverses`, `realmPromises` → `universePromises`, `realmsGrid` → `universesGrid`; le classi e gli id: `realm-card`, `realm-card-header`, `realm-card-body`, `realm-card-footer`, `realm-spec-table`, `realm-loading`, `realm-empty`, `realm-filter-tabs`, `realm-select`, `realms-grid`, `card-realm`, `btn-play-realm`, `status-realms` → con `universe` e `universes` | il reame del kernel: `REALM`, `realmOf`, i commenti di `src/`, `tests/lots.test.ts`; le prove di `reame-low`, `reame-high`, `reame2`, che sono nomi d'universo qualunque; `universes` dei dati della risposta, già così; **fermi** il valore `quine:sito:reame` della chiave di `localStorage` e l'ancora `#reami` (`id="reami"`, i suoi `href`), che sta negli indirizzi | 22 (13 del sito, 7 test) | no | fatto |
| R16 | `Person` → `Individual`, `DialoguePerson` → `DialogueIndividual`, `addPerson` → `addIndividual`, `updatePerson` → `updateIndividual`, `personOf` → `individualOf`, `personFacts` → `individualFacts`, `personByName` → `individualByName`, `personNode` → `individualNode`, `noPerson` → `noIndividual`; il campo `person` di `BenchScene` e di `figure` → `individual`, il locale `person` → `individual`, gli id `person:<nome>` delle vetrine → `individual:<nome>`; nei commenti `person` → `individual` dove è il concetto. Nei documenti, nella UI e in `AGENTS.md`, «persona» → «individuo» dove è il concetto | `Identity`, il componente; `People` e `readPeople`, che dicono il file; `Species`; `nPersone`, `personaggi` e i testi in italiano comune, nel mondo e nei prompt; **fermi** `world/people.json` e il suo `persone`, `persona` nel manifest e nel prompt, il valore `persona` di `specie` e il tipo `persona` dei nodi del grafo (con `senza_persona`), `npc.*` | 9 per i nomi, ~20 con `person` nel codice, 90 con i commenti | no | fatto |
| R17 | `Taglia` → `SizeTier`, `TAGLIE` → `SIZE_TIERS`; `Partita` → `GameSetup`, `repairPartita` → `repairGameSetup`, `partitaSummary` → `gameSetupSummary`, `DEFAULT_PARTITA` → `DEFAULT_GAME_SETUP`, il metodo `Kernel.partita()` → `gameSetup()`, `src/kernel/gameSetup.ts` → `src/kernel/gameSetup.ts`; `referenteReply` → `liaisonReply`, `askReferente` → `askLiaison` | `SizeDef`, `RARE_SIZES`, `sizeOf`, `sizeRank`; `game`, `chooseGame`, il `Game` di `server/access.ts`; **fermi** `taglia` e i suoi valori, `partita`, `modalita`, `altroTraGiocatori` nei file, il valore `referente` di `AgentId` | 27 | no | fatto |
| — | API Lua: `world.player` → `world.wanderer` | 6 moduli del seme, ogni universo generato, prompt, validatore | — | **sì, e un alias per sempre: non lo propongo** | — |
| — | Valori di `AgentId`, nomi degli effetti, componenti in italiano | ovunque, compresi i dati | — | **sì: non lo propongo**, sono dati | — |
