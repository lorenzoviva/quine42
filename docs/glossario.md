# Il glossario di QUINE42

Un nome per ogni concetto (ADR-0117). Il titolo di ogni voce è il **nome ufficiale in italiano**: quello di documenti, UI e prompt.
**Inglese** è il nome nel codice: il primo della lista è la forma base, gli altri sono i tipi e le funzioni che lo portano. **Da non usare**
sono i sinonimi da non scrivere più nel lavoro nuovo: ciò che c'è già resta finché un task di rinomina non lo cambia (qui sotto, «Le
rinomine proposte»). **Fermo** sono i nomi che non si cambiano senza una migrazione: vanno scritti così anche se non sono ufficiali.

`tests/glossario.test.ts` controlla che ogni voce abbia i suoi campi e che i nomi e i file citati esistano. Il conteggio dei sinonimi è in
[`glossario-censimento.md`](glossario-censimento.md), rifatto da `node tools/glossario/glossario.mjs`.

## La regola

- **Un concetto nuovo ha una voce qui nello stesso commit**; prima di coniare un nome si cerca se la voce c'è.
- **Codice**: identificatori e commenti TypeScript in inglese, con il nome di questo file. Pochi nomi propri restano uguali nelle due lingue (`corona`, `master`, `lobby`, `kernel`).
- **Dati**: ciò che finisce su disco, sul filo o nei prompt resta com'è (spesso in italiano): è un formato, non uno stile.
- **Italiano**: nei documenti, nella UI e nei prompt il nome ufficiale; dentro il mondo (bibbia, dialoghi) i termini tecnici non esistono comunque (ADR-0025).
- **Gli ADR sono storia**: non si riscrivono per cambiare un nome.

## Ciò che non si rinomina senza una migrazione

| Che cosa | Dove | Perché | Che cosa costa |
|---|---|---|---|
| Campi JSON degli universi | manifest (`tiles`, `layouts`, `items`), `universe.json` (`chunkSize`, `placesPerMinute`, `maxCast`, `partita`), `world/*.json` (`legami`, `ricordi`, `scheda`), `maps/` (`place`, `layout`, `strutture`, `scavi`), carte (`carta`, `titolare`, `pagante`) | ogni universo su disco li ha nella sua storia git | lettura che accetta i due nomi (come `readPeople`), più un aggiornamento dal seme |
| Componenti delle entità | `src/session/protocol.ts` (`THING_PARTS`), `stato.json`, codice Lua (`hand`, `luce`, `fuoco`, `attivita`, `stati`, `meta`) | salvati nello stato e letti dai moduli generati | migrazione dello stato e del Lua generato |
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
- **Inglese**: `Partita`, `repairPartita`, `game`
- **Definizione**: come si gioca in un universo, scelto alla Genesi e fisso: modalità, morte, PvP, master.
- **Dove vive**: `src/kernel/partita.ts`, `universe.json → partita`
- **Da non usare**: `game of many` (si dice «multigiocatore»)
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
- **Inglese**: `chunk`, `Chunk`, `chunkSize`, `planChunk`
- **Definizione**: il quadrato di 18 × 18 caselle: l'unità con cui il mondo si genera, si salva e si carica.
- **Dove vive**: `src/kernel/kernel.ts`, `src/kernel/chunks.ts`, `src/kernel/layout.ts`
- **Da non usare**: `place` (nel codice), `chunk` (nei documenti e nella UI)
- **Fermo**: `chunkSize`, `generate_chunk`, `placesPerMinute`, `place` in `maps/`, `luoghi` del protocollo.

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
- **Inglese**: `tile`, `tileAt`, `setTile`
- **Definizione**: l'unità del mondo: un'unità di three.js, una casella di terreno.
- **Dove vive**: `src/kernel/kernel.ts`, `src/render/terrain.ts`
- **Da non usare**: `cell` (per il mondo), `cella` (idem)
- **Fermo**: `world.tile`, `world.set_tile`, `tiles` nei manifest e in `PlaceView`.

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
- **Inglese**: `terrain`, `TileDef`, `TileLayer`
- **Definizione**: il tipo di una casella: nome, colore, strato, se blocca, azioni imparate.
- **Dove vive**: `src/kernel/types.ts`, i moduli `generator` dell'universo
- **Da non usare**: `tile` (per il tipo)
- **Fermo**: `tiles` nei manifest, `TileDef.layer`.

### Ambiente
- **Inglese**: `environment`, `EnvironmentDraft`, `LayoutDef`
- **Definizione**: un programma di riscrittura che dà forma a un luogo (bosco, villaggio…), scritto dal Cartografo.
- **Dove vive**: `src/kernel/types.ts`, `src/kernel/agents/cartography.ts`, `manifest → layouts`
- **Da non usare**: `layout` (per l'ambiente), `bioma` (è un'altra cosa: le lettere del generatore)
- **Fermo**: `layouts` nei manifest, `layout` in `maps/`, `usa_ambiente`.

### Lotto
- **Inglese**: `lot`, `Lot`, `lots`
- **Definizione**: il rettangolo piano di un luogo su cui sta una struttura.
- **Dove vive**: `src/kernel/relief.ts`, `src/kernel/layout.ts`
- **Da non usare**: `building` (per il lotto: `Chunk.buildings`)
- **Fermo**: `lotti` del protocollo.

### Varco
- **Inglese**: `gate`, `gates`, `gateCells`
- **Definizione**: il punto del bordo di un luogo per cui si passa nel vicino, deterministico.
- **Dove vive**: `src/kernel/layout.ts`
- **Da non usare**: nessuno

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
- **Da non usare**: nessuno (il sito lo usa per dire «universo»: è la prima delle scelte dubbie)

### Regione
- **Inglese**: `Region`, `region`, `placeRegion`
- **Definizione**: una zona con un nome sull'atlante; la geografia che persone e Cartografo conoscono.
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
- **Inglese**: `corona`, `Corona`, `coronaRevealed`
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
- **Inglese**: `Floor`, `floors`
- **Definizione**: un livello di un edificio dello studio, con le sue stanze; nelle strutture un tratto di pavimento su una colonna.
- **Dove vive**: `src/kernel/corona.ts`, `src/kernel/forms.ts`
- **Da non usare**: nessuno (`floor` è anche «Pavimento»: vedi «Gli omonimi»)

### Pavimento
- **Inglese**: `floorAt`, `floorBelow`, `surfaces`
- **Definizione**: la superficie su cui un corpo sta, in quella colonna e a quell'altezza.
- **Dove vive**: `src/kernel/forms.ts`, `src/kernel/kernel.ts`
- **Da non usare**: nessuno
- **Fermo**: lo strato `floor` di `TileLayer`.

### Cantina
- **Inglese**: `cellar`, `sottoOf`, `sunk`
- **Definizione**: la parte di una struttura sotto il suolo, con il buco nel terreno (`Form.hole`).
- **Dove vive**: `src/kernel/forms.ts`, `src/kernel/kernel.ts`
- **Da non usare**: nessuno
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
- **Inglese**: `entity`, `ecs`
- **Definizione**: qualunque cosa nel mondo: un id con i suoi componenti.
- **Dove vive**: `src/kernel/ecs.ts`
- **Da non usare**: `thing`, `cosa` (come termine tecnico; nel testo comune «cosa» resta una parola italiana)
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

### Forma
- **Inglese**: `Form`, `FormResult`, `FormComp`, `FormView`, `FormRunner`
- **Definizione**: ciò che esce da programma più seme più scatola: griglia, impronta, pavimenti, azioni.
- **Dove vive**: `src/kernel/forms.ts`, `src/render/forms.ts`
- **Da non usare**: nessuno (i modelli `forma-…` degli oggetti sono modelli, con un nome storico)
- **Fermo**: il componente `form`, `forma` del protocollo, gli id `forma-…`.

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
- **Inglese**: `Taglia`, `TAGLIE`, `tilesOf`, `boxOf`
- **Definizione**: la scala di D&D, da minuscola a gargantuesca, per creature e strutture.
- **Dove vive**: `src/mj/classes.ts`
- **Da non usare**: `size` (per la taglia)
- **Fermo**: `taglia` nei file e i suoi valori.

## Viandanti e persone

### Viandante
- **Inglese**: `wanderer`, `Wanderer`, `wanderers`, `wandererId`
- **Definizione**: il personaggio di chi gioca nel mondo, con un id stabile (`io` in singola).
- **Dove vive**: `src/kernel/wanderers.ts`, `world/giocatori/<id>.json`
- **Da non usare**: `player` (per il personaggio), `giocatore` (idem), `hero`
- **Fermo**: `world.player`, `world.player_pos`, `kind: player`, `core.player`, `world/giocatori/`, `viandante` nei file e nel protocollo.

### Giocatore
- **Inglese**: `player`, `players`, `PlayerSpot`, `playerFiles`
- **Definizione**: la persona al client: chi è collegato; in multigiocatore, chi non è il master.
- **Dove vive**: `src/session/server.ts`, `src/session/files.ts`, `src/kernel/situation.ts`
- **Da non usare**: `player` (per il personaggio), `utente`
- **Fermo**: `giocatori` del protocollo, `altroTraGiocatori`.

### Master
- **Inglese**: `master`, `isMaster`
- **Definizione**: chi ha creato un universo multigiocatore: lo guida, fisso; in singola chi gioca.
- **Dove vive**: `src/kernel/partita.ts`, `src/master.ts`, `universe.json → partita.master`
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

### Persona
- **Inglese**: `Person`, `people`, `readPeople`
- **Definizione**: un individuo della società: umano o animale, con mestiere, famiglia, routine, legami.
- **Dove vive**: `src/kernel/society.ts`, `world/people.json`
- **Da non usare**: `npc` (per l'individuo), `individuo` (idem; vedi le scelte dubbie)
- **Fermo**: `npc.reply`, `npc.dialogue`, `npc.sheet`, `persona` nel manifest, `identity` e `mind` dei componenti.

### Tipo di persona
- **Inglese**: `persona`
- **Definizione**: il modulo `entity` con la `persona`, il modello e l'aspetto comuni, di cui ogni persona è un'istanza.
- **Dove vive**: `src/kernel/types.ts`, `universe/modules/`
- **Da non usare**: nessuno

### Cast
- **Inglese**: `CastEntry`, `growCast`, `maxCast`
- **Definizione**: i primi abitanti e le prime cose che la Genesi chiede alla Fucina, e quelli che si aggiungono esplorando.
- **Dove vive**: `src/kernel/agents/genesis.ts`, `src/kernel/kernel.ts`
- **Da non usare**: nessuno
- **Fermo**: `maxCast`, il compito `genesis.cast`.

### Scheda
- **Inglese**: `sheet`, `ensureSheet`, `sheetFingerprint`
- **Definizione**: il foglio che il Narratore scrive di una persona perché l'Attore la reciti.
- **Dove vive**: `src/kernel/society.ts`
- **Da non usare**: nessuno
- **Fermo**: `scheda` in `world/people.json`.

### Legame
- **Inglese**: `bond`, `bonds`, `bondWith`, `bondOf`
- **Definizione**: ciò che una persona è per un'altra o per un viandante, simmetrico e possibile per le specie.
- **Dove vive**: `src/kernel/society.ts`, `src/kernel/wanderers.ts`
- **Da non usare**: nessuno
- **Fermo**: `legami`, l'effetto `legame`.

### Ricordo
- **Inglese**: `memory`, `memories`, `memoriesFor`
- **Definizione**: ciò che una persona ha vissuto, pesato e legato a un viandante.
- **Dove vive**: `src/kernel/society.ts`, `src/kernel/wanderers.ts`
- **Da non usare**: nessuno
- **Fermo**: `ricordi`, l'effetto `ricordo`.

### Trama
- **Inglese**: `Plot`, `plot`, `reviewPlot`
- **Definizione**: una storia orizzontale tra persone, a tappe, validata.
- **Dove vive**: `src/kernel/plots.ts`, `world/plots.json`
- **Da non usare**: `storia` (è di una persona)

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
- **Definizione**: una runa che si pronuncia e si consuma: `luce fuoco acqua terra vita scudo vento` e quelle nuove del Concilio.
- **Dove vive**: `src/kernel/magic.ts`, `universe/modules/`
- **Da non usare**: nessuno

### Frase
- **Inglese**: `phrase`, `syncPhrase`
- **Definizione**: le rune scelte, in ordine, che si possono incidere o pronunciare.
- **Dove vive**: `src/kernel/kernel.ts`, `src/ui/inventory.ts`
- **Da non usare**: `hand` (nel codice nuovo), `sentence`, `mano`
- **Fermo**: il componente `hand` e `hand.tokens`, il messaggio `frase`.

### Riga
- **Inglese**: `line`, `set_line`, `run_line`, `carpetLine`
- **Definizione**: rune in fila sul terreno: una riga orizzontale di Lua eseguita a ogni tick.
- **Dove vive**: `src/kernel/runes.ts`, `src/kernel/prelude.lua`
- **Da non usare**: nessuno

### Incidere
- **Inglese**: `inscribe`, `inscribeHand`
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
- **Definizione**: l'agente della bibbia, delle persone, dei pacchetti di oggetti e dei giudizi.
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
- **Inglese**: `Sculptor`, `scultore`, `SculptorModels`
- **Definizione**: l'agente che scrive i programmi dei modelli e le loro azioni.
- **Dove vive**: `src/kernel/agents/sculptor.ts`
- **Da non usare**: nessuno

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
- **Inglese**: `referente`
- **Definizione**: l'agente che nella corona accoglie il viandante e porta le sue richieste alla squadra giusta.
- **Dove vive**: `src/kernel/archive.ts`, `src/kernel/agents/council.ts`
- **Da non usare**: nessuno

### Attore
- **Inglese**: `Actor`, `attore`, `ACTOR_MODEL`
- **Definizione**: l'agente, se il master lo accende, che recita le persone dalle loro schede.
- **Dove vive**: `src/kernel/agents/minds.ts`, `src/kernel/coefficients.ts`
- **Da non usare**: nessuno

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
- **Inglese**: `Models`, `MockModels`, `GeminiModels`, `textModel`
- **Definizione**: ciò che risponde al Concilio: Gemini, una CLI di abbonamento o i modelli locali.
- **Dove vive**: `src/kernel/ai/models.ts`, `src/kernel/ai/gemini.ts`, `src/kernel/ai/mock.ts`
- **Da non usare**: `modello` (da solo: è una voce della libreria)
- **Fermo**: `textModel` in `universe.json`, `.models.usage` come abitudine in console.

### Coefficienti
- **Inglese**: `Coefficients`, `LOW_DETAIL`, `CENSUS`, `hourlyEstimate`
- **Definizione**: quanto spesso ogni agente chiama l'IA, da 0 a 1.
- **Dove vive**: `src/kernel/coefficients.ts`
- **Da non usare**: nessuno
- **Fermo**: `ai.coefficienti`.

### Consumi
- **Inglese**: `usage`, `UsageLedger`
- **Definizione**: quanto si è speso per giorno, modello e compito, in token e dollari.
- **Dove vive**: `src/kernel/ai/usage.ts`, `world/consumi.json`
- **Da non usare**: nessuno

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
- **Inglese**: `heritage`, `sharesOf`, `inheritCards`
- **Definizione**: ciò che di ogni utilizzo di una carta clonata torna a chi la teneva prima.
- **Dove vive**: `src/kernel/heritage.ts`, `src/kernel/clone.ts`
- **Da non usare**: nessuno
- **Fermo**: `eredita`, `origini`, `quote`, `allaNascita`.

### Carta
- **Inglese**: `Card`, `Carta`, `cards`, `CardLedger`
- **Definizione**: il timbro su un contenuto generato: autore, pagante, titolare, utilizzi.
- **Dove vive**: `src/kernel/cards.ts`, `world/carte.json`
- **Da non usare**: nessuno
- **Fermo**: `carta`, `autore`, `utilizzi`, `world/carte.json`.

### Titolare
- **Inglese**: `holder`, `titolareOf`
- **Definizione**: di chi è una carta: chi l'ha pagata o, per le comuni, un viandante estratto col seme.
- **Dove vive**: `src/kernel/cards.ts`
- **Da non usare**: `owner` (per le carte; `owns` è chi può leggere e scrivere)
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

### Tetto
- **Inglese**: `tetto`, `sessionTetto`
- **Definizione**: quanto si può spendere al più, per sessione, per giorno o per universo.
- **Dove vive**: `src/kernel/credits.ts`, `src/session/server.ts`, `server/geminiProxy.ts`
- **Da non usare**: `cap` (nei documenti e nella UI)
- **Fermo**: `tetto` del protocollo e di `ai.minimi`, `GEMINI_TETTO_GIORNALIERO`, `QUINE_TETTO_RICARICHE`.

### Lobby
- **Inglese**: `lobby`
- **Definizione**: la sala d'attesa prima di entrare in un mondo multigiocatore: modelli, coefficienti, tetto, carte.
- **Dove vive**: `src/ui/lobby.ts`
- **Da non usare**: `sala d'attesa` (nei documenti)

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

## Gli omonimi

Stessa parola, concetti diversi: il problema che confonde di più, più dei sinonimi. Quando il contesto non basta si usa il nome lungo.

| Parola | Significati | Come si distinguono |
|---|---|---|
| modello / `model` | voce della libreria; IA che risponde (`kernel.models`, `Models`) | «Modello» e «Modello di IA»; rinomina R2 |
| `Building` | due tipi: edificio dello studio (`corona.ts`); stanza del piano che diventa un lotto (`layout.ts`) | «Edificio» e «Lotto»; rinomina R1 |
| piano | piano di un luogo (`plan`); piano di un edificio (`Floor`) | «Piano del luogo» e «Piano» |
| `floor` | piano (`Floor`); pavimento (`floorAt`); strato del terreno (`TileLayer`); `Math.floor` | rinomina R9 |
| `levels` | altezza del suolo (`Chunk.levels`); pavimenti di una colonna (`Form.levels`) | «Livello» è il primo; il secondo si dice «i pavimenti» |
| reame / `realm` | 4 × 4 zone (`realmOf`); nel sito, un universo | scelta dubbia 1 |
| seme | numero (`seed`); la cartella `universe/` | «Seme» e «Universo seme» |
| sessione | connessione (`session`); riunione del Concilio; pagina del sito `sessioni.html` (è l'elenco degli universi); la sessione di gioco che finisce con la morte; sessione di lavoro di un agente (il «Protocollo delle sessioni») | «Sessione» è la prima; scelta dubbia 3 |
| cast | ciò che la Genesi chiede alla Fucina (`maxCast`, `growCast`); pronunciare (`castSpell`) | «Cast» e «Pronunciare» |
| `slot` | tasca dell'inventario; posto del pannello di una meccanica (`posto` nel protocollo); `DEVICE_SLOTS` | «Tasca» è il primo; il secondo è «posto» |
| `cell` | cella di un programma; casella di un luogo (`gateCells`, `freeCells`, indici dei piani) | rinomina R10 |
| registro | del Concilio (`feed`); dei consumi (`usage`); dei viandanti (`wanderers`); delle vulnerabilità | il nome lungo |
| `Ledger` | saldi (`Ledger`); consumi (`UsageLedger`); utilizzi delle carte (`CardLedger`) | rinomina R8 |
| `gate` | varco di un luogo (`layout.ts`); chi può passare (`gate` in `server/access.ts`, `GeminiGate`) | il file |
| zona | area di 56 × 56 luoghi (`zoneOf`); `kernel.zone` (`sim`, `corona`, `studio`) | «Zona» è la prima |
| `path` | sentiero (`carvePath`); percorso di un file | «Sentiero» |
| forma | ciò che esce da un programma (`Form`); gli id `forma-…` dei modelli degli oggetti | «Forma» è la prima |
| pannello | scheda di una meccanica (`UiPanel`); pannello dello studio (`ui:showcase`) | il contesto |

## Le scelte dubbie (da far decidere all'autore)

Ho scelto una raccomandazione per ognuna, ed è ciò che le voci qui sopra dicono oggi; basta dirne un'altra.

1. **Reame**: il sito dice «reame» per «universo» (55 righe in 11 file di `site/`, e `realm` nel suo codice in 13), il kernel per 4 × 4 zone (ADR-0092). Raccomando: **«universo» anche nel sito**, «reame» solo per l'area. L'alternativa è tenere «reame» sul sito, parola più bella per chi legge, e rinominare l'area del kernel.
2. **`chunk` o `place` nel codice per «luogo»**: raccomando **`chunk`**: è fermo in `chunkSize` e `generate_chunk` e `place` è anche un verbo (`placeStructure`). L'alternativa `place` è più vicina all'italiano, ma tocca Lua e `universe.json`.
3. **«Sessione del Concilio»**: raccomando di tenerlo. L'alternativa è «**seduta** del Concilio», che toglie un omonimo a «sessione»; costa il testo di UI e documenti, il compito `council.session` resterebbe.
4. **«Persona», «individuo» o «NPC»**: raccomando **«persona»**, che comprende anche gli animali in `specie`, anche se suona strano per un cane. `Identity` (il componente) e `Person` (il registro) oggi sono due viste dello stesso individuo; unirle è un'altra cosa, da progettare.
5. **«Cosa» o «entità»**: raccomando **«entità»** come termine tecnico e `entity` nel codice, togliendo `thing`. Ma «cose» è nel protocollo (`cose`), nei prompt del Cartografo (`dentro`, `fuori`, cose) e nell'italiano di tutti: nei prompt lo terrei, sono testi per un modello e dicono ciò che intendono.
6. **Nomi italiani nel TypeScript senza un inglese buono**: `Taglia`/`TAGLIE` (`size` è già di tutto), `tetto` (`cap`), `Partita` (`game` è ovunque in altri sensi), `referente`, `Carta` accanto a `Card`. Raccomando: **tenere `Taglia`, `Partita` e `referente`**, rinominare il resto (R7). È un'eccezione alla convenzione, va detta.
7. **`Floor` del piano di un edificio**: `Storey` toglie l'omonimo con il pavimento, ma è una parola che pochi usano nel codice; raccomando di farlo lo stesso (R9), però è il meno urgente.
8. **«Frase» come `phrase` contro `hand`**: `hand` è 8 volte più frequente, ma è un'immagine («la mano») che in italiano non dice nessuno. Raccomando `phrase` nel TypeScript (R5), il componente `hand` resta com'è perché è salvato.

## Le rinomine proposte

Nessuna è fatta (T178 non tocca il codice). Conteggi del 03/11/2026 su `src server tests site tools lab`, per identificatori esatti: **file toccati**. Vanno in conflitto con tutti: da eseguire con pochi task in corso, una per task, nell'ordine.

| # | Rinomina | File | Migrazione |
|---|---|---|---|
| R1 | Il `Building` di `layout.ts` → `Lot` (c'è già in `relief.ts`), `Chunk.buildings` → `lots`, `findBuildings`, `buildingAt` | 13 | no: sul filo è già `lotti`, e il layout li ricava dalla bozza a ogni caricamento |
| R2 | `Models` → `AiModels` (con `MockModels`, `GeminiModels`…), `kernel.models` → `kernel.ai` | 103 (70 sono test che costruiscono `MockModels`) | no; cambia `window.quine.models`, le note e AGENTS.md |
| R3 | `playerPos`, `playerCarpet`, `playerId`, `playerComp`, `playerMod`, `playerCell`, `playerText`, `playerPrompt` → `wanderer…` | 52 | no; **fermi** `world.player`, `world.player_pos`, `player_id`, `player_get`, `player_set` e il binding, che Lua vede |
| R4 | `Place` → `ChunkInfo`, `PlaceView` → `ChunkView` (il renderer ha già un `ChunkView`: va chiamato `TerrainView`), `GraphPlace`, `placeHere`, `placeByName`, `placesOf` | 15 (più i `place` locali, a mano) | no; **fermi** `plan.place` in `maps/`, `placesPerMinute`, `luoghi` del protocollo |
| R5 | `hand()`, `syncHand`, `inscribeHand`, `lastHand` → `phrase…` | ~20 | no se resta il componente `hand`; con il componente sì, dallo stato di ogni viandante e dal Lua: sconsigliato |
| R6 | `ThingView`, `THING_PARTS`, `things` → `EntityView`, `ENTITY_PARTS`, `entities`; `src/render/things.ts` → `entities.ts` | 72 (compresa la parola `thing` nei commenti) | no; **fermi** `cose` ed `entita` del protocollo |
| R7 | Italiano nel TypeScript: `AttoreConfig`, `AiMinimi`, `Eredita`, `sottoOf`, `titolareOf`, `sessionTetto`, `setSessionTetto` | 11 | no; **fermi** i campi omonimi nei file (`attore`, `minimi`, `eredita`, `sotto`, `titolare`, `tetto`) |
| R8 | `CardLedger` → `CardUses`, `UsageLedger` → `UsageLog` (`Ledger` resta dei saldi) | 12 | no |
| R9 | `Floor`, `floors`, `perFloor`, `nFloors` → `Storey…` | 26 | no |
| R10 | `gateCells`, `freeCells`, `runeCells`, `cellNear`, `propCells`, `playerCell`: le caselle → `…Tiles` (ogni variabile locale `cell`, a mano e dove serve) | 7 (più i locali) | no |
| R11 | `LayoutDef` → `EnvironmentDef`, `layoutsFor` → `environmentsFor` | 8 | no; **fermi** `layouts` nei manifest (25 file la leggono), `layout` nei piani |
| R12 | `TileDef` → `TerrainDef`, `TileLayer` → `TerrainLayer` | 12 | no; **fermi** `tiles` |
| R13 | Commenti: «game of many» → «multiplayer», `pocket` → `slot` | 25 + 13 | no: solo commenti, tranne poche variabili `pocket` |
| R14 | `AGENTS.md`: `chunk` → «luogo», `layout` → «ambiente» dove è l'ambiente | 1 | no: gli ADR non si toccano (scelta: sono storia) |
| R15 | Sito: «reame» → «universo» e `realm` → `universe` nel suo codice e CSS | 13, più 6 test | no; solo se la scelta dubbia 1 va così |
| — | API Lua: `world.player` → `world.wanderer` | 6 moduli del seme, ogni universo generato, prompt, validatore | **sì, e un alias per sempre: non lo propongo** |
| — | Valori di `AgentId`, nomi degli effetti, componenti in italiano | ovunque, compresi i dati | **sì: non lo propongo**, sono dati |
