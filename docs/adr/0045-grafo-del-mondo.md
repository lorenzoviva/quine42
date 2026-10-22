# ADR-0045 — Il grafo del mondo (nel kernel) e Graphify (per lo sviluppo)

Data: 2026-10-22 · Stato: accettato (task T07 del backlog; si attua in T12 e T13) · Segue ADR-0020 (società),
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
