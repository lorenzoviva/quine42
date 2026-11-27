# ADR-0268 — La copertura dei terreni, aperta a mondo acceso

- **Stato**: accettato
- **Data**: 2026-11-27
- **Task**: T545 (C1 di [`docs/design/terreno-ricco.md`](../design/terreno-ricco.md), § 2 e § 7; D1 A e D2 A di [`docs/pipeline/domande/T509.md`](../pipeline/domande/T509.md))
- **Estende**: ADR-0037 (un programma per tipo, le istanze sono semi), ADR-0224 (i terreni come dati), ADR-0242 (la mesh dei luoghi in un
  worker), ADR-0267 (la grana del suolo: ciò che giace piatto)

## Contesto

Sulla terra che si cammina non cresce niente: il renderer mette i modelli solo sulle caselle di bosco e di roccia, e lo studio di T509 ha
misurato la terra nuda al 99-100 % della terra che si cammina in ogni universo. Lo studio propone **la copertura dei terreni**: modelli piccoli
(un ciuffo d'erba, sassolini, un arbusto basso, spighe), un programma per tipo e molti semi, sparsi a istanze con un hash come gli alberi del
bosco; misurata nel browser fino a quattro istanze per casella con una InstancedMesh per forma sulla finestra e senza ombre, la GPU resta
dov'era. L'autore l'ha approvata (D1 A, D2 A) e ha chiesto in più che il kernel resti **aperto**: a mondo acceso deve sempre poter esserci un
tipo di copertura in più, e un oggetto in più sul terreno («cercare la chiave sotto un sasso»).

## Decisione

1. **Un campo del terreno**, `TerrainDef.cover = [{ model, density }]`: al più tre tipi (`COVER_LIMITS.kinds`), ognuno l'id di un programma di
   `models/` e quante istanze stanno su una casella in media, 0-4 a passi di 0,05 (`COVER_LIMITS`). Si legge senza fidarsi (`readCover`,
   `src/kernel/cover.ts`, puro e leggero: lo importa il worker del terreno): il primo di un programma, i tipi oltre il terzo e quelli a 0 fuori;
   un elenco vuoto dice «niente». Cresce solo sulla terra che si cammina (`coversGround`: `layer: ground`, non solida). Il validatore dei
   manifest la vuole nei tetti (`coverErrors`).
2. **Una classe nuova, `cover`** (`src/mj/classes.ts`): la scatola del sasso (0,5 × 0,5 × 0,4 caselle a 20 voxel), piegata dal vento, quattro
   semi (`classSeeds`); è del Paesaggista (`CLASS_SPECIALTY`), la Fucina non la offre (`FORGE_CLASSES`). Il seme ha quattro programmi della
   classe, quelli scritti a mano nel laboratorio di T509 (`cover-tuft`, `cover-shrub`, `cover-wheat`, `cover-stones`), e la dà al prato,
   alla sabbia, al campo seminato, al grano maturo e alla ceppaia: **il seme cambia aspetto**, e con lui `aurora` e ogni universo con la
   tavolozza del seme (la trappola 1 di T432, voluta); l'impronta delle mesh (`lab/scripts/impronta-terreno.ts`) cambia per questo.
3. **Lo spargimento con l'hash**, nel worker del terreno (`chunkArrays`, `terrainmesh.ts`): per ogni casella e ogni tipo il numero di istanze
   (`coverCount`: l'intero della densità e una in più dove l'hash della casella cade sotto la frazione) e, per ognuna, il punto dentro la
   casella, il verso, la scala e il seme (`coverInstance`), dalla casella, dal nome del programma e dal numero soltanto: un tipo in più o una
   densità diversa non spostano le altre; ogni client vede le stesse istanze, niente va sul filo né nello stato. **Mai** dove il kernel dice
   che non cresce niente (`Kernel.coverMask`): i sentieri che il kernel scava (e i varchi, che sono sentieri), i lotti delle strutture e del
   blocco (le porte, i pavimenti), le buche sopra una cantina, e dove sta una cosa solida ferma (il mezzo della casella o un suo quarto sotto
   l'impronta; non le persone, gli animali, i veicoli, che si muovono). La maschera viaggia nella copia del worker (`ChunkInput.bare`), la
   firma del luogo (`chunkSig`) tiene le cose solide ferme che vi stanno (`coverStamp`, fatto con i solidi a ogni tick) e quali programmi della
   copertura sono pronti. Gli array tornano col luogo (`ChunkArrays.cover`: le forme, quale forma è ogni istanza, cinque numeri a istanza).
4. **Una InstancedMesh per forma sulla finestra**, non per luogo (`CoverLayer`, `src/render/cover.ts`): le draw call non crescono coi luoghi;
   **senza ombre** (un ciuffo non fa un'ombra che si legga dall'alto, e la passata delle ombre ridisegnerebbe ogni istanza), col materiale che
   si piega col vento e l'inchiostro degli alberi. **Il tetto**: al più `COVER_CAP` (20 000) istanze sulla finestra, i luoghi più vicini al
   viandante interi, quello che lo passerebbe diradato in modo uniforme (`coverBudget`, `keptOf`), i più lontani nudi. Lo strato si rifà solo
   quando la copertura di un luogo cambia (un luogo rifatto, caricato o andato) o, col tetto che dirada, quando il viandante cambia luogo.
5. **Aperta a mondo acceso, un tipo in più** (D1 dell'autore): la copertura di un terreno si cambia con `Kernel.setCover(code, kinds)` (un tipo
   in più, un'altra densità, uno in meno, nessuno), entro i tetti, solo sulla terra che si cammina, ogni programma uno che la libreria ha
   **della classe `cover`**; un commit del Concilio sul manifest dei terreni (`councilMayWrite`); i luoghi si ridisegnano al ricaricare dei
   file. In una partita di molti solo il master, mai su un universo che si legge soltanto, **mai da Lua** (la copertura è l'aspetto del
   terreno, non lo stato). Chi la chiede:
   - **il Referente**: l'incarico `cover` («più erba sul prato», «sassolini sulla sabbia») va **al Cartografo** (`terrain.cover`,
     `src/kernel/agents/cover.ts`), che risponde la copertura intera del terreno fra i programmi della classe che la libreria ha; ciò che il
     kernel rifiuta torna una volta col motivo, ciò che resta rifiutato è una mancanza (ADR-0130). Una riga del censimento con la manopola
     `studio`. Una copertura che la libreria non ha non si inventa qui: è un rifiuto, e i programmi nuovi li scolpisce il Paesaggista (C2);
   - **il Cartografo** stesso, quando la Genesi sceglierà la copertura dei terreni dal nome e dalla descrizione (C2), con lo stesso campo e gli
     stessi tetti.
6. **Aperta a mondo acceso, un oggetto in più** (D1 dell'autore: «la chiave sotto il sasso»): una singola istanza diventa **una cosa del
   mondo** con `Kernel.uncover(x, y, module, which?)`: delle istanze della casella (`coverAt`) quella detta (programma e numero) o la più
   vicina al punto; la cosa è un'entità del modulo dato (`kind: entity`), posata dal kernel **nel punto dell'istanza col suo aspetto** (il
   programma, il seme, il verso; mai il modello del suo modulo, che mostrerebbe un'altra cosa dove stava il sasso), col componente `cover`.
   Si scrive **nel piano del suo luogo** (`ChunkPlan.uncovered`: la casella, il programma, il numero, il modulo, il seme; al più
   `MAX_UNCOVERED`, 24, a luogo; letto con `readUncovered`), come gli scavi: a ogni caricamento il kernel la rimette lì (origine
   `<luogo>#u<casella>.<programma>.<n>`, presa una volta è consumata come ogni cosa di un luogo) e l'istanza non si disegna più come copertura.
   Ai client sottili arrivano solo le chiavi (`ChunkView.uncovered`, `uncoveredKey`, lette senza fidarsi con `readUncoveredKeys`), mai la
   copertura. Chi lo fa:
   - **Lua**: `world.cover_at(x, y)` (le istanze della casella, copie `{model, n, x, y}`, sola lettura) e `world.uncover(x, y, module, model,
     n)` (l'id della cosa nuova, o nil; mai su uno specchio): l'Ingegnere scrive «cerca sotto i sassi» come un `on_act` che fa del sasso una
     cosa il cui `on_act` dà la chiave. Una volta, quando succede qualcosa: mai in `update`;
   - **il Cartografo**, quando un piano metterà una cosa da trovare «sotto la copertura» (un posto del piano come `enclave`, ADR-0250), e il
     **Referente**, quando un membro del Concilio chiederà di nascondere qualcosa in un luogo: tutti e due passano da `uncover`, e il kernel
     posa la cosa; lo schema dei loro piani e incarichi è il lavoro dopo (C2), il kernel è già pronto.
7. **Solo aspetto**, tranne le cose promosse: la copertura non è nello stato, nei piani, sul filo né in Lua (che la legge soltanto); non
   blocca, non si raccoglie. Raccogliere l'erba sarà un'azione del terreno, non della copertura.

## Conseguenze

- Il prato del seme è un prato; i campi di grano hanno le spighe. Gli universi del Concilio di prima non cambiano finché i loro terreni non
  dicono una copertura (la riparazione dal nome senza chiamate, D6, è di C2).
- Costa nel worker lo spargimento (qualche decimo di ms a luogo) e sulla pagina lo strato, rifatto solo quando cambia; le draw call crescono
  di una per forma in ogni passata, qualunque sia il numero di luoghi. Le misure del frame sono nell'esito di T545 e in
  `docs/catture/T545/`.
- Una cosa solida ferma che si sposta rifà la mesh del suo luogo (la sua firma cambia), come un luogo il cui terreno cambia.
- Kernel 0.10.43: il campo e la classe sono aggiuntivi; un universo di prima si apre e si disegna come prima finché i suoi terreni non dicono
  `cover` (il seme sì).
