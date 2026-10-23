# ADR-0045 — Il grafo del mondo (nel kernel) e Graphify (per lo sviluppo)

Data: 2026-10-22 · Stato: accettato (task T07 del backlog); attuato in T12 (23/10/2026), il contesto degli agenti in T13 (23/10/2026) · Segue ADR-0020 (società),
ADR-0021 (due repository), ADR-0023 (atlante), ADR-0024 (trame), ADR-0025 (due tavoli).

## Contesto
Le persone, i legami e le trame generati dal Concilio non tornano tra loro: in `valmora` (57 persone, 215 legami,
3 trame) 39 legami di parentela o di mestiere uniscono un gatto e un umano, 4 legami non sono simmetrici, uno
punta a una persona che non esiste, e ci sono famiglie di nomi quasi uguali (Elias il Cercatore, il Giovane, la
Rossa, il Vecchio, del Mulino; tre Elara attorno allo stesso gatto). Gli agenti ricevono riassunti generici e
inventano; nessuno controlla i riferimenti tra i file dell'universo. L'autore ha chiesto Graphify (to-do del
22/10/2026). Ci sono due usi diversi, da non confondere:

- **(a) sviluppo**: un grafo del repository per gli agenti che scrivono il codice;
- **(b) gioco**: un grafo dei contenuti dell'universo (persone, legami, luoghi, trame, oggetti, rune, regole,
  fatti) che il Concilio interroga per non inventare e che il kernel usa per trovare ciò che non torna.

**Graphify provato** (`graphifyy` 0.9.94, Apache-2.0, Python ≥ 3.10; in un ambiente isolato, su una copia di
`HEAD`, `GRAPHIFY_BACKEND=none`, `graphify update .`): 12 s, **0 token**, 257 file letti con tree-sitter →
3158 nodi, 7099 archi (90 % estratti, 10 % dedotti), 246 comunità; `graph.json` 2,7 MB, `graph.html` 2,9 MB,
`GRAPH_REPORT.md` (nodi centrali: `Kernel` 290 archi, `Id`, `main`, `Host`, `MockModels`, `Rng`…). Le chiamate
sono giuste e utili (`reviewFourthWall` → `metaBreak`, `readBible`, `recordRule`, `applyFiles`; `judgeFree` ←
`freeAction`, `freeItemAction`, `freeTileAction`). Limiti visti: i 100 programmi XML di MarkovJunior non sono
letti; i manifest JSON diventano alberi di chiavi (860 nodi di `universe/`, rumore); i documenti senza modello
sono solo titoli (la passata semantica su `docs/` chiede un modello: costa); un ADR citato nel codice è un nodo
diverso dall'ADR in `docs/adr/`; i nomi delle comunità restano «Community N» senza modello. Nel browser non
gira: per (b) non serve così com'è.

## Decisione
1. **(b) Un grafo nativo del kernel** (`src/kernel/graph.ts`, TypeScript puro, in Node e nel browser,
   deterministico, nessuna chiamata a modelli). Si costruisce dai file dell'universo (`world/people.json`,
   `plots.json`, `atlas.json`, `rules.json`, `bible.json`, `stato.json`, i manifest dei moduli, i pacchetti di
   oggetti, i piani in `maps/`) al caricamento e dopo ogni scrittura di quei file; va in **`world/grafo.json`**
   con ogni commit dell'universo (un file derivato: si può sempre ricostruire, e il kernel lo ricostruisce se
   manca o è vecchio).
   - **Nodi tipizzati** con id stabili `<tipo>:<slug>`: `persona` (con `specie`, `genere`, il tipo del modulo),
     `tipo` (modulo), `luogo` (chunk), `regione`, `ambiente`, `struttura`, `trama`, `oggetto`, `ricetta`, `runa`,
     `incantesimo`, `regola`, `fatto` (della bibbia).
   - **Archi tipizzati**: `legame` (con il nome del legame), `e_un` (persona → tipo), `abita`/`lavora` (dalla
     routine), `coinvolge` e `tappa` (trama → persona, luogo), `in_regione`, `contiene` (luogo → cosa),
     `ingrediente`, `riguarda` (regola → tipo, oggetto, terreno), `cita` (fatto → nodo nominato).
   - **Interrogazioni**: `find(nome)` (anche per nomi simili), `node(id)`, `neighbors(id, profondità, archi)`,
     `context(ids, budget)` (il testo compatto per un compito del Concilio, T13), `check()` (riferimenti verso
     nessuno, legami non simmetrici o impossibili per specie e genere, nomi quasi uguali, trame con persone o
     luoghi che non ci sono): lo usano il validatore della società e delle trame (T10, T11).
   - **Formato compatibile con Graphify** (node-link di NetworkX: `directed`, `multigraph`,
     `graph {schema_version}`, `nodes [{id, label, tipo, source_file…}]`, `links [{source, target, relation,
     confidence: "EXTRACTED", source_file}]`): `graphify explain|path|query --graph world/grafo.json` funziona, e
     il Nucleo della corona (T28) lo mostra navigabile.
   - Lua non lo vede (regola 1); se servirà, una lettura passerà da `Host`.
2. **(a) Graphify resta uno strumento facoltativo dello sviluppo**, fuori dal progetto: non è una dipendenza, non
   si installano la skill (`graphify install`), il server MCP né l'hook di git, `graphify-out/` è in
   `.gitignore`. Chi lo vuole lo lancia sul codice, offline (`GRAPHIFY_BACKEND=none`, comando in AGENTS.md).
   Non sostituisce `AGENTS.md` né la ricerca nel codice: il repository è piccolo e ben indicizzato da
   `Grep`; il grafo aiuta a vedere chi chiama chi nei file grandi (`kernel.ts`).

## Alternative scartate
- **Graphify sui file dell'universo**: Python (nessun browser, nessun kernel), dei JSON vede le chiavi e non il
  significato (una persona, un legame); per i testi chiede un modello a ogni ricostruzione.
- **Un database a grafo** (Neo4j, Kùzu in WebAssembly): poche migliaia di nodi stanno in memoria; un motore in
  più da caricare e da versionare, e non è testo nel repository git dell'universo.
- **Ricerca per somiglianza** (embedding, RAG): costa chiamate, dà testi vicini e non relazioni, non dice cosa
  è impossibile (un gatto padre di un uomo).
- **Restare ai riassunti**: è la causa delle incoerenze.

## Conseguenze
- Il Concilio riceve, per ogni compito, le persone coinvolte con i loro legami, il luogo, le trame aperte e il
  canone, invece dei riassunti (T13: meno token, misurati con il registro dei consumi).
- Il kernel trova da solo ciò che non torna e lo rimanda al Narratore con il motivo (regola 2), anche negli
  universi già generati.
- Un file in più nel commit dell'universo (stimato < 1 MB per un universo come `valmora`); lo scrive solo il
  kernel.
- Provare Graphify nelle sessioni di Claude Code richiede il permesso di eseguire codice esterno (in modalità
  automatica è bloccato): va concesso dall'autore.

## Attuazione (T12, 23/10/2026)
`src/kernel/graph.ts`: `buildGraph(files, places, speciesOf)` → `WorldGraph` con `node`, `find`, `edges`,
`neighbors`, `describe`, `context`, `check`, `counts`, `toJson`. Ciò che è cambiato rispetto alla decisione:
- **I luoghi** (i piani dei chunk) non sono nel testo dell'universo (`maps/` sta fuori dallo snapshot): il kernel
  ricorda i luoghi pianificati in questa sessione (`applyPlan`), all'avvio aggiunge quelli delle mappe su disco
  (`listMaps`: nome e ambiente) e ogni ricostruzione tiene i luoghi del `grafo.json` precedente (con le cose che
  contengono). Id `luogo:<cx>_<cy>`; i luoghi nominati dalla bibbia senza chunk sono `luogo:<nome>` (`dalla_bibbia`).
- **Il viandante** è un nodo (`persona:viandante`) con gli archi `porta` verso ciò che ha in tasca e nelle borse (da
  `stato.json`, solo l'inventario: la posizione cambia a ogni salvataggio e non tocca il grafo); i legami verso
  «Viandante» (il «verso nessuno» di `valmora`) puntano a lui.
- **Le persone attese** (nominate, mai incontrate) sono nodi `atteso`, della specie di chi le nomina.
- Archi in più: `produce` (ricetta → oggetto), `usa` (incantesimo → runa), `ambiente` (luogo, regione → ambiente),
  `porta`. I moduli `item` sono `oggetto`, gli altri moduli non di dati `tipo`.
- **Quando si riscrive**: prima di ogni commit (`Repo.beforeCommit`, come il registro dei consumi), solo se cambia
  l'hash di ciò di cui è fatto (persone, trame, atlante, regole, bibbia, manifest, luoghi, inventario, versione del
  costruttore `GRAPH_BUILD`). Una riga per nodo e per arco, per diff leggibili. `kernel.graph()` lo tiene in cache.
- `check()` dà: `riferimento` (legami, tipi, ricette, cose dei luoghi, regole e incantesimi verso nulla, raggruppati per
  ricetta e per luogo), `simmetria` (legami da un lato solo o che non si corrispondono), `impossibile` (specie,
  genere della parola), `nomi` (quasi uguali), `trama` (persone o tappe in luoghi che non ci sono, solo trame aperte).
  Il validatore della società e quello delle trame restano dove sono (T10, T11); il grafo li completa con i luoghi e
  i riferimenti tra file, e lo userà T13.

Misure: `valmora` (con i moduli del seme sotto) → 2 164 nodi (58 persone, 285 luoghi, 1 403 oggetti, 243 ricette…),
3 205 archi (215 legami), 54 ms per costruirlo, 11 ms per `check`, 930 KB; 74 riferimenti verso nulla (ricette con
oggetti inventati, `npc.custode` mai forgiato), 25 legami non simmetrici, 14 impossibili per specie (la specie dal tipo:
il registro di `valmora` non è ancora riparato), 50 coppie di nomi, 1 tappa in un luogo ignoto («Prato dell'Eco»).
`aurora`: 196 luoghi, 103 KB, nessuna incoerenza.

## Attuazione del contesto (T13, 23/10/2026)
- `CallOptions.focus` (id di nodi o nomi esatti, risolti da `WorldGraph.resolve`) e `WorldView.graph`. Con un focus che il
  grafo conosce, il Narratore riceve la testa della bibbia (titolo, tono, sintesi), il canone delle rune, le ultime 12 regole
  e il vicinato dei nodi (`context`, 2 800 caratteri) **in fondo** al system: ciò che viene prima è uguale per ogni compito
  con focus, e la cache lo serve. Senza focus, o se nessun nodo è noto, i riassunti di prima (Genesi, Fucina, pacchetti).
- `kernel.focusOn(cose, punto)`: le cose nominate e il luogo del punto (`luogo:<cx>_<cy>`). Il viandante no: la sua riga
  è l'elenco della borsa, già nei prompt che servono; chi gli è legato lo dice nella propria riga («rivale del viandante»).
- `context` non passa più per gli snodi (tipi, regioni, ambienti, oggetti, rune: portano a tutto) e non dà una riga alle
  foglie (oggetti, tipi, ambienti, strutture, rune, ricette), che sono nominate nelle righe di chi le ha.
- Compiti con focus: `npc.reply`, `npc.dialogue`, `npc.individuate`, `text.examine`, `text.read`, `action.judge`,
  `craft.free`, `craft.judge`, `spell.name`, `plot.weave`. L'Arbitro, il Cartografo e la Fucina restano come prima.

Misure (`tests/focus.test.ts`, su `valmora`, token stimati a 4 caratteri, passati dal registro dei consumi al prezzo di
`gemini-3.1-flash-lite`): `npc.reply` 5 818 → 3 310 token (−43 %), `plot.weave` 6 112 → 3 629 (−41 %); tolti bibbia
(1 290) e catalogo (1 969), aggiunti 70 + ~710 di grafo. Il resto (ruolo, principi, canone ≈ 2 300) è fisso e va in cache.
Nel browser (`aurora`, offline) il contesto del Narratore passa da 5 567 a 4 147 caratteri prima del focus. Non misurato
con chiamate vere a Gemini (costano): il registro dei consumi lo mostrerà nelle prossime partite.
