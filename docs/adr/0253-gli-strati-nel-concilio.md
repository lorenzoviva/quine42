# ADR-0253 — Gli strati nel Concilio

Stato: accettato · Data: 2026-11-23 · Task: T479 (S2, riga 6 di T459) · Estende ADR-0091, ADR-0214, ADR-0215, ADR-0239, ADR-0249 · Kernel: 0.10.29

## Contesto

Con T418 (ADR-0091 punto 5) e T478 (ADR-0249) ogni luogo pianificato ha i suoi strati sotto il suolo (6 righe nei piani nuovi dal programma MarkovJunior 3D dell'ambiente, 4 righe di bozza nei piani di prima, con falda, vena e radici nel seme e gli strati del mondo alla Genesi). Finora però gli strati erano solo una vista nei tagli del sottosuolo: né Lua, né il Narratore, né lo Scultore Architetto, né lo Scenografo li leggevano.

Lo studio di T459 (`docs/design/terreno-3d.md` § 4.2 e § 7 riga 6) prevede il secondo passo (S2): portare gli strati nei quattro punti del Concilio e del gioco che li usano per farne meccaniche, storie, architetture e interni coerenti col sottosuolo vero del luogo.

## Decisione

1. **API Lua `world.stratum_at(x, y, depth)` (sola lettura)**:
   - Esposta attraverso `Host.stratum_at` (`src/kernel/sandbox.ts`), `prelude.lua`, `LUA_API.world` (`src/kernel/validator.ts`), il prompt dell'Ingegnere (`universe/prompts/agents/engineer.md`) e `AGENTS.md`.
   - `Kernel.stratumInfoAt(x, y, depth?)` valida che le coordinate siano numeri finiti (e `depth` se dato, predefinito `0`, in caselle sotto il suolo, chiuso fra `0` e l'ultima riga del luogo da `stratumRow`), non genera mai luoghi (restituisce `undefined` / `nil` fuori dai luoghi caricati) e restituisce una copia nuova `{ code, id?, name, description?, color }` (regole 1 e 7).
   - Un pozzo può cercare `id == "aquifer"` (la falda), una miniera `id == "ore"` (la vena), una cava l'argilla o uno strato della Genesi (per `code` o `name` se non ha `id`).
   - Il contesto dell'Ingegnere (`Council.context('engineer')`) riceve la lista compatta degli strati del mondo (`strataSummary`, da `WorldView.strata`).

2. **Contesto del Narratore (grafo / `focus` e `worldFacts`)**:
   - `summarizePlaceStrata(rows, strata, max = 4)` (`src/kernel/strata.ts`) estrae fino a quattro nomi di strati (nella lingua del mondo) presenti sotto un luogo, dando sempre precedenza agli strati non di bozza (`falda`, `vena`, `radici`, strati della Genesi senza ruolo di bozza) e ordinandoli dalla superficie in giù.
   - `GraphChunk.strata` entra nei nodi `chunk` del grafo del mondo (`src/kernel/graph.ts`, `GRAPH_BUILD` 4 → 5, conservato in `chunksOf` nel file `world/graph.json`): `WorldGraph.describe` aggiunge `; sotto <strati>` solo quando presente (i nodi di prima restano invariati). Così ogni compito focalizzato del Narratore (`npc.reply`, `npc.dialogue`, `npc.individuate`, `action.judge`, `narrate`, `examine`, `weavePlot`) riceve cosa giace sotto il luogo.
   - `Kernel.worldFacts()` porta `sotto` del luogo corrente; il contesto non focalizzato del Narratore (`Council.context('narrator', false)`) porta `## Strata under the ground` (`strataSummary`) per mestieri, leggende e oggetti del mondo.

3. **Richiesta dello Scultore Architetto (`SculptRequest.strata`, `part-cellar`)**:
   - `sampleLotStrata` (`src/kernel/strata.ts`) misura gli strati riga per riga sotto la scatola del lotto (strato dominante + eventuali strati notevoli come falda o vena presenti sulla stessa riga).
   - `Kernel.lotStrataAt`, `ModelDirector.missing()` e la rigenerazione (`src/kernel/regenerate.ts`) allegano `strata?: LotStratum[]` a `SculptRequest`.
   - `strataLine` in `src/kernel/agents/sculptor.ts` compatta le righe uguali in intervalli di profondità in caselle con nomi, colori e descrizioni, e — quando la struttura ha una cantina (`req.cellar`) — chiede all'Architetto di accordare colori e materiali dei muri (`V`) e del pavimento (`D`) di `part-cellar` allo strato in cui scende e di posare le fondamenta sulla roccia viva (senza cantina, di posare zoccolo e fondamenta sul terreno sotto il lotto). Il testo sta nella richiesta e non allarga `prompts/agents/sculptor/architect.md` (che resta entro `STRUCTURES_PROMPT_CHARS`).

4. **Stanze dello Scenografo per strato (`interior.design`, `furnish.ts`, `forms.ts`)**:
   - `InteriorRule` acquista `stratum?: string` (chiave canonica `stratumKey(def, code)`: `def.id` se presente, altrimenti lo slug ASCII del nome): valida solo per `room: 'cellar'` (`readRules` promuove a `cellar` una regola con `stratum` senza `room`/`storey` e ignora `stratum` sui piani fuori terra e il jolly `'*'`).
   - `ruleFor` abbina una regola con `stratum` solo a una stanza `cellar` scavata in quello strato (`sameStratum`); una regola `{ room: 'cellar' }` senza `stratum` resta il ripiego per ogni altro strato (prima le regole specifiche, poi il ripiego).
   - `InteriorDesignRequest.strata?: StratumOption[]`, `interiorSchema(ids, strataKeys)` e `describeBuilding` offrono gli strati del mondo allo Scenografo solo quando l'edificio ha una cantina (segnalando con `[under this building]` lo strato sotto le istanze caricate, raccolto in `InteriorDirector.make`). `prompts/agents/scenographer.md` documenta il campo `stratum`; `MockAiModels` risponde offline con botti nell'argilla e scaffali/rastrelliere nella roccia viva prima del ripiego generale (e resta invariato quando `strata` non è passato).
   - `Kernel.cellarStratumAt` (`dominantCellarStratum` alla profondità `Math.max(1, Math.floor(cellarTiles))`, così una cantina di 1 casella a 16 vpt = 1,25 caselle legge la riga 1 dove stanno argilla, falda, radici o roccia viva) scrive `FormComp.stratum` sulle strutture con cantina (`settleLots`, `spawnPlannedHouse`, `applyFiles`).
   - `Forms` (`src/kernel/forms.ts`) usa `stratum` (`effectiveStratum`) **solo** quando l'interno del modello ha almeno una regola per strato (`hasStratumRules`): un edificio senza regole per strato tiene una sola forma in cache e lo stesso `interiorText` di prima; uno con regole per strato mette in cache una forma distinta per `(model, seed, stratum)`.
   - In multigiocatore `FormView.stratum` entra nell'elenco esplicito di `SessionServer.formOf` (`src/session/protocol.ts`, `src/session/server.ts`), così lo specchio del client disegna gli stessi mobili della cantina del server.

## Conseguenze

- **Aggiuntivo, nessun cambio di contratto** (`0.10.28` → `0.10.29`): i piani, i modelli e gli interni di prima restano validi senza migrazioni; un edificio senza regole `stratum` non crea voci di cache in più.
- **Sicurezza**: nessuna superficie nuova. `world.stratum_at` è in sola lettura, non genera luoghi e restituisce sempre una copia nuova; `FormView.stratum` porta solo la chiave dello strato sotto un edificio visibile (il client riceve già `ChunkView.strata`).
- **Coerenza offline e online**: la stessa catena gira offline nei test (`tests/strata-council.test.ts`) e online con Gemini/OpenRouter.

## Alternative scartate

- **Un `InteriorSpec` per luogo anziché per tipo di edificio**: violerebbe la regola 11 e ADR-0214 (lo Scenografo si chiama una volta per tipo di edificio). Mettere `stratum` come selettore di `InteriorRule` lascia una sola chiamata per tipo e fa differire le cantine dello stesso tipo di edificio fra un borgo sull'argilla e un avamposto sulla roccia senza altre chiamate ai modelli.
- **Aggiungere istruzioni sugli strati dentro `architect.md`**: il prompt dell'Architetto ha solo 22 caratteri sotto il tetto `STRUCTURES_PROMPT_CHARS`; metterle nella richiesta (`strataLine`, come T417 per `cellarLine`) le manda solo quando i dati del lotto ci sono e lascia intatto il prefisso in cache.
