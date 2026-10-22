# ADR-0032 — Laboratorio voxel: scala unica, fotogrammi dal modello, strutture a blocchi

Data: 2026-10-21 · Stato: sperimentale (fuori dal gioco); estende ADR-0031

## Contesto
Dopo i primi risultati del laboratorio voxel (ADR-0031) l'autore chiede ([`docs/userchats/step8B.md`](../userchats/step8B.md)):
griglie più grandi ma con proporzioni coerenti tra asset simili, partendo dalle persone per fissare la
dimensione del voxel; un terzo strato per le strutture su più caselle (blocchi con lati che combaciano,
composti da un secondo agente, riconosciuti dal gioco e interattivi); tutti i fotogrammi delle entità
(camminate, vento, ombre); e una prova dei programmi scritti da Claude Code.

## Decisione
- **Scala** (`lab/mj3d/scale.ts`): 20 voxel per casella, scelti con uno studio sulle persone (sotto i 24
  voxel di altezza il viso non si legge). Ogni classe di asset ha una scatola fissa in caselle e un'altezza
  minima; il kernel impone la scatola alla `size` dello Scultore. Griglie fino a 64 per lato.
- **Fotogrammi** (`lab/mj3d/animate.ts`): il palette può marcare le parti (`part`: gamba, braccio, testa,
  coda); il kernel ne ricava la camminata ruotando gli arti attorno all'attacco (senza parti: gambe
  indovinate), nel formato del gioco (`down left right up` × 3); vento per la vegetazione; ombra proiettata
  lungo un sole che si muove (`render.ts → DAY`).
- **Strutture a blocchi** (`lab/mj3d/structure.ts`, `architect.ts`): blocchi di una casella per un livello
  con prese su sei lati, `walk` e azioni verso altri blocchi; lo Scultore dei blocchi li scrive, l'Architetto
  li compone con MarkovJunior a livello di blocchi (codice = blocco + rotazione) più un WFC opzionale. Il
  kernel controlla le prese di ogni coppia che si tocca e i voxel delle facce (contenimento della faccia più
  piccola nell'altra), espande in voxel e produce la mappa delle caselle.
- Le richieste a Gemini del laboratorio hanno un timeout (4 minuti) passato a `GeminiModels`: il kernel
  non ne ha, e nelle prove una richiesta è rimasta appesa.

## Conseguenze
- Nessuna sul gioco: tutto resta in `lab/`. Per l'integrazione: le classi diventano la scala degli sprite,
  i fotogrammi voxel i `frames` dell'ArtDirector, le strutture a blocchi luoghi a più caselle e livelli, i
  blocchi con azioni caselle interattive.
- Da correggere nel kernel: un timeout in `src/kernel/ai/gemini.ts`.
